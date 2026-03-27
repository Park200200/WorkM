/**
 * modules/overrides.js
 * app.js 이후에 로드되어 특정 함수를 깨끗한 UTF-8 코드로 교체합니다.
 * 이 파일은 항상 UTF-8로만 저장/편집하세요.
 */

/* ══════════════════════════════════════════════
   업무설정 페이지 – renderPage_Tasks 완전 교체
   (컬럼 헤더 한글 정상 출력 + 클릭 이벤트 보장)
══════════════════════════════════════════════ */
function renderPage_Tasks(filter) {
  filter = filter || window._taskFilter || 'all';
  window._taskFilter = filter;

  const vMode = window._taskViewMode || 'assignment';

  if (vMode === 'assignment') {
    const aMode = window._assignmentMode || 'task';
    if (aMode === 'task')  renderAssignmentByTask();
    else                   renderAssignmentByStaff();
  } else {
    renderTaskListView();
  }
}

/* 업무 목록 뷰 (직접 작성 – 헤더 한글 정상) */
function renderTaskListView(targetEl) {
  const el = targetEl || document.getElementById('taskListArea');
  if (!el) return;

  const uid  = WS.currentUser?.id;
  const f    = window._taskFilter || 'all';
  let   tasks = WS.tasks;
  if (f === 'mine')   tasks = tasks.filter(t => (t.assigneeIds||[]).includes(uid) || t.assignerId === uid);
  if (f === 'waiting') tasks = tasks.filter(t => t.status === 'waiting');
  if (f === 'progress') tasks = tasks.filter(t => t.status === 'progress');
  if (f === 'done')    tasks = tasks.filter(t => t.status === 'done');
  if (f === 'delay')   tasks = tasks.filter(t => t.status === 'delay');

  const rows = tasks.map(t => {
    const ids      = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
    const assignee = WS.getUser(ids[0]);
    const dd       = WS.getDdayBadge(t.dueDate);
    return `<tr onclick="openTaskDetail(${t.id})" style="cursor:pointer">
      <td>
        <div style="display:flex;align-items:center;gap:6px">
          ${t.isImportant ? '<span class="star-icon"><i data-lucide="star"></i></span>' : ''}
          <span style="font-weight:600;font-size:12.5px">${t.title}</span>
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${t.team || ''}</div>
      </td>
      <td>
        <div class="avatar-group">
          <div class="avatar" style="background:linear-gradient(135deg,${assignee?.color||'#4f6ef7'},#9747ff)">${assignee?.avatar||'?'}</div>
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${assignee?.name||'-'}</div>
      </td>
      <td><span class="status-badge status-${t.status}">${WS.getStatusLabel(t.status)}</span></td>
      <td><span class="dday-badge ${dd.cls}">${dd.label}</span></td>
      <td>
        <div class="quick-actions">
          <button class="qa-btn" onclick="event.stopPropagation();openEditTaskModal(${t.id})">✏️</button>
          <button class="qa-btn done" onclick="event.stopPropagation();changeStatus(${t.id},'done')">완료</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  el.innerHTML = `<table class="task-table">
    <thead><tr>
      <th>업무제목</th>
      <th>담당자</th>
      <th>상태</th>
      <th>마감일</th>
      <th>액션</th>
    </tr></thead>
    <tbody>${rows || '<tr><td colspan="5" class="empty-state">데이터가 없습니다.</td></tr>'}</tbody>
  </table>`;
  refreshIcons();
}

/* ══════════════════════════════════════════════
   saveTaskDetail – 당일 히스토리 중복 방지
══════════════════════════════════════════════ */
function saveTaskDetail() {
  const id = window._editingTaskId;
  if (!id) return;
  const t = WS.getTask(id);
  if (!t) return;

  const slider = document.getElementById('progressSlider_' + id);
  const descEl = document.getElementById('td_desc');
  if (slider) t.progress = parseInt(slider.value);
  if (descEl) t.desc = descEl.value;

  const now     = new Date();
  const dateStr = now.getFullYear() + '.' +
                  String(now.getMonth()+1).padStart(2,'0') + '.' +
                  String(now.getDate()).padStart(2,'0');
  if (!t.history) t.history = [];

  const entry = {
    date:   dateStr,
    event:  '진행율 업데이트',
    detail: '진행율 ' + t.progress + '%' + (t.desc ? ' · 설명 수정' : ''),
    icon:   'refresh-cw',
    color:  '#4f6ef7',
    progress: t.progress
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
}

/* ══════════════════════════════════════════════
   addProgressReport – 당일 1건 제한 + 진행율 저장
══════════════════════════════════════════════ */
function addProgressReport(taskId) {
  const t = WS.getTask(taskId);
  if (!t) return;
  const textEl  = document.getElementById('td_reportText');
  const iconVal = (document.getElementById('td_reportIconVal')?.value || 'message-square|진행보고|#4f6ef7');
  const text    = textEl?.value?.trim();
  if (!text) { showToast('warning', '진행 내용을 입력하세요.'); return; }

  const parts = iconVal.split('|');
  const icon  = parts[0];
  const label = parts[1];
  const color = parts[2];

  const now     = new Date();
  const dateStr = now.getFullYear() + '.' +
                  String(now.getMonth()+1).padStart(2,'0') + '.' +
                  String(now.getDate()).padStart(2,'0');
  if (!t.history) t.history = [];

  // 현재 슬라이더 진행율
  const slider      = document.getElementById('progressSlider_' + taskId);
  const progressNow = slider ? parseInt(slider.value) : (t.progress || 0);

  const todayIdx = t.history.findIndex(h => h.date === dateStr);
  let isUpdate = false;

  const entry = { date: dateStr, event: label, detail: text, icon, color, progress: progressNow };

  if (todayIdx !== -1) {
    t.history[todayIdx] = entry;
    isUpdate = true;
  } else {
    t.history.push(entry);
  }
  WS.saveTasks();

  // 히스토리 타임라인 즉시 갱신
  const timeline = document.getElementById('historyTimeline_' + taskId);
  if (timeline) {
    const newItem = document.createElement('div');
    newItem.className = 'timeline-item';
    newItem.innerHTML = `
      <div class="timeline-dot" style="background:${color}22;border-color:${color}">
        <i data-lucide="${icon}"></i>
      </div>
      <div class="timeline-content">
        <div class="t-date">${dateStr}</div>
        <div class="t-text">${label} ${progressNow}%</div>
        <div class="t-sub">${text}</div>
      </div>`;
    if (isUpdate && timeline.firstChild) {
      timeline.replaceChild(newItem, timeline.firstChild);
    } else {
      timeline.insertBefore(newItem, timeline.firstChild);
    }
    const cntEl = document.getElementById('historyCount_' + taskId);
    if (cntEl) cntEl.textContent = t.history.length + '건';
    refreshIcons();
  }

  if (textEl) textEl.value = '';
  showToast('success', isUpdate ? '진행보고가 업데이트되었습니다.' : '진행보고가 추가되었습니다.');
}

/* ══════════════════════════════════════════════
   createNewTask – 성과포인트(scoreMin/scoreMax) 포함
══════════════════════════════════════════════ */
function createNewTask() {
  const titleInput = document.getElementById('nt_title');
  const title = titleInput ? titleInput.value.trim() : '';
  const due   = document.getElementById('nt_due')?.value;

  if (!title || !due) {
    showToast('error', '제목과 날짜를 입력하세요');
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  const nt = {
    id:            Date.now(),
    title:         title,
    desc:          document.getElementById('nt_desc')?.value || '',
    assignerId:    WS.currentUser?.id || 1,
    assigneeIds:   [],
    status:        'waiting',
    priority:      document.getElementById('nt_priority')?.value || 'medium',
    progress:      0,
    dueDate:       due,
    createdAt:     today,
    startedAt:     document.getElementById('nt_start')?.value || null,
    isImportant:   document.getElementById('nt_important')?.checked || false,
    team:          document.getElementById('nt_team')?.value || '',
    scoreMin:      parseInt(document.getElementById('nt_score_min')?.value) || 0,
    score:         parseInt(document.getElementById('nt_score')?.value) || 0,
    scoreMax:      parseInt(document.getElementById('nt_score_max')?.value) || 0,
    reportContent: document.getElementById('nt_result')?.value || '',
    processTags:   window._processTags || [],
    spentTime:     '0h',
    parentId:      window._newParentId || null,
    history: [{
      date:   today.replace(/-/g,'.'),
      event:  '업무 등록',
      detail: WS.currentUser?.name || '',
      icon:   'clipboard-list',
      color:  '#4f6ef7'
    }]
  };

  WS.tasks.push(nt);
  WS.saveTasks();
  WS.addNotification({ msg: '새 업무가 등록되었습니다: ' + title, type: 'new', time: '방금' });

  // 폼 초기화
  if (titleInput) titleInput.value = '';
  ['nt_desc','nt_priority','nt_team','nt_result'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  ['nt_score_min','nt_score','nt_score_max'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  window._processTags = [];
  window._newParentId = null;

  closeModalDirect('newTaskModal');
  renderDashboard();
  renderPage_Tasks();
  showToast('success', '<i data-lucide="check-circle-2"></i> 업무가 등록되었습니다.');
  refreshIcons();
}

/* ══════════════════════════════════════════════
   saveEditTask – 성과포인트(scoreMin/scoreMax) 포함
══════════════════════════════════════════════ */
function saveEditTask() {
  const id    = window._editingTaskId;
  const title = document.getElementById('nt_title')?.value?.trim();
  if (!id || !title) { showToast('error', '제목을 입력하세요'); return; }

  WS.tasks = WS.tasks.map(t => {
    if (t.id !== id) return t;
    return Object.assign({}, t, {
      title,
      desc:          document.getElementById('nt_desc')?.value || t.desc,
      priority:      document.getElementById('nt_priority')?.value || t.priority,
      team:          document.getElementById('nt_team')?.value || t.team,
      startedAt:     document.getElementById('nt_start')?.value || t.startedAt,
      dueDate:       document.getElementById('nt_due')?.value || t.dueDate,
      reportContent: document.getElementById('nt_result')?.value || '',
      scoreMin:      parseInt(document.getElementById('nt_score_min')?.value) || 0,
      score:         parseInt(document.getElementById('nt_score')?.value) || 0,
      scoreMax:      parseInt(document.getElementById('nt_score_max')?.value) || 0,
      isImportant:   document.getElementById('nt_important')?.checked ?? t.isImportant,
      processTags:   window._processTags || t.processTags
    });
  });

  WS.saveTasks();
  window._editingTaskId = null;
  window._processTags   = [];
  closeModalDirect('newTaskModal');
  renderDashboard();
  renderPage_Tasks();
  showToast('success', '업무가 수정되었습니다.');
  refreshIcons();
}

/* ══════════════════════════════════════════════
   openNewTaskModal – 스케줄 모드 업무선택 드롭다운
   + 성과포인트 섹션 show/hide
══════════════════════════════════════════════ */
function openNewTaskModal(mode, parentId, isSimple) {
  window._newParentId = parentId || null;
  window._processTags = [];
  renderProcessTags();

  // 오늘 날짜 기본 설정
  const today = new Date();
  const yyyy  = today.getFullYear();
  const mm    = String(today.getMonth()+1).padStart(2,'0');
  const dd    = String(today.getDate()).padStart(2,'0');
  const todayStr   = yyyy + '-' + mm + '-' + dd;
  const todayLabel = yyyy + '년 ' + parseInt(mm) + '월 ' + parseInt(dd) + '일';

  const dueHid = document.getElementById('nt_due');
  const dueLbl = document.getElementById('nt_due_label');
  if (dueHid) dueHid.value = todayStr;
  if (dueLbl) dueLbl.textContent = todayLabel;

  const startHid = document.getElementById('nt_start');
  const startLbl = document.getElementById('nt_start_label');
  if (startHid) startHid.value = todayStr;
  if (startLbl) startLbl.textContent = todayLabel;

  // 성과포인트 필드 초기화
  ['nt_score_min','nt_score','nt_score_max'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  const modalTitle = document.querySelector('#newTaskModal .modal-title');
  const submitBtn  = document.querySelector('#newTaskModal .modal-foot .btn-blue');
  const rowPT      = document.getElementById('nt_row_priority_team');
  const rowDate    = document.getElementById('nt_row_dates');
  const rowImp     = document.getElementById('nt_row_important');
  const rowSel     = document.getElementById('nt_row_task_select');
  const rowScore   = document.getElementById('nt_row_score');

  const hide = el => { if (el) el.style.display = 'none'; };
  const show = el => { if (el) el.style.display = ''; };

  hide(rowSel);

  if (isSimple) {
    if (modalTitle) modalTitle.textContent = '업무 추가';
    if (submitBtn)  { submitBtn.textContent = '추가'; submitBtn.onclick = createNewTask; }
    hide(rowPT); hide(rowDate); hide(rowImp); hide(rowScore);

  } else if (mode === 'schedule') {
    if (modalTitle) modalTitle.textContent = '내 스케줄 추가';
    if (submitBtn)  { submitBtn.textContent = '스케줄 등록'; submitBtn.onclick = createNewTask; }
    hide(rowPT); show(rowDate); hide(rowImp); hide(rowScore);

    // 업무 선택 드롭다운 표시 및 채우기
    show(rowSel);
    const selEl = document.getElementById('nt_task_select');
    if (selEl) {
      const uid     = WS.currentUser?.id;
      const myTasks = WS.tasks.filter(t =>
        t.assignerId === uid || (t.assigneeIds||[]).includes(uid)
      );
      selEl.innerHTML = '<option value="">-- 업무 목록에서 선택 --</option>' +
        myTasks.map(t => '<option value="' + t.id + '">' + t.title + '</option>').join('');
    }

  } else if (mode === 'edit') {
    if (modalTitle) modalTitle.textContent = '업무 수정';
    if (submitBtn)  { submitBtn.textContent = '저장하기'; submitBtn.onclick = saveEditTask; }
    hide(rowPT); hide(rowDate); hide(rowImp); show(rowScore);

  } else {
    // 기본: 새 업무 등록
    if (modalTitle) modalTitle.textContent = '새 업무 지시';
    if (submitBtn)  { submitBtn.textContent = '업무 등록'; submitBtn.onclick = createNewTask; }
    show(rowPT); show(rowDate); show(rowImp); show(rowScore);
  }

  if (parentId) {
    const p = WS.getTask(parentId);
    if (p) showToast('info', '[' + p.title + '] 하위 업무를 추가합니다.');
  }
  openModal('newTaskModal');
}

/* openEditTaskModal – 성과포인트 복원 포함 */
function openEditTaskModal(id) {
  const t = WS.getTask(id);
  if (!t) return;
  window._editingTaskId = id;
  window._processTags   = t.processTags ? [...t.processTags] : [];

  const set = (elId, val) => {
    const el = document.getElementById(elId);
    if (el) el.value = val;
  };
  set('nt_title',  t.title);
  set('nt_desc',   t.desc || '');
  set('nt_priority', t.priority || 'medium');
  set('nt_team',   t.team || '');
  set('nt_result', t.reportContent || '');
  set('nt_score_min', t.scoreMin || 0);
  set('nt_score',     t.score    || 0);
  set('nt_score_max', t.scoreMax || 0);

  const dueHid = document.getElementById('nt_due');
  const dueLbl = document.getElementById('nt_due_label');
  if (dueHid) dueHid.value = t.dueDate || '';
  if (dueLbl && t.dueDate) {
    const [y,m,d] = t.dueDate.split('-');
    dueLbl.textContent = y + '년 ' + parseInt(m) + '월 ' + parseInt(d) + '일';
  }

  renderProcessTags();
  openNewTaskModal('edit', null, false);
}

/* ══════════════════════════════════════════════
   renderPage_RankMgmt – 이모지 버튼(✏️🗑️) 포함
══════════════════════════════════════════════ */
function renderPage_RankMgmt() {
  // 기본 데이터 초기화
  if (!WS.departments || !WS.departments.length) {
    WS.departments = [
      {id:1,name:'개발팀'},{id:2,name:'디자인팀'},
      {id:3,name:'마케팅팀'},{id:4,name:'경영지원팀'}
    ];
    WS.saveDepartments && WS.saveDepartments();
  }
  if (!WS.ranks || !WS.ranks.length) {
    WS.ranks = [
      {id:1,name:'사원',level:2},{id:2,name:'주임',level:3},
      {id:3,name:'대리',level:4},{id:4,name:'과장',level:5},
      {id:5,name:'차장',level:6},{id:6,name:'팀장',level:7},
      {id:7,name:'부장',level:8},{id:8,name:'이사',level:9},{id:9,name:'대표',level:10}
    ];
    WS.saveRanks && WS.saveRanks();
  }
  if (!WS.positions || !WS.positions.length) {
    WS.positions = [
      {id:1,name:'팀장'},{id:2,name:'설장'},{id:3,name:'본부장'},{id:4,name:'CEO'}
    ];
    WS.savePositions && WS.savePositions();
  }
  if (!WS.taskResults || !WS.taskResults.length) {
    WS.taskResults = [
      {id:1,name:'정상완료'},{id:2,name:'진행중'},
      {id:3,name:'부분완료'},{id:4,name:'보류'},{id:5,name:'취소'}
    ];
    WS.saveTaskResults && WS.saveTaskResults();
  }
  if (!WS.reportTypes || !WS.reportTypes.length) {
    WS.reportTypes = [
      {id:1,label:'업무시작', icon:'play-circle',    color:'#4f6ef7'},
      {id:2,label:'시장조사', icon:'search',          color:'#06b6d4'},
      {id:3,label:'작업중',   icon:'wrench',          color:'#9747ff'},
      {id:4,label:'작업완료', icon:'check-circle',    color:'#22c55e'},
      {id:5,label:'협의완료', icon:'message-circle',  color:'#f59e0b'},
      {id:6,label:'이슈발생', icon:'alert-triangle',  color:'#ef4444'},
      {id:7,label:'업무취소', icon:'x-circle',        color:'#6b7280'},
      {id:8,label:'보고서작성',icon:'file-text',      color:'#8b5cf6'}
    ];
    WS.saveReportTypes && WS.saveReportTypes();
  }

  // 아이템 카드 생성 함수
  function itemCard(type, item) {
    const label = item.level !== undefined
      ? '<span style="font-size:10px;color:var(--text-muted)">Lv.' + item.level + '</span>' : '';
    return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-radius:8px;background:var(--bg-tertiary);margin-bottom:6px">' +
      '<div style="font-size:13px;font-weight:600;color:var(--text-primary)">' + item.name + ' ' + label + '</div>' +
      '<div style="display:flex;gap:4px">' +
        '<button onclick="editOrgItem(\'' + type + '\',' + item.id + ')" title="수정" ' +
          'style="background:none;border:none;cursor:pointer;padding:3px 6px;font-size:13px">✏️</button>' +
        '<button onclick="deleteOrgItem(\'' + type + '\',' + item.id + ')" title="삭제" ' +
          'style="background:none;border:none;cursor:pointer;padding:3px 6px;font-size:13px">🗑️</button>' +
      '</div>' +
    '</div>';
  }

  const deptList   = document.getElementById('deptList');
  const rankList   = document.getElementById('rankList');
  const posList    = document.getElementById('posList');
  const resultList = document.getElementById('resultList');
  const rtList     = document.getElementById('reportTypeList');

  const emptyMsg = '<div style="color:var(--text-muted);font-size:12px;padding:8px">항목 없음</div>';

  if (deptList)   deptList.innerHTML   = WS.departments.map(d => itemCard('dept', d)).join('') || emptyMsg;
  if (rankList)   rankList.innerHTML   = WS.ranks.sort((a,b)=>a.level-b.level).map(r => itemCard('rank', r)).join('') || emptyMsg;
  if (posList)    posList.innerHTML    = WS.positions.map(p => itemCard('pos', p)).join('') || emptyMsg;
  if (resultList) resultList.innerHTML = WS.taskResults.map(r => itemCard('result', r)).join('') || emptyMsg;

  if (rtList) {
    rtList.innerHTML = WS.reportTypes.map(r =>
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-radius:8px;background:var(--bg-tertiary);margin-bottom:6px">' +
        '<div style="display:flex;align-items:center;gap:8px">' +
          '<span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:' + r.color + '22;border:1.5px solid ' + r.color + '">' +
            '<i data-lucide="' + r.icon + '" style="width:12px;height:12px;color:' + r.color + '"></i>' +
          '</span>' +
          '<span style="font-size:13px;font-weight:600;color:var(--text-primary)">' + r.label + '</span>' +
        '</div>' +
        '<div style="display:flex;gap:4px">' +
          '<button onclick="editReportType(' + r.id + ')" title="수정" style="background:none;border:none;cursor:pointer;padding:3px 6px;font-size:13px">✏️</button>' +
          '<button onclick="deleteOrgItem(\'reportType\',' + r.id + ')" title="삭제" style="background:none;border:none;cursor:pointer;padding:3px 6px;font-size:13px">🗑️</button>' +
        '</div>' +
      '</div>'
    ).join('') || emptyMsg;
  }

  const deptCount   = document.getElementById('deptCount');
  const rankCount   = document.getElementById('rankCount');
  const posCount    = document.getElementById('posCount');
  const resultCount = document.getElementById('resultCount');
  const rtCount     = document.getElementById('reportTypeCount');

  if (deptCount)   deptCount.textContent   = WS.departments.length;
  if (rankCount)   rankCount.textContent   = WS.ranks.length;
  if (posCount)    posCount.textContent    = WS.positions.length;
  if (resultCount) resultCount.textContent = WS.taskResults.length;
  if (rtCount)     rtCount.textContent     = WS.reportTypes.length;

  // 결과 드롭다운 채우기
  const resultSel = document.getElementById('nt_result');
  if (resultSel) {
    resultSel.innerHTML = '<option value="">-- 선택 --</option>' +
      WS.taskResults.map(r => '<option value="' + r.name + '">' + r.name + '</option>').join('');
  }

  refreshIcons();
}

/* ══════════════════════════════════════════════
   renderAttendancePill – 강조색(--currentAccent) 적용
   (style.css의 var(--currentAccent) 변수 사용)
══════════════════════════════════════════════ */
function renderAttendancePill() {
  const u   = WS.currentUser;
  if (!u) return;
  const rec = WS.getAttendance(u.id);
  if (!rec) return;

  const pillEl = document.getElementById('attendancePill');
  if (!pillEl) return;

  const inTime  = rec.checkIn  ? rec.checkIn.slice(11,16)  : '--:--';
  const outTime = rec.checkOut ? rec.checkOut.slice(11,16) : '--:--';

  const now    = new Date();
  const hh     = String(now.getHours()).padStart(2,'0');
  const mi     = String(now.getMinutes()).padStart(2,'0');
  const ss     = String(now.getSeconds()).padStart(2,'0');
  const workStr = rec.checkIn ? hh + ':' + mi + ':' + ss : '--:--:--';

  pillEl.innerHTML =
    '<span style="font-size:10px;font-weight:700;opacity:.8">출근</span>' +
    '<span style="font-weight:800;font-size:13px">' + inTime + '</span>' +
    '<span style="margin:0 2px;opacity:.6">→</span>' +
    '<span style="font-size:10px;font-weight:700;opacity:.8">퇴근</span>' +
    '<span style="font-weight:800;font-size:13px;margin-right:6px">' + outTime + '</span>' +
    '<span style="font-size:10px;background:rgba(255,255,255,.15);border-radius:8px;padding:2px 7px">' +
      '근무중 ' + workStr +
    '</span>';
}

// 1초마다 출퇴근 위젯 업데이트
setInterval(renderAttendancePill, 1000);
