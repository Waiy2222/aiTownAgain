import { useEffect, useRef, useState } from 'react';
import { ServerGame } from '../hooks/serverGame';
import { Id } from '../../convex/_generated/dataModel';

// ─── AnimatedNumber ────────────────────────────────────────────
function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const prevRef = useRef(value);
  const [display, setDisplay] = useState(value);
  const rafRef = useRef<number>();

  useEffect(() => {
    const from = prevRef.current;
    if (from === value) return;
    const startTime = performance.now();
    const duration = 300; // ms

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        prevRef.current = value;
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  return <span className={className}>{display}</span>;
}

// ─── StatItem ──────────────────────────────────────────────────
function StatItem({
  label,
  value,
  color = 'text-white',
  animated,
}: {
  label: string;
  value: string | number;
  color?: string;
  animated?: boolean;
}) {
  return (
    <div className="flex flex-col items-center px-3 py-1 min-w-[70px] transition-all duration-300">
      <span className="text-[10px] text-brown-300 uppercase tracking-wider font-body">
        {label}
      </span>
      <span className={`text-xl font-bold font-display leading-tight ${color}`}>
        {animated && typeof value === 'number' ? (
          <AnimatedNumber value={value} />
        ) : (
          value
        )}
      </span>
    </div>
  );
}

// ─── DashboardSkeleton ─────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="bg-brown-800 border-b-2 border-brown-900 select-none">
      <div className="flex items-center px-4 py-1.5">
        <span className="text-brown-500 mr-2 text-xs">▶</span>
        <span className="text-sm font-bold text-brown-500 font-body">📊 加载中…</span>
      </div>
      <div className="flex flex-wrap items-center justify-around px-4 pb-2 gap-1 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center px-3 py-1 min-w-[70px]">
            <div className="h-3 w-12 bg-brown-700 rounded mb-1" />
            <div className="h-6 w-8 bg-brown-700 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ModelDistributionPill ─────────────────────────────────────
function ModelDistributionPill({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-body ${color} bg-brown-900/50`}
    >
      {label}: {count}
    </span>
  );
}

// ─── Props ─────────────────────────────────────────────────────
interface DashboardProps {
  worldId: Id<'worlds'>;
  game: ServerGame | undefined;
  worldCreatedAt?: number;
}

const STORAGE_KEY = 'dashboard-collapsed';

// ─── formatRuntime ─────────────────────────────────────────────
function formatRuntime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

// ─── Main Dashboard ────────────────────────────────────────────
export default function Dashboard({ worldId, game, worldCreatedAt }: DashboardProps) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [runtimeMs, setRuntimeMs] = useState(0);

  // 运行时长计时器
  useEffect(() => {
    if (!worldCreatedAt) return;
    const tick = () => setRuntimeMs(Date.now() - worldCreatedAt);
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [worldCreatedAt]);

  // 骨架屏：game 数据尚未就绪
  if (!game) {
    return <DashboardSkeleton />;
  }

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // 静默降级
    }
  };

  // ── 指标计算 ──
  const activeConversations = game.world.conversations.size;
  const totalPlayers = game.world.players.size;

  // 模型分布：按 agent identity 首段分组（将来由 P4-006 提供）
  const modelGroups = new Map<string, number>();
  for (const desc of game.agentDescriptions.values()) {
    const key = desc.identity.split('。')[0].slice(0, 8) + '…';
    modelGroups.set(key, (modelGroups.get(key) ?? 0) + 1);
  }
  const modelDistributionEntries = [...modelGroups.entries()];

  return (
    <div className="bg-brown-800 border-b-2 border-brown-900 select-none">
      {/* 标题栏 */}
      <div
        className="flex items-center px-4 py-1.5 cursor-pointer hover:bg-brown-700 transition-colors duration-200"
        onClick={toggleCollapsed}
      >
        <span className="text-brown-300 mr-2 text-xs transition-transform duration-200">
          {collapsed ? '▶' : '▼'}
        </span>
        <h3 className="text-sm font-bold text-brown-300 uppercase tracking-wider font-body">
          {'📊'} 全局数据仪表盘
        </h3>
        <span className="ml-auto text-brown-500 text-[10px] font-body">
          {collapsed ? '点击展开' : '点击折叠'}
        </span>
      </div>

      {/* 指标区域 */}
      {!collapsed && (
        <div className="flex flex-wrap items-center justify-around px-4 pb-2 pt-0 gap-1 transition-opacity duration-200">
          <StatItem label="活跃对话" value={activeConversations} color="text-green-400" animated />
          <div className="w-px h-8 bg-brown-700" />

          <StatItem label="NPC总数" value={totalPlayers} color="text-yellow-400" animated />
          <div className="w-px h-8 bg-brown-700" />

          <StatItem label="在线" value={totalPlayers} color="text-blue-400" animated />
          <div className="w-px h-8 bg-brown-700" />

          {/* 模型分布（替代之前的 "Agent数"） */}
          <div className="flex flex-col items-center px-3 py-1 min-w-[90px]">
            <span className="text-[10px] text-brown-300 uppercase tracking-wider font-body">
              模型分布
            </span>
            <div className="flex flex-wrap gap-1 mt-1 justify-center">
              {modelDistributionEntries.length > 0 ? (
                modelDistributionEntries.map(([label, count]) => (
                  <ModelDistributionPill
                    key={label}
                    label={label.slice(0, 4)}
                    count={count}
                    color="text-purple-400"
                  />
                ))
              ) : (
                <span className="text-purple-400 text-xl font-bold font-display">——</span>
              )}
            </div>
          </div>
          <div className="w-px h-8 bg-brown-700" />

          <StatItem label="今日消息" value="——" color="text-pink-400" />
          <div className="w-px h-8 bg-brown-700" />

          <StatItem label="运行时长" value={formatRuntime(runtimeMs)} color="text-cyan-400" />
        </div>
      )}
    </div>
  );
}
