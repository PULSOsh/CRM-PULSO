import { test, expect } from "@playwright/test";

test.describe("Backup da Interface", () => {
  test.use({ storageState: "e2e/.auth/admin.json" });

  test("Deve baixar o backup completo do banco de dados na rota de admin", async ({ request }) => {
    const response = await request.get("/api/admin/backup");
    
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/json");
    expect(response.headers()["content-disposition"]).toContain("attachment; filename=");
    
    const body = await response.json();
    expect(body.version).toBe("1.0");
    expect(body.timestamp).toBeDefined();
    expect(body.tables).toBeDefined();
    
    // Verifica se algumas tabelas conhecidas estão presentes
    expect(body.tables.users).toBeDefined();
    expect(body.tables.projects).toBeDefined();
  });
});

test.describe("Segurança do Backup", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("Não deve permitir acesso não autenticado", async ({ request }) => {
    const response = await request.get("/api/admin/backup");
    expect(response.status()).toBe(401);
  });
});
