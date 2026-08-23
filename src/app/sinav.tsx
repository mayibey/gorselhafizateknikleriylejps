import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { TakdirBelgeAlani } from '@/components/sicil/takdir-belge-alani';
import { EmptyState } from '@/components/ui/empty-state';
import { CardFlowMaxWidth, Palette, Radius, Spacing } from '@/constants/theme';
import { ekleSinavSonucu, getAllCards, getCardsByLaw, getSinavSonuclari, kaydetPerformans } from '@/db/database';
import type { CardWithLaw } from '@/db/schema';
import { degerlendirSicil } from '@/lib/sicil-servis';
import { genelDenemeErisilebilir } from '@/constants/urunler';
import { lawErisilebilirSaf } from '@/lib/icerik-kilidi';
import { useUyelik } from '@/lib/uyelik-context';
import {
  eslesenKartIdleri,
  getGenelDenemeSorulari,
  getTestSorulari,
  type KartSoru,
  puanlaSinav,
  type SinavCevap,
  genelDenemeSayisi,
  puanKatsayisi,
  testSayisi,
  testSoruSayisi,
} from '@/lib/sinav';
import {
  sinavIlerlemeKaydet,
  sinavIlerlemeOku,
  sinavIlerlemeSil,
} from '@/lib/sinav-ilerleme';
import { bugunISO } from '@/lib/srs';
import { IpucuOverlay } from '@/components/tanitim/ipucu-overlay';
import { ipucuGoruldu, ipucuIsaretle } from '@/lib/ipuclari';
import { useMesgul } from '@/lib/mesgul';

/** Doğru/yanlış geri bildirim renkleri (tema: yeşil onay, kırmızı uyarı). */
const DOGRU_YESIL = Palette.yesil;
const YANLIS_KIRMIZI = Palette.kirmizi;

/**
 * Tatbikat deneme sınavı — küratörlü gerçek SORULAR.json sorularını gösterir.
 * Akış: soru + şıklar → seç → doğru/yanlış + açıklama → ilerle → sonda skor.
 * - YANLIŞ cevap → sorunun kaynak maddesine eşleşen kartlar ZAYIF HAVUZA düşer
 *   (kaydetPerformans 'quiz'/'yanlis'; Karargah→Etüt'te 2 ardışık doğruyla çıkar).
 *   DOĞRU cevap loglanmaz (havuzdan çıkış yalnız Etüt'le). SRS kutusuna dokunulmaz.
 * - Sınav bitince skor `sinav_sonuclari`'na kalıcı yazılır (Tatbikat'ta gösterilir).
 */
export default function SinavScreen() {
  const router = useRouter();
  const { lawId, test, genel, gblok } = useLocalSearchParams<{
    lawId?: string;
    test?: string;
    genel?: string;
    gblok?: string;
  }>();
  // GENEL DENEME (Tatbikat): genel=1/2/3 (müşterek) · gblok=brans 1..5 (branş) · gblok=karma 1..5 (karma, 100 soru).
  // Sanal law_id: müşterek -genelNo (-1..-3), branş -(100+genelNo) (-101..-105) → sonuç/skor
  // AYRIŞIR (getSinavSonuclari law_id<0 ile genel deneme sayar; iki blok çakışmaz).
  const genelBlok = gblok === 'brans' || gblok === 'karma' ? (gblok as 'brans' | 'karma') : undefined;
  const genelBrans = genelBlok === 'brans';
  // Karma denemenin sanal law_id'si -(200+no) (-201..-205) → müşterek/branş sonuçlarına karışmaz.
  const genelKarma = genelBlok === 'karma';
  const katsayi = puanKatsayisi(genelBlok); // karma 100 soru -> soru basi 1 puan
  const genelNo = genel != null && genel !== '' ? Number(genel) : null;
  const genelModu = genelNo != null && !Number.isNaN(genelNo);
  const lawIdNum = genelModu
    ? -(genelKarma ? 200 + genelNo! : genelBrans ? 100 + genelNo! : genelNo!)
    : lawId != null && lawId !== ''
      ? Number(lawId)
      : null;
  const testNum = test != null && test !== '' ? Number(test) : 0; // kanunun kaçıncı testi (0 tabanlı)
  // PREMIUM KAPISI: genel deneme → premium şart; kanun sınavı → o kanun erişilebilir olmalı. Erişim
  // yoksa (yükleme bitince) soru+cevap GÖSTERİLMEDEN paywall'a. (Sınav soruları gömülü, tek kapı bu.)
  const { premium, yukleniyor: uyelikYukleniyor } = useUyelik();
  const kilitli =
    !uyelikYukleniyor &&
    (genelModu
      ? !genelDenemeErisilebilir() // Tatbikat sınavları HERKESE ücretsiz (başkan kararı)
      : lawId != null && lawId !== '' && !lawErisilebilirSaf(Number(lawId), premium));
  useEffect(() => {
    if (kilitli) router.replace('/paywall');
  }, [kilitli, router]);
  const [sorular, setSorular] = useState<KartSoru[] | null>(null);
  const [lawAd, setLawAd] = useState<string | null>(null);
  const [hata, setHata] = useState(false);
  const [bos, setBos] = useState(false);
  const [index, setIndex] = useState(0);
  // Kanunun TÜM testleri %100 mü → sonuç ekranında Takdir Belgesi görseli SADECE o zaman çıkar
  // (tek testi %100 yapmak belgeyi hak ettirmez; sicile de öyle yazılıyor — gösterim eşiği ile hizalı).
  const [belgeHak, setBelgeHak] = useState(false);
  // İlk kez sınav açılınca bir kez çıkan bağlamsal ipucu.
  const [sinavIpucu, setSinavIpucu] = useState(false);
  // Soru başına seçilen şık (null = cevaplanmadı). Tek kaynak → önceki soruya dönüş + devam
  // (kaldığın yerden) BUNDAN türer. sorular ile aynı uzunlukta.
  const [secimler, setSecimler] = useState<(number | null)[]>([]);
  // O kanunun kartları (zayıf havuz eşleştirmesi için) — bir kez yüklenir, cache'lenir.
  const kartlarRef = useRef<CardWithLaw[] | null>(null);
  // Skor BİR KEZ kaydedilsin (bitiş ekranı yeniden render'larında tekrar yazılmasın).
  const kaydedildiRef = useRef(false);

  // Kartları (zayıf havuz eşleştirmesi + Takdir Belgesi adı) önden yükle.
  // Genel deneme = çok-kanun → TÜM kartlar; kanun sınavı → o kanunun kartları.
  const kartlariYukle = useCallback(() => {
    const p = genelModu ? getAllCards() : lawIdNum != null ? getCardsByLaw(lawIdNum) : null;
    if (!p) return;
    void p
      .then((c) => {
        kartlarRef.current = c;
        if (!genelModu && c[0]?.law_ad) setLawAd(c[0].law_ad);
      })
      .catch(() => {});
  }, [lawIdNum, genelModu]);

  // Açılış: yarım kalan sınav varsa KALDIĞIN YERDEN devam et; yoksa yeni (karıştırılmış) sınav.
  const yukle = useCallback(() => {
    setHata(false);
    setBos(false);
    setSorular(null);
    setIndex(0);
    setSecimler([]);
    setLawAd(null);
    kartlarRef.current = null;
    kaydedildiRef.current = false;
    if (lawIdNum == null || Number.isNaN(lawIdNum)) {
      setHata(true);
      return;
    }
    void (async () => {
      const kayit = await sinavIlerlemeOku(lawIdNum, testNum).catch(() => null);
      if (kayit && kayit.sorular.length > 0) {
        // Devam: saklanan soru sırası + işaretler + konum.
        setSorular(kayit.sorular);
        setSecimler(kayit.secimler);
        setIndex(Math.min(kayit.index, kayit.sorular.length));
      } else {
        const liste = genelModu ? getGenelDenemeSorulari(genelNo!, genelBlok) : getTestSorulari(lawIdNum, testNum);
        if (liste.length === 0) {
          setBos(true);
          return;
        }
        setSorular(liste);
        setSecimler(new Array(liste.length).fill(null));
        setIndex(0);
      }
      kartlariYukle();
    })();
  }, [lawIdNum, testNum, kartlariYukle, genelModu, genelNo, genelBlok]);

  /**
   * SIRADAKİ SINAV (başkan, 23 Ağu: "deneme bitince sıradaki denemeye geç gelmiyor").
   * Kanun sınavında bir sonraki test, genel denemede bir sonraki deneme. Yoksa null.
   * router.replace ile aynı ekrana yeni parametrelerle gidilir; `yukle` bağımlılıkları
   * (testNum/genelNo) değiştiği için sınav baştan kurulur — ayrı sıfırlama gerekmez.
   */
  const sonraki = (() => {
    if (genelModu) {
      const toplam = genelDenemeSayisi(genelBlok);
      if (genelNo == null || genelNo + 1 > toplam) return null;
      return {
        etiket: 'Sıradaki deneme',
        params: genelBlok
          ? { genel: String(genelNo + 1), gblok: genelBlok }
          : { genel: String(genelNo + 1) },
      };
    }
    if (lawIdNum == null || testNum + 1 >= testSayisi(lawIdNum)) return null;
    return {
      etiket: `Sıradaki test (${testNum + 2}/${testSayisi(lawIdNum)})`,
      params: { lawId: String(lawIdNum), test: String(testNum + 1) },
    };
  })();

  // "Tekrar çöz" → kaydı sil + YENİ karıştırılmış sınav (baştan).
  const yenidenBasla = useCallback(() => {
    if (lawIdNum == null) return;
    void sinavIlerlemeSil(lawIdNum, testNum);
    const liste = genelModu ? getGenelDenemeSorulari(genelNo!, genelBlok) : getTestSorulari(lawIdNum, testNum);
    setSorular(liste);
    setSecimler(new Array(liste.length).fill(null));
    setIndex(0);
    kaydedildiRef.current = false;
  }, [lawIdNum, testNum, genelModu, genelNo, genelBlok]);

  useEffect(() => {
    yukle();
  }, [yukle]);

  /** YANLIŞ cevap → eşleşen kartları zayıf havuza sok (UI'yı bloklamaz). */
  async function zayifaDusur(soru: KartSoru) {
    try {
      let kartlar = kartlarRef.current;
      if (!kartlar) {
        kartlar = genelModu ? await getAllCards() : lawIdNum != null ? await getCardsByLaw(lawIdNum) : null;
        kartlarRef.current = kartlar;
      }
      if (!kartlar) return;
      const ids = eslesenKartIdleri(soru.kaynak, kartlar);
      // Genel deneme (Tatbikat) yanlışı 'genel', Talim (kanun sınavı) yanlışı 'quiz' kaynağıyla
      // düşer → zayıf mevzide "Tatbikat/Talim" etiketi buradan ayrışır (tek havuz, ayrı etiket).
      const kaynakTip = genelModu ? 'genel' : 'quiz';
      for (const id of ids) {
        await kaydetPerformans(id, kaynakTip, 'yanlis').catch(() => {});
      }
    } catch {
      // sessiz geç: zayıf havuz logu kritik değil, sınav akışını bozmamalı.
    }
  }

  /** Sonuç ekranındaki yanlış soru → ilgili kartın akışına git (o kanunun kartında). */
  function kartaGit(soru: KartSoru) {
    const kartlar = kartlarRef.current;
    if (!kartlar) return;
    const ids = eslesenKartIdleri(soru.kaynak, kartlar);
    const kart = ids.length > 0 ? kartlar.find((k) => k.id === ids[0]) : undefined;
    if (!kart) return;
    router.push({ pathname: '/akis', params: { lawId: String(kart.law_id), kart: String(kart.id) } });
  }

  // Bu sorunun seçili şıkkı (yoksa null). Önceki soruya dönünce o sorunun cevabı BURADAN gelir.
  const secilen = sorular && index < secimler.length ? secimler[index] : null;

  function sec(i: number) {
    if (!sorular || secilen !== null) return; // soru zaten cevaplandı → değiştirilemez (kilitli)
    setSecimler((s) => {
      const y = [...s];
      y[index] = i;
      return y;
    });
    const soruO = sorular[index];
    if (i !== soruO.dogru) void zayifaDusur(soruO); // yalnız yanlışta (ilk cevapta) logla
  }

  function ileri() {
    if (secilen === null) return; // cevaplanmadan ilerleme yok
    setIndex((i) => i + 1);
  }

  function geri() {
    setIndex((i) => Math.max(0, i - 1)); // önceki soru (cevaplı → salt görüntüleme)
  }

  const bitti = sorular !== null && index >= sorular.length;
  const aktif = sorular !== null && !bitti;
  const soru = aktif ? sorular[index] : null;
  // Sınav sürerken uygulama kendini YENİLEMESİN — cevaplar uçmasın.
  useMesgul(aktif, 'sinav');

  // Puanlama/sonuç için cevap listesi — secimler'den türetilir (cevaplanmayan -1 = yanlış sayılır).
  const cevaplar = useMemo<SinavCevap[]>(
    () => secimler.map((s, i) => ({ soruIndex: i, secilenIndex: s ?? -1 })),
    [secimler],
  );

  // İlk kez sınav açılınca bağlamsal ipucu göster (bir kez; sonra AsyncStorage'da işaretli).
  useEffect(() => {
    void ipucuGoruldu('sinav').then((g) => {
      if (!g) setSinavIpucu(true);
    });
  }, []);

  // Sınav bitince skoru BİR KEZ kalıcı kaydet (kaydedildiRef guard; yukle'de sıfırlanır).
  // %100 ise: kayıttan SONRA sicil değerlendir → Takdir Belgesi kaydı düşer (idempotent).
  useEffect(() => {
    if (!bitti || !sorular || lawIdNum == null || kaydedildiRef.current) return;
    kaydedildiRef.current = true;
    void sinavIlerlemeSil(lawIdNum, testNum); // sınav bitti → "devam" kaydı temizlenir
    const { dogru, toplam } = puanlaSinav(cevaplar, sorular);
    void (async () => {
      try {
        await ekleSinavSonucu(lawIdNum, testNum, dogru, toplam, bugunISO());
        // Takdir Belgesi yalnız KANUN denemelerinde (genel deneme = -law_id → atla).
        if (!genelModu && toplam > 0 && dogru === toplam) {
          await degerlendirSicil();
          // Kanunun TÜM testleri %100 mu → tam Takdir Belgesi hakkı (sicil-servis ile aynı ölçüt).
          const hepsi = (await getSinavSonuclari()).filter((s) => s.law_id === lawIdNum);
          const aced = new Set(
            hepsi
              .filter((s) => s.toplam > 0 && s.dogru === s.toplam && s.toplam === testSoruSayisi(lawIdNum, s.test))
              .map((s) => s.test),
          );
          setBelgeHak(aced.size >= testSayisi(lawIdNum));
        }
      } catch {
        // sessiz geç (skor/ödül kaydı başarısızsa sonuç ekranı yine görünsün)
      }
    })();
  }, [bitti, sorular, cevaplar, lawIdNum, testNum]);

  // Yarım sınavı kaydet → ekrandan çıkıp dönünce KALDIĞIN YERDEN devam. En az bir soru
  // cevaplanmışsa ve sınav bitmemişse sakla (bitince yukarıdaki efekt siler).
  useEffect(() => {
    if (lawIdNum == null || sorular === null || bitti) return;
    if (!secimler.some((s) => s !== null)) return; // hiç cevap yok → saklama
    void sinavIlerlemeKaydet(lawIdNum, testNum, { sorular, secimler, index });
  }, [secimler, index, bitti, sorular, lawIdNum, testNum]);

  // Premium kilidi: erişim yoksa içerik gösterme (yukarıdaki effect paywall'a yönlendiriyor).
  if (kilitli) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      {/* Üst krom: kapat + ilerleme */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Kapat">
          <MaterialCommunityIcons name="close" size={26} color={Palette.beyaz} />
        </Pressable>
        <View style={styles.headerMeta}>
          <AppText variant="govde" color="beyaz" bold>
            {aktif ? `Soru ${index + 1} / ${sorular!.length}` : 'Deneme Sınavı'}
          </AppText>
          {lawIdNum != null && testSayisi(lawIdNum) > 1 ? (
            <AppText variant="etiket" color="altinAcik2" bold>
              TEST {testNum + 1} / {testSayisi(lawIdNum)}
            </AppText>
          ) : null}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {hata ? (
        <View style={styles.kolon}>
          <EmptyState
            ikon="alert-circle-outline"
            ikonRenk="kirmizi"
            baslik="Yüklenemedi"
            aciklama="Sınav yüklenemedi."
            buton={{ etiket: 'Geri dön', onPress: () => router.back() }}
          />
        </View>
      ) : bos ? (
        <View style={styles.kolon}>
          <EmptyState
            ikon="clipboard-text-clock-outline"
            baslik="Soru yok"
            aciklama="Bu kanun için henüz deneme sorusu eklenmedi."
            buton={{ etiket: 'Geri dön', onPress: () => router.back() }}
          />
        </View>
      ) : sorular === null ? null : bitti ? (
        <Sonuc
          cevaplar={cevaplar}
          sorular={sorular}
          lawAd={lawAd}
          lawId={lawIdNum}
          genelModu={genelModu}
          belgeHak={belgeHak}
          katsayi={katsayi}
          onZayif={() => router.replace({ pathname: '/akis', params: { mod: 'zayif' } })}
          onTekrar={yenidenBasla}
          onBitir={() => router.back()}
          sonraki={sonraki}
          onSonraki={() =>
            sonraki && router.replace({ pathname: '/sinav', params: sonraki.params })
          }
          onKartGit={(s) => kartaGit(s)}
        />
      ) : (
        <View style={styles.kolon}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${((index + 1) / sorular.length) * 100}%` }]} />
            </View>

            {/* 23 Ağu (başkan): soru sorulurken kaynak künyesi ("5070 m.4/b") GÖSTERİLMEZ —
                kullanıcıya bir şey ifade etmiyor, üstelik cevabı ele veriyor. Kaynak, sınav
                bitince yanlış özetinde (HataKart) duruyor; asıl işe yaradığı yer orası. */}

            <View style={styles.soruKart}>
              <AppText variant="altBaslik" bold>
                {soru!.soru}
              </AppText>
            </View>

            <View style={styles.secenekler}>
              {soru!.siklar.map((metin, i) => (
                <Secenek
                  key={i}
                  harf={String.fromCharCode(65 + i)}
                  metin={metin}
                  durum={secenekDurum(i, secilen, soru!.dogru)}
                  onPress={() => sec(i)}
                  disabled={secilen !== null}
                />
              ))}
            </View>

            {/* Açıklama — cevaptan sonra görünür (doğru cevabın gerekçesi). */}
            {secilen !== null && soru!.aciklama ? (
              <View
                style={[
                  styles.aciklama,
                  secilen === soru!.dogru ? styles.aciklamaDogru : styles.aciklamaYanlis,
                ]}>
                <AppText
                  variant="etiket"
                  bold
                  color={secilen === soru!.dogru ? 'yesil' : 'kirmizi'}>
                  {secilen === soru!.dogru ? 'Doğru' : 'Yanlış'}
                </AppText>
                <AppText variant="kucuk" color="anaMetin" style={styles.aciklamaMetin}>
                  {soru!.aciklama}
                </AppText>
              </View>
            ) : null}
          </ScrollView>

          {/* Alt gezinme: Önceki (cevaplarını gör) + Sonraki (cevaplandıktan sonra aktif) */}
          <View style={styles.altBlok}>
            <Pressable
              disabled={index === 0}
              style={({ pressed }) => [
                styles.onceki,
                index === 0 && styles.oncekiPasif,
                pressed && index !== 0 && styles.pressed,
              ]}
              onPress={geri}
              accessibilityLabel="Önceki soru">
              <MaterialCommunityIcons
                name="chevron-left"
                size={22}
                color={index === 0 ? Palette.solukMetin : Palette.lacivert}
              />
              <AppText variant="govde" bold color={index === 0 ? 'solukMetin' : 'lacivert'}>
                Önceki
              </AppText>
            </Pressable>
            <Pressable
              disabled={secilen === null}
              style={({ pressed }) => [
                styles.sonraki,
                secilen === null && styles.sonrakiPasif,
                pressed && secilen !== null && styles.pressed,
              ]}
              onPress={ileri}>
              <AppText variant="govde" color="beyaz" bold>
                {index + 1 >= sorular.length ? 'Sonucu gör' : 'Sonraki'}
              </AppText>
            </Pressable>
          </View>
        </View>
      )}

      {/* İlk kez sınav açılınca: nasıl çözülür (bir kez). Soru varken göster. */}
      {sinavIpucu && aktif ? (
        <IpucuOverlay
          baslik="Sınav nasıl çözülür?"
          altyazi="Kısaca:"
          maddeler={[
            { ikon: 'gesture-tap', metin: 'Bir şık seç; doğru mu yanlış mı anında görünür, altında kısa açıklama çıkar.' },
            { ikon: 'chevron-left', metin: '"Önceki" ile geri dönüp verdiğin cevapları görebilirsin.' },
            { ikon: 'content-save-outline', metin: 'Yarıda bırakırsan kaldığın yerden devam edersin.' },
            { ikon: 'medal-outline', metin: 'Tüm testleri %100 çözersen Takdir Belgesi kazanırsın.' },
          ]}
          onKapat={() => {
            setSinavIpucu(false);
            void ipucuIsaretle('sinav');
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

type SecenekDurum = 'notr' | 'dogru' | 'yanlis' | 'soluk';

function secenekDurum(i: number, secilen: number | null, dogruIndex: number): SecenekDurum {
  if (secilen === null) return 'notr';
  if (i === dogruIndex) return 'dogru';
  if (i === secilen) return 'yanlis';
  return 'soluk';
}

function Secenek({
  harf,
  metin,
  durum,
  onPress,
  disabled,
}: {
  harf: string;
  metin: string;
  durum: SecenekDurum;
  onPress: () => void;
  disabled: boolean;
}) {
  const arka =
    durum === 'dogru' ? DOGRU_YESIL : durum === 'yanlis' ? YANLIS_KIRMIZI : Palette.kartKremi;
  const metinRenk = durum === 'dogru' || durum === 'yanlis' ? 'beyaz' : 'anaMetin';
  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        styles.secenek,
        { backgroundColor: arka },
        durum === 'soluk' && styles.secenekSoluk,
        pressed && !disabled && styles.pressed,
      ]}
      onPress={onPress}>
      <AppText variant="govde" bold color={metinRenk} style={styles.secenekHarf}>
        {harf}
      </AppText>
      <AppText variant="govde" color={metinRenk} style={styles.secenekMetin}>
        {metin}
      </AppText>
      {durum === 'dogru' ? (
        <MaterialCommunityIcons name="check-circle" size={22} color={Palette.beyaz} />
      ) : durum === 'yanlis' ? (
        <MaterialCommunityIcons name="close-circle" size={22} color={Palette.beyaz} />
      ) : null}
    </Pressable>
  );
}

/** Sonuç ekranındaki tek yanlış soru kartı: soru + senin cevabın + doğru cevap + açıklama + karta git. */
function HataKart({
  soru,
  secilen,
  onKartGit,
}: {
  soru: KartSoru;
  secilen: number;
  onKartGit: () => void;
}) {
  const H = ['A', 'B', 'C', 'D', 'E'];
  return (
    <View style={styles.hataKart}>
      <AppText variant="kucuk" bold color="anaMetin">
        {soru.soru}
      </AppText>
      <View style={styles.hataSatir}>
        <MaterialCommunityIcons name="close-circle" size={16} color={Palette.kirmizi} />
        <AppText variant="etiket" color="kirmizi" style={styles.hataMetin}>
          Senin cevabın: {secilen >= 0 ? `${H[secilen]}) ${soru.siklar[secilen]}` : 'Boş bıraktın'}
        </AppText>
      </View>
      <View style={styles.hataSatir}>
        <MaterialCommunityIcons name="check-circle" size={16} color={Palette.yesil} />
        <AppText variant="etiket" color="yesil" style={styles.hataMetin}>
          Doğru cevap: {H[soru.dogru]}) {soru.siklar[soru.dogru]}
        </AppText>
      </View>
      {soru.aciklama ? (
        <AppText variant="etiket" color="solukMetin" style={styles.hataAciklama}>
          {soru.aciklama}
        </AppText>
      ) : null}
      <Pressable style={({ pressed }) => [styles.kartGitBtn, pressed && styles.pressed]} onPress={onKartGit}>
        <MaterialCommunityIcons name="card-text-outline" size={15} color={Palette.lacivert} />
        <AppText variant="etiket" bold color="lacivert">
          İlgili kartı çalış
        </AppText>
      </Pressable>
    </View>
  );
}

function Sonuc({
  cevaplar,
  sorular,
  lawAd,
  lawId,
  genelModu,
  belgeHak,
  katsayi,
  onZayif,
  onTekrar,
  onBitir,
  onKartGit,
  sonraki,
  onSonraki,
}: {
  cevaplar: SinavCevap[];
  sorular: KartSoru[];
  lawAd: string | null;
  lawId: number | null;
  genelModu: boolean;
  belgeHak: boolean;
  katsayi: number;
  onZayif: () => void;
  onTekrar: () => void;
  onBitir: () => void;
  onKartGit: (soru: KartSoru) => void;
  sonraki: { etiket: string } | null;
  onSonraki: () => void;
}) {
  const [ozetAcik, setOzetAcik] = useState(false);
  const { dogru, toplam, yuzde, puan, toplamPuan } = puanlaSinav(cevaplar, sorular, katsayi);
  // Takdir Belgesi yalnız KANUN denemesinde + kanunun tümü %100 ise.
  const tamBelge = !genelModu && lawId != null && (testSayisi(lawId) === 1 || belgeHak);
  const yanlislar = sorular
    .map((s, i) => ({ soru: s, secilen: cevaplar[i]?.secilenIndex ?? -1 }))
    .filter((x) => x.secilen !== x.soru.dogru);

  // %100 — tam isabet.
  if (yuzde === 100) {
    return (
      <ScrollView style={styles.kolon} contentContainerStyle={styles.sonucContent}>
        {tamBelge ? (
          <>
            <AppText variant="altBaslik" bold color="altinMetin" style={styles.tamIsabet}>
              🎖️ Tam isabet — {dogru}/{toplam} · {puan} puan
            </AppText>
            <TakdirBelgeAlani kanunAd={lawAd ?? 'Bu kanun'} tarih={bugunISO()} />
          </>
        ) : (
          <>
            <AppText variant="altBaslik" bold color="altinMetin" style={styles.tamIsabet}>
              🎯 Tam isabet — {dogru}/{toplam} · {puan} puan
            </AppText>
            {!genelModu ? (
              <AppText variant="kucuk" color="solukMetin" style={styles.belgeIpucu}>
                Bu testi tam çözdün. Kanunun TÜM testlerini %100 yapınca Takdir Belgesi kazanırsın.
              </AppText>
            ) : null}
          </>
        )}
        {sonraki ? <SonrakiBtn etiket={sonraki.etiket} onPress={onSonraki} /> : null}
        <View style={styles.sonucButonlar}>
          <Pressable style={({ pressed }) => [styles.sonucBtnIkincil, pressed && styles.pressed]} onPress={onTekrar}>
            <AppText variant="govde" bold color="lacivert">
              Tekrar çöz
            </AppText>
          </Pressable>
          <Pressable
            style={({ pressed }) => [sonraki ? styles.sonucBtnIkincil : styles.sonucBtn, pressed && styles.pressed]}
            onPress={onBitir}>
            <AppText variant="govde" bold color={sonraki ? 'lacivert' : 'beyaz'}>
              Bitir
            </AppText>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  const basarili = yuzde >= 70;
  return (
    <ScrollView style={styles.kolon} contentContainerStyle={styles.sonucContent}>
      <View style={styles.skorOzet}>
        <MaterialCommunityIcons
          name={basarili ? 'trophy-outline' : 'school-outline'}
          size={48}
          color={basarili ? Palette.altin : Palette.solukMetin}
        />
        <AppText variant="altBaslik" bold color="lacivert">
          Skorun: {dogru}/{toplam}
        </AppText>
        {/* Her soru 2 puan → toplam puan (başkan: "kaç aldığı yazılsın"). */}
        <AppText variant="govde" bold color="altinMetin">
          {puan} / {toplamPuan} puan
        </AppText>
        <AppText variant="kucuk" color="solukMetin">
          %{yuzde} doğru{basarili ? ' — tebrikler!' : ' — biraz daha çalış.'}
        </AppText>
      </View>

      {/* Sınav→eylem köprüsü: yanlışlar zayıf havuza düştü → hemen çalışmaya yönlendir. */}
      {yanlislar.length > 0 ? (
        <Pressable style={({ pressed }) => [styles.zayifBtn, pressed && styles.pressed]} onPress={onZayif}>
          <MaterialCommunityIcons name="target" size={18} color={Palette.beyaz} />
          <AppText variant="govde" bold color="beyaz">
            Yanlış mevzileri çalış
          </AppText>
        </Pressable>
      ) : null}

      {/* Hatalı soru özeti (açılır): her yanlış → doğru cevap + açıklama + ilgili kart. */}
      {yanlislar.length > 0 ? (
        <>
          <Pressable
            style={({ pressed }) => [styles.ozetBtn, pressed && styles.pressed]}
            onPress={() => setOzetAcik((a) => !a)}>
            <MaterialCommunityIcons
              name={ozetAcik ? 'chevron-up' : 'clipboard-list-outline'}
              size={18}
              color={Palette.lacivert}
            />
            <AppText variant="kucuk" bold color="lacivert">
              {ozetAcik ? 'Yanlışları gizle' : `Yanlışlarımı ve çözümleri gör (${yanlislar.length})`}
            </AppText>
          </Pressable>
          {ozetAcik
            ? yanlislar.map((y, i) => (
                <HataKart key={i} soru={y.soru} secilen={y.secilen} onKartGit={() => onKartGit(y.soru)} />
              ))
            : null}
        </>
      ) : null}

      {/* Başkan (23 Ağu): sınav bitince sıradakine geçiş yoktu; ana eylem olarak eklendi. */}
      {sonraki ? <SonrakiBtn etiket={sonraki.etiket} onPress={onSonraki} /> : null}

      <View style={styles.sonucButonlar}>
        <Pressable style={({ pressed }) => [styles.sonucBtnIkincil, pressed && styles.pressed]} onPress={onTekrar}>
          <AppText variant="govde" bold color="lacivert">
            Tekrar çöz
          </AppText>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.sonucBtnIkincil, pressed && styles.pressed]} onPress={onBitir}>
          <AppText variant="govde" bold color="lacivert">
            Bitir
          </AppText>
        </Pressable>
      </View>
    </ScrollView>
  );
}

/** Sonuç ekranının ana eylemi: bir sonraki test/denemeye geç. */
function SonrakiBtn({ etiket, onPress }: { etiket: string; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.sonrakiBtn, pressed && styles.pressed]} onPress={onPress}>
      <AppText variant="govde" bold color="beyaz">
        {etiket}
      </AppText>
      <MaterialCommunityIcons name="arrow-right" size={20} color={Palette.beyaz} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sonrakiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.m,
    paddingVertical: 14,
    paddingHorizontal: Spacing.three,
  },
  safe: {
    flex: 1,
    backgroundColor: Palette.kremZemin,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.lacivert,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  headerSpacer: {
    width: 26,
  },
  headerMeta: {
    flex: 1,
    alignItems: 'center',
  },
  kolon: {
    flex: 1,
    width: '100%',
    maxWidth: CardFlowMaxWidth,
    alignSelf: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.kenarlik,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Palette.altinKoyu,
  },
  soruKart: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.four,
  },
  secenekler: {
    gap: Spacing.two,
  },
  secenek: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
  },
  secenekSoluk: {
    opacity: 0.5,
  },
  secenekHarf: {
    minWidth: 20,
  },
  secenekMetin: {
    flex: 1,
  },
  aciklama: {
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  aciklamaDogru: {
    backgroundColor: Palette.altinSolukYuzey,
    borderColor: Palette.yesil,
  },
  aciklamaYanlis: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kirmizi,
  },
  aciklamaMetin: {
    lineHeight: 22,
  },
  altBlok: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  onceki: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1.5,
    borderRadius: Radius.m,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  oncekiPasif: {
    opacity: 0.4,
  },
  sonraki: {
    flex: 1,
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.m,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sonrakiPasif: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.85,
  },
  // %100 Takdir Belgesi sonuç ekranı
  sonucContent: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  tamIsabet: {
    textAlign: 'center',
  },
  belgeIpucu: {
    textAlign: 'center',
    lineHeight: 20,
  },
  sonucButonlar: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  sonucBtn: {
    flex: 1,
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.m,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  zayifBtn: {
    flexDirection: 'row',
    gap: Spacing.one,
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.m,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skorOzet: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.three,
  },
  sonucBtnIkincil: {
    flex: 1,
    borderColor: Palette.lacivert,
    borderWidth: 1.5,
    borderRadius: Radius.m,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  ozetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    borderColor: Palette.kenarlik,
    borderWidth: 1.5,
    borderRadius: Radius.m,
    paddingVertical: Spacing.two,
  },
  hataKart: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  hataSatir: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.one,
  },
  hataMetin: {
    flex: 1,
    lineHeight: 18,
  },
  hataAciklama: {
    lineHeight: 18,
    marginTop: Spacing.half,
  },
  kartGitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    alignSelf: 'flex-start',
    marginTop: Spacing.one,
  },
});
