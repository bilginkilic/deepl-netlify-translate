const DEEPL_FREE = "https://api-free.deepl.com/v2/translate";
const DEEPL_PRO = "https://api.deepl.com/v2/translate";

/** İstemci göndermezse DeepL'e eklenen varsayılanlar (gövdede aynı anahtar varsa override edilir). */
const DEEPL_DEFAULT_FORM = {
  tag_handling: "html",
  preserve_formatting: "1",
  show_billed_characters: "1",
};

function header(headers, name) {
  const want = name.toLowerCase();
  for (const [k, v] of Object.entries(headers ?? {})) {
    if (k.toLowerCase() === want) return v;
  }
  return undefined;
}

/** Render ortam değişkenindeki DeepL anahtarı (öncelikli). */
function getServerDeepLAuthKey() {
  const key = process.env.DEEPL_AUTH_KEY;
  if (typeof key === "string" && key.trim().length) {
    return key.trim();
  }
  return null;
}

/**
 * İstemci anahtarı yalnızca DEEPL_AUTH_KEY env tanımlı değilse (yerel geliştirme).
 * Üretimde Render dashboard → Environment → DEEPL_AUTH_KEY kullanın.
 */
function getClientDeepLAuthKey(headers, payload) {
  const auth = header(headers, "authorization");
  if (auth) {
    const m = auth.match(/^deepl-auth-key\s+(.+)$/i);
    if (m) return m[1].trim();
  }
  const x = header(headers, "x-deepl-auth-key");
  if (x) return String(x).trim();
  if (typeof payload.auth_key === "string" && payload.auth_key.length) {
    return payload.auth_key.trim();
  }
  return null;
}

function getDeepLAuthKey(headers, payload) {
  const serverKey = getServerDeepLAuthKey();
  if (serverKey) {
    // İstemci Authorization / auth_key gönderse bile yoksayılır; hata verilmez.
    return serverKey;
  }
  return getClientDeepLAuthKey(headers, payload);
}

function deeplEndpoint(authKey) {
  if (process.env.DEEPL_API_URL) return process.env.DEEPL_API_URL;
  return authKey.endsWith(":fx") ? DEEPL_FREE : DEEPL_PRO;
}

export function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": process.env.CORS_ORIGIN ?? "*",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-DeepL-Auth-Key",
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
  };
}

function buildFormBody(payload) {
  const {
    text,
    target_lang,
    source_lang,
    context,
    split_sentences,
    preserve_formatting,
    formality,
    glossary_id,
    model_type,
    tag_handling,
    show_billed_characters,
    outline_detection,
    non_splitting_tags,
    splitting_tags,
    ignore_tags,
  } = payload;

  const params = new URLSearchParams();
  if (Array.isArray(text)) {
    for (const t of text) {
      if (typeof t !== "string" || !t.length) {
        throw new Error("each text item must be a non-empty string");
      }
      params.append("text", t);
    }
  } else if (typeof text === "string" && text.length) {
    params.set("text", text);
  } else {
    throw new Error("text must be a non-empty string or string[]");
  }

  params.set("target_lang", String(target_lang).toUpperCase());
  if (typeof source_lang === "string" && source_lang.length) {
    params.set("source_lang", source_lang.toUpperCase());
  }

  const optional = { ...DEEPL_DEFAULT_FORM };
  const fromPayload = {
    context,
    split_sentences,
    preserve_formatting,
    formality,
    glossary_id,
    model_type,
    tag_handling,
    show_billed_characters,
    outline_detection,
    non_splitting_tags,
    splitting_tags,
    ignore_tags,
  };
  for (const [k, v] of Object.entries(fromPayload)) {
    if (v !== undefined && v !== null) optional[k] = v;
  }
  for (const [k, v] of Object.entries(optional)) {
    if (v !== undefined && v !== null) params.set(k, String(v));
  }

  return params.toString();
}

function infoBody() {
  const serverKey = getServerDeepLAuthKey();
  return {
    ok: true,
    service: "translate",
    auth: serverKey
      ? "DeepL anahtarı Render DEEPL_AUTH_KEY env ile kullanılır. İstemci Authorization / X-DeepL-Auth-Key / auth_key gönderirse yoksayılır (geriye dönük uyum, hata yok)."
      : "DEEPL_AUTH_KEY env tanımlı değil (yerel mod): Authorization: DeepL-Auth-Key …, X-DeepL-Auth-Key veya JSON auth_key.",
    body: "POST JSON: { text, target_lang, source_lang?, ... } — auth_key varsa DeepL gövdesine iletilmez; env tanımlıysa istemci anahtarı kullanılmaz.",
    deepl_defaults:
      "İstemci göndermese bile DeepL'e eklenir (JSON'da aynı alan verilirse override): tag_handling=html, preserve_formatting=1, show_billed_characters=1.",
  };
}

/**
 * @param {{ method: string, headers?: Record<string, string>, body?: object, bodyRaw?: string }} input
 * @returns {Promise<{ status: number, body: object | null }>}
 */
export async function processTranslateRequest({ method, headers, body, bodyRaw }) {
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

  const authKey = getDeepLAuthKey(headers, payload);
  if (!authKey) {
    return {
      status: 503,
      body: {
        error:
          "DeepL anahtarı yapılandırılmamış. Render dashboard → Environment → DEEPL_AUTH_KEY ekleyin (yerel: .env veya export).",
      },
    };
  }

  const { auth_key: _omit, ...translatePayload } = payload;

  const { text, target_lang } = translatePayload;
  if (!target_lang) {
    return { status: 400, body: { error: "target_lang required" } };
  }
  const hasText =
    (typeof text === "string" && text.length > 0) ||
    (Array.isArray(text) && text.length > 0);
  if (!hasText) {
    return {
      status: 400,
      body: { error: "text required (string or non-empty string[])" },
    };
  }

  let formBody;
  try {
    formBody = buildFormBody(translatePayload);
  } catch (e) {
    return {
      status: 400,
      body: { error: e instanceof Error ? e.message : "Bad payload" },
    };
  }

  const res = await fetch(deeplEndpoint(authKey), {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${authKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formBody,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      status: res.status,
      body: data.message ? { message: data.message, ...data } : data,
    };
  }

  return { status: 200, body: data };
}
