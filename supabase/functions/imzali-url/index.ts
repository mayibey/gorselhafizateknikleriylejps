// Supabase Edge Function: imzali-url
// İçerik bucket'ı PRIVATE olunca, giriş yapmış kullanıcıya kısa-ömürlü imzalı indirme URL'leri verir.
// → public scraping biter; yalnız oturumu olan kullanıcı içerik çeker; URL'ler ~15 dk'da ölür.
//
// Deploy (kullanıcı):
//   supabase functions deploy imzali-url --project-ref vwmjrvolkbiofpkzzwef
// Secrets (Edge'de SUPABASE_URL + SUPABASE_ANON_KEY otomatik gelir; service key'i ekle):
//   supabase secrets set SERVICE_ROLE_KEY=eyJ...   (Settings → API → service_role)
// Bucket'ı PRIVATE yap: Storage → icerik → Settings → Public access KAPALI.
//
// İstek: POST { yollar: ["tck/tck_m1.webp", ...] }  + Authorization: Bearer <kullanıcı JWT>
// Yanıt: [{ path, signedUrl }]  (createSignedUrls çıktısı)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_KEY = Deno.env.get('SERVICE_ROLE_KEY')!;
const BUCKET = 'icerik';
const TTL_SN = 900; // 15 dk
const MAX_YOL = 400; // tek istekte üst sınır (büyük kanun bir çağrıda)
// KİLİT: FAIL-CLOSED — VARSAYILAN (secret ayarsız) premium kapısı AKTİF. Yalnız açıkça '0' ile kapanır
// (kapalı test icin bilerek). Eskiden `=== '1'` idi → secret unutulursa TÜM premium içerik açığa çıkıyordu
// (denetim EK-A). İstemci KILIT_AKTIF=true ile hizalı. Kapatmak için: supabase secrets set KILIT_AKTIF=0
const KILIT = Deno.env.get('KILIT_AKTIF') !== '0';
// 'oyun': oyun merkezi sayfası — premium DEĞİL. Kilit sayfanın İÇİNDE (ilk 2 bölüm/günde 2 tur);
// sayfanın kendisi herkese açılmalı, yoksa ücretsiz kullanıcı sunucudaki güncel oyunları hiç
// alamaz, sessizce uygulamaya gömülü eski sürümde kalırdı. Yeni bir sızıntı da değil: gömülü
// sürüm zaten aynı içeriği her kullanıcının cihazında taşıyor. (8 Ağu 2026)
const UCRETSIZ_KLASOR = ['tck', 'brtck', 'oyun']; // her zaman serbest klasörler (istemci UCRETSIZ ile hizalı)
const ucretsizMi = (yol: string) => UCRETSIZ_KLASOR.includes(yol.split('/')[0]);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return yanit({ hata: 'POST gerekli' }, 405);

  const auth = req.headers.get('Authorization');
  if (!auth) return yanit({ hata: 'Yetkisiz' }, 401);

  // 1) Kullanıcı JWT doğrula (yalnız gerçek oturum içerik URL'i alır)
  const kullaniciClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: auth } },
  });
  const { data: { user }, error: authHata } = await kullaniciClient.auth.getUser();
  if (authHata || !user) return yanit({ hata: 'Geçersiz oturum' }, 401);

  // 2) Yolları al
  let yollar: unknown;
  try {
    yollar = (await req.json())?.yollar;
  } catch {
    return yanit({ hata: 'Geçersiz gövde' }, 400);
  }
  if (!Array.isArray(yollar) || yollar.length === 0) return yanit({ hata: 'yollar gerekli' }, 400);
  if (yollar.length > MAX_YOL) return yanit({ hata: `En fazla ${MAX_YOL} yol` }, 400);
  const temiz = yollar.filter((y): y is string => typeof y === 'string' && !y.includes('..'));

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  // 3) PREMIUM KAPISI (yalnız kilit aktifken): ücretsiz olmayan içerik için hak kontrolü.
  //    → istemcideki paywall sunucuda karşılık bulur; ödeme duvarı fonksiyon çağrısıyla atlanamaz.
  if (KILIT && !temiz.every(ucretsizMi)) {
    const { data: pr } = await admin.rpc('premium_mi', { p_user: user.id });
    if (!pr) return yanit({ hata: 'Bu içerik için üyelik gerekli' }, 402);
  }

  // ADLİ İZ: hangi hesap, ne zaman, hangi (NAT) IP'den içerik URL'i istedi (fail-open).
  const istekIp = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || null;
  admin
    .from('icerik_erisim_log')
    .insert({
      user_id: user.id,
      yol: temiz[0] ?? null,
      ip: istekIp,
      ua: req.headers.get('user-agent'),
      kaynak: `imzali-url(${temiz.length})`,
    })
    .then(() => {}, () => {});

  // 4) service_role ile imzalı URL üret
  const { data, error } = await admin.storage.from(BUCKET).createSignedUrls(temiz, TTL_SN);
  if (error) {
    console.error('createSignedUrls', error.message);
    return yanit({ hata: 'İçerik hazırlanamadı' }, 500);
  }

  return yanit(data, 200);
});

function yanit(govde: unknown, kod: number): Response {
  return new Response(JSON.stringify(govde), {
    status: kod,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
