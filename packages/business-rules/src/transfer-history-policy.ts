export type TransferHistoryPolicy = {
  includeTransfers: boolean;
  includeMaintenance: boolean;
  includeComponents: boolean;
  includeDocuments: boolean;
  includeHourLogs: boolean;
  includeTelemetry: boolean;
};

/** Política padrão: manutenção + documentos + componentes; sem voos detalhados/telemetria. */
export const DEFAULT_TRANSFER_HISTORY_POLICY: TransferHistoryPolicy = {
  includeTransfers: true,
  includeMaintenance: true,
  includeComponents: true,
  includeDocuments: true,
  includeHourLogs: false,
  includeTelemetry: false,
};

export function normalizeTransferHistoryPolicy(input: unknown): TransferHistoryPolicy {
  const raw = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
  return {
    includeTransfers: raw.includeTransfers !== false,
    includeMaintenance: raw.includeMaintenance !== false,
    includeComponents: raw.includeComponents !== false,
    includeDocuments: raw.includeDocuments !== false,
    includeHourLogs: raw.includeHourLogs === true,
    includeTelemetry: raw.includeTelemetry === true,
  };
}

export function transferPolicyLabel(policy: TransferHistoryPolicy): string {
  const parts: string[] = [];
  if (policy.includeMaintenance) parts.push('manutenção');
  if (policy.includeComponents) parts.push('componentes');
  if (policy.includeDocuments) parts.push('documentos');
  if (policy.includeTransfers) parts.push('transferências');
  if (policy.includeHourLogs) parts.push('horas/voos');
  if (policy.includeTelemetry) parts.push('telemetria');
  return parts.length ? parts.join(', ') : 'mínimo';
}

export type TransferPackageSection =
  | 'transfers'
  | 'maintenance'
  | 'components'
  | 'documents'
  | 'hourLogs'
  | 'telemetry';

export function isSectionIncluded(policy: TransferHistoryPolicy, section: TransferPackageSection): boolean {
  switch (section) {
    case 'transfers':
      return policy.includeTransfers;
    case 'maintenance':
      return policy.includeMaintenance;
    case 'components':
      return policy.includeComponents;
    case 'documents':
      return policy.includeDocuments;
    case 'hourLogs':
      return policy.includeHourLogs;
    case 'telemetry':
      return policy.includeTelemetry;
    default:
      return false;
  }
}
