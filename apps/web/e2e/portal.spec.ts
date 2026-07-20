import { expect, test } from "@playwright/test";

const OPP_TITLE = `Oportunidade Portal ${Date.now()}`;
const CONTACT_NAME = `Contato Portal ${Date.now()}`;
const PORTAL_EMAIL = `cliente.portal.${Date.now()}@example.com`;
const PORTAL_PASSWORD = "SenhaForte123";
let projectUrl = "";
let companyName = "";
let activationLink = "";
let portalUserUrl = "";
let ticketUrl = "";
const TICKET_TITLE = `Dúvida sobre o projeto ${Date.now()}`;

test.describe.serial("portal do cliente e suporte", () => {
  test("prepara contato, empresa vinculada e oportunidade até projeto gerado", async ({ page }) => {
    companyName = `Empresa Portal ${Date.now()}`;

    await page.goto("/app/comercial/contatos/novo");
    await page.getByLabel("Nome").fill(CONTACT_NAME);
    await page.getByLabel("E-mail").fill(`${Date.now()}@playwright.local`);
    await page.getByRole("button", { name: "Criar contato" }).click();
    await expect(page).toHaveURL(/\/app\/comercial\/contatos\/[a-f0-9-]+$/);

    await page.goto("/app/comercial/contatos/empresas/novo");
    await page.getByLabel("Nome fantasia").fill(companyName);
    await page.getByRole("button", { name: "Criar empresa" }).click();
    await expect(page).toHaveURL(/\/app\/comercial\/contatos\/empresas\/[a-f0-9-]+$/);

    await page.getByPlaceholder("Buscar por nome ou e-mail").fill(CONTACT_NAME);
    await page.getByRole("button", { name: "Buscar", exact: true }).click();
    await expect(page.getByText(CONTACT_NAME)).toBeVisible();
    await page.getByRole("button", { name: "Vincular" }).click();
    await expect(page.getByRole("link", { name: new RegExp(CONTACT_NAME) })).toBeVisible();

    await page.goto("/app/comercial/oportunidades/novo");
    await page.getByLabel("Título").fill(OPP_TITLE);
    await page.getByPlaceholder("Buscar contato por nome ou e-mail").fill(CONTACT_NAME);
    await page.getByRole("button", { name: "Buscar", exact: true }).click();
    await page.getByText(CONTACT_NAME).click();
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
    await page.getByPlaceholder("Seu nome completo").fill("Cliente Portal");
    await page.getByPlaceholder("CPF/CNPJ (opcional)").fill("222.333.444-55");
    await page.getByText("Declaro que li e aceito").click();
    await page.getByRole("button", { name: "Aceitar proposta" }).click();
    await expect(page.getByRole("heading", { name: "Proposta já aceita" })).toBeVisible();
  });

  test("gera contrato, assina e cria o projeto", async ({ page }) => {
    await page.goto("/app/comercial/contratos/novo");
    await page.getByText(OPP_TITLE).locator("../..").getByRole("button", { name: "Gerar contrato" }).click();
    await expect(page).toHaveURL(/\/app\/comercial\/contratos\/[a-f0-9-]+$/);
    await page.getByRole("button", { name: "Revisar e enviar para assinatura" }).click();
    const contractLink = await page.locator("input[readonly]").inputValue();

    await page.context().clearCookies();
    await page.goto(contractLink);
    await page.getByPlaceholder("Nome completo").fill("Cliente Portal");
    await page.getByPlaceholder("CPF/CNPJ").fill("222.333.444-55");
    await page.getByText("Declaro que li e assino").click();
    await page.getByRole("button", { name: "Assinar contrato" }).click();
    await expect(page.getByText("Aguardando assinatura da PULSO para finalizar.")).toBeVisible();
  });

  test("admin assina e gera o projeto", async ({ page }) => {
    await page.goto("/app/comercial/contratos");
    await page.getByText(OPP_TITLE).click();
    await page.getByPlaceholder("Nome completo").fill("Administrador E2E");
    await page.getByText("Declaro que li e assino este contrato.").click();
    await page.getByRole("button", { name: "Assinar", exact: true }).click();
    await expect(page.getByText("Contrato assinado")).toBeVisible();

    await page.goto("/app/operacao/projetos/novo");
    await page.getByText(OPP_TITLE).locator("../..").getByRole("button", { name: "Gerar projeto" }).click();
    await expect(page).toHaveURL(/\/app\/operacao\/projetos\/[a-f0-9-]+$/);
    projectUrl = page.url();
  });

  test("convida usuário do portal, concede acesso ao projeto", async ({ page }) => {
    await page.goto("/app/relacionamento/portal/novo");
    await page.getByPlaceholder("Buscar empresa por nome").fill(companyName);
    await page.getByRole("button", { name: "Buscar", exact: true }).click();
    await page.getByText(companyName).click();
    await page.getByLabel("Nome").fill("Cliente Portal");
    await page.getByLabel("E-mail").fill(PORTAL_EMAIL);
    await page.getByRole("button", { name: "Gerar convite" }).click();

    await expect(page).toHaveURL(/invite_link_token=/);
    activationLink = await page.locator("input[readonly]").inputValue();
    expect(activationLink).toContain("/portal/ativar/");
    portalUserUrl = page.url().split("?")[0];

    await page.getByRole("button", { name: "Conceder acesso" }).click();
    await expect(page.getByRole("button", { name: "Remover acesso" })).toBeVisible();
  });

  test("cliente ativa a conta e faz login no portal", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto(activationLink);
    await expect(page.getByRole("heading", { name: /Olá, Cliente Portal/ })).toBeVisible();
    await page.getByLabel("Nova senha").fill(PORTAL_PASSWORD);
    await page.getByLabel("Confirmar senha").fill(PORTAL_PASSWORD);
    await page.getByRole("button", { name: "Ativar conta" }).click();
    await expect(page).toHaveURL(/\/portal\/login/);

    await page.getByLabel("E-mail").fill(PORTAL_EMAIL);
    await page.getByLabel("Senha").fill(PORTAL_PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByRole("heading", { name: /Olá, Cliente Portal/ })).toBeVisible();
    await expect(page.getByText(OPP_TITLE)).toBeVisible();
  });

  test("cliente vê o projeto no portal e aprova um item", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/portal/login");
    await page.getByLabel("E-mail").fill(PORTAL_EMAIL);
    await page.getByLabel("Senha").fill(PORTAL_PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();

    await page.getByText(OPP_TITLE).click();
    await expect(page.getByRole("heading", { name: OPP_TITLE })).toBeVisible();
    await expect(page.getByText("Nenhuma aprovação ainda.")).toBeVisible();
  });

  test("cliente abre um chamado de suporte", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/portal/login");
    await page.getByLabel("E-mail").fill(PORTAL_EMAIL);
    await page.getByLabel("Senha").fill(PORTAL_PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL("/portal");

    await page.goto("/portal/suporte/novo");
    await page.getByLabel("Título").fill(TICKET_TITLE);
    await page.getByLabel("O que está acontecendo?").fill("Quando fica pronta a primeira versão?");
    await page.getByRole("button", { name: "Abrir chamado" }).click();
    await expect(page).toHaveURL(/\/portal\/suporte\/[a-f0-9-]+$/);
    ticketUrl = page.url();
  });

  test("admin responde ao chamado com nota interna e mensagem ao cliente", async ({ page }) => {
    await page.goto("/app/operacao/suporte");
    await expect(page.getByText(TICKET_TITLE)).toBeVisible();
    await page.getByText(TICKET_TITLE).click();

    await page.locator("textarea[name='body']").fill("Nota interna: aguardando aprovação do escopo.");
    await page.locator("select[name='visibility']").selectOption("internal");
    await page.getByRole("button", { name: "Enviar" }).click();
    await expect(page.getByText("Nota interna: aguardando aprovação do escopo.")).toBeVisible();
    await expect(page.getByText("Nota interna", { exact: true })).toBeVisible();

    await page.locator("textarea[name='body']").fill("A primeira versão fica pronta na próxima semana.");
    await page.locator("select[name='visibility']").selectOption("client");
    await page.getByRole("button", { name: "Enviar" }).click();
    await expect(page.getByText("A primeira versão fica pronta na próxima semana.")).toBeVisible();
  });

  test("cliente vê a resposta mas nunca a nota interna", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/portal/login");
    await page.getByLabel("E-mail").fill(PORTAL_EMAIL);
    await page.getByLabel("Senha").fill(PORTAL_PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL("/portal");
    await page.goto(ticketUrl);

    await expect(page.getByText("A primeira versão fica pronta na próxima semana.")).toBeVisible();
    await expect(page.getByText("Nota interna: aguardando aprovação do escopo.")).toHaveCount(0);
  });

  test("admin revoga o acesso e o cliente é bloqueado", async ({ page }) => {
    await page.goto(portalUserUrl);
    await page.getByPlaceholder("Motivo da revogação").fill("Fim do contrato de teste.");
    await page.getByRole("button", { name: "Revogar acesso ao portal" }).click();
    await expect(page.getByText("Revogado", { exact: true })).toBeVisible();

    await page.context().clearCookies();
    await page.goto("/portal/login");
    await page.getByLabel("E-mail").fill(PORTAL_EMAIL);
    await page.getByLabel("Senha").fill(PORTAL_PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText("E-mail ou senha incorretos.")).toBeVisible();
  });
});
