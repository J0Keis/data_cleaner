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
]

// Índice pre-computado: key lowercase, compact sin espacios, y display original
const normalizedIndex = COMUNAS_REFERENCIA.map((name) => ({
  display:  name,
  key:      name.toLowerCase(),
  compact:  name.toLowerCase().replace(/\s+/g, ''),
}))

// Lookup O(1) para coincidencia exacta (caso más frecuente con datos ya normalizados)
const exactLookup = new Map<string, string>(
  normalizedIndex.map((e) => [e.key, e.display])
)

/**
 * Levenshtein con terminación temprana: si la distancia mínima posible de la
 * fila actual ya supera `maxDist`, se aborta en O(1) en lugar de continuar O(m×n).
 */
export function levenshtein(a: string, b: string, maxDist = Infinity): number {
  const m = a.length
  const n = b.length

  // Diferencia de longitud ya supera el umbral → imposible estar dentro del límite
  if (Math.abs(m - n) > maxDist) return maxDist + 1

  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i)

  for (let i = 1; i <= m; i++) {
    let prev = dp[0]
    dp[0] = i
    let rowMin = i // mínimo valor de la fila actual (para terminación temprana)

    for (let j = 1; j <= n; j++) {
      const temp = dp[j]
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost)
      prev = temp
      if (dp[j] < rowMin) rowMin = dp[j]
    }

    // Si el menor valor de la fila ya supera maxDist, no puede mejorar
    if (rowMin > maxDist) return maxDist + 1
  }
  return dp[n]
}

/**
 * Corrige una comuna usando coincidencia exacta (O(1)) primero,
 * luego Levenshtein con pre-filtros de longitud y terminación temprana.
 *
 * Nota: esta función es pura. El cache de resultados se gestiona en
 * normalizer.ts para evitar estado global entre requests.
 */
export function fuzzyCorrectComuna(value: string): { corrected: string; matched: boolean } {
  const key = value.toLowerCase()

  // 1. Coincidencia exacta: O(1), cubre la mayoría de datos ya limpios
  const exactDisplay = exactLookup.get(key)
  if (exactDisplay !== undefined) {
    return { corrected: exactDisplay, matched: exactDisplay !== value }
  }

  const compact   = key.replace(/\s+/g, '')
  const threshold = Math.min(2, Math.floor(Math.max(key.length, 1) * 0.2))

  let best: { display: string; distance: number } | null = null

  for (const entry of normalizedIndex) {
    // Pre-filtro de longitud: descarta entradas que no pueden estar dentro del umbral
    if (Math.abs(key.length - entry.key.length) > threshold) {
      // Intenta igualmente con compact (sin espacios puede tener distinta longitud)
      if (Math.abs(compact.length - entry.compact.length) > threshold) continue
      const d2 = levenshtein(compact, entry.compact, threshold)
      if (d2 <= threshold && (!best || d2 < best.distance)) {
        best = { display: entry.display, distance: d2 }
        if (d2 === 0) break
      }
      continue
    }

    // Comparación con key completo (con espacios)
    const d1 = levenshtein(key, entry.key, threshold)
    if (d1 <= threshold) {
      if (!best || d1 < best.distance) {
        best = { display: entry.display, distance: d1 }
        if (d1 === 0) break // distancia 0 → coincidencia perfecta, no puede mejorar
      }
      continue
    }

    // Si key no coincide, intenta compact (maneja diferencias de espaciado)
    if (Math.abs(compact.length - entry.compact.length) <= threshold) {
      const d2 = levenshtein(compact, entry.compact, threshold)
      if (d2 <= threshold && (!best || d2 < best.distance)) {
        best = { display: entry.display, distance: d2 }
      }
    }
  }

  if (best && best.display !== value) {
    return { corrected: best.display, matched: true }
  }

  return { corrected: value, matched: false }
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
