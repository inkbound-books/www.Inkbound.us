"use client"

import Link from "next/link"
import { ContentSection } from "@/components/content-section"
import { EditorProvider, EditableText, EditableList, EditorToolbar } from "@/components/admin/editor"
import { savePageContent } from "@/app/admin/actions"
import type { HomePageContent } from "@/lib/page-content"

interface HomePageEditorProps {
  content: HomePageContent
  slug: string
}

export function HomePageEditor({ content, slug }: HomePageEditorProps) {
  const handleSave = async (newContent: Record<string, unknown>) => {
    return savePageContent(slug, newContent)
  }

  return (
    <EditorProvider initialContent={content as unknown as Record<string, unknown>}>
      <main className="relative z-10 mx-auto min-h-screen max-w-3xl px-4 pt-32 pb-16 md:px-8">
        <EditableText
          path="hero.title"
          value={content.hero.title}
          as="h1"
          className="mb-4 text-4xl font-semibold leading-tight text-foreground md:text-5xl text-balance"
        />
        <EditableText
          path="hero.subtitle"
          value={content.hero.subtitle}
          as="p"
          className="mb-12 text-lg font-light text-muted-foreground md:text-xl"
        />

        <ContentSection>
          <p className="mb-5 leading-relaxed text-muted-foreground">
            We currently sell <span className="font-medium text-primary">E-books only</span>. To
            purchase a book, please browse our{" "}
            <Link href="/catalog" className="font-medium text-primary hover:underline">
              catalog
            </Link>{" "}
            and then email us using the format below.
          </p>

          <div className="my-6 rounded-lg border-l-4 border-primary bg-background p-6">
            <p className="mb-3 text-lg font-semibold text-foreground">
              Email:{" "}
              <span className="font-normal text-primary">
                <code className="rounded bg-muted px-2 py-1 text-sm">
                  <EditableText
                    path="purchasing.email"
                    value={content.purchasing.email}
                    as="span"
                  />
                </code>
              </span>
            </p>
            <p className="mb-2 font-semibold text-foreground">Email Subject:</p>
            <EditableText
              path="purchasing.subject"
              value={content.purchasing.subject}
              as="p"
              className="mb-4 text-muted-foreground"
            />
            <p className="mb-2 font-semibold text-foreground">Email Content:</p>
            <EditableList
              basePath="purchasing.contentItems"
              items={content.purchasing.contentItems}
              className="pl-4 text-muted-foreground"
              itemClassName="relative pl-6 before:absolute before:left-0 before:font-bold before:text-primary before:content-['→']"
            />
          </div>

          <p className="mb-5 leading-relaxed text-muted-foreground">
            We support a limited range of E-book formats. You can view the supported formats{" "}
            <Link href="/formats" className="font-medium text-primary hover:underline">
              here
            </Link>
            .
          </p>

          <EditableText
            path="formats.fallbackText"
            value={content.formats.fallbackText}
            as="p"
            className="leading-relaxed text-muted-foreground"
            multiline
            richText
          />
        </ContentSection>
      </main>

      <EditorToolbar slug={slug} onSave={handleSave} />
    </EditorProvider>
  )
}
