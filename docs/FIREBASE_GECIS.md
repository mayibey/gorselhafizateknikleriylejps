# Firebase Geçişi — Plan (Supabase → Firebase)

> Karar: kullanıcı verisi + auth Supabase'den Firebase'e taşınacak. FCM zaten Firebase'de
> (proje `mevzu-jsps-59639`). İçerik (görsel) R2'de KALIR (depo-agnostik resolver — sadece URL).
> Bu doküman geçişin somut planı + karar noktaları.

## NE TAŞINIYOR / NE KALIYOR
| Parça | Şu an | Geçişte |
|---|---|---|
| Kimlik (Google + e-posta/şifre + reset) | Supabase Auth | **Firebase Auth** |
| profiles (ad/soyad/telefon/doğum/cinsiyet) | Postgres tablo + RLS | **Firestore** `users/{uid}` |
| İlerleme (SRS/sicil/sınav snapshot) | `kullanici_ilerleme` + senkron.ts | **Firestore** `users/{uid}` alanı |
| Mükerrer e-posta engeli | RPC (eposta_kullanimda) | Firebase Auth zaten tek-e-posta-tek-hesap (RPC GEREKMEZ) |
| 30g soft-delete | profiles sütun + cron | Firestore alan + Cloud Function (sonra) |
| Sızmış-şifre (HIBP) | kod (platform-bağımsız) | **AYNEN KALIR** ✅ |
| İçerik görseller | R2 + Supabase Storage | **R2'de KALIR** (resolver değişmez) |
| Bildirim | Firebase FCM | aynen |
| Şifreli indirme (AES) | kod (platform-bağımsız) | **AYNEN KALIR** ✅ |

## KARAR 1 — SDK seçimi (önemli)
- **(A) Firebase JS SDK** (`firebase` npm) — **Expo Go'da çalışır**, native build şart değil.
  Auth persistence için `getReactNativePersistence(AsyncStorage)`. Google için mevcut
  `expo-auth-session` akışı → idToken → `signInWithCredential`. **Önerim bu** (en az build sancısı).
- (B) `@react-native-firebase` — native, daha cilalı ama **dev build ZORUNLU** + config plugin +
  build riski. FCM için zaten google-services.json var ama auth/firestore native ekler.

→ **Öneri: A (JS SDK).** Expo Go'da test ederiz, build riski yok.

## KARAR 2 — Zamanlama (dürüst)
Şu an **2 günlük yayın sprintindeyiz**, Supabase auth+içerik **çalışıyor**. Göç ~**1-1.5 gün** rework
(auth.ts, auth-context, profil, senkron yeniden yazılır). İki seçenek:
- **(a) Önce Supabase ile YAYINLA**, Firebase göçünü yayın-sonrası yap → sprint risksiz.
- **(b) Sprint'i durdur, ŞİMDİ göç et** → yayın 1-1.5 gün kayar ama tek platformla çıkarsın.
→ Kullanıcı kararı. (Kullanıcı açısından fark sıfır; bu teknik/ekip tercihi.)

## SENİN FIREBASE CONSOLE'DAN YAPACAKLARIN
1. [console.firebase.google.com](https://console.firebase.google.com) → proje **mevzu-jsps-59639**
2. **Authentication → Sign-in method** → **Email/Password** AÇ + **Google** AÇ
3. **Firestore Database → Create database** → **production mode** → bölge **eur3 (Avrupa)** (KVKK)
4. **Project settings → General → Your apps → Web app** ekle (yoksa) → **firebaseConfig** değerlerini al:
   `apiKey · authDomain · projectId · storageBucket · messagingSenderId · appId`
   → bunlar `.env`'e (EXPO_PUBLIC_FIREBASE_*) — gizli değil ama .env'de dursun.
5. Google sign-in için **OAuth Web Client ID** (zaten Supabase için vardı; Firebase Auth → Google
   provider'da Web SDK config'i kullanır).

## İŞ ADIMLARI (geçişte, ben yaparım)
1. `firebase` JS SDK kur + `lib/firebase.ts` (initializeApp + initializeAuth[AsyncStorage] + getFirestore).
2. `lib/auth.ts` Firebase Auth'a çevir: gmailIleGiris (signInWithCredential), epostaGiris/Kayit,
   sifreSifirla (sendPasswordResetEmail), cikisYap (signOut).
3. `auth-context.tsx` → `onAuthStateChanged`.
4. profilGetir/Kaydet → Firestore (`doc(users/{uid})` get/set merge).
5. `senkron.ts` → Firestore (snapshot alanı; merge stratejisi aynı kalır — SRS max, log/sicil yeni-cihaz).
6. Firestore **Security Rules**: `match /users/{uid} { allow read,write: if request.auth.uid == uid }`.
7. Supabase kodu kaldır/dormant (lib/supabase, RLS SQL'leri arşiv).
8. tsc 0 + uçtan uca test (giriş, profil, sync, çıkış).

## RISKLER
- Google sign-in Expo Go'da JS SDK + expo-auth-session entegrasyonu (idToken alma) — test gerek.
- Auth persistence (RN'de `getReactNativePersistence`) doğru kurulmazsa oturum kaybolur.
- Mevcut Supabase'deki test kullanıcıları taşınmaz (yeni Firebase hesapları) — kapalı testte sorun değil.
- expo-asset 12.0.13 pini — firebase JS SDK saf-JS, native çakışma beklenmiyor (yine de expo-doctor).
