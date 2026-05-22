import Game from './components/Game.tsx';

import { ToastContainer } from 'react-toastify';
import a16zImg from '../assets/a16z.png';
import convexImg from '../assets/convex.svg';
import starImg from '../assets/star.svg';
import helpImg from '../assets/help.svg';
// import { UserButton } from '@clerk/clerk-react'; // 导入 Clerk 用户按钮组件
// import { Authenticated, Unauthenticated } from 'convex/react'; // 导入 Convex 身份验证状态组件
// import LoginButton from './components/buttons/LoginButton.tsx'; // 导入登录按钮组件
import { useState } from 'react';
import ReactModal from 'react-modal';
import MusicButton from './components/buttons/MusicButton.tsx';
import Button from './components/buttons/Button.tsx';
import FreezeButton from './components/FreezeButton.tsx';
import SimControl from './components/SimControl.tsx';
import PoweredByConvex from './components/PoweredByConvex.tsx';

export default function Home() {
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-between font-body game-background">
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
      {/*<div className="p-3 absolute top-0 right-0 z-10 text-2xl">
        <Authenticated>
          <UserButton afterSignOutUrl="/ai-town" />
        </Authenticated>

        <Unauthenticated>
          <LoginButton />
        </Unauthenticated>
      </div> */}

      <div className="w-full lg:h-screen min-h-screen relative isolate overflow-hidden lg:p-8 shadow-2xl flex flex-col justify-start">
        <h1 className="mx-auto text-4xl p-3 sm:text-8xl lg:text-9xl font-bold font-display leading-none tracking-wide game-title w-full text-left sm:text-center sm:w-auto">
          AI 小镇
        </h1>

        <div className="max-w-xs md:max-w-xl lg:max-w-none mx-auto my-4 text-center text-base sm:text-xl md:text-2xl text-white leading-tight shadow-solid">
          一个 AI 角色在此生活、聊天和社交的虚拟小镇。
          {/* <Unauthenticated>
            <div className="my-1.5 sm:my-0" />
            登录以加入小镇
            <br className="block sm:hidden" /> 并参与对话！
          </Unauthenticated> */}
        </div>

        <Game />

        <footer className="justify-end bottom-0 left-0 w-full flex items-center mt-4 gap-3 p-6 flex-wrap pointer-events-none">
          <div className="flex gap-4 flex-grow pointer-events-none">
            <FreezeButton />
            <SimControl />
            <MusicButton />
            <Button href="https://github.com/lxp135/ai-town-cn" imgUrl={starImg}>
              Star
            </Button>
            <Button imgUrl={helpImg} onClick={() => setHelpModalOpen(true)}>
              帮助
            </Button>
          </div>
          <a href="https://a16z.com">
            <img className="w-8 h-8 pointer-events-auto" src={a16zImg} alt="a16z" />
          </a>
          <a href="https://convex.dev/c/ai-town">
            <img className="w-20 h-8 pointer-events-auto" src={convexImg} alt="Convex" />
          </a>
        </footer>
        <ToastContainer position="bottom-right" autoClose={2000} closeOnClick theme="dark" />
      </div>
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