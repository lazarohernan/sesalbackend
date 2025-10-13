export type DragData = {
  tipo: "dimension" | "measure";
  id: string;
  fromZone?: string;
  fromIndex?: number;
};

export const buildDragData = (
  tipo: DragData["tipo"],
  id: string,
  fromZone?: DragData["fromZone"],
  fromIndex?: DragData["fromIndex"]
): string => {
  const payload: DragData = { tipo, id };
  if (fromZone !== undefined) payload.fromZone = fromZone;
  if (fromIndex !== undefined) payload.fromIndex = fromIndex;
  return JSON.stringify(payload);
};

export const parseDragData = (raw: string | undefined | null): DragData | null => {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as DragData;
    if ((data.tipo === "dimension" || data.tipo === "measure") && typeof data.id === "string") {
      return data;
    }
    return null;
  } catch (error) {
    return null;
  }
};




