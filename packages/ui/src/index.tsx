import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

export function Button({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl bg-[var(--signal)] px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[0_1px_0_rgba(22,22,22,.03)] ${className}`}
      {...props}
    />
  );
}

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: "neutral" | "signal" | "success" | "warning" | "danger" | "info";
  className?: string;
}) {
  return <span className={`badge badge-${tone} ${className}`}>{children}</span>;
}

export function Label({ className = "", ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={`mb-1.5 block text-xs font-bold text-[var(--muted-strong)] tracking-wide ${className}`}
      {...props}
    />
  );
}

const inputClasses =
  "w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-sm font-medium text-[var(--carbon)] shadow-sm outline-none transition-all duration-200 hover:border-[var(--muted)] focus:border-[var(--signal)] focus:ring-4 focus:ring-[var(--signal)]/10 disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-[var(--muted)]";

export function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${inputClasses} ${className}`} {...props} />;
}

export function Textarea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${inputClasses} ${className}`} {...props} />;
}

export function Select({ className = "", ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`${inputClasses} appearance-none bg-no-repeat pr-10 ${className}`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='2' stroke='%23aaa79f' class='size-4'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9' /%3E%3C/svg%3E")`,
        backgroundPosition: "right 0.75rem center",
        backgroundSize: "1rem 1rem",
      }}
      {...props}
    />
  );
}
