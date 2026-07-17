// SORU KARA LİSTESİ — üreteçler (soru-registry / duello / genel-deneme*) bu id'leri ATLAR.
// Amaç: "salakça" sorular (yürürlükten kalkmış/mülga bir hükmün İÇERİĞİNİ, TARİHİNİ, NUMARASINI
// veya KİMLİĞİNİ ezberleten sorular) tüm bankalardan kalıcı olarak çıkarılsın. Yeniden üretimde
// (npm run soru:uret vb.) geri GELMEZ. NOT: "hâlâ yürürlükte mi / hangisi kaldırılMAMIŞ / atıf
// yönlendirmesi / yürürlükteki geçiş kuralı" gibi MEŞRU sorular listede DEĞİL — onlar kalır.
//
// 17 Tem 2026 — başkan dönütü ("mülgadan soru sormuş, ne salakça"). 7 soru:
export const SORU_KARA_LISTE = new Set([
  '657-S-006',   // 657 DMK m.4'te hangi bent MÜLGA edilmiştir (kalkmış bendi ezberletme)
  '2155-S-013',  // 2155 ile kaldırılan 4367 sayılı Kanun hangi KONUYU düzenlemekteydi (ölü içerik)
  '2330-S-055',  // 2330 ile kaldırılan 1929 tarihli kanun hangisidir (ölü kanun kimliği trivia)
  '5543-S-098',  // kaldırılan 2510 İskân Kanunu hangi TARİHLİDİR (ölü kanun tarihi trivia)
  'Y12920-S-038',// 2024 değişikliğiyle metinden ÇIKARILAN ibare hangisi (kalkmış ibare trivia)
  'GHY-S-058',   // kaldırılan yönetmelik hangi RG tarih/sayıda yayımlanmıştı (ölü yönetmelik trivia)
  '06-D-018',    // 2803 m.6/2. cümle hangi düzenlemeyle MÜLGA edilmiştir (repeal metadata trivia)
]);
