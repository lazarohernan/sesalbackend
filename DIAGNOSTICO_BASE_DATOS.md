# Diagnóstico de base de datos y reportes dinámicos

## Resumen del entorno analizado
- Base local utilizada: `sesal_historico` (MySQL 9.4.0 en macOS arm64).
- Cliente verificado con `mysql --version` y acceso validado listando bases (`SHOW DATABASES`).
- Backend actual consume variables de entorno `MYSQL_*` con puerto por defecto `4000`.
- Dump SQL investigado: `archivos_excluidos/database_backup/20250928_145636/schema.sql`.
- Archivo Access consultado: `archivos_excluidos/BASE.mdb` (visualizado con `mdb-tools`).

## Tablas y columnas clave identificadas
- **Tablas de detalle mensuales** `AT2_BDT_MENSUAL_DETALLE_20XX`
  - Métricas disponibles: `Q_AT_ENFERMERA_AUX`, `Q_AT_ENFERMERA_PRO`, `Q_AT_MEDICO_GEN`, `Q_AT_MEDICO_ESP`.
  - Dimensiones directas: `N_ANIO`, `N_MES`, `F_ATENCION`, `C_SERVICIO`, `C_CONCEPTO`, `V_FORMULARIO`, `C_US`.
- **Catálogos de conceptos**
  - `AT2_BDR_CONCEPTOS`: descripción corta/larga por `V_FORMULARIO`, `C_CONCEPTO`, `C_FORM_BLOQUE`.
  - `AT2_BDR_CONCEPTOS_GE`: agrega `GRUPO_ESPECIAL` ligado a formulario y concepto.
- **Catálogos geográficos y de establecimientos**
  - `BAS_BDR_US`: unidades de salud (`C_US`, `V_US`, `D_US`, `C_REGION`, `C_DEPARTAMENTO`, `C_MUNICIPIO`, `C_NIVEL_US`).
  - `BAS_BDR_REGIONES`, `BAS_BDR_DEPARTAMENTOS`, `BAS_BDR_MUNICIPIOS`, `SYS_MESES`.
  - `BAS_BDR_NIVELES_US`: mapea `C_NIVEL_US` a descripciones y siglas (niveles de establecimiento/servicio).

## Campos solicitados pero no encontrados textualmente
- No existen columnas llamadas exactamente `CONCEPTO_ORDENADO`, `ESTABLECIMIENTO`, `NIVEL_ESTABLECIMIENTO`, `NIVELOPERATIVO`, `REGION`, `SERVICIO` en MySQL ni en `BASE.mdb`.
- Tampoco se detecta `CONCEPTO_ORDENADO` en el dump SQL ni en el archivo Access.

## Equivalencias sugeridas para cubrir campos faltantes
- `ESTABLECIMIENTO` → usar `BAS_BDR_US` (`D_US` como nombre, `C_US`/`V_US` como identificadores) y exponer alias.
- `NIVEL_ESTABLECIMIENTO` / `NIVELOPERATIVO` → derivar desde `BAS_BDR_NIVELES_US` (`D_NIVEL_US`, `D_NIVEL_US_SIGLA`) enlazando por `C_NIVEL_US`.
- `REGION` → `BAS_BDR_REGIONES.D_REGION` unido por `C_REGION` presente en `BAS_BDR_US` y tablas detalle.
- `SERVICIO` → partir de `AT2_BDT_MENSUAL_DETALLE_20XX.C_SERVICIO` y enlazar con el catálogo correspondiente (probable `BAS_BDR_NIVELES_US` o tabla de servicios en otra fuente).
- `CONCEPTO_ORDENADO` → no existe; se puede construir ordenamiento ascendente usando `C_CONCEPTO` o un catálogo externo si se requiere jerarquía adicional.

## Viabilidad de reportes estilo tabla dinámica (Excel)
- Se cuenta con métricas acumulables por unidad de salud y dimensiones suficientes (tiempo, región, servicio, formulario, concepto).
- Propuesta de arquitectura:
  1. Construir un catálogo de dimensiones y métricas en el backend (listas blancas de campos).
  2. Implementar un generador de consultas parametrizado que reciba selección de filtros/filas/columnas/valores y arme `GROUP BY` dinámicos con agregaciones `SUM`.
  3. En el frontend, usar un componente drag & drop (pivot builder) que traduzca las selecciones a llamadas API.
  4. Permitir exportaciones a Excel/PDF reutilizando librerías existentes (`jspdf`, potencialmente `xlsx`).
- Consideraciones: validar entradas para evitar SQL injection, añadir límites de filas/rangos de fechas y optimizar con índices o vistas materializadas.

## Observaciones sobre `BASE.mdb`
- Contiene únicamente catálogos base equivalentes a los ya migrados a MySQL (`AT2_BDR_CONCEPTOS`, `BAS_BDR_US`, etc.).
- No aporta columnas nuevas distintas a las presentes en MySQL; confirma que los campos faltantes deben derivarse o calcularse.

## Hallazgos del Excel `AT2_2012_2025 A_LA_FECHA.xlsx`
- Hojas relevantes detectadas: `Hoja1`, `Conceptos logros`, `Conceptos SDIS`, `Hoja3`, `Hoja11`, `Hoja7` (otras hojas sin datos significativos o pivote vacías).
- Contiene tablas dinámicas exportadas desde Excel con métricas agregadas por año, región y nivel operativo.
- Se identificaron 58 descripciones de conceptos con formato código + texto (ej. `01 Menores de 1 Mes (primera vez)`, `002 Segundo Nivel de Atención`).
- Persisten ausentes los términos exactos `CONCEPTO_ORDENADO`, `ESTABLECIMIENTO`, `NIVEL_ESTABLECIMIENTO`, `SERVICIO`, `REGION` en el contenido textual; solo aparece `NIVELOPERATIVO` como título de filtros.
- El libro confirma la nomenclatura de conceptos y regiones sanitarias, útil para validar catálogos pero no aporta campos nuevos adicionales a los presentes en MySQL.

## Tablas auxiliares creadas en `sesal_historico`
- Se generaron catálogos auxiliares para preservar el respaldo original y disponer de nombres amigables:
  - `cat_conceptos`, `cat_concepto_ordenado` (50 y 53 registros respectivamente).
  - `cat_establecimientos` (1,753 registros), `cat_grupo_especial` (46 registros).
  - `cat_nivel_establecimiento`, `cat_nivel_operativo`, `cat_formularios`, `cat_regiones` con los valores de los pivotes.
- Cada tabla usa claves `codigo`/`nombre` únicas y columnas de texto ampliadas (en establecimientos se amplió a `TEXT` para soportar nombres largos).
- Los datos se cargaron desde `catalog_imports/clean/*.csv` usando `LOAD DATA LOCAL INFILE`, tras habilitar `local_infile` y ajustar terminaciones `\r\n` para los CSV exportados.
- Estas tablas permiten construir joins con la data histórica sin alterar los catálogos originales; sirven como referencia y pueden alimentar el constructor de filtros.

## Próximos pasos recomendados
- Confirmar catálogo oficial para `C_SERVICIO` (buscar en dumps adicionales o documentación funcional).
- Documentar un mapa de joins estándar para que el generador de reportes pueda reutilizarlo.
- Definir naming amigable (alias) para exponer campos equivalentes a los solicitados por los usuarios finales.
- Evaluar creación de vistas o materializaciones parciales por año para acelerar agregaciones cuando se integre el pivot builder.


