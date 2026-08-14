/**
 * PATİKA YOLCULUĞU — KÖPRÜ (bayraklı deneme, 14 Ağu 2026)
 *
 * Gerçek perspektifli yolculuk motorunu (WebView) gösterir; gerçek madde listesini
 * içeri verir, kullanıcı bir tabelaya/düğmeye dokununca dışarı haber eder.
 *
 * Motorun kendisi: src/assets/patika-yolculuk.ts (kitap.tsx'teki PDF görüntüleyici
 * düzeninin aynısı — denenmiş yol).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { PATIKA_YOLCULUK_HTML } from '../../assets/patika-yolculuk';

export type YolculukDurak = {
  /** Kart akışına gidecek bölüm/kart kimliği. */
  id: number;
  /** Tabelada yazacak numara ("38", "Ek 1"); yoksa boş. */
  no: string;
  /** Madde başlığı ("Kast") — numara yoksa düğmede kullanılır. */
  ad: string;
  /** Maddenin tüm kartları çalışıldı mı (tabelada altın + tik). */
  tamam: boolean;
};

type Props = {
  duraklar: YolculukDurak[];
  /** Kaldığı madde; -1 = kanun bitti (zirve sineması oynar). */
  aktif: number;
  kanunAd?: string | null;
  onDurakBas: (id: number) => void;
};

export function YolculukWeb({ duraklar, aktif, kanunAd, onDurakBas }: Props) {
  const web = useRef<WebView>(null);
  const [hazir, setHazir] = useState(false);

  // İLK veri dünyayı kurar; SONRAKİ değişiklikler dünyayı yeniden kurmaz — araç
  // sıradaki durağa SÜRER (kart çalışılıp madde bitince ışınlanma olmasın diye).
  const kuruldu = useRef(false);
  const gonder = useCallback(() => {
    // TUZAK: WebView, kartlar veritabanından gelmeden hazır olabiliyor. Boş listeyle
    // "kur" çağrılırsa motor hiç kurulmuyor, sonrakiler de "güncelleme" sayılıp
    // boşa gidiyordu → ekran bomboş kalıyordu. Dünya ANCAK gerçek veriyle kurulur.
    if (duraklar.length === 0) return;
    const veri = JSON.stringify({ kanun: kanunAd ?? '', duraklar, aktif });
    const cagri = kuruldu.current ? 'patikaDurum' : 'patikaKur';
    kuruldu.current = true;
    web.current?.injectJavaScript(
      `window.${cagri} && window.${cagri}(${JSON.stringify(veri)}); true;`,
    );
  }, [duraklar, aktif, kanunAd]);

  useEffect(() => {
    if (hazir) gonder();
  }, [hazir, gonder]);

  const mesaj = useCallback(
    (e: WebViewMessageEvent) => {
      try {
        const m = JSON.parse(e.nativeEvent.data) as { tip?: string; id?: number };
        if (m.tip === 'hazir') setHazir(true);
        else if (m.tip === 'durak' && typeof m.id === 'number') onDurakBas(m.id);
      } catch {
        /* bozuk mesaj → yok say */
      }
    },
    [onDurakBas],
  );

  return (
    <View style={st.sar}>
      <WebView
        ref={web}
        originWhitelist={['*']}
        source={{ html: PATIKA_YOLCULUK_HTML }}
        javaScriptEnabled
        domStorageEnabled
        // Sahne tek ekran; WebView'in kendi kaydırması OLMAMALI (sürükleme motorun işi).
        scrollEnabled={false}
        overScrollMode="never"
        bounces={false}
        androidLayerType="hardware"
        allowsInlineMediaPlayback
        onMessage={mesaj}
        style={st.web}
      />
      {!hazir ? (
        <View style={st.orta} pointerEvents="none">
          <ActivityIndicator color="#F0B733" />
        </View>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  sar: { flex: 1, backgroundColor: '#04222e', overflow: 'hidden' },
  web: { flex: 1, backgroundColor: '#04222e' },
  orta: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
});
