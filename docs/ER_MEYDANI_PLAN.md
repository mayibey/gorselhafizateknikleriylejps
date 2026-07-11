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
- [x] 1. DB migration 23+24: rumuz + er_meydani_mac + haftalik_puan + engel/şikayet + RLS + RPC'ler → Supabase'e uygulandı+doğrulandı
- [x] 2. Saf mantık: seed→10 soru (ücretsiz havuz 862 soru), puanlama (hız, max 2000), hafta anahtarı, gölge rakip
- [x] 3. lib/er-meydani.ts: supabase çağrıları (rumuz, sonuç kaydet, sıralama, şikayet/engelle) + solo akış
- [x] 4. Ekran: Er Meydanı lobi (hızlı eşleş / arkadaş kodu / sıralama)
- [x] 5. Ekran: Maç (10 soru, sayaç, canlı skor barı) — solo/gölge
- [x] 6. Ekran: Sonuç (kazandın/kaybettin, puan, tekrar, paylaş)
- [x] 7. Ekran: Sıralama (haftalık top + senin sıran + geçen hafta şampiyonu)
- [x] 8. Rumuz belirleme akışı + küfür filtresi (DB CHECK + RPC)
- [x] 9. Karargah'a "Er Meydanı" giriş noktası
- [ ] 10. **Canlı mod (gerçek zamanlı, eşzamanlı yarış)** — HENÜZ YOK; 2 telefon testi gerektirdiği için başkanla birlikte kurulacak sonraki adım
- [x] 11. Apple uyumu: şikayet (sıralamada) — engelle canlı modla gelecek
- [x] 12. tsc 0 + öz-denetim (2 adversaryal ajan) + düzeltmeler + commit'ler + PROJE_DURUM

## Yapılan testler (12 Tem gece, hepsi geçti)
- Saf mantık node testi: base36 kod round-trip 200k'da 0 hata; puan sınırları tam; RNG deterministik.
- Sunucu RPC uçtan uca (rollback tx, gerçek uid): rumuz ok, puan 1500, kendine=0, sıralama OK.
- **İki-kullanıcı head-to-head (gerçek uid'ler):** A vs B kaydı, sıralama #1 A=1700 / #2 B=1300, anti-farm 4.maç=0, kendine=0.
- **Gerçek sorularla maç simülasyonu:** iki kullanıcı aynı tohumla AYNI 10 soru; şık işaretleme→puan adım adım işliyor (A 1166 / B 1019); gölge rakip çalışıyor; farklı tohum→farklı soru.

## Test notu (sabah başkana)
- Tek telefonla: Karargah → Er Meydanı → takma ad → Hızlı Eşleş → gölge rakibe karşı 10 soru → puan → Sıralama.
- İKİ kişiyle (bugün mümkün): "Arkadaşını Davet Et" → kod paylaş → ikisi de aynı sorularla oynar → skorları Sıralama'da karşılaştır.
- Canlı eşzamanlı yarış (madde 10) henüz yok — sıradaki iş.
