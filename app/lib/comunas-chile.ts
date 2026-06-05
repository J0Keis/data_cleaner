/**
 * Lista de referencia de comunas chilenas (formato normalizado sin tildes).
 * Usada para fuzzy matching con distancia Levenshtein.
 */

export const COMUNAS_REFERENCIA: string[] = [
  'Algarrobo', 'Alhue', 'Alto Biobio', 'Alto Del Carmen', 'Alto Hospicio',
  'Ancud', 'Andacollo', 'Angol', 'Antofagasta', 'Antuco', 'Arauco', 'Arica',
  'Aysen', 'Buin', 'Bulnes', 'Cabildo', 'Cabo De Hornos', 'Cabrero', 'Calama',
  'Calbuco', 'Caldera', 'Calera De Tango', 'Calle Larga', 'Camarones',
  'Camina', 'Canela', 'Canete', 'Carahue', 'Cartagena', 'Casablanca', 'Castro',
  'Catemu', 'Cauquenes', 'Cerrillos', 'Cerro Navia', 'Chaiten', 'Chanaral',
  'Chanco', 'Chepica', 'Chiguayante', 'Chillan', 'Chillan Viejo', 'Chimbarongo',
  'Cholchol', 'Chonchi', 'Cisnes', 'Cobquecura', 'Cochamo', 'Cochrane',
  'Codegua', 'Coelemu', 'Coihueco', 'Coinco', 'Colbun', 'Colchane', 'Colina',
  'Collipulli', 'Coltauco', 'Combarbala', 'Concepcion', 'Conchali', 'Concon',
  'Constitucion', 'Contulmo', 'Copiapo', 'Coquimbo', 'Coronel', 'Corral',
  'Coyhaique', 'Cunco', 'Curacautin', 'Curacavi', 'Curaco De Velez',
  'Curanilahue', 'Curarrehue', 'Curepto', 'Curico', 'Dalcahue', 'Diego De Almagro',
  'Donihue', 'El Bosque', 'El Carmen', 'El Monte', 'El Quisco', 'El Tabo',
  'Empedrado', 'Ercilla', 'Estacion Central', 'Florida', 'Freire', 'Freirina',
  'Fresia', 'Frutillar', 'Futaleufu', 'Futrono', 'Galvarino', 'General Lagos',
  'Gorbea', 'Graneros', 'Guaitecas', 'Hijuelas', 'Hualaihue', 'Hualane',
  'Hualpen', 'Hualqui', 'Huara', 'Huasco', 'Huechuraba', 'Illapel', 'Independencia',
  'Iquique', 'Isla De Maipo', 'Isla De Pascua', 'Juan Fernandez', 'La Cisterna',
  'La Cruz', 'La Estrella', 'La Florida', 'La Granja', 'La Higuera', 'La Ligua',
  'La Pintana', 'La Reina', 'La Serena', 'La Union', 'Lago Ranco', 'Lago Verde',
  'Laguna Blanca', 'Laja', 'Lampa', 'Lanco', 'Las Cabras', 'Las Condes',
  'Lautaro', 'Lebu', 'Licanten', 'Limache', 'Linares', 'Litueche', 'Llaillay',
  'Llanquihue', 'Llay Llay', 'Lo Barnechea', 'Lo Espejo', 'Lo Prado', 'Lolol',
  'Loncoche', 'Longavi', 'Lonquimay', 'Los Alamos', 'Los Andes', 'Los Angeles',
  'Los Lagos', 'Los Muermos', 'Los Sauces', 'Los Vilos', 'Lota', 'Lumaco',
  'Machali', 'Macul', 'Mafil', 'Maipu', 'Malloa', 'Marchihue', 'Maria Elena',
  'Maria Pinto', 'Mariquina', 'Maule', 'Maullin', 'Mejillones', 'Melipeuco',
  'Melipilla', 'Molina', 'Monte Patria', 'Mostazal', 'Mulchen', 'Nacimiento',
  'Nancagua', 'Natales', 'Negrete', 'Ninhue', 'Niquen', 'Nogales', 'Nueva Imperial',
  'Nunoa', 'O Higgins', 'Olivar', 'Ollague', 'Olmue', 'Osorno', 'Ovalle',
  'Padre Hurtado', 'Padre Las Casas', 'Paihuano', 'Paillaco', 'Paine', 'Palena',
  'Palmilla', 'Panguipulli', 'Panquehue', 'Papudo', 'Paredones', 'Parral',
  'Pedro Aguirre Cerda', 'Pelarco', 'Pelluhue', 'Pemuco', 'Penaflor', 'Penalolen',
  'Pencahue', 'Penco', 'Peralillo', 'Perquenco', 'Petorca', 'Peumo', 'Pica',
  'Pichidegua', 'Pichilemu', 'Pinto', 'Pirque', 'Pitrufquen', 'Placilla',
  'Portezuelo', 'Porvenir', 'Pozo Almonte', 'Primavera', 'Providencia', 'Puchuncavi',
  'Pucon', 'Pudahuel', 'Puente Alto', 'Puerto Montt', 'Puerto Octay', 'Puerto Varas',
  'Pumanque', 'Punitaqui', 'Punta Arenas', 'Puqueldon', 'Puren', 'Purranque',
  'Putaendo', 'Putre', 'Puyehue', 'Queilen', 'Quellon', 'Quemchi', 'Quilaco',
  'Quilicura', 'Quilleco', 'Quillon', 'Quillota', 'Quilpue', 'Quinchao', 'Quinta De Tilcoco',
  'Quinta Normal', 'Quintero', 'Quirihue', 'Rancagua', 'Ranquil', 'Rauco',
  'Recoleta', 'Renaico', 'Renca', 'Rengo', 'Requinoa', 'Retiro', 'Rinconada',
  'Rio Bueno', 'Rio Claro', 'Rio Hurtado', 'Rio Ibanez', 'Rio Negro', 'Rio Verde',
  'Romeral', 'Saavedra', 'Sagrada Familia', 'Salamanca', 'San Antonio', 'San Bernardo',
  'San Carlos', 'San Clemente', 'San Esteban', 'San Fabian', 'San Fernando',
  'San Francisco De Mostazal', 'San Gregorio', 'San Ignacio', 'San Javier',
  'San Joaquin', 'San Jose De Maipo', 'San Juan De La Costa', 'San Miguel',
  'San Nicolas', 'San Pablo', 'San Pedro', 'San Pedro De Atacama', 'San Pedro De La Paz',
  'San Rafael', 'San Ramon', 'San Rosendo', 'San Vicente', 'Santa Barbara',
  'Santa Cruz', 'Santa Juana', 'Santa Maria', 'Santiago', 'Santo Domingo',
  'Sierra Gorda', 'Talagante', 'Talca', 'Talcahuano', 'Taltal', 'Temuco',
  'Teno', 'Teodoro Schmidt', 'Tierra Amarilla', 'Tiltil', 'Timaukel', 'Tirua',
  'Tocopilla', 'Tolten', 'Tome', 'Torres Del Paine', 'Tortel', 'Traiguen',
  'Trehuaco', 'Tucapel', 'Valdivia', 'Vallenar', 'Valparaiso', 'Vichuquen',
  'Victoria', 'Vicuna', 'Vilcun', 'Villa Alegre', 'Villa Alemana', 'Villarrica',
  'Vina Del Mar', 'Vitacura', 'Yerbas Buenas', 'Yumbel', 'Yungay', 'Zapallar',
  // Comunas que estaban en la API oficial pero faltaban aquí (respaldo offline
  // y buscador). En línea, la lista se completa dinámicamente desde la API.
  'Antartica', 'Calera', 'Chile Chico', 'Navidad', "O'Higgins", 'Paiguano',
  'San Felipe', 'Til Til',
]

// Índice pre-computado (solo para el buscador `sugerirComunas`): key lowercase,
// compact sin espacios, y display original.
const normalizedIndex = COMUNAS_REFERENCIA.map((name) => ({
  display:  name,
  key:      name.toLowerCase(),
  compact:  name.toLowerCase().replace(/\s+/g, ''),
}))

/**
 * Distancia de edición Damerau-Levenshtein (variante OSA) con terminación
 * temprana. A diferencia de Levenshtein puro, una transposición de caracteres
 * ADYACENTES cuenta como UNA sola edición. Esto es clave porque el typo más
 * común al teclear es justamente intercambiar dos letras seguidas:
 *   "Arauoc"→"Arauco", "Victorai"→"Victoria", "cuirco"→"Curico"
 * (Levenshtein los considera distancia 2 y se escapaban del umbral; con OSA
 * son distancia 1 y se corrigen.)
 *
 * Si la distancia mínima posible de la fila ya supera `maxDist`, aborta antes.
 * Se conserva el nombre `levenshtein` por compatibilidad con los llamadores.
 */
export function levenshtein(a: string, b: string, maxDist = Infinity): number {
  const m = a.length
  const n = b.length

  // Diferencia de longitud ya supera el umbral → imposible estar dentro del límite
  if (Math.abs(m - n) > maxDist) return maxDist + 1
  if (m === 0) return n
  if (n === 0) return m

  // Tres filas rotativas: i-2 (para transposición), i-1 y la actual.
  let prevPrev: number[] = new Array(n + 1).fill(0)
  let prev:     number[] = Array.from({ length: n + 1 }, (_, j) => j)
  let curr:     number[] = new Array(n + 1).fill(0)

  for (let i = 1; i <= m; i++) {
    curr[0] = i
    let rowMin = i // mínimo de la fila actual (para terminación temprana)

    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      let v = Math.min(
        prev[j] + 1,         // deleción
        curr[j - 1] + 1,     // inserción
        prev[j - 1] + cost,  // sustitución
      )
      // Transposición de caracteres adyacentes (Damerau-OSA)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        v = Math.min(v, prevPrev[j - 2] + 1)
      }
      curr[j] = v
      if (v < rowMin) rowMin = v
    }

    if (rowMin > maxDist) return maxDist + 1

    // Rotar filas: prevPrev ← prev ← curr ← (buffer reutilizado)
    const tmp = prevPrev
    prevPrev = prev
    prev = curr
    curr = tmp
  }

  return prev[n]
}

/**
 * Alias de comunas: nombres comunes o grafías alternativas → nombre oficial.
 * Clave en forma normalizada (minúsculas, sin tildes). Se usa cuando el nombre
 * popular difiere del oficial de la API (ej. la gente escribe "La Calera" pero
 * la comuna oficial es "Calera").
 */
const ALIAS_COMUNAS: Record<string, string> = {
  'la calera':                 'Calera',
  'san francisco de mostazal': 'Mostazal',
  // Grafías alternativas de una misma comuna → nombre oficial de la API
  // (evita que aparezcan dos filas para la misma comuna).
  'tiltil':                    'Til Til',
  'llay llay':                 'Llaillay',
  'llay-llay':                 'Llaillay',
  'paihuano':                  'Paiguano',
  'o higgins':                 "O'Higgins",
}

/** Clave de comparación: sin tildes, minúsculas, espacios colapsados. */
function claveComuna(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
}

/** Forma de salida: sin tildes y con Cada Palabra Capitalizada. */
function aDisplay(name: string): string {
  return name
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
    .join(' ')
    .trim()
}

export type CorrectorComunas = (value: string) => { corrected: string; matched: boolean }

/**
 * Construye un corrector ortográfico a partir de CUALQUIER lista de comunas
 * (la de la API en línea, o la local como respaldo). Usa coincidencia exacta
 * O(1) primero y luego Damerau-Levenshtein con pre-filtros de longitud.
 * Es puro: cada request crea el suyo, sin estado global compartido.
 */
export function crearCorrectorComunas(nombres: string[]): CorrectorComunas {
  const index: { display: string; key: string; compact: string }[] = []
  const exact = new Map<string, string>()

  const agregar = (display: string, key: string) => {
    if (!key || exact.has(key)) return // el primero gana (la API tiene prioridad)
    exact.set(key, display)
    index.push({ display, key, compact: key.replace(/\s+/g, '') })
  }

  for (const name of nombres) agregar(aDisplay(name), claveComuna(name))

  // Aliases con prioridad: unifican grafías alternativas al nombre canónico,
  // sobrescribiendo cualquier entrada previa con esa misma clave.
  for (const [alias, canonical] of Object.entries(ALIAS_COMUNAS)) {
    const k = claveComuna(alias)
    const disp = aDisplay(canonical)
    exact.set(k, disp)
    const existente = index.find((e) => e.key === k)
    if (existente) existente.display = disp
    else index.push({ display: disp, key: k, compact: k.replace(/\s+/g, '') })
  }

  return (value: string): { corrected: string; matched: boolean } => {
    const key = claveComuna(value)

    // 1. Coincidencia exacta O(1)
    const exactDisplay = exact.get(key)
    if (exactDisplay !== undefined) {
      return { corrected: exactDisplay, matched: exactDisplay !== value }
    }

    const compact   = key.replace(/\s+/g, '')
    const threshold = Math.min(2, Math.floor(Math.max(key.length, 1) * 0.2))
    let best: { display: string; distance: number } | null = null

    for (const entry of index) {
      // Pre-filtro de longitud
      if (Math.abs(key.length - entry.key.length) > threshold) {
        if (Math.abs(compact.length - entry.compact.length) > threshold) continue
        const d2 = levenshtein(compact, entry.compact, threshold)
        if (d2 <= threshold && (!best || d2 < best.distance)) {
          best = { display: entry.display, distance: d2 }
          if (d2 === 0) break
        }
        continue
      }

      const d1 = levenshtein(key, entry.key, threshold)
      if (d1 <= threshold) {
        if (!best || d1 < best.distance) {
          best = { display: entry.display, distance: d1 }
          if (d1 === 0) break
        }
        continue
      }

      // Compact maneja diferencias de espaciado ("l acalera" → "La Calera")
      if (Math.abs(compact.length - entry.compact.length) <= threshold) {
        const d2 = levenshtein(compact, entry.compact, threshold)
        if (d2 <= threshold && (!best || d2 < best.distance)) {
          best = { display: entry.display, distance: d2 }
        }
      }
    }

    if (best && best.display !== value) return { corrected: best.display, matched: true }
    return { corrected: value, matched: false }
  }
}

/**
 * Corrector por defecto, construido con la lista local de referencia. Sirve de
 * respaldo (API caída) y para usos sueltos. La ruta /api/process construye uno
 * con la lista completa de la API mediante `crearCorrectorComunas`.
 * Es puro respecto al estado entre requests; el cache se gestiona en normalizer.ts.
 */
const correctorPorDefecto = crearCorrectorComunas(COMUNAS_REFERENCIA)

export function fuzzyCorrectComuna(value: string): { corrected: string; matched: boolean } {
  return correctorPorDefecto(value)
}

/**
 * Sugiere comunas por similitud para el buscador individual (Parte I, criterio 7).
 * Combina coincidencia por prefijo, subcadena y distancia Levenshtein.
 * Ej: "florida" → ["Florida", "La Florida"]; "temuko" → ["Temuco"].
 */
export function sugerirComunas(query: string, limit = 6): string[] {
  const q = query
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
  if (!q) return []

  const scored: { display: string; score: number }[] = []

  for (const entry of normalizedIndex) {
    const key = entry.key
    let score: number
    if (key === q)              score = 0          // coincidencia exacta
    else if (key.startsWith(q)) score = 1          // empieza con la consulta
    else if (key.includes(q))   score = 2          // contiene la consulta
    else {
      const d = levenshtein(q, key, 3)             // typo cercano
      if (d <= 3) score = 3 + d
      else continue
    }
    scored.push({ display: entry.display, score })
  }

  scored.sort((a, b) => a.score - b.score || a.display.localeCompare(b.display, 'es'))
  return scored.slice(0, limit).map((s) => s.display)
}
