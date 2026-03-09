# 技术框架与 UI 规范（本工程）

通用说明已抽离，本页仅保留**本工程**的约定与索引。

- **通用技术栈、工程骨架、构建与代码约定** → [技术框架.md](./技术框架.md)
- **通用主题、全局样式、移动端与组件约定** → [UI规范.md](./UI规范.md)

---

## 一、本工程结构

```
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── docs/
│   ├── 技术框架.md           # 通用
│   ├── UI规范.md             # 通用
│   └── 技术框架与UI规范.md   # 本文（工程说明 + 索引）
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.less
    ├── theme/
    │   └── colors.less
    ├── games/
    │   ├── index.ts
    │   ├── fire-extinguisher/
    │   │   ├── Game.tsx
    │   │   ├── gameStore.ts
    │   │   ├── utils.ts
    │   │   ├── types.ts
    │   │   ├── constants.ts
    │   │   ├── styles.less
    │   │   ├── index.ts
    │   │   └── docs/
    │   │       └── 连连看-消防器材识别.md
    │   └── fire-equipment-rally/
    │       ├── Game.tsx
    │       ├── gameStore.ts
    │       ├── types.ts
    │       ├── constants.ts
    │       ├── styles.less
    │       ├── index.ts
    │       └── docs/
    │           └── 消防找茬.md
    └── vite-env.d.ts
```

- 游戏模块放在 `src/games/<游戏名>/`，可含组件、store、utils、types、constants、styles、`docs/`。

---

## 二、本工程路由

| 路径                       | 说明           |
| -------------------------- | -------------- |
| `/`                        | 重定向到 `/game/fire-extinguisher` |
| `/game/fire-extinguisher`  | 灭火器连连看   |
| `/game/fire-equipment-rally` | 消防器材总动员 |

---

## 三、文档索引

| 文档 | 说明 |
| ---- | ---- |
| [技术框架.md](./技术框架.md) | 通用技术栈、骨架、构建、代码约定 |
| [UI规范.md](./UI规范.md)   | 通用主题、样式、移动端、组件约定 |
| [连连看-消防器材识别](../src/games/fire-extinguisher/docs/连连看-消防器材识别.md) | 灭火器连连看规则 |
| [消防找茬](../src/games/fire-equipment-rally/docs/消防找茬.md) | 消防找茬（大家来找茬）规则与说明 |

新增页面或游戏模块时，技术选型与 UI 风格以通用文档为准，本页补充路由与结构即可。
