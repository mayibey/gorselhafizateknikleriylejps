import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { PDF_VIEWER_HTML } from '../assets/pdf-viewer';
import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Spacing } from '@/constants/theme';
import { KILIT_AKTIF } from '@/constants/urunler';
import { kitapNotlari, kitapNotuKaydet } from '@/lib/brans-kitap';
import { imzaliUrller } from '@/lib/imzali-url';
import { bytesToB64 } from '@/lib/sifreleme';
import { useUyelik } from '@/lib/uyelik-context';

/**
 * BRANŞ PDF KİTAP GÖRÜNTÜLEYİCİ — imzalı-URL ile PDF indir → base64 → gömülü PDF.js WebView'de
 * göster (zoom/sayfa) + çizim/not katmanı (kalem/fosfor/silgi). Çizimler KİŞİYE ÖZEL + KALICI:
 * sayfa değişince RN'e gönderilir → kitap_notlari'ya kaydedilir; açılışta yüklenip geri çizilir.
 */
export default function KitapScreen() {
  const { yol, baslik } = useLocalSearchParams<{ yol?: string; baslik?: string }>();
  const [durum, setDurum] = useState<'yukleniyor' | 'hazir' | 'hata'>('yukleniyor');
  const [html, setHtml] = useState<string | null>(null);
  const pdfB64 = useRef<string | null>(null);
  const notlar = useRef<Record<number, unknown>>({});
  const web = useRef<WebView>(null);
  const router = useRouter();

  // PREMIUM KAPISI (savunma-derinliği): kitap ücretli içerik. Liste zaten kilitli satırı paywall'a
  // atar; buraya doğrudan gelinirse (derin bağlantı/geri tuşu) burada da kapı olsun — yoksa indirme
  // sunucudan 402 döner ve kullanıcı sebepsiz "hata" ekranı görür. `yukleniyor` bitmeden kilitleme
  // (premium bilgisi tazelenmeden ödeyeni paywall'a atma — icerik-kilidi.ts ile aynı yarış koruması).
  const { premium, yukleniyor: uyelikYukleniyor } = useUyelik();
  const kilitli = KILIT_AKTIF && !uyelikYukleniyor && !premium;
  useEffect(() => {
    if (kilitli) router.replace('/paywall');
  }, [kilitli, router]);

  useEffect(() => {
    let iptal = false;
    if (kilitli || uyelikYukleniyor) return;
    void (async () => {
      if (!yol) return setDurum('hata');
      const url = (await imzaliUrller([yol])).get(yol);
      if (!url) return iptal || setDurum('hata');
      const buf = new Uint8Array(await (await fetch(url)).arrayBuffer());
      const kayitli = await kitapNotlari(yol);
      const n: Record<number, unknown> = {};
      kayitli.forEach((v, k) => (n[k] = v));
      if (iptal) return;
      pdfB64.current = bytesToB64(buf);
      notlar.current = n;
      setHtml(PDF_VIEWER_HTML);
    })().catch(() => iptal || setDurum('hata'));
    return () => {
      iptal = true;
    };
  }, [yol, kilitli, uyelikYukleniyor]);

  // WebView yüklenince PDF'i + kayıtlı notları görüntüleyiciye enjekte et.
  const yuklenince = useCallback(() => {
    if (!pdfB64.current) return;
    web.current?.injectJavaScript(
      `window.baslat(${JSON.stringify(pdfB64.current)}, ${JSON.stringify(notlar.current)}, ${JSON.stringify(yol ?? '')}); true;`,
    );
  }, [yol]);

  const mesaj = useCallback(
    (e: WebViewMessageEvent) => {
      try {
        const m = JSON.parse(e.nativeEvent.data) as { tip: string; sayfa?: number; veri?: unknown };
        if (m.tip === 'hazir') setDurum('hazir');
        else if (m.tip === 'hata') setDurum('hata');
        else if (m.tip === 'kaydet' && yol && m.sayfa != null) void kitapNotuKaydet(yol, m.sayfa, m.veri);
      } catch {
        /* yoksay */
      }
    },
    [yol],
  );

  return (
    <Screen title={baslik ?? 'Kitap'} headerAltinCizgi>
      <View style={styles.govde}>
        {html ? (
          <WebView
            ref={web}
            originWhitelist={['*']}
            source={{ html }}
            javaScriptEnabled
            domStorageEnabled
            onLoadEnd={yuklenince}
            onMessage={mesaj}
            style={styles.web}
          />
        ) : null}
        {durum !== 'hazir' ? (
          <View style={styles.orta} pointerEvents={durum === 'hata' ? 'auto' : 'none'}>
            {durum === 'hata' ? (
              <AppText variant="kucuk" color="solukMetin" style={styles.metin}>
                Kitap açılamadı. Bağlantını kontrol edip tekrar dene.
              </AppText>
            ) : (
              <>
                <ActivityIndicator color={Palette.altinKoyu} />
                <AppText variant="kucuk" color="solukMetin" style={styles.metin}>
                  Kitap hazırlanıyor…
                </AppText>
              </>
            )}
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  govde: { flex: 1 },
  web: { flex: 1, backgroundColor: '#e9e4d8' },
  orta: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.kremZemin,
  },
  metin: { textAlign: 'center', paddingHorizontal: Spacing.four },
});
