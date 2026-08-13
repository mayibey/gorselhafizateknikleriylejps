/**
 * PATİKA — SONSUZ YOLCULUK (bayraklı; 12 Ağu 2026)
 *
 * Başkanın tarayıcı taslağında oturan düzenin uygulama karşılığı:
 *  • Sahne TEK bir dikişsiz görsel; alt alta ÖRTÜŞEREK diziliyor, üst kenarı eriyerek
 *    alttakine karışıyor → yol hiç bitmiyor, ek yeri görünmüyor.
 *  • Yol ÇİZİLMİYOR. Görseldeki gerçek asfaltın orta çizgisi ölçülerek çıkarıldı (YOL_IZI);
 *    duraklar ve araç o çizgiye oturuyor.
 *  • Araç gerçek kuşbakışı jandarma aracı; virajda dönüyor, arkasında altın iz kalıyor.
 *  • Kamera aracı takip eder (ekranda ~3-4 durak); dünya kayar, araç büyüklüğü sabit.
 *
 * TEKNİK: her şey RN Animated + NATIVE DRIVER. Yol üzerindeki konum, tek bir Animated.Value'nun
 * parça-parça doğrusal interpolasyonuyla çözülür (inputRange = örnek noktaların yol uzunluğu,
 * outputRange = o noktaların ekran koordinatı) → kare başına JS hesabı YOK, takılma yok.
 * Reanimated/worklet KULLANILMADI (SDK 54'te riskli; bkz. patika geçmişi).
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';
import type { Bolum } from '@/db/schema';

/** Patika düğümü — patika.tsx ile aynı şekil (orada yerel tip olarak duruyor). */
type BolumDugum = { bolum: Bolum; calisilan: number; toplam: number; oran: number };

const SAHNE = require('../../../assets/images/patika-dongu-orman.webp');
const ARAC = require('../../../assets/images/patika-arac-kus.webp');

/** Sahne görselinin oranı (1620/1080) ve aracın oranı (702/420). */
const SAHNE_ORAN = 1620 / 1080;
const ARAC_ORAN = 702 / 420;
/** Katlar UÇ UCA dizilir (örtüşme YOK).
 *  12 Ağu cihaz testi: %18 örtüşmede ekranda ÜSTTEKİ katın görüntüsü görünüyor ama yol
 *  hesabı ALTTAKİ kattan geliyordu → duraklar ve araç yolun solunda kalıyordu ("kayma").
 *  Görselin kendisi artık dikişsiz (ilk satır = son satır), bu yüzden örtüşmeye gerek yok. */
const ORTUSME = 0;
/** Dünyanın ekrandan kaç kat geniş çizileceği (yakın plan). */
const YAKINLIK = 1.9;

/**
 * Sahnedeki gerçek yolun orta çizgisi — normalize (x, y), 0..1.
 * Görselden ÖLÇÜLEREK çıkarıldı (şerit çizgisi taraması + elle doğrulama), göz kararı değil.
 * İki uç aynı x'te ve dik → kat üstüne kat binince yol kırılmıyor.
 */
const YOL_IZI: readonly (readonly [number, number])[] = [
  [0.4914, 0.0], [0.4906, 0.0417], [0.4904, 0.0833], [0.4988, 0.125], [0.4945, 0.1667],
  [0.484, 0.2083], [0.4752, 0.25], [0.4623, 0.2917], [0.4463, 0.3333], [0.4427, 0.375],
  [0.4555, 0.4167], [0.4805, 0.4583], [0.5096, 0.5], [0.5268, 0.5417], [0.5343, 0.5833],
  [0.5343, 0.625], [0.5086, 0.6667], [0.4861, 0.7083], [0.4775, 0.75], [0.4849, 0.7917],
  [0.4822, 0.8333], [0.4725, 0.875], [0.4876, 0.9167], [0.4914, 0.9583], [0.4914, 1],
];

type Nokta = { x: number; y: number };

export function Yolculuk({
  dugumler,
  aktifIndex,
  kanunAd,
  calisilanKart,
  toplamKart,
  onDugumBas,
  onDevam,
}: {
  dugumler: BolumDugum[];
  aktifIndex: number;
  kanunAd: string | null;
  calisilanKart: number;
  toplamKart: number;
  onDugumBas: (bolumId: number) => void;
  onDevam: () => void;
}) {
  const { width: ekranG, height: ekranY } = useWindowDimensions();
  const sahneY = Math.round(Math.min(ekranY * 0.62, 620));
  const N = dugumler.length;

  /* ── Dünya geometrisi (ölçüler değişmedikçe bir kez hesaplanır) ── */
  const dunya = useMemo(() => {
    const W = Math.round(ekranG * YAKINLIK);
    const katY = W * SAHNE_ORAN;
    const adim = katY * (1 - ORTUSME);
    // Duraklar arası mesafe (başkan, 13 Ağu: "çok kısa, artır") — kat yüksekliğinin ~%25'i,
    // ekranda ~2-3 durak görünür, aradaki yolculuk hissedilir.
    const ara = katY * 0.25;
    const gerekli = (N + 1.4) * ara;
    const kat = Math.max(3, Math.ceil(gerekli / adim) + 1);
    const yukseklik = (kat - 1) * adim + katY;

    // Kat üstleri (dünyanın tepesinden ölçülü) — ilk kat EN ALTTA.
    const katUst: number[] = [];
    for (let k = 0; k < kat; k++) katUst.push(yukseklik - k * adim - katY);

    // Yol noktaları: örtüşen kenarlar kırpılır → çift çizgi olmaz.
    const ham: Nokta[] = [];
    for (let k = 0; k < kat; k++) {
      const ustKes = k === kat - 1 ? 0 : ORTUSME / 2;
      const altKes = k === 0 ? 0 : ORTUSME / 2;
      for (const [nx, ny] of YOL_IZI) {
        if (ny < ustKes || ny > 1 - altKes) continue;
        ham.push({ x: nx * W, y: katUst[k] + ny * katY });
      }
    }
    ham.sort((a, b) => b.y - a.y); // alttan yukarı

    // Yay uzunlukları
    const uzunluk: number[] = [0];
    for (let i = 1; i < ham.length; i++) {
      const d = Math.hypot(ham[i].x - ham[i - 1].x, ham[i].y - ham[i - 1].y);
      uzunluk.push(uzunluk[i - 1] + d);
    }
    const toplamU = uzunluk[uzunluk.length - 1];

    const noktaAt = (u: number): Nokta => {
      const t = Math.max(0, Math.min(u, toplamU));
      let i = 1;
      while (i < uzunluk.length - 1 && uzunluk[i] < t) i++;
      const o = (t - uzunluk[i - 1]) / Math.max(1, uzunluk[i] - uzunluk[i - 1]);
      return {
        x: ham[i - 1].x + (ham[i].x - ham[i - 1].x) * o,
        y: ham[i - 1].y + (ham[i].y - ham[i - 1].y) * o,
      };
    };

    // Örnekleme: interpolasyon tabloları (native driver bunlarla çalışır)
    const ORNEK = Math.max(80, Math.min(400, Math.round(toplamU / 26)));
    const uler: number[] = [];
    const xler: number[] = [];
    const yler: number[] = [];
    const aciler: string[] = [];
    const kamX: number[] = [];
    const kamY: number[] = [];
    for (let i = 0; i < ORNEK; i++) {
      const u = (toplamU * i) / (ORNEK - 1);
      const p = noktaAt(u);
      const ileri = noktaAt(Math.min(toplamU, u + 12));
      const aci = (Math.atan2(ileri.y - p.y, ileri.x - p.x) * 180) / Math.PI + 90;
      uler.push(u);
      xler.push(p.x);
      yler.push(p.y);
      aciler.push(`${aci.toFixed(1)}deg`);
      kamX.push(Math.max(-(W - ekranG), Math.min(0, ekranG / 2 - p.x)));
      kamY.push(Math.max(-(yukseklik - sahneY), Math.min(0, sahneY * 0.62 - p.y)));
    }

    // Durak konumları
    const durakU: number[] = [];
    for (let i = 0; i < N; i++) durakU.push(ara * (i + 0.8));
    const duraklar = durakU.map((u) => noktaAt(u));

    // İz noktaları (araç geçtikçe yanan altın izler)
    const izAdim = Math.max(18, toplamU / 260);
    const izler: { u: number; p: Nokta }[] = [];
    for (let u = 0; u <= toplamU; u += izAdim) izler.push({ u, p: noktaAt(u) });

    return { W, katY, katUst, yukseklik, toplamU, uler, xler, yler, aciler, kamX, kamY, durakU, duraklar, izler };
  }, [ekranG, sahneY, N]);

  /* ── Sürücü: yol üzerindeki konum ── */
  const hedefU = dunya.durakU[Math.max(0, Math.min(N - 1, aktifIndex < 0 ? N - 1 : aktifIndex))] ?? 0;
  const konum = useRef(new Animated.Value(hedefU)).current;
  const oncekiU = useRef(hedefU);

  useEffect(() => {
    const fark = hedefU - oncekiU.current;
    if (Math.abs(fark) < 1) return;
    // İlerleme varsa yolculuk animasyonu, geri/atlama varsa anında yerleş.
    if (fark > 0 && fark < dunya.toplamU * 0.25) {
      Animated.timing(konum, {
        toValue: hedefU,
        duration: 1500,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) mevcutU.current = hedefU;
      });
    } else {
      konum.setValue(hedefU);
      mevcutU.current = hedefU;
    }
    oncekiU.current = hedefU;
  }, [hedefU, konum, dunya.toplamU]);

  /* ── Durağa dokununca: önce araç oraya sürer, VARINCA kart akışı açılır ──
     Başkan (13 Ağu): "ileriye tıklayınca araba ilerlemiyor, direk madde açılıyor". */
  const mevcutU = useRef(hedefU);
  const surusteMi = useRef(false);
  const duragaSur = (i: number, bitince: () => void) => {
    const varis = dunya.durakU[i];
    if (varis == null || surusteMi.current) {
      bitince();
      return;
    }
    const fark = Math.abs(varis - mevcutU.current);
    if (fark < 4) {
      bitince();
      return;
    }
    surusteMi.current = true;
    Animated.timing(konum, {
      toValue: varis,
      duration: Math.min(2200, 380 + fark * 1.1),
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      surusteMi.current = false;
      if (finished) {
        mevcutU.current = varis;
        oncekiU.current = varis;
        bitince();
      }
    });
  };

  /* ── Tepe lambası: sürekli yanıp söner ── */
  const lamba = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const dongu = Animated.loop(
      Animated.sequence([
        Animated.timing(lamba, { toValue: 1, duration: 380, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(lamba, { toValue: 0, duration: 380, easing: Easing.linear, useNativeDriver: true }),
      ]),
    );
    dongu.start();
    return () => dongu.stop();
  }, [lamba]);

  const ara = { inputRange: dunya.uler, extrapolate: 'clamp' as const };
  const aracX = konum.interpolate({ ...ara, outputRange: dunya.xler });
  const aracYk = konum.interpolate({ ...ara, outputRange: dunya.yler });
  const aracAci = konum.interpolate({ ...ara, outputRange: dunya.aciler });
  const kameraX = konum.interpolate({ ...ara, outputRange: dunya.kamX });
  const kameraY = konum.interpolate({ ...ara, outputRange: dunya.kamY });

  // Araç da yol genişliğine göre ölçeklenir (gerçek araç yolun ~%60'ı kadardır).
  const aracG = Math.round(dunya.W * 0.088 * 0.62);
  const aracYy = aracG * ARAC_ORAN;

  return (
    <>
      <View style={[st.sahne, { height: sahneY }]}>
        <Animated.View
          style={{
            position: 'absolute',
            width: dunya.W,
            height: dunya.yukseklik,
            transform: [{ translateX: kameraX }, { translateY: kameraY }],
          }}>
          {/* KATLAR — üstteki önce, alttakinin üst kenarı eriyerek üstüne biner */}
          {dunya.katUst.map((ust, i) => (
            <View key={`kat${i}`} style={{ position: 'absolute', top: ust, left: 0, width: dunya.W, height: dunya.katY }}>
              <Image source={SAHNE} style={StyleSheet.absoluteFill} contentFit="fill" />
            </View>
          ))}

          {/* ALTIN İZ — araç geçtikçe yanar */}
          {dunya.izler.map((iz, i) => {
            const gorunur = konum.interpolate({
              inputRange: [Math.max(0, iz.u - 10), iz.u],
              outputRange: [0, 1],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={`iz${i}`}
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: iz.p.x - 7,
                  top: iz.p.y - 3,
                  width: 14,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: 'rgba(240,183,51,0.5)',
                  opacity: gorunur,
                }}
              />
            );
          })}

          {/* DURAKLAR — yola oturan taş platform + direk + levha.
              ÖLÇÜ KURALI (cihazda görüldü, 12 Ağu): levha YOL GENİŞLİĞİNE göre ölçeklenir;
              sabit ekran oranı verilince yol kadar iri çıkıp asfaltı kapatıyordu.
              Platformun MERKEZİ yol noktasına oturur (eskiden yolun altında kalıyordu). */}
          {dunya.duraklar.map((p, i) => {
            const d = dugumler[i];
            if (!d) return null;
            const gecildi = d.toplam > 0 && d.calisilan >= d.toplam;
            const aktif = i === aktifIndex;
            const etiket = d.bolum.ad.replace(/^Madde\s+/i, '');
            const yolG = dunya.W * 0.088; // sahnedeki asfaltın genişliği (ölçüldü)
            const levhaB = Math.round(yolG * 0.72);
            const direkY = Math.round(levhaB * 0.46);
            const platG = Math.round(levhaB * 1.2);
            const platY = Math.round(platG * 0.34);
            const kap = platG;
            return (
              <Pressable
                key={`d${d.bolum.id}`}
                onPress={() => duragaSur(i, () => onDugumBas(d.bolum.id))}
                style={{
                  position: 'absolute',
                  left: p.x - kap / 2,
                  top: p.y - (levhaB + direkY + platY / 2),
                  width: kap,
                  alignItems: 'center',
                }}
                accessibilityRole="button"
                accessibilityLabel={d.bolum.ad}>
                <View
                  style={[
                    st.levha,
                    { width: levhaB, height: levhaB, borderRadius: levhaB * 0.26 },
                    aktif && st.levhaAktif,
                    gecildi && st.levhaGecildi,
                  ]}>
                  <AppText
                    variant="govde"
                    bold
                    color={gecildi ? 'altinParlak' : 'beyaz'}
                    numberOfLines={1}
                    style={{ fontSize: levhaB * (gecildi ? 0.52 : 0.44) }}>
                    {gecildi ? '✓' : etiket}
                  </AppText>
                </View>
                <View style={[st.direk, { height: direkY }]} />
                <View style={[st.platform, { width: platG, height: platY, borderRadius: platG }]} />
              </Pressable>
            );
          })}

          {/* ARAÇ */}
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: -aracG / 2,
              top: -aracYy / 2,
              width: aracG,
              height: aracYy,
              transform: [{ translateX: aracX }, { translateY: aracYk }, { rotate: aracAci }],
            }}>
            <View style={[st.aracGolge, { borderRadius: aracG }]} />
            <Image source={ARAC} style={StyleSheet.absoluteFill} contentFit="contain" />
            <Animated.View
              style={[
                st.lamba,
                { left: aracG * 0.16, top: aracYy * 0.36, width: aracG * 0.3, height: aracYy * 0.06,
                  backgroundColor: '#2E74E0', opacity: lamba },
              ]}
            />
            <Animated.View
              style={[
                st.lamba,
                { right: aracG * 0.16, top: aracYy * 0.36, width: aracG * 0.3, height: aracYy * 0.06,
                  backgroundColor: '#D02A31',
                  opacity: lamba.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) },
              ]}
            />
          </Animated.View>
        </Animated.View>
      </View>

      {/* ALT PANEL */}
      <Pressable style={({ pressed }) => [st.altPanel, pressed && st.basili]} onPress={onDevam}>
        <View style={st.altSol}>
          <AppText variant="etiket" bold color="kartMetinIkincil" numberOfLines={1} style={st.altUst}>
            {aktifIndex >= 0 && dugumler[aktifIndex]
              ? `SIRADAKİ · ${dugumler[aktifIndex].bolum.ad.toLocaleUpperCase('tr')}`
              : 'ŞU ANKİ MEVZİ'}
          </AppText>
          <AppText variant="govde" bold color="beyaz" numberOfLines={1}>
            {kanunAd ?? 'Kanun'}
          </AppText>
          <View style={st.altBar}>
            {toplamKart > 0 && calisilanKart > 0 ? (
              <View style={[st.altBarDolu, { flex: Math.round((calisilanKart / toplamKart) * 100) }]} />
            ) : null}
            <View style={{ flex: Math.max(1, 100 - Math.round((calisilanKart / Math.max(1, toplamKart)) * 100)) }} />
          </View>
          <AppText variant="etiket" color="kartMetinIkincil" numberOfLines={1}>
            {toplamKart === 0
              ? 'yakında'
              : `${calisilanKart}/${toplamKart} kart · %${Math.round((calisilanKart / toplamKart) * 100)}`}
          </AppText>
        </View>
        <View style={st.devamBtn}>
          <AppText variant="kucuk" bold color="lacivert">
            DEVAM ET
          </AppText>
          <MaterialCommunityIcons name="arrow-right" size={18} color="#07334B" />
        </View>
      </Pressable>
    </>
  );
}

const st = StyleSheet.create({
  sahne: {
    alignSelf: 'center',
    width: '100%',
    borderRadius: Radius.l,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(67,203,218,0.4)',
    backgroundColor: '#091420',
  },
  levha: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16,22,30,0.92)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  levhaAktif: { borderColor: Palette.altinParlak, backgroundColor: 'rgba(20,28,38,0.96)' },
  // Tamamlanan durak da KOYU levha kalır, farkı altın çerçeve + altın tik (eskiden dolu altın
  // blok oluyordu ve yolu kapatıyordu).
  levhaGecildi: { borderColor: 'rgba(240,183,51,0.85)', backgroundColor: 'rgba(14,20,28,0.92)' },
  direk: { width: 4, backgroundColor: 'rgba(38,45,54,0.95)' },
  platform: {
    backgroundColor: 'rgba(86,95,106,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  aracGolge: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    transform: [{ translateY: 3 }, { scale: 0.92 }],
  },
  lamba: { position: 'absolute', borderRadius: 8 },
  altPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    alignSelf: 'center',
    width: '100%',
    marginTop: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.l,
    backgroundColor: 'rgba(6,38,58,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(126,205,218,0.35)',
  },
  altSol: { flex: 1, gap: 4 },
  altUst: { letterSpacing: 1 },
  altBar: { flexDirection: 'row', height: 5, borderRadius: 3, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.14)' },
  altBarDolu: { backgroundColor: Palette.altinParlak },
  devamBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
    backgroundColor: Palette.altinParlak,
  },
  basili: { opacity: 0.85 },
});
