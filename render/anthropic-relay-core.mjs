const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const UPSTREAM_TIMEOUT_MS = 50_000;

/**
 * Region relay for the Turkuaz chat plugin: the October host cannot reach
 * Anthropic from its own network (403 "Request not allowed" — unsupported
 * region), so it posts the exact same payload here and this service, which
 * already talks to Anthropic for the SEO endpoint, forwards it verbatim.
 *
 * The caller's `x-api-key` header is passed through when present; otherwise
 * the service's own ANTHROPIC_API_KEY is used. If RELAY_TOKEN is set in the
 * environment, requests must carry a matching `x-relay-token` header — set it
 * so the endpoint is not an open region-bypass proxy for strangers.
 */
export async function processAnthropicRelayRequest({ method, headers = {}, body }) {
  if (method === "OPTIONS") {
    return { status: 204 };
  }

  if (method !== "POST") {
    return { status: 405, body: { error: "Use POST" } };
  }

  const expectedToken = (process.env.RELAY_TOKEN ?? "").trim();
  if (expectedToken !== "") {
    const givenToken = String(headers["x-relay-token"] ?? "").trim();
    if (givenToken !== expectedToken) {
      return { status: 401, body: { error: "Missing or invalid x-relay-token" } };
    }
  }

  // Key priority: caller's own key, then the chat-dedicated env key, then
  // the shared key the SEO endpoint already uses. CHAT_ANTHROPIC_API_KEY
  // lets the chat run on its own key/limits without touching the SEO setup.
  const apiKey =
    String(headers["x-api-key"] ?? "").trim() ||
    (process.env.CHAT_ANTHROPIC_API_KEY ?? "").trim() ||
    (process.env.ANTHROPIC_API_KEY ?? "").trim();
  if (apiKey === "") {
    return { status: 401, body: { error: "No API key: send x-api-key or set CHAT_ANTHROPIC_API_KEY" } };
  }

  if (!body || typeof body !== "object") {
    return { status: 400, body: { error: "JSON body required" } };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  let upstream;
  try {
    upstream = await fetch(ANTHROPIC_API, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": String(headers["anthropic-version"] ?? "2023-06-01"),
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    const timedOut = e?.name === "AbortError";
    return {
      status: 502,
      body: { error: timedOut ? "Upstream timeout" : "Upstream unreachable" },
    };
  } finally {
    clearTimeout(timer);
  }

  const data = await upstream.json().catch(() => ({ error: "Non-JSON upstream response" }));
  return { status: upstream.status, body: data };
}
