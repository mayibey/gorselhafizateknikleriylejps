import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { AppText } from '@/components/ui/app-text';
import { BottomTabInset, MaxContentWidth, Palette, Radius, Spacing } from '@/constants/theme';
import { getLaws, getStudyCards } from '@/db/database';
import type { LawWithCount } from '@/db/schema';
import { useBrans } from '@/lib/brans-context';
import { useRutbe } from '@/lib/rutbe-context';
import { rutbeGorur } from '@/lib/rutbe-kapsam';

export default function MevzuatScreen() {
  const router = useRouter();
  const { brans } = useBrans();
  const { rutbe } = useRutbe();
  const [laws, setLaws] = useState<LawWithCount[] | null>(null);
  // law_id → kutu≥1 (çalışılmış) kart sayısı. null = henüz yüklenmedi.
  const [ilerleme, setIlerleme] = useState<Map<number, number> | null>(null);
  const [arama, setArama] = useState('');
  const [hata, setHata] = useState(false);

  // Branş değişince + odağa her dönüşte tazele (çalışıp dönünce ilerleme güncel kalsın).
  const yukle = useCallback(() => {
    if (!brans) return;
    setHata(false);
    void getLaws(brans)
      .then(setLaws)
      .catch(() => setHata(true));
    // İlerleme AYRI (degrade olur): tek getStudyCards → law_id bazında kutu≥1 sayımı.
    // Parite: NATIVE yalnız çalışılmış kartları, WEB tümünü döndürür; kutu≥1 filtresi
    // iki platformda da AYNI "çalışılmış" kümesini verir.
    void getStudyCards()
      .then((studied) => {
        const map = new Map<number, number>();
        for (const c of studied) {
          if (c.kutu >= 1) map.set(c.law_id, (map.get(c.law_id) ?? 0) + 1);
        }
        setIlerleme(map);
      })
      .catch(() => setIlerleme(new Map()));
  }, [brans]);

  useFocusEffect(yukle);

  // DEĞİŞMEDİ: yalnız içeriği OLAN müşterek + rütbe kapsamındaki kanunlar.
  const musterek =
    laws?.filter((l) => l.blok === 'müşterek' && l.kartSayisi > 0 && rutbeGorur(l.id, rutbe)) ?? [];

  // İstemci-taraflı arama (ada/numaraya göre — ad zaten "5237 sayılı…" içeriyor). Yeni sorgu yok.
  const q = arama.trim().toLocaleLowerCase('tr');
  const gosterilen = q ? musterek.filter((l) => l.ad.toLocaleLowerCase('tr').includes(q)) : musterek;

  function kanunaGit(law: LawWithCount) {
    // DEĞİŞMEDİ: Kanun → Patika (bölümler). Bölümsüz kanun patikada tek düğüm gösterir.
    router.push({ pathname: '/patika', params: { lawId: String(law.id) } });
  }

  return (
    <SafeAreaView style={st.safe} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <View style={st.header}>
        <AppText variant="baslik" color="metinAcik" bold>
          Mevzuat
        </AppText>
      </View>

      <ScrollView
        style={st.scroll}
        contentContainerStyle={[st.scrollContent, { paddingBottom: BottomTabInset + Spacing.four }]}
        keyboardShouldPersistTaps="handled">
        <View style={st.body}>
          {/* Arama */}
          <View style={st.aramaKutu}>
            <MaterialCommunityIcons name="magnify" size={20} color={Palette.metinSolukAcik} />
            <TextInput
              style={st.aramaInput}
              value={arama}
              onChangeText={setArama}
              placeholder="Kanun ara…"
              placeholderTextColor={Palette.metinSolukAcik}
              returnKeyType="search"
              autoCorrect={false}
            />
            {arama.length > 0 ? (
              <Pressable onPress={() => setArama('')} hitSlop={8} accessibilityLabel="Aramayı temizle">
                <MaterialCommunityIcons name="close-circle" size={18} color={Palette.metinSolukAcik} />
              </Pressable>
            ) : null}
          </View>

          {hata ? (
            <DurumKutu
              ikon="alert-circle-outline"
              baslik="Yüklenemedi"
              aciklama="Mevzuat listesi yüklenemedi."
              buton={{ etiket: 'Tekrar dene', onPress: yukle }}
            />
          ) : laws === null ? (
            <DurumKutu ikon="book-open-variant" baslik="Yükleniyor…" aciklama="" />
          ) : (
            <>
              {/* Kategori başlığı — DEĞİŞMEDİ: yalnız MÜŞTEREK (branş "yakında", kapsam dışı) */}
              <AppText variant="etiket" bold color="metinSolukAcik" style={st.kategori}>
                MÜŞTEREK
              </AppText>
              {gosterilen.length === 0 ? (
                <AppText variant="kucuk" color="metinSolukAcik">
                  {q ? 'Eşleşen kanun yok.' : 'Bu bölümde kanun yok.'}
                </AppText>
              ) : (
                gosterilen.map((law) => (
                  <KanunSatir
                    key={law.id}
                    law={law}
                    calisilan={ilerleme?.get(law.id) ?? 0}
                    onPress={kanunaGit}
                  />
                ))
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function KanunSatir({
  law,
  calisilan,
  onPress,
}: {
  law: LawWithCount;
  calisilan: number;
  onPress: (law: LawWithCount) => void;
}) {
  const toplam = law.kartSayisi;
  const yuzde = toplam > 0 ? Math.round((calisilan / toplam) * 100) : 0;
  const tam = yuzde === 100;
  const baslanmis = yuzde > 0 && !tam;
  const bos = yuzde === 0;

  // Numara rozeti: addan kanun no çek ("5237 sayılı…" → "5237"); yoksa kitap ikonu fallback.
  const no = law.ad.match(/^(\d+)/)?.[1] ?? null;
  // Vurgu rengi (rozet + halka): tamam → yeşil, başlanmış → altın, boş → soluk.
  const vurgu = tam ? Palette.yesilAcik : baslanmis ? Palette.altin : Palette.metinSolukAcik;

  return (
    <Pressable
      style={({ pressed }) => [st.satir, pressed && st.pressed]}
      onPress={() => onPress(law)}
      accessibilityRole="button"
      accessibilityLabel={law.ad}>
      {/* Monogram rozeti */}
      <View style={st.rozet}>
        {no ? (
          <AppText variant="kucuk" bold color={bos ? 'metinSolukAcik' : tam ? 'yesilAcik' : 'altin'}>
            {no}
          </AppText>
        ) : (
          <MaterialCommunityIcons name="book-outline" size={20} color={vurgu} />
        )}
      </View>

      {/* Ad + ilerleme metni */}
      <View style={st.satirMetin}>
        <AppText
          variant="govde"
          bold
          color={bos ? 'metinSolukAcik' : 'metinAcik'}
          numberOfLines={1}
          ellipsizeMode="tail">
          {law.ad}
        </AppText>
        <AppText variant="etiket" color={tam ? 'yesilAcik' : 'metinSolukAcik'}>
          {calisilan}/{toplam} kart · %{yuzde} çalışıldı
        </AppText>
      </View>

      {/* İlerleme halkası ya da tamam tiki */}
      {tam ? (
        <MaterialCommunityIcons name="check-circle" size={26} color={Palette.yesilAcik} />
      ) : (
        <IlerlemeHalkasi yuzde={yuzde} />
      )}
    </Pressable>
  );
}

/** Küçük dairesel ilerleme: track + altın yay (yuzde kadar). yuzde 0 → yalnız track. */
function IlerlemeHalkasi({ yuzde }: { yuzde: number }) {
  const boyut = 28;
  const kalinlik = 3.5;
  const r = (boyut - kalinlik) / 2;
  const c = boyut / 2;
  const cevre = 2 * Math.PI * r;

  return (
    <Svg width={boyut} height={boyut}>
      <Circle cx={c} cy={c} r={r} stroke={Palette.kenarlikKoyu} strokeWidth={kalinlik} fill="none" />
      {yuzde > 0 ? (
        <Circle
          cx={c}
          cy={c}
          r={r}
          stroke={Palette.altin}
          strokeWidth={kalinlik}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={cevre}
          strokeDashoffset={cevre * (1 - yuzde / 100)}
          transform={`rotate(-90 ${c} ${c})`}
        />
      ) : null}
    </Svg>
  );
}

/** Koyu zeminli yükleniyor/hata kutusu (ortak Loading/EmptyState açık temalı). */
function DurumKutu({
  ikon,
  baslik,
  aciklama,
  buton,
}: {
  ikon: keyof typeof MaterialCommunityIcons.glyphMap;
  baslik: string;
  aciklama: string;
  buton?: { etiket: string; onPress: () => void };
}) {
  return (
    <View style={st.merkezKutu}>
      <MaterialCommunityIcons name={ikon} size={40} color={Palette.metinSolukAcik} />
      <AppText variant="altBaslik" bold color="metinAcik">
        {baslik}
      </AppText>
      {aciklama ? (
        <AppText variant="kucuk" color="metinSolukAcik">
          {aciklama}
        </AppText>
      ) : null}
      {buton ? (
        <Pressable onPress={buton.onPress} style={({ pressed }) => [st.retryBtn, pressed && st.pressed]}>
          <AppText variant="kucuk" bold color="zeminKoyu">
            {buton.etiket}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Palette.zeminKoyu,
  },
  header: {
    backgroundColor: Palette.yuzeyKoyu,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  scroll: {
    flex: 1,
    backgroundColor: Palette.zeminKoyu,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  body: {
    flexGrow: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  aramaKutu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.yuzeyKoyu,
    borderColor: Palette.kenarlikKoyu,
    borderWidth: 1,
    borderRadius: Radius.l,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  aramaInput: {
    flex: 1,
    color: Palette.metinAcik,
    fontSize: 16,
    paddingVertical: 0,
  },
  kategori: {
    letterSpacing: 1.5,
    marginTop: Spacing.one,
  },
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Palette.yuzeyKoyu,
    borderColor: Palette.kenarlikKoyu,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
  },
  rozet: {
    width: 44,
    height: 44,
    borderRadius: Radius.s,
    backgroundColor: Palette.yuzeyKoyuSoluk,
    borderColor: Palette.kenarlikKoyu,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  satirMetin: {
    flex: 1,
    gap: Spacing.half,
  },
  merkezKutu: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.six,
  },
  retryBtn: {
    marginTop: Spacing.two,
    backgroundColor: Palette.altin,
    borderRadius: Radius.s,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
});
