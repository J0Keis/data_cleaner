'use client'

import { useEffect, useRef } from 'react'

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

  useEffect(() => {
    if (!containerRef.current || mapInstRef.current) return

    import('leaflet').then((L) => {
      // Fix icono por defecto de Leaflet con webpack/Next.js
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      const map = L.map(containerRef.current!, {
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
      addMarkers(L, map, lugares)
    })

    return () => {
      mapInstRef.current?.remove()
      mapInstRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-dibujar marcadores cuando cambia la lista de lugares
  useEffect(() => {
    const map = mapInstRef.current
    if (!map) return
    import('leaflet').then((L) => {
      map.eachLayer((layer) => { if (layer instanceof L.Marker) map.removeLayer(layer) })
      addMarkers(L, map, lugares)
    })
  }, [lugares])

  return (
    <div className="rounded-xl overflow-hidden border border-teal-100 shadow-sm">
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
      />
      <div ref={containerRef} style={{ height: '500px', width: '100%' }} />
    </div>
  )
}

function addMarkers(
  L: typeof import('leaflet'),
  map: import('leaflet').Map,
  lugares: LugarMapa[],
) {
  if (lugares.length === 0) return
  const bounds: [number, number][] = []

  lugares.forEach((lugar) => {
    L.marker([lugar.lat, lugar.lon])
      .addTo(map)
      .bindPopup(L.popup({ maxWidth: 220 }).setContent(buildPopupContent(lugar)))
    bounds.push([lugar.lat, lugar.lon])
  })

  map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 })
}
