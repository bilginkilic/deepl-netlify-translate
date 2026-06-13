const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-haiku-4-5-20251001";
const DEFAULT_MAX_TOKENS = 2048;
const MAX_RAW_TEXT_LENGTH = 24000;

const SEO_SYSTEM_PROMPT = `Sen Bodrum bölgesi (emlak, turizm, yaşam, gayrimenkul) alanında uzman bir SEO içerik editörüsün. insperabodrum.com sitesi için içerik düzenliyorsun.

Görevin:
1. Verilen ham metni analiz et.
2. SEO uyumlu bir title üret (50-60 karakter, ana anahtar kelimeyi içersin).
3. Meta description üret (150-160 karakter, çekici ve bilgilendirici).
4. Meta keywords üret (5-8 anahtar kelime/öbek, virgülle ayrılmış).
5. URL slug üret (Türkçe karaktersiz, kebab-case).
6. İçeriği SEO uyumlu HTML formatına dönüştür:
   - Tek bir H1 (title ile uyumlu)
   - Anlamlı H2/H3 alt başlıklar
   - Kısa paragraflar
   - Anahtar kelimeleri doğal şekilde dağıt
   - Gerekirse madde işaretli liste kullan
   - Orijinal anlamı ve bilgiyi koru, sadece yapıyı ve SEO'yu iyileştir

ÇIKTI FORMATI: Sadece tool çağrısı ile belirtilen JSON şemasına uygun yanıt ver.
Açıklama, yorum, markdown code-block ekleme.`;

const SEO_TOOL = {
  name: "seo_content_output",
  description: "SEO uyumlu içerik çıktısı",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string", description: "SEO uyumlu başlık (50-60 karakter)" },
      meta_description: {
        type: "string",
        description: "SEO uyumlu meta açıklama (150-160 karakter)",
      },
      meta_keywords: {
        type: "string",
        description: "5-8 anahtar kelime/öbek, virgülle ayrılmış",
      },
      slug: { type: "string", description: "Türkçe karaktersiz kebab-case URL slug" },
      content_html: {
        type: "string",
        description: "SEO uyumlu HTML içerik (h1, h2, h3, p, ul/li)",
      },
    },
    required: [
      "title",
      "meta_description",
      "meta_keywords",
      "slug",
      "content_html",
    ],
  },
};

const TR_MAP = {
  ç: "c",
  Ç: "c",
  ğ: "g",
  Ğ: "g",
  ı: "i",
  İ: "i",
  I: "i",
  ö: "o",
  Ö: "o",
  ş: "s",
  Ş: "s",
  ü: "u",
  Ü: "u",
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": process.env.CORS_ORIGIN ?? "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
  };
}

function json(status, body) {
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
    body: JSON.stringify(body),
  };
}

function transliterate(str) {
  return String(str)
    .split("")
    .map((ch) => TR_MAP[ch] ?? ch)
    .join("");
}

function slugify(str) {
  return transliterate(str)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function getModel() {
  return process.env.SEO_MODEL || DEFAULT_MODEL;
}

function getMaxTokens() {
  const n = Number(process.env.SEO_MAX_TOKENS);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_MAX_TOKENS;
}

function extractToolOutput(data) {
  const blocks = Array.isArray(data?.content) ? data.content : [];
  const toolUse = blocks.find((b) => b?.type === "tool_use" && b?.name === "seo_content_output");
  if (!toolUse?.input || typeof toolUse.input !== "object") {
    return null;
  }
  return toolUse.input;
}

function normalizeOutput(raw) {
  const required = [
    "title",
    "meta_description",
    "meta_keywords",
    "slug",
    "content_html",
  ];
  for (const key of required) {
    if (typeof raw[key] !== "string" || !raw[key].trim()) {
      throw new Error(`Model output missing or empty field: ${key}`);
    }
  }

  const slugSource = raw.slug.trim() || raw.title.trim();
  return {
    title: raw.title.trim(),
    meta_description: raw.meta_description.trim(),
    meta_keywords: raw.meta_keywords.trim(),
    slug: slugify(slugSource),
    content_html: raw.content_html.trim(),
  };
}

async function callClaude(rawText) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { error: { status: 500, body: { error: "ANTHROPIC_API_KEY missing on server" } } };
  }

  const res = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: getModel(),
      max_tokens: getMaxTokens(),
      system: SEO_SYSTEM_PROMPT,
      tools: [SEO_TOOL],
      tool_choice: { type: "tool", name: "seo_content_output" },
      messages: [{ role: "user", content: rawText }],
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof data?.error?.message === "string"
        ? data.error.message
        : typeof data?.message === "string"
          ? data.message
          : "Anthropic API error";
    return {
      error: {
        status: res.status >= 400 && res.status < 600 ? res.status : 502,
        body: { error: message, ...data },
      },
    };
  }

  const toolInput = extractToolOutput(data);
  if (!toolInput) {
    return {
      error: {
        status: 502,
        body: { error: "Model did not return seo_content_output tool result" },
      },
    };
  }

  try {
    return { result: normalizeOutput(toolInput) };
  } catch (e) {
    return {
      error: {
        status: 502,
        body: {
          error: e instanceof Error ? e.message : "Invalid model output",
        },
      },
    };
  }
}

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(), body: "" };
  }

  if (event.httpMethod === "GET") {
    return json(200, {
      ok: true,
      service: "seo-optimize",
      model: getModel(),
      max_tokens: getMaxTokens(),
      auth: "ANTHROPIC_API_KEY Netlify ortam değişkeninde saklanır; istemci göndermez.",
      body: 'POST JSON: { "raw_text": "ham metin..." }',
      response:
        "{ title, meta_description, meta_keywords, slug, content_html }",
    });
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  let payload;
  try {
    payload = JSON.parse(event.body ?? "{}");
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const rawText =
    typeof payload.raw_text === "string" ? payload.raw_text.trim() : "";
  if (!rawText) {
    return json(400, { error: "raw_text required (non-empty string)" });
  }
  if (rawText.length > MAX_RAW_TEXT_LENGTH) {
    return json(413, {
      error: `raw_text too long (max ${MAX_RAW_TEXT_LENGTH} characters)`,
    });
  }

  const { error, result } = await callClaude(rawText);
  if (error) {
    return json(error.status, error.body);
  }

  return json(200, result);
}
