'use client'

import { Check, ChevronsUpDown, Store as StoreIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useStore } from '@/lib/store-context'
import { cn } from '@/lib/utils'

export function StoreSwitcher() {
  const { loading, brands, stores, selectedStore, selectStore } = useStore()

  if (loading) {
    return <Loader2 className="size-4 animate-spin text-muted-foreground" />
  }

  if (stores.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">Chưa có cửa hàng nào</span>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 max-w-[220px] justify-between gap-1.5 px-2.5">
          <StoreIcon className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate text-xs font-medium">
            {selectedStore ? `${selectedStore.brand.name} · ${selectedStore.name}` : 'Chọn cửa hàng'}
          </span>
          <ChevronsUpDown className="size-3 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {brands.map((brand) => {
          const brandStores = stores.filter((s) => s.brand_id === brand.id)
          if (brandStores.length === 0) return null
          return (
            <div key={brand.id}>
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {brand.name}
              </DropdownMenuLabel>
              {brandStores.map((store) => (
                <DropdownMenuItem
                  key={store.id}
                  onClick={() => selectStore(store.id)}
                  className="gap-2"
                >
                  <Check
                    className={cn(
                      'size-3.5',
                      selectedStore?.id === store.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {store.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="last:hidden" />
            </div>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
