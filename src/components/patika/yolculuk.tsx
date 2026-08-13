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
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';
import type { Bolum } from '@/db/schema';
import { bolumBilgi } from '@/lib/kanun-bolumleri';

/** Patika düğümü — patika.tsx ile aynı şekil (orada yerel tip olarak duruyor). */
type BolumDugum = { bolum: Bolum; calisilan: number; toplam: number; oran: number };

const SAHNE = require('../../../assets/images/patika-dongu-orman.webp');
const ARAC = require('../../../assets/images/patika-arac-kus.webp');

/** Sahne görselinin oranı (1265/1080) ve aracın oranı (702/420).
 *  13 Ağu: sahne "kaydırmalı çapraz geçiş" ile gerçek döngüye sokuldu (ek yeri görünmüyor),
 *  bu işlem görselin bir bandını tükettiği için boy kısaldı → oran güncellendi. */
const SAHNE_ORAN = 1265 / 1080;
const ARAC_ORAN = 702 / 420;
/** Katlar UÇ UCA dizilir (örtüşme YOK).
 *  12 Ağu cihaz testi: %18 örtüşmede ekranda ÜSTTEKİ katın görüntüsü görünüyor ama yol
 *  hesabı ALTTAKİ kattan geliyordu → duraklar ve araç yolun solunda kalıyordu ("kayma").
 *  Görselin kendisi artık dikişsiz (ilk satır = son satır), bu yüzden örtüşmeye gerek yok. */
const ORTUSME = 0;
/** Dünyanın ekrandan kaç kat geniş çizileceği. Büyük değer = daha yakın plan.
 *  13 Ağu (başkan): "kamerayı biraz uzaklaştır, madde sınırda görünüyor" → 1.9'dan 1.55'e. */
const YAKINLIK = 1.55;

/**
 * Sahnedeki gerçek yolun orta çizgisi — normalize (x, y), 0..1.
 * Görselden ÖLÇÜLEREK çıkarıldı (şerit çizgisi taraması + elle doğrulama), göz kararı değil.
 * İki uç aynı x'te ve dik → kat üstüne kat binince yol kırılmıyor.
 */
const YOL_IZI: readonly (readonly [number, number])[] = [
  [0.4789, 0.0], [0.4745, 0.0409], [0.4648, 0.0818], [0.4532, 0.1227], [0.4451, 0.1636],
  [0.4446, 0.2045], [0.4541, 0.2454], [0.4713, 0.2863], [0.4921, 0.3272], [0.5122, 0.3681],
  [0.5251, 0.409], [0.532, 0.4499], [0.5343, 0.4908], [0.5283, 0.5317], [0.509, 0.5726],
  [0.4915, 0.6135], [0.4816, 0.6544], [0.4797, 0.6953], [0.4843, 0.7362], [0.4835, 0.7771],
  [0.4806, 0.818], [0.4866, 0.8589], [0.4943, 0.8998], [0.4925, 0.9407], [0.4851, 0.9816],
  [0.4848, 1],
];

type Nokta = { x: number; y: number };

export function Yolculuk({
  dugumler,
  aktifIndex,
  kanunAd,
  calisilanKart,
  toplamKart,
  basliklar,
  klasor,
  onDugumBas,
  onDevam,
}: {
  dugumler: BolumDugum[];
  aktifIndex: number;
  kanunAd: string | null;
  calisilanKart: number;
  toplamKart: number;
  /** Durak kimliği → madde başlığı (numara tek başına anlam taşımıyordu). */
  basliklar?: Record<number, string>;
  /** Kanun klasörü (tck…) — bölüm adlarını çözmek için. */
  klasor?: string | null;
  onDugumBas: (bolumId: number) => void;
  onDevam: () => void;
}) {
  const { width: ekranG, height: ekranY } = useWindowDimensions();
  // Harita kalan alanı TAM doldurur: yükseklik onLayout ile ÖLÇÜLÜR (sabit oran verilince
  // altta beyaz boşluk kalıyor, sayfa kaydırmalı oluyordu — başkan, 13 Ağu).
  const [olcumY, setOlcumY] = useState(0);
  const sahneY = olcumY > 0 ? olcumY : Math.round(Math.min(ekranY * 0.74, 780));
  const N = dugumler.length;

  /* ── Dünya geometrisi (ölçüler değişmedikçe bir kez hesaplanır) ── */
  const dunya = useMemo(() => {
    const W = Math.round(ekranG * YAKINLIK);
    const katY = W * SAHNE_ORAN;
    const adim = katY * (1 - ORTUSME);
    // Duraklar arası mesafe (başkan, 13 Ağu: "çok kısa, artır") — kat yüksekliğinin ~%25'i,
    // ekranda ~2-3 durak görünür, aradaki yolculuk hissedilir.
    const ara = katY * 0.44;
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
      kamY.push(Math.max(-(yukseklik - sahneY), Math.min(0, sahneY * 0.6 - p.y)));
    }

    // Durak konumları
    const durakU: number[] = [];
    for (let i = 0; i < N; i++) durakU.push(ara * (i + 0.8));
    const duraklar = durakU.map((u) => noktaAt(u));

    // ATLAMA BANTLARI: kanunun her maddesi kart değil (TCK'da 45'ten 247'ye atlıyor).
    // Atlamanın olduğu yere yolun üstüne şerit konur → "sayılar rastgele" hissi biter.
    const atlamalar: { u: number; p: Nokta; yazi: string }[] = [];

    // İz noktaları (araç geçtikçe yanan altın izler)
    const izAdim = Math.max(14, W * 0.088 * 0.34); // yol genişliğine bağlı düzenli aralık
    const izler: { u: number; p: Nokta }[] = [];
    for (let u = 0; u <= toplamU; u += izAdim) izler.push({ u, p: noktaAt(u) });

    return { W, katY, katUst, yukseklik, toplamU, uler, xler, yler, aciler, kamX, kamY, durakU, duraklar, izler, atlamalar, noktaAt };
  }, [ekranG, sahneY, N]);

  /** Konu bloğu değişimi: madde numarası atlıyorsa yola BÖLÜM KAPISI konur. */
  const bolumKapilari = useMemo(() => {
    const no = (i: number) => {
      const m = dugumler[i]?.bolum.ad.match(/(\d+)/);
      return m ? Number(m[1]) : null;
    };
    const liste: { key: string; p: Nokta; ad: string; ornekler: string; alt: string }[] = [];
    for (let i = 0; i < N - 1; i++) {
      const a = no(i);
      const b = no(i + 1);
      if (a == null || b == null || b <= a + 1) continue;
      // KAPI YALNIZ BÖLÜM DEĞİŞİNCE (başkan, 13 Ağu: 262→264 arasında da kapı çıkıyordu —
      // 263 kart olmadığı için "atlama" sayılıyordu, oysa ikisi de aynı bölümün içinde).
      const bilgi = bolumBilgi(klasor, b);
      const oncekiBilgi = bolumBilgi(klasor, a);
      if (bilgi) {
        if (oncekiBilgi && oncekiBilgi.ad === bilgi.ad) continue; // aynı bölüm → kapı yok
      } else if (b - a < 20) {
        continue; // bölüm tablosu yoksa yalnız BÜYÜK atlamada kapı
      }
      const u = ((dunya.durakU[i] ?? 0) + (dunya.durakU[i + 1] ?? 0)) / 2;
      // Bu blokta KAÇ madde var (patikadaki gerçek durak sayısı) → "20 madde".
      let adet = 0;
      if (bilgi) {
        for (let k = 0; k < N; k++) {
          const n = no(k);
          if (n != null && n >= bilgi.bas && n <= bilgi.son) adet++;
        }
      }
      liste.push({
        key: `kapi${i}`,
        p: dunya.noktaAt(u),
        ad: bilgi?.ad ?? 'YENİ BÖLÜM',
        ornekler: bilgi?.ornekler ?? '',
        alt: bilgi ? `${bilgi.bas}–${bilgi.son}. maddeler · ${adet} madde` : `${b}. maddeden devam`,
      });
    }
    return liste;
  }, [dugumler, dunya, N, klasor]);

  // Araç ölçüsü (yol genişliğine göre) — park payı bundan hesaplanır.
  const aracG = Math.round(dunya.W * 0.088 * 0.66);
  const aracYy = aracG * ARAC_ORAN;
  /** Araç durağa TAM ÜSTÜNE değil, biraz gerisine park eder → taş platform kapanmaz. */
  const parkPayi = aracYy * 0.62;

  /* ── Sürücü: yol üzerindeki konum ── */
  const durakYeri = (i: number) => Math.max(0, (dunya.durakU[i] ?? 0) - parkPayi);
  const hedefU = durakYeri(Math.max(0, Math.min(N - 1, aktifIndex < 0 ? N - 1 : aktifIndex)));
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
    const varis = dunya.durakU[i] == null ? null : durakYeri(i);
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
    elleSifirla();
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

  /* ── ELLE KAYDIRMA (başkan, 13 Ağu: "45'ten 1'e gidemiyorum") ──
     Kamera aracı takip eder ama kullanıcı parmakla yolu yukarı/aşağı gezebilir.
     Ofset kameranın ÜSTÜNE eklenir; bir durağa dokunulunca yumuşakça sıfırlanır
     (araç yeniden ortalanır). Dokunuşları bozmamak için 6 px'den kısa hareket
     kaydırma sayılmaz → duraklara dokunma çalışmaya devam eder. */
  const elle = useRef(new Animated.Value(0)).current;
  const elleDeger = useRef(0);
  const elleBaslangic = useRef(0);
  /** O anki kamera Y'si (dizideki örneklerden) — kaydırma sınırlarını hesaplamak için. */
  const kameraSuanki = () => {
    const u = mevcutU.current;
    const dizi = dunya.uler;
    let i = 1;
    while (i < dizi.length - 1 && dizi[i] < u) i++;
    const o = (u - dizi[i - 1]) / Math.max(1, dizi[i] - dizi[i - 1]);
    return dunya.kamY[i - 1] + (dunya.kamY[i] - dunya.kamY[i - 1]) * o;
  };
  const elleSifirla = () => {
    if (Math.abs(elleDeger.current) < 1) return;
    elleDeger.current = 0;
    Animated.timing(elle, { toValue: 0, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  };
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 6,
      onPanResponderGrant: () => {
        elleBaslangic.current = elleDeger.current;
      },
      onPanResponderMove: (_e, g) => {
        const kam = kameraSuanki();
        const enAz = -(dunya.yukseklik - sahneY) - kam; // dünyanın tepesi
        const enCok = -kam; // dünyanın dibi
        const v = Math.max(enAz, Math.min(enCok, elleBaslangic.current + g.dy));
        elleDeger.current = v;
        elle.setValue(v);
      },
    }),
  ).current;

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

  return (
    <>
      {/* PANEL — başkan (13 Ağu): en ÜSTTE dursun (kanun, ilerleme, DEVAM ET). */}
      <Pressable style={({ pressed }) => [st.altPanel, pressed && st.basili]} onPress={onDevam}>
        <View style={st.altSol}>
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
              : `${calisilanKart}/${toplamKart} kart · %${Math.round(
                  (calisilanKart / toplamKart) * 100,
                )} · ${N} madde`}
          </AppText>
        </View>
        <View style={st.devamBtn}>
          <AppText variant="kucuk" bold color="lacivert">
            DEVAM ET
          </AppText>
          <MaterialCommunityIcons name="arrow-right" size={18} color="#07334B" />
        </View>
      </Pressable>
      <View
        style={st.sahne}
        {...pan.panHandlers}
        onLayout={(e) => {
          const h = Math.round(e.nativeEvent.layout.height);
          if (h > 0 && Math.abs(h - olcumY) > 2) setOlcumY(h);
        }}>
        <Animated.View
          style={{
            position: 'absolute',
            width: dunya.W,
            height: dunya.yukseklik,
            transform: [
              { translateX: kameraX },
              { translateY: Animated.add(kameraY, elle) },
            ],
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
                  left: iz.p.x - 3.5,
                  top: iz.p.y - 3.5,
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: 'rgba(240,183,51,0.75)',
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
            const levhaB = Math.round(yolG * 0.86);
            const kap = Math.round(levhaB * 2.2);
            return (
              <Pressable
                key={`d${d.bolum.id}`}
                onPress={() => duragaSur(i, () => onDugumBas(d.bolum.id))}
                style={{
                  position: 'absolute',
                  left: p.x - kap / 2,
                  top: p.y - levhaB / 2,
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
                  {/* Numara HER durakta yazar (başkan, 13 Ağu: "bazılarında görünmüyor" —
                      tamamlananlarda numara yerine tik konuyordu). Tik numaranın altında küçük. */}
                  <AppText
                    variant="govde"
                    bold
                    color={gecildi ? 'altinParlak' : 'beyaz'}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={{ fontSize: levhaB * 0.42 }}>
                    {etiket}
                  </AppText>
                  {gecildi ? (
                    <AppText variant="etiket" bold color="altinParlak" style={{ fontSize: levhaB * 0.28, marginTop: -levhaB * 0.06 }}>
                      ✓
                    </AppText>
                  ) : null}
                </View>
                {aktif && basliklar?.[d.bolum.id] ? (
                  // Madde başlığı: düz yazı "elle yazılmış" duruyordu → altın çerçeveli
                  // koyu rozet (başkan, 13 Ağu).
                  <View style={[st.baslikRozet, { maxWidth: kap }]}>
                    <View style={st.baslikNokta} />
                    <AppText variant="etiket" bold color="beyaz" numberOfLines={1} style={st.baslikYazi}>
                      {basliklar[d.bolum.id]}
                    </AppText>
                  </View>
                ) : null}
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

        {/* BÖLÜM KAPILARI — dünyayla birlikte dikeyde kayar ama YATAYDA HEP EKRAN ORTASI.
            Önceden dünyanın içindeydi ve yolun o noktadaki x'ine göre ortalanıyordu; kamera
            başka yeri gösterince kart sola kaçıyordu (başkan, 13 Ağu). */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            transform: [{ translateY: Animated.add(kameraY, elle) }],
          }}>
          {bolumKapilari.map((k) => (
            <View
              key={k.key}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: k.p.y - 130,
                height: 260,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <View style={st.kapiCizgi} />
              <View style={st.kapiUc} />
              <View style={[st.kapiKart, { width: Math.round(ekranG * 0.56) }]}>
                <AppText variant="etiket" bold color="altinParlak" style={st.kapiUst}>
                  YENİ BÖLÜM
                </AppText>
                <View style={st.kapiSus}>
                  <AppText variant="etiket" color="altinParlak" style={st.kapiSusYildiz}>
                    ✦
                  </AppText>
                  <MaterialCommunityIcons name="scale-balance" size={15} color={Palette.altinParlak} />
                  <AppText variant="etiket" color="altinParlak" style={st.kapiSusYildiz}>
                    ✦
                  </AppText>
                </View>
                <AppText variant="baslik" bold color="beyaz" numberOfLines={3} style={st.kapiAd}>
                  {k.ad}
                </AppText>
                <AppText variant="kucuk" color="kartMetinIkincil" numberOfLines={1} style={st.kapiAlt}>
                  {k.alt}
                </AppText>
              </View>
              <View style={st.kapiUc} />
              <View style={st.kapiCizgi} />
            </View>
          ))}
        </Animated.View>
      </View>

    </>
  );
}

const st = StyleSheet.create({
  sahne: {
    flex: 1,
    minHeight: 320,
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
  kapiKart: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: 'rgba(9,18,28,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  kapiUst: { fontSize: 11, letterSpacing: 2.6, opacity: 0.95 },
  kapiSus: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 6, marginBottom: 8 },
  kapiSusYildiz: { fontSize: 10, opacity: 0.9 },
  kapiAd: { fontSize: 17, lineHeight: 22, letterSpacing: 0.3, textAlign: 'center' },
  kapiAlt: { fontSize: 12, marginTop: 7, opacity: 0.95 },
  kapiCizgi: { flex: 1, height: 1, backgroundColor: 'rgba(240,183,51,0.5)' },
  kapiUc: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(240,183,51,0.9)' },
  baslikRozet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 7,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(9,18,28,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(240,183,51,0.55)',
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  baslikNokta: { width: 5, height: 5, borderRadius: 3, backgroundColor: Palette.altinParlak },
  baslikYazi: { fontSize: 11.5, letterSpacing: 0.3 },
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
    marginBottom: Spacing.two,
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
