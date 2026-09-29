import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { AppText } from '@/components/ui/app-text';
import { Spacing } from '@/constants/theme';
import { imzaliUrller } from '@/lib/imzali-url';
import { supabase } from '@/lib/supabase';

/**
 * HAREKÂT MERKEZİ (eski adı Harekât Masası; başkan, 29 Eyl 2026: "bunu uygulamaya ekle, sadece ben göreyim").
 * EKSİK TARAMASI: Röntgen (kanun bazlı) / Check-up (madde bazlı) → kayıtlı Altın Özet.
 * Sayfa sunucudan gelir (`icerik/tarama/masa.html`, imzalı URL) → OTA'sız güncellenir; son inen kopya
 * cihazda saklanır, bağlantı yoksa onunla açılır. Giriş Karargâh'ta `eksik-tarama` kişisel bayrağıyla açılır.
 *
 * İLERLEME (29 Eyl, başkan: "yayınladığımızda kullanıcıların ilerlemelerini kaydetmen lazım"):
 * sunucuda `merkez_ilerleme` (user_id → veri jsonb, RLS: herkes yalnız kendi satırı). Açılışta satır okunur ve
 * sayfaya `window.MERKEZ_KAYIT` ile verilir; sayfa her değişiklikte postMessage({tip:'kaydet', veri}) yollar,
 * biz upsert ederiz. Arka plana geçince sayfadan son hâli isteriz (window.merkezFlush).
 */
const YOL = 'tarama/masa.html';
const ONBELLEK = FileSystem.documentDirectory ? `${FileSystem.documentDirectory}jsps/masa.html` : null;
const ZEMIN = '#043C54';

async function kullaniciId(): Promise<string | null> {
  if (!supabase) return null;
  for (let i = 0; i < 6; i++) {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user?.id) return data.session.user.id;
    } catch {
      /* oturum henüz yok */
    }
    await new Promise((c) => setTimeout(c, 250));
  }
  return null;
}

export default function MasaEkrani() {
  const router = useRouter();
  const web = useRef<WebView>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [kayit, setKayit] = useState<string | null>(null); // JSON (sunucudaki ilerleme) — '{}' = yok
  const [hata, setHata] = useState(false);
  const uid = useRef<string | null>(null);

  useEffect(() => {
    let yasiyor = true;
    void (async () => {
      // 1) sunucudaki ilerleme (sayfadan ÖNCE hazır olmalı: açılışta gömülür)
      try {
        uid.current = await kullaniciId();
        if (uid.current && supabase) {
          const { data } = await supabase.from('merkez_ilerleme').select('veri').eq('user_id', uid.current).maybeSingle();
          if (yasiyor) setKayit(JSON.stringify((data as { veri?: unknown } | null)?.veri ?? {}));
        } else if (yasiyor) setKayit('{}');
      } catch {
        if (yasiyor) setKayit('{}');
      }
      // 2) sayfa
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
    // arka plana geçerken sayfadaki son hâli iste
    const abone = AppState.addEventListener('change', (d) => {
      if (d !== 'active') web.current?.injectJavaScript('window.merkezFlush && window.merkezFlush(); true;');
    });
    return () => {
      yasiyor = false;
      abone.remove();
    };
  }, []);

  const mesaj = (e: WebViewMessageEvent) => {
    try {
      const m = JSON.parse(e.nativeEvent.data) as { tip?: string; veri?: unknown };
      if (m.tip !== 'kaydet' || !m.veri || !uid.current || !supabase) return;
      void supabase
        .from('merkez_ilerleme')
        .upsert({ user_id: uid.current, veri: m.veri, guncelleme: new Date().toISOString() }, { onConflict: 'user_id' })
        .then(() => {});
    } catch {
      /* bozuk mesaj */
    }
  };

  const hazir = html && kayit !== null;
  return (
    <SafeAreaView style={styles.kap} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <View style={styles.ust}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Geri">
          <MaterialCommunityIcons name="arrow-left" size={24} color="#ECE6D8" />
        </Pressable>
        <AppText variant="govde" bold style={styles.baslik}>
          Harekât Merkezi
        </AppText>
      </View>
      {hazir ? (
        <WebView
          ref={web}
          style={styles.web}
          source={{ html: html!, baseUrl: 'https://mevzujsps.com/masa' }}
          originWhitelist={['*']}
          domStorageEnabled
          javaScriptEnabled
          setSupportMultipleWindows={false}
          injectedJavaScriptBeforeContentLoaded={`window.MERKEZ_KAYIT = ${kayit}; true;`}
          onMessage={mesaj}
        />
      ) : (
        <View style={styles.orta}>
          {hata ? (
            <AppText variant="kucuk" style={styles.hata}>
              Merkez yüklenemedi. İnternet bağlantını kontrol edip tekrar dene.
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
