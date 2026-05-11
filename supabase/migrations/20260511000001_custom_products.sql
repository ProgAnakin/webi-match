-- custom_products: global product catalog additions managed via Manager Dashboard.
-- Admins can add, edit, or archive products without touching source code.
create table if not exists public.custom_products (
  id          text primary key,
  name        text not null,
  description text not null,
  price       text not null,
  rating      numeric(3,1) not null default 4.5 check (rating between 0 and 5),
  image_url   text,
  video_url   text not null default '#',
  tags        text[] not null default '{}',
  faq         jsonb not null default '[]'::jsonb,
  status      text not null default 'active' check (status in ('active', 'archived')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.custom_products enable row level security;

-- Anon (quiz kiosk) reads active products only.
create policy "anon read active custom products"
  on public.custom_products for select to anon
  using (status = 'active');

-- Authenticated managers can read all (including archived).
create policy "auth read all custom products"
  on public.custom_products for select to authenticated
  using (true);

-- Authenticated managers can create/update/delete.
create policy "auth manage custom products"
  on public.custom_products for all to authenticated
  using (true) with check (true);

-- product_global_status: hide any product (core or custom) across all stores.
create table if not exists public.product_global_status (
  product_id  text primary key,
  hidden      boolean not null default false,
  updated_at  timestamptz not null default now()
);

alter table public.product_global_status enable row level security;

-- Anon reads (needed at quiz startup to filter hidden products).
create policy "anon read global status"
  on public.product_global_status for select to anon
  using (true);

-- Authenticated managers can manage.
create policy "auth manage global status"
  on public.product_global_status for all to authenticated
  using (true) with check (true);
