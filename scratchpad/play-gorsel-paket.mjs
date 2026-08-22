/**
 * Masaüstüne "MEVZU MAGAZA GORSELLERI" klasörü kurar:
 *   1-APPLE-ORIJINAL   → App Store'a yüklenen dosyaların birebir aynısı (1290×2796)
 *   2-PLAY-1080x2400   → Play'in istediği orana (9:20) kırpılmış, en yaygın telefon oranı
 *   3-PLAY-1080x1920   → tam 9:16
 * Kırpma değil, ÖLÇEKLEME + üst/alt kenar bandı ile doldurma: içerik kesilmez.
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const KAYNAK = 'D:/GorselHafizaTeknikleriyleJSPS/scratchpad';
const HEDEF = 'C:/Users/GIGABYTE/OneDrive/Desktop/MEVZU MAGAZA GORSELLERI';
const DOSYALAR = [
  ['kare-1-menu.png', '1-oyun-merkezi.png'],
  ['kare-2-cengel.png', '2-cengel-bulmaca.png'],
  ['kare-3-bosluk.png', '3-bosluk-doldurma.png'],
  ['kare-4-dogruyanlis.png', '4-dogru-mu-yanlis-mi.png'],
  ['kare-5-asmaca.png', '5-asmaca.png'],
  ['kare-6-rutbe.png', '6-rutbe-merdiveni.png'],
];

const klasorler = ['1-APPLE-ORIJINAL', '2-PLAY-1080x2400', '3-PLAY-1080x1920'];
for (const k of klasorler) fs.mkdirSync(path.join(HEDEF, k), { recursive: true });

/** Görseli hedef ölçüye SIĞDIRIR (içerik kesilmez); artan yeri en üst/en alt satırın
 *  rengiyle doldurur → bant dikişsiz görünür. */
async function sigdir(girdi, cikti, G, Y) {
  const im = sharp(girdi);
  const m = await im.metadata();
  const olcek = Math.min(G / m.width, Y / m.height);
  const yeniG = Math.round(m.width * olcek);
  const yeniY = Math.round(m.height * olcek);
  const govde = await sharp(girdi).resize(yeniG, yeniY).png().toBuffer();

  // üst ve alt kenar renkleri (dolgu bandı için)
  const ust = await sharp(govde).extract({ left: 0, top: 0, width: yeniG, height: 1 }).resize(1, 1).raw().toBuffer();
  const alt = await sharp(govde).extract({ left: 0, top: yeniY - 1, width: yeniG, height: 1 }).resize(1, 1).raw().toBuffer();
  const ustBoy = Math.floor((Y - yeniY) / 2);
  const altBoy = Y - yeniY - ustBoy;
  const yanBoy = Math.floor((G - yeniG) / 2);

  const katmanlar = [];
  if (ustBoy > 0) katmanlar.push({ input: { create: { width: G, height: ustBoy, channels: 3, background: { r: ust[0], g: ust[1], b: ust[2] } } }, top: 0, left: 0 });
  if (altBoy > 0) katmanlar.push({ input: { create: { width: G, height: altBoy, channels: 3, background: { r: alt[0], g: alt[1], b: alt[2] } } }, top: Y - altBoy, left: 0 });
  katmanlar.push({ input: govde, top: ustBoy, left: yanBoy });

  await sharp({ create: { width: G, height: Y, channels: 3, background: { r: ust[0], g: ust[1], b: ust[2] } } })
    .composite(katmanlar).png({ compressionLevel: 9 }).toFile(cikti);
}

for (const [kaynakAd, hedefAd] of DOSYALAR) {
  const src = path.join(KAYNAK, kaynakAd);
  if (!fs.existsSync(src)) { console.log('EKSİK:', kaynakAd); continue; }
  fs.copyFileSync(src, path.join(HEDEF, '1-APPLE-ORIJINAL', hedefAd));
  await sigdir(src, path.join(HEDEF, '2-PLAY-1080x2400', hedefAd), 1080, 2400);
  await sigdir(src, path.join(HEDEF, '3-PLAY-1080x1920', hedefAd), 1080, 1920);
  console.log('✓', hedefAd);
}

const OKU = `MEVZU JSPS — MAGAZA GORSELLERI (21 Agustos 2026)

Bu klasordeki 6 gorsel, App Store'da SU AN YAYINDA olan yeni oyun ekranlaridir.
Play magaza girisinde ise hala eski 8 markali gorsel duruyor.

HANGI KLASORU KULLANMALI?

1-APPLE-ORIJINAL   1290x2796 - App Store'a yuklenenlerin birebir aynisi.
                   iPhone orani. Play bunu "kirpilmasi gerekiyor" diye isaretler.

2-PLAY-1080x2400   Play icin ONCE BUNU DENE. Gunumuz Android telefonlarinin
                   en yaygin orani (9:20). Icerik kesilmedi; ustte/altta
                   gorselin kendi kenar rengiyle ince bir bant var.

3-PLAY-1080x1920   Tam 9:16. 2 numara kabul edilmezse bunu dene.

PLAY CONSOLE'DA NEREYE:
Play Console > Uygulama > Buyume > Magaza varligi > Ana magaza girisi
> Telefon ekran goruntuleri. Eskileri silmeden once yenileri yukle,
kabul edildigini gordukten sonra eskileri kaldir.

NOT: Play "Kirpilmasi gerekiyor" derse kirpma araciyla ustten/alttan bir
miktar kirpmasina izin ver - bantli bolge zaten fazlaliktir.
`;
fs.writeFileSync(path.join(HEDEF, 'OKU-BENI.txt'), OKU, 'utf8');
console.log('\nKLASOR HAZIR:', HEDEF);
