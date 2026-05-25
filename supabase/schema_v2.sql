-- ==========================================
-- data-cleaner v2 — Módulos Famosos y Lugares
-- Pegar en: Supabase Dashboard → SQL Editor → Run
-- ==========================================

-- ── MÓDULO FAMOSOS ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS famosos_batches (
  id             TEXT PRIMARY KEY,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  file_name      TEXT NOT NULL,
  total_input    INTEGER NOT NULL,
  total_output   INTEGER NOT NULL,
  duplicates     INTEGER NOT NULL,
  changes        INTEGER NOT NULL DEFAULT 0,
  cumpleanos     INTEGER NOT NULL DEFAULT 0,
  quality_before DOUBLE PRECISION,
  quality_after  DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS famosos (
  id                TEXT PRIMARY KEY,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  batch_id          TEXT NOT NULL REFERENCES famosos_batches(id) ON DELETE CASCADE,
  nombre            TEXT NOT NULL,
  fecha_original    TEXT NOT NULL,
  fecha_nacimiento  TEXT,           -- formato DD-MM-YYYY, NULL si a.C. o aprox.
  fecha_aprox       TEXT,           -- ej: "aprox. 69 a.C.", NULL si fecha normal
  edad              INTEGER,        -- NULL si fecha_nacimiento es NULL
  es_cumpleanios    INTEGER NOT NULL DEFAULT 0  -- 1 si hoy es su cumpleaños
);

CREATE TABLE IF NOT EXISTS famosos_logs (
  id          TEXT PRIMARY KEY,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  batch_id    TEXT NOT NULL REFERENCES famosos_batches(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  original    TEXT NOT NULL,
  normalized  TEXT NOT NULL,
  change_type TEXT NOT NULL,  -- NORMALIZADO | DUPLICADO | SIN_CAMBIO | FECHA_INVALIDA
  detail      TEXT
);

-- ── MÓDULO LUGARES ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lugares_batches (
  id             TEXT PRIMARY KEY,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  file_name      TEXT NOT NULL,
  total_input    INTEGER NOT NULL,
  total_output   INTEGER NOT NULL,
  duplicates     INTEGER NOT NULL,
  changes        INTEGER NOT NULL DEFAULT 0,
  quality_before DOUBLE PRECISION,
  quality_after  DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS lugares (
  id           TEXT PRIMARY KEY,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  batch_id     TEXT NOT NULL REFERENCES lugares_batches(id) ON DELETE CASCADE,
  nombre_lugar TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS georeferencias (
  id         TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  id_lugar   TEXT NOT NULL REFERENCES lugares(id) ON DELETE CASCADE,
  latitud    DOUBLE PRECISION,
  longitud   DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS direcciones (
  id                      TEXT PRIMARY KEY,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  id_lugar                TEXT NOT NULL REFERENCES lugares(id) ON DELETE CASCADE,
  nombre_calle            TEXT,
  numero_calle            TEXT,
  ciudad_estado_provincia TEXT,
  pais                    TEXT,
  raw_direccion           TEXT
);

CREATE TABLE IF NOT EXISTS lugares_logs (
  id          TEXT PRIMARY KEY,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  batch_id    TEXT NOT NULL REFERENCES lugares_batches(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  original    TEXT NOT NULL,
  normalized  TEXT NOT NULL,
  change_type TEXT NOT NULL,  -- OK | DUPLICADO | POSIBLE_DUPLICADO
  detail      TEXT
);

-- ── Índices ─────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_famosos_batch_id         ON famosos(batch_id);
CREATE INDEX IF NOT EXISTS idx_famosos_logs_batch_id    ON famosos_logs(batch_id);
CREATE INDEX IF NOT EXISTS idx_famosos_batches_created  ON famosos_batches(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lugares_batch_id         ON lugares(batch_id);
CREATE INDEX IF NOT EXISTS idx_georef_id_lugar          ON georeferencias(id_lugar);
CREATE INDEX IF NOT EXISTS idx_dir_id_lugar             ON direcciones(id_lugar);
CREATE INDEX IF NOT EXISTS idx_lugares_logs_batch_id    ON lugares_logs(batch_id);
CREATE INDEX IF NOT EXISTS idx_lugares_batches_created  ON lugares_batches(created_at DESC);

-- ── Row Level Security ───────────────────────────────────────────

ALTER TABLE famosos_batches  ENABLE ROW LEVEL SECURITY;
ALTER TABLE famosos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE famosos_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE lugares_batches  ENABLE ROW LEVEL SECURITY;
ALTER TABLE lugares          ENABLE ROW LEVEL SECURITY;
ALTER TABLE georeferencias   ENABLE ROW LEVEL SECURITY;
ALTER TABLE direcciones      ENABLE ROW LEVEL SECURITY;
ALTER TABLE lugares_logs     ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "famosos_batches_all" ON famosos_batches;
DROP POLICY IF EXISTS "famosos_all"         ON famosos;
DROP POLICY IF EXISTS "famosos_logs_all"    ON famosos_logs;
DROP POLICY IF EXISTS "lugares_batches_all" ON lugares_batches;
DROP POLICY IF EXISTS "lugares_all"         ON lugares;
DROP POLICY IF EXISTS "georef_all"          ON georeferencias;
DROP POLICY IF EXISTS "dir_all"             ON direcciones;
DROP POLICY IF EXISTS "lugares_logs_all"    ON lugares_logs;

CREATE POLICY "famosos_batches_all" ON famosos_batches FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "famosos_all"         ON famosos         FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "famosos_logs_all"    ON famosos_logs    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "lugares_batches_all" ON lugares_batches FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "lugares_all"         ON lugares         FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "georef_all"          ON georeferencias  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "dir_all"             ON direcciones     FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "lugares_logs_all"    ON lugares_logs    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
