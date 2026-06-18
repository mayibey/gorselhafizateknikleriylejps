# İş Planı — Kullanıcı Tespitleri (saha testi)

> Başkan'ın telefonda/kullanımda gördüğü, düzeltilmesi gereken yerler. Sırayla eklenir.
> Durum işaretleri: ⬜ bekliyor · 🔧 üzerinde · ✅ bitti (commit) · ⏸️ ertelendi
> Bağlam: 14 gün kapalı test penceresindeyiz; düzeltmeler biriktirilip vCode 6'da gönderilecek.
> (Ayrıca bkz. PROJE_DURUM.md → ajan denetimi punch-list'i: Tier 1-4.)

| # | Durum | Tespit | Not / yapılacak |
|---|-------|--------|-----------------|
| 1 | ⬜ | **Gmail ile giriş ZORUNLU olacak** | ⚠️ Politika etkisi büyük: şu an giriş opsiyonel + `UYELIK_AKTIF=false` (%100 offline). Zorunlu yapınca gizlilik metni + **hesap silme** + Data Safety güncellenmeli (önceki denetim Ü1/Ü2/Ü3 blocker'ları) + Supabase aktif → **mağaza yeniden inceleme**. #2 ile bağlı. Kod altyapısı (`lib/supabase`/`auth`/`giris.tsx`) hazır, parametre+evrak işi. |
| 2 | ⬜ | **İlerlemeler buluta yedeklenecek** | SRS + sicil + branş verisi Supabase'e sync (kullanıcı kimliğiyle). **#1'e bağımlı** (kimlik şart). Tablo + RLS tasarımı; çakışma/birden çok cihaz stratejisi. |
| 3 | ✅ | **Çalışma kartları sağa/sola SÜRÜKLEYEREK ileri-geri** | ✅ `akis.tsx`: `Gesture.Pan` (gesture-handler) kartı sarar. Sola çek→sonraki, sağa çek→önceki (eşik 45px). Yatay-only (`activeOffsetX`/`failOffsetY`) → tap hâlâ zoom açar, dikey kaydırma ScrollView'a kalır. `runOnJS`. **Yalnız index, SRS'e dokunmaz.** Oklar da duruyor. **Telefonda test:** swipe ile zoom-tap çakışmıyor mu doğrula. |
| 4 | ✅ | **Görsel boyutu standart değil** → kart alanı kimi büyük kimi küçük → Sesli Anlatım + Madde Metni altta kalıp kaydırma gerekiyor | ✅ `study-card.tsx`: görsele `maxHeight = min(ekran×0.5, 460)` tavanı (gerçek oran+contain korunur, bozulma yok). Uzun görseller artık alttaki TtsBar+Madde Metni'ni itmiyor. **Telefonda göz ayarı:** çok uzun görselde yan boşluk fazlaysa tavan 0.5→0.55 ayarlanabilir. |
| 5 | ⬜ | **Uygulama logosu vb. güncellenecek** | Yeni görsel kullanıcıdan → `mevzu-icon-1024/512` + adaptive icon + feature graphic değişir → prebuild + build. **#12 (bildirim ikonu) ile birlikte yapılmalı.** |
| 6 | ⬜ | **Doğru görseller-doğru maddeler patikada güncellenmeli** | Görsel madde-no ≠ master madde-no uyumsuzlukları (6136 Ateşli, Bilgi Edinme → 0/4 metin; denetim Tier 4). `SEED_KAPSAM`/registry hizalama + kaynak görsel adlandırma. Migration re-seed. |
| 7 | ⬜ | **Ses metinleri kontrol → istenen ses dosyaları üretilecek** | Şu an TTS (`expo-speech`, cihaz sesi — dosya yok). `kart-ses-metinleri` gözden geçir → seçilen maddeler için gerçek ses dosyası (mp3) üret + registry. |
| 8 | ✅ | **Ana ekran (Karargah) iyileştirme** | ✅ A) selamlama + branş/rütbe rozet çipleri · B) günlük hedef ilerleme çubuğu (Eğitim Planı hedefi, bugün X/Y kart + "bugün çalışılan") · C) zayıf mevzi kısayolu (zayıf kart varsa → /akis?mod=zayif) · D) hazırlık % çubuğu + nöbet serisi 🔥 alev. Kod-only, mevcut+rütbe+performans verisi. tsc + web export temiz. |
| 9 | 🔧 | **Rütbe seçimi + içerik filtresi (Sb/Asb/Uzm.J/Uzm.Erb)** | ✅ Altyapı: `rutbe-store`/`rutbe-context`/`rutbe-secici`, onboarding 2-adım, guard, /rutbe-sec, Ayarlar girişi. ✅ Filtre: `lib/rutbe-kapsam.ts > rutbeGorur` + Mevzuat'ta uygulanıyor. ✅ **MÜŞTEREK matris KİLİTLİ** (kullanıcı teyidi): istisna = law13 (4678) + law16 (Sözleşmeli S/A Yön) → uzmanlarda yok; gerisi 4 rütbe ortak. **BEKLEYEN (ayrı tur):** branş konularının rütbe matrisi — PDF'in branş bölümleri (`-table -enc UTF-8` okunuyor); branş içeriği henüz uygulamada yok, o gelince yapılır. |
| 10 | ✅ | **Evsaf'a "Ayarlar" alanı** → bazı özellikler oraya taşındı | ✅ `app/ayarlar.tsx`: Branş · Rütbe · (Hesap, hazir) · Eğitim Planı · Gizlilik&Şartlar. Evsaf'taki 4 dağınık giriş tek "Ayarlar" satırına indi (Evsaf sadeleşti, sadece istatistik+ödül-ceza). Orphan stiller temizlendi. |
| 11 | ✅ | **Sekme "Sicil" → "Evsaf"** (kullanıcı kararı: sekme adı) | ✅ Sekme etiketi (`_layout`) + ekran başlığı (`sicil.tsx`) + onboarding metni ("Evsaf'tan değiştirebilirsin") → "Evsaf". **Rota adı `sicil.tsx` ve tüm mantık/DB (`sicil_kayitlari` vb.) AYNI.** İçerideki "ÖDÜL-CEZA SİCİLİ" alt-başlığı korundu (sicil = disiplin kaydı anlamı). |
| 12 | ⬜ | **Bildirim simgesi (notification icon) düzeltilecek** | Android bildirim küçük ikonu. expo-notifications v1'de kaldırılmıştı (no-op) → bildirim geri gelince `app.json notification.icon` + plugin. **#5 logo ile birlikte.** |
| 13 | ⬜ | **Filigran her kullanıcıya ÖZEL olacak** (Gmail kimliğiyle) → görsel çalınırsa kimden sızdığı tespit edilebilsin | Altyapı HAZIR: `Watermark` bileşeni + `useCihazKimlik` zaten kart görsellerine tiled forensic filigran basıyor; şu an **cihaz-ID** kullanıyor. **#1'e bağlı**: giriş zorunlu olunca filigran kaynağını gerçek **user ID/e-posta**'ya çevir (bileşen aynı kalır, sadece kimlik kaynağı değişir). Küçük değişiklik. |
| 14 | ⬜ (sona) | **Tatbikat bölümü aktif + her kanuna ÖZEL sorular** | Quiz motoru HAZIR ama gizli (`lib/quiz.ts` + `/quiz`; A+B çoktan seçmeli, otomatik çeldirici). Aktif et + her kanuna **özel/gerçek sorular** hazırla (içerik işi). **Sıralamada sonlara** (kullanıcı kararı). Skor/yanlış kaydı kalıcılığı da burada. |

---

## Doğal kümeler (sıralama için)
- **A — Backend/üyelik (politika ağır, mağaza yeniden inceleme):** #1 + #2 + #13 → birlikte, ayrı bir faz (#13 filigran-kişiselleştirme #1 ile gelir).
- **B — Logo/ikon:** #5 + #12 → tek build'de.
- **C — İçerik:** #6 + #7 (+ #4 kısmen).
- **D — UX/akış (kod-only, hızlı kazanç):** #3 (swipe) + #4 (kart boyutu) + #8 (ana ekran) + #10 (Ayarlar) + #11 (Evsaf).
- **E — Kullanıcı modeli:** #9 (rütbe) — #10/onboarding ile temas eder.
- **F — Tatbikat:** #14 → **sona** (kullanıcı kararı).

## Önerilen sıra (taslak — kullanıcı onayına açık)
1. **D — UX/akış** (#3 swipe, #4 kart boyutu, #11 Evsaf, #10 Ayarlar, #8 ana ekran) — kod-only, risksiz, testçi hemen hisseder.
2. **E — Rütbe** (#9) — onboarding/#10 ile birlikte.
3. **B — Logo/ikon** (#5, #12) + **C — İçerik** (#6, #7) — kullanıcı materyali geldikçe, tek build'de.
4. **A — Backend/üyelik** (#1, #2, #13) — politika ağır, mağaza yeniden inceleme; test/onay oturunca.
5. **F — Tatbikat** (#14) — en son.
