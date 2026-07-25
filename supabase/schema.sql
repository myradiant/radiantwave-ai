-- RadiantWaves AI - Supabase Schema
alter table if exists conversations enable row level security;
alter table if exists messages enable row level security;

create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    full_name text,
    avatar_url text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table if not exists public.conversations (
    id text primary key,
    user_id uuid references auth.users on delete cascade not null,
    title text not null default 'New Chat',
    personality_id text not null default 'general',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table if not exists public.messages (
    id text primary key,
    conversation_id text references public.conversations(id) on delete cascade not null,
    role text not null check (role in ('user', 'assistant')),
    content text not null,
    personality_id text not null default 'general',
    created_at timestamptz default now()
);

create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can view own conversations" on conversations for select using (auth.uid() = user_id);
create policy "Users can create own conversations" on conversations for insert with check (auth.uid() = user_id);
create policy "Users can update own conversations" on conversations for update using (auth.uid() = user_id);
create policy "Users can delete own conversations" on conversations for delete using (auth.uid() = user_id);
create policy "Users can view messages in own conversations" on messages for select using (conversation_id in (select id from conversations where user_id = auth.uid()));
create policy "Users can create messages in own conversations" on messages for insert with check (conversation_id in (select id from conversations where user_id = auth.uid()));
create policy "Users can delete messages in own conversations" on messages for delete using (conversation_id in (select id from conversations where user_id = auth.uid()));

create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, full_name, avatar_url)
    values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
    return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();
