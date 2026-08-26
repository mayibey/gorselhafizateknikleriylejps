/**
 * KANUN BAZLI ÖĞRENİLECEK BİLGİ LİSTESİ — "sınav tam olarak bunu sordu, cevabı buydu".
 * (26 Ağu 2026, başkan: hafıza/görsel çağrışım çalışması buna dayanacak.)
 *
 * GİRDİ: scripts/veri/sinav-cevapli.json — 2.298 çıkmış soru, 664'ü DOĞRU CEVABIYLA
 *        (cevap kaynağı: sınav sonu anahtar sayfası ya da kitapçıkta kırmızı işaret).
 * İŞLEM: her soru kanuna atanır (adı yazıyorsa kesin; yazmıyorsa TF-IDF+kNN, güven≥0.65),
 *        doğru şıkkın METNİ okunur → "öğrenilecek bilgi" budur.
 * ÇIKTI: kanun kanun, ne tür bilgi (süre/makam/ceza…), soru + doğru cevap metni.
 *
 * ⛔ TAHMİN YOK: cevabı olmayan soru bu listeye GİRMEZ. Liste "sınavın gerçekten sorduğu ve
 * cevabını bildiğimiz" bilgilerden oluşur; şişirmek için doldurulmaz.
 *
 *   node scripts/kanun-bilgi-listesi.mjs           → tüm kanunlar özet
 *   node scripts/kanun-bilgi-listesi.mjs 2803      → tek kanun, tam liste
 */
import fs from 'node:fs';
import { siniflandir } from './sinav-madde-eslestir.mjs';
import { bilgiTuru, soruBicimi } from './soru-tipleri.mjs';

const veri = JSON.parse(fs.readFileSync('scripts/veri/sinav-cevapli.json', 'utf8'));
const cevapli = veri.sorular.filter((q) => q.cevap && Object.keys(q.siklar || {}).length >= 4);

const kanunlar = new Map();
let atanamayan = 0;

for (const q of cevapli) {
  const siklar = Object.values(q.siklar);
  const r = siniflandir(q.kok, siklar);
  if (!r.kanun || (r.kaynak === 'benzerlik' && r.guven < 0.65)) { atanamayan++; continue; }

  if (!kanunlar.has(r.kanun)) {
    kanunlar.set(r.kanun, { kanun: r.kanun, kayit: [], turler: new Map(), bicimler: new Map(), kitapciklar: new Set() });
  }
  const k = kanunlar.get(r.kanun);
  const tur = bilgiTuru(q.kok, siklar);
  const bicim = soruBicimi(q.kok, siklar);
  k.turler.set(tur, (k.turler.get(tur) || 0) + 1);
  k.bicimler.set(bicim, (k.bicimler.get(bicim) || 0) + 1);
  k.kitapciklar.add(`${q.dosya}#${q.sayfa}`);
  k.kayit.push({
    tur,
    bicim,
    madde: r.madde,
    maddeKesin: r.maddeKaynak === 'kökte yazıyor',
    soru: q.kok,
    cevapHarfi: q.cevap,
    // ÖĞRENİLECEK BİLGİ = doğru şıkkın metni (olumsuz soruda "yanlış olan" olduğuna dikkat)
    cevapMetni: q.siklar[q.cevap] ?? '(şık metni okunamadı)',
    cevapKaynak: q.cevapKaynak,
    kaynakDosya: q.dosya,
  });
}

const sonuc = [...kanunlar.values()]
  .sort((a, b) => b.kayit.length - a.kayit.length)
  .map((k) => ({
    kanun: k.kanun,
    cevapliSoru: k.kayit.length,
    turDagilimi: Object.fromEntries([...k.turler].sort((a, b) => b[1] - a[1])),
    bicimDagilimi: Object.fromEntries([...k.bicimler].sort((a, b) => b[1] - a[1])),
    bilgiler: k.kayit,
  }));

fs.writeFileSync('scripts/veri/kanun-bilgi-listesi.json', JSON.stringify({
  uretim: 'kanun-bilgi-listesi.mjs',
  kaynak: '9 çıkmış JSPS PDF · 2.298 soru · 664 cevaplı',
  kapsam: { cevapliSoru: cevapli.length, kanunaAtanan: cevapli.length - atanamayan, atanamayan },
  kanunlar: sonuc,
}, null, 1), 'utf8');

const sec = process.argv[2];
if (!sec) {
  console.log(`CEVAPLI SORU: ${cevapli.length} · kanuna atanan: ${cevapli.length - atanamayan} · atanamayan: ${atanamayan}\n`);
  console.log('kanun'.padEnd(46) + 'BİLGİ  BASKIN TÜR              BİÇİM');
  console.log('─'.repeat(104));
  for (const k of sonuc.slice(0, 30)) {
    const t = Object.entries(k.turDagilimi)[0];
    const b = Object.entries(k.bicimDagilimi)[0];
    console.log(
      (k.kanun.length > 44 ? k.kanun.slice(0, 43) + '…' : k.kanun).padEnd(46) +
      String(k.cevapliSoru).padStart(5) + '  ' +
      (t ? `${t[0]} (${t[1]})` : '').padEnd(24) +
      (b ? `${b[0]} (${b[1]})` : ''),
    );
  }
  console.log('\n→ scripts/veri/kanun-bilgi-listesi.json · tek kanun: node scripts/kanun-bilgi-listesi.mjs 2803');
} else {
  const k = sonuc.find((x) => x.kanun.includes(sec));
  if (!k) { console.log('bulunamadı:', sec); process.exit(1); }
  console.log(`\n${k.kanun}\n${'═'.repeat(92)}`);
  console.log(`cevabını bildiğimiz soru: ${k.cevapliSoru}`);
  console.log('ne soruluyor:', JSON.stringify(k.turDagilimi));
  console.log('nasıl soruluyor:', JSON.stringify(k.bicimDagilimi), '\n');
  const sirala = { 'SÜRE': 0, 'MAKAM/KİŞİ': 1, 'CEZA/YAPTIRIM': 2, 'SAYI/EŞİK': 3, 'TANIM': 4, 'GÖREV/YETKİ': 5, 'KAPSAM/UNSUR': 6 };
  for (const b of [...k.bilgiler].sort((x, y) => (sirala[x.tur] ?? 9) - (sirala[y.tur] ?? 9))) {
    const md = b.madde ? (b.maddeKesin ? ` · m.${b.madde}` : ` · ~m.${b.madde}`) : '';
    console.log(`[${b.tur}${md}] ${b.bicim === 'OLUMSUZ' ? '(OLUMSUZ SORU — cevap YANLIŞ olan şık)' : ''}`);
    console.log(`  S: ${b.soru.replace(/\s+/g, ' ').slice(0, 200)}`);
    console.log(`  ✔ ${b.cevapHarfi}) ${String(b.cevapMetni).replace(/\s+/g, ' ').slice(0, 190)}`);
    console.log('');
  }
}
