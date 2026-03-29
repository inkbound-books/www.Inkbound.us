"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface EditorContextType {
  isEditing: boolean
  hasChanges: boolean
  changes: Record<string, string>
  originalContent: Record<string, unknown>
  setOriginalContent: (content: Record<string, unknown>) => void
  updateField: (path: string, value: string) => void
  resetChanges: () => void
  getChangedContent: () => Record<string, unknown>
}

const EditorContext = createContext<EditorContextType | null>(null)

export function useEditor() {
  const context = useContext(EditorContext)
  if (!context) {
    throw new Error("useEditor must be used within an EditorProvider")
  }
  return context
}

interface EditorProviderProps {
  children: ReactNode
  initialContent: Record<string, unknown>
}

export function EditorProvider({ children, initialContent }: EditorProviderProps) {
  const [isEditing] = useState(true)
  const [originalContent, setOriginalContent] = useState<Record<string, unknown>>(initialContent)
  const [changes, setChanges] = useState<Record<string, string>>({})

  const hasChanges = Object.keys(changes).length > 0

  const updateField = useCallback((path: string, value: string) => {
    setChanges((prev) => {
      // Get original value at path
      const pathParts = path.split(".")
      let originalValue: unknown = originalContent
      for (const part of pathParts) {
        if (originalValue && typeof originalValue === "object") {
          originalValue = (originalValue as Record<string, unknown>)[part]
        }
      }

      // If value matches original, remove from changes
      if (value === originalValue) {
        const newChanges = { ...prev }
        delete newChanges[path]
        return newChanges
      }

      return { ...prev, [path]: value }
    })
  }, [originalContent])

  const resetChanges = useCallback(() => {
    setChanges({})
  }, [])

  const getChangedContent = useCallback(() => {
    // Deep clone original content
    const newContent = JSON.parse(JSON.stringify(originalContent))

    // Apply changes
    for (const [path, value] of Object.entries(changes)) {
      const pathParts = path.split(".")
      let current: Record<string, unknown> = newContent
      for (let i = 0; i < pathParts.length - 1; i++) {
        current = current[pathParts[i]] as Record<string, unknown>
      }
      current[pathParts[pathParts.length - 1]] = value
    }

    return newContent
  }, [originalContent, changes])

  return (
    <EditorContext.Provider
      value={{
        isEditing,
        hasChanges,
        changes,
        originalContent,
        setOriginalContent,
        updateField,
        resetChanges,
        getChangedContent,
      }}
    >
      {children}
    </EditorContext.Provider>
  )
}
