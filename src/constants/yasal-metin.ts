/**
 * Uygulama içi yasal metinler. Mağaza incelemesi için linklerin HER ZAMAN çalışması
 * gerekir (URL barındırılmasa bile). Tam/güncel sürüm hosting'e koyulup config'teki
 * GIZLILIK_URL/SARTLAR_URL doldurulabilir; uygulama içi metin canonical özet olarak kalır.
 * Yer tutucuları yayından önce doldur: [GELİŞTİRİCİ/ŞİRKET ADI], [İLETİŞİM E-POSTASI].
 */

export const GIZLILIK_METNI = `MEVZU — GİZLİLİK POLİTİKASI

Veri sorumlusu: [GELİŞTİRİCİ/ŞİRKET ADI] · İletişim: [İLETİŞİM E-POSTASI]

1) İŞLENEN VERİLER
• Hesap: e-posta, şifre (şifrelenmiş), kullanıcı adı.
• İçtima sohbeti: gönderdiğin mesajlar ve zamanı (genel sohbette diğer kullanıcılara açıktır).
• Cihaz tanımlayıcı: kart güvenliği (filigran) için cihazında üretilen rastgele kimlik.
• Çalışma verisi: ilerlemen ve branşın yalnız CİHAZINDA tutulur (sunucuya gönderilmez).
• Geri bildirim: gönderirsen mesajın + kart bilgisi + cihaz kimliği form servisine iletilir.
Reklam kimliği, konum, rehber, kamera/mikrofon verisi TOPLAMIYORUZ.

2) AMAÇ ve HUKUKİ SEBEP (KVKK m.5)
Hesap/oturum ve sohbet için sözleşmenin ifası; kötüye kullanımı önleme için meşru menfaat.

3) AKTARIM
Hesap ve sohbet verisi Supabase (kimlik doğrulama + veritabanı) üzerinde işlenir; sunucular yurt
dışında olabilir. Geri bildirim Formspree'ye gider. Verini satmıyor/paylaşmıyoruz (yasal zorunluluk hariç).

4) SAKLAMA
Hesabın aktif olduğu sürece saklanır; hesabını silince makul sürede silinir/anonimleştirilir.

5) HAKLARIN (KVKK m.11)
Erişim, düzeltme, SİLME, itiraz ve zararın giderilmesini talep edebilirsin: [İLETİŞİM E-POSTASI].

6) HESAP SİLME
Uygulama içinden (Sicil → Hesap → Hesabı Sil) hesabını ve verilerini kalıcı olarak silebilirsin.

7) ÇOCUKLAR / GÜVENLİK
Belirlenen yaş altına yönelik değildir. Şifreler şifreli saklanır; erişim RLS ile sınırlanır.

8) DEĞİŞİKLİKLER
Politikayı güncelleyebiliriz; önemli değişiklikleri uygulama içinde bildiririz.

Sorular: [İLETİŞİM E-POSTASI]`;

export const SARTLAR_METNI = `MEVZU — KULLANIM ŞARTLARI

Uygulamayı kullanarak bu şartları kabul edersin. Sunan: [GELİŞTİRİCİ/ŞİRKET ADI].

1) HİZMET ve SORUMLULUK REDDİ
Mevzu, JSPS sınavına hazırlık için görsel hafıza kartları, tekrar sistemi ve eğitim araçları sunar.
Bir çalışma aracıdır; SINAVI KAZANACAĞINI GARANTİ ETMEZ. İçerikler bilgilendirme amaçlıdır,
resmi/hukuki danışmanlık değildir; güncel resmi mevzuat esastır.

2) HESAP
Doğru bilgi vermek ve hesabını korumakla yükümlüsün; hesabınla yapılan işlemlerden sorumlusun.

3) İÇTİMA ALANI (KULLANICI İÇERİĞİ)
Paylaştığın içerikten SEN sorumlusun. YASAK: hakaret, taciz, tehdit, nefret söylemi, zorbalık;
müstehcen/yasa dışı içerik, spam, reklam, dolandırıcılık; başkasının kişisel verisi; telif ihlali;
sınav güvenliğini ihlal eden paylaşımlar. Uygunsuz içeriği RAPORLAYABİLİR, kullanıcıları
ENGELLEYEBİLİRSİN. Raporlar makul sürede (hedef 24 saat) değerlendirilir.

4) MODERASYON
Şartları ihlal eden içeriği kaldırma, hesabı uyarma/askıya alma/kapatma hakkımız saklıdır.

5) FİKRİ MÜLKİYET
Mevzuat metinleri kamuya açıktır. Özgün görseller, karikatürler, tasarım, marka ve yazılım
[GELİŞTİRİCİ/ŞİRKET ADI]'na aittir; izinsiz kopyalanamaz. Filigranlı görsellerin yetkisiz paylaşımı yasaktır.

6) ÜCRET
Uygulama şu an ücretsizdir. İleride ücretli özellik eklenirse önceden bilgilendirilir.

7) SORUMLULUĞUN SINIRI
Uygulama "olduğu gibi" sunulur. Hukukun izin verdiği ölçüde dolaylı zararlardan sorumlu değiliz.

8) FESİH
Hesabını dilediğin an silebilirsin. Şartları ihlal halinde erişimini sonlandırabiliriz.

9) UYGULANACAK HUKUK
Türkiye Cumhuriyeti hukuku uygulanır.

İletişim: [İLETİŞİM E-POSTASI]`;
