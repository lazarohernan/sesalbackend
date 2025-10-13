# 🚀 BI SESAL Widget - Web Component

El **BI SESAL Widget** es un Web Component que permite embeber completamente la aplicación de Business Intelligence del Sistema SESAL en cualquier sitio web. Incluye tarjetas de resumen, mapa interactivo y panel de exportación de datos.

## ✨ Características

- **📊 Tarjetas de Resumen**: Indicadores clave del ecosistema SESAL
- **🗺️ Mapa Interactivo**: Visualización geográfica por departamento con datos municipales
- **📈 Exportación de Datos**: Generación de reportes en CSV y PDF
- **🎨 Temas**: Soporte para modo claro y oscuro
- **📱 Responsive**: Se adapta automáticamente al contenedor
- **🔒 Shadow DOM**: Estilos encapsulados, no interfiere con el sitio padre
- **⚡ Ligero**: Optimizado para carga rápida

## 🚀 Instalación Rápida

### 1. Incluir el Script
```html
<!-- Incluir Vue.js (si no está ya incluido) -->
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>

<!-- Incluir el widget de BI SESAL -->
<script src="https://tu-servidor.com/bi-sesal-widget.umd.cjs"></script>
<link rel="stylesheet" href="https://tu-servidor.com/bi-sesal-widget.css">
```

### 2. Usar el Widget
```html
<!-- Widget básico -->
<bi-sesal-completo></bi-sesal-completo>

<!-- Widget configurado -->
<bi-sesal-completo
  anio="2024"
  departamento="Cortés"
  theme="light"
  height="600px"
  width="100%"
></bi-sesal-completo>
```

## ⚙️ Configuración

### Atributos HTML

| Atributo | Tipo | Default | Descripción |
|----------|------|---------|-------------|
| `anio` | `number` | `2024` | Año de los datos a mostrar |
| `departamento` | `string` | `""` | Departamento a filtrar (opcional) |
| `theme` | `"light"` \| `"dark"` | `"light"` | Tema visual |
| `height` | `string` | `"600px"` | Altura del widget |
| `width` | `string` | `"100%"` | Ancho del widget |

### Configuración con JavaScript

```javascript
// Acceder al widget
const widget = document.querySelector('bi-sesal-completo');

// Actualizar configuración dinámicamente
widget.updateConfig({
  anio: 2023,
  departamento: 'Atlántida',
  theme: 'dark'
});

// Escuchar eventos
widget.addEventListener('config-changed', (event) => {
  console.log('Configuración actualizada:', event.detail);
});
```

## 🎯 Ejemplos de Uso

### Sitio Web Corporativo
```html
<div style="max-width: 1200px; margin: 0 auto; padding: 20px;">
  <h2>Reportes SESAL 2024</h2>
  <bi-sesal-completo
    anio="2024"
    theme="light"
    height="700px">
  </bi-sesal-completo>
</div>
```

### Dashboard Interno
```html
<div class="dashboard-grid">
  <div class="widget-container">
    <bi-sesal-completo
      anio="2024"
      departamento="Cortés"
      theme="dark"
      height="500px">
    </bi-sesal-completo>
  </div>
  <div class="other-content">
    <!-- Otro contenido del dashboard -->
  </div>
</div>
```

### Página de Reportes
```html
<section class="reports-section">
  <header>
    <h1>Análisis Territorial SESAL</h1>
    <p>Datos actualizados al último trimestre</p>
  </header>

  <bi-sesal-completo
    anio="2024"
    height="800px"
    width="100%">
  </bi-sesal-completo>
</section>
```

## 🔧 Requisitos Técnicos

### Backend
- **Servidor**: Node.js con Express
- **Base de Datos**: MySQL (local o remota)
- **Puerto**: 4000 (configurable)
- **CORS**: Habilitado para dominios de embedding

### Frontend
- **Vue.js**: 3.x
- **MapLibre GL**: Para mapas interactivos
- **Tailwind CSS**: Para estilos
- **Web Components**: API nativa del navegador

## 🚀 Despliegue en Producción

### 1. Construir el Widget
```bash
# Desde el directorio webapp-BISESAL
npm run build:widget
```

### 2. Archivos Generados
```
dist/
├── bi-sesal-widget.umd.cjs    # Script principal
├── bi-sesal-widget.css        # Estilos
└── assets/
    └── maplibre-gl-csp-worker-CZauB-s9.js
```

### 3. Servir los Archivos
Sube los archivos `bi-sesal-widget.umd.cjs` y `bi-sesal-widget.css` a tu servidor web.

### 4. Configurar CORS
Asegúrate de que tu backend permita requests desde los dominios donde se embeba el widget:

```javascript
// En tu servidor Express
const corsOptions = {
  origin: [
    'https://tu-sitio-web.com',
    'https://otro-sitio.com'
  ],
  credentials: true
};
app.use(cors(corsOptions));
```

## 🔍 Demo Interactiva

Para probar el widget localmente:

```bash
# Construir el widget
npm run build:widget

# Ejecutar demo
npm run demo
```

Visita `http://localhost:3000/demo.html` para una demo interactiva completa.

## 📊 Funcionalidades Incluidas

### Tarjetas de Resumen
- Regiones cubiertas
- Municipios con datos
- Unidades de servicio activas
- Registros históricos

### Mapa Interactivo
- Vista departamental de Honduras
- Datos por municipio
- Consultas totales, pediatría, ginecología, medicina general
- Unidades de salud activas
- Información contextual al hacer clic

### Exportación de Datos
- Reportes consolidados por región
- Resumen maestro por municipio
- Detalles por unidad de salud
- Formatos CSV y PDF
- Filtros por año, región, municipio y servicio

## 🎨 Personalización

### Estilos Globales
El widget incluye estilos encapsulados que no afectan el sitio padre. Para personalización avanzada:

```css
/* Personalizar colores del widget */
bi-sesal-completo {
  --primary-color: #2563eb;
  --background-color: #ffffff;
  --text-color: #374151;
}
```

### Eventos Personalizados
```javascript
const widget = document.querySelector('bi-sesal-completo');

// Escuchar cuando se selecciona un departamento
widget.addEventListener('departamento-seleccionado', (event) => {
  const { departamento, datos } = event.detail;
  console.log(`Departamento seleccionado: ${departamento.nombre}`);
  console.log('Datos:', datos);
});

// Escuchar generación de reportes
widget.addEventListener('reporte-generado', (event) => {
  const { tipo, formato, datos } = event.detail;
  console.log(`Reporte ${tipo} generado en formato ${formato}`);
});
```

## 🐛 Solución de Problemas

### El widget no carga
1. Verificar que Vue.js esté incluido antes del script del widget
2. Comprobar que los archivos CSS y JS se sirvan correctamente
3. Verificar configuración CORS del backend

### Datos no se muestran
1. Confirmar que el backend esté ejecutándose en el puerto 4000
2. Verificar conexión a base de datos MySQL
3. Comprobar logs del servidor para errores

### Problemas de rendimiento
1. Limitar el tamaño del widget (height/width)
2. Usar Web Workers para procesamiento de datos pesados
3. Optimizar imágenes y assets del mapa

## 📞 Soporte

Para soporte técnico o reportar problemas:

1. Revisar los logs del navegador (F12 → Console)
2. Verificar configuración del backend
3. Comprobar compatibilidad del navegador (Chrome 70+, Firefox 68+, Safari 12+)

## 📝 Licencia

Este widget es parte del Sistema BI SESAL - Secretaría de Salud de Honduras.

---

**Desarrollado por**: Sistema ATA - BI SESAL
**Versión**: 1.0.0
**Última actualización**: Septiembre 2025