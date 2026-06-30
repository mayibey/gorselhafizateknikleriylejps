// Supabase Edge Function: gorsel
// Giriş yapmış kullanıcıya kart görselini PİKSEL FİLİGRANLI verir (kullanıcı e-postası gömülü).
// Filigran SUNUCUDA basılır → cihaza zaten filigranlı gelir, temiz kopya hiç oluşmaz.
//
// İstek: GET ?yol=tck/tck_m1.webp  + Authorization: Bearer <JWT> + apikey
// Yöntem: storage'tan çek → magick boyut → resvg ile filigran katmanı (font'lu) → magick composite → webp.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  CompositeOperator,
  ImageMagick,
  initializeImageMagick,
  MagickFormat,
} from 'npm:@imagemagick/magick-wasm@0.0.30';
import { initWasm, Resvg } from 'npm:@resvg/resvg-wasm@2.6.2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_KEY = Deno.env.get('SERVICE_ROLE_KEY')!;
const BUCKET = 'icerik';
const FONT_URL = 'https://unpkg.com/@expo-google-fonts/inter@0.4.2/400Regular/Inter_400Regular.ttf';
const FONT_AILESI = 'Inter';

let magickHazir = false;
let resvgHazir = false;
let fontBytes: Uint8Array | null = null;

async function hazirla() {
  if (!magickHazir) {
    const w = await fetch('https://unpkg.com/@imagemagick/magick-wasm@0.0.30/dist/magick.wasm');
    await initializeImageMagick(new Uint8Array(await w.arrayBuffer()));
    magickHazir = true;
  }
  if (!resvgHazir) {
    await initWasm(fetch('https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm'));
    resvgHazir = true;
  }
  if (!fontBytes) {
    const fr = await fetch(FONT_URL);
    const fb = new Uint8Array(await fr.arrayBuffer());
    // TTF/OTF magic: 00010000 | 'OTTO' | 'true' | 'ttcf'  (yoksa geçersiz → at)
    const m = fb.length > 4 ? (fb[0] << 24) | (fb[1] << 16) | (fb[2] << 8) | fb[3] : 0;
    const gecerli = m === 0x00010000 || m === 0x4f54544f || m === 0x74727565 || m === 0x74746366;
    if (!gecerli) throw new Error(`font gecersiz (HTTP ${fr.status}, ${fb.length}B, magic ${m.toString(16)})`);
    fontBytes = fb;
  }
}

function xmlKac(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]!));
}

/** Yayılı + soluk + eğik filigran SVG'si (görsel boyutunda). */
function filigranSvg(w: number, h: number, metin: string): string {
  const t = xmlKac(metin);
  let elemanlar = '';
  for (let y = 26; y < h; y += 105) {
    for (let x = 4; x < w; x += 230) {
      // Beyaz dolgu + KOYU kenarlık (outline) → açık zeminde de görünür (KVKK gibi beyaz kartlarda
      // düz beyaz filigran kayboluyordu). paint-order=stroke: kenarlık yazının arkasında.
      elemanlar += `<text x="${x}" y="${y}" font-family="${FONT_AILESI}" font-size="13" fill="#ffffff" fill-opacity="0.34" stroke="#0B1F3A" stroke-width="0.7" stroke-opacity="0.24" paint-order="stroke" transform="rotate(-22 ${x} ${y})">${t}</text>`;
    }
  }
  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${elemanlar}</svg>`;
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
  const kullanici = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } } });
  const { data: { user }, error: aHata } = await kullanici.auth.getUser();
  if (aHata || !user) return hata('Geçersiz oturum', 401);

  const yol = new URL(req.url).searchParams.get('yol');
  if (!yol || yol.includes('..') || !/\.(webp|png|jpe?g)$/i.test(yol)) return hata('Geçersiz yol', 400);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: blob, error: iHata } = await admin.storage.from(BUCKET).download(yol);
  if (iHata || !blob) return hata('Görsel bulunamadı', 404);
  const girdi = new Uint8Array(await blob.arrayBuffer());

  try {
    await hazirla();
    const damga = user.email ?? user.id;
    let cikti: Uint8Array | null = null;

    ImageMagick.read(girdi, (img) => {
      // resvg ile filigran katmanı (PNG, görsel boyutunda, font'lu)
      const svg = filigranSvg(img.width, img.height, damga);
      const png = new Resvg(svg, {
        font: { fontBuffers: [fontBytes!], loadSystemFonts: false, defaultFontFamily: FONT_AILESI },
      }).render().asPng();

      // katmanı görselin üstüne bindir
      ImageMagick.read(png, (katman) => {
        img.composite(katman, CompositeOperator.Over);
      });
      img.write(MagickFormat.WebP, (data) => {
        cikti = data.slice();
      });
    });

    if (!cikti) return hata('İşlenemedi', 500);
    return new Response(cikti, {
      headers: { ...CORS, 'Content-Type': 'image/webp', 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    return hata(`islem: ${e instanceof Error ? e.message : String(e)}`, 500);
  }
});
