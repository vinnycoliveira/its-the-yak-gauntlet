/**
 * Import Pending Records Script
 *
 * Imports records from pendingImports.json that are missing from Airtable
 * and flags them with "Needs Review" asterisk.
 *
 * Usage:
 *   node import-pending-records.js           # Dry run - shows what would be written
 *   node import-pending-records.js --write   # Actually writes to Airtable
 */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';
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

const headers = {
  Authorization: `Bearer ${AIRTABLE_PAT}`,
  'Content-Type': 'application/json',
};

/**
 * Fetch all records from a table with pagination
 */
async function fetchAllRecords(tableName) {
  const records = [];
  let offset = null;

  do {
    const url = new URL(`${AIRTABLE_API_URL}/${tableName}`);
    if (offset) url.searchParams.set('offset', offset);

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Airtable API error for ${tableName}: ${response.status} - ${error}`);
    }

    const data = await response.json();
    records.push(...data.records);
    offset = data.offset;
  } while (offset);

  return records;
}

/**
 * Fetch all asterisks
 */
async function fetchAsterisks() {
  const records = await fetchAllRecords('Asterisks');
  return records.map((r) => ({
    id: r.id,
    flag: r.fields.Flag || '',
    description: r.fields.Description || '',
  }));
}

/**
 * Create a new asterisk
 */
async function createAsterisk(flag, description = '') {
  const response = await fetch(`${AIRTABLE_API_URL}/Asterisks`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      fields: {
        Flag: flag,
        Description: description,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create asterisk: ${error}`);
  }

  const data = await response.json();
  return { id: data.id, flag: data.fields.Flag };
}

/**
 * Fetch all competitors
 */
async function fetchCompetitors() {
  const records = await fetchAllRecords('Competitors');
  return records.map((r) => ({
    id: r.id,
    name: r.fields.Competitor || '',
  }));
}

/**
 * Create a new competitor
 */
async function createCompetitor(name) {
  const response = await fetch(`${AIRTABLE_API_URL}/Competitors`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      fields: {
        Competitor: name,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create competitor: ${error}`);
  }

  const data = await response.json();
  return { id: data.id, name: data.fields.Competitor };
}

/**
 * Fetch all leaderboard entries
 */
async function fetchLeaderboard() {
  const records = await fetchAllRecords('Leaderboard');
  return records.map((r) => ({
    id: r.id,
    date: r.fields.Date || '',
    time: r.fields.Time,
    competitor: r.fields.Competitors || '', // This is a lookup field showing competitor name
    competitorId: r.fields.Competitor?.[0] || null,
  }));
}

/**
 * Parse time string "M:SS.cc" or "MM:SS.cc" to seconds
 */
function parseTimeToSeconds(timeStr) {
  if (!timeStr || timeStr === 'DNF' || timeStr === 'Gas') return null;

  // Handle format like "5:14.00" or "1:26.00"
  const match = timeStr.match(/^(\d+):(\d+(?:\.\d+)?)$/);
  if (!match) return null;

  const minutes = parseInt(match[1], 10);
  const seconds = parseFloat(match[2]);
  return minutes * 60 + seconds;
}

/**
 * Convert date from "MM/DD/YYYY" to "YYYY-MM-DD" for Airtable
 */
function convertDateFormat(dateStr) {
  if (!dateStr) return null;
  const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return dateStr; // Return as-is if not matching expected format

  const month = match[1].padStart(2, '0');
  const day = match[2].padStart(2, '0');
  const year = match[3];
  return `${year}-${month}-${day}`;
}

/**
 * Create a leaderboard entry
 */
async function createLeaderboardEntry({ competitorId, date, time, asteriskIds = [], quizUrl = '' }) {
  const fields = {
    Competitor: [competitorId],
    Date: date,
  };

  if (time !== null) {
    fields.Time = time;
  }

  if (asteriskIds.length > 0) {
    fields.Asterisks = asteriskIds;
  }

  if (quizUrl) {
    fields['Trivia Quiz URL'] = quizUrl;
  }

  const response = await fetch(`${AIRTABLE_API_URL}/Leaderboard`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create leaderboard entry: ${error}`);
  }

  return response.json();
}

/**
 * Normalize competitor name for comparison
 */
function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Check if a record exists in the leaderboard by name AND date
 */
function findExistingEntry(leaderboard, competitorName, date) {
  const normalizedName = normalizeName(competitorName);
  const formattedDate = convertDateFormat(date);

  return leaderboard.find((entry) => {
    const entryName = normalizeName(entry.competitor);
    const nameMatch = entryName.includes(normalizedName) || normalizedName.includes(entryName);
    const dateMatch = entry.date === formattedDate;
    return nameMatch && dateMatch;
  });
}

/**
 * Main function
 */
async function main() {
  const shouldWrite = process.argv.includes('--write');

  console.log('='.repeat(70));
  console.log('IMPORT PENDING RECORDS TO AIRTABLE');
  console.log(shouldWrite ? 'MODE: LIVE WRITE' : 'MODE: DRY RUN');
  console.log('='.repeat(70));
  console.log();

  // Validate environment
  if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID) {
    console.error('Missing VITE_AIRTABLE_PAT or VITE_AIRTABLE_BASE_ID in .env');
    process.exit(1);
  }

  // Load pending imports
  const pendingImportsPath = join(__dirname, '../../src/data/pendingImports.json');
  const pendingData = JSON.parse(readFileSync(pendingImportsPath, 'utf-8'));
  console.log(`Loaded ${pendingData.records.length} records from pendingImports.json`);
  console.log();

  // Fetch existing data from Airtable
  console.log('Fetching existing data from Airtable...');
  const [asterisks, competitors, leaderboard] = await Promise.all([
    fetchAsterisks(),
    fetchCompetitors(),
    fetchLeaderboard(),
  ]);
  console.log(`  - ${asterisks.length} asterisks`);
  console.log(`  - ${competitors.length} competitors`);
  console.log(`  - ${leaderboard.length} leaderboard entries`);
  console.log();

  // Check/create "Needs Review" asterisk
  let needsReviewAsterisk = asterisks.find(
    (a) => a.flag.toLowerCase().includes('needs review')
  );

  if (!needsReviewAsterisk) {
    console.log('Creating "⚠️ Needs Review" asterisk...');
    if (shouldWrite) {
      needsReviewAsterisk = await createAsterisk(
        '⚠️ Needs Review',
        'Record imported from pendingImports.json - needs verification'
      );
      console.log(`✓ Created asterisk: ${needsReviewAsterisk.id}`);
    } else {
      console.log('[DRY RUN] Would create "⚠️ Needs Review" asterisk');
      needsReviewAsterisk = { id: '[NEW_ASTERISK_ID]', flag: '⚠️ Needs Review' };
    }
  } else {
    console.log(`✓ Found existing "Needs Review" asterisk: ${needsReviewAsterisk.id}`);
  }
  console.log();

  // Build competitor lookup map
  const competitorMap = new Map();
  for (const c of competitors) {
    competitorMap.set(normalizeName(c.name), c);
  }

  // Find records to import
  const toImport = [];
  const alreadyExists = [];
  const skipped = [];

  for (const record of pendingData.records) {
    // Skip DNF records or records without proper time
    if (record.isDNF || !record.time || record.time === 'DNF' || record.time === 'Gas') {
      skipped.push({ record, reason: 'DNF or invalid time' });
      continue;
    }

    // Check if competitor exists in leaderboard with similar name
    const existingEntry = findExistingEntry(leaderboard, record.competitor, record.date);

    if (existingEntry) {
      alreadyExists.push({ record, existingEntry });
    } else {
      toImport.push(record);
    }
  }

  console.log('Analysis Results:');
  console.log('-'.repeat(70));
  console.log(`  Records to import: ${toImport.length}`);
  console.log(`  Already in Airtable: ${alreadyExists.length}`);
  console.log(`  Skipped (DNF/invalid): ${skipped.length}`);
  console.log();

  if (toImport.length === 0) {
    console.log('No new records to import!');
    return;
  }

  // Show what will be imported
  console.log('Records to Import:');
  console.log('-'.repeat(70));
  for (const record of toImport) {
    console.log(`  ${record.competitor} - ${record.date} - ${record.time}`);
  }
  console.log();

  // Import records
  let imported = 0;
  let failed = 0;
  const newCompetitors = [];

  for (const record of toImport) {
    console.log(`Processing: ${record.competitor} (${record.date})...`);

    try {
      // Find or create competitor
      const normalizedName = normalizeName(record.competitor);
      let competitor = competitorMap.get(normalizedName);

      if (!competitor) {
        // Try partial match
        for (const [key, value] of competitorMap.entries()) {
          if (key.includes(normalizedName) || normalizedName.includes(key)) {
            competitor = value;
            break;
          }
        }
      }

      if (!competitor) {
        console.log(`  Creating new competitor: ${record.competitor}`);
        if (shouldWrite) {
          competitor = await createCompetitor(record.competitor);
          competitorMap.set(normalizedName, competitor);
          newCompetitors.push(competitor);
          console.log(`  ✓ Created competitor: ${competitor.id}`);
        } else {
          competitor = { id: `[NEW_${record.competitor}]`, name: record.competitor };
          console.log(`  [DRY RUN] Would create competitor: ${record.competitor}`);
        }
      } else {
        console.log(`  Found existing competitor: ${competitor.name} (${competitor.id})`);
      }

      // Create leaderboard entry
      const timeInSeconds = parseTimeToSeconds(record.time);
      const formattedDate = convertDateFormat(record.date);

      if (shouldWrite) {
        const entry = await createLeaderboardEntry({
          competitorId: competitor.id,
          date: formattedDate,
          time: timeInSeconds,
          asteriskIds: [needsReviewAsterisk.id],
          quizUrl: record.suggestedQuizUrl || '',
        });
        console.log(`  ✓ Created leaderboard entry: ${entry.id}`);
        imported++;
      } else {
        console.log(`  [DRY RUN] Would create leaderboard entry:`);
        console.log(`    - Competitor: ${competitor.id}`);
        console.log(`    - Date: ${formattedDate}`);
        console.log(`    - Time: ${timeInSeconds}s (${record.time})`);
        console.log(`    - Asterisk: ${needsReviewAsterisk.flag}`);
        if (record.suggestedQuizUrl) {
          console.log(`    - Quiz URL: ${record.suggestedQuizUrl}`);
        }
        imported++;
      }
    } catch (error) {
      console.error(`  ✗ Error: ${error.message}`);
      failed++;
    }

    console.log();
  }

  // Summary
  console.log('='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));
  console.log(`  ${shouldWrite ? 'Imported' : 'Would import'}: ${imported} records`);
  console.log(`  New competitors created: ${newCompetitors.length}`);
  console.log(`  Failed: ${failed}`);
  console.log();

  if (!shouldWrite) {
    console.log('To actually write to Airtable, run:');
    console.log('  node import-pending-records.js --write');
  }
}

main().catch(console.error);
