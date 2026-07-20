import { expect, test } from "@playwright/test";

const OPP_TITLE = `Oportunidade Projeto ${Date.now()}`;
const TASK_TITLE = `Revisar wireframe ${Date.now()}`;
const FILE_NAME = `mockup-${Date.now()}.png`;
let projectUrl = "";
let approvalLink = "";

test.describe.serial("projetos", () => {
  test("prepara oportunidade até contrato assinado", async ({ page }) => {
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
    await page.getByPlaceholder("Seu nome completo").fill("Fernanda Cliente");
    await page.getByPlaceholder("CPF/CNPJ (opcional)").fill("111.222.333-44");
    await page.getByText("Declaro que li e aceito").click();
    await page.getByRole("button", { name: "Aceitar proposta" }).click();
    await expect(page.getByRole("heading", { name: "Proposta já aceita" })).toBeVisible();
  });

  test("gera contrato e assina interna e externamente", async ({ page }) => {
    await page.goto("/app/comercial/contratos/novo");
    await page.getByText(OPP_TITLE).locator("../..").getByRole("button", { name: "Gerar contrato" }).click();
    await expect(page).toHaveURL(/\/app\/comercial\/contratos\/[a-f0-9-]+$/);

    await page.getByRole("button", { name: "Revisar e enviar para assinatura" }).click();
    const contractLink = await page.locator("input[readonly]").inputValue();

    await page.context().clearCookies();
    await page.goto(contractLink);
    await page.getByPlaceholder("Nome completo").fill("Fernanda Cliente");
    await page.getByPlaceholder("CPF/CNPJ").fill("111.222.333-44");
    await page.getByText("Declaro que li e assino").click();
    await page.getByRole("button", { name: "Assinar contrato" }).click();
    await expect(page.getByText("Aguardando assinatura da PULSO para finalizar.")).toBeVisible();
  });

  test("assina internamente e gera o projeto a partir do contrato", async ({ page }) => {
    await page.goto("/app/comercial/contratos");
    await page.getByText(OPP_TITLE).click();
    await page.getByPlaceholder("Nome completo").fill("Administrador E2E");
    await page.getByText("Declaro que li e assino este contrato.").click();
    await page.getByRole("button", { name: "Assinar", exact: true }).click();
    await expect(page.getByText("Contrato assinado")).toBeVisible();

    await page.goto("/app/operacao/projetos/novo");
    await page.getByText(OPP_TITLE).locator("../..").getByRole("button", { name: "Gerar projeto" }).click();
    await expect(page).toHaveURL(/\/app\/operacao\/projetos\/[a-f0-9-]+$/);
    await expect(page.getByRole("heading", { name: OPP_TITLE })).toBeVisible();
    projectUrl = page.url();

    // idempotente: gerar de novo para o mesmo contrato não duplica
    await page.goto("/app/operacao/projetos/novo");
    await expect(page.getByText(OPP_TITLE)).toHaveCount(0);
  });

  test("cria e conclui uma tarefa no projeto", async ({ page }) => {
    await page.goto(projectUrl);
    await page.getByPlaceholder("Nova tarefa").fill(TASK_TITLE);
    await page.getByRole("button", { name: "Adicionar" }).click();
    await expect(page.getByText(TASK_TITLE)).toBeVisible();

    const taskRow = page.locator("label", { hasText: TASK_TITLE });
    await taskRow.click();
    await expect(taskRow.locator('input[type="checkbox"]')).toBeChecked();

    await page.goto("/app/operacao/tarefas");
    await expect(page.getByText(TASK_TITLE)).toBeVisible();
  });

  test("envia um arquivo e cria uma aprovação com link público", async ({ page }) => {
    await page.goto(projectUrl);
    await page.setInputFiles('input[type="file"]', {
      name: FILE_NAME, mimeType: "image/png",
      buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64")
    });
    await expect(page.getByRole("link", { name: new RegExp(FILE_NAME.replace(".", "\\.")) })).toBeVisible();

    await page.goto("/app/operacao/arquivos");
    await expect(page.getByText(FILE_NAME)).toBeVisible();

    await page.getByText(FILE_NAME).locator("../..").getByRole("button", { name: "Excluir" }).click();
    await expect(page.getByText(FILE_NAME)).toHaveCount(0);
    await page.goto("/app/operacao/arquivos?trashed=1");
    await expect(page.getByText(FILE_NAME)).toBeVisible();
    await page.getByText(FILE_NAME).locator("../..").getByRole("button", { name: "Restaurar" }).click();
    await page.goto("/app/operacao/arquivos");
    await expect(page.getByText(FILE_NAME)).toBeVisible();

    await page.goto(projectUrl);
    await page.getByPlaceholder("Título da aprovação (ex.: Layout inicial)").fill("Layout inicial");
    await page.getByPlaceholder("Instruções para o cliente (opcional)").fill("Veja o mockup e aprove ou peça ajustes.");
    await page.getByRole("combobox").filter({ hasText: "Sem arquivo vinculado" }).selectOption({ label: FILE_NAME });
    await page.getByRole("button", { name: "Criar aprovação e gerar link" }).click();

    await expect(page).toHaveURL(/approval_link_token=/);
    approvalLink = await page.locator("input[readonly]").inputValue();
    expect(approvalLink).toContain("/aprovacao/");
  });

  test("cliente aprova publicamente sem sessão interna", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto(approvalLink);
    await expect(page.getByRole("heading", { name: "Layout inicial" })).toBeVisible();
    await page.getByPlaceholder("Seu nome completo").fill("Fernanda Cliente");
    await page.getByRole("button", { name: "Aprovar" }).click();
    await expect(page.getByText("Aprovado", { exact: true })).toBeVisible();
  });

  test("aprovação decidida aparece no painel interno e o projeto pode ser concluído", async ({ page }) => {
    await page.goto(projectUrl);
    await expect(page.getByText("Aprovado", { exact: true })).toBeVisible();

    await page.locator("select[name='status']").selectOption("completed");
    await page.getByRole("button", { name: "Atualizar status" }).click();
    await expect(page.getByText("Concluído", { exact: true }).first()).toBeVisible();
  });

  test("registra horas manualmente e via timer", async ({ page }) => {
    const projectId = projectUrl.split("/").pop()!;
    const manualDesc = `Ajustes finos de layout ${Date.now()}`;
    const timerDesc = `Reunião rápida com cliente ${Date.now()}`;

    await page.goto("/app/operacao/horas");
    await page.locator("#manual-project").selectOption({ value: projectId });
    await page.getByLabel("Descrição").fill(manualDesc);
    await page.getByLabel("Duração (HH:MM)").fill("01:30");
    await page.getByRole("button", { name: "Registrar horas" }).click();
    await expect(page.getByText(manualDesc)).toBeVisible();

    await page.locator("#timer-project").selectOption({ value: projectId });
    await page.locator("#timer-description").fill(timerDesc);
    await page.getByRole("button", { name: "Iniciar timer" }).click();
    await expect(page.getByText(/Timer rodando/)).toBeVisible();
    await page.getByRole("button", { name: "Parar timer" }).click();
    await expect(page.getByRole("button", { name: "Iniciar timer" })).toBeVisible();
    await expect(page.getByText(timerDesc)).toBeVisible();
  });
});
