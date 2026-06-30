import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { GorselZoom } from '@/components/card-flow/gorsel-zoom';
import { Watermark } from '@/components/card-flow/watermark';
import { AppText } from '@/components/ui/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';
import type { CardWithSrs } from '@/db/schema';
import { useCihazKimlik } from '@/hooks/use-cihaz-kimlik';
import { useAuth } from '@/lib/auth-context';
import { cozHazir, gorselCoz } from '@/lib/gorsel-coz';
import { gorselKaynak, indirilmisGorsel } from '@/lib/gorsel-kaynak';
import { bugunISO } from '@/lib/srs';

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

  const gorsel = sifreliYol ? (cozulmus ? { uri: cozulmus } : undefined) : gorselKaynak(card.gorsel_yolu);
  const { kullanici } = useAuth();
  const { kimlik } = useCihazKimlik();
  const [zoomAcik, setZoomAcik] = useState(false);
  // Forensic filigran: ÖNCELİK kullanıcı e-postası (sızıntı HESABA kadar izlenir); yoksa cihaz
  // kimliği (girişsiz fallback). Aynı metin hem kartta hem tam ekran zoom overlay'inde.
  const damga = kullanici?.email ?? kimlik;
  const filigranMetin = damga ? `JSPS • ${damga} • ${bugunISO()}` : null;
  const filigran = filigranMetin ? <Watermark metin={filigranMetin} /> : null;

  // Şifreli içerik henüz çözülmedi → "çözülüyor" bekleme kutusu (Öğrendim kilitli kalır).
  if (sifreliYol && !cozulmus) {
    return (
      <View style={[styles.card, styles.cardGorsel, styles.cozuluyor]}>
        <ActivityIndicator color={Palette.altinKoyu} />
        <AppText variant="kucuk" color="solukMetin" style={styles.cozuluyorMetin}>
          Görsel çözülüyor…
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
            recyclingKey={String(card.id)}
            cachePolicy="memory-disk"
            transition={150}
            // Görsel yüklenince GERÇEK boyut → doğal oran (web+native aynı; crash yok).
            onLoad={(e) => {
              const { width, height } = e.source;
              if (width > 0 && height > 0) onOran?.(width / height);
              onGorundu?.(); // görsel ekranda → "Öğrendim" kilidi açılsın
            }}
            // Yüklenemese bile kilitlenip kalmasın (görmeden öğrendim engeli soft-lock olmasın).
            onError={() => onGorundu?.()}
          />
          {filigran}
        </Pressable>
        <GorselZoom
          gorsel={gorsel}
          gorunur={zoomAcik}
          onKapat={() => setZoomAcik(false)}
          filigranMetin={filigranMetin}
        />
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
      {filigran}
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
  },
  cozuluyorMetin: {
    marginTop: Spacing.one,
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
