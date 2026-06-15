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
• Çalışma verisi: ilerlemen, branşın ve sicilin yalnız CİHAZINDA tutulur (sunucuya gönderilmez).
• Cihaz tanımlayıcı: kart güvenliği (filigran) için cihazında üretilen rastgele kimlik (cihazında kalır).
• Geri bildirim: GÖNDERİRSEN mesajın + ilgili kart bilgisi + cihaz kimliği bir form servisine iletilir.
Hesap açmıyoruz; e-posta/şifre, reklam kimliği, konum, rehber, kamera/mikrofon verisi TOPLAMIYORUZ.

2) AMAÇ ve HUKUKİ SEBEP (KVKK m.5)
Çalışma aracını sunmak (cihazda işleme) ve gönderdiğin geri bildirimi değerlendirmek için meşru menfaat.

3) AKTARIM
Verilerin cihazında tutulur, sunucumuza aktarılmaz. Yalnızca SEN geri bildirim gönderirsen, mesajın
form servisi Formspree'ye iletilir (sunucular yurt dışında olabilir). Verini satmıyor/paylaşmıyoruz.

4) SAKLAMA
Çalışma verisi ve cihaz kimliği cihazında, uygulama yüklü olduğu sürece saklanır.

5) HAKLARIN (KVKK m.11)
Erişim, düzeltme, SİLME, itiraz ve zararın giderilmesini talep edebilirsin: dev.ademyilmaz@gmail.com.

6) VERİ SİLME
Tüm verin cihazında olduğundan, uygulamayı kaldırman (veya cihaz ayarlarından verisini temizlemen)
tüm çalışma verini kalıcı olarak siler.

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

2) FİKRİ MÜLKİYET
Mevzuat metinleri kamuya açıktır. Özgün görseller, karikatürler, tasarım, marka ve yazılım
MEVZU-JSPS'na aittir; izinsiz kopyalanamaz. Filigranlı görsellerin yetkisiz paylaşımı yasaktır.

3) ÜCRET
Uygulama şu an ücretsizdir. İleride ücretli özellik eklenirse önceden bilgilendirilir.

4) SORUMLULUĞUN SINIRI
Uygulama "olduğu gibi" sunulur. Hukukun izin verdiği ölçüde dolaylı zararlardan sorumlu değiliz.

5) FESİH
Uygulamayı dilediğin an kaldırabilirsin. Şartları ihlal halinde erişimini sonlandırabiliriz.

6) UYGULANACAK HUKUK
Türkiye Cumhuriyeti hukuku uygulanır.

İletişim: dev.ademyilmaz@gmail.com`;
