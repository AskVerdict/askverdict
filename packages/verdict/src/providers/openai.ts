import type { Provider, CompletionRequest, CompletionResponse } from "./types.js";
import { ProviderError } from "./types.js";

const DEFAULT_MODEL = "gpt-4o";

export function createOpenAIProvider(apiKey: string, model?: string): Provider {
  const resolvedModel = model ?? DEFAULT_MODEL;

  return {
    name: "openai",
    model: resolvedModel,

    async complete(request: CompletionRequest): Promise<CompletionResponse> {
      const isStreaming = typeof request.onChunk === "function";

      const body = {
        model: resolvedModel,
        messages: [
          { role: "system" as const, content: request.system },
          { role: "user" as const, content: request.userMessage },
        ],
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        stream: isStreaming,
        ...(isStreaming ? { stream_options: { include_usage: true } } : {}),
      };

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(120_000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new ProviderError({
          provider: "openai",
          status: response.status,
          retryable: response.status === 429 || response.status >= 500,
          message: `OpenAI error (${response.status}): ${errorText}`,
        });
      }

      if (isStreaming) {
        return streamResponse(response, request.onChunk!, resolvedModel);
      }

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
        usage: { prompt_tokens: number; completion_tokens: number };
        model: string;
      };

      return {
        content: data.choices[0]?.message.content ?? "",
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
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
      provider: "openai",
      retryable: false,
      message: "OpenAI returned no response body for streaming",
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
        if (trimmed === "data: [DONE]") continue;
        if (!trimmed.startsWith("data: ")) continue;

        try {
          const chunk = JSON.parse(trimmed.slice(6)) as {
            choices?: Array<{ delta?: { content?: string } }>;
            usage?: { prompt_tokens?: number; completion_tokens?: number };
            model?: string;
          };

          if (chunk.model) model = chunk.model;

          const delta = chunk.choices?.[0]?.delta?.content;
          if (delta) {
            content += delta;
            onChunk(delta);
          }

          if (chunk.usage) {
            if (chunk.usage.prompt_tokens) promptTokens = chunk.usage.prompt_tokens;
            if (chunk.usage.completion_tokens) completionTokens = chunk.usage.completion_tokens;
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
