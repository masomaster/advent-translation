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

Hosted on Vercel

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
But for development, I want the React dev build available for easy updating, but then they run on different ports, so add this to `package.json`:
  `"proxy": "http://localhost:3001"`
Be sure to remove it when building and deploying. To run things for dev, run `npm run start-client` to start up the react dev environment, and `node server.js` to start up the Express server. The proxy will link them.

Be sure to remove  `"proxy": "http://localhost:3001"` from `package.json` and run `npm run build` before deploying for prod.

### Environment variables

Copy `.env.example` to `.env` and set at least:

- `DATABASE_URL` — MongoDB connection string
- `ANTHROPIC_API_KEY` — required for **Show Feedback on Your Translation** (Claude). Optional `ANTHROPIC_MODEL` overrides the default (`claude-sonnet-4-5`).

**Show NET Translation** loads the NET Bible text from [labs.bible.org](https://labs.bible.org/) (no API key). The legacy Parabible JSON endpoint used previously no longer returns verse data reliably.


