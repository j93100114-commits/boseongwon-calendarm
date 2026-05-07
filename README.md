[캘린더.html](https://github.com/user-attachments/files/27464700/default.html)
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>보성원 캘린더</title>
<script src="https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore-compat.js"></script>
<style>
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  /* ── 🎨 기본 테마 ── */
  :root {
    --bg: #f4f7f6;
    --surface: #ffffff;
    --border: #e9ecef;
    --accent: #e64980;
    --accent-dark: #c2255c;
    --text: #212529;
    --text-sub: #495057;
    --text-hint: #adb5bd;
    --titlebar-bg: #e9ecef;
    --input-bg: #f8f9fa;
    --input-border: #ced4da;
    --cal-hover: #f1f3f5;
    --om-text: #dee2e6;
  }

  [data-theme="dark"] {
    --bg: #1a1a2e; --surface: #16213e; --border: #0f3460;
    --accent: #e94560; --accent-dark: #c2274a;
    --text: #f0f0f0; --text-sub: #aaa; --text-hint: #555;
    --titlebar-bg: #0d1526; --input-bg: #0f1f3d;
    --input-border: #1a3a6e; --cal-hover: #0f3460; --om-text: #333;
  }

  [data-theme="warm"] {
    --bg: #fffdf0; --surface: #fff8e1; --border: #fce4b5;
    --accent: #f59f00; --accent-dark: #e67700;
    --text: #423826; --text-sub: #75664b; --text-hint: #a69886;
    --titlebar-bg: #fef0d2; --input-bg: #ffffff;
    --input-border: #fcd38d; --cal-hover: #fef3db; --om-text: #e0d4c1;
  }

  [data-theme="cool"] {
    --bg: #f0f4f8; --surface: #ffffff; --border: #d9e2ec;
    --accent: #338efa; --accent-dark: #2368cb;
    --text: #102a43; --text-sub: #334e68; --text-hint: #627d98;
    --titlebar-bg: #e1e8ef; --input-bg: #f0f4f8;
    --input-border: #bcccdc; --cal-hover: #f0f4f8; --om-text: #d9e2ec;
  }

  html, body {
    font-family: 'Pretendard', 'Malgun Gothic', sans-serif;
    background: var(--bg);
    width: 100%; height: 100%; height: 100dvh; 
    overflow: hidden; color: var(--text);
  }

  .app-container {
    background: var(--bg);
    width: 100%; height: 100%;
    display: flex; flex-direction: column; overflow: hidden;
  }

  /* ── 타이틀바 ── */
  .titlebar {
    background: var(--titlebar-bg); padding: 12px 16px;
    display: flex; justify-content: space-between; align-items: center;
    border-bottom: 1px solid var(--border); flex-shrink: 0;
  }
  .titlebar .app-title {
    font-size: 15px; font-weight: 800; color: var(--accent);
    display: flex; align-items: center; gap: 8px;
  }
  .theme-select {
    background: var(--surface); color: var(--text); border: 1px solid var(--border);
    border-radius: 8px; font-size: 13px; font-weight: 600; padding: 6px 8px; outline: none;
  }
  .sync-dot {
    width: 8px; height: 8px; border-radius: 50%; background: #1d9e75;
    animation: blink 2.5s infinite; flex-shrink: 0;
  }
  .sync-dot.error { background: var(--accent); animation: none; }
  @keyframes blink { 0%,100%{opacity:1;} 50%{opacity:0.25;} }

  /* ── 오늘 날짜 배너 ── */
  .today-banner {
    background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%);
    padding: 16px 20px 14px; display: flex; justify-content: space-between;
    align-items: flex-end; flex-shrink: 0; cursor: pointer;
  }
  .today-banner:active { opacity: 0.9; }
  .day-big { font-size: 38px; font-weight: 900; line-height: 1; color: #fff; }
  .today-right { text-align: right; }
  .today-ym  { font-size: 12px; color: rgba(255,255,255,0.9); font-weight: 600; margin-bottom: 2px; }
  .today-wd  { font-size: 16px; font-weight: 800; color: #fff; }
  .today-cnt {
    font-size: 11px; background: rgba(255,255,255,0.25); padding: 3px 8px;
    border-radius: 20px; color: #fff; margin-top: 6px; display: inline-block; font-weight: bold;
  }

  /* ── 팀 필터 ── */
  .filter-bar {
    display: flex; gap: 6px; padding: 10px 16px; background: var(--surface);
    border-bottom: 1px solid var(--border); flex-wrap: wrap; flex-shrink: 0;
  }
  .chip {
    font-size: 12px; font-weight: 700; padding: 6px 12px; border-radius: 20px;
    border: 1px solid transparent; cursor: pointer; opacity: 0.35; transition: all 0.2s;
  }
  .chip.on { opacity: 1; transform: translateY(-1px); }
  .c-식 { background: rgba(233,69,96,.15); color: #e94560; border-color: #e94560; }
  .c-행 { background: rgba(55,138,221,.15); color: #378add; border-color: #378add; }
  .c-재 { background: rgba(29,158,117,.15); color: #1d9e75; border-color: #1d9e75; }
  .c-의 { background: rgba(216,90,48,.15);  color: #d85a30; border-color: #d85a30; }

  /* ── 미니 캘린더 & 드래그 영역 ── */
  .mini-cal-wrapper {
    background: var(--surface); border-bottom: 1px solid var(--border);
    flex-shrink: 0; display: flex; flex-direction: column;
  }
  .mini-cal-header {
    padding: 10px 16px 0;
  }
  .cal-nav {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;
  }
  .cal-nav .lbl { font-size: 14px; font-weight: 800; color: var(--text); }
  .arrow-btn {
    background: none; border: none; color: var(--text-hint); cursor: pointer;
    font-size: 14px; padding: 4px 12px; border-radius: 6px;
  }
  .arrow-btn:active { background: var(--border); color: var(--text); }

  /* 드래그에 맞춰 높이가 조절될 래퍼 */
  .cal-grid-wrap {
    overflow: hidden;
    height: 240px; /* 초기 높이 */
    will-change: height;
  }
  .cal-grid {
    display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; padding: 0 16px;
  }
  .cal-grid .hd { text-align: center; font-size: 11px; font-weight: 800; color: var(--text-hint); padding: 2px 0 6px; }
  .cal-grid .dc {
    text-align: center; font-size: 13px; font-weight: 700; padding: 6px 1px;
    border-radius: 8px; cursor: pointer; color: var(--text-sub); position: relative; line-height: 1;
  }
  .cal-grid .dc:active:not(.om) { background: var(--cal-hover); }
  .cal-grid .dc.om { color: var(--om-text); cursor: default; font-weight: 500;}
  .cal-grid .dc.today { background: var(--accent); color: #fff; font-weight: 900; }
  .cal-grid .dc.sel:not(.today) { background: var(--cal-hover); color: var(--accent); }
  .cal-grid .dc.sun:not(.today) { color: #e24b4a; }
  .cal-grid .dc.sat:not(.today) { color: #4263eb; }
  .cal-grid .dc.has-ev::after {
    content: ''; display: block; width: 4px; height: 4px;
    background: var(--accent); border-radius: 50%; margin: 3px auto 0;
  }
  .cal-grid .dc.today.has-ev::after { background: rgba(255,255,255,.8); }

  /* 제스처 핸들바 (손잡이) */
  .cal-toggle-bar {
    width: 100%; padding: 12px 0; display: flex; justify-content: center; align-items: center;
    cursor: grab; background: var(--surface); touch-action: none;
  }
  .cal-toggle-bar:active { cursor: grabbing; background: var(--cal-hover); }
  .cal-toggle-bar::after {
    content: ''; display: block; width: 40px; height: 5px;
    background: var(--border); border-radius: 10px;
  }

  /* ── 이벤트 목록 ── */
  .ev-section {
    flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; 
    padding: 12px 16px; min-height: 0;
  }
  .ev-section::-webkit-scrollbar { width: 4px; }
  .ev-section::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
  .ev-label {
    font-size: 12px; font-weight: 800; color: var(--text-hint);
    text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;
  }
  
  .ev-card {
    display: flex; gap: 8px; align-items: flex-start;
    padding: 12px; border-radius: 10px; margin-bottom: 8px; cursor: pointer;
    border-left: 3px solid transparent; background: var(--surface);
    border: 1px solid var(--border); box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  }
  .ev-card:active { opacity: 0.7; transform: translateY(1px); }
  .ev-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
  .ev-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
  
  /* 줄바꿈을 위한 개별 텍스트 요소들 */
  .ev-txt { font-size: 14px; font-weight: 700; line-height: 1.4; color: var(--text); white-space: pre-wrap; word-break: break-all; }
  .ev-time { font-size: 12px; font-weight: 700; color: var(--accent); display: flex; align-items: center; gap: 4px; }
  .ev-target { font-size: 12px; font-weight: 600; color: var(--text-sub); display: flex; align-items: center; gap: 4px; }
  
  .ev-badge {
    font-size: 10px; font-weight: 800; padding: 4px 6px;
    border-radius: 8px; flex-shrink: 0; white-space: nowrap;
  }
  .no-ev { text-align: center; color: var(--text-hint); font-size: 13px; font-weight: 600; padding: 20px 0; }

  .bg-식 { background: rgba(233,69,96,.05); border-left-color: #e94560; }
  .bg-행 { background: rgba(55,138,221,.05); border-left-color: #378add; }
  .bg-재 { background: rgba(29,158,117,.05); border-left-color: #1d9e75; }
  .bg-의 { background: rgba(216,90,48,.05);  border-left-color: #d85a30; }
  .dot-식 { background: #e94560; } .dot-행 { background: #378add; }
  .dot-재 { background: #1d9e75; } .dot-의 { background: #d85a30; }
  .bdg-식 { background: rgba(233,69,96,.15); color: #e94560; }
  .bdg-행 { background: rgba(55,138,221,.15); color: #378add; }
  .bdg-재 { background: rgba(29,158,117,.15); color: #1d9e75; }
  .bdg-의 { background: rgba(216,90,48,.15);  color: #d85a30; }

  /* ── 빠른 등록 ── */
  .quick-section {
    background: var(--surface); border-top: 1px solid var(--border);
    padding: 12px 16px; flex-shrink: 0;
  }
  .quick-header { display: flex; justify-content: space-between; align-items: center; }
  .quick-lbl { font-size: 12px; font-weight: 800; color: var(--text-hint); letter-spacing: .4px; }
  .add-btn {
    background: var(--accent); border: none; color: #fff; font-size: 20px;
    width: 28px; height: 28px; border-radius: 6px; cursor: pointer; display: flex;
    align-items: center; justify-content: center; font-weight: 900; line-height: 1;
  }
  
  .qform { margin-top: 10px; display: none; }
  .qform.open { display: block; }
  .fr { display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
  .qform input, .qform select, .qform textarea {
    background: var(--input-bg); border: 1px solid var(--input-border);
    border-radius: 8px; color: var(--text); font-family: inherit; font-size: 16px;
    padding: 10px; outline: none; flex: 1; min-width: 0; font-weight: 600;
  }
  .qform textarea { resize: none; height: 60px; line-height: 1.5; }
  .btn-ok { flex: 2; background: var(--accent); border: none; border-radius: 8px; color: #fff; font-size: 14px; font-weight: 800; padding: 10px; }
  .btn-no { flex: 1; background: var(--border); border: none; border-radius: 8px; color: var(--text-sub); font-size: 14px; font-weight: 700; padding: 10px; }

  /* ── 수정 모달 ── */
  .overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 999;
    display: none; align-items: center; justify-content: center; padding: 20px;
  }
  .overlay.open { display: flex; }
  .mbox {
    background: var(--surface); border-radius: 16px; padding: 20px;
    width: 100%; max-width: 400px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  }
  .m-ttl { font-size: 16px; font-weight: 800; color: var(--accent); margin-bottom: 12px; border-bottom: 2px dashed var(--border); padding-bottom: 10px; }
  .mbox input, .mbox select, .mbox textarea {
    width: 100%; background: var(--input-bg); border: 1px solid var(--input-border);
    border-radius: 8px; font-size: 16px; font-family: inherit; font-weight: 600;
    padding: 10px; margin-bottom: 8px; outline: none;
  }
  .mbox textarea { resize: none; height: 70px; line-height: 1.5; }
  .mbtns { display: flex; gap: 8px; margin-top: 8px; }
  .mb-save { flex: 2; background: var(--accent); border: none; border-radius: 8px; color: #fff; font-size: 14px; font-weight: 800; padding: 12px; }
  .mb-del { flex: 1; background: #fff0f3; border: 1px solid #ffc9c9; border-radius: 8px; color: #e03131; font-size: 14px; font-weight: 800; padding: 12px; }
  .mb-cancel { flex: 1; background: var(--border); border: none; border-radius: 8px; color: var(--text-sub); font-size: 14px; font-weight: 700; padding: 12px; }
</style>
</head>
<body>
<div class="app-container">

  <div class="titlebar">
    <span class="app-title">
      <div class="sync-dot" id="syncDot"></div>
      보성원 캘린더
    </span>
    <select class="theme-select" id="themeSelect" onchange="changeTheme(this.value)">
      <option value="light">☀️ 라이트</option>
      <option value="dark">🌙 다크</option>
      <option value="warm">🌼 옐로우</option>
      <option value="cool">❄️ 블루</option>
    </select>
  </div>

  <div class="today-banner" onclick="goToday()">
    <div class="day-big" id="tDay">--</div>
    <div class="today-right">
      <div class="today-ym" id="tYM">---- 년 -- 월</div>
      <div class="today-wd" id="tWD">---요일</div>
      <span class="today-cnt" id="tCnt">오늘 일정 0건</span>
    </div>
  </div>

  <div class="filter-bar">
    <span class="chip c-식 on" data-code="식" data-team="영양급식팀" onclick="toggleFilter(this)">🍽 영양급식</span>
    <span class="chip c-행 on" data-code="행" data-team="기획행정팀" onclick="toggleFilter(this)">🏢 기획행정</span>
    <span class="chip c-재 on" data-code="재" data-team="생활재활팀" onclick="toggleFilter(this)">🏡 생활재활</span>
    <span class="chip c-의 on" data-code="의" data-team="의료재활팀" onclick="toggleFilter(this)">⚕ 의료재활</span>
  </div>

  <div class="mini-cal-wrapper">
    <div class="mini-cal-header">
      <div class="cal-nav">
        <button class="arrow-btn" onclick="moveMonth(-1)">◀</button>
        <span class="lbl" id="calLbl">2026. 01</span>
        <button class="arrow-btn" onclick="moveMonth(1)">▶</button>
      </div>
    </div>
    <!-- 높이가 유동적으로 변하는 래퍼 -->
    <div class="cal-grid-wrap" id="calWrap">
      <div class="cal-grid" id="calGrid">
        <div class="hd">일</div><div class="hd">월</div><div class="hd">화</div>
        <div class="hd">수</div><div class="hd">목</div><div class="hd">금</div><div class="hd">토</div>
      </div>
    </div>
    <!-- 터치 드래그 핸들 -->
    <div class="cal-toggle-bar" id="dragHandle"></div>
  </div>

  <div class="ev-section">
    <div class="ev-label" id="evLbl">오늘 일정</div>
    <div id="evList"><div class="no-ev">일정 불러오는 중...</div></div>
  </div>

  <div class="quick-section">
    <div class="quick-header">
      <span class="quick-lbl">일정 등록</span>
      <button class="add-btn" id="addBtn" onclick="toggleForm()">+</button>
    </div>
    <div class="qform" id="qform">
      <div class="fr">
        <input type="date" id="qDate">
        <input type="text" id="qTime" placeholder="시간 (예: 14:00~)">
      </div>
      <div class="fr">
        <select id="qTeam">
          <option value="생활재활팀">🏡 생활재활팀</option>
          <option value="영양급식팀">🍽 영양급식팀</option>
          <option value="기획행정팀">🏢 기획행정팀</option>
          <option value="의료재활팀">⚕ 의료재활팀</option>
        </select>
        <input type="text" id="qTarget" placeholder="대상자">
      </div>
      <div class="fr"><textarea id="qText" placeholder="일정 내용을 입력하세요..."></textarea></div>
      <div class="fr">
        <input type="text" id="qAuthor" placeholder="기록자 성함">
        <input type="password" id="qPw" placeholder="비밀번호">
      </div>
      <div class="fr">
        <button class="btn-no" onclick="toggleForm()">취소</button>
        <button class="btn-ok" onclick="quickSave()">✓ 등록하기</button>
      </div>
    </div>
  </div>

</div>

<div class="overlay" id="modal">
  <div class="mbox">
    <div class="m-ttl">📝 일정 수정 / 삭제</div>
    <input type="hidden" id="eid">
    <input type="date" id="mDate">
    <input type="text" id="mTime" placeholder="시간">
    <select id="mTeam">
      <option value="생활재활팀">🏡 생활재활팀</option>
      <option value="영양급식팀">🍽 영양급식팀</option>
      <option value="기획행정팀">🏢 기획행정팀</option>
      <option value="의료재활팀">⚕ 의료재활팀</option>
    </select>
    <input type="text" id="mTarget" placeholder="대상자">
    <textarea id="mText" placeholder="일정 내용"></textarea>
    <input type="text" id="mAuthor" placeholder="기록자">
    <input type="password" id="mPw" placeholder="수정/삭제 비밀번호">
    <div class="mbtns">
      <button class="mb-cancel" onclick="closeModal()">닫기</button>
      <button class="mb-del" onclick="delEvent()">삭제</button>
      <button class="mb-save" onclick="saveEdit()">저장</button>
    </div>
  </div>
</div>

<script>
  /* ── 테마 설정 ── */
  function changeTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('widget_theme', theme);
  }
  const savedTheme = localStorage.getItem('widget_theme') || 'light';
  document.getElementById('themeSelect').value = savedTheme;
  changeTheme(savedTheme);

  /* ── Firebase 초기화 및 완벽한 iOS 폴백 설정 ── */
  firebase.initializeApp({
    apiKey: "AIzaSyDL3rxK3prYGyxGhR8zb4Xh81T42A8nsLM",
    authDomain: "inbody-c3a41.firebaseapp.com",
    projectId: "inbody-c3a41",
    storageBucket: "inbody-c3a41.firebasestorage.app",
    messagingSenderId: "818964779271",
    appId: "1:818964779271:web:776b80e01e418ded56f5a2"
  });
  
  const db = firebase.firestore();
  
  // iOS 사파리 강력 통신 우회 설정
  db.settings({ 
    experimentalForceLongPolling: true,
    useFetchStreams: false
  });

  const col = db.collection('boseongwon_v2_calendar');
  const MASTER = "asdf123";

  /* 상태 */
  const today = new Date();
  let cur = new Date(today);
  let selDate = fmt(today);
  let events = [];
  let filters = new Set(['영양급식팀','기획행정팀','생활재활팀','의료재활팀']);
  let formOpen = false;

  /* 유틸 */
  function fmt(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  const WD = ['일','월','화','수','목','금','토'];
  const CODE = { '영양급식팀':'식','기획행정팀':'행','생활재활팀':'재','의료재활팀':'의' };

  /* Firebase 실시간 동기화 ( + 실패 시 1회성 로드 Fallback 기능 추가 ) */
  col.onSnapshot(snap => {
    events = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    document.getElementById('syncDot').className = 'sync-dot';
    render();
  }, (err) => {
    // 실시간 연결이 막혔을 경우 (빨간불 점등 후 1회성 데이터 호출 시도)
    document.getElementById('syncDot').className = 'sync-dot error';
    
    col.get().then(snap => {
      events = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      render();
    }).catch(e => {
      document.getElementById('evList').innerHTML = '<div class="no-ev">아이폰 보안으로 차단되었습니다.<br>사파리 외부 브라우저로 열어주세요.</div>';
    });
  });

  /* 렌더링 로직 */
  function render() { renderBanner(); renderCal(); renderEvents(); }

  function renderBanner() {
    document.getElementById('tDay').textContent = today.getDate();
    document.getElementById('tYM').textContent = `${today.getFullYear()}년 ${today.getMonth()+1}월`;
    document.getElementById('tWD').textContent = WD[today.getDay()] + '요일';
    const cnt = events.filter(e => e.date === fmt(today) && filters.has(e.team)).length;
    document.getElementById('tCnt').textContent = `오늘 일정 ${cnt}건`;
  }

  function renderCal() {
    const y = cur.getFullYear(), m = cur.getMonth();
    document.getElementById('calLbl').textContent = `${y}. ${String(m+1).padStart(2,'0')}`;
    const grid = document.getElementById('calGrid');
    
    while(grid.children.length > 7) grid.removeChild(grid.lastChild);
    
    const first = new Date(y, m, 1).getDay();
    const days  = new Date(y, m+1, 0).getDate();
    const todayStr = fmt(today);
    const evDates = new Set(events.filter(e => filters.has(e.team)).map(e => e.date));
    
    for(let i=0; i<first; i++) {
      const c = document.createElement('div'); c.className = 'dc om'; grid.appendChild(c);
    }
    for(let d=1; d<=days; d++) {
      const ds = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const c = document.createElement('div');
      const dow = new Date(y, m, d).getDay();
      let cls = 'dc';
      if(dow===0) cls += ' sun'; if(dow===6) cls += ' sat';
      if(ds===todayStr) cls += ' today';
      if(ds===selDate && ds!==todayStr) cls += ' sel';
      if(evDates.has(ds)) cls += ' has-ev';
      c.className = cls; c.textContent = d;
      c.onclick = () => pickDate(ds);
      grid.appendChild(c);
    }
    
    const calWrap = document.getElementById('calWrap');
    if (calWrap.style.height === '' || parseInt(calWrap.style.height) > 0) {
      calWrap.style.height = '240px';
    }
  }

  function renderEvents() {
    const list = document.getElementById('evList');
    const label = document.getElementById('evLbl');
    const [y,m,d] = selDate.split('-');
    const isToday = selDate === fmt(today);
    label.textContent = isToday ? '오늘 일정' : `${parseInt(m)}월 ${parseInt(d)}일 (${WD[new Date(y,m-1,d).getDay()]}) 일정`;
    
    const filt = events.filter(e => e.date === selDate && filters.has(e.team || '생활재활팀'));
    if(!filt.length) { list.innerHTML = '<div class="no-ev">등록된 일정이 없습니다</div>'; return; }
    
    // 줄바꿈 구조 적용 (내용 -> 시간 -> 대상자)
    list.innerHTML = filt.map(ev => {
      const c = CODE[ev.team] || '재';
      
      const timeHtml = ev.time ? `<div class="ev-time">🕒 ${ev.time}</div>` : '';
      const targetHtml = ev.target ? `<div class="ev-target">👤 ${ev.target}</div>` : '';
      
      return `
      <div class="ev-card bg-${c}" onclick="openEdit('${ev.id}')">
        <div class="ev-dot dot-${c}"></div>
        <div class="ev-body">
          <div class="ev-txt">${ev.text}</div>
          ${timeHtml}
          ${targetHtml}
        </div>
        <span class="ev-badge bdg-${c}">${ev.team?.replace('팀','')}</span>
      </div>`;
    }).join('');
  }

  /* ── 정밀한 드래그 크기 조절 (BottomSheet UI) ── */
  const dragHandle = document.getElementById('dragHandle');
  const calWrap = document.getElementById('calWrap');
  let startY = 0;
  let startHeight = 0;

  dragHandle.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
    startHeight = calWrap.getBoundingClientRect().height;
    calWrap.style.transition = 'none'; 
  });

  dragHandle.addEventListener('touchmove', (e) => {
    e.preventDefault(); 
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY; 
    let newHeight = startHeight + diff;
    
    if (newHeight < 0) newHeight = 0;
    if (newHeight > 260) newHeight = 260;
    
    calWrap.style.height = `${newHeight}px`;
  }, { passive: false }); 

  dragHandle.addEventListener('touchend', () => {
    calWrap.style.transition = 'height 0.2s ease-out'; 
    const finalHeight = parseInt(calWrap.style.height);
    if (finalHeight < 40) calWrap.style.height = '0px';
  });

  /* 날짜 선택 */
  function pickDate(ds) {
    selDate = ds; renderCal(); renderEvents();
    document.getElementById('qDate').value = ds;
  }
  function goToday() { cur = new Date(today); pickDate(fmt(today)); }
  function moveMonth(v) { cur.setMonth(cur.getMonth()+v); renderCal(); }
  function toggleFilter(chip) {
    const team = chip.dataset.team;
    if(filters.has(team)) filters.delete(team); else filters.add(team);
    chip.classList.toggle('on');
    render();
  }

  /* 등록 폼 */
  function toggleForm() {
    formOpen = !formOpen;
    document.getElementById('qform').classList.toggle('open', formOpen);
    document.getElementById('addBtn').textContent = formOpen ? '×' : '+';
    if(formOpen && !document.getElementById('qDate').value)
      document.getElementById('qDate').value = selDate;
    
    if(formOpen) {
      setTimeout(() => {
        const container = document.querySelector('.app-container');
        container.scrollTop = container.scrollHeight;
      }, 100);
    }
  }
  function quickSave() {
    const text = document.getElementById('qText').value.trim();
    const pw   = document.getElementById('qPw').value;
    const auth = document.getElementById('qAuthor').value.trim();
    if(!text) return alert('내용을 입력해주세요.');
    if(!pw)   return alert('비밀번호를 입력해주세요.');
    if(!auth) return alert('기록자 성함을 입력해주세요.');
    col.add({
      date: document.getElementById('qDate').value || selDate,
      time: document.getElementById('qTime').value.trim(),
      team: document.getElementById('qTeam').value,
      target: document.getElementById('qTarget').value.trim(),
      text, author: auth, pw
    }).then(() => {
      ['qText','qTime','qTarget','qAuthor','qPw'].forEach(id => document.getElementById(id).value = '');
      toggleForm();
    });
  }

  /* 수정 모달 */
  function openEdit(id) {
    const ev = events.find(e => e.id === id);
    if(!ev) return;
    document.getElementById('eid').value = id;
    document.getElementById('mDate').value   = ev.date;
    document.getElementById('mTime').value   = ev.time || '';
    document.getElementById('mTeam').value   = ev.team || '생활재활팀';
    document.getElementById('mTarget').value = ev.target || '';
    document.getElementById('mText').value   = ev.text;
    document.getElementById('mAuthor').value = ev.author || '';
    document.getElementById('mPw').value     = '';
    document.getElementById('modal').classList.add('open');
  }
  function closeModal() { document.getElementById('modal').classList.remove('open'); }
  async function saveEdit() {
    const id = document.getElementById('eid').value;
    const pw = document.getElementById('mPw').value;
    if(!pw) return alert('비밀번호를 입력해주세요.');
    if(pw !== MASTER) {
      const doc = await col.doc(id).get();
      if(doc.data().pw !== pw) return alert('비밀번호가 맞지 않습니다.');
    }
    col.doc(id).update({
      date: document.getElementById('mDate').value,
      time: document.getElementById('mTime').value,
      team: document.getElementById('mTeam').value,
      target: document.getElementById('mTarget').value,
      text: document.getElementById('mText').value,
      author: document.getElementById('mAuthor').value, pw
    }).then(closeModal);
  }
  async function delEvent() {
    const id = document.getElementById('eid').value;
    const pw = document.getElementById('mPw').value;
    if(!pw) return alert('비밀번호를 입력해주세요.');
    if(pw !== MASTER) {
      const doc = await col.doc(id).get();
      if(doc.data().pw !== pw) return alert('비밀번호가 맞지 않습니다.');
    }
    if(confirm('삭제하시겠습니까?')) col.doc(id).delete().then(closeModal);
  }

  /* 초기화 */
  document.getElementById('qDate').value = fmt(today);
  selDate = fmt(today);
</script>
</body>
</html>
