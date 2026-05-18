/**
 * modules/ui.js — WorkM 공통 UI 유틸리티
 *
 * app.js / overrides.js 전역으로 노출합니다.
 * 이 파일은 strings.js 다음, data.js 이전에 로드하세요.
 */

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   날짜 / D-day 유틸
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/**
 * 날짜 문자열 포맷 (YYYY-MM-DD → YYYY년 MM월 DD일)
 * @param {string} dateStr
 * @returns {string}
 */
function fmtDate(dateStr) {
  if (!dateStr) return '-';
  var parts = String(dateStr).substring(0, 10).split('-');
  if (parts.length < 3) return dateStr;
  return parts[0] + '년 ' + parseInt(parts[1]) + '월 ' + parseInt(parts[2]) + '일';
}

/**
 * D-day 숫자 계산
 * @param {string} dueDate - YYYY-MM-DD
 * @returns {number} 양수=남은일, 0=오늘, 음수=지난일
 */
function calcDday(dueDate) {
  if (!dueDate) return null;
  var today = new Date(); today.setHours(0,0,0,0);
  var due   = new Date(dueDate); due.setHours(0,0,0,0);
  return Math.round((due - today) / 86400000);
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   HTML 빌더 유틸
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/**
 * 빈 상태(empty-state) HTML 반환
 * @param {string} msg - 표시할 메시지
 * @param {string} [icon] - 아이콘 emoji (기본: 📋)
 * @returns {string} HTML string
 */
function buildEmptyState(msg, icon) {
  icon = icon || '📋';
  return '<div class="empty-state">'
    + '<div class="es-icon">' + icon + '</div>'
    + '<div class="es-text">' + (msg || '데이터가 없습니다.') + '</div>'
    + '</div>';
}

/**
 * D-day 뱃지 HTML 반환
 * @param {string} dueDate - YYYY-MM-DD
 * @returns {string} HTML string
 */
function buildDdayBadge(dueDate) {
  if (!dueDate) return '';
  var d = calcDday(dueDate);
  if (d === null) return '';
  var label, cls;
  if (d > 0)      { label = 'D-' + d;  cls = d <= 3 ? 'delay' : ''; }
  else if (d < 0) { label = 'D+' + Math.abs(d); cls = 'delay'; }
  else            { label = 'D-Day';  cls = 'today'; }
  return '<span class="dday-badge ' + cls + '">' + label + '</span>';
}

/**
 * 상태 뱃지 HTML 반환
 * @param {string} status - 업무 상태 코드
 * @returns {string} HTML string
 */
function buildStatusBadge(status) {
  var statusMap = {
    progress: { label: '진행중', color: '#4f6ef7' },
    done:     { label: '완료',   color: '#22c55e' },
    delay:    { label: '지연',   color: '#ef4444' },
    waiting:  { label: '대기',   color: '#f59e0b' },
    hold:     { label: '보류',   color: '#8b5cf6' },
    cancel:   { label: '취소',   color: '#6b7280' }
  };
  var info = statusMap[status] || { label: status || '-', color: '#6b7280' };
  return '<span style="display:inline-flex;align-items:center;padding:2px 10px;border-radius:20px;'
    + 'font-size:11px;font-weight:700;background:' + info.color + '18;'
    + 'border:1.5px solid ' + info.color + ';color:' + info.color + '">'
    + info.label + '</span>';
}

/**
 * 아바타 HTML 반환
 * @param {Object} user - { name, color, avatar }
 * @param {string} [size='32px']
 * @returns {string} HTML string
 */
function buildAvatar(user, size) {
  if (!user) return '';
  size = size || '32px';
  var av  = user.avatar || (user.name ? user.name.slice(0,2) : '?');
  var col = user.color  || '#4f6ef7';
  return '<div style="width:' + size + ';height:' + size + ';border-radius:50%;'
    + 'background:linear-gradient(135deg,' + col + ',#9747ff);'
    + 'display:flex;align-items:center;justify-content:center;'
    + 'color:#fff;font-size:12px;font-weight:700;flex-shrink:0;">'
    + av + '</div>';
}

/**
 * 진행률 바 HTML 반환
 * @param {number} progress - 0~100
 * @param {string} [color] - CSS color
 * @returns {string} HTML string
 */
function buildProgressBar(progress, color) {
  progress = Math.min(100, Math.max(0, progress || 0));
  color = color || 'var(--accent-blue)';
  return '<div style="flex:1;height:5px;background:var(--border-color);border-radius:100px;overflow:hidden">'
    + '<div style="width:' + progress + '%;height:100%;background:' + color + ';border-radius:100px;transition:width .4s"></div>'
    + '</div>';
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   모달 유틸
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/**
 * 모달 열기
 * @param {string} id - 모달 element ID
 */
function openModal(id) {
  var m = document.getElementById(id);
  if (m) m.style.display = 'flex';
}

/**
 * 모달 닫기
 * @param {string} id - 모달 element ID
 */
function closeModal(id) {
  var m = document.getElementById(id);
  if (m) m.style.display = 'none';
}

// 전역 노출
if (typeof window !== 'undefined') {
  window.fmtDate        = fmtDate;
  window.calcDday       = calcDday;
  window.buildEmptyState  = buildEmptyState;
  window.buildDdayBadge   = buildDdayBadge;
  window.buildStatusBadge = buildStatusBadge;
  window.buildAvatar      = buildAvatar;
  window.buildProgressBar = buildProgressBar;
  window.openModal        = openModal;
  window.closeModal       = closeModal;
}
