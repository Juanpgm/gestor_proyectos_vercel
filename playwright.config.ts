import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config para e2e de visibilidad y edición de Unidades de Proyecto.
 * Asume `npm run dev` corriendo en http://localhost:3000.
 * Si tu dev server corre en otro puerto, ajusta BASE_URL.
 */
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: process.env.PLAYWRIGHT_NO_WEBSERVER
    ? undefined
    : {
        command: "npm run dev",
        url: BASE_URL,
        timeout: 180_000,
        reuseExistingServer: true,
        stdout: "ignore",
        stderr: "pipe",
      },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
