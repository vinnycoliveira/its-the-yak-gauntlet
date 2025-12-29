# It's The Yak Gauntlet

An interactive leaderboard for speedrun gauntlet attempts, featuring collectible trading card-style displays with flip animations, PSA grading cases for top performers, and dynamic color theming.

## Features

- **Trading Card UI**: Each run is displayed as a collectible trading card with:
  - Dynamic color palettes extracted from competitor photos
  - Flip animations revealing detailed stats on the back
  - Position stickers, asterisk badges, and resume indicators
  - Multiple label styles (ribbon, parallelogram, hotdog)

- **PSA Graded Cases**: Top 10 runs are displayed in premium PSA-style grading cases with:
  - Holographic effects and realistic case styling
  - Deterministic barcode generation
  - Tilt/shine effects on hover

- **Filtering & Sorting**:
  - Filter by category and asterisk flags
  - Search by competitor name
  - Sort by rank, time, date, or name

- **Responsive Design**: Works across desktop and mobile devices

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Airtable** - Backend data storage
- **React Router** - Client-side routing
- **ColorThief** - Dynamic color extraction from images

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Airtable account with configured base

### Installation

```bash
# Clone the repository
git clone https://github.com/vinnycoliveira/its-the-yak-gauntlet.git
cd its-the-yak-gauntlet

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### Environment Variables

Create a `.env` file with your Airtable credentials:

```env
VITE_AIRTABLE_PAT=your_airtable_personal_access_token
VITE_AIRTABLE_BASE_ID=your_airtable_base_id
```

### Development

```bash
# Start dev server
npm run dev
```

The app will be available at `http://localhost:5173`

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── admin/           # Admin panel components
│   ├── labels/          # Card label variants
│   ├── stickers/        # Card sticker components
│   ├── CardBackButtons.jsx
│   ├── CardGrid.jsx
│   ├── GauntletCard.jsx
│   ├── PSAGradeCase.jsx
│   ├── ScrollToTopFab.jsx
│   └── Sidebar.jsx
├── hooks/
│   ├── useGauntletData.js
│   └── useImageColors.js
├── services/
│   ├── airtable.js      # Airtable API client
│   └── airtableAdmin.js # Admin write operations
├── styles/
│   └── cards.css        # Card-specific styles
├── utils/
│   ├── cardVariants.js  # Card theming logic
│   ├── colorUtils.js    # Color manipulation
│   ├── dataHelpers.js   # Data filtering/sorting
│   └── stickerRandomizer.js
├── App.jsx
└── main.jsx
```

## License

Private project - All rights reserved
