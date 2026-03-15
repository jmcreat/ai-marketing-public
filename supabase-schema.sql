-- AI Marketing App - Supabase Schema
-- Supabase SQL Editor 에서 이 내용을 실행하세요

-- Contacts
create table if not exists contacts (
  id bigint generated always as identity primary key,
  name text not null,
  company text,
  position text,
  phone text,
  email text,
  address text,
  memo text,
  card_image_url text,
  tags text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Events
create table if not exists events (
  id bigint generated always as identity primary key,
  title text not null,
  description text,
  start_dt timestamptz not null,
  end_dt timestamptz,
  all_day boolean default false,
  color text default '#3B82F6',
  contact_id bigint references contacts(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Memos
create table if not exists memos (
  id bigint generated always as identity primary key,
  date date not null unique,
  content text default '',
  updated_at timestamptz default now()
);

-- updated_at 자동 갱신 트리거
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger contacts_updated_at
  before update on contacts
  for each row execute function update_updated_at();

create or replace trigger events_updated_at
  before update on events
  for each row execute function update_updated_at();

create or replace trigger memos_updated_at
  before update on memos
  for each row execute function update_updated_at();

-- Row Level Security (선택 - 인증 추가 시)
-- alter table contacts enable row level security;
-- alter table events enable row level security;
-- alter table memos enable row level security;
