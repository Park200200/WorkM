/**
 * modules/overrides.js
 * app.js 이후에 로드되어 특정 함수를 깨끗한 UTF-8 코드로 교체합니다.
 * 이 파일은 항상 UTF-8로만 저장/편집하세요.
 */

/* ══════════════════════════════════════════════
   showToast – 아이콘 제거, 강조색 배경 적용
══════════════════════════════════════════════ */
function showToast(type, msg, duration) {
  duration = duration || 3000;
  // msg 안의 <i data-lucide="...">...</i> 또는 <i ...></i> 태그 제거
  const cleanMsg = String(msg).replace(/<i[^>]*>.*?<\/i>/gi, '').replace(/<i[^>]*\/>/gi, '').trim();
  const c = document.getElementById('toastContainer');
  if (!c) return;
  const t = document.createElement('div');
  t.className = 'toast ' + (type || 'info');
  t.innerHTML = '<span class="t-msg">' + cleanMsg + '</span>';
  c.appendChild(t);
  setTimeout(function() {
    t.style.opacity = '0';
    t.style.transform = 'translateX(20px)';
    t.style.transition = 'all .3s';
    setTimeout(function() { t.remove(); }, 300);
  }, duration);
}

/* ══════════════════════════════════════════════
   triggerAddAccent – 네이티브 컬러피커로 강조색 추가
   (colorPickerPanel 대신 accentColorPicker input 사용)
══════════════════════════════════════════════ */
function triggerAddAccent() {
  const picker = document.getElementById('accentColorPicker');
  if (picker) {
    picker.click();
  }
}

/* ══════════════════════════════════════════════
   initHeader – 사용자 아바타·이름 안전하게 표시
══════════════════════════════════════════════ */
function initHeader() {
  const u = WS.currentUser;
  if (!u) return;
  const av  = u.avatar || (u.name ? u.name.slice(0,2) : '?');
  const col = u.color  || '#4f6ef7';
  const grad = 'linear-gradient(135deg,' + col + ',#9747ff)';

  const hAv = document.getElementById('headerAvatar');
  if (hAv) { hAv.textContent = av; hAv.style.background = grad; }
  const hNm = document.getElementById('headerName');
  if (hNm) hNm.textContent = u.name || '-';

  const sAv = document.getElementById('sidebarAvatar');
  if (sAv) { sAv.textContent = av; sAv.style.background = grad; }
  const sNm = document.getElementById('sidebarName');
  if (sNm) sNm.textContent = u.name || '-';
  const sRl = document.getElementById('sidebarRole');
  if (sRl) sRl.textContent =
    [u.dept, u.role].filter(Boolean).join(' · ') + (u.pos ? ' | ' + u.pos : '');

  const badge = document.getElementById('sideTaskBadge');
  if (badge) {
    const list = typeof WS.getAssignedToMe === 'function'
      ? WS.getAssignedToMe() : (WS.tasks || []);
    badge.textContent = list.filter(t => t.status !== 'done').length;
  }
  if (typeof renderNotifBadge === 'function') renderNotifBadge();
  if (typeof renderNotifList  === 'function') renderNotifList();
}



/* ══════════════════════════════════════════════
   색상 유틸 – HEX ↔ HSL 변환
══════════════════════════════════════════════ */
function _hexToHSL(hex) {
  const r = parseInt(hex.slice(1,3),16)/255;
  const g = parseInt(hex.slice(3,5),16)/255;
  const b = parseInt(hex.slice(5,7),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function _hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s));
  l = Math.max(0, Math.min(100, l));
  const hn = h / 360, sn = s / 100, ln = l / 100;
  let r, g, b;
  if (sn === 0) { r = g = b = ln; }
  else {
    const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
    const p = 2 * ln - q;
    const hue2 = (t) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1/6) return p + (q-p)*6*t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q-p)*(2/3-t)*6;
      return p;
    };
    r = hue2(hn + 1/3); g = hue2(hn); b = hue2(hn - 1/3);
  }
  return '#' + [r,g,b].map(x => Math.round(x*255).toString(16).padStart(2,'0')).join('');
}

/* ══════════════════════════════════════════════
   renderDesignSystem – 강조색 기반 7색 팔레트 생성
══════════════════════════════════════════════ */
function renderDesignSystem(accentHex) {
  if (!accentHex || accentHex.length < 4) return;
  const [h, s, l] = _hexToHSL(accentHex);

  const palette = [
    { key: '--ds-primary',   label: '기본컬러',   hex: accentHex },
    { key: '--ds-secondary', label: '보조컬러',   hex: _hslToHex((h+40)%360, Math.round(s*0.55), Math.min(l+18,82)) },
    { key: '--ds-accent',    label: '강조컬러',   hex: _hslToHex(h, Math.min(s+12,100), Math.max(l-18,20)) },
    { key: '--ds-neutral',   label: '중립컬러',   hex: _hslToHex(h, 14, 54) },
    { key: '--ds-bg',        label: '배경컬러',   hex: _hslToHex(h, 10, 97) },
    { key: '--ds-surface',   label: '표면컬러',   hex: _hslToHex(h, 13, 91) },
    { key: '--ds-text',      label: '텍스트컬러', hex: _hslToHex(h, 20, 16) },
  ];

  // CSS 변수에 적용
  const root = document.documentElement;
  palette.forEach(c => root.style.setProperty(c.key, c.hex));

  // #designSystemColors 섹션 동적 생성 (없으면 theme-tab에 추가)
  let el = document.getElementById('designSystemColors');
  if (!el) {
    el = document.createElement('div');
    el.id = 'designSystemColors';
    const themeTab = document.getElementById('theme-tab');
    if (themeTab) themeTab.appendChild(el);
    else return;
  }

  el.innerHTML =
    '<div style="background:var(--bg-tertiary);border-radius:var(--radius-md);padding:16px;margin-top:16px">' +
      '<div style="font-size:12px;font-weight:700;color:var(--text-secondary);margin-bottom:14px;' +
           'display:flex;align-items:center;gap:6px;letter-spacing:.5px;text-transform:uppercase">' +
        '<i data-lucide="palette" style="width:14px;height:14px"></i> 디자인 시스템 컬러' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px">' +
        palette.map(c => {
          const isLight = _hexToHSL(c.hex)[2] > 60;
          const textCol = isLight ? '#1a1d2e' : '#ffffff';
          return (
            '<div style="text-align:center;cursor:pointer" ' +
              'onclick="(function(){try{navigator.clipboard.writeText(\'' + c.hex + '\')}catch(e){}' +
              'showToast(\'success\',\'' + c.hex.toUpperCase() + ' 복사됨\')})()" ' +
              'title="클릭하여 복사: ' + c.hex.toUpperCase() + '">' +
              '<div style="width:100%;aspect-ratio:1;border-radius:10px;background:' + c.hex + ';' +
                   'border:1.5px solid rgba(0,0,0,.08);margin-bottom:6px;' +
                   'display:flex;align-items:center;justify-content:center;' +
                   'font-size:9px;font-weight:700;color:' + textCol + ';' +
                   'transition:transform .15s;box-shadow:0 2px 8px rgba(0,0,0,.10)" ' +
                   'onmouseover="this.style.transform=\'scale(1.08)\'" ' +
                   'onmouseout="this.style.transform=\'\'">' +
              '</div>' +
              '<div style="font-size:10px;font-weight:700;color:var(--text-primary);margin-bottom:2px">' + c.label + '</div>' +
              '<div style="font-size:9px;color:var(--text-muted);font-family:monospace">' + c.hex.toUpperCase() + '</div>' +
            '</div>'
          );
        }).join('') +
      '</div>' +
      '<div style="font-size:10px;color:var(--text-muted);margin-top:10px">' +
        '색상 칩을 클릭하면 HEX 코드가 클립보드에 복사됩니다.' +
      '</div>' +
    '</div>';

  refreshIcons();
}

/* ══════════════════════════════════════════════
   applyAccent – 강조색 적용 + 디자인 시스템 업데이트
══════════════════════════════════════════════ */
function applyAccent(color) {
  WS.currentAccent = color;
  localStorage.setItem('ws_current_accent', color);

  const root = document.documentElement;
  root.style.setProperty('--accent-blue', color);
  root.style.setProperty('--currentAccent', color);
  root.style.setProperty('--accent-blue-light', color + '22');
  root.style.setProperty('--bg-sidebar-active', color + '1a');

  document.querySelectorAll('.accent-chip').forEach(chip => {
    chip.classList.toggle('active',
      chip.style.background === color || chip.dataset.color === color);
  });

  showToast('success', '강조색이 변경되었습니다.');
  refreshIcons();
  if (typeof renderAttendancePill === 'function') renderAttendancePill();

  // 디자인 시스템 컬러 팔레트 업데이트
  renderDesignSystem(color);
}


/* ══════════════════════════════════════════════
   switchProfileTab – theme-tab 전환 시 hover 리스너 초기화
══════════════════════════════════════════════ */
function switchProfileTab(tabId, el) {
  document.querySelectorAll('#page-profile .tab-item').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  ['profile-tab', 'notif-tab', 'theme-tab'].forEach(id => {
    const t = document.getElementById(id);
    if (t) t.style.display = id === tabId ? 'block' : 'none';
  });

  if (tabId === 'theme-tab') {
    setTimeout(() => {
      // 현재 강조색으로 디자인 시스템 패널 초기화
      const accent = WS.currentAccent || localStorage.getItem('ws_current_accent') || '#4f6ef7';
      renderDesignSystem(accent);

      // accent chip 목록에 hover 이벤트 (한 번만 등록)
      const accentList = document.getElementById('accentList');
      if (accentList && !accentList._dsHoverBound) {
        accentList._dsHoverBound = true;

        accentList.addEventListener('mouseover', function(e) {
          const chip = e.target.closest('.accent-chip');
          if (!chip) return;
          // background: 'rgb(...)' 또는 '#hex' 형태
          const bg = chip.style.background || chip.style.backgroundColor;
          if (bg) renderDesignSystem(_normalizeColor(bg));
        });

        accentList.addEventListener('mouseleave', function() {
          // 마우스가 목록을 벗어나면 현재 실제 강조색 팔레트 복원
          const cur = WS.currentAccent || localStorage.getItem('ws_current_accent') || '#4f6ef7';
          renderDesignSystem(cur);
        });
      }
    }, 60);
  }
}

/* rgb(...) 색상 문자열을 #hex로 변환 */
function _normalizeColor(colorStr) {
  if (!colorStr) return '#4f6ef7';
  if (colorStr.startsWith('#')) return colorStr;
  // rgb(r,g,b) → #hex
  const m = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (m) {
    return '#' + [m[1],m[2],m[3]]
      .map(n => parseInt(n).toString(16).padStart(2,'0')).join('');
  }
  return colorStr;
}

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

  if (!title) {
    showToast('error', '업무 제목을 입력하세요');
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  // 날짜: nt_due 값 사용, 없으면 오늘+30일 자동 설정
  const dueRaw = document.getElementById('nt_due')?.value;
  const due = dueRaw || (() => {
    const d = new Date(); d.setDate(d.getDate()+30);
    return d.toISOString().split('T')[0];
  })();

  // 팀 체크박스 선택값 읽기 (복수)
  const checkedTeams = Array.from(
    document.querySelectorAll('#nt_teams_checkboxes input[type=checkbox]:checked')
  ).map(cb => cb.value);
  const teamValue = checkedTeams.length ? checkedTeams.join(', ') : (document.getElementById('nt_team')?.value || '');

  const nt = {
    id:            Date.now(),
    title:         title,
    desc:          document.getElementById('nt_desc')?.value || '',
    assignerId:    WS.currentUser?.id || 1,
    assigneeIds:   _getSelectedCollaboratorIds().length
                     ? _getSelectedCollaboratorIds()
                     : [],
    status:        'waiting',
    priority:      document.getElementById('nt_priority')?.value || 'medium',
    progress:      0,
    dueDate:       due,
    createdAt:     today,
    startedAt:     document.getElementById('nt_start')?.value || null,
    isImportant:   document.getElementById('nt_important')?.checked || false,
    team:          teamValue,
    teams:         checkedTeams,
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

    // 팀 체크박스 숨기고 협업대상자 섹션 표시
    const rowTeamsCheck2 = document.getElementById('nt_row_teams_check');
    hide(rowTeamsCheck2);
    _showCollaborators();

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
    // 기본: 새 업무 추가
    if (modalTitle) modalTitle.textContent = '새 업무 추가';
    if (submitBtn)  { submitBtn.textContent = '업무 등록'; submitBtn.onclick = createNewTask; }
    hide(rowPT); hide(rowDate); show(rowImp); show(rowScore);
    // 협업대상자 섹션 숨김
    _hideCollaborators();
    // 팀 체크박스 표시 및 채우기
    const rowTeamsCheck = document.getElementById('nt_row_teams_check');
    show(rowTeamsCheck);
    _populateTeamCheckboxes();
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
   renderAttendancePill – 새 출퇴근 위젯 실시간 업데이트
══════════════════════════════════════════════ */
function renderAttendancePill() {
  const u = WS.currentUser;
  if (!u) return;
  // 올바른 API: getTodayAttendance
  const rec = typeof WS.getTodayAttendance === 'function'
    ? WS.getTodayAttendance(u.id)
    : null;

  const now = new Date();
  const hh = String(now.getHours()).padStart(2,'0');
  const mi = String(now.getMinutes()).padStart(2,'0');
  const ss = String(now.getSeconds()).padStart(2,'0');

  // 현재 시간 표시
  const nowEl = document.getElementById('attNowTime');
  if (nowEl) nowEl.textContent = hh + ':' + mi + ':' + ss;

  // 출근 시간 표시 (checkInRaw = "HH:MM" 24시간 형식)
  const inEl = document.getElementById('attCheckInTime');
  if (inEl) inEl.textContent = (rec && rec.checkInRaw) ? rec.checkInRaw : '--:--';

  // 근무 시간 누적 계산 (checkInRaw 기반)
  const workEl = document.getElementById('attWorkTime');
  if (workEl) {
    if (rec && rec.checkInRaw) {
      const [chH, chM] = rec.checkInRaw.split(':').map(Number);
      const checkInDate = new Date(
        now.getFullYear(), now.getMonth(), now.getDate(), chH, chM, 0
      );
      const diffMs = now - checkInDate;
      if (diffMs >= 0) {
        const totalMin = Math.floor(diffMs / 60000);
        const wh = Math.floor(totalMin / 60);
        const wm = totalMin % 60;
        workEl.textContent = String(wh).padStart(2,'0') + ':' + String(wm).padStart(2,'0');
      } else {
        workEl.textContent = '00:00';
      }
    } else {
      workEl.textContent = '--:--';
    }
  }

  // ── 강조색 기반 색상 적용 ──
  const accent = WS.currentAccent || localStorage.getItem('ws_current_accent') || '#4f6ef7';
  const [aH, aS] = _hexToHSL(accent);
  const bgCol  = _hslToHex(aH, Math.min(aS, 55), 14);  // 어두운 배경
  const btnCol = _hslToHex(aH, Math.min(aS, 65), 24);  // 버튼 (약간 밝음)
  const txtCol = _hslToHex(aH, 60, 88);                // 흰계열 텍스트
  const lblCol = _hslToHex(aH, 45, 58);                // 라벨 중간 밝기

  const pill = document.getElementById('attendancePill');
  if (pill) {
    pill.style.background = bgCol;
    // 퇴근 버튼 색
    const btn = pill.querySelector('[onclick="doCheckOut()"]');
    if (btn) { btn.style.background = btnCol; btn._accentApplied = true; }
    // 시간 텍스트 색
    ['attCheckInTime','attNowTime','attWorkTime'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.color = txtCol;
    });
    // 라벨 색 (pill 안의 소형 label div들 - 첫 번째 div 자식)
    pill.querySelectorAll('[style*="font-size:10px"]').forEach(el => {
      el.style.color = lblCol;
    });
  }
}

// 1초마다 출퇴근 위젯 업데이트
setInterval(renderAttendancePill, 1000);

/* ══════════════════════════════════════════════
   doCheckOut – 퇴근 클릭 처리
   인사 메시지 2초 후 로그아웃
══════════════════════════════════════════════ */
function doCheckOut() {
  const u = WS.currentUser;
  if (!u) return;

  // 근무 총 시간 계산
  const rec = typeof WS.getTodayAttendance === 'function' ? WS.getTodayAttendance(u.id) : null;
  let totalStr = '0시간 0분';
  if (rec && rec.checkInRaw) {
    const now = new Date();
    const [chH, chM] = rec.checkInRaw.split(':').map(Number);
    const checkInDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), chH, chM, 0);
    const totalMin = Math.max(0, Math.floor((now - checkInDate) / 60000));
    const wh = Math.floor(totalMin / 60);
    const wm = totalMin % 60;
    totalStr = wh + '시간 ' + wm + '분';
  }

  // 퇴근 기록
  if (typeof WS.checkOut === 'function') WS.checkOut(u.id);

  // 인사 메시지 오버레이 표시
  const overlay = document.createElement('div');
  overlay.id = 'checkoutOverlay';
  overlay.style.cssText =
    'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;' +
    'background:rgba(0,0,0,.65);backdrop-filter:blur(6px);animation:fadeIn .3s ease';
  overlay.innerHTML =
    '<div style="background:#2d3a1e;border-radius:20px;padding:40px 48px;text-align:center;' +
         'max-width:480px;box-shadow:0 20px 60px rgba(0,0,0,.4)">' +
      '<div style="font-size:48px;margin-bottom:16px">🌇</div>' +
      '<div style="font-size:22px;font-weight:800;color:#e8f5d0;margin-bottom:10px">' +
        u.name + '님, 오늘도 수고하셨습니다!' +
      '</div>' +
      '<div style="font-size:16px;color:#8fae6a;margin-bottom:6px">' +
        '오늘 총 근무시간은 <strong style="color:#e8f5d0">' + totalStr + '</strong> 입니다.' +
      '</div>' +
      '<div style="font-size:13px;color:#6d8f4f;margin-top:8px">' +
        '퇴근 후 즐거운 시간 되시길 바랍니다 🍀' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);

  // 2초 후 로그아웃
  setTimeout(function() {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity .4s';
    setTimeout(function() {
      if (typeof logout === 'function') logout();
      else {
        localStorage.removeItem('ws_user');
        window.location.href = 'login.html';
      }
    }, 400);
  }, 2000);
}


/* 팀 체크박스 populate */
function _populateTeamCheckboxes(selectedTeams) {
  const wrap = document.getElementById('nt_teams_checkboxes');
  if (!wrap) return;
  const depts = (WS.departments && WS.departments.length)
    ? WS.departments
    : [
        {name:'개발팀'},{name:'기획팀'},
        {name:'디자인팀'},{name:'마케팅팀'},
        {name:'경영지원팀'}
      ];
  const sel = selectedTeams || [];
  wrap.innerHTML = depts.map(d =>
    '<label style="display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border-radius:8px;background:var(--bg-secondary);border:1.5px solid var(--border-color);cursor:pointer;font-size:12.5px;font-weight:600;color:var(--text-secondary);transition:all .15s" ' +
      'onmouseover="this.style.borderColor=\'var(--accent-blue)\'" ' +
      'onmouseout="if(!this.querySelector(\'input\').checked)this.style.borderColor=\'var(--border-color)\'">' +
      '<input type="checkbox" value="' + d.name + '" ' + (sel.includes(d.name)?'checked':'') + ' ' +
        'onchange="this.closest(\'label\').style.background=this.checked?\'rgba(79,110,247,.12)\':\'var(--bg-secondary)\';' +
                  'this.closest(\'label\').style.borderColor=this.checked?\'var(--accent-blue)\':\'var(--border-color)\'" ' +
        'style="accent-color:var(--accent-blue)">' +
      d.name +
    '</label>'
  ).join('');
}

/* 협업대상자 섹션 생성/표시 (schedule 모드 전용) */
function _showCollaborators(selectedIds) {
  // 기존 섹션 제거 후 재생성
  let sec = document.getElementById('nt_row_collaborators');
  if (!sec) {
    sec = document.createElement('div');
    sec.id = 'nt_row_collaborators';
    sec.className = 'form-group';
    // nt_row_teams_check 바로 아래에 삽입
    const ref = document.getElementById('nt_row_teams_check');
    if (ref && ref.parentNode) ref.parentNode.insertBefore(sec, ref.nextSibling);
    else {
      const body = document.querySelector('#newTaskModal .modal-body');
      if (body) body.appendChild(sec);
    }
  }
  sec.style.display = '';

  const users = (WS.users || []).filter(u => u.id !== WS.currentUser?.id);
  const sel = selectedIds || [];

  const checkboxStyle =
    'display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border-radius:8px;' +
    'background:var(--bg-secondary);border:1.5px solid var(--border-color);cursor:pointer;' +
    'font-size:12.5px;font-weight:600;color:var(--text-secondary);transition:all .15s';

  sec.innerHTML =
    '<label class="form-label">' +
      '협업대상자 <span style="font-size:10px;color:var(--text-muted)">(복수 선택 가능)</span>' +
    '</label>' +
    '<div id="nt_collaborator_boxes" style="display:flex;flex-wrap:wrap;gap:8px;padding:10px 12px;' +
      'background:var(--bg-tertiary);border:1px solid var(--border-color);border-radius:10px">' +
      (users.length === 0
        ? '<div style="color:var(--text-muted);font-size:12px">등록된 직원이 없습니다.</div>'
        : users.map(u =>
          '<label style="' + checkboxStyle + '" ' +
            'onmouseover="this.style.borderColor=\'var(--accent-blue)\'" ' +
            'onmouseout="if(!this.querySelector(\'input\').checked)this.style.borderColor=\'var(--border-color)\'">' +
            '<input type="checkbox" value="' + u.id + '" ' + (sel.includes(u.id) ? 'checked' : '') + ' ' +
              'onchange="' +
                'this.closest(\'label\').style.background=this.checked?\'rgba(79,110,247,.12)\':\' var(--bg-secondary)\';' +
                'this.closest(\'label\').style.borderColor=this.checked?\'var(--accent-blue)\':\' var(--border-color)\';" ' +
              'style="accent-color:var(--accent-blue)">' +
            '<span style="display:inline-flex;align-items:center;justify-content:center;' +
              'width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,' + (u.color||'#4f6ef7') + ',#9747ff);' +
              'font-size:11px;color:#fff;font-weight:700;flex-shrink:0">' + (u.avatar||u.name[0]) + '</span>' +
            '<span>' + u.name + '</span>' +
            '<span style="font-size:10px;color:var(--text-muted)">' + (u.dept||'') + '</span>' +
          '</label>'
        ).join(''))
    + '</div>';
}

/* 협업대상자 섹션 숨기기 */
function _hideCollaborators() {
  const sec = document.getElementById('nt_row_collaborators');
  if (sec) sec.style.display = 'none';
}

/* createNewTask에서 협업대상자 ID 읽기 (schedule 모드용) */
function _getSelectedCollaboratorIds() {
  return Array.from(
    document.querySelectorAll('#nt_collaborator_boxes input[type=checkbox]:checked')
  ).map(cb => parseInt(cb.value)).filter(Boolean);
}

