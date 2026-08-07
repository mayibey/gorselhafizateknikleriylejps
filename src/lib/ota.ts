/**
 * OTA (EAS Update) — AÇILIŞTA UYGULA.
 *
 * SORUN (başkan, 7 Ağu 2026): OTA yayınladığımızda expo-updates varsayılan davranışı gereği
 * güncellemeyi arka planda indirir ama **bir sonraki açılışta** uygular. Yani yeni indiren ya da
 * uygulamayı açan kullanıcı yeni içeriği (örn. oyunları) İLK GİRİŞTE göremez; kapatıp tekrar
 * açması gerekir. Kimse bunu yapmıyor.
 *
 * ÇÖZÜM: açılışta güncelleme var mı bak; varsa indir ve `reloadAsync()` ile uygulamayı kendi
 * kendine yeniden başlat → kullanıcı ilk girişte güncel içeriği görür.
 *
 * ⚠️ SONSUZ DÖNGÜ KALKANI: indirme başarılı olup yeniden başlatma bir sebeple işe yaramazsa
 * (ya da aynı güncelleme tekrar "yeni" görünürse) uygulama her açılışta kendini yeniden başlatıp
 * kullanılamaz hale gelirdi. Bu yüzden AYNI güncelleme kimliği için en fazla 2 deneme yapılır;
 * sonrasında sessizce vazgeçilir ve uygulama normal açılır (güncelleme yine bir sonraki
 * açılışta uygulanır — yani en kötü ihtimalde ESKİ davranışa döneriz, kilitlenme olmaz).
 *
 * ⚠️ Geliştirme/Expo Go'da `Updates.isEnabled` false → hiçbir şey yapılmaz.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';

const ANAHTAR = 'mevzu_ota_deneme';
/** Kontrol bu süreyi aşarsa vazgeç — ağı yavaş/kapalı kullanıcıyı açılışta bekletmeyelim. */
const KONTROL_ZAMAN_ASIMI = 6000;
/** İndirme bu süreyi aşarsa vazgeç (güncelleme bir sonraki açılışta uygulanır). */
const INDIRME_ZAMAN_ASIMI = 40000;
/** Aynı güncelleme için en fazla kaç kez yeniden başlatma denenir. */
const AZAMI_DENEME = 2;

type Deneme = { id: string; sayi: number };

function zamanAsimi<T>(sozu: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    sozu,
    new Promise<null>((coz) => setTimeout(() => coz(null), ms)),
  ]).catch(() => null);
}

async function denemeOku(): Promise<Deneme | null> {
  try {
    const ham = await AsyncStorage.getItem(ANAHTAR);
    return ham ? (JSON.parse(ham) as Deneme) : null;
  } catch {
    return null;
  }
}

/**
 * Açılışta çağrılır.
 *
 * `onIndirmeBasladi` — güncelleme OLDUĞU anlaşılıp indirmeye geçilirken çağrılır; çağıran taraf
 * bu sinyalle "Güncelleniyor" ekranını gösterir. ⚠️ Bu geri çağırım ŞART: başarı durumunda
 * `reloadAsync()` uygulamayı yeniden başlattığı için fonksiyon HİÇ dönmez — dönüş değerini
 * beklersek bekleme ekranı asla görünmez (ilk yazımda bu hataya düşmüştüm).
 *
 * Dönüş: indirme denendi ama başarısız/güncelleme yoksa `false`. Hata fırlatmaz.
 */
export async function otaGuncellemeUygula(onIndirmeBasladi?: () => void): Promise<boolean> {
  if (__DEV__ || !Updates.isEnabled) return false;
  try {
    const sonuc = await zamanAsimi(Updates.checkForUpdateAsync(), KONTROL_ZAMAN_ASIMI);
    if (!sonuc?.isAvailable) return false;

    // Kimlik: manifest id. Yoksa döngü kalkanını kuramayız → güvenli tarafta kal, dokunma.
    const id = (sonuc.manifest as { id?: string } | undefined)?.id;
    if (!id) return false;

    const onceki = await denemeOku();
    const sayi = onceki?.id === id ? onceki.sayi : 0;
    if (sayi >= AZAMI_DENEME) return false;
    await AsyncStorage.setItem(ANAHTAR, JSON.stringify({ id, sayi: sayi + 1 }));

    onIndirmeBasladi?.();
    const indirme = await zamanAsimi(Updates.fetchUpdateAsync(), INDIRME_ZAMAN_ASIMI);
    if (!indirme?.isNew) return false;

    await Updates.reloadAsync();
    return true;
  } catch {
    return false;
  }
}
