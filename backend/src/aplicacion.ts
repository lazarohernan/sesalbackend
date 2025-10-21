import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";

import { entorno } from "./configuracion";
import rutas from "./rutas/index.routes";
import { httpLogger } from "./utilidades/registro.utilidad";
import { errorHandler, notFoundHandler, requestIdMiddleware } from "./utilidades/error.utilidad";
import { simpleRateLimit } from "./utilidades/rate-limit.utilidad";

const app = express();

app.set("trust proxy", true);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
// CORS configurable por entorno
app.use(
  cors({
    origin: true
  })
);
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(httpLogger);
app.use(requestIdMiddleware);
app.use(simpleRateLimit({ windowMs: 60_000, max: 300 }));

app.get("/salud", (_req, res) => {
  res.json({ estado: "ok", servicio: "bi-backend", ambiente: entorno.ambiente });
});

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use("/api", rutas);

// SPA: enviar index.html para rutas que no sean API
app.get('/:path*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ mensaje: 'Ruta no encontrada' });
  }
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
