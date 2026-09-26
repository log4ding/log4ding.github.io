import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {existsSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

// No admin HTTP endpoints: fault flags are created with kubectl exec in the lab.
export function createStudyApp({role='api',version='v1',startupMs=3000,slowMs=15000,flagDir='/tmp',log=console.log}={}) {
  let initialized=false,draining=false;
  const startup=setTimeout(()=>{initialized=true;},startupMs);
  const flag=name=>existsSync(path.join(flagDir,name));
  const safeHeader=value=>typeof value==='string'&&/^[a-zA-Z0-9_.:-]{1,80}$/.test(value)?value:null;
  const server=http.createServer((req,res)=>{
    const pathname=new URL(req.url,'http://lab.local').pathname;
    const studyId=safeHeader(req.headers['x-study-id']);
    const requestId=safeHeader(req.headers['x-request-id']);
    const started=Date.now();
    res.on('finish',()=>log(JSON.stringify({event:'response',role,version,pod:os.hostname(),path:pathname,status:res.statusCode,study_id:studyId,request_id:requestId,duration_ms:Date.now()-started})));
    const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
    if(pathname==='/startupz')return send(initialized?200:503,{initialized});
    if(pathname==='/livez')return send(flag('dead')?503:200,{alive:!flag('dead')});
    if(pathname==='/readyz')return send(initialized&&!draining&&!flag('not-ready')?200:503,{initialized,draining,ready:!flag('not-ready')});
    if(draining)return send(503,{error:'draining'});
    const data={role,version,pod:os.hostname(),path:pathname,study_id:studyId};
    if(role==='frontend'&&pathname==='/'){
      res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
      return res.end('<!doctype html><html lang="ko"><meta charset="utf-8"><title>Advanced lab</title><body><h1>Frontend · '+version+'</h1><button id="load">/api/users 호출</button><pre id="result"></pre><script>document.querySelector("#load").onclick=async()=>{const r=await fetch("/api/users",{headers:{"X-Study-Id":"browser-demo"}});document.querySelector("#result").textContent=JSON.stringify(await r.json(),null,2);};</script></body></html>');
    }
    if(role==='api'&&['/api/users','/users'].includes(pathname))return send(200,{...data,users:['study-user']});
    if(role==='api'&&['/api/slow','/slow'].includes(pathname)){
      log(JSON.stringify({event:'slow-start',study_id:studyId,pod:os.hostname()}));
      return setTimeout(()=>send(200,{...data,finished:true}),slowMs);
    }
    return send(404,{...data,error:'route not implemented by this app'});
  });
  const shutdown=()=>{
    if(draining)return Promise.resolve();
    draining=true;clearTimeout(startup);
    log(JSON.stringify({event:'sigterm',role,pod:os.hostname()}));
    return new Promise(resolve=>{
      const deadline=setTimeout(()=>{log(JSON.stringify({event:'drain-timeout'}));server.closeAllConnections();},25000);
      deadline.unref();
      server.close(()=>{clearTimeout(deadline);log(JSON.stringify({event:'drained'}));resolve();});
    });
  };
  return {server,shutdown};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  const app=createStudyApp({role:process.env.ROLE||'api',version:process.env.APP_VERSION||'v1'});
  app.server.listen(8080,'0.0.0.0');
  process.once('SIGTERM',()=>{app.shutdown().then(()=>process.exit(0));});
  process.once('SIGINT',()=>{app.shutdown().then(()=>process.exit(0));});
}
