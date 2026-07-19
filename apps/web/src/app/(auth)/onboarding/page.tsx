import { redirect } from "next/navigation";
import { getOnboardingState } from "./actions";
import { AdminStep, IntegrationsStep, WorkspaceStep } from "./steps";

export default async function OnboardingPage({
  searchParams
}: {
  searchParams: Promise<{ etapa?: string }>;
}) {
  const { etapa } = await searchParams;
  const { hasAdmin, settings } = await getOnboardingState();

  if (settings?.onboardingCompletedAt) {
    redirect("/app/hoje");
  }

  if (!hasAdmin) {
    return <AdminStep />;
  }

  if (etapa === "integracoes") {
    return <IntegrationsStep />;
  }

  return <WorkspaceStep />;
}
