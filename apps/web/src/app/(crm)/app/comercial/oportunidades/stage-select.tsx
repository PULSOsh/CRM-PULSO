"use client";

import { useTransition } from "react";
import { moveOpportunityStage } from "./actions";

export function StageSelect({
  opportunityId, currentStageId, stages
}: {
  opportunityId: string;
  currentStageId: string;
  stages: { id: string; name: string }[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={currentStageId}
      disabled={pending}
      onChange={(e) => startTransition(() => moveOpportunityStage(opportunityId, e.target.value))}
      onClick={(e) => e.stopPropagation()}
      className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2 py-1.5 text-xs font-semibold outline-none focus:border-[var(--signal)]"
    >
      {stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}
    </select>
  );
}
