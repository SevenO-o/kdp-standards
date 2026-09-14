# 自动准备安装配置

仅在助手或启动配置缺失时使用。正常开发由 Skill 直接运行 `source`，无需重复安装。

1. 使用本 Skill 固定的公开仓库 `https://github.com/SevenO-o/kdp-standards`。在业务项目之外选择新目录克隆；已有干净副本可以 `git pull --ff-only`。无需 GitHub 登录、令牌或邀请。
2. 读取 `docs/Git仓库安装.md` 和 `distribution/client.json`，核对助手归档 SHA-256，检查归档路径后解压到新临时目录，再读取包内 `INSTALL_AGENT.md`。
3. 按安装说明使用实际 Skill 目录完成安装和公司启动配置，保留用户身份及项目文件。已有目标目录时，安装器可通过 `--replace` 备份后写入。不要把这些步骤交回用户手工执行，也不要求用户再次复制仓库提示词。
4. 用实际安装的助手运行 `source`。`state: ready`、`cached: false` 和提交号表明本次已连接公开仓库。报告实际结果后继续原来的开发任务。

用户需先让 Agent 安装 KDP Skill 一次；之后可直接描述工具需求，由 Skill 自动处理规范获取。不处理历史版本兼容或旧来源迁移。
