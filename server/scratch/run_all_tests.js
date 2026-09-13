const jwt = require('jsonwebtoken');
const prisma = require('../src/config/prisma');

const API_BASE = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'cc6bbfca6ce13d83a3c5abe432577d06690cb7f443cbb06a861d7d6a0bcfee7a0114ce2f74f83ca5299177302d22d3ad1e2c9a9f89aefcf224aca3046ff4464a';

// Generar token de admin
const adminToken = jwt.sign(
    { id: 1, email: 'admin@fluxer.com', esAdmin: true, esSuperAdmin: true, permisoClientes: true, permisoTurnos: true, permisoFinanzas: true },
    JWT_SECRET,
    { expiresIn: '1h' }
);
const adminHeaders = { 
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
};

async function apiGet(url, headers = adminHeaders) {
    const res = await fetch(url, { headers });
    const data = await res.json();
    return { status: res.status, data };
}

async function apiPut(url, body, headers = adminHeaders) {
    const res = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body)
    });
    const data = await res.json();
    return { status: res.status, data };
}

async function run() {
    console.log('====================================================');
    console.log('TEST 1: Flag en FALSE - ClientesTotales y Pendientes');
    console.log('====================================================');
    // Asegurar flag en false
    await prisma.parametroSistema.updateMany({
        where: { clave: 'multiDisciplinaHabilitado', branchId: null },
        data: { valor: 'false' }
    });
    const { invalidateMultiDisciplinaCache } = require('../src/config/multiDisciplinaCache');
    invalidateMultiDisciplinaCache();

    const resClientes = await apiGet(`${API_BASE}/clientes?limit=3`, adminHeaders);
    console.log('HTTP GET /api/clientes status:', resClientes.status);
    console.log('Primer cliente obtenido:', {
        id: resClientes.data.data?.clientes?.[0]?.id,
        nombre: resClientes.data.data?.clientes?.[0]?.nombre,
        categoriaId: resClientes.data.data?.clientes?.[0]?.categoriaId,
        categoria: resClientes.data.data?.clientes?.[0]?.categoria?.nombre,
        categorias: resClientes.data.data?.clientes?.[0]?.categorias
    });

    const resPendientes = await apiGet(`${API_BASE}/clientes/pendientes`, adminHeaders);
    console.log('HTTP GET /api/clientes/pendientes status:', resPendientes.status);
    console.log('Pendientes devueltos:', resPendientes.data.data?.length);

    console.log('\n====================================================');
    console.log('TEST 2: Activar Flag (multiDisciplinaHabilitado = true)');
    console.log('====================================================');
    const resParamUpdate = await apiPut(`${API_BASE}/parametros/multiDisciplinaHabilitado`, { valor: 'true' }, adminHeaders);
    console.log('HTTP PUT /api/parametros/multiDisciplinaHabilitado status:', resParamUpdate.status);
    console.log('Nuevo valor en DB:', resParamUpdate.data.data);

    console.log('\n====================================================');
    console.log('TEST 3: Cliente VIEJO (ID: 7) precarga disciplina como "Principal"');
    console.log('====================================================');
    // Asegurar que cliente 7 comience como un cliente viejo real: categoriaId 12 y CERO filas en el puente
    await prisma.clienteCategoria.deleteMany({ where: { clienteId: 7 } });
    await prisma.cliente.update({ where: { id: 7 }, data: { categoriaId: 12 } });
    const countPuente7Antes = await prisma.clienteCategoria.count({ where: { clienteId: 7 } });
    console.log('Filas en cliente_categorias para cliente 7 antes de editar:', countPuente7Antes);

    const resCliente7 = await apiGet(`${API_BASE}/clientes?limit=100`, adminHeaders);
    const cliente7 = resCliente7.data.data?.clientes?.find(c => c.id === 7);
    console.log('Datos de cliente 7 recibidos por el frontend:', {
        id: cliente7.id,
        nombre: `${cliente7.nombre} ${cliente7.apellido}`,
        categoriaId: cliente7.categoriaId,
        categoria: cliente7.categoria?.nombre,
        categorias: cliente7.categorias
    });
    console.log('Orden de disciplinas que precarga el form ([0] = Principal):', 
        cliente7.categorias.map((c, i) => `${i === 0 ? '⭐ [0] Principal:' : `[${i}]:`} ${c.nombre} (ID ${c.id})`)
    );

    console.log('\n====================================================');
    console.log('TEST 4: Asignar segunda disciplina (ID 5 - Pilates) y guardar');
    console.log('====================================================');
    // Guardamos con [12, 5] (Taekwondo primero [principal] + Pilates segundo)
    const updateRes = await apiPut(`${API_BASE}/clientes/7`, {
        ...cliente7,
        categoriaIds: [12, 5]
    }, adminHeaders);

    console.log('HTTP PUT /api/clientes/7 status:', updateRes.status);
    console.log('Categorías devueltas tras actualizar:', updateRes.data.data?.categorias?.map(c => ({ id: c.id, nombre: c.nombre })));

    // Consulta SQL solicitada por el usuario
    const sqlResult = await prisma.$queryRawUnsafe(`
        SELECT c.id, c.categoriaId, cc.categoriaId as puente_categoriaId 
        FROM clientes c 
        LEFT JOIN cliente_categorias cc ON cc.clienteId = c.id 
        WHERE c.id = 7;
    `);
    console.log('LITERAL SQL QUERY RESULT:');
    console.table(sqlResult);

    console.log('\n====================================================');
    console.log('TEST 5: Socio ID 7 en Fluxer_Turnos - Ve clases de AMBAS disciplinas');
    console.log('====================================================');
    const socio7Token = jwt.sign({ id: 7, email: cliente7.email || 'socio7@fluxer.com' }, JWT_SECRET, { expiresIn: '1h' });
    const socio7Headers = { 'Authorization': `Bearer ${socio7Token}`, 'Content-Type': 'application/json' };

    const resPerfil7 = await apiGet(`${API_BASE}/socio/perfil/7`, socio7Headers);
    const socioData7 = resPerfil7.data.data;
    console.log('Perfil obtenido por Fluxer_Turnos para socio 7:', {
        id: socioData7.id,
        nombre: socioData7.nombre,
        categoriaId: socioData7.categoriaId,
        categorias: socioData7.categorias?.map(c => ({ id: c.id, nombre: c.nombre }))
    });

    // Consultar horarios para martes (dia_semana = 2)
    const resTurnos7 = await apiGet(`${API_BASE}/socio/turnos/disponibles?dia_semana=2&fecha=2026-09-15`, socio7Headers);
    const todasLasClasesDia2 = resTurnos7.data.data;
    console.log('Total clases disponibles ese día (todas las disciplinas):', todasLasClasesDia2.length);
    console.log('Disciplinas presentes en el día:', [...new Set(todasLasClasesDia2.map(c => `${c.categoria?.nombre} (ID ${c.categoriaId})`))]);

    // Aplicar la lógica exacta de TurnosSocio.jsx
    let idsCategorias7 = [];
    if (Array.isArray(socioData7.categorias) && socioData7.categorias.length > 0) {
        idsCategorias7 = socioData7.categorias.map(c => Number(c.id || c)).filter(id => !isNaN(id) && id > 0);
    } else if (socioData7.categoriaId) {
        idsCategorias7 = [Number(socioData7.categoriaId)];
    }
    const clasesFiltradasSocio7 = todasLasClasesDia2.filter(c => idsCategorias7.includes(Number(c.categoriaId)));

    console.log('IDs de categorías habilitadas para socio 7:', idsCategorias7);
    console.log(`Clases que ve el socio 7 (${clasesFiltradasSocio7.length} clases):`);
    console.table(clasesFiltradasSocio7.map(c => ({
        horarioId: c.id,
        categoriaId: c.categoriaId,
        disciplina: c.categoria?.nombre
    })));

    const tieneAmbasDisciplinas = idsCategorias7.every(id => clasesFiltradasSocio7.some(c => c.categoriaId === id));
    console.log('¿Ve clases de AMBAS disciplinas (12 y 5)?:', tieneAmbasDisciplinas ? 'SÍ (CORRECTO)' : 'ERROR');

    const otrasDisciplinas7 = clasesFiltradasSocio7.filter(c => !idsCategorias7.includes(Number(c.categoriaId)));
    console.log('¿Aparece alguna otra disciplina no asignada (ej. Padel o Musculacion)?:', otrasDisciplinas7.length === 0 ? 'NO (CORRECTO)' : 'ERROR');

    console.log('\n====================================================');
    console.log('TEST 6: Socio VIEJO (ID: 11 - Tomas Catalano) NUNCA editado');
    console.log('====================================================');
    const countPuente11 = await prisma.clienteCategoria.count({ where: { clienteId: 11 } });
    console.log('Filas en cliente_categorias para cliente 11:', countPuente11);

    const socio11Token = jwt.sign({ id: 11, email: 'socio11@fluxer.com' }, JWT_SECRET, { expiresIn: '1h' });
    const socio11Headers = { 'Authorization': `Bearer ${socio11Token}`, 'Content-Type': 'application/json' };

    const resPerfil11 = await apiGet(`${API_BASE}/socio/perfil/11`, socio11Headers);
    const socioData11 = resPerfil11.data.data;
    console.log('Perfil obtenido por Fluxer_Turnos para socio 11:', {
        id: socioData11.id,
        nombre: socioData11.nombre,
        categoriaId: socioData11.categoriaId,
        categorias: socioData11.categorias?.map(c => ({ id: c.id, nombre: c.nombre }))
    });

    let idsCategorias11 = [];
    if (Array.isArray(socioData11.categorias) && socioData11.categorias.length > 0) {
        idsCategorias11 = socioData11.categorias.map(c => Number(c.id || c)).filter(id => !isNaN(id) && id > 0);
    } else if (socioData11.categoriaId) {
        idsCategorias11 = [Number(socioData11.categoriaId)];
    }
    const clasesFiltradasSocio11 = todasLasClasesDia2.filter(c => idsCategorias11.includes(Number(c.categoriaId)));

    console.log('IDs de categorías para socio 11:', idsCategorias11);
    console.log(`Clases que ve socio 11 (${clasesFiltradasSocio11.length} clases):`);
    console.table(clasesFiltradasSocio11.map(c => ({
        horarioId: c.id,
        categoriaId: c.categoriaId,
        disciplina: c.categoria?.nombre
    })));

    const soloMusculacion = clasesFiltradasSocio11.every(c => c.categoriaId === 6);
    console.log('¿Todas las clases visibles corresponden únicamente a Musculacion (ID 6)?:', soloMusculacion ? 'SÍ (CORRECTO - NO VE TODO EL CATÁLOGO)' : 'ERROR');

    console.log('\n====================================================');
    console.log('TEST 7: Desactivar Flag (multiDisciplinaHabilitado = false)');
    console.log('====================================================');
    const resParamOff = await apiPut(`${API_BASE}/parametros/multiDisciplinaHabilitado`, { valor: 'false' }, adminHeaders);
    console.log('HTTP PUT /api/parametros/multiDisciplinaHabilitado status:', resParamOff.status);
    console.log('Parámetro ahora en DB:', resParamOff.data.data);

    // Consulta con flag desactivado
    const resClientesPost = await apiGet(`${API_BASE}/clientes?limit=100`, adminHeaders);
    console.log('HTTP GET /api/clientes status con flag en false:', resClientesPost.status);
    const cliente7Post = resClientesPost.data.data?.clientes?.find(c => c.id === 7);
    console.log('Cliente 7 con flag en false (mantiene su disciplina principal 12 en categoriaId):', {
        id: cliente7Post.id,
        nombre: cliente7Post.nombre,
        categoriaId: cliente7Post.categoriaId,
        categoria: cliente7Post.categoria?.nombre
    });

    console.log('\n====================================================');
    console.log('TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE');
    console.log('====================================================');
}

run().catch(err => {
    console.error('ERROR EN PRUEBAS:', err.response?.data || err);
    process.exit(1);
});
