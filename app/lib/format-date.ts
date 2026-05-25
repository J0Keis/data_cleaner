/** Formatea un timestamp ISO a fecha legible en español (ej: "24 may 2026, 15:30") */
export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}
