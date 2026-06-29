/**
 * Saf Ödül/Ceza (Sicil) mantığı. DB/IO YOK; veri enjekte edilir (stats/performans deseni).
 *
 * CEZA — geri besleme devamsızlık merdiveni:
 *   ≥ZAYIF_ESIK zayıf mevzi → "Geri Besleme Eğitim Emri" açılır (PENCERE_GUN günlük pencere).
 *   Pencere içinde eşik altına düşülürse → emir kapanır, BERAAT (kademe sıfırlanır).
 *   Pencere dolar ve hâlâ zayıfsa → kademe ilerler + ceza işlenir, yeni pencere açılır:
 *   Yazılı İkaz → Uyarı → Kınama → Aylıktan Kesme.
 *
 * ÖDÜL — başarı merdiveni:
 *   Kanunun deneme sınavı %100 geçilince → Takdir. TAKDIR_PER_BASARI takdir → Başarı Belgesi.
 *   BASARI_PER_USTUN başarı → Üstün Başarı Belgesi.
 */

import type { CezaDerece, GeriBesDurum, OdulDerece, SicilKaydi } from '@/db/schema';

export const ZAYIF_ESIK = 3; // bu kadar zayıf mevzi → geri-bes emri açılır
export const PENCERE_GUN = 3; // emir penceresi (gün)
export const TAKDIR_PER_BASARI = 5; // 5 Takdir → 1 Başarı Belgesi
export const BASARI_PER_USTUN = 3; // 3 Başarı → 1 Üstün Başarı

/** Ceza kademeleri sırası (kademe 1..4). */
export const CEZA_SIRA: CezaDerece[] = ['yazili_ikaz', 'uyari', 'kinama', 'ayliktan_kesme'];

/** Verilen YYYY-MM-DD gününe n gün ekler (UTC; stats.oncekiGun ile tutarlı). */
export function gunEkle(iso: string, n: number): string {
  const t = new Date(`${iso}T00:00:00.000Z`);
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
}

/** id'siz sicil kaydı (DB'ye eklenecek taslak). */
export type YeniSicilKaydi = Omit<SicilKaydi, 'id'>;

// --- Temsili metinler (Mevzu JSPS Birliği antetli, DOĞRUDAN 2. şahıs/"tarafınıza" üslubu) ---

const CEZA_BILGI: Record<CezaDerece, { baslik: string; govde: string }> = {
  yazili_ikaz: {
    baslik: 'Yazılı İkaz',
    govde:
      'Geri besleme eğitim emrine süresi içinde icabet etmediniz. İşbu yazı tarafınıza İKAZ ' +
      'mahiyetindedir; zayıf mevzilerinizin ivedi takviyesi tembih olunur.',
  },
  uyari: {
    baslik: 'Uyarı Cezası',
    govde:
      'Geri besleme eğitimindeki devamsızlığınız tekerrür etmiştir. Tarafınıza UYARI cezası ' +
      'tertip edilmiştir. Zayıf mevzilerinizi derhal toparlamanız beklenmektedir.',
  },
  kinama: {
    baslik: 'Kınama Cezası',
    govde:
      'Müteaddit ikaz ve uyarıya rağmen geri besleme eğitimine icabet etmediniz. Tarafınıza ' +
      'KINAMA cezası tertip edilmiştir. Eğitim disiplinine riayet etmeniz son kez hatırlatılır.',
  },
  ayliktan_kesme: {
    baslik: 'Aylıktan Kesme Cezası',
    govde:
      'Israrlı devamsızlığınız nedeniyle tarafınıza (temsili) AYLIKTAN KESME cezası tertip ' +
      'edilmiştir. Zayıf mevzileriniz kapatılmadan siciliniz temizlenmeyecektir.',
  },
};

const ODUL_BILGI: Record<OdulDerece, { baslik: string; govde: (sebep: string) => string }> = {
  takdir: {
    baslik: 'Takdir',
    govde: (s) =>
      `${s} deneme sınavını %100 doğrulukla geçtiğiniz için tarafınıza TAKDİR takdim edilmiştir. ` +
      'Bu azim ve disiplin, birliğe örnektir.',
  },
  basari: {
    baslik: 'Başarı Belgesi',
    govde: () =>
      'Biriken takdirlerle gösterdiğiniz istikrarlı başarı nedeniyle tarafınıza BAŞARI BELGESİ ' +
      'tevcih edilmiştir. Sizi tebrik ederiz.',
  },
  ustun_basari: {
    baslik: 'Üstün Başarı Belgesi',
    govde: () =>
      'Olağanüstü gayret ve süreklilikle elde ettiğiniz başarılar nedeniyle tarafınıza ÜSTÜN ' +
      'BAŞARI BELGESİ takdim edilmiştir. Birliğin iftiharısınız.',
  },
};

const ANTET = 'MEVZU JSPS BİRLİĞİ';
const IMZA = '— Mevzu JSPS Birliği';

// Türkçe-uyumlu büyük harf: i→İ, ı→I (JS toUpperCase 'i'→'I' yapıp "TAKDIR" üretiyordu).
function trUpper(s: string): string {
  return s.replace(/ı/g, 'I').replace(/i/g, 'İ').toUpperCase();
}

function cezaKaydi(derece: CezaDerece, tarih: string): YeniSicilKaydi {
  const b = CEZA_BILGI[derece];
  return {
    tip: 'ceza',
    derece,
    baslik: b.baslik,
    metin: `${ANTET} — ${trUpper(b.baslik)}\n\n${b.govde}\n\n${IMZA}`,
    sebep: 'Geri besleme eğitimine süresinde icabet etmediniz',
    anahtar: null,
    tarih,
  };
}

function odulKaydi(derece: OdulDerece, sebep: string, anahtar: string, tarih: string): YeniSicilKaydi {
  const b = ODUL_BILGI[derece];
  return {
    tip: 'odul',
    derece,
    baslik: b.baslik,
    metin: `${ANTET} — ${trUpper(b.baslik)}\n\n${b.govde(sebep)}\n\n${IMZA}`,
    sebep,
    anahtar,
    tarih,
  };
}

// --- CEZA değerlendirmesi ---

/**
 * Aktif emir + güncel zayıf sayısına göre durumu ilerletir; ihlal varsa ceza kaydı üretir.
 * Saf: bugün enjekte → deterministik/test edilebilir.
 */
export function degerlendirGeriBes(
  zayifSayisi: number,
  durum: GeriBesDurum,
  bugun: string,
): { durum: GeriBesDurum; ceza: YeniSicilKaydi | null } {
  // 1) Emir kapalı → eşik aşıldıysa aç (ceza yok), aksi halde dokunma.
  if (!durum.acik) {
    if (zayifSayisi >= ZAYIF_ESIK) {
      return {
        durum: { acik: true, acilis: bugun, sonTarih: gunEkle(bugun, PENCERE_GUN), kademe: durum.kademe },
        ceza: null,
      };
    }
    return { durum, ceza: null };
  }
  // 2) Emir açık + eşik altına düştü (toparladı) → kapat, beraat (kademe sıfır).
  if (zayifSayisi < ZAYIF_ESIK) {
    return { durum: { acik: false, acilis: null, sonTarih: null, kademe: 0 }, ceza: null };
  }
  // 3) Emir açık + pencere doldu + hâlâ zayıf → ihlal: kademe ilerle, ceza, yeni pencere.
  if (durum.sonTarih && bugun > durum.sonTarih) {
    const yeniKademe = Math.min(durum.kademe + 1, CEZA_SIRA.length);
    return {
      durum: { acik: true, acilis: bugun, sonTarih: gunEkle(bugun, PENCERE_GUN), kademe: yeniKademe },
      ceza: cezaKaydi(CEZA_SIRA[yeniKademe - 1], bugun),
    };
  }
  // 4) Açık, pencere dolmadı, hâlâ zayıf → bekle.
  return { durum, ceza: null };
}

// --- ÖDÜL değerlendirmesi ---

export type KanunDurum = { lawId: number; lawAd: string; tamamlandi: boolean };

/**
 * Tamamlanan kanunlar için Takdir + eşiğe göre Başarı/Üstün Başarı kayıtlarını üretir.
 * `mevcut` zaten verilmiş kayıtlar (tekilleştirme + sayım buradan).
 */
export function odulDegerlendir(
  kanunlar: KanunDurum[],
  mevcut: SicilKaydi[],
  bugun: string,
): YeniSicilKaydi[] {
  const yeni: YeniSicilKaydi[] = [];
  const varAnahtar = new Set(mevcut.map((k) => k.anahtar).filter((a): a is string => a !== null));
  let takdir = mevcut.filter((k) => k.derece === 'takdir').length;
  let basari = mevcut.filter((k) => k.derece === 'basari').length;
  let ustun = mevcut.filter((k) => k.derece === 'ustun_basari').length;

  // Takdir: tamamlanan her kanun için bir kez (anahtar 'takdir:<lawId>').
  for (const k of kanunlar) {
    if (!k.tamamlandi) continue;
    const anahtar = `takdir:${k.lawId}`;
    if (varAnahtar.has(anahtar)) continue;
    yeni.push(odulKaydi('takdir', k.lawAd, anahtar, bugun));
    varAnahtar.add(anahtar);
    takdir++;
  }
  // Başarı: her TAKDIR_PER_BASARI takdirde 1.
  for (let i = basari + 1; i <= Math.floor(takdir / TAKDIR_PER_BASARI); i++) {
    yeni.push(odulKaydi('basari', `${i}. Başarı`, `basari:${i}`, bugun));
    basari++;
  }
  // Üstün Başarı: her BASARI_PER_USTUN başarıda 1.
  for (let i = ustun + 1; i <= Math.floor(basari / BASARI_PER_USTUN); i++) {
    yeni.push(odulKaydi('ustun_basari', `${i}. Üstün Başarı`, `ustun:${i}`, bugun));
    ustun++;
  }
  return yeni;
}

/**
 * DEMO/önizleme: her dereceden birer örnek kayıt (gerçek temsili metinlerle). Yalnız
 * geliştirme modunda (Sicil ekranı __DEV__ düğmesi) görünümü hızlı görmek için kullanılır.
 */
export function ornekKayitlar(bugun: string): YeniSicilKaydi[] {
  return [
    odulKaydi('ustun_basari', '1. Üstün Başarı', 'demo:ustun', bugun),
    odulKaydi('basari', '1. Başarı', 'demo:basari', bugun),
    odulKaydi('takdir', '5237 sayılı Türk Ceza Kanunu', 'demo:takdir', bugun),
    cezaKaydi('ayliktan_kesme', bugun),
    cezaKaydi('kinama', bugun),
    cezaKaydi('uyari', bugun),
    cezaKaydi('yazili_ikaz', bugun),
  ];
}
