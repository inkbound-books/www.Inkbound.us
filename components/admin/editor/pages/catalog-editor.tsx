"use client"

import { EditorProvider, EditableText, EditorToolbar } from "@/components/admin/editor"
import { savePageContent } from "@/app/admin/actions"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { CatalogPageContent } from "@/lib/page-content"

interface CatalogPageEditorProps {
  content: CatalogPageContent
  slug: string
}

export function CatalogPageEditor({ content, slug }: CatalogPageEditorProps) {
  const handleSave = async (newContent: Record<string, unknown>) => {
    return savePageContent(slug, newContent)
  }

  return (
    <EditorProvider initialContent={content as unknown as Record<string, unknown>}>
      <main className="relative z-10 mx-auto min-h-screen max-w-7xl px-4 pt-32 pb-16 md:px-8">
        <EditableText
          path="hero.title"
          value={content.hero.title}
          as="h1"
          className="mb-4 text-4xl font-bold text-foreground md:text-5xl"
        />
        <EditableText
          path="hero.subtitle"
          value={content.hero.subtitle}
          as="p"
          className="mb-12 text-lg text-muted-foreground"
        />

        {/* Preview of what the catalog looks like with placeholder books */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="flex flex-col overflow-hidden opacity-50">
            <div className="aspect-[2/3] w-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground text-sm">Book Cover Preview</span>
            </div>
            <CardHeader>
              <p className="font-semibold">Book Title</p>
              <p className="text-sm text-muted-foreground">by Author Name</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Book description will appear here...
              </p>
            </CardContent>
          </Card>
          <Card className="flex flex-col overflow-hidden opacity-50">
            <div className="aspect-[2/3] w-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground text-sm">Book Cover Preview</span>
            </div>
            <CardHeader>
              <p className="font-semibold">Book Title</p>
              <p className="text-sm text-muted-foreground">by Author Name</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Book description will appear here...
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Empty state preview */}
        <div className="mt-16 border-t pt-16">
          <h2 className="mb-8 text-xl font-semibold text-muted-foreground">
            Empty State Preview (shown when no books exist):
          </h2>
          <div className="text-center">
            <EditableText
              path="emptyState.title"
              value={content.emptyState.title}
              as="h1"
              className="mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-5xl font-bold text-transparent md:text-7xl"
            />
            <EditableText
              path="emptyState.subtitle"
              value={content.emptyState.subtitle}
              as="p"
              className="text-lg text-muted-foreground md:text-xl"
            />
          </div>
        </div>
      </main>

      <EditorToolbar slug={slug} onSave={handleSave} />
    </EditorProvider>
  )
}
