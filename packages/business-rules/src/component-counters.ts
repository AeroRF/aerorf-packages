/** Vida da peça. Horas da aeronave (horas_retirada) não entram aqui. */

export type ComponentLifeCounters = {
  tsn: number;
  tso: number;
  csn: number;
  cso: number;
  usadosHoras: number;
  usadosCiclos: number;
};

export type ComponentLifeInput = {
  tsn?: number | null;
  tso?: number | null;
  csn?: number | null;
  cso?: number | null;
  usadosHoras?: number | null;
  usadosCiclos?: number | null;
};

export function nonNegativeHours(value: number | null | undefined): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function finiteHours(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Primeiro valor > 0. Zero/negativo é lixo de estorno, não overhaul. */
export function firstPositiveHours(...candidates: Array<number | null | undefined>): number | null {
  for (const value of candidates) {
    const n = finiteHours(value);
    if (n != null && n > 0) return n;
  }
  return null;
}

export function snapshotComponentCounters(input: ComponentLifeInput): ComponentLifeCounters {
  const tsn = firstPositiveHours(input.tsn, input.usadosHoras) ?? 0;
  const csn = firstPositiveHours(input.csn, input.usadosCiclos) ?? 0;
  return {
    tsn,
    tso: firstPositiveHours(input.tso) ?? 0,
    csn,
    cso: firstPositiveHours(input.cso) ?? 0,
    usadosHoras: firstPositiveHours(input.usadosHoras, input.tsn) ?? tsn,
    usadosCiclos: firstPositiveHours(input.usadosCiclos, input.csn) ?? csn,
  };
}

export function countersFromMovementMetadata(metadata: unknown): Partial<ComponentLifeCounters> | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const rawMeta = metadata as { counters?: unknown; lastLife?: unknown };
  const counters = rawMeta.counters ?? rawMeta.lastLife;
  if (!counters || typeof counters !== 'object') return null;
  const raw = counters as Record<string, unknown>;
  if (
    finiteHours(raw.tsn) == null &&
    finiteHours(raw.tso) == null &&
    finiteHours(raw.usadosHoras) == null &&
    finiteHours(raw.csn) == null
  ) {
    return null;
  }
  return raw as Partial<ComponentLifeCounters>;
}

/** Nunca grava 0 por cima de um TSO conhecido (ex.: 374 h do HSI). */
export function mergeLastLife(
  previous: Partial<ComponentLifeCounters> | null | undefined,
  next: ComponentLifeInput,
): Partial<ComponentLifeCounters> {
  return {
    tsn: firstPositiveHours(next.tsn, previous?.tsn) ?? previous?.tsn,
    tso: firstPositiveHours(next.tso, previous?.tso) ?? previous?.tso,
    csn: firstPositiveHours(next.csn, previous?.csn) ?? previous?.csn,
    cso: firstPositiveHours(next.cso, previous?.cso) ?? previous?.cso,
    usadosHoras: firstPositiveHours(next.usadosHoras, previous?.usadosHoras) ?? previous?.usadosHoras,
    usadosCiclos: firstPositiveHours(next.usadosCiclos, previous?.usadosCiclos) ?? previous?.usadosCiclos,
  };
}

/** Estorno/cancelamento de retirada: devolve a vida da peça. Ignora horas da aeronave. */
export function countersAfterRetiradaRollback(opts: {
  snapshot?: Partial<ComponentLifeCounters> | null;
  lastKnown?: Partial<ComponentLifeCounters> | null;
  current: ComponentLifeInput;
  horasRetirada?: number | null;
}): ComponentLifeCounters {
  void opts.horasRetirada;
  const snap = opts.snapshot;
  const known = opts.lastKnown;
  const cur = opts.current;
  const tsn = firstPositiveHours(snap?.tsn, known?.tsn, cur.tsn, cur.usadosHoras) ?? 0;
  const tso = firstPositiveHours(snap?.tso, known?.tso, cur.tso) ?? 0;
  const csn = firstPositiveHours(snap?.csn, known?.csn, cur.csn, cur.usadosCiclos) ?? 0;
  const cso = firstPositiveHours(snap?.cso, known?.cso, cur.cso) ?? 0;
  return {
    tsn,
    tso,
    csn,
    cso,
    usadosHoras: firstPositiveHours(snap?.usadosHoras, known?.usadosHoras, cur.usadosHoras, tsn) ?? tsn,
    usadosCiclos: firstPositiveHours(snap?.usadosCiclos, known?.usadosCiclos, cur.usadosCiclos, csn) ?? csn,
  };
}
