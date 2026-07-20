import { Sparkles, Lock } from "lucide-react";
import { Card } from "@pulso/ui";
import { PageHeader } from "./page-header";

export function ModulePreview({ title, description, eyebrow = "Módulo" }: { title: string; description: string; eyebrow?: string }) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      
      <Card className="relative overflow-hidden mt-6 min-h-[400px] flex flex-col items-center justify-center p-8 text-center border-dashed border-2 border-[var(--line)] bg-[var(--surface)]/50">
        {/* Background Decorative Grid */}
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        
        {/* Glowing orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[var(--signal)]/10 rounded-full blur-[80px] pointer-events-none"></div>
        
        <div className="relative z-10 max-w-md mx-auto">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--soft)] border border-[var(--line)] shadow-xl mb-6">
            <Lock className="size-6 text-[var(--muted)]" />
          </div>
          
          <h2 className="text-xl font-extrabold tracking-tight mb-2 flex items-center justify-center gap-2">
            Módulo em desenvolvimento
            <Sparkles className="size-4 text-[var(--signal)]" />
          </h2>
          
          <p className="text-[var(--muted)] text-sm mb-8 leading-relaxed">
            Estamos construindo uma experiência premium e exclusiva para este módulo. 
            Em breve você terá acesso a funcionalidades avançadas com o padrão de excelência da PULSO.
          </p>
          
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--signal)]/30 bg-[var(--signal)]/10 px-4 py-2 text-xs font-semibold text-[var(--signal)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--signal)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--signal)]"></span>
            </span>
            Roadmap 2026
          </div>
        </div>
      </Card>
    </>
  );
}
