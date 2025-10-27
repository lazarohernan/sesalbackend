// Mapeo de códigos técnicos a nombres legibles
export const MAPEO_NOMBRES: Record<string, string> = {
  // Métricas
  'Q_AT_ENFERMERA_AUX': 'Enfermeras Auxiliares',
  'Q_AT_ENFERMERA_PRO': 'Enfermeras Profesionales',
  'Q_AT_MEDICO_GEN': 'Médicos Generales',
  'Q_AT_MEDICO_ESP': 'Médicos Especialistas',
  'MES': 'Mes',
  'TOTAL': 'Total',
  'SUMA': 'Total',
  
  // Dimensiones
  'REGION': 'Región',
  'MUNICIPIO': 'Municipio',
  'DEPARTAMENTO': 'Departamento',
  'ESTABLECIMIENTO': 'Establecimiento de Salud',
  'NIVEL_ESTABLECIMIENTO': 'Nivel de Establecimiento de Salud',
  'NIVEL_OPERATIVO': 'Nivel Operativo',
  'GRUPO_ESPECIAL': 'Grupo Especial',
  'SERVICIO': 'Servicio',
  'CONCEPTO': 'Concepto',
  'FORMULARIO': 'Formulario'
};

/**
 * Formatea un nombre técnico a uno legible para el usuario
 * @param clave - El nombre técnico (ej: "Q_AT_MEDICO_GEN" o "10 A 14 AÑOS (SUBSIGUIENTE)" o "ENERO_TOTAL")
 * @returns El nombre formateado (ej: "Médicos Generales" o "10 a 14 Años (subsiguiente)" o "Enero - Total")
 */
export const formatearNombre = (clave: string): string => {
  if (!clave) return '';
  
  // Limpiar la cadena
  let limpio = clave
    .replace(/[\r\n\t]+/g, " ")  // Eliminar caracteres de control
    .replace(/\s+/g, " ")  // Normalizar espacios múltiples
    .trim();

  // Eliminar prefijos comunes (MEDIDA X, Suma de, etc.)
  limpio = limpio.replace(/^(Suma\s+de\s+|Suma\s+|MEDIDA\s+\d+\s+)/i, "");

  // Detectar si es una columna dinámica (ej: "ENERO_TOTAL", "FEBRERO_Q_AT_ENFERMERA_PRO")
  // Patrón: VALOR_METRICA donde VALOR no es un código técnico
  const patronColumnaDinamica = /^([^_]+)_(TOTAL|Q_AT_\w+|MES|SUMA)$/i;
  const matchColumnaDinamica = limpio.match(patronColumnaDinamica);
  
  if (matchColumnaDinamica && matchColumnaDinamica[1] && matchColumnaDinamica[2]) {
    const valorColumna = matchColumnaDinamica[1]; // Ej: "ENERO", "FEBRERO"
    const codigoMetrica = matchColumnaDinamica[2]; // Ej: "TOTAL", "Q_AT_ENFERMERA_PRO"
    
    // Formatear el valor de la columna
    const valorFormateado = formatearTextoSimple(valorColumna);
    
    // Buscar el nombre legible de la métrica
    const metricaNormalizada = codigoMetrica.toUpperCase().replace(/\s+/g, '_');
    const metricaLegible = MAPEO_NOMBRES[metricaNormalizada] || formatearTextoSimple(codigoMetrica);
    
    // Retornar en formato "Valor - Métrica" (ej: "Enero - Total", "Febrero - Enfermeras Profesionales")
    return `${valorFormateado} - ${metricaLegible}`;
  }

  // Si no es columna dinámica, eliminar sufijos de métricas comunes
  // Primero con guión bajo: _TOTAL, _Q_AT_MEDICO_GEN, etc.
  limpio = limpio.replace(/_(TOTAL|Q_AT_\w+|MES|SUMA)$/i, "");
  // Luego con espacios: " TOTAL", " Q AT MEDICO GEN", etc.
  limpio = limpio.replace(/\s+(TOTAL|Q\s+AT\s+\w+(\s+\w+)*|MES|SUMA)\s*$/i, "");
  limpio = limpio.trim();

  // Buscar en el mapeo si existe una versión legible
  // Normalizar para buscar: convertir a mayúsculas y reemplazar espacios por guiones bajos
  const claveNormalizada = limpio.toUpperCase().replace(/\s+/g, '_');
  if (MAPEO_NOMBRES[claveNormalizada]) {
    return MAPEO_NOMBRES[claveNormalizada];
  }

  // Si empieza con "Q AT" o "Q_AT", es definitivamente un código técnico que no está en el mapeo
  // Formatearlo de manera genérica para códigos
  if (/^Q[\s_]AT[\s_]/i.test(limpio)) {
    // Es un código Q_AT que no está mapeado, intentar formatearlo
    const partes = limpio.split(/[\s_]+/);
    // Quitar Q y AT, quedarse con el resto
    const descripcion = partes.slice(2).join(' ');
    return descripcion
      .toLowerCase()
      .replace(/\b\w/g, (letra) => letra.toUpperCase())
      .replace(/\bAux\b/i, 'Auxiliares')
      .replace(/\bPro\b/i, 'Profesionales')
      .replace(/\bGen\b/i, 'Generales')
      .replace(/\bEsp\b/i, 'Especialistas');
  }

  // Si parece ser un texto descriptivo en mayúsculas (de catálogos), formatearlo con capitalización correcta
  // Pero NO si es un código técnico corto
  if (limpio === limpio.toUpperCase() && limpio.length > 3 && !limpio.includes('_')) {
    return formatearTextoCapitalizado(limpio);
  }

  // Si tiene guiones bajos, reemplazarlos por espacios y capitalizar
  if (limpio.includes('_')) {
    return limpio
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (letra) => letra.toUpperCase());
  }

  // Devolver tal cual si ya parece estar bien formateado
  return limpio;
};

/**
 * Formatea texto simple sin procesamiento complejo
 */
const formatearTextoSimple = (texto: string): string => {
  if (!texto) return '';
  
  const normalizado = texto.toUpperCase().replace(/\s+/g, '_');
  if (MAPEO_NOMBRES[normalizado]) {
    return MAPEO_NOMBRES[normalizado];
  }
  
  // Si es todo mayúsculas y no tiene guiones bajos, capitalizar
  if (texto === texto.toUpperCase() && !texto.includes('_')) {
    return formatearTextoCapitalizado(texto);
  }
  
  // Si tiene guiones bajos, reemplazar por espacios y capitalizar
  if (texto.includes('_')) {
    return texto
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (letra) => letra.toUpperCase());
  }
  
  return texto;
};

/**
 * Formatea texto en mayúsculas a capitalización correcta
 * Maneja casos especiales como números, siglas, y palabras específicas
 */
const formatearTextoCapitalizado = (texto: string): string => {
  // Palabras que deben ir en minúsculas (excepto al inicio)
  const minusculas = new Set(['a', 'de', 'del', 'la', 'las', 'los', 'el', 'en', 'y', 'o', 'u']);
  
  // Palabras que deben ir en mayúsculas
  const mayusculas = new Set(['sg', 'ucs', 'vih', 'vif', 'diu']);
  
  const palabras = texto.toLowerCase().split(' ');
  
  return palabras.map((palabra, index) => {
    // Si está vacía, retornar tal cual
    if (!palabra) return palabra;
    
    // Si es un número o contiene números al inicio, mantener formato especial
    if (/^\d/.test(palabra)) {
      // Para casos como "10a14" o "5a9", separar correctamente
      return palabra.replace(/(\d+)a(\d+)/i, '$1 a $2');
    }
    
    // Mantener contenido entre paréntesis en minúsculas excepto la primera letra
    if (palabra.startsWith('(') && palabra.endsWith(')')) {
      const contenido = palabra.slice(1, -1);
      return '(' + contenido.charAt(0).toUpperCase() + contenido.slice(1).toLowerCase() + ')';
    }
    
    // Si está entre paréntesis pero solo abre
    if (palabra.startsWith('(')) {
      return '(' + palabra.slice(1).charAt(0).toUpperCase() + palabra.slice(2).toLowerCase();
    }
    
    // Si está entre paréntesis pero solo cierra
    if (palabra.endsWith(')')) {
      return palabra.slice(0, -1).toLowerCase() + ')';
    }
    
    // Verificar si es una sigla que debe ir en mayúsculas
    if (mayusculas.has(palabra.toLowerCase())) {
      return palabra.toUpperCase();
    }
    
    // Si es una palabra corta que debe ir en minúsculas (excepto al inicio)
    if (index > 0 && minusculas.has(palabra.toLowerCase())) {
      return palabra.toLowerCase();
    }
    
    // Capitalizar primera letra
    return palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase();
  }).join(' ');
};

/**
 * Formatea una cabecera de tabla
 * Alias de formatearNombre para mantener compatibilidad
 */
export const formatearCabecera = formatearNombre;

