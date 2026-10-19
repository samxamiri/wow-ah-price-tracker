import { Pool } from "pg";
import { createApp } from "./app";
import { migrate } from "./migrate";
import { PgRepository } from "./repository";

const PORT = Number(process.env.PORT ?? 3000);
const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://wow:wow@localhost:5432/wow_ah";

async function main() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  await migrate(pool);

  const app = createApp(new PgRepository(pool));
  const server = app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });

  // Kubernetes sends SIGTERM before stopping a pod. Finish in-flight
  // requests and close DB connections instead of dying mid-request.
  process.on("SIGTERM", () => {
    console.log("SIGTERM received, shutting down");
    server.close(() => pool.end().then(() => process.exit(0)));
  });
}

main().catch((err) => {
  console.error("Failed to start API:", err);
  process.exit(1);
});
