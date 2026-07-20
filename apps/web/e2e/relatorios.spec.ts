import { expect, request as playwrightRequest, test } from "@playwright/test";
import { db, pool, schema } from "@pulso/database";
import { eq } from "drizzle-orm";

const STAMP = Date.now();
const LEAD_NAME = `Relatórios lead ${STAMP}`;
const PROJECT_OPPORTUNITY_TITLE = `Relatórios projeto ${STAMP}`;
const APPROVAL_TITLE = `Relatórios aprovação ${STAMP}`;
const TIME_ENTRY_DESCRIPTION = `Relatórios horas ${STAMP}`;
const COMPANY_FINANCIAL_DESCRIPTION = `Relatórios financeiro empresarial ${STAMP}`;
const PERSONAL_FINANCIAL_DESCRIPTION = `Relatórios financeiro pessoal ${STAMP}`;
const PERIOD_SAFE_DATE = new Date(Date.now() - 7 * 24 * 60 * 60 * 1_000).toISOString().slice(0, 10);
const TEST_ADMIN_EMAIL = "admin.e2e@pulso.local";
const TEST_ADMIN_PASSWORD = "senha-de-teste-e2e-123";
const OPPORTUNITY_TITLE = `Relatórios oportunidade ${STAMP}`;
const COMPANY_NAME = `Relatórios empresa ${STAMP}`;
const TICKET_TITLE = `Relatórios chamado ${STAMP}`;
const PORTAL_USER_NAME = `Cliente relatórios ${STAMP}`;
const PORTAL_EMAIL = `relatorios.portal.${STAMP}@playwright.local`;
const PORTAL_PASSWORD = "SenhaForte123";
const PORTAL_TICKET_TITLE = `Relatórios chamado portal ${STAMP}`;

test.afterAll(async () => {
  try { await pool.end(); } catch (err) {}
});

test.describe("API de exportação de relatórios", () => {
  test("rejeita sessão e parâmetros inválidos e baixa CSV autenticado", async ({ page }) => {
    const anonymousRequest = await playwrightRequest.newContext({
      baseURL: `http://127.0.0.1:${process.env.PORT ?? "3000"}`,
      storageState: { cookies: [], origins: [] }
    });

    try {
      expect((await anonymousRequest.storageState()).cookies).toHaveLength(0);
      const unauthorized = await anonymousRequest.get(
        "/api/reports/export?report=commercial&period=30d"
      );
      expect(unauthorized.status()).toBe(401);
    } finally {
      await anonymousRequest.dispose();
    }

    await page.goto("/app/hoje");
    const invalid = await page.evaluate(async () => {
      const response = await fetch("/api/reports/export?report=unknown&period=30d");
      return { status: response.status };
    });
    expect(invalid.status).toBe(400);

    const download = await page.evaluate(async () => {
      const response = await fetch("/api/reports/export?report=commercial&period=30d");
      return {
        status: response.status,
        contentType: response.headers.get("content-type"),
        contentDisposition: response.headers.get("content-disposition"),
        cacheControl: response.headers.get("cache-control"),
        body: await response.text()
      };
    });

    expect(download.status).toBe(200);
    expect(download.contentType).toBe("text/csv; charset=utf-8");
    expect(download.contentDisposition).toBe(
      'attachment; filename="relatorio-commercial-30d.csv"'
    );
    expect(download.cacheControl).toBe("private, no-store");
    expect(download.body.startsWith("\"tipo\";\"codigo\";\"titulo\"")).toBe(true);
  });
});

test.describe.serial("preparação de dados para relatórios", () => {
  test("persiste o fechamento da oportunidade e o ciclo resolvido/reaberto do chamado", async ({ page }) => {
    await page.goto("/app/comercial/oportunidades/novo");
    await page.getByLabel("Título").fill(OPPORTUNITY_TITLE);
    await page.getByLabel("Próxima ação (obrigatória)").fill("2026-08-01T10:00");
    await page.getByRole("button", { name: "Criar oportunidade" }).click();
    await expect(page).toHaveURL(/\/app\/comercial\/oportunidades\/[a-f0-9-]+$/);

    const opportunityId = page.url().split("/").at(-1);
    expect(opportunityId).toBeTruthy();

    await page.getByRole("button", { name: "Marcar como ganho" }).click();
    await expect(page.getByText("Fechada — ganho", { exact: true }).first()).toBeVisible();

    const [opportunity] = await db.select({
      status: schema.opportunities.status,
      closedAt: schema.opportunities.closedAt
    }).from(schema.opportunities).where(eq(schema.opportunities.id, opportunityId!)).limit(1);
    expect(opportunity?.status).toBe("won");
    expect(opportunity?.closedAt).toBeInstanceOf(Date);

    await page.goto("/app/comercial/contatos/empresas/novo");
    await page.getByLabel("Nome fantasia").fill(COMPANY_NAME);
    await page.getByRole("button", { name: "Criar empresa" }).click();
    await expect(page).toHaveURL(/\/app\/comercial\/contatos\/empresas\/[a-f0-9-]+$/);

    await page.goto("/app/operacao/suporte/novo");
    await page.getByPlaceholder("Buscar empresa por nome").fill(COMPANY_NAME);
    await page.getByRole("button", { name: "Buscar", exact: true }).click();
    await page.getByText(COMPANY_NAME, { exact: true }).click();
    await page.getByLabel("Título").fill(TICKET_TITLE);
    await page.getByLabel("Descrição").fill("Chamado criado para validar os timestamps de resolução.");
    await page.getByRole("button", { name: "Criar chamado" }).click();
    await expect(page).toHaveURL(/\/app\/operacao\/suporte\/[a-f0-9-]+$/);

    const ticketId = page.url().split("/").at(-1);
    expect(ticketId).toBeTruthy();

    const [createdTicket] = await db.select({
      status: schema.tickets.status,
      resolutionStartedAt: schema.tickets.resolutionStartedAt,
      resolvedAt: schema.tickets.resolvedAt
    }).from(schema.tickets).where(eq(schema.tickets.id, ticketId!)).limit(1);
    expect(createdTicket?.status).toBe("new");
    expect(createdTicket?.resolutionStartedAt).toBeInstanceOf(Date);
    expect(createdTicket?.resolvedAt).toBeNull();

    await page.locator("select[name='status']").selectOption("resolved");
    await page.getByRole("button", { name: "Atualizar status" }).click();
    await expect(page.getByText("Atual: Resolvido", { exact: true })).toBeVisible();

    const [resolvedTicket] = await db.select({
      resolutionStartedAt: schema.tickets.resolutionStartedAt,
      resolvedAt: schema.tickets.resolvedAt
    }).from(schema.tickets).where(eq(schema.tickets.id, ticketId!)).limit(1);
    expect(resolvedTicket?.resolutionStartedAt).toBeInstanceOf(Date);
    expect(resolvedTicket?.resolvedAt).toBeInstanceOf(Date);

    await page.locator("select[name='status']").selectOption("closed");
    await page.getByRole("button", { name: "Atualizar status" }).click();
    await expect(page.getByText("Atual: Encerrado", { exact: true })).toBeVisible();

    const [closedTicket] = await db.select({
      resolutionStartedAt: schema.tickets.resolutionStartedAt,
      resolvedAt: schema.tickets.resolvedAt
    }).from(schema.tickets).where(eq(schema.tickets.id, ticketId!)).limit(1);
    expect(closedTicket?.resolutionStartedAt).toEqual(resolvedTicket?.resolutionStartedAt);
    expect(closedTicket?.resolvedAt).toEqual(resolvedTicket?.resolvedAt);

    await page.locator("select[name='status']").selectOption("new");
    await page.getByRole("button", { name: "Atualizar status" }).click();
    await expect(page.getByText("Atual: Novo", { exact: true })).toBeVisible();

    const [reopenedTicket] = await db.select({
      status: schema.tickets.status,
      resolutionStartedAt: schema.tickets.resolutionStartedAt,
      resolvedAt: schema.tickets.resolvedAt
    }).from(schema.tickets).where(eq(schema.tickets.id, ticketId!)).limit(1);
    expect(reopenedTicket?.status).toBe("new");
    expect(reopenedTicket?.resolutionStartedAt).toBeInstanceOf(Date);
    expect(reopenedTicket?.resolutionStartedAt?.getTime()).toBeGreaterThanOrEqual(resolvedTicket?.resolvedAt?.getTime() ?? 0);
    expect(reopenedTicket?.resolvedAt).toBeNull();

    await page.goto("/app/relacionamento/portal/novo");
    await page.getByPlaceholder("Buscar empresa por nome").fill(COMPANY_NAME);
    await page.getByRole("button", { name: "Buscar", exact: true }).click();
    await page.getByText(COMPANY_NAME, { exact: true }).click();
    await page.getByLabel("Nome").fill(PORTAL_USER_NAME);
    await page.getByLabel("E-mail").fill(PORTAL_EMAIL);
    await page.getByRole("button", { name: "Gerar convite" }).click();
    await expect(page).toHaveURL(/\/app\/relacionamento\/portal\/[a-f0-9-]+\?invite_link_token=/);

    const activationLink = await page.locator("input[readonly]").inputValue();
    await page.goto(activationLink);
    await page.getByLabel("Nova senha").fill(PORTAL_PASSWORD);
    await page.getByLabel("Confirmar senha").fill(PORTAL_PASSWORD);
    await page.getByRole("button", { name: "Ativar conta" }).click();
    await expect(page).toHaveURL("/portal/login");

    await page.getByLabel("E-mail").fill(PORTAL_EMAIL);
    await page.getByLabel("Senha").fill(PORTAL_PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL("/portal");

    await page.goto("/portal/suporte/novo");
    await page.getByLabel("Título").fill(PORTAL_TICKET_TITLE);
    await page.getByLabel("O que está acontecendo?").fill("Chamado do portal para validar a reabertura do ciclo de resolução.");
    await page.getByRole("button", { name: "Abrir chamado" }).click();
    await expect(page).toHaveURL(/\/portal\/suporte\/[a-f0-9-]+$/);

    const portalTicketId = page.url().split("/").at(-1);
    expect(portalTicketId).toBeTruthy();

    const [portalCreatedTicket] = await db.select({
      status: schema.tickets.status,
      resolutionStartedAt: schema.tickets.resolutionStartedAt,
      resolvedAt: schema.tickets.resolvedAt
    }).from(schema.tickets).where(eq(schema.tickets.id, portalTicketId!)).limit(1);
    expect(portalCreatedTicket?.status).toBe("new");
    expect(portalCreatedTicket?.resolutionStartedAt).toBeInstanceOf(Date);
    expect(portalCreatedTicket?.resolvedAt).toBeNull();

    await page.goto(`/app/operacao/suporte/${portalTicketId}`);
    await page.locator("select[name='status']").selectOption("resolved");
    await page.getByRole("button", { name: "Atualizar status" }).click();
    await expect(page.getByText("Atual: Resolvido", { exact: true })).toBeVisible();
    await page.locator("select[name='status']").selectOption("closed");
    await page.getByRole("button", { name: "Atualizar status" }).click();
    await expect(page.getByText("Atual: Encerrado", { exact: true })).toBeVisible();

    const [portalClosedTicket] = await db.select({
      resolutionStartedAt: schema.tickets.resolutionStartedAt,
      resolvedAt: schema.tickets.resolvedAt
    }).from(schema.tickets).where(eq(schema.tickets.id, portalTicketId!)).limit(1);
    expect(portalClosedTicket?.resolutionStartedAt).toBeInstanceOf(Date);
    expect(portalClosedTicket?.resolvedAt).toBeInstanceOf(Date);

    await page.goto(`/portal/suporte/${portalTicketId}`);
    await page.getByPlaceholder("Escreva uma mensagem").fill("Preciso retomar este chamado.");
    await page.getByRole("button", { name: "Enviar mensagem" }).click();
    await expect(page.getByText("Preciso retomar este chamado.", { exact: true })).toBeVisible();

    const [portalReopenedTicket] = await db.select({
      status: schema.tickets.status,
      resolutionStartedAt: schema.tickets.resolutionStartedAt,
      resolvedAt: schema.tickets.resolvedAt
    }).from(schema.tickets).where(eq(schema.tickets.id, portalTicketId!)).limit(1);
    expect(portalReopenedTicket?.status).toBe("new");
    expect(portalReopenedTicket?.resolutionStartedAt).toBeInstanceOf(Date);
    expect(portalReopenedTicket?.resolutionStartedAt?.getTime()).toBeGreaterThanOrEqual(portalClosedTicket?.resolvedAt?.getTime() ?? 0);
    expect(portalReopenedTicket?.resolvedAt).toBeNull();
  });

  test("cria o lead e os lançamentos financeiros do período", async ({ page }) => {
    await page.goto("/app/comercial/leads/novo");
    await page.getByLabel("Nome").fill(LEAD_NAME);
    await page.getByLabel("Telefone").fill("85988887777");
    await page.getByLabel("E-mail").fill(`relatorios.lead.${STAMP}@playwright.local`);
    await page.getByLabel("Origem").selectOption("site");
    await page.getByRole("button", { name: "Criar lead" }).click();
    await expect(page.getByRole("heading", { name: LEAD_NAME })).toBeVisible();

    await page.goto("/app/financeiro/receber");
    await page.getByText("+ Novo lançamento manual").click();
    await page.getByLabel("Descrição").fill(COMPANY_FINANCIAL_DESCRIPTION);
    await page.getByLabel("Valor (R$)").fill("123,45");
    await page.getByLabel("Competência").fill(PERIOD_SAFE_DATE);
    await page.getByLabel("Vencimento (opcional)").fill(PERIOD_SAFE_DATE);
    await page.getByRole("button", { name: "Criar lançamento" }).click();
    await expect(page.locator("tr", { hasText: COMPANY_FINANCIAL_DESCRIPTION })).toBeVisible();

    await page.goto("/app/financeiro/pessoal");
    await page.getByText("+ Novo lançamento pessoal").click();
    await page.getByLabel("Tipo").selectOption("in");
    await page.getByLabel("Descrição").fill(PERSONAL_FINANCIAL_DESCRIPTION);
    await page.getByLabel("Valor (R$)").fill("67,89");
    await page.getByLabel("Competência").fill(PERIOD_SAFE_DATE);
    await page.getByLabel("Vencimento (opcional)").fill(PERIOD_SAFE_DATE);
    await page.getByRole("button", { name: "Criar lançamento" }).click();
    await expect(page.locator("tr", { hasText: PERSONAL_FINANCIAL_DESCRIPTION })).toBeVisible();
  });

  test("cria o projeto, a aprovação e as horas do período", async ({ page, browser }) => {
    test.setTimeout(120_000);
    await page.goto("/app/comercial/oportunidades/novo");
    await page.getByLabel("Título").fill(PROJECT_OPPORTUNITY_TITLE);
    await page.getByLabel("Próxima ação (obrigatória)").fill("2026-08-01T10:00");
    await page.getByRole("button", { name: "Criar oportunidade" }).click();
    await expect(page).toHaveURL(/\/app\/comercial\/oportunidades\/[a-f0-9-]+$/);

    await page.goto("/app/comercial/briefings/novo");
    const skipCard = page.locator("div", { has: page.getByRole("heading", { name: "Pular briefing" }) }).last();
    await skipCard.getByPlaceholder("Buscar oportunidade aberta por título").fill(PROJECT_OPPORTUNITY_TITLE);
    await skipCard.getByRole("button", { name: "Buscar", exact: true }).click();
    await skipCard.getByText(PROJECT_OPPORTUNITY_TITLE, { exact: true }).click();
    await skipCard.locator("#skip-productId").selectOption({ label: "Link na Bio" });
    await skipCard.getByLabel("Justificativa (obrigatória, auditada)").fill("Dados para os relatórios E2E.");
    await skipCard.getByRole("button", { name: "Pular briefing" }).click();
    await expect(page.getByText(/Briefing BRF-\d{4}-\d{4} registrado como pulado/)).toBeVisible();

    await page.goto("/app/comercial/propostas/novo");
    await page.getByPlaceholder("Buscar oportunidade aberta por título").fill(PROJECT_OPPORTUNITY_TITLE);
    await page.getByRole("button", { name: "Buscar", exact: true }).click();
    await page.getByText(PROJECT_OPPORTUNITY_TITLE, { exact: true }).click();
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

    const proposalCustomerContext = await browser.newContext();
    const proposalCustomerPage = await proposalCustomerContext.newPage();
    await proposalCustomerPage.goto(proposalLink);
    await proposalCustomerPage.getByPlaceholder("Seu nome completo").fill("Cliente Relatórios");
    await proposalCustomerPage.getByPlaceholder("CPF/CNPJ (opcional)").fill("111.222.333-44");
    await proposalCustomerPage.getByText("Declaro que li e aceito").click();
    await proposalCustomerPage.getByRole("button", { name: "Aceitar proposta" }).click();
    await expect(proposalCustomerPage.getByRole("heading", { name: "Proposta já aceita" })).toBeVisible();
    await proposalCustomerContext.close();
    await page.goto("/app/comercial/contratos/novo");
    await page.getByText(PROJECT_OPPORTUNITY_TITLE, { exact: true }).locator("../..").getByRole("button", { name: "Gerar contrato" }).click();
    await expect(page).toHaveURL(/\/app\/comercial\/contratos\/[a-f0-9-]+$/);
    await page.getByRole("button", { name: "Revisar e enviar para assinatura" }).click();
    await expect(page.getByText("Enviado", { exact: true })).toBeVisible();
    const contractLink = await page.locator("input[readonly]").inputValue();

    const contractCustomerContext = await browser.newContext();
    const contractCustomerPage = await contractCustomerContext.newPage();
    await contractCustomerPage.goto(contractLink);
    await contractCustomerPage.getByPlaceholder("Nome completo").fill("Cliente Relatórios");
    await contractCustomerPage.getByPlaceholder("CPF/CNPJ").fill("111.222.333-44");
    await contractCustomerPage.getByText("Declaro que li e assino").click();
    await contractCustomerPage.getByRole("button", { name: "Assinar contrato" }).click();
    await expect(contractCustomerPage.getByText("Aguardando assinatura da PULSO para finalizar.")).toBeVisible();
    await contractCustomerContext.close();
    await page.goto("/app/comercial/contratos");
    await page.getByText(PROJECT_OPPORTUNITY_TITLE, { exact: true }).click();
    await page.getByPlaceholder("Nome completo").fill("Administrador E2E");
    await page.getByText("Declaro que li e assino este contrato.").click();
    await page.getByRole("button", { name: "Assinar", exact: true }).click();
    await expect(page.getByText("Contrato assinado")).toBeVisible();

    await page.goto("/app/operacao/projetos/novo");
    await page.getByText(PROJECT_OPPORTUNITY_TITLE, { exact: true }).locator("../..").getByRole("button", { name: "Gerar projeto" }).click();
    await expect(page).toHaveURL(/\/app\/operacao\/projetos\/[a-f0-9-]+$/);
    const projectId = page.url().split("/").at(-1);
    expect(projectId).toBeTruthy();
    await expect(page.getByRole("heading", { name: PROJECT_OPPORTUNITY_TITLE })).toBeVisible();

    await page.getByPlaceholder("Título da aprovação (ex.: Layout inicial)").fill(APPROVAL_TITLE);
    await page.getByRole("button", { name: "Criar aprovação e gerar link" }).click();
    await expect(page).toHaveURL(/approval_link_token=/);

    await page.goto("/app/operacao/horas");
    await page.locator("#manual-project").selectOption({ value: projectId! });
    await page.getByLabel("Descrição").fill(TIME_ENTRY_DESCRIPTION);
    await page.getByLabel("Data").fill(PERIOD_SAFE_DATE);
    await page.getByLabel("Duração (HH:MM)").fill("02:00");
    await page.getByRole("button", { name: "Registrar horas" }).click();
    await expect(page.getByText(TIME_ENTRY_DESCRIPTION, { exact: true })).toBeVisible();
  });

  test("exibe os painéis e exporta somente o financeiro empresarial", async ({ page }) => {
    await page.goto("/app/inteligencia/relatorios?period=30d");

    await expect(page.getByRole("heading", { name: "Relatórios" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Comercial" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Operacional" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Financeiro" })).toBeVisible();
    await expect(page.getByRole("link", { name: "30 dias (selecionado)" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("link", { name: "Exportar relatório comercial em CSV" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Exportar relatório operacional em CSV" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Exportar relatório financeiro em CSV" })).toBeVisible();
    await expect(page.getByText("Fotografia atual", { exact: true })).toBeVisible();
    await expect(page.getByText("Movimento no período", { exact: true })).toBeVisible();
    await expect(page.getByText(/closedAt/).first()).toBeVisible();
    await expect(page.getByText(/resolvedAt/).first()).toBeVisible();
    await expect(page.getByText(/dueDate/).first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    const reports = await page.evaluate(async () => {
      const paths = ["commercial", "operations", "financial"] as const;
      const downloaded = await Promise.all(paths.map(async (report) => {
        const response = await fetch(`/api/reports/export?report=${report}&period=30d`);
        return { report, status: response.status, body: await response.text() };
      }));
      return Object.fromEntries(downloaded.map(({ report, status, body }) => [report, { status, body }]));
    });

    expect(reports.commercial.status).toBe(200);
    expect(reports.commercial.body).toContain(LEAD_NAME);
    expect(reports.commercial.body).toContain(OPPORTUNITY_TITLE);
    expect(reports.operations.status).toBe(200);
    expect(reports.operations.body).toContain(PROJECT_OPPORTUNITY_TITLE);
    expect(reports.operations.body).toContain(APPROVAL_TITLE);
    expect(reports.operations.body).toContain(TIME_ENTRY_DESCRIPTION);
    expect(reports.operations.body).toContain(TICKET_TITLE);
    expect(reports.financial.status).toBe(200);
    expect(reports.financial.body).toContain(COMPANY_FINANCIAL_DESCRIPTION);
    expect(reports.financial.body).toContain("123,45");
    expect(reports.financial.body).not.toContain(PERSONAL_FINANCIAL_DESCRIPTION);
  });
});
