import { getAuth } from "firebase/auth";

export default async function sendRequest(url, method = 'GET', payload = null) {
    const options = { method };
    
    if (payload) {
        options.headers = { 'Content-Type': 'application/json' };
        options.body = JSON.stringify(payload);
    }

    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
        const idToken = await user.getIdToken();
        options.headers ||= {};
        options.headers.Authorization = `Bearer ${idToken}`;
    }

    const res = await fetch(url, options);
    const text = await res.text();
    let body;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = null;
    }

    if (res.ok) {
      return body !== null ? body : text;
    }

    const msg =
      (body && (body.message || body.error)) ||
      text ||
      `Request failed (${res.status})`;
    throw new Error(typeof msg === "string" ? msg : "Request failed");
}
