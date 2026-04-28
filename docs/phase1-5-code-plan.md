# Phase 1.5 代码改动规划书

> **分支**: `phase1-5/atom-factor-overhaul`  
> **基于**: `main` (Phase 1 完成)  
> **日期**: 2026-04-28  
> **关联设计**: `Phase1_大改方案_因子系统与性状稳定工程.md`

---

## 改动总览

| 类别 | 新建 | 修改 | 不变 |
|------|------|------|------|
| Server (NestJS) | 19 | 20 | 6 |
| AI Gateway (Python) | 1 | 2 | 5 |
| Web (React) | 8 | 10 | 5 |
| Config/YAML | 8 | 0 | 0 |
| **合计** | **36** | **32** | **16** |

---

## Part 1 — 因子系统基础设施

### 目标
建立 YAML 因子库 + 加载器 + 验证器，重构 `FusionService.mergeAtoms()` 为概率继承算法。

---

### 📁 新建文件

| # | 文件路径 | 作用 |
|---|---------|------|
| 1 | `server/config/atoms/ATOM_SPEC.md` | 因子工程操作手册：如何添加新因子、新分类、验证规则 |
| 2 | `server/config/atoms/categories.yaml` | 9 个因子分类定义（petal_shape/color/texture/leaf/stem/stamen/fragrance/size/special） |
| 3 | `server/config/atoms/standard.yaml` | 普通因子 (N, 积分 1)，约 28 个 |
| 4 | `server/config/atoms/rare.yaml` | 稀有因子 (R, 积分 5)，约 6 个 |
| 5 | `server/config/atoms/precious.yaml` | 珍贵因子 (SR, 积分 10)，约 5 个 |
| 6 | `server/config/atoms/epic.yaml` | 史诗因子 (SSR, 积分 20)，约 4 个 |
| 7 | `server/config/atoms/legendary.yaml` | 传奇因子 (UR, 积分 50)，约 5 个 |
| 8 | `server/config/atoms/fusion_rules.yaml` | 矛盾融合规则（初始 5 条） |
| 9 | `server/config/atoms/adjective_pools.yaml` | 稀有形容词抽取池（R/SR/SSR/UR 各 3-4 个） |
| 10 | `server/src/modules/atom/atom.module.ts` | Atom 模块注册 |
| 11 | `server/src/modules/atom/atom-loader.service.ts` | 核心：YAML 加载 + 验证 + 内存索引（byId/byCategory/byLevel） |
| 12 | `server/src/modules/atom/atom.types.ts` | 类型定义：AtomDef, CategoryDef, FusionRule, AdjectivePool |
| 13 | `server/src/modules/atom/atom-inheritance.service.ts` | 概率继承算法（50% per atom）、多倍体处理 |
| 14 | `server/src/modules/atom/atom-fusion-rule.service.ts` | 融合规则引擎：按优先级匹配条件 → 替换原子 → 产生新因子 |
| 15 | `server/src/modules/atom/atom-score.service.ts` | 积分计算 + 积分→稀有度概率映射 |

### 📝 修改文件

| # | 文件路径 | 改动内容 |
|---|---------|---------|
| 16 | `server/prisma/schema.prisma` | Flower: 新增 `location`, `sellPrice`, `isFoundation`, `stabilityProgress`, `stabilityTargetId`, `foundationName`, `growthImageSeed`, `growthImageUrl`, `factorScore`；Seed: 新增 `growthImages`, `isFoundationSeed`, `foundationFlowerId`, `sellerId`, `customPrice`, `revenueShare`, `seedType`, `parentFlowerId`, `totalSold`；User: 新增 `title`；新增枚举 `FlowerLocation` |
| 17 | `server/prisma/seed.ts` | atomLibrary 改为结构化 `[{ atomId, guaranteed }]`；每种种子分配 5-7 个保证因子 |
| 18 | `server/src/app.module.ts` | 导入 `AtomModule` |
| 19 | `server/src/common/enums/index.ts` | 新增 `FlowerLocation` 枚举；新增 `RARITY_PROBABILITY_TABLE`（9 挡位概率表）；`HARVEST_REWARDS` 移除以 gold（改为仓库制）；新增 `HARVEST_XP_REWARDS`；新增 `RARITY_SELL_MULTIPLIER`；新增 `FACTOR_SCORE_TIERS` |
| 20 | `server/src/modules/fusion/fusion.service.ts` | `mergeAtoms()` → 调用 `AtomInheritanceService` + `AtomFusionRuleService`；`rollRarity()` → 接受 `factorScore` 参数查表；移除旧的 `RARITY_SYSTEM_ATOMS` 硬编码 |
| 21 | `server/src/modules/fusion/fusion.module.ts` | 导入 `AtomModule` |
| 22 | `server/src/modules/fusion/dto/fusion-request.dto.ts` | 新增可选字段 `stabilityTargetId?: string` |
| 23 | `server/src/modules/fusion/dto/fusion-response.dto.ts` | 返回增加 `factorScore`, `inheritedAtoms`, `fusedAtoms`, `stabilityResult?` |

---

## Part 2 — 收获系统 → 仓库制

### 目标
收获花朵入库而非直接销毁，玩家选择出售或保留育种。出售价格 = 稀有度乘区 × 亲本价值。

---

### 📁 新建文件

| # | 文件路径 | 作用 |
|---|---------|------|
| 24 | `server/src/modules/warehouse/warehouse.module.ts` | 仓库模块注册 |
| 25 | `server/src/modules/warehouse/warehouse.service.ts` | 核心：列表查询/出售（计算 price + 写 TransactionLog）/保留标记/指定母株 |
| 26 | `server/src/modules/warehouse/warehouse.controller.ts` | `GET /api/warehouse`, `POST /api/warehouse/sell`, `POST /api/warehouse/keep`, `POST /api/warehouse/designate-stability` |
| 27 | `server/src/modules/warehouse/dto/sell-flower.dto.ts` | `{ flowerId: string }` |
| 28 | `server/src/modules/warehouse/dto/warehouse-flower.dto.ts` | 仓库花朵的响应 DTO（含 sellPrice、rarity、atoms 摘要） |

### 📝 修改文件

| # | 文件路径 | 改动内容 |
|---|---------|---------|
| 29 | `server/src/app.module.ts` | 导入 `WarehouseModule` |
| 30 | `server/src/modules/garden/garden.service.ts` | `harvest()` 重写：发 XP → 必掉种子（Seed.create）→ Flower.location 改为 WAREHOUSE → 释放槽位。不再发金币 |
| 31 | `server/src/modules/garden/garden.controller.ts` | `POST /api/garden/harvest` 响应结构变更（无 gold 字段） |
| 32 | `server/src/modules/garden/garden.module.ts` | 导入 `WarehouseModule`（如有依赖）或保持独立 |

---

## Part 3 — 性状稳定工程

### 目标
母株指定 → 嫁接判定（稀有度一致 + 基因差≤3）→ 累计 10 次 → 奠基种认证 → 称号 + 无限种子 + 商店上架。

---

### 📁 新建文件

| # | 文件路径 | 作用 |
|---|---------|------|
| 33 | `server/src/modules/foundation/foundation.module.ts` | 模块注册 |
| 34 | `server/src/modules/foundation/foundation.service.ts` | 核心：母株指定(designate)、融合后判定(similarity check)、进度追踪、奠基种认证(certify) |
| 35 | `server/src/modules/foundation/foundation.controller.ts` | `POST /api/foundation/designate`, `GET /api/foundation/status`, `POST /api/foundation/claim-seed`, `POST /api/foundation/list-shop`, `POST /api/foundation/unlist-shop`, `GET /api/foundation/revenue` |
| 36 | `server/src/modules/foundation/dto/designate.dto.ts` | `{ flowerId: string }` |
| 37 | `server/src/modules/foundation/dto/foundation-status.dto.ts` | 响应 DTO |
| 38 | `server/src/modules/foundation/dto/list-shop.dto.ts` | `{ flowerId, price }` |

### 📝 修改文件

| # | 文件路径 | 改动内容 |
|---|---------|---------|
| 39 | `server/src/app.module.ts` | 导入 `FoundationModule` |
| 40 | `server/src/modules/fusion/fusion.service.ts` | 融合成功后 → 如果请求带了 `stabilityTargetId`，调用 `FoundationService.checkSimilarity()` → 相似则 `stabilityProgress += 1` |
| 41 | `server/src/modules/user/user.service.ts` | 新增 `setTitle(userId, title)` 方法 |
| 42 | `server/src/modules/user/dto/user-profile.dto.ts` | 新增 `title` 字段 |

---

## Part 4 — 图片系统升级

### 目标
基础花有 5 阶段形态图；融合花生长期显示父本图，BLOOMING 才切 SD 图。

---

### 📝 修改文件

| # | 文件路径 | 改动内容 |
|---|---------|---------|
| 43 | `server/prisma/schema.prisma` | Seed.growthImages (上面已包含)；Flower.growthImageSeed / growthImageUrl (上面已包含) |
| 44 | `ai-gateway/routers/generate.py` | 新增 `POST /generate-growth-set` 端点：循环生成 4 张阶段图 |
| 45 | `ai-gateway/services/prompt_builder.py` | 重写 `build_prompt()`：接受结构化 atoms 列表 → 按分类顺序拼接 |
| 46 | `server/src/modules/ai-gateway/ai-gateway.service.ts` | 新增 `generateGrowthSet()` 方法 |
| 47 | `server/src/modules/fusion/fusion.service.ts` | 融合花创建时：设置 `growthImageSeed = parentA对应的种子名`（用于按阶段取父本图） |
| 48 | `server/prisma/seed.ts` | 种子初始化时调用 AI Gateway 预生成 5 阶段图（无 SD 则用占位图） |

### 前端改动（Part 4）

| # | 文件路径 | 改动内容 |
|---|---------|---------|
| 49 | `web/src/components/garden/GardenPanel.tsx` | 花朵卡片：根据 stage 显示对应阶段图片（Flower.growthImageUrl for BLOOMING, 否则根据 growthImageSeed 取 Seed.growthImages） |
| 50 | `web/src/game/phaser/objects/PlaceholderFlower.ts` | 花盆中显示的花朵 sprite 改为按阶段切换纹理 |
| 51 | `web/src/game/phaser/scenes/GardenScene.ts` | 新增生长进度条渲染（progress bar on each pot） |

---

## Part 5 — 商店重写

### 目标
双 Tab 商店（系统种子 + 玩家奠基种），支持稀有度排序。

---

### 📝 修改文件

| # | 文件路径 | 改动内容 |
|---|---------|---------|
| 52 | `server/src/modules/shop/shop.service.ts` | `getSeeds()` 拆分为 `getSystemSeeds()` + `getPlayerSeeds()`；`buySeed()` 支持购买玩家种子（自动计算分成、更新 totalSold） |
| 53 | `server/src/modules/shop/shop.controller.ts` | `GET /api/shop/seeds` 响应结构变更为 `{ system, player }`；新增 `GET /api/shop/seeds?tab=system|player&sort=newest|sales|rarity` 查询参数 |
| 54 | `server/src/modules/shop/dto/buy-seed.dto.ts` | 新增可选 `isPlayerSeed?: boolean` 标记 |

### 📁 新建文件（cron）

| # | 文件路径 | 作用 |
|---|---------|------|
| 55 | `server/src/modules/shop/shop-settlement.service.ts` | 每日结算 cron：统计销量 → 80% 分成 → 更新 User.gold + TransactionLog |

### 前端改动（Part 5）

| # | 文件路径 | 改动内容 |
|---|---------|---------|
| 56 | `web/src/components/shop/ShopPanel.tsx` | 双 Tab 切换（系统商店 / 玩家商店）；玩家 Tab 增加排序下拉（最新/销量/稀有度）；种子卡片新增盛放预览图 |
| 57 | `web/src/api/shop.api.ts` | 新增 `getPlayerSeeds()`, `buyPlayerSeed()` |
| 58 | `web/src/types/index.ts` | 新增 `PlayerSeed`, `ShopTab`, `ShopSort` 类型 |

---

## Part 6 — 调试模块

### 目标
测试性状稳定工程全流程。`DEBUG_MODE=true` 时加载。

---

### 📁 新建文件

| # | 文件路径 | 作用 |
|---|---------|------|
| 59 | `server/src/modules/debug/debug.module.ts` | 调试模块，仅 DEBUG_MODE 时注册 |
| 60 | `server/src/modules/debug/debug.controller.ts` | 调试 API 端点 |
| 61 | `server/src/modules/debug/debug.service.ts` | 调试逻辑：spawn 花、设置稀有度/阶段、加速稳定化、模拟全流程 |

### 📝 修改文件

| # | 文件路径 | 改动内容 |
|---|---------|---------|
| 62 | `server/src/app.module.ts` | 条件导入 `DebugModule`（`process.env.DEBUG_MODE === 'true'`） |
| 63 | `server/.env` (或 `.env.example`) | 新增 `DEBUG_MODE=true`, `DEBUG_USER_IDS=` |

---

## Part 7 — 前端新面板

### 目标
仓库面板 + 性状稳定面板 + 融合结果基因展示增强。

---

### 📁 新建文件

| # | 文件路径 | 作用 |
|---|---------|------|
| 64 | `web/src/components/warehouse/WarehousePanel.tsx` | 仓库花朵列表 + 出售/保留/指定母株按钮 |
| 65 | `web/src/components/foundation/FoundationPanel.tsx` | 母株列表 + 进度条 + 奠基种认证状态 + 领取种子/上架按钮 |
| 66 | `web/src/api/warehouse.api.ts` | 仓库 API 封装 |
| 67 | `web/src/api/foundation.api.ts` | 性状稳定 API 封装 |
| 68 | `web/src/stores/warehouse.store.ts` | 仓库 Zustand store |
| 69 | `web/src/stores/foundation.store.ts` | 性状稳定 Zustand store |

### 📝 修改文件

| # | 文件路径 | 改动内容 |
|---|---------|---------|
| 70 | `web/src/App.tsx` | 新增仓库/性状稳定面板入口（浮动按钮或工具栏） |
| 71 | `web/src/App.css` | 新增面板样式 |
| 72 | `web/src/components/common/Toolbar.tsx` | 新增仓库按钮（🏚️）和育种按钮（🧬） |
| 73 | `web/src/components/fusion/FusionResultModal.tsx` | 增强：显示基因继承详情（哪些因子继承成功/失败、融合产生了什么、总积分） |
| 74 | `web/src/types/index.ts` | 新增 `WarehouseFlower`, `FoundationStatus`, `StabilityProgress` 等类型 |

---

## 不变文件清单

以下文件**本次不改**：

| 文件 | 原因 |
|------|------|
| `server/src/config/prisma/*` | Prisma 服务不变 |
| `server/src/config/redis/*` | Redis 不变 |
| `server/src/config/minio/*` | MinIO 不变 |
| `server/src/common/guards/jwt.guard.ts` | JWT 鉴权不变 |
| `server/src/modules/user/auth/*` | 认证模块不变 |
| `ai-gateway/core/config.py` | 配置不变 |
| `ai-gateway/services/placeholder.py` | 占位图生成（可能需要适配新 prompt 格式，但不影响核心逻辑） |
| `ai-gateway/services/minio_uploader.py` | 不变 |
| `ai-gateway/services/sd_adapter.py` | 不变 |
| `ai-gateway/services/image_processor.py` | 不变 |
| `web/src/hooks/useAuth.ts` | 不变 |
| `web/src/hooks/useSocket.ts` | 不变 |
| `web/src/api/auth.api.ts` | 不变 |
| `web/src/api/client.ts` | 不变 |
| `web/src/components/user/RegisterPanel.tsx` | 不变 |
| `web/src/game/phaser/scenes/BootScene.ts` | 不变 |

---

## 开发顺序依赖

```
Part 1 (因子基础设施)
  └→ Part 2 (仓库制) ──── 依赖 Flower.location 字段
  └→ Part 4 (图片系统) ── 依赖 Seed.growthImages 字段
  └→ Part 5 (商店重写) ── 依赖 Seed 新字段 + 排序参数

Part 3 (性状稳定) ──────── 依赖 Part 1 的融合判定 + Part 2 的仓库指定母株

Part 6 (调试模块) ──────── 依赖 Part 1-5 全部完成

Part 7 (前端新面板) ────── 依赖 Part 2 (仓库) + Part 3 (稳定)
```

**推荐执行顺序**: Part 1 → Part 2 → Part 3 → Part 4 + Part 5 (可并行) → Part 7 → Part 6

---

## 提交策略

每个 Part 完成后独立 commit，格式：`[phase1-5] Part N: 简短描述`

| Commit | 内容 |
|--------|------|
| `[phase1-5] Part 1: factor system infrastructure` | YAML + AtomLoader + 继承算法 + Prisma 迁移 |
| `[phase1-5] Part 2: warehouse harvest flow` | 仓库制 + 收获重写 + 出售价格 |
| `[phase1-5] Part 3: trait stabilization foundation` | 母株/奠基种/称号 |
| `[phase1-5] Part 4: growth stage images` | 5 阶段图 + AI Gateway 变更 |
| `[phase1-5] Part 5: shop rewrite` | 双 Tab 商店 + 稀有度排序 + 日结 |
| `[phase1-5] Part 6: debug module` | 调试 API + 测试脚本 |
| `[phase1-5] Part 7: frontend panels` | 仓库面板 + 稳定面板 + 融合结果增强 |
