export type ComponentStatus = 'OK' | 'ATENCAO' | 'VENCIDO';

export interface ComponentLimits {
  controlePor?: string | null;
  limiteHoras?: number | null;
  usadosHoras?: number | null;
  limiteCiclos?: number | null;
  usadosCiclos?: number | null;
  dataValidade?: string | Date | null;
  alertHoras?: number | null;
  alertCiclos?: number | null;
  alertDias?: number | null;
}

function normalizeControl(value: string | null | undefined): string {
  return String(value ?? '')
    .trim()
    .toUpperCase();
}

export function evaluateComponentStatus(
  component: ComponentLimits,
  today = new Date(),
): ComponentStatus {
  const ctrl = normalizeControl(component.controlePor);

  if (ctrl === 'HORAS' && Number(component.limiteHoras ?? 0) > 0) {
    const rest = Number(component.limiteHoras ?? 0) - Number(component.usadosHoras ?? 0);
    if (rest < 0) return 'VENCIDO';
    if (rest <= Number(component.alertHoras ?? 0)) return 'ATENCAO';
    return 'OK';
  }

  if (ctrl === 'CICLOS' && Number(component.limiteCiclos ?? 0) > 0) {
    const rest = Number(component.limiteCiclos ?? 0) - Number(component.usadosCiclos ?? 0);
    if (rest < 0) return 'VENCIDO';
    if (rest <= Number(component.alertCiclos ?? 0)) return 'ATENCAO';
    return 'OK';
  }

  if (ctrl === 'DATA' && component.dataValidade) {
    const raw = component.dataValidade instanceof Date
      ? component.dataValidade
      : new Date(String(component.dataValidade).slice(0, 10));
    if (Number.isNaN(raw.getTime())) return 'OK';
    const ref = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const exp = new Date(raw.getFullYear(), raw.getMonth(), raw.getDate());
    const diff = Math.ceil((exp.getTime() - ref.getTime()) / 86400000);
    if (diff < 0) return 'VENCIDO';
    if (diff <= Number(component.alertDias ?? 0)) return 'ATENCAO';
    return 'OK';
  }

  return 'OK';
}

export function isComponentOverdue(component: ComponentLimits, today = new Date()): boolean {
  return evaluateComponentStatus(component, today) === 'VENCIDO';
}
