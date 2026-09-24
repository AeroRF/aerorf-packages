/** Vida da peça. Horas da aeronave (horas_retirada) não entram aqui. */

export type ComponentLifeCounters = {
  tsn: number;
  tso: number;
  csn: number;
  cso: number;
  usadosHoras: number;
  usadosCiclos: number;
};

export function nonNegativeHours(value: number | null | undefined): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function hasCounterValue(value: unknown): boolean {
  return value != null && value !== '';
}

export function snapshotComponentCounters(input: {
  tsn?: number | null;
  tso?: number | null;
  csn?: number | null;
  cso?: number | null;
  usadosHoras?: number | null;
  usadosCiclos?: number | null;
}): ComponentLifeCounters {
  const tsn = nonNegativeHours(input.tsn ?? input.usadosHoras);
  const csn = nonNegativeHours(input.csn ?? input.usadosCiclos);
  return {
    tsn,
    tso: nonNegativeHours(input.tso),
    csn,
    cso: nonNegativeHours(input.cso),
    usadosHoras: nonNegativeHours(input.usadosHoras ?? input.tsn),
    usadosCiclos: nonNegativeHours(input.usadosCiclos ?? input.csn),
  };
}

export function countersFromMovementMetadata(metadata: unknown): Partial<ComponentLifeCounters> | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const counters = (metadata as { counters?: unknown }).counters;
  if (!counters || typeof counters !== 'object') return null;
  const raw = counters as Record<string, unknown>;
  if (
    !hasCounterValue(raw.tsn) &&
    !hasCounterValue(raw.tso) &&
    !hasCounterValue(raw.usadosHoras) &&
    !hasCounterValue(raw.csn)
  ) {
    return null;
  }
  return raw as Partial<ComponentLifeCounters>;
}

/** Estorno/cancelamento de retirada: devolve a vida da peça. Ignora horas da aeronave. */
export function countersAfterRetiradaRollback(opts: {
  snapshot?: Partial<ComponentLifeCounters> | null;
  current: {
    tsn?: number | null;
    tso?: number | null;
    csn?: number | null;
    cso?: number | null;
    usadosHoras?: number | null;
    usadosCiclos?: number | null;
  };
  horasRetirada?: number | null;
}): ComponentLifeCounters {
  void opts.horasRetirada;
  const snapshot = opts.snapshot;
  if (snapshot && countersFromMovementMetadata({ counters: snapshot })) {
    return snapshotComponentCounters({ ...opts.current, ...snapshot });
  }
  return snapshotComponentCounters(opts.current);
}
