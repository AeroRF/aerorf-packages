export interface UnidadeInput {
  nome: string;
  empresaId?: string;
}

export interface UnidadeValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateUnidadeInput(input: UnidadeInput): UnidadeValidationResult {
  const errors: string[] = [];
  if (!String(input.empresaId ?? '').trim()) errors.push('Selecione a empresa.');
  if (!String(input.nome ?? '').trim()) errors.push('Informe o nome da unidade.');
  return { valid: errors.length === 0, errors };
}

export function generateUnitExternalId(empresaExternalId: string, existingIds: string[]): string {
  const prefix = `${String(empresaExternalId || 'UNI').trim()}-UNI`;
  let max = 0;
  for (const id of existingIds) {
    if (!String(id).startsWith(prefix)) continue;
    const n = parseInt(String(id).slice(prefix.length), 10);
    if (!Number.isNaN(n)) max = Math.max(max, n);
  }
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

export function canDeleteUnidade(deps: {
  usersCount: number;
  aircraftCount: number;
}): { allowed: boolean; message?: string } {
  if (deps.usersCount > 0 || deps.aircraftCount > 0) {
    return {
      allowed: false,
      message:
        'Exclusão bloqueada: existem usuários ou aeronaves vinculados a esta unidade. Reatribua ou desative antes de excluir.',
    };
  }
  return { allowed: true };
}

export function unidadeStatusLabel(ativo: boolean): string {
  return ativo ? 'Ativa' : 'Inativa';
}
