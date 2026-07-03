/**
 * Bir kanunun indirme durumu — satır (gate) + buton AYNI state'i paylaşsın diye tek hook.
 * (kanunIndirilmisMi modül-içi Set; reaktif değil → indirince satır güncellensin diye state burada.)
 */
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import {
  indirmeDinle,
  indirmeDurumuAl,
  kanunIndirBaslat,
  kanunIndirilmisMi,
  kanunSil,
} from '@/lib/indirme';

export type IndirmeDurum = 'yok' | 'iniyor' | 'indirildi';

export function useKanunIndirme(klasor: string) {
  const [durum, setDurum] = useState<IndirmeDurum>(() => {
    if (klasor && kanunIndirilmisMi(klasor)) return 'indirildi';
    if (klasor && indirmeDurumuAl(klasor)?.iniyor) return 'iniyor';
    return 'yok';
  });
  const [yuzde, setYuzde] = useState(() => (klasor ? (indirmeDurumuAl(klasor)?.yuzde ?? 0) : 0));
  const [inenBayt, setInenBayt] = useState(() =>
    klasor ? (indirmeDurumuAl(klasor)?.inenBayt ?? 0) : 0,
  );

  // Durum yöneticisini dinle → başka sekmeden dönünce / arka plandan gelince yüzde & durum
  // ekranda kayıtlı kalır (state artık modülde, bileşende değil).
  useEffect(() => {
    if (!klasor) return;
    const d = indirmeDurumuAl(klasor);
    if (d) {
      setYuzde(d.yuzde);
      setInenBayt(d.inenBayt);
      setDurum(d.iniyor ? 'iniyor' : 'indirildi');
    } else if (kanunIndirilmisMi(klasor)) {
      setDurum('indirildi');
    }
    return indirmeDinle(klasor, () => {
      const s = indirmeDurumuAl(klasor);
      if (s) {
        setYuzde(s.yuzde);
        setInenBayt(s.inenBayt);
        setDurum(s.iniyor ? 'iniyor' : 'indirildi');
      } else {
        setDurum(kanunIndirilmisMi(klasor) ? 'indirildi' : 'yok');
      }
    });
  }, [klasor]);

  async function indir() {
    if (!klasor) return;
    setDurum('iniyor');
    try {
      await kanunIndirBaslat(klasor);
      setDurum('indirildi');
    } catch (e) {
      setDurum(kanunIndirilmisMi(klasor) ? 'indirildi' : 'yok');
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

  return { durum, yuzde, inenBayt, indir, sil };
}
