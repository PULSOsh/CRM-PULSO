"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Loader2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/app/hoje";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const { error: signInError } = await authClient.signIn.email({ email, password });
    setLoading(false);
    if (signInError) {
      setError(signInError.message === "Invalid password" || signInError.status === 401
        ? "E-mail ou senha incorretos."
        : signInError.message || "Não foi possível entrar. Tente novamente.");
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="flex flex-col text-white">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black tracking-tight text-white mb-2">Bem-vindo de volta</h1>
        <p className="text-sm font-medium text-gray-400">Acesso restrito à operação interna.</p>
      </div>
      
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400" htmlFor="email">E-mail</label>
          <input
            id="email" type="email" required autoComplete="username" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none transition-colors focus:border-orange-500 focus:bg-white/10"
            placeholder="seu@email.com"
          />
        </div>
        
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400" htmlFor="password">Senha</label>
          <input
            id="password" type="password" required autoComplete="current-password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none transition-colors focus:border-orange-500 focus:bg-white/10"
            placeholder="••••••••"
          />
        </div>
        
        {error && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm font-bold text-rose-400 text-center">
            {error}
          </div>
        )}
        
        <button 
          type="submit" 
          disabled={loading} 
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-orange-600 focus:ring-4 focus:ring-orange-500/20 disabled:opacity-50 shadow-lg shadow-orange-500/20"
        >
          {loading ? <Loader2 className="size-5 animate-spin" /> : "Entrar na plataforma"}
        </button>
      </form>
      
      <div className="mt-8 text-center">
        <a href="/esqueci-senha" className="text-xs font-bold text-gray-500 transition-colors hover:text-white">
          Esqueci minha senha
        </a>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
