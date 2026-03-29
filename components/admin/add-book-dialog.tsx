"use client"

import React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { addBook } from "@/app/admin/actions"
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
import { Plus, Loader2 } from "lucide-react"

const emptyForm = {
  title: "",
  author: "",
  description: "",
  cover_url: "",
  amazon_url: "",
  preview_download_url: "",
  price: "",
  is_featured: false,
}

export function AddBookDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState(emptyForm)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await addBook({
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
      setFormData(emptyForm)
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Book
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Book</DialogTitle>
          <DialogDescription>
            Add a new book to your catalog. Fill in the details below.
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
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">Author *</Label>
              <Input
                id="author"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cover_url">Cover Image URL</Label>
            <Input
              id="cover_url"
              type="url"
              value={formData.cover_url}
              onChange={(e) => setFormData({ ...formData, cover_url: e.target.value })}
              placeholder="https://example.com/cover.jpg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price (USD)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="9.99"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amazon_url">Amazon URL</Label>
            <Input
              id="amazon_url"
              type="url"
              value={formData.amazon_url}
              onChange={(e) => setFormData({ ...formData, amazon_url: e.target.value })}
              placeholder="https://amazon.com/dp/..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preview_download_url">Preview Download URL</Label>
            <Input
              id="preview_download_url"
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
              id="is_featured"
              checked={formData.is_featured}
              onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
            />
            <Label htmlFor="is_featured">Feature this book</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Book"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
