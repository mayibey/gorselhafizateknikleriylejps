import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Spacing } from '@/constants/theme';
import { KILIT_AKTIF } from '@/constants/urunler';
import { type BransKitap, bransKitaplari } from '@/lib/brans-kitap';
import { useBrans } from '@/lib/brans-context';
import { hafifDokun } from '@/lib/dokunus';
import { useUyelik } from '@/lib/uyelik-context';

/**
 * ALTIN ÖZET KİTAPLARI (başkan, 23 Eyl 2026): Karargâh şeridi buraya gelir; kitap doğrudan
 * açılmaz, LİSTE görünür ("ekranda kitaplar sıralanacak, tıklanınca açsınlar"). Liste:
 *  1) Müşterek kitap — herkese aynı (sunucuda 'musterek' sanal branşı).
 *  2) Branş kitabı — hazırsa (sunucuda 'altin_<brans>' sanal branşı; jandarma dâhil, çünkü
 *     jandarmanın Mevzuat>Branş listesi kanun kartlarıdır, oraya satır yazılamaz).
 * Hazır olmayan branş için "hazırlanıyor" satırı çıkar (branşlar sırayla yükleniyor).
 * Kitaplar premium içerik: kilitliyse satır kilit gösterir ve paywall'a gider (okuyucu da ayrıca
 * kapılı — derin bağlantıyla gelene de kapı var).
 */
export default function AltinOzetScreen() {
  const router = useRouter();
  const { brans } = useBrans();
  const { premium, yukleniyor: uyelikYukleniyor } = useUyelik();
  const kilitli = KILIT_AKTIF && !uyelikYukleniyor && !premium;
  const [musterek, setMusterek] = useState<BransKitap[] | null>(null);
  const [bransKitap, setBransKitap] = useState<BransKitap[] | null>(null);

  useEffect(() => {
    let yasiyor = true;
    void bransKitaplari('musterek').then((l) => yasiyor && setMusterek(l)).catch(() => yasiyor && setMusterek([]));
    if (brans) {
      void bransKitaplari(`altin_${brans}`).then((l) => yasiyor && setBransKitap(l)).catch(() => yasiyor && setBransKitap([]));
    } else setBransKitap([]);
    return () => {
      yasiyor = false;
    };
  }, [brans]);

  const ac = (k: BransKitap) => {
    hafifDokun();
    if (kilitli) router.push('/paywall');
    else router.push({ pathname: '/kitap', params: { yol: k.dosyaYolu, baslik: k.baslik } });
  };

  const yukleniyor = musterek === null || bransKitap === null;
  const liste = [...(musterek ?? []), ...(bransKitap ?? [])];

  return (
    <Screen title="Altın Özet" headerAltinCizgi>
      <AppText variant="kucuk" color="solukMetin" style={st.aciklama}>
        Sınav kapsamındaki mevzuatın altın noktaları: hüküm, sade açıklaması ve sınav tuzağı bir arada.
        ★ işaretli noktalar çıkmış sınavlarda fiilen sorulmuş olanlar. Kitap kaldığın sayfadan açılır.
      </AppText>
      {yukleniyor ? (
        <View style={st.orta}>
          <ActivityIndicator color={Palette.altinKoyu} />
        </View>
      ) : null}
      {liste.map((k) => (
        <Pressable
          key={k.id}
          onPress={() => ac(k)}
          style={({ pressed }) => [st.kart, pressed && st.basili]}
          accessibilityRole="button"
          accessibilityLabel={kilitli ? `${k.baslik} — kilitli` : k.baslik}>
          <View style={st.ikonHalka}>
            <MaterialCommunityIcons name={kilitli ? 'lock' : 'book-open-page-variant'} size={24} color={Palette.altinKoyu} />
          </View>
          <View style={st.metin}>
            <AppText variant="govde" bold color="anaMetin" numberOfLines={2}>
              {k.baslik}
            </AppText>
            <AppText variant="kucuk" color="solukMetin">
              {kilitli ? 'Premium üyelere açık' : 'Okumak için dokun'}
            </AppText>
          </View>
          <View style={st.sag}>
            <AppText variant="etiket" bold color="altinMetin">
              {kilitli ? 'KİLİDİ AÇ' : 'AÇ'}
            </AppText>
            <MaterialCommunityIcons name="chevron-right" size={18} color={Palette.altinKoyu} />
          </View>
        </Pressable>
      ))}
      {!yukleniyor && (bransKitap ?? []).length === 0 ? (
        <View style={[st.kart, st.pasif]}>
          <View style={st.ikonHalka}>
            <MaterialCommunityIcons name="progress-clock" size={24} color={Palette.solukMetin} />
          </View>
          <View style={st.metin}>
            <AppText variant="govde" bold color="solukMetin" numberOfLines={2}>
              Branş kitabın hazırlanıyor
            </AppText>
            <AppText variant="kucuk" color="solukMetin">
              Branş kitapları sırayla yükleniyor; hazır olunca burada görünecek.
            </AppText>
          </View>
        </View>
      ) : null}
      {!yukleniyor && liste.length === 0 ? (
        <AppText variant="kucuk" color="solukMetin" style={st.aciklama}>
          Kitap listesi alınamadı. Bağlantını kontrol edip tekrar dene.
        </AppText>
      ) : null}
    </Screen>
  );
}

const st = StyleSheet.create({
  aciklama: { marginBottom: Spacing.three, lineHeight: 20 },
  orta: { paddingVertical: Spacing.four, alignItems: 'center' },
  kart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Palette.kartKremi,
    borderWidth: 1,
    borderColor: Palette.kenarlik,
    borderRadius: 14,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.three,
  },
  basili: { opacity: 0.85 },
  pasif: { opacity: 0.75 },
  ikonHalka: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.altinSolukYuzey,
  },
  metin: { flex: 1, gap: 2 },
  sag: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});
