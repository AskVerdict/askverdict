/**
 * AskVerdict SDK - Streaming Example
 *
 * Run: npx tsx examples/streaming.ts
 * Requires: ASKVERDICT_API_KEY environment variable
 */

import { AskVerdictClient } from '@askverdict/sdk';

async function main() {
  const client = new AskVerdictClient({
    apiKey: process.env.ASKVERDICT_API_KEY,
  });

  // Start a thorough debate
  const { verdict } = await client.createVerdict({
    question: 'React vs Vue vs Svelte for a new startup project?',
    mode: 'thorough',
  });

  console.log(`Debate started: ${verdict.id}\n`);

  // Stream live events
  for await (const event of client.streamVerdict(verdict.id)) {
    switch (event.type) {
      case 'debate_start':
        console.log('Debate started with agents:', event.agents?.map((a: { name: string }) => a.name).join(', '));
        break;

      case 'agent_thinking':
        console.log(`[${event.agentName}] Thinking...`);
        break;

      case 'agent_argument':
        console.log(`[${event.agentName}] ${event.content?.slice(0, 100)}...`);
        break;

      case 'round_complete':
        console.log(`\n--- Round ${event.round} complete ---\n`);
        break;

      case 'verdict_complete':
        console.log('\nVerdict:', event.verdict?.recommendation);
        break;

      case 'debate_complete':
        console.log('\nDebate finished.');
        break;
    }
  }
}

main().catch(console.error);
