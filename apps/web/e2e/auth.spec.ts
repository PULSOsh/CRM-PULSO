import { expect, test } from "@playwright/test";

// Este arquivo testa o próprio fluxo de login/logout, então precisa começar deslogado —
// sobrescreve o storageState autenticado compartilhado (ver playwright.config.ts + auth.setup.ts).
test.use({ storageState: { cookies: [], origins: [] } });

const TEST_ADMIN_EMAIL = "admin.e2e@pulso.local";
const TEST_ADMIN_PASSWORD = "senha-de-teste-e2e-123";

test.describe("login", () => {
  test("login com senha incorreta mostra erro e não entra", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(TEST_ADMIN_EMAIL);
    await page.getByLabel("Senha").fill("senha-errada-123456");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  // Um único login real cobre "entra com sucesso" + "logout bloqueia rota interna",
  // evitando esgotar o rate limit de sign-in (5 tentativas/60s) ao rodar toda a suíte.
  test("login com sucesso acessa o CRM; logout encerra a sessão e bloqueia rota interna", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(TEST_ADMIN_EMAIL);
    await page.getByLabel("Senha").fill(TEST_ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/app\/hoje/);
    await expect(page.getByRole("heading", { name: "Central de hoje" })).toBeVisible();

    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/app/hoje");
    await expect(page).toHaveURL(/\/login/);
  });
});
