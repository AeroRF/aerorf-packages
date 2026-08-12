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
  'em_andamento',
  'aguardando',
  'nao_finalizada',
]);

const ALLOWED_STATUSES = new Set([
  'ABERTA',
  'PENDENTE',
  'EM EXECUÇÃO',
  'INICIADA',
  'FINALIZADA',
  'CONCLUIDA',
  'CANCELADA',
  'ESTORNADA',
]);

export function normalizeWorkorderStatus(status: string | null | undefined): string {
  const raw = String(status ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/_/g, ' ');

  if (!raw) return 'ABERTA';
  if (raw === 'open' || raw === 'aberta' || raw === 'pendente' || raw === 'pending') return 'ABERTA';
  if (
    raw === 'in progress' ||
    raw === 'in_progress' ||
    raw.includes('execu') ||
    raw === 'iniciada' ||
    raw === 'em andamento'
  ) {
    return 'EM EXECUÇÃO';
  }
  if (raw.includes('final') || raw.includes('conclu') || raw === 'closed') return 'FINALIZADA';
  if (raw === 'cancelada' || raw === 'estornada') return 'CANCELADA';
  return String(status ?? '').trim().toUpperCase();
}

export function isOpenWorkorderStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  const normalized = normalizeWorkorderStatus(status);
  if (normalized === 'FINALIZADA' || normalized === 'CANCELADA') return false;
  return OPEN_STATUSES.has(status.trim().toLowerCase()) || normalized === 'ABERTA' || normalized === 'EM EXECUÇÃO';
}

export function isRunningWorkorderStatus(status: string | null | undefined): boolean {
  return normalizeWorkorderStatus(status) === 'EM EXECUÇÃO';
}

export function isFinishedWorkorderStatus(status: string | null | undefined): boolean {
  return normalizeWorkorderStatus(status) === 'FINALIZADA';
}

export function validateWorkorderStatus(status: string | null | undefined): { valid: boolean; message?: string } {
  const normalized = normalizeWorkorderStatus(status);
  if (!ALLOWED_STATUSES.has(normalized)) {
    return { valid: false, message: 'Status de OS inválido.' };
  }
  return { valid: true };
}

export function canTransitionWorkorderStatus(
  from: string | null | undefined,
  to: string | null | undefined,
): { allowed: boolean; message?: string } {
  const current = normalizeWorkorderStatus(from);
  const next = normalizeWorkorderStatus(to);

  if (current === next) return { allowed: true };

  const check = validateWorkorderStatus(next);
  if (!check.valid) return { allowed: false, message: check.message };

  if (current === 'FINALIZADA' || current === 'CANCELADA') {
    return { allowed: false, message: 'OS já encerrada.' };
  }

  if (next === 'EM EXECUÇÃO' && current !== 'ABERTA') {
    return { allowed: false, message: 'Somente OS aberta pode ser iniciada.' };
  }

  if (next === 'FINALIZADA' && current !== 'ABERTA' && current !== 'EM EXECUÇÃO') {
    return { allowed: false, message: 'Status atual não permite finalizar a OS.' };
  }

  if (next === 'CANCELADA' && current !== 'ABERTA' && current !== 'EM EXECUÇÃO') {
    return { allowed: false, message: 'Status atual não permite cancelar a OS.' };
  }

  return { allowed: true };
}

export function workorderStatusPillClass(status: string | null | undefined): 'open' | 'run' | 'done' | 'blocked' {
  const normalized = normalizeWorkorderStatus(status);
  if (normalized === 'EM EXECUÇÃO') return 'run';
  if (normalized === 'FINALIZADA') return 'done';
  if (normalized === 'CANCELADA') return 'blocked';
  return 'open';
}
