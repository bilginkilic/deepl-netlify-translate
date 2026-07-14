# Render çeviri + SEO proxy API

Bu servis iki API sunar:

| API | Yol | Dokümantasyon |
|-----|-----|---------------|
| DeepL çeviri | `/api/translate` | Bu dosya + [NETLIFY_TRANSLATE_API.md](./NETLIFY_TRANSLATE_API.md) |
| SEO optimize | `/api/seo-optimize` | [RENDER_SEO_API.md](./RENDER_SEO_API.md) |

**Örnek canlı adres:** `https://deepl-netlify-translate.onrender.com`

## DeepL anahtarı (Render)

`DEEPL_AUTH_KEY` **Render Environment** secret olarak tanımlanır. PHP / backend çoğunlukla yalnızca çeviri JSON’unu gönderir.

**Geriye dönük uyum:** Eski kod `Authorization: DeepL-Auth-Key …` veya gövdede `auth_key` gönderirse sorun çıkmaz; env tanımlıysa bu alanlar **yoksayılır**.

Netlify çeviri proxy’sinden fark: Netlify’da DeepL anahtarı her istekte istemciden gelir.

## Deploy (Render)

1. [Render](https://render.com) → Blueprint (`render.yaml`) veya Web Service
2. **Build:** `npm install` · **Start:** `npm start` · **Health:** `/health`
3. **Environment → Secrets:**
   - `DEEPL_AUTH_KEY` — çeviri için (üretimde zorunlu)
   - `ANTHROPIC_API_KEY` — SEO API için (kullanıyorsanız zorunlu)
4. İsteğe bağlı: `CORS_ORIGIN`, `DEEPL_API_URL`, `SEO_MODEL`, `SEO_MAX_TOKENS`

## Uç noktalar

| Metod | Yol | Açıklama |
|--------|-----|----------|
| GET | `/health` | Health check |
| GET | `/` | Servis listesi |
| GET | `/api/translate` | Çeviri API bilgisi |
| POST | `/api/translate` | Çeviri |
| GET | `/api/seo-optimize` | SEO API bilgisi |
| POST | `/api/seo-optimize` | SEO optimizasyon |

## Çeviri örneği (anahtar göndermeden)

```bash
export BASE='https://deepl-netlify-translate.onrender.com'

curl -sS -X POST "$BASE/api/translate" \
  -H 'Content-Type: application/json' \
  -d '{"text":"Hello","target_lang":"TR","source_lang":"EN"}'
```

## PHP çeviri örneği

```php
<?php
$base = 'https://deepl-netlify-translate.onrender.com';
$payload = [
    'text'        => ['Merhaba', 'Dünya'],
    'target_lang' => 'EN',
    'source_lang' => 'TR',
];

$ch = curl_init($base . '/api/translate');
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS     => json_encode($payload),
    CURLOPT_TIMEOUT        => 60,
]);
$raw = curl_exec($ch);
curl_close($ch);
$data = json_decode($raw, true);
```

DeepL anahtarı October `.env` dosyasında gerekmez; Render’da `DEEPL_AUTH_KEY` tanımlı olmalı.

## Yerel geliştirme

```bash
cp render/.env.example .env
# DEEPL_AUTH_KEY ve gerekirse ANTHROPIC_API_KEY doldurun

npm install
npm run dev:render
```

Env yoksa çeviri için geçici olarak `Authorization: DeepL-Auth-Key …` header ile test edebilirsiniz.

## Ortam değişkenleri

| Değişken | Zorunlu | Açıklama |
|----------|---------|----------|
| `DEEPL_AUTH_KEY` | Evet (çeviri, üretim) | DeepL API anahtarı — Render secret |
| `ANTHROPIC_API_KEY` | SEO kullanıyorsanız | [RENDER_SEO_API.md](./RENDER_SEO_API.md) |
| `PORT` | Hayır | Render otomatik atar |
| `SEO_MODEL` | Hayır | SEO model override |
| `SEO_MAX_TOKENS` | Hayır | SEO çıktı token limiti |
| `CORS_ORIGIN` | Hayır | Varsayılan `*` |
| `DEEPL_API_URL` | Hayır | DeepL endpoint override |

## Güvenlik

Üretimde `CORS_ORIGIN` sıkılaştırın. Anahtarlar Render secret’ta tutulur; istemci DeepL anahtarı göndermek zorunda değildir.
