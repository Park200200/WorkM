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
        <div class="t-text" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          ${label}
          <span style="display:inline-flex;align-items:center;gap:3px;font-size:10.5px;font-weight:700;
            padding:1px 8px;border-radius:20px;
            background:${progressNow>=100?'#22c55e':progressNow<30?'#ef4444':'#4f6ef7'}20;
            color:${progressNow>=100?'#22c55e':progressNow<30?'#ef4444':'#4f6ef7'};
            border:1px solid ${progressNow>=100?'#22c55e':progressNow<30?'#ef4444':'#4f6ef7'}55">
            ${progressNow}%
          </span>
        </div>
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
  // schedule 모드: 지시사항 모달 재사용 (openScheduleModal이 instrModal을 열어줌)
  if (mode === 'schedule' && typeof openScheduleModal === 'function') {
    openScheduleModal();
    return;
  }
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
    if (modalTitle) modalTitle.textContent = '내가 기획한 업무 작성';
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

  // 일간보고 내용 로드
  var todayKey = 'ws_daily_report_' + new Date().toISOString().slice(0, 10);
  var savedText = localStorage.getItem(todayKey) || '';
  var ta = document.getElementById('drDailyReportText');
  if (ta) {
    ta.value = savedText;
    _updateDrSaveStatus('저장됨', true);
  }
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
  // app.js??renderDrExecList濡??꾩엫 (而щ읆: ?낅Т紐??ㅽ뻾?댁슜/以묒슂??吏꾪뻾?곹깭/泥⑤??뚯씪/??μ떆媛?愿由?
  if (typeof renderDrExecList === 'function') {
    renderDrExecList();
  }
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
  { icon:'check-circle',      color:'#22c55e' },
  { icon:'refresh-cw',        color:'#06b6d4' },
  { icon:'git-branch',        color:'#f59e0b' },
  { icon:'pause-circle',      color:'#6b7280' },
  { icon:'x-circle',          color:'#ef4444' },
  { icon:'check-circle-2',    color:'#4f6ef7' },
  { icon:'alert-triangle',    color:'#f97316' },
  { icon:'clock',             color:'#8b5cf6' },
  { icon:'flag',              color:'#ec4899' },
  { icon:'star',              color:'#eab308' },
  { icon:'thumbs-up',         color:'#14b8a6' },
  { icon:'thumbs-down',       color:'#f43f5e' },
  /* 파일 / 문서 관련 아이콘 */
  { icon:'file-spreadsheet',  color:'#16a34a' },
  { icon:'presentation',      color:'#dc2626' },
  { icon:'file-type-2',       color:'#b91c1c' },
  { icon:'receipt',           color:'#0369a1' },
  { icon:'file-text',         color:'#374151' },
  { icon:'file-image',        color:'#7c3aed' },
  { icon:'file-video',        color:'#be185d' },
  { icon:'file-audio',        color:'#0891b2' },
  { icon:'file-archive',      color:'#92400e' },
  { icon:'file-code',         color:'#065f46' },
  { icon:'file-check',        color:'#15803d' },
  { icon:'file-plus',         color:'#4f46e5' },
  { icon:'table-2',           color:'#1d4ed8' },
  { icon:'camera',            color:'#9333ea' },
  { icon:'package',           color:'#b45309' },
  { icon:'send',              color:'#0284c7' },
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
      '<span style="font-size:15px;font-weight:800;color:var(--text-primary)">' + t.title + '</span>' +
      '<span style="font-size:14px;font-weight:500;color:var(--text-muted);margin:0 6px">:</span>' +
      '<span style="font-size:15px;font-weight:800;color:var(--accent-blue)">업무 진행현황</span>' +
      '<span style="font-size:12px;font-weight:700;background:var(--accent-blue);color:#fff;' +
      'border-radius:20px;padding:2px 10px;vertical-align:middle;margin-left:8px">' + progress + '%</span>';
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
          '<div style="display:flex;align-items:center;gap:6px;margin-top:6px">' +
            '<div style="flex:1;height:6px;background:var(--border-color);border-radius:100px;overflow:hidden">' +
              '<div style="width:' + progress + '%;height:100%;border-radius:100px;background:' +
              (t.status === 'done' ? '#22c55e' : t.status === 'delay' ? '#ef4444' : 'var(--accent-blue)') +
              ';border-radius:100px;transition:width .4s"></div>' +
            '</div>' +
            '<span style="font-size:12px;font-weight:800;color:var(--accent-blue);white-space:nowrap">' + progress + '%</span>' +
          '</div>' +
        '</div>' +
        '<div style="background:var(--bg-secondary);border-radius:10px;padding:10px 12px">' +
          '<div style="font-size:10px;color:var(--text-muted);font-weight:600;margin-bottom:4px">업무완료 결과 리스트</div>' +
          '<div style="font-size:12px;display:flex;flex-wrap:wrap;gap:4px;align-items:center">' +
            (typeof _renderReportContentChips === 'function'
              ? _renderReportContentChips((instrRecord && instrRecord.reportContent) ? instrRecord.reportContent : t.reportContent)
              : (t.reportContent || '-')) +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div style="border-top:1px solid var(--border-color);padding-top:12px">' +
        '<label class="form-label" style="display:flex;align-items:center;gap:6px;margin-bottom:6px">' +
          '<i data-lucide="file-text" style="width:12px;height:12px"></i> 지시내용' +
        '</label>' +
        '<div style="background:var(--bg-secondary);border:1.5px solid var(--border-color);border-radius:10px;' +
        'padding:12px 14px;font-size:13px;color:var(--text-primary);min-height:72px;line-height:1.6;white-space:pre-wrap">' +
        (t.desc || '-') + '</div>' +
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
                    '<div class="t-text" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">' +
                      h.event +
                      (h.progress !== undefined && h.progress !== null
                        ? '<span style="display:inline-flex;align-items:center;gap:3px;font-size:10.5px;font-weight:700;' +
                          'padding:1px 8px;border-radius:20px;' +
                          'background:' + (h.progress >= 100 ? '#22c55e' : h.progress < 30 ? '#ef4444' : '#4f6ef7') + '20;' +
                          'color:' + (h.progress >= 100 ? '#22c55e' : h.progress < 30 ? '#ef4444' : '#4f6ef7') + ';' +
                          'border:1px solid ' + (h.progress >= 100 ? '#22c55e' : h.progress < 30 ? '#ef4444' : '#4f6ef7') + '55">' +
                          h.progress + '%</span>'
                        : '') +
                    '</div>' +
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
  // 업무명 항목 복원 (일반 모달로 돌아갈 때)
  var fgTitle = document.getElementById('nt_fg_title');
  if (fgTitle) fgTitle.style.display = '';
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
      // e.target이 innerHTML 갱신으로 detach됐을 경우를 대비해 closest로 확인
      var inPopup = popup.contains(e.target) || !!(e.target.closest && e.target.closest('#nt_sched_collab_popup'));
      var inBox   = box.contains(e.target)   || e.target === box;
      if (!inPopup && !inBox) {
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
    // onmousedown으로 처리: mousedown 닫힘 리스너보다 먼저 실행되며,
    // innerHTML 재설정 후 e.target이 detach되어 팝업이 즉시 닫히는 문제 방지
    return '<div onmousedown="event.stopPropagation();event.preventDefault();_toggleNtSchedCollab(' + u.id + ')" style="display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:8px;cursor:pointer;background:' + (isOn ? (u.color||'#4f6ef7') + '18' : 'transparent') + '">'
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
  // 업무명: 업무 선택에서 선택한 상세업무명 사용
  var taskBox = document.getElementById('nt_sched_task_box');
  var selectedTitle = '';
  if (taskBox) {
    var chip = taskBox.querySelector('[data-title]');
    if (chip) selectedTitle = chip.getAttribute('data-title') || '';
  }
  // nt_title 입력창이 보이는 경우 fallback
  var ntTitleEl = document.getElementById('nt_title');
  var manualTitle = ntTitleEl && ntTitleEl.offsetParent !== null ? ntTitleEl.value.trim() : '';
  var title = selectedTitle || manualTitle;
  if (!title) { showToast('error', '업무 선택에서 업무를 선택하세요'); return; }
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
    processTags: (window._ntSchedProcess || []).map(function(p){ return p.label || p; }),
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

  // 기타설정 > 상세업무리스트에서 가져오기
  var detailTasks = JSON.parse(localStorage.getItem('ws_detail_tasks') || '[]');
  q = (q || '').trim();
  if (q) detailTasks = detailTasks.filter(function(d){ return d.name && d.name.indexOf(q) !== -1; });

  var selected = document.getElementById('nt_sched_task') ? document.getElementById('nt_sched_task').value : '';

  if (!detailTasks.length) {
    list.innerHTML = '<div style="padding:10px;text-align:center;color:var(--text-muted);font-size:12px">'
      + '<i data-lucide="info" style="width:12px;height:12px;vertical-align:middle;margin-right:4px"></i>'
      + '기본관리 → 기타설정에서<br>상세업무를 추가하세요</div>';
    if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 0);
    return;
  }

  list.innerHTML = detailTasks.map(function(d) {
    var isOn = (selected == String(d.id));
    return '<div onclick="_selectNtSchedTask(\'' + d.id + '\',this)" data-title="' + (d.name||'').replace(/"/g,'&quot;') + '" '
      + 'style="padding:7px 10px;border-radius:8px;cursor:pointer;font-size:12.5px;font-weight:600;color:var(--text-primary);'
      + 'display:flex;align-items:center;gap:6px;'
      + 'background:' + (isOn ? 'var(--accent-blue)18' : 'transparent') + '">'
      + '<i data-lucide="check-square" style="width:12px;height:12px;color:' + (isOn ? 'var(--accent-blue)' : 'var(--text-muted)') + ';flex-shrink:0"></i>'
      + (isOn ? '<span style="color:var(--accent-blue)">' + (d.name||'') + '</span>' : (d.name||''))
      + '</div>';
  }).join('');
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 0);
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
    chip.setAttribute('data-title', title);
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
   - schedule 모드는 openScheduleModal()이 지시사항 모달을 재사용
═══════════════════════════════════════ */
(function() {
  var _lastPrev = typeof window.openNewTaskModal === 'function' ? window.openNewTaskModal : null;
  if (!_lastPrev) return;
  window.openNewTaskModal = function(mode, parentId, isSimple) {
    // schedule 모드: openScheduleModal()이 지시사항 모달을 재사용하므로 여기서 처리
    if (mode === 'schedule') {
      if (typeof openScheduleModal === 'function') openScheduleModal();
      return;
    }
    _lastPrev.call(window, mode, parentId, isSimple);
  };
})();


/* ═══════════════════════════════════════════════════════
   openScheduleModal() — "+ 내가추진" 전용 독립 함수
   openNewTaskModal wrapper chain과 완전히 독립적으로 동작
═══════════════════════════════════════════════════════ */
function openScheduleModal() {
  // 지시사항 모달을 재사용하되 스케줄 모드로 열기
  window._instrIsScheduleMode = true;

  if (typeof openInstructionModal === 'function') {
    openInstructionModal(null);
  } else {
    return;
  }

  // 타이틀 + 아이콘 + 버튼 변경: _instrSetEditMode의 setTimeout(50)보다 늘게 실행
  setTimeout(function() {
    var titleEl  = document.getElementById('instructionModalTitle');
    var iconWrap = document.getElementById('instrModalIconWrap');
    var saveBtn  = document.querySelector('#instructionModal .modal-foot .btn-blue');
    if (titleEl)  titleEl.textContent = '내가 기획한 업무 작성';
    if (iconWrap) {
      iconWrap.style.background = 'linear-gradient(135deg,#4f6ef7,#9747ff)';
      iconWrap.innerHTML = '<i data-lucide="calendar-plus" style="width:16px;height:16px;color:#fff"></i>';
    }
    if (saveBtn) {
      saveBtn.innerHTML = '<i data-lucide="check" style="width:13px;height:13px;margin-right:4px;vertical-align:middle"></i>등록';
      saveBtn.onclick = _saveScheduleFromInstrModal;
    }
    if (typeof refreshIcons === 'function') refreshIcons();
  }, 120);
}

/* ═══════════════════════════════════════════════════════
   openScheduleEditModal(taskId) — "내가 기획한 내업무" 수정 모달
   기존 데이터를 폼에 채우고 타이틀/버튼을 수정 모드로 설정
═══════════════════════════════════════════════════════ */
function openScheduleEditModal(taskId) {
  // 1. 태스크 찾기
  var task = (WS.tasks || []).find(function(t){ return String(t.id) === String(taskId); });
  if (!task) { showToast('error', '해당 업무를 찾을 수 없습니다.'); return; }

  // 2. 신규 등록과 동일하게 모달 초기화
  openScheduleModal();

  // 3. 수정 모드: openScheduleModal의 setTimeout(120ms)보다 늦게 실행해야 덮어쓰기 방지
  setTimeout(function() {
    // openScheduleModal은 instructionModal을 재사용하므로 해당 셀렉터 사용
    var titleEl  = document.getElementById('instructionModalTitle');
    var iconWrap = document.getElementById('instrModalIconWrap');
    var submitBtn = document.querySelector('#instructionModal .modal-foot .btn-blue');

    if (titleEl) titleEl.textContent = '내가 기획한 업무 수정';
    if (iconWrap) {
      iconWrap.style.background = 'linear-gradient(135deg,#f59e0b,#ef4444)';
      iconWrap.innerHTML = '<i data-lucide="pencil" style="width:16px;height:16px;color:#fff"></i>';
    }
    if (submitBtn) {
      submitBtn.innerHTML = '<i data-lucide="save" style="width:13px;height:13px;margin-right:4px;vertical-align:middle"></i>수정';
      submitBtn.onclick = function() { _saveScheduleEdit(taskId); };
    }

    // 4. 기존 데이터 폼에 채우기
    // 업무명
    var ntTitle = document.getElementById('nt_title');
    if (ntTitle) ntTitle.value = task.title || '';

    // 업무설명
    var ntContent = document.getElementById('nt_sched_content');
    if (ntContent) ntContent.value = task.desc || task.description || '';

    // 완료기한
    var dh = document.getElementById('nt_sched_due');
    var dl = document.getElementById('nt_sched_due_label');
    if (task.dueDate) {
      if (dh) dh.value = task.dueDate;
      if (dl) {
        var parts = task.dueDate.split('-');
        dl.textContent = parts[0] + '년 ' + parseInt(parts[1]) + '월 ' + parseInt(parts[2]) + '일';
      }
    }

    // 시작일
    var sh = document.getElementById('nt_sched_start');
    var sl = document.getElementById('nt_sched_start_label');
    if (task.startedAt) {
      var startDate = task.startedAt.split('T')[0];
      if (sh) sh.value = startDate;
      if (sl) {
        var sp = startDate.split('-');
        sl.textContent = sp[0] + '년 ' + parseInt(sp[1]) + '월 ' + parseInt(sp[2]) + '일';
      }
    }

    // 업무성격
    var nature = task.taskNature || '일일업무';
    if (typeof _selectNtNature === 'function') _selectNtNature(nature);

    // 현재상태
    var statusHidden = document.getElementById('nt_sched_status');
    if (statusHidden && task.status) { statusHidden.value = task.status; }
    if (typeof _renderNtSchedStatus === 'function') _renderNtSchedStatus();

    // 중요도
    window._ntSchedImps = task.importance ? task.importance.split(',').map(function(s){ return s.trim(); }).filter(Boolean) : [];
    if (typeof _renderNtSchedImportance === 'function') _renderNtSchedImportance();

    // 수신(협조)자
    window._ntSchedCollabIds = Array.isArray(task.assigneeIds) ? task.assigneeIds.slice() : [];
    if (typeof _renderNtSchedCollabBox === 'function') _renderNtSchedCollabBox();

    // 진행순서
    window._ntSchedProcess = [];
    if (task.processTags && task.processTags.length) {
      var types = WS.reportTypes || JSON.parse(localStorage.getItem('ws_report_types') || '[]');
      task.processTags.forEach(function(tag) {
        var rt = types.find(function(r){ return r.label === tag; });
        window._ntSchedProcess.push({ id: rt ? (rt.id||tag) : tag, label: tag, color: rt ? (rt.color||'#4f6ef7') : '#4f6ef7', icon: rt ? (rt.icon||'') : '' });
      });
    }
    if (typeof _updateNtSchedProcessSelected === 'function') _updateNtSchedProcessSelected();
    if (typeof _renderNtSchedProcessList === 'function') _renderNtSchedProcessList();

    // 수정용 taskId 저장
    window._schedEditTaskId = taskId;

    if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 50);
  }, 160);
}

/* 스케줄 업무 수정 저장 */
function _saveScheduleEdit(taskId) {
  var task = (WS.tasks || []).find(function(t){ return String(t.id) === String(taskId); });
  if (!task) { showToast('error', '업무를 찾을 수 없습니다.'); return; }

  var title = (document.getElementById('nt_title') ? document.getElementById('nt_title').value.trim() : '');
  if (!title) { showToast('error', '업무명을 입력하세요'); return; }
  var due = document.getElementById('nt_sched_due') ? document.getElementById('nt_sched_due').value : '';
  if (!due) { showToast('error', '완료기한을 선택하세요'); return; }

  task.title       = title;
  task.desc        = (document.getElementById('nt_sched_content') ? document.getElementById('nt_sched_content').value.trim() : '');
  task.dueDate     = due;
  task.startedAt   = (document.getElementById('nt_sched_start') ? document.getElementById('nt_sched_start').value : '') || due;
  task.status      = (document.getElementById('nt_sched_status') ? document.getElementById('nt_sched_status').value : '') || task.status || 'waiting';
  task.taskNature  = (document.getElementById('nt_sched_nature') ? document.getElementById('nt_sched_nature').value : '일일업무');
  task.importance  = (document.getElementById('nt_sched_importance') ? document.getElementById('nt_sched_importance').value : '');
  task.assigneeIds = (window._ntSchedCollabIds || []).slice();
  task.processTags = (window._ntSchedProcess || []).map(function(p){ return p.label || p; });
  task.isImportant = task.importance.length > 0;
  task.updatedAt   = new Date().toISOString();

  WS.saveTasks();
  // openScheduleEditModal은 instructionModal을 재사용하므로 둘 다 닫기
  if (typeof closeModalDirect === 'function') {
    closeModalDirect('instructionModal');
    closeModalDirect('newTaskModal');
  }
  renderDashboard();
  if (typeof renderPage_Tasks === 'function') renderPage_Tasks();
  showToast('success', '"' + title + '" 업무가 수정되었습니다.');
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 0);
}

/* ═══════════════════════════════════════════════════════
   openScheduleProgressModal(taskId)
   "내가 기획한 내업무" 진행율 클릭 시 진행보고서 작성 UI 열기
   openReceivedTaskDetail을 재사용하되 헤더를 "진행보고서 작성"으로 변경
═══════════════════════════════════════════════════════ */
function openScheduleProgressModal(taskId) {
  // 기존 진행보고서 모달 재사용 (openReceivedTaskDetail)
  if (typeof openReceivedTaskDetail === 'function') {
    openReceivedTaskDetail(taskId);
    // 모달이 열린 뒤 타이틀을 진행보고서 작성으로 변경
    setTimeout(function() {
      var tdTitle = document.getElementById('tdModalTitle');
      if (tdTitle) {
        // 기존 내용 유지하되 앞에 "진행보고서 작성 - " 추가
        var task = (WS.tasks || []).find(function(t){ return String(t.id) === String(taskId); });
        var name = task ? task.title : '';
        tdTitle.innerHTML = '<i data-lucide="clipboard-list" style="width:18px;height:18px;color:var(--accent-blue)"></i> 진행보고서 작성'
          + (name ? ' <span style="font-size:13px;font-weight:500;color:var(--text-muted);margin-left:6px">— ' + name + '</span>' : '');
        if (typeof refreshIcons === 'function') refreshIcons();
      }
    }, 100);
  } else {
    showToast('error', '진행보고서 UI를 불러올 수 없습니다.');
  }
}

/* ═══════════════════════════════════════════════════════
   syncDataToInitJson()
   현재 localStorage 데이터를 init-data.json에 저장 후
   git commit & push 명령어 안내
═══════════════════════════════════════════════════════ */
async function syncDataToInitJson() {
  var KEYS = [
    'ws_departments','ws_ranks','ws_positions',
    'ws_task_results','ws_report_types','ws_detail_tasks',
    'ws_users','ws_tasks','ws_hq_info','ws_attendance',
    'ws_messages','ws_accents','ws_current_accent',
    'ws_theme','ws_border_radius','ws_instr_importances',
    'ws_task_statuses'
  ];

  // localStorage에서 데이터 수집
  var data = {};
  KEYS.forEach(function(k) {
    var v = localStorage.getItem(k);
    if (v) {
      try { data[k] = JSON.parse(v); }
      catch(e) { data[k] = v; }
    }
  });

  var jsonStr = JSON.stringify(data, null, 2);
  var btn = document.getElementById('syncBtn');

  // 버튼 로딩 표시
  if (btn) {
    btn.style.background = 'var(--accent-blue)';
    btn.style.color = '#fff';
    btn.style.borderColor = 'var(--accent-blue)';
  }

  function resetBtn() {
    setTimeout(function() {
      if (btn) {
        btn.style.background = '';
        btn.style.color = '';
        btn.style.borderColor = '';
      }
    }, 2000);
  }

  function showCmdBox(cmds) {
    // 기존 박스 제거
    var old = document.getElementById('syncCmdBox');
    if (old) old.remove();

    var box = document.createElement('div');
    box.id = 'syncCmdBox';
    box.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);'
      + 'z-index:9999;background:var(--bg-modal);border:1.5px solid var(--border-color);'
      + 'border-radius:14px;padding:24px 28px;box-shadow:0 20px 60px rgba(0,0,0,.3);'
      + 'min-width:400px;max-width:560px;';
    box.innerHTML =
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">'
      + '<div style="width:32px;height:32px;border-radius:9px;background:var(--accent-blue);'
      +   'display:flex;align-items:center;justify-content:center">'
      +   '<i data-lucide="terminal" style="width:16px;height:16px;color:#fff"></i></div>'
      + '<div style="font-size:15px;font-weight:800;color:var(--text-primary)">PowerShell 명령어</div>'
      + '<button onclick="document.getElementById(\'syncCmdBox\').remove()" '
      +   'style="margin-left:auto;width:28px;height:28px;border-radius:6px;border:1px solid '
      +   'var(--border-color);background:transparent;cursor:pointer;font-size:15px;color:var(--text-muted)">✕</button>'
      + '</div>'
      + '<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">'
      +   'PowerShell에서 아래 명령어를 실행하세요:</div>'
      + '<pre id="syncCmdPre" style="background:var(--bg-tertiary);border:1px solid var(--border-color);'
      +   'border-radius:8px;padding:12px 16px;font-size:12.5px;color:var(--text-primary);'
      +   'overflow-x:auto;line-height:1.8;white-space:pre">' + cmds + '</pre>'
      + '<button onclick="_copySyncCmds()" '
      +   'style="margin-top:14px;width:100%;height:38px;border-radius:9px;border:none;'
      +   'background:var(--accent-blue);color:#fff;font-size:13px;font-weight:700;cursor:pointer">'
      + '📋 명령어 복사</button>';
    document.body.appendChild(box);
    window._syncCmdsStr = cmds;
    if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 50);
  }

  try {
    // ── File System Access API (Chrome/Edge 지원) ──
    if (window.showSaveFilePicker) {
      var fileHandle = await window.showSaveFilePicker({
        suggestedName: 'init-data.json',
        types: [{ description: 'JSON 파일', accept: { 'application/json': ['.json'] } }]
      });
      var writable = await fileHandle.createWritable();
      await writable.write(jsonStr);
      await writable.close();

      showToast('success', 'init-data.json 저장 완료!', 4000);

      var commitMsg = '[WorkM] 데이터 동기화 ' + new Date().toLocaleDateString('ko-KR');
      var cmds = 'cd C:\\Users\\Lenovo\\Antigravity\\WorkM\n'
        + 'git add home/init-data.json\n'
        + 'git commit -m "' + commitMsg + '"\n'
        + 'git push';
      showCmdBox(cmds);

    } else {
      // ── Fallback: 파일 다운로드 ──
      var blob = new Blob([jsonStr], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'init-data.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      var commitMsg2 = '[WorkM] 데이터 동기화 ' + new Date().toLocaleDateString('ko-KR');
      var cmds2 = 'cd C:\\Users\\Lenovo\\Antigravity\\WorkM\n'
        + '# 다운로드된 init-data.json을 home/ 폴더에 복사 후:\n'
        + 'git add home/init-data.json\n'
        + 'git commit -m "' + commitMsg2 + '"\n'
        + 'git push';
      showToast('info', 'init-data.json 다운로드됨! home/ 폴더에 덮어쓰기 후 git push하세요.', 5000);
      showCmdBox(cmds2);
    }

  } catch(e) {
    if (e.name !== 'AbortError') {
      showToast('error', '저장 실패: ' + e.message);
    }
  } finally {
    resetBtn();
  }
}

function _copySyncCmds() {
  navigator.clipboard.writeText(window._syncCmdsStr || '').then(function() {
    showToast('success', '명령어가 클립보드에 복사되었습니다.');
  }).catch(function() {
    var pre = document.getElementById('syncCmdPre');
    if (pre) {
      var range = document.createRange();
      range.selectNode(pre);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
      document.execCommand('copy');
      showToast('success', '복사 완료!');
    }
  });
}

/* ══════════════════════════════════════════════════════
   홈페이지 모드 - 사이드바 전환 및 서브페이지 라우팅
══════════════════════════════════════════════════════ */

// 홈페이지 모드 진입: mainNav 숨기고 homepageNav 표시
function enterHomepageMode() {
  var mainNav      = document.getElementById('mainNav');
  var acctNav      = document.getElementById('acctNav');
  var homepageNav  = document.getElementById('homepageNav');
  if (mainNav)     mainNav.style.display     = 'none';
  if (acctNav)     acctNav.style.display     = 'none';
  if (homepageNav) homepageNav.style.display = 'block';
  // 첫 서브페이지(기본설정) 자동 표시
  var firstItem = document.querySelector('#homepageNav [data-hp-page="hp-basic"]');
  showHomepagePage('hp-basic', firstItem);
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 60);
}

// 홈페이지 모드 이탈: mainNav 복원 후 대시보드로
function exitHomepageMode() {
  var mainNav     = document.getElementById('mainNav');
  var homepageNav = document.getElementById('homepageNav');
  if (homepageNav) homepageNav.style.display = 'none';
  if (mainNav)     mainNav.style.display     = 'block';
  // 헤더 breadcrumb 복원
  var headerSearch = document.getElementById('headerSearch');
  var homepageBar  = document.getElementById('homepageModeBar');
  if (headerSearch) headerSearch.style.display = '';
  if (homepageBar)  homepageBar.style.display  = 'none';
  // 대시보드로 이동
  var dashEl = document.querySelector('[data-page="dashboard"]');
  if (typeof showPage === 'function') showPage('dashboard', dashEl);
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 60);
}

// 홈페이지 서브페이지 전환
function showHomepagePage(pageId, navEl) {
  // 서브 콘텐츠 영역 모두 숨기기
  var subPages = ['hp-menu','hp-basic','hp-content','hp-banner','hp-board','hp-inquiry'];
  subPages.forEach(function(id) {
    var el = document.getElementById('page-' + id);
    if (el) { el.style.display = 'none'; el.classList.remove('active'); }
  });
  // 선택한 서브페이지 표시
  var target = document.getElementById('page-' + pageId);
  if (target) { target.style.display = 'block'; target.classList.add('active'); }
  // nav 활성 상태
  document.querySelectorAll('#homepageNav .nav-item').forEach(function(n) {
    n.classList.remove('active');
  });
  if (navEl) navEl.classList.add('active');
}

/* ══ 홈페이지 기본설정 - 로고 등록 ══ */
function _hpLogoPreview(input, previewId, hiddenId) {
  if (!input.files || !input.files[0]) return;
  var file = input.files[0];
  var reader = new FileReader();
  reader.onload = function(e) {
    var dataUrl = e.target.result;
    var previewEl = document.getElementById(previewId);
    var hiddenEl  = document.getElementById(hiddenId);
    if (previewEl) {
      previewEl.innerHTML = '<img src="' + dataUrl + '" style="max-width:100%;max-height:100%;object-fit:contain;border-radius:8px">';
    }
    if (hiddenEl) hiddenEl.value = dataUrl;
    // localStorage 임시 저장
    try { localStorage.setItem('hp_logo_' + hiddenId, dataUrl); } catch(e2){}
  };
  reader.readAsDataURL(file);
}

function _hpLogoSave() {
  var keys = ['hp_logo_top_h','hp_logo_top_v','hp_logo_bot_h','hp_logo_bot_v'];
  var saved = 0;
  keys.forEach(function(k) {
    var el = document.getElementById(k);
    if (el && el.value) {
      try { localStorage.setItem(k, el.value); saved++; } catch(e){}
    }
  });
  if (typeof showToast === 'function') showToast('success', '로고가 저장되었습니다.');
}

// 저장된 로고 복원 (페이지 로드 시)
function _hpLogoRestore() {
  var map = {
    'hp_logo_top_h': 'logo_top_h_preview',
    'hp_logo_top_v': 'logo_top_v_preview',
    'hp_logo_bot_h': 'logo_bot_h_preview',
    'hp_logo_bot_v': 'logo_bot_v_preview'
  };
  Object.keys(map).forEach(function(k) {
    var dataUrl = localStorage.getItem(k);
    if (!dataUrl) return;
    var previewEl = document.getElementById(map[k]);
    var hiddenEl  = document.getElementById(k);
    if (previewEl) previewEl.innerHTML = '<img src="' + dataUrl + '" style="max-width:100%;max-height:100%;object-fit:contain;border-radius:8px">';
    if (hiddenEl)  hiddenEl.value = dataUrl;
  });
}

// showHomepagePage 시 로고 복원 호출
var _origShowHpPage = window.showHomepagePage;
window.showHomepagePage = function(pageId, navEl) {
  if (typeof _origShowHpPage === 'function') _origShowHpPage(pageId, navEl);
  if (pageId === 'hp-basic') setTimeout(_hpLogoRestore, 80);
};

/* ══ 상단 리벳 설정 ══ */
var _rivetTags = [];

function _rivetAddTag() {
  var input = document.getElementById('rivet_tag_input');
  if (!input) return;
  var val = (input.value || '').trim();
  if (!val) return;
  _rivetTags.push(val);
  input.value = '';
  _rivetRenderTags();
  _rivetPreview();
  input.focus();
}

function _rivetRemoveTag(idx) {
  _rivetTags.splice(idx, 1);
  _rivetRenderTags();
  _rivetPreview();
}

function _rivetRenderTags() {
  var box = document.getElementById('rivet_tag_box');
  var input = document.getElementById('rivet_tag_input');
  if (!box || !input) return;
  // 기존 칩 제거
  box.querySelectorAll('.rivet-chip').forEach(function(el) { el.remove(); });
  _rivetTags.forEach(function(tag, i) {
    var chip = document.createElement('div');
    chip.className = 'rivet-chip';
    chip.style.cssText = 'display:inline-flex;align-items:center;gap:5px;padding:4px 10px;' +
      'border-radius:20px;background:var(--accent-blue);color:#fff;font-size:11.5px;font-weight:600;';
    chip.innerHTML = '<span>' + tag + '</span>' +
      '<button onclick="_rivetRemoveTag(' + i + ')" style="width:14px;height:14px;border:none;background:rgba(255,255,255,.3);' +
      'border-radius:50%;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:0;color:#fff;flex-shrink:0">' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">' +
      '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';
    box.insertBefore(chip, input);
  });
}

function _rivetPreview() {
  var bgEl   = document.getElementById('rivet_bg_color');
  var fcEl   = document.getElementById('rivet_font_color');
  var fsEl   = document.getElementById('rivet_font_size');
  var prev   = document.getElementById('rivet_preview');
  var bgLbl  = document.getElementById('rivet_bg_label');
  var fcLbl  = document.getElementById('rivet_font_label');
  if (!prev) return;
  var bg = bgEl ? bgEl.value : '#1e40af';
  var fc = fcEl ? fcEl.value : '#ffffff';
  var fs = fsEl ? fsEl.value : '13';
  if (bgLbl) bgLbl.textContent = bg;
  if (fcLbl) fcLbl.textContent = fc;
  prev.style.background = bg;
  prev.style.color = fc;
  prev.style.fontSize = fs + 'px';
  prev.textContent = _rivetTags.length > 0 ? _rivetTags.join('  ·  ') : '공지 텍스트를 입력하세요';
}

function _rivetSave() {
  var bgEl = document.getElementById('rivet_bg_color');
  var fcEl = document.getElementById('rivet_font_color');
  var fsEl = document.getElementById('rivet_font_size');
  var data = {
    bgColor:   bgEl ? bgEl.value : '#1e40af',
    fontColor: fcEl ? fcEl.value : '#ffffff',
    fontSize:  fsEl ? parseInt(fsEl.value) : 13,
    tags:      _rivetTags.slice()
  };
  try { localStorage.setItem('hp_rivet', JSON.stringify(data)); } catch(e) {}
  if (typeof showToast === 'function') showToast('success', '리벳 설정이 저장되었습니다.');
}

function _rivetRestore() {
  try {
    var raw = localStorage.getItem('hp_rivet');
    if (!raw) return;
    var data = JSON.parse(raw);
    var bgEl = document.getElementById('rivet_bg_color');
    var fcEl = document.getElementById('rivet_font_color');
    var fsEl = document.getElementById('rivet_font_size');
    var lbl  = document.getElementById('rivet_size_label');
    if (bgEl && data.bgColor)   bgEl.value = data.bgColor;
    if (fcEl && data.fontColor) fcEl.value = data.fontColor;
    if (fsEl && data.fontSize)  { fsEl.value = data.fontSize; if (lbl) lbl.textContent = data.fontSize + 'px'; }
    if (Array.isArray(data.tags)) { _rivetTags = data.tags.slice(); _rivetRenderTags(); }
    _rivetPreview();
  } catch(e) {}
}

// hp-basic 진입 시 리벳 복원
var _prev_showHpPage2 = window.showHomepagePage;
window.showHomepagePage = function(pageId, navEl) {
  if (typeof _prev_showHpPage2 === 'function') _prev_showHpPage2(pageId, navEl);
  if (pageId === 'hp-basic') setTimeout(function(){ _hpLogoRestore(); _rivetRestore(); if(typeof refreshIcons==='function') refreshIcons(); }, 100);
};

/* ══ 리벳 정렬 선택 ══ */
function _rivetSetAlign(align) {
  var alignEl = document.getElementById('rivet_align');
  if (alignEl) alignEl.value = align;
  var btns = { left:'rivet_align_left', center:'rivet_align_center', right:'rivet_align_right' };
  Object.keys(btns).forEach(function(k) {
    var el = document.getElementById(btns[k]);
    if (!el) return;
    if (k === align) {
      el.style.background = 'var(--accent-blue)';
      el.style.color = '#fff';
    } else {
      el.style.background = 'transparent';
      el.style.color = 'var(--text-secondary)';
    }
  });
  _rivetPreview();
}

/* ══ 리벳 함수 재정의 (정렬 포함) ══ */
window._rivetPreview = function() {
  var bgEl    = document.getElementById('rivet_bg_color');
  var fcEl    = document.getElementById('rivet_font_color');
  var fsEl    = document.getElementById('rivet_font_size');
  var alEl    = document.getElementById('rivet_align');
  var prev    = document.getElementById('rivet_preview');
  var bgLbl   = document.getElementById('rivet_bg_label');
  var fcLbl   = document.getElementById('rivet_font_label');
  if (!prev) return;
  var bg    = bgEl ? bgEl.value : '#1e40af';
  var fc    = fcEl ? fcEl.value : '#ffffff';
  var fs    = fsEl ? fsEl.value : '13';
  var align = alEl ? alEl.value : 'center';
  if (bgLbl) bgLbl.textContent = bg;
  if (fcLbl) fcLbl.textContent = fc;
  prev.style.background  = bg;
  prev.style.color       = fc;
  prev.style.fontSize    = fs + 'px';
  prev.style.textAlign   = align;
  prev.textContent = _rivetTags.length > 0 ? _rivetTags.join('  ·  ') : '공지 텍스트를 입력하세요';
};

window._rivetSave = function() {
  var bgEl  = document.getElementById('rivet_bg_color');
  var fcEl  = document.getElementById('rivet_font_color');
  var fsEl  = document.getElementById('rivet_font_size');
  var alEl  = document.getElementById('rivet_align');
  var data  = {
    bgColor:   bgEl ? bgEl.value : '#1e40af',
    fontColor: fcEl ? fcEl.value : '#ffffff',
    fontSize:  fsEl ? parseInt(fsEl.value) : 13,
    align:     alEl ? alEl.value : 'center',
    tags:      _rivetTags.slice()
  };
  try { localStorage.setItem('hp_rivet', JSON.stringify(data)); } catch(e) {}
  if (typeof showToast === 'function') showToast('success', '리벳 설정이 저장되었습니다.');
};

window._rivetRestore = function() {
  try {
    var raw = localStorage.getItem('hp_rivet');
    if (!raw) return;
    var data = JSON.parse(raw);
    var bgEl = document.getElementById('rivet_bg_color');
    var fcEl = document.getElementById('rivet_font_color');
    var fsEl = document.getElementById('rivet_font_size');
    var lbl  = document.getElementById('rivet_size_label');
    if (bgEl && data.bgColor)   bgEl.value = data.bgColor;
    if (fcEl && data.fontColor) fcEl.value = data.fontColor;
    if (fsEl && data.fontSize)  { fsEl.value = data.fontSize; if (lbl) lbl.textContent = data.fontSize + 'px'; }
    if (data.align) _rivetSetAlign(data.align);
    if (Array.isArray(data.tags)) { _rivetTags = data.tags.slice(); _rivetRenderTags(); }
    setTimeout(window._rivetPreview, 50);
  } catch(e) {}
};

/* ══ 리벳 정렬 재정의 (window._rivetPreview 참조) ══ */
window._rivetSetAlign = function(align) {
  var alignEl = document.getElementById('rivet_align');
  if (alignEl) alignEl.value = align;
  var map = { left:'rivet_align_left', center:'rivet_align_center', right:'rivet_align_right' };
  Object.keys(map).forEach(function(k) {
    var el = document.getElementById(map[k]);
    if (!el) return;
    if (k === align) {
      el.style.background = 'var(--accent-blue)';
      el.style.color = '#fff';
    } else {
      el.style.background = 'transparent';
      el.style.color = 'var(--text-secondary)';
    }
  });
  // 미리보기에 즉시 반영
  var prev = document.getElementById('rivet_preview');
  if (prev) prev.style.textAlign = align;
  if (typeof window._rivetPreview === 'function') window._rivetPreview();
};

// 정렬 버튼에도 window 버전으로 연결
(function() {
  var ids = ['rivet_align_left','rivet_align_center','rivet_align_right'];
  var vals = ['left','center','right'];
  ids.forEach(function(id, i) {
    var el = document.getElementById(id);
    if (el) { el.onclick = function(){ window._rivetSetAlign(vals[i]); }; }
  });
})();

/* ══ 리벳 태그 추가 - 좌우 스페이스 허용 ══ */
window._rivetAddTag = function() {
  var input = document.getElementById('rivet_tag_input');
  if (!input) return;
  var val = input.value;             // trim() 제거 → 좌우 공백 유지
  if (!val.trim()) return;           // 완전 빈 값은 거부
  _rivetTags.push(val);
  input.value = '';
  _rivetRenderTags();
  if (typeof window._rivetPreview === 'function') window._rivetPreview();
  else if (typeof _rivetPreview === 'function') _rivetPreview();
  input.focus();
};

/* ══ 리벳 태그 렌더 - white-space:pre 적용 ══ */
window._rivetRenderTags = function() {
  var box   = document.getElementById('rivet_tag_box');
  var input = document.getElementById('rivet_tag_input');
  if (!box || !input) return;
  box.querySelectorAll('.rivet-chip').forEach(function(el) { el.remove(); });
  _rivetTags.forEach(function(tag, i) {
    var chip = document.createElement('div');
    chip.className = 'rivet-chip';
    chip.style.cssText = 'display:inline-flex;align-items:center;gap:5px;padding:4px 10px;' +
      'border-radius:20px;background:var(--accent-blue);color:#fff;font-size:11.5px;font-weight:600;';
    // white-space:pre → 좌우 스페이스 그대로 표시
    chip.innerHTML =
      '<span style="white-space:pre">' + tag + '</span>' +
      '<button onclick="(window._rivetRemoveTag||_rivetRemoveTag)(' + i + ')" ' +
      'style="width:14px;height:14px;border:none;background:rgba(255,255,255,.3);' +
      'border-radius:50%;cursor:pointer;display:inline-flex;align-items:center;' +
      'justify-content:center;padding:0;color:#fff;flex-shrink:0">' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">' +
      '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';
    box.insertBefore(chip, input);
  });
};

window._rivetRemoveTag = function(idx) {
  _rivetTags.splice(idx, 1);
  if (typeof window._rivetRenderTags === 'function') window._rivetRenderTags();
  if (typeof window._rivetPreview === 'function') window._rivetPreview();
};

/* ══════════════════════════════════════════
   메인메뉴 설정
══════════════════════════════════════════ */
var _mnTags = [];

function _mnAddTag() {
  var input = document.getElementById('mn_tag_input');
  if (!input) return;
  var val = input.value;
  if (!val.trim()) return;
  _mnTags.push(val);
  input.value = '';
  _mnRenderTags();
  _mnPreview();
  input.focus();
}

function _mnRemoveTag(idx) {
  _mnTags.splice(idx, 1);
  _mnRenderTags();
  _mnPreview();
}

function _mnRenderTags() {
  var box   = document.getElementById('mn_tag_box');
  var input = document.getElementById('mn_tag_input');
  if (!box || !input) return;
  box.querySelectorAll('.mn-chip').forEach(function(el){ el.remove(); });
  _mnTags.forEach(function(tag, i) {
    var chip = document.createElement('div');
    chip.className = 'mn-chip';
    chip.style.cssText = 'display:inline-flex;align-items:center;gap:5px;padding:4px 10px;' +
      'border-radius:20px;background:#6366f1;color:#fff;font-size:11.5px;font-weight:600;';
    chip.innerHTML =
      '<span style="white-space:pre">' + tag + '</span>' +
      '<button onclick="_mnRemoveTag(' + i + ')" ' +
      'style="width:14px;height:14px;border:none;background:rgba(255,255,255,.3);' +
      'border-radius:50%;cursor:pointer;display:inline-flex;align-items:center;' +
      'justify-content:center;padding:0;color:#fff;flex-shrink:0">' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">' +
      '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';
    box.insertBefore(chip, input);
  });
}

function _mnSetAlign(align) {
  var el = document.getElementById('mn_align');
  if (el) el.value = align;
  var map = { left:'mn_align_left', center:'mn_align_center', right:'mn_align_right' };
  Object.keys(map).forEach(function(k) {
    var btn = document.getElementById(map[k]);
    if (!btn) return;
    if (k === align) { btn.style.background = '#6366f1'; btn.style.color = '#fff'; }
    else             { btn.style.background = 'transparent'; btn.style.color = 'var(--text-secondary)'; }
  });
  _mnPreview();
}

function _mnPreview() {
  var prev     = document.getElementById('mn_preview');
  if (!prev) return;
  var bg      = (document.getElementById('mn_bg_color')   || {value:'#ffffff'}).value;
  var fc      = (document.getElementById('mn_font_color') || {value:'#1a1a2e'}).value;
  var fs      = (document.getElementById('mn_font_size')  || {value:'14'}).value;
  var h       = (document.getElementById('mn_height')     || {value:'64'}).value;
  var op      = (document.getElementById('mn_opacity')    || {value:'100'}).value;
  var gap     = (document.getElementById('mn_gap')        || {value:'28'}).value;
  var align   = (document.getElementById('mn_align')      || {value:'center'}).value;

  var bgLbl = document.getElementById('mn_bg_label');
  var fcLbl = document.getElementById('mn_fc_label');
  if (bgLbl) bgLbl.textContent = bg;
  if (fcLbl) fcLbl.textContent = fc;

  // 정렬 → justifyContent
  var jc = { left:'flex-start', center:'center', right:'flex-end' }[align] || 'center';

  prev.style.background      = bg;
  prev.style.opacity         = (parseInt(op) / 100).toFixed(2);
  prev.style.height          = h + 'px';
  prev.style.gap             = gap + 'px';
  prev.style.justifyContent  = jc;

  // 메뉴 항목 렌더
  var items = _mnTags.length > 0 ? _mnTags : ['홈','소개','서비스','문의'];
  prev.innerHTML = items.map(function(t) {
    return '<span style="font-size:' + fs + 'px;color:' + fc + ';cursor:pointer;white-space:pre;' +
           'font-weight:500;padding:4px 2px;transition:opacity .15s" ' +
           'onmouseover="this.style.opacity=\'.65\'" onmouseout="this.style.opacity=\'1\'">' + t + '</span>';
  }).join('');
}

function _mnSave() {
  var data = {
    bgColor:   (document.getElementById('mn_bg_color')   || {value:'#ffffff'}).value,
    fontColor: (document.getElementById('mn_font_color') || {value:'#1a1a2e'}).value,
    fontSize:  parseInt((document.getElementById('mn_font_size')  || {value:'14'}).value),
    height:    parseInt((document.getElementById('mn_height')     || {value:'64'}).value),
    opacity:   parseInt((document.getElementById('mn_opacity')    || {value:'100'}).value),
    gap:       parseInt((document.getElementById('mn_gap')        || {value:'28'}).value),
    align:     (document.getElementById('mn_align')      || {value:'center'}).value,
    menus:     _mnTags.slice()
  };
  try { localStorage.setItem('hp_mainmenu', JSON.stringify(data)); } catch(e) {}
  if (typeof showToast === 'function') showToast('success', '메인메뉴 설정이 저장되었습니다.');
}

function _mnRestore() {
  try {
    var raw = localStorage.getItem('hp_mainmenu');
    if (!raw) return;
    var d = JSON.parse(raw);
    var set = function(id, val) { var el = document.getElementById(id); if (el) el.value = val; };
    if (d.bgColor)   { set('mn_bg_color',   d.bgColor);   var l=document.getElementById('mn_bg_label'); if(l)l.textContent=d.bgColor; }
    if (d.fontColor) { set('mn_font_color', d.fontColor); var l=document.getElementById('mn_fc_label'); if(l)l.textContent=d.fontColor; }
    if (d.fontSize)  { set('mn_font_size',  d.fontSize);  var l=document.getElementById('mn_fs_label'); if(l)l.textContent=d.fontSize+'px'; }
    if (d.height)    { set('mn_height',     d.height);    var l=document.getElementById('mn_height_label'); if(l)l.textContent=d.height+'px'; }
    if (d.opacity)   { set('mn_opacity',    d.opacity);   var l=document.getElementById('mn_opacity_label'); if(l)l.textContent=d.opacity+'%'; }
    if (d.gap)       { set('mn_gap',        d.gap);       var l=document.getElementById('mn_gap_label'); if(l)l.textContent=d.gap+'px'; }
    if (d.align)     _mnSetAlign(d.align);
    if (Array.isArray(d.menus)) { _mnTags = d.menus.slice(); _mnRenderTags(); }
    setTimeout(_mnPreview, 60);
  } catch(e) {}
}

// hp-basic 진입 시 메인메뉴 복원도 포함
var _prev_showHpPage3 = window.showHomepagePage;
window.showHomepagePage = function(pageId, navEl) {
  if (typeof _prev_showHpPage3 === 'function') _prev_showHpPage3(pageId, navEl);
  if (pageId === 'hp-basic') setTimeout(function(){
    _hpLogoRestore(); _rivetRestore(); _mnRestore();
    if (typeof refreshIcons === 'function') refreshIcons();
  }, 100);
};

/* ══ 하단 로고박스 설정 ══ */
function _footerLogoPreview() {
  var box    = document.getElementById('footer_logo_preview_box');
  var bgEl   = document.getElementById('footer_bg_color');
  var hEl    = document.getElementById('footer_height');
  var opEl   = document.getElementById('footer_opacity');
  var bgLbl  = document.getElementById('footer_bg_label');
  if (!box) return;
  var bg  = bgEl  ? bgEl.value  : '#1a1a2e';
  var h   = hEl   ? hEl.value   : '120';
  var op  = opEl  ? opEl.value  : '100';
  if (bgLbl) bgLbl.textContent = bg;
  box.style.background = bg;
  box.style.height     = h + 'px';
  box.style.opacity    = (parseInt(op) / 100).toFixed(2);
  // 저장된 하단 로고 이미지 반영
  var lh = localStorage.getItem('hp_logo_hp_logo_bot_h') || localStorage.getItem('hp_logo_bot_h');
  var lv = localStorage.getItem('hp_logo_hp_logo_bot_v') || localStorage.getItem('hp_logo_bot_v');
  var ph = document.getElementById('footer_preview_logo_h');
  var pv = document.getElementById('footer_preview_logo_v');
  if (ph && lh) ph.innerHTML = '<img src="' + lh + '" style="max-height:' + Math.round(parseInt(h)*0.6) + 'px;max-width:180px;object-fit:contain">';
  if (pv && lv) pv.innerHTML = '<img src="' + lv + '" style="max-height:' + Math.round(parseInt(h)*0.7) + 'px;max-width:100px;object-fit:contain">';
}
function _footerLogoSave() {
  var data = {
    bgColor: (document.getElementById('footer_bg_color') || {value:'#1a1a2e'}).value,
    height:  parseInt((document.getElementById('footer_height')  || {value:'120'}).value),
    opacity: parseInt((document.getElementById('footer_opacity') || {value:'100'}).value)
  };
  try { localStorage.setItem('hp_footer_logobox', JSON.stringify(data)); } catch(e) {}
  if (typeof showToast === 'function') showToast('success', '하단 로고박스 설정이 저장되었습니다.');
}
function _footerLogoRestore() {
  try {
    var raw = localStorage.getItem('hp_footer_logobox');
    if (!raw) { _footerLogoPreview(); return; }
    var d = JSON.parse(raw);
    var set = function(id,val){ var el=document.getElementById(id); if(el)el.value=val; };
    if (d.bgColor) { set('footer_bg_color', d.bgColor); var l=document.getElementById('footer_bg_label'); if(l)l.textContent=d.bgColor; }
    if (d.height)  { set('footer_height',  d.height);  var l=document.getElementById('footer_height_label');  if(l)l.textContent=d.height+'px'; }
    if (d.opacity) { set('footer_opacity', d.opacity); var l=document.getElementById('footer_opacity_label'); if(l)l.textContent=d.opacity+'%'; }
    setTimeout(_footerLogoPreview, 60);
  } catch(e) {}
}

/* ══════════════════════════════════════════
   하단 메뉴 설정
══════════════════════════════════════════ */
var _fmTags = [];

function _fmAddTag() {
  var input = document.getElementById('fm_tag_input');
  if (!input) return;
  var val = input.value;
  if (!val.trim()) return;
  _fmTags.push(val);
  input.value = '';
  _fmRenderTags();
  _fmPreview();
  input.focus();
}
function _fmRemoveTag(idx) {
  _fmTags.splice(idx, 1);
  _fmRenderTags();
  _fmPreview();
}
function _fmRenderTags() {
  var box   = document.getElementById('fm_tag_box');
  var input = document.getElementById('fm_tag_input');
  if (!box || !input) return;
  box.querySelectorAll('.fm-chip').forEach(function(el){ el.remove(); });
  _fmTags.forEach(function(tag, i) {
    var chip = document.createElement('div');
    chip.className = 'fm-chip';
    chip.style.cssText = 'display:inline-flex;align-items:center;gap:5px;padding:4px 10px;' +
      'border-radius:20px;background:#14b8a6;color:#fff;font-size:11.5px;font-weight:600;';
    chip.innerHTML =
      '<span style="white-space:pre">' + tag + '</span>' +
      '<button onclick="_fmRemoveTag(' + i + ')" ' +
      'style="width:14px;height:14px;border:none;background:rgba(255,255,255,.3);' +
      'border-radius:50%;cursor:pointer;display:inline-flex;align-items:center;' +
      'justify-content:center;padding:0;color:#fff;flex-shrink:0">' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">' +
      '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';
    box.insertBefore(chip, input);
  });
}
function _fmSetAlign(align) {
  var el = document.getElementById('fm_align');
  if (el) el.value = align;
  var map = { left:'fm_align_left', center:'fm_align_center', right:'fm_align_right' };
  Object.keys(map).forEach(function(k) {
    var btn = document.getElementById(map[k]);
    if (!btn) return;
    if (k === align) { btn.style.background = '#14b8a6'; btn.style.color = '#fff'; }
    else             { btn.style.background = 'transparent'; btn.style.color = 'var(--text-secondary)'; }
  });
  _fmPreview();
}
function _fmPreview() {
  var prev = document.getElementById('fm_preview');
  if (!prev) return;
  var bg    = (document.getElementById('fm_bg_color')   || {value:'#0f172a'}).value;
  var fc    = (document.getElementById('fm_font_color') || {value:'#94a3b8'}).value;
  var fs    = (document.getElementById('fm_font_size')  || {value:'13'}).value;
  var h     = (document.getElementById('fm_height')     || {value:'56'}).value;
  var op    = (document.getElementById('fm_opacity')    || {value:'100'}).value;
  var gap   = (document.getElementById('fm_gap')        || {value:'24'}).value;
  var align = (document.getElementById('fm_align')      || {value:'center'}).value;
  var bgLbl = document.getElementById('fm_bg_label');
  var fcLbl = document.getElementById('fm_fc_label');
  if (bgLbl) bgLbl.textContent = bg;
  if (fcLbl) fcLbl.textContent = fc;
  var jc = { left:'flex-start', center:'center', right:'flex-end' }[align] || 'center';
  prev.style.background     = bg;
  prev.style.opacity        = (parseInt(op)/100).toFixed(2);
  prev.style.height         = h + 'px';
  prev.style.gap            = gap + 'px';
  prev.style.justifyContent = jc;
  var items = _fmTags.length > 0 ? _fmTags : ['홈','소개','서비스','문의'];
  prev.innerHTML = items.map(function(t) {
    return '<span style="font-size:' + fs + 'px;color:' + fc + ';cursor:pointer;white-space:pre;' +
           'font-weight:400;padding:4px 2px;transition:opacity .15s" ' +
           'onmouseover="this.style.opacity=\'.5\'" onmouseout="this.style.opacity=\'1\'">' + t + '</span>';
  }).join('');
}
function _fmSave() {
  var data = {
    bgColor:   (document.getElementById('fm_bg_color')   || {value:'#0f172a'}).value,
    fontColor: (document.getElementById('fm_font_color') || {value:'#94a3b8'}).value,
    fontSize:  parseInt((document.getElementById('fm_font_size') || {value:'13'}).value),
    height:    parseInt((document.getElementById('fm_height')    || {value:'56'}).value),
    opacity:   parseInt((document.getElementById('fm_opacity')   || {value:'100'}).value),
    gap:       parseInt((document.getElementById('fm_gap')       || {value:'24'}).value),
    align:     (document.getElementById('fm_align') || {value:'center'}).value,
    menus:     _fmTags.slice()
  };
  try { localStorage.setItem('hp_footer_menu', JSON.stringify(data)); } catch(e) {}
  if (typeof showToast === 'function') showToast('success', '하단 메뉴 설정이 저장되었습니다.');
}
function _fmRestore() {
  try {
    var raw = localStorage.getItem('hp_footer_menu');
    if (!raw) { _fmPreview(); return; }
    var d = JSON.parse(raw);
    var set = function(id,val){ var el=document.getElementById(id); if(el)el.value=val; };
    if (d.bgColor)   { set('fm_bg_color',   d.bgColor);   var l=document.getElementById('fm_bg_label'); if(l)l.textContent=d.bgColor; }
    if (d.fontColor) { set('fm_font_color', d.fontColor); var l=document.getElementById('fm_fc_label'); if(l)l.textContent=d.fontColor; }
    if (d.fontSize)  { set('fm_font_size',  d.fontSize);  var l=document.getElementById('fm_fs_label'); if(l)l.textContent=d.fontSize+'px'; }
    if (d.height)    { set('fm_height',     d.height);    var l=document.getElementById('fm_height_label'); if(l)l.textContent=d.height+'px'; }
    if (d.opacity)   { set('fm_opacity',    d.opacity);   var l=document.getElementById('fm_opacity_label'); if(l)l.textContent=d.opacity+'%'; }
    if (d.gap)       { set('fm_gap',        d.gap);       var l=document.getElementById('fm_gap_label'); if(l)l.textContent=d.gap+'px'; }
    if (d.align)     _fmSetAlign(d.align);
    if (Array.isArray(d.menus)) { _fmTags = d.menus.slice(); _fmRenderTags(); }
    setTimeout(_fmPreview, 60);
  } catch(e) {}
}

// hp-basic 진입 시 모든 복원 함수 통합
var _prev_showHpPage4 = window.showHomepagePage;
window.showHomepagePage = function(pageId, navEl) {
  if (typeof _prev_showHpPage4 === 'function') _prev_showHpPage4(pageId, navEl);
  if (pageId === 'hp-basic') setTimeout(function(){
    _hpLogoRestore(); _rivetRestore(); _mnRestore(); _footerLogoRestore(); _fmRestore();
    if (typeof refreshIcons === 'function') refreshIcons();
  }, 100);
};

/* ══════════════════════════════════════════
   하단 텍스트 설정
══════════════════════════════════════════ */
function _ftSetAlign(align) {
  var el = document.getElementById('ft_align');
  if (el) el.value = align;
  var map = { left:'ft_align_left', center:'ft_align_center', right:'ft_align_right' };
  Object.keys(map).forEach(function(k) {
    var btn = document.getElementById(map[k]);
    if (!btn) return;
    if (k === align) { btn.style.background = '#fb923c'; btn.style.color = '#fff'; }
    else             { btn.style.background = 'transparent'; btn.style.color = 'var(--text-secondary)'; }
  });
  _ftPreview();
}

function _ftPreview() {
  var prev     = document.getElementById('ft_preview');
  var prevText = document.getElementById('ft_preview_text');
  if (!prev || !prevText) return;
  var bg    = (document.getElementById('ft_bg_color')   || {value:'#0a0a1a'}).value;
  var fc    = (document.getElementById('ft_font_color') || {value:'#64748b'}).value;
  var fs    = (document.getElementById('ft_font_size')  || {value:'12'}).value;
  var h     = (document.getElementById('ft_height')     || {value:'80'}).value;
  var op    = (document.getElementById('ft_opacity')    || {value:'100'}).value;
  var align = (document.getElementById('ft_align')      || {value:'center'}).value;
  var txt   = (document.getElementById('ft_text')       || {value:''}).value;

  var bgLbl = document.getElementById('ft_bg_label');
  var fcLbl = document.getElementById('ft_fc_label');
  if (bgLbl) bgLbl.textContent = bg;
  if (fcLbl) fcLbl.textContent = fc;

  var jc = { left:'flex-start', center:'center', right:'flex-end' }[align] || 'center';
  prev.style.background     = bg;
  prev.style.opacity        = (parseInt(op)/100).toFixed(2);
  prev.style.minHeight      = h + 'px';
  prev.style.justifyContent = jc;
  prev.style.alignItems     = 'center';

  prevText.style.fontSize  = fs + 'px';
  prevText.style.color     = fc;
  prevText.style.textAlign = align;
  prevText.style.whiteSpace = 'pre-wrap';
  prevText.textContent = txt.trim() ? txt : '© 2025 워크엠. All rights reserved.';
}

function _ftSave() {
  var data = {
    bgColor:   (document.getElementById('ft_bg_color')   || {value:'#0a0a1a'}).value,
    fontColor: (document.getElementById('ft_font_color') || {value:'#64748b'}).value,
    fontSize:  parseInt((document.getElementById('ft_font_size') || {value:'12'}).value),
    height:    parseInt((document.getElementById('ft_height')    || {value:'80'}).value),
    opacity:   parseInt((document.getElementById('ft_opacity')   || {value:'100'}).value),
    align:     (document.getElementById('ft_align') || {value:'center'}).value,
    text:      (document.getElementById('ft_text')  || {value:''}).value
  };
  try { localStorage.setItem('hp_footer_text', JSON.stringify(data)); } catch(e) {}
  if (typeof showToast === 'function') showToast('success', '하단 텍스트 설정이 저장되었습니다.');
}

function _ftRestore() {
  try {
    var raw = localStorage.getItem('hp_footer_text');
    if (!raw) { _ftPreview(); return; }
    var d = JSON.parse(raw);
    var set = function(id,val){ var el=document.getElementById(id); if(el)el.value=val; };
    if (d.bgColor)   { set('ft_bg_color',   d.bgColor);   var l=document.getElementById('ft_bg_label'); if(l)l.textContent=d.bgColor; }
    if (d.fontColor) { set('ft_font_color', d.fontColor); var l=document.getElementById('ft_fc_label'); if(l)l.textContent=d.fontColor; }
    if (d.fontSize)  { set('ft_font_size',  d.fontSize);  var l=document.getElementById('ft_fs_label'); if(l)l.textContent=d.fontSize+'px'; }
    if (d.height)    { set('ft_height',     d.height);    var l=document.getElementById('ft_height_label'); if(l)l.textContent=d.height+'px'; }
    if (d.opacity)   { set('ft_opacity',    d.opacity);   var l=document.getElementById('ft_opacity_label'); if(l)l.textContent=d.opacity+'%'; }
    if (d.align)     _ftSetAlign(d.align);
    if (d.text !== undefined) set('ft_text', d.text);
    setTimeout(_ftPreview, 60);
  } catch(e) {}
}

// hp-basic 진입 시 모든 복원 통합
var _prev_showHpPage5 = window.showHomepagePage;
window.showHomepagePage = function(pageId, navEl) {
  if (typeof _prev_showHpPage5 === 'function') _prev_showHpPage5(pageId, navEl);
  if (pageId === 'hp-basic') setTimeout(function(){
    _hpLogoRestore(); _rivetRestore(); _mnRestore();
    _footerLogoRestore(); _fmRestore(); _ftRestore();
    if (typeof refreshIcons === 'function') refreshIcons();
  }, 100);
};

/* ══════════════════════════════════════════
   하단 카피라이트 설정
══════════════════════════════════════════ */
function _cpSetAlign(align) {
  var el = document.getElementById('cp_align');
  if (el) el.value = align;
  var map = { left:'cp_align_left', center:'cp_align_center', right:'cp_align_right' };
  Object.keys(map).forEach(function(k) {
    var btn = document.getElementById(map[k]);
    if (!btn) return;
    if (k === align) { btn.style.background = '#eab308'; btn.style.color = '#000'; }
    else             { btn.style.background = 'transparent'; btn.style.color = 'var(--text-secondary)'; }
  });
  _cpPreview();
}

function _cpPreview() {
  var prev     = document.getElementById('cp_preview');
  var prevText = document.getElementById('cp_preview_text');
  if (!prev || !prevText) return;
  var bg    = (document.getElementById('cp_bg_color')   || {value:'#050510'}).value;
  var fc    = (document.getElementById('cp_font_color') || {value:'#475569'}).value;
  var fs    = (document.getElementById('cp_font_size')  || {value:'11'}).value;
  var h     = (document.getElementById('cp_height')     || {value:'48'}).value;
  var op    = (document.getElementById('cp_opacity')    || {value:'100'}).value;
  var align = (document.getElementById('cp_align')      || {value:'center'}).value;
  var txt   = (document.getElementById('cp_text')       || {value:''}).value;

  var bgLbl = document.getElementById('cp_bg_label');
  var fcLbl = document.getElementById('cp_fc_label');
  if (bgLbl) bgLbl.textContent = bg;
  if (fcLbl) fcLbl.textContent = fc;

  var jc = { left:'flex-start', center:'center', right:'flex-end' }[align] || 'center';
  prev.style.background     = bg;
  prev.style.opacity        = (parseInt(op)/100).toFixed(2);
  prev.style.minHeight      = h + 'px';
  prev.style.justifyContent = jc;

  prevText.style.fontSize  = fs + 'px';
  prevText.style.color     = fc;
  prevText.style.textAlign = align;
  prevText.style.whiteSpace = 'pre-wrap';
  prevText.textContent = txt.trim() ? txt : '© 2025 워크엠(WorkM). All rights reserved.';
}

function _cpSave() {
  var data = {
    bgColor:   (document.getElementById('cp_bg_color')   || {value:'#050510'}).value,
    fontColor: (document.getElementById('cp_font_color') || {value:'#475569'}).value,
    fontSize:  parseInt((document.getElementById('cp_font_size') || {value:'11'}).value),
    height:    parseInt((document.getElementById('cp_height')    || {value:'48'}).value),
    opacity:   parseInt((document.getElementById('cp_opacity')   || {value:'100'}).value),
    align:     (document.getElementById('cp_align') || {value:'center'}).value,
    text:      (document.getElementById('cp_text')  || {value:''}).value
  };
  try { localStorage.setItem('hp_copyright', JSON.stringify(data)); } catch(e) {}
  if (typeof showToast === 'function') showToast('success', '카피라이트 설정이 저장되었습니다.');
}

function _cpRestore() {
  try {
    var raw = localStorage.getItem('hp_copyright');
    if (!raw) { _cpPreview(); return; }
    var d = JSON.parse(raw);
    var set = function(id,val){ var el=document.getElementById(id); if(el)el.value=val; };
    if (d.bgColor)   { set('cp_bg_color',   d.bgColor);   var l=document.getElementById('cp_bg_label'); if(l)l.textContent=d.bgColor; }
    if (d.fontColor) { set('cp_font_color', d.fontColor); var l=document.getElementById('cp_fc_label'); if(l)l.textContent=d.fontColor; }
    if (d.fontSize)  { set('cp_font_size',  d.fontSize);  var l=document.getElementById('cp_fs_label'); if(l)l.textContent=d.fontSize+'px'; }
    if (d.height)    { set('cp_height',     d.height);    var l=document.getElementById('cp_height_label'); if(l)l.textContent=d.height+'px'; }
    if (d.opacity)   { set('cp_opacity',    d.opacity);   var l=document.getElementById('cp_opacity_label'); if(l)l.textContent=d.opacity+'%'; }
    if (d.align)     _cpSetAlign(d.align);
    if (d.text !== undefined) set('cp_text', d.text);
    setTimeout(_cpPreview, 60);
  } catch(e) {}
}

/* ── hp-basic 진입 시 전체 복원 (최종 통합) ── */
var _prev_showHpPage6 = window.showHomepagePage;
window.showHomepagePage = function(pageId, navEl) {
  if (typeof _prev_showHpPage6 === 'function') _prev_showHpPage6(pageId, navEl);
  if (pageId === 'hp-basic') setTimeout(function(){
    if (typeof _hpLogoRestore    === 'function') _hpLogoRestore();
    if (typeof _rivetRestore     === 'function') _rivetRestore();
    if (typeof _mnRestore        === 'function') _mnRestore();
    if (typeof _footerLogoRestore=== 'function') _footerLogoRestore();
    if (typeof _fmRestore        === 'function') _fmRestore();
    if (typeof _ftRestore        === 'function') _ftRestore();
    if (typeof _cpRestore        === 'function') _cpRestore();
    if (typeof _hpMcInit         === 'function') _hpMcInit();
    if (typeof refreshIcons      === 'function') refreshIcons();
  }, 120);
};

/* ══════════════════════════════════════════
   메뉴등록 관리
══════════════════════════════════════════ */
var _hpMenuItems = [];

function _hpMenuAddItem() {
  var form = document.getElementById('hp_menu_add_form');
  if (!form) return;
  form.style.display = 'block';
  var nameEl = document.getElementById('hp_menu_name');
  if (nameEl) { nameEl.value = ''; nameEl.focus(); }
  var urlEl = document.getElementById('hp_menu_url');
  if (urlEl) urlEl.value = '';
  var blankEl = document.getElementById('hp_menu_blank');
  if (blankEl) blankEl.checked = false;
}

function _hpMenuSaveItem() {
  var nameEl  = document.getElementById('hp_menu_name');
  var urlEl   = document.getElementById('hp_menu_url');
  var blankEl = document.getElementById('hp_menu_blank');
  if (!nameEl) return;
  var name = (nameEl.value || '').trim();
  if (!name) { nameEl.focus(); return; }
  _hpMenuItems.push({ name: name, url: (urlEl ? urlEl.value.trim() : ''), blank: blankEl ? blankEl.checked : false });
  document.getElementById('hp_menu_add_form').style.display = 'none';
  _hpMenuRender();
}

function _hpMenuRemove(idx) {
  _hpMenuItems.splice(idx, 1);
  _hpMenuRender();
}

function _hpMenuMove(idx, dir) {
  var newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= _hpMenuItems.length) return;
  var tmp = _hpMenuItems[idx];
  _hpMenuItems[idx] = _hpMenuItems[newIdx];
  _hpMenuItems[newIdx] = tmp;
  _hpMenuRender();
}

function _hpMenuRender() {
  var list  = document.getElementById('hp_menu_list');
  var empty = document.getElementById('hp_menu_empty');
  if (!list) return;
  list.querySelectorAll('.hp-menu-row').forEach(function(el){ el.remove(); });
  if (_hpMenuItems.length === 0) {
    if (empty) empty.style.display = '';
    return;
  }
  if (empty) empty.style.display = 'none';
  _hpMenuItems.forEach(function(item, i) {
    var row = document.createElement('div');
    row.className = 'hp-menu-row';
    row.style.cssText = 'display:grid;grid-template-columns:40px 1fr 200px 100px 80px;align-items:center;' +
      'padding:10px 16px;border-bottom:1px solid var(--border-color);gap:8px;font-size:13px;' +
      'color:var(--text-primary);transition:background .15s';
    row.onmouseover = function(){ this.style.background = 'var(--bg-secondary)'; };
    row.onmouseout  = function(){ this.style.background = ''; };
    row.innerHTML =
      '<span style="display:flex;gap:2px">' +
        '<button onclick="_hpMenuMove(' + i + ',-1)" title="위로" style="width:16px;height:16px;border:none;background:none;cursor:pointer;padding:0;color:var(--text-muted);display:flex;align-items:center;justify-content:center">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>' +
        '</button>' +
        '<button onclick="_hpMenuMove(' + i + ',1)" title="아래로" style="width:16px;height:16px;border:none;background:none;cursor:pointer;padding:0;color:var(--text-muted);display:flex;align-items:center;justify-content:center">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>' +
        '</button>' +
      '</span>' +
      '<span style="font-weight:600">' + item.name + '</span>' +
      '<span style="font-size:12px;color:var(--text-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (item.url || '<em style="color:var(--text-muted)">미설정</em>') + '</span>' +
      '<span style="text-align:center">' +
        (item.blank ? '<span style="font-size:11px;padding:2px 7px;border-radius:10px;background:rgba(99,102,241,.12);color:#6366f1;font-weight:600">새탭</span>' : '<span style="color:var(--text-muted);font-size:11px">—</span>') +
      '</span>' +
      '<span style="display:flex;gap:6px">' +
        '<button onclick="_hpMenuRemove(' + i + ')" title="삭제" style="width:28px;height:28px;border:none;border-radius:7px;background:rgba(239,68,68,.1);color:#ef4444;cursor:pointer;display:flex;align-items:center;justify-content:center">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>' +
        '</button>' +
      '</span>';
    list.insertBefore(row, list.querySelector('.empty-state') || null);
    list.appendChild(row);
  });
  if (typeof refreshIcons === 'function') refreshIcons();
}

function _hpMenuSaveAll() {
  try { localStorage.setItem('hp_menu_items', JSON.stringify(_hpMenuItems)); } catch(e) {}
  if (typeof showToast === 'function') showToast('success', '메뉴가 저장되었습니다.');
}

function _hpMenuRestore() {
  try {
    var raw = localStorage.getItem('hp_menu_items');
    if (!raw) return;
    _hpMenuItems = JSON.parse(raw) || [];
    _hpMenuRender();
  } catch(e) {}
}

// hp-menu 진입 시 복원
var _prev_showHpPage7 = window.showHomepagePage;
window.showHomepagePage = function(pageId, navEl) {
  if (typeof _prev_showHpPage7 === 'function') _prev_showHpPage7(pageId, navEl);
  if (pageId === 'hp-menu') setTimeout(function(){ _hpMenuRestore(); if(typeof refreshIcons==='function') refreshIcons(); }, 80);
  if (pageId === 'hp-basic') setTimeout(function(){ if(typeof _hpMcInit==='function') _hpMcInit(); }, 80);
};

/* ── 메뉴등록 > 메인메뉴 설정 현황 렌더 ── */
function _hpMenuRenderPreview() {
  var box   = document.getElementById('hp_menu_preview_chips');
  var empty = document.getElementById('hp_menu_preview_empty');
  if (!box) return;

  // localStorage에서 메인메뉴 설정 가져오기
  var tags = [];
  try {
    var raw = localStorage.getItem('hp_mainmenu');
    if (raw) {
      var d = JSON.parse(raw);
      if (Array.isArray(d.menus) && d.menus.length > 0) tags = d.menus;
    }
  } catch(e) {}

  // _mnTags(현재 세션 메모리)가 더 최신이면 우선 사용
  if (typeof _mnTags !== 'undefined' && Array.isArray(_mnTags) && _mnTags.length > 0) tags = _mnTags;

  box.querySelectorAll('.mn-preview-chip').forEach(function(el){ el.remove(); });

  if (tags.length === 0) {
    if (empty) empty.style.display = '';
    return;
  }
  if (empty) empty.style.display = 'none';

  tags.forEach(function(tag, i) {
    var chip = document.createElement('div');
    chip.className = 'mn-preview-chip';
    chip.style.cssText =
      'display:inline-flex;align-items:center;gap:6px;padding:5px 12px;' +
      'border-radius:20px;background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.25);' +
      'font-size:12px;font-weight:600;color:#6366f1;white-space:pre;';
    chip.innerHTML =
      '<span>' + (i + 1) + '</span>' +
      '<span style="color:var(--text-muted);font-weight:400">|</span>' +
      '<span style="white-space:pre">' + tag + '</span>';
    box.appendChild(chip);
  });
}

// hp-menu 진입 시 메인메뉴 현황 함께 렌더
var _prev_showHpPage8 = window.showHomepagePage;
window.showHomepagePage = function(pageId, navEl) {
  if (typeof _prev_showHpPage8 === 'function') _prev_showHpPage8(pageId, navEl);
  if (pageId === 'hp-menu') setTimeout(function(){
    _hpMenuRestore();
    _hpMenuRenderPreview();
    if (typeof refreshIcons === 'function') refreshIcons();
  }, 80);
};

/* ── 메뉴 상세 등록 로직 ── */
var _hpMenuDetails = {};   // { 인덱스: { name, imgH, imgV, url, blank } }
var _hpMenuActiveIdx = -1;

// 칩 클릭 시 상세 카드 열기
function _hpMenuOpenDetail(idx, tag) {
  _hpMenuActiveIdx = idx;
  var card  = document.getElementById('hp_menu_detail_card');
  var title = document.getElementById('hp_menu_detail_title');
  var idxEl = document.getElementById('hp_menu_detail_idx');
  if (!card) return;
  // 칩 활성화 표시
  _hpMenuClearActive();
  var chips = document.querySelectorAll('.mn-preview-chip');
  if (chips[idx]) {
    chips[idx].style.background = '#6366f1';
    chips[idx].style.color = '#fff';
    chips[idx].style.boxShadow = '0 0 0 2px rgba(99,102,241,.35)';
  }
  // 기존 저장값 불러오기
  var saved = _hpMenuDetails[idx] || {};
  if (title) title.textContent = '"' + tag + '" 메뉴 상세 등록';
  if (idxEl) idxEl.value = idx;
  var setVal = function(id, val) { var el = document.getElementById(id); if (el) el.value = val || ''; };
  setVal('hp_menu_detail_name', saved.name || tag);
  setVal('hp_menu_detail_img_h', saved.imgH || '');
  setVal('hp_menu_detail_img_v', saved.imgV || '');
  setVal('hp_menu_detail_url',  saved.url  || '');
  var blankEl = document.getElementById('hp_menu_detail_blank');
  if (blankEl) blankEl.checked = saved.blank || false;
  // 이미지 미리보기 복원
  ['h','v'].forEach(function(t) {
    var imgUrl = t === 'h' ? (saved.imgH||'') : (saved.imgV||'');
    var div = document.getElementById('hp_menu_img_' + t + '_prev');
    if (div) {
      if (imgUrl) { div.style.display='block'; var img=div.querySelector('img'); if(img)img.src=imgUrl; }
      else div.style.display = 'none';
    }
  });
  card.style.display = 'block';
  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  if (typeof refreshIcons === 'function') refreshIcons();
}

function _hpMenuClearActive() {
  document.querySelectorAll('.mn-preview-chip').forEach(function(el) {
    el.style.background = 'rgba(99,102,241,.1)';
    el.style.color = '#6366f1';
    el.style.boxShadow = '';
  });
}

function _hpMenuFilePreview(input, inputId, prevId) {
  var file = input.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    var inputEl = document.getElementById(inputId);
    if (inputEl) inputEl.value = e.target.result;
    var div = document.getElementById(prevId);
    if (div) {
      div.style.display = 'block';
      var img = div.querySelector('img');
      if (img) img.src = e.target.result;
    }
  };
  reader.readAsDataURL(file);
}

function _hpMenuDetailSave() {
  var idx   = parseInt(document.getElementById('hp_menu_detail_idx').value || '0');
  var name  = (document.getElementById('hp_menu_detail_name')  || {value:''}).value;
  var imgH  = (document.getElementById('hp_menu_detail_img_h') || {value:''}).value;
  var imgV  = (document.getElementById('hp_menu_detail_img_v') || {value:''}).value;
  var url   = (document.getElementById('hp_menu_detail_url')   || {value:''}).value;
  var blank = (document.getElementById('hp_menu_detail_blank') || {checked:false}).checked;
  _hpMenuDetails[idx] = { name: name, imgH: imgH, imgV: imgV, url: url, blank: blank };
  try { localStorage.setItem('hp_menu_details', JSON.stringify(_hpMenuDetails)); } catch(e) {}
  document.getElementById('hp_menu_detail_card').style.display = 'none';
  _hpMenuClearActive();
  if (typeof showToast === 'function') showToast('success', '"' + name + '" 메뉴 정보가 저장되었습니다.');
}

// _hpMenuRenderPreview 재정의: 칩 클릭 이벤트 포함
window._hpMenuRenderPreview = function() {
  var box   = document.getElementById('hp_menu_preview_chips');
  var empty = document.getElementById('hp_menu_preview_empty');
  if (!box) return;
  var tags = [];
  try {
    var raw = localStorage.getItem('hp_mainmenu');
    if (raw) { var d = JSON.parse(raw); if (Array.isArray(d.menus) && d.menus.length) tags = d.menus; }
  } catch(e) {}
  if (typeof _mnTags !== 'undefined' && Array.isArray(_mnTags) && _mnTags.length) tags = _mnTags;
  // 상세 저장값 복원
  try {
    var dr = localStorage.getItem('hp_menu_details');
    if (dr) _hpMenuDetails = JSON.parse(dr) || {};
  } catch(e) {}
  box.querySelectorAll('.mn-preview-chip').forEach(function(el){ el.remove(); });
  if (tags.length === 0) { if (empty) empty.style.display = ''; return; }
  if (empty) empty.style.display = 'none';
  tags.forEach(function(tag, i) {
    var chip = document.createElement('div');
    chip.className = 'mn-preview-chip';
    chip.style.cssText =
      'display:inline-flex;align-items:center;gap:6px;padding:6px 14px;' +
      'border-radius:20px;background:rgba(99,102,241,.1);border:1.5px solid rgba(99,102,241,.2);' +
      'font-size:12px;font-weight:600;color:#6366f1;white-space:pre;cursor:pointer;' +
      'transition:all .15s;user-select:none';
    chip.title = '클릭하여 상세 등록';
    chip.innerHTML =
      '<span style="opacity:.6">' + (i+1) + '</span>' +
      '<span style="opacity:.3;font-weight:400">|</span>' +
      '<span>' + tag + '</span>' +
      (_hpMenuDetails[i] ? '<span style="width:6px;height:6px;border-radius:50%;background:#22c55e;flex-shrink:0"></span>' : '');
    chip.onclick = (function(idx, t){ return function(){ _hpMenuOpenDetail(idx, t); }; })(i, tag);
    chip.onmouseover = function(){ if(this.style.boxShadow === '') this.style.background='rgba(99,102,241,.18)'; };
    chip.onmouseout  = function(){ if(this.style.boxShadow === '') this.style.background='rgba(99,102,241,.1)'; };
    box.appendChild(chip);
  });
};

/* ── 메뉴 상세 등록 v2 (테이블 행 관리) ── */
var _hpMenuRowData = {};   // { menuIdx: [ {imgH, imgV, url, blank}, ... ] }

function _hpMenuDetailAddRow() {
  var idx = parseInt(document.getElementById('hp_menu_detail_idx').value || '0');
  if (!_hpMenuRowData[idx]) _hpMenuRowData[idx] = [];
  _hpMenuRowData[idx].push({ imgH:'', imgV:'', url:'', blank:false });
  _hpMenuDetailRenderRows(idx);
}

function _hpMenuDetailRemoveRow(menuIdx, rowIdx) {
  if (!_hpMenuRowData[menuIdx]) return;
  _hpMenuRowData[menuIdx].splice(rowIdx, 1);
  _hpMenuDetailRenderRows(menuIdx);
}

function _hpMenuDetailRenderRows(menuIdx) {
  var container = document.getElementById('hp_menu_detail_rows');
  var empty     = document.getElementById('hp_menu_detail_rows_empty');
  if (!container) return;
  container.querySelectorAll('.hp-detail-row').forEach(function(el){ el.remove(); });
  var rows = _hpMenuRowData[menuIdx] || [];
  if (rows.length === 0) { if (empty) empty.style.display=''; return; }
  if (empty) empty.style.display = 'none';
  rows.forEach(function(row, ri) {
    var rowEl = document.createElement('div');
    rowEl.className = 'hp-detail-row';
    rowEl.style.cssText =
      'display:grid;grid-template-columns:1fr 1fr 1fr 80px 36px;gap:8px;align-items:center;' +
      'padding:8px 10px;border-bottom:1px solid var(--border-color);transition:background .15s';
    rowEl.onmouseover = function(){ this.style.background='var(--bg-secondary)'; };
    rowEl.onmouseout  = function(){ this.style.background=''; };

    // 각 셀 생성 함수
    function makeImgCell(field, fileId) {
      var wrap = document.createElement('div');
      wrap.style.cssText = 'position:relative;display:flex;flex-direction:column;gap:4px';
      var inp = document.createElement('input');
      inp.style.cssText = 'border:1px solid var(--border-color);border-radius:7px;padding:5px 52px 5px 8px;font-size:12px;width:100%;box-sizing:border-box;background:var(--bg-secondary);color:var(--text-primary);outline:none';
      inp.placeholder = 'URL 또는 파일';
      inp.value = row[field] || '';
      inp.oninput = function(){ _hpMenuRowData[menuIdx][ri][field] = this.value; };
      var fileInp = document.createElement('input');
      fileInp.type = 'file'; fileInp.accept = 'image/*'; fileInp.style.display='none';
      fileInp.id = fileId + '_' + menuIdx + '_' + ri;
      fileInp.onchange = function() {
        var f = this.files[0]; if (!f) return;
        var reader = new FileReader();
        reader.onload = function(e) {
          inp.value = e.target.result;
          _hpMenuRowData[menuIdx][ri][field] = e.target.result;
          if (prev.style.display === 'none') { prev.style.display='block'; img.src=e.target.result; }
          else img.src = e.target.result;
        };
        reader.readAsDataURL(f);
      };
      var btn = document.createElement('button');
      btn.textContent = '파일';
      btn.style.cssText = 'position:absolute;right:4px;top:5px;padding:2px 6px;border-radius:5px;border:1px solid var(--border-color);background:var(--bg-tertiary);font-size:10px;color:var(--text-secondary);cursor:pointer';
      btn.onclick = function(){ fileInp.click(); };
      var prev = document.createElement('div');
      prev.style.display = row[field] ? 'block' : 'none';
      var img = document.createElement('img');
      img.style.cssText = 'max-width:100%;max-height:48px;border-radius:5px;border:1px solid var(--border-color);object-fit:contain';
      if (row[field]) img.src = row[field];
      prev.appendChild(img);
      wrap.appendChild(inp); wrap.appendChild(fileInp); wrap.appendChild(btn); wrap.appendChild(prev);
      return wrap;
    }

    // 가로이미지
    rowEl.appendChild(makeImgCell('imgH', 'row_file_h'));
    // 세로이미지
    rowEl.appendChild(makeImgCell('imgV', 'row_file_v'));

    // 링크 URL
    var urlWrap = document.createElement('div');
    var urlInp = document.createElement('input');
    urlInp.style.cssText = 'border:1px solid var(--border-color);border-radius:7px;padding:5px 8px;font-size:12px;width:100%;box-sizing:border-box;background:var(--bg-secondary);color:var(--text-primary);outline:none';
    urlInp.placeholder = '/page 또는 https://';
    urlInp.value = row.url || '';
    urlInp.oninput = function(){ _hpMenuRowData[menuIdx][ri].url = this.value; };
    urlWrap.appendChild(urlInp);
    rowEl.appendChild(urlWrap);

    // 새탭
    var blankWrap = document.createElement('div');
    blankWrap.style.cssText = 'display:flex;justify-content:center';
    var blankChk = document.createElement('input');
    blankChk.type = 'checkbox';
    blankChk.style.cssText = 'width:16px;height:16px;accent-color:#6366f1;cursor:pointer';
    blankChk.checked = row.blank || false;
    blankChk.onchange = function(){ _hpMenuRowData[menuIdx][ri].blank = this.checked; };
    blankWrap.appendChild(blankChk);
    rowEl.appendChild(blankWrap);

    // 삭제
    var delWrap = document.createElement('div');
    delWrap.style.cssText = 'display:flex;justify-content:center';
    var delBtn = document.createElement('button');
    delBtn.style.cssText = 'width:28px;height:28px;border:none;border-radius:7px;background:rgba(239,68,68,.1);color:#ef4444;cursor:pointer;display:flex;align-items:center;justify-content:center';
    delBtn.title = '삭제';
    delBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>';
    delBtn.onclick = (function(mi,ri){ return function(){ _hpMenuDetailRemoveRow(mi,ri); }; })(menuIdx, ri);
    delWrap.appendChild(delBtn);
    rowEl.appendChild(delWrap);

    container.appendChild(rowEl);
  });
}

// _hpMenuDetailSave 재정의
window._hpMenuDetailSave = function() {
  var idx  = parseInt(document.getElementById('hp_menu_detail_idx').value || '0');
  var name = (document.getElementById('hp_menu_detail_name') || {value:''}).value;
  if (!_hpMenuDetails) _hpMenuDetails = {};
  _hpMenuDetails[idx] = { name: name, rows: (_hpMenuRowData[idx] || []).slice() };
  try { localStorage.setItem('hp_menu_details', JSON.stringify(_hpMenuDetails)); } catch(e) {}
  document.getElementById('hp_menu_detail_card').style.display = 'none';
  _hpMenuClearActive();
  // 초록 점 갱신
  if (typeof window._hpMenuRenderPreview === 'function') window._hpMenuRenderPreview();
  if (typeof showToast === 'function') showToast('success', '"' + (name||'메뉴') + '" 상세 정보가 저장되었습니다.');
};

// _hpMenuOpenDetail 재정의: 행 데이터 복원 포함
window._hpMenuOpenDetail = function(idx, tag) {
  _hpMenuActiveIdx = idx;
  var card = document.getElementById('hp_menu_detail_card');
  var title = document.getElementById('hp_menu_detail_title');
  var idxEl = document.getElementById('hp_menu_detail_idx');
  if (!card) return;
  _hpMenuClearActive();
  var chips = document.querySelectorAll('.mn-preview-chip');
  if (chips[idx]) { chips[idx].style.background='#6366f1'; chips[idx].style.color='#fff'; chips[idx].style.boxShadow='0 0 0 2px rgba(99,102,241,.35)'; }

  // 저장된 상세 정보 복원
  try {
    var dr = localStorage.getItem('hp_menu_details');
    if (dr) _hpMenuDetails = JSON.parse(dr) || {};
  } catch(e) {}

  var saved = _hpMenuDetails[idx] || {};
  if (title) title.textContent = '"' + tag + '" 메뉴 상세 등록';
  if (idxEl) idxEl.value = idx;
  var nameEl = document.getElementById('hp_menu_detail_name');
  if (nameEl) nameEl.value = saved.name || tag;

  // 행 데이터 복원
  _hpMenuRowData[idx] = Array.isArray(saved.rows) ? JSON.parse(JSON.stringify(saved.rows)) : [];
  _hpMenuDetailRenderRows(idx);

  card.style.display = 'block';
  card.scrollIntoView({ behavior:'smooth', block:'nearest' });
  if (typeof refreshIcons === 'function') refreshIcons();
};

/* ══ +메뉴 추가 버튼 → 인라인 폼 열기 ══ */

// 기존 _hpMenuAddItem 재정의
window._hpMenuAddItem = function() {
  var form  = document.getElementById('hp_quick_add_form');
  var input = document.getElementById('hp_quick_add_input');
  if (!form) return;
  form.style.display = 'block';
  if (input) { input.value = ''; input.focus(); }
  if (typeof refreshIcons === 'function') refreshIcons();
};

function _hpQuickAddCancel() {
  var form = document.getElementById('hp_quick_add_form');
  if (form) form.style.display = 'none';
}

function _hpQuickAddMenu() {
  var input = document.getElementById('hp_quick_add_input');
  if (!input) return;
  var name = input.value.trim();
  if (!name) { input.focus(); return; }

  // localStorage의 hp_mainmenu menus 배열에 추가
  var tags = [];
  try {
    var raw = localStorage.getItem('hp_mainmenu');
    if (raw) {
      var d = JSON.parse(raw);
      if (Array.isArray(d.menus)) tags = d.menus;
      d.menus = tags;
      d.menus.push(name);
      localStorage.setItem('hp_mainmenu', JSON.stringify(d));
      tags = d.menus;
    } else {
      tags = [name];
      localStorage.setItem('hp_mainmenu', JSON.stringify({ menus: tags }));
    }
  } catch(e) { tags.push(name); }

  // 세션 _mnTags 동기화
  if (typeof _mnTags !== 'undefined') _mnTags = tags.slice();

  // 추가된 메뉴 임시 표시
  var list = document.getElementById('hp_quick_added_list');
  if (list) {
    var chip = document.createElement('span');
    chip.style.cssText =
      'display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:14px;' +
      'background:rgba(99,102,241,.12);border:1px solid rgba(99,102,241,.25);' +
      'font-size:11px;color:#6366f1;font-weight:600;white-space:pre';
    chip.innerHTML = '<i data-lucide="check" style="width:10px;height:10px"></i>' + name;
    list.appendChild(chip);
    if (typeof refreshIcons === 'function') refreshIcons();
  }

  input.value = '';
  input.focus();

  // 칩 목록 전체 재렌더링
  if (typeof window._hpMenuRenderPreview === 'function') window._hpMenuRenderPreview();
};

/* ══ 메뉴 상세 등록: 타이틀 & 레이블 동적 업데이트 ══ */

// 현재 열린 메뉴의 메인메뉴명 저장
var _hpMenuCurrentTag = '';

// 레이블 업데이트: "[메인메뉴] > [서브메뉴] 이미지 & 링크 목록"
function _hpMenuUpdateImgLabel() {
  var lbl  = document.getElementById('hp_menu_detail_img_label');
  var name = (document.getElementById('hp_menu_detail_name') || {value:''}).value.trim();
  if (!lbl) return;
  if (name) {
    lbl.innerHTML = '<strong style="color:var(--text-primary)">' + _hpMenuCurrentTag + '</strong>' +
      '<span style="color:var(--text-muted);margin:0 4px">›</span>' +
      '<strong style="color:var(--text-primary)">' + name + '</strong>' +
      '<span style="color:var(--text-muted);margin-left:4px">이미지 &amp; 링크 목록</span>';
  } else {
    lbl.textContent = '이미지 & 링크 목록';
  }
}

// _hpMenuOpenDetail 재정의: 타이틀 "서브메뉴 등록"으로 변경
var _prev_hpMenuOpenDetail = window._hpMenuOpenDetail;
window._hpMenuOpenDetail = function(idx, tag) {
  _hpMenuCurrentTag = tag;
  if (typeof _prev_hpMenuOpenDetail === 'function') _prev_hpMenuOpenDetail(idx, tag);
  // 타이틀 변경: "메뉴 상세 등록" → "서브메뉴 등록"
  var title = document.getElementById('hp_menu_detail_title');
  if (title) title.textContent = '\u201c' + tag + '\u201d \uc11c\ube0c\uba54\ub274 \ub4f1\ub85d';
  // 레이블 초기화 (저장된 서브메뉴명 반영)
  setTimeout(_hpMenuUpdateImgLabel, 30);
};

/* ══════════════════════════════════════════
   서브메뉴 세트 방식 등록 v3
   데이터: _hpMenuDetails[menuIdx] = {
     sets: [ { name:'', rows:[{imgH,imgV,url,blank},...] }, ... ]
   }
══════════════════════════════════════════ */
var _hpSubSets = {};  // { menuIdx: [ { name, rows:[...] }, ... ] }

/* 세트 추가 */
function _hpSubMenuAddSet() {
  var idx = parseInt((document.getElementById('hp_menu_detail_idx')||{value:'0'}).value);
  if (!_hpSubSets[idx]) _hpSubSets[idx] = [];
  _hpSubSets[idx].push({ name: '', rows: [] });
  _hpSubMenuRenderSets(idx);
  // 새 세트로 스크롤
  var cont = document.getElementById('hp_submenu_sets');
  if (cont) cont.lastElementChild && cont.lastElementChild.scrollIntoView({ behavior:'smooth', block:'nearest' });
}

/* 세트 삭제 */
function _hpSubMenuRemoveSet(menuIdx, setIdx) {
  if (!_hpSubSets[menuIdx]) return;
  _hpSubSets[menuIdx].splice(setIdx, 1);
  _hpSubMenuRenderSets(menuIdx);
}

/* 세트 내 행 추가 */
function _hpSubMenuAddRow(menuIdx, setIdx) {
  if (!_hpSubSets[menuIdx] || !_hpSubSets[menuIdx][setIdx]) return;
  _hpSubSets[menuIdx][setIdx].rows.push({ imgH:'', imgV:'', url:'', blank:false });
  _hpSubMenuRenderSets(menuIdx);
}

/* 세트 내 행 삭제 */
function _hpSubMenuRemoveRow(menuIdx, setIdx, rowIdx) {
  if (!_hpSubSets[menuIdx] || !_hpSubSets[menuIdx][setIdx]) return;
  _hpSubSets[menuIdx][setIdx].rows.splice(rowIdx, 1);
  _hpSubMenuRenderSets(menuIdx);
}

/* 전체 세트 렌더링 */
function _hpSubMenuRenderSets(menuIdx) {
  var cont = document.getElementById('hp_submenu_sets');
  if (!cont) return;
  cont.innerHTML = '';
  var sets = _hpSubSets[menuIdx] || [];

  if (sets.length === 0) {
    cont.innerHTML = '<div style="padding:24px;text-align:center;border:1.5px dashed var(--border-color);border-radius:10px;color:var(--text-muted);font-size:12px">' +
      '서브메뉴 추가 버튼으로 서브메뉴를 등록하세요</div>';
    return;
  }

  sets.forEach(function(set, si) {
    var wrap = document.createElement('div');
    wrap.style.cssText =
      'border:1.5px solid var(--border-color);border-radius:10px;overflow:hidden;background:var(--bg-primary)';

    // ── 세트 헤더 ──
    var hdr = document.createElement('div');
    hdr.style.cssText =
      'display:flex;align-items:center;gap:8px;padding:10px 14px;' +
      'background:var(--bg-secondary);border-bottom:1px solid var(--border-color)';
    hdr.innerHTML =
      '<div style="width:20px;height:20px;border-radius:6px;background:rgba(99,102,241,.15);display:flex;align-items:center;justify-content:center;flex-shrink:0">' +
        '<span style="font-size:10px;font-weight:800;color:#6366f1">' + (si+1) + '</span>' +
      '</div>' +
      '<span style="font-size:12px;font-weight:700;color:var(--text-primary)">서브메뉴 ' + (si+1) + '</span>';

    // 삭제 버튼
    var delBtn = document.createElement('button');
    delBtn.title = '이 세트 삭제';
    delBtn.style.cssText =
      'margin-left:auto;width:24px;height:24px;border:none;border-radius:6px;' +
      'background:rgba(239,68,68,.1);color:#ef4444;cursor:pointer;' +
      'display:flex;align-items:center;justify-content:center;flex-shrink:0';
    delBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    delBtn.onclick = (function(mi,si){ return function(){ _hpSubMenuRemoveSet(mi,si); }; })(menuIdx, si);
    hdr.appendChild(delBtn);

    // ── 세트 바디 ──
    var body = document.createElement('div');
    body.style.cssText = 'padding:14px';

    // 메뉴명
    var nameWrap = document.createElement('div');
    nameWrap.style.cssText = 'margin-bottom:12px';
    var nameLabel = document.createElement('label');
    nameLabel.style.cssText = 'display:flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:var(--text-secondary);margin-bottom:5px';
    nameLabel.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg> 서브메뉴명';
    var nameInp = document.createElement('input');
    nameInp.className = 'form-input';
    nameInp.placeholder = '서브메뉴명을 입력하세요 (예: 인사말)';
    nameInp.value = set.name || '';
    nameInp.style.width = '100%';
    nameInp.oninput = (function(mi,si){ return function(){ _hpSubSets[mi][si].name = this.value; }; })(menuIdx, si);
    nameWrap.appendChild(nameLabel);
    nameWrap.appendChild(nameInp);
    body.appendChild(nameWrap);

    // 이미지 & 링크 테이블 섹션
    var tblWrap = document.createElement('div');

    // 테이블 헤더 행
    var tblTop = document.createElement('div');
    tblTop.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:6px';
    var tblLbl = document.createElement('span');
    tblLbl.style.cssText = 'font-size:11px;font-weight:600;color:var(--text-secondary);display:flex;align-items:center;gap:5px';
    tblLbl.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="3"/></svg> ' +
      (_hpMenuCurrentTag && set.name ? '<strong style="color:var(--text-primary)">' + _hpMenuCurrentTag + '</strong><span style="color:var(--text-muted);margin:0 4px">›</span><strong style="color:var(--text-primary)">' + (set.name||'서브메뉴'+(si+1)) + '</strong><span style="color:var(--text-muted);margin-left:4px">이미지 &amp; 링크 목록</span>' : '이미지 &amp; 링크 목록');

    var addRowBtn = document.createElement('button');
    addRowBtn.style.cssText =
      'display:flex;align-items:center;gap:4px;padding:3px 9px;border-radius:7px;' +
      'border:1px solid var(--accent-blue);background:rgba(59,130,246,.07);' +
      'color:var(--accent-blue);font-size:11px;font-weight:600;cursor:pointer';
    addRowBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> 항목 추가';
    addRowBtn.onclick = (function(mi,si){ return function(){ _hpSubMenuAddRow(mi,si); }; })(menuIdx, si);
    tblTop.appendChild(tblLbl);
    tblTop.appendChild(addRowBtn);
    tblWrap.appendChild(tblTop);

    // 컬럼 헤더
    var colHdr = document.createElement('div');
    colHdr.style.cssText =
      'display:grid;grid-template-columns:1fr 1fr 1fr 70px 34px;gap:6px;align-items:center;' +
      'padding:6px 10px;background:var(--bg-tertiary);border-radius:8px 8px 0 0;' +
      'border:1px solid var(--border-color);border-bottom:none;' +
      'font-size:10px;font-weight:700;color:var(--text-muted)';
    colHdr.innerHTML = '<span>가로 이미지</span><span>세로 이미지</span><span>링크 URL</span><span>새탭</span><span></span>';
    tblWrap.appendChild(colHdr);

    // 행 영역
    var rowCont = document.createElement('div');
    rowCont.style.cssText =
      'border:1px solid var(--border-color);border-radius:0 0 8px 8px;min-height:44px;overflow:hidden';

    if (!set.rows || set.rows.length === 0) {
      rowCont.innerHTML = '<div style="padding:14px;text-align:center;font-size:11px;color:var(--text-muted)">+ 항목 추가 버튼으로 행을 추가하세요</div>';
    } else {
      set.rows.forEach(function(row, ri) {
        var rowEl = document.createElement('div');
        rowEl.style.cssText =
          'display:grid;grid-template-columns:1fr 1fr 1fr 70px 34px;gap:6px;align-items:center;' +
          'padding:7px 10px;border-bottom:1px solid var(--border-color);transition:background .15s';
        rowEl.onmouseover = function(){ this.style.background='var(--bg-secondary)'; };
        rowEl.onmouseout  = function(){ this.style.background=''; };

        function makeImgCell(field) {
          var w = document.createElement('div');
          w.style.cssText = 'display:flex;flex-direction:column;gap:3px';
          var row2 = document.createElement('div');
          row2.style.cssText = 'position:relative;display:flex';
          var inp = document.createElement('input');
          inp.style.cssText = 'flex:1;border:1px solid var(--border-color);border-radius:6px;padding:4px 46px 4px 7px;font-size:11px;background:var(--bg-secondary);color:var(--text-primary);outline:none;min-width:0';
          inp.placeholder = 'URL 또는 파일';
          inp.value = row[field]||'';
          inp.oninput = (function(mi,si,ri,f){ return function(){ _hpSubSets[mi][si].rows[ri][f]=this.value; }; })(menuIdx,si,ri,field);
          var fileInp = document.createElement('input');
          fileInp.type='file'; fileInp.accept='image/*'; fileInp.style.display='none';
          fileInp.onchange = (function(mi,si,ri,f,el,prev){ return function(){
            var file=this.files[0]; if(!file) return;
            var reader=new FileReader();
            reader.onload=function(e){ el.value=e.target.result; _hpSubSets[mi][si].rows[ri][f]=e.target.result; prev.style.display='block'; prev.querySelector('img').src=e.target.result; };
            reader.readAsDataURL(file);
          }; })(menuIdx,si,ri,field,inp,w);
          var fb = document.createElement('button');
          fb.textContent='파일';
          fb.style.cssText='position:absolute;right:3px;top:3px;padding:1px 5px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-tertiary);font-size:10px;color:var(--text-secondary);cursor:pointer';
          fb.onclick=function(){ fileInp.click(); };
          var prev=document.createElement('div'); prev.style.display=row[field]?'block':'none';
          var img=document.createElement('img'); img.style.cssText='max-width:100%;max-height:40px;border-radius:4px;border:1px solid var(--border-color);object-fit:contain';
          if(row[field]) img.src=row[field];
          prev.appendChild(img);
          row2.appendChild(inp); row2.appendChild(fileInp); row2.appendChild(fb);
          w.appendChild(row2); w.appendChild(prev);
          return w;
        }

        rowEl.appendChild(makeImgCell('imgH'));
        rowEl.appendChild(makeImgCell('imgV'));

        var urlW=document.createElement('div');
        var urlInp=document.createElement('input');
        urlInp.style.cssText='border:1px solid var(--border-color);border-radius:6px;padding:4px 7px;font-size:11px;width:100%;box-sizing:border-box;background:var(--bg-secondary);color:var(--text-primary);outline:none';
        urlInp.placeholder='/page 또는 https://';
        urlInp.value=row.url||'';
        urlInp.oninput=(function(mi,si,ri){ return function(){ _hpSubSets[mi][si].rows[ri].url=this.value; }; })(menuIdx,si,ri);
        urlW.appendChild(urlInp); rowEl.appendChild(urlW);

        var blankW=document.createElement('div'); blankW.style.cssText='display:flex;justify-content:center';
        var chk=document.createElement('input'); chk.type='checkbox'; chk.style.cssText='width:15px;height:15px;accent-color:#6366f1;cursor:pointer'; chk.checked=row.blank||false;
        chk.onchange=(function(mi,si,ri){ return function(){ _hpSubSets[mi][si].rows[ri].blank=this.checked; }; })(menuIdx,si,ri);
        blankW.appendChild(chk); rowEl.appendChild(blankW);

        var delW=document.createElement('div'); delW.style.cssText='display:flex;justify-content:center';
        var dBtn=document.createElement('button');
        dBtn.style.cssText='width:26px;height:26px;border:none;border-radius:6px;background:rgba(239,68,68,.1);color:#ef4444;cursor:pointer;display:flex;align-items:center;justify-content:center';
        dBtn.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>';
        dBtn.onclick=(function(mi,si,ri){ return function(){ _hpSubMenuRemoveRow(mi,si,ri); }; })(menuIdx,si,ri);
        delW.appendChild(dBtn); rowEl.appendChild(delW);

        rowCont.appendChild(rowEl);
      });
    }
    tblWrap.appendChild(rowCont);
    body.appendChild(tblWrap);
    wrap.appendChild(hdr);
    wrap.appendChild(body);
    cont.appendChild(wrap);
  });
}

// _hpMenuDetailSave 재정의: sets 저장
window._hpMenuDetailSave = function() {
  var idx = parseInt((document.getElementById('hp_menu_detail_idx')||{value:'0'}).value);
  if (!_hpMenuDetails) _hpMenuDetails = {};
  _hpMenuDetails[idx] = { sets: (_hpSubSets[idx]||[]).map(function(s){ return JSON.parse(JSON.stringify(s)); }) };
  try { localStorage.setItem('hp_menu_details', JSON.stringify(_hpMenuDetails)); } catch(e) {}
  document.getElementById('hp_menu_detail_card').style.display = 'none';
  _hpMenuClearActive();
  if (typeof window._hpMenuRenderPreview === 'function') window._hpMenuRenderPreview();
  if (typeof showToast === 'function') showToast('success', '서브메뉴 정보가 저장되었습니다.');
};

// _hpMenuOpenDetail 재정의: sets 복원
var _prev_hpMenuOpenDetail2 = window._hpMenuOpenDetail;
window._hpMenuOpenDetail = function(idx, tag) {
  _hpMenuCurrentTag = tag;
  _hpMenuActiveIdx  = idx;
  var card  = document.getElementById('hp_menu_detail_card');
  var title = document.getElementById('hp_menu_detail_title');
  var idxEl = document.getElementById('hp_menu_detail_idx');
  if (!card) return;
  _hpMenuClearActive();
  var chips = document.querySelectorAll('.mn-preview-chip');
  if (chips[idx]) { chips[idx].style.background='#6366f1'; chips[idx].style.color='#fff'; chips[idx].style.boxShadow='0 0 0 2px rgba(99,102,241,.35)'; }
  // 저장된 데이터 복원
  try { var dr=localStorage.getItem('hp_menu_details'); if(dr) _hpMenuDetails=JSON.parse(dr)||{}; } catch(e) {}
  var saved = _hpMenuDetails[idx] || {};
  if (title) title.textContent = '\u201c' + tag + '\u201d \uc11c\ube0c\uba54\ub274 \ub4f1\ub85d';
  if (idxEl) idxEl.value = idx;
  // sets 복원
  _hpSubSets[idx] = Array.isArray(saved.sets) ? JSON.parse(JSON.stringify(saved.sets)) : [];
  // 세트가 없으면 기본 1개 추가
  if (_hpSubSets[idx].length === 0) _hpSubSets[idx].push({ name:'', rows:[] });
  _hpSubMenuRenderSets(idx);
  card.style.display = 'block';
  card.scrollIntoView({ behavior:'smooth', block:'nearest' });
  if (typeof refreshIcons === 'function') refreshIcons();
};

/* ══ 서브메뉴 세트 v4: 이미지형 / 솔루션형 스위치 ══ */

var _hpSolutionItems = [
  { id:'terms',    label:'이용약관',         icon:'scroll-text' },
  { id:'privacy',  label:'개인정보 취급방침', icon:'shield-check' },
  { id:'board',    label:'게시판',           icon:'message-square' },
  { id:'biz',      label:'거래처관리',        icon:'briefcase' },
  { id:'content',  label:'컨텐츠관리',        icon:'layout-panel-left' },
  { id:'faq',      label:'자주묻는질문',      icon:'help-circle' },
  { id:'notice',   label:'공지사항',          icon:'bell' },
  { id:'contact',  label:'문의하기',          icon:'mail' },
  { id:'gallery',  label:'갤러리',            icon:'image' },
  { id:'about',    label:'소개페이지',        icon:'users' }
];

window._hpSubMenuRenderSets = function(menuIdx) {
  var cont = document.getElementById('hp_submenu_sets');
  if (!cont) return;
  cont.innerHTML = '';
  var sets = _hpSubSets[menuIdx] || [];

  if (sets.length === 0) {
    cont.innerHTML =
      '<div style="padding:24px;text-align:center;border:1.5px dashed var(--border-color);' +
      'border-radius:10px;color:var(--text-muted);font-size:12px">' +
      '서브메뉴 추가 버튼으로 서브메뉴를 등록하세요</div>';
    return;
  }

  sets.forEach(function(set, si) {
    if (!set.type) set.type = 'image';

    var wrap = document.createElement('div');
    wrap.style.cssText =
      'border:1.5px solid var(--border-color);border-radius:10px;overflow:hidden;background:var(--bg-primary)';

    /* ── 세트 헤더 ── */
    var hdr = document.createElement('div');
    hdr.style.cssText =
      'display:flex;align-items:center;gap:8px;padding:10px 14px;' +
      'background:var(--bg-secondary);border-bottom:1px solid var(--border-color)';

    // 번호 + 서브메뉴 N 라벨
    hdr.innerHTML =
      '<div style="width:20px;height:20px;border-radius:6px;background:rgba(99,102,241,.15);' +
      'display:flex;align-items:center;justify-content:center;flex-shrink:0">' +
        '<span style="font-size:10px;font-weight:800;color:#6366f1">' + (si+1) + '</span>' +
      '</div>' +
      '<span style="font-size:12px;font-weight:700;color:var(--text-primary)">서브메뉴 ' + (si+1) + '</span>';

    /* ── 이미지형 / 솔루션형 스위치 ── */
    var swWrap = document.createElement('div');
    swWrap.style.cssText =
      'display:flex;align-items:center;gap:0;border:1.5px solid var(--border-color);' +
      'border-radius:8px;overflow:hidden;margin-left:8px';

    function makeTypeBtn(label, val) {
      var btn = document.createElement('button');
      btn.textContent = label;
      btn.dataset.val = val;
      var active = set.type === val;
      btn.style.cssText =
        'padding:4px 11px;border:none;font-size:11px;font-weight:' + (active?'700':'500') + ';cursor:pointer;' +
        'background:' + (active?'#6366f1':'transparent') + ';' +
        'color:' + (active?'#fff':'var(--text-secondary)') + ';' +
        'transition:all .15s;white-space:nowrap';
      btn.onclick = (function(mi,si,v,sw){ return function() {
        _hpSubSets[mi][si].type = v;
        sw.querySelectorAll('button').forEach(function(b){
          var isA = b.dataset.val === v;
          b.style.background = isA?'#6366f1':'transparent';
          b.style.color      = isA?'#fff':'var(--text-secondary)';
          b.style.fontWeight = isA?'700':'500';
        });
        // 바디 교체
        var body = wrap.querySelector('.hp-set-body');
        if (body) { body.innerHTML=''; _hpSubMenuRenderBody(body, mi, si); }
      }; })(menuIdx, si, val, swWrap);
      return btn;
    }
    swWrap.appendChild(makeTypeBtn('이미지형', 'image'));
    swWrap.appendChild(makeTypeBtn('솔루션형', 'solution'));
    hdr.appendChild(swWrap);

    // 삭제 버튼
    var delBtn = document.createElement('button');
    delBtn.style.cssText =
      'margin-left:auto;width:24px;height:24px;border:none;border-radius:6px;' +
      'background:rgba(239,68,68,.1);color:#ef4444;cursor:pointer;' +
      'display:flex;align-items:center;justify-content:center;flex-shrink:0';
    delBtn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"' +
      ' fill="none" stroke="currentColor" stroke-width="2.5">' +
      '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    delBtn.onclick = (function(mi,si){ return function(){ _hpSubMenuRemoveSet(mi,si); }; })(menuIdx, si);
    hdr.appendChild(delBtn);

    /* ── 세트 바디 ── */
    var body = document.createElement('div');
    body.className = 'hp-set-body';
    body.style.cssText = 'padding:14px';
    _hpSubMenuRenderBody(body, menuIdx, si);

    wrap.appendChild(hdr);
    wrap.appendChild(body);
    cont.appendChild(wrap);
  });
};

/* 바디 렌더: 이미지형 vs 솔루션형 */
function _hpSubMenuRenderBody(body, menuIdx, si) {
  body.innerHTML = '';
  var set = _hpSubSets[menuIdx][si];

  if (set.type === 'solution') {
    /* ── 솔루션형 UI ── */
    var soLabel = document.createElement('div');
    soLabel.style.cssText = 'font-size:11px;font-weight:600;color:var(--text-secondary);margin-bottom:10px;display:flex;align-items:center;gap:5px';
    soLabel.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><line x1="12" y1="17" x2="12" y2="21"/></svg> 솔루션 선택 (복수 선택 가능)';
    body.appendChild(soLabel);

    var grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px';

    _hpSolutionItems.forEach(function(item) {
      var sel = Array.isArray(set.solutions) && set.solutions.indexOf(item.id) !== -1;
      var card = document.createElement('div');
      card.style.cssText =
        'display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:9px;cursor:pointer;' +
        'border:1.5px solid ' + (sel?'#6366f1':'var(--border-color)') + ';' +
        'background:' + (sel?'rgba(99,102,241,.08)':'var(--bg-secondary)') + ';' +
        'transition:all .15s;user-select:none';

      var iconEl = document.createElement('div');
      iconEl.style.cssText =
        'width:28px;height:28px;border-radius:7px;flex-shrink:0;display:flex;align-items:center;justify-content:center;' +
        'background:' + (sel?'rgba(99,102,241,.15)':'var(--bg-tertiary)');
      iconEl.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" ' +
        'stroke="' + (sel?'#6366f1':'var(--text-muted)') + '" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';

      var txt = document.createElement('span');
      txt.style.cssText = 'font-size:12px;font-weight:' + (sel?'700':'500') + ';color:' + (sel?'#6366f1':'var(--text-primary)');
      txt.textContent = item.label;

      var chk = document.createElement('div');
      chk.style.cssText =
        'width:16px;height:16px;border-radius:4px;margin-left:auto;flex-shrink:0;' +
        'border:1.5px solid ' + (sel?'#6366f1':'var(--border-color)') + ';' +
        'background:' + (sel?'#6366f1':'transparent') + ';display:flex;align-items:center;justify-content:center';
      if (sel) chk.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';

      card.appendChild(iconEl);
      card.appendChild(txt);
      card.appendChild(chk);

      card.onclick = (function(mi,si,id,el){ return function() {
        if (!_hpSubSets[mi][si].solutions) _hpSubSets[mi][si].solutions = [];
        var arr = _hpSubSets[mi][si].solutions;
        var idx = arr.indexOf(id);
        if (idx === -1) arr.push(id);
        else arr.splice(idx,1);
        // 바디 재렌더
        var body = el.closest('.hp-set-body');
        if (body) { body.innerHTML=''; _hpSubMenuRenderBody(body,mi,si); }
      }; })(menuIdx, si, item.id, card);

      grid.appendChild(card);
    });
    body.appendChild(grid);

  } else {
    /* ── 이미지형 UI (기존) ── */
    // 서브메뉴명
    var nameWrap = document.createElement('div');
    nameWrap.style.cssText = 'margin-bottom:12px';
    var nLbl = document.createElement('label');
    nLbl.style.cssText = 'display:flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:var(--text-secondary);margin-bottom:5px';
    nLbl.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg> 서브메뉴명';
    var nInp = document.createElement('input');
    nInp.className = 'form-input';
    nInp.placeholder = '서브메뉴명을 입력하세요 (예: 인사말)';
    nInp.value = set.name || '';
    nInp.style.width = '100%';
    nInp.oninput = (function(mi,si){ return function(){ _hpSubSets[mi][si].name=this.value; }; })(menuIdx,si);
    nameWrap.appendChild(nLbl);
    nameWrap.appendChild(nInp);
    body.appendChild(nameWrap);

    // 이미지 & 링크 테이블
    var tblWrap = document.createElement('div');
    var tblTop = document.createElement('div');
    tblTop.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:6px';
    var tblLbl = document.createElement('span');
    tblLbl.style.cssText = 'font-size:11px;font-weight:600;color:var(--text-secondary);display:flex;align-items:center;gap:5px';
    var subtitle = _hpMenuCurrentTag && set.name
      ? '<strong style="color:var(--text-primary)">' + _hpMenuCurrentTag + '</strong><span style="color:var(--text-muted);margin:0 4px">›</span><strong style="color:var(--text-primary)">' + set.name + '</strong><span style="color:var(--text-muted);margin-left:4px">이미지 & 링크 목록</span>'
      : '이미지 &amp; 링크 목록';
    tblLbl.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="3"/></svg> ' + subtitle;
    var addRowBtn = document.createElement('button');
    addRowBtn.style.cssText = 'display:flex;align-items:center;gap:4px;padding:3px 9px;border-radius:7px;border:1px solid var(--accent-blue);background:rgba(59,130,246,.07);color:var(--accent-blue);font-size:11px;font-weight:600;cursor:pointer';
    addRowBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> 항목 추가';
    addRowBtn.onclick = (function(mi,si){ return function(){ _hpSubMenuAddRow(mi,si); }; })(menuIdx,si);
    tblTop.appendChild(tblLbl); tblTop.appendChild(addRowBtn); tblWrap.appendChild(tblTop);

    var colHdr = document.createElement('div');
    colHdr.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1fr 70px 34px;gap:6px;align-items:center;padding:6px 10px;background:var(--bg-tertiary);border-radius:8px 8px 0 0;border:1px solid var(--border-color);border-bottom:none;font-size:10px;font-weight:700;color:var(--text-muted)';
    colHdr.innerHTML = '<span>가로 이미지</span><span>세로 이미지</span><span>링크 URL</span><span>새탭</span><span></span>';
    tblWrap.appendChild(colHdr);

    var rowCont = document.createElement('div');
    rowCont.style.cssText = 'border:1px solid var(--border-color);border-radius:0 0 8px 8px;min-height:44px;overflow:hidden';
    if (!set.rows || set.rows.length === 0) {
      rowCont.innerHTML = '<div style="padding:14px;text-align:center;font-size:11px;color:var(--text-muted)">+ 항목 추가 버튼으로 행을 추가하세요</div>';
    } else {
      set.rows.forEach(function(row, ri) {
        var rowEl = document.createElement('div');
        rowEl.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1fr 70px 34px;gap:6px;align-items:center;padding:7px 10px;border-bottom:1px solid var(--border-color);transition:background .15s';
        rowEl.onmouseover=function(){this.style.background='var(--bg-secondary)';}; rowEl.onmouseout=function(){this.style.background='';};
        function makeImgCell(field) {
          var w=document.createElement('div'); w.style.cssText='display:flex;flex-direction:column;gap:3px';
          var r2=document.createElement('div'); r2.style.cssText='position:relative;display:flex';
          var inp=document.createElement('input'); inp.style.cssText='flex:1;border:1px solid var(--border-color);border-radius:6px;padding:4px 46px 4px 7px;font-size:11px;background:var(--bg-secondary);color:var(--text-primary);outline:none;min-width:0'; inp.placeholder='URL 또는 파일'; inp.value=row[field]||'';
          inp.oninput=(function(mi,si,ri,f){return function(){_hpSubSets[mi][si].rows[ri][f]=this.value;};})(menuIdx,si,ri,field);
          var fi=document.createElement('input'); fi.type='file'; fi.accept='image/*'; fi.style.display='none';
          fi.onchange=(function(mi,si,ri,f,el,pv){return function(){var fl=this.files[0];if(!fl)return;var rd=new FileReader();rd.onload=function(e){el.value=e.target.result;_hpSubSets[mi][si].rows[ri][f]=e.target.result;pv.style.display='block';pv.querySelector('img').src=e.target.result;};rd.readAsDataURL(fl);};})(menuIdx,si,ri,field,inp,w);
          var fb=document.createElement('button'); fb.textContent='파일'; fb.style.cssText='position:absolute;right:3px;top:3px;padding:1px 5px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-tertiary);font-size:10px;color:var(--text-secondary);cursor:pointer'; fb.onclick=function(){fi.click();};
          var pv=document.createElement('div'); pv.style.display=row[field]?'block':'none'; var img=document.createElement('img'); img.style.cssText='max-width:100%;max-height:40px;border-radius:4px;border:1px solid var(--border-color);object-fit:contain'; if(row[field])img.src=row[field]; pv.appendChild(img);
          r2.appendChild(inp);r2.appendChild(fi);r2.appendChild(fb); w.appendChild(r2);w.appendChild(pv); return w;
        }
        rowEl.appendChild(makeImgCell('imgH')); rowEl.appendChild(makeImgCell('imgV'));
        var uW=document.createElement('div'); var uInp=document.createElement('input'); uInp.style.cssText='border:1px solid var(--border-color);border-radius:6px;padding:4px 7px;font-size:11px;width:100%;box-sizing:border-box;background:var(--bg-secondary);color:var(--text-primary);outline:none'; uInp.placeholder='/page 또는 https://'; uInp.value=row.url||''; uInp.oninput=(function(mi,si,ri){return function(){_hpSubSets[mi][si].rows[ri].url=this.value;};})(menuIdx,si,ri); uW.appendChild(uInp); rowEl.appendChild(uW);
        var bW=document.createElement('div'); bW.style.cssText='display:flex;justify-content:center'; var chk=document.createElement('input'); chk.type='checkbox'; chk.style.cssText='width:15px;height:15px;accent-color:#6366f1;cursor:pointer'; chk.checked=row.blank||false; chk.onchange=(function(mi,si,ri){return function(){_hpSubSets[mi][si].rows[ri].blank=this.checked;};})(menuIdx,si,ri); bW.appendChild(chk); rowEl.appendChild(bW);
        var dW=document.createElement('div'); dW.style.cssText='display:flex;justify-content:center'; var dBtn=document.createElement('button'); dBtn.style.cssText='width:26px;height:26px;border:none;border-radius:6px;background:rgba(239,68,68,.1);color:#ef4444;cursor:pointer;display:flex;align-items:center;justify-content:center'; dBtn.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>'; dBtn.onclick=(function(mi,si,ri){return function(){_hpSubMenuRemoveRow(mi,si,ri);};})(menuIdx,si,ri); dW.appendChild(dBtn); rowEl.appendChild(dW);
        rowCont.appendChild(rowEl);
      });
    }
    tblWrap.appendChild(rowCont);
    body.appendChild(tblWrap);
  }
}

/* ══ 솔루션 선택 단수 선택으로 수정 ══ */
var _prev_hpSubMenuRenderBody = window._hpSubMenuRenderBody;
window._hpSubMenuRenderBody = function(body, menuIdx, si) {
  var set = _hpSubSets[menuIdx][si];
  if (set.type !== 'solution') {
    // 이미지형은 기존 함수 그대로 사용
    _prev_hpSubMenuRenderBody(body, menuIdx, si);
    return;
  }

  body.innerHTML = '';

  // 저장 키를 solution (단수 문자열)로 통일
  var currentSel = set.solution || (Array.isArray(set.solutions) && set.solutions.length ? set.solutions[0] : '');

  var soLabel = document.createElement('div');
  soLabel.style.cssText = 'font-size:11px;font-weight:600;color:var(--text-secondary);margin-bottom:10px;display:flex;align-items:center;gap:5px';
  soLabel.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
    '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><line x1="12" y1="17" x2="12" y2="21"/></svg> 솔루션 선택';
  body.appendChild(soLabel);

  var grid = document.createElement('div');
  grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px';

  _hpSolutionItems.forEach(function(item) {
    var sel = currentSel === item.id;
    var card = document.createElement('div');
    card.style.cssText =
      'display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:9px;cursor:pointer;' +
      'border:1.5px solid ' + (sel ? '#6366f1' : 'var(--border-color)') + ';' +
      'background:' + (sel ? 'rgba(99,102,241,.08)' : 'var(--bg-secondary)') + ';' +
      'transition:all .15s;user-select:none';

    // 라디오 원 아이콘
    var radio = document.createElement('div');
    radio.style.cssText =
      'width:16px;height:16px;border-radius:50%;border:1.5px solid ' + (sel ? '#6366f1' : 'var(--border-color)') + ';' +
      'background:' + (sel ? '#6366f1' : 'transparent') + ';flex-shrink:0;' +
      'display:flex;align-items:center;justify-content:center;transition:all .15s';
    if (sel) radio.innerHTML =
      '<div style="width:6px;height:6px;border-radius:50%;background:#fff"></div>';

    var txt = document.createElement('span');
    txt.style.cssText =
      'font-size:12px;font-weight:' + (sel ? '700' : '500') + ';' +
      'color:' + (sel ? '#6366f1' : 'var(--text-primary)') + ';flex:1';
    txt.textContent = item.label;

    card.appendChild(radio);
    card.appendChild(txt);

    card.onclick = (function(mi, si, id, el) {
      return function() {
        // 단수: 해당 항목만 저장
        _hpSubSets[mi][si].solution = id;
        delete _hpSubSets[mi][si].solutions; // 구 배열 제거
        var b = el.closest('.hp-set-body');
        if (b) { b.innerHTML = ''; _hpSubMenuRenderBody(b, mi, si); }
      };
    })(menuIdx, si, item.id, card);

    grid.appendChild(card);
  });

  body.appendChild(grid);
};

/* ══ 진행보고 업무결과 칩 렌더 (_initTdResultChips) ══ */
function _initTdResultChips(taskId) {
  var cont = document.getElementById('tdResultChips_' + taskId);
  if (!cont) return;

  // WS.taskResults 또는 localStorage
  var results = [];
  try { results = JSON.parse(localStorage.getItem('ws_task_results') || '[]'); } catch(e) {}
  if (!results.length) results = WS.taskResults || [];
  if (!results.length) results = [
    {name:'정상완료', icon:'check-circle',  color:'#22c55e'},
    {name:'진행중',   icon:'refresh-cw',    color:'#06b6d4'},
    {name:'부분완료', icon:'git-branch',    color:'#f59e0b'},
    {name:'보류',     icon:'pause-circle',  color:'#6b7280'},
    {name:'취소',     icon:'x-circle',      color:'#ef4444'}
  ];

  cont.innerHTML = results.map(function(r) {
    var c   = r.color || '#6b7280';
    var ico = r.icon  || 'check-circle';
    var lbl = r.name;
    // td_reportIconVal에 저장할 형식: icon|label|color
    var val = ico + '|' + lbl + '|' + c;
    var iconHtml = (ico && ico.length > 2)
      ? '<i data-lucide="' + ico + '" style="width:11px;height:11px"></i>'
      : '';
    return '<span onclick="_tdSelectResult(this,' + JSON.stringify(val) + ',' + JSON.stringify(lbl) + ',' + JSON.stringify(c) + ')"'
      + ' style="display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;'
      + 'font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;user-select:none;'
      + 'border:1.5px solid ' + c + ';color:' + c + ';background:transparent"'
      + ' onmouseover="if(!this.classList.contains(\'active\'))this.style.background=\'' + c + '22\'"'
      + ' onmouseout="if(!this.classList.contains(\'active\'))this.style.background=\'transparent\'">'
      + iconHtml + lbl + '</span>';
  }).join('');

  if (typeof refreshIcons === 'function') refreshIcons();
}

function _tdSelectResult(el, val, lbl, col) {
  // 같은 컨테이너의 다른 칩 선택 해제
  var cont = el.parentElement;
  cont.querySelectorAll('span').forEach(function(s) {
    s.classList.remove('active');
    s.style.background = 'transparent';
    s.style.fontWeight = '600';
  });
  el.classList.add('active');
  el.style.background = col;
  el.style.color = '#ffffff';
  el.style.fontWeight = '700';

  // hidden inputs에 저장
  var rt = document.getElementById('td_reportText');
  var ri = document.getElementById('td_reportIconVal');
  if (rt) rt.value = lbl;
  if (ri) ri.value = val;
}

/* ══ _initTdResultChips v2: instr.reportContent 기반 초기 선택 ══ */
window._initTdResultChips = function(taskId) {
  var cont = document.getElementById('tdResultChips_' + taskId);
  if (!cont) return;

  // 현재 instr 의 reportContent 읽기 (모달이 열릴 때 window._currentInstrData에 저장됨)
  var instrReport = '';
  try {
    var instrList = JSON.parse(localStorage.getItem('ws_instructions') || '[]');
    var t = WS.getTask(taskId);
    if (t) {
      var tid = t.id;
      var instr = instrList.find(function(i) {
        return i.id === tid || i.id === Number(tid) ||
          (i.taskId && (i.taskId === tid || i.taskId === String(tid) || i.taskId === Number(tid)));
      });
      if (instr) instrReport = instr.reportContent || instr.report || '';
    }
  } catch(e) {}

  // WS.taskResults 또는 localStorage ws_task_results
  var results = [];
  try { results = JSON.parse(localStorage.getItem('ws_task_results') || '[]'); } catch(e) {}
  if (!results.length) results = WS.taskResults || [];
  if (!results.length) results = [
    {name:'정상완료', icon:'check-circle',  color:'#22c55e'},
    {name:'진행중',   icon:'refresh-cw',    color:'#06b6d4'},
    {name:'부분완료', icon:'git-branch',    color:'#f59e0b'},
    {name:'보류',     icon:'pause-circle',  color:'#6b7280'},
    {name:'취소',     icon:'x-circle',      color:'#ef4444'}
  ];

  // instr.reportContent에서 선택된 항목 파싱 (쉼표 구분)
  var preSelected = instrReport ? instrReport.split(',').map(function(s){ return s.trim(); }).filter(Boolean) : [];

  cont.innerHTML = results.map(function(r) {
    var c   = r.color || '#6b7280';
    var ico = r.icon  || 'check-circle';
    var lbl = r.name;
    var val = ico + '|' + lbl + '|' + c;
    var isSelected = preSelected.indexOf(lbl) !== -1;
    var iconHtml = (ico && ico.length > 2)
      ? '<i data-lucide="' + ico + '" style="width:11px;height:11px"></i>'
      : '';
    return '<span onclick="_tdSelectResult(this,' + JSON.stringify(val) + ',' + JSON.stringify(lbl) + ',' + JSON.stringify(c) + ')"'
      + ' class="' + (isSelected ? 'active' : '') + '"'
      + ' style="display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;'
      + 'font-size:12px;font-weight:' + (isSelected ? '700' : '600') + ';cursor:pointer;transition:all .15s;user-select:none;'
      + 'border:1.5px solid ' + c + ';'
      + 'color:' + (isSelected ? '#fff' : c) + ';'
      + 'background:' + (isSelected ? c : 'transparent') + '"'
      + (isSelected ? '' : ' onmouseover="if(!this.classList.contains(\'active\'))this.style.background=\'' + c + '22\'"'
                        + ' onmouseout="if(!this.classList.contains(\'active\'))this.style.background=\'transparent\'"')
      + '>'
      + iconHtml + lbl + '</span>';
  }).join('');

  // 기존 선택된 항목 hidden input에도 반영 (첫 번째 선택값)
  if (preSelected.length > 0) {
    var firstResult = results.find(function(r){ return r.name === preSelected[0]; });
    if (firstResult) {
      var rtV = document.getElementById('td_reportText');
      var riV = document.getElementById('td_reportIconVal');
      if (rtV) rtV.value = preSelected[0];
      if (riV) riV.value = (firstResult.icon||'check-circle') + '|' + preSelected[0] + '|' + (firstResult.color||'#6b7280');
    }
  }

  if (typeof refreshIcons === 'function') refreshIcons();
};

/* ══ 업무완료 결과 리스트 칩 렌더 함수 ══ */
window._renderReportContentChips = function(rc) {
  if (!rc) return '<span style="color:var(--text-muted);font-size:12px">-</span>';
  var results = [];
  try { results = JSON.parse(localStorage.getItem('ws_task_results') || '[]'); } catch(e) {}
  if (!results.length) results = (window.WS && WS.taskResults) || [];
  var chips = rc.split(',').map(function(name) {
    name = name.trim();
    if (!name) return '';
    var r = results.find(function(x){ return x.name === name; }) || {};
    var c   = r.color || '#6b7280';
    var ico = r.icon  || 'check-circle';
    return '<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 9px;'
      + 'border-radius:12px;border:1.5px solid ' + c + ';color:' + c + ';'
      + 'background:' + c + '18;font-size:11px;font-weight:700;white-space:nowrap">'
      + '<i data-lucide="' + ico + '" style="width:10px;height:10px"></i>' + name
      + '</span>';
  }).filter(Boolean).join(' ');
  return chips || '<span style="color:var(--text-muted);font-size:12px">-</span>';
};

/* ══════════════════════════════════════════════
   기본설정 > 메인컨텐츠 등록 관리
══════════════════════════════════════════════ */
window._hpMcData = [];   // [{type:'image'|'solution', items:[{imgH,imgV,url,desc}]}]

/* 초기 렌더 (1개 기본 세트) */
function _hpMcInit() {
  try { window._hpMcData = JSON.parse(localStorage.getItem('hp_mc_data') || '[]'); } catch(e){ window._hpMcData=[]; }
  if (!window._hpMcData.length) window._hpMcData = [{ type:'image', items:[], solution:'' }];
  _hpMcRender();
}

/* 전체 렌더 */
function _hpMcRender() {
  var wrap = document.getElementById('hp_mc_lines');
  if (!wrap) return;
  wrap.innerHTML = '';
  (window._hpMcData || []).forEach(function(ln, i) {
    wrap.appendChild(_hpMcBuildLine(ln, i));
  });
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 0);
}

/* 라인 DOM 생성 */
function _hpMcBuildLine(ln, i) {
  var wrap = document.createElement('div');
  wrap.style.cssText = 'border:1.5px solid var(--border-color);border-radius:12px;overflow:hidden';

  /* ── 라인 헤더 ── */
  var hdr = document.createElement('div');
  hdr.style.cssText = 'display:flex;align-items:center;gap:8px;padding:9px 14px;background:var(--bg-secondary)';

  var numBadge = document.createElement('span');
  numBadge.style.cssText = 'width:20px;height:20px;border-radius:50%;background:#4f6ef7;color:#fff;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0';
  numBadge.textContent = i + 1;
  hdr.appendChild(numBadge);

  var label = document.createElement('span');
  label.style.cssText = 'font-size:12px;font-weight:700;color:var(--text-primary)';
  label.textContent = '컨텐츠 ' + (i + 1) + '라인';
  hdr.appendChild(label);

  /* 이미지형 / 솔루션형 토글 */
  ['image', 'solution'].forEach(function(t) {
    var btn = document.createElement('button');
    var active = (ln.type || 'image') === t;
    btn.textContent = t === 'image' ? '이미지형' : '솔루션형';
    btn.style.cssText = 'padding:3px 12px;border-radius:20px;border:none;cursor:pointer;font-size:11.5px;font-weight:700;transition:all .15s;' +
      (active ? 'background:#4f6ef7;color:#fff;' : 'background:var(--bg-tertiary);color:var(--text-muted);');
    btn.onclick = (function(idx, type){ return function(){ _hpMcSetType(idx, type); }; })(i, t);
    hdr.appendChild(btn);
  });

  /* 삭제 버튼 */
  var del = document.createElement('button');
  del.innerHTML = '<i data-lucide="x" style="width:12px;height:12px"></i>';
  del.style.cssText = 'margin-left:auto;width:22px;height:22px;border:none;border-radius:6px;background:rgba(239,68,68,.1);color:#ef4444;cursor:pointer;display:flex;align-items:center;justify-content:center';
  del.onclick = (function(idx){ return function(){ window._hpMcData.splice(idx,1); _hpMcRender(); }; })(i);
  hdr.appendChild(del);
  wrap.appendChild(hdr);

  /* ── 본문 ── */
  if ((ln.type || 'image') === 'image') {
    /* 이미지 & 링크 목록 */
    var body = document.createElement('div');
    body.style.cssText = 'padding:12px 14px';

    var tblHdr = document.createElement('div');
    tblHdr.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:8px';
    tblHdr.innerHTML = '<i data-lucide="image" style="width:12px;height:12px;color:var(--text-muted)"></i>' +
      '<span style="font-size:11.5px;font-weight:700;color:var(--text-secondary)">이미지 &amp; 링크 목록</span>';
    var addBtn = document.createElement('button');
    addBtn.innerHTML = '<i data-lucide="plus" style="width:11px;height:11px"></i> 항목 추가';
    addBtn.style.cssText = 'margin-left:auto;display:flex;align-items:center;gap:4px;padding:3px 10px;border-radius:7px;border:1.5px solid #4f6ef7;background:rgba(79,110,247,.07);color:#4f6ef7;font-size:11px;font-weight:700;cursor:pointer';
    addBtn.onclick = (function(idx){ return function(){ _hpMcAddItem(idx); }; })(i);
    tblHdr.appendChild(addBtn);
    body.appendChild(tblHdr);

    /* 테이블 */
    var tbl = document.createElement('div');
    tbl.style.cssText = 'border:1px solid var(--border-color);border-radius:8px;overflow:hidden';

    var colHdr = document.createElement('div');
    colHdr.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1.5fr 1fr 36px;background:var(--bg-tertiary);padding:7px 10px;gap:8px;border-bottom:1px solid var(--border-color)';
    ['가로 이미지','세로 이미지','링크 URL','설명',''].forEach(function(c){
      var th = document.createElement('div');
      th.style.cssText = 'font-size:10.5px;font-weight:700;color:var(--text-muted)';
      th.textContent = c;
      colHdr.appendChild(th);
    });
    tbl.appendChild(colHdr);

    if (!ln.items || !ln.items.length) {
      var empty = document.createElement('div');
      empty.style.cssText = 'padding:18px;text-align:center;font-size:12px;color:var(--text-muted)';
      empty.textContent = '+ 항목 추가 버튼으로 항목을 추가하세요';
      tbl.appendChild(empty);
    } else {
      ln.items.forEach(function(item, j) {
        var row = document.createElement('div');
        row.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1.5fr 1fr 36px;padding:6px 10px;gap:8px;align-items:center;border-top:1px solid var(--border-color)';
        ['imgH','imgV','url','desc'].forEach(function(f){
          var inp = document.createElement('input');
          inp.value = item[f] || '';
          inp.placeholder = f === 'url' ? 'https://' : (f === 'imgH' ? '가로 이미지 URL' : f === 'imgV' ? '세로 이미지 URL' : '설명');
          inp.style.cssText = 'width:100%;border:1px solid var(--border-color);border-radius:6px;padding:5px 8px;font-size:11.5px;background:var(--bg-secondary);color:var(--text-primary);outline:none;box-sizing:border-box';
          inp.oninput = (function(li,ji,field){ return function(){ window._hpMcData[li].items[ji][field]=this.value; }; })(i,j,f);
          row.appendChild(inp);
        });
        var dl = document.createElement('button');
        dl.innerHTML = '×';
        dl.style.cssText = 'width:28px;height:28px;border:none;border-radius:6px;background:rgba(239,68,68,.1);color:#ef4444;cursor:pointer;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center';
        dl.onclick = (function(li,ji){ return function(){ window._hpMcData[li].items.splice(ji,1); _hpMcRender(); }; })(i,j);
        row.appendChild(dl);
        tbl.appendChild(row);
      });
    }
    body.appendChild(tbl);
    wrap.appendChild(body);

  } else {
    /* 솔루션형 - 솔루션 목록 선택 */
    var sBody = document.createElement('div');
    sBody.style.cssText = 'padding:12px 14px;display:flex;flex-wrap:wrap;gap:8px';
    var solutions = ['홈페이지 이용약관','개인정보 취급방침','게시판','거래처관리','컨텐츠관리','일정관리','업무관리','고객관리','인사관리','재무관리'];
    solutions.forEach(function(s) {
      var b = document.createElement('button');
      b.textContent = s;
      var sel = (ln.solution || '') === s;
      b.style.cssText = 'padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;border:1.5px solid ' +
        (sel ? '#4f6ef7;background:#4f6ef7;color:#fff' : 'var(--border-color);background:var(--bg-secondary);color:var(--text-secondary)');
      b.onclick = (function(idx, sv){ return function(){
        window._hpMcData[idx].solution = sv;
        _hpMcRender();
      }; })(i, s);
      sBody.appendChild(b);
    });
    wrap.appendChild(sBody);
  }
  return wrap;
}

function _hpMcSetType(idx, type) {
  if (window._hpMcData[idx]) { window._hpMcData[idx].type = type; _hpMcRender(); }
}
function _hpMcAddLine() {
  (window._hpMcData = window._hpMcData || []).push({ type:'image', items:[], solution:'' });
  _hpMcRender();
}
function _hpMcAddItem(idx) {
  if (!window._hpMcData[idx].items) window._hpMcData[idx].items = [];
  window._hpMcData[idx].items.push({ imgH:'', imgV:'', url:'', desc:'' });
  _hpMcRender();
}
function _hpMcSave() {
  try { localStorage.setItem('hp_mc_data', JSON.stringify(window._hpMcData || [])); } catch(e){}
  if (typeof showToast === 'function') showToast('success', '메인컨텐츠가 저장되었습니다.');
}
function _hpMcCancel() {
  _hpMcInit();
}
