create table if not exists public.words (
  id uuid primary key default gen_random_uuid(),
  study_date date not null,
  level smallint not null,
  category text not null default 'word study',
  word text not null,
  normalized_word text not null,
  answer_variants text[] not null default '{}',
  meaning_ko text not null,
  phonics text,
  audio_url text,
  source_url text,
  source_license text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (study_date, normalized_word)
);

create index if not exists words_active_date_idx
  on public.words (study_date)
  where active = true;

alter table public.words enable row level security;

drop policy if exists "Public can read active words" on public.words;
create policy "Public can read active words"
  on public.words
  for select
  to anon, authenticated
  using (active = true);
