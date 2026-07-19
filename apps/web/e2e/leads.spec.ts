import { expect, test } from "@playwright/test";

const LEAD_NAME = `Lead Playwright ${Date.now()}`;

test.describe.serial("leads", () => {
  test("cria um lead manualmente e vê o detalhe", async ({ page }) => {
    await page.goto("/app/comercial/leads/novo");
    await page.getByLabel("Nome").fill(LEAD_NAME);
    await page.getByLabel("Telefone").fill("85988887777");
    await page.getByLabel("E-mail").fill("playwright@pulso.local");
    await page.getByRole("button", { name: "Criar lead" }).click();

    await expect(page).toHaveURL(/\/app\/comercial\/leads\/[a-f0-9-]+$/);
    await expect(page.getByRole("heading", { name: LEAD_NAME })).toBeVisible();
    await expect(page.getByText("Novo", { exact: true })).toBeVisible();
  });

  test("encontra o lead na listagem pela busca", async ({ page }) => {
    await page.goto(`/app/comercial/leads?q=${encodeURIComponent(LEAD_NAME)}`);
    await expect(page.getByRole("link", { name: LEAD_NAME })).toBeVisible();
  });

  test("muda o status e converte em oportunidade", async ({ page }) => {
    await page.goto(`/app/comercial/leads?q=${encodeURIComponent(LEAD_NAME)}`);
    await page.getByRole("link", { name: LEAD_NAME }).click();

    await page.getByRole("button", { name: "Marcar como contatado" }).click();
    await expect(page.getByText("Contatado", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Converter em oportunidade" }).click();
    await expect(page).toHaveURL(/\/app\/comercial\/oportunidades\/[a-f0-9-]+$/);
  });
});
