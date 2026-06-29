import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { TakdirBelgesi } from '@/components/sicil/takdir-belgesi';
import { EmptyState } from '@/components/ui/empty-state';
import { CardFlowMaxWidth, Palette, Radius, Spacing } from '@/constants/theme';
import { ekleSinavSonucu, getCardsByLaw, kaydetPerformans } from '@/db/database';
import type { QueueCard } from '@/lib/queue';
import { degerlendirSicil } from '@/lib/sicil-servis';
import {
  eslesenKartIdleri,
  getSinavSorulari,
  type KartSoru,
  puanlaSinav,
  type SinavCevap,
} from '@/lib/sinav';
import { bugunISO } from '@/lib/srs';

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
  const { lawId } = useLocalSearchParams<{ lawId?: string }>();
  const lawIdNum = lawId != null && lawId !== '' ? Number(lawId) : null;
  const [sorular, setSorular] = useState<KartSoru[] | null>(null);
  const [lawAd, setLawAd] = useState<string | null>(null);
  const [hata, setHata] = useState(false);
  const [bos, setBos] = useState(false);
  const [index, setIndex] = useState(0);
  const [secilen, setSecilen] = useState<number | null>(null);
  const [cevaplar, setCevaplar] = useState<SinavCevap[]>([]);
  // O kanunun kartları (zayıf havuz eşleştirmesi için) — bir kez yüklenir, cache'lenir.
  const kartlarRef = useRef<QueueCard[] | null>(null);
  // Skor BİR KEZ kaydedilsin (bitiş ekranı yeniden render'larında tekrar yazılmasın).
  const kaydedildiRef = useRef(false);

  const yukle = useCallback(() => {
    setHata(false);
    setBos(false);
    setSorular(null);
    setIndex(0);
    setSecilen(null);
    setCevaplar([]);
    kartlarRef.current = null;
    kaydedildiRef.current = false;
    if (lawIdNum == null || Number.isNaN(lawIdNum)) {
      setHata(true);
      return;
    }
    const liste = getSinavSorulari(lawIdNum);
    if (liste.length === 0) {
      setBos(true);
      return;
    }
    setSorular(liste);
    setLawAd(null);
    // Zayıf havuz eşleştirmesi için kanunun kartlarını önden yükle (ateşle-unut).
    // Kart law_ad taşır → Takdir Belgesi için kanun adını buradan al.
    void getCardsByLaw(lawIdNum)
      .then((c) => {
        kartlarRef.current = c;
        if (c[0]?.law_ad) setLawAd(c[0].law_ad);
      })
      .catch(() => {});
  }, [lawIdNum]);

  useEffect(() => {
    yukle();
  }, [yukle]);

  /** YANLIŞ cevap → eşleşen kartları zayıf havuza sok (UI'yı bloklamaz). */
  async function zayifaDusur(soru: KartSoru) {
    try {
      let kartlar = kartlarRef.current;
      if (!kartlar && lawIdNum != null) {
        kartlar = await getCardsByLaw(lawIdNum);
        kartlarRef.current = kartlar;
      }
      if (!kartlar) return;
      const ids = eslesenKartIdleri(soru.kaynak, kartlar);
      for (const id of ids) {
        await kaydetPerformans(id, 'quiz', 'yanlis').catch(() => {});
      }
    } catch {
      // sessiz geç: zayıf havuz logu kritik değil, sınav akışını bozmamalı.
    }
  }

  function sec(i: number) {
    if (secilen !== null || !sorular) return; // soru zaten cevaplandı
    setSecilen(i);
    const soruO = sorular[index];
    if (i !== soruO.dogru) void zayifaDusur(soruO); // yalnız yanlışta logla
  }

  function sonraki() {
    if (secilen === null) return;
    setCevaplar((c) => [...c, { soruIndex: index, secilenIndex: secilen }]);
    setSecilen(null);
    setIndex((i) => i + 1);
  }

  const bitti = sorular !== null && index >= sorular.length;
  const aktif = sorular !== null && !bitti;
  const soru = aktif ? sorular[index] : null;

  // Sınav bitince skoru BİR KEZ kalıcı kaydet (kaydedildiRef guard; yukle'de sıfırlanır).
  // %100 ise: kayıttan SONRA sicil değerlendir → Takdir Belgesi kaydı düşer (idempotent).
  useEffect(() => {
    if (!bitti || !sorular || lawIdNum == null || kaydedildiRef.current) return;
    kaydedildiRef.current = true;
    const { dogru, toplam } = puanlaSinav(cevaplar, sorular);
    void (async () => {
      try {
        await ekleSinavSonucu(lawIdNum, dogru, toplam, bugunISO());
        if (toplam > 0 && dogru === toplam) await degerlendirSicil();
      } catch {
        // sessiz geç (skor/ödül kaydı başarısızsa sonuç ekranı yine görünsün)
      }
    })();
  }, [bitti, sorular, cevaplar, lawIdNum]);

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
          onTekrar={yukle}
          onBitir={() => router.back()}
        />
      ) : (
        <View style={styles.kolon}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${((index + 1) / sorular.length) * 100}%` }]} />
            </View>

            {soru!.kaynak ? (
              <AppText variant="etiket" bold color="altinKoyu">
                {soru!.kaynak}
              </AppText>
            ) : null}

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

          {/* Sonraki — yalnız cevaplandıktan sonra aktif */}
          <View style={styles.altBlok}>
            <Pressable
              disabled={secilen === null}
              style={({ pressed }) => [
                styles.sonraki,
                secilen === null && styles.sonrakiPasif,
                pressed && secilen !== null && styles.pressed,
              ]}
              onPress={sonraki}>
              <AppText variant="govde" color="beyaz" bold>
                {index + 1 >= sorular.length ? 'Sonucu gör' : 'Sonraki'}
              </AppText>
            </Pressable>
          </View>
        </View>
      )}
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

function Sonuc({
  cevaplar,
  sorular,
  lawAd,
  onTekrar,
  onBitir,
}: {
  cevaplar: SinavCevap[];
  sorular: KartSoru[];
  lawAd: string | null;
  onTekrar: () => void;
  onBitir: () => void;
}) {
  const { dogru, toplam, yuzde } = puanlaSinav(cevaplar, sorular);

  // %100 → TAKDİR BELGESİ (görsel sertifika); kayıt zaten sicil'e işlendi.
  if (yuzde === 100) {
    return (
      <ScrollView style={styles.kolon} contentContainerStyle={styles.sonucContent}>
        <AppText variant="altBaslik" bold color="altinKoyu" style={styles.tamIsabet}>
          🎖️ Tam isabet — {dogru}/{toplam}
        </AppText>
        <TakdirBelgesi kanunAd={lawAd ?? 'Bu kanun'} tarih={bugunISO()} />
        <View style={styles.sonucButonlar}>
          <Pressable
            style={({ pressed }) => [styles.sonucBtnIkincil, pressed && styles.pressed]}
            onPress={onTekrar}>
            <AppText variant="govde" bold color="lacivert">
              Tekrar çöz
            </AppText>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.sonucBtn, pressed && styles.pressed]}
            onPress={onBitir}>
            <AppText variant="govde" bold color="beyaz">
              Bitir
            </AppText>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  const basarili = yuzde >= 70;
  return (
    <View style={styles.kolon}>
      <EmptyState
        ikon={basarili ? 'trophy-outline' : 'school-outline'}
        ikonRenk={basarili ? 'altin' : 'solukMetin'}
        baslik={`Skorun: ${dogru}/${toplam}`}
        aciklama={`%${yuzde} doğru${basarili ? ' — tebrikler!' : ' — biraz daha çalış.'}`}
        buton={{ etiket: 'Tekrar çöz', onPress: onTekrar }}
        ikincilButon={{ etiket: 'Bitir', onPress: onBitir }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  sonraki: {
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.m,
    paddingVertical: Spacing.three,
    alignItems: 'center',
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
  sonucBtnIkincil: {
    flex: 1,
    borderColor: Palette.lacivert,
    borderWidth: 1.5,
    borderRadius: Radius.m,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
});
