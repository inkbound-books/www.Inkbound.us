"use client"

import React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateBook } from "@/app/admin/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Pencil, Loader2 } from "lucide-react"

interface Book {
  id: string
  title: string
  author: string
  description: string | null
  cover_url: string | null
  amazon_url: string | null
  preview_download_url: string | null
  price: number | null
  is_featured: boolean
}

export function EditBookDialog({ book }: { book: Book }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: book.title,
    author: book.author,
    description: book.description || "",
    cover_url: book.cover_url || "",
    amazon_url: book.amazon_url || "",
    preview_download_url: book.preview_download_url || "",
    price: book.price?.toString() || "",
    is_featured: book.is_featured,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await updateBook(book.id, {
      title: formData.title,
      author: formData.author,
      description: formData.description || undefined,
      cover_url: formData.cover_url || undefined,
      amazon_url: formData.amazon_url || undefined,
      preview_download_url: formData.preview_download_url || undefined,
      price: formData.price || undefined,
      is_featured: formData.is_featured,
    })

    if (result.error) {
      setError(result.error)
    } else {
      setOpen(false)
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Book</DialogTitle>
          <DialogDescription>
            Update the book details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-author">Author *</Label>
              <Input
                id="edit-author"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-cover_url">Cover Image URL</Label>
            <Input
              id="edit-cover_url"
              type="url"
              value={formData.cover_url}
              onChange={(e) => setFormData({ ...formData, cover_url: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-price">Price (USD)</Label>
            <Input
              id="edit-price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-amazon_url">Amazon URL</Label>
            <Input
              id="edit-amazon_url"
              type="url"
              value={formData.amazon_url}
              onChange={(e) => setFormData({ ...formData, amazon_url: e.target.value })}
              placeholder="https://amazon.com/dp/..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-preview_download_url">Preview Download URL</Label>
            <Input
              id="edit-preview_download_url"
              type="url"
              value={formData.preview_download_url}
              onChange={(e) => setFormData({ ...formData, preview_download_url: e.target.value })}
              placeholder="https://drive.google.com/... or https://dropbox.com/..."
            />
            <p className="text-xs text-muted-foreground">
              Link to a free preview/sample chapter (Google Drive, Dropbox, etc.)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="edit-is_featured"
              checked={formData.is_featured}
              onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
            />
            <Label htmlFor="edit-is_featured">Featured</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
