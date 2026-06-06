// const admin = require("./firebaseAdmin");
const { getAuth } = require("firebase-admin/auth");

async function verifyFirebaseToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1]; // Get the token from 'Authorization' header

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    const uid = decodedToken.uid;
    req.user = decodedToken; // Set the Firebase user info on req.user
    next();
  } catch (error) {
    console.error("Error fetching user data:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
}

module.exports = verifyFirebaseToken;
