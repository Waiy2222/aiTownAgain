import Game from './components/Game.tsx';
import TopBar from './components/TopBar.tsx';

import { ToastContainer } from 'react-toastify';
import a16zImg from '../assets/a16z.png';
import convexImg from '../assets/convex.svg';
import { useState } from 'react';
import ReactModal from 'react-modal';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import PoweredByConvex from './components/PoweredByConvex.tsx';

export default function Home() {
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const worldStatus = useQuery(api.world.defaultWorldStatus);
  const worldId = worldStatus?.worldId;
  const engineId = worldStatus?.engineId;

  return (
    <main className="relative flex min-h-screen flex-col font-body game-background">
      <PoweredByConvex />

      <ReactModal
        isOpen={helpModalOpen}
        onRequestClose={() => setHelpModalOpen(false)}
        style={modalStyles}
        contentLabel="帮助弹窗"
        ariaHideApp={false}
      >
        <div className="font-body">
          <h1 className="text-center text-6xl font-bold font-display game-title">帮助</h1>
          <p>
            欢迎来到 AI 小镇。这是一个纯观战模式的虚拟小镇，AI 角色在此自主生活、聊天和社交。
          </p>
          <h2 className="text-4xl mt-4">观战</h2>
          <p>
            点击并拖动以在小镇中移动，滚动鼠标滚轮进行缩放。你可以点击单个 AI 角色来查看其信息和聊天历史记录。
          </p>
          <h2 className="text-4xl mt-4">管理面板</h2>
          <p>
            左侧面板可用于场景选择、NPC 管理和手动触发对话。顶部仪表盘实时展示世界运行数据。
          </p>
        </div>
      </ReactModal>

      {worldId && engineId && (
        <TopBar worldId={worldId} engineId={engineId} onHelpOpen={() => setHelpModalOpen(true)} />
      )}

      <div className="w-full flex-1 relative isolate overflow-hidden lg:p-8 p-4 shadow-2xl flex flex-col justify-start">
        {worldId && engineId ? (
          <Game worldId={worldId} engineId={engineId} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <h1 className="text-4xl sm:text-6xl lg:text-8xl font-bold font-display game-title text-center">
              AI 小镇
            </h1>
          </div>
        )}
      </div>

      <footer className="justify-center bottom-0 left-0 w-full flex items-center gap-3 p-3 flex-wrap">
        <a href="https://a16z.com">
          <img className="w-6 h-6 pointer-events-auto" src={a16zImg} alt="a16z" />
        </a>
        <a href="https://convex.dev/c/ai-town">
          <img className="w-16 h-6 pointer-events-auto" src={convexImg} alt="Convex" />
        </a>
      </footer>
      <ToastContainer position="bottom-right" autoClose={2000} closeOnClick theme="dark" />
    </main>
  );
}

const modalStyles = {
  overlay: {
    backgroundColor: 'rgb(0, 0, 0, 75%)',
    zIndex: 12,
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    maxWidth: '50%',

    border: '10px solid rgb(23, 20, 33)',
    borderRadius: '0',
    background: 'rgb(35, 38, 58)',
    color: 'white',
    fontFamily: '"Upheaval Pro", "sans-serif"',
  },
};
