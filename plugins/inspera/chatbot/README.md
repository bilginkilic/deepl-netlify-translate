# Inspera.Chatbot (October CMS v3)

Inspera Bodrum için Türkçe Claude asistanı: sunucu üzerinden Anthropic API proxy’si, October CMS yönetim ekranı, tekrar soru cache’i, seçilebilir site veri kaynakları ve temada gömülü vanilla widget.

## Kurulum

1. **`plugins/inspera/chatbot`** klasörünü October v3 projenizin `plugins/inspera/chatbot` yoluna kopyalayın.
2. **`themes/inspera-bodrum/partials/inspera-chatbot.htm`** dosyasını aktif temanızın `partials/` altına kopyalayın (veya doğrudan referans alın).
3. Proje kökünde Composer autoload’ı yenileyin:

   ```bash
   composer dump-autoload
   ```

4. October yönetim panelinde **Eklentiler** bölümünde **Inspera Chatbot** (`Inspera.Chatbot`) eklentisini etkinleştirin ve güncellemeleri çalıştırın. V2 ile `inspera_chatbot_question_cache` ve `inspera_chatbot_action_logs` tabloları eklenir.
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

## Plugin v2 yönetim ekranı

October backend’de **Ayarlar > Inspera > Inspera Chatbot** ekranından şu alanlar yönetilir:

- Chatbot aktif/pasif, asistan adı, karşılama mesajı ve hızlı menü butonları
- Anthropic API key, model, token/message sınırları ve opsiyonel sistem prompt override
- AI’a gönderilecek seçili veri kaynakları: statik içerik, CMS sayfaları veya izin verilen veritabanı tabloları
- Statik cevaplar: belirli sorular AI’a gitmeden cevaplanır
- Cache politikası: AI cevapları tekrar kullanım tablosuna kaydedilebilir ve aynı soru tekrar geldiğinde AI çağrısı yapılmaz
- Action/webhook tanımları: rezervasyon veya benzer işlemler için tetikleyici kelimeler, webhook URL, başarı/hata mesajı ve loglama

Mesaj işleme sırası maliyeti azaltmak için şöyledir:

1. Statik cevap eşleşmesi
2. Onaylı tekrar soru cache’i
3. Tanımlı action/webhook tetikleyicisi
4. Seçili site veri kaynaklarından küçük context oluşturma
5. Anthropic çağrısı ve uygun cevapların cache’e yazılması

## Maliyet ve model seçimi

Varsayılanlar maliyeti düşürmek içindir: **`claude-haiku-4-5`**, `max_tokens` **400**, geçmiş en fazla **24** mesaj, mesaj başı **4000** karakter. Bu değerler backend ayarlarından veya env ile değiştirilebilir. Detaylı fiyat için [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing).

- **Düşük maliyet:** `.env`’de boş bırakın veya `INSPERA_CHATBOT_MODEL=claude-haiku-4-5` (approx. **200k context** — bu widget için genelde yeterli).
- **daha iyi kalite:** `INSPERA_CHATBOT_MODEL=claude-sonnet-4-6` vb.
- `claude-sonnet-4-20250514` **kullanmayın**; Anthropic tarafından emeklilik planlanmıştır (güncel listeleme için [models overview](https://platform.claude.com/docs/en/about-claude/models/overview)).

İsteğe bağlı iyileştirme: sistem prompt’unuz uzun olduğundan ileride [prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) ile tekrarlayan sabit sistem metninde tasarruf denenebilir (proxy kodunda henüz açılmıyorsa ek bir geliştirme gerektirir).

## API uç noktaları

- **Config:** `GET /inspera-chatbot/config`
  - Yanıt: karşılama mesajı, hızlı menüler, aktif/pasif durumu ve rezervasyon başlığı.
- **Mesaj:** `POST /inspera-chatbot/message`
- **JSON gövdesi:** `{ "messages": [ { "role": "user"|"assistant", "content": "..." }, ... ] }`
- Yanıt: `{ "message": "assistant metni", "source": "static|cache|action|ai" }` veya `{ "error": "…", "code": "…" }`
- Kötüye kullanımı sınırlama: route `web` ara katmanında; `throttle:60,1`; CSRF için `X-CSRF-TOKEN` ve cookie oturumu (same-origin fetch).

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

## Güvenlik

- **API anahtarını git’e asla commit etmeyin.**
- Tarayıcıda anahtar yoktur; Anthropic ile konuşan tek taraf PHP proxy’dir.
- Üretimde rate limit ve WAF gereksinimlerini göz önünde bulundurun.

## Twig / CSRF sorunları

`{{ csrf_token() }}` Twig’da tanınmıyorsa tema yerine layout’taki meta ile token verin ve `inspera-chatbot-root` için `data-csrf` değerini October’un önerdiği yardımcı ile doldurun.
