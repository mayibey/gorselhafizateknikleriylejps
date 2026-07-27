// Madde metni registry üreticisi (görsel/ses registry'lerinin metin analoğu).
// Müşterek MASTER md dosyalarındaki "📜 Metin / 📜 Birebir metin" bloklarını tarar,
// her madde için resmî metni çıkarıp src/assets/kart-madde-metinleri.ts'i OTOMATİK yazar.
// Çalıştır: npm run madde:uret
//
// Anahtar = "<etiket> m.<no>" → kart.madde_no ile birebir eşleşir (seed.ts gorselKartlari).
// Bu üretilen registry, maddeMetni()'de el-yazımı MADDE_METINLERI'nden SONRA gelir
// (el-yazımı yüksek kaliteli TCK/4733 metinleri öncelikli kalır).
//
// Kaynak repo DIŞINDA (içerik fabrikası); icerik-yerlestir.py gibi mutlak yol okur.

import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = join(scriptDir, '..');
const KAYNAK = 'D:/JSPS Fabrika/kaynaklar/astsubay/KANUN_MASTER_DOSYALARI/MUSTEREK';
const outFile = join(root, 'src', 'assets', 'kart-madde-metinleri.ts');
const outDir = dirname(outFile);

// MUSTEREK klasör adı → uygulama etiketi (src/db/seed.ts KANUN_BILGI ile birebir).
const ETIKET = {
  '01_5237_TCK': 'TCK',
  '02_5326_KABAHATLER': 'Kabahatler',
  '03_5442_ILIDARESI': 'İl İdaresi',
  '04_3713_TERORLE_MUCADELE': 'Terörle Mücadele',
  '05_7068_DISIPLIN': 'Disiplin',
  '06_2803_JANDARMA': 'Jandarma Kanunu',
  '07_7201_TEBLIGAT': 'Tebligat',
  '08_6698_KVKK': 'KVKK',
  '09_2935_OHAL': 'OHAL',
  '10_5816_ATATURK_ALEYHINE': 'Atatürk Al. Suçlar',
  '11_2893_TURK_BAYRAGI': 'Türk Bayrağı',
  '12_6284_AILENIN_KORUNMASI': '6284 Ailenin Korunması',
  '13_5070_EIMZA': 'E-İmza',
  '14_4678_SOZLESMELI_SB_ASB': 'Sözleşmeli Sb/Asb',
  '15_RESMI_YAZISMA': 'Resmî Yazışma',
  '16_KVK_SILME_ANONIM': 'KV Silme Yön',
  '17_BILGI_EDINME_YON': 'Bilgi Edinme Yön',
  '18_6136_ATESLI_SILAHLAR': '6136 Ateşli Silahlar',
  '19_2521_TUFEKLER_YON': '2521 Tüfekler Yön',
  '20_SOZLESMELI_SBASB_YON': 'Sözleşmeli Sb/Asb Yön',
  '21_6284_UYGULAMA_YON': '6284 Uyg. Yön',
  '22_JGK_IZIN_YON': 'İzin Yön',
  '23_HIZMET_ESASLARI_YON': 'Hizmet Esasları Yön',
  '24_PERSONEL_YON': 'Personel Yön',
  '25_JANDARMA_TESKILAT_YON': 'Jandarma Teşkilat Yön',
};

// BRANŞ kaynağı (law 26-66). Etiketler seed.ts KANUN_BILGI branş etiketleriyle BİREBİR.
const KAYNAK_BRANS = 'D:/JSPS Fabrika/kaynaklar/astsubay/KANUN_MASTER_DOSYALARI/BRANS';
const ETIKET_BRANS = {
  '01_5237_TCK': 'TCK',
  '02_5271_CMK': 'CMK', '03_1774_KIMLIK_BILDIRME': 'Kimlik Bildirme',
  '04_2911_TOPLANTI_GOSTERI': 'Toplantı/Gösteri', '05_4915_KARA_AVCILIGI': 'Kara Avcılığı',
  '06_1380_SU_URUNLERI': 'Su Ürünleri', '07_6458_YABANCILAR': 'Yabancılar',
  '08_6831_ORMAN': 'Orman', '09_4342_MERA': 'Mera', '10_2918_TRAFIK': 'Trafik',
  '11_5188_OZEL_GUVENLIK': 'Özel Güvenlik', '12_5395_COCUK_KORUMA': 'Çocuk Koruma',
  '13_2860_YARDIM_TOPLAMA': 'Yardım Toplama', '14_5199_HAYVANLARI_KORUMA': 'Hayvanları Koruma',
  '15_2872_CEVRE': 'Çevre', '16_2559_PVSK': 'PVSK', '17_5607_KACAKCILIK': 'Kaçakçılık',
  '18_3298_UYUSTURUCU': 'Uyuşturucu (3298)', '19_6222_SPORDA_SIDDET': 'Sporda Şiddet',
  '20_2313_UYUSTURUCU_MURAKABE': 'Uyuşturucu Murakabe', '21_6415_TERORIZM_FINANSMANI': 'Terörizm Finansmanı',
  '22_2863_KULTUR_TABIAT': 'Kültür/Tabiat', '23_3091_ZILYETLIK': 'Zilyetlik',
  '24_4207_TUTUN_ZARARLARI': 'Tütün Zararları', '25_4733_TUTUN_ALKOL_PIYASASI': 'Tütün/Alkol Piyasası',
  '26_YON_KIMLIK_BILDIRME': 'Kimlik Bild. Yön', '27_YON_SES_GAZ_FISEGI': 'Ses/Gaz Fişeği Yön',
  '28_YON_TRAFIK': 'Trafik Yön', '29_YON_IKRAMIYE': 'İkramiye Yön', '30_YON_OZEL_GUVENLIK': 'Özel Güvenlik Yön',
  '31_YON_ADLI_KOLLUK': 'Adli Kolluk Yön', '32_YON_ARAMALAR': 'Aramalar Yön',
  '33_YON_SUC_ESYASI': 'Suç Eşyası Yön', '34_YON_YAKALAMA': 'Yakalama Yön',
  '35_YON_BEDEN_MUAYENESI': 'Beden Muayenesi Yön', '36_YON_COCUK_TEDBIR': 'Çocuk Tedbir Yön',
  '37_YON_COCUK_USUL': 'Çocuk Usul Yön', '38_YON_ISYERI_ACMA': 'İşyeri Açma Yön',
  '39_YON_KUM_CAKIL': 'Kum/Çakıl Yön', '40_YON_TUTUN_SATIS': 'Tütün Satış Yön',
  '41_YON_VATANDASLIK': 'Vatandaşlık Yön', '42_YON_ATESLI_SILAHLAR': 'Ateşli Silahlar Yön',
};

// Bir satır "📜 metin işareti" satırı mı? (📜 satır başında, opsiyonel >/** önekiyle).
// Cümle ortasında geçen 📜 (editör notu: "📜 alıntılar ... ✅ teyit") tetiklemez.
function metinIsaretiMi(line) {
  const t = line.trim().replace(/^>\s*/, '');
  return /^\*{0,2}\s*📜/.test(t);
}

// Editör/meta blok-alıntı satırı mı? (kanun metni değil → toplamayı kes.)
const META_KALIP = /✅|⚠️|🎬|🔨|teyit edildi|mevzuat\.gov|_txt\/|sınavda en|Katman \d/;

/** Bir 📜 işaret satırından metni çıkarır → { text, nextIndex } | null. */
function metinCikar(lines, i) {
  const t = lines[i].trim().replace(/^>\s*/, '');
  // İşaret (📜) + etiketi (Metin:/Kanun Metni:/Birebir metin (…):) ayıkla.
  let after = t
    .replace(/^\*{0,2}\s*📜\s*/, '')
    .replace(/^\*{0,2}\s*[^:"]*:\s*\*{0,2}\s*/, '')
    .trim();

  // (a) Tırnak içi satır-içi metin (müşterek/disiplin stil): "(1) ..." (çok satıra taşabilir)
  //     Tırnak BİRDEN ÇOK paragrafa (aralarında BOŞ satır ile) yayılabilir (13/A, Ek 3 gibi
  //     çok fıkralı maddeler) → BOŞ satırda DEĞİL, KAPANIŞ tırnağında (veya yeni bölüm/işaret
  //     satırında) dur. Boş satır paragraf ayracı olarak korunur.
  if (/^["“]/.test(after)) {
    let buf = after;
    let j = i;
    while (
      !/["”]\s*$/.test(buf) &&
      j + 1 < lines.length &&
      !/^(#{2,3}\s|📜|🎬|🔨|🗂️|---)/.test(lines[j + 1].trim())
    ) {
      j++;
      buf += '\n' + lines[j].trim();
    }
    const text = buf.replace(/^["“]/, '').replace(/["”]\s*$/, '').trim();
    return text ? { text, nextIndex: j } : null;
  }

  // (b) Blok-alıntı stil (Kabahatler/branş): işaretten sonra boş → izleyen "> ..." satırları.
  //     Boş satır veya editör/meta satırında dur. (Jandarma: işaretten sonra boş satır + tırnak.)
  if (after === '') {
    const buf = [];
    let j = i;
    // Araya boş satır girebilir (Jandarma: 📜 **Metin:**\n\n"Madde 4 …")
    while (j + 1 < lines.length && lines[j + 1].trim() === '') j++;
    let ilk = lines[j + 1]?.trim() ?? '';
    if (/^["“]/.test(ilk)) {
      // Boşluktan sonra tırnaklı blok. Tırnak BİRDEN ÇOK maddeyi (Jandarma m.4+5+6),
      // aralarında BOŞ satırla kapsayabilir → boş satırda DEĞİL, kapanış tırnağında dur.
      let buf2 = '';
      while (j + 1 < lines.length) {
        const nx = lines[j + 1].trim();
        if (/^(#{2,3}\s|📜|🎬|🔨|🗂️|---)/.test(nx)) break; // yeni bölüm/işaret
        j++;
        buf2 += (buf2 ? '\n' : '') + nx; // boş satır = paragraf ayracı
        if (/["”]\s*$/.test(nx)) break; // kapanış tırnağı
      }
      const text = buf2.replace(/^["“]/, '').replace(/["”]\s*$/, '').trim();
      return text ? { text, nextIndex: j } : null;
    }
    while (j + 1 < lines.length && lines[j + 1].trim().startsWith('>')) {
      const icerik = lines[j + 1].replace(/^\s*>\s?/, '').replace(/\*\*/g, '');
      if (META_KALIP.test(icerik)) break;
      j++;
      buf.push(icerik);
    }
    const text = buf.join('\n').trim();
    return text ? { text, nextIndex: j } : null;
  }

  // (c) İşaretten sonra düz metin (tırnaksız)
  const text = after.replace(/\*\*/g, '').trim();
  return text ? { text, nextIndex: i } : null;
}

/** Tek bloğu madde başlıkları sınırlarında böler → [{no, text}, ...].
 *  ID'siz kanunlarda (Jandarma v2) bir blok m.4+5+6'yı birleştirir; ayrı maddelere böler.
 *  Tanınan başlıklar (satır başı, ops. `>`/`**` blok-alıntı öneki):
 *    "Madde N –"        → label "N"      (normal madde)
 *    "Ek Madde N –/:/-" → label "Ek N"   (kart madde_no "m.Ek N" ile eşleşir)
 *    "Geçici Madde N …" → label "Geçici N"
 *    "Madde N/HARF –"   → label "N/HARF" (harfli madde, örn 13/A → "m.13/A")
 *  Ek/Geçici içinde "Madde" geçtiği için önek YAKALANIR (aksi halde "Madde N" olarak yanlış
 *  etiketlenip gerçek maddeyle çakışırdı). Ayraç kümesi – - : (blok-alıntı "Ek Madde 1:"). */
function bloklaBol(text) {
  // Başlangıç sınırı: satır başı VEYA em-tire (—). Bazı başlıklar aynı satırda bir başlık
  // önekiyle gelir ("İzinler — Ek Madde 3 –") → em-tire de blok sınırı sayılır. (— = U+2014,
  // madde ayracı olan en-tire – = U+2013'ten AYRI; ayraç kümesiyle karışmaz.)
  const re =
    /(?:^|\n|—)\s*>?\s*\*{0,2}\s*(Ek|Geçici|Gecici)?\s*Madde\s+(\d+)\s*(?:\/\s*([A-Za-z]))?\s*[–\-:]/gi;
  const idxs = [];
  let mm;
  while ((mm = re.exec(text))) {
    const tur = mm[1] ? mm[1].toLocaleLowerCase('tr') : '';
    const no = String(parseInt(mm[2], 10));
    const harf = mm[3] ? mm[3].toUpperCase() : '';
    const label =
      tur === 'ek' ? `Ek ${no}` : tur ? `Geçici ${no}` : harf ? `${no}/${harf}` : no;
    idxs.push({ no: label, start: mm.index });
  }
  if (idxs.length === 0) return [];
  if (idxs.length === 1) return [{ no: idxs[0].no, text: text.trim() }];
  const segs = [];
  for (let k = 0; k < idxs.length; k++) {
    const s = idxs[k].start;
    const e = k + 1 < idxs.length ? idxs[k + 1].start : text.length;
    const t = text.slice(s, e).trim();
    if (t) segs.push({ no: idxs[k].no, text: t });
  }
  return segs;
}

/** Bir MASTER md metnini parse eder → { "<no>": [metin, ...] }. */
function masterParse(text) {
  const out = {};
  const lines = text.split(/\r?\n/);
  let cur = null; // ID'den gelen güncel taban madde no
  let bloke = false; // ayırt/özet/ek kartı → madde metni sayma
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Editör silme/çöp notu (🗑️) bir kart KİMLİĞİ DEĞİLDİR. Backtick içinde "MADDE EK-07-10"
    // gibi bir ID barındırsa bile cur'u KURMASIN; aksi halde bu ID sonraki ID'siz ünitelere
    // sızıp (Jandarma U18→U19) o ünitelerin metnini yanlış maddeye yazar / bloklaBol'u atlatır.
    if (/🗑️/.test(line)) continue;
    // ID satırı: backtick içinde kart kimliği, örn `7068 MADDE 11-1`, `JSGKHIZMET MADDE 04-AYIRT`.
    // BLOKE KARARI başlık AÇIKLAMASINDAN değil, ID'nin "MADDE <NN>-" SONRASI SONEK'inden verilir.
    // (Eski sürüm tüm başlığı büyütüp /GEÇ|EK|AYIRT/ arardı → "GEÇİCİ Olarak", "m.18 — Ek",
    //  "…Ayrı" gibi GERÇEK madde açıklamalarına yanlış takılıp metni eliyordu.)
    // `<önek> MADDE <EK?><no><harf?> - <sonek>` · EK iki formatta: önek "2918 EK MADDE 004"
    // VEYA "1774 MADDE EK-01" → Ek Madde N. harf "038A" → 38/A. (0* baştaki sıfırı yer.)
    const idm = line.match(/`([^`]*?)\bMADDE\s+(EK[-\s]*)?0*(\d+)([A-Za-z]?)\s*-\s*([^`]+)`/i);
    if (idm) {
      const onek = idm[1].trim().toLocaleUpperCase('tr');
      const ekSonra = !!idm[2]; // "MADDE EK-01"
      const harf = idm[4] ? idm[4].toUpperCase() : '';
      const sonek = idm[5].trim().toLocaleUpperCase('tr'); // "1" | "AYIRT" | "13-1" | "KINAMA"
      // Aggregate (tek madde metni DEĞİL) = ayırt/özet/cetvel/tablo/karşılaştırma/ek/geçici.
      // Madde ARALIĞI sonekleri (20-21, 12-13-1) bloke EDİLMEZ → metin İLK maddeye yazılır
      // (placeholder'dan iyidir; gerçek aggregate'ler sonek KELİMESİYLE elenir).
      bloke = /AYIRT|AYIRD|OZET|ÖZET|CETVEL|TABLO|KARSILAS|KARŞILAŞ|GEÇİCİ|GECICI|\bEK\b/.test(sonek);
      const ek = ekSonra || /\bEK$/.test(onek); // Ek Madde N → kart madde_no "m.Ek N" ile eşleşir
      const no = String(parseInt(idm[3], 10));
      const etiketNo = ek ? `Ek ${no}` : harf ? `${no}/${harf}` : no; // kart.madde_no'daki "m.<X>"
      cur = bloke ? null : etiketNo;
      continue;
    }
    // MADDE'siz sentetik kart ID'si (### başlık + backtick, örn `7068 OZET-SUREC`,
    // `7068 DEVAMSIZLIK-AYIRT`) → bloke. Yalnız aggregate KELİMESİ içeren ID'leri ele
    // (Jandarma gibi ID'siz kanunların düz ### başlıklarını BOZMA).
    if (
      line.startsWith('###') &&
      /`[^`]*(AYIRT|AYIRD|OZET|ÖZET|CETVEL|TABLO|KARSILAS|KARŞILAŞ|DEVAMSIZLIK|ZAMANASIMI|ITIRAZ)[^`]*`/i.test(
        line,
      )
    ) {
      bloke = true;
      cur = null;
      continue;
    }
    // 📜 işaret satırı → metni çıkar
    if (metinIsaretiMi(line)) {
      const r = metinCikar(lines, i);
      if (r) {
        if (bloke) {
          // ayırt/özet kartı → madde metni değil, atla
        } else if (cur) {
          // ID'li kanun: madde no ID'den (tek madde, esas kaynak)
          (out[cur] ??= []).push(r.text);
        } else {
          // ID'siz kanun (Jandarma): bloğu "Madde N –" sınırlarında böl
          for (const seg of bloklaBol(r.text)) (out[seg.no] ??= []).push(seg.text);
        }
        i = r.nextIndex;
      }
    }
  }
  return out;
}

const registry = {}; // "<etiket> m.<no>" -> metin
const rapor = [];

// Kaynak klasörler editör akışında " TAMAM" gibi sonek alabiliyor (örn.
// "23_HIZMET_ESASLARI_YON TAMAM"). ETIKET anahtarını ÖNEK olarak eşleştir → sonekten
// bağımsız doğru klasörü bul (tam eşleşme veya "<anahtar> ..." ile başlayan).
// İki kaynak: MÜŞTEREK (law 1-25) + BRANŞ (law 26-66). Aynı registry'ye yazılır.
const KAYNAKLAR = [
  { kok: KAYNAK, map: ETIKET, ad: 'MÜŞTEREK' },
  { kok: KAYNAK_BRANS, map: ETIKET_BRANS, ad: 'BRANŞ' },
];
for (const { kok, map, ad } of KAYNAKLAR) {
  const tumKlasorler = existsSync(kok) ? readdirSync(kok) : [];
  for (const klasor of Object.keys(map)) {
    const gercekAd = tumKlasorler.find((d) => d === klasor || d.startsWith(klasor + ' '));
    const dir = gercekAd ? join(kok, gercekAd) : null;
    if (!dir || !existsSync(dir)) {
      rapor.push(`[${ad}] ${klasor}: KLASÖR YOK`);
      continue;
    }
    const masterDosya = readdirSync(dir).find((a) => /MASTER.*\.md$/i.test(a));
    if (!masterDosya) {
      rapor.push(`[${ad}] ${klasor}: MASTER md yok`);
      continue;
    }
    const text = readFileSync(join(dir, masterDosya), 'utf8');
    const maddeler = masterParse(text);
    const etiket = map[klasor];
    let say = 0;
    for (const [no, bloklar] of Object.entries(maddeler)) {
      // Aynı maddenin panelleri → tekrarsız birleştir.
      const benzersiz = [...new Set(bloklar.map((b) => b.trim()).filter(Boolean))];
      const metin = benzersiz.join('\n\n').trim();
      if (!metin) continue;
      registry[`${etiket} m.${no}`] = metin;
      say++;
    }
    rapor.push(`[${ad}] ${klasor.padEnd(28)} → ${etiket.padEnd(26)} ${say} madde`);
  }
}

// MERGE-SAFE: önceki üretimde olup bu turda kaynaktan ÇIKMAYAN anahtarları KORU. Kaynak
// MASTER dosyaları zamanla yeniden düzenlenince (📜 blok taşıma vs.) eskiden çıkarılmış bir
// madde metni bu turda parse edilemeyebilir → o kartlar placeholder'a DÜŞMESİN. Bu turda
// çıkan anahtarlar eskiyi GÜNCELLER (registry öncelikli), yalnız eski-tekil anahtarlar korunur.
const onceki = {};
if (existsSync(outFile)) {
  const eski = readFileSync(outFile, 'utf8');
  const satirRe = /^\s+("(?:[^"\\]|\\.)*"):\s*("(?:[^"\\]|\\.)*"),?\s*$/gm;
  let mm;
  while ((mm = satirRe.exec(eski))) {
    try {
      onceki[JSON.parse(mm[1])] = JSON.parse(mm[2]);
    } catch {
      /* bozuk satır → atla */
    }
  }
}
const korunan = Object.keys(onceki).filter((k) => !(k in registry));
const birlesik = { ...onceki, ...registry };

// Anahtarları kanun+madde no'ya göre sırala (okunaklı çıktı).
const siraliAnahtar = Object.keys(birlesik).sort((a, b) => a.localeCompare(b, 'tr'));
const govde = siraliAnahtar
  .map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(birlesik[k])},`)
  .join('\n');

const out = `// OTOMATİK ÜRETİLDİ — elle düzenleme. \`npm run madde:uret\` ile yenile.
// Kaynak: D:\\JSPS Fabrika ... KANUN_MASTER_DOSYALARI/MUSTEREK/*/​*MASTER*.md (📜 Metin blokları).
// Anahtar = "<etiket> m.<no>" → kart.madde_no ile birebir eşleşir.
// maddeMetni() bu registry'yi el-yazımı MADDE_METINLERI'nden SONRA kontrol eder.

export const KART_MADDE_METINLERI: Record<string, string> = {
${govde}
};
`;

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, out, 'utf8');

console.log('--- Kanun bazında çıkarılan madde sayısı ---');
for (const r of rapor) console.log(r);
if (korunan.length) {
  console.log(`\nKORUNAN (önceki üretimden, bu turda parse edilemeyen) ${korunan.length} anahtar:`);
  for (const k of korunan.sort((a, b) => a.localeCompare(b, 'tr'))) console.log(`  • ${k}`);
}
console.log(`\nTOPLAM: ${siraliAnahtar.length} madde metni → ${outFile}`);
