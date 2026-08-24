import fs from 'node:fs';
const anahtarlar=(f)=>new Set([...fs.readFileSync(f,'utf8').matchAll(/"([a-z0-9_]+)":\s*"/g)].map(m=>m[1]));
const g=anahtarlar('src/assets/kart-gorselleri.ts');
const s=anahtarlar('src/assets/kart-sesleri.ts');
console.log('görsel:',g.size,' ses:',s.size);
const sesFazla=[...s].filter(k=>!g.has(k));
const gorselFazla=[...g].filter(k=>!s.has(k));
console.log('SESİ VAR görseli YOK :', sesFazla.length, sesFazla.slice(0,20));
console.log('GÖRSELİ VAR sesi YOK :', gorselFazla.length, gorselFazla.slice(0,20));
