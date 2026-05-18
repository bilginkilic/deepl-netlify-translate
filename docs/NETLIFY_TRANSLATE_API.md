# Netlify çeviri proxy API — entegrasyon notları

Bu servis DeepL **v2/translate** endpoint’ine sunucu taraflı köprü görevi görür. DeepL’e doğrudan gitmek yerine tek bir URL üzerinden çağırırsınız.

**Örnek canlı adres:** `https://willowy-sable-701ced.netlify.app`  
(Aşağıdaki örneklerde `{BASE}` yerine kendi Netlify sitenizin kök URL’sini yazın.)

---

## Kimlik doğrulama (DeepL anahtarı)

- **Netlify’da DeepL anahtarı saklanmaz.** Her istekte siz gönderirsiniz.
- Üç yöntemden **biri** yeterli (önerilen: header):

| Yöntem | Nasıl |
|--------|--------|
| **1. Önerilen** | Header: `Authorization: DeepL-Auth-Key <DeepL_API_KEY>` |
| **2.** | Header: `X-DeepL-Auth-Key: <DeepL_API_KEY>` |
| **3.** | JSON gövde: `"auth_key": "<DeepL_API_KEY>"` (DeepL’e iletilmez, sadece proxy okur) |

**Güvenlik:** Üretimde mümkünse anahtarı yalnızca kendi sunucunuzda (PHP, backend vb.) tutun; tarayıcıya gömmeyin.

---

## Uç nokta

| Metod | Yol | Açıklama |
|--------|-----|----------|
| `GET` | `{BASE}/api/translate` | Kısa bilgi + varsayılan parametre özeti (test için) |
| `POST` | `{BASE}/api/translate` | Çeviri isteği |

İçerik tipi: **`Content-Type: application/json`**

---

## POST gövdesi (JSON)

### Zorunlu alanlar

| Alan | Tip | Açıklama |
|------|-----|----------|
| `text` | `string` veya `string[]` | Çevrilecek metin; dizi ise DeepL toplu çeviri |
| `target_lang` | `string` | Hedef dil (ör. `TR`, `EN`, `DE`) |

### İsteğe bağlı alanlar

| Alan | Açıklama |
|------|----------|
| `source_lang` | Kaynak dil; verilmezse DeepL tahmin eder |

Proxy ayrıca aşağıdaki DeepL seçeneklerini **gövdede verirseniz** DeepL’e iletir (detay: [DeepL Translate API](https://developers.deepl.com/docs/api-reference/translate)):  
`context`, `split_sentences`, `preserve_formatting`, `formality`, `glossary_id`, `model_type`, `tag_handling`, `show_billed_characters`, `outline_detection`, `non_splitting_tags`, `splitting_tags`, `ignore_tags`.

---

## Sunucunun eklediği varsayılanlar (önemli)

İstemci **aşağıdakileri JSON’da göndermese bile** proxy DeepL isteğine bunları ekler:

| Parametre | Varsayılan değer | Ne işe yarar |
|-----------|------------------|--------------|
| `tag_handling` | `html` | HTML etiketlerini korur (etiket içeriği çevrilir) |
| `preserve_formatting` | `1` | Biçimlendirmeyi korumaya çalışır |
| `show_billed_characters` | `1` | Yanıtta faturalanan karakter bilgisini istemeye yönelik DeepL parametresi |

Aynı alanları JSON’da **siz gönderirseniz**, gönderdiğiniz değer varsayılanın **üzerine yazar**.

---

## Örnek: Tüm iletilebilen parametreler (tek istekte hepsi)

Bu proxy, aşağıdaki JSON alanlarını ( `auth_key` hariç; o DeepL’e gitmez ) DeepL isteğine aktarır. **Günlük kullanımda** yalnızca `text` ve `target_lang` yeterli; diğerleri ihtiyaca göre eklenir.

### Örnek JSON gövde

```json
{
  "text": "<p>Hello <strong>world</strong>.</p><p>Second line.</p>",
  "target_lang": "TR",
  "source_lang": "EN",
  "context": "Kısa sipariş onayı metni; kullanıcıya nazik ton.",
  "split_sentences": "nonewlines",
  "preserve_formatting": "1",
  "formality": "default",
  "glossary_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "model_type": "quality_optimized",
  "tag_handling": "html",
  "show_billed_characters": "1",
  "outline_detection": "false",
  "non_splitting_tags": "code,pre",
  "splitting_tags": "p,div",
  "ignore_tags": "script,style"
}
```

*( `glossary_id` yerine hesabınızda gerçekten var olan bir sözlük UUID’si kullanın; yoksa bu alanı göndermeyin veya kaldırın. )*

### Alan sözlüğü — şu anki değer / ne işe yarar / başka seçenekler

| JSON alanı | Örnekteki değer | Ne anlama gelir | Başka ne verilebilir / not |
|------------|-----------------|------------------|----------------------------|
| `text` | HTML paragraflar | Çevrilecek metin; faturalandırma buna göre. | `string` veya **string dizisi** (en fazla 50 parça; sıra korunur). Dizide her öğe bağımsız çevrilir. |
| `target_lang` | `TR` | Hedef dil kodu. | `DE`, `EN`, `EN-US`, `PT-BR` vb. — [DeepL desteklenen diller](https://developers.deepl.com/docs/getting-started/supported-languages). |
| `source_lang` | `EN` | Kaynak dil (biliniyorsa). | Boş bırakılabilir; DeepL otomatik tespit eder (maliyet/limit yine `text` üzerinden). Kaynak+dil çifti **sözlük** kullanırken gerekebilir. |
| `context` | Uzun bir cümle | Çevril**meyen** ek bağlam; kısa UI metinlerinde kaliteyi iyileştirebilir. | Genelde birkaç tam cümle, kaynak dille aynı dilde. Boyut sınırı tüm gövdeye göre (DeepL’de ~128 KiB üst limit). **Faturalandırmaya dahil değil.** |
| `split_sentences` | `nonewlines` | Cümle bölme davranışı. | `0` = hiç bölme (tek parça; çok uzun metinlerde risk). `1` = noktalama **ve** satır sonlarında böl. `nonewlines` = sadece noktalama (HTML’de yaygın). *Next-gen modelde DeepL bazı değerleri yine kendi optimize ayarına çekebilir; bkz. resmi dokü.* |
| `preserve_formatting` | `1` | Noktalama ve büyük/küçük harf gibi biçimi korumaya çalış. | `"0"` veya `"1"` (form alanında). |
| `formality` | `default` | Resmiyet (dil desteğine bağlı). | `default`, `more`, `less`, `prefer_more`, `prefer_less` — **hedef dil** Almanca, Fransızca vb. destekliyorsa anlamlı; Türkçe gibi desteklenmeyen dilde `default` veya `prefer_*` kullanın, aksi halde DeepL hata dönebilir. |
| `glossary_id` | UUID | Hesabınızdaki **terim sözlüğü**. | Geçerli sözlük kimliği; `source_lang` genelde zorunlu; dil çifti eşleşmeli. |
| `model_type` | `quality_optimized` | Kalite mi, gecikme mi öncelik. | `latency_optimized` (düşük gecikme), `quality_optimized`, `prefer_quality_optimized`. *Bazı özellikler (ör. tag handling v2) kalite modelini zorunlu kılar.* |
| `tag_handling` | `html` | Yapılandırılmış içerik modu. | `html` veya `xml`. Göndermezseniz proxy yine `html` ekler; düz metin için genelde `tag_handling`’i **özellikle değiştirmeyin** ya da dokümana göre uygun değeri verin. |
| `show_billed_characters` | `1` | Yanıtta faturalanan karakter sayısını iste. | `"0"` / `"1"`. |
| `outline_detection` | `false` | Özellikle **XML** taslak algısı; otomatik anahat tespitini kapatıp etiketleri elle yönetmek için. | `true` / `false` (string olarak iletilir). HTML odaklı basit senaryolarda sıklıkla gönderilmez. |
| `non_splitting_tags` | `code,pre` | Bu XML/HTML etiketleri **içinde** cümle bölünmez. | Virgülle ayrılmış etiket adları. |
| `splitting_tags` | `p,div` | Bu etiketler yapı sınırı gibi davranır (XML/özel akış). | Virgülle ayrılmış. Dokümandaki örnekle uyumlu kullanın. |
| `ignore_tags` | `script,style` | İçeriği **çevrilmez**; yapı korunur. | `script`, `style` vb. |

**Header’da anahtar kullanıyorsanız** gövdede `auth_key` koymayın. Koyarsanız: proxy okur, DeepL gövdesine **eklenmez**.

Resmi davranış ve tüm edge case’ler için: [DeepL Translate API](https://developers.deepl.com/docs/api-reference/translate).

### Aynı gövde ile cURL

```bash
curl -sS -X POST 'https://willowy-sable-701ced.netlify.app/api/translate' \
  -H 'Content-Type: application/json' \
  -H "Authorization: DeepL-Auth-Key $DEEPL_AUTH_KEY" \
  -d @- <<'JSON'
{
  "text": "<p>Hello <strong>world</strong>.</p>",
  "target_lang": "TR",
  "source_lang": "EN",
  "context": "Order confirmation email.",
  "split_sentences": "nonewlines",
  "preserve_formatting": "1",
  "formality": "default",
  "model_type": "quality_optimized",
  "tag_handling": "html",
  "show_billed_characters": "1",
  "ignore_tags": "script,style"
}
JSON
```

*( `glossary_id` ve XML’e özel alanları ihtiyacınız yoksa çıkarın. )*

### Aynı gövde ile JavaScript

```javascript
const body = {
  text: "<p>Hello <strong>world</strong>.</p>",
  target_lang: "TR",
  source_lang: "EN",
  context: "Order confirmation email.",
  split_sentences: "nonewlines",
  preserve_formatting: "1",
  formality: "default",
  model_type: "quality_optimized",
  tag_handling: "html",
  show_billed_characters: "1",
  ignore_tags: "script,style",
};

const res = await fetch("https://willowy-sable-701ced.netlify.app/api/translate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `DeepL-Auth-Key ${process.env.DEEPL_AUTH_KEY}`,
  },
  body: JSON.stringify(body),
});
```

### Aynı gövde ile PHP

```php
<?php
$base = 'https://willowy-sable-701ced.netlify.app';
$key  = getenv('DEEPL_AUTH_KEY');
$payload = [
    'text'                   => '<p>Hello <strong>world</strong>.</p>',
    'target_lang'            => 'TR',
    'source_lang'            => 'EN',
    'context'                => 'Order confirmation email.',
    'split_sentences'        => 'nonewlines',
    'preserve_formatting'    => '1',
    'formality'              => 'default',
    'model_type'             => 'quality_optimized',
    'tag_handling'           => 'html',
    'show_billed_characters' => '1',
    'ignore_tags'            => 'script,style',
];
$ch = curl_init($base . '/api/translate');
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'Authorization: DeepL-Auth-Key ' . $key,
    ],
    CURLOPT_POSTFIELDS     => json_encode($payload),
    CURLOPT_TIMEOUT        => 60,
]);
$raw = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
$data = json_decode($raw, true);
```

---

## Başarılı yanıt

HTTP **200**. Gövde DeepL’in döndürdüğü JSON ile uyumludur; tipik olarak:

```json
{
  "translations": [
    {
      "detected_source_language": "EN",
      "text": "…çevrilmiş metin…",
      "billed_characters": 123
    }
  ]
}
```

`show_billed_characters=1` ve hesap/API desteği uygunsa `billed_characters` alanı görülebilir.

---

## Hata yanıtları (özet)

| HTTP | Örnek anlam |
|------|-------------|
| **401** | DeepL anahtarı eksik veya hiçbir desteklenen yöntemle gelmedi |
| **400** | JSON hatalı veya `text` / `target_lang` eksik |
| **405** | `GET`/`POST` dışı metod |
| **4xx/5xx** | DeepL veya ağ kaynaklı; gövdede genelde `message` veya DeepL’in hata nesnesi |

---

## Örnek: cURL

```bash
export DEEPL_AUTH_KEY='YOUR_KEY'

curl -sS -X POST '{BASE}/api/translate' \
  -H 'Content-Type: application/json' \
  -H "Authorization: DeepL-Auth-Key $DEEPL_AUTH_KEY" \
  -d '{
    "text": "<p>Hello world.</p>",
    "target_lang": "TR",
    "source_lang": "EN"
  }'
```

Varsayılanları kullanır (`tag_handling=html` vb.); ekstra parametre göndermenize gerek yok.

### Varsayılanları el ile ezme örneği

```json
{
  "text": "Plain text",
  "target_lang": "DE",
  "tag_handling": "xml",
  "preserve_formatting": "0",
  "show_billed_characters": "0"
}
```

*(Değerler ihtiyaca göre; DeepL dokümantasyonundaki geçerli değerlere uyun.)*

---

## Örnek: JavaScript (fetch)

```javascript
const res = await fetch("{BASE}/api/translate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `DeepL-Auth-Key ${apiKey}`,
  },
  body: JSON.stringify({
    text: "<p>Hello</p>",
    target_lang: "TR",
    source_lang: "EN",
  }),
});
const data = await res.json();
if (!res.ok) throw new Error(JSON.stringify(data));
console.log(data.translations[0].text);
```

---

## Örnek: Postman

1. **POST** → `{BASE}/api/translate`
2. **Headers:** `Content-Type: application/json`, `Authorization: DeepL-Auth-Key <KEY>`
3. **Body → raw → JSON:** en az `text` ve `target_lang`

---

## CORS

Tarayıcıdan çağrıda sunucu `Access-Control-Allow-Origin` döner (varsayılan genelde `*`). Gerekirse Netlify tarafında `CORS_ORIGIN` ile sıkılaştırılabilir.

---

## Hızlı kontrol listesi (entegrasyon için)

1. `{BASE}` doğru mu?  
2. `POST` + JSON gövde + `Content-Type: application/json`  
3. DeepL anahtarı her istekte `Authorization` (veya diğer desteklenen yöntemler) ile gidiyor mu?  
4. HTML içerik çeviriyorsanız varsayılan `tag_handling=html` genelde yeterli; özel davranış için gövdede override edin.  
5. Maliyet/limit takibi için yanıttaki `billed_characters` alanına bakın (API/hesap koşullarına bağlı).
