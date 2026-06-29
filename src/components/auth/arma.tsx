/**
 * Üst orta arma — altın defne çelengi (iki yana yapraklar) + ortada kalkan-yıldız.
 * Referanstaki gösterişli armanın marka-uyumlu (altın) hali.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { Palette } from '@/constants/theme';

const YAPRAKLAR = [
  { boy: 13, donus: 35, ust: 2 },
  { boy: 16, donus: 12, ust: -2 },
  { boy: 16, donus: -12, ust: -2 },
  { boy: 13, donus: -35, ust: 2 },
];

function Celenk({ sag }: { sag?: boolean }) {
  return (
    <View style={[styles.celenk, sag && styles.celenkSag]}>
      {YAPRAKLAR.map((y, i) => (
        <MaterialCommunityIcons
          key={i}
          name="leaf"
          size={y.boy}
          color={i === 1 || i === 2 ? Palette.altinKoyu : Palette.altin}
          style={{ transform: [{ rotate: `${y.donus}deg` }], marginTop: y.ust }}
        />
      ))}
    </View>
  );
}

export function Arma() {
  return (
    <View style={styles.kok}>
      <Celenk />
      <View style={styles.daire}>
        <MaterialCommunityIcons name="shield-star" size={28} color={Palette.altinKoyu} />
      </View>
      <Celenk sag />
    </View>
  );
}

const styles = StyleSheet.create({
  kok: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  celenk: {
    height: 52,
    justifyContent: 'center',
    marginRight: -6,
  },
  celenkSag: {
    marginRight: 0,
    marginLeft: -6,
    transform: [{ scaleX: -1 }],
  },
  daire: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Palette.altinSolukYuzey,
    borderWidth: 1.5,
    borderColor: Palette.altin,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
