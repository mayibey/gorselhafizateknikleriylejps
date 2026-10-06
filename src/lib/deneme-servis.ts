/**
 * DENEME SERVİSİ — soru hata bildirimi + deneme sonuçları + puan sıralaması.
 *
 * Başkan (23 Ağu 2026): "tüm sorulara hata bildir butonu ekle, kayıtlar GERÇEKTEN
 * tutulsun — hangi soru, yazan kim. Deneme sonuçlarını düzgün tut: hangi kanun
 * maddesinde yanlış yapmış, kaç puan almış; sonuçlar bölümü olsun, istediği zaman
 * baksın. Hatta puan sıralama tablosu yap."
 *
 * SUNUCU (Supabase):
 *   soru_hata_bildirim  → kim, hangi soru, hangi denemede, kategori + mesaj (RLS: kendi satırı)
 *   deneme_sonuc        → kim, hangi deneme, puan, süre, YANLIŞLARIN TAMAMI (jsonb)
 *   deneme_siralama()   → SECURITY DEFINER; yalnız ad + puan döner, kimlik sızmaz
 *   deneme_sirami_bul() → kullanıcının kendi sırası
 *
 * ÇEVRİMDIŞI: sonuç önce CİHAZA yazılır (AsyncStorage), sunucuya gönderim ayrıca denenir.
 * Böylece internet yokken de "Sonuçlar" dolu görünür ve hiçbir sonuç kaybolmaz.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

import { soruBul } from '@/lib/sinav';
import { supabase } from '@/lib/supabase';

export type DenemeTakim = 'musterek' | 'brans' | 'karma' | 'premium';

/** Bir soruda yapılan yanlış — sonuç ekranında "nerede hata yaptım" listesi bunu kullanır. */
export type Yanlis = {
  id: string;
  /** Sorunun künyesi: "5237 m.1" gibi (hangi kanun/madde). */
  kaynak: string;
  /** Çözülen mevzuatın tam adı (varsa). */
  kanun?: string;
  /** Soru metni. Kısaltılmış kayıtta boştur; okurken bankadan çözülür (bkz. doldur). */
  soru: string;
  siklar: string[];
  /** Kullanıcının seçtiği şık (-1 = boş bıraktı, -2 = bilinmiyor: sunucudan gelen eski kayıt). */
  secilen: number;
  dogru: number;
  aciklama?: string;
  /** true: soru/açıklama metni cihaza yazılmadı, kimlikten çözülür (7 Eki 2026). */
  kisa?: boolean;
};

export type DenemeSonuc = {
  yerelId: string;
  takim: DenemeTakim;
  denemeNo: number;
  baslik: string;
  dogru: number;
  toplam: number;
  puan: number;
  toplamPuan: number;
  sureSn: number | null;
  tarih: string; // ISO
  yanlislar: Yanlis[];
  /** Sunucuya yazıldı mı (yazılmadıysa sonraki açılışta tekrar denenir). */
  gonderildi: boolean;
  /** Sunucudaki satır kimliği (gönderilince ya da sunucudan gelince). */
  sunucuId?: number;
  /** Sonucun ait olduğu hesap — hesap değişince başkasının sonucu görünmesin. */
  uid?: string;
  /** Branş denemesinde branş (sunucuda deneme_no branşlar arası aynı). */
  brans?: string | null;
  /** Kart skor kimliği (genelSanalLawId) — Denemeler kartında "Son: x puan". */
  sanalLawId?: number;
};

const ANAHTAR = 'deneme-sonuclari';
// 7 Eki 2026: 60 → 200. Yanlışlar artık kısaltılmış yazıldığı için kayıt küçük kalır.
const SINIR = 200;

const surum = String(Constants.expoConfig?.version ?? '');

async function tumSonuclar(): Promise<DenemeSonuc[]> {
  try {
    const ham = await AsyncStorage.getItem(ANAHTAR);
    return ham ? (JSON.parse(ham) as DenemeSonuc[]) : [];
  } catch {
    return [];
  }
}

async function yaz(liste: DenemeSonuc[]): Promise<void> {
  try {
    await AsyncStorage.setItem(ANAHTAR, JSON.stringify(liste.slice(0, SINIR)));
  } catch {
    /* yazılamazsa sessiz geç — sonuç ekranı boş kalır ama uygulama çalışır */
  }
}

// Okuma-değiştirme-yazma işleri sıraya girer (kaydet / gönder / sunucudan birleştir aynı anda
// çalışınca biri ötekinin yazdığını ezmesin).
let kuyruk: Promise<unknown> = Promise.resolve();
function sirayla<T>(is: () => Promise<T>): Promise<T> {
  const p = kuyruk.then(is, is);
  kuyruk = p.catch(() => undefined);
  return p;
}

/** Cihaza yazmadan önce: bankada AYNEN bulunan sorunun metni ve açıklaması yazılmaz (yer tutmasın). */
function kisalt(y: Yanlis): Yanlis {
  if (y.kisa) return y;
  const q = soruBul(y.id);
  if (!q || q.soru !== y.soru || JSON.stringify(q.siklar) !== JSON.stringify(y.siklar)) return y;
  return { id: y.id, kaynak: y.kaynak, kanun: y.kanun, soru: '', siklar: y.siklar, secilen: y.secilen, dogru: y.dogru, kisa: true };
}

/** Okurken: kısaltılmış yanlışın metnini bankadan doldurur. */
function doldur(y: Yanlis): Yanlis {
  if (!y.kisa) return y;
  const q = soruBul(y.id);
  if (!q) return { ...y, soru: '(Bu soru artık soru bankasında yok.)' };
  if (y.siklar.length) return { ...y, soru: q.soru, aciklama: q.aciklama };
  // Sunucudan gelen kayıt: şıklar bankadan. Seçilen şık yalnız doğru şıkkın sırası tutuyorsa güvenilir.
  const secilen = y.dogru >= 0 && y.dogru === q.dogru ? y.secilen : -2;
  return { ...y, soru: q.soru, siklar: q.siklar, dogru: q.dogru, secilen, aciklama: q.aciklama, kaynak: y.kaynak || q.kaynak || '' };
}

async function aktifUid(): Promise<string | null> {
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id ?? null;
  } catch {
    return null;
  }
}

type SunucuSatir = {
  id: number;
  takim: DenemeTakim;
  deneme_no: number;
  baslik: string | null;
  dogru: number;
  toplam: number;
  puan: number;
  toplam_puan: number;
  sure_sn: number | null;
  yanlislar: { id: string; kaynak?: string; kanun?: string; secilen?: number; dogru?: number }[] | null;
  created_at: string;
  brans: string | null;
};

async function sunucudanGetir(uid: string): Promise<SunucuSatir[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('deneme_sonuc')
      .select('id,takim,deneme_no,baslik,dogru,toplam,puan,toplam_puan,sure_sn,yanlislar,created_at,brans')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(SINIR);
    return error || !Array.isArray(data) ? null : (data as SunucuSatir[]);
  } catch {
    return null;
  }
}

/**
 * Sunucudaki sonuçları cihazdakilerle birleştirir (7 Eki 2026, başkan: "bazı denemelerin sonuçları
 * görünmüyor"). Eskiden Sonuçlarım yalnız cihazdan okunuyordu: uygulama silinip kurulunca, telefon
 * değişince sonuçlar yok oluyordu. Cihazda olmayan sunucu satırı eklenir; eski gönderilmiş kayıt
 * (sunucuId'siz) takım + no + doğru + toplam + yakın zamanla eşlenir.
 */
async function birlestir(uid: string, satirlar: SunucuSatir[]): Promise<void> {
  await sirayla(async () => {
    const liste = await tumSonuclar();
    let degisti = false;
    for (const r of satirlar) {
      if (liste.some((s) => s.sunucuId === r.id)) continue;
      const t = Date.parse(r.created_at);
      const es = liste.find(
        (s) =>
          s.sunucuId == null &&
          (!s.uid || s.uid === uid) &&
          s.takim === r.takim &&
          s.denemeNo === r.deneme_no &&
          s.dogru === r.dogru &&
          s.toplam === r.toplam &&
          Math.abs(Date.parse(s.tarih) - t) < 15 * 60 * 1000,
      );
      degisti = true;
      if (es) {
        es.sunucuId = r.id;
        es.gonderildi = true;
        es.uid = uid;
        continue;
      }
      liste.push({
        yerelId: `s-${r.id}`,
        takim: r.takim,
        denemeNo: r.deneme_no,
        baslik: r.baslik ?? '',
        dogru: r.dogru,
        toplam: r.toplam,
        puan: r.puan,
        toplamPuan: r.toplam_puan,
        sureSn: r.sure_sn,
        tarih: r.created_at,
        gonderildi: true,
        sunucuId: r.id,
        uid,
        brans: r.brans,
        yanlislar: (r.yanlislar ?? []).map((y) => ({
          id: y.id,
          kaynak: y.kaynak ?? '',
          kanun: y.kanun,
          soru: '',
          siklar: [],
          secilen: typeof y.secilen === 'number' ? y.secilen : -2,
          dogru: typeof y.dogru === 'number' ? y.dogru : -1,
          kisa: true,
        })),
      });
    }
    if (!degisti) return;
    liste.sort((a, b) => Date.parse(b.tarih) - Date.parse(a.tarih));
    await yaz(liste);
  });
}

/**
 * Sonuçları en yeniden eskiye döndürür: cihazdakiler + (oturum varsa) sunucudakiler.
 * Başka hesabın cihazda kalmış sonuçları gösterilmez.
 */
export async function sonuclariOku(metinli = true): Promise<DenemeSonuc[]> {
  const uid = await aktifUid();
  if (uid) {
    await bekleyenleriGonder();
    const satirlar = await sunucudanGetir(uid);
    if (satirlar?.length) await birlestir(uid, satirlar);
  }
  const liste = (await tumSonuclar()).filter((s) => !uid || !s.uid || s.uid === uid);
  // metinli=false: yalnız puan lazım (Denemeler kartları) — soru bankası boşuna yüklenmesin.
  return metinli ? liste.map((s) => ({ ...s, yanlislar: s.yanlislar.map(doldur) })) : liste;
}

export async function sonucOku(yerelId: string): Promise<DenemeSonuc | null> {
  const s = (await tumSonuclar()).find((x) => x.yerelId === yerelId);
  return s ? { ...s, yanlislar: s.yanlislar.map(doldur) } : null;
}

/** Deneme bitince çağrılır: önce cihaza yazar, sonra sunucuya göndermeyi dener. */
export async function sonucKaydet(
  s: Omit<DenemeSonuc, 'yerelId' | 'tarih' | 'gonderildi' | 'sunucuId' | 'uid'>,
): Promise<DenemeSonuc> {
  const kayit: DenemeSonuc = {
    ...s,
    yerelId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    tarih: new Date().toISOString(),
    gonderildi: false,
    uid: (await aktifUid()) ?? undefined,
  };
  await sirayla(async () => {
    const liste = await tumSonuclar();
    liste.unshift({ ...kayit, yanlislar: kayit.yanlislar.map(kisalt) });
    await yaz(liste);
  });
  void sunucuyaGonder(kayit);
  return kayit;
}

// Aynı kayıt iki kez gönderilmesin (kaydet + bekleyenleriGonder aynı anda çalışabilir).
const yolda = new Set<string>();
async function sunucuyaGonder(kayit: DenemeSonuc): Promise<boolean> {
  if (!supabase || yolda.has(kayit.yerelId)) return false;
  yolda.add(kayit.yerelId);
  try {
    const { data: oturum } = await supabase.auth.getUser();
    const uid = oturum?.user?.id;
    if (!uid) return false;
    // Başka hesapta çözülmüş sonuç bu hesaba yazılmaz.
    if (kayit.uid && kayit.uid !== uid) return false;
    const { data, error } = await supabase
      .from('deneme_sonuc')
      .insert({
        user_id: uid,
        takim: kayit.takim,
        deneme_no: kayit.denemeNo,
        baslik: kayit.baslik,
        dogru: kayit.dogru,
        toplam: kayit.toplam,
        puan: kayit.puan,
        toplam_puan: kayit.toplamPuan,
        sure_sn: kayit.sureSn,
        brans: kayit.brans ?? null,
        // Sunucuda soru METNİ tutulmaz (telifli içerik) — yalnız kimlik + künye + şık sıraları.
        yanlislar: kayit.yanlislar.map((y) => ({ id: y.id, kaynak: y.kaynak, kanun: y.kanun, secilen: y.secilen, dogru: y.dogru })),
      })
      .select('id')
      .single();
    if (error) return false;
    await sirayla(async () => {
      const liste = await tumSonuclar();
      const i = liste.findIndex((x) => x.yerelId === kayit.yerelId);
      if (i >= 0) {
        liste[i] = { ...liste[i], gonderildi: true, uid, sunucuId: (data as { id: number } | null)?.id };
        await yaz(liste);
      }
    });
    return true;
  } catch {
    return false;
  } finally {
    yolda.delete(kayit.yerelId);
  }
}

/** Açılışta ve Sonuçlar açılınca: internet yokken kaydedilmiş sonuçları sunucuya gönderir. */
let gonderiliyor = false;
export async function bekleyenleriGonder(): Promise<void> {
  if (gonderiliyor) return;
  gonderiliyor = true;
  try {
    const liste = await tumSonuclar();
    for (const s of liste.filter((x) => !x.gonderildi).slice(0, 10)) {
      // eslint-disable-next-line no-await-in-loop
      await sunucuyaGonder(s);
    }
  } finally {
    gonderiliyor = false;
  }
}

// ─────────────────────────────────────────────────────────── PUAN SIRALAMASI
export type SiraSatiri = {
  sira: number;
  ad: string;
  puan: number;
  toplam_puan: number;
  dogru: number;
  toplam: number;
  tarih: string;
  benim: boolean;
};

export async function siralamaGetir(takim: DenemeTakim, denemeNo: number): Promise<SiraSatiri[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('deneme_siralama', {
    p_takim: takim,
    p_deneme: denemeNo,
    // TÜM LİSTE (başkan istedi, 6 Eyl 2026): eskiden 50 idi ve Müşterek 1'de 111 kişiden
    // 61'i tabloda hiç görünmüyordu. Sınırsız yerine yüksek bir tavan bırakıldı — kişi sayısı
    // binleri bulursa ekran tek seferde o kadar satır çizmesin.
    p_limit: 1000,
  });
  if (error || !Array.isArray(data)) return [];
  return data as SiraSatiri[];
}

/** Denemenin rekoru: sıralamanın ilk satırı (yoksa null). Deneme listesinde "Rekor" satırı için. */
export async function rekorGetir(takim: DenemeTakim, denemeNo: number): Promise<SiraSatiri | null | undefined> {
  // undefined = öğrenilemedi (bağlantı/hata → satır gösterilmez) · null = henüz kimse çözmedi
  if (!supabase) return undefined;
  const { data, error } = await supabase.rpc('deneme_siralama', { p_takim: takim, p_deneme: denemeNo, p_limit: 1 });
  if (error || !Array.isArray(data)) return undefined;
  return data.length ? (data[0] as SiraSatiri) : null;
}

export async function kendiSiram(
  takim: DenemeTakim,
  denemeNo: number,
): Promise<{ sira: number; toplam_kisi: number; puan: number } | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('deneme_sirami_bul', {
    p_takim: takim,
    p_deneme: denemeNo,
  });
  if (error || !Array.isArray(data) || !data.length) return null;
  return data[0] as { sira: number; toplam_kisi: number; puan: number };
}

// ────────────────────────────────────────────────────── SORU HATA BİLDİRİMİ
export const HATA_KATEGORI = [
  { anahtar: 'yanlis-cevap', etiket: 'Cevap yanlış' },
  { anahtar: 'mulga', etiket: 'Mevzuat değişmiş / mülga' },
  { anahtar: 'anlasilmiyor', etiket: 'Soru anlaşılmıyor' },
  { anahtar: 'yazim', etiket: 'Yazım / imla hatası' },
  { anahtar: 'diger', etiket: 'Başka bir sorun' },
] as const;

export type HataBildirim = {
  soruId: string;
  soruMetni: string;
  siklar: string[];
  dogru: number;
  kaynak: string;
  kanun?: string;
  /** Nerede karşılaştı: "karma-3", "musterek-1", "talim-12-0". */
  nerede: string;
  kategori: string;
  mesaj: string;
};

/**
 * Hata bildirimini GERÇEKTEN kaydeder. Oturum yoksa ya da sunucu erişilemezse
 * `false` döner — ekran "gönderilemedi" der, sahte başarı GÖSTERMEZ.
 */
export async function hataBildir(b: HataBildirim): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data: oturum } = await supabase.auth.getUser();
    const uid = oturum?.user?.id;
    if (!uid) return false;
    const { error } = await supabase.from('soru_hata_bildirim').insert({
      user_id: uid,
      soru_id: b.soruId,
      soru_metni: b.soruMetni.slice(0, 1200),
      siklar: b.siklar,
      dogru_sik: b.dogru,
      kaynak: b.kaynak,
      kanun: b.kanun ?? null,
      nerede: b.nerede,
      kategori: b.kategori,
      mesaj: b.mesaj.slice(0, 1200),
      surum,
    });
    return !error;
  } catch {
    return false;
  }
}
