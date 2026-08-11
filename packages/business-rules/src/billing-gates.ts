export interface PlanLimits {
  maxUsers: number;
  maxAircraft: number;
  maxStorageBytes: number;
  modules: string[];
}

export interface PlanUsage {
  users: number;
  aircraft: number;
  storageBytes: number;
}

export type GateResult =
  | { allowed: true }
  | { allowed: false; code: 'USER_LIMIT' | 'AIRCRAFT_LIMIT' | 'STORAGE_LIMIT' | 'MODULE_DENIED'; message: string };

export function checkUserLimit(usage: PlanUsage, limits: PlanLimits): GateResult {
  if (usage.users >= limits.maxUsers) {
    return { allowed: false, code: 'USER_LIMIT', message: 'Limite de usuários do plano atingido.' };
  }
  return { allowed: true };
}

export function checkAircraftLimit(usage: PlanUsage, limits: PlanLimits, warnPercent = 80): GateResult & { warning?: boolean } {
  const ratio = limits.maxAircraft > 0 ? (usage.aircraft / limits.maxAircraft) * 100 : 0;
  if (usage.aircraft >= limits.maxAircraft) {
    return { allowed: false, code: 'AIRCRAFT_LIMIT', message: 'Limite de aeronaves do plano atingido.' };
  }
  if (ratio >= warnPercent) {
    return { allowed: true, warning: true };
  }
  return { allowed: true };
}

export function checkStorageLimit(usage: PlanUsage, limits: PlanLimits, warnPercent = 80): GateResult & { warning?: boolean } {
  const ratio = limits.maxStorageBytes > 0 ? (usage.storageBytes / limits.maxStorageBytes) * 100 : 0;
  if (usage.storageBytes >= limits.maxStorageBytes) {
    return { allowed: false, code: 'STORAGE_LIMIT', message: 'Limite de armazenamento atingido.' };
  }
  if (ratio >= warnPercent) {
    return { allowed: true, warning: true };
  }
  return { allowed: true };
}

export function checkModuleAccess(moduleKey: string, limits: PlanLimits): GateResult {
  if (!limits.modules.includes(moduleKey)) {
    return { allowed: false, code: 'MODULE_DENIED', message: `Módulo "${moduleKey}" não contratado.` };
  }
  return { allowed: true };
}
