export interface ResumenTablero {
    totalRegiones: number;
    totalMunicipios: number;
    totalUnidadesServicio: number;
    totalRegistrosDetalle: number;
}
export interface DepartamentoDato {
    departamentoId: number;
    nombre: string;
    totalHistorico: number;
    total2025: number;
    total2024: number;
    total2023: number;
    totalUnidades: number;
}
export declare const obtenerResumenTablero: (anio?: number) => Promise<ResumenTablero>;
export declare const obtenerDatosMapaHonduras: () => Promise<DepartamentoDato[]>;
