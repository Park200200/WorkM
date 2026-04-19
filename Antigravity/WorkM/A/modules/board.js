/* ══════════════════════════════════════════════════════════════════
   📋 BOARD.JS  ─  종합 게시판 시스템
   WorkM | 카테고리별 자동 레이아웃 전환 게시판
══════════════════════════════════════════════════════════════════ */

/* ─────────────────── 초기 샘플 데이터 ─────────────────── */
const _BOARD_SAMPLE = [
  { id:1001, category:'notice', title:'[필독] 시스템 점검 안내 (4월 10일)', content:'4월 10일(목) 오전 2시~4시 정기 서버 점검이 진행됩니다.\n서비스 이용에 불편을 드려 죄송합니다.', author:'관리자', authorId:1, date:'2026.04.03', views:312, likes:8, isPinned:true, importance:'high', status:'open', faqCategory:'', thumbnail:'', tags:['시스템','점검'], attachments:[], answers:[], aiSummary:'4월 10일 새벽 서버 점검으로 인해 2시간 서비스 중단 예정' },
  { id:1002, category:'notice', title:'2026년 1분기 서비스 업데이트 안내', content:'1분기 주요 업데이트 내역을 안내드립니다.\n- 업무관리 기능 강화\n- 홈페이지 관리 모듈 추가\n- 성능 개선', author:'관리자', authorId:1, date:'2026.03.28', views:189, likes:14, isPinned:false, importance:'normal', status:'open', faqCategory:'', thumbnail:'', tags:['업데이트'], attachments:[], answers:[], aiSummary:'1분기 업무관리 강화, 홈페이지 모듈 추가 등 주요 업데이트' },
  { id:1003, category:'general', title:'팀 회의 결과 공유합니다', content:'이번 주 팀 회의에서 결정된 사항을 공유합니다.\n프로젝트 A는 다음 주 착수 예정입니다.', author:'김지훈', authorId:2, date:'2026.04.04', views:45, likes:3, isPinned:false, importance:'normal', status:'open', faqCategory:'', thumbnail:'', tags:['회의','팀'], attachments:[], answers:[], aiSummary:null },
  { id:1004, category:'general', title:'자료 공유 - 2026 업무 템플릿', content:'팀원 여러분께 공유드리는 2026년 업무 템플릿입니다.\n자유롭게 활용해 주세요.', author:'이민준', authorId:3, date:'2026.04.01', views:78, likes:6, isPinned:false, importance:'normal', status:'open', faqCategory:'', thumbnail:'', tags:['자료','템플릿'], attachments:['2026_업무템플릿.xlsx'], answers:[], aiSummary:null },
  { id:1005, category:'qna', title:'로그인이 계속 실패하는데 어떻게 해야 하나요?', content:'아이디와 비밀번호를 정확히 입력해도 로그인이 안 됩니다.\n브라우저를 바꿔봐도 동일한 현상이 발생합니다.', author:'박정훈', authorId:4, date:'2026.04.04', views:23, likes:0, isPinned:false, importance:'normal', status:'answered', faqCategory:'', thumbnail:'', tags:['로그인','오류'], attachments:[], answers:[{ id:101, author:'관리자', date:'2026.04.04', content:'캐시를 삭제하신 후 재시도 해보시기 바랍니다. Ctrl+Shift+Delete 로 캐시를 삭제하시고 다시 로그인 시도해 주세요.' }], aiSummary:null },
  { id:1006, category:'qna', title:'파일 첨부 용량 제한이 어떻게 되나요?', content:'파일을 첨부하려는데 업로드가 안 됩니다.\n용량 제한이 있나요?', author:'최부자', authorId:5, date:'2026.04.02', views:15, likes:0, isPinned:false, importance:'normal', status:'open', faqCategory:'', thumbnail:'', tags:['파일','첨부'], attachments:[], answers:[], aiSummary:null },
  { id:1007, category:'faq', title:'비밀번호를 분실했을 때 어떻게 하나요?', content:'로그인 화면 하단의 "비밀번호 찾기" 버튼을 클릭하시어 등록된 이메일로 임시 비밀번호를 발급받으실 수 있습니다.', author:'관리자', authorId:1, date:'2026.03.15', views:256, likes:12, isPinned:false, importance:'normal', status:'open', faqCategory:'계정', thumbnail:'', tags:['비밀번호','계정'], attachments:[], answers:[], aiSummary:null },
  { id:1008, category:'faq', title:'여러 기기에서 동시에 로그인할 수 있나요?', content:'네, 가능합니다. 동일 계정으로 최대 3개 기기에서 동시에 로그인하여 사용하실 수 있습니다.', author:'관리자', authorId:1, date:'2026.03.10', views:189, likes:7, isPinned:false, importance:'normal', status:'open', faqCategory:'계정', thumbnail:'', tags:['로그인','기기'], attachments:[], answers:[], aiSummary:null },
  { id:1009, category:'faq', title:'데이터는 어디에 저장되나요?', content:'모든 데이터는 국내 IDC 서버에 저장되며, 개인정보보호법에 따라 암호화 처리됩니다.', author:'관리자', authorId:1, date:'2026.03.05', views:145, likes:5, isPinned:false, importance:'normal', status:'open', faqCategory:'데이터', thumbnail:'', tags:['데이터','보안'], attachments:[], answers:[], aiSummary:null },
  { id:1010, category:'news', title:'WorkM 2.0 정식 출시! 새로운 업무 혁신을 경험하세요', content:'WorkM 2.0이 드디어 정식 출시되었습니다.\n완전히 새로워진 UI와 강력한 협업 기능으로 업무 효율을 극대화하세요.\n\n주요 특징:\n- 실시간 협업 대시보드\n- AI 기반 업무 분석\n- 모바일 최적화', author:'편집팀', authorId:1, date:'2026.04.01', views:892, likes:67, isPinned:false, importance:'high', status:'open', faqCategory:'', thumbnail:'🚀', tags:['출시','업데이트'], attachments:[], answers:[], aiSummary:'WorkM 2.0 정식 출시. 실시간 협업, AI 분석, 모바일 최적화 기능 탑재' },
  { id:1011, category:'news', title:'4월 EVENT – 신규 가입자 3개월 무료 혜택', content:'이번 봄맞이 이벤트에 함께 해주세요!\n4월 한 달간 신규 가입 시 프리미엄 서비스 3개월 무료!\n지금 바로 시작하세요.', author:'마케팅팀', authorId:1, date:'2026.03.30', views:445, likes:29, isPinned:false, importance:'normal', status:'open', faqCategory:'', thumbnail:'🎁', tags:['이벤트','프로모션'], attachments:[], answers:[], aiSummary:'4월 신규가입 시 프리미엄 3개월 무료 이벤트' },
];

/* ─────────────────── 상태 변수 ─────────────────── */
let _boardPosts      = [];
let _boardCategory   = 'all';
let _boardViewMode   = localStorage.getItem('ws_board_view') || 'list';
let _boardSearch     = '';
let _boardPage       = 1;
let _boardFaqFilter  = 'all';
let _boardSort       = 'date';
const _BOARD_PER_PAGE = 10;

/* ─────────────────── 데이터 CRUD ─────────────────── */
function _loadBoardPosts() {
  const raw = localStorage.getItem('ws_board_posts');
  if (raw) {
    try { _boardPosts = JSON.parse(raw); } catch(e) { _boardPosts = []; }
  }
  if (!_boardPosts.length) {
    _boardPosts = JSON.parse(JSON.stringify(_BOARD_SAMPLE));
    _saveBoardPosts();
  }
}
function _saveBoardPosts() {
  localStorage.setItem('ws_board_posts', JSON.stringify(_boardPosts));
}
function _getBoardNextId() {
  return _boardPosts.length ? Math.max(..._boardPosts.map(p=>p.id)) + 1 : 1001;
}

/* ─────────────────── 필터링/정렬 ─────────────────── */
function _getBoardFiltered() {
  let posts = _boardPosts.slice();
  if (_boardCategory !== 'all') posts = posts.filter(p => p.category === _boardCategory);
  if (_boardSearch.trim()) {
    const q = _boardSearch.trim().toLowerCase();
    posts = posts.filter(p => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q) || (p.tags||[]).some(t=>t.toLowerCase().includes(q)));
  }
  if (_boardCategory === 'faq' && _boardFaqFilter !== 'all') {
    posts = posts.filter(p => p.faqCategory === _boardFaqFilter);
  }
  posts.sort((a,b) => {
    if (_boardSort === 'views') return b.views - a.views;
    if (_boardSort === 'likes') return b.likes - a.likes;
    return b.date.localeCompare(a.date);
  });
  // 공지 상단 고정
  const pinned = posts.filter(p=>p.isPinned);
  const normal = posts.filter(p=>!p.isPinned);
  return [...pinned, ...normal];
}

/* ─────────────────── 메인 렌더 진입점 ─────────────────── */
function renderBoardPage() {
  _loadBoardPosts();
  const container = document.getElementById('boardContentArea');
  if (!container) return;

  const filtered = _getBoardFiltered();
  const total    = filtered.length;

  // 인기글 기준 (조회수 상위 20%)
  const sortedByViews = _boardPosts.slice().sort((a,b)=>b.views-a.views);
  const hotThreshold  = sortedByViews[Math.floor(sortedByViews.length*0.2)]?.views || 999;

  // 페이지네이션
  const totalPages = Math.max(1, Math.ceil(filtered.length / _BOARD_PER_PAGE));
  if (_boardPage > totalPages) _boardPage = 1;
  const paged = (_boardCategory === 'faq')
    ? filtered  // FAQ는 아코디언이라 전체 표시
    : filtered.slice((_boardPage-1)*_BOARD_PER_PAGE, _boardPage*_BOARD_PER_PAGE);

  // 카테고리별 렌더
  switch (_boardCategory) {
    case 'notice': container.innerHTML = _renderNoticeBoard(paged, hotThreshold); break;
    case 'general': container.innerHTML = _renderGeneralBoard(paged, hotThreshold); break;
    case 'qna':    container.innerHTML = _renderQnaBoard(paged); break;
    case 'faq':    container.innerHTML = _renderFaqBoard(filtered); break;
    case 'news':   container.innerHTML = _renderNewsBoard(paged, hotThreshold); break;
    default:       container.innerHTML = _renderAllBoard(paged, hotThreshold); break;
  }

  // 페이지네이션 렌더 (FAQ 제외)
  if (_boardCategory !== 'faq') {
    const pgEl = document.getElementById('boardPagination');
    if (pgEl) pgEl.innerHTML = _renderPagination(totalPages, total);
  }

  // 카운트
  const cntEl = document.getElementById('boardTotalCount');
  if (cntEl) cntEl.textContent = total + '건';

  if (window.refreshIcons) refreshIcons();
}

/* ─────────────────── 1. 전체 (혼합형) ─────────────────── */
function _renderAllBoard(posts, hot) {
  if (!posts.length) return _boardEmpty();
  return posts.map(p => _renderAllCard(p, hot)).join('');
}
function _renderAllCard(p, hot) {
  const catInfo = _boardCatInfo(p.category);
  const isHot   = p.views >= hot;
  return `
  <div class="board-all-row" onclick="_boardOpenPost(${p.id})" style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid var(--border-color);cursor:pointer;transition:background .15s" onmouseover="this.style.background='var(--bg-secondary)'" onmouseout="this.style.background=''">
    <span style="display:inline-flex;align-items:center;justify-content:center;padding:3px 8px;border-radius:6px;font-size:10px;font-weight:700;background:${catInfo.bg};color:${catInfo.color};white-space:nowrap;flex-shrink:0">${catInfo.label}</span>
    ${p.isPinned ? '<i data-lucide="pin" style="width:12px;height:12px;color:#f59e0b;flex-shrink:0"></i>' : ''}
    ${isHot ? '<span style="font-size:9.5px;font-weight:800;color:#ef4444;background:#ef444415;border:1px solid #ef444430;border-radius:4px;padding:1px 5px;flex-shrink:0">HOT</span>' : ''}
    ${p.importance==='high' ? '<i data-lucide="alert-circle" style="width:12px;height:12px;color:#f59e0b;flex-shrink:0"></i>' : ''}
    <span style="flex:1;font-size:13px;font-weight:${p.isPinned?'700':'500'};color:var(--text-primary);overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${p.title}</span>
    ${(p.tags||[]).slice(0,2).map(t=>`<span style="font-size:10px;background:var(--bg-tertiary);border:1px solid var(--border-color);border-radius:4px;padding:1px 6px;color:var(--text-muted);white-space:nowrap">#${t}</span>`).join('')}
    <span style="font-size:11px;color:var(--text-muted);white-space:nowrap;flex-shrink:0">${p.author}</span>
    <span style="font-size:11px;color:var(--text-muted);white-space:nowrap;flex-shrink:0">${p.date.slice(5)}</span>
    <span style="display:inline-flex;align-items:center;gap:3px;font-size:11px;color:var(--text-muted);white-space:nowrap;flex-shrink:0"><i data-lucide="eye" style="width:10px;height:10px"></i>${p.views}</span>
  </div>`;
}

/* ─────────────────── 2. 일반 게시판 (테이블) ─────────────────── */
function _renderGeneralBoard(posts, hot) {
  if (!posts.length) return _boardEmpty();
  const rows = posts.map(p => {
    const isHot = p.views >= hot;
    return `<tr onclick="_boardOpenPost(${p.id})" style="cursor:pointer" onmouseover="this.style.background='var(--bg-secondary)'" onmouseout="this.style.background=''">
      <td style="max-width:380px">
        <div style="display:flex;align-items:center;gap:8px">
          ${isHot?'<span style="font-size:9.5px;font-weight:800;color:#ef4444;background:#ef444415;border:1px solid #ef444430;border-radius:4px;padding:1px 5px;flex-shrink:0">HOT</span>':''}
          ${(p.attachments||[]).length?'<i data-lucide="paperclip" style="width:10px;height:10px;color:var(--text-muted);flex-shrink:0"></i>':''}
          <span style="font-size:13px;font-weight:500;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${p.title}</span>
          ${(p.tags||[]).slice(0,1).map(t=>`<span style="font-size:10px;color:var(--accent-blue);background:var(--accent-blue-light);border-radius:4px;padding:1px 5px;flex-shrink:0">#${t}</span>`).join('')}
        </div>
      </td>
      <td style="text-align:center;font-size:12px;color:var(--text-secondary)">${p.author}</td>
      <td style="text-align:center;font-size:11px;color:var(--text-muted)">${p.date}</td>
      <td style="text-align:center"><span style="display:inline-flex;align-items:center;gap:3px;font-size:11px;color:var(--text-muted)"><i data-lucide="eye" style="width:10px;height:10px"></i>${p.views}</span></td>
      <td style="text-align:center"><span style="display:inline-flex;align-items:center;gap:3px;font-size:11px;color:#ef4444"><i data-lucide="heart" style="width:10px;height:10px"></i>${p.likes}</span></td>
    </tr>`;
  }).join('');
  return `<table class="task-table" style="font-size:12px;width:100%">
    <thead><tr>
      <th style="text-align:left">제목</th>
      <th style="width:80px;text-align:center">작성자</th>
      <th style="width:100px;text-align:center">날짜</th>
      <th style="width:70px;text-align:center">조회</th>
      <th style="width:60px;text-align:center">추천</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div id="boardPagination" style="margin-top:20px;display:flex;justify-content:center"></div>`;
}

/* ─────────────────── 3. 공지사항 (카드+강조) ─────────────────── */
function _renderNoticeBoard(posts, hot) {
  if (!posts.length) return _boardEmpty();
  const pinned = posts.filter(p=>p.isPinned);
  const normal = posts.filter(p=>!p.isPinned);
  let html = '';
  if (pinned.length) {
    html += `<div style="margin-bottom:20px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid var(--accent-blue)">
        <i data-lucide="pin" style="width:14px;height:14px;color:var(--accent-blue)"></i>
        <span style="font-size:12px;font-weight:800;color:var(--accent-blue)">고정 공지</span>
      </div>`;
    pinned.forEach(p => { html += _renderNoticeCard(p, true); });
    html += `</div>`;
  }
  if (normal.length) {
    html += `<div style="display:flex;flex-direction:column;gap:8px">`;
    normal.forEach(p => { html += _renderNoticeCard(p, false); });
    html += `</div>`;
  }
  html += `<div id="boardPagination" style="margin-top:20px;display:flex;justify-content:center"></div>`;
  return html;
}
function _renderNoticeCard(p, pinned) {
  const impColor = p.importance==='high' ? '#ef4444' : 'var(--text-secondary)';
  const bg = pinned ? 'linear-gradient(135deg,rgba(79,110,247,.06),rgba(139,92,246,.04))' : 'var(--bg-secondary)';
  const border = pinned ? '2px solid rgba(79,110,247,.2)' : '1px solid var(--border-color)';
  return `
  <div onclick="_boardOpenPost(${p.id})" style="background:${bg};border:${border};border-radius:12px;padding:16px 20px;cursor:pointer;transition:box-shadow .2s;margin-bottom:${pinned?'8px':'0'}" onmouseover="this.style.boxShadow='0 4px 20px rgba(0,0,0,.08)'" onmouseout="this.style.boxShadow=''">
    <div style="display:flex;align-items:flex-start;gap:10px">
      ${pinned ? '<i data-lucide="pin" style="width:16px;height:16px;color:var(--accent-blue);flex-shrink:0;margin-top:2px"></i>' : `<i data-lucide="megaphone" style="width:16px;height:16px;color:${impColor};flex-shrink:0;margin-top:2px"></i>`}
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap">
          ${p.importance==='high' ? '<span style="font-size:10px;font-weight:800;color:#ef4444;background:#ef444415;border:1px solid #ef444430;border-radius:6px;padding:2px 8px">⚠ 중요</span>' : ''}
          ${pinned ? '<span style="font-size:10px;font-weight:800;color:var(--accent-blue);background:var(--accent-blue-light);border-radius:6px;padding:2px 8px">📌 고정</span>' : ''}
          <h3 style="font-size:14px;font-weight:700;color:var(--text-primary);margin:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${p.title}</h3>
        </div>
        <div style="font-size:12px;color:var(--text-muted);overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${p.content.slice(0,80)}...</div>
        <div style="display:flex;align-items:center;gap:12px;margin-top:10px">
          <span style="font-size:11px;color:var(--text-muted)">${p.author}</span>
          <span style="font-size:11px;color:var(--text-muted)">${p.date}</span>
          <span style="display:inline-flex;align-items:center;gap:3px;font-size:11px;color:var(--text-muted)"><i data-lucide="eye" style="width:10px;height:10px"></i>${p.views}</span>
          ${(p.tags||[]).map(t=>`<span style="font-size:10px;background:var(--bg-tertiary);border:1px solid var(--border-color);border-radius:4px;padding:1px 6px;color:var(--text-muted)">#${t}</span>`).join('')}
        </div>
      </div>
    </div>
  </div>`;
}

/* ─────────────────── 4. Q&A (스레드형) ─────────────────── */
function _renderQnaBoard(posts) {
  if (!posts.length) return _boardEmpty();
  return posts.map(p => {
    const answered = p.status === 'answered';
    const badgeColor = answered ? '#22c55e' : '#f59e0b';
    const badgeLabel = answered ? '✅ 답변완료' : '⏳ 답변대기';
    return `
    <div style="border:1.5px solid var(--border-color);border-radius:12px;overflow:hidden;margin-bottom:12px;transition:box-shadow .2s" onmouseover="this.style.boxShadow='0 4px 16px rgba(0,0,0,.08)'" onmouseout="this.style.boxShadow=''">
      <div onclick="_boardToggleQna(this,${p.id})" style="display:flex;align-items:center;gap:12px;padding:14px 16px;cursor:pointer;background:var(--bg-secondary)">
        <div style="width:32px;height:32px;border-radius:50%;background:var(--accent-blue-light);display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <span style="font-size:12px;font-weight:800;color:var(--accent-blue)">Q</span>
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13.5px;font-weight:600;color:var(--text-primary);overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${p.title}</div>
          <div style="display:flex;align-items:center;gap:10px;margin-top:4px">
            <span style="font-size:11px;color:var(--text-muted)">${p.author}</span>
            <span style="font-size:11px;color:var(--text-muted)">${p.date}</span>
            <span style="display:inline-flex;align-items:center;gap:3px;font-size:11px;color:var(--text-muted)"><i data-lucide="eye" style="width:9px;height:9px"></i>${p.views}</span>
            ${(p.tags||[]).map(t=>`<span style="font-size:10px;background:var(--bg-tertiary);border:1px solid var(--border-color);border-radius:4px;padding:1px 5px;color:var(--text-muted)">#${t}</span>`).join('')}
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
          <span style="font-size:10.5px;font-weight:700;color:${badgeColor};background:${badgeColor}18;border:1.5px solid ${badgeColor}40;border-radius:8px;padding:3px 10px">${badgeLabel}</span>
          <span style="font-size:11px;color:var(--text-muted);background:var(--bg-tertiary);border-radius:6px;padding:2px 8px">${(p.answers||[]).length}개 답변</span>
          <i data-lucide="chevron-down" style="width:16px;height:16px;color:var(--text-muted);transition:transform .2s" class="qna-arrow-${p.id}"></i>
        </div>
      </div>
      <div id="qna-body-${p.id}" style="display:none">
        <div style="padding:14px 16px 14px 60px;background:var(--bg-primary);border-top:1px solid var(--border-color)">
          <p style="font-size:13px;color:var(--text-secondary);line-height:1.7;white-space:pre-wrap;margin:0">${p.content}</p>
        </div>
        ${(p.answers||[]).map(a=>`
        <div style="padding:14px 16px 14px 60px;background:rgba(34,197,94,.04);border-top:1px solid rgba(34,197,94,.15)">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <div style="width:28px;height:28px;border-radius:50%;background:#22c55e22;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <span style="font-size:11px;font-weight:800;color:#22c55e">A</span>
            </div>
            <span style="font-size:12px;font-weight:700;color:#22c55e">${a.author}</span>
            <span style="font-size:11px;color:var(--text-muted)">${a.date}</span>
          </div>
          <p style="font-size:13px;color:var(--text-secondary);line-height:1.7;white-space:pre-wrap;margin:0;padding-left:36px">${a.content}</p>
        </div>`).join('')}
        ${WS.currentUser&&WS.currentUser.role==='admin' ? `
        <div style="padding:10px 16px;border-top:1px solid var(--border-color);display:flex;gap:8px">
          <textarea id="qna-ans-${p.id}" placeholder="답변을 입력하세요..." rows="2" style="flex:1;font-size:12px;border:1.5px solid var(--border-color);border-radius:8px;padding:6px 10px;resize:none;background:var(--bg-primary);color:var(--text-primary)"></textarea>
          <button onclick="_boardSubmitAnswer(${p.id})" style="padding:8px 14px;border-radius:8px;background:var(--accent-blue);color:#fff;border:none;cursor:pointer;font-size:12px;font-weight:700;align-self:flex-end">답변 등록</button>
        </div>` : ''}
      </div>
    </div>`;
  }).join('') + `<div id="boardPagination" style="margin-top:20px;display:flex;justify-content:center"></div>`;
}

/* ─────────────────── 5. FAQ (아코디언) ─────────────────── */
function _renderFaqBoard(posts) {
  if (!posts.length) return _boardEmpty();
  const cats = [...new Set(posts.map(p=>p.faqCategory).filter(Boolean))];
  const filterHtml = cats.length ? `
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <button onclick="_faqFilter('all')" class="faq-filter-btn${_boardFaqFilter==='all'?' active':''}" style="padding:5px 14px;border-radius:20px;font-size:12px;font-weight:600;border:1.5px solid ${_boardFaqFilter==='all'?'var(--accent-blue)':'var(--border-color)'};background:${_boardFaqFilter==='all'?'var(--accent-blue)':'transparent'};color:${_boardFaqFilter==='all'?'#fff':'var(--text-muted)'};cursor:pointer">전체</button>
    ${cats.map(c=>`<button onclick="_faqFilter('${c}')" style="padding:5px 14px;border-radius:20px;font-size:12px;font-weight:600;border:1.5px solid ${_boardFaqFilter===c?'var(--accent-blue)':'var(--border-color)'};background:${_boardFaqFilter===c?'var(--accent-blue)':'transparent'};color:${_boardFaqFilter===c?'#fff':'var(--text-muted)'};cursor:pointer">${c}</button>`).join('')}
  </div>` : '';
  const items = posts.map((p,i) => `
  <div style="border:1.5px solid var(--border-color);border-radius:10px;overflow:hidden;margin-bottom:8px">
    <div onclick="_faqToggle(${p.id})" style="display:flex;align-items:center;gap:12px;padding:14px 16px;cursor:pointer;background:var(--bg-secondary);transition:background .15s" onmouseover="this.style.background='var(--bg-tertiary)'" onmouseout="this.style.background='var(--bg-secondary)'">
      <div style="width:26px;height:26px;border-radius:50%;background:var(--accent-blue);display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <span style="font-size:11px;font-weight:800;color:#fff">Q</span>
      </div>
      ${p.faqCategory ? `<span style="font-size:10px;font-weight:700;background:var(--accent-blue-light);color:var(--accent-blue);border-radius:4px;padding:2px 7px;flex-shrink:0">${p.faqCategory}</span>` : ''}
      <span style="flex:1;font-size:13px;font-weight:600;color:var(--text-primary)">${p.title}</span>
      <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
        <span style="display:inline-flex;align-items:center;gap:3px;font-size:11px;color:var(--text-muted)"><i data-lucide="eye" style="width:9px;height:9px"></i>${p.views}</span>
        <i data-lucide="chevron-down" id="faq-icon-${p.id}" style="width:16px;height:16px;color:var(--text-muted);transition:transform .25s"></i>
      </div>
    </div>
    <div id="faq-body-${p.id}" style="display:none;padding:16px 16px 16px 54px;background:var(--bg-primary);border-top:1px solid var(--border-color)">
      <div style="display:flex;align-items:flex-start;gap:10px">
        <div style="width:26px;height:26px;border-radius:50%;background:#22c55e22;display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <span style="font-size:11px;font-weight:800;color:#22c55e">A</span>
        </div>
        <p style="font-size:13px;color:var(--text-secondary);line-height:1.8;white-space:pre-wrap;margin:2px 0 0 0">${p.content}</p>
      </div>
    </div>
  </div>`).join('');
  return filterHtml + items;
}

/* ─────────────────── 6. 뉴스/이벤트 (카드그리드) ─────────────────── */
function _renderNewsBoard(posts, hot) {
  if (!posts.length) return _boardEmpty();
  const cards = posts.map(p => {
    const isHot = p.views >= hot;
    const thumb = p.thumbnail || '📄';
    return `
    <div onclick="_boardOpenPost(${p.id})" style="background:var(--bg-secondary);border:1.5px solid var(--border-color);border-radius:16px;overflow:hidden;cursor:pointer;transition:transform .2s,box-shadow .2s" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 40px rgba(0,0,0,.12)'" onmouseout="this.style.transform='';this.style.boxShadow=''">
      <div style="height:120px;background:linear-gradient(135deg,${_newsGradient(p.id)});display:flex;align-items:center;justify-content:center;font-size:48px;position:relative">
        ${thumb}
        ${isHot ? '<span style="position:absolute;top:10px;right:10px;font-size:10px;font-weight:800;color:#fff;background:#ef4444;border-radius:6px;padding:2px 8px">HOT 🔥</span>' : ''}
        ${p.importance==='high' ? '<span style="position:absolute;top:10px;left:10px;font-size:10px;font-weight:800;color:#fff;background:rgba(0,0,0,.5);border-radius:6px;padding:2px 8px">⭐ PICK</span>' : ''}
      </div>
      <div style="padding:14px">
        ${p.aiSummary ? `<div style="font-size:10.5px;color:var(--accent-blue);background:var(--accent-blue-light);border-radius:6px;padding:4px 8px;margin-bottom:8px;display:flex;align-items:center;gap:4px"><i data-lucide="sparkles" style="width:10px;height:10px"></i>${p.aiSummary}</div>` : ''}
        <h3 style="font-size:14px;font-weight:800;color:var(--text-primary);line-height:1.4;margin:0 0 8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${p.title}</h3>
        <p style="font-size:12px;color:var(--text-muted);line-height:1.6;margin:0 0 10px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${p.content}</p>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:11px;color:var(--text-muted)">${p.author}</span>
            <span style="font-size:11px;color:var(--text-muted)">${p.date}</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="display:inline-flex;align-items:center;gap:3px;font-size:11px;color:var(--text-muted)"><i data-lucide="eye" style="width:10px;height:10px"></i>${p.views}</span>
            <span style="display:inline-flex;align-items:center;gap:3px;font-size:11px;color:#ef4444"><i data-lucide="heart" style="width:10px;height:10px"></i>${p.likes}</span>
          </div>
        </div>
        ${(p.tags||[]).length ? `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:10px">${p.tags.map(t=>`<span style="font-size:10px;background:var(--bg-tertiary);border:1px solid var(--border-color);border-radius:4px;padding:1px 6px;color:var(--text-muted)">#${t}</span>`).join('')}</div>` : ''}
      </div>
    </div>`;
  }).join('');
  return `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px">${cards}</div>
  <div id="boardPagination" style="margin-top:24px;display:flex;justify-content:center"></div>`;
}

function _newsGradient(id) {
  const gs = [
    '#667eea,#764ba2','#f093fb,#f5576c','#4facfe,#00f2fe',
    '#43e97b,#38f9d7','#fa709a,#fee140','#a18cd1,#fbc2eb',
    '#ffecd2,#fcb69f','#84fab0,#8fd3f4'
  ];
  return gs[id % gs.length];
}

/* ─────────────────── 페이지네이션 ─────────────────── */
function _renderPagination(totalPages, total) {
  if (totalPages <= 1) return '';
  let html = '';
  const btn = (label, page, active=false, disabled=false) => {
    const col = active ? 'var(--accent-blue)' : 'transparent';
    const tc  = active ? '#fff' : 'var(--text-secondary)';
    const cur = disabled ? 'not-allowed' : 'pointer';
    return `<button onclick="${disabled?'':('_boardGoPage('+page+')')}" style="min-width:32px;height:32px;padding:0 8px;border-radius:8px;border:1.5px solid ${active?'var(--accent-blue)':'var(--border-color)'};background:${col};color:${tc};font-size:12px;font-weight:${active?'700':'500'};cursor:${cur};opacity:${disabled?.4:1}">${label}</button>`;
  };
  html += btn('‹', _boardPage-1, false, _boardPage===1);
  for (let i=1; i<=totalPages; i++) {
    if (i===1||i===totalPages||Math.abs(i-_boardPage)<=2) {
      html += btn(i, i, i===_boardPage);
    } else if (Math.abs(i-_boardPage)===3) {
      html += `<span style="padding:0 4px;color:var(--text-muted)">…</span>`;
    }
  }
  html += btn('›', _boardPage+1, false, _boardPage===totalPages);
  return `<div style="display:flex;align-items:center;gap:4px">${html}</div>`;
}

/* ─────────────────── 빈 상태 ─────────────────── */
function _boardEmpty() {
  return `<div style="text-align:center;padding:60px;color:var(--text-muted)">
    <div style="font-size:40px;margin-bottom:12px">📭</div>
    <div style="font-size:14px;font-weight:600">게시글이 없습니다</div>
    ${_boardSearch ? `<div style="font-size:12px;margin-top:6px">"${_boardSearch}" 검색 결과가 없습니다</div>` : ''}
  </div>`;
}

/* ─────────────────── 카테고리 정보 ─────────────────── */
function _boardCatInfo(cat) {
  const map = {
    all:    { label:'전체',    color:'#6366f1', bg:'#6366f115' },
    general:{ label:'일반',    color:'#6b7280', bg:'#6b728015' },
    notice: { label:'공지',    color:'#f59e0b', bg:'#f59e0b18' },
    qna:    { label:'Q&A',    color:'#06b6d4', bg:'#06b6d415' },
    faq:    { label:'FAQ',    color:'#22c55e', bg:'#22c55e15' },
    news:   { label:'뉴스',    color:'#8b5cf6', bg:'#8b5cf618' },
  };
  return map[cat] || map.general;
}

/* ─────────────────── 인터랙션 핸들러 ─────────────────── */
function _boardGoPage(page) {
  _boardPage = page;
  renderBoardPage();
  document.getElementById('boardContentArea')?.scrollIntoView({ behavior:'smooth', block:'start' });
}

function _boardSetCategory(cat) {
  _boardCategory = cat;
  _boardPage     = 1;
  _boardSearch   = '';
  const inp = document.getElementById('boardSearchInput');
  if (inp) inp.value = '';
  // 사이드바 활성 상태 업데이트
  document.querySelectorAll('.board-cat-btn').forEach(el => {
    const active = el.dataset.cat === cat;
    el.style.background  = active ? 'var(--accent-blue)' : 'transparent';
    el.style.color        = active ? '#fff' : 'var(--text-secondary)';
    el.style.borderColor  = active ? 'var(--accent-blue)' : 'transparent';
    el.style.fontWeight   = active ? '700' : '500';
  });
  renderBoardPage();
}

function _boardSetView(mode) {
  _boardViewMode = mode;
  localStorage.setItem('ws_board_view', mode);
  document.querySelectorAll('.board-view-btn').forEach(el => {
    const active = el.dataset.view === mode;
    el.style.background = active ? 'var(--accent-blue)' : 'transparent';
    el.style.color      = active ? '#fff' : 'var(--text-muted)';
  });
  renderBoardPage();
}

function _boardSearch_() {
  const inp = document.getElementById('boardSearchInput');
  _boardSearch = inp ? inp.value.trim() : '';
  _boardPage   = 1;
  renderBoardPage();
}

function _faqToggle(id) {
  const body = document.getElementById('faq-body-' + id);
  const icon = document.getElementById('faq-icon-' + id);
  if (!body) return;
  const open = body.style.display === 'none';
  body.style.display = open ? 'block' : 'none';
  if (icon) icon.style.transform = open ? 'rotate(180deg)' : '';
  if (open) {
    const p = _boardPosts.find(p=>p.id===id);
    if (p) { p.views++; _saveBoardPosts(); }
  }
}

function _faqFilter(cat) {
  _boardFaqFilter = cat;
  renderBoardPage();
}

function _boardToggleQna(el, id) {
  const body = document.getElementById('qna-body-' + id);
  if (!body) return;
  const open = body.style.display === 'none';
  body.style.display = open ? 'block' : 'none';
  const arrow = el.querySelector('.qna-arrow-' + id);
  if (arrow) arrow.style.transform = open ? 'rotate(180deg)' : '';
  if (open) {
    const p = _boardPosts.find(p=>p.id===id);
    if (p) { p.views++; _saveBoardPosts(); }
  }
}

function _boardSubmitAnswer(postId) {
  const ta = document.getElementById('qna-ans-' + postId);
  if (!ta || !ta.value.trim()) { showToast('warning','답변 내용을 입력하세요'); return; }
  const p = _boardPosts.find(p=>p.id===postId);
  if (!p) return;
  if (!p.answers) p.answers = [];
  const now = new Date();
  const dateStr = now.getFullYear() + '.' + String(now.getMonth()+1).padStart(2,'0') + '.' + String(now.getDate()).padStart(2,'0');
  p.answers.push({ id: Date.now(), author: WS.currentUser?.name||'관리자', date: dateStr, content: ta.value.trim() });
  p.status = 'answered';
  _saveBoardPosts();
  showToast('success','답변이 등록되었습니다');
  renderBoardPage();
}

/* ─────────────────── 게시글 상세 보기 ─────────────────── */
function _boardOpenPost(id) {
  const p = _boardPosts.find(p=>p.id===id);
  if (!p) return;
  p.views++;
  _saveBoardPosts();

  const modal = document.getElementById('boardPostModal');
  const body  = document.getElementById('boardPostModalBody');
  if (!modal || !body) return;

  const catInfo = _boardCatInfo(p.category);
  body.innerHTML = `
  <div style="max-width:720px;margin:0 auto">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;flex-wrap:wrap">
      <span style="padding:3px 10px;border-radius:6px;font-size:11px;font-weight:700;background:${catInfo.bg};color:${catInfo.color}">${catInfo.label}</span>
      ${p.isPinned ? '<span style="padding:3px 10px;border-radius:6px;font-size:11px;font-weight:700;background:#f59e0b18;color:#f59e0b">📌 고정</span>' : ''}
      ${p.importance==='high' ? '<span style="padding:3px 10px;border-radius:6px;font-size:11px;font-weight:700;background:#ef444415;color:#ef4444">⚠ 중요</span>' : ''}
    </div>
    ${p.aiSummary ? `<div style="background:linear-gradient(135deg,rgba(79,110,247,.08),rgba(139,92,246,.06));border:1px solid rgba(79,110,247,.2);border-radius:10px;padding:12px 14px;margin-bottom:16px;display:flex;align-items:flex-start;gap:8px"><i data-lucide="sparkles" style="width:14px;height:14px;color:var(--accent-blue);flex-shrink:0;margin-top:2px"></i><div><div style="font-size:10px;font-weight:800;color:var(--accent-blue);margin-bottom:4px">AI 요약</div><div style="font-size:12px;color:var(--text-secondary)">${p.aiSummary}</div></div></div>` : ''}
    <h2 style="font-size:20px;font-weight:800;color:var(--text-primary);line-height:1.4;margin:0 0 12px">${p.title}</h2>
    <div style="display:flex;align-items:center;gap:14px;padding-bottom:14px;border-bottom:1px solid var(--border-color);flex-wrap:wrap">
      <div style="display:inline-flex;align-items:center;gap:6px">
        <div style="width:28px;height:28px;border-radius:50%;background:var(--accent-blue);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff">${p.author.slice(0,2)}</div>
        <span style="font-size:13px;font-weight:600">${p.author}</span>
      </div>
      <span style="font-size:12px;color:var(--text-muted)">${p.date}</span>
      <span style="display:inline-flex;align-items:center;gap:4px;font-size:12px;color:var(--text-muted)"><i data-lucide="eye" style="width:12px;height:12px"></i>${p.views}회</span>
      <span style="display:inline-flex;align-items:center;gap:4px;font-size:12px;color:#ef4444"><i data-lucide="heart" style="width:12px;height:12px"></i>${p.likes}개</span>
      ${(p.tags||[]).map(t=>`<span style="font-size:11px;background:var(--bg-tertiary);border:1px solid var(--border-color);border-radius:4px;padding:2px 8px;color:var(--text-muted)">#${t}</span>`).join('')}
    </div>
    <div style="padding:20px 0;font-size:14px;color:var(--text-secondary);line-height:1.9;white-space:pre-wrap;min-height:120px">${p.content}</div>
    ${(p.attachments||[]).length ? `<div style="border:1px solid var(--border-color);border-radius:10px;padding:12px;background:var(--bg-secondary)"><div style="font-size:11px;font-weight:700;color:var(--text-muted);margin-bottom:8px">첨부파일</div>${p.attachments.map(f=>`<div style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;background:var(--bg-primary);border:1px solid var(--border-color);border-radius:6px;font-size:12px;margin:2px"><i data-lucide="paperclip" style="width:11px;height:11px"></i>${f}</div>`).join('')}</div>` : ''}
    <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-top:24px;padding-top:20px;border-top:1px solid var(--border-color)">
      <button onclick="_boardLikePost(${p.id})" style="display:inline-flex;align-items:center;gap:6px;padding:8px 20px;border-radius:10px;background:var(--bg-secondary);border:1.5px solid var(--border-color);cursor:pointer;font-size:13px;font-weight:600;color:#ef4444;transition:all .15s" onmouseover="this.style.borderColor='#ef4444'" onmouseout="this.style.borderColor='var(--border-color)'">
        <i data-lucide="heart" style="width:14px;height:14px"></i> 추천 ${p.likes}
      </button>
    </div>
  </div>`;

  modal.style.display = 'flex';
  if (window.refreshIcons) setTimeout(refreshIcons, 40);
}

function _boardLikePost(id) {
  const p = _boardPosts.find(p=>p.id===id);
  if (!p) return;
  p.likes++;
  _saveBoardPosts();
  _boardOpenPost(id);
  renderBoardPage();
}

/* ─────────────────── 게시글 작성 / 수정 모달 ─────────────────── */
function openBoardWriteModal(editId) {
  const modal = document.getElementById('boardWriteModal');
  if (!modal) return;
  const isEdit = Boolean(editId);
  const p = isEdit ? _boardPosts.find(p=>p.id===editId) : null;

  document.getElementById('boardWriteTitle').textContent = isEdit ? '게시글 수정' : '게시글 작성';
  document.getElementById('boardWriteId').value    = editId || '';
  document.getElementById('boardWriteCat').value   = p?.category || _boardCategory || 'general';
  document.getElementById('boardWriteTitleIn').value = p?.title || '';
  document.getElementById('boardWriteContent').value = p?.content || '';
  document.getElementById('boardWriteTags').value  = (p?.tags||[]).join(', ');
  document.getElementById('boardWritePin').checked = p?.isPinned || false;
  document.getElementById('boardWriteImp').value   = p?.importance || 'normal';
  document.getElementById('boardWriteAiSummary').value = p?.aiSummary || '';
  document.getElementById('boardWriteFaqCat').value = p?.faqCategory || '';

  _boardToggleWriteFields();
  modal.style.display = 'flex';
}

function _boardToggleWriteFields() {
  const cat = document.getElementById('boardWriteCat')?.value;
  const faqRow = document.getElementById('boardWriteFaqRow');
  const pinRow = document.getElementById('boardWritePinRow');
  if (faqRow) faqRow.style.display = cat === 'faq' ? 'flex' : 'none';
  if (pinRow) pinRow.style.display = cat === 'notice' ? 'flex' : 'none';
}

function saveBoardPost() {
  const idVal   = document.getElementById('boardWriteId').value;
  const cat     = document.getElementById('boardWriteCat').value;
  const title   = document.getElementById('boardWriteTitleIn').value.trim();
  const content = document.getElementById('boardWriteContent').value.trim();
  const tagsRaw = document.getElementById('boardWriteTags').value;
  const isPinned = document.getElementById('boardWritePin').checked;
  const importance = document.getElementById('boardWriteImp').value;
  const aiSummary = document.getElementById('boardWriteAiSummary').value.trim() || null;
  const faqCat  = document.getElementById('boardWriteFaqCat').value.trim();

  if (!title) { showToast('warning','제목을 입력하세요'); return; }
  if (!content) { showToast('warning','내용을 입력하세요'); return; }

  const tags = tagsRaw.split(',').map(t=>t.trim()).filter(Boolean);
  const now  = new Date();
  const dateStr = now.getFullYear()+'.'+String(now.getMonth()+1).padStart(2,'0')+'.'+String(now.getDate()).padStart(2,'0');
  const author  = WS.currentUser?.name || '관리자';
  const authorId = WS.currentUser?.id || 1;

  if (idVal) {
    const p = _boardPosts.find(p=>p.id===Number(idVal));
    if (p) { Object.assign(p, { category:cat, title, content, tags, isPinned, importance, aiSummary, faqCategory:faqCat }); }
    showToast('success','게시글이 수정되었습니다');
  } else {
    _boardPosts.unshift({ id:_getBoardNextId(), category:cat, title, content, author, authorId, date:dateStr, views:0, likes:0, isPinned, importance, status:'open', faqCategory:faqCat, thumbnail:'', tags, attachments:[], answers:[], aiSummary });
    showToast('success','게시글이 등록되었습니다');
  }
  _saveBoardPosts();
  closeBoardWriteModal();
  renderBoardPage();
}

function closeBoardWriteModal() {
  const m = document.getElementById('boardWriteModal');
  if (m) m.style.display = 'none';
}
function closeBoardPostModal() {
  const m = document.getElementById('boardPostModal');
  if (m) m.style.display = 'none';
}

/* ─────────────────── 초기화 ─────────────────── */
function initBoardPage() {
  _loadBoardPosts();
  renderBoardPage();
}
