/**
 * Tohum verisi.
 * - Kanun adları GERÇEK (JSPS resmî mevzuat listesi): Müşterek 25 + Jandarma 41 = 66.
 * - Kartlar / madde metinleri HÂLÂ placeholder (gerçek içerik ayrı tur).
 * - TCK law_id=1 PİNLİ: 49 TCK görseli + tck_m1 kartı buna bağlı, kaydırılmaz.
 */

import { KART_ANAHTARLARI } from '../assets/kart-gorselleri';
import { ayirtOzetBilgi, birlesikDugumAd } from '@/lib/birlesik';
import type { Bolum, BolumKart, Branch, Card, Law, LawBranch } from '@/db/schema';

export const SEED_LAWS: Law[] = [
  // --- MÜŞTEREK (id 1-25) ---
  { id: 1, blok: 'müşterek', ad: '5237 sayılı Türk Ceza Kanunu' }, // PİNLİ — görseller/kart buna bağlı
  { id: 2, blok: 'müşterek', ad: '2803 sayılı Jandarma Teşkilat, Görev ve Yetkileri Kanunu' },
  { id: 3, blok: 'müşterek', ad: '6698 sayılı Kişisel Verilerin Korunması Kanunu' },
  { id: 4, blok: 'müşterek', ad: '7201 sayılı Tebligat Kanunu' },
  { id: 5, blok: 'müşterek', ad: '5442 sayılı İl İdaresi Kanunu' },
  { id: 6, blok: 'müşterek', ad: '5326 sayılı Kabahatler Kanunu' },
  { id: 7, blok: 'müşterek', ad: '3713 sayılı Terörle Mücadele Kanunu' },
  { id: 8, blok: 'müşterek', ad: '2935 sayılı Olağanüstü Hal Kanunu' },
  { id: 9, blok: 'müşterek', ad: '5816 sayılı Atatürk Aleyhine İşlenen Suçlar Hakkında Kanun' },
  { id: 10, blok: 'müşterek', ad: '6284 sayılı Ailenin Korunması ve Kadına Karşı Şiddetin Önlenmesine Dair Kanun' },
  { id: 11, blok: 'müşterek', ad: '2893 sayılı Türk Bayrağı Kanunu' },
  { id: 12, blok: 'müşterek', ad: "7068 sayılı Genel Kolluk Disiplin Hükümleri Hakkında KHK'nın Kabul Edilmesine Dair Kanun" },
  { id: 13, blok: 'müşterek', ad: '4678 sayılı Türk Silahlı Kuvvetlerinde İstihdam Edilecek Sözleşmeli Subay ve Astsubaylar Hakkında Kanun' },
  { id: 14, blok: 'müşterek', ad: '5070 sayılı Elektronik İmza Kanunu' },
  { id: 15, blok: 'müşterek', ad: 'Resmî Yazışmalarda Uygulanacak Usul ve Esaslar Hakkında Yönetmelik' },
  { id: 16, blok: 'müşterek', ad: 'Sözleşmeli Subay ve Astsubay Yönetmeliği' },
  { id: 17, blok: 'müşterek', ad: 'Jandarma Teşkilat, Görev ve Yetkileri Yönetmeliği' },
  { id: 18, blok: 'müşterek', ad: 'Kişisel Verilerin Silinmesi, Yok Edilmesi veya Anonim Hale Getirilmesi Hakkında Yönetmelik' },
  { id: 19, blok: 'müşterek', ad: 'Bilgi Edinme Hakkı Kanununun Uygulanmasına İlişkin Esas ve Usuller Hakkında Yönetmelik' },
  { id: 20, blok: 'müşterek', ad: '2521 sayılı Avda ve Sporda Kullanılan Tüfekler, Nişan Tabancaları ve Av Bıçaklarının Yapımı, Alımı, Satımı ve Bulundurulmasına Dair Kanunun Uygulanmasına İlişkin Yönetmelik' },
  { id: 21, blok: 'müşterek', ad: '6284 sayılı Ailenin Korunması ve Kadına Karşı Şiddetin Önlenmesine Dair Kanuna İlişkin Uygulama Yönetmeliği' },
  { id: 22, blok: 'müşterek', ad: 'Jandarma Genel Komutanlığı ve Sahil Güvenlik Komutanlığı Personel Yönetmeliği' },
  { id: 23, blok: 'müşterek', ad: 'Jandarma ve Sahil Güvenlik Personelinin Hizmet Esasları Yönetmeliği' },
  { id: 24, blok: 'müşterek', ad: 'Jandarma Genel Komutanlığı İzin Yönetmeliği' },
  { id: 25, blok: 'müşterek', ad: '6136 sayılı Ateşli Silahlar ve Bıçaklar ile Diğer Aletler Hakkında Kanun' },

  // --- JANDARMA (id 26-66) — 5237 TCK dedup edildi (müşterek #1) ---
  { id: 26, blok: 'branş', ad: '5271 sayılı Ceza Muhakemesi Kanunu' },
  { id: 27, blok: 'branş', ad: '1774 sayılı Kimlik Bildirme Kanunu' },
  { id: 28, blok: 'branş', ad: '2911 sayılı Toplantı ve Gösteri Yürüyüşleri Kanunu' },
  { id: 29, blok: 'branş', ad: '4915 sayılı Kara Avcılığı Kanunu' },
  { id: 30, blok: 'branş', ad: '1380 sayılı Su Ürünleri Kanunu' },
  { id: 31, blok: 'branş', ad: '6458 sayılı Yabancılar ve Uluslararası Koruma Kanunu' },
  { id: 32, blok: 'branş', ad: '6831 sayılı Orman Kanunu' },
  { id: 33, blok: 'branş', ad: '4342 sayılı Mera Kanunu' },
  { id: 34, blok: 'branş', ad: '2918 sayılı Karayolları Trafik Kanunu' },
  { id: 35, blok: 'branş', ad: '5188 sayılı Özel Güvenlik Hizmetlerine Dair Kanun' },
  { id: 36, blok: 'branş', ad: '5395 sayılı Çocuk Koruma Kanunu' },
  { id: 37, blok: 'branş', ad: '2860 sayılı Yardım Toplama Kanunu' },
  { id: 38, blok: 'branş', ad: '5199 sayılı Hayvanları Koruma Kanunu' },
  { id: 39, blok: 'branş', ad: '2872 sayılı Çevre Kanunu' },
  { id: 40, blok: 'branş', ad: '2559 sayılı Polis Vazife ve Salahiyet Kanunu' }, // PVSK
  { id: 41, blok: 'branş', ad: '5607 sayılı Kaçakçılıkla Mücadele Kanunu' },
  { id: 42, blok: 'branş', ad: '3298 sayılı Uyuşturucu Maddelerle İlgili Kanun' },
  { id: 43, blok: 'branş', ad: '6222 sayılı Sporda Şiddet ve Düzensizliğin Önlenmesine Dair Kanun' },
  { id: 44, blok: 'branş', ad: '2313 sayılı Uyuşturucu Maddelerin Murakabesi Hakkında Kanun' },
  { id: 45, blok: 'branş', ad: '6415 sayılı Terörizmin Finansmanının Önlenmesi Hakkında Kanun' },
  { id: 46, blok: 'branş', ad: '2863 sayılı Kültür ve Tabiat Varlıklarını Koruma Kanunu' },
  { id: 47, blok: 'branş', ad: '3091 sayılı Taşınmaz Mal Zilyedliğine Yapılan Tecavüzlerin Önlenmesi Hakkında Kanun' },
  { id: 48, blok: 'branş', ad: '4207 sayılı Tütün Ürünlerinin Zararlarının Önlenmesi ve Kontrolü Hakkında Kanun' },
  { id: 49, blok: 'branş', ad: '4733 sayılı Tütün, Tütün Mamulleri ve Alkol Piyasasının Düzenlenmesine Dair Kanun' },
  { id: 50, blok: 'branş', ad: '1774 sayılı Kimlik Bildirme Kanununun Uygulanması ile İlgili Yönetmelik' },
  { id: 51, blok: 'branş', ad: 'Ses ve Gaz Fişeği Atabilen Silahlar Hakkında Yönetmelik' },
  { id: 52, blok: 'branş', ad: 'Karayolları Trafik Yönetmeliği' },
  { id: 53, blok: 'branş', ad: 'Taşınır Kültür ve Tabiat Varlıklarını Bulanlara, Haber Verenlere ve Yakalayan Kamu Görevlilerine Verilecek İkramiye ile İlgili Yönetmelik' },
  { id: 54, blok: 'branş', ad: 'Özel Güvenlik Hizmetlerine Dair Kanunun Uygulanmasına İlişkin Yönetmelik' },
  { id: 55, blok: 'branş', ad: 'Adli Kolluk Yönetmeliği' },
  { id: 56, blok: 'branş', ad: 'Adli ve Önleme Aramaları Yönetmeliği' },
  { id: 57, blok: 'branş', ad: 'Suç Eşyası Yönetmeliği' },
  { id: 58, blok: 'branş', ad: 'Yakalama, Gözaltına Alma ve İfade Alma Yönetmeliği' },
  { id: 59, blok: 'branş', ad: 'Ceza Muhakemesinde Beden Muayenesi, Genetik İncelemeler ve Fizik Kimliğinin Tespiti Hakkında Yönetmelik' },
  { id: 60, blok: 'branş', ad: 'Çocuk Koruma Kanununa Göre Verilen Koruyucu ve Destekleyici Tedbir Kararlarının Uygulanması Hakkında Yönetmelik' },
  { id: 61, blok: 'branş', ad: 'Çocuk Koruma Kanununun Uygulanmasına İlişkin Usul ve Esaslar Hakkında Yönetmelik' },
  { id: 62, blok: 'branş', ad: 'İşyeri Açma ve Çalışma Ruhsatlarına İlişkin Yönetmelik' },
  { id: 63, blok: 'branş', ad: 'Kum, Çakıl ve Benzeri Maddelerin Alınması, İşletilmesi ve Kontrolü Yönetmeliği' },
  { id: 64, blok: 'branş', ad: 'Tütün Mamulleri ve Alkollü İçkilerin Satışına ve Sunumuna İlişkin Usul ve Esaslar Hakkında Yönetmelik' },
  { id: 65, blok: 'branş', ad: 'Türk Vatandaşlığı Kanununun Uygulanmasına İlişkin Yönetmelik' },
  { id: 66, blok: 'branş', ad: 'Ateşli Silahlar ve Bıçaklar ile Diğer Aletler Hakkında Yönetmelik' },
];

/** 16 JSPS branşı. slug stabil anahtar, ad ekranda gösterilir, sira sıralama. */
export const SEED_BRANCHES: Branch[] = [
  { id: 1, slug: 'jandarma', ad: 'Jandarma', sira: 1 },
  { id: 2, slug: 'mebs', ad: 'MEBS', sira: 2 },
  { id: 3, slug: 'havacilik', ad: 'Havacılık', sira: 3 },
  { id: 4, slug: 'personel', ad: 'Personel', sira: 4 },
  { id: 5, slug: 'maliye', ad: 'Maliye', sira: 5 },
  { id: 6, slug: 'istihkam', ad: 'İstihkam', sira: 6 },
  { id: 7, slug: 'ikmal', ad: 'İkmal', sira: 7 },
  { id: 8, slug: 'bakim', ad: 'Bakım', sira: 8 },
  { id: 9, slug: 'bando', ad: 'Bando', sira: 9 },
  { id: 10, slug: 'tabip', ad: 'Tabip', sira: 10 },
  { id: 11, slug: 'dis_tabibi', ad: 'Diş Tabibi', sira: 11 },
  { id: 12, slug: 'eczaci', ad: 'Eczacı', sira: 12 },
  { id: 13, slug: 'saglik', ad: 'Sağlık', sira: 13 },
  { id: 14, slug: 'kimyager', ad: 'Kimyager', sira: 14 },
  { id: 15, slug: 'veteriner', ad: 'Veteriner', sira: 15 },
  { id: 16, slug: 'muhendis', ad: 'Mühendis', sira: 16 },
];

/**
 * Jandarma kanunları (id 26-66) → branch_id 1 (jandarma). 41 eşleme.
 * Müşterek kanunlar (1-25) junction'a GİRMEZ (5237 TCK dahil — o müşterek).
 */
export const SEED_LAW_BRANCHES: LawBranch[] = Array.from({ length: 41 }, (_, i) => ({
  law_id: 26 + i,
  branch_id: 1,
}));

/**
 * Kartlar. TCK (law_id 1, id 1-5) placeholder + 4733 m.8 (law_id 49, id 100-109,
 * 10 panel görsel + 1 sesli kart). Başlıklar/metinler geçici; gerçek içerik
 * eklendikçe genişler. (Eski PVSK placeholder kartı, id şeması değiştiği için kaldırıldı.)
 */
/** Önceki turdan korunan resmî TCK madde başlıkları (madde no → başlık). Eksikler placeholder. */
// prettier-ignore
const TCK_BASLIK: Record<string, string> = {
  '1': 'Ceza kanununun amacı', '2': 'Suçta ve cezada kanunilik ilkesi', '3': 'Adalet ve kanun önünde eşitlik ilkesi',
  '4': 'Kanunun bağlayıcılığı', '5': 'Özel kanunlarla ilişki', '20': 'Ceza sorumluluğunun şahsiliği', '21': 'Kast',
  '22': 'Taksir', '23': 'Netice sebebiyle ağırlaşmış suç', '35': 'Suça teşebbüs', '36': 'Gönüllü vazgeçme',
  '37': 'Faillik', '38': 'Azmettirme', '39': 'Yardım etme', '40': 'Bağlılık kuralı',
  '41': 'İştirak halinde işlenen suçlarda gönüllü vazgeçme', '42': 'Bileşik suç', '43': 'Zincirleme suç',
  '44': 'Fikri içtima', '45': 'Cezalar', '247': 'Zimmet', '250': 'İrtikap', '251': 'Denetim görevinin ihmali',
  '252': 'Rüşvet', '255': 'Nüfuz ticareti', '256': 'Zor kullanma yetkisine ilişkin sınırın aşılması',
  '257': 'Görevi kötüye kullanma', '258': 'Göreve ilişkin sırrın açıklanması', '259': 'Kamu görevlisinin ticareti',
  '260': 'Kamu görevinin terki veya yapılmaması', '261': 'Kişilerin malları üzerinde usulsüz tasarruf',
  '262': 'Kamu görevinin usulsüz olarak üstlenilmesi', '264': 'Özel işaret ve kıyafetleri usulsüz kullanma',
  '266': 'Kamu görevine ait araç ve gereçleri suçta kullanma', '317': 'Askeri komutanlıkların gasbı',
  '318': 'Halkı askerlikten soğutma', '319': 'Askerleri itaatsizliğe teşvik', '320': 'Yabancı hizmetine asker yazma, yazılma',
  '321': 'Savaş zamanında emirlere uymama', '322': 'Savaş zamanında yükümlülükler', '323': 'Savaşta yalan haber yayma',
  '324': 'Seferberlikle ilgili görevin ihmali', '325': 'Düşmandan unvan ve benzeri payeler kabulü',
};

/** Görsel anahtar öneki → kanun. (4733 görselleri şu an boş → registry'de yok.) */
const KANUN_BILGI: Record<string, { lawId: number; etiket: string }> = {
  tck: { lawId: 1, etiket: 'TCK' },
  kabahatler: { lawId: 6, etiket: 'Kabahatler' },
  jandarmakanun: { lawId: 2, etiket: "Jandarma Kanunu" },
  kvkk: { lawId: 3, etiket: "KVKK" },
  tebligat: { lawId: 4, etiket: "Tebligat" },
  ililaresi: { lawId: 5, etiket: "İl İdaresi" },
  terorle: { lawId: 7, etiket: "Terörle Mücadele" },
  ohal: { lawId: 8, etiket: "OHAL" },
  ataturk: { lawId: 9, etiket: "Atatürk Al. Suçlar" },
  ailekoruma: { lawId: 10, etiket: "6284 Ailenin Korunması" },
  bayrak: { lawId: 11, etiket: "Türk Bayrağı" },
  disiplin: { lawId: 12, etiket: "Disiplin" },
  sozlesmeliasb: { lawId: 13, etiket: "Sözleşmeli Sb/Asb" },
  eimza: { lawId: 14, etiket: "E-İmza" },
  resmiyazisma: { lawId: 15, etiket: "Resmî Yazışma" },
  sozlesmeliyon: { lawId: 16, etiket: "Sözleşmeli Sb/Asb Yön" },
  jandteskyon: { lawId: 17, etiket: "Jandarma Teşkilat Yön" },
  kvksilme: { lawId: 18, etiket: "KV Silme Yön" },
  bilgiedinme: { lawId: 19, etiket: "Bilgi Edinme Yön" },
  tufekler: { lawId: 20, etiket: "2521 Tüfekler Yön" },
  aileuyg: { lawId: 21, etiket: "6284 Uyg. Yön" },
  personelyon: { lawId: 22, etiket: "Personel Yön" },
  hizmetesas: { lawId: 23, etiket: "Hizmet Esasları Yön" },
  izinyon: { lawId: 24, etiket: "İzin Yön" },
  atesli: { lawId: 25, etiket: "6136 Ateşli Silahlar" },
};

/** lawId → içerik klasörü (KANUN_BILGI'nin tersi). İndirme butonu kanunun klasörünü bundan bulur. */
export const LAW_KLASOR: Record<number, string> = Object.fromEntries(
  Object.entries(KANUN_BILGI).map(([klasor, { lawId }]) => [lawId, klasor]),
);

/**
 * TCK + Kabahatler görsel kartlarını registry anahtarlarından ÜRETİR (her PNG = 1 kart).
 * Çok panel → aynı madde_no (4733 m.8 gibi aynı düğümde sıralanır). Özet/ayırt → ilk maddenin
 * madde_no'su ile o düğüme bağlanır; genel özet (madde no'suz) bağlanmaz, kanun akışında görünür.
 * Sıra: kanun → bağlandığı madde → tip (normal<özet<ayırt<genelözet) → panel.
 */
function gorselKartlari(): Card[] {
  type Tip = 'normal' | 'ozet' | 'ayirt' | 'genelozet';
  type Ham = { key: string; lawId: number; etiket: string; link: number; rank: number; panel: string; tip: Tip; nums: number[]; tag: string };
  const ham: Ham[] = [];
  for (const key of KART_ANAHTARLARI) {
    const us = key.indexOf('_');
    const bilgi = KANUN_BILGI[key.slice(0, us)];
    if (!bilgi) continue;
    const geri = key.slice(us + 1); // 'm35_1' | 'ayirt_m21_22' | 'ozet_m247_266' | 'ozet_tutar'
    // ZOR DETAY görselleri (_zor_) çalışma kartı DEĞİL (salt görüntüleme, /zor-detay ekranı) → atla.
    if (geri.startsWith('zor_')) continue;
    const ortak = { key, lawId: bilgi.lawId, etiket: bilgi.etiket };
    if (geri.startsWith('ayirt_m')) {
      const nums = geri.slice(7).split('_').map(Number);
      ham.push({ ...ortak, link: nums[0], rank: 2, panel: '', tip: 'ayirt', nums, tag: '' });
    } else if (geri.startsWith('ozet_m')) {
      const nums = geri.slice(6).split('_').map(Number);
      ham.push({ ...ortak, link: nums[0], rank: 1, panel: '', tip: 'ozet', nums, tag: '' });
    } else if (geri.startsWith('ozet_')) {
      ham.push({ ...ortak, link: Number.MAX_SAFE_INTEGER, rank: 3, panel: '', tip: 'genelozet', nums: [], tag: geri.slice(5) });
    } else {
      const m = /^m(\d+)(?:_(.*))?$/.exec(geri);
      const no = Number(m![1]);
      ham.push({ ...ortak, link: no, rank: 0, panel: m![2] ?? '', tip: 'normal', nums: [no], tag: '' });
    }
  }
  ham.sort((a, b) => a.lawId - b.lawId || a.link - b.link || a.rank - b.rank || a.panel.localeCompare(b.panel) || a.key.localeCompare(b.key));
  const cards: Card[] = [];
  const sayac: Record<number, number> = {};
  for (const h of ham) {
    // Her kanun KENDİ 1000'lik id bloğunda: law*1000 + sıra (kanun başına <1000 kart).
    // ESKİ ŞEMA (110000 + kanun-başına sayaç) TÜM müşterek kanunları aynı id'lere bindiriyordu
    // → INSERT OR IGNORE'da çakışıp yalnız 4 kanun (TCK/Jandarma/Kabahatler/Disiplin) görünüyordu.
    const id = h.lawId * 1000 + (sayac[h.lawId] = (sayac[h.lawId] ?? 0) + 1);
    let madde_no: string, baslik: string;
    if (h.tip === 'genelozet') {
      madde_no = `${h.etiket} özet`;
      baslik = `Özet — ${h.tag}`;
    } else if (h.tip === 'ozet') {
      madde_no = `${h.etiket} m.${h.link}`;
      baslik = `m.${h.nums.join('–')} özet`; // TÜM üye maddeler (ayırt ile aynı biçim)
    } else if (h.tip === 'ayirt') {
      madde_no = `${h.etiket} m.${h.link}`;
      baslik = `m.${h.nums.join('–')} ayırt`;
    } else {
      madde_no = `${h.etiket} m.${h.link}`;
      const taban = (h.lawId === 1 ? TCK_BASLIK[String(h.link)] : undefined) ?? `Madde ${h.link}`;
      baslik = h.panel && h.panel !== '1' ? `${taban} (${h.panel.replace(/_/g, '/')})` : taban;
    }
    cards.push({ id, law_id: h.lawId, madde_no, baslik, anlatim_metni: `Yer tutucu anlatım metni — ${madde_no}.`, gorsel_yolu: h.key, ses_yolu: null });
  }
  return cards;
}

export const SEED_CARDS: Card[] = [
  // Tüm kartlar görsel registry'sinden ÜRETİLİR (her WebP/PNG = 1 kart). 4733 m.8'in eski
  // placeholder kartları (görsel yok → 2x2 "Panel 1/2/3/4" fallback) KALDIRILDI. 4733 gerçek
  // görseli gelince assets/kartlar/4733/ + KANUN_BILGI'ye eklenince otomatik geri döner.
  ...gorselKartlari(),
];

/**
 * Patika KAPSAMI — JSPS resmî mevzuat listesi (Ek-1). Her kanun için sınavda sorumlu
 * olunan maddeler. Patika bunları "Madde N" DÜĞÜMLERİ olarak gösterir (bölüm bloğu DEĞİL).
 * - 'belirli liste' kanunlar: PDF'deki İLGİLİ MADDELER birebir.
 * - 'Tamamı' kanunlar: MEHAZLARI klasöründeki gerçek metinden çıkarıldı (.doc→antiword,
 *   HTML/.docx→XML, taranmış PDF→pdftotext; dosya sonundaki değişiklik tablosu ayıklandı).
 *   `tam(N, {ek, gecici, mulga})` = 1..N + Ek + Geçici, EKSİ `mulga` (kaynakta "(Mülga...)"
 *   işaretli ana maddeler düğüm OLUŞTURMAZ → yürürlükten kalkmış maddeler patikada yok).
 * 66/66 kanunun TAMAMI kapsamlı (kapsamsız kanun kalmadı; olsaydı patikada tek "Tüm
 * Kartlar" düğümü gösterirdi). id 21 (6284 Uyg Yön) taranmış PDF'ten (pdftotext) çıkarıldı.
 * Etiket → düğüm adı: '5'→"Madde 5", 'Ek 7'→"Ek Madde 7", 'Geçici 2'→"Geçici Madde 2",
 * '13/A'→"Madde 13/A".
 */

/**
 * 'Tamamı' kanunlar için 1..n ana madde + Ek + Geçici madde etiketleri üretir.
 * `mulga`: kaynaktan "(Mülga...)" işaretli ana madde numaraları → düğüm OLUŞTURULMAZ
 * (yürürlükten kalkmış maddeler patikada görünmez).
 */
function tam(n: number, opts?: { ek?: number[]; gecici?: number[]; mulga?: number[] }): string[] {
  const mulga = new Set(opts?.mulga ?? []);
  const a: string[] = [];
  for (let i = 1; i <= n; i++) if (!mulga.has(i)) a.push(String(i));
  for (const k of opts?.ek ?? []) a.push(`Ek ${k}`);
  for (const k of opts?.gecici ?? []) a.push(`Geçici ${k}`);
  return a;
}

/** law_id → sınav kapsamındaki madde etiketleri (sıralı). */
export const SEED_KAPSAM: Record<number, string[]> = {
  // --- MÜŞTEREK ---
  // prettier-ignore
  1: ['1','2','3','4','5','20','21','22','23','35','36','37','38','39','40','41','42','43','44','45','247','248','249','250','251','252','253','254','255','256','257','258','259','260','261','262','264','265','266','317','318','319','320','321','322','323','324','325'], // TCK 5237 (müşterek kapsam)
  // prettier-ignore
  2: tam(27, { ek: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20], gecici: [1,2,3,4,5,6,7,8,9,10,11,12], mulga: [16,17,23,25] }), // 2803 Jandarma Teşkilat Kanunu — Tamamı
  3: ['3', '4', '5', '6', '7', '28'], // 6698 KVKK
  4: ['2', '3', '21', '22', '24'], // 7201 Tebligat
  5: ['2', '4', '9', '11', '18', '27', '31', '32', '42', '43', '57', '58', 'Ek 1'], // 5442 İl İdaresi
  6: tam(45, { ek: [1], gecici: [1, 2, 3] }), // 5326 Kabahatler Kanunu — Tamamı
  7: ['1', '2', '3', '4', '7', '8', '15', '19', '20', '21', '22', 'Ek 2'], // 3713 Terörle Mücadele
  8: ['1', '2', '3', '9', '11', '22', '23'], // 2935 OHAL
  9: tam(5), // 5816 Atatürk Aleyhine İşlenen Suçlar — Tamamı
  10: tam(13), // 6284 — "İlk 13 madde"
  11: tam(12), // 2893 Türk Bayrağı Kanunu — Tamamı
  // prettier-ignore
  12: ['4','5','6','7','8','9','10','11','12','13','14','15','19','20','21','27','28','29','30','31','32','33','34'], // 7068 Genel Kolluk Disiplin
  13: ['3', '4', '6', '7', '8', '10', '11', '12', '13', '15', '16'], // 4678 Sözleşmeli Subay/Astsubay
  14: ['2', '3', '4', '5'], // 5070 E-İmza
  15: tam(39), // Resmî Yazışmalarda Uyg. Usul ve Esaslar Yön — Tamamı
  16: ['3', '5', '6', '8', '9', '11', '12', '13', '14', '15', '22', '26', '30', '31', '32'], // Sözleşmeli Subay Yön
  17: tam(82), // Jandarma Teşkilat, Görev ve Yetkileri Yön — Tamamı
  18: ['8', '9', '10', '11'], // KV Silinmesi Yön
  19: ['2', '3', '4', '5'], // Bilgi Edinme Uyg Yön
  20: ['10', '13', '14'], // 2521 Avda/Sporda Yön
  21: tam(48), // 6284'e İlişkin Uygulama Yön — Tamamı (m.47 yürürlük, m.48 yürütme)
  22: tam(64, { mulga: [43, 44] }), // JGK ve SGK Personel Yön — Tamamı
  23: tam(35), // Jandarma ve SG Personelinin Hizmet Esasları Yön — Tamamı
  24: ['5', '20'], // İzin Yön
  // prettier-ignore
  25: tam(18, { ek: [1,2,3,4,5,6,7,8,9,10,11,12], gecici: [1,2,3,4,5,6,7,8,9,10] }), // 6136 Ateşli Silahlar Kanunu — Tamamı

  // --- BRANŞ (Jandarma) ---
  26: tam(335, { ek: [1], gecici: [1, 2, 3, 4, 5, 6, 7, 8], mulga: [250, 251, 252, 295] }), // 5271 CMK — Tamamı
  27: tam(21, { ek: [1, 2, 3], gecici: [1, 2, 3, 4], mulga: [5, 8, 13, 16] }), // 1774 Kimlik Bildirme — Tamamı
  28: ['1', '2', '3', '4', '5', '6', '7', '8', '11', '12', '22', '23', '24', '25', '26', '27'], // 2911 Toplantı/Gösteri
  // prettier-ignore
  29: ['3','4','5','6','12','13','14','15','16','17','18','20','21','22','23','24','25','26','28','29','30','34'], // 4915 Kara Avcılığı
  30: ['2', '3', '19', '20', '21', '22', '23', '24', '25', '33', '34', '35', '36', 'Ek 3'], // 1380 Su Ürünleri
  31: ['3', '4', '5', '6', '7', '52', '53', '54', '55', '56', '57', '58', '59', '60', '61', '62', '63', '64', '102'], // 6458 YUKK
  32: ['14', '15', '16', '17', '18', '19', '41', '42', '68', '76', '77', '78', '79', '83', '84', '88'], // 6831 Orman
  33: ['3', '4', '6', '19', '20', '22', '23', '26', '27'], // 4342 Mera
  // prettier-ignore
  34: tam(138, { ek: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20], gecici: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27], mulga: [11,40,113,117,119,120,127,129] }), // 2918 KTK — Tamamı
  35: ['4', '5', '7', '10', '14', '17', '19', '20'], // 5188 Özel Güvenlik
  36: tam(50, { ek: [1], gecici: [1, 2] }), // 5395 Çocuk Koruma — Tamamı
  37: ['6', '7', '8', '9', '10', '11', '12', '13', '14'], // 2860 Yardım Toplama
  38: ['3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '20', '21', '22'], // 5199 Hayvanları Koruma
  39: ['12', '15', '20', '26', '27', '28'], // 2872 Çevre
  40: ['5', '13/A', '16', 'Ek 7'], // 2559 PVSK
  41: tam(27, { mulga: [8, 14] }), // 5607 Kaçakçılık — Tamamı
  42: tam(7), // 3298 Uyuşturucu — Tamamı
  43: ['4', '6', '7', '12'], // 6222 Sporda Şiddet
  44: ['20', '21', '23'], // 2313 Uyuşturucu Murakabesi
  45: tam(21), // 6415 Terörizmin Finansmanı — "1-21 arası"
  46: ['3', '4', '6', '16', '23', '26', '64', '65', '66', '67', '68', '69', '70', '71', '72', '73', '74', '75'], // 2863 Kültür/Tabiat
  47: ['2', '3', '4', '5', '6', '7', '8', '9', '10', '12', '15'], // 3091 Zilyetlik
  48: ['2', '3', '4'], // 4207 Tütün Zararları
  49: ['8'], // 4733 Tütün/Alkol Piyasası
  50: tam(35, { ek: [1, 2, 3, 4], gecici: [1], mulga: [11, 12, 13, 18, 31] }), // Kimlik Bildirme Kanunu Uyg. Yön — Tamamı
  51: ['4', '13', '14', '15', '17'], // Ses/Gaz Fişeği Yön
  // prettier-ignore
  52: tam(182, { ek: [1,2,3,4], gecici: [10], mulga: [1,2,6,7,8,9,28,29,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,54,55,56,57,58,59,61,69,70,71,72,73,74,77,78,134,141,164,175] }), // Karayolları Trafik Yön — Tamamı
  53: ['3', '4', '5'], // Taşınır Kültür Yön
  54: ['5', '6', '8', '12', '17', '21', '22', '24', '29', '30', '33', '34', '36', '37', '38', '43', '44', '45', '46'], // Özel Güvenlik Uyg Yön
  55: tam(15), // Adli Kolluk Yön — Tamamı
  56: tam(36), // Adli ve Önleme Aramaları Yön — Tamamı
  57: tam(32, { gecici: [1] }), // Suç Eşyası Yön — Tamamı
  58: tam(34), // Yakalama, Gözaltına Alma ve İfade Alma Yön — Tamamı
  59: ['3', '4', '5', '6', '16'], // Beden Muayenesi Yön
  60: tam(31), // Çocuk Koruma Koruyucu/Destekleyici Tedbir Yön — Tamamı
  61: ['3', '5', '16'], // Çocuk Koruma Usul/Esas Yön
  62: ['3', '5', '6', '7', '8', '29', '30', '32', '33', '34', '36', '38', '43'], // İşyeri Açma Yön
  63: ['3', '5', '6', '7', '8', '9', '14', '15'], // Kum/Çakıl Yön
  64: ['3', '6', '7', '8', '9', '10'], // Tütün/Alkol Satış Yön
  65: ['3', '5', '10', '12', '22'], // Türk Vatandaşlığı Uyg Yön
  66: ['3', '4', '7', '8', '9', '10', '16', '47', '54', '60', '70', '71'], // Ateşli Silahlar/Bıçaklar Yön
};

// --- İÇERİK YERLEŞTİRME: müşterek görseller (fabrika uretilen_gorseller). Patika kapsamı =
// yalnız GÖRSELİ OLAN maddeler (görselsiz maddeler patikadan düşürüldü). 1(TCK)/6(Kabahatler)
// dokunulmadı. EK/Geçici/harfli madde + isimli özet kartları genel-özet (patika düğümü yok),
// kanun akışında görünür. gorselKartlari() registry'den otomatik üretir.
Object.assign(SEED_KAPSAM, {
  2: ['1','4','7','8','9','12','14','15','18','21'], // Jandarma Kanunu
  6: ['1','2','3','4','5','7','8','9','11','13','14','15','16','17','18','20','21','22','23','24','25','26','27','28','29','30','32','33','34','35','36','37','38','39','40','41','42','43'], // Kabahatler
  3: ['3','4','5','6','7','28'], // KVKK
  4: ['2','3','21','22','24'], // Tebligat
  5: ['2','4','8','9','11','18','27','31','32','42','57','58','66'], // İl İdaresi
  7: ['1','2','3','4','7','15','19','20','21','22'], // Terörle Mücadele
  8: ['1','2','3','9','11','22','23'], // OHAL
  9: ['1','2','3'], // Atatürk Al. Suçlar
  10: ['1','3','4','5','7','8','9','10','12','13','17','18'], // 6284 Ailenin Korunması
  11: ['2','3','4','5','6','7','8'], // Türk Bayrağı
  12: ['1','4','5','6','7','8','9','10','11','12','13','14','15','19','20','25','27','28','29','30','31','32','33','34'], // Disiplin
  13: ['3','4','6','7','8','10','12','13','15','16','17','18'], // Sözleşmeli Sb/Asb
  14: ['2','3','4','5'], // E-İmza
  15: ['2','3','4','5','6','8','10','11','13','15','16','17','18','19','21','22','23','24','25','26','27','29','31','32','33'], // Resmî Yazışma
  16: ['3','5','6','8','12','13','14','15','16','22','23','26','30','31','32'], // Sözleşmeli Sb/Asb Yön
  17: ['1','3','4','5','7','8','9','10','11','18','19','21','24','25','38','39','41','42','45','46','47','48','52','58','59','60','61','65','67','70','74','75','76','80'], // Jandarma Teşkilat Yön
  18: ['8','11'], // KV Silme Yön
  19: ['2','3','4','5'], // Bilgi Edinme Yön
  20: ['10','13','14'], // 2521 Tüfekler Yön
  21: ['1','3','4','5','6','7','8','11','12','17','29','30','32','34','35','37','38','39','42'], // 6284 Uyg. Yön
  22: ['1','4','5','7','9','10','11','14','15','16','18','21','24','25','30','32','33','35','38','42','45','46','51','53','54','56','60'], // Personel Yön
  23: ['1','4','5','6','7','8','9','10','11','12','14','15','16','17','18','19','20','21','22','23','24','25','26','28','30','32'], // Hizmet Esasları Yön
  24: ['5','20'], // İzin Yön
  25: ['1','6','7','9','11','12','14'], // 6136 Ateşli Silahlar
});

/** Madde etiketi → patika düğümü adı. */
function maddeAd(etiket: string): string {
  if (etiket.startsWith('Ek ')) return `Ek Madde ${etiket.slice(3)}`;
  if (etiket.startsWith('Geçici ')) return `Geçici Madde ${etiket.slice(7)}`;
  return `Madde ${etiket}`;
}

/**
 * Patika düğümleri + kart↔düğüm bağları (TEK kaynak). Her kanun için:
 *  - kapsamdaki her madde → bir düğüm ("Madde N", sıralı).
 *  - her AYIRT/ÖZET kartı → KENDİ düğümü ("Madde 35–36 ayırt"), kapsamdaki EN BÜYÜK üye
 *    maddesinin HEMEN ARDINA. Böylece kart içerdiği TÜM maddeler görüldükten sonra gelir
 *    ve tek-madde düğümüne karışmaz (eski "içerir" rozeti kaldırıldı).
 *  - bağsız kartlar (madde-no'suz genel-özet / kapsam dışı) → kanunun sonundaki "Özet" düğümü.
 * id = law_id*1000 + sıra (deterministik; kanun başına <999 düğüm). SRS card_id ile bağlı
 * olduğundan düğüm id'leri değişse bile kullanıcı ilerlemesi KORUNUR (migration reseed).
 */
const _patika = (() => {
  const bolumler: Bolum[] = [];
  const baglamalar: BolumKart[] = [];

  for (const [lawIdStr, kapsam] of Object.entries(SEED_KAPSAM)) {
    const lawId = Number(lawIdStr);
    type Dugum = { sortIdx: number; sub: number; tie: string; ad: string; kartIds: number[] };
    const maddeDugum = new Map<string, Dugum>(); // kapsam etiketi → madde düğümü
    const dugumler: Dugum[] = [];
    // 1) Her kapsam maddesi için bir düğüm (kartı olmasa bile görünür).
    kapsam.forEach((et, i) => {
      const d: Dugum = { sortIdx: i, sub: 0, tie: '', ad: maddeAd(et), kartIds: [] };
      maddeDugum.set(et, d);
      dugumler.push(d);
    });
    const ozetKartlar: number[] = [];
    // 2) Kartları dağıt (SEED_CARDS sırası korunur → düğüm-içi panel sırası doğal).
    for (const card of SEED_CARDS) {
      if (card.law_id !== lawId) continue;
      const bilgi = ayirtOzetBilgi(card.gorsel_yolu);
      if (bilgi) {
        // Ayırt/özet → KENDİ düğümü, kapsamdaki en büyük üyenin index'inde (madde düğümünden
        // SONRA: sub=1). Hiç üye kapsamda değilse "Özet" düğümüne düşer.
        let bestIdx = -1;
        let bestVal = -1;
        for (const u of bilgi.uyeler) {
          const i = kapsam.indexOf(String(u));
          if (i >= 0 && u > bestVal) {
            bestVal = u;
            bestIdx = i;
          }
        }
        if (bestIdx < 0) {
          ozetKartlar.push(card.id);
          continue;
        }
        dugumler.push({
          sortIdx: bestIdx,
          sub: 1,
          tie: bilgi.uyeler.join('_'),
          ad: birlesikDugumAd(bilgi),
          kartIds: [card.id],
        });
      } else {
        // Normal kart → madde düğümü (madde-no'dan). Eşleşmezse "Özet" düğümüne.
        const m = card.madde_no.match(/m\.\s*(\d+(?:\/[A-Za-z])?)/i);
        const d = m ? maddeDugum.get(m[1]) : undefined;
        if (d) d.kartIds.push(card.id);
        else ozetKartlar.push(card.id);
      }
    }
    // 3) Bağsız kartlar → kanun sonundaki "Özet" düğümü.
    if (ozetKartlar.length) {
      dugumler.push({ sortIdx: Number.MAX_SAFE_INTEGER, sub: 0, tie: '', ad: 'Özet', kartIds: ozetKartlar });
    }
    // 4) Sırala (madde index → madde(0) önce ayırt(1) sonra → tie) ve sıra/id ata.
    dugumler.sort((a, b) => a.sortIdx - b.sortIdx || a.sub - b.sub || a.tie.localeCompare(b.tie));
    dugumler.forEach((d, k) => {
      const sira = k + 1;
      const id = lawId * 1000 + sira;
      bolumler.push({ id, law_id: lawId, ad: d.ad, sira });
      d.kartIds.forEach((cid, j) => baglamalar.push({ bolum_id: id, card_id: cid, sira: j + 1 }));
    });
  }
  return { bolumler, baglamalar };
})();

/** Patika düğümleri (her madde + her ayırt/özet kartı için ayrı düğüm + kanun sonu "Özet"). */
export const SEED_BOLUMLER: Bolum[] = _patika.bolumler;

/** Kart↔düğüm bağları. Bkz. _patika. */
export const SEED_BOLUM_KARTLARI: BolumKart[] = _patika.baglamalar;
