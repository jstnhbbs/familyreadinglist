#!/usr/bin/env node
/**
 * One-off migration for Turso: replace BookReview.hiddenAt with BookReview.hidden.
 * Run this once if you see "Failed to fetch books" after the schema change.
 *
 * Requires: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env
 * Usage: node scripts/migrate-turso-hidden.mjs
 */

import { createClient } from "@libsql/client";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const envPath = join(process.cwd(), ".env");
if (existsSync(envPath)) {
  const env = readFileSync(envPath, "utf-8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) {
  console.error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in .env");
  process.exit(1);
}

const client = createClient({ url, authToken });

const steps = [
  'ALTER TABLE "BookReview" ADD COLUMN "hidden" INTEGER NOT NULL DEFAULT 0',
  'UPDATE "BookReview" SET "hidden" = 1 WHERE "hiddenAt" IS NOT NULL',
  'ALTER TABLE "BookReview" DROP COLUMN "hiddenAt"',
];

for (const sql of steps) {
  try {
    await client.execute(sql);
    console.log("OK:", sql);
  } catch (e) {
    if (e.message?.includes("duplicate column name") && sql.includes('ADD COLUMN "hidden"')) {
      console.log("Column 'hidden' already exists; migration likely already applied.");
      process.exit(0);
    }
    if (e.message?.includes("no such column") && sql.includes('DROP COLUMN "hiddenAt"')) {
      console.log("Column 'hiddenAt' already removed; migration likely already applied.");
      process.exit(0);
    }
    console.error("Failed:", sql);
    console.error(e.message || e);
    process.exit(1);
  }
}

console.log("Turso migration (hiddenAt -> hidden) completed.");
if (typeof client.close === "function") client.close();
