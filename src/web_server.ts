import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { recommendForExistingCustomer, recommendForNewCustomer } from "./recommend.js";
import { loadCustomers } from "./data.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, "..", "public");
const PORT = process.env.PORT || 4000;

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

async function serveStatic(req: http.IncomingMessage, res: http.ServerResponse) {
  const urlPath = req.url === "/" ? "/index.html" : (req.url ?? "/index.html");
  const filePath = path.join(PUBLIC_DIR, path.normalize(urlPath).replace(/^(\.\.[/\\])+/, ""));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403).end("Forbidden");
    return;
  }
  try {
    const body = await fs.readFile(filePath);
    const ext = path.extname(filePath);
    res.writeHead(200, { "content-type": MIME[ext] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end("Not found");
  }
}

function readJsonBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res: http.ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

async function handleCustomers(_req: http.IncomingMessage, res: http.ServerResponse) {
  sendJson(res, 200, { customers: loadCustomers() });
}

async function handleExisting(req: http.IncomingMessage, res: http.ServerResponse) {
  const body = await readJsonBody(req);
  const customerId = typeof body.customerId === "string" ? body.customerId : "";
  if (!customerId) return sendJson(res, 400, { error: "customerId is required." });

  try {
    const { preferences, recommendations } = await recommendForExistingCustomer(customerId);
    sendJson(res, 200, { customerId, preferences, recommendations });
  } catch (err: any) {
    sendJson(res, 404, { error: err.message });
  }
}

async function handleNew(req: http.IncomingMessage, res: http.ServerResponse) {
  const body = await readJsonBody(req);
  const age = Number(body.age);
  const interests: string[] = Array.isArray(body.interests)
    ? body.interests
    : typeof body.interests === "string"
      ? body.interests.split(",").map((s: string) => s.trim()).filter(Boolean)
      : [];

  if (!Number.isFinite(age) || age <= 0) return sendJson(res, 400, { error: "A valid age is required." });
  if (interests.length === 0) return sendJson(res, 400, { error: "At least one interest is required." });

  const { ageGroup, recommendations } = await recommendForNewCustomer(age, interests);
  sendJson(res, 200, { age, ageGroup, interests, recommendations });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/api/customers") return await handleCustomers(req, res);
    if (req.method === "POST" && req.url === "/api/recommend-existing") return await handleExisting(req, res);
    if (req.method === "POST" && req.url === "/api/recommend-new") return await handleNew(req, res);
    if (req.method === "GET") return await serveStatic(req, res);
    res.writeHead(405).end("Method not allowed");
  } catch (err: any) {
    console.error(err);
    sendJson(res, 500, { error: err.message ?? "Internal error" });
  }
});

server.listen(PORT, () => {
  console.log(`ai-book-recommendation-system demo listening on http://localhost:${PORT}`);
});
