# Örnek: INSPERA / Tailor `sections` kayıtları — `content_value` JSON çevirisi (PHP)

Kayıt dizisinde her elemanda `content_value` bir **JSON string**. İçerideki insan dili alanları **TR → EN** çevrilir; `background_color`, `color`, `button_link` (URL) **değiştirilmez**. `content` alanı **HTML** kabul edilir (Netlify proxy zaten varsayılan `tag_handling=html` ile uyumludur).

## Girdi yapısı (özet)

- `content_value` örneği:  
  `{"section_toptitle":"…","section_title":"…","background_color":"#…","color":"#…",...,"content":"…HTML…","button_text":"…","button_link":"…"}`
- **Çevrilecek anahtarlar:** `section_toptitle`, `section_title`, `content`, `button_text`
- **Atlanan:** `background_color`, `color`, `button_link` (ve olmayan anahtarlar)

Boş string (`""`) istek yükünü azaltmak için bu örnekte **çevrilmiyor**.

## Çok istek yerine tek çağrı (`text` = dizi)

Netlify proxy gövdesinde `"text": [ "a", "b", "c" ]` gönderirseniz DeepL **aynı yanıtta** aynı sırada çevirileri döndürür. Tüm `sections` satırlarındaki metinleri önce tek dizide toplayıp **bir veya birkaç** istekle (aşağıda 50’lik dilimle) göndermek, satır başına ayrı HTTP çağrısından daha verimlidir.

DeepL dokümantasyonunda tek istekte **en fazla 50** `text` değeri olduğu varsayılır; daha fazla segment varsa döngüde dilimleyin.

## PHP örneği

```php
<?php

declare(strict_types=1);

/**
 * Netlify DeepL proxy — çoklu metin aynı dil çiftinde.
 */
function translateBatchNetlify(
    string $netlifyBaseUrl,
    string $deeplAuthKey,
    array $texts,
    string $sourceLang,
    string $targetLang,
): array {
    if ($texts === []) {
        return [];
    }

    $url = rtrim($netlifyBaseUrl, '/') . '/api/translate';
    $payload = [
        'text'        => $texts,
        'source_lang' => $sourceLang,
        'target_lang' => $targetLang,
    ];

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Authorization: DeepL-Auth-Key ' . $deeplAuthKey,
        ],
        CURLOPT_POSTFIELDS     => json_encode($payload, JSON_UNESCAPED_UNICODE),
        CURLOPT_TIMEOUT        => 120,
    ]);

    $raw = curl_exec($ch);
    $http = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_errno($ch);
    curl_close($ch);

    if ($err !== 0) {
        throw new RuntimeException('cURL error: ' . $err);
    }

    $data = json_decode((string) $raw, true, 512, JSON_THROW_ON_ERROR);
    if ($http < 200 || $http >= 300) {
        throw new RuntimeException('HTTP ' . $http . ': ' . $raw);
    }

    $out = [];
    foreach ($data['translations'] ?? [] as $t) {
        $out[] = $t['text'];
    }
    if (count($out) !== count($texts)) {
        throw new RuntimeException('Translation count mismatch');
    }

    return $out;
}

/**
 * Tek bir content_value nesnesinde sadece seçili anahtarları çevirir; renk ve link aynı kalır.
 *
 * @param  array<string, mixed> $decoded content_value json_decode sonucu
 * @return array<string, mixed> çevrilmiş yapı
 */
function translateContentValueBlock(
    array $decoded,
    string $netlifyBase,
    string $deeplKey,
    string $sourceLang,
    string $targetLang,
): array {
    /** @var list<string> Çevrilecek metin anahtarları (Tailor blueprint’e göre genişletin) */
    $textKeys = ['section_toptitle', 'section_title', 'content', 'button_text'];

    $batch = [];
    $order = [];

    foreach ($textKeys as $key) {
        if (!array_key_exists($key, $decoded)) {
            continue;
        }
        $val = $decoded[$key];
        if (!is_string($val) || $val === '') {
            continue;
        }
        $batch[] = $val;
        $order[] = $key;
    }

    if ($batch === []) {
        return $decoded;
    }

    $translated = translateBatchNetlify(
        $netlifyBase,
        $deeplKey,
        $batch,
        $sourceLang,
        $targetLang,
    );

    foreach ($order as $i => $key) {
        $decoded[$key] = $translated[$i];
    }

    return $decoded;
}

/**
 * API’den / veritabanından gelen satır listesini işler; content_value string olarak güncellenir.
 *
 * @param  list<array<string,mixed>> $rows
 * @return list<array<string,mixed>>
 */
function translateSectionRows(
    array $rows,
    string $netlifyBase,
    string $deeplKey,
    string $sourceLang = 'TR',
    string $targetLang = 'EN',
): array {
    foreach ($rows as $idx => $row) {
        if (!isset($row['content_value']) || !is_string($row['content_value'])) {
          continue;
        }

        $decoded = json_decode($row['content_value'], true, 512, JSON_THROW_ON_ERROR);
        if (!is_array($decoded)) {
            throw new RuntimeException('content_value JSON object değil, id=' . ($row['id'] ?? $idx));
        }

        $decoded = translateContentValueBlock(
            $decoded,
            $netlifyBase,
            $deeplKey,
            $sourceLang,
            $targetLang,
        );

        $rows[$idx]['content_value'] = json_encode(
            $decoded,
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES,
        );
    }

    return $rows;
}

/**
 * Tüm satırlardaki çevrilebilir metinleri tek seferde (veya 50’şer parça) çevirir — HTTP isteği sayısını minimize eder.
 *
 * @param  list<array<string,mixed>> $rows
 * @return list<array<string,mixed>>
 */
function translateSectionRowsBatched(
    array $rows,
    string $netlifyBase,
    string $deeplKey,
    string $sourceLang = 'TR',
    string $targetLang = 'EN',
    int $maxTextsPerRequest = 50,
): array {
    $textKeys = ['section_toptitle', 'section_title', 'content', 'button_text'];

    /** @var array<int, array<string, mixed>> decodedByRowIndex */
    $decodedByRow = [];

    foreach ($rows as $r => $row) {
        if (!isset($row['content_value']) || !is_string($row['content_value'])) {
            continue;
        }
        $decoded = json_decode($row['content_value'], true, 512, JSON_THROW_ON_ERROR);
        if (!is_array($decoded)) {
            throw new RuntimeException('content_value JSON object değil, id=' . ($row['id'] ?? $r));
        }
        $decodedByRow[$r] = $decoded;
    }

    $batch = [];
    /** @var list<array{r:int,k:string}> $slots */
    $slots = [];

    foreach ($decodedByRow as $r => $decoded) {
        foreach ($textKeys as $key) {
            if (!array_key_exists($key, $decoded)) {
                continue;
            }
            $val = $decoded[$key];
            if (!is_string($val) || $val === '') {
                continue;
            }
            $batch[] = $val;
            $slots[] = ['r' => $r, 'k' => $key];
        }
    }

    $total = count($batch);
    for ($offset = 0; $offset < $total; $offset += $maxTextsPerRequest) {
        $sliceBatch = array_slice($batch, $offset, $maxTextsPerRequest);
        $sliceSlots = array_slice($slots, $offset, $maxTextsPerRequest);
        $translated = translateBatchNetlify(
            $netlifyBase,
            $deeplKey,
            $sliceBatch,
            $sourceLang,
            $targetLang,
        );
        foreach ($sliceSlots as $i => $slot) {
            $decodedByRow[$slot['r']][$slot['k']] = $translated[$i];
        }
    }

    foreach ($decodedByRow as $r => $decoded) {
        $rows[$r]['content_value'] = json_encode(
            $decoded,
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES,
        );
    }

    return $rows;
}

// --- Kullanım: örnek veri (veritabanı/API çıktısı ile aynı şekil) ---

$netlifyBase = getenv('NETLIFY_TRANSLATE_BASE') ?: 'https://willowy-sable-701ced.netlify.app';
$deeplKey    = getenv('DEEPL_AUTH_KEY') ?: '';

$rows = [
    [
        'id' => 394,
        'host_id' => 70,
        'host_field' => 'sections',
        'site_id' => null,
        'content_group' => 'infobox_basic',
        'content_value' => json_encode([
            'section_toptitle' => 'Üst Başlık',
            'section_title'    => 'Başlık',
            'background_color' => '#e74c3c',
            'color'            => '#adf033',
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        'content_spawn_path' => 'Tailor\\Models\\EntryRecord@turkuaz-page.sections:infobox_basic',
        'parent_id' => null,
        'sort_order' => 1,
        'created_at' => '2026-05-18 07:13:54',
        'updated_at' => '2026-05-18 07:15:11',
    ],
    [
        'id' => 384,
        'host_id' => 70,
        'host_field' => 'sections',
        'site_id' => null,
        'content_group' => 'page_header',
        'content_value' => json_encode([
            'section_toptitle' => 'Üst Başlık',
            'section_title'    => 'Başlık',
            'background_color' => null,
            'color'            => null,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        'content_spawn_path' => 'Tailor\\Models\\EntryRecord@turkuaz-page.sections:page_header',
        'parent_id' => null,
        'sort_order' => 2,
        'created_at' => '2026-05-18 06:52:07',
        'updated_at' => '2026-05-18 07:15:11',
    ],
    [
        'id' => 381,
        'host_id' => 70,
        'host_field' => 'sections',
        'site_id' => null,
        'content_group' => 'content',
        'content_value' => json_encode([
            'section_toptitle' => '',
            'section_title'    => '',
            'background_color' => null,
            'color'            => null,
            'content'          => '<h1>Zaman Bahçesi</h1><p>INSPERA BODRUM KÜLTÜR SANAT, Dr. Öğretim Üyesi Nevin Yalçın Beldan küratörlüğünde hazırlanan “Zaman Bahçesi” başlıklı karma sergiyi ziyaretçiyle buluşturuyor. INSPERA BODRUM KÜLTÜR SANAT Art Space’te 14 Nisan – 28 Mayıs tarihleri arasında gerçekleşecek sergi; resim, heykel, seramik ve video enstalasyon gibi farklı tekniklerde üretilmiş eserleri bir araya getirerek izleyiciye kapsamlı bir seçki sunuyor.</p>',
            'button_text'      => '',
            'button_link'      => '',
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        'content_spawn_path' => 'Tailor\\Models\\EntryRecord@turkuaz-page.sections:content',
        'parent_id' => null,
        'sort_order' => 3,
        'created_at' => '2026-05-18 06:30:39',
        'updated_at' => '2026-05-18 07:15:11',
    ],
];

// Tek HTTP isteğinde (bu örnekte 5 metin segmenti = 1 çağrı); çok sayıda segmentte 50’lik dilimler
$out = translateSectionRowsBatched($rows, $netlifyBase, $deeplKey, 'TR', 'EN');

// Satır başına ayrı çağrı isterseniz: translateSectionRows(...)
echo json_encode($out, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . PHP_EOL;
```

## Notlar

1. **Blueprint farklı alanlar** kullanıyorsa `$textKeys` listesini güncelleyin; renk / link / boolean için anahtar eklemeyin.
2. **`content` içi HTML** bir bütün olarak çevrilir; etiket isimleri korunur (`tag_handling` için bkz. [NETLIFY_TRANSLATE_API.md](./NETLIFY_TRANSLATE_API.md)).
3. **Önerilen:** `translateSectionRowsBatched` — tüm satırlardan toplanan metinler tek `text[]` isteğinde gider; 50’den fazla segment için otomatik dilimlenir. Eski `translateSectionRows` satır başına bir istek atar.
4. **Bağlam (`context`):** Toplu `text` dizisinde her parça birbirinden bağımsız çevrilir; aynı paragraf içi tutarlılık için DeepL `context` parametresi bu örnekte kullanılmıyor — ihtiyaç varsa metinleri birleştirip veya parça başı `context` desteği proxy’ye eklenecek şekilde tasarlanmalı (şu an tek ortak `context` ile gönderiliyor).
5. **`JSON_UNESCAPED_SLASHES`:** Veritabanında `/` kaçışı tutarlılığı için kullanıldı; CMS beklediği formata göre bayrakları ayarlayın.

## Ortam değişkenleri

```bash
export DEEPL_AUTH_KEY='your-key'
export NETLIFY_TRANSLATE_BASE='https://willowy-sable-701ced.netlify.app'
php example_script.php
```
