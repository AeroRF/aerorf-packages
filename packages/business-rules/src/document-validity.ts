import { getDocumentExpiryStatus } from './document-status';
import { toIsoDateOnly } from './iso-date';

/** Documento válido se validade ausente/ilegível ou calendário >= hoje. */
export function isDocumentValid(validade: string | Date | null | undefined, today = new Date()): boolean {
  if (!toIsoDateOnly(validade)) return true;
  return getDocumentExpiryStatus(validade, 0, today) !== 'VENCIDO';
}

export function isPilotLicenseValid(validadeLicenca: string | Date | null | undefined, today = new Date()): boolean {
  return isDocumentValid(validadeLicenca, today);
}
