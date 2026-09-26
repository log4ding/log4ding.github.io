// Run from a second terminal while a Deployment is updated.
const endpoint=process.argv[2]||'http://localhost:18888/api/users';
const results=[];
for(let i=0;i<120;i++){
  const start=Date.now();
  try{
    const r=await fetch(endpoint,{headers:{'X-Study-Id':`rollout-${i}`},signal:AbortSignal.timeout(3000)});
    const body=await r.text();
    let data={};try{data=JSON.parse(body);}catch{}
    results.push({i,status:r.status,ms:Date.now()-start,version:data.version,pod:data.pod});
  }catch(e){results.push({i,status:'NETWORK_ERROR',ms:Date.now()-start,error:e.name});}
  console.log(JSON.stringify(results.at(-1)));
  await new Promise(resolve=>setTimeout(resolve,500));
}
console.log(JSON.stringify({summary:true,total:results.length,failed:results.filter(r=>r.status!==200).length,max_ms:Math.max(...results.map(r=>r.ms))}));
