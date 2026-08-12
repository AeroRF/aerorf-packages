import { defaultPlanLimits, parsePlanLimits } from './plan-limits';

export const PLAN_TIERS = ['Padrão', 'Premium', 'Enterprise'] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];

export const SEGMENTOS = [
  'Aviação agrícola',
  'Táxi aéreo',
  'Oficina / manutenção',
  'Outro',
] as const;

export interface EmpresaInput {
  nome: string;
  nomeFantasia?: string | null;
  cnpj?: string | null;
  email?: string | null;
  ativo?: boolean;
}

export interface EmpresaPlanoMeta {
  modulos?: string[];
  planoTier?: string;
  segmento?: string;
  responsavel?: string;
  email?: string;
  telefone?: string;
  externalId?: string;
}

export interface EmpresaValidationResult {
  valid: boolean;
  errors: string[];
}

const TIER_LIMITS: Record<PlanTier, { maxUsers: number; maxAircraft: number; maxStorageBytes: number }> = {
  Padrão: { maxUsers: 25, maxAircraft: 10, maxStorageBytes: 2 * 1024 * 1024 * 1024 },
  Premium: { maxUsers: 100, maxAircraft: 50, maxStorageBytes: 10 * 1024 * 1024 * 1024 },
  Enterprise: { maxUsers: 500, maxAircraft: 200, maxStorageBytes: 50 * 1024 * 1024 * 1024 },
};

export function digitsOnly(value: string): string {
  return String(value ?? '').replace(/\D/g, '');
}

export function maskCnpj(value: string): string {
  let v = digitsOnly(value).slice(0, 14);
  v = v.replace(/^(\d{2})(\d)/, '$1.$2');
  v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
  v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
  v = v.replace(/(\d{4})(\d)/, '$1-$2');
  return v;
}

export function isValidCnpj(value: string | null | undefined): boolean {
  const digits = digitsOnly(String(value ?? ''));
  return digits.length === 14;
}

export function isValidEmail(value: string | null | undefined): boolean {
  if (!value || !String(value).trim()) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

export function validateEmpresaInput(input: EmpresaInput): EmpresaValidationResult {
  const errors: string[] = [];
  if (!String(input.nome ?? '').trim()) errors.push('Informe a razão social.');
  if (!String(input.nomeFantasia ?? '').trim()) errors.push('Informe o nome fantasia.');
  if (input.cnpj && !isValidCnpj(input.cnpj)) errors.push('CNPJ inválido.');
  if (!isValidEmail(input.email)) errors.push('E-mail inválido.');
  return { valid: errors.length === 0, errors };
}

export function canDeleteEmpresa(unidadesCount: number): { allowed: boolean; message?: string } {
  if (unidadesCount > 0) {
    return {
      allowed: false,
      message:
        'Exclusão bloqueada por regra ERP. Esta empresa possui unidades vinculadas. Exclua as unidades antes de excluir a empresa.',
    };
  }
  return { allowed: true };
}

export function segmentPrefix(segmento: string): string {
  const seg = String(segmento ?? '').toLowerCase();
  if (seg.includes('agr')) return 'RF-AGR-';
  if (seg.includes('taxi') || seg.includes('táxi')) return 'RF-TAX-';
  if (seg.includes('oficina') || seg.includes('manut')) return 'RF-MRO-';
  return 'RF-OUT-';
}

export function generateExternalId(segmento: string, existingIds: string[]): string {
  const prefix = segmentPrefix(segmento);
  let max = 0;
  for (const id of existingIds) {
    if (!String(id).startsWith(prefix)) continue;
    const n = parseInt(String(id).split('-').pop() ?? '0', 10);
    if (!Number.isNaN(n)) max = Math.max(max, n);
  }
  return `${prefix}${String(max + 1).padStart(4, '0')}`;
}

export function modulosFromRecord(modulos: Record<string, boolean> | undefined): string[] {
  if (!modulos) return defaultPlanLimits().modules;
  return Object.entries(modulos)
    .filter(([, enabled]) => enabled !== false)
    .map(([key]) => key);
}

export function modulosToRecord(modulos: string[] | undefined): Record<string, boolean> {
  const base = defaultPlanLimits().modules;
  const set = new Set(modulos ?? base);
  return Object.fromEntries(base.map((m) => [m, set.has(m)]));
}

export function resolvePlanTier(value: string | undefined): PlanTier {
  if (value && PLAN_TIERS.includes(value as PlanTier)) return value as PlanTier;
  return 'Padrão';
}

export function buildPlanoPayload(meta: EmpresaPlanoMeta): Record<string, unknown> {
  const tier = resolvePlanTier(meta.planoTier);
  const limits = TIER_LIMITS[tier];
  const modulos = meta.modulos?.length ? meta.modulos : defaultPlanLimits().modules;
  return {
    modulos,
    planoTier: tier,
    segmento: meta.segmento ?? 'Aviação agrícola',
    responsavel: meta.responsavel ?? '',
    email: meta.email ?? '',
    telefone: meta.telefone ?? '',
    externalId: meta.externalId ?? '',
    maxUsers: limits.maxUsers,
    maxAircraft: limits.maxAircraft,
    maxStorageBytes: limits.maxStorageBytes,
  };
}

export function parseEmpresaPlano(plano: Record<string, unknown> | null | undefined) {
  const limits = parsePlanLimits(plano);
  const p = plano ?? {};
  return {
    modulos: limits.modules,
    modulosMap: modulosToRecord(limits.modules),
    planoTier: String(p.planoTier ?? p.plano ?? 'Padrão'),
    segmento: String(p.segmento ?? 'Aviação agrícola'),
    responsavel: String(p.responsavel ?? ''),
    email: String(p.email ?? ''),
    telefone: String(p.telefone ?? ''),
    externalId: String(p.externalId ?? p.external_id ?? ''),
    limits,
  };
}

export function statusLabel(ativo: boolean): string {
  return ativo ? 'Ativa' : 'Inativa';
}
