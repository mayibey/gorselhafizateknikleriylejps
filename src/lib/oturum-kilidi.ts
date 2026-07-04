/**
 * TEK OTURUM kilidi — her hesap aynı anda TEK cihazda açık kalır (docs/v2/11).
 * Girişte cihaz benzersiz bir kimlik üretir → hem cihaza (AsyncStorage) hem hesaba
 * (profiles.aktif_oturum) yazar = SAHİPLENİR. Başka cihaz giriş yapınca kimlik değişir;
 * bu cihaz bir sonraki kontrolde (açılış / öne gelme) uyuşmazlığı görür → oturum düşürülür.
 * Okunamazsa (offline) FAIL-OPEN: düşürme yok (offline çalışma bozulmaz; içerik zaten imzalı).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase, supabaseHazir } from '@/lib/supabase';

const KEY = 'jsps.oturum.kimlik';

// Sahiplenme SÜRÜYOR bayrağı: girişte oturumSahiplen çalışırken (yerel↔sunucu arasında ağ
// penceresi) eşzamanlı bir oturumGecerliMi çağrısı GEÇİCİ uyuşmazlık görüp cihazı DÜŞÜRMESİN.
// (OAuth dönüşünde app 'active' olur → oturumGecerliMi ile SIGNED_IN sahiplenmesi yarışır.)
let sahipleniyor = false;

function rastgeleKimlik(): string {
  return (
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2) +
    Date.now().toString(36)
  );
}

/** Bu cihaz hesabı SAHİPLENİR (girişte çağrılır): yeni kimlik → ÖNCE sunucu, SONRA cihaz. Sessiz.
 * Sıra önemli: sunucu yazımı BAŞARISIZSA yerel kimliği değiştirme → sonraki kontrolde yanlış düşme olmaz. */
export async function oturumSahiplen(): Promise<void> {
  if (!supabaseHazir || !supabase) return;
  sahipleniyor = true;
  try {
    const { data: u } = await supabase.auth.getUser();
    const id = u.user?.id;
    if (!id) return;
    const kimlik = rastgeleKimlik();
    const { error } = await supabase.from('profiles').update({ aktif_oturum: kimlik }).eq('id', id);
    if (error) return; // sunucuya yazılamadı → yerel değişmesin (sahiplik sunucuyla tutarlı kalır)
    await AsyncStorage.setItem(KEY, kimlik);
  } catch {
    // sessiz — sonraki sahiplenme/kontrol toparlar
  } finally {
    sahipleniyor = false;
  }
}

/**
 * Bu cihazın oturumu hâlâ geçerli mi? false = başka cihaz sahiplenmiş (düşürülmeli).
 * Sunucuda sahip yoksa (özelliğe geçiş dönemi) bu cihaz sahiplenir ve geçerli sayılır.
 */
export async function oturumGecerliMi(): Promise<boolean> {
  if (!supabaseHazir || !supabase) return true;
  if (sahipleniyor) return true; // sahiplenme sürüyor → geçici uyuşmazlığı düşme sayma
  try {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return true; // oturum yok → konu dışı
    const { data, error } = await supabase.from('profiles').select('aktif_oturum').single();
    if (error || !data) return true; // okunamadı (offline/hata) → fail-open
    const sunucu = (data.aktif_oturum as string | null) ?? null;
    if (!sunucu) {
      await oturumSahiplen(); // henüz kimse sahiplenmemiş → bu cihaz sahiplensin
      return true;
    }
    const yerel = await AsyncStorage.getItem(KEY);
    return sunucu === yerel;
  } catch {
    return true;
  }
}
