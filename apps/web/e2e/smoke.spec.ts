import { expect, test } from "@playwright/test";

// Precisa começar deslogado para testar o bloqueio — sobrescreve o storageState autenticado padrão.
test.use({ storageState: { cookies: [], origins: [] } });

test("rota interna exige login", async ({ page }) => {
  await page.goto("/app/hoje");
  await expect(page).toHaveURL(/\/login\?redirect=%2Fapp%2Fhoje/);
});

test("abre proposta pública", async ({ page }) => {
  await page.goto("/proposta/demo");
  await expect(page.getByRole("heading", { name: /site que transforma confiança/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Aceitar proposta/i })).toBeVisible();
});
