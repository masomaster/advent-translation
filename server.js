const express = require("express");
const path = require("path");
const favicon = require("serve-favicon");
const morgan = require("morgan");
const helmet = require("helmet");

require("dotenv").config();
require("./config/database");
require("./config/firebaseAdmin"); // initializeApp() before any route uses verifyFirebaseToken

const app = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(
  process.env.NODE_ENV === "production" ? morgan("combined") : morgan("dev")
);
app.use(express.json({ limit: "512kb" }));

// API before static so /api/* is never served as a static file or SPA fallback.
app.use("/api/translations", require("./routes/api/translations"));

// Configure both serve-favicon & static middleware
// to serve from the production 'build' folder
app.use(favicon(path.join(__dirname, "build", "favicon.ico")));
app.use(express.static(path.join(__dirname, "build")));

// The following "catch all" route (note the *) is necessary
// to return the index.html on all non-AJAX requests
app.get("/*", function (req, res) {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// Configure to use port 3001 instead of 3000 during
// development to avoid collision with React's dev server
const port = process.env.PORT || 3001;

app.listen(port, function () {
  console.log(`Express app running on port ${port}`);
});

// Vercel invokes the Express app as a serverless handler (see Express on Vercel).
module.exports = app;
