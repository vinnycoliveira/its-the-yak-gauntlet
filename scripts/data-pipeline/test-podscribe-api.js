/**
 * Podscribe API Exploration Script
 *
 * Tests various endpoints to discover what's available with the API key.
 *
 * Usage: node test-podscribe-api.js
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

// Known episode IDs from the CSV
const TEST_EPISODE_ID = '142868443'; // Clay Guida episode
const TEST_SHOW_ID = '2272733'; // Barstool Yak (YouTube)

// The app.podscribe.com returns HTML (SPA). The actual API is likely separate.
// Common patterns for SPAs: /api/*, /_api/*, /graphql, etc.
// JWT token suggests authenticated API endpoints
const API_BASES = [
  'https://app.podscribe.com/_api',
  'https://app.podscribe.com/api',
  'https://app.podscribe.com/_next/data',
  'https://api.podscribe.ai',
  'https://podscribe.com/api',
];

// Endpoint patterns - trying REST and GraphQL
const ENDPOINTS = [
  `/episodes/${TEST_EPISODE_ID}`,
  `/episode/${TEST_EPISODE_ID}`,
  `/transcript/${TEST_EPISODE_ID}`,
  `/transcripts/${TEST_EPISODE_ID}`,
  `/v1/episodes/${TEST_EPISODE_ID}`,
  `/v1/transcript/${TEST_EPISODE_ID}`,
  `/shows/${TEST_SHOW_ID}`,
  `/series/${TEST_SHOW_ID}`,
  `/podcast/${TEST_SHOW_ID}`,
  `/search?query=gauntlet&show_id=${TEST_SHOW_ID}`,
  `/graphql`,
];

// Different auth header patterns
const AUTH_PATTERNS = [
  { Authorization: `Bearer ${API_KEY}` },
  { Authorization: `Token ${API_KEY}` },
  { Authorization: API_KEY },
  { 'X-API-Key': API_KEY },
  { 'Api-Key': API_KEY },
  { apikey: API_KEY },
];

async function tryEndpoint(baseUrl, endpoint, headers) {
  const url = `${baseUrl}${endpoint}`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...headers,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    const status = response.status;
    let body = '';
    try {
      body = await response.text();
      // Try to parse as JSON for cleaner output
      const json = JSON.parse(body);
      body = JSON.stringify(json, null, 2).substring(0, 500);
    } catch {
      body = body.substring(0, 200);
    }

    return { url, status, body, success: status >= 200 && status < 300 };
  } catch (error) {
    return { url, status: 'ERROR', body: error.message, success: false };
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('PODSCRIBE API EXPLORATION');
  console.log('='.repeat(70));
  console.log();

  if (!API_KEY) {
    console.error('ERROR: PODSCRIBE_API_KEY not found in .env file');
    console.log('Please add: PODSCRIBE_API_KEY=your_key_here');
    process.exit(1);
  }

  console.log(`API Key found: ${API_KEY.substring(0, 10)}...${API_KEY.substring(API_KEY.length - 4)}`);
  console.log(`Test Episode ID: ${TEST_EPISODE_ID}`);
  console.log(`Test Show ID: ${TEST_SHOW_ID}`);
  console.log();

  const successfulEndpoints = [];

  // Try first auth pattern with all base URLs and endpoints
  console.log('Testing endpoints with Bearer auth...');
  console.log('-'.repeat(70));

  for (const baseUrl of API_BASES) {
    for (const endpoint of ENDPOINTS) {
      const result = await tryEndpoint(baseUrl, endpoint, AUTH_PATTERNS[0]);

      // Show all results for debugging
      const statusIcon = result.success ? '✓' : result.status === 401 ? '🔒' : result.status === 404 ? '❌' : '⚠️';
      console.log(`${statusIcon} [${result.status}] ${result.url}`);

      if (result.success) {
        successfulEndpoints.push(result);
        console.log(`   Response: ${result.body.substring(0, 200)}...`);
      }

      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  console.log();
  console.log('='.repeat(70));

  if (successfulEndpoints.length > 0) {
    console.log('SUCCESSFUL ENDPOINTS:');
    console.log('-'.repeat(70));
    for (const ep of successfulEndpoints) {
      console.log(`\n${ep.url}`);
      console.log(ep.body);
    }
  } else {
    console.log('No successful endpoints found with Bearer auth.');
    console.log();
    console.log('Trying alternative auth patterns...');
    console.log('-'.repeat(70));

    // Try other auth patterns on a single endpoint
    const testUrl = `${API_BASES[0]}/episodes/${TEST_EPISODE_ID}`;
    for (let i = 1; i < AUTH_PATTERNS.length; i++) {
      const authName = Object.keys(AUTH_PATTERNS[i])[0];
      const result = await tryEndpoint(API_BASES[0], `/episodes/${TEST_EPISODE_ID}`, AUTH_PATTERNS[i]);
      console.log(`${authName}: [${result.status}] ${result.body.substring(0, 100)}`);
    }
  }

  console.log();
  console.log('='.repeat(70));
  console.log('EXPLORATION COMPLETE');
  console.log('='.repeat(70));
  console.log();
  console.log('If no endpoints worked, the API might:');
  console.log('  1. Use a different base URL');
  console.log('  2. Require different authentication');
  console.log('  3. Need specific request parameters');
  console.log();
  console.log('Check any documentation that came with your API key.');
}

main().catch(console.error);
