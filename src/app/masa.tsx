import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { AppText } from '@/components/ui/app-text';
import { Spacing } from '@/constants/theme';
import { imzaliUrller } from '@/lib/imzali-url';

/**
 * HAREKÂT MASASI (başkan, 29 Eyl 2026: "bunu uygulamaya ekle, sadece ben göreyim").
 * Müşterek + MEBS çalışma masası ve EKSİK TARAMASI (Hızlı Check-up / Detaylı Röntgen → sınav reçetesi).
 * Sayfa sunucudan gelir (`icerik/tarama/masa.html`, imzalı URL) → OTA'sız güncellenir; son inen kopya
 * cihazda saklanır, bağlantı yoksa onunla açılır. İlerleme sayfanın kendi localStorage'ında
 * (baseUrl sabit olduğu için kalıcı). Giriş Karargâh'ta `eksik-tarama` kişisel bayrağıyla açılır.
 */
const YOL = 'tarama/masa.html';
const ONBELLEK = FileSystem.documentDirectory ? `${FileSystem.documentDirectory}jsps/masa.html` : null;
const ZEMIN = '#06131F';

export default function MasaEkrani() {
  const router = useRouter();
  const [html, setHtml] = useState<string | null>(null);
  const [hata, setHata] = useState(false);

  useEffect(() => {
    let yasiyor = true;
    void (async () => {
      let yerel: string | null = null;
      try {
        if (ONBELLEK && (await FileSystem.getInfoAsync(ONBELLEK)).exists) yerel = await FileSystem.readAsStringAsync(ONBELLEK);
      } catch {
        /* önbellek yok */
      }
      try {
        const url = (await imzaliUrller([YOL])).get(YOL);
        if (!url) throw new Error('url yok');
        const cevap = await fetch(url);
        if (!cevap.ok) throw new Error(String(cevap.status));
        const metin = await cevap.text();
        if (metin.length < 100_000 || !metin.includes('Harekât')) throw new Error('bozuk');
        if (yasiyor) setHtml(metin);
        if (ONBELLEK) {
          await FileSystem.makeDirectoryAsync(ONBELLEK.replace(/masa\.html$/, ''), { intermediates: true }).catch(() => {});
          await FileSystem.writeAsStringAsync(ONBELLEK, metin).catch(() => {});
        }
      } catch {
        if (!yasiyor) return;
        if (yerel) setHtml(yerel);
        else setHata(true);
      }
    })();
    return () => {
      yasiyor = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.kap} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <View style={styles.ust}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Geri">
          <MaterialCommunityIcons name="arrow-left" size={24} color="#ECE6D8" />
        </Pressable>
        <AppText variant="govde" bold style={styles.baslik}>
          Harekât Masası
        </AppText>
      </View>
      {html ? (
        <WebView
          style={styles.web}
          source={{ html, baseUrl: 'https://mevzujsps.com/masa' }}
          originWhitelist={['*']}
          domStorageEnabled
          javaScriptEnabled
          setSupportMultipleWindows={false}
        />
      ) : (
        <View style={styles.orta}>
          {hata ? (
            <AppText variant="kucuk" style={styles.hata}>
              Masa yüklenemedi. İnternet bağlantını kontrol edip tekrar dene.
            </AppText>
          ) : (
            <ActivityIndicator color="#D9B24A" />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  kap: { flex: 1, backgroundColor: ZEMIN },
  ust: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingHorizontal: Spacing.four, paddingVertical: Spacing.two },
  baslik: { color: '#ECE6D8' },
  web: { flex: 1, backgroundColor: ZEMIN },
  orta: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  hata: { color: '#93A7B6', textAlign: 'center' },
});
