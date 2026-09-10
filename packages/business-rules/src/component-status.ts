import { hoursUsedForTbo } from './component-condition';

export type ComponentStatus = 'OK' | 'ATENCAO' | 'VENCIDO';

export interface ComponentControles {
  horas?: boolean;
  ciclos?: boolean;
  pousos?: boolean;
  calendario?: boolean;
  onCondition?: boolean;
}

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
  tsn?: number | null;
  tso?: number | null;
  tsoNovo?: boolean | null;
  csn?: number | null;
  cso?: number | null;
  pousos?: number | null;
  limitePousos?: number | null;
  tlvHoras?: number | null;
  tboHoras?: number | null;
  controles?: ComponentControles | null;
}

function normalizeControl(value: string | null | undefined): string {
  return String(value ?? '')
    .trim()
    .toUpperCase();
}

function restStatus(rest: number, alert: number): ComponentStatus {
  if (rest < 0) return 'VENCIDO';
  if (alert > 0 && rest <= alert) return 'ATENCAO';
  return 'OK';
}

function worst(statuses: ComponentStatus[]): ComponentStatus {
  if (statuses.includes('VENCIDO')) return 'VENCIDO';
  if (statuses.includes('ATENCAO')) return 'ATENCAO';
  return 'OK';
}

function calendarStatus(
  dataValidade: string | Date | null | undefined,
  alertDias: number,
  today: Date,
): ComponentStatus | null {
  if (!dataValidade) return null;
  const raw = dataValidade instanceof Date
    ? dataValidade
    : new Date(String(dataValidade).slice(0, 10));
  if (Number.isNaN(raw.getTime())) return null;
  const ref = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const exp = new Date(raw.getFullYear(), raw.getMonth(), raw.getDate());
  const diff = Math.ceil((exp.getTime() - ref.getTime()) / 86400000);
  return restStatus(diff, alertDias);
}

function hasExtendedLimits(component: ComponentLimits): boolean {
  const c = component.controles ?? {};
  return Boolean(
    component.tlvHoras ||
      component.tboHoras ||
      component.limitePousos ||
      c.horas ||
      c.ciclos ||
      c.pousos ||
      c.calendario,
  );
}

function evaluateLegacy(component: ComponentLimits, today: Date): ComponentStatus {
  const ctrl = normalizeControl(component.controlePor);

  if (ctrl === 'HORAS' && Number(component.limiteHoras ?? 0) > 0) {
    return restStatus(
      Number(component.limiteHoras ?? 0) - Number(component.usadosHoras ?? 0),
      Number(component.alertHoras ?? 0),
    );
  }

  if (ctrl === 'CICLOS' && Number(component.limiteCiclos ?? 0) > 0) {
    return restStatus(
      Number(component.limiteCiclos ?? 0) - Number(component.usadosCiclos ?? 0),
      Number(component.alertCiclos ?? 0),
    );
  }

  if (ctrl === 'DATA') {
    return calendarStatus(component.dataValidade, Number(component.alertDias ?? 0), today) ?? 'OK';
  }

  return 'OK';
}

export function evaluateComponentStatus(
  component: ComponentLimits,
  today = new Date(),
): ComponentStatus {
  if (!hasExtendedLimits(component)) {
    return evaluateLegacy(component, today);
  }

  const ctrl = component.controles ?? {};
  const statuses: ComponentStatus[] = [];
  const tsn = Number(component.tsn ?? component.usadosHoras ?? 0);
  const usedTbo = hoursUsedForTbo(component);
  const csn = Number(component.csn ?? component.usadosCiclos ?? 0);
  const alertH = Number(component.alertHoras ?? 0);
  const alertC = Number(component.alertCiclos ?? 0);

  const hoursOn = ctrl.horas === true || normalizeControl(component.controlePor) === 'HORAS' || Boolean(component.tlvHoras || component.tboHoras || component.limiteHoras);
  const cyclesOn = ctrl.ciclos === true || normalizeControl(component.controlePor) === 'CICLOS' || Boolean(component.limiteCiclos);
  const landingsOn = ctrl.pousos === true || Boolean(component.limitePousos);
  const calOn = ctrl.calendario === true || normalizeControl(component.controlePor) === 'DATA' || Boolean(component.dataValidade);

  if (hoursOn) {
    if (Number(component.tlvHoras ?? 0) > 0) {
      statuses.push(restStatus(Number(component.tlvHoras) - tsn, alertH));
    }
    const tbo = Number(component.tboHoras ?? component.limiteHoras ?? 0);
    if (tbo > 0) {
      statuses.push(restStatus(tbo - usedTbo, alertH));
    }
  }

  if (cyclesOn && Number(component.limiteCiclos ?? 0) > 0) {
    statuses.push(restStatus(Number(component.limiteCiclos) - csn, alertC));
  }

  if (landingsOn && Number(component.limitePousos ?? 0) > 0) {
    statuses.push(restStatus(Number(component.limitePousos) - Number(component.pousos ?? 0), alertC));
  }

  if (calOn) {
    const cal = calendarStatus(component.dataValidade, Number(component.alertDias ?? 0), today);
    if (cal) statuses.push(cal);
  }

  if (!statuses.length) return evaluateLegacy(component, today);
  return worst(statuses);
}

export function isComponentOverdue(component: ComponentLimits, today = new Date()): boolean {
  return evaluateComponentStatus(component, today) === 'VENCIDO';
}
