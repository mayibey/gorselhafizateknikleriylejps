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

// Başkan (26 Ağu): dosyalar masaüstünde dursun — ChatGPT'ye oradan verilecek.
const KLASOR = process.env.HAFIZA_KLASOR || 'C:/Users/GIGABYTE/OneDrive/Desktop/HAFIZA KANUN DOSYALARI';
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
  L.push('---');
  L.push('');
  L.push('## ÖĞRETİLMESİ GEREKEN BİLGİLER');
  L.push('');
  L.push('*Aşağıdakiler JSPS sınavında gerçekten sorulmuş ve doğru cevabı doğrulanmıştır.*');
  for (const [tur, liste] of sirali) {
    L.push('');
    L.push(`### ${TUR_ADI[tur] || tur}`);
    L.push('');
    for (const b of liste) {
      const md = b.madde ? (b.maddeKesin ? ` · madde ${b.madde}` : ` · ~madde ${b.madde}`) : "";
      L.push(`**S.** ${b.soru.replace(/\s+/g, " ").trim()}`);
      L.push('');
      if (b.bicim === 'OLUMSUZ') {
        L.push(`**Cevap (${b.cevapHarfi}) — bu ifade YANLIŞ:** ${String(b.cevapMetni).replace(/\s+/g, " ").trim()}`);
        L.push('');
        L.push('*(Öğretilecek olan bunun DOĞRUSUDUR — aşağıdaki resmî metinden teyit et.)*');
      } else {
        L.push(`**Cevap (${b.cevapHarfi}):** ${String(b.cevapMetni).replace(/\s+/g, " ").trim()}`);
      }
      L.push(`<sub>${tur}${md}</sub>`);
      L.push('');
    }
  }

  if (metinler.length) {
    L.push('---');
    L.push('');
    L.push('## İLGİLİ KANUN METNİ');
    L.push('');
    L.push('*Mevzuatın kendisi. Üretilecek içerik bu metne uymak zorunda; metinde olmayan bilgi eklenmemeli.*');
    L.push('');
    for (const m of metinler) {
      L.push(`**Madde ${m.maddeNo}**`);
      L.push('');
      L.push("> " + String(m.metin).replace(/\s+/g, " ").trim().slice(0, 1400));
      L.push('');
    }
  }
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
