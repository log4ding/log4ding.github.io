import http from 'node:http';
import os from 'node:os';
const version = process.env.APP_VERSION || 'v1';
const app = http.createServer((req, res) => {
  if (req.url === '/healthz') { res.end('ok'); return; }
  if (req.url.startsWith('/api')) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({version, pod: os.hostname()})); return;
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end('<!doctype html><html lang="ko"><meta charset="utf-8"><title>K8s lab</title><body style="font:20px system-ui;padding:50px;background:#eef5e5"><h1>Hello Kubernetes · ' + version + '</h1><p>Pod: ' + os.hostname() + '</p><button id="load">API 호출</button><pre id="result"></pre><script>document.querySelector("#load").onclick=async()=>{try{const r=await fetch("/api");document.querySelector("#result").textContent=JSON.stringify(await r.json(),null,2);}catch(e){document.querySelector("#result").textContent=e.message;}};</script></body></html>');
});
app.listen(8080, '0.0.0.0');
process.on('SIGTERM', () => app.close(() => process.exit(0)));
