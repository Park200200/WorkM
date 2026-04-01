// ============================================================

let sidebarTimer = null;

/* ?? 초기화?? */
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('ws_user');
  if (!saved) { window.location.href = 'login.html'; return; }
  WS.currentUser = JSON.parse(saved);
  WS.currentUser = JSON.parse(saved);
  // 로그인 시 당일 최초 출근 시간 자동 기록
  WS.checkIn(WS.currentUser.id);
  WS.updateUser(WS.currentUser.id, { status: '근무' });
  // ??λ맂 媛뺤“??蹂듭썝 ??--currentAccent 초기화(?щ젰 ?쎌빱 ?깆뿉 반영)
  const savedAccent = localStorage.getItem('ws_current_accent');
  if (savedAccent) applyAccent(savedAccent);
  initHeader();
  showPage('dashboard');
  setInterval(updateDateTime, 1000);
  updateDateTime();
  closeAllDropdowns();
  refreshIcons();
  renderAttendancePill();      // ??異쒗눜洹?위젯 초기화  
  // ?ъ씠?쒕컮 ??대㉧ 초기화  resetSidebarTimer();
});

function refreshIcons() {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

/* ?? ?ㅻ뜑 초기화?? */
/* ?? ?좎쭨?쒓컙 ?? */
function updateDateTime() {
  const el = document.getElementById('currentDateTime');
  if (!el) return;
  const now = new Date();
  const days = ['일','월','화','수','목','금','토'];
  el.textContent = `${now.getFullYear()}.${pad(now.getMonth()+1)}.${pad(now.getDate())} (${days[now.getDay()]}) ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}
function pad(n){ return String(n).padStart(2,'0'); }

/* ?? ?섏씠吏 ?꾪솚 ?? */
function showPage(name, navEl) {
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
    p.style.display = 'none';
  });
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.sub-item').forEach(n => n.classList.remove('active'));
  
  const page = document.getElementById('page-' + name);
  if (page) {
    page.classList.add('active');
    page.style.display = 'block';
  }
  if (navEl) navEl.classList.add('active');
  
  // ?섏씠吏蹂??곗씠??濡쒕뱶
  if (name === 'dashboard') renderDashboard();
  if (name === 'tasks') {
    // tasks ?섏씠吏 吏꾩엯 ??_taskViewMode 湲곕낯媛?蹂댁옣
    if (!window._taskViewMode) {
      window._taskViewMode = 'assignment';
      window._assignmentMode = window._assignmentMode || 'task';
    }
    // assignmentSubFilter ?쒖떆 상태 초기화
    const assSub = document.getElementById('assignmentSubFilter');
    const listSub = document.getElementById('taskListFilter');
    if (window._taskViewMode === 'assignment') {
      if (assSub) assSub.style.display = 'flex';
      if (listSub) listSub.style.display = 'none';
    } else {
      if (assSub) assSub.style.display = 'none';
      if (listSub) listSub.style.display = 'none';
    }
    renderPage_Tasks();
  }
  if (name === 'staff-mgmt') renderPage_StaffMgmt();
  if (name === 'settings') { window._settingsFilter = 'all'; renderPage_Settings(); }
  if (name === 'schedule') renderPage_Schedule();
  if (name === 'performance') renderPage_Performance();
  if (name === 'profile') renderPage_Profile();
  if (name === 'hq-info') renderPage_HQInfo();
  if (name === 'org-mgmt') renderPage_OrgMgmt();
  if (name === 'rank-mgmt') renderPage_RankMgmt();

  closeAllDropdowns();
}

/* ?? ?쒕툕硫붾돱 ?좉? ?? */
function toggleSubMenu(el) {
  const sb = document.getElementById('mainSidebar');
  // 異뺤냼 상태?쇰㈃ ?뺤옣 癒쇱?
  if (sb.classList.contains('collapsed')) {
    expandSidebar();
    // ?뺤옣???좊땲硫붿씠?섏쑝濡?吏꾪뻾?섎?濡??쎄컙??吏?????쇱묠
    setTimeout(() => el.classList.toggle('expanded'), 100);
  } else {
    el.classList.toggle('expanded');
  }
  resetSidebarTimer();
}

/* ?? ?뚮쭏 ?? */
function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') || 'light';
  const next = cur === 'light' ? 'dark' : 'light';
  applyTheme(next);
}
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  document.querySelector('.theme-toggle').innerHTML = t === 'dark' ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
  localStorage.setItem('ws_theme', t);
  refreshIcons();
}

/* ?? 濡쒓렇?꾩썐 ?? */
function logout() {
  if (WS.currentUser) { WS.checkOut(WS.currentUser.id); WS.updateUser(WS.currentUser.id, { status: '근무(퇴근)' }); }
  localStorage.removeItem('ws_user');
  window.location.href = 'login.html';
}

/* ?? ?ъ씠?쒕컮 ?쒖뼱 (?좉퇋) ?? */
function resetSidebarTimer() {
  if (sidebarTimer) clearTimeout(sidebarTimer);
  sidebarTimer = setTimeout(() => {
    collapseSidebar();
  }, 10000); // 10초
}
function toggleSidebar() {
  const sb = document.getElementById('mainSidebar');
  if (!sb) return;
  if (sb.classList.contains('collapsed')) {
    expandSidebar();
  } else {
    collapseSidebar();
  }
}

function collapseSidebar() {
  const sb = document.getElementById('mainSidebar');
  if (sb) {
    sb.classList.add('collapsed');
  }
}

function expandSidebar() {
  const sb = document.getElementById('mainSidebar');
  if (sb) {
    sb.classList.remove('collapsed');
    resetSidebarTimer(); // 정상 범위 ?대㉧ ?ㅼ떆 ?쒖옉
  }
}

/* ?? 異쒗눜洹??? */
function checkIn() {
  WS.attendance.checkedIn = true;
  WS.attendance.checkInTime = new Date();
  document.getElementById('btnCheckin').style.display = 'none';
  document.getElementById('btnCheckout').style.display = 'flex';
  showToast('success','<i data-lucide="check-circle-2"></i> 異쒓렐 완료! 오늘???붿씠?낇븯?몄슂 ?삃');
}
function checkOut() {
  WS.attendance.checkedIn = false;
  WS.attendance.checkOutTime = new Date();
  document.getElementById('btnCheckout').style.display = 'none';
  document.getElementById('btnCheckin').style.display = 'flex';
  showToast('info','<i data-lucide="log-out"></i> 퇴근 泥섎━ 완료! 수고하셨습니다.');
}

/* ?? ?좎뒪???? */
/* ?? 초기화 ?? */
function toggleDropdown(id) {
  const el = document.getElementById(id);
  const isOpen = el.classList.contains('show');
  closeAllDropdowns();
  if (!isOpen) el.classList.add('show');
}
function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-menu.show').forEach(d => d.classList.remove('show'));
}
document.addEventListener('click', e => {
  if (!e.target.closest('.dropdown-wrapper') && !e.target.closest('.btn-icon')) closeAllDropdowns();
});

/* ?? 紐⑤떖 ?? */
function closeModal(id, e) { if (e.target.classList.contains('modal-overlay')) closeModalDirect(id); }
function closeModalDirect(id) { document.getElementById(id).style.display = 'none'; }
function openModal(id) { document.getElementById(id).style.display = 'flex'; }

/* ?? 알림 ?? */
/* ━━ 대시보드 함수들은 modules/dashboard.js 로 이동됨 ━━ */


function sendMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if(!text) return;
  
  WS.addMessage(text);
  input.value = '';
  
  // 利됱떆 ?뚮뜑留?(?€?쒕낫??전체瑜?洹몃━湲곕낫??梨꾪똿 ?곸뿭留?업데이트되면 醫뗭?留??⑥닚???꾪빐 전체 由щ젋??
  renderDashboard();
}


/* ── 내가 지시한 업무 담당자 클릭 → 실시간 메시지 채널 활성화 */
var _activeChatTaskTitle = null;
var _activeChatTask = null;
var _activeChatAssignerOverride = null;
function openTaskChatChannel(taskTitle, taskId, assignerIdOverride) {
  var nameEl   = document.getElementById('chatChannelTaskName');
  var suffixEl = document.getElementById('chatChannelSuffix');
  var inputEl  = document.getElementById('chatInput');
  var chatBody = document.getElementById('chatBody');

  _activeChatTaskTitle = taskTitle;
  _activeChatAssignerOverride = assignerIdOverride || null;
  // taskId로 해당 업무 담당자 정보 찾기
  if (taskId) {
    _activeChatTask = WS.tasks && WS.tasks.find(function(t){ return String(t.id) === String(taskId); });
  } else {
    _activeChatTask = WS.tasks && WS.tasks.find(function(t){ return t.title === taskTitle; });
  }

  // 헤더 타이틀: "업무명 : 실시간 메시지 채널"
  if (nameEl) { nameEl.textContent = taskTitle + ' :'; nameEl.style.display = 'inline'; }
  if (suffixEl) { suffixEl.textContent = '실시간 메시지 채널'; }

  // 우측 사용자 목록 → 해당 업무 담당자만
  _updateChatMemberList();

  // 입력창 placeholder + 포커스
  if (inputEl) {
    inputEl.placeholder = '[' + taskTitle + '] 메시지를 입력하세요...';
    inputEl.focus();
  }

  // 스크롤 최하단
  if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;

  showToast('info', '"' + taskTitle + '" 메시지 채널이 활성화되었습니다.', 2500);
}

/* 채팅 헤더 우측 담당자 목록 동적 업데이트 */
function _updateChatMemberList() {
  var container = document.getElementById('chatMemberList');
  if (!container) return;

  var users = [];
  if (_activeChatAssignerOverride) {
    // 지시자 override: 해당 지시자만 우측에 표시
    var au = (WS.users || []).find(function(u){ return String(u.id) === String(_activeChatAssignerOverride); });
    users = au ? [au] : [];
  } else if (_activeChatTask) {
    // assigneeIds + assignerId (지시자) 모두 포함
    var ids = Array.isArray(_activeChatTask.assigneeIds)
      ? _activeChatTask.assigneeIds.slice()
      : (_activeChatTask.assigneeId ? [_activeChatTask.assigneeId] : []);
    // assignerId가 있고 아직 포함되지 않은 경우 추가
    if (_activeChatTask.assignerId && !ids.some(function(id){ return String(id) === String(_activeChatTask.assignerId); })) {
      ids.unshift(_activeChatTask.assignerId);
    }
    users = (WS.users || []).filter(function(u){
      return ids.some(function(id){ return String(id) === String(u.id); });
    });
    // ids 순서 유지 (assignerId 우선)
    users.sort(function(a, b){
      return ids.indexOf(String(a.id)) - ids.indexOf(String(b.id));
    });

  } else {
    users = WS.users || [];
  }

  var isMulti = users.length > 1;
  container.innerHTML = users.map(function(u, i) {
    var isMe = WS.currentUser && String(u.id) === String(WS.currentUser.id);
    var bg = 'linear-gradient(135deg,' + (u.color||'#4f6ef7') + ',#9747ff)';
    var ring = isMe ? '0 0 0 2.5px #22c55e' : '0 0 0 1.5px var(--border-color)';
    var marginLeft = (isMulti && i > 0) ? '-8px' : '0';
    var zIndex = users.length - i;

    return '<div title="' + u.name + '" style="'
      + 'display:inline-flex;flex-direction:column;align-items:center;gap:2px;flex-shrink:0;'
      + 'margin-left:' + marginLeft + ';z-index:' + zIndex + ';position:relative'
      + '">'
      + '<div style="width:26px;height:26px;border-radius:50%;background:' + bg + ';box-shadow:' + ring + ';'
      + 'display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#fff;position:relative;border:2px solid var(--bg-secondary)">'
      + (u.avatar || u.name.charAt(0))
      + (isMe ? '<span style="position:absolute;bottom:-1px;right:-1px;width:7px;height:7px;border-radius:50%;background:#22c55e;border:1.5px solid var(--bg-primary)"></span>' : '')
      + '</div>'
      + ((!isMulti) ? ('<span style="font-size:8.5px;font-weight:' + (isMe?'800':'600') + ';'
        + 'color:' + (isMe?'var(--currentAccent,#4f6ef7)':'var(--text-muted)') + ';'
        + 'white-space:nowrap;max-width:36px;overflow:hidden;text-overflow:ellipsis;line-height:1">' + u.name + '</span>') : '')
      + '</div>';
  }).join('');
}

/* ?€?€ ?뱀뀡5: 媛꾪듃李⑦듃 (留덇컧??기준) ?€?€ */
function buildGantt() {
  const tasks = WS.getSortedByDue().slice(0,6);
  const today = new Date();
  const startDate = new Date(today); startDate.setDate(startDate.getDate()-3);
  const days = 14;

  const dayHeaders = Array.from({length:days}, (_,i) => {
    const d = new Date(startDate); d.setDate(d.getDate()+i);
    const isToday = d.toDateString()===today.toDateString();
    return `<div class="gantt-day ${isToday?'today':''}">${d.getMonth()+1}/${d.getDate()}</div>`;
  }).join('');

  const todayOffset = ((today - startDate)/(1000*60*60*24)) / days * 100;

  const rows = tasks.map(t => {
    const _gIds = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
    const assignee = WS.getUser(_gIds[0]);

    const due = new Date(t.dueDate);
    const started = t.startedAt ? new Date(t.startedAt) : new Date(t.createdAt);

    const barStart = Math.max(0, ((started - startDate)/(1000*60*60*24)) / days * 100);
    const barEnd = Math.min(100, ((due - startDate)/(1000*60*60*24+1)) / days * 100);
    const barWidth = Math.max(3, barEnd - barStart);
    const barCls = t.status==='delay'?'red':t.status==='done'?'green':WS.getDday(t.dueDate)<=2?'orange':'blue';
    const dd = WS.getDdayBadge(t.dueDate);
    return `<div class="gantt-row" onclick="openTaskDetail(${t.id})" style="cursor:pointer">
      <div class="gantt-task-info">
        <div class="gantt-task-name" title="${t.title}">${t.isImportant?'<span class="star-icon"><i data-lucide="star"></i></span>':''} ${t.title}</div>
        <div class="gantt-task-assignee">${assignee?.name} · <span class="dday-badge ${dd.cls}" style="font-size:9.5px;padding:1px 5px">${dd.label}</span></div>
      </div>
      <div class="gantt-bar-area">
        <div class="gantt-today-line" style="left:${todayOffset}%"></div>
        <div class="gantt-bar ${barCls}" style="left:${barStart}%;width:${barWidth}%" title="${t.title} (${WS.formatDate(t.startedAt||t.createdAt)} ~ ${WS.formatDate(t.dueDate)})">
          ${barWidth>8?t.progress+'%':''}
        </div>
      </div>
    </div>`;
  }).join('');

  return `<div class="section-card full-width">
    <div class="section-head">
      <div class="section-title-group">
        <div class="section-dot" style="background:#f59e0b"><i data-lucide="calendar"></i></div>
        <div class="section-title">마감일 기준 미완료 나의 업무 차트</div>
        <span class="section-count">${tasks.length}건</span>>
      </div>
      <div class="section-actions">
        <span style="font-size:11px;color:var(--text-muted)">마감일 기준 정렬</span>
      </div>
    </div>
    <div class="gantt-wrap">
      <div class="gantt-header">
        <div class="gantt-task-col">업무</div>
        <div class="gantt-timeline-head">${dayHeaders}</div>
      </div>
      ${tasks.length===0?'<div class="empty-state"><div class="es-icon">?뱥</div><div class="es-text">吏꾪뻾 以묒씤 ?낅Т媛 ?놁뒿?덈떎</div></div>':rows}
    </div>
  </div>`;
}

/* ?낅Т ?곹깭 蹂寃?*/
function changeStatus(taskId, newStatus) {
  WS.changeTaskStatus(taskId, newStatus);
  renderDashboard();
  renderPage_Tasks();
  showToast('success', `업무 상태媛€ "${WS.getStatusLabel(newStatus)}"?쇰줈 蹂€寃쎈릺됩니다.`);
}

/* ── 내가 지시받은 업무 클릭 → 지시받은 업무 전용 상세 모달 */
function openReceivedTaskDetail(taskId) {
  const t = WS.getTask(taskId);
  if (!t) return;

  // ws_instructions에서 지시 정보 가져오기
  const instrList = JSON.parse(localStorage.getItem('ws_instructions') || '[]');
  const instr = instrList.find(i =>
    i.id === t.id || i.id === Number(t.id) ||
    (i.taskId && (i.taskId === t.id || i.taskId === String(t.id) || i.taskId === Number(t.id)))
  );

  // 지시자 (스케쥴 업무는 본인, 지시받은 업무는 지시자 이름)
  const assigner = WS.getUser(t.assignerId);
  const assignerName = assigner ? assigner.name
                     : (instr && instr.assignerName ? instr.assignerName
                     : (t.isSchedule || !t.assignerId ? '본인' : '-'));

  // 지시일 (지시사항 등록일 또는 startDate)
  const instrDate = (instr && instr.createdAt) ? new Date(instr.createdAt).toLocaleDateString('ko-KR') :
                    (t.startDate ? t.startDate : '-');

  // 마감일 포맷
  const dueStr = t.dueDate ? new Date(t.dueDate).toLocaleDateString('ko-KR') : '-';
  const dd = WS.getDdayBadge(t.dueDate);
  const fillCls = t.status==='delay'?'delay':t.status==='done'?'done':'';
  const progress = t.progress || 0;

  // 지시중요도 아이콘 목록
  const allImportances = JSON.parse(localStorage.getItem('ws_instr_importances') || '[]');
  const importanceStr = (instr && instr.importance) ? instr.importance : (t.importance || '');
  const impNames = importanceStr ? importanceStr.split(',').map(s=>s.trim()).filter(Boolean) : [];
  const impIcons = impNames.map(name => {
    const imp = allImportances.find(i => i.name === name);
    if (!imp || !imp.icon) return '';
    const c = imp.color || '#ef4444';
    return `<span title="${name}" style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:${c}18;border:1.5px solid ${c}">
      <i data-lucide="${imp.icon}" style="width:12px;height:12px;color:${c}"></i></span>`;
  }).join('');

  // 지시내용
  const instrContent = (instr && instr.content) ? instr.content : (t.desc || t.description || '-');

  // processTags 결정: instr.procedure 파싱 > instr.processTags > t.processTags 순
  // instr.procedure는 편집 모달 기준 항상 최신값 → 항상 우선 적용
  if (instr && instr.procedure && instr.procedure.trim()) {
    const parsed = instr.procedure.split(/→|\u2192|\|/).map(s => s.trim()).filter(Boolean);
    if (parsed.length > 0) t.processTags = parsed;
  } else if (instr && instr.processTags && instr.processTags.length > 0) {
    t.processTags = instr.processTags;
  } else if (!t.processTags || t.processTags.length === 0) {
    if (t.procedure && t.procedure.trim()) {
      t.processTags = t.procedure.split(/→|\u2192|\|/).map(s => s.trim()).filter(Boolean);
    }
  }

  // instr.attachments 병합: 지시자가 등록한 파일을 진행보고서 모달에도 표시
  // (t.attachments에 없는 파일만 앞쪽에 추가, 읽기전용 - 삭제불가 다운로드만)
  if (instr && Array.isArray(instr.attachments) && instr.attachments.length > 0) {
    if (!t.attachments) t.attachments = [];
    const existingNames = t.attachments.map(a => typeof a === 'string' ? a : (a.name || ''));
    // 지시자 이름 결정 (author → WS.getUser(assignerId) → '지시자' 순서)
    const instrUploaderName = instr.assignerName
      || instr.author
      || (instr.assignerId && WS.getUser && WS.getUser(instr.assignerId)
           ? WS.getUser(instr.assignerId).name : null)
      || '지시자';
    const instrUploaderId = instr.assignerId || null;
    const instrAttachNorm = instr.attachments.map(a =>
      typeof a === 'string'
        ? { name: a, uploaderId: instrUploaderId, uploaderName: instrUploaderName, _instrFile: true }
        : Object.assign({}, a, {
            uploaderId:   a.uploaderId   || instrUploaderId,
            uploaderName: a.uploaderName || instrUploaderName,
            _instrFile: true
          })
    ).filter(a => !existingNames.includes(a.name));
    // 지시자 파일은 앞에 붙임
    t.attachments = instrAttachNorm.concat(t.attachments);
  }

  document.getElementById('tdModalTitle').innerHTML =
    `<i data-lucide="file-text" style="width:17px;height:17px;color:var(--accent-blue);vertical-align:middle;margin-right:5px;flex-shrink:0"></i>`
    + `<span style="color:var(--text-primary)">${t.title}</span>`
    + `<span style="color:var(--text-muted);font-weight:500;margin:0 6px">:</span>`
    + `<span style="color:var(--accent-blue)">진행보고서 작성</span>`
    + `<span style="font-size:12px;font-weight:700;background:var(--accent-blue);color:#fff;border-radius:20px;padding:2px 9px;vertical-align:middle;margin-left:8px;opacity:.85">${progress}%</span>`;
  refreshIcons && refreshIcons();

  document.getElementById('tdModalBody').innerHTML = `
    <!-- 📋 지시받은 업무 상세 카드 -->
    <div style="background:var(--bg-tertiary);border:1px solid var(--border-color);border-radius:14px;padding:16px;margin-bottom:18px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:14px">
        <div>
          <div style="font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">지시자 및 업무명</div>
          <div style="font-size:13px;font-weight:700;color:var(--accent-blue);margin-bottom:3px">${assignerName} → ${t.title}</div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
          ${_renderStatusBadge(t.status)}
          ${impIcons}
          <span class="dday-badge ${dd.cls}">${dd.label}</span>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px">
        <div style="background:var(--bg-secondary);border-radius:10px;padding:10px 12px">
          <div style="font-size:10px;color:var(--text-muted);font-weight:600;margin-bottom:4px">지시일</div>
          <div style="font-size:13px;font-weight:700;color:var(--text-primary)">${instrDate}</div>
        </div>
        <div style="background:var(--bg-secondary);border-radius:10px;padding:10px 12px">
          <div style="font-size:10px;color:var(--text-muted);font-weight:600;margin-bottom:4px">마감일</div>
          <div style="font-size:13px;font-weight:700;color:var(--text-primary)">${dueStr}</div>
        </div>
        <div style="background:var(--bg-secondary);border-radius:10px;padding:10px 12px">
          <div style="font-size:10px;color:var(--text-muted);font-weight:600;margin-bottom:4px">진행율</div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:4px">
            <div style="flex:1;height:5px;background:var(--border-color);border-radius:100px;overflow:hidden">
              <div style="width:${progress}%;height:100%;background:${t.status==='done'?'#22c55e':t.status==='delay'?'#ef4444':'var(--accent-blue)'};border-radius:100px;transition:width .4s"></div>
            </div>
            <span style="font-size:12px;font-weight:800;color:var(--accent-blue)">${progress}%</span>
          </div>
        </div>
        <div style="background:var(--bg-secondary);border-radius:10px;padding:10px 12px">
          <div style="font-size:10px;color:var(--text-muted);font-weight:600;margin-bottom:4px">보고내용</div>
          <div style="font-size:12px;font-weight:700;color:var(--text-primary)">${t.reportContent||'-'}</div>
        </div>
      </div>
      <!-- 지시내용 (readonly) -->
      <div style="border-top:1px solid var(--border-color);padding-top:12px">
        <label class="form-label" style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
          <i data-lucide="file-text" style="width:12px;height:12px"></i> 지시내용
        </label>
        <div style="background:var(--bg-secondary);border:1.5px solid var(--border-color);border-radius:10px;padding:12px 14px;font-size:13px;color:var(--text-primary);min-height:72px;line-height:1.6;white-space:pre-wrap">${instrContent}</div>
      </div>
    </div>

    <!-- 📊 진행율 설정 -->
    <div style="margin-bottom:16px;background:var(--bg-tertiary);border:1.5px solid var(--border-color);border-radius:14px;padding:14px">
      <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:12px;display:flex;align-items:center;gap:6px">
        <i data-lucide="trending-up" style="width:13px;height:13px"></i> 진행 보고
      </div>

      <!-- 이전 진행율 + 변화량 헤더 -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <span style="font-size:12px;color:var(--text-muted);font-weight:600">진행률 설정</span>
        <div style="display:flex;align-items:center;gap:8px">
          <span id="prevProgLabel_${t.id}" style="font-size:11px;background:var(--bg-secondary);border:1.5px solid var(--border-color);border-radius:20px;padding:3px 10px;font-weight:700;color:var(--text-secondary)">이전: ${progress}%</span>
          <span id="progDeltaLabel_${t.id}" style="font-size:11px;background:#dcfce7;border-radius:20px;padding:3px 10px;font-weight:800;color:#16a34a;display:${progress>0?'inline-block':'none'}">↗ +0%</span>
        </div>
      </div>
      <!-- 캡슐형 슬라이더 (높이24px, 핸들34px) -->
      <div id="capsuleSliderWrap_${t.id}"
        style="position:relative;height:24px;border-radius:100px;cursor:pointer;user-select:none;overflow:visible;box-shadow:0 4px 16px rgba(79,110,247,.35);margin-bottom:10px"
        onmousedown="_capsuleStart(event,'${t.id}',${progress})"
        ontouchstart="_capsuleStart(event,'${t.id}',${progress})">
        <!-- 트랙 배경 (inner, overflow:hidden) -->
        <div style="position:absolute;inset:0;border-radius:100px;background:linear-gradient(135deg,#3b4fd8,#4f6ef7);overflow:hidden">
          <!-- 채워진 영역 (더 어두운 파란) -->
          <div id="capsuleFill_${t.id}"
            style="position:absolute;left:0;top:0;bottom:0;width:${progress}%;background:linear-gradient(135deg,#1a2db8,#2a44d6);transition:width .1s"></div>
          <!-- 텍스트 overlay -->
          <div style="position:absolute;inset:0;display:flex;align-items:center;padding:0 44px 0 14px;pointer-events:none">
            <span id="capsuleText_${t.id}" style="font-size:13px;font-weight:800;color:#fff;letter-spacing:.5px;text-shadow:0 1px 4px rgba(0,0,0,.3)">현재 ${progress}%</span>
          </div>
        </div>
        <!-- 원형 핸들 (34px - 바 24px보다 5px씩 돌출) -->
        <div id="capsuleHandle_${t.id}"
          style="position:absolute;top:50%;right:4px;
                 transform:translateY(-50%);
                 width:34px;height:34px;border-radius:50%;background:#fff;
                 box-shadow:0 2px 12px rgba(0,0,0,.30);
                 display:flex;align-items:center;justify-content:center;
                 pointer-events:none;cursor:grab;z-index:10">
          <i data-lucide="align-justify" style="width:14px;height:14px;color:#4f6ef7"></i>
        </div>
      </div>
      <!-- hidden input (저장용) -->
      <input type="hidden" id="progressInput_${t.id}" value="${progress}">
      <!-- 진행 내용 입력 (한 줄 칩 UI) -->
      <div style="display:flex;gap:8px;align-items:center">
        <!-- 왼쪽: 진행순서 선택 칩 (processTags 있을 때만) -->
        ${(t.processTags && t.processTags.length > 0) ? `
        <div style="position:relative;flex-shrink:0">
          <select id="td_stepSelect"
            onchange="_updateStepChip('${t.id}')"
            style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;z-index:2">
            <option value="">단계 선택</option>
            ${(t.processTags || []).map(s => {
              const rt = (WS.reportTypes||[]).find(r => r.label===s);
              const icon = rt ? (rt.icon||'circle') : 'circle';
              const color = rt ? (rt.color||'#4f6ef7') : '#4f6ef7';
              return `<option value="${s}" data-icon="${icon}" data-color="${color}">${s}</option>`;
            }).join('')}
          </select>
          <span id="td_stepChip_${t.id}"
            style="display:inline-flex;align-items:center;gap:5px;padding:6px 12px;
                   border-radius:20px;background:rgba(79,110,247,.12);
                   border:1.5px solid rgba(79,110,247,.35);
                   font-size:12px;font-weight:700;color:var(--accent-blue);
                   white-space:nowrap;cursor:pointer;user-select:none">
            <i id="td_stepIcon_${t.id}" data-lucide="list-ordered" style="width:12px;height:12px"></i>
            <span id="td_stepLabel_${t.id}">단계 선택</span>
            <i data-lucide="chevron-down" style="width:11px;height:11px;opacity:.6"></i>
          </span>
        </div>` : `<input type="hidden" id="td_stepSelect" value="">`}
        <!-- 가운데: 텍스트 입력 -->
        <input id="td_reportText" type="text" placeholder="진행 내용을 입력하세요..."
          class="form-input"
          style="flex:1;height:38px;padding:0 12px;font-size:13px;border-radius:20px"
          onkeydown="if(event.key==='Enter'){event.preventDefault();addProgressReport('${t.id}')}"
        >
        <!-- 오른쪽: 추가 버튼 -->
        <button onclick="addProgressReport('${t.id}')" class="btn btn-blue"
          style="height:38px;padding:0 16px;white-space:nowrap;border-radius:20px;font-size:13px;font-weight:700;flex-shrink:0">
          <i data-lucide="plus" style="width:14px;height:14px"></i> 추가
        </button>
      </div>
    </div>

    <!-- 📎 첨부파일 섹션 -->
    <div style="margin-bottom:18px;background:var(--bg-tertiary);border:1.5px solid var(--border-color);border-radius:14px;padding:14px">
      <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;gap:6px">
        <span style="display:flex;align-items:center;gap:6px"><i data-lucide="paperclip" style="width:13px;height:13px"></i> 첨부파일</span>
        <label style="display:inline-flex;align-items:center;gap:5px;padding:4px 11px;border-radius:20px;border:1.5px solid var(--accent-blue);color:var(--accent-blue);font-size:11px;font-weight:700;cursor:pointer;background:transparent;transition:all .15s"
          onmouseover="this.style.background='rgba(79,110,247,.1)'" onmouseout="this.style.background='transparent'">
          <i data-lucide="plus" style="width:11px;height:11px"></i> 파일 추가
          <input type="file" multiple style="display:none" onchange="_addTaskAttachment('${t.id}',this)">
        </label>
      </div>
      <div id="taskAttachList_${t.id}" style="display:flex;flex-wrap:wrap;gap:6px;min-height:28px">
        ${_buildTaskAttachHTML(t)}
      </div>
    </div>

    <input type="hidden" id="td_report" value="${t.reportContent||''}">
    <input type="hidden" id="td_score"  value="${t.score||0}">
    <input type="hidden" id="td_title"  value="${t.title}">
    <input type="hidden" id="td_desc"   value="${instrContent}">

    <!-- 📜 업무 히스토리 -->
    <div style="border-top:1px solid var(--border-color);padding-top:14px" id="historySection_${t.id}">
      <button class="btn" style="width:100%;justify-content:space-between;background:var(--bg-tertiary);border:none;font-size:12px;font-weight:700;height:36px"
        onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none';this.querySelector('.chev').textContent=this.nextElementSibling.style.display==='none'?'▼':'▲'">
        <span style="display:flex;align-items:center;gap:6px">
          <i data-lucide="history" style="width:14px;height:14px"></i> 업무 히스토리
          <span style="font-size:10px;background:var(--bg-card);border-radius:8px;padding:1px 7px;color:var(--text-muted)">${(t.history||[]).length}건</span>
        </span>
        <span class="chev">▼</span>
      </button>
      <div style="display:block;margin-top:8px" id="historyList_${t.id}"></div>
    </div>
  `;

  // 모달 열기
  const m = document.getElementById('taskDetailModal');
  if (m) {
    m.style.display = 'flex';
    window._currentDetailTaskId = t.id;
    if (window.lucide) lucide.createIcons();
    // 히스토리 로딩
    if (typeof renderTaskHistory === 'function') renderTaskHistory(t.id);
    // 캡슐 슬라이더 핸들 초기 위치 JS로 계산 (CSS % 기준 모호함 해소)
    requestAnimationFrame(function() {
      var wrap   = document.getElementById('capsuleSliderWrap_' + t.id);
      var handle = document.getElementById('capsuleHandle_' + t.id);
      if (wrap && handle) {
        var w = wrap.offsetWidth;
        var hW = 34;
        var left = Math.max(4, Math.min(w - hW - 4, (progress / 100) * w - hW / 2));
        handle.style.right = 'auto';
        handle.style.left  = left + 'px';
      }
    });
  }
}

/* ── 진행순서 칩 레이블 업데이트 ── */
function _updateStepChip(taskId) {
  var sel   = document.getElementById('td_stepSelect');
  var label = document.getElementById('td_stepLabel_' + taskId);
  var chip  = document.getElementById('td_stepChip_' + taskId);
  var iconEl = document.getElementById('td_stepIcon_' + taskId);
  if (!sel || !label) return;
  var val = sel.value;
  if (val) {
    // WS.reportTypes에서 선택된 단계의 아이콘/컬러 찾기
    var rt = (WS.reportTypes || []).find(function(r){ return r.label === val; });
    var icon  = rt ? (rt.icon  || 'circle') : 'circle';
    var color = rt ? (rt.color || '#4f6ef7') : '#4f6ef7';
    label.textContent = val;
    // 아이콘 교체
    if (iconEl) {
      iconEl.setAttribute('data-lucide', icon);
      iconEl.style.color = color;
      if (window.lucide && lucide.createIcons) lucide.createIcons({attrs:{strokeWidth:2}, nodes:[iconEl]});
    }
    if (chip) {
      chip.style.background = color + '22';
      chip.style.borderColor = color + '88';
      chip.style.color = color;
    }
  } else {
    label.textContent = '단계 선택';
    if (iconEl) {
      iconEl.setAttribute('data-lucide', 'list-ordered');
      iconEl.style.color = '';
      if (window.lucide && lucide.createIcons) lucide.createIcons({attrs:{strokeWidth:2}, nodes:[iconEl]});
    }
    if (chip) {
      chip.style.background = 'rgba(79,110,247,.08)';
      chip.style.borderColor = 'rgba(79,110,247,.35)';
      chip.style.color = 'var(--accent-blue)';
    }
  }
}

/* ── 캡슐형 진행율 슬라이더 드래그 로직 ── */
window._capsuleStart = function(e, taskId, prevVal) {
  e.preventDefault();
  var wrap = document.getElementById('capsuleSliderWrap_' + taskId);
  if (!wrap) return;
  var minVal = parseInt(prevVal) || 0;

  function getVal(clientX) {
    var rect = wrap.getBoundingClientRect();
    var ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.max(minVal, Math.min(100, Math.round(ratio * 100)));
  }

  function update(val) {
    var fill   = document.getElementById('capsuleFill_'    + taskId);
    var text   = document.getElementById('capsuleText_'    + taskId);
    var inp    = document.getElementById('progressInput_'  + taskId);
    var delta  = document.getElementById('progDeltaLabel_' + taskId);
    var handle = document.getElementById('capsuleHandle_'  + taskId);
    if (fill)   fill.style.width = val + '%';
    if (text)   text.textContent = '현재 ' + val + '%';
    if (inp)    inp.value = val;
    // 핸들을 fill 끝에 맞춰 이동 (px 계산)
    if (handle) {
      var wW = wrap.offsetWidth, hW2 = 34;
      var lx = Math.max(4, Math.min(wW - hW2 - 4, (val / 100) * wW - hW2 / 2));
      handle.style.right = 'auto';
      handle.style.left  = lx + 'px';
    }
    if (delta) {
      var diff = val - minVal;
      delta.textContent  = (diff >= 0 ? '↗ +' : '↘ ') + diff + '%';
      delta.style.display = 'inline-block';
      delta.style.background = diff >= 0 ? '#dcfce7' : '#fee2e2';
      delta.style.color      = diff >= 0 ? '#16a34a' : '#dc2626';
    }
  }

  // 즉시 반영
  var startX = e.touches ? e.touches[0].clientX : e.clientX;
  update(getVal(startX));

  function onMove(ev) {
    var cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
    update(getVal(cx));
  }
  function onEnd() {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup',   onEnd);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend',  onEnd);
  }
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup',   onEnd);
  document.addEventListener('touchmove', onMove, {passive:false});
  document.addEventListener('touchend',  onEnd);
};

/* ── saveTaskDetail 패치: progressInput 우선 읽기 ── */

function renderTaskHistory(taskId) {
  const t  = WS.getTask(taskId);
  const el = document.getElementById('historyList_' + taskId);
  if (!el || !t) return;
  const history = t.history || [];
  if (history.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:12px;font-size:12px;color:var(--text-muted)">히스토리가 없습니다</div>';
    return;
  }
  const palette = ['#ec4899','#4f6ef7','#f97316','#22c55e','#a855f7','#14b8a6'];
  el.innerHTML = history.slice().reverse().map(function(h) {
    const icon   = h.icon  || 'clock';
    const color  = h.color || '#4f6ef7';
    const label  = h.event || h.label || h.type || '업무보고';
    const detail = h.detail || h.content || h.text || '';
    const prog   = (h.progress !== undefined && h.progress !== null) ? h.progress : null;
    const dateStr = h.date || '';
    const user    = h.userId ? WS.getUser(h.userId) : null;

    // 아바타
    const aName    = user ? user.name : null;
    const aColor   = aName ? palette[aName.charCodeAt(0) % palette.length] : '#94a3b8';
    const aInitials = aName ? aName.slice(0,2) : '?';
    const avatar   = '<div style="width:34px;height:34px;border-radius:50%;background:' + aColor + ';'
      + 'display:flex;align-items:center;justify-content:center;flex-shrink:0;'
      + 'font-size:12px;font-weight:800;color:#fff;letter-spacing:.5px">' + aInitials + '</div>';

    // 이벤트 뱃지 ('진행보고'/'업무보고'는 불필요하므로 숨김)
    const _hideEvBadge = (label === '진행보고' || label === '업무보고');
    const evBadge = _hideEvBadge ? '' : ('<span style="display:inline-flex;align-items:center;gap:3px;'
      + 'font-size:11px;font-weight:700;color:' + color + ';'
      + 'background:' + color + '18;border:1px solid ' + color + '44;'
      + 'border-radius:20px;padding:2px 8px;white-space:nowrap;flex-shrink:0">'
      + '<i data-lucide="' + icon + '" style="width:10px;height:10px"></i>' + label + '</span>');

    // 진행순서 뱃지
    const stepBadge = h.stepLabel
      ? '<span style="display:inline-flex;align-items:center;gap:3px;'
        + 'font-size:11px;font-weight:700;color:#4f6ef7;'
        + 'background:#eef2ff;border:1px solid #c7d2fe;'
        + 'border-radius:20px;padding:2px 8px;white-space:nowrap;flex-shrink:0">'
        + '▶ ' + h.stepLabel + '</span>'
      : '';

    // 인라인 진행바 + %
    const barColor = prog !== null
      ? (prog >= 100 ? '#22c55e' : prog < 30 ? '#ef4444' : '#4f6ef7') : color;
    const inlineBar = prog !== null
      ? '<div style="flex:1;height:4px;background:var(--border-color);border-radius:100px;overflow:hidden;min-width:40px">'
        + '<div style="width:' + prog + '%;height:100%;background:' + barColor + ';border-radius:100px"></div></div>'
        + '<span style="font-size:11px;font-weight:700;color:' + barColor + ';white-space:nowrap;flex-shrink:0">' + prog + '%</span>'
      : '<div style="flex:1"></div>';

    // 날짜
    const dateHtml = '<span style="font-size:10px;color:var(--text-muted);white-space:nowrap;flex-shrink:0">' + dateStr + '</span>';

    // 2행: 작성자명 + 내용
    const row2 = (aName || detail)
      ? '<div style="display:flex;align-items:baseline;gap:6px;margin-top:5px;padding-left:0">'
        + (aName ? '<span style="font-size:11px;font-weight:700;color:var(--text-muted);flex-shrink:0">' + aName + '</span>' : '')
        + (detail ? '<span style="font-size:12px;color:var(--text-primary);line-height:1.5;white-space:pre-wrap">' + detail + '</span>' : '')
        + '</div>'
      : '';

    return '<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border-color)">'
      + avatar
      + '<div style="flex:1;min-width:0">'
      + '<div style="display:flex;align-items:center;gap:6px">'
      + evBadge + stepBadge + inlineBar + dateHtml
      + '</div>'
      + row2
      + '</div></div>';
  }).join('');
  const countEl = document.getElementById('historyCount_' + taskId);
  if (countEl) countEl.textContent = history.length + '건';
  if (window.lucide) lucide.createIcons();
}

/* ?€?€ 업무 상세 紐⑤떖 ?€?€ */
/* 📝 진행보고 히스토리 추가 */

function changeStatusFromModal(taskId, status) {
  changeStatus(taskId, status);
  openTaskDetail(taskId);
}

/* ── 새 업무 모달 ── */
/* ?? 怨쇱젙?깅줉 ?쒓렇 ?? */
let _processTags = [];
function addProcessTag(e) {
  if(e.key !== 'Enter' && e.key !== ',') return;
  e.preventDefault();
  const input = document.getElementById('nt_process_input');
  const val = input.value.trim().replace(/,$/, '');
  if(!val) return;
  if(!window._processTags) window._processTags = [];
  if(window._processTags.includes(val)) { input.value = ''; return; }
  window._processTags.push(val);
  input.value = '';
  renderProcessTags();
}

function removeProcessTag(idx) {
  if(window._processTags) window._processTags.splice(idx, 1);
  renderProcessTags();
}

function renderProcessTags() {
  const wrap = document.getElementById('nt_process_tags');
  if(!wrap) return;
  wrap.innerHTML = (window._processTags || []).map((t, i) =>
    `<span class="process-tag">${t}<button onclick="removeProcessTag(${i})">??/button></span>`
  ).join('');
}

/* ?? 업무목록 ?섏씠吏 (전체 ?쒖뼱) ?? */
function switchTaskView(view, btn) {
  window._taskViewMode = view;
  document.querySelectorAll('.view-switcher .switch-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  
  const title = document.getElementById('tasksPageTitle');
  const sub = document.getElementById('tasksPageSubtitle');
  const assSub = document.getElementById('assignmentSubFilter');
  const listSub = document.getElementById('taskListFilter');

  if (view === 'assignment') {
    title.textContent = '업무배정';
    sub.textContent = '내 담당 업무 배정 현황을 확인하세요.';
    assSub.style.display = 'flex';
    listSub.style.display = 'none';
  } else {
    title.textContent = '업무목록';
    sub.textContent = '전체 업무 목록 및 현황을 확인하세요.';
    assSub.style.display = 'none';
    listSub.style.display = 'none'; // ?꾪꽣 移??곸뿭 ?④? (?ъ슜???붿껌: 상태援щ텇 삭제)
  }
  renderPage_Tasks();
}

/* ?? 업무목록: 업무蹂?由ъ뒪???? */
/* ?? 업무목록: 吏곸썝蹂?由ъ뒪???? */
/* ?? 업무紐⑸줉: 怨좊룄?붾맂 怨꾩링??由ъ뒪???? */
/* ?? 업무紐⑸줉 수정 紐⑤떖 ?? */
/* ?? 업무 현황 담당吏곸썝 諛곗젙 紐⑤떖 ?? */
/* ?? 업무 諛곗젙 愿由??꾩슜 紐⑤떖 (?좉퇋) ?? */
function filterTasks(f, el) {
  document.querySelectorAll('#taskFilterChips .chip').forEach(c=>c.classList.remove('active'));
  el.classList.add('active');
  renderPage_Tasks(f);
}

function updateStatusCounters() {
  const tasks = WS.tasks;
  const counts = {
    all: tasks.length,
    waiting: tasks.filter(t=>t.status==='waiting').length,
    progress: tasks.filter(t=>t.status==='progress').length,
    delay: tasks.filter(t=>t.status==='delay').length,
    done: tasks.filter(t=>t.status==='done').length
  };

  // 업무목록/紐⑸줉 ?섏씠吏 移?업데이트
  Object.keys(counts).forEach(k => {
    const el = document.getElementById(`cnt_${k}`);
    if(el) el.textContent = counts[k];
  });

  // 업무설정 ?섏씠吏 移?업데이트
  Object.keys(counts).forEach(k => {
    const el = document.getElementById(`scnt_${k}`);
    if(el) el.textContent = counts[k];
  });
}

function filterSettings(filter, el) {
  window._settingsFilter = filter;
  document.querySelectorAll('#settingsFilterChips .chip').forEach(c=>c.classList.remove('active'));
  el.classList.add('active');
  renderPage_Settings();
}

/* ?? 업무설정 ?섏씠吏 ?? */
function renderPage_Settings() {
  updateStatusCounters();
  // 최초 진입 시 전체 필터로 강제 초기화
  if (!window._settingsFilter) {
    window._settingsFilter = 'all';
    const chips = document.querySelectorAll('#settingsFilterChips .chip');
    chips.forEach(c => c.classList.remove('active'));
    if (chips[0]) chips[0].classList.add('active');
  }
  const el = document.getElementById('settingsArea');
  if(!el) return;
  const filtered = (!window._settingsFilter || window._settingsFilter === 'all') ? WS.tasks : WS.tasks.filter(t=>t.status===window._settingsFilter);
  const byTeam = {};
  filtered.forEach(t => {
    if(!byTeam[t.team]) byTeam[t.team]=[];
    byTeam[t.team].push(t);
  });
  el.innerHTML = Object.entries(byTeam).map(([team, tasks])=>`
    <div class="section-card" style="margin-bottom:14px;padding:0">
      <div class="section-head" style="padding:14px 18px">
        <div class="section-title-group">
          <div class="section-dot" style="background:var(--accent-blue)"><i data-lucide="users"></i></div>
          <div class="section-title">${team}</div>
          <span class="section-count">${tasks.length}건</span>>
        </div>
      </div>
      <table class="task-table">
        <thead>
          <tr>
            <th>업무명</th>
            <th>지시자</th>
            <th>담당자</th>
            <th>우선순위</th>
            <th>상태</th>
            <th>진행률</th>
            <th>마감일</th>
          </tr>
        </thead>
        <tbody>
          ${tasks.map(t => {
            const _sIds = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
            const assignee = WS.getUser(_sIds[0]);
            const assigner = WS.getUser(t.assignerId);
            const fillCls = t.status==='delay'?'delay':t.status==='done'?'done':'';
            return `<tr onclick="openTaskDetail(${t.id})" style="cursor:pointer">
            <td style="width:30%">
              <div style="font-weight:700;font-size:13px">${t.isImportant?'<span class="star-icon"><i data-lucide="star"></i></span>':''} ${t.title}</div>
            </td>
            <td><div style="font-size:11.5px">${assigner?.name||'-'}</div></td>
            <td>
              <div style="display:flex;align-items:center;gap:6px">
                <div style="width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,${assignee?.color||'#4f6ef7'},#9747ff);display:flex;align-items:center;justify-content:center;color:#fff;font-size:9px;font-weight:700">${assignee?.avatar||'?'}</div>
                ${assignee?.name||'-'}
              </div>
            </td>
            <td><span class="priority-badge priority-${t.priority}">${WS.getPriorityLabel(t.priority)}</span></td>
            <td><span class="status-badge status-${t.status}">${WS.getStatusLabel(t.status)}</span></td>
            <td>
              <div class="progress-wrap">
                <div class="progress-bar"><div class="progress-fill ${fillCls}" style="width:${t.progress}%"></div></div>
                <span class="progress-label">${t.progress}%</span>
              </div>
            </td>
            <td>${t.dueDate}</td>
          </tr>`;
          }).join('')}</tbody>
      </table>
    </div>`).join('') || '<div class="empty-state">해당 상태의 업무가 없습니다.</div>';
  refreshIcons();
}

/* ?€?€ 일정蹂닿린 ?섏씠吏€ ?€?€ */
/* ── 일정보기 (Gantt 그리드) ── */
/* ━━ 일정보기 함수들은 modules/schedule.js 로 이동됨 ━━ */

function renderPage_StaffMgmt() {
  const el = document.getElementById('staffListArea');
  if(!el) return;
  
  const users = WS.users;
  const rows = users.map(u => {
    return `<tr>
      <td style="width:180px">
        <div style="display:flex;align-items:center;gap:10px">
          <div class="avatar" style="width:36px;height:36px;background:linear-gradient(135deg,${u.color},#9747ff);color:#fff;font-size:13px;font-weight:800;border-radius:50%;display:flex;align-items:center;justify-content:center">${u.avatar}</div>
          <div>
            <div style="font-weight:700;font-size:13.5px">${u.name}</div>
            <div style="font-size:11px;color:var(--text-muted)">${u.dept}</div>
          </div>
        </div>
      </td>
      <td><div style="font-size:13px;font-weight:600">${u.role}</div></td>
      <td><div style="font-size:13px;font-weight:500;color:var(--accent-blue)">${u.pos || '-'}</div></td>
      <td><div style="font-size:12.5px">${u.phone || '-'}</div></td>
      <td><div style="font-size:12px;color:var(--text-secondary);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${u.address||''}">${u.address || '-'}</div></td>
      <td>${renderStaffStatusBadge(u.status)}</td>
      <td style="width:100px">
        <div class="manage-actions">
          <button class="btn-icon-sm edit" onclick="openStaffModal(${u.id})" title="상세/수정"><i data-lucide="edit-3" class="icon-sm"></i></button>
          <button class="btn-icon-sm delete" onclick="deleteStaff(${u.id})" title="삭제"><i data-lucide="trash-2" class="icon-sm"></i></button>
        </div>
      </td>
    </tr>`;
  }).join('');

  el.innerHTML = `<table class="task-table">
    <thead>
      <tr>
        <th>이름</th>
        <th>직급</th>
        <th>직책</th>
        <th>전화번호</th>
        <th>주소</th>
        <th>상태</th>
        <th>관리</th>
      </tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="7" class="empty-state">등록된 직원이 없습니다.</td></tr>'}</tbody>
  </table>`;
  refreshIcons();
}

function renderStaffStatusBadge(status) {
  if(!status) return '<span class="status-badge status-waiting">미정</span>';
  let type = 'waiting';
  if(status.includes('근무')) type = 'progress';
  if(status.includes('휴직')) type = 'delay';
  if(status === '퇴사') type = 'done';
  
  return `<span class="status-badge status-${type}">${status}</span>`;
}

/* ?? ?ㅼ쟻蹂닿린 ?섏씠吏 ?? */
window._perfPeriod = window._perfPeriod || 'weekly';

function renderPage_Performance() {
  const el = document.getElementById('performanceArea');
  if (!el) return;
  const now = new Date();
  const period = window._perfPeriod || 'weekly';

  function inPeriod(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (period === 'weekly') {
      const ws = new Date(now); ws.setDate(now.getDate() - now.getDay()); ws.setHours(0,0,0,0);
      return d >= ws;
    } else if (period === 'monthly') {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    } else {
      return d.getFullYear() === now.getFullYear();
    }
  }

  const stats = WS.users.map(u => {
    const myTasks = WS.tasks.filter(t => {
      const ids = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
      return ids.includes(u.id);
    });
    const pTasks = myTasks.filter(t => inPeriod(t.dueDate) || inPeriod(t.createdAt));
    const all = pTasks.length > 0 ? pTasks : myTasks;
    const total = all.length;
    const done  = all.filter(t => t.status === 'done').length;
    const delay = all.filter(t => t.status === 'delay').length;
    const prog  = all.filter(t => t.status === 'progress').length;
    const rate  = total > 0 ? Math.round(done / total * 100) : 0;
    const avgP  = total > 0 ? Math.round(all.reduce((a,t) => a + (t.progress||0), 0) / total) : 0;
    return { u, total, done, delay, prog, rate, avgP };
  });

  stats.sort((a, b) => b.rate - a.rate || b.done - a.done);
  const medals = ['🥇','🥈','🥉'];
  const pLabel = { weekly:'주간', monthly:'월간', yearly:'연간' };

  const rows = stats.map((s, idx) => {
    const rank = idx + 1;
    const rc = s.rate >= 80 ? '#22c55e' : s.rate >= 50 ? '#f59e0b' : '#ef4444';
    const medal = rank <= 3
      ? `<span style="font-size:17px">${medals[rank-1]}</span>`
      : `<span style="font-size:13px;font-weight:800;color:var(--text-muted)">${rank}위</span>`;
    const rowBg = rank===1?'rgba(245,158,11,.07)':rank===2?'rgba(156,163,175,.05)':rank===3?'rgba(180,83,9,.05)':'';
    return `<tr style="border-bottom:1px solid var(--border-color);background:${rowBg};transition:background .2s" onmouseover="this.style.background='var(--bg-tertiary)'" onmouseout="this.style.background='${rowBg}'">
      <td style="padding:11px 14px;text-align:center;width:60px">${medal}</td>
      <td style="padding:11px 14px;white-space:nowrap">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,${s.u.color},#9747ff);display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:800;flex-shrink:0">${s.u.avatar}</div>
          <div><div style="font-size:13px;font-weight:700">${s.u.name}</div><div style="font-size:11px;color:var(--text-muted)">${s.u.role} · ${s.u.dept}</div></div>
        </div>
      </td>
      <td style="padding:11px 14px;min-width:140px">
        <div style="display:flex;align-items:center;gap:7px">
          <div style="flex:1;height:7px;background:var(--border-color);border-radius:100px;overflow:hidden"><div style="width:${s.rate}%;height:100%;background:${rc};border-radius:100px;transition:width .5s"></div></div>
          <span style="font-size:13px;font-weight:800;color:${rc};min-width:34px;text-align:right">${s.rate}%</span>
        </div>
        <div style="font-size:10px;color:var(--text-muted);margin-top:2px">달성률</div>
      </td>
      <td style="padding:11px 14px;text-align:center"><div style="font-size:15px;font-weight:800;color:#4f6ef7">${s.total}</div><div style="font-size:10px;color:var(--text-muted)">전체</div></td>
      <td style="padding:11px 14px;text-align:center"><div style="font-size:15px;font-weight:800;color:#22c55e">${s.done}</div><div style="font-size:10px;color:var(--text-muted)">완료</div></td>
      <td style="padding:11px 14px;text-align:center"><div style="font-size:15px;font-weight:800;color:#06b6d4">${s.prog}</div><div style="font-size:10px;color:var(--text-muted)">진행중</div></td>
      <td style="padding:11px 14px;text-align:center"><div style="font-size:15px;font-weight:800;color:#ef4444">${s.delay}</div><div style="font-size:10px;color:var(--text-muted)">지연</div></td>
      <td style="padding:11px 14px;text-align:center"><div style="font-size:15px;font-weight:800;color:var(--text-primary)">${s.avgP}%</div><div style="font-size:10px;color:var(--text-muted)">평균진행률</div></td>
    </tr>`;
  }).join('');

  const switchBtns = ['weekly','monthly','yearly'].map(p => {
    const active = period === p;
    return `<button onclick="window._perfPeriod='${p}';renderPage_Performance()" style="padding:6px 16px;border-radius:7px;border:none;font-size:12px;font-weight:700;cursor:pointer;transition:all .2s;${active?'background:var(--accent-blue);color:#fff;box-shadow:0 2px 8px rgba(79,110,247,.3)':'background:transparent;color:var(--text-secondary)'}"><span style="pointer-events:none">${p==='weekly'?'주간':p==='monthly'?'월간':'연간'}</span></button>`;
  }).join('');

  el.innerHTML = `
    <div class="section-card" style="padding:0;overflow:hidden">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--border-color)">
        <div style="display:flex;align-items:center;gap:10px">
          <i data-lucide="bar-chart-3" style="width:20px;height:20px;color:var(--accent-blue)"></i>
          <span style="font-size:16px;font-weight:800">팀원별 업무 달성 현황</span>
          <span style="font-size:12px;color:var(--text-muted);background:var(--bg-tertiary);padding:2px 10px;border-radius:20px">${pLabel[period]} 기준</span>
        </div>
        <div style="display:flex;gap:4px;background:var(--bg-tertiary);padding:4px;border-radius:10px">${switchBtns}</div>
      </div>
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:var(--bg-secondary)">
            <th style="padding:10px 14px;font-size:11px;font-weight:700;color:var(--text-muted);text-align:center;width:60px">순위</th>
            <th style="padding:10px 14px;font-size:11px;font-weight:700;color:var(--text-muted);text-align:left">직원</th>
            <th style="padding:10px 14px;font-size:11px;font-weight:700;color:var(--text-muted);text-align:left;min-width:140px">달성률</th>
            <th style="padding:10px 14px;font-size:11px;font-weight:700;color:var(--text-muted);text-align:center">전체</th>
            <th style="padding:10px 14px;font-size:11px;font-weight:700;color:var(--text-muted);text-align:center">완료</th>
            <th style="padding:10px 14px;font-size:11px;font-weight:700;color:var(--text-muted);text-align:center">진행중</th>
            <th style="padding:10px 14px;font-size:11px;font-weight:700;color:var(--text-muted);text-align:center">지연</th>
            <th style="padding:10px 14px;font-size:11px;font-weight:700;color:var(--text-muted);text-align:center">평균진행률</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
  refreshIcons();
}

/* ?? 媛쒖씤설정 ?섏씠吏 ?? */
/* 서브: 프로필 탭 HTML */
function _buildProfileTab(u) {
  return '<div id="profile-tab" style="padding:20px">'
    + '<div class="form-row">'
    +   '<div class="form-group"><label class="form-label">\uc774\ub984</label><input class="form-input" value="'+u.name+'" readonly></div>'
    +   '<div class="form-group"><label class="form-label">\ubd80\uc11c</label><input class="form-input" value="'+u.dept+'" readonly></div>'
    + '</div>'
    + '<div class="form-row">'
    +   '<div class="form-group"><label class="form-label">\uc9c1\uae09</label><input class="form-input" value="'+u.role+'" readonly></div>'
    +   '<div class="form-group"><label class="form-label">\uc9c1\ucc45</label><input class="form-input" value="'+(u.pos||'-')+'" readonly></div>'
    + '</div>'
    + '<div class="form-row">'
    +   '<div class="form-group"><label class="form-label">\uc774\uba54\uc77c</label><input class="form-input" value="'+u.email+'" readonly></div>'
    +   '<div class="form-group"><label class="form-label">\uc0c1\ud0dc</label><input class="form-input" value="'+u.status+'" readonly></div>'
    + '</div>'
    + '<button class="btn btn-blue" onclick="showToast(\'success\',\'\ud504\ub85c\ud544\uc774 \uc800\uc7a5\ub418\uc5c8\uc2b5\ub2c8\ub2e4.\')">\uc800\uc7a5</button>'
    + '</div>';
}

/* 서브: 알림 탭 HTML */
function _buildNotifTab() {
  var items = [
    {id:'n1',label:'\uc2e0\uaddc \uc5c5\ubb34 \uc9c0\uc2dc \uc54c\ub9bc',desc:'\uc5c5\ubb34\ub97c \ud560\ub2f9\ubc1b\uc73c\uba74 \uc989\uc2dc \uc54c\ub9bc'},
    {id:'n2',label:'\ub9c8\uac10 D-3 \uc0ac\uc804 \uc54c\ub9bc',desc:'\ub9c8\uac10 3\uc77c \uc804 \uc790\ub3d9 \uc54c\ub9bc'},
    {id:'n3',label:'\uc0c1\ud0dc \ubcc0\uacbd \uc54c\ub9bc',desc:'\ub2f4\ub2f9 \uc5c5\ubb34 \uc0c1\ud0dc \ubcc0\uacbd \uc2dc \uc54c\ub9bc'},
    {id:'n4',label:'\uc9c0\uc2dc \uacb0\uacfc \uc54c\ub9bc',desc:'\uc5c5\ubb34 \uc9c0\uc2dc \uc644\ub8cc \ud6c4 \uc989\uc2dc \uc54c\ub9bc'},
    {id:'n5',label:'\uc644\ub8cc \ubcf4\uace0 \uc54c\ub9bc',desc:'\uc9c0\uc2dc\ud55c \uc5c5\ubb34\uac00 \uc644\ub8cc\ub418\uba74 \uc54c\ub9bc'}
  ];
  return '<div id="notif-tab" style="padding:20px;display:none">'
    + items.map(function(n){
        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border-color)">'
          + '<div>'
          +   '<div style="font-size:13px;font-weight:600">'+n.label+'</div>'
          +   '<div style="font-size:11.5px;color:var(--text-muted)">'+n.desc+'</div>'
          + '</div>'
          + '<label style="position:relative;display:inline-block;width:42px;height:24px;cursor:pointer">'
          +   '<input type="checkbox" checked style="display:none" id="'+n.id+'" onchange="showToast(\'info\',\'\uc54c\ub9bc \uc124\uc815\uc774 \ubcc0\uacbd\ub418\uc5c8\uc2b5\ub2c8\ub2e4.\')">'
          +   '<span style="position:absolute;inset:0;background:#4f6ef7;border-radius:12px;transition:.3s;display:flex;align-items:center;padding:2px">'
          +     '<span id="'+n.id+'_knob" style="width:20px;height:20px;background:#fff;border-radius:50%;margin-left:auto"></span>'
          +   '</span>'
          + '</label>'
          + '</div>';
      }).join('')
    + '<button class="btn btn-blue" style="margin-top:16px" onclick="showToast(\'success\',\'\uc54c\ub9bc \uc124\uc815\uc774 \uc800\uc7a5\ub418\uc5c8\uc2b5\ub2c8\ub2e4.\')">\uc124\uc815 \uc800\uc7a5</button>'
    + '</div>';
}

/* 서브: 테마 탭 HTML */
function _buildThemeTab() {
  var accentHtml = WS.accents.map(function(c){
    return '<div class="accent-chip-wrapper">'
      + '<div class="accent-chip '+(WS.currentAccent===c?'active':'')+'" style="background:'+c+'" onclick="applyAccent(\''+c+'\')"></div>'
      + '<div class="accent-delete-btn" onclick="deleteAccent(\''+c+'\', event)">\xd7</div>'
      + '</div>';
  }).join('');

  var radiusPresets = [
    {key:'sharp', label:'\uc9c1\uac01',   px:'0px',   sm:0,  md:0,  lg:0,  xl:0   },
    {key:'slight',label:'\uc57d\uac04',   px:'4px',   sm:3,  md:4,  lg:6,  xl:8   },
    {key:'normal',label:'\ubcf4\ud1b5',   px:'8px',   sm:6,  md:10, lg:16, xl:20  },
    {key:'round', label:'\ub465\uadfc\uac8c',px:'16px',sm:10, md:16, lg:22, xl:28  },
    {key:'pill',  label:'Pill',        px:'999px',sm:20, md:30, lg:40, xl:999 }
  ];
  var savedR = localStorage.getItem('ws_border_radius');
  var curKey = savedR ? JSON.parse(savedR).key : 'normal';
  var radiusHtml = radiusPresets.map(function(opt){
    var isActive = curKey === opt.key;
    var bw  = isActive ? '2px' : '1.5px';
    var bc  = isActive ? 'var(--accent-blue)' : 'var(--border-color)';
    var bg  = isActive ? 'var(--accent-blue-light)' : 'var(--bg-secondary)';
    var pr  = opt.key === 'pill' ? '999px' : opt.md + 'px';
    var cls = isActive ? ' class="radius-active"' : '';
    return '<div onclick="applyBorderRadius(\''+opt.key+'\','+opt.sm+','+opt.md+','+opt.lg+','+opt.xl+')"'
      +cls+' style="flex:1;min-width:64px;display:flex;flex-direction:column;align-items:center;gap:8px;'
      +'padding:12px 6px;border-radius:10px;border:'+bw+' solid '+bc+';background:'+bg+';'
      +'cursor:pointer;transition:var(--transition)"'
      +' onmouseover="if(!this.classList.contains(\'radius-active\'))this.style.borderColor=\'var(--accent-blue)\'"'
      +' onmouseout="if(!this.classList.contains(\'radius-active\'))this.style.borderColor=\'var(--border-color)\'">'
      +'<div style="width:36px;height:36px;border:'+(isActive?'2':'1.5')+'px solid '+(isActive?'var(--accent-blue)':'var(--border-color)')+';'
      +'background:var(--bg-primary);border-radius:'+pr+'"></div>'
      +'<div style="text-align:center">'
      +'<div style="font-size:12px;font-weight:700;color:var(--text-primary)">'+opt.label+'</div>'
      +'<div style="font-size:10px;color:var(--text-muted);margin-top:1px">('+opt.px+')</div>'
      +'</div></div>';
  }).join('');

  return '<div id="theme-tab" style="padding:20px;display:none">'
    + '<div style="font-size:13px;font-weight:600;margin-bottom:14px">UI \ud14c\ub9c8 \uc120\ud0dd</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px">'
    +   '<div onclick="applyTheme(\'light\');showToast(\'info\',\'\ub77c\uc774\ud2b8 \ubaa8\ub4dc\ub85c \ubcc0\uacbd\ub428\')" style="padding:20px;border-radius:12px;border:2px solid var(--border-color);cursor:pointer;background:#f0f2f7;transition:var(--transition)" onmouseover="this.style.borderColor=\'#4f6ef7\'" onmouseout="this.style.borderColor=\'var(--border-color)\'">'
    +     '<div style="width:32px;height:32px;border-radius:50%;background:rgba(245,158,11,.2);display:flex;align-items:center;justify-content:center;margin-bottom:8px;color:#f59e0b"><i data-lucide="sun" style="width:20px;height:20px"></i></div>'
    +     '<div style="font-size:13px;font-weight:700;color:#1a1d2e">\ub77c\uc774\ud2b8 \ubaa8\ub4dc</div>'
    +     '<div style="font-size:11.5px;color:#5a6072">\ubc1d\uace0 \uae54\ub054\ud55c \ud14c\ub9c8</div>'
    +   '</div>'
    +   '<div onclick="applyTheme(\'dark\');showToast(\'info\',\'\ub2e4\ud06c \ubaa8\ub4dc\ub85c \ubcc0\uacbd\ub428\')" style="padding:20px;border-radius:12px;border:2px solid var(--border-color);cursor:pointer;background:#252840;transition:var(--transition)" onmouseover="this.style.borderColor=\'#4f6ef7\'" onmouseout="this.style.borderColor=\'var(--border-color)\'">'
    +     '<div style="width:32px;height:32px;border-radius:50%;background:rgba(151,71,255,.25);display:flex;align-items:center;justify-content:center;margin-bottom:8px;color:#9747ff"><i data-lucide="moon" style="width:20px;height:20px"></i></div>'
    +     '<div style="font-size:13px;font-weight:700;color:#e8eaf0">\ub2e4\ud06c \ubaa8\ub4dc</div>'
    +     '<div style="font-size:11.5px;color:#8b93a8">\ub208\uc774 \ud3b8\ud55c \uc5b4\ub450\uc6b4 \ud14c\ub9c8</div>'
    +   '</div>'
    + '</div>'
    + '<div style="background:var(--bg-tertiary);border-radius:var(--radius-md);padding:14px">'
    +   '<div style="font-size:12px;font-weight:600;color:var(--text-secondary);margin-bottom:12px">\uac15\uc870\uc0c9 \uc124\uc815</div>'
    +   '<div class="accent-list" id="accentList">'
    +     accentHtml
    +     '<button class="btn-add-accent" onclick="triggerAddAccent()" title="\uc0c8 \uac15\uc870\uc0c9 \ucd94\uac00">+</button>'
    +     '<input type="color" id="accentColorPicker" onchange="addAccentFromPicker(this.value)">'
    +   '</div>'
    +   '<div style="font-size:10.5px;color:var(--text-muted);margin-top:10px">\uc0c9\uc0c1\uc5d0 \ub9c8\uc6b0\uc2a4\ub97c \uc62c\ub824 \uc0ad\uc81c\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4.</div>'
    + '</div>'
    + '<div style="background:var(--bg-tertiary);border-radius:var(--radius-md);padding:14px;margin-top:14px">'
    +   '<div style="display:flex;align-items:center;gap:7px;font-size:12px;font-weight:600;color:var(--text-secondary);margin-bottom:14px">'
    +     '<i data-lucide="square-dashed" style="width:14px;height:14px;color:var(--accent-blue)"></i>'
    +     '\ubaa8\uc11c\ub9ac \uacf3\ub960 (Border Radius)'
    +   '</div>'
    +   '<div style="display:flex;gap:10px;flex-wrap:wrap" id="radiusPickerRow">'+radiusHtml+'</div>'
    + '</div>'
    + '</div>';
}

function renderPage_Profile() {
  var el = document.getElementById('profileArea');
  if (!el) return;
  var u = WS.currentUser || WS.users[0];

  // 내 업무 통계
  var myTasks = WS.tasks.filter(function(t){
    var ids = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
    return ids.includes(u.id);
  });
  var doneCnt  = myTasks.filter(function(t){ return t.status==='done'; }).length;
  var instrCnt = WS.tasks.filter(function(t){ return t.assignerId===u.id; }).length;

  el.innerHTML =
    '<div style="display:grid;grid-template-columns:320px minmax(0,1fr);gap:16px">'
    + '<div class="section-card" style="padding:24px;align-items:center;text-align:center">'
    +   '<div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,'+u.color+',#9747ff);display:flex;align-items:center;justify-content:center;color:#fff;font-size:28px;font-weight:800;margin:0 auto 14px">'+u.avatar+'</div>'
    +   '<div style="font-size:18px;font-weight:800;margin-bottom:4px">'+u.name+'</div>'
    +   '<div style="font-size:13px;color:var(--text-secondary);margin-bottom:4px">'+u.dept+' \xb7 '+u.role+(u.pos?' | '+u.pos:'')+'</div>'
    +   '<div style="font-size:12px;color:var(--text-muted);margin-bottom:20px">'+u.email+'</div>'
    +   '<div style="display:flex;gap:8px;justify-content:center;margin-bottom:16px">'
    +     '<div style="text-align:center"><div style="font-size:18px;font-weight:800;color:var(--accent-blue)">'+myTasks.length+'</div><div style="font-size:11px;color:var(--text-muted)">\ub2f4\ub2f9 \uc5c5\ubb34</div></div>'
    +     '<div style="width:1px;background:var(--border-color);margin:0 8px"></div>'
    +     '<div style="text-align:center"><div style="font-size:18px;font-weight:800;color:#22c55e">'+doneCnt+'</div><div style="font-size:11px;color:var(--text-muted)">\uc644\ub8cc</div></div>'
    +     '<div style="width:1px;background:var(--border-color);margin:0 8px"></div>'
    +     '<div style="text-align:center"><div style="font-size:18px;font-weight:800;color:#4f6ef7">'+instrCnt+'</div><div style="font-size:11px;color:var(--text-muted)">\uc9c0\uc2dc</div></div>'
    +   '</div>'
    +   '<button class="btn btn-blue" style="width:100%" onclick="logout()"><i data-lucide="log-out" class="icon-sm"></i> \ub85c\uadf8\uc544\uc6c3</button>'
    + '</div>'
    + '<div class="section-card" style="min-width:0;overflow-x:hidden">'
    +   '<div class="tab-bar">'
    +     '<div class="tab-item active" onclick="switchProfileTab(\'profile-tab\',this)">\ud504\ub85c\ud544 \uc124\uc815</div>'
    +     '<div class="tab-item" onclick="switchProfileTab(\'notif-tab\',this)">\uc54c\ub9bc \uc124\uc815</div>'
    +     '<div class="tab-item" onclick="switchProfileTab(\'theme-tab\',this)">UI \ud14c\ub9c8</div>'
    +   '</div>'
    +   _buildProfileTab(u)
    +   _buildNotifTab()
    +   _buildThemeTab()
    + '</div>'
    + '</div>';
  setTimeout(refreshIcons, 50);
}

/* ── 모서리 곡률 선택기 렌더링 ── */
function renderRadiusPicker() {
  const row = document.getElementById('radiusPickerRow');
  if (!row) return;
  const presets = [
    { key:'sharp',  label:'직각',   px:'0px',   sm:0,  md:0,  lg:0,  xl:0   },
    { key:'slight', label:'약간',   px:'4px',   sm:3,  md:4,  lg:6,  xl:8   },
    { key:'normal', label:'보통',   px:'8px',   sm:6,  md:10, lg:16, xl:20  },
    { key:'round',  label:'둥글게', px:'16px',  sm:10, md:16, lg:22, xl:28  },
    { key:'pill',   label:'Pill',   px:'999px', sm:20, md:30, lg:40, xl:999 }
  ];
  const saved = localStorage.getItem('ws_border_radius');
  const curKey = saved ? JSON.parse(saved).key : 'normal';
  row.innerHTML = presets.map(function(opt) {
    const isActive = curKey === opt.key;
    const bw  = isActive ? '2px'                  : '1.5px';
    const bc  = isActive ? 'var(--accent-blue)'   : 'var(--border-color)';
    const bg  = isActive ? 'var(--accent-blue-light)' : 'var(--bg-secondary)';
    const previewR = opt.key === 'pill' ? '999px' : opt.md + 'px';
    const boxB = isActive ? 'var(--accent-blue)' : 'var(--border-color)';
    return '<div onclick="applyBorderRadius(\'' + opt.key + '\',' + opt.sm + ',' + opt.md + ',' + opt.lg + ',' + opt.xl + ')"'
      + ' style="flex:1;min-width:64px;display:flex;flex-direction:column;align-items:center;gap:8px;'
      + 'padding:12px 6px;border-radius:10px;border:' + bw + ' solid ' + bc + ';background:' + bg + ';'
      + 'cursor:pointer;transition:var(--transition)"'
      + ' onmouseover="if(!this.classList.contains(\'radius-active\'))this.style.borderColor=\'var(--accent-blue)\'"'
      + ' onmouseout="if(!this.classList.contains(\'radius-active\'))this.style.borderColor=\'var(--border-color)\'"'
      + (isActive ? ' class="radius-active"' : '') + '>'
      + '<div style="width:36px;height:36px;border:' + (isActive?'2':'1.5') + 'px solid ' + boxB + ';'
      + 'background:var(--bg-primary);border-radius:' + previewR + '"></div>'
      + '<div style="text-align:center">'
      + '<div style="font-size:12px;font-weight:700;color:var(--text-primary)">' + opt.label + '</div>'
      + '<div style="font-size:10px;color:var(--text-muted);margin-top:1px">(' + opt.px + ')</div>'
      + '</div>'
      + '</div>';
  }).join('');
  if (window.lucide) lucide.createIcons();
}

/* ── 모서리 곡률 적용 함수 ── */
function applyBorderRadius(key, sm, md, lg, xl) {
  const root = document.documentElement;
  root.style.setProperty('--radius-sm', sm + 'px');
  root.style.setProperty('--radius-md', md + 'px');
  root.style.setProperty('--radius-lg', lg + 'px');
  root.style.setProperty('--radius-xl', xl + 'px');
  // localStorage 저장
  localStorage.setItem('ws_border_radius', JSON.stringify({ key: key, sm: sm+'px', md: md+'px', lg: lg+'px', xl: xl+'px' }));
  // 선택기 UI 갱신
  renderRadiusPicker();
  showToast('success', '모서리 곡률이 <b>' + { sharp:'직각', slight:'약간', normal:'보통', round:'둥글게', pill:'Pill' }[key] + '</b>으로 변경되었습니다.');
}

// switchTab ?꾩뿭 ?몄텧 (?ㅻ뜑 프로필초기화?먯꽌 ?몄텧)
function switchTab(tabId) {
  showPage('profile', document.querySelector('[data-page=profile]'));
  setTimeout(()=>{
    const tab = document.querySelector(`[onclick*="${tabId}"]`);
    if(tab) tab.click();
  },100);
}

/* ??? 媛뺤“??愿???⑥닔 ??? */
function deleteAccent(color, e) {
  e.stopPropagation();
  // 湲곕낯 커스텀? 삭제 遺덇?
  const defaults = ['#4f6ef7'];
  if (defaults.includes(color)) { showToast('warn', '기본 강조색은 삭제할 수 없습니다.'); return; }
  WS.accents = WS.accents.filter(c => c !== color);
  WS.saveAccents();
  if (WS.currentAccent === color) applyAccent('#4f6ef7');
  // 移?紐⑸줉 ?덈줈怨좎묠
  renderAccentList();
  showToast('info', '<i data-lucide="trash-2"></i> 강조색이 삭제되었습니다.');
}

var _cpHue = 200, _cpColor = '#4f6ef7';

function cpDraw() {
  const canvas = document.getElementById('cpCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.fillStyle = `hsl(${_cpHue},100%,50%)`;
  ctx.fillRect(0, 0, w, h);
  const wg = ctx.createLinearGradient(0,0,w,0);
  wg.addColorStop(0,'rgba(255,255,255,1)'); wg.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle = wg; ctx.fillRect(0,0,w,h);
  const bg = ctx.createLinearGradient(0,0,0,h);
  bg.addColorStop(0,'rgba(0,0,0,0)'); bg.addColorStop(1,'rgba(0,0,0,1)');
  ctx.fillStyle = bg; ctx.fillRect(0,0,w,h);
}

function cpUpdateHue(val) { _cpHue = parseInt(val); cpDraw(); }

function cpPickColor(e) {
  const canvas = document.getElementById('cpCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const r = canvas.getBoundingClientRect();
  const sx = canvas.width / r.width, sy = canvas.height / r.height;
  const x = Math.max(0, Math.min(canvas.width-1, Math.floor((e.clientX-r.left)*sx)));
  const y = Math.max(0, Math.min(canvas.height-1, Math.floor((e.clientY-r.top)*sy)));
  const d = ctx.getImageData(x, y, 1, 1).data;
  _cpColor = '#' + [d[0],d[1],d[2]].map(v=>v.toString(16).padStart(2,'0')).join('');
  const prev = document.getElementById('cpPreview');
  if (prev) prev.style.background = _cpColor;
}

function cpAddColor(e) {
  cpPickColor(e);
  addAccentFromPicker(_cpColor);
  const panel = document.getElementById('colorPickerPanel');
  if (panel) panel.style.display = 'none';
}

function previewAccentColor(v) { _cpColor = v; const p = document.getElementById('cpPreview'); if(p) p.style.background = v; }
function addAccentFromPicker(value) {
  if (!value || WS.accents.includes(value)) return;
  WS.accents.push(value);
  WS.saveAccents();
  renderAccentList();
  applyAccent(value);
}

function renderAccentList() {
  const list = document.getElementById('accentList');
  if (!list) return;
  list.innerHTML = WS.accents.map(c => `
    <div class="accent-chip-wrapper">
      <div class="accent-chip ${WS.currentAccent===c?'active':''}" 
           style="background:${c}" 
           data-color="${c}"
           onclick="applyAccent('${c}')"></div>
      <div class="accent-delete-btn" onclick="deleteAccent('${c}', event)">×</div>
    </div>`).join('');
  list.insertAdjacentHTML('beforeend', `
    <button class="btn-add-accent" id="accentAddBtn" onclick="triggerAddAccent()" title="강조색 추가">+</button><div id="colorPickerPanel" style="display:none;flex-basis:100%;background:var(--bg-card);border:1px solid var(--border-color);border-radius:14px;padding:12px;box-shadow:0 8px 32px rgba(0,0,0,0.2);margin-top:8px;max-width:220px"><canvas id="cpCanvas" width="186" height="130" style="border-radius:8px;cursor:crosshair;display:block;margin-bottom:8px;width:100%" onclick="cpPickColor(event)" ondblclick="cpAddColor(event)"></canvas><input type="range" id="cpHue" min="0" max="360" value="200" style="width:100%;margin-bottom:8px" oninput="cpUpdateHue(this.value)"><div style="display:flex;align-items:center;gap:8px"><div id="cpPreview" style="width:28px;height:28px;border-radius:50%;background:hsl(200,100%,50%);border:2px solid var(--border-color);flex-shrink:0"></div><span style="font-size:10px;color:var(--text-muted)">클릭: 선택 | 더블클릭: 추가</span></div></div>`);
}


/* ??? 議곗쭅 愿由??섏씠吏 (遺??吏곴툒/吏곸콉) ??? */
window._currentOrgTab = 'dept';

function switchOrgTab(tab, el) {
  window._currentOrgTab = tab;
  const parent = el.closest('.tab-bar');
  parent.querySelectorAll('.tab-item').forEach(item => item.classList.remove('active'));
  el.classList.add('active');
  renderPage_OrgMgmt();
}

function renderPage_OrgMgmt() {
  const el = document.getElementById('orgMgmtContent');
  if(!el) return;

  const tab = window._currentOrgTab;
  let title = '', desc = '', btnText = '', addFn = '';
  let list = [];

  if(tab === 'dept') {
    title = '遺??紐⑸줉'; desc = '議곗쭅???몃? 遺?쒕? ?뺤쓽?⑸땲??'; btnText = '遺??추가'; addFn = 'addOrgItem("dept")';
    list = WS.departments;
  } else if(tab === 'rank') {
    title = '吏곴툒 紐⑸줉'; desc = '吏곴툒 泥닿퀎? 沅뚰븳 ?덈꺼???뺤쓽?⑸땲??'; btnText = '吏곴툒 추가'; addFn = 'addOrgItem("rank")';
    list = WS.ranks;
  } else {
    title = '吏곸콉 紐⑸줉'; desc = '遺???댁뿉?쒖쓽 援ъ껜?곸씤 ??븷???뺤쓽?⑸땲??'; btnText = '吏곸콉 추가'; addFn = 'addOrgItem("pos")';
    list = WS.positions;
  }

  const items = list.map(item => `
    <div class="section-card" style="display:flex; justify-content:space-between; align-items:center; padding:16px 20px; margin-bottom:12px">
      <div>
        <div style="font-size:14px; font-weight:700; color:var(--text-primary)">${item.name}</div>
        ${tab === 'rank' ? `<div style="font-size:11px; color:var(--text-muted)">?덈꺼: ${item.level}</div>` : ''}
      </div>
      <div class="manage-actions">
        <button class="btn-icon-sm edit" onclick="editOrgItem('${tab}', ${item.id})"><i data-lucide="edit-2"></i></button>
        <button class="btn-icon-sm delete" onclick="deleteOrgItem('${tab}', ${item.id})"><i data-lucide="trash-2"></i></button>
      </div>
    </div>
  `).join('');

  el.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
      <div>
        <h2 style="font-size:16px; font-weight:800">${title}</h2>
        <p style="font-size:12px; color:var(--text-muted)">${desc}</p>
      </div>
      <button class="btn btn-blue" onclick="${addFn}"><i data-lucide="plus"></i> ${btnText}</button>
    </div>
    <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap:16px">
      ${items || '<div class="empty-state">?곗씠?곌? 없습니다.</div>'}
    </div>
  `;
  refreshIcons();
}

function addOrgItem(type) {
  const name = prompt(`${type === 'dept' ? '부서' : type === 'rank' ? '직급' : '직책'} 이름을 입력하세요.`);
  if(!name) return;
  if(type === 'dept') WS.addDept(name);
  else if(type === 'rank') {
    const lv = prompt('레벨을 입력하세요 (숫자).', '1');
    WS.addRank(name, parseInt(lv) || 1);
  } else WS.addPos(name);
  renderPage_OrgMgmt();
  showToast('success', '추가되었습니다.');
}

/* ?? 吏곸썝 紐낅? 愿由??? */
/* ?? ?ъ쭊 ?낅줈??泥섎━ ?? */
function handleStaffPhotoUpload(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    showToast('warn', '5MB ?댄븯 ?대?吏留??깅줉 媛?ν빀?덈떎.');
    return;
  }
  const reader = new FileReader();
  reader.onload = function(e) {
    const base64 = e.target.result;
    window._staffPhotoBase64 = base64;
    // 誘몃━蹂닿린
    const prev = document.getElementById('st_photo_preview');
    if (prev) {
      prev.style.backgroundImage = `url(${base64})`;
      prev.style.backgroundSize = 'cover';
      prev.style.backgroundPosition = 'center';
      prev.innerHTML = '';
    }
  };
  reader.readAsDataURL(file);
}

/* 사진 팝업 열기 */
function openStaffPhotoPopup() {
  var popup = document.getElementById('staffPhotoPopup');
  if(!popup) return;
  // 팝업 내 미리보기 업데이트
  var sppPrev = document.getElementById('spp_preview');
  if(sppPrev) {
    var currentPhoto = window._staffPhotoBase64 ||
      (window._editingStaffId ? (WS.getUser(window._editingStaffId)?.photo || '') : '');
    if(currentPhoto) {
      sppPrev.style.backgroundImage = 'url(' + currentPhoto + ')';
      sppPrev.style.backgroundSize = 'cover';
      sppPrev.style.backgroundPosition = 'center';
      sppPrev.innerHTML = '';
    } else {
      sppPrev.style.backgroundImage = '';
      sppPrev.innerHTML = '<i data-lucide="user" style="width:40px;height:40px;color:var(--text-muted)"></i>';
      refreshIcons();
    }
  }
  popup.style.display = 'flex';
}

/* 사진 삭제 */
function clearStaffPhoto() {
  window._staffPhotoBase64 = null;
  var prev = document.getElementById('st_photo_preview');
  if(prev) {
    prev.style.backgroundImage = '';
    prev.innerHTML = '<i data-lucide="camera" style="width:18px;height:18px;color:var(--text-muted)"></i><span style="font-size:11px;color:var(--text-muted);font-weight:600">사진 등록</span>';
  }
  var sppPrev = document.getElementById('spp_preview');
  if(sppPrev) {
    sppPrev.style.backgroundImage = '';
    sppPrev.innerHTML = '<i data-lucide="user" style="width:40px;height:40px;color:var(--text-muted)"></i>';
  }
  var fi = document.getElementById('st_photo_file');
  if(fi) fi.value = '';
  closeModalDirect('staffPhotoPopup');
  showToast('info', '사진이 삭제되었습니다.');
  refreshIcons();
}


/* ?? 蹂몄궗?뺣낫 ?섏씠吏 ?? */
function renderPage_HQInfo() {
  const info = WS.hqInfo;
  const container = document.getElementById('hqInfoContent');
  if(!container) return;
  container.innerHTML = `
    <div class="card" style="max-width:800px; margin:20px auto">
      <div class="card-body">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">?뚯궗紐?/label>
            <input type="text" class="form-input" id="hq_name" value="${info.name}">
          </div>
          <div class="form-group">
            <label class="form-label">??쒖옄紐?/label>
            <input type="text" class="form-input" id="hq_ceo" value="${info.ceo}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">?ъ뾽?먮벑濡앸쾲??/label>
            <input type="text" class="form-input" id="hq_businessNum" value="${info.businessNum}">
          </div>
          <div class="form-group">
            <label class="form-label">??쒖쟾??/label>
            <input type="text" class="form-input" id="hq_phone" value="${info.phone}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">?대찓??/label>
          <input type="email" class="form-input" id="hq_email" value="${info.email}">
        </div>
        <div class="form-group">
          <label class="form-label">蹂몄궗 二쇱냼</label>
          <input type="text" class="form-input" id="hq_address" value="${info.address}">
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">濡쒓퀬 ?띿뒪??(?ъ씠?쒕컮 ?쒖떆)</label>
          <input type="text" class="form-input" id="hq_logoText" value="${info.logoText}">
        </div>
      </div>
    </div>
  `;
}

function saveHQInfo() {
  WS.hqInfo = {
    name: document.getElementById('hq_name').value,
    ceo: document.getElementById('hq_ceo').value,
    businessNum: document.getElementById('hq_businessNum').value,
    phone: document.getElementById('hq_phone').value,
    email: document.getElementById('hq_email').value,
    address: document.getElementById('hq_address').value,
    logoText: document.getElementById('hq_logoText').value,
  };
  WS.saveHQInfo();
  showToast('success', '<i data-lucide="check-circle"></i> 蹂몄궗 ?뺣낫媛 ??λ릺됩니다.');
  // 濡쒓퀬 ?띿뒪???ㅼ떆媛?반영
  document.querySelector('.logo-text').textContent = WS.hqInfo.logoText;
}

/* ?? 吏곴툒愿由??섏씠吏 ?? */
/* ── 기타설정 페이지 렌더 (부서/직급/직책/업무결과) ── */
/* --- 구 함수 (호환성 유지) --- */
function addRank() { openOrgModal('rank'); }
function deleteRank(id) { deleteOrgItem('rank', id); }


/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧
   異쒗눜洹?위젯
?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧 */
let _attClockTimer = null;



/* ════════════════════════════════════════════════
   📋 일일보고 모달
════════════════════════════════════════════════ */
let _drLiveTimer = null;

function closeDailyReportModal() {
  const modal = document.getElementById('dailyReportModal');
  if (modal) modal.style.display = 'none';
  if (_drLiveTimer) { clearInterval(_drLiveTimer); _drLiveTimer = null; }
}

function renderDailyReportTasks() {
  const me = WS.currentUser;
  const myTasks = WS.tasks.filter(t => {
    const ids = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
    return ids.includes(me.id);
  });

  const countEl = document.getElementById('dr_task_count');
  if (countEl) countEl.textContent = myTasks.length + '\uac74';

  const tbody = document.getElementById('dr_task_list');
  if (!tbody) return;

  if (myTasks.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:30px;color:var(--text-muted)">' +
      '<i data-lucide="inbox" style="width:28px;height:28px;margin-bottom:8px;display:block;margin-inline:auto"></i>' +
      '\uae08\uc77c \ub2f4\ub2f9 \uc5c5\ubb34\uac00 \uc5c6\uc2b5\ub2c8\ub2e4</td></tr>';
    refreshIcons();
    return;
  }

  tbody.innerHTML = myTasks.map(function(t) {
    var assigner = WS.getUser(t.assignerId);
    var isMySchedule = !t.assignerId || String(t.assignerId) === String(me.id) || t.source === 'schedule';
    var assignerLabel = isMySchedule
      ? '<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 6px;border-radius:10px;background:rgba(99,102,241,.12);border:1px solid rgba(99,102,241,.3);font-size:10px;font-weight:700;color:#6366f1"><i data-lucide="calendar" style="width:9px;height:9px"></i>\uc2a4\ucf00\uc904</span>'
      : (assigner ? assigner.name : '-');
    var ids = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
    var collaborators = ids.filter(function(id){ return String(id) !== String(me.id); }).map(function(i){ var u=WS.getUser(i); return u?u.name:null; }).filter(Boolean);
    var dd = WS.getDdayBadge(t.dueDate);
    var reportBadge = t.drReported
      ? '<span onclick="drToggleReport(' + t.id + ')" title="\ud074\ub9ad\ud558\uc5ec \ucde8\uc18c" style="display:inline-flex;align-items:center;gap:3px;padding:3px 9px;border-radius:12px;background:#22c55e;color:#fff;font-size:10.5px;font-weight:800;cursor:pointer" onmouseover="this.style.opacity=\'.7\'" onmouseout="this.style.opacity=\'1\'"><i data-lucide="check" style="width:9px;height:9px"></i>OK</span>'
      : '<span onclick="drToggleReport(' + t.id + ')" title="\ud074\ub9ad\ud558\uc5ec \ubcf4\uace0" style="display:inline-flex;align-items:center;gap:3px;padding:3px 9px;border-radius:12px;background:var(--bg-tertiary);border:1.5px solid var(--border-color);color:var(--text-muted);font-size:10.5px;font-weight:700;cursor:pointer" onmouseover="this.style.borderColor=\'#ef4444\';this.style.color=\'#ef4444\'" onmouseout="this.style.borderColor=\'var(--border-color)\';this.style.color=\'var(--text-muted)\'"><i data-lucide="x" style="width:9px;height:9px"></i>NO</span>';
    return '<tr>' +
      '<td style="font-weight:600">' + (t.isImportant ? '\u2b50' : '') + t.title + '</td>' +
      '<td style="font-size:11px">' + assignerLabel + '</td>' +
      '<td style="font-size:11px">' + (collaborators.join(', ') || '-') + '</td>' +
      '<td style="font-size:11px">' + (t.startDate || '-') + '</td>' +
      '<td><span class="dday-badge ' + dd.cls + '" style="font-size:10px">' + dd.label + '</span></td>' +
      '<td><div class="progress-wrap" style="min-width:80px"><div class="progress-bar"><div class="progress-fill" style="width:' + (t.progress||0) + '%"></div></div><span class="progress-label">' + (t.progress||0) + '%</span></div></td>' +
      '<td><span class="status-badge status-' + t.status + '">' + WS.getStatusLabel(t.status) + '</span></td>' +
      '<td style="text-align:center">' + (t.isImportant ? '\u2b50' : '-') + '</td>' +
      '<td style="text-align:center">' + reportBadge + '</td>' +
      '</tr>';
  }).join('');
  refreshIcons();
}

function drToggleReport(taskId) {
  const t = WS.getTask(taskId);
  if (!t) return;
  t.drReported = !t.drReported;
  WS.saveTasks();
  renderDailyReportTasks();
  showToast('success', t.drReported ? `"${t.title}" 보고 완료 처리` : `"${t.title}" 보고 취소`);
}

function drToggleAllReport() {
  const me = WS.currentUser;
  const myTasks = WS.tasks.filter(t => {
    const ids = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
    return ids.includes(me.id);
  });
  const allReported = myTasks.every(t => t.drReported);
  myTasks.forEach(function(t) { t.drReported = !allReported; });
  WS.saveTasks();
  renderDailyReportTasks();
  showToast('success', allReported ? '\uc77c\uad04 \ubcf4\uace0 \ucde8\uc18c' : '\uc77c\uad04 \ubcf4\uace0 \uc644\ub8cc \uc815\ub9ac');
}

/* ======================================================
   \uD83D\uDCCB \uae08\uc77c \uc5c5\ubb34\uc2e4\ud589 \ubcf4\uace0 CRUD
====================================================== */
var _drExecReports = [];
var _drExecEditId  = null;
var _drExecFiles   = [];
var _drExecImps    = [];
var _drExecStatus  = null;  // 진행상태 (단일 선택)
var _drImpDragState  = { active:false, startX:0, scrollLeft:0 };
var _drStatDragState = { active:false, startX:0, scrollLeft:0 };

function _loadDrExecReports() {
  _drExecReports = JSON.parse(localStorage.getItem('ws_dr_exec_reports') || '[]');
}
function _saveDrExecReports() {
  localStorage.setItem('ws_dr_exec_reports', JSON.stringify(_drExecReports));
}

function drOpenExecForm(editId) {
  _loadDrExecReports();
  _drExecEditId = editId || null;
  _drExecFiles  = [];
  _drExecImps   = [];
  _drExecStatus = null;

  // 상세업무리스트(ws_detail_tasks) 로드
  var detailTasks = JSON.parse(localStorage.getItem('ws_detail_tasks') || '[]');
  var sel = document.getElementById('drExecTaskSel');
  if (sel) {
    sel.innerHTML = '<option value="">상세업무 선택</option>' +
      detailTasks.map(function(d){ return '<option value="' + d.id + '">' + d.name + '</option>'; }).join('');
  }

  _renderDrImpPicks();
  _renderDrStatusPicks();

  if (editId) {
    var rep = _drExecReports.find(function(r){ return r.id === editId; });
    if (rep) {
      if (sel) sel.value = rep.taskId;
      var cont = document.getElementById('drExecContent');
      if (cont) cont.value = rep.content || '';
      _drExecImps   = Array.isArray(rep.importance) ? rep.importance.slice() : (rep.importance ? rep.importance.split(',').map(function(s){return s.trim();}).filter(Boolean) : []);
      _drExecStatus = rep.status || null;
      _renderDrImpPicks();
      _renderDrStatusPicks();
      _renderDrExecFileList(rep.attachments || []);
    }
    document.getElementById('drExecFormTitle').textContent = '업무보고 수정';
  } else {
    var cont2 = document.getElementById('drExecContent');
    if (cont2) cont2.value = '';
    var fl = document.getElementById('drExecFileList');
    if (fl) fl.innerHTML = '';
    document.getElementById('drExecFormTitle').textContent = '업무보고 등록';
  }

  var form = document.getElementById('drExecForm');
  if (form) { form.style.display = 'block'; form.scrollIntoView({ behavior:'smooth', block:'center' }); }
  setTimeout(refreshIcons, 40);
}

function drCloseExecForm() {
  var form = document.getElementById('drExecForm');
  if (form) form.style.display = 'none';
  _drExecEditId = null; _drExecFiles = []; _drExecImps = []; _drExecStatus = null;
  var fi = document.getElementById('drExecFile');
  if (fi) fi.value = '';
}

function drSaveExecReport() {
  var sel  = document.getElementById('drExecTaskSel');
  var cont = document.getElementById('drExecContent');
  if (!sel || !sel.value)          { showToast('error', '업무를 선택하세요'); return; }
  if (!cont || !cont.value.trim()) { showToast('error', '실행내용을 입력하세요'); return; }

  var taskId   = sel.value;
  var taskName = sel.options[sel.selectedIndex].text;
  var content  = cont.value.trim();
  var attachments = _drExecFiles.map(function(f){ return f.name; });
  var importance  = _drExecImps.slice();
  var status      = _drExecStatus || null;
  var score = importance.length * 10 + Math.min(50, Math.round(content.length * 0.2));

  _loadDrExecReports();
  if (_drExecEditId) {
    var rep = _drExecReports.find(function(r){ return r.id === _drExecEditId; });
    if (rep) {
      rep.taskId = taskId; rep.taskName = taskName; rep.content = content;
      if (attachments.length) rep.attachments = attachments;
      rep.importance = importance; rep.status = status; rep.score = score;
    }
    showToast('info', '업무보고 수정 완료');
  } else {
    _drExecReports.push({ id:Date.now(), taskId:taskId, taskName:taskName, content:content, attachments:attachments, importance:importance, status:status, score:score, date:new Date().toISOString().slice(0,10) });
    showToast('success', '업무보고 등록 완료!');
  }
  _saveDrExecReports();
  drCloseExecForm();
  renderDrExecList();
}

function renderDrExecList() {
  _loadDrExecReports();
  var tbody = document.getElementById('dr_exec_list');
  var cntEl = document.getElementById('dr_exec_count');
  if (!tbody) return;
  if (cntEl) cntEl.textContent = _drExecReports.length ? _drExecReports.length + '건' : '';

  if (_drExecReports.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--text-muted)">' +
      '<i data-lucide="inbox" style="width:20px;height:20px;display:block;margin:0 auto 6px;opacity:.4"></i>' +
      '등록된 업무보고가 없습니다</td></tr>';
    refreshIcons();
    return;
  }

  var importances = JSON.parse(localStorage.getItem('ws_instr_importances') || '[]');
  var statuses    = JSON.parse(localStorage.getItem('ws_task_statuses')    || '[]');
  tbody.innerHTML = _drExecReports.map(function(r) {
    var impHtml = (r.importance || []).map(function(name) {
      var imp = importances.find(function(i){ return i.name === name; });
      var c = imp && imp.color ? imp.color : '#6b7280';
      var icon = imp && imp.icon ? imp.icon : '';
      return '<span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:' + c + ';border:1.5px solid ' + c + ';margin-right:2px" title="' + name + '">' +
        (icon ? '<i data-lucide="' + icon + '" style="width:11px;height:11px;color:#fff"></i>' : '') + '</span>';
    }).join('');
    var filesHtml = (r.attachments || []).map(function(f) {
      return '<span style="font-size:10px;color:var(--text-muted);display:flex;align-items:center;gap:3px"><i data-lucide="paperclip" style="width:9px;height:9px"></i>' + f + '</span>';
    }).join('');
    // 진행상태 배지
    var statusBadge = '-';
    if (r.status) {
      var st = statuses.find(function(s){ return s.id === r.status || s.name === r.status; });
      if (st) {
        var sc = st.color || '#06b6d4';
        statusBadge = '<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:12px;background:' + sc + '22;border:1.5px solid ' + sc + ';font-size:10px;font-weight:700;color:' + sc + '">' +
          (st.icon ? '<i data-lucide="' + st.icon + '" style="width:9px;height:9px;color:' + sc + '"></i>' : '') + st.name + '</span>';
      }
    }
    return '<tr>' +
      '<td style="font-weight:600">' + r.taskName + '</td>' +
      '<td style="font-size:11px;color:var(--text-secondary);max-width:180px">' + r.content + '</td>' +
      '<td style="font-size:10.5px">' + (filesHtml || '<span style="color:var(--text-muted)">-</span>') + '</td>' +
      '<td style="text-align:center">' + (impHtml || '-') + '</td>' +
      '<td style="text-align:center">' + statusBadge + '</td>' +
      '<td style="text-align:center"><span style="font-size:13px;font-weight:800;color:var(--accent-blue)">' + (r.score || 0) + '</span></td>' +
      '<td style="text-align:center"><div style="display:flex;gap:4px;justify-content:center">' +
        '<button onclick="drOpenExecForm(' + r.id + ')" title="수정" style="background:none;border:none;cursor:pointer;font-size:13px;padding:2px 5px">✏️</button>' +
        '<button onclick="drDeleteExecReport(' + r.id + ')" title="삭제" style="background:none;border:none;cursor:pointer;font-size:13px;padding:2px 5px">🗑️</button>' +
      '</div></td></tr>';
  }).join('');
  refreshIcons();
}

function drDeleteExecReport(id) {
  _loadDrExecReports();
  _drExecReports = _drExecReports.filter(function(r){ return r.id !== id; });
  _saveDrExecReports();
  showToast('info', '\uc5c5\ubb34\ubcf4\uace0\uac00 \uc0ad\uc81c\ub418\uc5c8\uc2b5\ub2c8\ub2e4');
  renderDrExecList();
}

function _drExecFileChange(input) {
  Array.from(input.files).forEach(function(f) {
    if (!_drExecFiles.some(function(ef){ return ef.name===f.name && ef.size===f.size; })) _drExecFiles.push(f);
  });
  input.value = '';
  _renderDrExecFileList();
}

function _renderDrExecFileList(existingNames) {
  var listEl = document.getElementById('drExecFileList');
  if (!listEl) return;
  var existHtml = (existingNames || []).map(function(name) {
    return '<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:16px;background:var(--bg-tertiary);border:1px solid var(--border-color);font-size:11px;color:var(--text-secondary)"><i data-lucide="file" style="width:10px;height:10px"></i>' + name + '</span>';
  }).join('');
  var newHtml = _drExecFiles.map(function(f, i) {
    return '<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:16px;background:rgba(79,110,247,.08);border:1px solid rgba(79,110,247,.3);font-size:11px;color:var(--text-primary)"><i data-lucide="file-plus" style="width:10px;height:10px;color:var(--accent-blue)"></i>' + f.name + '<button onclick="_drExecFiles.splice(' + i + ',1);_renderDrExecFileList()" style="background:none;border:none;cursor:pointer;padding:0;display:inline-flex;color:var(--text-muted)" onmouseover="this.style.color=\'#ef4444\'" onmouseout="this.style.color=\'var(--text-muted)\'"><i data-lucide="x" style="width:9px;height:9px"></i></button></span>';
  }).join('');
  listEl.innerHTML = existHtml + newHtml;
  setTimeout(refreshIcons, 30);
}

function _renderDrImpPicks() {
  var container = document.getElementById('drExecImpPicks');
  if (!container) return;
  var importances = JSON.parse(localStorage.getItem('ws_instr_importances') || '[]');
  if (importances.length === 0) {
    container.innerHTML = '<span style="font-size:11px;color:var(--text-muted);white-space:nowrap">\uc911\uc694\ub3c4 \uc5c6\uc74c</span>';
    return;
  }
  var selItems   = importances.filter(function(i){ return _drExecImps.includes(i.name); });
  var unselItems = importances.filter(function(i){ return !_drExecImps.includes(i.name); });
  var selHtml = selItems.map(function(imp) {
    var c = imp.color||'#ef4444';
    var inner = imp.icon && imp.icon.length>2 ? '<i data-lucide="' + imp.icon + '" style="width:11px;height:11px;color:#fff"></i>' : '';
    return '<span onclick="_drToggleImp(\'' + imp.name + '\')" title="' + imp.name + '" style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:' + c + ';border:2px solid ' + c + ';cursor:pointer;flex-shrink:0">' + inner + '</span>';
  }).join('');
  var unselHtml = unselItems.map(function(imp) {
    var c = imp.color||'#ef4444';
    var iconHtml = imp.icon && imp.icon.length>2 ? '<i data-lucide="' + imp.icon + '" style="width:9px;height:9px;color:' + c + '"></i>' : '';
    return '<span onclick="_drToggleImp(\'' + imp.name + '\')" title="' + imp.name + '" style="display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:16px;font-size:10.5px;font-weight:600;cursor:pointer;flex-shrink:0;white-space:nowrap;border:1.5px solid ' + c + ';color:' + c + '" onmouseover="this.style.background=\'' + c + '22\'" onmouseout="this.style.background=\'\'">' + iconHtml + imp.name + '</span>';
  }).join('');
  container.innerHTML = selHtml + (selHtml&&unselHtml ? '<span style="width:1px;height:20px;background:var(--border-color);flex-shrink:0;margin:0 2px"></span>' : '') + unselHtml;
  setTimeout(refreshIcons, 30);
}

function _drToggleImp(name) {
  var idx = _drExecImps.indexOf(name);
  if (idx !== -1) _drExecImps.splice(idx, 1); else _drExecImps.push(name);
  _renderDrImpPicks();
}

function _drImpDragStart(e) {
  var el = document.getElementById('drExecImpPicks'); if (!el) return;
  _drImpDragState = { active:true, startX: e.pageX - el.getBoundingClientRect().left, scrollLeft: el.scrollLeft };
  el.style.cursor = 'grabbing';
}
function _drImpDragMove(e) {
  if (!_drImpDragState.active) return; e.preventDefault();
  var el = document.getElementById('drExecImpPicks'); if (!el) return;
  el.scrollLeft = _drImpDragState.scrollLeft - (e.pageX - el.getBoundingClientRect().left - _drImpDragState.startX) * 1.4;
}
function _drImpDragEnd() {
  _drImpDragState.active = false;
  var el = document.getElementById('drExecImpPicks'); if (el) el.style.cursor = 'grab';
}

/* ── \uc9c4\ud589\uc0c1\ud0dc \ud53d\ucee4 \ub80c\ub354 (\ub2e8\uc77c \uc120\ud0dd) */
function _renderDrStatusPicks() {
  var container = document.getElementById('drExecStatusPicks');
  if (!container) return;
  var statuses = JSON.parse(localStorage.getItem('ws_task_statuses') || '[]');
  if (statuses.length === 0) {
    container.innerHTML = '<span style="font-size:11px;color:var(--text-muted);white-space:nowrap">\uc9c4\ud589\uc0c1\ud0dc \uc5c6\uc74c</span>';
    return;
  }
  container.innerHTML = statuses.map(function(st) {
    var c = st.color || '#06b6d4';
    var isSelected = _drExecStatus === st.id || _drExecStatus === st.name;
    var iconHtml = st.icon ? '<i data-lucide="' + st.icon + '" style="width:9px;height:9px;color:' + (isSelected ? '#fff' : c) + '"></i>' : '';
    if (isSelected) {
      return '<span onclick="_drToggleStatus(\'' + (st.id || st.name) + '\')" title="\ud074\ub9ad\ud558\uc5ec \ucde8\uc18c"\n        style="display:inline-flex;align-items:center;gap:3px;padding:3px 9px;border-radius:16px;\n               font-size:10.5px;font-weight:700;cursor:pointer;flex-shrink:0;white-space:nowrap;\n               background:' + c + ';border:1.5px solid ' + c + ';color:#fff">' + iconHtml + st.name + '</span>';
    } else {
      return '<span onclick="_drToggleStatus(\'' + (st.id || st.name) + '\')" title="' + st.name + '"\n        style="display:inline-flex;align-items:center;gap:3px;padding:3px 9px;border-radius:16px;\n               font-size:10.5px;font-weight:700;cursor:pointer;flex-shrink:0;white-space:nowrap;\n               border:1.5px solid ' + c + ';color:' + c + ';background:transparent"\n        onmouseover="this.style.background=\'' + c + '22\'" onmouseout="this.style.background=\'transparent\'">' + iconHtml + st.name + '</span>';
    }
  }).join('');
  setTimeout(refreshIcons, 30);
}

function _drToggleStatus(idOrName) {
  if (_drExecStatus === idOrName) {
    _drExecStatus = null; // \ub2e4\uc2dc \ud074\ub9ad\ud558\uba74 \ucde8\uc18c
  } else {
    _drExecStatus = idOrName;
  }
  _renderDrStatusPicks();
}

function _drStatDragStart(e) {
  var el = document.getElementById('drExecStatusPicks'); if (!el) return;
  _drStatDragState = { active:true, startX: e.pageX - el.getBoundingClientRect().left, scrollLeft: el.scrollLeft };
  el.style.cursor = 'grabbing';
}
function _drStatDragMove(e) {
  if (!_drStatDragState.active) return; e.preventDefault();
  var el = document.getElementById('drExecStatusPicks'); if (!el) return;
  el.scrollLeft = _drStatDragState.scrollLeft - (e.pageX - el.getBoundingClientRect().left - _drStatDragState.startX) * 1.4;
}
function _drStatDragEnd() {
  _drStatDragState.active = false;
  var el = document.getElementById('drExecStatusPicks'); if (el) el.style.cursor = 'grab';
}

/* ════════════════════════════════════════════════
   📅 달력 날짜 픽커
════════════════════════════════════════════════ */
let _dpTargetId = null;
let _dpDisplayId = null;
let _dpYear = null;
let _dpMonth = null;

function openDatePicker(targetId, displayId) {
  _dpTargetId  = targetId;
  _dpDisplayId = displayId;

  // 기존 팝업 제거
  const old = document.getElementById('_datePicker');
  if (old) old.remove();

  // 현재 값
  const cur = document.getElementById(targetId)?.value;
  const base = cur ? new Date(cur) : new Date();
  _dpYear  = base.getFullYear();
  _dpMonth = base.getMonth();

  const popup = document.createElement('div');
  popup.id = '_datePicker';
  popup.style.cssText = `
    position:fixed;z-index:99999;background:var(--bg-secondary);
    border:1px solid var(--border-color);border-radius:14px;
    box-shadow:0 8px 32px rgba(0,0,0,.18);padding:14px;
    min-width:280px;user-select:none;
  `;

  // 기준 버튼 위치
  const btn = document.getElementById(displayId);
  if (btn) {
    const r = btn.getBoundingClientRect();
    popup.style.top  = (r.bottom + 6) + 'px';
    popup.style.left = r.left + 'px';
  } else {
    popup.style.top  = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%,-50%)';
  }

  document.body.appendChild(popup);
  _dpRender();

  // 외부 클릭 시 닫기
  setTimeout(() => {
    document.addEventListener('click', _dpOutsideClick, true);
  }, 10);
}

function _dpOutsideClick(e) {
  const popup = document.getElementById('_datePicker');
  if (popup && !popup.contains(e.target)) {
    popup.remove();
    document.removeEventListener('click', _dpOutsideClick, true);
  }
}

function _dpRender() {
  const popup = document.getElementById('_datePicker');
  if (!popup) return;

  const months = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
  const days   = ['일','월','화','수','목','금','토'];
  const firstDay = new Date(_dpYear, _dpMonth, 1).getDay();
  const lastDate = new Date(_dpYear, _dpMonth + 1, 0).getDate();
  const today    = new Date();
  const curVal   = document.getElementById(_dpTargetId)?.value;

  let html = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      <button onclick="event.stopPropagation();_dpPrev()" style="background:none;border:none;cursor:pointer;font-size:18px;color:var(--text-primary);padding:2px 8px">‹</button>
      <span style="font-weight:800;font-size:14px;color:var(--text-primary)">${_dpYear}년 ${months[_dpMonth]}</span>
      <button onclick="event.stopPropagation();_dpNext()" style="background:none;border:none;cursor:pointer;font-size:18px;color:var(--text-primary);padding:2px 8px">›</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:4px">
      ${days.map((d,i) => `<div style="text-align:center;font-size:10.5px;font-weight:700;padding:4px 0;color:${i===0?'#ef4444':i===6?'var(--accent-blue)':'var(--text-muted)'}">${d}</div>`).join('')}
    </div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px">
  `;

  // 빈 칸
  for (let i = 0; i < firstDay; i++) {
    html += `<div></div>`;
  }

  for (let d = 1; d <= lastDate; d++) {
    const dt = `${_dpYear}-${String(_dpMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday    = d === today.getDate() && _dpMonth === today.getMonth() && _dpYear === today.getFullYear();
    const isSelected = dt === curVal;
    const dow = (firstDay + d - 1) % 7;
    const color = dow === 0 ? '#ef4444' : dow === 6 ? 'var(--accent-blue)' : 'var(--text-primary)';

    html += `
      <div onclick="event.stopPropagation();_dpSelect('${dt}')"
        style="text-align:center;padding:5px 2px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:${isSelected||isToday?'800':'500'};
               color:${isSelected?'#fff':color};
               background:${isSelected?'var(--accent-blue)':isToday?'rgba(79,110,247,.15)':'transparent'};
               border:${isToday&&!isSelected?'1.5px solid var(--accent-blue)':'1.5px solid transparent'}">
        ${d}
      </div>
    `;
  }

  html += `</div>
    <div style="display:flex;gap:6px;margin-top:10px;justify-content:flex-end">
      <button onclick="event.stopPropagation();_dpSelect('today')" style="font-size:11px;padding:4px 10px;border-radius:7px;border:1px solid var(--border-color);background:var(--bg-tertiary);cursor:pointer;color:var(--text-primary)">오늘</button>
      <button onclick="event.stopPropagation();document.getElementById('_datePicker').remove();document.removeEventListener('click',_dpOutsideClick,true)" style="font-size:11px;padding:4px 10px;border-radius:7px;border:1px solid var(--border-color);background:var(--bg-tertiary);cursor:pointer;color:var(--text-primary)">닫기</button>
    </div>
  `;

  popup.innerHTML = html;
}

function _dpPrev() {
  _dpMonth--;
  if (_dpMonth < 0) { _dpMonth = 11; _dpYear--; }
  _dpRender();
}
function _dpNext() {
  _dpMonth++;
  if (_dpMonth > 11) { _dpMonth = 0; _dpYear++; }
  _dpRender();
}
function _dpSelect(dt) {
  let selected = dt;
  if (dt === 'today') {
    const t = new Date();
    selected = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
  }

  const hiddenEl  = document.getElementById(_dpTargetId);
  const displayEl = document.getElementById(_dpDisplayId);

  if (hiddenEl) hiddenEl.value = selected;
  if (displayEl) {
    const [y, m, d] = selected.split('-');
    const labelId = _dpDisplayId.replace('_display', '_label');
    const labelEl = document.getElementById(labelId);
    const labelText = `${y}년 ${parseInt(m)}월 ${parseInt(d)}일`;
    if (labelEl) labelEl.textContent = labelText;
    else displayEl.querySelector('span') && (displayEl.querySelector('span').textContent = labelText);
  }

  const popup = document.getElementById('_datePicker');
  if (popup) popup.remove();
  document.removeEventListener('click', _dpOutsideClick, true);
}

/* ── saveTaskDetail 당일 히스토리 중복 방지 패치 ── */
(function() {
  const _orig = saveTaskDetail;
  saveTaskDetail = function() {
    const id = window._editingTaskId;
    if (!id) return _orig();
    const t = WS.getTask(id);
    if (!t) return _orig();

    const slider  = document.getElementById(`progressSlider_${id}`);
    const progInp = document.getElementById(`progressInput_${id}`);
    const descEl  = document.getElementById('td_desc');
    if (slider)  t.progress = parseInt(slider.value);
    else if (progInp) t.progress = parseInt(progInp.value);
    if (descEl)  t.desc = descEl.value;

    const now = new Date();
    const dateStr = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}`;
    if (!t.history) t.history = [];
    const entry = {
      date: dateStr, event: '진행율 업데이트',
      detail: `진행율 ${t.progress}% · ${t.desc ? '설명 수정' : ''}`,
      icon: 'refresh-cw', color: '#4f6ef7'
    };
    const idx = t.history.findIndex(h => h.date === dateStr);
    if (idx !== -1) { t.history[idx] = entry; }
    else            { t.history.push(entry); }

    WS.saveTasks();
    renderDashboard();
    renderPage_Tasks();
    closeModalDirect('taskDetailModal');
    showToast('success', '<i data-lucide="check-circle-2"></i> 저장되었습니다.');
    refreshIcons();
  };
})();

/* ════════════════════════════════════════
   🏢 본사정보 페이지 함수
   ════════════════════════════════════════ */
function renderPage_HQInfo() {
  loadHqInfo();
  renderHqHistory();
  loadHqPayment();
  refreshIcons();
}
function loadHqInfo() {
  var data = JSON.parse(localStorage.getItem('ws_hq_info') || '{}');
  var set = function(id, val) { var el = document.getElementById(id); if(el) el.value = val || ''; };
  set('hq_company', data.company); set('hq_zip', data.zip);
  set('hq_addr1', data.addr1);    set('hq_addr2', data.addr2);
  set('hq_ceo', data.ceo);        set('hq_ceo_phone', data.ceoPhone);
  set('hq_biz_phone', data.bizPhone); set('hq_biz_no', data.bizNo);
  set('hq_biz_type', data.bizType);   set('hq_biz_item', data.bizItem);
  set('hq_tax_email', data.taxEmail); set('hq_mgr_name', data.mgrName);
  set('hq_mgr_title', data.mgrTitle); set('hq_mgr_mobile', data.mgrMobile);
  set('hq_mgr_id', data.mgrId || (WS.currentUser ? WS.currentUser.id : ''));
  var cb = document.getElementById('hqCodeBadge');
  if(cb) cb.textContent = '# 코드: ' + (data.code || 'CODE-F1');
  if(data.bizDocImg) { var p1=document.getElementById('hqBizDocPreview'); if(p1) p1.innerHTML='<img src="'+data.bizDocImg+'" style="width:100%;height:100%;object-fit:cover">'; }
  if(data.mainImg)   { var p2=document.getElementById('hqMainImgPreview'); if(p2) p2.innerHTML='<img src="'+data.mainImg+'" style="width:100%;height:100%;object-fit:cover" alt="Solution Main">'; }
  if(data.mgrPhoto)  { var p3=document.getElementById('hqManagerPhotoPreview'); if(p3) p3.innerHTML='<img src="'+data.mgrPhoto+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%">'; }
}
function saveHqInfo() {
  var get = function(id) { var el=document.getElementById(id); return el?el.value.trim():''; };
  var existing = JSON.parse(localStorage.getItem('ws_hq_info') || '{}');
  var data = Object.assign({}, existing, {
    company:get('hq_company'), zip:get('hq_zip'), addr1:get('hq_addr1'), addr2:get('hq_addr2'),
    ceo:get('hq_ceo'), ceoPhone:get('hq_ceo_phone'), bizPhone:get('hq_biz_phone'), bizNo:get('hq_biz_no'),
    bizType:get('hq_biz_type'), bizItem:get('hq_biz_item'), taxEmail:get('hq_tax_email'),
    mgrName:get('hq_mgr_name'), mgrTitle:get('hq_mgr_title'), mgrMobile:get('hq_mgr_mobile'), mgrId:get('hq_mgr_id')
  });
  if(!data.history) data.history=[];
  var now=new Date(), pd=function(n){return String(n).padStart(2,'0');};
  var ds=now.getFullYear()+'-'+pd(now.getMonth()+1)+'-'+pd(now.getDate())+' '+pd(now.getHours())+':'+pd(now.getMinutes());
  data.history.unshift({date:ds, text:'정보 수정', by:(WS.currentUser?WS.currentUser.name+' ('+(WS.currentUser.role||'')+')':'관리자')});
  if(data.history.length>10) data.history=data.history.slice(0,10);
  localStorage.setItem('ws_hq_info', JSON.stringify(data));
  renderHqHistory();
  showToast('success','<i data-lucide="check-circle-2"></i> 본사정보가 저장되었습니다.');
  refreshIcons();
}
function resetHqInfo() {
  if(!confirm('입력한 내용을 초기화하시겠습니까?')) return;
  ['hq_company','hq_zip','hq_addr1','hq_addr2','hq_ceo','hq_ceo_phone','hq_biz_phone','hq_biz_no','hq_biz_type','hq_biz_item','hq_tax_email','hq_mgr_name','hq_mgr_title','hq_mgr_mobile'].forEach(function(id){var el=document.getElementById(id);if(el)el.value='';});
  var p1=document.getElementById('hqBizDocPreview'); if(p1) p1.innerHTML='<i data-lucide="image" style="width:36px;height:36px;color:var(--text-muted)"></i><span style="font-size:12px;color:var(--text-muted)">등록된 이미지가 없습니다.</span>';
  var p2=document.getElementById('hqMainImgPreview'); if(p2) p2.innerHTML='<i data-lucide="image" style="width:36px;height:36px;color:var(--text-muted)"></i><span style="font-size:12px;color:var(--text-muted)">클릭하여 이미지 업로드</span>';
  var p3=document.getElementById('hqManagerPhotoPreview'); if(p3) p3.innerHTML='<i data-lucide="user" style="width:28px;height:28px;color:var(--text-muted)"></i>';
  showToast('info','초기화되었습니다.'); refreshIcons();
}
function renderHqHistory() {
  var data=JSON.parse(localStorage.getItem('ws_hq_info')||'{}');
  var list=document.getElementById('hqHistoryList'); if(!list) return;
  var history=data.history||[];
  if(!history.length){list.innerHTML='<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:13px">이력이 없습니다.</div>';return;}
  list.innerHTML=history.map(function(h,i){
    return '<div class="hq-history-item"><div class="hq-history-dot '+(i===history.length-1?'first':'')+'"></div><div class="hq-history-content"><div class="hq-history-date">'+h.date+'</div><div class="hq-history-text">'+h.text+'</div><div class="hq-history-by">\u270e '+h.by+'</div></div></div>';
  }).join('');
}
function handleHqBizDoc(input) {
  var file=input.files[0]; if(!file) return;
  var reader=new FileReader(); reader.onload=function(e){
    var p=document.getElementById('hqBizDocPreview'); if(p) p.innerHTML='<img src="'+e.target.result+'" style="width:100%;height:100%;object-fit:cover">';
    var d=JSON.parse(localStorage.getItem('ws_hq_info')||'{}'); d.bizDocImg=e.target.result; localStorage.setItem('ws_hq_info',JSON.stringify(d));
    showToast('success','사업자등록증 이미지가 등록되었습니다.');
  }; reader.readAsDataURL(file);
}
function clearHqBizDoc() {
  var p=document.getElementById('hqBizDocPreview'); if(p) p.innerHTML='<i data-lucide="image" style="width:36px;height:36px;color:var(--text-muted)"></i><span style="font-size:12px;color:var(--text-muted)">등록된 이미지가 없습니다.</span>';
  var d=JSON.parse(localStorage.getItem('ws_hq_info')||'{}'); delete d.bizDocImg; localStorage.setItem('ws_hq_info',JSON.stringify(d)); refreshIcons();
}
function handleHqMainImg(input) {
  var file=input.files[0]; if(!file) return;
  var reader=new FileReader(); reader.onload=function(e){
    var p=document.getElementById('hqMainImgPreview'); if(p) p.innerHTML='<img src="'+e.target.result+'" style="width:100%;height:100%;object-fit:cover" alt="Solution Main">';
    var d=JSON.parse(localStorage.getItem('ws_hq_info')||'{}'); d.mainImg=e.target.result; localStorage.setItem('ws_hq_info',JSON.stringify(d));
    showToast('success','솔루션 메인 이미지가 등록되었습니다.');
  }; reader.readAsDataURL(file);
}
function clearHqMainImg() {
  var p=document.getElementById('hqMainImgPreview'); if(p) p.innerHTML='<i data-lucide="image" style="width:36px;height:36px;color:var(--text-muted)"></i><span style="font-size:12px;color:var(--text-muted)">클릭하여 이미지 업로드</span>';
  var d=JSON.parse(localStorage.getItem('ws_hq_info')||'{}'); delete d.mainImg; localStorage.setItem('ws_hq_info',JSON.stringify(d)); refreshIcons();
}
function handleHqManagerPhoto(input) {
  var file=input.files[0]; if(!file) return;
  var reader=new FileReader(); reader.onload=function(e){
    var p=document.getElementById('hqManagerPhotoPreview'); if(p) p.innerHTML='<img src="'+e.target.result+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%">';
    var d=JSON.parse(localStorage.getItem('ws_hq_info')||'{}'); d.mgrPhoto=e.target.result; localStorage.setItem('ws_hq_info',JSON.stringify(d));
    showToast('success','담당자 사진이 등록되었습니다.');
  }; reader.readAsDataURL(file);
}
function searchHqAddress() {
  if(typeof daum==='undefined'||!daum.Postcode){
    var s=document.createElement('script'); s.src='https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    s.onload=function(){openHqDaumPostcode();}; document.head.appendChild(s);
  } else { openHqDaumPostcode(); }
}
function openHqDaumPostcode() {
  new daum.Postcode({oncomplete:function(data){
    document.getElementById('hq_zip').value=data.zonecode;
    document.getElementById('hq_addr1').value=data.roadAddress||data.jibunAddress;
  }}).open();
}

/* ── 결제 정보 로드/저장 ── */
function loadHqPayment() {
  var d = JSON.parse(localStorage.getItem('ws_hq_payment') || '{}');
  var setTxt = function(id, val) { var el=document.getElementById(id); if(el) el.textContent = val||el.textContent; };
  setTxt('hq_pay_db_mgmt',     d.dbMgmt    || '200,000');
  setTxt('hq_pay_db_mgmt_cnt', d.dbMgmtCnt || '123,901');
  setTxt('hq_pay_db_use',      d.dbUse     || '17,500');
  setTxt('hq_pay_db_use_cnt',  d.dbUseCnt  || '35,001');
  setTxt('hq_pay_ai',          d.ai        || '103,000');
  setTxt('hq_pay_ai_cnt',      d.aiCnt     || '206');
  setTxt('hq_pay_fee',         d.fee       || '1,930,200');
  setTxt('hq_pay_fee_rate',    d.feeRate   || '7');
  setTxt('hq_pay_total',       d.total     || '2,250,700');
}

function saveHqPayment() {
  var get = function(id) { var el=document.getElementById(id); return el?el.value.trim():''; };
  var data = {
    dbMgmt:    get('hqpm_db_mgmt'),    dbMgmtCnt: get('hqpm_db_mgmt_cnt'),
    dbUse:     get('hqpm_db_use'),     dbUseCnt:  get('hqpm_db_use_cnt'),
    ai:        get('hqpm_ai'),         aiCnt:     get('hqpm_ai_cnt'),
    fee:       get('hqpm_fee'),        feeRate:   get('hqpm_fee_rate'),
    total:     get('hqpm_total')
  };
  localStorage.setItem('ws_hq_payment', JSON.stringify(data));
  closeModalDirect('hqPaymentModal');
  loadHqPayment();
  showToast('success', '<i data-lucide="check-circle-2"></i> 결제 정보가 저장되었습니다.');
  refreshIcons();
}

function openHqPaymentModal() {
  var d = JSON.parse(localStorage.getItem('ws_hq_payment') || '{}');
  var modal = document.getElementById('hqPaymentModal');
  if(!modal) {
    // 모달 동적 생성
    var el = document.createElement('div');
    el.className = 'modal-overlay';
    el.id = 'hqPaymentModal';
    el.style.display = 'none';
    el.setAttribute('onclick', "if(event.target===this)closeModalDirect('hqPaymentModal')");
    el.innerHTML = [
      '<div class="modal-box" style="max-width:480px">',
        '<div class="modal-head">',
          '<div style="display:flex;align-items:center;gap:8px">',
            '<i data-lucide="credit-card" style="width:16px;height:16px;color:var(--accent-blue)"></i>',
            '<div class="modal-title">결제 정보 수정</div>',
          '</div>',
          '<button class="modal-close" onclick="closeModalDirect(\'hqPaymentModal\')">✕</button>',
        '</div>',
        '<div class="modal-body">',
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">',
            _hqPayField('hqpm_db_mgmt',    'DB관리요금 (원)',   d.dbMgmt    || '200,000'),
            _hqPayField('hqpm_db_mgmt_cnt','DB관리요금 (건수)', d.dbMgmtCnt || '123,901'),
            _hqPayField('hqpm_db_use',     'DB사용요금 (원)',   d.dbUse     || '17,500'),
            _hqPayField('hqpm_db_use_cnt', 'DB사용요금 (건수)', d.dbUseCnt  || '35,001'),
            _hqPayField('hqpm_ai',         'AI사용요금 (원)',   d.ai        || '103,000'),
            _hqPayField('hqpm_ai_cnt',     'AI사용요금 (건수)', d.aiCnt     || '206'),
            _hqPayField('hqpm_fee',        '수수료비용 (원)',   d.fee       || '1,930,200'),
            _hqPayField('hqpm_fee_rate',   '수수료율 (%)',      d.feeRate   || '7'),
            _hqPayField('hqpm_total',      '결제 예정 금액 (원)', d.total   || '2,250,700'),
          '</div>',
        '</div>',
        '<div class="modal-foot">',
          '<button class="btn" onclick="closeModalDirect(\'hqPaymentModal\')">취소</button>',
          '<button class="btn btn-blue" onclick="saveHqPayment()">저장</button>',
        '</div>',
      '</div>'
    ].join('');
    document.body.appendChild(el);
    refreshIcons();
    modal = el;
  }
  modal.style.display = 'flex';
}
function _hqPayField(id, label, val) {
  return '<div class="form-group"><label class="form-label hq-label">'+label+'</label><input type="text" class="form-input" id="'+id+'" value="'+val+'"></div>';
}

/* ── 전화번호 자동 하이픈 ── */
function formatPhoneInput(el) {
  var v = el.value.replace(/\D/g, '');
  if (v.length <= 3) {
    el.value = v;
  } else if (v.length <= 7) {
    el.value = v.slice(0,3) + '-' + v.slice(3);
  } else if (v.length <= 11) {
    el.value = v.slice(0,3) + '-' + v.slice(3, v.length <= 10 ? 6 : 7) + '-' + v.slice(v.length <= 10 ? 6 : 7);
  } else {
    el.value = v.slice(0,3) + '-' + v.slice(3,7) + '-' + v.slice(7,11);
  }
}

/* 사업자번호 자동 하이픈 (000-00-00000) */
function formatBizNoInput(el) {
  var v = el.value.replace(/\D/g, '');
  if (v.length <= 3) {
    el.value = v;
  } else if (v.length <= 5) {
    el.value = v.slice(0,3) + '-' + v.slice(3);
  } else {
    el.value = v.slice(0,3) + '-' + v.slice(3,5) + '-' + v.slice(5,10);
  }
}

/* ── 비밀번호 눈 아이콘 토글 ── */
function toggleStaffPwd() {
  var inp = document.getElementById('st_password');
  var btn = document.getElementById('st_pwd_eye');
  if (!inp) return;
  var isHidden = inp.type === 'password';
  inp.type = isHidden ? 'text' : 'password';
  if (btn) {
    btn.innerHTML = isHidden
      ? '<i data-lucide="eye-off" style="width:15px;height:15px"></i>'
      : '<i data-lucide="eye" style="width:15px;height:15px"></i>';
    refreshIcons();
  }
}

/* ══════════════════════════════
   📢 지시사항 모달
══════════════════════════════ */

/* editInstruction: 내가 지시한 업무 클릭 시 instructionModal로 수정 */
function editInstruction(taskId) {
  // 1) ws_instructions에서 먼저 찾기
  const instr = JSON.parse(localStorage.getItem('ws_instructions') || '[]');
  const fromInstr = instr.find(i => i.id === taskId || i.id === Number(taskId));
  if (fromInstr) {
    openInstructionModal(fromInstr);
    return;
  }

  // 2) WS.tasks에서 찾아 instructionModal 형식으로 변환
  const task = WS.getTask ? WS.getTask(taskId) : WS.tasks.find(t => t.id === taskId || t.id === Number(taskId));
  if (task) {
    const adaptedData = {
      id:          task.id,
      taskId:      task.taskId   || String(task.id),
      taskName:    task.taskName || task.title,
      assigneeId:  Array.isArray(task.assigneeIds) ? task.assigneeIds[0] : task.assigneeId,
      dueDate:     task.dueDate   || '',
      content:     task.content   || task.description || '',
      report:      task.report    || '',
      procedure:   task.procedure || '',
      importance:  task.importance || '',
      attachments: task.attachments || [],
      _fromTasks:  true  // 출처 표시 (필요 시 저장 시 구분용)
    };
    openInstructionModal(adaptedData);
    return;
  }

  showToast('error', '해당 지시사항을 찾을 수 없습니다.');
}

/* 모달 열기 (editData 있으면 수정모드) */
/* 모달 열기 (editData 있으면 수정모드) */
function openInstructionModal(editData) {
  var m = document.getElementById('instructionModal');
  if (!m) return;

  // 피커 초기화
  window._instrSelectedTasks    = [];
  window._instrSelectedAssignees = [];
  _renderInstrTaskBox();
  _renderInstrAssigneeBox();

  // 수정/신규 모드 설정
  window._instrEditId   = editData ? (editData.id || null) : null;
  window._instrEditData = editData || null;
  var isEdit = !!window._instrEditId;

  // 영역 표시 제어
  var newFields  = document.getElementById('instrNewFields');
  var editHeader = document.getElementById('instrEditHeader');
  if (newFields)  newFields.style.display  = 'grid';
  if (editHeader) editHeader.style.display = isEdit ? 'block' : 'none';

  // 모달 타이틀 & 수정모드 UI
  _instrSetEditMode(editData, isEdit);

  // 상태 칩
  _renderInstrStatusPicks(editData ? (editData.status || editData.taskStatus || '') : '');

  // 담당자 드롭다운
  var assSel = document.getElementById('instrAssignee');
  if (assSel) {
    assSel.innerHTML = '<option value="">-- \ub2f4\ub2f9\uc790\ub97c \uc120\ud0dd\ud558\uc138\uc694 --</option>' +
      (WS.users || []).map(function(u){ return '<option value="'+u.id+'">'+u.name+' ('+( u.dept||'')+')</option>'; }).join('');
  }

  // 진행순서 + 보고내용 칩 UI
  _instrInitProc();
  _instrInitReportPicks();

  // 폼 초기화
  var reportInput = document.getElementById('instrReport');
  if (reportInput) reportInput.value = '';
  window._instrSelectedReports = [];
  ['instrContent','instrProcedureText'].forEach(function(id){ var el=document.getElementById(id); if(el)el.value=''; });
  window._instrFileArr = [];
  window._instrExistingFiles = editData ? (editData.attachments || []).slice() : [];
  // 담당자(지시받은 사람)가 올린 파일: WS.tasks에서 로드 (다운로드 전용)
  var _editTaskId = editData ? (editData.id || editData.taskId || null) : null;
  window._instrTaskFiles = [];
  if (_editTaskId && WS.getTask) {
    var _et = WS.getTask(_editTaskId) || (WS.tasks||[]).find(function(t){ return String(t.id)===String(_editTaskId); });
    if (_et && Array.isArray(_et.attachments) && _et.attachments.length > 0) {
      var instrFileNames = (window._instrExistingFiles || []).map(function(a){ return typeof a==='string'?a:(a.name||''); });
      // 지시자 파일과 중복 제외, 나머지는 담당자 파일로 표시
      window._instrTaskFiles = _et.attachments.filter(function(a){
        var n = typeof a==='string'?a:(a.name||'');
        return !instrFileNames.includes(n);
      });
    }
  }
  var fileInput = document.getElementById('instrFile');
  if (fileInput) fileInput.value = '';
  renderInstrFileList();

  // 날짜 피커
  var dueHidden  = document.getElementById('instrDueDate');
  var dueLabelEl = document.getElementById('instrDueDateLabel');
  if (dueHidden)  dueHidden.value = editData ? (editData.dueDate || '') : '';
  if (dueLabelEl) {
    if (editData && editData.dueDate) {
      var parts = editData.dueDate.split('-');
      dueLabelEl.textContent = parts[0]+'\ub144 '+parseInt(parts[1])+'\uc6d4 '+parseInt(parts[2])+'\uc77c';
    } else {
      dueLabelEl.textContent = '\ub0a0\uc9dc\ub97c \uc120\ud0dd\ud558\uc138\uc694';
    }
  }

  // 업무중요도
  window._instrImportances = editData && editData.importance
    ? editData.importance.split(',').map(function(s){return s.trim();}).filter(Boolean) : [];
  var impVal = document.getElementById('instrImportanceVal');
  if (impVal) impVal.value = window._instrImportances.join(', ');
  _renderImportancePicks();

  // 수정모드 기존 값 복원
  if (editData) _instrRestoreEdit(editData);

  m.style.display = 'flex';
  setTimeout(refreshIcons, 50);
}

/* 서브: 수정/신규 모드 헤더 처리 */
function _instrSetEditMode(editData, isEdit) {
  var titleEl   = document.getElementById('instructionModalTitle');
  var iconWrap  = document.getElementById('instrModalIconWrap');
  var saveBtn   = document.querySelector('#instructionModal .modal-foot .btn-blue');

  if (isEdit) {
    var taskName = editData.taskName || editData.title || '';
    // 타이틀: "업무명 - 업무수정"
    if (titleEl) {
      titleEl.innerHTML =
        '<span style="color:var(--text-primary)">' + (taskName || '지시사항') + '</span>'
        + '<span style="color:var(--text-muted);font-weight:400;margin:0 6px">-</span>'
        + '<span style="color:var(--accent-blue)">업무수정</span>';
    }
    // 아이콘: pencil
    if (iconWrap) {
      iconWrap.innerHTML = '<i data-lucide="pencil" style="width:16px;height:16px;color:#fff"></i>';
      refreshIcons && refreshIcons();
    }
    // 저장 버튼 → "수정"
    if (saveBtn) {
      saveBtn.innerHTML = '<i data-lucide="pencil" style="width:13px;height:13px;margin-right:4px;vertical-align:middle"></i>수정';
      refreshIcons && refreshIcons();
    }
    var task = WS.getTask ? WS.getTask(editData.id)
      : WS.tasks.find(function(t){ return t.id === editData.id || t.id === Number(editData.id); });
    var progress = (task && task.progress != null) ? task.progress : (editData.progress || 0);
    var bar = document.getElementById('instrEditProgressBar');
    var lbl = document.getElementById('instrEditProgressLabel');
    if (bar) bar.style.width = progress + '%';
    if (lbl) lbl.textContent = progress + '%';
    _renderInstrHistory(task || editData);
  } else {
    // 등록 모드: 원래대로 복원
    if (titleEl) titleEl.textContent = '지시사항 등록';
    if (iconWrap) {
      iconWrap.innerHTML = '<i data-lucide="megaphone" style="width:16px;height:16px;color:#fff"></i>';
      refreshIcons && refreshIcons();
    }
    if (saveBtn) {
      saveBtn.innerHTML = '<i data-lucide="send" style="width:13px;height:13px;margin-right:4px;vertical-align:middle"></i>저장';
      refreshIcons && refreshIcons();
    }
    var hSec = document.getElementById('instrHistorySection');
    if (hSec) hSec.style.display = 'none';
  }
}

/* 서브: 진행순서 UI 초기화 */
function _instrInitProc() {
  window._instrProcedures = [];
  var procTypeList = document.getElementById('instrProcedureTypeList');
  var procSelected  = document.getElementById('instrProcedureSelected');
  if (procTypeList) {
    var types = WS.reportTypes || [];
    procTypeList.innerHTML = types.length === 0
      ? '<span style="font-size:11px;color:var(--text-muted)">\uae30\ud0c0\uc124\uc815\uc5d0\uc11c \uc9c4\ud589\ubcf4\uace0 \uc720\ud615\uc744 \ucd94\uac00\ud558\uc138\uc694</span>'
      : types.map(function(rt){
          var c = rt.color || '#4f6ef7', icon = rt.icon || 'circle';
          return '<span ondblclick="_addInstrProcedure(\''+rt.label+'\')" data-label="'+rt.label+'"'
            +' title="'+rt.label+' (\ub354\ube14\ud074\ub9ad\uc73c\ub85c \ucd94\uac00)"'
            +' style="display:inline-flex;align-items:center;gap:5px;padding:4px 11px;border-radius:20px;'
            +'font-size:11.5px;font-weight:600;cursor:pointer;transition:all .15s;'
            +'border:1.5px solid '+c+';color:'+c+';background:transparent;user-select:none"'
            +' onmouseover="this.style.background=\''+c+'22\'" onmouseout="this.style.background=\'transparent\'">'
            +'<i data-lucide="'+icon+'" style="width:11px;height:11px;color:'+c+'"></i>'
            +rt.label+'</span>';
        }).join('');
  }
  if (procSelected) {
    procSelected.innerHTML = '<span id="instrProcedurePlaceholder" style="font-size:11px;color:var(--text-muted);padding:2px 0">\uc544\ub798 \ubaa9\ub85d\uc5d0\uc11c \ub354\ube14\ud074\ub9ad\uc73c\ub85c \uc21c\uc11c \ucd94\uac00</span>';
  }
}

/* 서브: 보고내용 칩 초기화 */
function _instrInitReportPicks() {
  var reportPicks = document.getElementById('instrReportPicks');
  if (!reportPicks) return;
  var results = JSON.parse(localStorage.getItem('ws_task_results')) || WS.taskResults || [];
  if (results.length === 0) {
    reportPicks.innerHTML = '<span style="font-size:12px;color:var(--text-muted)">\uae30\ud0c0\uc124\uc815 &gt; \uc5c5\ubb34\uacb0\uacfc\uc5d0\uc11c \ud56d\ubaa9\uc744 \ucd94\uac00\ud558\uc138\uc694</span>';
    return;
  }
  reportPicks.innerHTML = results.map(function(r){
    var c = r.color || '#6b7280';
    var iconHtml = (r.icon && r.icon.length > 2)
      ? '<i data-lucide="'+r.icon+'" style="width:11px;height:11px;color:'+c+'"></i>'
      : (r.icon ? '<span>'+r.icon+'</span>' : '');
    return '<span onclick="_selectInstrReport(\''+r.name+'\',this)" data-result="'+r.name+'"'
      +' style="display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;'
      +'font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;user-select:none;'
      +'border:1.5px solid '+c+';color:'+c+';background:transparent"'
      +' onmouseover="if(!this.classList.contains(\'selected\'))this.style.background=\''+c+'22\'"'
      +' onmouseout="if(!this.classList.contains(\'selected\'))this.style.background=\'transparent\'">'
      +iconHtml+r.name+'</span>';
  }).join('');
}

/* 서브: 수정모드 기존 값 복원 */
function _instrRestoreEdit(editData) {
  var taskName = editData.taskName || editData.title || '';
  if (taskName) {
    var detailList = WS.detailTasks || JSON.parse(localStorage.getItem('ws_detail_tasks') || '[]');
    var found = detailList.find(function(d){ return d.name===taskName || String(d.id)===String(editData.taskId); });
    window._instrSelectedTasks = found ? [{id:found.id||found.name,name:found.name}] : [{id:taskName,name:taskName}];
  }
  if (editData.assigneeId) {
    var fu = (WS.users||[]).find(function(u){ return String(u.id)===String(editData.assigneeId); });
    if (fu) window._instrSelectedAssignees = [{id:fu.id,name:fu.name,dept:fu.dept}];
  }
  _renderInstrTaskBox();
  _renderInstrAssigneeBox();
  var contEl = document.getElementById('instrContent');
  if (contEl) contEl.value = editData.content || '';
  if (editData.report) {
    window._instrSelectedReports = editData.report.split(',').map(function(s){return s.trim();}).filter(Boolean);
    var rPicks = document.getElementById('instrReportPicks');
    if (rPicks) rPicks.querySelectorAll('span[data-result]').forEach(function(el){
      if (window._instrSelectedReports.includes(el.dataset.result)) {
        el.classList.add('selected'); el.style.background = el.style.borderColor;
        el.style.color='#fff'; el.style.fontWeight='700';
      }
    });
  }
  if (editData.procedure) {
    window._instrProcedures = editData.procedure.split(' \u2192 ').map(function(s){return s.trim();}).filter(Boolean);
    _renderInstrProcedureSelected();
  }
  // 배점 복원
  var sMin = document.getElementById('instrScoreMin');
  var sMax = document.getElementById('instrScoreMax');
  if (sMin) sMin.value = (editData.scoreMin > 0) ? editData.scoreMin : '';
  if (sMax) sMax.value = (editData.scoreMax > 0) ? editData.scoreMax : '';
}

/* 히스토리 렌더 */
function _renderInstrHistory(task) {
  var hSec  = document.getElementById('instrHistorySection');
  var hList = document.getElementById('instrHistoryList');
  var hCnt  = document.getElementById('instrHistoryCount');
  var hChev = document.getElementById('instrHistoryChevron');
  if (!hSec || !hList) return;

  var history = (task && task.history) ? task.history.slice().reverse() : [];
  if (history.length === 0) {
    hSec.style.display = 'none';
    return;
  }
  hSec.style.display = 'block';
  if (hCnt) hCnt.textContent = history.length + '건';
  if (hChev) hChev.style.transform = 'rotate(0deg)';

  hList.innerHTML = history.map(function(h) {
    var c     = h.color || '#4f6ef7';
    var icon  = h.icon  || 'clock';
    var bg    = c + '22';
    return '<div style="display:flex;gap:10px;align-items:flex-start;padding:8px 4px;border-bottom:1px solid var(--border-color)">' +
      '<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:' + bg + ';border:1.5px solid ' + c + ';flex-shrink:0;margin-top:2px">' +
        '<i data-lucide="' + icon + '" style="width:14px;height:14px;color:' + c + '"></i>' +
      '</div>' +
      '<div>' +
        '<div style="font-size:10.5px;color:var(--text-muted);margin-bottom:2px">' + (h.date || '') + '</div>' +
        '<div style="font-size:12.5px;font-weight:700;color:var(--text-primary);margin-bottom:2px">' + (h.event || '') + '</div>' +
        '<div style="font-size:11.5px;color:var(--text-secondary)">' + (h.detail || '') + '</div>' +
      '</div>' +
    '</div>';
  }).join('');
  setTimeout(refreshIcons, 30);
}

var _instrHistoryOpen = true;
function _toggleInstrHistory() {
  _instrHistoryOpen = !_instrHistoryOpen;
  var hList = document.getElementById('instrHistoryList');
  var hChev = document.getElementById('instrHistoryChevron');
  if (hList) hList.style.maxHeight = _instrHistoryOpen ? '260px' : '0';
  if (hChev) hChev.style.transform = _instrHistoryOpen ? 'rotate(0deg)' : 'rotate(-90deg)';
}

/* ── 현재상태 칩 렌더 (단일 선택) */
function _renderInstrStatusPicks(selectedVal) {
  var container = document.getElementById('instrStatusPicks');
  var hiddenInp = document.getElementById('instrStatus');
  if (!container) return;

  var statuses = JSON.parse(localStorage.getItem('ws_task_statuses') || '[]');
  if (statuses.length === 0) {
    container.innerHTML = '<span style="font-size:11px;color:var(--text-muted)">' +
      '\uc9c4\ud589\uc0c1\ud0dc \uc5c6\uc74c \u2014 \ubcf8\uc0ac\uad00\ub9ac \u003e \uae30\ud0c0\uc124\uc815\uc5d0\uc11c \ucd94\uac00\ud558\uc138\uc694</span>';
    return;
  }

  // 현재 선택값 - 반드시 String 타입으로 통일
  var cur = selectedVal !== undefined ? String(selectedVal || '') : String(hiddenInp ? (hiddenInp.value || '') : '');

  container.innerHTML = statuses.map(function(st) {
    var c = st.color || '#06b6d4';
    var key = String(st.id || st.name); // 반드시 문자열로
    var isSelected = cur !== '' && (cur === key || cur === String(st.name));
    var iconHtml = st.icon ? '<i data-lucide="' + st.icon + '" style="width:10px;height:10px;color:' + (isSelected ? '#fff' : c) + '"></i>' : '';
    if (isSelected) {
      return '<span onclick="_instrToggleStatus(\'' + key + '\')" title="\ucde8\uc18c"\n        style="display:inline-flex;align-items:center;gap:4px;padding:4px 12px;border-radius:20px;\n               font-size:11.5px;font-weight:700;cursor:pointer;transition:all .15s;user-select:none;\n               background:' + c + ';border:1.5px solid ' + c + ';color:#fff">' + iconHtml + st.name + '</span>';
    } else {
      return '<span onclick="_instrToggleStatus(\'' + key + '\')" title="' + st.name + '"\n        style="display:inline-flex;align-items:center;gap:4px;padding:4px 12px;border-radius:20px;\n               font-size:11.5px;font-weight:600;cursor:pointer;transition:all .15s;user-select:none;\n               border:1.5px solid ' + c + ';color:' + c + ';background:transparent"\n        onmouseover="this.style.background=\'' + c + '22\'" onmouseout="this.style.background=\'transparent\'">' + iconHtml + st.name + '</span>';
    }
  }).join('');

  if (hiddenInp) hiddenInp.value = selectedVal !== undefined ? String(selectedVal || '') : hiddenInp.value;
  setTimeout(refreshIcons, 30);
}

function _instrToggleStatus(key) {
  var hiddenInp = document.getElementById('instrStatus');
  var cur = hiddenInp ? String(hiddenInp.value || '') : '';
  var sKey = String(key);
  var newVal = (cur === sKey) ? '' : sKey;
  if (hiddenInp) hiddenInp.value = newVal;
  _renderInstrStatusPicks(newVal);
}

/* 진행순서 - 더블클릭으로 항목 추가 */
window._instrProcedures = [];
function _addInstrProcedure(label) {
  if (!window._instrProcedures) window._instrProcedures = [];
  window._instrProcedures.push(label);
  _renderInstrProcedureSelected();
}

/* 진행순서 - 선택된 항목 제거 (클릭) */
function _removeInstrProcedure(idx) {
  if (window._instrProcedures) window._instrProcedures.splice(idx, 1);
  _renderInstrProcedureSelected();
}

/* 진행순서 - 선택된 칩 박스 렌더 */
function _renderInstrProcedureSelected() {
  const box = document.getElementById('instrProcedureSelected');
  const txt = document.getElementById('instrProcedureText');
  if (!box) return;
  const items = window._instrProcedures || [];
  if (items.length === 0) {
    box.innerHTML = '<span id="instrProcedurePlaceholder" style="font-size:11px;color:var(--text-muted);padding:2px 0">아래 목록에서 더블클릭으로 순서 추가</span>';
  } else {
    const types = WS.reportTypes || [];
    box.innerHTML = items.map((label, i) => {
      const rt = types.find(t => t.label === label);
      const c = (rt && rt.color) || '#4f6ef7';
      const icon = (rt && rt.icon) || 'circle';
      return `<span
        style="display:inline-flex;align-items:center;gap:5px;padding:4px 11px;border-radius:20px;
               font-size:11.5px;font-weight:600;
               background:${c};border:1.5px solid ${c};color:#fff;
               cursor:pointer;transition:all .15s;user-select:none"
        title="${i+1}. ${label} (클릭하여 제거)"
        onclick="_removeInstrProcedure(${i})">
        <span style="font-size:10px;font-weight:800;background:rgba(255,255,255,.3);
               border-radius:50%;width:16px;height:16px;display:inline-flex;align-items:center;justify-content:center">${i+1}</span>
        <i data-lucide="${icon}" style="width:10px;height:10px;color:#fff"></i>
        ${label}
        <i data-lucide="x" style="width:9px;height:9px;color:rgba(255,255,255,.7)"></i>
      </span>`;
    }).join('');
    setTimeout(refreshIcons, 30);
  }
  if (txt) txt.value = items.join(' → ');
}

/* 하위호환: 기존 _toggleInstrProcedure 호출 대응 */
function _toggleInstrProcedure(label, el) {
  _addInstrProcedure(label);
}

/* 보고내용 복수 선택 (업무결과 리스트 기반) */
window._instrSelectedReports = [];
function _selectInstrReport(name, el) {
  if (!window._instrSelectedReports) window._instrSelectedReports = [];
  var c = el.style.borderColor || '#6b7280';
  var idx = window._instrSelectedReports.indexOf(name);
  if (idx !== -1) {
    // 이미 선택된 항목 클릭 → 선택 해제
    window._instrSelectedReports.splice(idx, 1);
    el.classList.remove('selected');
    el.style.background = 'transparent';
    el.style.color      = c;
    el.style.fontWeight = '600';
    el.style.boxShadow  = 'none';
  } else {
    // 새로 선택 → 배경색 채워 밝게 표시
    window._instrSelectedReports.push(name);
    el.classList.add('selected');
    el.style.background = c;
    el.style.color      = '#ffffff';
    el.style.fontWeight = '700';
    el.style.boxShadow  = '0 2px 8px ' + c + '55';
  }
  // hidden input에 선택된 모든 값 저장
  var inp = document.getElementById('instrReport');
  if (inp) inp.value = window._instrSelectedReports.join(', ');
}

/* 첨부파일 목록 렌더 */
/* _onInstrFileChange: 파일 선택 시 _instrFileArr에 누적 추가 */
function _onInstrFileChange(input) {
  if (!window._instrFileArr) window._instrFileArr = [];
  Array.from(input.files).forEach(f => {
    // 중복 방지 (같은 이름+크기 파일은 재추가 안 함)
    const dup = window._instrFileArr.some(ef => ef.name === f.name && ef.size === f.size);
    if (!dup) window._instrFileArr.push(f);
  });
  input.value = ''; // 리셋: 같은 파일 재선택 가능
  renderInstrFileList();
}

/* renderInstrFileList: 첨부파일 목록 렌더 (X 삭제 버튼 포함) */
function renderInstrFileList() {
  const listEl = document.getElementById('instrFileList');
  if (!listEl) return;
  if (!window._instrFileArr)       window._instrFileArr = [];
  if (!window._instrExistingFiles) window._instrExistingFiles = [];

  const palette = ['#4f6ef7','#22c55e','#f97316','#a855f7','#ec4899','#14b8a6'];

  // 아바타 HTML 생성 헬퍼
  function makeAvatar(dispName) {
    const initials = (dispName && dispName !== '?') ? dispName.slice(0,2) : '?';
    const aColor   = (dispName && dispName !== '?')
      ? palette[dispName.charCodeAt(0) % palette.length] : '#94a3b8';
    return '<span title="' + dispName + '" style="'
      + 'display:inline-flex;align-items:center;justify-content:center;'
      + 'width:20px;height:20px;border-radius:50%;flex-shrink:0;'
      + 'background:' + aColor + ';font-size:9px;font-weight:800;color:#fff;'
      + 'letter-spacing:.3px">' + initials + '</span>';
  }

  const me = WS.currentUser;

  const existingHtml = window._instrExistingFiles.map((a, i) => {
    const name = typeof a === 'string' ? a : (a.name || '');
    const uName = typeof a === 'object' ? (a.uploaderName || null) : null;
    const uId   = typeof a === 'object' ? (a.uploaderId   || null) : null;
    let dispName = uName || '?';
    if (!uName && uId && WS.getUser) {
      const u = WS.getUser(uId);
      if (u) dispName = u.name;
    }
    return `<span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;
      background:var(--bg-tertiary);border:1px solid var(--border-color);
      font-size:11.5px;color:var(--text-secondary)">
      ${makeAvatar(dispName)}
      <span style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${name}</span>
      <button onclick="_removeExistingFile(${i})" title="삭제"
        style="background:none;border:none;cursor:pointer;padding:0;margin-left:2px;
               display:inline-flex;align-items:center;color:var(--text-muted);transition:color .15s"
        onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='var(--text-muted)'">
        <i data-lucide="x" style="width:11px;height:11px"></i>
      </button>
    </span>`;
  }).join('');

  const newHtml = window._instrFileArr.map((f, i) => {
    const dispName = me ? me.name : '?';
    return `<span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;
      background:rgba(79,110,247,.08);border:1px solid rgba(79,110,247,.3);
      font-size:11.5px;color:var(--text-primary)">
      ${makeAvatar(dispName)}
      <span style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${f.name}</span>
      <button onclick="_removeNewFile(${i})" title="삭제"
        style="background:none;border:none;cursor:pointer;padding:0;margin-left:2px;
               display:inline-flex;align-items:center;color:var(--text-muted);transition:color .15s"
        onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='var(--text-muted)'">
        <i data-lucide="x" style="width:11px;height:11px"></i>
      </button>
    </span>`;
  }).join('');

  // 담당자가 올린 파일 (다운로드 전용, 삭제 불가)
  const taskFiles = window._instrTaskFiles || [];
  const taskFilesHtml = taskFiles.map((a, i) => {
    const name = typeof a === 'string' ? a : (a.name || '');
    const uName = typeof a === 'object' ? (a.uploaderName || null) : null;
    const uId   = typeof a === 'object' ? (a.uploaderId   || null) : null;
    let dispName = uName || '?';
    if (!uName && uId && WS.getUser) { const u = WS.getUser(uId); if (u) dispName = u.name; }
    return `<span title="담당자 파일 (다운로드만 가능)" style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;
      background:rgba(167,139,250,.1);border:1px solid rgba(167,139,250,.35);
      font-size:11.5px;color:var(--text-secondary)">
      ${makeAvatar(dispName)}
      <span style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${name}</span>
      <button onclick="_downloadInstrTaskFile(${i})" title="다운로드"
        style="background:none;border:none;cursor:pointer;padding:0;margin-left:2px;
               display:inline-flex;align-items:center;color:#a78bfa;transition:opacity .15s"
        onmouseover="this.style.opacity='.6'" onmouseout="this.style.opacity='1'">
        <i data-lucide="download" style="width:11px;height:11px"></i>
      </button>
    </span>`;
  }).join('');

  listEl.innerHTML = existingHtml + taskFilesHtml + newHtml;
  setTimeout(refreshIcons, 30);
}

function _removeNewFile(idx) {
  if (!window._instrFileArr) return;
  window._instrFileArr.splice(idx, 1);
  renderInstrFileList();
}

function _removeExistingFile(idx) {
  if (!window._instrExistingFiles) return;
  window._instrExistingFiles.splice(idx, 1);
  renderInstrFileList();
}

/* 담당자(지시받은 사람)가 올린 파일 다운로드 */
function _downloadInstrTaskFile(idx) {
  var files = window._instrTaskFiles || [];
  var a = files[idx];
  if (!a) return;
  var name = typeof a === 'string' ? a : (a.name || '');
  var dataUrl = typeof a === 'object' ? (a.dataUrl || a.url || null) : null;
  if (dataUrl) {
    var link = document.createElement('a');
    link.href = dataUrl;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', '"' + name + '" 다운로드를 시작합니다.');
  } else {
    showToast('info', '"' + name + '" 파일은 서버에 저장된 파일이 아닙니다. 파일을 다시 첨부해 주세요.');
  }
}


/* ── 업무중요도 드래그 스크롤 ─────────────────────── */
var _impDragState = { active: false, startX: 0, scrollLeft: 0 };
function _impDragStart(e) {
  var el = document.getElementById('instrImportancePicks');
  if (!el) return;
  _impDragState.active = true;
  _impDragState.startX = e.pageX - el.getBoundingClientRect().left;
  _impDragState.scrollLeft = el.scrollLeft;
  el.style.cursor = 'grabbing';
  el.style.userSelect = 'none';
}
function _impDragMove(e) {
  if (!_impDragState.active) return;
  e.preventDefault();
  var el = document.getElementById('instrImportancePicks');
  if (!el) return;
  var x = e.pageX - el.getBoundingClientRect().left;
  var walk = (x - _impDragState.startX) * 1.4;
  el.scrollLeft = _impDragState.scrollLeft - walk;
}
function _impDragEnd() {
  _impDragState.active = false;
  var el = document.getElementById('instrImportancePicks');
  if (el) { el.style.cursor = 'grab'; el.style.userSelect = ''; }
}

/* ── 업무중요도 렌더: 선택→앞[아이콘만], 미선택→뒤[아이콘+텍스트] ── */
function _renderImportancePicks() {
  const container = document.getElementById('instrImportancePicks');
  if (!container) return;
  const importances = JSON.parse(localStorage.getItem('ws_instr_importances')) || [];
  if (importances.length === 0) {
    container.innerHTML = '<span style="font-size:11px;color:var(--text-muted);white-space:nowrap">기타설정에서 중요도를 추가하세요</span>';
    return;
  }
  const selected = window._instrImportances || [];
  const selItems   = importances.filter(i => selected.includes(i.name));
  const unselItems = importances.filter(i => !selected.includes(i.name));

  // 선택된 항목: 앞에, 채워진 원형 + 아이콘만
  const selHtml = selItems.map(imp => {
    const c = imp.color || '#ef4444';
    const hasIcon = imp.icon && imp.icon.length > 2;
    const inner = hasIcon
      ? `<i data-lucide="${imp.icon}" style="width:12px;height:12px;color:#fff"></i>`
      : `<span style="width:8px;height:8px;border-radius:50%;background:#fff;display:inline-block"></span>`;
    return `<span onclick="_toggleInstrImportancePick('${imp.name}')" title="${imp.name} (클릭하여 취소)"
      style="display:inline-flex;align-items:center;justify-content:center;
             width:28px;height:28px;border-radius:50%;flex-shrink:0;
             background:${c};border:2px solid ${c};cursor:pointer;
             transition:all .15s;box-shadow:0 2px 8px ${c}55">
      ${inner}
    </span>`;
  }).join('');

  // 미선택 항목: 뒤에, 아이콘+텍스트
  const unselHtml = unselItems.map(imp => {
    const c = imp.color || '#ef4444';
    const hasIcon = imp.icon && imp.icon.length > 2;
    const iconHtml = hasIcon
      ? `<i data-lucide="${imp.icon}" style="width:10px;height:10px;color:${c}"></i>`
      : '';
    return `<span onclick="_toggleInstrImportancePick('${imp.name}')" title="${imp.name}"
      style="display:inline-flex;align-items:center;gap:4px;padding:3px 9px;
             border-radius:20px;font-size:11px;font-weight:600;cursor:pointer;
             transition:all .15s;user-select:none;flex-shrink:0;white-space:nowrap;
             border:1.5px solid ${c};color:${c};background:transparent"
      onmouseover="this.style.background='${c}22'"
      onmouseout="this.style.background='transparent'">
      ${iconHtml}${imp.name}
    </span>`;
  }).join('');

  container.innerHTML = selHtml + (selHtml && unselHtml ? '<span style="width:1px;height:24px;background:var(--border-color);flex-shrink:0;margin:0 3px"></span>' : '') + unselHtml;
  setTimeout(refreshIcons, 30);
}

/* ── 업무중요도 토글 (새 방식) ─────────────────────── */
function _toggleInstrImportancePick(name) {
  if (!window._instrImportances) window._instrImportances = [];
  const idx = window._instrImportances.indexOf(name);
  if (idx !== -1) {
    window._instrImportances.splice(idx, 1); // 선택 취소 → 뒤로
  } else {
    window._instrImportances.push(name);     // 선택 → 앞으로
  }
  const impVal = document.getElementById('instrImportanceVal');
  if (impVal) impVal.value = window._instrImportances.join(', ');
  _renderImportancePicks();
}

/* 구 토글 함수 (하위호환) */
function _toggleInstrImportance(name, color, el) {
  _toggleInstrImportancePick(name);
}

/* 모달 닫기 */
function closeInstructionModal() {
  const m = document.getElementById('instructionModal');
  if (m) m.style.display = 'none';
  window._instrProcedures = [];
  window._instrSelectedReports = [];
  window._instrImportances = [];
  window._instrFileArr = [];
  window._instrExistingFiles = [];
}

/* 저장 */
function saveInstruction() {
  const dueEl    = document.getElementById('instrDueDate');
  const contEl   = document.getElementById('instrContent');
  const repEl    = document.getElementById('instrReport');
  const procEl   = document.getElementById('instrProcedureText');
  const impVal   = document.getElementById('instrImportanceVal');

  // chip 배열에서 값 읽기
  var selTasks    = window._instrSelectedTasks    || [];
  var selAssignees = window._instrSelectedAssignees || [];
  const taskId     = selTasks.length    ? String(selTasks[0].id)       : '';
  const taskName   = selTasks.length    ? selTasks.map(t=>t.name).join(', ')  : '';
  const assigneeId = selAssignees.length ? String(selAssignees[0].id)  : '';
  const assigneeName = selAssignees.length ? selAssignees.map(u=>u.name).join(', ') : '';

  const dueDate    = dueEl   ? dueEl.value   : '';
  const content    = contEl  ? contEl.value.trim() : '';
  const report     = repEl   ? repEl.value.trim()  : '';
  const procedure  = procEl  ? procEl.value   : '';
  const importance = impVal  ? impVal.value   : '';
  const scoreMinEl = document.getElementById('instrScoreMin');
  const scoreMaxEl = document.getElementById('instrScoreMax');
  const scoreMin   = scoreMinEl ? (parseInt(scoreMinEl.value) || 0) : 0;
  const scoreMax   = scoreMaxEl ? (parseInt(scoreMaxEl.value) || 0) : 0;
  const statusEl   = document.getElementById('instrStatus');
  const taskStatus = statusEl ? statusEl.value : '';

  const isEditMode = !!window._instrEditId;
  if (!isEditMode && !taskId)    { showToast('error', '업무를 선택하세요.');    return; }
  if (!isEditMode && !assigneeId){ showToast('error', '협조자를 선택하세요.'); return; }
  if (!dueDate)   { showToast('error', '완료계획일을 선택하세요.'); return; }
  if (!content)   { showToast('error', '업무설명을 입력하세요.'); return; }

  // 수정모드에서 값이 비어있으면 기존 editData에서 보완
  var finalTaskName = taskName;
  var finalAssigneeName = assigneeName;
  var finalTaskId = taskId;
  var finalAssigneeId = assigneeId;
  if (isEditMode && window._instrEditData) {
    if (!finalTaskName)     finalTaskName     = window._instrEditData.taskName     || '';
    if (!finalAssigneeName) finalAssigneeName = window._instrEditData.assigneeName || '';
    if (!finalTaskId)       finalTaskId       = window._instrEditData.taskId       || '';
    if (!finalAssigneeId)   finalAssigneeId   = window._instrEditData.assigneeId   || '';
  }

  const me2 = WS.currentUser;
  const attachments = [
    ...(window._instrExistingFiles || []).map(a =>
      typeof a === 'string'
        ? { name: a, uploaderId: null, uploaderName: null }
        : a
    ),
    ...(window._instrFileArr || []).map(f => ({
      name: f.name,
      uploaderId:   me2 ? me2.id   : null,
      uploaderName: me2 ? me2.name : null,
      size: f.size,
      addedAt: new Date().toISOString().split('T')[0]
    }))
  ];

  // ── ws_instructions 저장 (신규 or 수정)
  const instr = JSON.parse(localStorage.getItem('ws_instructions') || '[]');
  const curUserId = WS.currentUser ? WS.currentUser.id : 0;
  const editId = window._instrEditId || null;

  if (editId) {
    const idx = instr.findIndex(i => i.id === editId || i.id === Number(editId));
    if (idx !== -1) {
      // window._instrProcedures 배열 직접 사용 (UI에서 설정한 현재 순서)
      const liveProcs = window._instrProcedures || [];
      const derivedTags = liveProcs.length > 0
        ? liveProcs.slice()
        : (procedure ? procedure.split(/→|\|/).map(s => s.trim()).filter(Boolean) : (instr[idx].processTags || []));
      Object.assign(instr[idx], {
        taskId: finalTaskId, taskName: finalTaskName,
        assigneeId: Number(finalAssigneeId), assigneeName: finalAssigneeName,
        dueDate, content, report, procedure, importance, attachments,
        processTags: derivedTags,
        scoreMin, scoreMax,
        status: taskStatus || instr[idx].status || 'progress',
        taskStatus,
        isImportant: importance.length > 0,
        updatedAt: new Date().toISOString()
      });
    } else {
      instr.unshift({
        id: editId,
        taskId: finalTaskId, taskName: finalTaskName,
        assigneeId: Number(finalAssigneeId), assigneeName: finalAssigneeName,
        dueDate, content, report, procedure, importance, attachments,
        status: taskStatus || 'progress', taskStatus,
        progress: 0, team: '',
        isImportant: importance.length > 0,
        author: WS.currentUser ? WS.currentUser.name : '관리자',
        updatedAt: new Date().toISOString()
      });
    }
    localStorage.setItem('ws_instructions', JSON.stringify(instr));
    if (WS.tasks) {
      const ti = WS.tasks.findIndex(t => t.id === editId || t.id === Number(editId));
      if (ti !== -1) {
        Object.assign(WS.tasks[ti], {
          title: finalTaskName,
          assigneeIds: [Number(finalAssigneeId)],
          dueDate, status: taskStatus || WS.tasks[ti].status || 'progress',
          isImportant: importance.length > 0
        });
      }
    }
  } else {
    const newId = Date.now();
    // window._instrProcedures 배열 직접 사용
    const liveNewProcs = window._instrProcedures || [];
    const newProcTags = liveNewProcs.length > 0
      ? liveNewProcs.slice()
      : (procedure ? procedure.split(/→|\|/).map(s => s.trim()).filter(Boolean) : []);
    const newItem = {
      id: newId,
      taskId: finalTaskId, taskName: finalTaskName,
      assigneeId: Number(finalAssigneeId), assigneeName: finalAssigneeName,
      dueDate, content, report, procedure, importance, attachments,
      processTags: newProcTags,
      scoreMin, scoreMax,
      status: taskStatus || 'progress', taskStatus,
      progress: 0, team: '',
      isImportant: importance.length > 0,
      author: WS.currentUser ? WS.currentUser.name : '관리자',
      createdAt: new Date().toISOString()
    };
    instr.unshift(newItem);
    localStorage.setItem('ws_instructions', JSON.stringify(instr));
    if (!WS.tasks) WS.tasks = [];
    WS.tasks.push({
      id: newId, title: finalTaskName, team: '',
      assigneeIds: [Number(finalAssigneeId)],
      assignerId: curUserId,
      dueDate, status: 'progress', progress: 0,
      isImportant: newItem.isImportant
    });
  }

  // ── 내가 지시한 업무 리스트 재렌더 (ID: accBody_byMe)
  const byMeEl = document.getElementById('accBody_byMe');
  if (byMeEl && typeof buildAssignedByMeBody === 'function') {
    byMeEl.innerHTML = buildAssignedByMeBody();
    setTimeout(refreshIcons, 50);
  }
  // ── 카운트 배지 업데이트
  const accCard = document.getElementById('accCard_byMe');
  if (accCard) {
    const badge = accCard.querySelector('.section-count');
    if (badge) badge.textContent = WS.getAssignedByMe().length + '건';
  }

  showToast('success', '지시사항이 등록되었습니다.');
  closeInstructionModal();
}


/* =======================================================
   업무선택 / 담당자선택 컴 피커 함수
   ======================================================= */

/* 업무선택 입력박스 렌더 */
function _renderInstrTaskBox() {
  var box = document.getElementById('instrTaskBox');
  var hidden = document.getElementById('instrTask');
  if (!box) return;
  var sel = window._instrSelectedTasks || [];
  if (sel.length === 0) {
    box.innerHTML = '<span style="color:var(--text-muted);font-size:12.5px;font-weight:500;padding:2px 4px;border-radius:20px;border:1.5px dashed var(--border-color);background:var(--bg-tertiary);display:inline-flex;align-items:center;gap:4px"><span style="font-size:11px">💼</span>업무를 선택하세요</span>';
  } else {
    box.innerHTML = sel.map(function(t){
      return '<span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;' +
        'background:var(--accent-blue);color:#fff;font-size:12px;font-weight:600;white-space:nowrap;flex-shrink:0">' +
        t.name +
        '<span onclick="event.stopPropagation();_removeInstrTask(\'' + t.id + '\')" style="cursor:pointer;opacity:.8;font-size:13px;line-height:1;margin-left:2px">×</span>' +
        '</span>';
    }).join('');
  }
  if (hidden) hidden.value = sel.map(function(t){ return t.id; }).join(',');
}

/* 담당자선택 입력박스 렌더 */
function _renderInstrAssigneeBox() {
  var box = document.getElementById('instrAssigneeBox');
  var hidden = document.getElementById('instrAssignee');
  if (!box) return;
  var sel = window._instrSelectedAssignees || [];
  if (sel.length === 0) {
    box.innerHTML = '<span style="color:var(--text-muted);font-size:12.5px;font-weight:500;padding:2px 4px;border-radius:20px;border:1.5px dashed var(--border-color);background:var(--bg-tertiary);display:inline-flex;align-items:center;gap:4px"><span style="font-size:11px">👤</span>담당자를 선택하세요</span>';
  } else {
    box.innerHTML = sel.map(function(u){
      return '<span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;' +
        'background:#9747ff;color:#fff;font-size:12px;font-weight:600;white-space:nowrap;flex-shrink:0">' +
        u.name + (u.dept ? ' <span style="opacity:.75;font-size:10.5px">(' + u.dept + ')</span>' : '') +
        '<span onclick="event.stopPropagation();_removeInstrAssignee(\'' + u.id + '\')" style="cursor:pointer;opacity:.8;font-size:13px;line-height:1;margin-left:2px">×</span>' +
        '</span>';
    }).join('');
  }
  if (hidden) hidden.value = sel.map(function(u){ return u.id; }).join(',');
}

/* 업무 컴 제거 */
function _removeInstrTask(id) {
  window._instrSelectedTasks = (window._instrSelectedTasks || []).filter(function(t){ return String(t.id) !== String(id); });
  _renderInstrTaskBox();
}

/* 담당자 컴 제거 */
function _removeInstrAssignee(id) {
  window._instrSelectedAssignees = (window._instrSelectedAssignees || []).filter(function(u){ return String(u.id) !== String(id); });
  _renderInstrAssigneeBox();
}

/* 업무선택 팝업 열기 */
function _openInstrTaskPopup() {
  var popup = document.getElementById('instrTaskPopup');
  var box   = document.getElementById('instrTaskBox');
  if (!popup || !box) return;
  // 다른 팝업 닫기
  var ap = document.getElementById('instrAssigneePopup');
  if (ap) ap.style.display = 'none';

  var rect = box.getBoundingClientRect();
  popup.style.display = 'flex';
  popup.style.top  = (rect.bottom + 4) + 'px';
  popup.style.left = rect.left + 'px';

  // 리스트 채우기
  var detailList = WS.detailTasks || JSON.parse(localStorage.getItem('ws_detail_tasks') || '[]');
  _renderInstrTaskList(detailList, '');

  var searchEl = document.getElementById('instrTaskSearch');
  if (searchEl) { searchEl.value = ''; searchEl.focus(); }

  // 외부 클릭 시 닫기
  setTimeout(function(){
    document.addEventListener('click', _closeInstrTaskPopupOutside, { once: true, capture: true });
  }, 10);
}

function _closeInstrTaskPopupOutside(e) {
  var popup = document.getElementById('instrTaskPopup');
  var box   = document.getElementById('instrTaskBox');
  if (popup && box && !popup.contains(e.target) && !box.contains(e.target)) {
    popup.style.display = 'none';
  } else {
    document.addEventListener('click', _closeInstrTaskPopupOutside, { once: true, capture: true });
  }
}

function _renderInstrTaskList(list, filterText) {
  var listEl = document.getElementById('instrTaskList');
  if (!listEl) return;
  var filtered = filterText
    ? list.filter(function(d){ return d.name.toLowerCase().includes(filterText.toLowerCase()); })
    : list;
  var sel = window._instrSelectedTasks || [];
  var selIds = sel.map(function(t){ return String(t.id); });
  if (filtered.length === 0) {
    listEl.innerHTML = '<div style="padding:8px 10px;font-size:12px;color:var(--text-muted)">업무가 없습니다.</div>';
    return;
  }
  listEl.innerHTML = filtered.map(function(d){
    var id = String(d.id || d.name);
    var isOn = selIds.includes(id);
    return '<div onclick="_toggleInstrTask(\'' + id + '\',\'' + d.name.replace(/'/g,'\\&#39;') + '\')"' +
      ' style="padding:8px 12px;border-radius:8px;cursor:pointer;font-size:12.5px;' +
      'display:flex;align-items:center;justify-content:space-between;' +
      'background:' + (isOn ? 'var(--accent-blue-light)' : 'transparent') + ';' +
      'color:' + (isOn ? 'var(--accent-blue)' : 'var(--text-primary)') + ';' +
      'font-weight:' + (isOn ? '700' : '400') + ';transition:.12s"' +
      ' onmouseover="if(!this.classList.contains(\'on\'))this.style.background=\'var(--bg-tertiary)\'"' +
      ' onmouseout="this.style.background=\'' + (isOn?'var(--accent-blue-light)':'transparent') + '\'">' +
      d.name +
      (isOn ? '<span style="font-size:14px;color:var(--accent-blue)">✓</span>' : '') +
      '</div>';
  }).join('');
}

function _toggleInstrTask(id, name) {
  window._instrSelectedTasks = window._instrSelectedTasks || [];
  var idx = window._instrSelectedTasks.findIndex(function(t){ return String(t.id) === String(id); });
  if (idx >= 0) {
    window._instrSelectedTasks.splice(idx, 1);
  } else {
    window._instrSelectedTasks.push({ id: id, name: name });
  }
  _renderInstrTaskBox();
  // 리스트 새로고침
  var detailList = WS.detailTasks || JSON.parse(localStorage.getItem('ws_detail_tasks') || '[]');
  var searchEl = document.getElementById('instrTaskSearch');
  _renderInstrTaskList(detailList, searchEl ? searchEl.value : '');
}

function _filterInstrTask(val) {
  var detailList = WS.detailTasks || JSON.parse(localStorage.getItem('ws_detail_tasks') || '[]');
  _renderInstrTaskList(detailList, val);
}

/* 담당자선택 팝업 열기 */
function _openInstrAssigneePopup() {
  var popup = document.getElementById('instrAssigneePopup');
  var box   = document.getElementById('instrAssigneeBox');
  if (!popup || !box) return;
  var tp = document.getElementById('instrTaskPopup');
  if (tp) tp.style.display = 'none';

  var rect = box.getBoundingClientRect();
  popup.style.display = 'flex';
  popup.style.top  = (rect.bottom + 4) + 'px';
  popup.style.left = rect.left + 'px';

  _renderInstrAssigneeList(WS.users || [], '');

  var searchEl = document.getElementById('instrAssigneeSearch');
  if (searchEl) { searchEl.value = ''; searchEl.focus(); }

  setTimeout(function(){
    document.addEventListener('click', _closeInstrAssigneePopupOutside, { once: true, capture: true });
  }, 10);
}

function _closeInstrAssigneePopupOutside(e) {
  var popup = document.getElementById('instrAssigneePopup');
  var box   = document.getElementById('instrAssigneeBox');
  if (popup && box && !popup.contains(e.target) && !box.contains(e.target)) {
    popup.style.display = 'none';
  } else {
    document.addEventListener('click', _closeInstrAssigneePopupOutside, { once: true, capture: true });
  }
}

function _renderInstrAssigneeList(list, filterText) {
  var listEl = document.getElementById('instrAssigneeList');
  if (!listEl) return;
  var filtered = filterText
    ? list.filter(function(u){ return (u.name + (u.dept||'')).toLowerCase().includes(filterText.toLowerCase()); })
    : list;
  var sel = window._instrSelectedAssignees || [];
  var selIds = sel.map(function(u){ return String(u.id); });
  if (filtered.length === 0) {
    listEl.innerHTML = '<div style="padding:8px 10px;font-size:12px;color:var(--text-muted)">담당자가 없습니다.</div>';
    return;
  }
  listEl.innerHTML = filtered.map(function(u){
    var isOn = selIds.includes(String(u.id));
    var avatarColor = u.color || '#9747ff';
    return '<div onclick="_toggleInstrAssignee(' + u.id + ',\'' + u.name + '\',\'' + (u.dept||'') + '\')"' +
      ' style="padding:7px 10px;border-radius:8px;cursor:pointer;' +
      'display:flex;align-items:center;gap:9px;' +
      'background:' + (isOn ? 'rgba(151,71,255,.1)' : 'transparent') + ';' +
      'transition:.12s"' +
      ' onmouseover="if(!this.dataset.on)this.style.background=\'var(--bg-tertiary)\'"' +
      ' onmouseout="this.style.background=\'' + (isOn ? 'rgba(151,71,255,.1)' : 'transparent') + '\'">' +
      '<div style="width:28px;height:28px;border-radius:50%;background:' + avatarColor + ';' +
      'color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">' +
      (u.avatar || u.name.substring(0,2)) + '</div>' +
      '<div style="flex:1;min-width:0">' +
      '<div style="font-size:12.5px;font-weight:' + (isOn?'700':'500') + ';color:' + (isOn?'#9747ff':'var(--text-primary)') + '">' + u.name + '</div>' +
      '<div style="font-size:10.5px;color:var(--text-muted)">' + (u.dept||'') + (u.role?' · '+u.role:'') + '</div>' +
      '</div>' +
      (isOn ? '<span style="font-size:14px;color:#9747ff">✓</span>' : '') +
      '</div>';
  }).join('');
}

function _toggleInstrAssignee(id, name, dept) {
  window._instrSelectedAssignees = window._instrSelectedAssignees || [];
  var idx = window._instrSelectedAssignees.findIndex(function(u){ return String(u.id) === String(id); });
  if (idx >= 0) {
    window._instrSelectedAssignees.splice(idx, 1);
  } else {
    window._instrSelectedAssignees.push({ id: id, name: name, dept: dept });
  }
  _renderInstrAssigneeBox();
  _renderInstrAssigneeList(WS.users || [], document.getElementById('instrAssigneeSearch') ? document.getElementById('instrAssigneeSearch').value : '');
}

function _filterInstrAssignee(val) {
  _renderInstrAssigneeList(WS.users || [], val);
}

/* 삭제 */
function deleteInstruction(id) {
  let instructions = JSON.parse(localStorage.getItem('ws_instructions') || '[]');
  instructions = instructions.filter(i => i.id !== id);
  localStorage.setItem('ws_instructions', JSON.stringify(instructions));
  showToast('info', '삭제되었습니다.');
}

/* ══════════════════════════════════════════════
   첨부파일 섹션 - 업무 상세 팝업 (taskDetailModal)
   - 내가 등록한 파일: 추가/삭제 가능
   - 다른 사람이 등록한 파일: 보기만 가능 (삭제 불가)
══════════════════════════════════════════════ */

/* 첨부파일 목록 HTML 생성 */
function _buildTaskAttachHTML(t) {
  var meId = WS.currentUser ? WS.currentUser.id : null;
  var attaches = t.attachments || [];
  // attachments가 [{name, uploaderId, size}] 또는 [name문자열] 모두 처리
  if (!attaches.length) {
    return '<span style="font-size:12px;color:var(--text-muted)">등록된 첨부파일이 없습니다</span>';
  }
  var avatarPalette = ['#4f6ef7','#22c55e','#f97316','#a855f7','#ec4899','#14b8a6'];
  return attaches.map(function(a, idx) {
    var name     = typeof a === 'string' ? a : (a.name || '');
    var uploader = typeof a === 'object' ? (a.uploaderId   || null) : null;
    var uName    = typeof a === 'object' ? (a.uploaderName || null) : null;
    var isMine   = !uploader || (meId && String(uploader) === String(meId));

    // 등록자 이름 확정 (uploaderName 우선, 없으면 WS.getUser 조회)
    var dispName = uName || (isMine && WS.currentUser ? WS.currentUser.name : '?');
    if (!uName && uploader && WS.getUser) {
      var found = WS.getUser(uploader);
      if (found) dispName = found.name;
    }
    var initials  = (dispName && dispName !== '?') ? dispName.slice(0,2) : '?';
    var aColor    = (dispName && dispName !== '?')
      ? avatarPalette[dispName.charCodeAt(0) % avatarPalette.length]
      : '#94a3b8';

    // 아바타 HTML
    var avatar = '<span title="' + dispName + '" style="'
      + 'display:inline-flex;align-items:center;justify-content:center;'
      + 'width:20px;height:20px;border-radius:50%;flex-shrink:0;'
      + 'background:' + aColor + ';font-size:9px;font-weight:800;color:#fff;'
      + 'letter-spacing:.3px">' + initials + '</span>';

    var bgStyle = isMine
      ? 'background:rgba(79,110,247,.08);border:1px solid rgba(79,110,247,.3);'
      : 'background:var(--bg-secondary);border:1px solid var(--border-color);';

    var actionBtn = isMine
      ? '<button onclick="_removeTaskAttachment(\'' + t.id + '\',' + idx + ')" title="삭제" '
        + 'style="background:none;border:none;cursor:pointer;padding:0;margin-left:2px;'
        + 'display:inline-flex;align-items:center;color:var(--text-muted);transition:color .15s" '
        + 'onmouseover="this.style.color=\'#ef4444\'" onmouseout="this.style.color=\'var(--text-muted)\'">'
        + '<i data-lucide="x" style="width:11px;height:11px"></i></button>'
      : '<button onclick="_downloadTaskAttachment(\'' + t.id + '\',' + idx + ')" title="다운로드" '
        + 'style="background:none;border:none;cursor:pointer;padding:0;margin-left:2px;'
        + 'display:inline-flex;align-items:center;color:var(--accent-blue);transition:color .15s" '
        + 'onmouseover="this.style.opacity=\'.7\'" onmouseout="this.style.opacity=\'1\'">'
        + '<i data-lucide="download" style="width:11px;height:11px"></i></button>';

    return '<span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;'
      + bgStyle + 'font-size:11.5px;color:var(--text-primary)">'
      + avatar
      + '<span style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + name + '</span>'
      + actionBtn
      + '</span>';
  }).join('');
}

/* 첨부파일 추가 */
function _addTaskAttachment(taskId, input) {
  var t = WS.getTask(taskId);
  if (!t) return;
  var me = WS.currentUser;
  if (!t.attachments) t.attachments = [];
  Array.from(input.files).forEach(function(f) {
    var dup = t.attachments.some(function(a) {
      return (typeof a === 'string' ? a : a.name) === f.name;
    });
    if (!dup) {
      t.attachments.push({
        name: f.name,
        uploaderId: me ? me.id : null,
        uploaderName: me ? me.name : '본인',
        size: f.size,
        addedAt: new Date().toISOString().split('T')[0]
      });
    }
  });
  input.value = '';
  WS.saveTasks();
  var listEl = document.getElementById('taskAttachList_' + taskId);
  if (listEl) {
    listEl.innerHTML = _buildTaskAttachHTML(t);
    if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 30);
  }
  showToast('success', '파일이 추가됐습니다.');
}

/* 내가 등록한 첨부파일 삭제 */
function _removeTaskAttachment(taskId, idx) {
  var t = WS.getTask(taskId);
  if (!t || !t.attachments) return;
  var a = t.attachments[idx];
  var me = WS.currentUser;
  var uploader = typeof a === 'object' ? a.uploaderId : null;
  // 내가 등록한 파일만 삭제 허용
  if (uploader && me && String(uploader) !== String(me.id)) {
    showToast('warning', '다른 사람이 등록한 파일은 삭제할 수 없습니다.');
    return;
  }
  t.attachments.splice(idx, 1);
  WS.saveTasks();
  var listEl = document.getElementById('taskAttachList_' + taskId);
  if (listEl) {
    listEl.innerHTML = _buildTaskAttachHTML(t);
    if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 30);
  }
  showToast('success', '파일이 삭제됐습니다.');
}

/* 다른 사람이 등록한 첨부파일 다운로드 */
function _downloadTaskAttachment(taskId, idx) {
  var t = WS.getTask(taskId);
  if (!t || !t.attachments) return;
  var a = t.attachments[idx];
  var name = typeof a === 'string' ? a : (a ? a.name : '');

  // blob/dataUrl이 저장되어 있는 경우 실제 다운로드
  var dataUrl = typeof a === 'object' ? (a.dataUrl || a.url || null) : null;
  if (dataUrl) {
    var link = document.createElement('a');
    link.href = dataUrl;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', '"' + name + '" 다운로드를 시작합니다.');
    return;
  }

  // 파일 데이터가 없는 경우 (파일명만 저장된 경우)
  showToast('info', '"' + name + '" 파일은 서버에 저장된 파일이 아닙니다. 파일을 다시 첨부해 주세요.');
}
