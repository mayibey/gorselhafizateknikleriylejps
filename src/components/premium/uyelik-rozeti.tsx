/**
 * Premium göstergeleri:
 *  - <UyelikTaci/>   → küçük altın taç rozeti (premium'sa görünür; Karargah üstü + Evsaf başlığı).
 *  - <UyelikKarti/>  → "Üyeliğim" detay kartı (aktif paketler + tip/bitiş; yalnız premium'da, Evsaf).
 * Hak SUNUCUDAN (useUyelik) gelir; kullanıcı satın alınca otomatik belirir.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { urunBilgi } from '@/constants/urunler';
import { useUyelik } from '@/lib/uyelik-context';

/** Küçük altın taç rozeti — premium değilse hiç render edilmez. Dokununca Üyelik ekranı. */
export function UyelikTaci({ boyut = 16 }: { boyut?: number }) {
  const { premium } = useUyelik();
  const router = useRouter();
  if (!premium) return null;
  return (
    <Pressable
      onPress={() => router.push('/paywall')}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel="Premium üyeliğin — detay için dokun"
      style={({ pressed }) => [styles.taci, pressed && styles.pressed]}>
      <MaterialCommunityIcons name="crown" size={boyut} color={Palette.altinKoyu} />
    </Pressable>
  );
}

/** Aktif abonelik bitiş tarihini gün.ay.yıl gösterir. */
function tarihGoster(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const iki = (n: number) => String(n).padStart(2, '0');
  return `${iki(d.getDate())}.${iki(d.getMonth() + 1)}.${d.getFullYear()}`;
}

/** "Üyeliğim" kartı — aktif paketleri listeler. Premium değilse hiç gösterilmez (Ayarlar'daki
 *  "Premium" satırı zaten paywall'a götürür → burada tekrarlamayız). */
export function UyelikKarti() {
  const { aktifHaklar } = useUyelik();
  const router = useRouter();
  if (aktifHaklar.length === 0) return null;
  return (
    <View style={styles.kart}>
      <View style={styles.kartBaslik}>
        <MaterialCommunityIcons name="crown" size={20} color={Palette.altinKoyu} />
        <AppText variant="govde" bold color="lacivert">
          Üyeliğim
        </AppText>
      </View>
      {aktifHaklar.map((h) => {
        const bilgi = urunBilgi(h.urun);
        const alt =
          h.tip === 'abonelik' && h.bitis
            ? `Yıllık · yenilenme ${tarihGoster(h.bitis)}`
            : 'Ömür boyu · hep senin';
        return (
          <View key={h.urun} style={styles.satir}>
            <View style={styles.satirIkon}>
              <MaterialCommunityIcons name="check-decagram" size={18} color={Palette.yesil} />
            </View>
            <View style={styles.satirMetin}>
              <AppText variant="kucuk" bold color="anaMetin">
                {bilgi ? bilgi.ad : h.urun}
              </AppText>
              <AppText variant="etiket" color="solukMetin">
                {alt}
              </AppText>
            </View>
          </View>
        );
      })}
      <Pressable
        onPress={() => router.push('/paywall')}
        hitSlop={8}
        accessibilityRole="button"
        style={({ pressed }) => [styles.yonet, pressed && styles.pressed]}>
        <AppText variant="etiket" bold color="lacivert">
          Üyeliği yönet
        </AppText>
        <MaterialCommunityIcons name="chevron-right" size={16} color={Palette.lacivert} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  taci: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Palette.altinSolukYuzey,
    borderWidth: 1,
    borderColor: Palette.altin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kart: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.altin,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  kartBaslik: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  satirIkon: {
    width: 26,
    alignItems: 'center',
  },
  satirMetin: {
    flex: 1,
    gap: Spacing.half,
  },
  yonet: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.half,
    marginTop: Spacing.one,
  },
  pressed: {
    opacity: 0.85,
  },
});
