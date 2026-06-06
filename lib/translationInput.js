/**
 * Shared validation for translation CRUD (prevents mass-assignment / UID tampering).
 */

const MAX_ADVENT_DAY = 31;
const MAX_VERSE_CHARS = 120_000;
const MAX_PASSAGE_QUERY_LEN = 120;
const MAX_FEEDBACK_TRANSLATION = 40_000;
const MAX_FEEDBACK_ORIGINAL = 30_000;
const MAX_FEEDBACK_CITATION = 200;

function clampStr(s, max) {
  const t = String(s ?? "");
  return t.length <= max ? t : t.slice(0, max);
}

/** Integer day 1..MAX_ADVENT_DAY or null. */
function parseDay(value) {
  const n = Number.parseInt(String(value), 10);
  if (!Number.isFinite(n) || n < 1 || n > MAX_ADVENT_DAY) return null;
  return n;
}

/**
 * Only fields we persist. Never trust client-supplied firebaseUID.
 * @returns {{ day: number, hebrew: string, greek: string } | null}
 */
function sanitizeTranslationPayload(body) {
  if (!body || typeof body !== "object") return null;
  const day = parseDay(body.day);
  if (day == null) return null;
  const hebrew = clampStr(body.hebrew, MAX_VERSE_CHARS);
  const greek = clampStr(body.greek, MAX_VERSE_CHARS);
  return { day, hebrew, greek };
}

function safePassageQuery(passage) {
  const t = String(passage ?? "").trim();
  if (!t) return "";
  return clampStr(t, MAX_PASSAGE_QUERY_LEN);
}

function clampFeedbackStrings(parsed) {
  if (!parsed || typeof parsed !== "object") return parsed;
  let sl = String(parsed.sourceLanguage || "").trim().toLowerCase();
  if (sl !== "hebrew" && sl !== "greek") sl = "";
  return {
    ...parsed,
    translation: clampStr(parsed.translation, MAX_FEEDBACK_TRANSLATION),
    citation: clampStr(parsed.citation, MAX_FEEDBACK_CITATION),
    originalText: clampStr(parsed.originalText, MAX_FEEDBACK_ORIGINAL),
    sourceLanguage: sl,
  };
}

/**
 * When PATCHing, only overwrite Hebrew/Greek keys that appear on the body
 * (client sends one language at a time; preserve the other in Mongo).
 */
function mergeTranslationStringsForUpdate(existing, body) {
  if (!existing || typeof body !== "object") return null;
  let hebrew = existing.hebrew != null ? String(existing.hebrew) : "";
  let greek = existing.greek != null ? String(existing.greek) : "";
  if (Object.prototype.hasOwnProperty.call(body, "hebrew")) {
    hebrew = clampStr(body.hebrew, MAX_VERSE_CHARS);
  }
  if (Object.prototype.hasOwnProperty.call(body, "greek")) {
    greek = clampStr(body.greek, MAX_VERSE_CHARS);
  }
  return { hebrew, greek };
}

module.exports = {
  MAX_PASSAGE_QUERY_LEN,
  parseDay,
  sanitizeTranslationPayload,
  safePassageQuery,
  clampFeedbackStrings,
  mergeTranslationStringsForUpdate,
};
