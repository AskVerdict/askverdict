import { describe, it, expect, vi, beforeEach } from "vitest";
import { createGoogleProvider } from "../../providers/google.js";
import { ProviderError } from "../../providers/types.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

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

describe("google provider", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("provider creation", () => {
    it("creates provider with correct name and default model", () => {
      const provider = createGoogleProvider("gemini-test-key");
      expect(provider.name).toBe("google");
      expect(provider.model).toBe("gemini-2.5-flash");
    });

    it("uses custom model when provided", () => {
      const provider = createGoogleProvider("gemini-test-key", "gemini-2.0-pro");
      expect(provider.model).toBe("gemini-2.0-pro");
    });
  });

  describe("request format", () => {
    it("sends to the correct Gemini OpenAI-compat URL", async () => {
      const responseData = {
        choices: [{ message: { content: "Hello" } }],
        usage: { prompt_tokens: 5, completion_tokens: 3 },
        model: "gemini-2.5-flash",
      };
      mockFetch.mockResolvedValueOnce(makeOkResponse(responseData));

      const provider = createGoogleProvider("gemini-test-key");
      await provider.complete({
        system: "You are helpful",
        userMessage: "Hello",
        maxTokens: 500,
        temperature: 0.7,
      });

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(GEMINI_API_URL);
    });

    it("sends Bearer auth header with the API key", async () => {
      const responseData = {
        choices: [{ message: { content: "Hello" } }],
        usage: { prompt_tokens: 5, completion_tokens: 3 },
        model: "gemini-2.5-flash",
      };
      mockFetch.mockResolvedValueOnce(makeOkResponse(responseData));

      const provider = createGoogleProvider("my-gemini-api-key");
      await provider.complete({
        system: "sys",
        userMessage: "msg",
        maxTokens: 100,
        temperature: 0.5,
      });

      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      const headers = init.headers as Record<string, string>;
      expect(headers["Authorization"]).toBe("Bearer my-gemini-api-key");
    });

    it("sends system and user messages in OpenAI format", async () => {
      const responseData = {
        choices: [{ message: { content: "Hello" } }],
        usage: { prompt_tokens: 5, completion_tokens: 3 },
        model: "gemini-2.5-flash",
      };
      mockFetch.mockResolvedValueOnce(makeOkResponse(responseData));

      const provider = createGoogleProvider("gemini-test-key");
      await provider.complete({
        system: "You are a debate expert",
        userMessage: "Argue for solar energy",
        maxTokens: 1000,
        temperature: 0.8,
      });

      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string) as {
        messages: Array<{ role: string; content: string }>;
        max_tokens: number;
        temperature: number;
        stream: boolean;
      };

      expect(body.messages).toEqual([
        { role: "system", content: "You are a debate expert" },
        { role: "user", content: "Argue for solar energy" },
      ]);
      expect(body.max_tokens).toBe(1000);
      expect(body.temperature).toBe(0.8);
      expect(body.stream).toBe(false);
    });
  });

  describe("non-streaming completion", () => {
    it("parses response in OpenAI format", async () => {
      const responseData = {
        choices: [{ message: { content: "Gemini says hello." } }],
        usage: { prompt_tokens: 12, completion_tokens: 7 },
        model: "gemini-2.5-flash",
      };
      mockFetch.mockResolvedValueOnce(makeOkResponse(responseData));

      const provider = createGoogleProvider("gemini-test-key");
      const result = await provider.complete({
        system: "sys",
        userMessage: "msg",
        maxTokens: 500,
        temperature: 0.5,
      });

      expect(result.content).toBe("Gemini says hello.");
      expect(result.promptTokens).toBe(12);
      expect(result.completionTokens).toBe(7);
      expect(result.model).toBe("gemini-2.5-flash");
    });
  });

  describe("streaming completion", () => {
    it("handles streaming in OpenAI SSE format with onChunk callback", async () => {
      const sseData = [
        `data: ${JSON.stringify({ choices: [{ delta: { content: "Hello" } }], model: "gemini-2.5-flash" })}\n\n`,
        `data: ${JSON.stringify({ choices: [{ delta: { content: " world" } }], usage: { prompt_tokens: 10, completion_tokens: 2 } })}\n\n`,
        `data: [DONE]\n\n`,
      ];

      mockFetch.mockResolvedValueOnce(makeStreamResponse(createMockStream(sseData)));

      const chunks: string[] = [];
      const provider = createGoogleProvider("gemini-test-key");

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
      expect(result.completionTokens).toBe(2);
      expect(result.model).toBe("gemini-2.5-flash");
    });

    it("sets stream: true in streaming requests", async () => {
      const sseData = [`data: [DONE]\n\n`];
      mockFetch.mockResolvedValueOnce(makeStreamResponse(createMockStream(sseData)));

      const provider = createGoogleProvider("gemini-test-key");
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

      const provider = createGoogleProvider("gemini-test-key");
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
      mockFetch.mockResolvedValueOnce(makeErrorResponse(429, "Quota exceeded"));

      const provider = createGoogleProvider("gemini-test-key");
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

      const provider = createGoogleProvider("gemini-test-key");
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

    it("marks 403 errors as not retryable", async () => {
      mockFetch.mockResolvedValueOnce(makeErrorResponse(403, "Forbidden"));

      const provider = createGoogleProvider("gemini-bad-key");
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

    it("sets provider name to google in error", async () => {
      mockFetch.mockResolvedValueOnce(makeErrorResponse(401, "Unauthorized"));

      const provider = createGoogleProvider("gemini-bad-key");
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
      expect(error.provider).toBe("google");
    });
  });
});
