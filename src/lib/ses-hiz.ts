/**
 * Ses/anlatım hızı — TEK KAYNAK (hem gerçek mp3 SesOynatici hem robotik TTS TtsBar
 * aynı listeyi kullanır → cihaz/karta göre farklı seçenek görünmez).
 * `sesHizDurum.idx` modül-seviyesi tutulur → kart/oynatıcı değişse de seçilen hız KORUNUR
 * (her kartta 1x'e sıfırlanmaz). Saf veri; UI/IO yok.
 */

export const SES_HIZLARI = [1, 1.25, 1.5, 2] as const;

/** Seçili hız indeksi (oturum boyunca paylaşılır). */
export const sesHizDurum = { idx: 0 };
