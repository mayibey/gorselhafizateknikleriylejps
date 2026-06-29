/**
 * Premium giriş / kayıt ekranı (KREM tema). Referans tasarıma uyarlandı:
 * karakter figürü (kemer üstü) + altın arma + temalı girdiler + Google/Apple + güvenlik notu.
 * - mod 'giris': e-posta/şifre + şifremi unuttum + Giriş yap.
 * - mod 'kayit': adım göstergesi (1) + e-posta/şifre/tekrar + şartlar + Devam et.
 * Oturum açılınca akışı (profil/branş) onboarding + auth-context yönetir.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { MaxContentWidth, Palette, Radius, Spacing } from '@/constants/theme';
import { epostaGiris, epostaKayit, epostaKullanimda, girisDonusAdresi, sifreSifirla } from '@/lib/auth';
import { useAuth } from '@/lib/auth-context';
import { epostaHatasi, sifreHatasi } from '@/lib/dogrulama';

import { AdimGostergesi } from './adim-gostergesi';
import { AuthGirdi } from './auth-girdi';
import { KarakterFigur } from './karakter-figur';
import { SaglayiciButonlari } from './saglayici-butonlari';

type Mod = 'giris' | 'kayit';
type Mesaj = { tip: 'hata' | 'bilgi'; metin: string };

function hataMetni(e: unknown): string {
  const m = e instanceof Error ? e.message : '';
  if (/invalid login credentials/i.test(m)) return 'E-posta veya şifre hatalı.';
  if (/already registered|already exists/i.test(m)) return 'Bu e-posta zaten kayıtlı. Giriş yap.';
  if (/email not confirmed/i.test(m)) return 'E-postanı doğrula (gelen kutunu kontrol et).';
  return __DEV__ && m ? `Hata: ${m}` : 'İşlem yapılamadı, tekrar dene.';
}

export function AuthEkrani() {
  const router = useRouter();
  const { girisYap } = useAuth();
  const [mod, setMod] = useState<Mod>('giris');
  const [eposta, setEposta] = useState('');
  const [sifre, setSifre] = useState('');
  const [sifreTekrar, setSifreTekrar] = useState('');
  const [sartlar, setSartlar] = useState(false);
  const [mesgul, setMesgul] = useState(false);
  const [mesaj, setMesaj] = useState<Mesaj | null>(null);

  const kayitMi = mod === 'kayit';

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

  function apple() {
    setMesaj({ tip: 'bilgi', metin: 'Apple ile giriş iOS sürümünde aktifleşecek.' });
  }

  async function gonder() {
    if (!eposta.trim() || !sifre) {
      setMesaj({ tip: 'hata', metin: 'E-posta ve şifre gir.' });
      return;
    }
    if (kayitMi) {
      const dHata = epostaHatasi(eposta) ?? sifreHatasi(sifre);
      if (dHata) return setMesaj({ tip: 'hata', metin: dHata });
      if (sifre !== sifreTekrar) return setMesaj({ tip: 'hata', metin: 'Şifreler aynı değil.' });
      if (!sartlar) return setMesaj({ tip: 'hata', metin: 'Şartları kabul etmen gerekiyor.' });
    }
    setMesaj(null);
    setMesgul(true);
    try {
      if (!kayitMi) {
        await epostaGiris(eposta, sifre);
      } else {
        if (await epostaKullanimda(eposta)) {
          setMesaj({ tip: 'hata', metin: 'Bu e-posta zaten kayıtlı. "Giriş yap"a geç.' });
          return;
        }
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

  async function sifremiUnuttum() {
    if (!eposta.trim()) return setMesaj({ tip: 'hata', metin: 'Önce e-posta adresini gir.' });
    try {
      await sifreSifirla(eposta);
      setMesaj({ tip: 'bilgi', metin: 'Şifre sıfırlama e-postası gönderildi.' });
    } catch (e) {
      setMesaj({ tip: 'hata', metin: hataMetni(e) });
    }
  }

  function modDegis(yeni: Mod) {
    setMod(yeni);
    setMesaj(null);
    setSifreTekrar('');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.icerik} keyboardShouldPersistTaps="handled">
        {/* Üst: arma + karakter */}
        <View style={styles.ust}>
          <View style={styles.arma}>
            <MaterialCommunityIcons name="shield-star" size={30} color={Palette.altinKoyu} />
          </View>
          <KarakterFigur style={styles.karakter} />
        </View>

        <AppText variant="dev" bold color="lacivert">
          {kayitMi ? 'Hesap Oluştur' : 'Giriş Yap'}
        </AppText>
        <AppText variant="kucuk" color="solukMetin" style={styles.altyazi}>
          {kayitMi
            ? 'Hızlıca hesabını oluştur, sonra profilini tamamlayalım.'
            : 'Kaldığın yerden devam et, ilerlemene güvenle ulaş.'}
        </AppText>

        {kayitMi ? <AdimGostergesi adim={1} /> : null}

        <View style={styles.form}>
          <AuthGirdi
            ikon="email-outline"
            placeholder="E-posta adresi"
            value={eposta}
            onChangeText={setEposta}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            inputMode="email"
          />
          <AuthGirdi
            ikon="lock-outline"
            placeholder="Şifre"
            value={sifre}
            onChangeText={setSifre}
            sifre
          />
          {kayitMi ? (
            <AuthGirdi
              ikon="lock-check-outline"
              placeholder="Şifre (tekrar)"
              value={sifreTekrar}
              onChangeText={setSifreTekrar}
              sifre
            />
          ) : (
            <Pressable onPress={() => void sifremiUnuttum()} style={styles.unuttumSar} hitSlop={8}>
              <AppText variant="kucuk" color="lacivert" bold>
                Şifremi unuttum
              </AppText>
            </Pressable>
          )}

          {kayitMi ? (
            <Pressable style={styles.sartSatir} onPress={() => setSartlar((s) => !s)}>
              <View style={[styles.kutu, sartlar && styles.kutuDolu]}>
                {sartlar ? (
                  <MaterialCommunityIcons name="check" size={14} color={Palette.beyaz} />
                ) : null}
              </View>
              <AppText variant="etiket" color="solukMetin" style={styles.sartMetin}>
                <AppText
                  variant="etiket"
                  color="lacivert"
                  bold
                  onPress={() => router.push({ pathname: '/yasal', params: { tip: 'sartlar' } })}>
                  Kullanım Şartları ve Gizlilik Politikası
                </AppText>
                'nı okudum, kabul ediyorum.
              </AppText>
            </Pressable>
          ) : null}

          <Pressable
            disabled={mesgul}
            style={({ pressed }) => [styles.anaBtn, pressed && styles.pressed, mesgul && styles.pasif]}
            onPress={() => void gonder()}>
            <AppText variant="govde" bold color="beyaz">
              {kayitMi ? 'Devam et' : 'Giriş yap'}
            </AppText>
            <MaterialCommunityIcons name="arrow-right" size={20} color={Palette.beyaz} />
          </Pressable>

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

        <View style={styles.ayrac}>
          <View style={styles.ayracCizgi} />
          <AppText variant="etiket" color="solukMetin">
            veya
          </AppText>
          <View style={styles.ayracCizgi} />
        </View>

        <SaglayiciButonlari onGoogle={() => void google()} onApple={apple} mesgul={mesgul} />

        <Pressable
          style={styles.altLink}
          onPress={() => modDegis(kayitMi ? 'giris' : 'kayit')}
          hitSlop={8}>
          <AppText variant="kucuk" color="solukMetin">
            {kayitMi ? 'Zaten hesabın var mı? ' : 'Hesabın yok mu? '}
            <AppText variant="kucuk" color="lacivert" bold>
              {kayitMi ? 'Giriş yap' : 'Hesap oluştur'}
            </AppText>
          </AppText>
        </Pressable>

        <View style={styles.guvenlik}>
          <MaterialCommunityIcons name="shield-lock-outline" size={14} color={Palette.solukMetin} />
          <AppText variant="etiket" color="solukMetin">
            Bilgilerin 256-bit şifreleme ile korunur.
          </AppText>
        </View>

        {__DEV__ ? (
          <View style={styles.teshis}>
            <AppText variant="etiket" color="solukMetin" bold>
              TEŞHİS — Supabase Redirect URLs'e ekle:
            </AppText>
            <AppText variant="etiket" color="lacivert" bold selectable>
              {girisDonusAdresi()}
            </AppText>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Palette.kremZemin,
  },
  icerik: {
    flexGrow: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    gap: Spacing.two,
  },
  ust: {
    height: 150,
    justifyContent: 'flex-start',
  },
  arma: {
    position: 'absolute',
    top: Spacing.two,
    alignSelf: 'center',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Palette.altinSolukYuzey,
    borderWidth: 1,
    borderColor: Palette.altin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  karakter: {
    position: 'absolute',
    right: -Spacing.two,
    top: 0,
  },
  altyazi: {
    lineHeight: 20,
    maxWidth: '72%',
  },
  form: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  unuttumSar: {
    alignSelf: 'flex-end',
  },
  sartSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  kutu: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: Palette.kenarlik,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kutuDolu: {
    backgroundColor: Palette.lacivert,
    borderColor: Palette.lacivert,
  },
  sartMetin: {
    flex: 1,
    lineHeight: 18,
  },
  anaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.m,
    height: 52,
    marginTop: Spacing.one,
  },
  mesaj: {
    textAlign: 'center',
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
  altLink: {
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  guvenlik: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  teshis: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.two,
    gap: Spacing.half,
    marginTop: Spacing.two,
  },
  pressed: {
    opacity: 0.85,
  },
  pasif: {
    opacity: 0.6,
  },
});
