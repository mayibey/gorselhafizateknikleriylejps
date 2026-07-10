/**
 * Sesli anlatım/nöbet OYNARKEN EKRANI AÇIK TUT (kapanmasın). `aktif=true` iken ekran uyumaz;
 * `false` olunca ya da bileşen kalkınca serbest bırakılır (pil boşa gitmesin).
 *
 * Her ses kaynağı AYRI `tag` kullanır (kart sesi / sesli nöbet) → biri dururken diğeri çalıyorsa
 * ekran açık kalır (bağımsız sayaç). Kullanıcı önerisi (Zülküf): sesli kart dinlerken ekran
 * kapanmasın — YouTube/Udemy gibi. expo-keep-awake native modülü kullanır.
 */
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect } from 'react';

export function useEkranAcikTut(aktif: boolean, tag: string): void {
  useEffect(() => {
    if (!aktif) return;
    void activateKeepAwakeAsync(tag);
    return () => {
      void deactivateKeepAwake(tag);
    };
  }, [aktif, tag]);
}
