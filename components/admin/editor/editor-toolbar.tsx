"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useEditor } from "./editor-context"
import { Button } from "@/components/ui/button"
import { Save, X, Loader2, Check, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface EditorToolbarProps {
  slug: string
  onSave: (content: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>
}

export function EditorToolbar({ slug, onSave }: EditorToolbarProps) {
  const router = useRouter()
  const { hasChanges, getChangedContent, resetChanges, setOriginalContent } = useEditor()
  const [isPending, startTransition] = useTransition()
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string>("")

  const handleSave = async () => {
    setSaveStatus("idle")
    setErrorMessage("")
    
    startTransition(async () => {
      const newContent = getChangedContent()
      const result = await onSave(newContent)
      
      if (result.success) {
        setSaveStatus("success")
        setOriginalContent(newContent)
        resetChanges()
        router.refresh()
        setTimeout(() => setSaveStatus("idle"), 2000)
      } else {
        setSaveStatus("error")
        setErrorMessage(result.error || "Failed to save changes")
      }
    })
  }

  const handleDiscard = () => {
    resetChanges()
    router.refresh()
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
        "flex items-center gap-3 px-4 py-3 rounded-xl",
        "bg-background/95 backdrop-blur-sm border shadow-lg",
        "transition-all duration-300 ease-out",
        hasChanges || saveStatus !== "idle"
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none"
      )}
    >
      {saveStatus === "success" && (
        <div className="flex items-center gap-2 text-green-600">
          <Check className="h-4 w-4" />
          <span className="text-sm font-medium">Saved!</span>
        </div>
      )}

      {saveStatus === "error" && (
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{errorMessage}</span>
        </div>
      )}

      {saveStatus === "idle" && hasChanges && (
        <>
          <span className="text-sm text-muted-foreground">
            Editing <span className="font-medium text-foreground">{slug}</span>
          </span>
          
          <div className="h-4 w-px bg-border" />

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDiscard}
            disabled={isPending}
          >
            <X className="mr-1.5 h-4 w-4" />
            Discard
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </>
      )}
    </div>
  )
}
