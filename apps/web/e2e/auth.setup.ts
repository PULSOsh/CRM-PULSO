import { expect, test as setup } from "@playwright/test";

const authFile = "playwright/.auth/user.json";
const TEST_ADMIN_EMAIL = "admin.e2e@pulso.local";
const TEST_ADMIN_PASSWORD = "senha-de-teste-e2e-123";

setup("autenticar como administrador de teste", async ({ page }) => {
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
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(TEST_ADMIN_EMAIL);
    await page.getByLabel("Senha").fill(TEST_ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/app\/hoje/);
  }

  await page.context().storageState({ path: authFile });
});
