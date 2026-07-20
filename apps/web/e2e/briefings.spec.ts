import { expect, test } from "@playwright/test";

const OPP_TITLE = `Oportunidade Briefing ${Date.now()}`;
let lastBriefingLink = "";

test.describe.serial("briefings", () => {
  test("gera link de briefing para uma oportunidade", async ({ page }) => {
    await page.goto("/app/comercial/oportunidades/novo");
    await page.getByLabel("Título").fill(OPP_TITLE);
    await page.getByLabel("Próxima ação (obrigatória)").fill("2026-08-01T10:00");
    await page.getByRole("button", { name: "Criar oportunidade" }).click();
    await expect(page).toHaveURL(/\/app\/comercial\/oportunidades\/[a-f0-9-]+$/);

    await page.goto("/app/comercial/briefings/novo");
    const sendCard = page.locator("div", { has: page.getByRole("heading", { name: "Enviar briefing" }) }).last();
    await sendCard.getByPlaceholder("Buscar oportunidade aberta por título").fill(OPP_TITLE);
    await sendCard.getByRole("button", { name: "Buscar", exact: true }).click();
    await sendCard.getByText(OPP_TITLE).click();
    await sendCard.getByRole("button", { name: "Gerar link do briefing" }).click();

    await expect(page.getByText(/Briefing BRF-\d{4}-\d{4} criado/)).toBeVisible();
    const linkInput = page.locator("input[readonly]");
    const fullLink = await linkInput.inputValue();
    expect(fullLink).toContain("/briefing/");
    expect(fullLink).toContain("token=");

    lastBriefingLink = fullLink;
  });

  test("cliente responde e conclui o briefing sem sessão interna", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto(lastBriefingLink);

    await expect(page.getByRole("heading", { name: "Vamos entender seu projeto." })).toBeVisible();

    await page.getByLabel("Qual o principal objetivo deste projeto? *").fill("Aumentar vendas online");
    await page.getByLabel("Quem é o público-alvo? *").fill("Jovens de 20 a 35 anos");
    await page.getByLabel("Quais são os diferenciais do seu negócio? *").fill("Atendimento rápido e personalizado");
    await page.getByText("Sim", { exact: true }).click();
    await page.getByText("Gerar contatos", { exact: true }).click();

    await page.getByRole("button", { name: "Concluir briefing" }).click();
    await expect(page.getByRole("heading", { name: "Briefing já concluído" })).toBeVisible();
  });

  test("briefing aparece concluído no painel interno", async ({ page }) => {
    await page.goto("/app/comercial/briefings");
    await expect(page.getByText(OPP_TITLE)).toBeVisible();

    await page.getByText(OPP_TITLE).click();
    await expect(page.getByText("Concluído", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Aumentar vendas online")).toBeVisible();

    await page.getByRole("button", { name: "Marcar como analisado" }).click();
    await expect(page.getByText("Analisado", { exact: true })).toBeVisible();
  });
});
