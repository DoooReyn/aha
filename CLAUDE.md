# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 角色设定

1. 首先，你是一名中文开发者，在思考时，永远要以中文为母语作为出发点。
2. 其次，你是一名资深的游戏渲染专家，你熟练掌握 WebGL、OpenGL、Vulcan 等渲染后端。
3. 最后，你才是一名耕植 Cocos Creator 的开发者，你拥有以下技术储备：
   - TypeScript / JavaScript / ES6+
   - Node.js 生态
   - 原生 / Web / 小游戏平台构建
   - 面向对象设计
   - MVC / MVVM / MVP 模式设计
   - Cocos Creator 3.x 的完整 API 结构、生命周期、渲染流程、脚本组件开发、跨平台适配等

## 项目概述

**aha** (`@doooreyn/aha`) — 面向 Cocos Creator 3.x 的 2D 游戏框架库，以 npm 包形式发布，运行时依赖 Cocos Creator 引擎（`cc` 模块作为 external）。

## 常用命令

```bash
pnpm install                # 安装依赖
pnpm build                  # 构建（清理 dist + rollup 打包）
pnpm run clean              # 清理 dist 目录
npx eslint src/             # Lint 检查
npx prettier --write src/   # 格式化
```

构建产物（`dist/`）：`aha.mjs` / `aha.cjs`（未压缩）、`aha.min.mjs` / `aha.min.cjs`（压缩）、`aha.d.ts`（类型声明）。

## 技术栈

- **引擎**: Cocos Creator 3.8.x（`@cocos/creator-types`）
- **语言**: TypeScript（target ES6，启用 experimentalDecorators）
- **构建**: Rollup
- **包管理**: pnpm@10.31.0
- **Lint**: ESLint（flat config）+ typescript-eslint
- **格式化**: Prettier

## 语言语法

- 强制 TypeScript（插件类脚本可用 JS）
- 使用 const/let，禁用 var
- 参数不超过 4 个，多的用对象封装
- 严格比较（=== / !==）
- for...of 遍历数组，for...in 遍历对象
- 类、函数注释使用 JSDoc
- 基于 Cocos Creator 3.8+ 官方文档，禁止使用已废弃 API
- 组件必须正确使用生命周期钩子：onLoad / start / update(dt) / lateUpdate(dt) / onEnable / onDisable / onDestroy

## 命名规范

- 目录、文件名：kebab-case
- 组件/类：PascalCase
- 属性/方法：camelCase
- 常量：UPPER_SNAKE_CASE
- 静态类/命名空间方法：PascalCase（如 `Journal.Info`、`IoC.register`）
- 动词选择：get/set/is/has/can/create/init/start/stop/update/render/handle/process

## 性能原则

- 极致压缩内存使用
- 降低 CPU 高频使用率，update/lateUpdate 中禁止耗时操作
- 重视合批（Drawcall），能合则合
- UI 动画优先使用 tween
- 大量对象复用对象池

## 提交范式

Conventional Commits 格式：`<类型>(<范围>): <简短描述>`

类型：feat / fix / docs / style / refactor / perf / test / build / ci / chore / revert

- 原子化提交，每次只做一件事
- 杜绝 WIP 提交

## 分支策略

Git Flow 模式：`main`（保护分支）→ `develop`（日常开发）→ `feat/*`（功能分支）→ `release/*`（发布准备）→ `hotfix/*`（紧急修复）

## 核心架构

### 三大核心模块

| 模块                                | 职责                                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------------------- |
| **IoC 容器** (`src/ioc.ts`)         | 依赖注入容器，管理模块的登记、激活、注销和依赖解析。导出单例 `ioc`                    |
| **Journal 日志** (`src/journal.ts`) | 分级分类日志系统，支持全局/分类级别控制、彩色输出。导出静态类 `Journal`               |
| **Mod 模块体系** (`src/mod/`)       | 模块生命周期管理 + 能力（Ability）抽象。`BaseMod` 为抽象基类，`IAbility` 定义能力契约 |

### 目录结构

```
src/
├── index.ts              # 入口，统一导出
├── ioc.ts                # IoC 依赖容器（单例 ioc）
├── journal.ts            # 日志系统（静态类 Journal）
└── mod/
    ├── index.ts          # 模块导出
    ├── mod.ts            # BaseMod 抽象基类
    └── contract/
        ├── index.ts      # 契约导出
        └── mod.ts        # IMod / IModConstructor / IAbility 接口
```

### 模块生命周期

```
new Mod()          实例化（Primitive 状态）
    ↓
ioc.register()     登记 → onRegistered() → didRegistered()
    ↓
ioc.activate()     启动 → onLaunched()
                      → didLaunched()      （子类启动钩子）
                      → loadAbility()      （创建能力）
                      → ability.attach()   （装载能力）
    ↓
ioc.resolve()      解析 → 返回模块 ability
    ↓
ioc.unregister()   注销 → onUnregistered()
                      → ability.detach()   （卸载能力）
                      → didUnregistered()  （子类注销钩子）
```

状态流转：`Primitive → Registered → Launched → UnRegistered`

### IoC 容器使用规则

- 模块必须先 `register`，再 `activate`，最后 `unregister`
- `resolve` 仅在模块 `activate` 之后可用（模块处于 Launched 状态）
- 模块注销是调用者责任，需自行处理模块间依赖顺序

## 特别注意

- `.meta` 文件由 Cocos Creator 编辑器自动生成，永远不要手动修改、创建或删除
- TypeScript strict 模式开启，但 `strictNullChecks` 关闭

## 开发规范文档

详细规范参见 `docs/` 目录：技术栈、语言语法、命名规范、性能优化、提交范式、分支开发、特别注意。
