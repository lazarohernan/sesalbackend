import mysql from "mysql2/promise";
export declare let pool: mysql.Pool | null;
export declare const inicializarPool: () => Promise<void>;
export declare const obtenerPoolActual: () => mysql.Pool;
