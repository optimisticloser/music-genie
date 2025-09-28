"use client";

import React from "react";
import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";
import { Toaster } from "sonner";
import { SupabaseSessionProvider } from "@/components/providers/SupabaseSessionProvider";

type ProvidersProps = {
  children: React.ReactNode;
  locale: string;
  messages: AbstractIntlMessages;
};

export function Providers({ children, locale, messages }: ProvidersProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SupabaseSessionProvider>
        {children}
        <Toaster richColors position="top-right" closeButton />
      </SupabaseSessionProvider>
    </NextIntlClientProvider>
  );
}
