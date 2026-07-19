import { expect, test } from "@playwright/test";

const CONTACT_NAME = `Contato Playwright ${Date.now()}`;
const COMPANY_NAME = `Empresa Playwright ${Date.now()}`;

test.describe.serial("contatos e empresas", () => {
  test("cria um contato e edita os dados", async ({ page }) => {
    await page.goto("/app/comercial/contatos/novo");
    await page.getByLabel("Nome").fill(CONTACT_NAME);
    await page.getByLabel("E-mail").fill(`${Date.now()}@playwright.local`);
    await page.getByRole("button", { name: "Criar contato" }).click();

    await expect(page).toHaveURL(/\/app\/comercial\/contatos\/[a-f0-9-]+$/);
    await expect(page.getByRole("heading", { name: CONTACT_NAME })).toBeVisible();

    await page.getByLabel("Cidade").fill("Fortaleza");
    await page.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(page.getByLabel("Cidade")).toHaveValue("Fortaleza");
  });

  test("bloqueia criação de contato duplicado por e-mail", async ({ page }) => {
    const email = `dup-${Date.now()}@playwright.local`;
    await page.goto("/app/comercial/contatos/novo");
    await page.getByLabel("Nome").fill("Primeiro Cadastro");
    await page.getByLabel("E-mail").fill(email);
    await page.getByRole("button", { name: "Criar contato" }).click();
    await expect(page).toHaveURL(/\/app\/comercial\/contatos\/[a-f0-9-]+$/);

    await page.goto("/app/comercial/contatos/novo");
    await page.getByLabel("Nome").fill("Segundo Cadastro");
    await page.getByLabel("E-mail").fill(email);
    await page.getByRole("button", { name: "Criar contato" }).click();
    await expect(page.getByText("Já existe um contato")).toBeVisible();
  });

  test("cria uma empresa e vincula o contato criado", async ({ page }) => {
    await page.goto("/app/comercial/contatos/empresas/novo");
    await page.getByLabel("Nome fantasia").fill(COMPANY_NAME);
    await page.getByRole("button", { name: "Criar empresa" }).click();

    await expect(page).toHaveURL(/\/app\/comercial\/contatos\/empresas\/[a-f0-9-]+$/);
    await expect(page.getByRole("heading", { name: COMPANY_NAME })).toBeVisible();

    await page.getByPlaceholder("Buscar por nome ou e-mail").fill(CONTACT_NAME);
    await page.getByRole("button", { name: "Buscar", exact: true }).click();
    await expect(page.getByText(CONTACT_NAME)).toBeVisible();
    await page.getByRole("button", { name: "Vincular" }).click();

    await expect(page.getByRole("link", { name: new RegExp(CONTACT_NAME) })).toBeVisible();
  });

  test("encontra contato e empresa na listagem", async ({ page }) => {
    await page.goto(`/app/comercial/contatos?tab=contatos&q=${encodeURIComponent(CONTACT_NAME)}`);
    await expect(page.getByRole("link", { name: CONTACT_NAME })).toBeVisible();

    await page.goto(`/app/comercial/contatos?tab=empresas&q=${encodeURIComponent(COMPANY_NAME)}`);
    await expect(page.getByRole("link", { name: COMPANY_NAME })).toBeVisible();
  });
});
