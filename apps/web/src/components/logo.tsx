import Image from "next/image";

export function PulsoLogo({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex h-10 items-center justify-center">
        <Image 
          src="/logo-symbol.svg" 
          alt="PULSO." 
          width={28} 
          height={28} 
          className="h-7 w-auto" 
          priority 
        />
      </div>
    );
  }

  return (
    <div className="flex h-10 items-center">
      <Image 
        src="/logo-horizontal.svg" 
        alt="PULSO. CRM" 
        width={140} 
        height={28} 
        className="h-7 w-auto" 
        priority 
      />
    </div>
  );
}
