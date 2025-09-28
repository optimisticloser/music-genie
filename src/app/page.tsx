import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

export default function RootPage() {
  // Redireciona para o locale padrão
  redirect(`/${routing.defaultLocale}`);
}
