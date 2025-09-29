# 🏥 BI SESAL - Sistema de Business Intelligence para SESAL

Sistema de análisis y visualización de datos para la Secretaría de Salud de Honduras (SESAL).

## 📋 Descripción

BI SESAL es una aplicación web que proporciona análisis y reportes sobre los datos históricos de salud de Honduras, permitiendo visualizaciones interactivas y exportación de reportes detallados.

## 🚀 Características Principales

- 📊 **Dashboard Interactivo**: Visualización de datos por región, departamento y municipio
- 🗺️ **Mapa de Honduras**: Visualización geográfica de indicadores de salud
- 📈 **Reportes Detallados**: Generación de reportes consolidados y de detalle
- 📤 **Exportación**: Exportación a PDF y Excel
- 🗄️ **Configuración Flexible**: Conexión manual a base de datos MySQL
- 🌙 **Tema Oscuro/Claro**: Interfaz adaptable con modo oscuro

## 🏗️ Arquitectura

```
├── backend/           # API REST en Node.js + TypeScript
├── webapp-BISESAL/   # Frontend en Vue.js + TypeScript
└── mysql-web-tools/  # Herramientas de administración de BD
```

## 🛠️ Tecnologías

### Backend
- **Node.js** + **TypeScript**
- **Express.js** para API REST
- **MySQL2** para conexión a base de datos
- **Helmet** para seguridad
- **CORS** para políticas de origen cruzado

### Frontend
- **Vue.js 3** + **TypeScript**
- **Vite** como bundler
- **Tailwind CSS** para estilos
- **MapLibre GL** para mapas interactivos
- **jsPDF** para exportación a PDF

### Base de Datos
- **MySQL 8.0** en AWS Lightsail
- **55 tablas** con datos históricos 2008-2025
- **888 MB** de datos de salud

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+ 
- npm o yarn
- MySQL 8.0+

### 1. Clonar el repositorio
```bash
git clone https://github.com/lazarohernan/sesal.git
cd sesal
```

### 2. Configurar Backend
```bash
cd backend
npm install
npm run build
```

### 3. Configurar Frontend
```bash
cd webapp-BISESAL
npm install
npm run build
```

### 4. Configurar Base de Datos
El sistema funciona en **modo manual**, requiriendo configuración de conexión a base de datos:

1. Abrir la aplicación web
2. Hacer clic en el botón 🗄️ (Configuración de BD)
3. Ingresar credenciales de MySQL:
   - **Host**: Tu servidor MySQL
   - **Puerto**: 3306 (por defecto)
   - **Usuario**: Tu usuario de MySQL
   - **Contraseña**: Tu contraseña
   - **Base de datos**: `sesal_historico`
   - **SSL**: Activar si es necesario

## 📊 Datos Disponibles

El sistema incluye datos históricos de:
- **Regiones sanitarias**: 9 regiones
- **Departamentos**: 18 departamentos
- **Municipios**: 298 municipios
- **Unidades de salud**: 1,922 unidades
- **Período**: 2008-2025
- **Indicadores**: Personal de salud por categorías

## 🎯 Uso del Sistema

### Dashboard Principal
- Visualización de tarjetas con resúmenes generales
- Mapa interactivo de Honduras con indicadores
- Filtros por año, departamento y municipio

### Reportes
- **Consolidado**: Resumen por región/departamento
- **Detalle**: Desglose por unidad de salud
- **Resumen Maestro**: Indicadores agregados

### Exportación
- **PDF**: Reportes formateados para impresión
- **Excel**: Datos para análisis adicional

## 🔧 Desarrollo

### Scripts Disponibles

#### Backend
```bash
npm run dev     # Modo desarrollo
npm run build   # Compilar TypeScript
npm run start   # Ejecutar producción
```

#### Frontend
```bash
npm run dev     # Servidor de desarrollo
npm run build   # Compilar para producción
npm run preview # Vista previa de producción
```

### Estructura del Código

#### Backend
- `src/controladores/` - Lógica de negocio
- `src/rutas/` - Definición de endpoints
- `src/servicios/` - Servicios de base de datos
- `src/middleware/` - Middlewares personalizados

#### Frontend
- `src/components/` - Componentes Vue
- `src/composables/` - Lógica reutilizable
- `src/types/` - Definiciones TypeScript

## 🔒 Seguridad

- Configuración de base de datos almacenada localmente
- Conexiones SSL habilitadas por defecto
- Validación de entrada en todos los endpoints
- Rate limiting implementado
- Headers de seguridad con Helmet

## 📝 Licencia

Este proyecto es desarrollado para la Secretaría de Salud de Honduras (SESAL).

## 🤝 Contribución

Para contribuir al proyecto:
1. Fork el repositorio
2. Crear una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abrir un Pull Request

## 📞 Soporte

Para soporte técnico o preguntas sobre el sistema, contactar al equipo de desarrollo.

---

**BI SESAL** - Transformando datos en decisiones para la salud de Honduras 🇭🇳
