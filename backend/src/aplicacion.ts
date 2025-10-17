import express from "express";
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
const allowedOrigins = (process.env.CORS_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
app.use(
  cors({
    origin: allowedOrigins.length
      ? (origin, callback) => {
          if (!origin) return callback(null, true);
          const ok = allowedOrigins.some((o) => origin === o);
          return callback(ok ? null : new Error("Origen no permitido por CORS"), ok);
        }
      : true
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

app.use("/api", rutas);

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
