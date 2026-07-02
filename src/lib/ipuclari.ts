/**
 * İlk-kullanım ipuçları — bir ekran/öğe ilk kez açıldığında gösterilen bağlamsal ipucu
 * bir kez görülür, sonra bir daha çıkmaz. favori/son-aramalar deseni: tek anahtar, try/catch,
 * AsyncStorage (web+native kalıcı). Hesaba bağlı DEĞİL (cihaz-yerel; kullanıcı arayüz bilgisi).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = (ad: string) => `jsps.ipucu.${ad}`;

/** Bilinen ipucu anahtarları (yazım hatasına karşı tek yer). */
export type IpucuAd = 'kart-akisi' | 'sinav';

/** Bu ipucu daha önce görüldü mü? (hata → görülmemiş say → ipucu yine çıkar, zarar yok) */
export async function ipucuGoruldu(ad: IpucuAd): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY(ad))) === '1';
  } catch {
    return false;
  }
}

/** İpucuyu "görüldü" işaretle (bir daha çıkmaz). */
export async function ipucuIsaretle(ad: IpucuAd): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY(ad), '1');
  } catch {
    // sessiz geç (işaretlenemezse ipucu tekrar çıkar — kabul edilebilir)
  }
}

// --- Uygulama turu (ilk açılış tanıtımı) — TÜM kullanıcılar bir kez görür ---
const TANITIM_KEY = 'jsps.tanitim.tamam';

/** Uygulama turu daha önce tamamlandı/geçildi mi? (hata → tamamlanmamış say → tur yine çıkar) */
export async function tanitimTamamMi(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(TANITIM_KEY)) === '1';
  } catch {
    return false;
  }
}

/** Uygulama turunu "tamamlandı" işaretle (bir daha çıkmaz). */
export async function tanitimTamamla(): Promise<void> {
  try {
    await AsyncStorage.setItem(TANITIM_KEY, '1');
  } catch {
    // sessiz geç
  }
}
