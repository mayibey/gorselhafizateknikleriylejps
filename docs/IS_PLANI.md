# İş Planı — Kullanıcı Tespitleri (saha testi)

> Başkan'ın telefonda/kullanımda gördüğü, düzeltilmesi gereken yerler. Sırayla eklenir.
> Durum işaretleri: ⬜ bekliyor · 🔧 üzerinde · ✅ bitti (commit) · ⏸️ ertelendi
> Bağlam: 14 gün kapalı test penceresindeyiz; düzeltmeler biriktirilip vCode 6'da gönderilecek.
> (Ayrıca bkz. PROJE_DURUM.md → ajan denetimi punch-list'i: Tier 1-4.)

| # | Durum | Tespit | Not / yapılacak |
|---|-------|--------|-----------------|
| 1 | ⬜ | **Gmail ile giriş ZORUNLU olacak** | ⚠️ Politika etkisi büyük: şu an giriş opsiyonel + `UYELIK_AKTIF=false` (%100 offline). Zorunlu yapınca gizlilik metni + **hesap silme** + Data Safety güncellenmeli (önceki denetim Ü1/Ü2/Ü3 blocker'ları) + Supabase aktif → **mağaza yeniden inceleme**. #2 ile bağlı. Kod altyapısı (`lib/supabase`/`auth`/`giris.tsx`) hazır, parametre+evrak işi. |
| 2 | ⬜ | **İlerlemeler buluta yedeklenecek** | SRS + sicil + branş verisi Supabase'e sync (kullanıcı kimliğiyle). **#1'e bağımlı** (kimlik şart). Tablo + RLS tasarımı; çakışma/birden çok cihaz stratejisi. |
| 3 | ⬜ | **Çalışma kartları sağa/sola SÜRÜKLEYEREK ileri-geri** | Şu an kenarda ok butonları var (`akis.tsx`). Swipe jesti eklenecek (gesture-handler zaten kurulu — `GestureHandlerRootView`). **Saf görünüm: yalnız index, SRS'e dokunmaz** (oklarla aynı). |
| 4 | ✅ | **Görsel boyutu standart değil** → kart alanı kimi büyük kimi küçük → Sesli Anlatım + Madde Metni altta kalıp kaydırma gerekiyor | ✅ `study-card.tsx`: görsele `maxHeight = min(ekran×0.5, 460)` tavanı (gerçek oran+contain korunur, bozulma yok). Uzun görseller artık alttaki TtsBar+Madde Metni'ni itmiyor. **Telefonda göz ayarı:** çok uzun görselde yan boşluk fazlaysa tavan 0.5→0.55 ayarlanabilir. |
| 5 | ⬜ | **Uygulama logosu vb. güncellenecek** | Yeni görsel kullanıcıdan → `mevzu-icon-1024/512` + adaptive icon + feature graphic değişir → prebuild + build. **#12 (bildirim ikonu) ile birlikte yapılmalı.** |
| 6 | ⬜ | **Doğru görseller-doğru maddeler patikada güncellenmeli** | Görsel madde-no ≠ master madde-no uyumsuzlukları (6136 Ateşli, Bilgi Edinme → 0/4 metin; denetim Tier 4). `SEED_KAPSAM`/registry hizalama + kaynak görsel adlandırma. Migration re-seed. |
| 7 | ⬜ | **Ses metinleri kontrol → istenen ses dosyaları üretilecek** | Şu an TTS (`expo-speech`, cihaz sesi — dosya yok). `kart-ses-metinleri` gözden geçir → seçilen maddeler için gerçek ses dosyası (mp3) üret + registry. |
| 8 | ⬜ | **Ana ekran (Karargah) "bugünün görevi / hazırlık durumu" iyileştirilmeli** | Metrikler gerçek ama sunum/UX geliştirilebilir. Tasarım turu — ne gösterilsin, nasıl motive etsin. |
| 9 | ⬜ | **Rütbe seçimi eklenecek: Sb / Asb / Uzm** | Branş sistemine ek "rütbe" alanı (AsyncStorage), onboarding + değiştirme. (CLAUDE.md'deki "alt sınıf YAGNI" notu artık geçersiz — isteniyor.) İçeriği/filtreyi etkiler mi? karar. |
| 10 | ⬜ | **Sicil'e "Ayarlar" alanı** → bazı özellikler oraya taşınacak | Eğitim Planı, yasal metinler, branş/rütbe değiştir, (giriş/hesap) → tek "Ayarlar" ekranı. Sicil sadeleşir. |
| 11 | ⬜ | **"Ödül-Ceza Sicili" / "Sicil" → "Evsaf" olarak yeniden adlandırma** (öneri) | Terminoloji: sekme adı + başlıklar. Sadece etiket, mantık aynı. Karar: "Evsaf" mı başka isim mi. |
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
