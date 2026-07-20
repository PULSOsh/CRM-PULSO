"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createContractFromProposal } from "../actions";

export function CreateContractButton({ proposalId }: { proposalId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await createContractFromProposal(proposalId);
      if (result.contractId) router.push(`/app/comercial/contratos/${result.contractId}`);
    });
  }

  return (
    <button type="button" onClick={handleClick} disabled={pending} className="secondary-button px-3 py-1.5 text-xs">
      {pending ? "Gerando..." : "Gerar contrato"}
    </button>
  );
}
