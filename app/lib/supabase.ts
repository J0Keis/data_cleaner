// ==========================================
// CLIENTE DE SUPABASE — data-cleaner
// Punto de entrada único para todas las operaciones con la base de datos.
// Usar este cliente en lugar de instanciar createClient directamente.
// ==========================================

import { createClient } from '@supabase/supabase-js'

// Leemos las variables de entorno definidas en .env
const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Singleton: una sola instancia del cliente para toda la app
export const supabase = createClient(supabaseUrl, supabaseKey)

// ==========================================
// TIPOS — reflejan las tablas en Supabase
// Crear estas tablas con el SQL del INSTRUCTIVO en:
//   Supabase Dashboard → SQL Editor → New query
// ==========================================

// Tabla: batches
export type Batch = {
  id: string             // cuid generado por la app
  created_at: string     // timestamp automático de Supabase
  file_name: string      // nombre del archivo subido
  total_input: number    // cantidad de líneas originales
  total_output: number   // cantidad de líneas únicas normalizadas
  duplicates: number     // cantidad de duplicados eliminados
  changes: number        // cantidad de cambios aplicados
  quality_before: number | null // score de calidad antes (0-100)
  quality_after: number | null  // score de calidad después (0-100)
}

// Tabla: comunas
export type Comuna = {
  id: string
  created_at: string
  batch_id: string   // FK → batches.id
  original: string   // texto original (ej: "COPIAPÓ")
  normalized: string // texto normalizado (ej: "Copiapo")
}

// Tabla: log_entries
export type LogEntry = {
  id: string
  created_at: string
  batch_id: string      // FK → batches.id
  line_number: number   // número de línea en el archivo original
  original: string      // valor antes de normalizar
  normalized: string    // valor después de normalizar
  change_type: string   // NORMALIZADO | DUPLICADO | CORREGIDO | SIN_CAMBIO | VACIO (inglés legado soportado en UI)
  detail: string | null // descripción del cambio aplicado
}

// ── Módulo Famosos ──────────────────────────────────────────────

export type FamososBatch = {
  id: string
  created_at: string
  file_name: string
  total_input: number
  total_output: number
  duplicates: number
  changes: number
  cumpleanos: number
  quality_before: number | null
  quality_after: number | null
}

export type Famoso = {
  id: string
  created_at: string
  batch_id: string
  nombre: string
  fecha_original: string
  fecha_nacimiento: string | null  // DD-MM-YYYY
  fecha_aprox: string | null
  edad: number | null
  es_cumpleanios: number           // 0 | 1
}

// ── Módulo Lugares ──────────────────────────────────────────────

export type LugaresBatch = {
  id: string
  created_at: string
  file_name: string
  total_input: number
  total_output: number
  duplicates: number
  changes: number
  quality_before: number | null
  quality_after: number | null
}

export type Lugar = {
  id: string
  created_at: string
  batch_id: string
  nombre_lugar: string
}

export type Georeferencia = {
  id: string
  created_at: string
  id_lugar: string
  latitud: number | null
  longitud: number | null
}

export type Direccion = {
  id: string
  created_at: string
  id_lugar: string
  nombre_calle: string | null
  numero_calle: string | null
  ciudad_estado_provincia: string | null
  pais: string | null
  raw_direccion: string | null
}

// ==========================================
// SQL PARA CREAR LAS TABLAS EN SUPABASE
// Correr en: Dashboard → SQL Editor → New query
// ==========================================
/*
create table batches (
  id           text primary key,
  created_at   timestamptz default now(),
  file_name    text not null,
  total_input  int  not null,
  total_output int  not null,
  duplicates   int  not null,
  changes      int  not null,
  quality_before float,
  quality_after  float
);

create table comunas (
  id          text primary key,
  created_at  timestamptz default now(),
  batch_id    text references batches(id) on delete cascade,
  original    text not null,
  normalized  text not null
);

create table log_entries (
  id          text primary key,
  created_at  timestamptz default now(),
  batch_id    text references batches(id) on delete cascade,
  line_number int  not null,
  original    text not null,
  normalized  text not null,
  change_type text not null,
  detail      text
);
*/
