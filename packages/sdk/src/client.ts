// @askverdict/sdk — AskVerdictClient
// HTTP client for the AskVerdict REST API.
//
// Required peer: none (uses native fetch — available in Node 18+, Bun, browsers)

import {
  AskVerdictError,
  type AskVerdictClientConfig,
  type CreateDebateParams,
  type CreateDebateResult,
  type DebateResponse,
  type ListDebatesParams,
  type ListDebatesResult,
  type VoteMap,
  type VoteValue,
  type Poll,
  type HealthResponse,
  type StreamEvent,
  type UserProfile,
  type UsageInfo,
  type BalanceInfo,
  type CheckoutUrlResult,
  type PortalUrlResult,
  type DashboardStats,
  type SearchParams,
  type SearchResult,
  type OutcomeRecord,
  type SubmitOutcomeParams,
  type DecisionScore,
  type StreakInfo,
  type ApiKeyUsage,
} from "./types.js";

const DEFAULT_BASE_URL = "https://api.askverdict.ai";

export class AskVerdictClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor(config: AskVerdictClientConfig = {}) {
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (config.apiKey) {
      this.headers["X-Api-Key"] = config.apiKey;
    }

    if (config.authToken) {
      this.headers["Authorization"] = `Bearer ${config.authToken}`;
    }
  }

  // ── Verdicts (Public API v1) ──────────────────────────────────────────────

  /**
   * Create a new verdict (debate). Returns the verdict ID and SSE stream URL.
   * The verdict runs asynchronously — use `streamVerdict` to follow progress.
   */
  async createVerdict(params: CreateDebateParams): Promise<CreateDebateResult> {
    const raw = await this.request<CreateDebateResult>("POST", "/v1/verdicts", params);
    // Provide backward-compatible debateId alias
    return { ...raw, debateId: raw.id };
  }

  /**
   * Get a single verdict by ID (includes verdict data when completed).
   */
  async getVerdict(id: string): Promise<{ verdict: DebateResponse }> {
    return this.request<{ verdict: DebateResponse }>("GET", `/v1/verdicts/${encodeURIComponent(id)}`);
  }

  /**
   * List verdicts for the authenticated user.
   */
  async listVerdicts(params: ListDebatesParams = {}): Promise<ListDebatesResult> {
    const qs = buildQueryString({
      page: params.page,
      limit: params.pageSize ?? params.limit,
      status: params.status,
    });
    const raw = await this.request<Record<string, unknown>>("GET", `/v1/verdicts${qs}`);
    // v1 returns { verdicts: [...] }, normalize to { debates: [...] }
    const items = (raw["verdicts"] ?? raw["debates"] ?? []) as DebateResponse[];
    return {
      debates: items,
      total: raw["total"] as number,
      page: raw["page"] as number,
      pageSize: raw["pageSize"] as number,
      hasMore: raw["hasMore"] as boolean,
    };
  }

  /**
   * Delete a verdict by ID.
   */
  async deleteVerdict(id: string): Promise<void> {
    await this.request<{ deleted: boolean }>(
      "DELETE",
      `/v1/verdicts/${encodeURIComponent(id)}`,
    );
  }

  // ── Aliases (backward compatibility) ──────────────────────────────────────

  /** @deprecated Use `createVerdict` */
  async createDebate(params: CreateDebateParams): Promise<CreateDebateResult> {
    return this.createVerdict(params);
  }

  /** @deprecated Use `getVerdict` */
  async getDebate(id: string): Promise<DebateResponse> {
    const res = await this.getVerdict(id);
    return res.verdict;
  }

  /** @deprecated Use `listVerdicts` */
  async listDebates(params: ListDebatesParams = {}): Promise<ListDebatesResult> {
    return this.listVerdicts(params);
  }

  /** @deprecated Use `deleteVerdict` */
  async deleteDebate(id: string): Promise<void> {
    return this.deleteVerdict(id);
  }

  // ── Streaming ──────────────────────────────────────────────────────────────

  /**
   * Stream SSE events for a running or completed verdict.
   *
   * Usage:
   * ```ts
   * for await (const event of client.streamVerdict(id)) {
   *   console.log(event.type, event.data);
   *   if (event.type === "stream:end") break;
   * }
   * ```
   */
  async *streamVerdict(id: string): AsyncGenerator<StreamEvent> {
    const url = `${this.baseUrl}/v1/verdicts/${encodeURIComponent(id)}/stream`;

    // Build headers without Content-Type for SSE
    const streamHeaders: Record<string, string> = { ...this.headers };
    streamHeaders["Accept"] = "text/event-stream";
    delete streamHeaders["Content-Type"];

    let response: Response;
    try {
      response = await fetch(url, {
        method: "GET",
        headers: streamHeaders,
      });
    } catch (err) {
      throw new AskVerdictError({
        code: "NETWORK_ERROR",
        message: err instanceof Error ? err.message : "Network request failed",
      });
    }

    if (!response.ok) {
      await this.throwFromResponse(response);
    }

    if (!response.body) {
      throw new AskVerdictError({
        code: "STREAM_ERROR",
        message: "Response body is empty",
        status: response.status,
      });
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE messages are separated by double newlines
        const parts = buffer.split("\n\n");
        // Last part may be incomplete — keep it in the buffer
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const event = parseSseMessage(part);
          if (event !== null) {
            yield event;
          }
        }
      }

      // Flush remaining buffer
      if (buffer.trim()) {
        const event = parseSseMessage(buffer);
        if (event !== null) {
          yield event;
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /** @deprecated Use `streamVerdict` */
  async *streamDebate(id: string): AsyncGenerator<StreamEvent> {
    yield* this.streamVerdict(id);
  }

  // ── User & Usage (v1) ───────────────────────────────────────────────────

  /**
   * Get the authenticated user's basic profile via API key.
   */
  async getApiUser(): Promise<UserProfile> {
    return this.request<UserProfile>("GET", "/v1/me");
  }

  /**
   * Get API key usage stats for the current billing period.
   */
  async getApiUsage(): Promise<ApiKeyUsage> {
    return this.request<ApiKeyUsage>("GET", "/v1/usage");
  }

  // ── Votes ──────────────────────────────────────────────────────────────────

  /**
   * Get vote tallies for all claims in a debate.
   * If authenticated, each tally includes the caller's own vote.
   */
  async getVotes(debateId: string): Promise<VoteMap> {
    const res = await this.request<{ votes: VoteMap }>(
      "GET",
      `/api/debates/${encodeURIComponent(debateId)}/votes`,
    );
    return res.votes;
  }

  /**
   * Cast or update a vote on a claim.
   * Pass "neutral" to remove an existing vote.
   */
  async castVote(
    debateId: string,
    claimId: string,
    vote: VoteValue,
  ): Promise<void> {
    await this.request<unknown>(
      "POST",
      `/api/debates/${encodeURIComponent(debateId)}/votes`,
      { claimId, vote },
    );
  }

  /**
   * Remove the authenticated user's vote on a specific claim.
   */
  async removeVote(debateId: string, claimId: string): Promise<void> {
    await this.request<unknown>(
      "DELETE",
      `/api/debates/${encodeURIComponent(debateId)}/votes/${encodeURIComponent(claimId)}`,
    );
  }

  // ── Polls ──────────────────────────────────────────────────────────────────

  /**
   * Get all polls for a debate, with tallies and (if authenticated) the
   * caller's own vote per poll.
   */
  async getPolls(debateId: string): Promise<Poll[]> {
    const res = await this.request<{ polls: Poll[] }>(
      "GET",
      `/api/debates/${encodeURIComponent(debateId)}/polls`,
    );
    return res.polls;
  }

  /**
   * Create a poll on a debate (debate owner only).
   */
  async createPoll(
    debateId: string,
    question: string,
    options: string[],
  ): Promise<Poll> {
    const res = await this.request<{ poll: Poll }>(
      "POST",
      `/api/debates/${encodeURIComponent(debateId)}/polls`,
      { question, options },
    );
    return res.poll;
  }

  /**
   * Vote on a poll option.
   */
  async votePoll(
    debateId: string,
    pollId: string,
    optionId: string,
  ): Promise<void> {
    await this.request<unknown>(
      "POST",
      `/api/debates/${encodeURIComponent(debateId)}/polls/${encodeURIComponent(pollId)}/vote`,
      { optionId },
    );
  }

  /**
   * Close a poll (debate owner only).
   */
  async closePoll(debateId: string, pollId: string): Promise<void> {
    await this.request<unknown>(
      "PATCH",
      `/api/debates/${encodeURIComponent(debateId)}/polls/${encodeURIComponent(pollId)}`,
    );
  }

  /**
   * Delete a poll (debate owner only).
   */
  async deletePoll(debateId: string, pollId: string): Promise<void> {
    await this.request<unknown>(
      "DELETE",
      `/api/debates/${encodeURIComponent(debateId)}/polls/${encodeURIComponent(pollId)}`,
    );
  }

  // ── Users ──────────────────────────────────────────────────────────────────

  /**
   * Get the authenticated user's profile.
   */
  async getMe(): Promise<UserProfile> {
    const res = await this.request<{ user: UserProfile }>("GET", "/api/users/me");
    return res.user;
  }

  /**
   * Get usage stats for the authenticated user.
   */
  async getUsage(): Promise<UsageInfo> {
    return this.request<UsageInfo>("GET", "/api/users/me/usage");
  }

  // ── Billing ─────────────────────────────────────────────────────────────────

  /**
   * Get the authenticated user's credit balance and plan.
   */
  async getBalance(): Promise<BalanceInfo> {
    return this.request<BalanceInfo>("GET", "/api/billing/balance");
  }

  /**
   * Create a Stripe checkout session for a Starter or Pro subscription.
   * Returns a URL to redirect the user to Stripe's hosted checkout page.
   */
  async createSubscriptionCheckout(
    plan: "starter" | "pro",
    interval: "monthly" | "annual"
  ): Promise<CheckoutUrlResult> {
    return this.request<CheckoutUrlResult>("POST", "/api/billing/checkout-session-subscription", {
      plan,
      interval,
    });
  }

  /**
   * Create a Stripe checkout session for a BYOK subscription.
   */
  async createByokCheckout(interval: "monthly" = "monthly"): Promise<CheckoutUrlResult> {
    return this.request<CheckoutUrlResult>("POST", "/api/billing/checkout-session", {
      interval,
    });
  }

  /**
   * Create a Stripe checkout session for a BYOK Pro subscription.
   */
  async createByokProCheckout(interval: "monthly" = "monthly"): Promise<CheckoutUrlResult> {
    return this.request<CheckoutUrlResult>("POST", "/api/billing/checkout-session-pro", {
      interval,
    });
  }

  /**
   * Create a Stripe checkout session for a one-time credit pack purchase.
   */
  async createCreditCheckout(pack: "credits_50" | "credits_200" | "credits_600"): Promise<CheckoutUrlResult> {
    return this.request<CheckoutUrlResult>("POST", "/api/billing/credit-checkout", { pack });
  }

  /**
   * Create a Stripe Customer Portal session for subscription management.
   * The returned URL redirects to Stripe's hosted billing portal.
   */
  async createPortalSession(): Promise<PortalUrlResult> {
    return this.request<PortalUrlResult>("POST", "/api/billing/portal-session");
  }

  // ── Stats ───────────────────────────────────────────────────────────────────

  /**
   * Get dashboard statistics, optionally scoped to a workspace.
   */
  async getDashboard(workspaceId?: string): Promise<DashboardStats> {
    const qs = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : "";
    const res = await this.request<{ stats: DashboardStats }>("GET", `/api/stats/dashboard${qs}`);
    return res.stats;
  }

  // ── Search ──────────────────────────────────────────────────────────────────

  /**
   * Search debates or verdicts.
   */
  async search(query: string, opts: SearchParams = {}): Promise<SearchResult> {
    const qs = buildQueryString({
      q: query,
      type: opts.type,
      sort: opts.sort,
      page: opts.page,
      limit: opts.limit,
      status: opts.status,
      mode: opts.mode,
    });
    return this.request<SearchResult>("GET", `/api/search${qs}`);
  }

  // ── Outcomes ────────────────────────────────────────────────────────────────

  /**
   * Get the recorded outcome for a debate.
   */
  async getOutcome(debateId: string): Promise<OutcomeRecord> {
    const res = await this.request<{ outcome: OutcomeRecord }>(
      "GET",
      `/api/debates/${encodeURIComponent(debateId)}/outcome`,
    );
    return res.outcome;
  }

  /**
   * Submit an outcome for a completed debate.
   */
  async submitOutcome(debateId: string, params: SubmitOutcomeParams): Promise<OutcomeRecord> {
    const res = await this.request<{ outcome: OutcomeRecord }>(
      "POST",
      `/api/debates/${encodeURIComponent(debateId)}/outcome`,
      params,
    );
    return res.outcome;
  }

  /**
   * List debates with completed verdicts awaiting outcome recording.
   */
  async getPendingOutcomes(): Promise<OutcomeRecord[]> {
    const res = await this.request<{ outcomes: OutcomeRecord[] }>("GET", "/api/outcomes/pending");
    return res.outcomes;
  }

  /**
   * Get outcome history, optionally filtered by domain.
   */
  async getOutcomeHistory(
    opts: { limit?: number; offset?: number; domain?: string } = {},
  ): Promise<OutcomeRecord[]> {
    const qs = buildQueryString(opts);
    const res = await this.request<{ outcomes: OutcomeRecord[] }>("GET", `/api/outcomes/history${qs}`);
    return res.outcomes;
  }

  // ── Scores ──────────────────────────────────────────────────────────────────

  /**
   * Get the authenticated user's decision accuracy score.
   */
  async getScore(): Promise<DecisionScore> {
    const res = await this.request<{ score: DecisionScore }>("GET", "/api/scores/me");
    return res.score;
  }

  // ── Streaks ─────────────────────────────────────────────────────────────────

  /**
   * Get the authenticated user's debate streak information.
   */
  async getStreak(): Promise<StreakInfo> {
    return this.request<StreakInfo>("GET", "/api/streaks");
  }

  // ── Health ─────────────────────────────────────────────────────────────────

  /**
   * Check API health. No authentication required.
   */
  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>("GET", "/v1/health");
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const init: RequestInit = {
      method,
      headers: this.headers,
    };

    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }

    let response: Response;
    try {
      response = await fetch(url, init);
    } catch (err) {
      throw new AskVerdictError({
        code: "NETWORK_ERROR",
        message: err instanceof Error ? err.message : "Network request failed",
      });
    }

    if (!response.ok) {
      await this.throwFromResponse(response);
    }

    // 204 No Content
    if (response.status === 204) {
      return undefined as unknown as T;
    }

    let json: unknown;
    try {
      json = await response.json();
    } catch {
      throw new AskVerdictError({
        code: "PARSE_ERROR",
        message: "Failed to parse API response as JSON",
        status: response.status,
      });
    }

    return json as T;
  }

  private async throwFromResponse(response: Response): Promise<never> {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new AskVerdictError({
        code: "HTTP_ERROR",
        message: `HTTP ${response.status} ${response.statusText}`,
        status: response.status,
      });
    }

    // Standard AskVerdict API error shape: { error: { code, message, details? } }
    if (
      body !== null &&
      typeof body === "object" &&
      "error" in body &&
      body.error !== null &&
      typeof body.error === "object"
    ) {
      const err = body.error as Record<string, unknown>;
      throw new AskVerdictError({
        code: typeof err["code"] === "string" ? err["code"] : "API_ERROR",
        message:
          typeof err["message"] === "string"
            ? err["message"]
            : `HTTP ${response.status}`,
        status: response.status,
        details:
          err["details"] !== undefined &&
          typeof err["details"] === "object" &&
          err["details"] !== null
            ? (err["details"] as Record<string, unknown>)
            : undefined,
      });
    }

    throw new AskVerdictError({
      code: "HTTP_ERROR",
      message: `HTTP ${response.status} ${response.statusText}`,
      status: response.status,
    });
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function buildQueryString(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null,
  );
  if (entries.length === 0) return "";
  const qs = entries
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return `?${qs}`;
}

/**
 * Parse a single SSE message block into a StreamEvent.
 * Returns null if the message is a comment or has no data.
 */
function parseSseMessage(raw: string): StreamEvent | null {
  const lines = raw.split("\n");
  let id = "";
  let eventType = "message";
  let dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith(":")) {
      // SSE comment — skip
      continue;
    }

    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;

    const field = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trimStart();

    switch (field) {
      case "id":
        id = value;
        break;
      case "event":
        eventType = value;
        break;
      case "data":
        dataLines.push(value);
        break;
    }
  }

  if (dataLines.length === 0) return null;

  const rawData = dataLines.join("\n");

  let parsedData: unknown = rawData;
  try {
    parsedData = JSON.parse(rawData);
  } catch {
    // Keep as string if not valid JSON
  }

  return {
    id,
    type: eventType,
    data: parsedData,
    timestamp: Date.now(),
  };
}
