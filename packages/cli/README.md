# @askverdict/cli

Run AI debates from your terminal. Get verdicts on any question with a single command.

## Quick Start

```bash
# No install needed
npx askverdict "Should I use PostgreSQL or MongoDB for my SaaS?"

# Or install globally
npm install -g @askverdict/cli
askverdict "Your question here"
```

## Setup

```bash
# Set your API key
export ASKVERDICT_TOKEN=your-api-key

# Or save it to config
askverdict config set-token your-api-key
```

Get your API key at [askverdict.ai/settings/api](https://askverdict.ai/settings/api).

## Commands

### Core

```bash
# Start a debate
askverdict debate "React vs Vue?" --mode balanced
askverdict debate "Best CI/CD for startups?" --mode thorough --agents 4

# List your debates
askverdict list
askverdict list --status completed --limit 10

# View a debate
askverdict view abc123

# Stream live events
askverdict stream abc123

# Delete a debate
askverdict delete abc123 --force
```

### Search and Export

```bash
# Search debates
askverdict search "database" --sort relevance

# Export to markdown or JSON
askverdict export abc123 --format md --output verdict.md
askverdict export abc123 --format json
```

### Voting and Polls

```bash
# Vote on a claim
askverdict vote abc123 claim-id agree

# Manage polls
askverdict polls list abc123
askverdict polls create abc123 --question "Best approach?" --options "Option A,Option B,Option C"
askverdict polls vote abc123 poll-id option-id
```

### Outcomes and Stats

```bash
# Track decision outcomes
askverdict outcomes pending
askverdict outcomes submit abc123
askverdict outcomes history

# View stats
askverdict stats
```

### Account and Config

```bash
# Check who you are
askverdict whoami

# Check API health
askverdict health

# Manage config
askverdict config show
askverdict config set-url http://localhost:9100
askverdict config set-token your-token
```

## Debate Modes

| Mode | Agents | Rounds | Credits | Best For |
|------|--------|--------|---------|----------|
| `fast` | 2 | 1 | 1 | Quick opinions |
| `balanced` | 3 | 2 | 2 | Most questions (default) |
| `thorough` | 4 | 3 | 4 | Important decisions |
| `analytical` | 5 | 4 | 8 | Deep research |

## Configuration

Config is stored at `~/.askverdict/config.json`.

Priority chain (highest to lowest):
1. Command flags (`--token`, `--api-url`)
2. Environment variables (`ASKVERDICT_TOKEN`, `ASKVERDICT_API_URL`)
3. Config file (`~/.askverdict/config.json`)

## JSON Output

All commands support `--json` for machine-readable output:

```bash
askverdict debate "question" --json | jq '.verdict.recommendation'
```

## License

MIT
