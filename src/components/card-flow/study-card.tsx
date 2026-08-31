import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { GorselZoom } from '@/components/card-flow/gorsel-zoom';
import { AppText } from '@/components/ui/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';
import type { CardWithSrs } from '@/db/schema';
import { useImzaliTazele } from '@/hooks/use-imzali-tazele';
import { cozHazir, cozTemizle, gorselCoz } from '@/lib/gorsel-coz';
import { bozukIcerikSil } from '@/lib/indirme';
import { gorselBekliyorMu, gorselKaynak, indirilmisGorsel } from '@/lib/gorsel-kaynak';
import { imzaliUnut } from '@/lib/imzali-cache';
import { KART_GORSEL_YOLLARI } from '../../assets/kart-gorselleri';

/** Tek bir kart: görseli varsa tek kare görsel, yoksa 2x2 yer tutucu ızgara. */
export function StudyCard({
  card,
  onOran,
  onGorundu,
}: {
  card: CardWithSrs;
  /** Görselin DOĞAL oranı (genişlik/yükseklik) yüklenince bildirilir (kutu boyutu için). */
  onOran?: (oran: number) => void;
  /** Görsel ekranda görünür olunca (yüklendi VEYA hata) bildirilir → "Öğrendim" kilidi açılır. */
  onGorundu?: () => void;
}) {
  // Web imzalı modda URL arka planda gelir → gelince yeniden çiz (native'de no-op).
  useImzaliTazele();
  // İndirilmiş içerik ŞİFRELİ → çöz (data-URI). İndirilmemişse uzak/gömülü kaynak.
  const sifreliYol = indirilmisGorsel(card.gorsel_yolu);
  const [cozulmus, setCozulmus] = useState<string | null>(() =>
    sifreliYol ? (cozHazir(sifreliYol) ?? null) : null,
  );
  useEffect(() => {
    if (!sifreliYol) return;
    const hazir = cozHazir(sifreliYol);
    if (hazir) {
      setCozulmus(hazir);
      return;
    }
    setCozulmus(null);
    let iptal = false;
    gorselCoz(sifreliYol)
      .then((d) => !iptal && setCozulmus(d))
      .catch(() => !iptal && onGorundu?.()); // çözülemezse kilitlenip kalmasın
    return () => {
      iptal = true;
    };
  }, [sifreliYol, onGorundu]);

  // KENDİNİ ONARMA: indirilmiş kopya bozuksa (nadiren yarım/hatalı iniyor) görsel açılmaz ve
  // kart bomboş kalırdı. Yükleme hatasında yerel dosya atılır, kart UZAK kaynağa düşer,
  // dosya bir sonraki indirmede yeniden iner.
  const [yerelBozuk, setYerelBozuk] = useState(false);
  const gorsel =
    sifreliYol && !yerelBozuk
      ? cozulmus
        ? { uri: cozulmus }
        : undefined
      : gorselKaynak(card.gorsel_yolu);
  // Uzak görsel yüklenemezse sayılı yeniden deneme (31 Ağu). Kart değişince sıfırlanır.
  const [deneme, setDeneme] = useState(0);
  const [zoomAcik, setZoomAcik] = useState(false);
  // Forensic filigran artık SUNUCUDA görselin piksellerine basılıyor (gorsel Edge Function) →
  // client overlay kaldırıldı (gereksiz + bypass edilebilir; sunucununki cihaza zaten gömülü gelir).

  // Şifreli içerik henüz çözülmedi VEYA web imzalı URL yolda → "hazırlanıyor" bekleme kutusu
  // (Öğrendim kilitli kalır; placeholder ızgara YANLIŞ olur — görsel var, sadece yolda).
  if ((sifreliYol && !yerelBozuk && !cozulmus) || gorselBekliyorMu(card.gorsel_yolu)) {
    return (
      <View style={[styles.card, styles.cardGorsel, styles.cozuluyor]}>
        <ActivityIndicator size="large" color={Palette.altinKoyu} />
        <AppText variant="govde" bold color="lacivert" style={styles.cozuluyorMetin}>
          Görsel hazırlanıyor…
        </AppText>
        <AppText variant="kucuk" color="solukMetin" style={styles.cozuluyorAlt}>
          İlk açılışta görseller cihazında güvenle hazırlanıyor (şifre çözülüyor). Bu işlem
          ilk seferde biraz sürebilir — bozuk değil, lütfen bekle. 🔒
        </AppText>
      </View>
    );
  }

  // Görselli mod: kart kendi künyesini içerir → uygulama şeritleri gösterilmez.
  // Görsele dokununca tam ekran zoom overlay açılır (ses çalıyorsa kesilmez — ekran unmount olmaz).
  if (gorsel !== undefined) {
    return (
      <>
        <Pressable style={[styles.card, styles.cardGorsel]} onPress={() => setZoomAcik(true)}>
          {/* Kutu artık GÖRSELİN DOĞAL ORANINDA (akis'te gorselBoyut hesaplar) → görsel
              kutuyu tam doldurur: iç kenar boşluğu (letterbox) ya da kırpma YOK. */}
          {/* recyclingKey: kart değişince ESKİ görsel TUTULMAZ (stale yok) → decode'a kadar
              placeholder (kart zemini). cachePolicy: bir kez yüklenen tekrar decode olmaz. */}
          <Image
            source={gorsel}
            style={styles.gorsel}
            contentFit="contain"
            recyclingKey={String(card.id) + ":" + deneme}
            cachePolicy="memory-disk"
            transition={150}
            // Görsel yüklenince GERÇEK boyut → doğal oran (web+native aynı; crash yok).
            onLoad={(e) => {
              const { width, height } = e.source;
              if (width > 0 && height > 0) onOran?.(width / height);
              onGorundu?.(); // görsel ekranda → "Öğrendim" kilidi açılsın
            }}
            // Yüklenemezse: yerel (şifreli) kopya bozuksa at + uzak kaynağa düş; yine de
            // "Öğrendim" kilidini açık bırak ki kullanıcı takılmasın.
            onError={() => {
              if (sifreliYol && !yerelBozuk) {
                cozTemizle(sifreliYol);
                void bozukIcerikSil(sifreliYol);
                setYerelBozuk(true);
                onGorundu?.();
                return;
              }
              // 31 Ağu 2026 (Ömer Faruk: "Görsel görünmüyor") — İNDİRMEDEN çalışan kullanıcıda
              // burada yapacak bir şey yoktu: görsel bir kez yüklenemeyince kart SONSUZA KADAR
              // boş kalıyordu (elde geçerli görünen bir URL var, yeniden denenmiyor). Adam boş
              // karta bakıp 10 dakika bekledi. Artık imzalı URL unutulup TAZESİ alınıyor ve
              // görsel en fazla 2 kez daha deneniyor; sonsuz döngü yok.
              const yol = KART_GORSEL_YOLLARI[card.gorsel_yolu ?? ''];
              if (yol && deneme < 2) {
                imzaliUnut(yol);
                setDeneme((n) => n + 1);
                return; // kilidi açma: görsel hâlâ gelebilir
              }
              onGorundu?.();
            }}
          />
        </Pressable>
        <GorselZoom gorsel={gorsel} gorunur={zoomAcik} onKapat={() => setZoomAcik(false)} />
      </>
    );
  }

  // Yer tutucu mod (görselsiz kartlar için fallback).
  return (
    <View style={styles.card}>
      {/* Kırmızı başlık şeridi */}
      <View style={styles.baslikSerit}>
        <AppText variant="altBaslik" color="beyaz" bold>
          {card.baslik}
        </AppText>
      </View>

      {/* 2x2 kare panel ızgarası (gerçek karikatür sonra gelecek) */}
      <View style={styles.izgara}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.panel}>
            <MaterialCommunityIcons name="image-outline" size={36} color={Palette.solukMetin} />
            <AppText variant="etiket" color="solukMetin">
              Panel {i + 1}
            </AppText>
          </View>
        ))}
      </View>

      {/* Lacivert künye şeridi */}
      <View style={styles.kunye}>
        <AppText variant="kucuk" color="beyaz" bold>
          {card.madde_no}
        </AppText>
        {card.blok === 'müşterek' ? (
          <View style={styles.rozet}>
            <AppText variant="etiket" color="lacivert" bold>
              Müşterek
            </AppText>
          </View>
        ) : (
          <AppText variant="etiket" color="kenarlik">
            {card.law_ad}
          </AppText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    overflow: 'hidden',
  },
  // Görselli kart: saran kutu (gorselSar) doğal oranda sabit ölçü verir → kart o kutuyu
  // tam doldurur (yer tutucu modu bu stili almaz, doğal yükseklikte kalır).
  cardGorsel: {
    height: '100%',
  },
  cozuluyor: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.five,
  },
  cozuluyorMetin: {
    marginTop: Spacing.one,
  },
  cozuluyorAlt: {
    textAlign: 'center',
    lineHeight: 18,
  },
  gorsel: {
    // Kutu görselin doğal oranında → görsel kutuyu tam doldurur (boşluk/kırpma yok).
    width: '100%',
    height: '100%',
    backgroundColor: Palette.kremZemin, // decode'a kadar nötr placeholder (stale görsel değil)
  },
  baslikSerit: {
    backgroundColor: Palette.kirmizi,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  izgara: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.two,
    gap: Spacing.two,
  },
  panel: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: Palette.ten,
    borderRadius: Radius.s,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  kunye: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.lacivert,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  rozet: {
    backgroundColor: Palette.altin,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.s,
  },
});
