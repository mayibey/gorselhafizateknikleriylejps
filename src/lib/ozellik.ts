/**
 * KİŞİYE ÖZEL ÖZELLİK BAYRAĞI — yeni arayüz denemeleri önce YALNIZ başkanın
 * cihazında açılır (9 Ağu 2026 kararı; oyun sürümündeki --taslak/--onayla düzeninin
 * arayüz karşılığı). Herkese giden OTA'da kod UYKUDA durur; sunucudaki harita
 * kimde açacağını söyler.
 *
 * Kaynak: `uygulama_ayar.ozellik_kisi` = JSON `{ "<user_id>": ["bayrak-adi", ...] }`.
 * Kayıt yoksa/okunamazsa/oturum yoksa bayrak KAPALI — davranış bugünküyle aynı.
 * ASLA hata fırlatmaz. ayarOku kendi önbelleğini kullanır (5 dk).
 */
import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { ayarOku } from '@/lib/uzak-ayar';

export async function kisiselOzellikAcikMi(ad: string): Promise<boolean> {
  try {
    if (!supabase) return false;
    const ham = (await ayarOku('ozellik_kisi'))?.trim();
    if (!ham) return false;
    const harita = JSON.parse(ham) as Record<string, string[]>;
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id;
    if (!uid) return false;
    const liste = harita[uid];
    return Array.isArray(liste) && liste.includes(ad);
  } catch {
    return false;
  }
}

/** Bileşen içinden: bayrak açık mı? İlk çizimde false, cevap gelince günceller. */
export function useKisiselOzellik(ad: string): boolean {
  const [acik, setAcik] = useState(false);
  useEffect(() => {
    let yasiyor = true;
    void kisiselOzellikAcikMi(ad).then((v) => {
      if (yasiyor) setAcik(v);
    });
    return () => {
      yasiyor = false;
    };
  }, [ad]);
  return acik;
}
