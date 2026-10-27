-- ============================================================
-- 2026 고등학교 AI 디지털 선도교사 연수
-- 바이브코딩 사례 나눔과 아이데이션 해커톤 · 웹앱 갤러리 Supabase 스키마
--
-- Supabase 대시보드 > SQL Editor 에 전체를 붙여 넣고 Run 하면 끝납니다.
-- 여러 번 실행해도 안전합니다(if not exists / or replace).
--
-- 이 연수용 테이블과 함수는 이름이 전부 aileader_ 로 시작합니다.
-- 같은 프로젝트의 apps / feedback / vibe1_ / vibe1gg_ 는 건드리지 않습니다.
--
-- 보안 구조
--  1) 테이블은 RLS를 켜고 정책을 하나도 만들지 않습니다. 화면(anon 키)은
--     테이블을 직접 읽거나 쓰지 못합니다.
--  2) 모든 읽기와 쓰기는 아래 aileader_ 함수(RPC)로만 합니다. 함수가 글자 수,
--     주소 형식, 본인 여부, 올리는 속도를 검사합니다.
--  3) 로그인이 없으므로 브라우저마다 임의 열쇠(client key, 16진수 32자)를 만들어
--     localStorage 에 둡니다. DB에는 열쇠의 sha256 해시만 저장하고 밖으로 내보내지
--     않습니다. 좋아요 중복 방지, 내 글 고치기와 지우기, 신고 중복 방지에 사용합니다.
-- ============================================================


-- ---------- 글 (aileader_posts) ----------
-- kind = 'app'     : 만든 앱. 앱 주소 필수, 깃허브 저장소 주소 선택
-- kind = 'problem' : 풀고 싶은 문제. 주소 없음. 앱을 만들면 작성자가 'app'으로 고친다.
create table if not exists public.aileader_posts (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  kind         text not null check (kind in ('app', 'problem')),
  author_name  text not null check (char_length(author_name) between 1 and 20),
  title        text not null check (char_length(title) between 1 and 40),
  problem      text not null check (char_length(problem) between 1 and 400),
  app_url      text check (app_url is null or (app_url ~ '^https://[^\s]+$' and char_length(app_url) <= 300)),
  repo_url     text check (repo_url is null or (repo_url ~ '^https://github\.com/[^\s]+$' and char_length(repo_url) <= 300)),
  like_count   integer not null default 0 check (like_count >= 0),
  hidden       boolean not null default false,
  owner_hash   bytea not null,
  constraint aileader_posts_kind_url_check check (
    (kind = 'app' and app_url is not null)
    or (kind = 'problem' and app_url is null and repo_url is null)
  )
);

create index if not exists aileader_posts_created_idx on public.aileader_posts (created_at desc);
create index if not exists aileader_posts_owner_idx on public.aileader_posts (owner_hash);

-- ---------- 댓글과 답글 (aileader_comments) ----------
-- parent_id 가 null 이면 댓글, 값이 있으면 그 댓글에 단 답글이다. 답글은 한 단계까지만 둔다
-- (답글에 다시 답글을 달면 함수가 원래 댓글 아래로 붙인다).
-- deleted: 답글이 달린 댓글을 작성자가 지우면 행은 남기고 내용만 비운다(답글 보존).
create table if not exists public.aileader_comments (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid not null references public.aileader_posts (id) on delete cascade,
  parent_id    uuid references public.aileader_comments (id) on delete cascade,
  created_at   timestamptz not null default now(),
  author_name  text not null check (char_length(author_name) between 1 and 20),
  content      text not null check (char_length(content) <= 200),
  hidden       boolean not null default false,
  deleted      boolean not null default false,
  owner_hash   bytea not null,
  constraint aileader_comments_content_check2 check (deleted or char_length(content) >= 1)
);

create index if not exists aileader_comments_post_idx on public.aileader_comments (post_id, created_at);
create index if not exists aileader_comments_parent_idx on public.aileader_comments (parent_id);
create index if not exists aileader_comments_owner_idx on public.aileader_comments (owner_hash, created_at);

-- ---------- 좋아요 (aileader_likes) ----------
-- 글 하나에 브라우저 하나당 한 줄. 기본 키가 중복을 막는다.
create table if not exists public.aileader_likes (
  post_id      uuid not null references public.aileader_posts (id) on delete cascade,
  client_hash  bytea not null,
  created_at   timestamptz not null default now(),
  primary key (post_id, client_hash)
);

-- ---------- 신고 (aileader_reports) ----------
-- 글 또는 댓글 하나를 가리킨다. 같은 브라우저는 같은 대상을 한 번만 신고한다.
create table if not exists public.aileader_reports (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  post_id      uuid references public.aileader_posts (id) on delete cascade,
  comment_id   uuid references public.aileader_comments (id) on delete cascade,
  client_hash  bytea not null,
  constraint aileader_reports_target_check check ((post_id is null) <> (comment_id is null))
);

create unique index if not exists aileader_reports_post_once
  on public.aileader_reports (post_id, client_hash) where post_id is not null;
create unique index if not exists aileader_reports_comment_once
  on public.aileader_reports (comment_id, client_hash) where comment_id is not null;

-- ---------- 변경 번호 (aileader_meta) ----------
-- 글·댓글·좋아요가 바뀔 때마다 rev 가 1씩 오른다. 화면은 몇 초마다 이 숫자만
-- 물어보고, 바뀌었을 때만 전체 목록을 다시 받는다(전송량 절약).
-- 대시보드 Table Editor 에서 직접 고친 것도 트리거가 잡는다.
create table if not exists public.aileader_meta (
  id   integer primary key default 1 check (id = 1),
  rev  bigint not null default 0
);
insert into public.aileader_meta (id, rev) values (1, 0) on conflict (id) do nothing;

create or replace function public.aileader_bump_rev()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  update public.aileader_meta set rev = rev + 1 where id = 1;
  return null;
end;
$$;

drop trigger if exists trg_aileader_posts_rev on public.aileader_posts;
create trigger trg_aileader_posts_rev
  after insert or update or delete on public.aileader_posts
  for each statement execute function public.aileader_bump_rev();

drop trigger if exists trg_aileader_comments_rev on public.aileader_comments;
create trigger trg_aileader_comments_rev
  after insert or update or delete on public.aileader_comments
  for each statement execute function public.aileader_bump_rev();

drop trigger if exists trg_aileader_likes_rev on public.aileader_likes;
create trigger trg_aileader_likes_rev
  after insert or update or delete on public.aileader_likes
  for each statement execute function public.aileader_bump_rev();


-- ============================================================
-- RLS 와 테이블 권한
-- 정책을 만들지 않으므로 anon/authenticated 는 행을 하나도 보거나 바꿀 수 없다.
-- 권한 자체도 회수해 두 겹으로 막는다. 아래 함수들은 security definer 로
-- 테이블 소유자 권한으로 돌기 때문에 이 제한과 무관하게 동작한다.
-- ============================================================

alter table public.aileader_posts    enable row level security;
alter table public.aileader_comments enable row level security;
alter table public.aileader_likes    enable row level security;
alter table public.aileader_reports  enable row level security;
alter table public.aileader_meta     enable row level security;

revoke all on table
  public.aileader_posts, public.aileader_comments, public.aileader_likes,
  public.aileader_reports, public.aileader_meta
from anon, authenticated;


-- ============================================================
-- 내부 도우미 (화면에서 호출할 수 없음)
-- ============================================================

-- 브라우저 열쇠 검사 + 해시
create or replace function public.aileader_hash(p_key text)
returns bytea
language plpgsql
immutable
set search_path = public
as $$
begin
  if p_key is null or p_key !~ '^[0-9a-f]{32,64}$' then
    raise exception 'aileader:bad_key';
  end if;
  return sha256(convert_to(p_key, 'UTF8'));
end;
$$;

-- 앞뒤 공백을 지우고, 빈 문자열은 null 로
create or replace function public.aileader_clean(p_text text)
returns text
language sql
immutable
set search_path = public
as $$
  select nullif(btrim(p_text), '');
$$;


-- ============================================================
-- 화면에서 부르는 함수 (RPC)
-- 오류는 'aileader:이유' 형태로 던지고, 화면(app.js)이 한국어 안내로 바꾼다.
-- 글자 수·주소 형식은 테이블 check 제약이 최종으로 막는다(오류 코드 23514).
-- ============================================================

-- 변경 번호만 돌려준다 (몇 초마다 호출, 응답이 숫자 하나)
create or replace function public.aileader_rev()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select rev from public.aileader_meta where id = 1;
$$;

-- 갤러리 전체 목록. 숨김 처리된 글·댓글은 빼고, 해시는 내보내지 않는다.
-- liked / mine / reported 는 요청한 브라우저 기준이다.
create or replace function public.aileader_feed(p_key text default null)
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_hash bytea;
begin
  if p_key is not null then
    v_hash := public.aileader_hash(p_key);
  end if;

  return json_build_object(
    'rev', (select rev from public.aileader_meta where id = 1),
    'posts', coalesce((
      select json_agg(json_build_object(
        'id',          p.id,
        'created_at',  p.created_at,
        'updated_at',  p.updated_at,
        'kind',        p.kind,
        'author_name', p.author_name,
        'title',       p.title,
        'problem',     p.problem,
        'app_url',     p.app_url,
        'repo_url',    p.repo_url,
        'like_count',  p.like_count,
        'liked',       coalesce(v_hash is not null and exists (
                         select 1 from public.aileader_likes l
                          where l.post_id = p.id and l.client_hash = v_hash), false),
        'mine',        coalesce(p.owner_hash = v_hash, false),
        'reported',    coalesce(v_hash is not null and exists (
                         select 1 from public.aileader_reports r
                          where r.post_id = p.id and r.client_hash = v_hash), false),
        -- 댓글마다 답글(replies)을 붙인다. 지웠거나 숨긴 댓글은 보이는 답글이
        -- 있을 때만 state 와 함께 내보내고, 이름과 내용은 비운다.
        'comments',    coalesce((
          select json_agg(json_build_object(
                   'id',          c.id,
                   'created_at',  c.created_at,
                   'state',       case when c.deleted then 'deleted' when c.hidden then 'hidden' else 'ok' end,
                   'author_name', case when c.deleted or c.hidden then null else c.author_name end,
                   'content',     case when c.deleted or c.hidden then null else c.content end,
                   'mine',        coalesce(c.owner_hash = v_hash, false) and not (c.deleted or c.hidden),
                   'reported',    coalesce(v_hash is not null and exists (
                                    select 1 from public.aileader_reports rp
                                     where rp.comment_id = c.id and rp.client_hash = v_hash), false),
                   'replies',     coalesce((
                     select json_agg(json_build_object(
                              'id',          r.id,
                              'created_at',  r.created_at,
                              'author_name', r.author_name,
                              'content',     r.content,
                              'mine',        coalesce(r.owner_hash = v_hash, false),
                              'reported',    coalesce(v_hash is not null and exists (
                                               select 1 from public.aileader_reports rp
                                                where rp.comment_id = r.id and rp.client_hash = v_hash), false)
                            ) order by r.created_at)
                       from public.aileader_comments r
                      where r.parent_id = c.id and not r.hidden and not r.deleted
                   ), '[]'::json)
                 ) order by c.created_at)
            from public.aileader_comments c
           where c.post_id = p.id
             and c.parent_id is null
             and ((not c.hidden and not c.deleted)
                  or exists (select 1 from public.aileader_comments r
                              where r.parent_id = c.id and not r.hidden and not r.deleted))
        ), '[]'::json)
      ) order by p.created_at desc)
        from public.aileader_posts p
       where not p.hidden
    ), '[]'::json)
  );
end;
$$;

-- 글 올리기
create or replace function public.aileader_add_post(
  p_key         text,
  p_kind        text,
  p_author_name text,
  p_title       text,
  p_problem     text,
  p_app_url     text default null,
  p_repo_url    text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash bytea := public.aileader_hash(p_key);
  v_id   uuid;
begin
  -- 한 브라우저 20개, 연수 전체 500개까지
  if (select count(*) from public.aileader_posts where owner_hash = v_hash) >= 20 then
    raise exception 'aileader:too_many_posts';
  end if;
  if (select count(*) from public.aileader_posts) >= 500 then
    raise exception 'aileader:gallery_full';
  end if;

  insert into public.aileader_posts
    (kind, author_name, title, problem, app_url, repo_url, owner_hash)
  values (
    p_kind,
    public.aileader_clean(p_author_name),
    public.aileader_clean(p_title),
    public.aileader_clean(p_problem),
    case when p_kind = 'app' then public.aileader_clean(p_app_url) end,
    case when p_kind = 'app' then public.aileader_clean(p_repo_url) end,
    v_hash
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- 내 글 고치기 (풀고 싶은 문제 > 만든 앱 으로 바꾸는 것도 여기서)
create or replace function public.aileader_edit_post(
  p_key         text,
  p_post_id     uuid,
  p_kind        text,
  p_author_name text,
  p_title       text,
  p_problem     text,
  p_app_url     text default null,
  p_repo_url    text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash bytea := public.aileader_hash(p_key);
begin
  update public.aileader_posts
     set kind        = p_kind,
         author_name = public.aileader_clean(p_author_name),
         title       = public.aileader_clean(p_title),
         problem     = public.aileader_clean(p_problem),
         app_url     = case when p_kind = 'app' then public.aileader_clean(p_app_url) end,
         repo_url    = case when p_kind = 'app' then public.aileader_clean(p_repo_url) end,
         updated_at  = now()
   where id = p_post_id and owner_hash = v_hash;

  if not found then
    raise exception 'aileader:not_owner';
  end if;
end;
$$;

-- 내 글 지우기 (댓글·좋아요·신고도 함께 지워진다)
create or replace function public.aileader_delete_post(p_key text, p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash bytea := public.aileader_hash(p_key);
begin
  delete from public.aileader_posts where id = p_post_id and owner_hash = v_hash;
  if not found then
    raise exception 'aileader:not_owner';
  end if;
end;
$$;

-- 좋아요 누르기/취소 (한 번 더 누르면 취소)
create or replace function public.aileader_toggle_like(p_key text, p_post_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash  bytea := public.aileader_hash(p_key);
  v_liked boolean;
  v_count integer;
begin
  -- 같은 글에 동시에 몰려도 숫자가 어긋나지 않도록 글 행을 잠근다
  perform 1 from public.aileader_posts where id = p_post_id and not hidden for update;
  if not found then
    raise exception 'aileader:not_found';
  end if;

  delete from public.aileader_likes where post_id = p_post_id and client_hash = v_hash;
  if found then
    v_liked := false;
    update public.aileader_posts set like_count = greatest(like_count - 1, 0)
     where id = p_post_id returning like_count into v_count;
  else
    insert into public.aileader_likes (post_id, client_hash) values (p_post_id, v_hash);
    v_liked := true;
    update public.aileader_posts set like_count = like_count + 1
     where id = p_post_id returning like_count into v_count;
  end if;

  return json_build_object('liked', v_liked, 'like_count', v_count);
end;
$$;

-- 댓글 남기기. p_parent_id 를 주면 그 댓글에 다는 답글이 된다.
-- 답글에 답글을 달면 원래 댓글(뿌리) 아래로 붙인다. 답글은 한 단계까지만 둔다.
-- (인자가 늘어난 판으로 바꾸면서 예전 4인자 판이 남아 있으면 지운다)
drop function if exists public.aileader_add_comment(text, uuid, text, text);

create or replace function public.aileader_add_comment(
  p_key         text,
  p_post_id     uuid,
  p_author_name text,
  p_content     text,
  p_parent_id   uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash   bytea := public.aileader_hash(p_key);
  v_id     uuid;
  v_parent uuid;
begin
  if not exists (select 1 from public.aileader_posts where id = p_post_id and not hidden) then
    raise exception 'aileader:not_found';
  end if;
  if p_parent_id is not null then
    select coalesce(c.parent_id, c.id) into v_parent
      from public.aileader_comments c
     where c.id = p_parent_id and c.post_id = p_post_id and not c.hidden and not c.deleted;
    if not found then
      raise exception 'aileader:not_found';
    end if;
  end if;
  -- 한 브라우저 1분에 10개, 연수 전체 3000개까지
  if (select count(*) from public.aileader_comments
       where owner_hash = v_hash and created_at > now() - interval '1 minute') >= 10 then
    raise exception 'aileader:slow_down';
  end if;
  if (select count(*) from public.aileader_comments) >= 3000 then
    raise exception 'aileader:gallery_full';
  end if;

  insert into public.aileader_comments (post_id, parent_id, author_name, content, owner_hash)
  values (p_post_id, v_parent, public.aileader_clean(p_author_name), public.aileader_clean(p_content), v_hash)
  returning id into v_id;

  return v_id;
end;
$$;

-- 내 댓글·답글 지우기
-- 답글이 달린 댓글은 행을 남기고 내용만 비운다(다른 사람의 답글을 지우지 않기 위해).
-- 답글을 지워서 비워 둔 댓글에 답글이 하나도 안 남으면 그 댓글 행도 정리한다.
create or replace function public.aileader_delete_comment(p_key text, p_comment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash   bytea := public.aileader_hash(p_key);
  v_parent uuid;
begin
  select parent_id into v_parent
    from public.aileader_comments
   where id = p_comment_id and owner_hash = v_hash and not deleted;
  if not found then
    raise exception 'aileader:not_owner';
  end if;

  if exists (select 1 from public.aileader_comments where parent_id = p_comment_id) then
    update public.aileader_comments set deleted = true, content = '' where id = p_comment_id;
  else
    delete from public.aileader_comments where id = p_comment_id;
    if v_parent is not null then
      delete from public.aileader_comments c
       where c.id = v_parent and c.deleted
         and not exists (select 1 from public.aileader_comments r where r.parent_id = c.id);
    end if;
  end if;
end;
$$;

-- 신고. 서로 다른 브라우저 3곳에서 신고하면 자동으로 숨긴다.
-- 숨긴 것은 진행자가 Table Editor 에서 hidden 을 false 로 바꾸면 다시 보인다.
create or replace function public.aileader_report(
  p_key        text,
  p_post_id    uuid default null,
  p_comment_id uuid default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  c_hide_at constant integer := 3;
  v_hash    bytea := public.aileader_hash(p_key);
  v_owner   bytea;
  v_count   integer;
  v_hidden  boolean := false;
begin
  if (p_post_id is null) = (p_comment_id is null) then
    raise exception 'aileader:bad_target';
  end if;

  if p_post_id is not null then
    select owner_hash into v_owner from public.aileader_posts where id = p_post_id and not hidden;
  else
    select owner_hash into v_owner from public.aileader_comments where id = p_comment_id and not hidden and not deleted;
  end if;
  if not found then
    raise exception 'aileader:not_found';
  end if;
  if v_owner = v_hash then
    raise exception 'aileader:own_item';
  end if;

  insert into public.aileader_reports (post_id, comment_id, client_hash)
  values (p_post_id, p_comment_id, v_hash)
  on conflict do nothing;

  if p_post_id is not null then
    select count(*) into v_count from public.aileader_reports where post_id = p_post_id;
    if v_count >= c_hide_at then
      update public.aileader_posts set hidden = true where id = p_post_id;
      v_hidden := true;
    end if;
  else
    select count(*) into v_count from public.aileader_reports where comment_id = p_comment_id;
    if v_count >= c_hide_at then
      update public.aileader_comments set hidden = true where id = p_comment_id;
      v_hidden := true;
    end if;
  end if;

  return json_build_object('hidden', v_hidden);
end;
$$;


-- ============================================================
-- 함수 실행 권한
-- Supabase 는 새 함수에 anon 실행 권한을 기본으로 줄 수 있으므로 모두 회수한 뒤
-- 화면용 함수만 다시 연다. 도우미와 트리거 함수는 화면에서 부를 수 없다.
-- ============================================================

revoke all on function public.aileader_bump_rev() from public, anon, authenticated;
revoke all on function public.aileader_hash(text) from public, anon, authenticated;
revoke all on function public.aileader_clean(text) from public, anon, authenticated;

revoke all on function public.aileader_rev() from public;
revoke all on function public.aileader_feed(text) from public;
revoke all on function public.aileader_add_post(text, text, text, text, text, text, text) from public;
revoke all on function public.aileader_edit_post(text, uuid, text, text, text, text, text, text) from public;
revoke all on function public.aileader_delete_post(text, uuid) from public;
revoke all on function public.aileader_toggle_like(text, uuid) from public;
revoke all on function public.aileader_add_comment(text, uuid, text, text, uuid) from public;
revoke all on function public.aileader_delete_comment(text, uuid) from public;
revoke all on function public.aileader_report(text, uuid, uuid) from public;

grant execute on function public.aileader_rev() to anon, authenticated;
grant execute on function public.aileader_feed(text) to anon, authenticated;
grant execute on function public.aileader_add_post(text, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.aileader_edit_post(text, uuid, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.aileader_delete_post(text, uuid) to anon, authenticated;
grant execute on function public.aileader_toggle_like(text, uuid) to anon, authenticated;
grant execute on function public.aileader_add_comment(text, uuid, text, text, uuid) to anon, authenticated;
grant execute on function public.aileader_delete_comment(text, uuid) to anon, authenticated;
grant execute on function public.aileader_report(text, uuid, uuid) to anon, authenticated;

-- PostgREST 가 새 함수를 바로 알아보도록 스키마 캐시를 다시 읽힌다
notify pgrst, 'reload schema';
