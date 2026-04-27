# Phase 1 开发完成说明

> 项目：花语嫁接师（Flower Grafting Master）
> 完成时间：2026-04-27
> 状态：✅ 全部完成，可进行端到端游戏

---

## Phase 1 架构总览

```
┌──────────────────────────────────────────────────────────────┐
│                    前端 (React + Phaser)                      │
│  ┌────────────────────────────────────────────────────┐      │
│  │         Phaser Canvas (1024×768, SD 背景)          │      │
│  │    [ 花盆0 ] [ 花盆1 ] [ 花盆2 ]                   │      │
│  │    [ 花盆3 ] [ 花盆4 ] [ 花盆5 ]                   │      │
│  │    👤用户  ──────────  🛒商店           ← 浮动覆盖  │      │
│  │         🌰种子袋  🧤手套  ⚗️融合        ← 底部工具栏 │      │
│  └────────────────────────────────────────────────────┘      │
│        │ HTTP REST                     │ Socket.io            │
├────────┼───────────────────────────────┼──────────────────────┤
│        ▼                               ▼                      │
│  NestJS (port 3000)              FusionGateway               │
│  ├─ AuthController              (room: user:<id>)            │
│  ├─ UserController                                           │
│  ├─ ShopController                │ HTTP sync                 │
│  ├─ GardenController              ▼                           │
│  └─ FusionController → AiGatewayService                      │
│                              │                                │
├──────────────────────────────┼────────────────────────────────┤
│                              ▼                                │
│            AI Gateway (Python FastAPI, port 8000)             │
│            ├─ /health                                         │
│            ├─ /generate (花朵图, SD Forge)                    │
│            └─ /generate-background (花园背景)                  │
│                              │                                │
│                    SD Forge (animaPencilXL)                   │
├───────────────────────────────────────────────────────────────┤
│  Docker: PostgreSQL (:5432) · Redis (:6379) · MinIO (:9000)  │
└───────────────────────────────────────────────────────────────┘
```

---

## 已完成模块

### Part 1: Schema & Infrastructure ✅
- 7 张数据表：User / Flower / GardenSlot / Seed / FusionLog / TransactionLog
- Stage 枚举：SEED(0) → SEEDLING(1-29) → GROWING(30-69) → MATURE(70-99) → BLOOMING(100)
- Rarity 权重：N:50% / R:30% / SR:15% / SSR:4% / UR:1%
- JWT Guard 全局鉴权

### Part 2: User Module ✅
| 端点 | 说明 |
|------|------|
| `POST /api/auth/register` | 注册 → JWT + 6 GardenSlots + 500g |
| `POST /api/auth/login` | 同名登录（游客模式） |
| `GET /api/user/me` | 个人信息 |
| 原子金币/XP 操作 + TransactionLog |

### Part 3: Shop & Garden ✅
| 端点 | 说明 |
|------|------|
| `GET /api/shop/seeds` | 在售种子列表 |
| `POST /api/shop/buy-seed` | 购买 → 扣金 → 创建 SEED Flower |
| `POST /api/garden/plant` | **手动**种植到指定位置 (position 必填) |
| `POST /api/garden/grow` | 浇水 +30% → 自动 Stage 升级 |
| `GET /api/garden` | 6 槽位 + 花朵信息 |
| `GET /api/garden/inventory` | 种子库存（按名分组+堆叠） |
| `POST /api/garden/harvest` | 收获盛放花 → 奖励 |

### Part 4: Fusion Core ✅
- 基础成功率 75% ± 土壤 Buff - MATURE 惩罚
- 加权随机珍稀度抽取
- 原子去重合并 + 稀有度系统词
- 首达双倍奖励检测
- NORMAL/GRAVE 失败 + RECOVERING 冷却
- FusionLog 无 FK 约束（亲本 consumedAt 标记）

### Part 5: AI Gateway ✅
- FastAPI + MinIO 上传
- `/generate` — SD Forge 花朵图像
- `/generate-background` — SD 花园背景
- `USE_REAL_SD` 开关控制 L3 占位图 vs 真实 SD

### Part 6: WebSocket + AI Integration ✅
- Socket.io `FusionGateway`：房间推送 `fusion:complete`
- 架构简化：HTTP 同步调用 AI Gateway（Phase 3 恢复队列）

### Part 7: Frontend ✅
- **全屏覆盖层布局**：Phaser 画布铺满，React 组件浮动覆盖
- **工具栏**：🌰种子袋（选种→点花盆播种）、🧤手套（点盛放花收获）
- **SD 集成**：花园背景图（SD 生成）、融合花朵图显示在花盆
- 商店/花园面板：右上角浮动切换
- Zustand 三 store：user / garden / fusion
- Bridge 事件总线：Phaser ↔ React 通信

---

## 交互流程

```
注册 → 买种子 → 🌰选种 → 点花盆种植 → 💧浇水到 GROWING
    → 选两朵花 → ⚗️融合 → SD 生成新花图 → 种入花盆
    → 💧继续养到 BLOOMING → 🧤收获 → 💰+⭐
```

---

## 融合数据

| 参数 | 值 |
|------|-------|
| 基础成功率 | 75% |
| LOAM 壤土 | ±0% |
| HUMUS 腐殖土 | ±0%, 奖励+15% |
| SANDY 沙土 | +5% |
| CLAY 粘土 | +10% |
| MATURE 惩罚 | -5%/株 |
| N 奖励 | 50g + 10xp |
| R 奖励 | 100g + 30xp |
| SR 奖励 | 200g + 60xp |
| SSR 奖励 | 500g + 150xp |
| UR 奖励 | 1000g + 300xp |
| 首达 | x2 |

---

## 收获奖励

| 稀有度 | 金币 | 经验 |
|--------|------|------|
| N | 80 | 15 |
| R | 150 | 30 |
| SR | 300 | 60 |
| SSR | 600 | 150 |
| UR | 1200 | 300 |

---

## 启动方式

```bash
cd ~/flowerlang && bash start-dev.sh
# Docker + AI GW:8000 + NestJS:3000 + Vite:5173
```

浏览器访问 `http://localhost:5173`
