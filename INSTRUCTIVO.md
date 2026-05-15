# DATA-CLEANER — Instructivo Completo
> Proyecto: Evaluación 2 Parte 1 - Arquitectura y Almacenamiento de Datos — INACAP
> Stack: Next.js 14 · TypeScript · Prisma · Supabase · Tailwind CSS
> Deploy: Vercel
> Versión: 1.0.0

---

## Índice

1. [Descripción del Proyecto](#1-descripción-del-proyecto)
2. [Estructura del Proyecto](#2-estructura-del-proyecto)
3. [Requisitos Previos](#3-requisitos-previos)
4. [Instalación Local](#4-instalación-local)
5. [Configurar Supabase](#5-configurar-supabase)
6. [Variables de Entorno](#6-variables-de-entorno)
7. [Comandos Prisma](#7-comandos-prisma)
8. [Correr en Desarrollo](#8-correr-en-desarrollo)
9. [Deploy en Vercel](#9-deploy-en-vercel)
10. [Trabajar con Claude Code](#10-trabajar-con-claude-code)
11. [Funcionalidades del Sistema](#11-funcionalidades-del-sistema)
12. [Comportamiento esperado con DATOS_TEST.txt](#12-comportamiento-esperado-con-datos_testtxt)
13. [Solución de Problemas Comunes](#13-solución-de-problemas-comunes)

---

## 1. Descripción del Proyecto

Aplicación web para normalizar datasets de texto (comunas, ciudades, nombres de lugares).

### ¿Qué hace?
- Carga archivos `.txt`, `.csv` o `.tsv`
- Detecta el formato automáticamente
- Normaliza el texto: elimina tildes, eñes, espacios extra y unifica en Title Case
- Elimina registros duplicados
- Aplica corrección ortográfica por **fuzzy matching** (Levenshtein) para corregir typos
  intencionales como `teMuco`, `vina delmar`, `ariCa`, `coyHaique`
- Genera un **log detallado** de cada cambio realizado
- Permite **ordenar los datos** antes de exportar (A→Z, Z→A o sin ordenar)
- Exporta en CSV, JSON, Excel o SQL
- Muestra estadísticas, score de calidad y gráficos en el dashboard
- Guarda los resultados en Supabase (PostgreSQL)
- Muestra la **versión de la app** en el footer

### Dataset de prueba esperado (DATOS_TEST.txt)
El archivo del profesor contiene ~187 líneas con:
- Mayúsculas mezcladas: `teMuco`, `ariCa`, `coyHaique`
- Tildes y ñ: `COPIAPÓ`, `Ñuñoa`, `peñalolén`, `MAIPÚ`
- Espacios extra al inicio: ` Talca`, ` Iquique`
- Espacios dobles internos: `Viña  del Mar`, `puente  alto`, `las  condes`
- Duplicados en distintos formatos: `Puerto Montt` / `puerto montt` / `PUERTO MONTT`
- Typos intencionales que fuzzy debe corregir: `vina delmar`, `Nunoa`

Resultado esperado:
- Entrada: ~187 líneas
- Únicos: ~40-42 ciudades
- Duplicados eliminados: ~145-147

---

## 2. Estructura del Proyecto

```
data-cleaner/
├── prisma/
│   └── schema.prisma
├── app/
│   ├── api/
│   │   ├── process/route.ts
│   │   ├── comunas/route.ts
│   │   ├── logs/route.ts
│   │   ├── batches/route.ts
│   │   ├── analytics/route.ts
│   │   ├── download/route.ts
│   │   └── public/normalize/route.ts
│   ├── analytics/page.tsx
│   ├── api-docs/page.tsx
│   ├── components/
│   │   ├── FileUpload.tsx
│   │   ├── StatsPanel.tsx
│   │   ├── DataTable.tsx
│   │   ├── LogViewer.tsx
│   │   ├── QualityGauge.tsx
│   │   ├── ChartsPanel.tsx
│   │   ├── BatchHistory.tsx
│   │   ├── ColumnSelector.tsx
│   │   ├── RulesConfig.tsx
│   │   ├── SqlExport.tsx
│   │   ├── SortSelector.tsx     ← NUEVO: selector de orden
│   │   └── AppVersion.tsx       ← NUEVO: versión en footer
│   ├── hooks/
│   │   └── useDarkMode.ts
│   ├── lib/
│   │   ├── normalizer.ts
│   │   ├── parser.ts
│   │   ├── etl-rules.ts
│   │   ├── quality-score.ts
│   │   ├── exporters.ts
│   │   ├── sorter.ts            ← NUEVO: lógica de ordenamiento
│   │   ├── comunas-chile.ts     ← lista INE + fuzzy matching
│   │   └── prisma.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── .env
├── .env.example
├── .gitignore
├── INSTRUCTIVO.md
├── next.config.ts
├── package.json                 ← campo "version": "1.0.0"
├── tailwind.config.ts
└── tsconfig.json
```

---

## 3. Requisitos Previos

### Cuentas necesarias
- **Supabase**: https://supabase.com (gratis)
- **Vercel**: https://vercel.com (gratis)
- **GitHub**: https://github.com

### En tu máquina local
- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Git
- Claude Code (`npm install -g @anthropic-ai/claude-code`)

---

## 4. Instalación Local

```bash
pnpm create next-app@latest data-cleaner
cd data-cleaner
pnpm add prisma @prisma/client
pnpm add @prisma/adapter-pg pg
pnpm add react-dropzone
pnpm add react-hot-toast
pnpm add lucide-react
pnpm add recharts
pnpm add xlsx
pnpm dlx prisma init
```

Si clonas desde GitHub:
```bash
git clone https://github.com/TU_USUARIO/data-cleaner.git
cd data-cleaner
pnpm install
```

---

## 5. Configurar Supabase

### Paso 1 — Crear proyecto
1. Ir a https://supabase.com → crear cuenta
2. New Project → nombre: `data-cleaner`
3. Región: `South America (São Paulo)`
4. Guardar la contraseña

### Paso 2 — Obtener credenciales
1. Settings → Database → Connection string
2. Modo **URI** → copiar → `DATABASE_URL` (puerto 6543, pooler)
3. Modo directo → copiar → `DIRECT_URL` (puerto 5432)

---

## 6. Variables de Entorno

### `.env` (NO subir a Git)
```env
# Supabase — Connection Pooler (para queries normales)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase — Direct Connection (para migraciones Prisma)
DIRECT_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"

# Versión de la app (mostrada en el footer)
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

### `.env.example` (SÍ subir a Git)
```env
DATABASE_URL="postgresql://postgres.[ref]:[password]@pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

---

## 7. Comandos Prisma

### Schema — `prisma/schema.prisma`
```prisma
generator client {
  provider = "prisma-client"
  output   = "../app/generated/prisma"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model Batch {
  id            String     @id @default(cuid())
  createdAt     DateTime   @default(now())
  fileName      String
  totalInput    Int
  totalOutput   Int
  duplicates    Int
  changes       Int
  qualityBefore Float?
  qualityAfter  Float?
  comunas       Comuna[]
  logs          LogEntry[]
}

model Comuna {
  id         String   @id @default(cuid())
  original   String
  normalized String
  batchId    String
  batch      Batch    @relation(fields: [batchId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())
}

model LogEntry {
  id         String   @id @default(cuid())
  batchId    String
  batch      Batch    @relation(fields: [batchId], references: [id], onDelete: Cascade)
  lineNumber Int
  original   String
  normalized String
  changeType String
  detail     String?
  createdAt  DateTime @default(now())
}
```

### Comandos
```bash
pnpm dlx prisma migrate dev --name init   # Aplicar schema
pnpm dlx prisma studio                     # Ver datos en navegador
pnpm dlx prisma generate                   # Regenerar cliente
pnpm dlx prisma migrate deploy             # Aplicar en producción
```

---

## 8. Correr en Desarrollo

```bash
pnpm dev
# Abrir: http://localhost:3000
```

---

## 9. Deploy en Vercel

```bash
git init && git add .
git commit -m "feat: data-cleaner v1.0.0"
git remote add origin https://github.com/TU_USUARIO/data-cleaner.git
git push -u origin main
```

En Vercel:
1. New Project → importar repo
2. Agregar variables: `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_APP_VERSION`
3. Deploy

```bash
# Aplicar migraciones en producción
pnpm dlx prisma migrate deploy
```

Cada `git push` redespliega automáticamente.

---

## 10. Trabajar con Claude Code

```bash
cd data-cleaner
claude
```

### Contexto inicial
```
Estoy trabajando en data-cleaner, una app Next.js 14 con TypeScript,
Prisma y Supabase. Deploy en Vercel.
Normaliza datasets de texto: elimina tildes, unifica mayúsculas,
quita duplicados, aplica fuzzy matching (ACTIVADO por defecto)
y genera log de cambios.
Incluye ordenamiento de datos en la exportación y versión en footer.
Lee el INSTRUCTIVO.md para el contexto completo.
```

---

## 11. Funcionalidades del Sistema

### Pipeline de Normalización (`app/lib/normalizer.ts`)
1. **Trim** — elimina espacios al inicio y fin: ` Talca` → `Talca`
2. **Colapsar espacios** — `Viña  del Mar` → `Viña del Mar`
3. **Eliminar tildes** — NFD Unicode: `á→a`, `é→e`, `ñ→n`, `ü→u`
4. **Title Case** — `SANTIAGO` → `Santiago`, `teMuco` → `Temuco`
5. **Deduplicación** — compara clave normalizada, mantiene el primero
6. **Fuzzy matching** — Levenshtein contra lista INE, corrige typos

### ✅ Fuzzy Matching ACTIVADO por defecto

En este proyecto `fuzzyCorrect` está **activado por defecto** porque
el dataset del profesor contiene typos intencionales:

```
vina delmar   → Vina Del Mar   (espacio faltante)
Nunoa         → Nunoa          (sin ñ, fuzzy mapea a la lista)
teMuco        → Temuco         (capitalización corregida por Title Case)
coyHaique     → Coyhaique      (idem)
```

En `app/lib/etl-rules.ts` la regla debe tener `defaultEnabled: true`:
```typescript
{
  id: 'fuzzyCorrect',
  label: 'Corrección ortográfica',
  description: 'Corrige typos comparando contra lista de referencia (Levenshtein)',
  required: false,
  defaultEnabled: true,  // ← ACTIVADO por defecto
}
```

### ✅ Ordenamiento de exportación (recomendación del profesor)

Archivo `app/lib/sorter.ts`:

```typescript
/**
 * sorter.ts
 * Lógica de ordenamiento para los datos exportados.
 * El usuario elige el orden antes de descargar.
 */

export type SortOrder = 'none' | 'asc' | 'desc'

export const SORT_OPTIONS = [
  { value: 'none' as SortOrder, label: 'Sin ordenar', description: 'Orden de procesamiento' },
  { value: 'asc'  as SortOrder, label: 'A → Z',       description: 'Alfabético ascendente'  },
  { value: 'desc' as SortOrder, label: 'Z → A',       description: 'Alfabético descendente' },
]

/**
 * Ordena comunas por campo 'normalized' usando localeCompare en español.
 */
export function sortComunas(
  comunas: { original: string; normalized: string }[],
  order: SortOrder,
): { original: string; normalized: string }[] {
  if (order === 'none') return comunas
  return [...comunas].sort((a, b) => {
    const cmp = a.normalized.localeCompare(b.normalized, 'es', { sensitivity: 'base' })
    return order === 'asc' ? cmp : -cmp
  })
}
```

Componente `app/components/SortSelector.tsx`:
- 3 botones pill: **Sin ordenar** / **A → Z** / **Z → A**
- Aparece justo antes del botón "Exportar" en DataTable.tsx
- Al cambiar el orden, la tabla se reordena en tiempo real (preview)
- El orden elegido se envía como parámetro `sortOrder` al endpoint de descarga

Layout en DataTable.tsx:
```
[Sin ordenar]  [A → Z]  [Z → A]         [Exportar ▼]
```

El endpoint `api/download/route.ts` recibe `sortOrder` y ordena antes de generar:
```
GET /api/download?batchId=X&type=csv&sortOrder=asc
GET /api/download?batchId=X&type=xlsx&sortOrder=desc
GET /api/download?batchId=X&type=json&sortOrder=none
```

El endpoint `api/comunas/route.ts` también acepta `sortOrder`:
```
GET /api/comunas?batchId=X&sortOrder=asc
```

### ✅ Versión de la app en el footer (recomendación del profesor)

Componente `app/components/AppVersion.tsx`:

```typescript
/**
 * AppVersion.tsx
 * Muestra la versión actual de la app en el footer.
 * Lee desde NEXT_PUBLIC_APP_VERSION en .env
 * Formato: "data-cleaner v1.0.0"
 */
export default function AppVersion() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0'
  return (
    <span className="text-xs text-gray-400 dark:text-gray-600 font-mono">
      data-cleaner v{version}
    </span>
  )
}
```

Footer en `app/page.tsx` (al final del `<main>`):
```tsx
<footer className="mt-8 border-t border-gray-200 dark:border-gray-800 py-4 flex items-center justify-between text-xs text-gray-400">
  <AppVersion />
  <span>Pipeline ETL de normalización de texto</span>
</footer>
```

Para actualizar la versión en una release:
1. Cambiar `"version"` en `package.json`
2. Cambiar `NEXT_PUBLIC_APP_VERSION` en `.env` y en Vercel

### Reglas ETL (`app/lib/etl-rules.ts`)

| Regla | Por defecto | Descripción |
|---|---|---|
| `trim` | ✅ Activa | Espacios extremos (obligatoria) |
| `collapseSpaces` | ✅ Activa | Espacios múltiples internos |
| `removeAccents` | ✅ Activa | Tildes y diacríticos |
| `titleCase` | ✅ Activa | Formato Title Case |
| `deduplicate` | ✅ Activa | Eliminar duplicados |
| `fuzzyCorrect` | ✅ **Activa** | Corrección ortográfica Levenshtein |
| `removeEmpty` | ✅ Activa | Líneas vacías (obligatoria) |

### Endpoints API

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/process` | Procesa y normaliza el archivo |
| GET | `/api/comunas?batchId=X&sortOrder=asc` | Registros con orden |
| GET | `/api/logs?batchId=X` | Log de cambios |
| GET | `/api/batches` | Historial |
| DELETE | `/api/batches?id=X` | Eliminar batch |
| GET | `/api/analytics` | Métricas globales |
| GET | `/api/download?batchId=X&type=csv&sortOrder=asc` | CSV ordenado |
| GET | `/api/download?batchId=X&type=json&sortOrder=desc` | JSON ordenado |
| GET | `/api/download?batchId=X&type=xlsx&sortOrder=asc` | Excel ordenado |
| GET | `/api/download?batchId=X&type=sql&sortOrder=none` | SQL |
| GET | `/api/download?batchId=X&type=log` | Log TXT |
| POST | `/api/public/normalize` | API pública |

---

## 12. Comportamiento esperado con DATOS_TEST.txt

### Transformaciones línea por línea (ejemplos)

| Original | Normalizado | Cambio aplicado |
|---|---|---|
| `COPIAPÓ` | `Copiapo` | tildes, Title Case |
| `teMuco` | `Temuco` | Title Case |
| `Viña  del Mar` | `Vina Del Mar` | tilde, doble espacio, Title Case |
| ` Talca` | `Talca` | espacio inicial |
| `Ñuñoa` | `Nunoa` | ñ removida |
| `vina delmar` | `Vina Del Mar` | fuzzy matching |
| `Puerto Montt` (2da vez) | — | DUPLICADO eliminado |
| ` la Florida` | `La Florida` | espacio + Title Case |
| `las  condes` | `Las Condes` | doble espacio + Title Case |

### Resultado esperado

```
Entrada:              ~187 líneas
Únicos normalizados:  ~40-42
Duplicados eliminados: ~145-147
Normalizados:          prácticamente todos
```

### Exportación CSV ordenada A→Z

```csv
original,normalizado
Arica,Arica
Calama,Calama
Castro,Castro
Chillan,Chillan
Chillan Viejo,Chillan Viejo
Concepcion,Concepcion
Copiapo,Copiapo
Coyhaique,Coyhaique
...
```

### Log de cambios (extracto)

```
LOG DE NORMALIZACIÓN — Archivo: DATOS_TEST.txt
Fecha: 23/05/2026
============================================================
Linea 0001 [NORMALIZED ] "COPIAPÓ" → "Copiapo" (tildes/enes removidas, capitalización normalizada)
Linea 0002 [NORMALIZED ] "teMuco" → "Temuco" (capitalización normalizada)
Linea 0004 [NORMALIZED ] "la serena" → "La Serena" (capitalización normalizada)
Linea 0005 [NORMALIZED ] "Viña  del Mar" → "Vina Del Mar" (espacios múltiples, tildes)
Linea 0011 [DUPLICATE  ] "Puerto Montt" → duplicado de línea 10
Linea 0031 [CORRECTED  ] "vina delmar" → "Vina Del Mar" (typo corregido por fuzzy matching)
============================================================
Total entrada: 187 | Únicos: 41 | Duplicados: 146 | Normalizados: 41
```

---

## 13. Solución de Problemas Comunes

### Supabase pausado (tier gratuito)
Después de 7 días sin uso el proyecto se pausa.
→ Dashboard → Restore project (~1 min)

### Error en migraciones
```bash
# DIRECT_URL debe usar puerto 5432
pnpm dlx prisma migrate dev --name nombre
```

### Error `Cannot find module '@prisma/client'`
```bash
pnpm dlx prisma generate
```

### Build falla en Vercel
```bash
pnpm build  # correr local primero
```

### Fuzzy muy agresivo (corrige palabras que no debería)
Ajustar umbral en `app/lib/comunas-chile.ts`:
```typescript
// Más estricto: cambiar de 2 a 1
const threshold = Math.min(1, Math.floor(key.length * 0.2))
```

### `vina delmar` no se deduplica con `Vina Del Mar`
Esto es correcto — fuzzy matching los unifica porque la distancia
Levenshtein entre `vina delmar` y `vinadel mar` es ≤ 2.
Si no se está unificando, verificar que `fuzzyCorrect` esté en `defaultEnabled: true`.

---

## Historial de versiones

| Versión | Fecha | Descripción |
|---|---|---|
| 1.0.0 | Mayo 2026 | Versión inicial — normalización ETL completa con fuzzy, ordenamiento y versión en footer |

---

*data-cleaner v1.0.0 — Evaluación 2 Parte 1 — Arquitectura y Almacenamiento de Datos — INACAP 2026*
