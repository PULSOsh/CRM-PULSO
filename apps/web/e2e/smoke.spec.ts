import { expect, test } from "@playwright/test";

// Precisa começar deslogado para testar o bloqueio — sobrescreve o storageState autenticado padrão.
test.use({ storageState: { cookies: [], origins: [] } });

test("rota interna exige login", async ({ page }) => {
  await page.goto("/app/hoje");
  await expect(page).toHaveURL(/\/login\?redirect=%2Fapp%2Fhoje/);
});

// A proposta pública agora é 100% dado real (ver apps/web/e2e/propostas.spec.ts para o fluxo
// completo); aqui só confirmamos que a rota pública responde de forma segura sem token/slug válido.
test("proposta pública sem token válido mostra link inválido, não quebra", async ({ page }) => {
  await page.goto("/proposta/inexistente");
  await expect(page.getByRole("heading", { name: "Link inválido ou expirado" })).toBeVisible();
});
