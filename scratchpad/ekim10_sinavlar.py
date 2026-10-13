# 10 Ekim 2026 JSPS — değerlendirilen sınavlar. Yeni rütbe/branş gelince buraya bir satır eklenir.
# kb = uygulamadaki branşa göre karma deneme anahtarı, premium = premium deneme etiketi (o branş+rütbe görür).
# musterek = (ilk, son) mevzuat sorusu; branş son+1..100. kod = scratchpad/ekim10/<kod>/ ve sitedeki dosya adı.
SINAVLAR = {
    'subay-mebs':    {'rutbe': 'subay',    'ad': 'Subay — MEBS',    'kisa': 'MEBS', 'baslik': '2026 Subay MEBS Sınavı',    'dosya': 'Subay MEBS',    'musterek': (21, 70), 'brans': 'MEBS Branş Mevzuatı', 'kb': 'mebs', 'premium': 'MEBS Subay'},
    'astsubay-mebs': {'rutbe': 'astsubay', 'ad': 'Astsubay — MEBS', 'kisa': 'MEBS', 'baslik': '2026 Astsubay MEBS Sınavı', 'dosya': 'Astsubay MEBS', 'musterek': (21, 70), 'brans': 'MEBS Branş Mevzuatı', 'kb': 'mebs', 'premium': 'MEBS Astsubay'},
    'subay-bakim':   {'rutbe': 'subay', 'ad': 'Subay — Bakım', 'kisa': 'Bakım', 'baslik': '2026 Subay Bakım Sınavı', 'dosya': 'Subay Bakim', 'musterek': (21, 60), 'brans': 'Bakım Branş Mevzuatı', 'kb': 'bakim', 'premium': 'Bakım Subay', 'ortak_kaynak': 'subay-mebs'},
    'subay-jandarma': {'rutbe': 'subay', 'ad': 'Subay — Jandarma', 'kisa': 'Jandarma', 'baslik': '2026 Subay Jandarma Sınavı', 'dosya': 'Subay Jandarma', 'musterek': (21, 60), 'brans': 'Jandarma Branş Mevzuatı', 'kb': 'jandarma', 'premium': 'Jandarma Subay', 'ortak_kaynak': 'subay-mebs'},
    'subay-maliye':  {'rutbe': 'subay', 'ad': 'Subay — Maliye', 'kisa': 'Maliye', 'baslik': '2026 Subay Maliye Sınavı', 'dosya': 'Subay Maliye', 'musterek': (21, 60), 'brans': 'Maliye Branş Mevzuatı', 'kb': 'maliye', 'premium': 'Maliye Subay', 'ortak_kaynak': 'subay-mebs'},
    'subay-personel': {'rutbe': 'subay', 'ad': 'Subay — Personel', 'kisa': 'Personel', 'baslik': '2026 Subay Personel Sınavı', 'dosya': 'Subay Personel', 'musterek': (21, 60), 'brans': 'Personel Branş Mevzuatı', 'kb': 'personel', 'premium': 'Personel Subay', 'ortak_kaynak': 'subay-mebs'},
    'astsubay-jandarma': {'rutbe': 'astsubay', 'ad': 'Astsubay — Jandarma', 'kisa': 'Jandarma', 'baslik': '2026 Astsubay Jandarma Sınavı', 'dosya': 'Astsubay Jandarma', 'musterek': (21, 60), 'brans': 'Jandarma Branş Mevzuatı', 'kb': 'jandarma', 'premium': 'Jandarma Astsubay', 'ortak_kaynak': 'astsubay-mebs'},
    'uzman-erbas': {'rutbe': 'uzmanerbas', 'ad': 'Uzman Erbaş — Jandarma / SG', 'kisa': 'Jandarma / SG', 'baslik': '2026 Uzman Erbaş Sınavı', 'dosya': 'Uzman Erbas', 'musterek': (21, 60), 'brans': 'Branş Mevzuatı', 'kb': 'jandarma-uzm', 'premium': 'Jandarma Uzman Erbaş'},
}
RUTBE_AD = {'subay': 'Subay', 'astsubay': 'Astsubay', 'uzmanerbas': 'Uzman Erbaş'}
