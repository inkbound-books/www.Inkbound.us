import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, Download } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { getPageContent, defaultCatalogContent, type CatalogPageContent } from "@/lib/page-content"

export const metadata: Metadata = {
  title: "Catalog",
  description: "Browse our collection of e-books available for purchase.",
}

export default async function CatalogPage() {
  const supabase = await createClient()
  const [{ data: books }, content] = await Promise.all([
    supabase
      .from("books")
      .select("*")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false }),
    getPageContent<CatalogPageContent>("catalog", defaultCatalogContent),
  ])

  if (!books || books.length === 0) {
    return (
      <main className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-4 pt-32 pb-16 md:px-8">
        <div className="text-center">
          <h1 className="mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-5xl font-bold text-transparent md:text-7xl">
            {content.emptyState.title}
          </h1>
          <p className="text-lg text-muted-foreground md:text-xl">
            {content.emptyState.subtitle}
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="relative z-10 mx-auto min-h-screen max-w-7xl px-4 pt-32 pb-16 md:px-8">
      <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
        {content.hero.title}
      </h1>
      <p className="mb-12 text-lg text-muted-foreground">
        {content.hero.subtitle}
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {books.map((book) => (
          <Card key={book.id} className="flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
            {book.cover_url && (
              <div className="relative aspect-[2/3] w-full bg-muted">
                <Image
                  src={book.cover_url || "/placeholder.svg"}
                  alt={book.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <CardHeader className="flex-1">
              <CardTitle className="line-clamp-2">{book.title}</CardTitle>
              <CardDescription className="text-sm">by {book.author}</CardDescription>
              {book.price && (
                <p className="mt-2 text-lg font-semibold text-primary">
                  ${book.price.toFixed(2)}
                </p>
              )}
            </CardHeader>
            <CardContent>
              {book.description && (
                <p className="mb-4 text-sm text-muted-foreground line-clamp-3">
                  {book.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {book.amazon_url && (
                  <Link href={book.amazon_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Amazon
                    </Button>
                  </Link>
                )}
                {book.preview_download_url && (
                  <Link href={book.preview_download_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="secondary" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Free Preview
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}
