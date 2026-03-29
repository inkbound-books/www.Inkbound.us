"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"

async function requireAdmin() {
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")
  if (session?.value !== "authenticated") {
    throw new Error("Unauthorized")
  }
}

// ─── Books ──────────────────────────────────────────────────────────────────

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

  if (error) {
    return { error: error.message }
  }

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

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/books")
  revalidatePath("/catalog")
  revalidatePath("/")
  return { success: true }
}

export async function deleteBook(id: string) {
  await requireAdmin()
  const supabase = createAdminClient()

  const { error } = await supabase.from("books").delete().eq("id", id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/books")
  revalidatePath("/catalog")
  revalidatePath("/")
  return { success: true }
}

// ─── Pages ──────────────────────────────────────────────────────────────────

export async function createPage(data: {
  slug: string
  title: string
  content?: string
  meta_description?: string
}) {
  await requireAdmin()
  const supabase = createAdminClient()

  // Parse content as JSON if possible, otherwise store as a simple object
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

  if (error) {
    return { error: error.message }
  }

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

  // Parse content as JSON if possible, otherwise store as a simple object
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

  if (error) {
    return { error: error.message }
  }

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

  if (error) {
    return { error: error.message }
  }

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
    .update({
      content,
      updated_at: new Date().toISOString(),
    })
    .eq("slug", slug)

  if (error) {
    return { success: false, error: error.message }
  }

  // Revalidate all pages that might use this content
  revalidatePath("/admin/pages")
  revalidatePath("/")
  revalidatePath("/about")
  revalidatePath("/catalog")
  revalidatePath("/formats")
  revalidatePath(`/admin/pages/${slug}/edit`)
  
  return { success: true }
}

// ─── Formats ────────────────────────────────────────────────────────────────

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

  if (error) {
    return { error: error.message }
  }

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

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/formats")
  revalidatePath("/formats")
  return { success: true }
}

export async function deleteFormat(id: string) {
  await requireAdmin()
  const supabase = createAdminClient()

  const { error } = await supabase.from("formats").delete().eq("id", id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/formats")
  revalidatePath("/formats")
  return { success: true }
}
