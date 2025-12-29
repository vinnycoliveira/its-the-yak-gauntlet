import { useState, useMemo } from 'react'
import Sidebar from './components/Sidebar'
import CardGrid from './components/CardGrid'
import ScrollToTopFab from './components/ScrollToTopFab'
import { useGauntletData } from './hooks/useGauntletData'
import { filterRuns, sortRuns } from './utils/dataHelpers'

function App() {
  const { runs, categories, asterisksList, loading } = useGauntletData()

  const [sortBy, setSortBy] = useState('rank')
  const [sortOrder, setSortOrder] = useState('asc')
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedAsterisks, setSelectedAsterisks] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

  const filteredAndSortedRuns = useMemo(() => {
    let result = filterRuns(runs, {
      categories: selectedCategories,
      asterisks: selectedAsterisks,
      search: searchQuery,
    })
    return sortRuns(result, sortBy, sortOrder)
  }, [runs, selectedCategories, selectedAsterisks, searchQuery, sortBy, sortOrder])

  if (loading) {
    return (
      <div className="min-h-screen bg-yak-navy flex items-center justify-center">
        <div className="text-white text-xl">Loading the Yak Gauntlet Leaderboard...</div>
      </div>
    )
  }

  return (
    <div className="app-layout">
      <Sidebar
        categories={categories}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        asterisksList={asterisksList}
        selectedAsterisks={selectedAsterisks}
        setSelectedAsterisks={setSelectedAsterisks}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
      />
      <main className="main-content">
        <CardGrid runs={filteredAndSortedRuns} />
      </main>
      <ScrollToTopFab />
    </div>
  )
}

export default App
