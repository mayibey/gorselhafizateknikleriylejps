/**
 * Geri bildirim gönderimi (Hata/Öneri Bildir → Formspree).
 * İZOLE: yalnız fetch + endpoint; DB/şema/çekirdek dokunmaz, lokal yazma yok.
 * Endpoint BOŞ ise demo modu (gerçek POST yok, başarı simüle). Doluysa gerçek POST.
 */

import { FORMSPREE_ENDPOINT } from '@/constants/config';

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
  if (FORMSPREE_ENDPOINT === '') {
    // Demo: endpoint yapılandırılmamış → akışı test edebilmek için başarı simüle.
    await new Promise((r) => setTimeout(r, 600));
    return;
  }

  const yanit = await fetch(FORMSPREE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(veri),
  });

  if (!yanit.ok) {
    throw new Error(`Formspree hata: ${yanit.status}`);
  }
}
