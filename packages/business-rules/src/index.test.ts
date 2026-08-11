import { describe, expect, it } from 'vitest';
import { evaluateFlightBlock } from './flight-blocking';
import { canAccessModule, canAccessTenant } from './permissions';
import { checkStorageLimit, checkModuleAccess } from './billing-gates';
import { buildStorageKey, isStorageKeyInTenant } from './storage-quota';

describe('permissions', () => {
  it('allows module when listed', () => {
    expect(canAccessModule({ modules: ['dashboard'], actions: ['read'] }, 'dashboard')).toBe(true);
  });

  it('denies tenant outside allowed list', () => {
    expect(canAccessTenant('t2', ['t1'], false)).toBe(false);
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
});

describe('storage-quota', () => {
  it('builds tenant-scoped key', () => {
    const key = buildStorageKey('emp1', 'uni1', 'documents', 'file.pdf');
    expect(key).toBe('tenants/emp1/unit_uni1/documents/file.pdf');
    expect(isStorageKeyInTenant(key, 'emp1')).toBe(true);
    expect(isStorageKeyInTenant(key, 'emp2')).toBe(false);
  });
});
