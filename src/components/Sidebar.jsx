export default function Sidebar({
  categories,
  selectedCategories,
  setSelectedCategories,
  asterisksList,
  selectedAsterisks,
  setSelectedAsterisks,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  mobileMenuOpen,
  onClose,
}) {
  const handleCategoryToggle = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    )
  }

  const handleAsteriskToggle = (asterisk) => {
    setSelectedAsterisks((prev) =>
      prev.includes(asterisk)
        ? prev.filter((a) => a !== asterisk)
        : [...prev, asterisk]
    )
  }

  const clearFilters = () => {
    setSelectedCategories([])
    setSelectedAsterisks([])
    setSearchQuery('')
  }

  const hasActiveFilters = selectedCategories.length > 0 || selectedAsterisks.length > 0 || searchQuery

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside className={`sidebar ${mobileMenuOpen ? 'sidebar-open' : ''}`}>
      {/* Header / Branding */}
      <div className="sidebar-header">
        <h1 className="text-2xl font-display font-bold text-yak-gold tracking-wide">
          THE YAK GAUNTLET
        </h1>
        <p className="mt-1 text-white/70 text-sm">
          Fan-created Leaderboard & Run Archive
        </p>
      </div>

      {/* Search */}
      <div className="sidebar-section">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 pr-8 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-yak-gold text-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="search-clear-btn absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-white/70 hover:text-white transition-colors"
              aria-label="Clear search"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                <path d="M1 1L9 9M9 1L1 9" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Sort */}
      <div className="sidebar-section">
        <span className="text-white/70 text-xs uppercase tracking-wider mb-2 block">Sort By</span>
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-yak-gold text-sm"
          >
            <option value="rank">Ranking</option>
            <option value="name">Alphabetical</option>
          </select>
          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors text-sm"
            title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Category Filters */}
      <div className="sidebar-section">
        <span className="text-white/70 text-xs uppercase tracking-wider mb-2 block">Resume</span>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => handleCategoryToggle(category)}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                selectedCategories.includes(category)
                  ? 'bg-yak-gold text-yak-navy font-semibold'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Asterisks Filters */}
      <div className="sidebar-section">
        <span className="text-white/70 text-xs uppercase tracking-wider mb-2 block">Asterisks</span>
        <div className="flex flex-wrap gap-2">
          {asterisksList.map((asterisk) => (
            <button
              key={asterisk}
              type="button"
              onClick={() => handleAsteriskToggle(asterisk)}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                selectedAsterisks.includes(asterisk)
                  ? 'bg-yak-gold text-yak-navy font-semibold'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {asterisk}
            </button>
          ))}
        </div>
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <div className="sidebar-section">
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm text-yak-gold hover:text-yak-gold/80 underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </aside>
    </>
  )
}
