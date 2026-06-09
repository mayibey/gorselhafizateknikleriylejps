/**
 * Bildirim (içtima) altyapısı: ayar saklama (AsyncStorage) + lokal zamanlama (expo-notifications).
 * Günde 3 içtima: Sabah İçtiması (sabit saat) · Gece Eğitimi (sabit saat) · Fırsat Eğitimi
 * (gün içi rastgele, her planlamada yeniden). Backend YOK — tamamen lokal.
 *
 * NOT: expo-notifications web'de çalışmaz; Expo Go (SDK 53+) lokal bildirimde kısıtlıdır →
 * tam işlevsel test DEVELOPMENT BUILD ister. Tüm çağrılar web'de no-op + try/catch ile korunur.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

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

const ICTIMA = {
  sabah: { title: '📯 Sabah İçtiması', body: 'Birlik göreve! Bugünün mevzilerini güçlendir.' },
  gece: { title: '🌙 Gece Eğitimi', body: 'Gün bitmeden tekrar zamanı — mevzileri pekiştir.' },
  firsat: { title: '⚡ Fırsat Eğitimi', body: 'Boş anını değerlendir; kısa bir eğitim seni bekliyor.' },
};

/** Fırsat Eğitimi için bir sonraki rastgele zamana kalan saniye (bugün 11:00–18:00; geçtiyse yarın). */
function firsatSaniye(): number {
  const now = new Date();
  const hedef = new Date(now);
  const saat = 11 + Math.floor(Math.random() * 7); // 11..17
  hedef.setHours(saat, Math.floor(Math.random() * 60), 0, 0);
  let diff = (hedef.getTime() - now.getTime()) / 1000;
  if (diff < 60) diff += 24 * 3600; // saat geçtiyse yarına al
  return Math.round(diff);
}

export type PlanSonuc = 'ok' | 'izin-yok' | 'web' | 'hata';

/**
 * Mevcut planı iptal eder ve ayara göre yeniden planlar. İzin yoksa ister.
 * `aktif=false` ise sadece iptal eder. Web'de no-op ('web' döner).
 */
export async function planla(ayar: BildirimAyar): Promise<PlanSonuc> {
  if (Platform.OS === 'web') return 'web';
  try {
    const N = await import('expo-notifications');
    let izinli = (await N.getPermissionsAsync()).granted;
    if (!izinli) izinli = (await N.requestPermissionsAsync()).granted;
    if (!izinli) return 'izin-yok';

    if (Platform.OS === 'android') {
      await N.setNotificationChannelAsync('egitim', {
        name: 'Eğitim İçtiması',
        importance: N.AndroidImportance.DEFAULT,
      });
    }

    await N.cancelAllScheduledNotificationsAsync();
    if (!ayar.aktif) return 'ok';

    const data = { hedef: 'akis' };
    await N.scheduleNotificationAsync({
      content: { ...ICTIMA.sabah, data },
      trigger: { type: N.SchedulableTriggerInputTypes.DAILY, hour: ayar.sabahSaat, minute: 0 },
    });
    await N.scheduleNotificationAsync({
      content: { ...ICTIMA.gece, data },
      trigger: { type: N.SchedulableTriggerInputTypes.DAILY, hour: ayar.geceSaat, minute: 0 },
    });
    if (ayar.firsatAktif) {
      await N.scheduleNotificationAsync({
        content: { ...ICTIMA.firsat, data },
        trigger: {
          type: N.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: firsatSaniye(),
          repeats: false,
        },
      });
    }
    return 'ok';
  } catch {
    return 'hata';
  }
}
