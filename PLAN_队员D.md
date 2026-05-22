# 队员D 项目计划书 · 交互与润色（零依赖版）

> 日期：2026-05-21
> 负责人：队员D
> 任务：手动撮合（P4-013-A）+ 悬停 Tooltip（P4-013-B）+ 全中文化（P4-013-C）
> 核心策略：**所有组件从 ServerGame 自取数据，不等待任何人，即刻全部开工**

---

## 零、为什么可以不等别人

| 原依赖 | 如何绕开 |
|--------|---------|
| 队员A 的 LeftPanel | ForceConversation **自己渲染为独立面板**，直接嵌入 Game.tsx 右侧区域。队员A 完成后只需改一行 import 位置 |
| 队员B 的 NPC 列表 | ForceConversation 用 `useServerGame(worldId)` 直接从 `game.world.players` 取 NPC，不通过 ModelNPCManager |
| 队员B 的 modelName | Agent 当前无 modelName 字段 → 队员D 先在 Agent 上新增可选 `modelName`，默认 `"默认"`。队员B 后续对接时只需填值 |

**关键认知：`ServerGame` 已经暴露全部数据——`world.players` / `playerDescriptions` / `agentDescriptions`。不等别人给，自己拿。**

---

## 一、接口约定（轻量，便于后续迁移）

```typescript
// src/components/ForceConversation.tsx
// 自给自足：内部调用 useServerGame(worldId) 获取 NPC 列表
// 仅需两个外部 props：
interface ForceConversationProps {
  worldId: Id<'worlds'>;        // 用于 useServerGame + useQuery
  engineId: Id<'engines'>;      // 用于 useSendInput 发 forceConversation
}
// 队员A 在 LeftPanel 中只需：<ForceConversation worldId={worldId} engineId={engineId} />
```

---

## 二、任务分解（以单文件为单位）

---

### 文件 1：`convex/aiTown/conversation.ts`  [修改 · P4-013-A 后端]

| 项目 | 内容 |
|------|------|
| **现有功能** | 对话状态机：start / acceptInvite / rejectInvite / leave / tick |
| **新增功能** | `forceConversation` input handler：强制两个 NPC 进入对话 |

**新增代码（在 `conversationInputs` 对象中）：**
```typescript
forceConversation: inputHandler({
  args: {
    playerId,          // NPC A 的 playerId
    invitee: playerId, // NPC B 的 playerId
  },
  handler: (game: Game, now: number, args) => {
    const playerA = game.world.players.get(parseGameId('players', args.playerId));
    const playerB = game.world.players.get(parseGameId('players', args.invitee));
    if (!playerA || !playerB) throw new Error(`Player not found`);
    if (playerA.id === playerB.id) throw new Error(`Can't match the same NPC`);

    // 1. 如果任一 NPC 正在对话中，先强制离开
    for (const conv of [...game.world.conversations.values()]) {
      if (conv.participants.has(playerA.id) || conv.participants.has(playerB.id)) {
        conv.stop(game, now);
      }
    }

    // 2. 中断当前寻路
    if (playerA.pathfinding) delete playerA.pathfinding;
    if (playerB.pathfinding) delete playerB.pathfinding;

    // 3. 创建新对话（复用现有 Conversation.start）
    const { conversationId, error } = Conversation.start(game, now, playerA, playerB);
    if (error) throw new Error(error);
    return conversationId;
  },
}),
```

**调试检测点（8 项）：**
1. 两个空闲 NPC → 新对话创建成功
2. A 正在对话中 → A 的旧对话被 stop → 新对话创建成功
3. A 和 B 都在对话中 → 两个旧对话均被 stop → 新对话创建成功
4. 传入同一 NPC ID 两次 → 抛出错误
5. 不存在的 playerId → 抛出错误
6. 距离 > 20 tiles → 两人先 walkingOver 移动到位再开始聊
7. `game.allocId('conversations')` 正确分配新 ID
8. 返回的 conversationId 被客户端正确接收

**测试方案：**
- 单元：在测试 game 实例创建 2 个 NPC，调 forceConversation → 验证 `world.conversations` 新增记录
- 集成：浏览器实际选 2 NPC → 点发起对话 → 观察地图行为
- 边界：连撮同一对 NPC 3 次 → 每次正确新建
- 回归：确认 startConversation / acceptInvite / rejectInvite 不受影响

**预期测试结果：**
- 无论 NPC 当前什么状态，forceConversation 都能强制创建新对话，两人走向对方并开始聊天

---

### 文件 2：`src/components/ForceConversation.tsx`  [新增 · P4-013-A 前端]

| 项目 | 内容 |
|------|------|
| **功能函数** | `ForceConversation` 组件：两个下拉框（选 NPC）+ "发起对话"按钮 + 表单校验 |
| **Props** | `worldId`, `engineId` |
| **数据来源** | `useServerGame(worldId)` → 直接从 `game.world.players` 过滤非 human 玩家作为 NPC 列表 |
| **输出** | 通过 `useSendInput(engineId, 'forceConversation')` 触发后端 |

**内部逻辑：**
```typescript
export function ForceConversation({ worldId, engineId }: ForceConversationProps) {
  const game = useServerGame(worldId);
  const forceConv = useSendInput(engineId, 'forceConversation');

  // 自取 NPC 列表：排除人类玩家
  const npcList = useMemo(() => {
    if (!game) return [];
    return [...game.world.players.values()]
      .filter(p => !p.human)   // 排除人类
      .map(p => {
        const desc = game.playerDescriptions.get(p.id);
        const agent = [...game.world.agents.values()].find(a => a.playerId === p.id);
        const inConv = [...game.world.conversations.values()].some(c => c.participants.has(p.id));
        return {
          playerId: p.id,
          name: desc?.name ?? '未知',
          inConversation: inConv,
        };
      });
  }, [game]);

  const [a, setA] = useState<string>('');
  const [b, setB] = useState<string>('');
  const canSubmit = a && b && a !== b;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const nameA = npcList.find(n => n.playerId === a)?.name;
    const nameB = npcList.find(n => n.playerId === b)?.name;
    await toastOnError(forceConv({ playerId: a, invitee: b }));
    toast(`正在撮合「${nameA}」与「${nameB}」...`);
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-brown-900 rounded">
      <h3 className="text-lg">手动撮合</h3>
      <select value={a} onChange={e => setA(e.target.value)}>
        <option value="">选择 NPC A</option>
        {npcList.map(n => (
          <option key={n.playerId} value={n.playerId} disabled={n.playerId === b}>
            {n.name}{n.inConversation ? ' (对话中)' : ''}
          </option>
        ))}
      </select>
      <select value={b} onChange={e => setB(e.target.value)}>
        <option value="">选择 NPC B</option>
        {npcList.map(n => (
          <option key={n.playerId} value={n.playerId} disabled={n.playerId === a}>
            {n.name}{n.inConversation ? ' (对话中)' : ''}
          </option>
        ))}
      </select>
      <button disabled={!canSubmit} onClick={handleSubmit}>
        发起对话
      </button>
    </div>
  );
}
```

**调试检测点（10 项）：**
1. 组件从 game 正确读取 NPC 列表
2. 人类玩家不出现在下拉框中
3. 同一 NPC 在另一个下拉框被 disabled
4. 已在对话中的 NPC 标记"(对话中)"
5. 未选满 2 人时按钮 disabled
6. 选满 2 个不同 NPC 后按钮激活
7. 点击按钮 → `sendInput` 参数正确 → toast 弹出
8. Toast 文本包含两个 NPC 的名称
9. NPC 不足 2 个时两个下拉框可选项不足，按钮始终 disabled
10. `useSendInput` 的 pending 状态正确反映在按钮上（如加 opacity）

**测试方案：**
- 单元：mock `useServerGame` 返回 4 个 NPC → 验证下拉框选项 / 禁用逻辑 / 按钮状态
- 集成：浏览器实操选中 2 NPC → 点发起对话 → 观察 toast + 地图
- 边界：选已在对话中的 NPC → 确认仍可发起（强制离开旧对话）
- 边界：worldId 为空 → 组件不渲染或显示占位

**预期测试结果：**
- 选 2 个不同 NPC → 按钮激活 → 点击 → toast → 两人走向对方 → 开始聊天

---

### 文件 3：`src/components/Game.tsx`  [修改 · P4-013-A + P4-013-B 容器]

| 项目 | 内容 |
|------|------|
| **现有功能** | 游戏主容器：PixiGame + PlayerDetails 双栏布局 |
| **新增功能** | ① 渲染 ForceConversation 面板 ② tooltip 状态管理 + 渲染 NPCModelTooltip |

**修改内容：**

```typescript
// 新增 import
import ForceConversation from './ForceConversation';
import NPCModelTooltip from './NPCModelTooltip';

// 新增 tooltip state
const [tooltip, setTooltip] = useState<{
  visible: boolean; x: number; y: number; name: string; model: string;
} | null>(null);

// 在右侧栏 PlayerDetails 下方插入 ForceConversation
// 在组件树顶层渲染 NPCModelTooltip
```

**右侧栏布局（修改后）：**
```tsx
<div ref={scrollViewRef} className="...">
  <PlayerDetails ... />
  <hr className="my-4 border-brown-700" />
  <ForceConversation worldId={worldId} engineId={engineId} />
</div>
```

**调试检测点（6 项）：**
1. ForceConversation 组件在右侧栏渲染
2. 有 engineId 时组件正常工作
3. worldId/engineId 为空时不渲染
4. tooltip state 变化 → NPCModelTooltip 正确显示/隐藏
5. 不影响现有 selectedElement / PlayerDetails 逻辑
6. 右侧栏滚动正常

**测试方案：**
- 集成：页面加载 → 确认右侧栏出现手动撮合面板
- 回归：点击 NPC → PlayerDetails 正常；移动/缩放地图正常

**预期测试结果：**
- 右侧栏在 PlayerDetails 下方显示撮合面板，功能完整

---

### 文件 4：`src/components/NPCModelTooltip.tsx`  [新增 · P4-013-B]

| 项目 | 内容 |
|------|------|
| **功能函数** | `NPCModelTooltip` 组件：hover NPC 时在鼠标附近显示 `"{角色名} · {模型名}"` |
| **Props** | `visible: boolean`, `x: number`, `y: number`, `name: string`, `model: string` |
| **输出** | 通过 React Portal 渲染到 document.body 的绝对定位 tooltip |

**内部逻辑：**
- `createPortal(...)` 渲染到 `document.body`，避开游戏区 overflow:hidden
- 样式：`bg-black/80 text-white text-sm px-2 py-1 rounded pointer-events-none fixed z-50 whitespace-nowrap`
- 位置：`left: x + 12px, top: y + 12px`
- 200ms debounce：`mouseleave` 后用 `setTimeout` 200ms 再隐藏，防止快速划过时闪烁
- 边界检测：若 `x + tooltipWidth > window.innerWidth` 则翻到左侧；同理处理底部溢出

**调试检测点（7 项）：**
1. `visible=true` → tooltip 渲染在鼠标附近
2. 内容格式 = "{角色名} · {模型名}"
3. `visible=false` → tooltip 不渲染
4. 鼠标移出 → 200ms 后消失
5. 快速划过 3 个不同 NPC → 正确切换，无残留/闪烁
6. 鼠标在视口右下角 → tooltip 向左上方翻转
7. `pointer-events-none` 确保不拦截点击

**测试方案：**
- 单元：固定 props 渲染 → 验证 DOM 结构和位置计算
- 集成：hover 不同 NPC → 验证位置/内容/消失
- 边界：贴近视口右边缘 hover → 翻转方向
- 边界：快速在 5 个 NPC 间划动 → 无残留

**预期测试结果：**
- hover → 即时显示；mouseleave → 200ms 消失；内容准确；不超出视口

---

### 文件 5：`src/components/Player.tsx`  [修改 · P4-013-B]

| 项目 | 内容 |
|------|------|
| **现有功能** | 渲染单个 NPC 精灵，处理 click 事件 |
| **新增功能** | 添加 `mouseover` / `mouseout` 事件，将屏幕坐标和名称传递给父组件 |

**新增 props：**
```typescript
onHover?: (
  name: string,
  model: string,
  screenX: number,
  screenY: number,
) => void;
onHoverEnd?: () => void;
```

**集成方式：**
- 在 `<Character>` 上添加 `mouseover` / `mouseout`
- 从 PixiJS `FederatedPointerEvent` 取 `screenX` / `screenY`
- 名称从 `game.playerDescriptions.get(player.id)?.name` 取
- 模型从 agent 取（当前默认 `"默认"`，队员B 完成后自动生效）

**调试检测点（5 项）：**
1. hover NPC 精灵 → mouseover 触发 → 回调收到正确坐标
2. mouseout → onHoverEnd 调用
3. 名称正确传递
4. click 选中 NPC 不受影响
5. 缩放/平移地图后 hover 坐标仍正确

**测试方案：**
- 集成：hover 不同 NPC → console.log 验证坐标和名称
- 回归：click 选中 → PlayerDetails 显示正确

**预期测试结果：**
- hover 坐标/名称正确传递；click 不受影响

---

### 文件 6：`convex/aiTown/agent.ts`  [修改 · P4-013-B 数据支撑]

| 项目 | 内容 |
|------|------|
| **现有 agent** | `id, playerId, toRemember, lastConversation, lastInviteAttempt, inProgressOperation` |
| **新增字段** | `modelName?: string` — 记录该 Agent 使用的 LLM 模型名 |

**修改点：**
```typescript
// Agent 类新增
modelName?: string;

// constructor 中
this.modelName = serialized.modelName;

// serialize() 中
modelName: this.modelName,

// serializedAgent 值定义中新增
modelName: v.optional(v.string()),
```

**为什么队员D 加这个字段：**
- Tooltip 需要显示模型名，但 Agent 当前没有这个字段
- 队员D 加可选字段 + 默认值 `"默认"`，不影响任何现有逻辑
- 队员B 做 P4-009（多模型）时自然会填真正的模型名，零冲突

**调试检测点（3 项）：**
1. 新 Agent 创建时 modelName 默认为 undefined
2. serializedAgent 包含 modelName 字段
3. 现有世界加载时反序列化不报错（可选字段兼容）

**测试方案：**
- 启动现有世界 → 确认不报错；新增 Agent → 确认 modelName 可设可选

**预期测试结果：**
- 向后兼容，现有功能不受影响

---

### 文件 7：`index.html`  [修改 · 中文化]

| 项目 | 内容 |
|------|------|
| **修改清单** | `lang="en"` → `lang="zh-CN"` / `<title>AI Town</title>` → `<title>AI 小镇</title>` / meta description 改中文 |

```html
<html lang="zh-CN">
  <title>AI 小镇</title>
  <meta name="description" content="一个 AI 角色在此生活、聊天和社交的虚拟小镇" />
```

**调试检测点：** 标签页标题 / html lang / meta 全部中文

**预期测试结果：** 浏览器标签页显示 "AI 小镇"

---

### 文件 8：`src/components/buttons/MusicButton.tsx`  [修改 · 中文化]

| 原文 | 改为 |
|------|------|
| `title="Play AI generated music (press m to play/mute)"` | `title="播放 AI 生成的音乐（按 M 键播放/静音）"` |
| `{isPlaying ? 'Mute' : 'Music'}` | `{isPlaying ? '静音' : '音乐'}` |

---

### 文件 9：`src/components/buttons/InteractButton.tsx`  [修改 · 中文化]

| 原文 | 改为 |
|------|------|
| `{isPlaying ? 'Leave' : 'Interact'}` | `{isPlaying ? '离开' : '互动'}` |
| `console.log('Leaving game for player ...')` | `console.log('正在离开游戏，玩家：${userPlayerId}')` |
| `console.log('Joining game')` | `console.log('正在加入游戏')` |

---

### 文件 10：`convex/constants.ts`  [修改 · 中文化]

| 原文 | 改为 |
|------|------|
| `'reading a book'` | `'正在看书'` |
| `'daydreaming'` | `'正在发呆'` |
| `'gardening'` | `'正在园艺'` |

---

### 文件 11：`convex/aiTown/conversation.ts`  [修改 · 中文化]

| 原文 | 改为 |
|------|------|
| `console.log('Creating conversation ${...}')` | `console.log('正在创建对话：${conversationId}')` |
| `console.log('Starting ${playerId} ${inviteeId}...')` | `console.log('正在发起对话：${playerId} ${inviteeId}...')` |
| `console.log('Starting conversation between ${p1.id} and ${p2.id}')` | `console.log('对话开始：${player1.id} 与 ${player2.id}')` |
| `console.warn('Conversation ${this.id} has ${...} participants')` | `console.warn('对话 ${this.id} 参与者数量异常：${...}')` |
| `console.log('Giving up on invite to ${...}')` | `console.log('等待邀请超时：${otherPlayer.id}')` |

---

### 文件 12：`convex/aiTown/agent.ts`  [修改 · 中文化]

| 原文 | 改为 |
|------|------|
| `console.log('Timing out ${...}')` | `console.log('操作超时：${JSON.stringify(this.inProgressOperation)}')` |
| `console.log('Agent ${this.id} remembering conversation ${...}')` | `console.log('Agent ${this.id} 正在记忆对话 ${this.toRemember}')` |
| `console.log('Agent ${player.id} accepting invite from ${...}')` | `console.log('Agent ${player.id} 接受了 ${otherPlayer.id} 的邀请')` |
| `console.log('Agent ${player.id} rejecting invite from ${...}')` | `console.log('Agent ${player.id} 拒绝了 ${otherPlayer.id} 的邀请')` |
| `console.log('Agent ${player.id} walking towards ${...}')` | `console.log('Agent ${player.id} 正在走向 ${otherPlayer.id}...')` |
| `console.log('${player.id} initiating conversation with ${...}')` | `console.log('${player.id} 正在发起与 ${otherPlayer.id} 的对话')` |
| `console.log('${player.id} leaving conversation with ${...}')` | `console.log('${player.id} 正在离开与 ${otherPlayer.id} 的对话')` |
| `console.log('${player.id} continuing conversation with ${...}')` | `console.log('${player.id} 正在继续与 ${otherPlayer.id} 的对话')` |

---

### 文件 13：`src/components/PixiGame.tsx`  [修改 · 中文化]

| 原文 | 改为 |
|------|------|
| `console.log('Skipping navigation on drag event (${dist}px)')` | `console.log('跳过拖拽导航（${dist}px）')` |
| `console.log('Moving to ${JSON.stringify(roundedTiles)}')` | `console.log('正在移动到：${JSON.stringify(roundedTiles)}')` |

---

### 文件 14-17：仅验证（已中文化，无需修改）

| 文件 | 状态 |
|------|------|
| `src/App.tsx` | 帮助弹窗、标题、副标题全部中文 ✓ |
| `src/components/PlayerDetails.tsx` | 按钮/日志已中文 ✓ |
| `src/components/Messages.tsx` | 加入/离开提示已中文；移除 `uppercase` 对中文名无效 |
| `src/components/FreezeButton.tsx` | title/按钮/日志已中文 ✓ |
| `convex/agent/conversation.ts` | prompt 模板全部中文 ✓ |
| `src/components/PoweredByConvex.tsx` | 品牌标语保留英文（国际惯例）✓ |

---

## 三、总文件目录

```
队员D 任务涉及文件清单
========================

新增文件（3 个）：
  src/components/ForceConversation.tsx      # 手动撮合 UI（自取 NPC 列表）
  src/components/NPCModelTooltip.tsx        # 悬停 Tooltip 组件
  PLAN_队员D.md                            # 本计划书

修改文件（11 个）：

  [P4-013-A 手动撮合 — 2 个文件]
  convex/aiTown/conversation.ts            # +forceConversation input handler
  src/components/Game.tsx                  # +ForceConversation 渲染 + tooltip 状态

  [P4-013-B 悬停 Tooltip — 3 个文件]
  src/components/NPCModelTooltip.tsx       # 新建（已在新增中）
  src/components/Player.tsx                # +hover 事件回调
  convex/aiTown/agent.ts                   # +modelName 可选字段

  [P4-013-C 全中文化 — 7 个文件]
  index.html                               # lang/title/meta
  src/components/buttons/MusicButton.tsx   # 按钮 + title
  src/components/buttons/InteractButton.tsx# 按钮 + console
  convex/constants.ts                      # ACTIVITIES
  convex/aiTown/conversation.ts            # console.log（同上文件）
  convex/aiTown/agent.ts                   # console.log（同上文件）
  src/components/PixiGame.tsx             # console.log

仅验证（5 个文件）：
  src/App.tsx                              # 已中文 ✓
  src/components/PlayerDetails.tsx         # 已中文 ✓
  src/components/Messages.tsx              # 已中文 ✓（移除 uppercase）
  src/components/FreezeButton.tsx          # 已中文 ✓
  convex/agent/conversation.ts             # 已中文 ✓
```

---

## 四、执行顺序（全部即刻开工）

```
阶段 1 — 后端先行（30 min）         无依赖
  ├── 文件 1:  convex/aiTown/conversation.ts  +forceConversation handler
  └── 文件 6:  convex/aiTown/agent.ts          +modelName 字段

阶段 2 — 前端组件（90 min）         无依赖（阶段 1 完成即可联调）
  ├── 文件 2:  ForceConversation.tsx           新建 [45 min]
  ├── 文件 4:  NPCModelTooltip.tsx             新建 [30 min]
  ├── 文件 5:  Player.tsx                      +hover [20 min]
  └── 文件 3:  Game.tsx                        +撮合面板 +tooltip 状态 [20 min]

阶段 3 — 全中文化（40 min）         无依赖，可与其他阶段并行
  ├── 文件 7:  index.html                       [3 min]
  ├── 文件 8:  MusicButton.tsx                  [3 min]
  ├── 文件 9:  InteractButton.tsx               [5 min]
  ├── 文件 10: convex/constants.ts              [3 min]
  ├── 文件 11: convex/aiTown/conversation.ts   日志 [10 min]
  ├── 文件 12: convex/aiTown/agent.ts          日志 [10 min]
  ├── 文件 13: PixiGame.tsx                     [3 min]
  └── 文件 14-17: 逐文件验证                    [10 min]

总耗时：约 2.5-3 小时（单人可以一个下午完成全部）
```

---

## 五、队员A / 队员B 对接（零成本）

当队员A 完成 LeftPanel：
```tsx
// 在 Game.tsx 中，把这一行：
<ForceConversation worldId={worldId} engineId={engineId} />
// 从右侧栏剪到 LeftPanel.tsx 中即可。组件代码不改一行。
```

当队员B 完成 modelName：
```typescript
// ForceConversation 中读取 modelName 的逻辑自动生效：
// agent.modelName 从 "默认" 变为真正的模型名。代码不改一行。
```

---

## 六、测试日志模板

```
=== 队员D 测试日志 ===
开始时间：2026-05-__ __:__

[时间 1] 文件 1  convex/aiTown/conversation.ts — forceConversation handler
  测试方案：在游戏 running 状态下，通过浏览器 console 调 sendInput 发送 forceConversation
  测试数据：playerId = "xxx", invitee = "yyy"
  测试结果：□ 通过 / □ 失败
  原因分析：_______________

[时间 2] 文件 6  convex/aiTown/agent.ts — modelName 字段
  测试方案：启动世界 → 查看 Agent 序列化/反序列化是否报错
  测试数据：默认世界 8 个 Agent
  测试结果：□ 通过 / □ 失败
  原因分析：_______________

[时间 3] 文件 2  ForceConversation.tsx
  测试方案：页面加载 → 检查下拉框 NPC 列表 → 选 2 人 → 点发起对话
  测试数据：世界中有 8 个 NPC
  测试结果：□ 通过 / □ 失败
  原因分析：_______________

[时间 4] 文件 4+5+3  Tooltip 三件套
  测试方案：hover 不同 NPC → 检查 tooltip 位置/内容/消失
  测试数据：hover 3 个不同 NPC
  测试结果：□ 通过 / □ 失败
  原因分析：_______________

[时间 5] 文件 7-13 中文化
  测试方案：全局逐页检查 → 按钮/日志/标题/提示/活动描述
  测试数据：全部 UI 文本
  测试结果：□ 通过 / □ 失败
  原因分析：_______________

[时间 6] 全量回归
  测试方案：
    1. 页面标题+描述 → 中文 ✓
    2. 帮助弹窗 → 全中文 ✓
    3. 按钮文字（音乐/互动/冻结）→ 全中文 ✓
    4. 控制台日志 → 全中文 ✓
    5. NPC 活动描述 → 中文 ✓
    6. hover NPC → tooltip "{名} · 默认" ✓
    7. 手动撮合 → 选 2 NPC → toast → 两人走向对方 → 开始对话 ✓
    8. 撮合 1 个已在对话中的 NPC → 旧对话结束 → 新对话开始 ✓
    9. 连续撮合 3 次 → 每次正常 ✓
  测试结果：□ 通过 / □ 失败
  原因分析：_______________

结束时间：2026-05-__ __:__
```

---

## 七、测试规范

---

### 7.1 测试节点总表

> 标记说明：⬜ 未开始 / 🔲 进行中 / ✅ 已通过 / ❌ 失败 / ⏭ 跳过（不适用）

| 编号 | 节点名称 | 所属文件 | 检测项数 | 状态 | 负责人 | 备注 |
|------|---------|---------|---------|------|--------|------|
| T01 | index.html 中文化 | `index.html` | 3 | ⬜ | 队员D | 标签页标题 + lang + meta |
| T02 | MusicButton 中文化 | `MusicButton.tsx` | 3 | ⬜ | 队员D | 按钮文字 + title + hover |
| T03 | InteractButton 中文化 | `InteractButton.tsx` | 3 | ⬜ | 队员D | 按钮文字 + 2 条 console.log |
| T04 | ACTIVITIES 中文化 | `convex/constants.ts` | 2 | ⬜ | 队员D | 3 个活动描述 + emoji 不变 |
| T05 | PlayerDetails 验证 | `PlayerDetails.tsx` | 3 | ⬜ | 队员D | 已中文，仅验证 |
| T06 | Messages 验证 | `Messages.tsx` | 4 | ⬜ | 队员D | uppercase 已移除 + 文本中文 |
| T07 | FreezeButton 验证 | `FreezeButton.tsx` | 3 | ⬜ | 队员D | 已中文，仅验证 |
| T08 | App.tsx 验证 | `App.tsx` | 3 | ⬜ | 队员D | 帮助弹窗 + 标题 + 副标题 |
| T09 | conversation.ts 日志 | `convex/aiTown/conversation.ts` | 5 | ⬜ | 队员D | 4 条日志 + warn 翻译 |
| T10 | agent.ts 日志 | `convex/aiTown/agent.ts` | 8 | ⬜ | 队员D | 8 条 console.log 翻译 |
| T11 | player.ts 日志 | `convex/aiTown/player.ts` | 1 | ⬜ | 队员D | 寻路超时 warn |
| T12 | PixiGame 日志 | `PixiGame.tsx` | 2 | ⬜ | 队员D | 跳过拖拽 + 正在移动 |
| T13 | conversation.ts prompt 验证 | `convex/agent/conversation.ts` | 5 | ⬜ | 队员D | 已中文，仅验证 |
| T14 | modelName 字段 | `convex/aiTown/agent.ts` | 3 | ⬜ | 队员D | 类/serialize/值定义/向后兼容 |
| T15 | forceConversation 后端 | `convex/aiTown/conversation.ts` | 8 | ⬜ | 队员D | 正常撮合 + 已有对话 + 同ID + 不存在 |
| T16 | ForceConversation 前端 | `src/components/ForceConversation.tsx` | 10 | ⬜ | 队员D | 下拉框 + 按钮 + NPC列表 + toast |
| T17 | NPCModelTooltip | `src/components/NPCModelTooltip.tsx` | 7 | ⬜ | 队员D | 渲染 + 格式 + 防抖 + 边界翻转 |
| T18 | Player hover 事件 | `src/components/Player.tsx` | 5 | ⬜ | 队员D | 坐标传递 + 名称 + 模型 |
| T19 | Character pointer 事件 | `src/components/Character.tsx` | 2 | ⬜ | 队员D | pointerover + pointerout |
| T20 | Game.tsx 集成 | `src/components/Game.tsx` | 6 | ⬜ | 队员D | 面板渲染 + tooltip 状态 + 回归 |
| T21 | PixiGame 透传 | `src/components/PixiGame.tsx` | 2 | ⬜ | 队员D | onHover/onHoverEnd 透传 |
| T22 | 全量回归测试 | 全部文件 | 12 | ⬜ | 队员D | 见 7.5 回归检查清单 |

**统计：22 个测试节点 / 98 个检测项 / 预计耗时 2 小时**

---

### 7.2 测试指标

> 每个指标都有量化标准，不能通过即为失败。

#### 功能性指标

| 指标编号 | 指标名称 | 目标值 | 测量方法 |
|---------|---------|--------|---------|
| F01 | forceConversation 成功率 | ≥ 95%（20 次中 ≥ 19 次成功） | 手动执行 20 次撮合，统计成功次数 |
| F02 | 撮合响应时间 | ≤ 3 秒（从点击到 toast 出现） | 秒表计时，取 10 次平均值 |
| F03 | NPC 对话创建率 | ≥ 90%（撮合后 10 秒内开始对话） | 撮合 10 次，观察是否在 10 秒内开始对话 |
| F04 | 中文化覆盖率 | 100%（src/ + convex/ 无英文 UI 文本） | grep 扫描确认 |
| F05 | Tooltip 显示率 | 100%（hover 任意 NPC 后 200ms 内显示） | hover 10 个不同 NPC，观察是否全部显示 |
| F06 | Tooltip 消失率 | 100%（mouseleave 后 200ms 内消失） | 同上，移开后计时 |
| F07 | 下拉框 NPC 数量准确性 | 100%（与 game.world.players 非 human 数一致） | 对照 game state 计数 |
| F08 | 编译零错误 | TypeScript + Vite 零错误 | `npx tsc --noEmit` + Vite build |

#### 稳定性指标

| 指标编号 | 指标名称 | 目标值 | 测量方法 |
|---------|---------|--------|---------|
| S01 | 连续撮合无崩溃 | 10 次连续撮合无任何报错 | 连续撮合 10 次（可不同 NPC 对） |
| S02 | 撮合已在对话中的 NPC 无崩溃 | 5 次无报错 | 故意撮合对话中的 NPC |
| S03 | 快速 hover 无闪烁残留 | 快速划过 10 个 NPC，无残留 tooltip | 鼠标快速扫过地图 |
| S04 | 页面加载时间 | 首次渲染 ≤ 5 秒 | 浏览器 DevTools → Network → DOMContentLoaded |
| S05 | Convex 引擎恢复 | 世界状态 running，无异常日志 | `npx convex run testing:resume` |

#### 兼容性指标

| 指标编号 | 指标名称 | 目标值 | 测量方法 |
|---------|---------|--------|---------|
| C01 | 现有功能无回归 | 点击 NPC / 移动地图 / 缩放 / 冻结 全部正常 | 手动操作回归 |
| C02 | 向后兼容 | 旧世界加载不报错（modelName 可选） | 启动旧世界，检查控制台 |
| C03 | 队员B/队员A 对接零改动 | ForceConversation 组件 Props 不变 | 确认接口一致 |

---

### 7.3 测试标准

> 通过/失败判定规则。

#### 单节点判定

```
单节点通过条件：该节点的所有检测项全部通过
单节点失败条件：任一检测项失败
阻塞项（BLOCKER）：T14/T15/T16/T17 失败 → 整个 P4-013 不能交付
非阻塞项（NON-BLOCKER）：T01-T13 中文化单个失败不影响核心功能
```

#### 整体判定

| 判定 | 条件 |
|------|------|
| **通过** | 所有阻塞项 ✅ + 非阻塞项 ≥ 90% ✅ + 无 ❌ |
| **有条件通过** | 所有阻塞项 ✅ + 非阻塞项 ≥ 80% ✅ + 有 ⏭ 的项有合理解释 |
| **失败** | 任一阻塞项 ❌ 或 非阻塞项 < 80% |

#### 优先级分级

| 优先级 | 节点 | 说明 |
|--------|------|------|
| P0 — 阻塞交付 | T14, T15, T16, T17, T18, T20, T22 | 核心功能：撮合 + tooltip + 集成 + 回归 |
| P1 — 重要 | T01-T04, T09-T12 | 中文化 UI/日志 |
| P2 — 验证 | T05-T08, T13 | 已中文文件仅需确认 |
| P3 — 透传 | T19, T21 | 简单 props 透传 |

---

### 7.4 测试指南

> 按步骤傻瓜式操作，每一步都写了"做什么 → 看什么 → 预期什么"。

#### 准备环境

```
1. 终端执行：cd d:/GitHubkaode/aiTownAgain && npm run dev
2. 等待 Vite 输出 "ready" 和 Convex 输出 "Functions ready"
3. 如果 Convex 提示 "Engine ... is not active"，执行：
   npx convex run testing:resume
4. 浏览器打开 http://localhost:5173/ai-town
5. 按 F12 打开开发者工具 → 切换到 Console 标签页
```

---

#### 步骤 A：中文化验收（T01-T13，约 30 分钟）

**A1. 页面级（T01 / T08）**
```
做什么：刷新页面，观察浏览器标签页标题
看什么：标签页文字
预期：显示 "AI 小镇"（非 "AI Town"）

做什么：F12 → Elements 面板 → 看 <html> 标签
看什么：lang 属性值
预期：lang="zh-CN"（非 "en"）

做什么：页面上点 "帮助" 按钮
看什么：弹窗全部文字
预期：标题 "帮助"，正文无任何英文单词
```

**A2. 按钮级（T02 / T03 / T07）**
```
做什么：看页面底部按钮栏
看什么：MusicButton 的文字
预期：显示 "音乐"（非 "Music"）

做什么：hover MusicButton
看什么：浏览器原生 tooltip
预期：中文 "播放 AI 生成的音乐（按 M 键播放/静音）"

做什么：看 InteractButton 的文字
预期：显示 "互动"（非 "Interact"）

做什么：看 FreezeButton 的文字
预期：显示 "冻结"（非 "Freeze"）
```

**A3. 控制台级（T09 / T10 / T11 / T12）**
```
做什么：等待 30-60 秒，让 NPC 自然产生对话
看什么：Console 标签页中的日志
预期：所有日志为中文，无英文 console.log
      - 应看到 "正在创建对话"、"对话开始"、"Agent xxx 接受了" 等
      - 不应看到 "Creating conversation"、"Starting" 等英文开头日志
```

**A4. 游戏内文本（T04 / T05 / T06 / T13）**
```
做什么：观察地图上 NPC 头顶的活动描述
看什么：活动文字
预期：显示 "正在看书"/"正在发呆"/"正在园艺"（非英文）

做什么：点击一个 NPC → 看右侧面板
看什么：PlayerDetails 所有文字
预期：按钮/状态文字全中文

做什么：等待两个 NPC 开始对话 → 看右侧消息面板
看什么：加入/离开提示
预期："xxx 加入了对话。"（非英文）
```

---

#### 步骤 B：Tooltip 验收（T17 / T18 / T19，约 15 分钟）

**B1. 基本显示**
```
做什么：鼠标 hover 任意一个 NPC 精灵
看什么：鼠标附近出现的 tooltip
预期：显示 "{角色名} · 默认"（例如 "Stella · 默认"）
      注："默认" 是因为 modelName 字段尚未被队员B 填充，属于正常

做什么：鼠标移开
看什么：tooltip 消失
预期：200ms 内 tooltip 消失（几乎感觉不到延迟）
```

**B2. 边界情况**
```
做什么：快速划过 5 个 NPC
看什么：tooltip 跟随状态
预期：只显示最后一个 hover 的 NPC 信息，无残留 tooltip

做什么：hover 地图右下角的 NPC
看什么：tooltip 是否超出视口
预期：tooltip 反转到鼠标左侧/上方，完全可见

做什么：hover 时点击该 NPC
看什么：tooltip 是否阻挡了点击
预期：点击正常触发，PlayerDetails 正常显示（tooltip 不拦截事件）
```

---

#### 步骤 C：手动撮合验收（T14 / T15 / T16，约 20 分钟）

**C1. 基本流程**
```
做什么：看右侧栏下方的手动撮合面板
看什么：标题 + 两个下拉框 + 按钮
预期：标题 "手动撮合"，两个下拉框有 NPC 可选，按钮显示 "发起对话"

做什么：下拉框 A 选一个 NPC
看什么：下拉框 B 中该 NPC 的状态
预期：该 NPC 在下拉框 B 中被置灰/disabled

做什么：两个下拉框选不同 NPC，点 "发起对话"
看什么：页面右下角 toast 提示
预期：弹出 "正在撮合「A名」与「B名」..."

做什么：观察地图上两个 NPC 的行为
看什么：是否走向对方并开始对话
预期：3 秒内两人开始向对方移动，靠近后开始显示对话气泡

做什么：F12 → Console → 过滤 "手动撮合"
看什么：日志内容
预期：看到 "手动撮合：{playerIdA} 与 {playerIdB}，对话 ID：{convId}"
```

**C2. 已在对话中的 NPC**
```
做什么：等某个 NPC 正在对话时（对话气泡可见），在撮合面板选它 + 另一个 NPC
看什么：旧对话是否结束 + 新对话是否创建
预期：旧对话强制结束 → 两人走向对方 → 开始新对话

做什么：F12 → Console
看什么：日志中是否有报错
预期：无异常，旧对话被正常 stop
```

**C3. 边界情况**
```
做什么：下拉框只选一个 NPC，不选第二个
看什么：按钮状态
预期：按钮呈灰色/disabled，无法点击

做什么：NPC 不足 2 个时
看什么：面板显示
预期：显示 "需要至少 2 个 NPC 才能使用此功能"

做什么：连续撮合 3 次（不同或相同的 NPC 对）
看什么：每次是否都成功
预期：3 次全部成功，toast 正常弹出，NPC 正常移动
```

---

#### 步骤 D：集成回归（T20 / T21 / T22，约 20 分钟）

```
做什么：点击地图上的 NPC
看什么：右侧 PlayerDetails 面板
预期：正常显示该 NPC 的信息（不受新增组件影响）

做什么：鼠标拖拽平移地图
看什么：地图移动
预期：正常平移（不受 hover 事件影响）

做什么：滚轮缩放地图
看什么：缩放效果
预期：正常缩放

做什么：点击 "冻结" 按钮
看什么：NPC 停止移动
预期：冻结功能正常

做什么：再次点击 "取消冻结"
看什么：NPC 恢复移动
预期：解冻正常

做什么：F12 → Console → 检查无红色报错
看什么：Console 中无 Error 级别日志
预期：整个操作过程中无 JS 异常
```

---

### 7.5 回归检查清单

> 逐项打勾。全部通过才算 T22 完成。

```
回归检查清单（T22）
==================

□  1. 页面标题 "AI 小镇" — 浏览器标签页
□  2. 帮助弹窗 — 全中文，无英文单词
□  3. MusicButton — 显示 "音乐"，hover tooltip 中文
□  4. InteractButton — 显示 "互动"
□  5. FreezeButton — 显示 "冻结"
□  6. 控制台日志 — 全部中文，无英文 console.log
□  7. NPC 活动描述 — "正在看书"/"正在发呆"/"正在园艺"
□  8. NPC 对话消息 — 加入/离开提示中文
□  9. hover NPC → tooltip "{名} · 默认"
□ 10. mouseleave → tooltip 200ms 消失
□ 11. 选 2 个不同 NPC → "发起对话" → toast + 走向对方 + 开始对话
□ 12. 撮合已在对话中的 NPC → 旧对话结束 + 新对话创建
□ 13. 连续撮合 3 次 → 全部正常
□ 14. 点击 NPC → PlayerDetails 正常
□ 15. 地图平移/缩放 → 正常
□ 16. 冻结/解冻 → 正常
□ 17. TypeScript 编译 → npx tsc --noEmit 零错误
□ 18. Vite 编译 → 浏览器无白屏，无 JS 报错
□ 19. Convex 后端 → 世界状态 running
□ 20. 向后兼容 → 旧世界启动不报错
```

---

### 7.6 缺陷管理

所有测试中发现的问题记录在此：

| 编号 | 发现时间 | 严重级别 | 描述 | 复现步骤 | 状态 | 修复提交 |
|------|---------|---------|------|---------|------|---------|
| — | — | — | — | — | — | — |

**严重级别定义：**
- **P0 致命**：功能不可用、页面白屏、编译失败 → 必须立即修复，修复前不能提交
- **P1 严重**：核心功能有缺陷但可绕过 → 记录并修复
- **P2 一般**：UI 瑕疵、文案错误 → 记录，可延后修复
- **P3 建议**：体验优化建议 → 记录，不强制
