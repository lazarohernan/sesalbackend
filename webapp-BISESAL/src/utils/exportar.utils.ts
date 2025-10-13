// Utilidades para exportación de datos
import { formatearCabecera as formatearCabeceraUtil } from "./formateo.utils";

export interface MetaExportacion {
  generadoEn: string;
  totalRegistros: number;
  anios: number[];
}

// Re-exportar la función de formateo para mantener compatibilidad
export const formatearCabecera = formatearCabeceraUtil;

// Función para formatear celdas
export const formatearCelda = (valor: unknown): string => {
  if (typeof valor === "number") {
    return new Intl.NumberFormat("es-HN", { maximumFractionDigits: 2 }).format(valor);
  }
  if (valor === null || valor === undefined || valor === "") {
    return "-";
  }
  return String(valor);
};

// Función para exportar a Excel (CSV)
export const exportarExcel = (
  cabeceras: string[],
  cuerpo: unknown[][],
  totales: unknown[]
): void => {
  // Crear datos para Excel
  const datosExcel: string[][] = [];

  // Agregar encabezados
  const encabezados = cabeceras.map(cabecera => formatearCabecera(cabecera));
  datosExcel.push(encabezados);

  // Agregar filas de datos
  cuerpo.forEach(fila => {
    const filaFormateada = fila.map(celda => formatearCelda(celda));
    datosExcel.push(filaFormateada);
  });

  // Agregar fila de totales si existe
  if (totales.length > 0) {
    const totalesFormateados = totales.map(total => formatearCelda(total));
    datosExcel.push(totalesFormateados);
  }

  // Convertir a CSV
  const csvContent = datosExcel.map(fila =>
    fila.map(celda => `"${String(celda).replace(/"/g, '""')}"`).join(',')
  ).join('\n');

  // Crear y descargar archivo
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `tabla_dinamica_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Función para generar HTML para PDF
const generarTablaDesdeDatos = (
  cabeceras: string[],
  cuerpo: unknown[][],
  totales: unknown[]
): {
  tabla: string;
  estilos: string;
  scriptContent: string;
  anchoMinimo: number;
} => {
  const numColumnas = cabeceras.length;
  // Calcular ancho basado en número de columnas, con mínimo razonable
  const anchoMinimo = Math.max(numColumnas * 120, 800);

  let cabecerasHTML = '';
  for (let i = 0; i < cabeceras.length; i++) {
    const cabecera = cabeceras[i] || '';
    cabecerasHTML += '<th>' + formatearCabecera(cabecera) + '</th>';
  }

  let filasHTML = '';
  for (let i = 0; i < cuerpo.length; i++) {
    const fila = cuerpo[i];
    if (!fila) continue;
    filasHTML += '<tr>';
    for (let j = 0; j < fila.length; j++) {
      filasHTML += '<td>' + formatearCelda(fila[j]) + '</td>';
    }
    filasHTML += '</tr>';
  }

  let totalesHTML = '';
  if (totales.length > 0) {
    totalesHTML = '<tr class="total-row">';
    for (let i = 0; i < totales.length; i++) {
      totalesHTML += '<td>' + formatearCelda(totales[i]) + '</td>';
    }
    totalesHTML += '</tr>';
  }

  // Estilos mejorados con bordes completos y sin overflow hidden
  const estilos = `
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; margin: 0; padding: 15px; background: white; }
    .header { margin-bottom: 20px; page-break-inside: avoid; text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; }
    h1 { color: #000; margin: 0 0 8px 0; font-size: 22px; font-weight: bold; letter-spacing: 1px; }
    h2 { color: #000; margin: 0 0 6px 0; font-size: 18px; font-weight: bold; }
    h3 { color: #000; margin: 0 0 15px 0; font-size: 16px; font-weight: normal; }
    .meta { color: #000; font-size: 10px; margin-bottom: 10px; line-height: 1.4; text-align: center; }
    .table-container { overflow-x: auto; width: 100%; border: 1px solid #d1d5db; border-radius: 4px; }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      table-layout: auto; 
      font-size: 9px; 
    }
    th, td { 
      border: 1px solid #d1d5db; 
      padding: 4px 6px; 
      text-align: left; 
      vertical-align: top; 
      word-wrap: break-word; 
    }
    th { 
      background-color: #f9fafb; 
      font-weight: bold; 
      font-size: 8px; 
    }
    .total-row { 
      background-color: #f3f4f6; 
      font-weight: bold; 
    }
    @media print {
      @page { size: A4 landscape; margin: 0.5in; }
      body { margin: 0; padding: 10px; font-size: 8px; }
      .header { margin-bottom: 15px; padding-bottom: 10px; }
      h1 { font-size: 20px; margin-bottom: 6px; }
      h2 { font-size: 16px; margin-bottom: 4px; }
      h3 { font-size: 14px; margin-bottom: 10px; }
      .meta { font-size: 9px; margin-bottom: 8px; }
      .table-container { border: 1px solid #d1d5db; overflow: visible; }
      table { font-size: 7px; }
      th, td { padding: 2px 4px; font-size: 7px; border: 1px solid #999; }
      th { font-size: 6px; }
      table { page-break-inside: avoid; }
      tr { page-break-inside: avoid; }
    }
    @media screen {
      .table-container { max-height: 80vh; overflow: auto; }
    }
  `;

  const scriptContent = 'window.onload = function() { setTimeout(function() { window.print(); window.onafterprint = function() { window.close(); }; }, 1000); };';

  return {
    tabla: '<table><thead><tr>' + cabecerasHTML + '</tr></thead><tbody>' + filasHTML + '</tbody>' + (totalesHTML ? '<tfoot>' + totalesHTML + '</tfoot>' : '') + '</table>',
    estilos,
    scriptContent,
    anchoMinimo
  };
};

// Función para exportar a PDF
export const exportarPDF = (
  cabeceras: string[],
  cuerpo: unknown[][],
  totales: unknown[],
  meta: MetaExportacion | null,
  tablaHTML?: string,
  anchoTabla?: number
): void => {
  const numColumnas = cabeceras.length;
  const anchoMinimo = Math.max(numColumnas * 120, 800);

  let tablaGenerada = tablaHTML;
  let estilos = `
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; margin: 0; padding: 15px; background: white; }
    .header { margin-bottom: 20px; page-break-inside: avoid; text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; }
    h1 { color: #000; margin: 0 0 8px 0; font-size: 22px; font-weight: bold; letter-spacing: 1px; }
    h2 { color: #000; margin: 0 0 6px 0; font-size: 18px; font-weight: bold; }
    h3 { color: #000; margin: 0 0 15px 0; font-size: 16px; font-weight: normal; }
    .meta { color: #000; font-size: 10px; margin-bottom: 10px; line-height: 1.4; text-align: center; }
    .table-container { overflow-x: auto; width: 100%; border: 1px solid #d1d5db; border-radius: 4px; }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      table-layout: auto; 
      font-size: 9px; 
    }
    th, td { 
      border: 1px solid #d1d5db; 
      padding: 4px 6px; 
      text-align: left; 
      vertical-align: top; 
      word-wrap: break-word; 
    }
    th { 
      background-color: #f9fafb; 
      font-weight: bold; 
      font-size: 8px; 
    }
    .total-row { 
      background-color: #f3f4f6; 
      font-weight: bold; 
    }
    @media print {
      @page { size: A4 landscape; margin: 0.5in; }
      body { margin: 0; padding: 10px; font-size: 8px; }
      .header { margin-bottom: 15px; padding-bottom: 10px; }
      h1 { font-size: 20px; margin-bottom: 6px; }
      h2 { font-size: 16px; margin-bottom: 4px; }
      h3 { font-size: 14px; margin-bottom: 10px; }
      .meta { font-size: 9px; margin-bottom: 8px; }
      .table-container { border: 1px solid #d1d5db; overflow: visible; }
      table { font-size: 7px; }
      th, td { padding: 2px 4px; font-size: 7px; border: 1px solid #999; }
      th { font-size: 6px; }
      table { page-break-inside: avoid; }
      tr { page-break-inside: avoid; }
    }
    @media screen {
      .table-container { max-height: 80vh; overflow: auto; }
    }
  `;
  let scriptContent = 'window.onload = function() { setTimeout(function() { window.print(); window.onafterprint = function() { window.close(); }; }, 1000); };';
  let anchoReferencia = anchoTabla ?? anchoMinimo;

  if (!tablaGenerada) {
    const resultado = generarTablaDesdeDatos(cabeceras, cuerpo, totales);
    tablaGenerada = resultado.tabla;
    estilos = resultado.estilos;
    scriptContent = resultado.scriptContent;
    anchoReferencia = resultado.anchoMinimo;
  }

  const anchoMaximo = 1100;
  const escala = anchoReferencia > anchoMaximo ? anchoMaximo / anchoReferencia : 1;
  const wrapperClase = escala < 1 ? 'table-wrapper scaled' : 'table-wrapper';
  const wrapperStyle = escala < 1
    ? `transform: scale(${escala}); transform-origin: top left; width: ${100 / escala}%;`
    : '';

  estilos += ' .table-wrapper { width: 100%; } .table-wrapper.scaled { transform-origin: top left; } .table-wrapper table { width: 100%; }';

  const htmlContent =
    '<!DOCTYPE html><html><head><meta charset="utf-8"><title>República de Honduras - Secretaría de Salud</title><style>' +
    estilos +
    '</style></head><body><div class="header"><h1>REPUBLICA DE HONDURAS</h1><h2>SECRETARIA DE SALUD</h2><h3>DEPARTAMENTO DE ESTADÍSTICA</h3><div class="meta">Generado en: ' +
    (meta?.generadoEn || 'N/A') +
    ' | Total de registros: ' +
    (meta?.totalRegistros || 0) +
    ' | Años consultados: ' +
    (meta?.anios.join(', ') || 'N/D') +
    '</div></div><div class="table-container"><div class="' +
    wrapperClase +
    '" style="' +
    wrapperStyle +
    '">' +
    tablaGenerada +
    '</div>' +
    '</div><script>' +
    scriptContent +
    '</script></body></html>';

  // Crear ventana para imprimir
  const ventanaImpresion = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
  if (ventanaImpresion) {
    ventanaImpresion.document.write(htmlContent);
    ventanaImpresion.document.close();
    ventanaImpresion.focus();
  }
};
