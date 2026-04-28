# Atom Engineering Spec — 因子工程操作手册

> 本文档面向任何需要添加新因子的人（包括 AI agent）。遵循此规范即可扩展因子系统，无需修改代码。

---

## 快速开始：添加一个新因子

**场景**：你想添加一个「虎斑纹花瓣」（稀有 R 级）。

### 步骤 1：确认分类存在

打开 `categories.yaml`，确认 `petal_texture`（花瓣质地）已存在。如果不存在 → 先注册分类（见下文）。

### 步骤 2：确定稀有度

| 稀有度 | 积分 | 文件 | 设计建议 |
|--------|------|------|---------|
| N | 1 | `standard.yaml` | 常见特征（红花、圆瓣、清香……） |
| R | 5 | `rare.yaml` | 非典型但可能自然出现的变异 |
| SR | 10 | `precious.yaml` | 罕见、有视觉冲击的特征 |
| SSR | 20 | `epic.yaml` | 奇迹般的、几乎不存在的特征 |
| UR | 50 | `legendary.yaml` | 传说级、颠覆认知的特征 |

斑纹 → R 级 → `rare.yaml`

### 步骤 3：追加因子条目

在 `rare.yaml` 的 `atoms:` 列表末尾追加：

```yaml
  - id: "虎斑纹"
    category: petal_texture
    prompt_chinese: "虎斑条纹花瓣"
    prompt_en: "tiger-striped petals"
    level: R
    score: 5
    incompatible: ["纯色"]
    description: "花瓣上有类似虎纹的深色条纹，稀有变异"
```

### 步骤 4：验证

重启服务，`AtomLoaderService` 会自动验证。如果报错，检查：
- `id` 是否与已有因子重复
- `category` 是否在 `categories.yaml` 中已定义
- `level` 是否与文件名一致（rare.yaml 只能放 R 级因子）
- `score` 是否匹配 level（R → 5）

---

## 添加新分类

**场景**：你想添加「花期特征」（bloom_time）。

### 步骤 1：注册分类

在 `categories.yaml` 中追加：

```yaml
  bloom_time:
    label: "花期特征"
    weight: 1.0
```

### 步骤 2：在因子文件中使用

```yaml
  - id: "夏花"
    category: bloom_time
    prompt_chinese: "夏季盛开"
    prompt_en: "summer blooming"
    level: N
    score: 1
    description: "只在夏季盛开的花朵"
```

---

## 添加新融合规则

在 `fusion_rules.yaml` 的 `rules:` 列表末尾追加：

```yaml
  - name: "尖刺+红花→荆棘"
    description: "红花与尖刺茎共存产生荆棘变异"
    priority: 75
    condition:
      type: atom_present
      atom_ids: ["尖刺茎", "红花"]
    result:
      replace_atoms: ["尖刺茎"]
      produce_atom: "金属光泽"
      prompt_modifier: "thorny stem wrapped in metallic sheen"
```

**⚠️ 重要**：`produce_atom` 必须是已在 `atoms/*.yaml` 中定义过的因子 id。不能凭空创造。

---

## 三种条件类型

### `color_count` — 颜色种类计数

检查某分类下**去重后的因子种类数**是否达到阈值。

```yaml
condition:
  type: color_count
  min_count: 7
  categories: [petal_color]
```

可选 `max_count` 字段指定上限。

### `atom_present` — 指定原子全部存在

检查指定的因子 id 是否**全部**被继承。

```yaml
condition:
  type: atom_present
  atom_ids: ["重瓣", "单瓣"]
```

### `category_count` — 分类内因子计数

检查某分类下**所有因子数（含重复/多倍体）**是否达到阈值。

```yaml
condition:
  type: category_count
  min_count: 3
  categories: [fragrance]
```

---

## 自动验证规则

服务启动时，`AtomLoaderService` 执行以下验证：

| # | 检查项 | 失败处理 |
|---|--------|---------|
| 1 | `category` 在 `categories.yaml` 中已定义 | 跳过该因子 + 打印错误 |
| 2 | `id` 全局唯一（跨所有 atom 文件） | 跳过该因子 + 打印错误 |
| 3 | `incompatible` 中引用的 id 存在 | 跳过该因子 + 打印错误 |
| 4 | `level` 与文件级别一致 | 跳过该因子 + 打印错误 |
| 5 | `score` 与 level 匹配 | 跳过该因子 + 打印错误 |
| 6 | 融合规则 `produce_atom` 在 atom 文件中存在 | 跳过该规则 + 打印错误 |
| 7 | 融合规则 `replace_atoms` 中的 id 存在 | 跳过该规则 + 打印错误 |

> 设计意图：**不崩溃**。有错的因子/规则跳过，正确的继续使用。方便增量开发时定位问题。

---

## 目录结构

```
server/config/atoms/
├── ATOM_SPEC.md         ← 你正在读的文件
├── categories.yaml      ← 分类定义
├── standard.yaml        ← N 级因子 (积分 1)
├── rare.yaml            ← R 级因子 (积分 5)
├── precious.yaml        ← SR 级因子 (积分 10)
├── epic.yaml            ← SSR 级因子 (积分 20)
├── legendary.yaml       ← UR 级因子 (积分 50)
├── fusion_rules.yaml    ← 矛盾融合规则
└── adjective_pools.yaml ← 稀有形容词池
```
