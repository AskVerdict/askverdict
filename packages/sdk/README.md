# @askverdict/sdk

TypeScript SDK for the [AskVerdict AI](https://askverdict.ai) debate engine API.

## Install

```bash
pnpm add @askverdict/sdk
# or
npm install @askverdict/sdk
```

## Quick Start

```typescript
import { AskVerdictClient } from '@askverdict/sdk';

const client = new AskVerdictClient({ apiKey: process.env.ASKVERDICT_API_KEY });

// Create a verdict
const { verdict } = await client.createVerdict({
  question: 'Should I use PostgreSQL or MongoDB for my SaaS?',
  mode: 'balanced',
});

console.log(verdict.verdict.recommendation);
```

## Streaming

```typescript
const { verdict } = await client.createVerdict({
  question: 'React vs Vue for a new project?',
  mode: 'thorough',
});

for await (const event of client.streamVerdict(verdict.id)) {
  switch (event.type) {
    case 'agent_thinking':
      console.log(`${event.agentName} is thinking...`);
      break;
    case 'agent_argument':
      console.log(`${event.agentName}: ${event.content}`);
      break;
    case 'verdict_complete':
      console.log('Verdict:', event.verdict.recommendation);
      break;
  }
}
```

## Authentication

Three ways to authenticate:

```typescript
// 1. API key (server-side)
const client = new AskVerdictClient({ apiKey: 'ask_...' });

// 2. Auth token (browser, from Better Auth session)
const client = new AskVerdictClient({ authToken: 'session-token' });

// 3. Custom base URL (self-hosted or dev)
const client = new AskVerdictClient({
  apiKey: 'ask_...',
  baseUrl: 'http://localhost:9100',
});
```

## API Reference

### Verdicts

| Method | Description |
|--------|-------------|
| `createVerdict(params)` | Start a new AI debate |
| `getVerdict(id)` | Get a debate by ID |
| `listVerdicts(params?)` | List your debates (paginated) |
| `deleteVerdict(id)` | Delete a debate |
| `streamVerdict(id)` | Stream live debate events (SSE) |

### Voting

| Method | Description |
|--------|-------------|
| `getVotes(debateId)` | Get vote tallies for all claims |
| `castVote(debateId, claimId, vote)` | Vote on a claim (agree/disagree/neutral) |
| `removeVote(debateId, claimId)` | Remove your vote |

### Polls

| Method | Description |
|--------|-------------|
| `getPolls(debateId)` | Get polls for a debate |
| `createPoll(debateId, question, options)` | Create a poll |
| `votePoll(debateId, pollId, optionId)` | Vote on a poll |
| `closePoll(debateId, pollId)` | Close a poll |
| `deletePoll(debateId, pollId)` | Delete a poll |

### Billing

| Method | Description |
|--------|-------------|
| `getBalance()` | Get credit balance and plan info |
| `createSubscriptionCheckout(plan, interval)` | Create Stripe checkout |
| `createCreditCheckout(pack)` | Buy credit pack |
| `createPortalSession()` | Open Stripe portal |

### Search and Stats

| Method | Description |
|--------|-------------|
| `search(query, opts?)` | Search debates |
| `getDashboard(workspaceId?)` | Get dashboard statistics |
| `getScore()` | Get decision accuracy score |
| `getStreak()` | Get debate streak info |

### Outcomes

| Method | Description |
|--------|-------------|
| `getOutcome(debateId)` | Get recorded outcome |
| `submitOutcome(debateId, params)` | Record a decision outcome |
| `getPendingOutcomes()` | List debates awaiting outcomes |
| `getOutcomeHistory(opts?)` | Get outcome history |

### Health

| Method | Description |
|--------|-------------|
| `health()` | Check API health (no auth required) |

## Error Handling

```typescript
import { AskVerdictClient, AskVerdictError } from '@askverdict/sdk';

try {
  const result = await client.createVerdict({ question: '...' });
} catch (error) {
  if (error instanceof AskVerdictError) {
    console.error(`[${error.status}] ${error.code}: ${error.message}`);
  }
}
```

## License

MIT
