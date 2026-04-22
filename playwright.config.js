const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  use: {
    baseURL: "http://127.0.0.1:8090",
  },
  webServer: {
    command: "python3 -m http.server 8090",
    url: "http://127.0.0.1:8090",
    reuseExistingServer: true,
  },
});
