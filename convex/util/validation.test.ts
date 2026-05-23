import { validateDescriptionIndex } from './validation';

describe('validateDescriptionIndex', () => {
  const POOL_8 = 8;

  it('returns null for valid index 0', () => {
    expect(validateDescriptionIndex(0, POOL_8)).toBeNull();
  });

  it('returns null for valid index in middle', () => {
    expect(validateDescriptionIndex(3, POOL_8)).toBeNull();
  });

  it('returns null for valid index at max (length - 1)', () => {
    expect(validateDescriptionIndex(7, POOL_8)).toBeNull();
  });

  it('returns error for negative index', () => {
    const err = validateDescriptionIndex(-1, POOL_8);
    expect(err).toContain('无效的角色索引');
    expect(err).toContain('-1');
    expect(err).toContain('8');
  });

  it('returns error for index equal to length', () => {
    const err = validateDescriptionIndex(8, POOL_8);
    expect(err).toContain('无效的角色索引');
    expect(err).toContain('8');
  });

  it('returns error for index greater than length', () => {
    const err = validateDescriptionIndex(100, POOL_8);
    expect(err).toContain('无效的角色索引');
    expect(err).toContain('100');
  });

  it('handles empty pool (size 0): any index is invalid', () => {
    expect(validateDescriptionIndex(0, 0)).not.toBeNull();
    expect(validateDescriptionIndex(-1, 0)).not.toBeNull();
    expect(validateDescriptionIndex(0, 0)).not.toBeNull();
  });

  it('handles single-element pool', () => {
    expect(validateDescriptionIndex(0, 1)).toBeNull();
    expect(validateDescriptionIndex(1, 1)).not.toBeNull();
    expect(validateDescriptionIndex(-1, 1)).not.toBeNull();
  });

  it('error message contains both index and pool size', () => {
    const err = validateDescriptionIndex(42, 10);
    expect(err).toContain('42');
    expect(err).toContain('10');
  });
});
