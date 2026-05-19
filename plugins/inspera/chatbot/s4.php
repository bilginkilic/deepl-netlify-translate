<?php

$url    = 'https://deepl-netlify-translate.onrender.com/api/translate';
$apiKey = 'cac094d9-7f39-441b-b3ee-38a19ce7fe01:fx';
$texts = [
    "Livaneli Sahne / Tiyatro / 15 Mayıs 2025",
    "Berna Laçin Hayal Satıcısı",
    "Detaylarını Göster",
    "Livaneli Sahne / Tiyatro / 15 Mayıs 2025",
    "Berna Laçin Hayal Satıcısı",
    "Detaylarını Göster",
    "Akademi / Atölye",
    "Art Academy Yaz Okulu Başlıyor",
    "Inspera Art Academy'nin Yaz Okulu, 4-6 ve 7-11 yaş gruplarına özel atölyeleriyle 4 Ağustos'ta başlıyor. Sanat, yaratıcılık, keşif ve eğlence dolu ..",
    "AKADEMİ TAKVİMİ",
    "Voyn Kitchen & Bar / Kahvaltı / Yemek / Kokteyl",
    "Voyn Kitchen & Bar'da Herşey Doğadan, Kendi Bahçemizden",
    "<p>Doğadan sofraya uzanan bir yolculuğun izinden gidiyor, her tabakta tazeliği, yerel dokunuşları yaşatıyoruz.</p>",
    "Voyn Kitchen & Bar Menü",
    "Akşam Yemeği Rezervasyonu Yap",
    "Kahvaltı Rezervasyonu Yap",
    "Voyn'da her şey doğada başlar ve sofranıza ulaşana dek bir yolculuğa çıkar. Bodrum'un kalbinde konumlanan Voyn Kitchen & Bar, sadece bir yemek mekânı değil; samimi bir davet, güzel yemekler ve anlamlı anlarla paylaşılan yerel bir selamdır.",
    "Voyn'da Bu Ay;<br>Her Cuma 20.00'de Retro Night!",
    "Retro Nedir",
    "Retro Night Rezervasyon Yap",
    "Etkinlik / Konser / Söyleşi",
    "Zülfü Livaneli, Pınar Sabancı x Söyleşi",
    "Pınar Sabancı'nın moderatörlüğünde Zülfü Livaneli ile gerçekleştireceğimiz \"Cumhuriyet: Kuldan Yurttaş Yaratmak\" başlıklı söyleşide ...",
    "ETKİNLİK TAKVİMİ",
    "Etkinlik / Konser / Stand-Up / Söyleşi / Tiyatro / Dans / Interactive Show",
    "Mini Sahne'den Livaneli'ye, Hayat Sahnede!",
    "ETKİNLİK TAKVİMİ",
    "Voyn Kitchen & Bar",
    "Bahçeden Masaya Organik Kahvaltı",
    "Doğadan ilham alan tatlar, samimi bir atmosfer ve paylaşmaya değer sofralar Voyn Kitchen'da. Bahçeden Masaya mottosu ile hep taze hep ...",
    "VOYN KITCHEN & BAR",
    "Inspera Bodrum'da;",
    "Etkinlikler & Atölyeler & Deneyimler",
    "Inspera Bodrum | Kültür & Sanat Merkezi",
    "Sanatın, müziğin ve doğanın buluştuğu; konserler, sergiler, Etkinlikler ve atölyelerle Bodrum'da yaşayan kültür merkezi.",
    "Kültür & Sanat Merkezi",
    "<p>Inspera Bodrum, Bodrum'un kalbinde kültür, sanat ve gastronominin buluştuğu çok yönlü bir yaşam alanıdır. Konserler, sergiler, tiyatro gösterileri, atölyeler ve daha fazlası...</p>",
    "INSPERA BODRUM HAKKINDA",
    "NASIL GELİNİR?",
    "Art Academy / Atölyeler / Sanat Akademisi / Eğitim",
    "Hayal Gücüne Yolculuk: Sanat ve Akademi",
    "AKADEMİ TAKVİMİ",
    "AKADEMİ TAKVİMİ",
    "Tiyatro / Eğitim / Sahne Sanatları",
    "Inspera Tiyatrosu ile Sahne Sanatlarının Büyüsünü Keşfedin",
    "<p>Inspera Tiyatrosu, profesyonel eğitmenler eşliğinde çocuklara ve yetişkinlere sahne sanatlarını keşfetme fırsatı sunar.</p>",
    "Tiyatro Eğitimi",
    "Inspera Çocuk Tiyatrosu",
    "Çocuk Tiyatrosu / Oyunlar / Sahne" 
  
];
$body = [
    'text'        => $texts,
    'target_lang' => 'RU',
    'source_lang' => 'TR',
];

echo "İstek gönderiliyor: $url\n";
$start = microtime(true);

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER         => true,
    CURLOPT_HTTPHEADER     => [
        'Authorization: DeepL-Auth-Key ' . $apiKey,
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS     => json_encode($body),
    CURLOPT_TIMEOUT        => 60,
    CURLOPT_CONNECTTIMEOUT => 15,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => false,
]);

$response   = curl_exec($ch);
$httpCode   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$ip         = curl_getinfo($ch, CURLINFO_PRIMARY_IP);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$curlError  = curl_error($ch);
curl_close($ch);

$elapsed = round(microtime(true) - $start, 2);
$headers = substr($response, 0, $headerSize);
$body    = substr($response, $headerSize);

echo "HTTP Status  : $httpCode\n";
echo "Bağlanılan IP: $ip\n";
echo "Süre         : {$elapsed}s\n";

if ($curlError) echo "CURL HATA: $curlError\n";

echo "\n--- HEADERS ---\n$headers";
echo "\n--- BODY ---\n$body\n";