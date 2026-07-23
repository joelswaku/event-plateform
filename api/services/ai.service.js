import { db } from "../config/db.js";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-opus-4-7";

export class AppError extends Error {
  constructor(message, statusCode = 400, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export async function callAI({ feature, systemPrompt, userPrompt, responseFormat = "json", maxTokens = 2048 }) {
  const start = Date.now();

  // Read lazily so dotenv.config() in server.js has already run
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const isValidKey = apiKey && apiKey.startsWith('sk-ant-api03-') && apiKey.length > 50;

  if (!isValidKey) {
    throw new AppError("ANTHROPIC_API_KEY is not configured or invalid. AI features are disabled.", 500);
  }

  const body = {
    model: MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  };

  let resp;
  try {
    resp = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(90000), // 90s server-side timeout
    });
  } catch (err) {
    if (err.name === "TimeoutError") {
      throw new AppError("AI request timed out after 90s", 504);
    }
    throw new AppError(`AI network error: ${err.message}`, 502);
  }

  if (!resp.ok) {
    const errText = await resp.text();
    throw new AppError(`Anthropic API error ${resp.status}: ${errText}`, 502);
  }

  let json;
  try {
    json = await resp.json();
  } catch (err) {
    throw new AppError("Failed to parse Anthropic response", 502);
  }

  const rawText = json.content?.[0]?.text ?? "";
  const usage = json.usage ?? { input_tokens: 0, output_tokens: 0 };

  let content;
  if (responseFormat === "json") {
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
    try {
      content = JSON.parse(cleaned);
    } catch {
      throw new AppError(`AI returned invalid JSON: ${cleaned.slice(0, 200)}`, 502);
    }
  } else {
    content = rawText;
  }

  return { content, usage, latencyMs: Date.now() - start };
}

export async function logAIGeneration({ organizationId, userId, eventId, feature, usage, inputSnapshot, outputSnapshot, latencyMs }) {
  try {
    await db.query(
      `INSERT INTO ai_generation_logs
        (organization_id, user_id, event_id, feature, input_tokens, output_tokens, input_snapshot, output_snapshot, latency_ms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        organizationId ?? null,
        userId ?? null,
        eventId ?? null,
        feature,
        usage?.input_tokens ?? 0,
        usage?.output_tokens ?? 0,
        inputSnapshot ? String(inputSnapshot).slice(0, 2000) : null,
        outputSnapshot ? String(outputSnapshot).slice(0, 2000) : null,
        latencyMs ?? null,
      ]
    );
  } catch (err) {
    console.error("[logAIGeneration] Failed to log:", err.message);
  }
}

export async function streamAI({ feature, systemPrompt, userPrompt, res }) {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    res.status(500).json({ success: false, message: "AI not configured" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  try {
    const body = {
      model: MODEL,
      max_tokens: 2048,
      stream: true,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    };

    const resp = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: "AI API error" })}\n\n`);
      res.end();
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
            res.write(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`);
          }
        } catch {
          // skip malformed lines
        }
      }
    }

    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (err) {
    console.error("[streamAI] Error:", err.message);
    res.write(`event: error\ndata: ${JSON.stringify({ message: "Stream failed" })}\n\n`);
    res.end();
  }
}
