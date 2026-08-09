/**
 * Takdir Belgesi ALANI — belgeyi gösterir + İSİM ONAYINI yönetir.
 *
 * Belge ilk çıktığında bir kez "Belgende görünecek adın bu mu?" modalı açılır (Apple ile girenlerde
 * Apple'ın verdiği ad ön-dolu gelir; e-postada boş). Kullanıcı düzeltip/onaylayınca profiles'a yazılır
 * ve bir daha sorulmaz (belgeIsimOnayla). Böylece belgede hep DOĞRU + onaylı isim görünür ve isim
 * giriş akışında istenmediği için Apple Guideline 4/5.1.1(v) ile çakışmaz.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, Share, StyleSheet, TextInput, View } from 'react-native';

import { TakdirBelgesi } from '@/components/sicil/takdir-belgesi';
import { AppText } from '@/components/ui/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { profilGetir, profilKaydet } from '@/lib/auth';
import { useAuth } from '@/lib/auth-context';
import { belgeIsimOnayla, belgeIsimOnayliMi } from '@/lib/belge-isim';
import { useKisiselOzellik } from '@/lib/ozellik';

export function TakdirBelgeAlani({ kanunAd, tarih }: { kanunAd: string; tarih: string }) {
  const { kullanici } = useAuth();
  const [ad, setAd] = useState('');
  const [soyad, setSoyad] = useState('');
  const [onayGoster, setOnayGoster] = useState(false);
  const [hazir, setHazir] = useState(false);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  useEffect(() => {
    let iptal = false;
    void (async () => {
      const p = await profilGetir();
      if (iptal) return;
      let a = p?.ad ?? '';
      let s = p?.soyad ?? '';
      // Profil boşsa Apple'ın verdiği tam addan ön-doldur (son kelime = soyad).
      if (!a && !s && kullanici?.tamAd) {
        const parca = kullanici.tamAd.split(/\s+/);
        s = parca.length > 1 ? (parca.pop() ?? '') : '';
        a = parca.join(' ');
      }
      setAd(a);
      setSoyad(s);
      setOnayGoster(!(await belgeIsimOnayliMi()));
      setHazir(true);
    })();
    return () => {
      iptal = true;
    };
  }, [kullanici]);

  async function onayla() {
    setKaydediliyor(true);
    const adT = ad.trim();
    const soyadT = soyad.trim();
    if (adT || soyadT) {
      try {
        await profilKaydet({ ad: adT, soyad: soyadT });
      } catch {
        /* isim yazımı önemsiz — belge yine gösterilir */
      }
    }
    await belgeIsimOnayla();
    setAd(adT);
    setSoyad(soyadT);
    setKaydediliyor(false);
    setOnayGoster(false);
  }

  const tamAd = `${ad.trim()} ${soyad.trim()}`.trim();

  // GECE KARARI E2 (bayraklı): belgeye PAYLAŞ — açık dokunuş + "adın görünecek" onayı.
  const paylasVar = useKisiselOzellik('talim-mevzuata');
  function paylas() {
    const metin =
      `🎖️ TAKDİR BELGESİ\n\n${tamAd || 'Bir personel'}, "${kanunAd}" eğitimini ` +
      `başarıyla tamamlayarak takdir almaya hak kazanmıştır. (${tarih})\n\n` +
      'Mevzu JSPS — görsel hafıza teknikleriyle JSPS hazırlığı · https://mevzujsps.com';
    const gonder = () => void Share.share({ message: metin }).catch(() => {});
    if (tamAd) {
      Alert.alert('Paylaş', `Belgede adın görünecek: ${tamAd}. Paylaşılsın mı?`, [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Paylaş', onPress: gonder },
      ]);
    } else {
      gonder();
    }
  }

  return (
    <>
      <TakdirBelgesi kanunAd={kanunAd} tarih={tarih} isim={tamAd || null} />
      {paylasVar ? (
        <Pressable
          style={({ pressed }) => [styles.paylasBtn, pressed && styles.pressed]}
          onPress={paylas}
          accessibilityRole="button"
          accessibilityLabel="Takdir belgesini paylaş">
          <MaterialCommunityIcons name="share-variant" size={17} color={Palette.lacivert} />
          <AppText variant="kucuk" bold color="lacivert">
            Paylaş
          </AppText>
        </Pressable>
      ) : null}

      <Modal
        visible={hazir && onayGoster}
        transparent
        animationType="fade"
        onRequestClose={() => setOnayGoster(false)}>
        <View style={styles.perde}>
          <View style={styles.kutu}>
            <MaterialCommunityIcons name="medal-outline" size={40} color={Palette.altinKoyu} />
            <AppText variant="baslik" bold color="lacivert" style={styles.ortali}>
              Belgende adın nasıl yazılsın?
            </AppText>
            <AppText variant="kucuk" color="solukMetin" style={styles.ortali}>
              Takdir Belgende görünecek. Gerçek ad ve soyadını yazabilir ya da boş bırakabilirsin.
            </AppText>
            <View style={styles.girdiler}>
              <TextInput
                style={styles.girdi}
                value={ad}
                onChangeText={setAd}
                placeholder="Ad"
                placeholderTextColor={Palette.solukMetin}
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={40}
              />
              <TextInput
                style={styles.girdi}
                value={soyad}
                onChangeText={setSoyad}
                placeholder="Soyad"
                placeholderTextColor={Palette.solukMetin}
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={40}
              />
            </View>
            <Pressable
              style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
              disabled={kaydediliyor}
              onPress={() => void onayla()}>
              <AppText variant="govde" bold color="beyaz">
                {tamAd ? 'Onayla' : 'Boş bırak, devam et'}
              </AppText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  perde: {
    flex: 1,
    backgroundColor: 'rgba(11,31,58,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  kutu: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.l,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
  },
  ortali: {
    textAlign: 'center',
  },
  girdiler: {
    alignSelf: 'stretch',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  girdi: {
    backgroundColor: Palette.kremZemin,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.three,
    height: 52,
    fontSize: 16,
    color: Palette.anaMetin,
  },
  btn: {
    alignSelf: 'stretch',
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.m,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  pressed: {
    opacity: 0.85,
  },
  paylasBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    alignSelf: 'center',
    backgroundColor: Palette.altinSolukYuzey,
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    marginTop: Spacing.two,
  },
});
