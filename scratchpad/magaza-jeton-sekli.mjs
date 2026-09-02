/**
 * DENETİM KÖR NOKTASI KAPATILDI — 2 Eyl 2026 (başkan: "o etiketi düzelt").
 *
 * KUSUR: gece denetimi satın almayı hangi mağazaya soracağını `platform` ETİKETİNE bakarak
 * seçiyordu. Temmuz başındaki 9 iOS satın alması sunucunun eski varsayılanı yüzünden
 * 'android' yazılmıştı → Google'a soruluyor, "HTTP 400" alınıyor, "bilinmiyor" diye
 * geçiliyordu. O dokuz kişiden biri iade alsa ASLA fark etmezdik.
 *
 * ÇÖZÜM: mağaza artık JETONUN ŞEKLİNDEN seçilir. Apple işlem kimliği yalnız rakam (~15 hane),
 * Google jetonu 144 karakterlik harf+rakam+tire → karışması imkânsız. Etiket yanlış olsa bile
 * doğru mağazaya sorulur. (Veri de düzeltildi; bu ikinci savunma hattı.)
 */
import fs from 'node:fs';

const KOK = 'D:/GorselHafizaTeknikleriyleJSPS/';
let n = 0;
const degistir = (p, eski, yeni, ad) => {
  const s = fs.readFileSync(KOK + p, 'utf8');
  if (!s.includes(eski)) { console.log('  ✗ ÇAPA YOK:', ad); process.exit(1); }
  fs.writeFileSync(KOK + p, s.replace(eski, yeni), 'utf8');
  console.log('  ✓', ad);
  n++;
};

// ——— 1) Gece denetimi (sunucu) ———
degistir('supabase/functions/uyelik-denetle/index.ts',
  `      if (s.platform === 'ios') sonuc = await appleDurum(s.satin_alma_token as string);`,
  `      // Mağaza ETİKETTEN DEĞİL JETON ŞEKLİNDEN seçilir (2 Eyl 2026): 9 iOS satın alması
      // 'android' etiketiyle kayıtlıydı, Google'a sorulup "bilinmiyor" diye geçiliyordu →
      // iade alsalar fark etmezdik. Apple işlem kimliği salt rakam; Google jetonu 144 karakter.
      const appleJeton = /^[0-9]{8,25}$/.test(String(s.satin_alma_token));
      if (s.platform === 'ios' || appleJeton) sonuc = await appleDurum(s.satin_alma_token as string);`,
  'sunucu denetimi: jeton şekline göre mağaza');

// ——— 2) Yerel denetim betiği ———
degistir('scripts/uyelik-denetle.mjs',
  `    if (s.platform === 'android') {
      sonuc = s.tip === 'abonelik' ? await googleAbonelik(s.satin_alma_token) : await googleUrun(s.urun, s.satin_alma_token);
    } else if (s.platform === 'ios') {
      sonuc = await appleDurum(s.satin_alma_token, s.tip);
    } else {`,
  `    // Mağaza jeton ŞEKLİNDEN seçilir; etiket yanlışsa bile doğru mağazaya sorulur
    // (2 Eyl 2026: 9 iOS satın alması 'android' etiketliydi → sessizce denetim dışı kalıyordu).
    const appleJeton = /^[0-9]{8,25}$/.test(String(s.satin_alma_token));
    if (appleJeton || s.platform === 'ios') {
      sonuc = await appleDurum(s.satin_alma_token, s.tip);
    } else if (s.platform === 'android') {
      sonuc = s.tip === 'abonelik' ? await googleAbonelik(s.satin_alma_token) : await googleUrun(s.urun, s.satin_alma_token);
    } else {`,
  'yerel denetim: jeton şekline göre mağaza');

console.log(`\nuygulanan yama: ${n}`);
