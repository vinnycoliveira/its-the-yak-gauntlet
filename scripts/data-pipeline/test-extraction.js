/**
 * Test Extraction Script
 *
 * Validates the data extraction pipeline with 2-3 hand-picked episodes
 * before building the full pipeline.
 *
 * Usage: node test-extraction.js
 */

import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

// Load environment variables from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

// Test episode IDs - these are known gauntlet runs from the CSV
const TEST_EPISODE_IDS = [
  '142868443', // Clay Guida Takes On The Yak Gauntlet (12/4/2025) - title only
  '137382158', // Dana Beers Takes On The Yak Gauntlet (9/9/2025) - title only
  '144637782', // The Yak 12-19-25 - has transcript with "Have you done the gauntlet yet?"
];

const CSV_PATH = join(__dirname, '../../src/data/Podcast Episodes Search Results.csv');

/**
 * Parse the CSV and extract test episodes
 */
async function parseCSV() {
  const episodes = [];

  return new Promise((resolve, reject) => {
    const parser = createReadStream(CSV_PATH)
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        relax_quotes: true,
        relax_column_count: true,
      }));

    parser.on('data', (row) => {
      if (TEST_EPISODE_IDS.includes(row['Episode Id'])) {
        // Parse the Highlights JSON field
        let highlights = null;
        try {
          highlights = JSON.parse(row['Highlights'] || '{}');
        } catch (e) {
          console.warn(`Failed to parse Highlights for episode ${row['Episode Id']}`);
        }

        episodes.push({
          showId: row['Show Id'],
          showTitle: row['Show Title'],
          episodeId: row['Episode Id'],
          episodeTitle: row['Episode Title'],
          episodeLink: row['Episode Link'],
          highlights,
          publishDate: row['Publish Date'],
          relevance: row['Relevance'],
        });
      }
    });

    parser.on('error', reject);
    parser.on('end', () => resolve(episodes));
  });
}

/**
 * Extract competitor name and time from episode using Claude API
 */
async function extractWithClaude(episode, client) {
  // Build context from episode data
  const titleContext = episode.episodeTitle;
  const transcriptContext = episode.highlights?.transcript
    ?.map(t => t.phrase || t.context)
    .join('\n') || 'No transcript available';

  const prompt = `You are analyzing podcast episode data from "The Yak" show to extract information about "The Yak Gauntlet" - a timed challenge where competitors must complete trivia, shoot a hockey puck, make a basketball shot, and juggle.

Episode Title: ${titleContext}
Publish Date: ${episode.publishDate}

Transcript snippets mentioning "gauntlet":
${transcriptContext}

Based on this information, extract the following if this episode contains an actual gauntlet run:

1. Competitor Name: Who ran the gauntlet? (Extract from title pattern "[Name] Takes On The Yak Gauntlet" or from transcript context)
2. Is this an actual gauntlet run or just a discussion about the gauntlet?
3. Any time mentioned (format like "2:15.34" or "two minutes fifteen seconds")?
4. Any special conditions mentioned (blindfolded, record attempt, etc.)?

Respond in JSON format:
{
  "isActualRun": boolean,
  "confidence": "high" | "medium" | "low",
  "competitorName": string | null,
  "time": string | null,
  "specialConditions": string[],
  "reasoning": string
}`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0].text;

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { error: 'Could not parse JSON response', raw: content };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Main test function
 */
async function runTest() {
  console.log('='.repeat(60));
  console.log('YAK GAUNTLET DATA EXTRACTION - TEST RUN');
  console.log('='.repeat(60));
  console.log();

  // Step 1: Parse CSV
  console.log('Step 1: Parsing CSV file...');
  const episodes = await parseCSV();
  console.log(`Found ${episodes.length} test episodes out of ${TEST_EPISODE_IDS.length} requested`);
  console.log();

  if (episodes.length === 0) {
    console.error('No test episodes found! Check episode IDs.');
    return;
  }

  // Display parsed episodes
  console.log('Parsed Episodes:');
  console.log('-'.repeat(60));
  for (const ep of episodes) {
    console.log(`  ID: ${ep.episodeId}`);
    console.log(`  Title: ${ep.episodeTitle}`);
    console.log(`  Date: ${ep.publishDate}`);
    console.log(`  Has Transcript: ${ep.highlights?.transcript?.length > 0 ? 'Yes' : 'No'}`);
    if (ep.highlights?.transcript?.length > 0) {
      console.log(`  Transcript snippets: ${ep.highlights.transcript.length}`);
    }
    console.log();
  }

  // Step 2: Check for API key
  console.log('Step 2: Checking Claude API key...');
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.log('  ANTHROPIC_API_KEY not found in environment');
    console.log('  To test Claude extraction, add ANTHROPIC_API_KEY to .env file');
    console.log();
    console.log('Skipping Claude extraction test. CSV parsing validated successfully!');
    return;
  }

  console.log('  API key found');
  console.log();

  // Step 3: Test Claude extraction
  console.log('Step 3: Testing Claude API extraction...');
  console.log('-'.repeat(60));

  const client = new Anthropic({ apiKey });

  for (const episode of episodes) {
    console.log(`\nProcessing: ${episode.episodeTitle}`);
    console.log(`Date: ${episode.publishDate}`);

    const result = await extractWithClaude(episode, client);

    console.log('\nExtraction Result:');
    console.log(JSON.stringify(result, null, 2));
    console.log('-'.repeat(60));
  }

  console.log();
  console.log('='.repeat(60));
  console.log('TEST COMPLETE');
  console.log('='.repeat(60));
}

// Run the test
runTest().catch(console.error);
