# Advent Translation

[Go to deployed version](https://www.adventtranslation.com/)

## About

This is a project, modeled after [Advent of Code](https://adventofcode.com/), providing 25 days of translation practice from Hebrew and Greek verses in the Bible for the Christmas/Advent season.

## Technologies

Kept it simple to get it off the ground asap:

- React
- MongoDB
- Node.js
- Express

Hosted on Vercel. Security overview: [SECURITY.md](./SECURITY.md).

## Getting Started

### Production
In order to work on Vercel without refactoring on deployment, `node server.js` or `npm run start` launch both the Express server and the react client.
To do this, `package.json` includes these:
```
"main": "server.js",
  "scripts": {
    "build": "react-scripts build",
    "start": "node server.js",
    "start-client": "react-scripts start",
    "start-server": "nodemon server.js"
  },
```


### Development

Run **both** processes: the API and the React dev server.

1. **`node server.js`** (or `npm run start-server`) on **port 3001** — serves `/api/*` and loads `.env`.
2. **`npm run start-client`** on **port 3000** — CRA dev UI.

`package.json` includes **`"proxy": "http://localhost:3001"`** so browser calls to `/api/translations/...` from `http://localhost:3000` are forwarded to Express. Without that proxy (or without the API running), you will see errors like **Cannot POST /api/translations/feedback** and saved verses will not load.

The proxy is a **dev-only** CRA feature; production (`npm start` → `node server.js`) serves the API and `build/` from one server, so you do **not** need to remove the proxy field before deploying to Vercel.

### Environment variables

Copy `.env.example` to `.env` and set at least:

- `DATABASE_URL` — MongoDB connection string
- `ANTHROPIC_API_KEY` — required for **Show Feedback on Your Translation** (Claude). Optional `ANTHROPIC_MODEL` overrides the default (`claude-sonnet-4-5`).

**Show NET Translation** loads the NET Bible text from [labs.bible.org](https://labs.bible.org/) (no API key). The legacy Parabible JSON endpoint used previously no longer returns verse data reliably.


