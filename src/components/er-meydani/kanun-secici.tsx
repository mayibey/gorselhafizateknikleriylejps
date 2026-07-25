// Er Meydanı KANUN SEÇİCİ — MÜŞTEREK / BRANŞ gruplu, çok-seçimli liste.
// Oda kur + Hızlı eşleş ikisi de kullanır. "Karışık" = seçim yok = kullanıcının TÜM kapsamı (müşterek + branşı).
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';
import type { SeciciKanun } from '@/lib/er-meydani-mantik';

type Props = {
  musterek: SeciciKanun[];
  brans: SeciciKanun[];
  kanunlar: number[]; // seçili law_id'ler; boş = Karışık (tüm kapsam)
  setKanunlar: (ids: number[]) => void;
};

function Satir({ secili, ad, bold, onPress }: { secili: boolean; ad: string; bold?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, secili && styles.rowSecili, pressed && styles.basili]}>
      <MaterialCommunityIcons
        name={secili ? 'check-circle' : 'circle-outline'}
        size={18}
        color={secili ? Palette.lacivert : Palette.solukMetin}
      />
      <AppText variant="kucuk" color="anaMetin" bold={bold} style={styles.ad}>{ad}</AppText>
    </Pressable>
  );
}

export function KanunSecici({ musterek, brans, kanunlar, setKanunlar }: Props) {
  const set = new Set(kanunlar);
  const toggle = (id: number) => {
    const n = new Set(kanunlar);
    if (n.has(id)) n.delete(id); else n.add(id);
    setKanunlar([...n]);
  };
  const grupTumuSecili = (g: SeciciKanun[]) => g.length > 0 && g.every((k) => set.has(k.id));
  const grupToggle = (g: SeciciKanun[]) => {
    const n = new Set(kanunlar);
    if (grupTumuSecili(g)) g.forEach((k) => n.delete(k.id));
    else g.forEach((k) => n.add(k.id));
    setKanunlar([...n]);
  };

  return (
    <View style={styles.kutu}>
      {/* Karışık (tüm kapsam) */}
      <Satir secili={kanunlar.length === 0} ad="Karışık (müşterek + branşın)" bold onPress={() => setKanunlar([])} />

      {/* MÜŞTEREK */}
      <View style={styles.grupBaslikSatir}>
        <AppText variant="etiket" color="solukMetin" bold>MÜŞTEREK</AppText>
        <Pressable onPress={() => grupToggle(musterek)} hitSlop={8}>
          <AppText variant="etiket" color="lacivert" bold>{grupTumuSecili(musterek) ? 'Kaldır' : 'Tümünü seç'}</AppText>
        </Pressable>
      </View>
      {musterek.map((k) => <Satir key={k.id} secili={set.has(k.id)} ad={k.ad} onPress={() => toggle(k.id)} />)}

      {/* BRANŞ (kullanıcının kendi branşı) */}
      <View style={styles.grupBaslikSatir}>
        <AppText variant="etiket" color="solukMetin" bold>BRANŞ (senin branşın)</AppText>
        {brans.length > 0 ? (
          <Pressable onPress={() => grupToggle(brans)} hitSlop={8}>
            <AppText variant="etiket" color="lacivert" bold>{grupTumuSecili(brans) ? 'Kaldır' : 'Tümünü seç'}</AppText>
          </Pressable>
        ) : null}
      </View>
      {brans.length > 0 ? (
        brans.map((k) => <Satir key={k.id} secili={set.has(k.id)} ad={k.ad} onPress={() => toggle(k.id)} />)
      ) : (
        <AppText variant="kucuk" color="solukMetin" style={styles.bosBrans}>
          Branşın seçili değil — Sicil’den branşını seçersen branş kanunların burada çıkar.
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  kutu: { borderWidth: 1, borderColor: Palette.kenarlik, borderRadius: Radius.m, backgroundColor: Palette.kartKremi, paddingVertical: Spacing.one },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.two, paddingHorizontal: Spacing.three },
  rowSecili: { backgroundColor: Palette.altinSolukYuzey },
  ad: { flex: 1 },
  basili: { opacity: 0.6 },
  grupBaslikSatir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.three, paddingTop: Spacing.three, paddingBottom: Spacing.one, borderTopWidth: 1, borderTopColor: Palette.ayirici, marginTop: Spacing.one },
  bosBrans: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, fontStyle: 'italic' },
});
