/**
 * Takdir Belgesi — deneme sınavını %100 doğrulukla geçince ekrana çıkan görsel sertifika.
 * Sınav sonuç ekranında + Evsaf'tan tekrar açıldığında gösterilir. Salt görsel (veri enjekte).
 * Kayıt ayrıca sicil_kayitlari'na işlenir (lib/sicil-servis degerlendirSicil → odulDegerlendir).
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';

function tarihFmt(iso: string): string {
  const [y, a, g] = iso.split('-');
  return y && a && g ? `${g}.${a}.${y}` : iso;
}

export function TakdirBelgesi({ kanunAd, tarih }: { kanunAd: string; tarih: string }) {
  return (
    <View style={styles.belge}>
      <View style={styles.icCerceve}>
        <View style={styles.celenk}>
          <MaterialCommunityIcons name="star-four-points" size={14} color={Palette.altinKoyu} />
          <MaterialCommunityIcons name="medal" size={46} color={Palette.altinKoyu} />
          <MaterialCommunityIcons name="star-four-points" size={14} color={Palette.altinKoyu} />
        </View>
        <AppText variant="etiket" bold color="altinKoyu" style={styles.antet}>
          EĞİTİM KOMUTANLIĞI
        </AppText>
        <AppText variant="baslik" bold color="lacivert" style={styles.baslik}>
          TAKDİR BELGESİ
        </AppText>
        <View style={styles.ayrac} />
        <AppText variant="govde" color="anaMetin" style={styles.govde}>
          <AppText variant="govde" bold color="lacivert">
            {kanunAd}
          </AppText>{' '}
          deneme sınavını <AppText variant="govde" bold color="altinKoyu">%100 doğrulukla</AppText>{' '}
          tamamlayan personel TAKDİR edilmiştir. Bu azim ve disiplin, birliğe örnek gösterilir.
        </AppText>
        <View style={styles.alt}>
          <AppText variant="etiket" color="solukMetin">
            {tarihFmt(tarih)}
          </AppText>
          <AppText variant="etiket" bold color="solukMetin">
            — Eğitim Komutanlığı
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  belge: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.altinKoyu,
    borderWidth: 2,
    borderRadius: Radius.l,
    padding: Spacing.two,
  },
  icCerceve: {
    borderColor: Palette.altinSolukYuzey,
    borderWidth: 1,
    borderRadius: Radius.m,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    gap: Spacing.one,
  },
  celenk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  antet: {
    letterSpacing: 2,
    marginTop: Spacing.one,
  },
  baslik: {
    letterSpacing: 1,
    textAlign: 'center',
  },
  ayrac: {
    width: 60,
    height: 2,
    backgroundColor: Palette.altinKoyu,
    marginVertical: Spacing.one,
  },
  govde: {
    textAlign: 'center',
    lineHeight: 22,
  },
  alt: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    marginTop: Spacing.three,
  },
});
