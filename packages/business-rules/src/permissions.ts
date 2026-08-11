import type { UserPermissions } from '@aerorf/shared';

export function canAccessModule(
  permissions: UserPermissions,
  moduleKey: string,
  fullAccess = false,
): boolean {
  if (fullAccess) return true;
  return permissions.modules.includes(moduleKey);
}

export function canPerformAction(
  permissions: UserPermissions,
  action: string,
  fullAccess = false,
): boolean {
  if (fullAccess) return true;
  return permissions.actions.includes(action as UserPermissions['actions'][number]);
}

export function canAccessTenant(
  empresaId: string,
  empresasPermitidas: string[],
  fullAccess = false,
): boolean {
  if (fullAccess) return true;
  if (!empresaId) return false;
  if (empresasPermitidas.length === 0) return true;
  return empresasPermitidas.includes(empresaId);
}

export function canAccessUnit(
  unidadeId: string,
  unidadesPermitidas: string[],
  fullAccess = false,
): boolean {
  if (fullAccess) return true;
  if (!unidadeId) return false;
  if (unidadesPermitidas.length === 0) return true;
  return unidadesPermitidas.includes(unidadeId);
}
