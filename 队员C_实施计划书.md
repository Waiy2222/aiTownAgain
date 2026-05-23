# 队员C · 实施计划书

> **角色**：队员C  
> **任务**：P4-011 全局数据仪表盘 + P4-012 NPC 详情面板增强  
> **启动条件**：**无依赖，即刻开工**  
> **代码库**：AI Town（React + Convex + PixiJS）  
> **日期**：2026-05-22  

---

## 一、任务概述

| 任务编号 | 任务名称 | 类型 | 涉及文件 |
|---------|---------|------|---------|
| P4-011 | 全局数据仪表盘 | 新增组件 | `src/components/Dashboard.tsx`（新增） |
| P4-012 | NPC 详情面板增强 | 修改+新增 | `src/components/PlayerDetails.tsx`（修改）<br>`src/components/ModelStatsTab.tsx`（新增） |

---

## 二、P4-011 全局数据仪表盘

### 2.1 文件：`src/components/Dashboard.tsx`（新增）

#### 2.1.1 功能说明

页面顶部横向折叠面板，实时汇总世界运行数据。使用 Convex `useQuery` 实时更新，数值变化时带过渡动画。

#### 2.1.2 数据源策略

由于队长 P4-006（世界状态监控 API）尚未完成，采用**分层数据获取策略**：

| 指标 | 当前数据源（P4-006 前） | 将来数据源（P4-006 后） |
|------|------------------------|------------------------|
| 活跃对话数 | `game.world.conversations.size` | `getWorldStats().activeConversations` |
| 总 NPC 数 | `game.world.players.size` | `getWorldStats().totalNPCs` |
| 在线 NPC 数 | 同总 NPC 数（纯观战模式） | `getWorldStats().onlineNPCs` |
| 各模型分布 | 暂显示 mock 占位 | `getWorldStats().modelDistribution` |
| 今日消息数 | 暂显示 mock 占位 | `getWorldStats().todayMessages` |
| 世界运行时长 | `engine.currentTime - lastViewed` | `getWorldStats().runtime` |

#### 2.1.3 组件接口定义

```typescript
// src/components/Dashboard.tsx

interface DashboardProps {
  worldId: Id<'worlds'>;
  game: ServerGame;
  engineTime?: number;  // engine.currentTime
  worldStatus?: { lastViewed: number };
}

// 折叠状态存储于 localStorage，key: 'dashboard-collapsed'
```

#### 2.1.4 内部函数清单

| 函数名 | 作用 | 实现要点 |
|--------|------|---------|
| `Dashboard` (default export) | 主组件 | 可折叠容器 + 横向 flex 布局 |
| `StatItem` | 单个指标项 | label + value + 过渡动画 |
| `AnimatedNumber` | 数字过渡动画 | requestAnimationFrame + 插值 |
| `useModelDistribution` | 模型分布计算 | 遍历 agentDescriptions 去重统计 |
| `formatRuntime` | 运行时长格式化 | ms → "X小时Y分" |
| `DashboardSkeleton` | 加载态骨架屏 | 灰色脉冲动画 |

#### 2.1.5 组件结构

```
┌─────────────────────────────────────────────────────────────┐
│  [折叠按钮]  📊 全局数据仪表盘                               │
├─────────────────────────────────────────────────────────────┤
│  💬 活跃对话 │ 👥 NPC总数 │ ✅ 在线 │ 🤖 模型分布 │ 📝 消息数 │ ⏱ 运行时长 │
│     3        │    8       │   8    │ Qwen:4/GPT:2 │  127     │  2h 15m    │
└─────────────────────────────────────────────────────────────┘
```

#### 2.1.6 过渡动画

使用 CSS `transition` + `@keyframes` 实现数值变化动画。当 `StatItem` 的 value prop 变化时，数字从旧值渐变到新值（仅整数指标）。

#### 2.1.7 调试检测点

| # | 检测点 | 预期行为 | 检测方法 |
|---|--------|---------|---------|
| D01 | Dashboard 初始渲染 | 顶部显示横向条形面板，所有指标显示默认值或加载态 | 页面加载后检查 DOM |
| D02 | 折叠/展开功能 | 点击折叠按钮，面板收起/展开；刷新后恢复上次状态 | 点击按钮 + 刷新页面 |
| D03 | 活跃对话数实时更新 | NPC 对话开始时，数字 +1；对话结束时，数字 -1 | 观察 NPC 自动对话 |
| D04 | NPC 总数正确 | 与 `game.world.players.size` 一致 | 对比控制台日志 |
| D05 | 运行时长持续增长 | 每秒更新时间，格式为 "X小时Y分" | 观察数值 10 秒 |
| D06 | 折叠状态持久化 | localStorage 中 `dashboard-collapsed` 键值正确 | 打开 DevTools Application 面板 |
| D07 | 无游戏数据时显示 | worldId 为 undefined 时显示骨架屏 | 断网或 mock 空数据 |
| D08 | 加载过渡动画 | 数值变化时有平滑过渡效果 | 观察 NPC 创建/销毁时数字变化 |

---

## 三、P4-012 NPC 详情面板增强

### 3.1 文件：`src/components/PlayerDetails.tsx`（修改）

#### 3.1.1 修改内容

| 修改项 | 说明 | 操作 |
|--------|------|------|
| 移除 humanPlayer 相关逻辑 | 删除 `humanTokenIdentifier`、`humanPlayer`、`isMe` 等全部人类交互 | 删除代码 |
| 移除互动按钮 | 删除 `startConversation`、`acceptInvite`、`rejectInvite`、`leaveConversation` | 删除代码 |
| 移除 `onStartConversation` 等 handler | 删除 4 个 async handler 函数 | 删除代码 |
| 引入标签页切换 | 两个标签页："对话记录" + "模型统计" | 新增代码 |
| 引入 `ModelStatsTab` 组件 | 在"模型统计"标签页渲染 | import + 渲染 |
| JSON 序列化移除 | 删除 `pendingSuffix` 相关遗留代码 | 清理代码 |
| 占位文本更新 | 无选中时改为"点击地图上的智能体查看详情" | 保留原中文 |
| 面板标题增强 | 角色名 + 模型颜色标签（从 P4-006 获取模型名） | 新增渲染 |
| 传入 agentStats | 将 agentId 传递给 ModelStatsTab | 新增 props |

#### 3.1.2 组件接口（修改后）

```typescript
// src/components/PlayerDetails.tsx

interface PlayerDetailsProps {
  worldId: Id<'worlds'>;
  engineId: Id<'engines'>;
  game: ServerGame;
  playerId?: GameId<'players'>;
  setSelectedElement: SelectElement;
  scrollViewRef: React.RefObject<HTMLDivElement>;
}
```

#### 3.1.3 内部状态

```typescript
const [activeTab, setActiveTab] = useState<'chat' | 'stats'>('chat');
```

#### 3.1.4 渲染流程（修改后）

```
PlayerDetails
  ├── 未选中玩家 → 占位文本
  └── 已选中玩家 →
      ├── 标题栏：角色名 + 模型颜色标签 + 关闭按钮
      ├── 活动描述（如有）
      ├── 角色描述文本
      ├── 标签页切换栏：[对话记录] [模型统计]
      ├── activeTab === 'chat' →
      │   ├── 当前对话 → Messages 组件
      │   └── 无当前对话但有历史 → Messages（archived）
      └── activeTab === 'stats' → ModelStatsTab 组件
```

#### 3.1.5 调试检测点

| # | 检测点 | 预期行为 | 检测方法 |
|---|--------|---------|---------|
| D09 | 无玩家选中提示 | 显示"点击地图上的智能体以查看聊天历史" | 页面初始化后查看右侧面板 |
| D10 | 点击 NPC → 面板内容 | 右侧面板显示该 NPC 的名称、描述 | 点击任意 NPC 精灵 |
| D11 | 无人类交互按钮 | 面板无"开始对话""接受""拒绝""离开"按钮 | 选择 NPC 后检查 DOM |
| D12 | 标签页切换 | 点击"对话记录"显示对话；点击"模型统计"显示统计 | 切换标签页 |
| D13 | 对话记录标签页 | 当前对话或历史对话内容正常渲染 | NPC 对话中查看 |
| D14 | 无对话时占位文本 | "模型统计"标签页显示"暂无统计数据" | 查看新创建 NPC |
| D15 | 关闭面板 | 点击 × 按钮清空选择 | 点击 × 后确认面板归位 |
| D16 | NPC 活动描述 | 行走/做活动时面板显示对应描述 | 观察 NPC 行为 |

### 3.2 文件：`src/components/ModelStatsTab.tsx`（新增）

#### 3.2.1 功能说明

NPC 详情面板中"模型统计"标签页内容。展示 NPC 所用模型、Token 消耗、API 调用次数、平均延迟、话题摘要。

#### 3.2.2 数据源策略

| 指标 | 当前（P4-006 前） | 将来（P4-006 后） |
|------|-------------------|-------------------|
| 模型名 | 从 `agentDescriptions` + `agent` 对象获取 | `getAgentStats().modelName` |
| Token 消耗 | 显示"等待监控 API…"占位 | `getAgentStats().tokenUsage` |
| API 调用次数 | 显示"等待监控 API…"占位 | `getAgentStats().apiCalls` |
| 平均延迟 | 显示"等待监控 API…"占位 | `getAgentStats().avgLatency` |
| 话题摘要 | 显示"等待监控 API…"占位 | `getAgentStats().topics` |

> 模型名可以从现有数据中推导：通过 `agentDescriptions` 表可以获取 Agent 关联；将来 P4-009/P4-010 会增加 `modelName` 字段到 Agent 对象，届时可从 `game.world.agents` 获取。

#### 3.2.3 组件接口

```typescript
// src/components/ModelStatsTab.tsx

interface ModelStatsTabProps {
  worldId: Id<'worlds'>;
  agentId?: GameId<'agents'>;  // 可选，可能无 agent 关联
  playerId: GameId<'players'>;
  game: ServerGame;
}
```

#### 3.2.4 内部函数清单

| 函数名 | 作用 |
|--------|------|
| `ModelStatsTab` (default export) | 主组件，根据 agentId 有无渲染不同内容 |
| `StatRow` | 单行统计项（label + value） |

#### 3.2.5 组件结构（无数据占位态）

```
┌──────────────────────────────┐
│  🤖 模型统计                  │
├──────────────────────────────┤
│  模型名称    │  Qwen3.5-Flash │  ← 从 agent 数据获取
│  Token 消耗  │  等待监控 API…  │  ← 占位，待 P4-006
│  API 调用    │  等待监控 API…  │  ← 占位，待 P4-006
│  平均延迟    │  等待监控 API…  │  ← 占位，待 P4-006
│  话题摘要    │  等待监控 API…  │  ← 占位，待 P4-006
└──────────────────────────────┘
```

#### 3.2.6 调试检测点

| # | 检测点 | 预期行为 | 检测方法 |
|---|--------|---------|---------|
| D17 | 模型名显示 | 正确显示 NPC 使用的模型名称 | 选择任意 NPC → 统计标签页 |
| D18 | 占位文本 | Token 等未实现指标显示"等待监控 API…" | 查看统计标签页 |
| D19 | 无 agent 关联 | 显示"该 NPC 暂无统计数据" | 选择非 agent 玩家（如有） |
| D20 | 异常 agentId | agentId 未定义时不报错，显示占位文本 | 模拟空数据 |

---

## 四、修改文件详细分析

### 4.1 `src/components/PlayerDetails.tsx` 删除内容清单

删除以下全部代码：

1. **import 依赖删除**：
   - `closeImg`（从 assets 导入）→ **保留**（关闭按钮仍需）
   - `toastOnError` → **删除**
   - `useSendInput` → **删除**
   - `Player`（从 convex/aiTown/player）→ **删除**
   - `ServerGame` 相关 → **保留**

2. **变量删除**：
   - `humanTokenIdentifier` 及其 useQuery 调用 → **删除**
   - `humanPlayer` 推导逻辑 → **删除**
   - `humanConversation` 推导逻辑 → **删除**
   - `isMe` 变量 → **删除**
   - `canInvite` 变量 → **删除**
   - `sameConversation` 变量 → **删除**
   - `humanStatus` 变量 → **删除**
   - `playerStatus` 变量 → **删除**
   - `haveInvite` 变量 → **删除**
   - `waitingForAccept` 变量 → **删除**
   - `waitingForNearby` 变量 → **删除**
   - `inConversationWithMe` 变量 → **删除**
   - `pendingSuffix` 函数 → **删除**

3. **Handler 函数删除**：
   - `onStartConversation` → **删除**
   - `onAcceptInvite` → **删除**
   - `onRejectInvite` → **删除**
   - `onLeaveConversation` → **删除**

4. **JSX 渲染删除**：
   - 所有 `canInvite` 条件按钮 → **删除**
   - 所有 `waitingForAccept` 条件 → **删除**
   - 所有 `waitingForNearby` 条件 → **删除**
   - 所有 `inConversationWithMe` 条件 → **删除**
   - 所有 `haveInvite` 条件按钮 → **删除**
   - Messages 中 `inConversationWithMe` 参数 → **保留但传 false**

5. **Messages 组件传参调整**：
   - `inConversationWithMe` → 固定传 `false`
   - `humanPlayer` → 删除此参数（需同步修改 Messages 组件）

### 4.2 Messages 组件连带修改

`src/components/Messages.tsx` 中：
- `humanPlayer` prop → 改为可选（`undefined` 表示纯观战模式）
- `MessageInput` 组件渲染条件 → **删除**（人类不再发消息）
- `humanPlayerId` 判断 → 可选链处理
- `bubble-mine` CSS 类 → **删除**（无我的消息）

### 4.3 `src/components/Game.tsx` 修改

- `PlayerDetails` 调用中删除不必要的 props（如 `setSelectedElement` 保留，其余按新接口）

---

## 五、测试方案

### 5.1 测试环境

| 项目 | 配置 |
|------|------|
| 浏览器 | Chrome/Firefox 最新版 |
| 分辨率 | 1920×1080（桌面）、430×932（移动端） |
| 后端 | Convex dev 本地运行 |
| 前端 | Vite dev server |

### 5.2 测试流程

#### Phase 1：Dashboard 测试

| 步骤 | 操作 | 预期结果 |
|------|------|---------|
| 1.1 | 启动应用，等待世界初始化 | Dashboard 出现在页面顶部，显示 6 个指标 |
| 1.2 | 点击折叠按钮 | 面板折叠为仅标题行；再次点击展开 |
| 1.3 | 刷新页面 | Dashboard 保持上次折叠/展开状态 |
| 1.4 | 等待 NPC 自动对话 | 活跃对话数从 0 → 1 |
| 1.5 | 观察运行时长 | 每 60 秒增加 1 分钟 |
| 1.6 | 观察 NPC 总数 | 与地图上可见 NPC 数量一致 |

#### Phase 2：PlayerDetails 测试

| 步骤 | 操作 | 预期结果 |
|------|------|---------|
| 2.1 | 点击任意 NPC | 右侧面板显示 NPC 名称和描述，无互动按钮 |
| 2.2 | 点击"模型统计"标签页 | 显示模型名和占位统计文本 |
| 2.3 | 点击"对话记录"标签页 | 如有当前对话，显示消息列表 |
| 2.4 | 点击 × 关闭面板 | 面板回到占位状态 |
| 2.5 | 点击另一个 NPC | 面板切换为新 NPC 信息 |

#### Phase 3：回归测试

| 步骤 | 操作 | 预期结果 |
|------|------|---------|
| 3.1 | 点击地图空白处 | 无报错，无异常行为 |
| 3.2 | 缩放/拖动地图 | 一切正常 |
| 3.3 | NPC 自动对话 | 对话正常，消息正常渲染 |
| 3.4 | 刷新页面 | 所有状态恢复，无报错 |

### 5.3 预期测试结果

| 测试项 | 预期结果 | 优先级 |
|--------|---------|-------|
| Dashboard 正常渲染 6 项指标 | ✅ 通过 | P0 |
| Dashboard 折叠/展开 | ✅ 通过 | P0 |
| Dashboard 折叠状态持久化 | ✅ 通过 | P1 |
| 活跃对话数实时更新 | ✅ 通过 | P0 |
| 运行时长持续增长 | ✅ 通过 | P1 |
| PlayerDetails 无人类交互按钮 | ✅ 通过 | P0 |
| 标签页切换正常 | ✅ 通过 | P0 |
| 模型名正确显示 | ✅ 通过 | P1 |
| 占位数据显示"等待监控 API…" | ✅ 通过 | P1 |
| 关闭面板正常 | ✅ 通过 | P0 |
| 切换 NPC 正常 | ✅ 通过 | P0 |
| 无 JS 报错 | ✅ 通过 | P0 |
| NPC 对话不受影响 | ✅ 通过 | P0 |

---

## 六、风险与缓解

| 风险 | 概率 | 缓解方案 |
|------|------|---------|
| P4-006 未完成导致统计项无数据 | 高 | 当前用 mock 数据 + 占位文本；P4-006 完成后替换为真实 query |
| agentId 与 playerId 映射关系复杂 | 中 | 通过 `game.world.agents` 遍历找到 `agent.playerId === playerId` |
| PlayerDetails 重构引发回归问题 | 中 | 逐步删除，每删一部分即测试一次 |
| Dashboard 布局与三栏冲突 | 中 | Dashboard 在 Game.tsx 外部渲染，不干扰 game-frame 布局 |

---

## 七、文件修改清单

### 新增文件

| # | 文件路径 | 行数估计 | 说明 |
|---|---------|---------|------|
| 1 | `src/components/Dashboard.tsx` | ~180 行 | 全局数据仪表盘 |
| 2 | `src/components/ModelStatsTab.tsx` | ~120 行 | 模型统计标签页 |

### 修改文件

| # | 文件路径 | 修改量 | 说明 |
|---|---------|--------|------|
| 3 | `src/components/PlayerDetails.tsx` | 大幅修改（~180→80 行） | 删除人类交互，引入标签页 |
| 4 | `src/components/Game.tsx` | 小改 | 更新 PlayerDetails 调用接口 |
| 5 | `src/components/Messages.tsx` | 中改 | humanPlayer 改为可选，删除 MessageInput |
| 6 | `src/App.tsx` | 可能需要小改 | 添加 Dashboard 渲染 |

---

## 八、总文件目录

```
E:/ai town/aiTownAgain/
├── .dockerignore
├── .eslintignore
├── .eslintrc.js
├── .gitignore
├── .prettierrc
├── .vercelignore
├── .vscode/
├── ARCHITECTURE.md                    # 架构文档
├── CHANGES.md
├── Dockerfile
├── LICENSE
├── PROJECT_PLAN.md                    # 项目计划书
├── README.md
├── assets/
├── convex/
│   ├── _generated/
│   │   ├── api.d.ts
│   │   ├── dataModel.d.ts
│   │   └── server.d.ts
│   ├── agent/
│   │   ├── conversation.ts            # LLM 对话 prompt 构建
│   │   ├── embeddingsCache.ts
│   │   ├── memory.ts
│   │   └── schema.ts
│   ├── aiTown/
│   │   ├── agent.ts                   # Agent 类 + tick 逻辑
│   │   ├── agentDescription.ts
│   │   ├── agentInputs.ts             # Agent 输入处理
│   │   ├── agentOperations.ts         # Agent 异步操作
│   │   ├── conversation.ts            # Conversation 类 + 输入
│   │   ├── conversationMembership.ts
│   │   ├── game.ts                    # Game 类（核心游戏逻辑）
│   │   ├── ids.ts                     # GameId 类型系统
│   │   ├── inputHandler.ts
│   │   ├── inputs.ts                  # 输入路由
│   │   ├── insertInput.ts
│   │   ├── location.ts
│   │   ├── main.ts                    # Engine 运行循环
│   │   ├── movement.ts
│   │   ├── player.ts                  # Player 类 + 输入
│   │   ├── playerDescription.ts
│   │   ├── schema.ts                  # AI Town 数据表
│   │   ├── world.ts
│   │   └── worldMap.ts
│   ├── constants.ts                   # 游戏常量
│   ├── crons.ts
│   ├── engine/
│   │   ├── abstractGame.ts            # 抽象游戏引擎
│   │   ├── historicalObject.ts
│   │   ├── schema.ts
│   │   └── ...
│   ├── http.ts
│   ├── init.ts                        # 世界初始化
│   ├── messages.ts                    # 消息相关 query/mutation
│   ├── music.ts
│   ├── schema.ts                      # 总 schema
│   ├── testing.ts
│   ├── util/
│   │   ├── llm.ts                     # LLM 调用封装（1630+ 行）
│   │   └── ...
│   └── world.ts                       # 世界相关 query/mutation
├── data/
│   ├── characters.ts                  # 8 个角色定义
│   ├── gentle.js                      # 地图数据
│   ├── animations/
│   └── spritesheets/
├── index.html
├── jest.config.ts
├── package-lock.json
├── package.json
├── postcss.config.js
├── public/
├── src/
│   ├── App.tsx                        # 主应用入口
│   ├── components/
│   │   ├── Character.tsx
│   │   ├── ConvexClientProvider.tsx
│   │   ├── **Dashboard.tsx**          # ⭐ 新增：全局数据仪表盘
│   │   ├── DebugPath.tsx
│   │   ├── DebugTimeManager.tsx
│   │   ├── FreezeButton.tsx
│   │   ├── Game.tsx                   # 游戏主容器
│   │   ├── MessageInput.tsx
│   │   ├── Messages.tsx
│   │   ├── **ModelStatsTab.tsx**      # ⭐ 新增：模型统计标签页
│   │   ├── PixiGame.tsx
│   │   ├── PixiStaticMap.tsx
│   │   ├── PixiViewport.tsx
│   │   ├── Player.tsx                 # Pixi 层玩家精灵
│   │   ├── PlayerDetails.tsx          # 🔧 修改：NPC 详情面板
│   │   ├── PositionIndicator.tsx
│   │   ├── PoweredByConvex.tsx
│   │   └── buttons/
│   ├── hooks/
│   │   ├── sendInput.ts
│   │   ├── serverGame.ts
│   │   ├── useHistoricalTime.ts
│   │   ├── useHistoricalValue.ts
│   │   └── useWorldHeartbeat.ts
│   ├── index.css
│   ├── main.tsx
│   ├── toasts.ts
│   └── vite-env.d.ts
├── tailwind.config.js
├── tsconfig.json
├── vercel.json
└── vite.config.ts
```
