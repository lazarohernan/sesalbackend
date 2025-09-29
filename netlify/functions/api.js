// Netlify Function para el backend API
// Este archivo permite usar el backend como Netlify Function

const express = require('express');
const serverless = require('serverless-http');

// Importar la aplicación Express del backend
const app = require('../backend/dist/aplicacion.js');

// Crear el handler para Netlify Functions
exports.handler = serverless(app);
