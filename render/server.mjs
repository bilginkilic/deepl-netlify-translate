import express from "express";
import { corsHeaders, processTranslateRequest } from "./translate-core.mjs";
import { processSeoRequest } from "./seo-core.mjs";
import { processAnthropicRelayRequest } from "./anthropic-relay-core.mjs";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "2mb" }));

function sendApiResult(res, result) {
  const headers = corsHeaders();
  if (result.status === 204) {
    return res.status(204).set(headers).end();
  }
  return res
    .status(result.status)
    .set({ "Content-Type": "application/json", ...headers })
    .json(result.body);
}

async function handleTranslate(req, res) {
  try {
    const result = await processTranslateRequest({
      method: req.method,
      headers: req.headers,
      body: req.method === "POST" ? req.body : undefined,
      bodyRaw: req.method === "POST" ? undefined : req.body,
    });
    sendApiResult(res, result);
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .set({ "Content-Type": "application/json", ...corsHeaders() })
      .json({ error: "Internal server error" });
  }
}

async function handleSeo(req, res) {
  try {
    const result = await processSeoRequest({
      method: req.method,
      body: req.method === "POST" ? req.body : undefined,
      bodyRaw: req.method === "POST" ? undefined : req.body,
    });
    sendApiResult(res, result);
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .set({ "Content-Type": "application/json", ...corsHeaders() })
      .json({ error: "Internal server error" });
  }
}

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "deepl-translate-proxy",
    translate: "/api/translate",
    seo_optimize: "/api/seo-optimize",
    anthropic_relay: "/api/anthropic/v1/messages",
  });
});

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "deepl-translate-proxy",
    translate: "/api/translate",
    seo_optimize: "/api/seo-optimize",
    anthropic_relay: "/api/anthropic/v1/messages",
  });
});

app.get("/api/translate", handleTranslate);
app.post("/api/translate", handleTranslate);
app.options("/api/translate", handleTranslate);

app.get("/api/seo-optimize", handleSeo);
app.post("/api/seo-optimize", handleSeo);
app.options("/api/seo-optimize", handleSeo);

async function handleAnthropicRelay(req, res) {
  try {
    const result = await processAnthropicRelayRequest({
      method: req.method,
      headers: req.headers,
      body: req.method === "POST" ? req.body : undefined,
    });
    sendApiResult(res, result);
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .set({ "Content-Type": "application/json", ...corsHeaders() })
      .json({ error: "Internal server error" });
  }
}

app.post("/api/anthropic/v1/messages", handleAnthropicRelay);
app.options("/api/anthropic/v1/messages", handleAnthropicRelay);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(port, () => {
  console.log(`deepl-translate-proxy listening on port ${port}`);
});
