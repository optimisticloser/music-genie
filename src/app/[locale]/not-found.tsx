import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default function LocaleNotFound() {
  const t = useTranslations("notFound");

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center text-white">
        <div className="flex items-center justify-center mb-8">
          <div className="text-6xl font-bold mr-4">404</div>
          <div className="w-px h-16 bg-white"></div>
          <div className="text-xl ml-4">{t("title")}</div>
        </div>
        <div className="space-y-4">
          <p className="text-gray-400">
            {t("description")}
          </p>
          <div className="space-x-4">
            <Link href="/">
              <Button variant="outline" className="text-white border-white hover:bg-white hover:text-black">
                {t("goHome")}
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="text-white border-white hover:bg-white hover:text-black">
                {t("goDashboard")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
