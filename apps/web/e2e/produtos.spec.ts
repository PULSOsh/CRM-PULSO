import { expect, test } from "@playwright/test";

const PRODUCT_CODE = `PROD-E2E-${Date.now()}`;
const PRODUCT_NAME = `Produto Playwright ${Date.now()}`;

test.describe.serial("produtos", () => {
  test("lista os produtos do seed", async ({ page }) => {
    await page.goto("/app/comercial/produtos");
    await expect(page.getByRole("link", { name: "Site Institucional" })).toBeVisible();
  });

  test("cria um produto e bloqueia código duplicado", async ({ page }) => {
    await page.goto("/app/comercial/produtos/novo");
    await page.getByLabel("Código").fill(PRODUCT_CODE);
    await page.getByLabel("Categoria").fill("Testes");
    await page.getByLabel("Nome").fill(PRODUCT_NAME);
    await page.getByLabel("Preço base (R$)").fill("999,00");
    await page.getByRole("button", { name: "Criar produto" }).click();

    await expect(page).toHaveURL(/\/app\/comercial\/produtos\/[a-f0-9-]+$/);
    await expect(page.getByRole("heading", { name: PRODUCT_NAME })).toBeVisible();

    await page.goto("/app/comercial/produtos/novo");
    await page.getByLabel("Código").fill(PRODUCT_CODE);
    await page.getByLabel("Categoria").fill("Testes");
    await page.getByLabel("Nome").fill("Outro nome");
    await page.getByLabel("Preço base (R$)").fill("1,00");
    await page.getByRole("button", { name: "Criar produto" }).click();
    await expect(page.getByText("Já existe um produto com o código")).toBeVisible();
  });

  test("arquiva e duplica o produto", async ({ page }) => {
    await page.goto(`/app/comercial/produtos?q=${encodeURIComponent(PRODUCT_NAME)}`);
    await page.getByRole("link", { name: PRODUCT_NAME }).click();

    await page.getByRole("button", { name: "Arquivar" }).click();
    await expect(page.getByText("Arquivado", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Duplicar" }).click();
    await expect(page).toHaveURL(/\/app\/comercial\/produtos\/[a-f0-9-]+$/);
    await expect(page.getByRole("heading", { name: `${PRODUCT_NAME} (cópia)` })).toBeVisible();
  });
});
