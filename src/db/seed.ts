/**
 * Tohum verisi.
 * - Kanun adları GERÇEK (JSPS resmî mevzuat listesi): Müşterek 25 + Jandarma 41 = 66.
 * - Kartlar / madde metinleri HÂLÂ placeholder (gerçek içerik ayrı tur).
 * - TCK law_id=1 PİNLİ: 49 TCK görseli + tck_m1 kartı buna bağlı, kaydırılmaz.
 */

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
export const SEED_CARDS: Card[] = [
  {
    id: 5,
    law_id: 1,
    madde_no: 'TCK m.1',
    baslik: 'CEZA KANUNUNUN AMACI',
    anlatim_metni: 'Yer tutucu anlatım metni — ceza kanununun amacı.',
    gorsel_yolu: 'tck_m1',
    ses_yolu: null,
  },
  {
    id: 1,
    law_id: 1,
    madde_no: 'TCK m.86',
    baslik: 'KASTEN YARALAMA',
    anlatim_metni: 'Yer tutucu anlatım metni — kasten yaralama suçunun unsurları.',
    gorsel_yolu: null,
    ses_yolu: null,
  },
  {
    id: 2,
    law_id: 1,
    madde_no: 'TCK m.106',
    baslik: 'TEHDİT',
    anlatim_metni: 'Yer tutucu anlatım metni — tehdit suçu.',
    gorsel_yolu: null,
    ses_yolu: null,
  },
  {
    id: 3,
    law_id: 1,
    madde_no: 'TCK m.125',
    baslik: 'HAKARET',
    anlatim_metni: 'Yer tutucu anlatım metni — hakaret suçu.',
    gorsel_yolu: null,
    ses_yolu: null,
  },

  // --- 4733 m.8 (law_id 49, jandarma) — 10 panel, akışta bu sırayla; özet en son ---
  {
    id: 100,
    law_id: 49,
    madde_no: '4733 m.8',
    baslik: '4733 M.8 — 1. BÖLÜM',
    anlatim_metni: 'Yer tutucu anlatım metni — 4733 m.8.',
    gorsel_yolu: '4733_m8_1',
    ses_yolu: null,
  },
  {
    id: 101,
    law_id: 49,
    madde_no: '4733 m.8',
    baslik: '4733 M.8 — 2. BÖLÜM',
    anlatim_metni: 'Yer tutucu anlatım metni — 4733 m.8.',
    gorsel_yolu: '4733_m8_2',
    ses_yolu: null,
  },
  {
    id: 102,
    law_id: 49,
    madde_no: '4733 m.8',
    baslik: '4733 M.8 — 3. BÖLÜM',
    anlatim_metni: 'Yer tutucu anlatım metni — 4733 m.8.',
    gorsel_yolu: '4733_m8_3',
    ses_yolu: null,
  },
  {
    id: 103,
    law_id: 49,
    madde_no: '4733 m.8',
    baslik: '4733 M.8 — 4. BÖLÜM',
    anlatim_metni: 'Yer tutucu anlatım metni — 4733 m.8.',
    gorsel_yolu: '4733_m8_4',
    ses_yolu: null,
  },
  {
    id: 104,
    law_id: 49,
    madde_no: '4733 m.8',
    baslik: '4733 M.8 — 5. BÖLÜM',
    anlatim_metni: 'Yer tutucu anlatım metni — 4733 m.8.',
    gorsel_yolu: '4733_m8_5',
    ses_yolu: null,
  },
  {
    id: 105,
    law_id: 49,
    madde_no: '4733 m.8',
    baslik: '4733 M.8 — 6. BÖLÜM',
    anlatim_metni: 'Yer tutucu anlatım metni — 4733 m.8.',
    gorsel_yolu: '4733_m8_6',
    ses_yolu: '4733_m8_6',
  },
  {
    id: 106,
    law_id: 49,
    madde_no: '4733 m.8',
    baslik: '4733 M.8 — 7. BÖLÜM',
    anlatim_metni: 'Yer tutucu anlatım metni — 4733 m.8.',
    gorsel_yolu: '4733_m8_7',
    ses_yolu: null,
  },
  {
    id: 107,
    law_id: 49,
    madde_no: '4733 m.8',
    baslik: '4733 M.8 — 8. BÖLÜM (A)',
    anlatim_metni: 'Yer tutucu anlatım metni — 4733 m.8.',
    gorsel_yolu: '4733_m8_8a',
    ses_yolu: null,
  },
  {
    id: 108,
    law_id: 49,
    madde_no: '4733 m.8',
    baslik: '4733 M.8 — 8. BÖLÜM (B)',
    anlatim_metni: 'Yer tutucu anlatım metni — 4733 m.8.',
    gorsel_yolu: '4733_m8_8b',
    ses_yolu: null,
  },
  {
    id: 109,
    law_id: 49,
    madde_no: '4733 m.8',
    baslik: '4733 M.8 — ÖZET',
    anlatim_metni: 'Yer tutucu anlatım metni — 4733 m.8 özet.',
    gorsel_yolu: '4733_m8_ozet',
    ses_yolu: null,
  },

  // === TCK görsel kartları (law_id 1; id 200-299 bloğu) ===
  // m.1 kartı id 5'te (tck_m1) ZATEN VAR → tekrar eklenmedi. Başlıklar resmî madde
  // başlıkları; anlatım metni + madde metni içeriği ayrı tur. gorsel_yolu = registry key.

  // --- GRUP 1: Genel Hükümler (m.2-5; m.1 id 5'te) ---
  { id: 201, law_id: 1, madde_no: 'TCK m.2', baslik: 'Suçta ve cezada kanunilik ilkesi', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.2.', gorsel_yolu: 'tck_m2', ses_yolu: null },
  { id: 202, law_id: 1, madde_no: 'TCK m.3', baslik: 'Adalet ve kanun önünde eşitlik ilkesi', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.3.', gorsel_yolu: 'tck_m3', ses_yolu: null },
  { id: 203, law_id: 1, madde_no: 'TCK m.4', baslik: 'Kanunun bağlayıcılığı', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.4.', gorsel_yolu: 'tck_m4', ses_yolu: null },
  { id: 204, law_id: 1, madde_no: 'TCK m.5', baslik: 'Özel kanunlarla ilişki', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.5.', gorsel_yolu: 'tck_m5', ses_yolu: null },

  // --- GRUP 2: Ceza Sorumluluğu (m.20-23 + ayırt) ---
  { id: 210, law_id: 1, madde_no: 'TCK m.20', baslik: 'Ceza sorumluluğunun şahsiliği', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.20.', gorsel_yolu: 'tck_m20', ses_yolu: null },
  { id: 211, law_id: 1, madde_no: 'TCK m.21', baslik: 'Kast', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.21.', gorsel_yolu: 'tck_m21', ses_yolu: null },
  { id: 212, law_id: 1, madde_no: 'TCK m.22', baslik: 'Taksir', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.22.', gorsel_yolu: 'tck_m22', ses_yolu: null },
  { id: 213, law_id: 1, madde_no: 'TCK m.23', baslik: 'Netice sebebiyle ağırlaşmış suç', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.23.', gorsel_yolu: 'tck_m23', ses_yolu: null },
  { id: 214, law_id: 1, madde_no: 'TCK m.21-22', baslik: 'Kast – Taksir ayrımı (karşılaştırma)', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.21-22.', gorsel_yolu: 'tck_ayirt_m21_22', ses_yolu: null },

  // --- GRUP 3: Teşebbüs, İştirak, İçtima ve Cezalar (m.35-45 + özet) ---
  { id: 220, law_id: 1, madde_no: 'TCK m.35', baslik: 'Suça teşebbüs', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.35.', gorsel_yolu: 'tck_m35', ses_yolu: null },
  { id: 221, law_id: 1, madde_no: 'TCK m.36', baslik: 'Gönüllü vazgeçme', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.36.', gorsel_yolu: 'tck_m36', ses_yolu: null },
  { id: 222, law_id: 1, madde_no: 'TCK m.37', baslik: 'Faillik', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.37.', gorsel_yolu: 'tck_m37', ses_yolu: null },
  { id: 223, law_id: 1, madde_no: 'TCK m.38', baslik: 'Azmettirme', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.38.', gorsel_yolu: 'tck_m38', ses_yolu: null },
  { id: 224, law_id: 1, madde_no: 'TCK m.39', baslik: 'Yardım etme', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.39.', gorsel_yolu: 'tck_m39', ses_yolu: null },
  { id: 225, law_id: 1, madde_no: 'TCK m.40', baslik: 'Bağlılık kuralı', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.40.', gorsel_yolu: 'tck_m40', ses_yolu: null },
  { id: 226, law_id: 1, madde_no: 'TCK m.41', baslik: 'İştirak halinde işlenen suçlarda gönüllü vazgeçme', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.41.', gorsel_yolu: 'tck_m41', ses_yolu: null },
  { id: 227, law_id: 1, madde_no: 'TCK m.42', baslik: 'Bileşik suç', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.42.', gorsel_yolu: 'tck_m42', ses_yolu: null },
  { id: 228, law_id: 1, madde_no: 'TCK m.43', baslik: 'Zincirleme suç', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.43.', gorsel_yolu: 'tck_m43', ses_yolu: null },
  { id: 229, law_id: 1, madde_no: 'TCK m.44', baslik: 'Fikri içtima', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.44.', gorsel_yolu: 'tck_m44', ses_yolu: null },
  { id: 230, law_id: 1, madde_no: 'TCK m.45', baslik: 'Cezalar', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.45.', gorsel_yolu: 'tck_m45', ses_yolu: null },
  { id: 231, law_id: 1, madde_no: 'TCK m.35-45', baslik: 'Teşebbüs–İştirak–İçtima (özet)', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.35-45.', gorsel_yolu: 'tck_ozet_m35_45', ses_yolu: null },

  // --- GRUP 4: Kamu İdaresine Karşı Suçlar (m.247-266 + 2 özet) ---
  { id: 240, law_id: 1, madde_no: 'TCK m.247', baslik: 'Zimmet', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.247.', gorsel_yolu: 'tck_m247', ses_yolu: null },
  { id: 241, law_id: 1, madde_no: 'TCK m.250', baslik: 'İrtikap', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.250.', gorsel_yolu: 'tck_m250', ses_yolu: null },
  { id: 242, law_id: 1, madde_no: 'TCK m.251', baslik: 'Denetim görevinin ihmali', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.251.', gorsel_yolu: 'tck_m251', ses_yolu: null },
  { id: 243, law_id: 1, madde_no: 'TCK m.252', baslik: 'Rüşvet', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.252.', gorsel_yolu: 'tck_m252', ses_yolu: null },
  { id: 244, law_id: 1, madde_no: 'TCK m.255', baslik: 'Nüfuz ticareti', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.255.', gorsel_yolu: 'tck_m255', ses_yolu: null },
  { id: 245, law_id: 1, madde_no: 'TCK m.256', baslik: 'Zor kullanma yetkisine ilişkin sınırın aşılması', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.256.', gorsel_yolu: 'tck_m256', ses_yolu: null },
  { id: 246, law_id: 1, madde_no: 'TCK m.257', baslik: 'Görevi kötüye kullanma', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.257.', gorsel_yolu: 'tck_m257', ses_yolu: null },
  { id: 247, law_id: 1, madde_no: 'TCK m.258', baslik: 'Göreve ilişkin sırrın açıklanması', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.258.', gorsel_yolu: 'tck_m258', ses_yolu: null },
  { id: 248, law_id: 1, madde_no: 'TCK m.259', baslik: 'Kamu görevlisinin ticareti', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.259.', gorsel_yolu: 'tck_m259', ses_yolu: null },
  { id: 249, law_id: 1, madde_no: 'TCK m.260', baslik: 'Kamu görevinin terki veya yapılmaması', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.260.', gorsel_yolu: 'tck_m260', ses_yolu: null },
  { id: 250, law_id: 1, madde_no: 'TCK m.261', baslik: 'Kişilerin malları üzerinde usulsüz tasarruf', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.261.', gorsel_yolu: 'tck_m261', ses_yolu: null },
  { id: 251, law_id: 1, madde_no: 'TCK m.262', baslik: 'Kamu görevinin usulsüz olarak üstlenilmesi', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.262.', gorsel_yolu: 'tck_m262', ses_yolu: null },
  { id: 252, law_id: 1, madde_no: 'TCK m.264', baslik: 'Özel işaret ve kıyafetleri usulsüz kullanma', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.264.', gorsel_yolu: 'tck_m264', ses_yolu: null },
  { id: 253, law_id: 1, madde_no: 'TCK m.266', baslik: 'Kamu görevine ait araç ve gereçleri suçta kullanma', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.266.', gorsel_yolu: 'tck_m266', ses_yolu: null },
  { id: 254, law_id: 1, madde_no: 'TCK m.247-255', baslik: 'Zimmet–Rüşvet–İrtikap (özet)', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.247-255.', gorsel_yolu: 'tck_ozet_m247_255', ses_yolu: null },
  { id: 255, law_id: 1, madde_no: 'TCK m.256-266', baslik: 'Görevi kötüye kullanma ve diğerleri (özet)', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.256-266.', gorsel_yolu: 'tck_ozet_m256_266', ses_yolu: null },

  // --- GRUP 5: Milli Savunmaya Karşı Suçlar (m.317-325 + özet) ---
  { id: 260, law_id: 1, madde_no: 'TCK m.317', baslik: 'Askeri komutanlıkların gasbı', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.317.', gorsel_yolu: 'tck_m317', ses_yolu: null },
  { id: 261, law_id: 1, madde_no: 'TCK m.318', baslik: 'Halkı askerlikten soğutma', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.318.', gorsel_yolu: 'tck_m318', ses_yolu: null },
  { id: 262, law_id: 1, madde_no: 'TCK m.319', baslik: 'Askerleri itaatsizliğe teşvik', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.319.', gorsel_yolu: 'tck_m319', ses_yolu: null },
  { id: 263, law_id: 1, madde_no: 'TCK m.320', baslik: 'Yabancı hizmetine asker yazma, yazılma', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.320.', gorsel_yolu: 'tck_m320', ses_yolu: null },
  { id: 264, law_id: 1, madde_no: 'TCK m.321', baslik: 'Savaş zamanında emirlere uymama', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.321.', gorsel_yolu: 'tck_m321', ses_yolu: null },
  { id: 265, law_id: 1, madde_no: 'TCK m.322', baslik: 'Savaş zamanında yükümlülükler', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.322.', gorsel_yolu: 'tck_m322', ses_yolu: null },
  { id: 266, law_id: 1, madde_no: 'TCK m.323', baslik: 'Savaşta yalan haber yayma', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.323.', gorsel_yolu: 'tck_m323', ses_yolu: null },
  { id: 267, law_id: 1, madde_no: 'TCK m.324', baslik: 'Seferberlikle ilgili görevin ihmali', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.324.', gorsel_yolu: 'tck_m324', ses_yolu: null },
  { id: 268, law_id: 1, madde_no: 'TCK m.325', baslik: 'Düşmandan unvan ve benzeri payeler kabulü', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.325.', gorsel_yolu: 'tck_m325', ses_yolu: null },
  { id: 269, law_id: 1, madde_no: 'TCK m.317-325', baslik: 'Milli savunmaya karşı suçlar (özet)', anlatim_metni: 'Yer tutucu anlatım metni — TCK m.317-325.', gorsel_yolu: 'tck_ozet_m317_325', ses_yolu: null },

  // --- GENEL ÖZET ---
  { id: 290, law_id: 1, madde_no: 'TCK Genel Özet', baslik: 'TCK Genel Hükümler – Genel Özet', anlatim_metni: 'Yer tutucu anlatım metni — TCK Genel Özet.', gorsel_yolu: 'tck_ozet_b1', ses_yolu: null },
];

/**
 * Patika KAPSAMI — JSPS resmî mevzuat listesi (Ek-1). Her kanun için sınavda sorumlu
 * olunan maddeler. Patika bunları "Madde N" DÜĞÜMLERİ olarak gösterir (bölüm bloğu DEĞİL).
 * - 'belirli liste' kanunlar: PDF'deki İLGİLİ MADDELER birebir.
 * - 'Tamamı' kanunlar: MEHAZLARI klasöründeki gerçek metinden çıkarıldı (.doc→antiword,
 *   HTML/.docx→XML; dosya sonundaki değişiklik tablosu ayıklandı). `tam(N)` = 1..N + Ek +
 *   Geçici; mülga maddeler de numara olarak düğüm sayılır.
 * Kaynağı çıkarılamayan 'Tamamı' kanunlar listede YOK → kapsamsız kanun patikada tek
 * "Tüm Kartlar" düğümü gösterir. (Kalan tek eksik: id 21 = 6284 Uyg Yön, kaynak dosyası
 * bozuk/okunamadı — gerçek metin gelince eklenecek.)
 * Etiket → düğüm adı: '5'→"Madde 5", 'Ek 7'→"Ek Madde 7", 'Geçici 2'→"Geçici Madde 2",
 * '13/A'→"Madde 13/A".
 */

/** 'Tamamı' kanunlar için 1..n ana madde + Ek + Geçici madde etiketleri üretir. */
function tam(n: number, opts?: { ek?: number[]; gecici?: number[] }): string[] {
  const a: string[] = [];
  for (let i = 1; i <= n; i++) a.push(String(i));
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
  2: tam(27, { ek: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20], gecici: [1,2,3,4,5,6,7,8,9,10,11,12] }), // 2803 Jandarma Teşkilat Kanunu — Tamamı
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
  22: tam(64), // JGK ve SGK Personel Yön — Tamamı
  23: tam(35), // Jandarma ve SG Personelinin Hizmet Esasları Yön — Tamamı
  24: ['5', '20'], // İzin Yön
  // prettier-ignore
  25: tam(18, { ek: [1,2,3,4,5,6,7,8,9,10,11,12], gecici: [1,2,3,4,5,6,7,8,9,10] }), // 6136 Ateşli Silahlar Kanunu — Tamamı
  // NOT: id 21 (6284 Uyg Yön) kaynak dosyası bozuk (okunamadı) → kapsamsız, tek "Tüm Kartlar".

  // --- BRANŞ (Jandarma) ---
  26: tam(335, { ek: [1], gecici: [1, 2, 3, 4, 5, 6, 7, 8] }), // 5271 CMK — Tamamı
  27: tam(21, { ek: [1, 2, 3], gecici: [1, 2, 3, 4] }), // 1774 Kimlik Bildirme — Tamamı
  28: ['1', '2', '3', '4', '5', '6', '7', '8', '11', '12', '22', '23', '24', '25', '26', '27'], // 2911 Toplantı/Gösteri
  // prettier-ignore
  29: ['3','4','5','6','12','13','14','15','16','17','18','20','21','22','23','24','25','26','28','29','30','34'], // 4915 Kara Avcılığı
  30: ['2', '3', '19', '20', '21', '22', '23', '24', '25', '33', '34', '35', '36', 'Ek 3'], // 1380 Su Ürünleri
  31: ['3', '4', '5', '6', '7', '52', '53', '54', '55', '56', '57', '58', '59', '60', '61', '62', '63', '64', '102'], // 6458 YUKK
  32: ['14', '15', '16', '17', '18', '19', '41', '42', '68', '76', '77', '78', '79', '83', '84', '88'], // 6831 Orman
  33: ['3', '4', '6', '19', '20', '22', '23', '26', '27'], // 4342 Mera
  // prettier-ignore
  34: tam(138, { ek: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20], gecici: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27] }), // 2918 KTK — Tamamı
  35: ['4', '5', '7', '10', '14', '17', '19', '20'], // 5188 Özel Güvenlik
  36: tam(50, { ek: [1], gecici: [1, 2] }), // 5395 Çocuk Koruma — Tamamı
  37: ['6', '7', '8', '9', '10', '11', '12', '13', '14'], // 2860 Yardım Toplama
  38: ['3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '20', '21', '22'], // 5199 Hayvanları Koruma
  39: ['12', '15', '20', '26', '27', '28'], // 2872 Çevre
  40: ['5', '13/A', '16', 'Ek 7'], // 2559 PVSK
  41: tam(27), // 5607 Kaçakçılık — Tamamı
  42: tam(7), // 3298 Uyuşturucu — Tamamı
  43: ['4', '6', '7', '12'], // 6222 Sporda Şiddet
  44: ['20', '21', '23'], // 2313 Uyuşturucu Murakabesi
  45: tam(21), // 6415 Terörizmin Finansmanı — "1-21 arası"
  46: ['3', '4', '6', '16', '23', '26', '64', '65', '66', '67', '68', '69', '70', '71', '72', '73', '74', '75'], // 2863 Kültür/Tabiat
  47: ['2', '3', '4', '5', '6', '7', '8', '9', '10', '12', '15'], // 3091 Zilyetlik
  48: ['2', '3', '4'], // 4207 Tütün Zararları
  49: ['8'], // 4733 Tütün/Alkol Piyasası
  50: tam(35, { ek: [1, 2, 3, 4], gecici: [1] }), // Kimlik Bildirme Kanunu Uyg. Yön — Tamamı
  51: ['4', '13', '14', '15', '17'], // Ses/Gaz Fişeği Yön
  52: tam(182, { ek: [1, 2, 3, 4], gecici: [10] }), // Karayolları Trafik Yön — Tamamı
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

/** Madde etiketi → patika düğümü adı. */
function maddeAd(etiket: string): string {
  if (etiket.startsWith('Ek ')) return `Ek Madde ${etiket.slice(3)}`;
  if (etiket.startsWith('Geçici ')) return `Geçici Madde ${etiket.slice(7)}`;
  return `Madde ${etiket}`;
}

/**
 * Patika düğümleri (bolumler tablosu YENİDEN KULLANILIYOR — her satır artık bir MADDE).
 * id = law_id*1000 + sıra → deterministik/idempotent (kanun başına en çok ~344 madde).
 */
export const SEED_BOLUMLER: Bolum[] = Object.entries(SEED_KAPSAM).flatMap(
  ([lawIdStr, etiketler]) => {
    const lawId = Number(lawIdStr);
    return etiketler.map((et, i) => ({
      id: lawId * 1000 + (i + 1),
      law_id: lawId,
      ad: maddeAd(et),
      sira: i + 1,
    }));
  },
);

/**
 * Mevcut kartları madde düğümüne OTOMATİK bağlar: madde_no içindeki "m.<N>" → o maddenin
 * düğümü (kapsamdaki sıraya göre bolum_id). Kapsamda olmayan madde veya numarasız (özet)
 * kart bağlanmaz — bu kartlara Mevzuat→kanun (getCardsByLaw) ile yine erişilir.
 */
export const SEED_BOLUM_KARTLARI: BolumKart[] = (() => {
  const satirlar: BolumKart[] = [];
  const sayac = new Map<number, number>(); // bolum_id → o düğüme eklenen kart sayısı (sira)
  for (const card of SEED_CARDS) {
    const kapsam = SEED_KAPSAM[card.law_id];
    if (!kapsam) continue;
    const m = card.madde_no.match(/m\.\s*(\d+(?:\/[A-Za-z])?)/i);
    if (!m) continue;
    const idx = kapsam.indexOf(m[1]);
    if (idx < 0) continue;
    const bolumId = card.law_id * 1000 + (idx + 1);
    const sira = (sayac.get(bolumId) ?? 0) + 1;
    sayac.set(bolumId, sira);
    satirlar.push({ bolum_id: bolumId, card_id: card.id, sira });
  }
  return satirlar;
})();
