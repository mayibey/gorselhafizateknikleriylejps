import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { useKisiselOzellik } from '@/lib/ozellik';
import { TELEGRAM_BOT, telegramKodUret } from '@/lib/telegram-kod';

/** Telegram'a Bağlan — kendi hesabın için 6 haneli kod üretir; kullanıcı bunu bota verip premium/rütbe erişimini bağlar. */
export default function TelegramBaglanScreen() {
  const router = useRouter();
  const gece = useKisiselOzellik('talim-mevzuata');
  const { kullanici, hazir } = useAuth();
  const [kod, setKod] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState(false);

  const uret = useCallback(async () => {
    setYukleniyor(true);
    setHata(false);
    const k = await telegramKodUret();
    if (k) setKod(k);
    else setHata(true);
    setYukleniyor(false);
  }, []);

  useEffect(() => {
    if (hazir && kullanici) void uret();
  }, [hazir, kullanici, uret]);

  const telegramAc = () => {
    const url = kod ? `https://t.me/${TELEGRAM_BOT}?start=${kod}` : `https://t.me/${TELEGRAM_BOT}`;
    void Linking.openURL(url);
  };

  return (
    <Screen title="Telegram'a Bağlan" onGeri={() => router.back()} koyu={gece} kompaktBaslik={gece}>
      <AppText variant="govde" color={gece ? 'beyaz' : 'anaMetin'} style={styles.aciklama}>
        Telegram topluluğumuzdaki botta hesabını doğrula: premium isen Soru-Cevap'ta sınırsız soru
        sorabilir, rütbene özel gruba katılabilirsin.
      </AppText>

      {!hazir ? null : !kullanici ? (
        <View style={[styles.kart, gece && styles.kartGece]}>
          <AppText variant="govde" color={gece ? 'beyaz' : 'anaMetin'}>Önce giriş yapmalısın komutan.</AppText>
          <Pressable style={[styles.btn, gece && styles.btnGece]} onPress={() => router.push('/giris')}>
            <AppText variant="govde" color="beyaz" bold>Giriş Yap</AppText>
          </Pressable>
        </View>
      ) : (
        <View style={[styles.kart, gece && styles.kartGece]}>
          <AppText variant="etiket" color={gece ? 'kartMetinIkincil' : 'solukMetin'} bold>BAĞLANMA KODUN</AppText>
          {yukleniyor ? (
            <ActivityIndicator color={Palette.altin} style={{ marginVertical: Spacing.three }} />
          ) : hata ? (
            <AppText variant="govde" color={gece ? 'kirmiziParlak' : 'kirmizi'}>Kod üretilemedi. İnternetini kontrol edip tekrar dene.</AppText>
          ) : (
            <AppText variant="dev" style={[styles.kod, gece && styles.kodGece]}>{kod ?? '——————'}</AppText>
          )}

          <AppText variant="kucuk" color={gece ? 'kartMetinIkincil' : 'solukMetin'} style={styles.adim}>
            1) Aşağıdaki butonla Telegram'da botu aç (kod otomatik gider){'\n'}
            2) Açılmazsa botta şunu yaz: /baglan {kod ?? 'KOD'}
          </AppText>

          <Pressable style={[styles.btn, gece && styles.btnGece]} onPress={telegramAc}>
            <AppText variant="govde" color="beyaz" bold>Telegram'da Bağlan</AppText>
          </Pressable>
          <Pressable style={styles.btnIkincil} onPress={uret} disabled={yukleniyor}>
            <AppText variant="kucuk" color={gece ? 'altinParlak' : 'altinKoyu'} bold>Yeni Kod Üret</AppText>
          </Pressable>
        </View>
      )}

      <AppText variant="kucuk" color={gece ? 'kartMetinIkincil' : 'solukMetin'} style={styles.not}>
        Kod tek kullanımlıktır ve 1 saat geçerlidir. Rütbeni uygulamadan değiştiremezsin; gruplar rütbene göre ayrılır.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  aciklama: { marginBottom: Spacing.three },
  kart: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.four,
    gap: Spacing.two,
    alignItems: 'center',
  },
  kod: { letterSpacing: 6, color: Palette.lacivert, marginVertical: Spacing.two },
  adim: { textAlign: 'center', lineHeight: 20 },
  btn: {
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.m,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  btnIkincil: { paddingVertical: Spacing.two, alignItems: 'center' },
  not: { marginTop: Spacing.three, textAlign: 'center', lineHeight: 18 },
  // Gece dili (bayraklı)
  kartGece: {
    backgroundColor: 'rgba(3,47,69,0.88)',
    borderColor: 'rgba(126,205,218,0.5)',
  },
  kodGece: { color: Palette.altinParlak },
  btnGece: {
    backgroundColor: 'rgba(3,40,56,0.9)',
    borderWidth: 1,
    borderColor: '#F3C24A',
  },
});
