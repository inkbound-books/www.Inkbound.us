import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { ContentSection } from "@/components/content-section"
import { BookOpen } from "lucide-react"
import { getPageContent, defaultFormatsContent, type FormatsPageContent } from "@/lib/page-content"

export const metadata: Metadata = {
  title: "Supported Formats",
  description: "View the e-book formats we support for our digital books.",
}

function FormatIcon({ icon }: { icon: string | null }) {
  if (icon) {
    return <span className="text-2xl">{icon}</span>
  }
  return <BookOpen className="h-6 w-6 text-primary" />
}

export default async function FormatsPage() {
  const supabase = await createClient()
  const [{ data: formats }, content] = await Promise.all([
    supabase
      .from("formats")
      .select("*")
      .order("name", { ascending: true }),
    getPageContent<FormatsPageContent>("formats", defaultFormatsContent),
  ])

  return (
    <main className="relative z-10 mx-auto min-h-screen max-w-3xl px-4 pt-32 pb-16 md:px-8">
      <h1 className="mb-4 text-4xl font-semibold text-foreground md:text-5xl">
        {content.hero.title}
      </h1>
      <p className="mb-12 text-lg font-light text-muted-foreground">
        {content.hero.subtitle}
      </p>

      <ContentSection className="mb-8">
        {formats && formats.length > 0 ? (
          <ul className="my-8 space-y-4">
            {formats.map((format) => (
              <li
                key={format.id}
                className="flex items-center gap-4 rounded-lg border-l-4 border-primary bg-background p-5 transition-transform hover:translate-x-2 hover:shadow-md"
              >
                <FormatIcon icon={format.icon} />
                <div>
                  <span className="block text-lg font-semibold text-foreground">
                    {format.name}
                    <span className="ml-2 font-mono text-sm text-muted-foreground">
                      {format.extension}
                    </span>
                  </span>
                  {format.description && (
                    <span className="text-sm text-muted-foreground">{format.description}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-8 text-center text-muted-foreground">
            Format information coming soon.
          </p>
        )}

        <div className="mt-8 rounded-xl border-2 border-primary bg-background p-6">
          <p className="mb-3 text-lg font-semibold text-primary">{content.recommendation.title}</p>
          <p className="text-muted-foreground">
            {content.recommendation.text}
          </p>
        </div>
      </ContentSection>

      <ContentSection>
        <p className="mb-5 leading-relaxed text-muted-foreground">
          {content.closing.paragraph1}
        </p>
        <p className="leading-relaxed text-muted-foreground">
          {content.closing.paragraph2}
        </p>
      </ContentSection>
    </main>
  )
}
