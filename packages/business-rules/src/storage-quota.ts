export function buildStorageKey(empresaId: string, unidadeId: string, tipo: string, filename: string): string {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `tenants/${empresaId}/unit_${unidadeId}/${tipo}/${safeName}`;
}

export function isStorageKeyInTenant(key: string, empresaId: string): boolean {
  return key.startsWith(`tenants/${empresaId}/`);
}

export function storageUsagePercent(usedBytes: number, limitBytes: number): number {
  if (limitBytes <= 0) return 0;
  return Math.min(100, (usedBytes / limitBytes) * 100);
}
