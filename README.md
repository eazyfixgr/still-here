# Still Here

A local-first, real-time idle game about the passing of time. Start a fictional clock, collect milestones, experiment with a scenario, and leave messages for your future self.

Live site: **https://eazyfixgr.github.io/still-here/**

## What it does

- A fixed, time-based game scenario built from population life-expectancy data and fictional lifestyle rules.
- A live countdown with calendar years, months, days, hours, minutes, and seconds.
- Automatic milestones for time, lived days, birthdays, scenario progress, and Overtime.
- Custom milestones chosen by the player.
- Time capsules: sealed messages that unlock on a future date.
- A scenario lab for comparing a different rhythm without changing the active clock.
- English and Greek interfaces, with English as the default.
- Night and daylight themes, reduced-motion support, and a responsive mobile layout.
- Local JSON backup export and import.
- Automatic migration of saves from the original single-file prototype.
- Installable app shell with offline caching via a service worker.

## Local-first, for now

This version intentionally has **no cloud backend**. Profile details, progress, milestones, capsules, and preferences live in `localStorage` on the current device. Nothing is sent to a server.

The persistence layer is isolated in `src/core/persistence.js`, so an encrypted sync provider can be added later without changing the UI or the game model. Until then, use **Settings → Export backup** to keep a private copy or move a journey to another device.

## Development

```bash
npm install
npm run dev
npm test
npm run build
```

The production build uses the GitHub Pages project path `/still-here/` by default. Set `BASE_PATH` to override it:

```bash
BASE_PATH=/my-path/ npm run build
```

## Project structure

```text
src/
  app.js                 application shell, routing, actions, ticker
  main.js                boot and service-worker registration
  core/                  model, dates, achievements, validation, storage, i18n
  data/                  country baselines and fictional lifestyle weights
  ui/                    onboarding, dashboard, views, components
  styles/                modular CSS
tests/                   model, dates, persistence, migration and i18n tests
legacy/                  the original single-file prototype
```

## Model and data

Population life expectancy at birth by sex comes from Eurostat table `demo_mlexpec` for 2024. A synthetic Gompertz survival shape is used to produce an age-aware game baseline. Lifestyle choices carry fictional points, combined into a multiplier of `exp(points / 70)`.

The countdown is a **fictional game scenario**, not a medical assessment, individual life table, or prediction of death. Population averages cannot predict an individual life. Habit points are not years gained or lost in real life. The endpoint is fixed when a journey starts.

Eurostat source: <https://ec.europa.eu/eurostat/databrowser/view/demo_mlexpec/default/table?lang=en>

The original prototype used Greek ELSTAT 2024 figures, which match the Eurostat 2024 series used here.

## Deployment

Pushing to `main` runs the `Deploy to GitHub Pages` workflow. It installs dependencies, runs the test suite, builds the site with the correct repository base path, and publishes `dist/` through GitHub Pages.
