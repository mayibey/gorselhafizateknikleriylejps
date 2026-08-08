# AGENTS.md — Mevzu JSPS (Görsel Hafıza Teknikleriyle JSPS)

Bu dosya, bu depoda çalışan **her yapay zekâ ajanı** içindir (Antigravity/Gemini, Claude Code,
Cursor…). Kod yazmadan önce burayı oku. Ayrıntılı proje kuralları `CLAUDE.md` dosyasındadır ve
bu dosyayla birlikte geçerlidir; çelişki olursa **`CLAUDE.md` üstündür**.

> ⚠️ **Bu depo HERKESE AÇIK (public).** Buraya sunucu adresi, e-posta, anahtar, hesap kimliği,
> müşteri bilgisi **YAZMA**. Operasyonel/gizli bilgi `.agents/` klasöründedir ve `.gitignore`
> ile dışarıda tutulur — oradaki hiçbir şeyi bu depodaki dosyalara kopyalama.

## Ürün ne?

Türk Jandarma/Sahil Güvenlik personelinin JSPS sınavına hazırlandığı mobil uygulama
(iOS + Android, yayında). Farkı: her kanun maddesi için **tek görsel hafıza infografiği**
(başlık + tematik sahne + etiketli çıkarımlar + "AKLINA ÇİVİLE" özeti) + aralıklı tekrar (SRS)
+ sesli anlatım. Ayrıca oyunlaştırma (14 oyun), deneme sınavları ve 1v1 düello ("Er Meydanı").

Yan ürün: aynı içeriği kullanan bir **Telegram topluluk botu** (ayrı depo, özel).

## Yığın ve komutlar

- Expo SDK 54, React Native 0.81.5, TypeScript (strict), expo-router, expo-sqlite (native),
  AsyncStorage; sunucu tarafı Supabase (Postgres + Storage + Edge Functions).
- `npx expo start` · `npx expo start --web` · `npx tsc --noEmit` (tip denetimi)
- `npm run gorsel:uret` (görsel registry codegen) · `npm run oyun:uret` (oyun HTML codegen)
- Sürüm **SABİT**: Expo SDK 54. `expo`, `react-native`, `expo-router`, `reanimated` gibi
  çekirdek sürümleri **DEĞİŞTİRME** (iPhone Expo Go uyumu). Gerekiyorsa önce keşif + açık onay.
- Expo API'si sürüme göre değişir: kod yazmadan önce **SDK 54** dokümanına bak —
  <https://docs.expo.dev/versions/v54.0.0/>. (Bu dosyanın eski hâli v56 diyordu; **YANLIŞ**,
  bu proje 56'ya çıkmıyor.) Çekirdek pinler: expo ~54.0.35 · react-native 0.81.5 ·
  react/react-dom 19.1.0 · expo-router ~6.0.24 · reanimated ~4.1.x · typescript ~5.9.2.

## Bozulmaz mimari kurallar

1. **Veri katmanı platforma bölük.** `database.web.ts` (bellek içi) / `database.native.ts`
   (SQLite). Web tarafına expo-sqlite **hiç** import edilmez.
2. **4-dosya senkron kuralı.** Yeni public DB fonksiyonu eklenince DÖRDÜ birden güncellenir:
   `types.ts` + `database.d.ts` + `database.native.ts` + `database.web.ts`. Web ve native
   **aynı** sonucu üretmeli.
3. **Saf mantık dosyalarına dokunma:** `lib/srs.ts`, `lib/queue.ts`, `lib/kanun-kartlari.ts`,
   `bugunISO()`. Hem web hem native bunları çağırır → parite garantisi buradan gelir.
4. **İki çalışma modu karıştırılmaz.** Karargâh "Etüt" = zayıf havuz (yanlış yapılanlar).
   Mevzuat → kanun = o kanunun tüm kartları (yeni öğrenme).
5. **SRS kullanıcının ilerlemesidir, kutsaldır.** Göç (migration) kullanıcı verisini KORUR;
   referans veri idempotent yüklenir (`INSERT OR IGNORE/REPLACE`).
6. **Üretilen dosyalar elle düzenlenmez:** `src/assets/kart-gorselleri.ts`,
   `src/assets/oyun-merkezi-html.ts` codegen çıktısıdır. Kaynağı düzenle, üreteci çalıştır.

## Çalışma biçimi (bu projede uyulan usul)

- **Önce keşif, sonra düzeltme.** Her değişiklikten önce "kod değiştirmeyen, sadece rapor
  eden" bir inceleme yapılır. Keşifsiz düzeltme YOK.
- **Doğrulamadan varsayma.** Rakam/durum söylemeden önce ÖLÇ. Bu projede en pahalı hatalar
  ölçüm aracının kendisinin bozuk olmasından çıktı — önce ölçen şeyi doğrula.
- **Otomatik build/start yapma.** Dosyaları yaz; derlemeyi/çalıştırmayı sahibi yapar.
- **İçerik uydurma.** Gerçek kanun metni gerekiyorsa resmî kaynaktan gelir; uydurulmaz.
- **Commit disiplini:** her iş açıklayıcı Türkçe mesajla commit + `master`'a push. Mantıken
  ayrı işler ayrı commit. Mesajda NEDEN'i yaz, sadece NE yapıldığını değil.
- **Her iş sonrası `PROJE_DURUM.md` güncellenir** (ne yapıldı, hangi commit, yeni karar/sorun).
- Bitirince `npx tsc --noEmit` **0 hata** + gerekiyorsa 4-dosya senkron teyidi.
- Dal yalnızca **`master`**.

## Marka teması (sabit — KREM PREMIUM)

lacivert `#0B1F3A` · lacivert2 `#173B6B` · ana metin `#1B2A4A` · kırmızı `#C00000` (yalnız
aksiyon/uyarı) · krem zemin `#F7F3EA` · kart kremi `#FFFCF5` · kenarlık `#E7DCC7` · ayırıcı
`#EFE6D6` · soluk metin `#6E6047` · altın `#C9A227` · altın koyu `#B88917` · altın soluk yüzey
`#F3E7C1` · ilerleme `#C9A227`/track `#EDE3CF` · ten `#E8C9A8` · yeşil `#2E7D32` · amber
`#8A5A12`. Yazı tipleri (`AppText` variant'ları): başlık → Playfair Display 700; altBaşlık →
Inter 800; gövde → Inter 700; küçük → Inter 500; etiket → Inter 600.
Sabitler: `MaxContentWidth=800`, `CardFlowMaxWidth=460`.

## Ekran adları (terminoloji)

Karargâh (ana) · Mevzuat (kanun listesi) · Talim (deneme sınavları) · Oyunlar (Er Meydanı dahil)
· Sicil (profil) · Kart Akışı (`/akis`).

## Daha fazlası

`.agents/rules/` klasöründe **nasıl çalıştığımız, yayın süreçleri, sunucu tarafı, geçmiş
tuzaklar** yazılıdır (git'e girmez, yereldedir). Bir işe başlamadan önce `.agents/hafiza/MEMORY.md`
dizinine bakıp ilgili notu oku — o notlar gerçek vakalardan çıkarılmış derslerdir ve aynı
hatayı ikinci kez yapmayı önler.
