/**
 * Podscribe Transcript API Test v2
 *
 * Correct endpoint format from OpenAPI spec:
 * GET /api/public/episode/transcript
 *   - itunes_or_yt_id: YouTube Channel ID / iTunes ID (required)
 *   - guid: Episode GUID from RSS / YouTube Video ID (required)
 *
 * Usage: node test-podscribe-transcript-v2.js
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

// The Yak identifiers
// YouTube Channel: @BarstoolYak -> Channel ID: UC0e82SjsPEL-K8MnJlAA2Dw (need to verify)
// iTunes ID: 1507180687
const THE_YAK_ITUNES_ID = '1507180687';
const THE_YAK_YT_CHANNEL_ID = 'UC0e82SjsPEL-K8MnJlAA2Dw'; // Barstool Yak YouTube channel

// Test with different GUID formats
// The CSV episode IDs might be Podscribe internal IDs, not actual GUIDs
// We need to try RSS GUIDs or YouTube video IDs

async function fetchTranscript(itunesOrYtId, guid) {
  const url = new URL(`${API_BASE}/api/public/episode/transcript`);
  url.searchParams.set('itunes_or_yt_id', itunesOrYtId);
  url.searchParams.set('guid', guid);

  console.log(`  URL: ${url}`);

  const response = await fetch(url.toString(), {
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
  console.log('PODSCRIBE TRANSCRIPT API TEST v2');
  console.log('='.repeat(70));
  console.log();

  if (!API_KEY) {
    console.error('ERROR: PODSCRIBE_API_KEY not found');
    process.exit(1);
  }

  console.log(`API Key: ${API_KEY.substring(0, 20)}...`);
  console.log();

  // Test cases - trying different combinations
  const tests = [
    // Using iTunes ID with Podscribe episode ID (probably wrong)
    {
      name: 'iTunes ID + Podscribe Episode ID',
      itunesOrYtId: THE_YAK_ITUNES_ID,
      guid: '142868443', // Clay Guida - Podscribe ID
    },
    // Using YouTube channel ID with Podscribe episode ID
    {
      name: 'YouTube Channel + Podscribe Episode ID',
      itunesOrYtId: THE_YAK_YT_CHANNEL_ID,
      guid: '142868443',
    },
    // Try with a made-up RSS GUID format (common patterns)
    {
      name: 'iTunes ID + UUID-style GUID',
      itunesOrYtId: THE_YAK_ITUNES_ID,
      guid: 'e1234567-abcd-1234-5678-abcdef123456',
    },
    // If you have actual YouTube video IDs, those would work as guids
    // Example: For a video URL like youtube.com/watch?v=ABC123xyz
    // the guid would be "ABC123xyz"
  ];

  for (const test of tests) {
    console.log('-'.repeat(70));
    console.log(`Test: ${test.name}`);
    const result = await fetchTranscript(test.itunesOrYtId, test.guid);
    console.log(`  Status: ${result.status}`);

    if (result.status === 200) {
      console.log('  SUCCESS!');
      if (result.data.transcription?.text) {
        const text = Array.isArray(result.data.transcription.text)
          ? result.data.transcription.text.join(' ')
          : result.data.transcription.text;
        console.log(`  Transcript length: ${text.length} chars`);
        console.log(`  Preview: ${text.substring(0, 200)}...`);

        // Save to file
        const filename = `transcript_${test.guid}.json`;
        writeFileSync(join(__dirname, filename), JSON.stringify(result.data, null, 2));
        console.log(`  Saved to: ${filename}`);
      }
    } else {
      console.log(`  Response: ${JSON.stringify(result.data).substring(0, 200)}`);
    }
    console.log();
  }

  console.log('='.repeat(70));
  console.log('NOTES:');
  console.log('- The "guid" parameter needs to be the actual RSS GUID or YouTube video ID');
  console.log('- Not the Podscribe internal episode ID from the CSV');
  console.log('- To find the correct GUID, you may need to:');
  console.log('  1. Check the podcast RSS feed for episode GUIDs');
  console.log('  2. Use YouTube video IDs from the video URLs');
  console.log('='.repeat(70));
}

main().catch(console.error);
