"use client";

import { useState, useTransition } from "react";
import { Card, Input, Label, Button } from "@pulso/ui";
import { updateGeralSettings, updateIdentitySettings } from "./actions";

export function GeralForms({ settings }: { settings: any }) {
  const [isPending1, startTransition1] = useTransition();
  const [isPending2, startTransition2] = useTransition();

  function onGeralAction(formData: FormData) {
    startTransition1(async () => {
      await updateGeralSettings({
        legalName: formData.get("legalName") as string,
        document: formData.get("document") as string,
        address: formData.get("address") as string,
        email: formData.get("email") as string,
      });
    });
  }

  function onIdentityAction(formData: FormData) {
    startTransition2(async () => {
      await updateIdentitySettings({
        primaryColor: formData.get("primaryColor") as string,
        logoUrl: formData.get("logoUrl") as string,
        logoUrlLight: formData.get("logoUrlLight") as string,
      });
    });
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-2">
      <Card className="p-6">
        <h2 className="text-lg font-extrabold text-white mb-6">Dados da Empresa (Contratada)</h2>
        <form className="space-y-4" action={onGeralAction}>
          <div>
            <Label>Nome / Razão Social</Label>
            <Input name="legalName" defaultValue={settings?.legalName || ""} required />
          </div>
          <div>
            <Label>CNPJ</Label>
            <Input name="document" defaultValue={settings?.document || ""} required />
          </div>
          <div>
            <Label>Endereço Completo</Label>
            <Input name="address" defaultValue={settings?.address || ""} required />
          </div>
          <div>
            <Label>E-mail de Contato (Padrão)</Label>
            <Input name="email" type="email" defaultValue={settings?.email || ""} required />
          </div>
          <div className="pt-2">
            <Button type="submit" disabled={isPending1}>
              {isPending1 ? "Salvando..." : "Salvar Dados"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-extrabold text-white mb-6">Identidade Visual (Propostas)</h2>
        <form className="space-y-4" action={onIdentityAction}>
          <div>
            <Label>Cor Primária (Hex)</Label>
            <div className="flex gap-4">
              <div className="size-10 rounded-lg shadow-inner" style={{ backgroundColor: settings?.primaryColor || "#F97316" }} />
              <Input name="primaryColor" defaultValue={settings?.primaryColor || "#F97316"} className="flex-1" />
            </div>
          </div>
          <div>
            <Label>Logo Escura (URL)</Label>
            <Input name="logoUrl" defaultValue={settings?.logoUrl || ""} />
          </div>
          <div>
            <Label>Logo Clara (URL)</Label>
            <Input name="logoUrlLight" defaultValue={settings?.logoUrlLight || ""} />
          </div>
          <div className="pt-2">
            <Button type="submit" disabled={isPending2}>
              {isPending2 ? "Salvando..." : "Salvar Identidade"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
