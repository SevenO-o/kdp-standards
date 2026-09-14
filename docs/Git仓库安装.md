# 从 Git 仓库安装和获取规范

公开规范仓库：https://github.com/SevenO-o/kdp-standards 。无需 GitHub 账号、登录或成员邀请即可读取与克隆。获取规范不需要 KDP 发布身份；发布、更新和回滚工具仍由公司平台验证所有者。

把下面的话交给 Agent：

> 从 https://github.com/SevenO-o/kdp-standards 克隆或更新仓库，阅读 docs/Git仓库安装.md，按说明安装或更新 KDP 助手，把规范来源切换到该 Git 仓库。保留已有发布身份、工具绑定和版本锁，验证规范确实从 Git 拉取。

## 安装或更新

需要 Node.js 24、npm 和 Git。公开仓库支持匿名 HTTPS 拉取，不要要求用户登录 GitHub、提供令牌或申请邀请。

在用户选定的目录克隆；已有本仓库副本时先检查改动和 remote，仅在干净、未分叉时 `git pull --ff-only`，否则保留改动，另外克隆到空目录。不要在业务工具目录中覆盖源码。

```sh
git clone https://github.com/SevenO-o/kdp-standards.git
cd kdp-standards
```

读取 `distribution/client.json`，取得助手的文件路径、版本和摘要；核对归档 SHA-256 后解压到项目外的新临时目录，阅读其中 `INSTALL_AGENT.md`。包内已包含独立助手、安装器和公开 API 证书，无需在同事电脑安装本仓库开发依赖或从源码构建。

从实际解压目录运行：

```sh
node install.mjs \
  --platform-id kdp-local \
  --platform-url http://10.8.3.182:17400 \
  --index-url 'git+https://github.com/SevenO-o/kdp-standards.git#main:distribution/registry/index.json' \
  --allow-intranet-http
```

已有安装时追加 `--replace`，安装器备份原 Skill 并沿用用户配置目录中的个人身份和项目记录。其他 Agent 用 `--skill-dir` 指定其实际 Skill 目录。此次切换只更改规范来源和助手；平台 ID 与发布目标保持原公司配置。

用实际安装的助手执行：

```sh
node "$HOME/.codex/skills/kdp/scripts/kdp.mjs" source
```

应返回 `state: ready`、`cached: false`、Git 提交号及推荐组合。`cached: true` 只证明缓存可用，不代表本次连接 GitHub 成功。安装不创建工具、不登记发布身份。

## 以后如何开发

- 新建工具：助手 `init` 自动拉取 `main` 的索引，固定这次 Git 提交，校验三类产物摘要，生成版本锁和 `docs/standards/`。
- 修改已有工具：保留 `kdp.lock.json`。`source` 查询仓库，`check` 获取同一锁定版本的检查器；恢复规范或升级时使用同一来源及现有迁移流程。
- 规范常规更新：维护者发布新组合后，新工具自动采用推荐版本，同事无需每次重装 Skill。已有工具按明确的升级需求迁移。
- Git 不可用：只允许已有索引及匹配摘要的完整缓存，缺少产物就报错；不会回退到服务器下载。
- 发布工具：仍连接公司 KDP 发布 API，由服务器验证支持组合、所有者和运行契约。

## 版本和访问范围

`规范/` 提供推荐规范的可浏览副本，开发时通过助手按 `distribution/registry/index.json` 下载完整、经过摘要校验的版本组合。不要把网页中的最新文件直接覆盖到旧项目。

公开仓库只提供规范、模板、检查器、开发助手和安装说明。公司平台的服务端源码、部署配置和运维记录由维护者在私有仓库管理。

已安装旧助手的用户按本页更新一次，之后常规规范更新自动从公开仓库获取。安装和来源切换保留原发布身份、工具绑定及版本锁。旧公司 HTTP 分发仍暂留兼容，不是新安装的规范来源。
