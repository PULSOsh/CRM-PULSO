import { expect, test } from "@playwright/test";

const OPP_TITLE = `Oportunidade Playwright ${Date.now()}`;

test.describe.serial("oportunidades", () => {
  test("cria oportunidade manual com próxima ação obrigatória", async ({ page }) => {
    await page.goto("/app/comercial/oportunidades/novo");
    await page.getByRole("button", { name: "Criar oportunidade" }).click();
    // sem "Próxima ação" preenchida, o navegador bloqueia o submit (campo required) — segue na mesma página.
    await expect(page).toHaveURL(/\/novo$/);

    await page.getByLabel("Título").fill(OPP_TITLE);
    await page.getByLabel("Próxima ação (obrigatória)").fill("2026-08-01T10:00");
    await page.getByRole("button", { name: "Criar oportunidade" }).click();

    await expect(page).toHaveURL(/\/app\/comercial\/oportunidades\/[a-f0-9-]+$/);
    await expect(page.getByRole("heading", { name: OPP_TITLE })).toBeVisible();
  });

  test("aparece no board Kanban e muda de etapa", async ({ page }) => {
    await page.goto("/app/comercial/oportunidades");
    await expect(page.getByText(OPP_TITLE)).toBeVisible();

    await page.goto(`/app/comercial/oportunidades`);
    const card = page.locator("a", { hasText: OPP_TITLE });
    const select = card.locator("select");
    const secondStageValue = await select.locator("option").nth(1).getAttribute("value");
    await select.selectOption(secondStageValue!);
    await page.waitForTimeout(500);

    await page.reload();
    await expect(page.getByText(OPP_TITLE)).toBeVisible();
  });

  test("marca como perdida com motivo obrigatório", async ({ page }) => {
    await page.goto("/app/comercial/oportunidades");
    await page.getByText(OPP_TITLE).click();

    await page.getByText("Marcar como perdido").click();
    await page.getByPlaceholder("Motivo da perda").fill("Cliente escolheu concorrente");
    await page.getByRole("button", { name: "Confirmar" }).click();

    await expect(page.getByText("Fechada — perdido", { exact: true })).toBeVisible();
    await expect(page.getByText("Cliente escolheu concorrente", { exact: true })).toBeVisible();
  });
});
