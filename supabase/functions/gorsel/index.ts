// Supabase Edge Function: gorsel
// Giriş yapmış kullanıcıya kart görselini PİKSEL FİLİGRANLI verir (kullanıcı e-postası gömülü).
// → filigran client'ta değil sunucuda → cihaza zaten filigranlı gelir, temiz kopya hiç oluşmaz.
//
// İstek: GET ?yol=tck/tck_m1.webp   + Authorization: Bearer <kullanıcı JWT> + apikey
// Yanıt: image/webp (filigranlı baytlar). Hata: JSON + uygun kod.
//
// AŞAMA 1 (şu an): boru hattı — görseli storage'tan çek → ImageMagick'le aç → webp yaz → ver.
//   (Filigran AŞAMA 2'de eklenecek; önce WASM + magick'in Edge'de çalıştığını doğruluyoruz.)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  DrawableFillColor,
  DrawableFontPointSize,
  DrawableText,
  ImageMagick,
  initializeImageMagick,
  MagickColor,
  MagickFormat,
} from 'npm:@imagemagick/magick-wasm@0.0.30';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_KEY = Deno.env.get('SERVICE_ROLE_KEY')!;
const BUCKET = 'icerik';

// WASM bir kez yüklenir (cold start) — CDN'den bayt olarak.
let hazir = false;
async function magickHazirla() {
  if (!hazir) {
    const wasm = await fetch('https://unpkg.com/@imagemagick/magick-wasm@0.0.30/dist/magick.wasm');
    await initializeImageMagick(new Uint8Array(await wasm.arrayBuffer()));
    hazir = true;
  }
}

function hata(mesaj: string, kod: number): Response {
  return new Response(JSON.stringify({ hata: mesaj }), {
    status: kod,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const auth = req.headers.get('Authorization');
  if (!auth) return hata('Yetkisiz', 401);

  // Kullanıcı doğrula
  const kullanici = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } } });
  const { data: { user }, error: aHata } = await kullanici.auth.getUser();
  if (aHata || !user) return hata('Geçersiz oturum', 401);

  const yol = new URL(req.url).searchParams.get('yol');
  if (!yol || yol.includes('..') || !/\.(webp|png|jpe?g)$/i.test(yol)) return hata('Geçersiz yol', 400);

  // Orijinali indir (service_role)
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: blob, error: iHata } = await admin.storage.from(BUCKET).download(yol);
  if (iHata || !blob) return hata('Görsel bulunamadı', 404);
  const girdi = new Uint8Array(await blob.arrayBuffer());

  // ImageMagick: aç → (AŞAMA 2: filigran) → webp yaz
  try {
    await magickHazirla();
    const damga = user.email ?? user.id;
    let cikti: Uint8Array | null = null;
    ImageMagick.read(girdi, (img) => {
      // FİLİGRAN: kullanıcı e-postasını piksellere YAYILI + SOLUK bas (forensic).
      const renk = new MagickColor(255, 255, 255, 60); // soluk beyaz (~%24 opaklık)
      const drawables: unknown[] = [];
      for (let y = 28; y < img.height; y += 120) {
        for (let x = 8; x < img.width; x += 280) {
          drawables.push(new DrawableFillColor(renk));
          drawables.push(new DrawableFontPointSize(15));
          drawables.push(new DrawableText(x, y, damga));
        }
      }
      try {
        // deno-lint-ignore no-explicit-any
        img.draw(drawables as any);
      } catch {
        // font yoksa filigranı atla (görsel yine de işlenip döner) — AŞAMA: font yükle
      }
      img.write(MagickFormat.WebP, (data) => {
        cikti = data.slice();
      });
    });
    if (!cikti) return hata('İşlenemedi (boş çıktı)', 500);
    return new Response(cikti, {
      headers: { ...CORS, 'Content-Type': 'image/webp', 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    return hata(`magick: ${e instanceof Error ? e.message : String(e)}`, 500);
  }
});
