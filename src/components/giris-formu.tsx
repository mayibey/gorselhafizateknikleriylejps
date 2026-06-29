/**
 * Paylaşılan giriş formu — Google + e-posta/şifre (giriş/kayıt + şifremi unuttum).
 * Hem zorunlu giriş adımında (onboarding) hem Giriş ekranında kullanılır. Oturum açılınca
 * auth-context dinleyicisi devreye girer (ekranı ayrıca yönlendirmeye gerek yok).
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { epostaGiris, epostaKayit, sifreSifirla } from '@/lib/auth';
import { useAuth } from '@/lib/auth-context';

type Mod = 'giris' | 'kayit';
type Mesaj = { tip: 'hata' | 'bilgi'; metin: string };

function hataMetni(e: unknown): string {
  const m = e instanceof Error ? e.message : '';
  if (/invalid login credentials/i.test(m)) return 'E-posta veya şifre hatalı.';
  if (/already registered|already exists/i.test(m)) return 'Bu e-posta zaten kayıtlı. Giriş yap.';
  if (/at least 6/i.test(m)) return 'Şifre en az 6 karakter olmalı.';
  if (/valid email|invalid email/i.test(m)) return 'Geçerli bir e-posta gir.';
  if (/email not confirmed/i.test(m)) return 'E-postanı doğrula (gelen kutunu kontrol et).';
  return __DEV__ && m ? `Hata: ${m}` : 'İşlem yapılamadı, tekrar dene.';
}

export function GirisFormu() {
  const { girisYap } = useAuth();
  const [mod, setMod] = useState<Mod>('giris');
  const [eposta, setEposta] = useState('');
  const [sifre, setSifre] = useState('');
  const [mesgul, setMesgul] = useState(false);
  const [mesaj, setMesaj] = useState<Mesaj | null>(null);

  async function google() {
    setMesaj(null);
    setMesgul(true);
    try {
      await girisYap();
    } catch (e) {
      setMesaj({ tip: 'hata', metin: hataMetni(e) });
    } finally {
      setMesgul(false);
    }
  }

  async function epostaGonder() {
    if (!eposta.trim() || !sifre) {
      setMesaj({ tip: 'hata', metin: 'E-posta ve şifre gir.' });
      return;
    }
    setMesaj(null);
    setMesgul(true);
    try {
      if (mod === 'giris') {
        await epostaGiris(eposta, sifre);
      } else {
        const { dogrulamaGerek } = await epostaKayit(eposta, sifre);
        if (dogrulamaGerek) {
          setMesaj({
            tip: 'bilgi',
            metin: 'Doğrulama e-postası gönderildi. Onayladıktan sonra giriş yap.',
          });
        }
      }
    } catch (e) {
      setMesaj({ tip: 'hata', metin: hataMetni(e) });
    } finally {
      setMesgul(false);
    }
  }

  async function unuttum() {
    if (!eposta.trim()) {
      setMesaj({ tip: 'hata', metin: 'Önce e-posta adresini gir.' });
      return;
    }
    setMesaj(null);
    try {
      await sifreSifirla(eposta);
      setMesaj({ tip: 'bilgi', metin: 'Şifre sıfırlama e-postası gönderildi.' });
    } catch (e) {
      setMesaj({ tip: 'hata', metin: hataMetni(e) });
    }
  }

  return (
    <View style={styles.kok}>
      <Pressable
        disabled={mesgul}
        style={({ pressed }) => [styles.googleBtn, pressed && styles.pressed, mesgul && styles.pasif]}
        onPress={() => void google()}>
        <MaterialCommunityIcons name="google" size={22} color={Palette.lacivert} />
        <AppText variant="govde" bold color="lacivert">
          Gmail ile giriş yap
        </AppText>
      </Pressable>

      <View style={styles.ayrac}>
        <View style={styles.ayracCizgi} />
        <AppText variant="etiket" color="solukMetin">
          veya e-posta ile
        </AppText>
        <View style={styles.ayracCizgi} />
      </View>

      <TextInput
        style={styles.girdi}
        placeholder="E-posta"
        placeholderTextColor={Palette.solukMetin}
        value={eposta}
        onChangeText={setEposta}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        inputMode="email"
      />
      <TextInput
        style={styles.girdi}
        placeholder="Şifre"
        placeholderTextColor={Palette.solukMetin}
        value={sifre}
        onChangeText={setSifre}
        secureTextEntry
        autoCapitalize="none"
      />

      <Pressable
        disabled={mesgul}
        style={({ pressed }) => [styles.anaBtn, pressed && styles.pressed, mesgul && styles.pasif]}
        onPress={() => void epostaGonder()}>
        {mesgul ? (
          <ActivityIndicator color={Palette.beyaz} />
        ) : (
          <AppText variant="govde" bold color="beyaz">
            {mod === 'giris' ? 'Giriş yap' : 'Kayıt ol'}
          </AppText>
        )}
      </Pressable>

      <View style={styles.altSatir}>
        <Pressable onPress={() => setMod(mod === 'giris' ? 'kayit' : 'giris')} hitSlop={8}>
          <AppText variant="kucuk" color="lacivert" bold>
            {mod === 'giris' ? 'Hesabın yok mu? Kayıt ol' : 'Zaten hesabın var mı? Giriş yap'}
          </AppText>
        </Pressable>
        {mod === 'giris' ? (
          <Pressable onPress={() => void unuttum()} hitSlop={8}>
            <AppText variant="kucuk" color="solukMetin" bold>
              Şifremi unuttum
            </AppText>
          </Pressable>
        ) : null}
      </View>

      {mesaj ? (
        <AppText
          variant="kucuk"
          bold
          color={mesaj.tip === 'hata' ? 'kirmizi' : 'yesil'}
          style={styles.mesaj}>
          {mesaj.metin}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  kok: {
    gap: Spacing.two,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.beyaz,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    paddingVertical: Spacing.three,
  },
  ayrac: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginVertical: Spacing.one,
  },
  ayracCizgi: {
    flex: 1,
    height: 1,
    backgroundColor: Palette.kenarlik,
  },
  girdi: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
    color: Palette.anaMetin,
  },
  anaBtn: {
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.m,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  altSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  mesaj: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  pasif: {
    opacity: 0.6,
  },
});
