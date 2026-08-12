export interface TransferValidationResult {
  valid: boolean;
  message?: string;
}

export function canInitiateAircraftTransfer(
  fullAccess: boolean,
  userEmpresaId: string,
  aircraftEmpresaId: string,
  empresasPermitidas: string[],
): boolean {
  if (fullAccess) return true;
  if (!userEmpresaId || userEmpresaId !== aircraftEmpresaId) return false;
  if (empresasPermitidas.length > 0 && !empresasPermitidas.includes(aircraftEmpresaId)) {
    return false;
  }
  return true;
}

export function validateAircraftTransferTargets(
  fromEmpresaId: string,
  toEmpresaId: string,
): TransferValidationResult {
  if (!fromEmpresaId || !toEmpresaId) {
    return { valid: false, message: 'Informe origem e destino da transferência.' };
  }
  if (fromEmpresaId === toEmpresaId) {
    return { valid: false, message: 'Origem e destino não podem ser a mesma empresa.' };
  }
  return { valid: true };
}
