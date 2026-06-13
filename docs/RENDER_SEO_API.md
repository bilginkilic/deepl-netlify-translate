# Render SEO optimize API

Netlify sürümüyle **aynı sözleşme**: `POST` / `GET` `/api/seo-optimize`, aynı JSON gövdesi ve yanıt şeması. Anthropic anahtarı sunucuda (Render env) saklanır.

Detaylı alan listesi ve örnekler: [NETLIFY_SEO_API.md](./NETLIFY_SEO_API.md) — yalnızca `{BASE}` adresini Render servisinizle değiştirin.

**Örnek canlı adres:** `https://deepl-netlify-translate.onrender.com`

---

## Deploy (Render)

1. [Render](https://render.com) → servisiniz → **Environment**
2. Zorunlu değişkeni ekleyin:
   - `ANTHROPIC_API_KEY` — Anthropic API anahtarı
3. Uzun blog yazıları için önerilen:
   - `SEO_MAX_TOKENS=8192`
4. Repo güncellemesini deploy edin (veya **Manual Deploy**)

`render.yaml` içinde `ANTHROPIC_API_KEY` için `sync: false` tanımlıdır; değer repoda tutulmaz, dashboard'dan girilir.

---

## Uç noktalar

| Metod | Yol | Açıklama |
|--------|-----|----------|
| `GET` | `/health` | Render health check |
| `GET` | `/` | Servis listesi (`translate`, `seo_optimize`) |
| `GET` | `/api/seo-optimize` | API bilgisi |
| `POST` | `/api/seo-optimize` | SEO optimizasyon |

---

## POST gövdesi

```json
{
  "raw_text": "Ham metin..."
}
```

## Başarılı yanıt

```json
{
  "title": "...",
  "meta_description": "...",
  "meta_keywords": "...",
  "slug": "...",
  "content_html": "<h1>...</h1>..."
}
```

---

## Yerel geliştirme

```bash
cp render/.env.example .env
# .env içine ANTHROPIC_API_KEY yazın

npm install
npm run dev:render
# http://localhost:3000/api/seo-optimize
```

---

## Örnek cURL

```bash
export BASE='https://deepl-netlify-translate.onrender.com'

curl -sS -X POST "$BASE/api/seo-optimize" \
  -H 'Content-Type: application/json' \
  -d '{"raw_text":"Bodrumda yazlık ev almak isteyenler için rehber..."}'
```

---

## Ortam değişkenleri

| Değişken | Zorunlu | Açıklama |
|----------|---------|----------|
| `ANTHROPIC_API_KEY` | Evet | Claude API anahtarı |
| `SEO_MODEL` | Hayır | Varsayılan `claude-haiku-4-5-20251001` |
| `SEO_MAX_TOKENS` | Hayır | Varsayılan otomatik (uzun metinde 8192'ye kadar) |
| `CORS_ORIGIN` | Hayır | Varsayılan `*` |
| `PORT` | Hayır | Render otomatik atar |

---

## Notlar

- **Free plan:** İstek süresi ~30 sn ile sınırlı olabilir; çok uzun içeriklerde timeout riski vardır. `SEO_MAX_TOKENS=8192` ve kısa-orta metinler önerilir.
- **Cold start:** Free tier'da servis uyku modundan uyanırken ilk istek yavaş olabilir.
- DeepL çeviri API'si aynı serviste: [RENDER_TRANSLATE_API.md](./RENDER_TRANSLATE_API.md)
