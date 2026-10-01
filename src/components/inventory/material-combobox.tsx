'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { categoryLabels, categoryStyles, type Material } from '@/lib/inventory-data'
import { formatNum } from '@/lib/inventory-stats'
import { cn } from '@/lib/utils'

interface MaterialComboboxProps {
  materials: Material[]
  value: string
  onChange: (id: string) => void
  placeholder?: string
  /** show stock info in the trigger */
  showStock?: boolean
}

export function MaterialCombobox({
  materials,
  value,
  onChange,
  placeholder = 'Chọn nguyên vật liệu…',
  showStock = true,
}: MaterialComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')

  const selected = materials.find((m) => m.id === value)

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return materials
    return materials.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        categoryLabels[m.category].toLowerCase().includes(q)
    )
  }, [materials, query])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selected ? (
            <span className="flex items-center gap-2 truncate">
              <span
                className={cn(
                  'shrink-0 rounded border px-1 py-0.5 text-[9px] font-medium',
                  categoryStyles[selected.category]
                )}
              >
                {categoryLabels[selected.category].slice(0, 3)}
              </span>
              <span className="truncate">{selected.name}</span>
              {showStock && (
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  · {formatNum(selected.stock)} {selected.unit}
                </span>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-1 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 size-4 shrink-0 text-muted-foreground" />
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder="Tìm theo tên hoặc danh mục…"
              className="h-9 flex-1"
            />
          </div>
          <CommandList className="max-h-[260px]">
            <CommandEmpty>Không tìm thấy nguyên vật liệu.</CommandEmpty>
            <CommandGroup>
              {filtered.map((m) => (
                <CommandItem
                  key={m.id}
                  value={m.id}
                  onSelect={() => {
                    onChange(m.id)
                    setOpen(false)
                    setQuery('')
                  }}
                  className="gap-2"
                >
                  <Check
                    className={cn(
                      'size-4 shrink-0',
                      value === m.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span
                    className={cn(
                      'shrink-0 rounded border px-1 py-0.5 text-[9px] font-medium',
                      categoryStyles[m.category]
                    )}
                  >
                    {categoryLabels[m.category].slice(0, 3)}
                  </span>
                  <span className="flex-1 truncate">{m.name}</span>
                  {showStock && (
                    <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                      {formatNum(m.stock)} {m.unit}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
