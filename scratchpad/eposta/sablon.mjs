/**
 * "MEVZU YENİLENDİ" BİLGİLENDİRME E-POSTASI — şablon.
 * Bilinçli olarak SATIŞ CÜMLESİ YOK: bu bir hizmet bilgilendirmesidir (ticari ileti değil),
 * yasal olarak en savunulabilir hâli budur. Kampanya/indirim maili AYRI ve izinle gider.
 *
 * E-posta HTML'i tarayıcı HTML'i değildir: tablo düzeni + satır içi stil şart,
 * yoksa Outlook/Gmail düzeni bozar. Uzak görsel YOK — çoğu istemci varsayılan olarak engeller.
 */

export const KONU = 'Mevzu yenilendi — güncellemeyi unutma';

const ALTIN = '#C9A227';
const LACIVERT = '#0B1F3A';
const KREM = '#F7F3EA';
const KART = '#FFFCF5';
const METIN = '#1B2A4A';
const SOLUK = '#6E6047';
const KENAR = '#E7DCC7';

export const PLAY = 'https://play.google.com/store/apps/details?id=app.mevzujsps.android';
export const APPSTORE = 'https://apps.apple.com/tr/app/id6787908212';

export function html(ad) {
  const hitap = ad ? `Merhaba ${ad},` : 'Merhaba komutan,';
  const madde = (b, m) => `
      <tr><td style="padding:0 0 14px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td width="10" valign="top" style="padding-top:7px;"><div style="width:6px;height:6px;background:${ALTIN};border-radius:50%;"></div></td>
          <td style="padding-left:12px;font:15px/1.6 -apple-system,Segoe UI,Roboto,Arial,sans-serif;color:${METIN};">
            <b style="color:${LACIVERT};">${b}</b> ${m}
          </td>
        </tr></table>
      </td></tr>`;

  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${KONU}</title></head>
<body style="margin:0;padding:0;background:${KREM};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Tasarım baştan değişti, Oyun Merkezi açıldı. Yeniliklerin görünmesi için uygulamayı güncellemen gerekiyor.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${KREM};">
<tr><td align="center" style="padding:28px 12px;">

  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:${KART};border:1px solid ${KENAR};border-radius:14px;overflow:hidden;">

    <tr><td style="background:${LACIVERT};padding:26px 28px;">
      <div style="font:700 21px/1.2 Georgia,'Times New Roman',serif;color:#FFFFFF;letter-spacing:.02em;">MEVZU <span style="color:${ALTIN};">·</span> JSPS</div>
      <div style="font:13px/1.4 -apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#C9C2B2;padding-top:5px;">Görsel hafıza teknikleriyle sınav hazırlığı</div>
    </td></tr>

    <tr><td style="padding:30px 28px 6px 28px;">
      <div style="font:700 24px/1.3 Georgia,'Times New Roman',serif;color:${LACIVERT};">Uygulama baştan yenilendi</div>
      <div style="height:3px;width:54px;background:${ALTIN};margin:14px 0 20px 0;"></div>
      <div style="font:15px/1.7 -apple-system,Segoe UI,Roboto,Arial,sans-serif;color:${METIN};">
        ${hitap}<br><br>
        Mevzu'yu baştan aşağı elden geçirdik. Telefonundaki sürüm eskiyse bunların hiçbirini göremezsin — o yüzden bu maili yazıyoruz.
      </div>
    </td></tr>

    <tr><td style="padding:22px 28px 4px 28px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${madde('Tasarım komple değişti.', 'Karargâh, Patika ve kart akışı yeniden çizildi.')}
        ${madde('Oyun Merkezi açıldı.', 'Çengel Bulmaca, Adam Asmaca, Rütbe Merdiveni, Boşluk Doldurma, Ceza Terazisi ve canlı 1v1 Er Meydanı dahil 14 oyun.')}
      </table>
    </td></tr>

    <tr><td style="padding:8px 28px 0 28px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FBF4DE;border:1px solid ${ALTIN};border-radius:10px;">
        <tr><td style="padding:15px 18px;font:14px/1.6 -apple-system,Segoe UI,Roboto,Arial,sans-serif;color:${METIN};">
          <b style="color:${LACIVERT};">Güncellemezsen yenilikler karşına çıkmaz.</b><br>
          Uygulama mağazasından güncelle, tek dokunuş.
        </td></tr>
      </table>
    </td></tr>

    <tr><td align="center" style="padding:24px 28px 6px 28px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="padding:0 6px;">
          <a href="${PLAY}" style="display:inline-block;background:${LACIVERT};color:#FFFFFF;text-decoration:none;font:700 15px/1 -apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:15px 26px;border-radius:9px;">Android · Güncelle</a>
        </td>
        <td style="padding:0 6px;">
          <a href="${APPSTORE}" style="display:inline-block;background:${KART};color:${LACIVERT};text-decoration:none;font:700 15px/1 -apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:14px 25px;border:2px solid ${LACIVERT};border-radius:9px;">iPhone · Güncelle</a>
        </td>
      </tr></table>
    </td></tr>

    <tr><td style="padding:22px 28px 26px 28px;">
      <div style="font:15px/1.7 -apple-system,Segoe UI,Roboto,Arial,sans-serif;color:${METIN};">
        Kolay gelsin komutanım.<br>
        <span style="color:${SOLUK};">Mevzu · JSPS ekibi</span>
      </div>
    </td></tr>

    <tr><td style="background:#F3EEE2;border-top:1px solid ${KENAR};padding:18px 28px;">
      <div style="font:12px/1.65 -apple-system,Segoe UI,Roboto,Arial,sans-serif;color:${SOLUK};">
        Bu e-postayı Mevzu · JSPS uygulamasına kayıtlı olduğun için aldın. Reklam değil, uygulamanla ilgili bir bilgilendirmedir.<br>
        Bu tür bilgilendirmeleri almak istemiyorsan bu maile <b>ÇIK</b> yazıp cevap ver — listeden çıkarırız.<br>
        İletişim: <a href="mailto:iletisim@mevzujsps.com" style="color:${SOLUK};">iletisim@mevzujsps.com</a> &nbsp;·&nbsp;
        <a href="https://mevzujsps.com" style="color:${SOLUK};">mevzujsps.com</a>
      </div>
    </td></tr>

  </table>
</td></tr></table>
</body></html>`;
}

export function duz(ad) {
  return `${ad ? `Merhaba ${ad},` : 'Merhaba komutan,'}

Mevzu'yu baştan aşağı elden geçirdik. Telefonundaki sürüm eskiyse bunların hiçbirini göremezsin:

- Tasarım komple değişti. Karargâh, Patika ve kart akışı yeniden çizildi.
- Oyun Merkezi açıldı. Çengel Bulmaca, Adam Asmaca, Rütbe Merdiveni, Boşluk Doldurma,
  Ceza Terazisi ve canlı 1v1 Er Meydanı dahil 14 oyun.

GÜNCELLEMEZSEN YENİLİKLER KARŞINA ÇIKMAZ.

Android: ${PLAY}
iPhone : ${APPSTORE}

Kolay gelsin komutanım.
Mevzu · JSPS ekibi

---
Bu e-postayı Mevzu · JSPS uygulamasına kayıtlı olduğun için aldın. Reklam değil,
uygulamanla ilgili bir bilgilendirmedir. Almak istemiyorsan bu maile ÇIK yazıp cevap ver.
iletisim@mevzujsps.com · mevzujsps.com`;
}
