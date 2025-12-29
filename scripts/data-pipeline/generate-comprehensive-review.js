/**
 * Generate Comprehensive Missing Runs Review
 *
 * Merges title-based analysis with transcript-based analysis
 * to create one comprehensive review file.
 *
 * Usage: node generate-comprehensive-review.js
 */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createReadStream, writeFileSync, readFileSync } from 'node:fs';
import { parse } from 'csv-parse';
import dotenv from 'dotenv';

// Workaround for corporate SSL certificate issues
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

const AIRTABLE_PAT = process.env.VITE_AIRTABLE_PAT;
const AIRTABLE_BASE_ID = process.env.VITE_AIRTABLE_BASE_ID;

/**
 * Phrases that indicate an actual gauntlet run is happening
 */
const RUN_INDICATORS = [
  /let'?s\s+do\s+(?:the\s+)?(?:body\s+armor\s+)?gauntlet/i,
  /do\s+(?:the\s+)?(?:body\s+armor\s+)?gauntlet\s+(?:then|now|today)/i,
  /gonna\s+do\s+(?:the\s+)?(?:a\s+)?gauntlet/i,
  /owe\s+a?\s*(?:body\s+(?:gar\s+)?armor\s+)?gauntlet/i,
  /get\s+up\s+there.*gauntlet/i,
  /gauntlet\s+is\s+brought\s+to\s+you/i,
];

/**
 * Parse CSV file
 */
async function parseCSV() {
  const csvPath = join(__dirname, '../../src/data/Podcast Episodes Search Results.csv');
  const episodes = [];

  return new Promise((resolve, reject) => {
    createReadStream(csvPath)
      .pipe(parse({ columns: true, skip_empty_lines: true }))
      .on('data', (row) => episodes.push(row))
      .on('end', () => resolve(episodes))
      .on('error', reject);
  });
}

/**
 * Fetch existing Airtable data
 */
async function fetchAirtableData() {
  const leaderboardUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Leaderboard`;
  const competitorsUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Competitors`;

  const fetchAll = async (url) => {
    const records = [];
    let offset = null;
    do {
      const fetchUrl = offset ? `${url}?offset=${offset}` : url;
      const response = await fetch(fetchUrl, {
        headers: { Authorization: `Bearer ${AIRTABLE_PAT}` },
      });
      const data = await response.json();
      records.push(...data.records);
      offset = data.offset;
    } while (offset);
    return records;
  };

  const [leaderboard, competitors] = await Promise.all([
    fetchAll(leaderboardUrl),
    fetchAll(competitorsUrl),
  ]);

  return { leaderboard, competitors };
}

/**
 * Check if episode transcript indicates an actual run
 */
function analyzeTranscript(highlights) {
  if (!highlights) return { isRun: false, evidence: [] };

  try {
    const parsed = JSON.parse(highlights);
    const transcripts = parsed.transcript || [];
    const evidence = [];

    for (const t of transcripts) {
      const phrase = t.phrase || t.text || '';
      for (const pattern of RUN_INDICATORS) {
        if (pattern.test(phrase)) {
          evidence.push({
            phrase: phrase.replace(/<\/?em>/g, ''),
            time: t.startTime || t.ts,
          });
          break;
        }
      }
    }

    return {
      isRun: evidence.length > 0,
      evidence,
    };
  } catch {
    return { isRun: false, evidence: [] };
  }
}

/**
 * Parse date
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  return dateStr;
}

/**
 * Normalize name for comparison
 */
function normalizeName(name) {
  return (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Check if run exists in Airtable
 */
function findExistingRun(date, competitorName, leaderboard, competitors) {
  const normalizedDate = parseDate(date);
  const normalizedName = normalizeName(competitorName);

  for (const entry of leaderboard) {
    const entryDate = entry.fields.Date;
    if (!entryDate) continue;

    const dateDiff = Math.abs(new Date(entryDate) - new Date(normalizedDate));
    if (dateDiff > 86400000 * 2) continue;

    const competitorIds = entry.fields.Competitor;
    if (!competitorIds || competitorIds.length === 0) continue;

    const competitorRecord = competitors.find((c) => c.id === competitorIds[0]);
    if (!competitorRecord) continue;

    const existingName = normalizeName(competitorRecord.fields.Name || '');
    if (existingName === normalizedName ||
        existingName.includes(normalizedName) ||
        normalizedName.includes(existingName)) {
      return {
        exists: true,
        time: entry.fields.Time,
        competitorName: competitorRecord.fields.Name,
      };
    }
  }

  return { exists: false };
}

async function main() {
  console.log('='.repeat(70));
  console.log('GENERATING COMPREHENSIVE MISSING RUNS REVIEW');
  console.log('='.repeat(70));
  console.log();

  // Load existing analysis
  console.log('Loading existing analysis files...');
  const missingRunsPath = join(__dirname, 'missing-runs.json');
  const transcriptAnalysisPath = join(__dirname, 'transcript-analysis.json');

  let titleBasedRuns = [];
  let transcriptAnalysis = null;

  try {
    const missingData = JSON.parse(readFileSync(missingRunsPath, 'utf-8'));
    titleBasedRuns = missingData.missingRuns || [];
    console.log(`  Title-based missing runs: ${titleBasedRuns.length}`);
  } catch {
    console.log('  Warning: missing-runs.json not found, will regenerate');
  }

  try {
    transcriptAnalysis = JSON.parse(readFileSync(transcriptAnalysisPath, 'utf-8'));
    console.log(`  Transcript analysis loaded`);
  } catch {
    console.log('  Warning: transcript-analysis.json not found');
  }

  // Parse CSV for transcript-only episodes
  console.log('\nParsing CSV for transcript-only runs...');
  const episodes = await parseCSV();

  // Find episodes with run indicators in transcript but NOT in title
  const transcriptOnlyRuns = [];
  for (const episode of episodes) {
    const title = episode['Episode Title'] || '';
    if (title.toLowerCase().includes('gauntlet')) continue; // Skip title-based

    const analysis = analyzeTranscript(episode['Highlights']);
    if (analysis.isRun) {
      transcriptOnlyRuns.push({
        episodeId: episode['Episode Id'],
        title,
        date: parseDate(episode['Publish Date']),
        showTitle: episode['Show Title'],
        source: 'TRANSCRIPT',
        confidence: 'MEDIUM',
        competitor: null, // Unknown - needs manual identification
        evidence: analysis.evidence,
        episodeLink: episode['Episode Link'],
        notes: 'Competitor needs to be identified from video/transcript',
      });
    }
  }

  // Deduplicate transcript-only runs (YouTube vs Podcast dupes)
  const seen = new Set();
  const uniqueTranscriptRuns = [];
  for (const run of transcriptOnlyRuns) {
    const key = `${run.date}_${run.title.substring(0, 30)}`;
    if (!seen.has(key) && run.showTitle.includes('YouTube')) {
      seen.add(key);
      uniqueTranscriptRuns.push(run);
    }
  }

  console.log(`  Found ${uniqueTranscriptRuns.length} transcript-only potential runs`);

  // Fetch Airtable data
  console.log('\nFetching Airtable data...');
  const { leaderboard, competitors } = await fetchAirtableData();
  console.log(`  Leaderboard entries: ${leaderboard.length}`);
  console.log(`  Competitors: ${competitors.length}`);

  // Filter transcript runs to only missing ones
  const missingTranscriptRuns = [];
  for (const run of uniqueTranscriptRuns) {
    // Since we don't know the competitor, we can't check if it exists
    // These all need manual review
    missingTranscriptRuns.push(run);
  }

  // Combine all missing runs
  const allMissingRuns = [
    ...titleBasedRuns.map((r) => ({
      ...r,
      source: 'TITLE',
      notes: r.isDuo ? 'Part of duo run' : null,
    })),
    ...missingTranscriptRuns,
  ];

  // Sort by date (newest first)
  allMissingRuns.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Generate review output
  console.log('\n' + '='.repeat(70));
  console.log('COMPREHENSIVE MISSING RUNS LIST');
  console.log('='.repeat(70));
  console.log();

  console.log('SECTION A: TITLE-BASED RUNS (High Confidence)');
  console.log('-'.repeat(70));
  const titleRuns = allMissingRuns.filter((r) => r.source === 'TITLE');
  for (let i = 0; i < titleRuns.length; i++) {
    const run = titleRuns[i];
    console.log(`${i + 1}. ${run.competitor || 'UNKNOWN'}`);
    console.log(`   Date: ${run.date}`);
    console.log(`   Title: ${run.episodeTitle || run.title}`);
    if (run.notes) console.log(`   Notes: ${run.notes}`);
    console.log();
  }

  console.log('\nSECTION B: TRANSCRIPT-BASED RUNS (Need Manual Verification)');
  console.log('-'.repeat(70));
  const transcriptRuns = allMissingRuns.filter((r) => r.source === 'TRANSCRIPT');
  for (let i = 0; i < transcriptRuns.length; i++) {
    const run = transcriptRuns[i];
    console.log(`${i + 1}. UNKNOWN COMPETITOR`);
    console.log(`   Date: ${run.date}`);
    console.log(`   Title: ${run.title}`);
    console.log(`   Evidence: "${run.evidence[0]?.phrase.substring(0, 80)}..."`);
    console.log(`   Link: ${run.episodeLink}`);
    console.log(`   Action: Watch video to identify competitor and time`);
    console.log();
  }

  // Save comprehensive JSON
  const outputPath = join(__dirname, 'comprehensive-missing-runs.json');
  writeFileSync(outputPath, JSON.stringify({
    generated: new Date().toISOString(),
    summary: {
      titleBasedRuns: titleRuns.length,
      transcriptBasedRuns: transcriptRuns.length,
      totalMissing: allMissingRuns.length,
    },
    titleBasedRuns: titleRuns,
    transcriptBasedRuns: transcriptRuns,
    allRuns: allMissingRuns,
  }, null, 2));

  // Save CSV for easy review
  const csvOutput = [
    'Source,Date,Competitor,Title,Confidence,Notes,Episode Link',
    ...allMissingRuns.map((r) => [
      r.source,
      r.date,
      `"${(r.competitor || 'UNKNOWN').replace(/"/g, '""')}"`,
      `"${(r.episodeTitle || r.title || '').replace(/"/g, '""')}"`,
      r.confidence,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
      r.episodeLink || '',
    ].join(',')),
  ].join('\n');

  const csvPath = join(__dirname, 'missing-runs-review.csv');
  writeFileSync(csvPath, csvOutput);

  console.log('='.repeat(70));
  console.log('OUTPUT FILES');
  console.log('='.repeat(70));
  console.log(`JSON: ${outputPath}`);
  console.log(`CSV:  ${csvPath}`);
  console.log();
  console.log('SUMMARY');
  console.log('-'.repeat(70));
  console.log(`Title-based runs (HIGH confidence): ${titleRuns.length}`);
  console.log(`Transcript-based runs (need verification): ${transcriptRuns.length}`);
  console.log(`TOTAL MISSING: ${allMissingRuns.length}`);
  console.log();
  console.log('NEXT STEPS:');
  console.log('1. Open missing-runs-review.csv in a spreadsheet');
  console.log('2. For each TITLE run: Look up YouTube URL and time');
  console.log('3. For each TRANSCRIPT run: Watch video to identify competitor');
  console.log('4. Fill in missing data, then use add-runs.js to import');
  console.log('='.repeat(70));
}

main().catch(console.error);
