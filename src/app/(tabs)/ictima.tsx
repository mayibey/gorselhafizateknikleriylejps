import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { Loading } from '@/components/ui/loading';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { cikisYap } from '@/lib/auth';
import { useAuth } from '@/lib/auth-context';
import {
  type IctimaMesaj,
  mesajAboneligi,
  mesajGonder,
  mesajlariGetir,
  mesajRaporla,
  mesajSil,
} from '@/lib/ictima';
import { supabaseHazir } from '@/lib/supabase';

const saatFmt = (iso: string) => {
  try {
    return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

export default function IctimaScreen() {
  const { session } = useAuth();
  const benId = session?.user.id ?? null;
  const [mesajlar, setMesajlar] = useState<IctimaMesaj[] | null>(null);
  const [taslak, setTaslak] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const listeRef = useRef<FlatList<IctimaMesaj>>(null);

  const yukle = useCallback(() => {
    void mesajlariGetir().then(setMesajlar);
  }, []);

  // Odakta yükle + realtime aboneliği (yeni mesajda yeniden çek).
  useFocusEffect(
    useCallback(() => {
      if (!supabaseHazir) return;
      yukle();
      const birak = mesajAboneligi(yukle);
      return birak;
    }, [yukle]),
  );

  useEffect(() => {
    if (mesajlar && mesajlar.length > 0) {
      setTimeout(() => listeRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [mesajlar]);

  async function gonder() {
    const metin = taslak.trim();
    if (!metin || gonderiliyor) return;
    setGonderiliyor(true);
    const sonuc = await mesajGonder(metin);
    setGonderiliyor(false);
    if (sonuc.ok) {
      setTaslak('');
      yukle();
    } else {
      Alert.alert('Gönderilemedi', sonuc.hata ?? 'Tekrar dene.');
    }
  }

  function uzunBas(m: IctimaMesaj) {
    if (m.gonderenId === benId) {
      Alert.alert('Mesaj', m.metin, [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => void mesajSil(m.id).then(yukle),
        },
      ]);
    } else {
      Alert.alert('Mesajı raporla', `${m.kullaniciAdi}: ${m.metin}`, [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Raporla',
          style: 'destructive',
          onPress: () => void mesajRaporla(m.id, 'uygunsuz').then(() => Alert.alert('Alındı', 'Rapor iletildi.')),
        },
      ]);
    }
  }

  function cikis() {
    Alert.alert('Çıkış', 'Oturumu kapatmak istiyor musun?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Çıkış yap', style: 'destructive', onPress: () => void cikisYay() },
    ]);
  }
  async function cikisYay() {
    await cikisYap();
  }

  if (!supabaseHazir) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <Baslik />
        <EmptyState
          ikon="server-network-off"
          baslik="İçtima Alanı yakında"
          aciklama="Sohbet için sunucu kurulumu (Supabase) tamamlanınca burası aktifleşecek."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Baslik onCikis={cikis} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}>
        {mesajlar === null ? (
          <Loading metin="İçtima yükleniyor…" />
        ) : mesajlar.length === 0 ? (
          <EmptyState
            ikon="forum-outline"
            baslik="İlk sözü sen söyle"
            aciklama="Henüz mesaj yok. Birliğe selam ver, sohbeti başlat."
          />
        ) : (
          <FlatList
            ref={listeRef}
            data={mesajlar}
            keyExtractor={(m) => String(m.id)}
            contentContainerStyle={styles.liste}
            renderItem={({ item }) => (
              <Balon mesaj={item} benimMi={item.gonderenId === benId} onUzunBas={() => uzunBas(item)} />
            )}
          />
        )}

        <View style={styles.girdiBar}>
          <TextInput
            style={styles.girdi}
            placeholder="Mesaj yaz…"
            placeholderTextColor={Palette.solukMetin}
            value={taslak}
            onChangeText={setTaslak}
            multiline
            maxLength={1000}
          />
          <Pressable
            style={({ pressed }) => [styles.gonderBtn, pressed && styles.pressed, gonderiliyor && styles.pasif]}
            disabled={gonderiliyor}
            onPress={() => void gonder()}>
            <MaterialCommunityIcons name="send" size={20} color={Palette.beyaz} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Baslik({ onCikis }: { onCikis?: () => void }) {
  return (
    <View style={styles.baslik}>
      <MaterialCommunityIcons name="account-group" size={22} color={Palette.beyaz} />
      <AppText variant="altBaslik" color="beyaz" bold style={styles.flex}>
        İçtima Alanı
      </AppText>
      {onCikis ? (
        <Pressable onPress={onCikis} hitSlop={10}>
          <MaterialCommunityIcons name="logout" size={20} color={Palette.kenarlik} />
        </Pressable>
      ) : null}
    </View>
  );
}

function Balon({
  mesaj,
  benimMi,
  onUzunBas,
}: {
  mesaj: IctimaMesaj;
  benimMi: boolean;
  onUzunBas: () => void;
}) {
  return (
    <Pressable
      onLongPress={onUzunBas}
      style={[styles.balonSatir, { alignItems: benimMi ? 'flex-end' : 'flex-start' }]}>
      {!benimMi ? (
        <AppText variant="etiket" color="solukMetin" bold style={styles.kullanici}>
          {mesaj.kullaniciAdi}
        </AppText>
      ) : null}
      <View style={[styles.balon, benimMi ? styles.balonBen : styles.balonDiger]}>
        <AppText variant="kucuk" color={benimMi ? 'beyaz' : 'lacivert'}>
          {mesaj.metin}
        </AppText>
      </View>
      <AppText variant="etiket" color="solukMetin" style={styles.saat}>
        {saatFmt(mesaj.tarih)}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Palette.kremZemin,
  },
  flex: {
    flex: 1,
  },
  baslik: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.lacivert,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  liste: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  balonSatir: {
    gap: 2,
  },
  kullanici: {
    marginLeft: Spacing.one,
  },
  balon: {
    maxWidth: '82%',
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  balonBen: {
    backgroundColor: Palette.lacivert,
    borderBottomRightRadius: Radius.s,
  },
  balonDiger: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderBottomLeftRadius: Radius.s,
  },
  saat: {
    marginHorizontal: Spacing.one,
  },
  girdiBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
    padding: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Palette.kenarlik,
    backgroundColor: Palette.kartKremi,
  },
  girdi: {
    flex: 1,
    maxHeight: 110,
    backgroundColor: Palette.beyaz,
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 15,
    color: Palette.lacivert,
  },
  gonderBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.kirmizi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  pasif: {
    opacity: 0.6,
  },
});
