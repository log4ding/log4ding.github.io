import assert from 'node:assert/strict';
import {readFile,access,mkdtemp,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {initialTraffic,advanceTraffic,localityStep} from '../k8s/traffic-animation.js';
import {createStudyApp} from '../k8s/labs/advanced/server.mjs';
const chapters=JSON.parse(await readFile(new URL('../k8s/catalog.json',import.meta.url),'utf8'));
assert.equal(chapters.length,16);
let assignments=0;
for(const c of chapters)for(const s of c.slides){
 if(s.file)await access(new URL('../k8s/labs/'+s.file,import.meta.url));
 if(s.assignment){assignments++;assert.equal(s.assignment.criteria.reduce((n,r)=>n+parseInt(r[1]),0),100);}
}assert.equal(assignments,3);
for(const mode of ['region']){
 let s=initialTraffic(mode);
 s=advanceTraffic(s).state;s.failedAt=s.tick;
 for(let i=0;i<2;i++)s=advanceTraffic(s).state;
 assert.ok(s.failures>0);const failures=s.failures;
 let result=advanceTraffic(s);assert.equal(result.event.target,'B');s=result.state;
 while(s.pending.length)s=advanceTraffic(s,true).state;
 assert.equal(s.total,s.success);assert.equal(s.failures,failures);assert.ok(s.retries>0);
}
const samples=Array.from({length:8},(_,i)=>localityStep(i));
assert.ok(samples.some(s=>s.before==='B'));assert.ok(samples.some(s=>s.before==='A'));assert.ok(samples.every(s=>s.after==='A'));
const dir=await mkdtemp(path.join(os.tmpdir(),'k8s-study-'));
const logs=[];let slowStarted;
const started=new Promise(resolve=>slowStarted=resolve);
const app=createStudyApp({flagDir:dir,startupMs:80,slowMs:150,log:line=>{logs.push(JSON.parse(line));if(JSON.parse(line).event==='slow-start')slowStarted();}});
try{
 await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+app.server.address().port;
 assert.equal((await fetch(base+'/startupz')).status,503);
 await new Promise(resolve=>setTimeout(resolve,100));
 assert.equal((await fetch(base+'/readyz')).status,200);
 await writeFile(path.join(dir,'not-ready'),'');
 assert.equal((await fetch(base+'/readyz')).status,503);
 assert.equal((await fetch(base+'/livez')).status,200);
 await rm(path.join(dir,'not-ready'));
 const response=await fetch(base+'/users',{headers:{'X-Study-Id':'test-01'}});assert.equal((await response.json()).study_id,'test-01');
 const slow=fetch(base+'/api/slow');await started;const closed=app.shutdown();
 assert.equal((await slow).status,200);await closed;assert.ok(logs.some(l=>l.event==='drained'));
}finally{await app.shutdown();await rm(dir,{recursive:true,force:true});}
console.log('Verified catalog, assignments, traffic failure/retry accounting, HTTP readiness and graceful drain');
