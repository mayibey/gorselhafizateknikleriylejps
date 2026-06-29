# 00 — BAŞKAN KARARLARI (yol haritası override'ları)

> 29 Haz, başkanın yol haritasına (00_YOL_HARITASI.md) verdiği net kararlar. Çelişkide BU dosya kazanır.

## V1 — SRS / Aralıklı tekrar → **KALDIR** (bağlama YOK)
- Karar: Aralıklı tekrar zorunlu değil. **Mağaza listelemesinden "aralıklı tekrar/SRS" iddiası çıkar + ilgili ölü kodu sil.** (Yol haritası "Etüt'e bağla" diyordu → İPTAL, yerine temiz kaldırma.)
- Etki: ürün vaadi = görsel hafıza kartı + deneme sınavı. Karargah "Etüt/Geri Besleme" hero'su yeni ödül/ceza modeline göre yeniden tanımlanacak (aşağı V5).
- Not: `srs.ts` Leitner mantığı ödül-sicil için görünmez kalabilir mi yoksa tamamen mi çıkar → uygulama anında netleşir; mağaza iddiası kesin çıkar.

## V2 — Bildirim/Eğitim Planı → **GERÇEKTEN ÇALIŞTIR** (gizleme YOK)
- Karar: Günlük bildirim göndermeyi kaldırmak salaklık; **gerçek push bildirim kur.** (Yol haritası "gizle" diyordu → İPTAL.)
- Gerekenler (planlanacak): `expo-notifications` (lokal günlük hatırlatma — sunucusuz, hemen) + ileride sunucudan push (FCM, Supabase Edge/cron) — backend gelince. Standalone build + izin akışı + Android 13 POST_NOTIFICATIONS izni. NOT: standalone'da Firebase init dikkat (geçmişte çökme olmuştu — expo-asset notu).

## V3 — İçerik hataları → **DÜZELT** (onaylandı)
- m.25 override + `madde:uret` kök-neden + Disiplin m.8 + başlıksız kart taraması. (Değişiklik yok, plan aynı.)

## V4 — FLAG_SECURE → **YAPILACAK ama ACELE YOK** (zamanı var)

## V5 — Ödül/Ceza sistemi → **KOMPLE REVİZE** (yeni tasarım)
- **ÖDÜL:** Kullanıcı bir kanunu bitirip o kanunun **deneme sınavını %100 doğrulukla** çözünce → ekrana **TAKDİR BELGESİ** (görsel sertifika) çıkar + **Evsaf'a (sicil) işlensin** (kalıcı kayıt, görüntülenebilir).
- **CEZA:** "Bir şeyi bilmiyor" diye CEZA YOK. Bunun yerine sistem kullanıcıya bir **GERİ BESLEME PLANI** (yapılacak tekrar/görev listesi) verir; kullanıcı bu görevleri **belirli bir süre içinde icra etmezse** → **kademeli ceza** (sicile işlenen, artan derece). Yani ceza = "verilen görevi zamanında yapmama", bilgi eksikliği değil.
- Açık kararlar (uygulamadan önce netleşecek): geri-besleme görev süresi (kaç gün?), kademeli ceza dereceleri (kaç kademe, neler), takdir belgesinin tasarımı, %100 dışı (ör. %90) için ara ödül var mı.

## V6 — Branş & Tatbikat kilidi
- **Branş bölümü KALSIN/GÖRÜNSÜN.** (Gizleme İPTAL — neden: kullanıcı uygulamanın "bu kadardan ibaret" sandırmasın, kapsam genişliği görünsün.) Boş "çok yakında" yüzeyi daha şık bir "yakında" durumuna çevrilebilir ama gizlenmez.
- **Deneme sınavı kilidi KALDIRILSIN** (sınav her zaman açık). Açık soru (başkan sonra karar verecek): konuyu çalışmadan deneme çözdürmek mantıklı mı? → ŞİMDİLİK aç, ileride net karar.

## V8 — Offline/Güvenlik
- **"%100 offline" İDDİASI KALKACAK.** Hedef: tüm veri SUNUCUDA; kullanıcı oradan çeker; **telefona indikten sonra YALNIZ bizim uygulamada çalışacak şekilde saklanır**, dışarı alınması/çalınması engellenir (DRM/şifreli paket + cihaz-bağlama). (11 + 10 raporlarıyla uyumlu; client at-rest şifreleme limitleri 11 C3'te.)

## İleride değerlendirilecek (hafızada: ip-filigran-yasal-degerlendirme)
- Kullanıcı IP loglama yapılacak mı? (KVKK etkisi)
- Filigran-sızıntı tespitinde yasal süreç nasıl başlatılır? (FSEK + sözleşme + delil zinciri)
