import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';

/**
 * Tatbikat (deneme sınavı / quiz) v1'de GİZLİ — tek "yakında" ekranı.
 * Quiz altyapısı (/quiz rotası, lib/quiz.ts) kodda duruyor; içerik hazır olunca
 * burası tekrar kanun listesi + quiz başlatıcıya dönüştürülecek (git geçmişinde mevcut).
 */
export default function TatbikatScreen() {
  return (
    <Screen title="Tatbikat">
      <EmptyState
        ikon="clipboard-text-clock-outline"
        baslik="Yakında"
        aciklama="Deneme sınavları ve tatbikat bölümü yakında eklenecek."
      />
    </Screen>
  );
}
