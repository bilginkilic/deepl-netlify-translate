# Render çeviri proxy API

Netlify sürümüyle **aynı sözleşme**: `POST` / `GET` `/api/translate`, aynı header ve JSON gövdesi. DeepL anahtarı sunucuda saklanmaz.

Detaylı alan listesi ve örnekler: [NETLIFY_TRANSLATE_API.md](./NETLIFY_TRANSLATE_API.md) — yalnızca `{BASE}` adresini Render servisinizle değiştirin.

## Deploy (Render)

1. [Render](https://render.com) → **New** → **Blueprint** veya **Web Service**
2. Repo kökündeki `render.yaml` kullanılabilir (veya manuel):
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Health check path:** `/health`
3. Deploy sonrası kök URL örneği: `https://deepl-translate-proxy.onrender.com`

## Uç noktalar

| Metod | Yol | Açıklama |
|--------|-----|----------|
| `GET` | `/health` | Render health check |
| `GET` | `/api/translate` | API bilgisi |
| `POST` | `/api/translate` | Çeviri |

## Yerel geliştirme

```bash
npm install
npm run dev:render
# http://localhost:3000/api/translate
```

## Örnek cURL

```bash
export DEEPL_AUTH_KEY='YOUR_KEY'
export BASE='https://YOUR-SERVICE.onrender.com'

curl -sS -X POST "$BASE/api/translate" \
  -H 'Content-Type: application/json' \
  -H "Authorization: DeepL-Auth-Key $DEEPL_AUTH_KEY" \
  -d '{"text":"Hello","target_lang":"TR"}'
```

## Ortam değişkenleri

| Değişken | Açıklama |
|----------|----------|
| `PORT` | Render otomatik atar |
| `CORS_ORIGIN` | Varsayılan `*` |
| `DEEPL_API_URL` | DeepL endpoint override (isteğe bağlı) |
