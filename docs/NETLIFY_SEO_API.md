# Netlify SEO optimize API — entegrasyon notları

Bu servis ham metni alıp Claude API (Haiku) ile SEO uyumlu **title**, **meta description**, **meta keywords**, **slug** ve **content_html** üretir. Anthropic anahtarı yalnızca sunucu tarafında (Netlify ortam değişkeni) tutulur; istemci göndermez.

**Örnek canlı adres:** `https://willowy-sable-701ced.netlify.app`  
(Aşağıdaki örneklerde `{BASE}` yerine kendi Netlify sitenizin kök URL’sini yazın.)

---

## Kimlik doğrulama

- **Anthropic API anahtarı Netlify’da saklanır:** `ANTHROPIC_API_KEY`
- İstemci isteğinde anahtar gönderilmez; tüm çağrılar backend proxy üzerinden yapılır.
- Üretimde anahtarı yalnızca Netlify dashboard → Site settings → Environment variables altında tanımlayın.

İsteğe bağlı ortam değişkenleri:

| Değişken | Varsayılan | Açıklama |
|----------|------------|----------|
| `SEO_MODEL` | `claude-haiku-4-5-20251001` | Kullanılacak Claude modeli |
| `SEO_MAX_TOKENS` | `2048` | Maksimum çıktı token limiti |
| `CORS_ORIGIN` | `*` | CORS `Access-Control-Allow-Origin` |

---

## Uç nokta

| Metod | Yol | Açıklama |
|--------|-----|----------|
| `GET` | `{BASE}/api/seo-optimize` | Kısa servis bilgisi (model, gövde şeması) |
| `POST` | `{BASE}/api/seo-optimize` | SEO optimizasyon isteği |
| `OPTIONS` | `{BASE}/api/seo-optimize` | CORS preflight |

İçerik tipi: **`Content-Type: application/json`**

---

## POST gövdesi (JSON)

### Zorunlu alanlar

| Alan | Tip | Açıklama |
|------|-----|----------|
| `raw_text` | `string` | Kullanıcının yapıştırdığı ham yazı metni |

### Uzunluk sınırı

- `raw_text` en fazla **24000 karakter** olabilir; aşılırsa HTTP **413** döner.

---

## Başarılı yanıt

HTTP **200**. Gövde:

```json
{
  "title": "SEO uyumlu başlık (50-60 karakter)",
  "meta_description": "SEO uyumlu açıklama (150-160 karakter)",
  "meta_keywords": "anahtar, kelime, listesi, virgülle, ayrılmış",
  "slug": "seo-uyumlu-url-slug",
  "content_html": "<h1>...</h1><p>...</p><h2>...</h2>..."
}
```

- `slug` sunucuda Türkçe transliteration (ö→o, ş→s, ü→u vb.) ve kebab-case ile normalize edilir.
- `content_html` tek H1, anlamlı H2/H3, kısa paragraflar ve gerekirse listeler içerir.

---

## Hata yanıtları (özet)

| HTTP | Örnek anlam |
|------|-------------|
| **400** | JSON hatalı veya `raw_text` eksik/boş |
| **413** | `raw_text` 24000 karakter sınırını aşıyor |
| **405** | `GET`/`POST`/`OPTIONS` dışı metod |
| **500** | `ANTHROPIC_API_KEY` Netlify’da tanımlı değil |
| **502** | Model beklenen tool çıktısını döndürmedi veya alanlar eksik |
| **4xx/5xx** | Anthropic API veya ağ kaynaklı; gövdede genelde `error` veya `message` |

---

## Örnek: cURL

```bash
curl -sS -X POST '{BASE}/api/seo-optimize' \
  -H 'Content-Type: application/json' \
  -d '{
    "raw_text": "Bodrumda yazlık ev almak isteyenler için rehber. Bölgede emlak fiyatları, denize yakınlık ve yatırım potansiyeli önemli kriterlerdir. Yalıkavak ve Türkbükü popüler lokasyonlardır."
  }'
```

---

## Örnek: JavaScript (fetch)

```javascript
const res = await fetch("{BASE}/api/seo-optimize", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    raw_text: "Bodrumda yazlık ev almak isteyenler için rehber...",
  }),
});
const data = await res.json();
if (!res.ok) throw new Error(JSON.stringify(data));
console.log(data.title, data.slug, data.content_html);
```

---

## Örnek: PHP

```php
<?php
$base = '{BASE}';
$payload = [
    'raw_text' => 'Bodrumda yazlık ev almak isteyenler için rehber...',
];
$ch = curl_init($base . '/api/seo-optimize');
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS     => json_encode($payload),
    CURLOPT_TIMEOUT        => 120,
]);
$raw = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
$data = json_decode($raw, true);
```

---

## CORS

Tarayıcıdan çağrıda sunucu `Access-Control-Allow-Origin` döner (varsayılan genelde `*`). Gerekirse Netlify tarafında `CORS_ORIGIN` ile sıkılaştırılabilir.

---

## Hızlı kontrol listesi (entegrasyon için)

1. `{BASE}` doğru mu?
2. Netlify’da `ANTHROPIC_API_KEY` tanımlı mı?
3. `POST` + JSON gövde + `Content-Type: application/json`
4. `raw_text` boş değil ve 24000 karakter altında mı?
5. Yanıtta 5 alan (`title`, `meta_description`, `meta_keywords`, `slug`, `content_html`) geliyor mu?

---

## Maliyet notu

- Varsayılan model `claude-haiku-4-5-20251001` düşük maliyetlidir; blog yazısı boyutunda tek istek için uygun.
- Kalite yetersiz gelirse yalnızca `SEO_MODEL` ortam değişkenini (ör. `claude-sonnet-4-6`) güncellemeniz yeterli; kod değişmez.
