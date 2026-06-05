# Contexto del proyecto — data-cleaner

> Documento para dar contexto a un asistente (Claude web u otro). Describe el
> estado **real** del código a junio 2026, verificado leyendo los archivos
> (no asumas lo que dice `INSTRUCTIVO.md`, que está parcialmente desactualizado).

---

## 1. Qué es

Aplicación web de **normalización / limpieza de datos (ETL)**. Subes un archivo de
texto (`.txt`, `.csv`, `.tsv`), la app lo limpia (quita tildes, unifica mayúsculas,
elimina duplicados, corrige typos por fuzzy matching), genera un log de cambios,
calcula un score de calidad, muestra gráficos y guarda todo en Supabase.

Es un trabajo académico (**INACAP — Arquitectura y Almacenamiento de Datos**),
dividido en 3 partes/módulos que conviven en la misma app:

| Módulo | Ruta UI | Qué normaliza |
|---|---|---|
| **Comunas** (principal) | `/` | Nombres de comunas/ciudades de Chile. Enriquece con región y nº de habitantes (dataset INE). |
| **Famosos** | `/famosos` | Personas + fecha de nacimiento. Parsea fechas, calcula edad, detecta cumpleaños del día, cachea imagen de Wikipedia. |
| **Lugares** | `/lugares` | Lugares con georreferencia (lat/long) y dirección. Incluye mapa (Leaflet). |

Otras vistas: `/analytics` (métricas globales) y `/api-docs` (documentación de la API pública).

---

## 2. Stack tecnológico (versiones reales)

- **Lenguaje:** TypeScript 5 (modo `strict`), más algo de JS permitido.
- **Framework:** **Next.js 16.2.6** con **App Router** y **Turbopack** (¡OJO: el INSTRUCTIVO dice "Next 14", está desactualizado — es 16).
- **UI:** React 19.2.4, **Tailwind CSS v4** (vía `@tailwindcss/postcss`), iconos `lucide-react`, toasts `react-hot-toast`.
- **Gráficos:** `recharts`. **Mapas:** `react-leaflet` + `leaflet`. **Upload:** `react-dropzone`. **Excel:** `xlsx`.
- **Base de datos:** **Supabase (PostgreSQL)** mediante el cliente **`@supabase/supabase-js` v2**.
- **Prisma 7 está instalado pero NO se usa en runtime.** Solo sirve para validación de schema en el IDE (lo dice `prisma.config.ts`). Las queries reales van por el cliente de Supabase, no por Prisma. No hay migraciones Prisma activas.
- **Gestor de paquetes:** **pnpm** (v11). **Node:** v24. **SO de desarrollo:** Windows 11 / PowerShell.
- **Deploy previsto:** Vercel.

---

## 3. Estructura del código

```
app/
├── page.tsx              # UI módulo Comunas (client component, orquesta todo)
├── layout.tsx            # Root layout, fuentes Geist, lang="es"
├── globals.css           # Tailwind v4
├── famosos/page.tsx      # UI módulo Famosos
├── lugares/page.tsx      # UI módulo Lugares
├── analytics/page.tsx    # Dashboard de métricas
├── api-docs/page.tsx     # Docs de la API pública
│
├── api/                  # 12 route handlers (backend, Next App Router)
│   ├── process/          # POST: normaliza archivo de comunas y guarda en DB
│   ├── comunas/          # GET: registros de un batch (acepta sortOrder)
│   ├── logs/             # GET: log de cambios
│   ├── batches/          # GET historial, DELETE batch
│   ├── analytics/        # GET métricas globales (3 módulos)
│   ├── download/         # GET export CSV/JSON/XLSX/SQL/log (acepta sortOrder)
│   ├── public/normalize/ # POST API pública (normaliza sin guardar)
│   ├── famosos/          # process, batch, imagen (Wikipedia)
│   └── lugares/          # process, batch
│
├── components/           # 19 componentes React (FileUpload, DataTable, ChartsPanel,
│                         #   QualityGauge, LogViewer, BatchHistory, MapaLugares, etc.)
│
└── lib/                  # Lógica de negocio (sin React) — ~1.700 líneas
    ├── supabase.ts             # Cliente Supabase (singleton) + tipos de tablas
    ├── normalizer.ts           # ⭐ Pipeline ETL principal (comunas)
    ├── etl-rules.ts            # Definición de las reglas y sus defaults
    ├── parser.ts               # Detecta formato y parsea txt/csv/tsv
    ├── comunas-chile.ts        # Lista INE + fuzzy matching (Levenshtein)
    ├── comunas-enriquecidas.ts # Dataset INE: comuna → región + habitantes (361 líneas)
    ├── quality-score.ts        # Calcula score de calidad 0–100
    ├── exporters.ts            # Genera CSV / JSON / SQL / Excel
    ├── sorter.ts               # Orden A→Z / Z→A / sin orden
    ├── famosos-parser.ts       # Parseo del módulo famosos
    ├── date-parser.ts          # Parseo de fechas (incluye a.C., aprox.)
    ├── lugares-parser.ts       # Parseo de lugares (geo + dirección)
    └── (chart-config, log-labels, format-date, ...)

supabase/
├── schema.sql      # v1: tablas comunas (batches, comunas, log_entries)
├── schema_v2.sql   # v2: tablas famosos_* y lugares_* + índices + RLS
└── schema_v3.sql   # v3: ALTERs (comunas+region/habitantes, famosos+imagen cache)

prisma/schema.prisma # Solo referencia para el IDE; no se usa en runtime
INSTRUCTIVO.md       # Doc original del proyecto (⚠ parcialmente desactualizado)
```

---

## 4. El pipeline de normalización (lo más importante)

`app/lib/normalizer.ts` → función `normalizeLines(lines, rules)`. Aplica reglas en orden:

1. **trim** — quita espacios extremos *(obligatoria)*
2. **removeEmpty** — descarta líneas vacías *(obligatoria)*
3. **collapseSpaces** — `"Viña  del Mar"` → `"Viña del Mar"`
4. **removeAccents** — quita tildes y ñ: `"COPIAPÓ"` → `"COPIAPO"`, `"Ñuñoa"` → `"Nunoa"`
5. **titleCase** — `"teMuco"` → `"Temuco"`
6. **deduplicate** — elimina duplicados por clave normalizada (mantiene el primero)
7. **fuzzyCorrect** — corrige typos por **distancia Levenshtein** contra la lista INE: `"vina delmar"` → `"Vina Del Mar"`. **Activada por defecto** porque el dataset de prueba trae typos intencionales.

Cada línea produce un `changeType`: `NORMALIZADO | DUPLICADO | CORREGIDO | SIN_CAMBIO | VACIO`.
Optimización: hay un **cache fuzzy por lote** — con ~9.000 duplicados en 10.000 líneas reduce las llamadas Levenshtein ~96%.

Las reglas son configurables desde la UI (`RulesConfig.tsx`), salvo las obligatorias.

---

## 5. Capa de datos (Supabase)

- Cliente único en `app/lib/supabase.ts`, lee 2 variables de entorno:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **11 tablas** en PostgreSQL:
  - Comunas: `batches`, `comunas` (con `region`, `habitantes`), `log_entries`
  - Famosos: `famosos_batches`, `famosos` (con `imagen_url` cache), `famosos_logs`
  - Lugares: `lugares_batches`, `lugares`, `georeferencias`, `direcciones`, `lugares_logs`
- **RLS (Row Level Security) activado**, pero con políticas permisivas: `FOR ALL TO anon USING (true) WITH CHECK (true)`. Por eso el `anon key` puede leer **y escribir**. ⚠ Aceptable para un proyecto de clase, pero **no es seguro para producción** (cualquiera con la anon key puede modificar datos).
- Los IDs se generan en la app con `crypto.randomUUID()`. Inserts grandes van en chunks de 1.000 filas en paralelo.

### Variables de entorno reales (`.env`)
```env
NEXT_PUBLIC_SUPABASE_URL="https://<proyecto>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon key JWT>"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```
⚠ El INSTRUCTIVO menciona `DATABASE_URL` y `DIRECT_URL` (Prisma): **no se usan**, ignóralos.

---

## 6. Cómo correr

```bash
pnpm install      # instalar dependencias
pnpm dev          # servidor de desarrollo → http://localhost:3000
pnpm build        # build de producción
pnpm lint         # eslint
```

Requiere el archivo `.env` con las credenciales de Supabase (ver arriba).

---

## 7. Estado actual

- ✅ Dependencias instaladas, `.env` configurado y **conectado a una base Supabase real con datos** (ya hay batches procesados de pruebas anteriores).
- ✅ La app arranca y responde (probado: home 200, `/api/batches` devuelve datos reales).
- ✅ Las 3 partes (comunas / famosos / lugares) están implementadas, incluido el enriquecimiento de la Parte 3 (región+habitantes, imágenes de Wikipedia).

---

## 8. Advertencias para quien retome el proyecto

1. **`INSTRUCTIVO.md` está desactualizado** en: versión de Next (dice 14, es 16) y en que usaría Prisma para migraciones (en realidad usa el cliente Supabase JS). Lo demás del instructivo (descripción funcional, comportamiento esperado) sigue siendo válido.
2. **No uses Prisma para tocar la base** — usa el cliente de `app/lib/supabase.ts`.
3. El esquema evolucionó por ALTERs (`schema_v3.sql`): la tabla `comunas` ganó `region`/`habitantes` y `famosos` ganó campos de caché de imagen. Si recreas la DB desde cero, corre `schema.sql` → `schema_v2.sql` → `schema_v3.sql` en orden.
4. Hay algunos `any` y `eslint-disable` en `api/process/route.ts` por la tipificación del cliente Supabase al insertar.
5. Entorno de desarrollo: **Windows + PowerShell** (cuidado con comandos estilo Unix).
```
