---
name: feat
description: 自动化功能分支的完整开发流程：创建分支 → 开发 → 代码审查 → 提交 → 合并 → 推送。用法：/feat <功能名称>
---

# 功能分支开发

自动化功能分支的完整开发流程：创建分支 → 开发 → 代码审查 → 提交 → 合并 → 推送。

## 参数

- `$ARGUMENTS` — 功能名称（kebab-case），例如 `event-bus`、`object-pool`

## 流程

### 1. 创建并切换到功能分支

```bash
git checkout -b feat/$ARGUMENTS
```

### 2. 等待用户完成开发

输出以下提示后暂停，等待用户明确表示"开发完成"或"继续"：

> ✅ 已切换到 `feat/$ARGUMENTS` 分支。
>
> 请完成功能开发后告诉我"继续"。

### 3. 代码审查

自动读取以下文件（如果存在）并进行审查：

- `src/mod/contract/$ARGUMENTS.ts` — 模块契约/接口
- `src/mod/$ARGUMENTS.ts` — 模块实现
- `src/$ARGUMENTS.ts` — 根级模块（如果不在 mod 目录下）
- `src/mod/$ARGUMENTS/index.ts` — 模块入口（如果是目录结构）

审查要点：
- 命名规范是否符合 CLAUDE.md 要求（PascalCase 类、camelCase 方法、kebab-case 文件名）
- 是否正确使用 Cocos Creator 3.8+ API，无废弃 API
- 导出是否完整（index.ts 统一导出）
- 类型安全性（strict 模式，=== 严格比较）
- 性能原则（无 update 耗时操作、对象池复用等）

输出审查报告后等待用户确认：

> 📋 代码审查完成。
>
> - ✅ [通过项]
> - ⚠️ [警告项]
> - ❌ [问题项]
>
> 是否确认提交？如有问题请先修复。

### 4. 提交代码

用户确认后执行提交：

```bash
# 查看变更
git status
git diff --staged

# 添加相关文件（不使用 git add -A）
git add src/

# 提交，使用 conventional commit 格式
git commit -m "feat($ARGUMENTS): <简短描述>"
```

提交信息格式遵循 Conventional Commits：`feat(范围): 简短描述`。

### 5. 合并到 develop 分支

```bash
# 检查是否有未提交的更改需要暂存
# 如果有则 git stash，没有则跳过

git checkout develop
git merge --no-ff feat/$ARGUMENTS -m "Merge branch 'feat/$ARGUMENTS' into develop"

# 如果之前 stash 了则 git stash pop

git branch -d feat/$ARGUMENTS
```

### 6. 推送到远程

```bash
git push origin develop
```

完成后输出总结：

> 🎉 功能 `feat/$ARGUMENTS` 开发流程完成！
>
> - 分支已合并到 develop 并推送
> - 本地功能分支已删除

## 注意事项

- 每个步骤执行前向用户确认，不要静默执行
- 如果 git 操作失败（如合并冲突），立即停止并报告问题
- 始终使用中文与用户沟通
- 遵循 CLAUDE.md 中的所有规范要求
