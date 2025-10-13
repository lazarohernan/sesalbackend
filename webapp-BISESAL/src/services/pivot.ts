import type { PivotCatalogo, PivotQueryPayload, PivotQueryResult } from "../types/pivot";

const normalizarBase = (base?: string) => {
  if (!base) return "";
  const trimmed = base.trim().replace(/\/+$/, "");
  return trimmed;
};

const construirUrl = (ruta: string, base?: string) => {
  const limpio = normalizarBase(base);
  if (!limpio) {
    return ruta;
  }
  return `${limpio}${ruta}`;
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const mensaje = await response.text();
    throw new Error(mensaje || "Error desconocido al consultar el pivot");
  }
  return response.json() as Promise<T>;
};

export const obtenerCatalogoPivotApi = async (baseUrl?: string): Promise<PivotCatalogo> => {
  const respuesta = await fetch(construirUrl("/api/pivot/catalogo", baseUrl));
  return handleResponse<PivotCatalogo>(respuesta);
};

export const consultarPivotApi = async (
  payload: PivotQueryPayload,
  baseUrl?: string
): Promise<{ resultado: PivotQueryResult; generadoEn: string }> => {
  const respuesta = await fetch(construirUrl("/api/pivot/consulta", baseUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  return handleResponse<{ resultado: PivotQueryResult; generadoEn: string }>(respuesta);
};

export const obtenerValoresDimensionApi = async (
  dimensionId: string,
  busqueda?: string,
  limite = 200,
  baseUrl?: string
) => {
  const parametros = new URLSearchParams();
  if (busqueda) parametros.set("busqueda", busqueda);
  if (limite) parametros.set("limite", String(limite));

  const respuesta = await fetch(
    construirUrl(`/api/pivot/dimensiones/${dimensionId}/valores?${parametros.toString()}`, baseUrl)
  );
  return handleResponse<{ valores: Array<{ valor: string | number; etiqueta: string }>; generadoEn: string }>(
    respuesta
  );
};

