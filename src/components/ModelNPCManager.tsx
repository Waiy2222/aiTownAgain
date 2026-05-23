import { useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { toast } from 'react-toastify';
import { Id } from '../../convex/_generated/dataModel';
import { api } from '../../convex/_generated/api';
import { useServerGame } from '../hooks/serverGame';
import { useSendInput } from '../hooks/sendInput';
import { toastOnError } from '../toasts';
import { Descriptions } from '../../data/characters';
import { getModelColor, deriveNPCStatus, getAvailableCharacters } from '../utils/modelColors';
import type { NPCStatus } from '../utils/modelColors';

export { getModelColor, deriveNPCStatus, getAvailableCharacters };

interface NPCItem {
  agentId: string;
  playerId: string;
  name: string;
  status: NPCStatus;
}

const STATUS_MAP: Record<NPCStatus, { label: string; color: string }> = {
  idle: { label: '空闲', color: 'bg-green-700' },
  walking: { label: '行走中', color: 'bg-yellow-600' },
  conversation: { label: '对话中', color: 'bg-blue-600' },
};

export default function ModelNPCManager({
  worldId,
  engineId,
}: {
  worldId: Id<'worlds'>;
  engineId: Id<'engines'>;
}) {
  const game = useServerGame(worldId);
  const models = useQuery(api.query.models.listAvailableModels, {});
  const createAgent = useSendInput(engineId, 'createAgent');
  const removeAgent = useSendInput(engineId, 'removeAgent');

  const [collapsedModels, setCollapsedModels] = useState<Set<string>>(new Set());

  const npcsByModel = useMemo(() => {
    if (!game) return {};
    const result: Record<string, NPCItem[]> = {};
    for (const agent of game.world.agents.values()) {
      const model = agent.modelName ?? 'qwen3.5-flash';
      if (!result[model]) result[model] = [];
      const player = game.world.players.get(agent.playerId);
      const inConv = [...game.world.conversations.values()].some((c) =>
        c.participants.has(agent.playerId),
      );
      const desc = game.playerDescriptions.get(agent.playerId);
      result[model].push({
        agentId: agent.id,
        playerId: agent.playerId,
        name: desc?.name ?? '未知',
        status: deriveNPCStatus(inConv, !!player?.pathfinding),
      });
    }
    return result;
  }, [game]);

  const usedNames = useMemo(
    () => new Set(Object.values(npcsByModel).flat().map((n) => n.name)),
    [npcsByModel],
  );

  const totalNPCs = useMemo(
    () => Object.values(npcsByModel).reduce((sum, npcs) => sum + npcs.length, 0),
    [npcsByModel],
  );

  const handleGenerate = async (model: string) => {
    const available = getAvailableCharacters(Descriptions, usedNames);
    if (available.length === 0) {
      toast.warn('所有角色已在小镇中');
      return;
    }
    const desc = available[Math.floor(Math.random() * available.length)];
    await toastOnError(createAgent({ descriptionIndex: Descriptions.indexOf(desc), model }));
    toast(`「${desc.name}」已加入小镇（${model}）`);
  };

  const handleRemove = async (agentId: string, name: string) => {
    if (!window.confirm(`确定移除「${name}」？`)) return;
    await toastOnError(removeAgent({ agentId }));
    toast(`「${name}」已离开小镇`);
  };

  const handleClearAll = async () => {
    if (!window.confirm(`确定清空所有 ${totalNPCs} 个 NPC？此操作不可撤销。`)) return;
    const allNPCs = Object.values(npcsByModel).flat();
    let removed = 0;
    for (const npc of allNPCs) {
      try {
        await toastOnError(removeAgent({ agentId: npc.agentId }));
        removed++;
      } catch {
        // toastOnError already showed error toast; continue removing remaining NPCs
      }
    }
    if (removed === allNPCs.length) {
      toast.success('已清空所有 NPC');
    } else if (removed > 0) {
      toast.warn(`已移除 ${removed}/${allNPCs.length} 个 NPC`);
    }
  };

  const toggleCollapse = (model: string) => {
    setCollapsedModels((prev) => {
      const next = new Set(prev);
      if (next.has(model)) {
        next.delete(model);
      } else {
        next.add(model);
      }
      return next;
    });
  };

  // --- loading ---
  if (!game || !models) {
    return (
      <div className="flex flex-col gap-2 p-3 bg-brown-900 rounded">
        <h3 className="text-lg text-brown-200">NPC 管理</h3>
        <div className="text-sm text-brown-400 animate-pulse">加载中...</div>
      </div>
    );
  }

  // --- empty ---
  if (totalNPCs === 0) {
    return (
      <div className="flex flex-col gap-2 p-3 bg-brown-900 rounded">
        <h3 className="text-lg text-brown-200">NPC 管理</h3>
        <p className="text-sm text-brown-400">选择模型，点击「生成 NPC」开始观战</p>
        {models.map((model, i) => (
          <button
            key={model}
            onClick={() => handleGenerate(model)}
            disabled={usedNames.size >= 8}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded hover:opacity-80 disabled:opacity-40 text-white transition-colors cursor-pointer"
            style={{ backgroundColor: getModelColor(model, i) }}
          >
            + 生成 NPC（{model}）
          </button>
        ))}
        {usedNames.size >= 8 && (
          <p className="text-xs text-brown-500">所有角色已在小镇中</p>
        )}
      </div>
    );
  }

  // --- ready ---
  return (
    <div className="flex flex-col gap-2 p-3 bg-brown-900 rounded">
      <div className="flex items-center justify-between">
        <h3 className="text-lg text-brown-200">NPC 管理</h3>
        <span className="text-xs text-brown-400 bg-brown-800 px-2 py-0.5 rounded-full">
          {totalNPCs}
        </span>
      </div>

      {models.map((model, i) => {
        const npcs = npcsByModel[model] ?? [];
        const collapsed = collapsedModels.has(model);
        const isPoolExhausted = usedNames.size >= 8;

        return (
          <div key={model} className="border border-brown-800 rounded overflow-hidden">
            {/* 模型标题栏 */}
            <button
              onClick={() => toggleCollapse(model)}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-brown-800 transition-colors cursor-pointer"
            >
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: getModelColor(model, i) }}
              />
              <span className="text-brown-100 font-medium">{model}</span>
              <span className="text-xs text-brown-400 ml-auto">{npcs.length}</span>
              <span className="text-brown-500 text-xs">{collapsed ? '▶' : '▼'}</span>
            </button>

            {!collapsed && (
              <div className="px-3 pb-2 flex flex-col gap-1">
                {/* 生成按钮 */}
                <button
                  onClick={() => handleGenerate(model)}
                  disabled={isPoolExhausted}
                  className="text-xs px-2 py-1 rounded text-white hover:opacity-80 disabled:opacity-40 transition-colors cursor-pointer w-fit"
                  style={{ backgroundColor: getModelColor(model, i) }}
                >
                  + 生成 NPC
                </button>

                {/* NPC 列表 */}
                {npcs.length === 0 ? (
                  <p className="text-xs text-brown-500 pl-1">暂无 NPC</p>
                ) : (
                  npcs.map((npc) => {
                    const statusCfg = STATUS_MAP[npc.status];
                    return (
                      <div
                        key={npc.agentId}
                        className="flex items-center gap-2 py-1 px-2 rounded hover:bg-brown-800 transition-colors group"
                      >
                        <span className="text-sm">👤</span>
                        <span className="text-sm text-brown-100 flex-1 truncate">{npc.name}</span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full text-white ${statusCfg.color}`}
                        >
                          {statusCfg.label}
                        </span>
                        <button
                          onClick={() => handleRemove(npc.agentId, npc.name)}
                          className="text-brown-500 hover:text-red-400 text-sm opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                          title={`移除 ${npc.name}`}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })
                )}

                {isPoolExhausted && npcs.length > 0 && (
                  <p className="text-xs text-brown-500 pl-1 mt-1">所有角色已在小镇中</p>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* 清空所有 */}
      {totalNPCs > 0 && (
        <>
          <hr className="border-brown-800" />
          <button
            onClick={handleClearAll}
            className="text-sm text-red-400 hover:text-red-300 hover:bg-red-900/30 px-3 py-1.5 rounded transition-colors cursor-pointer"
          >
            🗑 清空所有 NPC（{totalNPCs}）
          </button>
        </>
      )}
    </div>
  );
}
