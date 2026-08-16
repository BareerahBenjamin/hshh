# HsHH Online

HsHH 线上赛事系统。当前包含观众报名、作品与海报提交、公开项目看板、观众投票、评委评分、志愿者贡献页，以及由 Cloudflare Access 保护的后台。

线上地址：<https://hshh.online>

## 当前入口

| 页面 | 地址 | 用途 |
| --- | --- | --- |
| 观众报名 | `/`、`/audience` | 观众报名、查询报名记录 |
| 报名成功 | `/success/:id` | 展示报名成功信息及入群二维码 |
| 作品提交 | `/submit` | 分别提交两版海报与完整路演材料 |
| 全场项目列表 | `/dashboard` | 公开展示已公开项目 |
| 观众投票 | `/vote` | 报名手机号核验后，从 18 个固定候选项目中选择一项投票 |
| 评委评分 | `/judge` | 6 位评委对 18 个项目逐队评分 |
| 志愿者贡献 | `/volunteers` | 志愿者贡献信息页 |
| 报名后台 | `/admin` | 报名记录、详情、删除、CSV 导出 |
| 项目后台 | `/admin/projects` | 项目与海报材料、文件下载、ZIP 打包 |
| 观众投票后台 | `/admin/events` | 投票开关、实时票数、投票 CSV 导出 |
| 评分统计后台 | `/admin/judging` | 评委进度、项目均分、评分 CSV 导出 |

`/admin*` 在线上由 Cloudflare Access 保护；本地开发不启用 Access。

完整域名关系见 [docs/DOMAIN-STRUCTURE.md](/Users/bareerah/Development/herstory%20hackathon/docs/DOMAIN-STRUCTURE.md)，前后端交接见 [docs/HANDOFF.md](/Users/bareerah/Development/herstory%20hackathon/docs/HANDOFF.md)。

## 技术结构

- 前端：Vite + React + TypeScript
- 后端：Cloudflare Workers（`worker/index.ts`）
- 关系数据：Cloudflare D1（`hshh-online`）
- 提交文件：Cloudflare R2（`hshh-submissions`，私有桶）
- 管理员保护：Cloudflare Access
- 部署配置：`wrangler.jsonc`

## 本地运行

1. 安装依赖：`npm install`
2. 创建本地配置：`cp .env.example .env`
3. 初始化本地数据库：`npm run db:migrate:local`
4. 启动完整本地站点：`npm run worker:dev`
5. 打开终端显示的本地地址，通常为 `http://127.0.0.1:8787/audience`

也可只检查构建：`npm run build`。

## 发布更新

1. 有新增 `migrations/*.sql` 时，先执行：`npm run db:migrate:remote`
2. 发布前后端：`npm run worker:deploy`
3. 用无痕窗口打开 `https://hshh.online` 验证页面；管理员页面需用 Access 允许的邮箱登录。

不要将 `.env` 提交到仓库。环境字段和上线检查清单在 [docs/HANDOFF.md](/Users/bareerah/Development/herstory%20hackathon/docs/HANDOFF.md)。
