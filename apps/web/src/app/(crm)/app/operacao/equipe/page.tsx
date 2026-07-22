import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Badge, Card } from "@pulso/ui";
import { PageHeader } from "@/components/page-header";
import { db, schema } from "@pulso/database";
import { desc } from "drizzle-orm";
import { NewMemberForm } from "./new-member-form";
import { MemberRowActions } from "./team-actions";
import { Users, Shield, UserCheck, Mail } from "lucide-react";

function formatDateBR(d: Date | string | null): string {
  if (!d) return "—";
  const dateObj = typeof d === "string" ? new Date(d) : d;
  return dateObj.toLocaleDateString("pt-BR");
}

export default async function TeamPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const members = await db
    .select()
    .from(schema.user)
    .orderBy(desc(schema.user.createdAt));

  const totalMembers = members.length;
  const adminCount = members.filter((m) => m.role === "admin").length;

  return (
    <>
      <PageHeader
        eyebrow="Operação & Gestão"
        title="Equipe e Membros"
        description="Gerencie os membros do time com acesso ao CRM, atribuições e níveis de permissão."
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <Card className="p-5 border border-[var(--line)] bg-[var(--surface)]/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Total de Membros</span>
            <Users className="size-5 text-[var(--signal)]" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-[var(--text)]">{totalMembers}</p>
        </Card>

        <Card className="p-5 border border-[var(--line)] bg-[var(--surface)]/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Administradores</span>
            <Shield className="size-5 text-purple-400" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-[var(--text)]">{adminCount}</p>
        </Card>
      </div>

      {/* Form accordion */}
      <details className="mb-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
        <summary className="cursor-pointer text-sm font-extrabold text-[var(--text)] hover:text-[var(--signal)] transition-colors">
          + Cadastrar Novo Membro
        </summary>
        <div className="mt-4 pt-4 border-t border-[var(--line)]">
          <NewMemberForm />
        </div>
      </details>

      {/* Team Table */}
      <Card className="overflow-hidden bg-[var(--surface)]/80 border border-[var(--line)] shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead className="border-b border-[var(--line)] bg-[var(--soft)]/50 font-mono text-[10px] uppercase tracking-[0.13em] text-[var(--muted)]">
              <tr>
                <th className="px-5 py-4">Membro</th>
                <th className="px-5 py-4">E-mail</th>
                <th className="px-5 py-4">Perfil</th>
                <th className="px-5 py-4">Membro Desde</th>
                <th className="px-5 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-[var(--muted)]">
                    Nenhum membro encontrado.
                  </td>
                </tr>
              )}
              {members.map((m) => {
                const isCurrent = m.id === session.user.id;
                const initial = (m.name || m.email || "?").charAt(0).toUpperCase();

                return (
                  <tr key={m.id} className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--soft)]/30 transition-colors">
                    <td className="px-5 py-4 font-bold text-[var(--text)]">
                      <div className="flex items-center gap-3">
                        <div className="grid size-8 place-items-center rounded-full bg-[var(--signal)] text-xs font-black text-white">
                          {initial}
                        </div>
                        <div>
                          <span className="block font-bold">{m.name}</span>
                          {isCurrent && <span className="text-[10px] font-bold text-[var(--signal)]">(Você)</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-[var(--muted)]">
                      <div className="flex items-center gap-1.5">
                        <Mail className="size-3.5" />
                        <span>{m.email}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={m.role === "admin" ? "signal" : "neutral"}>
                        {m.role === "admin" ? "Administrador" : "Membro"}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-sm text-[var(--muted)]">
                      {formatDateBR(m.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <MemberRowActions
                        userId={m.id}
                        currentRole={m.role}
                        isCurrentUser={isCurrent}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
