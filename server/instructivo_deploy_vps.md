# Guía de Actualización VPS (Fluxer)

Ejecutá estos pasos **en orden** para cada una de las instancias/gimnasios que tengas alojadas en el VPS.

---

### PASO 1: Actualizar el código y la Base de Datos (Backend)

Abrí la terminal de tu VPS, posicionate en la carpeta `server` de la instancia que quieras actualizar (por ejemplo: `cd /ruta/a/tu/instancia/Fluxer_app/server`) y ejecutá:

```bash
# 1. Bajar los últimos cambios de GitHub
git pull

# 2. Actualizar el cliente interno de Prisma
npx prisma generate

# 3. Aplicar los cambios estructurales a la BD (Agrega cupoMaximo sin borrar nada)
npx prisma db push

# 4. Insertar los nuevos parámetros requeridos en la BD (cupoEstricto)
npx prisma db seed
```

### PASO 2: Reiniciar el Servidor Backend

Para que NodeJS suelte el código viejo que tiene en memoria y empiece a usar la nueva lógica de concurrencia de pagos y reservas:

```bash
pm2 restart all
# (Nota: si usás un nombre específico en PM2, usá `pm2 restart nombre_app`)
```

### PASO 3: Compilar la Interfaz Visual (Frontend)

Para que aparezcan los nuevos botones, la vista de turnos compartidos y los arreglos visuales de la impresión A4 del libro diario, posicionate en la carpeta `client`:

```bash
# 1. Subir a la carpeta client
cd ../client

# 2. Bajar los cambios de frontend (si no lo hiciste en la carpeta raíz)
git pull

# 3. Reconstruir la aplicación de React
npm run build
```

*(Importante: Si tu servidor Nginx u otro web server lee los archivos estáticos desde otra carpeta, acordate de copiar el contenido de la carpeta `/client/dist` al destino final correspondiente como hacés habitualmente).*

### PASO 4: Limpieza final

Una vez terminados los 3 pasos, pedile a los administradores de ese gimnasio que presionen **F5 (o Ctrl + Shift + R)** en sus navegadores para limpiar el caché visual y cargar la nueva versión del sistema.

---
**✅ Listo.** Repetí este mismo proceso en las otras instancias y todas quedarán 100% actualizadas.
