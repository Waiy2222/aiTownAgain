# AI Town 测试日志

> 项目：AI Town 重构 · 第一次工程落地
> 测试负责人：队长
> 开始日期：2026-05-21
> 最后更新：2026-05-23

---

## 测试环境

| 项目 | 值 |
|------|-----|
| 操作系统 | Windows 11 Home China 10.0.26200 |
| Node.js | v22.x |
| 包管理器 | npm |
| TypeScript | 5.1 |
| Jest | 29 + ts-jest |
| Convex | ^1.19.2 |
| LLM | 阿里云 Dashscope (OpenAI 兼容模式) |

---

## 一、2026-05-23 全量测试结果

### 1.1 TypeScript 编译检查

```
npx tsc --noEmit
```

**结果**：✅ 零类型错误

### 1.2 Jest 单元测试

```
npx jest --verbose
```

**结果**：✅ 9 suites / 89 tests 全部通过

| # | 测试文件 | 测试数 | 所属 | 状态 |
|---|---------|--------|------|------|
| 1 | `convex/util/compression.test.ts` | 3 | 原始项目 | ✅ |
| 2 | `convex/util/geometry.test.ts` | 33 | 原始项目 | ✅ |
| 3 | `convex/util/types.test.ts` | 3 | 原始项目 | ✅ |
| 4 | `convex/util/minheap.test.ts` | 6 | 原始项目 | ✅ |
| 5 | `convex/util/asyncMap.test.ts` | 2 | 原始项目 | ✅ |
| 6 | `convex/engine/historicalObject.test.ts` | 1 | 原始项目 | ✅ |
| 7 | `convex/util/models.test.ts` | 10 | 队员B (P4-009) | ✅ |
| 8 | `convex/util/validation.test.ts` | 9 | 队员B (P4-009) | ✅ |
| 9 | `src/components/ModelNPCManager.test.ts` | 22 | 队员B (P4-010) | ✅ |

### 1.3 Jest 配置修复

**问题**：`ts-jest/presets/default-esm` 导致 6 个原始项目的测试报 "Cannot use import statement outside a module"。

**修复**：
- `jest.config.ts`：`preset` 从 `ts-jest/presets/default-esm` → `ts-jest`，添加 `transform` 配置输出 CommonJS
- `package.json`：移除 `cross-env NODE_OPTIONS=--experimental-vm-modules`
- 新增 `src/__mocks__/fileMock.js` 用于静态资源 mock

### 1.4 分支合并验证

| 分支 | 负责人 | 任务 | 合并状态 |
|------|--------|------|----------|
| `chaoxiong666/main` | 队员D | P4-013 撮合+Tooltip+中文化 | ✅ PR #1 |
| `feature/ai-town-refactor` | 队长 | P4-001~006 | ✅ PR #2 |
| `memberA` | 队员A | P4-007~008 布局+场景 | ✅ PR #4 |
| `memberc` | 队员C | P4-011~012 仪表盘+NPC详情 | ✅ 手动合并 (3 冲突已解决) |
| `member-B` | 队员B | P4-009~010 多模型+NPC管理 | ✅ 手动合并 (零冲突) |

---

## 二、合并冲突记录

### 2026-05-23 合并 memberc 冲突

| 文件 | 冲突原因 | 解决策略 |
|------|---------|---------|
| `Game.tsx` | HEAD 加了 tooltip，memberc 加了 Dashboard | 保留 tooltip + 合并 Dashboard |
| `Messages.tsx` | memberc 新增 `inConversationWithMe` prop | 保留 prop + "对话进行中" UI |
| `PlayerDetails.tsx` | memberc 重写为标签页布局 | 采用 memberc 标签页，移除错误的 `engineId` 传参 |

---

## 三、文件变更统计

合并后 main 分支相对于原始 e605597 的变更：

```
42 files changed, 2805 insertions(+), 545 deletions(-)
```

新增组件：`Dashboard`, `SimControl`, `ForceConversation`, `NPCModelTooltip`, `SceneSelector`, `Sidebar`, `TopBar`, `ModelNPCManager`, `ModelStatsTab`

新增后端：`conversationLogs`, `worldStats`, `promptTemplates`, `models`, `validation`, `sceneInputs`

删除：`InteractButton.tsx`

---

## 四、待执行项目

以下测试需要启动 Convex 后端 + Vite 前端才能执行：

- Convex 后端启动（`npx convex dev`）
- 前端 Vite 启动（`npm run dev:frontend`）
- 全栈联调
- 各功能模块的浏览器验证（场景切换、多模型 NPC 生成、仪表盘实时数据等）
- P4-014 集成联调的 14 个测试场景

---

## 附录：Bug 修复记录

| 编号 | 日期 | 描述 | 严重程度 | 状态 |
|------|------|------|---------|------|
| BUG-001 | 05-21 | App.tsx Unicode 弯引号导致 TS 编译失败 | 中 | ✅ |
| BUG-002 | 05-21 | player.ts Player.join 参数数量不匹配 | 高 | ✅ |
| BUG-003 | 05-21 | world.ts DEFAULT_NAME 未 import | 高 | ✅ |
| BUG-004 | 05-21 | .eslintrc.js ESM/CJS 兼容性 | 低 | ✅ |
| BUG-005 | 05-21 | Jest NODE_OPTIONS Windows 不兼容 | 中 | ✅ |
| BUG-006 | 05-23 | Jest ESM preset 导致 6 个测试文件解析失败 | 中 | ✅ |
| BUG-007 | 05-23 | memberc PlayerDetails 传 engineId 给 Messages（prop 不存在） | 低 | ✅ |
