/**
 * Podscribe Page Scraping Test
 *
 * Since the API returns HTML (SPA), let's see what data is embedded in the page.
 * The transcript might be server-rendered or available in the page source.
 *
 * Usage: node test-podscribe-scrape.js
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
const TEST_EPISODE_ID = '142868443'; // Clay Guida episode

async function fetchWithAuth(url, useApiKey = true) {
  const headers = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  };

  if (useApiKey && API_KEY) {
    // Try as cookie
    headers['Cookie'] = `token=${API_KEY}; auth_token=${API_KEY}`;
    // Also try as header
    headers['Authorization'] = `Bearer ${API_KEY}`;
  }

  const response = await fetch(url, { headers });
  return response.text();
}

async function main() {
  console.log('='.repeat(70));
  console.log('PODSCRIBE PAGE SCRAPING TEST');
  console.log('='.repeat(70));
  console.log();

  const url = `https://app.podscribe.com/episode/${TEST_EPISODE_ID}`;
  console.log(`Fetching: ${url}`);
  console.log();

  const html = await fetchWithAuth(url);

  // Look for interesting patterns in the HTML
  console.log('Page size:', html.length, 'bytes');
  console.log();

  // Check for Next.js data (common pattern)
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (nextDataMatch) {
    console.log('Found __NEXT_DATA__ (Next.js server-rendered data):');
    console.log('-'.repeat(70));
    try {
      const data = JSON.parse(nextDataMatch[1]);
      console.log(JSON.stringify(data, null, 2).substring(0, 3000));
      console.log('... (truncated)');
    } catch {
      console.log(nextDataMatch[1].substring(0, 1000));
    }
    console.log();
  }

  // Check for embedded JSON data
  const jsonScripts = html.match(/<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/g);
  if (jsonScripts) {
    console.log(`Found ${jsonScripts.length} JSON script blocks`);
    for (const script of jsonScripts.slice(0, 3)) {
      console.log('-'.repeat(70));
      console.log(script.substring(0, 500));
    }
    console.log();
  }

  // Check for window.__INITIAL_STATE__ or similar
  const stateMatches = html.match(/window\.__[A-Z_]+__\s*=\s*(\{[\s\S]*?\});/g);
  if (stateMatches) {
    console.log('Found window state variables:');
    for (const match of stateMatches) {
      console.log('-'.repeat(70));
      console.log(match.substring(0, 500));
    }
    console.log();
  }

  // Look for transcript-related content
  const transcriptMention = html.includes('transcript');
  const gauntletMention = html.includes('gauntlet') || html.includes('Gauntlet');
  const clayMention = html.includes('Clay') || html.includes('Guida');

  console.log('Content checks:');
  console.log(`  - Contains "transcript": ${transcriptMention}`);
  console.log(`  - Contains "gauntlet": ${gauntletMention}`);
  console.log(`  - Contains "Clay/Guida": ${clayMention}`);
  console.log();

  // Check for API endpoints in the JS
  const apiUrls = html.match(/https?:\/\/[^"'\s]+api[^"'\s]*/gi);
  if (apiUrls) {
    const uniqueApis = [...new Set(apiUrls)].slice(0, 10);
    console.log('Found API URL patterns:');
    for (const api of uniqueApis) {
      console.log(`  - ${api}`);
    }
  }

  console.log();
  console.log('='.repeat(70));
  console.log('SCRAPING TEST COMPLETE');
  console.log('='.repeat(70));
}

main().catch(console.error);
