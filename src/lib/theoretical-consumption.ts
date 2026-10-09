/**
 * "Nổ" công thức sản phẩm + công thức BTP theo số lượng bán ra, để tính tiêu thụ
 * NVL lý thuyết. Mỗi lần bán dùng đúng phiên bản công thức có hiệu lực tại NGÀY bán đó
 * (công thức có thể đổi theo thời gian — xem product_recipes/material_recipes).
 *
 * Công thức BTP chỉ 1 tầng: một material vừa là "đầu ra" của material_recipes vừa được
 * dùng trong product_recipes thì được nổ thẳng ra NVL thô, không đệ quy thêm tầng nữa.
 */
export interface SalesRecordLite {
  product_id: string
  quantity: number
  sold_date: string
}

export interface EffectiveDatedLine {
  quantity: number
  effective_from: string
  effective_to: string | null
}

export interface ProductRecipeLite extends EffectiveDatedLine {
  product_id: string
  material_id: string
}

export interface MaterialRecipeLite extends EffectiveDatedLine {
  btp_material_id: string
  input_material_id: string
}

function isEffectiveOn(line: EffectiveDatedLine, date: string): boolean {
  return line.effective_from <= date && (line.effective_to === null || date < line.effective_to)
}

export function computeTheoreticalConsumption(
  salesRecords: SalesRecordLite[],
  productRecipes: ProductRecipeLite[],
  materialRecipes: MaterialRecipeLite[]
): Map<string, number> {
  const result = new Map<string, number>()
  const add = (materialId: string, qty: number) => {
    result.set(materialId, (result.get(materialId) ?? 0) + qty)
  }

  for (const sale of salesRecords) {
    const lines = productRecipes.filter((r) => r.product_id === sale.product_id && isEffectiveOn(r, sale.sold_date))
    for (const line of lines) {
      const needed = line.quantity * sale.quantity
      const btpInputs = materialRecipes.filter(
        (mr) => mr.btp_material_id === line.material_id && isEffectiveOn(mr, sale.sold_date)
      )
      if (btpInputs.length > 0) {
        for (const input of btpInputs) {
          add(input.input_material_id, needed * input.quantity)
        }
      } else {
        add(line.material_id, needed)
      }
    }
  }

  return result
}
