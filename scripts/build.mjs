import { readdir, readFile, writeFile } from 'node:fs/promises';
const folder = new URL('../k8s/chapters/', import.meta.url);
const files = (await readdir(folder)).filter(name => name.endsWith('.json')).sort();
const chapters = await Promise.all(files.map(async file => JSON.parse(await readFile(new URL(file, folder), 'utf8'))));
if (new Set(chapters.map(c => c.id)).size !== chapters.length) throw new Error('Duplicate chapter id');
for (const chapter of chapters) if (!chapter.title || !chapter.slides?.length) throw new Error('Invalid chapter');
await writeFile(new URL('../k8s/catalog.json', import.meta.url), JSON.stringify(chapters, null, 2));
console.log(`Built ${chapters.length} chapters / ${chapters.reduce((sum, c) => sum + c.slides.length, 0)} slides`);
