/**
 * İNDİRME KAPISI — "çalışmaya başlamadan önce bu kanun inmiş mi?" (başkan, 23 Ağu 2026).
 *
 * NEDEN: içerik gömülü değil; kanun indirilmemişse kart görselleri ve sesleri TEK TEK
 * sunucudan akıtılıyor. Bu hem sesin kesilmesine hem (hızlı kart geçişinde) donmaya yol
 * açıyordu. Günün Maddesi ve Arama'da bu kapı ZATEN vardı; Mevzuat'ın "Çalış" düğmesinde
 * ve Patika'da YOKTU — asıl giriş noktaları onlar. Burada ortak hâle getirildi.
 *
 * Kullanım:
 *   const { kapidanGec, IndirModal } = useIndirKapisi();
 *   <Pressable onPress={() => kapidanGec(law.id, lawAdi, () => router.push(...))} />
 *   ...
 *   <IndirModal />
 *
 * Davranış: inmişse doğrudan açar. İnmemişse boyutu söyleyip sorar —
 * "İndir ve aç" (yüzdeli modal, bitince açar) · "İndirmeden devam" (eski akış, akıtarak).
 * İndirme desteklenmiyorsa/uzak içerik kapalıysa hiç sormaz, doğrudan açar.
 */
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { LAW_KLASOR } from '@/db/seed';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { ICERIK_TABANI } from '@/constants/config';
import {
  boyutMetni,
  indirmeDestekli,
  indirmeDurumuAl,
  indirmeDinle,
  kanunIndirBaslat,
  kanunIndirilmisMi,
  kanunTahminiBoyut,
} from '@/lib/indirme';

type Durum = 'kapali' | 'iniyor' | 'hata';

export function useIndirKapisi() {
  const [durum, setDurum] = useState<Durum>('kapali');
  const [yuzde, setYuzde] = useState(0);
  const [ad, setAd] = useState('');
  // Kullanıcı "arka planda indir" derse niyet düşer; indirme bitince ekran AÇILMAZ.
  const niyetRef = useRef<(() => void) | null>(null);
  const klasorRef = useRef<string>('');

  const indirVeAc = useCallback((klasor: string, lawAdi: string, ac: () => void) => {
    niyetRef.current = ac;
    klasorRef.current = klasor;
    setAd(lawAdi);
    setYuzde(indirmeDurumuAl(klasor)?.yuzde ?? 0);
    setDurum('iniyor');
    const birak = indirmeDinle(klasor, () => setYuzde(indirmeDurumuAl(klasor)?.yuzde ?? 0));
    kanunIndirBaslat(klasor).then(
      () => {
        birak();
        const devam = niyetRef.current;
        niyetRef.current = null;
        setDurum('kapali');
        devam?.();
      },
      () => {
        birak();
        if (niyetRef.current) setDurum('hata');
      },
    );
  }, []);

  /** Kanun inmemişse sor; inmişse (ya da indirme desteklenmiyorsa) doğrudan aç. */
  const kapidanGec = useCallback(
    (lawId: number, lawAdi: string, ac: () => void) => {
      const klasor = LAW_KLASOR[lawId];
      if (!klasor || !indirmeDestekli || !ICERIK_TABANI || kanunIndirilmisMi(klasor)) {
        ac();
        return;
      }
      const boyut = boyutMetni(kanunTahminiBoyut(klasor));
      Alert.alert(
        'Bu kanun henüz inmedi',
        `${lawAdi} içeriği (görseller + sesli anlatım, ${boyut}) telefonunda yok.\n\n`
          + 'İndirirsen kartlar anında açılır, sesler kesilmez ve internetsiz de çalışırsın. '
          + 'İndirmeden de çalışabilirsin ama her kart için bağlantı gerekir.',
        [
          { text: 'İndirmeden devam', style: 'cancel', onPress: ac },
          { text: `İndir (${boyut})`, onPress: () => indirVeAc(klasor, lawAdi, ac) },
        ],
      );
    },
    [indirVeAc],
  );

  const kapat = useCallback(() => {
    niyetRef.current = null; // indirme arka planda sürer, ekran açılmaz
    setDurum('kapali');
  }, []);

  const IndirModal = useCallback(
    () => (
      <Modal visible={durum !== 'kapali'} transparent animationType="fade" onRequestClose={kapat}>
        <View style={st.perde}>
          <View style={st.kutu}>
            {durum === 'hata' ? (
              <>
                <AppText variant="govde" bold color="kirmizi" style={st.ortali}>
                  İndirme tamamlanamadı
                </AppText>
                <AppText variant="kucuk" color="solukMetin" style={st.ortali}>
                  Bağlantını kontrol edip tekrar dene. İndirmeden de çalışabilirsin.
                </AppText>
                <Pressable
                  style={({ pressed }) => [st.btn, pressed && st.basili]}
                  onPress={() => indirVeAc(klasorRef.current, ad, niyetRef.current ?? (() => {}))}>
                  <AppText variant="kucuk" bold color="beyaz">Tekrar dene</AppText>
                </Pressable>
                <Pressable style={({ pressed }) => [st.btnIkincil, pressed && st.basili]} onPress={kapat}>
                  <AppText variant="kucuk" bold color="lacivert">Kapat</AppText>
                </Pressable>
              </>
            ) : (
              <>
                <ActivityIndicator size="large" color={Palette.lacivert} />
                <AppText variant="govde" bold color="lacivert" style={st.ortali}>
                  İndiriliyor… %{yuzde}
                </AppText>
                <AppText variant="kucuk" color="solukMetin" numberOfLines={2} style={st.ortali}>
                  {ad} indiriliyor. Bitince çalışma ekranı otomatik açılacak.
                </AppText>
                <View style={st.bar}>
                  <View style={[st.barDolu, { width: `${yuzde}%` }]} />
                </View>
                <Pressable style={({ pressed }) => [st.btnIkincil, pressed && st.basili]} onPress={kapat}>
                  <AppText variant="kucuk" bold color="lacivert">Arka planda indir</AppText>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    ),
    [durum, yuzde, ad, kapat, indirVeAc],
  );

  return { kapidanGec, IndirModal };
}

const st = StyleSheet.create({
  perde: { flex: 1, backgroundColor: 'rgba(11,31,58,0.55)', alignItems: 'center', justifyContent: 'center', padding: Spacing.three },
  kutu: { width: '100%', maxWidth: 360, backgroundColor: Palette.kartKremi, borderRadius: Radius.l, padding: Spacing.three, gap: Spacing.two },
  ortali: { textAlign: 'center' },
  bar: { height: 8, borderRadius: 4, backgroundColor: Palette.ilerlemeTrack, overflow: 'hidden' },
  barDolu: { height: '100%', backgroundColor: Palette.altin },
  btn: { backgroundColor: Palette.lacivert, borderRadius: Radius.m, paddingVertical: 12, alignItems: 'center' },
  btnIkincil: { paddingVertical: 10, alignItems: 'center' },
  basili: { opacity: 0.75 },
});
