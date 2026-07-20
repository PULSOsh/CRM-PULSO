import { defineConfig, devices } from "@playwright/test";

const port = process.env.PORT ?? "3000";
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // Timeouts mais altos que o padrão: em dev mode, a primeira navegação para cada rota ainda
  // não compilada exige compilação just-in-time, que no disco lento da VPS de testes passa
  // fácil de 5-30s quando um teste visita várias rotas novas em sequência -- não é lentidão
  // real do app, é custo de dev mode (next start/produção não tem esse problema).
  timeout: 60_000,
  expect: { timeout: 15_000 },
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
