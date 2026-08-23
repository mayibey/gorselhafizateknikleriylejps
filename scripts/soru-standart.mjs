/**
 * SORU STANDARDI — çıkmış JSPS sınavlarından çıkarılan ölçüye göre soru denetimi/düzeltmesi.
 *
 *   node scripts/soru-standart.mjs            → RAPOR (hiçbir dosya değişmez)
 *   node scripts/soru-standart.mjs --ornek 20 → düzeltme öncesi/sonrası örnek
 *   node scripts/soru-standart.mjs --uygula   → kart-sorulari.ts + duello-sorulari.ts'i düzeltir
 *
 * ÖLÇÜ NEREDEN GELDİ (9 çıkmış sınav kitapçığı, 1.760 mevzuat sorusu — 23 Ağu 2026):
 *   · Kökte MADDE NUMARASI geçen soru oranı: %0,1 (yani PRATİKTE HİÇ).
 *     Gerçek sınav "2803 sayılı Jandarma Teşkilât, Görev ve Yetkileri Kanunu'na göre" der;
 *     "m.4/b'ye göre" ya da "Madde 6'ya göre" DEMEZ.
 *   · Kökün ilk 200 karakterinde mevzuatın TAM ADI geçme oranı: %93.
 *   · Şık sayısı HER ZAMAN 5 (A-E). Doğru/yanlış sorusu YOK (%0).
 *   · Tip dağılımı: olumsuz (hangisi yanlış/değildir) %38 · yetkili makam/süre %15 ·
 *     düz bilgi %14 · ceza/yaptırım %12 · boşluk doldurma %6 · öncüllü (I-II-III) %3.
 *   · Kök ortalama 231 karakter, şık ortalama 58 karakter.
 *
 * DÜZELTME MANTIĞI: soru metni ATILMAZ, künyesi DÜZELTİLİR. Kökün başındaki
 * "...m.4/b'ye göre," türü atıf, mevzuatın tam adıyla değiştirilir. Düzeltilemeyen
 * (mevzuat adı hiçbir yerden çıkarılamayan, 4'ten az şıklı, "doğru mudur" kalıplı)
 * sorular KENARA KALDIRILIR — üreteçler onları almaz.
 */
import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const kok = join(dirname(fileURLToPath(import.meta.url)), '..');
const bayrak = (a) => process.argv.includes(a);

/** TS veri dosyasındaki `export const AD = <veri>` bloğunu okur. */
export function veriOku(dosya, ad) {
  const s = readFileSync(join(kok, dosya), 'utf8');
  const i = s.indexOf('export const ' + ad);
  if (i < 0) throw new Error(ad + ' yok: ' + dosya);
  const esit = s.indexOf('=', i);
  const a = s.indexOf('[', esit), b = s.indexOf('{', esit);
  const bas = a < 0 ? b : b < 0 ? a : Math.min(a, b);
  const son = s.lastIndexOf(s[bas] === '[' ? ']' : '}');
  // eslint-disable-next-line no-new-func
  return { veri: new Function('return ' + s.slice(bas, son + 1))(), bas, son };
}

// --- kanun adları: seed.ts (kart bankası) + duello-kanunlar.ts (düello, 135 mevzuat) ---
// Düello listesinde müşterek kanunlar KISALTMALI ("TCK", "İzin Yön.") → onlarda seed adı esas.
// Bazı adlar TAMAMI BÜYÜK yazılmış; soru metnine öyle girmesin diye düzeltilir.
// Kaynak listesindeki BOZUK/KESİK adlar — başkan denemede yakaladı (23 Ağu): kesik ad
// künyeye girince "…Şuabatı San'e göre" saçmalığı çıkıyordu.
const AD_DUZELTME = {
  9: '5816 sayılı Atatürk Aleyhine İşlenen Suçlar Hakkında Kanun',
  25: '6136 sayılı Ateşli Silahlar ve Bıçaklar ile Diğer Aletler Hakkında Kanun',
  96: "1219 sayılı Tababet ve Şuabatı San'atlarının Tarzı İcrasına Dair Kanun",
  116: 'Ön Ödeme Usul ve Esasları Hakkında Yönetmelik',
};

function adTemizle(ad) {
  // Adın sonundaki parantezli kapsam/atıf notu ('(Madde 7 mali hükümleri + Ek Madde 2)',
  // '(BKK 2016/9431)') soru metnine girmemeli — içindeki 'Madde' madde atfı sanılıyordu.
  return ad.replace(/\s*\([^)]*\)\s*$/, '').replace(/\s*\([^)]*$/, '').trim();
}
function buyukDuzelt(ad) {
  if (ad !== ad.toLocaleUpperCase('tr') || ad.length < 12) return ad;
  const kucuk = new Set(['ve', 'ile', 'veya', 'hakkında', 'dair', 'ilişkin', 'için', 'olan']);
  return ad
    .toLocaleLowerCase('tr')
    .split(' ')
    .map((k, i) => (i > 0 && kucuk.has(k) ? k : k.charAt(0).toLocaleUpperCase('tr') + k.slice(1)))
    .join(' ');
}
const seed = readFileSync(join(kok, 'src/db/seed.ts'), 'utf8');
export const KANUN_ADI = new Map(); // law_id -> tam ad
export const NO_ADI = new Map(); // "3713" -> tam ad
for (const m of seed.matchAll(/\{ id: (\d+), blok: '[^']+', ad: '([^']+)'/g)) {
  KANUN_ADI.set(Number(m[1]), adTemizle(m[2]));
  const no = m[2].match(/^(\d{3,4})\s*sayılı/);
  if (no && (/Kanunu?$/.test(m[2]) || !NO_ADI.has(no[1]))) NO_ADI.set(no[1], adTemizle(m[2]));
}
export const DUELLO_ADI = new Map(); // düello law_id -> tam ad
{
  // DİKKAT: dosyada önce TİP yazıyor (`…branslar: number[] }[] = [`). Ham `indexOf('[')`
  // o tipteki köşeli paranteze düşüyordu → veriOku ile "export const" çıpalanır.
  const dizi = veriOku('src/assets/duello-kanunlar.ts', 'DUELLO_KANUNLAR').veri;
  for (const k of dizi) {
    // SIRA ÖNEMLİ: önce parantezli not sökülür, SONRA büyük harf düzeltilir. Ters sırada
    // "ÖN ÖDEME … YÖNETMELİK (Cumhurbaşkanı Kararı …)" içindeki küçük harfler yüzünden
    // ad "tamamı büyük" sayılmıyor, parantez atılınca BAĞIRAN ad geriye kalıyordu.
    const ad = AD_DUZELTME[k.id] ?? buyukDuzelt(adTemizle(String(k.ad)));
    if (/\.$/.test(ad) || ad.length < 18) continue; // kısaltma kabul edilmez, tam ad gerek
    DUELLO_ADI.set(k.id, ad);
    const no = ad.match(/^(\d{3,4})\s*[Ss]ayılı/);
    // TUZAK: "6284 sayılı … Kanuna İlişkin Uygulama Yönetmeliği" de 6284 ile başlıyor.
    // Çıplak "6284 sayılı Kanun" atfı KANUNU kastediyor → numaraya KANUN adı bağlanır.
    if (no && /Kanunu?$/.test(ad) && !/Kanunu?$/.test(NO_ADI.get(no[1]) ?? '')) NO_ADI.set(no[1], ad);
    else if (no && !NO_ADI.has(no[1])) NO_ADI.set(no[1], ad);
  }
}

/** "…Kanunu" → "…Kanunu'na göre" gibi doğru ekli künye üretir. */
export function kunye(ad) {
  const t = ad.trim().replace(/[.,;:]$/, '');
  const kural = [
    [/Kanunu$/, "'na"],
    [/Kanun$/, "'a"],
    [/Kanun Hükmünde Kararname(si)?$/, "'ye"],
    [/Yönetmeliği$/, "'ne"],
    [/Yönetmelik$/, "'e"],
    [/Yönergesi$/, "'ne"],
    [/Yönerge$/, "'ye"],
    [/Tebliği$/, "'ne"],
    [/Tebliğ$/, "'e"],
    [/Anayasası$/, "'na"],
    [/Anayasa$/, "'ya"],
    [/Genelgesi$/, "'ne"],
    [/Kararname(si)?$/, "'ye"],
    [/Esasları$/, "'na"],
  ];
  for (const [r, ek] of kural) if (r.test(t)) return t + ek + ' göre';
  return t + "'e göre";
}

// --- desenler ---
// "4. maddesine" biçimi de madde atfıdır — ilk sürümde kaçmıştı, künye iki kez yazılıyordu.
const MADDE = /\bm\.\s?\d|\bmd\.\s?\d|\bmadde\s?\d|\d+\s*(inci|ıncı|üncü|uncu)\s*madde|\d+\s*\.\s*madde|\bek\s+madde\s*\d/i;
const AD_DESEN = [
  /(\d{3,4}\s*sayılı\s+[^,;:.()]{4,90}?(?:Kanunu|Kanun))\b/,
  /((?:[A-ZÇĞİÖŞÜ][^,;:.()]{4,90}?)(?:Yönetmeliği|Yönetmelik|Yönergesi|Yönerge|Tebliği|Tebliğ))\b/,
  /(Türkiye Cumhuriyeti Anayasası|Anayasa)\b/,
];
const DOGRU_MU = /doğru mudur|yanlış mıdır|doğru mu\?|yanlış mı\?/i;

// MEVZUAT TARİHÇESİ SORUSU — başkan yakaladı (23 Ağu): "…Geçici 2 nci fıkrasına göre
// öngörülen tarih, 6/2/2017 tarihli ve 2017/9854 sayılı BKK ile hangi şekilde
// değiştirilmiştir?" Ölçüm: 1.760 çıkmış sınav sorusunun SIFIRI bu tipte. Gerçek sınav
// mevzuatın DEĞİŞİKLİK GEÇMİŞİNİ, yürürlük tarihini, hangi kararla değiştiğini SORMAZ;
// hükmün KENDİSİNİ sorar. Bu tip soru bankaya alınmaz.
const TARIHCE_SORU = /hangi şekilde değiştiril|nasıl değiştiril|ne zaman yürürlü|yürürlük tarihi|hangi tarihte yürürlü|hangi tarihli ve|hangi tarih ve sayı|hangi bakanlar kurulu karar|hangi cumhurbaşkanı karar|kaç sayılı (bakanlar|cumhurbaşkanı)|resm[îi] gazete['’]?de yayımlan\w*\s*(tarih|sayı)/i;
const TARIH = /\b\d{1,2}\s*\/\s*\d{1,2}\s*\/\s*\d{4}\b/;

// DAYANAK SORUSU — "Bu Yönetmelik, … tarihli ve … sayılı Kanunun … maddesine dayanılarak
// hazırlanmıştır" cümlesinin boşluklarını doldurtan sorular. Çıkmış sınavda bu kalıp
// 1.760 soruda 2 kez geçiyor (%0,1) ve o ikisi de boşluk doldurma değil. Mevzuatın
// KÜNYESİ değil HÜKMÜ sorulur → bu tip de bankaya alınmaz.
const DAYANAK_SORU = /dayanılarak hazırlan|dayanağını oluştur|maddesine dayanılarak|dayanak (maddesi|hükmü)/i;

function tarihceMi(q) {
  const k = String(q.soru);
  const son = k.split(/(?<=\?)\s+/).slice(-2).join(' ');
  if (TARIHCE_SORU.test(son)) return true;
  if (DAYANAK_SORU.test(k)) return true;
  const siklar = Array.isArray(q.siklar) ? q.siklar : [];
  // Şıkların çoğu tarih ya da "… ibaresi … olarak değiştirilmiştir" ise: tarihçe sorusu.
  if (siklar.filter((s) => TARIH.test(String(s))).length >= 3) return true;
  if (siklar.filter((s) => /ibaresi.{0,40}değiştiril/i.test(String(s))).length >= 2) return true;
  return false;
}

// Künyeye girecek ad, mevzuat adı gibi BİTMELİ. "Uygulama Yönetmeliği" gibi genel bir ad
// neyin yönetmeliği olduğunu söylemiyor — o da geçersiz. Geçersizse soru kenara kalkar.
const AD_SONU = /(Kanunu|Kanun|Yönetmeliği|Yönetmelik|Yönergesi|Yönerge|Tebliği|Tebliğ|Anayasası|Anayasa|Genelgesi|Kararname|Kararnamesi|Esasları|Rehberi|Kuralları)$/;
const AD_GENEL = /^(bu\s+)?(uygulama\s+)?(yönetmeliğ\w*|yönetmelik|yönerge\w*|tebliğ\w*|kanun\w*|esaslar\w*)$/i;
function adGecerliMi(ad) {
  if (!ad) return false;
  const t = ad.trim();
  if (!AD_SONU.test(t)) return false;
  if (AD_GENEL.test(t)) return false;
  return /\d{3,4}\s*[Ss]ayılı/.test(t) || t.split(/\s+/).length >= 2;
}

// Künye eklenirken küçük harfe ÇEVRİLMEYECEK baş kelimeler. "A, bir yıl içinde…" → "a, …"
// ya da "Cumhurbaşkanı" → "cumhurbaşkanı" olmasın diye.
const OZEL_AD = new Set(['Cumhurbaşkanı', 'Cumhurbaşkanlığı', 'Bakan', 'Bakanlık', 'Bakanlar', 'Vali',
  'Valilik', 'Kaymakam', 'Jandarma', 'Sahil', 'Türk', 'Türkiye', 'İçişleri', 'Genelkurmay', 'Milli',
  'Millî', 'Anayasa', 'Danıştay', 'Yargıtay', 'Emniyet', 'Devlet', 'Hazine', 'Maliye', 'Adalet',
  'Savcı', 'Cumhuriyet', 'Mahkeme', 'Askerî', 'Askeri', 'Komutan', 'Komutanlık', 'Sayıştay',
  'Meclis', 'Resmî', 'Resmi', 'Kurul', 'Kurum', 'Merkez', 'Bölge']);

function kucukBasla(g) {
  const ilk = (g.split(/\s+/)[0] ?? '').replace(/[,.;:]$/, '');
  if (!/^[A-ZÇĞİÖŞÜ][a-zçğıöşü]{2,}$/.test(ilk)) return g; // "A", "(B)", "TCK" dokunulmaz
  if (OZEL_AD.has(ilk)) return g;
  return g.charAt(0).toLocaleLowerCase('tr') + g.slice(1);
}

/**
 * Künyeyi kökün başına ekler. Kökte mevzuatı ADIYLA anmayan bir "…göre," girişi varsa
 * (örn. "Yönetmeliğe göre,"), künye eklenince cümle iki kez "göre" der → o giriş sökülür.
 */
function onEkle(k, govde) {
  // Gövdenin İÇİNDE aynı mevzuata kısa atıf ("…6698 sayılı Kanun'a göre…") kalırsa künye
  // iki kez okunur; künyenin numarası ile aynıysa o kısa atıf sökülür.
  const kNo = k.match(/^(\d{3,4})\s*sayılı/);
  const g = String(govde)
    .trim()
    .replace(/^[.…\s]+/, '')
    // "Yönetmeliğe göre," · "6698 sayılı Kanun'a göre," gibi ADI TAM VERMEYEN girişler
    // Ek/iyelik biçimleri: "Kanuna", "Kanunun", "Kanunu'na", "Yönetmeliğe", "Yönetmeliği'ne"…
    .replace(/^(bu\s+)?(\d{3,4}\s*sayılı\s+)?(yönetmeliğ|yönetmelik|kanun|tebliğ|yönerge)[a-zçğıöşü]*['’]?[a-zçğıöşü]*(\s+[^,]{0,45}?madde[a-zçğıöşü]*)?\s+göre[,:]?\s+/i, '');
  // Gövde AYNI mevzuatın adıyla başlayan bir "…göre," girişi taşıyorsa (kısaltılmış ya da
  // ek almış hâliyle) künye iki kez okunur → o giriş de sökülür.
  const bas = g.match(/^(.{0,170}?\bgöre)[,:]?\s+/);
  const sade = (x) => x.toLocaleLowerCase('tr').replace(/[^\p{L}\p{N}]+/gu, '');
  let gt = g;
  if (bas && !/\.\s/.test(bas[1]) && !/\bI+\.\s/.test(bas[1])) {
    const a = sade(bas[1]);
    const b = sade(k);
    if (a.length >= 14 && (b.includes(a.slice(0, 40)) || a.includes(b.slice(0, 40)))) {
      gt = g.slice(bas[0].length);
    }
  }
  const g2 = kNo
    ? gt.replace(new RegExp(kNo[1] + String.raw`\s*sayılı\s+Kanun[a-zçğıöşü]*['’]?[a-zçğıöşü]*\s+göre[,]?\s*`, 'gi'), '')
    : gt;
  return (k + ', ' + kucukBasla(g2))
    .replace(/,\s*,/g, ',')
    .replace(/,\s*([;:.])/g, '$1')
    .replace(/\s{2,}/g, ' ');
}

// Fabrikadaki kart kimliği öneki → law_id. Küratörlü genel denemelerde soru metni bazen
// mevzuatı adıyla anmıyor ve `kaynak` da "Yön. m.24/1" gibi künyesiz; tek ipucu kart_id öneki.
// (Önek → klasör eşlemesi fabrikada aranarak bulundu, 23 Ağu 2026.)
const KARTID_LAW = {
  RESMIYAZISMA: 15, KVKSILME: 16, BILGIEDINME: 17, SOZLESMELI: 20, '6284UYG': 21,
  JGKIZIN: 22, JSGKHIZMET: 23, PERSONELYON: 24, JANDYON: 25,
  YON26: 50, YON29: 53, YON30: 54, YON36: 60, YON41: 65, YON42: 66,
};

/** Sorunun hangi mevzuata ait olduğunu bulur (kök → kaynak → law id sırasıyla). */
export function mevzuatBul(soru, kaynak, lawId) {
  const bulunan = mevzuatAra(soru, kaynak, lawId);
  return adGecerliMi(bulunan) ? bulunan : null;
}

function mevzuatAra(soru, kaynak, lawId) {
  for (const r of AD_DESEN) {
    const m = soru.match(r);
    if (m) return m[1].replace(/\s+/g, ' ').trim();
  }
  // Kökte çıplak "6284 sayılı Kanun" geçiyorsa NUMARASI esastır — kaynak künyesi
  // bazen uygulama yönetmeliğini gösteriyor ve soruyu yanlış mevzuata yazdırıyordu.
  const noSoru = soru.match(/\b(\d{3,4})\s*sayılı/);
  if (noSoru && NO_ADI.has(noSoru[1])) return NO_ADI.get(noSoru[1]);
  const no = String(kaynak || '').match(/^(\d{3,4})\b/);
  if (no && NO_ADI.has(no[1])) return NO_ADI.get(no[1]);
  const ipucu = String(kaynak || '').toLocaleUpperCase('tr');
  for (const [onek, id] of Object.entries(KARTID_LAW)) {
    if (ipucu.includes(onek)) return KANUN_ADI.get(id) ?? DUELLO_ADI.get(id) ?? null;
  }
  if (lawId != null && KANUN_ADI.has(lawId)) return KANUN_ADI.get(lawId);
  if (lawId != null && DUELLO_ADI.has(lawId)) return DUELLO_ADI.get(lawId);
  for (const r of AD_DESEN) {
    const m = String(kaynak || '').match(r);
    if (m) return m[1].replace(/\s+/g, ' ').trim();
  }
  return null;
}

// Cümle ORTASINDAKİ atıf: "6136 sayılı Kanun'un 12. maddesine göre" → "6136 sayılı … Kanun'a göre".
// Sadece madde ifadesini SİLMEK cümleyi bozuyordu ("Kanun'un suçun iki kişi…"), bu yüzden
// mevzuat adı yakalanıp doğru ekli künyeye çevriliyor.
const ATIF_KANUN = /(\d{3,4}\s*sayılı\s+[^,;.?]{0,90}?Kanun[a-zçğıöşü]*)['’]?(?:nun|nün|nın|nin|un|ün|ın|in)?\s+(?:ek\s+)?(?:geçici\s+)?\d+\s*(?:\.|inci|ıncı|uncu|üncü)?\s*madde(?:si|sine|sinde|sinin|nin)?(?:\s*\/\s*\d+)?\s*(?:hükmüne\s+|hükümlerine\s+)?(?:göre|gereğince|uyarınca)/gi;
const ATIF_YONET = /([A-ZÇĞİÖŞÜ][^,;.?]{4,95}?(?:Yönetmelik|Yönetmeliğ|Yönerge|Tebliğ)[a-zçğıöşü]*)['’]?(?:nun|nün|nın|nin|un|ün|ın|in)?\s+(?:ek\s+)?(?:geçici\s+)?\d+\s*(?:\.|inci|ıncı|uncu|üncü)?\s*madde(?:si|sine|sinde|sinin|nin)?(?:\s*\/\s*\d+)?\s*(?:hükmüne\s+|hükümlerine\s+)?(?:göre|gereğince|uyarınca)/gi;

/** Ad sonundaki iyelik/tamlama ekini söker: "Yönetmeliğin" → "Yönetmelik". */
function adSadele(ad) {
  return ad
    .replace(/Yönetmeliğin$/, 'Yönetmelik')
    .replace(/Yönetmeliğe$/, 'Yönetmelik')
    .replace(/Yönetmeliğ$/, 'Yönetmelik')
    .replace(/Kanunun$/, 'Kanunu')
    .replace(/Kanuna$/, 'Kanunu')
    .replace(/Tebliğin$/, 'Tebliğ')
    .replace(/Yönergenin$/, 'Yönerge')
    .trim();
}

function atifSadelestir(s) {
  return s
    .replace(ATIF_KANUN, (_, ad) => kunye(adSadele(ad)))
    .replace(ATIF_YONET, (_, ad) => kunye(adSadele(ad)));
}

/**
 * Kökü standarda çeker. Dönen: { soru, degisti } ya da { at: '<sebep>' }.
 * 1) Başta "…göre," girişi varsa ve içinde madde atfı geçiyorsa, giriş KANONİK künyeyle değişir.
 * 2) Değilse madde atfı yerinde temizlenir (yalnız güvenli kalıplar).
 */
export function standartlastir(soru, kaynak, lawId) {
  const s = String(soru).replace(/\s+/g, ' ').trim();
  if (!MADDE.test(s)) return { soru: s, degisti: false };
  const ad = mevzuatBul(s, kaynak, lawId);
  if (!ad) return { at: 'mevzuat adı bulunamadı' };
  const k = kunye(ad);

  // 1) baştaki "… göre," girişi
  // Giriş kırpması YALNIZ gerçek künye girişinde yapılır: cümle bitmemiş olmalı ve içinde
  // öncül listesi (I. / II.) bulunmamalı. Aksi hâlde sorunun ilk öncülü yeniyordu
  // ("…göre, tahsil edilir. II. Nafaka…" — başkan yakaladı, 23 Ağu).
  const giris = s.match(/^(.{0,150}?\bgöre)([,:]?)\s+/);
  const girisTemiz = !!giris && !/\.\s/.test(giris[1]) && !/\bI+\.\s/.test(giris[1]);
  if (giris && girisTemiz && MADDE.test(giris[1])) {
    const kalan = s.slice(giris[0].length);
    if (kalan.length >= 25) {
      const yeni = onEkle(k, kalan);
      if (!MADDE.test(yeni)) return { soru: yeni, degisti: true };
    }
  }
  // 2) yerinde temizlik — önce atıflar künyeye çevrilir, sonra artıklar süpürülür
  let t = atifSadelestir(s)
    .replace(/\s*[,(]?\s*\bm\.\s?\d+(?:\/[\wçğıöşüÇĞİÖŞÜ-]+)*(?:['’][a-zçğıöşü]+)?\s*\)?/g, ' ')
    .replace(/\s*['’](nin|nın|nun|nün|in|ın|un|ün)\s+\d+\s*(inci|ıncı|üncü|uncu)\s*maddesi(nde|ne|nin|n)?\s*/gi, ' ')
    .replace(/\s*(nin|nın|nun|nün)?\s*\b\d+\s*(inci|ıncı|üncü|uncu)\s*maddesi(nde|ne|nin|n)?\s*/gi, ' ')
    .replace(/\s*\bmadde\s?\d+(\/\d+)?\s*['’]?[a-zçğıöşü]*\s*/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:?])/g, '$1')
    .trim();
  t = t.replace(/,\s*,/g, ',').replace(/,\s*([;:.])/g, '$1').replace(/\s{2,}/g, ' ').trim();
  if (!MADDE.test(t) && t.length >= 25) {
    const bas = ad.slice(0, 18).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!new RegExp(bas, 'i').test(t.slice(0, 220))) {
      t = onEkle(k, t);
    }
    return { soru: t, degisti: true };
  }
  return { at: 'madde atfı sökülemedi' };
}

/** Soru standarda uygun mu? Uygunsa {tamam,soru,degisti}, değilse {at:sebep}. */
export function denetle(q, lawId) {
  if (!Array.isArray(q.siklar) || q.siklar.length < 4) return { at: '4 şıktan az (doğru/yanlış)' };
  if (typeof q.dogru !== 'number' || q.dogru < 0 || q.dogru >= q.siklar.length) return { at: 'cevap indeksi bozuk' };
  if (DOGRU_MU.test(q.soru)) return { at: '"doğru mudur" kalıbı' };
  if (tarihceMi(q)) return { at: 'mevzuat tarihçesi/yürürlük sorusu' };
  const r = standartlastir(q.soru, q.kaynak, lawId);
  if (r.at) return r;
  const ad = mevzuatBul(r.soru, q.kaynak, lawId);
  if (!ad) return { at: 'mevzuat adı bulunamadı' };
  let nihai = r.soru;
  // Künye zaten kökün başında duruyor mu? AD_DESEN ile bakmak YANLIŞTI: adında virgül olan
  // kanunlarda ("Jandarma Teşkilat, Görev ve Yetkileri Kanunu") desen tutmuyor ve künye
  // İKİNCİ KEZ yazılıyordu (1.166 soruda). Doğrusu: çözülen adın kendisini aramak.
  // Karşılaştırma BÜYÜK/küçük harf duyarsız: kaynak metinde ad bazen TAMAMI BÜYÜK yazılı
  // ve künye ikinci kez ekleniyordu.
  const iz = ad.slice(0, Math.min(28, ad.length)).toLocaleLowerCase('tr');
  if (!nihai.slice(0, 260).toLocaleLowerCase('tr').includes(iz)) {
    nihai = onEkle(kunye(ad), nihai);
  }
  // Son kapı: düzeltmeden sonra hâlâ madde atfı kaldıysa soru standarda GİRMEZ.
  if (MADDE.test(nihai)) return { at: 'madde atfı sökülemedi' };
  const asil = String(q.soru).replace(/\s+/g, ' ').trim();
  return { tamam: true, soru: nihai, degisti: nihai !== asil };
}

// ---------------------------------------------------------------- yedek havuz
// Küratörlü denemeler SABİT 50 soruluk. Standarda girmeyen soru atılırsa deneme eksilir;
// bu yüzden AYNI MEVZUATTAN standart bir yedek konur (kart bankasından).
let _yedek = null;
function yedekHavuz() {
  if (_yedek) return _yedek;
  _yedek = new Map(); // mevzuat adı -> soru[]
  const bank = veriOku('src/assets/kart-sorulari.ts', 'KART_SORULARI').veri;
  for (const [law, liste] of Object.entries(bank)) {
    for (const q of liste) {
      const ad = mevzuatBul(q.soru, q.kaynak, Number(law));
      if (!ad) continue;
      if (!_yedek.has(ad)) _yedek.set(ad, []);
      _yedek.get(ad).push(q);
    }
  }
  return _yedek;
}

/** Aynı mevzuattan, henüz kullanılmamış standart bir yedek soru döndürür (yoksa null). */
export function yedekSoru(soru, kaynak, kullanilanIdler) {
  const ad = mevzuatBul(String(soru), kaynak, null);
  if (!ad) return null;
  for (const q of yedekHavuz().get(ad) ?? []) {
    if (kullanilanIdler.has(q.id)) continue;
    kullanilanIdler.add(q.id);
    // Yedek kimliğine '-Y' eklenir: aynı id kaynakta ilerideki bir soruda geçerse
    // 'çakışma' sayılıp o soru atlanıyordu (deneme 50'den 49'a düşmüştü).
    return { ...q, id: q.id + '-Y', kartId: '' };
  }
  return null;
}

// ---------------------------------------------------------------- çalıştırma
// Bu dosya hem KİTAPLIK (üreteçler denetle()'yi içeri alır) hem ÇALIŞTIRILABİLİR rapor.
// Doğrudan çalıştırılmadıysa aşağısı ATLANIR — yoksa her import'ta 14.500 soru taranıyordu.
const dogrudan = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (!dogrudan) {
  // kitaplık kipi
} else {
const kart = veriOku('src/assets/kart-sorulari.ts', 'KART_SORULARI');
const duello = veriOku('src/assets/duello-sorulari.ts', 'DUELLO_SORULARI');

const kayit = [];
for (const [law, liste] of Object.entries(kart.veri)) {
  for (const q of liste) kayit.push({ kutu: 'kart', law: Number(law), q });
}
for (const q of duello.veri) kayit.push({ kutu: 'duello', law: q.kanun ?? null, q });

let tamam = 0;
let duzeltildi = 0;
const atilan = new Map();
const ornekler = [];
const at = new Set();
const yeniMetin = new Map();
for (const r of kayit) {
  const s = denetle(r.q, r.law);
  if (s.at) {
    atilan.set(s.at, (atilan.get(s.at) ?? 0) + 1);
    at.add(r.q);
    continue;
  }
  tamam++;
  if (s.degisti) {
    duzeltildi++;
    yeniMetin.set(r.q, s.soru);
    if (ornekler.length < 600) ornekler.push({ once: r.q.soru, sonra: s.soru });
  }
}

console.log('SORU STANDART DENETİMİ —', kayit.length, 'soru');
console.log('  standarda uygun (düzeltme sonrası):', tamam);
console.log('  DÜZELTİLEN (künye kanonikleştirildi):', duzeltildi);
console.log('  KENARA KALDIRILAN:', kayit.length - tamam);
for (const [s, n] of [...atilan].sort((a, b) => b[1] - a[1])) {
  console.log(`     ${String(n).padStart(5)}  ${s}`);
}

// --- düzeltme sonrası KENDİ KENDİNİ DENETLEME (sessiz bozulma en büyük risk) ---
{
  const kusur = new Map();
  const ornek = new Map();
  for (const [q, yeni] of yeniMetin) {
    const bas = yeni.slice(0, 300);
    const ekle = (ad) => {
      kusur.set(ad, (kusur.get(ad) ?? 0) + 1);
      if (!ornek.has(ad)) ornek.set(ad, yeni.slice(0, 165));
    };
    // İki kez "göre" tek başına kusur DEĞİL ("…Kanunu'na göre, X'in beyanına göre…" olabilir).
    // Kusur, KÜNYENİN iki kez yazılmasıdır.
    if (/göre,\s+[^.?]{0,140}?\b(kanun|yönetmeli|tebliğ|yönerge)[a-zçğıöşü'’]*\s+göre/i.test(bas)) {
      ekle('KÜNYE İKİ KEZ');
    }
    if (MADDE.test(yeni)) ekle('hâlâ madde atfı var');
    if (/\s,|,,|\s\.(?!\.)/.test(yeni)) ekle('noktalama bozuk');
    if (/\s{2,}/.test(yeni)) ekle('çift boşluk');
    if (/göre,\s*[.,;]/.test(yeni)) ekle('künyeden sonra gövde bozuk');
    if (yeni.length < 40) ekle('kök çok kısaldı');
    void q;
  }
  console.log('\n--- DÜZELTİLEN METİNLERİN DENETİMİ ---');
  if (!kusur.size) console.log('  kusur bulunamadı');
  for (const [a, n] of [...kusur].sort((x, y) => y[1] - x[1])) {
    console.log(`  ${String(n).padStart(5)}  ${a}`);
    console.log(`         örn: ${ornek.get(a)}`);
  }
}

const ornekSayi = bayrak('--ornek') ? Number(process.argv[process.argv.indexOf('--ornek') + 1] || 10) : 0;
if (ornekSayi > 0 && ornekler.length) {
  const adim = Math.max(1, Math.floor(ornekler.length / ornekSayi));
  for (let i = 0; i < ornekSayi && i * adim < ornekler.length; i++) {
    const o = ornekler[i * adim];
    console.log(`\n[${i + 1}] ÖNCE : ${String(o.once).replace(/\s+/g, ' ').slice(0, 200)}`);
    console.log(`    SONRA: ${o.sonra.slice(0, 200)}`);
  }
}

if (!bayrak('--uygula')) {
  console.log('\n(RAPOR — hiçbir dosya değişmedi. Uygulamak için --uygula)');
  process.exit(0);
}

// --- uygula ---
for (const [law, liste] of Object.entries(kart.veri)) {
  kart.veri[law] = liste.filter((q) => !at.has(q));
  for (const q of kart.veri[law]) if (yeniMetin.has(q)) q.soru = yeniMetin.get(q);
}
const yeniDuello = duello.veri.filter((q) => !at.has(q));
for (const q of yeniDuello) if (yeniMetin.has(q)) q.soru = yeniMetin.get(q);

function yaz(dosya, ad, veri) {
  const yol = join(kok, dosya);
  if (!existsSync(yol + '.yedek')) copyFileSync(yol, yol + '.yedek');
  const s = readFileSync(yol, 'utf8');
  const i = s.indexOf('export const ' + ad);
  const esit = s.indexOf('=', i);
  const a = s.indexOf('[', esit), b = s.indexOf('{', esit);
  const bas = a < 0 ? b : b < 0 ? a : Math.min(a, b);
  const son = s.lastIndexOf(s[bas] === '[' ? ']' : '}');
  const govde = Array.isArray(veri)
    ? '[\n' + veri.map((x) => '  ' + JSON.stringify(x)).join(',\n') + '\n]'
    : '{\n' + Object.entries(veri).map(([k, v]) => `  ${k}: [\n${v.map((x) => '    ' + JSON.stringify(x)).join(',\n')}\n  ]`).join(',\n') + '\n}';
  writeFileSync(yol, s.slice(0, bas) + govde + s.slice(son + 1), 'utf8');
  console.log('yazıldı:', dosya);
}
yaz('src/assets/kart-sorulari.ts', 'KART_SORULARI', kart.veri);
yaz('src/assets/duello-sorulari.ts', 'DUELLO_SORULARI', yeniDuello);
console.log('\nYedekler: *.ts.yedek');
}
