-- ==========================================
-- data-cleaner — Schema Supabase
-- Pegar en: Supabase Dashboard → SQL Editor → Run
-- ==========================================

-- (Opcional) Eliminar tabla antigua si ya no la necesitas
DROP TABLE IF EXISTS comunas_norm;

-- ── batches: un registro por cada archivo procesado ──
CREATE TABLE IF NOT EXISTS batches (
  id             TEXT PRIMARY KEY,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  file_name      TEXT NOT NULL,
  total_input    INTEGER NOT NULL,
  total_output   INTEGER NOT NULL,
  duplicates     INTEGER NOT NULL,
  changes        INTEGER NOT NULL,
  quality_before DOUBLE PRECISION,
  quality_after  DOUBLE PRECISION
);

-- ── comunas: valores únicos por batch (original + normalizado) ──
CREATE TABLE IF NOT EXISTS comunas (
  id          TEXT PRIMARY KEY,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  batch_id    TEXT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  original    TEXT NOT NULL,
  normalized  TEXT NOT NULL
);

-- ── log_entries: log detallado línea por línea ──
CREATE TABLE IF NOT EXISTS log_entries (
  id          TEXT PRIMARY KEY,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  batch_id    TEXT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  original    TEXT NOT NULL,
  normalized  TEXT NOT NULL,
  change_type TEXT NOT NULL,
  detail      TEXT
);

-- ── Índices para consultas frecuentes ──
CREATE INDEX IF NOT EXISTS idx_comunas_batch_id
  ON comunas(batch_id);

CREATE INDEX IF NOT EXISTS idx_log_entries_batch_id
  ON log_entries(batch_id);

CREATE INDEX IF NOT EXISTS idx_log_entries_batch_line
  ON log_entries(batch_id, line_number);

CREATE INDEX IF NOT EXISTS idx_batches_created_at
  ON batches(created_at DESC);

-- ── Row Level Security (requerido para usar anon key desde la app) ──
ALTER TABLE batches     ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunas     ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_entries ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas previas si vuelves a ejecutar este script
DROP POLICY IF EXISTS "batches_all"     ON batches;
DROP POLICY IF EXISTS "comunas_all"     ON comunas;
DROP POLICY IF EXISTS "log_entries_all" ON log_entries;

CREATE POLICY "batches_all" ON batches
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "comunas_all" ON comunas
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "log_entries_all" ON log_entries
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);
