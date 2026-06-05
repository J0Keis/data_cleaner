-- ==========================================
-- data-cleaner v3 — Parte 3 Evaluación
-- Correr en: Supabase Dashboard → SQL Editor → Run
-- ==========================================

-- ── 1. Comunas: agregar región y habitantes (Parte I) ────────────
ALTER TABLE comunas
  ADD COLUMN IF NOT EXISTS region     TEXT,
  ADD COLUMN IF NOT EXISTS habitantes INTEGER;

-- ── 2. Famosos: agregar caché de imagen Wikipedia (Parte II) ─────
ALTER TABLE famosos
  ADD COLUMN IF NOT EXISTS imagen_url    TEXT,
  ADD COLUMN IF NOT EXISTS imagen_fuente TEXT,
  ADD COLUMN IF NOT EXISTS imagen_fecha  TEXT;

-- ── Índice para búsqueda por nombre (imagen cache) ───────────────
CREATE INDEX IF NOT EXISTS idx_famosos_nombre ON famosos(nombre);
