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
};

const requiredStrings = ["name", "province", "city", "email", "phone", "wechat", "contestantFormSubmitted", "day", "momentGoal", "herstoryLevel", "hshhSource", "builderEcosystemCoCreate"] as const;
const requiredArrays = ["nextSteps", "contactPrefs"] as const;
const requiredConsent = ["我同意遵守 HsHH 尊重与安全规范", "我同意接收报名与活动通知"];

export default {
  async fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/api/config" && request.method === "GET") return json(configResponse(env));
      if (url.pathname === "/api/register" && request.method === "POST") return register(request, env);
      if (url.pathname === "/api/lookup" && request.method === "POST") return lookup(request, env);
      if (url.pathname === "/api/admin/registrations" && request.method === "GET") return adminList(request, env);
      if (url.pathname.startsWith("/api/admin/registrations/") && request.method === "GET") return adminDetail(request, env, url.pathname.split("/").pop() || "");
      if (url.pathname.startsWith("/api/admin/registrations/") && request.method === "DELETE") return adminDelete(request, env, url.pathname.split("/").pop() || "");
      if (url.pathname === "/api/admin/export.csv" && request.method === "GET") return adminExport(request, env);
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
