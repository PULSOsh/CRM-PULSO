import { PulsoLogo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#11110f] px-4 py-10 selection:bg-orange-500/30 overflow-hidden font-sans antialiased">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-500/10 via-black/0 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-orange-500/20 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-orange-600/10 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />

      <div className="relative z-10 w-full max-w-[420px]">
        <div className="mb-10 flex justify-center">
          <PulsoLogo />
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-2xl">
          {children}
        </div>
      </div>
    </div>
  );
}
