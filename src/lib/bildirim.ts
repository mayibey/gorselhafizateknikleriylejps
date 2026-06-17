/**
 * Bildirim (içtima) altyapısı: ayar saklama (AsyncStorage) + lokal zamanlama (expo-notifications).
 * Günde 3 içtima: Sabah İçtiması (sabit saat) · Gece Eğitimi (sabit saat) · Fırsat Eğitimi
 * (gün içi rastgele, her planlamada yeniden). Backend YOK — tamamen lokal.
 *
 * NOT: expo-notifications web'de çalışmaz; Expo Go (SDK 53+) lokal bildirimde kısıtlıdır →
 * tam işlevsel test DEVELOPMENT BUILD ister. Tüm çağrılar web'de no-op + try/catch ile korunur.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export type BildirimAyar = {
  aktif: boolean;
  /** Sabah İçtiması saati (0-23). */
  sabahSaat: number;
  /** Gece Eğitimi saati (0-23). */
  geceSaat: number;
  /** Fırsat Eğitimi (gün içi rastgele) açık mı. */
  firsatAktif: boolean;
  /** Oturum başına hedef kart sayısı (günlük kuyruğu sınırlar). */
  gunlukKart: number;
};

export const VARSAYILAN_AYAR: BildirimAyar = {
  aktif: false,
  sabahSaat: 8,
  geceSaat: 21,
  firsatAktif: true,
  gunlukKart: 15,
};

const KEY = 'jsps.bildirim';

export async function getAyar(): Promise<BildirimAyar> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return VARSAYILAN_AYAR;
    return { ...VARSAYILAN_AYAR, ...(JSON.parse(raw) as Partial<BildirimAyar>) };
  } catch {
    return VARSAYILAN_AYAR;
  }
}

export async function setAyar(a: BildirimAyar): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(a));
  } catch {
    // sessiz geç (depolama hatası ayarı bozmasın)
  }
}

export type PlanSonuc = 'ok' | 'izin-yok' | 'web' | 'hata';

/**
 * v1'de DEVRE DIŞI: `expo-notifications` kaldırıldı (standalone Android'de Firebase
 * `FirebaseInitProvider` google-services.json olmadan başlangıçta çöküyordu — Sentry'den
 * önce). Ayar yine saklanır (getAyar/setAyar) ama bildirim planlanmaz. v2'de (gerçek
 * Firebase + onaylı build) geri eklenecek. Çağrı zararsız 'web' döner.
 */
export async function planla(ayar: BildirimAyar): Promise<PlanSonuc> {
  void ayar;
  return 'web';
}
