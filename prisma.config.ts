// prisma.config.ts — requerido por Prisma 7 para schema validation en el IDE
// No se usa para migraciones (usamos Supabase JS client, no Prisma directamente)
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
});
