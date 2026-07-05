/**
 * Uygulama içi yasal metinler. Mağaza incelemesi için linklerin HER ZAMAN çalışması
 * gerekir (URL barındırılmasa bile). Tam/güncel sürüm hosting'e koyulup config'teki
 * GIZLILIK_URL/SARTLAR_URL doldurulabilir; uygulama içi metin canonical özet olarak kalır.
 * Marka: "Mevzu · JSPS" · İletişim: iletisim@mevzujsps.com (nihai — yayına hazır).
 */

/**
 * Resmî kurum bağlantısı reddi. Mağaza "impersonation" riskine karşı uygulama içinde
 * (Sicil altı) ve yasal metinlerde görünür. Mağaza açıklamasına da aynı cümle konmalı.
 */
export const RESMI_BAGLANTI_YOK =
  'Bu uygulama bağımsız bir sınav hazırlık aracıdır; Jandarma Genel Komutanlığı, Sahil Güvenlik Komutanlığı veya herhangi bir resmî kurum/makamla bağlantılı, ilişkili veya onlar tarafından onaylanmış değildir. İlgili marka, amblem ve adlar yalnızca tanımlama amacıyla anılır ve sahiplerine aittir.';

export const GIZLILIK_METNI = `Mevzu · JSPS — GİZLİLİK POLİTİKASI

Veri sorumlusu: Mevzu · JSPS · İletişim: iletisim@mevzujsps.com

1) İŞLENEN VERİLER
• Hesap verisi: Uygulamayı kullanmak için hesap açman gerekir. E-posta ve şifre ile VEYA
  Google (Gmail) hesabıyla giriş yapabilirsin. Girişte e-posta adresin ve hesap kimliğin
  (kullanıcı no) işlenir ve hesabına bağlanır. E-posta/şifre ile kayıt olursan şifren,
  kimlik doğrulama altyapımız Supabase'de güvenli biçimde (hash'lenerek) saklanır; şifreni
  biz göremeyiz.
• Profil verisi: adın, soyadın, telefon numaran, doğum tarihin ve cinsiyetin — üyelik,
  yaş doğrulaması (18+) ve Takdir Belgesi kişiselleştirmesi için işlenir ve hesabına bağlı
  olarak buluta (Supabase, AB/Frankfurt) yazılır.
• Çalışma verisi: ilerlemen, branşın, rütben ve sicilin cihazında tutulur VE hesabınla buluta
  (Supabase, AB/Frankfurt) yedeklenir → cihaz değiştirsen kaybolmaz.
• İçerik: kart görselleri içerik sunucumuzdan (Cloudflare R2 / Supabase Storage) internet
  üzerinden indirilir; indirilen görseller cihazında ŞİFRELİ (AES-256) saklanır.
• İçerik güvenliği (filigran): sızıntı tespiti için kart görseline hesabının e-posta adresi
  soluk biçimde basılır (yalnız senin gördüğün ekranda; içerik korsanlığına karşı).
• Cihaz kimliği: her kurulumda üretilen benzersiz bir cihaz kimliği tutulur — filigran ve hesap
  paylaşımını/kötüye kullanımı önleme (aynı hesabın çok fazla cihazda kullanılmasını sınırlama) amacıyla.
• Satın alma: üyelik satın alırsan, satın alma Google Play üzerinden alınır ve hesabına
  bağlanır (kart/banka bilgin Google'da işlenir, bize ulaşmaz).
• Geri bildirim: GÖNDERİRSEN mesajın + ilgili kart bilgisi veri tabanımıza (Supabase) kaydedilir.
• Ağ: içerik ve giriş sunucularımıza bağlanırken IP adresin ilgili sunucuya ulaşır (standart
  ağ isteği; güvenlik ve kötüye kullanımı önleme amacıyla).
Reklam kimliği, konum, rehber, kamera/mikrofon verisi TOPLAMIYORUZ. Reklam göstermiyor,
seni izlemiyoruz.

2) AMAÇ ve HUKUKİ SEBEP (KVKK m.5)
• Üyelik/giriş, hesabın güvenliği ve ileride satın alımların hesabına bağlanması: sözleşmenin
  kurulması/ifası ve açık rızan.
• Geri bildirimini değerlendirmek ve içerik güvenliği (filigran): meşru menfaat.

3) AKTARIM ve YURT DIŞI
Hesap/giriş verisi, kimlik doğrulama altyapımız Supabase'de (AB/Frankfurt sunucuları) ve giriş
sağlayıcısı Google'da işlenir. Kart içeriği (görseller) içerik sunucularımızdan (Cloudflare R2 /
Supabase Storage) internet üzerinden indirilir; bu sırada IP adresin ilgili sunucuya ulaşır (standart
ağ isteği). Geri bildirim gönderirsen mesajın (ilgili kart bilgisiyle) veri tabanımıza (Supabase) kaydedilir. Bu servislerin sunucuları YURT
DIŞINDA olduğundan, kayıt/giriş sırasında Kullanım Şartları ve Gizlilik Politikası'nı ONAYLAYARAK
verinin yurt dışına aktarılmasına AÇIK RIZA vermiş olursun. Verini satmıyor, pazarlama amacıyla
paylaşmıyoruz.

4) SAKLAMA
Hesap verin ve buluta yedeklenen çalışma verin, hesabın aktif olduğu sürece saklanır. Cihazdaki çalışma verisi uygulama yüklü olduğu sürece tutulur; indirilen içerik şifreli olarak cihazında kalır (Mevzuat'tan silebilirsin).

5) HAKLARIN (KVKK m.11)
Erişim, düzeltme, SİLME, itiraz ve zararın giderilmesini talep edebilirsin: iletisim@mevzujsps.com.

6) HESAP ve VERİ SİLME
• Hesabını UYGULAMA İÇİNDEN, tek tuşla silebilirsin: Evsaf → Ayarlar → Hesap → "Hesabı Sil".
  Hesabın silinmek üzere işaretlenir ve 30 gün içinde tekrar giriş yapmazsan hesabın ve hesabına
  bağlı tüm verin OTOMATİK olarak KALICI silinir. 30 gün içinde girersen hesabın geri gelir.
• Cihazdaki yerel çalışma verisini, uygulamayı kaldırarak (veya cihaz ayarlarından temizleyerek) silebilirsin.

7) YAŞ SINIRI / GÜVENLİK
Bu uygulamayı kullanmak ve üye olmak için en az 18 yaşında olmalısın. Kayıt sırasında doğum
tarihin bu şart için doğrulanır; 18 yaş altına yönelik değildir.

8) DEĞİŞİKLİKLER
Politikayı güncelleyebiliriz; önemli değişiklikleri uygulama içinde bildiririz.

Sorular: iletisim@mevzujsps.com`;

export const SARTLAR_METNI = `Mevzu · JSPS — KULLANIM ŞARTLARI

Uygulamayı kullanarak bu şartları kabul edersin. Sunan: Mevzu · JSPS.

1) HİZMET ve SORUMLULUK REDDİ
Mevzu · JSPS, JSPS sınavına hazırlık için görsel hafıza kartları, tekrar sistemi ve eğitim araçları sunar.
Bir çalışma aracıdır; SINAVI KAZANACAĞINI GARANTİ ETMEZ. İçerikler bilgilendirme amaçlıdır,
resmi/hukuki danışmanlık değildir; güncel resmi mevzuat esastır.
${RESMI_BAGLANTI_YOK}

2) RESMÎ KAYNAK
Uygulamada gösterilen kanun ve mevzuat metinleri Türkiye Cumhuriyeti resmî mevzuat
veritabanından (Mevzuat Bilgi Sistemi — https://www.mevzuat.gov.tr) alınmıştır. Metinler
bilgilendirme amaçlıdır; güncel ve bağlayıcı sürüm için daima resmî kaynak esastır.

3) FİKRİ MÜLKİYET
Mevzuat metinleri kamuya açıktır. Özgün görseller, karikatürler, tasarım, marka ve yazılım
Mevzu · JSPS'na aittir; izinsiz kopyalanamaz. Filigranlı görsellerin yetkisiz paylaşımı yasaktır.

4) ÜYELİK, YAŞ ve ÜCRET
Uygulamayı kullanmak için hesap açman gerekir; e-posta/şifre ile veya Google hesabıyla giriş
yapabilirsin. Üye olmak için en az 18 yaşında olmalısın. Hesabının ve giriş bilgilerinin
güvenliğinden sen sorumlusun. Hesabını uygulama içinden silebilirsin (30 gün içinde tekrar
girersen geri gelir).

Ücretlendirme: Türk Ceza Kanunu içeriği ve deneme kartları ücretsizdir. Diğer içeriklere
tam erişim için isteğe bağlı, süreli abonelik (örn. yıllık; dönem sonunda otomatik yenilenir)
veya tek seferlik ömür boyu erişim satın alabilirsin. Tüm ödemeler Google Play üzerinden alınır.
Abonelik, iptal etmediğin sürece dönem sonunda otomatik yenilenir; aboneliğini istediğin an
Google Play hesabından yönetebilir veya iptal edebilirsin (iptal, süren dolunca geçerli olur).
Dijital içerik anında sunulduğundan, satın alımlar — yürürlükteki tüketici mevzuatının tanıdığı
haklar saklı kalmak üzere — kural olarak iade edilmez; iade/iptal işlemleri Google Play üzerinden
yürür.

5) SORUMLULUĞUN SINIRI
Uygulama "olduğu gibi" sunulur. Hukukun izin verdiği ölçüde dolaylı zararlardan sorumlu değiliz.

6) FESİH
Uygulamayı dilediğin an kaldırabilirsin. Şartları ihlal halinde erişimini sonlandırabiliriz.

7) UYGULANACAK HUKUK
Türkiye Cumhuriyeti hukuku uygulanır.

İletişim: iletisim@mevzujsps.com`;
