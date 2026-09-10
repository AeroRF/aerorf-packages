export function isAgriculturalOperation(perfilOperacao?: string | null): boolean {
  return String(perfilOperacao ?? '')
    .trim()
    .toUpperCase() === 'AGRICOLA';
}

function parseMinutes(input: string | null | undefined): number | null {
  const raw = String(input ?? '').trim();
  const m = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  const digits = raw.replace(/\D/g, '');
  if (digits.length >= 4) {
    return Number(digits.slice(0, 2)) * 60 + Number(digits.slice(2, 4));
  }
  return null;
}

/** Delta decimal partida → corte (suporta virada de dia). */
export function calcDeltaPartidaCorte(partida?: string | null, corte?: string | null): number {
  const start = parseMinutes(partida);
  const end = parseMinutes(corte);
  if (start == null || end == null) return 0;
  let diff = end - start;
  if (diff < 0) diff += 24 * 60;
  return Math.round((diff / 60) * 10) / 10;
}

/** Primeiro dia da competência (mês calendário). */
export function competenciaFromDate(isoDate: string | null | undefined): string | null {
  const raw = String(isoDate ?? '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  return `${raw.slice(0, 7)}-01`;
}

export function competenciaLabel(competencia: string | null | undefined): string {
  const raw = String(competencia ?? '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return '—';
  const [y, m] = raw.split('-');
  return `${m}/${y}`;
}

/** Saldo inicial da competência: fechamento anterior ou acumulador atual − movimentos do mês. */
export function periodOpeningBalance(
  previousClosingFinal: number | null | undefined,
  currentAccumulator: number,
  periodMoves: number,
): number {
  if (previousClosingFinal != null && Number.isFinite(Number(previousClosingFinal))) {
    return Number(previousClosingFinal);
  }
  const opening = Number(currentAccumulator) - Number(periodMoves);
  return Math.round(Math.max(0, Number.isFinite(opening) ? opening : 0) * 10) / 10;
}
