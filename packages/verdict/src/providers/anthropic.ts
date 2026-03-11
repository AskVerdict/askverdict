import type { Provider, CompletionRequest, CompletionResponse } from "./types.js";
import { ProviderError } from "./types.js";

const DEFAULT_MODEL = "claude-sonnet-4-5-20250514";
const API_VERSION = "2023-06-01";

export function createAnthropicProvider(apiKey: string, model?: string): Provider {
  const resolvedModel = model ?? DEFAULT_MODEL;

  return {
    name: "anthropic",
    model: resolvedModel,

    async complete(request: CompletionRequest): Promise<CompletionResponse> {
      const isStreaming = typeof request.onChunk === "function";

      const body = {
        model: resolvedModel,
        system: request.system,
        messages: [{ role: "user" as const, content: request.userMessage }],
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        stream: isStreaming,
      };

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": API_VERSION,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(120_000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new ProviderError({
          provider: "anthropic",
          status: response.status,
          retryable: response.status === 429 || response.status >= 500,
          message: `Anthropic error (${response.status}): ${errorText}`,
        });
      }

      if (isStreaming) {
        return streamResponse(response, request.onChunk!, resolvedModel);
      }

      const data = (await response.json()) as {
        content: Array<{ type: string; text: string }>;
        usage: { input_tokens: number; output_tokens: number };
        model: string;
      };

      const text = data.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("");

      return {
        content: text,
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        model: data.model,
      };
    },
  };
}

async function streamResponse(
  response: Response,
  onChunk: (chunk: string) => void,
  fallbackModel: string,
): Promise<CompletionResponse> {
  if (!response.body) {
    throw new ProviderError({
      provider: "anthropic",
      retryable: false,
      message: "Anthropic returned no response body for streaming",
    });
  }

  let content = "";
  let promptTokens = 0;
  let completionTokens = 0;
  let model = fallbackModel;

  const reader = response.body.getReader();
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
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(":")) continue;
        if (!trimmed.startsWith("data: ")) continue;

        try {
          const event = JSON.parse(trimmed.slice(6)) as {
            type: string;
            delta?: { type?: string; text?: string };
            message?: { model?: string; usage?: { input_tokens?: number } };
            usage?: { output_tokens?: number };
          };

          switch (event.type) {
            case "message_start":
              if (event.message?.model) model = event.message.model;
              if (event.message?.usage?.input_tokens) {
                promptTokens = event.message.usage.input_tokens;
              }
              break;

            case "content_block_delta":
              if (event.delta?.type === "text_delta" && event.delta.text) {
                content += event.delta.text;
                onChunk(event.delta.text);
              }
              break;

            case "message_delta":
              if (event.usage?.output_tokens) {
                completionTokens = event.usage.output_tokens;
              }
              break;
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (!promptTokens) promptTokens = Math.ceil(content.length / 4);
  if (!completionTokens) completionTokens = Math.ceil(content.length / 4);

  return { content, promptTokens, completionTokens, model };
}
