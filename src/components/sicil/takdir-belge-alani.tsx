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
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { TakdirBelgesi } from '@/components/sicil/takdir-belgesi';
import { AppText } from '@/components/ui/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { profilGetir, profilKaydet } from '@/lib/auth';
import { useAuth } from '@/lib/auth-context';
import { belgeIsimOnayla, belgeIsimOnayliMi } from '@/lib/belge-isim';

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

  return (
    <>
      <TakdirBelgesi kanunAd={kanunAd} tarih={tarih} isim={tamAd || null} />

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
});
