import type { PlanLimits } from './billing-gates';

const ALL_MODULES = [
  'dashboard',
  'empresas',
  'usuarios',
  'aviacao',
  'caminhoes',
  'combustiveis',
  'estoque',
  'telemetria',
] as const;

export function defaultPlanLimits(): PlanLimits {
  return {
    maxUsers: 100,
    maxAircraft: 50,
    maxStorageBytes: 5 * 1024 * 1024 * 1024,
    modules: [...ALL_MODULES],
  };
}

export function parsePlanLimits(plano: Record<string, unknown> | null | undefined): PlanLimits {
  const base = defaultPlanLimits();
  if (!plano || typeof plano !== 'object') return base;

  const modulesRaw = plano.modulos ?? plano.modules;
  const modules = Array.isArray(modulesRaw)
    ? modulesRaw.filter((m): m is string => typeof m === 'string')
    : base.modules;

  return {
    maxUsers: Number(plano.maxUsers ?? plano.max_usuarios ?? base.maxUsers),
    maxAircraft: Number(plano.maxAircraft ?? plano.max_aeronaves ?? base.maxAircraft),
    maxStorageBytes: Number(plano.maxStorageBytes ?? plano.max_storage_bytes ?? base.maxStorageBytes),
    modules: modules.length ? modules : base.modules,
  };
}
