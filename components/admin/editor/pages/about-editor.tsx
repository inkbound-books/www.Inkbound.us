"use client"

import { ContentSection } from "@/components/content-section"
import { EditorProvider, EditableText, EditableList, EditorToolbar } from "@/components/admin/editor"
import { savePageContent } from "@/app/admin/actions"
import type { AboutPageContent } from "@/lib/page-content"

interface AboutPageEditorProps {
  content: AboutPageContent
  slug: string
}

export function AboutPageEditor({ content, slug }: AboutPageEditorProps) {
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
          className="mb-12 text-4xl font-semibold text-foreground md:text-5xl"
        />

        <ContentSection className="mb-8">
          <EditableText
            path="intro.paragraph1"
            value={content.intro.paragraph1}
            as="p"
            className="mb-5 leading-relaxed text-muted-foreground"
            multiline
            richText
          />
          <EditableText
            path="intro.paragraph2"
            value={content.intro.paragraph2}
            as="p"
            className="leading-relaxed text-muted-foreground"
            multiline
            richText
          />
        </ContentSection>

        <ContentSection className="mb-8">
          <EditableText
            path="contact.title"
            value={content.contact.title}
            as="h2"
            className="mb-6 text-2xl font-semibold text-foreground"
          />
          <EditableText
            path="contact.description"
            value={content.contact.description}
            as="p"
            className="mb-6 text-muted-foreground"
          />

          <ul className="mb-6 space-y-4">
            {content.contact.contacts.map((contact, index) => (
              <li
                key={contact.email}
                className="rounded-lg bg-background p-4 transition-colors hover:bg-border/50"
              >
                <EditableText
                  path={`contact.contacts.${index}.title`}
                  value={contact.title}
                  as="span"
                  className="mb-2 block text-lg font-semibold text-foreground"
                />
                <span className="font-medium text-primary break-all">
                  <EditableText
                    path={`contact.contacts.${index}.email`}
                    value={contact.email}
                    as="span"
                  />
                </span>
              </li>
            ))}
          </ul>

          <EditableText
            path="contact.footer"
            value={content.contact.footer || "For business inquiries and book purchases, please use the business email listed above."}
            as="p"
            className="text-muted-foreground"
            multiline
            richText
          />
        </ContentSection>

        <ContentSection>
          <EditableText
            path="closing.text"
            value={content.closing.text}
            as="p"
            className="text-muted-foreground"
            multiline
            richText
          />
        </ContentSection>
      </main>

      <EditorToolbar slug={slug} onSave={handleSave} />
    </EditorProvider>
  )
}
