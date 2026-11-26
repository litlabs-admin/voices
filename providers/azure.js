// Azure Speech voice provider.
// Needs AZURE_SPEECH_KEY + AZURE_SPEECH_REGION (ask Vivek when ready).

const KEY = process.env.AZURE_SPEECH_KEY || "";
const REGION = process.env.AZURE_SPEECH_REGION || "";

export function isConfigured() {
  return Boolean(KEY && REGION);
}

// GET the full list of Azure neural voices.
export async function listVoices() {
  const url = `https://${REGION}.tts.speech.microsoft.com/cognitiveservices/voices/list`;
  const res = await fetch(url, {
    headers: { "Ocp-Apim-Subscription-Key": KEY },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Azure voices request failed (${res.status}): ${body}`);
  }
  const data = await res.json();
  return data.map((v) => ({
    id: v.ShortName,
    name: `${v.DisplayName} - ${v.LocaleName}`,
    description: `${v.Gender} · ${v.VoiceType}`,
    provider: "azure",
    locale: v.Locale,
  }));
}

// Synthesize a preview clip via SSML. Returns { buffer, contentType }.
export async function preview(voiceId, text, locale = "en-US") {
  const ssml = `<speak version='1.0' xml:lang='${locale}'>
    <voice name='${voiceId}'>${escapeXml(text)}</voice>
  </speak>`;
  const url = `https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": KEY,
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
    },
    body: ssml,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Azure preview failed (${res.status}): ${body}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  return { buffer, contentType: "audio/mpeg" };
}

function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c])
  );
}
