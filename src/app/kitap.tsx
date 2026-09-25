import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { PDF_VIEWER_HTML } from '../assets/pdf-viewer';
import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Spacing } from '@/constants/theme';
import { KILIT_AKTIF } from '@/constants/urunler';
import { kitapNotlari, kitapNotuKaydet } from '@/lib/brans-kitap';
import { useKisiselOzellik } from '@/lib/ozellik';
import { imzaliUrller } from '@/lib/imzali-url';
import { bytesToB64 } from '@/lib/sifreleme';
import { useUyelik } from '@/lib/uyelik-context';

/**
 * BRANŞ PDF KİTAP GÖRÜNTÜLEYİCİ — imzalı-URL ile PDF indir → base64 → gömülü PDF.js WebView'de
 * göster (zoom/sayfa) + çizim/not katmanı (kalem/fosfor/silgi). Çizimler KİŞİYE ÖZEL + KALICI:
 * sayfa değişince RN'e gönderilir → kitap_notlari'ya kaydedilir; açılışta yüklenip geri çizilir.
 */
/** KALDIĞI YERDEN DEVAM (başkan, 23 Eyl 2026): kitap kapanınca son bakılan sayfa cihazda tutulur,
 *  bir sonraki açılışta oradan başlar. Anahtar kitap yoluna bağlı — her kitap kendi yerini hatırlar. */
const SON_SAYFA_ONEK = 'jsps.kitap.sonsayfa.';
/** Büyük kitap (Altın Özet 7 MB) tek dev string olarak WebView'e verilmez; 512 KB'lık parçalar. */
const PARCA = 512 * 1024;

export default function KitapScreen() {
  const { yol, baslik } = useLocalSearchParams<{ yol?: string; baslik?: string }>();
  const [durum, setDurum] = useState<'yukleniyor' | 'hazir' | 'hata'>('yukleniyor');
  const [html, setHtml] = useState<string | null>(null);
  const pdfB64 = useRef<string | null>(null);
  const notlar = useRef<Record<number, unknown>>({});
  const baslangicSayfa = useRef(1);
  const web = useRef<WebView>(null);
  const router = useRouter();
  // NET + TAM EKRAN (25 Eyl 2026, kullanıcı: "tam ekran olmuyor, yakınlaştırınca netlik bozuluyor"):
  // önce yalnız 'on-izleme'de. Kitap kenardan kenara (800 px sınırı ve kenar boşluğu yok), sayfa cihaz
  // yoğunluğunda + yakınlaştırınca yeniden çizilir; tam ekran düğmesi başlığı/durum/araç çubuğunu gizler.
  const yeni = useKisiselOzellik('on-izleme');
  const [tam, setTam] = useState(false);
  const tamDegistir = useCallback((a: boolean) => {
    setTam(a);
    web.current?.injectJavaScript(`window.tamEkran && window.tamEkran(${a}); true;`);
  }, []);

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
      try {
        const son = await AsyncStorage.getItem(SON_SAYFA_ONEK + yol);
        baslangicSayfa.current = Math.max(1, Number(son) || 1);
      } catch {
        baslangicSayfa.current = 1;
      }
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
    const b64 = pdfB64.current;
    if (!b64) return;
    if (yeni) web.current?.injectJavaScript('window.AYAR = { net: true, genis: true }; true;');
    // PDF'i parça parça ver (tek dev injectJavaScript büyük kitapta takılıyordu), sonra başlat.
    for (let i = 0; i < b64.length; i += PARCA) {
      web.current?.injectJavaScript(`window.parcaEkle(${JSON.stringify(b64.slice(i, i + PARCA))}); true;`);
    }
    web.current?.injectJavaScript(
      `window.baslat(null, ${JSON.stringify(notlar.current)}, ${JSON.stringify(yol ?? '')}, ${baslangicSayfa.current}); true;`,
    );
  }, [yol, yeni]);

  const mesaj = useCallback(
    (e: WebViewMessageEvent) => {
      try {
        const m = JSON.parse(e.nativeEvent.data) as { tip: string; sayfa?: number; veri?: unknown };
        if (m.tip === 'hazir') setDurum('hazir');
        else if (m.tip === 'hata') setDurum('hata');
        else if (m.tip === 'sayfa' && yol && m.sayfa != null)
          void AsyncStorage.setItem(SON_SAYFA_ONEK + yol, String(m.sayfa)).catch(() => undefined);
        else if (m.tip === 'kaydet' && yol && m.sayfa != null) void kitapNotuKaydet(yol, m.sayfa, m.veri);
      } catch {
        /* yoksay */
      }
    },
    [yol],
  );

  const govde = (
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
  );

  if (!yeni)
    return (
      <Screen title={baslik ?? 'Kitap'} headerAltinCizgi>
        {govde}
      </Screen>
    );

  return (
    <SafeAreaView style={[styles.safe, tam && styles.safeTam]} edges={['top', 'left', 'right']}>
      <StatusBar hidden={tam} style="light" />
      {!tam ? (
        <>
          <View style={styles.baslik}>
            <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Geri">
              <MaterialCommunityIcons name="arrow-left" size={24} color={Palette.beyaz} />
            </Pressable>
            <AppText variant="altBaslik" color="beyaz" numberOfLines={1} style={styles.baslikYazi}>
              {baslik ?? 'Kitap'}
            </AppText>
            <Pressable
              onPress={() => tamDegistir(true)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Tam ekran">
              <MaterialCommunityIcons name="fullscreen" size={28} color={Palette.altinParlak} />
            </Pressable>
          </View>
          <View style={styles.altinCizgi} />
        </>
      ) : null}
      {govde}
      {tam ? (
        <Pressable
          onPress={() => tamDegistir(false)}
          style={styles.tamCik}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Tam ekrandan çık">
          <MaterialCommunityIcons name="fullscreen-exit" size={24} color={Palette.beyaz} />
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.lacivert },
  safeTam: { backgroundColor: '#e9e4d8' },
  baslik: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Palette.lacivert,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  baslikYazi: { flex: 1 },
  altinCizgi: { height: 1, backgroundColor: Palette.altin },
  tamCik: {
    position: 'absolute',
    top: Spacing.six,
    right: Spacing.three,
    backgroundColor: 'rgba(11,31,58,0.55)',
    borderRadius: 999,
    padding: Spacing.two,
  },
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
