/**
 * Hatırlama (aktif geri-getirme) — kart akışı öğrenme modunda (kanun/bölüm) BİTİNCE çıkan
 * 2-3 mini soru. Testing-effect: pasif tanıma yerine aktif hatırlama + anında geri bildirim.
 * Krem temalı (akış "durumKolon"u krem zeminli). Salt self-test — puan cezası YOK (nazik pratik).
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';
import type { KartSoru } from '@/lib/sinav';

export function HatirlaQuiz({
  sorular,
  onTamamla,
  onSonuc,
  baslik = 'HATIRLAMA',
  altyazi = 'Çalıştıklarını pekiştir — önce aklında canlandır, sonra işaretle.',
}: {
  sorular: KartSoru[];
  onTamamla: () => void;
  /** Her soru cevaplanınca sonucu bildirir (teyit modunda havuz çıkışını besler). */
  onSonuc?: (soruId: string, dogruMu: boolean) => void;
  baslik?: string;
  altyazi?: string;
}) {
  const [index, setIndex] = useState(0);
  const [secilen, setSecilen] = useState<number | null>(null);
  const soru = sorular[index];
  const sonMu = index >= sorular.length - 1;

  function sec(i: number) {
    if (secilen !== null) return;
    setSecilen(i);
    onSonuc?.(soru.id, i === soru.dogru);
  }
  function ilerle() {
    if (sonMu) {
      onTamamla();
      return;
    }
    setIndex((i) => i + 1);
    setSecilen(null);
  }

  return (
    <ScrollView style={styles.kok} contentContainerStyle={styles.icerik}>
      <View style={styles.ust}>
        <MaterialCommunityIcons name="brain" size={18} color={Palette.altinKoyu} />
        <AppText variant="etiket" bold color="altinMetin">
          {baslik} · {index + 1}/{sorular.length}
        </AppText>
      </View>
      <AppText variant="kucuk" color="solukMetin">
        {altyazi}
      </AppText>

      {soru.kaynak ? (
        <AppText variant="etiket" bold color="altinMetin">
          {soru.kaynak}
        </AppText>
      ) : null}

      <View style={styles.soruKart}>
        <AppText variant="govde" bold color="anaMetin">
          {soru.soru}
        </AppText>
      </View>

      <View style={styles.siklar}>
        {soru.siklar.map((m, i) => {
          const durum =
            secilen === null
              ? 'notr'
              : i === soru.dogru
                ? 'dogru'
                : i === secilen
                  ? 'yanlis'
                  : 'soluk';
          const arka =
            durum === 'dogru' ? Palette.yesil : durum === 'yanlis' ? Palette.kirmizi : Palette.kartKremi;
          const renk = durum === 'dogru' || durum === 'yanlis' ? 'beyaz' : 'anaMetin';
          return (
            <Pressable
              key={i}
              disabled={secilen !== null}
              style={({ pressed }) => [
                styles.sik,
                { backgroundColor: arka },
                durum === 'soluk' && styles.sikSoluk,
                pressed && secilen === null && styles.pressed,
              ]}
              onPress={() => sec(i)}>
              <AppText variant="govde" bold color={renk} style={styles.sikHarf}>
                {String.fromCharCode(65 + i)}
              </AppText>
              <AppText variant="kucuk" color={renk} style={styles.sikMetin}>
                {m}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {secilen !== null && soru.aciklama ? (
        <View
          style={[
            styles.aciklama,
            secilen === soru.dogru ? styles.aciklamaDogru : styles.aciklamaYanlis,
          ]}>
          <AppText variant="etiket" bold color={secilen === soru.dogru ? 'yesil' : 'kirmizi'}>
            {secilen === soru.dogru ? 'Doğru' : 'Yanlış'}
          </AppText>
          <AppText variant="kucuk" color="anaMetin">
            {soru.aciklama}
          </AppText>
        </View>
      ) : null}

      {secilen !== null ? (
        <Pressable style={({ pressed }) => [styles.ilerle, pressed && styles.pressed]} onPress={ilerle}>
          <AppText variant="govde" bold color="beyaz">
            {sonMu ? 'Tamamla' : 'Sonraki'}
          </AppText>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  kok: {
    flex: 1,
  },
  icerik: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  ust: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  soruKart: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
    marginTop: Spacing.one,
  },
  siklar: {
    gap: Spacing.two,
  },
  sik: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
  },
  sikSoluk: {
    opacity: 0.5,
  },
  sikHarf: {
    width: 22,
    textAlign: 'center',
  },
  sikMetin: {
    flex: 1,
  },
  aciklama: {
    borderRadius: Radius.m,
    padding: Spacing.three,
    gap: Spacing.half,
  },
  aciklamaDogru: {
    backgroundColor: 'rgba(46,125,50,0.08)',
  },
  aciklamaYanlis: {
    backgroundColor: 'rgba(192,0,0,0.06)',
  },
  ilerle: {
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
