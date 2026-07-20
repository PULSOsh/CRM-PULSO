import { expect, test } from "@playwright/test";

const OPP_TITLE = `Oportunidade Proposta ${Date.now()}`;
let lastProposalLink = "";

test.describe.serial("propostas", () => {
  test("bloqueia proposta sem briefing e depois cria após pular", async ({ page }) => {
    await page.goto("/app/comercial/oportunidades/novo");
    await page.getByLabel("Título").fill(OPP_TITLE);
    await page.getByLabel("Próxima ação (obrigatória)").fill("2026-08-01T10:00");
    await page.getByRole("button", { name: "Criar oportunidade" }).click();
    await expect(page).toHaveURL(/\/app\/comercial\/oportunidades\/[a-f0-9-]+$/);

    // sem briefing ainda -- deve bloquear
    await page.goto("/app/comercial/propostas/novo");
    await page.getByPlaceholder("Buscar oportunidade aberta por título").fill(OPP_TITLE);
    await page.getByRole("button", { name: "Buscar", exact: true }).click();
    await page.getByText(OPP_TITLE).click();
    await page.getByRole("button", { name: "Criar rascunho de proposta" }).click();
    await expect(page.getByText("não tem briefing concluído")).toBeVisible();

    // pula o briefing com justificativa (produto elegível já existe no seed: Link na Bio)
    await page.goto("/app/comercial/briefings/novo");
    const skipCard = page.locator("div", { has: page.getByRole("heading", { name: "Pular briefing" }) }).last();
    await skipCard.getByPlaceholder("Buscar oportunidade aberta por título").fill(OPP_TITLE);
    await skipCard.getByRole("button", { name: "Buscar", exact: true }).click();
    await skipCard.getByText(OPP_TITLE).click();
    await skipCard.locator("#skip-productId").selectOption({ label: "Link na Bio" });
    await skipCard.getByLabel("Justificativa (obrigatória, auditada)").fill("Serviço simples, cliente já enviou tudo por WhatsApp.");
    await skipCard.getByRole("button", { name: "Pular briefing" }).click();
    await expect(page.getByText(/Briefing BRF-\d{4}-\d{4} registrado como pulado/)).toBeVisible();
  });

  test("cria e publica a proposta com itens, adicionais e condições", async ({ page }) => {
    await page.goto("/app/comercial/propostas/novo");
    await page.getByPlaceholder("Buscar oportunidade aberta por título").fill(OPP_TITLE);
    await page.getByRole("button", { name: "Buscar", exact: true }).click();
    await page.getByText(OPP_TITLE).click();
    await page.getByRole("button", { name: "Criar rascunho de proposta" }).click();

    await expect(page).toHaveURL(/\/app\/comercial\/propostas\/[a-f0-9-]+\?link_token=/);

    await page.getByRole("button", { name: "Adicionar item" }).click();
    await page.getByPlaceholder("Descrição do item").fill("Site institucional completo");
    await page.getByPlaceholder("Preço").first().fill("2500");

    await page.getByRole("button", { name: "Adicionar", exact: true }).first().click();
    await page.getByPlaceholder("Nome do adicional").fill("Otimização SEO inicial");
    await page.getByPlaceholder("Preço").nth(1).fill("450");

    await page.getByRole("button", { name: "Salvar rascunho" }).click();
    await expect(page.getByText("R$ 2.500,00")).toBeVisible();

    await page.getByRole("button", { name: /Publicar versão/ }).click();
    await expect(page.getByText("Enviada", { exact: true })).toBeVisible();

    const linkInput = page.locator("input[readonly]");
    lastProposalLink = await linkInput.inputValue();
    expect(lastProposalLink).toContain("/proposta/");
  });

  test("cliente vê a proposta pública e aceita", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto(lastProposalLink);

    await expect(page.getByRole("heading", { name: "O que está incluído" }).first()).toBeVisible();
    await expect(page.getByText("Site institucional completo").first()).toBeVisible();

    await page.getByRole("button", { name: /Otimização SEO inicial/ }).click();
    await expect(page.getByText("R$ 2.950,00")).toBeVisible();

    await page.getByPlaceholder("Seu nome completo").fill("Maria Cliente");
    await page.getByPlaceholder("CPF/CNPJ (opcional)").fill("123.456.789-00");
    await page.getByText("Declaro que li e aceito").click();
    await page.getByRole("button", { name: "Aceitar proposta" }).click();

    await expect(page.getByRole("heading", { name: "Proposta já aceita" })).toBeVisible();
  });

  test("proposta aparece aceita no painel interno", async ({ page }) => {
    await page.goto("/app/comercial/propostas");
    await page.getByText(OPP_TITLE).click();

    await expect(page.getByText("Aceita", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Aceita por Maria Cliente")).toBeVisible();
  });
});
