"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createPage, updatePage, deletePage, saveNavLinks } from "@/app/admin/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus, Pencil, Trash2, Loader2, ExternalLink, Eye,
  FileText, LayoutTemplate, Wand2, Settings, GripVertical,
  Check, AlertCircle,
} from "lucide-react"
import Link from "next/link"

const VISUAL_EDIT_PAGES = ["home", "about", "catalog", "formats"]

// ─── Page templates ───────────────────────────────────────────────────────────
const PAGE_TEMPLATES = [
  {
    id: "blank",
    name: "Blank Page",
    description: "Start with an empty page",
    icon: FileText,
    content: { hero: { title: "New Page", subtitle: "" }, body: "" },
  },
  {
    id: "article",
    name: "Article",
    description: "Title + body paragraphs",
    icon: LayoutTemplate,
    content: {
      hero: { title: "Article Title", subtitle: "A brief subtitle" },
      intro: { paragraph1: "Write your first paragraph here.", paragraph2: "Add more content here." },
      closing: { text: "Closing thoughts go here." },
    },
  },
  {
    id: "contact",
    name: "Contact Page",
    description: "Title + contact list",
    icon: Wand2,
    content: {
      hero: { title: "Contact Us", subtitle: "Get in touch" },
      contact: {
        title: "Reach Out",
        description: "You can reach us via email:",
        contacts: [{ title: "General", email: "hello@inkbound.us" }],
        footer: "We'll get back to you as soon as possible.",
      },
    },
  },
]

// ─── Types ────────────────────────────────────────────────────────────────────
interface NavLink { label: string; href: string }

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
  initialNavLinks: NavLink[]  // passed from the server page so we don't need a client fetch
}

function contentToString(content: Record<string, unknown> | null): string {
  if (!content) return ""
  return JSON.stringify(content, null, 2)
}

function getPageUrl(slug: string) {
  return slug === "home" ? "/" : `/${slug}`
}

// ─── Navbar Editor Dialog ─────────────────────────────────────────────────────
function NavbarEditorDialog({ initialLinks }: { initialLinks: NavLink[] }) {
  const [open, setOpen] = useState(false)
  const [links, setLinks] = useState<NavLink[]>(initialLinks)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")
  // For drag reorder — simple index swap on drop
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  useEffect(() => {
    if (open) {
      setLinks(initialLinks)
      setStatus("idle")
    }
  }, [open, initialLinks])

  const handleSave = async () => {
    setLoading(true)
    setStatus("idle")
    const result = await saveNavLinks(links)
    setLoading(false)
    if (result.success) {
      setStatus("success")
      setTimeout(() => { setStatus("idle"); setOpen(false) }, 1200)
    } else {
      setStatus("error")
      setErrorMsg(result.error ?? "Failed to save")
    }
  }

  const updateLink = (i: number, field: "href" | "label", val: string) =>
    setLinks((prev) => prev.map((l, idx) => idx === i ? { ...l, [field]: val } : l))

  const addLink = () => setLinks((prev) => [...prev, { href: "/new-page", label: "New Page" }])
  const removeLink = (i: number) => setLinks((prev) => prev.filter((_, idx) => idx !== i))

  const handleDragStart = (i: number) => setDragIdx(i)
  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === i) return
    const next = [...links]
    const [item] = next.splice(dragIdx, 1)
    next.splice(i, 0, item)
    setLinks(next)
    setDragIdx(i)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings className="mr-2 h-4 w-4" />
          Edit Navbar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Navigation Bar</DialogTitle>
          <DialogDescription>
            Add, remove, rename or reorder navbar links. Drag the grip handle to reorder.
            Changes go live immediately on save.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {links.map((link, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-md border bg-muted/30 px-2 py-1.5"
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDragEnd={() => setDragIdx(null)}
            >
              <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground/50" />
              <Input
                value={link.label}
                onChange={(e) => updateLink(i, "label", e.target.value)}
                placeholder="Label"
                className="h-8 w-36 text-sm"
              />
              <Input
                value={link.href}
                onChange={(e) => updateLink(i, "href", e.target.value)}
                placeholder="/path"
                className="h-8 flex-1 font-mono text-xs"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => removeLink(i)}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive/70" />
              </Button>
            </div>
          ))}
        </div>

        <Button variant="outline" size="sm" onClick={addLink} className="w-full border-dashed">
          <Plus className="mr-2 h-4 w-4" />
          Add Link
        </Button>

        {status === "error" && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : status === "success" ? (
              <Check className="mr-2 h-4 w-4" />
            ) : null}
            {status === "success" ? "Saved!" : "Save Navbar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function PagesManager({ pages, initialNavLinks }: PagesManagerProps) {
  const router = useRouter()

  // Create
  const [createOpen, setCreateOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createTab, setCreateTab] = useState<"visual" | "json">("visual")
  const [selectedTemplate, setSelectedTemplate] = useState("blank")
  const [newPage, setNewPage] = useState({ slug: "", title: "", content: "", meta_description: "" })

  // Edit
  const [editOpen, setEditOpen] = useState<string | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editPage, setEditPage] = useState<{
    id: string; title: string; content: string; meta_description: string
  } | null>(null)

  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9-]/g, "-")

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateLoading(true)
    setCreateError(null)

    let contentStr = newPage.content
    if (createTab === "visual") {
      const tpl = PAGE_TEMPLATES.find((t) => t.id === selectedTemplate)
      contentStr = JSON.stringify(tpl?.content ?? {})
    }

    const result = await createPage({
      slug: newPage.slug,
      title: newPage.title,
      content: contentStr || undefined,
      meta_description: newPage.meta_description || undefined,
    })

    if (result.error) {
      setCreateError(result.error)
    } else {
      setCreateOpen(false)
      setNewPage({ slug: "", title: "", content: "", meta_description: "" })
      setSelectedTemplate("blank")
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

  return (
    <div className="space-y-6">
      {/* Action row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Create */}
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
                Pick a template to get started, or enter raw JSON content.
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
                    onChange={(e) => {
                      const title = e.target.value
                      setNewPage((p) => ({ ...p, title, slug: p.slug || slugify(title) }))
                    }}
                    placeholder="My New Page"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-slug">URL Slug *</Label>
                  <Input
                    id="new-slug"
                    value={newPage.slug}
                    onChange={(e) => setNewPage((p) => ({ ...p, slug: slugify(e.target.value) }))}
                    placeholder="my-new-page"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-meta">Meta Description (SEO)</Label>
                <Input
                  id="new-meta"
                  value={newPage.meta_description}
                  onChange={(e) => setNewPage((p) => ({ ...p, meta_description: e.target.value }))}
                  placeholder="Brief description for search engines..."
                />
              </div>

              <Tabs value={createTab} onValueChange={(v) => setCreateTab(v as "visual" | "json")}>
                <TabsList className="w-full">
                  <TabsTrigger value="visual" className="flex-1">
                    <Wand2 className="mr-2 h-4 w-4" />Template
                  </TabsTrigger>
                  <TabsTrigger value="json" className="flex-1">
                    <FileText className="mr-2 h-4 w-4" />Raw JSON
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="visual" className="pt-3">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {PAGE_TEMPLATES.map((tpl) => {
                      const Icon = tpl.icon
                      return (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => setSelectedTemplate(tpl.id)}
                          className={`rounded-lg border p-4 text-left transition-all hover:border-primary ${
                            selectedTemplate === tpl.id
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border"
                          }`}
                        >
                          <Icon className="mb-2 h-5 w-5 text-primary" />
                          <p className="text-sm font-medium">{tpl.name}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{tpl.description}</p>
                        </button>
                      )
                    })}
                  </div>
                  {selectedTemplate && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Sections:{" "}
                      <code className="font-mono">
                        {Object.keys(
                          PAGE_TEMPLATES.find((t) => t.id === selectedTemplate)?.content ?? {}
                        ).join(", ")}
                      </code>
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="json" className="pt-3">
                  <Textarea
                    value={newPage.content}
                    onChange={(e) => setNewPage((p) => ({ ...p, content: e.target.value }))}
                    rows={8}
                    className="font-mono text-sm"
                    placeholder={'{\n  "hero": { "title": "Page Title" },\n  "body": "Content here..."\n}'}
                  />
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createLoading}>
                  {createLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Page
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Navbar editor */}
        <NavbarEditorDialog initialLinks={initialNavLinks} />
      </div>

      {/* Pages list */}
      <div className="space-y-4">
        {pages.map((page) => (
          <Card key={page.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <CardTitle className="text-lg">{page.title}</CardTitle>
                    <CardDescription className="font-mono text-sm">/{page.slug}</CardDescription>
                  </div>
                  {VISUAL_EDIT_PAGES.includes(page.slug) && (
                    <Badge variant="secondary" className="text-xs">Visual editor</Badge>
                  )}
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
                        <DialogDescription>Update page content and metadata.</DialogDescription>
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
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Content (JSON)</Label>
                            <Textarea
                              value={editPage.content}
                              onChange={(e) => setEditPage({ ...editPage, content: e.target.value })}
                              rows={12}
                              className="font-mono text-sm"
                            />
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditOpen(null)}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={editLoading}>
                              {editLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
                          Are you sure you want to delete &quot;{page.title}&quot;? This cannot be undone.
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
