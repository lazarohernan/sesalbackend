"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFoundHandler = exports.requestIdMiddleware = void 0;
const node_crypto_1 = require("node:crypto");
const registro_utilidad_1 = require("./registro.utilidad");
const requestIdMiddleware = (req, res, next) => {
    const existing = req.headers["x-request-id"];
    const id = (Array.isArray(existing) ? existing[0] : existing) || (0, node_crypto_1.randomUUID)();
    req.requestId = id;
    res.setHeader("x-request-id", id);
    next();
};
exports.requestIdMiddleware = requestIdMiddleware;
const notFoundHandler = (req, res) => {
    res.status(404).json({
        status: 404,
        codigo: "RUTA_NO_ENCONTRADA",
        mensaje: "Ruta no encontrada",
        path: req.originalUrl,
        requestId: req.requestId
    });
};
exports.notFoundHandler = notFoundHandler;
const errorHandler = (err, req, res, _next) => {
    const requestId = req.requestId;
    // Errores de JSON inválido
    if (err?.type === "entity.parse.failed" || err instanceof SyntaxError) {
        registro_utilidad_1.logger.warn("JSON inválido recibido", { requestId, detalle: String(err?.message || err) });
        return res.status(400).json({
            status: 400,
            codigo: "JSON_INVALIDO",
            mensaje: "El cuerpo de la solicitud no es un JSON válido.",
            requestId
        });
    }
    const status = Number(err?.status || err?.statusCode || 500);
    const codigo = String(err?.code || err?.codigo || (status === 500 ? "ERROR_INTERNO" : "ERROR"));
    const mensaje = String(err?.message || "Error procesando la solicitud");
    if (status >= 500) {
        registro_utilidad_1.logger.error(`Error ${status}`, { requestId, codigo, mensaje, stack: err?.stack });
    }
    else {
        registro_utilidad_1.logger.warn(`Error ${status}`, { requestId, codigo, mensaje });
    }
    const cuerpo = { status, codigo, mensaje, requestId };
    // En desarrollo, incluye detalles
    if (process.env.NODE_ENV !== "production" && err?.stack) {
        cuerpo.detalle = err.stack;
    }
    return res.status(status).json(cuerpo);
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=error.utilidad.js.map