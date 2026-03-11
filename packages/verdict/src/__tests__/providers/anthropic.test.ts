import { describe, it, expect, vi, beforeEach } from "vitest";
import { createAnthropicProvider } from "../../providers/anthropic.js";
import { ProviderError } from "../../providers/types.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function createMockStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
}

function makeOkResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
    body: null,
  } as unknown as Response;
}

function makeStreamResponse(stream: ReadableStream<Uint8Array>): Response {
  return {
    ok: true,
    status: 200,
    body: stream,
    json: () => Promise.reject(new Error("not json")),
    text: () => Promise.reject(new Error("not text")),
  } as unknown as Response;
}

function makeErrorResponse(status: number, body: string): Response {
  return {
    ok: false,
    status,
    text: () => Promise.resolve(body),
    json: () => Promise.reject(new Error("error response")),
    body: null,
  } as unknown as Response;
}

describe("anthropic provider", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("provider creation", () => {
    it("creates provider with correct name and default model", () => {
      const provider = createAnthropicProvider("sk-ant-test-key");
      expect(provider.name).toBe("anthropic");
      expect(provider.model).toBe("claude-sonnet-4-5-20250514");
    });

    it("uses custom model when provided", () => {
      const provider = createAnthropicProvider("sk-ant-test-key", "claude-opus-4-6");
      expect(provider.model).toBe("claude-opus-4-6");
    });
  });

  describe("request format", () => {
    it("sends x-api-key and anthropic-version headers", async () => {
      const responseData = {
        content: [{ type: "text", text: "Hello" }],
        usage: { input_tokens: 10, output_tokens: 5 },
        model: "claude-sonnet-4-5-20250514",
      };
      mockFetch.mockResolvedValueOnce(makeOkResponse(responseData));

      const provider = createAnthropicProvider("sk-ant-my-key");
      await provider.complete({
        system: "You are helpful",
        userMessage: "Hello",
        maxTokens: 500,
        temperature: 0.7,
      });

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];

      expect(url).toBe("https://api.anthropic.com/v1/messages");
      expect(init.method).toBe("POST");

      const headers = init.headers as Record<string, string>;
      expect(headers["x-api-key"]).toBe("sk-ant-my-key");
      expect(headers["anthropic-version"]).toBe("2023-06-01");
      expect(headers["Content-Type"]).toBe("application/json");
    });

    it("sends system as top-level field, not inside messages", async () => {
      const responseData = {
        content: [{ type: "text", text: "Response" }],
        usage: { input_tokens: 10, output_tokens: 5 },
        model: "claude-sonnet-4-5-20250514",
      };
      mockFetch.mockResolvedValueOnce(makeOkResponse(responseData));

      const provider = createAnthropicProvider("sk-ant-test-key");
      await provider.complete({
        system: "You are a debate expert",
        userMessage: "Argue for renewable energy",
        maxTokens: 1000,
        temperature: 0.8,
      });

      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string) as {
        system: string;
        messages: Array<{ role: string; content: string }>;
      };

      // System should be top-level
      expect(body.system).toBe("You are a debate expert");

      // Messages should only contain the user message, not a system message
      expect(body.messages).toEqual([{ role: "user", content: "Argue for renewable energy" }]);
      expect(body.messages.every((m) => m.role !== "system")).toBe(true);
    });
  });

  describe("non-streaming completion", () => {
    it("parses response content array with type text", async () => {
      const responseData = {
        content: [{ type: "text", text: "Response text" }],
        usage: { input_tokens: 10, output_tokens: 20 },
        model: "claude-sonnet-4-5-20250514",
      };
      mockFetch.mockResolvedValueOnce(makeOkResponse(responseData));

      const provider = createAnthropicProvider("sk-ant-test-key");
      const result = await provider.complete({
        system: "sys",
        userMessage: "msg",
        maxTokens: 500,
        temperature: 0.5,
      });

      expect(result.content).toBe("Response text");
      expect(result.promptTokens).toBe(10);
      expect(result.completionTokens).toBe(20);
      expect(result.model).toBe("claude-sonnet-4-5-20250514");
    });

    it("concatenates multiple text blocks in content array", async () => {
      const responseData = {
        content: [
          { type: "text", text: "First part. " },
          { type: "text", text: "Second part." },
        ],
        usage: { input_tokens: 5, output_tokens: 10 },
        model: "claude-sonnet-4-5-20250514",
      };
      mockFetch.mockResolvedValueOnce(makeOkResponse(responseData));

      const provider = createAnthropicProvider("sk-ant-test-key");
      const result = await provider.complete({
        system: "sys",
        userMessage: "msg",
        maxTokens: 500,
        temperature: 0.5,
      });

      expect(result.content).toBe("First part. Second part.");
    });
  });

  describe("streaming completion", () => {
    it("handles streaming with Anthropic SSE events and onChunk callback", async () => {
      const sseLines = [
        `event: message_start`,
        `data: ${JSON.stringify({ type: "message_start", message: { model: "claude-sonnet-4-5-20250514", usage: { input_tokens: 10 } } })}`,
        ``,
        `event: content_block_delta`,
        `data: ${JSON.stringify({ type: "content_block_delta", delta: { type: "text_delta", text: "Hello" } })}`,
        ``,
        `event: content_block_delta`,
        `data: ${JSON.stringify({ type: "content_block_delta", delta: { type: "text_delta", text: " world" } })}`,
        ``,
        `event: message_delta`,
        `data: ${JSON.stringify({ type: "message_delta", usage: { output_tokens: 5 } })}`,
        ``,
        `event: message_stop`,
        `data: ${JSON.stringify({ type: "message_stop" })}`,
        ``,
      ];

      const sseData = sseLines.join("\n");
      mockFetch.mockResolvedValueOnce(makeStreamResponse(createMockStream([sseData])));

      const chunks: string[] = [];
      const provider = createAnthropicProvider("sk-ant-test-key");

      const result = await provider.complete({
        system: "sys",
        userMessage: "msg",
        maxTokens: 100,
        temperature: 0.5,
        onChunk: (chunk) => chunks.push(chunk),
      });

      expect(chunks).toEqual(["Hello", " world"]);
      expect(result.content).toBe("Hello world");
      expect(result.promptTokens).toBe(10);
      expect(result.completionTokens).toBe(5);
      expect(result.model).toBe("claude-sonnet-4-5-20250514");
    });

    it("sets stream: true in streaming requests", async () => {
      // Empty stream that closes immediately
      const sseData = `event: message_stop\ndata: ${JSON.stringify({ type: "message_stop" })}\n\n`;
      mockFetch.mockResolvedValueOnce(makeStreamResponse(createMockStream([sseData])));

      const provider = createAnthropicProvider("sk-ant-test-key");
      await provider.complete({
        system: "sys",
        userMessage: "msg",
        maxTokens: 100,
        temperature: 0.5,
        onChunk: () => undefined,
      });

      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string) as { stream: boolean };
      expect(body.stream).toBe(true);
    });
  });

  describe("error handling", () => {
    it("throws ProviderError on HTTP errors", async () => {
      mockFetch.mockResolvedValueOnce(makeErrorResponse(400, "Bad request"));

      const provider = createAnthropicProvider("sk-ant-test-key");
      await expect(
        provider.complete({
          system: "sys",
          userMessage: "msg",
          maxTokens: 100,
          temperature: 0.5,
        }),
      ).rejects.toThrow(ProviderError);
    });

    it("throws ProviderError on 429 and marks retryable", async () => {
      mockFetch.mockResolvedValueOnce(makeErrorResponse(429, "Rate limit exceeded"));

      const provider = createAnthropicProvider("sk-ant-test-key");
      let caught: unknown;
      try {
        await provider.complete({
          system: "sys",
          userMessage: "msg",
          maxTokens: 100,
          temperature: 0.5,
        });
      } catch (err) {
        caught = err;
      }

      expect(caught).toBeInstanceOf(ProviderError);
      const error = caught as ProviderError;
      expect(error.status).toBe(429);
      expect(error.retryable).toBe(true);
    });

    it("throws ProviderError on 500 and marks retryable", async () => {
      mockFetch.mockResolvedValueOnce(makeErrorResponse(500, "Internal Server Error"));

      const provider = createAnthropicProvider("sk-ant-test-key");
      let caught: unknown;
      try {
        await provider.complete({
          system: "sys",
          userMessage: "msg",
          maxTokens: 100,
          temperature: 0.5,
        });
      } catch (err) {
        caught = err;
      }

      expect(caught).toBeInstanceOf(ProviderError);
      const error = caught as ProviderError;
      expect(error.status).toBe(500);
      expect(error.retryable).toBe(true);
    });

    it("marks 401 errors as not retryable", async () => {
      mockFetch.mockResolvedValueOnce(makeErrorResponse(401, "Unauthorized"));

      const provider = createAnthropicProvider("sk-ant-bad-key");
      let caught: unknown;
      try {
        await provider.complete({
          system: "sys",
          userMessage: "msg",
          maxTokens: 100,
          temperature: 0.5,
        });
      } catch (err) {
        caught = err;
      }

      expect(caught).toBeInstanceOf(ProviderError);
      const error = caught as ProviderError;
      expect(error.retryable).toBe(false);
    });

    it("sets provider name in error", async () => {
      mockFetch.mockResolvedValueOnce(makeErrorResponse(401, "Unauthorized"));

      const provider = createAnthropicProvider("sk-ant-bad-key");
      let caught: unknown;
      try {
        await provider.complete({
          system: "sys",
          userMessage: "msg",
          maxTokens: 100,
          temperature: 0.5,
        });
      } catch (err) {
        caught = err;
      }

      expect(caught).toBeInstanceOf(ProviderError);
      const error = caught as ProviderError;
      expect(error.provider).toBe("anthropic");
    });
  });
});
