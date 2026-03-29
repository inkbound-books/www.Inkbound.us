import type { Metadata } from "next"
import { ContentSection } from "@/components/content-section"
import { getPageContent, defaultAboutContent, type AboutPageContent } from "@/lib/page-content"

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about the Inkbound Books team - a two-person team of authors and editors.",
}

export default async function AboutPage() {
  const content = await getPageContent<AboutPageContent>("about", defaultAboutContent)

  return (
    <main className="relative z-10 mx-auto min-h-screen max-w-3xl px-4 pt-32 pb-16 md:px-8">
      <h1 className="mb-12 text-4xl font-semibold text-foreground md:text-5xl">
        {content.hero.title}
      </h1>

      <ContentSection className="mb-8">
        <p className="mb-5 leading-relaxed text-muted-foreground">
          {content.intro.paragraph1}
        </p>
        <p className="leading-relaxed text-muted-foreground">
          {content.intro.paragraph2}
        </p>
      </ContentSection>

      <ContentSection className="mb-8">
        <h2 className="mb-6 text-2xl font-semibold text-foreground">{content.contact.title}</h2>
        <p className="mb-6 text-muted-foreground">{content.contact.description}</p>

        <ul className="mb-6 space-y-4">
          {content.contact.contacts.map((contact) => (
            <li
              key={contact.email}
              className="rounded-lg bg-background p-4 transition-colors hover:bg-border/50"
            >
              <span className="mb-2 block text-lg font-semibold text-foreground">
                {contact.title}
              </span>
              <a href={`mailto:${contact.email}`} className="font-medium text-primary break-all hover:underline">
                {contact.email}
              </a>
            </li>
          ))}
        </ul>

        <p className="text-muted-foreground">
          For <span className="font-medium text-primary">business inquiries and book purchases</span>,
          please use the business email listed above.
        </p>
      </ContentSection>

      <ContentSection>
        <p className="text-muted-foreground">
          {content.closing.text}
        </p>
      </ContentSection>
    </main>
  )
}
