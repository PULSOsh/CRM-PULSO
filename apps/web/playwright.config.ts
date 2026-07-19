import { defineConfig, devices } from "@playwright/test";

const port = process.env.PORT ?? "3000";
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  use: {
    baseURL,
    trace: "on-first-retry"
  },
  webServer: {
    command: `npm run dev -- -p ${port}`,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 60_000
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // Emulação mobile via Chromium (viewport/UA do Pixel 7) para não depender do WebKit no servidor.
    { name: "mobile", use: { ...devices["Pixel 7"] } }
  ]
});
