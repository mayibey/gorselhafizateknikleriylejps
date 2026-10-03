/**
 * TEK OTURUM kilidi — her hesap aynı anda TEK cihazda açık kalır (docs/v2/11).
 * Girişte cihaz benzersiz bir kimlik üretir → hem cihaza (AsyncStorage) hem hesaba
 * (profiles.aktif_oturum) yazar = SAHİPLENİR. Başka cihaz giriş yapınca kimlik değişir;
 * bu cihaz bir sonraki kontrolde (açılış / öne gelme) uyuşmazlığı görür → oturum düşürülür.
 * Okunamazsa (offline) FAIL-OPEN: düşürme yok (offline çalışma bozulmaz; içerik zaten imzalı).
 *
 * OTURUM KORUMA (3 Eki 2026, bayrak 'oturum-koruma' açıkken — bkz. lib/oturum-koruma.ts):
 *  - Sahiplenen Supabase oturum kimliği (session_id) de saklanır → açılışta geri yüklenen oturum
 *    (aynı session_id) yeni giriş sanılıp hesabı yeniden sahiplenmez.
 *  - Sahiplenme ve kontrol SIRAYLA çalışır: kontrol, yarım kalmış bir sahiplenmenin "sunucu yazıldı,
 *    cihaz henüz yazılmadı" anını görüp cihazı yanlışlıkla düşüremez.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { jwtOturumKimligi } from '@/lib/oturum-koruma';
import { supabase, supabaseHazir } from '@/lib/supabase';

const KEY = 'jsps.oturum.kimlik';
const KEY_SID = 'jsps.oturum.sid';

// Sahiplenme SÜRÜYOR bayrağı: girişte oturumSahiplen çalışırken (yerel↔sunucu arasında ağ
// penceresi) eşzamanlı bir oturumGecerliMi çağrısı GEÇİCİ uyuşmazlık görüp cihazı DÜŞÜRMESİN.
// (OAuth dönüşünde app 'active' olur → oturumGecerliMi ile SIGNED_IN sahiplenmesi yarışır.)
let sahipleniyor = false;

// Koruma açıkken sahiplenme/kontrol tek sırada çalışır (auth-context bayrağı okuyunca ayarlar).
let koruma = false;
let sira: Promise<unknown> = Promise.resolve();
export function oturumKilidiKoruma(acik: boolean): void {
  koruma = acik;
}
function sirayla<T>(is: () => Promise<T>): Promise<T> {
  if (!koruma) return is();
  const sonuc = sira.then(is, is);
  sira = sonuc.catch(() => undefined);
  return sonuc;
}

function rastgeleKimlik(): string {
  return (
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2) +
    Date.now().toString(36)
  );
}

/** Bu cihaz hesabı SAHİPLENİR (girişte çağrılır): yeni kimlik → ÖNCE sunucu, SONRA cihaz. Sessiz.
 * Sıra önemli: sunucu yazımı BAŞARISIZSA yerel kimliği değiştirme → sonraki kontrolde yanlış düşme olmaz.
 * oturumKimligi: sahiplenen Supabase oturumunun session_id'si (koruma açıkken saklanır). */
export function oturumSahiplen(oturumKimligi?: string | null): Promise<void> {
  if (!supabaseHazir || !supabase) return Promise.resolve();
  const sb = supabase;
  sahipleniyor = true;
  return sirayla(async () => {
    sahipleniyor = true;
    try {
      const { data: u } = await sb.auth.getUser();
      const id = u.user?.id;
      if (!id) return;
      const kimlik = rastgeleKimlik();
      const { error } = await sb.from('profiles').update({ aktif_oturum: kimlik }).eq('id', id);
      if (error) return; // sunucuya yazılamadı → yerel değişmesin (sahiplik sunucuyla tutarlı kalır)
      await AsyncStorage.setItem(KEY, kimlik);
      if (koruma) {
        if (oturumKimligi) await AsyncStorage.setItem(KEY_SID, oturumKimligi);
        else await AsyncStorage.removeItem(KEY_SID);
      }
    } catch {
      // sessiz — sonraki sahiplenme/kontrol toparlar
    } finally {
      sahipleniyor = false;
    }
  });
}

/**
 * Bu cihazın oturumu hâlâ geçerli mi? false = başka cihaz sahiplenmiş (düşürülmeli).
 * Sunucuda sahip yoksa (özelliğe geçiş dönemi) bu cihaz sahiplenir ve geçerli sayılır.
 */
export function oturumGecerliMi(): Promise<boolean> {
  if (!supabaseHazir || !supabase) return Promise.resolve(true);
  if (sahipleniyor) return Promise.resolve(true); // sahiplenme sürüyor → geçici uyuşmazlığı düşme sayma
  const sb = supabase;
  return sirayla(async () => {
    try {
      const { data: u } = await sb.auth.getUser();
      if (!u.user) return true; // oturum yok → konu dışı
      const { data, error } = await sb.from('profiles').select('aktif_oturum').single();
      if (error || !data) return true; // okunamadı (offline/hata) → fail-open
      const sunucu = (data.aktif_oturum as string | null) ?? null;
      if (!sunucu) {
        // henüz kimse sahiplenmemiş → bu cihaz sahiplensin. Koruma açıkken sıradaki iş olarak (bu iş onu
        // beklerse sıra kilitlenir); kapalıyken eskisi gibi bekleyerek.
        if (koruma) void oturumSahiplen(await mevcutOturumKimligi());
        else await oturumSahiplen();
        return true;
      }
      const yerel = await AsyncStorage.getItem(KEY);
      return sunucu === yerel;
    } catch {
      return true;
    }
  });
}

/** Cihazdaki mevcut Supabase oturumunun session_id'si (ağsız). */
async function mevcutOturumKimligi(): Promise<string | null> {
  try {
    const { data } = await supabase!.auth.getSession();
    return jwtOturumKimligi(data.session?.access_token);
  } catch {
    return null;
  }
}

/** Bu cihazın sahiplendiği oturumun session_id'si (yoksa null). */
export async function sahipOturumKimligi(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEY_SID);
  } catch {
    return null;
  }
}

/** Bu cihaz daha önce hesabı hiç sahiplendi mi (yerel kimlik var mı)? */
export async function yerelSahiplikVarMi(): Promise<boolean> {
  try {
    return !!(await AsyncStorage.getItem(KEY));
  } catch {
    return false;
  }
}

/** Çıkışta yerel sahiplik bilgisini temizle → bu cihazdaki bir sonraki giriş YENİ giriş sayılır. */
export async function yerelSahiplikTemizle(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([KEY, KEY_SID]);
  } catch {
    /* sessiz */
  }
}
