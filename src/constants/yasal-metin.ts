/**
 * Uygulama içi yasal metinler. Mağaza incelemesi için linklerin HER ZAMAN çalışması
 * gerekir (URL barındırılmasa bile). Tam/güncel sürüm hosting'e koyulup config'teki
 * GIZLILIK_URL/SARTLAR_URL doldurulabilir; uygulama içi metin canonical özet olarak kalır.
 * Yer tutucuları yayından önce doldur: MEVZU-JSPS, dev.ademyilmaz@gmail.com.
 */

/**
 * Resmî kurum bağlantısı reddi. Mağaza "impersonation" riskine karşı uygulama içinde
 * (Sicil altı) ve yasal metinlerde görünür. Mağaza açıklamasına da aynı cümle konmalı.
 */
export const RESMI_BAGLANTI_YOK =
  'Bu uygulama bağımsız bir sınav hazırlık aracıdır; Jandarma Genel Komutanlığı, Sahil Güvenlik Komutanlığı veya herhangi bir resmî kurum/makamla bağlantılı, ilişkili veya onlar tarafından onaylanmış değildir. İlgili marka, amblem ve adlar yalnızca tanımlama amacıyla anılır ve sahiplerine aittir.';

export const GIZLILIK_METNI = `MEVZU-JSPS — GİZLİLİK POLİTİKASI

Veri sorumlusu: MEVZU-JSPS · İletişim: dev.ademyilmaz@gmail.com

1) İŞLENEN VERİLER
• Hesap verisi: Uygulamayı kullanmak için Google (Gmail) ile giriş zorunludur. Girişte
  e-posta adresin ve hesap kimliğin (kullanıcı no) işlenir ve hesabına bağlanır.
• Çalışma verisi: ilerlemen, branşın, rütben ve sicilin cihazında tutulur VE hesabınla buluta
  (Supabase, AB/Frankfurt) yedeklenir → cihaz değiştirsen kaybolmaz.
• İçerik: kart görselleri içerik sunucumuzdan (Cloudflare R2 / Supabase Storage) internet
  üzerinden indirilir; indirilen görseller cihazında ŞİFRELİ (AES-256) saklanır.
• İçerik güvenliği (filigran): sızıntı tespiti için kart görseline hesabının e-posta adresi
  soluk biçimde basılır (yalnız senin gördüğün ekranda; içerik korsanlığına karşı).
• Geri bildirim: GÖNDERİRSEN mesajın + ilgili kart bilgisi bir form servisine iletilir.
Reklam kimliği, konum, rehber, kamera/mikrofon verisi TOPLAMIYORUZ. Şifre saklamıyoruz (giriş Google üzerinden).

2) AMAÇ ve HUKUKİ SEBEP (KVKK m.5)
• Üyelik/giriş, hesabın güvenliği ve ileride satın alımların hesabına bağlanması: sözleşmenin
  kurulması/ifası ve açık rızan.
• Geri bildirimini değerlendirmek ve içerik güvenliği (filigran): meşru menfaat.

3) AKTARIM ve YURT DIŞI
Hesap/giriş verisi, kimlik doğrulama altyapımız Supabase'de (AB/Frankfurt sunucuları) ve giriş
sağlayıcısı Google'da işlenir. Kart içeriği (görseller) içerik sunucularımızdan (Cloudflare R2 /
Supabase Storage) internet üzerinden indirilir; bu sırada IP adresin ilgili sunucuya ulaşır (standart
ağ isteği). Geri bildirim gönderirsen mesajın Formspree'ye iletilir. Bu servislerin sunucuları YURT
DIŞINDA olduğundan, GİRİŞ YAPARAK verinin yurt dışına aktarılmasına AÇIK RIZA vermiş olursun. Verini
satmıyor, pazarlama amacıyla paylaşmıyoruz.

4) SAKLAMA
Hesap verin ve buluta yedeklenen çalışma verin, hesabın aktif olduğu sürece saklanır. Cihazdaki çalışma verisi uygulama yüklü olduğu sürece tutulur; indirilen içerik şifreli olarak cihazında kalır (Mevzuat'tan silebilirsin).

5) HAKLARIN (KVKK m.11)
Erişim, düzeltme, SİLME, itiraz ve zararın giderilmesini talep edebilirsin: dev.ademyilmaz@gmail.com.

6) HESAP ve VERİ SİLME
• Uygulama içinden "Hesabı Sil" diyebilirsin: hesabın silinmek üzere işaretlenir ve 30 gün içinde
  tekrar giriş yapmazsan KALICI olarak (hesap verinle birlikte) silinir. 30 gün içinde girersen geri gelir.
• Cihazdaki çalışma verisini, uygulamayı kaldırarak (veya cihaz ayarlarından temizleyerek) silebilirsin.
• Dilersen yukarıdaki e-postadan da silme talebinde bulunabilirsin.

7) ÇOCUKLAR / GÜVENLİK
Belirlenen yaş altına yönelik değildir.

8) DEĞİŞİKLİKLER
Politikayı güncelleyebiliriz; önemli değişiklikleri uygulama içinde bildiririz.

Sorular: dev.ademyilmaz@gmail.com`;

export const SARTLAR_METNI = `MEVZU-JSPS — KULLANIM ŞARTLARI

Uygulamayı kullanarak bu şartları kabul edersin. Sunan: MEVZU-JSPS.

1) HİZMET ve SORUMLULUK REDDİ
MEVZU-JSPS, JSPS sınavına hazırlık için görsel hafıza kartları, tekrar sistemi ve eğitim araçları sunar.
Bir çalışma aracıdır; SINAVI KAZANACAĞINI GARANTİ ETMEZ. İçerikler bilgilendirme amaçlıdır,
resmi/hukuki danışmanlık değildir; güncel resmi mevzuat esastır.
${RESMI_BAGLANTI_YOK}

2) RESMÎ KAYNAK
Uygulamada gösterilen kanun ve mevzuat metinleri Türkiye Cumhuriyeti resmî mevzuat
veritabanından (Mevzuat Bilgi Sistemi — https://www.mevzuat.gov.tr) alınmıştır. Metinler
bilgilendirme amaçlıdır; güncel ve bağlayıcı sürüm için daima resmî kaynak esastır.

3) FİKRİ MÜLKİYET
Mevzuat metinleri kamuya açıktır. Özgün görseller, karikatürler, tasarım, marka ve yazılım
MEVZU-JSPS'na aittir; izinsiz kopyalanamaz. Filigranlı görsellerin yetkisiz paylaşımı yasaktır.

4) ÜYELİK ve ÜCRET
Uygulamayı kullanmak için Google (Gmail) ile giriş gerekir; hesabının ve giriş bilgilerinin
güvenliğinden sen sorumlusun. Hesabını uygulama içinden silebilirsin (30 gün içinde tekrar
girersen geri gelir). Uygulama şu an ücretsizdir; ileride ücretli özellik eklenirse önceden
bilgilendirilir ve satın alımlar hesabına bağlanır.

5) SORUMLULUĞUN SINIRI
Uygulama "olduğu gibi" sunulur. Hukukun izin verdiği ölçüde dolaylı zararlardan sorumlu değiliz.

6) FESİH
Uygulamayı dilediğin an kaldırabilirsin. Şartları ihlal halinde erişimini sonlandırabiliriz.

7) UYGULANACAK HUKUK
Türkiye Cumhuriyeti hukuku uygulanır.

İletişim: dev.ademyilmaz@gmail.com`;
