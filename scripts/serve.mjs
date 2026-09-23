import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const types = {'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json'};
http.createServer(async(req,res)=>{
 try {
  let name = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(name.endsWith('/')) name += 'index.html';
  const file = path.resolve(root, '.' + name);
  if(!file.startsWith(root) || name.split('/').some(p=>p.startsWith('.'))) {res.writeHead(403);res.end();return;}
  res.setHeader('Content-Type',(types[path.extname(file)]||'application/octet-stream')+'; charset=utf-8');
  res.end(await readFile(file));
 } catch {res.writeHead(404);res.end('Not found');}
}).listen(4173,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:4173/k8s/'));
