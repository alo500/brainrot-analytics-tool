-- Run in Supabase SQL editor

create table if not exists video_performance (
  id                  uuid primary key default gen_random_uuid(),
  prompt              text not null,
  model               text not null,
  platform            text not null default 'manual',
  video_url           text,
  views               bigint default 0,
  likes               bigint default 0,
  comments            bigint default 0,
  shares              bigint default 0,
  watch_time_seconds  numeric default 0,
  duration_seconds    numeric default 5,
  posted_at           timestamptz default now(),
  created_at          timestamptz default now()
);

create table if not exists generated_prompts (
  id                  uuid primary key default gen_random_uuid(),
  prompt              text not null,
  reasoning           text,
  based_on_patterns   text[] default '{}',
  model               text not null default 'both',
  aspect_ratio        text not null default '9:16',
  status              text not null default 'pending',
  created_at          timestamptz default now()
);

create index if not exists vp_views_idx on video_performance(views desc);
create index if not exists vp_posted_at_idx on video_performance(posted_at desc);
create index if not exists gp_status_idx on generated_prompts(status);
