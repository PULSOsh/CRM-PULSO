import { expect, test } from "@playwright/test";

const TEST_ADMIN_EMAIL = "admin.e2e@pulso.local";
const TEST_ADMIN_PASSWORD = "senha-de-teste-e2e-123";

test.describe.serial("onboarding e login", () => {
  test("conclui o onboarding (ou reconhece administrador existente)", async ({ page }) => {
    await page.goto("/onboarding");

    const isAdminStep = await page.getByRole("heading", { name: "Criar administrador" }).isVisible().catch(() => false);

    if (isAdminStep) {
      await page.getByLabel("Nome").fill("Administrador E2E");
      await page.getByLabel("E-mail").fill(TEST_ADMIN_EMAIL);
      await page.getByLabel("Senha", { exact: true }).fill(TEST_ADMIN_PASSWORD);
      await page.getByLabel("Confirmar senha").fill(TEST_ADMIN_PASSWORD);
      await page.getByRole("button", { name: "Criar administrador" }).click();

      await expect(page.getByRole("heading", { name: "Dados da PULSO" })).toBeVisible();
      await page.getByLabel("Nome fantasia").fill("PULSO");
      await page.getByRole("button", { name: "Continuar" }).click();

      await expect(page.getByRole("heading", { name: "Integrações" })).toBeVisible();
      await page.getByRole("button", { name: "Concluir configuração" }).click();

      await expect(page).toHaveURL(/\/app\/hoje/);
    } else {
      // Administrador e onboarding já existem de uma execução anterior: não pode ser refeito.
      // Sem sessão, /onboarding concluído redireciona para /app/hoje, que por sua vez exige login.
      await expect(page).toHaveURL(/\/onboarding|\/app\/hoje|\/login/);
    }
  });

  test("login com credenciais corretas acessa o CRM", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(TEST_ADMIN_EMAIL);
    await page.getByLabel("Senha").fill(TEST_ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/app\/hoje/);
    await expect(page.getByRole("heading", { name: "Central de hoje" })).toBeVisible();
  });

  test("login com senha incorreta mostra erro e não entra", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(TEST_ADMIN_EMAIL);
    await page.getByLabel("Senha").fill("senha-errada-123456");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("logout encerra a sessão e bloqueia rota interna", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(TEST_ADMIN_EMAIL);
    await page.getByLabel("Senha").fill(TEST_ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/app\/hoje/);

    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/app/hoje");
    await expect(page).toHaveURL(/\/login/);
  });
});
