"use client"

import { useState, useRef, useEffect, type KeyboardEvent, useCallback } from "react"
import { useEditor } from "./editor-context"
import { cn } from "@/lib/utils"
import { Bold, Italic, Link, Unlink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EditableTextProps {
  path: string
  value: string
  className?: string
  as?: "h1" | "h2" | "h3" | "p" | "span" | "li"
  multiline?: boolean
  richText?: boolean
}

export function EditableText({
  path,
  value,
  className,
  as: Component = "span",
  multiline = false,
  richText = false,
}: EditableTextProps) {
  const { isEditing, changes, updateField } = useEditor()
  const [isActive, setIsActive] = useState(false)
  const [, setForceUpdate] = useState(0)
  const elementRef = useRef<HTMLElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Get current value (from changes or original)
  const currentValue = changes[path] !== undefined ? changes[path] : value
  const hasLocalChange = changes[path] !== undefined

  // Set initial content when not active
  useEffect(() => {
    if (elementRef.current && !isActive) {
      if (richText) {
        elementRef.current.innerHTML = currentValue
      } else {
        elementRef.current.textContent = currentValue
      }
    }
  }, [currentValue, isActive, richText])

  // Debounced save function
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      if (elementRef.current) {
        const newValue = richText 
          ? elementRef.current.innerHTML 
          : elementRef.current.textContent || ""
        if (newValue !== value) {
          updateField(path, newValue)
        }
      }
    }, 300)
  }, [richText, value, updateField, path])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const handleFocus = () => {
    setIsActive(true)
  }

  const handleBlur = (e: React.FocusEvent) => {
    // Don't blur if clicking on toolbar
    if (toolbarRef.current?.contains(e.relatedTarget as Node)) {
      return
    }
    
    // Clear any pending debounce and save immediately
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    setIsActive(false)
    if (elementRef.current) {
      const newValue = richText 
        ? elementRef.current.innerHTML 
        : elementRef.current.textContent || ""
      if (newValue !== value) {
        updateField(path, newValue)
      }
    }
  }

  const handleInput = () => {
    // Save on every input with debounce to prevent losing content
    debouncedSave()
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    // Allow Enter key in multiline mode
    if (e.key === "Enter") {
      if (multiline) {
        // Allow the default Enter behavior for new lines
        // Save after a short delay
        setTimeout(() => debouncedSave(), 50)
        return
      } else {
        // Single line - blur on enter
        e.preventDefault()
        elementRef.current?.blur()
        return
      }
    }
    
    if (e.key === "Escape") {
      if (elementRef.current) {
        if (richText) {
          elementRef.current.innerHTML = value
        } else {
          elementRef.current.textContent = value
        }
      }
      elementRef.current?.blur()
      return
    }

    // Keyboard shortcuts for formatting
    if (richText && (e.ctrlKey || e.metaKey)) {
      if (e.key === "b") {
        e.preventDefault()
        applyFormat("bold")
      } else if (e.key === "i") {
        e.preventDefault()
        applyFormat("italic")
      } else if (e.key === "k") {
        e.preventDefault()
        applyFormat("link")
      }
    }
  }

  const applyFormat = (format: "bold" | "italic" | "link") => {
    // Store selection before applying format
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    if (format === "bold") {
      document.execCommand("bold", false)
    } else if (format === "italic") {
      document.execCommand("italic", false)
    } else if (format === "link") {
      const currentRange = selection.getRangeAt(0)
      const parentLink = currentRange.commonAncestorContainer.parentElement?.closest("a")
      
      if (parentLink) {
        document.execCommand("unlink", false)
      } else {
        const url = prompt("Enter URL:")
        if (url) {
          document.execCommand("createLink", false, url)
        }
      }
    }

    // Update the value after formatting
    if (elementRef.current) {
      const newValue = elementRef.current.innerHTML
      updateField(path, newValue)
    }

    // Force re-render to update button states
    setForceUpdate(n => n + 1)

    // Keep focus on the element
    elementRef.current?.focus()
  }

  const isFormatActive = (format: "bold" | "italic" | "link"): boolean => {
    if (!isActive) return false
    
    try {
      if (format === "bold") {
        return document.queryCommandState("bold")
      } else if (format === "italic") {
        return document.queryCommandState("italic")
      } else if (format === "link") {
        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          return !!range.commonAncestorContainer.parentElement?.closest("a")
        }
      }
    } catch {
      return false
    }
    return false
  }

  if (!isEditing) {
    if (richText) {
      return <Component className={className} dangerouslySetInnerHTML={{ __html: currentValue }} />
    }
    return <Component className={className}>{currentValue}</Component>
  }

  return (
    <div className="relative group">
      {/* Fixed toolbar - appears above the element when active */}
      {richText && isActive && (
        <div
          ref={toolbarRef}
          className="absolute -top-10 left-0 z-50 flex items-center gap-1 rounded-md border bg-popover p-1 shadow-md"
          onMouseDown={(e) => e.preventDefault()}
        >
          <Button
            type="button"
            variant={isFormatActive("bold") ? "default" : "ghost"}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => applyFormat("bold")}
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant={isFormatActive("italic") ? "default" : "ghost"}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => applyFormat("italic")}
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-3.5 w-3.5" />
          </Button>
          <div className="mx-0.5 h-4 w-px bg-border" />
          <Button
            type="button"
            variant={isFormatActive("link") ? "default" : "ghost"}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => applyFormat("link")}
            title="Link (Ctrl+K)"
          >
            {isFormatActive("link") ? (
              <Unlink className="h-3.5 w-3.5" />
            ) : (
              <Link className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      )}
      
      <Component
        ref={elementRef as React.RefObject<HTMLElement & HTMLParagraphElement & HTMLHeadingElement & HTMLSpanElement & HTMLLIElement>}
        className={cn(
          className,
          "outline-none transition-all duration-150",
          "ring-offset-background",
          isActive && "ring-2 ring-primary ring-offset-2 rounded-sm",
          !isActive && "hover:ring-1 hover:ring-primary/50 hover:ring-offset-1 rounded-sm cursor-text",
          hasLocalChange && !isActive && "bg-primary/10",
          richText && "[&_a]:text-primary [&_a]:underline"
        )}
        contentEditable
        suppressContentEditableWarning
        onFocus={handleFocus}
        onBlur={handleBlur}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        role="textbox"
        aria-label={`Edit ${path.split('.').pop()}`}
        aria-multiline={multiline}
        tabIndex={0}
      >
        {richText ? undefined : currentValue}
      </Component>
    </div>
  )
}
