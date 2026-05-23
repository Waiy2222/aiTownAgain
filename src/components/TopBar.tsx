import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import SceneSelector from './SceneSelector';
import FreezeButton from './FreezeButton';
import SimControl from './SimControl';
import MusicButton from './buttons/MusicButton';
import Button from './buttons/Button';
import starImg from '../../assets/star.svg';
import helpImg from '../../assets/help.svg';

export default function TopBar({
  worldId,
  engineId,
  onHelpOpen,
}: {
  worldId: Id<'worlds'>;
  engineId: Id<'engines'>;
  onHelpOpen: () => void;
}) {
  const worldState = useQuery(api.world.worldState, { worldId });
  const sceneId = worldState?.world.sceneId ?? 'town_square';

  return (
    <header className="topbar flex items-center justify-between px-3 sm:px-6 py-2 gap-3 flex-wrap">
      <div className="flex items-center gap-3">
        <SceneSelector engineId={engineId} currentSceneId={sceneId} />
      </div>

      <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold font-display tracking-wide game-title leading-none">
        AI 小镇
      </h1>

      <div className="flex items-center gap-2 flex-wrap">
        <FreezeButton />
        <SimControl />
        <MusicButton />
        <Button href="https://github.com/lxp135/ai-town-cn" imgUrl={starImg}>
          Star
        </Button>
        <Button imgUrl={helpImg} onClick={onHelpOpen}>
          帮助
        </Button>
      </div>
    </header>
  );
}
