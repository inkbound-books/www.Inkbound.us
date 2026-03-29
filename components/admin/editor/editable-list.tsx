"use client"

import { useState } from "react"
import { useEditor } from "./editor-context"
import { EditableText } from "./editable-text"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface EditableListProps {
  basePath: string
  items: string[]
  className?: string
  itemClassName?: string
  renderItem?: (item: string, index: number, path: string) => React.ReactNode
  addLabel?: string
  richText?: boolean
}

export function EditableList({
  basePath,
  items: initialItems,
  className,
  itemClassName,
  renderItem,
  addLabel = "Add Item",
  richText = false,
}: EditableListProps) {
  const { isEditing, changes, updateField } = useEditor()
  const [localItems, setLocalItems] = useState<string[]>(initialItems)

  // Get current items from changes or use local state
  const getCurrentItems = () => {
    const changedItems = [...localItems]
    for (const [path, value] of Object.entries(changes)) {
      if (path.startsWith(`${basePath}.`)) {
        const indexMatch = path.match(new RegExp(`^${basePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.(\\d+)$`))
        if (indexMatch) {
          const index = parseInt(indexMatch[1], 10)
          if (index < changedItems.length) {
            changedItems[index] = value
          }
        }
      }
    }
    return changedItems
  }

  const handleAddItem = () => {
    const newItems = [...localItems, "New item"]
    setLocalItems(newItems)
    // Update all items in changes
    newItems.forEach((item, index) => {
      updateField(`${basePath}.${index}`, item)
    })
  }

  const handleRemoveItem = (index: number) => {
    const newItems = localItems.filter((_, i) => i !== index)
    setLocalItems(newItems)
    // Update all remaining items
    newItems.forEach((item, i) => {
      updateField(`${basePath}.${i}`, item)
    })
    // Mark removed indices as empty (will be cleaned up on save)
    for (let i = newItems.length; i < localItems.length; i++) {
      updateField(`${basePath}.${i}`, "__DELETED__")
    }
  }

  const handleMoveItem = (index: number, direction: "up" | "down") => {
    const newItems = [...localItems]
    const targetIndex = direction === "up" ? index - 1 : index + 1
    
    if (targetIndex < 0 || targetIndex >= newItems.length) return
    
    // Swap items
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]]
    setLocalItems(newItems)
    
    // Update both indices in changes
    updateField(`${basePath}.${index}`, newItems[index])
    updateField(`${basePath}.${targetIndex}`, newItems[targetIndex])
  }

  const currentItems = getCurrentItems().filter(item => item !== "__DELETED__")

  if (!isEditing) {
    return (
      <ul className={cn("space-y-2", className)}>
        {currentItems.map((item, index) => (
          <li key={index} className={itemClassName}>
            {renderItem ? renderItem(item, index, `${basePath}.${index}`) : item}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      {currentItems.map((item, index) => (
        <div
          key={index}
          className={cn(
            "group flex items-start gap-2 rounded-md p-1 -ml-1 hover:bg-muted/50 transition-colors",
          )}
        >
          <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-muted-foreground hover:text-foreground"
              onClick={() => handleMoveItem(index, "up")}
              disabled={index === 0}
              title="Move up"
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-muted-foreground hover:text-foreground"
              onClick={() => handleMoveItem(index, "down")}
              disabled={index === currentItems.length - 1}
              title="Move down"
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>
          
          <GripVertical className="h-4 w-4 mt-1 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab flex-shrink-0" />
          
          <div className={cn("flex-1 min-w-0", itemClassName)}>
            {renderItem ? (
              renderItem(item, index, `${basePath}.${index}`)
            ) : (
              <EditableText
                path={`${basePath}.${index}`}
                value={item}
                className="w-full"
                multiline
                richText={richText}
              />
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive flex-shrink-0"
            onClick={() => handleRemoveItem(index)}
            title="Remove item"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button
        variant="outline"
        size="sm"
        className="w-full mt-2 border-dashed"
        onClick={handleAddItem}
      >
        <Plus className="mr-1.5 h-4 w-4" />
        {addLabel}
      </Button>
    </div>
  )
}
