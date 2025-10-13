"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simpleRateLimit = void 0;
// Implementación simple en memoria (por IP+path) para evitar abuso básico
const simpleRateLimit = (opts) => {
    const windowMs = Math.max(1_000, opts.windowMs);
    const max = Math.max(1, opts.max);
    const keyGen = opts.keyGenerator || ((req) => `${req.ip || "?"}:${req.path}`);
    const buckets = new Map();
    return (req, res, next) => {
        const now = Date.now();
        const key = keyGen(req);
        const entry = buckets.get(key);
        if (!entry || entry.resetAt <= now) {
            buckets.set(key, { count: 1, resetAt: now + windowMs });
            res.setHeader("X-RateLimit-Limit", String(max));
            res.setHeader("X-RateLimit-Remaining", String(max - 1));
            return next();
        }
        if (entry.count < max) {
            entry.count += 1;
            res.setHeader("X-RateLimit-Limit", String(max));
            res.setHeader("X-RateLimit-Remaining", String(max - entry.count));
            return next();
        }
        const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
        res.setHeader("Retry-After", String(retryAfterSec));
        res.status(429).json({
            status: 429,
            codigo: "LIMITE_SOLICITUDES",
            mensaje: "Has excedido el número de solicitudes permitidas.",
            retryAfter: retryAfterSec,
            requestId: req.requestId
        });
    };
};
exports.simpleRateLimit = simpleRateLimit;
//# sourceMappingURL=rate-limit.utilidad.js.map