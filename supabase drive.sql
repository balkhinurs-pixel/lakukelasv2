-- Tabel Integrasi Google Drive
create table google_drive_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'google',
  drive_email text,
  folder_id text,
  folder_url text,
  folder_name text default 'LakuKelas AI',
  status text not null default 'connected',
  connected_at timestamptz default now(),
  disconnected_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

-- Tabel Riwayat Dokumen AI
create table ai_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null,
  title text not null,
  subject text,
  class_level text,
  semester text,
  drive_file_id text,
  drive_file_url text,
  drive_folder_id text,
  mime_type text,
  is_public boolean default false,
  status text default 'created',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Aktifkan RLS
alter table google_drive_integrations enable row level security;
alter table ai_documents enable row level security;

-- Kebijakan RLS
create policy "Users can view own drive integration" on google_drive_integrations for select using (auth.uid() = user_id);
create policy "Users can insert own drive integration" on google_drive_integrations for insert with check (auth.uid() = user_id);
create policy "Users can update own drive integration" on google_drive_integrations for update using (auth.uid() = user_id);

create policy "Users can view own AI documents" on ai_documents for select using (auth.uid() = user_id);
create policy "Users can insert own AI documents" on ai_documents for insert with check (auth.uid() = user_id);
create policy "Users can update own AI documents" on ai_documents for update using (auth.uid() = user_id);
create policy "Users can delete own AI documents" on ai_documents for delete using (auth.uid() = user_id);
