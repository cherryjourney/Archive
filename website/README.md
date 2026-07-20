# Archive·存迹 — Official Website

> 每一次认真的晨昏，都在这里

The official website for **Archive·存迹**, a graduate student personal productivity desktop app built with Tauri 2 + React.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Animation | Framer Motion |
| Deployment | Vercel |

## Design

- **Style:** Glassmorphism — translucent cards with backdrop blur, floating on light gradient backgrounds
- **Primary Color:** Cobalt Blue `#2563EB`
- **Typography:** 宋体 (Song Ti) for Chinese · Times New Roman for English & numbers
- **Motion:** Subtle parallax, scroll-triggered fade-ups, card hover lifts

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home — Hero, stats, feature overview, screenshots, CTA |
| `/features` | All 19 modules in 4 groups (Core / Time / Academic / Tools) |
| `/download` | Platform downloads + install guide |
| `/changelog` | Version history timeline (V1.0 → V5.0.1) |
| `/about` | Project story, tech architecture, contact |

## Getting Started

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Static export
npm run build
```

## Project Structure

```
website/
├── src/
│   ├── app/            # Next.js App Router pages
│   │   ├── page.tsx    # Home
│   │   ├── features/
│   │   ├── download/
│   │   ├── changelog/
│   │   └── about/
│   ├── components/     # Shared UI components
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── GlassCard.tsx
│   │   └── ...
│   └── styles/         # Global styles
├── public/
│   └── images/         # Screenshots, icon, og-image
├── CLAUDE.md           # Agent context
└── README.md           # This file
```

## About Archive·存迹

A personal productivity desktop app designed for graduate students. Features 19 modules across 4 categories:

- **Core:** Dashboard, Daily Plan, Task Library, Pomodoro Timer
- **Time:** Gantt Chart, Calendar, Countdown, Life Events, Travel Map, Packing, Assets
- **Academic:** Papers, Experiments, Courses
- **Tools:** Bookkeeping, Tags, Weekly Report, Statistics, Settings

Built with **Tauri 2** (Rust backend + SQLite) and **React 18** (TypeScript + Ant Design 5).
