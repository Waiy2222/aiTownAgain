const DEFAULT_MODELS = ['qwen3.5-flash', 'qwen-plus', 'qwen-max', 'qwen-turbo'];

export function parseModelsEnv(raw: string | undefined): string[] {
  if (!raw) {
    return DEFAULT_MODELS;
  }
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}
