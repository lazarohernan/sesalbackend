const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Servir archivos estáticos desde el directorio actual
app.use(express.static(path.join(__dirname)));

// Servir el demo.html en la ruta raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'demo.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Demo del widget corriendo en:`);
  console.log(`   Local:   http://localhost:${port}/`);
  console.log(`   Network: http://192.168.100.237:${port}/`);
  console.log(`   Archivo: ${path.join(__dirname, 'demo.html')}`);
});

