"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateProjectFromContract } from "../actions";

export function CreateProjectButton({ contractId }: { contractId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await generateProjectFromContract(contractId);
      if (result.projectId) router.push(`/app/operacao/projetos/${result.projectId}`);
    });
  }

  return (
    <button type="button" onClick={handleClick} disabled={pending} className="secondary-button px-3 py-1.5 text-xs">
      {pending ? "Gerando..." : "Gerar projeto"}
    </button>
  );
}
