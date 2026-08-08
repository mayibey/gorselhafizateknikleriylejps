/**
 * OYUN MERKEZİ KAYNAĞI — oyun sayfasını SUNUCUDAN al, cihazda önbellekle, olmazsa gömülüye dön.
 *
 * NEDEN (başkan, 8 Ağu 2026): "Bu oyunları sunucuya alsak, değişiklikler anında yayınlanmaz mı?"
 * Doğru: oyun sayfası uygulamanın içinde 1,2 MB'lık bir metin olarak duruyor; her düzeltme için
 * OTA yayını (5 ayrı sürüme) gerekiyordu. Sunucudan gelince dosyayı değiştirmek yetiyor.
 *
 * ÜÇ KURAL (bunlar olmadan taşımak zarar eder):
 *  1. ÇEVRİMDIŞI BOZULMASIN — oyunlar bugün internetsiz çalışıyor. Sayfa bir kez indirilip
 *     cihazda tutulur; sonraki açılışlar dosyadan okur, internet gerekmez.
 *  2. HER ZAMAN BİR ŞEY OLSUN — sunucu, ağ, imza ya da dosya bozuksa GÖMÜLÜ sürüme dönülür.
 *     Yani en kötü ihtimalde bugünkü davranış. Kullanıcı asla boş ekran görmez.
 *  3. BOZUK DOSYA ÖNBELLEĞE YAZILMASIN — yarım inen ya da hata sayfası dönen içerik
 *     doğrulanmadan kaydedilirse kalıcı olarak bozuk oyun ekranı oluşur. `saglamMi()` bakar.
 *
 * Sürüm işaretçisi: `uygulama_ayar.oyun_surum`. Değeri dosya adının damgası (ör. "20260808-0130").
 * Boşsa/okunamazsa gömülü kullanılır → şalter gibi: sunucu tarafını tek satırla kapatabiliriz.
 */
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import { OYUN_MERKEZI_HTML } from '../assets/oyun-merkezi-html';
import { imzaliUrller } from '@/lib/imzali-url';
import { ayarOku } from '@/lib/uzak-ayar';

export type OyunKaynak = 'gomulu' | 'onbellek' | 'uzak';
export type OyunHtml = { html: string; kaynak: OyunKaynak; surum: string | null };

const KLASOR = FileSystem.documentDirectory ? `${FileSystem.documentDirectory}jsps/oyun/` : null;
/** ÜRETİLMİŞ oyun sayfasının imzaları. Yalnız "oyun sayfası mı" değil, "üreticiden geçmiş mi"
 *  diye bakılır: kaynak html yanlışlıkla yayınlanırsa köprü (hazır mesajı/kayıt taşıma) ve
 *  TEST_MODU=false olmaz → ekran "Oyunlar hazırlanıyor"da takılır ve kilitler devre dışı kalır.
 *  8 Ağu 2026'da tam bu oldu; artık istemci de kabul etmiyor, gömülüye döner. */
const IMZALAR = ['OYUNLAR', 'mevzuKopru', "tip:'hazir'", 'let TEST_MODU = false'];
const ASGARI_HANE = 200_000;
/** İlk indirme için beklenecek azami süre; aşılırsa gömülüyle açılır, indirme arka planda sürer. */
const BEKLEME_MS = 5000;

function saglamMi(metin: string): boolean {
  return (
    typeof metin === 'string' &&
    metin.length >= ASGARI_HANE &&
    IMZALAR.every((x) => metin.includes(x))
  );
}

function yol(surum: string): string {
  return `${KLASOR}oyun-${surum}.html`;
}

/** Eski sürümlerin önbelleğini siler (disk şişmesin). Hata yutulur. */
async function eskileriSil(guncelSurum: string): Promise<void> {
  if (!KLASOR) return;
  try {
    const hepsi = await FileSystem.readDirectoryAsync(KLASOR);
    await Promise.all(
      hepsi
        .filter((d) => d.startsWith('oyun-') && d !== `oyun-${guncelSurum}.html`)
        .map((d) => FileSystem.deleteAsync(KLASOR + d, { idempotent: true }).catch(() => {})),
    );
  } catch {
    /* sessiz */
  }
}

/**
 * Oyun sayfasını çözer. ASLA hata fırlatmaz — en kötü durumda gömülü sürümü döner.
 * `zorlaTazele` true ise önbellek atlanır (yönetim/hata ayıklama için).
 */
export async function oyunHtmlGetir(zorlaTazele = false): Promise<OyunHtml> {
  const gomulu: OyunHtml = { html: OYUN_MERKEZI_HTML, kaynak: 'gomulu', surum: null };
  if (Platform.OS === 'web' || !KLASOR) return gomulu;

  let surum: string | null = null;
  try {
    surum = (await ayarOku('oyun_surum'))?.trim() || null;
  } catch {
    return gomulu;
  }
  if (!surum) return gomulu; // sunucu tarafı kapalı → bugünkü davranış

  // 1) Önbellek
  if (!zorlaTazele) {
    try {
      const bilgi = await FileSystem.getInfoAsync(yol(surum));
      if (bilgi.exists) {
        const metin = await FileSystem.readAsStringAsync(yol(surum));
        if (saglamMi(metin)) return { html: metin, kaynak: 'onbellek', surum };
        await FileSystem.deleteAsync(yol(surum), { idempotent: true }).catch(() => {});
      }
    } catch {
      /* önbellek okunamadı → indirmeyi dene */
    }
  }

  // 2) Sunucudan indir — AMA KULLANICIYI BEKLETMEDEN.
  // Sayfa ~1 MB; yavaş bağlantıda indirmeyi beklemek Oyunlar sekmesini dakikalarca açtırmaz.
  // Bu yüzden indirme bir süre sınırıyla yarıştırılır: zamanında gelirse o gösterilir,
  // gelmezse GÖMÜLÜ sürümle hemen açılır ve indirme ARKA PLANDA sürer → dosya önbelleğe
  // yazılır, bir sonraki açılışta güncel sürüm anında gelir. Yani kullanıcı hiç beklemez,
  // güncelleme en geç bir sonraki açılışta yerine oturur.
  const indirme = (async (): Promise<OyunHtml | null> => {
    const anahtar = `oyun/oyun-merkezi-${surum}.html`;
    const imzali = await imzaliUrller([anahtar]);
    const url = imzali.get(anahtar);
    if (!url) return null;
    const c = await fetch(url);
    if (!c.ok) return null;
    const metin = await c.text();
    if (!saglamMi(metin)) return null; // yarım/bozuk → yazma, gömülüye dön
    await FileSystem.makeDirectoryAsync(KLASOR, { intermediates: true }).catch(() => {});
    await FileSystem.writeAsStringAsync(yol(surum), metin);
    void eskileriSil(surum);
    return { html: metin, kaynak: 'uzak', surum };
  })().catch(() => null);

  const zamanAsimi = new Promise<null>((coz) => setTimeout(() => coz(null), BEKLEME_MS));
  const sonuc = await Promise.race([indirme, zamanAsimi]);
  return sonuc ?? gomulu;   // indirme sürüyorsa arka planda tamamlanır, önbelleğe yazar
}
