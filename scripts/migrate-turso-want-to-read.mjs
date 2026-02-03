#!/usr/bin/env node
/**
 * One-off migration for Turso: add BookReview.wantToRead.
 * Run after adding wantToRead to the schema if you use Turso.
 *
 * Requires: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env
 * Usage: node scripts/migrate-turso-want-to-read.mjs
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

const sql = 'ALTER TABLE "BookReview" ADD COLUMN "wantToRead" INTEGER NOT NULL DEFAULT 0';
try {
  await client.execute(sql);
  console.log("OK: added wantToRead to BookReview");
} catch (e) {
  if (e.message?.includes("duplicate column name")) {
    console.log("Column wantToRead already exists; migration already applied.");
  } else {
    console.error("Failed:", e.message || e);
    process.exit(1);
  }
}
if (typeof client.close === "function") client.close();
