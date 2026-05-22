import { Doc } from '../_generated/dataModel';
import * as memory from './memory';

/** 角色基础信息 Prompt */
export function buildIdentityPrompt(
  player: { name: string },
  agent: { identity: string; plan: string } | null,
): string[] {
  const lines: string[] = [];
  if (agent) {
    lines.push(`关于你（${player.name}）：${agent.identity}`);
    lines.push(`你的日常目标：${agent.plan}`);
  }
  return lines;
}

/** 对方角色信息 Prompt */
export function buildOtherAgentPrompt(
  otherPlayer: { name: string },
  otherAgent: { identity: string; plan: string } | null,
): string[] {
  const lines: string[] = [];
  if (otherAgent) {
    lines.push(`关于${otherPlayer.name}：${otherAgent.identity}`);
  }
  return lines;
}

/** 场景上下文 Prompt */
export function buildScenePrompt(
  _locationName?: string,
): string[] {
  // 未来可扩展：根据角色所在位置注入不同的场景描述
  return [];
}

/** 行为规则 Prompt */
export function buildBehaviorPrompt(
  _type: 'start' | 'continue' | 'leave',
): string[] {
  const rules: Record<string, string[]> = {
    start: [
      '请用自然、友好的方式开始对话。不要重复问候。',
      '结合你的角色设定和对方的身份来引入话题。',
      '你的回答应简洁，字数控制在200个字符以内。',
    ],
    continue: [
      '继续与对方对话。不要再次打招呼，不要频繁使用"嘿"、"你好"之类的词。',
      '自然回应对方的话题，可以提出新的问题或分享你的想法。',
      '你的回答应简洁，字数控制在200个字符以内。',
    ],
    leave: [
      '你决定礼貌地结束对话。请简短地告别。',
      '你的回答应简洁，字数控制在100个字符以内。',
    ],
  };
  return rules[_type] ?? [];
}

/** 对话开始 Prompt */
export function buildStartConversationPrompt(params: {
  player: { name: string };
  otherPlayer: { name: string };
  agent: { identity: string; plan: string } | null;
  otherAgent: { identity: string; plan: string } | null;
  lastConversation: Doc<'archivedConversations'> | null;
  memories: memory.Memory[];
}): string {
  const { player, otherPlayer, agent, otherAgent, lastConversation, memories } = params;
  const lines: string[] = [];

  // 基础层
  lines.push(`你是${player.name}，你刚开始与${otherPlayer.name}进行对话。`);
  lines.push(...buildIdentityPrompt(player, agent));
  lines.push(...buildOtherAgentPrompt(otherPlayer, otherAgent));

  // 场景层
  lines.push(...buildScenePrompt());

  // 历史对话
  if (lastConversation) {
    lines.push(
      `你上次与${otherPlayer.name}聊天是在${new Date(lastConversation.created).toLocaleString()}。`,
    );
  }

  // 相关记忆
  if (memories.length > 0) {
    lines.push('以下是一些按相关性排序的记忆：');
    for (const m of memories) {
      lines.push(' - ' + m.description);
    }
    const memoryWithOther = memories.find(
      (m) =>
        m.data.type === 'conversation' &&
        'playerIds' in m.data &&
        (m.data as { playerIds: string[] }).playerIds.includes(otherPlayer.name),
    );
    if (memoryWithOther) {
      lines.push('请务必在你的问候语中包含与之前对话相关的内容。');
    }
  }

  // 行为层
  lines.push(...buildBehaviorPrompt('start'));

  return lines.join('\n');
}

/** 对话继续 Prompt */
export function buildContinueConversationPrompt(params: {
  player: { name: string };
  otherPlayer: { name: string };
  agent: { identity: string; plan: string } | null;
  otherAgent: { identity: string; plan: string } | null;
  conversation: { created: number };
  memories: { description: string }[];
}): string {
  const { player, otherPlayer, agent, otherAgent, conversation, memories } = params;
  const lines: string[] = [];

  // 基础层
  lines.push(`你是${player.name}，你目前正在与${otherPlayer.name}对话。`);
  lines.push(`对话开始于${new Date(conversation.created).toLocaleString()}。`);
  lines.push(...buildIdentityPrompt(player, agent));
  lines.push(...buildOtherAgentPrompt(otherPlayer, otherAgent));

  // 场景层
  lines.push(...buildScenePrompt());

  // 相关记忆
  if (memories.length > 0) {
    lines.push('相关记忆：');
    for (const m of memories) {
      lines.push(' - ' + m.description);
    }
  }

  // 行为层
  lines.push(`以下是你与${otherPlayer.name}之间的当前聊天记录。`);
  lines.push(...buildBehaviorPrompt('continue'));

  return lines.join('\n');
}

/** 对话离开 Prompt */
export function buildLeaveConversationPrompt(params: {
  player: { name: string };
  otherPlayer: { name: string };
  agent: { identity: string; plan: string } | null;
  otherAgent: { identity: string; plan: string } | null;
  conversation: { created: number };
}): string {
  const { player, otherPlayer, agent, otherAgent } = params;
  const lines: string[] = [];

  // 基础层
  lines.push(`你是${player.name}，你目前正在与${otherPlayer.name}对话。`);
  lines.push('你决定结束这次对话。');
  lines.push(...buildIdentityPrompt(player, agent));
  lines.push(...buildOtherAgentPrompt(otherPlayer, otherAgent));

  // 场景层
  lines.push(...buildScenePrompt());

  // 行为层
  lines.push(`以下是你与${otherPlayer.name}之间的当前聊天记录。`);
  lines.push(...buildBehaviorPrompt('leave'));

  return lines.join('\n');
}
