/**
 * Bir kanunun indirme durumu — satır (gate) + buton AYNI state'i paylaşsın diye tek hook.
 * (kanunIndirilmisMi modül-içi Set; reaktif değil → indirince satır güncellensin diye state burada.)
 */
import { useState } from 'react';
import { Alert } from 'react-native';

import { kanunIndir, kanunIndirilmisMi, kanunSil } from '@/lib/indirme';

export type IndirmeDurum = 'yok' | 'iniyor' | 'indirildi';

export function useKanunIndirme(klasor: string) {
  const [durum, setDurum] = useState<IndirmeDurum>(() =>
    klasor && kanunIndirilmisMi(klasor) ? 'indirildi' : 'yok',
  );
  const [yuzde, setYuzde] = useState(0);

  async function indir() {
    if (!klasor) return;
    setDurum('iniyor');
    setYuzde(0);
    try {
      await kanunIndir(klasor, (p) => setYuzde(p.yuzde));
      setDurum('indirildi');
    } catch (e) {
      setDurum('yok');
      Alert.alert('İndirilemedi', e instanceof Error ? e.message : 'Bağlantını kontrol et, tekrar dene.');
    }
  }

  function sil() {
    if (!klasor) return;
    Alert.alert(
      'İndirilen içeriği sil',
      'Bu kanunun indirilen görselleri cihazdan silinecek. Tekrar çalışmak için yeniden indirmen gerekir.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => void kanunSil(klasor).then(() => setDurum('yok')),
        },
      ],
    );
  }

  return { durum, yuzde, indir, sil };
}
