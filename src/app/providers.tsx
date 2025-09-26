"use client";

import React from "react";
import { SupabaseSessionProvider } from "@/components/providers/SupabaseSessionProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SupabaseSessionProvider>{children}</SupabaseSessionProvider>;
}
