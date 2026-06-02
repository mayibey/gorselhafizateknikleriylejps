/**
 * Tohum verisi.
 * - Kanun adları GERÇEK (JSPS resmî mevzuat listesi): Müşterek 25 + Jandarma 41 = 66.
 * - Kartlar / madde metinleri HÂLÂ placeholder (gerçek içerik ayrı tur).
 * - TCK law_id=1 PİNLİ: 49 TCK görseli + tck_m1 kartı buna bağlı, kaydırılmaz.
 */

import type { Branch, Card, Law, LawBranch } from '@/db/schema';

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
 * Kartlar — placeholder. Tümü TCK (law_id 1); 49 TCK görseli + madde metinleri
 * ayrı içerik turunda bağlanacak. (Eski PVSK placeholder kartı, id şeması
 * değiştiği için kaldırıldı.)
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
];
