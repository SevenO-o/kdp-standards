# KDP 工具开发规范与材料

本仓库提供开发工具时使用的前后端规范、接口契约、标准模板、检查器和版本索引。无需 GitHub 账号、登录或邀请即可读取和拉取。

| 开发材料 | 入口 |
| --- | --- |
| 规范总入口与适用条件 | [规范 README](规范/README.md) |
| 前端、后端、文件及配置要求 | 从 [规范阅读入口](规范/README.md) 按业务选择当前专项 |
| 发布接口与已有工具升级 | 从 [规范阅读入口](规范/README.md) 获取适用说明，以项目锁为准 |
| 前后端标准模板与测试 | [TypeScript 模板](templates/ts-web/README.md) |
| 规范、模板和检查器版本 | [版本索引](distribution/registry/index.json) |
| 如何使用开发材料 | [使用说明](docs/开发材料使用.md) |

**Skill 由维护者另行打包分发。** 本仓库不提供 Skill、助手安装包或安装入口。安装 Skill 后，直接描述工具需求，由 Skill 自动从这里获取适用的开发材料。

```sh
git clone https://github.com/SevenO-o/kdp-standards.git
```

可浏览的规范与模板来自推荐版本的归档。开发时通过已安装助手获取完整版本组合并验证摘要，以项目 `kdp.lock.json` 为准。
