import type { ComponentProps } from "react";
import { ArrowRight, Heart, Music, Sparkles, Zap } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { LanguageSelector } from "@/components/shared/LanguageSelector";

type LinkHref = ComponentProps<typeof Link>["href"];

type FooterLinkGroup = {
  title: string;
  items: Array<{ href: LinkHref; label: string }>;
};

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing" });
  const year = new Date().getFullYear();

  const featureCards = [
    {
      key: "intelligent" as const,
      icon: Sparkles,
      accent: "from-blue-500 to-cyan-500",
    },
    {
      key: "instant" as const,
      icon: Zap,
      accent: "from-green-500 to-emerald-500",
    },
    {
      key: "personalized" as const,
      icon: Heart,
      accent: "from-purple-500 to-pink-500",
    },
  ];

  const journeySteps = [
    { order: "1", key: "describe" as const },
    { order: "2", key: "ai" as const },
    { order: "3", key: "enjoy" as const },
  ];

  const footerLinks: FooterLinkGroup[] = [
    {
      title: t("footer.product"),
      items: [
        { href: "/dashboard", label: t("footer.links.dashboard") },
        { href: "/dashboard/generate", label: t("footer.links.generator") },
        { href: "/dashboard/discover", label: t("footer.links.discover") },
      ],
    },
    {
      title: t("footer.support"),
      items: [
        { href: "/help", label: t("footer.links.help") },
        { href: "/contact", label: t("footer.links.contact") },
        { href: "/feedback", label: t("footer.links.feedback") },
      ],
    },
    {
      title: t("footer.legal"),
      items: [
        { href: "/privacy", label: t("footer.links.privacy") },
        { href: "/terms", label: t("footer.links.terms") },
        { href: "/cookies", label: t("footer.links.cookies") },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
                <Music className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Music Genie</h1>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSelector />
              <Link href="/login">
                <Button variant="ghost">{t("header.login")}</Button>
              </Link>
              <Link href="/signup">
                <Button>{t("header.signup")}</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              {t("hero.badge")}
            </div>

            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              {t.rich("hero.heading", {
                highlight: (chunks) => (
                  <span className="bg-gradient-to-r from-red-500 to-pink-600 bg-clip-text text-transparent">
                    {chunks}
                  </span>
                ),
              })}
            </h2>

            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              {t("hero.description")}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="text-lg px-8 py-4">
                  {t("hero.primaryCta")}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                  {t("hero.secondaryCta")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t("features.title")}
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t("features.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featureCards.map(({ key, icon: Icon, accent }) => (
              <Card
                key={key}
                className="text-center p-8 hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-0">
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${accent} rounded-full flex items-center justify-center mx-auto mb-6`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-4">
                    {t(`features.items.${key}.title`)}
                  </h4>
                  <p className="text-gray-600">
                    {t(`features.items.${key}.description`)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t("steps.title")}
            </h3>
            <p className="text-xl text-gray-600">
              {t("steps.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {journeySteps.map(({ order, key }) => (
              <div key={key} className="text-center">
                <div className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold">
                  {order}
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-4">
                  {t(`steps.items.${key}.title`)}
                </h4>
                <p className="text-gray-600">
                  {t(`steps.items.${key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-red-500 to-pink-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl md:text-4xl font-bold mb-6">
            {t("cta.title")}
          </h3>
          <p className="text-xl mb-8 opacity-90">
            {t("cta.subtitle")}
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-4">
              {t("cta.primary")}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <Music className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-xl font-bold">Music Genie</h4>
              </div>
              <p className="text-gray-400">{t("footer.tagline")}</p>
            </div>

            {footerLinks.map((group) => (
              <div key={group.title}>
                <h5 className="font-semibold mb-4">{group.title}</h5>
                <ul className="space-y-2 text-gray-400">
                  {group.items.map((item) => (
                    <li key={typeof item.href === "string" ? item.href : item.href.pathname}>
                      <Link href={item.href} className="hover:text-white">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>{t("footer.copyright", { year })}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
