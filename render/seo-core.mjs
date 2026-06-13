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

function getMaxTokens(rawTextLength = 0) {
  const env = Number(process.env.SEO_MAX_TOKENS);
  if (Number.isFinite(env) && env > 0) return env;
  if (rawTextLength > 5000) return 8192;
  if (rawTextLength > 2000) return 4096;
  return DEFAULT_MAX_TOKENS;
}

function extractToolOutput(data) {
  const blocks = Array.isArray(data?.content) ? data.content : [];
  const toolUse = blocks.find(
    (b) => b?.type === "tool_use" && b?.name === "seo_content_output",
  );
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

function tokenBudgets(rawTextLength) {
  const base = getMaxTokens(rawTextLength);
  const large = Math.max(base, 8192);
  return base === large ? [base] : [base, large];
}

async function callClaudeOnce(rawText, maxTokens, apiKey) {
  const res = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: getModel(),
      max_tokens: maxTokens,
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
      retryable: false,
      error: {
        status: res.status >= 400 && res.status < 600 ? res.status : 502,
        body: { error: message, ...data },
      },
    };
  }

  const toolInput = extractToolOutput(data);
  if (!toolInput) {
    return {
      retryable: true,
      error: {
        status: 502,
        body: { error: "Model did not return seo_content_output tool result" },
      },
    };
  }

  try {
    return { result: normalizeOutput(toolInput) };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid model output";
    return {
      retryable: message.includes("content_html"),
      error: { status: 502, body: { error: message } },
    };
  }
}

async function callClaude(rawText) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      error: {
        status: 500,
        body: { error: "ANTHROPIC_API_KEY missing on server" },
      },
    };
  }

  const budgets = tokenBudgets(rawText.length);
  let lastError = null;

  for (let i = 0; i < budgets.length; i++) {
    const outcome = await callClaudeOnce(rawText, budgets[i], apiKey);
    if (outcome.result) return outcome;
    lastError = outcome.error;
    if (!outcome.retryable || i === budgets.length - 1) {
      return { error: outcome.error };
    }
  }

  return {
    error: lastError ?? { status: 502, body: { error: "SEO optimize failed" } },
  };
}

function infoBody() {
  return {
    ok: true,
    service: "seo-optimize",
    model: getModel(),
    max_tokens: getMaxTokens(),
    auth: "ANTHROPIC_API_KEY Render ortam değişkeninde saklanır; istemci göndermez.",
    body: 'POST JSON: { "raw_text": "ham metin..." }',
    response: "{ title, meta_description, meta_keywords, slug, content_html }",
  };
}

/**
 * @param {{ method: string, body?: object, bodyRaw?: string }} input
 * @returns {Promise<{ status: number, body: object | null }>}
 */
export async function processSeoRequest({ method, body, bodyRaw }) {
  const httpMethod = method.toUpperCase();

  if (httpMethod === "OPTIONS") {
    return { status: 204, body: null };
  }

  if (httpMethod === "GET") {
    return { status: 200, body: infoBody() };
  }

  if (httpMethod !== "POST") {
    return { status: 405, body: { error: "Method not allowed" } };
  }

  let payload;
  if (body !== undefined && body !== null && typeof body === "object") {
    payload = body;
  } else {
    try {
      payload = JSON.parse(bodyRaw ?? "{}");
    } catch {
      return { status: 400, body: { error: "Invalid JSON" } };
    }
  }

  const rawText =
    typeof payload.raw_text === "string" ? payload.raw_text.trim() : "";
  if (!rawText) {
    return { status: 400, body: { error: "raw_text required (non-empty string)" } };
  }
  if (rawText.length > MAX_RAW_TEXT_LENGTH) {
    return {
      status: 413,
      body: { error: `raw_text too long (max ${MAX_RAW_TEXT_LENGTH} characters)` },
    };
  }

  const { error, result } = await callClaude(rawText);
  if (error) {
    return { status: error.status, body: error.body };
  }

  return { status: 200, body: result };
}
