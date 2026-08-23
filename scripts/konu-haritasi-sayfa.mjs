/**
 * KONU HARİTASI SAYFASI — `node scripts/konu-haritasi-sayfa.mjs`
 *
 * Başkan (23 Ağu 2026): "25 kitapçığın hepsinde ayrı ayrı hangi konudan kaç soru gelmiş
 * onu göster." Terminale sığmayacak kadar büyük bir matris (25 kitapçık × 138 mevzuat),
 * bu yüzden okunur tek sayfa üretilir.
 *
 * Kaynak: scripts/cikmis-referans.json (npm run referans:uret ile üretilir).
 * Çıktı : verilen yola HTML (Artifact olarak yayımlanır).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const kok = join(dirname(fileURLToPath(import.meta.url)), '..');
const cikti = process.argv[2] ?? join(kok, 'scratchpad', 'konu-haritasi.html');
const R = JSON.parse(readFileSync(join(kok, 'scripts/cikmis-referans.json'), 'utf8'));
const KIT = R.kitapciklar;

const kacis = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Uzun mevzuat adını tabloya sığan kısa etikete indirger. */
function kisaAd(ad) {
  if (/Anayasa/.test(ad)) return 'Anayasa';
  const no = ad.match(/^(\d{3,4})\s*sayılı/);
  if (no) return no[1];
  return ad
    .replace(/^Jandarma Genel Komutanlığı ve Sahil Güvenlik Komutanlığı /, 'JGK ')
    .replace(/^Jandarma ve Sahil Güvenlik Personelinin /, '')
    .replace(/ Hakkında| Hakkındaki| İlişkin| Dair/g, '')
    .slice(0, 34);
}
/** Kanun numarasının uzun karşılığı (matriste başlık ipucu olarak). */
function tamAd(ad) {
  return ad.replace(/\s+/g, ' ').trim();
}

const RUTBE_KISA = {
  astsubay: 'Astsb',
  subay: 'Sb',
  'uzman erbas': 'Uzm.Erb',
  'uzman jandarma': 'Uzm.J',
  bilinmiyor: '—',
};

// Kitapçıklar okunur sırada + kısa kod (matris sütun başlığı)
const kitaplar = KIT.map((k, i) => ({ ...k, kod: String(i + 1), kisa: kisaAd }));

// Matris satırları: en ağır 26 konu + "diğer"
const ustKonu = R.konuAgirlik.slice(0, 26);
const ustSet = new Set(ustKonu.map((k) => k.ad));
const konuSay = (kitap, ad) => (kitap.konular.find(([a]) => a === ad) ?? [null, 0])[1];
const digerSay = (kitap) => kitap.konular.filter(([a]) => !ustSet.has(a)).reduce((t, [, n]) => t + n, 0);

const enBuyuk = Math.max(...ustKonu.flatMap((k) => kitaplar.map((t) => konuSay(t, k.ad))));

function hucre(n) {
  if (!n) return '<td class="s"><span class="bos">·</span></td>';
  const yogun = Math.min(1, n / Math.max(3, enBuyuk));
  const kat = yogun > 0.66 ? 'y3' : yogun > 0.33 ? 'y2' : 'y1';
  return `<td class="s ${kat}">${n}</td>`;
}

const matrisSatir = (ad, hesap) => `
        <tr>
          <th scope="row" title="${kacis(tamAd(ad))}">${kacis(kisaAd(ad))}</th>
          ${kitaplar.map((k) => hucre(hesap(k))).join('')}
          <td class="toplam">${kitaplar.reduce((t, k) => t + hesap(k), 0)}</td>
        </tr>`;

const matris = `
      <table class="matris">
        <thead>
          <tr>
            <th scope="col" class="kose">Mevzuat</th>
            ${kitaplar
              .map(
                (k) =>
                  `<th scope="col" class="dik r-${k.rutbe.replace(/\s/g, '')}" title="${kacis(k.ad)} — ${kacis(RUTBE_KISA[k.rutbe] ?? k.rutbe)} · ${k.soru} soru">${k.kod}</th>`,
              )
              .join('')}
            <th scope="col" class="toplam">Σ</th>
          </tr>
        </thead>
        <tbody>
          ${ustKonu.map((k) => matrisSatir(k.ad, (t) => konuSay(t, k.ad))).join('')}
          ${matrisSatir(`Diğer ${R.konuAgirlik.length - ustKonu.length} mevzuat`, digerSay)}
        </tbody>
      </table>`;

// Kitapçık kartları — her kitapçığın TAM listesi
const kartlar = kitaplar
  .map((k) => {
    const satirlar = k.konular
      .filter(([, n]) => n > 0)
      .map(
        ([ad, n]) =>
          `<li><span class="ad" title="${kacis(tamAd(ad))}">${kacis(kisaAd(ad))}</span><span class="n">${n}</span></li>`,
      )
      .join('');
    return `
        <article class="kart">
          <header>
            <span class="kod">${k.kod}</span>
            <div>
              <h3>${kacis(k.ad)}</h3>
              <p class="alt"><span class="rozet r-${k.rutbe.replace(/\s/g, '')}">${kacis(RUTBE_KISA[k.rutbe] ?? k.rutbe)}</span> ${k.soru} mevzuat sorusu · ${k.konular.length} ayrı mevzuat · kök ${k.kokOrt} krk · şık ${k.sikOrt} krk</p>
            </div>
          </header>
          <ul class="konular">${satirlar}</ul>
        </article>`;
  })
  .join('');

// Genel ortalama tablosu
const enYuz = R.konuAgirlik[0].yuz;
const ortalama = R.konuAgirlik
  .slice(0, 32)
  .map(
    (k) => `
        <tr>
          <td class="mevzuat">${kacis(tamAd(k.ad))}</td>
          <td class="sayi">${(k.adet / KIT.length).toFixed(1)}</td>
          <td class="sayi">${k.adet}</td>
          <td class="cubuk"><span style="width:${Math.max(2, (100 * k.yuz) / enYuz)}%"></span><i>%${k.yuz}</i></td>
        </tr>`,
  )
  .join('');

const rutbeSay = new Map();
for (const k of KIT) rutbeSay.set(k.rutbe, (rutbeSay.get(k.rutbe) ?? 0) + 1);
const toplamSoru = KIT.reduce((t, k) => t + k.soru, 0);

const html = `<title>JSPS Sınav Konu Haritası</title>
<style>
  :root {
    --zemin: #F7F3EA;
    --yuzey: #FFFCF5;
    --yuzey2: #F2ECDC;
    --murekkep: #1B2A4A;
    --soluk: #6E6047;
    --lacivert: #0B1F3A;
    --lacivert2: #173B6B;
    --altin: #C9A227;
    --altinKoyu: #B88917;
    --altinSolgun: #F3E7C1;
    --kenar: #E7DCC7;
    --isi1: #F6EFD8;
    --isi2: #EBD9A2;
    --isi3: #D8B94F;
    --kirmizi: #C00000;
    --golge: 0 1px 2px rgba(11, 31, 58, .06), 0 8px 24px rgba(11, 31, 58, .06);
    --serif: Georgia, "Iowan Old Style", "Palatino Linotype", "Times New Roman", serif;
    --sans: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --zemin: #08182E;
      --yuzey: #0F2440;
      --yuzey2: #14304F;
      --murekkep: #EDE7DA;
      --soluk: #A2967E;
      --lacivert: #C9A227;
      --lacivert2: #E4C766;
      --altinSolgun: #2A3D5E;
      --kenar: #23405F;
      --isi1: #16304C;
      --isi2: #2C4970;
      --isi3: #5570A0;
      --kirmizi: #FF8A80;
      --golge: 0 1px 2px rgba(0, 0, 0, .3), 0 8px 24px rgba(0, 0, 0, .35);
    }
  }
  :root[data-theme="dark"] {
    --zemin: #08182E;
    --yuzey: #0F2440;
    --yuzey2: #14304F;
    --murekkep: #EDE7DA;
    --soluk: #A2967E;
    --lacivert: #C9A227;
    --lacivert2: #E4C766;
    --altinSolgun: #2A3D5E;
    --kenar: #23405F;
    --isi1: #16304C;
    --isi2: #2C4970;
    --isi3: #5570A0;
    --kirmizi: #FF8A80;
    --golge: 0 1px 2px rgba(0, 0, 0, .3), 0 8px 24px rgba(0, 0, 0, .35);
  }

  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--zemin);
    color: var(--murekkep);
    font-family: var(--sans);
    font-size: 16px;
    line-height: 1.55;
    -webkit-text-size-adjust: 100%;
  }
  .kap { max-width: 1120px; margin: 0 auto; padding: 0 20px 72px; }

  /* — başlık bandı — */
  .band {
    background: linear-gradient(160deg, #0B1F3A 0%, #173B6B 100%);
    color: #F7F3EA;
    padding: 40px 0 32px;
    border-bottom: 3px solid var(--altin);
  }
  .band .kap { padding-bottom: 0; }
  .band h1 {
    font-family: var(--serif);
    font-size: clamp(30px, 5.4vw, 46px);
    line-height: 1.1;
    margin: 0 0 6px;
    text-wrap: balance;
    color: #FFFCF5;
  }
  .band .kaynak { color: #C9BFA6; margin: 0 0 26px; max-width: 62ch; font-size: 15px; }
  .kunye { display: flex; flex-wrap: wrap; gap: 10px 34px; margin: 0; padding: 0; list-style: none; }
  .kunye div { display: flex; flex-direction: column; }
  .kunye b {
    font-family: var(--serif);
    font-size: 30px;
    line-height: 1.1;
    color: var(--altin);
    font-variant-numeric: tabular-nums;
  }
  .kunye span { font-size: 12px; letter-spacing: .09em; text-transform: uppercase; color: #B6AB92; }

  /* — bölüm — */
  section { margin-top: 52px; }
  h2 {
    font-family: var(--serif);
    font-size: clamp(21px, 3vw, 27px);
    margin: 0 0 4px;
    text-wrap: balance;
  }
  .not { color: var(--soluk); margin: 0 0 20px; max-width: 68ch; font-size: 15px; }

  /* — kaydırılabilir sarmalayıcı — */
  .kaydir { overflow-x: auto; border: 1px solid var(--kenar); border-radius: 10px; background: var(--yuzey); box-shadow: var(--golge); }

  table { border-collapse: collapse; width: 100%; font-variant-numeric: tabular-nums; }
  th, td { text-align: left; }

  /* — ortalama tablosu — */
  .ortalama th { font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: var(--soluk); font-weight: 600; padding: 12px 14px; border-bottom: 1px solid var(--kenar); white-space: nowrap; }
  .ortalama td { padding: 9px 14px; border-bottom: 1px solid var(--kenar); font-size: 15px; }
  .ortalama tr:last-child td { border-bottom: 0; }
  .ortalama .mevzuat { min-width: 260px; }
  .ortalama .sayi { text-align: right; white-space: nowrap; font-weight: 600; }
  .ortalama .cubuk { width: 190px; position: relative; }
  .ortalama .cubuk span { display: inline-block; height: 9px; border-radius: 5px; background: var(--altin); vertical-align: middle; }
  .ortalama .cubuk i { font-style: normal; font-size: 12px; color: var(--soluk); margin-left: 8px; }

  /* — matris — */
  .matris { font-size: 13px; }
  .matris th, .matris td { padding: 5px 6px; border-bottom: 1px solid var(--kenar); }
  .matris thead th { position: sticky; top: 0; background: var(--yuzey2); border-bottom: 2px solid var(--kenar); font-weight: 600; }
  .matris .kose { position: sticky; left: 0; z-index: 3; background: var(--yuzey2); min-width: 148px; font-size: 12px; letter-spacing: .07em; text-transform: uppercase; color: var(--soluk); }
  .matris tbody th { position: sticky; left: 0; background: var(--yuzey); font-weight: 600; white-space: nowrap; padding-right: 14px; border-right: 1px solid var(--kenar); }
  .matris .dik { text-align: center; min-width: 30px; font-size: 12px; color: var(--soluk); }
  .matris td.s { text-align: center; min-width: 30px; }
  .matris .bos { color: var(--kenar); }
  .matris .y1 { background: var(--isi1); }
  .matris .y2 { background: var(--isi2); }
  .matris .y3 { background: var(--isi3); font-weight: 700; }
  .matris .toplam { text-align: center; font-weight: 700; border-left: 1px solid var(--kenar); background: var(--altinSolgun); }

  /* — rütbe rozetleri — */
  .rozet, .matris .dik { border-radius: 4px; }
  .rozet { display: inline-block; padding: 1px 7px; font-size: 11px; letter-spacing: .05em; font-weight: 700; text-transform: uppercase; }
  .r-astsubay { background: var(--altinSolgun); color: var(--lacivert2); }
  .r-subay { background: #DDE7F3; color: #17395F; }
  .r-uzmanerbas { background: #E6E7DA; color: #4C5340; }
  .r-uzmanjandarma { background: #F0DEDE; color: #7A3030; }
  .r-bilinmiyor { background: var(--yuzey2); color: var(--soluk); }
  :root[data-theme="dark"] .r-astsubay, :root[data-theme="dark"] .r-subay,
  :root[data-theme="dark"] .r-uzmanerbas, :root[data-theme="dark"] .r-uzmanjandarma { color: #08182E; }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) .r-astsubay, :root:not([data-theme="light"]) .r-subay,
    :root:not([data-theme="light"]) .r-uzmanerbas, :root:not([data-theme="light"]) .r-uzmanjandarma { color: #08182E; }
  }

  /* — kitapçık kartları — */
  .kartlar { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
  .kart { background: var(--yuzey); border: 1px solid var(--kenar); border-radius: 10px; padding: 16px 18px; box-shadow: var(--golge); }
  .kart header { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 12px; }
  .kart .kod {
    font-family: var(--serif); font-size: 20px; font-weight: 700;
    color: var(--lacivert); background: var(--altinSolgun);
    min-width: 36px; height: 36px; display: grid; place-items: center; border-radius: 8px;
    font-variant-numeric: tabular-nums; flex: 0 0 auto;
  }
  .kart h3 { font-family: var(--serif); font-size: 17px; margin: 0; line-height: 1.25; }
  .kart .alt { margin: 3px 0 0; font-size: 12.5px; color: var(--soluk); }
  .konular { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
  .konular li { display: flex; justify-content: space-between; gap: 8px; font-size: 13px; padding: 3px 0; border-bottom: 1px dotted var(--kenar); }
  .konular .ad { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .konular .n { font-weight: 700; font-variant-numeric: tabular-nums; color: var(--lacivert); }

  .altnot { margin-top: 40px; padding: 16px 18px; border-left: 3px solid var(--kirmizi); background: var(--yuzey); border-radius: 0 8px 8px 0; }
  .altnot h3 { margin: 0 0 6px; font-family: var(--serif); font-size: 17px; }
  .altnot p { margin: 0; color: var(--soluk); font-size: 14.5px; max-width: 76ch; }

  @media (max-width: 640px) {
    .konular { grid-template-columns: 1fr; }
    .kap { padding: 0 14px 56px; }
  }
</style>

<div class="band">
  <div class="kap">
    <h1>JSPS Sınav Konu Haritası</h1>
    <p class="kaynak">Elimizdeki 25 çıkmış kitapçığın her biri ayrı ayrı çözümlendi: hangi mevzuattan kaç soru çıkmış. Rakamlar yalnızca mevzuat (meslek bilgisi) sorularıdır. Eski kitapçıklar bugün müfredatta olmayan mevzuattan da soruyor; sayım <strong>2026 emrindeki 67 mevzuata</strong> oturtuldu, dışında kalanlar en altta ayrı listelendi.</p>
    <div class="kunye">
      <div><b>${KIT.length}</b><span>kitapçık</span></div>
      <div><b>${toplamSoru.toLocaleString('tr-TR')}</b><span>mevzuat sorusu</span></div>
      <div><b>${R.konuAgirlik.length}</b><span>müfredat mevzuatı</span></div>
      <div><b>${R.mufredatDisiSoru ?? 0}</b><span>müfredat dışı soru</span></div>
      <div><b>${Math.round(toplamSoru / KIT.length)}</b><span>sınav başına soru</span></div>
      ${[...rutbeSay].map(([r, n]) => `<div><b>${n}</b><span>${kacis(RUTBE_KISA[r] ?? r)}</span></div>`).join('')}
    </div>
  </div>
</div>

<div class="kap">

  <section>
    <h2>Ortalama: bir sınavda hangi mevzuattan kaç soru</h2>
    <p class="not">25 kitapçığın ortalaması. “Soru/sınav” bir kitapçıkta o mevzuattan beklenen soru sayısıdır; toplam sütunu 25 kitapçığın tamamındaki sayıdır.</p>
    <div class="kaydir">
      <table class="ortalama">
        <thead>
          <tr><th scope="col">Mevzuat</th><th scope="col">Soru/sınav</th><th scope="col">Toplam</th><th scope="col">Pay</th></tr>
        </thead>
        <tbody>${ortalama}</tbody>
      </table>
    </div>
  </section>

  <section>
    <h2>Kitapçık kitapçık matris</h2>
    <p class="not">Satırlar en çok soru çıkan 26 mevzuat, sütunlar 25 kitapçık (numaralar aşağıdaki kartlarla eşleşir; sütun başlığına dokununca kitapçığın adı çıkar). Koyu hücre o kitapçıkta o mevzuattan çok soru geldiğini gösterir. Yana kaydırılır.</p>
    <div class="kaydir">${matris}</div>
  </section>

  <section>
    <h2>Kitapçıkların tam dökümü</h2>
    <p class="not">Her kitapçığın kendi listesi — o sınavda soru çıkan bütün mevzuat, soru sayısıyla. Kısaltılmış adın üstüne gelince tam adı görünür.</p>
    <div class="kartlar">${kartlar}</div>
  </section>

  <section>
    <h2>Müfredat dışı çıkanlar</h2>
    <p class="not">Eski kitapçıkların 2026 emrindeki 67 mevzuatta yer almayan sorular. Ölçüye katılmadılar — denemelerimizin dağılımını bunlar bozmasın diye. Toplam ${R.mufredatDisiSoru} soru, ${(R.mufredatDisi ?? []).length} ayrı ad (bir kısmı PDF’ten metne çevirirken kırılmış adlar).</p>
    <div class="kaydir">
      <table class="ortalama">
        <thead><tr><th scope="col">Mevzuat</th><th scope="col">Soru</th></tr></thead>
        <tbody>${(R.mufredatDisi ?? []).slice(0, 24).map((k) => `<tr><td class="mevzuat">${kacis(k.ad)}</td><td class="sayi">${k.adet}</td></tr>`).join('')}</tbody>
      </table>
    </div>
  </section>

  <div class="altnot">
    <h3>Rakamları okurken</h3>
    <p>Kitapçıklar PDF’ten metne çevrilip otomatik ayrıştırıldı; iki sütunlu sayfalarda birkaç soru okunamamış olabilir. Kitapçık başına düşen mevzuat sorusu 19 ile 83 arasında değişiyor — bu fark sınavın kendisinden değil, ayrıştırmanın o kitapçıkta ne kadarını yakalayabildiğinden geliyor. Oranlar sağlam, “sınav başına şu kadar soru” rakamlarını ±%15 payla okuyun. ${R.konusuBulunamayan} sorunun mevzuatı metninden çözülemedi ve sayıma girmedi.</p>
  </div>

</div>
`;

writeFileSync(cikti, html, 'utf8');
console.log('yazıldı:', cikti, '·', Math.round(html.length / 1024), 'KB');
