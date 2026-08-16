import { readFile, writeFile } from "node:fs/promises";

const envPath = new URL("../.env", import.meta.url);
const wranglerPath = new URL("../wrangler.jsonc", import.meta.url);

function parseEnv(text) {
  const values = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

function assertPresent(env, key) {
  const value = env[key]?.trim();
  if (!value) throw new Error(`请先在 .env 填写 ${key}`);
  return value;
}

const env = parseEnv(await readFile(envPath, "utf8"));
const config = JSON.parse(await readFile(wranglerPath, "utf8"));

config.vars = {
  ...(config.vars || {}),
  ENVIRONMENT: env.HSHH_DEPLOY_ENVIRONMENT || "production",
  SUCCESS_QR_URL: env.SUCCESS_QR_URL || "",
};

const configuredDatabaseName = env.HSHH_D1_DATABASE_NAME || "hshh-online";
const database =
  config.d1_databases?.find((item) => item.binding === "DB") ||
  config.d1_databases?.find((item) => item.database_name === configuredDatabaseName) ||
  config.d1_databases?.[0];
if (!database) throw new Error("wrangler.jsonc 缺少 DB 绑定");
database.binding = "DB";
database.database_name = configuredDatabaseName;
database.database_id = assertPresent(env, "HSHH_D1_DATABASE_ID");
config.d1_databases = [database];

const submissionBucket =
  config.r2_buckets?.find((item) => item.binding === "SUBMISSIONS") ||
  config.r2_buckets?.[0] ||
  {};
submissionBucket.binding = "SUBMISSIONS";
submissionBucket.bucket_name = assertPresent(env, "HSHH_SUBMISSION_BUCKET_NAME");
config.r2_buckets = [submissionBucket];

config.routes = [
  {
    pattern: assertPresent(env, "HSHH_DOMAIN"),
    custom_domain: true,
  },
];

await writeFile(wranglerPath, `${JSON.stringify(config, null, 2)}\n`);
console.log("已从 .env 同步公开配置到 wrangler.jsonc");
