import { realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { createServer as createViteServer } from "vite";
import react from "@vitejs/plugin-react";
import { api } from "./api.js";

process.env.TZ = "America/Argentina/Buenos_Aires";

// On Windows the working directory can be a redirected folder or junction (e.g. Documents moved to D:),
// while node_modules resolves to the real path. Vite then can't match its dependency cache and crashes,
// so work from the real path everywhere.
process.chdir(realpathSync.native(process.cwd()));

const PORT = Number(process.env.PORT ?? 4321);
const webRoot = realpathSync.native(join(dirname(fileURLToPath(import.meta.url)), "..", "web"));

const app = express();
app.use(express.json());
app.use("/api", api);

const vite = await createViteServer({
  root: webRoot,
  configFile: false,
  plugins: [react()],
  server: { middlewareMode: true },
  appType: "spa",
  logLevel: "warn",
});
app.use(vite.middlewares);

app.listen(PORT, () => {
  console.log(`ShopNow running at http://localhost:${PORT}`);
});
