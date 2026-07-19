"use client";

import { createAuthClient } from "better-auth/react";

// Sem baseURL fixo: o client usa a origem atual da página (funciona em qualquer host/porta/domínio).
export const authClient = createAuthClient();

export const { signIn, signOut, useSession, requestPasswordReset, resetPassword } = authClient;
