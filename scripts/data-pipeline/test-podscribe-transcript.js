/**
 * Podscribe Transcript API Test
 *
 * Tests the official Podscribe API endpoint for fetching transcripts.
 * API Base: https://backend.podscribe.ai/
 * Endpoint: /api/public/episode/transcript?guid={episode_guid}
 *
 * Usage: node test-podscribe-transcript.js
 */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFileSync } from 'node:fs';
import dotenv from 'dotenv';

// Workaround for corporate SSL certificate issues
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

const API_KEY = process.env.PODSCRIBE_API_KEY;
const API_BASE = 'https://backend.podscribe.ai';

// Test episodes - using the episode IDs from the CSV
// Note: The API uses "guid" which might be different from the Podscribe episode ID
const TEST_EPISODES = [
  { id: '142868443', name: 'Clay Guida' },
  { id: '137382158', name: 'Dana Beers' },
  { id: '144637782', name: 'The Yak 12-19-25' },
];

async function fetchTranscript(episodeGuid, authMethod = 'bearer') {
  const url = `${API_BASE}/api/public/episode/transcript?guid=${episodeGuid}`;

  const headers = {
    Accept: 'application/json',
  };

  // Try different auth methods
  switch (authMethod) {
    case 'bearer':
      headers.Authorization = `Bearer ${API_KEY}`;
      break;
    case 'token':
      headers.Authorization = `Token ${API_KEY}`;
      break;
    case 'api-key':
      headers['X-API-Key'] = API_KEY;
      break;
    case 'query':
      // Will add to URL instead
      break;
  }

  let finalUrl = url;
  if (authMethod === 'query') {
    finalUrl = `${url}&api_key=${API_KEY}`;
  }

  console.log(`  Fetching (${authMethod}): ${finalUrl.substring(0, 80)}...`);

  const response = await fetch(finalUrl, { headers });

  const status = response.status;
  let data;

  try {
    data = await response.json();
  } catch {
    data = await response.text();
  }

  return { status, data, authMethod };
}

async function fetchEpisodeInfo(episodeId) {
  // Try the series/episodes endpoint to get episode details including GUID
  const url = `${API_BASE}/api/public/series/episodes/${episodeId}`;

  console.log(`  Fetching episode info: ${url}`);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      Accept: 'application/json',
    },
  });

  const status = response.status;
  let data;

  try {
    data = await response.json();
  } catch {
    data = await response.text();
  }

  return { status, data };
}

async function main() {
  console.log('='.repeat(70));
  console.log('PODSCRIBE TRANSCRIPT API TEST');
  console.log('='.repeat(70));
  console.log();

  if (!API_KEY) {
    console.error('ERROR: PODSCRIBE_API_KEY not found in .env file');
    process.exit(1);
  }

  console.log(`API Key: ${API_KEY.substring(0, 20)}...`);
  console.log(`API Base: ${API_BASE}`);
  console.log();

  // First, try to get episode info to find the GUID
  console.log('Step 1: Testing episode info endpoint...');
  console.log('-'.repeat(70));

  for (const episode of TEST_EPISODES) {
    console.log(`\nEpisode: ${episode.name} (ID: ${episode.id})`);
    const result = await fetchEpisodeInfo(episode.id);
    console.log(`  Status: ${result.status}`);

    if (result.status === 200 && typeof result.data === 'object') {
      console.log('  Response preview:');
      const preview = JSON.stringify(result.data, null, 2).substring(0, 500);
      console.log(`  ${preview}...`);
    } else {
      console.log(`  Response: ${JSON.stringify(result.data).substring(0, 200)}`);
    }
  }

  console.log();
  console.log('-'.repeat(70));
  console.log('Step 2: Testing transcript endpoint with different auth methods...');
  console.log('-'.repeat(70));

  const authMethods = ['bearer', 'token', 'api-key', 'query'];
  const testEpisode = TEST_EPISODES[0]; // Just test with Clay Guida

  console.log(`\nTesting episode: ${testEpisode.name} (ID: ${testEpisode.id})`);

  for (const method of authMethods) {
    const result = await fetchTranscript(testEpisode.id, method);
    console.log(`  [${method}] Status: ${result.status} - ${JSON.stringify(result.data).substring(0, 50)}`);
  }

  console.log();
  console.log('-'.repeat(70));
  console.log('Step 3: Testing with different episode ID formats...');
  console.log('-'.repeat(70));

  for (const episode of TEST_EPISODES) {
    console.log(`\nEpisode: ${episode.name} (ID: ${episode.id})`);
    const result = await fetchTranscript(episode.id, 'bearer');
    console.log(`  Status: ${result.status}`);

    if (result.status === 200 && typeof result.data === 'object') {
      console.log('  SUCCESS! Transcript data received.');

      // Check if there's actual transcript content
      if (result.data.transcription?.text) {
        const textLength = Array.isArray(result.data.transcription.text)
          ? result.data.transcription.text.join(' ').length
          : String(result.data.transcription.text).length;
        console.log(`  Transcript length: ${textLength} characters`);

        // Save full response to file for inspection
        const filename = `transcript_${episode.id}.json`;
        writeFileSync(join(__dirname, filename), JSON.stringify(result.data, null, 2));
        console.log(`  Saved full response to: ${filename}`);
      } else {
        console.log('  Response structure:');
        console.log(`  ${JSON.stringify(Object.keys(result.data))}`);
      }
    } else if (result.status === 422) {
      console.log('  422 Unprocessable Entity - invalid GUID format');
    } else {
      console.log(`  Response: ${JSON.stringify(result.data).substring(0, 300)}`);
    }
  }

  console.log();
  console.log('='.repeat(70));
  console.log('TEST COMPLETE');
  console.log('='.repeat(70));
}

main().catch(console.error);
