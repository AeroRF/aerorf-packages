export type DocumentRetentionType = 'lifecycle' | 'periodic';

/** Categorias de vida útil — histórico preservado enquanto a aeronave existir. */
const LIFECYCLE_CATEGORIES = ['Célula', 'Motor / Hélice / Sist. Crítico'];

export function getDocumentRetentionType(categoria: string): DocumentRetentionType {
  const cat = categoria.trim();
  if (LIFECYCLE_CATEGORIES.includes(cat)) return 'lifecycle';
  return 'periodic';
}

export function retentionTypeLabel(type: DocumentRetentionType): string {
  return type === 'lifecycle' ? 'Vida útil da aeronave' : 'Renovação periódica';
}

export function formatStorageBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / 1024 ** i;
  return `${value >= 10 || i === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[i]}`;
}

/** Caminhões: documentos regulatórios são renovação periódica (vistoria, seguro, tacógrafo, licenciamento). */
export function getTruckDocumentRetentionType(_tipo: string): DocumentRetentionType {
  return 'periodic';
}
