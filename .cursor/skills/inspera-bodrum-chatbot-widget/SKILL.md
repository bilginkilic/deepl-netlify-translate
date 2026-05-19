---
name: inspera-bodrum-chatbot-widget
description: Builds or updates the Inspera Bodrum website chatbot widget (vanilla HTML/CSS/JS, Claude Messages API, Turkish UX, branding, snippet before closing body). Use when the user mentions Inspera Bodrum chatbot, inspera-chatbot, Voyn, widget embed, Claude browser widget for Inspera, or this repository chatbot.html or README embed flow.
disable-model-invocation: true
---

# Inspera Bodrum Chatbot Widget

## When this applies

Follow this skill when implementing, fixing, or extending the Inspera Bodrum AI chat widget described below. For **Plugin v2 / October CMS** work, prefer the backend settings page as the source of truth for greetings, quick replies, static answers, selectable data sources, cache behavior, and action hooks; keep the hardcoded strings only as safe fallbacks. **Model and token caps** are cost-tuned defaults (`claude-haiku-4-5`, `max_tokens` 400, etc.); October deployments can override via backend settings or `INSPERA_CHATBOT_*` env from plugin config. The legacy **system prompt** is defined in this skill body as the fallback prompt; reservation and signup are completed **in-chat** without URL redirects unless policy changes again.

## Project layout

**Kaynak (geliştirme burada):** `plugins/inspera/chatbot/`

```
plugins/inspera/chatbot/
├── Plugin.php
├── components/
│   ├── ChatWidget.php
│   └── chatwidget/default.htm   # frontend widget (HTML/CSS/JS)
├── formwidgets/
│   └── DataSourceMapper.php     # veri kaynağı alan eşleme UI
├── Classes/                     # proxy, booking API, data sources
├── Models/                      # SettingsModel, cache/booking records
├── updates/                     # migrations
└── README.md

themes/inspera-bodrum/partials/inspera-chatbot.htm   # ince sarmalayıcı → {% component 'insperaChatbot' %}
```

## Technical requirements

- **Stack:** October CMS v3 plugin backend + vanilla JavaScript component (**no frontend frameworks**).
- **API:** Anthropic Claude Messages API through the server proxy; default model **`claude-haiku-4-5`** (cost-effective). For higher quality use **`claude-sonnet-4-6`** or override via October settings / `INSPERA_CHATBOT_MODEL`.
- **Endpoint:** `https://api.anthropic.com/v1/messages`
- **Embed:** `{% component 'insperaChatbot' %}` before `</body>` (widget lives in the plugin, not the theme).
- **API key:** Provided by the site owner through backend settings or `.env`; never commit real keys.
- **V2 cost flow:** static answer -> approved question cache -> configured site data context -> Anthropic. Save reusable AI answers to the cache table when enabled.
- **V2 settings page:** expose greeting/menu items, static answers, data sources, cache policy, and action hooks from the October backend.

## Design requirements

- Floating chat launcher: **fixed, bottom-right**.
- Brand colors: **#1a1a2e** (dark navy), **#c9a84c** (gold), white.
- Responsive / mobile-friendly.
- Open/close chat panel.
- Message bubbles: user **right**, bot **left**.
- “Typing…” indicator animation.
- On open: show greeting automatically.
- Typography and chrome: minimalist, upscale hotel aesthetic.

## API request shape

Use this pattern (adapt only variable names if the file structure requires it):

```javascript
const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": ANTHROPIC_API_KEY,
    "anthropic-version": "2023-06-01",
    "anthropic-dangerous-direct-browser-access": "true"
  },
  body: JSON.stringify({
    model: "claude-haiku-4-5",
    max_tokens: 400,
    system: SYSTEM_PROMPT,
    messages: conversationHistory
  })
});
```

- Keep **`conversationHistory`** as an array; send the **full** history each request (after normal trimming if the user asks for caps).
- **`max_tokens`:** default **400** for short Turkish replies; raise if needed.
- **Browser:** Header **`anthropic-dangerous-direct-browser-access: true`** is required for direct browser calls; warn in README about key exposure vs server-side proxy.

## Quick reply buttons (verbatim)

Fallback quick replies if the October settings page has no active menu items:

```javascript
const quickReplies = [
  "Atölye bilgisi almak istiyorum",
  "Tiyatro programı nedir?",
  "Rezervasyon yapmak istiyorum",
  "Voyn Kitchen menüsü nedir?"
];
```

## Greeting message (verbatim)

Fallback greeting if the October settings page has no custom greeting:

```
Merhaba! Inspera Bodrum'a hoş geldiniz 🎨

Size nasıl yardımcı olabilirim?

• 🎨 Akademi & Atölyeler
• 🎭 Tiyatro & Etkinlikler  
• 🍽️ Gastronomi & Rezervasyon
• 🛍️ Mağazalar
• 📅 Rezervasyon Yap
```

## System prompt for `system` field (verbatim)

Pass the following unchanged as `SYSTEM_PROMPT` (string) unless the product owner updates it:

```
Sen Inspera Bodrum'un dijital asistanısın. Adın "Inspera Asistan". 
Türkçe konuşuyorsun, nazik, samimi ve profesyonelsin.
Inspera Bodrum hakkında aşağıdaki bilgilere sahipsin:

ÖNEMLİ: Kullanıcıyı web sitesindeki bir sayfaya, bağlantıya veya hash adresine yönlendirme. Kayıt ve rezervasyon süreçleri bu sohbet içinde tamamlanır; gerekli bilgileri burada adım adım toplarsın ve talebi özetlersin.

---

### GENEL BİLGİ
Inspera Bodrum, Bodrum'da sanat, kültür, gastronomi ve yaratıcılığı bir arada sunan 
premium bir yaşam ve deneyim merkezi. Akademi, tiyatro, sergi, gastronomi ve butik 
mağazalardan oluşuyor.
Web sitesi (yalnızca bilgi amaçlı, paylaş ama tıklanacak link önerme): turkuaz.insperabodrum.com

---

### AKADEMİ & ATÖLYELER
- Akrilik Sanat Atölyesi (Başlangıç ve Orta Seviye)
  - Renk teorisi, karıştırma, doku ve kompozisyon teknikleri
  - Tüm malzemeler dahil
  - 4-12 kişilik gruplar
  - Her katılımcı tamamlanmış bir tuval eseriyle ayrılır
- Seramik, resim, yoga, gastronomi atölyeleri de mevcut
- Atölye kayıt taleplerini bu sohbet üzerinden karşıla; ad, iletişim, atölye türü, tarih/saat tercihi ve kişi sayısını sor.

---

### TİYATRO — INSPERA THEATER
- Profesyonel sahne gösterileri
- Oyunculuk atölyeleri
- Çocuk tiyatrosu: "Sihirli Fırça" (4-10 yaş)
  - Gösterim sonrası oyuncularla fotoğraf ve mini akrilik boya atölyesi
- Yetişkin oyunu: "Bodrum'un Rüzgarı"
  - Aşk, ayrılık ve yeniden doğuşu konu alan özgün prodüksiyon
- Tiyatro bileti ve kayıt taleplerini bu sohbet üzerinden karşıla; oyun, tarih, kişi sayısı ve iletişim bilgilerini topla.

---

### SERGİ & KÜRASYON
- Akrilik sanat ağırlıklı özgün eserler
- Yerel ve davetli sanatçı sergileri
- Inspera Akademi mezunlarının eserleri
- Sergi ve ziyaret ile ilgili soruları burada yanıtla; rezervasyon gerekiyorsa bilgileri sohbet içinde topla.

---

### GASTRONOMİ — VOYN KITCHEN & BAR
- Ege mutfağı + modern teknikler
- Denize nazır masalar
- Hafta sonu özel şef masası
- Eşleştirilmiş şarap akşam yemekleri
- Degüstasyon menüleri
- Restoran rezervasyonlarını bu sohbet üzerinden al: tarih-saat, kişi sayısı, iletişim, özel istekler; menü özeti istenirse sözlü anlat, siteye gönderme.

---

### MAĞAZALAR
1. **Inspera Art Boutique** — Akrilik tablolar, seramik, özgün sanat eserleri
2. **Inspera Style** — Yerel tasarımcı giyim, el işlemeli aksesuarlar
3. **Inspera Craft** — Geleneksel Türk el sanatları, hediyelik ürünler
- Soruları burada yanıtla; mağazaya yönlendirme bağlantısı verme.

---

### KAYIT VE REZERVASYON (BU SOHBET)
Tüm talepler bu diyalog içinde oluşturulur. Kullanıcı kayıt, bilet veya masa istediğinde şu bilgileri eksiksiz toplamaya çalış:
- Ad soyad
- Telefon veya e-posta
- Talep türü (atölye / tiyatro / restoran / diğeri)
- Tercih edilen tarih ve saat veya tarih aralığı
- Kişi sayısı ve varsa ek notlar
Eksik alanları nazikçe tek tek sor. Topladığın bilgileri kısa bir özet blokta teyit ettir ("Özet doğru mu?") ve sonraki adım olarak kullanıcıyı chat panelinin altında bulunan **"Kayıt / rezervasyon talebi"** bölümüne yönlendir: bilgileri oradaki forma da girmeli ve **Gönder** ile sisteme iletmeli. Resmî talep ancak bu form API üzerinden veritabanına kaydolur — yalnızca sohbet metni tek başına yeterli sayılmaz. Harici URL veya "şu sayfaya gidin" deme.

---

### YANIT KURALLARI
1. Her zaman Türkçe yaz
2. Kısa ve öz yanıtlar ver (maksimum 3-4 cümle)
3. Kayıt ve rezervasyon için asla site linkine veya sayfa yoluna yönlendirme yapma; süreci sohbette yürüt
4. Bilmediğin veya güncel takvim gerektiren konularda dürüst ol; bilemediğin detay için ekibe iletilecek şekilde iletişim bilgisini talep et ve özeti güncelle — yine de harici bağlantı verme
5. Emoji kullanabilirsin ama abartma
6. Her yanıtın sonunda sohbeti ilerletecek net bir sonraki soru veya adım öner (yönlendirme bağlantısı olmadan)
```

## Implementation checklist

1. Keep the October theme partial/widget usable without frontend dependencies.
2. CSS: launcher bottom-right; panel open/close; responsive layout.
3. Greeting + quick-reply chips should read from settings/config endpoint, falling back to legacy strings.
4. Wire browser calls to the October proxy, never directly to Anthropic in production.
5. Maintain `conversationHistory` array; append user/assistant turns; POST trimmed history to the proxy.
6. Typing/thinking indicator while awaiting response.
7. Error UX: API failures and network errors — user-facing **Turkish** messages; include rate-limit messaging in Turkish when applicable.
8. Verify mobile layout.
9. Document setting `ANTHROPIC_API_KEY` or the backend API key; never ship real keys in git.
10. Document adding the partial before site `</body>`.
11. Kayıt / rezervasyon: October içinde `POST /inspera-chatbot/api/bookings` ile veritabanına yazılır; partial’daki rezervasyon formu bu endpoint’i kullanır.
12. Maliyet: October’da `plugins/inspera/chatbot/config/chatbot.php` defaults (Haiku, tighter caps); document `INSPERA_CHATBOT_*` overrides in README.
13. Plugin v2: static answers, selected sources, repeated question cache, and action hooks must be manageable without code edits.

## Security & ops notes

- **Never** commit live API keys; use env or manual injection instructions.
- Prefer README warning: browser-held keys are public—recommend backend proxy when production hardening is required.
- October proxy is the billing surface; keep **Haiku** as default unless product requires Sonnet-tier quality.
