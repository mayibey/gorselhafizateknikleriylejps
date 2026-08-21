/**
 * "KULLANICI İŞİN ORTASINDA MI?" KAYDI (21 Ağu 2026, başkan: "kart dinlerken yapmasın
 * ama menüler arasında gezerken yenilesin").
 *
 * Anlık güncelleme (OTA self-reload) kullanıcının ekranını sıfırlar. Menüde gezerken
 * bunun bir zararı yok; ama sesli anlatım dinlerken, sınav çözerken veya oyun oynarken
 * kaldığı yer gider. Bu kayıt o farkı söyler.
 *
 * Kullanım: ilgili ekran/hook `useMesgul(kosul, 'ad')` çağırır. Koşul true olduğu sürece
 * kullanıcı meşgul sayılır; ekran kapanınca kayıt kendiliğinden silinir.
 *
 * BASİT TUTULDU: React state yok, abonelik yok — anlık güncelleme sadece `mesgulMu()`
 * diye soruyor. Yanlış tarafa düşerse (kayıt silinmemişse) en kötü ihtimalle güncelleme
 * bir tur gecikir; asla kullanıcının işini bozmaz.
 */
import { useEffect } from 'react';

const kayit = new Set<string>();

/** Şu an kullanıcının bölünmemesi gereken bir işi var mı? */
export function mesgulMu(): boolean {
  return kayit.size > 0;
}

/** Hangi işler açık (teşhis için). */
export function mesgulListesi(): string[] {
  return [...kayit];
}

/** Bileşen içinden: koşul açık olduğu sürece "meşgul" say. */
export function useMesgul(aktif: boolean, ad: string): void {
  useEffect(() => {
    if (!aktif) return;
    kayit.add(ad);
    return () => {
      kayit.delete(ad);
    };
  }, [aktif, ad]);
}
