/**
 * MAĞAZA BİLDİRİM UCU — Apple ve Google'ın ANLIK olarak bize haber verdiği tek kapı.
 *
 * NEDEN (22 Eyl 2026, başkan): "iade alınmışsa ANINDA erişim kesilsin" + "Apple/Google iade
 * talebinde bize sorup onay bekliyor mu, istediği bilgileri veren sistemimiz var mı?"
 * O güne kadar CEVAP: yoktu. Tek savunmamız gecede bir çalışan denetçiydi (06:30) → iade alan
 * biri en kötü ihtimalle 24 saat bedava kalıyordu. Apple'ın iade sorgusuna ise hiç cevap
 * veremiyorduk; bir kullanıcı 11 günde 2.509 içerik açıp iade aldı, itiraz edemedik.
 *
 * ⛔ GÜVENLİK TEMELİ — "BİLDİRİME DEĞİL, MAĞAZAYA İNAN":
 *    Bu uç herkese açıktır. Gelen bildirim TEK BAŞINA hiçbir hakkı silmez. Her yıkıcı işlemden
 *    önce mağazanın KENDİ API'sine sorulur (Apple: revocationDate · Google: voidedpurchases /
 *    purchaseState). Sahte bildirim en fazla boşuna bir sorgu yaptırır. Ağ/HTTP hatası ASLA
 *    silme sebebi değildir — bu, gece denetçisiyle aynı değişmez kural.
 *    Ek olarak Apple imzası x5c zinciriyle doğrulanır (kök sertifika parmak izi sabitli),
 *    Google ucu paylaşılan anahtarla korunur (?anahtar=...).
 *
 * KURULUM (tek seferlik, panelden):
 *   Apple  → App Store Connect › App Information › App Store Server Notifications › Production URL
 *            https://vwmjrvolkbiofpkzzwef.supabase.co/functions/v1/magaza-bildirim
 *   Google → Play Console › Monetization setup › Real-time developer notifications (Pub/Sub konusu),
 *            push aboneliği aynı adrese + ?anahtar=<MAGAZA_BILDIRIM_ANAHTARI>
 *
 * TÜKETİM VERİSİ RIZASI: Apple, CONSUMPTION_REQUEST cevabını ancak müşteri veri paylaşımına
 * rıza göstermişse dikkate alır. Kullanım şartlarımızda bu cümle YOK → `apple_tuketim_rizasi`
 * ayarı varsayılan KAPALI. Şartlara cümle eklenince 1 yapılır; veri yine gönderilir, rıza
 * bayrağı dürüstçe beyan edilir (olmayan rızayı "var" diye bildirmeyiz).
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' };
const PAKET_ANDROID = 'app.mevzujsps.android';
const BUNDLE_IOS = 'app.mevzujsps.ios';
const APPLE_HOSTLAR = [
  'https://api.storekit.itunes.apple.com',
  'https://api.storekit-sandbox.itunes.apple.com',
];
const BASKAN = '98be2c62-4309-4960-9ef3-0a2e032d2f4a';
/** Apple Root CA G3 — SHA-256 parmak izi (sabitli; zincirin kökü bu değilse imza kabul edilmez). */
const APPLE_KOK_PARMAK_IZI = '63343abfb89a6a03ebb57e9b3f5fa7be7c4f5c756f3017b3a8c488c3653e9179';

// ---------------- ortak yardımcılar ----------------
function b64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlCoz(s: string): Uint8Array {
  let t = String(s).replace(/-/g, '+').replace(/_/g, '/');
  while (t.length % 4) t += '=';
  return Uint8Array.from(atob(t), (c) => c.charCodeAt(0));
}
function pemToDer(pem: string): Uint8Array {
  const govde = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  return Uint8Array.from(atob(govde), (c) => c.charCodeAt(0));
}
function jwsParca(jws: string, i: number): Record<string, unknown> | null {
  const p = String(jws || '').split('.');
  if (p.length < 2) return null;
  try { return JSON.parse(new TextDecoder().decode(b64urlCoz(p[i]))); } catch { return null; }
}
const jwsPayload = (j: string) => jwsParca(j, 1);
const jwsHeader = (j: string) => jwsParca(j, 0);

async function sha256Hex(b: Uint8Array): Promise<string> {
  const h = await crypto.subtle.digest('SHA-256', b);
  return [...new Uint8Array(h)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

/** X.509 DER içinden SubjectPublicKeyInfo'yu (SPKI) çıkarır — WebCrypto importKey('spki') için. */
function spkiCikar(cert: Uint8Array): Uint8Array | null {
  const tlv = (i: number): { bas: number; boy: number } | null => {
    if (i + 1 >= cert.length) return null;
    const ilk = cert[i + 1];
    if (ilk < 0x80) return { bas: i + 2, boy: ilk };
    const n = ilk & 0x7f;
    if (n === 0 || n > 4 || i + 2 + n > cert.length) return null;
    let boy = 0;
    for (let k = 0; k < n; k++) boy = boy * 256 + cert[i + 2 + k];
    return { bas: i + 2 + n, boy };
  };
  if (cert[0] !== 0x30) return null;
  const dis = tlv(0);                                   // Certificate ::= SEQUENCE
  if (!dis) return null;
  if (cert[dis.bas] !== 0x30) return null;
  const tbs = tlv(dis.bas);                             // tbsCertificate ::= SEQUENCE
  if (!tbs) return null;
  let p = tbs.bas;
  const son = tbs.bas + tbs.boy;
  if (cert[p] === 0xa0) { const v = tlv(p); if (!v) return null; p = v.bas + v.boy; } // [0] version
  // sırayla atlanacaklar: serialNumber, signature, issuer, validity, subject
  for (let atla = 0; atla < 5; atla++) {
    const t = tlv(p);
    if (!t || t.bas + t.boy > son) return null;
    p = t.bas + t.boy;
  }
  if (cert[p] !== 0x30) return null;                    // subjectPublicKeyInfo ::= SEQUENCE
  const spki = tlv(p);
  if (!spki) return null;
  return cert.slice(p, spki.bas + spki.boy);
}

/** Apple bildirimi gerçekten Apple'dan mı? kök parmak izi + yaprak sertifikayla ES256 imza. */
async function appleImzaDogru(jws: string): Promise<boolean> {
  try {
    const bas = jwsHeader(jws);
    const zincir = (bas?.x5c as string[] | undefined) ?? [];
    if (zincir.length < 2) return false;
    const kok = Uint8Array.from(atob(zincir[zincir.length - 1]), (c) => c.charCodeAt(0));
    if ((await sha256Hex(kok)) !== APPLE_KOK_PARMAK_IZI) return false;
    const yaprak = Uint8Array.from(atob(zincir[0]), (c) => c.charCodeAt(0));
    const spki = spkiCikar(yaprak);
    if (!spki) return false;
    const key = await crypto.subtle.importKey('spki', spki, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    const p = String(jws).split('.');
    return await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' }, key, b64urlCoz(p[2]), new TextEncoder().encode(`${p[0]}.${p[1]}`),
    );
  } catch { return false; }
}

async function appleJwt(): Promise<string> {
  const issuer = Deno.env.get('APPLE_IAP_ISSUER_ID');
  const keyId = Deno.env.get('APPLE_IAP_KEY_ID');
  const pem = Deno.env.get('APPLE_IAP_PRIVATE_KEY');
  if (!issuer || !keyId || !pem) throw new Error('APPLE_IAP_* eksik');
  const simdi = Math.floor(Date.now() / 1000);
  const header = b64url(new TextEncoder().encode(JSON.stringify({ alg: 'ES256', kid: keyId, typ: 'JWT' })));
  const claim = b64url(new TextEncoder().encode(JSON.stringify({
    iss: issuer, iat: simdi, exp: simdi + 600, aud: 'appstoreconnect-v1', bid: BUNDLE_IOS,
  })));
  const imzalanacak = `${header}.${claim}`;
  const key = await crypto.subtle.importKey('pkcs8', pemToDer(pem), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const imza = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(imzalanacak));
  return `${imzalanacak}.${b64url(imza)}`;
}

let googleTokenCache: { token: string; bitis: number } | null = null;
async function googleToken(): Promise<string> {
  if (googleTokenCache && googleTokenCache.bitis > Date.now() + 60_000) return googleTokenCache.token;
  const sa = JSON.parse(Deno.env.get('GOOGLE_SA') ?? '{}');
  if (!sa.client_email || !sa.private_key) throw new Error('GOOGLE_SA eksik');
  const simdi = Math.floor(Date.now() / 1000);
  const header = b64url(new TextEncoder().encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const claim = b64url(new TextEncoder().encode(JSON.stringify({
    iss: sa.client_email, scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token', iat: simdi, exp: simdi + 3600,
  })));
  const imzalanacak = `${header}.${claim}`;
  const key = await crypto.subtle.importKey('pkcs8', pemToDer(sa.private_key), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const imza = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(imzalanacak));
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${imzalanacak}.${b64url(imza)}` }),
  });
  const v = await r.json();
  if (!v.access_token) throw new Error('Google token alınamadı');
  googleTokenCache = { token: v.access_token, bitis: Date.now() + (v.expires_in ?? 3600) * 1000 };
  return v.access_token;
}

// ---------------- mağazaya teyit sorusu ----------------
type Teyit = { iade: boolean; bilinmiyor: boolean; not: string; bitis?: string | null };

/** Apple: işlem gerçekten geri alınmış mı? (revocationDate) */
async function appleTeyit(txId: string): Promise<Teyit> {
  const jwt = await appleJwt();
  for (const host of APPLE_HOSTLAR) {
    const r = await fetch(`${host}/inApps/v1/transactions/${txId}`, { headers: { Authorization: `Bearer ${jwt}` } });
    if (!r.ok) continue;
    const d = await r.json();
    const bilgi = jwsPayload(String(d?.signedTransactionInfo ?? ''));
    if (!bilgi) return { iade: false, bilinmiyor: true, not: 'gövde çözülemedi' };
    if (bilgi.revocationDate) {
      return { iade: true, bilinmiyor: false, not: `Apple iade ${new Date(Number(bilgi.revocationDate)).toISOString().slice(0, 10)}` };
    }
    const exp = bilgi.expiresDate ? new Date(Number(bilgi.expiresDate)).toISOString() : null;
    return { iade: false, bilinmiyor: false, not: 'geçerli', bitis: exp };
  }
  return { iade: false, bilinmiyor: true, not: 'Apple yanıt vermedi' };
}

/** Google: jeton iade listesinde mi? (tek seferlik + abonelik hepsi burada) */
async function googleIadeMi(token: string): Promise<Teyit> {
  try {
    const tok = await googleToken();
    const u = new URL(`https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PAKET_ANDROID}/purchases/voidedpurchases`);
    // Google 30 GÜNDEN eskisini kabul etmez (400) — daha uzun istenirse liste KOMPLE boş döner.
    u.searchParams.set('startTime', String(Date.now() - 29 * 24 * 60 * 60 * 1000));
    u.searchParams.set('maxResults', '1000');
    const r = await fetch(u, { headers: { Authorization: `Bearer ${tok}` } });
    if (!r.ok) return { iade: false, bilinmiyor: true, not: `voidedpurchases HTTP ${r.status}` };
    const j = await r.json();
    for (const v of j.voidedPurchases ?? []) {
      if (String(v.purchaseToken) === token) return { iade: true, bilinmiyor: false, not: `Google iade (sebep ${v.voidedReason})` };
    }
    return { iade: false, bilinmiyor: false, not: 'iade listesinde yok' };
  } catch (e) {
    return { iade: false, bilinmiyor: true, not: String(e).slice(0, 60) };
  }
}

/** Google abonelik: güncel bitiş + geri alınmış mı. */
async function googleAbonelik(token: string): Promise<Teyit> {
  try {
    const tok = await googleToken();
    const r = await fetch(
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PAKET_ANDROID}/purchases/subscriptionsv2/tokens/${encodeURIComponent(token)}`,
      { headers: { Authorization: `Bearer ${tok}` } },
    );
    if (r.status === 410) return { iade: true, bilinmiyor: false, not: 'Google 410 (geri alındı)' };
    if (!r.ok) return { iade: false, bilinmiyor: true, not: `HTTP ${r.status}` };
    const j = await r.json();
    const bitis = j.lineItems?.[j.lineItems.length - 1]?.expiryTime ?? null;
    return { iade: false, bilinmiyor: false, not: String(j.subscriptionState ?? ''), bitis };
  } catch (e) {
    return { iade: false, bilinmiyor: true, not: String(e).slice(0, 60) };
  }
}

// ---------------- tüketim verisi (Apple iade sorgusuna cevap) ----------------
/** Apple kova değerleri — ham sayı değil, aralık kodu istiyor. */
function kovaHesapTenure(gun: number): number {
  if (gun < 3) return 1; if (gun < 10) return 2; if (gun < 30) return 3;
  if (gun < 90) return 4; if (gun < 180) return 5; if (gun < 365) return 6; return 7;
}
function kovaPlayTime(dakika: number): number {
  if (dakika < 5) return 1; if (dakika < 60) return 2; if (dakika < 360) return 3;
  if (dakika < 1440) return 4; if (dakika < 5760) return 5; if (dakika < 23040) return 6; return 7;
}
function kovaDolar(d: number): number {
  if (d <= 0) return 1; if (d < 50) return 2; if (d < 100) return 3; if (d < 500) return 4;
  if (d < 1000) return 5; if (d < 2000) return 6; return 7;
}

/**
 * Apple'ın CONSUMPTION_REQUEST'ine gönderilecek kullanım tablosu.
 * playTime tahmini: her içerik erişimi (kart görüntüsü / ses oynatımı) ≈ 1,5 dakika.
 * Abartmıyoruz — kayıtlı erişim sayısı neyse ona dayanıyor.
 */
async function tuketimVerisi(db: ReturnType<typeof createClient>, userId: string, appAccountToken: string | null) {
  const { data: kisi } = await db.from('profiles').select('created_at, silme_talep_tarihi').eq('id', userId).maybeSingle();
  const { count: erisim } = await db.from('icerik_erisim_log').select('*', { count: 'exact', head: true }).eq('user_id', userId);
  const { count: deneme } = await db.from('deneme_sonuc').select('*', { count: 'exact', head: true }).eq('user_id', userId);
  const { data: haklar } = await db.from('uyelik_haklari').select('urun').eq('user_id', userId);

  const gun = kisi?.created_at ? Math.floor((Date.now() - new Date(kisi.created_at as string).getTime()) / 86400000) : 0;
  const erisimSayi = erisim ?? 0;
  const dakika = Math.round(erisimSayi * 1.5);
  // Ne kadar tüketildi: içerik gerçekten açılmışsa "tamamen tüketildi" demek dürüst.
  const tuketim = erisimSayi >= 100 ? 3 : erisimSayi >= 10 ? 2 : erisimSayi > 0 ? 2 : 1;
  // Harcanan tutar (TL liste fiyatlarından kaba USD karşılığı; kova zaten geniş aralık).
  const TL_USD = 41;
  const fiyatTL: Record<string, number> = {
    musterek_aylik: 389, musterek_yillik: 1079.99, musterek_omurboyu: 1559.99,
    musterek_omurboyu_i20: 1247.99, musterek_omurboyu_i30: 1091.99, musterek_omurboyu_yukseltme: 479.99,
  };
  const toplamTL = (haklar ?? []).reduce((t: number, h: { urun: string }) => t + (fiyatTL[h.urun] ?? 0), 0);

  // Rıza: şartlarda cümle yoksa "var" demeyiz.
  const { data: ayar } = await db.from('uygulama_ayar').select('deger').eq('anahtar', 'apple_tuketim_rizasi').maybeSingle();
  const riza = String(ayar?.deger ?? '0') === '1';

  return {
    govde: {
      accountTenure: kovaHesapTenure(gun),
      appAccountToken: appAccountToken ?? '',
      consumptionStatus: tuketim,
      customerConsented: riza,
      deliveryStatus: 0,                       // içerik teslim edildi ve çalışıyor
      lifetimeDollarsPurchased: kovaDolar(toplamTL / TL_USD),
      lifetimeDollarsRefunded: 1,              // bu hesaba daha önce iade yapılmadı
      platform: 1,                             // Apple
      playTime: kovaPlayTime(dakika),
      refundPreference: erisimSayi >= 100 ? 2 : 3,  // çok kullandıysa "iade etmeyin", az ise görüş bildirmeyiz
      sampleContentProvided: true,             // TCK bölümü herkese ücretsiz
      userStatus: kisi?.silme_talep_tarihi ? 2 : 1,
    },
    ozet: `${erisimSayi} içerik · ${deneme ?? 0} deneme · ${gun} gün üye · ~${dakika} dk`,
  };
}

// ---------------- başkana haber ----------------
async function baskanaBildir(db: ReturnType<typeof createClient>, baslik: string, govde: string) {
  try {
    const { data: adresler } = await db.from('push_token').select('token').eq('user_id', BASKAN);
    const mesajlar = (adresler ?? [])
      .filter((a: { token: string }) => String(a.token).startsWith('ExponentPushToken'))
      .map((a: { token: string }) => ({ to: a.token, sound: 'default', priority: 'high', title: baslik, body: govde }));
    if (mesajlar.length) {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(mesajlar),
      });
    }
  } catch { /* bildirim gitmezse iş yine yapılmış sayılır */ }
}

/** Hakkı kapat — YALNIZ mağaza iadeyi teyit ettiyse çağrılır. */
async function hakkiKapat(
  db: ReturnType<typeof createClient>,
  kosul: { sutun: string; deger: string },
  not: string,
  platform: string,
) {
  const { data: haklar } = await db.from('uyelik_haklari').select('user_id, urun').eq(kosul.sutun, kosul.deger);
  if (!haklar || haklar.length === 0) return { kapatilan: 0, kim: '' };
  const userId = haklar[0].user_id as string;
  await db.from('satin_alma_log').insert({
    user_id: userId, urun: haklar[0].urun, tip: null, token: kosul.deger,
    // durum='iade': bot yalniz (reddedildi,hata) satirlarina alarm veriyor. Buraya 'reddedildi'
    // yazarsak ayni iade icin hem bot uyarisi hem asagidaki push gider — cifte bildirim olur.
    durum: 'iade', detay: `${not} — anlik bildirim, premium kapatildi`, platform,
  });
  await db.from('uyelik_haklari').delete().eq(kosul.sutun, kosul.deger);
  const { data: kisi } = await db.from('profiles').select('ad, soyad').eq('id', userId).maybeSingle();
  const kim = [kisi?.ad, kisi?.soyad].filter(Boolean).join(' ') || userId.slice(0, 8);
  await baskanaBildir(db, '💳 İade — erişim kapatıldı', `${kim}: ${not}`);
  return { kapatilan: haklar.length, kim };
}

// ---------------- Apple bildirimi ----------------
async function appleIsle(db: ReturnType<typeof createClient>, signedPayload: string) {
  // İmza denetimi DANIŞMA niteliğinde, ENGELLEYİCİ değil — bilerek.
  // Gerçek güvenlik garantisi "her yıkıcı işlemden önce Apple'a tekrar sor" kuralıdır; imza
  // onun üstüne bir kat. Engelleyici yapılırsa bizim sertifika ayrıştırma kodumuzdaki tek bir
  // hata BÜTÜN bildirimleri sessizce çöpe atar (Apple 500 görüp sonsuza kadar tekrar dener) —
  // yani kendi kodumuz tek hata noktası olur. Sahte bildirim zaten hiçbir şeyi silemez:
  // Apple'a sorulur, "iade yok" cevabı gelir, kayda dokunulmaz.
  const imzali = await appleImzaDogru(signedPayload);
  const bildirim = jwsPayload(signedPayload);
  if (!bildirim) return { ok: false, not: 'govde cozulemedi' };
  const tip = String(bildirim.notificationType ?? '');
  const altTip = String(bildirim.subtype ?? '');
  const veri = (bildirim.data ?? {}) as Record<string, unknown>;
  if (veri.bundleId && String(veri.bundleId) !== BUNDLE_IOS) return { ok: false, not: 'baska uygulama' };

  if (!imzali) console.warn('magaza-bildirim: Apple imzasi dogrulanamadi, magazaya teyit ile devam:', tip);
  const tx = jwsPayload(String(veri.signedTransactionInfo ?? '')) ?? {};
  const orijinal = String(tx.originalTransactionId ?? '');
  const islem = String(tx.transactionId ?? orijinal);
  if (!orijinal) return { ok: true, not: `${tip}: islem numarasi yok, gecildi` };

  // 1) İADE / GERİ ALMA → mağazaya teyit ettir, sonra kapat.
  if (tip === 'REFUND' || tip === 'REVOKE') {
    const teyit = await appleTeyit(islem);
    if (teyit.bilinmiyor) return { ok: false, not: `${tip}: Apple teyit vermedi (${teyit.not}) — DOKUNULMADI` };
    if (!teyit.iade) return { ok: true, not: `${tip}: Apple iadeyi gostermiyor — DOKUNULMADI` };
    const s = await hakkiKapat(db, { sutun: 'satin_alma_token', deger: orijinal }, teyit.not, 'ios');
    return { ok: true, not: `${tip}: ${s.kapatilan} hak kapatildi (${s.kim})` };
  }

  // 2) İADE GERİ ALINDI (Apple kararı bozdu) → erişimi geri vermemiz gerekir, başkana haber.
  if (tip === 'REFUND_REVERSED') {
    await baskanaBildir(db, '↩️ Apple iadeyi geri aldı', `İşlem ${orijinal} — erişimin geri verilmesi gerekiyor.`);
    return { ok: true, not: 'REFUND_REVERSED: baskana bildirildi' };
  }

  // 3) İADE REDDEDİLDİ → iyi haber, sadece kaydı düşelim.
  if (tip === 'REFUND_DECLINED') {
    await baskanaBildir(db, '✅ Apple iade talebini reddetti', `İşlem ${orijinal}.`);
    return { ok: true, not: 'REFUND_DECLINED' };
  }

  // 4) APPLE BİZE SORUYOR: "bu kişi ne kadar kullandı?" → 12 saat içinde cevaplanmalı.
  if (tip === 'CONSUMPTION_REQUEST') {
    const { data: hak } = await db.from('uyelik_haklari').select('user_id').eq('satin_alma_token', orijinal).maybeSingle();
    if (!hak) return { ok: true, not: 'CONSUMPTION_REQUEST: kullanici bulunamadi' };
    const { govde, ozet } = await tuketimVerisi(db, hak.user_id as string, String(tx.appAccountToken ?? '') || null);
    const jwt = await appleJwt();
    let gonderildi = '';
    for (const host of APPLE_HOSTLAR) {
      const r = await fetch(`${host}/inApps/v1/transactions/consumption/${orijinal}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(govde),
      });
      if (r.ok || r.status === 202) { gonderildi = 'ok'; break; }
      gonderildi = `HTTP ${r.status}`;
    }
    await db.from('satin_alma_log').insert({
      user_id: hak.user_id, urun: null, tip: null, token: orijinal, durum: 'bilgi',
      detay: `Apple iade sorgusu cevaplandi (${gonderildi}) — ${ozet} · riza=${govde.customerConsented}`,
      platform: 'ios',
    });
    await baskanaBildir(db, '📋 Apple iade sorgusu', `Cevap gönderildi (${gonderildi}). Kullanım: ${ozet}`);
    return { ok: true, not: `CONSUMPTION_REQUEST: ${gonderildi} · ${ozet}` };
  }

  // 5) Yenileme / süre değişimi → bitiş tarihini tazele (abonelik uzamasi kendiliginden görünsün).
  if (tip === 'DID_RENEW' || tip === 'SUBSCRIBED' || tip === 'DID_CHANGE_RENEWAL_STATUS' || tip === 'EXPIRED') {
    const teyit = await appleTeyit(islem);
    if (!teyit.bilinmiyor && teyit.bitis) {
      await db.from('uyelik_haklari').update({ bitis: teyit.bitis, son_dogrulama: new Date().toISOString() })
        .eq('satin_alma_token', orijinal);
    }
    return { ok: true, not: `${tip}${altTip ? '/' + altTip : ''}: bitis=${teyit.bitis ?? '—'}` };
  }

  return { ok: true, not: `${tip}${altTip ? '/' + altTip : ''}: islem gerekmiyor` };
}

// ---------------- Google bildirimi ----------------
async function googleIsle(db: ReturnType<typeof createClient>, govde: Record<string, unknown>) {
  const ham = (govde?.message as { data?: string } | undefined)?.data;
  if (!ham) return { ok: false, not: 'message.data yok' };
  let bildirim: Record<string, unknown>;
  try { bildirim = JSON.parse(new TextDecoder().decode(b64urlCoz(ham))); } catch { return { ok: false, not: 'data cozulemedi' }; }
  if (bildirim.packageName && String(bildirim.packageName) !== PAKET_ANDROID) return { ok: false, not: 'baska uygulama' };

  // 1) İADE/GERİ ALMA bildirimi — en kritik olan bu.
  const iadeBildirim = bildirim.voidedPurchaseNotification as { purchaseToken?: string } | undefined;
  if (iadeBildirim?.purchaseToken) {
    const token = String(iadeBildirim.purchaseToken);
    const teyit = await googleIadeMi(token);
    if (teyit.bilinmiyor) return { ok: false, not: `Google teyit vermedi (${teyit.not}) — DOKUNULMADI` };
    if (!teyit.iade) return { ok: true, not: 'Google iade listesinde yok — DOKUNULMADI' };
    const s = await hakkiKapat(db, { sutun: 'satin_alma_token', deger: token }, teyit.not, 'android');
    return { ok: true, not: `iade: ${s.kapatilan} hak kapatildi (${s.kim})` };
  }

  // 2) Abonelik olayları — 12 = REVOKED (geri alma), diğerleri bitiş tazeleme.
  const abone = bildirim.subscriptionNotification as { notificationType?: number; purchaseToken?: string } | undefined;
  if (abone?.purchaseToken) {
    const token = String(abone.purchaseToken);
    if (abone.notificationType === 12) {
      const teyit = await googleIadeMi(token);
      if (teyit.bilinmiyor) return { ok: false, not: `REVOKED ama teyit yok (${teyit.not}) — DOKUNULMADI` };
      if (teyit.iade) {
        const s = await hakkiKapat(db, { sutun: 'satin_alma_token', deger: token }, teyit.not, 'android');
        return { ok: true, not: `REVOKED: ${s.kapatilan} hak kapatildi (${s.kim})` };
      }
      return { ok: true, not: 'REVOKED ama iade listesinde yok — DOKUNULMADI' };
    }
    const d = await googleAbonelik(token);
    if (!d.bilinmiyor && d.bitis) {
      await db.from('uyelik_haklari').update({ bitis: d.bitis, son_dogrulama: new Date().toISOString() })
        .eq('satin_alma_token', token);
    }
    return { ok: true, not: `abonelik olayi ${abone.notificationType}: ${d.not} bitis=${d.bitis ?? '—'}` };
  }

  // 3) Tek seferlik ürün olayları (ömür boyu) — iade listesinden teyit.
  const tekSeferlik = bildirim.oneTimeProductNotification as { purchaseToken?: string } | undefined;
  if (tekSeferlik?.purchaseToken) {
    const teyit = await googleIadeMi(String(tekSeferlik.purchaseToken));
    if (teyit.iade) {
      const s = await hakkiKapat(db, { sutun: 'satin_alma_token', deger: String(tekSeferlik.purchaseToken) }, teyit.not, 'android');
      return { ok: true, not: `tek seferlik iade: ${s.kapatilan} hak kapatildi (${s.kim})` };
    }
    return { ok: true, not: 'tek seferlik olay: islem gerekmiyor' };
  }

  if (bildirim.testNotification) return { ok: true, not: 'Google test bildirimi alindi' };
  return { ok: true, not: 'taninmayan bildirim, gecildi' };
}

// ---------------- giriş ----------------
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SERVICE_ROLE_KEY')!);
  let sonuc: { ok: boolean; not: string } = { ok: false, not: 'bos istek' };
  try {
    const govde = await req.json();
    if (govde?.signedPayload) {
      sonuc = await appleIsle(db, String(govde.signedPayload));
    } else if (govde?.message?.data) {
      // Google Pub/Sub push: paylaşılan anahtar şart (uç herkese açık).
      const anahtar = Deno.env.get('MAGAZA_BILDIRIM_ANAHTARI');
      const gelen = new URL(req.url).searchParams.get('anahtar');
      if (!anahtar || gelen !== anahtar) {
        return new Response(JSON.stringify({ hata: 'yetkisiz' }), { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' } });
      }
      sonuc = await googleIsle(db, govde);
    } else {
      sonuc = { ok: false, not: 'taninmayan govde' };
    }
  } catch (e) {
    sonuc = { ok: false, not: String(e).slice(0, 200) };
  }

  // İz kaydı — ne geldi, ne yapıldı. (Tablo yoksa iş durmasın.)
  await db.from('uyelik_denetim_log').insert({ ozet: { kaynak: 'magaza-bildirim', ...sonuc, tarih: new Date().toISOString() } })
    .then(() => {}, () => {});

  // Apple/Google 200 görmezse tekrar gönderir. Teyit alamadığımız (bilinmiyor) hâllerde
  // BİLEREK 500 dönüyoruz ki mağaza tekrar denesin — bildirimi kaybetmeyelim.
  return new Response(JSON.stringify(sonuc), {
    status: sonuc.ok ? 200 : 500,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
});
