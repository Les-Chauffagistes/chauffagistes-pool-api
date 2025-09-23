const https = require("https");
const fs = require("fs");
const app = require("./server");
const { PORT, SSL_KEY_PATH, SSL_CERT_PATH } = require("./config/env");

const credentials = {
  key: fs.readFileSync(SSL_KEY_PATH, "utf8"),
  cert: fs.readFileSync(SSL_CERT_PATH, "utf8"),
};

https.createServer(credentials, app).listen(PORT, () => {
  console.log(`🔒 HTTPS server up on :${PORT}`);
});
