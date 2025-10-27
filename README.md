# 🏥 Dashboard BI SESAL

Panel analítico institucional del Sistema de Salud de Honduras (SESAL) con visualizaciones interactivas de datos de atención médica.

## 📊 Características Principales

- **📈 Gráficos Dinámicos**: Barras e iconos con colores alternados
- **🗺️ Mapa Interactivo**: Visualización geográfica por departamentos
- **🔍 Filtros Avanzados**: Por año, región y conceptos
- **📊 Métricas en Tiempo Real**: Indicadores clave del ecosistema SESAL
- **🎨 Tema Personalizado**: Colores naranjas para datos, azules para interactivos
- **📱 Responsive**: Compatible con dispositivos móviles y desktop

## 🚀 Tecnologías Utilizadas

### Backend
- **Node.js** con TypeScript
- **Express.js** para API REST
- **MySQL** como base de datos
- **PM2** para gestión de procesos en producción

### Frontend
- **Vue.js 3** con Composition API
- **Vite** para desarrollo y build
- **Tailwind CSS** para estilos
- **Lucide Vue** para iconos

## 🛠️ Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- MySQL 8.0+
- PM2 (opcional para producción)

### 1. Clonar el repositorio
```bash
git clone https://github.com/lazarohernan/sesal.git
cd sesal
```

### 2. Instalar dependencias
```bash
# Backend
cd backend
npm install

# Frontend
cd ../webapp-BISESAL
npm install
```

### 3. Configurar base de datos
```bash
# Crear base de datos MySQL
mysql -u root -p
CREATE DATABASE sesal_bi;

# Ejecutar seed de catálogos
mysql -u root -p sesal_bi < catalog_imports/seed_catalogos.sql
```

### 4. Configurar variables de entorno
```bash
# En backend/
cp .env.example .env
# Editar .env con credenciales de BD
```

### 5. Ejecutar en desarrollo
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd webapp-BISESAL
npm run dev
```

### 6. Ejecutar en producción

#### Backend (API REST)
```bash
# Desde la raíz del proyecto
cd backend

# Instalar dependencias
npm install

# Compilar TypeScript
npm run build

# Crear archivo de configuración de base de datos
cp ../.env.example .env
# Editar .env con tus credenciales de MySQL

# Ejecutar en producción con PM2
pm2 start ecosystem.config.js

# Ver estado del backend
pm2 status
pm2 logs bisesal-backend
```

#### Frontend (Aplicación Vue.js)
```bash
# Desde la raíz del proyecto
cd webapp-BISESAL

# Build para producción
npm run build

# Los archivos se generan en webapp-BISESAL/dist/
# Para producción, subir el contenido de dist/ a un servidor web
```

## 🚀 Despliegue del Backend

### Opción 1: Railway (Recomendado)
1. **Crear cuenta** en [Railway.app](https://railway.app)
2. **Conectar repositorio** de GitHub
3. **Configurar variables de entorno**:
   ```bash
   DB_HOST=your_mysql_host
   DB_PORT=3306
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=sesal_bi
   NODE_ENV=production
   ```
4. **Deploy automático** con cada push a main

### Opción 2: Render
1. **Crear cuenta** en [Render.com](https://render.com)
2. **Nuevo servicio web** desde GitHub
3. **Configurar build**:
   - Build command: `cd backend && npm install && npm run build`
   - Start command: `cd backend && npm start`
4. **Variables de entorno** como en Railway

### Opción 3: AWS Lightsail Ubuntu (Control Total)

#### 1. Crear Instancia en Lightsail
1. **Ir a AWS Lightsail** → **Crear instancia**
2. **Seleccionar**: "Linux/Unix" → "Ubuntu 22.04 LTS"
3. **Elegir plan**: $12/mes (2GB RAM, 80GB SSD)
4. **Nombre**: `bi-sesal-server`
5. **Crear instancia**

#### 2. Conectar por SSH
```bash
# Desde tu terminal local (reemplaza con tu ruta de clave)
ssh -i /ruta/a/tu/lightsail-key.pem ubuntu@3.137.212.24

# Ejemplo con ruta típica de descarga:
ssh -i ~/Downloads/lightsail-key.pem ubuntu@3.137.212.24

# Si tienes problemas de permisos:
chmod 400 ~/Downloads/lightsail-key.pem
```

#### 3. Instalar Node.js y MySQL
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar MySQL
sudo apt install -y mysql-server

# Configurar MySQL para conexiones remotas
sudo mysql_secure_installation
# Configurar root password y permitir conexiones remotas

# Crear base de datos
sudo mysql -u root -p
CREATE DATABASE sesal_bi;
CREATE USER 'sesal_user'@'%' IDENTIFIED BY 'tu_password_seguro';
GRANT ALL PRIVILEGES ON sesal_bi.* TO 'sesal_user'@'%';
FLUSH PRIVILEGES;
EXIT;

# Cargar datos iniciales
mysql -h localhost -u sesal_user -p sesal_bi < /home/ubuntu/sesal/catalog_imports/seed_catalogos.sql
```

#### 4. Desplegar Backend

##### Desde tu máquina local:
```bash
# Subir el proyecto completo al servidor
scp -r /Users/lazarohernan/Desktop/SISTEMA\ ATA/BI_SESAL ubuntu@3.137.212.24:/home/ubuntu/

# También puedes subir solo el código fuente si prefieres
# git clone https://github.com/lazarohernan/sesal.git
```

##### Desde el servidor Lightsail (ubuntu@3.137.212.24):
```bash
# Navegar al proyecto
cd /home/ubuntu/sesal/backend

# Instalar dependencias
npm install

# Compilar TypeScript
npm run build

# Crear archivo .env con configuración de MySQL local
cp ../.env.example .env
nano .env  # Editar con tus credenciales de MySQL

# Variables de entorno necesarias en .env:
DB_HOST=localhost
DB_PORT=3306
DB_USER=sesal_user
DB_PASSWORD=tu_password_seguro
DB_NAME=sesal_bi
NODE_ENV=production
PORT=4000

# Cargar datos iniciales en MySQL
mysql -h localhost -u sesal_user -p sesal_bi < ../catalog_imports/seed_catalogos.sql

# Instalar y configurar PM2
sudo npm install -g pm2
pm2 start ecosystem.config.js

# Configurar PM2 para auto-inicio
pm2 startup
pm2 save

# Verificar funcionamiento
pm2 status
pm2 logs bisesal-backend

# Probar API
curl http://localhost:4000/api/tablero/resumen
```

#### 5. Configurar Nginx (Opcional pero recomendado)
```bash
# Instalar nginx
sudo apt install -y nginx

# Crear configuración
sudo nano /etc/nginx/sites-available/bi-sesal

# Contenido del archivo:
server {
    listen 80;
    server_name 3.137.212.24;

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

# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/bi-sesal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 6. Configurar Seguridad
```bash
# Configurar firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Configurar fail2ban (opcional pero recomendado)
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## 📁 Estructura del Proyecto

```
sesal/
├── backend/                    # API REST Node.js/TypeScript
│   ├── src/
│   │   ├── controladores/     # Lógica de negocio
│   │   ├── rutas/            # Definición de endpoints
│   │   ├── servicios/        # Servicios de datos
│   │   └── utilidades/       # Utilidades auxiliares
│   ├── ecosystem.config.js   # Configuración PM2
│   └── package.json
├── webapp-BISESAL/           # Frontend Vue.js
│   ├── src/
│   │   ├── components/       # Componentes Vue
│   │   ├── composables/      # Composables reutilizables
│   │   ├── services/         # Servicios de API
│   │   └── types/           # Definiciones TypeScript
│   ├── public/              # Archivos estáticos
│   └── tailwind.config.ts   # Configuración Tailwind
├── catalog_imports/          # Datos de catálogos
├── archivos_excluidos/       # Archivos de respaldo
└── README.md
```

## 🎨 Esquema de Colores

- **🔶 Naranja** (`#f96000`): Elementos gráficos, números, barras
- **🔵 Azul** (`#4cc7d7`): Filtros, elementos interactivos
- **⚪ Gris**: Textos y títulos para mejor contraste
- **🎨 Gradientes**: Azul/naranja alternados en gráficos

## 📡 API Endpoints

### Dashboard
- `GET /api/tablero/resumen` - Métricas generales
- `GET /api/tablero/anios` - Años disponibles

### Pivot/Table
- `GET /api/pivot/catalogo` - Catálogo de dimensiones y medidas
- `POST /api/pivot/consulta` - Consultas dinámicas
- `GET /api/pivot/dimensiones/:id/valores` - Valores de dimensión

## 🌐 Acceso a la Aplicación

- **Desarrollo**: http://localhost:3001
- **API Backend**: http://localhost:4000
- **Producción**: Configurar según servidor

## 📋 Requisitos del Sistema

- **Node.js**: 18.0+
- **MySQL**: 8.0+
- **Memoria**: 2GB RAM mínimo
- **Disco**: 500MB espacio libre

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

© 2025 - Panel Analítico Institucional SESAL. Todos los derechos reservados.

## 👥 Instituciones

- **Secretaría de Salud (SESAL)** - Gobierno de Honduras
- **Fondo de Población de las Naciones Unidas (UNFPA)** - Honduras

---

**Desarrollado con ❤️ para mejorar la salud pública en Honduras**