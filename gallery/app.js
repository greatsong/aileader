// ============================================================
// 동작관악 AI에듀테크 선도교사단
// 바이브코딩 사례 나눔과 아이데이션 해커톤 · 웹앱 갤러리 app.js
//
// 빌드 없는 정적 SPA. vibe1 작품 갤러리(2026-vibe1/gallery)를 바탕으로
// 글 종류(만든 앱 / 풀고 싶은 문제), 깃허브 저장소 링크, 댓글, 좋아요 취소,
// 내 글 고치기·지우기, 신고를 더했다.
//
// 모든 읽기·쓰기는 Supabase RPC(aileader_ 함수)로만 한다. 테이블은 화면에서
// 직접 열리지 않는다(schema.sql). config.js 가 비어 있거나 주소에 ?demo 가
// 있으면 체험 모드(메모리 안 샘플 데이터)로 동작한다.
// ============================================================

(function () {
  "use strict";

  // ---------------------------------------------------------
  // 0. 금지어 필터 (vibe1 갤러리와 같은 목록). 배열에 단어만 추가하면 된다.
  // ---------------------------------------------------------
  const BANNED_WORDS = [
    "시발", "씨발", "씨팔", "시팔", "쓰발", "ㅅㅂ", "ㅆㅂ",
    "개새끼", "개새", "새끼", "병신", "ㅄ", "지랄", "좆", "좃",
    "존나", "존나게", "졸라", "닥쳐", "미친놈", "미친년", "쳐죽",
    "죽어", "꺼져", "걸레", "창녀", "년아", "놈아", "fuck", "shit",
    "bitch", "asshole", "damn", "faggot", "니미", "느그", "애미",
    "애비", "썅", "씹", "좇", "간나", "빙신", "새꺄", "새키",
  ];

  function findBannedWord(...texts) {
    for (const text of texts) {
      if (!text) continue;
      const normalized = String(text).toLowerCase().replace(/\s+/g, "");
      for (const word of BANNED_WORDS) {
        if (normalized.includes(word.toLowerCase())) return word;
      }
    }
    return null;
  }

  // ---------------------------------------------------------
  // 1. 모드 판별 (체험 vs 실제)
  // ---------------------------------------------------------
  const cfg = window.APP_CONFIG || {};
  const params = new URLSearchParams(location.search);
  const P = cfg.DB_PREFIX || "aileader_";

  const hasRealConfig = !!(cfg.SUPABASE_URL && cfg.SUPABASE_KEY &&
    cfg.SUPABASE_URL.trim() && cfg.SUPABASE_KEY.trim());
  const DEMO_MODE = params.has("demo") || !hasRealConfig;

  let supabaseClient = null;
  if (!DEMO_MODE) {
    try {
      supabaseClient = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    } catch (e) {
      console.error("Supabase 클라이언트 생성 실패, 체험 모드로 대체:", e);
    }
  }
  const useSupabase = !DEMO_MODE && !!supabaseClient;

  // ---------------------------------------------------------
  // 2. 브라우저 열쇠와 표시 이름 (localStorage)
  //    greatsong.github.io 아래 다른 갤러리와 저장소를 함께 사용하므로 접두어를 붙인다.
  //    열쇠는 좋아요 중복 방지와 '내 글' 확인에만 사용된다. DB에는 해시만 남는다.
  // ---------------------------------------------------------
  const KEY_STORE = P + "client_key";
  const NAME_STORE = P + "display_name";

  function readStore(k) {
    try { return localStorage.getItem(k); } catch (e) { return null; }
  }
  function writeStore(k, v) {
    try { localStorage.setItem(k, v); } catch (e) { /* 사생활 보호 모드 등: 이번 접속 동안만 유지 */ }
  }
  function makeKey() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }

  let clientKey = readStore(KEY_STORE);
  if (!/^[0-9a-f]{32,64}$/.test(clientKey || "")) {
    clientKey = makeKey();
    writeStore(KEY_STORE, clientKey);
  }
  const getSavedName = () => readStore(NAME_STORE) || "";
  const saveName = (name) => { if (name) writeStore(NAME_STORE, name); };

  // ---------------------------------------------------------
  // 3. 데이터 레이어 (실제 / 체험 공통 인터페이스)
  // ---------------------------------------------------------
  async function rpc(name, args) {
    const { data, error } = await supabaseClient.rpc(P + name, args || {});
    if (error) throw error;
    return data;
  }

  function postArgs(f) {
    return {
      p_kind: f.kind,
      p_author_name: f.author_name,
      p_title: f.title,
      p_problem: f.problem,
      p_app_url: f.kind === "app" ? f.app_url : null,
      p_repo_url: f.kind === "app" ? (f.repo_url || null) : null,
    };
  }

  const realApi = {
    rev: () => rpc("rev"),
    feed: () => rpc("feed", { p_key: clientKey }),
    addPost: (f) => rpc("add_post", { p_key: clientKey, ...postArgs(f) }),
    editPost: (id, f) => rpc("edit_post", { p_key: clientKey, p_post_id: id, ...postArgs(f) }),
    deletePost: (id) => rpc("delete_post", { p_key: clientKey, p_post_id: id }),
    toggleLike: (id) => rpc("toggle_like", { p_key: clientKey, p_post_id: id }),
    addComment: (postId, name, content, parentId) =>
      rpc("add_comment", {
        p_key: clientKey, p_post_id: postId, p_author_name: name, p_content: content, p_parent_id: parentId || null,
      }),
    deleteComment: (id) => rpc("delete_comment", { p_key: clientKey, p_comment_id: id }),
    report: (t) => rpc("report", { p_key: clientKey, p_post_id: t.postId || null, p_comment_id: t.commentId || null }),
  };

  // 체험 모드: schema.sql 함수와 같은 규칙을 메모리에서 흉내 낸다. 새로고침하면 처음으로 돌아간다.
  function makeDemoApi() {
    let rev = 1;
    let seq = 1;
    const newId = () => "demo-" + (seq++);
    const OTHER = "demo-other";
    const minutesAgo = (m) => new Date(Date.now() - m * 60000).toISOString();
    const fakeLikes = (n) => new Set(Array.from({ length: n }, (_, i) => "fake-" + i));
    const demoError = (reason) => Object.assign(new Error("aileader:" + reason), { code: "P0001" });

    const posts = [
      {
        id: newId(), created_at: minutesAgo(50), kind: "app", author_name: "별사탕 선생님",
        title: "수행평가 제출 확인판",
        problem: "과제를 낸 학생과 내지 않은 학생을 반마다 엑셀로 확인하느라 수업 전 10분이 걸렸습니다. 학생이 제출하면 바로 표시되는 확인판을 만들었습니다.",
        app_url: "https://example.com/demo-check", repo_url: "https://github.com/example/demo-check",
        owner: OTHER, likes: fakeLikes(5), reports: new Set(),
        comments: [{ id: newId(), created_at: minutesAgo(30), author_name: "물결 선생님", content: "반별 색 구분이 한눈에 들어옵니다.", owner: OTHER }],
      },
      {
        id: newId(), created_at: minutesAgo(40), kind: "problem", author_name: "라면왕 선생님",
        title: "상담 주간 예약 조율",
        problem: "상담 주간마다 가정통신문으로 희망 시간을 받고, 겹치는 시간을 손으로 조율합니다. 회신하지 않은 가정을 따로 챙기기 어렵습니다.",
        app_url: null, repo_url: null,
        owner: OTHER, likes: fakeLikes(8), reports: new Set(),
        comments: [
          { id: "demo-c1", created_at: minutesAgo(20), author_name: "산들바람", content: "저희 학교도 같은 문제가 있습니다.", owner: OTHER },
          { id: newId(), parent_id: "demo-c1", created_at: minutesAgo(15), author_name: "라면왕 선생님", content: "반갑습니다. 같이 풀어 보면 좋겠습니다.", owner: OTHER },
          { id: newId(), created_at: minutesAgo(10), author_name: "무지개", content: "미회신 가정 목록만 따로 보여도 도움이 되겠습니다.", owner: OTHER },
        ],
      },
      {
        id: newId(), created_at: minutesAgo(25), kind: "app", author_name: "코딩요정",
        title: "AI 질문 연습장",
        problem: "학생들이 AI에게 질문을 한 줄로만 던지고 답을 그대로 옮겨 적었습니다. 질문을 고쳐 쓰며 답이 어떻게 달라지는지 비교하는 연습장을 만들었습니다.",
        app_url: "https://example.com/demo-question", repo_url: null,
        owner: OTHER, likes: fakeLikes(3), reports: new Set(), comments: [],
      },
      {
        id: newId(), created_at: minutesAgo(5), kind: "problem", author_name: "파도소리",
        title: "실험 기구 대여 기록",
        problem: "과학실 기구를 빌려 간 반과 돌려준 날짜를 종이 장부에 적습니다. 어느 기구가 지금 어디 있는지 찾기 어렵습니다.",
        app_url: null, repo_url: null,
        owner: OTHER, likes: fakeLikes(2), reports: new Set(), comments: [],
      },
    ];

    const findPost = (id) => posts.find((p) => p.id === id);
    const findComment = (id) => {
      for (const p of posts) {
        const c = p.comments.find((x) => x.id === id);
        if (c) return { post: p, comment: c };
      }
      return null;
    };
    const commentView = (c) => ({
      id: c.id, created_at: c.created_at, author_name: c.author_name, content: c.content, mine: c.owner === clientKey,
      reported: !!(c.reports && c.reports.has(clientKey)),
    });
    // aileader_feed 와 같은 모양: 댓글마다 replies, 지운 댓글은 답글이 있을 때만 state 'deleted'
    const view = (p) => ({
      id: p.id, created_at: p.created_at, kind: p.kind, author_name: p.author_name,
      title: p.title, problem: p.problem, app_url: p.app_url, repo_url: p.repo_url,
      like_count: p.likes.size, liked: p.likes.has(clientKey), mine: p.owner === clientKey,
      reported: p.reports.has(clientKey),
      comments: p.comments
        .filter((c) => !c.parent_id)
        .map((c) => {
          const replies = p.comments.filter((r) => r.parent_id === c.id).map(commentView);
          if (c.deleted) {
            return { id: c.id, created_at: c.created_at, state: "deleted", author_name: null, content: null, mine: false, reported: false, replies };
          }
          return { ...commentView(c), state: "ok", replies };
        })
        .filter((c) => c.state === "ok" || c.replies.length),
    });
    const fields = (f) => ({
      kind: f.kind, author_name: f.author_name, title: f.title, problem: f.problem,
      app_url: f.kind === "app" ? f.app_url : null,
      repo_url: f.kind === "app" ? (f.repo_url || null) : null,
    });

    return {
      rev: async () => rev,
      feed: async () => ({
        rev,
        posts: posts.slice().sort((a, b) => b.created_at.localeCompare(a.created_at)).map(view),
      }),
      addPost: async (f) => {
        const p = { id: newId(), created_at: new Date().toISOString(), ...fields(f), owner: clientKey, likes: new Set(), reports: new Set(), comments: [] };
        posts.push(p); rev++;
        return p.id;
      },
      editPost: async (id, f) => {
        const p = findPost(id);
        if (!p || p.owner !== clientKey) throw demoError("not_owner");
        Object.assign(p, fields(f)); rev++;
      },
      deletePost: async (id) => {
        const i = posts.findIndex((p) => p.id === id && p.owner === clientKey);
        if (i < 0) throw demoError("not_owner");
        posts.splice(i, 1); rev++;
      },
      toggleLike: async (id) => {
        const p = findPost(id);
        if (!p) throw demoError("not_found");
        const liked = !p.likes.has(clientKey);
        if (liked) p.likes.add(clientKey); else p.likes.delete(clientKey);
        rev++;
        return { liked, like_count: p.likes.size };
      },
      addComment: async (postId, name, content, parentId) => {
        const p = findPost(postId);
        if (!p) throw demoError("not_found");
        let root = null;
        if (parentId) {
          const parent = p.comments.find((x) => x.id === parentId && !x.deleted);
          if (!parent) throw demoError("not_found");
          root = parent.parent_id || parent.id; // 답글의 답글은 원래 댓글 아래로
        }
        const c = { id: newId(), parent_id: root, created_at: new Date().toISOString(), author_name: name, content, owner: clientKey };
        p.comments.push(c); rev++;
        return c.id;
      },
      deleteComment: async (id) => {
        const hit = findComment(id);
        if (!hit || hit.comment.owner !== clientKey || hit.comment.deleted) throw demoError("not_owner");
        const { post, comment } = hit;
        if (post.comments.some((r) => r.parent_id === id)) {
          comment.deleted = true;
          comment.content = "";
        } else {
          post.comments = post.comments.filter((c) => c.id !== id);
          const parent = post.comments.find((c) => c.id === comment.parent_id);
          if (parent && parent.deleted && !post.comments.some((r) => r.parent_id === parent.id)) {
            post.comments = post.comments.filter((c) => c.id !== parent.id);
          }
        }
        rev++;
      },
      report: async (t) => {
        const target = t.postId ? findPost(t.postId) : (findComment(t.commentId) || {}).comment;
        if (!target || target.deleted) throw demoError("not_found");
        if (target.owner === clientKey) throw demoError("own_item");
        if (!target.reports) target.reports = new Set();
        target.reports.add(clientKey);
        rev++;
        return { hidden: false };
      },
    };
  }

  const api = useSupabase ? realApi : makeDemoApi();

  // ---------------------------------------------------------
  // 4. 오류 안내 (schema.sql 이 던지는 'aileader:이유' 를 한국어로)
  // ---------------------------------------------------------
  const ERROR_TEXT = {
    bad_key: "브라우저 정보를 읽지 못했습니다. 새로고침한 뒤 다시 시도해 주세요.",
    not_found: "이미 지워졌거나 숨겨진 글 또는 댓글입니다.",
    not_owner: "이 브라우저에서 올린 글과 댓글만 고치거나 지울 수 있습니다.",
    too_many_posts: "한 브라우저에서 올릴 수 있는 글은 20개까지입니다.",
    gallery_full: "갤러리 저장 공간이 가득 찼습니다. 진행자에게 알려 주세요.",
    slow_down: "댓글이 너무 빠르게 올라가고 있습니다. 1분 뒤 다시 남겨 주세요.",
    own_item: "내가 올린 글과 댓글은 신고할 수 없습니다.",
    bad_target: "신고할 대상을 찾지 못했습니다.",
  };

  function errorText(err) {
    const msg = (err && err.message) || "";
    const m = msg.match(/aileader:([a-z_]+)/);
    if (m && ERROR_TEXT[m[1]]) return ERROR_TEXT[m[1]];
    if (err && (err.code === "23514" || err.code === "23502")) {
      return "입력 형식이 맞지 않습니다. 글자 수와 주소를 확인해 주세요.";
    }
    return "처리하지 못했습니다. 잠시 뒤 다시 시도해 주세요.";
  }

  // ---------------------------------------------------------
  // 5. 입력 검사 (schema.sql 의 check 제약과 같은 규칙)
  // ---------------------------------------------------------
  const APP_URL_RE = /^https:\/\/\S+$/;
  const REPO_URL_RE = /^https:\/\/github\.com\/\S+$/;
  const LIMIT = { author: 20, title: 40, problem: 400, comment: 200, url: 300 };

  function parseUrl(str) {
    try { return new URL(str); } catch (e) { return null; }
  }

  function validatePost(f) {
    if (!f.author_name || !f.title || !f.problem || (f.kind === "app" && !f.app_url)) {
      return "별표(*) 항목을 모두 채워야 올릴 수 있습니다.";
    }
    if (f.kind === "problem" && isBareTemplate(f.problem)) {
      return "양식의 빈칸(누가·상황·원인·어려움)을 채워 주세요.";
    }
    if (f.author_name.length > LIMIT.author || f.title.length > LIMIT.title || f.problem.length > LIMIT.problem) {
      return "글자 수가 너무 깁니다. 조금 줄여 주세요.";
    }
    if (f.kind === "app") {
      const u = parseUrl(f.app_url);
      if (!u || !APP_URL_RE.test(f.app_url) || f.app_url.length > LIMIT.url) {
        return "앱 주소는 https://로 시작하는 주소여야 합니다.";
      }
      if (u.hostname === "github.com" || u.hostname === "www.github.com") {
        return "앱 주소 칸에는 배포한 웹앱 주소를 넣습니다. 깃허브 저장소 주소는 아래 칸에 넣습니다.";
      }
      if (f.repo_url && (!REPO_URL_RE.test(f.repo_url) || !parseUrl(f.repo_url) || f.repo_url.length > LIMIT.url)) {
        return "깃허브 저장소 주소는 https://github.com/으로 시작해야 합니다.";
      }
    }
    if (findBannedWord(f.author_name, f.title, f.problem)) {
      return "부적절한 표현이 있어 올릴 수 없습니다. 내용을 확인해 주세요.";
    }
    return null;
  }

  // ---------------------------------------------------------
  // 6. 상태
  // ---------------------------------------------------------
  let posts = [];
  let currentRev = null;
  let loadFailed = false;
  let filterKind = "all";
  let sortBy = "new";
  let activeView = "gallery";
  let editingId = null;
  const openComments = new Set(); // 댓글을 펼쳐 둔 글. 다시 그려도 유지한다.
  // 열려 있는 답글 입력칸(한 번에 하나). 적던 내용까지 담아 두어 다시 그려도 남는다.
  // rootId: 입력칸을 붙일 원래 댓글, targetId: 실제로 답글을 단 댓글(서버가 뿌리로 정리)
  let activeReply = null; // { postId, rootId, targetId, name, content }
  const expanded = new Set();     // '더 보기'로 펼친 글

  const KIND_LABEL = { app: "만든 앱", problem: "풀고 싶은 문제" };
  const PROBLEM_LABEL = { app: "해결하려던 문제", problem: "풀고 싶은 문제" };

  // ---------------------------------------------------------
  // 7. DOM 유틸
  // ---------------------------------------------------------
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $all = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const gridEl = $("#galleryGrid");
  const emptyEl = $("#galleryEmpty");
  const countEl = $("#galleryCount");
  const noticeEl = $("#galleryNotice");
  const cardTemplate = $("#cardTemplate");

  function showMsg(el, text, type) {
    el.textContent = text;
    el.hidden = false;
    el.className = el.className.split(" ")[0] + " " + type;
  }
  function hideMsg(el) { el.hidden = true; }

  // ---------------------------------------------------------
  // 8. 불러오기
  // ---------------------------------------------------------
  const LOAD_FAIL_MSG = "갤러리 데이터를 불러오지 못했습니다. 잠시 뒤 자동으로 다시 시도합니다. " +
    "이 안내가 계속 보이면 진행자에게 알려 주세요. (진행자 확인: Supabase SQL Editor에서 gallery/schema.sql을 실행했는지, " +
    "프로젝트가 일시 중지되지 않았는지 확인합니다.)";
  const DEMO_MSG = "체험 모드입니다. 샘플 글이 표시되며, 올린 내용은 저장되지 않고 새로고침하면 사라집니다.";

  async function reload() {
    try {
      const data = await api.feed();
      posts = (data && data.posts) || [];
      currentRev = data ? data.rev : null;
      loadFailed = false;
    } catch (e) {
      console.error("데이터 불러오기 실패:", e);
      loadFailed = true;
    }
    renderGallery();
  }

  // ---------------------------------------------------------
  // 9. 갤러리 그리기
  // ---------------------------------------------------------
  function visiblePosts() {
    const list = posts.filter((p) => filterKind === "all" || p.kind === filterKind);
    if (sortBy === "likes") {
      list.sort((a, b) => (b.like_count - a.like_count) || b.created_at.localeCompare(a.created_at));
    }
    return list;
  }

  // 다시 그리기 전에 적던 댓글을 챙겨 두었다가 되돌린다
  function collectDrafts() {
    const drafts = {};
    $all(".card", gridEl).forEach((card) => {
      const name = $(".cm-main .cm-name", card).value;
      const content = $(".cm-main .cm-content", card).value;
      if (name || content) drafts[card.dataset.postId] = { name, content };
    });
    return drafts;
  }

  function renderGallery() {
    const drafts = collectDrafts();
    gridEl.innerHTML = "";

    if (loadFailed) {
      showMsg(noticeEl, LOAD_FAIL_MSG, "error");
      countEl.hidden = true;
      emptyEl.hidden = true;
      return;
    }
    if (!useSupabase) showMsg(noticeEl, DEMO_MSG, "info");
    else hideMsg(noticeEl);

    const nApp = posts.filter((p) => p.kind === "app").length;
    const nProblem = posts.length - nApp;
    countEl.hidden = false;
    countEl.textContent = `만든 앱 ${nApp}개 · 풀고 싶은 문제 ${nProblem}개`;

    const list = visiblePosts();
    emptyEl.hidden = list.length > 0;
    if (!list.length && posts.length) {
      emptyEl.hidden = true;
      countEl.textContent += " · 이 종류에는 아직 글이 없습니다";
    }

    list.forEach((post) => gridEl.appendChild(buildCard(post, drafts[post.id])));
  }

  function buildCard(post, draft) {
    const node = cardTemplate.content.cloneNode(true);
    const card = $(".card", node);
    card.dataset.postId = post.id;
    card.classList.add("kind-" + post.kind);

    $(".kind-badge", card).textContent = KIND_LABEL[post.kind] || post.kind;
    $(".card-author", card).textContent = post.author_name;
    $(".card-title", card).textContent = post.title;
    $(".card-label", card).textContent = PROBLEM_LABEL[post.kind] || "";

    // 문제 설명: 길면 접어 두고 '더 보기'
    const problemEl = $(".card-problem", card);
    const moreBtn = $(".btn-more", card);
    problemEl.textContent = "";
    appendLinked(problemEl, post.problem);
    if (post.problem.length > 110) {
      moreBtn.hidden = false;
      const setOpen = (open) => {
        problemEl.classList.toggle("clamped", !open);
        moreBtn.textContent = open ? "접기" : "더 보기";
      };
      setOpen(expanded.has(post.id));
      moreBtn.addEventListener("click", () => {
        const open = !expanded.has(post.id);
        if (open) expanded.add(post.id); else expanded.delete(post.id);
        setOpen(open);
      });
    }

    // 링크: https 로 시작하는 주소만 연결한다
    const goBtn = $(".btn-go", card);
    const repoBtn = $(".btn-repo", card);
    const hostEl = $(".card-host", card);
    if (post.kind === "app" && post.app_url && APP_URL_RE.test(post.app_url)) {
      goBtn.href = post.app_url;
      const u = parseUrl(post.app_url);
      hostEl.textContent = u ? u.host + (u.pathname !== "/" ? u.pathname : "") : "";
    } else {
      goBtn.remove();
      hostEl.remove();
    }
    if (post.repo_url && REPO_URL_RE.test(post.repo_url)) repoBtn.href = post.repo_url;
    else repoBtn.remove();
    const linksEl = $(".card-links", card);
    if (!linksEl.children.length) linksEl.remove();

    // 좋아요
    const likeBtn = $(".btn-like", card);
    const likeCountEl = $(".like-count", card);
    likeCountEl.textContent = post.like_count;
    likeBtn.title = post.kind === "problem" ? "이 문제를 함께 풀고 싶다면 누릅니다" : "좋아요";
    likeBtn.setAttribute("aria-label", "좋아요 " + post.like_count + "개");
    setLiked(likeBtn, post.liked);
    likeBtn.addEventListener("click", async () => {
      likeBtn.disabled = true;
      try {
        const res = await api.toggleLike(post.id);
        post.liked = res.liked;
        post.like_count = res.like_count;
        likeCountEl.textContent = res.like_count;
        likeBtn.setAttribute("aria-label", "좋아요 " + res.like_count + "개");
        setLiked(likeBtn, res.liked);
      } catch (e) {
        console.error(e);
        showMsg($(".card-msg", card), errorText(e), "error");
      } finally {
        likeBtn.disabled = false;
      }
    });

    // 내 글: 고치기·지우기 / 다른 사람 글: 신고
    const msgEl = $(".card-msg", card);
    if (post.mine) {
      const editBtn = $(".btn-edit", card);
      const delBtn = $(".btn-delete", card);
      editBtn.hidden = false;
      delBtn.hidden = false;
      editBtn.addEventListener("click", () => startEdit(post));
      delBtn.addEventListener("click", async () => {
        if (!confirm(`"${post.title}" 글을 지웁니다. 댓글과 좋아요도 함께 지워지며 되돌릴 수 없습니다.`)) return;
        delBtn.disabled = true;
        try {
          await api.deletePost(post.id);
          if (editingId === post.id) resetForm();
          await reload();
        } catch (e) {
          console.error(e);
          delBtn.disabled = false;
          showMsg(msgEl, errorText(e), "error");
        }
      });
    } else {
      const reportBtn = $(".btn-report", card);
      reportBtn.hidden = false;
      if (post.reported) {
        reportBtn.disabled = true;
        reportBtn.textContent = "신고함";
      }
      reportBtn.addEventListener("click", async () => {
        if (!confirm("이 글을 신고합니다. 신고가 3건 모이면 갤러리에서 숨겨지고 진행자가 확인합니다.")) return;
        reportBtn.disabled = true;
        try {
          const res = await api.report({ postId: post.id });
          post.reported = true;
          reportBtn.textContent = "신고함";
          showMsg(msgEl, res && res.hidden ? "신고가 3건 모여 이 글을 숨겼습니다." : "신고했습니다. 진행자가 확인합니다.", "ok");
          if (res && res.hidden) setTimeout(reload, 1500);
        } catch (e) {
          console.error(e);
          reportBtn.disabled = false;
          showMsg(msgEl, errorText(e), "error");
        }
      });
    }

    // 댓글
    const details = $(".comment-block", card);
    $(".cm-count", card).textContent = countComments(post);
    renderComments($(".cm-list", card), post, card);
    details.open = openComments.has(post.id);
    details.addEventListener("toggle", () => {
      if (details.open) openComments.add(post.id); else openComments.delete(post.id);
    });

    const cmForm = $(".cm-main", card);
    const cmName = $(".cm-name", cmForm);
    const cmContent = $(".cm-content", cmForm);
    const cmMsg = $(".cm-msg", card);
    cmName.value = draft ? draft.name : getSavedName();
    if (draft) cmContent.value = draft.content;

    cmForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = cmName.value.trim();
      const content = cmContent.value.trim();
      hideMsg(cmMsg);
      if (!name || !content) return showMsg(cmMsg, "표시 이름과 댓글 내용을 모두 적어야 남길 수 있습니다.", "error");
      if (findBannedWord(name, content)) return showMsg(cmMsg, "부적절한 표현이 있어 남길 수 없습니다.", "error");

      const submitBtn = $("button[type=submit]", cmForm);
      submitBtn.disabled = true;
      try {
        await api.addComment(post.id, name, content);
        saveName(name);
        cmContent.value = "";
        openComments.add(post.id);
        await reload();
        const fresh = gridEl.querySelector(`.card[data-post-id="${post.id}"] .cm-msg`);
        if (fresh) showMsg(fresh, "댓글을 남겼습니다.", "ok");
      } catch (err) {
        console.error(err);
        showMsg(cmMsg, errorText(err), "error");
      } finally {
        submitBtn.disabled = false;
      }
    });

    return node;
  }

  function setLiked(btn, liked) {
    btn.classList.toggle("liked", !!liked);
    btn.setAttribute("aria-pressed", liked ? "true" : "false");
  }

  // 보이는 댓글 수: 내용이 있는 댓글 + 답글 (지웠거나 숨긴 댓글 자리는 세지 않는다)
  function countComments(post) {
    return post.comments.reduce((n, c) => n + (c.state === "ok" ? 1 : 0) + c.replies.length, 0);
  }

  function renderComments(listEl, post, card) {
    listEl.innerHTML = "";
    if (!post.comments.length) {
      const li = document.createElement("li");
      li.className = "cm-empty";
      li.textContent = "아직 댓글이 없습니다.";
      listEl.appendChild(li);
      return;
    }
    post.comments.forEach((c) => {
      const li = document.createElement("li");
      li.className = "cm-item";
      if (c.state === "ok") {
        li.appendChild(commentLine(c));
        li.appendChild(commentTools(c, c, post, card));
      } else {
        const gone = document.createElement("p");
        gone.className = "cm-gone";
        gone.textContent = c.state === "deleted" ? "지운 댓글입니다." : "신고가 모여 숨겨진 댓글입니다.";
        li.appendChild(gone);
      }

      if (c.replies.length) {
        const ul = document.createElement("ul");
        ul.className = "cm-replies";
        c.replies.forEach((r) => {
          const rli = document.createElement("li");
          rli.className = "cm-item cm-reply";
          rli.appendChild(commentLine(r));
          rli.appendChild(commentTools(r, c, post, card));
          ul.appendChild(rli);
        });
        li.appendChild(ul);
      }

      if (activeReply && activeReply.postId === post.id && activeReply.rootId === c.id) {
        li.appendChild(buildReplyForm(post, card));
      }
      listEl.appendChild(li);
    });
  }

  // 글·댓글 안의 http(s) 주소를 새 탭으로 여는 링크로 바꾼다. innerHTML 없이 글자 노드와 <a>를 이어 붙인다
  const URL_IN_TEXT = /https?:\/\/[^\s<>"']+/g;
  function appendLinked(el, text) {
    let last = 0;
    text.replace(URL_IN_TEXT, (m, at) => {
      const url = m.replace(/[.,)\]!?]+$/, "");   // 문장 끝 문장부호는 주소에서 뺀다
      if (at > last) el.appendChild(document.createTextNode(text.slice(last, at)));
      const a = document.createElement("a");
      a.href = url; a.textContent = url; a.target = "_blank"; a.rel = "noopener noreferrer";
      el.appendChild(a);
      last = at + url.length;
      return m;
    });
    if (last < text.length) el.appendChild(document.createTextNode(text.slice(last)));
  }

  function commentLine(c) {
    const p = document.createElement("p");
    p.className = "cm-line";
    const nameEl = document.createElement("span");
    nameEl.className = "cm-nick";
    nameEl.textContent = c.author_name;
    p.appendChild(nameEl);
    appendLinked(p, c.content);
    return p;
  }

  function smallButton(text, extraClass) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "cm-act" + (extraClass ? " " + extraClass : "");
    b.textContent = text;
    return b;
  }

  // 댓글·답글 아래 버튼 줄: 답글 / 지우기(내 것) 또는 신고(다른 사람 것)
  // root 는 답글 입력칸을 붙일 원래 댓글이다. 답글에 답글을 달면 앞에 @이름을 넣는다.
  function commentTools(c, root, post, card) {
    const isReply = c.id !== root.id;
    const tools = document.createElement("div");
    tools.className = "cm-tools";

    const replyBtn = smallButton("답글");
    replyBtn.addEventListener("click", () => {
      activeReply = {
        postId: post.id, rootId: root.id, targetId: c.id,
        name: getSavedName(), content: isReply ? "@" + c.author_name + " " : "",
      };
      openComments.add(post.id);
      renderGallery();
      const input = gridEl.querySelector(`.card[data-post-id="${post.id}"] .reply-form .cm-content`);
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    });
    tools.appendChild(replyBtn);

    const hasReplies = !isReply && root.replies.length > 0;
    const act = smallButton(c.mine ? "지우기" : (c.reported ? "신고함" : "신고"), "danger");
    act.disabled = !c.mine && !!c.reported;
    act.addEventListener("click", async () => {
      const what = isReply ? "답글" : "댓글";
      let question;
      if (!c.mine) question = `이 ${what}을 신고합니다. 신고가 3건 모이면 숨겨지고 진행자가 확인합니다.`;
      else if (hasReplies) question = "이 댓글을 지웁니다. 달린 답글은 남고, 댓글 자리에는 '지운 댓글입니다'가 표시됩니다.";
      else question = `이 ${what}을 지웁니다. 되돌릴 수 없습니다.`;
      if (!confirm(question)) return;

      act.disabled = true;
      const cmMsg = $(".cm-msg", card);
      try {
        if (c.mine) {
          await api.deleteComment(c.id);
          if (activeReply && activeReply.targetId === c.id) activeReply = null;
          await reload();
        } else {
          const res = await api.report({ commentId: c.id });
          c.reported = true;
          act.textContent = "신고함";
          showMsg(cmMsg, res && res.hidden ? `신고가 3건 모여 이 ${what}을 숨겼습니다.` : "신고했습니다. 진행자가 확인합니다.", "ok");
          if (res && res.hidden) setTimeout(reload, 1500);
        }
      } catch (e) {
        console.error(e);
        act.disabled = false;
        showMsg(cmMsg, errorText(e), "error");
      }
    });
    tools.appendChild(act);
    return tools;
  }

  function buildReplyForm(post, card) {
    const form = document.createElement("form");
    form.className = "cm-form reply-form";

    const content = document.createElement("input");
    content.type = "text";
    content.className = "cm-content";
    content.maxLength = LIMIT.comment;
    content.placeholder = "답글 내용";
    content.setAttribute("aria-label", "답글 내용");
    content.autocomplete = "off";
    content.value = activeReply.content;

    const name = document.createElement("input");
    name.type = "text";
    name.className = "cm-name";
    name.maxLength = LIMIT.author;
    name.placeholder = "표시 이름";
    name.setAttribute("aria-label", "표시 이름");
    name.autocomplete = "off";
    name.value = activeReply.name;

    const cancel = smallButton("취소");
    const submit = document.createElement("button");
    submit.type = "submit";
    submit.className = "btn-small";
    submit.textContent = "답글 남기기";

    const msg = document.createElement("p");
    msg.className = "reply-msg";
    msg.hidden = true;

    form.append(content, name, cancel, submit, msg);

    // 적는 내용을 상태에 담아 두어 자동 새로고침으로 다시 그려도 남게 한다
    content.addEventListener("input", () => { activeReply.content = content.value; });
    name.addEventListener("input", () => { activeReply.name = name.value; });
    cancel.addEventListener("click", () => { activeReply = null; renderGallery(); });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const n = name.value.trim();
      const t = content.value.trim();
      hideMsg(msg);
      if (!n || !t) return showMsg(msg, "표시 이름과 답글 내용을 모두 적어야 남길 수 있습니다.", "error");
      if (findBannedWord(n, t)) return showMsg(msg, "부적절한 표현이 있어 남길 수 없습니다.", "error");

      submit.disabled = true;
      try {
        await api.addComment(post.id, n, t, activeReply.targetId);
        saveName(n);
        activeReply = null;
        openComments.add(post.id);
        await reload();
        const fresh = gridEl.querySelector(`.card[data-post-id="${post.id}"] .cm-msg`);
        if (fresh) showMsg(fresh, "답글을 남겼습니다.", "ok");
      } catch (err) {
        console.error(err);
        submit.disabled = false;
        showMsg(msg, errorText(err), "error");
      }
    });
    return form;
  }

  // ---------------------------------------------------------
  // 10. 탭 & 필터
  // ---------------------------------------------------------
  function showView(view) {
    activeView = view;
    $all(".tab").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
    $all(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + view));
  }

  function initTabs() {
    $all(".tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        showView(btn.dataset.view);
        if (btn.dataset.view === "gallery") reload();
      });
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest("[data-go-submit]")) return;
      showView("submit");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    // 슬라이드 QR 등에서 .../gallery/#submit 으로 들어오면 올리기 화면부터 연다
    const openFromHash = () => { if (location.hash === "#submit") showView("submit"); };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
  }

  function initFilters() {
    $all("#kindFilter .chip-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        $all("#kindFilter .chip-btn").forEach((b) => b.classList.toggle("active", b === btn));
        filterKind = btn.dataset.kind;
        renderGallery();
      });
    });
    $all("#sortBy .chip-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        $all("#sortBy .chip-btn").forEach((b) => b.classList.toggle("active", b === btn));
        sortBy = btn.dataset.sort;
        renderGallery();
      });
    });
  }

  // ---------------------------------------------------------
  // 11. 올리기 / 고치기 폼
  // ---------------------------------------------------------
  const form = $("#submitForm");
  const formMsg = $("#formMsg");
  const submitBtn = $("#submitBtn");
  const cancelBtn = $("#cancelEditBtn");
  const problemInput = $("#f-problem");
  const problemCount = $("#f-problem-count");

  const FORM_TEXT = {
    app: {
      title: "앱 이름 *", titlePh: "예: 수행평가 제출 확인판",
      problem: "이 앱으로 해결하려던 문제 *", problemPh: "누가, 어떤 장면에서, 무엇이 불편했는지 적습니다.",
    },
    // 2일차 워크숍(2026-10-30): 제목은 HMW 질문, 본문은 가설 문장으로 받는다
    problem: {
      title: "문제 제목 (HMW 질문) *", titlePh: "예: 어떻게 하면 상담 주간 예약을 쉽게 맞출 수 있을까?",
      problem: "풀고 싶은 문제 (가설 문장) *", problemPh: "누가, 어떤 상황에서, 무엇 때문에 어떤 어려움을 겪고 있을지 적습니다. 영상 링크는 나중에 고치기로 더합니다.",
    },
  };

  // '풀고 싶은 문제'를 고르면 빈 설명 칸에 넣어 주는 양식(1단계 가설 문장 틀의 네 칸 + 영상 링크)
  const PROBLEM_TEMPLATE = "누가: \n상황: \n원인: \n어려움: \n가설 문장: \n영상 링크: ";
  const isBareTemplate = (v) => v.replace(/\s+/g, "") === PROBLEM_TEMPLATE.replace(/\s+/g, "");

  const currentKind = () => ($("input[name=kind]:checked", form) || {}).value || "app";

  function applyKind() {
    const kind = currentKind();
    const t = FORM_TEXT[kind];
    $("#f-title-label").textContent = t.title;
    $("#f-title").placeholder = t.titlePh;
    $("#f-problem-label").textContent = t.problem;
    problemInput.placeholder = t.problemPh;
    $all(".app-only", form).forEach((el) => { el.hidden = kind !== "app"; });
    if (kind === "problem" && !problemInput.value.trim()) problemInput.value = PROBLEM_TEMPLATE;
    if (kind === "app" && isBareTemplate(problemInput.value)) problemInput.value = "";
    updateCounter();
  }

  function updateCounter() {
    problemCount.textContent = `${problemInput.value.length} / ${LIMIT.problem}`;
  }

  function setFormMode(editing) {
    $("#submitEyebrow").textContent = editing ? "EDIT" : "SUBMIT";
    $("#submitTitle").innerHTML = editing
      ? '내 글 <span class="a">고치기</span>'
      : '웹앱이나 <span class="a">풀고 싶은 문제 올리기</span>';
    submitBtn.textContent = editing ? "고친 내용 저장" : "갤러리에 올리기";
    cancelBtn.hidden = !editing;
  }

  function resetForm() {
    editingId = null;
    form.reset();
    $("#f-author").value = getSavedName();
    applyKind();
    updateCounter();
    setFormMode(false);
  }

  function startEdit(post) {
    editingId = post.id;
    $all("input[name=kind]", form).forEach((r) => { r.checked = r.value === post.kind; });
    $("#f-author").value = post.author_name;
    $("#f-title").value = post.title;
    $("#f-app-url").value = post.app_url || "";
    $("#f-repo-url").value = post.repo_url || "";
    problemInput.value = post.problem;
    applyKind();
    updateCounter();
    setFormMode(true);
    hideMsg(formMsg);
    showView("submit");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function flashCard(postId, text) {
    let card = postId && gridEl.querySelector(`.card[data-post-id="${postId}"]`);
    if (!card && postId) {
      // 필터 때문에 안 보이면 '전체'로 돌려서 찾는다
      $("#kindFilter .chip-btn[data-kind=all]").click();
      card = gridEl.querySelector(`.card[data-post-id="${postId}"]`);
    }
    if (!card) { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    card.classList.add("flash");
    showMsg($(".card-msg", card), text, "ok");
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => card.classList.remove("flash"), 2500);
  }

  function readForm() {
    return {
      kind: currentKind(),
      author_name: $("#f-author").value.trim(),
      title: $("#f-title").value.trim(),
      problem: problemInput.value.trim(),
      app_url: $("#f-app-url").value.trim(),
      repo_url: $("#f-repo-url").value.trim(),
    };
  }

  function initSubmitForm() {
    $all("input[name=kind]", form).forEach((r) => r.addEventListener("change", applyKind));
    problemInput.addEventListener("input", updateCounter);
    cancelBtn.addEventListener("click", () => {
      resetForm();
      hideMsg(formMsg);
      showView("gallery");
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideMsg(formMsg);
      const f = readForm();
      const problem = validatePost(f);
      if (problem) return showMsg(formMsg, problem, "error");

      submitBtn.disabled = true;
      const wasEditing = !!editingId;
      try {
        let postId = editingId;
        if (wasEditing) await api.editPost(editingId, f);
        else postId = await api.addPost(f);
        saveName(f.author_name);
        resetForm();
        // 갤러리로 돌아가 방금 올리거나 고친 카드를 잠시 강조한다
        showView("gallery");
        await reload();
        flashCard(postId, wasEditing ? "고친 내용을 저장했습니다." : "갤러리에 올렸습니다.");
      } catch (err) {
        console.error(err);
        showMsg(formMsg, errorText(err), "error");
      } finally {
        submitBtn.disabled = false;
      }
    });

    resetForm();
  }

  // 입력이 최대 길이에 닿으면 조용히 잘리지 않게 안내 (vibe1 갤러리와 같음)
  document.addEventListener("input", (e) => {
    const el = e.target;
    if (!/^(INPUT|TEXTAREA)$/.test(el.tagName) || !el.maxLength || el.maxLength < 0) return;
    const holder = el.parentElement;
    let hint = holder.querySelector(".len-hint");
    if (el.value.length >= el.maxLength) {
      if (!hint) {
        hint = document.createElement("span");
        hint.className = "len-hint";
        holder.appendChild(hint);
      }
      hint.textContent = `최대 ${el.maxLength}자까지 적을 수 있습니다.`;
    } else if (hint) {
      hint.remove();
    }
  });

  // ---------------------------------------------------------
  // 12. 자동 새로고침
  //     5초마다 변경 번호(aileader_rev, 숫자 하나)만 묻고, 바뀌었을 때만 목록을 받는다.
  //     입력 중이거나 다른 탭을 보고 있으면 건너뛴다.
  // ---------------------------------------------------------
  const REFRESH_MS = 5000;

  function busyNow() {
    if (document.visibilityState !== "visible") return true;
    if (activeView !== "gallery") return true;
    const el = document.activeElement;
    if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return true;
    return false;
  }

  function startAutoRefresh() {
    if (!useSupabase) return; // 체험 모드는 받아올 곳이 없다
    setInterval(async () => {
      if (busyNow()) return;
      try {
        const rev = await api.rev();
        if (!loadFailed && rev === currentRev) return;
      } catch (e) {
        if (!loadFailed) { loadFailed = true; renderGallery(); }
        return;
      }
      await reload();
    }, REFRESH_MS);
  }

  async function init() {
    initTabs();
    initFilters();
    initSubmitForm();
    await reload();
    startAutoRefresh();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
