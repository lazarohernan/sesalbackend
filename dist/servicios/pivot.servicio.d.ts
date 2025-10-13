type DimensionType = "string" | "number";
type AggregationType = "SUM" | "AVG" | "COUNT" | "MAX" | "MIN";
interface PivotFilter {
    field: string;
    values?: Array<string | number>;
}
interface PivotValueRequest {
    field: string;
    aggregation?: AggregationType;
}
export interface PivotQueryPayload {
    year?: number;
    filters?: PivotFilter[];
    rows?: string[];
    columns?: string[];
    values: PivotValueRequest[];
    limit?: number;
    includeTotals?: boolean;
}
export interface PivotQueryResult {
    datos: Array<Record<string, unknown>>;
    totalGeneral: Record<string, unknown> | null;
    aniosConsultados: number[];
    metadata: {
        dimensionesSeleccionadas: string[];
        dimensionesFilas: string[];
        dimensionesColumnas: string[];
        medidasSeleccionadas: string[];
    };
}
export interface PivotCatalogoDimension {
    id: string;
    etiqueta: string;
    tipo: DimensionType;
    admiteFiltrado: boolean;
    valores?: Array<{
        valor: string | number;
        etiqueta: string;
    }>;
    totalValores?: number;
    endpointValores?: string;
}
export interface PivotCatalogoMedida {
    id: string;
    etiqueta: string;
    descripcion: string;
    agregacionPorDefecto: AggregationType;
}
export interface PivotCatalogo {
    dimensiones: PivotCatalogoDimension[];
    medidas: PivotCatalogoMedida[];
    actualizadoEn: string;
}
export declare const obtenerCatalogoPivot: () => Promise<PivotCatalogo>;
export declare const obtenerAniosDisponibles: () => Promise<number[]>;
export declare const obtenerValoresDimension: (dimensionId: string, busqueda?: string, limite?: number) => Promise<Array<{
    valor: string | number;
    etiqueta: string;
}>>;
export declare const ejecutarConsultaPivot: (payload: PivotQueryPayload) => Promise<PivotQueryResult>;
export {};
