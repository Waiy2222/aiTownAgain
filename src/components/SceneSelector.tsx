import { useState, useRef, useEffect } from 'react';
import { scenes, Scene } from '../../data/scenes';
import { useSendInput } from '../hooks/sendInput';
import { Id } from '../../convex/_generated/dataModel';

export default function SceneSelector({
  engineId,
  currentSceneId,
}: {
  engineId: Id<'engines'>;
  currentSceneId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const switchScene = useSendInput(engineId, 'switchScene');
  const ref = useRef<HTMLDivElement>(null);

  const currentScene = scenes.find((s) => s.id === currentSceneId) ?? scenes[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = async (scene: Scene) => {
    setIsOpen(false);
    if (scene.id !== currentSceneId) {
      await switchScene({ sceneId: scene.id });
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        className="scene-selector-btn text-white shadow-solid text-sm flex items-center gap-1.5 font-body"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-base sm:text-lg">📍</span>
        <span>{currentScene.name}</span>
        <span className="text-[10px] ml-0.5">▼</span>
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 z-50 bg-brown-800 border-2 border-brown-900 min-w-[200px] shadow-lg scene-dropdown">
          {scenes.map((scene) => (
            <button
              key={scene.id}
              className={`w-full text-left px-3 py-2.5 text-sm hover:bg-brown-700 text-brown-100 font-body transition-colors ${
                scene.id === currentSceneId ? 'bg-brown-700/70' : ''
              }`}
              onClick={() => handleSelect(scene)}
            >
              <div className="font-bold text-base">{scene.name}</div>
              <div className="text-xs text-brown-300 mt-0.5 leading-tight">
                {scene.description}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
