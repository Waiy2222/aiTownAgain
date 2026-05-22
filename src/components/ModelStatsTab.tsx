import { ServerGame } from '../hooks/serverGame';
import { GameId } from '../../convex/aiTown/ids';

/**
 * StatRow — 单行统计项
 */
function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-brown-700/50 last:border-b-0">
      <span className="text-brown-300 text-sm font-body">{label}</span>
      <span className="text-white text-sm font-body text-right max-w-[60%] break-all">{value}</span>
    </div>
  );
}

interface ModelStatsTabProps {
  worldId: string;
  agentId?: GameId<'agents'>;
  playerId: GameId<'players'>;
  game: ServerGame;
}

const PLACEHOLDER = '等待监控API…';

export default function ModelStatsTab({ worldId, agentId, playerId, game }: ModelStatsTabProps) {
  // 通过 playerId 在 agents 中查找对应的 agent
  const agent =
    agentId !== undefined
      ? game.world.agents.get(agentId)
      : [...game.world.agents.values()].find((a) => a.playerId === playerId);

  // 从 agentDescriptions 获取名称
  const description = agentId ? game.agentDescriptions.get(agentId) : undefined;

  if (!agent) {
    return (
      <div className="mt-4 p-4 text-center text-brown-300 text-sm font-body">
        该NPC暂无统计数据
      </div>
    );
  }

  return (
    <div className="mt-4">
      <h4 className="text-brown-200 text-sm font-bold font-display mb-3">🤖 模型统计</h4>
      <div className="bg-brown-900/50 rounded px-3 py-1">
        <StatRow label="模型名称" value={description?.identity?.split('。')[0] ?? '默认模型'} />
        <StatRow label="Token消耗" value={PLACEHOLDER} />
        <StatRow label="API调用次数" value={PLACEHOLDER} />
        <StatRow label="平均延迟" value={PLACEHOLDER} />
        <StatRow label="话题摘要" value={PLACEHOLDER} />
      </div>
      <p className="text-brown-500 text-[10px] mt-2 text-center font-body">
        详细统计数据需等待监控API就绪
      </p>
    </div>
  );
}
