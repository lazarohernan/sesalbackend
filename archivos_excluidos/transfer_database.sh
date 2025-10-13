#!/bin/bash

# Script para transferir e importar la base de datos a Lightsail
# Uso: ./transfer_database.sh [IP_DE_LA_INSTANCIA]

if [ -z "$1" ]; then
    echo "❌ Error: Debes proporcionar la IP de la instancia"
    echo "Uso: ./transfer_database.sh [IP_DE_LA_INSTANCIA]"
    exit 1
fi

INSTANCE_IP=$1
KEY_PATH="/Users/lazarohernan/Desktop/SISTEMA ATA/BI_SESAL/LightsailDefaultKey-us-east-2.pem"
BACKUP_FILE="database_backup/20250928_145636/complete_backup.sql"

echo "📤 Transfiriendo base de datos a Lightsail..."
echo "📡 IP de la instancia: $INSTANCE_IP"
echo "📁 Archivo de respaldo: $BACKUP_FILE"
echo ""

# Verificar que el archivo de respaldo existe
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: No se encontró el archivo de respaldo en $BACKUP_FILE"
    exit 1
fi

echo "📦 Transfiriendo archivo de respaldo..."
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no "$BACKUP_FILE" ubuntu@$INSTANCE_IP:/home/ubuntu/

echo "📥 Importando base de datos..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no ubuntu@$INSTANCE_IP "
    echo '🔄 Importando base de datos...'
    mysql -h localhost -u dataviz_user -p'Sesal2024!Secure' sesal_historico < complete_backup.sql
    echo '✅ Importación completada'
    
    echo '📊 Verificando importación...'
    mysql -h localhost -u dataviz_user -p'Sesal2024!Secure' -e 'USE sesal_historico; SHOW TABLES;' | wc -l
    echo ' tablas importadas'
    
    echo '🧹 Limpiando archivo temporal...'
    rm complete_backup.sql
"

echo ""
echo "🎉 ¡Base de datos transferida e importada exitosamente!"
echo "🧪 Para probar la conexión desde tu aplicación local:"
echo "   Actualiza el archivo .env con:"
echo "   MYSQL_HOST=$INSTANCE_IP"
echo "   MYSQL_USER=dataviz_user"
echo "   MYSQL_PASSWORD=Sesal2024!Secure"
echo "   MYSQL_DATABASE=sesal_historico"

