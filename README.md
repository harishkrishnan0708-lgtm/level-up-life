# Level Up Life

A gamified health app: complete daily quests for exercise (lifting, sports, walking) and healthy living (sleep, water, food, screen time) to earn XP and coins and level up your character.

Built with TypeScript, React, and Vite as a phone-first web app.

## Setup

Requires [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
```

## Run

```bash
npm run dev
```

Open the `Local` address it prints on this computer. To try it on a phone on the same Wi-Fi network, open the `Network` address on the phone. In Safari, use Share → **Add to Home Screen** to open it full-screen like an app.

## Test, lint, and build

```bash
npm test
npm run lint
npm run build
```

`npm run build` writes the production site to `dist/`.

## Deploy

Play it at https://harishkrishnan0708-lgtm.github.io/level-up-life/ (each player's progress is saved on their own device).

The link is served by GitHub Pages from the public copy at https://github.com/harishkrishnan0708-lgtm/level-up-life. To update it with the latest commit, run `scripts/publish-public-copy.sh "what changed"`; it builds the game and pushes `dist/` to the public copy's `gh-pages` branch, which Pages serves within a minute or two.
