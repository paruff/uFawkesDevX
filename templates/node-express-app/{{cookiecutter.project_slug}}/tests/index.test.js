const test = require("node:test");
const assert = require("node:assert");
const http = require("node:http");
const app = require("../src/index.js");

test("GET /health returns ok", async () => {
  const server = app.listen(0);
  const { port } = server.address();
  const body = await new Promise((resolve, reject) => {
    http.get(`http://localhost:${port}/health`, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(JSON.parse(data)));
    }).on("error", reject);
  });
  server.close();
  assert.deepStrictEqual(body, { status: "ok" });
});
