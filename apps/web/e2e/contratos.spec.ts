import { expect, test } from "@playwright/test";

const OPP_TITLE = `Oportunidade Contrato ${Date.now()}`;
let lastContractLink = "";

test.describe.serial("contratos", () => {
  test("prepara oportunidade, pula briefing, publica e aceita proposta", async ({ page }) => {
    await page.goto("/app/comercial/oportunidades/novo");
    await page.getByLabel("Título").fill(OPP_TITLE);
    await page.getByLabel("Próxima ação (obrigatória)").fill("2026-08-01T10:00");
    await page.getByRole("button", { name: "Criar oportunidade" }).click();
    await expect(page).toHaveURL(/\/app\/comercial\/oportunidades\/[a-f0-9-]+$/);

    await page.goto("/app/comercial/briefings/novo");
    const skipCard = page.locator("div", { has: page.getByRole("heading", { name: "Pular briefing" }) }).last();
    await skipCard.getByPlaceholder("Buscar oportunidade aberta por título").fill(OPP_TITLE);
    await skipCard.getByRole("button", { name: "Buscar", exact: true }).click();
    await skipCard.getByText(OPP_TITLE).click();
    await skipCard.locator("#skip-productId").selectOption({ label: "Link na Bio" });
    await skipCard.getByLabel("Justificativa (obrigatória, auditada)").fill("Serviço simples.");
    await skipCard.getByRole("button", { name: "Pular briefing" }).click();
    await expect(page.getByText(/Briefing BRF-\d{4}-\d{4} registrado como pulado/)).toBeVisible();

    await page.goto("/app/comercial/propostas/novo");
    await page.getByPlaceholder("Buscar oportunidade aberta por título").fill(OPP_TITLE);
    await page.getByRole("button", { name: "Buscar", exact: true }).click();
    await page.getByText(OPP_TITLE).click();
    await page.getByRole("button", { name: "Criar rascunho de proposta" }).click();
    await expect(page).toHaveURL(/\/app\/comercial\/propostas\/[a-f0-9-]+\?link_token=/);

    await page.getByRole("button", { name: "Adicionar item" }).click();
    await page.getByPlaceholder("Descrição do item").fill("Link na Bio");
    await page.getByPlaceholder("Preço").first().fill("197");
    await page.getByRole("button", { name: "Salvar rascunho" }).click();
    await expect(page.getByText("R$ 197,00")).toBeVisible();
    await page.getByRole("button", { name: /Publicar versão/ }).click();
    await expect(page.getByText("Enviada", { exact: true })).toBeVisible();

    const proposalLink = await page.locator("input[readonly]").inputValue();

    await page.context().clearCookies();
    await page.goto(proposalLink);
    await page.getByPlaceholder("Seu nome completo").fill("Carlos Cliente");
    await page.getByPlaceholder("CPF/CNPJ (opcional)").fill("987.654.321-00");
    await page.getByText("Declaro que li e aceito").click();
    await page.getByRole("button", { name: "Aceitar proposta" }).click();
    await expect(page.getByRole("heading", { name: "Proposta já aceita" })).toBeVisible();
  });

  test("gera contrato a partir da proposta aceita e envia para assinatura", async ({ page }) => {
    await page.goto("/app/comercial/contratos/novo");
    await expect(page.getByText(OPP_TITLE)).toBeVisible();
    await page.getByText(OPP_TITLE).locator("../..").getByRole("button", { name: "Gerar contrato" }).click();

    await expect(page).toHaveURL(/\/app\/comercial\/contratos\/[a-f0-9-]+$/);
    await expect(page.getByText("Carlos Cliente")).toBeVisible();
    await expect(page.getByText("PULSO (PULSO)")).toBeVisible();

    await page.getByRole("button", { name: "Revisar e enviar para assinatura" }).click();
    await expect(page.getByText("Enviado", { exact: true })).toBeVisible();

    lastContractLink = await page.locator("input[readonly]").inputValue();
    expect(lastContractLink).toContain("/contrato/");
  });

  test("cliente assina publicamente sem sessão interna", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto(lastContractLink);

    await expect(page.getByRole("heading", { name: "Contrato de prestação de serviços" })).toBeVisible();
    await page.getByPlaceholder("Nome completo").fill("Carlos Cliente");
    await page.getByPlaceholder("CPF/CNPJ").fill("987.654.321-00");
    await page.getByText("Declaro que li e assino").click();
    await page.getByRole("button", { name: "Assinar contrato" }).click();

    await expect(page.getByText("Aguardando assinatura da PULSO para finalizar.")).toBeVisible();
  });

  test("admin assina internamente e o contrato fica totalmente assinado", async ({ page }) => {
    await page.goto("/app/comercial/contratos");
    await page.getByText(OPP_TITLE).click();

    await page.getByPlaceholder("Nome completo").fill("Administrador E2E");
    await page.getByText("Declaro que li e assino este contrato.").click();
    await page.getByRole("button", { name: "Assinar", exact: true }).click();

    await expect(page.getByText("Assinado", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Contrato assinado")).toBeVisible();
  });
});
