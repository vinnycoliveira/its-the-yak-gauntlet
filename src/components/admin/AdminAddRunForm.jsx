import { useState, useEffect, useMemo } from 'react'
import { searchQuizzes } from '../../utils/quizSearch'
import { extractYouTubeInfo } from '../../utils/youtubeHelpers'
import {
  fetchCompetitors,
  fetchAsterisks,
  fetchResumeOptions,
  createRun,
  createCompetitor,
  createAsterisk
} from '../../services/airtableAdmin'

export default function AdminAddRunForm() {
  // Form state
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [youtubeInfo, setYoutubeInfo] = useState(null)
  const [competitorSearch, setCompetitorSearch] = useState('')
  const [selectedCompetitor, setSelectedCompetitor] = useState(null)
  const [isNewCompetitor, setIsNewCompetitor] = useState(false)
  const [newCompetitorResume, setNewCompetitorResume] = useState([])
  const [newCompetitorImageUrl, setNewCompetitorImageUrl] = useState('')
  const [time, setTime] = useState('')
  const [date, setDate] = useState('')
  const [quizClue, setQuizClue] = useState('')
  const [quizResults, setQuizResults] = useState([])
  const [selectedQuiz, setSelectedQuiz] = useState(null)
  const [selectedAsterisks, setSelectedAsterisks] = useState([])
  const [newAsteriskFlag, setNewAsteriskFlag] = useState('')
  const [newAsteriskDesc, setNewAsteriskDesc] = useState('')

  // Data state
  const [competitors, setCompetitors] = useState([])
  const [asterisks, setAsterisks] = useState([])
  const [resumeOptions, setResumeOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState(null)

  // Load competitors, asterisks, and resume options on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [comps, asts, resumes] = await Promise.all([
          fetchCompetitors(),
          fetchAsterisks(),
          fetchResumeOptions()
        ])
        setCompetitors(comps)
        setAsterisks(asts)
        setResumeOptions(resumes)
      } catch (err) {
        console.error('Failed to load data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Filter competitors based on search
  const filteredCompetitors = useMemo(() => {
    if (!competitorSearch.trim()) return []
    const search = competitorSearch.toLowerCase()
    return competitors
      .filter(c => c.name.toLowerCase().includes(search))
      .slice(0, 10)
  }, [competitors, competitorSearch])

  // Handle YouTube URL paste
  const handleYoutubeUrlChange = async (url) => {
    setYoutubeUrl(url)
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const info = await extractYouTubeInfo(url)
      if (info) {
        setYoutubeInfo(info)
        if (info.date) setDate(info.date)
      }
    }
  }

  // Handle quiz search
  const handleQuizSearch = () => {
    if (!quizClue.trim()) return
    const results = searchQuizzes(quizClue)
    setQuizResults(results)
    if (results.length === 1) {
      setSelectedQuiz(results[0])
    }
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitResult(null)

    try {
      let competitorId = selectedCompetitor?.id

      // Create new competitor if needed
      if (isNewCompetitor && competitorSearch.trim()) {
        const imageUrl = newCompetitorImageUrl.trim() || null
        const newComp = await createCompetitor(competitorSearch.trim(), newCompetitorResume, imageUrl)
        competitorId = newComp.id
        // Add to local list
        setCompetitors(prev => [...prev, { id: newComp.id, name: competitorSearch.trim() }])
      }

      // Create any new asterisks
      let asteriskIds = selectedAsterisks.map(a => a.id)
      if (newAsteriskFlag.trim()) {
        const newAst = await createAsterisk(newAsteriskFlag.trim(), newAsteriskDesc)
        asteriskIds.push(newAst.id)
        setAsterisks(prev => [...prev, { id: newAst.id, flag: newAsteriskFlag.trim() }])
      }

      // Parse time to seconds
      const timeParts = time.split(':')
      let timeSeconds = 0
      if (timeParts.length === 2) {
        timeSeconds = parseInt(timeParts[0]) * 60 + parseFloat(timeParts[1])
      } else if (timeParts.length === 1) {
        timeSeconds = parseFloat(timeParts[0])
      }

      // Create the run
      await createRun({
        time: timeSeconds,
        date: date,
        youtubeUrl: youtubeUrl,
        quizUrl: selectedQuiz?.url || '',
        competitorId: competitorId,
        asteriskIds: asteriskIds,
      })

      setSubmitResult({ success: true, message: 'Run added successfully!' })

      // Reset form
      setYoutubeUrl('')
      setYoutubeInfo(null)
      setCompetitorSearch('')
      setSelectedCompetitor(null)
      setIsNewCompetitor(false)
      setNewCompetitorResume([])
      setNewCompetitorImageUrl('')
      setTime('')
      setDate('')
      setQuizClue('')
      setQuizResults([])
      setSelectedQuiz(null)
      setSelectedAsterisks([])
      setNewAsteriskFlag('')
      setNewAsteriskDesc('')

    } catch (err) {
      console.error('Submit error:', err)
      setSubmitResult({ success: false, message: `Error: ${err.message}` })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="text-white text-center py-12">
        Loading form data...
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* YouTube URL */}
      <div className="bg-yak-navy-light rounded-xl p-6 border border-gray-700">
        <h2 className="text-lg font-semibold text-yak-gold mb-4">Video Source</h2>
        <div>
          <label className="block text-sm text-gray-300 mb-2">YouTube URL (with timecode)</label>
          <input
            type="url"
            value={youtubeUrl}
            onChange={(e) => handleYoutubeUrlChange(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full px-4 py-3 bg-yak-navy border border-gray-600 rounded-lg text-white focus:border-yak-gold focus:outline-none"
          />
          {youtubeInfo && (
            <div className="mt-3 p-3 bg-yak-navy rounded-lg text-sm text-gray-300">
              <p><strong>Title:</strong> {youtubeInfo.title}</p>
              {youtubeInfo.date && <p><strong>Date:</strong> {youtubeInfo.date}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Competitor */}
      <div className="bg-yak-navy-light rounded-xl p-6 border border-gray-700">
        <h2 className="text-lg font-semibold text-yak-gold mb-4">Competitor</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Search or enter new name</label>
            <input
              type="text"
              value={competitorSearch}
              onChange={(e) => {
                setCompetitorSearch(e.target.value)
                setSelectedCompetitor(null)
                setIsNewCompetitor(false)
              }}
              placeholder="Start typing a name..."
              className="w-full px-4 py-3 bg-yak-navy border border-gray-600 rounded-lg text-white focus:border-yak-gold focus:outline-none"
            />

            {/* Dropdown results - show when typing and not yet selected */}
            {competitorSearch.trim() && !selectedCompetitor && !isNewCompetitor && (
              <div className="mt-2 bg-yak-navy border border-gray-600 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                {filteredCompetitors.map(comp => (
                  <button
                    key={comp.id}
                    type="button"
                    onClick={() => {
                      setSelectedCompetitor(comp)
                      setCompetitorSearch(comp.name)
                      setIsNewCompetitor(false)
                    }}
                    className="w-full px-4 py-2 text-left text-white hover:bg-yak-gold/20 transition-colors"
                  >
                    {comp.name}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setIsNewCompetitor(true)
                    setSelectedCompetitor(null)
                  }}
                  className={`w-full px-4 py-2 text-left text-yak-gold hover:bg-yak-gold/20 transition-colors ${filteredCompetitors.length > 0 ? 'border-t border-gray-600' : ''}`}
                >
                  + Create new: "{competitorSearch}"
                </button>
              </div>
            )}

            {/* Show selected or new */}
            {selectedCompetitor && (
              <p className="mt-2 text-green-400 text-sm">Selected: {selectedCompetitor.name}</p>
            )}
            {isNewCompetitor && (
              <p className="mt-2 text-yak-gold text-sm">Creating new competitor: "{competitorSearch}"</p>
            )}
          </div>

          {/* Resume selection for new competitor */}
          {isNewCompetitor && (
            <div>
              <p className="block text-sm text-gray-300 mb-2">
                Resume <span className="text-red-400">*</span> (select all that apply)
              </p>
              {newCompetitorResume.length === 0 && (
                <p className="text-red-400 text-xs mb-2">At least one resume type is required</p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {resumeOptions.map(opt => (
                  <label
                    key={opt.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-white ${
                      newCompetitorResume.includes(opt.fullName)
                        ? 'bg-yak-gold/30 border-yak-gold'
                        : 'bg-yak-navy border-gray-600'
                    } border`}
                  >
                    <input
                      type="checkbox"
                      checked={newCompetitorResume.includes(opt.fullName)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewCompetitorResume(prev => [...prev, opt.fullName])
                        } else {
                          setNewCompetitorResume(prev => prev.filter(r => r !== opt.fullName))
                        }
                      }}
                      className="sr-only"
                    />
                    <span>{opt.fullName}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Photo URL for new competitor */}
          {isNewCompetitor && (
            <div>
              <p className="block text-sm text-gray-300 mb-2">Photo URL (optional)</p>
              <input
                type="url"
                value={newCompetitorImageUrl}
                onChange={(e) => setNewCompetitorImageUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="w-full px-4 py-3 bg-yak-navy border border-gray-600 rounded-lg text-white focus:border-yak-gold focus:outline-none"
              />
              {newCompetitorImageUrl && (
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={newCompetitorImageUrl}
                    alt="Preview"
                    className="w-12 h-12 rounded-full object-cover border border-gray-600"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                    onLoad={(e) => { e.currentTarget.style.display = 'block' }}
                  />
                  <span className="text-sm text-gray-400">Preview</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Time and Date */}
      <div className="bg-yak-navy-light rounded-xl p-6 border border-gray-700">
        <h2 className="text-lg font-semibold text-yak-gold mb-4">Run Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Time (MM:SS.SS)</label>
            <input
              type="text"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="3:45.67"
              className="w-full px-4 py-3 bg-yak-navy border border-gray-600 rounded-lg text-white focus:border-yak-gold focus:outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-yak-navy border border-gray-600 rounded-lg text-white focus:border-yak-gold focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Quiz Search */}
      <div className="bg-yak-navy-light rounded-xl p-6 border border-gray-700">
        <h2 className="text-lg font-semibold text-yak-gold mb-4">Quiz</h2>
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={quizClue}
              onChange={(e) => setQuizClue(e.target.value)}
              placeholder="Enter a question or answer you remember..."
              className="flex-1 px-4 py-3 bg-yak-navy border border-gray-600 rounded-lg text-white focus:border-yak-gold focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleQuizSearch())}
            />
            <button
              type="button"
              onClick={handleQuizSearch}
              className="px-6 py-3 bg-yak-gold text-yak-navy font-semibold rounded-lg hover:bg-yak-gold-light transition-colors"
            >
              Search
            </button>
          </div>

          {quizResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-400">Found {quizResults.length} match(es):</p>
              {quizResults.slice(0, 5).map((result, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedQuiz(result)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedQuiz?.url === result.url
                      ? 'bg-yak-gold/20 border-yak-gold'
                      : 'bg-yak-navy border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <p className="text-white font-medium">{result.quiz_name}</p>
                  <p className="text-sm text-gray-400">Q: {result.question}</p>
                  <p className="text-xs text-gray-500 truncate">A: {result.answers.join(', ')}</p>
                </button>
              ))}
            </div>
          )}

          {selectedQuiz && (
            <div className="p-3 bg-green-900/30 rounded-lg border border-green-700">
              <p className="text-green-400 text-sm">Selected: {selectedQuiz.quiz_name}</p>
              <p className="text-xs text-gray-400 truncate">{selectedQuiz.url}</p>
            </div>
          )}
        </div>
      </div>

      {/* Asterisks */}
      <div className="bg-yak-navy-light rounded-xl p-6 border border-gray-700">
        <h2 className="text-lg font-semibold text-yak-gold mb-4">Asterisks</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
            {asterisks.length === 0 && (
              <p className="text-gray-400 col-span-3">Loading asterisks...</p>
            )}
            {asterisks.map(ast => (
              <label
                key={ast.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm ${
                  selectedAsterisks.some(a => a.id === ast.id)
                    ? 'bg-yak-gold/30 border-yak-gold'
                    : 'bg-yak-navy border-gray-600'
                } border`}
              >
                <input
                  type="checkbox"
                  checked={selectedAsterisks.some(a => a.id === ast.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedAsterisks(prev => [...prev, ast])
                    } else {
                      setSelectedAsterisks(prev => prev.filter(a => a.id !== ast.id))
                    }
                  }}
                  className="sr-only"
                />
                <span className="text-white">{ast.flag}</span>
              </label>
            ))}
          </div>

          <div className="pt-4 border-t border-gray-700">
            <p className="text-sm text-gray-400 mb-2">Add new asterisk:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={newAsteriskFlag}
                onChange={(e) => setNewAsteriskFlag(e.target.value)}
                placeholder="Label (e.g. Blindfolded)"
                className="px-4 py-2 bg-yak-navy border border-gray-600 rounded-lg text-white focus:border-yak-gold focus:outline-none text-sm"
              />
              <input
                type="text"
                value={newAsteriskDesc}
                onChange={(e) => setNewAsteriskDesc(e.target.value)}
                placeholder="Description"
                className="px-4 py-2 bg-yak-navy border border-gray-600 rounded-lg text-white focus:border-yak-gold focus:outline-none text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={
          submitting ||
          !time ||
          (!selectedCompetitor && !isNewCompetitor) ||
          (isNewCompetitor && newCompetitorResume.length === 0)
        }
        className="w-full py-4 bg-yak-gold text-yak-navy font-bold text-lg rounded-xl hover:bg-yak-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Adding Run...' : 'Add Run to Leaderboard'}
      </button>

      {/* Result message */}
      {submitResult && (
        <div className={`p-4 rounded-xl text-center ${
          submitResult.success
            ? 'bg-green-900/30 border border-green-700 text-green-400'
            : 'bg-red-900/30 border border-red-700 text-red-400'
        }`}>
          {submitResult.message}
        </div>
      )}
    </form>
  )
}
