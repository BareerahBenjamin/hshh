import { Zip, ZipPassThrough, zipSync } from "fflate";

type WorkerEnv = Omit<Env, "ENVIRONMENT" | "SUCCESS_QR_URL"> & {
  SUCCESS_QR_URL?: string;
  ENVIRONMENT?: string;
};

type RegistrationInput = {
  type?: string;
  name?: string;
  province?: string;
  city?: string;
  email?: string;
  phone?: string;
  wechat?: string;
  media?: string;
  contestantFormSubmitted?: string;
  day?: string;
  count?: string;
  note?: string;
  momentGoal?: string;
  herstoryLevel?: string;
  hshhSource?: string;
  builderEcosystemCoCreate?: string;
  nextSteps?: string[];
  consent?: string[];
  contactPrefs?: string[];
};

type RegistrationRow = {
  id: string;
  type: string;
  name: string;
  email: string;
  phone: string;
  wechat: string;
  city: string;
  payload_json: string;
  status: string;
  created_at: string;
  updated_at: string;
  checked_in_at: string | null;
};

type ProjectInput = {
  projectName?: string;
  teamName?: string;
  teamMembers?: string[];
  oneLiner?: string;
  targetUsers?: string;
  applicationScenarios?: string;
  coreFeatures?: string;
  demoUrl?: string;
  demoInstructions?: string;
  demoVideoUrl?: string;
  pitchSourceUrl?: string;
  pitchPdfUrl?: string;
  prototypeThreeViewsUrl?: string;
  posterUrl?: string;
  posterBoothUrl?: string;
  posterPrintConfirmed?: boolean;
  vidmuseFeedbackTags?: string[];
  vidmuseFeedbackNote?: string;
  vidmuseFutureInterest?: string;
};

type ProjectRow = {
  id: string;
  project_number: number;
  team_key: string;
  project_name: string;
  team_name: string;
  team_members_json: string;
  one_liner: string;
  target_users: string;
  application_scenarios: string;
  core_features: string;
  demo_url: string;
  demo_instructions: string;
  demo_video_url: string;
  pitch_source_url: string;
  pitch_pdf_url: string;
  prototype_three_views_url: string | null;
  poster_url: string;
  poster_booth_url: string | null;
  poster_print_confirmed: number;
  vidmuse_feedback_tags: string | null;
  vidmuse_feedback_note: string | null;
  vidmuse_future_interest: string | null;
  status: string;
  is_public: number;
  voting_enabled: number;
  created_at: string;
  updated_at: string;
  valid_votes?: number;
};

type VotingConfigRow = { is_open: number; starts_at: string | null; ends_at: string | null };
type VoterIdentity = { name?: string; email?: string; wechat?: string; phone?: string };
type JuryScoreInput = { judgeName?: string; teamKey?: string; scores?: Record<string, unknown> };
type JuryScoreRow = {
  id: string;
  judge_name: string;
  team_key: string;
  human_impact: number;
  innovation: number;
  technical_execution: number;
  product_experience: number;
  productization: number;
  storytelling: number;
  total: number;
  created_at: string;
  updated_at: string;
};

const requiredStrings = ["name", "province", "city", "email", "phone", "wechat", "contestantFormSubmitted", "day", "momentGoal", "herstoryLevel", "hshhSource", "builderEcosystemCoCreate"] as const;
const requiredArrays = ["nextSteps", "contactPrefs"] as const;
const requiredConsent = ["我同意遵守 HsHH 尊重与安全规范", "我同意接收报名与活动通知"];
const vidmuseFeedbackOptions = ["帮我更快开始创作", "有些功能不够顺手", "希望增加新的功能或场景", "暂时没有特别感受"];
const vidmuseFutureInterestOptions = ["非常愿意继续使用", "愿意继续使用", "暂时不确定", "暂时不考虑"];
const posterSubmissionDeadline = Date.parse("2026-08-15T14:30:00+08:00");
const juryJudges = ["评委 01", "评委 02", "评委 03", "评委 04", "评委 05", "评委 06"];
const juryTeams = [
  ["me", "Me"],
  ["good-friends", "我的好机友们"],
  ["golden-cicada", "金婵脱壳"],
  ["she-occupied", "她先占了"],
  ["niannian", "念念 NianNian 想念灯"],
  ["three-carbon-one-hydrogen", "叁氪壹氢"],
  ["whisper-hands", "絮手 Whisper Hands"],
  ["sleep-isle", "屿眠｜Sleep Isle-AI 睡眠魔法水晶球"],
  ["lafeshit", "lafeshit"],
  ["talis", "Talis"],
  ["sendsense", "SendSense"],
  ["pet-owner-home", "铲屎官家园"],
  ["hergym", "HerGym"],
  ["to-be-confirmed", "待定"],
  ["aaa-maker", "AAA 创客"],
  ["time", "拾光 Time"],
  ["m-and-mb", "M&MB"],
  ["art-ip-ai", "艺术 IP AI 陪伴"],
] as const;
const juryDimensions = [
  { key: "humanImpact", column: "human_impact", label: "人本价值", english: "Human Impact", max: 25 },
  { key: "innovation", column: "innovation", label: "创新价值", english: "Innovation", max: 20 },
  { key: "technicalExecution", column: "technical_execution", label: "技术实现", english: "Technical Execution", max: 20 },
  { key: "productExperience", column: "product_experience", label: "产品体验", english: "Product Experience", max: 15 },
  { key: "productization", column: "productization", label: "产品化潜力", english: "Productization", max: 10 },
  { key: "storytelling", column: "storytelling", label: "表达与故事", english: "Storytelling", max: 10 },
] as const;

export default {
  async fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/api/config" && request.method === "GET") return json(configResponse(env));
      if (url.pathname === "/api/register" && request.method === "POST") return register(request, env);
      if (url.pathname === "/api/lookup" && request.method === "POST") return lookup(request, env);
      if (url.pathname === "/api/submission-files" && request.method === "POST") return uploadSubmissionFile(request, env);
      if (url.pathname.startsWith("/api/submission-files/") && request.method === "GET") return getSubmissionFile(request, env, url);
      if (url.pathname === "/api/projects" && request.method === "POST") return submitProject(request, env);
      if (url.pathname === "/api/projects/posters" && request.method === "POST") return submitProjectPosters(request, env);
      if (url.pathname === "/api/dashboard" && request.method === "GET") return publicDashboard(env);
      if (url.pathname === "/api/voting/projects" && request.method === "GET") return votingProjects(env);
      if (url.pathname === "/api/vote/identity" && request.method === "POST") return verifyVoter(request, env);
      if (url.pathname === "/api/votes" && request.method === "POST") return castVote(request, env);
      if (url.pathname === "/api/judging/config" && request.method === "GET") return juryScoringConfig();
      if (url.pathname === "/api/judging/scores" && request.method === "GET") return juryScores(request, env);
      if (url.pathname === "/api/judging/scores" && request.method === "POST") return saveJuryScore(request, env);
      if (url.pathname === "/api/admin/registrations" && request.method === "GET") return adminList(request, env);
      if (url.pathname.endsWith("/check-in") && request.method === "PATCH") return adminToggleCheckIn(request, env, url.pathname.split("/").slice(-2, -1)[0] || "");
      if (url.pathname.startsWith("/api/admin/registrations/") && request.method === "GET") return adminDetail(request, env, url.pathname.split("/").pop() || "");
      if (url.pathname.startsWith("/api/admin/registrations/") && request.method === "DELETE") return adminDelete(request, env, url.pathname.split("/").pop() || "");
      if (url.pathname === "/api/admin/export.csv" && request.method === "GET") return adminExport(request, env);
      if (url.pathname === "/api/admin/event-dashboard" && request.method === "GET") return adminEventDashboard(request, env);
      if (url.pathname === "/api/admin/judging/dashboard" && request.method === "GET") return adminJuryDashboard(request, env);
      if (url.pathname === "/api/admin/judging/export.csv" && request.method === "GET") return adminExportJuryScores(request, env);
      if (url.pathname === "/api/admin/projects" && request.method === "GET") return adminProjectList(request, env);
      if (url.pathname === "/api/admin/projects/archives" && request.method === "GET") return adminProjectArchives(request, env, url);
      if (url.pathname === "/api/admin/voting-config" && request.method === "PUT") return adminUpdateVotingConfig(request, env);
      if (url.pathname === "/api/admin/votes/export.csv" && request.method === "GET") return adminExportVotes(request, env);
      if (url.pathname.startsWith("/api/admin/projects/") && url.pathname.endsWith("/archive") && request.method === "GET") return adminProjectArchive(request, env, url);
      if (url.pathname.startsWith("/api/admin/projects/") && request.method === "DELETE") return adminDeleteProject(request, env, url.pathname.split("/").pop() || "");
      if (url.pathname.startsWith("/api/admin/projects/") && request.method === "PATCH") return adminUpdateProject(request, env, url.pathname.split("/").pop() || "");
      if (url.pathname.startsWith("/admin")) {
        const denied = requireAccess(request, env);
        if (denied) return denied;
      }
      return env.ASSETS.fetch(request);
    } catch (error) {
      if (error instanceof HttpError) return json({ error: error.message }, error.status);
      console.error(JSON.stringify({ message: "Unhandled request error", error: error instanceof Error ? error.message : String(error), path: url.pathname }));
      return json({ error: "服务暂时不可用，请稍后重试" }, 500);
    } finally {
      void ctx;
    }
  },
};

class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

function configResponse(env: WorkerEnv) {
  return {
    successQrUrl: env.SUCCESS_QR_URL || "",
  };
}

async function register(request: Request, env: WorkerEnv) {
  const input = await readJson<RegistrationInput>(request);
  const validation = validateRegistration(input);
  if (validation) return json({ error: validation }, 400);

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const normalizedEmail = cleanEmail(input.email);
  const normalizedPhone = cleanPhone(input.phone);
  const payload = normalizePayload(input);

  const existing = await env.DB.prepare("SELECT id, created_at FROM registrations WHERE email = ? AND phone = ? LIMIT 1")
    .bind(normalizedEmail, normalizedPhone)
    .first<{ id: string; created_at: string }>();
  const recordId = existing?.id || id;
  const createdAt = existing?.created_at || now;

  await env.DB.prepare(
    `INSERT INTO registrations (id, type, name, email, phone, wechat, city, payload_json, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(email, phone) DO UPDATE SET
       name = excluded.name,
       wechat = excluded.wechat,
       city = excluded.city,
       payload_json = excluded.payload_json,
       status = excluded.status,
       updated_at = excluded.updated_at`,
  )
    .bind(
      recordId,
      "audience",
      clean(input.name),
      normalizedEmail,
      normalizedPhone,
      cleanWechat(input.wechat),
      clean(input.city),
      JSON.stringify(payload),
      "submitted",
      createdAt,
      now,
    )
    .run();

  return json({ id: recordId, successUrl: `/success/${encodeURIComponent(recordId)}` });
}

async function lookup(request: Request, env: WorkerEnv) {
  const input = await readJson<{ name?: string; email?: string; wechat?: string; phone?: string }>(request);
  const row = await env.DB.prepare(
    `SELECT * FROM registrations
     WHERE lower(name) = ?
       AND email = ?
       AND lower(wechat) = ?
       AND phone = ?
     LIMIT 1`,
  )
    .bind(normalize(input.name), cleanEmail(input.email), normalize(cleanWechat(input.wechat)), cleanPhone(input.phone))
    .first<RegistrationRow>();
  if (!row) return json({ error: "没有找到匹配的报名记录，请确认四项信息与报名时填写一致。" }, 404);
  return json(rowToRecord(row));
}

async function adminList(request: Request, env: WorkerEnv) {
  const denied = requireAccess(request, env);
  if (denied) return denied;
  const url = new URL(request.url);
  const q = normalize(url.searchParams.get("q"));
  const status = clean(url.searchParams.get("status") || "");
  const type = clean(url.searchParams.get("type") || "audience");
  const page = clampNumber(Number(url.searchParams.get("page") || "1"), 1, 1000);
  const pageSize = clampNumber(Number(url.searchParams.get("pageSize") || "25"), 1, 100);
  const offset = (page - 1) * pageSize;
  const filters = ["type = ?"];
  const bindings: Array<string | number> = [type];
  if (status) {
    filters.push("status = ?");
    bindings.push(status);
  }
  if (q) {
    filters.push("(lower(name) LIKE ? OR email LIKE ? OR phone LIKE ? OR lower(wechat) LIKE ? OR lower(city) LIKE ?)");
    const like = `%${q}%`;
    bindings.push(like, like, like, like, like);
  }
  const where = filters.join(" AND ");
  const total = await env.DB.prepare(`SELECT COUNT(*) AS count FROM registrations WHERE ${where}`).bind(...bindings).first<{ count: number }>();
  const result = await env.DB.prepare(`SELECT * FROM registrations WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .bind(...bindings, pageSize, offset)
    .all<RegistrationRow>();
  return json({
    items: (result.results || []).map(rowToRecord),
    total: total?.count || 0,
    page,
    pageSize,
  });
}

async function adminDetail(request: Request, env: WorkerEnv, id: string) {
  const denied = requireAccess(request, env);
  if (denied) return denied;
  const row = await env.DB.prepare("SELECT * FROM registrations WHERE id = ? LIMIT 1").bind(id).first<RegistrationRow>();
  if (!row) return json({ error: "记录不存在" }, 404);
  return json(rowToRecord(row));
}

async function adminDelete(request: Request, env: WorkerEnv, id: string) {
  const denied = requireAccess(request, env);
  if (denied) return denied;
  const recordId = clean(id);
  if (!recordId) return json({ error: "缺少记录 ID" }, 400);
  const row = await env.DB.prepare("SELECT id FROM registrations WHERE id = ? LIMIT 1").bind(recordId).first<{ id: string }>();
  if (!row) return json({ error: "记录不存在或已删除" }, 404);
  await env.DB.prepare("DELETE FROM registrations WHERE id = ?").bind(recordId).run();
  return json({ ok: true, id: recordId });
}

async function adminExport(request: Request, env: WorkerEnv) {
  const denied = requireAccess(request, env);
  if (denied) return denied;
  const result = await env.DB.prepare("SELECT * FROM registrations WHERE type = ? ORDER BY created_at DESC").bind("audience").all<RegistrationRow>();
  const rows = (result.results || []).map(rowToRecord);
  const headers = [
    "id",
    "createdAt",
    "status",
    "name",
    "province",
    "city",
    "email",
    "phone",
    "wechat",
    "media",
    "contestantFormSubmitted",
    "day",
    "count",
    "note",
    "momentGoal",
    "herstoryLevel",
    "hshhSource",
    "builderEcosystemCoCreate",
    "nextSteps",
    "consent",
    "contactPrefs",
    "checkedInAt",
    "payload_json",
  ];
  const csv = [headers, ...rows.map((record) => headers.map((header) => csvValue(header === "payload_json" ? JSON.stringify(record) : record[header as keyof typeof record])))]
    .map((row) => row.join(","))
    .join("\n");
  return new Response(`\uFEFF${csv}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="hshh-registrations-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

async function submitProject(request: Request, env: WorkerEnv) {
  const input = await readJson<ProjectInput>(request);
  const validation = validateProject(input);
  if (validation) return json({ error: validation }, 400);
  const project = normalizeProject(input);
  const now = new Date().toISOString();
  const teamKey = normalize(project.teamName);
  const existing = await env.DB.prepare("SELECT id, project_number, created_at FROM projects WHERE team_key = ? LIMIT 1").bind(teamKey).first<{ id: string; project_number: number; created_at: string }>();
  const recordId = existing?.id || crypto.randomUUID();
  const projectNumber = existing?.project_number || await nextProjectNumber(env);
  const createdAt = existing?.created_at || now;

  await env.DB.prepare(
    `INSERT INTO projects (
      id, project_number, team_key, project_name, team_name, team_members_json, one_liner, target_users,
      application_scenarios, core_features, demo_url, demo_instructions, demo_video_url, pitch_source_url,
      pitch_pdf_url, prototype_three_views_url, poster_url, poster_booth_url, poster_print_confirmed, vidmuse_feedback_tags, vidmuse_feedback_note, vidmuse_future_interest,
      status, is_public, voting_enabled, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', 0, 0, ?, ?)
    ON CONFLICT(team_key) DO UPDATE SET
      project_name = excluded.project_name,
      team_members_json = excluded.team_members_json,
      one_liner = excluded.one_liner,
      target_users = excluded.target_users,
      application_scenarios = excluded.application_scenarios,
      core_features = excluded.core_features,
      demo_url = excluded.demo_url,
      demo_instructions = excluded.demo_instructions,
      demo_video_url = excluded.demo_video_url,
      pitch_source_url = excluded.pitch_source_url,
      pitch_pdf_url = excluded.pitch_pdf_url,
      prototype_three_views_url = excluded.prototype_three_views_url,
      poster_url = CASE WHEN excluded.poster_url <> '' THEN excluded.poster_url ELSE projects.poster_url END,
      poster_booth_url = CASE WHEN excluded.poster_booth_url <> '' THEN excluded.poster_booth_url ELSE projects.poster_booth_url END,
      poster_print_confirmed = MAX(projects.poster_print_confirmed, excluded.poster_print_confirmed),
      vidmuse_feedback_tags = excluded.vidmuse_feedback_tags,
      vidmuse_feedback_note = excluded.vidmuse_feedback_note,
      vidmuse_future_interest = excluded.vidmuse_future_interest,
      status = 'submitted',
      is_public = CASE
        WHEN (CASE WHEN excluded.poster_url <> '' THEN excluded.poster_url ELSE projects.poster_url END) <> ''
         AND (CASE WHEN excluded.poster_booth_url <> '' THEN excluded.poster_booth_url ELSE projects.poster_booth_url END) <> '' THEN 1
        ELSE 0
      END,
      updated_at = excluded.updated_at`,
  ).bind(
    recordId, projectNumber, teamKey, project.projectName, project.teamName, JSON.stringify(project.teamMembers), project.oneLiner,
    project.targetUsers, project.applicationScenarios, project.coreFeatures, project.demoUrl, project.demoInstructions,
    project.demoVideoUrl, project.pitchSourceUrl, project.pitchPdfUrl, project.prototypeThreeViewsUrl, project.posterUrl, project.posterBoothUrl, project.posterPrintConfirmed ? 1 : 0,
    JSON.stringify(project.vidmuseFeedbackTags), project.vidmuseFeedbackNote, project.vidmuseFutureInterest,
    createdAt, now,
  ).run();

  const row = await env.DB.prepare("SELECT * FROM projects WHERE team_key = ? LIMIT 1").bind(teamKey).first<ProjectRow>();
  if (!row) throw new HttpError("项目保存失败，请重试", 500);
  return json({ project: rowToProject(row) }, 201);
}

async function submitProjectPosters(request: Request, env: WorkerEnv) {
  if (Date.now() >= posterSubmissionDeadline) return json({ error: "两版电子海报提交已于 8 月 15 日 14:00 截止。" }, 403);
  const input = await readJson<ProjectInput>(request);
  const validation = validateProjectPosters(input);
  if (validation) return json({ error: validation }, 400);
  const project = normalizeProject(input);
  const now = new Date().toISOString();
  const teamKey = normalize(project.teamName);
  const existing = await env.DB.prepare("SELECT id, project_number, created_at FROM projects WHERE team_key = ? LIMIT 1").bind(teamKey).first<{ id: string; project_number: number; created_at: string }>();
  const recordId = existing?.id || crypto.randomUUID();
  const projectNumber = existing?.project_number || await nextProjectNumber(env);
  const createdAt = existing?.created_at || now;

  await env.DB.prepare(
    `INSERT INTO projects (
      id, project_number, team_key, project_name, team_name, team_members_json, one_liner, target_users,
      application_scenarios, core_features, demo_url, demo_instructions, demo_video_url, pitch_source_url,
      pitch_pdf_url, prototype_three_views_url, poster_url, poster_booth_url, poster_print_confirmed, vidmuse_feedback_tags, vidmuse_feedback_note, vidmuse_future_interest,
      status, is_public, voting_enabled, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, '[]', '', '', '', '', '', '', '', '', '', '', ?, ?, ?, '[]', '', '', 'poster_submitted', 0, 0, ?, ?)
    ON CONFLICT(team_key) DO UPDATE SET
      project_name = excluded.project_name,
      poster_url = excluded.poster_url,
      poster_booth_url = excluded.poster_booth_url,
      poster_print_confirmed = excluded.poster_print_confirmed,
      status = CASE
        WHEN projects.pitch_source_url <> '' AND projects.pitch_pdf_url <> '' AND COALESCE(projects.prototype_three_views_url, '') <> '' THEN 'submitted'
        ELSE 'poster_submitted'
      END,
      is_public = CASE
        WHEN projects.pitch_source_url <> '' AND projects.pitch_pdf_url <> '' AND COALESCE(projects.prototype_three_views_url, '') <> '' THEN 1
        ELSE 0
      END,
      updated_at = excluded.updated_at`,
  ).bind(
    recordId, projectNumber, teamKey, project.projectName, project.teamName, project.posterUrl, project.posterBoothUrl, project.posterPrintConfirmed ? 1 : 0,
    createdAt, now,
  ).run();

  const row = await env.DB.prepare("SELECT * FROM projects WHERE team_key = ? LIMIT 1").bind(teamKey).first<ProjectRow>();
  if (!row) throw new HttpError("海报保存失败，请重试", 500);
  return json({ project: rowToProject(row) }, 201);
}

type SubmissionFileKind = "pitch-source" | "pitch-pdf" | "prototype-three-views" | "poster-a4" | "poster-booth";

const submissionFileRules: Record<SubmissionFileKind, { extensions: string[]; maxBytes: number; label: string }> = {
  "pitch-source": { extensions: ["ppt", "pptx", "key"], maxBytes: 30 * 1024 * 1024, label: "Pitch PPT 原文件" },
  "pitch-pdf": { extensions: ["pdf"], maxBytes: 20 * 1024 * 1024, label: "Pitch PPT PDF 备份" },
  "prototype-three-views": { extensions: ["jpg", "jpeg", "png", "webp", "pdf"], maxBytes: 20 * 1024 * 1024, label: "硬件实物 / 原型（三视图）" },
  "poster-a4": { extensions: ["jpg", "jpeg", "png", "webp"], maxBytes: 10 * 1024 * 1024, label: "A4 产品宣发海报电子版" },
  "poster-booth": { extensions: ["jpg", "jpeg", "png", "webp"], maxBytes: 10 * 1024 * 1024, label: "0.8m × 2m 展位海报电子版" },
};

async function uploadSubmissionFile(request: Request, env: WorkerEnv) {
  const formData = await request.formData();
  const kind = clean(formData.get("kind")) as SubmissionFileKind;
  const file = formData.get("file");
  const rule = submissionFileRules[kind];
  if (!rule) return json({ error: "不支持的文件类型" }, 400);
  if (!file || typeof file === "string") return json({ error: `请选择要上传的${rule.label}` }, 400);
  if (!file.name || file.size === 0) return json({ error: "文件不能为空" }, 400);
  if (file.size > rule.maxBytes) return json({ error: `${rule.label}不能超过 ${Math.round(rule.maxBytes / 1024 / 1024)}MB` }, 400);

  const extension = fileExtension(file.name);
  if (!rule.extensions.includes(extension)) return json({ error: `${rule.label}仅支持 ${rule.extensions.map((item) => item.toUpperCase()).join(" / ")} 格式` }, 400);

  const key = `projects/${crypto.randomUUID()}/${kind}/${safeFileName(file.name, extension)}`;
  await env.SUBMISSIONS.put(key, file.stream(), {
    httpMetadata: { contentType: contentTypeForExtension(extension) },
    customMetadata: { kind, originalName: file.name.slice(0, 180), uploadedAt: new Date().toISOString() },
  });

  return json({ url: `/api/submission-files/${encodeURIComponent(key)}`, fileName: file.name });
}

async function getSubmissionFile(request: Request, env: WorkerEnv, url: URL) {
  const prefix = "/api/submission-files/";
  let key = "";
  try {
    key = decodeURIComponent(url.pathname.slice(prefix.length));
  } catch {
    return json({ error: "文件地址不正确" }, 400);
  }
  if (!key.startsWith("projects/") || key.includes("..") || key.includes("\\")) return json({ error: "文件地址不正确" }, 400);
  const object = await env.SUBMISSIONS.get(key);
  if (!object) return json({ error: "文件不存在或已被替换" }, 404);

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "private, max-age=86400");
  headers.set("x-content-type-options", "nosniff");
  const filename = object.customMetadata?.originalName || key.split("/").pop() || "submission-file";
  const isImage = headers.get("content-type")?.startsWith("image/");
  headers.set("content-disposition", `${isImage ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(filename)}`);
  return new Response(object.body, { headers });
}

async function nextProjectNumber(env: WorkerEnv) {
  const row = await env.DB.prepare("SELECT COALESCE(MAX(project_number), 0) + 1 AS next_number FROM projects").first<{ next_number: number }>();
  return row?.next_number || 1;
}

async function publicDashboard(env: WorkerEnv) {
  const result = await env.DB.prepare("SELECT * FROM projects WHERE is_public = 1 AND status = 'submitted' ORDER BY project_number ASC").all<ProjectRow>();
  return json({ projects: (result.results || []).map(rowToPublicProject) });
}

async function votingProjects(env: WorkerEnv) {
  const [config, projects] = await Promise.all([
    getVotingConfig(env),
    env.DB.prepare("SELECT * FROM projects WHERE voting_enabled = 1 AND status = 'submitted' ORDER BY project_number ASC").all<ProjectRow>(),
  ]);
  return json({ config: votingConfigResponse(config), projects: (projects.results || []).map(rowToPublicProject) });
}

async function verifyVoter(request: Request, env: WorkerEnv) {
  const identity = await readJson<VoterIdentity>(request);
  const audience = await findAudience(identity, env);
  if (!audience) return json({ eligible: false, alreadyVoted: false, message: "没有找到报名记录，请联系现场工作人员。" }, 404);
  if (audience.status !== "submitted") return json({ eligible: false, alreadyVoted: false, message: "当前报名状态无效，请联系现场工作人员。" }, 403);
  const vote = await env.DB.prepare("SELECT id FROM votes WHERE audience_id = ? LIMIT 1").bind(audience.id).first<{ id: string }>();
  return json({ eligible: !vote, alreadyVoted: Boolean(vote) });
}

async function castVote(request: Request, env: WorkerEnv) {
  const input = await readJson<{ identity?: VoterIdentity; projectId?: string }>(request);
  const projectId = clean(input.projectId);
  const audience = await findAudience(input.identity || {}, env);
  if (!audience) return json({ error: "没有找到报名记录，请联系现场工作人员。" }, 404);
  if (audience.status !== "submitted") return json({ error: "当前报名状态无效，暂不能投票。" }, 403);
  const config = await getVotingConfig(env);
  if (!isVotingOpen(config)) return json({ error: "投票尚未开始或已经结束。" }, 403);
  const project = await env.DB.prepare("SELECT id FROM projects WHERE id = ? AND voting_enabled = 1 AND status = 'submitted' LIMIT 1").bind(projectId).first<{ id: string }>();
  if (!project) return json({ error: "该作品当前不在投票名单中。" }, 404);
  const now = new Date().toISOString();
  try {
    await env.DB.prepare("INSERT INTO votes (id, audience_id, project_id, status, created_at, updated_at) VALUES (?, ?, ?, 'valid', ?, ?)")
      .bind(crypto.randomUUID(), audience.id, project.id, now, now)
      .run();
  } catch (error) {
    if (isUniqueViolation(error)) return json({ error: "你已完成投票，每位观众仅可投票一次。" }, 409);
    throw error;
  }
  return json({ ok: true });
}

function juryScoringConfig() {
  return json({
    judges: juryJudges,
    teams: juryTeams.map(([key, name], index) => ({ key, name, number: index + 1 })),
    dimensions: juryDimensions.map(({ key, label, english, max }) => ({ key, label, english, max })),
  });
}

function juryScoreResponse(row: JuryScoreRow) {
  return {
    id: row.id,
    judgeName: row.judge_name,
    teamKey: row.team_key,
    scores: {
      humanImpact: row.human_impact,
      innovation: row.innovation,
      technicalExecution: row.technical_execution,
      productExperience: row.product_experience,
      productization: row.productization,
      storytelling: row.storytelling,
    },
    total: row.total,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function juryScores(request: Request, env: WorkerEnv) {
  const url = new URL(request.url);
  const judgeName = clean(url.searchParams.get("judge"));
  if (!juryJudges.includes(judgeName)) return json({ error: "请从评委名单中选择姓名" }, 400);
  const result = await env.DB.prepare("SELECT * FROM jury_scores WHERE judge_name = ? ORDER BY team_key ASC").bind(judgeName).all<JuryScoreRow>();
  return json({ scores: (result.results || []).map(juryScoreResponse) });
}

async function saveJuryScore(request: Request, env: WorkerEnv) {
  const input = await readJson<JuryScoreInput>(request);
  const judgeName = clean(input.judgeName);
  const teamKey = clean(input.teamKey);
  if (!juryJudges.includes(judgeName)) return json({ error: "请从评委名单中选择姓名" }, 400);
  if (!juryTeams.some(([key]) => key === teamKey)) return json({ error: "评分队伍不在本次评审名单中" }, 400);

  const scores: Record<string, number> = {};
  for (const dimension of juryDimensions) {
    const score = Number(input.scores?.[dimension.key]);
    if (!Number.isFinite(score) || score < 0 || score > dimension.max) return json({ error: `${dimension.label}请填写 0-${dimension.max} 分之间的数字` }, 400);
    scores[dimension.key] = Math.round(score * 10) / 10;
  }
  const total = juryDimensions.reduce((sum, dimension) => sum + scores[dimension.key], 0);
  const now = new Date().toISOString();
  const existing = await env.DB.prepare("SELECT id, created_at FROM jury_scores WHERE judge_name = ? AND team_key = ? LIMIT 1")
    .bind(judgeName, teamKey)
    .first<{ id: string; created_at: string }>();
  const id = existing?.id || crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO jury_scores (
      id, judge_name, team_key, human_impact, innovation, technical_execution,
      product_experience, productization, storytelling, total, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(judge_name, team_key) DO UPDATE SET
      human_impact = excluded.human_impact,
      innovation = excluded.innovation,
      technical_execution = excluded.technical_execution,
      product_experience = excluded.product_experience,
      productization = excluded.productization,
      storytelling = excluded.storytelling,
      total = excluded.total,
      updated_at = excluded.updated_at`,
  ).bind(
    id, judgeName, teamKey, scores.humanImpact, scores.innovation, scores.technicalExecution,
    scores.productExperience, scores.productization, scores.storytelling, total, existing?.created_at || now, now,
  ).run();
  const saved = await env.DB.prepare("SELECT * FROM jury_scores WHERE id = ? LIMIT 1").bind(id).first<JuryScoreRow>();
  if (!saved) throw new HttpError("评分保存失败，请重试", 500);
  return json({ score: juryScoreResponse(saved) });
}

async function adminJuryDashboard(request: Request, env: WorkerEnv) {
  const denied = requireAccess(request, env);
  if (denied) return denied;
  const result = await env.DB.prepare("SELECT * FROM jury_scores ORDER BY updated_at DESC").all<JuryScoreRow>();
  const scoreRows = result.results || [];
  const stats = juryTeams.map(([key, name], index) => {
    const teamScores = scoreRows.filter((score) => score.team_key === key);
    const averages: Record<string, number | null> = {};
    for (const dimension of juryDimensions) {
      const total = teamScores.reduce((sum, score) => sum + Number(score[dimension.column]), 0);
      averages[dimension.key] = teamScores.length ? Math.round((total / teamScores.length) * 10) / 10 : null;
    }
    const total = teamScores.reduce((sum, score) => sum + score.total, 0);
    return { key, name, number: index + 1, scoreCount: teamScores.length, averageTotal: teamScores.length ? Math.round((total / teamScores.length) * 10) / 10 : null, averages };
  }).sort((a, b) => (b.averageTotal ?? -1) - (a.averageTotal ?? -1) || a.number - b.number);
  const judgeProgress = juryJudges.map((name) => ({
    name,
    completedTeams: scoreRows.filter((score) => score.judge_name === name).length,
    totalTeams: juryTeams.length,
  }));
  return json({
    judges: juryJudges,
    teams: juryTeams.map(([key, name], index) => ({ key, name, number: index + 1 })),
    dimensions: juryDimensions.map(({ key, label, english, max }) => ({ key, label, english, max })),
    scoreCount: scoreRows.length,
    judgeProgress,
    teamStats: stats,
    scores: scoreRows.map(juryScoreResponse),
  });
}

async function adminExportJuryScores(request: Request, env: WorkerEnv) {
  const denied = requireAccess(request, env);
  if (denied) return denied;
  const result = await env.DB.prepare("SELECT * FROM jury_scores ORDER BY judge_name ASC, team_key ASC").all<JuryScoreRow>();
  const teamNames = new Map<string, string>(juryTeams.map(([key, name]) => [key, name]));
  const headers = ["评委", "队伍", ...juryDimensions.map((dimension) => `${dimension.label}（${dimension.max}）`), "总分", "更新时间"];
  const rows = (result.results || []).map((score) => [
    score.judge_name,
    teamNames.get(score.team_key) || score.team_key,
    ...juryDimensions.map((dimension) => score[dimension.column]),
    score.total,
    score.updated_at,
  ]);
  const csv = [headers, ...rows].map((row) => row.map(csvValue).join(",")).join("\n");
  return new Response(`\uFEFF${csv}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="hshh-jury-scores-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

async function adminToggleCheckIn(request: Request, env: WorkerEnv, id: string) {
  const denied = requireAccess(request, env);
  if (denied) return denied;
  const record = await env.DB.prepare("SELECT id, checked_in_at FROM registrations WHERE id = ? LIMIT 1").bind(clean(id)).first<{ id: string; checked_in_at: string | null }>();
  if (!record) return json({ error: "报名记录不存在" }, 404);
  const checkedInAt = record.checked_in_at ? null : new Date().toISOString();
  await env.DB.prepare("UPDATE registrations SET checked_in_at = ?, updated_at = ? WHERE id = ?").bind(checkedInAt, new Date().toISOString(), record.id).run();
  return json({ checkedInAt });
}

async function adminEventDashboard(request: Request, env: WorkerEnv) {
  const denied = requireAccess(request, env);
  if (denied) return denied;
  const [config, eligible, voted, projectResult] = await Promise.all([
    getVotingConfig(env),
    env.DB.prepare("SELECT COUNT(*) AS count FROM registrations WHERE type = 'audience' AND status = 'submitted'").first<{ count: number }>(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM votes WHERE status = 'valid'").first<{ count: number }>(),
    env.DB.prepare(
      `SELECT p.*, COUNT(v.id) AS valid_votes
       FROM projects p
       LEFT JOIN votes v ON v.project_id = p.id AND v.status = 'valid'
       GROUP BY p.id
       ORDER BY valid_votes DESC, p.project_number ASC`,
    ).all<ProjectRow>(),
  ]);
  const eligibleAudience = eligible?.count || 0;
  const votedAudience = voted?.count || 0;
  return json({
    config: votingConfigResponse(config),
    stats: { eligibleAudience, votedAudience, voteRate: eligibleAudience ? Math.round((votedAudience / eligibleAudience) * 100) : 0 },
    projects: (projectResult.results || []).map(rowToProject),
  });
}

async function adminProjectList(request: Request, env: WorkerEnv) {
  const denied = requireAccess(request, env);
  if (denied) return denied;
  const url = new URL(request.url);
  const q = normalize(url.searchParams.get("q"));
  const query = q
    ? env.DB.prepare(
      `SELECT * FROM projects
       WHERE lower(project_name) LIKE ? OR lower(team_name) LIKE ?
       ORDER BY updated_at DESC, project_number ASC`,
    ).bind(`%${q}%`, `%${q}%`)
    : env.DB.prepare("SELECT * FROM projects ORDER BY updated_at DESC, project_number ASC");
  const result = await query.all<ProjectRow>();
  return json({ items: (result.results || []).map(rowToProject) });
}

async function adminDeleteProject(request: Request, env: WorkerEnv, id: string) {
  const denied = requireAccess(request, env);
  if (denied) return denied;
  const projectId = clean(id);
  if (!projectId) return json({ error: "缺少项目 ID" }, 400);
  const project = await env.DB.prepare("SELECT * FROM projects WHERE id = ? LIMIT 1").bind(projectId).first<ProjectRow>();
  if (!project) return json({ error: "项目不存在或已删除" }, 404);

  await env.DB.prepare("DELETE FROM vote_audit_log WHERE vote_id IN (SELECT id FROM votes WHERE project_id = ?)").bind(project.id).run();
  await env.DB.prepare("DELETE FROM votes WHERE project_id = ?").bind(project.id).run();
  await env.DB.prepare("DELETE FROM projects WHERE id = ?").bind(project.id).run();

  const fileKeys = [project.pitch_source_url, project.pitch_pdf_url, project.prototype_three_views_url, project.poster_url, project.poster_booth_url]
    .map(submissionFileKey)
    .filter((key): key is string => Boolean(key));
  await Promise.allSettled(fileKeys.map((key) => env.SUBMISSIONS.delete(key)));
  return json({ ok: true, id: project.id });
}

type ProjectArchiveGroup = "materials" | "posters";
type ProjectArchiveFile = { label: string; url: string };
type ZipSource = { filename: string; body: ReadableStream };
const maxBulkArchiveBytes = 100 * 1024 * 1024;

function projectArchiveFiles(project: ProjectRow, group: ProjectArchiveGroup): ProjectArchiveFile[] {
  return group === "materials"
    ? [
      { label: "01-Pitch PPT 原文件", url: project.pitch_source_url },
      { label: "02-Pitch PPT PDF 备份", url: project.pitch_pdf_url },
      { label: "03-硬件实物-原型三视图", url: project.prototype_three_views_url || "" },
    ]
    : [
      { label: "01-A4 海报电子版", url: project.poster_url },
      { label: "02-0.8m x 2m 展位海报", url: project.poster_booth_url || "" },
    ];
}

async function adminProjectArchive(request: Request, env: WorkerEnv, url: URL) {
  const denied = requireAccess(request, env);
  if (denied) return denied;
  const projectId = clean(url.pathname.split("/").slice(-2, -1)[0]);
  const group = url.searchParams.get("group") as ProjectArchiveGroup | null;
  if (!projectId || (group !== "materials" && group !== "posters")) return json({ error: "下载请求不正确" }, 400);
  const project = await env.DB.prepare("SELECT * FROM projects WHERE id = ? LIMIT 1").bind(projectId).first<ProjectRow>();
  if (!project) return json({ error: "项目不存在或已删除" }, 404);

  const files = projectArchiveFiles(project, group);

  const sources = await Promise.all(files.map(async (file) => {
    const key = submissionFileKey(file.url);
    if (!key) return { label: file.label, source: null };
    const object = await env.SUBMISSIONS.get(key);
    if (!object) return { label: file.label, source: null };
    const originalName = object.customMetadata?.originalName || key.split("/").pop() || "file";
    return { label: file.label, source: { filename: `${file.label}-${safeArchiveEntryName(originalName)}`, body: object.body } };
  }));
  const missing = sources.filter((item) => !item.source).map((item) => item.label);
  if (missing.length) return json({ error: `无法打包，缺少：${missing.join("、")}` }, 409);

  const filename = projectArchiveName(project.project_name, project.team_name, group);
  return new Response(zipProjectFiles(sources.map((item) => item.source as ZipSource)), {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="project-files.zip"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

async function adminProjectArchives(request: Request, env: WorkerEnv, url: URL) {
  const denied = requireAccess(request, env);
  if (denied) return denied;
  const group = url.searchParams.get("group") as ProjectArchiveGroup | null;
  if (group !== "materials" && group !== "posters") return json({ error: "下载请求不正确" }, 400);

  const result = await env.DB.prepare("SELECT * FROM projects ORDER BY project_number ASC").all<ProjectRow>();
  const entries: Record<string, Uint8Array> = {};
  let totalBytes = 0;
  let includedProjects = 0;
  for (const project of result.results || []) {
    const projectEntries: Array<[string, Uint8Array]> = [];
    let projectBytes = 0;
    const files = projectArchiveFiles(project, group);
    for (const file of files) {
      const key = submissionFileKey(file.url);
      if (!key) {
        projectEntries.length = 0;
        break;
      }
      const object = await env.SUBMISSIONS.get(key);
      if (!object) {
        projectEntries.length = 0;
        break;
      }
      if (totalBytes + projectBytes + object.size > maxBulkArchiveBytes) throw new HttpError("当前全部文件超过 100MB，请使用项目详情中的单项目 ZIP 下载。", 413);
      const originalName = object.customMetadata?.originalName || key.split("/").pop() || "file";
      const folder = projectArchiveStem(project.project_name, project.team_name, group);
      projectEntries.push([
        `${folder}/${file.label}-${safeArchiveEntryName(originalName)}`,
        new Uint8Array(await object.arrayBuffer()),
      ]);
      projectBytes += object.size;
    }
    if (projectEntries.length === files.length) {
      for (const [filename, bytes] of projectEntries) entries[filename] = bytes;
      totalBytes += projectBytes;
      includedProjects += 1;
    }
  }
  if (!includedProjects) return json({ error: group === "posters" ? "暂无两版电子海报均已提交的项目。" : "暂无路演材料与三视图均已提交的项目。" }, 409);

  const filename = group === "posters" ? "HsHH-已提交海报提交.zip" : "HsHH-已提交路演材料+硬件实物／原型（三视图）.zip";
  let archive: Uint8Array;
  try {
    archive = zipSync(entries, { level: 0 });
  } catch (error) {
    console.error(JSON.stringify({ message: "Bulk project archive failed", group, error: error instanceof Error ? error.message : String(error) }));
    throw new HttpError("批量压缩失败，请稍后重试。", 500);
  }
  return new Response(archive.buffer as ArrayBuffer, {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="hshh-projects.zip"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

function zipProjectFiles(files: ZipSource[]) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const zip = new Zip((error, data, final) => {
        if (error) {
          controller.error(error);
          return;
        }
        controller.enqueue(data);
        if (final) controller.close();
      });

      void (async () => {
        try {
          const entries = files.map((file) => {
            const entry = new ZipPassThrough(file.filename);
            zip.add(entry);
            return { ...file, entry };
          });
          for (const file of entries) {
            const reader = file.body.getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              if (value) file.entry.push(value);
            }
            file.entry.push(new Uint8Array(), true);
          }
          zip.end();
        } catch (error) {
          zip.terminate();
          controller.error(error);
        }
      })();
    },
  });
}

async function adminUpdateVotingConfig(request: Request, env: WorkerEnv) {
  const denied = requireAccess(request, env);
  if (denied) return denied;
  const input = await readJson<{ isOpen?: boolean; startsAt?: string | null; endsAt?: string | null }>(request);
  if (typeof input.isOpen !== "boolean") return json({ error: "缺少投票开关状态" }, 400);
  const now = new Date().toISOString();
  await env.DB.prepare("UPDATE voting_config SET is_open = ?, starts_at = ?, ends_at = ?, updated_at = ? WHERE id = 1")
    .bind(input.isOpen ? 1 : 0, cleanOptionalDate(input.startsAt), cleanOptionalDate(input.endsAt), now)
    .run();
  return json({ config: votingConfigResponse(await getVotingConfig(env)) });
}

async function adminUpdateProject(request: Request, env: WorkerEnv, id: string) {
  const denied = requireAccess(request, env);
  if (denied) return denied;
  const input = await readJson<{ votingEnabled?: boolean; isPublic?: boolean; status?: string }>(request);
  const project = await env.DB.prepare("SELECT * FROM projects WHERE id = ? LIMIT 1").bind(clean(id)).first<ProjectRow>();
  if (!project) return json({ error: "项目不存在" }, 404);
  const votingEnabled = typeof input.votingEnabled === "boolean" ? input.votingEnabled : Boolean(project.voting_enabled);
  const isPublic = typeof input.isPublic === "boolean" ? input.isPublic : Boolean(project.is_public);
  const status = input.status ? clean(input.status) : project.status;
  await env.DB.prepare("UPDATE projects SET voting_enabled = ?, is_public = ?, status = ?, updated_at = ? WHERE id = ?")
    .bind(votingEnabled ? 1 : 0, isPublic ? 1 : 0, status, new Date().toISOString(), project.id)
    .run();
  const updated = await env.DB.prepare("SELECT * FROM projects WHERE id = ? LIMIT 1").bind(project.id).first<ProjectRow>();
  return json({ project: updated ? rowToProject(updated) : null });
}

async function adminExportVotes(request: Request, env: WorkerEnv) {
  const denied = requireAccess(request, env);
  if (denied) return denied;
  const result = await env.DB.prepare(
    `SELECT v.id, v.audience_id, v.project_id, v.status, v.created_at, p.project_number, p.project_name, p.team_name
     FROM votes v JOIN projects p ON p.id = v.project_id
     ORDER BY v.created_at DESC`,
  ).all<Record<string, unknown>>();
  const headers = ["vote_id", "audience_id", "project_id", "project_number", "project_name", "team_name", "status", "created_at"];
  const csv = [headers, ...(result.results || []).map((row) => headers.map((header) => csvValue(row[header === "vote_id" ? "id" : header])))]
    .map((row) => row.join(","))
    .join("\n");
  return new Response(`\uFEFF${csv}`, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="hshh-votes-${new Date().toISOString().slice(0, 10)}.csv"` } });
}

async function getVotingConfig(env: WorkerEnv) {
  const config = await env.DB.prepare("SELECT is_open, starts_at, ends_at FROM voting_config WHERE id = 1 LIMIT 1").first<VotingConfigRow>();
  if (config) return config;
  return { is_open: 0, starts_at: null, ends_at: null };
}

function votingConfigResponse(config: VotingConfigRow) {
  return { isOpen: isVotingOpen(config), startsAt: config.starts_at, endsAt: config.ends_at };
}

function isVotingOpen(config: VotingConfigRow) {
  if (!config.is_open) return false;
  const now = Date.now();
  if (config.starts_at && new Date(config.starts_at).getTime() > now) return false;
  if (config.ends_at && new Date(config.ends_at).getTime() <= now) return false;
  return true;
}

async function findAudience(identity: VoterIdentity, env: WorkerEnv) {
  return env.DB.prepare(
    `SELECT id, status, checked_in_at FROM registrations
     WHERE type = 'audience' AND lower(name) = ? AND email = ? AND lower(wechat) = ? AND phone = ? LIMIT 1`,
  ).bind(normalize(identity.name), cleanEmail(identity.email), normalize(cleanWechat(identity.wechat)), cleanPhone(identity.phone))
    .first<{ id: string; status: string; checked_in_at: string | null }>();
}

function validateProject(input: ProjectInput) {
  const required = ["projectName", "teamName", "oneLiner", "targetUsers", "applicationScenarios", "coreFeatures", "demoUrl", "demoInstructions", "demoVideoUrl", "pitchSourceUrl", "pitchPdfUrl", "prototypeThreeViewsUrl"] as const;
  for (const key of required) if (!clean(input[key])) return `缺少必填字段：${key}`;
  if (!Array.isArray(input.teamMembers) || input.teamMembers.map(clean).filter(Boolean).length === 0) return "请至少填写一位团队成员";
  if (!isSafeUrl(input.demoUrl)) return "Demo 链接格式不正确，需要以 http:// 或 https:// 开头";
  if (!isBilibiliUrl(input.demoVideoUrl)) return "AIGC Demo 视频请提交 B 站链接";
  for (const key of ["pitchSourceUrl", "pitchPdfUrl", "prototypeThreeViewsUrl"] as const) {
    if (!isStoredSubmissionUrl(input[key])) return "请通过本页面上传路演材料和三视图文件";
  }
  const feedbackTags = stringArray(input.vidmuseFeedbackTags);
  if (feedbackTags.some((tag) => !vidmuseFeedbackOptions.includes(tag))) return "VIDMUSE 反馈选项不正确";
  if (!feedbackTags.length) return "请选择至少一项 VIDMUSE 使用感受";
  const futureInterest = clean(input.vidmuseFutureInterest);
  if (!vidmuseFutureInterestOptions.includes(futureInterest)) return "请选择未来对 VIDMUSE 的使用意愿";
  if (!clean(input.vidmuseFeedbackNote)) return "请填写 VIDMUSE 使用小记";
  if (clean(input.vidmuseFeedbackNote).length > 1000) return "VIDMUSE 使用小记请控制在 1000 字以内";
  return "";
}

function validateProjectPosters(input: ProjectInput) {
  for (const key of ["projectName", "teamName", "posterUrl", "posterBoothUrl"] as const) {
    if (!clean(input[key])) return `缺少必填字段：${key}`;
  }
  if (!input.posterPrintConfirmed) return "请确认已准备两种规格的纸质海报";
  for (const key of ["posterUrl", "posterBoothUrl"] as const) {
    if (!isStoredSubmissionUrl(input[key])) return "请通过本页面上传两版产品海报文件";
  }
  return "";
}

function normalizeProject(input: ProjectInput) {
  return {
    projectName: clean(input.projectName), teamName: clean(input.teamName), teamMembers: stringArray(input.teamMembers), oneLiner: clean(input.oneLiner),
    targetUsers: clean(input.targetUsers), applicationScenarios: clean(input.applicationScenarios), coreFeatures: clean(input.coreFeatures),
    demoUrl: clean(input.demoUrl), demoInstructions: clean(input.demoInstructions), demoVideoUrl: clean(input.demoVideoUrl),
    pitchSourceUrl: clean(input.pitchSourceUrl), pitchPdfUrl: clean(input.pitchPdfUrl), prototypeThreeViewsUrl: clean(input.prototypeThreeViewsUrl), posterUrl: clean(input.posterUrl), posterBoothUrl: clean(input.posterBoothUrl), posterPrintConfirmed: Boolean(input.posterPrintConfirmed),
    vidmuseFeedbackTags: stringArray(input.vidmuseFeedbackTags).filter((tag) => vidmuseFeedbackOptions.includes(tag)),
    vidmuseFeedbackNote: clean(input.vidmuseFeedbackNote), vidmuseFutureInterest: clean(input.vidmuseFutureInterest),
  };
}

function rowToProject(row: ProjectRow) {
  return {
    id: row.id, projectNumber: row.project_number, projectName: row.project_name, teamName: row.team_name,
    teamMembers: parseStringArray(row.team_members_json), oneLiner: row.one_liner, targetUsers: row.target_users,
    applicationScenarios: row.application_scenarios, coreFeatures: row.core_features, demoUrl: row.demo_url,
    demoInstructions: row.demo_instructions, demoVideoUrl: row.demo_video_url, pitchSourceUrl: row.pitch_source_url,
    pitchPdfUrl: row.pitch_pdf_url, prototypeThreeViewsUrl: row.prototype_three_views_url || "", posterUrl: row.poster_url, posterBoothUrl: row.poster_booth_url || "", posterPrintConfirmed: Boolean(row.poster_print_confirmed),
    vidmuseFeedbackTags: parseStringArray(row.vidmuse_feedback_tags || "[]"), vidmuseFeedbackNote: row.vidmuse_feedback_note || "",
    vidmuseFutureInterest: row.vidmuse_future_interest || "",
    status: row.status, isPublic: Boolean(row.is_public), votingEnabled: Boolean(row.voting_enabled),
    createdAt: row.created_at, updatedAt: row.updated_at, validVotes: row.valid_votes || 0,
  };
}

function rowToPublicProject(row: ProjectRow) {
  const {
    vidmuseFeedbackTags: _vidmuseFeedbackTags,
    vidmuseFeedbackNote: _vidmuseFeedbackNote,
    vidmuseFutureInterest: _vidmuseFutureInterest,
    prototypeThreeViewsUrl: _prototypeThreeViewsUrl,
    ...project
  } = rowToProject(row);
  return {
    ...project,
    demoUrl: "",
    demoInstructions: "",
    demoVideoUrl: "",
    pitchSourceUrl: "",
    pitchPdfUrl: "",
  };
}

function parseStringArray(value: string) {
  try { return stringArray(JSON.parse(value)); } catch { return []; }
}

function isSafeUrl(value: unknown) {
  try { const url = new URL(clean(value)); return url.protocol === "https:" || url.protocol === "http:"; } catch { return false; }
}

function isBilibiliUrl(value: unknown) {
  try {
    const url = new URL(clean(value));
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    const host = url.hostname.toLowerCase();
    return host === "bilibili.com" || host.endsWith(".bilibili.com") || host === "b23.tv" || host.endsWith(".b23.tv");
  } catch {
    return false;
  }
}

function isStoredSubmissionUrl(value: unknown) {
  const path = clean(value);
  return path.startsWith("/api/submission-files/projects%2F") || path.startsWith("/api/submission-files/projects/");
}

function submissionFileKey(value: unknown) {
  const path = clean(value);
  const prefix = "/api/submission-files/";
  if (!path.startsWith(prefix)) return null;
  try {
    const key = decodeURIComponent(path.slice(prefix.length));
    return key.startsWith("projects/") && !key.includes("..") && !key.includes("\\") ? key : null;
  } catch {
    return null;
  }
}

function safeArchiveEntryName(value: string) {
  return value.replace(/[\\/]+/g, "_").replace(/[\u0000-\u001f]/g, "").slice(0, 180) || "file";
}

function projectArchiveName(projectName: string, teamName: string, group: ProjectArchiveGroup) {
  return `${projectArchiveStem(projectName, teamName, group) || "HsHH 项目材料"}.zip`;
}

function projectArchiveStem(projectName: string, teamName: string, group: ProjectArchiveGroup) {
  const groupName = group === "materials" ? "路演材料+硬件实物／原型（三视图）" : "海报提交";
  return `${clean(projectName)}+${clean(teamName)}+${groupName}`.replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").trim();
}

function fileExtension(filename: string) {
  const extension = filename.split(".").pop()?.toLowerCase() || "";
  return extension.replace(/[^a-z0-9]/g, "");
}

function safeFileName(filename: string, extension: string) {
  const base = filename.slice(0, 120).replace(/\.[^.]*$/, "").replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "submission";
  return `${base}.${extension}`;
}

function contentTypeForExtension(extension: string) {
  const contentTypes: Record<string, string> = {
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    key: "application/octet-stream",
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };
  return contentTypes[extension] || "application/octet-stream";
}

function cleanOptionalDate(value: unknown) {
  const text = clean(value);
  return text && !Number.isNaN(new Date(text).getTime()) ? new Date(text).toISOString() : null;
}

function isUniqueViolation(error: unknown) {
  return error instanceof Error && /unique|constraint/i.test(error.message);
}

function requireAccess(request: Request, env: WorkerEnv) {
  if (env.ENVIRONMENT === "development") return null;
  const email = request.headers.get("cf-access-authenticated-user-email");
  if (email) return null;
  return json({ error: "需要管理员权限" }, 401);
}

function validateRegistration(input: RegistrationInput) {
  for (const key of requiredStrings) {
    if (!clean(input[key])) return `缺少必填字段：${key}`;
  }
  for (const key of requiredArrays) {
    if (!Array.isArray(input[key]) || input[key]!.length === 0) return `缺少必填字段：${key}`;
  }
  if (!/^1[3-9]\d{9}$/.test(cleanPhone(input.phone))) return "手机号格式不正确";
  if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(cleanEmail(input.email))) return "邮箱格式不正确";
  const consent = Array.isArray(input.consent) ? input.consent : [];
  for (const item of requiredConsent) {
    if (!consent.includes(item)) return "请确认承诺与共识必选项";
  }
  return "";
}

function normalizePayload(input: RegistrationInput) {
  return {
    type: "audience",
    name: clean(input.name),
    province: clean(input.province),
    city: clean(input.city),
    email: cleanEmail(input.email),
    phone: cleanPhone(input.phone),
    wechat: cleanWechat(input.wechat),
    media: clean(input.media),
    contestantFormSubmitted: clean(input.contestantFormSubmitted),
    day: clean(input.day),
    count: clean(input.count),
    note: clean(input.note),
    momentGoal: clean(input.momentGoal),
    herstoryLevel: clean(input.herstoryLevel),
    hshhSource: clean(input.hshhSource),
    builderEcosystemCoCreate: clean(input.builderEcosystemCoCreate),
    nextSteps: stringArray(input.nextSteps),
    consent: stringArray(input.consent),
    contactPrefs: stringArray(input.contactPrefs),
  };
}

function rowToRecord(row: RegistrationRow) {
  const payload = JSON.parse(row.payload_json) as Record<string, unknown>;
  return {
    ...payload,
    id: row.id,
    type: row.type,
    name: row.name,
    email: row.email,
    phone: row.phone,
    wechat: row.wechat,
    city: row.city,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    checkedInAt: row.checked_in_at,
  };
}

async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new HttpError("请求 JSON 格式不正确", 400);
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function clean(value: unknown) {
  return String(value || "").trim();
}

function normalize(value: unknown) {
  return clean(value).toLowerCase();
}

function cleanEmail(value: unknown) {
  return clean(value).replace(/\s+/g, "").toLowerCase();
}

function cleanPhone(value: unknown) {
  return clean(value).replace(/\D/g, "").slice(0, 11);
}

function cleanWechat(value: unknown) {
  return clean(value).replace(/\s+/g, "").slice(0, 40);
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.map(clean).filter(Boolean) : [];
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(Math.trunc(value), min), max);
}

function csvValue(value: unknown) {
  const text = Array.isArray(value) ? value.join("、") : String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}
