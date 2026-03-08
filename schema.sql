create extension if not exists "pgcrypto";

create table if not exists children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references auth.users not null,
  name text not null,
  birthdate date not null,
  pin_hash text not null,
  avatar_color text default '#6c5ce7',
  created_at timestamptz default now()
);

create table if not exists activity_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text not null default '⭐',
  color text not null default '#6c5ce7',
  sort_order int default 0,
  is_preset boolean default true
);

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references activity_categories not null,
  name text not null,
  description text,
  points int default 10,
  is_preset boolean default true,
  sort_order int default 0
);

create table if not exists child_activities (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references children not null,
  activity_id uuid references activities not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  unique(child_id, activity_id)
);

create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references children not null,
  activity_id uuid references activities not null,
  completed_date date not null default current_date,
  completed_at timestamptz default now(),
  unique(child_id, activity_id, completed_date)
);

alter table children enable row level security;
alter table child_activities enable row level security;
alter table activity_logs enable row level security;
alter table activity_categories enable row level security;
alter table activities enable row level security;

create policy "Parents manage own children" on children
  for all using (parent_id = auth.uid());

create policy "Anyone can read categories" on activity_categories
  for select using (true);

create policy "Anyone can read activities" on activities
  for select using (true);

create policy "Parent manages child activities" on child_activities
  for all using (
    exists (select 1 from children where children.id = child_activities.child_id and children.parent_id = auth.uid())
  );

create policy "Child activities public read" on child_activities
  for select using (true);

create policy "Parent manages activity logs" on activity_logs
  for all using (
    exists (select 1 from children where children.id = activity_logs.child_id and children.parent_id = auth.uid())
  );

create policy "Activity logs public read" on activity_logs
  for select using (true);

create policy "Anyone can insert activity logs" on activity_logs
  for insert with check (true);

create policy "Anyone can delete own logs" on activity_logs
  for delete using (true);

insert into activity_categories (name, icon, color, sort_order, is_preset) values
  ('Chores', '🏠', '#00b894', 1, true),
  ('Math', '📚', '#0984e3', 2, true),
  ('Squash', '🎾', '#e17055', 3, true)
on conflict do nothing;

insert into activities (category_id, name, points, sort_order, is_preset)
select id, 'Brush Teeth', 5, 1, true from activity_categories where name = 'Chores' on conflict do nothing;
insert into activities (category_id, name, points, sort_order, is_preset)
select id, 'Bathroom Routine', 5, 2, true from activity_categories where name = 'Chores' on conflict do nothing;
insert into activities (category_id, name, points, sort_order, is_preset)
select id, 'Shower', 5, 3, true from activity_categories where name = 'Chores' on conflict do nothing;
insert into activities (category_id, name, points, sort_order, is_preset)
select id, 'Make Bed', 5, 4, true from activity_categories where name = 'Chores' on conflict do nothing;
insert into activities (category_id, name, points, sort_order, is_preset)
select id, 'Put Away Dishes', 5, 5, true from activity_categories where name = 'Chores' on conflict do nothing;
insert into activities (category_id, name, points, sort_order, is_preset)
select id, 'Tidy Room', 5, 6, true from activity_categories where name = 'Chores' on conflict do nothing;
insert into activities (category_id, name, points, sort_order, is_preset)
select id, 'Take Out Trash', 5, 7, true from activity_categories where name = 'Chores' on conflict do nothing;

insert into activities (category_id, name, points, sort_order, is_preset)
select id, 'Practice Problems', 15, 1, true from activity_categories where name = 'Math' on conflict do nothing;
insert into activities (category_id, name, points, sort_order, is_preset)
select id, 'Homework', 15, 2, true from activity_categories where name = 'Math' on conflict do nothing;
insert into activities (category_id, name, points, sort_order, is_preset)
select id, 'Reading', 10, 3, true from activity_categories where name = 'Math' on conflict do nothing;

insert into activities (category_id, name, points, sort_order, is_preset)
select id, 'Ghosting', 20, 1, true from activity_categories where name = 'Squash' on conflict do nothing;
insert into activities (category_id, name, points, sort_order, is_preset)
select id, 'Drill 1', 15, 2, true from activity_categories where name = 'Squash' on conflict do nothing;
insert into activities (category_id, name, points, sort_order, is_preset)
select id, 'Drill 2', 15, 3, true from activity_categories where name = 'Squash' on conflict do nothing;
insert into activities (category_id, name, points, sort_order, is_preset)
select id, 'Drill 3', 15, 4, true from activity_categories where name = 'Squash' on conflict do nothing;
insert into activities (category_id, name, points, sort_order, is_preset)
select id, 'Writing', 10, 5, true from activity_categories where name = 'Squash' on conflict do nothing;
