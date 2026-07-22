/**
 * Ses/anlatım hızı — TEK KAYNAK (hem gerçek mp3 SesOynatici hem robotik TTS TtsBar
 * aynı listeyi kullanır → cihaz/karta göre farklı seçenek görünmez).
 * `sesHizDurum.idx` modül-seviyesi tutulur → kart/oynatıcı değişse de seçilen hız KORUNUR
 * (her kartta 1x'e sıfırlanmaz). Saf veri; UI/IO yok.
 */

export const SES_HIZLARI = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

/** Normal (1x) hızın listedeki yeri — varsayılan hız buradan başlar (yavaş hızlar öne eklendi). */
export const SES_HIZ_NORMAL_IDX = SES_HIZLARI.indexOf(1);

/** Seçili hız indeksi (oturum boyunca paylaşılır). Varsayılan = 1x (yavaş hızda başlamaz). */
export const sesHizDurum = { idx: SES_HIZ_NORMAL_IDX };
