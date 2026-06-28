# 00 — RİSK REGISTER (Güvenlik · İş · Mağaza · İçerik)

> 11 rapor + `00_EKSIKLER` sentezi. Olasılık/Etki: D(üşük)/O(rta)/Y(üksek). "Sahip" = işi sürükleyecek
> rol (tek geliştirici projesinde başkan/geliştirici aynı kişi olsa da sorumluluk netleşsin diye).
> Sıra: skor (Olasılık×Etki) + aciliyet. Kanıt için ilgili rapora atıf.

## A) MAĞAZA / UYUMLULUK riskleri

| # | Risk | Olas. | Etki | Azaltım | Sahip |
|---|------|-------|------|---------|-------|
| M1 | **Yanıltıcı/işlevsiz özellik reddi** — Bildirim no-op + "kuruldu" mesajı; mağaza metni "SRS/aralıklı tekrar" derken motor sürmüyor. Google "deceptive/non-functional feature". | Y | Y | SRS'i bağla [V1]; bildirimi gizle/dürüstleştir [V2]; iddia↔gerçek denetimi [V9]. *(02 B1; 05 P0-1.)* | Ürün |
| M2 | **KVKK/Data Safety çelişkisi** — ödeme/üyelik açılınca "veri toplanmıyor" beyanı yalan olur (Supabase EU = yurt-dışı aktarım); hesap-silme yoksa red. | O (v2'de Y) | Y | FAZ3 atomik paketi: KVKK metni + açık rıza + hesap silme (app-içi **+ web URL**) + Data Safety; ödeme PR'ı ile birlikte yayınla. *(08 B3 + kırmızı-takım; 07 B10.)* | Ürün/Hukuk |
| M3 | **"Yarım app" izlenimi** — Tatbikat baştan kilitli + iki "Çok yakında" branş yüzeyi; reviewer subjektif olumsuzluk. (Tek başına hard-red DEĞİL.) | O | O | Tatbikat kilidini düşür + Branş'ı v1'de gizle [V6]. *(02 B2/B3; 03 — kırmızı-takım: P2.)* | Ürün |
| M4 | **Play Billing dışı ödeme / restore eksikliği** — dijital içerikte harici ödeme yasak; restore Play-zorunlu. | D (v2) | Y | Yalnız `requestPurchase`; açılışta `getAvailablePurchases` + manuel "geri yükle" butonu. *(07 B7/B9.)* | Ödeme |
| M5 | **iOS Apple Sign In / StoreKit sürprizi** — iOS'a çıkılırsa Guideline 4.8 + ayrı makbuz yolu son anda red. | O (iOS dahilse) | Y | KARAR: iOS hedefi var mı? E-posta+şifre 4.8'i karşılayabilir (Apple opsiyonel olur); entitlement baştan çift-platform. *(08 B6 + kırmızı-takım; 09 KIRMIZI-6; 00_EKSIKLER E1.)* | Ürün |

## B) GÜVENLİK riskleri

| # | Risk | Olas. | Etki | Azaltım | Sahip |
|---|------|-------|------|---------|-------|
| S1 | **İçerik koruması yayına kapalı** — FLAG_SECURE=false; telif'li kart SS/kayıt engellenmiyor; koruma yalnız `/akis`'te. | Y | O | `EKRAN_KORUMA_AKTIF=true` + sınav/madde-sheet/sesli-nöbete genişlet [V4]. *(02 K5; 06 ATLAMA-1.)* | Geliştirici |
| S2 | **"%100 offline" ile çelişen canlı endpoint** — `.env` Supabase URL+anon key release bundle'a literal inline; allowBackup açık (yedek vektörü). | O | O | `.env` boşalt + `allowBackup=false` [V8]; RLS doğrulaması (v2, 09). *(06 P1×2.)* | Geliştirici |
| S3 | **Gelir kaçağı — istemci entitlement / gömülü içerik** — premium bayrağı client'ta = smali yaması; 1.5 GB APK'da gömülü = klon %100 çalışır. | Y (v2) | Y | HARD-GATE: FAZ2 içerik→sunucu; entitlement sunucu-otorite + imzalı-URL Edge Function; FAZ2 bitmeden ödeme açma. *(10 P0-1; 07 KG3; 00_EKSIKLER D1.)* | Backend |
| S4 | **Maliyet/abuse saldırısı** — Supabase REST/Storage/Edge'de per-user rate-limit yok; imzalı-URL döngüsü egress faturasını uçurur; Edge'in kendisi DoS hedefi. | O (v2) | Y | Spend-cap + bütçe alarmı (HEMEN); **atomik** kota (TOCTOU); **upstream IP-limit fonksiyondan ÖNCE**; JWKS yerel-doğrula. *(09 B3/KIRMIZI-3/4/5/B9.)* | Backend |
| S5 | **service_role / secret sızıntısı** — tek sızıntı tüm veri + entitlement + içerik dump. | D | Y | Yalnız Edge secret; `EXPO_PUBLIC_*` prefix ASLA; gitleaks; 2-3 fonksiyona sınırla; rotasyon prosedürü. *(09 B4.)* | Backend |
| S6 | **Hesap paylaşımı (tek hesap N kişi)** — kapalı meslek grubunda #1 gerçek gelir tehdidi; cihaz-kimlik `Math.random`, reinstall'da sıfırlanır. | Y (v2) | O | Tek-oturum (`aktif_oturum` + AppState + Edge guard) + cihaz limiti (2 + tolerans) + filigran→user-id. (Ucuz, yüksek ROI — ağır şifrelemeden önce.) *(08 B2; 10 P1-4 + kırmızı-takım.)* | Backend |
| S7 | **At-rest cache şifreleme tuzağı** — erken yapılırsa expo-image/audio şifreli dosya okuyamaz → decrypt-to-temp düz sızar + performans borcu; offline+anahtar-cihazda zaten rootlu sahibi durdurmaz. | O | D | P0/P1'DE YAPMA; birincil savunma = private bucket + imzalı-URL + RLS + Integrity + filigran; v2'de yalnız-ses opsiyonel. *(11 B8; 10 P0-2; 00_EKSIKLER C3 — 11 kazanır.)* | Backend |
| S8 | **Misafir→hesap SRS göç çakışması** — girişsiz biriken SRS ile bulut çakışması tanımsız → ilerleme kaybı/çift-sayım ("SRS kutsal" ihlali). | O (v2) | O | FAZ3'te idempotent merge tasarımı (`max(kutu,son_tarih)`, tek-yön ilk-yükleme, RLS own_rows); soft-gate bu iş bitmeden verilmesin. *(08 kırmızı-takım; 00_EKSIKLER E2.)* | Backend |

## C) İÇERİK / PEDAGOJİ riskleri

| # | Risk | Olas. | Etki | Azaltım | Sahip |
|---|------|-------|------|---------|-------|
| C1 | **Yanlış madde metni** — `Jandteskyon m.25` kartı m.26/27/29/32/33 gösteriyor; m.25 yok → yanlış öğrenme. | Y (mevcut) | O | MM-override ile doğru m.25 metni [V3a]. *(04 B1.)* | İçerik |
| C2 | **Sistemik çok-maddeli birleştirme** — `madde:uret` blok sonuna kadar maddeleri topluyor (m.52=5 madde); "kart=madde" bozuk; "6 kayma" tabandır. Disiplin m.8 fıkra (1)-(6) eksik. | Y (mevcut) | O | `madde:uret` kök-neden düzelt + yeniden üret + başlıksız 209'u örnekle [V3b/c/d]. *(04 B2/B5 + kırmızı-takım.)* | İçerik |
| C3 | **SRS sürmüyor → düşük tutma** — due kart otomatik dönmüyor; ters teşvik dürüstlüğü cezalandırıyor → "çok çalıştım ama olmadı" + itibar/iade. | Y | O | SRS'i bağla [V1] + ceza modelini çerçevele [V5] + aktif retrieval [P1-a]. *(05 P0-1/P0-2/P1-5.)* | Ürün |
| C4 | **Kapsam ↔ vaat boşluğu** — "JSPS branş sınavı" deniyor ama branş 41 kanun (id 26-66) içeriksiz; Mevzuat'ta sessizce gizli. | O | O | Mağaza kapsamını "v1: müşterek mevzuat" diye net beyan et; branş içeriğini v1.x fazla. *(05 P1-6 + kırmızı-takım B.)* | Ürün/İçerik |
| C5 | **Premium/ücretsiz sınırı içerik-gerçeğiyle eşlenmemiş** — branş boşken müştereki paraya kapatırsan "ödeyen ne alıyor" belirsiz → iade/churn. | O (v2) | O | Ödeme öncesi KARAR: tadımlık kapsam (her kanundan ilk N kart / 1 tam kanun) + `is_free` haritası. *(00_EKSIKLER E6.)* | Ürün |

## D) MÜHENDİSLİK / SÜREÇ riskleri

| # | Risk | Olas. | Etki | Azaltım | Sahip |
|---|------|-------|------|---------|-------|
| E1 | **Test boşluğu** — parite/"SRS kutsal" cihaz-içi tespite mahkûm; 6 faz regresyon riski. | Y | O | jest + web↔native parite + SRS kutu-geçiş smoke [V10]; faz işleri üstüne otursun. *(01 P1; 00_EKSIKLER E5.)* | Geliştirici |
| E2 | **Boot-crash / DB kilidi** — seed `m![1]` non-null assertion (yeni PNG anahtarı boot'ta çökertir); `initDatabase` reddi kalıcı kilit. | O | Y | seed regex skip-guard; `initDatabase` reddinde `hazir=null` [P1-g]. *(01 P2 + kırmızı-takım: P1↔P2 ters.)* | Geliştirici |
| E3 | **Yarım SDK/sürüm değişikliği** — ödeme native modülü + transitif sürümler `expo-asset 12.0.13` pinini/SDK54'ü kırarsa standalone build çöker. | O (v2) | Y | Kesin sürüm pin (caret değil) + ayrı dev build doğrula + `expo-doctor`; yarım bırakma. *(07 R2; 11 B4; CLAUDE.md SÜRÜM SABİT.)* | Geliştirici |
| E4 | **WebP pipeline neden yarım kaldı** — 371 PNG + 194 WebP; sebep (kalite reddi? OOM?) bilinmeden codegen'e girmek manifest+çözümleyiciyi kırar (karışık uzantı). | O | O | Önce sebebi bul, sonra normalize, sonra ext-aware codegen; FAZ2'den önce. *(11 KT1/KT3/E7.)* | Geliştirici |
| E5 | **Sıra ihlali / P0 enflasyonu** — FAZ2'den önce ödeme/anti-piracy'ye girmek = boşa emek; "her şey P0" gerçek v1-blokerlerini gölgeler. | O | O | P0'ları "v1" / "aktivasyon" diye ayır (bu register + yol haritası); HARD-GATE sırasını koru. *(00_EKSIKLER D1/D2 + meta.)* | Başkan |
| E6 | **Çözülmemiş teknik çelişki** — CDN-cache ↔ per-user imzalı-URL (birbirini etkisizleştiriyor); RevenueCat ↔ doğrudan-Play doc çelişkisi. | O (v2) | O | Karar ver: path-bazlı stabil URL + signed-cookie YA DA app-kota; Billing = doğrudan-Play, stale doc işaretle. *(00_EKSIKLER C4/C6; 09 KIRMIZI-1.)* | Backend |

## E) İŞ / STRATEJİ riskleri

| # | Risk | Olas. | Etki | Azaltım | Sahip |
|---|------|-------|------|---------|-------|
| B1 | **"2 günde ödeme" beklentisi** — gerçek MVP ~5-6.5g + FAZ2/FAZ3 ön-şartı; korumasız kapıya kilit. | Y | Y | Beklentiyi düzelt: 2 gün = bürokrasi+iskele+karar başlangıcı; v1'i önce yayınla. *(07 maliyet; 00_EKSIKLER D1.)* | Başkan |
| B2 | **Offline ↔ sunucu-otorite çatışması** — "%100 offline" beyanı premium gating internet şartıyla çelişir; kışla/saha kötü offline = churn. | O (v2) | O | Net politika: ücretsiz offline, premium ilk-indirme-sonra-offline; Data Safety buna göre. *(10 Riskler; 11 B6; 00_EKSIKLER E8.)* | Başkan |
| B3 | **Kararlı saldırgan kaçınılmazlığı** — gerçek cihaz + meşru abonelik = ekran/bellek-dump ile içerik er-geç çıkar; "kimse kullanamasın" mutlak imkânsız. | Y | D | Hedefi netle: toplu/kolay korsanlığı kır, maliyeti abonelik üstüne çıkar; başkanla açık konuş. *(10 Riskler.)* | Başkan |
| B4 | **Supabase tek-satıcı bağımlılığı** — auth+db+storage+functions tek noktada; kesinti/fiyat. | D | O | Makbuz = gerçeğin kaynağı (entitlement DB türev, yeniden inşa edilebilir); PITR/pg_dump yedek. *(09 B10.)* | Backend |

---

## En kritik 7 (skor + aciliyet)
1. **M1** Yanıltıcı özellik reddi (SRS/bildirim) — v1 blokeri, hemen [V1/V2/V9].
2. **S3** Gömülü içerik → ödeme kozmetik — HARD-GATE, para zincirinin kökü.
3. **M2** KVKK/Data Safety — v2 aktivasyonun mağaza blokeri [FAZ3].
4. **C1/C2** İçerik hataları — mevcut, yanlış öğrenme [V3].
5. **S1** FLAG_SECURE kapalı — tek bayrak, telif koruması [V4].
6. **S6** Hesap paylaşımı — v2 #1 gelir tehdidi, ucuz azaltım.
7. **B1/E5** "2 gün" beklentisi + sıra ihlali — yanlış aciliyet en büyük süreç riski.
