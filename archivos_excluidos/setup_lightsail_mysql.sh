#!/bin/bash

# Script para configurar MySQL en nueva instancia de Lightsail
# Uso: ./setup_lightsail_mysql.sh [IP_DE_LA_INSTANCIA]

if [ -z "$1" ]; then
    echo "❌ Error: Debes proporcionar la IP de la instancia"
    echo "Uso: ./setup_lightsail_mysql.sh [IP_DE_LA_INSTANCIA]"
    exit 1
fi

INSTANCE_IP=$1
KEY_PATH="/Users/lazarohernan/Desktop/SISTEMA ATA/BI_SESAL/LightsailDefaultKey-us-east-2.pem"

echo "🚀 Configurando MySQL en Lightsail..."
echo "📡 IP de la instancia: $INSTANCE_IP"
echo "🔑 Llave SSH: $KEY_PATH"
echo ""

# Verificar que la llave existe
if [ ! -f "$KEY_PATH" ]; then
    echo "❌ Error: No se encontró la llave SSH en $KEY_PATH"
    exit 1
fi

# Hacer la llave ejecutable
chmod 400 "$KEY_PATH"

echo "📦 Actualizando sistema..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no ubuntu@$INSTANCE_IP "
    sudo apt update && sudo apt upgrade -y
"

echo "🗄️ Instalando MySQL..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no ubuntu@$INSTANCE_IP "
    sudo apt install mysql-server -y
"

echo "🔧 Configurando MySQL..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no ubuntu@$INSTANCE_IP "
    sudo mysql -e \"ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'Sesal2024!Secure';\"
    sudo mysql -e \"CREATE DATABASE sesal_historico CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\"
    sudo mysql -e \"CREATE USER 'dataviz_user'@'%' IDENTIFIED BY 'Sesal2024!Secure';\"
    sudo mysql -e \"GRANT ALL PRIVILEGES ON sesal_historico.* TO 'dataviz_user'@'%';\"
    sudo mysql -e \"FLUSH PRIVILEGES;\"
"

echo "🌐 Configurando acceso remoto..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no ubuntu@$INSTANCE_IP "
    sudo sed -i 's/bind-address = 127.0.0.1/bind-address = 0.0.0.0/' /etc/mysql/mysql.conf.d/mysqld.cnf
    sudo systemctl restart mysql
    sudo systemctl enable mysql
"

echo "🔥 Configurando firewall..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no ubuntu@$INSTANCE_IP "
    sudo ufw allow 3306
    sudo ufw --force enable
"

echo "✅ Verificando instalación..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no ubuntu@$INSTANCE_IP "
    sudo systemctl status mysql --no-pager
    echo '📊 Bases de datos:'
    mysql -u root -p'Sesal2024!Secure' -e 'SHOW DATABASES;'
"

echo ""
echo "🎉 ¡MySQL configurado exitosamente en $INSTANCE_IP!"
echo "📋 Información de conexión:"
echo "   Host: $INSTANCE_IP"
echo "   Puerto: 3306"
echo "   Usuario: dataviz_user"
echo "   Contraseña: Sesal2024!Secure"
echo "   Base de datos: sesal_historico"
echo ""
echo "🧪 Para probar la conexión:"
echo "   mysql -h $INSTANCE_IP -P 3306 -u dataviz_user -p'Sesal2024!Secure' sesal_historico"

