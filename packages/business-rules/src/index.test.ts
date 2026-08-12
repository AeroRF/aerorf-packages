import { describe, expect, it } from 'vitest';
import { evaluateFlightBlock, componentOverdueAlertsOnly } from './flight-blocking';
import { canAccessModule, canAccessTenant, canPerformAction } from './permissions';
import { checkStorageLimit, checkModuleAccess, checkUserLimit, checkAircraftLimit } from './billing-gates';
import { buildStorageKey, isStorageKeyInTenant } from './storage-quota';
import { parsePlanLimits, defaultPlanLimits } from './plan-limits';
import { isOpenWorkorderStatus } from './workorder-status';
import { isDocumentValid, isPilotLicenseValid } from './document-validity';
import { getDocumentExpiryStatus, isAircraftBlockingDocCategory } from './document-status';
import { evaluateComponentStatus, isComponentOverdue } from './component-status';
import { validateHourLogTotals } from './hour-log';
import {
  canInitiateAircraftTransfer,
  validateAircraftTransferTargets,
} from './transfer-access';
import { validateEmpresaInput, canDeleteEmpresa, generateExternalId } from './empresa';
import { validateUnidadeInput, canDeleteUnidade, generateUnitExternalId } from './unidade';

describe('permissions', () => {
  it('allows module when listed', () => {
    expect(canAccessModule({ modules: ['dashboard'], actions: ['read'] }, 'dashboard')).toBe(true);
  });

  it('denies tenant outside allowed list', () => {
    expect(canAccessTenant('t2', ['t1'], false)).toBe(false);
  });

  it('allows actions when listed', () => {
    expect(canPerformAction({ modules: ['dashboard'], actions: ['create'] }, 'create')).toBe(true);
    expect(canPerformAction({ modules: ['dashboard'], actions: ['read'] }, 'delete')).toBe(false);
  });
});

describe('flight-blocking', () => {
  it('blocks when CVA invalid', () => {
    const r = evaluateFlightBlock({
      cvaValid: false,
      caApplicable: false,
      caValid: true,
      hasOpenWorkorder: false,
      pilotDocExpired: false,
    });
    expect(r.blocked).toBe(true);
    expect(r.reasons).toContain('CVA_INVALID');
  });

  it('does not block when all clear', () => {
    const r = evaluateFlightBlock({
      cvaValid: true,
      caApplicable: false,
      caValid: true,
      hasOpenWorkorder: false,
      pilotDocExpired: false,
    });
    expect(r.blocked).toBe(false);
  });

  it('component overdue is alert-only flag', () => {
    expect(componentOverdueAlertsOnly()).toBe(true);
  });
});

describe('billing-gates', () => {
  it('blocks storage at limit', () => {
    const r = checkStorageLimit(
      { users: 1, aircraft: 1, storageBytes: 1000 },
      { maxUsers: 10, maxAircraft: 10, maxStorageBytes: 1000, modules: ['dashboard'] },
    );
    expect(r.allowed).toBe(false);
  });

  it('denies uncontracted module', () => {
    const r = checkModuleAccess('telemetria', { maxUsers: 1, maxAircraft: 1, maxStorageBytes: 1, modules: ['dashboard'] });
    expect(r.allowed).toBe(false);
  });

  it('blocks user limit', () => {
    const limits = defaultPlanLimits();
    const r = checkUserLimit({ users: limits.maxUsers, aircraft: 0, storageBytes: 0 }, limits);
    expect(r.allowed).toBe(false);
  });

  it('blocks aircraft limit', () => {
    const limits = defaultPlanLimits();
    const r = checkAircraftLimit({ users: 0, aircraft: limits.maxAircraft, storageBytes: 0 }, limits);
    expect(r.allowed).toBe(false);
  });
});

describe('storage-quota', () => {
  it('builds tenant-scoped key', () => {
    const key = buildStorageKey('emp1', 'uni1', 'documents', 'file.pdf');
    expect(key).toBe('tenants/emp1/unit_uni1/documents/file.pdf');
    expect(isStorageKeyInTenant(key, 'emp1')).toBe(true);
    expect(isStorageKeyInTenant(key, 'emp2')).toBe(false);
  });
});

describe('plan-limits', () => {
  it('parses plano JSON', () => {
    const limits = parsePlanLimits({ maxUsers: 5, modulos: ['dashboard', 'aviacao'] });
    expect(limits.maxUsers).toBe(5);
    expect(limits.modules).toEqual(['dashboard', 'aviacao']);
  });
});

describe('workorder-status', () => {
  it('detects open statuses', () => {
    expect(isOpenWorkorderStatus('ABERTA')).toBe(true);
    expect(isOpenWorkorderStatus('EM EXECUÇÃO')).toBe(true);
    expect(isOpenWorkorderStatus('CONCLUIDA')).toBe(false);
  });
});

describe('document-validity', () => {
  it('treats missing date as valid', () => {
    expect(isDocumentValid(null)).toBe(true);
  });

  it('detects expired pilot license', () => {
    expect(isPilotLicenseValid('2000-01-01', new Date('2026-01-01'))).toBe(false);
  });
});

describe('document-status', () => {
  it('classifies expiry states', () => {
    expect(getDocumentExpiryStatus('2099-01-01', 30, new Date('2026-01-01'))).toBe('VALIDO');
    expect(getDocumentExpiryStatus('2000-01-01', 30, new Date('2026-01-01'))).toBe('VENCIDO');
  });

  it('flags blocking categories', () => {
    expect(isAircraftBlockingDocCategory('Célula')).toBe(true);
    expect(isAircraftBlockingDocCategory('Outros')).toBe(false);
  });
});

describe('component-status', () => {
  it('marks overdue hours component', () => {
    const status = evaluateComponentStatus({ controlePor: 'HORAS', limiteHoras: 100, usadosHoras: 110 });
    expect(status).toBe('VENCIDO');
    expect(isComponentOverdue({ controlePor: 'HORAS', limiteHoras: 100, usadosHoras: 110 })).toBe(true);
  });
});

describe('hour-log', () => {
  it('rejects regressive totals', () => {
    const r = validateHourLogTotals(500, 400);
    expect(r.valid).toBe(false);
  });
});

describe('transfer-access', () => {
  it('denies transfer without tenant access', () => {
    expect(canInitiateAircraftTransfer(false, 'e1', 'e2', ['e1'])).toBe(false);
  });

  it('rejects same origin and destination', () => {
    const r = validateAircraftTransferTargets('e1', 'e1');
    expect(r.valid).toBe(false);
  });
});

describe('empresa', () => {
  it('validates required fields', () => {
    const r = validateEmpresaInput({ nome: '', nomeFantasia: '' });
    expect(r.valid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it('blocks delete when units exist', () => {
    expect(canDeleteEmpresa(2).allowed).toBe(false);
    expect(canDeleteEmpresa(0).allowed).toBe(true);
  });

  it('generates external id by segment', () => {
    const id = generateExternalId('Aviação agrícola', ['RF-AGR-0003']);
    expect(id).toBe('RF-AGR-0004');
  });
});

describe('unidade', () => {
  it('validates required fields', () => {
    const r = validateUnidadeInput({ nome: '', empresaId: '' });
    expect(r.valid).toBe(false);
  });

  it('generates unit external id', () => {
    expect(generateUnitExternalId('RF-AGR-0001', ['RF-AGR-0001-UNI002'])).toBe('RF-AGR-0001-UNI003');
  });

  it('blocks delete with dependencies', () => {
    expect(canDeleteUnidade({ usersCount: 1, aircraftCount: 0 }).allowed).toBe(false);
    expect(canDeleteUnidade({ usersCount: 0, aircraftCount: 0 }).allowed).toBe(true);
  });
});
