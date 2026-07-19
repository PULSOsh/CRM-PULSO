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
    { name: "setup", testMatch: /.*\.setup\.ts/ },
    // storageState compartilhado evita logar de novo em cada teste/arquivo, o que esgotava
    // o rate limit de login (5 tentativas/60s) ao rodar a suíte inteira. Specs que testam o
    // próprio fluxo de login/onboarding (auth.spec.ts) sobrescrevem com test.use({ storageState: ... }).
    { name: "chromium", use: { ...devices["Desktop Chrome"], storageState: "playwright/.auth/user.json" }, dependencies: ["setup"] },
    // Emulação mobile via Chromium (viewport/UA do Pixel 7) para não depender do WebKit no servidor.
    { name: "mobile", use: { ...devices["Pixel 7"], storageState: "playwright/.auth/user.json" }, dependencies: ["setup"] }
  ]
});
