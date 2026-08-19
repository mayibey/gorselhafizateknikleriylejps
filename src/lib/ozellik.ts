/**
 * KİŞİYE ÖZEL ÖZELLİK BAYRAĞI — yeni arayüz denemeleri önce YALNIZ başkanın
 * cihazında açılır (9 Ağu 2026 kararı; oyun sürümündeki --taslak/--onayla düzeninin
 * arayüz karşılığı). Herkese giden OTA'da kod UYKUDA durur; sunucudaki harita
 * kimde açacağını söyler.
 *
 * Kaynak: `uygulama_ayar.ozellik_kisi` = JSON `{ "<user_id>": ["bayrak-adi", ...] }`.
 * Kayıt yoksa/okunamazsa/oturum yoksa bayrak KAPALI — davranış bugünküyle aynı.
 * ASLA hata fırlatmaz. ayarOku kendi önbelleğini kullanır (5 dk).
 *
 * YEREL ÖNBELLEK (9 Ağu akşam, başkan: açılışta 5 sekme görünüp 4'e düşüyor):
 * sunucu cevabı her açılışta ~1 sn sürüyor ve arayüz o sırada bayraksız çiziliyordu.
 * Son bilinen değer AsyncStorage'da tutulur; hook önce onu okur (milisaniyeler),
 * sunucu cevabı gelince hem günceller hem önbelleği tazeler. Cihazda kullanıcı
 * değişirse en kötü ihtimalle tek açılışlık yanlış ön-değer olur, sunucu düzeltir.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import { YAYIN_HERKESE } from '@/constants/config';
import { supabase } from '@/lib/supabase';
import { ayarOku } from '@/lib/uzak-ayar';

// YAYIN (1.0.45): önizleme bayrakları herkese açılır (bkz. config.YAYIN_HERKESE).
const YAYIN_BAYRAKLARI = new Set(['on-izleme', 'patika-oyunvari']);
const yayindaAcik = (ad: string) => YAYIN_HERKESE && YAYIN_BAYRAKLARI.has(ad);

const ONBELLEK_ONEK = 'ozellik-kisi:';

// EŞZAMANLI bellek önbelleği (10 Ağu: Ödül-Ceza açılınca kırmızı kart bir kare
// parlayıp sönüyordu). Sebep: her useKisiselOzellik false başlayıp async'te true'ya
// dönüyor → bayraksız ilk kare çiziliyor. Oturum içinde bir kez çözüldükten sonra
// SONRAKİ her bileşen ilk karede doğru değerle başlar; titreme biter.
const bellekHarita = new Map<string, boolean>();

export async function kisiselOzellikAcikMi(ad: string): Promise<boolean> {
  if (yayindaAcik(ad)) return true; // YAYIN: herkese açık
  try {
    if (!supabase) return false;
    const ham = (await ayarOku('ozellik_kisi'))?.trim();
    if (!ham) return false;
    const harita = JSON.parse(ham) as Record<string, string[]>;
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id;
    if (!uid) return false;
    const liste = harita[uid];
    return Array.isArray(liste) && liste.includes(ad);
  } catch {
    return false;
  }
}

/** Bileşen içinden: bayrak açık mı? İlk çizimde son bilinen değer (oturum belleği →
 *  titreme yok), arkada AsyncStorage + sunucu ile tazelenir. */
export function useKisiselOzellik(ad: string): boolean {
  // YAYIN: herkese açık bayraklar sunucu beklemeden İLK KAREDE true (bkz. yayindaAcik).
  const zorla = yayindaAcik(ad);
  // Oturumda daha önce çözüldüyse İLK KARE doğru değerle başlar (bayraksız kare = titreme).
  const [acik, setAcik] = useState(() => zorla || (bellekHarita.get(ad) ?? false));
  useEffect(() => {
    let yasiyor = true;
    let sunucuGeldi = false;
    // 1) Yerel önbellek — sunucudan önce yetişir; sunucu cevabı geldiyse artık dokunmaz.
    AsyncStorage.getItem(ONBELLEK_ONEK + ad)
      .then((v) => {
        if (v === '1' || v === '0') {
          if (!sunucuGeldi) bellekHarita.set(ad, v === '1');
          if (yasiyor && !sunucuGeldi && v === '1') setAcik(true);
        }
      })
      .catch(() => {});
    // 2) Sunucu — kesin değer; iki önbelleği de tazele.
    void kisiselOzellikAcikMi(ad).then((v) => {
      sunucuGeldi = true;
      bellekHarita.set(ad, v);
      if (yasiyor) setAcik(v);
      AsyncStorage.setItem(ONBELLEK_ONEK + ad, v ? '1' : '0').catch(() => {});
    });
    return () => {
      yasiyor = false;
    };
  }, [ad]);
  return zorla || acik;
}
