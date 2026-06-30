/**
 * Geri bildirim gönderimi. Öncelik: (1) Formspree (ayarlıysa) → (2) Supabase `geri_bildirim`
 * tablosu (gerçekten kaydedilir) → (3) hiçbiri yoksa DÜRÜST hata (SAHTE başarı YOK — yanıltıcı
 * davranış / mağaza red riski temizlendi).
 */

import { FORMSPREE_ENDPOINT } from '@/constants/config';

import { supabase } from './supabase';

export type GeriBildirimTip = 'hata' | 'oneri' | 'diger';

export type GeriBildirim = {
  tip: GeriBildirimTip;
  mesaj: string;
  card_id: number | null;
  madde_no: string;
  baslik: string;
  kanun: string;
  tarih: string;
  cihaz_kimlik: string;
};

/**
 * Geri bildirimi Formspree'ye gönderir.
 * - Endpoint boş → demo: kısa gecikme + başarı (gerçek ağ çağrısı yok).
 * - Endpoint dolu → JSON POST; non-2xx veya ağ hatası → throw (ekran yakalar).
 */
export async function gonderGeriBildirim(veri: GeriBildirim): Promise<void> {
  // 1) Formspree ayarlıysa oraya gönder.
  if (FORMSPREE_ENDPOINT !== '') {
    const yanit = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(veri),
    });
    if (!yanit.ok) throw new Error(`Formspree hata: ${yanit.status}`);
    return;
  }

  // 2) Supabase varsa geri_bildirim tablosuna GERÇEKTEN kaydet (docs/v2/05_geri_bildirim.sql).
  if (supabase) {
    const { error } = await supabase.from('geri_bildirim').insert({
      tip: veri.tip,
      mesaj: veri.mesaj,
      card_id: veri.card_id,
      madde_no: veri.madde_no,
      baslik: veri.baslik,
      kanun: veri.kanun,
    });
    if (error) throw new Error(error.message);
    return;
  }

  // 3) Hiçbiri yoksa SAHTE başarı YOK → dürüst hata (ekran "gönderilemedi" gösterir).
  throw new Error('Geri bildirim şu an gönderilemiyor.');
}
