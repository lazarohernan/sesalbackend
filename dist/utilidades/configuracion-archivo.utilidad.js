"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eliminarConfiguracionPersistida = exports.leerConfiguracionPersistida = exports.guardarConfiguracionPersistida = exports.obtenerRutaConfiguracion = void 0;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const CONFIG_DIR = node_path_1.default.resolve(process.cwd(), ".bi-sesal");
const CONFIG_FILE = node_path_1.default.join(CONFIG_DIR, "database-config.json");
const asegurarDirectorio = async () => {
    await promises_1.default.mkdir(CONFIG_DIR, { recursive: true });
};
const obtenerRutaConfiguracion = () => CONFIG_FILE;
exports.obtenerRutaConfiguracion = obtenerRutaConfiguracion;
const guardarConfiguracionPersistida = async (config) => {
    await asegurarDirectorio();
    const contenido = JSON.stringify(config, null, 2);
    await promises_1.default.writeFile(CONFIG_FILE, contenido, "utf8");
};
exports.guardarConfiguracionPersistida = guardarConfiguracionPersistida;
const leerConfiguracionPersistida = async () => {
    try {
        const contenido = await promises_1.default.readFile(CONFIG_FILE, "utf8");
        return JSON.parse(contenido);
    }
    catch (error) {
        if (error?.code === "ENOENT") {
            return null;
        }
        throw error;
    }
};
exports.leerConfiguracionPersistida = leerConfiguracionPersistida;
const eliminarConfiguracionPersistida = async () => {
    try {
        await promises_1.default.unlink(CONFIG_FILE);
    }
    catch (error) {
        if (error?.code === "ENOENT") {
            return;
        }
        throw error;
    }
};
exports.eliminarConfiguracionPersistida = eliminarConfiguracionPersistida;
//# sourceMappingURL=configuracion-archivo.utilidad.js.map