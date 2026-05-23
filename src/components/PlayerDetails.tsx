import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import closeImg from '../../assets/close.svg';
import { SelectElement } from './Player';
import { Messages } from './Messages';
import ModelStatsTab from './ModelStatsTab';
import { GameId } from '../../convex/aiTown/ids';
import { ServerGame } from '../hooks/serverGame';

type TabId = 'chat' | 'stats';

export default function PlayerDetails({
  worldId,
  game,
  playerId,
  setSelectedElement,
  scrollViewRef,
}: {
  worldId: Id<'worlds'>;
  game: ServerGame;
  playerId?: GameId<'players'>;
  setSelectedElement: SelectElement;
  scrollViewRef: React.RefObject<HTMLDivElement>;
}) {
  const [activeTab, setActiveTab] = useState<TabId>('chat');

  const player = playerId && game.world.players.get(playerId);
  const playerConversation = player && game.world.playerConversation(player);

  const previousConversation = useQuery(
    api.world.previousConversation,
    playerId ? { worldId, playerId } : 'skip',
  );

  const playerDescription = playerId && game.playerDescriptions.get(playerId);

  // 根据 playerId 查找对应的 agentId
  const agentEntry = playerId
    ? [...game.world.agents.values()].find((a) => a.playerId === playerId)
    : undefined;
  const agentId = agentEntry?.id;

  if (!playerId) {
    return (
      <div className="h-full text-xl flex text-center items-center p-4">
        点击地图上的智能体以查看信息。
      </div>
    );
  }
  if (!player) {
    return null;
  }

  return (
    <>
      {/* 标题栏 */}
      <div className="flex gap-4">
        <div className="box w-3/4 sm:w-full mr-auto">
          <h2 className="bg-brown-700 p-2 font-display text-2xl sm:text-4xl tracking-wider shadow-solid text-center flex items-center justify-center gap-2">
            {playerDescription?.name}
            {agentId && (
              <span className="inline-block text-[10px] font-body bg-purple-600/60 text-purple-200 px-1.5 py-0.5 rounded-sm leading-none">
                AI
              </span>
            )}
          </h2>
        </div>
        <a
          className="button text-white shadow-solid text-2xl cursor-pointer pointer-events-auto"
          onClick={() => setSelectedElement(undefined)}
        >
          <h2 className="h-full bg-clay-700">
            <img className="w-4 h-4 sm:w-5 sm:h-5" src={closeImg} alt="关闭" />
          </h2>
        </a>
      </div>

      {/* 活动描述 */}
      {!playerConversation && player.activity && player.activity.until > Date.now() && (
        <div className="box flex-grow mt-6">
          <h2 className="bg-brown-700 text-base sm:text-lg text-center">
            {player.activity.description}
          </h2>
        </div>
      )}

      {/* 角色描述 */}
      <div className="desc my-6">
        <p className="leading-tight -m-4 bg-brown-700 text-base sm:text-sm">
          {playerDescription?.description}
        </p>
      </div>

      {/* 标签页切换栏 */}
      <div className="flex border-b border-brown-700 mb-2">
        <button
          className={`flex-1 py-2 text-sm font-body tracking-wide transition-colors ${
            activeTab === 'chat'
              ? 'text-brown-200 border-b-2 border-brown-200'
              : 'text-brown-500 hover:text-brown-300'
          }`}
          onClick={() => setActiveTab('chat')}
        >
          对话记录
        </button>
        <button
          className={`flex-1 py-2 text-sm font-body tracking-wide transition-colors ${
            activeTab === 'stats'
              ? 'text-brown-200 border-b-2 border-brown-200'
              : 'text-brown-500 hover:text-brown-300'
          }`}
          onClick={() => setActiveTab('stats')}
        >
          模型统计
        </button>
      </div>

      {/* 标签页内容 */}
      {activeTab === 'chat' && (
        <>
          {playerConversation && (
            <Messages
              worldId={worldId}
              inConversationWithMe={false}
              conversation={{ kind: 'active', doc: playerConversation }}
              scrollViewRef={scrollViewRef}
            />
          )}
          {!playerConversation && previousConversation && (
            <>
              <div className="box flex-grow">
                <h2 className="bg-brown-700 text-lg text-center">历史对话</h2>
              </div>
              <Messages
                worldId={worldId}
                inConversationWithMe={false}
                conversation={{ kind: 'archived', doc: previousConversation }}
                scrollViewRef={scrollViewRef}
              />
            </>
          )}
          {!playerConversation && !previousConversation && (
            <div className="text-brown-500 text-sm text-center py-8 font-body">
              暂无对话记录
            </div>
          )}
        </>
      )}

      {activeTab === 'stats' && (
        <ModelStatsTab
          worldId={worldId}
          agentId={agentId}
          playerId={playerId}
          game={game}
        />
      )}
    </>
  );
}
