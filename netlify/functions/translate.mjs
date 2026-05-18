const DEEPL_FREE = "https://api-free.deepl.com/v2/translate";
const DEEPL_PRO = "https://api.deepl.com/v2/translate";

/** İstemci göndermezse DeepL’e eklenen varsayılanlar (gövdede aynı anahtar varsa override edilir). */
const DEEPL_DEFAULT_FORM = {
  tag_handling: "html",
  preserve_formatting: "1",
  show_billed_characters: "1",
};

function header(event, name) {
  const want = name.toLowerCase();
  for (const [k, v] of Object.entries(event.headers ?? {})) {
    if (k.toLowerCase() === want) return v;
  }
  return undefined;
}

/** DeepL anahtarı Netlify’da tutulmaz; her istekte istemci gönderir. */
function getDeepLAuthKey(event, payload) {
  const auth = header(event, "authorization");
  if (auth) {
    const m = auth.match(/^deepl-auth-key\s+(.+)$/i);
    if (m) return m[1].trim();
  }
  const x = header(event, "x-deepl-auth-key");
  if (x) return String(x).trim();
  if (typeof payload.auth_key === "string" && payload.auth_key.length) {
    return payload.auth_key.trim();
  }
  return null;
}

function deeplEndpoint(authKey) {
  if (process.env.DEEPL_API_URL) return process.env.DEEPL_API_URL;
  return authKey.endsWith(":fx") ? DEEPL_FREE : DEEPL_PRO;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": process.env.CORS_ORIGIN ?? "*",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-DeepL-Auth-Key",
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

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(), body: "" };
  }

  if (event.httpMethod === "GET") {
    return json(200, {
      ok: true,
      service: "translate",
      auth:
        "Her istekte DeepL anahtarı: Authorization: DeepL-Auth-Key <key>, veya X-DeepL-Auth-Key, veya JSON auth_key (Netlify’da saklanmaz).",
      body: "POST JSON: { text, target_lang, source_lang?, ... } — auth_key burada da olabilir, DeepL gövdesine iletilmez.",
      deepl_defaults:
        "İstemci göndermese bile DeepL’e eklenir (JSON’da aynı alan verilirse override): tag_handling=html, preserve_formatting=1, show_billed_characters=1.",
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

  const authKey = getDeepLAuthKey(event, payload);
  if (!authKey) {
    return json(401, {
      error:
        "DeepL auth gerekli: header Authorization: DeepL-Auth-Key … veya X-DeepL-Auth-Key veya gövdede auth_key",
    });
  }

  const { auth_key: _omit, ...translatePayload } = payload;

  const { text, target_lang } = translatePayload;
  if (!target_lang) {
    return json(400, {
      error: "target_lang required",
    });
  }
  const hasText =
    (typeof text === "string" && text.length > 0) ||
    (Array.isArray(text) && text.length > 0);
  if (!hasText) {
    return json(400, { error: "text required (string or non-empty string[])" });
  }

  let formBody;
  try {
    formBody = buildFormBody(translatePayload);
  } catch (e) {
    return json(400, { error: e instanceof Error ? e.message : "Bad payload" });
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
    return json(res.status, data.message ? { message: data.message, ...data } : data);
  }

  return json(200, data);
}
