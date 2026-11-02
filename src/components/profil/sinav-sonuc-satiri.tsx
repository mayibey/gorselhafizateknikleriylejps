import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SinavSonucSor } from '@/components/profil/sinav-sonuc-sor';
import { AppText } from '@/components/ui/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { useKisiselOzellik } from '@/lib/ozellik';
import { puanYaz, type SinavSonucum, sinavSonucumuGetir } from '@/lib/sinav-sonuc';

/**
 * EVSAF "SINAV SONUCUM" SATIRI (2 Kas 2026, başkan): açılıştaki sınav sonucu cevabını sonradan
 * düzeltmek için. Yalnız cevap vermiş hesapta ve 'sinav-sonuc-sor' bayrağı açıkken görünür.
 * Dokununca aynı ekran önceki cevapla dolu açılır; kayıt üstüne yazılır (RPC upsert).
 */
export function SinavSonucSatiri({ koyu = false }: { koyu?: boolean }) {
  const acik = useKisiselOzellik('sinav-sonuc-sor');
  const [kayit, setKayit] = useState<SinavSonucum | null>(null);
  const [duzenle, setDuzenle] = useState(false);

  const yukle = useCallback(() => {
    void sinavSonucumuGetir().then(setKayit);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (acik) yukle();
    }, [acik, yukle]),
  );

  if (!acik || !kayit) return null;

  const ozet = kayit.girmedi ? 'Sınava girmedim' : kayit.puan != null ? `${puanYaz(kayit.puan)} puan` : '—';

  return (
    <>
      <Pressable
        onPress={() => setDuzenle(true)}
        style={({ pressed }) => [styles.kart, koyu && styles.kartGece, pressed && styles.basili]}
        accessibilityRole="button"
        accessibilityLabel={`JSPS sınav sonucum: ${ozet}. Düzenle`}>
        <View style={[styles.ikon, koyu && styles.ikonGece]}>
          <MaterialCommunityIcons
            name="clipboard-check-outline"
            size={22}
            color={koyu ? Palette.altinParlak : Palette.lacivert}
          />
        </View>
        <View style={styles.metin}>
          <AppText variant="govde" bold color={koyu ? 'beyaz' : 'anaMetin'}>
            JSPS sonucum: {ozet}
          </AppText>
          <AppText variant="etiket" color={koyu ? 'kartMetinIkincil' : 'solukMetin'}>
            10 Ekim 2026 · Düzenle
          </AppText>
        </View>
        <MaterialCommunityIcons
          name="pencil-outline"
          size={20}
          color={koyu ? Palette.altinParlak : Palette.solukMetin}
        />
      </Pressable>
      <Modal visible={duzenle} animationType="slide" onRequestClose={() => setDuzenle(false)}>
        <SafeAreaProvider>
          <SinavSonucSor
            duzenleme
            ilkRutbe={kayit.rutbe}
            ilkBrans={kayit.brans}
            ilkGirmedi={kayit.girmedi}
            ilkPuan={kayit.puan}
            onVazgec={() => setDuzenle(false)}
            onTamam={() => {
              setDuzenle(false);
              yukle();
            }}
          />
        </SafeAreaProvider>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  kart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
  },
  kartGece: {
    backgroundColor: 'rgba(3,47,69,0.88)',
    borderColor: 'rgba(126,205,218,0.5)',
  },
  ikon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.altinSolukYuzey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ikonGece: {
    backgroundColor: 'rgba(3,40,56,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(126,205,218,0.3)',
  },
  metin: { flex: 1, gap: 1 },
  basili: { opacity: 0.85 },
});
