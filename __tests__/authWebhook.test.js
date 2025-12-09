const express = require("express");
const request = require("supertest");

const buildApp = () => {
  jest.resetModules();
  const authWebhook = require("../src/middlewares/authWebhook");
  const app = express();
  app.post("/webhook", authWebhook, (req, res) => res.send("ok"));
  return app;
};

describe("authWebhook middleware", () => {
  const originalEnv = process.env.AUTH_TOKEN;

  afterEach(() => {
    process.env.AUTH_TOKEN = originalEnv;
    jest.resetModules();
  });

  test("rejects when AUTH_TOKEN is not configured", async () => {
    delete process.env.AUTH_TOKEN;
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const app = buildApp();

    const res = await request(app).post("/webhook");

    expect(res.status).toBe(500);
    expect(res.text).toContain("Configuration AUTH_TOKEN manquante");
    consoleSpy.mockRestore();
  });

  test("allows request when correct Authorization header is provided", async () => {
    process.env.AUTH_TOKEN = "secret-token";
    const app = buildApp();

    const res = await request(app)
      .post("/webhook")
      .set("Authorization", "secret-token");

    expect(res.status).toBe(200);
    expect(res.text).toBe("ok");
  });

  test("rejects request with missing or invalid Authorization", async () => {
    process.env.AUTH_TOKEN = "expected";
    const app = buildApp();

    const withoutHeader = await request(app).post("/webhook");
    expect(withoutHeader.status).toBe(403);

    const wrongHeader = await request(app)
      .post("/webhook")
      .set("Authorization", "wrong");
    expect(wrongHeader.status).toBe(403);
  });
});
