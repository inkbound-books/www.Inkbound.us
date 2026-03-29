"use client"

import React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createPage, updatePage, deletePage } from "@/app/admin/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Plus, Pencil, Trash2, Loader2, ExternalLink, Eye } from "lucide-react"
import Link from "next/link"

// Pages that support visual editing
const VISUAL_EDIT_PAGES = ["home", "about", "catalog", "formats"]

interface Page {
  id: string
  slug: string
  title: string
  content: Record<string, unknown> | null
  meta_description: string | null
  updated_at: string
}

interface PagesManagerProps {
  pages: Page[]
}

function contentToString(content: Record<string, unknown> | null): string {
  if (!content) return ""
  return JSON.stringify(content, null, 2)
}

export function PagesManager({ pages }: PagesManagerProps) {
  const router = useRouter()

  // Create page state
  const [createOpen, setCreateOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [newPage, setNewPage] = useState({
    slug: "",
    title: "",
    content: "",
    meta_description: "",
  })

  // Edit page state
  const [editOpen, setEditOpen] = useState<string | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editPage, setEditPage] = useState<{
    id: string
    title: string
    content: string
    meta_description: string
  } | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateLoading(true)
    setCreateError(null)

    const result = await createPage({
      slug: newPage.slug,
      title: newPage.title,
      content: newPage.content || undefined,
      meta_description: newPage.meta_description || undefined,
    })

    if (result.error) {
      setCreateError(result.error)
    } else {
      setCreateOpen(false)
      setNewPage({ slug: "", title: "", content: "", meta_description: "" })
      router.refresh()
    }

    setCreateLoading(false)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editPage) return
    setEditLoading(true)
    setEditError(null)

    const result = await updatePage(editPage.id, {
      title: editPage.title,
      content: editPage.content || undefined,
      meta_description: editPage.meta_description || undefined,
    })

    if (result.error) {
      setEditError(result.error)
    } else {
      setEditOpen(null)
      setEditPage(null)
      router.refresh()
    }

    setEditLoading(false)
  }

  const handleDelete = async (id: string) => {
    await deletePage(id)
    router.refresh()
  }

  const getPageUrl = (slug: string) => {
    switch (slug) {
      case "home":
        return "/"
      case "about":
        return "/about"
      case "catalog":
        return "/catalog"
      case "formats":
        return "/formats"
      default:
        return `/${slug}`
    }
  }

  return (
    <div className="space-y-6">
      {/* Create new page button */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Page
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Page</DialogTitle>
            <DialogDescription>
              Create a new content page. The slug will be used as the URL path.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            {createError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {createError}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-title">Page Title *</Label>
                <Input
                  id="new-title"
                  value={newPage.title}
                  onChange={(e) => setNewPage({ ...newPage, title: e.target.value })}
                  placeholder="My New Page"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-slug">URL Slug *</Label>
                <Input
                  id="new-slug"
                  value={newPage.slug}
                  onChange={(e) =>
                    setNewPage({
                      ...newPage,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                    })
                  }
                  placeholder="my-new-page"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-meta">Meta Description (SEO)</Label>
              <Textarea
                id="new-meta"
                value={newPage.meta_description}
                onChange={(e) => setNewPage({ ...newPage, meta_description: e.target.value })}
                rows={2}
                placeholder="Brief description for search engines..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-content">Content (JSON)</Label>
              <Textarea
                id="new-content"
                value={newPage.content}
                onChange={(e) => setNewPage({ ...newPage, content: e.target.value })}
                rows={10}
                className="font-mono text-sm"
                placeholder={'{\n  "hero_title": "Page Title",\n  "body": "Page content here..."\n}'}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createLoading}>
                {createLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Page
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Existing pages list */}
      <div className="space-y-4">
        {pages.map((page) => (
          <Card key={page.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{page.title}</CardTitle>
                  <CardDescription className="font-mono text-sm">/{page.slug}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={getPageUrl(page.slug)} target="_blank">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View
                    </Button>
                  </Link>
                  {VISUAL_EDIT_PAGES.includes(page.slug) && (
                    <Link href={`/admin/pages/${page.slug}/edit`}>
                      <Button variant="secondary" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        Visual Edit
                      </Button>
                    </Link>
                  )}
                  <Dialog
                    open={editOpen === page.id}
                    onOpenChange={(open) => {
                      setEditOpen(open ? page.id : null)
                      setEditError(null)
                      if (open) {
                        setEditPage({
                          id: page.id,
                          title: page.title,
                          content: contentToString(page.content),
                          meta_description: page.meta_description || "",
                        })
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Edit Page: {page.title}</DialogTitle>
                        <DialogDescription>Update the page content and metadata.</DialogDescription>
                      </DialogHeader>
                      {editPage && (
                        <form onSubmit={handleEdit} className="space-y-4">
                          {editError && (
                            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                              {editError}
                            </div>
                          )}
                          <div className="space-y-2">
                            <Label>Page Title</Label>
                            <Input
                              value={editPage.title}
                              onChange={(e) => setEditPage({ ...editPage, title: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Meta Description (SEO)</Label>
                            <Textarea
                              value={editPage.meta_description}
                              onChange={(e) =>
                                setEditPage({ ...editPage, meta_description: e.target.value })
                              }
                              rows={2}
                              placeholder="Brief description for search engines..."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Content (JSON)</Label>
                            <Textarea
                              value={editPage.content}
                              onChange={(e) => setEditPage({ ...editPage, content: e.target.value })}
                              rows={12}
                              className="font-mono text-sm"
                              placeholder="Enter page content as JSON..."
                            />
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditOpen(null)}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={editLoading}>
                              {editLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                              Save Changes
                            </Button>
                          </DialogFooter>
                        </form>
                      )}
                    </DialogContent>
                  </Dialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Page</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete &quot;{page.title}&quot;? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(page.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {page.meta_description || "No description set"}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Last updated: {new Date(page.updated_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {pages.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No pages found.</p>
            <p className="text-sm text-muted-foreground">Create your first page to get started.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
