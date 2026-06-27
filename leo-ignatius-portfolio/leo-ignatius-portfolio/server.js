const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 3000);
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "change-this-token";
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const SUBMISSIONS_FILE = path.join(DATA_DIR, "submissions.json");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(SUBMISSIONS_FILE)) fs.writeFileSync(SUBMISSIONS_FILE, "[]\n");
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  });
  res.end(body);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body is too large."));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON."));
      }
    });
    req.on("error", reject);
  });
}

function sanitizeSubmission(input) {
  const name = String(input.name || "").trim();
  const email = String(input.email || "").trim();
  const interest = String(input.interest || "").trim();
  const message = String(input.message || "").trim();

  if (name.length < 2) return { error: "Please enter your name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Please enter a valid email address." };
  if (message.length < 10) return { error: "Please add a little more detail about your idea." };

  return {
    value: {
      id: crypto.randomUUID(),
      name: name.slice(0, 120),
      email: email.slice(0, 160),
      interest: interest.slice(0, 120),
      message: message.slice(0, 2000),
      createdAt: new Date().toISOString()
    }
  };
}

function loadSubmissions() {
  ensureStore();
  return JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, "utf8"));
}

function saveSubmission(submission) {
  const submissions = loadSubmissions();
  submissions.unshift(submission);
  fs.writeFileSync(SUBMISSIONS_FILE, `${JSON.stringify(submissions, null, 2)}\n`);
}

function isAuthorized(req) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "") || url.searchParams.get("token");
  return token === ADMIN_TOKEN;
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const requestedPath = decodeURIComponent(url.pathname);
  const relativePath = requestedPath === "/" ? "index.html" : requestedPath.replace(/^\/+/, "");
  const filePath = path.normalize(path.join(ROOT, relativePath));

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=3600"
    });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      });
      res.end();
      return;
    }

    if (req.method === "POST" && req.url === "/api/contact") {
      const body = await readJsonBody(req);
      const result = sanitizeSubmission(body);
      if (result.error) {
        sendJson(res, 400, { ok: false, message: result.error });
        return;
      }

      saveSubmission(result.value);
      sendJson(res, 201, { ok: true, message: "Thanks! Your message has been saved.", id: result.value.id });
      return;
    }

    if (req.method === "GET" && req.url.startsWith("/api/submissions")) {
      if (!isAuthorized(req)) {
        sendJson(res, 401, { ok: false, message: "Unauthorized. Add ?token=your-token or use a Bearer token." });
        return;
      }

      sendJson(res, 200, { ok: true, submissions: loadSubmissions() });
      return;
    }

    if (req.method === "GET") {
      serveStatic(req, res);
      return;
    }

    sendJson(res, 405, { ok: false, message: "Method not allowed." });
  } catch (error) {
    sendJson(res, 500, { ok: false, message: error.message || "Server error." });
  }
});

ensureStore();
server.listen(PORT, () => {
  console.log(`Leo portfolio backend running at http://localhost:${PORT}`);
  console.log(`View submissions at http://localhost:${PORT}/api/submissions?token=${ADMIN_TOKEN}`);
});
