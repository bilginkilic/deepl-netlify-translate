# Örnek: Türkçe JSON içeriği İngilizceye çevirme (PHP + Netlify proxy)

Kaynak dil **TR**, hedef dil **EN**. İçerik **JSON**; sadece **string değerleri** çevrilir, anahtar yapısı korunur.

## Senaryo

Türkçe bir içerik parçası (ör. API alanı) JSON olarak geliyor. Tüm yapıyı tek metin olarak DeepL’e vermek anahtarları da çevirip JSON’u bozabilir; bu yüzden **string’leri topla → toplu çevir → aynı yere geri yaz** yaklaşımı kullanılır.

## Örnek içerik (TR)

```json
{
  "product": {
    "title": "El yapımı seramik kupa",
    "description": "İçeceğinizi sıcak tutar. Bulaşık makinesinde yıkanabilir."
  },
  "cta": "Sepete ekle"
}
```

## PHP: Netlify `/api/translate` ile toplu çeviri

Proxy çağrısı: `POST`, `Content-Type: application/json`, `Authorization: DeepL-Auth-Key …`.

Gövde: `text` = string dizisi, `source_lang` = `TR`, `target_lang` = `EN`. Yanıttaki `translations` **aynı sırada** döner.

```php
<?php

declare(strict_types=1);

/**
 * Netlify proxy: POST JSON, Authorization: DeepL-Auth-Key …
 */
function translateBatchNetlify(
    string $netlifyBaseUrl,
    string $deeplAuthKey,
    array $texts,
    string $sourceLang,
    string $targetLang,
): array {
    $url = rtrim($netlifyBaseUrl, '/') . '/api/translate';
    $payload = [
        'text'         => $texts,
        'target_lang'  => $targetLang,
        'source_lang'  => $sourceLang,
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
        CURLOPT_TIMEOUT        => 60,
    ]);

    $raw = curl_exec($ch);
    $http = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_errno($ch);
    curl_close($ch);

    if ($err !== 0) {
        throw new RuntimeException('cURL #' . $err);
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
 * JSON ağacındaki tüm stringleri sırayla listeler (basit örnek).
 * Üretimde SKU, id, e-posta vb. için whitelist / key-path filtresi ekleyin.
 */
function collectStrings(mixed $node, array &$list): void
{
    if (is_string($node)) {
        $list[] = $node;
        return;
    }
    if (is_array($node)) {
        foreach ($node as $v) {
            collectStrings($v, $list);
        }
    }
}

function applyStrings(mixed &$node, array &$translations, int &$i): void
{
    if (is_string($node)) {
        $node = $translations[$i++];
        return;
    }
    if (is_array($node)) {
        foreach ($node as &$v) {
            applyStrings($v, $translations, $i);
        }
    }
}

// --- Örnek kullanım: TR → EN ---

$netlifyBase = 'https://willowy-sable-701ced.netlify.app';
$authKey = getenv('DEEPL_AUTH_KEY') ?: '';

$turkishJson = <<<'JSON'
{
  "product": {
    "title": "El yapımı seramik kupa",
    "description": "İçeceğinizi sıcak tutar. Bulaşık makinesinde yıkanabilir."
  },
  "cta": "Sepete ekle"
}
JSON;

$data = json_decode($turkishJson, true, 512, JSON_THROW_ON_ERROR);

$flat = [];
collectStrings($data, $flat);

$enFlat = translateBatchNetlify($netlifyBase, $authKey, $flat, 'TR', 'EN');

$i = 0;
applyStrings($data, $enFlat, $i);

echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . PHP_EOL;
```

## Adım özeti

| Adım | Açıklama |
|------|-----------|
| 1 | `json_decode` ile diziye çevir |
| 2 | Çevrilecek string’leri derinlik sırasıyla topla |
| 3 | Tek istekte `text: string[]`, `source_lang: TR`, `target_lang: EN` |
| 4 | Dönen çevirileri aynı sırayla ağaca yaz |
| 5 | `json_encode` ile çıktı üret |

## Üretim notları

- **Whitelist:** Sadece `title`, `description` gibi alanları çevirin; ID ve URL’leri dokunmayın.
- **Anahtar:** `DEEPL_AUTH_KEY` ortam değişkeninde; repoya koymayın.
- **`tag_handling`:** Netlify proxy varsayılanı `html` ekler; düz metin JSON değerleri için gerekiyorsa istek gövdesinde override edin ([NETLIFY_TRANSLATE_API.md](./NETLIFY_TRANSLATE_API.md)).
- **Limit:** DeepL tek istekte çok sayıda `text` kabul eder; çok büyük listelerde parçalara bölün.

## İlgili doküman

- [NETLIFY_TRANSLATE_API.md](./NETLIFY_TRANSLATE_API.md) — uç nokta, auth, tüm parametreler
