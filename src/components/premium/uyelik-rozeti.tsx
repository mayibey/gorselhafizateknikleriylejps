/**
 * Premium göstergeleri:
 *  - <UyelikTaci/>   → küçük altın taç rozeti (premium'sa görünür; Karargah üstü + Evsaf başlığı).
 *  - <UyelikKarti/>  → "Üyeliğim" detay kartı (aktif paketler + tip/bitiş; yalnız premium'da, Evsaf).
 * Hak SUNUCUDAN (useUyelik) gelir; kullanıcı satın alınca otomatik belirir.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { urunBilgi } from '@/constants/urunler';
import { useUyelik } from '@/lib/uyelik-context';
import { useKisiselOzellik } from '@/lib/ozellik';

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
export function UyelikKarti({ gomulu }: { gomulu?: boolean } = {}) {
  const { aktifHaklar } = useUyelik();
  const router = useRouter();
  // GECE KARARI S2 + başkan 10 Ağu ("amatör"): taç yasak → kalkan-yıldız; yeşil tik gibi
  // ikinci ikon dili yok; "hep senin" tekrarı yok. Bayraksızda eski hâl aynen.
  const sade = useKisiselOzellik('talim-mevzuata');
  // Başkan 10 Ağu: kategoriler tıklayınca aşağı açılsın — bayraklıda başlık satırı
  // kapalı başlar (özet altyazıyla), dokununca detay iner.
  const [acik, setAcik] = useState(false);
  if (aktifHaklar.length === 0) return null;
  const ozet = aktifHaklar
    .map((h) => {
      const b = urunBilgi(h.urun);
      return b ? b.ad : h.urun;
    })
    .join(' · ');
  const govdeGizli = !gomulu && sade && !acik;
  // gomulu (10 Ağu redesign): birleşik Profil kartının içinde — kendi kartı yok,
  // "ÜYELİK" etiketi + haklar + yönet; hep açık.
  if (gomulu) {
    return (
      <View style={styles.gomuluBlok}>
        <AppText variant="etiket" color="kartMetinIkincil" bold>
          ÜYELİK
        </AppText>
        {aktifHaklar.map((h) => {
          const bilgi = urunBilgi(h.urun);
          const alt =
            h.tip === 'abonelik' && h.bitis
              ? `Yıllık · yenilenme ${tarihGoster(h.bitis)}`
              : 'Ömür boyu';
          return (
            <View key={h.urun} style={styles.satir}>
              <View style={styles.satirMetin}>
                <AppText variant="kucuk" bold color="beyaz">
                  {bilgi ? bilgi.ad : h.urun}
                </AppText>
                <AppText variant="etiket" color="kartMetinIkincil">
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
          <AppText variant="etiket" bold color="altinParlak">
            Üyeliği yönet
          </AppText>
          <MaterialCommunityIcons name="chevron-right" size={16} color={Palette.altinParlak} />
        </Pressable>
      </View>
    );
  }
  return (
    // Sade (bayraklı, başkan 10 Ağu): diğer Evsaf kategorileriyle BİREBİR aynı biçim —
    // yuvarlak ikon + "Üyelik Bilgilerim" + ok; altın çerçeve yerine standart kenarlık.
    <View style={[styles.kart, sade && styles.kartSade]}>
      <Pressable
        style={styles.kartBaslik}
        disabled={!sade}
        onPress={() => setAcik((v) => !v)}
        accessibilityRole={sade ? 'button' : undefined}
        accessibilityLabel="Üyelik bölümünü aç/kapat">
        {sade ? (
          <View style={styles.sadeIkon}>
            <MaterialCommunityIcons name="shield-star" size={22} color={Palette.lacivert} />
          </View>
        ) : (
          <MaterialCommunityIcons name="crown" size={20} color={Palette.altinKoyu} />
        )}
        <View style={styles.baslikMetin}>
          <AppText variant="govde" bold color="lacivert">
            {sade ? 'Üyelik Bilgilerim' : 'Üyeliğim'}
          </AppText>
          {govdeGizli ? (
            <AppText variant="etiket" color="solukMetin" numberOfLines={1}>
              {ozet}
            </AppText>
          ) : null}
        </View>
        {sade ? (
          <MaterialCommunityIcons
            name={govdeGizli ? 'chevron-down' : 'chevron-up'}
            size={22}
            color={Palette.solukMetin}
          />
        ) : null}
      </Pressable>
      {govdeGizli ? null : (
      <>
      {aktifHaklar.map((h) => {
        const bilgi = urunBilgi(h.urun);
        const alt =
          h.tip === 'abonelik' && h.bitis
            ? `Yıllık · yenilenme ${tarihGoster(h.bitis)}`
            : sade
              ? 'Ömür boyu'
              : 'Ömür boyu · hep senin';
        return (
          <View key={h.urun} style={styles.satir}>
            {sade ? null : (
              <View style={styles.satirIkon}>
                <MaterialCommunityIcons name="check-decagram" size={18} color={Palette.yesil} />
              </View>
            )}
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
      </>
      )}
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
  gomuluBlok: {
    gap: Spacing.two,
  },
  // Sade (kategori) hâl: diğer Evsaf kartlarıyla aynı kenarlık.
  kartSade: {
    borderColor: Palette.kenarlik,
  },
  sadeIkon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.altinSolukYuzey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kartBaslik: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  baslikMetin: {
    flex: 1,
    gap: 1,
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
