/**
 * BOT DÜZELTMELERİ — 2 Eyl 2026 (başkan: "çöz işte napacaksan").
 * Canlı ölçümden çıkan üç kusur:
 *  1) Ana model 91 kez zaman aşımına uğradı: denetim çağrıları pro ile yapılıyor, pro'da
 *     düşünme kapatılamıyor, 60 sn sınırı aşılıyor → en zayıf modele (flash-lite) düşülüyor.
 *  2) Sayı süzgeci yalnız SORUDA ADI GEÇEN kanunun metnine bakıyor; cevabın dayanağı başka
 *     kanunda ise (2803 sorusu, dayanak 926) "dayanaksız" deyip DOĞRU cevabı çöpe atıyor.
 *  3) "Döneceğim" sözünün %42'si tutulmadı: elimizde olmayan kanunu öğrenme yolu KAPALI —
 *     VPS'ten mevzuat.gov.tr'ye erişilemiyor (HTTP 000; ogrenilen.json 3 Ağustos'tan beri
 *     büyümüyor). Bot bunu sessizce yutuyordu; artık hangi kanunun eksik olduğunu raporluyor.
 */
import fs from 'node:fs';

const KOK = 'D:/jsps-community-bot/';
let n = 0;
const degistir = (p, eski, yeni, ad) => {
  const s = fs.readFileSync(KOK + p, 'utf8');
  if (!s.includes(eski)) { console.log('  ✗ ÇAPA YOK:', ad); process.exit(1); }
  fs.writeFileSync(KOK + p, s.replace(eski, yeni), 'utf8');
  console.log('  ✓', ad);
  n++;
};

// ——— 1) Zaman sınırı 60 → 100 sn ———
degistir('src/llm/saglayici.ts',
  'const ISTEK_ZAMAN_SINIRI_MS = 60_000;',
  `// 60 sn YETMİYORDU (2 Eyl 2026 ölçümü: log'da 91 kez "model battı"). Gemini pro'da düşünme
// kapatılamıyor ve uzun cevaplarda 60 sn'yi aşıyor; sınır dolunca en zayıf modele düşülüyor
// ve cevabın kalitesi çöküyordu. 100 sn, pro'nun düşünme payını karşılıyor.
const ISTEK_ZAMAN_SINIRI_MS = 100_000;`,
  'zaman sınırı 100 sn');

// ——— 2) Denetim çağrıları için HIZLI model ———
degistir('src/config.ts',
  "    modelDenetim: process.env.MODEL_DENETIM ?? 'claude-sonnet-5',",
  `    modelDenetim: process.env.MODEL_DENETIM ?? 'claude-sonnet-5',
    // DENETİM ÇAĞRILARI AYRI MODEL (2 Eyl 2026): öz-denetim ve çoktan-seçmeli denetimi pro ile
    // yapılıyordu; pro düşünmeyi kapatamadığı için zaman aşımına uğrayıp flash-lite'a düşüyor,
    // yani denetimi EN ZAYIF model yapıyordu. Denetim "ikinci göz" işi — hız burada kaliteden
    // önemli. (Aynı hastalık 31 Ağu'da OCR için çözülmüştü, denetim çağrıları unutulmuş.)
    modelDenetimHizli: process.env.MODEL_DENETIM_HIZLI ?? 'gemini:gemini-3-flash-preview',`,
  'config: modelDenetimHizli');

degistir('src/claude/qa.ts',
  "        maxTokens: 8000, amac: 'oz-denetim',",
  "        maxTokens: 8000, amac: 'oz-denetim', dusunmeKapali: true,",
  'öz-denetim: düşünme kapalı');

degistir('src/claude/qa.ts',
  '        model: config.claude.modelDenetim, // bağımsız ikinci göz (Sonnet — çıktısı tek kelime, Opus israftı)',
  '        model: config.claude.modelDenetimHizli, // bağımsız ikinci göz — HIZLI model (pro zaman aşımına uğruyordu)',
  'öz-denetim: hızlı model');

degistir('src/claude/qa.ts',
  "        model: config.claude.modelIcerik, // Sonnet (ucuz), mantık+hukuk için yeterli",
  "        model: config.claude.modelDenetimHizli, // HIZLI model: pro burada 60 sn'yi aşıp flash-lite'a düşüyordu",
  'çoktan seçmeli denetimi: hızlı model');

degistir('src/claude/qa.ts',
  "        maxTokens: 8000, amac: 'coktan-secmeli-denetim',",
  "        maxTokens: 8000, amac: 'coktan-secmeli-denetim', dusunmeKapali: true,",
  'çoktan seçmeli: düşünme kapalı');

// ——— 3) Sayı süzgeci: çöpe atmadan ÖNCE cevabın kendi atıflarını kaynağa ekle ———
degistir('src/claude/qa.ts',
  `    const bulgu = dayanaksizSureler(ham, kaynakMetin, genisKaynak, soru + ' ' + (oncekiSoru || ''));
    if (bulgu.length) {
      log.uyari('sayı denetimi: dayanaksız süre -> ' + bulgu.map((x) => x.sayi + ' ' + x.birim + ' (' + x.sebep + ')').join(' | '));
      ham = DURUST_SAYI;
    }`,
  `    let bulgu = dayanaksizSureler(ham, kaynakMetin, genisKaynak, soru + ' ' + (oncekiSoru || ''));
    // İKİNCİ ŞANS (2 Eyl 2026 canlı vaka): soru "2803'e göre mecburi hizmet" diyordu, hükmün
    // dayanağı ise 926 sayılı Kanunda. Süzgeç yalnız SORUDAKİ kanunun metnine baktığı için
    // doğru cevabı "dayanaksız" sayıp çöpe attı. Artık cevabın KENDİ ATIFLARI (ör. "926 sayılı
    // ... m.112") de çekilip kaynağa ekleniyor ve bir kez daha bakılıyor; hâlâ dayanaksızsa
    // dürüst cevaba dönülür. Yanlış cevabı geçirmez — yalnız DOĞRU cevabın kaynağını genişletir.
    if (bulgu.length) {
      const atiflar = [...new Set((ham.match(/\\b\\d{3,5}\\s*say[ıi]l[ıi][^.;\\n]{0,80}?m(?:adde)?\\.?\\s*\\d{1,3}/gi) || []).slice(0, 4))];
      const ekMetin: string[] = [];
      for (const a of atiflar) for (const m of maddeAra(a, 2)) ekMetin.push(m.metin);
      if (ekMetin.length) {
        const tekrar = dayanaksizSureler(ham, [...kaynakMetin, ...ekMetin], true, soru + ' ' + (oncekiSoru || ''));
        log.bilgi(\`sayı denetimi 2. tur: cevabın atıfları eklendi (\${atiflar.join(', ')}) -> \${tekrar.length ? 'hâlâ dayanaksız' : 'DAYANAK BULUNDU, cevap korundu'}\`);
        bulgu = tekrar;
      }
    }
    if (bulgu.length) {
      log.uyari('sayı denetimi: dayanaksız süre -> ' + bulgu.map((x) => x.sayi + ' ' + x.birim + ' (' + x.sebep + ')').join(' | '));
      ham = DURUST_SAYI;
    }`,
  'sayı denetimi: ikinci şans');

// ——— 4) Elimizde OLMAYAN kanunu görünür kıl ———
degistir('src/db/arastir.ts',
  `  let txt = '';
  for (const t of ['5', '4', '3']) { txt = await pdfMetni(\`https://www.mevzuat.gov.tr/mevzuatmetin/1.\${t}.\${no}.pdf\`); if (txt.length > 1200) break; }
  if (txt.length < 1200) return { bulundu: false };`,
  `  let txt = '';
  for (const t of ['5', '4', '3']) { txt = await pdfMetni(\`https://www.mevzuat.gov.tr/mevzuatmetin/1.\${t}.\${no}.pdf\`); if (txt.length > 1200) break; }
  if (txt.length < 1200) {
    // SESSİZ BAŞARISIZLIK BİTTİ (2 Eyl 2026): sunucudan mevzuat.gov.tr'ye ERİŞİLEMİYOR
    // (curl HTTP 000 — site yurt dışı/veri merkezi IP'sini engelliyor). Bot bunu yutuyordu;
    // sonuç: elimizde olmayan her kanunda "döneceğim" sözü tutulamıyordu (19 sözün 8'i).
    // Artık hangi kanunun eksik olduğu LOG'a düşer → yerelden yüklenip sunucuya kopyalanır
    // (scripts/kanun-ogret.mjs). Ölçüm: ogrenilen.json 3 Ağustos'tan beri büyümüyordu.
    log.uyari(\`MEVZUAT EKSİK: \${no} sayılı kanun elimizde yok ve sunucudan indirilemedi \`
      + '(mevzuat.gov.tr erişilemiyor). Yerelden öğretilmeli: npm run kanun:ogret ' + no);
    return { bulundu: false };
  }`,
  'eksik kanun raporlanıyor');

console.log(`\nuygulanan yama: ${n}`);
