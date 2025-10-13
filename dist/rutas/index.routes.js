"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tablero_rutas_1 = __importDefault(require("./tablero.rutas"));
const configuracion_rutas_1 = __importDefault(require("./configuracion.rutas"));
const pivot_rutas_1 = __importDefault(require("./pivot.rutas"));
const reportes_rutas_1 = __importDefault(require("./reportes.rutas"));
const health_rutas_1 = __importDefault(require("./health.rutas"));
const enrutador = (0, express_1.Router)();
enrutador.use("/tablero", tablero_rutas_1.default);
enrutador.use("/pivot", pivot_rutas_1.default);
enrutador.use("/reportes", reportes_rutas_1.default);
enrutador.use("/health", health_rutas_1.default);
enrutador.use("", configuracion_rutas_1.default);
exports.default = enrutador;
//# sourceMappingURL=index.routes.js.map