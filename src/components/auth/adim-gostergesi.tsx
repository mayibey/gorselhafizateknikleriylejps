/**
 * Kayıt akışı adım göstergesi — 1 Hesap · 2 Profil Bilgileri · 3 Tamamla.
 * Tamamlanan adım ✓ (altın), aktif adım dolu (lacivert), bekleyen soluk.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Palette, Spacing } from '@/constants/theme';

const ETIKETLER = ['Hesap', 'Profil Bilgileri', 'Tamamla'];

export function AdimGostergesi({ adim }: { adim: number }) {
  return (
    <View style={styles.kok}>
      {ETIKETLER.map((etiket, i) => {
        const no = i + 1;
        const tamam = no < adim;
        const aktif = no === adim;
        const dolu = tamam || aktif;
        return (
          <View key={etiket} style={styles.sutun}>
            <View style={styles.satir}>
              <View style={[styles.cizgi, i === 0 && styles.gizli, no <= adim && styles.cizgiDolu]} />
              <View style={[styles.daire, aktif && styles.daireAktif, tamam && styles.daireTamam]}>
                {tamam ? (
                  <MaterialCommunityIcons name="check" size={14} color={Palette.beyaz} />
                ) : (
                  <AppText variant="etiket" bold color={aktif ? 'beyaz' : 'solukMetin'}>
                    {no}
                  </AppText>
                )}
              </View>
              <View style={[styles.cizgi, i === 2 && styles.gizli, no < adim && styles.cizgiDolu]} />
            </View>
            <AppText
              variant="etiket"
              bold={aktif}
              color={dolu ? 'lacivert' : 'solukMetin'}
              numberOfLines={1}
              style={styles.etiket}>
              {etiket}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  kok: {
    flexDirection: 'row',
  },
  sutun: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
  },
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  cizgi: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: Palette.kenarlik,
  },
  cizgiDolu: {
    backgroundColor: Palette.lacivert,
  },
  gizli: {
    opacity: 0,
  },
  daire: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: Palette.kenarlik,
    backgroundColor: Palette.kartKremi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daireAktif: {
    backgroundColor: Palette.lacivert,
    borderColor: Palette.lacivert,
    shadowColor: Palette.lacivert,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  daireTamam: {
    backgroundColor: Palette.altin,
    borderColor: Palette.altin,
  },
  etiket: {
    textAlign: 'center',
  },
});
