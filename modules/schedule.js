/**
 * modules/schedule.js — 일정보기(Schedule View) 렌더링 및 인터랙션
 * app.js에서 분리된 스케쥴 전용 모듈
 */

window._scheduleYear = window._scheduleYear || new Date().getFullYear();
window._schedCellW   = Math.max(28,  window._schedCellW  || 44);  // 최소 28px
window._schedCellH   = Math.max(52,  window._schedCellH  || 68);  // 최소 52px

/**
 * Phase 3: renderPage_Schedule 분해 버전
 * 원래 346줄 → 6개 서브 함수로 분리
 */

/* ── 상수 ── */
// 월 행 여백 상수: 위 10px(막대 시작 위치), 아래 10px(요일 텍스트 위 여백)
const _SCHED_PAD_TOP = 10;  // 스케쥴바 상단 여백
const _SCHED_PAD_BOT = 10;  // 요일 텍스트 위 하단 여백

const _SCHED_STATUS_COLOR = {
  done:'#22c55e', progress:'#4f6ef7', delay:'#ef4444',
  waiting:'#f59e0b', hold:'#8b5cf6', cancel:'#6b7280',
  fail:'#dc2626', edit:'#06b6d4', add:'#10b981'
};

/* ── 서브1: 각 월에 표시할 업무 계산 ── */
function _schedGetTasksForMonth(allTasks, year, monthIdx) {
  const monthNum   = monthIdx + 1;
  const monthStart = `${year}-${String(monthNum).padStart(2,'0')}-01`;
  const lastDay    = new Date(year, monthNum, 0).getDate();
  const monthEnd   = `${year}-${String(monthNum).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`;
  const normalize  = s => s ? String(s).substring(0,10) : null;

  return allTasks.map(t => {
    const rawStart = normalize(t.startedAt) || normalize(t.dueDate);
    const rawEnd   = normalize(t.dueDate);
    if (!rawStart || !rawEnd) return null;
    if (rawEnd < monthStart || rawStart > monthEnd) return null;
    const sDate    = rawStart > monthStart ? rawStart : monthStart;
    const eDate    = rawEnd   < monthEnd   ? rawEnd   : monthEnd;
    const startDay = parseInt(sDate.substring(8,10)) || 1;
    const endDay   = parseInt(eDate.substring(8,10)) || lastDay;
    return { t, startDay, endDay, rawStart, rawEnd };
  }).filter(Boolean);
}

/* ── 서브2: 컨트롤 바 HTML ── */
function _schedBuildControls(year, cw, ch) {
  const legendItems = [
    {label:'진행중', color:'#4f6ef7'},
    {label:'완료',   color:'#22c55e'},
    {label:'지연',   color:'#ef4444'},
    {label:'대기',   color:'#f59e0b'}
  ];
  const legendHTML = legendItems.map(({label,color}) =>
    `<span style="display:inline-flex;align-items:center;gap:4px;font-size:10.5px;color:var(--text-muted)">
      <span style="width:14px;height:8px;border-radius:3px;background:${color};display:inline-block"></span>${label}
    </span>`
  ).join('') + `<span style="display:inline-flex;align-items:center;gap:4px;font-size:10.5px;color:var(--text-muted)">
    <span style="width:8px;height:8px;border-radius:50%;background:#4f6ef7;display:inline-block;box-shadow:0 0 0 1.5px #4f6ef755"></span>일일업무
  </span>`;

  const knob = (id, type, grad, shadow) => `
    <div style="position:relative;width:80px;height:22px;border-radius:11px;
                background:var(--bg-tertiary);border:1.5px solid var(--border-color);
                display:flex;align-items:center;justify-content:center;overflow:visible;"
         title="좌우로 드래그하여 조절">
      <div style="position:absolute;left:50%;top:3px;bottom:3px;width:1.5px;background:var(--border-color);transform:translateX(-50%);border-radius:2px;"></div>
      <div id="${id}"
        style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
               width:26px;height:26px;border-radius:50%;
               background:${grad};border:2px solid #fff;
               box-shadow:0 2px 8px ${shadow};
               cursor:col-resize;transition:box-shadow .15s;z-index:2;
               display:flex;align-items:center;justify-content:center;"
        onmousedown="_jogLeverStart(event,'${type}')"
        onmouseover="this.style.boxShadow='0 3px 14px ${shadow.replace('45','99')}'"
        onmouseout="if(!window._jogActive)this.style.boxShadow='0 2px 8px ${shadow}'">
        <i data-lucide="grip-vertical" style="width:10px;height:10px;color:#fff;pointer-events:none;"></i>
      </div>
    </div>`;

  return `
  <div style="flex-shrink:0;border-bottom:2px solid var(--border-color);background:var(--bg-secondary);
              padding:9px 16px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;">
    <div style="display:flex;align-items:center;gap:8px;">
      <button onclick="_scheduleChangeYear(-1)"
        style="width:30px;height:30px;border-radius:50%;border:1.5px solid var(--border-color);
               background:var(--bg-primary);color:var(--text-primary);cursor:pointer;
               display:inline-flex;align-items:center;justify-content:center;transition:all .15s"
        onmouseover="this.style.borderColor='var(--accent-blue)'"
        onmouseout="this.style.borderColor='var(--border-color)'">
        <i data-lucide="chevron-left" style="width:14px;height:14px"></i>
      </button>
      <span style="font-size:17px;font-weight:800;min-width:72px;text-align:center;color:var(--text-primary)">${year}년</span>
      <button onclick="_scheduleGoToday()"
        style="padding:4px 12px;border-radius:7px;border:1.5px solid var(--accent-blue);
               background:transparent;color:var(--accent-blue);font-size:12px;font-weight:700;cursor:pointer;transition:all .15s"
        onmouseover="this.style.background='var(--accent-blue)';this.style.color='#fff'"
        onmouseout="this.style.background='transparent';this.style.color='var(--accent-blue)'">현재</button>
      <button onclick="_scheduleChangeYear(1)"
        style="width:30px;height:30px;border-radius:50%;border:1.5px solid var(--border-color);
               background:var(--bg-primary);color:var(--text-primary);cursor:pointer;
               display:inline-flex;align-items:center;justify-content:center;transition:all .15s"
        onmouseover="this.style.borderColor='var(--accent-blue)'"
        onmouseout="this.style.borderColor='var(--border-color)'">
        <i data-lucide="chevron-right" style="width:14px;height:14px"></i>
      </button>
      <div style="display:flex;align-items:center;gap:10px;margin-left:12px;flex-wrap:wrap;">${legendHTML}</div>
    </div>
    <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap;">
      <div style="display:flex;align-items:center;gap:8px;">
        <i data-lucide="move-horizontal" style="width:12px;height:12px;color:var(--text-muted)"></i>
        <span style="font-size:11px;color:var(--text-muted);white-space:nowrap">열 너비 <b id="schedCwVal">${cw}px</b></span>
        ${knob('jogKnob_w','w','linear-gradient(135deg,var(--accent-blue),#9747ff)','rgba(79,110,247,.45)')}
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <i data-lucide="move-vertical" style="width:12px;height:12px;color:var(--text-muted)"></i>
        <span style="font-size:11px;color:var(--text-muted);white-space:nowrap">행 높이 <b id="schedChVal">${ch}px</b></span>
        ${knob('jogKnob_h','h','linear-gradient(135deg,#9747ff,var(--accent-blue))','rgba(151,71,255,.45)')}
      </div>
    </div>
  </div>`;
}

/* ── 서브3: 날짜 헤더 th 행 ── */
function _schedBuildHeader(year, todayStr, today, cw, labelW, maxDays) {
  const days = Array.from({length: maxDays}, (_,i) => i+1);
  const ths = days.map(d => {
    const isToday = (todayStr === `${year}-${String(today.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`);
    return `<th style="width:${cw}px;min-width:${cw}px;max-width:${cw}px;
               text-align:center;font-size:${cw>=36?'11px':'9px'};font-weight:${isToday?900:700};padding:5px 0;
               border-right:${isToday?'1.5px solid rgba(79,110,247,.3)':'1px solid var(--border-color)'};
               border-left:${isToday?'1.5px solid rgba(79,110,247,.3)':'none'};
               border-top:${isToday?'2px solid rgba(79,110,247,.5)':'none'};
               border-bottom:2px solid var(--border-color);
               color:${isToday?'#fff':'var(--text-muted)'};
               background:${isToday?'var(--accent-blue)':'var(--bg-secondary)'};
               overflow:hidden;">${d}</th>`;
  }).join('');
  return `<thead>
    <tr style="position:sticky;top:0;z-index:20;background:var(--bg-secondary);">
      <th style="width:${labelW}px;min-width:${labelW}px;position:sticky;left:0;z-index:30;
                 background:var(--bg-secondary);border-right:2px solid var(--border-color);
                 border-bottom:2px solid var(--border-color);font-size:10px;font-weight:700;
                 color:var(--text-muted);text-align:center;padding:5px 2px;">월 \\ 일</th>
      <th style="width:0;min-width:0;max-width:0;padding:0;border:none;background:var(--bg-secondary);"></th>
      ${ths}
    </tr>
  </thead>`;
}

/* ── 서브4: 날짜 셀(td) 렌더 ── */
function _schedBuildCells(year, monthNum, todayStr, cw, ch, lastDate) {
  const days = Array.from({length: 31}, (_,i) => i+1);
  return days.map(d => {
    const isValid = d <= lastDate;
    const dt = `${year}-${String(monthNum).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dow = isValid ? new Date(year, monthNum-1, d).getDay() : -1;
    const isToday = dt === todayStr;
    const isSun = dow === 0, isSat = dow === 6;
    const bg = !isValid ? 'var(--bg-tertiary)'
      : isToday ? 'rgba(79,110,247,.12)'
      : isSun ? 'rgba(239,68,68,.04)'
      : isSat ? 'rgba(79,110,247,.04)'
      : 'var(--bg-primary)';
    const dowLabels = ['일','월','화','수','목','금','토'];
    const dowLabel = isValid ? dowLabels[dow] : '';
    const dowColor = dow===0 ? '#ef4444' : dow===6 ? '#4f6ef7' : 'var(--text-muted)';
    return `<td data-date="${dt}" data-day="${d}"
      id="sched-cell-${year}-${monthNum}-${d}"
      style="width:${cw}px;min-width:${cw}px;max-width:${cw}px;
             height:${ch}px;padding:0;vertical-align:top;
             background:${bg};
             border-right:${isToday?'1.5px solid rgba(79,110,247,.25)':'1px solid var(--border-color)'};
             border-left:${isToday?'1.5px solid rgba(79,110,247,.25)':'none'};
             border-bottom:1px solid var(--border-color);
             ${!isValid?'opacity:.35;':''}
             position:relative;overflow:hidden;">
      ${isValid && cw >= 28 ? `<div style="position:absolute;bottom:${_SCHED_PAD_BOT}px;left:0;right:0;
        font-size:${cw>=40?'9px':'7.5px'};font-weight:800;
        color:${dowColor};opacity:.75;pointer-events:none;
        text-align:center;line-height:1;z-index:10;">${dowLabel}</div>` : ''}
    </td>`;
  }).join('');
}

/* ── 서브5: 업무 막대 + 도트 렌더 ── */
/* rowH: 실제 행 높이(동적 계산 후 전달) / ch: 기본 높이(trackH 초기 추정에 사용) */
function _schedBuildBarsAndDots(monthTasks, year, monthNum, cw, rowH, labelW, trackH) {
  let bars = '';
  const dotMap = {};
  if (!monthTasks.length) return {bars, dotMap, maxTrack: 0};

  const tracks = [];
  const sorted = [...monthTasks].sort((a,b) => a.startDay - b.startDay);
  let maxTrack = 0;

  const dowH   = cw >= 28 ? 12 : 0;
  // trackH는 renderPage에서 전달받은 값 사용 (월별 일관성 보장)
  // 전달받지 못한 경우에만 fallback 계산
  if (!trackH) {
    const usable = rowH - dowH - _SCHED_PAD_BOT;
    trackH = Math.max(14, Math.min(22, (usable - _SCHED_PAD_TOP) / 3));
  }

  sorted.forEach(({t, startDay, endDay, rawStart, rawEnd}) => {
    const c    = _SCHED_STATUS_COLOR[t.status] || '#4f6ef7';
    const prog = t.progress || 0;
    const isOneDay = (rawStart === rawEnd) || (startDay === endDay) || (t.taskNature === '일일업무');

    if (isOneDay) {
      const day = (t.taskNature === '일일업무')
        ? (parseInt((rawEnd||'').substring(8)) || endDay)
        : endDay;
      if (!dotMap[day]) dotMap[day] = [];
      const dotSize = Math.min(10, Math.max(7, cw / 5));
      dotMap[day].push(`
        <div onclick="openTaskDetail(${t.id})"
          title="${t.title} (${rawEnd})${t.taskNature==='일일업무'?' | 일일업무':''} | ${prog}%"
          style="display:flex;align-items:center;gap:3px;padding:1px 3px;cursor:pointer;
                 overflow:hidden;max-width:100%;transition:opacity .15s;"
          onmouseover="this.style.opacity='.7'" onmouseout="this.style.opacity='1'">
          <span style="width:${dotSize}px;height:${dotSize}px;border-radius:50%;
                 background:${c};flex-shrink:0;display:inline-block;
                 box-shadow:0 0 0 1.5px ${c}55;"></span>
          <span style="font-size:9px;font-weight:700;color:${c};
                 white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${t.title}</span>
        </div>`);
    } else {
      let track = 0;
      while (tracks[track] && tracks[track] >= startDay) track++;
      tracks[track] = endDay;
      if (track > maxTrack) maxTrack = track;

      const barLeft  = (startDay - 1) * cw;  // 헬퍼td가 labelW 위치에서 시작하므로 labelW 제외
      const barWidth = (endDay - startDay + 1) * cw - 4;
      const barTop   = _SCHED_PAD_TOP + track * trackH;   // 상단 10px 여백 후 막대 배치
      const barH     = Math.max(0, Math.min(trackH - 2, (rowH - dowH - _SCHED_PAD_BOT) - barTop - 2));  // 요일 위 10px 내에 클리핑
      const mStr     = `${year}-${String(monthNum).padStart(2,'0')}`;
      const borderL  = rawStart.substring(0,7) === mStr ? '6px' : '0px';
      const borderR  = rawEnd.substring(0,7)   === mStr ? '6px' : '0px';

      if (barH <= 0) return;  // 바 공간이 없으면 렌더링 스킵 (요일 영역 침범 방지)
      bars += `<div
        onclick="openTaskDetail(${t.id})"
        title="${t.title} (${rawStart||'?'} ~ ${rawEnd}) | ${prog}% | ${t.status}"
        style="position:absolute;left:${barLeft}px;top:${barTop}px;
          width:${Math.max(barWidth,cw-4)}px;height:${barH}px;
          border-radius:${borderL} ${borderR} ${borderR} ${borderL};
          background:${c}22;border:1.5px solid ${c};cursor:pointer;
          overflow:hidden;z-index:5;display:flex;align-items:center;
          box-shadow:0 1px 4px ${c}44;transition:transform .1s,box-shadow .1s;"
        onmouseover="this.style.transform='scaleY(1.08)';this.style.boxShadow='0 3px 10px ${c}66';this.style.zIndex=15"
        onmouseout="this.style.transform='';this.style.boxShadow='0 1px 4px ${c}44';this.style.zIndex=5">
        <div style="position:absolute;left:0;top:0;bottom:0;width:${prog}%;background:${c};opacity:.35;border-radius:${borderL} 0 0 ${borderL};pointer-events:none;"></div>
        <div style="position:relative;z-index:1;display:flex;align-items:center;gap:4px;padding:0 6px;width:100%;overflow:hidden;">
          <span style="font-size:9.5px;font-weight:700;color:${c};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;">${t.title}</span>
          <span style="font-size:9px;font-weight:800;color:${c};white-space:nowrap;flex-shrink:0;">${prog}%</span>
        </div>
      </div>`;
    }
  });
  return {bars, dotMap, maxTrack};
}

/* ── 서브6: 도트 주입 인라인 스크립트 ── */
function _schedBuildDotScript(dotMap, year, monthNum) {
  if (!Object.keys(dotMap).length) return '';
  const entries = Object.entries(dotMap).map(([day, htmls]) =>
    `var _c=document.getElementById('sched-cell-${year}-${monthNum}-${day}');if(_c){_c.insertAdjacentHTML('beforeend',${JSON.stringify(htmls.join(''))});}`
  ).join('');
  return `<script>${entries}<\/script>`;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   renderPage_Schedule — 메인 진입점 (분해 후)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function renderPage_Schedule() {
  const el = document.getElementById('scheduleArea');
  if (!el) return;

  const today    = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const year     = window._scheduleYear;
  const thisYear = today.getFullYear();
  const months   = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
  const maxDays  = 31;
  const cw       = window._schedCellW;
  const ch       = window._schedCellH;
  const labelW   = 52;

  // 연도가 겹치는 업무만 사전 필터
  const allTasks = (WS.tasks || []).filter(t => {
    const end   = t.dueDate || null;
    const start = t.startedAt || t.dueDate || null;
    if (!end) return false;
    const endYear   = parseInt((end||'').substring(0,4));
    const startYear = parseInt((start||end).substring(0,4));
    return (startYear <= year && endYear >= year);
  });

  // 컨트롤 바
  const controls = _schedBuildControls(year, cw, ch);
  // 날짜 헤더
  const header   = _schedBuildHeader(year, todayStr, today, cw, labelW, maxDays);

  // 12개월 tbody 행 빌드 — 업무 수에 따라 월별 높이 동적 결정
  const dowH   = cw >= 28 ? 12 : 0;          // 요일 라벨 공간(px)
  const baseUsable = ch - dowH;               // 기본 사용 가능 높이
  const trackH = Math.min(22, Math.max(14, baseUsable / 3)); // 트랙 1개 높이

  const rows = months.map((mLabel, mi) => {
    const monthNum       = mi + 1;
    const lastDate       = new Date(year, monthNum, 0).getDate();
    const isCurrentMonth = (monthNum === today.getMonth()+1 && year === thisYear);
    const monthTasks     = _schedGetTasksForMonth(allTasks, year, mi);

    // 1-pass: maxTrack 파악 (막대 업무만 카운트)
    const barTasks = monthTasks.filter(({rawStart, rawEnd, startDay, endDay, t}) =>
      !(rawStart === rawEnd || startDay === endDay || t.taskNature === '일일업무')
    );
    let maxTrack = 0;
    if (barTasks.length > 0) {
      const tmpTracks = [];
      [...barTasks].sort((a,b) => a.startDay - b.startDay).forEach(({startDay, endDay}) => {
        let tk = 0;
        while (tmpTracks[tk] && tmpTracks[tk] >= startDay) tk++;
        tmpTracks[tk] = endDay;
        if (tk > maxTrack) maxTrack = tk;
      });
    }

    // 2-pass: rowH 확정 후 실제 bars/dots 렌더
    // 막대 있는 월: 최소 52px 보장 (bar 1개 이상 온전히 표시)
    // 막대 있는 월 최소 행 높이 = 상단여백(_PAD_TOP) + 막대최소(16) + 요일(dowH) + 하단여백(_PAD_BOT)
    const MIN_BAR_ROW_H = _SCHED_PAD_TOP + 16 + dowH + _SCHED_PAD_BOT;  // 10+16+10+10 = 46px 이상
    const rowH = barTasks.length > 0
      ? Math.max(MIN_BAR_ROW_H, ch, _SCHED_PAD_TOP + (maxTrack + 1) * trackH + dowH + _SCHED_PAD_BOT + 4)
      : ch;

    const {bars, dotMap} = _schedBuildBarsAndDots(monthTasks, year, monthNum, cw, rowH, labelW, trackH);
    const cells     = _schedBuildCells(year, monthNum, todayStr, cw, rowH, lastDate);
    const dotScript = _schedBuildDotScript(dotMap, year, monthNum);

    // 헬퍼 td: width=0, overflow=visible, position=relative → bars가 이 안에서 절대 위치로 배치됨
    // 헬퍼 td: width=0, overflow=visible → bars가 이 안에서 절대 위치로 배치됨
    // 헬퍼 td는 sticky가 아니므로 좌우 스크롤 시 bars가 그리드와 함께 이동함
    return `<tr style="position:relative;">
      <td style="position:sticky;left:0;z-index:10;
                 width:${labelW}px;min-width:${labelW}px;height:${rowH}px;
                 background:${isCurrentMonth?'rgba(79,110,247,.08)':'var(--bg-secondary)'};
                 border-right:2px solid var(--border-color);border-bottom:1px solid var(--border-color);
                 padding:0;text-align:center;vertical-align:middle;overflow:visible;">
        <div style="font-size:12px;font-weight:${isCurrentMonth?800:600};
             color:${isCurrentMonth?'var(--accent-blue)':'var(--text-secondary)'};">
          ${mLabel}
          ${isCurrentMonth?'<div style="width:5px;height:5px;border-radius:50%;background:var(--accent-blue);margin:2px auto 0"></div>':''}
        </div>
      </td>
      <td style="width:0;min-width:0;max-width:0;padding:0;border:0;
                 overflow:visible;position:relative;height:${rowH}px;z-index:4;">
        ${bars}
      </td>
      ${cells}
      ${dotScript}
    </tr>`;
  }).join('');

  el.innerHTML = `
  <div style="display:flex;flex-direction:column;height:100%;overflow:hidden;
              border:1.5px solid var(--border-color);border-radius:14px;background:var(--bg-primary);">
    ${controls}
    <div id="schedScrollArea" style="flex:1;overflow:auto;position:relative;cursor:grab;user-select:none;"
      onmousedown="_schedDragStart(event,this)"
      onmousemove="_schedDragMove(event,this)"
      onmouseup="_schedDragEnd(this)"
      onmouseleave="_schedDragEnd(this)">
      <table style="border-collapse:collapse;table-layout:fixed;width:${labelW + cw*maxDays}px;">
        ${header}
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>`;

  setTimeout(refreshIcons, 50);
}

/* 연도 변경 */
function _scheduleChangeYear(delta) {
  window._scheduleYear = (window._scheduleYear || new Date().getFullYear()) + delta;
  renderPage_Schedule();
}

/* 현재 → 올해 */
function _scheduleGoToday() {
  window._scheduleYear = new Date().getFullYear();
  renderPage_Schedule();
}

/* 열 너비 슬라이더 */
function _schedUpdateCellW(val) {
  window._schedCellW = Number(val);
  renderPage_Schedule();
}

/* 행 높이 슬라이더 */
function _schedUpdateCellH(val) {
  window._schedCellH = Number(val);
  renderPage_Schedule();
}

/* ── 일정보기 조이스틱 레버 스크롤 ── */
(function() {
  var _sd = { dragging: false, startX: 0, startY: 0, scrollX: 0, scrollY: 0 };
  window._schedDragStart = function(e, el) {
    if (e.button !== 0) return;
    if (e.target.closest('button,input,select,a,[id^="jogKnob"]')) return;
    _sd.dragging = true;
    _sd.startX = e.clientX;
    _sd.startY = e.clientY;
    _sd.scrollX = el.scrollLeft;
    _sd.scrollY = el.scrollTop;
    el.style.cursor = 'grabbing';
  };
  window._schedDragMove = function(e, el) {
    if (!_sd.dragging) return;
    e.preventDefault();
    var dx = e.clientX - _sd.startX;
    var dy = e.clientY - _sd.startY;
    el.scrollLeft = _sd.scrollX - dx;
    el.scrollTop  = _sd.scrollY - dy;
  };
  window._schedDragEnd = function(el) {
    _sd.dragging = false;
    el.style.cursor = 'grab';
  };
})();

/* ── 조이스틱 레버 컨트롤 ──
   오른쪽 드래그: 값 증가 / 왼쪽: 값 감소
   중앙에서 멀수록 변화 속도 햨쭙
   마우스 릴리즈 시 레버 부드럽게 중앙으로 복귀
*/
(function() {
  var _jog = {
    active: false,
    type: null,       // 'w' | 'h'
    startX: 0,
    offsetX: 0,       // 레버 현재 위치 온셋
    raf: null,        // requestAnimationFrame ID
    snapRaf: null,    // 스냅벱 애니매이션 ID
    TRACK_HALF: 37,   // 트랙 반 너비 (px) – 레버가 이것만큼 이동함
    STEP_MAX: 6,      // 한 틱당 최대 증감량
    SPEED_EXP: 1.8    // 속도 지수 (1 = 선형)
  };

  function knobEl(type) {
    return document.getElementById('jogKnob_' + type);
  }

  function labelEl(type) {
    return document.getElementById(type === 'w' ? 'schedCwVal' : 'schedChVal');
  }

  // 레버 위치를 offsetX에 맞춰 DOM 업데이트
  function updateKnobPos(type, ox) {
    var el = knobEl(type);
    if (!el) return;
    // clamp
    var clamped = Math.max(-_jog.TRACK_HALF, Math.min(_jog.TRACK_HALF, ox));
    el.style.left = 'calc(50% + ' + clamped + 'px)';
  }

  // 레버 스냅 애니매이션: 적새 offsetX를 0으로 수렴
  function snapBack(type) {
    _jog.offsetX = _jog.offsetX * 0.62; // 지수 감소
    updateKnobPos(type, _jog.offsetX);
    if (Math.abs(_jog.offsetX) > 0.5) {
      _jog.snapRaf = requestAnimationFrame(function() { snapBack(type); });
    } else {
      _jog.offsetX = 0;
      updateKnobPos(type, 0);
    }
  }

  // 레버가 활성화된 동안 매 틱마다 값을 증감
  function tickLoop() {
    if (!_jog.active) return;
    var ox = _jog.offsetX; // -TRACK_HALF ~ +TRACK_HALF
    var ratio = ox / _jog.TRACK_HALF; // -1 ~ +1
    var speed = Math.pow(Math.abs(ratio), _jog.SPEED_EXP) * Math.sign(ratio) * _jog.STEP_MAX;
    if (Math.abs(speed) > 0.3) {
      if (_jog.type === 'w') {
        var nw = Math.round(Math.max(28, Math.min(160, (window._schedCellW || 44) + speed)));  // 최소 28px
        window._schedCellW = nw;
        renderPage_Schedule();
        // 재렌더 후 레버 위치 복원
        updateKnobPos('w', _jog.offsetX);
        var lbl = labelEl('w');
        if (lbl) lbl.textContent = nw + 'px';
      } else {
        var nh = Math.round(Math.max(_SCHED_MIN_CH, Math.min(220, (window._schedCellH || 68) + speed)));  // 최소 52px
        window._schedCellH = nh;
        renderPage_Schedule();
        // 재렌더 후 레버 위치 복원
        updateKnobPos('h', _jog.offsetX);
        var lbl2 = labelEl('h');
        if (lbl2) lbl2.textContent = nh + 'px';
      }
    }
    _jog.raf = setTimeout(tickLoop, 80); // ~12fps 업데이트
  }

  window._jogLeverStart = function(e, type) {
    e.preventDefault();
    e.stopPropagation();
    if (_jog.snapRaf) cancelAnimationFrame(_jog.snapRaf);
    if (_jog.raf) clearTimeout(_jog.raf);
    _jog.active = true;
    _jog.type = type;
    _jog.startX = e.clientX;
    _jog.offsetX = 0;
    window._jogActive = true;
    var k = knobEl(type);
    if (k) k.style.transition = 'box-shadow .15s';
    tickLoop();

    function onMove(ev) {
      if (!_jog.active) return;
      var dx = ev.clientX - _jog.startX;
      _jog.offsetX = Math.max(-_jog.TRACK_HALF, Math.min(_jog.TRACK_HALF, dx));
      updateKnobPos(type, _jog.offsetX);
    }
    function onUp() {
      _jog.active = false;
      window._jogActive = false;
      clearTimeout(_jog.raf);
      var k2 = knobEl(type);
      if (k2) k2.style.transition = 'left .35s cubic-bezier(.22,1,.36,1), box-shadow .15s';
      snapBack(type);
      setTimeout(function() {
        var k3 = knobEl(type);
        if (k3) k3.style.transition = 'box-shadow .15s';
      }, 400);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };
})();

