/**
 * ÖLÇEK YAMASI — uygulamanın EN BAŞINDA (index.ts, expo-router'dan önce) yüklenir.
 * StyleSheet.create ile yazılmış bütün ölçüleri ve simge boyutlarını EKRAN_OLCEK ile çarpar;
 * böylece 93 dosyaya tek tek dokunmadan iPad/tablet büyür, küçük telefon sığar.
 * Normal telefonda EKRAN_OLCEK = 1 → yama hiçbir şey yapmaz.
 * Kenarlık kalınlığı (borderWidth), opaklık, yüzdeler ve metin değerleri ÖLÇEKLENMEZ.
 */
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';

import { EKRAN_OLCEK, o } from './ekran-olcek';

const ANAHTAR = new Set([
  'width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight',
  'fontSize', 'lineHeight', 'letterSpacing',
  'padding', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'paddingHorizontal', 'paddingVertical',
  'paddingStart', 'paddingEnd',
  'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'marginHorizontal', 'marginVertical',
  'marginStart', 'marginEnd',
  'gap', 'rowGap', 'columnGap',
  'borderRadius', 'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius', 'borderBottomRightRadius',
  'top', 'bottom', 'left', 'right', 'start', 'end',
  'shadowRadius', 'elevation',
]);

function olcekle(stil: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(stil)) {
    out[k] = typeof v === 'number' && ANAHTAR.has(k) ? o(v) : v;
  }
  return out;
}

if (EKRAN_OLCEK !== 1) {
  const asil = StyleSheet.create;
  (StyleSheet as { create: typeof StyleSheet.create }).create = ((stiller: Record<string, Record<string, unknown>>) => {
    const yeni: Record<string, Record<string, unknown>> = {};
    for (const [ad, stil] of Object.entries(stiller)) yeni[ad] = stil && typeof stil === 'object' ? olcekle(stil) : stil;
    return asil(yeni as never);
  }) as typeof StyleSheet.create;

  // Simgeler: `size={24}` prop'u StyleSheet'ten geçmez → render'da ölçeklenir.
  for (const Sinif of [MaterialCommunityIcons, FontAwesome] as unknown as { prototype: { render: () => unknown } }[]) {
    const asilRender = Sinif.prototype.render;
    Sinif.prototype.render = function (this: { props: { size?: number } }) {
      const p = this.props;
      if (typeof p?.size !== 'number') return asilRender.call(this);
      const kopya = Object.create(this);
      Object.defineProperty(kopya, 'props', { value: { ...p, size: o(p.size) } });
      return asilRender.call(kopya);
    };
  }
}
