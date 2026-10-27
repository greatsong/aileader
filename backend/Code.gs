/************ 선도교사 연수 '우리 학교를 지도에' 백엔드 (Google Apps Script) ************
 * 2026 고등학교 AI 디지털 선도교사 연수(2026-10-29~30) 전용.
 * 2026-vibe1의 Code.gs(시트 라우팅판)를 그대로 가져오고, 시트 이름만 연수용으로 바꿨다.
 * 참가자 노트북(map/index.html)이 보낸 학교·과목·교육경력·궁금한 것(POST)을 시트에 쌓고,
 * 앞 화면 지도(map/board.html)가 물어보면(GET) 학교 목록과 집계를 돌려준다.
 *
 *  - 연수 본 데이터: sheet='aileader' (지정이 없거나 모르는 이름도 여기로)
 *  - 리허설용: sheet='test' → board.html?sheet=test 로 미리 확인. 연수 데이터와 섞이지 않는다
 *
 * 준비(처음 한 번): 편집기에서 setup 을 실행하고 권한을 승인한다. 'aileader' 탭이 만들어진다.
 * 코드를 고친 뒤: clasp push → clasp redeploy <배포 ID> (URL 유지)
 ***************************************************************************/

const DEFAULT_SHEET = 'aileader';
const ALLOWED_SHEETS = ['aileader', 'test'];

function getSheet_(name) {
  const sheetName = ALLOWED_SHEETS.indexOf(name) >= 0 ? name : DEFAULT_SHEET;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(sheetName);
  if (!sh) {
    sh = ss.insertSheet(sheetName);
    sh.appendRow(['시각', '학교', '지역', '위도', '경도', '바이브경험', '교육경력', '자신분야', '비자신분야', '전문성점수', '과목', '궁금한것']);
    sh.setFrozenRows(1);
  }
  return sh;
}

// 처음 한 번 편집기에서 실행: 권한 승인과 연수용 탭 만들기
function setup() {
  const sh = getSheet_(DEFAULT_SHEET);
  Logger.log('준비 완료: ' + sh.getName() + ' 탭, ' + (sh.getLastRow() - 1) + '건');
}

// 한 건 저장 (폰이 POST) — payload의 sheet 값으로 시트 선택
// 과목·궁금한것은 경기판(vibe1) 열 뒤에 붙인다. 열 순서는 vibe1과 같다.
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const d = JSON.parse(e.postData.contents);
    getSheet_(d.sheet).appendRow([new Date(), d.school || '', d.region || '', d.lat, d.lon, d.vibe || '', d.career || '', d.confident || '', d.unconfident || '', d.skills || '', d.subject || '', d.question || '']);
    return out_({ ok: true });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// 접속한 학교 목록 반환 (보드가 GET, ?sheet=test 식으로 시트 선택)
// 같은 학교는 1번만, 대신 인원수(count)를 함께 준다.
// tally는 사람 수 기준 집계 — 강사가 청중 분포를 읽는 계기판.
function doGet(e) {
  const sh = getSheet_(e && e.parameter ? e.parameter.sheet : '');
  const schools = [];
  const index = {};
  const tally = { vibe: {}, career: {}, confident: {}, unconfident: {}, subject: {} };
  const questions = [];   // 궁금한 것 — 최신 순으로 보드에 보여 준다
  const scores = {};   // 분야별 [합계, 인원]
  const dist = {};     // 분야별 점수 분포 {1:n, 2:n, ...}
  if (sh.getLastRow() > 1) {
    const rows = sh.getRange(2, 1, sh.getLastRow() - 1, 12).getValues();
    rows.forEach(function (r) {
      const name = String(r[1]);
      if (!name) return;
      const vibe = String(r[5]), career = String(r[6]), subject = String(r[10] || '').trim(), question = String(r[11] || '').trim();
      if (vibe) tally.vibe[vibe] = (tally.vibe[vibe] || 0) + 1;
      if (career) tally.career[career] = (tally.career[career] || 0) + 1;
      if (subject) tally.subject[subject] = (tally.subject[subject] || 0) + 1;
      if (question) questions.push({ school: name, subject: subject, q: question });
      addSplit_(tally.confident, r[7]);
      addSplit_(tally.unconfident, r[8]);
      addScores_(scores, r[9]);
      addDist_(dist, r[9]);
      const key = name + '@' + String(r[2]);   // 이름이 같은 다른 지역 학교(예: 상도중 서울·부천)와 섞이지 않게
      if (key in index) { schools[index[key]].count++; return; }
      index[key] = schools.length;
      schools.push({ school: name, region: String(r[2]), lat: r[3], lon: r[4], vibe: vibe, career: career, count: 1 });
    });
  }
  // 분야별 평균 자신감(1~5, 소수 둘째 자리)과 점수 분포({1:n,...,5:n})
  tally.skillAvg = {};
  Object.keys(scores).forEach(function (k) {
    tally.skillAvg[k] = Math.round(scores[k][0] / scores[k][1] * 100) / 100;
  });
  tally.skillDist = dist;
  questions.reverse();   // 최신이 먼저
  return out_({ ok: true, schools: schools, tally: tally, questions: questions });
}

// '분야=점수, 분야=점수' 형태 문자열을 분야별 [합계, 인원]으로 누적
function addScores_(map, v) {
  String(v || '').split(',').forEach(function (s) {
    const parts = s.split('=');
    if (parts.length !== 2) return;
    const k = parts[0].trim(), n = Number(parts[1]);
    if (!k || !(n >= 1 && n <= 5)) return;
    if (!map[k]) map[k] = [0, 0];
    map[k][0] += n; map[k][1] += 1;
  });
}

// '분야=점수' 문자열을 분야별 점수 분포로 누적
function addDist_(map, v) {
  String(v || '').split(',').forEach(function (s) {
    const parts = s.split('=');
    if (parts.length !== 2) return;
    const k = parts[0].trim(), n = Number(parts[1]);
    if (!k || !(n >= 1 && n <= 5)) return;
    if (!map[k]) map[k] = {};
    map[k][n] = (map[k][n] || 0) + 1;
  });
}

// '분야1, 분야2' 형태 문자열을 분야별 인원수로 집계
function addSplit_(map, v) {
  String(v || '').split(',').forEach(function (s) {
    s = s.trim();
    if (s) map[s] = (map[s] || 0) + 1;
  });
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
