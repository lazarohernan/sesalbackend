export interface ConfiguracionPersistida {
    host: string;
    port: number;
    username: string;
    database: string;
    ssl: boolean;
    passwordEncrypted: string;
    updatedAt: string;
}
export declare const obtenerRutaConfiguracion: () => string;
export declare const guardarConfiguracionPersistida: (config: ConfiguracionPersistida) => Promise<void>;
export declare const leerConfiguracionPersistida: () => Promise<ConfiguracionPersistida | null>;
export declare const eliminarConfiguracionPersistida: () => Promise<void>;
