const http = require("node:http");
const path = require("node:path");
const { existsSync, readFileSync } = require("node:fs");
const { readFile } = require("node:fs/promises");
const { handleLeadRequest } = require("./email-service.cjs");

const root = path.resolve(__dirname, "..");
const port = Number(process.env.PORT || 4173);

function loadLocalEnv() {
  for (const filename of [".env.local", ".env"]) {
    const filePath = path.join(root, filename);
    if (!existsSync(filePath)) continue;

    const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const equalsIndex = trimmed.indexOf("=");
      if (equalsIndex === -1) continue;

      const key = trimmed.slice(0, equalsIndex).trim();
      const value = trimmed
        .slice(equalsIndex + 1)
        .trim()
        .replace(/^['"]|['"]$/g, "");

      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

loadLocalEnv();

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8"
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8"
  });
  res.end(JSON.stringify(payload));
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body is too large."));
      }
    });

    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON request body."));
      }
    });

    req.on("error", reject);
  });
}

function safeFilePath(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split("?")[0]);
  const requestedPath = cleanPath === "/" ? "/index.html" : cleanPath;
  const filePath = path.normalize(path.join(root, requestedPath));

  if (!filePath.startsWith(root)) {
    return null;
  }

  return filePath;
}

async function handleLead(req, res) {
  if (req.method !== "POST") {
    res.writeHead(405, {
      Allow: "POST",
      "Content-Type": "application/json; charset=utf-8"
    });
    res.end(JSON.stringify({ ok: false, message: "Method not allowed." }));
    return;
  }

  try {
    const payload = await readRequestBody(req);
    const result = await handleLeadRequest(payload, {
      referer: req.headers.referer || req.headers.referrer || ""
    });
    sendJson(res, result.statusCode, result.body);
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: error.message || "Unable to send inquiry."
    });
  }
}

async function handleStatic(req, res, urlPath) {
  const filePath = safeFilePath(urlPath);

  if (!filePath) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const file = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": contentTypes[ext] || "application/octet-stream"
    });
    res.end(file);
  } catch {
    res.writeHead(404, {
      "Content-Type": "text/plain; charset=utf-8"
    });
    res.end("Not found");
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (url.pathname === "/api/lead" || url.pathname === "/.netlify/functions/lead") {
    await handleLead(req, res);
    return;
  }

  await handleStatic(req, res, url.pathname);
});

server.listen(port, () => {
  console.log(`TechMarkTech local server running at http://localhost:${port}`);
  console.log("Use RESEND_API_KEY, RESEND_FROM_EMAIL, and LEAD_TO_EMAIL to send real emails locally.");
});
