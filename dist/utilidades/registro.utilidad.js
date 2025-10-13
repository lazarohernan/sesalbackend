"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.httpLogger = void 0;
const morgan_1 = __importDefault(require("morgan"));
const stream = {
    write: (message) => {
        console.log(message.trim());
    }
};
const skip = () => process.env.NODE_ENV === "test";
exports.httpLogger = (0, morgan_1.default)("combined", { stream, skip });
exports.logger = {
    info: (message, ...args) => {
        console.log(`[INFO ] ${message}`, ...args);
    },
    warn: (message, ...args) => {
        console.warn(`[WARN ] ${message}`, ...args);
    },
    error: (message, ...args) => {
        console.error(`[ERROR] ${message}`, ...args);
    },
    debug: (message, ...args) => {
        if (process.env.NODE_ENV !== "production") {
            console.debug(`[DEBUG] ${message}`, ...args);
        }
    }
};
//# sourceMappingURL=registro.utilidad.js.map