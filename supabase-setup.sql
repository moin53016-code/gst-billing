-- This table is shared publicly. Only run this for an intentionally public workspace.
begin;

create table if not exists public.billing_shared_invoices (
  id uuid primary key default gen_random_uuid(),
  revision uuid not null default gen_random_uuid(),
  number text not null default '',
  customer text not null default '',
  status text not null check (status in ('draft', 'saved')),
  payload jsonb not null check (
    jsonb_typeof(payload) = 'object'
    and coalesce(jsonb_typeof(payload->'rows') = 'array', false)
    and coalesce(payload->>'invoice' = number, false)
  ),
  updated_at timestamptz not null default now(),
  invoice_key text generated always as (
    case when status = 'saved' then lower(btrim(number)) end
  ) stored unique,
  check (status = 'draft' or length(btrim(number)) > 0)
);

alter table public.billing_shared_invoices enable row level security;
revoke all on public.billing_shared_invoices from public, anon, authenticated;
grant select on public.billing_shared_invoices to anon;
grant insert (id, revision, number, customer, status, payload, updated_at)
  on public.billing_shared_invoices to anon;
grant update (revision, number, customer, status, payload, updated_at)
  on public.billing_shared_invoices to anon;

drop policy if exists shared_invoice_read on public.billing_shared_invoices;
create policy shared_invoice_read on public.billing_shared_invoices
  for select to anon using (true);

drop policy if exists shared_invoice_insert on public.billing_shared_invoices;
create policy shared_invoice_insert on public.billing_shared_invoices
  for insert to anon with check (true);

drop policy if exists shared_invoice_update on public.billing_shared_invoices;
create policy shared_invoice_update on public.billing_shared_invoices
  for update to anon using (true) with check (true);

commit;
