/**
 * HAFIZA BRIEF ÜRETECİ — her kanun için ChatGPT'ye verilecek tek dosya. (26 Ağu 2026)
 *
 * Başkan: "görselleri ve fikri ChatGPT'ye vereceğim; ona kanunun metnini ve öğretmek
 * istediğimiz şeyi güzel bir dosya yap."
 *
 * Dosya kendi kendine yeter: karşı taraf ne sınavı bilir ne bizim verimizi. İçinde
 *   1. sınav bu kanundan NEYİ soruyor (ölçülmüş dağılım)
 *   2. GERÇEKTEN çıkmış sorular + DOĞRULANMIŞ cevapları
 *   3. sınavın karıştırdığı değerler (çeldirici kümesi) — hafızanın kırılma noktası
 *   4. ilgili RESMÎ MADDE METİNLERİ (tek doğru kaynak, uydurmaya yer bırakmaz)
 *   5. ne üretmesi istendiği
 *
 * ⛔ Belgeye YALNIZ ölçülmüş/doğrulanmış şey girer. Tahmini madde numaraları "~" ile
 * işaretlenir; cevabı bilinmeyen soru girmez.
 *
 *   node scripts/hafiza-brief-uret.mjs 2803     → tek kanun
 *   node scripts/hafiza-brief-uret.mjs --hepsi  → 6+ bilgisi olan tüm kanunlar
 */
import fs from 'node:fs';
import path from 'node:path';
import { korpus } from './sinav-madde-eslestir.mjs';
import { CEZALAR, eslesenler, MAKAMLAR, sureDegerleri } from './soru-tipleri.mjs';

const KLASOR = 'docs/HAFIZA';
const bilgiler = JSON.parse(fs.readFileSync('scripts/veri/kanun-bilgi-listesi.json', 'utf8'));
const kritik = JSON.parse(fs.readFileSync('scripts/veri/sinav-kritik.json', 'utf8'));

const TUR_ADI = {
  'KAPSAM/UNSUR': 'Kapsam / unsur — "şunun kapsamına ne girer, ne girmez"',
  'MAKAM/KİŞİ': 'Makam / kişi — "bu işi kim yapar, kim karar verir"',
  'GÖREV/YETKİ': 'Görev / yetki',
  'SÜRE': 'Süre',
  'SAYI/EŞİK': 'Sayı / eşik',
  'TANIM': 'Tanım',
  'CEZA/YAPTIRIM': 'Ceza / yaptırım',
};

const dosyaAdi = (kanun) =>
  kanun.toLocaleLowerCase('tr').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

function brief(k) {
  const kr = kritik.kanunlar.find((x) => x.kanun === k.kanun);
  const maddeler = korpus.filter((m) => m.tur === 'madde' && m.kanun === k.kanun);

  // Bilgileri türe göre grupla
  const gruplar = new Map();
  for (const b of k.bilgiler) {
    if (!gruplar.has(b.tur)) gruplar.set(b.tur, []);
    gruplar.get(b.tur).push(b);
  }
  const sira = ['MAKAM/KİŞİ', 'SÜRE', 'SAYI/EŞİK', 'CEZA/YAPTIRIM', 'GÖREV/YETKİ', 'KAPSAM/UNSUR', 'TANIM'];
  const sirali = [...gruplar.entries()].sort((a, b) => (sira.indexOf(a[0]) + 99) % 99 - (sira.indexOf(b[0]) + 99) % 99);

  // Belgeye girecek maddeler: sorularda geçen (kesin + tahmini)
  const gecen = new Set(k.bilgiler.map((b) => b.madde).filter(Boolean));
  const metinler = maddeler.filter((m) => gecen.has(m.maddeNo)).slice(0, 25);

  const L = [];
  L.push(`# ${k.kanun}`);
  L.push('');
  L.push('> **Bu dosya ne?** JSPS sınavında çıkmış gerçek sorular ölçülerek çıkarıldı. Amaç: bu kanun için');
  L.push('> **görsel çağrışım / hafıza tekniği** üretmek. Aşağıdaki her bilgi gerçek sınavda sorulmuş ve');
  L.push('> doğru cevabı doğrulanmıştır. Uydurma bilgi yok; tahmini olanlar `~` ile işaretli.');
  L.push('');
  L.push('---');
  L.push('');
  L.push('## 1. Sınav bu kanundan neyi soruyor?');
  L.push('');
  L.push(`Cevabı doğrulanmış soru: **${k.cevapliSoru}**` + (kr ? ` · ${kr.kitapcikSayisi} ayrı sınav kitapçığında çıkmış` : ''));
  L.push('');
  L.push('| Ne biliniyor olmalı | Soru |');
  L.push('|---|---|');
  for (const [t, n] of Object.entries(k.turDagilimi)) L.push(`| ${TUR_ADI[t] || t} | ${n} |`);
  L.push('');
  L.push('**Soru biçimi:** ' + Object.entries(k.bicimDagilimi).map(([b, n]) => `${b.toLocaleLowerCase('tr')} ${n}`).join(' · '));
  const olumsuzN = k.bicimDagilimi['OLUMSUZ'] || 0;
  if (olumsuzN) {
    L.push('');
    L.push(`> ⚠️ Soruların **${olumsuzN}** tanesi olumsuz ("hangisi **yanlıştır**"). Orada doğru cevap,`);
    L.push('> **yanlış olan ifadedir** — yani ezberlenmesi gereken, o ifadenin DOĞRUSUDUR.');
  }

  // Çeldirici kümeleri
  if (kr) {
    const bloklar = [
      ['Karıştırılan makamlar', kr.karistirilanMakamlar?.map((x) => `${x.deger} (${x.kez})`)],
      ['Karıştırılan süreler', kr.karistirilanSureler?.map((x) => `${x.deger} (${x.kez})`)],
      ['Karıştırılan cezalar', kr.karistirilanCezalar?.map((x) => `${x.deger} (${x.kez})`)],
    ].filter(([, v]) => v && v.length);
    if (bloklar.length) {
      L.push('');
      L.push('### Sınavın kafa karıştırdığı değerler');
      L.push('');
      L.push('*(şıklarda çeldirici olarak kaç kez kullanıldığı)*');
      L.push('');
      for (const [ad, v] of bloklar) L.push(`- **${ad}:** ${v.join(' · ')}`);
      L.push('');
      L.push('> Hafıza tekniği tam bu ayrımlar üzerine kurulmalı — kişi bunları birbirine karıştırıyor.');
    }
  }

  L.push('');
  L.push('---');
  L.push('');
  L.push('## 2. Öğretilecek bilgiler (gerçek sınav soruları + doğrulanmış cevap)');
  for (const [tur, liste] of sirali) {
    L.push('');
    L.push(`### ${TUR_ADI[tur] || tur}`);
    L.push('');
    for (const b of liste) {
      const md = b.madde ? (b.maddeKesin ? ` · madde ${b.madde}` : ` · ~madde ${b.madde}`) : '';
      L.push(`**S.** ${b.soru.replace(/\s+/g, ' ').trim()}`);
      L.push('');
      if (b.bicim === 'OLUMSUZ') {
        L.push(`**Cevap (${b.cevapHarfi}) — bu ifade YANLIŞ:** ${String(b.cevapMetni).replace(/\s+/g, ' ').trim()}`);
        L.push('');
        L.push('*(Ezberlenecek olan bunun DOĞRUSU — resmî metinden teyit et.)*');
      } else {
        L.push(`**Cevap (${b.cevapHarfi}):** ${String(b.cevapMetni).replace(/\s+/g, ' ').trim()}`);
      }
      L.push(`<sub>${tur}${md}</sub>`);
      L.push('');
    }
  }

  if (metinler.length) {
    L.push('---');
    L.push('');
    L.push('## 3. İlgili resmî madde metinleri (tek doğru kaynak)');
    L.push('');
    L.push('*Aşağıdaki metin mevzuatın kendisidir. Üretilecek görsel/çağrışım bu metne uymak zorunda;*');
    L.push('*metinde olmayan bir bilgi eklenmemeli.*');
    L.push('');
    for (const m of metinler) {
      L.push(`**Madde ${m.maddeNo}**`);
      L.push('');
      L.push('> ' + String(m.metin).replace(/\s+/g, ' ').trim().slice(0, 1400));
      L.push('');
    }
  }

  L.push('---');
  L.push('');
  L.push('## 4. Senden istenen');
  L.push('');
  L.push('Bu kanun için **tek bir görsel hafıza sahnesi** kur:');
  L.push('');
  L.push('1. Yukarıdaki bilgileri **tek bir tematik sahnede** topla (kanunun konusuna uygun bir mekân/metafor).');
  L.push('2. Sınavın karıştırdığı ayrımları sahnede **görsel olarak birbirinden ayır** — özellikle');
  L.push('   "hangi makam" ve "kaç gün/yıl" gibi çeldiricileri.');
  L.push('3. Her bilgi sahnede **etiketli bir unsur** olsun; bakan kişi tek bakışta hangi bilginin nerede');
  L.push('   olduğunu görebilmeli.');
  L.push('4. Sonunda **"AKLINA ÇİVİLE"** satırı: o kanunun özünü tek cümlede veren çivileme.');
  L.push('5. Metinde olmayan hiçbir bilgi ekleme; sayılar ve makam adları resmî metinle birebir aynı olsun.');
  L.push('');
  L.push('---');
  L.push('');
  L.push(`<sub>Üretim: scripts/hafiza-brief-uret.mjs · kaynak: 9 çıkmış JSPS PDF, ${bilgiler.kaynak}</sub>`);
  return L.join('\n');
}

fs.mkdirSync(KLASOR, { recursive: true });
const sec = process.argv[2];
const hedef = sec === '--hepsi'
  ? bilgiler.kanunlar.filter((k) => k.cevapliSoru >= 6)
  : bilgiler.kanunlar.filter((k) => k.kanun.includes(sec || '____'));

if (!hedef.length) { console.log('kanun bulunamadı:', sec); process.exit(1); }
for (const k of hedef) {
  const yol = path.join(KLASOR, `${dosyaAdi(k.kanun)}.md`);
  fs.writeFileSync(yol, brief(k), 'utf8');
  console.log(`${String(k.cevapliSoru).padStart(3)} bilgi → ${yol}`);
}
console.log(`\n${hedef.length} dosya yazıldı.`);
