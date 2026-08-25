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
 * NOT: Abonelikler zaten `bitis` ile kendiliğinden düşüyor; bu fonksiyon onları SİLMEZ,
 * yalnız raporlar. Silme YALNIZ iade/iptal edilmiş satın almalar içindir.
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  // Yetki: yalnız cron / elle çağrı (gizli başlık). Kullanıcıya AÇIK DEĞİL.
  const anahtar = Deno.env.get('DENETIM_ANAHTARI');
  if (!anahtar || req.headers.get('x-denetim') !== anahtar) {
    return new Response(JSON.stringify({ hata: 'yetkisiz' }), { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }

  let kuru = false;
  try {
    const g = await req.json();
    kuru = g?.kuru === true;
  } catch { /* gövdesiz çağrı → normal mod */ }

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
  for (const s of data ?? []) {
    let sonuc: Sonuc;
    try {
      if (s.platform === 'ios') sonuc = await appleDurum(s.satin_alma_token as string);
      else if (s.tip === 'abonelik') sonuc = { durum: 'GECERLI', not: 'abonelik: bitis ile düşer' };
      else sonuc = await googleUrunDurum(s.urun as string, s.satin_alma_token as string);
    } catch (e) {
      sonuc = { durum: 'BILINMIYOR', not: String(e).slice(0, 60) };
    }
    sayac[sonuc.durum] = (sayac[sonuc.durum] ?? 0) + 1;
    // SİLME YALNIZ NET İPTALDE — ve abonelikte asla (o zaten bitis ile düşer).
    if (sonuc.durum === 'IPTAL' && s.tip !== 'abonelik') {
      kapatilan.push({ user_id: s.user_id as string, urun: s.urun as string, platform: s.platform as string, not: sonuc.not });
      if (!kuru) {
        await db.from('uyelik_haklari').delete().eq('user_id', s.user_id).eq('urun', s.urun);
      }
    }
  }

  const ozet = { tarih: new Date().toISOString(), kuru, denetlenen: data?.length ?? 0, sayac, kapatilan };
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
