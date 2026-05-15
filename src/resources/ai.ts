import type { VecTrade } from "../client";

export interface AIChunk {
  text: string;
  type: "text" | "citation" | "done";
}

export class AI {
  private client: VecTrade;

  constructor(client: VecTrade) {
    this.client = client;
  }

  /** Stream an AI analysis response. */
  async *stream(prompt: string): AsyncGenerator<AIChunk> {
    const url = new URL("/vq/ai/analyze", this.client.baseURL);
    const headers = new Headers();
    headers.set("Authorization", `Bearer ${this.client.apiKey}`);
    headers.set("Content-Type", "application/json");

    const response = await fetch(url.toString(), {
      method: "POST",
      headers,
      body: JSON.stringify({ prompt, stream: true }),
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
          const data = JSON.parse(line.slice(6)) as AIChunk;
          if (data.type === "done") return;
          yield data;
        }
      }
    }
  }
}
