#!/usr/bin/env node
/**
 * Push the Prisma schema to your Turso database.
 * Requires: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in env (or .env).
 *
 * Usage: node scripts/push-turso.mjs
 * Or:    npm run db:push:turso
 */

import { createClient } from "@libsql/client";
import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// Load .env if present
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
  console.error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN. Set them in .env or the environment.");
  process.exit(1);
}

const client = createClient({ url, authToken });

// Generate SQL from current schema
const schemaPath = join(process.cwd(), "prisma", "schema.prisma");
let sql = "";
try {
  sql = execSync(
    `npx prisma migrate diff --from-empty --to-schema-datamodel "${schemaPath}" --script`,
    { encoding: "utf-8" }
  );
} catch (e) {
  if (e.stdout) sql = e.stdout;
  else throw e;
}

// Run the full schema script (executeMultiple runs all statements)
try {
  await client.executeMultiple(sql);
} catch (e) {
  if (e.message?.includes("already exists") || e.message?.includes("duplicate")) {
    console.warn("Some objects already exist; schema may be partially applied.");
  } else {
    throw e;
  }
}

console.log("Schema pushed to Turso successfully.");
if (typeof client.close === "function") client.close();
