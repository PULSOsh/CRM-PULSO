import { expect, test } from "@playwright/test";

test("abre a central de hoje", async ({ page }) => {
  await page.goto("/app/hoje");
  await expect(page.getByRole("heading", { name: "Central de hoje" })).toBeVisible();
  await expect(page.getByText("O CRM funciona sem integrações")).toBeVisible();
});

test("abre proposta pública", async ({ page }) => {
  await page.goto("/proposta/demo");
  await expect(page.getByRole("heading", { name: /site que transforma confiança/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Aceitar proposta/i })).toBeVisible();
});
