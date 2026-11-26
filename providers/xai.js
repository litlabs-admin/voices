// xAI voice provider.
// Keys are read from the environment and never sent to the browser.
//
// Verified endpoints (api.x.ai):
//   GET  /v1/tts/voices  -> { voices: [{ voice_id, name, language, gender }] }
//   POST /v1/tts         -> audio/mpeg  (body: { voice_id, text, language })

const BASE_URL = process.env.XAI_BASE_URL || "https://api.x.ai/v1";
const API_KEY = process.env.XAI_API_KEY || "";

export function isConfigured() {
  return Boolean(API_KEY);
}

function authHeaders() {
  return {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  };
}

// Fetch the list of available voices from xAI.
export async function listVoices() {
  const res = await fetch(`${BASE_URL}/tts/voices`, { headers: authHeaders() });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`xAI voices request failed (${res.status}): ${body}`);
  }
  const data = await res.json();
  const voices = data.voices || [];
  console.log(`[xai] /tts/voices returned ${voices.length} voices`);
  return voices.map((v) => ({
    id: v.voice_id,
    name: v.name,
    description: `${capitalize(v.gender)} · ${capitalize(v.language)}`,
    provider: "xai",
    language: v.language,
  }));
}

// Generate a short preview clip for a voice. Returns { buffer, contentType }.
export async function preview(voiceId, text, _locale, language = "en") {
  const res = await fetch(`${BASE_URL}/tts`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      voice_id: voiceId,
      text,
      // xAI voices are multilingual; "en" is a safe default for the sample.
      language: language && language !== "multilingual" ? language : "en",
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`xAI preview failed (${res.status}): ${body}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  return { buffer, contentType: res.headers.get("content-type") || "audio/mpeg" };
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
