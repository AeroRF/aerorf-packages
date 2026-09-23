import { toIsoDateOnly } from './iso-date';

export type DocumentExpiryStatus = 'SEM_VALIDADE' | 'VALIDO' | 'A_VENCER' | 'VENCIDO';

export function getDocumentExpiryStatus(
  validade: string | Date | null | undefined,
  alertDays = 30,
  today = new Date(),
): DocumentExpiryStatus {
  const iso = toIsoDateOnly(validade);
  if (!iso) return 'SEM_VALIDADE';

  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return 'SEM_VALIDADE';
  const expYear = parseInt(match[1], 10);
  const expMonth = parseInt(match[2], 10) - 1;
  const expDay = parseInt(match[3], 10);
  const testDate = new Date(expYear, expMonth, expDay);
  if (testDate.getFullYear() !== expYear || testDate.getMonth() !== expMonth || testDate.getDate() !== expDay) {
    return 'SEM_VALIDADE';
  }

  // Use local date components for comparison to avoid timezone issues
  const refYear = today.getFullYear();
  const refMonth = today.getMonth();
  const refDay = today.getDate();

  // Calculate difference in days using local dates
  const ref = new Date(refYear, refMonth, refDay);
  const exp = new Date(expYear, expMonth, expDay);
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
