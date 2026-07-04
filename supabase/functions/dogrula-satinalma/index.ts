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

// Bilinen ürünler (istemci sabitiyle BİREBİR — src/constants/urunler.ts). Bilinmeyen ürün reddedilir.
const URUNLER = new Set([
  'musterek_yillik', 'musterek_omurboyu',
  'brans_yillik', 'brans_omurboyu',
  'paket_yillik', 'paket_omurboyu', // müşterek + branş birlikte
  'musterek_omurboyu_yukseltme', 'brans_omurboyu_yukseltme', // yıllıktan ömür boyuna FARK fiyatı
]);

// Yükseltme ürünü şartı: o kategoride AKTİF yıllık abonelik olmalı — manipüle edilmiş bir istemci
// fark fiyatına düz ömür boyu alamasın. (Geri yüklemede aranmaz: hak bir kez doğrulandıysa kalıcı.)
const YUKSELTME_SARTI: Record<string, string[]> = {
  musterek_omurboyu_yukseltme: ['musterek_yillik', 'paket_yillik'],
  brans_omurboyu_yukseltme: ['brans_yillik', 'paket_yillik'],
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
  const { token, urun, tip } = await req.json().catch(() => ({}));
  if (!token || !urun || (tip !== 'abonelik' && tip !== 'omurboyu')) return hata('Eksik/geçersiz girdi', 400);
  if (!URUNLER.has(urun)) return hata('Bilinmeyen ürün', 400);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const log = async (durum: string, detay: string, ham: unknown) => {
    await admin.from('satin_alma_log').insert({
      user_id: user.id, urun, tip, token, durum, detay, ham_yanit: ham,
    }).then(() => {}, () => {});
  };

  try {
    // Aynı satın alma (token) başka bir hesaba bağlıysa reddet — bir makbuzun paylaşılarak
    // birden çok hesabı premium yapmasını önler (DB'deki partial-unique index ikinci savunma).
    const { data: baskaSahip } = await admin
      .from('uyelik_haklari')
      .select('user_id')
      .eq('satin_alma_token', token)
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
      // Onayla (acknowledgementState 0=onaylanmamış → 3 günde onaylanmazsa iade)
      if (p.acknowledgementState === 0) {
        await fetch(`${base}/purchases/products/${urun}/tokens/${token}:acknowledge`, {
          method: 'POST', headers: { Authorization: `Bearer ${gToken}`, 'Content-Type': 'application/json' }, body: '{}',
        });
      }
      await admin.from('uyelik_haklari').upsert({
        user_id: user.id, urun, tip: 'omurboyu', bitis: null, satin_alma_token: token, son_dogrulama: new Date().toISOString(),
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
    if (s.acknowledgementState === 'ACKNOWLEDGEMENT_STATE_PENDING') {
      await fetch(`${base}/purchases/subscriptions/${urun}/tokens/${token}:acknowledge`, {
        method: 'POST', headers: { Authorization: `Bearer ${gToken}`, 'Content-Type': 'application/json' }, body: '{}',
      }).catch(() => {});
    }
    await admin.from('uyelik_haklari').upsert({
      user_id: user.id, urun, tip: 'abonelik', bitis, satin_alma_token: token, son_dogrulama: new Date().toISOString(),
    });
    await log('dogrulandi', `abonelik bitis=${bitis}`, s);
    return new Response(JSON.stringify({ ok: true, premium: true, bitis }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
  } catch (e) {
    await log('hata', e instanceof Error ? e.message : String(e), null);
    return hata('Satın alma doğrulanamadı, tekrar dene', 500);
  }
});
