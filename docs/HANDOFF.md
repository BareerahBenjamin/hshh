# HsHH Online 前后端交接文档

## 1. 系统边界

本项目是一个单域名全栈应用。React 前端打包为静态资源，Cloudflare Worker 同时负责静态资源回退和 `/api/*` 后端接口。没有独立服务器、独立后端仓库或外部数据库。

| 层级 | 位置 | 责任 |
| --- | --- | --- |
| 页面路由与观众报名 | `src/main.tsx` | 观众报名、报名查询、成功页、后台入口路由 |
| 赛事页面 | `src/event-system.tsx` | 作品提交、Dashboard、投票、评委评分与对应后台页面 |
| 样式 | `src/styles.css` | 全站黑、白、粉视觉风格与响应式规则 |
| API 与业务校验 | `worker/index.ts` | 所有请求处理、D1/R2 读写、CSV/ZIP、Access 校验 |
| 数据库变更 | `migrations/*.sql` | 按编号顺序执行，线上不可跳过 |
| 发布脚本 | `scripts/deploy-worker.mjs` | 同步公开配置、构建、Worker 部署 |
| Worker 配置 | `wrangler.jsonc` | Worker、D1、R2、域名绑定、静态资源配置 |

## 2. 关键业务规则

### 观众报名

- 记录保存在 `registrations`，完整问卷保存在 `payload_json`，便于将来扩字段。
- 同一邮箱与手机号再次提交会更新原记录。
- 报名记录查询仍使用姓名、邮箱、微信号、手机号四项精确匹配。
- 线上管理员可查看、导出和删除记录。

### 项目与海报提交

- `/submit` 将海报与完整项目材料分开提交；两个流程共用项目名称和团队名称作为标识。
- 两版电子海报通过 `/api/projects/posters` 提交，截止时间写在 `worker/index.ts` 与 `src/event-system.tsx` 的 `posterSubmissionDeadline`。
- 完整材料通过 `/api/projects` 提交，包含 Demo 链接、B 站视频、PPT 原文件、PPT PDF、硬件实物/原型三视图，以及必填的 VidMuse 使用小记。
- 文件先上传私有 R2，数据库只保存 Worker 文件 URL。公开 Dashboard 不应暴露 PPT、PDF、三视图与 VidMuse 反馈。
- 管理员可对单个项目或所有项目打包下载 ZIP。

### 观众投票

- 投票候选名单固定为 18 个，定义在 `worker/index.ts` 的 `juryTeams`。
- 投票页只验证“报名手机号”；报名状态必须为 `submitted`。
- 一位报名观众只能投一票，约束由 `audience_project_votes.audience_id` 的唯一索引保证。
- 投票记录存储在 `audience_project_votes`。旧的 `votes` 表为历史兼容保留，不应再作为新投票入口的写入目标。
- 投票开关由管理员页面 `/admin/events` 控制；默认关闭时前端无法提交。

### 评委评分

- 评分页面：`/judge`；统计后台：`/admin/judging`。
- 当前评委名单为 6 个 mock 名称 `评委 01` 至 `评委 06`，在 `worker/index.ts` 的 `juryJudges` 中替换。
- 当前六项满分合计 100：人本价值 25、创新价值 20、技术实现 20、产品体验 15、产品化潜力 10、表达与故事 10。
- 每一维可以打 0 分；一个评委对同一项目重复保存会更新其原评分。

## 3. 数据库

| 表 | 用途 | 主要约束 |
| --- | --- | --- |
| `registrations` | 观众报名 | `email + phone` 唯一 |
| `projects` | 项目、海报、路演材料、VidMuse 反馈 | `team_key` 与 `project_number` 唯一 |
| `voting_config` | 投票是否开启及开始结束时间 | 固定 `id = 1` |
| `votes` | 早期投票表，保留兼容 | 不再写入新记录 |
| `audience_project_votes` | 当前观众投票记录 | `audience_id` 唯一，一人一票 |
| `jury_scores` | 评委评分 | `judge_name + team_key` 唯一 |
| `vote_audit_log` | 早期投票审计记录 | 关联旧 `votes` 表 |

新增字段或表时：

1. 新建下一个编号的 SQL，例如 `migrations/0009_xxx.sql`。
2. 先执行 `npm run db:migrate:local`。
3. 验证页面和接口后执行 `npm run db:migrate:remote`。
4. 再执行 `npm run worker:deploy`。

不要修改已经在线上执行过的迁移文件。

## 4. API 速查

### 公开 API

| 方法 | 地址 | 说明 |
| --- | --- | --- |
| `POST` | `/api/register` | 提交观众报名 |
| `POST` | `/api/lookup` | 四项信息查询报名记录 |
| `POST` | `/api/submission-files` | 上传赛事文件到 R2 |
| `GET` | `/api/submission-files/:key` | 获取文件流 |
| `POST` | `/api/projects/posters` | 提交两版电子海报 |
| `POST` | `/api/projects` | 提交完整项目材料 |
| `GET` | `/api/dashboard` | 返回公开项目列表 |
| `GET` | `/api/voting/projects` | 返回投票开关及固定 18 个候选项目 |
| `POST` | `/api/vote/identity` | 仅用 `phone` 验证投票资格 |
| `POST` | `/api/votes` | 提交 `{ identity: { phone }, candidateId }` |
| `GET` | `/api/judging/config` | 返回评委、18 项项目、评分维度 |
| `GET` | `/api/judging/scores?judge=...` | 读取指定评委已有评分 |
| `POST` | `/api/judging/scores` | 保存指定评委的一队评分 |

### 管理 API

所有 `/api/admin/*` 在线上需要 Cloudflare Access 认证。

| 方法 | 地址 | 说明 |
| --- | --- | --- |
| `GET` | `/api/admin/registrations` | 报名列表与搜索 |
| `GET` / `DELETE` | `/api/admin/registrations/:id` | 报名详情 / 删除 |
| `PATCH` | `/api/admin/registrations/:id/check-in` | 切换签到状态 |
| `GET` | `/api/admin/export.csv` | 导出报名 CSV |
| `GET` | `/api/admin/projects` | 项目提交列表 |
| `GET` | `/api/admin/projects/:id/archive?group=materials|posters` | 下载单个项目 ZIP |
| `GET` | `/api/admin/projects/archives?group=materials|posters` | 下载当前全部项目 ZIP |
| `PATCH` / `DELETE` | `/api/admin/projects/:id` | 更新状态 / 删除项目 |
| `GET` | `/api/admin/event-dashboard` | 投票统计与 18 项票数 |
| `PUT` | `/api/admin/voting-config` | 开启或关闭投票 |
| `GET` | `/api/admin/votes/export.csv` | 导出投票 CSV |
| `GET` | `/api/admin/judging/dashboard` | 评分统计 |
| `GET` | `/api/admin/judging/export.csv` | 导出评分 CSV |

## 5. 环境变量与 Cloudflare 配置

开发时使用 `.env`，模板见 `.env.example`。真实 `.env` 已被 Git 忽略。

| 变量 | 用途 | 是否公开 |
| --- | --- | --- |
| `ENVIRONMENT` | 本地环境标识 | 可公开 |
| `HSHH_DEPLOY_ENVIRONMENT` | 部署环境标识 | 可公开 |
| `HSHH_DOMAIN` | 自定义域名 | 可公开 |
| `HSHH_D1_DATABASE_NAME` | D1 数据库名 | 可公开 |
| `HSHH_D1_DATABASE_ID` | D1 数据库 ID | 配置值，避免公开传播 |
| `HSHH_SUBMISSION_BUCKET_NAME` | R2 文件桶名 | 可公开 |
| `SUCCESS_QR_URL` | 成功页备用二维码 URL | 视内容而定 |
| `VITE_API_BASE` | 单独运行 Vite 前端时的 API 地址 | 可公开 |

实际绑定由 `wrangler.jsonc` 提供：`DB`（D1）、`SUBMISSIONS`（R2）和 `ASSETS`（Vite 打包文件）。不要把 Access、Cloudflare 登录令牌或任何私钥写进代码或提交到 Git。

## 6. 管理权限

线上 `hshh.online/admin*` 需要 Cloudflare Access：

1. 在 Cloudflare Zero Trust 的 Access Applications 中找到 `hshh.online`。
2. 确保应用目标覆盖 `hshh.online/admin*`。
3. 在 Access policy 的 Include 规则中加入允许管理后台的邮箱或邮箱域。
4. 需要给新管理员权限时，只添加其邮箱并保存策略，不需要发布代码。

`/judge` 目前是公开页面，靠评委选择姓名区分评分记录；若要防止非评委访问，应另建 Access 规则或增加评委 PIN/登录机制。

## 7. 日常维护

### 修改文案或界面

1. 修改 `src/main.tsx`、`src/event-system.tsx` 或 `src/styles.css`。
2. 执行 `npm run build`。
3. 执行 `npm run worker:deploy`。

### 修改评委或 18 个投票/评分项目

- 在 `worker/index.ts` 更新 `juryJudges` 或 `juryTeams`。
- `juryTeams` 同时控制评委评分、观众投票下拉框、投票后台项目名单。
- 已有评分或投票期间不要随意修改 `team key`（数组第一列）；只改显示名称则不会破坏历史数据。

### 开启或关闭投票

进入 `https://hshh.online/admin/events`，点击“开启投票”或“关闭投票”。投票页只接受在报名表中成功提交的手机号，每人一票。

### 更换报名成功二维码

- 当前二维码作为本地静态资源打包时，替换对应图片后执行 `npm run worker:deploy`。
- 若使用外部图片 URL，则更新 `.env` 的 `SUCCESS_QR_URL` 后执行 `npm run worker:deploy`。

### 处理文件下载问题

- 单项目和批量 ZIP 均从 R2 读取文件流并由 Worker 打包。
- 大文件或大量文件下载失败时，优先检查 Cloudflare Worker Logs 与 R2 文件是否仍存在。
- 批量 ZIP 当前有总文件体积保护，定义在 `worker/index.ts` 的 `maxBulkArchiveBytes`；调整前需考虑 Worker 内存限制。

## 8. 发布前检查

- [ ] `npm run build` 通过。
- [ ] 有新 migration 时已执行 `npm run db:migrate:remote`。
- [ ] `npm run worker:deploy` 成功。
- [ ] 观众报名可提交、手机号可验证投票资格。
- [ ] `/admin` 能被 Access 拦截，授权邮箱可进入。
- [ ] R2 上传、项目提交、单项目下载正常。
- [ ] 投票开关符合当天状态。

