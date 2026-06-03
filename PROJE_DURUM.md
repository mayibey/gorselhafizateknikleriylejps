# PROJE DURUM — Görsel Hafıza Teknikleriyle JSPS

> Bu dosya projenin "seyir defteri"dir. Yeni bir Claude sohbeti açtığında bunu yapıştır → kaldığın yerden devam.
> **KURAL: Her iş/düzeltme sonrası bu dosya güncellenir (farz).** Ne yapıldı, hangi commit, yeni karar/sorun eklenir.
> Son güncelleme: 3 Haziran 2026

---

## 1. Nerede kaldık (özet)
Çalışan bir iskelet var: 4 sekmeli navigasyon, gerçek SRS döngüsü, gerçek TCK görselleri, kanun seçip çalışma, branş sistemi + onboarding + DB migration. **Mevzuat artık 66 gerçek kanun başlığıyla dolu (25 müşterek + 41 jandarma, `51ab4bb`); kartlar TCK hariç boş ("yakında").** Android EAS build config de hazır (`e256f95`, profiller: preview/development/production). Sırada: içerik maratonu (49 TCK görselini gerçek kartlara bağlamak).

Geliştirme web'de yürüyor (`npx expo start --web` → localhost). **iPhone Expo Go artık çalışıyor** — bunun için proje SDK 54'e indirildi (`88983ca`; Apple App Store'daki Expo Go en fazla SDK 54 destekliyor). VirtualView/onModeChange hatası gitti.

---

## 2. Tamamlanan fazlar (commit geçmişi, master)
- `284c73d` Initial commit (create-expo-app)
- `14bc0e3` İlk iskelet: tema, 4 sekme, Kart Akışı, SQLite + Leitner SRS
- `17317ad` Fix: web SQLite wasm çözümleme — veri katmanı .web/.native ayrımı
- `9affa4c` Günlük çalışma döngüsü: due-kart kuyruğu (getDailyQueue), UPSERT SRS, Karargah canlı sayılar, Bugünlük bitti
- `ebe279b` Kart Akışı: getDailyQueue akışı + ortalı telefon kolonu (maxWidth 460), ScrollView + pinli buton bandı
- `32af324` Görsel sistemi: 49 TCK görseli temiz şemaya, codegen registry, StudyCard tek-görsel + fallback, m1 seed
- `aecb4f0` Mevzuat ekranı: kanun listesi (Müşterek/Branş + kart sayısı), kanun modu (getCardsByLaw), akış başlığında madde no + ad
- `d95b129` Branş sistemi: branches/law_branches (M2M), AsyncStorage branş kaydı, `PRAGMA user_version` migration runner (SRS korunur, referans veri idempotent), onboarding + branş değiştirme, `getLaws(bransSlug)` + `getBranches()`, Mevzuat branş filtresi; hafıza dosyaları (CLAUDE.md, PROJE_DURUM.md)
- `e256f95` Android EAS build config: eas.json (3 profil), android.package com.mayibey.jsps, expo-dev-client, name/slug düzeltme, EAS projectId
- `87b4d91` docs: JSPS mevzuat listesi PDF (seed kaynağı)
- `51ab4bb` Mevzuat seed: gerçek JSPS listesi (25 müşterek + 41 jandarma = 66 kanun), TCK id1 pinli, law_branches jandarma eşlemesi, MEBS/Mali placeholder kaldırıldı, v2 migration (referans veri re-seed, srs korunur)
- `88983ca` **SDK 56 → SDK 54 tam downgrade**: iPhone Expo Go uyumu (Apple App Store'daki Expo Go en fazla SDK 54). RN 0.81.5, expo 54.0.35, router 6, worklets 0.5.1, reanimated 4.1, typescript 5.9.2. node_modules+lock sıfırdan kuruldu (tek RN 0.81.5, ERESOLVE'suz). 4 şablon dosyada tip uyumu düzeltmesi (external-link Href, collapsible SymbolView, use-theme ColorSchemeName, animated-icon absoluteFillObject) — çekirdek mantık (database/srs/queue/kanun-kartlari/ekranlar) dokunulmadı. Web + iPhone test edildi: VirtualView hatası gitti.
- `f1962a6` docs: SDK sabiti 56 → 54 (CLAUDE.md sürüm pinleri + PROJE_DURUM downgrade notu)
- `947fd1c` **İstatistik Faz A**: `lib/stats.ts` (yeni saf dosya — `hesaplaIstatistik`: çalışılan/öğrenilen/hazırlık%/kutu dağılımı; öğrenildi = kutu≥4), `getCardCount` (4-dosya senkron). Karargah hazırlık % gerçeğe bağlandı, nöbet serisi geçici `—` (streak Faz B'de). Sicil: İLERLEME + KUTU DAĞILIMI kartları (placeholder kalktı). Web/native parite: stats yalnız kutu≥1 (çalışılmış) kart üzerinden. external-link typedRoutes regresyonu (`Extract<…,string>`) düzeltildi. Şema değişmedi (SCHEMA_VERSION=2).

## 3. Devam eden iş
- **İstatistik Faz A tamamlandı (`947fd1c`)**: Karargah hazırlık % + Sicil ilerleme/kutu dağılımı gerçeğe bağlı. **Sırada Faz B — Nöbet serisi (streak)**: şema değişikliği gerektirir (srs'te çalışma günü tutulmuyor) → `study_days` tablosu (`gun TEXT PK`), `recordReview`'da `bugunISO()` ekle, `SCHEMA_VERSION` 2→3 migration (srs korunur), `lib/stats.ts`'e saf `hesaplaStreak`, Karargah "Nöbet serisi" `—` yerine gerçek değer. İsteğe bağlı: `(gun, adet)` ile "bugün çalışılan kart".
- Diğer açık iş: **içerik maratonu** — TCK 49 görselini gerçek kartlara bağla (madde no + başlık + anlatım), sonra diğer müşterek + jandarma kanunlarının içeriği. (Şu an toplam 4 kart → hazırlık % paydası küçük; içerik artınca anlamlanır.)

## 4. Backlog (planlı işler, sıra kabaca)
- Tatbikat ekranı (quiz/sınav sistemi) — kartlardan otomatik soru, çıkmış sorular kategorisi
- Sicil ekranı istatistikleri: hazırlık % + çalışılan/öğrenilen + kutu dağılımı ✅ (`947fd1c`, Faz A). Kalan: streak (Faz B), çalışılan saat (zaman ölçümü yok — büyük iş).
- Ses entegrasyonu (Faz 4): expo-audio kart anlatımı + "Sesli Nöbet" (arka arkaya, kilit ekranı). Otomatik başlama kararı verilecek (öneri: otomatik başlamasın).
- Karargah metrikleri: Hazırlık % gerçeğe bağlandı ✅ (`947fd1c`). Kalan: Nöbet serisi (streak, Faz B — şu an `—`).
- Dikey ekran kilidi (yatay mod kapat)
- **İçerik maratonu**: 49 TCK görselini gerçek kartlara bağla (her birine madde no + başlık + anlatım metni). Sonra 65 gerçek kanun. Önce Müşterek + Jandarma.
- Development build (Faz 6): Expo Go/ngrok derdini kökten çözer, telefonda kendi uygulaman gibi açılır
- Görseller 1100'e çıkınca: Git LFS veya CDN/release asset (repo şişmesini önle) — radarda

## 5. Bilinen sorunlar / notlar
- **Web bellek-içi**: her yenilemede SRS sıfırlanır, tüm kartlar tekrar "yeni" olur. Normal, web önizleme kısıtı. Telefonda native SQLite kalıcı.
- **Telefonda eski veri**: native SQLite ilk açılışta tohumlanıyordu, yeni seed görünmüyordu → DB migration turu bunu çözüyor.
- **ngrok tünel Windows'ta çalışmıyor** (global PATH bug). `--tunnel` "Install and try again" döngüsüne giriyor. Telefon testi için kalıcı çözüm: development build. Şimdilik web yeter.
- Görseller 112 MB (49 TCK) repoda; LFS/CDN ileride.

## 6. Mimari kararlar (neden)
- **Veri katmanı .web/.native ayrımı**: Metro derleme-zamanı import'a göre paketler; tek dosyada expo-sqlite import'u web'e de sızıp wasm hatası verir. Çözüm: ayrı platform dosyaları, ortak saf mantık.
- **"srs kaydı yok = yeni kart"** + recordReview UPSERT: Anki/Leitner standardı, init'te srs tohumlama yok.
- **İki mod ayrımı**: günlük tekrar (due+yeni) vs kanun-bütünü çalışma (due filtresiz) — kullanıcı "TCK'yı çalışayım" derken hepsini ister.
- **Görsel registry codegen**: Metro dinamik require çözmez; 1100 require elle yazılamaz → klasör taranıp registry üretilir, runtime statik kalır.
- **Branş many-to-many**: bir kanun birden çok branşta ortak olabilir → junction tablo (tek kolon yetmez).
- **Migration = user_version runner** (DB adı yükseltme DEĞİL): kullanıcının SRS ilerlemesi korunsun.
- **Branş storage = AsyncStorage** (SQLite settings değil): web'de de kalıcı, onboarding her yenilemede tekrar çıkmasın.
- **Alt sınıf (subay/astsubay) şimdilik yok**: YAGNI, sadece ana branş.
- **SDK 54'te sabit (56 değil)**: iPhone App Store'daki Expo Go en fazla SDK 54 destekliyor (Apple inceleme gecikmesi). 56'da telefonda test imkânsızdı → tüm ekosistem 54'e indirildi (`88983ca`). SDK 56'ya çıkma; çıkılırsa iPhone Expo Go bağlanamaz. Detay/pinler CLAUDE.md "SÜRÜM SABİT" maddesinde.

## 7. İş akışı kuralları (özet — detay CLAUDE.md'de)
- Her değişiklikten önce KEŞİF, sonra FIX. Keşifsiz fix yok.
- 4-dosya senkron (types/d.ts/web/native). Mantık dosyalarına (srs/queue/kanun-kartlari) dokunma.
- Claude Code otomatik build/start yapmaz; içerik üretmez (placeholder).
- Her başarılı iş → commit (açıklayıcı TR mesaj) + master'a push. Geçmiş okunaklı.
- **Her iş sonrası bu dosyayı güncelle.**

## 8. Branş listesi (16) ve kapsam
Jandarma, MEBS, Havacılık, Personel, Maliye, İstihkam, İkmal, Bakım, Bando, Tabip, Diş Tabibi, Eczacı, Sağlık, Kimyager, Veteriner, Mühendis. + Müşterek (25 mevzuat, herkese). Toplam ~65 kanun, ~950-1100 öğretim birimi.

## 9. İçerik varlığı
- TCK: 49 görsel hazır (`assets/kartlar/tck/`), 4 panelli kare format, künye görselin içinde. Şu an sadece m1 seed'e bağlı; gerisi içerik turunda bağlanacak.
- Diğer kanunlar: görsel/metin henüz yok (üretilecek).
- Maskot: Jandarma Cüneyt (mavi bere, tek yıldız, jandarma amblemi). Kart yapısı: olay → sorun → Cüneyt+kanun → sonuç.
