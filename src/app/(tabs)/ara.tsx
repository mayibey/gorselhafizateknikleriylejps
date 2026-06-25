import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { Loading } from '@/components/ui/loading';
import { Screen } from '@/components/ui/screen';
import { FontFamily, Palette, Radius, Spacing } from '@/constants/theme';
import { getAllCards } from '@/db/database';
import { maddeMetni } from '@/db/madde-metinleri';
import type { CardWithLaw } from '@/db/schema';
import { araIndeksHazirla, araKanunlar, trKucuk, type AramaSonuc } from '@/lib/ara';
import { getSonAramalar, sonAramaEkle } from '@/lib/son-aramalar';

// Sekme değişiminde / sonuca gidip dönünce SON ARAMA hatırlansın (kullanıcı 3-4 sonuçtan
// ilkini beğenmezse geri dönüp diğerine girebilsin). Modül seviyesinde → remount'a dayanır.
let sonSorgu = '';

export default function AraScreen() {
  const router = useRouter();
  const [sorgu, setSorgu] = useState(sonSorgu);
  const [cards, setCards] = useState<CardWithLaw[] | null>(null);
  const [sonAramalar, setSonAramalar] = useState<string[]>([]); // 8B'de gösterilecek
  const [hata, setHata] = useState(false);

  const yukle = useCallback(() => {
    setHata(false);
    getAllCards()
      .then(setCards)
      .catch(() => setHata(true));
  }, []);

  // Kartları bir kez yükle (odakta, yoksa) + son aramalar geçmişini tazele.
  useFocusEffect(
    useCallback(() => {
      if (cards === null) yukle();
      void getSonAramalar().then(setSonAramalar);
    }, [cards, yukle]),
  );

  // İndeks: kartlar yüklenince BİR kez (pahalı önişlem). Arama: her tuşta hızlı filtre.
  const indeks = useMemo(() => (cards ? araIndeksHazirla(cards, maddeMetni) : []), [cards]);
  const sonuclar = useMemo(() => araKanunlar(indeks, sorgu), [indeks, sorgu]);

  // Son arama kaydı: HER tuşta DEĞİL → sorgu ~700ms durunca + ≥2 harf (debounce, spam yok).
  useEffect(() => {
    const q = sorgu.trim();
    if (q.length < 2) return;
    const t = setTimeout(() => {
      void sonAramaEkle(q).then(setSonAramalar);
    }, 700);
    return () => clearTimeout(t);
  }, [sorgu]);

  function degis(t: string) {
    sonSorgu = t;
    setSorgu(t);
  }

  function ac(s: AramaSonuc) {
    // Kanun akışını aç + eşleşen maddenin kartından başla (akis 'kart' parametresi).
    router.push({
      pathname: '/akis',
      params: { lawId: String(s.lawId), kart: String(s.cardId) },
    });
  }

  const az = sorgu.trim().length < 2;

  return (
    <Screen title="Ara" scroll={false}>
      <TextInput
        value={sorgu}
        onChangeText={degis}
        placeholder="Kanun metninde kelime ara…"
        placeholderTextColor={Palette.solukMetin}
        style={styles.input}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        clearButtonMode="while-editing"
      />

      {hata ? (
        <EmptyState
          ikon="alert-circle-outline"
          ikonRenk="kirmizi"
          baslik="Yüklenemedi"
          aciklama="Kanun verisi yüklenemedi."
          buton={{ etiket: 'Tekrar dene', onPress: yukle }}
        />
      ) : cards === null ? (
        <Loading />
      ) : az ? (
        <EmptyState
          ikon="magnify"
          baslik="Kanun metninde ara"
          aciklama="En az 2 harf yaz; kelimenin geçtiği kanun ve maddeleri bulur."
        />
      ) : sonuclar.length === 0 ? (
        <EmptyState
          ikon="file-search-outline"
          baslik="Sonuç yok"
          aciklama={`"${sorgu.trim()}" hiçbir madde metninde veya başlığında bulunamadı.`}
        />
      ) : (
        <FlatList
          data={sonuclar}
          keyExtractor={(s) => `${s.lawId}-${s.maddeNo}`}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.liste}
          ListHeaderComponent={
            <AppText variant="kucuk" color="solukMetin" style={styles.sayac}>
              {sonuclar.length} madde bulundu
            </AppText>
          }
          renderItem={({ item }) => <Sonuc s={item} q={sorgu.trim()} onPress={() => ac(item)} />}
        />
      )}
    </Screen>
  );
}

/** Tek sonuç kartı: kanun · madde no — başlık · vurgulu snippet. */
function Sonuc({ s, q, onPress }: { s: AramaSonuc; q: string; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.kart, pressed && styles.pressed]} onPress={onPress}>
      <View style={styles.ust}>
        <AppText variant="etiket" color="solukMetin" numberOfLines={1} style={styles.kanun}>
          {s.kanun}
        </AppText>
        <View style={styles.rozet}>
          <AppText variant="etiket" color="lacivert" bold>
            {s.blok === 'müşterek' ? 'Müşterek' : 'Branş'}
          </AppText>
        </View>
      </View>
      <AppText variant="govde" color="lacivert" bold style={styles.baslik}>
        {s.baslik ? `${s.maddeNo} — ${s.baslik}` : s.maddeNo}
      </AppText>
      {vurgula(s.snippet, q)}
    </Pressable>
  );
}

/** Snippet içinde sorgu geçişlerini (Türkçe-duyarlı) kalın+lacivert vurgular. */
function vurgula(metin: string, q: string) {
  const qK = trKucuk(q);
  if (!qK) {
    return (
      <AppText variant="kucuk" color="solukMetin" style={styles.snippet}>
        {metin}
      </AppText>
    );
  }
  const mK = trKucuk(metin);
  const parcalar: { t: string; v: boolean }[] = [];
  let i = 0;
  while (i < metin.length) {
    const idx = mK.indexOf(qK, i);
    if (idx === -1) {
      parcalar.push({ t: metin.slice(i), v: false });
      break;
    }
    if (idx > i) parcalar.push({ t: metin.slice(i, idx), v: false });
    parcalar.push({ t: metin.slice(idx, idx + q.length), v: true });
    i = idx + q.length;
  }
  return (
    <AppText variant="kucuk" color="solukMetin" style={styles.snippet}>
      {parcalar.map((p, k) =>
        p.v ? (
          <AppText key={k} variant="kucuk" color="lacivert" bold>
            {p.t}
          </AppText>
        ) : (
          p.t
        ),
      )}
    </AppText>
  );
}

const styles = StyleSheet.create({
  input: {
    fontFamily: FontFamily,
    fontSize: 16,
    color: Palette.lacivert,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  liste: {
    paddingBottom: Spacing.five,
    gap: Spacing.two,
  },
  sayac: {
    paddingVertical: Spacing.one,
  },
  kart: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  ust: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  kanun: {
    flex: 1,
  },
  rozet: {
    backgroundColor: Palette.kremZemin,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.s,
  },
  baslik: {
    marginTop: Spacing.half,
  },
  snippet: {
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.85,
  },
});
