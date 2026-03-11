/**
 * AskVerdict SDK - Quick Start Example
 *
 * Run: npx tsx examples/quick-start.ts
 * Requires: ASKVERDICT_API_KEY environment variable
 */

import { AskVerdictClient } from '@askverdict/sdk';

async function main() {
  const client = new AskVerdictClient({
    apiKey: process.env.ASKVERDICT_API_KEY,
  });

  // Check API health
  const health = await client.health();
  console.log('API Status:', health.status);

  // Create a verdict
  const { verdict } = await client.createVerdict({
    question: 'Should I use PostgreSQL or MongoDB for a new SaaS product?',
    mode: 'balanced',
  });

  console.log('Debate ID:', verdict.id);
  console.log('Status:', verdict.status);

  // Get the full verdict
  const { verdict: result } = await client.getVerdict(verdict.id);

  if (result.verdict) {
    console.log('\nRecommendation:', result.verdict.recommendation);
    console.log('Confidence:', result.verdict.decisionMatrix?.[0]?.score);
  }
}

main().catch(console.error);
