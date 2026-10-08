-- 011_transactions_price_masking: view giau unit_price/amount khoi vai tro
-- khong duoc xem gia (staff). security_invoker = true: view chay voi quyen
-- cua nguoi goi nen RLS goc cua transactions (loc theo cua hang) van ap dung.

create view transactions_view
with (security_invoker = true)
as
select
  id, store_id, material_id, type, quantity, unit_code, stock_before, stock_after,
  bar_quantity, bar_unit_code, bar_stock_before, bar_stock_after,
  case when auth_can_view_price() then unit_price else null end as unit_price,
  case when auth_can_view_price() then amount else null end as amount,
  note, created_by, created_at
from transactions;

grant select on transactions_view to authenticated;
