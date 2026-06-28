# JSPS Uygulaması — Gece Değerlendirme Orkestrasyonu (DURUM/LOOP TAKİBİ)

> Bu dosya otonom gece-değerlendirme loop'unun BEYNİDİR. Oturum/token yenilenince
> buradan devam edilir. Başkan uyurken (29 Haz gecesi) tam yetkiyle başlatıldı.
> **KURAL: Uygulama koduna DOKUNMA — yalnız araştır/incele/planla. Tüm çıktı `docs/DEGERLENDIRME/`.**

## Amaç
A'dan Z'ye uygulama değerlendirmesi: tasarım, kod, içerik (madde metni doğruluğu),
mantık, kapsam, öğreticilik, güvenlik, ödeme altyapısı, üyelik/auth/tek-oturum, backend
savunma, anti-piracy (APK klon), sunucu+asset+offline entegrasyon, işe yaramayan/sahte
özellikler. Çok-ajanlı + karşı-görüşle (çoklu göz) doğrulanmış + sentezlenmiş.

## Çıktı dosyaları (docs/DEGERLENDIRME/)
- `00_YONETICI_OZETI.md` — sentez: özet + öncelikli yol haritası + en kritik bulgular + "wow" + risk register
- `01_KOD_MIMARI.md`
- `02_ISE_YARAMAYAN_BOZUK_OZELLIKLER.md`
- `03_TASARIM_UX.md` (+ alternatif tasarım yönleri; mockup'lar `tasarim/` alt klasörü)
- `04_ICERIK_MADDE_METNI.md` (madde metni doğruluğu + kısaltmalar + kanun↔görsel uyumu)
- `05_MANTIK_KAPSAM_OGRETICILIK.md`
- `06_GUVENLIK.md`
- `07_ODEME_ALTYAPISI.md`
- `08_UYELIK_AUTH_TEK_OTURUM.md`
- `09_BACKEND_SAVUNMA.md`
- `10_ANTI_PIRACY_APK_KLON.md`
- `11_SUNUCU_ASSET_OFFLINE.md`
- Her rapor: sonunda **KARŞI-GÖRÜŞ & DOĞRULAMA** bölümü (çoklu göz).

## Aktif çalışma (güncel)
- ✅ WF1 `wf_1367220f-b32` BİTTİ — 11 rapor + 11 karşı-görüş + eksiklik + sentez (00_YONETICI_OZETI/YOL_HARITASI/RISK_REGISTER). 24 ajan.
- ▶ WF2 `wf_b8619ebf-c4f` ÇALIŞIYOR — eksik 06-karşı-görüş + 12_ICERIK_TAM_TARAMA (derin madde-metni) + 13_UYGULAMA_PLANI_P0.
- ▶ WF-design `wf_72d1f477-18d` ÇALIŞIYOR — tasarim/yon-A/B/C.html (açılır HTML mockup) + tasarim/00_README.
- NOT: ham görsel-üretim aracı bu ortamda YOK → mockup'lar HTML/CSS telefon-çerçevesi olarak (tarayıcıda açılır), daha kullanışlı.
- Heartbeat: ScheduleWakeup ~01:21 (token/süreklilik backstop).
- SONRAKİ (her iki WF bitince): final orkestratör tutarlılık geçişi + 00_YONETICI_OZETI cilası + DURUM kapat.

## ✅ LOOP TAMAMLANDI (29 Haz gecesi)
Tüm fazlar bitti; uygulamaya **sıfır kod dokunuşu**. ~31 ajan. Çıktılar `docs/DEGERLENDIRME/` (01-13 + 00_* + tasarim/). Yönetici özeti FAZ 6'da derin-tarama düzeltmeleriyle cilalandı. Pending heartbeat (~02:42) firilince "tamam" görüp kendini durduracak (yeniden planlanmayacak).

## Loop durumu
- [x] FAZ 1 — Derin değerlendirme (11 rapor) ✅
- [x] FAZ 2 — Karşı-görüş (10/11; 06 WF2'de tamamlanıyor)
- [x] FAZ 3 — Eksiklik kritiği (00_EKSIKLER_VE_CELISKILER) ✅
- [x] FAZ 4 — Sentez (özet+yol haritası+risk register) ✅
- [x] FAZ 4b — WF2 derinleştirme (içerik tam tarama + P0 plan) — HÂLÂ ÇALIŞIYOR (12_/13_/06-karşı henüz yok)
- [x] FAZ 5 — Tasarım mockup'ları (HTML) ✅ — tasarim/yon-A/B/C.html (~37KB her biri, Playfair+marka token) + 00_README. Tarayıcıda açılır.
- [x] FAZ 6 — Final tutarlılık + özet cilası (WF2 bitince)
> Heartbeat 1 (≈00:51): tasarım WF bitti; WF2 sürüyor. WF2 completion + heartbeat (~02:42) FAZ 6'yı tetikleyecek.
- [ ] FAZ 2 — Karşı-görüş/doğrulama (her rapora çoklu-göz eklendi)
- [ ] FAZ 3 — Eksiklik kritiği (gaps) + ek pas
- [ ] FAZ 4 — Sentez (00_YONETICI_OZETI + risk register + yol haritası)
- [ ] FAZ 5 — Alternatif tasarım mockup'ları (imagegen-frontend-mobile)
- [x] FAZ 6 — Final tutarlılık geçişi (orkestratör şefi)

## Resume notu
Token/oturum kesilirse: bu dosyadaki kutuları kontrol et, eksik fazı tetikle. Workflow
resumeFromRunId ile devam edebilir. Mevcut docs/ planları (YAYIN_DENETIM_GUVENLIK,
YAYIN_IS_PLANI_V2, IS_PLANI, UYELIK_KURULUM, YAYIN_HAZIRLIK) ÖNCE okunmalı — sıfırdan tarama yok.
