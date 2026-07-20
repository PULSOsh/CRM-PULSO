"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function GenericUploadForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.set("file", file);
    formData.set("visibility", "internal");

    fetch("/api/files", { method: "POST", body: formData }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Não foi possível enviar o arquivo."); return; }
      router.refresh();
    }).finally(() => setUploading(false));
  }

  return (
    <div>
      <label className="primary-button inline-flex cursor-pointer">
        {uploading ? "Enviando..." : "Enviar arquivo"}
        <input type="file" onChange={handleUpload} disabled={uploading} className="hidden" />
      </label>
      {error && <p role="alert" className="mt-2 text-xs font-semibold text-[var(--error)]">{error}</p>}
    </div>
  );
}
