# HsHH Online

第一阶段上线范围：观众报名页、报名 API、D1 数据库、报名查询、成功二维码页和管理员后台。

## 本地运行

1. 安装依赖：`npm install`
2. 复制并填写环境文件：`cp .env.example .env`
3. 构建前端：`npm run build`
4. 初始化本地 D1：`npm run db:migrate:local`
5. 启动 Worker：`npx wrangler dev --local --port 8787`
6. 打开：`http://127.0.0.1:8787/audience`

本地 `.env` 使用 Cloudflare Turnstile 测试 site key。开发环境没有配置 `TURNSTILE_SECRET_KEY` 时，后端会接受任意非空 Turnstile token；线上必须设置真实 secret 才会写入数据。

## 线上部署清单

1. 登录 Cloudflare：`npx wrangler login`
2. 创建 D1：`npx wrangler d1 create hshh-online`
3. 把返回的 `database_id` 填到 `.env` 的 `HSHH_D1_DATABASE_ID`
4. 创建 Turnstile widget，域名包含 `hshh.online`
5. 把 Turnstile site key 填到 `.env` 的 `VITE_TURNSTILE_SITE_KEY`
6. 把 Turnstile secret 填到 `.env` 的 `TURNSTILE_SECRET_KEY`
7. 把二维码图片地址填到 `.env` 的 `SUCCESS_QR_URL`
8. 同步公开配置：`npm run cf:sync-env`
9. 执行远程迁移：`npm run db:migrate:remote`
10. 配置 Cloudflare Access，保护路径 `/admin*`，允许管理员邮箱访问
11. 部署：`npm run worker:deploy`

`wrangler.jsonc` 已配置 custom domain：`hshh.online`。如果 Cloudflare 账号内还未接入该域名，需要先把域名 DNS 托管到 Cloudflare。

## .env 字段说明

- `ENVIRONMENT`：本地开发用，保持 `development`
- `HSHH_DEPLOY_ENVIRONMENT`：线上 Worker 用，保持 `production`
- `HSHH_DOMAIN`：线上域名，默认 `hshh.online`
- `HSHH_D1_DATABASE_ID`：D1 创建后返回的 database id
- `VITE_TURNSTILE_SITE_KEY`：Turnstile 前端 site key
- `TURNSTILE_SECRET_KEY`：Turnstile 后端 secret，只通过 `npm run cf:secret:turnstile` 上传，不写入 `wrangler.jsonc`
- `SUCCESS_QR_URL`：成功页二维码图片 URL
- `VITE_API_BASE`：只在单独跑 Vite 前端时需要；用 Wrangler 看本地完整站点时保持空

正式部署时，`npm run worker:deploy` 会从 `.env` 读取 `TURNSTILE_SECRET_KEY`，通过 Wrangler 的 secrets file 机制随代码一起上传，不会写入 `wrangler.jsonc`。如果以后只想单独轮换 Turnstile secret，可以运行 `npm run cf:secret:turnstile`。

## 已实现路由

- `/`：跳转到 `/audience`
- `/audience`：观众报名表单
- `/success/:id`：报名成功页
- `/admin`：报名后台

## API

- `POST /api/register`
- `POST /api/lookup`
- `GET /api/admin/registrations`
- `GET /api/admin/registrations/:id`
- `GET /api/admin/export.csv`
