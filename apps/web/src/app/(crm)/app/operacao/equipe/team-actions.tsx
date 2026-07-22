"use client";

import { useTransition } from "react";
import { Shield, ShieldAlert, Trash2 } from "lucide-react";
import { updateMemberRole, deleteTeamMember } from "./actions";

interface MemberRowActionsProps {
  userId: string;
  currentRole: string;
  isCurrentUser: boolean;
}

export function MemberRowActions({ userId, currentRole, isCurrentUser }: MemberRowActionsProps) {
  const [isPending, startTransition] = useTransition();

  function handleToggleRole() {
    const nextRole = currentRole === "admin" ? "member" : "admin";
    startTransition(async () => {
      await updateMemberRole(userId, nextRole);
    });
  }

  function handleDelete() {
    if (!confirm("Tem certeza que deseja remover este membro da equipe?")) return;
    startTransition(async () => {
      const res = await deleteTeamMember(userId);
      if (res.error) alert(res.error);
    });
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={handleToggleRole}
        disabled={isPending || isCurrentUser}
        title={currentRole === "admin" ? "Alterar para Membro" : "Promover a Administrador"}
        className={`flex items-center gap-1.5 rounded-lg border border-[var(--line)] px-2.5 py-1 text-xs font-bold transition-all ${
          currentRole === "admin"
            ? "bg-purple-500/10 text-purple-400 hover:bg-purple-500/20"
            : "bg-[var(--soft)] text-[var(--muted-strong)] hover:bg-[var(--line)]"
        } disabled:opacity-40 cursor-pointer`}
      >
        {currentRole === "admin" ? <ShieldAlert className="size-3.5" /> : <Shield className="size-3.5" />}
        <span>{currentRole === "admin" ? "Admin" : "Membro"}</span>
      </button>

      {!isCurrentUser && (
        <button
          onClick={handleDelete}
          disabled={isPending}
          title="Remover Membro"
          className="grid size-7 place-items-center rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-rose-500 hover:bg-[var(--soft)] cursor-pointer"
        >
          <Trash2 className="size-3.5" />
        </button>
      )}
    </div>
  );
}
