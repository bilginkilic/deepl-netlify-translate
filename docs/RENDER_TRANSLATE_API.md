# Render çeviri + SEO proxy API

Bu servis iki API sunar:

| API | Yol | Dokümantasyon |
|-----|-----|---------------|
| DeepL çeviri | `/api/translate` | Bu dosya + [NETLIFY_TRANSLATE_API.md](./NETLIFY_TRANSLATE_API.md) |
| SEO optimize | `/api/seo-optimize` | [RENDER_SEO_API.md](./RENDER_SEO_API.md) |

Netlify sürümüyle **aynı sözleşme**: aynı endpoint yolları, aynı JSON gövdesi. DeepL anahtarı istemciden gelir; Anthropic anahtarı Render env'de saklanır.

**Örnek canlı adres:** `https://deepl-netlify-translate.onrender.com`

## Deploy (Render)

1. [Render](https://render.com) → **New** → **Blueprint** veya mevcut **Web Service**
2. Repo kökündeki `render.yaml` kullanılabilir (veya manuel):
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Health check path:** `/health`
3. **Environment** → `ANTHROPIC_API_KEY` ekleyin (SEO API için zorunlu)
4. Deploy sonrası kök URL örneği: `https://deepl-netlify-translate.onrender.com`

## Uç noktalar

| Metod | Yol | Açıklama |
|--------|-----|----------|
| `GET` | `/health` | Render health check |
| `GET` | `/` | Servis listesi |
| `GET` | `/api/translate` | Çeviri API bilgisi |
| `POST` | `/api/translate` | Çeviri |
| `GET` | `/api/seo-optimize` | SEO API bilgisi |
| `POST` | `/api/seo-optimize` | SEO optimizasyon |

## Yerel geliştirme

```bash
cp render/.env.example .env
# .env → ANTHROPIC_API_KEY=...

npm install
npm run dev:render
# http://localhost:3000/api/translate
# http://localhost:3000/api/seo-optimize
```

## Örnek cURL

```bash
export DEEPL_AUTH_KEY='YOUR_KEY'
export BASE='https://deepl-netlify-translate.onrender.com'

curl -sS -X POST "$BASE/api/translate" \
  -H 'Content-Type: application/json' \
  -H "Authorization: DeepL-Auth-Key $DEEPL_AUTH_KEY" \
  -d '{"text":"Hello","target_lang":"TR"}'
```

## Ortam değişkenleri

| Değişken | Açıklama |
|----------|----------|
| `PORT` | Render otomatik atar |
| `ANTHROPIC_API_KEY` | SEO API için zorunlu — [RENDER_SEO_API.md](./RENDER_SEO_API.md) |
| `SEO_MODEL` | SEO model override (isteğe bağlı) |
| `SEO_MAX_TOKENS` | SEO çıktı token limiti (isteğe bağlı, uzun metin için `8192`) |
| `CORS_ORIGIN` | Varsayılan `*` |
| `DEEPL_API_URL` | DeepL endpoint override (isteğe bağlı) |
