import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PORT = process.env.PORT || 3000;

const { default: tanstackServer } = await import("./dist/server/server.js");

const STATIC_DIR = join(__dirname, "dist/client");

const MIME = {
  ".js": "application/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const staticPath = join(STATIC_DIR, url.pathname);

  if (existsSync(staticPath) && extname(staticPath)) {
    const content = await readFile(staticPath);
    res.setHeader("Content-Type", MIME[extname(staticPath)] || "application/octet-stream");
    res.setHeader("Cache-Control", "public, max-age=31536000");
    res.end(content);
    return;
  }

  const body =
    req.method !== "GET" && req.method !== "HEAD"
      ? await new Promise((resolve) => {
          const chunks = [];
          req.on("data", (c) => chunks.push(c));
          req.on("end", () => resolve(Buffer.concat(chunks)));
        })
      : undefined;

  const request = new Request(url.toString(), {
    method: req.method,
    headers: Object.fromEntries(
      Object.entries(req.headers).filter(([, v]) => v != null)
    ),
    body,
  });

  const response = await tanstackServer.fetch(request);

  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  res.end(Buffer.from(await response.arrayBuffer()));
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 PediHub rodando na porta ${PORT}`);
});
