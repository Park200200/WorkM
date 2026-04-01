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
    if (aMode === 'task')       renderAssignmentByTask();
    else if (aMode === 'staff') renderAssignmentByStaff();
    else if (aMode === 'team')  renderAssignmentByTeam();
    else                        renderAssignmentByTask();
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
  if (!t) { showToast('error', '업무 정보를 찾을 수 없습니다.'); return; }
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

  // 캡슐 슬라이더 값 우선, 없으면 slider, 그도 없으면 t.progress
  const slider      = document.getElementById('progressSlider_' + taskId);
  const progInp     = document.getElementById('progressInput_' + taskId);
  const progressNow = progInp    ? (parseInt(progInp.value)  || 0)
                    : slider     ? (parseInt(slider.value)   || 0)
                    : (t.progress || 0);

  // 진행순서 선택값 (td_stepSelect)
  const stepEl    = document.getElementById('td_stepSelect');
  const stepLabel = stepEl ? (stepEl.value || '') : '';

  // 진행율 즉시 반영
  t.progress = progressNow;

  const todayIdx = t.history.findIndex(h => h.date === dateStr);
  let isUpdate = false;

  const userId = WS.currentUser ? WS.currentUser.id : null;
  const entry = { date: dateStr, event: label, detail: text, icon, color,
                  progress: progressNow, stepLabel, userId };

  if (todayIdx !== -1) {
    t.history[todayIdx] = entry;
    isUpdate = true;
  } else {
    t.history.push(entry);
  }
  WS.saveTasks();

  // 히스토리 즉시 갱신 – historyTimeline_(openTaskDetail) 또는 renderTaskHistory(openReceivedTaskDetail) 두 방식 모두 지원
  const timeline = document.getElementById('historyTimeline_' + taskId);
  if (timeline) {
    // openTaskDetail 구조
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
  } else {
    // openReceivedTaskDetail 구조 – renderTaskHistory로 갱신
    if (typeof renderTaskHistory === 'function') renderTaskHistory(taskId);
    // 히스토리 버튼 내 건수 갱신
    const histSection = document.getElementById('historySection_' + taskId);
    if (histSection) {
      histSection.querySelectorAll('span').forEach(function(sp) {
        if (/^\d+건$/.test(sp.textContent)) sp.textContent = t.history.length + '건';
      });
    }
  }
  refreshIcons();

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
    showToast('error', '업무명을 입력하세요');
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
    reportContent: window._ntSelectedResult || document.getElementById('nt_result')?.value || '',
    processTags:   window._processOrder || window._processTags || [],
    attachments:   (window._ntAttachFiles || []).map(function(f){ return f.name; }),
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
  window._processTags     = [];
  window._processOrder    = [];
  window._newParentId     = null;
  window._ntSelectedResult = '';
  window._ntAttachFiles   = [];
  var ntFileListEl = document.getElementById('nt_attach_file_list');
  if (ntFileListEl) ntFileListEl.innerHTML = '';

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
    if (modalTitle) modalTitle.textContent = '내가 추진하는 업무 추가';
    if (submitBtn)  { submitBtn.textContent = '등록'; submitBtn.onclick = createScheduleTask; }
    hide(rowPT); hide(rowDate); hide(rowImp); hide(rowScore);

    var normalFields   = document.getElementById('nt_normal_fields');
    var scheduleFields = document.getElementById('nt_schedule_fields');
    var rowTeamsCheck2 = document.getElementById('nt_row_teams_check');
    if (normalFields)   normalFields.style.display   = 'none';
    if (rowTeamsCheck2) rowTeamsCheck2.style.display  = 'none';
    if (scheduleFields) { scheduleFields.style.display = 'flex'; scheduleFields.style.flexDirection = 'column'; scheduleFields.style.gap = '14px'; }
    // 상단 기존 필드 숨김 (업무명 제외, 첨부파일/상세업무 숨김)
    var fgAttach = document.getElementById('nt_fg_attach');
    var fgDetail = document.getElementById('nt_fg_detail');
    if (fgAttach) fgAttach.style.display = 'none';
    if (fgDetail) fgDetail.style.display = 'none';

    var tod = new Date();
    var yy = tod.getFullYear(), mo = String(tod.getMonth()+1).padStart(2,'0'), da = String(tod.getDate()).padStart(2,'0');
    var schedDueHid = document.getElementById('nt_sched_due');
    var schedDueLbl = document.getElementById('nt_sched_due_label');
    if (schedDueHid) schedDueHid.value = yy + '-' + mo + '-' + da;
    if (schedDueLbl) schedDueLbl.textContent = yy + '년 ' + parseInt(mo) + '월 ' + parseInt(da) + '일';

    if (typeof _renderNtSchedImportance === 'function') _renderNtSchedImportance();
    if (typeof _renderNtSchedStatus    === 'function') _renderNtSchedStatus();
    window._ntSchedCollabIds = [];
    if (typeof _renderNtSchedCollabBox === 'function') _renderNtSchedCollabBox();
    window._ntSchedFiles = [];
    var fl = document.getElementById('nt_sched_file_list');
    if (fl) fl.innerHTML = '';
    var sc = document.getElementById('nt_sched_content');
    if (sc) sc.value = '';

    // 업무선택 초기화
    _clearNtSchedTask();
    // 업무결과 칩 렌더
    if (typeof _renderNtSchedResult === 'function') _renderNtSchedResult();
    // 진행순서 칩 목록 렌더 + 선택 초기화
    window._ntSchedProcess = [];
    if (typeof _renderNtSchedProcessList === 'function') _renderNtSchedProcessList();
    if (typeof _updateNtSchedProcessSelected === 'function') _updateNtSchedProcessSelected();

  } else if (mode === 'edit') {
    if (modalTitle) modalTitle.textContent = '업무 수정';
    if (submitBtn)  { submitBtn.textContent = '저장하기'; submitBtn.onclick = saveEditTask; }
    hide(rowPT); hide(rowDate); hide(rowImp); show(rowScore);
    if (typeof _resetScheduleFields === 'function') _resetScheduleFields();

  } else {
    if (modalTitle) modalTitle.textContent = '새 업무 추가';
    if (submitBtn)  { submitBtn.textContent = '업무 등록'; submitBtn.onclick = createNewTask; }
    hide(rowPT); hide(rowDate); show(rowImp); show(rowScore);
    if (typeof _resetScheduleFields === 'function') _resetScheduleFields();
    _hideCollaborators();
    var rowTeamsCheck = document.getElementById('nt_row_teams_check');
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
      {id:1, name:'정상완료', icon:'check-circle',   color:'#22c55e'},
      {id:2, name:'진행중',   icon:'refresh-cw',    color:'#06b6d4'},
      {id:3, name:'부분완료', icon:'git-branch',    color:'#f59e0b'},
      {id:4, name:'보류',     icon:'pause-circle',  color:'#6b7280'},
      {id:5, name:'취소',     icon:'x-circle',      color:'#ef4444'},
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
    const editBtn   = '<button onclick="editOrgItem(\'' + type + '\',' + item.id + ')" title="수정" style="background:none;border:none;cursor:pointer;padding:3px 6px;font-size:13px">✏️</button>';
    const deleteBtn = '<button onclick="deleteOrgItem(\'' + type + '\',' + item.id + ')" title="삭제" style="background:none;border:none;cursor:pointer;padding:3px 6px;font-size:13px">🗑️</button>';

    // 업무결과: lucide 아이콘 + 컬러 배지 표시
    if (type === 'result') {
      var c = item.color || '#6b7280';
      var hasLucide = item.icon && item.icon.length > 2;
      var circleInner = hasLucide
        ? '<i data-lucide="' + item.icon + '" style="width:12px;height:12px;color:' + c + '"></i>'
        : '<span style="width:8px;height:8px;border-radius:50%;background:' + c + ';display:inline-block"></span>';
      return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-radius:8px;background:var(--bg-tertiary);margin-bottom:6px">' +
        '<div style="display:flex;align-items:center;gap:8px">' +
          '<span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:' + c + '22;border:1.5px solid ' + c + '">' +
            circleInner +
          '</span>' +
          '<span style="font-size:13px;font-weight:700;color:' + c + '">' + item.name + '</span>' +
        '</div>' +
        '<div style="display:flex;gap:4px">' + editBtn + deleteBtn + '</div>' +
      '</div>';
    }
    // 이모지 아이콘 (단순 텍스트) 또는 아이콘 없음
    var iconPart = (item.icon && item.icon.length <= 2) ? '<span style="margin-right:4px">' + item.icon + '</span>' : '';
    return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-radius:8px;background:var(--bg-tertiary);margin-bottom:6px">' +
      '<div style="font-size:13px;font-weight:600;color:var(--text-primary)">' + iconPart + item.name + ' ' + label + '</div>' +
      '<div style="display:flex;gap:4px">' + editBtn + deleteBtn + '</div>' +
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
  if (resultList) resultList.innerHTML = WS.taskResults.map(r => {
    var c = r.color || '#22c55e';
    var hasLucide = r.icon && r.icon.length > 2;
    var circleInner = hasLucide
      ? '<i data-lucide="' + r.icon + '" style="width:12px;height:12px;color:' + c + '"></i>'
      : (r.icon && r.icon.length <= 2 ? '<span style="font-size:12px">' + r.icon + '</span>' : '<span style="width:8px;height:8px;border-radius:50%;background:' + c + ';display:inline-block"></span>');
    return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-radius:8px;background:var(--bg-tertiary);margin-bottom:6px">' +
      '<div style="display:flex;align-items:center;gap:8px">' +
        '<span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:' + c + '22;border:1.5px solid ' + c + '">' + circleInner + '</span>' +
        '<span style="font-size:13px;font-weight:600;color:var(--text-primary)">' + r.name + '</span>' +
      '</div>' +
      '<div style="display:flex;gap:4px">' +
        '<button onclick="openResultModal(' + r.id + ')" title="수정" style="background:none;border:none;cursor:pointer;padding:3px 6px;font-size:13px">✏️</button>' +
        '<button onclick="deleteOrgItem(\'result\',' + r.id + ')" title="삭제" style="background:none;border:none;cursor:pointer;padding:3px 6px;font-size:13px">🗑️</button>' +
      '</div>' +
    '</div>';
  }).join('') || emptyMsg;

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
  const iiCount     = document.getElementById('instrImportanceCount');

  if (deptCount)   deptCount.textContent   = WS.departments.length;
  if (rankCount)   rankCount.textContent   = WS.ranks.length;
  if (posCount)    posCount.textContent    = WS.positions.length;
  if (resultCount) resultCount.textContent = WS.taskResults.length;
  if (rtCount)     rtCount.textContent     = WS.reportTypes.length;

  // 지시 중요도 렌더
  WS.instrImportances = JSON.parse(localStorage.getItem('ws_instr_importances')) || WS.instrImportances || [];
  var iiList = document.getElementById('instrImportanceList');
  if (iiList) {
    iiList.innerHTML = WS.instrImportances.map(function(imp) {
      var c = imp.color || '#ef4444';
      var hasLucide = imp.icon && imp.icon.length > 2;
      var circleInner = hasLucide
        ? '<i data-lucide="' + imp.icon + '" style="width:12px;height:12px;color:' + c + '"></i>'
        : '<span style="width:8px;height:8px;border-radius:50%;background:' + c + ';display:inline-block"></span>';
      return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-radius:8px;background:var(--bg-tertiary);margin-bottom:6px">' +
        '<div style="display:flex;align-items:center;gap:8px">' +
          '<span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:' + c + '22;border:1.5px solid ' + c + '">' + circleInner + '</span>' +
          '<span style="font-size:13px;font-weight:600;color:var(--text-primary)">' + imp.name + '</span>' +
        '</div>' +
        '<div style="display:flex;gap:4px">' +
          '<button onclick="openInstrImportanceModal(' + imp.id + ')" title="수정" style="background:none;border:none;cursor:pointer;padding:3px 6px;font-size:13px">✏️</button>' +
          '<button onclick="deleteInstrImportance(' + imp.id + ')" title="삭제" style="background:none;border:none;cursor:pointer;padding:3px 6px;font-size:13px">🗑️</button>' +
        '</div>' +
      '</div>';
    }).join('') || emptyMsg;
  }
  if (iiCount) iiCount.textContent = (WS.instrImportances || []).length;

  // 진행상태 렌더
  WS.taskStatuses = JSON.parse(localStorage.getItem('ws_task_statuses')) || WS.taskStatuses || [];
  var tsList  = document.getElementById('taskStatusList');
  var tsCount = document.getElementById('taskStatusCount');
  if (tsList) {
    tsList.innerHTML = WS.taskStatuses.map(function(s) {
      var c = s.color || '#06b6d4';
      var hasLucide = s.icon && s.icon.length > 2;
      var circleInner = hasLucide
        ? '<i data-lucide="' + s.icon + '" style="width:12px;height:12px;color:' + c + '"></i>'
        : '<span style="width:8px;height:8px;border-radius:50%;background:' + c + ';display:inline-block"></span>';
      return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-radius:8px;background:var(--bg-tertiary);margin-bottom:6px">' +
        '<div style="display:flex;align-items:center;gap:8px">' +
          '<span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:' + c + '22;border:1.5px solid ' + c + '">' + circleInner + '</span>' +
          '<span style="font-size:13px;font-weight:600;color:var(--text-primary)">' + s.name + '</span>' +
        '</div>' +
        '<div style="display:flex;gap:4px">' +
          '<button onclick="openTaskStatusModal(' + s.id + ')" title="수정" style="background:none;border:none;cursor:pointer;padding:3px 6px;font-size:13px">✏️</button>' +
          '<button onclick="deleteTaskStatus(' + s.id + ')" title="삭제" style="background:none;border:none;cursor:pointer;padding:3px 6px;font-size:13px">🗑️</button>' +
        '</div>' +
      '</div>';
    }).join('') || emptyMsg;
    setTimeout(refreshIcons, 50);
  }
  if (tsCount) tsCount.textContent = (WS.taskStatuses || []).length;

  // 상세업무 렌더
  WS.detailTasks = JSON.parse(localStorage.getItem('ws_detail_tasks')) || WS.detailTasks || [];
  var dtList  = document.getElementById('detailTaskList');
  var dtCount = document.getElementById('detailTaskCount');
  if (dtList) {
    dtList.innerHTML = WS.detailTasks.map(function(d) {
      return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-radius:8px;background:var(--bg-tertiary);margin-bottom:6px">' +
        '<div style="font-size:13px;font-weight:600;color:var(--text-primary)">' + d.name + '</div>' +
        '<div style="display:flex;gap:4px">' +
          '<button onclick="editDetailTask(' + d.id + ')" title="수정" style="background:none;border:none;cursor:pointer;padding:3px 6px;font-size:13px">✏️</button>' +
          '<button onclick="deleteDetailTask(' + d.id + ')" title="삭제" style="background:none;border:none;cursor:pointer;padding:3px 6px;font-size:13px">🗑️</button>' +
        '</div>' +
      '</div>';
    }).join('') || emptyMsg;
  }
  if (dtCount) dtCount.textContent = (WS.detailTasks || []).length;

  // 결과 드롭다운 채우기 (공통 함수 사용)
  renderResultSelect('');

  // 기존 데이터 마이그레이션: icon/color 없는 항목에 기본값 부여
  var _defaultResultMeta = {
    '정상완료': { icon:'check-circle',  color:'#22c55e' },
    '진행중':   { icon:'refresh-cw',    color:'#06b6d4' },
    '부분완료': { icon:'git-branch',    color:'#f59e0b' },
    '보류':     { icon:'pause-circle',  color:'#6b7280' },
    '취소':     { icon:'x-circle',      color:'#ef4444' },
  };
  var _migrated = false;
  (WS.taskResults || []).forEach(function(r) {
    if ((!r.icon || r.icon.length <= 2) && !r.color && _defaultResultMeta[r.name]) {
      r.icon  = _defaultResultMeta[r.name].icon;
      r.color = _defaultResultMeta[r.name].color;
      _migrated = true;
    }
  });
  if (_migrated && WS.saveTaskResults) {
    WS.saveTaskResults();
    // 마이그레이션 후 resultList 재렌더
    var _rl = document.getElementById('resultList');
    if (_rl) _rl.innerHTML = WS.taskResults.map(function(r){ return itemCard('result', r); }).join('') || emptyMsg;
  }

  refreshIcons();
  setTimeout(function() { if (typeof refreshIcons === 'function') refreshIcons(); }, 80);
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

/* ══════════════════════════════════════════════
   일보작성 모달 – openDailyReportModal 재정의
   ① 금일 업무 리스트 (기존 renderDailyReportTasks)
   ② 금일 스케줄 리스트
   ③ 금일 업무실행 보고 리스트
══════════════════════════════════════════════ */
function openDailyReportModal() {
  const modal = document.getElementById('dailyReportModal');
  if (!modal) return;
  modal.style.display = 'flex';
  refreshIcons();

  const now  = new Date();
  const days = ['일','월','화','수','목','금','토'];
  const dateStr = now.getFullYear() + '년 ' + (now.getMonth()+1) + '월 ' + now.getDate() + '일 (' + days[now.getDay()] + ')';
  const dateLabelEl = document.getElementById('dr_date_label');
  if (dateLabelEl) dateLabelEl.textContent = dateStr;

  function updateDrTime() {
    const t = new Date();
    const p = n => String(n).padStart(2,'0');
    const el = document.getElementById('dr_live_time');
    if (el) el.textContent = p(t.getHours()) + ':' + p(t.getMinutes()) + ':' + p(t.getSeconds());
  }
  updateDrTime();
  if (window._drLiveTimer) clearInterval(window._drLiveTimer);
  window._drLiveTimer = setInterval(updateDrTime, 1000);

  renderDailyReportTasks();
  renderDailyScheduleList();
  renderDailyExecReport();
}

/* ② 금일 스케줄 리스트 */
function renderDailyScheduleList() {
  const me    = WS.currentUser;
  const tbody  = document.getElementById('dr_sched_list');
  const countEl = document.getElementById('dr_sched_count');
  if (!tbody || !me) return;

  const schedules = (WS.tasks || []).filter(t => t.assignerId === me.id);
  if (countEl) countEl.textContent = schedules.length + '건';

  if (schedules.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text-muted)">금일 등록된 스케줄이 없습니다</td></tr>';
    return;
  }
  tbody.innerHTML = schedules.map(t => {
    const ids = Array.isArray(t.assigneeIds) ? t.assigneeIds : [];
    const collab = ids.filter(id => id !== me.id)
      .map(id => (WS.getUser ? WS.getUser(id) : null)?.name).filter(Boolean).join(', ') || '-';
    const st = WS.getStatusLabel ? WS.getStatusLabel(t.status) : (t.status || '-');
    return '<tr>' +
      '<td style="font-weight:600">' + (t.isImportant ? '⭐ ' : '') + t.title + '</td>' +
      '<td style="font-size:11px">' + collab + '</td>' +
      '<td style="font-size:11px">' + (t.dueDate || t.startDate || '-') + '</td>' +
      '<td style="font-size:11px;color:var(--text-secondary)">' + (t.desc || '-') + '</td>' +
      '<td><span class="status-badge status-' + (t.status||'waiting') + '">' + st + '</span></td>' +
    '</tr>';
  }).join('');
}

/* ③ 금일 업무실행 보고 리스트 (보고완료/보고없음 토글 + 관리 아이콘) */
function renderDailyExecReport() {
  const me    = WS.currentUser;
  const tbody = document.getElementById('dr_exec_list');
  if (!tbody || !me) return;

  const myTasks = (WS.tasks || []).filter(t => {
    const ids = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
    return ids.includes(me.id);
  });

  if (myTasks.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text-muted)">배정된 업무가 없습니다</td></tr>';
    return;
  }
  tbody.innerHTML = myTasks.map(t => {
    const baseScore = t.scoreBase !== undefined ? t.scoreBase : (t.performanceScore || '-');
    const reported  = !!t.drExecReported;
    // 보고완료/보고없음 토글 버튼
    const repBtn = reported
      ? '<button class="btn-sm btn-primary" style="font-size:11px;padding:3px 10px;background:var(--accent-green,#22c55e);border:none;border-radius:6px;color:#fff;cursor:pointer;font-weight:700" onclick="drToggleExecReport(' + t.id + ')">보고완료</button>'
      : '<button class="btn-sm"            style="font-size:11px;padding:3px 10px;border:1.5px solid var(--border-color);border-radius:6px;background:transparent;color:var(--text-secondary);cursor:pointer;font-weight:600" onclick="drToggleExecReport(' + t.id + ')">보고없음</button>';
    // 관리 – 작성 아이콘
    const hasReport = !!(t.drExecReport && t.drExecReport.trim());
    const editIcon = '<button title="보고 작성" onclick="openDrWrite(' + t.id + ')" '
      + 'style="background:none;border:none;cursor:pointer;padding:4px;border-radius:6px;'
      + 'color:' + (hasReport ? 'var(--accent-blue)' : 'var(--text-muted)') + ';transition:.15s"'
      + ' onmouseover="this.style.background=\'var(--bg-secondary)\'"'
      + ' onmouseout="this.style.background=\'none\'">'
      + '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>'
      + '</button>';
    return '<tr>' +
      '<td style="font-weight:600">' + (t.isImportant ? '⭐ ' : '') + t.title + '</td>' +
      '<td style="font-size:11.5px;color:var(--text-secondary);max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + (t.desc || '-') + '</td>' +
      '<td style="text-align:center;font-weight:700;color:var(--accent-blue)">' + baseScore + '</td>' +
      '<td style="text-align:center">' + repBtn + '</td>' +
      '<td style="text-align:center">' + editIcon + '</td>' +
    '</tr>';
  }).join('');
}

/* 보고완료/보고없음 토글 */
function drToggleExecReport(taskId) {
  const t = WS.getTask ? WS.getTask(taskId) : null;
  if (!t) return;
  t.drExecReported = !t.drExecReported;
  if (WS.saveTasks) WS.saveTasks();
  renderDailyExecReport();
  showToast('success', t.drExecReported ? '"' + t.title + '" 보고완료 처리' : '"' + t.title + '" 보고없음으로 변경');
}

/* 보고 작성 팝업 열기 */
let _drWriteTaskId = null;
function openDrWrite(taskId) {
  const t = WS.getTask ? WS.getTask(taskId) : null;
  if (!t) return;
  _drWriteTaskId = taskId;
  const titleEl = document.getElementById('drWriteTitle');
  if (titleEl) titleEl.textContent = '[' + t.title + '] 금일 보고 작성';
  const textEl = document.getElementById('drWriteText');
  if (textEl) textEl.value = t.drExecReport || '';
  const modal = document.getElementById('drWriteModal');
  if (modal) { modal.style.display = 'flex'; refreshIcons(); }
}
function closeDrWriteModal() {
  const modal = document.getElementById('drWriteModal');
  if (modal) modal.style.display = 'none';
  _drWriteTaskId = null;
}
function saveDrWrite() {
  const t = WS.getTask && _drWriteTaskId ? WS.getTask(_drWriteTaskId) : null;
  if (!t) return;
  const textEl = document.getElementById('drWriteText');
  t.drExecReport   = textEl ? textEl.value : '';
  t.drExecReported = !!(t.drExecReport && t.drExecReport.trim());
  if (WS.saveTasks) WS.saveTasks();
  closeDrWriteModal();
  renderDailyExecReport();
  showToast('success', '"' + t.title + '" 보고내용이 저장되었습니다.');
}
/* openDailyReportModal에서 renderDailyScheduleList 호출 제거용 재정의는 이미 위에 있음 */

/* ══════════════════════════════════════════════
   openEditTaskModal – 점수/업무결과 입력값 복원
   ① WS.taskResults를 localStorage에서 재로드하여 최신 기타관리 데이터 반영
   ② scoreBase(기본)/scoreMin(최소)/scoreMax(최대) 모두 복원
   ③ reportContent → nt_result select 복원
══════════════════════════════════════════════ */
function openEditTaskModal(id) {
  const t = WS.getTask(id);
  if (!t) return;
  window._editingTaskId = id;

  // ① 업무결과 드롭다운용 최신 데이터 재로드 (기타관리 > 업무결과 반영)
  WS.taskResults = JSON.parse(localStorage.getItem('ws_task_results')) || WS.taskResults;

  openNewTaskModal('edit');

  setTimeout(function () {
    function setVal(elId, val) {
      const el = document.getElementById(elId);
      if (el) el.value = (val !== undefined && val !== null) ? val : '';
    }
    setVal('nt_title',     t.title);
    // setVal('nt_desc', ...) 제거 - 체크박스로 대체
    setVal('nt_priority',  t.priority || 'medium');
    setVal('nt_team',      t.team);
    setVal('nt_start',     t.startedAt || '');
    setVal('nt_due',       t.dueDate);
    // ② 점수 3개 모두 복원
    setVal('nt_score',     t.scoreBase !== undefined ? t.scoreBase : (t.score || ''));
    setVal('nt_score_min', t.scoreMin !== undefined ? t.scoreMin : '');
    setVal('nt_score_max', t.scoreMax !== undefined ? t.scoreMax : '');
    // ③ 업무결과 select – 기타설정과 연동된 공통 함수로 복원
    renderResultSelect(t.reportContent || '');
    const impEl = document.getElementById('nt_important');
    if (impEl) impEl.checked = !!t.isImportant;
    window._processTags = Array.isArray(t.processTags) ? [...t.processTags] : [];
    // ④ 팀 선택 체크박스 복원
    renderTeamCheckboxes(t.team || '');
    // ⑤ 상세업무 체크박스 복원
    if (typeof renderDetailTaskCheckboxes === 'function') renderDetailTaskCheckboxes(t.desc || '');
    // ⑥ 진행보고 순서 복원
    if (typeof renderProcessOrderUI === 'function') {
      renderProcessOrderUI(Array.isArray(t.processTags) ? t.processTags : []);
    }
  }, 0);
}

/* ── 팀 선택 체크박스 동적 생성 ── */
function renderTeamCheckboxes(currentTeam) {
  var container = document.getElementById('nt_teams_checkboxes');
  if (!container) return;
  // currentTeam: '개발팀, 마케팅팀' 형태 또는 '개발팀'
  var selectedArr = (currentTeam || '').split(',').map(function(s){ return s.trim(); }).filter(Boolean);
  var depts = WS.departments || [];
  if (!depts.length) {
    container.innerHTML = '<span style="font-size:11px;color:var(--text-muted)">부서 정보 없음 (기타설정에서 추가)</span>';
    return;
  }
  var accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#4f6ef7';
  container.innerHTML = depts.map(function(d) {
    var checked = selectedArr.includes(d.name);
    var uid = 'tc_' + d.id;
    return '<label for="' + uid + '" style="display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:20px;cursor:pointer;user-select:none;' +
      'border:2px solid ' + (checked ? accent : 'var(--border-color)') + ';' +
      'background:' + (checked ? 'color-mix(in srgb,' + accent + ' 10%,var(--bg-primary))' : 'var(--bg-primary)') + ';' +
      'transition:all 0.15s">' +
      '<input type="checkbox" id="' + uid + '" value="' + d.name + '"' + (checked ? ' checked' : '') +
        ' onchange="updateTeamCheckStyle(this)"' +
        ' style="width:14px;height:14px;accent-color:' + accent + ';cursor:pointer">' +
      '<span style="font-size:12px;font-weight:600;color:var(--text-primary)">' + d.name + '</span>' +
      '</label>';
  }).join('');
}

function updateTeamCheckStyle(cb) {
  var label = cb.closest('label');
  if (!label) return;
  var accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#4f6ef7';
  if (cb.checked) {
    label.style.borderColor = accent;
    label.style.background = 'color-mix(in srgb,' + accent + ' 10%,var(--bg-primary))';
  } else {
    label.style.borderColor = 'var(--border-color)';
    label.style.background = 'var(--bg-primary)';
  }
}

/* ── openNewTaskModal 래핑: 매번 팀 체크박스 초기화 (edit 모드 제외) ── */
(function() {
  var _orig = typeof openNewTaskModal === 'function' ? openNewTaskModal : null;
  if (!_orig) return;
  window.openNewTaskModal = function(mode, parentId, assigneeId) {
    _orig.call(window, mode, parentId, assigneeId);
    // edit/schedule 모드는 초기화 생략
    if (mode === 'edit' || mode === 'schedule') return;
    setTimeout(function() {
      renderTeamCheckboxes('');
      if (typeof renderDetailTaskCheckboxes === 'function') renderDetailTaskCheckboxes('');
    }, 10);
  };
})();

/* saveEditTask – scoreBase/scoreMin/scoreMax도 함께 저장 */
function saveEditTask() {
  const id = window._editingTaskId;
  if (!id) return;
  const title = document.getElementById('nt_title')?.value.trim();
  if (!title) { showToast('error', '제목을 입력하세요'); return; }

  const parseNum = elId => {
    const v = document.getElementById(elId)?.value;
    return (v === '' || v === null || v === undefined) ? undefined : (parseInt(v) || 0);
  };

  WS.tasks = WS.tasks.map(t => {
    if (t.id !== id) return t;
    const newScoreBase = parseNum('nt_score');
    const newScoreMin  = parseNum('nt_score_min');
    const newScoreMax  = parseNum('nt_score_max');
    return Object.assign({}, t, {
      title,
      desc: (typeof _getSelectedDetailTasks === 'function' ? _getSelectedDetailTasks() : '') || t.desc || '',
      priority:       document.getElementById('nt_priority')?.value || t.priority,
      team: (function() {
        var cbs = document.querySelectorAll('#nt_teams_checkboxes input[type=checkbox]:checked');
        var arr = [];
        cbs.forEach(function(c){ arr.push(c.value); });
        return arr.length ? arr.join(', ') : (document.getElementById('nt_team')?.value || t.team || '');
      })(),
      startedAt:      document.getElementById('nt_start')?.value || t.startedAt,
      dueDate:        document.getElementById('nt_due')?.value || t.dueDate,
      reportContent:  document.getElementById('nt_result')?.value || '',
      score:          newScoreBase !== undefined ? newScoreBase : (t.score || 0),
      scoreBase:      newScoreBase !== undefined ? newScoreBase : t.scoreBase,
      scoreMin:       newScoreMin  !== undefined ? newScoreMin  : t.scoreMin,
      scoreMax:       newScoreMax  !== undefined ? newScoreMax  : t.scoreMax,
      isImportant:    document.getElementById('nt_important')?.checked ?? t.isImportant,
      processTags:    window._processTags || t.processTags,
    });
  });
  WS.saveTasks();
  window._editingTaskId = null;
  window._processTags   = [];
  if (typeof closeModalDirect === 'function') closeModalDirect('newTaskModal');
  if (typeof renderPage_Tasks === 'function') renderPage_Tasks();
  showToast('success', '업무가 저장되었습니다.');
}

/* ══════════════════════════════════════════════
   renderTaskListView – 업무목록 탭 그리드
   컬럼: 업무제목(+팀) / 업무설명 / 기본점수 / 업무결과 / 관리
══════════════════════════════════════════════ */
function renderTaskListView(targetEl) {
  const el = targetEl || document.getElementById('taskListArea');
  if (!el) return;

  const renderNode = (parentId, level) => {
    const tasks = WS.tasks.filter(t =>
      t.parentId === (parentId === null ? null : Number(parentId))
    );
    let html = '';
    tasks.forEach(t => {
      const indent = level * 24;
      const baseScore = t.scoreBase !== undefined ? t.scoreBase : (t.score || 0);
      const teamStr   = t.team || '';
      // 업무결과: 기타설정과 연동된 아이콘+컴러 배지
      var resultStr = _buildResultBadge(t.reportContent);
      // 업무설명
      const descStr = t.desc
        ? '<span style="font-size:11.5px;color:var(--text-secondary)">' + t.desc + '</span>'
        : '<span style="color:var(--text-muted);font-size:11px">-</span>';

      html += '<tr>' +
        // ① 업무제목 + 팀리스트 아래 표시
        '<td>' +
          '<div class="tree-node" style="padding-left:' + indent + 'px">' +
            (level > 0 ? '<div class="tree-line"></div>' : '') +
            '<div class="tree-title">' +
              t.title +
            '</div>' +

          '</div>' +
          (teamStr ? '<div style="font-size:11px;color:var(--text-muted);padding-left:' + indent + 'px;margin-top:2px">' + teamStr + '</div>' : '') +
        '</td>' +
        // ② 업무설명
        '<td style="max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + descStr + '</td>' +
        // ③ 기본점수
        '<td style="text-align:center;width:80px">' +
          '<div class="score-tag">' + baseScore + '<span>pt</span></div>' +
        '</td>' +
        // ④ 업무결과 (reportContent)
        '<td style="width:120px">' + resultStr + '</td>' +
        // ⑤ 관리 (수정 + 삭제)
        '<td style="width:90px">' +
          '<div class="manage-actions">' +
            '<button class="btn-icon-sm edit" onclick="openEditTaskModal(' + t.id + ')" title="수정">' +
              '<i data-lucide="edit-3" class="icon-sm"></i>' +
            '</button>' +
            '<button class="btn-icon-sm delete" onclick="deleteTask(' + t.id + ')" title="삭제">' +
              '<i data-lucide="trash-2" class="icon-sm"></i>' +
            '</button>' +
          '</div>' +
        '</td>' +
      '</tr>';
      html += renderNode(t.id, level + 1);
    });
    return html;
  };

  const rowsHtml = renderNode(null, 0);
  el.innerHTML =
    '<table class="task-table">' +
      '<thead><tr>' +
        '<th>업무제목</th>' +
        '<th>업무설명</th>' +
        '<th style="text-align:center;width:80px">기본점수</th>' +
        '<th style="width:120px">업무결과</th>' +
        '<th style="width:90px;text-align:center">관리</th>' +
      '</tr></thead>' +
      '<tbody>' +
        (rowsHtml || '<tr><td colspan="5" class="empty-state">업무가 없습니다.</td></tr>') +
      '</tbody>' +
    '</table>';
  refreshIcons();
  setTimeout(function() { if (typeof refreshIcons === 'function') refreshIcons(); }, 60);
}


/* ══════════════════════════════════════════════════════════════
   🛡️ 악순환 방지: 모달 State 오염 방어 코드
   원인: newTaskModal 같은 modal-overlay가 닫히지 않고 남아
         다른 페이지의 CRUD(기타설정 등) 버튼을 차단하는 문제
   해결책:
   ① closeAllModals – 모든 모달 강제 닫기
   ② showPage 후크  – 페이지 이동 시 자동 closeAllModals
   ③ Escape 키     – 언제나 Esc 로 모달 닫기
   ④ openOrgModal  – 열기 전 task 모달 먼저 정리
══════════════════════════════════════════════════════════════ */

/** 모든 modal-overlay를 닫고 타이머/상태 초기화 */
function closeAllModals() {
  // 모든 overlay 숨기기
  document.querySelectorAll('.modal-overlay').forEach(function(m) {
    m.style.display = 'none';
  });
  // 업무 관련 글로벌 상태 초기화
  if (window._editingTaskId !== undefined) window._editingTaskId = null;
  if (window._processTags !== undefined)   window._processTags   = [];
  // 보고 작성 팝업 상태 초기화
  if (window._drWriteTaskId !== undefined) window._drWriteTaskId = null;
  // 일보 타이머 정리
  if (window._drLiveTimer) { clearInterval(window._drLiveTimer); window._drLiveTimer = null; }
}

/* ② showPage 후크 – 원본 showPage를 래핑하여 모달 자동 정리 */
(function() {
  var _origShowPage = typeof showPage === 'function' ? showPage : null;
  if (!_origShowPage) return;
  window.showPage = function(pid) {
    try { closeAllModals(); } catch(e) {}
    _origShowPage.call(window, pid);
  };
})();

/* ③ Escape 키로 언제나 모달 닫기 */
document.addEventListener('keydown', function(e) {
  if (e.key !== 'Escape') return;
  // 열린 modal-overlay 가 있으면 닫기
  var hasOpen = false;
  document.querySelectorAll('.modal-overlay').forEach(function(m) {
    if (m.style.display !== 'none' && m.style.display !== '') hasOpen = true;
  });
  if (hasOpen) closeAllModals();
});

/* ④ openOrgModal 보강 – 기타설정 CRUD 모달이 newTaskModal에 막히지 않도록 */
(function() {
  var _origOpenOrgModal = typeof openOrgModal === 'function' ? openOrgModal : null;
  if (!_origOpenOrgModal) {
    // openOrgModal이 나중에 정의될 경우를 위한 폴백
    document.addEventListener('click', function(e) {
      var btn = e.target.closest('[onclick*="openOrgModal"]');
      if (!btn) return;
      // newTaskModal 이 막고 있으면 먼저 닫기
      var ntm = document.getElementById('newTaskModal');
      if (ntm && ntm.style.display !== 'none') {
        ntm.style.display = 'none';
        if (window._editingTaskId) window._editingTaskId = null;
      }
    });
    return;
  }
  window.openOrgModal = function() {
    // newTaskModal 이 열려있으면 닫고 진행
    var ntm = document.getElementById('newTaskModal');
    if (ntm && ntm.style.display !== 'none') {
      ntm.style.display = 'none';
      if (window._editingTaskId) window._editingTaskId = null;
    }
    _origOpenOrgModal.apply(window, arguments);
  };
})();

/* ⑤ 페이지 로드 완료 후 혹시 남은 모달 정리 */
window.addEventListener('load', function() {
  setTimeout(function() {
    document.querySelectorAll('.modal-overlay').forEach(function(m) {
      if (m.id !== 'newTaskModal' && m.id !== 'dailyReportModal') return; // 앱 초기 모달만 정리
      m.style.display = 'none';
    });
  }, 500);
});

/* ══════════════════════════════════════════════════════════════
   🏗️ 기타설정 CRUD – prompt() 제거, 전용 모달 기반으로 재구현
   ▸ #orgModal    : 부서/직급/직책 추가·수정
   ▸ #resultModal : 업무결과 추가·수정
   근본 원인: openOrgModal이 prompt()를 씀, saveOrgItem/saveResultItem 미정의
══════════════════════════════════════════════════════════════ */

/* ── 내부 상태 ── */
var _orgCtx = { type: null, id: null, mode: 'add' }; // add | edit

/* ── orgModal 열기 (추가) ── */
function openOrgModal(type) {
  var labels = { dept:'부서', rank:'직급', pos:'직책' };
  var label  = labels[type] || type;
  _orgCtx.type = type; _orgCtx.id = null; _orgCtx.mode = 'add';
  var titleEl = document.getElementById('orgModalTitle');
  var labelEl = document.getElementById('orgModalLabel');
  var inputEl = document.getElementById('orgModalInput');
  if (titleEl) titleEl.textContent = label + ' 추가';
  if (labelEl) labelEl.textContent = label + ' 이름';
  if (inputEl) { inputEl.value = ''; inputEl.placeholder = label + ' 이름을 입력하세요'; }
  var m = document.getElementById('orgModal');
  if (m) { m.style.display = 'flex'; setTimeout(function(){ if(inputEl) inputEl.focus(); }, 50); }
}

/* ── orgModal 열기 (수정) ── */
function editOrgItem(type, id) {
  var lists  = { dept: WS.departments, rank: WS.ranks, pos: WS.positions, result: WS.taskResults };
  var labels = { dept:'부서', rank:'직급', pos:'직책', result:'업무결과' };
  var list   = lists[type];
  if (!list) return;
  var item = list.find(function(x){ return x.id === id; });
  if (!item) return;

  if (type === 'result') {
    /* 업무결과는 resultModal 사용 */
    _orgCtx.type = 'result'; _orgCtx.id = id; _orgCtx.mode = 'edit';
    var titleEl = document.getElementById('resultModalTitle');
    var nameEl  = document.getElementById('resultModalName');
    var iconEl  = document.getElementById('resultModalIcon');
    var colorEl = document.getElementById('resultModalColor');
    var pickerEl= document.getElementById('resultModalColorPicker');
    if (titleEl) titleEl.textContent = '업무결과 수정';
    if (nameEl)  nameEl.value  = item.name  || '';
    if (iconEl)  iconEl.value  = item.icon  || '';
    var itemColor = item.color || '#22c55e';
    if (colorEl)  colorEl.value  = itemColor;
    if (pickerEl) pickerEl.value = itemColor;
    _initResultIconQuickPick();
    _updateResultPreview();
    var m = document.getElementById('resultModal');
    if (m) { m.style.display = 'flex'; setTimeout(function(){ if(nameEl) nameEl.focus(); }, 50); }
    return;
  }

  _orgCtx.type = type; _orgCtx.id = id; _orgCtx.mode = 'edit';
  var label  = labels[type] || type;
  var titleEl2 = document.getElementById('orgModalTitle');
  var labelEl2 = document.getElementById('orgModalLabel');
  var inputEl2 = document.getElementById('orgModalInput');
  if (titleEl2) titleEl2.textContent = label + ' 수정';
  if (labelEl2) labelEl2.textContent = label + ' 이름';
  if (inputEl2) { inputEl2.value = item.name || ''; }
  var m2 = document.getElementById('orgModal');
  if (m2) { m2.style.display = 'flex'; setTimeout(function(){ if(inputEl2){ inputEl2.focus(); inputEl2.select(); } }, 50); }
}

/* ── orgModal 저장 ── */
function saveOrgItem() {
  var inputEl = document.getElementById('orgModalInput');
  var name = inputEl ? inputEl.value.trim() : '';
  if (!name) { showToast('error', '이름을 입력하세요'); return; }
  var type = _orgCtx.type, id = _orgCtx.id, mode = _orgCtx.mode;

  if (mode === 'add') {
    if (type === 'dept') {
      WS.departments.push({ id: Date.now(), name: name }); WS.saveDepts();
    } else if (type === 'rank') {
      var maxLv = WS.ranks.length ? Math.max.apply(null, WS.ranks.map(function(r){ return r.level || 0; })) : 0;
      WS.ranks.push({ id: Date.now(), name: name, level: maxLv + 1 }); WS.saveRanks();
    } else if (type === 'pos') {
      WS.positions.push({ id: Date.now(), name: name }); WS.savePos();
    }
    showToast('success', name + ' 추가 완료!');
  } else {
    var lists = { dept: WS.departments, rank: WS.ranks, pos: WS.positions };
    var list  = lists[type];
    var item  = list ? list.find(function(x){ return x.id === id; }) : null;
    if (item) {
      item.name = name;
      if (type === 'dept') WS.saveDepts();
      else if (type === 'rank') WS.saveRanks();
      else if (type === 'pos') WS.savePos();
    }
    showToast('info', '수정 완료!');
  }
  closeOrgModal();
  renderPage_RankMgmt();
}

/* ── orgModal 닫기 ── */
function closeOrgModal() {
  var m = document.getElementById('orgModal');
  if (m) m.style.display = 'none';
  _orgCtx.type = null; _orgCtx.id = null; _orgCtx.mode = 'add';
}

/* ── resultModal 열기 (추가/수정) ── */
function openResultModal(editId) {
  _orgCtx.type = 'result';
  _orgCtx.mode = editId ? 'edit' : 'add';
  _orgCtx.id   = editId || null;
  var titleEl  = document.getElementById('resultModalTitle');
  var nameEl   = document.getElementById('resultModalName');
  var iconEl   = document.getElementById('resultModalIcon');
  var colorEl  = document.getElementById('resultModalColor');
  var pickerEl = document.getElementById('resultModalColorPicker');
  if (editId) {
    var item = (WS.taskResults || []).find(function(r){ return r.id === editId; });
    if (item) {
      if (titleEl) titleEl.textContent = '업무결과 수정';
      if (nameEl)   nameEl.value  = item.name  || '';
      if (iconEl)   iconEl.value  = item.icon  || '';
      if (colorEl)  colorEl.value = item.color || '#22c55e';
      if (pickerEl) pickerEl.value= item.color || '#22c55e';
    }
  } else {
    if (titleEl) titleEl.textContent = '업무결과 추가';
    if (nameEl)   nameEl.value  = '';
    if (iconEl)   iconEl.value  = '';
    if (colorEl)  colorEl.value = '#22c55e';
    if (pickerEl) pickerEl.value= '#22c55e';
  }
  _initResultIconQuickPick();
  _updateResultPreview();
  var m = document.getElementById('resultModal');
  if (m) { m.style.display = 'flex'; setTimeout(function(){ if(nameEl) nameEl.focus(); }, 50); }
}

/* ── resultModal 저장 ── */
function saveResultItem() {
  var nameEl  = document.getElementById('resultModalName');
  var iconEl  = document.getElementById('resultModalIcon');
  var colorEl = document.getElementById('resultModalColor');
  var name    = nameEl  ? nameEl.value.trim()  : '';
  var icon    = iconEl  ? iconEl.value.trim()  : '';
  var color   = colorEl ? colorEl.value.trim() : '#22c55e';
  if (!name) { showToast('error', '결과명을 입력하세요'); return; }
  if (!color || !color.startsWith('#')) color = '#22c55e';
  var id = _orgCtx.id, mode = _orgCtx.mode;

  if (mode === 'add') {
    WS.taskResults.push({ id: Date.now(), name: name, icon: icon, color: color });
    WS.saveTaskResults();
    showToast('success', name + ' 추가 완료!');
  } else {
    var item = WS.taskResults.find(function(x){ return x.id === id; });
    if (item) { item.name = name; item.icon = icon; item.color = color; WS.saveTaskResults(); }
    showToast('info', '업무결과 수정 완료!');
  }
  closeResultModal();
  renderPage_RankMgmt();
}

/* ── resultModal 닫기 ── */
function closeResultModal() {
  var m = document.getElementById('resultModal');
  if (m) m.style.display = 'none';
}

/* ── renderResultSelect: 업무결과 select를 WS.taskResults와 동기화 ──
   항상 localStorage에서 최신 데이터를 로드하여 드롭다운을 업데이트합니다 */
function renderResultSelect(currentValue) {
  // 로컬스토리지에서 항상 최신 데이터 로드
  WS.taskResults = JSON.parse(localStorage.getItem('ws_task_results')) || WS.taskResults || [];
  var sel = document.getElementById('nt_result');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- 선택 --</option>' +
    WS.taskResults.map(function(r) {
      // icon이 lucide 이름이면 무시, 이모지면 그대로 출력
      var prefix = (r.icon && r.icon.length <= 2) ? r.icon + ' ' : '';
      return '<option value="' + r.name + '">' + prefix + r.name + '</option>';
    }).join('');
  if (currentValue) sel.value = currentValue;
}

/* ── 업무결과 리스트에서 아이콘+컴러 맞는 WS.taskResult 가져오기 ── */
function _getResultDef(name) {
  var list = JSON.parse(localStorage.getItem('ws_task_results')) || WS.taskResults || [];
  return list.find(function(r) { return r.name === name; }) || null;
}

/* ── 결과 배지 HTML 생성 (아이콘 유무에 따라 다르게 표시) ── */
function _buildResultBadge(reportContent) {
  if (!reportContent) return '<span style="color:var(--text-muted);font-size:11px">-</span>';
  var def = _getResultDef(reportContent);
  if (def && def.icon && def.color && def.icon.length > 2) {
    // lucide 아이콘 + 컴러 배지
    var c = def.color;
    return '<span style="display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:20px;' +
      'background:' + c + '22;border:1.5px solid ' + c + ';font-size:11.5px;font-weight:700;color:' + c + '">' +
      '<span style="display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;background:' + c + '22;border:1px solid ' + c + '">' +
      '<i data-lucide="' + def.icon + '" style="width:10px;height:10px;color:' + c + '"></i></span>' +
      reportContent + '</span>';
  }
  // 이모지 or 아이콘 없음
  var iconPart = (def && def.icon && def.icon.length <= 2) ? def.icon + ' ' : '';
  return '<span class="report-status-badge">' + iconPart + reportContent + '</span>';
}

/* ── 업무결과 아이콘 미리보기 ── */
var _RESULT_QUICK_ICONS = [
  { icon:'check-circle',    color:'#22c55e' },
  { icon:'refresh-cw',      color:'#06b6d4' },
  { icon:'git-branch',      color:'#f59e0b' },
  { icon:'pause-circle',    color:'#6b7280' },
  { icon:'x-circle',        color:'#ef4444' },
  { icon:'check-circle-2',  color:'#4f6ef7' },
  { icon:'alert-triangle',  color:'#f97316' },
  { icon:'clock',           color:'#8b5cf6' },
  { icon:'flag',            color:'#ec4899' },
  { icon:'star',            color:'#eab308' },
  { icon:'thumbs-up',       color:'#14b8a6' },
  { icon:'thumbs-down',     color:'#f43f5e' },
];

function _initResultIconQuickPick() {
  var wrap = document.getElementById('resultIconQuickPick');
  if (!wrap) return;
  wrap.innerHTML = _RESULT_QUICK_ICONS.map(function(item) {
    return '<span onclick="_selectResultIcon(\'' + item.icon + '\',\'' + item.color + '\')" ' +
      'title="' + item.icon + '" ' +
      'style="display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:8px;' +
      'border:1.5px solid ' + item.color + ';background:' + item.color + '22;cursor:pointer;' +
      'transition:transform 0.15s" onmouseover="this.style.transform=\'scale(1.15)\'" onmouseout="this.style.transform=\'\'"> ' +
      '<i data-lucide="' + item.icon + '" style="width:14px;height:14px;color:' + item.color + '"></i>' +
      '</span>';
  }).join('');
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 0);
}

function _selectResultIcon(iconName, color) {
  var iconEl   = document.getElementById('resultModalIcon');
  var colorEl  = document.getElementById('resultModalColor');
  var pickerEl = document.getElementById('resultModalColorPicker');
  if (iconEl)   iconEl.value  = iconName;
  if (colorEl)  colorEl.value = color;
  if (pickerEl) pickerEl.value = color;
  _updateResultPreview();
}

function previewResultIcon() { _updateResultPreview(); }

function syncResultColorPicker(val) {
  var p = document.getElementById('resultModalColorPicker');
  if (p && /^#[0-9a-fA-F]{6}$/.test(val)) p.value = val;
  _updateResultPreview();
}

function _updateResultPreview() {
  var nameEl  = document.getElementById('resultModalName');
  var iconEl  = document.getElementById('resultModalIcon');
  var colorEl = document.getElementById('resultModalColor');
  var name    = (nameEl  && nameEl.value.trim())  || '미리보기';
  var icon    = (iconEl  && iconEl.value.trim())  || 'check-circle';
  var color   = (colorEl && colorEl.value.trim()) || '#22c55e';
  if (!/^#[0-9a-fA-F]{3,6}$/.test(color)) color = '#22c55e';

  var prev     = document.getElementById('resultModalPreview');
  var prevIcon = document.getElementById('resultModalPreviewIcon');
  var prevName = document.getElementById('resultModalPreviewName');
  if (prev) {
    prev.style.background  = color + '22';
    prev.style.border      = '1.5px solid ' + color;
    prev.style.color       = color;
  }
  if (prevIcon) {
    prevIcon.style.background = color + '22';
    prevIcon.style.border     = '1px solid ' + color;
    prevIcon.innerHTML = '<i data-lucide="' + icon + '" style="width:11px;height:11px;color:' + color + '"></i>';
    if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 0);
  }
  if (prevName) prevName.textContent = name;
}

/* 결과명 입력 시 미리보기 이름 실시간 반영 */
document.addEventListener('input', function(e) {
  if (e.target && e.target.id === 'resultModalName') _updateResultPreview();
});

/* ── deleteOrgItem – confirm 없이 즉시 삭제 ── */
function deleteOrgItem(type, id) {
  var labels = { dept:'부서', rank:'직급', pos:'직책', result:'업무결과', reportType:'진행보고 유형' };
  var label  = labels[type] || type;
  if (type === 'dept')       { WS.departments = WS.departments.filter(function(x){ return x.id !== id; }); WS.saveDepts(); }
  else if (type === 'rank')  { WS.ranks = WS.ranks.filter(function(x){ return x.id !== id; }); WS.saveRanks(); }
  else if (type === 'pos')   { WS.positions = WS.positions.filter(function(x){ return x.id !== id; }); WS.savePos(); }
  else if (type === 'result'){ WS.taskResults = WS.taskResults.filter(function(x){ return x.id !== id; }); WS.saveTaskResults(); }
  else if (type === 'reportType'){ WS.reportTypes = WS.reportTypes.filter(function(x){ return x.id !== id; }); WS.saveReportTypes(); }
  renderPage_RankMgmt();
  showToast('info', label + ' 삭제 완료!');
}

/* ══════════════════════════════════════════════
   업무분장 그리드 한글 깨짐 수정
   renderAssignmentByTask / renderAssignmentByStaff
══════════════════════════════════════════════ */
function renderAssignmentByTask(targetEl) {
  var el = targetEl || document.getElementById('taskListArea');
  if (!el) return;
  var rows = WS.tasks.map(function(t) {
    var ids = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
    var assigneeHtml = ids.length > 0
      ? ids.map(function(uid) {
          var u = WS.getUser(uid);
          return u ? '<div class="staff-badge"><div class="avatar-sm" style="background:linear-gradient(135deg,' + (u.color || '#4f6ef7') + ',#9747ff)">' + u.avatar + '</div>' + u.name + '</div>' : '';
        }).join('')
      : '<span style="color:var(--text-muted);font-size:11.5px">미배정</span>';
    return '<tr>' +
      '<td style="width:40%"><div style="font-weight:700;font-size:13.5px">' + t.title + '</div><div style="font-size:11px;color:var(--text-muted)">' + (t.team || '') + '</div></td>' +
      '<td><div class="badge-list">' + assigneeHtml + '</div></td>' +
      '<td><div class="score-tag">' + (t.score || 0) + '<span>pt</span></div></td>' +
      '<td style="width:80px"><div class="manage-actions">' +
        '<button class="btn-icon-sm edit" onclick="openTaskAssignModal(' + t.id + ')" title="담당 직원 지정"><i data-lucide="user-plus" class="icon-sm"></i></button>' +
      '</div></td>' +
    '</tr>';
  }).join('');

  el.innerHTML =
    '<table class="task-table" style="width:100%;table-layout:fixed">' +
      '<colgroup>' +
        '<col style="width:260px">' +
        '<col>' +
        '<col style="width:90px">' +
        '<col style="width:80px">' +
      '</colgroup>' +
      '<thead><tr>' +
        '<th style="width:260px">업무명</th>' +
        '<th>담당 직원</th>' +
        '<th style="width:90px">점수</th>' +
        '<th style="width:80px">관리</th>' +
      '</tr></thead>' +
      '<tbody>' + (rows || '<tr><td colspan="4" class="empty-state">데이터가 없습니다.</td></tr>') + '</tbody>' +
    '</table>';
  refreshIcons();
}

function renderAssignmentByStaff(targetEl) {
  var el = targetEl || document.getElementById('taskListArea');
  if (!el) return;
  var rows = WS.users.map(function(u) {
    var myTasks = WS.tasks.filter(function(t) {
      var ids = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
      return ids.includes(u.id);
    });
    var badges = myTasks.map(function(t) { return '<span class="task-badge">' + t.title + '</span>'; }).join('');
    return '<tr>' +
      '<td style="width:200px">' +
        '<div style="display:flex;align-items:center;gap:10px">' +
          '<div class="avatar" style="width:32px;height:32px;background:linear-gradient(135deg,' + u.color + ',#9747ff);color:#fff;font-size:12px;font-weight:800;border-radius:50%;display:flex;align-items:center;justify-content:center">' + u.avatar + '</div>' +
          '<div><div style="font-weight:700;font-size:13px">' + u.name + '</div><div style="font-size:10.5px;color:var(--text-muted)">' + u.role + ' · ' + u.dept + '</div></div>' +
        '</div>' +
      '</td>' +
      '<td><div class="badge-list">' + (badges || '<span style="color:var(--text-muted);font-size:11px">배정된 업무 없음</span>') + '</div></td>' +
      '<td style="width:100px"><div class="manage-actions">' +
        '<button class="btn-icon-sm edit" onclick="openAssignmentManageModal(' + u.id + ')" title="업무 배정 관리"><i data-lucide="settings-2" class="icon-sm"></i></button>' +
      '</div></td>' +
    '</tr>';
  }).join('');

  el.innerHTML =
    '<table class="task-table" style="width:100%;table-layout:fixed">' +
      '<colgroup>' +
        '<col style="width:260px">' +
        '<col>' +
        '<col style="width:80px">' +
      '</colgroup>' +
      '<thead><tr>' +
        '<th style="width:260px">직원 정보</th>' +
        '<th>배정 업무</th>' +
        '<th style="width:80px">관리</th>' +
      '</tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
    '</table>';
  refreshIcons();
}

/* ══════════════════════════════════════════════
   담당직원 배정 모달 – 토글형 체크박스 리스트
   openTaskAssignModal / renderTaskAssignStaffList / selectTaskAssignee 재정의
══════════════════════════════════════════════ */
function openTaskAssignModal(taskId) {
  var t = WS.getTask(taskId);
  if (!t) return;
  window._assigningTaskId = taskId;

  var titleEl = document.getElementById('tam_task_title');
  var teamEl  = document.getElementById('tam_task_team');
  if (titleEl) titleEl.textContent = t.title;
  if (teamEl)  teamEl.textContent  = t.team || '';

  renderTaskAssignStaffList(taskId);
  if (typeof openModal === 'function') openModal('taskAssignModal');
  if (typeof refreshIcons === 'function') refreshIcons();
}

function renderTaskAssignStaffList(taskId) {
  var t = WS.getTask(taskId);
  var container = document.getElementById('tam_staff_list');
  if (!container || !t) return;

  if (!Array.isArray(t.assigneeIds)) {
    t.assigneeIds = t.assigneeId ? [t.assigneeId] : [];
  }

  var selectedCount = t.assigneeIds.length;
  var html = '<div style="margin-bottom:8px;font-size:11px;color:var(--text-muted);text-align:right">' +
    '선택됨 <strong style="color:var(--accent-blue)">' + selectedCount + '</strong>명</div>';

  html += WS.users.map(function(u) {
    var isSelected = t.assigneeIds.includes(u.id);
    var accentColor = (WS.currentAccent && WS.currentAccent[0]) ? WS.currentAccent[0] : 'var(--accent-blue)';
    return (
      '<div onclick="selectTaskAssignee(' + taskId + ',' + u.id + ')" ' +
      'style="display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:10px;' +
        'border:2px solid ' + (isSelected ? accentColor : 'transparent') + ';' +
        'background:' + (isSelected ? 'rgba(79,110,247,0.07)' : 'var(--bg-tertiary)') + ';' +
        'cursor:pointer;transition:all 0.18s;margin-bottom:6px;user-select:none">' +
        '<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,' + (u.color || '#4f6ef7') + ',#9747ff);' +
          'color:#fff;font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0">' +
          u.avatar +
        '</div>' +
        '<div style="flex:1">' +
          '<div style="font-weight:700;font-size:13px;color:var(--text-primary)">' + u.name + '</div>' +
          '<div style="font-size:10.5px;color:var(--text-muted)">' + u.role + ' · ' + u.dept + '</div>' +
        '</div>' +
        /* 체크박스 스타일 토글 */
        '<div style="width:22px;height:22px;border-radius:6px;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all 0.18s;' +
          'background:' + (isSelected ? accentColor : 'var(--bg-primary)') + ';' +
          'border:2px solid ' + (isSelected ? accentColor : 'var(--border-color)') + '">' +
          (isSelected ? '<svg viewBox="0 0 24 24" width="13" height="13" stroke="#fff" stroke-width="3" fill="none"><polyline points="20 6 9 17 4 12"/></svg>' : '') +
        '</div>' +
      '</div>'
    );
  }).join('');

  container.innerHTML = html;
}

/* ══════════════════════════════════════════════
   상세업무 CRUD (기타설정 > 기타관리)
   localStorage key: ws_detail_tasks
   WS.detailTasks: [{id, name}]
══════════════════════════════════════════════ */
function _saveDetailTasks() {
  WS.detailTasks = WS.detailTasks || [];
  localStorage.setItem('ws_detail_tasks', JSON.stringify(WS.detailTasks));
}

function openDetailTaskModal(editId) {
  WS.detailTasks = JSON.parse(localStorage.getItem('ws_detail_tasks')) || [];
  var existing = editId ? WS.detailTasks.find(function(d){ return d.id === editId; }) : null;
  var cur = existing ? existing.name : '';
  var name = window.prompt(editId ? '상세업무 이름 수정' : '추가할 상세업무 이름을 입력하세요', cur);
  if (name === null) return;
  name = name.trim();
  if (!name) { showToast('error', '상세업무 이름을 입력하세요.'); return; }
  if (editId) {
    WS.detailTasks = WS.detailTasks.map(function(d){ return d.id === editId ? Object.assign({}, d, {name: name}) : d; });
    showToast('success', '상세업무가 수정되었습니다.');
  } else {
    var newId = Date.now();
    WS.detailTasks.push({ id: newId, name: name });
    showToast('success', '"' + name + '" 상세업무가 추가되었습니다.');
  }
  _saveDetailTasks();
  renderPage_RankMgmt();
}

function editDetailTask(id) { openDetailTaskModal(id); }

function deleteDetailTask(id) {
  WS.detailTasks = (WS.detailTasks || []).filter(function(d){ return d.id !== id; });
  _saveDetailTasks();
  renderPage_RankMgmt();
  showToast('info', '상세업무가 삭제되었습니다.');
}
/* ══════════════════════════════════════════════
   상세 업무 리스트 체크박스 UI
══════════════════════════════════════════════ */
function renderDetailTaskCheckboxes(currentDesc) {
  var container = document.getElementById('nt_desc_checkboxes');
  if (!container) return;
  WS.detailTasks = JSON.parse(localStorage.getItem('ws_detail_tasks')) || WS.detailTasks || [];
  var selected = (currentDesc || '').split(',').map(function(s){ return s.trim(); }).filter(Boolean);
  var accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#4f6ef7';
  if (!WS.detailTasks.length) {
    container.innerHTML = '<div style="padding:10px;font-size:11px;color:var(--text-muted)">상세업무 없음 (기타설정에서 추가)</div>';
    return;
  }
  container.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;padding:10px 12px;' +
    'background:var(--bg-secondary);border:1.5px solid var(--border-color);border-radius:10px;min-height:52px;align-items:flex-start;';
  container.innerHTML = WS.detailTasks.map(function(d) {
    var checked = selected.includes(d.name);
    var uid = 'dtcb_' + d.id;
    return '<label for="' + uid + '" style="display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:20px;cursor:pointer;user-select:none;' +
      'border:2px solid ' + (checked ? accent : 'var(--border-color)') + ';' +
      'background:' + (checked ? 'color-mix(in srgb,' + accent + ' 10%,var(--bg-primary))' : 'var(--bg-primary)') + ';' +
      'transition:all 0.15s">' +
      '<input type="checkbox" id="' + uid + '" value="' + d.name + '"' + (checked ? ' checked' : '') +
        ' onchange="updateDetailTaskCheckStyle(this)"' +
        ' style="width:14px;height:14px;accent-color:' + accent + ';cursor:pointer">' +
      '<span style="font-size:12px;font-weight:600;color:var(--text-primary)">' + d.name + '</span>' +
      '</label>';
  }).join('');
}

function updateDetailTaskCheck(cb) {
  if (!cb) return;
  var label = cb.closest('label'); if (!label) return;
  var accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#4f6ef7';
  if (cb.checked) { label.style.borderColor = accent; label.style.background = 'color-mix(in srgb,' + accent + ' 10%,var(--bg-primary))'; }
  else { label.style.borderColor = 'var(--border-color)'; label.style.background = 'var(--bg-primary)'; }
}

function _getSelectedDetailTasks() {
  var cbs = document.querySelectorAll('#nt_desc_checkboxes input[type=checkbox]:checked');
  var arr = [];
  cbs.forEach(function(c){ arr.push(c.value); });
  return arr.join(', ');
}

/* ══════════════════════════════════════════════
   진행보고 순서 설정 UI
*/

/* 전역 진행 순서 배열 (저장 시 processTags에 매핑) */
window._processOrder = window._processOrder || [];

function renderProcessOrderUI(selectedArr) {
  window._processOrder = Array.isArray(selectedArr) ? selectedArr.slice() : [];
  _renderProcessSelected();
  _renderProcessTypeList();
}

/* 선택된 순서 박스 */
function _renderProcessSelected() {
  var box = document.getElementById('nt_process_selected');
  if (!box) return;
  var placeholder = document.getElementById('nt_process_placeholder');
  var accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#4f6ef7';

  if (!window._processOrder.length) {
    box.innerHTML = '<span id="nt_process_placeholder" style="font-size:11px;color:var(--text-muted);padding:2px 0">아래 목록을 클릭하여 순서를 추가하세요 (복수 추가 가능)</span>';
    return;
  }

  box.innerHTML = window._processOrder.map(function(name, idx) {
    return '<span onclick="removeProcessOrder(' + idx + ')" ' +
      'style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:20px;' +
      'background:' + accent + ';color:#fff;font-size:11.5px;font-weight:700;cursor:pointer;user-select:none;' +
      'transition:opacity 0.15s" title="클릭 시 제거">' +
      '<span style="font-size:10px;opacity:0.8;font-weight:400">' + (idx + 1) + '.</span> ' +
      name +
      ' <span style="font-size:10px;opacity:0.7">✕</span></span>';
  }).join('');
}

/* 진행보고 유형 목록 박스 */
function _renderProcessTypeList() {
  var list = document.getElementById('nt_process_type_list');
  if (!list) return;
  var types = JSON.parse(localStorage.getItem('ws_report_types')) || WS.reportTypes || [];
  WS.reportTypes = types;
  if (!types.length) {
    list.innerHTML = '<div style="padding:12px;text-align:center;font-size:11px;color:var(--text-muted)">등록된 진행보고 유형이 없습니다.<br><span style="font-size:10px">(본사관리 → 기타설정에서 추가)</span></div>';
    return;
  }
  var accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#4f6ef7';
  list.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;padding:8px 8px;';
  list.innerHTML = types.map(function(t) {
    var tName = t.label || t.name || '';
    var accent2 = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#4f6ef7';
    var tColor  = t.color || accent2;
    var addedCount = window._processOrder.filter(function(n){ return n === tName; }).length;
    return '<span onclick="addProcessOrder(\'' + tName.replace(/'/g, "\\'") + '\')"'
      + ' style="display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:20px;cursor:pointer;user-select:none;'
      + 'border:2px solid ' + tColor + ';'
      + 'background:color-mix(in srgb,' + tColor + ' 10%,var(--bg-primary));'
      + 'transition:all 0.15s" '
      + 'onmouseover="this.style.opacity=\'0.75\'" onmouseout="this.style.opacity=\'1\'">'
      + (t.icon ? '<span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:' + tColor + '22;border:1px solid ' + tColor + '"><i data-lucide="' + t.icon + '" style="width:10px;height:10px;color:' + tColor + '"></i></span>' : '')
      + '<span style="font-size:12px;font-weight:600;color:var(--text-primary)">' + tName + '</span>'
      + (addedCount > 0 ? '<span style="font-size:9px;font-weight:700;color:#fff;background:' + tColor + ';border-radius:8px;padding:1px 5px;min-width:14px;text-align:center">' + addedCount + '</span>' : '')
      + '</span>';
  }).join(''); if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 0);
}

function addProcessOrder(typeName) {
  if (!window._processOrder) window._processOrder = [];
  // 중복 허용: 같은 항목을 여러 번 추가 가능
  window._processOrder.push(typeName);
  window._processTags = window._processOrder.slice();
  _renderProcessSelected();
  _renderProcessTypeList();
}

function removeProcessOrder(idx) {
  if (!window._processOrder) return;
  window._processOrder.splice(idx, 1);
  window._processTags = window._processOrder.slice();
  _renderProcessSelected();
  _renderProcessTypeList();
}

/* openNewTaskModal 래핑: 모달 열리면 진행보고 순서 UI 초기화
   단, 'edit' 모드일 때는 openEditTaskModal에서 복원하므로 초기화 생략 */
(function() {
  var _prev = typeof window.openNewTaskModal === 'function' ? window.openNewTaskModal : null;
  if (!_prev) return;
  window.openNewTaskModal = function(mode, parentId, assigneeId) {
    _prev.call(window, mode, parentId, assigneeId);
    // edit/schedule 모드는 초기화 생략
    if (mode === 'edit' || mode === 'schedule') return;
    setTimeout(function() {
      renderTeamCheckboxes('');
      if (typeof renderDetailTaskCheckboxes === 'function') renderDetailTaskCheckboxes('');
      renderProcessOrderUI([]);
    }, 10);
  };
})();
/* ══════════════════════════════════════════════
   [ 근본 원인 종합 수정 ]
   ① WS.getUser / WS.getTask ID 타입 안전화
     → number/string 혼용 (= 느슨한 == 비교)
   ② openAssignmentManageModal
   ③ renderAssignmentManageTasks
   ④ toggleTaskAssignment
══════════════════════════════════════════════ */
(function patchWS() {
  var _origGetUser = WS.getUser.bind(WS);
  var _origGetTask = WS.getTask.bind(WS);
  WS.getUser = function(id) {
    var r = _origGetUser(id);
    if (r) return r;
    return WS.users.find(function(u) { return u.id == id; }) || null;
  };
  WS.getTask = function(id) {
    var r = _origGetTask(id);
    if (r) return r;
    return WS.tasks.find(function(t) { return t.id == id; }) || null;
  };
})();

function openAssignmentManageModal(id) {
  var numId = Number(id);
  var u = WS.getUser(numId);
  if (!u) { showToast('error', '직원 정보를 찾을 수 없습니다.'); return; }
  window._ammStaffId = numId;

  var card = document.getElementById('amm_staff_card');
  if (card) {
    var taskCount = WS.tasks.filter(function(t) {
      var ids = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
      return ids.some(function(x) { return x == numId; });
    }).length;
    var accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#4f6ef7';
    card.innerHTML =
      '<div style="width:60px;height:60px;border-radius:12px;background:linear-gradient(135deg,' + (u.color||'#4f6ef7') + ',#9747ff);display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px;font-weight:800">' + u.avatar + '</div>' +
      '<div><div style="font-size:18px;font-weight:800;color:var(--text-primary);margin-bottom:2px">' + u.name + '</div>' +
      '<div style="font-size:13px;color:var(--text-secondary);font-weight:600">' + u.role + ' · ' + u.dept + '</div>' +
      '<div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">' + (u.email||'') + '</div></div>' +
      '<div style="margin-left:auto;text-align:right"><div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">현재 담당 업무</div>' +
      '<div style="font-size:20px;font-weight:800;color:' + accent + '">' + taskCount + '건</div></div>';
  }
  renderAssignmentManageTasks(numId);
  if (typeof openModal === 'function') openModal('assignmentManageModal');
  if (typeof refreshIcons === 'function') refreshIcons();
}

function renderAssignmentManageTasks(staffId) {
  var container = document.getElementById('amm_task_list');
  if (!container) return;
  var numId = Number(staffId);
  var accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#4f6ef7';
  container.innerHTML = WS.tasks.map(function(t) {
    if (!Array.isArray(t.assigneeIds)) t.assigneeIds = t.assigneeId ? [t.assigneeId] : [];
    var ok = t.assigneeIds.some(function(x) { return x == numId; });
    return (
      '<div onclick="toggleTaskAssignment(' + numId + ',' + t.id + ')" ' +
      'style="padding:12px;border-radius:10px;border:2px solid ' + (ok ? accent : 'transparent') + ';' +
      'background:' + (ok ? 'color-mix(in srgb,' + accent + ' 9%,var(--bg-primary))' : 'var(--bg-tertiary)') + ';' +
      'opacity:' + (ok ? '1' : '0.6') + ';cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:10px;margin-bottom:8px">' +
        '<div style="width:24px;height:24px;border-radius:50%;background:' + (ok ? accent : 'var(--border-color)') + ';display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0">' +
          (ok ? '<svg viewBox="0 0 24 24" width="14" height="14" stroke="#fff" stroke-width="2.5" fill="none"><polyline points="20 6 9 17 4 12"/></svg>'
              : '<svg viewBox="0 0 24 24" width="14" height="14" stroke="#fff" stroke-width="2.5" fill="none"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>') +
        '</div>' +
        '<div style="flex:1"><div style="font-size:12.5px;font-weight:700;color:var(--text-primary);margin-bottom:2px">' + t.title + '</div>' +
        '<div style="font-size:10px;color:var(--text-muted)">' + (t.team||'-') + '</div></div>' +
      '</div>'
    );
  }).join('');
  if (typeof refreshIcons === 'function') refreshIcons();
}

function toggleTaskAssignment(staffId, taskId) {
  var numStaff = Number(staffId);
  var t = WS.getTask(taskId);
  if (!t) return;
  if (!Array.isArray(t.assigneeIds)) t.assigneeIds = t.assigneeId ? [t.assigneeId] : [];
  var idx = t.assigneeIds.findIndex(function(x) { return x == numStaff; });
  if (idx !== -1) {
    t.assigneeIds.splice(idx, 1);
    showToast('info', '"' + t.title + '" 배정이 해제되었습니다.');
  } else {
    t.assigneeIds.push(numStaff);
    showToast('success', '"' + t.title + '" 업무가 배정되었습니다.');
  }
  WS.saveTasks();
  renderAssignmentManageTasks(numStaff);
  renderPage_Tasks();
}
function selectTaskAssignee(taskId, staffId) {
  var t = WS.getTask(taskId);
  if (!t) return;

  if (!Array.isArray(t.assigneeIds)) {
    t.assigneeIds = t.assigneeId ? [t.assigneeId] : [];
  }

  var idx = t.assigneeIds.indexOf(staffId);
  if (idx !== -1) {
    t.assigneeIds.splice(idx, 1);
    showToast('info', '담당자 배정이 해제되었습니다.');
  } else {
    t.assigneeIds.push(staffId);
    var u = WS.getUser(staffId);
    showToast('success', (u ? u.name : '') + '님이 담당자로 배정되었습니다.');
  }
  WS.saveTasks();
  renderTaskAssignStaffList(taskId);
  renderPage_Tasks();
}

/* ══════════════════════════════════════════════
   deleteTask – confirm() 제거, 즉시 삭제 + 토스트
══════════════════════════════════════════════ */
function deleteTask(id) {
  var task = WS.getTask(id);
  if (!task) return;
  var title = task.title || '업무';
  WS.tasks = WS.tasks.filter(function(t) { return t.id !== id; });
  WS.saveTasks();
  renderPage_Tasks();
  showToast('info', '"' + title + '" 삭제 완료');
}

/* ══════════════════════════════════════════════
   createNewTask – due 자동설정 + 모달 닫기 보장
══════════════════════════════════════════════ */
function createNewTask() {
  var titleEl = document.getElementById('nt_title');
  var title = titleEl ? titleEl.value.trim() : '';
  if (!title) { showToast('error', '업무 제목을 입력하세요'); return; }

  // due 자동 설정 (hidden input)
  var dueEl = document.getElementById('nt_due');
  if (dueEl && !dueEl.value) dueEl.value = new Date().toISOString().split('T')[0];
  var due = dueEl ? dueEl.value : new Date().toISOString().split('T')[0];

  // 팀 선택 (체크박스 복수 선택)
  var teamChecks = document.querySelectorAll('#nt_teams_checkboxes input[type=checkbox]:checked');
  var teamArr = [];
  teamChecks.forEach(function(cb) { teamArr.push(cb.value); });
  var teamStr = teamArr.join(', ') || (document.getElementById('nt_team') ? document.getElementById('nt_team').value : '');

  var scoreEl = document.getElementById('nt_score');
  var resultEl = document.getElementById('nt_result');
  var descEl = document.getElementById('nt_desc');
  var startEl = document.getElementById('nt_start');
  var impEl = document.getElementById('nt_important');

  var nt = {
    id: Date.now(),
    title: title,
    desc: descEl ? descEl.value : '',
    assignerId: WS.currentUser ? WS.currentUser.id : 1,
    assigneeIds: [],
    status: 'waiting',
    priority: (document.getElementById('nt_priority') ? document.getElementById('nt_priority').value : 'medium') || 'medium',
    progress: 0,
    dueDate: due,
    createdAt: new Date().toISOString().split('T')[0],
    startedAt: startEl ? startEl.value : null,
    isImportant: impEl ? impEl.checked : false,
    team: teamStr,
    score: scoreEl ? (parseInt(scoreEl.value) || 0) : 0,
    scoreBase: scoreEl ? (parseInt(scoreEl.value) || 0) : 0,
    scoreMin: document.getElementById('nt_score_min') ? (parseInt(document.getElementById('nt_score_min').value) || undefined) : undefined,
    scoreMax: document.getElementById('nt_score_max') ? (parseInt(document.getElementById('nt_score_max').value) || undefined) : undefined,
    reportContent: resultEl ? resultEl.value : '',
    processTags: window._processTags || [],
    parentId: window._newParentId || null,
    spentTime: '0h',
    history: [{ date: new Date().toISOString().split('T')[0], event: '업무 등록', detail: WS.currentUser ? WS.currentUser.name : '', icon: 'clipboard-list', color: '#4f6ef7' }]
  };

  WS.tasks.push(nt);
  WS.saveTasks();
  window._newParentId = null;
  window._processTags = [];

  if (typeof closeModalDirect === 'function') closeModalDirect('newTaskModal');
  if (typeof renderDashboard === 'function') renderDashboard();
  if (typeof renderPage_Tasks === 'function') renderPage_Tasks();
  if (typeof renderPage_Settings === 'function') renderPage_Settings();
  showToast('success', '"' + title + '" 업무가 등록되었습니다.');
}

/* ══════════════════════════════════════════════
   setAssignmentMode – 팀별 모드 추가
══════════════════════════════════════════════ */
function setAssignmentMode(mode, el) {
  window._assignmentMode = mode;
  // 칩 active 상태
  document.querySelectorAll('#assignmentSubFilter .chip').forEach(function(c) { c.classList.remove('active'); });
  if (el) el.classList.add('active');
  // 직원 관리버튼 표시
  var sma = document.getElementById('staffManageActions');
  if (sma) sma.style.display = (mode === 'staff') ? 'flex' : 'none';
  renderPage_Tasks();
}

/* ══════════════════════════════════════════════
   renderAssignmentByTeam – 팀별 탭 리스트
   컬럼: 팀 정보 / 배정 업무 / 관리
══════════════════════════════════════════════ */
function renderAssignmentByTeam(targetEl) {
  var el = targetEl || document.getElementById('taskListArea');
  if (!el) return;

  var depts = WS.departments || [];
  if (!depts.length) {
    el.innerHTML = '<div class="empty-state" style="padding:40px;text-align:center;color:var(--text-muted)">팀(부서) 정보가 없습니다.</div>';
    return;
  }

  var rows = depts.map(function(dept) {
    // 해당 팀에 배정된 업무 찾기
    var teamTasks = WS.tasks.filter(function(t) {
      return t.team && t.team.indexOf(dept.name) !== -1;
    });
    var badges = teamTasks.map(function(t) {
      return '<span class="task-badge" style="font-size:11px;padding:3px 8px;border-radius:6px;background:var(--bg-secondary);color:var(--text-primary);margin:2px;display:inline-block">' + t.title + '</span>';
    }).join('');

    // 팀 멤버 찾기
    var members = WS.users.filter(function(u) { return u.dept === dept.name; });
    var memberAvatars = members.map(function(u) {
      return '<div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,' + (u.color || '#4f6ef7') + ',#9747ff);color:#fff;font-size:11px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;margin-right:2px" title="' + u.name + '">' + u.avatar + '</div>';
    }).join('');

    return '<tr>' +
      '<td style="width:220px">' +
        '<div style="display:flex;flex-direction:column;gap:6px">' +
          '<div style="font-weight:800;font-size:13.5px;color:var(--text-primary)">' + dept.name + '</div>' +
          '<div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap">' +
            memberAvatars +
            '<span style="font-size:11px;color:var(--text-muted)">' + members.length + '명</span>' +
          '</div>' +
        '</div>' +
      '</td>' +
      '<td>' +
        '<div style="display:flex;flex-wrap:wrap;gap:4px">' +
          (badges || '<span style="color:var(--text-muted);font-size:11px">배정된 업무 없음</span>') +
        '</div>' +
        '<div style="font-size:10px;color:var(--text-muted);margin-top:4px">' + teamTasks.length + '건</div>' +
      '</td>' +
      '<td style="width:80px;text-align:center">' +
        '<button class="btn-icon-sm edit" onclick="openTeamAssignPanel(\'' + dept.name + '\')" title="팀 업무 관리" style="background:none;border:none;cursor:pointer;padding:4px;border-radius:6px;color:var(--text-muted)">' +
          '<i data-lucide="settings-2" style="width:15px;height:15px"></i>' +
        '</button>' +
      '</td>' +
    '</tr>';
  }).join('');

  el.innerHTML =
    '<table class="task-table" style="width:100%;table-layout:fixed">' +
      '<colgroup>' +
        '<col style="width:260px">' +
        '<col>' +
        '<col style="width:80px">' +
      '</colgroup>' +
      '<thead><tr>' +
        '<th style="width:260px">팀 정보</th>' +
        '<th>배정 업무</th>' +
        '<th style="width:80px">관리</th>' +
      '</tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
    '</table>';
  refreshIcons();
}

/* 팀별 업무배정 관리 모달 */
function openTeamAssignPanel(deptName) {
  window._teamAssignDept = deptName;

  // 팀명 표시
  var nameEl = document.getElementById('tam_team_name');
  if (nameEl) nameEl.textContent = deptName;

  // 업무 체크박스 리스트 렌더
  var container = document.getElementById('tam_task_checklist');
  var countEl   = document.getElementById('tam_team_count');
  if (!container) return;

  var accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#4f6ef7';

  var html = WS.tasks.map(function(t) {
    // 이 팀에 이미 배정된 업무인지 확인
    var isAssigned = t.team && t.team.indexOf(deptName) !== -1;
    var uid = 'ta_tc_' + t.id;
    return (
      '<label for="' + uid + '" style="display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:10px;' +
        'border:2px solid ' + (isAssigned ? accent : 'transparent') + ';' +
        'background:' + (isAssigned ? 'color-mix(in srgb,' + accent + ' 9%,var(--bg-primary))' : 'var(--bg-tertiary)') + ';' +
        'cursor:pointer;transition:all 0.15s;margin-bottom:6px;user-select:none" ' +
        'onchange="updateTeamCheckItem(this.querySelector(\'input\'))">' +
        '<input type="checkbox" id="' + uid + '" value="' + t.id + '"' + (isAssigned ? ' checked' : '') +
          ' style="width:16px;height:16px;accent-color:' + accent + ';cursor:pointer;flex-shrink:0">' +
        '<div style="flex:1">' +
          '<div style="font-weight:700;font-size:13px;color:var(--text-primary)">' + t.title + '</div>' +
          '<div style="font-size:10.5px;color:var(--text-muted)">' + (t.team || '팀 없음') + '</div>' +
        '</div>' +
        '<div style="width:22px;height:22px;border-radius:6px;flex-shrink:0;display:flex;align-items:center;justify-content:center;' +
          'background:' + (isAssigned ? accent : 'var(--bg-primary)') + ';' +
          'border:2px solid ' + (isAssigned ? accent : 'var(--border-color)') + '" id="cb_box_' + t.id + '">' +
          (isAssigned ? '<svg viewBox="0 0 24 24" width="12" height="12" stroke="#fff" stroke-width="3" fill="none"><polyline points="20 6 9 17 4 12"/></svg>' : '') +
        '</div>' +
      '</label>'
    );
  }).join('');

  container.innerHTML = html || '<div style="padding:20px;text-align:center;color:var(--text-muted)">등록된 업무가 없습니다.</div>';

  // 선택된 업무 수 카운터
  setTimeout(function() { updateTeamTaskCount(); }, 0);

  if (typeof openModal === 'function') openModal('teamAssignModal');
  if (typeof refreshIcons === 'function') refreshIcons();
}

function updateTeamCheckItem(cb) {
  if (!cb) return;
  var label = cb.closest('label');
  var boxEl  = document.getElementById('cb_box_' + cb.value);
  var accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#4f6ef7';
  if (cb.checked) {
    if (label) { label.style.borderColor = accent; label.style.background = 'color-mix(in srgb,' + accent + ' 9%,var(--bg-primary))'; }
    if (boxEl)  { boxEl.style.background = accent; boxEl.style.borderColor = accent;
      boxEl.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" stroke="#fff" stroke-width="3" fill="none"><polyline points="20 6 9 17 4 12"/></svg>'; }
  } else {
    if (label) { label.style.borderColor = 'transparent'; label.style.background = 'var(--bg-tertiary)'; }
    if (boxEl)  { boxEl.style.background = 'var(--bg-primary)'; boxEl.style.borderColor = 'var(--border-color)'; boxEl.innerHTML = ''; }
  }
  updateTeamTaskCount();
}

function updateTeamTaskCount() {
  var countEl = document.getElementById('tam_team_count');
  if (!countEl) return;
  var checked = document.querySelectorAll('#tam_task_checklist input[type=checkbox]:checked').length;
  var accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#4f6ef7';
  countEl.innerHTML = '선택됨 <strong style="color:' + accent + '">' + checked + '</strong>건';
}

function saveTeamAssignment() {
  var deptName = window._teamAssignDept;
  if (!deptName) return;

  var checkedIds = [];
  document.querySelectorAll('#tam_task_checklist input[type=checkbox]:checked').forEach(function(cb) {
    checkedIds.push(Number(cb.value));
  });
  var uncheckedIds = [];
  document.querySelectorAll('#tam_task_checklist input[type=checkbox]:not(:checked)').forEach(function(cb) {
    uncheckedIds.push(Number(cb.value));
  });

  // 체크된 업무 → 팀에 추가, 체크 해제된 업무 → 팀에서 제거
  WS.tasks = WS.tasks.map(function(t) {
    var teamArr = (t.team || '').split(',').map(function(s){ return s.trim(); }).filter(Boolean);
    if (checkedIds.includes(t.id)) {
      if (!teamArr.includes(deptName)) teamArr.push(deptName);
    } else if (uncheckedIds.includes(t.id)) {
      teamArr = teamArr.filter(function(s){ return s !== deptName; });
    }
    return Object.assign({}, t, { team: teamArr.join(', ') });
  });
  WS.saveTasks();

  if (typeof closeModalDirect === 'function') closeModalDirect('teamAssignModal');
  if (typeof renderPage_Tasks === 'function') renderPage_Tasks();
  showToast('success', '"' + deptName + '" 팀 업무배정이 저장되었습니다.');
}

/* ══════════════════════════════════════════════
   직원관리 CRUD 재정의
   ① openStaffModal – WS 배열 안전 처리
   ② deleteStaff    – confirm() 제거
   ③ saveStaff      – 한글 토스트 수정
══════════════════════════════════════════════ */
function openStaffModal(id) {
  window._editingStaffId = id || null;

  var titleEl = document.getElementById('staffModalTitle');
  if (titleEl) titleEl.textContent = id ? '직원 정보 상세' : '직원 등록';

  // 셀렉트 옵션 안전 채우기
  var deptSel = document.getElementById('st_dept');
  var roleSel = document.getElementById('st_role');
  var posSel  = document.getElementById('st_pos');
  if (deptSel) deptSel.innerHTML = (WS.departments || []).map(function(d){ return '<option value="' + d.name + '">' + d.name + '</option>'; }).join('');
  if (roleSel) roleSel.innerHTML = (WS.ranks || []).map(function(r){ return '<option value="' + r.name + '">' + r.name + '</option>'; }).join('');
  if (posSel)  posSel.innerHTML  = (WS.positions || []).map(function(p){ return '<option value="' + p.name + '">' + p.name + '</option>'; }).join('');

  var fields = ['name','dept','role','pos','phone','address','email','status','birthday','hiredAt','resignedAt','loginId','password','avatar','color','note'];

  if (id) {
    var u = WS.getUser(id);
    if (!u) return;
    fields.forEach(function(f) {
      var el = document.getElementById('st_' + f);
      if (el) el.value = u[f] || '';
    });
    ['birthday','hiredAt','resignedAt'].forEach(function(f) {
      var lbl = document.getElementById('st_' + f + '_label');
      if (lbl) lbl.textContent = u[f] || '날짜 미입력';
    });
    // 사진 미리보기
    var prev = document.getElementById('st_photo_preview');
    if (prev) {
      if (u.photo) {
        prev.style.backgroundImage = 'url(' + u.photo + ')';
        prev.style.backgroundSize = 'cover';
        prev.style.backgroundPosition = 'center';
        prev.innerHTML = '';
      } else {
        prev.style.backgroundImage = '';
        prev.innerHTML = '<i data-lucide="camera" style="width:28px;height:28px;color:var(--text-muted)"></i><span style="font-size:10px;color:var(--text-muted);margin-top:6px;text-align:center;line-height:1.3">사진<br>등록</span>';
      }
    }
    // 담당 업무
    var taskSection   = document.getElementById('staffTasksSection');
    var taskContainer = document.getElementById('st_tasks_container');
    var addBtn        = document.getElementById('st_add_task_btn');
    if (taskSection) taskSection.style.display = 'block';
    if (taskContainer) {
      var myTasks = WS.tasks.filter(function(t) {
        var ids = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
        return ids.includes(id);
      });
      taskContainer.innerHTML = myTasks.map(function(t) {
        return '<span class="task-badge" onclick="closeModalDirect(\'staffModal\');openTaskDetail(' + t.id + ')" style="cursor:pointer">' + t.title + '</span>';
      }).join('') || '<div style="font-size:11px;color:var(--text-muted)">배정된 업무가 없습니다.</div>';
    }
    if (addBtn) addBtn.onclick = function() { closeModalDirect('staffModal'); openNewTaskModal(null, id); };
  } else {
    fields.forEach(function(f) {
      var el = document.getElementById('st_' + f);
      if (el) el.value = (f === 'color') ? '#4f6ef7' : (f === 'status') ? '재직' : '';
    });
    ['birthday','hiredAt','resignedAt'].forEach(function(f) {
      var lbl = document.getElementById('st_' + f + '_label');
      if (lbl) lbl.textContent = '날짜 미입력';
    });
    var taskSection2 = document.getElementById('staffTasksSection');
    if (taskSection2) taskSection2.style.display = 'none';
    var prev2 = document.getElementById('st_photo_preview');
    if (prev2) {
      prev2.style.backgroundImage = '';
      prev2.innerHTML = '<i data-lucide="camera" style="width:28px;height:28px;color:var(--text-muted)"></i><span style="font-size:10px;color:var(--text-muted);margin-top:6px;text-align:center;line-height:1.3">사진<br>등록</span>';
    }
    var fileInput = document.getElementById('st_photo_file');
    if (fileInput) fileInput.value = '';
  }

  if (typeof openModal === 'function') openModal('staffModal');
  if (typeof refreshIcons === 'function') refreshIcons();
}

function deleteStaff(id) {
  if (id === (WS.currentUser && WS.currentUser.id)) {
    showToast('error', '본인 계정은 삭제할 수 없습니다.');
    return;
  }
  WS.deleteUser(id);
  if (typeof renderPage_StaffMgmt === 'function') renderPage_StaffMgmt();
  if (typeof renderPage_Tasks === 'function') renderPage_Tasks();
  showToast('info', '직원이 삭제되었습니다.');
}

function saveStaff() {
  var nameEl = document.getElementById('st_name');
  var name = nameEl ? nameEl.value.trim() : '';
  if (!name) { showToast('error', '이름을 입력하세요'); return; }

  var fields = ['name','role','dept','pos','phone','address','email','status','birthday','hiredAt','resignedAt','loginId','password','avatar','color','note'];
  var data = {};
  fields.forEach(function(f) {
    var el = document.getElementById('st_' + f);
    if (el) data[f] = el.value;
  });
  data.photo = window._staffPhotoBase64 || (window._editingStaffId ? ((WS.getUser(window._editingStaffId) || {}).photo || '') : '');
  if (!data.avatar) data.avatar = name.substring(0, 2);

  if (window._editingStaffId) {
    WS.updateUser(window._editingStaffId, data);
    showToast('success', '직원 정보가 수정되었습니다.');
  } else {
    WS.addUser(data);
    showToast('success', '새 직원이 등록되었습니다.');
  }
  if (typeof closeModalDirect === 'function') closeModalDirect('staffModal');
  window._staffPhotoBase64 = null;
  if (typeof renderPage_StaffMgmt === 'function') renderPage_StaffMgmt();
  if (typeof renderPage_Tasks === 'function') renderPage_Tasks();
  if (typeof initHeader === 'function') initHeader();
}

/* ══════════════════════════════════════════════
   renderTaskAssignStaffList – 체크박스에 강조색(--accent-primary) 적용
══════════════════════════════════════════════ */
function renderTaskAssignStaffList(taskId) {
  var t = WS.getTask(taskId);
  var container = document.getElementById('tam_staff_list');
  if (!container || !t) return;

  if (!Array.isArray(t.assigneeIds)) {
    t.assigneeIds = t.assigneeId ? [t.assigneeId] : [];
  }

  // CSS 변수에서 강조색 가져오기
  var accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#4f6ef7';

  var selectedCount = t.assigneeIds.length;
  var html = '<div style="margin-bottom:8px;font-size:11px;color:var(--text-muted);text-align:right">' +
    '선택됨 <strong style="color:' + accentColor + '">' + selectedCount + '</strong>명</div>';

  html += WS.users.map(function(u) {
    var isSelected = t.assigneeIds.includes(u.id);
    return (
      '<div onclick="selectTaskAssignee(' + taskId + ',' + u.id + ')" ' +
      'style="display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:10px;' +
        'border:2px solid ' + (isSelected ? accentColor : 'transparent') + ';' +
        'background:' + (isSelected ? 'color-mix(in srgb,' + accentColor + ' 9%,var(--bg-primary))' : 'var(--bg-tertiary)') + ';' +
        'cursor:pointer;transition:all 0.18s;margin-bottom:6px;user-select:none">' +
        '<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,' + (u.color || '#4f6ef7') + ',#9747ff);' +
          'color:#fff;font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0">' +
          u.avatar +
        '</div>' +
        '<div style="flex:1">' +
          '<div style="font-weight:700;font-size:13px;color:var(--text-primary)">' + u.name + '</div>' +
          '<div style="font-size:10.5px;color:var(--text-muted)">' + u.role + ' · ' + u.dept + '</div>' +
        '</div>' +
        '<div style="width:22px;height:22px;border-radius:6px;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all 0.18s;' +
          'background:' + (isSelected ? accentColor : 'var(--bg-primary)') + ';' +
          'border:2px solid ' + (isSelected ? accentColor : 'var(--border-color)') + '">' +
          (isSelected ? '<svg viewBox="0 0 24 24" width="13" height="13" stroke="#fff" stroke-width="3" fill="none"><polyline points="20 6 9 17 4 12"/></svg>' : '') +
        '</div>' +
      '</div>'
    );
  }).join('');

  container.innerHTML = html;
}
/* ══════════════════════════════════════════════
   orgItemModal – 상세업무/진행보고유형 추가·수정 공통
══════════════════════════════════════════════ */
function openDetailTaskModal(editId) {
  window._orgItemType   = 'detailTask';
  window._orgItemEditId = editId || null;
  var el = document.getElementById('oim_title');
  if (el) el.textContent = editId ? '상세업무 수정' : '상세업무 추가';
  var gI = document.getElementById('oim_icon_group'), gC = document.getElementById('oim_color_group');
  if (gI) gI.style.display = 'none';
  if (gC) gC.style.display = 'none';
  WS.detailTasks = JSON.parse(localStorage.getItem('ws_detail_tasks')) || WS.detailTasks || [];
  var item = editId ? WS.detailTasks.find(function(d){ return d.id === editId; }) : null;
  var inp = document.getElementById('oim_name');
  if (inp) { inp.value = item ? (item.name || '') : ''; }
  if (typeof openModal === 'function') openModal('orgItemModal');
  setTimeout(function(){ var i2 = document.getElementById('oim_name'); if(i2) i2.focus(); }, 100);
}

function openReportTypeModal(editId) {
  window._orgItemType   = 'reportType';
  window._orgItemEditId = editId || null;
  var el = document.getElementById('oim_title');
  if (el) el.textContent = editId ? '진행보고 유형 수정' : '진행보고 유형 추가';
  var gI = document.getElementById('oim_icon_group'), gC = document.getElementById('oim_color_group');
  if (gI) gI.style.display = '';
  if (gC) gC.style.display = '';
  WS.reportTypes = JSON.parse(localStorage.getItem('ws_report_types')) || WS.reportTypes || [];
  var item = editId ? WS.reportTypes.find(function(r){ return r.id === editId; }) : null;
  var nm = document.getElementById('oim_name');
  var ic = document.getElementById('oim_icon');
  var cl = document.getElementById('oim_color');
  if (nm) nm.value = item ? (item.label || item.name || '') : '';
  if (ic) ic.value = item ? (item.icon || 'message-square') : 'message-square';
  if (cl) cl.value = item ? (item.color || '#4f6ef7') : '#4f6ef7';
  previewOimIcon();
  if (typeof openModal === 'function') openModal('orgItemModal');
  setTimeout(function() { var icv = (document.getElementById('oim_icon')||{}).value||'message-square'; renderIconGrid(icv); var i2=document.getElementById('oim_name'); if(i2) i2.focus(); }, 80);
}

function editReportType(id) { openReportTypeModal(id); }

function previewOimIcon() {
  var icVal = (document.getElementById('oim_icon') || {}).value || 'message-square';
  var el = document.getElementById('oim_icon_el');
  if (!el) return;
  el.setAttribute('data-lucide', icVal.trim() || 'message-square');
  if (typeof refreshIcons === 'function') refreshIcons();
}

function saveOrgItemModal() {
  var name = (document.getElementById('oim_name') || {}).value;
  if (!name || !name.trim()) { showToast('error', '이름을 입력하세요.'); return; }
  name = name.trim();
  var type   = window._orgItemType;
  var editId = window._orgItemEditId;
  if (type === 'detailTask') {
    WS.detailTasks = JSON.parse(localStorage.getItem('ws_detail_tasks')) || [];
    if (editId) {
      WS.detailTasks = WS.detailTasks.map(function(d){ return d.id === editId ? Object.assign({}, d, {name: name}) : d; });
    } else {
      WS.detailTasks.push({ id: Date.now(), name: name });
    }
    _saveDetailTasks();
    showToast('success', editId ? '상세업무가 수정되었습니다.' : '"' + name + '" 상세업무가 추가되었습니다.');
  } else if (type === 'reportType') {
    var icon  = ((document.getElementById('oim_icon')  || {}).value  || 'message-square').trim();
    var color = ((document.getElementById('oim_color') || {}).value  || '#4f6ef7');
    WS.reportTypes = JSON.parse(localStorage.getItem('ws_report_types')) || WS.reportTypes || [];
    if (editId) {
      WS.reportTypes = WS.reportTypes.map(function(r){ return r.id === editId ? Object.assign({}, r, {label: name, icon: icon, color: color}) : r; });
    } else {
      var newId = Math.max.apply(null, [0].concat(WS.reportTypes.map(function(r){ return r.id; }))) + 1;
      WS.reportTypes.push({ id: newId, label: name, icon: icon, color: color });
    }
    WS.saveReportTypes && WS.saveReportTypes();
    showToast('success', editId ? '진행보고 유형이 수정되었습니다.' : '진행보고 유형이 추가되었습니다.');
  }
  if (typeof closeModalDirect === 'function') closeModalDirect('orgItemModal');
  if (typeof renderPage_RankMgmt === 'function') renderPage_RankMgmt();
}

function updateDetailTaskCheckStyle(cb) { updateDetailTaskCheck(cb); }

var _OIM_ICONS = [
  'play-circle','stop-circle','check-circle','x-circle','alert-circle','info',
  'search','wrench','settings','zap','flag','star','bookmark','bell',
  'file-text','clipboard','clipboard-list','message-circle','message-square',
  'users','user','briefcase','package','layers','grid',
  'calendar','clock','timer','hourglass','alarm-clock',
  'trending-up','bar-chart-2','pie-chart','target','award',
  'thumbs-up','thumbs-down','heart','shield','lock','key',
  'mail','phone','map-pin','home','building'
];

function renderIconGrid(selectedIcon) {
  var grid = document.getElementById('oim_icon_grid');
  if (!grid) return;
  var sel = selectedIcon || document.getElementById('oim_icon')?.value || '';
  grid.innerHTML = _OIM_ICONS.map(function(ic) {
    var isSelected = ic === sel;
    var accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#4f6ef7';
    return '<button type="button" onclick="selectOimIcon(\'' + ic + '\')" title="' + ic + '"'
      + ' style="width:36px;height:36px;border-radius:8px;border:2px solid ' + (isSelected ? accent : 'var(--border-color)') + ';'
      + 'background:' + (isSelected ? 'color-mix(in srgb,' + accent + ' 12%,var(--bg-primary))' : 'var(--bg-tertiary)') + ';'
      + 'cursor:pointer;display:inline-flex;align-items:center;justify-content:center;transition:all 0.15s"'
      + ' id="oim_ic_btn_' + ic.replace(/-/g,'_') + '">'
      + '<i data-lucide="' + ic + '" style="width:16px;height:16px;color:' + (isSelected ? accent : 'var(--text-secondary)') + '"></i>'
      + '</button>';
  }).join('');
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 0);
}

function selectOimIcon(iconName) {
  var inp = document.getElementById('oim_icon');
  if (inp) inp.value = iconName;
  renderIconGrid(iconName);
}

/* ══════════════════════════════════════════════
   지시 중요도 CRUD (진행보고 유형과 동일한 패턴)
══════════════════════════════════════════════ */
if (!WS.instrImportances) WS.instrImportances = JSON.parse(localStorage.getItem('ws_instr_importances')) || [];

function _saveInstrImportances() {
  localStorage.setItem('ws_instr_importances', JSON.stringify(WS.instrImportances || []));
}

var _iiCtx = { id: null, mode: 'add' };

var _II_ICON_CATEGORIES = [
  { label:'긴급', color:'#ef4444', items:[
    {icon:'zap',color:'#ef4444'},{icon:'flame',color:'#ef4444'},{icon:'alert-triangle',color:'#f97316'},
    {icon:'alert-circle',color:'#ef4444'},{icon:'alert-octagon',color:'#dc2626'},{icon:'bell-ring',color:'#f97316'},
    {icon:'megaphone',color:'#f97316'},{icon:'alarm-clock',color:'#ef4444'},{icon:'timer',color:'#f97316'},
    {icon:'ban',color:'#ef4444'},{icon:'bomb',color:'#dc2626'},{icon:'skull',color:'#dc2626'},
    {icon:'activity',color:'#ef4444'},{icon:'octagon',color:'#ef4444'},{icon:'siren',color:'#ef4444'}
  ]},
  { label:'중요', color:'#f59e0b', items:[
    {icon:'star',color:'#eab308'},{icon:'crown',color:'#f59e0b'},{icon:'gem',color:'#8b5cf6'},
    {icon:'trophy',color:'#f59e0b'},{icon:'award',color:'#8b5cf6'},{icon:'medal',color:'#f59e0b'},
    {icon:'bookmark',color:'#ef4444'},{icon:'flag',color:'#ef4444'},{icon:'heart',color:'#ec4899'},
    {icon:'badge-check',color:'#3b82f6'},{icon:'ribbon',color:'#8b5cf6'},{icon:'sparkles',color:'#eab308'},
    {icon:'sun',color:'#eab308'},{icon:'wand-2',color:'#8b5cf6'},{icon:'hand-metal',color:'#f59e0b'}
  ]},
  { label:'보안', color:'#3b82f6', items:[
    {icon:'shield',color:'#3b82f6'},{icon:'lock',color:'#3b82f6'},{icon:'key',color:'#94a3b8'},
    {icon:'fingerprint',color:'#6366f1'},{icon:'scan',color:'#06b6d4'},{icon:'eye',color:'#3b82f6'},
    {icon:'eye-off',color:'#64748b'},{icon:'shield-check',color:'#22c55e'},{icon:'shield-alert',color:'#f59e0b'},
    {icon:'shield-off',color:'#ef4444'},{icon:'scan-face',color:'#6366f1'},{icon:'camera',color:'#3b82f6'},
    {icon:'user-check',color:'#22c55e'},{icon:'file-lock',color:'#3b82f6'},{icon:'webhook',color:'#6366f1'}
  ]},
  { label:'확인', color:'#22c55e', items:[
    {icon:'check-circle',color:'#22c55e'},{icon:'check-square',color:'#22c55e'},{icon:'clipboard-check',color:'#10b981'},
    {icon:'search',color:'#6366f1'},{icon:'list-checks',color:'#22c55e'},{icon:'file-search',color:'#6366f1'},
    {icon:'zoom-in',color:'#3b82f6'},{icon:'glasses',color:'#64748b'},{icon:'microscope',color:'#06b6d4'},
    {icon:'file-check',color:'#22c55e'},{icon:'scan-search',color:'#3b82f6'},{icon:'check-check',color:'#10b981'},
    {icon:'circle-check',color:'#22c55e'},{icon:'binoculars',color:'#6366f1'},{icon:'inspect',color:'#6366f1'}
  ]},
  { label:'완벽', color:'#8b5cf6', items:[
    {icon:'target',color:'#ef4444'},{icon:'rocket',color:'#6366f1'},{icon:'trending-up',color:'#22c55e'},
    {icon:'bar-chart',color:'#3b82f6'},{icon:'thumbs-up',color:'#22c55e'},{icon:'percent',color:'#8b5cf6'},
    {icon:'infinity',color:'#8b5cf6'},{icon:'diamond',color:'#06b6d4'},{icon:'sparkle',color:'#eab308'},
    {icon:'wand',color:'#8b5cf6'},{icon:'star-half',color:'#eab308'},{icon:'rainbow',color:'#ec4899'},
    {icon:'repeat',color:'#06b6d4'},{icon:'refresh-cw',color:'#3b82f6'},{icon:'rotate-cw',color:'#22c55e'}
  ]},
  { label:'대충', color:'#94a3b8', items:[
    {icon:'minus-circle',color:'#94a3b8'},{icon:'more-horizontal',color:'#64748b'},{icon:'minus',color:'#94a3b8'},
    {icon:'skip-forward',color:'#94a3b8'},{icon:'fast-forward',color:'#94a3b8'},{icon:'wind',color:'#94a3b8'},
    {icon:'cloud',color:'#94a3b8'},{icon:'meh',color:'#94a3b8'},{icon:'shuffle',color:'#94a3b8'},
    {icon:'rotate-ccw',color:'#94a3b8'},{icon:'eraser',color:'#94a3b8'},{icon:'trash-2',color:'#ef4444'},
    {icon:'x-circle',color:'#ef4444'},{icon:'circle-slash',color:'#ef4444'},{icon:'undo',color:'#94a3b8'}
  ]},
  { label:'일반', color:'#64748b', items:[
    {icon:'info',color:'#3b82f6'},{icon:'tag',color:'#8b5cf6'},{icon:'hash',color:'#64748b'},
    {icon:'list',color:'#64748b'},{icon:'file-text',color:'#64748b'},{icon:'clipboard',color:'#94a3b8'},
    {icon:'folder',color:'#f59e0b'},{icon:'briefcase',color:'#64748b'},{icon:'layers',color:'#3b82f6'},
    {icon:'grid',color:'#64748b'},{icon:'layout',color:'#6366f1'},{icon:'box',color:'#f59e0b'},
    {icon:'package',color:'#f59e0b'},{icon:'send',color:'#3b82f6'},{icon:'message-circle',color:'#06b6d4'}
  ]}
];

var _iiActiveCat = 0;

function _initIiIconQuickPick() {
  var container = document.getElementById('iiIconQuickPick');
  if (!container) return;
  container.style.cssText = 'display:flex;flex-direction:column;gap:8px';

  // 카테고리 탭 렌더
  var tabHtml = '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:2px">' +
    _II_ICON_CATEGORIES.map(function(cat, idx) {
      var active = idx === _iiActiveCat;
      return '<button type="button" onclick="_iiSetCategory(' + idx + ')" id="iiCatTab' + idx + '" ' +
        'style="padding:3px 9px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;border:1.5px solid ' + cat.color + ';' +
        'background:' + (active ? cat.color : cat.color + '18') + ';' +
        'color:' + (active ? '#fff' : cat.color) + ';transition:all 0.15s">' +
        cat.label +
        '</button>';
    }).join('') + '</div>';

  // 아이콘 그리드 렌더
  var cat = _II_ICON_CATEGORIES[_iiActiveCat];
  var gridHtml = '<div id="iiIconGrid" style="display:flex;flex-wrap:wrap;gap:5px;max-height:120px;overflow-y:auto;padding:2px 0">' +
    cat.items.map(function(qi) {
      return '<button type="button" onclick="_iiPickIcon(\'' + qi.icon + '\',\'' + qi.color + '\')" ' +
        'style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;' +
        'border-radius:8px;border:1.5px solid ' + qi.color + '33;background:' + qi.color + '18;cursor:pointer;flex-shrink:0" title="' + qi.icon + '">' +
        '<i data-lucide="' + qi.icon + '" style="width:15px;height:15px;color:' + qi.color + '"></i>' +
        '</button>';
    }).join('') + '</div>';

  container.innerHTML = tabHtml + gridHtml;
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 30);
}

function _iiSetCategory(idx) {
  _iiActiveCat = idx;
  // 탭 스타일 업데이트
  _II_ICON_CATEGORIES.forEach(function(cat, i) {
    var tab = document.getElementById('iiCatTab' + i);
    if (!tab) return;
    var active = i === idx;
    tab.style.background = active ? cat.color : cat.color + '18';
    tab.style.color       = active ? '#fff'    : cat.color;
  });
  // 그리드 업데이트
  var grid = document.getElementById('iiIconGrid');
  if (!grid) return;
  var cat = _II_ICON_CATEGORIES[idx];
  grid.innerHTML = cat.items.map(function(qi) {
    return '<button type="button" onclick="_iiPickIcon(\'' + qi.icon + '\',\'' + qi.color + '\')" ' +
      'style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;' +
      'border-radius:8px;border:1.5px solid ' + qi.color + '33;background:' + qi.color + '18;cursor:pointer;flex-shrink:0" title="' + qi.icon + '">' +
      '<i data-lucide="' + qi.icon + '" style="width:15px;height:15px;color:' + qi.color + '"></i>' +
      '</button>';
  }).join('');
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 30);
}

function _iiPickIcon(icon, color) {
  var iconEl   = document.getElementById('iiModalIcon');
  var colorEl  = document.getElementById('iiModalColor');
  var pickerEl = document.getElementById('iiModalColorPicker');
  if (iconEl)   iconEl.value   = icon;
  if (colorEl)  colorEl.value  = color;
  if (pickerEl) pickerEl.value = color;
  previewInstrImportanceIcon();
}

function previewInstrImportanceIcon() {
  var icon  = (document.getElementById('iiModalIcon')  || {}).value || 'flag';
  var color = (document.getElementById('iiModalColor') || {}).value || '#ef4444';
  var name  = (document.getElementById('iiModalName')  || {}).value || '중요도명';
  if (!color.startsWith('#')) color = '#ef4444';
  var prevEl  = document.getElementById('iiModalPreview');
  var iconEl  = document.getElementById('iiModalPreviewIcon');
  var nameEl  = document.getElementById('iiModalPreviewName');
  if (prevEl)  { prevEl.style.background = color + '22'; prevEl.style.borderColor = color; prevEl.style.color = color; }
  if (iconEl)  {
    iconEl.style.background  = color + '22';
    iconEl.style.borderColor = color;
    iconEl.innerHTML = icon && icon.length > 2
      ? '<i data-lucide="' + icon + '" style="width:11px;height:11px;color:' + color + '"></i>'
      : '<span style="width:7px;height:7px;border-radius:50%;background:' + color + ';display:inline-block"></span>';
  }
  if (nameEl) nameEl.textContent = name || '중요도명';
  if (typeof refreshIcons === 'function') refreshIcons();
}

function openInstrImportanceModal(editId) {
  _iiCtx.id   = editId || null;
  _iiCtx.mode = editId ? 'edit' : 'add';
  var titleEl  = document.getElementById('instrImportanceModalTitle');
  var nameEl   = document.getElementById('iiModalName');
  var iconEl   = document.getElementById('iiModalIcon');
  var colorEl  = document.getElementById('iiModalColor');
  var pickerEl = document.getElementById('iiModalColorPicker');
  if (editId) {
    var item = (WS.instrImportances || []).find(function(x){ return x.id === editId; });
    if (item) {
      if (titleEl) titleEl.textContent = '지시 중요도 수정';
      if (nameEl)   nameEl.value  = item.name  || '';
      if (iconEl)   iconEl.value  = item.icon  || '';
      if (colorEl)  colorEl.value = item.color || '#ef4444';
      if (pickerEl) pickerEl.value= item.color || '#ef4444';
    }
  } else {
    if (titleEl) titleEl.textContent = '지시 중요도 추가';
    if (nameEl)   nameEl.value  = '';
    if (iconEl)   iconEl.value  = '';
    if (colorEl)  colorEl.value = '#ef4444';
    if (pickerEl) pickerEl.value= '#ef4444';
  }
  _initIiIconQuickPick();
  previewInstrImportanceIcon();
  var m = document.getElementById('instrImportanceModal');
  if (m) { m.style.display = 'flex'; setTimeout(function(){ if(nameEl) nameEl.focus(); }, 50); }
}

function saveInstrImportanceItem() {
  var name  = (document.getElementById('iiModalName')  || {}).value;
  var icon  = (document.getElementById('iiModalIcon')  || {}).value;
  var color = (document.getElementById('iiModalColor') || {}).value;
  if (!name || !name.trim()) { showToast('error', '이름을 입력하세요'); return; }
  name  = name.trim();
  icon  = icon  ? icon.trim()  : '';
  color = (color && color.startsWith('#')) ? color.trim() : '#ef4444';
  WS.instrImportances = WS.instrImportances || [];
  if (_iiCtx.mode === 'add') {
    WS.instrImportances.push({ id: Date.now(), name: name, icon: icon, color: color });
    showToast('success', name + ' 추가 완료!');
  } else {
    var item = WS.instrImportances.find(function(x){ return x.id === _iiCtx.id; });
    if (item) { item.name = name; item.icon = icon; item.color = color; }
    showToast('info', '지시 중요도 수정 완료!');
  }
  _saveInstrImportances();
  closeInstrImportanceModal();
  renderPage_RankMgmt();
}

function deleteInstrImportance(id) {
  WS.instrImportances = (WS.instrImportances || []).filter(function(x){ return x.id !== id; });
  _saveInstrImportances();
  showToast('info', '삭제되었습니다.');
  renderPage_RankMgmt();
}

function closeInstrImportanceModal() {
  var m = document.getElementById('instrImportanceModal');
  if (m) m.style.display = 'none';
}

/* ══════════════════════════════
   📊 진행상태 관리 CRUD
══════════════════════════════ */
var _TS_ICONS = [
  {icon:'activity',label:'활동'},{icon:'refresh-cw',label:'진행'},{icon:'loader',label:'로딩'},
  {icon:'play-circle',label:'시작'},{icon:'clock',label:'시간'},{icon:'trending-up',label:'상승'},
  {icon:'check-circle-2',label:'완료'},{icon:'check-circle',label:'체크'},{icon:'circle-check',label:'확인'},
  {icon:'badge-check',label:'배지'},{icon:'shield-check',label:'보호'},{icon:'star',label:'별'},
  {icon:'x-circle',label:'취소'},{icon:'ban',label:'금지'},{icon:'slash',label:'슬래시'},
  {icon:'minus-circle',label:'마이너스'},{icon:'circle-slash',label:'금지원'},{icon:'x-octagon',label:'정지'},
  {icon:'pause-circle',label:'일시정지'},{icon:'pause',label:'보류'},{icon:'hand',label:'대기'},
  {icon:'hourglass',label:'모래시계'},{icon:'alarm-clock',label:'알람'},{icon:'lock',label:'잠금'},
  {icon:'alert-circle',label:'경고'},{icon:'alert-triangle',label:'주의'},{icon:'alert-octagon',label:'오류'},
  {icon:'thumbs-down',label:'실패'},{icon:'flame',label:'긴급'},{icon:'skull',label:'치명'}
];
var _TS_DEFAULTS = [
  {id:1,name:'진행중',icon:'activity',color:'#06b6d4'},
  {id:2,name:'완료',icon:'check-circle-2',color:'#22c55e'},
  {id:3,name:'취소',icon:'x-circle',color:'#ef4444'},
  {id:4,name:'보류',icon:'pause-circle',color:'#6b7280'},
  {id:5,name:'실패',icon:'alert-triangle',color:'#f59e0b'}
];
var _tsCtx = {mode:'add',id:null};
function _initTaskStatuses() {
  if (!WS.taskStatuses) WS.taskStatuses = JSON.parse(localStorage.getItem('ws_task_statuses')) || [];
  if (WS.taskStatuses.length === 0) {
    WS.taskStatuses = _TS_DEFAULTS.slice();
    localStorage.setItem('ws_task_statuses', JSON.stringify(WS.taskStatuses));
  }
}
function _saveTaskStatuses() { localStorage.setItem('ws_task_statuses', JSON.stringify(WS.taskStatuses)); }
function openTaskStatusModal(editId) {
  _initTaskStatuses();
  var m = document.getElementById('taskStatusModal'); if (!m) return;
  var quickPick = document.getElementById('tsIconQuickPick');
  if (quickPick) {
    quickPick.innerHTML = _TS_ICONS.map(function(ic) {
      return '<span onclick="(function(){document.getElementById(\'tsModalIcon\').value=\''+ic.icon+'\';previewTaskStatusIcon();})()" title="'+ic.label+'" '+
        'style="display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:7px;border:1.5px solid var(--border-color);cursor:pointer;background:var(--bg-tertiary);transition:all .15s" '+
        'onmouseover="this.style.borderColor=\'var(--accent-blue)\';this.style.background=\'rgba(79,110,247,.1)\'" '+
        'onmouseout="this.style.borderColor=\'var(--border-color)\';this.style.background=\'var(--bg-tertiary)\'">'
        +'<i data-lucide="'+ic.icon+'" style="width:14px;height:14px;color:var(--text-secondary)"></i></span>';
    }).join('');
    setTimeout(refreshIcons, 30);
  }
  if (editId) {
    _tsCtx = {mode:'edit',id:editId};
    var item = WS.taskStatuses.find(function(x){return x.id===editId;});
    if (item) {
      document.getElementById('tsModalName').value = item.name||'';
      document.getElementById('tsModalIcon').value = item.icon||'';
      document.getElementById('tsModalColor').value = item.color||'#06b6d4';
      document.getElementById('tsModalColorPicker').value = item.color||'#06b6d4';
    }
    document.getElementById('taskStatusModalTitle').textContent = '진행상태 수정';
  } else {
    _tsCtx = {mode:'add',id:null};
    document.getElementById('tsModalName').value = '';
    document.getElementById('tsModalIcon').value = '';
    document.getElementById('tsModalColor').value = '#06b6d4';
    document.getElementById('tsModalColorPicker').value = '#06b6d4';
    document.getElementById('taskStatusModalTitle').textContent = '진행상태 추가';
  }
  previewTaskStatusIcon();
  m.style.display = 'flex';
  setTimeout(function(){var el=document.getElementById('tsModalName');if(el)el.focus();},50);
}
function previewTaskStatusIcon() {
  var icon = (document.getElementById('tsModalIcon')||{}).value||'activity';
  var color = (document.getElementById('tsModalColor')||{}).value||'#06b6d4';
  var name = (document.getElementById('tsModalName')||{}).value||'진행중';
  if (!color.startsWith('#')) color = '#06b6d4';
  var prev=document.getElementById('tsModalPreview');
  var prevIcon=document.getElementById('tsModalPreviewIcon');
  var prevName=document.getElementById('tsModalPreviewName');
  if (prev){prev.style.background=color+'22';prev.style.borderColor=color;prev.style.color=color;}
  if (prevIcon){prevIcon.style.background=color+'22';prevIcon.style.borderColor=color;prevIcon.innerHTML='<i data-lucide="'+icon+'" style="width:11px;height:11px;color:'+color+'"></i>';setTimeout(refreshIcons,20);}
  if (prevName) prevName.textContent=name||'진행중';
}
function saveTaskStatusItem() {
  var name=(document.getElementById('tsModalName')||{}).value;
  var icon=(document.getElementById('tsModalIcon')||{}).value;
  var color=(document.getElementById('tsModalColor')||{}).value;
  if (!name||!name.trim()){showToast('error','상태명을 입력하세요');return;}
  name=name.trim(); icon=icon?icon.trim():''; color=(color&&color.startsWith('#'))?color.trim():'#06b6d4';
  _initTaskStatuses();
  if (_tsCtx.mode==='add') {
    WS.taskStatuses.push({id:Date.now(),name:name,icon:icon,color:color});
    showToast('success',name+' 추가 완료!');
  } else {
    var item=WS.taskStatuses.find(function(x){return x.id===_tsCtx.id;});
    if (item){item.name=name;item.icon=icon;item.color=color;}
    showToast('info','진행상태 수정 완료!');
  }
  _saveTaskStatuses();
  closeTaskStatusModal();
  renderPage_RankMgmt();
}
function deleteTaskStatus(id) {
  _initTaskStatuses();
  WS.taskStatuses=WS.taskStatuses.filter(function(x){return x.id!==id;});
  _saveTaskStatuses();
  showToast('info','삭제되었습니다.');
  renderPage_RankMgmt();
}
function closeTaskStatusModal() { var m=document.getElementById('taskStatusModal');if(m)m.style.display='none'; }

/* ══════════════════════════════════════════════
   openTaskDetail – 두 번째 스크린샷 스타일 완전 오버라이드
   (계획한 스케쥴 업무 / 내가 지시한 리스트 / 오늘이 시한인 업무 공통 사용)
══════════════════════════════════════════════ */
function openTaskDetail(taskId) {
  var t = WS.getTask(taskId);
  if (!t) { showToast('error', '업무 정보를 찾을 수 없습니다.'); return; }

  var ids      = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
  var assigner = WS.getUser(t.assignerId);
  var dd       = WS.getDdayBadge(t.dueDate);
  var progress = t.progress || 0;
  var fillCls  = t.status === 'delay' ? 'delay' : t.status === 'done' ? 'done' : '';

  /* 헤더 */
  var titleEl = document.getElementById('tdModalTitle');
  if (titleEl) {
    titleEl.innerHTML =
      '<span style="font-size:18px;font-weight:800;color:var(--text-primary)">' + t.title + '</span>' +
      '<span style="font-size:13px;font-weight:700;background:var(--accent-blue);color:#fff;' +
      'border-radius:20px;padding:2px 12px;vertical-align:middle;margin-left:8px">' + progress + '%</span>';
  }

  /* 날짜 포맷 */
  function fmtDate(d) {
    if (!d) return '-';
    var p = String(d).split('T')[0].split('-');
    return p.length === 3 ? p[0] + '. ' + parseInt(p[1]) + '. ' + parseInt(p[2]) + '.' : d;
  }

  /* 상태 배지 */
  var statusBadge = typeof _renderStatusBadge === 'function' ? _renderStatusBadge(t.status) : '';

  /* 중요도 배지 */
  var importanceBadges = '';
  try {
    var allImportances = JSON.parse(localStorage.getItem('ws_instr_importances') || '[]');
    var instrList      = JSON.parse(localStorage.getItem('ws_instructions') || '[]');
    var instrRecord    = instrList.find(function(i){ return i.id === t.id || i.id === Number(t.id); });
    var impStr         = (instrRecord && instrRecord.importance) ? instrRecord.importance : (t.importance || '');
    var impNames       = impStr ? impStr.split(',').map(function(s){ return s.trim(); }).filter(Boolean) : [];
    importanceBadges = impNames.map(function(name) {
      var imp = allImportances.find(function(i){ return i.name === name; });
      var c   = imp ? (imp.color || '#ef4444') : '#9ca3af';
      var ico = imp ? imp.icon : '';
      var hasIco = ico && ico.length > 2;
      var inner  = hasIco
        ? '<i data-lucide="' + ico + '" style="width:13px;height:13px;color:' + c + '"></i>'
        : '<span style="width:8px;height:8px;border-radius:50%;background:' + c + ';display:inline-block"></span>';
      return '<span title="' + name + '" style="display:inline-flex;align-items:center;justify-content:center;' +
        'width:26px;height:26px;border-radius:50%;background:' + c + '18;border:1.5px solid ' + c + ';cursor:default">' +
        inner + '</span>';
    }).join('');
  } catch(e) {}

  /* 바디 HTML */
  var bodyHTML =
    /* 지시자 & 업무명 카드 */
    '<div style="background:var(--bg-tertiary);border:1px solid var(--border-color);' +
    'border-radius:14px;padding:16px;margin-bottom:18px">' +

      '<div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:14px">' +
        '<div>' +
          '<div style="font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;' +
          'margin-bottom:5px;letter-spacing:.5px">지시자 및 업무명</div>' +
          '<div style="font-size:15px;font-weight:800;color:var(--accent-blue)">' +
            (assigner ? assigner.name : (t.isSchedule ? '본인' : '-')) +
            ' <span style="color:var(--text-muted);font-weight:400">→</span> ' +
            '<span style="color:var(--text-primary)">' + t.title + '</span>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">' +
          statusBadge +
          importanceBadges +
          '<span class="dday-badge ' + dd.cls + '">' + dd.label + '</span>' +
        '</div>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px">' +
        '<div style="background:var(--bg-secondary);border-radius:10px;padding:10px 12px">' +
          '<div style="font-size:10px;color:var(--text-muted);font-weight:600;margin-bottom:4px">지시일</div>' +
          '<div style="font-size:13px;font-weight:700;color:var(--text-primary)">' + fmtDate(t.startDate || t.startedAt) + '</div>' +
        '</div>' +
        '<div style="background:var(--bg-secondary);border-radius:10px;padding:10px 12px">' +
          '<div style="font-size:10px;color:var(--text-muted);font-weight:600;margin-bottom:4px">마감일</div>' +
          '<div style="font-size:13px;font-weight:700;color:var(--text-primary)">' + fmtDate(t.dueDate) + '</div>' +
        '</div>' +
        '<div style="background:var(--bg-secondary);border-radius:10px;padding:10px 12px">' +
          '<div style="font-size:10px;color:var(--text-muted);font-weight:600;margin-bottom:4px">진행율</div>' +
          '<div style="display:flex;align-items:center;gap:6px;margin-top:4px">' +
            '<div class="progress-bar" style="flex:1;height:5px">' +
              (function() {
                var types = JSON.parse(localStorage.getItem('ws_task_results')) || (WS.taskResults || []);
                var accent = 'var(--accent-blue)';
                return types.map(function(t) {
                  var tName = t.label || t.name || '';
                  var addedCount = (window._processOrder || []).filter(function(n){ return n === tName; }).length;
                  var tColor = t.color || accent;
                  var iconHtml = t.icon
                    ? '<span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:' + tColor + '22;border:1px solid ' + tColor + '"><i data-lucide="' + t.icon + '" style="width:10px;height:10px;color:' + tColor + '"></i></span>'
                    : '';
                  return '<span onclick="addProcessOrder(\'' + tName.replace(/'/g, "\\'") + '\')"' +
                    ' style="display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:20px;cursor:pointer;user-select:none;' +
                    'border:2px solid ' + tColor + ';' +
                    'background:color-mix(in srgb,' + tColor + ' 10%,var(--bg-primary));' +
                    'transition:all 0.15s"' +
                    ' onmouseover="this.style.opacity=\'0.75\'" onmouseout="this.style.opacity=\'1\'">' +
                    iconHtml +
                    '<span style="font-size:12px;font-weight:600;color:var(--text-primary)">' + tName + '</span>' +
                    (addedCount > 0 ? '<span style="font-size:9px;font-weight:700;color:#fff;background:' + tColor + ';border-radius:8px;padding:1px 5px;min-width:14px;text-align:center">' + addedCount + '</span>' : '') +
                    '</span>';
                }).join('');
              })() +
              '<div class="progress-fill ' + fillCls + '" style="width:' + progress + '%"></div>' +
            '</div>' +
            '<span style="font-size:12px;font-weight:800;color:var(--accent-blue)">' + progress + '%</span>' +
          '</div>' +
        '</div>' +
        '<div style="background:var(--bg-secondary);border-radius:10px;padding:10px 12px">' +
          '<div style="font-size:10px;color:var(--text-muted);font-weight:600;margin-bottom:4px">보고내용</div>' +
          '<div style="font-size:12px;font-weight:700;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (t.reportContent || '-') + '</div>' +
        '</div>' +
      '</div>' +

      '<div style="border-top:1px solid var(--border-color);padding-top:12px">' +
        '<label class="form-label" style="display:flex;align-items:center;gap:6px;margin-bottom:6px">' +
          '<i data-lucide="file-text" style="width:12px;height:12px"></i> 지시내용' +
        '</label>' +
        '<textarea class="form-input" id="td_desc" rows="3" style="resize:vertical;font-size:13px;width:100%">' + (t.desc || '') + '</textarea>' +
      '</div>' +
    '</div>' +

    /* 진행율 설정 */
    '<div style="margin-bottom:18px">' +
      '<div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;' +
      'margin-bottom:10px;display:flex;align-items:center;gap:6px">' +
        '<i data-lucide="sliders-horizontal" style="width:13px;height:13px"></i> 진행율 설정' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:12px">' +
        '<input type="range" min="' + progress + '" max="100" value="' + progress + '" id="progressSlider_' + t.id + '" ' +
        'style="flex:1;accent-color:var(--accent-blue)" ' +
        'oninput="var _min=parseInt(this.min);if(parseInt(this.value)<_min)this.value=_min;' +
        'document.getElementById(\'progVal_' + t.id + '\').textContent=this.value+\'%\';' +
        'document.getElementById(\'progBar_live_' + t.id + '\').style.width=this.value+\'%\'">' +
        '<span id="progVal_' + t.id + '" style="font-size:15px;font-weight:800;color:var(--accent-blue);min-width:42px;text-align:right">' + progress + '%</span>' +
      '</div>' +
      '<div class="progress-bar" style="margin-top:8px;height:8px;border-radius:6px">' +
        '<div class="progress-fill ' + fillCls + '" id="progBar_live_' + t.id + '" style="width:' + progress + '%;border-radius:6px"></div>' +
      '</div>' +
    '</div>' +

    '<input type="hidden" id="td_report" value="' + (t.reportContent || '') + '">' +
    '<input type="hidden" id="td_score"  value="' + (t.score || 0) + '">' +
    '<input type="hidden" id="td_title"  value="' + t.title + '">' +

    /* 히스토리 */
    '<div style="border-top:1px solid var(--border-color);padding-top:14px" id="historySection_' + t.id + '">' +
      '<button class="btn" style="width:100%;justify-content:space-between;background:var(--bg-tertiary);' +
      'border:none;font-size:12px;font-weight:700;height:36px" ' +
      'onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display===\'none\'?\'block\':\'none\';' +
      'this.querySelector(\'.chev\').textContent=this.nextElementSibling.style.display===\'none\'?\'▼\':\'▲\'">' +
        '<span style="display:flex;align-items:center;gap:6px">' +
          '<i data-lucide="history" style="width:14px;height:14px"></i> 업무 히스토리' +
          '<span id="historyCount_' + t.id + '" style="font-size:10px;background:var(--bg-card);border-radius:8px;padding:1px 7px;color:var(--text-muted)">' + ((t.history || []).length) + '건</span>' +
        '</span>' +
        '<span class="chev">▲</span>' +
      '</button>' +
      '<div id="historyList_' + t.id + '" style="display:block;margin-top:8px">' +
        '<div class="history-timeline" id="historyTimeline_' + t.id + '">' +
          (t.history && t.history.length
            ? [].concat(t.history).reverse().map(function(h) {
                return '<div class="timeline-item">' +
                  '<div class="timeline-dot" style="background:' + h.color + '22;border-color:' + h.color + '">' +
                    '<i data-lucide="' + h.icon + '"></i>' +
                  '</div>' +
                  '<div class="timeline-content">' +
                    '<div class="t-date">' + h.date + '</div>' +
                    '<div class="t-text">' + h.event + '</div>' +
                    '<div class="t-sub">' + h.detail + '</div>' +
                  '</div>' +
                '</div>';
              }).join('')
            : '<div style="text-align:center;padding:16px;color:var(--text-muted);font-size:12px">히스토리가 없습니다</div>') +
        '</div>' +
      '</div>' +
    '</div>';

  var bodyEl = document.getElementById('tdModalBody');
  if (bodyEl) bodyEl.innerHTML = bodyHTML;

  /* 진행보고 추가 칩 */
  var chipWrap = document.getElementById('tdReportTypePicks');
  if (chipWrap) {
    var rtList = [];
    try { rtList = JSON.parse(localStorage.getItem('ws_report_types') || '[]'); } catch(e) {}
    if (!rtList.length) rtList = (WS.reportTypes || []);
    if (!rtList.length) rtList = [
      {icon:'play-circle',   label:'업무시작',  color:'#4f6ef7'},
      {icon:'search',        label:'시장조사',  color:'#06b6d4'},
      {icon:'check-circle',  label:'작업완료',  color:'#22c55e'},
      {icon:'message-circle',label:'협의완료',  color:'#f59e0b'},
      {icon:'file-text',     label:'보고서작성',color:'#8b5cf6'},
      {icon:'clipboard-list',label:'중간보고',  color:'#9747ff'},
    ];
    chipWrap.innerHTML = rtList.map(function(rt) {
      var ico = rt.icon || 'check';
      var lbl = rt.label || rt.name || '보고';
      var col = rt.color || '#4f6ef7';
      var val = ico + '|' + lbl + '|' + col;
      return '<button onclick="(function(el,v){'
        + 'document.getElementById(\'tdReportTypePicks\').querySelectorAll(\'button\').forEach(function(b){'
        + 'b.style.background=\'var(--bg-tertiary)\';b.style.color=\'var(--text-muted)\';b.style.borderColor=\'var(--border-color)\';});'
        + 'el.style.background=\'' + col + '22\';el.style.color=\'' + col + '\';el.style.borderColor=\'' + col + '\';'
        + 'document.getElementById(\'td_reportIconVal\').value=v;'
        + '})(this,\'' + val.replace(/'/g,"\\'") + '\')" '
        + 'style="display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border-radius:20px;'
        + 'border:1.5px solid var(--border-color);background:var(--bg-tertiary);cursor:pointer;'
        + 'font-size:11.5px;font-weight:600;color:var(--text-muted);transition:all .15s;white-space:nowrap">'
        + '<i data-lucide="' + ico + '" style="width:12px;height:12px"></i>' + lbl + '</button>';
    }).join('');
  }

  window._editingTaskId = taskId;

  /* 모달 열기 */
  var modal = document.getElementById('taskDetailModal');
  if (modal) modal.style.display = 'flex';

  if (typeof refreshIcons === 'function') refreshIcons();
}

/* 샘플 업무 클릭 시 읽기전용 미리보기 팝업 */
function _openSampleDetail(title, status, progress, dueDate, team) {
  var tempId = 'sample_preview';
  // 샘플 가상 task 객체 생성
  var fakTask = {
    id: tempId,
    title: title,
    status: status,
    progress: progress || 0,
    dueDate: dueDate,
    team: team || '',
    desc: '(샘플 데이터입니다. 실제 업무를 등록하면 이 팝업이 정상 작동합니다.)',
    history: [],
    reportContent: '-',
    isSchedule: true,
    _isSample: true
  };
  // 임시로 WS.tasks에 추가 (없으면)
  if (!WS.tasks.find(function(t){ return t.id === tempId; })) {
    WS.tasks.push(fakTask);
  } else {
    WS.tasks = WS.tasks.map(function(t){ return t.id === tempId ? fakTask : t; });
  }
  openTaskDetail(tempId);
}

/* _openSampleDetail 인덱스 기반 버전으로 교체 */
function _openSampleDetail(idx) {
  var dataArr = window._schedSampleData;
  var t = dataArr && dataArr[idx];
  if (!t) { showToast('warning', '샘플 데이터를 불러올 수 없습니다.'); return; }
  var tempId = 'sample_preview_' + idx;
  var fakTask = {
    id: tempId,
    title: t.title,
    status: t.status,
    progress: t.progress || 0,
    dueDate: t.dueDate,
    team: t.team || '',
    desc: '(샘플 데이터입니다. 실제 업무를 등록하면 이 팝업이 정상 작동합니다.)',
    history: [],
    reportContent: '-',
    isSchedule: true,   // 스케쥴 업무 → 지시자 "본인"으로 표시
    _isSample: true
  };
  WS.tasks = WS.tasks.filter(function(x){ return String(x.id).indexOf('sample_preview') !== 0; });
  WS.tasks.push(fakTask);
  // 내가 지시받은 업무와 동일한 상세 팝업 UI 사용
  openReceivedTaskDetail(tempId);
}

/* ══════════════════════════════════════════════
   내 스케줄 추가 모달 - 첨부파일 처리 함수
   (지시사항 등록의 _onInstrFileChange와 동일한 방식)
══════════════════════════════════════════════ */
function _onNtFileChange(input) {
  if (!window._ntAttachFiles) window._ntAttachFiles = [];
  Array.from(input.files).forEach(function(f) {
    var dup = window._ntAttachFiles.some(function(ef) { return ef.name === f.name && ef.size === f.size; });
    if (!dup) window._ntAttachFiles.push(f);
  });
  input.value = '';
  _renderNtFileList();
}

function _renderNtFileList() {
  var listEl = document.getElementById('nt_attach_file_list');
  if (!listEl) return;
  if (!window._ntAttachFiles) window._ntAttachFiles = [];
  listEl.innerHTML = window._ntAttachFiles.map(function(f, i) {
    return '<span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;' +
      'background:rgba(79,110,247,.08);border:1px solid rgba(79,110,247,.3);' +
      'font-size:11.5px;color:var(--text-primary)">' +
      '<i data-lucide="file-plus" style="width:11px;height:11px;color:var(--accent-blue)"></i>' +
      '<span style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + f.name + '</span>' +
      '<button onclick="_removeNtFile(' + i + ')" title="삭제" ' +
      'style="background:none;border:none;cursor:pointer;padding:0;margin-left:2px;' +
      'display:inline-flex;align-items:center;color:var(--text-muted);transition:color .15s" ' +
      'onmouseover="this.style.color=\'#ef4444\'" onmouseout="this.style.color=\'var(--text-muted)\'">' +
      '<i data-lucide="x" style="width:11px;height:11px"></i>' +
      '</button></span>';
  }).join('');
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 30);
}

function _removeNtFile(idx) {
  if (!window._ntAttachFiles) return;
  window._ntAttachFiles.splice(idx, 1);
  _renderNtFileList();
}

/* ══════════════════════════════════════════════
   내 스케줄 추가 모달 - 업무결과 칩 렌더링
   (지시사항 등록UI의 instrReportPicks와 동일한 단일선택 칩 방식)
══════════════════════════════════════════════ */
function _renderNtResultPicks(currentValue) {
  var picksEl = document.getElementById('nt_result_picks');
  if (!picksEl) return;
  var results = JSON.parse(localStorage.getItem('ws_task_results')) || (WS.taskResults || []);
  if (currentValue !== undefined) window._ntSelectedResult = currentValue;
  if (!window._ntSelectedResult) window._ntSelectedResult = '';

  if (!results.length) {
    picksEl.innerHTML = '<span style="font-size:12px;color:var(--text-muted)">기타설정 > 업무결과에서 항목을 추가하세요</span>';
    return;
  }

  picksEl.innerHTML = results.map(function(r) {
    var c = r.color || '#6b7280';
    var hasLucide = r.icon && r.icon.length > 2;
    var iconHtml = hasLucide
      ? '<i data-lucide="' + r.icon + '" style="width:11px;height:11px;color:' + c + '"></i>'
      : (r.icon ? '<span>' + r.icon + '</span>' : '');
    var isSelected = (window._ntSelectedResult === r.name);
    var bgStyle = isSelected ? 'background:' + c + '22;' : 'background:transparent;';
    return '<span onclick="_selectNtResult(\'' + r.name.replace(/\'/g, "\\'") + '\',this)"' +
      ' data-result="' + r.name + '"' +
      (isSelected ? ' class="selected"' : '') +
      ' style="display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;' +
      'font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;user-select:none;' +
      'border:1.5px solid ' + c + ';color:' + c + ';' + bgStyle + '"' +
      ' onmouseover="if(!this.classList.contains(\'selected\'))this.style.background=\'' + c + '22\'"' +
      ' onmouseout="if(!this.classList.contains(\'selected\'))this.style.background=\'transparent\'">' +
      iconHtml + r.name + '</span>';
  }).join('');

  var hiddenEl = document.getElementById('nt_result');
  if (hiddenEl) hiddenEl.value = window._ntSelectedResult || '';

  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 30);
}

function _selectNtResult(name) {
  if (window._ntSelectedResult === name) {
    window._ntSelectedResult = '';
  } else {
    window._ntSelectedResult = name;
  }
  var hiddenEl = document.getElementById('nt_result');
  if (hiddenEl) hiddenEl.value = window._ntSelectedResult || '';
  _renderNtResultPicks();
}

/* ══════════════════════════════════════════════
   openNewTaskModal 최종 래핑:
   업무결과 칩 + 첨부파일 초기화 추가
   (진행보고 순서 UI 초기화는 위의 래핑에서 이미 처리)
══════════════════════════════════════════════ */
(function() {
  var _prevNt2 = typeof window.openNewTaskModal === 'function' ? window.openNewTaskModal : null;
  if (!_prevNt2) return;
  window.openNewTaskModal = function(mode, parentId, assigneeId) {
    _prevNt2.call(window, mode, parentId, assigneeId);
    if (mode === 'edit' || mode === 'schedule') return;
    setTimeout(function() {
      // 업무결과 칩 UI 초기화
      window._ntSelectedResult = '';
      if (typeof _renderNtResultPicks === 'function') _renderNtResultPicks('');
      // 첨부파일 목록 초기화
      window._ntAttachFiles = [];
      var ntfl = document.getElementById('nt_attach_file_list');
      if (ntfl) ntfl.innerHTML = '';
    }, 20);
  };
})();

/* ══════════════════════════════════════════════
   진행순서 목록에서 클릭(단일 클릭)으로도 추가 가능하도록
   _renderProcessTypeList 재정의
   (지시사항 보고절차와 동일한 클릭 방식)
══════════════════════════════════════════════ */
(function() {
  var _origRenderTypeList = typeof _renderProcessTypeList === 'function' ? _renderProcessTypeList : null;
  window._renderProcessTypeList = function() {
    var list = document.getElementById('nt_process_type_list');
    if (!list) return;
    var types = JSON.parse(localStorage.getItem('ws_report_types')) || (WS.reportTypes || []);
    WS.reportTypes = types;
    if (!types.length) {
      list.innerHTML = '<div style="padding:12px;text-align:center;font-size:11px;color:var(--text-muted)">등록된 진행보고 유형이 없습니다.<br><span style="font-size:10px">(본사관리 → 기타설정에서 추가)</span></div>';
      return;
    }
    var accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#4f6ef7';
    list.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;padding:8px 10px;background:var(--bg-secondary);border:1.5px solid var(--border-color);border-radius:10px;min-height:44px;';
    list.innerHTML = types.map(function(t) {
      var tName = t.label || t.name || '';
      var alreadyAdded = (window._processOrder || []).indexOf(tName) !== -1;
      var tColor = t.color || accent;
      var iconHtml = t.icon
        ? '<span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:' + tColor + '22;border:1px solid ' + tColor + '"><i data-lucide="' + t.icon + '" style="width:10px;height:10px;color:' + tColor + '"></i></span>'
        : '';
      return '<span onclick="addProcessOrder(\'' + tName.replace(/'/g, "\\'") + '\')"' +
        ' style="display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:20px;cursor:pointer;user-select:none;' +
        'border:2px solid ' + (alreadyAdded ? tColor : 'var(--border-color)') + ';' +
        'background:' + (alreadyAdded ? 'color-mix(in srgb,' + tColor + ' 15%,var(--bg-primary))' : 'var(--bg-primary)') + ';' +
        'transition:all 0.15s;opacity:' + (alreadyAdded ? '0.5' : '1') + '">' +
        iconHtml +
        '<span style="font-size:12px;font-weight:600;color:var(--text-primary)">' + tName + '</span>' +
        (alreadyAdded ? '<span style="font-size:9px;color:var(--text-muted)">✓</span>' : '') +
        '</span>';
    }).join('');
    if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 0);
  };
})();

/* ══════════════════════════════════════════════
   _renderProcessTypeList 최종 재정의
   - 중복 허용: 같은 항목 여러 번 추가 가능
   - 추가 횟수 배지로 표시
══════════════════════════════════════════════ */
(function() {
  window._renderProcessTypeList = function() {
    var list = document.getElementById('nt_process_type_list');
    if (!list) return;
    var types = JSON.parse(localStorage.getItem('ws_report_types')) || (WS.reportTypes || []);
    WS.reportTypes = types;
    if (!types.length) {
      list.innerHTML = '<div style="padding:12px;text-align:center;font-size:11px;color:var(--text-muted)">등록된 진행보고 유형이 없습니다.<br><span style="font-size:10px">(본사관리 → 기타설정에서 추가)</span></div>';
      return;
    }
    var accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#4f6ef7';
    list.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;padding:8px 10px;background:var(--bg-secondary);border:1.5px solid var(--border-color);border-radius:10px;min-height:44px;';
    list.innerHTML = types.map(function(t) {
      var tName = t.label || t.name || '';
      var addedCount = (window._processOrder || []).filter(function(n){ return n === tName; }).length;
      var tColor = t.color || accent;
      var iconHtml = t.icon
        ? '<span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:' + tColor + '22;border:1px solid ' + tColor + '"><i data-lucide="' + t.icon + '" style="width:10px;height:10px;color:' + tColor + '"></i></span>'
        : '';
      return '<span onclick="addProcessOrder(\'' + tName.replace(/'/g, "\\'") + '\')"' +
        ' style="display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:20px;cursor:pointer;user-select:none;' +
        'border:2px solid ' + tColor + ';' +
        'background:color-mix(in srgb,' + tColor + ' 10%,var(--bg-primary));' +
        'transition:all 0.15s"' +
        ' onmouseover="this.style.opacity=\'0.75\'" onmouseout="this.style.opacity=\'1\'">' +
        iconHtml +
        '<span style="font-size:12px;font-weight:600;color:var(--text-primary)">' + tName + '</span>' +
        (addedCount > 0 ? '<span style="font-size:9px;font-weight:700;color:#fff;background:' + tColor + ';border-radius:8px;padding:1px 5px;min-width:14px;text-align:center">' + addedCount + '</span>' : '') +
        '</span>';
    }).join('');
    if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 0);
  };
})();



/* ══════════════════════════════════════════════
   schedule 전용 모달 헬퍼 함수들
══════════════════════════════════════════════ */

function _resetScheduleFields() {
  var sf = document.getElementById('nt_schedule_fields');
  var nf = document.getElementById('nt_normal_fields');
  var tc = document.getElementById('nt_row_teams_check');
  var fa = document.getElementById('nt_fg_attach');
  var fd = document.getElementById('nt_fg_detail');
  if (sf) sf.style.display = 'none';
  if (nf) nf.style.display = '';
  if (tc) tc.style.display = '';
  if (fa) fa.style.display = '';
  if (fd) fd.style.display = '';
  // 업무성격 초기화 (기본값: 일일업무)
  var natureHidden = document.getElementById('nt_sched_nature');
  if (natureHidden) natureHidden.value = '일일업무';
  if (typeof _selectNtNature === 'function') _selectNtNature('일일업무');
  // 시작일 초기화
  var ss = document.getElementById('nt_sched_start');
  var sl = document.getElementById('nt_sched_start_label');
  if (ss) ss.value = '';
  if (sl) sl.textContent = '날짜를 선택하세요';
  // 완료계획일 초기화
  var ds = document.getElementById('nt_sched_due');
  var dl = document.getElementById('nt_sched_due_label');
  if (ds) ds.value = '';
  if (dl) dl.textContent = '날짜를 선택하세요';
}

function _renderNtSchedImportance() {
  var box = document.getElementById('nt_sched_importance_picks');
  if (!box) return;
  var imps = JSON.parse(localStorage.getItem('ws_instr_importances') || '[]');
  if (!imps.length) {
    box.innerHTML = '<span style="font-size:11px;color:var(--text-muted);white-space:nowrap">기타설정에서 중요도를 추가하세요</span>';
    return;
  }

  // 선택 순서 배열 (window._ntSchedImps 에 보존)
  var selected = window._ntSchedImps || [];

  // 선택된 항목(순서 유지): 앞에, 아이콘만 채워진 원형
  var selItems   = selected.map(function(name) {
    return imps.find(function(i){ return i.name === name; });
  }).filter(Boolean);

  // 미선택 항목 (기타설정 순서 유지)
  var unselItems = imps.filter(function(i){ return selected.indexOf(i.name) === -1; });

  var selHtml = selItems.map(function(imp) {
    var c = imp.color || '#ef4444';
    var hasIcon = imp.icon && imp.icon.length > 2;
    var inner = hasIcon
      ? '<i data-lucide="' + imp.icon + '" style="width:12px;height:12px;color:#fff"></i>'
      : '<span style="width:8px;height:8px;border-radius:50%;background:#fff;display:inline-block"></span>';
    return '<span onclick="_toggleNtSchedImp(\'' + imp.name.replace(/'/g,"\\'") + '\')" title="' + imp.name + ' (클릭하여 취소)"'
      + ' style="display:inline-flex;align-items:center;justify-content:center;'
      + 'width:28px;height:28px;border-radius:50%;flex-shrink:0;'
      + 'background:' + c + ';border:2px solid ' + c + ';cursor:pointer;'
      + 'transition:all .15s;box-shadow:0 2px 8px ' + c + '55">'
      + inner + '</span>';
  }).join('');

  var unselHtml = unselItems.map(function(imp) {
    var c = imp.color || '#ef4444';
    var hasIcon = imp.icon && imp.icon.length > 2;
    var iconHtml = hasIcon
      ? '<i data-lucide="' + imp.icon + '" style="width:10px;height:10px;color:' + c + '"></i>'
      : '';
    return '<span onclick="_toggleNtSchedImp(\'' + imp.name.replace(/'/g,"\\'") + '\')" title="' + imp.name + '"'
      + ' style="display:inline-flex;align-items:center;gap:4px;padding:3px 9px;'
      + 'border-radius:20px;font-size:11px;font-weight:600;cursor:pointer;'
      + 'transition:all .15s;user-select:none;flex-shrink:0;white-space:nowrap;'
      + 'border:1.5px solid ' + c + ';color:' + c + ';background:transparent"'
      + ' onmouseover="this.style.background=\'' + c + '22\'"'
      + ' onmouseout="this.style.background=\'transparent\'">'
      + iconHtml + imp.name + '</span>';
  }).join('');

  var divider = (selHtml && unselHtml)
    ? '<span style="width:1px;height:24px;background:var(--border-color);flex-shrink:0;margin:0 3px"></span>'
    : '';

  box.innerHTML = selHtml + divider + unselHtml;

  // hidden input 동기화
  var hidden = document.getElementById('nt_sched_importance');
  if (hidden) hidden.value = selected.join(',');

  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 30);
}

function _toggleNtSchedImp(name) {
  if (!window._ntSchedImps) window._ntSchedImps = [];
  var idx = window._ntSchedImps.indexOf(name);
  if (idx !== -1) {
    window._ntSchedImps.splice(idx, 1); // 취소 → 뒤로
  } else {
    window._ntSchedImps.push(name);     // 선택 → 앞으로(순서 유지)
  }
  _renderNtSchedImportance();
}


function _renderNtSchedStatus() {
  var box = document.getElementById('nt_sched_status_picks');
  if (!box) return;
  var statuses = JSON.parse(localStorage.getItem('ws_task_statuses') || '[]');
  if (!statuses.length) {
    statuses = [
      {id:'waiting',  name:'대기',   icon:'clock',        color:'#6b7280'},
      {id:'progress', name:'진행',   icon:'trending-up',  color:'#4f6ef7'},
      {id:'done',     name:'완료',   icon:'check-circle', color:'#22c55e'},
      {id:'delay',    name:'지연',   icon:'alert-circle', color:'#ef4444'}
    ];
  }
  var selected = document.getElementById('nt_sched_status') ? document.getElementById('nt_sched_status').value : '';
  if (!selected) { selected = 'waiting'; document.getElementById('nt_sched_status').value = 'waiting'; }
  box.innerHTML = statuses.map(function(s) {
    var c = s.color || '#4f6ef7';
    var id = s.id || s.name;
    var isOn = (selected === id);
    var hasIcon = s.icon && s.icon.length > 2;
    var inner = hasIcon ? '<i data-lucide="' + s.icon + '" style="width:11px;height:11px"></i>' : '';
    return '<span onclick="_selectNtSchedStatus(this,\'' + id + '\')"'
      + ' style="display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;cursor:pointer;font-size:11.5px;font-weight:700;border:1.5px solid ' + c + ';'
      + (isOn ? 'background:' + c + ';color:#fff' : 'background:' + c + '18;color:' + c) + ';transition:all .2s">'
      + inner + s.name + '</span>';
  }).join('');
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 0);
}

function _selectNtSchedStatus(el, val) {
  var hidden = document.getElementById('nt_sched_status');
  if (hidden) hidden.value = val;
  _renderNtSchedStatus();
}

function _renderNtSchedCollabBox() {
  var box = document.getElementById('nt_sched_collab_box');
  if (!box) return;
  var ph = document.getElementById('nt_sched_collab_placeholder');
  var ids = window._ntSchedCollabIds || [];
  Array.from(box.children).forEach(function(c){ if (c !== ph) c.remove(); });
  if (!ids.length) { if (ph) ph.style.display = ''; return; }
  if (ph) ph.style.display = 'none';
  ids.forEach(function(uid) {
    var u = WS.getUser(uid);
    if (!u) return;
    var chip = document.createElement('span');
    chip.style.cssText = 'display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;background:' + (u.color||'#4f6ef7') + '22;border:1.5px solid ' + (u.color||'#4f6ef7') + ';font-size:12px;font-weight:700;color:' + (u.color||'#4f6ef7');
    chip.innerHTML = (u.avatar||'?') + ' ' + u.name + ' <span onclick="event.stopPropagation();_removeNtSchedCollab(' + uid + ')" style="cursor:pointer;margin-left:3px;opacity:.7">×</span>';
    box.insertBefore(chip, ph || null);
  });
}

function _removeNtSchedCollab(uid) {
  window._ntSchedCollabIds = (window._ntSchedCollabIds || []).filter(function(i){ return i !== uid; });
  _renderNtSchedCollabBox();
}

function _openNtSchedCollabPopup() {
  var popup = document.getElementById('nt_sched_collab_popup');
  if (!popup) return;
  var box = document.getElementById('nt_sched_collab_box');
  var rect = box.getBoundingClientRect();
  popup.style.top  = (rect.bottom + 4) + 'px';
  popup.style.left = rect.left + 'px';
  popup.style.display = 'flex';
  _filterNtSchedCollab('');
  setTimeout(function(){
    document.addEventListener('mousedown', function _closeP(e){
      if (!popup.contains(e.target) && e.target !== box) {
        popup.style.display = 'none';
        document.removeEventListener('mousedown', _closeP);
      }
    });
  }, 10);
}

function _filterNtSchedCollab(q) {
  var list = document.getElementById('nt_sched_collab_list');
  if (!list) return;
  var users = (WS.users || []).filter(function(u){ return !(WS.currentUser && u.id === WS.currentUser.id); });
  q = (q || '').trim();
  if (q) users = users.filter(function(u){ return u.name.indexOf(q) !== -1 || (u.dept||'').indexOf(q) !== -1; });
  list.innerHTML = users.map(function(u) {
    var ids = window._ntSchedCollabIds || [];
    var isOn = ids.indexOf(u.id) !== -1;
    return '<div onclick="_toggleNtSchedCollab(' + u.id + ')" style="display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:8px;cursor:pointer;background:' + (isOn ? (u.color||'#4f6ef7') + '18' : 'transparent') + '">'
      + '<span style="width:26px;height:26px;border-radius:50%;background:' + (u.color||'#4f6ef7') + ';display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#fff;flex-shrink:0">' + (u.avatar||'?') + '</span>'
      + '<div><div style="font-size:12.5px;font-weight:700;color:var(--text-primary)">' + u.name + '</div>'
      + '<div style="font-size:10.5px;color:var(--text-muted)">' + (u.dept||'') + '</div></div>'
      + (isOn ? '<span style="margin-left:auto;color:var(--accent-blue);font-size:13px">✓</span>' : '')
      + '</div>';
  }).join('') || '<div style="padding:10px;text-align:center;color:var(--text-muted);font-size:12px">검색 결과 없음</div>';
}

function _toggleNtSchedCollab(uid) {
  window._ntSchedCollabIds = window._ntSchedCollabIds || [];
  var idx = window._ntSchedCollabIds.indexOf(uid);
  if (idx === -1) window._ntSchedCollabIds.push(uid);
  else window._ntSchedCollabIds.splice(idx, 1);
  _renderNtSchedCollabBox();
  _filterNtSchedCollab(document.getElementById('nt_sched_collab_search') ? document.getElementById('nt_sched_collab_search').value : '');
}

function _onNtSchedFileChange(input) {
  window._ntSchedFiles = window._ntSchedFiles || [];
  Array.from(input.files).forEach(function(f){ window._ntSchedFiles.push(f); });
  var list = document.getElementById('nt_sched_file_list');
  if (!list) return;
  list.innerHTML = window._ntSchedFiles.map(function(f, i){
    return '<span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:8px;background:var(--bg-tertiary);border:1px solid var(--border-color);font-size:11.5px">'
      + '<i data-lucide="paperclip" style="width:11px;height:11px;opacity:.6"></i>' + f.name
      + ' <span onclick="_removeNtSchedFile(' + i + ')" style="cursor:pointer;opacity:.6">×</span></span>';
  }).join('');
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 0);
}

function _removeNtSchedFile(idx) {
  (window._ntSchedFiles || []).splice(idx, 1);
  var dummy = { files: [] };
  _onNtSchedFileChange(dummy);
  var list = document.getElementById('nt_sched_file_list');
  if (list) list.innerHTML = (window._ntSchedFiles || []).map(function(f, i){
    return '<span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:8px;background:var(--bg-tertiary);border:1px solid var(--border-color);font-size:11.5px">'
      + '<i data-lucide="paperclip" style="width:11px;height:11px;opacity:.6"></i>' + f.name
      + ' <span onclick="_removeNtSchedFile(' + i + ')" style="cursor:pointer;opacity:.6">×</span></span>';
  }).join('');
}

function createScheduleTask() {
  var title = (document.getElementById('nt_title') ? document.getElementById('nt_title').value.trim() : '');
  if (!title) { showToast('error', '업무명을 입력하세요'); return; }
  var due = document.getElementById('nt_sched_due') ? document.getElementById('nt_sched_due').value : '';
  if (!due) { showToast('error', '완료기한을 선택하세요'); return; }

  var today = new Date().toISOString().split('T')[0];
  var nt = {
    id:          Date.now(),
    title:       title,
    desc:        (document.getElementById('nt_sched_content') ? document.getElementById('nt_sched_content').value.trim() : ''),
    assignerId:  WS.currentUser ? WS.currentUser.id : 1,
    assigneeIds: (window._ntSchedCollabIds || []).slice(),
    status:      (document.getElementById('nt_sched_status') ? document.getElementById('nt_sched_status').value : '') || 'waiting',
    priority:    'medium',
    progress:    0,
    dueDate:     due,
    createdAt:   today,
    startedAt:   (document.getElementById('nt_sched_start') ? document.getElementById('nt_sched_start').value : '') || due,
    isSchedule:  true,
    taskNature:  (document.getElementById('nt_sched_nature') ? document.getElementById('nt_sched_nature').value : '일일업무'),
    importance:  (document.getElementById('nt_sched_importance') ? document.getElementById('nt_sched_importance').value : ''),
    attachments: (window._ntSchedFiles || []).map(function(f){ return f.name; }),
    team:        '',
    score:       0,
    spentTime:   '0h',
    parentId:    null,
    history: [{
      date:   today.replace(/-/g,'.'),
      event:  '업무 등록',
      detail: WS.currentUser ? WS.currentUser.name : '',
      icon:   'clipboard-list',
      color:  '#4f6ef7'
    }]
  };

  WS.tasks.push(nt);
  WS.saveTasks();

  _resetScheduleFields();
  closeModalDirect('newTaskModal');
  if (document.getElementById('nt_title')) document.getElementById('nt_title').value = '';
  renderDashboard();
  if (typeof renderPage_Tasks === 'function') renderPage_Tasks();
  showToast('success', '내가 추진하는 업무가 등록되었습니다.');
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 0);
}

/* ── nt_schedule 업무선택 팝업 ── */
/* ── 업무성격 버튼 토글 ── */
function _selectNtNature(val) {
  var hidden = document.getElementById('nt_sched_nature');
  if (hidden) hidden.value = val;
  var btnD = document.getElementById('nt_nature_btn_daily');
  var btnP = document.getElementById('nt_nature_btn_period');
  if (!btnD || !btnP) return;
  if (val === '일일업무') {
    btnD.style.cssText = 'display:inline-flex;align-items:center;gap:6px;padding:7px 16px;border-radius:20px;border:1.5px solid var(--accent-blue);background:var(--accent-blue);color:#fff;font-size:12px;font-weight:700;cursor:pointer;transition:all .15s';
    btnP.style.cssText = 'display:inline-flex;align-items:center;gap:6px;padding:7px 16px;border-radius:20px;border:1.5px solid var(--border-color);background:var(--bg-secondary);color:var(--text-secondary);font-size:12px;font-weight:700;cursor:pointer;transition:all .15s';
  } else {
    btnP.style.cssText = 'display:inline-flex;align-items:center;gap:6px;padding:7px 16px;border-radius:20px;border:1.5px solid var(--accent-blue);background:var(--accent-blue);color:#fff;font-size:12px;font-weight:700;cursor:pointer;transition:all .15s';
    btnD.style.cssText = 'display:inline-flex;align-items:center;gap:6px;padding:7px 16px;border-radius:20px;border:1.5px solid var(--border-color);background:var(--bg-secondary);color:var(--text-secondary);font-size:12px;font-weight:700;cursor:pointer;transition:all .15s';
  }
}

/* ── nt_schedule 업무선택 팝업 ── */
function _openNtSchedTaskPopup() {
  var popup = document.getElementById('nt_sched_task_popup');
  var box   = document.getElementById('nt_sched_task_box');
  if (!popup || !box) return;
  var rect = box.getBoundingClientRect();
  popup.style.top  = (rect.bottom + 4) + 'px';
  popup.style.left = rect.left + 'px';
  popup.style.display = 'flex';
  _filterNtSchedTask('');
  setTimeout(function(){
    document.addEventListener('mousedown', function _closeT(e){
      if (!popup.contains(e.target) && e.target !== box) {
        popup.style.display = 'none';
        document.removeEventListener('mousedown', _closeT);
      }
    });
  }, 10);
}

function _filterNtSchedTask(q) {
  var list = document.getElementById('nt_sched_task_list');
  if (!list) return;
  var tasks = (WS.tasks || []);
  q = (q || '').trim();
  if (q) tasks = tasks.filter(function(t){ return t.title && t.title.indexOf(q) !== -1; });
  var selected = document.getElementById('nt_sched_task') ? document.getElementById('nt_sched_task').value : '';
  list.innerHTML = tasks.slice(0, 30).map(function(t) {
    var isOn = (selected == t.id);
    var teamHtml = t.team ? '<span style="font-size:10px;color:var(--text-muted);margin-left:6px">' + t.team + '</span>' : '';
    return '<div onclick="_selectNtSchedTask(' + t.id + ',this)" data-title="' + (t.title||'').replace(/"/g,'&quot;') + '" '
      + 'style="padding:7px 10px;border-radius:8px;cursor:pointer;font-size:12.5px;font-weight:600;color:var(--text-primary);'
      + 'background:' + (isOn ? 'var(--accent-blue)18' : 'transparent') + '">'
      + (isOn ? '\u2713 ' : '') + (t.title||'') + teamHtml
      + '</div>';
  }).join('') || '<div style="padding:10px;text-align:center;color:var(--text-muted);font-size:12px">\uc5c5\ubb34\ub97c \ub4f1\ub85d\ud558\uc138\uc694</div>';
}

function _selectNtSchedTask(id, titleOrEl) {
  // titleOrEl이 DOM 요소이면 data-title 속성에서 읽기
  var title = (titleOrEl && typeof titleOrEl === 'object' && titleOrEl.getAttribute)
    ? titleOrEl.getAttribute('data-title') || ''
    : (titleOrEl || '');
  var hidden = document.getElementById('nt_sched_task');
  if (hidden) hidden.value = id;
  var box = document.getElementById('nt_sched_task_box');
  var ph  = document.getElementById('nt_sched_task_placeholder');
  if (box) {
    if (ph) ph.style.display = 'none';
    // 기존 칩 제거
    Array.from(box.children).forEach(function(c){ if (c !== ph) c.remove(); });
    var chip = document.createElement('span');
    chip.style.cssText = 'display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;background:var(--accent-blue)18;border:1.5px solid var(--accent-blue);font-size:12px;font-weight:700;color:var(--accent-blue)';
    chip.innerHTML = '<i data-lucide="briefcase" style="width:11px;height:11px"></i>' + title
      + ' <span onclick="event.stopPropagation();_clearNtSchedTask()" style="cursor:pointer;opacity:.7">×</span>';
    box.insertBefore(chip, ph || null);
    if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 0);
  }
  var popup = document.getElementById('nt_sched_task_popup');
  if (popup) popup.style.display = 'none';
}

function _clearNtSchedTask() {
  var hidden = document.getElementById('nt_sched_task');
  if (hidden) hidden.value = '';
  var box = document.getElementById('nt_sched_task_box');
  var ph  = document.getElementById('nt_sched_task_placeholder');
  if (box) {
    Array.from(box.children).forEach(function(c){ if (c !== ph) c.remove(); });
    if (ph) ph.style.display = '';
  }
}

/* 가 nt_schedule 업무결과 렌더링 */
function _renderNtSchedResult() {
  var box = document.getElementById('nt_sched_result_picks');
  if (!box) return;
  var results = WS.taskResults || JSON.parse(localStorage.getItem('ws_task_results') || '[]');
  var selected = document.getElementById('nt_sched_result') ? document.getElementById('nt_sched_result').value : '';
  box.innerHTML = '';
  results.forEach(function(r) {
    var c = r.color || '#22c55e';
    var isOn = (selected === r.name);
    var span = document.createElement('span');
    span.setAttribute('data-result-name', r.name);
    span.onclick = function() { _selectNtSchedResult(this.getAttribute('data-result-name')); };
    span.style.cssText = 'display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;cursor:pointer;' +
      'font-size:11.5px;font-weight:700;border:1.5px solid ' + c + ';' +
      (isOn ? 'background:' + c + ';color:#fff' : 'background:' + c + '18;color:' + c) + ';transition:all .2s';
    var inner = '';
    if (r.icon && r.icon.length > 2) {
      inner = '<i data-lucide="' + r.icon + '" style="width:11px;height:11px"></i>';
    } else {
      inner = '<span style="width:6px;height:6px;border-radius:50%;background:' + c + ';display:inline-block"></span>';
    }
    span.innerHTML = inner + r.name;
    box.appendChild(span);
  });
  if (!results.length) {
    box.innerHTML = '<span style="font-size:11px;color:var(--text-muted)">기타설정에서 업무결과를 추가하세요</span>';
  }
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 0);
}

function _selectNtSchedResult(name) {
  var hidden = document.getElementById('nt_sched_result');
  if (hidden) hidden.value = (hidden.value === name) ? '' : name;
  _renderNtSchedResult();
}


/* 가 nt_schedule 진행순서 렌더링 */
function _renderNtSchedProcessList() {
  var list = document.getElementById('nt_sched_process_type_list');
  if (!list) return;
  var types = WS.reportTypes || JSON.parse(localStorage.getItem('ws_report_types') || '[]');
  list.innerHTML = '';
  if (!types.length) {
    list.innerHTML = '<span style="font-size:11px;color:var(--text-muted)">기타설정에서 진행보고유형을 추가하세요</span>';
    return;
  }
  types.forEach(function(r) {
    var c = r.color || '#4f6ef7';
    var span = document.createElement('span');
    var rId = (r.id || r.label || '').toString();
    var rLabel = r.label || '';
    var rIcon = r.icon || '';
    span.onclick = function() { _addNtSchedProcess(rId, rLabel, c, rIcon); };
    span.style.cssText = 'display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;cursor:pointer;' +
      'font-size:11.5px;font-weight:700;border:1.5px solid ' + c + ';background:' + c + '18;color:' + c + ';transition:all .2s;margin:3px';
    var inner = (r.icon && r.icon.length > 2) ? '<i data-lucide="' + r.icon + '" style="width:11px;height:11px;color:' + c + '"></i>' : '';
    span.innerHTML = inner + rLabel;
    list.appendChild(span);
  });
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 0);
}

function _addNtSchedProcess(id, label, color, icon) {
  window._ntSchedProcess = window._ntSchedProcess || [];
  window._ntSchedProcess.push({ id: id, label: label, color: color, icon: icon });
  _updateNtSchedProcessSelected();
}

function _updateNtSchedProcessSelected() {
  var box = document.getElementById('nt_sched_process_selected');
  var ph  = document.getElementById('nt_sched_process_placeholder');
  if (!box) return;
  var items = window._ntSchedProcess || [];
  Array.from(box.children).forEach(function(c){ if (c !== ph) c.remove(); });
  if (!items.length) { if (ph) ph.style.display = ''; return; }
  if (ph) ph.style.display = 'none';
  items.forEach(function(r, i) {
    var chip = document.createElement('span');
    var c = r.color || '#4f6ef7';
    var hasIcon = r.icon && r.icon.length > 2;
    var inner = hasIcon ? '<i data-lucide="' + r.icon + '" style="width:11px;height:11px;color:' + c + '"></i>' : '';
    chip.style.cssText = 'display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;font-size:11.5px;font-weight:700;border:1.5px solid ' + c + ';background:' + c + '22;color:' + c;
    chip.innerHTML = '<span style="font-size:10px;opacity:.6;margin-right:2px">' + (i+1) + '.</span>'
      + inner + r.label
      + ' <span onclick="event.stopPropagation();_removeNtSchedProcess(' + i + ')" style="cursor:pointer;opacity:.6;margin-left:3px">×</span>';
    box.insertBefore(chip, ph || null);
  });
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 0);
}

function _removeNtSchedProcess(idx) {
  (window._ntSchedProcess || []).splice(idx, 1);
  _updateNtSchedProcessSelected();
}


/* ═══════════════════════════════════════
   최종 schedule 모드 UI override
   - 파일 마지막에 위치하여 모든 래퍼보다 나중에 실행
═══════════════════════════════════════ */
(function() {
  var _lastPrev = typeof window.openNewTaskModal === 'function' ? window.openNewTaskModal : null;
  if (!_lastPrev) return;
  window.openNewTaskModal = function(mode, parentId, isSimple) {
    _lastPrev.call(window, mode, parentId, isSimple);
    if (mode !== 'schedule') return;
    // setTimeout으로 다른 래퍼들의 setTimeout보다 늦게 실행
    setTimeout(function() {
      // 1. schedule 전용 필드 표시
      var sf = document.getElementById('nt_schedule_fields');
      if (sf) { sf.style.display = 'flex'; sf.style.flexDirection = 'column'; sf.style.gap = '14px'; }
      // 2. 기존 일반 필드 숨김
      var nf = document.getElementById('nt_normal_fields');
      if (nf) nf.style.display = 'none';
      var tc = document.getElementById('nt_row_teams_check');
      if (tc) tc.style.display = 'none';
      var fa = document.getElementById('nt_fg_attach');
      if (fa) fa.style.display = 'none';
      var fd = document.getElementById('nt_fg_detail');
      if (fd) fd.style.display = 'none';
      // 3. 버튼 텍스트/핸들러 강제 설정
      var submitBtn = document.querySelector('#newTaskModal .modal-foot .btn-blue');
      if (submitBtn) { submitBtn.textContent = '등록'; submitBtn.onclick = createScheduleTask; }
      // 4. 완료기한 날짜 초기화
      var tod = new Date();
      var yy = tod.getFullYear(), mo = String(tod.getMonth()+1).padStart(2,'0'), da = String(tod.getDate()).padStart(2,'0');
      var dh = document.getElementById('nt_sched_due');
      var dl = document.getElementById('nt_sched_due_label');
      if (dh) dh.value = yy + '-' + mo + '-' + da;
      if (dl) dl.textContent = yy + '년 ' + parseInt(mo) + '월 ' + parseInt(da) + '일';
      // 5. 중요도/상태/협업자/업무결과/진행순서 렌더
      if (typeof _renderNtSchedImportance === 'function') _renderNtSchedImportance();
      if (typeof _renderNtSchedStatus    === 'function') _renderNtSchedStatus();
      if (typeof _renderNtSchedCollabBox === 'function') _renderNtSchedCollabBox();
      if (typeof _renderNtSchedResult    === 'function') _renderNtSchedResult();
      if (typeof _renderNtSchedProcessList === 'function') _renderNtSchedProcessList();
      if (typeof _updateNtSchedProcessSelected === 'function') _updateNtSchedProcessSelected();
      if (typeof _clearNtSchedTask === 'function') _clearNtSchedTask();
      // 6. 업무내용/파일 초기화
      var sc = document.getElementById('nt_sched_content');
      if (sc) sc.value = '';
      var fl = document.getElementById('nt_sched_file_list');
      if (fl) fl.innerHTML = '';
      window._ntSchedCollabIds = [];
      window._ntSchedFiles = [];
      window._ntSchedProcess = [];
      if (typeof refreshIcons === 'function') refreshIcons();
    }, 50);
  };
})();


/* ═══════════════════════════════════════════════════════
   openScheduleModal() — "+ 내가추진" 전용 독립 함수
   openNewTaskModal wrapper chain과 완전히 독립적으로 동작
═══════════════════════════════════════════════════════ */
function openScheduleModal() {
  // 1. newTaskModal 기본 팝업 열기
  openModal('newTaskModal');

  // 2. 타이틀 / 버튼 설정
  var modalTitle = document.querySelector('#newTaskModal .modal-title');
  var submitBtn  = document.querySelector('#newTaskModal .modal-foot .btn-blue');
  if (modalTitle) modalTitle.textContent = '내가 추진하는 업무 추가';
  if (submitBtn)  { submitBtn.textContent = '등록'; submitBtn.onclick = createScheduleTask; }

  // 3. 기존 필드 숨기기 / schedule 전용 필드 보이기
  var sf = document.getElementById('nt_schedule_fields');
  var nf = document.getElementById('nt_normal_fields');
  var tc = document.getElementById('nt_row_teams_check');
  var fa = document.getElementById('nt_fg_attach');
  var fd = document.getElementById('nt_fg_detail');
  var rowPT    = document.getElementById('nt_row_priority_team');
  var rowDate  = document.getElementById('nt_row_dates');
  var rowScore = document.querySelector('[id^="nt_row_score"]') || null;

  if (sf) { sf.style.display = 'flex'; sf.style.flexDirection = 'column'; sf.style.gap = '14px'; }
  if (nf) nf.style.display = 'none';
  if (tc) tc.style.display = 'none';
  if (fa) fa.style.display = 'none';
  if (fd) fd.style.display = 'none';
  if (rowPT)   rowPT.style.display   = 'none';
  if (rowDate) rowDate.style.display  = 'none';
  if (rowScore) rowScore.style.display = 'none';

  // 4. 완료기한 날짜 초기화
  var tod = new Date();
  var yy = tod.getFullYear(), mo = String(tod.getMonth()+1).padStart(2,'0'), da = String(tod.getDate()).padStart(2,'0');
  var dh = document.getElementById('nt_sched_due');
  var dl = document.getElementById('nt_sched_due_label');
  if (dh) dh.value = yy + '-' + mo + '-' + da;
  if (dl) dl.textContent = yy + '년 ' + parseInt(mo) + '월 ' + parseInt(da) + '일';

  // 5. 각종 칩/목록 렌더링
  if (typeof _renderNtSchedImportance    === 'function') _renderNtSchedImportance();
  if (typeof _renderNtSchedStatus        === 'function') _renderNtSchedStatus();
  if (typeof _renderNtSchedResult        === 'function') _renderNtSchedResult();
  if (typeof _renderNtSchedProcessList   === 'function') _renderNtSchedProcessList();
  if (typeof _updateNtSchedProcessSelected === 'function') _updateNtSchedProcessSelected();
  if (typeof _clearNtSchedTask           === 'function') _clearNtSchedTask();

  // 6. 협업자/파일/내용 초기화
  window._ntSchedCollabIds = [];
  window._ntSchedFiles     = [];
  window._ntSchedProcess   = [];
  if (typeof _renderNtSchedCollabBox === 'function') _renderNtSchedCollabBox();
  var sc = document.getElementById('nt_sched_content');
  if (sc) sc.value = '';
  var fl = document.getElementById('nt_sched_file_list');
  if (fl) fl.innerHTML = '';
  var nt = document.getElementById('nt_title');
  if (nt) nt.value = '';

  // 7. 아이콘 갱신
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 50);
}
