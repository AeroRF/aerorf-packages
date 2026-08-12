export interface HourLogValidationResult {
  valid: boolean;
  message?: string;
}

/** Horas totais não podem regredir em relação ao último lançamento (legado aviacao-module). */
export function validateHourLogTotals(
  previousTotal: number | null | undefined,
  newTotal: number,
): HourLogValidationResult {
  const prev = Number(previousTotal ?? 0);
  if (Number.isNaN(newTotal)) {
    return { valid: false, message: 'Horas totais inválidas.' };
  }
  if (prev > 0 && newTotal < prev) {
    return {
      valid: false,
      message: 'As horas totais não podem ser menores que o último lançamento.',
    };
  }
  return { valid: true };
}
