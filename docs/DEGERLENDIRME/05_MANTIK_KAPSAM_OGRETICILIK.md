# 05 — Öğrenme Mantığı, Kapsam ve Öğreticilik (Pedagoji) Değerlendirmesi

> Salt-okuma inceleme (29 Haz gece loop'u). Kod değiştirilmedi. Kanıtlar `dosya:satir`.
> Tabanı: `00_DURUM.md`, `CLAUDE.md` mimari değişmezleri, `YAYIN_IS_PLANI_V2.md`.
> Önceki planlar "içerik henüz üretiliyor" diyor; bu rapor onun ÜZERİNE **öğrenme bilimi**
> ve **müfredat tutarlılığı** açısından eleştiri ekler (içerik üretim takvimini tekrar etmez).

## Özet
- **SRS aslında çalışmıyor (en kritik):** Uygulama "aralıklı tekrar (SRS)" vaat ediyor ama Leitner motoru kullanıcının NE göreceğini SÜRMÜYOR. Etüt = yalnız "zayıf havuz" (`getZayifKuyruk`), `getDailyQueue` yeniLimit=0 ile çağrılıyor ve `CLAUDE.md`'ye göre artık Etüt'ü beslemiyor. Yani iyi bilinen kartlar zaman temelli olarak HİÇ geri gelmiyor → spaced repetition'ın bilimsel özü (unutma eğrisine karşı planlı tekrar) devre dışı. `srs.kutu` yalnız patika ilerleme yüzdesi + ödül-sicil için "görünmez" duruyor.
- **Aralık tablosu off-by-one + 2-durumlu pratik:** `ARALIKLAR=[1,2,4,7,14,30]` ama ilk eleman (1 gün) erişilemez; en kısa fiili aralık 2 gün. "Tekrar Hatırlat" (zor) ve yeni karta "Öğrendim" AYNI 2 günlük aralığı veriyor. `'tekrar'` cevabı `srs.ts`'de tanımlı ama UI'da HİÇ kullanılmıyor → 3 kutulu Leitner fiilen 2 durumlu.
- **Ters teşvik (gamification):** Tek gerçek tekrar mekanizması (zayıf havuz) yalnızca kullanıcı "Tekrar Hatırlat"a basınca ya da denemede yanlış yapınca dolar. Ana CTA olan "Öğrendim"e basmak hem havuzu boş tutar hem de **ceza merdiveninden** (Yazılı İkaz→…→Aylıktan Kesme) kaçırır. Yani **dürüst zorlandım demek cezalandırılıyor**, sistemi oyunlamak (hep "Öğrendim") ödüllendiriliyor → öz-değerlendirmeyi ve tek tekrar kanalını çökertir.
- **Kapsam çok dar:** Görsel/ses/deneme içeriği yalnız 25 müşterek kanunda (`assets/kartlar` 25 klasör; `KART_SORULARI` law_id 1–25). 41 branş kanunu (id 26–66) yalnız İSİM — kart yok, deneme yok. Patika 66/66 kapsamı tanımlı ama içeriksiz. Madde metinleri hâlâ "Yer tutucu" (`seed.ts:219`).
- **Aktif hatırlama (retrieval) kart düzeyinde yok:** Öğrenme döngüsü görsel→ses→(opsiyonel)metin→**öz-rapor**. Test (aktif geri çağırma) yalnız kanun düzeyi Tatbikat'ta. Testing-effect (en güçlü öğrenme kaldıracı) kart akışında kullanılmıyor → tanıma (recognition) yanılsaması riski.
- **İyi yanlar:** Saf/test-edilebilir mantık katmanı (parite), deneme sorusunda anında açıklama+kaynak madde geri bildirimi, başarı (Takdir→Başarı→Üstün) merdiveni, görsel hafıza kartı + sesli anlatım kombinasyonu güçlü bir ezber temeli.

## Bulgular (önem sırası)

### P0-1 — Spaced repetition motoru kullanıcı akışını sürmüyor (vaat ↔ gerçek boşluğu)
- **Nerede:** `db/database.native.ts:447-460` (`getDailyQueue` → `gunlukKuyruk(..., 0)` yeniLimit=0); `database.native.ts:662` doc: *"Etüt kuyruğu: yalnız vakti gelmiş TEKRARLAR (due)"*; ama Karargah Etüt → `app/(tabs)/index.tsx:46` `getZayifKuyruk()`; `CLAUDE.md`: *"getDailyQueue/Leitner-due ARTIK Etüt'ü beslemiyor — srs kutu motoru yalnız ödül-sicil için görünmez çalışıyor."*
- **Neden:** SRS'in tüm değeri, bir kartı tam unutulmadan önce optimum aralıkta geri getirmektir. Burada due (vakti gelen) kartlar kullanıcıya hiçbir ekranda sunulmuyor. "Öğrendim" denen kart 2/4/7… gün sonra OTOMATİK karşına çıkmıyor; yalnız kullanıcı Mevzuat'tan o kanunu tekrar açarsa görür (manuel).
- **Etki:** Ürünün ana farkı olarak duyurulan "aralıklı tekrar" fiilen yok. Unutma eğrisine karşı planlı koruma yok → uzun dönem tutma (retention) düşük. Mağaza açıklamasıyla çelişki (yanıltıcı iddia riski — `YAYIN_DENETIM_GUVENLIK` redleriyle aynı kategori).
- **Öneri:** Etüt kuyruğunu **due tekrarlar (Leitner) + zayıf havuz birleşimi** yap (önce due, sonra zayıf). `gunlukKuyruk`'u yeniLimit=0 yerine küçük bir tekrar tavanıyla Etüt'e bağla. Karargah'ta "Bugün tekrar edilecek N kart" sayacı göster. Bu, mevcut saf `gunlukKuyruk` fonksiyonuyla TEK satırlık bağlantı işidir (mantık zaten var, sadece bağlı değil).

### P0-2 — Ceza-temelli gamification dürüst öz-değerlendirmeyi cezalandırıyor (ters teşvik)
- **Nerede:** `lib/sicil.ts:17-23,120-149` (ZAYIF_ESIK=3 → 3 günlük pencere → `yazili_ikaz→uyari→kinama→ayliktan_kesme`); zayıf havuza giriş yalnız `lib/performans.ts:13-18` (calisma 'zor' VEYA quiz 'yanlis'); akış CTA'sı `app/akis.tsx:580-614` ("Öğrendim" lacivert birincil, "Tekrar Hatırlat" ikincil).
- **Neden:** Kullanıcı zorlandığını dürüstçe işaretlerse → zayıf havuz dolar → 3'ü aşarsa ceza emri açılır → toparlamazsa "Aylıktan Kesme" temsili cezası. Tersine hep "Öğrendim" diyen kullanıcı hem cezadan kaçar hem havuzu boş tutar. Davranışsal olarak sistem, **öğrenme için gerekli olan "bunu bilmiyorum" itirafını** negatif pekiştiriyor.
- **Etki:** (a) Zayıf havuz — tek gerçek tekrar kanalı — sistematik olarak az dolar; (b) "Aylıktan Kesme" çerçevesi sınav stresi üstüne kaygı/churn yaratır; (c) loss-framing motivasyonu kırar (sınav hazırlığında özünde gönüllü kitle).
- **Öneri:** Cezayı kaldır ya da "nazik hatırlatma"ya çevir (ceza yerine "zayıf mevzi takviye daveti"). Zayıf havuzu öz-rapordan değil, **performanstan** (denemede/quizde objektif yanlış + uzun süre tekrar edilmeyen due kart) besle → dürüstlük cezalandırılmaz. Ödül tarafını (Takdir/Başarı) koru, güçlendir.

### P1-3 — Aralık tablosu off-by-one; "zor" ile yeni-"öğrendim" aynı aralığı alıyor; `tekrar` ölü kod
- **Nerede:** `lib/srs.ts:11,33-50`. `sonrakiKutu`: biliyorum→kutu+1, tekrar→2, zor→1. `sonrakiTarih`: `ARALIKLAR[min(kutu,5)]`. Yeni kart kutu=0; ilk "Öğrendim" → kutu 1 → `ARALIKLAR[1]=2` gün. "Tekrar Hatırlat" (zor) → kutu 1 → yine 2 gün. UI yalnız biliyorum/zor sunuyor (`akis.tsx:587,608`; modal `akis.tsx:633,642`) → `'tekrar'` dalı hiç çağrılmaz.
- **Neden:** Fiili minimum aralık 2 gün; `ARALIKLAR[0]=1` erişilemez (kutu hiç 0 kalmıyor, ilk cevapta ≥1 oluyor). Zorlanılan kart ile yeni öğrenilen kart aynı hızda geri gelmeli değil — zor kart 1 gün (hatta aynı gün) içinde, yeni-bilinen kart daha ileride dönmeli. Bilimsel SRS'te "lapse" (unutma) aralığı minimuma çekilir.
- **Etki:** Zorlanan kartlar yeterince sık geri gelmez; aralık çözünürlüğü kaybı. (Şu an P0-1 yüzünden bu zaten görünmüyor — ama P0-1 düzeltilince bu hata öne çıkar.)
- **Öneri:** İndekslemeyi düzelt (örn. zor→kutu sıfırla, aralık `[1,...]`'in 0. elemanı; biliyorum→bir üst kutu). Ya da SM-2 benzeri: zor → 1 gün, ilk doğru → 1, ikinci → 3, sonra ×2.2. `'tekrar'`ı ya UI'ya 3. buton olarak getir (Kolay/Orta/Zor) ya da tipten kaldır (ölü kod temizliği).

### P1-4 — Zayıf havuz giriş/çıkış asimetrisi (quiz yalnız yanlışı loglar)
- **Nerede:** `app/sinav.tsx:79-101` (yalnız `i !== dogru` iken `kaydetPerformans(id,'quiz','yanlis')`; doğru cevap LOGLANMAZ); çıkış kuralı `lib/performans.ts:45-72` ("son 2 deneme ardışık iyi olmalı").
- **Neden:** Kart denemede yanlışla havuza girer ama denemeyi tekrar çözüp DOĞRU yapmak çıkışa sayılmaz (doğru quiz logu yok). Tek çıkış: Etüt'te 2 kez "Öğrendim". Bu, "objektif test başarısı" ile "havuzdan kurtulma"yı kopuk bırakır; kullanıcı aynı soruyu artık doğru bilse bile kart zayıf görünür.
- **Etki:** Zayıf havuz şişer / yanlış kalır; ceza mekaniğiyle (P0-2) birleşince adaletsiz his. Ölçüm-gerçek tutarsızlığı.
- **Öneri:** Doğru quiz cevabını da logla (`'quiz'/'dogru'`) ki `zayifKartlar` "2 ardışık iyi" çıkışında sayılsın; ya da çıkış kuralını "son N denemede ≥%X doğru" olarak performansa bağla.

### P1-5 — Kart düzeyinde aktif hatırlama (retrieval practice) yok
- **Nerede:** `app/akis.tsx` döngüsü: görsel (StudyCard) → ses otomatik (`SesOynatici`/`TtsBar`) → opsiyonel madde paneli → öz-rapor butonları. Hiçbir noktada "önce hatırla, sonra göster" yok; gizle/aç (cloze) yok.
- **Neden:** Öğrenme biliminde en güçlü etki *testing effect* / *retrieval practice*: cevabı görmeden önce hatırlamaya çalışmak. Mevcut akış tamamen sunum (görsel+ses) + tanıma temelli öz-değerlendirme → "biliyorum yanılsaması" (fluency illusion) üretir.
- **Etki:** Çalışma hissi yüksek, tutma düşük olabilir. Görsel mnemonics güçlü ama tek başına pasif.
- **Öneri:** Kart akışına hafif retrieval ekle: madde no/başlık göster, "Aklına ne geliyor?" → sonra görseli aç; veya her kanun bölümü sonunda 2-3 mini soru (mevcut `KART_SORULARI` altyapısı kullanılabilir). Tatbikat'ı kanun sonuna "öğrendiğini sına" olarak akışa göm.

### P1-6 — Müfredat kapsamı: 41 branş kanunu içeriksiz + branş soruları yok
- **Nerede:** `db/seed.ts:40-81` (id 26-66 branş, yalnız ad); `assets/kartlar` 25 klasör (yalnız müşterek + 4733 boş); `KART_SORULARI` law_id 1-25; `SEED_KAPSAM` 66/66 tanımlı (`seed.ts:260-368`) ama kartsız kanunlar patikada boş düğüm.
- **Neden:** JSPS sınavında 16 branşın (`SEED_BRANCHES`) kendi konuları var; rütbe filtresi (`rutbe-kapsam.ts`) yalnız 2 istisna tutuyor, branş içeriği "ayrı tur" notuyla yok. Yani uygulama şu an yalnız müşterek bloğu öğretiyor.
- **Etki:** Bir branş adayı için müfredatın çoğu (kendi alan soruları) eksik; "JSPS sınav hazırlık" iddiası müşterekle sınırlı. Mağaza vaadi ↔ içerik boşluğu.
- **Öneri:** İçerik yol haritasıyla uyumlu: müşterek 25'i tam bitir, branş içeriğini fazlandır; UI'da "branş konuları yakında" dürüst etiketi (boş patika düğümleri "Yakında" göstermeli — şu an `akis.tsx:301` "Yakında" var, ama Mevzuat listesinde branş kanunu 0 kartla görünüyor olabilir → doğrula).

### P2-7 — Kanun çalışma modunda günlük/parça sınırı yok (bilişsel yük)
- **Nerede:** `lib/kanun-kartlari.ts:29-41` (`kanunKuyrugu` TÜM kartları döndürür, limit yok); buna karşılık `lib/queue.ts:10` `YENI_LIMIT=8` yalnız `gunlukKuyruk`'ta.
- **Neden:** Mevzuat→kanun açılınca 50+ madde tek oturumda akar; yeni-kart günlük tavanı bu yolda uygulanmaz. Patika "Madde N" düğümleri parçalama sağlıyor ama kullanıcı kanunu komple açarsa korumasız.
- **Etki:** Aşırı yükleme → erken yorulma, düşük tutma. (Eğitim Planı `gunlukKart` ayarı yalnız günlük kuyruğa uygulanıyor — `akis.tsx:54-57`.)
- **Öneri:** Kanun modunda da "bugün öğrenilecek yeni kart" tavanı / "kaldığın yerden N kart" oturum sınırı sun (patika düğüm bazlı zaten var; varsayılanı küçük tut).

### P2-8 — Zorluk ilerlemesi madde no'ya bağlı, pedagojik değil
- **Nerede:** `kanun-kartlari.ts:18-23` (`maddeSira` = madde numarası); patika sırası da kapsam dizisi sırası (`seed.ts:397`).
- **Neden:** Madde numarası ≠ öğrenme zorluğu/önkoşul. Temel kavram önce, türev sonra mantığı yok; ayırt/özet kartları en büyük üye maddeden sonra geliyor (iyi) ama temel→ileri eğrisi yok.
- **Etki:** Düşük; kanun mantığı doğal sırayı kabaca izliyor. İyileştirme fırsatı.
- **Öneri:** Uzun vadede "temel maddeler" rozeti/önce-getir; şimdilik kabul edilebilir.

### P2-9 — Sınav özet geri bildirimi zayıf (eyleme dönük değil)
- **Nerede:** `app/sinav.tsx:298-306` final ekran: yalnız `Skorun: d/t`, `%yuzde doğru — biraz daha çalış`. Soru düzeyi geri bildirim İYİ (`sinav.tsx:197-210` anında açıklama+Doğru/Yanlış+kaynak madde).
- **Neden:** Sonda "hangi maddelerde zayıfsın / şunları çalış" listesi, yanlışları doğrudan Etüt'e götüren CTA yok. Yanlışlar sessizce havuza düşüyor ama kullanıcı bağlantıyı görmüyor.
- **Etki:** Öğrenme döngüsü kapanmıyor (sınav→eylem köprüsü zayıf).
- **Öneri:** Final ekrana "Yanlış yaptığın N maddeyi şimdi çalış" → zayıf akışına (`/akis?mod=zayif`) buton; kanun bazlı doğru/yanlış dökümü.

## Hızlı kazanımlar
- **Etüt'e due tekrarları bağla** (P0-1): mevcut `gunlukKuyruk` saf fonksiyonu hazır; Etüt kuyruğunu `[...due, ...zayif]` yap → SRS gerçekten devreye girer. En yüksek değer / en düşük efor.
- **`'tekrar'` ölü kodunu temizle veya UI'ya Kolay/Orta/Zor olarak getir** (P1-3).
- **Doğru quiz cevabını da logla** (P1-4): tek satır, zayıf havuz çıkışını adil yapar.
- **Sınav final ekranına "yanlışları çalış" CTA'sı** (P2-9): mevcut zayıf akışına link.
- **"Aylıktan Kesme" ibaresini yumuşat** (P0-2): kaygı/red riski; metin değişikliği `sicil.ts:56-61`.

## Riskler
- **Yanıltıcı iddia (mağaza):** "Aralıklı tekrar / SRS" duyurulurken motor akışı sürmüyorsa, `YAYIN_DENETIM_GUVENLIK` reddiyle aynı sınıf risk (yanıltıcı özellik). P0-1 yayından önce çözülmeli ya da iddia metni gerçeğe çekilmeli. **(Doğrulandı: kod + CLAUDE.md.)**
- **Pedagojik geri tepme:** Ceza mekaniği (P0-2) öz-raporu bastırıp tek tekrar kanalını zayıflatıyor → kullanıcı "çok çalıştım ama sınavda olmadı" yaşayabilir; itibar/iade riski.
- **Kapsam beklenti yönetimi:** Branş adayları içeriğin müşterekle sınırlı olduğunu indirince anlarsa düşük puan/churn (P1-6). Mağaza listesinde kapsamı net belirt.
- **DOĞRULANMADI:** Mevzuat listesinde branş kanunlarının (0 kart) nasıl göründüğü (gizli mi, "yakında" mı) okunmadı — UX dürüstlüğü için teyit edilmeli. Eğitim Planı `gunlukKart` ayarının Etüt/zayıf akışına etkisi de yalnız günlük yolda doğrulandı.

## Somut adımlar (sıralı, tahmini efor)
1. **(P0-1) SRS'i akışa bağla** — Etüt kuyruğu = due + zayıf birleşimi; Karargah'a "bugün N tekrar" sayacı. ~0.5–1 gün. (Mantık var; bağlama + UI sayaç.)
2. **(P0-2) Ceza modelini yeniden çerçevele** — cezayı kaldır/yumuşat; zayıf havuzu öz-rapor yerine performans+due'dan besle. ~0.5 gün kod + metin.
3. **(P1-3) Aralık off-by-one + cevap durumları** — `srs.ts` indeksleme düzelt, `'tekrar'` kararı (3-buton ya da sil). ~0.5 gün + saf testler.
4. **(P1-4) Doğru quiz logu** — `sinav.tsx:101` doğru dalına `kaydetPerformans('quiz','dogru')`; `performans.ts` çıkış kuralını doğrula. ~2 saat.
5. **(P1-5) Kart akışına hafif retrieval** — kanun bölümü sonu 2-3 mini soru (mevcut registry) veya "önce hatırla" adımı. ~1 gün (tasarım kararı önce).
6. **(P2-9) Sınav→eylem köprüsü** — final ekran yanlış madde dökümü + zayıf akışı CTA. ~0.5 gün.
7. **(P1-6) Kapsam dürüstlüğü** — branş kanunları için "yakında" etiketi + mağaza kapsam beyanı; içerik fazına bağlı. Doğrulama + küçük UI.

---

## KARŞI-GÖRÜŞ & DOĞRULAMA (çoklu göz)
- **"SRS gerçekten yok" iddiası fazla mı sert?** Karşı-görüş: `srs.kutu` patika ilerleme (`patika.ts:7` kutu≥1) ve ödül için kullanılıyor, yani tamamen ölü değil. **Ama** kullanıcının GÖRECEĞİ tekrar akışını sürmediği için "spaced repetition ürün özelliği olarak işlevsel değil" yargısı durur — `database.native.ts:459` yeniLimit=0 + `index.tsx:46` Etüt=zayıf + CLAUDE.md ifadesiyle üç kez doğrulandı.
- **Ceza eleştirisi öznel mi?** Loss-framing/punishment'ın gönüllü öğrenmede motivasyonu düşürdüğü yerleşik bulgu; ayrıca mekanik kanıtı objektif: zayıf havuz girişi (`performans.ts:13-18`) öz-rapora (`'zor'`) bağlı ve ana CTA "Öğrendim" (`akis.tsx:587`) bunu atlatıyor → ters teşvik mantıksal olarak sağlam.
- **Off-by-one gerçek mi?** Doğrulandı: yeni kart kutu=0, ilk cevap min kutu 1 → `ARALIKLAR[0]=1` erişilemez; zor ve yeni-biliyorum ikisi de kutu 1 → 2 gün (`srs.ts:33-50`). Etki şu an P0-1 maskeliyor; P0-1 çözülünce kritikleşir (bağımlılık notu eklendi).
- **Kapsam sayıları:** `assets/kartlar` 25 klasör (4733 boş), `KART_SORULARI` 1-25, seed branş 26-66 ad-only → "yalnız müşterek içerikli" doğru. İçerik üretiminin sürdüğü (`YAYIN_IS_PLANI_V2`) bilinçli; rapor bunu "eksik" değil "kapsam beklenti yönetimi" olarak işaretliyor.

---
## KARSI-GORUS & DOGRULAMA (kirmizi takim)

> Bağımsız kod okumasıyla (29 Haz) raporun her ana iddiası tek tek doğrulandı. Çoğu **doğru**; biri **yanlış/yanıltıcı çerçeve** (içerik "placeholder"), biri **eksik kalmış** (DOĞRULANMADI çözüldü) ve birkaçında öncelik/şiddet tartışılır. Kanıt = `dosya:satir`.

### A. Yanlış / yanıltıcı: "İçerik hâlâ Yer tutucu / placeholder" — DÜZELTİLMELİ  (rapor iddiası: Düşük güven verilmeliydi)
- **Ne:** Rapor üç ayrı yerde (özet md.12, P1-6 `seed.ts:219`, riskler) müşterek içeriği "placeholder / Yer tutucu" diye çerçeveliyor. Bu, ürünün **fiilen sunduğu öğrenme içeriğini** yanlış temsil ediyor.
- **Kanıt:** `seed.ts:219` `anlatim_metni: 'Yer tutucu...'` DOĞRU **ama bu alan kullanıcıya HİÇ gösterilmiyor** — ölü alan. Gerçek anlatım `tts-bar.tsx:15,56` → `KART_SES_METINLERI[gorsel_yolu]`'dan okunuyor; bu registry `kart-ses-metinleri.ts`'te **522 özgün, profesyonelce yazılmış, sınav-odaklı mnemonik anlatım** içeriyor (25 müşterek kanunun TAMAMI: disiplin 114, kabahatler 62, tck 54, jandteskyon 39, hizmetesas/resmiyazisma 29… script). Görsel tarafı da gerçek: `assets/kartlar/tck` 54 dosya, vb. `gorsel-kart-gorselleri` registry'si dolu.
- **Etki:** Rapor "mağaza vaadi ↔ içerik boşluğu" / "yanıltıcı iddia" risklerini müşterek için ŞİŞİRİYOR. Müşterek bloğu placeholder DEĞİL — ürünün ana değeri burada ve üretilmiş. (4733 folder'ı boş — `seed.ts:137` yorumu + 0 dosya — doğru; ama 4733 **branş id 49**, müşterek değil; rapor zaten "boş" demiş, sorun yok.)
- **Sonuç:** İçerik eleştirisi yalnızca **branş (id 26-66) tamamen yok** noktasında geçerli (aşağıda B). Müşterek "placeholder" ibaresi metinden çıkarılmalı; aksi halde kendi raporu yanıltıcı.

### B. Eksik kalan DOĞRULANMADI çözüldü: branş kanunları Mevzuat'ta SESSİZCE GİZLİ (sadece "yakında" değil — hiç yok)
- **Ne:** Rapor (md.83, P1-6) "branş kanunu nasıl görünüyor — gizli mi, yakında mı?" sorusunu açık bırakmış. Çözüldü: `mevzuat.tsx:112` listeyi `l.blok === 'müşterek' && l.kartSayisi > 0` ile filtreliyor → **branş kanunları (blok='branş') Mevzuat'ta HİÇ render edilmiyor**, "yakında" etiketi DAHİ yok.
- **Etki:** (a) UX dürüstlüğü açısından iyi (boş düğüm yok); (b) AMA branş adayı kendi branşını seçince yine yalnız 25 müşterek görüyor; branşına özel sınav konuları ekranda **hiç işaret bırakmadan** yok → "benim alanım nerede?" beklenti boşluğu. Branş seçiminin (AsyncStorage) Mevzuat içeriğine fiilen etkisi yok (yalnız `rutbeGorur` filtresi). Bu, P1-6'yı "yakında etiketi ekle" değil "branş kapsamının yokluğunu kullanıcıya/mağazaya açıkça beyan et" olarak yeniden çerçeveler.

### C. Doğrulanan ana iddialar (güven notları)
- **P0-1 (SRS akışı sürmüyor) — DOĞRU, hatta RAPOR BUNU HAFİFE ALMIŞ. Güven: Yüksek.** `database.native.ts:459` `yeniLimit=0` doğru; ama daha güçlü kanıt: `getDailyQueue` (due/Leitner yolu) **hiçbir UI girişinden çağrılmıyor**. Tüm `/akis` girişleri parametreli: `index.tsx:233,311`+`sicil.tsx:127,139` → `mod:zayif`; `patika.tsx:299,392` → lawId/bolumId; `ara.tsx:99` → kart. Parametresiz `/akis` (akis.tsx:55 daily yolu) **ölü kod**. Yani due tekrarlar yalnız `yeniLimit=0` ile kısıtlı değil, **erişilemez**. Vaat ↔ gerçek boşluğu raporun dediğinden büyük.
- **P0-2 (ceza ters teşvik) — DOĞRU ve CANLI (teorik değil). Güven: Yüksek; şiddet: tartışılır.** Mekanik canlı: `sicil.tsx:64,70` `degerlendirSicil` Sicil sekmesi focus'unda çalışıyor → `sicil-servis.ts:38` `degerlendirGeriBes`. Ters teşvik mantığı sağlam. ANCAK pratik tetik koşulu dar: ceza ancak (≥3 zayıf) + (3 günlük pencere dolması) + (kullanıcının pencere sonrası Sicil sekmesini açması) ile işler (`sicil.ts:140`). Çok kullanıcı hiç tetiklemeyebilir → gerçek-dünya zararı P0-1'den düşük. **Eleştiri:** ikisini eş-P0 yapmak abartılı; P0-2 "ilkesel olarak ciddi tasarım hatası ama düşük tetik sıklığı" notuyla P0/P1 sınırında. Yine de "dürüstlüğü cezalandırma" ilke ihlali olduğu için P0 savunulabilir.
- **P1-3 (off-by-one + zor=yeni-biliyorum + `tekrar` ölü) — DOĞRU. Güven: Yüksek.** `srs.ts:33-50` ile birebir: kutu 0→ilk cevap≥1 → `ARALIKLAR[0]=1` erişilemez; 'biliyorum'(0→1) ve 'zor'(→1) ikisi de 2 gün; `cevapla` yalnız `'biliyorum'/'zor'` (`akis.tsx:587,608,633,642`) → `'tekrar'` dalı ölü.
- **P1-4 (quiz yalnız yanlışı loglar) — DOĞRU. Güven: Yüksek.** `sinav.tsx:90,101` yalnız `i !== dogru` → `kaydetPerformans('quiz','yanlis')`; doğru cevap loglanmıyor → `performans.ts:60-61` "2 ardışık iyi" çıkışı quizle beslenemez.
- **P1-5 (kart düzeyi retrieval yok) — DOĞRU (tasarım yargısı). Güven: Orta-Yüksek.** Akış sunum (görsel+TTS) + öz-rapor; cloze/önce-hatırla yok (`akis.tsx`). Pedagojik olarak geçerli; "güçlü ezber temeli" notu B'deki zengin anlatım sayesinde haklı ama pasiflik eleştirisi de durur.
- **P1-6 (branş içeriksiz) — DOĞRU. Güven: Yüksek.** `seed.ts:138-164` `KANUN_BILGI` yalnız müşterek slug→lawId 1-25 eşliyor; `KART_SORULARI` 1-25; branş 26-66 ad-only. (Düzeltme: "placeholder" değil "branş için hiç içerik yok"; müşterek dolu.)
- **P2-7/P2-9 — DOĞRU. Güven: Yüksek.** `kanun-kartlari.ts:29-41` limitsiz; `sinav.tsx:298-306` final ekran eyleme dönük değil.

### D. Önceliklendirme eleştirisi
- **Doğru olan:** P0-1'i 1 numaraya koymak isabetli — en yüksek değer/en düşük efor (saf `gunlukKuyruk` hazır, yalnız bağlama eksik).
- **İtiraz 1:** P0-2'nin eş-P0 ağırlığı, gerçek tetik sıklığı düşük olduğu için fazla; "P0-yumuşatma + P1-yeniden-çerçeveleme" daha doğru. "Aylıktan Kesme" metnini yumuşatmak (md.77) yine de ucuz/değerli — orada katılıyorum.
- **İtiraz 2:** Raporun "içerik placeholder" çerçevesi, B'deki **gerçek boşluğu (branş kapsamı + branşın sessizce gizlenmesi)** gölgeliyor. Mağaza dürüstlüğü açısından asıl P1 risk: "JSPS branş sınavı" vaadi ile yalnız-müşterek içerik arasındaki fark → mağaza listelemesinde "v1 kapsamı: müşterek mevzuat" beyanı net olmalı. Bunu P1-6'nın içine gömmek yerine ayrı, görünür bir madde yapardım.

### E. Net düzeltme önerileri (rapora)
1. "Müşterek içerik placeholder" ifadelerini KALDIR; yerine "müşterek anlatım/görsel üretilmiş (522 ses scripti), `anlatim_metni` ölü alan; branş id 26-66 içeriksiz" yaz.
2. DOĞRULANMADI'yı kapat: branş Mevzuat'ta `mevzuat.tsx:112` ile gizli (yakında bile değil) → mağaza/UI kapsam beyanı öner.
3. P0-1 kanıtına "due yolu UI'dan erişilemez (ölü `getDailyQueue`)" ekle — `yeniLimit=0`'dan güçlü argüman.
4. P0-2'yi "düşük tetik sıklığı" notuyla yumuşat; ilke geçerli ama acil değil.
