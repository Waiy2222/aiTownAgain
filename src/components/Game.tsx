import { useRef, useState } from 'react';
import PixiGame from './PixiGame.tsx';

import { useElementSize } from 'usehooks-ts';
import { Stage } from '@pixi/react';
import { ConvexProvider, useConvex, useQuery } from 'convex/react';
import PlayerDetails from './PlayerDetails.tsx';
import Dashboard from './Dashboard.tsx';
import { api } from '../../convex/_generated/api';
import { useWorldHeartbeat } from '../hooks/useWorldHeartbeat.ts';
import { useHistoricalTime } from '../hooks/useHistoricalTime.ts';
import { DebugTimeManager } from './DebugTimeManager.tsx';
import { GameId } from '../../convex/aiTown/ids.ts';
import { useServerGame } from '../hooks/serverGame.ts';
import ForceConversation from './ForceConversation.tsx';
import NPCModelTooltip from './NPCModelTooltip.tsx';
import Sidebar, { TabDef } from './Sidebar.tsx';
import { Id } from '../../convex/_generated/dataModel';

export const SHOW_DEBUG_UI = !!import.meta.env.VITE_SHOW_DEBUG_UI;

const SIDEBAR_TABS: TabDef[] = [
  { id: 'details', label: 'Details' },
];

export default function Game({
  worldId,
  engineId,
}: {
  worldId: Id<'worlds'>;
  engineId: Id<'engines'>;
}) {
  const convex = useConvex();
  const [selectedElement, setSelectedElement] = useState<{
    kind: 'player';
    id: GameId<'players'>;
  }>();
  const [activeTab, setActiveTab] = useState(SIDEBAR_TABS[0].id);
  const [gameWrapperRef, { width, height }] = useElementSize();

  const game = useServerGame(worldId);

  // Send a periodic heartbeat to our world to keep it alive.
  useWorldHeartbeat();

  const worldState = useQuery(api.world.worldState, { worldId });
  const { historicalTime, timeManager } = useHistoricalTime(worldState?.engine);

  const scrollViewRef = useRef<HTMLDivElement>(null);

  // Tooltip state for NPC hover
  const [tooltip, setTooltip] = useState<{
    visible: boolean; x: number; y: number; name: string; model: string;
  } | null>(null);

  const handleHover = (name: string, model: string, screenX: number, screenY: number) => {
    setTooltip({ visible: true, x: screenX, y: screenY, name, model });
  };
  const handleHoverEnd = () => {
    setTooltip(null);
  };

  if (!game) {
    return null;
  }
  return (
    <>
      {SHOW_DEBUG_UI && <DebugTimeManager timeManager={timeManager} width={200} height={100} />}
      <Dashboard
        worldId={worldId}
        game={game}
        worldCreatedAt={worldState?.world._creationTime}
      />
      <div className="mx-auto w-full max-w grid grid-rows-[240px_1fr] lg:grid-rows-[1fr] lg:grid-cols-[1fr_auto] lg:grow max-w-[1400px] min-h-0 flex-1 game-frame">
        {/* Game area */}
        <div className="relative overflow-hidden bg-brown-900" ref={gameWrapperRef}>
          <div className="absolute inset-0">
            <div className="container">
              <Stage width={width} height={height} options={{ backgroundColor: 0x7ab5ff }}>
                {/* Re-propagate context because contexts are not shared between renderers.
https://github.com/michalochman/react-pixi-fiber/issues/145#issuecomment-531549215 */}
                <ConvexProvider client={convex}>
                  <PixiGame
                    game={game}
                    worldId={worldId}
                    engineId={engineId}
                    width={width}
                    height={height}
                    historicalTime={historicalTime}
                    setSelectedElement={setSelectedElement}
                    onHover={handleHover}
                    onHoverEnd={handleHoverEnd}
                  />
                </ConvexProvider>
              </Stage>
            </div>
          </div>
        </div>
        {/* Right column area */}
        <Sidebar
          tabs={SIDEBAR_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          scrollViewRef={scrollViewRef}
        >
          {activeTab === 'details' && (
            <PlayerDetails
              worldId={worldId}
              game={game}
              playerId={selectedElement?.id}
              setSelectedElement={setSelectedElement}
              scrollViewRef={scrollViewRef}
            />
          )}
          <hr className="my-4 border-brown-700" />
          <ForceConversation worldId={worldId} engineId={engineId} />
        </Sidebar>
      </div>
      <NPCModelTooltip data={tooltip} />
    </>
  );
}
