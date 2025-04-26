"use client";

import type React from "react";

import { SessionProvider } from "next-auth/react";

export default function AuthProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
}) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
