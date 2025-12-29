/**
 * Test Airtable Write Script
 *
 * Tests writing a single gauntlet run to Airtable.
 *
 * Usage:
 *   node test-airtable-write.js           # Dry run - shows what would be written
 *   node test-airtable-write.js --write   # Actually writes to Airtable
 */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import dotenv from 'dotenv';

// Workaround for corporate SSL certificate issues
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Load environment variables from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

const AIRTABLE_PAT = process.env.VITE_AIRTABLE_PAT;
const AIRTABLE_BASE_ID = process.env.VITE_AIRTABLE_BASE_ID;
const AIRTABLE_API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

// Test data - Clay Guida gauntlet run
// You'll need to fill in the time and YouTube URL after looking up the video
const TEST_RUN = {
  competitor: 'Clay Guida',
  date: '12/4/2025',
  time: null,  // Format: "2:15.34" - NEEDS TO BE FILLED IN
  youtubeUrl: null,  // NEEDS TO BE FILLED IN after finding the video
  triviaUrl: null,
  resume: '🥊 Combat Sports',  // UFC fighter
  asterisks: [],  // Any special flags
  season: 'S4',  // Current season
};

/**
 * Fetch all competitors to find or create the competitor record
 */
async function fetchCompetitors() {
  const records = [];
  let offset = null;

  do {
    const url = new URL(`${AIRTABLE_API_URL}/Competitors`);
    if (offset) url.searchParams.set('offset', offset);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${AIRTABLE_PAT}` },
    });

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.status}`);
    }

    const data = await response.json();
    records.push(...data.records);
    offset = data.offset;
  } while (offset);

  return records;
}

/**
 * Find competitor by name, return record ID if found
 */
async function findCompetitor(name) {
  const competitors = await fetchCompetitors();
  const match = competitors.find(
    (r) => r.fields.Competitor?.toLowerCase() === name.toLowerCase()
  );
  return match ? match.id : null;
}

/**
 * Create a new competitor record
 */
async function createCompetitor(name, resume) {
  const response = await fetch(`${AIRTABLE_API_URL}/Competitors`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${AIRTABLE_PAT}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        Competitor: name,
        'Resumé': resume,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create competitor: ${error}`);
  }

  const data = await response.json();
  return data.id;
}

/**
 * Parse time string "M:SS.ss" to seconds
 */
function parseTimeToSeconds(timeStr) {
  if (!timeStr) return null;
  const match = timeStr.match(/^(\d+):(\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const minutes = parseInt(match[1], 10);
  const seconds = parseFloat(match[2]);
  return minutes * 60 + seconds;
}

/**
 * Create a leaderboard entry
 */
async function createLeaderboardEntry(runData, competitorId) {
  const fields = {
    Competitor: [competitorId],
    Date: runData.date,
  };

  // Only add time if provided
  if (runData.time) {
    fields.Time = parseTimeToSeconds(runData.time);
  }

  // Only add URLs if provided
  if (runData.youtubeUrl) {
    fields['YouTube URL'] = runData.youtubeUrl;
  }
  if (runData.triviaUrl) {
    fields['Trivia Quiz URL'] = runData.triviaUrl;
  }

  // Add season if provided
  if (runData.season) {
    fields.Season = runData.season;
  }

  const response = await fetch(`${AIRTABLE_API_URL}/Leaderboard`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${AIRTABLE_PAT}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create leaderboard entry: ${error}`);
  }

  return response.json();
}

/**
 * Check if a run already exists (by date and competitor name)
 */
async function checkForDuplicate(date, competitorName) {
  const records = [];
  let offset = null;

  do {
    const url = new URL(`${AIRTABLE_API_URL}/Leaderboard`);
    if (offset) url.searchParams.set('offset', offset);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${AIRTABLE_PAT}` },
    });

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.status}`);
    }

    const data = await response.json();
    records.push(...data.records);
    offset = data.offset;
  } while (offset);

  // Check for matching date and competitor
  return records.find((r) => {
    const recordDate = r.fields.Date;
    const competitors = r.fields.Competitors || '';
    return (
      recordDate === date &&
      competitors.toLowerCase().includes(competitorName.toLowerCase())
    );
  });
}

/**
 * Main function
 */
async function main() {
  const shouldWrite = process.argv.includes('--write');

  console.log('='.repeat(60));
  console.log('AIRTABLE WRITE TEST');
  console.log(shouldWrite ? 'MODE: LIVE WRITE' : 'MODE: DRY RUN');
  console.log('='.repeat(60));
  console.log();

  // Validate environment
  if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID) {
    console.error('Missing VITE_AIRTABLE_PAT or VITE_AIRTABLE_BASE_ID in .env');
    process.exit(1);
  }

  // Check test data completeness
  console.log('Test Run Data:');
  console.log('-'.repeat(60));
  console.log(`  Competitor: ${TEST_RUN.competitor}`);
  console.log(`  Date: ${TEST_RUN.date}`);
  console.log(`  Time: ${TEST_RUN.time || '⚠️  NOT SET - needs to be filled in'}`);
  console.log(`  YouTube URL: ${TEST_RUN.youtubeUrl || '⚠️  NOT SET - needs to be filled in'}`);
  console.log(`  Resume: ${TEST_RUN.resume}`);
  console.log(`  Season: ${TEST_RUN.season}`);
  console.log();

  if (!TEST_RUN.time) {
    console.log('⚠️  WARNING: Time is not set. The entry will be created without a time.');
    console.log('   You should look up the YouTube video to get the actual time.');
    console.log();
  }

  // Check for duplicates
  console.log('Checking for existing entry...');
  const duplicate = await checkForDuplicate(TEST_RUN.date, TEST_RUN.competitor);
  if (duplicate) {
    console.log(`⚠️  DUPLICATE FOUND: ${TEST_RUN.competitor} already has a run on ${TEST_RUN.date}`);
    console.log(`   Existing record ID: ${duplicate.id}`);
    console.log();
    if (!shouldWrite) {
      console.log('Skipping write (duplicate detected).');
      return;
    }
  } else {
    console.log('✓ No duplicate found');
    console.log();
  }

  // Find or create competitor
  console.log(`Looking up competitor: ${TEST_RUN.competitor}...`);
  let competitorId = await findCompetitor(TEST_RUN.competitor);

  if (competitorId) {
    console.log(`✓ Found existing competitor: ${competitorId}`);
  } else {
    console.log(`  Competitor not found in database`);
    if (shouldWrite) {
      console.log(`  Creating new competitor...`);
      competitorId = await createCompetitor(TEST_RUN.competitor, TEST_RUN.resume);
      console.log(`✓ Created competitor: ${competitorId}`);
    } else {
      console.log(`  [DRY RUN] Would create new competitor: ${TEST_RUN.competitor}`);
      competitorId = '[NEW_COMPETITOR_ID]';
    }
  }
  console.log();

  // Create leaderboard entry
  if (shouldWrite) {
    if (duplicate) {
      console.log('⚠️  Skipping write - duplicate entry exists');
      return;
    }
    console.log('Creating leaderboard entry...');
    const result = await createLeaderboardEntry(TEST_RUN, competitorId);
    console.log('✓ Created leaderboard entry:');
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('[DRY RUN] Would create leaderboard entry:');
    console.log(JSON.stringify({
      fields: {
        Competitor: [competitorId],
        Date: TEST_RUN.date,
        Time: TEST_RUN.time ? parseTimeToSeconds(TEST_RUN.time) : null,
        'YouTube URL': TEST_RUN.youtubeUrl,
        Season: TEST_RUN.season,
      }
    }, null, 2));
  }

  console.log();
  console.log('='.repeat(60));
  console.log(shouldWrite ? 'WRITE COMPLETE' : 'DRY RUN COMPLETE');
  console.log('='.repeat(60));

  if (!shouldWrite) {
    console.log();
    console.log('To actually write to Airtable, run:');
    console.log('  node test-airtable-write.js --write');
  }
}

main().catch(console.error);
