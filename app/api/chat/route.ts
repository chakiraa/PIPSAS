import { PIP_SYSTEM_PROMPT } from "@/lib/ai/systemPrompt";

export const runtime = "edge";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  systemContext: string;
  messages: ChatMessage[];
}

const DEFAULT_MODEL = "gemini-2.5-flash";

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response("The AI assistant isn't configured yet: GEMINI_API_KEY is not set on the server.", { status: 500 });
  }

  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return new Response("Invalid request body.", { status: 400 });
  }

  const { systemContext, messages } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response("No messages provided.", { status: 400 });
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const contents = messages
    .slice(-12)
    .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

  let geminiRes: Response;
  try {
    geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: `${PIP_SYSTEM_PROMPT}\n\n${systemContext}` }] },
        contents,
        generationConfig: { temperature: 0.4, maxOutputTokens: 1536 },
      }),
    });
  } catch {
    return new Response("Could not reach the AI provider. Check your connection and try again.", { status: 502 });
  }

  if (!geminiRes.ok || !geminiRes.body) {
    const detail = await geminiRes.text().catch(() => "");
    return new Response(`AI provider error (${geminiRes.status}): ${detail.slice(0, 300)}`, { status: 502 });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const upstreamReader = geminiRes.body.getReader();
  let buffer = "";

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await upstreamReader.read();
      if (done) {
        controller.close();
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      // The last element may be an incomplete line — keep it buffered for the next chunk.
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const parsed = JSON.parse(payload);
          const text = parsed?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
          if (text) controller.enqueue(encoder.encode(text));
        } catch {
          // malformed SSE line — skip it rather than break the stream
        }
      }
    },
    cancel() {
      upstreamReader.cancel().catch(() => {});
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
  });
}
