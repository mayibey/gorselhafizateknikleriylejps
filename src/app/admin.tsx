import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing, type PaletteColor } from '@/constants/theme';
import {
  type AdminDuyuru,
  type AdminTalep,
  adminCevapla,
  adminDuyurulariGetir,
  adminTalepleriGetir,
  duyuruAktiflik,
  duyuruEkle,
  duyuruSil,
  kullaniciBul,
  talepDurumGuncelle,
} from '@/lib/admin';
import { type DestekDurum, type DestekMesaj, talepMesajlariGetir } from '@/lib/destek';

type Sekme = 'talepler' | 'duyurular';

const DURUM_RENK: Record<DestekDurum, PaletteColor> = {
  acik: 'altinParlak',
  cevaplandi: 'yesil',
  kapandi: 'kartMetinIkincil',
};

const DURUM_ETIKET: Record<DestekDurum, string> = {
  acik: 'Açık',
  cevaplandi: 'Cevaplandı',
  kapandi: 'Kapandı',
};

/** Yönetim Paneli — yalnız admin görür (Ayarlar'dan açılır). İki sekme: Talepler · Duyurular. */
export default function AdminScreen() {
  const router = useRouter();
  const [sekme, setSekme] = useState<Sekme>('talepler');
  const [seciliTalep, setSeciliTalep] = useState<AdminTalep | null>(null);

  const baslik = seciliTalep ? (seciliTalep.konu || 'Talep') : 'Yönetim Paneli';
  const geriBas = seciliTalep ? () => setSeciliTalep(null) : () => router.back();

  return (
    <Screen title={baslik} onGeri={geriBas} koyu kompaktBaslik>
      {seciliTalep ? (
        <TalepThread talep={seciliTalep} />
      ) : (
        <>
          <View style={styles.sekmeler}>
            <SekmeBtn etiket="Talepler" aktif={sekme === 'talepler'} onPress={() => setSekme('talepler')} />
            <SekmeBtn etiket="Duyurular" aktif={sekme === 'duyurular'} onPress={() => setSekme('duyurular')} />
          </View>
          {sekme === 'talepler' ? (
            <TaleplerSekmesi onSec={setSeciliTalep} />
          ) : (
            <DuyurularSekmesi />
          )}
        </>
      )}
    </Screen>
  );
}

function SekmeBtn({ etiket, aktif, onPress }: { etiket: string; aktif: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.sekmeBtn, aktif && styles.sekmeBtnAktif]} onPress={onPress}>
      <AppText variant="kucuk" color={aktif ? 'altinParlak' : 'beyaz'} bold>
        {etiket}
      </AppText>
    </Pressable>
  );
}

// ── (A) TALEPLER ────────────────────────────────────────────────────────────

function TaleplerSekmesi({ onSec }: { onSec: (t: AdminTalep) => void }) {
  const [talepler, setTalepler] = useState<AdminTalep[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let iptal = false;
      void adminTalepleriGetir().then((liste) => {
        if (!iptal) setTalepler(liste);
      });
      return () => {
        iptal = true;
      };
    }, []),
  );

  if (talepler === null) return <ActivityIndicator color={Palette.altinParlak} style={styles.yukleniyor} />;
  if (talepler.length === 0) {
    return (
      <View style={styles.bos}>
        <MaterialCommunityIcons name="lifebuoy" size={44} color={Palette.kartMetinIkincil} />
        <AppText variant="govde" color="kartMetinIkincil" style={styles.ortala}>
          Henüz destek talebi yok.
        </AppText>
      </View>
    );
  }
  return (
    <>
      {talepler.map((t) => (
        <Pressable
          key={t.id}
          style={({ pressed }) => [styles.kart, pressed && styles.pressed]}
          onPress={() => onSec(t)}>
          <View style={styles.kartUst}>
            <AppText variant="govde" bold color="beyaz" style={styles.esnek} numberOfLines={2}>
              {t.konu}
            </AppText>
            <DurumRozet durum={t.durum} />
          </View>
          <AppText variant="kucuk" color="kartMetinIkincil">
            {tarihBicimUzun(t.guncelleme_at)}
          </AppText>
        </Pressable>
      ))}
    </>
  );
}

function TalepThread({ talep }: { talep: AdminTalep }) {
  const [durum, setDurum] = useState<DestekDurum>(talep.durum);
  const [mesajlar, setMesajlar] = useState<DestekMesaj[] | null>(null);
  const [metin, setMetin] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState(false);

  const mesajYukle = useCallback(async () => {
    const liste = await talepMesajlariGetir(talep.id);
    setMesajlar(liste);
  }, [talep.id]);

  useFocusEffect(
    useCallback(() => {
      void mesajYukle();
    }, [mesajYukle]),
  );

  async function gonder() {
    const temiz = metin.trim();
    if (!temiz || gonderiliyor) return;
    setGonderiliyor(true);
    setHata(false);
    try {
      await adminCevapla(talep.id, temiz);
      setMetin('');
      setDurum('cevaplandi'); // trigger cevaplandı yapar — UI'yi hemen eşitle
      await mesajYukle();
    } catch {
      setHata(true);
    } finally {
      setGonderiliyor(false);
    }
  }

  async function durumaCevir(yeni: DestekDurum) {
    const onceki = durum;
    setDurum(yeni);
    try {
      await talepDurumGuncelle(talep.id, yeni);
    } catch {
      setDurum(onceki); // başarısızsa geri al
    }
  }

  const gonderPasif = metin.trim().length === 0 || gonderiliyor;

  return (
    <>
      <View style={styles.threadUst}>
        <DurumRozet durum={durum} />
        <AppText variant="kucuk" color="kartMetinIkincil">
          {tarihBicimUzun(talep.created_at)}
        </AppText>
      </View>

      {mesajlar === null ? (
        <ActivityIndicator color={Palette.altinParlak} style={styles.yukleniyor} />
      ) : (
        mesajlar.map((m) => <Baloncuk key={m.id} mesaj={m} />)
      )}

      <TextInput
        style={styles.girdi}
        value={metin}
        onChangeText={setMetin}
        placeholder="Cevap yaz…"
        placeholderTextColor={'rgba(226,236,240,0.5)'}
        multiline
        textAlignVertical="top"
        editable={!gonderiliyor}
      />
      {hata ? (
        <AppText variant="kucuk" color="kirmiziParlak" bold>
          Gönderilemedi, tekrar dene.
        </AppText>
      ) : null}
      <Pressable
        style={[styles.anaBtn, gonderPasif && styles.pasif]}
        disabled={gonderPasif}
        onPress={() => void gonder()}>
        {gonderiliyor ? (
          <ActivityIndicator color={Palette.beyaz} />
        ) : (
          <AppText variant="govde" color="beyaz" bold>
            Cevabı Gönder
          </AppText>
        )}
      </Pressable>

      <View style={styles.durumButonlar}>
        <Pressable
          style={[styles.durumBtn, durum === 'cevaplandi' && styles.durumBtnAktif]}
          onPress={() => void durumaCevir('cevaplandi')}>
          <AppText variant="kucuk" color={durum === 'cevaplandi' ? 'altinParlak' : 'beyaz'} bold>
            Çözüldü
          </AppText>
        </Pressable>
        <Pressable
          style={[styles.durumBtn, durum === 'kapandi' && styles.durumBtnAktif]}
          onPress={() => void durumaCevir('kapandi')}>
          <AppText variant="kucuk" color={durum === 'kapandi' ? 'altinParlak' : 'beyaz'} bold>
            Kapat
          </AppText>
        </Pressable>
      </View>
    </>
  );
}

// ── (B) DUYURULAR ───────────────────────────────────────────────────────────

type Hedef = 'herkes' | 'premium' | 'kisi';

function DuyurularSekmesi() {
  const [duyurular, setDuyurular] = useState<AdminDuyuru[] | null>(null);

  const yukle = useCallback(async () => {
    const liste = await adminDuyurulariGetir();
    setDuyurular(liste);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void yukle();
    }, [yukle]),
  );

  return (
    <>
      <DuyuruForm onEklendi={yukle} />

      <AppText variant="etiket" color="kartMetinIkincil" bold style={styles.bolumBaslik}>
        MEVCUT DUYURULAR
      </AppText>
      {duyurular === null ? (
        <ActivityIndicator color={Palette.altinParlak} style={styles.yukleniyor} />
      ) : duyurular.length === 0 ? (
        <AppText variant="kucuk" color="kartMetinIkincil">
          Henüz duyuru yok.
        </AppText>
      ) : (
        duyurular.map((d) => <DuyuruKarti key={d.id} duyuru={d} onDegisti={yukle} />)
      )}
    </>
  );
}

function DuyuruForm({ onEklendi }: { onEklendi: () => Promise<void> }) {
  const [baslik, setBaslik] = useState('');
  const [metin, setMetin] = useState('');
  const [hedef, setHedef] = useState<Hedef>('herkes');
  const [email, setEmail] = useState('');
  const [paywall, setPaywall] = useState(false); // true → duyuruya dokununca satın alma açılır
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  async function gonder() {
    const baslikTemiz = baslik.trim();
    const metinTemiz = metin.trim();
    if (!baslikTemiz || !metinTemiz || gonderiliyor) return;
    setGonderiliyor(true);
    setHata(null);
    try {
      let hedefUserId: string | undefined;
      if (hedef === 'kisi') {
        const emailTemiz = email.trim();
        if (!emailTemiz) {
          setHata('E-posta gir.');
          return;
        }
        const kisi = await kullaniciBul(emailTemiz);
        if (!kisi) {
          setHata('Bu e-postayla kullanıcı bulunamadı.');
          return;
        }
        hedefUserId = kisi.user_id;
      }
      await duyuruEkle({
        baslik: baslikTemiz,
        metin: metinTemiz,
        hedef: hedef === 'premium' ? 'premium' : 'herkes',
        hedefUserId,
        paywall,
      });
      setBaslik('');
      setMetin('');
      setEmail('');
      setHedef('herkes');
      setPaywall(false);
      await onEklendi();
    } catch {
      setHata('Duyuru eklenemedi, tekrar dene.');
    } finally {
      setGonderiliyor(false);
    }
  }

  const gonderPasif = baslik.trim().length === 0 || metin.trim().length === 0 || gonderiliyor;

  return (
    <View style={styles.form}>
      <AppText variant="etiket" color="kartMetinIkincil" bold>
        YENİ DUYURU
      </AppText>
      <TextInput
        style={styles.tekSatir}
        value={baslik}
        onChangeText={setBaslik}
        placeholder="Başlık"
        placeholderTextColor={'rgba(226,236,240,0.5)'}
        editable={!gonderiliyor}
        maxLength={120}
      />
      <TextInput
        style={styles.girdi}
        value={metin}
        onChangeText={setMetin}
        placeholder="Duyuru metni…"
        placeholderTextColor={'rgba(226,236,240,0.5)'}
        multiline
        textAlignVertical="top"
        editable={!gonderiliyor}
      />

      <View style={styles.hedefler}>
        <HedefBtn etiket="Herkes" aktif={hedef === 'herkes'} onPress={() => setHedef('herkes')} />
        <HedefBtn etiket="Premium" aktif={hedef === 'premium'} onPress={() => setHedef('premium')} />
        <HedefBtn etiket="Kişiye Özel" aktif={hedef === 'kisi'} onPress={() => setHedef('kisi')} />
      </View>

      {hedef === 'kisi' ? (
        <TextInput
          style={styles.tekSatir}
          value={email}
          onChangeText={setEmail}
          placeholder="Kullanıcı e-postası"
          placeholderTextColor={'rgba(226,236,240,0.5)'}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!gonderiliyor}
        />
      ) : null}

      <Pressable
        style={styles.paywallSatir}
        onPress={() => setPaywall((v) => !v)}
        disabled={gonderiliyor}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: paywall }}>
        <MaterialCommunityIcons
          name={paywall ? 'checkbox-marked' : 'checkbox-blank-outline'}
          size={22}
          color={paywall ? Palette.altinParlak : Palette.kartMetinIkincil}
        />
        <AppText variant="kucuk" color="beyaz" style={styles.esnek}>
          Dokununca satın alma ekranını aç (indirim duyurusu)
        </AppText>
      </Pressable>

      {hata ? (
        <AppText variant="kucuk" color="kirmiziParlak" bold>
          {hata}
        </AppText>
      ) : null}

      <Pressable
        style={[styles.anaBtn, gonderPasif && styles.pasif]}
        disabled={gonderPasif}
        onPress={() => void gonder()}>
        {gonderiliyor ? (
          <ActivityIndicator color={Palette.beyaz} />
        ) : (
          <AppText variant="govde" color="beyaz" bold>
            Duyuruyu Yayınla
          </AppText>
        )}
      </Pressable>
    </View>
  );
}

function HedefBtn({ etiket, aktif, onPress }: { etiket: string; aktif: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.hedefBtn, aktif && styles.hedefBtnAktif]} onPress={onPress}>
      <AppText variant="etiket" color={aktif ? 'altinParlak' : 'beyaz'} bold>
        {etiket}
      </AppText>
    </Pressable>
  );
}

function DuyuruKarti({ duyuru, onDegisti }: { duyuru: AdminDuyuru; onDegisti: () => Promise<void> }) {
  const [islemde, setIslemde] = useState(false);

  async function aktifligiCevir() {
    if (islemde) return;
    setIslemde(true);
    try {
      await duyuruAktiflik(duyuru.id, !duyuru.aktif);
      await onDegisti();
    } catch {
      // sessiz — liste bir sonraki yüklemede tutarlı
    } finally {
      setIslemde(false);
    }
  }

  async function sil() {
    if (islemde) return;
    setIslemde(true);
    try {
      await duyuruSil(duyuru.id);
      await onDegisti();
    } catch {
      setIslemde(false);
    }
  }

  return (
    <View style={styles.kart}>
      <View style={styles.kartUst}>
        <AppText variant="govde" bold color="beyaz" style={styles.esnek} numberOfLines={2}>
          {duyuru.baslik}
        </AppText>
        <View style={[styles.durumNokta, { backgroundColor: duyuru.aktif ? Palette.yesil : Palette.kartMetinIkincil }]} />
      </View>
      <AppText variant="kucuk" color="kartMetinIkincil" numberOfLines={3}>
        {duyuru.metin}
      </AppText>
      <View style={styles.kartAlt}>
        <AppText variant="etiket" color="kartMetinIkincil" bold>
          {duyuru.hedef === 'premium' ? 'PREMİUM' : 'HERKES'} · {duyuru.aktif ? 'Aktif' : 'Pasif'}
        </AppText>
        <View style={styles.kartAksiyon}>
          <Pressable style={styles.kucukBtn} disabled={islemde} onPress={() => void aktifligiCevir()}>
            <AppText variant="etiket" color="altinParlak" bold>
              {duyuru.aktif ? 'Pasifleştir' : 'Aktifleştir'}
            </AppText>
          </Pressable>
          <Pressable style={styles.kucukBtn} disabled={islemde} onPress={() => void sil()}>
            <AppText variant="etiket" color="kirmiziParlak" bold>
              Sil
            </AppText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ── Ortak ───────────────────────────────────────────────────────────────────

function Baloncuk({ mesaj }: { mesaj: DestekMesaj }) {
  const kullanici = mesaj.gonderen === 'kullanici';
  return (
    <View style={[styles.baloncukSarma, kullanici ? styles.sol : styles.sag]}>
      <View style={[styles.baloncuk, kullanici ? styles.baloncukKullanici : styles.baloncukAdmin]}>
        <AppText variant="kucuk" color="beyaz">
          {mesaj.metin}
        </AppText>
      </View>
      <AppText variant="etiket" color="kartMetinIkincil" style={kullanici ? undefined : styles.ortala}>
        {kullanici ? 'Kullanıcı' : 'Sen (Admin)'} · {tarihBicimUzun(mesaj.created_at)}
      </AppText>
    </View>
  );
}

function DurumRozet({ durum }: { durum: DestekDurum }) {
  return (
    <View style={styles.rozet}>
      <View style={[styles.rozetNokta, { backgroundColor: Palette[DURUM_RENK[durum]] }]} />
      <AppText variant="etiket" color={DURUM_RENK[durum]} bold>
        {DURUM_ETIKET[durum]}
      </AppText>
    </View>
  );
}

/** ISO → "5 Temmuz 2026 14:30" (tr-TR). Hata olursa boş döner. */
function tarihBicimUzun(iso: string): string {
  try {
    return new Date(iso).toLocaleString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

const styles = StyleSheet.create({
  sekmeler: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  sekmeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Radius.m,
    borderWidth: 1,
    borderColor: 'rgba(126,205,218,0.3)',
    backgroundColor: 'rgba(3,40,56,0.55)',
  },
  sekmeBtnAktif: {
    backgroundColor: 'rgba(3,47,69,0.95)',
    borderColor: '#F3C24A',
  },
  yukleniyor: {
    marginVertical: Spacing.four,
  },
  bos: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.six,
  },
  ortala: {
    textAlign: 'center',
  },
  esnek: {
    flex: 1,
  },
  kart: {
    backgroundColor: 'rgba(3,47,69,0.88)',
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: 'rgba(126,205,218,0.5)',
    padding: Spacing.three,
    gap: Spacing.one,
  },
  kartUst: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  kartAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  kartAksiyon: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  kucukBtn: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  durumNokta: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
  threadUst: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  baloncukSarma: {
    maxWidth: '85%',
    gap: Spacing.half,
  },
  sag: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  sol: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  baloncuk: {
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  baloncukKullanici: {
    backgroundColor: 'rgba(3,47,69,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(126,205,218,0.5)',
  },
  baloncukAdmin: {
    backgroundColor: 'rgba(3,40,56,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(240,183,51,0.6)',
  },
  girdi: {
    minHeight: 120,
    backgroundColor: 'rgba(3,40,56,0.7)',
    borderColor: 'rgba(126,205,218,0.5)',
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
    fontSize: 16,
    color: Palette.beyaz,
  },
  tekSatir: {
    backgroundColor: 'rgba(3,40,56,0.7)',
    borderColor: 'rgba(126,205,218,0.5)',
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
    fontSize: 16,
    color: Palette.beyaz,
  },
  anaBtn: {
    backgroundColor: 'rgba(3,40,56,0.9)',
    borderWidth: 1,
    borderColor: '#F3C24A',
    borderRadius: Radius.m,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  pasif: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.75,
  },
  durumButonlar: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  durumBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Radius.m,
    borderWidth: 1,
    borderColor: 'rgba(126,205,218,0.3)',
    backgroundColor: 'rgba(3,40,56,0.55)',
  },
  durumBtnAktif: {
    backgroundColor: 'rgba(3,47,69,0.95)',
    borderColor: '#F3C24A',
  },
  form: {
    gap: Spacing.two,
    backgroundColor: 'rgba(3,47,69,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(126,205,218,0.5)',
    borderRadius: Radius.l,
    padding: Spacing.three,
  },
  hedefler: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  paywallSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  hedefBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Radius.s,
    borderWidth: 1,
    borderColor: 'rgba(126,205,218,0.3)',
    backgroundColor: 'rgba(3,40,56,0.55)',
  },
  hedefBtnAktif: {
    backgroundColor: 'rgba(3,47,69,0.95)',
    borderColor: '#F3C24A',
  },
  bolumBaslik: {
    marginTop: Spacing.two,
  },
  rozet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: 'rgba(3,40,56,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(126,205,218,0.35)',
    borderRadius: Radius.s,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
  rozetNokta: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
