"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

async function requireAdmin() {
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")
  if (session?.value !== "authenticated") {
    throw new Error("Unauthorized")
  }
}

// ─── Books ───────────────────────────────────────────────────────────────────

export async function addBook(data: {
  title: string
  author: string
  description?: string
  cover_url?: string
  amazon_url?: string
  preview_download_url?: string
  price?: string
  is_featured?: boolean
}) {
  await requireAdmin()
  const supabase = createAdminClient()

  const { error } = await supabase.from("books").insert({
    title: data.title,
    author: data.author,
    description: data.description || null,
    cover_url: data.cover_url || null,
    amazon_url: data.amazon_url || null,
    preview_download_url: data.preview_download_url || null,
    price: data.price ? parseFloat(data.price) : null,
    is_featured: data.is_featured ?? false,
  })

  if (error) return { error: error.message }

  revalidatePath("/admin/books")
  revalidatePath("/catalog")
  revalidatePath("/")
  return { success: true }
}

export async function updateBook(
  id: string,
  data: {
    title: string
    author: string
    description?: string
    cover_url?: string
    amazon_url?: string
    preview_download_url?: string
    price?: string
    is_featured?: boolean
  }
) {
  await requireAdmin()
  const supabase = createAdminClient()

  const { error } = await supabase
    .from("books")
    .update({
      title: data.title,
      author: data.author,
      description: data.description || null,
      cover_url: data.cover_url || null,
      amazon_url: data.amazon_url || null,
      preview_download_url: data.preview_download_url || null,
      price: data.price ? parseFloat(data.price) : null,
      is_featured: data.is_featured ?? false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/admin/books")
  revalidatePath("/catalog")
  revalidatePath("/")
  return { success: true }
}

export async function deleteBook(id: string) {
  await requireAdmin()
  const supabase = createAdminClient()

  const { error } = await supabase.from("books").delete().eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/admin/books")
  revalidatePath("/catalog")
  revalidatePath("/")
  return { success: true }
}

// ─── Pages ───────────────────────────────────────────────────────────────────

export async function createPage(data: {
  slug: string
  title: string
  content?: string
  meta_description?: string
}) {
  await requireAdmin()
  const supabase = createAdminClient()

  let contentJson: Record<string, unknown> = {}
  if (data.content) {
    try {
      contentJson = JSON.parse(data.content)
    } catch {
      contentJson = { body: data.content }
    }
  }

  const { error } = await supabase.from("pages").insert({
    slug: data.slug,
    title: data.title,
    content: contentJson,
    meta_description: data.meta_description || null,
  })

  if (error) return { error: error.message }

  revalidatePath("/admin/pages")
  revalidatePath("/")
  return { success: true }
}

export async function updatePage(
  id: string,
  data: {
    title: string
    content?: string
    meta_description?: string
  }
) {
  await requireAdmin()
  const supabase = createAdminClient()

  let contentJson: Record<string, unknown> = {}
  if (data.content) {
    try {
      contentJson = JSON.parse(data.content)
    } catch {
      contentJson = { body: data.content }
    }
  }

  const { error } = await supabase
    .from("pages")
    .update({
      title: data.title,
      content: contentJson,
      meta_description: data.meta_description || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/admin/pages")
  revalidatePath("/")
  revalidatePath("/about")
  revalidatePath("/catalog")
  revalidatePath("/formats")
  return { success: true }
}

export async function deletePage(id: string) {
  await requireAdmin()
  const supabase = createAdminClient()

  const { error } = await supabase.from("pages").delete().eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/admin/pages")
  return { success: true }
}

export async function savePageContent(
  slug: string,
  content: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()
  const supabase = createAdminClient()

  const { error } = await supabase
    .from("pages")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("slug", slug)

  if (error) return { success: false, error: error.message }

  revalidatePath("/admin/pages")
  revalidatePath("/")
  revalidatePath("/about")
  revalidatePath("/catalog")
  revalidatePath("/formats")
  revalidatePath(`/admin/pages/${slug}/edit`)
  return { success: true }
}

// ─── Formats ─────────────────────────────────────────────────────────────────

export async function addFormat(data: {
  name: string
  extension: string
  description?: string
  icon?: string
}) {
  await requireAdmin()
  const supabase = createAdminClient()

  const { error } = await supabase.from("formats").insert({
    name: data.name,
    extension: data.extension,
    description: data.description || null,
    icon: data.icon || null,
  })

  if (error) return { error: error.message }

  revalidatePath("/admin/formats")
  revalidatePath("/formats")
  return { success: true }
}

export async function updateFormat(
  id: string,
  data: {
    name: string
    extension: string
    description?: string
    icon?: string
  }
) {
  await requireAdmin()
  const supabase = createAdminClient()

  const { error } = await supabase
    .from("formats")
    .update({
      name: data.name,
      extension: data.extension,
      description: data.description || null,
      icon: data.icon || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/admin/formats")
  revalidatePath("/formats")
  return { success: true }
}

export async function deleteFormat(id: string) {
  await requireAdmin()
  const supabase = createAdminClient()

  const { error } = await supabase.from("formats").delete().eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/admin/formats")
  revalidatePath("/formats")
  return { success: true }
}

// ─── Nav Links ────────────────────────────────────────────────────────────────

export interface NavLinkRow {
  id: number
  label: string
  href: string
  position: number
}

/** Public read — called from navbar.tsx (server component). */
export async function getNavLinks(): Promise<NavLinkRow[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("nav_links")
      .select("id, label, href, position")
      .order("position", { ascending: true })

    if (error || !data) return []
    return data as NavLinkRow[]
  } catch {
    return []
  }
}

/** Admin write — replaces all rows with the new ordered list. */
export async function saveNavLinks(
  links: Array<{ label: string; href: string }>
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()
  const supabase = createAdminClient()

  // Delete all existing rows then re-insert in order.
  // Simple and race-condition-free for a single-admin setup.
  const { error: delError } = await supabase
    .from("nav_links")
    .delete()
    .neq("id", 0) // delete all

  if (delError) return { success: false, error: delError.message }

  const rows = links.map((l, i) => ({ label: l.label, href: l.href, position: i }))
  const { error: insError } = await supabase.from("nav_links").insert(rows)

  if (insError) return { success: false, error: insError.message }

  // Revalidate every page that renders the navbar
  revalidatePath("/", "layout")
  return { success: true }
}
