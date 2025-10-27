#!/bin/bash

echo "=== 🔒 CONFIGURANDO HTTPS EN LIGHTSAIL ==="
echo ""

# 1. Instalar Certbot y Nginx
echo "📦 Instalando Certbot y Nginx..."
sudo apt update
sudo apt install -y certbot python3-certbot-nginx nginx

# 2. Configurar Nginx
echo ""
echo "⚙️ Configurando Nginx..."
sudo tee /etc/nginx/sites-available/sesal-backend > /dev/null << 'NGINX_CONFIG'
server {
    listen 80;
    server_name 18.226.96.204;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX_CONFIG

# 3. Habilitar configuración
sudo ln -sf /etc/nginx/sites-available/sesal-backend /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# 4. Configurar firewall
echo ""
echo "🔥 Configurando firewall..."
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 4000

echo ""
echo "✅ Nginx configurado exitosamente"
echo ""
echo "⚠️ IMPORTANTE: Para HTTPS necesitas un dominio"
echo ""
echo "📋 OPCIONES:"
echo ""
echo "1️⃣ SI TIENES UN DOMINIO (recomendado):"
echo "   Ejecuta: sudo certbot --nginx -d tu-dominio.com"
echo ""
echo "2️⃣ SI NO TIENES DOMINIO:"
echo "   • Actualiza Netlify para usar HTTP (no recomendado)"
echo "   • O compra/configura un dominio"
echo ""
echo "3️⃣ CERTIFICADO AUTOFIRMADO (solo pruebas):"
echo "   Ejecuta: sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/ssl/private/nginx-selfsigned.key -out /etc/ssl/certs/nginx-selfsigned.crt"
