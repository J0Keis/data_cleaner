-- ==========================================
-- data-cleaner v4 — Evaluación 2 · Parte Final
-- Correr en: Supabase Dashboard → SQL Editor → New query → Run
-- Idempotente (IF NOT EXISTS): se puede correr varias veces sin romper nada.
-- ==========================================

-- ── 1. Auditoría de ejecución (Parte I, criterio 6) ──────────────
-- Extiende `batches` con los contadores que faltaban para el registro
-- de auditoría: consolidados correctamente, no encontrados en la fuente
-- oficial y errores producidos. (fecha/hora, leídos, procesadas y
-- duplicados ya existían: created_at, total_input, total_output, duplicates.)
ALTER TABLE batches
  ADD COLUMN IF NOT EXISTS consolidados   INTEGER,
  ADD COLUMN IF NOT EXISTS no_encontrados INTEGER,
  ADD COLUMN IF NOT EXISTS errores        INTEGER;

-- ── 2. Estructura final consolidada de comunas (Parte I, criterio 5) ──
-- Tabla deduplicada GLOBALMENTE por nombre normalizado. Permite el
-- upsert anti-duplicados: si una comuna ya existe en la estructura final,
-- se ACTUALIZA (no se inserta de nuevo). La tabla `comunas` por-lote se
-- mantiene como log de procesamiento de cada archivo.
CREATE TABLE IF NOT EXISTS comunas_consolidadas (
  id                 TEXT PRIMARY KEY,
  nombre_normalizado TEXT NOT NULL UNIQUE,   -- clave de conflicto para el upsert
  nombre             TEXT NOT NULL,
  region             TEXT,
  habitantes         INTEGER,
  fuente             TEXT,                    -- 'api' | 'local' | 'no_encontrado'
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comunas_consolidadas_nombre
  ON comunas_consolidadas(nombre_normalizado);

-- ── 3. Row Level Security (igual que el resto del proyecto) ──────
ALTER TABLE comunas_consolidadas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comunas_consolidadas_all" ON comunas_consolidadas;
CREATE POLICY "comunas_consolidadas_all"
  ON comunas_consolidadas FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- ── Notas ────────────────────────────────────────────────────────
-- · imagen_fecha (famosos) ya existe desde schema_v3.sql y es TEXT,
--   por lo que ahora puede almacenar un timestamp ISO completo (fecha+hora)
--   sin cambios de esquema.
