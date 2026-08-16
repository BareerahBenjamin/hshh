# HsHH Online

上线范围：观众报名、选手项目提交、全场项目 Dashboard、观众一人一票、志愿者贡献页，以及 Cloudflare Access 保护的管理员后台。

## 本地运行

1. 安装依赖：`npm install`
2. 复制并填写环境文件：`cp .env.example .env`
3. 构建前端：`npm run build`
4. 初始化本地 D1：`npm run db:migrate:local`
5. 启动 Worker：`npx wrangler dev --local --port 8787`
6. 打开：`http://127.0.0.1:8787/audience`

本地完整流程请使用 Worker 启动方式；它会同时提供静态页面和本地 D1 API。

## 线上部署清单

1. 登录 Cloudflare：`npx wrangler login`
2. 创建 D1：`npx wrangler d1 create hshh-online`
3. 把返回的 `database_id` 填到 `.env` 的 `HSHH_D1_DATABASE_ID`
4. 在 `.env` 填写 `HSHH_SUBMISSION_BUCKET_NAME`，然后只需一次执行 `npm run storage:create` 创建 R2 文件桶
5. 把二维码图片地址填到 `.env` 的 `SUCCESS_QR_URL`
6. 同步公开配置：`npm run cf:sync-env`
7. 执行远程迁移：`npm run db:migrate:remote`
8. 配置 Cloudflare Access，保护路径 `/admin*`，允许管理员邮箱访问
9. 部署：`npm run worker:deploy`

`wrangler.jsonc` 已配置 custom domain：`hshh.online`。如果 Cloudflare 账号内还未接入该域名，需要先把域名 DNS 托管到 Cloudflare。

## .env 字段说明

- `ENVIRONMENT`：本地开发用，保持 `development`
- `HSHH_DEPLOY_ENVIRONMENT`：线上 Worker 用，保持 `production`
- `HSHH_DOMAIN`：线上域名，默认 `hshh.online`
- `HSHH_D1_DATABASE_ID`：D1 创建后返回的 database id
- `HSHH_SUBMISSION_BUCKET_NAME`：赛事提交文件保存使用的 Cloudflare R2 bucket 名称
- `SUCCESS_QR_URL`：成功页二维码图片 URL
- `VITE_API_BASE`：只在单独跑 Vite 前端时需要；用 Wrangler 看本地完整站点时保持空

选手提交中的 Pitch PPT 原文件、PDF 备份和 A4 海报电子版会直接上传到私有 R2 文件桶；AIGC Demo 视频只接受 B 站播放页或短链接。公开 Dashboard 只显示海报，不会公开 PPT 文件地址。

## 已实现路由

- `/` 与 `/audience`：观众报名表单
- `/success/:id`：报名成功页
- `/admin`：报名后台
- `/admin/events`：赛事、签到、投票后台
- `/submit`：选手项目提交
- `/dashboard`：公开全场项目 Dashboard，不显示排名
- `/vote`：观众投票页；必须已报名、状态有效、已签到
- `/volunteers`：志愿者贡献页

## API

- `POST /api/register`
- `POST /api/lookup`
- `POST /api/projects`
- `POST /api/submission-files`
- `GET /api/submission-files/:key`
- `GET /api/dashboard`
- `POST /api/vote/identity`
- `POST /api/votes`
- `GET /api/admin/registrations`
- `GET /api/admin/registrations/:id`
- `GET /api/admin/export.csv`
- `PATCH /api/admin/registrations/:id/check-in`
- `GET /api/admin/event-dashboard`
- `PUT /api/admin/voting-config`
- `PATCH /api/admin/projects/:id`
- `GET /api/admin/votes/export.csv`
