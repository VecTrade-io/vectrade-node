import { describe, it, expect } from "vitest";
import { parseSSEStream, toReadableStream } from "../src/streaming";
import { ConnectionError } from "../src/errors";

function createReadableStream(lines: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const line of lines) {
        controller.enqueue(encoder.encode(line + "\n\n"));
      }
      controller.close();
    },
  });
}

describe("Streaming SSE", () => {
  describe("parseSSEStream", () => {
    it("parses text content events", async () => {
      const stream = createReadableStream([
        'data: {"content": "Hello"}',
        'data: {"content": " World"}',
        "data: [DONE]",
      ]);
      const chunks: string[] = [];
      for await (const chunk of parseSSEStream(stream)) {
        if (chunk.content) chunks.push(chunk.content);
      }
      expect(chunks).toEqual(["Hello", " World"]);
    });

    it("handles [DONE] sentinel", async () => {
      const stream = createReadableStream(["data: [DONE]"]);
      const events: unknown[] = [];
      for await (const event of parseSSEStream(stream)) {
        events.push(event);
      }
      expect(events).toHaveLength(1);
      expect(events[0]).toHaveProperty("done", true);
    });

    it("ignores empty lines and comments", async () => {
      const stream = createReadableStream([
        ": this is a comment",
        "",
        'data: {"content": "test"}',
        "data: [DONE]",
      ]);
      const chunks: string[] = [];
      for await (const chunk of parseSSEStream(stream)) {
        if (chunk.content) chunks.push(chunk.content);
      }
      expect(chunks).toEqual(["test"]);
    });

    it("handles multi-field JSON data", async () => {
      const stream = createReadableStream([
        'data: {"content": "x", "model": "vt-analyst", "usage": {"tokens": 5}}',
        "data: [DONE]",
      ]);
      const events: unknown[] = [];
      for await (const event of parseSSEStream(stream)) {
        events.push(event);
      }
      expect(events[0]).toHaveProperty("content", "x");
      expect(events[0]).toHaveProperty("model", "vt-analyst");
    });

    it("throws ConnectionError when body is null", async () => {
      const fakeResponse = { body: null } as unknown as Response;
      const gen = parseSSEStream(fakeResponse);
      await expect(gen.next()).rejects.toBeInstanceOf(ConnectionError);
    });
  });

  describe("toReadableStream", () => {
    it("converts SSE response to text ReadableStream", async () => {
      const stream = createReadableStream([
        'data: {"content": "chunk1"}',
        'data: {"content": "chunk2"}',
        "data: [DONE]",
      ]);
      const fakeResponse = { body: stream } as unknown as Response;
      const readable = toReadableStream(fakeResponse);
      const reader = readable.getReader();

      const r1 = await reader.read();
      expect(r1.value).toBe("chunk1");
      const r2 = await reader.read();
      expect(r2.value).toBe("chunk2");
    });

    it("propagates errors to the stream consumer", async () => {
      const fakeResponse = { body: null } as unknown as Response;
      const readable = toReadableStream(fakeResponse);
      const reader = readable.getReader();
      await expect(reader.read()).rejects.toBeInstanceOf(ConnectionError);
    });
  });
});
