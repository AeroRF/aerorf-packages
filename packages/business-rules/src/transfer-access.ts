export interface TransferValidationResult {
  valid: boolean;
  message?: string;
}

export type TransferStatus =
  | 'pendente_aceite'
  | 'concluida'
  | 'concluida_externa'
  | 'recusada'
  | 'cancelada';

export function normalizeTransferStatus(status: string | null | undefined): TransferStatus | string {
  const raw = String(status ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
  if (raw === 'pendente' || raw === 'aguardando_aceite') return 'pendente_aceite';
  if (raw === 'concluida_externa' || raw === 'transferida_externa') return 'concluida_externa';
  return raw;
}

export function transferStatusLabel(status: string | null | undefined): string {
  const s = normalizeTransferStatus(status);
  switch (s) {
    case 'pendente_aceite':
      return 'PENDENTE ACEITE';
    case 'concluida':
      return 'CONCLUÍDA';
    case 'concluida_externa':
      return 'CONCLUÍDA EXTERNA';
    case 'recusada':
      return 'RECUSADA';
    case 'cancelada':
      return 'CANCELADA';
    default:
      return String(status ?? '—').toUpperCase();
  }
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

export function canAcceptAircraftTransfer(
  fullAccess: boolean,
  userEmpresaId: string,
  toEmpresaId: string,
  empresasPermitidas: string[],
): boolean {
  if (fullAccess) return true;
  if (userEmpresaId && userEmpresaId === toEmpresaId) return true;
  return empresasPermitidas.includes(toEmpresaId);
}

export function canTransferBeAccepted(status: string | null | undefined): boolean {
  return normalizeTransferStatus(status) === 'pendente_aceite';
}

export function canTransferBeRefused(status: string | null | undefined): boolean {
  return normalizeTransferStatus(status) === 'pendente_aceite';
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

export function validateNoPendingTransfer(hasPending: boolean): TransferValidationResult {
  if (hasPending) {
    return { valid: false, message: 'Já existe transferência pendente de aceite para esta aeronave.' };
  }
  return { valid: true };
}

export function isAircraftTransferLocked(statusTransferencia: string | null | undefined): boolean {
  const s = normalizeTransferStatus(statusTransferencia);
  return s === 'pendente_aceite' || s === 'concluida_externa' || s === 'transferida_externa';
}

export function validateExternalTransferInput(
  compradorUsaAeroRF: boolean,
  toEmpresaId: string | null | undefined,
  destinoExternoNome: string | null | undefined,
): TransferValidationResult {
  if (compradorUsaAeroRF) {
    if (!toEmpresaId) {
      return { valid: false, message: 'Informe a empresa de destino.' };
    }
    return { valid: true };
  }
  if (!destinoExternoNome?.trim()) {
    return { valid: false, message: 'Informe o nome do destinatário externo.' };
  }
  return { valid: true };
}
