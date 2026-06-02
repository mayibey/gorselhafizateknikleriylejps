/** Açılışta yüklenen yer tutucu (placeholder) tohum verisi. Gerçek içerik DEĞİLDİR. */

import type { Branch, Card, Law, LawBranch } from '@/db/schema';

export const SEED_LAWS: Law[] = [
  { id: 1, blok: 'müşterek', ad: 'Türk Ceza Kanunu' },
  { id: 2, blok: 'branş', ad: 'PVSK' },
  { id: 3, blok: 'branş', ad: 'MEBS Yönetmeliği' },
  { id: 4, blok: 'branş', ad: 'Mali Mevzuat' },
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

/** Branş kanunlarının hangi branşlara ait olduğu. müşterek (TCK) burada yok. */
export const SEED_LAW_BRANCHES: LawBranch[] = [
  { law_id: 2, branch_id: 1 }, // PVSK → Jandarma
  { law_id: 3, branch_id: 2 }, // MEBS Yönetmeliği → MEBS
  { law_id: 4, branch_id: 5 }, // Mali Mevzuat → Maliye
];

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
  {
    id: 4,
    law_id: 2,
    madde_no: 'PVSK m.13',
    baslik: 'YAKALAMA',
    anlatim_metni: 'Yer tutucu anlatım metni — yakalama yetkisi.',
    gorsel_yolu: null,
    ses_yolu: null,
  },
];
