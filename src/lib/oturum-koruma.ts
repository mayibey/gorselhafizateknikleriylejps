/**
 * OTURUM KORUMA (3 Eki 2026) — başkan: "aynı anda tek cihaz açık oturum olsun, ama şakkadanak kapanmasın".
 *
 * Teşhis (memory oturum-dusme-tablet-teshis; Mehmet Ali Güneş + Kasım Tuncer, tablette kendiliğinden çıkış):
 *  1. Erişim anahtarı 1 saatte doluyor. Süresi dolmuşken uygulama İNTERNETSİZ açılınca (uykudan yeni uyanan
 *     Wi-Fi'li tablet) Supabase yenilemeyi yapamıyor ve getSession "oturum yok" dönüyor — ama oturumu SİLMİYOR.
 *     auth-context bunu çıkış sanıp giriş ekranını gösteriyordu.
 *  2. supabase.auth.signOut() varsayılanı GLOBAL: tek-oturum düşürmesi, hesabı yeni sahiplenen cihazın
 *     oturumunu da siliyordu → o cihaz ≤1 saat sonra mesajsız çıkışa düşüyordu.
 *  3. Supabase açılışta, cihazda duran geçerli oturum için de SIGNED_IN yayıyor → uygulama bunu yeni giriş
 *     sanıp hesabı sessizce yeniden sahipleniyordu (son açılan cihaz kazanır, arkada bekleyen tablet düşer).
 *
 * Bayrak: 'oturum-koruma' (uygulama_ayar.ozellik_kisi) — önce YALNIZ başkanda. Kapalıyken davranış eskisiyle
 * birebir aynı. Herkese açmak ("yay"): uygulama_ayar.ozellik_herkes listesine 'oturum-koruma' ekle (build/OTA
 * gerekmez; her cihazda bir sonraki açılıştan itibaren devreye girer).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { SUPABASE_URL } from '@/constants/config';
import { kisiselOzellikAcikMi } from '@/lib/ozellik';

const BAYRAK = 'oturum-koruma';
// ozellik.ts ile aynı yerel önbellek anahtarı: açılış kararı İNTERNETSİZ de verilebilsin diye son bilinen değer.
const BAYRAK_ONBELLEK = 'ozellik-kisi:' + BAYRAK;
let bayrakSozu: Promise<boolean> | null = null;

/** Bayrak açık mı? Bu açılışın kararı yerel önbellekten (ağsız, milisaniyeler); sunucu değeri arkada
 *  tazelenir ve bir SONRAKİ açılışta geçerli olur. Asla hata fırlatmaz. */
export function oturumKorumaAcikMi(): Promise<boolean> {
  if (!bayrakSozu) {
    bayrakSozu = (async () => {
      let acik = false;
      try {
        acik = (await AsyncStorage.getItem(BAYRAK_ONBELLEK)) === '1';
      } catch {
        /* okunamadı → kapalı (eski davranış) */
      }
      // Açılış trafiğine karışmasın diye sunucu tazelemesi biraz sonra.
      setTimeout(() => {
        void kisiselOzellikAcikMi('oturum-koruma') // düz yazı: bayrak:denetle bu çağrıyı tarıyor
          .then((v) => AsyncStorage.setItem(BAYRAK_ONBELLEK, v ? '1' : '0'))
          .catch(() => {});
      }, 8000);
      return acik;
    })();
  }
  return bayrakSozu;
}

/** Oturum hatası GEÇİCİ mi (ağ yok, zaman aşımı, sunucuya ulaşılamadı)? true → oturum cihazda duruyor,
 *  çıkış SAYILMAZ. Supabase bu durumda oturumu silmez, bağlantı gelince kendisi yeniler. */
export function geciciOturumHatasi(e: unknown): boolean {
  if (!e || typeof e !== 'object') return false;
  const h = e as { name?: unknown; status?: unknown; message?: unknown };
  if (h.name === 'AuthRetryableFetchError') return true;
  if (typeof h.status === 'number' && (h.status === 0 || h.status === 502 || h.status === 503 || h.status === 504)) return true;
  return /network|failed to fetch|timeout|timed out/i.test(String(h.message ?? ''));
}

// Supabase'in oturumu sakladığı anahtar (supabase-js varsayılanı: sb-<proje>-auth-token).
const OTURUM_ANAHTARI = 'sb-' + SUPABASE_URL.replace(/^https?:\/\//, '').split('.')[0] + '-auth-token';

export type DepoKullanicisi = {
  id: string;
  email?: string | null;
  app_metadata?: { provider?: string };
  user_metadata?: Record<string, unknown>;
};

/** Cihazda duran oturumun kullanıcısı (AĞSIZ okuma). Oturum yoksa/bozuksa null. */
export async function depodakiOturumKullanicisi(): Promise<DepoKullanicisi | null> {
  try {
    const ham = await AsyncStorage.getItem(OTURUM_ANAHTARI);
    if (!ham) return null;
    const s = JSON.parse(ham) as { user?: DepoKullanicisi; refresh_token?: string; currentSession?: { user?: DepoKullanicisi } };
    const u = s?.user ?? s?.currentSession?.user;
    if (!s?.refresh_token && !s?.currentSession) return null; // yenileme anahtarı yoksa geçerli oturum sayılmaz
    return u && typeof u.id === 'string' ? u : null;
  } catch {
    return null;
  }
}

/** Erişim anahtarındaki Supabase oturum kimliği (session_id). Yeni giriş = yeni kimlik;
 *  anahtar yenileme ve açılışta geri yükleme = AYNI kimlik. Çözülemezse null. */
export function jwtOturumKimligi(token?: string | null): string | null {
  try {
    const parca = (token ?? '').split('.')[1];
    if (!parca) return null;
    const b64 = parca.replace(/-/g, '+').replace(/_/g, '/');
    const tam = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const metin = typeof atob === 'function' ? atob(tam) : base64Coz(tam);
    const o = JSON.parse(metin) as { session_id?: unknown };
    return typeof o.session_id === 'string' ? o.session_id : null;
  } catch {
    return null;
  }
}

function base64Coz(s: string): string {
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let bit = 0;
  let deger = 0;
  let out = '';
  for (const c of s) {
    if (c === '=') break;
    const i = A.indexOf(c);
    if (i < 0) continue;
    deger = (deger << 6) | i;
    bit += 6;
    if (bit >= 8) {
      bit -= 8;
      out += String.fromCharCode((deger >> bit) & 0xff);
    }
  }
  return out;
}

// GİRİŞ NİYETİ: kullanıcı bu cihazda giriş eylemi başlattıysa ardından gelen SIGNED_IN gerçek yeni giriştir
// (hesabı sahiplenir). Niyet yoksa SIGNED_IN, açılışta geri yüklenen oturumdur (sahiplenmez, yalnız denetler).
let girisNiyeti = 0;
const NIYET_SURESI_MS = 10 * 60_000;
export function girisNiyetiIsaretle(): void {
  girisNiyeti = Date.now();
}
export function girisNiyetiTaze(): boolean {
  return girisNiyeti > 0 && Date.now() - girisNiyeti < NIYET_SURESI_MS;
}
export function girisNiyetiTemizle(): void {
  girisNiyeti = 0;
}
