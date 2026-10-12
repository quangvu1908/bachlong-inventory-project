/**
 * Tiêu thụ thực tế của một NVL trong một khoảng thời gian, dùng chung cho báo cáo
 * Giá Vốn và báo cáo Sai Lệch Tiêu Thụ — một công thức, hai nơi dùng không bị lệch nhau.
 *
 * Đúng theo sổ kho Excel Mongo: Tiêu thụ = Tồn đầu kỳ + Nhập − Tồn cuối kỳ − Điều chuyển
 * (điều chuyển sang cửa hàng khác bị trừ riêng, không tính là tiêu thụ/hao hụt).
 *
 * Ton_cuoi = ton_dau + nhap - xuat_bar - transfer_out + kho_adjust (điều chỉnh kể cả âm/dương)
 * => tieu_thu (ra bar + hao hụt) = tonDau + nhap - tonCuoi - transferOut = xuat_bar - kho_adjust
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
    const transfersOut = period.filter((t) => t.type === 'transfer_out')

    const nhapQty = receipts.reduce((s, t) => s + t.quantity, 0)
    const nhapValue = receipts.reduce((s, t) => s + (t.amount ?? 0), 0)
    const xuatQty = issues.reduce((s, t) => s + t.quantity, 0)
    const khoAdjust = khoChecks.reduce((s, t) => s + t.quantity, 0)
    const transferOutQty = transfersOut.reduce((s, t) => s + t.quantity, 0)

    const tonCuoi = khoStockByMaterial.get(materialId) ?? 0
    const tonDau = Math.max(0, tonCuoi - nhapQty + xuatQty + transferOutQty - khoAdjust)
    const tieuThu = tonDau + nhapQty - tonCuoi - transferOutQty
    const avgPrice = nhapQty > 0 ? nhapValue / nhapQty : 0
    const tieuThuValue = tieuThu * avgPrice

    return { materialId, tonDau, nhapQty, nhapValue, xuatQty, tonCuoi, tieuThu, tieuThuValue }
  })
}
