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

        {/* Social Links */}
        <div className="flex items-center justify-center gap-2 mt-3">
          {/* Barstool */}
          <a
            href="https://barstoolsports.com/shows/148/the-yak"
            target="_blank"
            rel="noopener noreferrer"
            className="social-icon-btn"
            aria-label="Barstool Sports"
          >
            <img src="/barstool-sports-logomark.svg" alt="" className="w-5 h-5" />
          </a>

          {/* YouTube */}
          <a
            href="https://www.youtube.com/@BarstoolYak"
            target="_blank"
            rel="noopener noreferrer"
            className="social-icon-btn"
            aria-label="YouTube"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </a>

          {/* Twitter/X */}
          <a
            href="https://twitter.com/BarstoolYak"
            target="_blank"
            rel="noopener noreferrer"
            className="social-icon-btn"
            aria-label="Twitter"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>

          {/* Instagram */}
          <a
            href="https://instagram.com/barstoolyak"
            target="_blank"
            rel="noopener noreferrer"
            className="social-icon-btn"
            aria-label="Instagram"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
          </a>

          {/* Facebook */}
          <a
            href="https://facebook.com/barstoolyak"
            target="_blank"
            rel="noopener noreferrer"
            className="social-icon-btn"
            aria-label="Facebook"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>

          {/* TikTok */}
          <a
            href="https://tiktok.com/@barstoolyak"
            target="_blank"
            rel="noopener noreferrer"
            className="social-icon-btn"
            aria-label="TikTok"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
            </svg>
          </a>
        </div>
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
