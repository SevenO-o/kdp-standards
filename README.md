# KDP 工具开发规范

无需 GitHub 账号、登录或邀请，即可读取规范、安装助手和获取工具模板。

首次安装时，把下面的话发给 Agent：

> 从 https://github.com/SevenO-o/kdp-standards 克隆或更新仓库，阅读 docs/Git仓库安装.md，帮我安装或更新 KDP。保留已有发布身份、工具绑定和版本锁，验证规范从公开仓库拉取。

安装后直接说“使用 KDP 创建一个……工具”即可。Skill 内置公开仓库入口，自动获取规范并继续开发，不需要再复制仓库地址或安装提示词。

- [Skill 自动执行入口](skills/kdp/SKILL.md)
- [安装与更新](docs/Git仓库安装.md)
- [规范阅读入口](规范/README.md)
- [使用者说明](docs/使用者快速开始.md)
- [当前助手安装包索引](distribution/client.json)
- [规范、模板和检查器版本索引](distribution/registry/index.json)

```sh
git clone https://github.com/SevenO-o/kdp-standards.git
```

助手会拉取推荐组合，校验产物摘要并生成项目版本锁。已有工具继续使用锁定规范，明确升级后才采用新版。

本仓库提供工具开发材料。工具发布和运行仍使用公司内网平台；公开规范不授予他人工具的发布、修改或管理权限。
