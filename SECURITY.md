# Security notes — Advent Translation

This document summarizes the main risks, what is mitigated in code, and what still depends on platform/config.

## Architecture

- **Express** serves the CRA `build/` and `/api/translations/*`.
- **Firebase Auth** (client) + **Firebase Admin** `verifyIdToken` (server) guard mutating routes and feedback.
- **MongoDB** via Mongoose stores per-user `day`, `hebrew`, `greek` only.
- **Anthropic** API key is server-only (`ANTHROPIC_API_KEY`).

## Implemented controls

| Area | Mitigation |
|------|------------|
| **Mass assignment / UID hijack** | Create/update accept only `day`, `hebrew`, `greek` from the body; `firebaseUID` is always taken from the verified ID token. Updates use `$set` with those fields only. |
| **Day parameter** | `day` must be an integer **1–31**; `GET /:id` coerces/validates so string/ObjectId injection paths are rejected. |
| **NET / passage query** | `passage` is trimmed and length-capped before calling labs.bible.org (abuse/oversized query reduction). |
| **Feedback payload** | Translation, original text, and citation are length-capped before being sent to the LLM (cost/DoS reduction). |
| **Rate limiting** | `express-rate-limit` on the translations router: general API cap, stricter cap on `POST /feedback`, moderate cap on `GET /official`. |
| **JSON body size** | `express.json({ limit: '512kb' })`. |
| **Helmet** | Default headers with **CSP disabled** (CRA single-origin bundle); `crossOriginEmbedderPolicy` disabled to avoid breaking common embeds. |
| **Reverse proxy** | `trust proxy` enabled in production so rate limits use client IP correctly on Vercel. |
| **Error responses** | Production avoids returning raw internal exception strings on some failure paths (`clientSafeDetail`). |
| **Firebase Admin env** | Service account JSON is validated at startup (parse + required fields). |
| **Client HTML** | Feedback/NET HTML is sanitized with **DOMPurify** before `dangerouslySetInnerHTML`. |

## Residual risks / backlog

1. **Content Security Policy** — Still off for the combined static+API server. Tightening CSP usually means splitting API and static hosts or a careful nonce/hash policy for CRA.
2. **`react-scripts` / webpack-dev-server transitive advisories** — Many `npm audit` findings come from CRA 5’s toolchain. Real fix is migrating off CRA (e.g. Vite) or accepting risk on dev dependencies only.
3. **`firebase-admin` / Google SDK tree** — Some advisory chains are upstream; bump `firebase-admin` regularly and watch Anthropic/Google release notes.
4. **Public `GET /official`** — No auth (by design). Rate-limited only; could add optional auth or caching if abused.
5. **MongoDB** — Use TLS URIs, IP allowlisting, and least-privilege DB users in Atlas (or equivalent); not enforced in app code.
6. **Secrets** — Never commit `.env` or service account JSON; rotate keys if exposed. Prefer Vercel/host env vars over files in prod.

## Dependency hygiene

- Remove unused packages to shrink supply-chain surface (done periodically in `package.json`).
- Run `npm audit` after updates; use `npm audit fix` without `--force` unless you accept breaking upgrades.

## Reporting

If you find a vulnerability, contact the repository owner privately with reproduction steps and impact.
