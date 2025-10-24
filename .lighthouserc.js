module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      startServerCommand: "npm run build && set E2E_TEST_MODE=1 && set PORT=3010 && npm run start",
      startServerReadyTimeout: 180000,
      url: [
        "http://localhost:3010/",
        "http://localhost:3010/dashboard",
        "http://localhost:3010/schedule",
        "http://localhost:3010/templates"
      ],
      settings: {
        formFactor: "desktop",
        screenEmulation: { mobile: false, width: 1366, height: 768, deviceScaleFactor: 1, disabled: false },
        throttlingMethod: "simulate",
        chromeFlags: [
          "--user-data-dir=.tmp/chrome",
          "--no-sandbox",
          "--disable-gpu",
          "--disable-dev-shm-usage",
          "--disable-background-timer-throttling"
        ],
        extraHeaders: require("./lhci-headers.json"),
        budgets: require("./lighthouse-budgets.json")
      }
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.85 }],
        "first-contentful-paint": ["warn", { maxNumericValue: 2000 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 3000 }],
        "total-blocking-time": ["error", { maxNumericValue: 300 }],
        "speed-index": ["warn", { maxNumericValue: 2500 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        "resource-summary:total-byte-weight": ["warn", { maxNumericValue: 1000000 }]
      }
    },
    upload: {
      target: "filesystem",
      outputDir: ".lighthouseci"
    }
  }
}
