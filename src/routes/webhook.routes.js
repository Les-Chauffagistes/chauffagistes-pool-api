const router = require("express").Router();
const { webhookLimiter } = require("../middlewares/limiter");
const authWebhook = require("../middlewares/authWebhook");
const ctrl = require("../controllers/webhook.controller");
router.post("/", webhookLimiter, authWebhook, ctrl.mainWebhook);
module.exports = router;
