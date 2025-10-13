"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const configuracion_1 = require("./configuracion");
const index_routes_1 = __importDefault(require("./rutas/index.routes"));
const registro_utilidad_1 = require("./utilidades/registro.utilidad");
const error_utilidad_1 = require("./utilidades/error.utilidad");
const rate_limit_utilidad_1 = require("./utilidades/rate-limit.utilidad");
const app = (0, express_1.default)();
exports.app = app;
app.set("trust proxy", true);
app.use((0, helmet_1.default)());
// CORS configurable por entorno
const allowedOrigins = (process.env.CORS_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
app.use((0, cors_1.default)({
    origin: allowedOrigins.length
        ? (origin, callback) => {
            if (!origin)
                return callback(null, true);
            const ok = allowedOrigins.some((o) => origin === o);
            return callback(ok ? null : new Error("Origen no permitido por CORS"), ok);
        }
        : true
}));
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: "1mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use(registro_utilidad_1.httpLogger);
app.use(error_utilidad_1.requestIdMiddleware);
app.use((0, rate_limit_utilidad_1.simpleRateLimit)({ windowMs: 60_000, max: 300 }));
app.get("/salud", (_req, res) => {
    res.json({ estado: "ok", servicio: "bi-backend", ambiente: configuracion_1.entorno.ambiente });
});
app.use("/api", index_routes_1.default);
app.use(error_utilidad_1.notFoundHandler);
app.use(error_utilidad_1.errorHandler);
//# sourceMappingURL=aplicacion.js.map