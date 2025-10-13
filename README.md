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
```bash
# Backend con PM2
cd backend
npm run build
pm2 start ecosystem.config.js

# Frontend build
cd webapp-BISESAL
npm run build
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