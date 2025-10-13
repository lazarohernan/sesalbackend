"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.entorno = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const numero = (valor, predeterminado) => {
    const convertido = Number(valor);
    return Number.isFinite(convertido) ? convertido : predeterminado;
};
exports.entorno = {
    ambiente: process.env.NODE_ENV ?? "desarrollo",
    puerto: numero(process.env.PUERTO ?? process.env.PORT, 4000),
    baseDatos: {
        host: process.env.MYSQL_HOST ?? process.env.DB_HOST ?? "localhost",
        puerto: numero(process.env.MYSQL_PORT ?? process.env.DB_PORT, 3306),
        usuario: process.env.MYSQL_USER ?? process.env.DB_USER ?? "root",
        contrasena: process.env.MYSQL_PASSWORD ?? process.env.DB_PASSWORD ?? "",
        nombre: process.env.MYSQL_DATABASE ?? process.env.DB_NAME ?? "sesal_historico",
        maximoConexiones: numero(process.env.MYSQL_CONNECTION_LIMIT ?? process.env.DB_POOL_LIMIT, 10),
        limiteCola: numero(process.env.MYSQL_QUEUE_LIMIT, 0),
        tiempoEsperaConexion: numero(process.env.MYSQL_CONNECT_TIMEOUT, 10_000),
        conjuntoCaracteres: process.env.MYSQL_CHARSET ?? "utf8mb4"
    },
    tablero: {
        tablaHechos: process.env.DB_FACT_TABLE ?? "fact_transactions",
        columnaMonto: process.env.DB_AMOUNT_COLUMN ?? "amount",
        columnaFecha: process.env.DB_DATE_COLUMN ?? "transaction_date",
        columnaCategoria: process.env.DB_CATEGORY_COLUMN ?? "category"
    }
};
//# sourceMappingURL=entorno.js.map