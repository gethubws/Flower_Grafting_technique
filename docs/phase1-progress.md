# Phase 1 开发进度文档

> 项目：花语嫁接师（Flower Grafting Master）
> 开始时间：2026-04-27
> 总开发策略：将 Phase 1 拆分为 7 个子部分，逐块完成并验证

---

## Phase 1 子部分划分

| # | 子部分 | 范围 | 状态 |
|---|--------|------|------|
| 1 | Schema & Infrastructure | Prisma Schema 更新、Migration、Seed、Config Modules、Enums、JWT Guard | ✅ 完成 |
| 2 | User Module | 注册/登录/用户信息、JWT 签发、资产操作 | ⬜ 待开始 |
| 3 | Shop & Garden | 种子商店、花园种植/生长 | ⬜ 待开始 |
| 4 | Fusion Core | 嫁接核心算法、事务、奖励、失败处理 | ⬜ 待开始 |
| 5 | AI Gateway (Python) | L3 占位图、MinIO 上传、BullMQ 消费 | ⬜ 待开始 |
| 6 | WebSocket & Queue | Socket.io 推送、BullMQ 队列、AI 回调 | ⬜ 待开始 |
| 7 | Frontend | React+Phaser 全鼠标操作花园 + 嫁接界面 | ⬜ 待开始 |

---

## Part 1: Schema & Infrastructure

### 设计决策（与 Phase 0 的差异）

1. **User.email → 可空**：Phase 1 游客模式只需 name
2. **Stage 枚举大写**：统一为 SEED/SEEDLING/GROWING/MATURE/BLOOMING/RECOVERING
3. **新增 GardenSlot**：每个用户 6 个槽位（position 0-5），用户注册时自动创建
4. **新增 TransactionLog**：所有金币变动都记录
5. **新增 Seed**：商店种子数据，含 atomLibrary（JSON 格式）
6. **Flower 新增字段**：isShopSeed（源自商店购买）、consumedAt（嫁接消耗时间）
7. **FusionLog 新增字段**：failType（NORMAL/GRAVE）、isFirstTime（首次奖励标记）

### 文件清单
- [x] `server/prisma/schema.prisma` — 更新（新增 GardenSlot / Seed / TransactionLog / 修改User/Flower/FusionLog）
- [x] Migration 执行 — `20260427032653_phase1_init`
- [x] `server/prisma/seed.ts` — 新建（5种种子：玫瑰/向日葵/百合/郁金香/蝴蝶兰）
- [x] `server/src/config/prisma/prisma.module.ts` + `prisma.service.ts`
- [x] `server/src/config/redis/redis.module.ts`
- [x] `server/src/config/minio/minio.module.ts` + `minio.service.ts`
- [x] `server/src/common/enums/index.ts` — Rarity/Stage/SoilType/FailType/TransactionType/CurrencyType/RitualType + 权重/奖励配置
- [x] `server/src/common/guards/jwt.guard.ts` — JwtGuard + OptionalJwtGuard
- [x] `server/src/app.module.ts` — 注册 Config/JWT/Prisma/Redis/MinIO + 全局 ValidationPipe
- [x] nest build 编译通过 ✅
- [x] Seed 数据入库验证 ✅
- [x] 安装 minio npm 包

### 数据库表清单（7 张）
| Table | 说明 |
|-------|------|
| User | 用户（Email 可空、unionId 预留） |
| Flower | 花（Stage 大写枚举、isShopSeed、consumedAt） |
| GardenSlot | 花园槽位（userId+position 唯一、1:1 Flower） |
| Seed | 商店种子（atomLibrary JSON） |
| FusionLog | 嫁接日志（failType、isFirstTime、reward） |
| TransactionLog | 交易流水 |
| _prisma_migrations | 迁移记录 |
