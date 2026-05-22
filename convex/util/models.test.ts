import { parseModelsEnv } from './models';

describe('parseModelsEnv', () => {
  it('returns defaults when env is undefined', () => {
    const result = parseModelsEnv(undefined);
    expect(result).toEqual([
      'qwen3.5-flash',
      'qwen-plus',
      'qwen-max',
      'qwen-turbo',
    ]);
  });

  it('returns defaults when env is empty string', () => {
    const result = parseModelsEnv('');
    expect(result).toEqual([
      'qwen3.5-flash',
      'qwen-plus',
      'qwen-max',
      'qwen-turbo',
    ]);
  });

  it('parses single model from env', () => {
    const result = parseModelsEnv('my-model');
    expect(result).toEqual(['my-model']);
  });

  it('parses comma-separated models', () => {
    const result = parseModelsEnv('gpt-4,claude-3,gemini-pro');
    expect(result).toEqual(['gpt-4', 'claude-3', 'gemini-pro']);
  });

  it('trims whitespace around model names', () => {
    const result = parseModelsEnv(' gpt-4 ,  claude-3  ,gemini-pro');
    expect(result).toEqual(['gpt-4', 'claude-3', 'gemini-pro']);
  });

  it('filters out empty entries from trailing comma', () => {
    const result = parseModelsEnv('gpt-4,');
    expect(result).toEqual(['gpt-4']);
  });

  it('filters out empty entries from leading comma', () => {
    const result = parseModelsEnv(',gpt-4');
    expect(result).toEqual(['gpt-4']);
  });

  it('filters out empty entries from double comma', () => {
    const result = parseModelsEnv('gpt-4,,claude-3');
    expect(result).toEqual(['gpt-4', 'claude-3']);
  });

  it('returns empty array for whitespace-only env', () => {
    const result = parseModelsEnv('  ');
    expect(result).toEqual([]);
  });

  it('handles complex real-world env string', () => {
    const result = parseModelsEnv(
      'qwen3.5-flash, qwen-plus, qwen-max, qwen-turbo'
    );
    expect(result).toEqual([
      'qwen3.5-flash',
      'qwen-plus',
      'qwen-max',
      'qwen-turbo',
    ]);
  });
});
