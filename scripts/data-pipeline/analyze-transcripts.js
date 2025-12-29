/**
 * Analyze ALL CSV episodes for potential gauntlet runs
 *
 * This script looks at BOTH title and transcript mentions to find
 * episodes where an actual gauntlet run occurred, not just discussions.
 *
 * Usage: node analyze-transcripts.js
 */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createReadStream, writeFileSync } from 'node:fs';
import { parse } from 'csv-parse';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

/**
 * Phrases that indicate an actual gauntlet run is happening/happened
 * Note: Transcripts have format like "(1h 18m 27s): Let's do Body Armor gauntlet then"
 */
const RUN_INDICATORS = [
  // Starting a run - common phrases seen in transcripts
  /let'?s\s+do\s+(?:the\s+)?(?:body\s+armor\s+)?gauntlet/i,
  /do\s+(?:the\s+)?(?:body\s+armor\s+)?gauntlet\s+(?:then|now|today)/i,
  /gonna\s+do\s+(?:the\s+)?(?:a\s+)?gauntlet/i,
  /going\s+to\s+do\s+(?:the\s+)?gauntlet/i,
  /time\s+(?:for|to)\s+(?:the\s+)?gauntlet/i,
  /owe\s+a?\s*(?:body\s+(?:gar\s+)?armor\s+)?gauntlet/i,
  /get\s+up\s+there.*gauntlet/i,

  // During a run
  /run(?:ning)?\s+the\s+gauntlet/i,
  /take(?:s)?\s+on\s+the\s+gauntlet/i,
  /doing\s+the\s+gauntlet/i,
  /did\s+the\s+gauntlet/i,
  /gauntlet\s+is\s+brought\s+to\s+you/i,

  // After a run - time announcements
  /final\s+time/i,
  /gauntlet\s+time/i,
  /time\s+(?:is|was|of)\s+\d/i,
  /\d+:\d{2}\.\d{2}/,  // Time format like 3:42.15
  /\d+\s+minutes?\s+(?:and\s+)?\d+\s+seconds?/i,

  // Specific gauntlet activities
  /hockey\s+(?:shot|puck)/i,
  /soccer\s+kick/i,
  /basketball/i,
  /football\s+(?:throw|toss)/i,
  /putt(?:ing)?/i,
  /cornhole/i,
  /lacrosse/i,
];

/**
 * Phrases that suggest discussion ABOUT gauntlet, not an actual run
 */
const DISCUSSION_INDICATORS = [
  /remember\s+(?:when|the)/i,
  /that\s+time\s+(?:when|you)/i,
  /best\s+gauntlet/i,
  /worst\s+gauntlet/i,
  /gauntlet\s+record/i,  // Could be either
  /beat\s+(?:the|my|your|his|her)\s+(?:gauntlet\s+)?record/i,
];

/**
 * Parse CSV and analyze all episodes
 */
async function parseAndAnalyze() {
  const csvPath = join(__dirname, '../../src/data/Podcast Episodes Search Results.csv');
  const episodes = [];

  return new Promise((resolve, reject) => {
    createReadStream(csvPath)
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        relax_quotes: true,
        relax_column_count: true,
      }))
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
 * Analyze episode for potential gauntlet run
 */
function analyzeEpisode(episode) {
  const title = episode['Episode Title'] || '';
  const highlightsRaw = episode['Highlights'] || '';
  const date = episode['Publish Date'] || '';
  const episodeId = episode['Episode Id'] || '';
  const showTitle = episode['Show Title'] || '';

  // Check if title mentions gauntlet
  const titleHasGauntlet = title.toLowerCase().includes('gauntlet');

  // Parse highlights JSON
  let transcriptSnippets = [];
  let titleMatches = [];

  try {
    const highlights = JSON.parse(highlightsRaw);
    if (highlights.transcript && Array.isArray(highlights.transcript)) {
      transcriptSnippets = highlights.transcript;
    }
    if (highlights.title && Array.isArray(highlights.title)) {
      titleMatches = highlights.title;
    }
  } catch (e) {
    // JSON parse failed
  }

  // Analyze transcript snippets for run indicators
  let runScore = 0;
  let discussionScore = 0;
  const runEvidence = [];
  const discussionEvidence = [];

  for (const snippet of transcriptSnippets) {
    const phrase = snippet.phrase || snippet.text || '';
    const startTime = snippet.startTime || snippet.ts || 0;

    // Check for run indicators
    for (const pattern of RUN_INDICATORS) {
      if (pattern.test(phrase)) {
        runScore++;
        runEvidence.push({
          phrase: phrase.replace(/<\/?em>/g, ''),
          time: startTime,
          pattern: pattern.toString(),
        });
        break;
      }
    }

    // Check for discussion indicators
    for (const pattern of DISCUSSION_INDICATORS) {
      if (pattern.test(phrase)) {
        discussionScore++;
        discussionEvidence.push({
          phrase: phrase.replace(/<\/?em>/g, ''),
          time: startTime,
        });
        break;
      }
    }
  }

  // Determine if this is likely an actual run
  const isLikelyRun = runScore > 0 || titleHasGauntlet;
  const confidence = runScore >= 3 ? 'HIGH' : runScore >= 1 ? 'MEDIUM' : titleHasGauntlet ? 'TITLE_ONLY' : 'LOW';

  return {
    episodeId,
    title,
    date,
    showTitle,
    titleHasGauntlet,
    transcriptMentions: transcriptSnippets.length,
    runScore,
    discussionScore,
    confidence,
    isLikelyRun,
    runEvidence: runEvidence.slice(0, 5), // Keep top 5
    discussionEvidence: discussionEvidence.slice(0, 3),
  };
}

async function main() {
  console.log('='.repeat(70));
  console.log('COMPREHENSIVE GAUNTLET EPISODE ANALYSIS');
  console.log('='.repeat(70));
  console.log();

  // Parse CSV
  console.log('Parsing CSV...');
  const episodes = await parseAndAnalyze();
  console.log(`Total episodes: ${episodes.length}`);
  console.log();

  // Analyze all episodes
  console.log('Analyzing episodes...');
  const results = episodes.map(analyzeEpisode);

  // Categorize results
  const withTitleGauntlet = results.filter(r => r.titleHasGauntlet);
  const transcriptOnly = results.filter(r => !r.titleHasGauntlet && r.transcriptMentions > 0);
  const likelyRuns = results.filter(r => r.isLikelyRun);
  const highConfidence = results.filter(r => r.confidence === 'HIGH');
  const mediumConfidence = results.filter(r => r.confidence === 'MEDIUM');

  console.log();
  console.log('CATEGORIZATION:');
  console.log(`  Episodes with "gauntlet" in title: ${withTitleGauntlet.length}`);
  console.log(`  Episodes with gauntlet in transcript only: ${transcriptOnly.length}`);
  console.log(`  Likely actual runs (any evidence): ${likelyRuns.length}`);
  console.log(`  HIGH confidence runs (3+ indicators): ${highConfidence.length}`);
  console.log(`  MEDIUM confidence runs (1-2 indicators): ${mediumConfidence.length}`);
  console.log();

  // Show high-confidence transcript-only runs
  const transcriptOnlyRuns = results.filter(r =>
    !r.titleHasGauntlet &&
    r.runScore >= 2 &&
    r.showTitle.includes('YouTube')
  );

  console.log('='.repeat(70));
  console.log('POTENTIAL RUNS FROM TRANSCRIPT (not in title)');
  console.log('='.repeat(70));
  console.log();

  // Sort by run score
  transcriptOnlyRuns.sort((a, b) => b.runScore - a.runScore);

  for (const run of transcriptOnlyRuns.slice(0, 30)) {
    console.log(`${run.date} | Score: ${run.runScore}`);
    console.log(`  Title: ${run.title}`);
    console.log(`  Evidence:`);
    for (const ev of run.runEvidence.slice(0, 2)) {
      const timestamp = formatTimestamp(ev.time);
      console.log(`    [${timestamp}] ${ev.phrase.substring(0, 80)}...`);
    }
    console.log();
  }

  // Save full results
  const outputPath = join(__dirname, 'transcript-analysis.json');
  writeFileSync(outputPath, JSON.stringify({
    generated: new Date().toISOString(),
    summary: {
      totalEpisodes: episodes.length,
      titleGauntlet: withTitleGauntlet.length,
      transcriptOnly: transcriptOnly.length,
      likelyRuns: likelyRuns.length,
      highConfidence: highConfidence.length,
      mediumConfidence: mediumConfidence.length,
    },
    transcriptOnlyRuns: transcriptOnlyRuns,
    allAnalyzed: results.filter(r => r.runScore > 0 || r.titleHasGauntlet),
  }, null, 2));

  console.log(`Full analysis saved to: ${outputPath}`);

  console.log();
  console.log('='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));
  console.log(`Found ${transcriptOnlyRuns.length} potential runs from transcript analysis`);
  console.log('(These are episodes where gauntlet run happened but title doesn\'t mention it)');
  console.log();
  console.log('Next: Review these episodes and cross-reference with existing Airtable data');
}

function formatTimestamp(seconds) {
  if (!seconds) return '??:??';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

main().catch(console.error);
