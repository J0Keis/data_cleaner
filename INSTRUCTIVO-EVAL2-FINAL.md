# Instructivo — Evaluación 2 · Parte Final · proyecto `data-cleaner`

> **Para Claude Code.** Objetivo único: cerrar las brechas del proyecto frente a la
> rúbrica oficial y dejarlo en condiciones de obtener **100/100** en la defensa.
> Asignatura: **INACAP — Arquitectura y Almacenamiento de Datos**. Docente: Hernán R. Sáez Talavera.
> Evaluación 2 — Parte 3 (final). Vale **35% de la Nota 2**. Puntaje ideal: **100 pts**.

---

## 0. Cómo usar este documento (LEER PRIMERO)

**Regla de oro: VERIFICAR antes de implementar.** Gran parte del proyecto ya está hecho
(ver §1). Para cada requisito de la rúbrica este instructivo te da:

- 🔍 **Verificar** — qué revisar en el código real antes de tocar nada.
- ✅ **Criterio de aceptación** — qué debe cumplirse para sumar el punto.
- 🛠 **Si falta** — qué implementar, en qué archivos.

**No reescribas lo que ya funciona.** Si al verificar el criterio ya se cumple, marca el
ítem como ✅ y sigue. Solo implementa lo que esté ausente o incompleto frente a la rúbrica.

**Entorno y restricciones duras (no negociables):**
- SO de desarrollo: **Windows 11 / PowerShell**. Evita comandos estilo Unix (`&&`, `rm -rf`, `export`); usa equivalentes PowerShell o comandos del package manager.
- Gestor de paquetes: **pnpm v11** (no npm, no yarn). Node v24.
- **NO usar Prisma en runtime.** Prisma 7 está instalado solo para validación de schema en el IDE. **Todas** las queries van por el cliente de `app/lib/supabase.ts`. No crear ni correr migraciones Prisma.
- TypeScript en modo `strict`. No introducir nuevos `any` (ya hay deuda técnica en `api/process/route.ts`; no agregar más).
- **Gates obligatorios antes de dar por terminado cualquier cambio:**
  ```bash
  pnpm lint      # debe pasar sin errores nuevos
  pnpm build     # debe compilar (Next 16 + Turbopack)
  pnpm dev       # smoke test manual en http://localhost:3000
  ```
- `INSTRUCTIVO.md` (el viejo) está **parcialmente desactualizado**: dice "Next 14" (es 16) y "Prisma migraciones" (es cliente Supabase). Ignora esas dos cosas; el resto de su descripción funcional sigue siendo válido.

---

## 1. Estado real del proyecto (resumen)

App web de **normalización/limpieza de datos (ETL)**. Sube un archivo (`.txt/.csv/.tsv`),
lo limpia, genera log, calcula score de calidad, muestra gráficos y guarda en Supabase.
Tres módulos conviven en la misma app:

| Módulo | Ruta | Estado | Cubre rúbrica |
|---|---|---|---|
| **Comunas** | `/` | Implementado (upload + normalización + enriquecimiento región/habitantes) | **Parte I (20%)** |
| **Famosos** | `/famosos` | Implementado (parseo fechas, edad, cumpleaños, caché imagen Wikipedia) | **Parte II (30%)** |
| **Lugares** | `/lugares` | Implementado (geo lat/long + mapa Leaflet) | **Parte III (50%)** |

Otras vistas: `/analytics` (métricas) y `/api-docs`.

**Stack (versiones reales):** Next.js **16.2.6** (App Router + Turbopack), React 19.2.4,
TypeScript 5 strict, Tailwind v4, `lucide-react`, `react-hot-toast`, `recharts`,
`react-leaflet` + `leaflet`, `react-dropzone`, `xlsx`. Base de datos **Supabase
(PostgreSQL)** vía `@supabase/supabase-js` v2. **11 tablas**, RLS permisivo (anon
read+write). UUIDs con `crypto.randomUUID()`. Inserts en chunks de 1.000 filas. Deploy: Vercel.

**Archivos clave de lógica (`app/lib/`):**
- `normalizer.ts` — ⭐ pipeline ETL de comunas (`normalizeLines(lines, rules)`).
- `etl-rules.ts` — reglas y sus defaults.
- `parser.ts` — detecta formato y parsea txt/csv/tsv.
- `comunas-chile.ts` — lista INE + fuzzy matching (Levenshtein).
- `comunas-enriquecidas.ts` — dataset INE: comuna → región + habitantes (local).
- `quality-score.ts`, `exporters.ts`, `sorter.ts`.
- `famosos-parser.ts`, `date-parser.ts` (soporta a.C. y fechas aprox.), `lugares-parser.ts`.

**Pipeline de normalización (orden de reglas en `normalizer.ts`):**
`trim` → `removeEmpty` → `collapseSpaces` → `removeAccents` → `titleCase` →
`deduplicate` → `fuzzyCorrect` (Levenshtein contra lista INE; **on por defecto**).
Cada línea produce `changeType`: `NORMALIZADO | DUPLICADO | CORREGIDO | SIN_CAMBIO | VACIO`.
Hay caché fuzzy por lote (~96% menos llamadas Levenshtein en lotes con muchos duplicados).

**Esquema Supabase** (recrear en orden si hace falta): `schema.sql` → `schema_v2.sql` → `schema_v3.sql`.
- Comunas: `batches`, `comunas` (con `region`, `habitantes`), `log_entries`.
- Famosos: `famosos_batches`, `famosos` (con caché de imagen), `famosos_logs`.
- Lugares: `lugares_batches`, `lugares`, `georeferencias`, `direcciones`, `lugares_logs`.

**Variables de entorno (`.env`):**
```env
NEXT_PUBLIC_SUPABASE_URL="https://<proyecto>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon key JWT>"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```
(Ignora `DATABASE_URL`/`DIRECT_URL` del instructivo viejo: no se usan.)

---

## 2. La rúbrica exacta (qué se evalúa y cuánto pesa)

> El peso está **invertido respecto al esfuerzo**: la Parte III vale 50% y es casi
> directa; la Parte I vale 20% pero es la que más trabajo de cierre tiene.
> **Orden de prioridad recomendado: III → II → I.** Asegura primero el 50%.

### Parte I — App de comunas (20%)
1. UI sencilla que permita **cargar un archivo** de comunas **o** **ingresar una comuna en un menú de búsqueda**.
2. Leer y procesar el listado.
3. Normalizar el nombre: unificación de **mayúsculas, minúsculas o formato título — a elección del usuario**; eliminación de espacios; corrección de caracteres inconsistentes; eliminación de duplicados en el listado.
4. **Conectarse a una API oficial, fuente institucional o dataset público confiable** para obtener información complementaria.
5. Consolidar por comuna, mínimo: **nombre, región, cantidad de habitantes**; almacenar en BD/estructura final; **evitar duplicados** (si la comuna ya existe en la estructura final → actualizar o ignorar, según lógica definida).
6. **Registrar el proceso** (log o tabla de auditoría) con **al menos**: fecha/hora de ejecución, registros leídos, comunas procesadas, duplicados eliminados, consolidados correctamente, **no encontrados en la fuente oficial**, y errores.
7. Búsqueda con sugerencias: ej. escribir "florida" → ofrecer "Florida" o "La Florida".

### Parte II — Famosos + imagen (30%)
1. Tras calcular la fecha de nacimiento/edad, **conectarse a una API que muestre la imagen** del famoso seleccionado.
2. Al seleccionar: ver sus **datos**, su **imagen bien escalada**, e **indicar la fuente de la imagen y cuándo fue capturada/recuperada**.
3. **Almacenar (cachear) el dato recuperado de la API** (las APIs tienen límite de consultas).

### Parte III — Lugares en mapa (50%)
1. Mostrar en un **mapa del mundo** **todos los lugares cargados**.
2. Poder **seleccionar un lugar y "llegar" a él** (navegar/centrar el mapa en ese punto).
3. Considerar lo avanzado en la primera entrega + mejoras de UX.

---

## 3. ⚠ Riesgo #1 para perder puntos — léelo antes de programar

**Parte I, criterio 4: "Conectarse a una API oficial".** Hoy el enriquecimiento
(región + habitantes) sale de un **dataset local** (`comunas-enriquecidas.ts`). El enunciado
**resalta en negrita** "Conectarse a una API". Un arreglo local *podría* aceptarse como
"dataset público confiable", pero para **máxima calificación y sin riesgo**, hay que
demostrar una **llamada real a una API**, dejando el dataset local como **fallback offline**.

Esto además **habilita el contador "no encontrados en la fuente oficial"** de la auditoría
(criterio 6), que solo tiene sentido si consultas una fuente externa y algunas comunas no resuelven.

**Plan recomendado (capa de enriquecimiento con API + fallback):**
- **API primaria sugerida:** `https://chileabierto.cl/api` — REST público, **sin autenticación**, 346 comunas, devuelve por comuna `name`, `region_name`, `province_name`, `lat`, `lng`, `population`; fuente atribuida a INE. (Confirma el endpoint exacto en su doc, p. ej. `/comunas`.)
- **Alternativa oficial de gobierno:** `https://apis.digital.gob.cl/dpa` (División Político Administrativa: regiones/provincias/comunas). ⚠ **No entrega población** — habría que cruzar con datos del Censo INE para los habitantes.
- **Fallback offline:** el `comunas-enriquecidas.ts` que ya existe, si la API falla o no responde a tiempo.

Patrón sugerido (crear `app/lib/comunas-api.ts`, no romper lo existente):
```ts
// Enriquecimiento con API + fallback local. Devuelve también el origen del dato
// para la auditoría ("api" | "local" | "no_encontrado").
export async function enriquecerComuna(nombreNormalizado: string): Promise<{
  region: string | null;
  habitantes: number | null;
  fuente: "api" | "local" | "no_encontrado";
}> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000); // timeout para no colgar el lote
    const res = await fetch(`https://chileabierto.cl/api/comunas`, { signal: ctrl.signal });
    clearTimeout(t);
    if (res.ok) {
      const { data } = await res.json();
      const match = data.find(
        (c: any) => normalizarClave(c.name) === normalizarClave(nombreNormalizado)
      );
      if (match) return { region: match.region_name, habitantes: match.population, fuente: "api" };
    }
  } catch { /* cae al fallback */ }

  const local = buscarEnDatasetLocal(nombreNormalizado); // reusar comunas-enriquecidas.ts
  if (local) return { region: local.region, habitantes: local.habitantes, fuente: "local" };

  return { region: null, habitantes: null, fuente: "no_encontrado" };
}
```
> Optimización: trae el listado de la API **una vez por lote** (no por comuna) y cachéalo
> en memoria, igual que ya se hace con el fuzzy. Respeta el límite por IP de la API.

---

## 4. Plan de trabajo por parte

### 🟦 PARTE III — Lugares en mapa (50%) — *empieza por acá*

#### III.1 — Mostrar TODOS los lugares cargados en el mapa
- 🔍 **Verificar** en `components/MapaLugares.tsx` (+ `app/lugares/page.tsx`): que renderiza un `<Marker>` por **cada** registro del batch, no un subconjunto/paginado. Verifica que al cargar hace `fitBounds` a todos los puntos (o un zoom mundial razonable) para que se vean todos.
- ✅ **Aceptación:** cargo un archivo con N lugares dispersos por el mundo y veo los N marcadores en un mapa mundial sin recortes.
- 🛠 **Si falta:** mapear `lugares` → `<Marker position={[lat,lng]}>`; al montar, `map.fitBounds(L.latLngBounds(coords))`. Tiles OpenStreetMap (gratis, sin API key).

#### III.2 — Seleccionar un lugar y "llegar" a él
- 🔍 **Verificar:** que existe una **lista/sidebar** de lugares sincronizada con el mapa y que al hacer clic en un ítem el mapa **se desplaza y centra** en ese marcador (animación), no solo abre el popup.
- ✅ **Aceptación:** clic en "Machu Picchu" en la lista → el mapa hace una transición suave y centra/zoom sobre ese punto, abriendo su popup con los datos.
- 🛠 **Si falta:** acceder al objeto `map` (hook `useMap()` de react-leaflet o `ref`) y llamar `map.flyTo([lat, lng], 13, { duration: 1.2 })`. Sincroniza estado `lugarSeleccionado` entre lista y mapa.
```tsx
// patrón flyTo controlado desde la lista
function VueloAControlado({ destino }: { destino: [number, number] | null }) {
  const map = useMap();
  useEffect(() => { if (destino) map.flyTo(destino, 13, { duration: 1.2 }); }, [destino, map]);
  return null;
}
```

#### III.3 — Mejoras de UX (suma; el enunciado las pide explícitamente para II y III)
- Popups con todos los datos del lugar (nombre, dirección, lat/long).
- Opcional: clustering de marcadores si hay muchos (`leaflet.markercluster`), buscador dentro del mapa, botón "ver todos" que vuelve al `fitBounds`.
- Asegurar que el mapa **no rompe el build de Next 16**: Leaflet es client-only → el componente debe ser `"use client"` y/o importarse con `next/dynamic` con `ssr: false`. 🔍 Verifica que ya esté así.

---

### 🟩 PARTE II — Famosos + imagen (30%)

#### II.1 — Imagen vía API al seleccionar al famoso
- 🔍 **Verificar:** `api/famosos/imagen/` ya consulta Wikipedia y `famosos.imagen_url` cachea el resultado. Confirma que al seleccionar un famoso en `/famosos` se ve la imagen.
- ✅ **Aceptación:** lista con botón "Ver imagen" por famoso; al seleccionarlo aparece la foto.
- 🛠 **Si falta:** endpoint que reciba el nombre y consulte Wikipedia REST (`/api/rest_v1/page/summary/{nombre}`) o Wikidata (propiedad `P18` → Wikimedia Commons) y devuelva `thumbnail`/`originalimage`.

#### II.2 — Mostrar FUENTE de la imagen y CUÁNDO fue capturada *(brecha probable)*
- 🔍 **Verificar:** qué columnas agregó `schema_v3.sql` a `famosos`. Si solo guarda `imagen_url`, **falta** la fuente y la fecha.
- ✅ **Aceptación:** debajo/junto a la imagen se lee algo como *"Fuente: Wikipedia (Wikimedia Commons) — recuperada el 05-06-2026 14:32"*.
- 🛠 **Si falta:**
  1. Añadir columnas a `famosos`: `imagen_fuente TEXT`, `imagen_fecha_captura TIMESTAMPTZ`. (Nuevo ALTER → documentar en un `schema_v4.sql` y aplicarlo en Supabase.)
  2. Al cachear, guardar también `imagen_fuente` (ej. `"Wikipedia — Wikimedia Commons"`) y `imagen_fecha_captura = new Date().toISOString()`.
  3. Mostrar ambos campos en la UI del módulo famosos.
> "Cuándo fue capturada" = el timestamp en que **tu app recuperó/cacheó** el dato (es lo que pide el enunciado al hablar de "almacenar el dato recuperado de la API").

#### II.3 — Imagen bien escalada + datos + caché
- ✅ **Aceptación:** la imagen se ve proporcional (sin deformar), con tamaño acotado; los datos del famoso (nombre, fecha nacimiento, edad calculada, marca de cumpleaños del día) se muestran; en la **segunda** vista del mismo famoso **no** se vuelve a llamar la API (usa caché).
- 🛠 **Si falta:** contenedor con `object-fit: contain` / `max-h`; antes de llamar la API, chequear si `imagen_url` ya existe en DB.
- 🔍 **Verifica el caso `a.C.`:** `date-parser.ts` ya soporta antes de Cristo (ej. Julius Caesar). Confirma que el cálculo de edad y la búsqueda de imagen no se rompen con esos registros del dataset de ejemplo.

---

### 🟨 PARTE I — Comunas (20%) — *la de más cierre pendiente*

#### I.1 — UI: cargar archivo **o** buscar una comuna individual *(brecha probable)*
- 🔍 **Verificar:** `app/page.tsx` hoy se centra en el upload (react-dropzone). ¿Existe un **input de búsqueda individual** donde escribo el nombre de **una** comuna y la app la normaliza + enriquece + guarda, sin subir archivo?
- ✅ **Aceptación:** además del upload, hay un buscador donde escribo "florida" y el sistema me **sugiere** "Florida" y "La Florida"; elijo una, se normaliza, se enriquece (región/habitantes) y se consolida igual que las del archivo.
- 🛠 **Si falta:** componente `BuscarComuna.tsx` con `<input>` + lista de sugerencias en vivo. Reusa el fuzzy de `comunas-chile.ts` (Levenshtein) para generar candidatos. Al seleccionar, llama al mismo pipeline (`normalizeLines` con 1 línea) + enriquecimiento + insert/upsert.
> Dato real para tus pruebas: **ambas existen** — *Florida* (Región del Biobío) y *La Florida* (Región Metropolitana). El ejemplo del enunciado es literal.

#### I.2 — Elección de caso por el usuario (mayúsculas / minúsculas / título) *(brecha probable)*
- 🔍 **Verificar:** en `etl-rules.ts` / `RulesConfig.tsx` hoy hay regla `titleCase` (on/off). El enunciado pide que el usuario **elija** entre **MAYÚSCULAS**, **minúsculas** o **Formato Título**.
- ✅ **Aceptación:** un selector (radio/dropdown) con opciones `UPPER / lower / Título / sin cambio`; el resultado del lote respeta lo elegido.
- 🛠 **Si falta:** reemplaza la regla booleana `titleCase` por una opción `caseMode: "upper" | "lower" | "title" | "none"` en las reglas; aplica en `normalizer.ts` (`.toUpperCase()` / `.toLowerCase()` / función title-case ya existente). Mantén compatibilidad con el resto del pipeline.

#### I.3 — Normalización restante (ya implementada — solo verificar)
- 🔍 **Verificar** que el pipeline cubre: trim, colapso de espacios, corrección de caracteres inconsistentes (acentos/ñ vía `removeAccents`), y **dedup intra-listado** (`deduplicate`). ✅ Según el contexto ya están. No tocar si funcionan.

#### I.4 — ⚠ Conexión a API real + consolidación + evitar duplicados en la estructura final
- 🔍 **Verificar:** (a) si el enriquecimiento usa API o solo dataset local (ver **§3**); (b) si al guardar se hace **upsert contra la DB** o solo dedup dentro del archivo. El enunciado pide: *"si una comuna ya existe en la estructura final → actualizar o ignorar"* (eso es contra lo ya almacenado, no solo dentro del lote).
- ✅ **Aceptación:** (a) el enriquecimiento hace una llamada HTTP real (con fallback local); (b) si vuelvo a procesar una comuna que ya está en DB, el sistema la **actualiza o la ignora** (política definida y consistente), no la duplica.
- 🛠 **Si falta:**
  - (a) Integrar `comunas-api.ts` del patrón de §3 en `api/process/route.ts`.
  - (b) Al insertar en `comunas`, usar **upsert** por clave normalizada. Con Supabase:
    ```ts
    await supabase
      .from("comunas")
      .upsert(filas, { onConflict: "nombre_normalizado", ignoreDuplicates: false });
      // ignoreDuplicates:false → ACTUALIZA. true → IGNORA. Elige y documenta la política.
    ```
  - Requiere índice/constraint único en la columna de conflicto (añadir en `schema_v4.sql` si no existe).

#### I.5 — ⚠ Auditoría de ejecución con los 7 campos exactos *(brecha probable y muy puntuable)*
- 🔍 **Verificar:** hoy existe `log_entries` (log **por línea**, con `changeType`) y `/api/logs`. Pero el enunciado pide un **registro de ejecución agregado** con contadores. Revisa si `batches` ya guarda estos totales; lo más probable es que falten varios (sobre todo "no encontrados en la fuente" y "errores").
- ✅ **Aceptación:** por cada ejecución se guarda y se puede mostrar un registro con **exactamente** estos campos:

  | Campo | Origen |
  |---|---|
  | Fecha y hora de ejecución | `now()` al iniciar el proceso |
  | Registros leídos desde el archivo | nº de líneas crudas del input |
  | Comunas procesadas | líneas válidas tras parseo |
  | Duplicados eliminados | conteo de `changeType = DUPLICADO` |
  | Consolidados correctamente | filas finalmente guardadas en `comunas` |
  | **No encontrados en la fuente oficial** | conteo de `fuente = "no_encontrado"` (de §3) |
  | Errores producidos | excepciones capturadas durante el proceso |

- 🛠 **Si falta:**
  1. Crear tabla `auditoria_ejecuciones` (o extender `batches`) con esas 7 columnas. Documentar en `schema_v4.sql`.
  2. En `api/process/route.ts`, instrumentar el proceso: inicializar contadores, incrementarlos en cada etapa, capturar errores en try/catch acumulando en un array, e insertar el registro de auditoría al final (incluso si hubo errores parciales).
  3. Mostrar la auditoría en la UI (un panel "Resumen de la ejecución" tras procesar, y/o en `/analytics`). Que sea **visible** en la defensa, no solo en DB.

#### I.6 — Búsqueda con sugerencias fuzzy (ligado a I.1)
- ✅ **Aceptación:** el buscador de I.1 muestra sugerencias por similitud (Levenshtein) mientras escribo; "florida" devuelve "Florida" y "La Florida".
- 🛠 Reusa `comunas-chile.ts`. No dupliques la lógica fuzzy.

---

## 5. Datos de demostración para la defensa

Para mostrar cada criterio funcionando, genera (Claude Code: créalos en `/demo/`) archivos de prueba
que **fuercen** que se vean todas las transformaciones. **No los uses para la entrega de datos reales**,
solo para la demo en vivo.

**`demo/comunas-demo.txt`** — debe disparar trim, espacios, acentos, mayúsc, dedup, fuzzy y el caso "florida":
```
  COPIAPÓ
Viña  del Mar
teMuco
Ñuñoa
vina delmar
Viña del Mar
florida
SANTIAGO
santiago
concepcionn
ZZZ-comuna-inexistente
```
(Incluye duplicados con distinto formato, typos, una inexistente para el contador "no encontrados", y "florida" para las sugerencias.)

**`demo/famosos-demo.txt`** — incluye un caso a.C. y cumpleaños:
```
Madonna; 1958-08-16
Pelé; 1940-10-23
Diego Maradona; 1960-10-30
Julius Caesar; 100 a.C.
```
(Confirma el separador/formato real que espera `famosos-parser.ts` y ajusta.)

**`demo/lugares-demo.txt`** — lugares repartidos por el mundo para el mapa y el flyTo:
```
Machu Picchu; -13.1631; -72.5450
Torre Eiffel; 48.8584; 2.2945
Gran Muralla China; 40.4319; 116.5704
Coliseo Romano; 41.8902; 12.4922
Moái Rapa Nui; -27.1212; -109.3666
```
(Confirma el formato real que espera `lugares-parser.ts`.)

---

## 6. Definition of Done — checklist para autoevaluar 100/100

Marca cada ítem solo cuando esté **verificado funcionando en `pnpm dev`**.

**Parte I (20%)**
- [ ] Puedo cargar un archivo **y** buscar una comuna individual.
- [ ] El buscador sugiere por similitud ("florida" → "Florida"/"La Florida").
- [ ] El usuario elige el caso (MAYÚS/minús/Título) y se respeta.
- [ ] Se normaliza: trim, espacios, acentos/ñ, dedup en el listado.
- [ ] El enriquecimiento hace una **llamada HTTP real a una API** (con fallback local).
- [ ] Por comuna se consolida nombre + región + habitantes.
- [ ] Si la comuna ya existe en la estructura final, se **actualiza o ignora** (no duplica).
- [ ] Existe y es **visible** la auditoría con los **7 campos** (incl. "no encontrados" y "errores").

**Parte II (30%)**
- [ ] Al seleccionar un famoso se muestra su imagen (vía API).
- [ ] La imagen está **bien escalada** y se ven sus datos + edad calculada.
- [ ] Se indica **fuente** de la imagen y **fecha de captura/recuperación**.
- [ ] La imagen y sus metadatos quedan **cacheados** (no se vuelve a llamar la API).
- [ ] Los casos a.C. (Julius Caesar) no rompen edad ni imagen.

**Parte III (50%)**
- [ ] El mapa mundial muestra **todos** los lugares cargados.
- [ ] Al seleccionar un lugar, el mapa **vuela/centra** en él (flyTo) y abre su popup.
- [ ] Mejoras de UX aplicadas (popups con datos, fitBounds inicial, etc.).

**Transversal**
- [ ] `pnpm lint` sin errores nuevos.
- [ ] `pnpm build` compila (Next 16 + Turbopack).
- [ ] No se introdujeron nuevos `any`; no se usó Prisma en runtime.
- [ ] Esquema actualizado y documentado (`schema_v4.sql` si hubo ALTERs nuevos), aplicado en Supabase.
- [ ] Datos de demo listos en `/demo/` para la defensa.

---

## 7. Notas operativas y trampas conocidas

- **Windows/PowerShell:** no encadenes con `&&` en PowerShell antiguo; corre comandos por separado o usa `;`. Cuidado con rutas y borrados.
- **No tocar Prisma** para nada que afecte runtime. Si necesitas cambiar el esquema, escribe SQL en un nuevo `schema_vN.sql` y aplícalo en Supabase; **no** generes migraciones Prisma.
- **RLS permisivo:** las políticas son `FOR ALL TO anon USING(true) WITH CHECK(true)`. Está bien para clase, pero si en la defensa preguntan por seguridad, menciona que en producción habría que restringir y mover escrituras a `service_role` server-side. No es un punto de la rúbrica, pero suma en preguntas.
- **Leaflet + SSR:** asegúrate de que los componentes de mapa sean client-only (evita el clásico error de `window is not defined` en build de Next).
- **Límite de la API de comunas:** trae el listado una sola vez por lote y cachéalo en memoria; respeta el rate limit por IP.
- **Idempotencia del pipeline:** correr el mismo archivo dos veces no debe duplicar en `comunas` (gracias al upsert de I.4).
- Antes de cerrar cualquier tarea, vuelve al **§6** y marca el ítem correspondiente.

---

### Resumen de prioridades (TL;DR para Claude Code)
1. **Verifica todo antes de escribir** (regla de oro, §0).
2. **Parte III primero** (50%, casi lista): confirma "todos los marcadores" + implementa **flyTo** desde la lista.
3. **Parte II**: agrega **fuente + fecha de captura** de la imagen (probable brecha) y confirma caché.
4. **Parte I**: lo más laborioso — **conexión a API real** (§3), **buscador individual con sugerencias**, **selección de caso**, **upsert anti-duplicados** y **auditoría con los 7 campos** (§I.5).
5. **Gates** (`lint`/`build`) + **datos de demo** + checklist §6.
