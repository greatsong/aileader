// ============================================================
// 웹앱 갤러리 설정 파일
// ------------------------------------------------------------
// SUPABASE_URL / SUPABASE_KEY 가 채워져 있으면 실제 Supabase와 연동됩니다.
// 두 값을 비우거나 주소 끝에 ?demo 를 붙이면 체험 모드(브라우저 메모리 안
// 샘플 글)로 동작합니다. 체험 모드에서 올린 글은 저장되지 않습니다.
//
// DB_PREFIX 는 이 연수 전용 테이블·함수 이름 앞부분입니다. 같은 Supabase
// 프로젝트의 apps / vibe1_ / vibe1gg_ 갤러리와 데이터가 섞이지 않습니다.
// schema.sql 참고.
//
// publishable(공개용 anon) 키만 넣습니다. secret(service_role) 키는 넣지 않습니다.
// ============================================================
window.APP_CONFIG = {
  SUPABASE_URL: "https://ipcherzsnaevkkjrclvn.supabase.co",
  SUPABASE_KEY: "sb_publishable_AuRR576neh5CoGt1dZM4_g_vov4KtVm",

  DB_PREFIX: "aileader_"
};
