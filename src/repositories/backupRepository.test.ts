import { describe, it, expect, vi } from 'vitest';
import { validateBackup, AppBackup } from './backupRepository';

describe('backup validation', () => {
  const makeValidBackup = (overrides: Partial<AppBackup> = {}): AppBackup => ({
    version: '1.0',
    exportedAt: '2024-01-01T00:00:00.000Z',
    users: [],
    suppliers: [],
    products: [],
    inventoryItems: [],
    inventoryLots: [],
    inventoryMovements: [],
    recipes: [],
    recipeIngredients: [],
    productionBatches: [],
    recipePreparations: [],
    documents: [],
    ...overrides,
  });

  it('accepts valid backup structure', () => {
    const validBackup = makeValidBackup();
    expect(validateBackup(validBackup)).toBe(true);
  });

  it('accepts valid backup with populated data', () => {
    const validBackup = makeValidBackup({
      users: [{ id: 'u1', username: 'test', passwordHash: 'hash123', role: 'admin' }],
    });
    expect(validateBackup(validBackup)).toBe(true);
  });

  it('rejects missing version', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { version, ...badBackup } = makeValidBackup();
    expect(validateBackup(badBackup as unknown)).toBe(false);
  });

  it('rejects wrong version', () => {
    const badBackup = makeValidBackup({ version: '2.0' } as unknown as AppBackup);
    expect(validateBackup(badBackup)).toBe(false);
  });

  it('rejects missing arrays', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { suppliers, products, inventoryItems, ...badBackup } = makeValidBackup();
    expect(validateBackup(badBackup as unknown)).toBe(false);
  });

  it('rejects null input', () => {
    expect(validateBackup(null)).toBe(false);
  });

  it('rejects non-object input', () => {
    expect(validateBackup('string')).toBe(false);
    expect(validateBackup(123 as unknown)).toBe(false);
  });

  it('rejects arrays instead of objects', () => {
    expect(validateBackup([])).toBe(false);
  });

  it('rejects non-array entity values', () => {
    const badBackup = makeValidBackup({ users: 'not-an-array' } as unknown as AppBackup);
    expect(validateBackup(badBackup)).toBe(false);
  });
});