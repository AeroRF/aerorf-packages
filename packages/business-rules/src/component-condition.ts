import { nonNegativeHours } from './component-counters';

export type PieceCondition = 'NOVO' | 'USADO' | 'REVISADA';

const NOVO_ALIASES = new Set(['NOVO', 'NOVA', 'NEW']);
const REVISADA_ALIASES = new Set(['REVISADA', 'REVISADO', 'OVERHAULED', 'OVERHAUL', 'OH']);

export function normalizePieceCondition(value: string | null | undefined): PieceCondition {
  const raw = String(value ?? '')
    .trim()
    .toUpperCase();
  if (NOVO_ALIASES.has(raw)) return 'NOVO';
  if (REVISADA_ALIASES.has(raw)) return 'REVISADA';
  return 'USADO';
}

export function isForbiddenCellComponent(tipo?: string | null, descricao?: string | null): boolean {
  const t = String(tipo ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
  const d = String(descricao ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
  return t === 'CELULA' || d === 'CELULA';
}

export function formatTsoDisplay(opts: {
  condicao?: string | null;
  tso?: number | null;
  tsoNovo?: boolean | null;
}): string {
  const condicao = normalizePieceCondition(opts.condicao);
  if (opts.tsoNovo === true || condicao === 'NOVO') return 'NOVO';
  if (opts.tso == null || Number.isNaN(Number(opts.tso))) return '—';
  return String(Number(opts.tso));
}

export function countersFromCondition(input: {
  condicao?: string | null;
  tsn?: number | null;
  tso?: number | null;
}): {
  condicao: PieceCondition;
  tsn: number;
  tso: number;
  tsoNovo: boolean;
} {
  const condicao = normalizePieceCondition(input.condicao);
  const tsn = Number(input.tsn ?? 0) || 0;
  if (condicao === 'NOVO') {
    return { condicao, tsn, tso: Number(input.tso ?? 0) || 0, tsoNovo: true };
  }
  return {
    condicao,
    tsn,
    tso: Number(input.tso ?? 0) || 0,
    tsoNovo: false,
  };
}

/** Overhaul da mesma peça: TSN/CSN permanecem; TSO/CSO reiniciam. */
export function applyOverhaulCounters(current: { tsn?: number | null; csn?: number | null }): {
  condicao: PieceCondition;
  tsn: number;
  tso: number;
  csn: number;
  cso: number;
  tsoNovo: boolean;
} {
  return {
    condicao: 'REVISADA',
    tsn: Number(current.tsn ?? 0) || 0,
    tso: 0,
    csn: Number(current.csn ?? 0) || 0,
    cso: 0,
    tsoNovo: false,
  };
}

export function hoursUsedForTbo(opts: {
  tsoNovo?: boolean | null;
  tsn?: number | null;
  tso?: number | null;
  usadosHoras?: number | null;
}): number {
  if (opts.tsoNovo) return nonNegativeHours(opts.tsn ?? opts.usadosHoras);
  if (opts.tso != null) return nonNegativeHours(opts.tso);
  return nonNegativeHours(opts.usadosHoras ?? opts.tsn);
}
