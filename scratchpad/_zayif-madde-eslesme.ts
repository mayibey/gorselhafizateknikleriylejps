// 24 Kas: Er Meydanı zayıf madde -> kart eşleşmesi ölçümü (başkanın gerçek kayıtları + tümü).
import { SEED_CARDS } from '../src/db/seed';
import { eslesenKartIdleri } from '../src/lib/sinav';
import fs from 'node:fs';
const kayit: { kanun: number; madde: string; yanlis: number }[] = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
let tut = 0, yok: string[] = [];
for (const k of kayit) {
  const havuz = SEED_CARDS.filter((c) => c.law_id === k.kanun) as any;
  const ids = eslesenKartIdleri(`m.${k.madde}`, havuz);
  if (ids.length) tut++; else yok.push(`${k.kanun}/${k.madde}`);
}
console.log('toplam', kayit.length, 'karta giden', tut, 'gitmeyen', yok.length, yok.slice(0, 30).join(' '));
