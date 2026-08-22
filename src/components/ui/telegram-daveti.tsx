/**
 * TELEGRAM DAVETİ — "ödül anı" kartı (başkan seçimi, 23 Ağu 2026).
 *
 * NEREDE: kart akışı tamamlandığında, "Bu turu tamamladın" ekranının altında.
 * NEDEN BURADA: kullanıcı tam o anda işini bitirmiş ve iyi hissediyor — davete en açık
 * olduğu an orası. Ekranın başına koysaydık çalışmayı böler, dipte de kimse görmezdi.
 *
 * NAZİK OLSUN: ayda EN FAZLA BİR KEZ çıkar (AsyncStorage damgası) ve kullanıcı "katıl"a
 * basarsa BİR DAHA HİÇ çıkmaz. Reklam gibi her tur suratına çarpmasın.
 */
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { TELEGRAM_GRUP } from '@/components/ui/telegram-katil';
import { Palette, Radius, Spacing } from '@/constants/theme';

const ANAHTAR = 'telegram-davet';        // { son: epoch, katildi: true }
const ARALIK_MS = 30 * 24 * 60 * 60 * 1000; // ayda bir

export function TelegramDaveti() {
  const [goster, setGoster] = useState(false);

  useEffect(() => {
    let yasiyor = true;
    AsyncStorage.getItem(ANAHTAR)
      .then((ham) => {
        if (!yasiyor) return;
        const d = ham ? (JSON.parse(ham) as { son?: number; katildi?: boolean }) : {};
        if (d.katildi) return;                                  // katılmış → bir daha sorma
        if (d.son && Date.now() - d.son < ARALIK_MS) return;     // bu ay çıkmış → sus
        setGoster(true);
        void AsyncStorage.setItem(ANAHTAR, JSON.stringify({ ...d, son: Date.now() }));
      })
      .catch(() => {});
    return () => {
      yasiyor = false;
    };
  }, []);

  if (!goster) return null;

  return (
    <View style={st.kart}>
      <View style={st.satir}>
        <FontAwesome name="telegram" size={22} color={Palette.altin} />
        <View style={st.metin}>
          <AppText variant="kucuk" bold color="lacivert">
            Yalnız çalışma — kışlaya katıl
          </AppText>
          <AppText variant="etiket" color="solukMetin">
            Telegram grubumuzda günün sorusu, takıldığın maddeyi sorabileceğin arkadaşlar ve
            aynı sınava hazırlanan yüzlerce kişi var.
          </AppText>
        </View>
      </View>
      <Pressable
        onPress={() => {
          void AsyncStorage.setItem(ANAHTAR, JSON.stringify({ son: Date.now(), katildi: true }));
          setGoster(false);
          Linking.openURL(TELEGRAM_GRUP).catch(() => {});
        }}
        style={({ pressed }) => [st.btn, pressed && st.basili]}
        accessibilityRole="link"
        accessibilityLabel="Telegram grubuna katıl">
        <FontAwesome name="telegram" size={15} color={Palette.beyaz} />
        <AppText variant="kucuk" bold color="beyaz">
          KATIL
        </AppText>
      </Pressable>
    </View>
  );
}

const st = StyleSheet.create({
  kart: {
    marginTop: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.l,
    backgroundColor: Palette.kartKremi,
    borderWidth: 1,
    borderColor: Palette.kenarlik,
    gap: Spacing.two,
    width: '100%',
    maxWidth: 460,
  },
  satir: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' },
  metin: { flex: 1, gap: 2 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.m,
    paddingVertical: 10,
  },
  basili: { opacity: 0.75 },
});
