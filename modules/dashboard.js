/**
 * modules/dashboard.js -- 대시보드 렌더링 및 알림 모듈
 * app.js에서 분리된 대시보드 전용 모듈
 */

function renderNotifBadge() {
  const cnt = WS.unreadCount();
  const el = document.getElementById('notifBadge');
  el.textContent = cnt;
  el.style.display = cnt > 0 ? 'flex' : 'none';
}
function renderNotifList() {
  const icons = { delay:'alert-triangle', new:'plus-circle', progress:'trending-up', done:'check-circle-2', info:'info' };
  const list = document.getElementById('notifList');
  if (!list) return;
  list.innerHTML = WS.notifications.map(n => `
    <div class="dropdown-item" style="${n.read?'opacity:.5':''}">
      <span class="icon-${n.type}"><i data-lucide="${icons[n.type]||'bell'}" class="icon-sm"></i></span>
      <div>
        <div style="font-size:12px;font-weight:600;color:var(--text-primary)">${n.msg}</div>
        <div style="font-size:10.5px;color:var(--text-muted)">${n.time}</div>
      </div>
    </div>`).join('');
  refreshIcons();
}

/* ?? 寃???? */
function handleSearch(val) {
  if (!val.trim()) return;
  const results = WS.tasks.filter(t => {
    const ids = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
    return t.title.includes(val) || ids.some(uid => WS.getUser(uid)?.name.includes(val));
  });
  showToast('info', `<i data-lucide="search"></i> "${val}" 검색 결과: ${results.length}건`);
}

/* ?? ??쒕낫???뚮뜑留??? */
function renderDashboard() {
  const u = WS.currentUser;
  const sub = document.getElementById('dashSubtitle');
  if(sub) sub.textContent = `반갑습니다! ${u.name} ${u.role}님 오늘도 좋은 하루 되세요!`;
  renderStats();
  renderDashGrid();
}

function renderStats() {
  const el = document.getElementById('statsRow');
  if(!el) return;
  const all = WS.tasks;
  const mine = WS.getAssignedToMe();
  const delayed = all.filter(t=>t.status==='delay').length;
  const today = WS.getTodayTasks().length;
  const done = all.filter(t=>t.status==='done').length;
  el.innerHTML = `
    <div class="stat-card">
      <div class="stat-icon" style="background:rgba(79,110,247,.12);color:#4f6ef7"><i data-lucide="clipboard-list"></i></div>
      <div><div class="s-value">${all.length}</div><div class="s-label">전체 업무</div><div class="s-change" style="color:#22c55e">이번달 업무 현황</div></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:rgba(6,182,212,.12);color:#06b6d4"><i data-lucide="play-circle"></i></div>
      <div><div class="s-value">${all.filter(t=>t.status==='progress').length}</div><div class="s-label">진행 중</div><div class="s-change" style="color:#4f6ef7">현재 수행 업무</div></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:rgba(239,68,68,.12);color:#ef4444"><i data-lucide="alert-triangle"></i></div>
      <div><div class="s-value">${delayed}</div><div class="s-label">지연 업무</div><div class="s-change" style="color:${delayed>0?'#ef4444':'#22c55e'}">${delayed>0?'즉시 조치 필요':'정상 범위'}</div></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:rgba(245,158,11,.12);color:#f59e0b"><i data-lucide="zap"></i></div>
      <div><div class="s-value">${today}</div><div class="s-label">D-Day 업무</div><div class="s-change" style="color:${today>0?'#f59e0b':'#22c55e'}">${today>0?'오늘 마감!':'없음'}</div></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:rgba(34,197,94,.12);color:#22c55e"><i data-lucide="check-circle-2"></i></div>
      <div><div class="s-value">${done}</div><div class="s-label">완료 업무</div><div class="s-change" style="color:#22c55e">이번달 누적</div></div>
    </div>`;
  refreshIcons();
}

function renderDashGrid() {
  const el = document.getElementById('dashGrid');
  if(!el) return;

  el.innerHTML = `
    ${buildGantt()}
    <div class="dash-main-grid">
      <div class="dash-chat-area">
        ${buildChatWidget()}
      </div>
      <div class="dash-left-col" id="dashAccordionCol" style="height:600px">
        ${buildAccordionCard('byMe',     '#4f6ef7', 'send',         '내가 지시한 리스트',      getByMeCount(),       buildAssignedByMeBody())}
        ${buildAccordionCard('received', '#9747ff', 'download',     '내가 지시받은 업무',    getReceivedCount(),   buildReceivedBody())}
        ${buildAccordionCard('schedule', '#06b6d4', 'calendar',     '내가 기획한 내업무',    getScheduleCount(),   buildScheduleBody())}
        ${buildAccordionCard('dueToday', '#ef4444', 'alert-circle', '오늘이 마감인 업무',    getDueTodayCount(),   buildDueTodayBody())}
      </div>
    </div>
  `;

  const chatBody = document.getElementById('chatBody');
  if(chatBody) chatBody.scrollTop = chatBody.scrollHeight;
  refreshIcons();
}

function getByMeCount()       { return WS.getAssignedByMe().length; }
function getReceivedCount()   { return WS.getAssignedToMe().length; }
function getScheduleCount()   { return (WS.tasks||[]).filter(function(t){ return t.isSchedule || (!t.assignerId && !t.assigneeId && !t.assigneeIds); }).length; }
function getDueTodayCount()   {
  var today2 = new Date(); today2.setHours(0,0,0,0);
  return (WS.tasks||[]).filter(function(t){
    var d = new Date(t.dueDate); d.setHours(0,0,0,0);
    return d.getTime() === today2.getTime() && t.status !== 'done';
  }).length;
}

window._dashAccordion = window._dashAccordion || 'byMe';

function buildAccordionCard(key, color, icon, title, count, bodyHTML) {
  const isOpen = window._dashAccordion === key;
  const countCls = key === 'dueToday' && count > 0 ? 'style="background:rgba(239,68,68,.12);color:#ef4444"' : '';
  return `
    <div class="acc-card ${isOpen ? 'open' : ''}" id="accCard_${key}">
      <div class="acc-head" onclick="toggleDashAccordion('${key}')">
        <div class="section-title-group">
          <div class="section-dot" style="background:${color}"><i data-lucide="${icon}"></i></div>
          <div class="section-title">${title}</div>
          <span class="section-count" ${countCls}>${count}건</span>
        </div>
        <span class="acc-chevron"><i data-lucide="${isOpen ? 'chevron-up' : 'chevron-down'}"></i></span>
      </div>
      <div class="acc-body" id="accBody_${key}">
        ${bodyHTML}
      </div>
    </div>
  `;
}

function toggleDashAccordion(key) {
  if (window._dashAccordion === key) return;
  window._dashAccordion = key;
  document.querySelectorAll('.acc-card').forEach(function(card) {
    const k = card.id.replace('accCard_', '');
    const open = k === key;
    card.classList.toggle('open', open);
    const chev = card.querySelector('.acc-chevron');
    if (chev) chev.innerHTML = '<i data-lucide="' + (open ? 'chevron-up' : 'chevron-down') + '"></i>';
    // body 업데이트
    const bodyEl = document.getElementById('accBody_' + k);
    if (bodyEl && open) {
      bodyEl.style.display = 'block';
      // 실제 콘텐츠 리렌더
      if (k === 'byMe')     bodyEl.innerHTML = buildAssignedByMeBody();
      if (k === 'received') bodyEl.innerHTML = buildReceivedBody();
      if (k === 'schedule') bodyEl.innerHTML = buildScheduleBody();
      if (k === 'dueToday') bodyEl.innerHTML = buildDueTodayBody();
    }
  });
  refreshIcons();
}

/* ── 내가 지시받은 업무 Body (테이블 스타일) */
/* ══════════════════════════════════════════════
   업무 클릭 라우터: 본인이 작성한 업무 → 수정 UI (editInstruction)
                   타인이 작성한 업무 → 진행 보고 UI (openReceivedTaskDetail)
══════════════════════════════════════════════ */
function _openTaskOrEdit(taskId, assignerId) {
  var me = WS.currentUser ? String(WS.currentUser.id) : null;
  // task 객체에서 작성자 필드를 직접 확인 (다양한 필드명 대비)
  var task = (WS.getTask ? WS.getTask(taskId) : null)
    || (WS.tasks||[]).find(function(t){ return String(t.id)===String(taskId); });
  var aidFromTask = task
    ? String(task.assignerId || task.creatorId || task.registerId || task.ownerId || '')
    : '';
  var effective = String(assignerId || aidFromTask || '');
  // 작성자 == 나이거나, 작성자 정보가 아예 없으면(본인 등록 스케줄) editInstruction 열기
  var isMine = me && (effective === me || effective === '');
  if (isMine) {
    if (typeof editInstruction === 'function') editInstruction(taskId);
  } else {
    // 다른 사람이 작성한 업무 - 지시자 정보와 함께 안내 메시지 표시
    var taskName = task ? (task.title || task.taskName || '') : '';
    var assigner = (WS.getUser && effective) ? WS.getUser(effective) : null;
    var assignerLabel = '';
    if (assigner) {
      var parts = [assigner.name];
      if (assigner.dept)  parts.push(assigner.dept);
      if (assigner.role)  parts.push(assigner.role);
      assignerLabel = parts.join(' ');
    } else {
      assignerLabel = '업무 지시자';
    }
    var msg = '\u26d4 "' + taskName + '" \uc5c5\ubb34\ub97c \uc218\uc815\ud560 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4.\n\uc218\uc815\uc740 ' + assignerLabel + '\ub2d8\uaed8 \ub9d0\uc528\ud558\uc2dc\uae38 \ubc14\ub78d\ub2c8\ub2e4.';
    showToast('warning', msg, 4000);
  }
}

function buildReceivedBody() {
  const tasks = WS.getAssignedToMe().sort(function(a,b){
    const po={high:0,medium:1,low:2};
    return (po[a.priority]||1)-(po[b.priority]||1);
  });
  // 실제 데이터 없으면 샘플
  var allTasks = tasks.length > 0 ? tasks : [
    {id:'s1',title:'판매 보고서 작성',team:'영업팀',status:'progress',progress:40,dueDate:new Date(Date.now()+3*86400000).toISOString(),assignerId:null,_sample:true},
    {id:'s2',title:'신규 고객 덕 인터뷰',team:'직영팅',status:'waiting',progress:0,dueDate:new Date(Date.now()+7*86400000).toISOString(),assignerId:null,_sample:true},
    {id:'s3',title:'월간 성과 데이터 불러오기',team:'마케팅팀',status:'progress',progress:75,dueDate:new Date(Date.now()+1*86400000).toISOString(),assignerId:null,_sample:true},
    {id:'s4',title:'가격표 검토 및 검토',team:'구매팀',status:'waiting',progress:10,dueDate:new Date(Date.now()+5*86400000).toISOString(),assignerId:null,_sample:true},
  ];
  if(tasks.length===0 && arguments[0]==='noSample') return '<div class="empty-state"><div class="es-icon"><i data-lucide="sparkles"></i></div><div class="es-text">지시받은 업무가 없습니다</div></div>';

  // 지시중요도 설정 & ws_instructions 로드
  const allImportances = JSON.parse(localStorage.getItem('ws_instr_importances') || '[]');
  const instrList = JSON.parse(localStorage.getItem('ws_instructions') || '[]');

  const rows = allTasks.map(function(t) {
    const assigner = t._sample ? null : WS.getUser(t.assignerId);
    const dd = WS.getDdayBadge(t.dueDate);
    const fillCls = t.status==='delay'?'delay':t.status==='done'?'done':'';
    const sampleTag = t._sample ? '<span style="font-size:9px;background:#9747ff22;color:#9747ff;border-radius:4px;padding:0 4px;margin-left:4px">샘플</span>' : '';

    // ws_instructions에서 중요도 매칭
    var instrRecord = instrList.find(function(i){ return i.id===t.id || i.id===Number(t.id); });
    var importanceStr = (instrRecord && instrRecord.importance) ? instrRecord.importance : (t.importance || '');
    var taskImpNames = importanceStr ? importanceStr.split(',').map(function(s){ return s.trim(); }).filter(Boolean) : [];
    var importanceBadges = taskImpNames.length > 0
      ? taskImpNames.map(function(name) {
          var imp = allImportances.find(function(i){ return i.name===name; });
          var c = imp ? (imp.color||'#ef4444') : '#9ca3af';
          var icon = imp ? imp.icon : '';
          var hasIcon = icon && icon.length > 2;
          var inner = hasIcon ? '<i data-lucide="' + icon + '" style="width:12px;height:12px;color:' + c + '"></i>' : '<span style="width:7px;height:7px;border-radius:50%;background:' + c + ';display:inline-block"></span>';
          return '<span title="' + name + '" style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:' + c + '18;border:1.5px solid ' + c + ';cursor:default;flex-shrink:0">' + inner + '</span>';
        }).join('')
      : '<span style="font-size:11px;color:var(--text-muted)">-</span>';
    var barColor = t.status==='done'?'#22c55e':t.status==='delay'?'#ef4444':'var(--accent-blue)';
    var progressCell = '<div style="display:flex;align-items:center;gap:5px"><div style="position:relative;width:60px;height:6px;background:var(--border-color);border-radius:100px;overflow:hidden;flex-shrink:0"><div style="position:absolute;left:0;top:0;width:' + t.progress + '%;height:100%;border-radius:100px;background:' + barColor + ';transition:width .4s"></div></div><span style="font-size:10.5px;font-weight:700;color:var(--text-primary);min-width:28px;text-align:right">' + t.progress + '%</span></div>';
    var assignerCell = assigner
      ? '<td onclick="event.stopPropagation();openTaskChatChannel(\'' + t.title + '\',' + t.id + ',' + (t.assignerId||'') + ')" title="클릭하여 메시지 채널 열기" style="cursor:pointer"><div class="avatar-group"><div class="avatar" style="background:linear-gradient(135deg,' + (assigner.color||'#9747ff') + ',#4f6ef7)">' + (assigner.avatar||'?') + '</div></div><div style="font-size:11px;color:var(--currentAccent,#9747ff);margin-top:2px;font-weight:600;text-decoration:underline dotted;text-underline-offset:2px">' + assigner.name + '</div></td>'
      : '<td><div style="font-size:11px;color:var(--text-muted)">지시자</div></td>';
    // 샘플 업무도 WS.tasks에 등록하여 openReceivedTaskDetail로 팝업 열기
    if (t._sample && !WS.getTask(t.id)) {
      t.isSchedule = true;
      WS.tasks.push(t);
    }
    return '<tr style="cursor:pointer" onclick="_openTaskOrEdit(\'' + t.id + '\',\'' + (t.assignerId||'') + '\')">'
      + '<td style="width:25%"><div style="display:flex;align-items:center;gap:6px">'
      + (t.isImportant ? '<span class="star-icon"><i data-lucide="star"></i></span>' : '')
      + '<span style="font-weight:600;font-size:12.5px">' + t.title + '</span>' + sampleTag + '</div>'
      + '<div style="font-size:11px;color:var(--text-muted);margin-top:2px">' + (t.team||'') + '</div></td>'
      + assignerCell
      + '<td onclick="event.stopPropagation();' + (t._sample ? '' : "_openTaskOrEdit('" + t.id + "','" + (t.assignerId||'') + "')") + '" style="cursor:' + (t._sample ? 'default' : 'pointer') + '" title="' + (t._sample ? '' : '클릭하여 상세보기') + '">' + _renderStatusBadge(t.status) + '</td>'
      + '<td onclick="event.stopPropagation();' + (t._sample ? '' : "openReceivedTaskDetail('" + t.id + "')") + '" style="cursor:' + (t._sample ? 'default' : 'pointer') + '" title="吏꾪뻾???대┃?섏뿬 ?낅Т吏꾪뻾 UI ?닿린">' + progressCell + '</td>'
      + '<td style="pointer-events:none"><span class="dday-badge ' + dd.cls + '">' + dd.label + '</span></td>'
      + '<td onclick="event.stopPropagation()"><div style="display:flex;gap:3px;align-items:center;flex-wrap:nowrap">' + importanceBadges + '</div></td>'
      + '</tr>';
  }).join('');
  return '<div style="padding:8px"><table class="task-table"><thead><tr><th style="width:25%">업무명</th><th>지시자</th><th>상태</th><th>진행률</th><th>마감일</th><th>지시중요도</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
}

/* ── 협업자 아바타 겹침 렌더 헬퍼 */
function _buildAvatarStack(avatarHtmlArr) {
  if (!avatarHtmlArr || avatarHtmlArr.length === 0) return '<span style="font-size:11px;color:var(--text-muted)">-</span>';
  if (avatarHtmlArr.length === 1) return '<div style="display:flex;align-items:center">' + avatarHtmlArr[0] + '</div>';
  // 2명 이상: 오른쪽에서 순서대로 -8px씩 겹침
  var items = avatarHtmlArr.map(function(html, i) {
    return '<div style="margin-left:' + (i === 0 ? '0' : '-8px') + ';z-index:' + (avatarHtmlArr.length - i) + ';position:relative;flex-shrink:0">' + html + '</div>';
  });
  return '<div style="display:flex;align-items:center">' + items.join('') + '</div>';
}

/* ── 원형 아바타 단일 HTML 생성 */
function _makeCircleAvatar(av, col, nm) {
  return '<div style="width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,'+col+',#4f6ef7);font-size:10.5px;font-weight:800;color:#fff;display:inline-flex;align-items:center;justify-content:center;border:2px solid var(--bg-secondary);box-sizing:border-box" title="'+nm+'">'+av+'</div>';
}

/* ── 계획한 스케쥴 업무 Body (테이블 스타일) */
function buildScheduleBody() {
  const tasks = (WS.tasks||[]).filter(function(t){
    return t.isSchedule || (!t.assignerId && !(t.assigneeId||'') && !(t.assigneeIds&&t.assigneeIds.length));
  });
  // 샘플용 더미
  var sampleDummies = [
    {id:'u2',av:'LS',col:'#9747ff',nm:'이선희'},
    {id:'u3',av:'PM',col:'#06b6d4',nm:'박민수'},
    {id:'u1',av:'KJ',col:'#4f6ef7',nm:'김지준'},
  ];
  var sampleList = [
    {id:'sc1',title:'주간 팔로우업 미팅',team:'전체',status:'progress',progress:0,dueDate:new Date(Date.now()+2*86400000).toISOString(),assigneeIds:['u2'],_sample:true},
    {id:'sc2',title:'월간 업무 계획 수립',team:'기획',status:'waiting',progress:0,dueDate:new Date(Date.now()+14*86400000).toISOString(),assigneeIds:[],_sample:true},
    {id:'sc3',title:'팀 워크숍 준비',team:'인사',status:'waiting',progress:30,dueDate:new Date(Date.now()+10*86400000).toISOString(),assigneeIds:['u3'],_sample:true},
    {id:'sc4',title:'분기 성과 검토 회의',team:'전체',status:'progress',progress:60,dueDate:new Date(Date.now()+30*86400000).toISOString(),assigneeIds:['u1','u2'],_sample:true},
  ];
  var allTasks = tasks.length > 0 ? tasks : sampleList;

  // 샘플 전역 저장 (onclick에서 인덱스로 접근)
  window._schedSampleData = sampleList;

  if(tasks.length===0 && arguments[0]==='noSample') return '<div class="empty-state"><div class="es-icon"><i data-lucide="calendar"></i></div><div class="es-text">계획된 스케쥴 업무가 없습니다</div></div>';

  // 지시중요도 설정
  const allImportances = JSON.parse(localStorage.getItem('ws_instr_importances') || '[]');
  const instrList = JSON.parse(localStorage.getItem('ws_instructions') || '[]');

  const rows = allTasks.map(function(t, rowIdx) {
    const dd = WS.getDdayBadge(t.dueDate);
    const sampleTag = t._sample ? '<span style="font-size:9px;background:#06b6d422;color:#06b6d4;border-radius:4px;padding:0 4px;margin-left:4px">샘플</span>' : '';

    // ── 협업자 아바타 목록 (원형 겹침)
    var ids = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
    var avatarHtmlArr;
    if (t._sample) {
      avatarHtmlArr = ids.length > 0
        ? ids.map(function(uid) {
            var d = sampleDummies.find(function(x){ return x.id===uid; }) || {av:uid.toUpperCase().slice(1,3),col:'#06b6d4',nm:uid};
            return _makeCircleAvatar(d.av, d.col, d.nm);
          })
        : [];
    } else {
      avatarHtmlArr = ids.map(function(uid) {
        var u = WS.getUser(uid);
        if (!u) return '';
        return _makeCircleAvatar(u.avatar||'?', u.color||'#06b6d4', u.name);
      }).filter(Boolean);
    }
    // 협업자 셀 클릭: openTaskChatChannel 호출 (실제 업무만)
    var collabClick = '';
    if (!t._sample && ids.length > 0) {
      collabClick = 'event.stopPropagation();openTaskChatChannel(\'' + t.title.replace(/'/g,"\\'") + '\',' + t.id + ')';
    }
    var collaboratorCell = '<td '
      + (collabClick ? 'onclick="' + collabClick + '" title="클릭하여 메시지 채널 열기" style="cursor:pointer"' : 'style="cursor:default"')
      + '>' + _buildAvatarStack(avatarHtmlArr) + '</td>';

    // ── 업무중요도 배지 (buildReceivedBody와 동일)
    var instrRecord = instrList.find(function(i){ return i.id===t.id || i.id===Number(t.id); });
    var importanceStr = (instrRecord && instrRecord.importance) ? instrRecord.importance : (t.importance || '');
    var taskImpNames = importanceStr ? importanceStr.split(',').map(function(s){ return s.trim(); }).filter(Boolean) : [];
    var importanceBadges = taskImpNames.length > 0
      ? taskImpNames.map(function(name) {
          var imp = allImportances.find(function(i){ return i.name===name; });
          var c = imp ? (imp.color||'#ef4444') : '#9ca3af';
          var icon = imp ? imp.icon : '';
          var hasIcon = icon && icon.length > 2;
          var inner = hasIcon ? '<i data-lucide="' + icon + '" style="width:12px;height:12px;color:' + c + '"></i>' : '<span style="width:7px;height:7px;border-radius:50%;background:' + c + ';display:inline-block"></span>';
          return '<span title="' + name + '" style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:' + c + '18;border:1.5px solid ' + c + ';cursor:default;flex-shrink:0">' + inner + '</span>';
        }).join('')
      : '<span style="font-size:11px;color:var(--text-muted)">-</span>';

    // ── 진행률 셀
    var barColor = t.status==='done'?'#22c55e':t.status==='delay'?'#ef4444':'var(--accent-blue)';
    var progressCell = '<div style="display:flex;align-items:center;gap:5px"><div style="position:relative;width:60px;height:6px;background:var(--border-color);border-radius:100px;overflow:hidden;flex-shrink:0"><div style="position:absolute;left:0;top:0;width:' + t.progress + '%;height:100%;border-radius:100px;background:' + barColor + ';transition:width .4s"></div></div><span style="font-size:10.5px;font-weight:700;color:var(--text-primary);min-width:28px;text-align:right">' + t.progress + '%</span></div>';

    // ── 업무명 클릭: 샘플은 인덱스로, 실제 업무는 id로 openReceivedTaskDetail 호출
    // (내가 지시받은 업무와 동일한 상세 팝업 UI 사용)
    var titleOnclick = t._sample
      ? 'event.stopPropagation();_openSampleDetail(' + rowIdx + ')'
      : 'event.stopPropagation();editInstruction(' + t.id + ')';
    var titleStyle = 'font-weight:700;font-size:12.5px;text-decoration:underline dotted;text-underline-offset:3px;cursor:pointer;color:var(--text-primary)';
    // 행 전체 클릭: 샘플 → _openSampleDetail, 실제 → editInstruction (스케줄은 본인이 등록한 것)
    var rowOnclick = t._sample
      ? '_openSampleDetail(' + rowIdx + ')'
      : "editInstruction('" + t.id + "')";

    return '<tr style="cursor:pointer" onclick="' + rowOnclick + '">'
      + '<td style="width:25%" title="클릭하여 업무 상세 보기">'
      + '<div style="display:flex;align-items:center;gap:6px">'
      + (t.isImportant ? '<span class="star-icon"><i data-lucide="star"></i></span>' : '')
      + '<span style="' + titleStyle + '">' + t.title + '</span>' + sampleTag + '</div>'
      + '<div style="font-size:11px;color:var(--text-muted);margin-top:2px">' + (t.team||'') + '</div></td>'
      + collaboratorCell
      + '<td onclick="event.stopPropagation();' + rowOnclick + '" style="cursor:pointer" title="클릭하여 상세보기">' + _renderStatusBadge(t.status) + '</td>'
      + '<td onclick="event.stopPropagation();' + (t._sample ? '' : "openReceivedTaskDetail('" + t.id + "')") + '" style="cursor:' + (t._sample ? 'default' : 'pointer') + '" title="吏꾪뻾???대┃?섏뿬 ?낅Т吏꾪뻾 UI ?닿린">' + progressCell + '</td>'
      + '<td style="pointer-events:none"><span class="dday-badge ' + dd.cls + '">' + dd.label + '</span></td>'
      + '<td onclick="event.stopPropagation()"><div style="display:flex;gap:3px;align-items:center;flex-wrap:nowrap">' + importanceBadges + '</div></td>'
      + '</tr>';
  }).join('');
  return '<div style="padding:8px"><table class="task-table"><thead><tr><th style="width:25%">업무명</th><th>협업자</th><th>상태</th><th>진행률</th><th>마감일</th><th>업무중요도</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
}

/* ── 오늘이 시한인 업무 Body (테이블 스타일) */

function buildDueTodayBody() {
  var today2 = new Date(); today2.setHours(0,0,0,0);
  const tasks = (WS.tasks||[]).filter(function(t){
    var d = new Date(t.dueDate); d.setHours(0,0,0,0);
    return d.getTime() === today2.getTime() && t.status !== 'done';
  });
  var allTasks = tasks.length > 0 ? tasks : [
    {id:'dt1',title:'청주서 제출 마감',team:'경영지원',status:'progress',progress:85,dueDate:new Date().toISOString(),assigneeIds:['u2'],assignerId:'u1',_sample:true},
    {id:'dt2',title:'보도자료 최종 검토',team:'홍보실',status:'waiting',progress:50,dueDate:new Date().toISOString(),assigneeIds:[],assignerId:'u3',_sample:true},
    {id:'dt3',title:'개발서버 배포 작업',team:'IT팀',status:'progress',progress:90,dueDate:new Date().toISOString(),assigneeIds:['u1','u2'],assignerId:'u4',_sample:true},
    {id:'dt4',title:'클라이언트 미팅 PPT 완성',team:'사업부',status:'waiting',progress:20,dueDate:new Date().toISOString(),assigneeIds:[],assignerId:null,_sample:true},
  ];
  if(tasks.length===0 && arguments[0]==='noSample') return '<div class="empty-state"><div class="es-icon"><i data-lucide="party-popper"></i></div><div class="es-text">오늘 마감인 업무가 없습니다!</div></div>';

  // 업무중요도 설정 로드
  const allImportances = JSON.parse(localStorage.getItem('ws_instr_importances') || '[]');
  const instrList = JSON.parse(localStorage.getItem('ws_instructions') || '[]');

  const rows = allTasks.map(function(t) {
    const sampleTag = t._sample ? '<span style="font-size:9px;background:#ef444422;color:#ef4444;border-radius:4px;padding:0 4px;margin-left:4px">샘플</span>' : '';
    const dd = WS.getDdayBadge ? WS.getDdayBadge(t.dueDate) : {cls:'dday-today',label:'D-DAY'};

    // ── 협업자 아바타 목록 (assigneeIds + assignerId 모두 포함)
    var assigneeIds = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
    var allPersonIds = [];
    if (t.assignerId && !allPersonIds.includes(t.assignerId)) allPersonIds.push(t.assignerId);
    assigneeIds.forEach(function(uid){ if(uid && !allPersonIds.includes(uid)) allPersonIds.push(uid); });

    var collaboratorAvatarArr;
    if (t._sample) {
      // 샘플: 더미 아바타 표시
      var dummyAvatars = [
        {av:'KJ', col:'#4f6ef7', nm:'김재준'},
        {av:'LS', col:'#9747ff', nm:'이선희'},
        {av:'PM', col:'#06b6d4', nm:'박민수'},
        {av:'CY', col:'#f59e0b', nm:'최유라'},
      ];
      var shown = dummyAvatars.slice(0, Math.max(1, assigneeIds.length + (t.assignerId ? 1 : 0)));
      collaboratorAvatarArr = shown.map(function(d){ return _makeCircleAvatar(d.av, d.col, d.nm); });
    } else {
      collaboratorAvatarArr = allPersonIds.map(function(uid){
        var u = WS.getUser(uid);
        if (!u) return '';
        return _makeCircleAvatar(u.avatar||'?', u.color||'#4f6ef7', u.name);
      }).filter(Boolean);
    }

    // ── 업무중요도 배지
    var instrRecord = instrList.find(function(i){ return i.id===t.id || i.id===Number(t.id); });
    var importanceStr = (instrRecord && instrRecord.importance) ? instrRecord.importance : (t.importance || '');
    var taskImpNames = importanceStr ? importanceStr.split(',').map(function(s){ return s.trim(); }).filter(Boolean) : [];
    var importanceBadges = taskImpNames.length > 0
      ? taskImpNames.map(function(name) {
          var imp = allImportances.find(function(i){ return i.name===name; });
          var c = imp ? (imp.color||'#ef4444') : '#9ca3af';
          var icon = imp ? imp.icon : '';
          var hasIcon = icon && icon.length > 2;
          var inner = hasIcon ? '<i data-lucide="' + icon + '" style="width:12px;height:12px;color:' + c + '"></i>' : '<span style="width:7px;height:7px;border-radius:50%;background:' + c + ';display:inline-block"></span>';
          return '<span title="' + name + '" style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:' + c + '18;border:1.5px solid ' + c + ';cursor:default;flex-shrink:0">' + inner + '</span>';
        }).join('')
      : '<span style="font-size:11px;color:var(--text-muted)">-</span>';

    // ── 진행률 셀
    var barColor = t.status==='done'?'#22c55e':t.status==='delay'?'#ef4444':'var(--accent-blue)';
    var progressCell = '<div style="display:flex;align-items:center;gap:5px"><div style="position:relative;width:60px;height:6px;background:var(--border-color);border-radius:100px;overflow:hidden;flex-shrink:0"><div style="position:absolute;left:0;top:0;width:' + t.progress + '%;height:100%;border-radius:100px;background:' + barColor + ';transition:width .4s"></div></div><span style="font-size:10.5px;font-weight:700;color:var(--text-primary);min-width:28px;text-align:right">' + t.progress + '%</span></div>';

    // ── 협업자 셀 클릭: 실제 업무만 openTaskChatChannel 호출
    var dueTodayCollabClick = '';
    if (!t._sample && allPersonIds.length > 0) {
      dueTodayCollabClick = 'event.stopPropagation();openTaskChatChannel(\'' + t.title.replace(/'/g,"\\'") + '\',' + t.id + ')';
    }
    var collaboratorTd = '<td '
      + (dueTodayCollabClick
          ? 'onclick="' + dueTodayCollabClick + '" title="클릭하여 메시지 채널 열기" style="cursor:pointer"'
          : 'style="cursor:default"')
      + '>' + _buildAvatarStack(collaboratorAvatarArr) + '</td>';

    // 샘플 업무도 WS.tasks에 등록하여 openReceivedTaskDetail로 팝업 열기 (buildReceivedBody와 동일 패턴)
    if (t._sample && !WS.getTask(t.id)) {
      WS.tasks.push(t);
    }
    // 행 전체 클릭: 샘플 무시, 실제 업무는 _openTaskOrEdit 호출
    var rowClick = t._sample ? '' : "_openTaskOrEdit('" + t.id + "','" + (t.assignerId||'') + "')";
    // 진행율 셀 클릭: 실제/샘플 모두 openReceivedTaskDetail 호출
    var tid = typeof t.id === 'string' ? ("'" + t.id + "'") : t.id;
    var progressClick = 'event.stopPropagation();openReceivedTaskDetail(' + tid + ')';

    return '<tr style="cursor:pointer" onclick="' + rowClick + '">'
      + '<td style="width:25%"><div style="display:flex;align-items:center;gap:6px">'
      + '<i data-lucide="alert-circle" style="width:12px;height:12px;color:#ef4444;flex-shrink:0"></i>'
      + '<span style="font-weight:700;font-size:12.5px;color:#ef4444">' + t.title + '</span>' + sampleTag + '</div>'
      + '<div style="font-size:11px;color:var(--text-muted);margin-top:2px">' + (t.team||'') + '</div></td>'
      + collaboratorTd
      + '<td onclick="event.stopPropagation();' + (t._sample ? '' : "_openTaskOrEdit('" + t.id + "','" + (t.assignerId||'') + "')") + '" style="cursor:' + (t._sample ? 'default' : 'pointer') + '" title="' + (t._sample ? '' : '클릭하여 상세보기') + '">' + _renderStatusBadge(t.status) + '</td>'
      + '<td onclick="' + progressClick + '" style="cursor:pointer" title="클릭하여 진행보고서 작성">' + progressCell + '</td>'
      + '<td style="pointer-events:none"><span class="dday-badge dday-today">D-DAY</span></td>'
      + '<td onclick="event.stopPropagation()"><div style="display:flex;gap:3px;align-items:center;flex-wrap:nowrap">' + importanceBadges + '</div></td>'
      + '</tr>';
  }).join('');
  return '<div style="padding:8px"><table class="task-table"><thead><tr><th style="width:25%">업무명</th><th>협업자</th><th>상태</th><th>진행율</th><th>마감일</th><th>업무중요도</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
}

/* ── 상태 배지 with 아이콘 (설정된 ws_task_statuses 기반) */
function _renderStatusBadge(statusKey) {
  var statuses = [];
  try { statuses = JSON.parse(localStorage.getItem('ws_task_statuses')) || []; } catch(e) {}

  // 영문 statusKey → 한글 명칭 매핑 (ws_task_statuses가 한글 name으로 저장됨)
  var keyMap = { 'progress':'진행', 'done':'완료', 'waiting':'대기', 'delay':'지연', 'hold':'보류', 'cancel':'취소' };
  var targetName = keyMap[statusKey] || statusKey;

  var found = statuses.find(function(s){
    return String(s.id) === String(statusKey) ||
           s.key === statusKey ||
           s.name === targetName ||
           s.name === statusKey ||
           s.label === targetName ||
           s.label === statusKey;
  });

  var label = found ? (found.name || found.label || targetName) : WS.getStatusLabel(statusKey);
  var icon  = found && found.icon ? found.icon : null;
  var color = found && found.color ? found.color : null;

  // 폴백: ws_task_statuses에 없으면 기본 아이콘/색상 사용
  if (!icon) {
    var icoFb = { 'progress':'activity','done':'check-circle-2','waiting':'clock','delay':'alert-triangle','hold':'pause-circle','cancel':'x-circle' };
    icon = icoFb[statusKey] || null;
  }
  if (!color) {
    var clrFb = { 'progress':'#06b6d4','done':'#22c55e','waiting':'#9ca3af','delay':'#ef4444','hold':'#f59e0b','cancel':'#6b7280' };
    color = clrFb[statusKey] || null;
  }

  var iconHtml = icon ? '<i data-lucide="' + icon + '" style="width:11px;height:11px;vertical-align:middle;margin-right:3px"></i>' : '';
  var colorStyle = color ? 'border-left:2.5px solid ' + color + ';color:' + color + ';background:' + color + '18' : '';
  return '<span class="status-badge status-' + statusKey + '" style="' + colorStyle + ';display:inline-flex;align-items:center">' + iconHtml + label + '</span>';
}


/* ── 첫 번째 중요도 아이콘 업무명 앞에 표시 */
function _getFirstImportanceIcon(taskImportance) {
  var allImportances = [];
  try { allImportances = JSON.parse(localStorage.getItem('ws_instr_importances')) || []; } catch(e) {}
  var names = taskImportance ? taskImportance.split(',').map(function(s){ return s.trim(); }).filter(Boolean) : [];
  if (!names.length) return '';
  var imp = allImportances.find(function(i){ return i.name === names[0]; });
  if (!imp || !imp.icon || imp.icon.length <= 2) return '';
  var c = imp.color || '#ef4444';
  return '<i data-lucide="' + imp.icon + '" style="width:13px;height:13px;color:' + c + ';flex-shrink:0;margin-right:4px"></i>';
}

/* ── 내가 지시한 업무 Body */
function buildAssignedByMe() {
  const tasks = WS.getAssignedByMe();
  const rows = tasks.map(t => {
    const ids = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
    const assignee = WS.getUser(ids[0]);
    const dd = WS.getDdayBadge(t.dueDate);
    const fillCls = t.status==='delay'?'delay':t.status==='done'?'done':'';
    return `<tr onclick="openTaskDetail(${t.id})" style="cursor:pointer">
      <td>
        <div style="display:flex;align-items:center;gap:6px">
          ${t.isImportant?'<span class="star-icon"><i data-lucide="star"></i></span>':''}
          <span style="font-weight:600;font-size:12.5px">${t.title}</span>
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${t.team}</div>
      </td>
      <td>
        <div class="avatar-group">
          <div class="avatar" style="background:linear-gradient(135deg,${assignee?.color||'#4f6ef7'},#9747ff)" title="${assignee?.name}">${assignee?.avatar||'?'}</div>
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${assignee?.name}</div>
      </td>
      <td><span class="status-badge status-${t.status}">${WS.getStatusLabel(t.status)}</span></td>
      <td>
        <div class="progress-wrap">
          <div class="progress-bar"><div class="progress-fill ${fillCls}" style="width:${t.progress}%"></div></div>
          <span class="progress-label">${t.progress}%</span>
        </div>
      </td>
      <td><span class="dday-badge ${dd.cls}">${dd.label}</span></td>
      <td>
        <div class="quick-actions">
          <button class="qa-btn" onclick="event.stopPropagation();changeStatus(${t.id},'progress')">진행</button>
          <button class="qa-btn done" onclick="event.stopPropagation();changeStatus(${t.id},'done')">완료</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  return `<div class="section-card">
    <div class="section-head">
      <div class="section-title-group">
        <div class="section-dot" style="background:#4f6ef7"><i data-lucide="send"></i></div>
        <div class="section-title">내가 지시한 업무</div>
        <span class="section-count">${tasks.length}건</span>
      </div>
      <div class="section-actions">
      <button class="btn-sm btn-primary" onclick="openNewTaskModal()">+ 등록</button>
      </div>
    </div>
    <div class="section-body">
      ${tasks.length===0?'<div class="empty-state"><div class="es-icon"><i data-lucide="inbox"></i></div><div class="es-text">吏€?쒗븳 업무媛€ 없습니다</div></div>':
      `<table class="task-table">
        <thead><tr>
          <th>업무명</th><th>담당자</th><th>상태</th><th>진행률</th><th>마감일</th><th>액션</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>`}
    </div>
  </div>`;
}

/* ── 아코디언용 Body 적용 버전 */
function buildAssignedByMeBody() {
  const tasks = WS.getAssignedByMe();
  if(tasks.length===0) return '<div class="empty-state"><div class="es-icon"><i data-lucide="inbox"></i></div><div class="es-text">지시한 업무가 없습니다</div></div>';

  // 전체 지시 중요도 목록 로드
  const allImportances = JSON.parse(localStorage.getItem('ws_instr_importances') || '[]');
  // ws_instructions에서 importance 매핑용으로 로드
  const instrList = JSON.parse(localStorage.getItem('ws_instructions') || '[]');

  const rows = tasks.map(t => {
    const _ids2 = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
    const assignee = WS.getUser(_ids2[0]);
    const dd = WS.getDdayBadge(t.dueDate);
    const fillCls = t.status==='delay'?'delay':t.status==='done'?'done':'';

    // ws_instructions에서 해당 업무의 importance 가져오기 (ws_tasks보다 우선)
    const instrRecord = instrList.find(i => i.id === t.id || i.id === Number(t.id) || i.taskId === String(t.id));
    const importanceStr = (instrRecord && instrRecord.importance) ? instrRecord.importance
                        : (t.importance ? t.importance : '');

    // ── 중요도 배지 생성
    const taskImpNames = importanceStr
      ? importanceStr.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    let importanceBadges;
    if (taskImpNames.length > 0) {
      const matched = taskImpNames.map(name => {
        const imp = allImportances.find(i => i.name === name);
        const c = imp ? (imp.color || '#ef4444') : '#9ca3af';
        const icon = imp ? imp.icon : '';
        const hasIcon = icon && icon.length > 2;
        const inner = hasIcon
          ? `<i data-lucide="${icon}" style="width:12px;height:12px;color:${c}"></i>`
          : `<span style="width:7px;height:7px;border-radius:50%;background:${c};display:inline-block"></span>`;
        // 아이콘만 표시 (마우스오버 시 이름 표시)
        return `<span title="${name}" data-tooltip="${name}" style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:${c}18;border:1.5px solid ${c};cursor:default;flex-shrink:0">${inner}</span>`;
      }).join('');
      importanceBadges = matched || `<span style="font-size:11px;color:var(--text-muted)">-</span>`;
    } else {
      importanceBadges = `<span style="font-size:11px;color:var(--text-muted)">-</span>`;
    }

    // 업무명 앞 첫 번째 중요도 아이콘
    const firstImpIcon = taskImpNames.length > 0 ? (() => {
      const imp = allImportances.find(i => i.name === taskImpNames[0]);
      if (!imp || !imp.icon || imp.icon.length <= 2) return '';
      const c = imp.color || '#ef4444';
      return `<i data-lucide="${imp.icon}" style="width:13px;height:13px;color:${c};flex-shrink:0;margin-right:2px"></i>`;
    })() : '';

    return `<tr style="cursor:pointer">
      <td onclick="editInstruction(${t.id})" title="클릭하여 수정" style="width:25%">
        <div style="display:flex;align-items:center;gap:4px">
          ${firstImpIcon}
          <span style="font-weight:600;font-size:12.5px;text-decoration:underline dotted;text-underline-offset:3px">${t.title}</span>
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${t.team||''}</div>
      </td>
      <td onclick="event.stopPropagation();openTaskChatChannel('${t.title}',${t.id})" title="클릭하여 메시지 채널 열기" style="cursor:pointer"><div class="avatar-group"><div class="avatar" style="background:linear-gradient(135deg,${assignee?.color||'#4f6ef7'},#9747ff)">${assignee?.avatar||'?'}</div></div><div style="font-size:11px;color:var(--currentAccent,#4f6ef7);margin-top:2px;font-weight:600;text-decoration:underline dotted;text-underline-offset:2px">${assignee?.name||''}</div></td>
      <td onclick="(function(){
        var me = WS.currentUser ? String(WS.currentUser.id) : null;
        var aid = '${t.assignerId}';
        if (!me || me !== aid) { showToast('warning','업무 작성자만 상세 내용을 확인할 수 있습니다.'); return; }
        openReceivedTaskDetail(${t.id});
      })()" title="${t.assignerId && WS.currentUser && String(WS.currentUser.id)===String(t.assignerId) ? '클릭하여 상세보기' : '작성자만 클릭 가능'}"
        style="cursor:${t.assignerId && WS.currentUser && String(WS.currentUser.id)===String(t.assignerId) ? 'pointer' : 'not-allowed'};opacity:${t.assignerId && WS.currentUser && String(WS.currentUser.id)===String(t.assignerId) ? '1' : '0.6'}">${_renderStatusBadge(t.status)}</td>
      <td>
        <div style="display:flex;align-items:center;gap:5px">
          <div style="position:relative;width:60px;height:6px;background:var(--border-color);border-radius:100px;overflow:hidden;flex-shrink:0">
            <div style="position:absolute;left:0;top:0;width:${t.progress}%;height:100%;border-radius:100px;background:${t.status==='done'?'#22c55e':t.status==='delay'?'#ef4444':'var(--accent-blue)'};transition:width .4s"></div>
          </div>
          <span style="font-size:10.5px;font-weight:700;color:var(--text-primary);min-width:28px;text-align:right">${t.progress}%</span>
        </div>
      </td>
      <td><span class="dday-badge ${dd.cls}">${dd.label}</span></td>
      <td onclick="event.stopPropagation()"><div style="display:flex;gap:3px;align-items:center;flex-wrap:nowrap">${importanceBadges}</div></td>
    </tr>`;
  }).join('');
  return `<div style="padding:8px"><table class="task-table"><thead><tr><th style="width:25%">업무명</th><th>담당자</th><th>상태</th><th>진행률</th><th>마감일</th><th>지시중요도</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

/* ?€?€ ?뱀뀡2: 내가 吏€?쒕컺?€ 업무 ?€?€ */
function buildAssignedToMe() {
  const tasks = WS.getAssignedToMe().sort((a,b)=>{
    const po={high:0,medium:1,low:2};
    return po[a.priority]-po[b.priority];
  });
  const cards = tasks.map(t => {
    const assigner = WS.getUser(t.assignerId);
    const dd = WS.getDdayBadge(t.dueDate);
    const isToday = WS.getDday(t.dueDate) <= 0;
    const fillCls = t.status==='delay'?'delay':t.status==='done'?'done':'';
    return `<div class="task-card ${isToday&&t.status!=='done'?'urgent':t.isImportant?'important':''}" onclick="openTaskDetail(${t.id})">
      <div class="task-card-top">
        <div class="task-card-title">
          ${t.isImportant?'<span class="star-icon"><i data-lucide="star"></i></span>':''}${t.title}
        </div>
        <span class="dday-badge ${dd.cls}">${dd.label}</span>
      </div>
      <div class="task-card-meta">
        <span class="priority-badge priority-${t.priority}">${WS.getPriorityLabel(t.priority)}</span>
        <span class="status-badge status-${t.status}">${WS.getStatusLabel(t.status)}</span>
        <span style="font-size:11px;color:var(--text-muted)">from ${assigner?.name}</span>
      </div>
      <div style="margin-top:8px">
        <div class="progress-wrap">
          <div class="progress-bar"><div class="progress-fill ${fillCls}" style="width:${t.progress}%"></div></div>
          <span class="progress-label">${t.progress}%</span>
        </div>
      </div>
      <div class="quick-actions" style="margin-top:7px" onclick="event.stopPropagation()">
        <button class="qa-btn" onclick="changeStatus(${t.id},'progress')">진행중</button>
        <button class="qa-btn done" onclick="changeStatus(${t.id},'done')">완료</button>
        <button class="qa-btn delay" onclick="changeStatus(${t.id},'delay')">지연</button>
        <button class="qa-btn" onclick="openTaskDetail(${t.id})">상세</button>
      </div>
    </div>`;
  }).join('');

  return `<div class="section-card">
    <div class="section-head">
      <div class="section-title-group">
        <div class="section-dot" style="background:#9747ff"><i data-lucide="download"></i></div>
        <div class="section-title">나에게 배정된 업무</div>
        <span class="section-count">${tasks.length}건</span>
      </div>
      <div class="section-actions">
        <span style="font-size:11px;color:var(--text-muted)">우선순위 정렬</span>
      </div>
    </div>
    ${tasks.length===0?'<div class="empty-state"><div class="es-icon"><i data-lucide="sparkles"></i></div><div class="es-text">吏€?쒕컺?€ 업무媛€ 없습니다</div></div>':
    `<div class="section-body">${cards}</div>`}
  </div>`;
}

/* ?€?€ ?뱀뀡3: 오늘 완료해야 ??업무 ?€?€ */
function buildTodayTasks() {
  const tasks = WS.getTodayTasks();
  const all_today = WS.tasks.filter(t=>{const d=WS.getDday(t.dueDate);return d<=0&&t.status!=='done';});

  const banner = all_today.length>0 ? `
    <div class="urgent-banner">
      <span style="font-size:20px"><i data-lucide="alert-circle" class="icon-lg" style="color:#ef4444"></i></span>
      <div>
        <div class="ub-text">오늘 留덇컧 업무 ${all_today.length}건/div>
        <div class="ub-sub">利됱떆 완료 泥섎━?섍굅??상태를업데이트하세요/div>
      </div>
    </div>` : '';

  const cards = tasks.map(t => {
    const assigner = WS.getUser(t.assignerId);
    const dday = WS.getDday(t.dueDate);
    const fillCls = t.status==='delay'?'delay':'';
    return `<div class="task-card urgent" onclick="openTaskDetail(${t.id})">
      <div class="task-card-top">
        <div class="task-card-title"><i data-lucide="alert-circle" class="icon-sm" style="color:#ef4444;margin-right:4px"></i>${t.title}</div>
        <span class="dday-badge dday-today">${dday===0?'D-DAY':`D+${Math.abs(dday)}초과`}</span>
      </div>
      <div class="task-card-meta">
        <span class="priority-badge priority-high">긴급</span>
        <span class="status-badge status-${t.status}">${WS.getStatusLabel(t.status)}</span>
        <span style="font-size:11px;color:var(--text-muted)">from ${assigner?.name}</span>
      </div>
      <div style="margin-top:8px">
        <div class="progress-wrap">
          <div class="progress-bar"><div class="progress-fill ${fillCls}" style="width:${t.progress}%"></div></div>
          <span class="progress-label">${t.progress}%</span>
        </div>
      </div>
      <div class="quick-actions" style="margin-top:7px" onclick="event.stopPropagation()">
        <button class="qa-btn done" onclick="changeStatus(${t.id},'done')"><i data-lucide="check-circle-2" class="icon-sm"></i> 완료처리</button>
        <button class="qa-btn delay" onclick="changeStatus(${t.id},'delay')"><i data-lucide="alert-triangle" class="icon-sm"></i> 지연처리</button>
      </div>
    </div>`;
  }).join('');

  return `<div class="section-card" style="height:100%">
    <div class="section-head">
      <div class="section-title-group">
        <div class="section-dot" style="background:#ef4444"><i data-lucide="alert-circle"></i></div>
        <div class="section-title">오늘 완료해야 할 업무</div>
        ${tasks.length>0?`<span class="section-count" style="background:rgba(239,68,68,.12);color:#ef4444">${tasks.length}건</span>>`:'<span class="section-count">?놁쓬</span>'}
      </div>
    </div>
    ${banner}
    ${tasks.length===0?'<div class="empty-state"><div class="es-icon"><i data-lucide="party-popper"></i></div><div class="es-text">오늘 留덇컧 업무媛€ 없습니다!</div></div>':
    `<div class="section-body">${cards}</div>`}
  </div>`;
}

/* ?꾩퐫?붿뼵??Body ?꾩슜 - 吏€?쒕컺?€ 업무 */
function buildAssignedToMeBody() {
  const tasks = WS.getAssignedToMe().sort((a,b)=>{const po={high:0,medium:1,low:2};return po[a.priority]-po[b.priority];});
  if(tasks.length===0) return '<div class="empty-state"><div class="es-icon"><i data-lucide="sparkles"></i></div><div class="es-text">吏€?쒕컺?€ 업무媛€ 없습니다</div></div>';
  const cards = tasks.map(t => {
    const assigner = WS.getUser(t.assignerId);
    const dd = WS.getDdayBadge(t.dueDate);
    const fillCls = t.status==='delay'?'delay':t.status==='done'?'done':'';
    return `<div class="task-card ${WS.getDday(t.dueDate)<=0&&t.status!=='done'?'urgent':t.isImportant?'important':''}" onclick="openTaskDetail(${t.id})">
      <div class="task-card-top"><div class="task-card-title">${t.isImportant?'<span class="star-icon"><i data-lucide="star"></i></span>':''}${t.title}</div><span class="dday-badge ${dd.cls}">${dd.label}</span></div>
      <div class="task-card-meta"><span class="priority-badge priority-${t.priority}">${WS.getPriorityLabel(t.priority)}</span><span class="status-badge status-${t.status}">${WS.getStatusLabel(t.status)}</span><span style="font-size:11px;color:var(--text-muted)">from ${assigner?.name}</span></div>
      <div style="margin-top:8px"><div class="progress-wrap"><div class="progress-bar"><div class="progress-fill ${fillCls}" style="width:${t.progress}%"></div></div><span class="progress-label">${t.progress}%</span></div></div>
      <div class="quick-actions" style="margin-top:7px" onclick="event.stopPropagation()">
        <button class="qa-btn" onclick="changeStatus(${t.id},'progress')">진행중</button>
        <button class="qa-btn done" onclick="changeStatus(${t.id},'done')">완료</button>
        <button class="qa-btn delay" onclick="changeStatus(${t.id},'delay')">지연</button>
        <button class="qa-btn" onclick="openTaskDetail(${t.id})">상세</button>
      </div>
    </div>`;
  }).join('');
  return `<div class="section-body" style="padding:8px;display:grid;grid-template-columns:1fr 1fr;gap:12px">${cards}</div>`;
}

/* ?꾩퐫?붿뼵??Body ?꾩슜 - 오늘 완료 업무 */
function buildTodayTasksBody() {
  const tasks = WS.getTodayTasks();
  if(tasks.length===0) return '<div class="empty-state"><div class="es-icon"><i data-lucide="party-popper"></i></div><div class="es-text">오늘 留덇컧 업무媛€ 없습니다!</div></div>';
  const cards = tasks.map(t => {
    const assigner = WS.getUser(t.assignerId);
    const dday = WS.getDday(t.dueDate);
    const fillCls = t.status==='delay'?'delay':'';
    return `<div class="task-card urgent" onclick="openTaskDetail(${t.id})">
      <div class="task-card-top"><div class="task-card-title"><i data-lucide="alert-circle" class="icon-sm" style="color:#ef4444;margin-right:4px"></i>${t.title}</div><span class="dday-badge dday-today">${dday===0?'D-DAY':`D+${Math.abs(dday)}초과`}</span></div>
      <div class="task-card-meta"><span class="priority-badge priority-high">긴급</span><span class="status-badge status-${t.status}">${WS.getStatusLabel(t.status)}</span><span style="font-size:11px;color:var(--text-muted)">from ${assigner?.name}</span></div>
      <div style="margin-top:8px"><div class="progress-wrap"><div class="progress-bar"><div class="progress-fill ${fillCls}" style="width:${t.progress}%"></div></div><span class="progress-label">${t.progress}%</span></div></div>
      <div class="quick-actions" style="margin-top:7px" onclick="event.stopPropagation()">
        <button class="qa-btn done" onclick="changeStatus(${t.id},'done')"><i data-lucide="check-circle-2" class="icon-sm"></i> 완료처리</button>
        <button class="qa-btn delay" onclick="changeStatus(${t.id},'delay')"><i data-lucide="alert-triangle" class="icon-sm"></i> 지연처리</button>
      </div>
    </div>`;
  }).join('');
  return `<div class="section-body" style="padding:8px">${cards}</div>`;
}


/* ?? ?뱀뀡4: ?ㅼ떆媛????위젯 ?? */
function buildChatWidget() {
  const msgs = WS.messages;

  // 헤더 우측 멤버 ID (나 + 채널 상대방)만 필터링
  var _memberIds = [];
  if (WS.currentUser) _memberIds.push(String(WS.currentUser.id));
  if (_activeChatAssignerOverride) {
    _memberIds.push(String(_activeChatAssignerOverride));
  } else if (_activeChatTask) {
    var _cIds = Array.isArray(_activeChatTask.assigneeIds)
      ? _activeChatTask.assigneeIds
      : (_activeChatTask.assigneeId ? [_activeChatTask.assigneeId] : []);
    _cIds.forEach(function(id){ _memberIds.push(String(id)); });
  }
  // 채널 미선택 시 전체 표시
  var filtered = (_memberIds.length > 1)
    ? msgs.filter(function(m){ return _memberIds.indexOf(String(m.senderId)) !== -1; })
    : msgs;

  const list = filtered.map(m => {
    const isMe = String(m.senderId) === String(WS.currentUser.id);
    const sender = WS.getUser(m.senderId);
    return `
      <div class="chat-msg ${isMe?'me':''}">
        ${!isMe ? `<div class="avatar" style="background:linear-gradient(135deg,${sender?.color},#9747ff)">${sender?.avatar}</div>` : ''}
        <div style="display:flex; flex-direction:column; ${isMe?'align-items:flex-end':''}">
          ${!isMe ? `<div class="chat-name">${sender?.name}</div>` : ''}
          <div style="display:flex; gap:6px; ${isMe?'flex-direction:row-reverse':''}">
            <div class="chat-bubble">${m.text}</div>
            <div class="chat-time">${m.time}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="chat-widget">
      <div class="chat-header">
        <div class="section-dot" style="background:var(--accent-blue)"><i data-lucide="message-square"></i></div>
        <h3 id="chatChannelTitle" style="font-size:13px;display:flex;align-items:baseline;gap:4px">
          <span id="chatChannelTaskName" style="display:none;color:var(--currentAccent,#4f6ef7);font-weight:900"></span>
          <span id="chatChannelSuffix" style="color:var(--accent-purple,#9747ff);font-weight:700">실시간 메시지 채널</span>
        </h3>
        <div id="chatMemberList" style="margin-left:auto;display:flex;align-items:center;gap:8px;flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;max-width:58%">
          ${(function(){
            var users = [];
            if (_activeChatAssignerOverride) {
              var assignerUser = (WS.users || []).find(function(u){ return String(u.id) === String(_activeChatAssignerOverride); });
              users = assignerUser ? [assignerUser] : [];
            } else if (_activeChatTask) {
              var ids = Array.isArray(_activeChatTask.assigneeIds)
                ? _activeChatTask.assigneeIds
                : (_activeChatTask.assigneeId ? [_activeChatTask.assigneeId] : []);
              users = (WS.users || []).filter(function(u){
                return ids.some(function(id){ return String(id) === String(u.id); });
              });
            } else {
              users = WS.users || [];
            }
            return users.map(function(u) {
              var isMe = WS.currentUser && String(u.id) === String(WS.currentUser.id);
              var bg = 'linear-gradient(135deg,' + (u.color||'#4f6ef7') + ',#9747ff)';
              var ring = isMe ? '0 0 0 2px #22c55e' : '0 0 0 1.5px var(--border-color)';
              return '<div title="' + u.name + '" style="display:inline-flex;flex-direction:column;align-items:center;gap:2px;flex-shrink:0;cursor:default">' +
                '<div style="width:26px;height:26px;border-radius:50%;background:' + bg + ';box-shadow:' + ring + ';' +
                'display:flex;align-items:center;justify-content:center;' +
                'font-size:10px;font-weight:800;color:#fff;position:relative">' +
                (u.avatar || u.name.charAt(0)) +
                (isMe ? '<span style="position:absolute;bottom:-1px;right:-1px;width:7px;height:7px;border-radius:50%;background:#22c55e;border:1.5px solid var(--bg-primary)"></span>' : '') +
                '</div>' +
                '<span style="font-size:8.5px;font-weight:' + (isMe?'800':'600') + ';' +
                'color:' + (isMe?'var(--currentAccent,#4f6ef7)':'var(--text-muted)') + ';' +
                'white-space:nowrap;max-width:36px;overflow:hidden;text-overflow:ellipsis;line-height:1">' + u.name + '</span>' +
                '</div>';
            }).join('');
          })()}
        </div>
      </div>
      <div class="chat-body" id="chatBody">
        ${list}
      </div>
      <div class="chat-input-area">
        <input type="text" class="chat-input" id="chatInput" placeholder="메시지를 입력하세요..." onkeypress="if(event.key==='Enter') sendMessage()">
        <button class="send-btn" onclick="sendMessage()"><i data-lucide="send" class="icon-sm"></i></button>
      </div>
    </div>
  `;
}
