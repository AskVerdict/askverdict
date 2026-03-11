# verdict

Multi-agent AI debate engine for your terminal. Three AI agents argue both sides, then deliver a verdict.

**Zero signup. BYOK. Instant decisions.**

```bash
npx verdict "Should I use PostgreSQL or MongoDB for my SaaS?"
```

```
  THE ADVOCATE (Claude claude-sonnet-4-5)                           FOR
  PostgreSQL's ACID compliance and mature ORM ecosystem make it
  the default choice for any SaaS handling financial data...

  THE CRITIC (GPT-4o)                                       AGAINST
  MongoDB's flexible schema lets you ship MVPs in days, not
  weeks. Schema migrations are the #1 velocity killer...

  +-----------------------------------------------------+
  |  VERDICT                                        78%  |
  |  PostgreSQL is the stronger choice for most SaaS     |
  |  applications, especially those handling payments    |
  |  or relational data.                                 |
  |                                                      |
  |  For:  ACID compliance, mature ORM ecosystem         |
  |  Against: MongoDB's flexible schema for MVPs         |
  |  Blind spots: Multi-region replication costs         |
  |  Next: Benchmark your actual query patterns          |
  +-----------------------------------------------------+

  3 providers | 2,847 tokens | 12.3s
```

## Quick start

You need at least one API key:

```bash
# Set one or more (env vars)
export ANTHROPIC_API_KEY=sk-ant-...
export OPENAI_API_KEY=sk-...
export GEMINI_API_KEY=AI...

# Run it
npx verdict "Should I use Kubernetes or just Docker Compose?"
```

If you have multiple keys, each debate agent uses a different provider for diverse perspectives.

## Install (optional)

```bash
npm i -g verdict
```

## Usage

```bash
# Basic debate
verdict "Microservices vs monolith for a 5-person startup?"

# Fast mode (2-3 points, ~10s)
verdict "Rust or Go for CLI tools?" --mode fast

# Thorough mode (5-7 points, ~30s)
verdict "Should we raise a Series A now?" --mode thorough

# Force specific providers
verdict "React vs Vue?" --providers anthropic,openai

# Machine-readable JSON output
verdict "Buy vs rent in Austin?" --json

# Disable streaming
verdict "Hire or outsource?" --no-stream
```

## Configuration

```bash
# See detected API keys
verdict config

# Save keys to ~/.verdict/config.json (no env vars needed)
verdict config --set anthropic=sk-ant-...
verdict config --set openai=sk-...
verdict config --set google=AI...

# Show config file path
verdict config --path
```

Environment variables always take priority over the config file.

## How it works

1. **The Advocate** argues FOR your proposition with evidence and data
2. **The Critic** argues AGAINST with risks, counterexamples, and failed implementations
3. **The Synthesizer** reads both sides, picks a winner, and delivers a verdict with confidence score

Advocate and Critic run in parallel, so debates complete in roughly the time of one LLM call.

## Modes

| Mode | Points | Tokens | Time |
|------|--------|--------|------|
| `fast` | 2-3 | ~1,500 | ~10s |
| `balanced` | 3-5 | ~3,000 | ~15s |
| `thorough` | 5-7 | ~6,000 | ~30s |

## Provider priority

If you have multiple API keys, verdict distributes agents across providers:

| Keys available | Advocate | Critic | Synthesizer |
|---------------|----------|--------|-------------|
| 3 keys | Provider 1 | Provider 2 | Provider 3 |
| 2 keys | Provider 1 | Provider 2 | Provider 1 |
| 1 key | Same | Same | Same |

## JSON output

```bash
verdict "PostgreSQL vs MySQL?" --json
```

```json
{
  "question": "PostgreSQL vs MySQL?",
  "mode": "balanced",
  "advocate": {
    "provider": "anthropic",
    "model": "claude-sonnet-4-5-20250514",
    "argument": "...",
    "tokens": 1200,
    "durationMs": 4500
  },
  "critic": {
    "provider": "openai",
    "model": "gpt-4o",
    "argument": "...",
    "tokens": 1100,
    "durationMs": 3800
  },
  "verdict": {
    "summary": "PostgreSQL is the stronger choice...",
    "confidence": 78,
    "forPoints": ["..."],
    "againstPoints": ["..."],
    "blindSpots": ["..."],
    "nextStep": "Benchmark your query patterns"
  },
  "meta": {
    "totalTokens": 3500,
    "durationMs": 8200,
    "providers": ["anthropic", "openai", "google"],
    "version": "0.1.0"
  }
}
```

## Want more?

**[AskVerdict AI](https://askverdict.ai)** is the full platform with:

- 5+ specialized personas (Engineer, Economist, Analyst, and more)
- Multi-round debates with follow-up questions
- Saved history and shareable verdict URLs
- Team collaboration and decision tracking
- Domain-aware persona selection
- No API keys needed (managed credits or BYOK)

## License

MIT
