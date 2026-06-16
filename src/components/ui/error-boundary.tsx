import { Component, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/empty-state';
import { Palette } from '@/constants/theme';

type Props = { children: ReactNode };
type State = { hata: boolean };

/**
 * Global hata sınırı: alt ağaçta beklenmedik bir render hatası olursa uygulama
 * komple çökmek yerine "Tekrar dene" ekranı gösterir. React error boundary'leri
 * sınıf bileşeni olmak zorunda.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hata: false };

  static getDerivedStateFromError(): State {
    return { hata: true };
  }

  componentDidCatch(error: unknown) {
    // Yalnız geliştirmede konsola (üretimde sessiz; ileride uzak loglama eklenebilir).
    if (__DEV__) console.error('ErrorBoundary yakaladı:', error);
  }

  private sifirla = () => this.setState({ hata: false });

  render() {
    if (this.state.hata) {
      return (
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
          <EmptyState
            ikon="alert-circle-outline"
            ikonRenk="kirmizi"
            baslik="Bir şeyler ters gitti"
            aciklama="Beklenmedik bir hata oluştu. Tekrar deneyebilirsin."
            buton={{ etiket: 'Tekrar dene', onPress: this.sifirla }}
          />
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Palette.kremZemin,
  },
});
