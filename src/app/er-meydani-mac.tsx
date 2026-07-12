import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Share, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import {
  type DuelloSoru,
  type GolgeRakip,
  type MacAdim,
  SORU_SAYISI,
  SORU_SURE_MS,
  getErMeydaniSorulari,
  golgeRakipUret,
  normalizePuan,
  puanSoru,
  seedUret,
  toplamPuan,
} from '@/lib/er-meydani-mantik';
import { type ErMeydaniSonuc, type LigSonuc, ligEslesme, ligSonuc, sonucKaydet } from '@/lib/er-meydani';

type Faz = 'oyun' | 'geribildirim' | 'bitti' | 'inceleme';

/** ER MEYDANI — MAÇ. 10 soru, süreli, gölge rakibe karşı hız yarışı. Sonuç aynı ekranda. */
export default function ErMeydaniMacScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    seed?: string;
    mod?: string;
    soru?: string;
    sure?: string;
    rakip_skor?: string;
    rakip_rating?: string;
    rakip_id?: string;
    rakip_rumuz?: string;
  }>();

  // Tohum: verilmezse üret (doğrudan açılırsa). useMemo → tek sefer sabit.
  const seed = useMemo(() => {
    const p = Number(params.seed);
    return Number.isFinite(p) && p > 0 ? p : seedUret();
  }, [params.seed]);
  const ligMod = params.mod === 'lig';
  const mod = (params.mod === 'arkadas' ? 'arkadas' : 'hizli') as 'hizli' | 'arkadas';
  // Dereceli maçta rakip = eşleşmeden gelen gölge (yenilecek hedef skor).
  const ligRakip = useMemo(
    () => ({
      skor: Number(params.rakip_skor) || 0,
      rating: Number(params.rakip_rating) || 1000,
      id: params.rakip_id && params.rakip_id.length > 0 ? params.rakip_id : null,
      rumuz: params.rakip_rumuz || 'Rakip',
    }),
    [params.rakip_skor, params.rakip_rating, params.rakip_id, params.rakip_rumuz],
  );
  // Oda ayarları (yoksa varsayılan 10 soru / 15 sn).
  const adet = useMemo(() => {
    const n = Number(params.soru);
    return [5, 10, 15, 20].includes(n) ? n : SORU_SAYISI;
  }, [params.soru]);
  const sureMs = useMemo(() => {
    const n = Number(params.sure);
    return [10, 15, 20, 30].includes(n) ? n * 1000 : SORU_SURE_MS;
  }, [params.sure]);

  const sorular = useMemo(() => getErMeydaniSorulari(seed, adet), [seed, adet]);
  const golge = useMemo<GolgeRakip>(() => golgeRakipUret(seed, adet, sureMs), [seed, adet, sureMs]);

  const [index, setIndex] = useState(0);
  const [faz, setFaz] = useState<Faz>('oyun');
  const [secili, setSecili] = useState<number | null>(null);
  const [kalanMs, setKalanMs] = useState(sureMs);
  const [benAdimlar, setBenAdimlar] = useState<MacAdim[]>([]);
  const [sunucu, setSunucu] = useState<ErMeydaniSonuc | null>(null);
  const [ligSonucState, setLigSonucState] = useState<LigSonuc | null>(null);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const baslangicRef = useRef<number>(Date.now());
  const cevaplandiRef = useRef(false); // bu soru cevaplandı mı (süre+tıklama çift tetik guard)
  const kaydettiRef = useRef(false); // sonuç bir kez yazıldı mı (offline'da bile döngü olmasın)

  const benSkor = toplamPuan(benAdimlar);
  const golgeSkorSuana = golge.adimlar.slice(0, benAdimlar.length).reduce((t, a) => t + a.puan, 0);

  // Bir soruyu bitir: adımı kaydet, geri bildirim fazına geç. Ref guard → çift sayım yok
  // (süre dolması + tıklama aynı anda gelse bile; StrictMode'da da güvenli).
  const soruyuBitir = useCallback(
    (secilenIndex: number | null) => {
      if (cevaplandiRef.current) return;
      cevaplandiRef.current = true;
      const gecenMs = Math.min(sureMs, Date.now() - baslangicRef.current);
      const soru = sorular[index];
      const dogru = secilenIndex !== null && soru != null && secilenIndex === soru.dogru;
      setSecili(secilenIndex);
      setBenAdimlar((a) => [...a, { dogru, gecenMs, puan: puanSoru(dogru, gecenMs, sureMs), secilen: secilenIndex }]);
      setFaz('geribildirim');
    },
    [index, sorular, sureMs],
  );

  // Sayaç: yalnız 'oyun' fazında işler; 0'a inince süre doldu → yanlış say.
  useEffect(() => {
    if (faz !== 'oyun') return;
    cevaplandiRef.current = false;
    baslangicRef.current = Date.now();
    setKalanMs(sureMs);
    const t = setInterval(() => {
      const kalan = sureMs - (Date.now() - baslangicRef.current);
      if (kalan <= 0) {
        setKalanMs(0);
        soruyuBitir(null);
      } else {
        setKalanMs(kalan);
      }
    }, 100);
    return () => clearInterval(t);
  }, [faz, index, soruyuBitir, sureMs]);

  // Geri bildirim gösterildikten sonra ilerle (sonraki soru veya bitiş).
  useEffect(() => {
    if (faz !== 'geribildirim') return;
    const t = setTimeout(() => {
      if (index + 1 >= adet || index + 1 >= sorular.length) {
        setFaz('bitti');
      } else {
        setIndex((i) => i + 1);
        setSecili(null);
        setFaz('oyun');
      }
    }, 1300);
    return () => clearTimeout(t);
  }, [faz, index, adet, sorular.length]);

  // Maç bitince sonucu yaz — REF guard ile TAM BİR KEZ. Dereceli → ELO (ligSonuc); değilse haftalık.
  useEffect(() => {
    if (faz !== 'bitti' || kaydettiRef.current) return;
    kaydettiRef.current = true;
    let iptal = false;
    setKaydediliyor(true);
    const benim = toplamPuan(benAdimlar);
    const yaz = ligMod
      ? ligSonuc({
          seed,
          benimSkor: benim,
          rakipSkor: ligRakip.skor,
          rakipRating: ligRakip.rating,
          rakipId: ligRakip.id,
        }).then((s) => {
          if (!iptal) setLigSonucState(s);
        })
      : sonucKaydet({
          mod,
          seed,
          benimPuan: normalizePuan(benim, adet), // sıralama adaleti: 0-2000 ölçek
          rakipPuan: normalizePuan(golge.toplam, adet),
          golge: true,
          rakipId: null,
          rakipRumuz: golge.rumuz,
        }).then((s) => {
          if (!iptal) setSunucu(s);
        });
    void yaz.finally(() => {
      if (!iptal) setKaydediliyor(false);
    });
    return () => {
      iptal = true;
    };
  }, [faz, benAdimlar, golge, mod, seed, adet, ligMod, ligRakip]);

  // Yeni tohum/ayar (Yeni Rakip / Kodla Katıl aynı ekrana replace edince) → maçı baştan başlat.
  useEffect(() => {
    setIndex(0);
    setFaz('oyun');
    setSecili(null);
    setKalanMs(sureMs);
    setBenAdimlar([]);
    setSunucu(null);
    setLigSonucState(null);
    kaydettiRef.current = false;
    cevaplandiRef.current = false;
  }, [seed, adet, sureMs]);

  // Dereceli: yeni rakip bul → aynı ekrana lig paramlarıyla replace.
  const yeniLigMac = useCallback(async () => {
    const e = await ligEslesme();
    if (e) {
      router.replace({
        pathname: '/er-meydani-mac',
        params: {
          seed: String(e.seed),
          mod: 'lig',
          soru: '10',
          sure: '15',
          rakip_skor: String(e.rakip_skor),
          rakip_rating: String(e.rakip_rating),
          rakip_id: e.rakip_id ?? '',
          rakip_rumuz: e.rakip_rumuz,
        },
      });
    } else {
      router.replace('/er-meydani');
    }
  }, [router]);

  if (sorular.length === 0) {
    return (
      <Screen title="Er Meydanı" onGeri={() => router.back()}>
        <AppText variant="govde" color="solukMetin" style={styles.ortala}>
          Soru havuzu yüklenemedi. Lütfen tekrar dene.
        </AppText>
      </Screen>
    );
  }

  if (faz === 'inceleme') {
    return <InceleGorunum sorular={sorular} adimlar={benAdimlar} onGeri={() => setFaz('bitti')} />;
  }

  if (faz === 'bitti') {
    return (
      <SonucGorunum
        ligMod={ligMod}
        benSkor={benSkor}
        rakipSkor={ligMod ? ligRakip.skor : golge.toplam}
        rakipRumuz={ligMod ? ligRakip.rumuz : golge.rumuz}
        sunucu={sunucu}
        ligSonuc={ligSonucState}
        kaydediliyor={kaydediliyor}
        onIncele={() => setFaz('inceleme')}
        onTekrar={() => router.replace({ pathname: '/er-meydani-mac', params: { seed: String(seedUret()), mod: 'hizli' } })}
        onYeniLig={() => void yeniLigMac()}
        onSiralama={() => router.replace(ligMod ? '/er-meydani-lig' : '/er-meydani-siralama')}
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
            SORU {index + 1}/{adet}
          </AppText>
          <View style={[styles.sureRozet, saniye <= 5 && styles.sureRozetAcil]}>
            <MaterialCommunityIcons name="timer-outline" size={16} color={saniye <= 5 ? Palette.beyaz : Palette.lacivert} />
            <AppText variant="kucuk" color={saniye <= 5 ? 'beyaz' : 'lacivert'} bold>
              {saniye}
            </AppText>
          </View>
        </View>
        {ligMod ? (
          <SkorKutu ad={ligRakip.rumuz} skor={ligRakip.skor} altEtiket="hedef" />
        ) : (
          <SkorKutu ad={golge.rumuz} skor={golgeSkorSuana} />
        )}
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

function SkorKutu({
  ad,
  skor,
  vurgu,
  altEtiket,
}: {
  ad: string;
  skor: number;
  vurgu?: boolean;
  altEtiket?: string;
}) {
  return (
    <View style={styles.skorKutu}>
      <AppText variant="etiket" color={vurgu ? 'lacivert' : 'solukMetin'} bold numberOfLines={1}>
        {ad}
      </AppText>
      <AppText variant="altBaslik" color={vurgu ? 'altinMetin' : 'anaMetin'} bold>
        {skor}
      </AppText>
      {altEtiket ? (
        <AppText variant="etiket" color="solukMetin">
          {altEtiket}
        </AppText>
      ) : null}
    </View>
  );
}

function SonucGorunum({
  ligMod,
  benSkor,
  rakipSkor,
  rakipRumuz,
  sunucu,
  ligSonuc: ligS,
  kaydediliyor,
  onIncele,
  onTekrar,
  onYeniLig,
  onSiralama,
  onCik,
}: {
  ligMod: boolean;
  benSkor: number;
  rakipSkor: number;
  rakipRumuz: string;
  sunucu: ErMeydaniSonuc | null;
  ligSonuc: LigSonuc | null;
  kaydediliyor: boolean;
  onIncele: () => void;
  onTekrar: () => void;
  onYeniLig: () => void;
  onSiralama: () => void;
  onCik: () => void;
}) {
  const kazandim = benSkor > rakipSkor;
  const berabere = benSkor === rakipSkor;

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
    <Screen title={ligMod ? 'Dereceli Maç' : 'Er Meydanı'} onGeri={onCik}>
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
          <AppText variant="etiket" color="solukMetin" bold numberOfLines={1}>{rakipRumuz.toUpperCase()}</AppText>
          <AppText variant="dev" color="anaMetin" bold>{rakipSkor}</AppText>
        </View>
      </View>

      {kaydediliyor ? (
        <AppText variant="kucuk" color="solukMetin" style={styles.ortala}>
          {ligMod ? 'Derece hesaplanıyor…' : 'Puan kaydediliyor…'}
        </AppText>
      ) : ligMod && ligS ? (
        <View style={styles.ligSonucKutu}>
          <View style={styles.ligDeltaSatir}>
            <MaterialCommunityIcons
              name={ligS.delta >= 0 ? 'trending-up' : 'trending-down'}
              size={24}
              color={ligS.delta >= 0 ? Palette.yesil : Palette.kirmizi}
            />
            <AppText variant="baslik" color={ligS.delta >= 0 ? 'yesil' : 'kirmizi'} bold>
              {ligS.delta >= 0 ? '+' : ''}{ligS.delta}
            </AppText>
          </View>
          <AppText variant="kucuk" color="anaMetin" bold>
            Yeni derecen: {ligS.rating} · {ligS.kademe}
          </AppText>
        </View>
      ) : !ligMod && sunucu ? (
        <View style={styles.puanBilgi}>
          <MaterialCommunityIcons name="star-four-points" size={18} color={Palette.altinKoyu} />
          <AppText variant="kucuk" color="anaMetin">
            {sunucu.verilen > 0
              ? `Bu haftaki puanına +${sunucu.verilen} eklendi (toplam ${sunucu.haftalik_toplam}).`
              : 'Bugünkü sınıra ulaştın; bu maç sıralamaya sayılmadı ama pratik oldu.'}
          </AppText>
        </View>
      ) : null}

      <Pressable
        style={({ pressed }) => [styles.anaBtn, pressed && styles.basili]}
        onPress={ligMod ? onYeniLig : onTekrar}>
        <MaterialCommunityIcons name="sword-cross" size={22} color={Palette.beyaz} />
        <AppText variant="govde" color="beyaz" bold>{ligMod ? 'Yeni Dereceli Maç' : 'Yeni Rakip'}</AppText>
      </Pressable>
      <Pressable style={({ pressed }) => [styles.ikincilBtn, pressed && styles.basili]} onPress={onIncele}>
        <MaterialCommunityIcons name="book-open-page-variant" size={20} color={Palette.lacivert} />
        <View style={styles.inceleBtnMetin}>
          <AppText variant="govde" color="lacivert" bold>Soruları İncele</AppText>
          <AppText variant="etiket" color="solukMetin">Doğru cevaplar + açıklamalarıyla öğren</AppText>
        </View>
      </Pressable>
      {!ligMod ? (
        <Pressable style={({ pressed }) => [styles.ikincilBtn, pressed && styles.basili]} onPress={paylas}>
          <MaterialCommunityIcons name="share-variant" size={20} color={Palette.lacivert} />
          <AppText variant="govde" color="lacivert" bold>Sonucu Paylaş</AppText>
        </Pressable>
      ) : null}
      <Pressable style={({ pressed }) => [styles.ikincilBtn, pressed && styles.basili]} onPress={onSiralama}>
        <MaterialCommunityIcons name="podium-gold" size={20} color={Palette.lacivert} />
        <AppText variant="govde" color="lacivert" bold>{ligMod ? 'Lig Tablosu' : 'Sıralamayı Gör'}</AppText>
      </Pressable>
    </Screen>
  );
}

/** MAÇ SONU İNCELEME — 10 sorunun tekrarı: doğru cevap + açıklama; yanlışların vurgulu. */
function InceleGorunum({
  sorular,
  adimlar,
  onGeri,
}: {
  sorular: DuelloSoru[];
  adimlar: MacAdim[];
  onGeri: () => void;
}) {
  return (
    <Screen title="Soruları İncele" onGeri={onGeri} headerAltinCizgi>
      {adimlar.map((a, i) => {
        const soru = sorular[i];
        if (!soru) return null;
        return (
          <View key={i} style={styles.inceleKart}>
            <View style={styles.inceleUst}>
              <View style={[styles.inceleRozet, a.dogru ? styles.inceleDogruRozet : styles.inceleYanlisRozet]}>
                <MaterialCommunityIcons name={a.dogru ? 'check' : 'close'} size={14} color={Palette.beyaz} />
                <AppText variant="etiket" color="beyaz" bold>{a.dogru ? 'Doğru' : a.secilen == null ? 'Boş' : 'Yanlış'}</AppText>
              </View>
              <AppText variant="etiket" color="solukMetin" numberOfLines={1} style={styles.inceleKaynak}>
                {i + 1}/{adimlar.length}{soru.kaynak ? ` · ${soru.kaynak}` : ''}
              </AppText>
            </View>

            <AppText variant="kucuk" bold color="anaMetin" style={styles.inceleSoru}>{soru.soru}</AppText>

            {soru.siklar.map((s, j) => {
              const dogruSik = j === soru.dogru;
              const benimYanlis = j === a.secilen && j !== soru.dogru;
              return (
                <View key={j} style={[styles.inceleSik, dogruSik && styles.sikDogru, benimYanlis && styles.sikYanlis]}>
                  <AppText variant="kucuk" color={dogruSik ? 'yesil' : benimYanlis ? 'kirmizi' : 'solukMetin'} bold>
                    {String.fromCharCode(65 + j)}
                  </AppText>
                  <AppText
                    variant="kucuk"
                    color={dogruSik ? 'yesil' : benimYanlis ? 'kirmizi' : 'anaMetin'}
                    style={styles.inceleSikMetin}>
                    {s}
                  </AppText>
                </View>
              );
            })}

            {soru.aciklama ? (
              <View style={styles.aciklamaKutu}>
                <AppText variant="etiket" color="altinKoyu" bold>AÇIKLAMA</AppText>
                <AppText variant="kucuk" color="anaMetin" style={styles.aciklamaMetin}>{soru.aciklama}</AppText>
                {soru.celdirici ? (
                  <AppText variant="etiket" color="solukMetin" style={styles.celdiriciMetin}>
                    Neden diğerleri yanlış: {soru.celdirici}
                  </AppText>
                ) : null}
              </View>
            ) : null}
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  ortala: { textAlign: 'center' },
  inceleBtnMetin: { flex: 1, gap: 2 },
  inceleKart: {
    backgroundColor: Palette.kartKremi, borderWidth: 1, borderColor: Palette.kenarlik,
    borderRadius: Radius.l, padding: Spacing.three, gap: Spacing.two,
  },
  inceleUst: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  inceleRozet: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderRadius: Radius.s, paddingHorizontal: Spacing.two, paddingVertical: 2,
  },
  inceleDogruRozet: { backgroundColor: Palette.yesil },
  inceleYanlisRozet: { backgroundColor: Palette.kirmizi },
  inceleKaynak: { flex: 1, textAlign: 'right' },
  inceleSoru: { lineHeight: 21 },
  inceleSik: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two,
    borderWidth: 1, borderColor: Palette.kenarlik, borderRadius: Radius.m,
    paddingHorizontal: Spacing.two, paddingVertical: Spacing.two,
  },
  inceleSikMetin: { flex: 1, lineHeight: 20 },
  aciklamaKutu: {
    backgroundColor: Palette.altinSolukYuzey, borderRadius: Radius.m, padding: Spacing.three, gap: 3,
  },
  aciklamaMetin: { lineHeight: 21 },
  celdiriciMetin: { lineHeight: 18, marginTop: Spacing.one, fontStyle: 'italic' },
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
  ligSonucKutu: {
    alignItems: 'center', gap: Spacing.one,
    backgroundColor: Palette.altinSolukYuzey, borderRadius: Radius.m, padding: Spacing.three,
  },
  ligDeltaSatir: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
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
