import { redirect } from "next/navigation";

export default function NotFound() {
  // Redireciona para a página inicial com locale padrão
  redirect("/en");
}
