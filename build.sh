#!/bin/bash

# Script de build para Netlify
echo "🚀 Iniciando build para Netlify..."

# Build del frontend
echo "📦 Construyendo frontend..."
cd webapp-BISESAL
npm ci
npm run build

# Build del backend
echo "🔧 Construyendo backend..."
cd ../backend
npm ci
npm run build

echo "✅ Build completado exitosamente!"
