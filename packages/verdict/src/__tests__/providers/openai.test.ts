import { describe, it, expect, vi, beforeEach } from "vitest";
import { createOpenAIProvider } from "../../providers/openai.js";
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

describe("openai provider", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("provider creation", () => {
    it("creates provider with correct name and default model", () => {
      const provider = createOpenAIProvider("sk-test-key");
      expect(provider.name).toBe("openai");
      expect(provider.model).toBe("gpt-4o");
    });

    it("uses custom model when provided", () => {
      const provider = createOpenAIProvider("sk-test-key", "gpt-4o-mini");
      expect(provider.model).toBe("gpt-4o-mini");
    });
  });

  describe("non-streaming completion", () => {
    it("sends correct request format", async () => {
      const responseData = {
        choices: [{ message: { content: "Test response" } }],
        usage: { prompt_tokens: 10, completion_tokens: 5 },
        model: "gpt-4o",
      };
      mockFetch.mockResolvedValueOnce(makeOkResponse(responseData));

      const provider = createOpenAIProvider("sk-test-key");
      await provider.complete({
        system: "You are a helpful assistant",
        userMessage: "Hello",
        maxTokens: 1000,
        temperature: 0.7,
      });

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];

      expect(url).toBe("https://api.openai.com/v1/chat/completions");
      expect(init.method).toBe("POST");

      const headers = init.headers as Record<string, string>;
      expect(headers["Content-Type"]).toBe("application/json");
      expect(headers["Authorization"]).toBe("Bearer sk-test-key");

      const body = JSON.parse(init.body as string) as {
        model: string;
        messages: Array<{ role: string; content: string }>;
        max_tokens: number;
        temperature: number;
        stream: boolean;
      };
      expect(body.model).toBe("gpt-4o");
      expect(body.messages).toEqual([
        { role: "system", content: "You are a helpful assistant" },
        { role: "user", content: "Hello" },
      ]);
      expect(body.max_tokens).toBe(1000);
      expect(body.temperature).toBe(0.7);
      expect(body.stream).toBe(false);
    });

    it("parses non-streaming response correctly", async () => {
      const responseData = {
        choices: [{ message: { content: "The answer is 42." } }],
        usage: { prompt_tokens: 15, completion_tokens: 8 },
        model: "gpt-4o",
      };
      mockFetch.mockResolvedValueOnce(makeOkResponse(responseData));

      const provider = createOpenAIProvider("sk-test-key");
      const result = await provider.complete({
        system: "You are helpful",
        userMessage: "What is the answer?",
        maxTokens: 500,
        temperature: 0.5,
      });

      expect(result.content).toBe("The answer is 42.");
      expect(result.promptTokens).toBe(15);
      expect(result.completionTokens).toBe(8);
      expect(result.model).toBe("gpt-4o");
    });
  });

  describe("streaming completion", () => {
    it("handles streaming with onChunk callback", async () => {
      const sseData = [
        `data: ${JSON.stringify({ choices: [{ delta: { content: "Hello" } }], model: "gpt-4o" })}\n\n`,
        `data: ${JSON.stringify({ choices: [{ delta: { content: " world" } }], usage: { prompt_tokens: 10, completion_tokens: 2 } })}\n\n`,
        `data: [DONE]\n\n`,
      ];

      mockFetch.mockResolvedValueOnce(makeStreamResponse(createMockStream(sseData)));

      const chunks: string[] = [];
      const provider = createOpenAIProvider("sk-test-key");

      const result = await provider.complete({
        system: "You are helpful",
        userMessage: "Say hello",
        maxTokens: 100,
        temperature: 0.7,
        onChunk: (chunk) => chunks.push(chunk),
      });

      expect(chunks).toEqual(["Hello", " world"]);
      expect(result.content).toBe("Hello world");
      expect(result.promptTokens).toBe(10);
      expect(result.completionTokens).toBe(2);
      expect(result.model).toBe("gpt-4o");
    });

    it("sets stream: true and stream_options in streaming requests", async () => {
      const sseData = [`data: [DONE]\n\n`];
      mockFetch.mockResolvedValueOnce(makeStreamResponse(createMockStream(sseData)));

      const provider = createOpenAIProvider("sk-test-key");
      await provider.complete({
        system: "sys",
        userMessage: "msg",
        maxTokens: 100,
        temperature: 0.5,
        onChunk: () => undefined,
      });

      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string) as {
        stream: boolean;
        stream_options: { include_usage: boolean };
      };
      expect(body.stream).toBe(true);
      expect(body.stream_options).toEqual({ include_usage: true });
    });
  });

  describe("error handling", () => {
    it("throws ProviderError on 400 HTTP error", async () => {
      mockFetch.mockResolvedValueOnce(makeErrorResponse(400, "Bad request"));

      const provider = createOpenAIProvider("sk-test-key");
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

      const provider = createOpenAIProvider("sk-test-key");
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

      const provider = createOpenAIProvider("sk-test-key");
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

    it("marks 400 errors as not retryable", async () => {
      mockFetch.mockResolvedValueOnce(makeErrorResponse(400, "Bad request"));

      const provider = createOpenAIProvider("sk-test-key");
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

      const provider = createOpenAIProvider("sk-bad-key");
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
      expect(error.provider).toBe("openai");
    });
  });
});
