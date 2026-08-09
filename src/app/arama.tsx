/**
 * TAM ARAMA — KÖK YIĞIN ROTASI (9 Ağu 2026 gece, başkan: "Ara'da geri tuşu yok,
 * sağa kaydırma çalışmıyor").
 *
 * /ara gizli SEKME olduğu için oraya router.push ile "atlanınca" ne geri oku
 * çıkıyor ne iOS kenar-kaydırması çalışıyordu (sekme geçişinde jest yok).
 * Bu dosya AYNI ekranı kök yığında (/arama) açar → üste kayarak gelir, kenardan
 * kaydırınca kapanır, başlıkta geri oku görünür (ara.tsx usePathname ile anlar).
 * Bayraklı Mevzuat kutusu /arama'yı açar; Karargah büyüteci (bayraksız herkes)
 * eski /ara sekmesini kullanmaya devam eder — davranışları değişmez.
 */
export { default } from './(tabs)/ara';
