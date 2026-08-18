/**
 * SESLİ ANLATIM OTOMATİK BAŞLATMA TERCİHİ.
 *
 * ÖNİZLEME (18 Ağu, başkan — bayrak `on-izleme`, yalnız başkan+Kemalettin): ses HER açılışta
 * kendiliğinden başlar; "Ben başlatırım / Otomatik" sorusu YOK, hatırlanan eski seçim yok
 * sayılır. (Biri yanlışlıkla "Ben başlatırım" seçince her kart sessiz açılıyordu.)
 *
 * ÖNİZLEME KAPALIYKEN (herkes) eski davranış aynen: `sor=false` → hep true; `sor=true` iken
 * ilk sesli kartta bir kez sorulur ve cevap kalıcı saklanır (AsyncStorage). mp3 (SesOynatici)
 * ve TTS (TtsBar) aynı tercihi paylaşır.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

import { kisiselOzellikAcikMi } from '@/lib/ozellik';

const ANAHTAR = 'ses-oto-tercih';
let bellek: '1' | '0' | null = null;
let acikSoru: Promise<boolean> | null = null; // aynı anda iki bileşen sorarsa tek pencere

export async function otoBaslatTercihi(sor: boolean): Promise<boolean> {
  // ÖNİZLEME: hep otomatik, hiç sorma (bayrak yalnız başkan+Kemalettin'de açık).
  if (await kisiselOzellikAcikMi('on-izleme').catch(() => false)) return true;

  if (!sor) return true;
  if (bellek) return bellek === '1';
  const v = await AsyncStorage.getItem(ANAHTAR).catch(() => null);
  if (v === '1' || v === '0') {
    bellek = v;
    return v === '1';
  }
  if (acikSoru) return acikSoru;
  acikSoru = new Promise<boolean>((resolve) => {
    Alert.alert(
      'Sesli anlatım',
      'Kart açılınca sesli anlatım kendiliğinden başlasın mı? (Ayarını sonra da değiştirebilirsin.)',
      [
        {
          text: 'Ben başlatırım',
          onPress: () => {
            bellek = '0';
            AsyncStorage.setItem(ANAHTAR, '0').catch(() => {});
            resolve(false);
          },
        },
        {
          text: 'Otomatik başlat',
          onPress: () => {
            bellek = '1';
            AsyncStorage.setItem(ANAHTAR, '1').catch(() => {});
            resolve(true);
          },
        },
      ],
      { cancelable: false },
    );
  });
  return acikSoru;
}
