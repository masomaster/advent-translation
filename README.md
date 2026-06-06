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

The **`build/`** folder is not committed (gitignored). Run **`npm run build`** once before **`npm start`** when testing production mode locally. On Vercel, **`vercel-build`** runs `react-scripts build` so static assets exist beside `server.js`.

### Development

Run **both** processes: the API and the React dev server.

1. **`node server.js`** (or `npm run start-server`) on **port 3001** — serves `/api/*` and loads `.env`.
2. **`npm run start-client`** on **port 3000** — CRA dev UI.

`package.json` includes **`"proxy": "http://localhost:3001"`** so browser calls to `/api/translations/...` from `http://localhost:3000` are forwarded to Express. Without that proxy (or without the API running), you will see errors like **Cannot POST /api/translations/feedback** and saved verses will not load.

The proxy is a **dev-only** CRA feature; production (`npm start` → `node server.js`) serves the API and `build/` from one server, so you do **not** need to remove the proxy field before deploying to Vercel.

### Environment variables

Copy [`.env.example`](./.env.example) to `.env` for local development and fill in values.

**Vercel:** CRA reads `REACT_APP_*` only when **`vercel-build`** runs (`react-scripts build`). Add the same keys in **Settings → Environment Variables** for **Production** and **Preview** (and **Development** if you use it); after changing them, trigger a **new deployment** so the bundle is rebuilt.

1. [Firebase Console](https://console.firebase.google.com/) → your project → **Project settings** (gear) → **General** → scroll to **Your apps** → pick the Web app → copy the `firebaseConfig` object fields.
2. [Vercel](https://vercel.com/) → your project → **Settings** → **Environment Variables**.
3. Create one variable per name below; paste the matching value; enable **Production**, **Preview**, and (optional) **Development** for each.
4. **Deployments** → open the latest deployment → **⋯** → **Redeploy** (or push a new commit) after changing variables so the client bundle picks them up.

Required names (same as `.env.example`):

- `DATABASE_URL` — MongoDB connection string
- `FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY` — JSON string for the Firebase Admin SDK (server). Required on Vercel for authenticated API routes.
- `REACT_APP_FIREBASE_API_KEY`, `REACT_APP_FIREBASE_AUTH_DOMAIN`, `REACT_APP_FIREBASE_PROJECT_ID`, `REACT_APP_FIREBASE_STORAGE_BUCKET`, `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`, `REACT_APP_FIREBASE_APP_ID` — from the Firebase web SDK config (see step 1).
- `ANTHROPIC_API_KEY` — required for **Show Feedback on Your Translation** (Claude). Optional `ANTHROPIC_MODEL` overrides the default (`claude-sonnet-4-5`).

**Show NET Translation** loads the NET Bible text from [labs.bible.org](https://labs.bible.org/) (no API key). The legacy Parabible JSON endpoint used previously no longer returns verse data reliably.


