/** Documento válido se validade ausente ou >= hoje (YYYY-MM-DD ou Date). */
export function isDocumentValid(validade: string | Date | null | undefined, today = new Date()): boolean {
  if (!validade) return true;
  const d = validade instanceof Date ? validade : new Date(String(validade).slice(0, 10));
  if (Number.isNaN(d.getTime())) return true;
  const ref = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const exp = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return exp >= ref;
}

export function isPilotLicenseValid(validadeLicenca: string | Date | null | undefined, today = new Date()): boolean {
  return isDocumentValid(validadeLicenca, today);
}
