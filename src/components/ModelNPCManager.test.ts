import { getModelColor, deriveNPCStatus, getAvailableCharacters } from '../utils/modelColors';
import { Descriptions } from '../../data/characters';

describe('getModelColor', () => {
  it('returns fixed color for known models', () => {
    expect(getModelColor('qwen3.5-flash', 0)).toBe('#6366f1');
    expect(getModelColor('qwen-plus', 1)).toBe('#ec4899');
    expect(getModelColor('qwen-max', 2)).toBe('#14b8a6');
    expect(getModelColor('qwen-turbo', 3)).toBe('#f97316');
  });

  it('same model returns same color regardless of index', () => {
    expect(getModelColor('qwen-max', 0)).toBe('#14b8a6');
    expect(getModelColor('qwen-max', 5)).toBe('#14b8a6');
    expect(getModelColor('qwen-max', 99)).toBe('#14b8a6');
  });

  it('unknown models use fallback colors cyclically', () => {
    const fallback0 = getModelColor('unknown-model-a', 0);
    const fallback1 = getModelColor('unknown-model-b', 1);
    expect(fallback0).toBe('#8b5cf6');
    expect(fallback1).toBe('#06b6d4');
  });

  it('fallback colors wrap around correctly', () => {
    const c5 = getModelColor('model-x', 5);
    const c10 = getModelColor('model-y', 10);
    expect(c5).toBe(c10); // both index % 5 === 0, same fallback
  });

  it('returns valid hex color format', () => {
    for (let i = 0; i < 20; i++) {
      const color = getModelColor(`model-${i}`, i);
      expect(color).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

describe('deriveNPCStatus', () => {
  it('returns conversation when inConversation is true', () => {
    expect(deriveNPCStatus(true, false)).toBe('conversation');
    expect(deriveNPCStatus(true, true)).toBe('conversation');
  });

  it('returns walking when not in conversation but pathfinding', () => {
    expect(deriveNPCStatus(false, true)).toBe('walking');
  });

  it('returns idle when neither in conversation nor pathfinding', () => {
    expect(deriveNPCStatus(false, false)).toBe('idle');
  });

  it('conversation takes priority over walking', () => {
    expect(deriveNPCStatus(true, true)).toBe('conversation');
  });
});

describe('getAvailableCharacters', () => {
  it('filters out used names', () => {
    const usedNames = new Set(['Alex', 'Lucky', 'Bob']);
    const available = getAvailableCharacters(Descriptions, usedNames);
    expect(available).toHaveLength(5);
    expect(available.find((d) => d.name === 'Alex')).toBeUndefined();
    expect(available.find((d) => d.name === 'Stella')).toBeDefined();
  });

  it('returns empty when all names are used', () => {
    const usedNames = new Set(Descriptions.map((d) => d.name));
    const available = getAvailableCharacters(Descriptions, usedNames);
    expect(available).toHaveLength(0);
  });

  it('returns all when no names are used', () => {
    const available = getAvailableCharacters(Descriptions, new Set());
    expect(available).toHaveLength(8);
  });

  it('handles ReadonlySet without mutation', () => {
    const usedNames = new Set(['Alex', 'Lucky']);
    const sizeBefore = usedNames.size;
    getAvailableCharacters(Descriptions, usedNames as ReadonlySet<string>);
    expect(usedNames.size).toBe(sizeBefore);
  });

  it('each result is not in usedNames', () => {
    const usedNames = new Set(['Alex', 'Lucky', 'Bob', 'Stella', 'Kurt']);
    const available = getAvailableCharacters(Descriptions, usedNames);
    for (const desc of available) {
      expect(usedNames.has(desc.name)).toBe(false);
    }
  });
});

describe('character pool', () => {
  const allNames = Descriptions.map((d) => d.name);

  it('has exactly 8 characters', () => {
    expect(Descriptions).toHaveLength(8);
  });

  it('all characters have unique names', () => {
    const unique = new Set(allNames);
    expect(unique.size).toBe(8);
  });

  it('all characters have required fields', () => {
    for (const desc of Descriptions) {
      expect(desc.name).toBeTruthy();
      expect(desc.character).toBeTruthy();
      expect(desc.identity).toBeTruthy();
      expect(desc.plan).toBeTruthy();
    }
  });

  it('indexOf returns correct position for each character', () => {
    for (let i = 0; i < Descriptions.length; i++) {
      expect(Descriptions.indexOf(Descriptions[i])).toBe(i);
    }
  });
});

describe('character availability — integration with Descriptions', () => {
  it('random pick always returns a valid character', () => {
    const usedNames = new Set(['Alex', 'Lucky', 'Bob', 'Stella', 'Kurt']);
    const available = getAvailableCharacters(Descriptions, usedNames);
    for (let i = 0; i < 100; i++) {
      const pick = available[Math.floor(Math.random() * available.length)];
      expect(available).toContain(pick);
      expect(usedNames.has(pick.name)).toBe(false);
    }
  });

  it('handleGenerate logic: when exhausted, available is empty', () => {
    const usedNames = new Set(Descriptions.map((d) => d.name));
    const available = getAvailableCharacters(Descriptions, usedNames);
    expect(available).toHaveLength(0);
  });
});
