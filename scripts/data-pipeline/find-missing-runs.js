/**
 * Find Missing Gauntlet Runs
 *
 * Processes all CSV episodes to identify gauntlet runs using multiple patterns,
 * compares against existing Airtable data, and outputs a list of
 * missing entries for manual review.
 *
 * Usage: node find-missing-runs.js
 */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createReadStream, writeFileSync } from 'node:fs';
import { parse } from 'csv-parse';
import dotenv from 'dotenv';

// Workaround for corporate SSL certificate issues
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

const AIRTABLE_PAT = process.env.VITE_AIRTABLE_PAT;
const AIRTABLE_BASE_ID = process.env.VITE_AIRTABLE_BASE_ID;

/**
 * Patterns to extract competitor names from titles
 * Each pattern should have a capture group for the competitor name(s)
 */
const GAUNTLET_RUN_PATTERNS = [
  // Primary patterns - explicit run titles
  {
    regex: /^(.+?)\s+Takes\s+On\s+(?:The\s+)?(?:Yak\s+)?Gauntlet/i,
    type: 'takes_on',
    confidence: 'HIGH',
  },
  {
    regex: /^(.+?)\s+Runs?\s+(?:The\s+)?(?:Yak\s+)?Gauntlet/i,
    type: 'runs',
    confidence: 'HIGH',
  },
  {
    regex: /^(.+?)\s+(?:DOMINATES?|Dominated?)\s+(?:The\s+)?(?:Yak\s+)?Gauntlet/i,
    type: 'dominates',
    confidence: 'HIGH',
  },
  {
    regex: /^(.+?)\s+(?:and|&)\s+(.+?)\s+Take\s+On\s+(?:The\s+)?(?:Yak\s+)?Gauntlet/i,
    type: 'duo_takes_on',
    confidence: 'HIGH',
    multi: true,
  },

  // Names followed by gauntlet context
  {
    regex: /^(?:Our\s+(?:Guy|Intern|New\s+Hire)?)\s*(.+?)\s+(?:Takes|Runs|Does)/i,
    type: 'our_guy',
    confidence: 'HIGH',
  },

  // Specific known patterns from the data
  {
    regex: /^(.+?)\s+(?:Swing[s]?\s+(?:By|Through)|Stop[s]?\s+By)\s+(?:for|to)\s+(?:a\s+)?(?:Run\s+at\s+)?(?:the\s+)?Gauntlet/i,
    type: 'swing_by',
    confidence: 'MEDIUM',
  },
];

/**
 * Titles that are NOT actual runs (compilations, discussions, etc.)
 */
const EXCLUSION_PATTERNS = [
  /^Best\s+of\s+(?:The\s+)?Yak\s+Gauntlet/i, // "Best of The Yak Gauntlet (SO FAR)"
  /Every\s+Gauntlet/i, // "Every Gauntlet From KB's Wild"
  /Gauntlet\s+Goalie/i, // "Oldie Tries His Hand at Being Gauntlet Goalie"
  /Gauntlet\s+Relay/i, // "We Changed the Game with the Gauntlet Relay"
  /Losing\s+Our\s+Gauntlet\s+Goalie/i,
  /Pro\s+Athletes\s+are\s+Scared/i,
  /One\s+of\s+the\s+Worst/i,
  /New\s+Layer\s+to\s+the/i, // KB Adds a New Layer
  /Head\s+to\s+Head/i, // versus matchups, not individual runs
  /New\s+Gauntlet\s+Goalie/i,
  // Specific compilation titles (not runs)
  /^A New Gauntlet Record Has Been Set \|/i,
  /^A New Athlete Yak Gauntlet Record Is Set \|/i,
  /^A Few White Sox Stop By/i, // Compilation
  /Threaten Big Cat's Gauntlet Record \|/i, // Compilation
  /Is Big Cat the Best Gauntlet Athlete/i, // Discussion
  /Cheah Pulls Off The Ultimate Gauntlet Maneuver/i, // Not a run, a maneuver
  /KB Returns \+ Christian Yelich/i, // Compilation with multiple
];

/**
 * Known competitor name cleanups
 */
const NAME_CLEANUPS = {
  'UFC Hall of Famer Clay Guida': 'Clay Guida',
  'White Boy Rick': 'White Boy Rick',
  'White Boy Rick Finally': 'White Boy Rick',
  'Our Guy Joey Avery': 'Joey Avery',
  'Our Guy Matt': 'Matt',
  'Our Intern Wyatt': 'Wyatt',
  'Our New Hire Mike Katic': 'Mike Katic',
  'Chef Donny': 'Chef Donny',
  'Fat Perez': 'Fat Perez',
  'Billy the Pizza Man': 'Billy the Pizza Man',
  'White Sox Pitcher Sean Burke': 'Sean Burke',
  'Big Cat and Wild Berry': ['Big Cat', 'Wild Berry'],
  'Brandon and Cinnamon Roll': ['Brandon', 'Cinnamon Roll'],
  'Kate and Hot Fudge Sundae': ['Kate', 'Hot Fudge Sundae'],
  'Maxine the Corgi': 'Maxine the Corgi',
  'A Random Coworker': null, // Skip - not a specific person
  'A Special Guest': null, // Skip - need to identify
  'Shane Finally': 'Shane Gillis',
  'Jerry': 'Jerry O\'Connell',
};

/**
 * Title-to-competitor mappings for titles that don't follow standard patterns
 * These are direct mappings from full or partial episode titles to competitor names
 */
const TITLE_MAPPINGS = {
  'KATE WITH THE GRANNY SHOT IN THE GAUNTLET': 'Kate',
  'KB Dissed Danny HARD After His Gauntlet Run': 'Danny',
  'Danny Gets ROASTED By KB After His Gauntlet Run': 'Danny',
  'White Sox Pitcher Sean Burke Sets New Gauntlet Record': 'Sean Burke',
  'Sean Burke Sets New Gauntlet Record': 'Sean Burke',
  'Cheah\'s Vampire Gauntlet Run': 'Cheah',
  'Is Ebo Top Contender to Beat Big Cat\'s Gauntlet Record': 'Ebo',
  'Big Cat Almost Broke His Gauntlet Record': 'Big Cat',
  'Nick Almost Broke the Gauntlet Record': 'Nick',
  'Is Steven\'s Poor Gauntlet Time the Reason Why the Knicks Lost': 'Steven Cheah',
  'KB Takes On The @planetfitness Gauntlet With His New Haircut': 'KB',
  'KB Takes On The': 'KB', // Handles @planetfitness stripped version
  'Sam Morril Sets a Comedian Gauntlet Record': 'Sam Morril',
  'Kody Takes on the Gauntlet for the First Time': 'Kody',
  'Gino Takes on the Gauntlet in His Hat': 'Gino',
  'Harry Comes SO Close to Beating the Gauntlet Record': 'Harry',
  'Tate Runs the Gauntlet in a Bunny Costume': 'Tate',
  'Spider Puts Up the Third Best Gauntlet Run of All-Time': 'Spider',
  'Sas STRUGGLES with the Gauntlet': 'Sas',
  'Caleb Pressley DOMINATES The Yak Gauntlet': 'Caleb Pressley',
  'All Business Pete Finally Agreed to Try the Yak Gauntlet': 'All Business Pete',
  'Brandon Goes Full Dainty Mode in the Gauntlet': 'Brandon Walker',
  'Nick Beat the Yak Gauntlet as a Pirate': 'Nick',
  'Miresh Takes on the Yak Gauntlet': 'Miresh',
  'Putting a Standup Comedian Through the Yak Gauntlet': null, // Need to identify
  'Paul Rabil\'s Gauntlet Football Toss': 'Paul Rabil',
  // Additional mappings for "Best of" titles that ARE actual runs (not compilations)
  'Luke Combs Takes Over The Yak and Dominates The Gauntlet': 'Luke Combs',
  'Nick Foles Runs the Gauntlet and Meets The Tunnel': 'Nick Foles',
  'Paul Skenes Takes on the Gauntlet': 'Paul Skenes',
  'Fat Perez Takes on the Gauntlet': 'Fat Perez',
  'Ari Shaffir Takes on the Gauntlet': 'Ari Shaffir',
  'John Summit Takes on The Gauntlet': 'John Summit',
  'Stavvy Delivers on His Big Promise and Runs The Gauntlet': 'Stavvy',
  'Intern Saves Job With Gauntlet Redemption': null, // Need to identify intern
  'Gia Puts Up All-Time Numbers in the Yak Gauntlet': 'Gia',
  'Joey Avery Runs Through the Gauntlet': 'Joey Avery',
  'Dan Soder Braves The Yak Gauntlet': 'Dan Soder',
  'Nick Colletti Takes on The Gauntlet': 'Nick Colletti',
  // Multi-person runs
  'Alex Caruso Stops By for a Run at the Gauntlet': 'Alex Caruso',
  'Jack Gohlke and the Detroit Tigers Swing Through for the Gauntlet': ['Jack Gohlke'],
  'The Orioles Swing By to Take on the Gauntlet': null, // Multiple players - need names
  'Sketch and Ryan Blaney Break Records in The Gauntlet': ['Sketch', 'Ryan Blaney'],
  'Cam Newton and Brandon Marshall Take On The Yak Gauntlet': ['Cam Newton', 'Brandon Marshall'],
  // Pop-Tart runs
  'Big Cat and Wild Berry Take On the Yak Gauntlet': ['Big Cat', 'Wild Berry Pop-Tart'],
  'Brandon and Cinnamon Roll Take On the Yak Gauntlet': ['Brandon Walker', 'Cinnamon Roll Pop-Tart'],
  'Kate and Hot Fudge Sundae Take On The Yak Gauntlet': ['Kate', 'Hot Fudge Sundae Pop-Tart'],
  // Other animals/mascots
  'Maxine the Corgi Takes On the Gauntlet': 'Maxine the Corgi',
  // Additional mappings
  'Our Guy Matt Almost Broke the Gauntlet Record': 'Matt',
  'Chef Donny Dominated His First Gauntlet Run': 'Chef Donny',
  'Chef Donny DOMINATES His First Yak Gauntlet Run': 'Chef Donny',
  'Mintzy Was Confused Running the Gauntlet': 'Mintzy',
  'Steven Cheah': 'Steven Cheah',
  'Is Steven\'s Poor Gauntlet Time': 'Steven Cheah',
};

/**
 * Parse CSV file and return all episodes
 */
async function parseCSV() {
  const csvPath = join(__dirname, '../../src/data/Podcast Episodes Search Results.csv');
  const episodes = [];

  return new Promise((resolve, reject) => {
    createReadStream(csvPath)
      .pipe(
        parse({
          columns: true,
          skip_empty_lines: true,
        })
      )
      .on('data', (row) => {
        episodes.push(row);
      })
      .on('end', () => {
        resolve(episodes);
      })
      .on('error', reject);
  });
}

/**
 * Check if title should be excluded (not an actual run)
 */
function shouldExclude(title) {
  return EXCLUSION_PATTERNS.some((pattern) => pattern.test(title));
}

/**
 * Clean up extracted competitor name
 */
function cleanupName(name) {
  if (!name) return null;

  // Remove common suffixes/prefixes
  let cleaned = name
    .replace(/\s*[@#].*$/, '') // Remove sponsor tags
    .replace(/\s*\|.*$/, '') // Remove pipe separators
    .replace(/\s*Presented\s+by.*$/i, '')
    .replace(/\s*\.+$/, '')
    .replace(/^\s*(?:Our\s+(?:Guy|Intern|New\s+Hire)\s*)/i, '')
    .trim();

  // Check for known cleanups
  if (NAME_CLEANUPS[cleaned] !== undefined) {
    return NAME_CLEANUPS[cleaned];
  }

  // Additional cleanup for common patterns
  cleaned = cleaned
    .replace(/^(?:UFC\s+Hall\s+of\s+Famer\s+)/i, '')
    .replace(/^(?:White\s+Sox\s+Pitcher\s+)/i, '')
    .trim();

  return cleaned || null;
}

/**
 * Extract competitor name(s) from episode title
 */
function extractCompetitorsFromTitle(title) {
  // Check exclusions first
  if (shouldExclude(title)) {
    return null;
  }

  // Clean title for mapping lookup (remove sponsor tags)
  const cleanTitle = title
    .replace(/\s*[.!]?\s*Presented\s+by.*$/i, '')
    .replace(/\s*[@#]\w+.*$/i, '')
    .trim();

  // Check direct title mappings first
  for (const [mappingTitle, competitor] of Object.entries(TITLE_MAPPINGS)) {
    if (cleanTitle.toLowerCase() === mappingTitle.toLowerCase() ||
        cleanTitle.toLowerCase().startsWith(mappingTitle.toLowerCase())) {
      if (competitor === null) {
        return null; // Explicitly skip
      }
      return {
        names: Array.isArray(competitor) ? competitor : [competitor],
        confidence: 'HIGH',
        pattern: 'title_mapping',
        multi: Array.isArray(competitor),
      };
    }
  }

  // Try each regex pattern
  for (const pattern of GAUNTLET_RUN_PATTERNS) {
    const match = title.match(pattern.regex);
    if (match) {
      if (pattern.multi && match[2]) {
        // Multiple competitors
        const name1 = cleanupName(match[1]);
        const name2 = cleanupName(match[2]);
        const names = [name1, name2].filter(Boolean);
        if (names.length > 0) {
          return {
            names,
            confidence: pattern.confidence,
            pattern: pattern.type,
            multi: true,
          };
        }
      } else {
        const name = cleanupName(match[1]);
        // Handle array returns from cleanup (duo names in single pattern)
        if (Array.isArray(name)) {
          return {
            names: name,
            confidence: pattern.confidence,
            pattern: pattern.type,
            multi: true,
          };
        }
        if (name) {
          return {
            names: [name],
            confidence: pattern.confidence,
            pattern: pattern.type,
            multi: false,
          };
        }
      }
    }
  }

  return null;
}

/**
 * Parse date from various formats
 */
function parseDate(dateStr) {
  if (!dateStr) return null;

  // Try parsing as ISO format first
  let date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }

  // Try MM/DD/YYYY format
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    date = new Date(parts[2], parts[0] - 1, parts[1]);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }

  return dateStr;
}

/**
 * Fetch existing leaderboard entries from Airtable
 */
async function fetchExistingEntries() {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Leaderboard`;
  const entries = [];
  let offset = null;

  do {
    const fetchUrl = offset ? `${url}?offset=${offset}` : url;

    const response = await fetch(fetchUrl, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_PAT}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.status}`);
    }

    const data = await response.json();
    entries.push(...data.records);
    offset = data.offset;
  } while (offset);

  return entries;
}

/**
 * Fetch competitors from Airtable
 */
async function fetchCompetitors() {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Competitors`;
  const competitors = [];
  let offset = null;

  do {
    const fetchUrl = offset ? `${url}?offset=${offset}` : url;

    const response = await fetch(fetchUrl, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_PAT}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.status}`);
    }

    const data = await response.json();
    competitors.push(...data.records);
    offset = data.offset;
  } while (offset);

  return competitors;
}

/**
 * Normalize name for comparison
 */
function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Check if a run already exists in the leaderboard
 */
function findExistingRun(competitorName, date, existingEntries, competitors) {
  const normalizedDate = parseDate(date);
  const normalizedSearchName = normalizeName(competitorName);

  for (const entry of existingEntries) {
    const entryDate = entry.fields.Date;

    // Compare dates (allow 1-day variance for timezone issues)
    if (!entryDate) continue;
    const dateDiff = Math.abs(new Date(entryDate) - new Date(normalizedDate));
    if (dateDiff > 86400000 * 2) continue; // More than 2 days apart

    // Get competitor name from linked record
    const competitorIds = entry.fields.Competitor;
    if (!competitorIds || competitorIds.length === 0) continue;

    const competitorRecord = competitors.find((c) => c.id === competitorIds[0]);
    if (!competitorRecord) continue;

    const existingName = normalizeName(competitorRecord.fields.Name || '');

    // Check for name match
    if (
      existingName === normalizedSearchName ||
      existingName.includes(normalizedSearchName) ||
      normalizedSearchName.includes(existingName)
    ) {
      return entry;
    }
  }

  return null;
}

/**
 * Extract time hints from transcript highlights
 */
function extractTimeFromHighlights(highlights) {
  if (!highlights) return null;

  try {
    const parsed = JSON.parse(highlights);
    if (!Array.isArray(parsed.transcript)) return null;

    const timePatterns = [
      /(\d+:\d{2}\.\d{2})/, // 3:42.15
      /(\d+:\d{2}:\d{2})/, // 0:03:42
      /(\d+)\s*minutes?\s*(?:and\s*)?(\d+)\s*seconds?/i,
      /time\s*(?:of|was|is)?\s*(\d+:\d{2})/i,
      /final\s+time[:\s]+(\d+:\d{2})/i,
    ];

    for (const highlight of parsed.transcript) {
      const text = highlight.phrase || highlight.text || '';
      for (const pattern of timePatterns) {
        const match = text.match(pattern);
        if (match) {
          return {
            raw: match[0],
            context: text.substring(0, 150),
            timestamp: highlight.startTime,
          };
        }
      }
    }
  } catch {
    // Invalid JSON
  }

  return null;
}

async function main() {
  console.log('='.repeat(70));
  console.log('FIND MISSING GAUNTLET RUNS (v2 - Comprehensive)');
  console.log('='.repeat(70));
  console.log();

  if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID) {
    console.error('ERROR: Missing Airtable credentials in .env');
    process.exit(1);
  }

  // Step 1: Parse CSV
  console.log('Step 1: Parsing CSV file...');
  const episodes = await parseCSV();
  console.log(`  Found ${episodes.length} total episodes`);
  console.log();

  // Step 2: Identify gauntlet runs using multiple patterns
  console.log('Step 2: Identifying gauntlet runs...');
  const gauntletRuns = [];
  const skippedTitles = [];

  for (const episode of episodes) {
    const title = episode['Episode Title'] || '';

    // Only process titles that mention "gauntlet"
    if (!title.toLowerCase().includes('gauntlet')) {
      continue;
    }

    const extraction = extractCompetitorsFromTitle(title);

    if (extraction) {
      // Create a run entry for each competitor (handles duo runs)
      for (const name of extraction.names) {
        gauntletRuns.push({
          episodeId: episode['Episode Id'],
          showTitle: episode['Show Title'],
          episodeTitle: title,
          competitor: name,
          confidence: extraction.confidence,
          pattern: extraction.pattern,
          date: parseDate(episode['Publish Date']),
          highlights: episode['Highlights'],
          timeHint: extractTimeFromHighlights(episode['Highlights']),
          episodeLink: episode['Episode Link'],
          isDuo: extraction.multi,
        });
      }
    } else {
      skippedTitles.push(title);
    }
  }

  console.log(`  Found ${gauntletRuns.length} gauntlet run entries`);
  console.log(`  Skipped ${skippedTitles.length} titles (excluded or no match)`);
  console.log();

  // Show skipped titles for review
  if (skippedTitles.length > 0) {
    console.log('  Skipped titles (may need manual review):');
    for (const title of skippedTitles.slice(0, 15)) {
      console.log(`    - ${title}`);
    }
    if (skippedTitles.length > 15) {
      console.log(`    ... and ${skippedTitles.length - 15} more`);
    }
    console.log();
  }

  // Step 3: Deduplicate (same competitor + date from YouTube vs Podcast)
  console.log('Step 3: Deduplicating entries...');
  const seenRuns = new Map();
  const deduplicatedRuns = [];

  for (const run of gauntletRuns) {
    const key = `${normalizeName(run.competitor)}_${run.date}`;

    if (!seenRuns.has(key)) {
      seenRuns.set(key, run);
      deduplicatedRuns.push(run);
    } else {
      // Prefer YouTube entries over podcast
      const existing = seenRuns.get(key);
      if (run.showTitle.includes('YouTube') && !existing.showTitle.includes('YouTube')) {
        seenRuns.set(key, run);
        const idx = deduplicatedRuns.findIndex(
          (r) => normalizeName(r.competitor) === normalizeName(run.competitor) && r.date === run.date
        );
        if (idx >= 0) {
          deduplicatedRuns[idx] = run;
        }
      }
    }
  }

  console.log(`  After deduplication: ${deduplicatedRuns.length} unique runs`);
  console.log();

  // Step 4: Fetch existing Airtable data
  console.log('Step 4: Fetching existing Airtable data...');
  const existingEntries = await fetchExistingEntries();
  const competitors = await fetchCompetitors();
  console.log(`  Found ${existingEntries.length} existing leaderboard entries`);
  console.log(`  Found ${competitors.length} competitors`);
  console.log();

  // Step 5: Compare and find missing entries
  console.log('Step 5: Comparing to find missing entries...');
  const missingRuns = [];
  const existingRuns = [];

  for (const run of deduplicatedRuns) {
    const existing = findExistingRun(run.competitor, run.date, existingEntries, competitors);

    if (existing) {
      existingRuns.push({
        ...run,
        existingEntryId: existing.id,
        existingTime: existing.fields.Time,
      });
    } else {
      missingRuns.push(run);
    }
  }

  console.log(`  Already in Airtable: ${existingRuns.length}`);
  console.log(`  Missing from Airtable: ${missingRuns.length}`);
  console.log();

  // Step 6: Output results
  console.log('='.repeat(70));
  console.log('MISSING GAUNTLET RUNS');
  console.log('='.repeat(70));
  console.log();

  // Sort by date (newest first)
  missingRuns.sort((a, b) => new Date(b.date) - new Date(a.date));

  for (let i = 0; i < missingRuns.length; i++) {
    const run = missingRuns[i];
    console.log(`${i + 1}. ${run.competitor}`);
    console.log(`   Date: ${run.date}`);
    console.log(`   Title: ${run.episodeTitle}`);
    console.log(`   Show: ${run.showTitle}`);
    console.log(`   Pattern: ${run.pattern} (${run.confidence})`);
    if (run.isDuo) console.log(`   Note: Part of duo run`);
    if (run.timeHint) {
      console.log(`   Time Hint: ${run.timeHint.raw}`);
      console.log(`   Context: "${run.timeHint.context}..."`);
    }
    if (run.episodeLink) {
      console.log(`   Link: ${run.episodeLink}`);
    }
    console.log();
  }

  // Step 7: Save results to JSON
  const outputPath = join(__dirname, 'missing-runs.json');
  writeFileSync(
    outputPath,
    JSON.stringify(
      {
        generated: new Date().toISOString(),
        totalCsvEpisodes: episodes.length,
        gauntletTitlesFound: gauntletRuns.length,
        afterDeduplication: deduplicatedRuns.length,
        existingInAirtable: existingRuns.length,
        missingFromAirtable: missingRuns.length,
        skippedTitles,
        missingRuns,
        existingRuns: existingRuns.map((r) => ({
          competitor: r.competitor,
          date: r.date,
          existingTime: r.existingTime,
        })),
      },
      null,
      2
    )
  );
  console.log(`Results saved to: ${outputPath}`);

  // Summary
  console.log();
  console.log('='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total CSV episodes scanned: ${episodes.length}`);
  console.log(`Titles mentioning "gauntlet": ${skippedTitles.length + gauntletRuns.length}`);
  console.log(`Gauntlet runs identified: ${gauntletRuns.length}`);
  console.log(`After deduplication: ${deduplicatedRuns.length}`);
  console.log(`Already in Airtable: ${existingRuns.length}`);
  console.log(`MISSING (need to add): ${missingRuns.length}`);
  console.log();
  console.log('Next steps:');
  console.log('1. Review the missing runs list above');
  console.log('2. Look up YouTube URLs and exact times for each');
  console.log('3. Use the add-runs.js script to add them to Airtable');
  console.log('='.repeat(70));
}

main().catch(console.error);
