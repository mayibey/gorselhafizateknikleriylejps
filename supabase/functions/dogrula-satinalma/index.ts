// Supabase Edge Function: dogrula-satinalma
// İstemci satın alma yapınca (expo-iap) purchase token'ı buraya yollar. Fonksiyon Google Play
// Developer API'ye sorup GERÇEKTEN ödendi mi doğrular → uyelik_haklari'na hak yazar + log tutar.
// Güvenlik: hak SUNUCUDA yazılır (istemci "premium=true" diyemez). service_role ile yazılır.
//
// İstek: POST { token, urun, tip:'abonelik'|'omurboyu' } + Authorization: Bearer <JWT>
// Gizli: GOOGLE_SA (servis hesabı JSON), SERVICE_ROLE_KEY. Paket: app.mevzujsps.android

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_KEY = Deno.env.get('SERVICE_ROLE_KEY')!;
const PAKET = 'app.mevzujsps.android';
const BUNDLE_IOS = 'app.mevzujsps.ios';
// App Store Server API: önce üretim, olmazsa sandbox (test satın almaları sandbox'ta doğrulanır).
const APPLE_HOSTLAR = [
  'https://api.storekit.itunes.apple.com',
  'https://api.storekit-sandbox.itunes.apple.com',
];

// TEK KAPSAM modeli (4 Tem): satılan 3 ürün + eski model ürünleri (geriye uyum — geçmiş
// satın almalar premium saymaya devam eder). Bilinmeyen ürün reddedilir.
const URUNLER = new Set([
  // satılan
  'musterek_yillik', 'musterek_omurboyu', 'musterek_omurboyu_yukseltme',
  // indirimli ömür boyu (ayrı Play ürünü; kod/ilk-giriş indirimiyle bu SKU satın alınır — tip: omurboyu)
  'musterek_omurboyu_i20', 'musterek_omurboyu_i30',
  // eski model (artık satılmaz ama tanınır)
  'brans_yillik', 'brans_omurboyu', 'brans_omurboyu_yukseltme',
  'paket_yillik', 'paket_omurboyu',
]);

// Yükseltme ürünü şartı: AKTİF yıllık abonelik olmalı — manipüle edilmiş bir istemci fark
// fiyatına düz ömür boyu alamasın. (Geri yüklemede aranmaz: hak bir kez doğrulandıysa kalıcı.)
// Tek kapsam: herhangi bir yıllık (yeni musterek_yillik ya da eski brans/paket) yeterli.
const AKTIF_YILLIK_URUNLER = ['musterek_yillik', 'brans_yillik', 'paket_yillik'];
const YUKSELTME_SARTI: Record<string, string[]> = {
  musterek_omurboyu_yukseltme: AKTIF_YILLIK_URUNLER,
  brans_omurboyu_yukseltme: AKTIF_YILLIK_URUNLER,
};

function hata(mesaj: string, kod: number, kodAdi?: string): Response {
  return new Response(JSON.stringify(kodAdi ? { hata: mesaj, kod: kodAdi } : { hata: mesaj }), {
    status: kod,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

// ---- Google servis hesabı → erişim belirteci (JWT RS256 imzala → token al) ----
function b64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToDer(pem: string): Uint8Array {
  const govde = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const ham = atob(govde);
  return Uint8Array.from(ham, (c) => c.charCodeAt(0));
}

let tokenCache: { token: string; bitis: number } | null = null;

async function googleToken(): Promise<string> {
  if (tokenCache && tokenCache.bitis > Date.now() + 60_000) return tokenCache.token;
  const sa = JSON.parse(Deno.env.get('GOOGLE_SA') ?? '{}');
  if (!sa.client_email || !sa.private_key) throw new Error('GOOGLE_SA gizli ayarı eksik/bozuk');

  const simdi = Math.floor(Date.now() / 1000);
  const header = b64url(new TextEncoder().encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const claim = b64url(
    new TextEncoder().encode(
      JSON.stringify({
        iss: sa.client_email,
        scope: 'https://www.googleapis.com/auth/androidpublisher',
        aud: 'https://oauth2.googleapis.com/token',
        iat: simdi,
        exp: simdi + 3600,
      }),
    ),
  );
  const imzalanacak = `${header}.${claim}`;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToDer(sa.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const imza = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(imzalanacak));
  const jwt = `${imzalanacak}.${b64url(imza)}`;

  const yanit = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const veri = await yanit.json();
  if (!veri.access_token) throw new Error(`Google token alınamadı: ${JSON.stringify(veri)}`);
  tokenCache = { token: veri.access_token, bitis: Date.now() + (veri.expires_in ?? 3600) * 1000 };
  return veri.access_token;
}

// ---- APPLE (StoreKit 2 / App Store Server API) ----
// İstemci purchaseToken'ı iOS'ta bir JWS'tir (Apple imzalı transaction). Güven zinciri:
// transactionId'yi JWS'ten çıkar → KENDİ imzaladığımız API JWT'siyle Apple'a sor → Apple'ın döndürdüğü
// imzalı transaction'ı (TLS + kendi kimliğimizle) GÜVEN → alanları doğrula. Sahte/başka-app token'ı
// Apple'da 404 ya da bundleId uyuşmazlığı verir.
class AppleRed extends Error {
  kod: number;
  kodAdi?: string;
  constructor(mesaj: string, kod: number, kodAdi?: string) {
    super(mesaj);
    this.kod = kod;
    this.kodAdi = kodAdi;
  }
}

function b64urlCoz(s: string): Uint8Array {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

// JWS/JWT payload'ını (imza DOĞRULAMADAN) çöz — yalnız Apple'a soracağımız transactionId için.
// Güven, Apple API yanıtından gelir; istemci token'ının payload'ına güvenilmez.
function jwsPayload(jws: string): Record<string, unknown> {
  const p = String(jws).split('.');
  if (p.length < 2) throw new AppleRed('Geçersiz satın alma belirteci', 402);
  return JSON.parse(new TextDecoder().decode(b64urlCoz(p[1])));
}

// App Store Server API için ES256 JWT (kendi kimliğimiz). Gizli: APPLE_IAP_* (başkan üretir).
async function appleJwt(): Promise<string> {
  const issuer = Deno.env.get('APPLE_IAP_ISSUER_ID');
  const keyId = Deno.env.get('APPLE_IAP_KEY_ID');
  const pem = Deno.env.get('APPLE_IAP_PRIVATE_KEY');
  if (!issuer || !keyId || !pem) throw new AppleRed('Apple doğrulama yapılandırılmamış', 500);
  const simdi = Math.floor(Date.now() / 1000);
  const header = b64url(new TextEncoder().encode(JSON.stringify({ alg: 'ES256', kid: keyId, typ: 'JWT' })));
  const claim = b64url(
    new TextEncoder().encode(
      JSON.stringify({ iss: issuer, iat: simdi, exp: simdi + 600, aud: 'appstoreconnect-v1', bid: BUNDLE_IOS }),
    ),
  );
  const imzalanacak = `${header}.${claim}`;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToDer(pem),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );
  const imza = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(imzalanacak));
  return `${imzalanacak}.${b64url(imza)}`;
}

// transactionId → Apple'ın imzalı transaction bilgisi (üretim, olmazsa sandbox).
async function appleTransactionBilgi(txId: string): Promise<Record<string, unknown> | null> {
  const jwt = await appleJwt();
  for (const host of APPLE_HOSTLAR) {
    const r = await fetch(`${host}/inApps/v1/transactions/${txId}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    if (r.ok) {
      const d = await r.json();
      if (d?.signedTransactionInfo) return jwsPayload(d.signedTransactionInfo as string);
      return null;
    }
    // 404 üretimde → sandbox transaction olabilir → sonraki host'u dene. Diğer hatalarda da dene.
  }
  return null;
}

// Apple satın almasını doğrula → { bitis } (abonelik bitiş ISO / omurboyu null). Reddi AppleRed atar.
async function appleDogrula(
  token: string,
  urun: string,
  tip: string,
  userId: string,
): Promise<{ bitis: string | null }> {
  const istemciTx = jwsPayload(token);
  const txId = String(istemciTx.transactionId ?? istemciTx.originalTransactionId ?? '');
  if (!txId) throw new AppleRed('İşlem kimliği okunamadı', 402);
  const bilgi = await appleTransactionBilgi(txId);
  if (!bilgi) throw new AppleRed('Satın alma Apple tarafında doğrulanamadı', 402);
  if (bilgi.bundleId !== BUNDLE_IOS) throw new AppleRed('Satın alma bu uygulamaya ait değil', 402);
  if (bilgi.productId !== urun) throw new AppleRed('Ürün uyuşmuyor', 402);
  if (bilgi.revocationDate) throw new AppleRed('Satın alma iptal edilmiş', 402);
  // Sahiplik: appAccountToken = satın alırken verilen kullanıcı UUID'si. Apple küçük harfe çevirir.
  const hesap = bilgi.appAccountToken ? String(bilgi.appAccountToken).toLowerCase() : '';
  if (hesap && hesap !== userId.toLowerCase()) {
    throw new AppleRed('Bu satın alma başka bir hesaba ait.', 403, 'baska_hesap');
  }
  const bitis =
    tip === 'abonelik' && typeof bilgi.expiresDate === 'number'
      ? new Date(bilgi.expiresDate).toISOString()
      : null;
  return { bitis };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return hata('Yöntem desteklenmiyor', 405);

  // 1) Kullanıcı doğrula
  const auth = req.headers.get('Authorization');
  if (!auth) return hata('Yetkisiz', 401);
  const kullanici = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } } });
  const { data: { user }, error: aHata } = await kullanici.auth.getUser();
  if (aHata || !user) return hata('Geçersiz oturum', 401);

  // 2) Girdi
  const { token, urun, tip, platform } = await req.json().catch(() => ({}));
  if (!token || !urun || (tip !== 'abonelik' && tip !== 'omurboyu')) return hata('Eksik/geçersiz girdi', 400);
  if (!URUNLER.has(urun)) return hata('Bilinmeyen ürün', 400);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const magaza = platform === 'ios' ? 'ios' : 'android'; // KAYIT PLATFORMU — iOS satışları 'android' yazılmasın (default 'android' idi).
  const log = async (durum: string, detay: string, ham: unknown) => {
    await admin.from('satin_alma_log').insert({
      user_id: user.id, urun, tip, token, durum, detay, ham_yanit: ham, platform: magaza,
    }).then(() => {}, () => {});
  };

  try {
    // KAYIT ANAHTARI: iOS istemci token'ı bir JWS'tir (5KB+, sertifika zinciriyle) → uyelik_haklari'nın
    // satin_alma_token BENZERSİZ indeksine SIĞMAZ (btree max 2704 byte → INSERT çöker, premium açılmaz).
    // Kısa+kalıcı originalTransactionId'yi anahtar yap (abonelik yenilemelerinde de aynı → paylaşım
    // kontrolü doğru çalışır). Android'de Google purchaseToken zaten kısa → aynen kullanılır.
    let kayitToken = token;
    if (platform === 'ios') {
      const p = jwsPayload(token);
      kayitToken = String(p.originalTransactionId ?? p.transactionId ?? token);
    }

    // Aynı satın alma (token) başka bir hesaba bağlıysa reddet — bir makbuzun paylaşılarak
    // birden çok hesabı premium yapmasını önler (DB'deki partial-unique index ikinci savunma).
    const { data: baskaSahip } = await admin
      .from('uyelik_haklari')
      .select('user_id')
      .eq('satin_alma_token', kayitToken)
      .neq('user_id', user.id)
      .limit(1)
      .maybeSingle();
    if (baskaSahip) {
      await log('reddedildi', 'token baska hesaba bagli', null);
      return hata(
        'Bu satın alma başka bir hesaba bağlı. Satın almayı yaptığın hesapla giriş yap.',
        409,
        'baska-hesap',
      );
    }

    // iOS: Apple/StoreKit doğrulaması (App Store Server API) — Google yolundan tamamen ayrı.
    // (Android ya da platform göndermeyen eski istemci → aşağıdaki Google akışı.) iOS'ta ayrı
    // "yükseltme" ürünü yok, yıllık→ömür boyu tam fiyat → YUKSELTME_SARTI iOS'ta çalışmaz.
    if (platform === 'ios') {
      const { bitis } = await appleDogrula(token, urun, tip, user.id);
      const { error: yazHata } = await admin.from('uyelik_haklari').upsert({
        user_id: user.id, urun, tip, bitis, satin_alma_token: kayitToken, son_dogrulama: new Date().toISOString(), platform: magaza,
      });
      // Hak yazılamazsa 'dogrulandi' YAZMA — sessiz başarısızlık premium'u açmaz (kök sebep buydu).
      if (yazHata) throw new Error('uyelik_haklari yazilamadi: ' + yazHata.message);
      await log('dogrulandi', `apple ${tip} bitis=${bitis}`, null);
      return new Response(JSON.stringify({ ok: true, premium: true, bitis }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Yükseltme ürünü: aktif yıllık abonelik ŞARTI (yalnız İLK doğrulamada; geri yüklemede aranmaz).
    const sart = YUKSELTME_SARTI[urun];
    if (sart) {
      const { data: mevcutHak } = await admin
        .from('uyelik_haklari')
        .select('urun')
        .eq('user_id', user.id)
        .eq('satin_alma_token', token)
        .limit(1)
        .maybeSingle();
      if (!mevcutHak) {
        const { data: aktifYillik } = await admin
          .from('uyelik_haklari')
          .select('urun, bitis')
          .eq('user_id', user.id)
          .in('urun', sart)
          .gt('bitis', new Date().toISOString())
          .limit(1)
          .maybeSingle();
        if (!aktifYillik) {
          await log('reddedildi', 'yukseltme sarti yok (aktif yillik gerekli)', null);
          return hata('Yükseltme için aktif bir yıllık üyelik gerekir.', 412, 'yukseltme-sart');
        }
      }
    }

    const gToken = await googleToken();
    const base = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PAKET}`;

    if (tip === 'omurboyu') {
      // Tek seferlik ürün doğrula
      const r = await fetch(`${base}/purchases/products/${urun}/tokens/${token}`, {
        headers: { Authorization: `Bearer ${gToken}` },
      });
      const p = await r.json();
      // purchaseState: 0=satın alındı, 1=iptal, 2=beklemede
      if (!r.ok || p.purchaseState !== 0) {
        await log('reddedildi', `purchaseState=${p.purchaseState} http=${r.status}`, p);
        return hata('Satın alma doğrulanamadı', 402);
      }
      // F6: Token gerçekten BU hesap için mi? Satın alırken obfuscatedAccountId=user.id gönderilir;
      // Google onu obfuscatedExternalAccountId olarak döndürür. Varsa ve uyuşmuyorsa → başka hesabın token'ı.
      if (p.obfuscatedExternalAccountId && p.obfuscatedExternalAccountId !== user.id) {
        await log('reddedildi', `hesap uyusmazligi ext=${p.obfuscatedExternalAccountId}`, p);
        return hata('Bu satın alma başka bir hesaba ait.', 403, 'baska_hesap');
      }
      // Onayla (acknowledgementState 0=onaylanmamış → 3 günde onaylanmazsa iade)
      if (p.acknowledgementState === 0) {
        await fetch(`${base}/purchases/products/${urun}/tokens/${token}:acknowledge`, {
          method: 'POST', headers: { Authorization: `Bearer ${gToken}`, 'Content-Type': 'application/json' }, body: '{}',
        });
      }
      await admin.from('uyelik_haklari').upsert({
        user_id: user.id, urun, tip: 'omurboyu', bitis: null, satin_alma_token: kayitToken, son_dogrulama: new Date().toISOString(), platform: magaza,
      });
      await log('dogrulandi', 'omurboyu', p);
      return new Response(JSON.stringify({ ok: true, premium: true }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    // Abonelik doğrula (subscriptions v2)
    const r = await fetch(`${base}/purchases/subscriptionsv2/tokens/${token}`, {
      headers: { Authorization: `Bearer ${gToken}` },
    });
    const s = await r.json();
    const aktif = s.subscriptionState === 'SUBSCRIPTION_STATE_ACTIVE' || s.subscriptionState === 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD';
    const bitis = s.lineItems?.[s.lineItems.length - 1]?.expiryTime ?? null;
    if (!r.ok || !aktif) {
      await log('reddedildi', `subState=${s.subscriptionState} http=${r.status}`, s);
      return hata('Abonelik aktif değil', 402);
    }
    // F6: Abonelik gerçekten BU hesap için mi (externalAccountIdentifiers.obfuscatedExternalAccountId)?
    const extId = s.externalAccountIdentifiers?.obfuscatedExternalAccountId;
    if (extId && extId !== user.id) {
      await log('reddedildi', `hesap uyusmazligi ext=${extId}`, s);
      return hata('Bu abonelik başka bir hesaba ait.', 403, 'baska_hesap');
    }
    if (s.acknowledgementState === 'ACKNOWLEDGEMENT_STATE_PENDING') {
      await fetch(`${base}/purchases/subscriptions/${urun}/tokens/${token}:acknowledge`, {
        method: 'POST', headers: { Authorization: `Bearer ${gToken}`, 'Content-Type': 'application/json' }, body: '{}',
      }).catch(() => {});
    }
    await admin.from('uyelik_haklari').upsert({
      user_id: user.id, urun, tip: 'abonelik', bitis, satin_alma_token: kayitToken, son_dogrulama: new Date().toISOString(), platform: magaza,
    });
    await log('dogrulandi', `abonelik bitis=${bitis}`, s);
    return new Response(JSON.stringify({ ok: true, premium: true, bitis }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
  } catch (e) {
    if (e instanceof AppleRed) {
      await log('reddedildi', 'apple: ' + e.message, null);
      return hata(e.message, e.kod, e.kodAdi);
    }
    await log('hata', e instanceof Error ? e.message : String(e), null);
    return hata('Satın alma doğrulanamadı, tekrar dene', 500);
  }
});
