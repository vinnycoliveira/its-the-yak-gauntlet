import { useState, useEffect } from 'react'
import { fetchAllData } from '../services/airtable'
import {
  parseTime,
  getUniqueCategories,
  getUniqueAsterisks,
} from '../utils/dataHelpers'

/**
 * Simple hash function for deterministic random selection
 */
function hashSeed(seed) {
  let hash = 0
  const str = String(seed)
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

/**
 * Select a random photo URL from array using deterministic seed
 */
function selectRandomPhoto(photoUrls, seed) {
  if (!photoUrls || photoUrls.length === 0) return null
  if (photoUrls.length === 1) return photoUrls[0]
  const index = hashSeed(seed) % photoUrls.length
  return photoUrls[index]
}

export function useGauntletData() {
  const [data, setData] = useState({
    runs: [],
    competitors: {},
    asterisks: {},
    categories: [],
    asterisksList: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    async function loadData() {
      try {
        const { leaderboard, competitors, asterisks } = await fetchAllData()

        // Helper to resolve asterisk record IDs to flag values
        const resolveAsterisks = (asterisksField) => {
          if (!asterisksField) return []
          // If it's an array of record IDs, resolve them to flag values
          if (Array.isArray(asterisksField)) {
            return asterisksField
              .map((id) => asterisks.byId[id]?.flag)
              .filter(Boolean)
          }
          // If it's already a string (comma-separated flags), return as-is
          if (typeof asterisksField === 'string') {
            return asterisksField
          }
          return []
        }

        // Transform leaderboard runs with enriched data
        const enrichedRuns = leaderboard.map((run) => {
          // Resolve all linked competitor records (supports team runs)
          const teamMembers = (run.competitorRecordIds || [])
            .map((id) => competitors.byId[id])
            .filter(Boolean)

          const isTeamRun = teamMembers.length > 1

          // For single competitor, use existing logic for backward compatibility
          let primaryCompetitor = teamMembers[0]
          if (!primaryCompetitor) {
            primaryCompetitor = competitors.byName[run.competitor] || {}
          }

          // Use competitor name from lookup, or from the competitor record
          const competitorName = run.competitor || primaryCompetitor.name || ''

          // Resolve asterisk record IDs to actual flag values
          const resolvedAsterisks = resolveAsterisks(run.asterisks)

          return {
            id: run.id,
            competitor: competitorName,
            fullName: primaryCompetitor.fullName || competitorName,
            time: run.time,
            timeSeconds: parseTime(run.time),
            date: run.date,
            rank: parseInt(run.rank, 10) || 999,
            resume: run.resume,
            asterisks: resolvedAsterisks,
            gapToWR: run.gapToWR,
            gapToNext: run.gapToNext,
            worldRecordDuration: run.worldRecordDuration,
            youtubeUrl: run.youtubeUrl,
            triviaUrl: run.triviaUrl,
            photoUrl: selectRandomPhoto(primaryCompetitor.photoUrls, run.id),
            numRuns: primaryCompetitor.numRuns || 1,
            // Team run support
            isTeamRun,
            teamMembers: isTeamRun
              ? teamMembers.map((member, index) => ({
                  ...member,
                  // Select random photo for each team member using unique seed
                  photoUrl: selectRandomPhoto(member.photoUrls, `${run.id}-${index}`),
                }))
              : null,
          }
        })

        // Extract unique categories and asterisks
        const categories = getUniqueCategories(enrichedRuns)
        const asterisksList = getUniqueAsterisks(enrichedRuns)

        setData({
          runs: enrichedRuns,
          competitors: competitors.byName,
          asterisks: asterisks.byFlag,
          categories,
          asterisksList,
          loading: false,
          error: null,
        })
      } catch (error) {
        console.error('Failed to fetch data from Airtable:', error)
        setData((prev) => ({
          ...prev,
          loading: false,
          error: error.message,
        }))
      }
    }

    loadData()
  }, [])

  return data
}
