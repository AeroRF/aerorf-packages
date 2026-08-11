export const MODULE_KEYS = [
  'dashboard',
  'empresas',
  'usuarios',
  'aviacao',
  'caminhoes',
  'combustiveis',
  'estoque',
  'telemetria',
  'relatorios',
  'configuracoes',
  'documentos',
  'manutencao',
] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];
