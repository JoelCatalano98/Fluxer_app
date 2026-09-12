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

---

## 💾 Backups Automáticos a Google Drive con Rclone

Esta sección detalla cómo configurar un respaldo diario automático de la base de datos MySQL hacia Google Drive, con compresión gzip, retención local de 7 días y registro de logs.

### 1. Instalar dependencias en el VPS
```bash
sudo apt update
sudo apt install -y rclone curl gzip mysql-client
```

### 2. Configurar Rclone con Google Drive
Ejecutá en la terminal del VPS:
```bash
rclone config
```

Seguí este asistente paso a paso:
1. `n) New remote` -> escribí: `gdrive`
2. `Storage>` -> escribí: `drive` (o el número correspondiente a Google Drive)
3. `client_id>` -> presiona **Enter** (dejar en blanco para usar el ID por defecto)
4. `client_secret>` -> presiona **Enter** (dejar en blanco)
5. `scope>` -> seleccioná `1` (Full access `drive`) o `2` (`drive.file`) -> recomendamos `1`
6. `service_account_file>` -> presiona **Enter** (dejar en blanco)
7. `Edit advanced config?` -> `n` (No)
8. `Use web browser to automatically authenticate?`
   - **IMPORTANTE:** Como el VPS no tiene interfaz gráfica, seleccioná `n` (No).
   - Rclone te dará instrucciones: ejecutá en tu PC local (donde tengas navegador) o usá túnel SSH:
     - **Opción recomendada (Túnel SSH):** Si te conectás al VPS con:
       ```bash
       ssh -L 53682:127.0.0.1:53682 usuario@IP_DEL_VPS
       ```
       podés responder `y` en rclone config y abrir en tu navegador local el link que te muestra rclone.
     - **Opción alternativa:** Instalar rclone en tu máquina local y correr `rclone authorize "drive"`, luego pegar el token JSON resultante en la terminal del VPS.
9. `Configure this as a Shared Drive (Team Drive)?` -> `n` (No)
10. `y) Yes this is OK` -> presiona `y`
11. `q) Quit config` -> presiona `q`

*Comprobación:*
```bash
rclone lsd gdrive:
```
Si lista tus carpetas de Drive, la conexión es exitosa.

---

### 3. Crear el script de backup en el VPS
Creá el archivo en `/usr/local/bin/backup_mysql_gdrive.sh`:
```bash
sudo nano /usr/local/bin/backup_mysql_gdrive.sh
```

Pegá el siguiente contenido (ajustá contraseña de MySQL si difiere):
```bash
#!/usr/bin/env bash
# ==============================================================================
# Script de Backup Automático MySQL a Google Drive con Rclone
# Sistema: Fluxer
# ==============================================================================

set -euo pipefail

# Variables de configuración
TIMESTAMP=$(date +"%Y-%m-%d_%H%M")
BACKUP_DIR="/var/backups/mysql_fluxer"
LOG_FILE="/var/log/fluxer_backup.log"
RETENTION_DAYS=7

DB_USER="root"
DB_PASS="TU_PASSWORD_MYSQL"
DB_NAME="fluxer_db"

RCLONE_REMOTE="gdrive:Fluxer_Backups"

# Crear carpetas y archivos necesarios
mkdir -p "${BACKUP_DIR}"
touch "${LOG_FILE}"
chmod 600 "${LOG_FILE}"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

log "=== INICIO DEL PROCESO DE BACKUP ==="

# 1. Generar mysqldump comprimido
BACKUP_FILENAME="${DB_NAME}_${TIMESTAMP}.sql.gz"
BACKUP_FILEPATH="${BACKUP_DIR}/${BACKUP_FILENAME}"

log "Generando dump de la base de datos '${DB_NAME}'..."
if mysqldump -u "${DB_USER}" -p"${DB_PASS}" --single-transaction --quick --routines --triggers "${DB_NAME}" | gzip -9 > "${BACKUP_FILEPATH}"; then
    FILESIZE=$(du -h "${BACKUP_FILEPATH}" | cut -f1)
    log "Dump generado con éxito: ${BACKUP_FILENAME} (${FILESIZE})"
else
    log "ERROR: Falló la generación del mysqldump para ${DB_NAME}."
    exit 1
fi

# 2. Subir a Google Drive
log "Subiendo ${BACKUP_FILENAME} a Google Drive (${RCLONE_REMOTE})..."
if rclone copy "${BACKUP_FILEPATH}" "${RCLONE_REMOTE}" --drive-use-trash=false --stats 5s; then
    log "Archivo subido exitosamente a Google Drive."
else
    log "ERROR: Falló la subida a Google Drive mediante rclone."
    exit 1
fi

# 3. Limpieza de backups locales viejos (> 7 días)
log "Limpiando backups locales con más de ${RETENTION_DAYS} días en ${BACKUP_DIR}..."
ELIMINADOS=$(find "${BACKUP_DIR}" -type f -name "*.sql.gz" -mtime +${RETENTION_DAYS} -print -delete | wc -l)
log "Se eliminaron ${ELIMINADOS} backups antiguos del almacenamiento local."

log "=== BACKUP FINALIZADO CON ÉXITO ==="
```

Otorgale permisos de ejecución:
```bash
sudo chmod +x /usr/local/bin/backup_mysql_gdrive.sh
```

---

### 4. Configurar el Cron Job a las 3:00 AM (Hora Argentina)
Abrí el crontab de root:
```bash
sudo crontab -e
```

Agregá la siguiente línea al final:
```cron
CRON_TZ=America/Argentina/Buenos_Aires
0 3 * * * /usr/local/bin/backup_mysql_gdrive.sh >/dev/null 2>&1
```
*(Nota: Si tu VPS está configurado en UTC y tu versión de cron no soporta `CRON_TZ`, las 3:00 AM de Argentina equivalen a las `0 6 * * *` en UTC).*

---

### 5. Prueba manual y verificación
Ejecutá el script manualmente para verificar el circuito completo:
```bash
sudo /usr/local/bin/backup_mysql_gdrive.sh
```

Comprobá los resultados:
- **Ver el log:** `cat /var/log/fluxer_backup.log`
- **Listar el archivo en Google Drive:** `rclone ls gdrive:Fluxer_Backups`
- **Consultar espacio libre en disco:** `df -h`

