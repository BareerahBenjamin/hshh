import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";

const envPath = new URL("../.env", import.meta.url);
const envText = await readFile(envPath, "utf8");
const values = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^['"]|['"]$/g, "")];
    }),
);
const bucketName = values.HSHH_SUBMISSION_BUCKET_NAME;
if (!bucketName) throw new Error("请先在 .env 填写 HSHH_SUBMISSION_BUCKET_NAME");

const child = spawn("npx", ["wrangler", "r2", "bucket", "create", bucketName], { stdio: "inherit" });
const code = await new Promise((resolve) => child.on("exit", resolve));
if (code !== 0) throw new Error(`创建 R2 bucket 失败，退出码：${code}`);
