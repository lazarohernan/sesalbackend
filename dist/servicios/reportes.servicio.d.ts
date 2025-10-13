export interface IndicadoresMunicipalesParams {
    anio: number;
    departamentoId: number;
    limite: number;
}
export interface IndicadoresMunicipalesTotales {
    totalConsultas: number;
    pediatria: number;
    ginecologia: number;
    medicinaGeneral: number;
    medicosEspecialistas: number;
    totalUnidades: number;
}
export declare const obtenerIndicadoresMunicipales: (params: IndicadoresMunicipalesParams) => Promise<IndicadoresMunicipalesTotales>;
export declare const obtenerEstadisticasCache: () => {
    totalEntradas: number;
    entradasValidas: number;
    entradasExpiradas: number;
    tablasVerificadas: number;
    cacheTTL: number;
    maxCacheSize: number;
};
