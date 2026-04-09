/* ═══════════════════════════════════════════════════════════
   📒 WorkM 회계관리 모듈 (modules/accounting.js)
   예산 → 품의 → 전표 → 입출금 → 보고서 자동 연결 경리 시스템
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ══════════════════════════
     유틸리티
  ══════════════════════════ */
  function _ls(key, val) {
    if (val === undefined) {
      try { return JSON.parse(localStorage.getItem(key)) || null; } catch (e) { return null; }
    }
    localStorage.setItem(key, JSON.stringify(val));
  }
  function _fmt(n) {
    if (n === null || n === undefined) return '0';
    return Number(n).toLocaleString('ko-KR');
  }
  function _fmtW(n) { return _fmt(n) + '원'; }
  function _now() { return new Date().toISOString(); }
  function _today() { return new Date().toISOString().slice(0, 10); }
  function _uid() { return Date.now() + Math.floor(Math.random() * 1000); }
  function _esc(s) { var d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
  function _ri() { if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 30); }
  function _toast(type, msg) { if (typeof showToast === 'function') showToast(type, msg); }
  function _month(dateStr) { return dateStr ? dateStr.slice(0, 7) : ''; }

  /* ══════════════════════════
     기본 계정과목
  ══════════════════════════ */
  var DEFAULT_ACCOUNTS = [
    // 자산
    { code: '1010', name: '현금', type: 'asset', group: '유동자산' },
    { code: '1020', name: '보통예금', type: 'asset', group: '유동자산' },
    { code: '1030', name: '미수금', type: 'asset', group: '유동자산' },
    { code: '1040', name: '선급금', type: 'asset', group: '유동자산' },
    { code: '1050', name: '재고자산', type: 'asset', group: '유동자산' },
    { code: '1510', name: '건물', type: 'asset', group: '비유동자산' },
    { code: '1520', name: '차량운반구', type: 'asset', group: '비유동자산' },
    { code: '1530', name: '비품', type: 'asset', group: '비유동자산' },
    // 부채
    { code: '2010', name: '미지급금', type: 'liability', group: '유동부채' },
    { code: '2020', name: '선수금', type: 'liability', group: '유동부채' },
    { code: '2030', name: '예수금', type: 'liability', group: '유동부채' },
    { code: '2510', name: '장기차입금', type: 'liability', group: '비유동부채' },
    // 자본
    { code: '3010', name: '자본금', type: 'equity', group: '자본' },
    { code: '3020', name: '이익잉여금', type: 'equity', group: '자본' },
    // 수익
    { code: '4010', name: '매출', type: 'revenue', group: '매출' },
    { code: '4020', name: '이자수익', type: 'revenue', group: '영업외수익' },
    { code: '4030', name: '기타수익', type: 'revenue', group: '영업외수익' },
    // 비용
    { code: '5010', name: '급여', type: 'expense', group: '인건비' },
    { code: '5020', name: '복리후생비', type: 'expense', group: '인건비' },
    { code: '5030', name: '임차료', type: 'expense', group: '임차료' },
    { code: '5040', name: '통신비', type: 'expense', group: '경비' },
    { code: '5050', name: '수도광열비', type: 'expense', group: '경비' },
    { code: '5060', name: '소모품비', type: 'expense', group: '경비' },
    { code: '5070', name: '운반비', type: 'expense', group: '경비' },
    { code: '5080', name: '접대비', type: 'expense', group: '경비' },
    { code: '5090', name: '광고선전비', type: 'expense', group: '경비' },
    { code: '5100', name: '여비교통비', type: 'expense', group: '경비' },
    { code: '5110', name: '세금과공과', type: 'expense', group: '경비' },
    { code: '5120', name: '보험료', type: 'expense', group: '경비' },
    { code: '5130', name: '감가상각비', type: 'expense', group: '경비' },
    { code: '5140', name: '수선비', type: 'expense', group: '경비' },
    { code: '5150', name: '도서인쇄비', type: 'expense', group: '경비' },
    { code: '5160', name: '교육훈련비', type: 'expense', group: '경비' },
    { code: '5170', name: '차량유지비', type: 'expense', group: '경비' },
    { code: '5180', name: '외주용역비', type: 'expense', group: '경비' },
    { code: '5190', name: '잡비', type: 'expense', group: '경비' }
  ];

  var DEFAULT_AUTO_MAP = [
    { keyword: '급여', accountCode: '5010' },
    { keyword: '월급', accountCode: '5010' },
    { keyword: '상여', accountCode: '5010' },
    { keyword: '식대', accountCode: '5020' },
    { keyword: '복리', accountCode: '5020' },
    { keyword: '임대', accountCode: '5030' },
    { keyword: '월세', accountCode: '5030' },
    { keyword: '전화', accountCode: '5040' },
    { keyword: '인터넷', accountCode: '5040' },
    { keyword: '전기', accountCode: '5050' },
    { keyword: '수도', accountCode: '5050' },
    { keyword: '가스', accountCode: '5050' },
    { keyword: '사무용품', accountCode: '5060' },
    { keyword: '소모품', accountCode: '5060' },
    { keyword: '택배', accountCode: '5070' },
    { keyword: '배송', accountCode: '5070' },
    { keyword: '접대', accountCode: '5080' },
    { keyword: '회식', accountCode: '5080' },
    { keyword: '광고', accountCode: '5090' },
    { keyword: '출장', accountCode: '5100' },
    { keyword: '교통', accountCode: '5100' },
    { keyword: '주차', accountCode: '5100' },
    { keyword: '세금', accountCode: '5110' },
    { keyword: '보험', accountCode: '5120' },
    { keyword: '수리', accountCode: '5140' },
    { keyword: '도서', accountCode: '5150' },
    { keyword: '교육', accountCode: '5160' },
    { keyword: '주유', accountCode: '5170' },
    { keyword: '외주', accountCode: '5180' },
    { keyword: '매출', accountCode: '4010' },
    { keyword: '판매', accountCode: '4010' },
    { keyword: '용역', accountCode: '4010' },
    { keyword: '이자', accountCode: '4020' }
  ];

  function _initDefaults() {
    if (!_ls('acct_accounts')) _ls('acct_accounts', DEFAULT_ACCOUNTS);
    if (!_ls('acct_auto_map')) _ls('acct_auto_map', DEFAULT_AUTO_MAP);
    if (!_ls('acct_budgets')) _ls('acct_budgets', []);
    if (!_ls('acct_approvals')) _ls('acct_approvals', []);
    if (!_ls('acct_vouchers')) _ls('acct_vouchers', []);
    if (!_ls('acct_cashflows')) _ls('acct_cashflows', []);
    if (!_ls('acct_budget_cats')) {
      _ls('acct_budget_cats', [
        { id: 1, name: '문화재청', bank: '기업은행 10110-11001-12', periodFrom: '2026-01-01', periodTo: '2026-12-31' }
      ]);
    }
  }

  function _accounts() { return _ls('acct_accounts') || []; }
  function _budgets() { return _ls('acct_budgets') || []; }
  function _budgetCats() { return _ls('acct_budget_cats') || []; }
  function _approvals() { return _ls('acct_approvals') || []; }
  function _vouchers() { return _ls('acct_vouchers') || []; }
  function _cashflows() { return _ls('acct_cashflows') || []; }
  function _autoMap() { return _ls('acct_auto_map') || []; }

  function _acctName(code) {
    var a = _accounts().find(function (x) { return x.code === code; });
    return a ? a.name : code;
  }
  function _acctByType(type) {
    return _accounts().filter(function (a) { return a.type === type; });
  }

  /* 키워드 → 계정과목 자동매핑 */
  function _autoMapAccount(text) {
    if (!text) return null;
    var maps = _autoMap();
    var lower = text.toLowerCase();
    for (var i = 0; i < maps.length; i++) {
      if (lower.indexOf(maps[i].keyword) >= 0) return maps[i].accountCode;
    }
    return null;
  }

  /* ══════════════════════════
     모드 전환
  ══════════════════════════ */
  function enterAccountingMode() {
    _initDefaults();
    var mainNav = document.getElementById('mainNav');
    var acctNav = document.getElementById('acctNav');
    var hpNav = document.getElementById('homepageNav');
    var headerSearch = document.getElementById('headerSearch');
    var hpBar = document.getElementById('homepageModeBar');
    var acctBar = document.getElementById('acctModeBar');

    if (mainNav) mainNav.style.display = 'none';
    if (hpNav) hpNav.style.display = 'none';
    if (acctNav) { acctNav.style.display = 'block'; }
    if (headerSearch) headerSearch.style.display = 'none';
    if (hpBar) hpBar.style.display = 'none';
    if (acctBar) acctBar.style.display = 'flex';

    // 시작 시간 표시
    var st = document.getElementById('acctStartTime');
    if (st) {
      var n = new Date();
      st.textContent = String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0');
    }

    // 첫 서브페이지 활성화
    var firstItem = document.querySelector('#acctNav [data-acct-page="acct-overview"]');
    showAcctPage('acct-overview', firstItem);
    _ri();
  }

  function exitAccountingMode() {
    var mainNav = document.getElementById('mainNav');
    var acctNav = document.getElementById('acctNav');
    var acctBar = document.getElementById('acctModeBar');
    var headerSearch = document.getElementById('headerSearch');

    if (acctNav) acctNav.style.display = 'none';
    if (mainNav) mainNav.style.display = 'block';
    if (acctBar) acctBar.style.display = 'none';
    if (headerSearch) headerSearch.style.display = '';

    if (typeof showPage === 'function') {
      showPage('dashboard', document.querySelector('[data-page="dashboard"]'));
    }
  }

  function showAcctPage(pageId, navEl) {
    // 서브페이지 전환
    document.querySelectorAll('.acct-sub-page').forEach(function (p) { p.style.display = 'none'; });
    var target = document.getElementById(pageId);
    if (target) target.style.display = 'block';

    // 사이드 네비 활성화
    document.querySelectorAll('#acctNav .nav-item').forEach(function (n) { n.classList.remove('active'); });
    if (navEl) navEl.classList.add('active');

    // 페이지별 렌더
    if (pageId === 'acct-overview') renderAcctOverview();
    if (pageId === 'acct-budget') renderAcctBudget();
    if (pageId === 'acct-approval') renderAcctApproval();
    if (pageId === 'acct-expense') renderAcctExpense();
    if (pageId === 'acct-income') renderAcctIncome();
    if (pageId === 'acct-payment') renderAcctPayment();
    _ri();
  }

  /* ══════════════════════════
     1. 기본현황 (대시보드)
  ══════════════════════════ */
  function renderAcctOverview() {
    var el = document.getElementById('acct-overview');
    if (!el) return;
    _initDefaults();

    var cats = _budgetCats();
    var tabId = window._acctOverviewTab || 'all';

    /* ── 탭 UI ── */
    var tabHtml =
      '<div class="page-header"><div>' +
      '<div class="page-title">기본현황</div>' +
      '<div class="page-subtitle">전체 수입·지출·예산 통합 대시보드</div>' +
      '</div></div>' +
      '<div style="display:flex;gap:6px;margin-bottom:18px;flex-wrap:wrap">' +
      '<button onclick="window._acctOverviewTab=\'all\';window.AcctModule.renderOverview()" ' +
      'style="padding:8px 18px;border-radius:20px;font-size:12.5px;font-weight:700;cursor:pointer;border:1.5px solid ' +
      (tabId === 'all' ? 'var(--accent-blue);background:var(--accent-blue);color:#fff' : 'var(--border-color);background:transparent;color:var(--text-secondary)') +
      ';transition:all .15s">📊 전체현황</button>';

    cats.forEach(function (cat) {
      var active = tabId === String(cat.id);
      tabHtml += '<button onclick="window._acctOverviewTab=\'' + cat.id + '\';window.AcctModule.renderOverview()" ' +
        'style="padding:8px 18px;border-radius:20px;font-size:12.5px;font-weight:700;cursor:pointer;border:1.5px solid ' +
        (active ? 'var(--accent-blue);background:var(--accent-blue);color:#fff' : 'var(--border-color);background:transparent;color:var(--text-secondary)') +
        ';transition:all .15s">' + _esc(cat.name) + '</button>';
    });
    tabHtml += '</div>';

    /* ── 데이터 필터링 ── */
    var allBudgets = _budgets();
    var allVouchers = _vouchers();
    var allCashflows = _cashflows();
    var allApprovals = _approvals();

    var budgets, vouchers, cashflows, approvals, catInfo;

    if (tabId === 'all') {
      budgets = allBudgets;
      vouchers = allVouchers;
      cashflows = allCashflows;
      approvals = allApprovals;
      catInfo = null;
    } else {
      var catIdNum = parseInt(tabId);
      catInfo = cats.find(function (c) { return c.id === catIdNum; });
      budgets = allBudgets.filter(function (b) { return b.catId === catIdNum; });
      var budgetAcctCodes = budgets.map(function (b) { return b.accountCode; });
      vouchers = allVouchers.filter(function (v) {
        return (v.entries || []).some(function (e) { return budgetAcctCodes.indexOf(e.account) >= 0; });
      });
      cashflows = allCashflows.filter(function (c) { return budgetAcctCodes.indexOf(c.accountCode) >= 0; });
      approvals = allApprovals.filter(function (a) { return budgetAcctCodes.indexOf(a.accountCode) >= 0; });
    }

    // 통계 계산
    var totalIncome = 0, totalExpense = 0;
    cashflows.forEach(function (c) {
      if (c.type === 'income') totalIncome += (c.amount || 0);
      else totalExpense += (c.amount || 0);
    });
    var balance = totalIncome - totalExpense;
    var pendingCount = approvals.filter(function (a) { return a.status === 'pending'; }).length;
    var totalBudgetAmt = 0, totalBudgetSpent = 0;
    budgets.forEach(function (b) {
      totalBudgetAmt += (b.amount || 0);
      totalBudgetSpent += (b.spent || 0);
    });
    var budgetRate = totalBudgetAmt > 0 ? Math.round(totalBudgetSpent / totalBudgetAmt * 100) : 0;

    /* ── 예산구분 정보 카드 (개별 탭일 때) ── */
    var catCardHtml = '';
    if (catInfo) {
      catCardHtml =
        '<div class="acct-card" style="margin-bottom:16px;background:linear-gradient(135deg,rgba(79,110,247,.08),rgba(79,110,247,.02))">' +
        '<div style="display:flex;align-items:center;gap:14px;padding:4px 0">' +
        '<div style="width:48px;height:48px;border-radius:14px;background:var(--accent-blue);color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800">\uD83C\uDFDB</div>' +
        '<div style="flex:1">' +
        '<div style="font-size:16px;font-weight:800;color:var(--text-primary);margin-bottom:3px">' + _esc(catInfo.name) + '</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:14px;font-size:12px;color:var(--text-secondary)">' +
        '<span>\uD83C\uDFE6 ' + _esc(catInfo.bank || '-') + '</span>' +
        '<span>\uD83D\uDCC5 ' + (catInfo.periodFrom || '') + ' ~ ' + (catInfo.periodTo || '') + '</span>' +
        '</div></div></div></div>';
    }

    // 최근 전표 5건
    var recent = vouchers.slice().sort(function (a, b) {
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    }).slice(0, 5);

    // 예산 소진율 상위 5
    var budgetBars = budgets.slice().map(function (b) {
      var pct = b.amount > 0 ? Math.round((b.spent || 0) / b.amount * 100) : 0;
      return { name: (b.budgetName || '') + ' ' + _acctName(b.accountCode), pct: pct, spent: b.spent || 0, amount: b.amount, over: pct > 100 };
    }).sort(function (a, b) { return b.pct - a.pct; }).slice(0, 5);

    // 월별 수입/지출 (최근 6개월)
    var monthData = {};
    var now = new Date();
    for (var mi = 5; mi >= 0; mi--) {
      var md = new Date(now.getFullYear(), now.getMonth() - mi, 1);
      var key = md.getFullYear() + '-' + String(md.getMonth() + 1).padStart(2, '0');
      monthData[key] = { income: 0, expense: 0 };
    }
    cashflows.forEach(function (c) {
      var mk = _month(c.date);
      if (monthData[mk]) {
        if (c.type === 'income') monthData[mk].income += (c.amount || 0);
        else monthData[mk].expense += (c.amount || 0);
      }
    });
    var maxMonthVal = 1;
    Object.keys(monthData).forEach(function (k) {
      maxMonthVal = Math.max(maxMonthVal, monthData[k].income, monthData[k].expense);
    });

    var html = tabHtml + catCardHtml +

      // 통계 카드
      '<div class="acct-stat-row">' +
      _statCard('arrow-down-circle', '\uCD1D \uC218\uC785', _fmtW(totalIncome), '#22c55e') +
      _statCard('arrow-up-circle', '\uCD1D \uC9C0\uCD9C', _fmtW(totalExpense), '#ef4444') +
      _statCard('wallet', '\uC794\uC561', _fmtW(balance), balance >= 0 ? '#4f6ef7' : '#ef4444') +
      _statCard('file-check', '\uACB0\uC7AC \uB300\uAE30', pendingCount + '\uAC74', '#f59e0b') +
      '</div>' +

      // 예산 집행 현황
      '<div class="acct-card" style="margin-bottom:16px">' +
      '<div class="acct-card-head"><i data-lucide="pie-chart" style="width:16px;height:16px"></i> \uC608\uC0B0 \uC9D1\uD589 \uD604\uD669</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:10px">' +
      '<div style="text-align:center"><div style="font-size:11px;color:var(--text-muted);margin-bottom:3px">\uCD1D \uD3B8\uC131\uC608\uC0B0</div><div style="font-size:16px;font-weight:800;color:var(--text-primary)">' + _fmtW(totalBudgetAmt) + '</div></div>' +
      '<div style="text-align:center"><div style="font-size:11px;color:var(--text-muted);margin-bottom:3px">\uCD1D \uC9D1\uD589\uC561</div><div style="font-size:16px;font-weight:800;color:#ef4444">' + _fmtW(totalBudgetSpent) + '</div></div>' +
      '<div style="text-align:center"><div style="font-size:11px;color:var(--text-muted);margin-bottom:3px">\uC794\uC5EC\uC608\uC0B0</div><div style="font-size:16px;font-weight:800;color:#22c55e">' + _fmtW(totalBudgetAmt - totalBudgetSpent) + '</div></div>' +
      '</div>' +
      '<div class="acct-progress-track" style="height:14px;border-radius:7px">' +
      '<div class="acct-progress-fill" style="height:100%;width:' + Math.min(100, budgetRate) + '%;border-radius:7px;background:' + (budgetRate > 100 ? '#ef4444' : budgetRate > 80 ? '#f59e0b' : '#4f6ef7') + ';transition:width .4s"></div>' +
      '</div>' +
      '<div style="text-align:right;font-size:12px;font-weight:700;margin-top:4px;color:' + (budgetRate > 100 ? '#ef4444' : 'var(--text-muted)') + '">' + budgetRate + '% \uC9D1\uD589</div>' +
      '</div>' +

      '<div class="acct-grid-2">' +

      // 월별 차트
      '<div class="acct-card">' +
      '<div class="acct-card-head"><i data-lucide="bar-chart-3" style="width:16px;height:16px"></i> \uC6D4\uBCC4 \uC218\uC785 \u00B7 \uC9C0\uCD9C</div>' +
      '<div class="acct-chart-area">' +
      Object.keys(monthData).map(function (k) {
        var d = monthData[k];
        var ih = Math.max(2, d.income / maxMonthVal * 120);
        var eh = Math.max(2, d.expense / maxMonthVal * 120);
        return '<div class="acct-chart-col">' +
          '<div class="acct-chart-bars">' +
          '<div class="acct-bar income" style="height:' + ih + 'px" title="\uC218\uC785 ' + _fmtW(d.income) + '"></div>' +
          '<div class="acct-bar expense" style="height:' + eh + 'px" title="\uC9C0\uCD9C ' + _fmtW(d.expense) + '"></div>' +
          '</div>' +
          '<div class="acct-chart-label">' + k.slice(5) + '\uC6D4</div>' +
          '</div>';
      }).join('') +
      '</div>' +
      '<div class="acct-chart-legend">' +
      '<span><span class="acct-dot" style="background:#22c55e"></span>\uC218\uC785</span>' +
      '<span><span class="acct-dot" style="background:#ef4444"></span>\uC9C0\uCD9C</span>' +
      '</div></div>' +

      // 예산 소진율
      '<div class="acct-card">' +
      '<div class="acct-card-head"><i data-lucide="gauge" style="width:16px;height:16px"></i> \uC608\uC0B0 \uC18C\uC9C4\uC728 TOP 5</div>' +
      (budgetBars.length === 0
        ? '<div class="acct-empty">\uB4F1\uB85D\uB41C \uC608\uC0B0\uC774 \uC5C6\uC2B5\uB2C8\uB2E4</div>'
        : budgetBars.map(function (b) {
          var color = b.over ? '#ef4444' : b.pct > 80 ? '#f59e0b' : '#4f6ef7';
          return '<div class="acct-budget-row">' +
            '<div class="acct-budget-label">' +
            '<span>' + _esc(b.name) + '</span>' +
            '<span style="color:' + color + ';font-weight:800">' + b.pct + '%' + (b.over ? ' \u26A0\uFE0F' : '') + '</span>' +
            '</div>' +
            '<div class="acct-progress-track"><div class="acct-progress-fill" style="width:' + Math.min(100, b.pct) + '%;background:' + color + '"></div></div>' +
            '<div class="acct-budget-sub">' + _fmtW(b.spent) + ' / ' + _fmtW(b.amount) + '</div>' +
            '</div>';
        }).join('')) +
      '</div>' +

      '</div>' +

      // 최근 전표
      '<div class="acct-card" style="margin-top:16px">' +
      '<div class="acct-card-head"><i data-lucide="scroll-text" style="width:16px;height:16px"></i> \uCD5C\uADFC \uC804\uD45C</div>' +
      (recent.length === 0
        ? '<div class="acct-empty">\uB4F1\uB85D\uB41C \uC804\uD45C\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4</div>'
        : '<table class="acct-table"><thead><tr>' +
        '<th>\uB0A0\uC9DC</th><th>\uC720\uD615</th><th>\uC801\uC694</th><th>\uCC28\uBCC0</th><th>\uB300\uBCC0</th>' +
        '</tr></thead><tbody>' +
        recent.map(function (v) {
          var debitSum = 0, creditSum = 0;
          (v.entries || []).forEach(function (e) {
            if (e.side === 'debit') debitSum += e.amount;
            else creditSum += e.amount;
          });
          var typeBadge = v.type === 'income' ? '<span class="acct-badge income">\uC785\uAE08</span>'
            : v.type === 'expense' ? '<span class="acct-badge expense">\uCD9C\uAE08</span>'
              : '<span class="acct-badge etc">\uB300\uCCB4</span>';
          return '<tr><td>' + (v.date || '') + '</td><td>' + typeBadge + '</td>' +
            '<td>' + _esc(v.description || '') + '</td>' +
            '<td class="num">' + _fmtW(debitSum) + '</td>' +
            '<td class="num">' + _fmtW(creditSum) + '</td></tr>';
        }).join('') +
        '</tbody></table>') +
      '</div>';

    el.innerHTML = html;
    _ri();
  }

  function _statCard(icon, label, value, color) {
    return '<div class="acct-stat-card">' +
      '<div class="acct-stat-icon" style="background:' + color + '22;color:' + color + '">' +
      '<i data-lucide="' + icon + '"></i></div>' +
      '<div class="acct-stat-info">' +
      '<div class="acct-stat-label">' + label + '</div>' +
      '<div class="acct-stat-value" style="color:' + color + '">' + value + '</div>' +
      '</div></div>';
  }

  /* ══════════════════════════
     2. 예산설정
  ══════════════════════════ */
  var _selectedBudgetCatId = null;

  function renderAcctBudget() {
    var el = document.getElementById('acct-budget');
    if (!el) return;
    _initDefaults();
    var cats = _budgetCats();
    var budgets = _budgets();

    // 선택된 예산구분이 없으면 첫번째 선택
    if (!_selectedBudgetCatId && cats.length > 0) _selectedBudgetCatId = cats[0].id;
    var selCat = cats.find(function (c) { return c.id === _selectedBudgetCatId; }) || null;
    var filtered = selCat ? budgets.filter(function (b) { return b.catId === _selectedBudgetCatId; }) : budgets;

    var html = '' +
      '<div class="page-header"><div>' +
      '<div class="page-title">예산설정</div>' +
      '<div class="page-subtitle">예산구분별 연간 예산을 설정하고 소진 현황을 확인합니다</div>' +
      '</div></div>' +

      // ── 예산구분 관리 카드 ──
      '<div class="acct-card" style="margin-bottom:16px">' +
      '<div class="acct-card-head"><i data-lucide="folder-open" style="width:16px;height:16px"></i> 예산구분 관리' +
      '<button class="btn" onclick="ACCT.openBudgetCatModal()" style="margin-left:auto;padding:4px 12px;font-size:12px"><i data-lucide="plus" style="width:12px;height:12px"></i> 구분 추가</button>' +
      '</div>';

    if (cats.length === 0) {
      html += '<div class="acct-empty" style="padding:20px">등록된 예산구분이 없습니다. "구분 추가" 버튼으로 먼저 등록하세요.</div>';
    } else {
      html += '<div style="display:flex;gap:12px;flex-wrap:wrap">';
      cats.forEach(function (c) {
        var isActive = c.id === _selectedBudgetCatId;
        var catBudgets = budgets.filter(function (b) { return b.catId === c.id; });
        var totalAmt = 0; catBudgets.forEach(function (b) { totalAmt += (b.amount || 0); });
        html += '<div class="acct-budget-cat-card' + (isActive ? ' active' : '') + '" onclick="ACCT.selectBudgetCat(' + c.id + ')" style="' +
          'padding:14px 18px;border:1.5px solid ' + (isActive ? 'var(--accent-blue)' : 'var(--border-color)') + ';border-radius:14px;cursor:pointer;' +
          'background:' + (isActive ? 'rgba(79,110,247,.06)' : 'var(--bg-tertiary)') + ';min-width:240px;flex:1;max-width:360px;transition:all .2s;position:relative">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">' +
          '<div style="font-size:15px;font-weight:800;color:' + (isActive ? 'var(--accent-blue)' : 'var(--text-primary)') + '">' + _esc(c.name) + '</div>' +
          '<div style="display:flex;gap:4px">' +
          '<button class="btn-icon-sm edit" onclick="event.stopPropagation();ACCT.openBudgetCatModal(' + c.id + ')" title="수정"><i data-lucide="edit-3" class="icon-sm"></i></button>' +
          '<button class="btn-icon-sm delete" onclick="event.stopPropagation();ACCT.deleteBudgetCat(' + c.id + ')" title="삭제"><i data-lucide="trash-2" class="icon-sm"></i></button>' +
          '</div></div>' +
          '<div style="font-size:12px;color:var(--text-muted);display:flex;align-items:center;gap:5px;margin-bottom:4px">' +
          '<i data-lucide="landmark" style="width:12px;height:12px"></i> ' + _esc(c.bank || '-') + '</div>' +
          '<div style="font-size:11.5px;color:var(--text-muted);display:flex;align-items:center;gap:5px">' +
          '<i data-lucide="calendar" style="width:12px;height:12px"></i> ' + (c.periodFrom || '') + ' ~ ' + (c.periodTo || '') + '</div>' +
          '<div style="font-size:12px;font-weight:700;color:var(--text-secondary);margin-top:6px">예산항목 ' + catBudgets.length + '건 · 총 ' + _fmtW(totalAmt) + '</div>' +
          '</div>';
      });
      html += '</div>';
    }
    html += '</div>';

    // ── 선택된 예산구분의 예산 항목 테이블 ──
    if (selCat) {
      html += '<div class="acct-card">' +
        '<div class="acct-card-head" style="display:flex;align-items:center;justify-content:space-between">' +
        '<div style="display:flex;align-items:center;gap:8px"><i data-lucide="wallet" style="width:16px;height:16px"></i> ' + _esc(selCat.name) + ' 예산 현황</div>' +
        '<button class="btn btn-blue" onclick="ACCT.openBudgetModal()" style="padding:6px 14px;font-size:12.5px"><i data-lucide="plus" style="width:13px;height:13px"></i> 예산 추가</button>' +
        '</div>';

      if (filtered.length === 0) {
        html += '<div class="acct-empty"><i data-lucide="inbox" style="width:36px;height:36px;opacity:.3;display:block;margin:0 auto 10px"></i>등록된 예산이 없습니다<br><span style="font-size:12px;color:var(--text-muted)">"예산 추가" 버튼을 눌러 등록하세요</span></div>';
      } else {
        var totalBudget = 0, totalSpent = 0;
        filtered.forEach(function (b) { totalBudget += (b.amount || 0); totalSpent += (b.spent || 0); });

        html += '<table class="acct-table"><thead><tr>' +
          '<th>예산목</th><th>계정과목</th><th style="text-align:right">예산액</th><th style="text-align:right">집행액</th>' +
          '<th style="text-align:right">잔액</th><th>소진율</th><th style="text-align:center;width:80px">관리</th>' +
          '</tr></thead><tbody>';

        filtered.forEach(function (b) {
          var spent = b.spent || 0;
          var remain = b.amount - spent;
          var pct = b.amount > 0 ? Math.round(spent / b.amount * 100) : 0;
          var over = pct > 100;
          var color = over ? '#ef4444' : pct > 80 ? '#f59e0b' : '#22c55e';
          html += '<tr>' +
            '<td><strong>' + _esc(b.itemName || '-') + '</strong></td>' +
            '<td>' + _esc(_acctName(b.accountCode)) + ' <span style="font-size:11px;color:var(--text-muted)">' + b.accountCode + '</span></td>' +
            '<td class="num">' + _fmtW(b.amount) + '</td>' +
            '<td class="num">' + _fmtW(spent) + '</td>' +
            '<td class="num" style="color:' + (remain < 0 ? '#ef4444' : 'var(--text-primary)') + '">' + _fmtW(remain) + '</td>' +
            '<td><div class="acct-progress-track" style="width:100px;display:inline-block;vertical-align:middle;margin-right:8px"><div class="acct-progress-fill" style="width:' + Math.min(100, pct) + '%;background:' + color + '"></div></div>' +
            '<span style="font-weight:700;color:' + color + ';font-size:12px">' + pct + '%</span>' + (over ? ' <span style="color:#ef4444;font-weight:800">⚠️ 초과</span>' : '') + '</td>' +
            '<td style="text-align:center">' +
            '<button class="btn-icon-sm edit" onclick="ACCT.openBudgetModal(' + b.id + ')" title="수정"><i data-lucide="edit-3" class="icon-sm"></i></button>' +
            '<button class="btn-icon-sm delete" onclick="ACCT.deleteBudget(' + b.id + ')" title="삭제"><i data-lucide="trash-2" class="icon-sm"></i></button>' +
            '</td></tr>';
        });

        var totalPct = totalBudget > 0 ? Math.round(totalSpent / totalBudget * 100) : 0;
        html += '<tr style="font-weight:800;background:var(--bg-tertiary)">' +
          '<td colspan="2">합계</td><td class="num">' + _fmtW(totalBudget) + '</td>' +
          '<td class="num">' + _fmtW(totalSpent) + '</td>' +
          '<td class="num">' + _fmtW(totalBudget - totalSpent) + '</td>' +
          '<td><span style="font-weight:800">' + totalPct + '%</span></td><td></td></tr>';
        html += '</tbody></table>';
      }
      html += '</div>';
    }

    // 모달들
    html += _budgetModalHTML();
    html += _budgetCatModalHTML();

    el.innerHTML = html;
    _ri();
  }

  function selectBudgetCat(catId) {
    _selectedBudgetCatId = catId;
    renderAcctBudget();
  }

  /* ── 예산구분 CRUD 모달 ── */
  function _budgetCatModalHTML() {
    return '<div class="modal-overlay" id="budgetCatModal" style="display:none" onclick="if(event.target===this)ACCT.closeBudgetCatModal()">' +
      '<div class="modal-box" style="max-width:460px">' +
      '<div class="modal-head"><div class="modal-title" id="bcmTitle">예산구분 추가</div><button class="modal-close" onclick="ACCT.closeBudgetCatModal()">✕</button></div>' +
      '<div class="modal-body" style="display:flex;flex-direction:column;gap:14px">' +
      '<div class="form-group"><label class="form-label">예산구분명 *</label>' +
      '<input class="form-input" id="bcm_name" placeholder="예) 문화재청, 자체예산"></div>' +
      '<div class="form-group"><label class="form-label">통장정보</label>' +
      '<input class="form-input" id="bcm_bank" placeholder="예) 기업은행 10110-11001-12"></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
      '<div class="form-group" style="margin:0"><label class="form-label">시작일</label>' +
      '<input class="form-input" id="bcm_from" type="date" value="' + new Date().getFullYear() + '-01-01"></div>' +
      '<div class="form-group" style="margin:0"><label class="form-label">종료일</label>' +
      '<input class="form-input" id="bcm_to" type="date" value="' + new Date().getFullYear() + '-12-31"></div>' +
      '</div>' +
      '</div>' +
      '<div class="modal-foot"><button class="btn" onclick="ACCT.closeBudgetCatModal()">취소</button>' +
      '<button class="btn btn-blue" onclick="ACCT.saveBudgetCat()">저장</button></div>' +
      '</div></div>';
  }

  var _budgetCatEditId = null;
  function openBudgetCatModal(editId) {
    _budgetCatEditId = editId || null;
    var title = document.getElementById('bcmTitle');
    var nameEl = document.getElementById('bcm_name');
    var bankEl = document.getElementById('bcm_bank');
    var fromEl = document.getElementById('bcm_from');
    var toEl = document.getElementById('bcm_to');
    if (editId) {
      var c = _budgetCats().find(function (x) { return x.id === editId; });
      if (c) {
        if (title) title.textContent = '예산구분 수정';
        if (nameEl) nameEl.value = c.name || '';
        if (bankEl) bankEl.value = c.bank || '';
        if (fromEl) fromEl.value = c.periodFrom || '';
        if (toEl) toEl.value = c.periodTo || '';
      }
    } else {
      if (title) title.textContent = '예산구분 추가';
      if (nameEl) nameEl.value = '';
      if (bankEl) bankEl.value = '';
      if (fromEl) fromEl.value = new Date().getFullYear() + '-01-01';
      if (toEl) toEl.value = new Date().getFullYear() + '-12-31';
    }
    var m = document.getElementById('budgetCatModal'); if (m) m.style.display = 'flex';
  }
  function closeBudgetCatModal() {
    var m = document.getElementById('budgetCatModal'); if (m) m.style.display = 'none';
    _budgetCatEditId = null;
  }
  function saveBudgetCat() {
    var name = (document.getElementById('bcm_name') || {}).value || '';
    var bank = (document.getElementById('bcm_bank') || {}).value || '';
    var from = (document.getElementById('bcm_from') || {}).value || '';
    var to = (document.getElementById('bcm_to') || {}).value || '';
    if (!name.trim()) { _toast('error', '예산구분명을 입력하세요'); return; }
    var cats = _budgetCats();
    if (_budgetCatEditId) {
      cats = cats.map(function (c) {
        if (c.id !== _budgetCatEditId) return c;
        return Object.assign({}, c, { name: name.trim(), bank: bank, periodFrom: from, periodTo: to });
      });
      _toast('info', '예산구분이 수정되었습니다');
    } else {
      cats.push({ id: _uid(), name: name.trim(), bank: bank, periodFrom: from, periodTo: to });
      _toast('success', '"' + name + '" 예산구분이 추가되었습니다');
    }
    _ls('acct_budget_cats', cats);
    closeBudgetCatModal();
    _selectedBudgetCatId = cats[cats.length - 1].id;
    renderAcctBudget();
  }
  function deleteBudgetCat(id) {
    var cats = _budgetCats().filter(function (c) { return c.id !== id; });
    _ls('acct_budget_cats', cats);
    // 해당 구분의 예산도 삭제
    var budgets = _budgets().filter(function (b) { return b.catId !== id; });
    _ls('acct_budgets', budgets);
    if (_selectedBudgetCatId === id) _selectedBudgetCatId = cats.length > 0 ? cats[0].id : null;
    _toast('info', '예산구분이 삭제되었습니다');
    renderAcctBudget();
  }

  /* ── 예산 항목 CRUD 모달 ── */
  function _budgetModalHTML() {
    var accounts = _accounts().filter(function (a) { return a.type === 'expense'; });
    return '<div class="modal-overlay" id="budgetModal" style="display:none" onclick="if(event.target===this)ACCT.closeBudgetModal()">' +
      '<div class="modal-box" style="max-width:460px">' +
      '<div class="modal-head"><div class="modal-title" id="budgetModalTitle">예산 추가</div><button class="modal-close" onclick="ACCT.closeBudgetModal()">✕</button></div>' +
      '<div class="modal-body" style="display:flex;flex-direction:column;gap:14px">' +
      '<div class="form-group"><label class="form-label">예산목 *</label>' +
      '<input class="form-input" id="bm_itemName" placeholder="예) 인건비, 소모품비, 외주용역비"></div>' +
      '<div class="form-group"><label class="form-label">계정과목 *</label>' +
      '<select class="form-input" id="bm_account">' +
      '<option value="">-- 선택 --</option>' +
      accounts.map(function (a) { return '<option value="' + a.code + '">' + a.code + ' ' + a.name + '</option>'; }).join('') +
      '</select></div>' +
      '<div class="form-group"><label class="form-label">연간 예산액 (원) *</label>' +
      '<input class="form-input" id="bm_amount" type="number" placeholder="예) 50000000" onkeydown="if(event.key===\'Enter\')ACCT.saveBudget()"></div>' +
      '<div class="form-group"><label class="form-label">메모</label>' +
      '<input class="form-input" id="bm_memo" placeholder="예산 설명"></div>' +
      '</div>' +
      '<div class="modal-foot"><button class="btn" onclick="ACCT.closeBudgetModal()">취소</button>' +
      '<button class="btn btn-blue" onclick="ACCT.saveBudget()">저장</button></div>' +
      '</div></div>';
  }

  var _budgetEditId = null;
  function openBudgetModal(editId) {
    _budgetEditId = editId || null;
    var title = document.getElementById('budgetModalTitle');
    var itemNameEl = document.getElementById('bm_itemName');
    var acctEl = document.getElementById('bm_account');
    var amtEl = document.getElementById('bm_amount');
    var memoEl = document.getElementById('bm_memo');
    if (editId) {
      var b = _budgets().find(function (x) { return x.id === editId; });
      if (b) {
        if (title) title.textContent = '예산 수정';
        if (itemNameEl) itemNameEl.value = b.itemName || '';
        if (acctEl) acctEl.value = b.accountCode;
        if (amtEl) amtEl.value = b.amount;
        if (memoEl) memoEl.value = b.memo || '';
      }
    } else {
      if (title) title.textContent = '예산 추가';
      if (itemNameEl) itemNameEl.value = '';
      if (acctEl) acctEl.value = '';
      if (amtEl) amtEl.value = '';
      if (memoEl) memoEl.value = '';
    }
    var m = document.getElementById('budgetModal');
    if (m) m.style.display = 'flex';
  }

  function closeBudgetModal() {
    var m = document.getElementById('budgetModal');
    if (m) m.style.display = 'none';
    _budgetEditId = null;
  }

  function saveBudget() {
    var itemName = (document.getElementById('bm_itemName') || {}).value || '';
    var code = (document.getElementById('bm_account') || {}).value;
    var amt = parseInt((document.getElementById('bm_amount') || {}).value) || 0;
    var memo = (document.getElementById('bm_memo') || {}).value || '';
    if (!itemName.trim()) { _toast('error', '예산목을 입력하세요'); return; }
    if (!code) { _toast('error', '계정과목을 선택하세요'); return; }
    if (amt <= 0) { _toast('error', '예산액을 입력하세요'); return; }

    var budgets = _budgets();
    if (_budgetEditId) {
      budgets = budgets.map(function (b) {
        if (b.id !== _budgetEditId) return b;
        return Object.assign({}, b, { itemName: itemName.trim(), accountCode: code, amount: amt, memo: memo });
      });
      _toast('info', '예산이 수정되었습니다');
    } else {
      budgets.push({ id: _uid(), catId: _selectedBudgetCatId, year: new Date().getFullYear(), itemName: itemName.trim(), accountCode: code, amount: amt, spent: 0, memo: memo });
      _toast('success', itemName + ' 예산이 추가되었습니다');
    }
    _ls('acct_budgets', budgets);
    closeBudgetModal();
    renderAcctBudget();
  }

  function deleteBudget(id) {
    var budgets = _budgets().filter(function (b) { return b.id !== id; });
    _ls('acct_budgets', budgets);
    _toast('info', '예산이 삭제되었습니다');
    renderAcctBudget();
  }

  /* 예산 소진 업데이트 */
  function _updateBudgetSpent(accountCode, amount) {
    var budgets = _budgets();
    var updated = false;
    budgets.forEach(function (b) {
      if (b.accountCode === accountCode) {
        b.spent = (b.spent || 0) + amount;
        updated = true;
        if (b.spent > b.amount) {
          _toast('warning', '⚠️ ' + _acctName(accountCode) + ' 예산이 초과되었습니다! (' + Math.round(b.spent / b.amount * 100) + '%)');
        }
      }
    });
    if (updated) _ls('acct_budgets', budgets);
  }

  /* ══════════════════════════
     3. 품의하기
  ══════════════════════════ */
  function renderAcctApproval() {
    var el = document.getElementById('acct-approval');
    if (!el) return;
    var approvals = _approvals();
    var pendings = approvals.filter(function (a) { return a.status === 'pending'; });
    var approveds = approvals.filter(function (a) { return a.status === 'approved'; });
    var rejecteds = approvals.filter(function (a) { return a.status === 'rejected'; });

    var html = '' +
      '<div class="page-header"><div>' +
      '<div class="page-title">품의하기</div>' +
      '<div class="page-subtitle">지출 품의를 등록하고 결재 상태를 관리합니다</div>' +
      '</div>' +
      '<button class="btn btn-blue" onclick="ACCT.openApprovalModal()"><i data-lucide="plus" style="width:14px;height:14px"></i> 품의 등록</button>' +
      '</div>' +

      // 탭
      '<div class="acct-tab-bar">' +
      '<button class="acct-tab active" onclick="ACCT.switchApprovalTab(\'pending\',this)">결재대기 <span class="acct-tab-count">' + pendings.length + '</span></button>' +
      '<button class="acct-tab" onclick="ACCT.switchApprovalTab(\'approved\',this)">승인완료 <span class="acct-tab-count">' + approveds.length + '</span></button>' +
      '<button class="acct-tab" onclick="ACCT.switchApprovalTab(\'rejected\',this)">반려 <span class="acct-tab-count">' + rejecteds.length + '</span></button>' +
      '</div>' +

      '<div id="approvalListWrap">' + _approvalList(pendings, 'pending') + '</div>';

    // 품의 등록 모달
    html += _approvalModalHTML();

    el.innerHTML = html;
    _ri();
  }

  function _approvalList(list, status) {
    if (list.length === 0) {
      return '<div class="acct-card"><div class="acct-empty"><i data-lucide="inbox" style="width:36px;height:36px;opacity:.3;display:block;margin:0 auto 10px"></i>' +
        (status === 'pending' ? '결재 대기 중인 품의가 없습니다' : status === 'approved' ? '승인 완료된 품의가 없습니다' : '반려된 품의가 없습니다') +
        '</div></div>';
    }

    var html = '<div class="acct-card"><table class="acct-table"><thead><tr>' +
      '<th>등록일</th><th>품의명</th><th>계정과목</th><th style="text-align:right">금액</th><th>신청자</th><th>상태</th><th style="text-align:center;width:100px">관리</th>' +
      '</tr></thead><tbody>';

    list.forEach(function (a) {
      var badge = a.status === 'pending' ? '<span class="acct-badge pending">대기</span>'
        : a.status === 'approved' ? '<span class="acct-badge approved">승인</span>'
          : '<span class="acct-badge rejected">반려</span>';
      var actions = '';
      if (a.status === 'pending') {
        actions = '<button class="btn-icon-sm edit" onclick="ACCT.approveItem(' + a.id + ')" title="승인" style="color:#22c55e"><i data-lucide="check" class="icon-sm"></i></button>' +
          '<button class="btn-icon-sm delete" onclick="ACCT.rejectItem(' + a.id + ')" title="반려"><i data-lucide="x" class="icon-sm"></i></button>';
      }
      html += '<tr>' +
        '<td>' + (a.date || '') + '</td>' +
        '<td><strong>' + _esc(a.title) + '</strong></td>' +
        '<td>' + _acctName(a.accountCode) + '</td>' +
        '<td class="num">' + _fmtW(a.amount) + '</td>' +
        '<td>' + _esc(a.requesterName || '') + '</td>' +
        '<td>' + badge + '</td>' +
        '<td style="text-align:center">' + actions + '</td>' +
        '</tr>';
    });
    html += '</tbody></table></div>';
    return html;
  }

  function switchApprovalTab(status, btnEl) {
    document.querySelectorAll('.acct-tab').forEach(function (b) { b.classList.remove('active'); });
    if (btnEl) btnEl.classList.add('active');
    var approvals = _approvals();
    var filtered = approvals.filter(function (a) { return a.status === status; });
    var wrap = document.getElementById('approvalListWrap');
    if (wrap) wrap.innerHTML = _approvalList(filtered, status);
    _ri();
  }

  function _approvalModalHTML() {
    var accounts = _accounts().filter(function (a) { return a.type === 'expense'; });
    var userName = (typeof WS !== 'undefined' && WS.currentUser) ? WS.currentUser.name : '';
    return '<div class="modal-overlay" id="approvalModal" style="display:none" onclick="if(event.target===this)ACCT.closeApprovalModal()">' +
      '<div class="modal-box" style="max-width:500px">' +
      '<div class="modal-head"><div class="modal-title">품의 등록</div><button class="modal-close" onclick="ACCT.closeApprovalModal()">✕</button></div>' +
      '<div class="modal-body" style="display:flex;flex-direction:column;gap:14px">' +
      '<div class="form-group"><label class="form-label">품의명 *</label>' +
      '<input class="form-input" id="am_title" placeholder="예) 사무용품 구매"></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
      '<div class="form-group" style="margin:0"><label class="form-label">계정과목 *</label>' +
      '<select class="form-input" id="am_account">' +
      '<option value="">-- 선택 --</option>' +
      accounts.map(function (a) { return '<option value="' + a.code + '">' + a.code + ' ' + a.name + '</option>'; }).join('') +
      '</select></div>' +
      '<div class="form-group" style="margin:0"><label class="form-label">금액 (원) *</label>' +
      '<input class="form-input" id="am_amount" type="number" placeholder="0"></div></div>' +
      '<div class="form-group"><label class="form-label">신청자</label>' +
      '<input class="form-input" id="am_requester" value="' + _esc(userName) + '" readonly style="background:var(--bg-tertiary);cursor:default;color:var(--text-secondary)"></div>' +
      '<div class="form-group"><label class="form-label">사유/메모</label>' +
      '<textarea class="form-input" id="am_memo" rows="2" placeholder="품의 사유를 입력하세요"></textarea></div>' +
      '</div>' +
      '<div class="modal-foot"><button class="btn" onclick="ACCT.closeApprovalModal()">취소</button>' +
      '<button class="btn btn-blue" onclick="ACCT.submitApproval()">제출</button></div>' +
      '</div></div>';
  }

  function openApprovalModal() {
    var m = document.getElementById('approvalModal');
    ['am_title', 'am_amount', 'am_memo'].forEach(function (id) {
      var e = document.getElementById(id); if (e) e.value = '';
    });
    var sel = document.getElementById('am_account'); if (sel) sel.value = '';
    if (m) m.style.display = 'flex';
  }
  function closeApprovalModal() {
    var m = document.getElementById('approvalModal'); if (m) m.style.display = 'none';
  }

  function submitApproval() {
    var title = (document.getElementById('am_title') || {}).value || '';
    var code = (document.getElementById('am_account') || {}).value || '';
    var amt = parseInt((document.getElementById('am_amount') || {}).value) || 0;
    var requester = (document.getElementById('am_requester') || {}).value || '';
    var memo = (document.getElementById('am_memo') || {}).value || '';
    if (!title.trim()) { _toast('error', '품의명을 입력하세요'); return; }
    if (!code) { _toast('error', '계정과목을 선택하세요'); return; }
    if (amt <= 0) { _toast('error', '금액을 입력하세요'); return; }

    // 예산 초과 체크
    var budget = _budgets().find(function (b) { return b.accountCode === code; });
    if (budget) {
      var afterSpent = (budget.spent || 0) + amt;
      if (afterSpent > budget.amount) {
        _toast('warning', '⚠️ ' + _acctName(code) + ' 예산 초과 예정! (현재 ' + Math.round((budget.spent || 0) / budget.amount * 100) + '% → ' + Math.round(afterSpent / budget.amount * 100) + '%)');
      }
    }

    var approvals = _approvals();
    approvals.push({
      id: _uid(), date: _today(), title: title.trim(), accountCode: code,
      amount: amt, requesterId: (typeof WS !== 'undefined' && WS.currentUser) ? WS.currentUser.id : null,
      requesterName: requester, status: 'pending', memo: memo,
      createdAt: _now(), approvedAt: null, voucherId: null
    });
    _ls('acct_approvals', approvals);
    closeApprovalModal();
    _toast('success', '"' + title + '" 품의가 등록되었습니다');
    renderAcctApproval();
  }

  function approveItem(id) {
    var approvals = _approvals();
    var item = approvals.find(function (a) { return a.id === id; });
    if (!item) return;
    item.status = 'approved';
    item.approvedAt = _now();

    // 전표 자동생성
    var vId = _uid();
    var vouchers = _vouchers();
    vouchers.push({
      id: vId, date: _today(), type: 'expense',
      description: '[품의] ' + item.title,
      entries: [
        { side: 'debit', accountCode: item.accountCode, amount: item.amount },
        { side: 'credit', accountCode: '1010', amount: item.amount }
      ],
      sourceType: 'approval', sourceId: item.id,
      createdAt: _now(), createdBy: '시스템'
    });
    item.voucherId = vId;
    _ls('acct_vouchers', vouchers);

    // 예산 소진
    _updateBudgetSpent(item.accountCode, item.amount);

    _ls('acct_approvals', approvals);
    _toast('success', '"' + item.title + '" 승인 완료 → 전표가 자동 생성되었습니다');
    renderAcctApproval();
  }

  function rejectItem(id) {
    var approvals = _approvals();
    var item = approvals.find(function (a) { return a.id === id; });
    if (!item) return;
    item.status = 'rejected';
    _ls('acct_approvals', approvals);
    _toast('info', '"' + item.title + '" 품의가 반려되었습니다');
    renderAcctApproval();
  }

  /* ══════════════════════════
     4. 지출하기 (간편 UI)
  ══════════════════════════ */
  function renderAcctExpense() {
    var el = document.getElementById('acct-expense');
    if (!el) return;
    var cashflows = _cashflows().filter(function (c) { return c.type === 'expense'; })
      .sort(function (a, b) { return (b.createdAt || '').localeCompare(a.createdAt || ''); });

    var html = '' +
      '<div class="page-header"><div>' +
      '<div class="page-title">지출하기</div>' +
      '<div class="page-subtitle">간편하게 지출을 등록하면 전표가 자동 생성됩니다</div>' +
      '</div></div>' +

      // 간편 입력 폼
      '<div class="acct-card">' +
      '<div class="acct-card-head"><i data-lucide="edit-3" style="width:16px;height:16px"></i> 간편 지출 등록</div>' +
      '<div class="acct-simple-form">' +
      '<div class="acct-form-row">' +
      '<div class="form-group" style="flex:2"><label class="form-label">지출 내용 *</label>' +
      '<input class="form-input" id="exp_desc" placeholder="예) 사무용품 구매, 택배비" oninput="ACCT.autoSuggestAccount(\'exp\')"></div>' +
      '<div class="form-group" style="flex:1"><label class="form-label">금액 (원) *</label>' +
      '<input class="form-input" id="exp_amount" type="number" placeholder="0"></div>' +
      '<div class="form-group" style="flex:1"><label class="form-label">거래처</label>' +
      '<input class="form-input" id="exp_counter" placeholder="거래처명"></div>' +
      '</div>' +
      '<div class="acct-form-row">' +
      '<div class="form-group" style="flex:1"><label class="form-label">결제수단</label>' +
      '<select class="form-input" id="exp_method"><option value="현금">현금</option><option value="계좌이체">계좌이체</option><option value="카드">카드</option><option value="기타">기타</option></select></div>' +
      '<div class="form-group" style="flex:1"><label class="form-label">날짜</label>' +
      '<input class="form-input" id="exp_date" type="date" value="' + _today() + '"></div>' +
      '<div class="form-group" style="flex:2"><label class="form-label">자동매핑 계정 <span id="exp_auto_label" style="color:var(--accent-blue);font-weight:700"></span></label>' +
      '<select class="form-input" id="exp_account">' +
      '<option value="">자동 매핑됨</option>' +
      _accounts().filter(function (a) { return a.type === 'expense'; }).map(function (a) { return '<option value="' + a.code + '">' + a.code + ' ' + a.name + '</option>'; }).join('') +
      '</select></div>' +
      '</div>' +
      '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px">' +
      '<button class="btn btn-blue" onclick="ACCT.saveExpense()" style="padding:8px 20px"><i data-lucide="save" style="width:14px;height:14px"></i> 지출 등록</button>' +
      '</div></div></div>' +

      // 지출 내역 리스트
      '<div class="acct-card" style="margin-top:16px">' +
      '<div class="acct-card-head"><i data-lucide="list" style="width:16px;height:16px"></i> 지출 내역</div>';

    if (cashflows.length === 0) {
      html += '<div class="acct-empty">등록된 지출이 없습니다</div>';
    } else {
      html += '<table class="acct-table"><thead><tr>' +
        '<th>날짜</th><th>내용</th><th>계정과목</th><th>거래처</th><th>결제수단</th><th style="text-align:right">금액</th><th style="text-align:center;width:60px">삭제</th>' +
        '</tr></thead><tbody>';
      cashflows.forEach(function (c) {
        html += '<tr><td>' + (c.date || '') + '</td>' +
          '<td>' + _esc(c.memo || '') + '</td>' +
          '<td>' + _acctName(c.accountCode) + '</td>' +
          '<td>' + _esc(c.counterpart || '') + '</td>' +
          '<td>' + _esc(c.paymentMethod || '') + '</td>' +
          '<td class="num" style="color:#ef4444">' + _fmtW(c.amount) + '</td>' +
          '<td style="text-align:center"><button class="btn-icon-sm delete" onclick="ACCT.deleteCashflow(' + c.id + ',\'expense\')"><i data-lucide="trash-2" class="icon-sm"></i></button></td></tr>';
      });
      html += '</tbody></table>';
    }
    html += '</div>';
    el.innerHTML = html;
    _ri();
  }

  function autoSuggestAccount(prefix) {
    var desc = (document.getElementById(prefix + '_desc') || {}).value || '';
    var code = _autoMapAccount(desc);
    var label = document.getElementById(prefix + '_auto_label');
    var sel = document.getElementById(prefix + '_account');
    if (code) {
      if (label) label.textContent = '→ ' + _acctName(code);
      if (sel) sel.value = code;
    } else {
      if (label) label.textContent = '';
      if (sel) sel.value = '';
    }
  }

  function saveExpense() {
    var desc = (document.getElementById('exp_desc') || {}).value || '';
    var amt = parseInt((document.getElementById('exp_amount') || {}).value) || 0;
    var counter = (document.getElementById('exp_counter') || {}).value || '';
    var method = (document.getElementById('exp_method') || {}).value || '현금';
    var date = (document.getElementById('exp_date') || {}).value || _today();
    var code = (document.getElementById('exp_account') || {}).value || _autoMapAccount(desc) || '5190';

    if (!desc.trim()) { _toast('error', '지출 내용을 입력하세요'); return; }
    if (amt <= 0) { _toast('error', '금액을 입력하세요'); return; }

    var cfId = _uid();
    var vId = _uid();

    // 전표 자동 생성
    var vouchers = _vouchers();
    vouchers.push({
      id: vId, date: date, type: 'expense',
      description: desc,
      entries: [
        { side: 'debit', accountCode: code, amount: amt },
        { side: 'credit', accountCode: '1010', amount: amt }
      ],
      sourceType: 'cashflow', sourceId: cfId,
      createdAt: _now(), createdBy: (typeof WS !== 'undefined' && WS.currentUser) ? WS.currentUser.name : '시스템'
    });
    _ls('acct_vouchers', vouchers);

    // 입출금 저장
    var cashflows = _cashflows();
    cashflows.push({
      id: cfId, date: date, type: 'expense', category: _acctName(code),
      accountCode: code, counterpart: counter, amount: amt,
      paymentMethod: method, memo: desc, voucherId: vId, createdAt: _now()
    });
    _ls('acct_cashflows', cashflows);

    // 예산 소진
    _updateBudgetSpent(code, amt);

    // 폼 리셋
    ['exp_desc', 'exp_amount', 'exp_counter'].forEach(function (id) {
      var e = document.getElementById(id); if (e) e.value = '';
    });
    var autoLabel = document.getElementById('exp_auto_label');
    if (autoLabel) autoLabel.textContent = '';

    _toast('success', '지출 ' + _fmtW(amt) + ' 등록 완료 (전표 자동생성)');
    renderAcctExpense();
  }

  /* ══════════════════════════
     5. 입금전표 (간편 UI)
  ══════════════════════════ */
  function renderAcctIncome() {
    var el = document.getElementById('acct-income');
    if (!el) return;
    var cashflows = _cashflows().filter(function (c) { return c.type === 'income'; })
      .sort(function (a, b) { return (b.createdAt || '').localeCompare(a.createdAt || ''); });

    var html = '' +
      '<div class="page-header"><div>' +
      '<div class="page-title">입금전표</div>' +
      '<div class="page-subtitle">간편하게 입금을 등록하면 전표가 자동 생성됩니다</div>' +
      '</div></div>' +

      '<div class="acct-card">' +
      '<div class="acct-card-head"><i data-lucide="edit-3" style="width:16px;height:16px"></i> 간편 입금 등록</div>' +
      '<div class="acct-simple-form">' +
      '<div class="acct-form-row">' +
      '<div class="form-group" style="flex:2"><label class="form-label">입금 내용 *</label>' +
      '<input class="form-input" id="inc_desc" placeholder="예) 4월 매출, 이자수익" oninput="ACCT.autoSuggestAccount(\'inc\')"></div>' +
      '<div class="form-group" style="flex:1"><label class="form-label">금액 (원) *</label>' +
      '<input class="form-input" id="inc_amount" type="number" placeholder="0"></div>' +
      '<div class="form-group" style="flex:1"><label class="form-label">거래처</label>' +
      '<input class="form-input" id="inc_counter" placeholder="거래처명"></div>' +
      '</div>' +
      '<div class="acct-form-row">' +
      '<div class="form-group" style="flex:1"><label class="form-label">입금수단</label>' +
      '<select class="form-input" id="inc_method"><option value="계좌이체">계좌이체</option><option value="현금">현금</option><option value="카드">카드</option><option value="기타">기타</option></select></div>' +
      '<div class="form-group" style="flex:1"><label class="form-label">날짜</label>' +
      '<input class="form-input" id="inc_date" type="date" value="' + _today() + '"></div>' +
      '<div class="form-group" style="flex:2"><label class="form-label">자동매핑 계정 <span id="inc_auto_label" style="color:var(--accent-blue);font-weight:700"></span></label>' +
      '<select class="form-input" id="inc_account">' +
      '<option value="">자동 매핑됨</option>' +
      _accounts().filter(function (a) { return a.type === 'revenue'; }).map(function (a) { return '<option value="' + a.code + '">' + a.code + ' ' + a.name + '</option>'; }).join('') +
      '</select></div>' +
      '</div>' +
      '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px">' +
      '<button class="btn btn-blue" onclick="ACCT.saveIncome()" style="padding:8px 20px"><i data-lucide="save" style="width:14px;height:14px"></i> 입금 등록</button>' +
      '</div></div></div>' +

      '<div class="acct-card" style="margin-top:16px">' +
      '<div class="acct-card-head"><i data-lucide="list" style="width:16px;height:16px"></i> 입금 내역</div>';

    if (cashflows.length === 0) {
      html += '<div class="acct-empty">등록된 입금이 없습니다</div>';
    } else {
      html += '<table class="acct-table"><thead><tr>' +
        '<th>날짜</th><th>내용</th><th>계정과목</th><th>거래처</th><th>입금수단</th><th style="text-align:right">금액</th><th style="text-align:center;width:60px">삭제</th>' +
        '</tr></thead><tbody>';
      cashflows.forEach(function (c) {
        html += '<tr><td>' + (c.date || '') + '</td>' +
          '<td>' + _esc(c.memo || '') + '</td>' +
          '<td>' + _acctName(c.accountCode) + '</td>' +
          '<td>' + _esc(c.counterpart || '') + '</td>' +
          '<td>' + _esc(c.paymentMethod || '') + '</td>' +
          '<td class="num" style="color:#22c55e">' + _fmtW(c.amount) + '</td>' +
          '<td style="text-align:center"><button class="btn-icon-sm delete" onclick="ACCT.deleteCashflow(' + c.id + ',\'income\')"><i data-lucide="trash-2" class="icon-sm"></i></button></td></tr>';
      });
      html += '</tbody></table>';
    }
    html += '</div>';
    el.innerHTML = html;
    _ri();
  }

  function saveIncome() {
    var desc = (document.getElementById('inc_desc') || {}).value || '';
    var amt = parseInt((document.getElementById('inc_amount') || {}).value) || 0;
    var counter = (document.getElementById('inc_counter') || {}).value || '';
    var method = (document.getElementById('inc_method') || {}).value || '계좌이체';
    var date = (document.getElementById('inc_date') || {}).value || _today();
    var code = (document.getElementById('inc_account') || {}).value || _autoMapAccount(desc) || '4030';

    if (!desc.trim()) { _toast('error', '입금 내용을 입력하세요'); return; }
    if (amt <= 0) { _toast('error', '금액을 입력하세요'); return; }

    var cfId = _uid();
    var vId = _uid();

    // 전표 자동 생성
    var vouchers = _vouchers();
    vouchers.push({
      id: vId, date: date, type: 'income',
      description: desc,
      entries: [
        { side: 'debit', accountCode: '1020', amount: amt },
        { side: 'credit', accountCode: code, amount: amt }
      ],
      sourceType: 'cashflow', sourceId: cfId,
      createdAt: _now(), createdBy: (typeof WS !== 'undefined' && WS.currentUser) ? WS.currentUser.name : '시스템'
    });
    _ls('acct_vouchers', vouchers);

    var cashflows = _cashflows();
    cashflows.push({
      id: cfId, date: date, type: 'income', category: _acctName(code),
      accountCode: code, counterpart: counter, amount: amt,
      paymentMethod: method, memo: desc, voucherId: vId, createdAt: _now()
    });
    _ls('acct_cashflows', cashflows);

    ['inc_desc', 'inc_amount', 'inc_counter'].forEach(function (id) {
      var e = document.getElementById(id); if (e) e.value = '';
    });
    var autoLabel = document.getElementById('inc_auto_label');
    if (autoLabel) autoLabel.textContent = '';

    _toast('success', '입금 ' + _fmtW(amt) + ' 등록 완료 (전표 자동생성)');
    renderAcctIncome();
  }

  /* 입출금 삭제 (+ 관련 전표 삭제) */
  function deleteCashflow(id, type) {
    var cashflows = _cashflows();
    var item = cashflows.find(function (c) { return c.id === id; });
    if (item && item.voucherId) {
      var vouchers = _vouchers().filter(function (v) { return v.id !== item.voucherId; });
      _ls('acct_vouchers', vouchers);
    }
    _ls('acct_cashflows', cashflows.filter(function (c) { return c.id !== id; }));
    _toast('info', '삭제되었습니다');
    if (type === 'expense') renderAcctExpense();
    else renderAcctIncome();
  }

  /* ══════════════════════════
     6. 전표장부 (회계담당자 UI)
  ══════════════════════════ */
  function renderAcctPayment() {
    var el = document.getElementById('acct-payment');
    if (!el) return;
    var vouchers = _vouchers().sort(function (a, b) { return (b.date || '').localeCompare(a.date || '') || (b.createdAt || '').localeCompare(a.createdAt || ''); });

    var html = '' +
      '<div class="page-header"><div>' +
      '<div class="page-title">전표장부</div>' +
      '<div class="page-subtitle">모든 전표를 조회·수정할 수 있습니다 (회계담당자용)</div>' +
      '</div>' +
      '<button class="btn btn-blue" onclick="ACCT.openVoucherModal()"><i data-lucide="plus" style="width:14px;height:14px"></i> 전표 직접 등록</button>' +
      '</div>';

    if (vouchers.length === 0) {
      html += '<div class="acct-card"><div class="acct-empty"><i data-lucide="scroll-text" style="width:36px;height:36px;opacity:.3;display:block;margin:0 auto 10px"></i>등록된 전표가 없습니다</div></div>';
    } else {
      html += '<div class="acct-card">';
      vouchers.forEach(function (v, idx) {
        var debitSum = 0, creditSum = 0;
        (v.entries || []).forEach(function (e) {
          if (e.side === 'debit') debitSum += e.amount; else creditSum += e.amount;
        });
        var typeBadge = v.type === 'income' ? '<span class="acct-badge income">입금</span>'
          : v.type === 'expense' ? '<span class="acct-badge expense">출금</span>'
            : '<span class="acct-badge etc">대체</span>';
        var sourceStr = v.sourceType === 'approval' ? '품의' : v.sourceType === 'cashflow' ? '입출금' : '수동';

        html += '<div class="acct-voucher-item' + (idx > 0 ? ' border-top' : '') + '">' +
          '<div class="acct-voucher-header">' +
          '<div class="acct-voucher-meta">' +
          '<span class="acct-voucher-date">' + (v.date || '') + '</span>' +
          typeBadge +
          '<span class="acct-voucher-src">' + sourceStr + '</span>' +
          '</div>' +
          '<div class="acct-voucher-desc">' + _esc(v.description || '') + '</div>' +
          '<div class="acct-voucher-actions">' +
          '<button class="btn-icon-sm edit" onclick="ACCT.openVoucherModal(' + v.id + ')" title="수정"><i data-lucide="edit-3" class="icon-sm"></i></button>' +
          '<button class="btn-icon-sm delete" onclick="ACCT.deleteVoucher(' + v.id + ')" title="삭제"><i data-lucide="trash-2" class="icon-sm"></i></button>' +
          '</div>' +
          '</div>' +

          // 차변/대변 테이블
          '<table class="acct-entry-table">' +
          '<thead><tr><th>구분</th><th>계정과목</th><th style="text-align:right">금액</th></tr></thead>' +
          '<tbody>' +
          (v.entries || []).map(function (e) {
            return '<tr>' +
              '<td><span class="acct-side-badge ' + e.side + '">' + (e.side === 'debit' ? '차변' : '대변') + '</span></td>' +
              '<td>' + e.accountCode + ' ' + _acctName(e.accountCode) + '</td>' +
              '<td class="num">' + _fmtW(e.amount) + '</td></tr>';
          }).join('') +
          '<tr class="acct-entry-sum"><td></td><td style="text-align:right;font-weight:800">합계</td>' +
          '<td class="num" style="font-weight:800">' + _fmtW(debitSum) + '</td></tr>' +
          '</tbody></table>' +
          '</div>';
      });
      html += '</div>';
    }

    // 전표 등록 모달
    html += _voucherModalHTML();

    el.innerHTML = html;
    _ri();
  }

  function _voucherModalHTML() {
    var allAccts = _accounts();
    var optGroup = function (type, label) {
      var items = allAccts.filter(function (a) { return a.type === type; });
      if (!items.length) return '';
      return '<optgroup label="' + label + '">' +
        items.map(function (a) { return '<option value="' + a.code + '">' + a.code + ' ' + a.name + '</option>'; }).join('') +
        '</optgroup>';
    };
    var acctOptions = '<option value="">-- 선택 --</option>' +
      optGroup('asset', '자산') + optGroup('liability', '부채') + optGroup('equity', '자본') +
      optGroup('revenue', '수익') + optGroup('expense', '비용');

    return '<div class="modal-overlay" id="voucherModal" style="display:none" onclick="if(event.target===this)ACCT.closeVoucherModal()">' +
      '<div class="modal-box" style="max-width:600px">' +
      '<div class="modal-head"><div class="modal-title" id="voucherModalTitle">전표 등록</div><button class="modal-close" onclick="ACCT.closeVoucherModal()">✕</button></div>' +
      '<div class="modal-body" style="display:flex;flex-direction:column;gap:14px">' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
      '<div class="form-group" style="margin:0"><label class="form-label">날짜 *</label><input class="form-input" id="vm_date" type="date" value="' + _today() + '"></div>' +
      '<div class="form-group" style="margin:0"><label class="form-label">유형</label>' +
      '<select class="form-input" id="vm_type"><option value="expense">출금</option><option value="income">입금</option><option value="transfer">대체</option></select></div>' +
      '</div>' +
      '<div class="form-group"><label class="form-label">적요 *</label><input class="form-input" id="vm_desc" placeholder="거래 내용"></div>' +

      '<div style="font-size:12px;font-weight:800;color:var(--text-secondary);margin-bottom:4px">차변 / 대변 항목</div>' +
      '<div id="vm_entries">' +
      '<div class="acct-entry-row">' +
      '<select class="form-input" style="flex:.8"><option value="debit">차변</option><option value="credit">대변</option></select>' +
      '<select class="form-input" style="flex:2">' + acctOptions + '</select>' +
      '<input class="form-input" type="number" placeholder="금액" style="flex:1">' +
      '</div>' +
      '<div class="acct-entry-row">' +
      '<select class="form-input" style="flex:.8"><option value="debit">차변</option><option value="credit" selected>대변</option></select>' +
      '<select class="form-input" style="flex:2">' + acctOptions + '</select>' +
      '<input class="form-input" type="number" placeholder="금액" style="flex:1">' +
      '</div>' +
      '</div>' +
      '<button class="btn" onclick="ACCT.addVoucherEntry()" style="align-self:flex-start"><i data-lucide="plus" style="width:12px;height:12px"></i> 항목 추가</button>' +
      '</div>' +
      '<div class="modal-foot"><button class="btn" onclick="ACCT.closeVoucherModal()">취소</button>' +
      '<button class="btn btn-blue" onclick="ACCT.saveVoucher()">저장</button></div>' +
      '</div></div>';
  }

  var _voucherEditId = null;
  function openVoucherModal(editId) {
    _voucherEditId = editId || null;
    var title = document.getElementById('voucherModalTitle');
    if (editId) {
      var v = _vouchers().find(function (x) { return x.id === editId; });
      if (v) {
        if (title) title.textContent = '전표 수정';
        var dateEl = document.getElementById('vm_date'); if (dateEl) dateEl.value = v.date || '';
        var typeEl = document.getElementById('vm_type'); if (typeEl) typeEl.value = v.type || 'expense';
        var descEl = document.getElementById('vm_desc'); if (descEl) descEl.value = v.description || '';
        // entries 재생성
        _rebuildVoucherEntries(v.entries || []);
      }
    } else {
      if (title) title.textContent = '전표 등록';
      var dateEl2 = document.getElementById('vm_date'); if (dateEl2) dateEl2.value = _today();
      var typeEl2 = document.getElementById('vm_type'); if (typeEl2) typeEl2.value = 'expense';
      var descEl2 = document.getElementById('vm_desc'); if (descEl2) descEl2.value = '';
    }
    var m = document.getElementById('voucherModal'); if (m) m.style.display = 'flex';
    _ri();
  }

  function _rebuildVoucherEntries(entries) {
    var container = document.getElementById('vm_entries');
    if (!container) return;
    var allAccts = _accounts();
    var acctOptions = '<option value="">-- 선택 --</option>';
    ['asset', 'liability', 'equity', 'revenue', 'expense'].forEach(function (type) {
      var label = { asset: '자산', liability: '부채', equity: '자본', revenue: '수익', expense: '비용' }[type];
      var items = allAccts.filter(function (a) { return a.type === type; });
      if (items.length) {
        acctOptions += '<optgroup label="' + label + '">' +
          items.map(function (a) { return '<option value="' + a.code + '">' + a.code + ' ' + a.name + '</option>'; }).join('') + '</optgroup>';
      }
    });
    container.innerHTML = entries.map(function (e) {
      return '<div class="acct-entry-row">' +
        '<select class="form-input" style="flex:.8"><option value="debit"' + (e.side === 'debit' ? ' selected' : '') + '>차변</option><option value="credit"' + (e.side === 'credit' ? ' selected' : '') + '>대변</option></select>' +
        '<select class="form-input" style="flex:2">' + acctOptions.replace('value="' + e.accountCode + '"', 'value="' + e.accountCode + '" selected') + '</select>' +
        '<input class="form-input" type="number" placeholder="금액" style="flex:1" value="' + (e.amount || '') + '">' +
        '<button class="btn-icon-sm delete" onclick="this.parentElement.remove()" title="삭제"><i data-lucide="x" class="icon-sm"></i></button>' +
        '</div>';
    }).join('');
    _ri();
  }

  function addVoucherEntry() {
    var container = document.getElementById('vm_entries');
    if (!container) return;
    var allAccts = _accounts();
    var acctOptions = '<option value="">-- 선택 --</option>';
    ['asset', 'liability', 'equity', 'revenue', 'expense'].forEach(function (type) {
      var label = { asset: '자산', liability: '부채', equity: '자본', revenue: '수익', expense: '비용' }[type];
      var items = allAccts.filter(function (a) { return a.type === type; });
      if (items.length) {
        acctOptions += '<optgroup label="' + label + '">' +
          items.map(function (a) { return '<option value="' + a.code + '">' + a.code + ' ' + a.name + '</option>'; }).join('') + '</optgroup>';
      }
    });
    var div = document.createElement('div');
    div.className = 'acct-entry-row';
    div.innerHTML = '<select class="form-input" style="flex:.8"><option value="debit">차변</option><option value="credit">대변</option></select>' +
      '<select class="form-input" style="flex:2">' + acctOptions + '</select>' +
      '<input class="form-input" type="number" placeholder="금액" style="flex:1">' +
      '<button class="btn-icon-sm delete" onclick="this.parentElement.remove()" title="삭제"><i data-lucide="x" class="icon-sm"></i></button>';
    container.appendChild(div);
    _ri();
  }

  function closeVoucherModal() {
    var m = document.getElementById('voucherModal'); if (m) m.style.display = 'none';
    _voucherEditId = null;
  }

  function saveVoucher() {
    var date = (document.getElementById('vm_date') || {}).value || _today();
    var type = (document.getElementById('vm_type') || {}).value || 'expense';
    var desc = (document.getElementById('vm_desc') || {}).value || '';
    if (!desc.trim()) { _toast('error', '적요를 입력하세요'); return; }

    var container = document.getElementById('vm_entries');
    var rows = container ? container.querySelectorAll('.acct-entry-row') : [];
    var entries = [];
    rows.forEach(function (row) {
      var selects = row.querySelectorAll('select');
      var input = row.querySelector('input[type="number"]');
      if (selects.length >= 2 && input) {
        var side = selects[0].value;
        var code = selects[1].value;
        var amt = parseInt(input.value) || 0;
        if (code && amt > 0) entries.push({ side: side, accountCode: code, amount: amt });
      }
    });

    if (entries.length < 2) { _toast('error', '차변과 대변 항목을 최소 각 1개씩 입력하세요'); return; }

    var vouchers = _vouchers();
    if (_voucherEditId) {
      vouchers = vouchers.map(function (v) {
        if (v.id !== _voucherEditId) return v;
        return Object.assign({}, v, { date: date, type: type, description: desc, entries: entries });
      });
      _toast('info', '전표가 수정되었습니다');
    } else {
      vouchers.push({
        id: _uid(), date: date, type: type, description: desc, entries: entries,
        sourceType: 'manual', sourceId: null,
        createdAt: _now(), createdBy: (typeof WS !== 'undefined' && WS.currentUser) ? WS.currentUser.name : '수동'
      });
      _toast('success', '전표가 등록되었습니다');
    }
    _ls('acct_vouchers', vouchers);
    closeVoucherModal();
    renderAcctPayment();
  }

  function deleteVoucher(id) {
    _ls('acct_vouchers', _vouchers().filter(function (v) { return v.id !== id; }));
    _toast('info', '전표가 삭제되었습니다');
    renderAcctPayment();
  }

  /* ══════════════════════════
     글로벌 노출
  ══════════════════════════ */
  window.ACCT = {
    enter: enterAccountingMode,
    exit: exitAccountingMode,
    showPage: showAcctPage,
    // 대시보드
    renderOverview: renderAcctOverview,
    // 예산구분
    selectBudgetCat: selectBudgetCat,
    openBudgetCatModal: openBudgetCatModal,
    closeBudgetCatModal: closeBudgetCatModal,
    saveBudgetCat: saveBudgetCat,
    deleteBudgetCat: deleteBudgetCat,
    // 예산
    openBudgetModal: openBudgetModal,
    closeBudgetModal: closeBudgetModal,
    saveBudget: saveBudget,
    deleteBudget: deleteBudget,
    // 품의
    openApprovalModal: openApprovalModal,
    closeApprovalModal: closeApprovalModal,
    submitApproval: submitApproval,
    approveItem: approveItem,
    rejectItem: rejectItem,
    switchApprovalTab: switchApprovalTab,
    // 입출금
    autoSuggestAccount: autoSuggestAccount,
    saveExpense: saveExpense,
    saveIncome: saveIncome,
    deleteCashflow: deleteCashflow,
    // 전표
    openVoucherModal: openVoucherModal,
    closeVoucherModal: closeVoucherModal,
    addVoucherEntry: addVoucherEntry,
    saveVoucher: saveVoucher,
    deleteVoucher: deleteVoucher
  };

  // 글로벌 함수 노출 (사이드바/헤더에서 직접 호출)
  window.enterAccountingMode = enterAccountingMode;
  window.exitAccountingMode = exitAccountingMode;
  window.showAcctPage = showAcctPage;

})();
