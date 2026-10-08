'use client'

import * as React from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type Brand = Database['public']['Tables']['brands']['Row']
type StoreRow = Database['public']['Tables']['stores']['Row']

export interface StoreWithBrand extends StoreRow {
  brand: Brand
}

interface StoreContextValue {
  loading: boolean
  brands: Brand[]
  stores: StoreWithBrand[]
  selectedStore: StoreWithBrand | null
  selectStore: (storeId: string) => void
  refresh: () => Promise<void>
}

const StoreContext = React.createContext<StoreContextValue | undefined>(undefined)

const STORAGE_KEY = 'bachlong-selected-store-id'

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth()
  const [loading, setLoading] = React.useState(true)
  const [brands, setBrands] = React.useState<Brand[]>([])
  const [stores, setStores] = React.useState<StoreWithBrand[]>([])
  const [selectedStoreId, setSelectedStoreId] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    const [brandsRes, storesRes] = await Promise.all([
      supabase.from('brands').select('*').order('code'),
      supabase.from('stores').select('*').eq('is_active', true).order('code'),
    ])
    const brandsData = brandsRes.data ?? []
    const brandMap = new Map(brandsData.map((b) => [b.id, b]))
    const storesData = (storesRes.data ?? [])
      .map((s) => {
        const brand = brandMap.get(s.brand_id)
        return brand ? { ...s, brand } : null
      })
      .filter((s): s is StoreWithBrand => s !== null)

    setBrands(brandsData)
    setStores(storesData)
    setLoading(false)
  }, [])

  React.useEffect(() => {
    if (profile?.role) load()
    else setLoading(false)
  }, [profile?.role, load])

  React.useEffect(() => {
    if (loading || stores.length === 0) return
    let saved: string | null = null
    try {
      saved = localStorage.getItem(STORAGE_KEY)
    } catch {
      // localStorage có thể bị chặn (chế độ ẩn danh) — bỏ qua, dùng mặc định
    }
    const valid = saved && stores.some((s) => s.id === saved)
    setSelectedStoreId(valid ? saved : stores[0].id)
  }, [loading, stores])

  const selectStore = React.useCallback((storeId: string) => {
    setSelectedStoreId(storeId)
    try {
      localStorage.setItem(STORAGE_KEY, storeId)
    } catch {
      // bỏ qua nếu không ghi được
    }
  }, [])

  const selectedStore = stores.find((s) => s.id === selectedStoreId) ?? null

  const value: StoreContextValue = {
    loading,
    brands,
    stores,
    selectedStore,
    selectStore,
    refresh: load,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = React.useContext(StoreContext)
  if (!ctx) throw new Error('useStore phải dùng bên trong StoreProvider')
  return ctx
}
