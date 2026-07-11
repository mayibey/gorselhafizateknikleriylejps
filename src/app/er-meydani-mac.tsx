import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Share, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import {
  type GolgeRakip,
  type MacAdim,
  SORU_SAYISI,
  SORU_SURE_MS,
  getErMeydaniSorulari,
  golgeRakipUret,
  puanSoru,
  seedUret,
  toplamPuan,
} from '@/lib/er-meydani-mantik';
import { type ErMeydaniSonuc, sonucKaydet } from '@/lib/er-meydani';

type Faz = 'oyun' | 'geribildirim' | 'bitti';

/** ER MEYDANI — MAÇ. 10 soru, süreli, gölge rakibe karşı hız yarışı. Sonuç aynı ekranda. */
export default function ErMeydaniMacScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ seed?: string; mod?: string }>();

  // Tohum: verilmezse üret (doğrudan açılırsa). useMemo → tek sefer sabit.
  const seed = useMemo(() => {
    const p = Number(params.seed);
    return Number.isFinite(p) && p > 0 ? p : seedUret();
  }, [params.seed]);
  const mod = (params.mod === 'arkadas' ? 'arkadas' : 'hizli') as 'hizli' | 'arkadas';

  const sorular = useMemo(() => getErMeydaniSorulari(seed), [seed]);
  const golge = useMemo<GolgeRakip>(() => golgeRakipUret(seed), [seed]);

  const [index, setIndex] = useState(0);
  const [faz, setFaz] = useState<Faz>('oyun');
  const [secili, setSecili] = useState<number | null>(null);
  const [kalanMs, setKalanMs] = useState(SORU_SURE_MS);
  const [benAdimlar, setBenAdimlar] = useState<MacAdim[]>([]);
  const [sunucu, setSunucu] = useState<ErMeydaniSonuc | null>(null);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const baslangicRef = useRef<number>(Date.now());

  const benSkor = toplamPuan(benAdimlar);
  const golgeSkorSuana = golge.adimlar.slice(0, benAdimlar.length).reduce((t, a) => t + a.puan, 0);

  // Bir soruyu bitir: adımı kaydet, geri bildirim fazına geç, sonra ilerle.
  const soruyuBitir = useCallback(
    (secilenIndex: number | null) => {
      setFaz((f) => {
        if (f !== 'oyun') return f; // çift tetiklemeyi engelle (süre + tıklama)
        const gecenMs = Math.min(SORU_SURE_MS, Date.now() - baslangicRef.current);
        const soru = sorular[index];
        const dogru = secilenIndex !== null && soru != null && secilenIndex === soru.dogru;
        setSecili(secilenIndex);
        setBenAdimlar((a) => [...a, { dogru, gecenMs, puan: puanSoru(dogru, gecenMs) }]);
        return 'geribildirim';
      });
    },
    [index, sorular],
  );

  // Sayaç: yalnız 'oyun' fazında işler; 0'a inince süre doldu → yanlış say.
  useEffect(() => {
    if (faz !== 'oyun') return;
    baslangicRef.current = Date.now();
    setKalanMs(SORU_SURE_MS);
    const t = setInterval(() => {
      const kalan = SORU_SURE_MS - (Date.now() - baslangicRef.current);
      if (kalan <= 0) {
        setKalanMs(0);
        soruyuBitir(null);
      } else {
        setKalanMs(kalan);
      }
    }, 100);
    return () => clearInterval(t);
  }, [faz, index, soruyuBitir]);

  // Geri bildirim gösterildikten sonra ilerle (sonraki soru veya bitiş).
  useEffect(() => {
    if (faz !== 'geribildirim') return;
    const t = setTimeout(() => {
      if (index + 1 >= SORU_SAYISI || index + 1 >= sorular.length) {
        setFaz('bitti');
      } else {
        setIndex((i) => i + 1);
        setSecili(null);
        setFaz('oyun');
      }
    }, 1300);
    return () => clearTimeout(t);
  }, [faz, index, sorular.length]);

  // Maç bitince sonucu sunucuya yaz (bir kez).
  useEffect(() => {
    if (faz !== 'bitti' || kaydediliyor || sunucu !== null) return;
    setKaydediliyor(true);
    void sonucKaydet({
      mod,
      seed,
      benimPuan: toplamPuan(benAdimlar),
      rakipPuan: golge.toplam,
      golge: true,
      rakipId: null,
      rakipRumuz: golge.rumuz,
    })
      .then((s) => setSunucu(s))
      .finally(() => setKaydediliyor(false));
  }, [faz, benAdimlar, golge, mod, seed, kaydediliyor, sunucu]);

  if (sorular.length === 0) {
    return (
      <Screen title="Er Meydanı" onGeri={() => router.back()}>
        <AppText variant="govde" color="solukMetin" style={styles.ortala}>
          Soru havuzu yüklenemedi. Lütfen tekrar dene.
        </AppText>
      </Screen>
    );
  }

  if (faz === 'bitti') {
    return (
      <SonucGorunum
        benSkor={benSkor}
        golge={golge}
        sunucu={sunucu}
        kaydediliyor={kaydediliyor}
        onTekrar={() => router.replace({ pathname: '/er-meydani-mac', params: { seed: String(seedUret()), mod: 'hizli' } })}
        onSiralama={() => router.replace('/er-meydani-siralama')}
        onCik={() => router.replace('/er-meydani')}
      />
    );
  }

  const soru = sorular[index];
  const saniye = Math.ceil(kalanMs / 1000);
  const sureOran = Math.max(0, kalanMs / SORU_SURE_MS);

  return (
    <Screen title="Er Meydanı" onGeri={() => router.back()} scroll={false}>
      {/* Skor barı: Sen vs Rakip */}
      <View style={styles.skorBar}>
        <SkorKutu ad="Sen" skor={benSkor} vurgu />
        <View style={styles.ortaBilgi}>
          <AppText variant="etiket" color="solukMetin" bold>
            SORU {index + 1}/{SORU_SAYISI}
          </AppText>
          <View style={[styles.sureRozet, saniye <= 5 && styles.sureRozetAcil]}>
            <MaterialCommunityIcons name="timer-outline" size={16} color={saniye <= 5 ? Palette.beyaz : Palette.lacivert} />
            <AppText variant="kucuk" color={saniye <= 5 ? 'beyaz' : 'lacivert'} bold>
              {saniye}
            </AppText>
          </View>
        </View>
        <SkorKutu ad={golge.rumuz} skor={golgeSkorSuana} />
      </View>

      {/* Süre çubuğu */}
      <View style={styles.sureTrack}>
        <View style={[styles.sureDolu, { width: `${sureOran * 100}%` }, saniye <= 5 && styles.sureDoluAcil]} />
      </View>

      {/* Soru */}
      <View style={styles.soruKart}>
        <AppText variant="govde" bold style={styles.soruMetin}>
          {soru.soru}
        </AppText>
      </View>

      {/* Şıklar */}
      <View style={styles.siklar}>
        {soru.siklar.map((s, i) => {
          const gosterCevap = faz === 'geribildirim';
          const dogruSik = gosterCevap && i === soru.dogru;
          const yanlisSecim = gosterCevap && i === secili && i !== soru.dogru;
          return (
            <Pressable
              key={i}
              disabled={faz !== 'oyun'}
              onPress={() => soruyuBitir(i)}
              style={({ pressed }) => [
                styles.sik,
                pressed && faz === 'oyun' && styles.sikBasili,
                dogruSik && styles.sikDogru,
                yanlisSecim && styles.sikYanlis,
              ]}>
              <View style={[styles.sikHarf, (dogruSik || yanlisSecim) && styles.sikHarfVurgu]}>
                <AppText variant="kucuk" color={dogruSik || yanlisSecim ? 'beyaz' : 'lacivert'} bold>
                  {String.fromCharCode(65 + i)}
                </AppText>
              </View>
              <AppText variant="kucuk" color={dogruSik ? 'yesil' : yanlisSecim ? 'kirmizi' : 'anaMetin'} style={styles.sikMetin}>
                {s}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

function SkorKutu({ ad, skor, vurgu }: { ad: string; skor: number; vurgu?: boolean }) {
  return (
    <View style={styles.skorKutu}>
      <AppText variant="etiket" color={vurgu ? 'lacivert' : 'solukMetin'} bold numberOfLines={1}>
        {ad}
      </AppText>
      <AppText variant="altBaslik" color={vurgu ? 'altinMetin' : 'anaMetin'} bold>
        {skor}
      </AppText>
    </View>
  );
}

function SonucGorunum({
  benSkor,
  golge,
  sunucu,
  kaydediliyor,
  onTekrar,
  onSiralama,
  onCik,
}: {
  benSkor: number;
  golge: GolgeRakip;
  sunucu: ErMeydaniSonuc | null;
  kaydediliyor: boolean;
  onTekrar: () => void;
  onSiralama: () => void;
  onCik: () => void;
}) {
  const kazandim = benSkor > golge.toplam;
  const berabere = benSkor === golge.toplam;

  async function paylas() {
    try {
      await Share.share({
        message: `Er Meydanı'nda ${benSkor} puan yaptım! ${kazandim ? 'Rakibimi yendim 💪' : 'Sen de dene 👉'} Mevzu — JSPS Hazırlık uygulamasında beni geçebilir misin?`,
      });
    } catch {
      /* kullanıcı iptal etti */
    }
  }

  return (
    <Screen title="Er Meydanı" onGeri={onCik}>
      <View style={styles.sonucUst}>
        <MaterialCommunityIcons
          name={berabere ? 'shield-half-full' : kazandim ? 'trophy' : 'shield-outline'}
          size={64}
          color={kazandim ? Palette.altin : berabere ? Palette.solukMetin : Palette.lacivert2}
        />
        <AppText variant="dev" color={kazandim ? 'altinMetin' : 'anaMetin'} bold style={styles.ortala}>
          {berabere ? 'Berabere!' : kazandim ? 'Kazandın!' : 'Kaybettin'}
        </AppText>
      </View>

      <View style={styles.sonucSkorlar}>
        <View style={styles.sonucSkorKutu}>
          <AppText variant="etiket" color="solukMetin" bold>SEN</AppText>
          <AppText variant="dev" color="altinMetin" bold>{benSkor}</AppText>
        </View>
        <AppText variant="baslik" color="solukMetin">–</AppText>
        <View style={styles.sonucSkorKutu}>
          <AppText variant="etiket" color="solukMetin" bold numberOfLines={1}>{golge.rumuz.toUpperCase()}</AppText>
          <AppText variant="dev" color="anaMetin" bold>{golge.toplam}</AppText>
        </View>
      </View>

      {kaydediliyor ? (
        <AppText variant="kucuk" color="solukMetin" style={styles.ortala}>Puan kaydediliyor…</AppText>
      ) : sunucu ? (
        <View style={styles.puanBilgi}>
          <MaterialCommunityIcons name="star-four-points" size={18} color={Palette.altinKoyu} />
          <AppText variant="kucuk" color="anaMetin">
            {sunucu.verilen > 0
              ? `Bu haftaki puanına +${sunucu.verilen} eklendi (toplam ${sunucu.haftalik_toplam}).`
              : 'Bugünkü sınıra ulaştın; bu maç sıralamaya sayılmadı ama pratik oldu.'}
          </AppText>
        </View>
      ) : null}

      <Pressable style={({ pressed }) => [styles.anaBtn, pressed && styles.basili]} onPress={onTekrar}>
        <MaterialCommunityIcons name="sword-cross" size={22} color={Palette.beyaz} />
        <AppText variant="govde" color="beyaz" bold>Yeni Rakip</AppText>
      </Pressable>
      <Pressable style={({ pressed }) => [styles.ikincilBtn, pressed && styles.basili]} onPress={paylas}>
        <MaterialCommunityIcons name="share-variant" size={20} color={Palette.lacivert} />
        <AppText variant="govde" color="lacivert" bold>Sonucu Paylaş</AppText>
      </Pressable>
      <Pressable style={({ pressed }) => [styles.ikincilBtn, pressed && styles.basili]} onPress={onSiralama}>
        <MaterialCommunityIcons name="podium-gold" size={20} color={Palette.lacivert} />
        <AppText variant="govde" color="lacivert" bold>Sıralamayı Gör</AppText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  ortala: { textAlign: 'center' },
  skorBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  skorKutu: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Palette.kartKremi,
    borderWidth: 1,
    borderColor: Palette.kenarlik,
    borderRadius: Radius.m,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.one,
    gap: 2,
  },
  ortaBilgi: { alignItems: 'center', gap: Spacing.one, minWidth: 64 },
  sureRozet: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Palette.altinSolukYuzey, borderRadius: Radius.s,
    paddingHorizontal: Spacing.two, paddingVertical: 2,
  },
  sureRozetAcil: { backgroundColor: Palette.kirmizi },
  sureTrack: { height: 6, backgroundColor: Palette.ilerlemeTrack, borderRadius: 3, overflow: 'hidden' },
  sureDolu: { height: '100%', backgroundColor: Palette.altin },
  sureDoluAcil: { backgroundColor: Palette.kirmizi },
  soruKart: {
    backgroundColor: Palette.kartKremi, borderWidth: 1, borderColor: Palette.kenarlik,
    borderRadius: Radius.l, padding: Spacing.three,
  },
  soruMetin: { lineHeight: 26 },
  siklar: { gap: Spacing.two, marginTop: Spacing.one },
  sik: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    backgroundColor: Palette.kartKremi, borderWidth: 1, borderColor: Palette.kenarlik,
    borderRadius: Radius.m, padding: Spacing.three,
  },
  sikBasili: { opacity: 0.7 },
  sikDogru: { borderColor: Palette.yesil, backgroundColor: '#F0F7F0' },
  sikYanlis: { borderColor: Palette.kirmizi, backgroundColor: '#FBF0F0' },
  sikHarf: {
    width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Palette.altinSolukYuzey,
  },
  sikHarfVurgu: { backgroundColor: Palette.lacivert },
  sikMetin: { flex: 1, lineHeight: 21 },
  sonucUst: { alignItems: 'center', gap: Spacing.two, marginTop: Spacing.three },
  sonucSkorlar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.four },
  sonucSkorKutu: { alignItems: 'center', gap: 2, minWidth: 96 },
  puanBilgi: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    backgroundColor: Palette.altinSolukYuzey, borderRadius: Radius.m, padding: Spacing.three,
  },
  anaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two,
    backgroundColor: Palette.lacivert, borderRadius: Radius.m, paddingVertical: Spacing.three, marginTop: Spacing.two,
  },
  ikincilBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two,
    backgroundColor: Palette.kartKremi, borderWidth: 1, borderColor: Palette.kenarlik,
    borderRadius: Radius.m, paddingVertical: Spacing.three,
  },
  basili: { opacity: 0.8 },
});
