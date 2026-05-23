export type NPCStatus = 'idle' | 'walking' | 'conversation';

const MODEL_COLORS: Record<string, string> = {
  'qwen3.5-flash': '#6366f1',
  'qwen-plus': '#ec4899',
  'qwen-max': '#14b8a6',
  'qwen-turbo': '#f97316',
};
const FALLBACK_COLORS = ['#8b5cf6', '#06b6d4', '#e11d48', '#22c55e', '#eab308'];

export function getModelColor(model: string, index: number): string {
  return MODEL_COLORS[model] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

export function deriveNPCStatus(
  inConversation: boolean,
  isPathfinding: boolean,
): NPCStatus {
  if (inConversation) return 'conversation';
  if (isPathfinding) return 'walking';
  return 'idle';
}

export interface CharacterDesc {
  name: string;
  character: string;
  identity: string;
  plan: string;
}

export function getAvailableCharacters(
  descriptions: readonly CharacterDesc[],
  usedNames: ReadonlySet<string>,
): CharacterDesc[] {
  return descriptions.filter((d) => !usedNames.has(d.name));
}
