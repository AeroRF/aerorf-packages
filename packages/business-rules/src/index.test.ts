import { describe, expect, it } from 'vitest';
import { evaluateFlightBlock, componentOverdueAlertsOnly } from './flight-blocking';
import { canAccessModule, canAccessTenant, canAccessUnit, canPerformAction } from './permissions';
import { checkStorageLimit, checkModuleAccess, checkUserLimit, checkAircraftLimit } from './billing-gates';
import { buildStorageKey, isStorageKeyInTenant } from './storage-quota';
import { parsePlanLimits, defaultPlanLimits } from './plan-limits';
import { isOpenWorkorderStatus, canTransitionWorkorderStatus } from './workorder-status';
import { isDocumentValid, isPilotLicenseValid } from './document-validity';
import { getDocumentExpiryStatus, isAircraftBlockingDocCategory } from './document-status';
import { toIsoDateOnly } from './iso-date';
import { isPilotBlockedForFlight, isComponentInTransit, isMovementWorkorderType } from './person-documents';
import { evaluateComponentStatus, isComponentOverdue } from './component-status';
import { applyOverhaulCounters, formatTsoDisplay, isForbiddenCellComponent } from './component-condition';
import { calcDeltaPartidaCorte, competenciaFromDate, isAgriculturalOperation, periodOpeningBalance } from './flight-log';
import { validateHourLogTotals } from './hour-log';
import { aircraftHoursAtDue, remainingHoursByControl } from './hour-control';
import { planMissingHourImpacts } from './hour-impact';
import {
  canInitiateAircraftTransfer,
  validateAircraftTransferTargets,
  canAcceptAircraftTransfer,
  canTransferBeAccepted,
  validateNoPendingTransfer,
  isAircraftTransferLocked,
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

  it('restricts unit when allow-list is set', () => {
    expect(canAccessUnit('u2', ['u1'], false)).toBe(false);
    expect(canAccessUnit('u1', ['u1'], false)).toBe(true);
    expect(canAccessUnit('u1', [], false)).toBe(true);
  });

  it('empty unit list means company-wide access', () => {
    expect(canAccessUnit('filial-a', [], false)).toBe(true);
    expect(canAccessUnit('filial-b', [], false)).toBe(true);
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
    expect(isOpenWorkorderStatus('FINALIZADA')).toBe(false);
  });

  it('validates transitions', () => {
    expect(canTransitionWorkorderStatus('ABERTA', 'EM EXECUÇÃO').allowed).toBe(true);
    expect(canTransitionWorkorderStatus('FINALIZADA', 'CANCELADA').allowed).toBe(false);
    expect(canTransitionWorkorderStatus('FINALIZADA', 'ESTORNADA').allowed).toBe(true);
    expect(canTransitionWorkorderStatus('ABERTA', 'ESTORNADA').allowed).toBe(false);
  });
});

describe('document-validity', () => {
  it('treats missing date as valid', () => {
    expect(isDocumentValid(null)).toBe(true);
  });

  it('detects expired pilot license', () => {
    expect(isPilotLicenseValid('2000-01-01', new Date('2026-01-01'))).toBe(false);
  });

  it('keeps a 2029 license valid when pg DATE arrives as Date', () => {
    const today = new Date('2026-09-23T12:00:00');
    const pgDate = new Date('2029-10-22T00:00:00.000Z');
    expect(toIsoDateOnly(pgDate)).toBe('2029-10-22');
    expect(isPilotLicenseValid(pgDate, today)).toBe(true);
    expect(isPilotBlockedForFlight(pgDate, [], today)).toBe(false);
  });

  it('does not treat Date.toString().slice(0, 10) as year 2001', () => {
    const today = new Date('2026-09-23T12:00:00');
    const sliced = String(new Date('2029-10-22T00:00:00.000Z')).slice(0, 10);
    expect(toIsoDateOnly(sliced)).toBeNull();
    expect(isDocumentValid(sliced, today)).toBe(true);
    expect(isPilotBlockedForFlight(sliced, [], today)).toBe(false);
  });
});

describe('document-status', () => {
  it('classifies expiry states', () => {
    expect(getDocumentExpiryStatus('2099-01-01', 30, new Date('2026-01-01'))).toBe('VALIDO');
    expect(getDocumentExpiryStatus('2000-01-01', 30, new Date('2026-01-01'))).toBe('VENCIDO');
    expect(getDocumentExpiryStatus(new Date('2029-10-22T00:00:00.000Z'), 30, new Date('2026-09-23'))).toBe(
      'VALIDO',
    );
  });

  it('flags blocking categories', () => {
    expect(isAircraftBlockingDocCategory('Célula')).toBe(true);
    expect(isAircraftBlockingDocCategory('CVA (Célula)')).toBe(true);
    expect(isAircraftBlockingDocCategory('CA (Aeronavegabilidade)')).toBe(false);
    expect(isAircraftBlockingDocCategory('Outros')).toBe(false);
  });
});

describe('person-documents', () => {
  it('blocks pilot with expired license', () => {
    expect(isPilotBlockedForFlight('2000-01-01', [], new Date('2026-01-01'))).toBe(true);
  });

  it('blocks pilot with expired document', () => {
    expect(
      isPilotBlockedForFlight('2099-01-01', [{ validade: '2000-01-01', alertaDias: 30 }], new Date('2026-01-01')),
    ).toBe(true);
  });

  it('detects component in transit', () => {
    expect(isComponentInTransit('EM_TRANSITO')).toBe(true);
    expect(isComponentInTransit('INSTALADO')).toBe(false);
  });

  it('detects movement workorder types', () => {
    expect(isMovementWorkorderType('RETIRADA')).toBe(true);
    expect(isMovementWorkorderType('instalacao')).toBe(true);
    expect(isMovementWorkorderType('PREVENTIVA')).toBe(false);
  });
});

describe('component-status', () => {
  it('marks overdue hours component', () => {
    const status = evaluateComponentStatus({ controlePor: 'HORAS', limiteHoras: 100, usadosHoras: 110 });
    expect(status).toBe('VENCIDO');
    expect(isComponentOverdue({ controlePor: 'HORAS', limiteHoras: 100, usadosHoras: 110 })).toBe(true);
  });
});

describe('hour-control', () => {
  it('motor TBO/TSO: saldo cai e HS/T permanece após o voo', () => {
    const antes = remainingHoursByControl({ tboHoras: 3000, tso: 1092.1, tsn: 4017.5 });
    expect(antes).toBeCloseTo(1907.9, 1);
    expect(aircraftHoursAtDue(4017.5, antes)).toBeCloseTo(5925.4, 1);

    const depois = remainingHoursByControl({ tboHoras: 3000, tso: 1122.1, tsn: 4047.5 });
    expect(depois).toBeCloseTo(1877.9, 1);
    expect(aircraftHoursAtDue(4047.5, depois)).toBeCloseTo(5925.4, 1);
  });

  it('linha só com TLV usa TSN, sem TBO', () => {
    const saldo = remainingHoursByControl({ tlvHoras: 2000, tsn: 836.1 });
    expect(saldo).toBeCloseTo(1163.9, 1);
    expect(aircraftHoursAtDue(4017.5, saldo)).toBeCloseTo(5181.4, 1);
  });

  it('mapa PT-WQD: voo de 30 h atualiza TSO/TSN e o HS/T não anda', () => {
    const aircraftAfter = 4047.5;
    const log = { id: 'voo-30', horasDelta: 30, appliedTo: ['motor', 'hsi', 'helice'] };
    const rows = [
      { id: 'motor', tipo: 'MOTOR', tsn: 4017.5, tboHoras: 3000, tso: 1092.1, due: 5925.4 },
      { id: 'hsi', tipo: 'MOTOR', tsn: 4017.5, tboHoras: 1500, tso: 344.1, due: 5173.4 },
      { id: 'helice', tipo: 'HELICE', tsn: 4017.5, tboHoras: 3000, tso: 1.6, due: 7015.9 },
    ];

    const plan = planMissingHourImpacts({
      aircraftHours: aircraftAfter,
      logs: [log],
      components: rows.map(({ id, tipo, tsn }) => ({ id, tipo, tsn })),
    });
    expect(plan).toHaveLength(3);
    expect(plan.every((p) => p.horas === 30)).toBe(true);

    for (const row of rows) {
      const tso = row.tso + 30;
      const tsn = row.tsn + 30;
      const saldo = remainingHoursByControl({ tboHoras: row.tboHoras, tso, tsn });
      expect(saldo).toBeCloseTo(row.tboHoras - tso, 1);
      expect(aircraftHoursAtDue(aircraftAfter, saldo)).toBeCloseTo(row.due, 1);
    }
  });

  it('não reaplica se o TSN já acompanhou a aeronave', () => {
    const plan = planMissingHourImpacts({
      aircraftHours: 4047.5,
      logs: [{ id: 'voo-30', horasDelta: 30, appliedTo: ['motor'] }],
      components: [{ id: 'motor', tipo: 'MOTOR', tsn: 4047.5 }],
    });
    expect(plan).toHaveLength(0);
  });

  it('inspeção e documento com horas entram no voo; só calendário não', () => {
    const plan = planMissingHourImpacts({
      aircraftHours: 4047.5,
      logs: [{ id: 'voo-30', horasDelta: 30, appliedTo: ['hsi', 'doc-horas'] }],
      components: [
        { id: 'hsi', tipo: 'INSPECAO', tsn: 4017.5, tboHoras: 1500, tso: 344.1 },
        { id: 'doc-horas', tipo: 'DOCUMENTO', tsn: 4017.5, tlvHoras: 2000 },
        { id: 'doc-cal', tipo: 'DOCUMENTO', horas: false },
      ],
    });
    expect(plan.map((p) => p.componentId).sort()).toEqual(['doc-horas', 'hsi']);
    const hsiSaldo = remainingHoursByControl({ tboHoras: 1500, tso: 374.1, tsn: 4047.5 });
    expect(hsiSaldo).toBeCloseTo(1125.9, 1);
    expect(aircraftHoursAtDue(4047.5, hsiSaldo)).toBeCloseTo(5173.4, 1);
  });
});

describe('hour-log', () => {
  it('rejects regressive totals', () => {
    const r = validateHourLogTotals(500, 400);
    expect(r.valid).toBe(false);
  });
});

describe('component-condition', () => {
  it('shows NOVO on TSO for new pieces even after hours', () => {
    expect(formatTsoDisplay({ condicao: 'NOVO', tso: 0, tsoNovo: true })).toBe('NOVO');
    expect(formatTsoDisplay({ condicao: 'USADO', tso: 300 })).toBe('300');
  });

  it('keeps TSN and resets TSO on overhaul', () => {
    const next = applyOverhaulCounters({ tsn: 2000, csn: 400 });
    expect(next.tsn).toBe(2000);
    expect(next.tso).toBe(0);
    expect(next.cso).toBe(0);
    expect(next.condicao).toBe('REVISADA');
  });

  it('rejects cell as component', () => {
    expect(isForbiddenCellComponent('CELULA', 'Célula')).toBe(true);
    expect(isForbiddenCellComponent('MOTOR', 'Motor')).toBe(false);
  });
});

describe('flight-log', () => {
  it('computes partida to corte across midnight', () => {
    expect(calcDeltaPartidaCorte('22:00', '00:30')).toBe(2.5);
  });

  it('treats agricola as agricultural profile', () => {
    expect(isAgriculturalOperation('AGRICOLA')).toBe(true);
    expect(isAgriculturalOperation('PARTICULAR')).toBe(false);
  });

  it('normalizes competencia to first day of month', () => {
    expect(competenciaFromDate('2026-09-10')).toBe('2026-09-01');
  });

  it('opens the month from previous closing without duplicating hours', () => {
    expect(periodOpeningBalance(1000, 1020, 20)).toBe(1000);
    expect(periodOpeningBalance(null, 1020, 20)).toBe(1000);
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

describe('transfer-access', () => {
  it('validates distinct origin and destination', () => {
    expect(validateAircraftTransferTargets('a', 'b').valid).toBe(true);
    expect(validateAircraftTransferTargets('a', 'a').valid).toBe(false);
  });

  it('blocks pending duplicate transfer', () => {
    expect(validateNoPendingTransfer(true).valid).toBe(false);
    expect(validateNoPendingTransfer(false).valid).toBe(true);
  });

  it('allows accept only for destination empresa', () => {
    expect(canAcceptAircraftTransfer(false, 'dest', 'dest', [])).toBe(true);
    expect(canAcceptAircraftTransfer(false, 'other', 'dest', [])).toBe(false);
    expect(canAcceptAircraftTransfer(true, 'other', 'dest', [])).toBe(true);
  });

  it('detects locked aircraft during transfer', () => {
    expect(isAircraftTransferLocked('pendente_aceite')).toBe(true);
    expect(isAircraftTransferLocked('concluida_externa')).toBe(true);
    expect(isAircraftTransferLocked(null)).toBe(false);
  });

  it('acceptance only when pending', () => {
    expect(canTransferBeAccepted('pendente_aceite')).toBe(true);
    expect(canTransferBeAccepted('concluida')).toBe(false);
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
