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

import { supabase } from '@/lib/supabase';

export type DenemeTakim = 'musterek' | 'brans' | 'karma';

/** Bir soruda yapılan yanlış — sonuç ekranında "nerede hata yaptım" listesi bunu kullanır. */
export type Yanlis = {
  id: string;
  /** Sorunun künyesi: "5237 m.1" gibi (hangi kanun/madde). */
  kaynak: string;
  /** Çözülen mevzuatın tam adı (varsa). */
  kanun?: string;
  soru: string;
  siklar: string[];
  /** Kullanıcının seçtiği şık (-1 = boş bıraktı). */
  secilen: number;
  dogru: number;
  aciklama?: string;
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
};

const ANAHTAR = 'deneme-sonuclari';
const SINIR = 60; // cihazda tutulan sonuç sayısı (eskiler düşer)

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

/** Sonuçları en yeniden eskiye döndürür. */
export async function sonuclariOku(): Promise<DenemeSonuc[]> {
  return tumSonuclar();
}

export async function sonucOku(yerelId: string): Promise<DenemeSonuc | null> {
  return (await tumSonuclar()).find((s) => s.yerelId === yerelId) ?? null;
}

/** Deneme bitince çağrılır: önce cihaza yazar, sonra sunucuya göndermeyi dener. */
export async function sonucKaydet(
  s: Omit<DenemeSonuc, 'yerelId' | 'tarih' | 'gonderildi'>,
): Promise<DenemeSonuc> {
  const kayit: DenemeSonuc = {
    ...s,
    yerelId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    tarih: new Date().toISOString(),
    gonderildi: false,
  };
  const liste = await tumSonuclar();
  liste.unshift(kayit);
  await yaz(liste);
  void sunucuyaGonder(kayit);
  return kayit;
}

async function sunucuyaGonder(kayit: DenemeSonuc): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data: oturum } = await supabase.auth.getUser();
    const uid = oturum?.user?.id;
    if (!uid) return false;
    const { error } = await supabase.from('deneme_sonuc').insert({
      user_id: uid,
      takim: kayit.takim,
      deneme_no: kayit.denemeNo,
      baslik: kayit.baslik,
      dogru: kayit.dogru,
      toplam: kayit.toplam,
      puan: kayit.puan,
      toplam_puan: kayit.toplamPuan,
      sure_sn: kayit.sureSn,
      // Sunucuda soru METNİ tutulmaz (telifli içerik) — yalnız kimlik + künye.
      yanlislar: kayit.yanlislar.map((y) => ({ id: y.id, kaynak: y.kaynak, kanun: y.kanun })),
    });
    if (error) return false;
    const liste = await tumSonuclar();
    const i = liste.findIndex((x) => x.yerelId === kayit.yerelId);
    if (i >= 0) {
      liste[i] = { ...liste[i], gonderildi: true };
      await yaz(liste);
    }
    return true;
  } catch {
    return false;
  }
}

/** Açılışta çağrılır: internet yokken kaydedilmiş sonuçları sunucuya gönderir. */
export async function bekleyenleriGonder(): Promise<void> {
  const liste = await tumSonuclar();
  for (const s of liste.filter((x) => !x.gonderildi).slice(0, 10)) {
    // eslint-disable-next-line no-await-in-loop
    await sunucuyaGonder(s);
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
    p_limit: 50,
  });
  if (error || !Array.isArray(data)) return [];
  return data as SiraSatiri[];
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
