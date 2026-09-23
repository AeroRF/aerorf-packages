/** Controle por horas no mapa: TBO usa TSO; TLV usa TSN. */

export type HourControlInput = {
  tsoNovo?: boolean | null;
  tso?: number | null;
  tsn?: number | null;
  tboHoras?: number | null;
  tlvHoras?: number | null;
  limiteHoras?: number | null;
};

function positiveLimit(value: number | null | undefined): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function hours(value: number | null | undefined): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/** Saldo = TBO − TSO. Peça NOVO ainda não tem TSO: usa TSN. */
export function remainingHoursTbo(opts: HourControlInput): number | null {
  const tbo = positiveLimit(opts.tboHoras ?? opts.limiteHoras);
  if (tbo == null) return null;
  const consumed = opts.tsoNovo ? hours(opts.tsn) : hours(opts.tso);
  return tbo - consumed;
}

/** Saldo = TLV − TSN. */
export function remainingHoursTlv(opts: HourControlInput): number | null {
  const tlv = positiveLimit(opts.tlvHoras);
  if (tlv == null) return null;
  return tlv - hours(opts.tsn);
}

/**
 * Saldo do controle cadastrado. Se TBO e TLV coexistirem, vale o menor
 * (primeiro limite a vencer), como na regra de múltiplos controles.
 */
export function remainingHoursByControl(opts: HourControlInput): number | null {
  const tboSaldo = remainingHoursTbo(opts);
  const tlvSaldo = remainingHoursTlv(opts);
  if (tboSaldo != null && tlvSaldo != null) return Math.min(tboSaldo, tlvSaldo);
  return tboSaldo ?? tlvSaldo;
}

/** HS/T = horas da aeronave + saldo. O ponto de vencimento não muda com o voo. */
export function aircraftHoursAtDue(aircraftHours: number, remaining: number | null): number | null {
  if (remaining == null) return null;
  return hours(aircraftHours) + remaining;
}
