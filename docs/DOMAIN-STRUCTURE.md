# HsHH 域名与入口关系

主域名是 [https://hshh.online](https://hshh.online)。当前未使用子域名，网站静态资源与 API 均由同一个 Cloudflare Worker 处理。

```mermaid
flowchart TD
  U[访客浏览器] --> D[hshh.online]
  D --> W[Cloudflare Worker: hshh-online]
  W --> A[React 静态资源]
  W --> API[/api/* 接口]
  API --> D1[(D1: hshh-online)]
  API --> R2[(R2: hshh-submissions)]
  D --> X[Cloudflare Access]
  X --> ADM[/admin* 管理后台]
```

## 地址表

| 分类 | 线上地址 | 是否公开 | 说明 |
| --- | --- | --- | --- |
| 主站与报名 | `https://hshh.online/` | 是 | 自动进入观众报名页 |
| 观众报名 | `https://hshh.online/audience` | 是 | 报名、草稿、报名记录查询 |
| 报名成功 | `https://hshh.online/success/:id` | 是 | 报名成功及入群二维码 |
| 作品提交 | `https://hshh.online/submit` | 是 | 分别提交两版海报与完整路演材料 |
| 项目列表 | `https://hshh.online/dashboard` | 是 | 已公开项目展示 |
| 观众投票 | `https://hshh.online/vote` | 是 | 手机号验证后投一票 |
| 评委评分 | `https://hshh.online/judge` | 是 | 选择评委姓名后评分 |
| 志愿者贡献 | `https://hshh.online/volunteers` | 是 | 志愿者贡献页面 |
| 报名后台 | `https://hshh.online/admin` | 否 | Cloudflare Access 保护 |
| 项目后台 | `https://hshh.online/admin/projects` | 否 | Cloudflare Access 保护 |
| 投票后台 | `https://hshh.online/admin/events` | 否 | Cloudflare Access 保护 |
| 评分统计 | `https://hshh.online/admin/judging` | 否 | Cloudflare Access 保护 |

## API 地址表

所有接口都在同一主域名下，因此浏览器不需要跨域配置：

| 模块 | 地址前缀 | 权限 |
| --- | --- | --- |
| 观众报名 | `/api/register`、`/api/lookup` | 公开 |
| 提交文件 | `/api/submission-files/*` | 上传公开；读取由 Worker 控制 |
| 作品提交与海报 | `/api/projects`、`/api/projects/posters` | 公开 |
| 公开展示 | `/api/dashboard` | 公开 |
| 观众投票 | `/api/voting/projects`、`/api/vote/identity`、`/api/votes` | 公开；手机号核验与一人一票由后端检查 |
| 评委评分 | `/api/judging/*` | 公开 |
| 管理接口 | `/api/admin/*` | Cloudflare Access 保护 |

## 相关 Cloudflare 资源

| 资源 | 当前名称 / 绑定名 | 用途 |
| --- | --- | --- |
| Worker | `hshh-online` | 提供页面、接口、鉴权判断 |
| D1 | `hshh-online` / `DB` | 报名、项目、投票、评委评分数据 |
| R2 | `hshh-submissions` / `SUBMISSIONS` | PPT、PDF、海报、三视图等私有文件 |
| Access | Cloudflare Access | 保护 `hshh.online/admin*` |
| 域名路由 | `hshh.online` | 自定义域名绑定到 Worker |

## DNS 提醒

- 该域名应保持由 Cloudflare 托管并启用代理（橙云）。
- 不要将根域名 `hshh.online` 的 A/CNAME 记录改回其他服务器，否则 Worker 自定义域名会失效。
- 邮箱相关的 MX/TXT 记录与网站 Worker 可以共存；不要误删现有邮件记录。

