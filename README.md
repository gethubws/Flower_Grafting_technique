# 🌸 花语嫁接师 — Flower Grafting Master

> ⏸️ **状态：已归档** (2026-04-30)  
> 美术资源效果未达预期，SD 免费 API 方案暂无法满足品质需求。代码框架完整，待更好的图像生成方案后重启。

一款「花朵基因嫁接」主题的网页游戏。玩家购买种子、种植花朵、通过嫁接融合创造稀有品种，收集并出售。

---

## 🎮 核心玩法

1. **买种** — 从商店购买基础种子（玫瑰/向日葵/百合/兰花/郁金香）
2. **种植** — 种子经过 5 个生长阶段：种子 → 幼苗 → 成长 → 成熟 → 盛放
3. **嫁接** — 选择两株花朵融合，基因因子按 50% 概率继承
4. **发现** — 积累多种因子触发融合规则：七彩→虹彩、重瓣+单瓣→复瓣…
5. **收集** — 稀有度分 5 级（N/R/SR/SSR/UR），越稀有越值钱

---

## 🧬 原子因子系统

本项目的核心创新——**YAML 驱动的可扩展基因系统**：

```
52 个因子 × 9 大分类 × 6 条融合规则 × 5 级稀有度
```

| 稀有度 | 积分 | 示例因子 |
|--------|------|---------|
| N (普通) | 1 | 红花、圆瓣、清香、直立茎… |
| R (稀有) | 5 | 渐变花色、复瓣、条纹、斑点… |
| SR (珍贵) | 10 | 金属光泽、荧光、流星纹… |
| SSR (史诗) | 20 | 水晶瓣、星辉、浮空… |
| UR (传奇) | 50 | 虹彩、龙鳞瓣、星空、圣光、时幻… |

**融合规则示例**：7 种颜色共存 → 虹彩 (UR)、3 种香气共存 → 荧光 (SR)

> 📖 详见 `server/config/atoms/ATOM_SPEC.md` — 因子工程操作手册

---

## 🛠 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS |
| 游戏引擎 | Phaser 3（花园场景） |
| 后端 | NestJS + Prisma ORM + WebSocket (Socket.io) |
| 数据库 | PostgreSQL + Redis |
| 存储 | MinIO（花朵图片） |
| AI 图像 | Python FastAPI → SD Forge API |
| 设计风格 | 玻璃拟态 (Glassmorphism) + 植物系色板 |

---

## 📁 项目结构

```
flowerlang/
├── web/                  # React 前端 + Phaser 游戏引擎
│   └── src/
│       ├── api/          # API 客户端
│       ├── components/   # 页面组件（花园/商店/仓库/嫁接）
│       ├── game/         # Phaser 场景 + React 桥接
│       ├── hooks/        # useAuth, useSocket
│       ├── stores/       # Zustand 状态管理
│       └── types/        # 全量 TypeScript 类型
├── server/               # NestJS 后端
│   └── src/modules/
│       ├── atom/         # 因子引擎（加载/继承/融合/积分）
│       ├── fusion/       # 嫁接流程 + WebSocket
│       ├── garden/       # 花园种植系统
│       ├── shop/         # 商店（系统+玩家市场）
│       ├── warehouse/    # 仓库管理
│       └── user/         # JWT 认证 + 用户系统
├── ai-gateway/           # Python 图像生成网关
├── tools/                # 运维脚本（pipeline/vision/图像处理）
├── docker-compose.yml    # PostgreSQL + Redis + MinIO
└── docs/                 # 设计文档
```

**代码量**: ~3,650 行 TS (后端) + ~3,700 行 TSX/TS (前端) + ~590 行 Python + ~800 行 YAML 配置

---

## 🚀 本地运行

```bash
# 1. 启动基础设施
docker-compose up -d

# 2. 启动后端
cd server && npm install && npx prisma migrate dev && npm run start:dev

# 3. 启动 AI 网关（可选，需要 SD Forge）
cd ai-gateway && source venv/bin/activate && uvicorn main:app --port 8001

# 4. 启动前端
cd web && npm install && npm run dev
```

---

## ⚠️ 已知问题

- **图像生成质量**：SD Forge 免费方案（animaPencilXL）生成的花朵图片质量不稳定，与 UI 风格不匹配
- **理想方案**：需要商用级图像 API（如 OpenAI DALL·E、Midjourney API）才能达到满意的美术表现
- **代办** (Phase 2+)：用户系统增强、社交系统、拍卖市场、图鉴任务

---

## 📝 许可

仅供学习和参考。代码和设计文档保留所有权利。
