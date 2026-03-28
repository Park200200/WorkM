/**
 * modules/overrides.js
 * app.js ?댄썑??濡쒕뱶?섏뼱 ?뱀젙 ?⑥닔瑜?源⑤걮??UTF-8 肄붾뱶濡?援먯껜?⑸땲??
 * ???뚯씪? ??긽 UTF-8濡쒕쭔 ????몄쭛?섏꽭??
 */

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧
   showToast ???꾩씠肄??쒓굅, 媛뺤“??諛곌꼍 ?곸슜
?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧 */
function showToast(type, msg, duration) {
  duration = duration || 3000;
  // msg ?덉쓽 <i data-lucide="...">...</i> ?먮뒗 <i ...></i> ?쒓렇 ?쒓굅
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

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧
   triggerAddAccent ???ㅼ씠?곕툕 而щ윭?쇱빱濡?媛뺤“??異붽?
   (colorPickerPanel ???accentColorPicker input ?ъ슜)
?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧 */
function triggerAddAccent() {
  const picker = document.getElementById('accentColorPicker');
  if (picker) {
    picker.click();
  }
}

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧
   initHeader ???ъ슜???꾨컮?쨌?대쫫 ?덉쟾?섍쾶 ?쒖떆
?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧 */
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
    [u.dept, u.role].filter(Boolean).join(' 쨌 ') + (u.pos ? ' | ' + u.pos : '');

  const badge = document.getElementById('sideTaskBadge');
  if (badge) {
    const list = typeof WS.getAssignedToMe === 'function'
      ? WS.getAssignedToMe() : (WS.tasks || []);
    badge.textContent = list.filter(t => t.status !== 'done').length;
  }
  if (typeof renderNotifBadge === 'function') renderNotifBadge();
  if (typeof renderNotifList  === 'function') renderNotifList();
}



/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧
   ?됱긽 ?좏떥 ??HEX ??HSL 蹂??
?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧 */
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

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧
   renderDesignSystem ??媛뺤“??湲곕컲 7???붾젅???앹꽦
?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧 */
function renderDesignSystem(accentHex) {
  if (!accentHex || accentHex.length < 4) return;
  const [h, s, l] = _hexToHSL(accentHex);

  const palette = [
    { key: '--ds-primary',   label: '湲곕낯而щ윭',   hex: accentHex },
    { key: '--ds-secondary', label: '蹂댁“而щ윭',   hex: _hslToHex((h+40)%360, Math.round(s*0.55), Math.min(l+18,82)) },
    { key: '--ds-accent',    label: '媛뺤“而щ윭',   hex: _hslToHex(h, Math.min(s+12,100), Math.max(l-18,20)) },
    { key: '--ds-neutral',   label: '以묐┰而щ윭',   hex: _hslToHex(h, 14, 54) },
    { key: '--ds-bg',        label: '諛곌꼍而щ윭',   hex: _hslToHex(h, 10, 97) },
    { key: '--ds-surface',   label: '?쒕㈃而щ윭',   hex: _hslToHex(h, 13, 91) },
    { key: '--ds-text',      label: '?띿뒪?몄뺄??, hex: _hslToHex(h, 20, 16) },
  ];

  // CSS 蹂?섏뿉 ?곸슜
  const root = document.documentElement;
  palette.forEach(c => root.style.setProperty(c.key, c.hex));

  // #designSystemColors ?뱀뀡 ?숈쟻 ?앹꽦 (?놁쑝硫?theme-tab??異붽?)
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
        '<i data-lucide="palette" style="width:14px;height:14px"></i> ?붿옄???쒖뒪??而щ윭' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px">' +
        palette.map(c => {
          const isLight = _hexToHSL(c.hex)[2] > 60;
          const textCol = isLight ? '#1a1d2e' : '#ffffff';
          return (
            '<div style="text-align:center;cursor:pointer" ' +
              'onclick="(function(){try{navigator.clipboard.writeText(\'' + c.hex + '\')}catch(e){}' +
              'showToast(\'success\',\'' + c.hex.toUpperCase() + ' 蹂듭궗??')})()" ' +
              'title="?대┃?섏뿬 蹂듭궗: ' + c.hex.toUpperCase() + '">' +
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
        '?됱긽 移⑹쓣 ?대┃?섎㈃ HEX 肄붾뱶媛 ?대┰蹂대뱶??蹂듭궗?⑸땲??' +
      '</div>' +
    '</div>';

  refreshIcons();
}

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧
   applyAccent ??媛뺤“???곸슜 + ?붿옄???쒖뒪???낅뜲?댄듃
?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧 */
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

  showToast('success', '媛뺤“?됱씠 蹂寃쎈릺?덉뒿?덈떎.');
  refreshIcons();
  if (typeof renderAttendancePill === 'function') renderAttendancePill();

  // ?붿옄???쒖뒪??而щ윭 ?붾젅???낅뜲?댄듃
  renderDesignSystem(color);
}


/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧
   switchProfileTab ??theme-tab ?꾪솚 ??hover 由ъ뒪??珥덇린??
?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧 */
function switchProfileTab(tabId, el) {
  document.querySelectorAll('#page-profile .tab-item').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  ['profile-tab', 'notif-tab', 'theme-tab'].forEach(id => {
    const t = document.getElementById(id);
    if (t) t.style.display = id === tabId ? 'block' : 'none';
  });

  if (tabId === 'theme-tab') {
    setTimeout(() => {
      // ?꾩옱 媛뺤“?됱쑝濡??붿옄???쒖뒪???⑤꼸 珥덇린??
      const accent = WS.currentAccent || localStorage.getItem('ws_current_accent') || '#4f6ef7';
      renderDesignSystem(accent);

      // accent chip 紐⑸줉??hover ?대깽??(??踰덈쭔 ?깅줉)
      const accentList = document.getElementById('accentList');
      if (accentList && !accentList._dsHoverBound) {
        accentList._dsHoverBound = true;

        accentList.addEventListener('mouseover', function(e) {
          const chip = e.target.closest('.accent-chip');
          if (!chip) return;
          // background: 'rgb(...)' ?먮뒗 '#hex' ?뺥깭
          const bg = chip.style.background || chip.style.backgroundColor;
          if (bg) renderDesignSystem(_normalizeColor(bg));
        });

        accentList.addEventListener('mouseleave', function() {
          // 留덉슦?ㅺ? 紐⑸줉??踰쀬뼱?섎㈃ ?꾩옱 ?ㅼ젣 媛뺤“???붾젅??蹂듭썝
          const cur = WS.currentAccent || localStorage.getItem('ws_current_accent') || '#4f6ef7';
          renderDesignSystem(cur);
        });
      }
    }, 60);
  }
}

/* rgb(...) ?됱긽 臾몄옄?댁쓣 #hex濡?蹂??*/
function _normalizeColor(colorStr) {
  if (!colorStr) return '#4f6ef7';
  if (colorStr.startsWith('#')) return colorStr;
  // rgb(r,g,b) ??#hex
  const m = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (m) {
    return '#' + [m[1],m[2],m[3]]
      .map(n => parseInt(n).toString(16).padStart(2,'0')).join('');
  }
  return colorStr;
}

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧

   ?낅Т?ㅼ젙 ?섏씠吏 ??renderPage_Tasks ?꾩쟾 援먯껜
   (而щ읆 ?ㅻ뜑 ?쒓? ?뺤긽 異쒕젰 + ?대┃ ?대깽??蹂댁옣)
?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧 */
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

/* ?낅Т 紐⑸줉 酉?(吏곸젒 ?묒꽦 ???ㅻ뜑 ?쒓? ?뺤긽) */
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
          <button class="qa-btn" onclick="event.stopPropagation();openEditTaskModal(${t.id})">?륅툘</button>
          <button class="qa-btn done" onclick="event.stopPropagation();changeStatus(${t.id},'done')">?꾨즺</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  el.innerHTML = `<table class="task-table">
    <thead><tr>
      <th>?낅Т?쒕ぉ</th>
      <th>?대떦??/th>
      <th>?곹깭</th>
      <th>留덇컧??/th>
      <th>?≪뀡</th>
    </tr></thead>
    <tbody>${rows || '<tr><td colspan="5" class="empty-state">?곗씠?곌? ?놁뒿?덈떎.</td></tr>'}</tbody>
  </table>`;
  refreshIcons();
}

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧
   saveTaskDetail ???뱀씪 ?덉뒪?좊━ 以묐났 諛⑹?
?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧 */
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
    event:  '吏꾪뻾???낅뜲?댄듃',
    detail: '吏꾪뻾??' + t.progress + '%' + (t.desc ? ' 쨌 ?ㅻ챸 ?섏젙' : ''),
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
  showToast('success', '<i data-lucide="check-circle-2"></i> ??λ릺?덉뒿?덈떎.');
  refreshIcons();
}

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧
   addProgressReport ???뱀씪 1嫄??쒗븳 + 吏꾪뻾?????
?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧 */
function addProgressReport(taskId) {
  const t = WS.getTask(taskId);
  if (!t) return;
  const textEl  = document.getElementById('td_reportText');
  const iconVal = (document.getElementById('td_reportIconVal')?.value || 'message-square|吏꾪뻾蹂닿퀬|#4f6ef7');
  const text    = textEl?.value?.trim();
  if (!text) { showToast('warning', '吏꾪뻾 ?댁슜???낅젰?섏꽭??'); return; }

  const parts = iconVal.split('|');
  const icon  = parts[0];
  const label = parts[1];
  const color = parts[2];

  const now     = new Date();
  const dateStr = now.getFullYear() + '.' +
                  String(now.getMonth()+1).padStart(2,'0') + '.' +
                  String(now.getDate()).padStart(2,'0');
  if (!t.history) t.history = [];

  // ?꾩옱 ?щ씪?대뜑 吏꾪뻾??
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

  // ?덉뒪?좊━ ??꾨씪??利됱떆 媛깆떊
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
    if (cntEl) cntEl.textContent = t.history.length + '嫄?;
    refreshIcons();
  }

  if (textEl) textEl.value = '';
  showToast('success', isUpdate ? '吏꾪뻾蹂닿퀬媛 ?낅뜲?댄듃?섏뿀?듬땲??' : '吏꾪뻾蹂닿퀬媛 異붽??섏뿀?듬땲??');
}

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧
   createNewTask ???깃낵?ъ씤??scoreMin/scoreMax) ?ы븿
?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧 */
function createNewTask() {
  const titleInput = document.getElementById('nt_title');
  const title = titleInput ? titleInput.value.trim() : '';

  if (!title) {
    showToast('error', '?낅Т ?쒕ぉ???낅젰?섏꽭??);
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  // ?좎쭨: nt_due 媛??ъ슜, ?놁쑝硫??ㅻ뒛+30???먮룞 ?ㅼ젙
  const dueRaw = document.getElementById('nt_due')?.value;
  const due = dueRaw || (() => {
    const d = new Date(); d.setDate(d.getDate()+30);
    return d.toISOString().split('T')[0];
  })();

  // ? 泥댄겕諛뺤뒪 ?좏깮媛??쎄린 (蹂듭닔)
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
      event:  '?낅Т ?깅줉',
      detail: WS.currentUser?.name || '',
      icon:   'clipboard-list',
      color:  '#4f6ef7'
    }]
  };

  WS.tasks.push(nt);
  WS.saveTasks();
  WS.addNotification({ msg: '???낅Т媛 ?깅줉?섏뿀?듬땲?? ' + title, type: 'new', time: '諛⑷툑' });

  // ??珥덇린??
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
  showToast('success', '<i data-lucide="check-circle-2"></i> ?낅Т媛 ?깅줉?섏뿀?듬땲??');
  refreshIcons();
}

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧
   saveEditTask ???깃낵?ъ씤??scoreMin/scoreMax) ?ы븿
?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧 */
function saveEditTask() {
  const id    = window._editingTaskId;
  const title = document.getElementById('nt_title')?.value?.trim();
  if (!id || !title) { showToast('error', '?쒕ぉ???낅젰?섏꽭??); return; }

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
  showToast('success', '?낅Т媛 ?섏젙?섏뿀?듬땲??');
  refreshIcons();
}

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧
   openNewTaskModal ???ㅼ?以?紐⑤뱶 ?낅Т?좏깮 ?쒕∼?ㅼ슫
   + ?깃낵?ъ씤???뱀뀡 show/hide
?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧 */
function openNewTaskModal(mode, parentId, isSimple) {
  window._newParentId = parentId || null;
  window._processTags = [];
  renderProcessTags();

  // ?ㅻ뒛 ?좎쭨 湲곕낯 ?ㅼ젙
  const today = new Date();
  const yyyy  = today.getFullYear();
  const mm    = String(today.getMonth()+1).padStart(2,'0');
  const dd    = String(today.getDate()).padStart(2,'0');
  const todayStr   = yyyy + '-' + mm + '-' + dd;
  const todayLabel = yyyy + '??' + parseInt(mm) + '??' + parseInt(dd) + '??;

  const dueHid = document.getElementById('nt_due');
  const dueLbl = document.getElementById('nt_due_label');
  if (dueHid) dueHid.value = todayStr;
  if (dueLbl) dueLbl.textContent = todayLabel;

  const startHid = document.getElementById('nt_start');
  const startLbl = document.getElementById('nt_start_label');
  if (startHid) startHid.value = todayStr;
  if (startLbl) startLbl.textContent = todayLabel;

  // ?깃낵?ъ씤???꾨뱶 珥덇린??
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
    if (modalTitle) modalTitle.textContent = '?낅Т 異붽?';
    if (submitBtn)  { submitBtn.textContent = '異붽?'; submitBtn.onclick = createNewTask; }
    hide(rowPT); hide(rowDate); hide(rowImp); hide(rowScore);

  } else if (mode === 'schedule') {
    if (modalTitle) modalTitle.textContent = '???ㅼ?以?異붽?';
    if (submitBtn)  { submitBtn.textContent = '?ㅼ?以??깅줉'; submitBtn.onclick = createNewTask; }
    hide(rowPT); show(rowDate); hide(rowImp); hide(rowScore);

    // ? 泥댄겕諛뺤뒪 ?④린怨??묒뾽??곸옄 ?뱀뀡 ?쒖떆
    const rowTeamsCheck2 = document.getElementById('nt_row_teams_check');
    hide(rowTeamsCheck2);
    _showCollaborators();

    // ?낅Т ?좏깮 ?쒕∼?ㅼ슫 ?쒖떆 諛?梨꾩슦湲?
    show(rowSel);
    const selEl = document.getElementById('nt_task_select');
    if (selEl) {
      const uid     = WS.currentUser?.id;
      const myTasks = WS.tasks.filter(t =>
        t.assignerId === uid || (t.assigneeIds||[]).includes(uid)
      );
      selEl.innerHTML = '<option value="">-- ?낅Т 紐⑸줉?먯꽌 ?좏깮 --</option>' +
        myTasks.map(t => '<option value="' + t.id + '">' + t.title + '</option>').join('');
    }


  } else if (mode === 'edit') {
    if (modalTitle) modalTitle.textContent = '?낅Т ?섏젙';
    if (submitBtn)  { submitBtn.textContent = '??ν븯湲?; submitBtn.onclick = saveEditTask; }
    hide(rowPT); hide(rowDate); hide(rowImp); show(rowScore);

  } else {
    // 湲곕낯: ???낅Т 異붽?
    if (modalTitle) modalTitle.textContent = '???낅Т 異붽?';
    if (submitBtn)  { submitBtn.textContent = '?낅Т ?깅줉'; submitBtn.onclick = createNewTask; }
    hide(rowPT); hide(rowDate); show(rowImp); show(rowScore);
    // ?묒뾽??곸옄 ?뱀뀡 ?④?
    _hideCollaborators();
    // ? 泥댄겕諛뺤뒪 ?쒖떆 諛?梨꾩슦湲?
    const rowTeamsCheck = document.getElementById('nt_row_teams_check');
    show(rowTeamsCheck);
    _populateTeamCheckboxes();
  }

  if (parentId) {
    const p = WS.getTask(parentId);
    if (p) showToast('info', '[' + p.title + '] ?섏쐞 ?낅Т瑜?異붽??⑸땲??');
  }
  openModal('newTaskModal');
}

/* openEditTaskModal ???깃낵?ъ씤??蹂듭썝 ?ы븿 */
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
    dueLbl.textContent = y + '??' + parseInt(m) + '??' + parseInt(d) + '??;
  }

  renderProcessTags();
  openNewTaskModal('edit', null, false);
}

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧
   renderPage_RankMgmt ???대え吏 踰꾪듉(?륅툘?뿊截? ?ы븿
?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧 */
function renderPage_RankMgmt() {
  // 湲곕낯 ?곗씠??珥덇린??
  if (!WS.departments || !WS.departments.length) {
    WS.departments = [
      {id:1,name:'媛쒕컻?'},{id:2,name:'?붿옄?명?'},
      {id:3,name:'留덉??낇?'},{id:4,name:'寃쎌쁺吏?먰?'}
    ];
    WS.saveDepartments && WS.saveDepartments();
  }
  if (!WS.ranks || !WS.ranks.length) {
    WS.ranks = [
      {id:1,name:'?ъ썝',level:2},{id:2,name:'二쇱엫',level:3},
      {id:3,name:'?由?,level:4},{id:4,name:'怨쇱옣',level:5},
      {id:5,name:'李⑥옣',level:6},{id:6,name:'???,level:7},
      {id:7,name:'遺??,level:8},{id:8,name:'?댁궗',level:9},{id:9,name:'???,level:10}
    ];
    WS.saveRanks && WS.saveRanks();
  }
  if (!WS.positions || !WS.positions.length) {
    WS.positions = [
      {id:1,name:'???},{id:2,name:'?ㅼ옣'},{id:3,name:'蹂몃???},{id:4,name:'CEO'}
    ];
    WS.savePositions && WS.savePositions();
  }
  if (!WS.taskResults || !WS.taskResults.length) {
    WS.taskResults = [
      {id:1,name:'?뺤긽?꾨즺'},{id:2,name:'吏꾪뻾以?},
      {id:3,name:'遺遺꾩셿猷?},{id:4,name:'蹂대쪟'},{id:5,name:'痍⑥냼'}
    ];
    WS.saveTaskResults && WS.saveTaskResults();
  }
  if (!WS.reportTypes || !WS.reportTypes.length) {
    WS.reportTypes = [
      {id:1,label:'?낅Т?쒖옉', icon:'play-circle',    color:'#4f6ef7'},
      {id:2,label:'?쒖옣議곗궗', icon:'search',          color:'#06b6d4'},
      {id:3,label:'?묒뾽以?,   icon:'wrench',          color:'#9747ff'},
      {id:4,label:'?묒뾽?꾨즺', icon:'check-circle',    color:'#22c55e'},
      {id:5,label:'?묒쓽?꾨즺', icon:'message-circle',  color:'#f59e0b'},
      {id:6,label:'?댁뒋諛쒖깮', icon:'alert-triangle',  color:'#ef4444'},
      {id:7,label:'?낅Т痍⑥냼', icon:'x-circle',        color:'#6b7280'},
      {id:8,label:'蹂닿퀬?쒖옉??,icon:'file-text',      color:'#8b5cf6'}
    ];
    WS.saveReportTypes && WS.saveReportTypes();
  }

  // ?꾩씠??移대뱶 ?앹꽦 ?⑥닔
  function itemCard(type, item) {
    const label = item.level !== undefined
      ? '<span style="font-size:10px;color:var(--text-muted)">Lv.' + item.level + '</span>' : '';
    return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-radius:8px;background:var(--bg-tertiary);margin-bottom:6px">' +
      '<div style="font-size:13px;font-weight:600;color:var(--text-primary)">' + item.name + ' ' + label + '</div>' +
      '<div style="display:flex;gap:4px">' +
        '<button onclick="editOrgItem(\'' + type + '\',' + item.id + ')" title="?섏젙" ' +
          'style="background:none;border:none;cursor:pointer;padding:3px 6px;font-size:13px">?륅툘</button>' +
        '<button onclick="deleteOrgItem(\'' + type + '\',' + item.id + ')" title="??젣" ' +
          'style="background:none;border:none;cursor:pointer;padding:3px 6px;font-size:13px">?뿊截?/button>' +
      '</div>' +
    '</div>';
  }

  const deptList   = document.getElementById('deptList');
  const rankList   = document.getElementById('rankList');
  const posList    = document.getElementById('posList');
  const resultList = document.getElementById('resultList');
  const rtList     = document.getElementById('reportTypeList');

  const emptyMsg = '<div style="color:var(--text-muted);font-size:12px;padding:8px">??ぉ ?놁쓬</div>';

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
          '<button onclick="editReportType(' + r.id + ')" title="?섏젙" style="background:none;border:none;cursor:pointer;padding:3px 6px;font-size:13px">?륅툘</button>' +
          '<button onclick="deleteOrgItem(\'reportType\',' + r.id + ')" title="??젣" style="background:none;border:none;cursor:pointer;padding:3px 6px;font-size:13px">?뿊截?/button>' +
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

  // 寃곌낵 ?쒕∼?ㅼ슫 梨꾩슦湲?
  const resultSel = document.getElementById('nt_result');
  if (resultSel) {
    resultSel.innerHTML = '<option value="">-- ?좏깮 --</option>' +
      WS.taskResults.map(r => '<option value="' + r.name + '">' + r.name + '</option>').join('');
  }

  refreshIcons();
}

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧
   renderAttendancePill ????異쒗눜洹??꾩젽 ?ㅼ떆媛??낅뜲?댄듃
?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧 */
function renderAttendancePill() {
  const u = WS.currentUser;
  if (!u) return;
  // ?щ컮瑜?API: getTodayAttendance
  const rec = typeof WS.getTodayAttendance === 'function'
    ? WS.getTodayAttendance(u.id)
    : null;

  const now = new Date();
  const hh = String(now.getHours()).padStart(2,'0');
  const mi = String(now.getMinutes()).padStart(2,'0');
  const ss = String(now.getSeconds()).padStart(2,'0');

  // ?꾩옱 ?쒓컙 ?쒖떆
  const nowEl = document.getElementById('attNowTime');
  if (nowEl) nowEl.textContent = hh + ':' + mi + ':' + ss;

  // 異쒓렐 ?쒓컙 ?쒖떆 (checkInRaw = "HH:MM" 24?쒓컙 ?뺤떇)
  const inEl = document.getElementById('attCheckInTime');
  if (inEl) inEl.textContent = (rec && rec.checkInRaw) ? rec.checkInRaw : '--:--';

  // 洹쇰Т ?쒓컙 ?꾩쟻 怨꾩궛 (checkInRaw 湲곕컲)
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

  // ?? 媛뺤“??湲곕컲 ?됱긽 ?곸슜 ??
  const accent = WS.currentAccent || localStorage.getItem('ws_current_accent') || '#4f6ef7';
  const [aH, aS] = _hexToHSL(accent);
  const bgCol  = _hslToHex(aH, Math.min(aS, 55), 14);  // ?대몢??諛곌꼍
  const btnCol = _hslToHex(aH, Math.min(aS, 65), 24);  // 踰꾪듉 (?쎄컙 諛앹쓬)
  const txtCol = _hslToHex(aH, 60, 88);                // ?곌퀎???띿뒪??
  const lblCol = _hslToHex(aH, 45, 58);                // ?쇰꺼 以묎컙 諛앷린

  const pill = document.getElementById('attendancePill');
  if (pill) {
    pill.style.background = bgCol;
    // ?닿렐 踰꾪듉 ??
    const btn = pill.querySelector('[onclick="doCheckOut()"]');
    if (btn) { btn.style.background = btnCol; btn._accentApplied = true; }
    // ?쒓컙 ?띿뒪????
    ['attCheckInTime','attNowTime','attWorkTime'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.color = txtCol;
    });
    // ?쇰꺼 ??(pill ?덉쓽 ?뚰삎 label div??- 泥?踰덉㎏ div ?먯떇)
    pill.querySelectorAll('[style*="font-size:10px"]').forEach(el => {
      el.style.color = lblCol;
    });
  }
}

// 1珥덈쭏??異쒗눜洹??꾩젽 ?낅뜲?댄듃
setInterval(renderAttendancePill, 1000);

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧
   doCheckOut ???닿렐 ?대┃ 泥섎━
   ?몄궗 硫붿떆吏 2珥???濡쒓렇?꾩썐
?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧 */
function doCheckOut() {
  const u = WS.currentUser;
  if (!u) return;

  // 洹쇰Т 珥??쒓컙 怨꾩궛
  const rec = typeof WS.getTodayAttendance === 'function' ? WS.getTodayAttendance(u.id) : null;
  let totalStr = '0?쒓컙 0遺?;
  if (rec && rec.checkInRaw) {
    const now = new Date();
    const [chH, chM] = rec.checkInRaw.split(':').map(Number);
    const checkInDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), chH, chM, 0);
    const totalMin = Math.max(0, Math.floor((now - checkInDate) / 60000));
    const wh = Math.floor(totalMin / 60);
    const wm = totalMin % 60;
    totalStr = wh + '?쒓컙 ' + wm + '遺?;
  }

  // ?닿렐 湲곕줉
  if (typeof WS.checkOut === 'function') WS.checkOut(u.id);

  // ?몄궗 硫붿떆吏 ?ㅻ쾭?덉씠 ?쒖떆
  const overlay = document.createElement('div');
  overlay.id = 'checkoutOverlay';
  overlay.style.cssText =
    'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;' +
    'background:rgba(0,0,0,.65);backdrop-filter:blur(6px);animation:fadeIn .3s ease';
  overlay.innerHTML =
    '<div style="background:#2d3a1e;border-radius:20px;padding:40px 48px;text-align:center;' +
         'max-width:480px;box-shadow:0 20px 60px rgba(0,0,0,.4)">' +
      '<div style="font-size:48px;margin-bottom:16px">?뙁</div>' +
      '<div style="font-size:22px;font-weight:800;color:#e8f5d0;margin-bottom:10px">' +
        u.name + '?? ?ㅻ뒛???섍퀬?섏뀲?듬땲??' +
      '</div>' +
      '<div style="font-size:16px;color:#8fae6a;margin-bottom:6px">' +
        '?ㅻ뒛 珥?洹쇰Т?쒓컙? <strong style="color:#e8f5d0">' + totalStr + '</strong> ?낅땲??' +
      '</div>' +
      '<div style="font-size:13px;color:#6d8f4f;margin-top:8px">' +
        '?닿렐 ??利먭굅???쒓컙 ?섏떆湲?諛붾엻?덈떎 ??' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);

  // 2珥???濡쒓렇?꾩썐
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


/* ? 泥댄겕諛뺤뒪 populate */
function _populateTeamCheckboxes(selectedTeams) {
  const wrap = document.getElementById('nt_teams_checkboxes');
  if (!wrap) return;
  const depts = (WS.departments && WS.departments.length)
    ? WS.departments
    : [
        {name:'媛쒕컻?'},{name:'湲고쉷?'},
        {name:'?붿옄?명?'},{name:'留덉??낇?'},
        {name:'寃쎌쁺吏?먰?'}
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

/* ?묒뾽??곸옄 ?뱀뀡 ?앹꽦/?쒖떆 (schedule 紐⑤뱶 ?꾩슜) */
function _showCollaborators(selectedIds) {
  // 湲곗〈 ?뱀뀡 ?쒓굅 ???ъ깮??
  let sec = document.getElementById('nt_row_collaborators');
  if (!sec) {
    sec = document.createElement('div');
    sec.id = 'nt_row_collaborators';
    sec.className = 'form-group';
    // nt_row_teams_check 諛붾줈 ?꾨옒???쎌엯
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
      '?묒뾽??곸옄 <span style="font-size:10px;color:var(--text-muted)">(蹂듭닔 ?좏깮 媛??</span>' +
    '</label>' +
    '<div id="nt_collaborator_boxes" style="display:flex;flex-wrap:wrap;gap:8px;padding:10px 12px;' +
      'background:var(--bg-tertiary);border:1px solid var(--border-color);border-radius:10px">' +
      (users.length === 0
        ? '<div style="color:var(--text-muted);font-size:12px">?깅줉??吏곸썝???놁뒿?덈떎.</div>'
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

/* ?묒뾽??곸옄 ?뱀뀡 ?④린湲?*/
function _hideCollaborators() {
  const sec = document.getElementById('nt_row_collaborators');
  if (sec) sec.style.display = 'none';
}

/* createNewTask?먯꽌 ?묒뾽??곸옄 ID ?쎄린 (schedule 紐⑤뱶?? */
function _getSelectedCollaboratorIds() {
  return Array.from(
    document.querySelectorAll('#nt_collaborator_boxes input[type=checkbox]:checked')
  ).map(cb => parseInt(cb.value)).filter(Boolean);
}

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧
   ?쇰낫?묒꽦 紐⑤떖 ??openDailyReportModal ?ъ젙??
   ??湲덉씪 ?낅Т 由ъ뒪??(湲곗〈 renderDailyReportTasks)
   ??湲덉씪 ?ㅼ?以?由ъ뒪??
   ??湲덉씪 ?낅Т?ㅽ뻾 蹂닿퀬 由ъ뒪??
?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧 */
function openDailyReportModal() {
  const modal = document.getElementById('dailyReportModal');
  if (!modal) return;
  modal.style.display = 'flex';
  refreshIcons();

  const now  = new Date();
  const days = ['??,'??,'??,'??,'紐?,'湲?,'??];
  const dateStr = now.getFullYear() + '??' + (now.getMonth()+1) + '??' + now.getDate() + '??(' + days[now.getDay()] + ')';
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

/* ??湲덉씪 ?ㅼ?以?由ъ뒪??*/
function renderDailyScheduleList() {
  const me    = WS.currentUser;
  const tbody  = document.getElementById('dr_sched_list');
  const countEl = document.getElementById('dr_sched_count');
  if (!tbody || !me) return;

  const schedules = (WS.tasks || []).filter(t => t.assignerId === me.id);
  if (countEl) countEl.textContent = schedules.length + '嫄?;

  if (schedules.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text-muted)">湲덉씪 ?깅줉???ㅼ?以꾩씠 ?놁뒿?덈떎</td></tr>';
    return;
  }
  tbody.innerHTML = schedules.map(t => {
    const ids = Array.isArray(t.assigneeIds) ? t.assigneeIds : [];
    const collab = ids.filter(id => id !== me.id)
      .map(id => (WS.getUser ? WS.getUser(id) : null)?.name).filter(Boolean).join(', ') || '-';
    const st = WS.getStatusLabel ? WS.getStatusLabel(t.status) : (t.status || '-');
    return '<tr>' +
      '<td style="font-weight:600">' + (t.isImportant ? '狩?' : '') + t.title + '</td>' +
      '<td style="font-size:11px">' + collab + '</td>' +
      '<td style="font-size:11px">' + (t.dueDate || t.startDate || '-') + '</td>' +
      '<td style="font-size:11px;color:var(--text-secondary)">' + (t.desc || '-') + '</td>' +
      '<td><span class="status-badge status-' + (t.status||'waiting') + '">' + st + '</span></td>' +
    '</tr>';
  }).join('');
}

/* ??湲덉씪 ?낅Т?ㅽ뻾 蹂닿퀬 由ъ뒪??(蹂닿퀬?꾨즺/蹂닿퀬?놁쓬 ?좉? + 愿由??꾩씠肄? */
function renderDailyExecReport() {
  const me    = WS.currentUser;
  const tbody = document.getElementById('dr_exec_list');
  if (!tbody || !me) return;

  const myTasks = (WS.tasks || []).filter(t => {
    const ids = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
    return ids.includes(me.id);
  });

  if (myTasks.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text-muted)">諛곗젙???낅Т媛 ?놁뒿?덈떎</td></tr>';
    return;
  }
  tbody.innerHTML = myTasks.map(t => {
    const baseScore = t.scoreBase !== undefined ? t.scoreBase : (t.performanceScore || '-');
    const reported  = !!t.drExecReported;
    // 蹂닿퀬?꾨즺/蹂닿퀬?놁쓬 ?좉? 踰꾪듉
    const repBtn = reported
      ? '<button class="btn-sm btn-primary" style="font-size:11px;padding:3px 10px;background:var(--accent-green,#22c55e);border:none;border-radius:6px;color:#fff;cursor:pointer;font-weight:700" onclick="drToggleExecReport(' + t.id + ')">蹂닿퀬?꾨즺</button>'
      : '<button class="btn-sm"            style="font-size:11px;padding:3px 10px;border:1.5px solid var(--border-color);border-radius:6px;background:transparent;color:var(--text-secondary);cursor:pointer;font-weight:600" onclick="drToggleExecReport(' + t.id + ')">蹂닿퀬?놁쓬</button>';
    // 愿由????묒꽦 ?꾩씠肄?
    const hasReport = !!(t.drExecReport && t.drExecReport.trim());
    const editIcon = '<button title="蹂닿퀬 ?묒꽦" onclick="openDrWrite(' + t.id + ')" '
      + 'style="background:none;border:none;cursor:pointer;padding:4px;border-radius:6px;'
      + 'color:' + (hasReport ? 'var(--accent-blue)' : 'var(--text-muted)') + ';transition:.15s"'
      + ' onmouseover="this.style.background=\'var(--bg-secondary)\'"'
      + ' onmouseout="this.style.background=\'none\'">'
      + '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>'
      + '</button>';
    return '<tr>' +
      '<td style="font-weight:600">' + (t.isImportant ? '狩?' : '') + t.title + '</td>' +
      '<td style="font-size:11.5px;color:var(--text-secondary);max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + (t.desc || '-') + '</td>' +
      '<td style="text-align:center;font-weight:700;color:var(--accent-blue)">' + baseScore + '</td>' +
      '<td style="text-align:center">' + repBtn + '</td>' +
      '<td style="text-align:center">' + editIcon + '</td>' +
    '</tr>';
  }).join('');
}

/* 蹂닿퀬?꾨즺/蹂닿퀬?놁쓬 ?좉? */
function drToggleExecReport(taskId) {
  const t = WS.getTask ? WS.getTask(taskId) : null;
  if (!t) return;
  t.drExecReported = !t.drExecReported;
  if (WS.saveTasks) WS.saveTasks();
  renderDailyExecReport();
  showToast('success', t.drExecReported ? '"' + t.title + '" 蹂닿퀬?꾨즺 泥섎━' : '"' + t.title + '" 蹂닿퀬?놁쓬?쇰줈 蹂寃?);
}

/* 蹂닿퀬 ?묒꽦 ?앹뾽 ?닿린 */
let _drWriteTaskId = null;
function openDrWrite(taskId) {
  const t = WS.getTask ? WS.getTask(taskId) : null;
  if (!t) return;
  _drWriteTaskId = taskId;
  const titleEl = document.getElementById('drWriteTitle');
  if (titleEl) titleEl.textContent = '[' + t.title + '] 湲덉씪 蹂닿퀬 ?묒꽦';
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
  showToast('success', '"' + t.title + '" 蹂닿퀬?댁슜????λ릺?덉뒿?덈떎.');
}
/* openDailyReportModal?먯꽌 renderDailyScheduleList ?몄텧 ?쒓굅???ъ젙?섎뒗 ?대? ?꾩뿉 ?덉쓬 */

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧
   openEditTaskModal ???먯닔/?낅Т寃곌낵 ?낅젰媛?蹂듭썝
   ??WS.taskResults瑜?localStorage?먯꽌 ?щ줈?쒗븯??理쒖떊 湲고?愿由??곗씠??諛섏쁺
   ??scoreBase(湲곕낯)/scoreMin(理쒖냼)/scoreMax(理쒕?) 紐⑤몢 蹂듭썝
   ??reportContent ??nt_result select 蹂듭썝
?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧 */
function openEditTaskModal(id) {
  const t = WS.getTask(id);
  if (!t) return;
  window._editingTaskId = id;

  // ???낅Т寃곌낵 ?쒕∼?ㅼ슫??理쒖떊 ?곗씠???щ줈??(湲고?愿由?> ?낅Т寃곌낵 諛섏쁺)
  WS.taskResults = JSON.parse(localStorage.getItem('ws_task_results')) || WS.taskResults;

  openNewTaskModal('edit');

  setTimeout(function () {
    function setVal(elId, val) {
      const el = document.getElementById(elId);
      if (el) el.value = (val !== undefined && val !== null) ? val : '';
    }
    setVal('nt_title',     t.title);
    setVal('nt_desc',      t.desc);
    setVal('nt_priority',  t.priority || 'medium');
    setVal('nt_team',      t.team);
    setVal('nt_start',     t.startedAt || '');
    setVal('nt_due',       t.dueDate);
    // ??? 泥댄겕諛뺤뒪 蹂듭썝 (t.team = 'A?, B?' ?뺥깭)
    var teamArr = (t.team || '').split(',').map(function(s){ return s.trim(); }).filter(Boolean);
    document.querySelectorAll('#nt_teams_checkboxes input[type=checkbox]').forEach(function(cb) {
      cb.checked = teamArr.indexOf(cb.value) !== -1;
    });
    // ???먯닔 3媛?紐⑤몢 蹂듭썝
    setVal('nt_score',     t.scoreBase !== undefined ? t.scoreBase : (t.score || ''));
    setVal('nt_score_min', t.scoreMin !== undefined ? t.scoreMin : '');
    setVal('nt_score_max', t.scoreMax !== undefined ? t.scoreMax : '');
    // ???낅Т寃곌낵 select 蹂듭썝
    const resultEl = document.getElementById('nt_result');
    if (resultEl) {
      const resultOpts = (WS.taskResults || []).map(r =>
        '<option value="' + r.name + '">' + (r.icon ? r.icon + ' ' : '') + r.name + '</option>'
      ).join('');
      resultEl.innerHTML = '<option value="">-- ?좏깮 --</option>' + resultOpts;
      resultEl.value = t.reportContent || '';
    }
    const impEl = document.getElementById('nt_important');
    if (impEl) impEl.checked = !!t.isImportant;
    window._processTags = Array.isArray(t.processTags) ? [...t.processTags] : [];
    if (typeof renderProcessTags === 'function') renderProcessTags();
  }, 0);
}

/* saveEditTask ??scoreBase/scoreMin/scoreMax???④퍡 ???*/
function saveEditTask() {
  const id = window._editingTaskId;
  if (!id) return;
  const title = document.getElementById('nt_title')?.value.trim();
  if (!title) { showToast('error', '?쒕ぉ???낅젰?섏꽭??); return; }

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
      desc:           document.getElementById('nt_desc')?.value || t.desc,
      priority:       document.getElementById('nt_priority')?.value || t.priority,
      team:           (function(){
        var checks = document.querySelectorAll('#nt_teams_checkboxes input[type=checkbox]:checked');
        var arr = [];
        checks.forEach(function(cb){ arr.push(cb.value); });
        return arr.length ? arr.join(', ') : (document.getElementById('nt_team')?.value || t.team);
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
  showToast('success', '?낅Т媛 ??λ릺?덉뒿?덈떎.');
}

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧
   renderTaskListView ???낅Т紐⑸줉 ??洹몃━??
   而щ읆: ?낅Т?쒕ぉ(+?) / ?낅Т?ㅻ챸 / 湲곕낯?먯닔 / ?낅Т寃곌낵 / 愿由?
?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧 */
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
      // ?낅Т寃곌낵: reportContent (???낅Т 異붽??먯꽌 ?좏깮??媛?
      const resultStr = t.reportContent
        ? '<span class="report-status-badge">' + t.reportContent + '</span>'
        : '<span style="color:var(--text-muted);font-size:11px">-</span>';
      // ?낅Т?ㅻ챸
      const descStr = t.desc
        ? '<span style="font-size:11.5px;color:var(--text-secondary)">' + t.desc + '</span>'
        : '<span style="color:var(--text-muted);font-size:11px">-</span>';

      html += '<tr>' +
        // ???낅Т?쒕ぉ + ?由ъ뒪???꾨옒 ?쒖떆
        '<td>' +
          '<div class="tree-node" style="padding-left:' + indent + 'px">' +
            (level > 0 ? '<div class="tree-line"></div>' : '') +
            '<div class="tree-title">' +
              (t.isImportant ? '<span class="star-icon"><i data-lucide="star"></i></span>' : '') +
              ' ' + t.title +
            '</div>' +
            '<button class="btn-sub-add" onclick="openNewTaskModal(' + t.id + ')" title="?섏쐞 ?낅Т 異붽?">' +
              '<i data-lucide="plus" style="width:12px;height:12px"></i>' +
            '</button>' +
          '</div>' +
          (teamStr ? '<div style="font-size:11px;color:var(--text-muted);padding-left:' + indent + 'px;margin-top:2px">' + teamStr + '</div>' : '') +
        '</td>' +
        // ???낅Т?ㅻ챸
        '<td style="max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + descStr + '</td>' +
        // ??湲곕낯?먯닔
        '<td style="text-align:center;width:80px">' +
          '<div class="score-tag">' + baseScore + '<span>pt</span></div>' +
        '</td>' +
        // ???낅Т寃곌낵 (reportContent)
        '<td style="width:120px">' + resultStr + '</td>' +
        // ??愿由?(?섏젙 + ??젣)
        '<td style="width:90px">' +
          '<div class="manage-actions">' +
            '<button class="btn-icon-sm edit" onclick="openEditTaskModal(' + t.id + ')" title="?섏젙">' +
              '<i data-lucide="edit-3" class="icon-sm"></i>' +
            '</button>' +
            '<button class="btn-icon-sm delete" onclick="deleteTask(' + t.id + ')" title="??젣">' +
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
        '<th>?낅Т?쒕ぉ</th>' +
        '<th>?낅Т?ㅻ챸</th>' +
        '<th style="text-align:center;width:80px">湲곕낯?먯닔</th>' +
        '<th style="width:120px">?낅Т寃곌낵</th>' +
        '<th style="width:90px;text-align:center">愿由?/th>' +
      '</tr></thead>' +
      '<tbody>' +
        (rowsHtml || '<tr><td colspan="5" class="empty-state">?낅Т媛 ?놁뒿?덈떎.</td></tr>') +
      '</tbody>' +
    '</table>';
  refreshIcons();
}

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧
   ?썳截??낆닚??諛⑹?: 紐⑤떖 State ?ㅼ뿼 諛⑹뼱 肄붾뱶
   ?먯씤: newTaskModal 媛숈? modal-overlay媛 ?ロ엳吏 ?딄퀬 ?⑥븘
         ?ㅻⅨ ?섏씠吏??CRUD(湲고??ㅼ젙 ?? 踰꾪듉??李⑤떒?섎뒗 臾몄젣
   ?닿껐梨?
   ??closeAllModals ??紐⑤뱺 紐⑤떖 媛뺤젣 ?リ린
   ??showPage ?꾪겕  ???섏씠吏 ?대룞 ???먮룞 closeAllModals
   ??Escape ??    ???몄젣??Esc 濡?紐⑤떖 ?リ린
   ??openOrgModal  ???닿린 ??task 紐⑤떖 癒쇱? ?뺣━
?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧 */

/** 紐⑤뱺 modal-overlay瑜??リ퀬 ??대㉧/?곹깭 珥덇린??*/
function closeAllModals() {
  // 紐⑤뱺 overlay ?④린湲?
  document.querySelectorAll('.modal-overlay').forEach(function(m) {
    m.style.display = 'none';
  });
  // ?낅Т 愿??湲濡쒕쾶 ?곹깭 珥덇린??
  if (window._editingTaskId !== undefined) window._editingTaskId = null;
  if (window._processTags !== undefined)   window._processTags   = [];
  // 蹂닿퀬 ?묒꽦 ?앹뾽 ?곹깭 珥덇린??
  if (window._drWriteTaskId !== undefined) window._drWriteTaskId = null;
  // ?쇰낫 ??대㉧ ?뺣━
  if (window._drLiveTimer) { clearInterval(window._drLiveTimer); window._drLiveTimer = null; }
}

/* ??showPage ?꾪겕 ???먮낯 showPage瑜??섑븨?섏뿬 紐⑤떖 ?먮룞 ?뺣━ */
(function() {
  var _origShowPage = typeof showPage === 'function' ? showPage : null;
  if (!_origShowPage) return;
  window.showPage = function(pid) {
    try { closeAllModals(); } catch(e) {}
    _origShowPage.call(window, pid);
  };
})();

/* ??Escape ?ㅻ줈 ?몄젣??紐⑤떖 ?リ린 */
document.addEventListener('keydown', function(e) {
  if (e.key !== 'Escape') return;
  // ?대┛ modal-overlay 媛 ?덉쑝硫??リ린
  var hasOpen = false;
  document.querySelectorAll('.modal-overlay').forEach(function(m) {
    if (m.style.display !== 'none' && m.style.display !== '') hasOpen = true;
  });
  if (hasOpen) closeAllModals();
});

/* ??openOrgModal 蹂닿컯 ??湲고??ㅼ젙 CRUD 紐⑤떖??newTaskModal??留됲엳吏 ?딅룄濡?*/
(function() {
  var _origOpenOrgModal = typeof openOrgModal === 'function' ? openOrgModal : null;
  if (!_origOpenOrgModal) {
    // openOrgModal???섏쨷???뺤쓽??寃쎌슦瑜??꾪븳 ?대갚
    document.addEventListener('click', function(e) {
      var btn = e.target.closest('[onclick*="openOrgModal"]');
      if (!btn) return;
      // newTaskModal ??留됯퀬 ?덉쑝硫?癒쇱? ?リ린
      var ntm = document.getElementById('newTaskModal');
      if (ntm && ntm.style.display !== 'none') {
        ntm.style.display = 'none';
        if (window._editingTaskId) window._editingTaskId = null;
      }
    });
    return;
  }
  window.openOrgModal = function() {
    // newTaskModal ???대젮?덉쑝硫??リ퀬 吏꾪뻾
    var ntm = document.getElementById('newTaskModal');
    if (ntm && ntm.style.display !== 'none') {
      ntm.style.display = 'none';
      if (window._editingTaskId) window._editingTaskId = null;
    }
    _origOpenOrgModal.apply(window, arguments);
  };
})();

/* ???섏씠吏 濡쒕뱶 ?꾨즺 ???뱀떆 ?⑥? 紐⑤떖 ?뺣━ */
window.addEventListener('load', function() {
  setTimeout(function() {
    document.querySelectorAll('.modal-overlay').forEach(function(m) {
      if (m.id !== 'newTaskModal' && m.id !== 'dailyReportModal') return; // ??珥덇린 紐⑤떖留??뺣━
      m.style.display = 'none';
    });
  }, 500);
});

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧
   ?룛截?湲고??ㅼ젙 CRUD ??prompt() ?쒓굅, ?꾩슜 紐⑤떖 湲곕컲?쇰줈 ?ш뎄??
   ??#orgModal    : 遺??吏곴툒/吏곸콉 異붽?쨌?섏젙
   ??#resultModal : ?낅Т寃곌낵 異붽?쨌?섏젙
   洹쇰낯 ?먯씤: openOrgModal??prompt()瑜??, saveOrgItem/saveResultItem 誘몄젙??
?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧 */

/* ?? ?대? ?곹깭 ?? */
var _orgCtx = { type: null, id: null, mode: 'add' }; // add | edit

/* ?? orgModal ?닿린 (異붽?) ?? */
function openOrgModal(type) {
  var labels = { dept:'遺??, rank:'吏곴툒', pos:'吏곸콉' };
  var label  = labels[type] || type;
  _orgCtx.type = type; _orgCtx.id = null; _orgCtx.mode = 'add';
  var titleEl = document.getElementById('orgModalTitle');
  var labelEl = document.getElementById('orgModalLabel');
  var inputEl = document.getElementById('orgModalInput');
  if (titleEl) titleEl.textContent = label + ' 異붽?';
  if (labelEl) labelEl.textContent = label + ' ?대쫫';
  if (inputEl) { inputEl.value = ''; inputEl.placeholder = label + ' ?대쫫???낅젰?섏꽭??; }
  var m = document.getElementById('orgModal');
  if (m) { m.style.display = 'flex'; setTimeout(function(){ if(inputEl) inputEl.focus(); }, 50); }
}

/* ?? orgModal ?닿린 (?섏젙) ?? */
function editOrgItem(type, id) {
  var lists  = { dept: WS.departments, rank: WS.ranks, pos: WS.positions, result: WS.taskResults };
  var labels = { dept:'遺??, rank:'吏곴툒', pos:'吏곸콉', result:'?낅Т寃곌낵' };
  var list   = lists[type];
  if (!list) return;
  var item = list.find(function(x){ return x.id === id; });
  if (!item) return;

  if (type === 'result') {
    /* ?낅Т寃곌낵??resultModal ?ъ슜 */
    _orgCtx.type = 'result'; _orgCtx.id = id; _orgCtx.mode = 'edit';
    var titleEl = document.getElementById('resultModalTitle');
    var nameEl  = document.getElementById('resultModalName');
    if (titleEl) titleEl.textContent = '?낅Т寃곌낵 ?섏젙';
    if (nameEl)  nameEl.value = item.name || '';
    var m = document.getElementById('resultModal');
    if (m) { m.style.display = 'flex'; setTimeout(function(){ if(nameEl) nameEl.focus(); }, 50); }
    return;
  }

  _orgCtx.type = type; _orgCtx.id = id; _orgCtx.mode = 'edit';
  var label  = labels[type] || type;
  var titleEl2 = document.getElementById('orgModalTitle');
  var labelEl2 = document.getElementById('orgModalLabel');
  var inputEl2 = document.getElementById('orgModalInput');
  if (titleEl2) titleEl2.textContent = label + ' ?섏젙';
  if (labelEl2) labelEl2.textContent = label + ' ?대쫫';
  if (inputEl2) { inputEl2.value = item.name || ''; }
  var m2 = document.getElementById('orgModal');
  if (m2) { m2.style.display = 'flex'; setTimeout(function(){ if(inputEl2){ inputEl2.focus(); inputEl2.select(); } }, 50); }
}

/* ?? orgModal ????? */
function saveOrgItem() {
  var inputEl = document.getElementById('orgModalInput');
  var name = inputEl ? inputEl.value.trim() : '';
  if (!name) { showToast('error', '?대쫫???낅젰?섏꽭??); return; }
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
    showToast('success', name + ' 異붽? ?꾨즺!');
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
    showToast('info', '?섏젙 ?꾨즺!');
  }
  closeOrgModal();
  renderPage_RankMgmt();
}

/* ?? orgModal ?リ린 ?? */
function closeOrgModal() {
  var m = document.getElementById('orgModal');
  if (m) m.style.display = 'none';
  _orgCtx.type = null; _orgCtx.id = null; _orgCtx.mode = 'add';
}

/* ?? resultModal ?닿린 (異붽?) ?? */
function openResultModal() {
  _orgCtx.type = 'result'; _orgCtx.id = null; _orgCtx.mode = 'add';
  var titleEl = document.getElementById('resultModalTitle');
  var nameEl  = document.getElementById('resultModalName');
  if (titleEl) titleEl.textContent = '?낅Т寃곌낵 異붽?';
  if (nameEl)  nameEl.value = '';
  var m = document.getElementById('resultModal');
  if (m) { m.style.display = 'flex'; setTimeout(function(){ if(nameEl) nameEl.focus(); }, 50); }
}

/* ?? resultModal ????? */
function saveResultItem() {
  var nameEl = document.getElementById('resultModalName');
  var name   = nameEl ? nameEl.value.trim() : '';
  if (!name) { showToast('error', '寃곌낵紐낆쓣 ?낅젰?섏꽭??); return; }
  var id   = _orgCtx.id, mode = _orgCtx.mode;

  if (mode === 'add') {
    WS.taskResults.push({ id: Date.now(), name: name, icon: '' });
    WS.saveTaskResults();
    showToast('success', name + ' 異붽? ?꾨즺!');
  } else {
    var item = WS.taskResults.find(function(x){ return x.id === id; });
    if (item) { item.name = name; WS.saveTaskResults(); }
    showToast('info', '?낅Т寃곌낵 ?섏젙 ?꾨즺!');
  }
  closeResultModal();
  renderPage_RankMgmt();
}

/* ?? resultModal ?リ린 ?? */
function closeResultModal() {
  var m = document.getElementById('resultModal');
  if (m) m.style.display = 'none';
}

/* ?? deleteOrgItem ??confirm ?놁씠 利됱떆 ??젣 ?? */
function deleteOrgItem(type, id) {
  var labels = { dept:'遺??, rank:'吏곴툒', pos:'吏곸콉', result:'?낅Т寃곌낵', reportType:'吏꾪뻾蹂닿퀬 ?좏삎' };
  var label  = labels[type] || type;
  if (type === 'dept')       { WS.departments = WS.departments.filter(function(x){ return x.id !== id; }); WS.saveDepts(); }
  else if (type === 'rank')  { WS.ranks = WS.ranks.filter(function(x){ return x.id !== id; }); WS.saveRanks(); }
  else if (type === 'pos')   { WS.positions = WS.positions.filter(function(x){ return x.id !== id; }); WS.savePos(); }
  else if (type === 'result'){ WS.taskResults = WS.taskResults.filter(function(x){ return x.id !== id; }); WS.saveTaskResults(); }
  else if (type === 'reportType'){ WS.reportTypes = WS.reportTypes.filter(function(x){ return x.id !== id; }); WS.saveReportTypes(); }
  renderPage_RankMgmt();
  showToast('info', label + ' ??젣 ?꾨즺!');
}

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧
   ?낅Т遺꾩옣 洹몃━???쒓? 源⑥쭚 ?섏젙
   renderAssignmentByTask / renderAssignmentByStaff
?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧 */
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
      : '<span style="color:var(--text-muted);font-size:11.5px">誘몃같??/span>';
    return '<tr>' +
      '<td style="width:40%"><div style="font-weight:700;font-size:13.5px">' + t.title + '</div><div style="font-size:11px;color:var(--text-muted)">' + (t.team || '') + '</div></td>' +
      '<td><div class="badge-list">' + assigneeHtml + '</div></td>' +
      '<td><div class="score-tag">' + (t.score || 0) + '<span>pt</span></div></td>' +
      '<td style="width:80px"><div class="manage-actions">' +
        '<button class="btn-icon-sm edit" onclick="openTaskAssignModal(' + t.id + ')" title="?대떦 吏곸썝 吏??><i data-lucide="user-plus" class="icon-sm"></i></button>' +
      '</div></td>' +
    '</tr>';
  }).join('');

  el.innerHTML =
    '<table class="task-table">' +
      '<thead><tr>' +
        '<th>?낅Т紐?/th>' +
        '<th>?대떦 吏곸썝</th>' +
        '<th>?먯닔</th>' +
        '<th>愿由?/th>' +
      '</tr></thead>' +
      '<tbody>' + (rows || '<tr><td colspan="4" class="empty-state">?곗씠?곌? ?놁뒿?덈떎.</td></tr>') + '</tbody>' +
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
          '<div><div style="font-weight:700;font-size:13px">' + u.name + '</div><div style="font-size:10.5px;color:var(--text-muted)">' + u.role + ' 쨌 ' + u.dept + '</div></div>' +
        '</div>' +
      '</td>' +
      '<td><div class="badge-list">' + (badges || '<span style="color:var(--text-muted);font-size:11px">諛곗젙???낅Т ?놁쓬</span>') + '</div></td>' +
      '<td style="width:100px"><div class="manage-actions">' +
        '<button class="btn-icon-sm edit" onclick="openAssignmentManageModal(' + u.id + ')" title="?낅Т 諛곗젙 愿由?><i data-lucide="settings-2" class="icon-sm"></i></button>' +
      '</div></td>' +
    '</tr>';
  }).join('');

  el.innerHTML =
    '<table class="task-table">' +
      '<thead><tr>' +
        '<th>吏곸썝 ?뺣낫</th>' +
        '<th>諛곗젙 ?낅Т</th>' +
        '<th>愿由?/th>' +
      '</tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
    '</table>';
  refreshIcons();
}

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧
   ?대떦吏곸썝 諛곗젙 紐⑤떖 ???좉???泥댄겕諛뺤뒪 由ъ뒪??
   openTaskAssignModal / renderTaskAssignStaffList / selectTaskAssignee ?ъ젙??
?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧 */
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
    '?좏깮??<strong style="color:var(--accent-blue)">' + selectedCount + '</strong>紐?/div>';

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
          '<div style="font-size:10.5px;color:var(--text-muted)">' + u.role + ' 쨌 ' + u.dept + '</div>' +
        '</div>' +
        /* 泥댄겕諛뺤뒪 ?ㅽ????좉? */
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

function selectTaskAssignee(taskId, staffId) {
  var t = WS.getTask(taskId);
  if (!t) return;

  if (!Array.isArray(t.assigneeIds)) {
    t.assigneeIds = t.assigneeId ? [t.assigneeId] : [];
  }

  var idx = t.assigneeIds.indexOf(staffId);
  if (idx !== -1) {
    t.assigneeIds.splice(idx, 1);
    showToast('info', '?대떦??諛곗젙???댁젣?섏뿀?듬땲??');
  } else {
    t.assigneeIds.push(staffId);
    var u = WS.getUser(staffId);
    showToast('success', (u ? u.name : '') + '?섏씠 ?대떦?먮줈 諛곗젙?섏뿀?듬땲??');
  }
  WS.saveTasks();
  renderTaskAssignStaffList(taskId);
  renderPage_Tasks();
}

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧
   deleteTask ??confirm() ?쒓굅, 利됱떆 ??젣 + ?좎뒪??
?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧 */
function deleteTask(id) {
  var task = WS.getTask(id);
  if (!task) return;
  var title = task.title || '?낅Т';
  WS.tasks = WS.tasks.filter(function(t) { return t.id !== id; });
  WS.saveTasks();
  renderPage_Tasks();
  showToast('info', '"' + title + '" ??젣 ?꾨즺');
}

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧
   createNewTask ??due ?먮룞?ㅼ젙 + 紐⑤떖 ?リ린 蹂댁옣
?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧 */
function createNewTask() {
  var titleEl = document.getElementById('nt_title');
  var title = titleEl ? titleEl.value.trim() : '';
  if (!title) { showToast('error', '?낅Т ?쒕ぉ???낅젰?섏꽭??); return; }

  // due ?먮룞 ?ㅼ젙 (hidden input)
  var dueEl = document.getElementById('nt_due');
  if (dueEl && !dueEl.value) dueEl.value = new Date().toISOString().split('T')[0];
  var due = dueEl ? dueEl.value : new Date().toISOString().split('T')[0];

  // ? ?좏깮 (泥댄겕諛뺤뒪 蹂듭닔 ?좏깮)
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
    history: [{ date: new Date().toISOString().split('T')[0], event: '?낅Т ?깅줉', detail: WS.currentUser ? WS.currentUser.name : '', icon: 'clipboard-list', color: '#4f6ef7' }]
  };

  WS.tasks.push(nt);
  WS.saveTasks();
  window._newParentId = null;
  window._processTags = [];

  if (typeof closeModalDirect === 'function') closeModalDirect('newTaskModal');
  if (typeof renderDashboard === 'function') renderDashboard();
  if (typeof renderPage_Tasks === 'function') renderPage_Tasks();
  if (typeof renderPage_Settings === 'function') renderPage_Settings();
  showToast('success', '"' + title + '" ?낅Т媛 ?깅줉?섏뿀?듬땲??');
}

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧
   setAssignmentMode ???蹂?紐⑤뱶 異붽?
?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧 */
function setAssignmentMode(mode, el) {
  window._assignmentMode = mode;
  // 移?active ?곹깭
  document.querySelectorAll('#assignmentSubFilter .chip').forEach(function(c) { c.classList.remove('active'); });
  if (el) el.classList.add('active');
  // 吏곸썝 愿由щ쾭???쒖떆
  var sma = document.getElementById('staffManageActions');
  if (sma) sma.style.display = (mode === 'staff') ? 'flex' : 'none';
  renderPage_Tasks();
}

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧
   renderAssignmentByTeam ???蹂???由ъ뒪??
   而щ읆: ? ?뺣낫 / 諛곗젙 ?낅Т / 愿由?
?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧 */
function renderAssignmentByTeam(targetEl) {
  var el = targetEl || document.getElementById('taskListArea');
  if (!el) return;

  var depts = WS.departments || [];
  if (!depts.length) {
    el.innerHTML = '<div class="empty-state" style="padding:40px;text-align:center;color:var(--text-muted)">?(遺?? ?뺣낫媛 ?놁뒿?덈떎.</div>';
    return;
  }

  var rows = depts.map(function(dept) {
    // ?대떦 ???諛곗젙???낅Т 李얘린
    var teamTasks = WS.tasks.filter(function(t) {
      return t.team && t.team.indexOf(dept.name) !== -1;
    });
    var badges = teamTasks.map(function(t) {
      return '<span class="task-badge" style="font-size:11px;padding:3px 8px;border-radius:6px;background:var(--bg-secondary);color:var(--text-primary);margin:2px;display:inline-block">' + t.title + '</span>';
    }).join('');

    // ? 硫ㅻ쾭 李얘린
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
            '<span style="font-size:11px;color:var(--text-muted)">' + members.length + '紐?/span>' +
          '</div>' +
        '</div>' +
      '</td>' +
      '<td>' +
        '<div style="display:flex;flex-wrap:wrap;gap:4px">' +
          (badges || '<span style="color:var(--text-muted);font-size:11px">諛곗젙???낅Т ?놁쓬</span>') +
        '</div>' +
        '<div style="font-size:10px;color:var(--text-muted);margin-top:4px">' + teamTasks.length + '嫄?/div>' +
      '</td>' +
      '<td style="width:80px;text-align:center">' +
        '<button class="btn-icon-sm edit" onclick="openTeamAssignPanel(\'' + dept.name + '\')" title="? ?낅Т 愿由? style="background:none;border:none;cursor:pointer;padding:4px;border-radius:6px;color:var(--text-muted)">' +
          '<i data-lucide="settings-2" style="width:15px;height:15px"></i>' +
        '</button>' +
      '</td>' +
    '</tr>';
  }).join('');

  el.innerHTML =
    '<table class="task-table">' +
      '<thead><tr>' +
        '<th>? ?뺣낫</th>' +
        '<th>諛곗젙 ?낅Т</th>' +
        '<th>愿由?/th>' +
      '</tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
    '</table>';
  refreshIcons();
}

/* ?蹂?愿由?(?ν썑 ?뺤옣?? */
function openTeamAssignPanel(deptName) {
  showToast('info', '"' + deptName + '" ? 愿由?湲곕뒫? 以鍮?以묒엯?덈떎.');
}

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧
   吏곸썝愿由?CRUD ?ъ젙??
   ??openStaffModal ??WS 諛곗뿴 ?덉쟾 泥섎━
   ??deleteStaff    ??confirm() ?쒓굅
   ??saveStaff      ???쒓? ?좎뒪???섏젙
?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧 */
function openStaffModal(id) {
  window._editingStaffId = id || null;

  var titleEl = document.getElementById('staffModalTitle');
  if (titleEl) titleEl.textContent = id ? '吏곸썝 ?뺣낫 ?곸꽭' : '吏곸썝 ?깅줉';

  // ??됲듃 ?듭뀡 ?덉쟾 梨꾩슦湲?
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
      if (lbl) lbl.textContent = u[f] || '?좎쭨 誘몄엯??;
    });
    // ?ъ쭊 誘몃━蹂닿린
    var prev = document.getElementById('st_photo_preview');
    if (prev) {
      if (u.photo) {
        prev.style.backgroundImage = 'url(' + u.photo + ')';
        prev.style.backgroundSize = 'cover';
        prev.style.backgroundPosition = 'center';
        prev.innerHTML = '';
      } else {
        prev.style.backgroundImage = '';
        prev.innerHTML = '<i data-lucide="camera" style="width:28px;height:28px;color:var(--text-muted)"></i><span style="font-size:10px;color:var(--text-muted);margin-top:6px;text-align:center;line-height:1.3">?ъ쭊<br>?깅줉</span>';
      }
    }
    // ?대떦 ?낅Т
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
      }).join('') || '<div style="font-size:11px;color:var(--text-muted)">諛곗젙???낅Т媛 ?놁뒿?덈떎.</div>';
    }
    if (addBtn) addBtn.onclick = function() { closeModalDirect('staffModal'); openNewTaskModal(null, id); };
  } else {
    fields.forEach(function(f) {
      var el = document.getElementById('st_' + f);
      if (el) el.value = (f === 'color') ? '#4f6ef7' : (f === 'status') ? '?ъ쭅' : '';
    });
    ['birthday','hiredAt','resignedAt'].forEach(function(f) {
      var lbl = document.getElementById('st_' + f + '_label');
      if (lbl) lbl.textContent = '?좎쭨 誘몄엯??;
    });
    var taskSection2 = document.getElementById('staffTasksSection');
    if (taskSection2) taskSection2.style.display = 'none';
    var prev2 = document.getElementById('st_photo_preview');
    if (prev2) {
      prev2.style.backgroundImage = '';
      prev2.innerHTML = '<i data-lucide="camera" style="width:28px;height:28px;color:var(--text-muted)"></i><span style="font-size:10px;color:var(--text-muted);margin-top:6px;text-align:center;line-height:1.3">?ъ쭊<br>?깅줉</span>';
    }
    var fileInput = document.getElementById('st_photo_file');
    if (fileInput) fileInput.value = '';
  }

  if (typeof openModal === 'function') openModal('staffModal');
  if (typeof refreshIcons === 'function') refreshIcons();
}

function deleteStaff(id) {
  if (id === (WS.currentUser && WS.currentUser.id)) {
    showToast('error', '蹂몄씤 怨꾩젙? ??젣?????놁뒿?덈떎.');
    return;
  }
  WS.deleteUser(id);
  if (typeof renderPage_StaffMgmt === 'function') renderPage_StaffMgmt();
  if (typeof renderPage_Tasks === 'function') renderPage_Tasks();
  showToast('info', '吏곸썝????젣?섏뿀?듬땲??');
}

function saveStaff() {
  var nameEl = document.getElementById('st_name');
  var name = nameEl ? nameEl.value.trim() : '';
  if (!name) { showToast('error', '?대쫫???낅젰?섏꽭??); return; }

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
    showToast('success', '吏곸썝 ?뺣낫媛 ?섏젙?섏뿀?듬땲??');
  } else {
    WS.addUser(data);
    showToast('success', '??吏곸썝???깅줉?섏뿀?듬땲??');
  }
  if (typeof closeModalDirect === 'function') closeModalDirect('staffModal');
  window._staffPhotoBase64 = null;
  if (typeof renderPage_StaffMgmt === 'function') renderPage_StaffMgmt();
  if (typeof renderPage_Tasks === 'function') renderPage_Tasks();
  if (typeof initHeader === 'function') initHeader();
}

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧
   renderTaskAssignStaffList ??泥댄겕諛뺤뒪??媛뺤“??--accent-primary) ?곸슜
?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧 */
function renderTaskAssignStaffList(taskId) {
  var t = WS.getTask(taskId);
  var container = document.getElementById('tam_staff_list');
  if (!container || !t) return;

  if (!Array.isArray(t.assigneeIds)) {
    t.assigneeIds = t.assigneeId ? [t.assigneeId] : [];
  }

  var selectedCount = t.assigneeIds.length;
  var html = '<div style="margin-bottom:8px;font-size:11px;color:var(--text-muted);text-align:right">' +
    '?좏깮??<strong style="color:var(--accent-blue)">' + selectedCount + '</strong>紐?/div>';

  html += WS.users.map(function(u) {
    var isSelected = t.assigneeIds.includes(u.id);
    return (
      '<div onclick="selectTaskAssignee(' + taskId + ',' + u.id + ')" ' +
      'style="display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:10px;' +
        'border:2px solid ' + (isSelected ? 'var(--accent-blue)' : 'transparent') + ';' +
        'background:' + (isSelected ? 'color-mix(in srgb,var(--accent-blue) 10%,var(--bg-primary))' : 'var(--bg-tertiary)') + ';' +
        'cursor:pointer;transition:all 0.18s;margin-bottom:6px;user-select:none">' +
        '<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,' + (u.color || '#4f6ef7') + ',#9747ff);' +
          'color:#fff;font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0">' +
          u.avatar +
        '</div>' +
        '<div style="flex:1">' +
          '<div style="font-weight:700;font-size:13px;color:var(--text-primary)">' + u.name + '</div>' +
          '<div style="font-size:10.5px;color:var(--text-muted)">' + u.role + ' 쨌 ' + u.dept + '</div>' +
        '</div>' +
        '<div style="width:22px;height:22px;border-radius:6px;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all 0.18s;' +
          (isSelected ? 'background:var(--accent-blue);border:2px solid var(--accent-blue)' : 'background:var(--bg-primary);border:2px solid var(--border-color)') + '">' +
          (isSelected ? '<svg viewBox="0 0 24 24" width="13" height="13" stroke="#fff" stroke-width="3" fill="none"><polyline points="20 6 9 17 4 12"/></svg>' : '') +
        '</div>' +
      '</div>'
    );
  }).join('');

  container.innerHTML = html;
}
