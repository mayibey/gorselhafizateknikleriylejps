/** Açılışta yüklenen yer tutucu (placeholder) tohum verisi. Gerçek içerik DEĞİLDİR. */

import type { Card, Law } from '@/db/schema';

export const SEED_LAWS: Law[] = [
  { id: 1, blok: 'müşterek', ad: 'Türk Ceza Kanunu' },
  { id: 2, blok: 'branş', ad: 'PVSK' },
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
