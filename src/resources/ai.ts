import type { VecTrade } from "../client";
import { SDK_VERSION } from "../version";

export interface AIChunk {
  text: string;
  type: "text" | "citation" | "done";
}

export class AI {
  private readonly client: VecTrade;

  constructor(client: VecTrade) {
    this.client = client;
  }

  /** Stream an AI analysis response. */
  async *stream(prompt: string): AsyncGenerator<AIChunk> {
    const base = this.client.baseURL.endsWith("/")
      ? this.client.baseURL.slice(0, -1)
      : this.client.baseURL;
    const url = new URL(`${base}/vq/ai/analyze`);
    const headers = new Headers();
    headers.set("Authorization", `Bearer ${this.client.apiKey}`);
    headers.set("Content-Type", "application/json");
    headers.set("User-Agent", `vectrade-node/${SDK_VERSION}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.client.timeout);

    try {
      const response = await fetch(url.toString(), {
        method: "POST",
        headers,
        body: JSON.stringify({ prompt, stream: true }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`AI stream failed: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const raw = line.slice(6);
            if (raw === "[DONE]") return;
            try {
              const data = JSON.parse(raw) as AIChunk;
              if (data.type === "done") return;
              yield data;
            } catch {
              // Non-JSON data line — yield as raw text
              yield { text: raw, type: "text" as const };
            }
          }
        }
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
