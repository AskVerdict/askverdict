<div align="center">

# AskVerdict AI

**Multi-agent AI debate engine. Get AI-powered verdicts on any question.**

[![npm](https://img.shields.io/npm/v/@askverdict/sdk?label=sdk)](https://www.npmjs.com/package/@askverdict/sdk)
[![npm](https://img.shields.io/npm/v/@askverdict/cli?label=cli)](https://www.npmjs.com/package/@askverdict/cli)
[![npm](https://img.shields.io/npm/v/askverdict?label=verdict)](https://www.npmjs.com/package/askverdict)
[![npm](https://img.shields.io/npm/v/@askverdict/types?label=types)](https://www.npmjs.com/package/@askverdict/types)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[Website](https://askverdict.ai) | [Documentation](https://askverdict.ai/docs) | [Get API Key](https://askverdict.ai/settings/api)

</div>

## What is AskVerdict AI?

AskVerdict AI is a multi-agent debate engine that pits multiple AI personas against each other to analyze questions from different perspectives. Instead of getting a single biased answer, you get a structured debate with evidence, cross-examination, and a synthesized verdict.

## Quick Start

### verdict (BYOK, zero signup)

```bash
npx askverdict "Should I use PostgreSQL or MongoDB for my SaaS?"
```

Uses your own API keys (OpenAI, Anthropic, or Gemini). See [`packages/verdict`](./packages/verdict) for details.

### CLI (with AskVerdict account)

```bash
npx askverdict "Should I use PostgreSQL or MongoDB for my SaaS?"
```

### SDK

```bash
pnpm add @askverdict/sdk
```

```typescript
import { AskVerdictClient } from '@askverdict/sdk';

const client = new AskVerdictClient({ apiKey: 'your-api-key' });

const { verdict } = await client.createVerdict({
  question: 'Should I use PostgreSQL or MongoDB for my SaaS?',
  mode: 'balanced',
});

console.log(verdict.verdict.recommendation);
```

## Packages

| Package | Description | Version |
|---------|-------------|---------|
| [`verdict`](./packages/verdict) | BYOK debate CLI (zero signup) | [![npm](https://img.shields.io/npm/v/verdict)](https://www.npmjs.com/package/verdict) |
| [`@askverdict/sdk`](./packages/sdk) | TypeScript API client | [![npm](https://img.shields.io/npm/v/@askverdict/sdk)](https://www.npmjs.com/package/@askverdict/sdk) |
| [`@askverdict/cli`](./packages/cli) | Command-line interface | [![npm](https://img.shields.io/npm/v/@askverdict/cli)](https://www.npmjs.com/package/@askverdict/cli) |
| [`@askverdict/types`](./packages/types) | Shared TypeScript types | [![npm](https://img.shields.io/npm/v/@askverdict/types)](https://www.npmjs.com/package/@askverdict/types) |

## How It Works

1. **Ask a question** - Any decision, comparison, or open-ended question
2. **AI agents debate** - Multiple specialized personas argue different sides with evidence
3. **Cross-examination** - Agents challenge each other's claims
4. **Verdict** - A synthesized recommendation with confidence scores and dissenting views

## Debate Modes

| Mode | Agents | Rounds | Best For |
|------|--------|--------|----------|
| `fast` | 2 | 1 | Quick opinions, simple comparisons |
| `balanced` | 3 | 2 | Most questions (default) |
| `thorough` | 4 | 3 | Important decisions, complex topics |
| `analytical` | 5 | 4 | Deep analysis, research questions |

## Authentication

Get your API key at [askverdict.ai/settings/api](https://askverdict.ai/settings/api).

```bash
# CLI
export ASKVERDICT_TOKEN=your-api-key
```

```typescript
// SDK
const client = new AskVerdictClient({ apiKey: 'your-api-key' });
```

## Examples

See the [examples/](./examples) directory for working code samples.

## Contributing

We welcome contributions! Please see our contributing guidelines (coming soon).

## License

MIT - see [LICENSE](./LICENSE) for details.
