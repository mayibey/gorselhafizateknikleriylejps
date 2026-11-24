-- 24 Kas 2026: haftalık şampiyon duyurusu. "kahraman" hitabı yasak → "komutanım".
CREATE OR REPLACE FUNCTION public.er_meydani_haftalik_takdir()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_hafta text := public.er_meydani_hafta(now() - interval '7 days');
  v_sampiyon uuid; v_puan int;
BEGIN
  SELECT h.oyuncu_id, h.puan INTO v_sampiyon, v_puan
  FROM public.er_meydani_haftalik_puan h
  WHERE h.hafta = v_hafta AND h.puan > 0
  ORDER BY h.puan DESC, h.guncelleme ASC LIMIT 1;
  IF v_sampiyon IS NULL THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM public.duyurular WHERE link = 'sampiyon:'||v_hafta AND hedef_user_id = v_sampiyon) THEN
    RETURN;
  END IF;
  INSERT INTO public.duyurular (baslik, metin, hedef, aktif, hedef_user_id, link)
  VALUES (
    '🏆 Haftanın Şampiyonu!',
    'Tebrikler komutanım! Geçen hafta Er Meydanı''nda '||v_puan||' puanla ŞAMPİYON oldun. Meydan senindi — bu hafta da zirveyi kimseye bırakma! ⚔️',
    'herkes', true, v_sampiyon, 'sampiyon:'||v_hafta
  );
END;
$function$;
