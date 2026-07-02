# 发布

本地仓库已按 `main` 分支组织。首次发布到 GitHub 前，需要本机 GitHub CLI 已登录。

## 登录检查

```bash
gh auth status
```

若未登录：

```bash
gh auth login
```

## 创建公开仓库并推送

```bash
gh repo create sgs-helper-sht-arena-addon --public --source . --remote origin --push
```

## 已有远端仓库时

```bash
git remote add origin https://github.com/<owner>/sgs-helper-sht-arena-addon.git
git push -u origin main
```

`<owner>` 改为自己的 GitHub 用户名或组织名。
