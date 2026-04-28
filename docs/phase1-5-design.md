# 《花语嫁接师》Phase 1 大改方案

> **版本**: v1.1（根据反馈修订）  
> **日期**: 2026-04-28  
> **状态**: 待审阅（已修订稀有度表、收获流程、可扩展性设计）  
> **基于**: Phase 1 已完成代码 (`~/flowerlang/`)

---

## 〇、改版动机

当前 Phase 1 实现了核心嫁接循环，但`FusionService.mergeAtoms()`采用简单去重+稀有度注入的方式，缺乏「基因因子」的概念深度。新需求要求引入：

- **原子化提示词系统**：因子按部位/特征分类，概率继承
- **因子积分→稀有度加权**：因子越多越稀有
- **矛盾融合词汇表**：预设融合规则（如七色→虹彩）
- **性状稳定工程**：母株认证、奠基种、商店上架
- **五阶段形态图**：种子/幼苗/成长/成熟/开花
- **商店系统重写**
- **收获改仓库制**：收获花朵入库，玩家选择出售或保留
- **可扩展因子工程**：带规范文档，AI 可协作添加新因子

---

## 一、原子提示词系统（Atom System）

### 1.1 数据文件设计

新建 `server/config/atoms/` 目录，存放可热更新的因子配置文件：

```
server/config/atoms/
├── categories.yaml        # 分类定义
├── standard.yaml          # 普通因子 (N) — 积分 1
├── rare.yaml              # 稀有因子 (R) — 积分 5
├── precious.yaml          # 珍贵因子 (SR) — 积分 10
├── epic.yaml              # 史诗因子 (SSR) — 积分 20
├── legendary.yaml         # 传奇因子 (UR) — 积分 50
├── fusion_rules.yaml      # 矛盾融合规则
└── adjective_pools.yaml   # 稀有形容词抽取池
```

#### `categories.yaml` — 分类定义

```yaml
categories:
  petal_shape:    # 花瓣形状
    label: "花瓣形状"
    weight: 1.0
  petal_texture:  # 花瓣质地
    label: "花瓣质地"
    weight: 1.0
  petal_color:    # 花瓣颜色
    label: "花瓣颜色"
    weight: 1.0
  leaf_shape:     # 叶子形状
    label: "叶子形状"
    weight: 1.0
  stem_type:      # 茎类型
    label: "茎类型"
    weight: 1.0
  stamen:         # 花蕊
    label: "花蕊特征"
    weight: 1.0
  fragrance:      # 香气
    label: "香气"
    weight: 1.0
  size:           # 花型大小
    label: "花型大小"
    weight: 1.0
  special:        # 特殊特征
    label: "特殊特征"
    weight: 1.0
```

#### `standard.yaml` — 普通因子 (N, 积分 1)

```yaml
# 每个条目: { id, category, prompt_chinese, prompt_en, incompatible_with[] }
atoms:
  # === 花瓣形状 ===
  - id: "圆瓣"
    category: petal_shape
    prompt_chinese: "圆形花瓣"
    prompt_en: "round petals"
    level: N
    score: 1

  - id: "尖瓣"
    category: petal_shape
    prompt_chinese: "尖锐花瓣"
    prompt_en: "pointed petals"
    level: N
    score: 1

  - id: "重瓣"
    category: petal_shape
    prompt_chinese: "重瓣花"
    prompt_en: "double-layered petals"
    level: N
    score: 1

  - id: "单瓣"
    category: petal_shape
    prompt_chinese: "单瓣花"
    prompt_en: "single-layered petals"
    level: N
    score: 1

  - id: "波浪瓣"
    category: petal_shape
    prompt_chinese: "波浪边花瓣"
    prompt_en: "wavy-edged petals"
    level: N
    score: 1

  - id: "锯齿瓣"
    category: petal_shape
    prompt_chinese: "锯齿边花瓣"
    prompt_en: "serrated-edged petals"
    level: N
    score: 1

  - id: "杯状"
    category: petal_shape
    prompt_chinese: "杯状花冠"
    prompt_en: "cup-shaped corolla"
    level: N
    score: 1

  - id: "蝶形"
    category: petal_shape
    prompt_chinese: "蝶形花瓣"
    prompt_en: "butterfly-shaped petals"
    level: N
    score: 1

  # === 花瓣质地 ===
  - id: "光滑花瓣"
    category: petal_texture
    prompt_chinese: "光滑质感花瓣"
    prompt_en: "smooth glossy petals"
    level: N
    score: 1

  - id: "绒面"
    category: petal_texture
    prompt_chinese: "天鹅绒质感花瓣"
    prompt_en: "velvety matte petals"
    level: N
    score: 1

  - id: "薄瓣"
    category: petal_texture
    prompt_chinese: "薄如蝉翼的花瓣"
    prompt_en: "delicate thin translucent petals"
    level: N
    score: 1

  # === 花瓣颜色 ===
  - id: "红花"
    category: petal_color
    prompt_chinese: "红色"
    prompt_en: "red"
    level: N
    score: 1

  - id: "黄花"
    category: petal_color
    prompt_chinese: "黄色"
    prompt_en: "yellow"
    level: N
    score: 1

  - id: "白花"
    category: petal_color
    prompt_chinese: "白色"
    prompt_en: "white"
    level: N
    score: 1

  - id: "蓝花"
    category: petal_color
    prompt_chinese: "蓝色"
    prompt_en: "blue"
    level: N
    score: 1

  - id: "粉花"
    category: petal_color
    prompt_chinese: "粉色"
    prompt_en: "pink"
    level: N
    score: 1

  - id: "紫花"
    category: petal_color
    prompt_chinese: "紫色"
    prompt_en: "purple"
    level: N
    score: 1

  - id: "橙花"
    category: petal_color
    prompt_chinese: "橙色"
    prompt_en: "orange"
    level: N
    score: 1

  # === 叶子形状 ===
  - id: "剑形叶"
    category: leaf_shape
    prompt_chinese: "剑形细长叶"
    prompt_en: "sword-shaped slender leaves"
    level: N
    score: 1

  - id: "心形叶"
    category: leaf_shape
    prompt_chinese: "心形叶"
    prompt_en: "heart-shaped leaves"
    level: N
    score: 1

  - id: "宽叶"
    category: leaf_shape
    prompt_chinese: "宽大叶片"
    prompt_en: "broad large leaves"
    level: N
    score: 1

  - id: "细叶"
    category: leaf_shape
    prompt_chinese: "细小叶片"
    prompt_en: "small thin leaves"
    level: N
    score: 1

  # === 茎类型 ===
  - id: "直立茎"
    category: stem_type
    prompt_chinese: "直立挺拔的茎"
    prompt_en: "straight upright stem"
    level: N
    score: 1

  - id: "蔓生茎"
    category: stem_type
    prompt_chinese: "蔓生攀援的茎"
    prompt_en: "climbing vine stem"
    level: N
    score: 1

  - id: "尖刺茎"
    category: stem_type
    prompt_chinese: "带刺的茎"
    prompt_en: "thorny stem"
    level: N
    score: 1

  - id: "细茎"
    category: stem_type
    prompt_chinese: "纤细的茎"
    prompt_en: "slender delicate stem"
    level: N
    score: 1

  # === 花蕊 ===
  - id: "黄花蕊"
    category: stamen
    prompt_chinese: "黄色花蕊"
    prompt_en: "yellow stamen"
    level: N
    score: 1

  - id: "棕色蕊"
    category: stamen
    prompt_chinese: "棕色花蕊"
    prompt_en: "brown stamen"
    level: N
    score: 1

  - id: "突出蕊"
    category: stamen
    prompt_chinese: "突出外露的花蕊"
    prompt_en: "prominent exposed stamen"
    level: N
    score: 1

  # === 香气 ===
  - id: "清香"
    category: fragrance
    prompt_chinese: "淡雅清香"
    prompt_en: "delicate light fragrance"
    level: N
    score: 1

  - id: "浓香"
    category: fragrance
    prompt_chinese: "浓郁芳香"
    prompt_en: "rich strong fragrance"
    level: N
    score: 1

  - id: "甜香"
    category: fragrance
    prompt_chinese: "甜美香气"
    prompt_en: "sweet fragrance"
    level: N
    score: 1

  # === 大小 ===
  - id: "大花"
    category: size
    prompt_chinese: "大型花朵"
    prompt_en: "large flower"
    level: N
    score: 1

  - id: "小花"
    category: size
    prompt_chinese: "小型花朵"
    prompt_en: "small flower"
    level: N
    score: 1

  # === 特殊 ===
  - id: "向阳"
    category: special
    prompt_chinese: "向阳生长"
    prompt_en: "heliotropic"
    level: N
    score: 1

  - id: "夜开"
    category: special
    prompt_chinese: "夜间开放"
    prompt_en: "nocturnal blooming"
    level: N
    score: 1
```

#### `rare.yaml` — 稀有因子 (R, 积分 5)

```yaml
atoms:
  - id: "光泽花瓣"
    category: petal_texture
    prompt_chinese: "珍珠般光泽的花瓣"
    prompt_en: "pearl-like lustrous petals"
    level: R
    score: 5

  - id: "渐变花色"
    category: petal_color
    prompt_chinese: "渐变色花瓣"
    prompt_en: "gradient color petals"
    level: R
    score: 5

  - id: "双色"
    category: petal_color
    prompt_chinese: "双色花瓣"
    prompt_en: "bi-color petals"
    level: R
    score: 5

  - id: "条纹"
    category: petal_texture
    prompt_chinese: "条纹纹理花瓣"
    prompt_en: "striped textured petals"
    level: R
    score: 5

  - id: "斑点"
    category: petal_texture
    prompt_chinese: "斑点花瓣"
    prompt_en: "spotted petals"
    level: R
    score: 5

  - id: "复瓣"
    category: petal_shape
    prompt_chinese: "复瓣花朵"
    prompt_en: "multi-layered flower"
    level: R
    score: 5
```

#### `precious.yaml` — 珍贵因子 (SR, 积分 10)

```yaml
atoms:
  - id: "异色"
    category: petal_color
    prompt_chinese: "罕见异色"
    prompt_en: "rare exotic color"
    level: SR
    score: 10

  - id: "荧光"
    category: special
    prompt_chinese: "淡荧光效果"
    prompt_en: "subtle fluorescent glow"
    level: SR
    score: 10

  - id: "金属光泽"
    category: petal_texture
    prompt_chinese: "金属光泽花瓣"
    prompt_en: "metallic sheen petals"
    level: SR
    score: 10

  - id: "双层花瓣"
    category: petal_shape
    prompt_chinese: "双层花瓣结构"
    prompt_en: "double corolla structure"
    level: SR
    score: 10

  - id: "流星纹"
    category: petal_texture
    prompt_chinese: "流星状斑纹"
    prompt_en: "shooting star pattern"
    level: SR
    score: 10
```

#### `epic.yaml` — 史诗因子 (SSR, 积分 20)

```yaml
atoms:
  - id: "水晶瓣"
    category: petal_texture
    prompt_chinese: "水晶般透明的花瓣"
    prompt_en: "crystal clear translucent petals"
    level: SSR
    score: 20

  - id: "星辉"
    category: special
    prompt_chinese: "星光闪烁效果"
    prompt_en: "starlight shimmering effect"
    level: SSR
    score: 20

  - id: "三色渐变"
    category: petal_color
    prompt_chinese: "三色渐变花瓣"
    prompt_en: "tri-color gradient petals"
    level: SSR
    score: 20

  - id: "浮空"
    category: special
    prompt_chinese: "悬浮于空的姿态"
    prompt_en: "floating in air posture"
    level: SSR
    score: 20
```

#### `legendary.yaml` — 传奇因子 (UR, 积分 50)

```yaml
atoms:
  - id: "虹彩"
    category: petal_color
    prompt_chinese: "虹彩色光芒"
    prompt_en: "iridescent rainbow radiance"
    level: UR
    score: 50

  - id: "龙鳞瓣"
    category: petal_texture
    prompt_chinese: "龙鳞般的花瓣"
    prompt_en: "dragon scale-like petals"
    level: UR
    score: 50

  - id: "星空"
    category: special
    prompt_chinese: "内有星云流淌的花朵"
    prompt_en: "flower with flowing nebula inside"
    level: UR
    score: 50

  - id: "圣光"
    category: special
    prompt_chinese: "圣洁光芒包围"
    prompt_en: "surrounded by holy light"
    level: UR
    score: 50

  - id: "时幻"
    category: special
    prompt_chinese: "随时间变换形态"
    prompt_en: "time-shifting appearance"
    level: UR
    score: 50
```

### 1.2 原子继承算法

**核心规则：每个父本原子被继承的概率为 50%（独立事件）**

```
parentA.atoms = [a₁, a₂, a₃, b₁, b₂, b₃]  (6个原子，按分类标识)
parentB.atoms = [a₄, a₅, c₁, c₂, c₃, c₄]  (6个原子)

继承过程（每个原子独立掷硬币，50%概率）：
  parentA 掷硬币结果：a₁√ a₂× a₃√ b₁√ b₂× b₃×  → 继承 [a₁, a₃, b₁]
  parentB 掷硬币结果：a₄× a₅√ c₁√ c₂√ c₃× c₄√  → 继承 [a₅, c₁, c₂, c₄]

合并结果：[a₁, a₃, a₅, b₁, c₁, c₂, c₄] (7个原子)

边缘情况：
- 全部丢失（0个原子）→ 大失败 (概率 ≈ 0.5^(n+m))
- 全中（12个原子）→ 多倍体 (概率 ≈ 0.5^(n+m))
- 同因子重复出现 → 允许 aabb 型的同源多倍体
```

**多倍体处理**：如果同一 `id` 被继承两次（父A和父B都有且都成功），在 atoms 数组中保留重复项。后续生成 prompt 时，通过"双倍剂量"的修饰词来体现（如 `"异常巨大的红花"` / `"intensified red hue"`）。

**积分计算**：`totalScore = Σ(atoms[i].score)`，重复的也计入。

### 1.3 种子原子库重新设计

现有的 5 种种子需要更新，每个种子的 `atomLibrary` 改为结构化的因子对象数组：

```typescript
// Seed 建表更改为引用 atom id 列表
interface SeedAtom {
  atomId: string;       // 对应 atoms/*.yaml 中的 id
  guaranteed: boolean;  // 该品种必定携带此因子（Phase 1 基础花全部 guaranteed）
}

// 玫瑰 atomLibrary (Phase 1.5 更新)
// 旧: ['红花','重瓣','层叠','香气1','圆形','柔和','尖刺茎']
// 新:
[
  { atomId: "红花", guaranteed: true },
  { atomId: "重瓣", guaranteed: true },
  { atomId: "圆瓣", guaranteed: true },
  { atomId: "浓香", guaranteed: true },
  { atomId: "尖刺茎", guaranteed: true },
  { atomId: "绒面", guaranteed: true },
  { atomId: "黄花蕊", guaranteed: true },
]
```

### 1.4 可扩展因子工程（Atom Engineering Spec）

> **目的**：让任何人（包括未来的 AI agent）都能轻松添加新因子。遵循接口规范即可，无需修改任何代码。

因子系统被设计为一个「即插即用」工程。详见 `server/config/atoms/ATOM_SPEC.md`（下文为规范概要）。

#### 因子注册接口规范

每个因子文件（`standard.yaml` / `rare.yaml` 等）遵循统一 Schema：

```yaml
# 文件格式规范（所有 factor 文件都遵循）
atoms:
  - id: "唯一标识符"            # 必填，全局唯一，如 "红花"
    category: "分类名"          # 必填，必须是 categories.yaml 中的 key
    prompt_chinese: "中文提示"   # 必填，用于 SD 中文 prompt
    prompt_en: "english prompt"  # 必填，用于 SD 英文 prompt
    level: N                    # 必填，N/R/SR/SSR/UR
    score: 1                    # 必填，对应积分：1/5/10/20/50
    incompatible: []            # 可选，互斥因子 id 列表
    description: "描述文字"      # 可选，给人类看的说明
```

#### 添加新因子（模范示例）

以添加「虎斑纹花瓣」（稀有 R）为例：

```yaml
# 步骤 1：确定分类 → petal_texture（花瓣质地）已存在，无需新建分类
# 步骤 2：确定稀有度 → 斑纹属于中等稀有 → 加到 rare.yaml
# 步骤 3：在 rare.yaml 的 atoms 列表末尾追加：

  - id: "虎斑纹"
    category: petal_texture
    prompt_chinese: "虎斑条纹花瓣"
    prompt_en: "tiger-striped petals"
    level: R
    score: 5
    incompatible: ["纯色"]
    description: "花瓣上有类似虎纹的深色条纹，稀有变异"
```

#### 添加新分类（模范示例）

以添加「花期特征」为例：

```yaml
# 步骤 1：在 categories.yaml 中追加：
  bloom_time:
    label: "花期特征"
    weight: 1.0

# 步骤 2：在 standard.yaml 中追加该分类的因子：
  - id: "夏花"
    category: bloom_time
    prompt_chinese: "夏季盛开"
    prompt_en: "summer blooming"
    level: N
    score: 1
    description: "只在夏季盛开的花朵"
```

#### 启动时自动验证

`AtomLoaderService` 在服务启动时自动验证：
1. 所有因子的 `category` 必须在 `categories.yaml` 中已定义
2. 所有因子的 `id` 必须全局唯一（跨文件查重）
3. `incompatible` 引用的 id 必须存在
4. `level` 与文件级别一致（standard→N, rare→R, ...）
5. `score` 与 level 对应（N:1, R:5, SR:10, SSR:20, UR:50）

验证失败 → 打印完整错误清单 + 跳过该因子（不崩溃），方便增量开发时定位问题。

#### 为什么用 YAML 而不是 JSON/DB

- YAML 可写注释（策划可直接标注设计意图）
- 换行友好（长 prompt 不挤在一行）
- 人类直接编辑，Git diff 友好
- Phase 1.5 直接用文件 → Phase 3+ 如需热更可迁移到数据库

详见 `server/config/atoms/ATOM_SPEC.md`（将单独编写完整操作手册）。

---

## 二、矛盾融合规则（Fusion Rules）

### 2.1 融合词表

`fusion_rules.yaml`:

```yaml
rules:
  # === 颜色融合 ===
  - name: "七彩→虹彩"
    description: "当父本+母本累计携带7种不同颜色时触发"
    condition:
      type: color_count
      min_count: 7
      categories: [petal_color]
    result:
      replace_atoms: ["红花","黄花","白花","蓝花","粉花","紫花","橙花"]
      produce_atom: "虹彩"        # 传奇因子 UR
      prompt_modifier: "虹彩色光芒流转于花瓣之间"

  - name: "三色→渐变"
    description: "当携带3-6种不同颜色时触发"
    condition:
      type: color_count
      min_count: 3
      max_count: 6
      categories: [petal_color]
    result:
      produce_atom: "渐变花色"     # 稀有因子 R
      prompt_modifier: "渐变色花瓣过渡"

  # === 形状融合 ===
  - name: "重瓣+单瓣→复瓣"
    description: "同时携带重瓣和单瓣因子"
    condition:
      type: atom_present
      atom_ids: ["重瓣","单瓣"]
    result:
      replace_atoms: ["重瓣","单瓣"]
      produce_atom: "复瓣"          # 稀有 R
      prompt_modifier: "complex layered petal structure"

  - name: "杯状+蝶形→蝶杯花"
    description: "杯状与蝶形融合"
    condition:
      type: atom_present
      atom_ids: ["杯状","蝶形"]
    result:
      replace_atoms: ["杯状","蝶形"]
      produce_atom: "双层花瓣"      # 珍贵 SR
      prompt_modifier: "butterfly-shaped cup corolla with double layer"

  # === 香气融合 ===
  - name: "三香→迷魂香"
    description: "累计携带3种及以上香气因子"
    condition:
      type: category_count
      min_count: 3
      categories: [fragrance]
    result:
      produce_atom: "荧光"          # 珍贵 SR
      prompt_modifier: "enchanting multi-layered fragrance, subtle glow"

  # === 质地融合 ===
  - name: "光滑+绒面→丝绒"
    description: "光滑与绒面共存"
    condition:
      type: atom_present
      atom_ids: ["光滑花瓣","绒面"]
    result:
      replace_atoms: ["光滑花瓣","绒面"]
      produce_atom: "金属光泽"      # 珍贵 SR
      prompt_modifier: "silky velvet finish with subtle metallic sheen"
```

### 2.2 融合处理流程

```
mergeAtoms(parentA.atoms, parentB.atoms) {
  1. 概率继承 (50% each)
  2. 合并去重（保留重复用于多倍体计数）
  3. 应用 fusion_rules.yaml（按优先级顺序匹配）
     - 每条规则只触发一次
     - 触发后替换相应原子
  4. 计算总积分 score
  5. 根据积分调整稀有度概率 → rollRarity(score)
  6. 稀有度确定后：
     a. 注入该稀有度对应的系统形容词（从 adjective_pools.yaml 抽取）
     b. 注入该稀有度的基础系统词（光泽/异色/荧光等仍保留）
  7. 返回 { atoms[], score, rarity }
}
```

### 2.3 融合规则可扩展设计

融合规则与因子系统一样遵循「即插即用」原则：

```yaml
# fusion_rules.yaml 规范
rules:
  - name: "规则名称"              # 必填，人类可读
    description: "触发条件说明"    # 必填
    priority: 10                  # 必填，数字越大越先匹配
    condition:
      type: color_count | atom_present | category_count  # 必填
      # ... 条件参数（见下方）
    result:
      replace_atoms: []           # 要替换掉的原子 id 列表
      produce_atom: "xxx"         # 产生的新因子 id（必须在 atom 文件中已定义）
      prompt_modifier: "xxx"      # 附加到 prompt 的描述

# 条件类型详解：
#
# 1. color_count：继承后的颜色种类数达到阈值
#    condition:
#      type: color_count
#      min_count: 7              # 最少7种不同颜色
#      categories: [petal_color]
#
# 2. atom_present：特定几个原子同时存在
#    condition:
#      type: atom_present
#      atom_ids: ["重瓣", "单瓣"]  # 这些原子都继承了
#
# 3. category_count：某个分类的因子数达到阈值
#    condition:
#      type: category_count
#      min_count: 3              # 至少3个
#      categories: [fragrance]
```

**添加新融合规则的模范示例**：

```yaml
# 需求：当同时继承「尖刺茎」和「红花」时，融合成「荆棘玫瑰」
  - name: "尖刺+红花→荆棘"
    description: "红花与尖刺茎共存产生荆棘变异"
    priority: 15
    condition:
      type: atom_present
      atom_ids: ["尖刺茎", "红花"]
    result:
      replace_atoms: ["尖刺茎"]            # 替换掉尖刺茎
      produce_atom: "金属光泽"              # 产生 SR 因子（需已在 precious.yaml 定义）
      prompt_modifier: "thorny stem wrapped in metallic sheen"
```

> **注意**：`produce_atom` 必须是已在 atom 文件中定义过的因子 id，不能凭空创造。这确保所有因子都有明确的中英文 prompt 和分类归属。

---

## 三、新稀有度系统

### 3.1 因子积分

| 因子级别 | 积分 | 示例 |
|---------|------|------|
| N (普通) | 1 | 红花、圆瓣、清香 |
| R (稀有) | 5 | 光泽花瓣、渐变花色、双色 |
| SR (珍贵) | 10 | 异色、荧光、金属光泽 |
| SSR (史诗) | 20 | 水晶瓣、星辉、三色渐变 |
| UR (传奇) | 50 | 虹彩、龙鳞瓣、星空 |

### 3.2 积分挡位与概率

**核心原则**：
- N 单调减、R/SR/SSR/UR 单调增（线性插值，共 8 步）
- **UR 上限 1%，从不超过**
- 100 分终点：N=20% / R=45% / SR=26% / SSR=8% / UR=1%

基础概率（未嫁接的商店种子花 / 0-8 分挡位）：

| 稀有度 | 概率 |
|--------|------|
| N | 50.00% |
| R | 35.00% |
| SR | 12.00% |
| SSR | 2.90% |
| UR | 0.10% |

因子积分修正后的概率表（每行合计 100.00%）：

| 积分挡位 | N ↓ | R ↑ | SR ↑ | SSR ↑ | UR ↑ |
|---------|------|------|------|--------|------|
| 0–8 (基础) | 50.00% | 35.00% | 12.00% | 2.90% | 0.10% |
| 9–15 | 46.25% | 36.25% | 13.75% | 3.54% | 0.21% |
| 16–24 | 42.50% | 37.50% | 15.50% | 4.18% | 0.33% |
| 25–35 | 38.75% | 38.75% | 17.25% | 4.81% | 0.44% |
| 36–48 | 35.00% | 40.00% | 19.00% | 5.45% | 0.55% |
| 49–63 | 31.25% | 41.25% | 20.75% | 6.09% | 0.66% |
| 64–80 | 27.50% | 42.50% | 22.50% | 6.73% | 0.78% |
| 81–99 | 23.75% | 43.75% | 24.25% | 7.36% | 0.89% |
| 100+ | **20.00%** | **45.00%** | **26.00%** | **8.00%** | **1.00%** |

> **逻辑**：每一步 N 固定减 3.75%，R 加 1.25%，SR 加 1.75%，SSR 加 0.6375%，UR 加 0.1125%。全程单调，UR 从未超过 1%。
>
> 100 分时，你有 80% 概率出 R+，20% 概率出 N——不再是「大概率垃圾」，但「极品 UR」仍然只有 1%，可遇不可求。

### 3.3 稀有形容词池（Adjective Pools）

当幸运地抽到 R 及以上稀有度时，从对应池子中随机抽取一个形容词因子：

`adjective_pools.yaml`:

```yaml
pools:
  R:
    - id: "微光"
      prompt_chinese: "微微发光的"
      prompt_en: "slightly glowing"
      level: R
      score: 0  # 形容词不额外计分（已通过稀有度体现）
    - id: "如玉"
      prompt_chinese: "玉质感的"
      prompt_en: "jade-like"
      level: R
      score: 0
    - id: "星辰斑点"
      prompt_chinese: "带星辰斑点的"
      prompt_en: "with starlike speckles"
      level: R
      score: 0
    - id: "晨露"
      prompt_chinese: "常带晨露的"
      prompt_en: "always dewdrop-adorned"
      level: R
      score: 0

  SR:
    - id: "流萤"
      prompt_chinese: "流萤环绕的"
      prompt_en: "surrounded by firefly-like motes"
      level: SR
      score: 0
    - id: "月辉"
      prompt_chinese: "月辉笼罩的"
      prompt_en: "bathed in moonlight glow"
      level: SR
      score: 0
    - id: "幻影"
      prompt_chinese: "略带幻影的"
      prompt_en: "with subtle mirage effect"
      level: SR
      score: 0

  SSR:
    - id: "星环"
      prompt_chinese: "笼罩星环的"
      prompt_en: "encircled by a stellar ring"
      level: SSR
      score: 0
    - id: "天火"
      prompt_chinese: "燃着天火的"
      prompt_en: "ablaze with celestial fire"
      level: SSR
      score: 0
    - id: "极光"
      prompt_chinese: "极光流转的"
      prompt_en: "aurora flowing through"
      level: SSR
      score: 0

  UR:
    - id: "创世"
      prompt_chinese: "创世之"
      prompt_en: "primordial"
      level: UR
      score: 0
    - id: "永恒"
      prompt_chinese: "永恒的"
      prompt_en: "eternal"
      level: UR
      score: 0
    - id: "天启"
      prompt_chinese: "天启之"
      prompt_en: "apocalyptic"
      level: UR
      score: 0
```

**抽取规则**：
- 抽到 R → 从 R 池随机抽 1 个形容词
- 抽到 SR → 从 SR 池随机抽 1 个
- 抽到 SSR → 从 SSR 池随机抽 1 个
- 抽到 UR → 从 UR 池随机抽 1 个
- N 稀有度不抽取（不需要形容词）

---

## 四、花朵图片系统

### 4.1 基础花五阶段形态图

每株基础花（商店种子的后代）在生长过程中展示 5 张预生成图片：

| 阶段 | progress 范围 | 图片源 | 说明 |
|------|-------------|--------|------|
| 种子 | 0 | `seeds/{seedName}/seed.png` | 静态资源，可手绘或SD预生成 |
| 幼苗 | 1-29 | `seeds/{seedName}/seedling.png` | SD预生成，展示刚发芽的形态 |
| 成长 | 30-69 | `seeds/{seedName}/growing.png` | SD预生成，展示长出叶子和小花苞 |
| 成熟 | 70-99 | `seeds/{seedName}/mature.png` | SD预生成，展示含苞待放 |
| 盛放 | 100 | `seeds/{seedName}/blooming.png` | SD预生成，展示完全开放 |

**实现策略**：
- Phase 1 使用占位图（Pillow 根据阶段画不同大小的植物）
- Phase 2+ 使用 SD Forge 预生成并缓存到 MinIO
- 图片路径存储在 `Seed.growthImages: JSON` 字段中

**Schema 变更（Seed 表）**：
```prisma
model Seed {
  // ... 原有字段
  growthImages Json  // { seed: "url", seedling: "url", growing: "url", mature: "url", blooming: "url" }
}
```

### 4.2 融合花生长期图片

融合花（`isShopSeed: false, parentAId !== null`）的生长期图片采用特殊策略：

```
Stage SEED:      显示父本A的 SEED 图片    (或默认融合种子图)
Stage SEEDLING:  显示父本A的 SEEDLING 图片
Stage GROWING:   显示父本A的 GROWING 图片
Stage MATURE:    显示父本A的 MATURE 图片
Stage BLOOMING:  显示 SD 生成的专属融合花图片 ✨
```

**设计意图**：
- 嫁接时只确定了"第一选择"的亲本（parentA）
- 生长期（GROWING→MATURE）留出时间让 SD 异步生成最终图片
- 前端显示生长倒计时/进度条，玩家知道"这株花还在成长中"
- 到达 BLOOMING 时切换到真正的融合图片

**实现**：
```typescript
// Flower 表新增字段
model Flower {
  // ...
  growthImageSeed  String?  // 指向哪个 Seed 的生长期图片（parentA 的品种名）
  growthImageUrl   String?  // BLOOMING 阶段的 SD 生成图（其余阶段用 seed 的图）
}
```

---

## 五、性状稳定工程（Trait Stabilization）

### 5.1 认证条件

| 条件 | 说明 |
|------|------|
| 稀有度一致 | 嫁接结果的稀有度 = 母株的稀有度 |
| 基因差异 ≤ 3 | 继承后的因子集合与母株的因子集合差异不超过3个（新增/减少分别计数） |

**差异计算**：
```typescript
function atomDifference(atomsA: string[], atomsB: string[]): number {
  const setA = new Set(atomsA);
  const setB = new Set(atomsB);
  let diff = 0;
  // A有B没有的
  for (const a of setA) if (!setB.has(a)) diff++;
  // B有A没有的
  for (const b of setB) if (!setA.has(b)) diff++;
  return diff;
}
```

> **注意**：差异计算基于去重后的因子集合（不关注多倍体的重复次数），因为形容词池随机抽取会导致天然差异。

### 5.2 认证流程

```
1. 玩家拥有一株「母株」（已标记为稳定化候选）
2. 用母株作为亲本A（第一选择）进行嫁接
3. 嫁接成功 → 检查：
   a. 结果稀有度 == 母株稀有度？
   b. 基因差异 ≤ 3？
4. 条件满足 → 母株的 stabilityProgress += 1
5. stabilityProgress 达到 10 → 母株升级为「奠基种」
```

### 5.3 Schema 变更

```prisma
model Flower {
  // ... 原有字段
  isFoundation         Boolean  @default(false)  // 是否已认证为奠基种
  stabilityProgress    Int      @default(0)      // 稳定化进度 (0-10)
  stabilityTargetId    String?  // 如果这是一次嫁接结果，指向用作母株的 Flower ID
  foundationName       String?  // 奠基种自定义名称（认证时由玩家命名）
  foundationOwnerId    String?  // 奠基种所有者
}

model Seed {
  // ... 原有字段
  isFoundationSeed     Boolean  @default(false)  // 是否玩家上架的奠基种
  foundationFlowerId   String?  // 来源奠基种的 Flower ID
  sellerId             String?  // 上架者 userId
  customPrice          Int?     // 玩家自定义售价
  revenueShare         Float    @default(0.8)    // 分成比例
}
```

### 5.4 奠基种权益

| 权益 | 说明 |
|------|------|
| 独特称号 | 获得「{花名}育种家」系列称号，存入 User.title |
| 无限种子 | 玩家可无限领取该奠基种的种子 |
| 商店上架 | 可设定价格上架至系统商店，全球玩家可购买 |
| 金币分成 | 每笔购买按 80% 日结给育种家 |

### 5.5 新增 API

```
POST /api/foundation/designate
  → 将一株已盛放的花指定为「稳定化候选母株」
  body: { flowerId }

GET /api/foundation/status
  → 查询玩家所有母株的稳定化进度
  response: [{ flowerId, progress, rarity, atoms }]

POST /api/foundation/claim-seed
  → 从奠基种领取一份免费种子
  body: { flowerId }

POST /api/foundation/list-shop
  → 将奠基种上架商店
  body: { flowerId, price }

POST /api/foundation/unlist-shop
  → 下架
  body: { seedId }

GET /api/foundation/revenue
  → 查询日收益/总收益
```

### 5.6 Fusion 接口修改

在 `POST /api/fusion` 的请求体中新增可选字段：

```typescript
interface FusionRequestDto {
  parentAId: string;         // 第一选择亲本（嫁接核心）
  parentBId: string;         // 第二选择亲本
  soil: SoilType;
  ritual: RitualType;
  // 新增：性状稳定工程
  stabilityTargetId?: string;  // 如果传了，表示本次嫁接的目的是稳定化该母株
}
```

---

## 六、商店系统重写

### 6.1 商店类型

商店分为两个 Tab：

**Tab 1: 基础商店（系统）**
- 5 种初始种子（玫瑰、向日葵、百合、郁金香、蝴蝶兰）
- 固定价格，无限供应
- 显示：品种名、emoji、描述、五阶段预览图（小图轮播或网格）、盛放图、价格

**Tab 2: 玩家商店（奠基种）**
- 由性状稳定工程产生的奠基种上架
- 玩家自定义价格
- 显示：花名、育种家、稀有度、盛放图、关键因子预览、价格
- 排序方式：「最新上架」「销量最高」「稀有度（UR→N）」
- UR 种子也可以上架（理论上极难，但不设限制）

### 6.2 商店 API 重构

```
GET /api/shop/seeds
  → 返回分类种子列表
  response: {
    system: SeedWithPreview[],    // 系统种子 + 盛放预览图
    player: FoundationSeed[],     // 玩家上架的奠基种
  }

GET /api/shop/seed/:id
  → 单个种子详情（含全部5张形态图 + 因子列表）

POST /api/shop/buy-seed
  → 不变，但支持购买玩家种子（自动计算分成）
```

### 6.3 每日结算

新增定时任务（cron 或 Phase 3 RabbitMQ 延迟队列）：

```
每天 00:00 UTC+8 执行：
1. 统计过去24小时每个玩家种子被购买的次数和金额
2. 按 80% 计算分成
3. 写入 TransactionLog (type: REVENUE_SHARE)
4. 更新 User.gold
5. 消息推送（Socket.io）
```

---

## 七、收获系统 → 仓库制

> **关键变更**：花朵收获后不再直接换金币，而是进入仓库。玩家自选出售或保留（用于基因工程）。

### 7.1 新收获流程

```
收获 BLOOMING 花朵
  │
  ├─ 1. 发放 XP（稀有度奖励 + 首达奖励）
  │      N: 15xp / R: 30xp / SR: 60xp / SSR: 150xp / UR: 300xp
  │
  ├─ 2. 判定并发放种子（100%掉落）
  │      → 种子进入背包（Seed 表，seedType=FUSION_DROP / INHERIT）
  │
  ├─ 3. 花朵标记 location=WAREHOUSE
  │      → 不再标记 consumedAt（保留完整数据用于出售/育种）
  │
  └─ 4. 释放 GardenSlot
```

**对比旧流程**：

| 项目 | 旧（Phase 1） | 新（Phase 1.5） |
|------|-------------|----------------|
| 花去向 | consumedAt 标记删除 | location=WAREHOUSE 保留 |
| 金币 | 收获时直接发放 | 仓库出售时发放 |
| XP | 收获时发放 | 收获时发放（不变） |
| 种子 | 不掉落 | 100%掉落 |
| 后续操作 | 无 | 出售 / 保留育种 / 指定母株 |

### 7.2 仓库 Schema

Flower 表新增 `location` 枚举：

```prisma
enum FlowerLocation {
  GARDEN     // 种植在花园槽位中
  WAREHOUSE  // 收入仓库（可出售/育种）
}

model Flower {
  // ... 原有字段
  location    FlowerLocation @default(GARDEN)
  sellPrice   Int?           // 预计算售价（入库时计算）
}
```

### 7.3 出售价格公式

```typescript
// === 融合花（parentAId !== null）===
sellPrice = rarityMultiplier[rarity] × (parentABasePrice + parentBBasePrice)

// 稀有度乘区
const RARITY_SELL_MULTIPLIER = {
  N: 1.0,
  R: 1.5,
  SR: 2.5,
  SSR: 5.0,
  UR: 10.0,
};

// parentABasePrice = 亲本A如果是基础花 → 其种子商店价 × 1.5
//                   亲本A如果是融合花 → 其自己的 sellPrice

// === 基础花（isShopSeed === true）===
sellPrice = seedPrice × 1.5
// 例：玫瑰种子 100g → 出售价 150g
// 加上必掉的种子（再种→再收→再卖），总收益约 2.5 倍

// === 奠基种后代 ===
sellPrice = seedPrice × 1.5  （与基础花相同，分开计算）
```

> **设计说明**：基础花收获不留花（因为是消耗品），只给 XP + 种子。融合花收获后入库，可出售换金或保留育种。

### 7.4 仓库 API

```
GET /api/warehouse
  → 返回仓库中所有花
  response: { flowers: WarehouseFlower[] }
  支持筛选：rarity、parentType（基础/融合）、可出售/不可出售

POST /api/warehouse/sell
  body: { flowerId }
  → 出售花朵，获得金币（sellPrice）
  → 花标记 consumedAt
  → TransactionLog: type=HARVEST_SELL

POST /api/warehouse/keep
  body: { flowerId }
  → 标记为「保留育种」（只是一个标签，实际保留在仓库中）

POST /api/warehouse/designate-stability
  body: { flowerId }
  → 指定为性状稳定工程的母株
  → 花必须已在仓库中
```

### 7.5 收获 API 变更

```
POST /api/garden/harvest
  body: { flowerId }
  → 旧：返回 { reward: { gold, xp } }
  → 新：返回 { xp, seedReceived, flowerMovedToWarehouse }
     gold = 0（需要通过仓库出售获得）
```

---

## 八、数据库 Schema 完整变更

### 8.1 Prisma Schema 新增/修改汇总

```prisma
// ========== Seed 表 ==========
model Seed {
  id               String   @id @default(uuid())
  name             String   @unique
  description      String   @default("")
  emoji            String   @default("🌱")
  priceGold        Int
  atomLibrary      Json     // 改为结构化: [{ atomId, guaranteed }]
  growthImages     Json?    // 新增: { seed, seedling, growing, mature, blooming }
  growTime         Int      @default(0)
  isActive         Boolean  @default(true)
  // 新增：奠基种商店
  isFoundationSeed Boolean  @default(false)
  foundationFlowerId String?
  sellerId         String?
  customPrice      Int?
  revenueShare     Float    @default(0.8)
  // 新增：掉落种子类型
  seedType         String   @default("SYSTEM") // SYSTEM / FUSION_DROP / FOUNDATION
  parentFlowerId   String?
  totalSold        Int      @default(0)   // 总销量
  createdAt        DateTime @default(now())
}

// ========== Flower 表 ==========
enum FlowerLocation {
  GARDEN
  WAREHOUSE
}

model Flower {
  // ... 原有字段
  location            FlowerLocation @default(GARDEN) // 新增：花的位置
  sellPrice           Int?           // 新增：预计算售价（入库时计算）
  // 新增：性状稳定
  isFoundation       Boolean  @default(false)
  stabilityProgress  Int      @default(0)
  stabilityTargetId  String?
  foundationName     String?
  // 新增：生长期图片
  growthImageSeed    String?  // 指向哪个 Seed 的品种名（用于取生长期图片）
  growthImageUrl     String?  // BLOOMING 的 SD 图
  // 修改：atoms 现在是结构化对象数组
  atoms              Json     // [{ id, category, level, score, prompt_chinese, prompt_en }]
  factorScore        Int      @default(0)  // 新增：因子总积分
}

// ========== TransactionLog ==========
// 新增 type:
// REVENUE_SHARE — 商店分成收入
// HARVEST_SELL  — 仓库出售花朵收入

// ========== User 表 ==========
model User {
  // ... 原有字段
  title     String?  // 新增：称号（如"玫瑰育种家"）
}
```

### 8.2 新增配置表（可选，或用 JSON 文件）

如果希望运行时查询/修改（而非部署时更新 YAML），可以加配置表：

```prisma
model AtomDefinition {
  id            String  @id
  category      String
  promptChinese String
  promptEn      String
  level         String  // N/R/SR/SSR/UR
  score         Int
  incompatible  String[] // 互斥因子 id 列表
}

model FusionRule {
  id            String  @id
  name          String
  conditionType String  // color_count / atom_present / category_count
  conditionJson Json
  resultJson    Json
  priority      Int     @default(0)  // 优先级（数字越大越先匹配）
}
```

> **Phase 1.5 建议**：先用 YAML 文件 + 启动时加载到内存，Phase 3+ 再迁移到数据库配置表。

---

## 九、Prompter 构建器重构

### 9.1 AI Gateway 端变更

`services/prompt_builder.py` 需要重写以支持结构化因子：

```python
def build_prompt(atoms: list[dict], rarity: str) -> str:
    """
    从结构化原子列表构建 SD prompt。

    atoms: [{ id, category, prompt_chinese, prompt_en, level, score }]
    rarity: N/R/SR/SSR/UR
    """
    # 分类分组
    categorized = {}
    for atom in atoms:
        cat = atom.get("category", "other")
        categorized.setdefault(cat, []).append(atom)

    # 基础画质词
    parts = [
        "masterpiece, best quality, highly detailed",
        "beautiful flower, botanical illustration",
        "single flower, centered, white background",
    ]

    # 按分类添加
    order = ["size", "petal_shape", "petal_color", "petal_texture",
             "stamen", "leaf_shape", "stem_type", "fragrance", "special"]
    for cat in order:
        if cat in categorized:
            for atom in categorized[cat]:
                parts.append(atom.get("prompt_en", atom.get("id", "")))

    # 稀有度修饰词
    rarity_mods = {
        "N": "simple flower",
        "R": "elegant flower, refined details",
        "SR": "exquisite flower, intricate details, magical subtle glow",
        "SSR": "magnificent flower, divine details, ethereal glow, particle effects",
        "UR": "legendary flower, celestial radiance, impossible beauty, divine manifestation"
    }
    parts.append(rarity_mods.get(rarity, ""))

    return ", ".join(filter(None, parts))
```

### 9.2 一键生成基础花五阶段图

新增 AI Gateway 端点：

```
POST /generate-growth-set
  → 批量生成某种子的5张阶段图
  body: {
    seedName: "玫瑰",
    atoms: [...],
    rarity: "N"
  }
  response: {
    seedling: "url",
    growing: "url",
    mature: "url",
    blooming: "url",
  }
```

后端逻辑：
```python
stages = {
    "seedling": "young seedling just sprouting from soil, two tiny leaves",
    "growing": "young plant with developing flower bud, green leaves",
    "mature": "plant with large closed flower bud about to bloom",
    "blooming": "fully bloomed flower in full glory",
}
for stage, modifier in stages.items():
    prompt = build_prompt(atoms, rarity) + f", {modifier}, white background"
    # generate with SD...
```

---

## 十、测试与调试支持

### 10.1 调试模式

在 `.env` 中添加：

```
DEBUG_MODE=true
DEBUG_USER_IDS=uuid1,uuid2   # 允许调试的用户
```

调试模式下提供的功能：

| 功能 | API | 说明 |
|------|-----|------|
| 直接设置花朵稀有度 | `POST /api/debug/set-rarity` | body: { flowerId, rarity } |
| 强制生长到指定阶段 | `POST /api/debug/set-stage` | body: { flowerId, stage } |
| 快速稳定化 | `POST /api/debug/boost-stability` | body: { flowerId, count } |
| 获取任意因子组合的花 | `POST /api/debug/spawn-flower` | body: { atomIds[], rarity, stage } |
| 模拟两次嫁接 | `POST /api/debug/simulate-stabilization` | 自动完成10次相似嫁接 |
| 查看所有因子列表 | `GET /api/debug/atoms` | 返回所有已加载因子 |
| 查看融合规则 | `GET /api/debug/fusion-rules` | 返回所有融合规则 |

### 10.2 调试模块实现

```typescript
// server/src/modules/debug/debug.module.ts
// 仅在 DEBUG_MODE=true 时注册
@Module({
  controllers: [DebugController],
  providers: [DebugService],
})
export class DebugModule implements OnModuleInit {
  onModuleInit() {
    if (process.env.DEBUG_MODE !== 'true') {
      throw new Error('Debug module loaded without DEBUG_MODE=true');
    }
  }
}
```

---

## 十一、因子加载器设计

### 11.1 启动流程

```
NestJS 启动
  → AtomLoaderService.onModuleInit()
    → 读取 config/atoms/*.yaml
    → 验证因子（无重复 id、category 引用正确）
    → 加载融合规则
    → 加载形容词池
    → 构建内存索引（byId / byCategory / byLevel）
    → 提供给 FusionService 使用
```

### 11.2 热重载（可选）

```typescript
// POST /api/admin/reload-atoms
// 重新加载因子配置（不重启服务）
```

---

## 十二、实施计划（分 Part）

### Part 1: 因子系统基础设施
- [ ] 创建 `server/config/atoms/` 及所有 YAML 文件（含 `ATOM_SPEC.md` 操作手册）
- [ ] 实现 `AtomLoaderService`（YAML 加载 + 验证 + 内存索引）
- [ ] 更新 `Seed` 种子数据（atomLibrary 结构化）
- [ ] 更新 Prisma Schema（Flower 新增 location/factorScore/stabilityProgress 等字段；Seed 新增 growthImages/isFoundationSeed 等）
- [ ] 修改 `FusionService.mergeAtoms()` 为概率继承算法
- [ ] 实现 `FusionService.calculateScore()` 积分计算

### Part 2: 融合规则与稀有度重构
- [ ] 实现 `FusionRuleEngine`（按优先级匹配条件 → 产生融合因子）
- [ ] 实现新稀有度概率表（积分挡位映射）
- [ ] 实现形容词池抽取
- [ ] 重构 `POST /api/fusion` 返回数据结构

### Part 3: 收获系统 → 仓库制
- [ ] Prisma: Flower 新增 `location` 枚举 (GARDEN/WAREHOUSE) + `sellPrice`
- [ ] 新增 `WarehouseModule`（列表/出售/保留/指定母株）
- [ ] 重构 `POST /api/garden/harvest`：发 XP + 必掉种子 + 花入库（不发金币）
- [ ] 实现出售价格公式（稀有度乘区 × 亲本价值和）

### Part 4: 图片系统升级
- [ ] Seed 表添加 `growthImages` 字段
- [ ] AI Gateway 新增 `/generate-growth-set` 端点
- [ ] Flower 表添加 `growthImageSeed` / `growthImageUrl`
- [ ] 前端更新：成长阶段显示对应图片
- [ ] 融合花：GROWING/MATURE 显示父本图，BLOOMING 显示 SD 图

### Part 5: 性状稳定工程
- [ ] 新增 `foundation` 模块（母株指定、进度追踪）
- [ ] 嫁接后自动判定是否「相似」（稀有度一致 + 基因差≤3）→ 推进 stabilityProgress
- [ ] 实现奠基种认证（累计10次相似）→ 称号 + 无限种子 + 商店上架权限
- [ ] 称号系统（User.title 字段）

### Part 6: 商店重写
- [ ] Shop 模块拆分为 SystemShop + PlayerShop（双 Tab）
- [ ] PlayerShop：上架/下架/定价/排序（最新/销量/稀有度）
- [ ] 每日结算 cron job + 80% 分成
- [ ] 前端：双 Tab 商店面板 + 盛放图预览 + 稀有度排序切换

### Part 7: 调试模块
- [ ] 实现调试 API（set-rarity / set-stage / boost-stability / spawn-flower / simulate-stabilization）
- [ ] 配置 DEBUG_MODE 开关 + DEBUG_USER_IDS 允许名单
- [ ] 编写完整的性状稳定工程端到端测试脚本

---

## 十三、关键设计决策（已确认）

| # | 决策点 | 决定 | 理由 |
|---|--------|------|------|
| 1 | 因子存储方式 | **YAML文件（Phase 1.5），后续按需迁移** | 快速迭代，策划可直接编辑，Git diff 友好 |
| 2 | 多倍体视觉表现 | **调整 prompt 修饰词强度，不新增因子** | 保持系统简洁，避免因子爆炸 |
| 3 | 矛盾融合匹配 | **按优先级单次触发，每条规则只触发一次** | 避免连锁反应 |
| 4 | 性状差异计算 | **基于去重集合差，不考虑多倍体次数** | 形容词池随机抽取天然产生差异 |
| 5 | 收获种子掉落 | **100%掉落** | 统一规则，简化心智模型 |
| 6 | 融合花生长图 | **BLOOMING 才切 SD 图** | 给 SD 充足生成时间 |
| 7 | 商店分成结算 | **每日 cron job 结算** | 简单可靠 |
| 8 | UR 稀有度上限 | **始终 ≤1%（100分时回落到1%）** | UR 必须永远稀有 |
| 9 | 收获流程 | **仓库制 → 先入库再出售** | 支持育种保留 + 稀有度定价 |
| 10 | 生长时间 | **Phase 1.5 仍用手动推进**（肥料系统后续考虑） | 方便测试 |
| 11 | 商店稀有度排序 | **支持按稀有度排序（UR→N）** | 玩家需求 |
| 12 | 因子/融合词表可扩展性 | **编写 ATOM_SPEC.md + 验证器，做成即插即用工程** | AI 可协助添加新因子 |

---

## 附录 A：完整因子列表（初版，约 48 个）

详见 `server/config/atoms/standard.yaml` 等文件（上文已列出全部初始因子）。建议每个稀有度至少包含 4-6 个因子以保证嫁接多样性。

## 附录 B：前端变更要点

1. **花园面板**：花朵卡片显示5阶段缩略图轮播 → 点击放大
2. **生长进度条**：融合花在 GROWING/MATURE 阶段显示「融合花成长中…X%」倒计时
3. **商店面板**：双 Tab（系统/玩家）+ 花朵预览大图 + 排序切换（最新/销量/稀有度）
4. **仓库面板**（新增）：花朵列表 + 出售按钮 + 保留育种标签 + 指定母株
5. **融合结果弹窗**：显示基因继承情况（哪些因子被继承了，哪些丢失了，哪些融合了）
6. **性状稳定面板**：显示母株列表 + 进度条 + 已认证奠基种列表
7. **称号展示**：用户头像旁显示育种家称号徽章
