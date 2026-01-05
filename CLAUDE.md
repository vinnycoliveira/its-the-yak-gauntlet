# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

It's The Yak Gauntlet - An interactive leaderboard for speedrun gauntlet attempts with collectible trading card displays, PSA grading cases, and dynamic color theming. Data is sourced from Airtable.

## Development Commands

```bash
npm run dev      # Start dev server on localhost:5173
npm run build    # Build for production (outputs to dist/)
npm run preview  # Preview production build locally
```

No test or lint scripts are configured.

## Tech Stack

- React 18 with Vite
- Tailwind CSS for styling
- React Router DOM for client-side routing
- Airtable as the data backend
- ColorThief for dominant color extraction from images
- Deployed on Vercel

## Architecture

### Data Flow
```
Airtable API → src/services/airtable.js → src/hooks/useGauntletData.js → Component State
```

Airtable tables: `Leaderboard` (speedrun records), `Competitors` (profiles with photos), `Asterisks` (achievement flags).

### Card Rendering Hierarchy
```
CardGrid → LazyCard → PSAGradeCase (conditional) → GauntletCard
  └─ Front: Photo + NameLabel + TimeLabel + Stickers
  └─ Back: Stats + Action buttons (Watch Run, Quiz, Resume)
```

### Key Directories
- `src/components/` - React components (admin/, labels/, stickers/)
- `src/hooks/` - useGauntletData.js (data fetching), useImageColors.js (color extraction)
- `src/services/` - Airtable API clients
- `src/utils/` - cardVariants.js (16 color palettes), dataHelpers.js (filter/sort), stickerRandomizer.js
- `src/styles/` - CSS modules (cards, effects, PSA cases, layout)
- `src/yakle/` - Quiz game data

### Card Variant System

16 color palettes in `src/utils/cardVariants.js`, each with 5 colors (primary, secondary, accent, text, accent2). Variants are deterministically mapped to competitor IDs using a hash function for consistency across page reloads.

### Animation Patterns

- **Desktop**: 3D tilt effect with pointer tracking, glare effect, flip animation
- **Mobile**: Tap-to-flip with directional animation, single-card GPU promotion for performance
- **Mobile breakpoint**: 768px (see `isMobileViewport()` in components)

### Deterministic Randomization

Uses hash functions on `run.id` to generate consistent random values for:
- Card rotation (-3 to +3 degrees)
- Grid offset positioning
- Sticker rotation
- Position sticker variants

## Environment Variables

Required in `.env`:
```
VITE_AIRTABLE_PAT=your_personal_access_token
VITE_AIRTABLE_BASE_ID=your_base_id
VITE_ADMIN_PASSWORD=your_admin_password
```

## Key Files

- `src/App.jsx` - Main component with state management and filtering
- `src/hooks/useGauntletData.js` - Data fetching and transformation (photo cycling, asterisk resolution)
- `src/components/GauntletCard.jsx` - Card flip logic and mobile detection
- `src/utils/cardVariants.js` - Color palettes and variant configuration
- `src/utils/dataHelpers.js` - Filtering, sorting, and parsing functions

## Custom Tailwind Colors

Brand colors (`yak-gold`, `yak-navy`), medal colors (`gold-light`, `silver-light`, `bronze-light`), and category colors (`cat-nfl`, `cat-mlb`, etc.) defined in `tailwind.config.js`.

## Admin Panel

Route: `/admin` - Password-protected (session-based auth). Features image cropping and form to add new speedruns.
