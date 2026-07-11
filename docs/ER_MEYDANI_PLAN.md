# ER MEYDANI — Yol Planı ve İlerleme

> 1v1 soru düellosu oyun modu. Ücretsiz/açık (müşteri kazanma funnel'ı). İsim: **Er Meydanı**.
> Başkan 11 Tem 2026 gecesi: "planla → altyapıya başla → sistemi bitir, sabaha kadar çalış, yarın test ederim."
> Kararları Claude verdi (aşağıda), başkan sabah beğenmediğini değiştirir.

## Kapsam (netleşmiş)
- **Tek oyun, iki mod:** (1) **Süresiz/Hızlı** = gölge rakip veya rastgele; tek başına test edilebilir. (2) **Canlı** = gerçek zamanlı iki telefon, süreli yarış.
- **Eşleşme:** arkadaş-kodu + rastgele + (boş kuyrukta) gölge rakip fallback.
- **10 soru**, ücretsiz havuzdan (TCK + açık kanunlar).
- **Puanlama:** doğru (temel 100) + hız bonusu (kalan süreye orantılı, max +100) → soru başına max 200, maç max 2000. Her telefon KENDİ süresini ölçer (gecikme adaleti).
- **Haftalık sıralama**, Pazartesi (İstanbul) sıfırlanır; geçen hafta şampiyonu onur köşesinde.
- **Takma ad (rumuz)** zorunlu (mahremiyet + Apple-gizli isimliler görünür olsun) + küfür filtresi.
- **Apple UGC kuralı:** şikayet + engelle + isim filtresi (yayın şartı).
- **Ödül:** şimdilik prestij (madalya/rozet). Somut ödül sonraya.

## Alınan kararlar (Claude, sabah gözden geçirilebilir)
- Puan sunucuda kaydedilir (RPC, security definer) → istemci puan tablosuna yazamaz (anti-hile).
- Anti-farm: aynı rakipten haftalık sınırlı puan + günlük maç tavanı; puan aralığı [0,2000] doğrulanır.
- Sıralamayı **canlı + hızlı maçlar** besler; süresiz "antrenman" da puan verir ama anti-farm sınırlar.
- Rumuz: 3-16 karakter, harf/rakam/boşluk, tek kelimelik küfür kara listesi.

## İlerleme (checklist)
- [ ] 1. DB migration 23: rumuz + er_meydani_mac + haftalik_puan + engel/şikayet + RLS + RPC'ler → Supabase'e uygula
- [ ] 2. Saf mantık: seed→10 soru (ücretsiz havuz), puanlama (hız), hafta anahtarı, gölge rakip
- [ ] 3. lib/er-meydani.ts: supabase çağrıları (rumuz, sonuç kaydet, sıralama, geçmiş) + solo akış
- [ ] 4. Ekran: Er Meydanı lobi (hızlı eşleş / arkadaş kodu / sıralama)
- [ ] 5. Ekran: Maç (10 soru, sayaç, canlı skor barı) — solo/gölge
- [ ] 6. Ekran: Sonuç (kazandın/kaybettin, puan, tekrar, paylaş)
- [ ] 7. Ekran: Sıralama (haftalık top + senin sıran + geçen hafta şampiyonu)
- [ ] 8. Rumuz belirleme akışı + küfür filtresi
- [ ] 9. Karargah'a "Er Meydanı" giriş noktası
- [ ] 10. Canlı mod (gerçek zamanlı) — kod yazılır, 2 telefon testi başkana
- [ ] 11. Apple uyumu: şikayet + engelle
- [ ] 12. tsc 0 + öz-denetim (review) + commit'ler + PROJE_DURUM

## Test notu (sabah başkana)
- Tek telefonla test edilebilir: hızlı eşleş → gölge rakibe karşı 10 soru → puan → sıralama.
- Canlı mod için 2 telefon gerekir (ya da 2 hesap/2 cihaz).
