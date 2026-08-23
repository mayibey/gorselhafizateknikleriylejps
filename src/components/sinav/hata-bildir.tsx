/**
 * HATA BİLDİR — sınav ekranının sağ üstündeki bayrak düğmesi + bildirim penceresi.
 *
 * Başkan (23 Ağu 2026): "tüm sorulara hata bildir butonu ekle, kayıtlar gerçekten
 * tutulsun; hangi soru, yazan kim."
 *
 * DÜRÜSTLÜK: kayıt sunucuya yazılamazsa "gönderildi" DEMEZ. Oturum yoksa ya da bağlantı
 * kopuksa açıkça söyler; sahte başarı yok (geri bildirim ekranındaki kuralın aynısı).
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { HATA_KATEGORI, hataBildir, type HataBildirim } from '@/lib/deneme-servis';

type Durum = 'kapali' | 'form' | 'gonderiliyor' | 'tamam' | 'hata';

export function HataBildirDugmesi({
  soru,
  onAcildi,
}: {
  /** Bildirilecek soru + nerede karşılaşıldığı. Soru yoksa düğme çizilmez. */
  soru: Omit<HataBildirim, 'kategori' | 'mesaj'> | null;
  onAcildi?: () => void;
}) {
  const [durum, setDurum] = useState<Durum>('kapali');
  const [kategori, setKategori] = useState<string>(HATA_KATEGORI[0].anahtar);
  const [mesaj, setMesaj] = useState('');

  if (!soru) return null;

  async function gonder() {
    if (!soru) return;
    setDurum('gonderiliyor');
    const ok = await hataBildir({ ...soru, kategori, mesaj });
    setDurum(ok ? 'tamam' : 'hata');
    if (ok) setMesaj('');
  }

  function kapat() {
    setDurum('kapali');
  }

  return (
    <>
      <Pressable
        onPress={() => {
          setDurum('form');
          onAcildi?.();
        }}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Bu soruda hata bildir"
        style={({ pressed }) => [st.dugme, pressed && st.basili]}>
        <MaterialCommunityIcons name="flag-outline" size={18} color={Palette.altinParlak} />
        <AppText variant="etiket" bold color="altinParlak">
          HATA
        </AppText>
      </Pressable>

      <Modal visible={durum !== 'kapali'} transparent animationType="fade" onRequestClose={kapat}>
        <View style={st.perde}>
          <View style={st.kutu}>
            {durum === 'tamam' ? (
              <>
                <MaterialCommunityIcons name="check-circle" size={40} color={Palette.yesil} />
                <AppText variant="govde" bold color="lacivert" style={st.ortali}>
                  Bildirimin kaydedildi
                </AppText>
                <AppText variant="kucuk" color="solukMetin" style={st.ortali}>
                  Soruyu inceleyip düzelteceğiz. Bildirdiğin için sağ ol.
                </AppText>
                <Pressable style={({ pressed }) => [st.btn, pressed && st.basili]} onPress={kapat}>
                  <AppText variant="kucuk" bold color="beyaz">
                    Kapat
                  </AppText>
                </Pressable>
              </>
            ) : (
              <>
                <View style={st.baslikSatir}>
                  <MaterialCommunityIcons name="flag-outline" size={20} color={Palette.kirmizi} />
                  <AppText variant="govde" bold color="lacivert">
                    Bu soruda ne var?
                  </AppText>
                </View>
                <AppText variant="etiket" color="solukMetin" numberOfLines={3}>
                  {soru.soruMetni}
                </AppText>

                <ScrollView style={st.liste} keyboardShouldPersistTaps="handled">
                  {HATA_KATEGORI.map((k) => {
                    const secili = kategori === k.anahtar;
                    return (
                      <Pressable
                        key={k.anahtar}
                        onPress={() => setKategori(k.anahtar)}
                        style={[st.secenek, secili && st.secenekAktif]}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: secili }}>
                        <MaterialCommunityIcons
                          name={secili ? 'radiobox-marked' : 'radiobox-blank'}
                          size={18}
                          color={secili ? Palette.lacivert : Palette.solukMetin}
                        />
                        <AppText variant="kucuk" bold={secili} color="anaMetin">
                          {k.etiket}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <TextInput
                  style={st.metin}
                  value={mesaj}
                  onChangeText={setMesaj}
                  placeholder="İstersen açıkla: doğrusu ne olmalı?"
                  placeholderTextColor={Palette.solukMetin}
                  multiline
                  maxLength={600}
                />

                {durum === 'hata' ? (
                  <AppText variant="etiket" bold color="kirmizi" style={st.ortali}>
                    Gönderilemedi. Bağlantını kontrol edip tekrar dene.
                  </AppText>
                ) : null}

                <View style={st.butonlar}>
                  <Pressable style={({ pressed }) => [st.btnIkincil, pressed && st.basili]} onPress={kapat}>
                    <AppText variant="kucuk" bold color="lacivert">
                      Vazgeç
                    </AppText>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [st.btn, pressed && st.basili]}
                    onPress={gonder}
                    disabled={durum === 'gonderiliyor'}>
                    {durum === 'gonderiliyor' ? (
                      <ActivityIndicator color={Palette.beyaz} />
                    ) : (
                      <AppText variant="kucuk" bold color="beyaz">
                        Gönder
                      </AppText>
                    )}
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const st = StyleSheet.create({
  dugme: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(243,194,74,0.55)',
    backgroundColor: 'rgba(243,194,74,0.12)',
  },
  basili: { opacity: 0.7 },
  perde: {
    flex: 1,
    backgroundColor: 'rgba(11,31,58,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
  },
  kutu: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Palette.kartKremi,
    borderRadius: Radius.l,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  baslikSatir: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  ortali: { textAlign: 'center' },
  liste: { maxHeight: 190 },
  secenek: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: 9,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.m,
  },
  secenekAktif: { backgroundColor: Palette.altinSolukYuzey },
  metin: {
    borderWidth: 1,
    borderColor: Palette.kenarlik,
    borderRadius: Radius.m,
    padding: Spacing.two,
    minHeight: 66,
    textAlignVertical: 'top',
    color: Palette.anaMetin,
    backgroundColor: Palette.beyaz,
  },
  butonlar: { flexDirection: 'row', gap: Spacing.two },
  btn: {
    flex: 1,
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.m,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnIkincil: {
    flex: 1,
    borderWidth: 1,
    borderColor: Palette.kenarlik,
    borderRadius: Radius.m,
    paddingVertical: 12,
    alignItems: 'center',
  },
});
