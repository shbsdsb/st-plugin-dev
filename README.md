# persist

后端持久化服务插件(cordis)。

## 服务

- `persistJson` — JSON 保存/读取
- `persistEnv` — `.env`(`KEY=VALUE`)保存/读取
- `persistDb` — SQLite(`node:sqlite`)完整能力
- `credential` — Windows 凭据管理器(`PasswordVault`)

## 约定

- 所有落盘路径须能安全拼接在 `$ST_HOME` 之下(相对路径,禁止绝对路径/`..` 越界)。
- 零新增 registry 依赖;仅 `node:fs/promises`、`node:path`、`node:sqlite`、`node:child_process`(PowerShell)。
- 仅供后端 cordis 插件 `provide`/`inject` 使用。
