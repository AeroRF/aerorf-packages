export type DocumentExpiryStatus = 'SEM_VALIDADE' | 'VALIDO' | 'A_VENCER' | 'VENCIDO';

export function getDocumentExpiryStatus(
  validade: string | Date | null | undefined,
  alertDays = 30,
  today = new Date(),
): DocumentExpiryStatus {
  if (!validade) return 'SEM_VALIDADE';

  const dt = validade instanceof Date ? validade : new Date(String(validade).slice(0, 10));
  if (Number.isNaN(dt.getTime())) return 'SEM_VALIDADE';

  const ref = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const exp = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  const diff = Math.ceil((exp.getTime() - ref.getTime()) / 86400000);

  if (diff < 0) return 'VENCIDO';
  if (diff <= alertDays) return 'A_VENCER';
  return 'VALIDO';
}

/** Categorias de documento que bloqueiam aeronave quando vencidas (legado Aviação). */
export const AIRCRAFT_BLOCKING_DOC_CATEGORIES = new Set([
  'CÉLULA',
  'CELULA',
  'SEGUROS/LICENÇAS',
  'SEGUROS/LICENCAS',
]);

export function isAircraftBlockingDocCategory(categoria: string | null | undefined): boolean {
  const normalized = String(categoria ?? '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (normalized.includes('CELULA') || normalized.includes('CVA')) return true;
  if (normalized.includes('SEGUROS') && normalized.includes('LICENC')) return true;
  return AIRCRAFT_BLOCKING_DOC_CATEGORIES.has(normalized);
}
