/**
 * Cihaz kimliğini bir kez yükleyip bellekte tutan hook.
 * getCihazKimlik() modül-içi cache'li olduğu için her mount'ta AsyncStorage'a gitmez.
 */

import { useEffect, useState } from 'react';

import { getCihazKimlik } from '@/lib/cihaz-kimlik';

export function useCihazKimlik(): { kimlik: string | null } {
  const [kimlik, setKimlik] = useState<string | null>(null);

  useEffect(() => {
    let iptal = false;
    void getCihazKimlik().then((id) => {
      if (!iptal) setKimlik(id);
    });
    return () => {
      iptal = true;
    };
  }, []);

  return { kimlik };
}
