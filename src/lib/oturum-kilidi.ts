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

function rastgeleKimlik(): string {
  return (
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2) +
    Date.now().toString(36)
  );
}

/** Bu cihaz hesabı SAHİPLENİR (girişte çağrılır): yeni kimlik → cihaz + sunucu. Sessiz. */
export async function oturumSahiplen(): Promise<void> {
  if (!supabaseHazir || !supabase) return;
  try {
    const { data: u } = await supabase.auth.getUser();
    const id = u.user?.id;
    if (!id) return;
    const kimlik = rastgeleKimlik();
    await AsyncStorage.setItem(KEY, kimlik);
    await supabase.from('profiles').update({ aktif_oturum: kimlik }).eq('id', id);
  } catch {
    // sessiz — sonraki sahiplenme/kontrol toparlar
  }
}

/**
 * Bu cihazın oturumu hâlâ geçerli mi? false = başka cihaz sahiplenmiş (düşürülmeli).
 * Sunucuda sahip yoksa (özelliğe geçiş dönemi) bu cihaz sahiplenir ve geçerli sayılır.
 */
export async function oturumGecerliMi(): Promise<boolean> {
  if (!supabaseHazir || !supabase) return true;
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
