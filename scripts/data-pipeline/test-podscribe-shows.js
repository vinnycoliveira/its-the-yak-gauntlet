/**
 * Podscribe Shows API Test
 *
 * Tests endpoints that might not require specific episode access
 * to understand what data is available.
 *
 * Usage: node test-podscribe-shows.js
 */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import dotenv from 'dotenv';

// Workaround for corporate SSL certificate issues
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

const API_KEY = process.env.PODSCRIBE_API_KEY;
const API_BASE = 'https://backend.podscribe.ai';

// The Yak show IDs from CSV
const THE_YAK_PODCAST_ID = '1298078'; // The Yak (audio podcast)
const THE_YAK_YOUTUBE_ID = '2272733'; // Barstool Yak (YouTube)

// iTunes ID for The Yak (if needed)
const THE_YAK_ITUNES_ID = '1507180687'; // Found via podcast search

async function fetchEndpoint(path, params = {}) {
  const url = new URL(`${API_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  console.log(`Fetching: ${url}`);

  try {
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
  } catch (error) {
    return { status: 'ERROR', data: error.message };
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('PODSCRIBE SHOWS API TEST');
  console.log('='.repeat(70));
  console.log();

  if (!API_KEY) {
    console.error('ERROR: PODSCRIBE_API_KEY not found');
    process.exit(1);
  }

  console.log(`API Key: ${API_KEY.substring(0, 20)}...`);
  console.log();

  // Test various endpoints
  const tests = [
    // Show info endpoints
    { path: '/api/public/series/episodes/' + THE_YAK_PODCAST_ID, name: 'Series Episodes (Podcast ID)' },
    { path: '/api/public/series/episodes/' + THE_YAK_YOUTUBE_ID, name: 'Series Episodes (YouTube ID)' },

    // Try searching for the show
    { path: '/api/public/ranker', name: 'Ranker (show search)', params: { search: 'The Yak', limit: '5' } },

    // Try with iTunes ID
    { path: '/api/public/series/episodes/' + THE_YAK_ITUNES_ID, name: 'Series Episodes (iTunes ID)' },

    // Show info by iTunes
    { path: '/api/public/show', name: 'Show Info', params: { itunesId: THE_YAK_ITUNES_ID } },

    // General endpoints that might work
    { path: '/api/public/user', name: 'User Info' },
    { path: '/api/public/account', name: 'Account Info' },
  ];

  for (const test of tests) {
    console.log('-'.repeat(70));
    console.log(`Testing: ${test.name}`);
    const result = await fetchEndpoint(test.path, test.params || {});
    console.log(`Status: ${result.status}`);

    if (result.status === 200 && typeof result.data === 'object') {
      const preview = JSON.stringify(result.data, null, 2);
      if (preview.length > 1000) {
        console.log('Response (truncated):');
        console.log(preview.substring(0, 1000) + '...');
      } else {
        console.log('Response:');
        console.log(preview);
      }
    } else {
      console.log(`Response: ${JSON.stringify(result.data).substring(0, 200)}`);
    }
    console.log();
  }

  console.log('='.repeat(70));
  console.log('TEST COMPLETE');
  console.log('='.repeat(70));
}

main().catch(console.error);
