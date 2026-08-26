/**
 * SINAV KRİTİK ANALİZİ — "gerçek sınav her kanundan NEYİ soruyor, ne karıştırılıyor?"
 *
 * NEDEN (26 Ağu 2026, başkan): her kanun için görsel çağrışım/hafıza çalışması yapılacak.
 * Önce METAFOR DEĞİL ÖLÇÜ: hangi kanundan kaç soru, hangi TÜR bilgi (süre/makam/ceza/sayı),
 * hangi maddeler tekrar tekrar, hangi değerler birbirine çeldirici olarak konuyor.
 *
 * VERİ: 26 çımış JSPS kitapçığı · 2.336 soru · bunların 682'si MESLEK (mevzuat).
 * Kanun ataması: adı yazan 412 soru KESİN; adı yazmayan 270 soru için TF-IDF+kNN
 * sınıflandırıcı (sinav-madde-eslestir.mjs), güven ≥0.65 → ölçülen isabet %86.
 *
 * ÇIKTI: scripts/veri/sinav-kritik.json + ekrana özet
 *   node scripts/sinav-kritik-cikar.mjs            → tüm kanunlar sıralı özet
 *   node scripts/sinav-kritik-cikar.mjs 2803       → tek kanun detayı
 */
import fs from 'node:fs';
import { adaylar, korpus, siniflandir } from './sinav-madde-eslestir.mjs';
import { bilgiTuru, CEZALAR, eslesenler, MAKAMLAR, soruBicimi, sureDegerleri } from './soru-tipleri.mjs';

const GUVEN_ESIK = 0.65; // ölçülen: %86 isabet, %65 kapsam

// ---------- madde metni sözlüğü (doğru değeri resmî metinden okumak için) ----------
const maddeMetni = new Map();
for (const k of korpus) if (k.tur === 'madde') maddeMetni.set(`${k.kanun}||${k.maddeNo}`, k.metin);

// ---------- analiz ----------
const kanunlar = new Map();
let kesin = 0, siniflandirilan = 0, belirsiz = 0;

for (const q of adaylar) {
  const siklarMetni = (q.siklar || []).join(' | ');
  const r = siniflandir(q.kok, q.siklar);
  if (!r.kanun || (r.kaynak === 'benzerlik' && r.guven < GUVEN_ESIK)) { belirsiz++; continue; }
  if (r.kaynak === 'ad') kesin++; else siniflandirilan++;

  if (!kanunlar.has(r.kanun)) {
    kanunlar.set(r.kanun, {
      kanun: r.kanun, soru: 0, kitapciklar: new Set(), rutbeler: new Map(),
      turler: new Map(), bicimler: new Map(), maddeler: new Map(),
      sureler: new Map(), makamlar: new Map(), cezalar: new Map(), tekrarlar: new Map(),
      maddeKesin: new Map(), maddeTahmin: new Map(),
      ornekler: [],
    });
  }
  const k = kanunlar.get(r.kanun);
  k.soru++;
  k.kitapciklar.add(q.dosya);
  k.rutbeler.set(q.rutbe, (k.rutbeler.get(q.rutbe) || 0) + 1);
  const t = bilgiTuru(q.kok, q.siklar);
  k.turler.set(t, (k.turler.get(t) || 0) + 1);
  const b = soruBicimi(q.kok, q.siklar);
  k.bicimler.set(b, (k.bicimler.get(b) || 0) + 1);
  if (r.madde) {
    k.maddeler.set(r.madde, (k.maddeler.get(r.madde) || 0) + 1);
    // ⛔ Madde ataması iki KALİTEDE gelir ve karıştırılmamalı:
    //   'kökte yazıyor' → soru zaten maddeyi söylüyor (KESİN)
    //   'benzerlik'     → metin benzerliğinden tahmin (GÜVENİLMEZ; TCK'da "süreli hapis"
    //                     sorusuna m.188 dediği görüldü, doğrusu m.49)
    const hedef = r.maddeKaynak === 'kökte yazıyor' ? k.maddeKesin : k.maddeTahmin;
    hedef.set(r.madde, (hedef.get(r.madde) || 0) + 1);
  }
  // TEKRAR SİNYALİ: aynı soru farklı kitapçıklarda yeniden çıkmışsa, o bilgi "kesin gelir".
  // ⛔ TUZAK: yalnız KÖKE bakan parmak izi, "…hangisi yanlıştır?" gibi genel köklerde FARKLI
  // soruları aynı sanır ve "4 kitapçıkta çıktı" diye yanlış sinyal üretir. Şıklar da katılır.
  const sade = (x) => String(x || '').toLocaleLowerCase('tr').replace(/[^\p{L}\p{N}]+/gu, '');
  const parmak = sade(q.kok).slice(0, 80) + '|' + (q.siklar || []).map(sade).sort().join('').slice(0, 120);
  if (parmak.length > 60) {
    const t0 = k.tekrarlar.get(parmak) || { kez: 0, kitapciklar: new Set(), kok: q.kok, madde: r.madde, maddeKesin: r.maddeKaynak === 'kökte yazıyor' };
    t0.kez++; t0.kitapciklar.add(q.dosya);
    if (!t0.madde && r.madde) t0.madde = r.madde;
    k.tekrarlar.set(parmak, t0);
  }
  for (const d of sureDegerleri(siklarMetni)) k.sureler.set(d, (k.sureler.get(d) || 0) + 1);
  for (const d of eslesenler(siklarMetni, MAKAMLAR)) k.makamlar.set(d, (k.makamlar.get(d) || 0) + 1);
  for (const d of eslesenler(siklarMetni, CEZALAR)) k.cezalar.set(d, (k.cezalar.get(d) || 0) + 1);
  if (k.ornekler.length < 60) k.ornekler.push({ tur: t, bicim: b, kok: q.kok, siklar: q.siklar, kitapcik: q.dosya, rutbe: q.rutbe, madde: r.madde, kaynak: r.kaynak });
}

const dizi = (m, n) => [...m].sort((a, b) => b[1] - a[1]).slice(0, n).map(([d, c]) => ({ deger: d, kez: c }));
const sonuc = [...kanunlar.values()]
  .sort((a, b) => b.soru - a.soru)
  .map((k) => ({
    kanun: k.kanun,
    soru: k.soru,
    kitapcikSayisi: k.kitapciklar.size,
    tekrarOrani: +(k.soru / k.kitapciklar.size).toFixed(2), // kitapçık başına ortalama soru
    rutbe: Object.fromEntries([...k.rutbeler].sort((a, b) => b[1] - a[1])),
    turDagilimi: Object.fromEntries([...k.turler].sort((a, b) => b[1] - a[1])),
    bicimDagilimi: Object.fromEntries([...k.bicimler].sort((a, b) => b[1] - a[1])),
    sicakMaddelerKesin: dizi(k.maddeKesin, 12),
    sicakMaddelerTahmini: dizi(k.maddeTahmin, 12),
    tekrarEdenSorular: [...k.tekrarlar.values()]
      .filter((t) => t.kitapciklar.size >= 2)
      .sort((a, b) => b.kitapciklar.size - a.kitapciklar.size)
      .slice(0, 12)
      .map((t) => ({ kitapcik: t.kitapciklar.size, kez: t.kez, madde: t.madde, maddeKesin: t.maddeKesin, kok: String(t.kok).replace(/\s+/g, ' ').slice(0, 190) })),
    karistirilanSureler: dizi(k.sureler, 20),
    karistirilanMakamlar: dizi(k.makamlar, 12),
    karistirilanCezalar: dizi(k.cezalar, 10),
    ornekler: k.ornekler,
  }));

fs.writeFileSync('scripts/veri/sinav-kritik.json', JSON.stringify({
  uretim: 'sinav-kritik-cikar.mjs',
  kaynak: '26 çıkmış JSPS kitapçığı · 2.336 soru · 682 meslek sorusu',
  yontem: `kanun adı yazan soru KESİN; yazmayan için TF-IDF+kNN (güven ≥ ${GUVEN_ESIK}, ölçülen isabet %86)`,
  kapsam: { meslekSorusu: adaylar.length, kesin, siniflandirilan, belirsiz },
  kanunlar: sonuc,
}, null, 1), 'utf8');

// ---------- ekran ----------
const sec = process.argv[2];
if (!sec) {
  console.log(`MESLEK SORUSU: ${adaylar.length}  ·  kesin: ${kesin}  ·  sınıflandırılan: ${siniflandirilan}  ·  belirsiz: ${belirsiz}`);
  console.log(`kapsanan: ${kesin + siniflandirilan} (%${(100 * (kesin + siniflandirilan) / adaylar.length).toFixed(1)})\n`);
  console.log('kanun'.padEnd(48) + 'SORU  %    KİTAPÇIK  BASKIN TÜR');
  console.log('─'.repeat(100));
  const toplam = kesin + siniflandirilan;
  for (const k of sonuc) {
    const t = Object.entries(k.turDagilimi)[0];
    const yuz = ((100 * k.soru) / toplam).toFixed(1);
    console.log(
      k.kanun.slice(0, 46).padEnd(48) +
      String(k.soru).padStart(4) + '  ' + yuz.padStart(4) + '  ' +
      String(k.kitapcikSayisi).padStart(6) + '    ' +
      (t ? `${t[0]} (${t[1]})` : ''),
    );
  }
  console.log('\n→ scripts/veri/sinav-kritik.json · tek kanun: node scripts/sinav-kritik-cikar.mjs 2803');
} else {
  const k = sonuc.find((x) => x.kanun.includes(sec));
  if (!k) { console.log('bulunamadı:', sec); process.exit(1); }
  console.log(`\n${k.kanun}\n${'═'.repeat(78)}`);
  console.log(`soru: ${k.soru} · ${k.kitapcikSayisi} ayrı kitapçıkta · kitapçık başına ${k.tekrarOrani}`);
  console.log('rütbe:', JSON.stringify(k.rutbe));
  console.log('NE soruluyor :', JSON.stringify(k.turDagilimi));
  console.log('NASIL soruluyor:', JSON.stringify(k.bicimDagilimi));
  console.log('\n✅ SICAK MADDELER (soruda AÇIKÇA yazan — kesin):');
  console.log('   ', k.sicakMaddelerKesin.map((x) => `m.${x.deger}×${x.kez}`).join(' · ') || '—');
  console.log('~  Tahmini maddeler (benzerlikten — TEK BAŞINA GÜVENME, ölçülen kesinlik payı %17):');
  console.log('   ', k.sicakMaddelerTahmini.map((x) => `m.${x.deger}×${x.kez}`).join(' · ') || '—');
  console.log('\nKARIŞTIRILAN SÜRELER:', k.karistirilanSureler.map((x) => `${x.deger}×${x.kez}`).join(' · ') || '—');
  console.log('\nKARIŞTIRILAN MAKAMLAR:', k.karistirilanMakamlar.map((x) => `${x.deger}×${x.kez}`).join(' · ') || '—');
  console.log('\nKARIŞTIRILAN CEZALAR:', k.karistirilanCezalar.map((x) => `${x.deger}×${x.kez}`).join(' · ') || '—');
  console.log('\nGERÇEK SORU KÖKLERİ:');
  k.ornekler.slice(0, 15).forEach((o, i) => console.log(` ${String(i + 1).padStart(2)}. [${o.tur}] ${o.kok.replace(/\s+/g, ' ').slice(0, 165)}`));
}
