'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, Globe2, Crosshair } from 'lucide-react'

interface LugarMapa {
  id: string
  nombre: string
  lat: number
  lon: number
  pais?: string | null
  ciudad?: string | null
}

interface Props {
  lugares: LugarMapa[]
}

// Límites del mundo: impide que el mapa se repita al alejarse
const WORLD_BOUNDS: [[number, number], [number, number]] = [[-85, -180], [85, 180]]

function buildPopupContent(lugar: LugarMapa): string {
  return `
    <div style="min-width:170px;font-family:sans-serif">
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#0f172a">${lugar.nombre}</p>
      ${lugar.pais   ? `<p style="margin:0;font-size:11px;color:#475569">${lugar.pais}</p>` : ''}
      ${lugar.ciudad ? `<p style="margin:0;font-size:11px;color:#94a3b8">${lugar.ciudad}</p>` : ''}
      <p style="margin:4px 0 0;font-size:10px;color:#cbd5e1;font-family:monospace">
        ${lugar.lat.toFixed(4)}, ${lugar.lon.toFixed(4)}
      </p>
    </div>
  `
}

export default function MapaLugares({ lugares }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapInstRef   = useRef<import('leaflet').Map | null>(null)
  const leafletRef   = useRef<typeof import('leaflet') | null>(null)
  // id del lugar → marcador, para poder centrar y abrir su popup desde la lista
  const markersRef   = useRef<Map<string, import('leaflet').Marker>>(new Map())
  const [activoId, setActivoId] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapInstRef.current) return

    const markerStore = markersRef.current
    // Evita la doble inicialización en dev (StrictMode monta→desmonta→monta y
    // Fast Refresh): como import('leaflet') es asíncrono, sin este flag dos
    // callbacks pueden llamar L.map() sobre el mismo contenedor.
    let cancelled = false

    import('leaflet').then((L) => {
      const container = containerRef.current
      // Si el efecto ya se limpió o ya hay un mapa, no inicializar otro.
      if (cancelled || mapInstRef.current || !container) return
      leafletRef.current = L
      // Fix icono por defecto de Leaflet con webpack/Next.js
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      const map = L.map(container, {
        center:              [20, 10],
        zoom:                3,
        minZoom:             2,          // no permite alejarse más que el mundo completo
        maxZoom:             17,
        maxBounds:           WORLD_BOUNDS,
        maxBoundsViscosity:  1.0,        // el mapa "rebota" al llegar al borde
        worldCopyJump:       false,
      })
      mapInstRef.current = map

      // Tiles CartoDB Positron — diseño limpio, sin API key, gratuito
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · © <a href="https://carto.com/">CARTO</a>',
          subdomains:  'abcd',
          maxZoom:     19,
          noWrap:      true,             // impide que las tiles se repitan horizontalmente
        },
      ).addTo(map)

      // Forzar recálculo de tamaño por si el contenedor no tenía altura al montar
      setTimeout(() => map.invalidateSize(), 50)

      // Dibujar marcadores iniciales
      drawMarkers(L, map, markerStore, lugares)
    })

    return () => {
      cancelled = true
      mapInstRef.current?.remove()
      mapInstRef.current = null
      markerStore.clear()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-dibujar marcadores cuando cambia la lista de lugares
  useEffect(() => {
    const map = mapInstRef.current
    const L = leafletRef.current
    if (!map || !L) return
    drawMarkers(L, map, markersRef.current, lugares)
    setActivoId(null)
  }, [lugares])

  // "Llegar" a un lugar: vuela hacia él y abre su popup
  function irALugar(lugar: LugarMapa) {
    const map = mapInstRef.current
    if (!map) return
    setActivoId(lugar.id)
    map.flyTo([lugar.lat, lugar.lon], 13, { duration: 1.2 })
    const marker = markersRef.current.get(lugar.id)
    if (marker) {
      // esperar a que termine el vuelo antes de abrir el popup
      setTimeout(() => marker.openPopup(), 1200)
    }
  }

  // Volver a la vista general con todos los marcadores visibles
  function verTodos() {
    const map = mapInstRef.current
    if (!map || lugares.length === 0) return
    setActivoId(null)
    map.closePopup()
    map.fitBounds(lugares.map((l) => [l.lat, l.lon]), { padding: [50, 50], maxZoom: 13 })
  }

  return (
    <div className="grid md:grid-cols-[280px_1fr]">
      {/* ── Lista de lugares (sincronizada con el mapa) ── */}
      <div className="flex flex-col border-b md:border-b-0 md:border-r border-teal-50 bg-teal-50/20">
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-teal-50">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Globe2 className="w-3.5 h-3.5 text-teal-600" />
            {lugares.length} lugares
          </div>
          <button
            onClick={verTodos}
            disabled={lugares.length === 0}
            className="flex items-center gap-1 text-[11px] text-teal-600 hover:text-teal-800 disabled:opacity-40"
            title="Centrar el mapa para ver todos los lugares"
          >
            <Crosshair className="w-3 h-3" />
            Ver todos
          </button>
        </div>

        <ul className="max-h-[140px] md:max-h-[460px] overflow-y-auto divide-y divide-teal-50">
          {lugares.length === 0 ? (
            <li className="px-4 py-6 text-center text-xs text-slate-400">
              No hay lugares con georreferencia
            </li>
          ) : (
            lugares.map((l) => (
              <li key={l.id}>
                <button
                  onClick={() => irALugar(l)}
                  className={`flex w-full items-start gap-2 px-4 py-2.5 text-left transition-colors ${
                    activoId === l.id ? 'bg-teal-100/70' : 'hover:bg-teal-50'
                  }`}
                >
                  <MapPin
                    className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                      activoId === l.id ? 'text-teal-700' : 'text-teal-400'
                    }`}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-800">{l.nombre}</span>
                    {(l.pais || l.ciudad) && (
                      <span className="block truncate text-[11px] text-slate-400">
                        {[l.ciudad, l.pais].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* ── Mapa ── */}
      <div className="relative">
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
        />
        <div ref={containerRef} style={{ height: '500px', width: '100%' }} />
      </div>
    </div>
  )
}

function drawMarkers(
  L: typeof import('leaflet'),
  map: import('leaflet').Map,
  store: Map<string, import('leaflet').Marker>,
  lugares: LugarMapa[],
) {
  // Limpiar marcadores anteriores
  map.eachLayer((layer) => { if (layer instanceof L.Marker) map.removeLayer(layer) })
  store.clear()

  if (lugares.length === 0) return
  const bounds: [number, number][] = []

  lugares.forEach((lugar) => {
    const marker = L.marker([lugar.lat, lugar.lon])
      .addTo(map)
      .bindPopup(L.popup({ maxWidth: 220 }).setContent(buildPopupContent(lugar)))
    store.set(lugar.id, marker)
    bounds.push([lugar.lat, lugar.lon])
  })

  map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 })
}
