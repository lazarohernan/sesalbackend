# 🚀 Guía de Instalación - BI SESAL
## Sistema de Business Intelligence para Servidor Gubernamental

Esta guía te ayudará a instalar el sistema paso a paso de forma sencilla.

---

## 📋 Índice Rápido
1. [¿Qué necesitas antes de empezar?](#1-qué-necesitas-antes-de-empezar)
2. [Preparar los archivos en tu computadora](#2-preparar-los-archivos-en-tu-computadora)
3. [Configurar el servidor Linux](#3-configurar-el-servidor-linux)
4. [Instalar la base de datos](#4-instalar-la-base-de-datos)
5. [Instalar el sistema](#5-instalar-el-sistema)
6. [Configurar el dominio web](#6-configurar-el-dominio-web)
7. [Activar los certificados de seguridad](#7-activar-los-certificados-de-seguridad)
8. [Verificar que todo funciona](#8-verificar-que-todo-funciona)

---

## 1. ¿Qué necesitas antes de empezar?

### En el servidor:
- ✅ Un servidor Linux (Ubuntu 22.04 o similar)
- ✅ Acceso como administrador (usuario con sudo)
- ✅ Dos nombres de dominio:
  - `dashboard.tu-institucion.gob.hn` → Para el tablero visual
  - `api.tu-institucion.gob.hn` → Para los datos

### Recursos mínimos recomendados:
- 🖥️ **Procesador:** 4 núcleos
- 💾 **Memoria RAM:** 8 GB
- 💽 **Disco:** 100 GB

---

## 2. Preparar los archivos en tu computadora

### Paso 2.1: Exportar la base de datos

Abre la terminal en tu Mac y ejecuta:

```bash
cd "/Users/lazarohernan/Desktop/SISTEMA ATA/BI_SESAL"

# Exportar la base de datos
mysqldump -u root -p sesal_historico > base-datos.sql

# Comprimir para transferir más rápido
gzip base-datos.sql
```

Te pedirá la contraseña de MySQL. Al terminar, tendrás un archivo llamado `base-datos.sql.gz`

### Paso 2.2: Empaquetar el sistema

En la misma terminal:

```bash
# Crear un paquete con todo el sistema
tar -czf sistema-completo.tar.gz backend webapp-BISESAL nginx-backend.conf nginx-frontend.conf

# Ahora tienes 2 archivos listos para transferir:
# 1. base-datos.sql.gz (la base de datos)
# 2. sistema-completo.tar.gz (el sistema completo)
```

### Paso 2.3: Transferir al servidor

Transfiere los 2 archivos al servidor usando alguna de estas opciones:

**Opción A - Usando terminal:**
```bash
# Cambiar "usuario" e "ip-del-servidor" por los datos reales
scp base-datos.sql.gz usuario@ip-del-servidor:/home/usuario/
scp sistema-completo.tar.gz usuario@ip-del-servidor:/home/usuario/
```

**Opción B - Usando FileZilla o WinSCP:**
- Conectarte por SFTP al servidor
- Subir los 2 archivos a la carpeta `/home/usuario/`

---

## 3. Configurar el servidor Linux

Ahora conéctate al servidor y sigue estos pasos.

### Paso 3.1: Actualizar el sistema

```bash
# Actualizar la lista de software disponible
sudo apt update

# Instalar las actualizaciones
sudo apt upgrade -y
```

### Paso 3.2: Instalar MySQL (base de datos)

```bash
# Instalar MySQL
sudo apt install mysql-server -y

# Configurar seguridad
sudo mysql_secure_installation
```

Responde así:
- **¿Validar contraseñas?** → Presiona `Enter` (No)
- **¿Cambiar contraseña de root?** → Escribe `y` y crea una contraseña segura (guárdala bien)
- **¿Eliminar usuarios anónimos?** → `y`
- **¿Deshabilitar acceso remoto de root?** → `y`
- **¿Eliminar base de datos de prueba?** → `y`
- **¿Recargar privilegios?** → `y`

### Paso 3.3: Instalar Node.js (motor del sistema)

```bash
# Descargar e instalar Node.js versión 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar que se instaló correctamente (debe mostrar v20.x.x)
node --version
```

### Paso 3.4: Instalar PM2 (gestor de procesos)

```bash
# PM2 mantiene el sistema funcionando 24/7
sudo npm install -g pm2
```

### Paso 3.5: Instalar Nginx (servidor web)

```bash
# Instalar Nginx
sudo apt install nginx -y

# Iniciarlo
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Paso 3.6: Instalar Certbot (certificados de seguridad HTTPS)

```bash
sudo apt install certbot python3-certbot-nginx -y
```

---

## 4. Instalar la base de datos

### Paso 4.1: Crear el usuario y la base de datos

```bash
# Entrar a MySQL
sudo mysql

# Dentro de MySQL, ejecutar estos comandos uno por uno:
```

```sql
CREATE DATABASE sesal_historico CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'bisesal_user'@'localhost' IDENTIFIED BY 'MiPasswordSeguro2024';

GRANT ALL PRIVILEGES ON sesal_historico.* TO 'bisesal_user'@'localhost';

FLUSH PRIVILEGES;

EXIT;
```

⚠️ **IMPORTANTE:** Cambia `MiPasswordSeguro2024` por una contraseña segura y guárdala. La necesitarás después.

### Paso 4.2: Importar los datos

```bash
# Descomprimir el archivo
gunzip base-datos.sql.gz

# Importar a MySQL (usa la contraseña que creaste)
mysql -u bisesal_user -p sesal_historico < base-datos.sql

# Verificar que se importó correctamente
mysql -u bisesal_user -p sesal_historico -e "SHOW TABLES;"
```

Debe mostrar una lista de tablas. Si ves tablas, ¡todo está bien! ✅

---

## 5. Instalar el sistema

### Paso 5.1: Crear la carpeta del sistema

```bash
# Crear carpeta
sudo mkdir -p /var/www/bisesal

# Darte permisos sobre ella
sudo chown -R $USER:$USER /var/www/bisesal

# Ir a la carpeta
cd /var/www/bisesal
```

### Paso 5.2: Descomprimir el sistema

```bash
# Descomprimir (cambiar la ruta si subiste el archivo a otro lugar)
tar -xzf ~/sistema-completo.tar.gz
```

### Paso 5.3: Configurar el BACKEND (servidor de datos)

```bash
# Ir a la carpeta del backend
cd /var/www/bisesal/backend

# Crear el archivo de configuración
nano .env
```

Se abrirá un editor. Escribe esto (ajusta los valores):

```env
NODE_ENV=production
PORT=4000

MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=bisesal_user
MYSQL_PASSWORD=MiPasswordSeguro2024
MYSQL_DATABASE=sesal_historico

CORS_ORIGINS=*
```

⚠️ **Cambia `MiPasswordSeguro2024`** por la contraseña que creaste en el paso 4.1

Para guardar: `Ctrl + O`, `Enter`, `Ctrl + X`

```bash
# Instalar dependencias
npm install --production

# Crear carpeta para logs
mkdir -p logs

# Iniciar el sistema con PM2
pm2 start ecosystem.config.js

# Verificar que está corriendo
pm2 status
```

Debes ver algo como:
```
┌─────┬──────────────────┬─────────┬─────────┐
│ id  │ name             │ status  │ restart │
├─────┼──────────────────┼─────────┼─────────┤
│ 0   │ bisesal-backend  │ online  │ 0       │
└─────┴──────────────────┴─────────┴─────────┘
```

Si dice `online`, ¡está funcionando! ✅

```bash
# Hacer que se inicie automáticamente al reiniciar el servidor
pm2 save
pm2 startup
# Ejecutar el comando que te muestre (copiarlo y pegarlo)
```

### Paso 5.4: Configurar el FRONTEND (tablero visual)

```bash
# Ir a la carpeta del frontend
cd /var/www/bisesal/webapp-BISESAL

# Crear el archivo de configuración
nano .env.production
```

Escribe esto (ajusta tu dominio real):

```env
VITE_API_URL=https://api.tu-institucion.gob.hn
```

⚠️ **Cambia `api.tu-institucion.gob.hn`** por tu dominio real del API

Para guardar: `Ctrl + O`, `Enter`, `Ctrl + X`

```bash
# Instalar dependencias
npm install

# Compilar para producción (esto toma unos minutos)
npm run build
```

Al terminar, verás una carpeta llamada `dist` con todos los archivos listos.

---

## 6. Configurar el dominio web

### Paso 6.1: Configurar el dominio del API

```bash
# Editar el archivo de configuración del API
cd /var/www/bisesal
nano nginx-backend.conf
```

En la **línea 7**, cambia:
```
server_name api.tu-dominio-gobierno.gob.hn;
```
Por tu dominio real, ejemplo:
```
server_name api.salud.gob.hn;
```

Guardar: `Ctrl + O`, `Enter`, `Ctrl + X`

```bash
# Copiar a la carpeta de Nginx
sudo cp nginx-backend.conf /etc/nginx/sites-available/bisesal-backend

# Activarla
sudo ln -s /etc/nginx/sites-available/bisesal-backend /etc/nginx/sites-enabled/
```

### Paso 6.2: Configurar el dominio del Dashboard

```bash
# Editar el archivo de configuración del dashboard
nano nginx-frontend.conf
```

En la **línea 7**, cambia:
```
server_name dashboard.tu-dominio-gobierno.gob.hn;
```
Por tu dominio real, ejemplo:
```
server_name dashboard.salud.gob.hn;
```

Guardar: `Ctrl + O`, `Enter`, `Ctrl + X`

```bash
# Copiar a la carpeta de Nginx
sudo cp nginx-frontend.conf /etc/nginx/sites-available/bisesal-frontend

# Activarla
sudo ln -s /etc/nginx/sites-available/bisesal-frontend /etc/nginx/sites-enabled/

# Eliminar la configuración por defecto
sudo rm /etc/nginx/sites-enabled/default

# Verificar que la configuración está bien
sudo nginx -t
```

Debe decir: `syntax is ok` y `test is successful` ✅

```bash
# Reiniciar Nginx
sudo systemctl reload nginx
```

---

## 7. Activar los certificados de seguridad

Esto es necesario para que funcione con HTTPS (el candado verde en el navegador).

⚠️ **IMPORTANTE:** Antes de este paso, asegúrate de que tus dominios ya apuntan al servidor.

```bash
# Obtener certificado para el API
sudo certbot --nginx -d api.tu-institucion.gob.hn

# Obtener certificado para el Dashboard
sudo certbot --nginx -d dashboard.tu-institucion.gob.hn
```

Certbot te hará algunas preguntas:
- **Email:** Escribe tu email
- **Términos:** `A` (Aceptar)
- **¿Compartir email?** `N` (No)
- **¿Redirigir HTTP a HTTPS?** `2` (Sí, redirigir)

Los certificados se renovarán automáticamente cada 90 días. ✅

---

## 8. Verificar que todo funciona

### Verificación 1: Backend funcionando ✅

```bash
curl http://localhost:4000/salud
```

Debe responder:
```json
{"estado":"ok","servicio":"bi-backend","ambiente":"production"}
```

### Verificación 2: Dashboard accesible ✅

Abre tu navegador y visita:
```
https://dashboard.tu-institucion.gob.hn
```

Debes ver el tablero con las métricas y el mapa. ✅

### Verificación 3: API accesible ✅

En el navegador visita:
```
https://api.tu-institucion.gob.hn/salud
```

Debe mostrar el mismo JSON del paso anterior.

### Verificación 4: Certificados SSL funcionando ✅

En el navegador, junto a la URL del dashboard, debe aparecer un **candado verde** 🔒

---

## 🎯 ¡Sistema Instalado!

Tu sistema ahora está funcionando con:

✅ Base de datos MySQL con todos tus datos  
✅ Backend procesando peticiones 24/7  
✅ Dashboard visual accesible desde cualquier navegador  
✅ Certificados de seguridad (HTTPS) activados  
✅ Sistema reiniciándose automáticamente si hay problemas  

### 📊 Características disponibles:

- **Tablero principal** con métricas y estadísticas
- **Mapa interactivo** de Honduras con datos por departamento
- **Tabla dinámica** (Pivot) para crear reportes personalizados
- **Exportación** a Excel y PDF
- **Modo claro y oscuro**
- **Compartir dashboards** mediante código iframe para incrustar en otros sitios

---

## 🔧 Comandos útiles para el administrador

### Ver si el sistema está funcionando:
```bash
pm2 status
```

### Ver los logs (errores o actividad):
```bash
pm2 logs bisesal-backend
```

### Reiniciar el sistema:
```bash
pm2 restart bisesal-backend
```

### Ver logs de Nginx:
```bash
# Logs del dashboard
sudo tail -f /var/log/nginx/bisesal-frontend-error.log

# Logs del API
sudo tail -f /var/log/nginx/bisesal-backend-error.log
```

### Reiniciar Nginx:
```bash
sudo systemctl reload nginx
```

---

## 📤 Compartir el Dashboard (Embeddings)

El sistema puede ser compartido en otros sitios web. Para hacerlo:

1. **Entra al dashboard** en tu navegador
2. **Clic en el botón "Compartir"** (arriba a la derecha)
3. **Elige el tamaño** que quieras:
   - Pequeño (800px x 600px)
   - Mediano (1200px x 800px)
   - Grande (100% x 1000px)
4. **Copia el código** que aparece
5. **Pega el código** en cualquier página HTML

Ejemplo de código que puedes compartir:
```html
<iframe 
  src="https://dashboard.tu-institucion.gob.hn" 
  width="1200" 
  height="800" 
  frameborder="0" 
  allowfullscreen>
</iframe>
```

Esto permite incrustar el dashboard en:
- Sitios web gubernamentales
- Portales de transparencia
- Sistemas internos
- Presentaciones

---

## 🆘 Solución de Problemas

### ❌ El backend no inicia
**Solución:**
```bash
# Ver qué está pasando
pm2 logs bisesal-backend --lines 50

# Verificar que la contraseña de MySQL es correcta
nano /var/www/bisesal/backend/.env
```

### ❌ No puedo acceder al dashboard
**Solución:**
```bash
# Verificar que Nginx está corriendo
sudo systemctl status nginx

# Ver errores de Nginx
sudo tail -50 /var/log/nginx/bisesal-frontend-error.log
```

### ❌ Error de base de datos
**Solución:**
```bash
# Verificar que MySQL está corriendo
sudo systemctl status mysql

# Probar conexión manual
mysql -u bisesal_user -p sesal_historico
```

### ❌ No funciona el certificado SSL
**Solución:**
```bash
# Renovar certificados manualmente
sudo certbot renew

# Ver estado de los certificados
sudo certbot certificates
```

---

## 📞 Información del Sistema

**Nombre:** BI SESAL - Business Intelligence  
**Versión:** 1.0.0  
**Tecnologías:** Node.js, MySQL, Vue.js, Nginx  
**Plataforma:** Linux (Ubuntu 22.04+)  

### Ubicaciones de archivos en el servidor:
- **Sistema:** `/var/www/bisesal/`
- **Logs del backend:** `/var/www/bisesal/backend/logs/`
- **Logs de Nginx:** `/var/log/nginx/`
- **Configuración de Nginx:** `/etc/nginx/sites-available/`

---

## ✅ Checklist Final

Marca cada punto al completarlo:

```
PREPARACIÓN:
☐ Servidor Linux instalado
☐ Dominios configurados en DNS
☐ Acceso SSH funcionando

INSTALACIÓN SOFTWARE:
☐ MySQL instalado y configurado
☐ Node.js 20 instalado
☐ PM2 instalado
☐ Nginx instalado
☐ Certbot instalado

BASE DE DATOS:
☐ Base de datos creada
☐ Usuario creado
☐ Datos importados

SISTEMA:
☐ Código descomprimido en /var/www/bisesal
☐ Backend configurado (.env creado)
☐ Backend corriendo con PM2
☐ Frontend compilado (npm run build)
☐ Frontend configurado (.env.production)

NGINX:
☐ Configuración del API activada
☐ Configuración del dashboard activada
☐ Dominios cambiados en archivos
☐ Nginx reiniciado

SEGURIDAD:
☐ Certificado SSL del API instalado
☐ Certificado SSL del dashboard instalado
☐ HTTPS funcionando (candado verde)

VERIFICACIÓN:
☐ Backend responde en /salud
☐ Dashboard carga en navegador
☐ Datos aparecen correctamente
☐ Embeddings funcionan
```

---

**¡Felicidades! El sistema está completamente instalado y funcionando.** 🎉

Si tienes problemas, revisa la sección "Solución de Problemas" o consulta los logs del sistema.

