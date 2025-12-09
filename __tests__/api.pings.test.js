const fs = require("fs");
const os = require("os");
const path = require("path");
const request = require("supertest");

const buildApp = (pingFile) => {
  jest.resetModules();

  jest.doMock("../src/config/paths", () => {
    const actual = jest.requireActual("../src/config/paths");
    return { ...actual, PING_FILE: pingFile };
  });

  const intervalMock = jest.spyOn(global, "setInterval").mockImplementation(() => ({
    unref: () => {},
    ref: () => {}
  }));
  const app = require("../src/server");
  intervalMock.mockRestore();

  return app;
};

describe("GET /api/pings", () => {
  test("returns empty payload without requiring authentication when file is missing", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pings-missing-"));
    const pingFile = path.join(tmpDir, "pings.txt");
    const app = buildApp(pingFile);

    const res = await request(app).get("/api/pings");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ updatedAt: null, hosts: [] });
  });

  test("returns 404 with raw output when file is missing", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pings-raw-missing-"));
    const pingFile = path.join(tmpDir, "pings.txt");
    const app = buildApp(pingFile);

    const res = await request(app).get("/api/pings").query({ raw: 1 });

    expect(res.status).toBe(404);
    expect(res.text).toContain("Aucun ping disponible");
  });

  test("parses ping file and exposes aggregate counts without authentication", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pings-data-"));
    const pingFile = path.join(tmpDir, "pings.txt");
    fs.writeFileSync(pingFile, [
      "miner-a : time=12.5 ms",
      "miner-b : offline",
      "miner-c : time=20.1 ms"
    ].join("\n"));

    const app = buildApp(pingFile);
    const res = await request(app).get("/api/pings");

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    expect(res.body.online).toBe(2);
    expect(res.body.offline).toBe(1);
    expect(Array.isArray(res.body.hosts)).toBe(true);
    expect(res.body.hosts.find(h => h.name === "miner-b")).toEqual({
      name: "miner-b",
      online: false,
      latencyMs: null,
      raw: "offline"
    });
  });
});
