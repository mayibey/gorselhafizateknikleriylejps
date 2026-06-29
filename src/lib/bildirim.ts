/**
 * Bildirim (içtima) altyapısı — GERÇEK lokal bildirim (expo-notifications) + ayar saklama.
 *
 * KALICI MİMARİ:
 *  - LOKAL bildirim (BU dosya): günlük hatırlatmalar (Sabah İçtiması / Gece Eğitimi / Fırsat
 *    Eğitimi). Sunucu GEREKMEZ — cihazın kendi zamanlayıcısı. ŞİMDİ aktif.
 *  - UZAK push (FCM, ileride): `uzakPushTokenAl()` Expo push token üretir → backend gelince
 *    Supabase'e yazılıp sunucudan (Expo Push API / FCM) gönderilir. v2.
 *
 * KURULUM (kalıcı çözüm): Android'de expo-notifications native Firebase ister →
 * `google-services.json` (app.json `android.googleServicesFile`) ZORUNLU. Bkz.
 * `docs/BILDIRIM_KURULUM.md`. Dosya yokken standalone build başlangıçta çöker (eski sorun);
 * google-services.json eklenince kalıcı çözülür. Web'de + dosyasız ortamda tüm çağrılar no-op.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export type BildirimAyar = {
  aktif: boolean;
  /** Sabah İçtiması saati (0-23). */
  sabahSaat: number;
  /** Sabah İçtiması dakikası (0-59). */
  sabahDakika: number;
  /** Gece Eğitimi saati (0-23). */
  geceSaat: number;
  /** Gece Eğitimi dakikası (0-59). */
  geceDakika: number;
  /** Fırsat Eğitimi (gün içi rastgele) açık mı. */
  firsatAktif: boolean;
  /** Oturum başına hedef kart sayısı (günlük kuyruğu sınırlar). */
  gunlukKart: number;
};

export const VARSAYILAN_AYAR: BildirimAyar = {
  aktif: true, // bildirim varsayılan AÇIK (kullanıcı Eğitim Planı'ndan kapatabilir)
  sabahSaat: 8,
  sabahDakika: 0,
  geceSaat: 21,
  geceDakika: 0,
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

const WEB = Platform.OS === 'web';

// Ön planda (uygulama açıkken) bildirim banner'ı göster (ses/badge yok). Modül yüklenince 1 kez.
if (!WEB) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/** Bildirim izni iste (Android 13+ POST_NOTIFICATIONS / iOS). granted döner. */
export async function izinIste(): Promise<boolean> {
  if (WEB) return false;
  try {
    const mevcut = await Notifications.getPermissionsAsync();
    if (mevcut.granted) return true;
    const istek = await Notifications.requestPermissionsAsync();
    return istek.granted;
  } catch {
    return false;
  }
}

// Günlük hatırlatma içerikleri (sınav-odaklı, kısa, motive edici).
const SABAH = { title: 'Günaydın 🎖️', body: 'Bugünün etüdü seni bekliyor — bir mevzi de bugün düşsün.' };
const GECE = { title: 'Gece eğitimi vakti', body: 'Bugün çalıştın mı? 5 dakika ayır, zayıf mevzilerini tekrar et.' };
const FIRSAT = { title: 'Fırsat eğitimi', body: 'Boş bir anın mı var? Bir madde tekrar et, sınava bir adım daha.' };

async function gunlukKur(saat: number, dakika: number, icerik: { title: string; body: string }) {
  await Notifications.scheduleNotificationAsync({
    content: { title: icerik.title, body: icerik.body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: saat,
      minute: dakika,
    },
  });
}

/**
 * Ayara göre günlük bildirimleri (yeniden) planlar. Önce HEPSİNİ iptal eder (temiz sayfa),
 * sonra aktifse izin alıp Sabah/Gece/Fırsat'ı kurar. Ayar değişince + uygulama açılışında çağrılır.
 */
export async function planla(ayar: BildirimAyar): Promise<PlanSonuc> {
  if (WEB) return 'web';
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!ayar.aktif) return 'ok'; // kapalı: hepsi iptal edildi, başarı (ekran "kapatıldı" der)

    const izin = await izinIste();
    if (!izin) return 'izin-yok';

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('gunluk', {
        name: 'Günlük Hatırlatmalar',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    await gunlukKur(ayar.sabahSaat, ayar.sabahDakika, SABAH);
    await gunlukKur(ayar.geceSaat, ayar.geceDakika, GECE);

    if (ayar.firsatAktif) {
      // Sabah+1 ile Gece-1 arası rastgele bir saat; her planlamada tazelenir.
      const alt = Math.min(ayar.sabahSaat + 1, 23);
      const ust = Math.max(ayar.geceSaat - 1, alt);
      const saat = ust > alt ? alt + Math.floor(Math.random() * (ust - alt)) : alt;
      await gunlukKur(saat, 30, FIRSAT);
    }
    return 'ok';
  } catch {
    return 'hata';
  }
}

/**
 * TEST: 5 saniye sonra bir bildirim düşürür → kurulumun çalıştığını anında doğrulamak için.
 * (Eğitim Planı'ndaki "Test bildirimi" butonu çağırır.)
 */
export async function testBildirimi(): Promise<PlanSonuc> {
  if (WEB) return 'web';
  try {
    if (!(await izinIste())) return 'izin-yok';
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('gunluk', {
        name: 'Günlük Hatırlatmalar',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Test bildirimi 🎖️', body: 'Bildirimler çalışıyor — içtimalar zamanında düşecek.' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, repeats: false },
    });
    return 'ok';
  } catch {
    return 'hata';
  }
}

/**
 * İLERİDE (v2 backend): Uzak push için Expo push token. Backend gelince Supabase'e yazılıp
 * sunucudan gönderilir. Şimdilik yalnız token üretir; gönderim YOK. Gerçek cihaz + izin gerek.
 */
export async function uzakPushTokenAl(): Promise<string | null> {
  if (WEB || !Device.isDevice) return null;
  try {
    if (!(await izinIste())) return null;
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return null;
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch {
    return null;
  }
}
