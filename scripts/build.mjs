import {readdir,readFile,writeFile} from 'node:fs/promises';
const chapters=[];
for(const [folder,track] of [['chapters','basic'],['advanced','advanced']]){
 const base=new URL('../k8s/'+folder+'/',import.meta.url);
 for(const file of (await readdir(base)).filter(n=>n.endsWith('.json')).sort()) chapters.push({...JSON.parse(await readFile(new URL(file,base),'utf8')),track});
}
if(new Set(chapters.map(c=>c.id)).size!==chapters.length)throw new Error('Duplicate id');
for(const c of chapters)if(!c.title||!c.slides?.length)throw new Error('Invalid chapter');
await writeFile(new URL('../k8s/catalog.json',import.meta.url),JSON.stringify(chapters,null,2));
console.log('Built',chapters.length,'chapters /',chapters.reduce((n,c)=>n+c.slides.length,0),'slides');
