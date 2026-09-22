/**
 * ÜYELİK DENETÇİSİ (sunucu) — iade edilen satın almanın premium'unu OTOMATİK kapatır.
 *
 * NEDEN (26 Ağu 2026, başkan): "iade alanı her seferinde biz takip edemeyiz, otomatik olsun."
 * Apple/Google bize iade bildirimi göndermiyor (ASSN/RTDN kurulu değil). Satın alma yalnız
 * ALINDIĞI AN doğrulanıyordu → iade alan biri sonsuza kadar premium kalıyordu.
 * (Gerçek vaka: bir kullanıcı 26 Tem'de ömür boyu aldı, 6 Ağu'da Apple'dan iadesini aldı,
 *  20 gün boyunca premium kaldı. Elle bulunup kapatıldı; bu fonksiyon aynısını her gün yapar.)
 *
 * ÇALIŞTIRMA: pg_cron her gece çağırır (aşağıdaki SQL). Elle:
 *   curl -X POST "$URL/functions/v1/uyelik-denetle" -H "x-denetim: $DENETIM_ANAHTARI"
 *   Gövde {"kuru":true} → yalnız rapor, hiçbir şey silinmez.
 *
 * ⛔ DEĞİŞMEZ GÜVENLİK KURALI: ağ/kimlik/HTTP hatası ASLA silme sebebi değildir.
 *    YALNIZCA mağazanın NET cevabı silmeye yol açar:
 *      Apple  → signedTransactionInfo.revocationDate dolu
 *      Google → purchaseState=1 ya da HTTP 410
 *    Diğer her şey "bilinmiyor" olarak loglanır, kayda DOKUNULMAZ. Yanlışlıkla ödeme yapmış
 *    kullanıcının erişimini kapatmak, iade alan birine bedava içerik vermekten daha kötüdür.
 *
 * ABONELİKLER (22 Eyl 2026'da eklendi): eskiden "bitis ile düşer" denip HİÇ sorulmuyordu. Ama iade
 * alan abonenin parası anında geri gider, `bitis` ise aylar sonrasıdır → aradaki sürede bedava kalır.
 * (Gerçek vaka: Melike E. K., yıllık aboneliği 20 Eyl'de iade aldı, denetçi gördü ama kuralı gereği
 *  dokunmadı, elle kapatıldı.) Artık abonelikler de sorgulanıyor.
 *
 * ⚠️ ABONELİKTE EN KRİTİK AYRIM — İADE ≠ YENİLEMEYİ İPTAL:
 *   SUBSCRIPTION_STATE_CANCELED  → otomatik yenileme kapalı, PARASI ÖDENMİŞ süre DEVAM EDİYOR → DOKUNMA
 *   Apple revocationDate / Google voidedpurchases → para geri gitmiş → KAPAT
 * Bu ayrım yapılmazsa yenilemeyi kapatan (şu an 7 kişi) ödeyen müşterinin erişimi kesilir.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-denetim',
};

const PAKET_ANDROID = 'app.mevzujsps.android';
const BUNDLE_IOS = 'app.mevzujsps.ios';
const APPLE_HOSTLAR = [
  'https://api.storekit.itunes.apple.com',
  'https://api.storekit-sandbox.itunes.apple.com',
];

// ---- ortak yardımcılar (dogrula-satinalma ile aynı mantık) ----
function b64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlCoz(s: string): Uint8Array {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}
function pemToDer(pem: string): Uint8Array {
  const govde = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  return Uint8Array.from(atob(govde), (c) => c.charCodeAt(0));
}
function jwsPayload(jws: string): Record<string, unknown> | null {
  const p = String(jws).split('.');
  if (p.length < 2) return null;
  try {
    return JSON.parse(new TextDecoder().decode(b64urlCoz(p[1])));
  } catch {
    return null;
  }
}

let googleTokenCache: { token: string; bitis: number } | null = null;
async function googleToken(): Promise<string> {
  if (googleTokenCache && googleTokenCache.bitis > Date.now() + 60_000) return googleTokenCache.token;
  const sa = JSON.parse(Deno.env.get('GOOGLE_SA') ?? '{}');
  if (!sa.client_email || !sa.private_key) throw new Error('GOOGLE_SA eksik');
  const simdi = Math.floor(Date.now() / 1000);
  const header = b64url(new TextEncoder().encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const claim = b64url(new TextEncoder().encode(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token',
    iat: simdi,
    exp: simdi + 3600,
  })));
  const imzalanacak = `${header}.${claim}`;
  const key = await crypto.subtle.importKey('pkcs8', pemToDer(sa.private_key), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const imza = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(imzalanacak));
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${imzalanacak}.${b64url(imza)}` }),
  });
  const v = await r.json();
  if (!v.access_token) throw new Error('Google token alınamadı');
  googleTokenCache = { token: v.access_token, bitis: Date.now() + (v.expires_in ?? 3600) * 1000 };
  return v.access_token;
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

type Sonuc = { durum: 'GECERLI' | 'IPTAL' | 'BILINMIYOR' | 'SURE_DOLDU'; not: string };

/** Apple: iade edilmiş mi? Saklanan belirteç ZATEN işlem numarası (JWS de olabilir). */
async function appleDurum(token: string): Promise<Sonuc> {
  const ham = String(token || '');
  const sayisal = /^\d+$/.test(ham);
  const g = sayisal ? null : jwsPayload(ham);
  const txId = sayisal ? ham : String(g?.transactionId ?? g?.originalTransactionId ?? '');
  if (!txId) return { durum: 'BILINMIYOR', not: 'işlem numarası okunamadı' };
  const jwt = await appleJwt();
  for (const host of APPLE_HOSTLAR) {
    const r = await fetch(`${host}/inApps/v1/transactions/${txId}`, { headers: { Authorization: `Bearer ${jwt}` } });
    if (!r.ok) continue; // 404 → diğer host (sandbox); başka hata → sonraki
    const d = await r.json();
    const bilgi = jwsPayload(String(d?.signedTransactionInfo ?? ''));
    if (!bilgi) return { durum: 'BILINMIYOR', not: 'gövde çözülemedi' };
    if (bilgi.revocationDate) {
      return { durum: 'IPTAL', not: `Apple iade ${new Date(Number(bilgi.revocationDate)).toISOString().slice(0, 10)}` };
    }
    return { durum: 'GECERLI', not: String(bilgi.type ?? 'ok') };
  }
  return { durum: 'BILINMIYOR', not: 'Apple yanıt vermedi' };
}

/**
 * ⛔ APPLE ABONELİĞİ: ESKİ İŞLEME DEĞİL, ABONELİĞİN GÜNCEL DURUMUNA BAK (22 Eyl 2026).
 *
 * Apple'da `originalTransactionId` abonelik boyunca AYNI kalır — kullanıcı iade alıp sonra
 * YENİDEN satın alsa bile. Biz o numarayı sakladığımız için, tek tek işleme bakan denetim
 * sonsuza kadar "bu iade edilmiş" der ve yeni parasını ödemiş müşteriyi keser.
 *
 * GERÇEK VAKA: Melike E. K. 10 Eyl'de yıllık aldı → 20 Eyl'de iade etti → erişimi kapatıldı →
 * 22 Eyl 10:29'da YENİDEN SATIN ALDI (2027'ye kadar geçerli). Kayıtlı numara hâlâ eski, iade
 * edilmiş işlemi gösteriyordu; o geceki denetim erişimini tekrar silecekti. Kuru çalıştırmada
 * yakalandı: `IPTAL 1 — Apple iade 2026-09-20`.
 *
 * DOĞRU ÖLÇÜT: aboneliğin EN SON işlemi. En son işlem geri alınmışsa → iade. Değilse ve süresi
 * ileride ise → geçerli. (`status` alanına BAKMA: iade alan Melike'de bile 1/aktif dönüyordu.)
 */
async function appleAbonelikDurum(orijinalTx: string): Promise<Sonuc> {
  const jwt = await appleJwt();
  for (const host of APPLE_HOSTLAR) {
    const r = await fetch(`${host}/inApps/v1/subscriptions/${orijinalTx}`, { headers: { Authorization: `Bearer ${jwt}` } });
    if (!r.ok) continue;
    const d = await r.json();
    let enYeni: Record<string, unknown> | null = null;
    for (const grup of d?.data ?? []) {
      for (const t of grup?.lastTransactions ?? []) {
        const bilgi = jwsPayload(String(t?.signedTransactionInfo ?? ''));
        if (!bilgi) continue;
        if (!enYeni || Number(bilgi.purchaseDate ?? 0) > Number(enYeni.purchaseDate ?? 0)) enYeni = bilgi;
      }
    }
    if (!enYeni) return { durum: 'BILINMIYOR', not: 'abonelik işlemi okunamadı' };
    if (enYeni.revocationDate) {
      return { durum: 'IPTAL', not: `Apple iade ${new Date(Number(enYeni.revocationDate)).toISOString().slice(0, 10)}` };
    }
    const bitis = Number(enYeni.expiresDate ?? 0);
    if (bitis && bitis < Date.now()) return { durum: 'SURE_DOLDU', not: 'abonelik süresi doldu' };
    return { durum: 'GECERLI', not: `abonelik geçerli (bitis ${new Date(bitis).toISOString().slice(0, 10)})` };
  }
  return { durum: 'BILINMIYOR', not: 'Apple yanıt vermedi' };
}

/** Google tek seferlik ürün: purchaseState 0=alındı 1=iptal 2=beklemede */
async function googleUrunDurum(urun: string, token: string): Promise<Sonuc> {
  const tok = await googleToken();
  const u = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PAKET_ANDROID}/purchases/products/${urun}/tokens/${encodeURIComponent(token)}`;
  const r = await fetch(u, { headers: { Authorization: `Bearer ${tok}` } });
  if (r.status === 410) return { durum: 'IPTAL', not: 'Google 410 (iade)' };
  if (!r.ok) return { durum: 'BILINMIYOR', not: `HTTP ${r.status}` };
  const j = await r.json();
  if (j.purchaseState === 1) return { durum: 'IPTAL', not: 'purchaseState=1' };
  if (j.purchaseState === 2) return { durum: 'BILINMIYOR', not: 'purchaseState=2 (beklemede)' };
  return { durum: 'GECERLI', not: 'purchaseState=0' };
}

/** Google abonelik: iade edilmiş mi? CANCELED (yenileme kapalı) İPTAL SAYILMAZ. */
async function googleAbonelikDurum(token: string): Promise<Sonuc> {
  const tok = await googleToken();
  const u = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PAKET_ANDROID}/purchases/subscriptionsv2/tokens/${encodeURIComponent(token)}`;
  const r = await fetch(u, { headers: { Authorization: `Bearer ${tok}` } });
  if (r.status === 410) return { durum: 'IPTAL', not: 'Google 410 (iade)' };
  if (!r.ok) return { durum: 'BILINMIYOR', not: `HTTP ${r.status}` };
  const j = await r.json();
  const durum = String(j.subscriptionState ?? '');
  const bitis = j.lineItems?.[j.lineItems.length - 1]?.expiryTime ?? null;
  const sureVar = !!bitis && new Date(bitis).getTime() > Date.now();
  // İade, Google'da ayrı bir uçta durur (voidedpurchases). subscriptionState iadeyi göstermez.
  if (durum === 'SUBSCRIPTION_STATE_EXPIRED' && !sureVar) return { durum: 'SURE_DOLDU', not: 'süresi doldu' };
  if (durum === 'SUBSCRIPTION_STATE_CANCELED') {
    return sureVar
      ? { durum: 'GECERLI', not: 'yenileme kapalı, süresi devam ediyor' }
      : { durum: 'SURE_DOLDU', not: 'iptal + süresi doldu' };
  }
  return { durum: 'GECERLI', not: durum || 'ok' };
}

/** Google'ın iade/geri alma listesi — tek çağrıda TÜM iadeler. Jeton eşleşmesi = net iade.
 *  Liste alınamazsa `saglik` hata metnini taşır: sessiz körlük olmasın diye özete yazılır. */
const iadeListesiSaglik = { durum: 'ok' as string };
async function googleIadeJetonlari(): Promise<Set<string>> {
  const kume = new Set<string>();
  try {
    const tok = await googleToken();
    // Google 30 GÜNDEN ESKİSİNİ KABUL ETMİYOR (400 "must be within [30] days of data") — daha uzun
    // istenirse liste komple boş döner ve iadeler SESSİZCE görünmez olur. 29 gün güvenli sınır;
    // denetçi her gece çalıştığı için fazlası gerekmiyor.
    const baslangic = Date.now() - 29 * 24 * 60 * 60 * 1000;
    let sayfa: string | null = null;
    for (let i = 0; i < 10; i++) {
      const u = new URL(`https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PAKET_ANDROID}/purchases/voidedpurchases`);
      u.searchParams.set('startTime', String(baslangic));
      u.searchParams.set('maxResults', '1000');
      if (sayfa) u.searchParams.set('token', sayfa);
      const r = await fetch(u, { headers: { Authorization: `Bearer ${tok}` } });
      if (!r.ok) { iadeListesiSaglik.durum = `HTTP ${r.status}`; break; }
      const j = await r.json();
      for (const v of j.voidedPurchases ?? []) if (v.purchaseToken) kume.add(String(v.purchaseToken));
      sayfa = j.tokenPagination?.nextPageToken ?? null;
      if (!sayfa) break;
    }
  } catch (e) {
    // liste alınamazsa iade bilgisi yok sayılır — ASLA silme sebebi olmaz, ama SESSİZ de kalmaz
    iadeListesiSaglik.durum = String(e).slice(0, 80);
  }
  return kume;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  // Yetki: yalnız cron / elle çağrı (gizli başlık). Kullanıcıya AÇIK DEĞİL.
  const anahtar = Deno.env.get('DENETIM_ANAHTARI');
  if (!anahtar || req.headers.get('x-denetim') !== anahtar) {
    return new Response(JSON.stringify({ hata: 'yetkisiz' }), { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }

  let kuru = false;
  let hizli = false;
  try {
    const g = await req.json();
    kuru = g?.kuru === true;
    hizli = g?.hizli === true;
  } catch { /* gövdesiz çağrı → normal mod */ }

  // HIZLI KİP (22 Eyl 2026): 15 dakikada bir çalışır, TEK Google çağrısıyla iade listesini çeker ve
  // yalnız eşleşen jetonları kapatır. Amaç "iade anında kesilsin" — Apple/Google bildirim adresleri
  // panelden kurulana kadar Android tarafı için anlık koruma sağlar. Kimseye tek tek sormaz,
  // dolayısıyla ucuzdur; tam denetim yine her gece yapılır.

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SERVICE_ROLE_KEY')!);
  const { data, error } = await db
    .from('uyelik_haklari')
    .select('user_id, urun, tip, platform, satin_alma_token')
    .not('satin_alma_token', 'is', null)
    .in('platform', ['ios', 'android']);
  if (error) {
    return new Response(JSON.stringify({ hata: error.message }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }

  const sayac: Record<string, number> = {};
  const kapatilan: { user_id: string; urun: string; platform: string; not: string }[] = [];
  // Google iade listesi bir kez çekilir (abonelik + tek seferlik hepsini kapsar).
  const iadeJetonlari = await googleIadeJetonlari();
  for (const s of data ?? []) {
    let sonuc: Sonuc;
    // Hızlı kipte mağazaya TEK TEK sorulmaz: yalnız iade listesiyle karşılaştırılır.
    if (hizli) {
      sonuc = iadeJetonlari.has(String(s.satin_alma_token))
        ? { durum: 'IPTAL', not: 'Google iade listesinde' }
        : { durum: 'GECERLI', not: 'hizli kip: iade listesinde yok' };
      sayac[sonuc.durum] = (sayac[sonuc.durum] ?? 0) + 1;
      if (sonuc.durum === 'IPTAL') {
        kapatilan.push({ user_id: s.user_id as string, urun: s.urun as string, platform: s.platform as string, not: sonuc.not });
        if (!kuru) await db.from('uyelik_haklari').delete().eq('user_id', s.user_id).eq('urun', s.urun);
      }
      continue;
    }
    try {
      // Mağaza ETİKETTEN DEĞİL JETON ŞEKLİNDEN seçilir (2 Eyl 2026): 9 iOS satın alması
      // 'android' etiketiyle kayıtlıydı, Google'a sorulup "bilinmiyor" diye geçiliyordu →
      // iade alsalar fark etmezdik. Apple işlem kimliği salt rakam; Google jetonu 144 karakter.
      const appleJeton = /^[0-9]{8,25}$/.test(String(s.satin_alma_token));
      const apple = s.platform === 'ios' || appleJeton;
      // Apple ABONELİĞİNDE tek işleme bakmak YANLIŞ (yukarıdaki açıklama) → abonelik durumu ucu.
      if (apple && s.tip === 'abonelik') sonuc = await appleAbonelikDurum(s.satin_alma_token as string);
      else if (apple) sonuc = await appleDurum(s.satin_alma_token as string);
      else if (iadeJetonlari.has(String(s.satin_alma_token))) sonuc = { durum: 'IPTAL', not: 'Google iade listesinde' };
      else if (s.tip === 'abonelik') sonuc = await googleAbonelikDurum(s.satin_alma_token as string);
      else sonuc = await googleUrunDurum(s.urun as string, s.satin_alma_token as string);
    } catch (e) {
      sonuc = { durum: 'BILINMIYOR', not: String(e).slice(0, 60) };
    }
    sayac[sonuc.durum] = (sayac[sonuc.durum] ?? 0) + 1;
    // SİLME YALNIZ NET İPTALDE (= para geri gitmiş). Abonelik de dahil — ama 'IPTAL' yalnızca
    // gerçek iadede üretilir; yenilemesini kapatan abone yukarıda 'GECERLI' döner, dokunulmaz.
    if (sonuc.durum === 'IPTAL') {
      kapatilan.push({ user_id: s.user_id as string, urun: s.urun as string, platform: s.platform as string, not: sonuc.not });
      if (!kuru) {
        await db.from('uyelik_haklari').delete().eq('user_id', s.user_id).eq('urun', s.urun);
      }
    }
  }

  const ozet = {
    tarih: new Date().toISOString(), kuru, hizli, denetlenen: data?.length ?? 0, sayac, kapatilan,
    google_iade_listesi: iadeListesiSaglik.durum, google_iade_sayisi: iadeJetonlari.size,
  };
  // Log tablosu varsa yaz (yoksa sessizce geç — denetim log yüzünden durmasın).
  await db.from('uyelik_denetim_log').insert({ ozet }).then(() => {}, () => {});

  // BAŞKANA HABER VER — yalnız gerçekten birinin erişimi kapatıldığında (sessiz günlerde susar).
  // Hata yutulur: bildirim gitmezse denetim yine de yapılmış sayılır.
  if (!kuru && kapatilan.length > 0) {
    try {
      const BASKAN = '98be2c62-4309-4960-9ef3-0a2e032d2f4a';
      const { data: adresler } = await db.from('push_token').select('token').eq('user_id', BASKAN);
      const isimler: string[] = [];
      for (const k of kapatilan) {
        const { data: kisi } = await db.from('profiles').select('ad, soyad').eq('id', k.user_id).maybeSingle();
        isimler.push([kisi?.ad, kisi?.soyad].filter(Boolean).join(' ') || k.user_id.slice(0, 8));
      }
      const govde = `${isimler.join(', ')} — iade aldığı için premium erişimi kapatıldı.`;
      const mesajlar = (adresler ?? [])
        .filter((a: { token: string }) => String(a.token).startsWith('ExponentPushToken'))
        .map((a: { token: string }) => ({ to: a.token, sound: 'default', priority: 'high', title: '💳 İade tespit edildi', body: govde }));
      if (mesajlar.length) {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mesajlar),
        });
      }
    } catch { /* bildirim gitmezse denetim yine de tamamdır */ }
  }

  return new Response(JSON.stringify(ozet), { headers: { ...CORS, 'Content-Type': 'application/json' } });
});
