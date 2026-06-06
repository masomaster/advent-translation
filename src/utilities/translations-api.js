import sendRequest from "./send-request";
const BASE_URL = "/api/translations";

export async function createTranslations(dayTranslations) {
  return sendRequest(BASE_URL, "POST", dayTranslations);
}

export async function getDayTranslations(day) {
  return sendRequest(`${BASE_URL}/${day}`, "GET");
}

export async function getOfficialTranslations(dayVerses) {
  const params = new URLSearchParams({ passage: String(dayVerses) });
  return sendRequest(`${BASE_URL}/official?${params.toString()}`, "GET");
}

export async function getTranslationFeedback(payload) {
  return sendRequest(`${BASE_URL}/feedback`, "POST", payload);
}