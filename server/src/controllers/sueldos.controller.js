const prisma = require('../config/prisma');

const normalizeText = (text) => {
    if (!text) return "";
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

const getSueldos = async (req, res) => {
    try {
        const config = await prisma.configuracion.findFirst();
        const profesoresPorTurno = config ? config.profesoresPorTurno : false;

        const profesionales = await prisma.profesional.findMany({
            where: { activo: true }
        });

        const horariosActivos = await prisma.horarioConfig.findMany({
            where: { activo: true },
            include: { 
                categoria: true, 
                profesional: true 
            }
        });

        const categoriasAmbiguas = [];

        const sueldosMap = new Map();
        profesionales.forEach(p => {
            sueldosMap.set(p.id, {
                id: p.id,
                nombre: p.nombre,
                apellido: p.apellido,
                clasesSemanales: 0,
                tarifaPorClase: p.tarifaPorClase || 0,
                sueldoMensual: 0,
                especialidadesSet: new Set()
            });
        });

        if (profesoresPorTurno) {
            horariosActivos.forEach(horario => {
                if (horario.profesionalId && sueldosMap.has(horario.profesionalId)) {
                    const profData = sueldosMap.get(horario.profesionalId);
                    profData.clasesSemanales += 1;
                    if (horario.categoria && horario.categoria.nombre) {
                        profData.especialidadesSet.add(horario.categoria.nombre);
                    }
                }
            });
        } else {
            const categoryMatchMemo = new Map();

            horariosActivos.forEach(horario => {
                if (!horario.categoria || !horario.categoria.nombre) return;
                
                const catName = horario.categoria.nombre;
                let matchData = categoryMatchMemo.get(catName);
                
                if (!matchData) {
                    const lastDash = catName.lastIndexOf('-');
                    if (lastDash === -1) {
                        // Sin guión: no se puede extraer profesional, ignorar
                        matchData = { matchedProfId: null, isAmbiguous: false };
                    } else {
                        const profPartNorm = normalizeText(catName.substring(lastDash + 1));

                        const matchedProfs = profesionales.filter(p => {
                            const nombreNorm = normalizeText(p.nombre);
                            const apellidoNorm = normalizeText(p.apellido);
                            // Excluir profesionales sin nombre ni apellido válidos
                            if (!nombreNorm && !apellidoNorm) return false;
                            return (nombreNorm && nombreNorm.includes(profPartNorm)) ||
                                   (apellidoNorm && apellidoNorm.includes(profPartNorm));
                        });

                        if (matchedProfs.length === 1) {
                            matchData = { matchedProfId: matchedProfs[0].id, isAmbiguous: false };
                        } else if (matchedProfs.length > 1) {
                            matchData = { matchedProfId: null, isAmbiguous: true };
                            if (!categoriasAmbiguas.includes(catName)) {
                                categoriasAmbiguas.push(catName);
                            }
                        } else {
                            matchData = { matchedProfId: null, isAmbiguous: false };
                        }
                    }
                    categoryMatchMemo.set(catName, matchData);
                }

                if (matchData.matchedProfId && sueldosMap.has(matchData.matchedProfId)) {
                    const profData = sueldosMap.get(matchData.matchedProfId);
                    profData.clasesSemanales += 1;
                    profData.especialidadesSet.add(catName);
                }
            });
        }

        const dataSueldos = Array.from(sueldosMap.values()).map(s => {
            s.sueldoMensual = s.clasesSemanales * 4 * s.tarifaPorClase;
            s.especialidades = Array.from(s.especialidadesSet);
            delete s.especialidadesSet;
            return s;
        });


        return res.status(200).json({
            sueldos: dataSueldos,
            categoriasAmbiguas
        });

    } catch (error) {
        console.error('Error en sueldos.controller:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = {
    getSueldos
};
