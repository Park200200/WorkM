/**
 * modules/accounting.js
 * 회계관리 모듈 – 예산 · 품의 · 전표 · 입출금 통합 경리 시스템
 * localStorage 키: acct_budgets, acct_approvals, acct_slips
 */

/* ══════════════════════════════════════════
   모드 진입 / 이탈
══════════════════════════════════════════ */

function enterAccountingMode() {
  var mainNav = document.getElementById('mainNav');
  var acctNav = document.getElementById('acctNav');
  var homepageNav = document.getElementById('homepageNav');
  if (mainNav) mainNav.style.display = 'none';
  if (homepageNav) homepageNav.style.display = 'none';
  if (acctNav) acctNav.style.display = 'block';
  // 첫 서브페이지(기본현황) 자동 표시
  var firstItem = document.querySelector('#acctNav [data-acct-page="acct-overview"]');
  showAcctPage('acct-overview', firstItem);
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 60);
}

function exitAccountingMode() {
  var mainNav = document.getElementById('mainNav');
  var acctNav = document.getElementById('acctNav');
  if (acctNav) acctNav.style.display = 'none';
  if (mainNav) mainNav.style.display = 'block';
  var headerSearch = document.getElementById('headerSearch');
  var acctBar = document.getElementById('acctModeBar');
  if (headerSearch) headerSearch.style.display = '';
  if (acctBar) acctBar.style.display = 'none';
  var dashEl = document.querySelector('[data-page="dashboard"]');
  if (typeof showPage === 'function') showPage('dashboard', dashEl);
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 60);
}

/* ── 서브페이지 전환 ── */
function showAcctPage(pageId, navEl) {
  var subPages = ['acct-overview','acct-budget','acct-approval','acct-expense','acct-income','acct-payment'];
  subPages.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) { el.style.display = 'none'; el.classList.remove('active'); }
  });
  var target = document.getElementById(pageId);
  if (target) { target.style.display = 'block'; target.classList.add('active'); }
  document.querySelectorAll('#acctNav .nav-item').forEach(function(n) { n.classList.remove('active'); });
  if (navEl) navEl.classList.add('active');

  // 페이지별 렌더
  if (pageId === 'acct-overview') _acctRenderOverview();
  if (pageId === 'acct-budget') _acctRenderBudget();
  if (pageId === 'acct-approval') _acctRenderApproval();
  if (pageId === 'acct-expense') _acctRenderSlips('expense');
  if (pageId === 'acct-income') _acctRenderSlips('income');
  if (pageId === 'acct-payment') _acctRenderSlips('expense');
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 80);
}

/* ══════════════════════════════════════════
   데이터 유틸
══════════════════════════════════════════ */
function _acctLoad(key, fallback) {
  try { var r = localStorage.getItem(key); return r ? JSON.parse(r) : (fallback || []); }
  catch(e) { return fallback || []; }
}
function _acctSave(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch(e) {}
}
function _acctNextId(arr) {
  var max = 0; arr.forEach(function(a) { if (a.id > max) max = a.id; }); return max + 1;
}
function _acctFmt(n) {
  if (n === undefined || n === null) return '0';
  return Number(n).toLocaleString('ko-KR');
}
function _acctToday() {
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
function _acctEsc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

/* ══════════════════════════════════════════
   ① 기본현황 대시보드
══════════════════════════════════════════ */
function _acctRenderOverview() {
  var el = document.getElementById('acct-overview');
  if (!el) return;
  var budgets = _acctLoad('acct_budgets');
  var slips = _acctLoad('acct_slips');
  var approvals = _acctLoad('acct_approvals');

  var totalBudget = 0, totalUsed = 0;
  budgets.forEach(function(b) { totalBudget += (Number(b.amount)||0); totalUsed += (Number(b.used)||0); });
  var totalIncome = 0, totalExpense = 0;
  slips.forEach(function(s) {
    if (s.type === 'income') totalIncome += (Number(s.amount)||0);
    else totalExpense += (Number(s.amount)||0);
  });
  var balance = totalBudget - totalExpense + totalIncome;
  var pendingCount = approvals.filter(function(a) { return a.status === 'pending'; }).length;

  var cardStyle = 'flex:1;min-width:160px;background:var(--bg-tertiary);border:1.5px solid var(--border-color);border-radius:14px;padding:18px 20px';
  var labelStyle = 'font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;display:flex;align-items:center;gap:6px';
  var valStyle = 'font-size:22px;font-weight:900;letter-spacing:-.5px';

  var html = '';
  html += '<div class="page-header"><div>';
  html += '<div class="page-title">기본현황</div>';
  html += '<div class="page-subtitle">전체 수입·지출 현황 요약</div>';
  html += '</div></div>';

  // 요약 카드 4개
  html += '<div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:20px">';
  html += '<div style="' + cardStyle + '">';
  html += '<div style="' + labelStyle + '"><i data-lucide="wallet" style="width:14px;height:14px;color:#4f6ef7"></i> 총 예산</div>';
  html += '<div style="' + valStyle + 'color:#4f6ef7">₩' + _acctFmt(totalBudget) + '</div>';
  html += '</div>';
  html += '<div style="' + cardStyle + '">';
  html += '<div style="' + labelStyle + '"><i data-lucide="trending-down" style="width:14px;height:14px;color:#ef4444"></i> 총 지출</div>';
  html += '<div style="' + valStyle + 'color:#ef4444">₩' + _acctFmt(totalExpense) + '</div>';
  html += '</div>';
  html += '<div style="' + cardStyle + '">';
  html += '<div style="' + labelStyle + '"><i data-lucide="trending-up" style="width:14px;height:14px;color:#22c55e"></i> 총 입금</div>';
  html += '<div style="' + valStyle + 'color:#22c55e">₩' + _acctFmt(totalIncome) + '</div>';
  html += '</div>';
  html += '<div style="' + cardStyle + '">';
  html += '<div style="' + labelStyle + '"><i data-lucide="banknote" style="width:14px;height:14px;color:#f59e0b"></i> 잔액</div>';
  html += '<div style="' + valStyle + 'color:#f59e0b">₩' + _acctFmt(balance) + '</div>';
  html += '</div>';
  html += '</div>';

  // 2컬럼: 예산 사용률 + 최근 전표
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">';

  // 예산 사용률
  html += '<div style="background:var(--bg-tertiary);border:1.5px solid var(--border-color);border-radius:14px;padding:18px">';
  html += '<div style="font-size:13px;font-weight:800;color:var(--text-primary);margin-bottom:14px;display:flex;align-items:center;gap:6px"><i data-lucide="bar-chart-3" style="width:15px;height:15px;color:#4f6ef7"></i> 예산 사용률</div>';
  if (!budgets.length) {
    html += '<div style="text-align:center;padding:30px;color:var(--text-muted);font-size:13px"><i data-lucide="inbox" style="width:28px;height:28px;display:block;margin:0 auto 8px;opacity:.3"></i>등록된 예산이 없습니다</div>';
  } else {
    budgets.forEach(function(b) {
      var pct = b.amount > 0 ? Math.min(100, Math.round((b.used / b.amount) * 100)) : 0;
      var barColor = pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#4f6ef7';
      html += '<div style="margin-bottom:12px">';
      html += '<div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:12px;font-weight:700;color:var(--text-secondary)">' + _acctEsc(b.name) + '</span><span style="font-size:11px;font-weight:800;color:' + barColor + '">' + pct + '%</span></div>';
      html += '<div style="height:6px;background:var(--border-color);border-radius:100px;overflow:hidden"><div style="height:100%;width:' + pct + '%;background:' + barColor + ';border-radius:100px;transition:width .4s"></div></div>';
      html += '<div style="font-size:10px;color:var(--text-muted);margin-top:2px">₩' + _acctFmt(b.used) + ' / ₩' + _acctFmt(b.amount) + '</div>';
      html += '</div>';
    });
  }
  html += '</div>';

  // 최근 전표
  html += '<div style="background:var(--bg-tertiary);border:1.5px solid var(--border-color);border-radius:14px;padding:18px">';
  html += '<div style="font-size:13px;font-weight:800;color:var(--text-primary);margin-bottom:14px;display:flex;align-items:center;gap:6px"><i data-lucide="receipt" style="width:15px;height:15px;color:#8b5cf6"></i> 최근 전표</div>';
  var recentSlips = slips.slice().sort(function(a,b) { return (b.id||0) - (a.id||0); }).slice(0, 8);
  if (!recentSlips.length) {
    html += '<div style="text-align:center;padding:30px;color:var(--text-muted);font-size:13px"><i data-lucide="inbox" style="width:28px;height:28px;display:block;margin:0 auto 8px;opacity:.3"></i>등록된 전표가 없습니다</div>';
  } else {
    recentSlips.forEach(function(s) {
      var isIncome = s.type === 'income';
      var icon = isIncome ? 'arrow-down-circle' : 'arrow-up-circle';
      var color = isIncome ? '#22c55e' : '#ef4444';
      var sign = isIncome ? '+' : '-';
      html += '<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--border-color)">';
      html += '<i data-lucide="' + icon + '" style="width:16px;height:16px;color:' + color + ';flex-shrink:0"></i>';
      html += '<span style="flex:1;font-size:12px;font-weight:600;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + _acctEsc(s.memo || s.counterpart || '-') + '</span>';
      html += '<span style="font-size:12px;font-weight:800;color:' + color + '">' + sign + '₩' + _acctFmt(s.amount) + '</span>';
      html += '<span style="font-size:10px;color:var(--text-muted);flex-shrink:0">' + (s.date || '') + '</span>';
      html += '</div>';
    });
  }
  html += '</div>';
  html += '</div>';

  // 대기중 품의
  if (pendingCount > 0) {
    var pending = approvals.filter(function(a) { return a.status === 'pending'; });
    html += '<div style="background:var(--bg-tertiary);border:1.5px solid rgba(245,158,11,.3);border-radius:14px;padding:18px">';
    html += '<div style="font-size:13px;font-weight:800;color:var(--text-primary);margin-bottom:12px;display:flex;align-items:center;gap:6px"><i data-lucide="clock" style="width:15px;height:15px;color:#f59e0b"></i> 승인 대기 품의 <span style="font-size:11px;background:#f59e0b22;color:#f59e0b;border-radius:10px;padding:1px 8px;font-weight:700">' + pendingCount + '건</span></div>';
    pending.forEach(function(a) {
      html += '<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--bg-secondary);border-radius:10px;margin-bottom:6px">';
      html += '<span style="flex:1;font-size:12.5px;font-weight:700;color:var(--text-primary)">' + _acctEsc(a.title) + '</span>';
      html += '<span style="font-size:12px;font-weight:800;color:#ef4444">₩' + _acctFmt(a.amount) + '</span>';
      html += '<button onclick="_acctApprove(' + a.id + ')" style="padding:4px 12px;border-radius:8px;background:#22c55e;color:#fff;border:none;font-size:11px;font-weight:700;cursor:pointer">승인</button>';
      html += '<button onclick="_acctReject(' + a.id + ')" style="padding:4px 12px;border-radius:8px;background:#ef4444;color:#fff;border:none;font-size:11px;font-weight:700;cursor:pointer">반려</button>';
      html += '</div>';
    });
    html += '</div>';
  }

  el.innerHTML = html;
  if (typeof refreshIcons === 'function') refreshIcons();
}

/* ══════════════════════════════════════════
   ② 예산설정
══════════════════════════════════════════ */
function _acctRenderBudget() {
  var el = document.getElementById('acct-budget');
  if (!el) return;
  var budgets = _acctLoad('acct_budgets');

  var html = '';
  html += '<div class="page-header"><div>';
  html += '<div class="page-title">예산설정</div>';
  html += '<div class="page-subtitle">부서별·항목별 예산 배정 및 관리</div>';
  html += '</div><div>';
  html += '<button onclick="_acctOpenBudgetModal()" class="btn btn-blue" style="display:inline-flex;align-items:center;gap:5px"><i data-lucide="plus" style="width:14px;height:14px"></i> 예산 추가</button>';
  html += '</div></div>';

  html += '<div style="background:var(--bg-tertiary);border:1.5px solid var(--border-color);border-radius:14px;overflow:hidden">';
  html += '<table style="width:100%;border-collapse:collapse;font-size:12.5px">';
  html += '<thead><tr style="background:var(--bg-secondary);border-bottom:1.5px solid var(--border-color)">';
  html += '<th style="padding:12px 16px;text-align:left;font-weight:800;color:var(--text-muted);font-size:11px;letter-spacing:.5px">분류</th>';
  html += '<th style="padding:12px 16px;text-align:left;font-weight:800;color:var(--text-muted);font-size:11px">예산명</th>';
  html += '<th style="padding:12px 16px;text-align:right;font-weight:800;color:var(--text-muted);font-size:11px">배정액</th>';
  html += '<th style="padding:12px 16px;text-align:right;font-weight:800;color:var(--text-muted);font-size:11px">사용액</th>';
  html += '<th style="padding:12px 16px;text-align:right;font-weight:800;color:var(--text-muted);font-size:11px">잔액</th>';
  html += '<th style="padding:12px 16px;text-align:center;font-weight:800;color:var(--text-muted);font-size:11px;width:140px">사용률</th>';
  html += '<th style="padding:12px 16px;text-align:center;font-weight:800;color:var(--text-muted);font-size:11px;width:80px">관리</th>';
  html += '</tr></thead><tbody>';

  if (!budgets.length) {
    html += '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted)">';
    html += '<i data-lucide="wallet" style="width:32px;height:32px;display:block;margin:0 auto 10px;opacity:.25"></i>';
    html += '등록된 예산이 없습니다</td></tr>';
  } else {
    budgets.forEach(function(b) {
      var remain = (b.amount || 0) - (b.used || 0);
      var pct = b.amount > 0 ? Math.min(100, Math.round((b.used / b.amount) * 100)) : 0;
      var barColor = pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#4f6ef7';
      html += '<tr style="border-bottom:1px solid var(--border-color)">';
      html += '<td style="padding:12px 16px"><span style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;background:rgba(79,110,247,.1);color:#4f6ef7;font-size:11px;font-weight:700">' + _acctEsc(b.category || '기타') + '</span></td>';
      html += '<td style="padding:12px 16px;font-weight:700;color:var(--text-primary)">' + _acctEsc(b.name) + '</td>';
      html += '<td style="padding:12px 16px;text-align:right;font-weight:700;color:var(--text-primary)">₩' + _acctFmt(b.amount) + '</td>';
      html += '<td style="padding:12px 16px;text-align:right;font-weight:700;color:#ef4444">₩' + _acctFmt(b.used) + '</td>';
      html += '<td style="padding:12px 16px;text-align:right;font-weight:700;color:' + (remain >= 0 ? '#22c55e' : '#ef4444') + '">₩' + _acctFmt(remain) + '</td>';
      html += '<td style="padding:12px 16px;text-align:center"><div style="display:flex;align-items:center;gap:8px"><div style="flex:1;height:5px;background:var(--border-color);border-radius:100px;overflow:hidden"><div style="height:100%;width:' + pct + '%;background:' + barColor + ';border-radius:100px"></div></div><span style="font-size:11px;font-weight:800;color:' + barColor + ';min-width:32px">' + pct + '%</span></div></td>';
      html += '<td style="padding:12px 16px;text-align:center"><button onclick="_acctDeleteBudget(' + b.id + ')" style="border:none;background:none;cursor:pointer;color:var(--text-muted);font-size:14px" title="삭제">✕</button></td>';
      html += '</tr>';
    });
  }

  html += '</tbody></table></div>';
  el.innerHTML = html;
  if (typeof refreshIcons === 'function') refreshIcons();
}

/* ══════════════════════════════════════════
   ③ 품의하기
══════════════════════════════════════════ */
var _acctApprovalFilter = 'all';

function _acctRenderApproval() {
  var el = document.getElementById('acct-approval');
  if (!el) return;
  var approvals = _acctLoad('acct_approvals');
  var budgets = _acctLoad('acct_budgets');
  var filtered = _acctApprovalFilter === 'all' ? approvals : approvals.filter(function(a) { return a.status === _acctApprovalFilter; });

  var counts = { all: approvals.length, pending: 0, approved: 0, rejected: 0 };
  approvals.forEach(function(a) { if (counts[a.status] !== undefined) counts[a.status]++; });

  var html = '';
  html += '<div class="page-header"><div>';
  html += '<div class="page-title">품의하기</div>';
  html += '<div class="page-subtitle">지출·입금 품의 결재 신청 및 관리</div>';
  html += '</div><div>';
  html += '<button onclick="_acctOpenApprovalModal()" class="btn btn-blue" style="display:inline-flex;align-items:center;gap:5px"><i data-lucide="plus" style="width:14px;height:14px"></i> 품의 작성</button>';
  html += '</div></div>';

  // 필터 탭
  var tabs = [
    { key:'all', label:'전체', count:counts.all },
    { key:'pending', label:'대기', count:counts.pending },
    { key:'approved', label:'승인', count:counts.approved },
    { key:'rejected', label:'반려', count:counts.rejected }
  ];
  html += '<div style="display:flex;gap:6px;margin-bottom:16px">';
  tabs.forEach(function(t) {
    var isActive = _acctApprovalFilter === t.key;
    html += '<button onclick="_acctApprovalFilter=\'' + t.key + '\';_acctRenderApproval()" style="padding:6px 14px;border-radius:20px;border:1.5px solid ' + (isActive ? 'var(--accent-blue)' : 'var(--border-color)') + ';background:' + (isActive ? 'var(--accent-blue)' : 'transparent') + ';color:' + (isActive ? '#fff' : 'var(--text-secondary)') + ';font-size:12px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:5px">';
    html += t.label + ' <span style="font-size:10px;opacity:.8">' + t.count + '</span></button>';
  });
  html += '</div>';

  // 리스트
  html += '<div style="background:var(--bg-tertiary);border:1.5px solid var(--border-color);border-radius:14px;overflow:hidden">';
  if (!filtered.length) {
    html += '<div style="text-align:center;padding:50px;color:var(--text-muted);font-size:13px">';
    html += '<i data-lucide="file-check" style="width:32px;height:32px;display:block;margin:0 auto 10px;opacity:.25"></i>';
    html += '해당하는 품의가 없습니다</div>';
  } else {
    filtered.slice().reverse().forEach(function(a) {
      var statusMap = { pending: { label:'대기중', bg:'#f59e0b22', color:'#f59e0b', border:'#f59e0b' },
                        approved: { label:'승인', bg:'#22c55e22', color:'#22c55e', border:'#22c55e' },
                        rejected: { label:'반려', bg:'#ef444422', color:'#ef4444', border:'#ef4444' } };
      var st = statusMap[a.status] || statusMap.pending;
      var budgetName = '-';
      if (a.budgetId) { var bm = budgets.find(function(b){ return b.id === a.budgetId; }); if (bm) budgetName = bm.name; }
      var typeLabel = a.type === 'income' ? '입금' : '지출';
      var typeColor = a.type === 'income' ? '#22c55e' : '#ef4444';

      html += '<div style="display:flex;align-items:center;gap:12px;padding:14px 18px;border-bottom:1px solid var(--border-color)">';
      // 상태 뱃지
      html += '<span style="display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:' + st.bg + ';color:' + st.color + ';border:1px solid ' + st.border + ';flex-shrink:0">' + st.label + '</span>';
      // 구분
      html += '<span style="font-size:11px;font-weight:700;color:' + typeColor + ';flex-shrink:0;min-width:32px">' + typeLabel + '</span>';
      // 제목
      html += '<span style="flex:1;font-size:13px;font-weight:700;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + _acctEsc(a.title) + '</span>';
      // 예산항목
      html += '<span style="font-size:11px;color:var(--text-muted);flex-shrink:0">' + _acctEsc(budgetName) + '</span>';
      // 금액
      html += '<span style="font-size:13px;font-weight:800;color:' + typeColor + ';flex-shrink:0;min-width:100px;text-align:right">₩' + _acctFmt(a.amount) + '</span>';
      // 일자
      html += '<span style="font-size:11px;color:var(--text-muted);flex-shrink:0">' + (a.date || '-') + '</span>';
      // 액션
      if (a.status === 'pending') {
        html += '<button onclick="_acctApprove(' + a.id + ')" style="padding:4px 10px;border-radius:8px;background:#22c55e;color:#fff;border:none;font-size:11px;font-weight:700;cursor:pointer;flex-shrink:0">승인</button>';
        html += '<button onclick="_acctReject(' + a.id + ')" style="padding:4px 10px;border-radius:8px;background:transparent;border:1.5px solid #ef4444;color:#ef4444;font-size:11px;font-weight:700;cursor:pointer;flex-shrink:0">반려</button>';
      }
      html += '<button onclick="_acctDeleteApproval(' + a.id + ')" style="border:none;background:none;cursor:pointer;color:var(--text-muted);font-size:14px;flex-shrink:0" title="삭제">✕</button>';
      html += '</div>';
    });
  }
  html += '</div>';

  el.innerHTML = html;
  if (typeof refreshIcons === 'function') refreshIcons();
}

/* ══════════════════════════════════════════
   ④⑤⑥ 전표 (입금/출금/지출)
══════════════════════════════════════════ */
function _acctRenderSlips(filterType) {
  // acct-expense, acct-income, acct-payment 모두 이 함수로 렌더
  var pageMap = { income: 'acct-income', expense: 'acct-expense' };
  var el = document.getElementById(pageMap[filterType]);
  // acct-payment도 expense 타입
  if (!el) el = document.getElementById('acct-payment');
  if (!el) return;

  var slips = _acctLoad('acct_slips');
  var filtered = slips.filter(function(s) { return s.type === filterType; });
  var titleMap = { income: { title:'입금전표', sub:'수입 입금 전표 등록 및 조회', icon:'arrow-down-circle', color:'#22c55e' },
                   expense: { title:'출금전표', sub:'지출 출금 전표 등록 및 조회', icon:'arrow-up-circle', color:'#ef4444' } };
  var info = titleMap[filterType] || titleMap.expense;

  var html = '';
  html += '<div class="page-header"><div>';
  html += '<div class="page-title">' + info.title + '</div>';
  html += '<div class="page-subtitle">' + info.sub + '</div>';
  html += '</div><div>';
  html += '<button onclick="_acctOpenSlipModal(\'' + filterType + '\')" class="btn btn-blue" style="display:inline-flex;align-items:center;gap:5px"><i data-lucide="plus" style="width:14px;height:14px"></i> 전표 등록</button>';
  html += '</div></div>';

  // 합계
  var total = 0; filtered.forEach(function(s) { total += (Number(s.amount)||0); });
  html += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;padding:12px 18px;background:var(--bg-tertiary);border:1.5px solid var(--border-color);border-radius:12px">';
  html += '<i data-lucide="' + info.icon + '" style="width:20px;height:20px;color:' + info.color + '"></i>';
  html += '<span style="font-size:13px;font-weight:700;color:var(--text-secondary)">총 ' + filtered.length + '건</span>';
  html += '<span style="margin-left:auto;font-size:18px;font-weight:900;color:' + info.color + '">₩' + _acctFmt(total) + '</span>';
  html += '</div>';

  // 테이블
  html += '<div style="background:var(--bg-tertiary);border:1.5px solid var(--border-color);border-radius:14px;overflow:hidden">';
  html += '<table style="width:100%;border-collapse:collapse;font-size:12.5px">';
  html += '<thead><tr style="background:var(--bg-secondary);border-bottom:1.5px solid var(--border-color)">';
  html += '<th style="padding:12px 16px;text-align:center;font-weight:800;color:var(--text-muted);font-size:11px;width:70px">전표번호</th>';
  html += '<th style="padding:12px 16px;text-align:center;font-weight:800;color:var(--text-muted);font-size:11px;width:100px">일자</th>';
  html += '<th style="padding:12px 16px;text-align:left;font-weight:800;color:var(--text-muted);font-size:11px">계정과목</th>';
  html += '<th style="padding:12px 16px;text-align:left;font-weight:800;color:var(--text-muted);font-size:11px">거래처</th>';
  html += '<th style="padding:12px 16px;text-align:right;font-weight:800;color:var(--text-muted);font-size:11px;width:120px">금액</th>';
  html += '<th style="padding:12px 16px;text-align:left;font-weight:800;color:var(--text-muted);font-size:11px">적요</th>';
  html += '<th style="padding:12px 16px;text-align:center;font-weight:800;color:var(--text-muted);font-size:11px;width:60px">출처</th>';
  html += '<th style="padding:12px 16px;text-align:center;font-weight:800;color:var(--text-muted);font-size:11px;width:50px">관리</th>';
  html += '</tr></thead><tbody>';

  if (!filtered.length) {
    html += '<tr><td colspan="8" style="text-align:center;padding:50px;color:var(--text-muted)">';
    html += '<i data-lucide="receipt" style="width:32px;height:32px;display:block;margin:0 auto 10px;opacity:.25"></i>';
    html += '등록된 전표가 없습니다</td></tr>';
  } else {
    filtered.slice().reverse().forEach(function(s) {
      var src = s.approvalId ? '품의' : '직접';
      var srcColor = s.approvalId ? '#8b5cf6' : '#64748b';
      html += '<tr style="border-bottom:1px solid var(--border-color)">';
      html += '<td style="padding:10px 16px;text-align:center;font-weight:700;color:var(--text-muted);font-size:11px">SL-' + String(s.id).padStart(4,'0') + '</td>';
      html += '<td style="padding:10px 16px;text-align:center;color:var(--text-secondary)">' + (s.date || '-') + '</td>';
      html += '<td style="padding:10px 16px;font-weight:700;color:var(--text-primary)">' + _acctEsc(s.account || '-') + '</td>';
      html += '<td style="padding:10px 16px;color:var(--text-secondary)">' + _acctEsc(s.counterpart || '-') + '</td>';
      html += '<td style="padding:10px 16px;text-align:right;font-weight:800;color:' + info.color + '">₩' + _acctFmt(s.amount) + '</td>';
      html += '<td style="padding:10px 16px;color:var(--text-secondary);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + _acctEsc(s.memo || '-') + '</td>';
      html += '<td style="padding:10px 16px;text-align:center"><span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;background:' + srcColor + '18;color:' + srcColor + '">' + src + '</span></td>';
      html += '<td style="padding:10px 16px;text-align:center"><button onclick="_acctDeleteSlip(' + s.id + ',\'' + filterType + '\')" style="border:none;background:none;cursor:pointer;color:var(--text-muted);font-size:14px" title="삭제">✕</button></td>';
      html += '</tr>';
    });
  }
  html += '</tbody></table></div>';

  el.innerHTML = html;
  if (typeof refreshIcons === 'function') refreshIcons();
}

/* ══════════════════════════════════════════
   품의 승인 / 반려 → 전표 자동 생성
══════════════════════════════════════════ */
function _acctApprove(id) {
  var approvals = _acctLoad('acct_approvals');
  var a = approvals.find(function(x) { return x.id === id; });
  if (!a) return;
  a.status = 'approved';

  // 자동 전표 생성
  var slips = _acctLoad('acct_slips');
  var slip = {
    id: _acctNextId(slips),
    type: a.type || 'expense',
    approvalId: a.id,
    amount: a.amount,
    date: _acctToday(),
    account: a.account || '미지정',
    counterpart: a.counterpart || '',
    memo: '품의승인: ' + a.title,
    category: a.category || ''
  };
  slips.push(slip);
  a.slipId = slip.id;

  // 예산 차감 (지출일 때)
  if (a.type !== 'income' && a.budgetId) {
    var budgets = _acctLoad('acct_budgets');
    var b = budgets.find(function(x) { return x.id === a.budgetId; });
    if (b) {
      b.used = (b.used || 0) + (Number(a.amount) || 0);
      _acctSave('acct_budgets', budgets);
    }
  }

  _acctSave('acct_approvals', approvals);
  _acctSave('acct_slips', slips);

  if (typeof showToast === 'function') showToast('success', '품의가 승인되었습니다. 전표 SL-' + String(slip.id).padStart(4,'0') + '이 자동 생성되었습니다.');
  // 현재 페이지 다시 렌더
  _acctRenderApproval();
}

function _acctReject(id) {
  var approvals = _acctLoad('acct_approvals');
  var a = approvals.find(function(x) { return x.id === id; });
  if (!a) return;
  a.status = 'rejected';
  _acctSave('acct_approvals', approvals);
  if (typeof showToast === 'function') showToast('info', '품의가 반려되었습니다.');
  _acctRenderApproval();
}

/* ══════════════════════════════════════════
   삭제 함수
══════════════════════════════════════════ */
function _acctDeleteBudget(id) {
  if (!confirm('이 예산 항목을 삭제하시겠습니까?')) return;
  var arr = _acctLoad('acct_budgets').filter(function(x) { return x.id !== id; });
  _acctSave('acct_budgets', arr);
  _acctRenderBudget();
}
function _acctDeleteApproval(id) {
  if (!confirm('이 품의를 삭제하시겠습니까?')) return;
  var arr = _acctLoad('acct_approvals').filter(function(x) { return x.id !== id; });
  _acctSave('acct_approvals', arr);
  _acctRenderApproval();
}
function _acctDeleteSlip(id, type) {
  if (!confirm('이 전표를 삭제하시겠습니까?')) return;
  var arr = _acctLoad('acct_slips').filter(function(x) { return x.id !== id; });
  _acctSave('acct_slips', arr);
  _acctRenderSlips(type);
}

/* ══════════════════════════════════════════
   모달: 예산 추가
══════════════════════════════════════════ */
function _acctOpenBudgetModal() {
  var m = document.getElementById('acctBudgetModal');
  if (m) { m.style.display = 'flex'; return; }
  // 동적 생성
  m = document.createElement('div');
  m.id = 'acctBudgetModal'; m.className = 'modal-overlay'; m.style.display = 'flex';
  m.onclick = function(e) { if (e.target === m) m.style.display = 'none'; };
  m.innerHTML =
    '<div class="modal-box" style="max-width:460px">' +
    '<div class="modal-head"><div class="modal-title" style="display:flex;align-items:center;gap:8px"><i data-lucide="wallet" style="width:16px;height:16px;color:var(--accent-blue)"></i> 예산 추가</div><button class="modal-close" onclick="document.getElementById(\'acctBudgetModal\').style.display=\'none\'">✕</button></div>' +
    '<div class="modal-body" style="display:flex;flex-direction:column;gap:12px">' +
    '<div class="form-group" style="margin:0"><label class="form-label">분류</label><input class="form-input" id="acctBdgCategory" placeholder="예) 마케팅, 인건비, 운영비"></div>' +
    '<div class="form-group" style="margin:0"><label class="form-label">예산명 *</label><input class="form-input" id="acctBdgName" placeholder="예) 2025년 1분기 마케팅 예산"></div>' +
    '<div class="form-group" style="margin:0"><label class="form-label">배정액 (원) *</label><input class="form-input" id="acctBdgAmount" type="number" placeholder="예) 5000000"></div>' +
    '</div>' +
    '<div class="modal-foot"><button class="btn" onclick="document.getElementById(\'acctBudgetModal\').style.display=\'none\'">취소</button><button class="btn btn-blue" onclick="_acctSaveBudget()">저장</button></div>' +
    '</div>';
  document.body.appendChild(m);
  if (typeof refreshIcons === 'function') refreshIcons();
}

function _acctSaveBudget() {
  var name = (document.getElementById('acctBdgName') || {}).value;
  var amount = (document.getElementById('acctBdgAmount') || {}).value;
  var category = (document.getElementById('acctBdgCategory') || {}).value;
  if (!name || !name.trim()) { if (typeof showToast === 'function') showToast('error', '예산명을 입력하세요.'); return; }
  if (!amount || isNaN(Number(amount))) { if (typeof showToast === 'function') showToast('error', '배정액을 입력하세요.'); return; }
  var budgets = _acctLoad('acct_budgets');
  budgets.push({ id: _acctNextId(budgets), category: category.trim() || '기타', name: name.trim(), amount: Number(amount), used: 0 });
  _acctSave('acct_budgets', budgets);
  document.getElementById('acctBudgetModal').style.display = 'none';
  if (typeof showToast === 'function') showToast('success', '예산이 등록되었습니다.');
  _acctRenderBudget();
}

/* ══════════════════════════════════════════
   모달: 품의 작성
══════════════════════════════════════════ */
function _acctOpenApprovalModal() {
  var m = document.getElementById('acctApprovalModal');
  if (m) { _acctRefreshApprovalBudgetSelect(); m.style.display = 'flex'; return; }
  m = document.createElement('div');
  m.id = 'acctApprovalModal'; m.className = 'modal-overlay'; m.style.display = 'flex';
  m.onclick = function(e) { if (e.target === m) m.style.display = 'none'; };
  m.innerHTML =
    '<div class="modal-box" style="max-width:520px">' +
    '<div class="modal-head"><div class="modal-title" style="display:flex;align-items:center;gap:8px"><i data-lucide="file-check" style="width:16px;height:16px;color:var(--accent-blue)"></i> 품의 작성</div><button class="modal-close" onclick="document.getElementById(\'acctApprovalModal\').style.display=\'none\'">✕</button></div>' +
    '<div class="modal-body" style="display:flex;flex-direction:column;gap:12px">' +
    '<div class="form-group" style="margin:0"><label class="form-label">품의 제목 *</label><input class="form-input" id="acctAppTitle" placeholder="예) 4월 마케팅 광고비 집행"></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
    '<div class="form-group" style="margin:0"><label class="form-label">금액 (원) *</label><input class="form-input" id="acctAppAmount" type="number" placeholder="예) 1500000"></div>' +
    '<div class="form-group" style="margin:0"><label class="form-label">구분</label><select class="form-input" id="acctAppType"><option value="expense">지출</option><option value="income">입금</option></select></div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
    '<div class="form-group" style="margin:0"><label class="form-label">예산항목</label><select class="form-input" id="acctAppBudget"><option value="">-- 선택 --</option></select></div>' +
    '<div class="form-group" style="margin:0"><label class="form-label">계정과목</label><input class="form-input" id="acctAppAccount" placeholder="예) 광고선전비"></div>' +
    '</div>' +
    '<div class="form-group" style="margin:0"><label class="form-label">거래처</label><input class="form-input" id="acctAppCounterpart" placeholder="예) (주)구글코리아"></div>' +
    '<div class="form-group" style="margin:0"><label class="form-label">사유</label><textarea class="form-input" id="acctAppDesc" rows="3" placeholder="품의 사유를 입력하세요..." style="resize:vertical"></textarea></div>' +
    '</div>' +
    '<div class="modal-foot"><button class="btn" onclick="document.getElementById(\'acctApprovalModal\').style.display=\'none\'">취소</button><button class="btn btn-blue" onclick="_acctSaveApproval()">등록</button></div>' +
    '</div>';
  document.body.appendChild(m);
  _acctRefreshApprovalBudgetSelect();
  if (typeof refreshIcons === 'function') refreshIcons();
}

function _acctRefreshApprovalBudgetSelect() {
  var sel = document.getElementById('acctAppBudget');
  if (!sel) return;
  var budgets = _acctLoad('acct_budgets');
  sel.innerHTML = '<option value="">-- 선택 --</option>';
  budgets.forEach(function(b) {
    sel.innerHTML += '<option value="' + b.id + '">' + b.name + ' (잔액: ₩' + _acctFmt((b.amount||0) - (b.used||0)) + ')</option>';
  });
}

function _acctSaveApproval() {
  var title = (document.getElementById('acctAppTitle') || {}).value;
  var amount = (document.getElementById('acctAppAmount') || {}).value;
  var type = (document.getElementById('acctAppType') || {}).value || 'expense';
  var budgetId = (document.getElementById('acctAppBudget') || {}).value;
  var account = (document.getElementById('acctAppAccount') || {}).value;
  var counterpart = (document.getElementById('acctAppCounterpart') || {}).value;
  var desc = (document.getElementById('acctAppDesc') || {}).value;
  if (!title || !title.trim()) { if (typeof showToast === 'function') showToast('error', '품의 제목을 입력하세요.'); return; }
  if (!amount || isNaN(Number(amount))) { if (typeof showToast === 'function') showToast('error', '금액을 입력하세요.'); return; }
  var approvals = _acctLoad('acct_approvals');
  approvals.push({
    id: _acctNextId(approvals), title: title.trim(), amount: Number(amount), type: type,
    budgetId: budgetId ? Number(budgetId) : null, account: account.trim(), counterpart: counterpart.trim(),
    desc: desc.trim(), status: 'pending', date: _acctToday(), slipId: null
  });
  _acctSave('acct_approvals', approvals);
  document.getElementById('acctApprovalModal').style.display = 'none';
  // 입력 초기화
  ['acctAppTitle','acctAppAmount','acctAppAccount','acctAppCounterpart','acctAppDesc'].forEach(function(id) {
    var el = document.getElementById(id); if (el) el.value = '';
  });
  if (typeof showToast === 'function') showToast('success', '품의가 등록되었습니다.');
  _acctRenderApproval();
}

/* ══════════════════════════════════════════
   모달: 전표 직접 등록
══════════════════════════════════════════ */
function _acctOpenSlipModal(type) {
  var m = document.getElementById('acctSlipModal');
  if (m) m.remove();
  var isIncome = type === 'income';
  var title = isIncome ? '입금전표 등록' : '출금전표 등록';
  var icon = isIncome ? 'arrow-down-circle' : 'arrow-up-circle';

  m = document.createElement('div');
  m.id = 'acctSlipModal'; m.className = 'modal-overlay'; m.style.display = 'flex';
  m.onclick = function(e) { if (e.target === m) m.style.display = 'none'; };
  m.innerHTML =
    '<div class="modal-box" style="max-width:480px">' +
    '<div class="modal-head"><div class="modal-title" style="display:flex;align-items:center;gap:8px"><i data-lucide="' + icon + '" style="width:16px;height:16px;color:var(--accent-blue)"></i> ' + title + '</div><button class="modal-close" onclick="document.getElementById(\'acctSlipModal\').style.display=\'none\'">✕</button></div>' +
    '<div class="modal-body" style="display:flex;flex-direction:column;gap:12px">' +
    '<input type="hidden" id="acctSlipType" value="' + type + '">' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
    '<div class="form-group" style="margin:0"><label class="form-label">일자 *</label><input class="form-input" id="acctSlipDate" type="date" value="' + _acctToday() + '"></div>' +
    '<div class="form-group" style="margin:0"><label class="form-label">금액 (원) *</label><input class="form-input" id="acctSlipAmount" type="number" placeholder="금액"></div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
    '<div class="form-group" style="margin:0"><label class="form-label">계정과목</label><input class="form-input" id="acctSlipAccount" placeholder="예) 광고선전비"></div>' +
    '<div class="form-group" style="margin:0"><label class="form-label">거래처</label><input class="form-input" id="acctSlipCounterpart" placeholder="거래처명"></div>' +
    '</div>' +
    '<div class="form-group" style="margin:0"><label class="form-label">적요</label><input class="form-input" id="acctSlipMemo" placeholder="적요를 입력하세요..."></div>' +
    '</div>' +
    '<div class="modal-foot"><button class="btn" onclick="document.getElementById(\'acctSlipModal\').style.display=\'none\'">취소</button><button class="btn btn-blue" onclick="_acctSaveSlip()">등록</button></div>' +
    '</div>';
  document.body.appendChild(m);
  if (typeof refreshIcons === 'function') refreshIcons();
}

function _acctSaveSlip() {
  var type = (document.getElementById('acctSlipType') || {}).value || 'expense';
  var date = (document.getElementById('acctSlipDate') || {}).value;
  var amount = (document.getElementById('acctSlipAmount') || {}).value;
  var account = (document.getElementById('acctSlipAccount') || {}).value;
  var counterpart = (document.getElementById('acctSlipCounterpart') || {}).value;
  var memo = (document.getElementById('acctSlipMemo') || {}).value;
  if (!amount || isNaN(Number(amount))) { if (typeof showToast === 'function') showToast('error', '금액을 입력하세요.'); return; }
  var slips = _acctLoad('acct_slips');
  slips.push({
    id: _acctNextId(slips), type: type, approvalId: null,
    amount: Number(amount), date: date || _acctToday(),
    account: account.trim(), counterpart: counterpart.trim(), memo: memo.trim(), category: ''
  });
  _acctSave('acct_slips', slips);
  document.getElementById('acctSlipModal').style.display = 'none';
  if (typeof showToast === 'function') showToast('success', '전표가 등록되었습니다.');
  _acctRenderSlips(type);
}
