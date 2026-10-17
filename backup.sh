#!/bin/bash
# Powertech ERP - Automated Daily Database Backup Script
# Performs PostgreSQL dump, compresses archive, and cleans up older backups.

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RETENTION_DAYS="${RETENTION_DAYS:-30}"
DB_CONTAINER="${DB_CONTAINER:-powertech-db}"
DB_NAME="${POSTGRES_DB:-powertech_crm}"
DB_USER="${POSTGRES_USER:-postgres}"

mkdir -p "$BACKUP_DIR"

BACKUP_FILE="${BACKUP_DIR}/powertech_backup_${TIMESTAMP}.sql.gz"

echo "[$(date)] Starting daily database backup for ${DB_NAME}..."

# Execute pg_dump inside postgres container and compress
docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

# Verify backup file size
if [ -s "$BACKUP_FILE" ]; then
    FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "[$(date)] Database backup completed successfully: ${BACKUP_FILE} (Size: ${FILE_SIZE})"
else
    echo "[$(date)] Error: Backup file is empty or was not created." >&2
    exit 1
fi

# Retention policy: remove backups older than RETENTION_DAYS
echo "[$(date)] Cleaning backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name "powertech_backup_*.sql.gz" -type f -mtime +"$RETENTION_DAYS" -exec rm -f {} +

echo "[$(date)] Daily backup process completed."
