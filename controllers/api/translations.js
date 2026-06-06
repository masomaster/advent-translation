const Anthropic = require("@anthropic-ai/sdk");
const Translation = require("../../models/translation");

/** NET text via labs.bible.org (NET Bible). */
const LABS_BIBLE_BASE =
  "https://labs.bible.org/api/?passage=PLACEHOLDER&type=json";

/** Plain NET English for a passage (same source as "Show NET Translation"). */
async function fetchNetPlainText(citation) {
  const c = String(citation || "").trim();
  if (!c) return "";
  const url = LABS_BIBLE_BASE.replace(
    "PLACEHOLDER",
    encodeURIComponent(c)
  );
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`NET source returned HTTP ${resp.status}`);
  }
  const data = await resp.json();
  if (!Array.isArray(data) || data.length === 0) return "";
  return data
    .map((v) => (v && v.text ? String(v.text).trim() : ""))
    .filter(Boolean)
    .join(" ");
}

async function create(req, res) {
  try {
    const firebaseUID = req.user.uid;

    const existingTranslation = await Translation.findOne({
      day: req.body.day,
      firebaseUID: firebaseUID,
    });

    if (existingTranslation) {
      return update(req, res);
    }

    if (req.body.hebrew === "" && req.body.greek === "") return;
    if (req.body.hebrew && !req.body.greek) req.body.greek = "";
    if (req.body.greek && !req.body.hebrew) req.body.hebrew = "";

    req.body.firebaseUID = firebaseUID;
    const dayTranslations = await Translation.create(req.body);
    res.json(dayTranslations);
  } catch (err) {
    console.error("Error in translation controller: ", err);
    res.status(400).json({ message: err.message || "Bad request" });
  }
}

async function update(req, res) {
  const firebaseUID = req.user.uid;

  try {
    const filter = { day: req.body.day, firebaseUID: firebaseUID };
    const dayTranslations = await Translation.findOneAndUpdate(
      filter,
      req.body,
      { new: true }
    );
    res.json(dayTranslations);
  } catch (err) {
    res.status(400).json({ message: err.message || "Bad request" });
  }
}

async function getDayTranslations(req, res) {
  const firebaseUID = req.user.uid;

  try {
    const dayTranslations = await Translation.findOne({
      day: req.params.id,
      firebaseUID: firebaseUID,
    });

    res.json(dayTranslations);
  } catch (err) {
    res.status(400).json({ message: err.message || "Bad request" });
  }
}

async function getOfficialTranslations(req, res) {
  const citation = String(req.query.passage || "").trim();
  if (!citation) {
    return res.status(400).json({ message: "Missing passage query (e.g. ?passage=John+1:1)" });
  }

  try {
    const text = await fetchNetPlainText(citation);
    if (!text) {
      throw new Error("Empty verse payload");
    }
    res.json(`<p class="net-translation">"${text}"</p>`);
  } catch (err) {
    console.error("getOfficialTranslations:", err.message);
    res.status(502).json({
      message: "Could not load NET text for this passage.",
      detail: err.message,
    });
  }
}

const FEEDBACK_JSON_INSTRUCTIONS = `You are evaluating a student's English rendering of a specific Hebrew or Greek verse.

Scope (strict):
- Grammar, syntax, morphology, and clear lexical mismatches vs the original. Use NET only as a rough English sense check—not for theology or paraphrase debates.
- Do NOT discuss doctrine, theology, homiletics, or application. Stay linguistic.

Output shape (strict) — there are NO separate sections for word choice, grammar, and "issues." Only these keys:
{
  "verdict": "adequate" | "mixed" | "needs_revision",
  "summary": "string",
  "comments": ["string"]
}

Rules:
- "summary" is the ONLY place for full sentences of analysis. Keep it short: 1 sentence if adequate; if problems exist, at most 2–3 sentences and say each problem once here OR in comments—never both.
- "comments" is optional extra lines: use ONLY for brief, concrete fixes (e.g. gloss, word order) that are not already fully stated in summary. Max 4 strings. If adequate or summary already covers everything, use [].
- Do not repeat the same corrective idea in summary and comments, or across multiple comments.
- If the translation is solid: verdict "adequate", one approving sentence in summary, comments [].

Respond with ONLY one JSON object (no markdown fences, no text outside JSON).`;

/** Default: Sonnet 4.5 (alias → latest snapshot). Override with ANTHROPIC_MODEL. */
const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-5";

const FEEDBACK_BILLING_BLOCKED_MESSAGE =
  "Translation feedback is unavailable because the AI service account has hit a billing or credit limit. Please contact the site administrator so they can add credits or update billing.";

/**
 * True when Anthropic indicates exhausted credits / billing block (not a generic RPM throttle).
 * Docs: 402 billing_error; 429 may be rate_limit_error vs quota; some responses use type "1113" or message text.
 */
function anthropicBillingOrQuotaUserMessage(err) {
  if (!err || typeof err !== "object") return null;

  const status = err.status;
  const body = err.error;
  const nested =
    body && typeof body === "object" && body.error && typeof body.error === "object"
      ? body.error
      : null;
  const innerType = String(nested?.type || "").toLowerCase();
  const innerMsg = String(nested?.message || "").toLowerCase();
  const blob = `${JSON.stringify(body || {})} ${innerMsg} ${String(
    err.message || ""
  )}`.toLowerCase();

  if (status === 402) return FEEDBACK_BILLING_BLOCKED_MESSAGE;

  if (
    innerType === "billing_error" ||
    innerType === "quota_exceeded" ||
    innerType === "1113"
  ) {
    return FEEDBACK_BILLING_BLOCKED_MESSAGE;
  }

  const fundsOrBillingLanguage =
    /insufficient\s+balance|no\s+resource\s+package|recharge|usage\s+is\s+blocked|insufficient\s+credits|purchase\s+credits|plans\s+and\s+billing|credit\s+balance|spend\s+limit|billing\s+or\s+payment|payment\s+information/.test(
      blob
    );

  if (fundsOrBillingLanguage) return FEEDBACK_BILLING_BLOCKED_MESSAGE;

  // 429 + plain rate limit only → no "contact admin" (transient); quota/billing already handled above.
  return null;
}

function parseFeedbackRequestBody(body) {
  if (Array.isArray(body)) {
    const [translation, citation] = body;
    return {
      translation,
      citation,
      originalText: "",
      sourceLanguage: "",
    };
  }
  if (body && typeof body === "object") {
    return {
      translation: body.translation,
      citation: body.citation,
      originalText: String(body.originalText ?? "").trim(),
      sourceLanguage: String(body.sourceLanguage ?? "").trim(),
    };
  }
  return null;
}

async function getTranslationFeedback(req, res) {
  const parsed = parseFeedbackRequestBody(req.body);
  if (!parsed) {
    return res.status(400).json({ message: "Invalid request body" });
  }
  const { translation, citation, originalText, sourceLanguage } = parsed;

  if (!translation || !String(translation).trim()) {
    return res.status(400).json({ message: "Missing translation text" });
  }
  if (!citation) {
    return res.status(400).json({ message: "Missing citation" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      message:
        "Translation feedback is not configured (missing ANTHROPIC_API_KEY).",
    });
  }

  const model = process.env.ANTHROPIC_MODEL || DEFAULT_ANTHROPIC_MODEL;

  let netEnglish = "";
  try {
    netEnglish = await fetchNetPlainText(citation);
  } catch (e) {
    console.warn("getTranslationFeedback: NET fetch skipped:", e.message);
  }

  const langLine =
    sourceLanguage === "hebrew" || sourceLanguage === "greek"
      ? sourceLanguage
      : "hebrew or greek (unspecified)";

  const userBlock = `${FEEDBACK_JSON_INSTRUCTIONS}

## Passage
English reference (for NET and alignment): ${citation}
Source language being translated from: ${langLine}
Original verse (${langLine}): ${originalText || "(not provided)"}

## NET (English gloss for this reference)
${netEnglish || "(NET text unavailable—judge mainly from the original.)"}

## Student's English translation
${translation.trim()}`;

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model,
      max_tokens: 900,
      temperature: 0.35,
      messages: [{ role: "user", content: userBlock }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const raw = textBlock && textBlock.text ? textBlock.text.trim() : "";
    const feedbackJson = parseFeedbackJson(raw);
    const html = structuredFeedbackToHtml(feedbackJson);
    res.json(html);
  } catch (err) {
    const billingMsg = anthropicBillingOrQuotaUserMessage(err);
    const logPayload =
      err && typeof err === "object" && err.error !== undefined
        ? JSON.stringify(err.error)
        : err?.message || String(err);
    console.error("getTranslationFeedback:", logPayload);

    if (billingMsg) {
      return res.status(503).json({
        message: billingMsg,
        code: "anthropic_billing_or_quota",
      });
    }

    res.status(502).json({
      message: "Could not generate feedback right now. Try again shortly.",
      detail: err.message || String(err),
    });
  }
}

function parseFeedbackJson(raw) {
  let s = raw.trim();
  const fence = s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence) s = fence[1].trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start >= 0 && end > start) s = s.slice(start, end + 1);
  try {
    return JSON.parse(s);
  } catch {
    return {
      verdict: "mixed",
      summary:
        "The model response could not be read as JSON. Raw output (truncated) is not shown in structured form.",
      comments: [],
    };
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Max bullets under one optional list (no subsection headings). */
const MAX_COMMENTS = 5;

/**
 * Normalize model output: new shape { verdict, summary, comments[] } or legacy multi-field.
 */
function feedbackCommentsList(data) {
  if (!data || typeof data !== "object") return [];

  if (Array.isArray(data.comments) && data.comments.length > 0) {
    return data.comments
      .map((x) => String(x).trim())
      .filter(Boolean)
      .slice(0, MAX_COMMENTS);
  }

  const legacy = [];
  if (Array.isArray(data.wordChoice)) {
    legacy.push(...data.wordChoice.map((x) => String(x).trim()).filter(Boolean));
  }
  if (Array.isArray(data.grammarSyntax)) {
    legacy.push(
      ...data.grammarSyntax.map((x) => String(x).trim()).filter(Boolean)
    );
  }
  if (Array.isArray(data.criticalProblems)) {
    for (const p of data.criticalProblems) {
      if (!p || typeof p !== "object") continue;
      const line = [p.issue, p.fix].filter(Boolean).join(" → ").trim();
      if (line) legacy.push(line);
    }
  }
  if (
    legacy.length === 0 &&
    typeof data.fidelityToSource === "string" &&
    data.fidelityToSource.trim()
  ) {
    legacy.push(data.fidelityToSource.trim());
  }
  return legacy.slice(0, MAX_COMMENTS);
}

function structuredFeedbackToHtml(data) {
  const verdict = escapeHtml(data.verdict || "—");
  const summary = escapeHtml(data.summary || "");
  const comments = feedbackCommentsList(data);

  const commentsHtml =
    comments.length > 0
      ? `<ul class="feedback-comments">${comments
          .map((x) => `<li>${escapeHtml(x)}</li>`)
          .join("")}</ul>`
      : "";

  return [
    `<div class="translation-feedback">`,
    `<p class="feedback-verdict"><strong>Overall:</strong> ${verdict}</p>`,
    summary
      ? `<p class="feedback-summary"><strong>Summary:</strong> ${summary}</p>`
      : "",
    commentsHtml,
    `</div>`,
  ]
    .filter(Boolean)
    .join("\n");
}

module.exports = {
  create,
  update,
  getDayTranslations,
  getOfficialTranslations,
  getTranslationFeedback,
};
