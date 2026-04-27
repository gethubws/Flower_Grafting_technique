# 项目阶段追踪

## 当前阶段
- phase: phase1
- status: 进行中
- description: 核心嫁接循环（端到端融合闭环）

## 阶段路线图

| Phase | 模块 | 核心交付物 | 架构预留要求 |
|-------|------|-----------|-------------|
| 1 | 核心嫁接循环 | 端到端融合闭环（买种→种植→生长→嫁接→结果→展示） | FusionModule + GardenModule + AiGatewayModule 完整实现 |
| 2 | 用户系统与认证 | JWT 注册即玩、金币/钻石/XP/等级系统 | UserModule 完整表结构、TransactionLog 流水、JWT 中间件 |
| 3 | 商店与种植系统 | 种子库、生长计时器、土壤/花盆/肥料/仪式 | ShopModule、Seed 表、GardenSlot 表、土壤/仪式枚举 |
| 4 | 场地 Buff 与展位系统 | 普通位6个/黄金位1个/共鸣位1个、灵气计算、四系技能 | Buff 表、GardenSlot.slotType、Aura 计算服务 |
| 5 | 形状稳定工程 | 奠基种认证（10次相似）、大众种子、商店销售80%分成 | Flower.isFoundation、Seed.isFoundationSeed、作者分成流水 |
| 6 | 社交系统 | 采蜜、赠送、联合嫁接、好友关系 | Friendship 表、联合嫁接所有权共享、赠送转移逻辑 |
| 7 | 拍卖与市场系统 | 玩家市场（成熟花/稳定种）、系统拍卖行、税收 | AuctionItem 表、MarketModule、上架费5%+成交税10% |
| 8 | 图鉴、任务与天象系统 | 实验记录本、每日任务、全服天象Buff | FusionLog 查询视图、Task 表、DailyEvent 表 |

## Git 提交规则
1. 每完成一个可独立运行/编译通过的功能模块，必须提交。
2. 提交信息格式: `[phaseX] 完成功能: 具体描述`
3. 阶段切换时更新本文件 phase 字段，提交信息写: `[phaseX] 阶段切换: 开始XX开发`
4. 禁止提交 node_modules、venv、.env、dist 等已忽略内容。
