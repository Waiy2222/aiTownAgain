import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import clsx from 'clsx';

type SimSpeed = 'paused' | '1x' | '2x' | '5x';

const SPEEDS: { speed: SimSpeed; label: string }[] = [
  { speed: 'paused', label: '⏸ 暂停' },
  { speed: '1x', label: '1x' },
  { speed: '2x', label: '2x' },
  { speed: '5x', label: '5x' },
];

export default function SimControl() {
  const worldStatus = useQuery(api.world.defaultWorldStatus);
  const worldId = worldStatus?.worldId;
  const currentSpeed = useQuery(api.world.getSimSpeed, worldId ? { worldId } : 'skip');
  const setSimSpeed = useMutation(api.world.setSimSpeed);

  if (!worldId || !currentSpeed) return null;

  return (
    <div className="flex gap-1 items-center">
      {SPEEDS.map(({ speed, label }) => (
        <button
          key={speed}
          className={clsx(
            'text-white text-xs px-2 py-1 rounded pointer-events-auto transition-opacity',
            currentSpeed === speed
              ? 'bg-clay-700 shadow-solid'
              : 'bg-clay-500 opacity-60 hover:opacity-100',
          )}
          onClick={() => setSimSpeed({ worldId, speed })}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
