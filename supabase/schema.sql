-- ============================================================
-- Schema para la app de tracking de postulaciones
-- Ejecutar en el SQL Editor de Supabase (proyecto nuevo)
-- ============================================================

-- Supabase ya trae auth.users (login/signup). Extendemos con un perfil.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  headline text,               -- ej: "Data Engineer"
  phone text,
  location text,
  cv_summary text,             -- resumen base del CV
  cv_file_url text,            -- link al PDF subido en Supabase Storage
  linkedin_url text,
  years_experience int,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Preferencias de búsqueda de cada usuario (lo que antes te pregunté por chat)
create table public.preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  target_roles text[],         -- ej: ['Data Engineer', 'ML Engineer']
  work_mode text check (work_mode in ('remote_worldwide','remote_local','hybrid','onsite')),
  min_salary numeric,
  currency text default 'USD',
  seniority text check (seniority in ('junior','mid','senior','lead')),
  preferred_countries text[],
  updated_at timestamptz default now()
);

-- Ofertas encontradas (compartidas entre usuarios si vienen del mismo scraping/API,
-- o específicas si las agrega el usuario manualmente)
create table public.job_postings (
  id uuid primary key default gen_random_uuid(),
  source text,                  -- 'linkedin', 'azumo', 'manual', etc.
  role text not null,
  company text not null,
  location text,
  work_mode text,
  salary_range text,
  description text,
  apply_url text not null,
  posted_at timestamptz,
  created_at timestamptz default now()
);

-- Relación usuario <-> oferta: estado, CV/carta generados, notas
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  job_id uuid references public.job_postings(id) on delete cascade not null,
  status text check (status in ('nuevo','revisando','postulado','descartado')) default 'nuevo',
  match_reason text,
  cv_tailored_url text,         -- PDF generado y guardado en Storage
  cover_letter text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, job_id)
);

-- ============================================================
-- Row Level Security: cada usuario solo ve y edita sus propios datos
-- ============================================================
alter table public.profiles enable row level security;
alter table public.preferences enable row level security;
alter table public.applications enable row level security;
alter table public.job_postings enable row level security;

create policy "Los usuarios ven su propio perfil"
  on public.profiles for select using (auth.uid() = id);
create policy "Los usuarios editan su propio perfil"
  on public.profiles for update using (auth.uid() = id);
create policy "Los usuarios crean su propio perfil"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Los usuarios ven sus propias preferencias"
  on public.preferences for select using (auth.uid() = user_id);
create policy "Los usuarios editan sus propias preferencias"
  on public.preferences for all using (auth.uid() = user_id);

-- job_postings es de lectura pública (catálogo compartido de ofertas)
create policy "Cualquier usuario autenticado ve las ofertas"
  on public.job_postings for select using (auth.role() = 'authenticated');

create policy "Los usuarios ven sus propias postulaciones"
  on public.applications for select using (auth.uid() = user_id);
create policy "Los usuarios crean sus propias postulaciones"
  on public.applications for insert with check (auth.uid() = user_id);
create policy "Los usuarios editan sus propias postulaciones"
  on public.applications for update using (auth.uid() = user_id);
create policy "Los usuarios eliminan sus propias postulaciones"
  on public.applications for delete using (auth.uid() = user_id);

-- Trigger: crear perfil automáticamente cuando alguien se registra
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
