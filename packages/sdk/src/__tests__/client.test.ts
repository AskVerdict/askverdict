import { describe, it, expect, vi, beforeEach } from "vitest";
import { AskVerdictClient } from "../client.js";
import { AskVerdictError } from "../types.js";

// ── Fetch mock setup ───────────────────────────────────────────────────────────

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockReset();
});

function mockResponse(body: unknown, status = 200): void {
  mockFetch.mockResolvedValueOnce(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

function mockNetworkError(message = "Failed to fetch"): void {
  mockFetch.mockRejectedValueOnce(new Error(message));
}

// ── Constructor ────────────────────────────────────────────────────────────────

describe("AskVerdictClient — constructor", () => {
  it("uses default base URL when none provided", async () => {
    const client = new AskVerdictClient();
    mockResponse({ status: "ok", service: "askverdict", timestamp: "", version: "1.0.0" });
    await client.health();
    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.askverdict.ai/v1/health");
  });

  it("uses provided baseUrl and strips trailing slash", async () => {
    const client = new AskVerdictClient({ baseUrl: "https://api.example.com/" });
    mockResponse({ status: "ok", service: "askverdict", timestamp: "", version: "1.0.0" });
    await client.health();
    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.example.com/v1/health");
  });

  it("sets X-Api-Key header when apiKey is provided", async () => {
    const client = new AskVerdictClient({ apiKey: "my-api-key" });
    mockResponse({ status: "ok", service: "askverdict", timestamp: "", version: "1.0.0" });
    await client.health();
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)["X-Api-Key"]).toBe("my-api-key");
  });

  it("sets Authorization Bearer header when authToken is provided", async () => {
    const client = new AskVerdictClient({ authToken: "tok_abc123" });
    mockResponse({ status: "ok", service: "askverdict", timestamp: "", version: "1.0.0" });
    await client.health();
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)["Authorization"]).toBe("Bearer tok_abc123");
  });

  it("sets no auth headers when neither apiKey nor authToken provided", async () => {
    const client = new AskVerdictClient();
    mockResponse({ status: "ok", service: "askverdict", timestamp: "", version: "1.0.0" });
    await client.health();
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["X-Api-Key"]).toBeUndefined();
    expect(headers["Authorization"]).toBeUndefined();
  });
});

// ── health() ──────────────────────────────────────────────────────────────────

describe("AskVerdictClient.health()", () => {
  it("returns a health response on 200", async () => {
    const client = new AskVerdictClient();
    const body = {
      status: "ok",
      service: "askverdict-api",
      timestamp: "2026-02-18T00:00:00Z",
      version: "1.2.3",
    };
    mockResponse(body);
    const result = await client.health();
    expect(result).toEqual(body);
  });

  it("sends GET to /health", async () => {
    const client = new AskVerdictClient();
    mockResponse({ status: "ok", service: "s", timestamp: "", version: "1" });
    await client.health();
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("GET");
  });

  it("throws AskVerdictError on non-200 response", async () => {
    const client = new AskVerdictClient();
    mockResponse(
      { error: { code: "INTERNAL_ERROR", message: "Something broke" } },
      500,
    );
    await expect(client.health()).rejects.toThrow(AskVerdictError);
  });

  it("carries status code on AskVerdictError for non-200 responses", async () => {
    const client = new AskVerdictClient();
    mockResponse(
      { error: { code: "INTERNAL_ERROR", message: "Something broke" } },
      500,
    );
    let caught: AskVerdictError | undefined;
    try {
      await client.health();
    } catch (e) {
      if (e instanceof AskVerdictError) caught = e;
    }
    expect(caught?.status).toBe(500);
  });
});

// ── createDebate() ────────────────────────────────────────────────────────────

describe("AskVerdictClient.createDebate()", () => {
  it("sends POST to /v1/verdicts with correct body", async () => {
    const client = new AskVerdictClient({ authToken: "tok" });
    const returnBody = { id: "d1", status: "pending", streamUrl: "/v1/verdicts/d1/stream" };
    mockResponse(returnBody, 201);

    await client.createDebate({ question: "Is TypeScript worth it?" });

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/v1/verdicts");
    expect(init.method).toBe("POST");
    const sentBody = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(sentBody["question"]).toBe("Is TypeScript worth it?");
  });

  it("sends all optional params in the body", async () => {
    const client = new AskVerdictClient({ authToken: "tok" });
    mockResponse({ id: "d2", status: "pending", streamUrl: "/v1/verdicts/d2/stream" }, 201);

    await client.createDebate({
      question: "Tabs or spaces?",
      mode: "thorough",
      agentCount: 4,
      maxRounds: 3,
      enableSearch: true,
      context: "Engineering context",
    });

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const sentBody = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(sentBody["mode"]).toBe("thorough");
    expect(sentBody["agentCount"]).toBe(4);
    expect(sentBody["maxRounds"]).toBe(3);
    expect(sentBody["enableSearch"]).toBe(true);
    expect(sentBody["context"]).toBe("Engineering context");
  });

  it("returns CreateDebateResult with id, debateId alias, and streamUrl", async () => {
    const client = new AskVerdictClient({ authToken: "tok" });
    const returnBody = { id: "d3", status: "pending", streamUrl: "/v1/verdicts/d3/stream" };
    mockResponse(returnBody, 201);

    const result = await client.createDebate({ question: "Test?" });
    expect(result.id).toBe("d3");
    expect(result.debateId).toBe("d3");
    expect(result.streamUrl).toBe("/v1/verdicts/d3/stream");
  });

  it("throws AskVerdictError on 422 validation error", async () => {
    const client = new AskVerdictClient({ authToken: "tok" });
    mockResponse(
      { error: { code: "VALIDATION_ERROR", message: "question is required" } },
      422,
    );
    await expect(
      client.createDebate({ question: "" }),
    ).rejects.toThrow(AskVerdictError);
  });
});

// ── getDebate() ───────────────────────────────────────────────────────────────

describe("AskVerdictClient.getDebate()", () => {
  it("sends GET to the correct verdict path", async () => {
    const client = new AskVerdictClient({ authToken: "tok" });
    mockResponse({ verdict: { id: "abc-123", question: "?", status: "completed" } });

    await client.getDebate("abc-123");

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/v1/verdicts/abc-123");
    expect(init.method).toBe("GET");
  });

  it("URL-encodes the debate ID", async () => {
    const client = new AskVerdictClient({ authToken: "tok" });
    mockResponse({ verdict: { id: "id with spaces", question: "?", status: "pending" } });

    await client.getDebate("id with spaces");

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("id%20with%20spaces");
  });

  it("throws AskVerdictError with status 404 when debate not found", async () => {
    const client = new AskVerdictClient({ authToken: "tok" });
    mockResponse({ error: { code: "NOT_FOUND", message: "Debate not found" } }, 404);

    let caught: AskVerdictError | undefined;
    try {
      await client.getDebate("nonexistent");
    } catch (e) {
      if (e instanceof AskVerdictError) caught = e;
    }
    expect(caught).toBeInstanceOf(AskVerdictError);
    expect(caught?.status).toBe(404);
    expect(caught?.code).toBe("NOT_FOUND");
  });
});

// ── listDebates() ─────────────────────────────────────────────────────────────

describe("AskVerdictClient.listDebates()", () => {
  it("sends GET to /v1/verdicts with no query string when called with no params", async () => {
    const client = new AskVerdictClient({ authToken: "tok" });
    mockResponse({ verdicts: [], total: 0, page: 1, pageSize: 20, hasMore: false });

    await client.listDebates();

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.askverdict.ai/v1/verdicts");
  });

  it("sends limit in query string", async () => {
    const client = new AskVerdictClient({ authToken: "tok" });
    mockResponse({ verdicts: [], total: 0, page: 1, pageSize: 10, hasMore: false });

    await client.listDebates({ limit: 10 });

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("limit=10");
  });

  it("sends status filter in query string", async () => {
    const client = new AskVerdictClient({ authToken: "tok" });
    mockResponse({ verdicts: [], total: 0, page: 1, pageSize: 20, hasMore: false });

    await client.listDebates({ status: "completed" });

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("status=completed");
  });

  it("normalizes verdicts key to debates in response", async () => {
    const client = new AskVerdictClient({ authToken: "tok" });
    const returnBody = {
      verdicts: [{ id: "d1", question: "Q?", status: "completed" }],
      total: 1,
      page: 1,
      pageSize: 20,
      hasMore: false,
    };
    mockResponse(returnBody);

    const result = await client.listDebates();
    expect(result.total).toBe(1);
    expect(result.debates).toHaveLength(1);
  });
});

// ── deleteDebate() ────────────────────────────────────────────────────────────

describe("AskVerdictClient.deleteDebate()", () => {
  it("sends DELETE to the correct verdict path", async () => {
    const client = new AskVerdictClient({ authToken: "tok" });
    mockResponse({ deleted: true });

    await client.deleteDebate("debate-99");

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/v1/verdicts/debate-99");
    expect(init.method).toBe("DELETE");
  });

  it("resolves without a return value on success", async () => {
    const client = new AskVerdictClient({ authToken: "tok" });
    mockResponse({ deleted: true });

    const result = await client.deleteDebate("d1");
    expect(result).toBeUndefined();
  });
});

// ── castVote() ────────────────────────────────────────────────────────────────

describe("AskVerdictClient.castVote()", () => {
  it("sends POST to the votes endpoint with claimId and vote", async () => {
    const client = new AskVerdictClient({ authToken: "tok" });
    mockResponse({ success: true });

    await client.castVote("debate-1", "claim-A", "agree");

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/debates/debate-1/votes");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body["claimId"]).toBe("claim-A");
    expect(body["vote"]).toBe("agree");
  });

  it("sends neutral vote to remove existing vote", async () => {
    const client = new AskVerdictClient({ authToken: "tok" });
    mockResponse({ success: true });

    await client.castVote("debate-1", "claim-B", "neutral");

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body["vote"]).toBe("neutral");
  });

  it("sends disagree vote correctly", async () => {
    const client = new AskVerdictClient({ authToken: "tok" });
    mockResponse({ success: true });

    await client.castVote("debate-2", "claim-C", "disagree");

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body["vote"]).toBe("disagree");
  });
});

// ── removeVote() ──────────────────────────────────────────────────────────────

describe("AskVerdictClient.removeVote()", () => {
  it("sends DELETE to the correct votes path", async () => {
    const client = new AskVerdictClient({ authToken: "tok" });
    mockResponse({ success: true });

    await client.removeVote("debate-1", "claim-A");

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/debates/debate-1/votes/claim-A");
    expect(init.method).toBe("DELETE");
  });

  it("URL-encodes both debateId and claimId", async () => {
    const client = new AskVerdictClient({ authToken: "tok" });
    mockResponse({ success: true });

    await client.removeVote("debate/1", "claim/A");

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("debate%2F1");
    expect(url).toContain("claim%2FA");
  });
});

// ── getVotes() ────────────────────────────────────────────────────────────────

describe("AskVerdictClient.getVotes()", () => {
  it("sends GET to the votes endpoint and returns the votes map", async () => {
    const client = new AskVerdictClient({ authToken: "tok" });
    const votesPayload = {
      votes: {
        "claim-1": { agree: 5, disagree: 2, userVote: "agree" },
        "claim-2": { agree: 0, disagree: 3 },
      },
    };
    mockResponse(votesPayload);

    const result = await client.getVotes("debate-1");

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/debates/debate-1/votes");
    expect(init.method).toBe("GET");
    expect(result["claim-1"]?.agree).toBe(5);
    expect(result["claim-2"]?.disagree).toBe(3);
  });

  it("unwraps the votes property from the API response", async () => {
    const client = new AskVerdictClient({ authToken: "tok" });
    mockResponse({ votes: { "c1": { agree: 1, disagree: 0 } } });

    const result = await client.getVotes("debate-1");
    expect(result).not.toHaveProperty("votes");
    expect(result).toHaveProperty("c1");
  });
});

// ── getPolls() ────────────────────────────────────────────────────────────────

describe("AskVerdictClient.getPolls()", () => {
  it("sends GET to the polls endpoint and returns polls array", async () => {
    const client = new AskVerdictClient({ authToken: "tok" });
    const poll = {
      id: "poll-1",
      debateId: "debate-1",
      question: "Do you agree?",
      options: [{ id: "opt-1", label: "Yes" }, { id: "opt-2", label: "No" }],
      status: "open",
      createdAt: "2026-01-01T00:00:00Z",
      closedAt: null,
      tallies: {},
      totalVotes: 0,
      userVote: null,
    };
    mockResponse({ polls: [poll] });

    const result = await client.getPolls("debate-1");

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/debates/debate-1/polls");
    expect(init.method).toBe("GET");
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("poll-1");
  });
});

// ── createPoll() ──────────────────────────────────────────────────────────────

describe("AskVerdictClient.createPoll()", () => {
  it("sends POST with question and options, returns Poll", async () => {
    const client = new AskVerdictClient({ authToken: "tok" });
    const createdPoll = {
      id: "poll-new",
      debateId: "debate-1",
      question: "Which is better?",
      options: [{ id: "o1", label: "A" }, { id: "o2", label: "B" }],
      status: "open",
      createdAt: "2026-02-18T00:00:00Z",
      closedAt: null,
      tallies: {},
      totalVotes: 0,
      userVote: null,
    };
    mockResponse({ poll: createdPoll });

    const result = await client.createPoll("debate-1", "Which is better?", ["A", "B"]);

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/debates/debate-1/polls");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body["question"]).toBe("Which is better?");
    expect(body["options"]).toEqual(["A", "B"]);
    expect(result.id).toBe("poll-new");
  });
});

// ── votePoll() ────────────────────────────────────────────────────────────────

describe("AskVerdictClient.votePoll()", () => {
  it("sends POST to the correct vote URL with optionId in body", async () => {
    const client = new AskVerdictClient({ authToken: "tok" });
    mockResponse({ success: true });

    await client.votePoll("debate-1", "poll-1", "opt-1");

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/debates/debate-1/polls/poll-1/vote");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body["optionId"]).toBe("opt-1");
  });
});

// ── Error handling ────────────────────────────────────────────────────────────

describe("AskVerdictClient — error handling", () => {
  it("throws AskVerdictError with code VALIDATION_ERROR on 400", async () => {
    const client = new AskVerdictClient({ authToken: "tok" });
    mockResponse(
      { error: { code: "VALIDATION_ERROR", message: "Invalid request body" } },
      400,
    );

    let caught: AskVerdictError | undefined;
    try {
      await client.createDebate({ question: "" });
    } catch (e) {
      if (e instanceof AskVerdictError) caught = e;
    }
    expect(caught).toBeInstanceOf(AskVerdictError);
    expect(caught?.code).toBe("VALIDATION_ERROR");
    expect(caught?.status).toBe(400);
  });

  it("throws AskVerdictError with code UNAUTHORIZED on 401", async () => {
    const client = new AskVerdictClient();
    mockResponse(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      401,
    );

    let caught: AskVerdictError | undefined;
    try {
      await client.listDebates();
    } catch (e) {
      if (e instanceof AskVerdictError) caught = e;
    }
    expect(caught?.code).toBe("UNAUTHORIZED");
    expect(caught?.status).toBe(401);
  });

  it("throws AskVerdictError with code HTTP_ERROR on 500 with non-JSON body", async () => {
    const client = new AskVerdictClient();
    mockFetch.mockResolvedValueOnce(
      new Response("Internal Server Error", {
        status: 500,
        headers: { "Content-Type": "text/plain" },
      }),
    );

    let caught: AskVerdictError | undefined;
    try {
      await client.health();
    } catch (e) {
      if (e instanceof AskVerdictError) caught = e;
    }
    expect(caught).toBeInstanceOf(AskVerdictError);
    expect(caught?.code).toBe("HTTP_ERROR");
    expect(caught?.status).toBe(500);
  });

  it("throws AskVerdictError with code NETWORK_ERROR on fetch rejection", async () => {
    const client = new AskVerdictClient();
    mockNetworkError("ECONNREFUSED");

    let caught: AskVerdictError | undefined;
    try {
      await client.health();
    } catch (e) {
      if (e instanceof AskVerdictError) caught = e;
    }
    expect(caught).toBeInstanceOf(AskVerdictError);
    expect(caught?.code).toBe("NETWORK_ERROR");
    expect(caught?.message).toContain("ECONNREFUSED");
  });

  it("throws AskVerdictError with details field when API provides them", async () => {
    const client = new AskVerdictClient({ authToken: "tok" });
    mockResponse(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid fields",
          details: { field: "question", reason: "too_short" },
        },
      },
      422,
    );

    let caught: AskVerdictError | undefined;
    try {
      await client.createDebate({ question: "?" });
    } catch (e) {
      if (e instanceof AskVerdictError) caught = e;
    }
    expect(caught?.details).toEqual({ field: "question", reason: "too_short" });
  });

  it("falls back to API_ERROR code when error body has no code field", async () => {
    const client = new AskVerdictClient();
    mockResponse({ error: { message: "Something went wrong" } }, 500);

    let caught: AskVerdictError | undefined;
    try {
      await client.health();
    } catch (e) {
      if (e instanceof AskVerdictError) caught = e;
    }
    expect(caught?.code).toBe("API_ERROR");
  });
});
