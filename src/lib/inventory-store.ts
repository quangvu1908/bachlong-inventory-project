import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { initialMaterials, type Material } from '@/lib/inventory-data'

export type TransactionType =
  | 'NHAP_HANG' // receive from supplier → +stock
  | 'XUAT_KHO_BAR' // issue kho → bar : -stock +barStock
  | 'KIEM_KE' // adjust warehouse stock
  | 'KIEM_KE_BAR' // adjust bar stock

export interface Transaction {
  id: string
  type: TransactionType
  date: string // ISO date
  materialId: string
  materialName: string
  /** quantity in kho unit (for NHAP/XUAT/KIEM_KE) or bar unit (KIEM_KE_BAR) */
  quantity: number
  /** unit the quantity is expressed in */
  unit: string
  /** unit price at time of transaction (kho unit price) */
  unitPrice: number
  /** total amount = quantity * unitPrice (for receipt) */
  amount: number
  /** stock before the transaction (in the affected unit) */
  before: number
  /** stock after the transaction (in the affected unit) */
  after: number
  note?: string
  createdAt: number
}

interface InventoryState {
  materials: Material[]
  transactions: Transaction[]
  /** add or update a material */
  upsertMaterial: (m: Omit<Material, 'id'> & { id?: string }) => string
  deleteMaterial: (id: string) => void
  /** record a receipt: +stock */
  recordReceipt: (input: {
    materialId: string
    quantity: number
    unitPrice: number
    date: string
    note?: string
  }) => void
  /** issue from warehouse to bar: -stock, +barStock */
  recordIssue: (input: {
    materialId: string
    quantity: number
    date: string
    note?: string
  }) => void
  /** adjust warehouse stock to a counted value */
  recordWarehouseCount: (input: {
    materialId: string
    counted: number
    date: string
    note?: string
  }) => void
  /** adjust bar stock to a counted value */
  recordBarCount: (input: {
    materialId: string
    counted: number
    date: string
    note?: string
  }) => void
  resetData: () => void
}

const genId = () => `t${Date.now()}${Math.floor(Math.random() * 1000)}`

/** seed a handful of historical transactions so charts/history look alive */
function seedTransactions(): Transaction[] {
  const now = Date.now()
  const day = 86400000
  const seeds: Array<Omit<Transaction, 'id' | 'createdAt'>> = [
    {
      type: 'NHAP_HANG',
      date: new Date(now - day * 6).toISOString().slice(0, 10),
      materialId: 'm1',
      materialName: 'Trà đen Đài Loan',
      quantity: 5,
      unit: 'kg',
      unitPrice: 180000,
      amount: 900000,
      before: 3.5,
      after: 8.5,
      note: 'Nhập lô từ NCC Minh Long',
    },
    {
      type: 'XUAT_KHO_BAR',
      date: new Date(now - day * 5).toISOString().slice(0, 10),
      materialId: 'm3',
      materialName: 'Sữa tươi không đường',
      quantity: 6,
      unit: 'lít',
      unitPrice: 32000,
      amount: 192000,
      before: 30,
      after: 24,
      note: 'Xuất bổ sung quầy bar',
    },
    {
      type: 'NHAP_HANG',
      date: new Date(now - day * 4).toISOString().slice(0, 10),
      materialId: 'm7',
      materialName: 'Trân châu đen',
      quantity: 4,
      unit: 'kg',
      unitPrice: 55000,
      amount: 220000,
      before: 2.2,
      after: 6.2,
    },
    {
      type: 'XUAT_KHO_BAR',
      date: new Date(now - day * 3).toISOString().slice(0, 10),
      materialId: 'm5',
      materialName: 'Đường trắng tinh luyện',
      quantity: 3,
      unit: 'kg',
      unitPrice: 28000,
      amount: 84000,
      before: 15,
      after: 12,
    },
    {
      type: 'KIEM_KE_BAR',
      date: new Date(now - day * 2).toISOString().slice(0, 10),
      materialId: 'm2',
      materialName: 'Trà xanh matcha',
      quantity: 250,
      unit: 'g',
      unitPrice: 420,
      amount: 0,
      before: 280,
      after: 250,
      note: 'Kiểm bar cuối ngày',
    },
    {
      type: 'NHAP_HANG',
      date: new Date(now - day * 1).toISOString().slice(0, 10),
      materialId: 'm6',
      materialName: 'Đường nâu đen',
      quantity: 3,
      unit: 'kg',
      unitPrice: 45000,
      amount: 135000,
      before: 1.5,
      after: 4.5,
    },
    {
      type: 'XUAT_KHO_BAR',
      date: new Date(now - day * 1).toISOString().slice(0, 10),
      materialId: 'm4',
      materialName: 'Sữa đặc có đường',
      quantity: 6,
      unit: 'lon',
      unitPrice: 22000,
      amount: 132000,
      before: 36,
      after: 30,
    },
  ]
  return seeds.map((s, i) => ({
    ...s,
    id: `seed${i}`,
    createdAt: now - (seeds.length - i) * 3600000,
  }))
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      materials: initialMaterials,
      transactions: seedTransactions(),

      upsertMaterial: (m) => {
        const id = m.id ?? `m${Date.now()}`
        set((state) => {
          const exists = state.materials.some((x) => x.id === id)
          const materials = exists
            ? state.materials.map((x) =>
                x.id === id ? ({ ...x, ...m, id } as Material) : x
              )
            : [{ ...m, id } as Material, ...state.materials]
          return { materials }
        })
        return id
      },

      deleteMaterial: (id) =>
        set((state) => ({
          materials: state.materials.filter((m) => m.id !== id),
        })),

      recordReceipt: ({ materialId, quantity, unitPrice, date, note }) => {
        const m = get().materials.find((x) => x.id === materialId)
        if (!m) return
        const before = m.stock
        const after = before + quantity
        const tx: Transaction = {
          id: genId(),
          type: 'NHAP_HANG',
          date,
          materialId,
          materialName: m.name,
          quantity,
          unit: m.unit,
          unitPrice,
          amount: quantity * unitPrice,
          before,
          after,
          note,
          createdAt: Date.now(),
        }
        set((state) => ({
          materials: state.materials.map((x) =>
            x.id === materialId
              ? { ...x, stock: after, unitPrice }
              : x
          ),
          transactions: [tx, ...state.transactions],
        }))
      },

      recordIssue: ({ materialId, quantity, date, note }) => {
        const m = get().materials.find((x) => x.id === materialId)
        if (!m) return
        const khoBefore = m.stock
        const khoAfter = Math.max(0, khoBefore - quantity)
        // convert kho qty → bar qty for barStock addition
        const factor = m.convertFactor ?? 1
        const barQty = quantity * factor
        const barBefore = m.barStock
        const barAfter = barBefore + barQty
        const tx: Transaction = {
          id: genId(),
          type: 'XUAT_KHO_BAR',
          date,
          materialId,
          materialName: m.name,
          quantity,
          unit: m.unit,
          unitPrice: m.unitPrice,
          amount: quantity * m.unitPrice,
          before: khoBefore,
          after: khoAfter,
          note: note ?? `+${barQty} ${m.unitBar ?? m.unit} tại Bar`,
          createdAt: Date.now(),
        }
        set((state) => ({
          materials: state.materials.map((x) =>
            x.id === materialId
              ? { ...x, stock: khoAfter, barStock: barAfter }
              : x
          ),
          transactions: [tx, ...state.transactions],
        }))
      },

      recordWarehouseCount: ({ materialId, counted, date, note }) => {
        const m = get().materials.find((x) => x.id === materialId)
        if (!m) return
        const before = m.stock
        const after = counted
        const tx: Transaction = {
          id: genId(),
          type: 'KIEM_KE',
          date,
          materialId,
          materialName: m.name,
          quantity: Number((after - before).toFixed(3)),
          unit: m.unit,
          unitPrice: m.unitPrice,
          amount: 0,
          before,
          after,
          note: note ?? `Kiểm kho: chênh lệch ${Number((after - before).toFixed(3))} ${m.unit}`,
          createdAt: Date.now(),
        }
        set((state) => ({
          materials: state.materials.map((x) =>
            x.id === materialId ? { ...x, stock: after } : x
          ),
          transactions: [tx, ...state.transactions],
        }))
      },

      recordBarCount: ({ materialId, counted, date, note }) => {
        const m = get().materials.find((x) => x.id === materialId)
        if (!m) return
        const before = m.barStock
        const after = counted
        const tx: Transaction = {
          id: genId(),
          type: 'KIEM_KE_BAR',
          date,
          materialId,
          materialName: m.name,
          quantity: Number((after - before).toFixed(3)),
          unit: m.unitBar ?? m.unit,
          unitPrice: (m.unitPrice / (m.convertFactor ?? 1)),
          amount: 0,
          before,
          after,
          note: note ?? `Kiểm bar: chênh lệch ${Number((after - before).toFixed(3))} ${m.unitBar ?? m.unit}`,
          createdAt: Date.now(),
        }
        set((state) => ({
          materials: state.materials.map((x) =>
            x.id === materialId ? { ...x, barStock: after } : x
          ),
          transactions: [tx, ...state.transactions],
        }))
      },

      resetData: () =>
        set({ materials: initialMaterials, transactions: seedTransactions() }),
    }),
    {
      name: 'tra-house-inventory-v1',
      version: 1,
    }
  )
)
