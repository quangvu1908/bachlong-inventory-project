/**
 * Tiêu thụ thực tế của một NVL trong một khoảng thời gian, dùng chung cho báo cáo
 * Giá Vốn và báo cáo Sai Lệch Tiêu Thụ — một công thức, hai nơi dùng không bị lệch nhau.
 *
 * Ton_cuoi = ton_dau + nhap - xuat_bar - kho_adjust (điều chỉnh kể cả âm/dương)
 * => tieu_thu (ra bar + hao hụt) = xuat_bar - kho_adjust = ton_dau + nhap - ton_cuoi
 */
export interface TxnLite {
  material_id: string
  type: string
  quantity: number
  amount: number | null
  created_at: string
}

export interface ActualConsumptionRow {
  materialId: string
  tonDau: number
  nhapQty: number
  nhapValue: number
  xuatQty: number
  tonCuoi: number
  tieuThu: number
  tieuThuValue: number
}

export function computeActualConsumption(
  materialIds: string[],
  khoStockByMaterial: Map<string, number>,
  txns: TxnLite[]
): ActualConsumptionRow[] {
  return materialIds.map((materialId) => {
    const period = txns.filter((t) => t.material_id === materialId)
    const receipts = period.filter((t) => t.type === 'receipt')
    const issues = period.filter((t) => t.type === 'issue_to_bar')
    const khoChecks = period.filter((t) => t.type === 'warehouse_count')

    const nhapQty = receipts.reduce((s, t) => s + t.quantity, 0)
    const nhapValue = receipts.reduce((s, t) => s + (t.amount ?? 0), 0)
    const xuatQty = issues.reduce((s, t) => s + t.quantity, 0)
    const khoAdjust = khoChecks.reduce((s, t) => s + t.quantity, 0)

    const tonCuoi = khoStockByMaterial.get(materialId) ?? 0
    const tonDau = Math.max(0, tonCuoi - nhapQty + xuatQty - khoAdjust)
    const tieuThu = tonDau + nhapQty - tonCuoi
    const avgPrice = nhapQty > 0 ? nhapValue / nhapQty : 0
    const tieuThuValue = tieuThu * avgPrice

    return { materialId, tonDau, nhapQty, nhapValue, xuatQty, tonCuoi, tieuThu, tieuThuValue }
  })
}
