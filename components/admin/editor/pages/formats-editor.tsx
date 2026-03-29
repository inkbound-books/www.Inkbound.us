"use client"

import { ContentSection } from "@/components/content-section"
import { EditorProvider, EditableText, EditorToolbar } from "@/components/admin/editor"
import { savePageContent } from "@/app/admin/actions"
import { BookOpen } from "lucide-react"
import type { FormatsPageContent } from "@/lib/page-content"

interface FormatsPageEditorProps {
  content: FormatsPageContent
  slug: string
}

export function FormatsPageEditor({ content, slug }: FormatsPageEditorProps) {
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
          className="mb-4 text-4xl font-semibold text-foreground md:text-5xl"
        />
        <EditableText
          path="hero.subtitle"
          value={content.hero.subtitle}
          as="p"
          className="mb-12 text-lg font-light text-muted-foreground"
        />

        <ContentSection className="mb-8">
          {/* Preview format items */}
          <ul className="my-8 space-y-4 opacity-50">
            <li className="flex items-center gap-4 rounded-lg border-l-4 border-primary bg-background p-5">
              <BookOpen className="h-6 w-6 text-primary" />
              <div>
                <span className="block text-lg font-semibold text-foreground">
                  EPUB
                  <span className="ml-2 font-mono text-sm text-muted-foreground">.epub</span>
                </span>
                <span className="text-sm text-muted-foreground">
                  Standard e-book format (formats are managed separately)
                </span>
              </div>
            </li>
          </ul>

          <div className="mt-8 rounded-xl border-2 border-primary bg-background p-6">
            <EditableText
              path="recommendation.title"
              value={content.recommendation.title}
              as="p"
              className="mb-3 text-lg font-semibold text-primary"
            />
            <EditableText
              path="recommendation.text"
              value={content.recommendation.text}
              as="p"
              className="text-muted-foreground"
              multiline
              richText
            />
          </div>
        </ContentSection>

        <ContentSection>
          <EditableText
            path="closing.paragraph1"
            value={content.closing.paragraph1}
            as="p"
            className="mb-5 leading-relaxed text-muted-foreground"
            multiline
            richText
          />
          <EditableText
            path="closing.paragraph2"
            value={content.closing.paragraph2}
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
