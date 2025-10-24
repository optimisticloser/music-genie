import { redirect } from "next/navigation";
import { siteConfig } from "@/lib/config";

export default function AreaDoProfessionalPage() {
  const destination =
    siteConfig.links?.professionalArea?.href ?? "https://doctor.egidesaude.com.br";

  redirect(destination);
}
