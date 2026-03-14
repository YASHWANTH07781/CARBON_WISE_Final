/**
 * Carbon-Wise Node.js Server v5.0
 * Serves the React production build and proxies /api/* to Flask.
 *
 * Production:  npm run build  →  npm run server
 * Development: npm start  (react-scripts + proxy in package.json)
 */
const http = require("http"), fs = require("fs"), path = require("path"), url = require("url");
const PORT = 3000, FLASK_PORT = 5000, FLASK_HOST = "localhost";
const BUILD_DIR = path.join(__dirname, "..", "build");
const MIME = { ".html":"text/html",".js":"application/javascript",".css":"text/css",".json":"application/json",".png":"image/png",".jpg":"image/jpeg",".svg":"image/svg+xml",".ico":"image/x-icon",".woff2":"font/woff2",".woff":"font/woff",".map":"application/json" };

function proxyToFlask(req, res) {
  const proxy = http.request({ hostname:FLASK_HOST, port:FLASK_PORT, path:req.url, method:req.method, headers:{...req.headers, host:`${FLASK_HOST}:${FLASK_PORT}`} }, fr => { res.writeHead(fr.statusCode, fr.headers); fr.pipe(res); });
  proxy.on("error", () => { res.writeHead(503, {"Content-Type":"application/json"}); res.end(JSON.stringify({error:"Flask backend not running", hint:"python backend/app.py", demo:true})); });
  if (req.method === "POST") req.pipe(proxy); else proxy.end();
}

function serveStatic(req, res) {
  if (!fs.existsSync(BUILD_DIR)) { res.writeHead(503, {"Content-Type":"text/html"}); res.end("<h2>Run <code>npm run build</code> first.</h2><p>Or use <code>npm start</code> for dev mode.</p>"); return; }
  const reqPath = url.parse(req.url).pathname;
  let fp = path.join(BUILD_DIR, reqPath === "/" ? "index.html" : reqPath);
  if (!path.extname(fp) || !fs.existsSync(fp)) fp = path.join(BUILD_DIR, "index.html");
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404); res.end("Not found"); return; }
    const ext = path.extname(fp);
    res.writeHead(200, {"Content-Type": MIME[ext] || "text/plain", "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=31536000"});
    res.end(data);
  });
}

http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }
  url.parse(req.url).pathname.startsWith("/api/") ? proxyToFlask(req, res) : serveStatic(req, res);
}).listen(PORT, () => {
  console.log("\n🌿 Carbon-Wise v5.0 — Production Server");
  console.log(`   App:        http://localhost:${PORT}`);
  console.log(`   API Proxy → http://localhost:${FLASK_PORT}`);
  console.log("\n   Dev mode: npm start (hot-reload)\n");
});
