/**
 * Web imzalı-içerik önbelleğine yeni URL düşünce bileşeni yeniden çizdirir.
 * Native'de fiilen no-op (dinleyici hiç tetiklenmez); koşulsuz çağrılabilir.
 */
import { useEffect, useState } from 'react';

import { imzaliDinle } from '@/lib/imzali-cache';

export function useImzaliTazele(): void {
  const [, setSayac] = useState(0);
  useEffect(() => imzaliDinle(() => setSayac((n) => n + 1)), []);
}
