import mysql from "mysql2/promise";
export interface DatabaseConfig {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    ssl: boolean;
}
declare class ConfiguracionBDServicio {
    private configuracionPersonalizada;
    private persistenciaCargada;
    private readonly contextoId;
    private obtenerConfigPorDefecto;
    cargarConfiguracionPersistida(): Promise<void>;
    obtenerConfiguracion(): DatabaseConfig;
    persistirConfiguracion(config: DatabaseConfig | null): Promise<void>;
    setConfiguracionPersonalizada(config: DatabaseConfig | null): void;
    actualizarConfiguracion(config: DatabaseConfig): Promise<void>;
    limpiarConfiguracionPersonalizada(): void;
    limpiarConfiguracionPersistida(): Promise<void>;
    estaUsandoConfiguracionPersonalizada(): boolean;
    obtenerInfoConfiguracion(): {
        host: string;
        port: number;
        database: string;
        ssl: boolean;
        esPersonalizada: boolean;
        contextoId: string;
        timestamp: string;
    };
    obtenerConfiguracionPersistidaSanitizada(): {
        ssl: boolean;
        tienePassword: boolean;
        host: string;
        port: number;
        username: string;
        database: string;
    } | null;
    crearPool(): mysql.Pool;
    crearConexion(): Promise<mysql.Connection>;
}
export declare const configuracionBDServicio: ConfiguracionBDServicio;
export {};
