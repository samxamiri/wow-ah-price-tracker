import { readFileSync } from "fs";
import path from "path";
import type { Pool } from "pg";

// Works from both src/ (dev) and dist/ (production) because both sit next to sql/.
const SCHEMA_PATH = path.join(__dirname, "..", "sql", "schema.sql");

/** Creates the tables if they don't exist yet. Safe to run on every startup. */
export async function migrate(pool: Pool): Promise<void> {
  await pool.query(readFileSync(SCHEMA_PATH, "utf8"));
}
