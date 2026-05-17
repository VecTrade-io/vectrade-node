/** SSE streaming utilities using Web Streams API. */

import { ConnectionError } from "./errors";

export interface StreamChunk {
  content?: string;
  done?: boolean;
  model?: string;
  usage?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Parse a ReadableStream of SSE data into typed chunks.
 * Works in Node.js 18+, Deno, Bun, and Cloudflare Workers.
 *
 * Accepts either a Response object or a raw ReadableStream.
 */
export async function* parseSSEStream(
  input: Response | ReadableStream<Uint8Array>
): AsyncGenerator<StreamChunk> {
  const stream = input instanceof ReadableStream ? input : input.body;
  if (!stream) {
    throw new ConnectionError("Response body is null — cannot parse SSE stream");
  }

  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const data = line.slice(6);
        if (data === "[DONE]") {
          yield { done: true };
          return;
        }

        try {
          const parsed = JSON.parse(data);
          if (parsed.type === "done") {
            yield { done: true };
            return;
          }

          yield {
            content: parsed.content ?? undefined,
            model: parsed.model ?? undefined,
            usage: parsed.usage ?? undefined,
            metadata: parsed.metadata ?? undefined,
          };
        } catch {
          // Non-JSON data line, yield as raw content
          yield { content: data };
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Create a ReadableStream from an SSE response for use in Next.js/Edge streaming.
 */
export function toReadableStream(response: Response): ReadableStream<string> {
  const generator = parseSSEStream(response);

  return new ReadableStream<string>({
    async pull(controller) {
      try {
        const { done, value } = await generator.next();
        if (done) {
          controller.close();
        } else {
          controller.enqueue(value.content ?? "");
        }
      } catch (error) {
        controller.error(error);
      }
    },
    cancel() {
      generator.return(undefined);
    },
  });
}
