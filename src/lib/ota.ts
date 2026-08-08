/**
 * OTA (EAS Update) — AÇILIŞTA UYGULA.
 *
 * SORUN (başkan, 7 Ağu 2026): OTA yayınladığımızda expo-updates varsayılan davranışı gereği
 * güncellemeyi arka planda indirir ama **bir sonraki açılışta** uygular. Yani yeni indiren ya da
 * uygulamayı açan kullanıcı yeni içeriği (örn. oyunları) İLK GİRİŞTE göremez; kapatıp tekrar
 * açması gerekir. Kimse bunu yapmıyor.
 *
 * ÇÖZÜM: açılışta güncelleme var mı bak; varsa İNDİR ve kullanıcıya "Güncelleme hazır —
 * yeniden başlat" ekranını göster. Yeniden başlatmayı KULLANICI başlatır (düğme).
 * (Önce kendi kendine yeniden başlatıyordu; ekran siyah kalıyordu — başkan bildirdi, 8 Ağu.)
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
 * Açılışta çağrılır. Güncelleme varsa İNDİRİR ama uygulamayı KENDİ BAŞINA YENİDEN BAŞLATMAZ.
 *
 * 🔴 NEDEN OTOMATİK DEĞİL (başkan bildirdi, 8 Ağu 2026): `reloadAsync()` çağrıldığında ekran
 * SİYAH KALIYOR ve uygulama kapanmış gibi görünüyordu — React görünümü yıkılıp yeniden
 * kurulurken arada boş kare oluşuyor, kullanıcı "uygulama çöktü" sanıyor. Başkanın önerisi
 * doğru: indirme bitince kullanıcıya AÇIK bir ekran göster, kararı ona bırak.
 * Biz bir adım daha ekledik: ekranda bir düğme var, ona basınca yeniden başlatma bizim
 * tarafımızdan yapılıyor — kullanıcı uygulamayı elle kapatmak zorunda değil. Düğme bir
 * sebeple çalışmazsa ekranda "kapatıp aç" yazısı da duruyor.
 *
 * `onHazir` — güncelleme indi ve uygulanmaya hazır. Çağıran taraf kapatılamaz ekranı gösterir.
 * `onIndirmeBasladi` — indirme başladı (bekleme göstergesi için).
 *
 * Dönüş: indirme başarısız/güncelleme yoksa `false`, indirildi ve hazırsa `true`.
 */
export async function otaGuncellemeUygula(
  onIndirmeBasladi?: () => void,
  onHazir?: () => void,
): Promise<boolean> {
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

    // Yeniden başlatma BURADA yapılmaz — kullanıcı ekrandaki düğmeye basınca yapılır.
    onHazir?.();
    return true;
  } catch {
    return false;
  }
}

/**
 * İndirilmiş güncellemeyi uygular (uygulamayı yeniden başlatır). Yalnız kullanıcı düğmeye
 * basınca çağrılır. Başarısız olursa `false` döner → ekran "kapatıp açın" yazısına düşer.
 */
export async function otaYenidenBaslat(): Promise<boolean> {
  try {
    await Updates.reloadAsync();
    return true;
  } catch {
    return false;
  }
}
