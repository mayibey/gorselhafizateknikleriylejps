// SORU KARA LİSTESİ — üreteçler (soru-registry / duello / genel-deneme*) bu id'leri ATLAR.
// Amaç: "salakça" sorular (yürürlükten kalkmış/mülga bir hükmün İÇERİĞİNİ, TARİHİNİ, NUMARASINI
// veya KİMLİĞİNİ ezberleten sorular) tüm bankalardan kalıcı olarak çıkarılsın. Yeniden üretimde
// (npm run soru:uret vb.) geri GELMEZ. NOT: "hâlâ yürürlükte mi / hangisi kaldırılMAMIŞ / atıf
// yönlendirmesi / yürürlükteki geçiş kuralı" gibi MEŞRU sorular listede DEĞİL — onlar kalır.
//
// 17 Tem 2026 — başkan dönütü ("mülgadan soru sormuş, ne salakça"). İlk 7 soru:
export const SORU_KARA_LISTE = new Set([
  '657-S-006',   // 657 DMK m.4'te hangi bent MÜLGA edilmiştir (kalkmış bendi ezberletme)
  '2155-S-013',  // 2155 ile kaldırılan 4367 sayılı Kanun hangi KONUYU düzenlemekteydi (ölü içerik)
  '2330-S-055',  // 2330 ile kaldırılan 1929 tarihli kanun hangisidir (ölü kanun kimliği trivia)
  '5543-S-098',  // kaldırılan 2510 İskân Kanunu hangi TARİHLİDİR (ölü kanun tarihi trivia)
  'Y12920-S-038',// 2024 değişikliğiyle metinden ÇIKARILAN ibare hangisi (kalkmış ibare trivia)
  'GHY-S-058',   // kaldırılan yönetmelik hangi RG tarih/sayıda yayımlanmıştı (ölü yönetmelik trivia)
  '06-D-018',    // 2803 m.6/2. cümle hangi düzenlemeyle MÜLGA edilmiştir (repeal metadata trivia)
  // 18 Tem 2026 — gece kalite taraması, aynı ölü-hüküm/mülga ailesi (12 soru daha):
  '9815-S-102',  // kaldırılan eski yönetmeliğin ADI (Devlet Harcama Belgeleri Yön.) boşluk doldur
  'Y5879-S-143', // kaldırılan eski Subay Sicil Yön. hangi RG tarih/sayıda (ölü yönetmelik trivia)
  '12916-S-098', // kaldırılan eski Yapım İşleri İhaleleri Uyg. Yön. RG tarih/sayı (ölü trivia)
  'Y12920-S-032',// kaldırılan eski Yapım İşleri Muayene Yön. RG tarih/sayı (ölü trivia)
  '34039-S-053', // kaldırılan eski Ses/Gaz Fişeği Yön. RG tarih/sayı (ölü trivia)
  '06-D-145',    // Jandarma Asayiş Vakfı senedi hangi tarihli RG'de ilan (salt tarih ezberi)
  '9600-S-056',  // kaldırılan eski Ön Ödeme Yön. hangi BKK tarih/sayı (ölü yönetmelik trivia)
  'Y5809-S-108', // kaldırılan eski Astsubay Sicil Yön. hangi RG tarih/sayı (ölü trivia)
  '3212-S-041',  // aykırı hükümleri kaldıran kanunun tarih/sayısı (repeal metadata trivia)
  '3212-S-042',  // aynı, kaldıran kanunun numarasını boşluk doldur (repeal metadata trivia)
  '2565-S-080',  // hangi kanun (1110 Askeri Memnu) yürürlükten kaldırılmış (ölü kanun kimliği)
  '3402-S-072',  // hangi kanun (2613 Kadastro) yürürlükten kaldırılmış (ölü kanun kimliği)
  // 18 Tem 2026 — başkan "hangi tarihte yürürlüğe girdi soruları da çok saçma". BELİRLİ TARİH
  // ezberi olanlar (cevap = takvim tarihi). NOT: yürürlük KURALINI soranlar ("yayımı tarihinde /
  // yayımdan 6 ay sonra") tarih ezberi DEĞİL, gerçek bilgi → KORUNDU (4925-S-054, GHY-S-062,
  // Y24811-S-023, 3212-S-034):
  '257-S-042',   // 257 Kanunu hangi tarihte yürürlüğe girmiştir (1 Mart 1961 — takvim ezberi)
  '4735-S-072',  // 4735 hangi tarihte yürürlüğe girmiştir (1.1.2003 — takvim ezberi)
  '9815-S-103',  // Harcama Belgeleri Yön. hangi tarihte yürürlüğe girmiştir (1/1/2006)
  'Y45-S-105',   // Atama Yön. hangi tarihte yürürlüğe girmiştir (1/11/2021)
  '11385-S-088', // Hazine Taşınmazları Yön. hangi tarihte yürürlüğe girmiştir (1/7/2007)
  '2010-616-S-091', // Taşınır Mal Yön. hangi tarihte yürürlüğe girmiştir (1/1/2011 — takvim ezberi)
  '10970-S-032', // Kamu Taşınmazları Yön. ne zaman yürürlüğe girmiştir (13/9/2006 — takvim ezberi)
  '4734-S-116',  // 4734 hangi maddeler hangi TARİHTE yürürlüğe girmiştir (1.1.2003 kademeli tarih)
  '3298-S-024',  // 4. madde hangi kanunla değiştirilip ne zaman yürürlüğe girmiş (değişiklik metadata)
]);
