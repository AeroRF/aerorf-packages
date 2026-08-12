const OPEN_STATUSES = new Set([
  'open',
  'aberta',
  'pendente',
  'em_execucao',
  'em execução',
  'em_execução',
  'iniciada',
  'pending',
  'in_progress',
]);

export function isOpenWorkorderStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  return OPEN_STATUSES.has(status.trim().toLowerCase());
}
