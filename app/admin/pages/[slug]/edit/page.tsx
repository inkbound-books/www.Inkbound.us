import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { HomePageEditor } from "@/components/admin/editor/pages/home-editor"
import { AboutPageEditor } from "@/components/admin/editor/pages/about-editor"
import { CatalogPageEditor } from "@/components/admin/editor/pages/catalog-editor"
import { FormatsPageEditor } from "@/components/admin/editor/pages/formats-editor"
import {
  defaultHomeContent,
  defaultAboutContent,
  defaultCatalogContent,
  defaultFormatsContent,
} from "@/lib/page-content"

const SUPPORTED_PAGES = ["home", "about", "catalog", "formats"]

export default async function VisualEditPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  if (!SUPPORTED_PAGES.includes(slug)) {
    notFound()
  }

  const supabase = await createClient()
  const { data: page } = await supabase
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .single()

  if (!page) {
    notFound()
  }

  // Get the content, merging with defaults
  const content = page.content || {}

  switch (slug) {
    case "home":
      return <HomePageEditor content={{ ...defaultHomeContent, ...content }} slug={slug} />
    case "about":
      return <AboutPageEditor content={{ ...defaultAboutContent, ...content }} slug={slug} />
    case "catalog":
      return <CatalogPageEditor content={{ ...defaultCatalogContent, ...content }} slug={slug} />
    case "formats":
      return <FormatsPageEditor content={{ ...defaultFormatsContent, ...content }} slug={slug} />
    default:
      notFound()
  }
}
