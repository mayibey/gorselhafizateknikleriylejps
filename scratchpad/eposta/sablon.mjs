/**
 * "MEVZU JSPS GÜNCELLENDİ" BİLGİLENDİRME E-POSTASI — şablon (24 Ağu 2026 sürümü).
 *
 * Metin başkanındır; denetimde işaretlenen 4 yer düzeltildi:
 *  1) Aylık üyelik SATIŞ ÇAĞRISI kaldırıldı, tek cümlelik bilgiye indi ve sona alındı
 *     → mail ticari ileti değil, hizmet bilgilendirmesi olarak durur (6563 / İYS riski).
 *  2) "14 yeni oyun" → "15 oyun" (ölçüm: Oyun Merkezi 6 Ağu'da 15 oyunla birden girdi).
 *  3) "en çok gelen talep" → "gelen taleplerden biri" (elimizde böyle bir ölçüm yok).
 *  4) Alt bilgiye şartlar/gizlilik bağlantısı eklendi; ret hakkı (ÇIK) korundu.
 *     Ticari unvan/adres satırı başkanın kararıyla KONMADI.
 *
 * E-posta HTML'i tarayıcı HTML'i değildir: tablo düzeni + satır içi stil şart,
 * yoksa Outlook/Gmail düzeni bozar. Uzak görsel YOK — çoğu istemci engeller.
 */

export const KONU = 'Mevzu JSPS güncellendi — 13 deneme sınavı ve yenilenen soru havuzu';

const ALTIN = '#C9A227';
const LACIVERT = '#0B1F3A';
const KREM = '#F7F3EA';
const KART = '#FFFCF5';
const METIN = '#1B2A4A';
const SOLUK = '#6E6047';
const KENAR = '#E7DCC7';

export const PLAY = 'https://play.google.com/store/apps/details?id=app.mevzujsps.android';
export const APPSTORE = 'https://apps.apple.com/tr/app/id6787908212';
export const SARTLAR = 'https://mevzujsps.com/sartlar.html';

/** JSPS sınav tarihi — uygulamadaki geri sayımla AYNI kaynak (19 Eylül 2026, 14:00). */
const SINAV_TARIHI = new Date(2026, 8, 19, 14, 0, 0);
/** Kalan gün, uygulamadaki sayaçla aynı şekilde (aşağı yuvarlanır). Elle yazılmaz. */
export function kalanGun() {
  return Math.max(0, Math.floor((SINAV_TARIHI.getTime() - Date.now()) / 86400000));
}

export function html(ad) {
  const hitap = ad ? `Merhaba ${ad},` : 'Merhaba komutan,';
  const yaziFont = "-apple-system,Segoe UI,Roboto,Arial,sans-serif";

  /** Bölüm başlığı (emoji + altın çizgi). */
  const baslik = (b) => `
    <tr><td style="padding:26px 28px 0 28px;">
      <div style="font:700 17px/1.35 ${yaziFont};color:${LACIVERT};">${b}</div>
      <div style="height:3px;width:40px;background:${ALTIN};margin:10px 0 14px 0;"></div>
    </td></tr>`;

  /** Normal paragraf. */
  const p = (m) => `
    <tr><td style="padding:0 28px 12px 28px;">
      <div style="font:15px/1.7 ${yaziFont};color:${METIN};">${m}</div>
    </td></tr>`;

  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${KONU}</title></head>
<body style="margin:0;padding:0;background:${KREM};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">13 deneme sınavı, 15 oyun ve yenilenen soru havuzu uygulamada.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${KREM};">
<tr><td align="center" style="padding:28px 12px;">

  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:${KART};border:1px solid ${KENAR};border-radius:14px;overflow:hidden;">

    <tr><td style="background:${LACIVERT};padding:26px 28px;">
      <div style="font:700 21px/1.2 Georgia,'Times New Roman',serif;color:#FFFFFF;letter-spacing:.02em;">MEVZU <span style="color:${ALTIN};">·</span> JSPS</div>
      <div style="font:13px/1.4 ${yaziFont};color:#C9C2B2;padding-top:5px;">Görsel hafıza teknikleriyle sınav hazırlığı</div>
    </td></tr>

    <tr><td style="background:#FBF4DE;border-bottom:1px solid ${KENAR};padding:14px 28px;" align="center">
      <div style="font:700 16px/1.4 ${yaziFont};color:${LACIVERT};">⏳ JSPS sınavına <span style="color:#C00000;">${kalanGun()} gün</span> kaldı</div>
    </td></tr>

    <tr><td style="padding:30px 28px 6px 28px;">
      <div style="font:700 24px/1.3 Georgia,'Times New Roman',serif;color:${LACIVERT};">Yeni güncelleme yayında 🚀</div>
      <div style="height:3px;width:54px;background:${ALTIN};margin:14px 0 20px 0;"></div>
      <div style="font:15px/1.7 ${yaziFont};color:${METIN};">
        ${hitap}<br><br>
        Mevzu JSPS'in yeni güncellemesi yayında!
      </div>
    </td></tr>

    ${baslik('🎮 OYUN MERKEZİ: 15 OYUN')}
    ${p('Tekrar yapmak artık aynı soruları tekrar tekrar çözmek demek değil.')}
    ${p(`Oyun Merkezi'nde <b style="color:${LACIVERT};">15 oyun</b> var.`)}
    ${p('Oyunlarla öğrendiğin maddeleri <b>sıkılmadan tekrar et, pekiştir ve aklında tut.</b>')}
    ${p(`Toplamda <b style="color:${LACIVERT};">2.600'den fazla oyun sorusu</b> seni bekliyor.`)}

    ${baslik('📝 13 DENEME — TAMAMI ÜCRETSİZ')}
    ${p('Yeni güncellemeyle:')}
    <tr><td style="padding:0 28px 12px 28px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FBF4DE;border:1px solid ${KENAR};border-radius:10px;">
        <tr><td style="padding:14px 18px;font:15px/1.9 ${yaziFont};color:${LACIVERT};">
          <b>3 Müşterek Deneme</b><br>
          <b>5 Branş Denemesi</b><br>
          <b>5 Genel Deneme</b>
        </td></tr>
      </table>
    </td></tr>
    ${p(`olmak üzere toplam <b style="color:${LACIVERT};">13 deneme ve 900 soru</b> eklendi.`)}
    ${p(`Üstelik <b style="color:${LACIVERT};">tüm denemeler herkese ücretsiz.</b>`)}
    ${p('Deneme sonunda yanlış yaptığın sorunun <b>hangi kanunun hangi maddesine ait olduğunu</b> görebilir, Premium üyelikle doğrudan ilgili görsel karta giderek eksiğini kapatabilirsin.')}
    ${p('Ayrıca deneme sıralamaları, hata bildirme sistemi ve yenilenen soru havuzu da artık uygulamada.')}

    ${baslik('⭐ ÜYELİK SEÇENEKLERİ')}
    ${p(`Gelen taleplerden birini hayata geçirdik: yıllık ve ömür boyu üyeliğin yanına <b style="color:${LACIVERT};">aylık üyelik</b> seçeneği de eklendi.`)}

    ${baslik('📲 GÜNCELLEMEYİ UNUTMA')}
    ${p('Yeni oyunları ve denemeleri görebilmek için <b>Mevzu JSPS\'i App Store veya Google Play üzerinden güncellemen gerekiyor.</b>')}

    <tr><td align="center" style="padding:10px 28px 6px 28px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="padding:0 6px;">
          <a href="${PLAY}" style="display:inline-block;background:${LACIVERT};color:#FFFFFF;text-decoration:none;font:700 15px/1 ${yaziFont};padding:14px 22px;border-radius:10px;">Google Play</a>
        </td>
        <td style="padding:0 6px;">
          <a href="${APPSTORE}" style="display:inline-block;background:${KART};color:${LACIVERT};text-decoration:none;font:700 15px/1 ${yaziFont};padding:13px 21px;border-radius:10px;border:2px solid ${LACIVERT};">App Store</a>
        </td>
      </tr></table>
    </td></tr>

    <tr><td style="padding:24px 28px 26px 28px;">
      <div style="font:15px/1.7 ${yaziFont};color:${METIN};">
        <b style="color:${LACIVERT};">Güncelle. Oyna. Denemeni çöz. Zayıf mevzilerini kapat.</b><br><br>
        <span style="color:${SOLUK};">Mevzu · JSPS</span>
      </div>
    </td></tr>

    <tr><td style="background:#F3EEE2;border-top:1px solid ${KENAR};padding:18px 28px;">
      <div style="font:12px/1.65 ${yaziFont};color:${SOLUK};">
        Bu e-postayı Mevzu · JSPS uygulamasına kayıtlı olduğun için aldın; uygulamanla ilgili bir bilgilendirmedir.<br>
        Bu tür bilgilendirmeleri almak istemiyorsan bu maile <b>ÇIK</b> yazıp cevap ver — listeden çıkarırız.<br>
        <a href="mailto:iletisim@mevzujsps.com" style="color:${SOLUK};">iletisim@mevzujsps.com</a> &nbsp;·&nbsp;
        <a href="https://mevzujsps.com" style="color:${SOLUK};">mevzujsps.com</a> &nbsp;·&nbsp;
        <a href="${SARTLAR}" style="color:${SOLUK};">Gizlilik ve Kullanım Şartları</a>
      </div>
    </td></tr>

  </table>
</td></tr></table>
</body></html>`;
}

export function duz(ad) {
  return `⏳ JSPS sınavına ${kalanGun()} gün kaldı.

${ad ? `Merhaba ${ad},` : 'Merhaba komutan,'}

Mevzu JSPS'in yeni güncellemesi yayında! 🚀

🎮 OYUN MERKEZİ: 15 OYUN

Tekrar yapmak artık aynı soruları tekrar tekrar çözmek demek değil.
Oyun Merkezi'nde 15 oyun var.
Oyunlarla öğrendiğin maddeleri sıkılmadan tekrar et, pekiştir ve aklında tut.
Toplamda 2.600'den fazla oyun sorusu seni bekliyor.

📝 13 DENEME — TAMAMI ÜCRETSİZ

Yeni güncellemeyle:
  3 Müşterek Deneme
  5 Branş Denemesi
  5 Genel Deneme
olmak üzere toplam 13 deneme ve 900 soru eklendi.

Üstelik tüm denemeler herkese ücretsiz.

Deneme sonunda yanlış yaptığın sorunun hangi kanunun hangi maddesine ait olduğunu
görebilir, Premium üyelikle doğrudan ilgili görsel karta giderek eksiğini kapatabilirsin.

Ayrıca deneme sıralamaları, hata bildirme sistemi ve yenilenen soru havuzu da artık
uygulamada.

⭐ ÜYELİK SEÇENEKLERİ

Gelen taleplerden birini hayata geçirdik: yıllık ve ömür boyu üyeliğin yanına
aylık üyelik seçeneği de eklendi.

📲 GÜNCELLEMEYİ UNUTMA

Yeni oyunları ve denemeleri görebilmek için Mevzu JSPS'i App Store veya Google Play
üzerinden güncellemen gerekiyor.

Android: ${PLAY}
iPhone : ${APPSTORE}

Güncelle. Oyna. Denemeni çöz. Zayıf mevzilerini kapat.

Mevzu · JSPS

---
Bu e-postayı Mevzu · JSPS uygulamasına kayıtlı olduğun için aldın; uygulamanla ilgili
bir bilgilendirmedir. Almak istemiyorsan bu maile ÇIK yazıp cevap ver.
iletisim@mevzujsps.com · mevzujsps.com · ${SARTLAR}`;
}
