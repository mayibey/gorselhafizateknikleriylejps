/**
 * İlk açılış uygulama turu — TÜM kullanıcılara (yeni + mevcut) en az bir kez gösterilir,
 * tamamlanınca `tanitimTamamla()` ile kalıcı işaretlenir (kök gate `_layout`'ta çağrılır).
 * SPOTLIGHT tasarımı: koyu lacivert sahne + merkezde parlayan altın ışık halkası içinde
 * o bölümün simgesi vurgulanır (karart-ve-parlat). Kapak (değer önermesi) + 4 tur slaytı.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Arma } from '@/components/auth/arma';
import { AppText } from '@/components/ui/app-text';
import { MaxContentWidth, Palette, Radius, Spacing } from '@/constants/theme';
import { RESMI_BAGLANTI_YOK } from '@/constants/yasal-metin';
import { useKisiselOzellik } from '@/lib/ozellik';

type Ikon = keyof typeof MaterialCommunityIcons.glyphMap;

const DEGERLER: { ikon: Ikon; baslik: string; metin: string }[] = [
  { ikon: 'image-multiple', baslik: 'Görsel hafıza kartları', metin: 'Her kanun maddesi akılda kalıcı bir karikatür sahneye dönüşür.' },
  { ikon: 'clipboard-check', baslik: 'Deneme sınavları', metin: 'Kendini sına; %100 yapınca Takdir Belgesi kazan.' },
  { ikon: 'medal', baslik: 'Sicil & ödül', metin: 'İlerlemeni gör, takdir topla, zayıf mevzilerini kapat.' },
];

// Uygulama turu slaytları (kapaktan sonra) — her bölümü + kartların nasıl çalıştığını tanıtır.
// `ekran` = spotlight'ın vurguladığı bölümün adı (üst rozet).
const TUR: { ikon: Ikon; ekran: string; baslik: string; metin: string }[] = [
  {
    ikon: 'home-variant-outline',
    ekran: 'KARARGAH',
    baslik: 'Karargah — ana üssün',
    metin: 'Günün maddesi, günlük görevin ve zayıf mevzilerin burada toplanır. Her gün çalışmaya buradan başlarsın.',
  },
  {
    ikon: 'card-text-outline',
    ekran: 'KARTLAR',
    baslik: 'Kartlar — her madde bir sahne',
    metin: 'Kartı aç: karikatürü gör, sesli anlatımı dinle, istersen madde metnini oku. Parmağınla kaydırarak sıradakine geç; "Öğrendim" ya da "Tekrar" ile işaretle.',
  },
  {
    ikon: 'clipboard-check-outline',
    ekran: 'TALİM',
    baslik: 'Talim — kendini sına',
    metin: 'Deneme sınavlarıyla test et. Bir kanunun tüm testlerini %100 doğru çözünce Takdir Belgesi kazanırsın.',
  },
  {
    ikon: 'target',
    ekran: 'ZAYIF MEVZİ',
    baslik: 'Zayıf mevzi — eksiğini kapat',
    metin: 'Yanlış yaptığın maddeler zayıf mevzine düşer. Çalış, sonra o mevzinin sorusunu doğru çöz — böylece gerçekten öğrendiğin doğrulanır ve mevzi kapanır.',
  },
];

/** Merkezde parlayan ışık halkası içinde bir simge (karart-ve-parlat spotlight çekirdeği). */
function Spot({ ikon, gece }: { ikon: Ikon; gece?: boolean }) {
  return (
    <View style={styles.spotSahne}>
      <View style={styles.glowDis} />
      <View style={styles.glowOrta} />
      <View style={[styles.spotDaire, gece && styles.spotDaireGece]}>
        <MaterialCommunityIcons name={ikon} size={60} color={gece ? Palette.altinParlak : Palette.altin} />
      </View>
    </View>
  );
}

export function UygulamaTuru({ onTamam }: { onTamam: () => void }) {
  // Gece dili (bayraklı): sahne lacivertten petrol geceye döner, vurgular parlak altın.
  const gece = useKisiselOzellik('talim-mevzuata');
  const [adim, setAdim] = useState(0);
  const toplam = 1 + TUR.length; // 0 = kapak, 1..TUR.length = tur slaytları
  const sonMu = adim >= TUR.length;

  return (
    <SafeAreaView style={[styles.safe, gece && styles.safeGece]} edges={['top', 'left', 'right', 'bottom']}>
      {/* Sahne zemini: koyu dikey gradient (üstte biraz açık → derinlik). */}
      <LinearGradient
        colors={gece ? ['#0A4258', '#04283A'] : [Palette.lacivert2, Palette.lacivert]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Sağ üst: Geç (turu atla). */}
      <Pressable style={styles.gecLink} onPress={onTamam} hitSlop={10} accessibilityRole="button">
        <AppText variant="kucuk" color="beyaz" bold style={styles.gecMetin}>
          Geç
        </AppText>
      </Pressable>

      {adim === 0 ? (
        <ScrollView contentContainerStyle={styles.icerik}>
          <View style={styles.markaArma}>
            <Arma />
            <AppText variant="etiket" bold color={gece ? 'altinParlak' : 'altinMetin'} style={styles.markaAd}>
              MEVZU · JSPS
            </AppText>
          </View>
          <AppText variant="baslik" bold color="beyaz" style={styles.ortali}>
            Kanunları görselle, kalıcı öğren
          </AppText>
          <AppText variant="kucuk" color="beyaz" style={[styles.ortali, styles.altyazi, styles.solukBeyaz]}>
            Kuru metni ezberleme; karikatür kartlar, deneme sınavları ve ödül-sicil temasıyla
            JSPS'ye hazırlan.
          </AppText>
          <AppText variant="etiket" color="beyaz" style={[styles.ortali, styles.disclaimer, styles.solukBeyaz]}>
            {RESMI_BAGLANTI_YOK}
          </AppText>
          <View style={styles.degerler}>
            {DEGERLER.map((d) => (
              <View key={d.baslik} style={styles.degerSatir}>
                <View style={styles.degerIkon}>
                  <MaterialCommunityIcons
                    name={d.ikon}
                    size={22}
                    color={gece ? Palette.altinParlak : Palette.altin}
                  />
                </View>
                <View style={styles.degerMetin}>
                  <AppText variant="govde" bold color="beyaz">
                    {d.baslik}
                  </AppText>
                  <AppText variant="kucuk" color="beyaz" style={styles.solukBeyaz}>
                    {d.metin}
                  </AppText>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={[styles.icerik, styles.turIcerik]}>
          <Spot ikon={TUR[adim - 1].ikon} gece={gece} />
          <View style={styles.ekranRozet}>
            <AppText variant="etiket" bold color={gece ? 'altinParlak' : 'altinMetin'} style={styles.ekranRozetMetin}>
              {adim}/{TUR.length} · {TUR[adim - 1].ekran}
            </AppText>
          </View>
          <AppText variant="baslik" bold color="beyaz" style={styles.ortali}>
            {TUR[adim - 1].baslik}
          </AppText>
          <AppText variant="govde" color="beyaz" style={[styles.ortali, styles.turMetin, styles.solukBeyaz]}>
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
        <Pressable
          style={({ pressed }) => [styles.ileriBtn, pressed && styles.pressed]}
          onPress={sonMu ? onTamam : () => setAdim((a) => a + 1)}
          accessibilityRole="button">
          <AppText variant="govde" bold color="lacivert">
            {sonMu ? 'Başla' : 'İleri'}
          </AppText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Palette.lacivert,
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
  solukBeyaz: {
    opacity: 0.78,
  },
  altyazi: {
    lineHeight: 20,
    marginTop: Spacing.one,
  },
  disclaimer: {
    lineHeight: 15,
    marginTop: Spacing.two,
  },
  degerler: {
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  degerSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(201,162,39,0.35)',
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
  },
  degerIkon: {
    width: 44,
    height: 44,
    borderRadius: Radius.m,
    backgroundColor: 'rgba(201,162,39,0.14)',
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
  gecMetin: {
    opacity: 0.85,
  },
  turIcerik: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: Spacing.three,
  },
  // --- Spotlight çekirdeği: iç içe parlayan altın halkalar (karart-ve-parlat) ---
  spotSahne: {
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  glowDis: {
    position: 'absolute',
    width: 232,
    height: 232,
    borderRadius: 116,
    backgroundColor: 'rgba(201,162,39,0.06)',
  },
  glowOrta: {
    position: 'absolute',
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: 'rgba(201,162,39,0.12)',
  },
  spotDaire: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: 'rgba(201,162,39,0.20)',
    borderWidth: 1,
    borderColor: Palette.altin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ekranRozet: {
    alignSelf: 'center',
    backgroundColor: 'rgba(201,162,39,0.16)',
    borderColor: 'rgba(201,162,39,0.5)',
    borderWidth: 1,
    borderRadius: Radius.s,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  ekranRozetMetin: {
    letterSpacing: 1,
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
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  noktaAktif: {
    backgroundColor: Palette.altin,
    width: 20,
  },
  ileriBtn: {
    backgroundColor: Palette.altin,
    borderRadius: Radius.m,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  // Gece dili (bayraklı)
  safeGece: {
    backgroundColor: '#04283A',
  },
  spotDaireGece: {
    borderColor: '#F3C24A',
  },
});
