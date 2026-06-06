const admin = require("firebase-admin");

const raw = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY;
if (!raw || !String(raw).trim()) {
  throw new Error(
    "FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY is missing or empty (JSON service account)."
  );
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(raw);
} catch {
  throw new Error("FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY must be valid JSON.");
}

if (!serviceAccount.private_key || !serviceAccount.client_email) {
  throw new Error(
    "FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY JSON is missing private_key or client_email."
  );
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});