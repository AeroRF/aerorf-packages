import { getDocumentExpiryStatus } from './document-status';
import { isPilotLicenseValid } from './document-validity';

export interface PersonDocumentValidityInput {
  validade: string | Date | null | undefined;
  alertaDias?: number;
}

export function isPersonDocumentExpired(
  doc: PersonDocumentValidityInput,
  today = new Date(),
): boolean {
  const alertDays = Number(doc.alertaDias ?? 30) || 30;
  return getDocumentExpiryStatus(doc.validade, alertDays, today) === 'VENCIDO';
}

/** Piloto bloqueado se licença vencida ou qualquer documento vencido. */
export function isPilotBlockedForFlight(
  validadeLicenca: string | Date | null | undefined,
  documents: PersonDocumentValidityInput[],
  today = new Date(),
): boolean {
  if (!isPilotLicenseValid(validadeLicenca, today)) return true;
  return documents.some((d) => isPersonDocumentExpired(d, today));
}

export const COMPONENT_TRANSIT_STATUS = 'EM_TRANSITO';

export function isComponentInTransit(status: string | null | undefined): boolean {
  return String(status ?? '').trim().toUpperCase() === COMPONENT_TRANSIT_STATUS;
}
