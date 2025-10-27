#!/bin/bash

echo "=== 🔒 CONFIGURANDO CLOUDFLARE TUNNEL EN LIGHTSAIL ==="
echo ""

# 1. Descargar cloudflared
echo "📦 Descargando Cloudflare Tunnel..."
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# 2. Autenticar (abrirá navegador)
echo ""
echo "🔐 Autenticando con Cloudflare..."
echo "Se abrirá tu navegador para iniciar sesión"
cloudflared tunnel login

# 3. Crear túnel
echo ""
echo "🚇 Creando túnel..."
cloudflared tunnel create sesal-backend

# 4. Crear archivo de configuración
echo ""
echo "⚙️ Configurando túnel..."
mkdir -p ~/.cloudflared

cat > ~/.cloudflared/config.yml << 'CONFIG'
tunnel: sesal-backend
credentials-file: /home/ubuntu/.cloudflared/TUNNEL_ID.json

ingress:
  - hostname: sesal-api.example.com
    service: http://localhost:4000
  - service: http_status:404
CONFIG

echo ""
echo "✅ Configuración básica completada"
echo ""
echo "📋 PRÓXIMOS PASOS:"
echo "1. Ve a Cloudflare Dashboard"
echo "2. Configura el DNS para tu túnel"
echo "3. Ejecuta: cloudflared tunnel run sesal-backend"
