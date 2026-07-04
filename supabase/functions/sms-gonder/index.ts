// Supabase Edge Function: sms-gonder — Auth "Send SMS hook" (telefon OTP → MasGSM/SenaGSM API).
// Supabase Auth, telefon doğrulama kodu üretince BU fonksiyonu çağırır (kullanıcı JWT'si YOK;
// güvenlik Standard Webhooks imzasıyla). Fonksiyon kodu MasGSM HTTP API'siyle SMS'e çevirir.
//
// AKTİVASYON (MasGSM hesabı hazır olunca — build GEREKMEZ):
//   1) supabase secrets: SMS_KULLANICI (web kullanıcı adı), SMS_SIFRE (API SECRET — web şifresi DEĞİL,
//      panel: Kullanıcı İşlemleri → Api Ayarları → Api Hesabı Oluştur), SMS_BASLIK (onaylı başlık,
//      max 11 karakter, büyük-küçük duyarlı), SMS_API_TABAN (örn. https://api.senagsm.com.tr).
//   2) Auth config: hook_send_sms_enabled=true, hook_send_sms_uri=bu fonksiyon,
//      external_phone_enabled=true (Management API'den yapılır).
//   3) SEND_SMS_HOOK_SECRET: hook oluşturulunca Supabase'in verdiği v1,whsec_... değeri.
//   4) uygulama_ayar.telefon_giris = '1' → uygulamada telefon seçeneği görünür.
//
// MasGSM tek-SMS GET ucu: /api/smsget/v1?username=..&password=..&header=..&gsm=..&message=..
// Dönüş: "00 <dlrId>" başarı; diğer 2 haneli kodlar hata (87 kullanıcı/şifre, 85 başlık, 81 kredi).

import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';

const HATA_KODLARI: Record<string, string> = {
  '87': 'SMS API kullanici adi/sifresi hatali',
  '85': 'SMS basligi (header) bulunamadi/onaysiz',
  '81': 'SMS kredisi yetersiz',
  '77': 'Ayni SMS 2 dk icinde tekrar gonderilemez',
  '83': 'Bos SMS / gecersiz numara (kara liste olabilir)',
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('yalnizca POST', { status: 405 });

  const kullanici = Deno.env.get('SMS_KULLANICI');
  const sifre = Deno.env.get('SMS_SIFRE');
  const baslik = Deno.env.get('SMS_BASLIK');
  const taban = Deno.env.get('SMS_API_TABAN') ?? 'https://api.senagsm.com.tr';
  const hookSecret = (Deno.env.get('SEND_SMS_HOOK_SECRET') ?? '').replace('v1,whsec_', '');
  if (!kullanici || !sifre || !baslik || !hookSecret) {
    return new Response(JSON.stringify({ error: 'SMS ayarlari eksik (secrets girilmedi)' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 1) Supabase Auth webhook imzasını DOĞRULA (sahte istek SMS attıramasın).
    const govde = await req.text();
    const wh = new Webhook(hookSecret);
    const veri = wh.verify(govde, Object.fromEntries(req.headers)) as {
      user?: { phone?: string };
      sms?: { otp?: string };
    };
    const telefon = (veri.user?.phone ?? '').replace(/^\+/, ''); // E.164 → 905xxxxxxxxx
    const otp = veri.sms?.otp ?? '';
    if (!telefon || !otp) {
      return new Response(JSON.stringify({ error: 'telefon/otp eksik' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2) MasGSM/SenaGSM tek-SMS GET ucu ile gönder (ASCII metin — SMS karakter maliyeti).
    const mesaj = `MEVZU JSPS dogrulama kodun: ${otp}`;
    const url =
      `${taban}/api/smsget/v1?username=${encodeURIComponent(kullanici)}` +
      `&password=${encodeURIComponent(sifre)}&header=${encodeURIComponent(baslik)}` +
      `&gsm=${encodeURIComponent(telefon)}&message=${encodeURIComponent(mesaj)}`;
    const yanit = await fetch(url);
    const metin = (await yanit.text()).trim();

    if (!metin.startsWith('00')) {
      const aciklama = HATA_KODLARI[metin.slice(0, 2)] ?? `SMS API hata kodu: ${metin}`;
      return new Response(JSON.stringify({ error: aciklama }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // Başarı — Supabase Auth 200 + boş JSON bekler.
    return new Response(JSON.stringify({}), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'imza/istek hatasi' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
