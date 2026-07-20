import { expect, test } from "@playwright/test";

const STAMP = Date.now();
const RECEIVABLE_DESC = `Consultoria E2E ${STAMP}`;
const PAYABLE_DESC = `Fornecedor E2E ${STAMP}`;
const PERSONAL_DESC = `Reembolso pessoal E2E ${STAMP}`;
let receivableCode = "";

test.describe.serial("financeiro", () => {
  test("cria conta a receber e registra baixa parcial seguida de baixa total", async ({ page }) => {
    await page.goto("/app/financeiro/receber");
    await page.getByText("+ Novo lançamento manual").click();
    await page.getByLabel("Descrição").fill(RECEIVABLE_DESC);
    await page.getByLabel("Valor (R$)").fill("300,00");
    await page.getByRole("button", { name: "Criar lançamento" }).click();

    const row = page.locator("tr", { hasText: RECEIVABLE_DESC });
    await expect(row).toBeVisible();
    await expect(row.getByText("Pendente", { exact: true })).toBeVisible();

    await row.getByRole("button", { name: "Registrar baixa" }).click();
    await row.getByPlaceholder("0,00").fill("100,00");
    await row.getByRole("button", { name: "Confirmar" }).click();
    await expect(row.getByText("Parcial", { exact: true })).toBeVisible();

    await row.getByRole("button", { name: "Registrar baixa" }).click();
    await row.getByPlaceholder("0,00").fill("200,00");
    await row.getByRole("button", { name: "Confirmar" }).click();
    await expect(row.getByText("Pago", { exact: true })).toBeVisible();
    await expect(row.getByText("R$ 300,00", { exact: true })).toBeVisible();

    receivableCode = (await row.locator("td").first().innerText()).trim();
    expect(receivableCode).toMatch(/^COB-\d{4}-\d{4}$/);
  });

  test("estorna a conta paga sem alterar o lançamento original e gera lançamento compensatório em pagar", async ({ page }) => {
    await page.goto("/app/financeiro/receber");
    const row = page.locator("tr", { hasText: RECEIVABLE_DESC });
    await row.getByRole("button", { name: "Estornar" }).click();
    await row.getByPlaceholder("Motivo do estorno").fill("Cliente cancelou o serviço.");
    await row.getByRole("button", { name: "Confirmar estorno" }).click();

    await expect(row.getByText("Pago", { exact: true })).toBeVisible();
    await expect(row.getByText("R$ 300,00", { exact: true })).toBeVisible();

    await page.goto("/app/financeiro/pagar");
    const reversalRow = page.locator("tr", { hasText: `Estorno de ${receivableCode}` });
    await expect(reversalRow).toBeVisible();
    await expect(reversalRow.getByText("Pago", { exact: true })).toBeVisible();

    await expect(page.locator("tr", { hasText: RECEIVABLE_DESC })).toHaveCount(0);
  });

  test("cria conta a pagar", async ({ page }) => {
    await page.goto("/app/financeiro/pagar");
    await page.getByText("+ Nova despesa").click();
    await page.getByLabel("Descrição").fill(PAYABLE_DESC);
    await page.getByLabel("Valor (R$)").fill("150,00");
    await page.getByRole("button", { name: "Criar despesa" }).click();

    const row = page.locator("tr", { hasText: PAYABLE_DESC });
    await expect(row).toBeVisible();
    await expect(row.getByText("Pendente", { exact: true })).toBeVisible();
  });

  test("cria lançamento pessoal e confirma que fica fora do caixa da empresa", async ({ page }) => {
    await page.goto("/app/financeiro/pessoal");
    await page.getByText("+ Novo lançamento pessoal").click();
    await page.getByLabel("Tipo").selectOption({ label: "Receita" });
    await page.getByLabel("Descrição").fill(PERSONAL_DESC);
    await page.getByLabel("Valor (R$)").fill("80,00");
    await page.getByRole("button", { name: "Criar lançamento" }).click();

    const row = page.locator("tr", { hasText: PERSONAL_DESC });
    await expect(row).toBeVisible();
    await expect(row.getByText("Receita", { exact: true })).toBeVisible();

    await page.goto("/app/financeiro/receber");
    await expect(page.locator("tr", { hasText: PERSONAL_DESC })).toHaveCount(0);
    await page.goto("/app/financeiro/pagar");
    await expect(page.locator("tr", { hasText: PERSONAL_DESC })).toHaveCount(0);
  });

  test("visão financeira carrega KPIs e fluxo de caixa", async ({ page }) => {
    await page.goto("/app/financeiro/visao");
    await expect(page.getByText("Saldo (realizado)")).toBeVisible();
    await expect(page.getByText("A receber pendente")).toBeVisible();
    await expect(page.getByText("A pagar pendente")).toBeVisible();
    await expect(page.getByText("Lançamentos vencidos")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Fluxo de caixa — últimos 14 dias" })).toBeVisible();
  });
});
