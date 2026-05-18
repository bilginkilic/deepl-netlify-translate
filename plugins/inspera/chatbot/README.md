# Inspera.Chatbot (October CMS v3)

Inspera Bodrum için Türkçe Claude asistanı: sunucu üzerinden Anthropic API proxy’si ve temada gömülü vanilla widget.

## Kurulum

1. **`plugins/inspera/chatbot`** klasörünü October v3 projenizin `plugins/inspera/chatbot` yoluna kopyalayın.
2. **`themes/inspera-bodrum/partials/inspera-chatbot.htm`** dosyasını aktif temanızın `partials/` altına kopyalayın (veya doğrudan referans alın).
3. Proje kökünde Composer autoload’ı yenileyin:

   ```bash
   composer dump-autoload
   ```

4. October yönetim panelinde **Eklentiler** bölümünde **Inspera Chatbot** (`Inspera.Chatbot`) eklentisini etkinleştirin.
5. Kök **`.env`** dosyasına anahtarları ekleyin (`plugins/inspera/chatbot/.env.example` içeriğine bakın):

   ```env
   ANTHROPIC_API_KEY=sk-ant-api03-...
   ```

6. Aktif layout’unuzda `</body>` kapanışından hemen önce partial’ı ekleyin; head içinde CSRF meta kullanın (örnek için bkz. `themes/inspera-bodrum/layouts/example-default-with-chatbot.htm`):

   ```twig
   <head>
       …
       <meta name="csrf-token" content="{{ csrf_token() }}">
   </head>
   …
   {% partial 'inspera-chatbot' %}
   </body>
   ```

Site alt dizinde ise (`https://ornek.com/cms/` gibi) partial içindeki `data-endpoint` değerini veya `inspera-chatbot.htm` içindeki `ENDPOINT` önekini uygun taban URL ile uyumlu hale getirin.

## API uç noktası

- **URL:** `POST /inspera-chatbot/message`
- **JSON gövdesi:** `{ "messages": [ { "role": "user"|"assistant", "content": "..." }, ... ] }`
- Yanıt: `{ "message": "assistant metni" }` veya `{ "error": "…", "code": "…" }`
- Köçe sıkıştırma: route `web` ara katmanında; `throttle:60,1`; CSRF için `X-CSRF-TOKEN` ve cookie oturumu (same-origin fetch).

`.env`, model ve kota için `plugins/inspera/chatbot/config/chatbot.php` dosyasına bakın (`INSPERA_CHATBOT_*`).

## Kayıt ve rezervasyon API (October)

Eklenti güncellemesi **v1.0.1** ile `inspera_chatbot_booking_requests` tablosu oluşturulur. October panelinden eklentiyi güncelledikten sonra migration’ın uygulandığını doğrulayın.

### `POST /inspera-chatbot/api/bookings`

- **Gövde (JSON):**
  - `request_type` (zorunlu): `workshop` | `theater` | `restaurant` | `other`
  - `full_name` (zorunlu)
  - `email` ve `phone`: en az biri zorunlu
  - `preferred_datetime_text` (isteğe bağlı, en 500 karakter)
  - `party_size` (isteğe bağlı, 1–500)
  - `notes` (isteğe bağlı)
  - `conversation_snapshot` (isteğe bağlı): en fazla 40 mesaj, `{ "role": "user"|"assistant", "content": "..." }[]`
- **Yanıt (201/200):** `{ "id": 1, "message": "Talebiniz kaydedildi. ..." }`
- CSRF (`X-CSRF-TOKEN` veya Laravel oturumu), same-origin önerilir; throttle `30/min`.

### `GET /inspera-chatbot/api/bookings/ping`

Sağlık kontrolü: `{ "ok": true, "service": "inspera-chatbot-bookings" }`

Tema partial’ında **Kayıt / rezervasyon talebi** bölümü bu endpoint’e `POST` atar (`data-bookings-endpoint`). Alt site yolunda yayın yapıyorsanız Twig’da bu data attribute’ları taban URL ile uyumlu hale getirin.

- **API anahtarını git’e asla commit etmeyin.**
- Tarayıcıda anahtar yoktur; Anthropic ile konuşan tek taraf PHP proxy’dir.
- Üretimde rate limit ve WAF gereksinimlerini göz önünde bulundurun.

## Twig / CSRF sorunları

`{{ csrf_token() }}` Twig’da tanınmıyorsa tema yerine layout’taki meta ile token verin ve `inspera-chatbot-root` için `data-csrf` değerini October’un önerdiği yardımcı ile doldurun.
