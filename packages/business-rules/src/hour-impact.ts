import { toIsoDateOnly } from './iso-date';

export type HourLogForImpact = {
  id: string;
  dataVoo?: string | null;
  horasDelta: number;
  ciclos?: number;
  pousos?: number;
  appliedTo?: string[];
};

export type ComponentForImpact = {
  id: string;
  tipo?: string | null;
  tsn?: number | null;
  tso?: number | null;
  tboHoras?: number | null;
  tlvHoras?: number | null;
  horas?: boolean | null;
  instalacao?: string | null;
};

export type PlannedHourImpact = {
  componentId: string;
  logId: string;
  horas: number;
  ciclos: number;
  pousos: number;
};

const HOUR_EPS = 0.05;

function hours(value: number | null | undefined): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function approxHours(a: number, b: number): boolean {
  return Math.abs(hours(a) - hours(b)) <= HOUR_EPS;
}

export function installedByFlightDate(instalacao: string | null | undefined, dataVoo: string | null | undefined): boolean {
  const inst = toIsoDateOnly(instalacao);
  if (!inst) return true;
  const flight = toIsoDateOnly(dataVoo ?? null);
  if (!flight) return true;
  return inst <= flight;
}

/** Só entra no voo quem tem controle de horas (flag ou TBO/TLV). TSN isolado não basta. */
export function receivesHourImpact(comp: ComponentForImpact): boolean {
  if (comp.horas === true) return true;
  if (comp.horas === false && !(Number(comp.tboHoras) > 0) && !(Number(comp.tlvHoras) > 0)) {
    return false;
  }
  return Number(comp.tboHoras) > 0 || Number(comp.tlvHoras) > 0;
}

/** TSN ainda é o das horas da aeronave antes dos voos vigentes (espelho atrasado). */
export function componentBehindAirframe(tsn: number | null | undefined, aircraftHours: number, flownHours: number): boolean {
  return approxHours(hours(tsn), hours(aircraftHours) - hours(flownHours));
}

/**
 * Quais voos ainda faltam na peça. Se o TSN está no valor pré-voo (espelho)
 * reaplica mesmo que appliedTo já cite a peça — o contador não andou.
 */
export function planMissingHourImpacts(opts: {
  aircraftHours: number;
  logs: HourLogForImpact[];
  components: ComponentForImpact[];
}): PlannedHourImpact[] {
  const flown = opts.logs.reduce((s, log) => s + hours(log.horasDelta), 0);
  const planned: PlannedHourImpact[] = [];

  for (const log of opts.logs) {
    const delta = hours(log.horasDelta);
    const ciclos = hours(log.ciclos);
    const pousos = hours(log.pousos);
    if (!delta && !ciclos && !pousos) continue;
    const applied = new Set((log.appliedTo ?? []).map(String));

    for (const comp of opts.components) {
      if (!receivesHourImpact(comp)) continue;
      if (!installedByFlightDate(comp.instalacao, log.dataVoo)) continue;
      const already = applied.has(String(comp.id));
      const behind = componentBehindAirframe(comp.tsn, opts.aircraftHours, flown);
      if (already && !behind) continue;
      planned.push({
        componentId: String(comp.id),
        logId: String(log.id),
        horas: delta,
        ciclos,
        pousos,
      });
    }
  }
  return planned;
}
