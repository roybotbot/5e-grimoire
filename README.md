# 5e Grimoire

A focused reference for 5th Edition Dungeons & Dragons. 

## Features

- **Search** — find spells by name instantly
- **Filter** — by level, school, class, casting time, concentration, ritual, components, damage type, source
- **Spell detail** — clean card layout with school-colored header, stats grid, full description
- **Save spells** — bookmark spells to a persistent saved list
- **Keyboard navigation** — `/` to search, arrow keys to browse, Escape to close
- **Mobile friendly** — responsive layout with touch support

## Running locally

```bash
cd app
npm install
npm run dev
```

Spell data files need to be in `app/public/data/spells/`. Copy them from a 5etools source release if not present.

## Production build

```bash
cd app
npm run build
```

Output goes to `docs/` for GitHub Pages deployment. Serve from any static file server.

## Tech stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Zustand (state management)
- React Router v7 (hash routing)
