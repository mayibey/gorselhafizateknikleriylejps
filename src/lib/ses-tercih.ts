/**
 * SESLİ ANLATIM OTOMATİK BAŞLATMA TERCİHİ (GECE KARARI A2, bayraklı):
 * "Ses sürpriz başlamayacak" — İLK sesli kartta bir kez sorulur, cevap kalıcı
 * saklanır (AsyncStorage). Bayrak kapalıyken (sor=false) hep true döner → bugünkü
 * otomatik başlama aynen. mp3 (SesOynatici) ve TTS (TtsBar) aynı tercihi paylaşır.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const ANAHTAR = 'ses-oto-tercih';
let bellek: '1' | '0' | null = null;
let acikSoru: Promise<boolean> | null = null; // aynı anda iki bileşen sorarsa tek pencere

export async function otoBaslatTercihi(sor: boolean): Promise<boolean> {
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
