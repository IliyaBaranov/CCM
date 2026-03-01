create extension if not exists pgcrypto;

-- teams
create table teams (
  id bigint generated always as identity primary key,
  team_slug text not null unique,
  created_at timestamptz not null default now()
);

-- sites
create table sites (
  id bigint generated always as identity primary key,
  team_id bigint not null references teams(id) on delete cascade,
  default_language text not null default 'en',
  enabled_languages jsonb not null default '["en"]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- pages
create table pages (
  id bigint generated always as identity primary key,
  site_id bigint not null references sites(id) on delete cascade,
  slug text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  unique(site_id, slug)
);

-- blocks
create table blocks (
  id bigint generated always as identity primary key,
  page_id bigint not null references pages(id) on delete cascade,
  type text not null,
  order_index int not null default 0,
  hidden boolean not null default false,
  settings jsonb not null default '{}'::jsonb,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

-- menus
create table menus (
  id bigint generated always as identity primary key,
  site_id bigint not null references sites(id) on delete cascade unique,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

-- forms
create table forms (
  id bigint generated always as identity primary key,
  site_id bigint not null references sites(id) on delete cascade,
  key text not null,
  schema jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  unique(site_id, key)
);

-- seo
create table seo (
  id bigint generated always as identity primary key,
  site_id bigint not null references sites(id) on delete cascade,
  slug text not null default 'home',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  unique(site_id, slug)
);

-- inquiries
create table inquiries (
  id uuid primary key default gen_random_uuid(),
  site_id bigint not null references sites(id) on delete cascade,
  team_slug text not null,
  source text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- audit_log
create table audit_log (
  id bigint generated always as identity primary key,
  site_id bigint references sites(id) on delete set null,
  entity_type text not null,
  entity_id text not null,
  action text not null,
  before_data jsonb,
  after_data jsonb,
  actor uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- revisions
create table revisions (
  id bigint generated always as identity primary key,
  entity_type text not null,
  entity_id text not null,
  snapshot jsonb not null,
  actor uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- user_roles
create table user_roles (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  site_id bigint not null references sites(id) on delete cascade,
  role text not null check (role in ('Superadmin', 'Admin', 'Editor')),
  unique(user_id, site_id)
);

create index idx_blocks_page_order on blocks(page_id, order_index);
create index idx_inquiries_site_created on inquiries(site_id, created_at desc);
create index idx_audit_log_site_created on audit_log(site_id, created_at desc);

alter table teams enable row level security;
alter table sites enable row level security;
alter table pages enable row level security;
alter table blocks enable row level security;
alter table menus enable row level security;
alter table forms enable row level security;
alter table seo enable row level security;
alter table inquiries enable row level security;
alter table audit_log enable row level security;
alter table revisions enable row level security;
alter table user_roles enable row level security;

create or replace function is_superadmin(p_user_id uuid) returns boolean as $$
  select exists (select 1 from user_roles where user_id = p_user_id and role = 'Superadmin');
$$ language sql security definer stable;

create or replace function get_user_role(p_user_id uuid, p_site_id bigint) returns text as $$
  select coalesce((select role from user_roles where user_id = p_user_id and site_id = p_site_id), '');
$$ language sql security definer stable;

create or replace function can_admin_site(p_user_id uuid, p_site_id bigint) returns boolean as $$
  select is_superadmin(p_user_id) or get_user_role(p_user_id, p_site_id) in ('Admin', 'Superadmin');
$$ language sql security definer stable;

create or replace function can_edit_site(p_user_id uuid, p_site_id bigint) returns boolean as $$
  select is_superadmin(p_user_id) or get_user_role(p_user_id, p_site_id) in ('Admin', 'Editor', 'Superadmin');
$$ language sql security definer stable;

create policy "Public read sites" on sites for select using (true);
create policy "Public read pages" on pages for select using (true);
create policy "Public read blocks" on blocks for select using (true);
create policy "Public read menus" on menus for select using (true);
create policy "Public read forms" on forms for select using (true);
create policy "Public read seo" on seo for select using (true);

create policy "Read teams" on teams for select using (true);
create policy "Manage teams" on teams for all using (is_superadmin(auth.uid())) with check (is_superadmin(auth.uid()));

create policy "Manage sites" on sites for all
  using (auth.role() = 'authenticated' and (is_superadmin(auth.uid()) or can_admin_site(auth.uid(), id)))
  with check (auth.role() = 'authenticated' and (is_superadmin(auth.uid()) or can_admin_site(auth.uid(), id)));

create policy "Manage pages" on pages for all
  using (auth.role() = 'authenticated' and (is_superadmin(auth.uid()) or can_edit_site(auth.uid(), site_id)))
  with check (auth.role() = 'authenticated' and (is_superadmin(auth.uid()) or can_edit_site(auth.uid(), site_id)));

create policy "Manage blocks" on blocks for all
  using (auth.role() = 'authenticated' and (is_superadmin(auth.uid()) or can_edit_site(auth.uid(), (select site_id from pages where id = page_id))))
  with check (auth.role() = 'authenticated' and (is_superadmin(auth.uid()) or can_edit_site(auth.uid(), (select site_id from pages where id = page_id))));

create policy "Manage menus" on menus for all
  using (auth.role() = 'authenticated' and (is_superadmin(auth.uid()) or can_edit_site(auth.uid(), site_id)))
  with check (auth.role() = 'authenticated' and (is_superadmin(auth.uid()) or can_edit_site(auth.uid(), site_id)));

create policy "Manage forms" on forms for all
  using (auth.role() = 'authenticated' and (is_superadmin(auth.uid()) or can_edit_site(auth.uid(), site_id)))
  with check (auth.role() = 'authenticated' and (is_superadmin(auth.uid()) or can_edit_site(auth.uid(), site_id)));

create policy "Manage seo" on seo for all
  using (auth.role() = 'authenticated' and (is_superadmin(auth.uid()) or can_edit_site(auth.uid(), site_id)))
  with check (auth.role() = 'authenticated' and (is_superadmin(auth.uid()) or can_edit_site(auth.uid(), site_id)));

create policy "Insert inquiries" on inquiries for insert with check (true);
create policy "Read inquiries" on inquiries for select
  using (auth.role() = 'authenticated' and (is_superadmin(auth.uid()) or can_admin_site(auth.uid(), site_id)));

create policy "Read audit_log" on audit_log for select
  using (auth.role() = 'authenticated' and (is_superadmin(auth.uid()) or can_admin_site(auth.uid(), site_id)));
create policy "Insert audit_log" on audit_log for insert
  with check (auth.role() = 'authenticated');

create policy "Read revisions" on revisions for select using (auth.role() = 'authenticated');
create policy "Insert revisions" on revisions for insert with check (auth.role() = 'authenticated');

create policy "Read user_roles" on user_roles for select
  using (auth.role() = 'authenticated' and (is_superadmin(auth.uid()) or can_admin_site(auth.uid(), site_id)));
create policy "Manage user_roles" on user_roles for all
  using (auth.role() = 'authenticated' and (is_superadmin(auth.uid()) or can_admin_site(auth.uid(), site_id)))
  with check (auth.role() = 'authenticated' and (is_superadmin(auth.uid()) or can_admin_site(auth.uid(), site_id)));

insert into teams (team_slug) values ('default');

insert into sites (team_id, default_language, enabled_languages)
values ((select id from teams where team_slug = 'default' limit 1), 'en', '["en", "et"]'::jsonb);

insert into pages (site_id, slug)
values ((select id from sites limit 1), 'home');

insert into blocks (page_id, type, order_index, hidden, settings, content)
values
  ((select id from pages where slug = 'home' limit 1), 'hero', 0, false, '{"spacing":"large","alignment":"left","bgType":"gradient","bgValue":"Navy → Teal","typography":"heading-xl"}'::jsonb, '{"en":{"title":"Reliable Refrigerant Gas Trading Partner","subtitle":"We supply high-quality refrigerant gases for HVAC, refrigeration, and industrial applications, working with partners across international markets.","cta":"Contact Us"},"et":{"title":"Usaldusväärne külmagaasi kaubanduspartner","subtitle":"Tarnime kvaliteetseid külmagaase HVAC, külmutus- ja tööstusrakendustele, tehes koostööd partneritega rahvusvahelistel turgudel.","cta":"Võta ühendust"}}'::jsonb),
  ((select id from pages where slug = 'home' limit 1), 'text', 1, false, '{"spacing":"large","alignment":"left","bgType":"solid","bgValue":"White","typography":"body-lg"}'::jsonb, '{"en":{"title":"About Us","body":"GasTrade Pro is a trusted B2B refrigerant gas trading company with over 15 years of experience in global markets. We connect manufacturers with distributors, ensuring reliable supply chains and competitive pricing."},"et":{"title":"Meist","body":"GasTrade Pro on usaldusväärne B2B külmagaasi kaubandusettevõte, millel on üle 15 aasta kogemust globaalsetel turgudel. Ühendame tootjaid turustajatega, tagades usaldusväärse tarneahela ja konkurentsivõimelise hinnakujunduse."}}'::jsonb),
  ((select id from pages where slug = 'home' limit 1), 'list', 2, false, '{"spacing":"large","alignment":"left","bgType":"solid","bgValue":"Muted","typography":"body-lg"}'::jsonb, '{"en":{"title":"What We Offer","items":["Full range of HFC, HFO, and natural refrigerants","Bulk and cylinder supply with flexible logistics","Competitive pricing with transparent terms","Regulatory compliance support and documentation"]},"et":{"title":"Mida pakume","items":["Täielik valik HFC, HFO ja looduslikke külmaaineid","Hulgi- ja balloonitarned paindliku logistikaga","Konkurentsivõimeline hinnakujundus läbipaistvate tingimustega","Regulatiivse vastavuse tugi ja dokumentatsioon"]}}'::jsonb),
  ((select id from pages where slug = 'home' limit 1), 'form', 3, false, '{"spacing":"large","alignment":"left","bgType":"solid","bgValue":"White","typography":"body-md"}'::jsonb, '{"en":{"title":"Contact Us","intro":"Have a question or ready to start a partnership? Fill out the form below.","submit":"Send Request","success":"Thank you for your message. We will contact you shortly."},"et":{"title":"Võta ühendust","intro":"Kas teil on küsimus või olete valmis koostööks? Täitke allolev vorm.","submit":"Saada päring","success":"Täname teid sõnumi eest. Võtame teiega peagi ühendust."}}'::jsonb);

insert into menus (site_id, items)
select id, '[{"id":"1","label":{"en":"About Us","et":"Meist"},"anchor":"#about","enabled":true},{"id":"2","label":{"en":"What We Offer","et":"Mida pakume"},"anchor":"#offers","enabled":true},{"id":"3","label":{"en":"Contact","et":"Kontakt"},"anchor":"#contact","enabled":true}]'::jsonb
from sites limit 1;

insert into forms (site_id, key, schema)
select id, 'contact', '{"fields":[{"id":"company","label":{"en":"Company Name","et":"Ettevõtte nimi"},"type":"text","required":true},{"id":"person","label":{"en":"Contact Person","et":"Kontaktisik"},"type":"text","required":true},{"id":"email","label":{"en":"Email Address","et":"E-posti aadress"},"type":"email","required":true},{"id":"message","label":{"en":"Your Message","et":"Teie sõnum"},"type":"textarea","required":true},{"id":"consent","label":{"en":"I agree to the processing of my personal data in accordance with the privacy policy.","et":"Nõustun oma isikuandmete töötlemisega vastavalt privaatsuspoliitikale."},"type":"checkbox","required":true}],"submitLabel":{"en":"Send Request","et":"Saada päring"},"successMessage":{"en":"Thank you for your message. We will contact you shortly.","et":"Täname teid sõnumi eest. Võtame teiega peagi ühendust."}}'::jsonb
from sites limit 1;

insert into seo (site_id, slug, data)
select id, 'home', '{"en":{"title":"GasTrade Pro — Reliable Refrigerant Gas Trading Partner","description":"We supply high-quality refrigerant gases for HVAC, refrigeration, and industrial applications across international markets."},"et":{"title":"GasTrade Pro — Usaldusväärne külmagaasi kaubanduspartner","description":"Tarnime kvaliteetseid külmagaase HVAC, külmutus- ja tööstusrakendustele rahvusvahelistel turgudel."}}'::jsonb
from sites limit 1;
