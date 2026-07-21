import { PulsoLogo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-grid flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center"><PulsoLogo /></div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_1px_0_rgba(22,22,22,.03)] sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
