/**
 * İlk açılış uygulama turu — TÜM kullanıcılara (yeni + mevcut) en az bir kez gösterilir,
 * tamamlanınca `tanitimTamamla()` ile kalıcı işaretlenir (kök gate `_layout`'ta çağrılır).
 * Kapak (değer önermesi) + 4 tur slaytı (Karargah / kartlar / Talim / zayıf mevzi).
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnaButon } from '@/components/auth/ana-buton';
import { Arma } from '@/components/auth/arma';
import { DekoratifArkaplan } from '@/components/auth/dekoratif-arkaplan';
import { AppText } from '@/components/ui/app-text';
import { MaxContentWidth, Palette, Radius, Spacing } from '@/constants/theme';
import { RESMI_BAGLANTI_YOK } from '@/constants/yasal-metin';

const DEGERLER: { ikon: keyof typeof MaterialCommunityIcons.glyphMap; baslik: string; metin: string }[] = [
  { ikon: 'image-multiple', baslik: 'Görsel hafıza kartları', metin: 'Her kanun maddesi akılda kalıcı bir karikatür sahneye dönüşür.' },
  { ikon: 'clipboard-check', baslik: 'Deneme sınavları', metin: 'Kendini sına; %100 yapınca Takdir Belgesi kazan.' },
  { ikon: 'medal', baslik: 'Sicil & ödül', metin: 'İlerlemeni gör, takdir topla, zayıf mevzilerini kapat.' },
];

// Uygulama turu slaytları (kapaktan sonra) — her bölümü + kartların nasıl çalıştığını tanıtır.
const TUR: { ikon: keyof typeof MaterialCommunityIcons.glyphMap; baslik: string; metin: string }[] = [
  {
    ikon: 'home-variant-outline',
    baslik: 'Karargah — ana üssün',
    metin: 'Günün maddesi, günlük görevin ve zayıf mevzilerin burada toplanır. Her gün çalışmaya buradan başlarsın.',
  },
  {
    ikon: 'card-text-outline',
    baslik: 'Kartlar — her madde bir sahne',
    metin: 'Kartı aç: karikatürü gör, sesli anlatımı dinle, istersen madde metnini oku. Parmağınla kaydırarak sıradakine geç; "Öğrendim" ya da "Tekrar" ile işaretle.',
  },
  {
    ikon: 'clipboard-check-outline',
    baslik: 'Talim — kendini sına',
    metin: 'Deneme sınavlarıyla test et. Bir kanunun tüm testlerini %100 doğru çözünce Takdir Belgesi kazanırsın.',
  },
  {
    ikon: 'target',
    baslik: 'Zayıf mevzi — eksiğini kapat',
    metin: 'Yanlış yaptığın maddeler zayıf mevzine düşer. Çalış, sonra o mevzinin sorusunu doğru çöz — böylece gerçekten öğrendiğin doğrulanır ve mevzi kapanır.',
  },
];

export function UygulamaTuru({ onTamam }: { onTamam: () => void }) {
  const [adim, setAdim] = useState(0);
  const toplam = 1 + TUR.length; // 0 = kapak, 1..TUR.length = tur slaytları
  const sonMu = adim >= TUR.length;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <DekoratifArkaplan />

      {/* Sağ üst: Geç (turu atla). */}
      <Pressable style={styles.gecLink} onPress={onTamam} hitSlop={10} accessibilityRole="button">
        <AppText variant="kucuk" color="solukMetin" bold>
          Geç
        </AppText>
      </Pressable>

      {adim === 0 ? (
        <ScrollView contentContainerStyle={styles.icerik}>
          <View style={styles.markaArma}>
            <Arma />
            <AppText variant="etiket" bold color="altinMetin" style={styles.markaAd}>
              MEVZU · JSPS
            </AppText>
          </View>
          <AppText variant="baslik" bold color="lacivert" style={styles.ortali}>
            Kanunları görselle, kalıcı öğren
          </AppText>
          <AppText variant="kucuk" color="solukMetin" style={[styles.ortali, styles.altyazi]}>
            Kuru metni ezberleme; karikatür kartlar, deneme sınavları ve ödül-sicil temasıyla
            JSPS'e hazırlan.
          </AppText>
          <AppText variant="etiket" color="solukMetin" style={[styles.ortali, styles.disclaimer]}>
            {RESMI_BAGLANTI_YOK}
          </AppText>
          <View style={styles.degerler}>
            {DEGERLER.map((d) => (
              <View key={d.baslik} style={styles.degerSatir}>
                <View style={styles.degerIkon}>
                  <MaterialCommunityIcons name={d.ikon} size={22} color={Palette.altinKoyu} />
                </View>
                <View style={styles.degerMetin}>
                  <AppText variant="govde" bold color="anaMetin">
                    {d.baslik}
                  </AppText>
                  <AppText variant="kucuk" color="solukMetin">
                    {d.metin}
                  </AppText>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={[styles.icerik, styles.turIcerik]}>
          <View style={styles.turIkonKutu}>
            <MaterialCommunityIcons name={TUR[adim - 1].ikon} size={54} color={Palette.altinKoyu} />
          </View>
          <AppText variant="baslik" bold color="lacivert" style={styles.ortali}>
            {TUR[adim - 1].baslik}
          </AppText>
          <AppText variant="govde" color="solukMetin" style={[styles.ortali, styles.turMetin]}>
            {TUR[adim - 1].metin}
          </AppText>
        </ScrollView>
      )}

      <View style={styles.altBlok}>
        <View style={styles.noktalar}>
          {Array.from({ length: toplam }).map((_, i) => (
            <View key={i} style={[styles.nokta, i === adim && styles.noktaAktif]} />
          ))}
        </View>
        <AnaButon
          etiket={sonMu ? 'Başla' : 'İleri'}
          onPress={sonMu ? onTamam : () => setAdim((a) => a + 1)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Palette.kremZemin,
  },
  icerik: {
    flexGrow: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
    gap: Spacing.two,
  },
  markaArma: {
    alignItems: 'center',
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  markaAd: {
    letterSpacing: 1,
  },
  ortali: {
    textAlign: 'center',
  },
  altyazi: {
    lineHeight: 20,
    marginTop: Spacing.one,
  },
  disclaimer: {
    lineHeight: 15,
    marginTop: Spacing.two,
    opacity: 0.85,
  },
  degerler: {
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  degerSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
  },
  degerIkon: {
    width: 44,
    height: 44,
    borderRadius: Radius.m,
    backgroundColor: Palette.altinSolukYuzey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  degerMetin: {
    flex: 1,
    gap: Spacing.half,
  },
  altBlok: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.four,
  },
  gecLink: {
    position: 'absolute',
    top: Spacing.three,
    right: Spacing.four,
    zIndex: 2,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  turIcerik: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: Spacing.three,
  },
  turIkonKutu: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: Palette.altinSolukYuzey,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.two,
  },
  turMetin: {
    lineHeight: 24,
    maxWidth: 380,
    alignSelf: 'center',
  },
  noktalar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.one,
    marginBottom: Spacing.three,
  },
  nokta: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.kenarlik,
  },
  noktaAktif: {
    backgroundColor: Palette.altin,
    width: 20,
  },
});
