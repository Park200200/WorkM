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
    { code: '1540', name: '임차보증금', type: 'asset', group: '비유동자산' },
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
    // 2026년 샘플 예산 데이터 자동 생성
    (function _seedBudget2026() {
      var cats = JSON.parse(localStorage.getItem('acct_budget_cats') || '[]');
      var budgets = JSON.parse(localStorage.getItem('acct_budgets') || '[]');

      // 이미 시드 완료 여부 확인
      if (localStorage.getItem('_budget_seed_2026_v2')) return;

      // 3개 예산구분 정의
      var catDefs = [
        { name: '문화재청', bank: '기업은행 1010-1100-12', from: '2026-01-01', to: '2026-12-31' },
        { name: '경주시청', bank: '농협은행 2020-2200-34', from: '2026-01-01', to: '2026-12-31' },
        { name: '자체예산', bank: '국민은행 3030-3300-56', from: '2026-01-01', to: '2026-12-31' }
      ];

      // 문화재청 예산 10건
      var items_CHA = [
        { item: '문화재 보수비', code: '5110', amt: 50000000 },
        { item: '발굴조사비', code: '5120', amt: 30000000 },
        { item: '전문인력 인건비', code: '5210', amt: 25000000 },
        { item: '장비 구입비', code: '5130', amt: 15000000 },
        { item: '안전관리비', code: '5140', amt: 8000000 },
        { item: '운송비', code: '5310', amt: 5000000 },
        { item: '보험료', code: '5340', amt: 3000000 },
        { item: '수용비', code: '5190', amt: 2000000 },
        { item: '여비비', code: '5390', amt: 5000000 },
        { item: '교육훈련비', code: '5350', amt: 4000000 }
      ];

      // 경주시청 예산 10건
      var items_GJ = [
        { item: '유적정비비', code: '5110', amt: 40000000 },
        { item: '관광홍보비', code: '5320', amt: 20000000 },
        { item: '시설유지비', code: '5130', amt: 15000000 },
        { item: '조경공사비', code: '5120', amt: 12000000 },
        { item: '안내판 제작비', code: '5190', amt: 5000000 },
        { item: '행사운영비', code: '5310', amt: 8000000 },
        { item: '전기수도비', code: '5340', amt: 6000000 },
        { item: '청소용역비', code: '5350', amt: 4000000 },
        { item: '문화행사비', code: '5390', amt: 10000000 },
        { item: '안전점검비', code: '5140', amt: 3000000 }
      ];

      // 자체예산 10건
      var items_SELF = [
        { item: '임직원 급여', code: '5210', amt: 60000000 },
        { item: '사무용품비', code: '5190', amt: 5000000 },
        { item: '통신비', code: '5340', amt: 3000000 },
        { item: '차량유지비', code: '5310', amt: 4000000 },
        { item: '복리후생비', code: '5350', amt: 6000000 },
        { item: '접대비', code: '5390', amt: 2000000 },
        { item: '도서인쇄비', code: '5190', amt: 1500000 },
        { item: '수선유지비', code: '5130', amt: 3000000 },
        { item: '교육연수비', code: '5350', amt: 2500000 },
        { item: '예비비', code: '5390', amt: 5000000 }
      ];

      var allItems = [items_CHA, items_GJ, items_SELF];
      var uid = function () { return Date.now().toString(36) + Math.random().toString(36).substring(2, 7); };

      catDefs.forEach(function (def, ci) {
        // 이미 같은 이름+년도 구분이 있으면 스킵
        var exist = cats.find(function (c) { return c.name === def.name && c.year === 2026; });
        var catId;
        if (exist) {
          catId = exist.id;
        } else {
          catId = uid();
          cats.push({
            id: catId, name: def.name, year: 2026,
            bankInfo: def.bank, periodFrom: def.from, periodTo: def.to
          });
        }

        // 해당 구분에 예산 추가
        allItems[ci].forEach(function (b) {
          var dup = budgets.find(function (x) { return x.catId === catId && x.itemName === b.item; });
          if (!dup) {
            budgets.push({
              id: uid(), catId: catId, year: 2026,
              itemName: b.item, accountCode: b.code,
              amount: b.amt, spent: 0, memo: ''
            });
          }
        });
      });

      localStorage.setItem('acct_budget_cats', JSON.stringify(cats));
      localStorage.setItem('acct_budgets', JSON.stringify(budgets));
      localStorage.setItem('_budget_seed_2026_v2', '1');
    })();

    if (!_ls('acct_accounts')) {
      _ls('acct_accounts', DEFAULT_ACCOUNTS);
    } else {
      // 기존 데이터에 새 계정 자동 추가
      var existing = _ls('acct_accounts');
      var changed = false;
      DEFAULT_ACCOUNTS.forEach(function (da) {
        if (!existing.find(function (e) { return e.code === da.code; })) {
          existing.push(da);
          changed = true;
        }
      });
      if (changed) _ls('acct_accounts', existing);
    }
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

  function _fmtInput(val) {
    if (val === undefined || val === null || val === '') return '';
    var s = String(val).replace(/[^0-9]/g, '');
    if (!s) return '';
    return Number(s).toLocaleString();
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
    // 하단 내책상으로 버튼 표시
    var backBtn = document.getElementById('backToDeskBtn');
    if (backBtn) backBtn.style.display = 'block';
    // 하단 사용자 프로필 숨기기
    var sideUser = document.getElementById('sidebarUser');
    if (sideUser) sideUser.style.display = 'none';

    // 회계연도 바 렌더
    _renderYearBar();

    // 첫 서브페이지 활성화
    var firstItem = document.querySelector('#acctNav [data-acct-page="acct-overview"]');
    showAcctPage('acct-overview', firstItem);
    _ri();
  }

  function _selectedYear() {
    return window._acctBudgetYear || new Date().getFullYear();
  }
  function _isInYear(dateStr) {
    if (!dateStr) return false;
    return parseInt(String(dateStr).substring(0, 4)) === _selectedYear();
  }

    function _renderYearBar() {
    var bar = document.getElementById('acctYearBar');
    if (!bar) return;
    var currentYear = window._acctBudgetYear || new Date().getFullYear();
    var cats = _budgetCats();
    var years = [];
    cats.forEach(function (cat) {
      var y = cat.year || (cat.periodFrom ? parseInt(cat.periodFrom.substring(0, 4)) : new Date().getFullYear());
      if (years.indexOf(y) < 0) years.push(y);
    });
    if (years.indexOf(currentYear) < 0) years.push(currentYear);
    var nowY = new Date().getFullYear();
    if (years.indexOf(nowY - 1) < 0) years.push(nowY - 1);
    if (years.indexOf(nowY + 1) < 0) years.push(nowY + 1);
    years.sort(function (a, b) { return b - a; });
    var h = '<span style="font-size:11px;color:var(--text-muted);font-weight:600"><i data-lucide="calendar" style="width:12px;height:12px;vertical-align:middle;margin-right:2px"></i>회계년도</span>';
    years.forEach(function (y) {
      var active = y === currentYear;
      h += '<button onclick="window._acctBudgetYear=' + y + ';ACCT._refreshYear()" style="padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700;cursor:pointer;border:1px solid ' +
        (active ? 'var(--accent-blue);background:var(--accent-blue);color:#fff' : 'var(--border-color);background:transparent;color:var(--text-muted)') +
        ';transition:all .15s">' + y + '</button>';
    });
    bar.innerHTML = h;
    _ri();
  }

  function _refreshYear() {
    _renderYearBar();
    // 현재 활성 페이지 새로고침 (모든 페이지 지원)
    var pages = document.querySelectorAll('.acct-sub-page');
    var pageId = '';
    pages.forEach(function (p) {
      if (p.style.display === 'block') pageId = p.id;
    });
    if (!pageId) {
      // 첫 번째 보이는 페이지
      var nav = document.querySelector('#acctNav .nav-item.active');
      if (nav) pageId = nav.getAttribute('data-acct-page') || 'acct-overview';
    }
    if (pageId === 'acct-overview') renderAcctOverview();
    else if (pageId === 'acct-budget') renderAcctBudget();
    else if (pageId === 'acct-approval') renderAcctApproval();
    else if (pageId === 'acct-expense') renderAcctExpense();
    else if (pageId === 'acct-income') renderAcctIncome();
    else if (pageId === 'acct-withdrawal') renderAcctWithdrawal();
    else if (pageId === 'acct-payment') renderAcctPayment();
    if (pageId === 'acct-balance') renderAcctBalance();
    else if (pageId === 'acct-balance') renderAcctBalance();
    if (pageId === 'acct-reports') renderAcctReports();
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
    // 하단 내책상으로 버튼 숨기기
    var backBtn = document.getElementById('backToDeskBtn');
    if (backBtn) backBtn.style.display = 'none';
    // 하단 사용자 프로필 복원
    var sideUser = document.getElementById('sidebarUser');
    if (sideUser) sideUser.style.display = '';

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
    if (pageId === 'acct-withdrawal') renderAcctWithdrawal();
    if (pageId === 'acct-payment') renderAcctPayment();
    if (pageId === 'acct-balance') renderAcctBalance();
    if (pageId === 'acct-reports') renderAcctReports();
    _ri();
  }

  /* ══════════════════════════
     1. 기본현황 (대시보드)
  ══════════════════════════ */
  function renderAcctOverview() {
    var el = document.getElementById('acct-overview');
    if (!el) return;
    _initDefaults();

    var allCats = _budgetCats();
    var selYear = _selectedYear();
    var cats = allCats.filter(function (cat) {
      var catYear = cat.year || (cat.periodFrom ? parseInt(cat.periodFrom.substring(0, 4)) : new Date().getFullYear());
      return catYear === selYear;
    });
    var tabId = window._acctOverviewTab || 'all';

    /* ── 탭 UI ── */
    var tabHtml =
      '<div class="page-header"><div>' +
      '<div class="page-title">기본현황</div>' +
      '<div class="page-subtitle">전체 수입·지출·예산 통합 대시보드</div>' +
      '</div></div>' +
      '<div style="display:flex;gap:6px;margin-bottom:18px;flex-wrap:wrap">' +
      '<button onclick="window._acctOverviewTab=\'all\';ACCT.renderOverview()" ' +
      'style="padding:8px 18px;border-radius:20px;font-size:12.5px;font-weight:700;cursor:pointer;border:1.5px solid ' +
      (tabId === 'all' ? 'var(--accent-blue);background:var(--accent-blue);color:#fff' : 'var(--border-color);background:transparent;color:var(--text-secondary)') +
      ';transition:all .15s">📊 전체현황</button>';

    cats.forEach(function (cat) {
      var active = tabId === String(cat.id);
      tabHtml += '<button onclick="window._acctOverviewTab=\'' + cat.id + '\';ACCT.renderOverview()" ' +
        'style="padding:8px 18px;border-radius:20px;font-size:12.5px;font-weight:700;cursor:pointer;border:1.5px solid ' +
        (active ? 'var(--accent-blue);background:var(--accent-blue);color:#fff' : 'var(--border-color);background:transparent;color:var(--text-secondary)') +
        ';transition:all .15s">' + _esc(cat.name) + '</button>';
    });
    tabHtml += '</div>';

    /* ── 데이터 필터링 ── */
    var yearCatIds = cats.map(function (ct) { return ct.id; });
    var allBudgets = _budgets().filter(function (b) { return yearCatIds.indexOf(b.catId) >= 0; });
    var allVouchers = _vouchers().filter(function (v) { return _isInYear(v.date); });
    var allCashflows = _cashflows().filter(function (cf) { return _isInYear(cf.date); });
    var allApprovals = _approvals().filter(function (a) { return _isInYear(a.date || a.createdAt); });

    var budgets, vouchers, cashflows, approvals, catInfo;

    if (tabId === 'all') {
      budgets = allBudgets;
      vouchers = allVouchers;
      cashflows = allCashflows;
      approvals = allApprovals;
      catInfo = null;
    } else {
      var catIdStr = String(tabId);
      catInfo = cats.find(function (c) { return String(c.id) === catIdStr; });
      budgets = allBudgets.filter(function (b) { return String(b.catId) === catIdStr; });
      var budgetAcctCodes = budgets.map(function (b) { return b.accountCode; });
      vouchers = allVouchers.filter(function (v) {
        return (v.entries || []).some(function (e) { return budgetAcctCodes.indexOf(e.accountCode) >= 0 || budgetAcctCodes.indexOf(e.account) >= 0; });
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

      '</div>';

      // 최근 전표
      html += (function(){
        if(recent.length===0) return '<div class="acct-card" style="margin-top:16px"><div class="acct-card-head"><i data-lucide="scroll-text" style="width:16px;height:16px"></i> \ucd5c\uadfc \uc804\ud45c</div><div class="acct-empty">\ub4f1\ub85d\ub41c \uc804\ud45c\uac00 \uc5c6\uc2b5\ub2c8\ub2e4</div></div>';
        var isMobV=window.innerWidth<768;
        var vtype={income:{c:'#22c55e',bg:'rgba(34,197,94,.1)',label:'\uc785\uae08'},expense:{c:'#ef4444',bg:'rgba(239,68,68,.1)',label:'\ucd9c\uae08'}};
        if(!isMobV){
          return '<div class="acct-card" style="margin-top:16px">'+
            '<div class="acct-card-head"><i data-lucide="scroll-text" style="width:16px;height:16px"></i> \ucd5c\uadfc \uc804\ud45c</div>'+
            '<table class="acct-table"><thead><tr>'+
            '<th>\ub0a0\uc9dc</th><th>\uc720\ud615</th><th>\uc801\uc694</th><th>\ucc28\ubcc0</th><th>\ub300\ubcc0</th>'+
            '</tr></thead><tbody>'+
            recent.map(function(v){
              var ds=0,cs=0;(v.entries||[]).forEach(function(e){if(e.side==='debit')ds+=e.amount;else cs+=e.amount;});
              var t=vtype[v.type]||{c:'#8b5cf6',bg:'rgba(139,92,246,.1)',label:'\ub300\uccb4'};
              return '<tr><td>'+(v.date||'')+'</td><td><span class="acct-badge '+(v.type||'etc')+'">'+(t.label||v.type)+'</span></td>'+
                '<td>'+_esc(v.description||'')+'</td><td class="num">'+_fmtW(ds)+'</td><td class="num">'+_fmtW(cs)+'</td></tr>';
            }).join('')+
            '</tbody></table></div>';
        }
        /* 모바일 카드 */
        return '<div style="margin-top:16px"><div style="display:flex;align-items:center;gap:8px;font-size:15px;font-weight:800;color:var(--text-primary);margin-bottom:12px"><svg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\'><path d=\'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\'/><polyline points=\'14 2 14 8 20 8\'/><line x1=\'16\' y1=\'13\' x2=\'8\' y2=\'13\'/><line x1=\'16\' y1=\'17\' x2=\'8\' y2=\'17\'/><polyline points=\'10 9 9 9 8 9\'/></svg>\ucd5c\uadfc \uc804\ud45c</div>'+
          '<div style="display:flex;flex-direction:column;gap:10px">'+
          recent.map(function(v){
            var ds=0,cs=0;(v.entries||[]).forEach(function(e){if(e.side==='debit')ds+=e.amount;else cs+=e.amount;});
            var t=vtype[v.type]||{c:'#8b5cf6',bg:'rgba(139,92,246,.1)',label:'\ub300\uccb4'};
            return '<div style="position:relative;border-radius:16px;overflow:hidden;background:var(--bg-card);border:1.5px solid var(--border-color);box-shadow:0 2px 8px rgba(0,0,0,.05);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)">'+
              '<div style="position:absolute;top:0;left:0;bottom:0;width:4px;background:'+t.c+';border-radius:16px 0 0 16px"></div>'+
              '<div style="padding:12px 14px 12px 18px">'+
                '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">'+
                  '<div style="font-size:11.5px;color:var(--text-muted);font-weight:600">'+(v.date||'')+'</div>'+
                  '<span style="font-size:10.5px;font-weight:800;padding:2px 9px;border-radius:20px;background:'+t.bg+';color:'+t.c+'">'+t.label+'</span>'+
                '</div>'+
                '<div style="font-size:14.5px;font-weight:800;color:var(--text-primary);margin-bottom:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+_esc(v.description||'\uc801\uc694 \uc5c6\uc74c')+'</div>'+
                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'+
                  '<div style="text-align:center;padding:7px 0;background:rgba(239,68,68,.05);border-radius:10px">'+
                    '<div style="font-size:9.5px;font-weight:600;color:var(--text-muted);margin-bottom:2px">\ucc28\ubcc0</div>'+
                    '<div style="font-size:13.5px;font-weight:900;color:#ef4444">'+_fmtW(ds)+'</div>'+
                  '</div>'+
                  '<div style="text-align:center;padding:7px 0;background:rgba(34,197,94,.05);border-radius:10px">'+
                    '<div style="font-size:9.5px;font-weight:600;color:var(--text-muted);margin-bottom:2px">\ub300\ubcc0</div>'+
                    '<div style="font-size:13.5px;font-weight:900;color:#22c55e">'+_fmtW(cs)+'</div>'+
                  '</div>'+
                '</div>'+
              '</div>'+
            '</div>';
          }).join('')+
          '</div></div>';
      })();

    el.innerHTML = '<div style="padding-bottom:80px">' + html + '</div>';
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
    var allCatsRaw = _budgetCats();
    var budgets = _budgets();
    var currentYear = _selectedYear();

    // 연도 필터 적용
    var cats = allCatsRaw.filter(function (cat) {
      var catYear = cat.year || (cat.periodFrom ? parseInt(cat.periodFrom.substring(0, 4)) : new Date().getFullYear());
      return catYear === currentYear;
    });

    // 선택된 예산구분이 해당 연도에 없으면 첫번째로
    if (cats.length > 0 && !cats.find(function (c) { return String(c.id) === String(_selectedBudgetCatId); })) {
      _selectedBudgetCatId = String(cats[0].id);
    }
    if (!_selectedBudgetCatId && cats.length > 0) _selectedBudgetCatId = String(cats[0].id);
    var selCat = cats.find(function (c) { return String(c.id) === String(_selectedBudgetCatId); }) || null;
    var filtered = selCat ? budgets.filter(function (b) { return String(b.catId) === String(_selectedBudgetCatId); }) : [];
    var allYears = [];
    allCatsRaw.forEach(function (cat) {
      var y = cat.year || (cat.periodFrom ? parseInt(cat.periodFrom.substring(0, 4)) : new Date().getFullYear());
      if (allYears.indexOf(y) < 0) allYears.push(y);
    });
    if (allYears.indexOf(currentYear) < 0) allYears.push(currentYear);
    if (allYears.indexOf(currentYear - 1) < 0) allYears.push(currentYear - 1);
    if (allYears.indexOf(currentYear + 1) < 0) allYears.push(currentYear + 1);
    allYears.sort(function (a, b) { return b - a; });

    // 연도별 필터
    var filteredCats = cats.filter(function (cat) {
      var catYear = cat.year || (cat.periodFrom ? parseInt(cat.periodFrom.substring(0, 4)) : new Date().getFullYear());
      return catYear === currentYear;
    });
    // 연도 필터 적용 시 선택된 구분도 필터 내로
    if (filteredCats.length > 0 && !filteredCats.find(function (c) { return c.id === _selectedBudgetCatId; })) {
      _selectedBudgetCatId = filteredCats[0].id;
      selCat = filteredCats[0];
      filtered = selCat ? budgets.filter(function (b) { return b.catId === _selectedBudgetCatId; }) : budgets;
    }

    // 연도 탭 HTML
    var yearTabHtml = '<div style="display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap;align-items:center">' +
      '<span style="font-size:12px;font-weight:700;color:var(--text-secondary);margin-right:4px"><i data-lucide="calendar" style="width:14px;height:14px;vertical-align:middle;margin-right:4px"></i>회계연도</span>';
    allYears.forEach(function (y) {
      var active = y === currentYear;
      yearTabHtml += '<button onclick="window._acctBudgetYear=' + y + ';ACCT.renderBudget()" ' +
        'style="padding:6px 16px;border-radius:20px;font-size:12.5px;font-weight:700;cursor:pointer;border:1.5px solid ' +
        (active ? 'var(--accent-blue);background:var(--accent-blue);color:#fff' : 'var(--border-color);background:transparent;color:var(--text-secondary)') +
        ';transition:all .15s">' + y + '년</button>';
    });
    yearTabHtml += '</div>';

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
      html += '<div class="acct-empty" style="padding:20px">' + currentYear + '년 등록된 예산구분이 없습니다. "구분 추가" 버튼으로 먼저 등록하세요.</div>';
    } else {
      /* 카테고리별 컬러 팔레트 */
      var BC_COLORS = ['#4f6ef7','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#f97316','#14b8a6'];
      function _catColor(idx) { return BC_COLORS[idx % BC_COLORS.length]; }
      var isMobBudget = window.innerWidth < 768;

      if (isMobBudget) {
        /* ── 모바일: 글래스모피즘 + 컬러바 카드 ── */
        html += '<div style="display:flex;flex-direction:column;gap:11px">';
        cats.forEach(function (c, idx) {
          var isActive = String(c.id) === String(_selectedBudgetCatId);
          var catBudgets = budgets.filter(function (b) { return b.catId === c.id; });
          var totalAmt = 0; catBudgets.forEach(function (b) { totalAmt += (b.amount || 0); });
          var totalSpent = 0; catBudgets.forEach(function (b) { totalSpent += (b.spent || 0); });
          var pct = totalAmt > 0 ? Math.round(totalSpent / totalAmt * 100) : 0;
          var cc = _catColor(idx);
          var barColor = pct > 100 ? '#ef4444' : pct > 80 ? '#f59e0b' : cc;
          html +=
            '<div onclick="ACCT.selectBudgetCat(\'' + c.id + '\')" style="' +
              'position:relative;border-radius:18px;overflow:hidden;cursor:pointer;' +
              'background:' + (isActive ? 'rgba(79,110,247,.07)' : 'var(--bg-card)') + ';' +
              'border:1.5px solid ' + (isActive ? cc : 'var(--border-color)') + ';' +
              'box-shadow:' + (isActive ? '0 6px 24px ' + cc + '28' : '0 2px 10px rgba(0,0,0,0.06)') + ';' +
              'backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);transition:all 0.2s">' +
            '<div style="position:absolute;top:0;left:0;bottom:0;width:4px;background:' + cc + ';border-radius:18px 0 0 18px"></div>' +
            '<div style="padding:14px 14px 10px 18px">' +
              '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">' +
                '<div style="font-size:16px;font-weight:900;color:' + (isActive ? cc : 'var(--text-primary)') + '">' + _esc(c.name) + '</div>' +
                (isActive ? '<span style="font-size:10px;font-weight:800;padding:2px 8px;border-radius:20px;background:' + cc + '22;color:' + cc + '">\uc120\ud0dd</span>' : '') +
              '</div>' +
              '<div style="font-size:12px;color:var(--text-muted);margin-bottom:2px">' + _esc(c.bank || '-') + '</div>' +
              '<div style="font-size:11.5px;color:var(--text-muted);margin-bottom:9px">' + (c.periodFrom || '') + ' ~ ' + (c.periodTo || '') + '</div>' +
              '<div style="font-size:13px;font-weight:800;color:var(--text-secondary)">\uc608\uc0b0\ud56d\ubaa9 <span style="color:' + cc + '">' + catBudgets.length + '</span>\uac74 &middot; \ucd1d <span style="color:var(--text-primary)">' + _fmtW(totalAmt) + '</span></div>' +
            '</div>' +
            '<div style="display:flex;border-top:1px solid var(--border-color)">' +
              '<button onclick="event.stopPropagation();ACCT.openBudgetCatModal(\'' + c.id + '\')" style="flex:1;height:40px;background:transparent;border:none;border-right:1px solid var(--border-color);font-size:12.5px;font-weight:700;color:var(--text-primary);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;font-family:inherit;transition:background 0.15s">\uc218\uc815</button>' +
              '<button onclick="event.stopPropagation();ACCT.deleteBudgetCat(\'' + c.id + '\')" style="flex:1;height:40px;background:transparent;border:none;font-size:12.5px;font-weight:700;color:#ef4444;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;font-family:inherit;transition:background 0.15s">\uc0ad\uc81c</button>' +
            '</div>' +
            '<div style="height:4px;background:var(--border-color);border-radius:0 0 16px 16px;overflow:hidden">' +
              '<div style="height:100%;width:' + Math.min(100, pct) + '%;background:' + barColor + ';transition:width 0.6s"></div>' +
            '</div>' +
            '</div>';
        });
        html += '</div>';
      } else {
        /* ── 데스크탑: 기존 ── */
        html += '<div style="display:flex;gap:12px;flex-wrap:wrap">';
      cats.forEach(function (c) {
        var isActive = String(c.id) === String(_selectedBudgetCatId);
        var catBudgets = budgets.filter(function (b) { return b.catId === c.id; });
        var totalAmt = 0; catBudgets.forEach(function (b) { totalAmt += (b.amount || 0); });
        html += '<div class="acct-budget-cat-card' + (isActive ? ' active' : '') + '" onclick="ACCT.selectBudgetCat(\'' + c.id + '\')" style="' +
          'padding:14px 18px;border:1.5px solid ' + (isActive ? 'var(--accent-blue)' : 'var(--border-color)') + ';border-radius:14px;cursor:pointer;' +
          'background:' + (isActive ? 'rgba(79,110,247,.06)' : 'var(--bg-tertiary)') + ';min-width:240px;flex:1;max-width:360px;transition:all .2s;position:relative">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">' +
          '<div style="font-size:15px;font-weight:800;color:' + (isActive ? 'var(--accent-blue)' : 'var(--text-primary)') + '">' + _esc(c.name) + '</div>' +
          '<div style="display:flex;gap:4px">' +
          '<button class="btn-icon-sm edit" onclick="event.stopPropagation();ACCT.openBudgetCatModal(\'' + c.id + '\')" title="수정"><i data-lucide="edit-3" class="icon-sm"></i></button>' +
          '<button class="btn-icon-sm delete" onclick="event.stopPropagation();ACCT.deleteBudgetCat(\'' + c.id + '\')" title="삭제"><i data-lucide="trash-2" class="icon-sm"></i></button>' +
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


        var BI_COL=['#4f6ef7','#22c55e','#f59e0b','#8b5cf6','#06b6d4','#ec4899','#f97316','#14b8a6','#ef4444'];
        var isMobItem=window.innerWidth<768;
        if(isMobItem){
          html+='<div style="display:flex;flex-direction:column;gap:10px">';
          filtered.forEach(function(b,idx){
            var spent=b.spent||0,remain=b.amount-spent,pct=b.amount>0?Math.round(spent/b.amount*100):0;
            var over=pct>100,color=over?'#ef4444':pct>80?'#f59e0b':'#22c55e',cc=BI_COL[idx%BI_COL.length];
            html+=
              '<div style="position:relative;border-radius:16px;overflow:hidden;background:var(--bg-card);border:1.5px solid var(--border-color);box-shadow:0 2px 10px rgba(0,0,0,.06);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)">'+
              '<div style="position:absolute;top:0;left:0;bottom:0;width:4px;background:'+cc+';border-radius:16px 0 0 16px"></div>'+
              '<div style="padding:13px 14px 11px 18px">'+
                '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px">'+
                  '<div style="font-size:15px;font-weight:900;color:var(--text-primary)">'+_esc(b.itemName||'-')+'</div>'+
                  (over?'<span style="font-size:10px;font-weight:800;padding:2px 7px;border-radius:20px;background:rgba(239,68,68,.12);color:#ef4444">\ucd08\uacfc \u26a0\ufe0f</span>':'')+
                '</div>'+
                '<div style="font-size:11.5px;color:'+cc+';font-weight:700;margin-bottom:10px">'+_esc(_acctName(b.accountCode))+' <span style="color:var(--text-muted);font-weight:400">'+b.accountCode+'</span></div>'+
                '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px">'+
                  '<div style="text-align:center"><div style="font-size:10px;font-weight:600;color:var(--text-muted);margin-bottom:2px">\uc608\uc0b0\uc561</div><div style="font-size:13px;font-weight:800;color:var(--text-primary)">'+_fmtW(b.amount)+'</div></div>'+
                  '<div style="text-align:center;border-left:1px solid var(--border-color);border-right:1px solid var(--border-color)"><div style="font-size:10px;font-weight:600;color:var(--text-muted);margin-bottom:2px">\uc9d1\ud589\uc561</div><div style="font-size:13px;font-weight:800;color:#ef4444">'+_fmtW(spent)+'</div></div>'+
                  '<div style="text-align:center"><div style="font-size:10px;font-weight:600;color:var(--text-muted);margin-bottom:2px">\uc794\uc561</div><div style="font-size:13px;font-weight:800;color:'+(remain<0?'#ef4444':'#22c55e')+'">'+_fmtW(remain)+'</div></div>'+
                '</div>'+
                '<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">'+
                  '<div style="flex:1;height:6px;border-radius:3px;background:var(--border-color);overflow:hidden">'+
                  '<div style="height:100%;width:'+Math.min(100,pct)+'%;background:'+color+';border-radius:3px;transition:width .5s"></div></div>'+
                  '<span style="font-size:11px;font-weight:800;color:'+color+';min-width:30px;text-align:right">'+pct+'%</span>'+
                '</div>'+
              '</div>'+
              '<div style="display:flex;border-top:1px solid var(--border-color)">'+
                '<button onclick="ACCT.openBudgetModal('+b.id+')" style="flex:1;height:38px;background:transparent;border:none;border-right:1px solid var(--border-color);font-size:12px;font-weight:700;color:var(--text-primary);cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:inherit;transition:background .15s">\uc218\uc815</button>'+
                '<button onclick="ACCT.deleteBudget('+b.id+')" style="flex:1;height:38px;background:transparent;border:none;font-size:12px;font-weight:700;color:#ef4444;cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:inherit;transition:background .15s">\uc0ad\uc81c</button>'+
              '</div></div>';
          });
          html+='</div>';
          var tp2=totalBudget>0?Math.round(totalSpent/totalBudget*100):0,tc2=tp2>100?'#ef4444':tp2>80?'#f59e0b':'#22c55e';
          html+='<div style="background:var(--bg-tertiary);border-radius:14px;padding:14px 16px;margin-top:4px;margin-bottom:80px">'+
            '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px;text-align:center">'+
              '<div><div style="font-size:10px;color:var(--text-muted);margin-bottom:2px">\ud569\uacc4 \uc608\uc0b0</div><div style="font-size:13px;font-weight:900;color:var(--text-primary)">'+_fmtW(totalBudget)+'</div></div>'+
              '<div style="border-left:1px solid var(--border-color);border-right:1px solid var(--border-color)"><div style="font-size:10px;color:var(--text-muted);margin-bottom:2px">\ud569\uacc4 \uc9d1\ud589</div><div style="font-size:13px;font-weight:900;color:#ef4444">'+_fmtW(totalSpent)+'</div></div>'+
              '<div><div style="font-size:10px;color:var(--text-muted);margin-bottom:2px">\uc794\uc5ec</div><div style="font-size:13px;font-weight:900;color:'+tc2+'">'+_fmtW(totalBudget-totalSpent)+'</div></div>'+
            '</div>'+
            '<div style="display:flex;align-items:center;gap:8px">'+
              '<div style="flex:1;height:8px;border-radius:4px;background:var(--border-color);overflow:hidden">'+
              '<div style="height:100%;width:'+Math.min(100,tp2)+'%;background:'+tc2+';border-radius:4px;transition:width .5s"></div></div>'+
              '<span style="font-size:12px;font-weight:900;color:'+tc2+'">'+tp2+'%</span>'+
            '</div></div>';
        }else{
          html+='<table class="acct-table"><thead><tr>'+
            '<th>\uc608\uc0b0\ubaa9</th><th>\uacc4\uc815\uacfc\ubaa9</th><th style="text-align:right">\uc608\uc0b0\uc561</th><th style="text-align:right">\uc9d1\ud589\uc561</th>'+
            '<th style="text-align:right">\uc794\uc561</th><th>\uc18c\uc9c4\uc728</th><th style="text-align:center;width:80px">\uad00\ub9ac</th>'+
            '</tr></thead><tbody>';
          filtered.forEach(function(b){
            var spent=b.spent||0,remain=b.amount-spent,pct=b.amount>0?Math.round(spent/b.amount*100):0;
            var over=pct>100,color=over?'#ef4444':pct>80?'#f59e0b':'#22c55e';
            html+='<tr>'+
              '<td><strong>'+_esc(b.itemName||'-')+'</strong></td>'+
              '<td>'+_esc(_acctName(b.accountCode))+' <span style="font-size:11px;color:var(--text-muted)">'+b.accountCode+'</span></td>'+
              '<td class="num">'+_fmtW(b.amount)+'</td><td class="num">'+_fmtW(spent)+'</td>'+
              '<td class="num" style="color:'+(remain<0?'#ef4444':'var(--text-primary)')+'">'+_fmtW(remain)+'</td>'+
              '<td><div class="acct-progress-track" style="width:100px;display:inline-block;vertical-align:middle;margin-right:8px"><div class="acct-progress-fill" style="width:'+Math.min(100,pct)+'%;background:'+color+'"></div></div>'+
              '<span style="font-weight:700;color:'+color+';font-size:12px">'+pct+'%</span>'+(over?' <span style="color:#ef4444;font-weight:800">\u26a0\ufe0f \ucd08\uacfc</span>':'')+
              '</td><td style="text-align:center">'+
              '<button class="btn-icon-sm edit" onclick="ACCT.openBudgetModal('+b.id+')" title="\uc218\uc815"><i data-lucide="edit-3" class="icon-sm"></i></button>'+
              '<button class="btn-icon-sm delete" onclick="ACCT.deleteBudget('+b.id+')" title="\uc0ad\uc81c"><i data-lucide="trash-2" class="icon-sm"></i></button>'+
              '</td></tr>';
          });
          var totalPct=totalBudget>0?Math.round(totalSpent/totalBudget*100):0;
          html+='<tr style="font-weight:800;background:var(--bg-tertiary)"><td colspan="2">\ud569\uacc4</td>'+
            '<td class="num">'+_fmtW(totalBudget)+'</td><td class="num">'+_fmtW(totalSpent)+'</td>'+
            '<td class="num">'+_fmtW(totalBudget-totalSpent)+'</td>'+
            '<td><span style="font-weight:800">'+totalPct+'%</span></td><td></td></tr>';
          html+='</tbody></table>';
        }

      }
      html += '</div>';
    }

    // 모달들
    html += _budgetModalHTML();
    html += _budgetCatModalHTML();

    el.innerHTML = '<div style="padding-bottom:80px">' + html + '</div>';
    _ri();
  }

  function selectBudgetCat(catId) {
    _selectedBudgetCatId = String(catId);
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
      var selYear = window._acctBudgetYear || new Date().getFullYear();
      if (fromEl) fromEl.value = selYear + '-01-01';
      if (toEl) toEl.value = selYear + '-12-31';
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
        var year = from ? parseInt(from.substring(0, 4)) : (c.year || new Date().getFullYear());
        return Object.assign({}, c, { name: name.trim(), bank: bank, periodFrom: from, periodTo: to, year: year });
      });
      _toast('info', '예산구분이 수정되었습니다');
    } else {
      var year = from ? parseInt(from.substring(0, 4)) : new Date().getFullYear();
      cats.push({ id: _uid(), name: name.trim(), bank: bank, periodFrom: from, periodTo: to, year: year });
      _toast('success', '"' + name + '" 예산구분이 추가되었습니다');
    }
    _ls('acct_budget_cats', cats);
    closeBudgetCatModal();
    _selectedBudgetCatId = cats[cats.length - 1].id;
    renderAcctBudget();
  }
  function deleteBudgetCat(id) {
    var sid = String(id);
    var cats = _budgetCats().filter(function (c) { return String(c.id) !== sid; });
    _ls('acct_budget_cats', cats);
    // 해당 구분의 예산도 삭제
    var budgets = _budgets().filter(function (b) { return String(b.catId) !== sid; });
    _ls('acct_budgets', budgets);
    if (String(_selectedBudgetCatId) === sid) _selectedBudgetCatId = cats.length > 0 ? cats[0].id : null;
    _toast('info', '예산구분이 삭제되었습니다');
    renderAcctBudget();
  }

  /* ── 예산 항목 CRUD 모달 ── */
  function _budgetModalHTML() {
    var accounts = _accounts().filter(function (a) { return a.type === 'expense'; });
    return '<div class="modal-overlay" id="budgetModal" style="display:none" onclick="if(event.target===this)ACCT.closeBudgetModal()">' +
      '<div class="modal-box" style="max-width:460px;overflow:visible">' +
      '<div class="modal-head"><div class="modal-title" id="budgetModalTitle">\uC608\uC0B0 \uCD94\uAC00</div><button class="modal-close" onclick="ACCT.closeBudgetModal()">\u2715</button></div>' +
      '<div class="modal-body" style="display:flex;flex-direction:column;gap:14px;overflow:visible">' +
      '<div class="form-group" style="position:relative">' +
      '<label class="form-label">\uC608\uC0B0\uBAA9 *</label>' +
      '<input class="form-input" id="bm_itemName" placeholder="\uC608) \uC778\uAC74\uBE44, \uC18C\uBAA8\uD488\uBE44, \uC678\uC8FC\uC6A9\uC5ED\uBE44" autocomplete="off"' +
      ' oninput="ACCT._acItemName(this.value)"' +
      ' onkeydown="ACCT._acItemKeydown(event)"' +
      ' onfocus="ACCT._acItemName(this.value)"' +
      ' onblur="setTimeout(function(){ACCT._acHide()},180)">' +
      '<div id="bm_itemName_ac" style="display:none;position:absolute;left:0;right:0;top:100%;z-index:999;' +
      'background:var(--bg-primary);border:1.5px solid var(--accent-blue);border-radius:10px;' +
      'box-shadow:0 8px 28px rgba(0,0,0,.18);max-height:220px;overflow-y:auto;margin-top:2px"></div>' +
      '</div>' +
      '<div class="form-group"><label class="form-label">\uACC4\uC815\uACFC\uBAA9 *</label>' +
      '<select class="form-input" id="bm_account">' +
      '<option value="">-- \uC120\uD0DD --</option>' +
      accounts.map(function (a) { return '<option value="' + a.code + '">' + a.code + ' ' + a.name + '</option>'; }).join('') +
      '</select></div>' +
      '<div class="form-group"><label class="form-label">\uC5F0\uAC04 \uC608\uC0B0\uC561 (\uC6D0) *</label>' +
      '<input class="form-input" id="bm_amount" type="text" placeholder="\uC608) 50,000,000" oninput="this.value = ACCT.fmtInput(this.value)" onkeydown="if(event.key===\'Enter\')ACCT.saveBudget()"></div>' +
      '<div class="form-group"><label class="form-label">\uBA54\uBAA8</label>' +
      '<input class="form-input" id="bm_memo" placeholder="\uC608\uC0B0 \uC124\uBA85"></div>' +
      '</div>' +
      '<div class="modal-foot"><button class="btn" onclick="ACCT.closeBudgetModal()">\uCDE8\uC18C</button>' +
      '<button class="btn btn-blue" onclick="ACCT.saveBudget()">\uC800\uC7A5</button></div>' +
      '</div></div>';
  }

  /* ── 예산목 자동완성 로직 ── */
  var _acHighlight = -1;

  function _acGetHistory() {
    /* 기존 예산 데이터에서 중복 제거된 예산목 목록 + 사용자정의 히스토리 */
    var budgets = _budgets();
    var hist = _ls('acct_itemName_history') || [];
    var nameSet = {};
    budgets.forEach(function (b) { if (b.itemName) nameSet[b.itemName] = true; });
    hist.forEach(function (n) { nameSet[n] = true; });
    return Object.keys(nameSet).sort();
  }

  function _acSaveToHistory(name) {
    if (!name) return;
    var hist = _ls('acct_itemName_history') || [];
    if (hist.indexOf(name) < 0) {
      hist.push(name);
      _ls('acct_itemName_history', hist);
    }
  }

  function _acItemName(query) {
    var dd = document.getElementById('bm_itemName_ac');
    if (!dd) return;
    var all = _acGetHistory();
    var q = (query || '').trim().toLowerCase();
    _acHighlight = -1;

    if (!q) { dd.style.display = 'none'; return; }

    var matches = all.filter(function (n) { return n.toLowerCase().indexOf(q) >= 0; });

    /* 정확 일치가 아닌 경우 "새로 추가" 옵션 표시 */
    var exactMatch = all.some(function (n) { return n.toLowerCase() === q; });

    if (matches.length === 0 && !query.trim()) { dd.style.display = 'none'; return; }

    var html = '';
    matches.forEach(function (name, i) {
      /* 하이라이트 처리 */
      var hl = name.replace(new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'),
        '<span style="color:var(--accent-blue);font-weight:800">$1</span>');
      html += '<div data-ac-idx="' + i + '" onmousedown="ACCT._acSelect(\'' + _esc(name).replace(/'/g, '\\\'') + '\')"' +
        ' style="padding:10px 14px;cursor:pointer;font-size:13px;color:var(--text-primary);' +
        'border-bottom:1px solid var(--border-color);transition:background .1s;display:flex;align-items:center;gap:8px"' +
        ' onmouseover="this.style.background=\'rgba(79,110,247,.06)\'"' +
        ' onmouseout="this.style.background=\'transparent\'">' +
        '<span style="font-size:14px">\uD83D\uDCCB</span> ' + hl + '</div>';
    });

    if (!exactMatch && query.trim()) {
      html += '<div onmousedown="ACCT._acSelect(\'' + _esc(query.trim()).replace(/'/g, '\\\'') + '\')"' +
        ' style="padding:10px 14px;cursor:pointer;font-size:13px;color:#22c55e;font-weight:700;' +
        'transition:background .1s;display:flex;align-items:center;gap:8px"' +
        ' onmouseover="this.style.background=\'rgba(34,197,94,.06)\'"' +
        ' onmouseout="this.style.background=\'transparent\'">' +
        '<span style="font-size:14px">\u2795</span> "' + _esc(query.trim()) + '" \uC0C8\uB85C \uCD94\uAC00</div>';
    }

    dd.innerHTML = html;
    dd.style.display = html ? 'block' : 'none';
  }

  function _acItemKeydown(e) {
    var dd = document.getElementById('bm_itemName_ac');
    if (!dd || dd.style.display === 'none') {
      if (e.key === 'Enter') { e.preventDefault(); return; }
      return;
    }
    var items = dd.querySelectorAll('[data-ac-idx], [onmousedown]');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      _acHighlight = Math.min(_acHighlight + 1, items.length - 1);
      _acHighlightUpdate(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      _acHighlight = Math.max(_acHighlight - 1, 0);
      _acHighlightUpdate(items);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (_acHighlight >= 0 && _acHighlight < items.length) {
        items[_acHighlight].dispatchEvent(new Event('mousedown'));
      } else {
        /* 현재 입력값으로 선택 */
        var inp = document.getElementById('bm_itemName');
        if (inp && inp.value.trim()) {
          _acSelect(inp.value.trim());
        }
      }
    } else if (e.key === 'Escape') {
      dd.style.display = 'none';
      _acHighlight = -1;
    }
  }

  function _acHighlightUpdate(items) {
    for (var i = 0; i < items.length; i++) {
      items[i].style.background = i === _acHighlight ? 'rgba(79,110,247,.1)' : 'transparent';
    }
    if (_acHighlight >= 0 && items[_acHighlight]) {
      items[_acHighlight].scrollIntoView({ block: 'nearest' });
    }
  }

  function _acSelect(value) {
    var inp = document.getElementById('bm_itemName');
    if (inp) inp.value = value;
    _acSaveToHistory(value);
    _acHide();
    /* 다음 필드로 포커스 이동 */
    var acctEl = document.getElementById('bm_account');
    if (acctEl) setTimeout(function () { acctEl.focus(); }, 50);
  }

  function _acHide() {
    var dd = document.getElementById('bm_itemName_ac');
    if (dd) dd.style.display = 'none';
    _acHighlight = -1;
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
        if (amtEl) amtEl.value = _fmtInput(b.amount);
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
    var rawAmt = (document.getElementById('bm_amount') || {}).value || '';
    var amt = parseInt(rawAmt.replace(/,/g, '')) || 0;
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
    _acSaveToHistory(itemName.trim());
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
    var approvals = _approvals().filter(function (a) { return _isInYear(a.date || a.createdAt); });
    var pendings = approvals.filter(function (a) { return a.status === 'pending'; });
    var approveds = approvals.filter(function (a) { return a.status === 'approved'; });
    var expenseds = approvals.filter(function (a) { return a.status === 'expensed'; });
    var vouchereds = approvals.filter(function (a) { return a.status === 'vouchered'; });
    var rejecteds = approvals.filter(function (a) { return a.status === 'rejected'; });

    var html = '' +
      '<div class="page-header"><div>' +
      '<div class="page-title">품의하기</div>' +
      '<div class="page-subtitle">지출 품의를 등록하고 결재 상태를 관리합니다</div>' +
      '</div>' +
      '<button class="btn btn-blue" onclick="ACCT.openApprovalModal()"><i data-lucide="plus" style="width:14px;height:14px"></i> 품의 등록</button>' +
      '</div>' +

      // 탭 (3단계: 승인→지출→전표)
      '<div class="acct-tab-bar">' +
      '<button class="acct-tab active" onclick="ACCT.switchApprovalTab(\'pending\',this)">대기 <span class="acct-tab-count">' + pendings.length + '</span></button>' +
      '<button class="acct-tab" onclick="ACCT.switchApprovalTab(\'approved\',this)">승인 <span class="acct-tab-count">' + approveds.length + '</span></button>' +
      '<button class="acct-tab" onclick="ACCT.switchApprovalTab(\'expensed\',this)">지출 <span class="acct-tab-count">' + expenseds.length + '</span></button>' +
      '<button class="acct-tab" onclick="ACCT.switchApprovalTab(\'vouchered\',this)">전표 <span class="acct-tab-count">' + vouchereds.length + '</span></button>' +
      '<button class="acct-tab" onclick="ACCT.switchApprovalTab(\'rejected\',this)">반려 <span class="acct-tab-count">' + rejecteds.length + '</span></button>' +
      '</div>' +

      '<div id="approvalListWrap">' + _approvalList(pendings, 'pending') + '</div>';

    // 품의 등록 모달
    html += _approvalModalHTML();
    html += _approveConfirmModalHTML();

    el.innerHTML = '<div style="padding-bottom:80px">' + html + '</div>';
    _ri();
  }

  function _approvalList(list, status) {
    if (list.length === 0) {
      var _titleMap = { pending: '대기 품의리스트', approved: '승인완료 품의리스트', expensed: '지출완료 품의리스트', vouchered: '지출결의 품의리스트', rejected: '반려완료 품의리스트' };
      var _emptyMap = { pending: '대기 중인 품의가 없습니다', approved: '승인 완료된 품의가 없습니다', expensed: '지출 완료된 품의가 없습니다', vouchered: '지출결의 완료된 품의가 없습니다', rejected: '반려된 품의가 없습니다' };
      return '<div class="acct-card"><div class="acct-card-head"><i data-lucide="clipboard-list" style="width:16px;height:16px"></i> ' + (_titleMap[status] || '품의리스트') + '</div><div class="acct-empty"><i data-lucide="inbox" style="width:36px;height:36px;opacity:.3;display:block;margin:0 auto 10px"></i>' + (_emptyMap[status] || '품의가 없습니다') + '</div></div>';
    }

    var _titleMap2 = { pending: '대기 품의리스트', approved: '승인완료 품의리스트', expensed: '지출완료 품의리스트', vouchered: '지출결의 품의리스트', rejected: '반려완료 품의리스트' };
    var html = '<div class="acct-card"><div class="acct-card-head"><i data-lucide="clipboard-list" style="width:16px;height:16px"></i> ' + (_titleMap2[status] || '품의리스트') + ' <span style="color:var(--text-muted);font-weight:400;font-size:12px">(' + list.length + '건)</span></div><table class="acct-table"><thead><tr>' +
      '<th>등록일</th><th>품의명</th><th>계정과목</th><th style="text-align:right">금액</th><th>신청자</th><th>승인자</th><th>상태</th><th style="text-align:center;width:100px">관리</th>' +
      '</tr></thead><tbody>';

    list.forEach(function (a) {
      var badge = a.status === 'pending' ? '<span class="acct-badge pending">대기</span>'
        : a.status === 'approved' ? '<span class="acct-badge approved">승인</span>'
        : a.status === 'expensed' ? '<span class="acct-badge" style="background:rgba(245,158,11,.1);color:#f59e0b;border-color:rgba(245,158,11,.3)">지출</span>'
        : a.status === 'vouchered' ? '<span class="acct-badge" style="background:rgba(139,92,246,.1);color:#8b5cf6;border-color:rgba(139,92,246,.3)">전표</span>'
          : '<span class="acct-badge rejected">반려</span>';
      var _cu = (typeof WS !== 'undefined') ? WS.currentUser : null;
      var _isCuApprover = _cu && _cu.approverType === 'approver';
      var actions = '';
      var printBtn = '<button class="btn-icon-sm" onclick="ACCT.printApproval(' + JSON.stringify(a.id) + ')" title="출력" style="color:var(--text-muted)"><i data-lucide="printer" class="icon-sm"></i></button>';
      if (a.status === 'pending') {
        if (_isCuApprover) {
          actions = '<button class="btn-icon-sm edit" onclick="ACCT.openApproveConfirm(' + JSON.stringify(a.id) + ')" title="승인" style="color:#22c55e"><i data-lucide="check-circle" class="icon-sm"></i></button>' +
            '<button class="btn-icon-sm delete" onclick="ACCT.rejectItem(' + JSON.stringify(a.id) + ')" title="반려"><i data-lucide="x" class="icon-sm"></i></button>' + printBtn;
        } else {
          actions = '<button class="btn-icon-sm edit" onclick="ACCT.openApprovalEditModal(' + JSON.stringify(a.id) + ')" title="수정" style="color:var(--text-secondary)"><i data-lucide="edit-3" class="icon-sm"></i></button>' +
            '<button class="btn-icon-sm delete" onclick="ACCT.deleteApproval(' + JSON.stringify(a.id) + ')" title="삭제"><i data-lucide="trash-2" class="icon-sm"></i></button>' + printBtn;
        }
      } else if (a.status === 'rejected') {
        actions = '<button class="btn-icon-sm edit" onclick="ACCT.resubmitApproval(' + JSON.stringify(a.id) + ')" title="재품의" style="color:var(--accent-blue)"><i data-lucide="refresh-cw" class="icon-sm"></i></button>' +
          '<button class="btn-icon-sm delete" onclick="ACCT.deleteApproval(' + JSON.stringify(a.id) + ')" title="삭제"><i data-lucide="trash-2" class="icon-sm"></i></button>' + printBtn;
      } else if (a.status === 'expensed' || a.status === 'vouchered') {
        var evidBtn = '<button class="btn-icon-sm" onclick="ACCT.openEvidenceFromApproval(' + JSON.stringify(a.id) + ')" title="증빙등록" style="color:var(--accent-blue)"><i data-lucide="paperclip" class="icon-sm"></i></button>';
        actions = evidBtn + printBtn;
      } else {
        actions = printBtn;
      }
      html += '<tr>' +
        '<td>' + (a.date || '') + '</td>' +
        '<td><strong>' + _esc(a.title) + '</strong></td>' +
        '<td>' + _acctName(a.accountCode) + '</td>' +
        '<td class="num">' + _fmtW(a.amount) + '</td>' +
        '<td>' + _esc(a.requesterName || '') + '</td>' +
        '<td>' + (a.approverName
          ? '<span style="display:inline-flex;align-items:center;gap:4px;font-size:11.5px;font-weight:700;' +
            'color:var(--accent-blue);background:rgba(79,110,247,.08);border:1px solid rgba(79,110,247,.2);' +
            'border-radius:20px;padding:2px 8px">' +
            '<i data-lucide="user-check" style="width:11px;height:11px"></i>' + _esc(a.approverName) + '</span>'
          : '<span style="color:var(--text-muted);font-size:12px">-</span>') + '</td>' +
        '<td>' + badge + '</td>' +
        '<td style="text-align:center"><div style="display:inline-flex;align-items:center;gap:2px">' + actions + '</div></td>' +
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

    // 모든 직원을 대상으로: 승인자(⚡) 먹저, 그 에 품의자 순으로 나열
    var ranks = (typeof WS !== 'undefined' && Array.isArray(WS.ranks)) ? WS.ranks : [];
    var allUsers = (typeof WS !== 'undefined' && Array.isArray(WS.users)) ? WS.users : [];

    function _rankLevel(u) {
      var r = ranks.find(function (x) { return x.name === u.role; });
      return r ? (r.level || 0) : 0;
    }

    var approverUsers = allUsers
      .filter(function (u) { return u.approverType === 'approver'; })
      .slice().sort(function (a, b) { return _rankLevel(b) - _rankLevel(a); });

    var requesterUsers = allUsers
      .filter(function (u) { return u.approverType !== 'approver'; })
      .slice().sort(function (a, b) { return _rankLevel(b) - _rankLevel(a); });

    var approverOpts = '';
    if (approverUsers.length === 0 && requesterUsers.length === 0) {
      approverOpts = '<option value="">등록된 직원이 없습니다</option>';
    } else {
      if (approverUsers.length > 0) {
        approverOpts += '<optgroup label="⚡ 승인자 (결재 기능자)">';
        approverUsers.forEach(function (u, i) {
          approverOpts += '<option value="' + u.id + '"' + (i === 0 ? ' selected' : '') + '>'
            + _esc(u.name) + ' (' + _esc(u.dept || '') + ' · ' + _esc(u.role || '') + ')</option>';
        });
        approverOpts += '</optgroup>';
      }
      if (requesterUsers.length > 0) {
        approverOpts += '<optgroup label="──── 일반 직원 ────">';
        requesterUsers.forEach(function (u) {
          approverOpts += '<option value="' + u.id + '">'
            + _esc(u.name) + ' (' + _esc(u.dept || '') + ' · ' + _esc(u.role || '') + ')</option>';
        });
        approverOpts += '</optgroup>';
      }
    }


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
      '<input class="form-input" id="am_amount" type="text" placeholder="0" oninput="this.value = ACCT.fmtInput(this.value)"></div></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
      '<div class="form-group" style="margin:0"><label class="form-label">신청자</label>' +
      '<input class="form-input" id="am_requester" value="' + _esc(userName) + '" readonly style="background:var(--bg-tertiary);cursor:default;color:var(--text-secondary)"></div>' +
      '<div class="form-group" style="margin:0"><label class="form-label">승인자 *</label>' +
      '<select class="form-input" id="am_approver">' + approverOpts + '</select></div></div>' +
      '<div class="form-group"><label class="form-label">사유/메모</label>' +
      '<textarea class="form-input" id="am_memo" rows="2" placeholder="품의 사유를 입력하세요"></textarea></div>' +
      '</div>' +
      '<div class="modal-foot"><button class="btn" onclick="ACCT.closeApprovalModal()">취소</button>' +
      '<button class="btn btn-blue" onclick="ACCT.submitApproval()">제출</button></div>' +
      '</div></div>';
  }

  var _editApprovalId = null;

  function openApprovalModal() {
    _editApprovalId = null;
    var m = document.getElementById('approvalModal');
    ['am_title', 'am_amount', 'am_memo'].forEach(function (id) {
      var e = document.getElementById(id); if (e) e.value = '';
    });
    var sel = document.getElementById('am_account'); if (sel) sel.value = '';
    var apvSel = document.getElementById('am_approver'); if (apvSel) apvSel.value = '';
    // 예산구분/예산목 초기화
    var catSel = document.getElementById('am_budget_cat'); if (catSel) catSel.value = '';
    var itemSel = document.getElementById('am_budget_item');
    if (itemSel) itemSel.innerHTML = '<option value="">예산구분 먼저 선택</option>';
    var rw = document.getElementById('am_budget_remain_wrap'); if (rw) rw.style.display = 'none';
    var titleEl = document.querySelector('#approvalModal .modal-title');
    if (titleEl) titleEl.textContent = '품의 등록';
    var btnEl = document.querySelector('#approvalModal .btn-blue');
    if (btnEl) btnEl.textContent = '제출';
    if (m) m.style.display = 'flex';
  }

  function openApprovalEditModal(id) {
    var item = _approvals().find(function (a) { return a.id === id; });
    if (!item) return;
    _editApprovalId = id;
    var m = document.getElementById('approvalModal');
    var te = document.getElementById('am_title'); if (te) te.value = item.title || '';
    var ae = document.getElementById('am_account'); if (ae) ae.value = item.accountCode || '';
    var ame = document.getElementById('am_amount');
    if (ame) ame.value = (item.amount || 0).toLocaleString();
    var mme = document.getElementById('am_memo'); if (mme) mme.value = item.memo || '';
    var apv = document.getElementById('am_approver'); if (apv) apv.value = item.approverId || '';
    var catSel = document.getElementById('am_budget_cat'); if (catSel) catSel.value = '';
    var itemSel = document.getElementById('am_budget_item');
    if (itemSel) itemSel.innerHTML = '<option value="">예산구분 먼저 선택</option>';
    var rw = document.getElementById('am_budget_remain_wrap'); if (rw) rw.style.display = 'none';
    var titleEl = document.querySelector('#approvalModal .modal-title');
    if (titleEl) titleEl.textContent = '품의 수정';
    var btnEl = document.querySelector('#approvalModal .btn-blue');
    if (btnEl) btnEl.textContent = '저장';
    if (m) m.style.display = 'flex';
  }

  // 예산구분 변경 → 예산목 업데이트
  function onAmBudgetCatChange() {
    var catId = (document.getElementById('am_budget_cat') || {}).value || '';
    var itemSel = document.getElementById('am_budget_item');
    var rw = document.getElementById('am_budget_remain_wrap');
    if (rw) rw.style.display = 'none';
    if (!itemSel) return;
    if (!catId) {
      itemSel.innerHTML = '<option value="">예산구분 먼저 선택</option>';
      return;
    }
    var buds = _budgets().filter(function (b) { return String(b.catId) === String(catId) || String(b.catId) === String(catId); });
    if (buds.length === 0) {
      itemSel.innerHTML = '<option value="">해당 구분의 예산목이 없습니다</option>';
      return;
    }
    var html = '<option value="">-- 예산목 선택 --</option>';
    buds.forEach(function (b) {
      var remain = (b.amount || 0) - (b.spent || 0);
      html += '<option value="' + b.id + '">' + _esc(b.name || _acctName(b.accountCode)) + ' (잔액 ' + _fmtW(remain) + ')</option>';
    });
    itemSel.innerHTML = html;
  }

  // 예산목 선택 → 계정과목 자동 + 남은예산 표시
  function onAmBudgetItemChange() {
    var budgetId = (document.getElementById('am_budget_item') || {}).value || '';
    var rw = document.getElementById('am_budget_remain_wrap');
    if (!budgetId) { if (rw) rw.style.display = 'none'; return; }
    var budget = _budgets().find(function (b) { return String(b.id) === String(budgetId); });
    if (!budget) { if (rw) rw.style.display = 'none'; return; }
    var acctSel = document.getElementById('am_account');
    if (acctSel) acctSel.value = budget.accountCode || '';
    var remain = (budget.amount || 0) - (budget.spent || 0);
    var pct = budget.amount > 0 ? Math.round((budget.spent || 0) / budget.amount * 100) : 0;
    var remEl = document.getElementById('am_budget_remain');
    var pctEl = document.getElementById('am_budget_pct');
    if (remEl) {
      remEl.textContent = _fmtW(remain);
      remEl.style.color = remain < 0 ? '#ef4444' : (remain < budget.amount * 0.1 ? '#f59e0b' : '#22c55e');
    }
    if (pctEl) pctEl.textContent = '사용 ' + pct + '%';
    if (rw) rw.style.display = 'flex';
  }

  function closeApprovalModal() {
    var m = document.getElementById('approvalModal'); if (m) m.style.display = 'none';
  }

  function submitApproval() {
    var _isEdit = !!_editApprovalId;
    var title = (document.getElementById('am_title') || {}).value || '';
    var code = (document.getElementById('am_account') || {}).value || '';
    var rawAmt = (document.getElementById('am_amount') || {}).value || '';
    var amt = parseInt(rawAmt.replace(/,/g, '')) || 0;
    var requester = (document.getElementById('am_requester') || {}).value || '';
    var memo = (document.getElementById('am_memo') || {}).value || '';
    var approverSel = document.getElementById('am_approver');
    var approverId = approverSel ? approverSel.value : '';
    var approverName = approverSel && approverSel.options[approverSel.selectedIndex]
      ? approverSel.options[approverSel.selectedIndex].text : '';
    if (!title.trim()) { _toast('error', '품의명을 입력하세요'); return; }
    if (!code) { _toast('error', '계정과목을 선택하세요'); return; }
    if (amt <= 0) { _toast('error', '금액을 입력하세요'); return; }
    if (!approverId) { _toast('error', '승인자를 선택하세요'); return; }

    // 예산 초과 체크
    var budget = _budgets().find(function (b) { return b.accountCode === code; });
    if (budget) {
      var afterSpent = (budget.spent || 0) + amt;
      if (afterSpent > budget.amount) {
        _toast('warning', '⚠️ ' + _acctName(code) + ' 예산 초과 예정! (현재 ' + Math.round((budget.spent || 0) / budget.amount * 100) + '% → ' + Math.round(afterSpent / budget.amount * 100) + '%)');
      }
    }

    var approvals = _approvals();
    if (_isEdit) {
      var editItem = approvals.find(function (a) { return a.id === _editApprovalId; });
      if (editItem) {
        editItem.title = title.trim();
        editItem.accountCode = code;
        editItem.amount = amt;
        editItem.memo = memo;
        editItem.approverId = approverId || null;
        editItem.approverName = approverName || '';
        _ls('acct_approvals', approvals);
        closeApprovalModal();
        _toast('success', '품의가 수정되었습니다');
        renderAcctApproval();
        return;
      }
    }
    approvals.push({
      id: _uid(), date: _today(), title: title.trim(), accountCode: code,
      amount: amt, requesterId: (typeof WS !== 'undefined' && WS.currentUser) ? WS.currentUser.id : null,
      requesterName: requester, approverId: approverId || null, approverName: approverName || '',
      status: 'pending', memo: memo,
      createdAt: _now(), approvedAt: null, voucherId: null
    });
    _ls('acct_approvals', approvals);
    closeApprovalModal();
    _toast('success', '"' + title + '" 품의가 ' + approverName + ' 님께 요청되었습니다');
    renderAcctApproval();
  }

  var _approvingId = null;

  function openApproveConfirm(id) {
    var item = _approvals().find(function (a) { return a.id === id; });
    if (!item) return;
    _approvingId = id;
    var infoEl = document.getElementById('apc_info');
    if (infoEl) {
      infoEl.innerHTML =
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px">' +
        '<div><span style="color:var(--text-muted);font-size:11px">품의명</span><br><strong>' + _esc(item.title) + '</strong></div>' +
        '<div><span style="color:var(--text-muted);font-size:11px">신청자</span><br>' + _esc(item.requesterName || '') + '</div>' +
        '<div><span style="color:var(--text-muted);font-size:11px">금액</span><br><strong style="color:var(--accent-blue)">' + _fmtW(item.amount) + '</strong></div>' +
        '<div><span style="color:var(--text-muted);font-size:11px">등록일</span><br>' + (item.date || '') + '</div>' +
        '</div>';
    }
    var acctSel = document.getElementById('apc_account');
    if (acctSel) acctSel.value = item.accountCode || '';
    var catSel = document.getElementById('apc_budget_cat'); if (catSel) catSel.value = '';
    var itemSel = document.getElementById('apc_budget_item');
    if (itemSel) itemSel.innerHTML = '<option value="">예산구분 먼저 선택</option>';
    var rw = document.getElementById('apc_remain_wrap'); if (rw) rw.style.display = 'none';
    var pw = document.getElementById('apc_password'); if (pw) pw.value = '';
    var m = document.getElementById('approveConfirmModal'); if (m) m.style.display = 'flex';
    if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 50);
  }

  function closeApproveConfirm() {
    var m = document.getElementById('approveConfirmModal'); if (m) m.style.display = 'none';
    _approvingId = null;
  }

  function onApvBudgetCatChange() {
    var catId = (document.getElementById('apc_budget_cat') || {}).value || '';
    var itemSel = document.getElementById('apc_budget_item');
    var rw = document.getElementById('apc_remain_wrap');
    if (rw) rw.style.display = 'none';
    if (!itemSel) return;
    if (!catId) { itemSel.innerHTML = '<option value="">예산구분 먼저 선택</option>'; return; }
    var buds = _budgets().filter(function (b) { return String(b.catId) === String(catId); });
    if (!buds.length) { itemSel.innerHTML = '<option value="">해당 구분의 예산목이 없습니다</option>'; return; }
    var html = '<option value="">-- 예산목 선택 --</option>';
    buds.forEach(function (b) {
      var remain = (b.amount || 0) - (b.spent || 0);
      html += '<option value="' + b.id + '">' + _esc(b.name || _acctName(b.accountCode)) + ' (잔액 ' + _fmtW(remain) + ')</option>';
    });
    itemSel.innerHTML = html;
  }

  function onApvBudgetItemChange() {
    var budgetId = (document.getElementById('apc_budget_item') || {}).value || '';
    var rw = document.getElementById('apc_remain_wrap');
    if (!budgetId) { if (rw) rw.style.display = 'none'; return; }
    var budget = _budgets().find(function (b) { return String(b.id) === String(budgetId); });
    if (!budget) { if (rw) rw.style.display = 'none'; return; }
    var acctSel = document.getElementById('apc_account');
    if (acctSel) acctSel.value = budget.accountCode || '';
    var remain = (budget.amount || 0) - (budget.spent || 0);
    var pct = budget.amount > 0 ? Math.round((budget.spent || 0) / budget.amount * 100) : 0;
    var remEl = document.getElementById('apc_remain_val');
    var pctEl = document.getElementById('apc_remain_pct');
    if (remEl) { remEl.textContent = _fmtW(remain); remEl.style.color = remain < 0 ? '#ef4444' : (remain < budget.amount * 0.1 ? '#f59e0b' : '#22c55e'); }
    if (pctEl) pctEl.textContent = '사용 ' + pct + '%';
    if (rw) rw.style.display = 'flex';
  }

  function confirmApprove() {
    if (!_approvingId) return;
    var pw = (document.getElementById('apc_password') || {}).value || '';
    var code = (document.getElementById('apc_account') || {}).value || '';
    if (!pw) { _toast('error', '패스워드를 입력하세요'); return; }
    if (!code) { _toast('error', '계정과목을 선택하세요'); return; }
    var cu = (typeof WS !== 'undefined') ? WS.currentUser : null;
    if (!cu || cu.password !== pw) { _toast('error', '패스워드가 일치하지 않습니다'); return; }
    var approvals = _approvals();
    var item = approvals.find(function (a) { return a.id === _approvingId; });
    if (!item) return;
    item.accountCode = code;
    item.status = 'approved';
    item.approvedAt = _now();
    item.approvedBy = cu.name;
    _ls('acct_approvals', approvals);
    closeApproveConfirm();
    _toast('success', '"' + item.title + '" 승인 완료. 지출하기에서 지출 등록해주세요');
    renderAcctApproval();
  }

  function openEvidenceFromApproval(approvalId) {
    // 품의와 연결된 전표 찾기
    var vouchers = _vouchers();
    var v = vouchers.find(function (x) { return x.sourceType === 'approval' && x.sourceId === approvalId; });
    if (!v) {
      // cashflow를 통한 연결
      var apv = _approvals().find(function (a) { return a.id === approvalId; });
      if (apv && apv.cashflowId) {
        v = vouchers.find(function (x) { return x.sourceType === 'cashflow' && x.sourceId === apv.cashflowId; });
      }
    }
    if (v) {
      // 모달이 DOM에 없으면 동적 삽입
      if (!document.getElementById('wdDetailModal')) {
        var wrap = document.createElement('div');
        wrap.innerHTML = _withdrawalDetailModalHTML();
        document.body.appendChild(wrap.firstChild);
        _ri();
      }
      openWithdrawalDetail(v.id);
    } else {
      _toast('info', '연결된 출금전표가 없습니다. 출금전표 목록에서 직접 등록해주세요');
    }
  }

    function printApproval(id) {
    var a = _approvals().find(function (x) { return x.id === id; });
    if (!a) return;
    var debitName = a.accountCode ? _acctName(a.accountCode) : '-';
    var expDate = a.expensedAt || a.approvedAt || a.date || '';
    var approveDate = a.approvedAt || '';
    var docNo = a.id ? String(a.id).replace(/\D/g, '').slice(-6) : '-';

    var reqSeal = '', appSeal = '';
    if (typeof WS !== 'undefined' && WS.users) {
      var reqUser = a.requesterId ? WS.users.find(function(u){ return u.id === a.requesterId; }) : null;
      var appUser = a.approverId ? WS.users.find(function(u){ return u.id === a.approverId; }) : null;
      // approverId로 못 찾으면 approvedBy(이름)로 재검색
      if (!appUser && a.approvedBy) {
        appUser = WS.users.find(function(u){ return u.name === a.approvedBy; }) || null;
      }
      // 그래도 못 찾으면 approverName에서 이름 추출하여 검색
      if (!appUser && a.approverName) {
        var _n = a.approverName.indexOf('(') > 0 ? a.approverName.substring(0, a.approverName.indexOf('(')).trim() : a.approverName.trim();
        appUser = WS.users.find(function(u){ return u.name === _n; }) || null;
      }
      if (reqUser && reqUser.sealImage) reqSeal = reqUser.sealImage;
      if (appUser && appUser.sealImage) appSeal = appUser.sealImage;
    }
    // 결재 완료 여부
    var isApproved = a.status === 'approved' || a.status === 'expensed' || a.status === 'vouchered';

    // 신청자 스탬프
    var reqStampHtml = reqSeal
      ? '<img src="' + reqSeal + '" style="max-width:58px;max-height:52px;object-fit:contain">'
      : '<span style="font-size:11px;color:#999">' + _esc(a.requesterName || '-') + '</span>';

    // 결재자 스탬프
    var appStampHtml = '';
    if (a.approverId || a.approverName || a.approvedBy) {
      var _appU = appUser || null;
      if (!_appU && a.approvedBy && typeof WS !== 'undefined' && WS.users) {
        _appU = WS.users.find(function(u){ return u.name === a.approvedBy; }) || null;
      }
      var _appName = '', _appDept = '', _appRole = '';
      if (_appU) {
        _appName = _appU.name || '';
        _appDept = _appU.dept || '';
        _appRole = _appU.role || '';
      } else if (a.approverName) {
        var _raw = a.approverName;
        var _pi = _raw.indexOf('(');
        if (_pi > 0) {
          _appName = _raw.substring(0, _pi).trim();
          var _inner = _raw.substring(_pi + 1).replace(')', '').trim();
          var _parts = _inner.split(/[·,]/);
          if (_parts.length >= 1) _appDept = _parts[0].trim();
          if (_parts.length >= 2) _appRole = _parts[1].trim();
        } else {
          _appName = _raw.trim();
        }
      }

      if (isApproved && appSeal) {
        // 승인 후 + 도장 있음 → 도장 이미지
        appStampHtml = '<img src="' + appSeal + '" style="max-width:58px;max-height:52px;object-fit:contain">';
      } else if (isApproved) {
        // 승인 후 + 도장 없음 → 이름을 진하게
        appStampHtml = '<div style="display:flex;flex-direction:column;align-items:center;gap:2px;line-height:1.3;padding:2px 0">' +
          '<span style="font-size:11px;color:#333;font-weight:700">' + _esc(_appName) + '</span>' +
          (_appDept ? '<span style="font-size:9px;color:#666">' + _esc(_appDept) + '</span>' : '') +
          (_appRole ? '<span style="font-size:9px;color:#666">' + _esc(_appRole) + '</span>' : '') +
          '</div>';
      } else {
        // 대기 중 → 흐린 색으로
        appStampHtml = '<div style="display:flex;flex-direction:column;align-items:center;gap:2px;line-height:1.3;padding:2px 0">' +
          '<span style="font-size:11px;color:#bbb;font-weight:600">' + _esc(_appName) + '</span>' +
          (_appDept ? '<span style="font-size:9px;color:#ccc">' + _esc(_appDept) + '</span>' : '') +
          (_appRole ? '<span style="font-size:9px;color:#ccc">' + _esc(_appRole) + '</span>' : '') +
          '</div>';
      }
    }

    var old = document.getElementById('printPreviewOverlay');
    if (old) old.remove();

    var overlay = document.createElement('div');
    overlay.id = 'printPreviewOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:20px';
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };

    var modal = document.createElement('div');
    modal.style.cssText = 'background:#fff;border-radius:14px;width:740px;max-height:95vh;overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,.25);position:relative';

    var _toolbarTitle = (a.status === 'pending' || a.status === 'approved') ? '\uD488\uC758\uC11C \uBBF8\uB9AC\uBCF4\uAE30' : '\uC9C0\uCD9C\uACB0\uC758\uC11C \uBBF8\uB9AC\uBCF4\uAE30';
    var toolbar = document.createElement('div');
    toolbar.style.cssText = 'position:sticky;top:0;z-index:10;display:flex;align-items:center;justify-content:space-between;padding:12px 20px;background:#f8fafc;border-bottom:1px solid #e2e8f0;border-radius:14px 14px 0 0';
    toolbar.innerHTML = '<div style="display:flex;align-items:center;gap:8px"><i data-lucide="file-text" style="width:16px;height:16px;color:#4f6ef7"></i><span style="font-size:14px;font-weight:700;color:#1a1a2e">' + _toolbarTitle + '</span></div>' +
      '<div style="display:flex;gap:8px">' +
      '<button id="printPreviewPrintBtn" style="display:flex;align-items:center;gap:6px;padding:8px 16px;border-radius:8px;border:none;background:#4f6ef7;color:#fff;font-size:12.5px;font-weight:700;cursor:pointer"><i data-lucide="printer" style="width:14px;height:14px"></i>\uCD9C\uB825</button>' +
      '<button id="printPreviewCloseBtn" style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;cursor:pointer;font-size:16px;color:#64748b">&times;</button></div>';

    // A4 본문 (높이를 A4 비율에 맞춤: 660 * 1.414 ≈ 933px)
    var content = document.createElement('div');
    content.id = 'printPreviewContent';
    content.style.cssText = 'width:660px;height:933px;margin:20px auto;padding:40px 24px 0;font-family:"Malgun Gothic",sans-serif;font-size:13px;color:#1a1a2e;background:#fff;position:relative;display:flex;flex-direction:column';

    var lbl = 'border:1px solid #b0c4de;background:#eaf0f8;font-weight:700;width:80px;color:#3a5a8a;text-align:center;padding:8px 6px;font-size:12px;white-space:nowrap;letter-spacing:3px;text-indent:3px';
    var val = 'border:1px solid #b0c4de;padding:8px 12px;font-size:13px;white-space:nowrap';
    // 결재 칸 동일 가로 사이즈
    var signTh = 'border:1px solid #b0c4de;background:#eaf0f8;font-size:11px;font-weight:700;width:76px;height:24px;color:#3a5a8a;text-align:center;padding:0';
    var signTd = 'border:1px solid #b0c4de;width:76px;height:58px;text-align:center;vertical-align:middle;padding:4px';

    var _docTitle = (a.status === 'pending' || a.status === 'approved')
      ? '\uD488 \uC758 \uC11C'
      : '\uC9C0 \uCD9C \uACB0 \uC758 \uC11C';

    content.innerHTML =
      /* 상단: 제목 + 결재란 (결재란 10px 아래, 제목은 결재란 세로 중앙) */
      '<div style="display:flex;align-items:stretch;margin-bottom:6px;flex-shrink:0">' +
        /* 제목 영역 - 결재란과 세로 중앙 정렬 */
        '<div style="flex:1;display:flex;align-items:center;justify-content:center;margin-top:10px">' +
          '<div style="font-size:26px;font-weight:800;letter-spacing:8px;color:#1a1a2e">' + _docTitle + '</div>' +
        '</div>' +
        /* 결재란 - 10px 아래로 */
        '<table style="border-collapse:collapse;flex-shrink:0;margin-top:10px">' +
          '<tr><th style="' + signTh + '">\uB2F4 &nbsp; \uB2F9</th>' +
          '<th style="' + signTh + '">\uC0C1\uC784\uC774\uC0AC</th></tr>' +
          '<tr><td style="' + signTd + '">' + reqStampHtml + '</td>' +
          '<td style="' + signTd + '">' + appStampHtml + '</td></tr>' +
        '</table>' +
      '</div>' +

      /* 문서번호 */
      '<div style="font-size:11px;color:#555;margin-bottom:3px;flex-shrink:0">\uBB38\uC11C\uBC88\uD638 : ' + docNo + '</div>' +

      /* 본문 테이블 */
      '<table style="width:100%;border-collapse:collapse;flex-shrink:0;table-layout:fixed">' +
        '<colgroup><col style="width:15%"><col style="width:35%"><col style="width:15%"><col style="width:35%"></colgroup>' +
        '<tr><td style="' + lbl + '">\uD488\uC758\uC77C\uC790</td><td style="' + val + '">' + (a.date || '-') + '</td>' +
            '<td style="' + lbl + '">\uACC4\uC815\uACFC\uBAA9</td><td style="' + val + '">' + debitName + '</td></tr>' +
        '<tr><td style="' + lbl + '">\uC9C0\uCD9C\uC77C\uC790</td><td style="' + val + '">' + (expDate || '-') + '</td>' +
            '<td style="' + lbl + '">\uC99D\uBE59\uAD6C\uBD84</td><td style="' + val + '">' + (a.evidenceType || '-') + '</td></tr>' +
        '<tr><td style="' + lbl + '">\uACB0\uC7AC\uC77C\uC790</td><td style="' + val + '">' + (approveDate || '-') + '</td>' +
            '<td style="' + lbl + ';letter-spacing:10px;text-indent:10px">\uAC70\uB798\uCC98</td><td style="' + val + '">' + _esc(a.vendor || a.counter || '-') + '</td></tr>' +
        '<tr><td style="' + lbl + ';letter-spacing:10px;text-indent:10px">\uBB3C\uD488\uBA85</td><td style="' + val + '">' + _esc(a.title || '-') + '</td>' +
            '<td style="' + lbl + ';letter-spacing:10px;text-indent:10px">\uC6A9&emsp;\uB3C4</td><td style="' + val + '">' + _esc(a.usage || debitName) + '</td></tr>' +
      '</table>' +

      /* 지출금액 (아래 테두리 없음) */
      '<div style="border:1px solid #b0c4de;border-top:none;border-bottom:none;padding:14px 16px;display:flex;align-items:center;gap:12px;flex-shrink:0">' +
        '<span style="background:#eaf0f8;padding:5px 14px;font-weight:700;color:#3a5a8a;border-radius:4px;letter-spacing:3px;font-size:12px;white-space:nowrap">\uC9C0\uCD9C\uAE08\uC561</span>' +
        '<span style="font-size:17px;font-weight:800"><span style="font-size:19px;font-weight:900;margin-right:3px">\u20A9</span>' + (a.amount || 0).toLocaleString() + '</span>' +
      '</div>' +

      /* 요청 문구 */
      '<div style="border-left:1px solid #b0c4de;border-right:1px solid #b0c4de;text-align:center;padding:8px 0 18px;font-size:13px;color:#333;flex-shrink:0">\uC0C1\uAE30 \uBB3C\uD488\uC744 \uAD6C\uB9E4 \uBC0F \uC9C0\uCD9C\uD558\uACE0\uC790 \uD558\uB2C8 \uC2B9\uB099\uD574 \uC8FC\uC2DC\uAE30 \uBC14\uB78D\uB2C8\uB2E4.</div>' +

      /* 비고 - 지출금액과 같은 스타일, 나머지 공간 채움 */
      '<div style="border:1px solid #b0c4de;padding:14px 16px;flex:1;display:flex;flex-direction:column;gap:8px">' +
        '<div style="display:flex;align-items:flex-start;gap:12px">' +
          '<span style="background:#eaf0f8;padding:5px 14px;font-weight:700;color:#3a5a8a;border-radius:4px;letter-spacing:3px;font-size:12px;white-space:nowrap;flex-shrink:0">\uBE44&nbsp;&nbsp;&nbsp;\uACE0</span>' +
          '<span style="font-size:13px;color:#555;padding-top:4px">' + _esc(a.memo || '') + '</span>' +
        '</div>' +
        (function() {
          var imgs = [];
          // 1) 품의 자체 evidenceFiles
          if (a.evidenceFiles && a.evidenceFiles.length) {
            imgs = a.evidenceFiles.filter(function(f) { return f.dataUrl && f.type && f.type.indexOf('image') >= 0; });
          }
          // 2) 연결된 지출(voucher)의 evidenceFiles
          if (imgs.length === 0) {
            var _vList = (typeof _vouchers === 'function') ? _vouchers() : [];
            var _linked = _vList.find(function(x) { return x.sourceType === 'approval' && x.sourceId === a.id; });
            if (!_linked && a.cashflowId) {
              _linked = _vList.find(function(x) { return x.sourceType === 'cashflow' && x.sourceId === a.cashflowId; });
            }
            if (_linked && _linked.evidenceFiles) {
              imgs = _linked.evidenceFiles.filter(function(f) { return f.dataUrl && f.type && f.type.indexOf('image') >= 0; });
            }
          }
          if (imgs.length === 0) return '';
          var html = '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px">';
          imgs.forEach(function(f) {
            html += '<img src="' + f.dataUrl + '" style="max-width:160px;max-height:120px;object-fit:contain;border:1px solid #ddd;border-radius:4px">';
          });
          html += '</div>';
          return html;
        })() +
      '</div>';

    modal.appendChild(toolbar);
    modal.appendChild(content);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    if (typeof lucide !== 'undefined') setTimeout(function(){ lucide.createIcons(); }, 50);
    document.getElementById('printPreviewCloseBtn').onclick = function() { overlay.remove(); };

    document.getElementById('printPreviewPrintBtn').onclick = function() {
      var printContent = document.getElementById('printPreviewContent').outerHTML;
      var w = window.open('', '_blank', 'width=780,height=1100');
      w.document.write(
        '<html><head><title>\uC9C0\uCD9C\uACB0\uC758\uC11C</title>' +
        '<style>body{font-family:"Malgun Gothic",sans-serif;margin:0;padding:0;color:#1a1a2e}' +
        '@media print{body{margin:0;padding:0}@page{size:A4;margin:12mm}}</style>' +
        '</head><body style="display:flex;justify-content:center;padding:20px 0">' + printContent + '</body></html>'
      );
      w.document.close();
      setTimeout(function(){ w.print(); }, 300);
    };
  }

        function approveItem(id) { openApproveConfirm(id); }

  function rejectItem(id) {
    if (!confirm('이 품의를 반려하시겠습니까?')) return;
    var approvals = _approvals();
    var item = approvals.find(function (a) { return a.id === id; });
    if (!item) return;
    item.status = 'rejected';
    _ls('acct_approvals', approvals);
    _toast('info', '"' + item.title + '" 품의가 반려되었습니다');
    renderAcctApproval();
  }

  function resubmitApproval(id) {
    var approvals = _approvals();
    var item = approvals.find(function (a) { return a.id === id; });
    if (!item) return;
    item.status = 'pending';
    item.approvedAt = null;
    _ls('acct_approvals', approvals);
    _toast('success', '재품의되었습니다');
    renderAcctApproval();
  }

  function deleteApproval(id) {
    if (!confirm('이 품의를 삭제하시겠습니까?')) return;
    _ls('acct_approvals', _approvals().filter(function (a) { return a.id !== id; }));
    _toast('info', '품의가 삭제되었습니다');
    renderAcctApproval();
  }

  function _approveConfirmModalHTML() {
    var accounts = _accounts().filter(function (a) { return a.type === 'expense'; });
    var budgetCats = _ls('acct_budget_cats') || [];
    var catOpts = '<option value="">-- 선택 --</option>' +
      budgetCats.map(function (c) { return '<option value="' + c.id + '">' + _esc(c.name) + '</option>'; }).join('');
    return '<div class="modal-overlay" id="approveConfirmModal" style="display:none" onclick="if(event.target===this)ACCT.closeApproveConfirm()">' +
      '<div class="modal-box" style="max-width:480px">' +
      '<div class="modal-head">' +
      '<div style="display:flex;align-items:center;gap:8px">' +
      '<span style="display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:8px;background:#22c55e;box-shadow:0 2px 8px #22c55e44">' +
      '<i data-lucide="shield-check" style="width:15px;height:15px;color:#fff"></i></span>' +
      '<div class="modal-title">승인 처리</div></div>' +
      '<button class="modal-close" onclick="ACCT.closeApproveConfirm()">✕</button></div>' +
      '<div class="modal-body" style="display:flex;flex-direction:column;gap:14px">' +
      '<div id="apc_info" style="background:var(--bg-tertiary);border:1.5px solid var(--border-color);border-radius:10px;padding:12px"></div>' +
      '<div style="background:rgba(79,110,247,.04);border:1.5px solid rgba(79,110,247,.2);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:10px">' +
      '<div style="font-size:11px;font-weight:700;color:var(--accent-blue)">' +
      '<i data-lucide="wallet" style="width:11px;height:11px;vertical-align:middle;margin-right:4px"></i>예산 연결 (선택시 계정과목 자동 채워짐)</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
      '<div class="form-group" style="margin:0"><label class="form-label">예산구분</label>' +
      '<select class="form-input" id="apc_budget_cat" onchange="ACCT.onApvBudgetCatChange()">' + catOpts + '</select></div>' +
      '<div class="form-group" style="margin:0"><label class="form-label">예산목</label>' +
      '<select class="form-input" id="apc_budget_item" onchange="ACCT.onApvBudgetItemChange()">' +
      '<option value="">예산구분 먼저 선택</option></select></div></div>' +
      '<div id="apc_remain_wrap" style="display:none;align-items:center;gap:8px;padding:8px 12px;background:var(--bg-secondary);border-radius:8px;border:1px solid var(--border-color)">' +
      '<i data-lucide="trending-down" style="width:14px;height:14px;color:#22c55e;flex-shrink:0"></i>' +
      '<span style="font-size:12.5px;color:var(--text-secondary)">남은 예산:</span>' +
      '<strong id="apc_remain_val" style="font-size:13px;color:#22c55e;margin-left:2px">0원</strong>' +
      '<span id="apc_remain_pct" style="font-size:11px;color:var(--text-muted);margin-left:auto"></span></div></div>' +
      '<div class="form-group"><label class="form-label">계정과목 *</label>' +
      '<select class="form-input" id="apc_account">' +
      '<option value="">-- 선택 --</option>' +
      accounts.map(function (a) { return '<option value="' + a.code + '">' + a.code + ' ' + a.name + '</option>'; }).join('') +
      '</select></div>' +
      '<div style="background:rgba(239,68,68,.04);border:1.5px solid rgba(239,68,68,.15);border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:8px">' +
      '<div style="font-size:11px;font-weight:700;color:#ef4444">' +
      '<i data-lucide="lock" style="width:11px;height:11px;vertical-align:middle;margin-right:4px"></i>최종 승인 인증</div>' +
      '<input class="form-input" id="apc_password" type="password" placeholder="로그인 패스워드 입력" autocomplete="off">' +
      '<div style="font-size:11px;color:var(--text-muted)">로그인 계정의 패스워드를 입력하면 승인이 완료되고 전표가 자동 생성됩니다</div></div>' +
      '</div>' +
      '<div class="modal-foot">' +
      '<button class="btn" onclick="ACCT.closeApproveConfirm()">취소</button>' +
      '<button class="btn" style="background:#f59e0b;color:#fff;border:none" onclick="ACCT.rejectItem(_approvingId);ACCT.closeApproveConfirm();">반려</button>' +
      '<button class="btn btn-blue" onclick="ACCT.confirmApprove()">✔ 최종 승인</button>' +
      '</div></div></div>';
  }

  /* ══════════════════════════
     4. 지출하기 (간편 UI)
  ══════════════════════════ */
  function renderAcctExpense() {
    var el = document.getElementById('acct-expense');
    if (!el) return;
    var cashflows = _cashflows().filter(function (c) { return c.type === 'expense' && _isInYear(c.date); })
      .sort(function (a, b) { return (b.createdAt || '').localeCompare(a.createdAt || ''); });

    // 승인된 품의 목록
    var approvedItems = _approvals().filter(function (a) { return a.status === 'approved' && _isInYear(a.date || a.createdAt); })
      .sort(function (a, b) { return (b.approvedAt || '').localeCompare(a.approvedAt || ''); });

    var approvalListHtml = '';
    if (approvedItems.length > 0) {
      approvalListHtml = '<div class="acct-card" style="margin-bottom:16px">' +
        '<div class="acct-card-head" style="display:flex;align-items:center;gap:8px">' +
        '<i data-lucide="check-circle" style="width:16px;height:16px;color:#22c55e"></i>' +
        ' 승인된 품의 목록' +
        '<span style="margin-left:auto;font-size:11px;color:var(--text-muted);font-weight:400">' +
        '클릭하면 지출 등록 폼에 자동 입력</span></div>' +
        '<table class="acct-table"><thead><tr>' +
        '<th>승인일</th><th>품의명</th><th>계정과목</th>' +
        '<th>신청자</th><th style="text-align:right">금액</th>' +
        '</tr></thead><tbody>';
      approvedItems.forEach(function (a) {
        var approvedDate = (a.approvedAt || '').substring(0, 10);
        approvalListHtml += '<tr class="acct-apv-row" style="cursor:pointer" onclick="ACCT.fillExpenseFromApproval(' + JSON.stringify(a.id) + ')">' +
          '<td>' + approvedDate + '</td>' +
          '<td><strong>' + _esc(a.title) + '</strong>' +
          (a.approverName ? ' <span style="font-size:11px;color:var(--text-muted)">→ ' + _esc(a.approverName) + '</span>' : '') + '</td>' +
          '<td>' + _acctName(a.accountCode) + '</td>' +
          '<td>' + _esc(a.requesterName || '') + '</td>' +
          '<td class="num" style="color:var(--accent-blue)">' + _fmtW(a.amount) + '</td>' +
          '</tr>';
      });
      approvalListHtml += '</tbody></table></div>';
    }

    var html = '' +
      '<div class="page-header"><div>' +
      '<div class="page-title">지출하기</div>' +
      '<div class="page-subtitle">간편하게 지출을 등록하면 전표가 자동 생성됩니다</div>' +
      '</div></div>' +
      approvalListHtml +

      // 간편 입력 폼
      '<div class="acct-card">' +
      '<div class="acct-card-head"><i data-lucide="edit-3" style="width:16px;height:16px"></i> 간편 지출 등록</div>' +
      '<div class="acct-simple-form">' +
      '<div class="acct-form-row">' +
      '<div class="form-group" style="flex:2"><label class="form-label">\uC9C0\uCD9C \uB0B4\uC6A9 *</label>' +
      '<input class="form-input" id="exp_desc" placeholder="\uC608) \uC0AC\uBB34\uC6A9\uD488 \uAD6C\uB9E4, \uD0DD\uBC30\uBE44" oninput="ACCT.autoSuggestAccount(\'exp\')"></div>' +
      '<div class="form-group" style="flex:1"><label class="form-label">\uAE08\uC561 (\uC6D0) *</label>' +
      '<input class="form-input" id="exp_amount" type="text" placeholder="0" oninput="this.value = ACCT.fmtInput(this.value)"></div>' +
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
    el.innerHTML = '<div style="padding-bottom:80px">' + html + '</div>';
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

  function fillExpenseFromApproval(id) {
    var item = _approvals().find(function (a) { return a.id === id; });
    if (!item) return;
    var desc = document.getElementById('exp_desc');
    var amt = document.getElementById('exp_amount');
    var acc = document.getElementById('exp_account');
    var autoLabel = document.getElementById('exp_auto_label');
    if (desc) desc.value = '[품의] ' + (item.title || '');
    if (amt) amt.value = (item.amount || 0).toLocaleString();
    if (acc) acc.value = item.accountCode || '';
    if (autoLabel) autoLabel.textContent = item.accountCode ? '→ ' + _acctName(item.accountCode) : '';
    // 폼 상단으로 스크롤
    var form = document.querySelector('#acct-expense .acct-card:nth-child(2)');
    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    _toast('info', '"' + (item.title || '') + '" 품의 정보가 입력되었습니다. 필요시 수정 후 지출 등록하세요');
  }

  function saveExpense() {
    var desc = (document.getElementById('exp_desc') || {}).value || '';
    var rawAmt = (document.getElementById('exp_amount') || {}).value || '';
    var amt = parseInt(rawAmt.replace(/,/g, '')) || 0;
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
      description: desc, counterpart: counter,
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

    // 품의 연동: 승인 → 지출 상태 업데이트
    if (desc.indexOf('[품의]') === 0) {
      var approvals = _approvals();
      var matchTitle = desc.replace('[품의] ', '');
      var matchItem = approvals.find(function (a) { return a.status === 'approved' && a.title === matchTitle; });
      if (matchItem) {
        matchItem.status = 'expensed';
        matchItem.expensedAt = _now();
        matchItem.cashflowId = cfId;
        _ls('acct_approvals', approvals);
      }
    }

    _toast('success', '지출 ' + _fmtW(amt) + ' 등록 완료 (전표 자동생성)');
    renderAcctExpense();
  }

  /* ══════════════════════════
     5. 입금전표 (간편 UI)
  ══════════════════════════ */
  function renderAcctWithdrawal() {
    var el = document.getElementById('acct-withdrawal');
    if (!el) return;
    var vouchers = _vouchers().filter(function (v) { return v.type === 'expense' && _isInYear(v.date); })
      .sort(function (a, b) { return (b.createdAt || '').localeCompare(a.createdAt || ''); });

    var html = '<div class="page-header"><div><div class="page-title">출금전표</div>' +
      '<div class="page-subtitle">승인된 품의 및 지출에 대한 출금 전표 목록입니다. 클릭하면 상세 관리할 수 있습니다</div></div></div>';

    if (vouchers.length === 0) {
      html += '<div class="acct-card"><div class="acct-empty">등록된 출금전표가 없습니다</div></div>';
    } else {
      html += '<div class="acct-card">' +
        '<div class="acct-card-head"><i data-lucide="arrow-up-circle" style="width:16px;height:16px"></i> 출금전표 목록 (' + vouchers.length + '건)</div>' +
        '<table class="acct-table"><thead><tr>' +
        '<th>전표일</th><th>설명</th><th>차변</th><th>대변</th>' +
        '<th>거래처</th><th>결제수단</th>' +
        '<th style="text-align:right">금액</th><th>출처</th><th>증빙</th>' +
        '</tr></thead><tbody>';

      vouchers.forEach(function (v) {
        var debit = (v.entries || []).filter(function (e) { return e.side === 'debit'; });
        var credit = (v.entries || []).filter(function (e) { return e.side === 'credit'; });
        var amt = debit.length > 0 ? debit[0].amount : 0;
        var dNames = debit.map(function (e) { return _acctName(e.accountCode); }).join(', ');
        var cNames = credit.map(function (e) { return _acctName(e.accountCode); }).join(', ');
        var src = v.sourceType === 'approval' ? '<span class="acct-badge approved" style="font-size:10px">품의</span>' :
          v.sourceType === 'cashflow' ? '<span class="acct-badge pending" style="font-size:10px">지출</span>' :
          '<span class="acct-badge" style="font-size:10px">수동</span>';
        var hasEvidence = (v.evidenceFiles && v.evidenceFiles.length > 0);
        var evidBadge = hasEvidence
          ? '<span style="display:inline-flex;align-items:center;gap:2px;font-size:10px;color:#22c55e;font-weight:600"><i data-lucide="paperclip" style="width:10px;height:10px"></i>' + v.evidenceFiles.length + '</span>'
          : '<span style="font-size:10px;color:var(--text-muted)">-</span>';
        html += '<tr style="cursor:pointer" onclick="ACCT.openWithdrawalDetail(' + JSON.stringify(v.id) + ')">' +
          '<td>' + (v.date || '') + '</td>' +
          '<td>' + _esc(v.description || '') + '</td>' +
          '<td><span style="color:var(--accent-blue);font-weight:600;font-size:12px">' + dNames + '</span></td>' +
          '<td><span style="color:#ef4444;font-weight:600;font-size:12px">' + cNames + '</span></td>' +
          '<td style="font-size:12px">' + _esc(v.counterpart || '-') + '</td>' +
          '<td style="font-size:12px">' + _esc(v.paymentMethod || '-') + '</td>' +
          '<td class="num" style="color:#ef4444">' + _fmtW(amt) + '</td>' +
          '<td>' + src + '</td>' +
          '<td style="text-align:center">' + evidBadge + '</td></tr>';
      });
      html += '</tbody></table></div>';
    }

    var tot = vouchers.reduce(function (s, v) {
      var d = (v.entries || []).filter(function (e) { return e.side === 'debit'; });
      return s + (d.length > 0 ? d[0].amount : 0);
    }, 0);
    html += '<div style="display:flex;justify-content:flex-end;margin-top:12px;gap:16px;padding:0 8px">' +
      '<div style="font-size:13px;color:var(--text-secondary)">총 출금액</div>' +
      '<div style="font-size:16px;font-weight:800;color:#ef4444">' + _fmtW(tot) + '</div></div>';

    // 출금전표 상세 모달
    html += _withdrawalDetailModalHTML();

    el.innerHTML = '<div style="padding-bottom:80px">' + html + '</div>';
    _ri();
  }

  /* ── 출금전표 상세 모달 ── */
  function _withdrawalDetailModalHTML() {
    return '<div class="modal-overlay" id="wdDetailModal" style="display:none" onclick="if(event.target===this)ACCT.closeWithdrawalDetail()">' +
      '<div class="modal-box" style="max-width:640px">' +
      '<div class="modal-head">' +
      '<div style="display:flex;align-items:center;gap:8px">' +
      '<span style="display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:8px;background:var(--accent-blue);box-shadow:0 2px 8px rgba(79,110,247,.3)">' +
      '<i data-lucide="file-text" style="width:15px;height:15px;color:#fff"></i></span>' +
      '<div class="modal-title">지출결의서</div></div>' +
      '<button class="modal-close" onclick="ACCT.closeWithdrawalDetail()">✕</button></div>' +
      '<div class="modal-body" style="display:flex;flex-direction:column;gap:12px">' +

      // 지출결의서 테이블
      '<div style="border:2px solid var(--border-color);border-radius:10px;overflow:hidden">' +
      '<table style="width:100%;border-collapse:collapse;font-size:13px" id="wd_form_table">' +
      '<tr><td style="background:var(--bg-tertiary);font-weight:700;padding:8px 12px;width:90px;white-space:nowrap;border-bottom:1px solid var(--border-color);border-right:1px solid var(--border-color)">품의일자</td>' +
      '<td id="wd_f_date" style="padding:8px 12px;border-bottom:1px solid var(--border-color);border-right:1px solid var(--border-color)"></td>' +
      '<td style="background:var(--bg-tertiary);font-weight:700;padding:8px 12px;width:90px;white-space:nowrap;border-bottom:1px solid var(--border-color);border-right:1px solid var(--border-color)">계정과목</td>' +
      '<td id="wd_f_account" style="padding:8px 12px;border-bottom:1px solid var(--border-color)"></td></tr>' +

      '<tr><td style="background:var(--bg-tertiary);font-weight:700;padding:8px 12px;border-bottom:1px solid var(--border-color);border-right:1px solid var(--border-color)">지출일자</td>' +
      '<td id="wd_f_expdate" style="padding:8px 12px;border-bottom:1px solid var(--border-color);border-right:1px solid var(--border-color)"></td>' +
      '<td style="background:var(--bg-tertiary);font-weight:700;padding:8px 12px;border-bottom:1px solid var(--border-color);border-right:1px solid var(--border-color)">증빙구분</td>' +
      '<td style="padding:4px 8px;border-bottom:1px solid var(--border-color)"><select class="form-input" id="wd_f_evidType" style="font-size:12px;padding:4px 8px;margin:0">' +
      '<option value="">선택</option><option value="영수증">영수증</option><option value="세금계산서">세금계산서</option>' +
      '<option value="카드전표">카드전표</option><option value="간이영수증">간이영수증</option><option value="기타">기타</option>' +
      '</select></td></tr>' +

      '<tr><td style="background:var(--bg-tertiary);font-weight:700;padding:8px 12px;border-bottom:1px solid var(--border-color);border-right:1px solid var(--border-color)">결제일자</td>' +
      '<td style="padding:4px 8px;border-bottom:1px solid var(--border-color);border-right:1px solid var(--border-color)"><input type="date" class="form-input" id="wd_f_paydate" style="font-size:12px;padding:4px 8px;margin:0"></td>' +
      '<td style="background:var(--bg-tertiary);font-weight:700;padding:8px 12px;border-bottom:1px solid var(--border-color);border-right:1px solid var(--border-color)">거 래 처</td>' +
      '<td id="wd_f_counterpart" style="padding:8px 12px;border-bottom:1px solid var(--border-color)"></td></tr>' +

      '<tr><td style="background:var(--bg-tertiary);font-weight:700;padding:8px 12px;border-bottom:1px solid var(--border-color);border-right:1px solid var(--border-color)">물 품 명</td>' +
      '<td style="padding:4px 8px;border-bottom:1px solid var(--border-color);border-right:1px solid var(--border-color)"><input class="form-input" id="wd_f_itemName" placeholder="물품명" style="font-size:12px;padding:4px 8px;margin:0"></td>' +
      '<td style="background:var(--bg-tertiary);font-weight:700;padding:8px 12px;border-bottom:1px solid var(--border-color);border-right:1px solid var(--border-color)">용    도</td>' +
      '<td style="padding:4px 8px;border-bottom:1px solid var(--border-color)"><input class="form-input" id="wd_f_purpose" placeholder="용도" style="font-size:12px;padding:4px 8px;margin:0"></td></tr>' +
      '</table>' +

      // 지출금액
      '<div style="background:rgba(79,110,247,.06);padding:10px 14px;display:flex;align-items:center;gap:8px;border-top:2px solid var(--accent-blue)">' +
      '<span style="font-weight:800;font-size:13px;color:var(--accent-blue)">지출금액</span>' +
      '<span style="font-size:13px;font-weight:700;margin-left:4px">₩</span>' +
      '<span id="wd_f_amount" style="font-size:16px;font-weight:800;color:#ef4444"></span></div>' +

      '<div style="padding:8px 14px;text-align:center;font-size:12px;color:var(--text-secondary);border-bottom:2px solid var(--border-color)">' +
      '상기 금액을 용도에 따라 지출하였음을 결의합니다.</div>' +
      '</div>' +

      // 비고 (적요)
      '<div class="form-group" style="margin:0"><label class="form-label" style="font-weight:700">비    고</label>' +
      '<textarea class="form-input" id="wd_memo" rows="2" placeholder="비고 사항을 입력하세요" style="resize:vertical;font-size:12.5px"></textarea></div>' +

      // 증빙서류
      '<div style="background:rgba(79,110,247,.04);border:1.5px solid rgba(79,110,247,.2);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:10px">' +
      '<div style="display:flex;align-items:center;justify-content:space-between">' +
      '<div style="font-size:11px;font-weight:700;color:var(--accent-blue)">' +
      '<i data-lucide="paperclip" style="width:11px;height:11px;vertical-align:middle;margin-right:4px"></i>증빙서류 첨부</div>' +
      '<label style="cursor:pointer;font-size:11px;font-weight:600;color:var(--accent-blue);display:flex;align-items:center;gap:4px">' +
      '<i data-lucide="upload" style="width:12px;height:12px"></i>파일 추가' +
      '<input type="file" id="wd_file_input" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" style="display:none" onchange="ACCT.addWithdrawalEvidence()">' +
      '</label></div>' +
      '<div id="wd_evidence_list" style="display:flex;flex-direction:column;gap:6px"></div></div>' +

      '</div>' +
      '<div class="modal-foot" style="display:flex;gap:8px">' +
      '<button class="btn" onclick="ACCT.closeWithdrawalDetail()">취소</button>' +
      '<button class="btn" onclick="ACCT.printWithdrawalDetail()" style="display:flex;align-items:center;gap:4px"><i data-lucide="printer" style="width:13px;height:13px"></i>출력</button>' +
      '<button class="btn btn-blue" onclick="ACCT.saveWithdrawalDetail()">저장</button>' +
      '</div></div></div>';
  }

    var _wdEditingId = null;

  function openWithdrawalDetail(id) {
    var v = _vouchers().find(function (x) { return x.id === id; });
    if (!v) return;
    _wdEditingId = id;

    // 기본 정보
    var debit = (v.entries || []).filter(function (e) { return e.side === 'debit'; });
    var credit = (v.entries || []).filter(function (e) { return e.side === 'credit'; });
    var amt = debit.length > 0 ? debit[0].amount : 0;
    var dNames = debit.map(function (e) { return _acctName(e.accountCode); }).join(', ');
    var cNames = credit.map(function (e) { return _acctName(e.accountCode); }).join(', ');

    var infoEl = document.getElementById('wd_info');
    if (infoEl) {
      infoEl.innerHTML = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px">' +
        '<div><span style="color:var(--text-muted);font-size:11px">전표일</span><br>' + (v.date || '') + '</div>' +
        '<div><span style="color:var(--text-muted);font-size:11px">설명</span><br><strong>' + _esc(v.description || '') + '</strong></div>' +
        '<div><span style="color:var(--text-muted);font-size:11px">차변 (비용)</span><br><span style="color:var(--accent-blue);font-weight:600">' + dNames + '</span></div>' +
        '<div><span style="color:var(--text-muted);font-size:11px">대변 (자산)</span><br><span style="color:#ef4444;font-weight:600">' + cNames + '</span></div>' +
        '<div><span style="color:var(--text-muted);font-size:11px">금액</span><br><strong style="color:#ef4444;font-size:15px">' + _fmtW(amt) + '</strong></div>' +
        '<div><span style="color:var(--text-muted);font-size:11px">작성자</span><br>' + _esc(v.createdBy || '') + '</div></div>';
    }

    // 연결 데이터 조회
    var cfData = {};
    if (v.sourceType === 'cashflow' && v.sourceId) {
      var cf = _cashflows().find(function (x) { return x.id === v.sourceId; });
      if (cf) cfData = cf;
    } else if (v.sourceType === 'approval' && v.sourceId) {
      var apv = _approvals().find(function (a) { return a.id === v.sourceId; });
      if (apv && apv.cashflowId) {
        var cf2 = _cashflows().find(function (x) { return x.id === apv.cashflowId; });
        if (cf2) cfData = cf2;
      }
      if (apv) { cfData.apvDate = apv.date; cfData.apvTitle = apv.title; }
    }

    // 필드 채우기
    var el_date = document.getElementById('wd_f_date'); if (el_date) el_date.textContent = cfData.apvDate || v.date || '';
    var el_account = document.getElementById('wd_f_account'); if (el_account) el_account.innerHTML = '<span style="color:var(--accent-blue);font-weight:600">' + dNames + '</span>';
    var el_expdate = document.getElementById('wd_f_expdate'); if (el_expdate) el_expdate.textContent = cfData.date || v.date || '';
    var el_cp = document.getElementById('wd_f_counterpart'); if (el_cp) el_cp.textContent = cfData.counterpart || v.counterpart || '-';
    var el_amt = document.getElementById('wd_f_amount'); if (el_amt) el_amt.textContent = _fmtW(amt);
    var el_evidType = document.getElementById('wd_f_evidType'); if (el_evidType) el_evidType.value = v.evidenceType || '';
    var el_paydate = document.getElementById('wd_f_paydate'); if (el_paydate) el_paydate.value = v.paymentDate || cfData.date || '';
    var el_itemName = document.getElementById('wd_f_itemName'); if (el_itemName) el_itemName.value = v.itemName || cfData.apvTitle || v.description || '';
    var el_purpose = document.getElementById('wd_f_purpose'); if (el_purpose) el_purpose.value = v.purpose || '';
    var mm = document.getElementById('wd_memo'); if (mm) mm.value = v.memo || '';

    // 증빙 목록 렌더
    _renderEvidenceList(v.evidenceFiles || []);

    var m = document.getElementById('wdDetailModal');
    if (m) m.style.display = 'flex';
    if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 50);
  }

  function _renderEvidenceList(files) {
    var el = document.getElementById('wd_evidence_list');
    if (!el) return;
    if (!files || files.length === 0) {
      el.innerHTML = '<div style="text-align:center;font-size:12px;color:var(--text-muted);padding:8px">등록된 증빙서류가 없습니다</div>';
      return;
    }
    var html = '';
    files.forEach(function (f, i) {
      var isImg = f.type && f.type.indexOf('image') >= 0;
      var thumbHtml = isImg && f.dataUrl ? '<img src="' + f.dataUrl + '" style="width:36px;height:36px;object-fit:cover;border-radius:4px;flex-shrink:0;border:1px solid var(--border-color)">' : '<i data-lucide="' + (isImg ? 'image' : 'file') + '" style="width:14px;height:14px;color:var(--accent-blue);flex-shrink:0"></i>';
      html += '<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:8px;font-size:12px">' +
        thumbHtml +
        '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + _esc(f.name) + '</span>' +
        '<span style="color:var(--text-muted);font-size:10px">' + _esc(f.size || '') + '</span>' +
        '<button onclick="ACCT.removeEvidence(' + i + ')" style="background:none;border:none;cursor:pointer;color:#ef4444;padding:2px"><i data-lucide="x" style="width:12px;height:12px"></i></button>' +
        '</div>';
    });
    el.innerHTML = html;
    if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 30);
  }

  function printWithdrawalDetail() {
    if (!_wdEditingId) return;
    var v = _vouchers().find(function (x) { return x.id === _wdEditingId; });
    if (!v) return;
    var debit = (v.entries || []).filter(function (e) { return e.side === 'debit'; });
    var amt = debit.length > 0 ? debit[0].amount : 0;
    var dNames = debit.map(function (e) { return _acctName(e.accountCode); }).join(', ');
    var memo = (document.getElementById('wd_memo') || {}).value || v.memo || '';
    var evidType = (document.getElementById('wd_f_evidType') || {}).value || v.evidenceType || '';
    var payDate = (document.getElementById('wd_f_paydate') || {}).value || v.paymentDate || '';
    var itemName = (document.getElementById('wd_f_itemName') || {}).value || v.itemName || '';
    var purpose = (document.getElementById('wd_f_purpose') || {}).value || v.purpose || '';
    var counterpart = (document.getElementById('wd_f_counterpart') || {}).textContent || '';
    var evidFiles = v.evidenceFiles || [];

    // 문서번호 생성
    var docNo = (v.date || '').replace(/-/g, '') + '-' + String(v.id || '').substring(0, 4).toUpperCase();

    // 증빙 이미지만 (파일명 없이)
    var evidHtml = '';
    if (evidFiles.length > 0) {
      evidFiles.forEach(function (f) {
        var isImg = f.type && f.type.indexOf('image/') === 0;
        if (isImg && f.dataUrl) {
          evidHtml += '<div style="padding:6px 0">' +
            '<img src="' + f.dataUrl + '" style="max-width:100%;max-height:500px"></div>';
        }
      });
    }

    var w = window.open('', '_blank', 'width=800,height=1000');
    w.document.write('<html><head><title>\uC9C0\uCD9C\uACB0\uC758\uC11C</title>' +
      '<style>' +
      '@page { size:A4; margin:15mm 15mm 15mm 15mm }' +
      '* { margin:0; padding:0; box-sizing:border-box }' +
      'body { font-family:"Malgun Gothic",sans-serif; font-size:14px; color:#222 }' +

      /* 페이지 박스 프레임 */
      '.page-frame { border:1.5px solid #888; padding:30px 35px; min-height:calc(100vh - 30mm); position:relative; page-break-inside:avoid }' +
      '.page-frame-cont { border:1.5px solid #888; border-top:1.5px solid #888; padding:30px 35px; min-height:calc(100vh - 30mm); page-break-before:always }' +

      /* 상단 */
      '.doc-no { font-size:12px; color:#555; margin-bottom:6px }' +
      '.top-area { position:relative; height:100px; margin-bottom:0 }' +
      '.sign-table { position:absolute; top:0; right:0; border-collapse:collapse }' +
      '.sign-table td { border:1.5px solid #aaa; text-align:center; font-size:12px; font-weight:600 }' +
      '.sign-label { background:#dde5f0; padding:5px 0; width:90px }' +
      '.sign-cell { height:70px; width:90px }' +
      '.title { font-size:26px; letter-spacing:18px; font-weight:800; color:#222; padding:30px 0 0 20px }' +

      /* 메인 테이블 */
      '.main-table { width:100%; border-collapse:collapse }' +
      '.main-table th,.main-table td { border:1.5px solid #aaa; padding:11px 14px; font-size:14px }' +
      '.main-table th { background:#dde5f0; font-weight:700; text-align:center; width:85px; white-space:nowrap; letter-spacing:3px }' +
      '.amt-th { border-top:3px solid #888 }' +
      '.amt-td { border-top:3px solid #888; font-size:18px; font-weight:800 }' +
      '.resolution { text-align:center; padding:18px 14px; font-size:14px; letter-spacing:1px }' +
      '.memo-th { vertical-align:top; letter-spacing:8px }' +
      '.memo-td { min-height:150px; vertical-align:top }' +

      /* 인쇄시 헤더/푸터 제거 */
      '@media print { @page{margin:10mm 12mm} .page-frame,.page-frame-cont{min-height:calc(100vh - 20mm)} }' +
      '</style></head><body>' +

      /* 1페이지 프레임 */
      '<div class="page-frame">' +
      '<div class="doc-no">\uBB38\uC11C\uBC88\uD638 : ' + docNo + '</div>' +

      '<div class="top-area">' +
      '<table class="sign-table">' +
      '<tr><td class="sign-label">\uB2F4 \u00A0 \u00A0 \uB2F9</td><td class="sign-label">\uC0C1\uC784\uC774\uC0AC</td></tr>' +
      '<tr><td class="sign-cell"></td><td class="sign-cell"></td></tr>' +
      '</table>' +
      '<div class="title">\uC9C0 \uCD9C \uACB0 \uC758 \uC11C</div>' +
      '</div>' +

      '<table class="main-table">' +
      '<tr><th>\uD488\uC758\uC77C\uC790</th><td>' + (v.date || '') + '</td>' +
      '<th>\uACC4\uC815\uACFC\uBAA9</th><td>' + dNames + '</td></tr>' +
      '<tr><th>\uC9C0\uCD9C\uC77C\uC790</th><td>' + (v.date || '') + '</td>' +
      '<th>\uC99D\uBE59\uAD6C\uBD84</th><td>' + evidType + '</td></tr>' +
      '<tr><th>\uACB0\uC81C\uC77C\uC790</th><td>' + payDate + '</td>' +
      '<th>거래처</th><td>' + counterpart + '</td></tr>' +
      '<tr><th>\uBB3C \uD488 \uBA85</th><td>' + itemName + '</td>' +
      '<th>\uC6A9 \u00A0 \u00A0 \uB3C4</th><td>' + purpose + '</td></tr>' +
      '<tr><th class="amt-th">\uC9C0\uCD9C\uAE08\uC561</th>' +
      '<td colspan="3" class="amt-td amt-th">\u20A9 ' + _fmtW(amt) + '</td></tr>' +
      '<tr><td colspan="4" class="resolution">' +
      '\uC0C1\uAE30 \uBB3C\uD488\uC744 \uAD6C\uB9E4 \uBC0F \uC9C0\uCD9C\uD558\uACE0\uC790 \uD558\uB2C8 \uC2B9\uB099\uD574 \uC8FC\uC2DC\uAE30 \uBC14\uB78D\uB2C8\uB2E4.</td></tr>' +
      '<tr><th class="memo-th">\uBE44 \u00A0 \uACE0</th>' +
      '<td colspan="3" class="memo-td">' +
      (memo ? '<div style="line-height:1.6">' + memo + '</div>' : '') +
      '</td></tr></table>' +
      '</div>' +

      /* 2페이지: 증빙 이미지 (있을 때만) */
      (evidHtml ? '<div class="page-frame-cont">' +
      '<div class="doc-no" style="margin-bottom:12px">\uBB38\uC11C\uBC88\uD638 : ' + docNo + ' (\uCCA8\uBD80)</div>' +
      evidHtml +
      '</div>' : '') +

      '</body></html>');
    w.document.close();
    setTimeout(function () { w.print(); }, 300);
  }

    function addWithdrawalEvidence() {
    if (!_wdEditingId) return;
    var input = document.getElementById('wd_file_input');
    if (!input || !input.files || input.files.length === 0) return;
    var vouchers = _vouchers();
    var v = vouchers.find(function (x) { return x.id === _wdEditingId; });
    if (!v) return;
    if (!v.evidenceFiles) v.evidenceFiles = [];

    var filesToRead = [];
    for (var i = 0; i < input.files.length; i++) filesToRead.push(input.files[i]);

    var pending = filesToRead.length;
    filesToRead.forEach(function (file) {
      var sizeStr = file.size < 1024 ? file.size + 'B' :
        file.size < 1048576 ? Math.round(file.size / 1024) + 'KB' :
        (file.size / 1048576).toFixed(1) + 'MB';
      var entry = { name: file.name, type: file.type || '', size: sizeStr, addedAt: _now() };

      if (file.type && file.type.indexOf('image/') === 0) {
        var reader = new FileReader();
        reader.onload = function (e) {
          entry.dataUrl = e.target.result;
          v.evidenceFiles.push(entry);
          pending--;
          if (pending === 0) {
            _ls('acct_vouchers', vouchers);
            _renderEvidenceList(v.evidenceFiles);
            _toast('success', v.evidenceFiles.length + '개 증빙서류가 추가되었습니다');
          }
        };
        reader.readAsDataURL(file);
      } else {
        v.evidenceFiles.push(entry);
        pending--;
        if (pending === 0) {
          _ls('acct_vouchers', vouchers);
          _renderEvidenceList(v.evidenceFiles);
          _toast('success', v.evidenceFiles.length + '개 증빙서류가 추가되었습니다');
        }
      }
    });
    input.value = '';
    return; // 아래 기존 toast/render 스킵
    _ls('acct_vouchers', vouchers);
    _renderEvidenceList(v.evidenceFiles);
    input.value = '';
    _toast('success', input.files.length + '개 증빙서류가 추가되었습니다');
  }

  function removeEvidence(idx) {
    if (!_wdEditingId) return;
    var vouchers = _vouchers();
    var v = vouchers.find(function (x) { return x.id === _wdEditingId; });
    if (!v || !v.evidenceFiles) return;
    v.evidenceFiles.splice(idx, 1);
    _ls('acct_vouchers', vouchers);
    _renderEvidenceList(v.evidenceFiles);
  }

  function saveWithdrawalDetail() {
    if (!_wdEditingId) return;
    var vouchers = _vouchers();
    var v = vouchers.find(function (x) { return x.id === _wdEditingId; });
    if (!v) return;
    v.memo = (document.getElementById('wd_memo') || {}).value || '';
    v.evidenceType = (document.getElementById('wd_f_evidType') || {}).value || '';
    v.paymentDate = (document.getElementById('wd_f_paydate') || {}).value || '';
    v.itemName = (document.getElementById('wd_f_itemName') || {}).value || '';
    v.purpose = (document.getElementById('wd_f_purpose') || {}).value || '';
    _ls('acct_vouchers', vouchers);

    // 적요 + 증빙 모두 등록 시 → 전표 상태로 전환
    var hasMemo = v.memo && v.memo.trim().length > 0;
    var hasEvidence = v.evidenceFiles && v.evidenceFiles.length > 0;
    if (hasMemo && hasEvidence) {
      // 품의 연동: → 전표 상태 업데이트
      if (v.sourceType === 'approval' && v.sourceId) {
        var approvals = _approvals();
        var apvItem = approvals.find(function (a) { return a.id === v.sourceId; });
        if (apvItem && (apvItem.status === 'approved' || apvItem.status === 'expensed')) {
          apvItem.status = 'vouchered';
          apvItem.voucheredAt = _now();
          apvItem.voucherId = v.id;
          _ls('acct_approvals', approvals);
        }
      } else {
        // cashflow 기반 전표도 동일
        var approvals2 = _approvals();
        var matchApv = approvals2.find(function (a) {
          return a.cashflowId && (a.status === 'expensed') &&
            _vouchers().some(function (vv) { return vv.sourceId === a.id && vv.id === v.id; });
        });
        if (!matchApv && v.sourceType === 'cashflow' && v.sourceId) {
          var cf = _cashflows().find(function (x) { return x.id === v.sourceId; });
          if (cf) {
            matchApv = approvals2.find(function (a) { return a.cashflowId === cf.id && a.status === 'expensed'; });
          }
        }
        if (matchApv) {
          matchApv.status = 'vouchered';
          matchApv.voucheredAt = _now();
          matchApv.voucherId = v.id;
          _ls('acct_approvals', approvals2);
        }
      }
    }

    closeWithdrawalDetail();
    if (hasMemo && hasEvidence) {
      _toast('success', '출금전표가 확정되었습니다 (적요 + 증빙 완료)');
    } else {
      _toast('info', '저장되었습니다. 적요와 증빙서류를 모두 등록하면 전표가 확정됩니다');
    }
    renderAcctWithdrawal();
  }

  function closeWithdrawalDetail() {
    var m = document.getElementById('wdDetailModal'); if (m) m.style.display = 'none';
    _wdEditingId = null;
  }

    function renderAcctIncome() {
    var el = document.getElementById('acct-income');
    if (!el) return;
    var cashflows = _cashflows().filter(function (c) { return c.type === 'income' && _isInYear(c.date); })
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
      '<div class="form-group" style="flex:2"><label class="form-label">\uC785\uAE08 \uB0B4\uC6A9 *</label>' +
      '<input class="form-input" id="inc_desc" placeholder="\uC608) 4\uC6D4 \uB9E4\uCD9C, \uC774\uC790\uC218\uC775" oninput="ACCT.autoSuggestAccount(\'inc\')"></div>' +
      '<div class="form-group" style="flex:1"><label class="form-label">\uAE08\uC561 (\uC6D0) *</label>' +
      '<input class="form-input" id="inc_amount" type="text" placeholder="0" oninput="this.value = ACCT.fmtInput(this.value)"></div>' +
      '<div class="form-group" style="flex:1"><label class="form-label">거래처</label>' +
      '<input class="form-input" id="inc_counter" placeholder="거래처명"></div>' +
      '</div>' +
      '<div class="acct-form-row">' +
      '<div class="form-group" style="flex:1"><label class="form-label">입금수단</label>' +
      '<select class="form-input" id="inc_method"><option value="계좌이체">계좌이체</option><option value="현금">현금</option><option value="카드">카드</option><option value="미수금">미수금(외상)</option><option value="미수금회수">💰 미수금 회수(수금)</option><option value="기타">기타</option></select></div>' +
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
    el.innerHTML = '<div style="padding-bottom:80px">' + html + '</div>';
    _ri();
  }

  function saveIncome() {
    var desc = (document.getElementById('inc_desc') || {}).value || '';
    var rawAmt = (document.getElementById('inc_amount') || {}).value || '';
    var amt = parseInt(rawAmt.replace(/,/g, '')) || 0;
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
    var vEntries;
    if (method === '미수금회수') {
      // 미수금 회수: 차변 보통예금(1020) / 대변 미수금(1030)
      vEntries = [
        { side: 'debit',  accountCode: '1020', amount: amt },
        { side: 'credit', accountCode: '1030', amount: amt }
      ];
    } else if (method === '미수금') {
      // 외상 매출: 차변 미수금(1030) / 대변 수익
      vEntries = [
        { side: 'debit',  accountCode: '1030', amount: amt },
        { side: 'credit', accountCode: code,   amount: amt }
      ];
    } else {
      // 일반 입금: 현금 1010 / 그 외 보통예금 1020
      var incDebitAcct = method === '현금' ? '1010' : '1020';
      vEntries = [
        { side: 'debit',  accountCode: incDebitAcct, amount: amt },
        { side: 'credit', accountCode: code,          amount: amt }
      ];
    }
    vouchers.push({
      id: vId, date: date, type: 'income',
      description: desc, counterpart: counter,
      entries: vEntries,
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
    // 품의 연동: 지출 삭제 시 품의 상태를 approved로 복원
    if (item) {
      var approvals = _approvals();
      var linkedApv = approvals.find(function (a) { return a.cashflowId === id; });
      if (linkedApv && (linkedApv.status === 'expensed' || linkedApv.status === 'vouchered')) {
        linkedApv.status = 'approved';
        delete linkedApv.expensedAt;
        delete linkedApv.cashflowId;
        delete linkedApv.voucheredAt;
        delete linkedApv.voucherId;
        _ls('acct_approvals', approvals);
      }
    }
    _ls('acct_cashflows', cashflows.filter(function (c) { return c.id !== id; }));
    _toast('info', '삭제되었습니다');
    if (type === 'expense') renderAcctExpense();
    else renderAcctIncome();
  }

  /* ══════════════════════════
     6. 전표장부 (회계담당자 UI)
  ══════════════════════════ */
  /* ══════════════════════════
     8. 기초잔액 설정
  ══════════════════════════ */
  function _openingBalances() { return _ls('acct_opening_balances') || []; }

  function renderAcctBalance() {
    var el = document.getElementById('acct-balance');
    if (!el) return;
    _initDefaults();
    var year = _selectedYear();
    var balances = _openingBalances().filter(function (b) { return b.year === year; });
    var accounts = _accounts();

    // 분류별 그룹
    var groups = [
      { key: 'asset', label: '\uC790\uC0B0 (Assets)', icon: 'building-2', color: '#4f6ef7' },
      { key: 'liability', label: '\uBD80\uCC44 (Liabilities)', icon: 'credit-card', color: '#ef4444' },
      { key: 'equity', label: '\uC790\uBCF8 (Equity)', icon: 'landmark', color: '#8b5cf6' }
    ];

    var html = '' +
      '<div class="page-header"><div>' +
      '<div class="page-title">\uAE30\uCD08\uC794\uC561 \uC124\uC815</div>' +
      '<div class="page-subtitle">' + year + '\uB144\uB3C4 \uD68C\uACC4\uC5F0\uB3C4 \uC2DC\uC791 \uC2DC \uC804\uAE30\uC774\uC6D4 \uC794\uC561\uC744 \uC124\uC815\uD569\uB2C8\uB2E4</div>' +
      '</div>' +
      '<div style="display:flex;gap:8px">' +
      '<button class="btn" onclick="ACCT.copyPrevYearBalance()" style="display:flex;align-items:center;gap:4px"><i data-lucide="copy" style="width:13px;height:13px"></i>\uC774\uC804\uB144\uB3C4 \uBCF5\uC0AC</button>' +
      '<button class="btn btn-blue" onclick="ACCT.saveAllBalances()"><i data-lucide="save" style="width:13px;height:13px"></i> \uC800\uC7A5</button>' +
      '</div></div>';

    // 금액 합계 계산
    var assetTotal = 0, liabilityTotal = 0, equityTotal = 0;
    balances.forEach(function (b) {
      var acct = accounts.find(function (a) { return a.code === b.accountCode; });
      if (acct) {
        if (acct.type === 'asset') assetTotal += (b.amount || 0);
        else if (acct.type === 'liability') liabilityTotal += (b.amount || 0);
        else if (acct.type === 'equity') equityTotal += (b.amount || 0);
      }
    });
    var balanced = assetTotal === (liabilityTotal + equityTotal);

    // 대차 균형 카드
    html += '<div class="acct-card" style="margin-bottom:16px">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">' +
      '<div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap">' +
      '<div style="text-align:center"><div style="font-size:11px;color:var(--text-muted);font-weight:600">\uC790\uC0B0 \uD569\uACC4</div>' +
      '<div style="font-size:18px;font-weight:800;color:#4f6ef7">' + _fmtW(assetTotal) + '</div></div>' +
      '<div style="font-size:20px;font-weight:300;color:var(--text-muted)">=</div>' +
      '<div style="text-align:center"><div style="font-size:11px;color:var(--text-muted);font-weight:600">\uBD80\uCC44 \uD569\uACC4</div>' +
      '<div style="font-size:18px;font-weight:800;color:#ef4444">' + _fmtW(liabilityTotal) + '</div></div>' +
      '<div style="font-size:20px;font-weight:300;color:var(--text-muted)">+</div>' +
      '<div style="text-align:center"><div style="font-size:11px;color:var(--text-muted);font-weight:600">\uC790\uBCF8 \uD569\uACC4</div>' +
      '<div style="font-size:18px;font-weight:800;color:#8b5cf6">' + _fmtW(equityTotal) + '</div></div>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:6px;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:700;' +
      (balanced ? 'background:rgba(34,197,94,.1);color:#22c55e;border:1.5px solid rgba(34,197,94,.3)">' +
      '<i data-lucide="check-circle" style="width:14px;height:14px"></i>\uB300\uCC28 \uADE0\uD615 \uC77C\uCE58' :
      'background:rgba(239,68,68,.1);color:#ef4444;border:1.5px solid rgba(239,68,68,.3)">' +
      '<i data-lucide="alert-circle" style="width:14px;height:14px"></i>\uB300\uCC28 \uBD88\uADE0\uD615 (\uCC28\uC561: ' + _fmtW(assetTotal - liabilityTotal - equityTotal) + ')') +
      '</div>' +
      '</div></div>';

    // 각 그룹별 아코디언
    groups.forEach(function (g) {
      var groupAccts = accounts.filter(function (a) { return a.type === g.key; });
      if (groupAccts.length === 0) return;
      var groupTotal = 0;
      groupAccts.forEach(function (a) {
        var bal = balances.find(function (b) { return b.accountCode === a.code; });
        groupTotal += (bal ? bal.amount : 0);
      });

      html += '<div class="acct-card" style="margin-bottom:12px">' +
        '<div class="acct-card-head" style="display:flex;align-items:center;justify-content:space-between;cursor:pointer" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display===\'none\'?\'block\':\'none\'">' +
        '<div style="display:flex;align-items:center;gap:8px">' +
        '<span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:8px;background:' + g.color + '22;border:1.5px solid ' + g.color + '">' +
        '<i data-lucide="' + g.icon + '" style="width:14px;height:14px;color:' + g.color + '"></i></span>' +
        '<span style="font-weight:800;font-size:14px">' + g.label + '</span>' +
        '<span style="font-size:12px;color:var(--text-muted)">' + groupAccts.length + '\uAC1C \uACC4\uC815</span>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:10px">' +
        '<span style="font-size:15px;font-weight:800;color:' + g.color + '">' + _fmtW(groupTotal) + '</span>' +
        '<i data-lucide="chevron-down" style="width:16px;height:16px;color:var(--text-muted)"></i>' +
        '</div></div>' +
        '<div style="display:block">';

      // 테이블
      html += '<table style="width:100%;border-collapse:collapse">' +
        '<thead><tr>' +
        '<th style="text-align:left;padding:8px 14px;font-size:12px;color:var(--text-muted);font-weight:600;border-bottom:1px solid var(--border-color);width:100px">\uACC4\uC815\uCF54\uB4DC</th>' +
        '<th style="text-align:left;padding:8px 14px;font-size:12px;color:var(--text-muted);font-weight:600;border-bottom:1px solid var(--border-color)">\uACC4\uC815\uACFC\uBAA9</th>' +
        '<th style="text-align:right;padding:8px 14px;font-size:12px;color:var(--text-muted);font-weight:600;border-bottom:1px solid var(--border-color);width:200px">\uAE30\uCD08\uC794\uC561</th>' +
        '</tr></thead><tbody>';

      groupAccts.forEach(function (a) {
        var bal = balances.find(function (b) { return b.accountCode === a.code; });
        var amt = bal ? bal.amount : 0;
        html += '<tr style="border-bottom:1px solid var(--border-color)">' +
          '<td style="padding:10px 14px;font-size:13px;color:var(--text-muted);font-weight:600">' + a.code + '</td>' +
          '<td style="padding:10px 14px;font-size:13px;font-weight:600">' + a.name + '</td>' +
          '<td style="padding:6px 14px;text-align:right">' +
          '<input class="form-input" type="text" data-ob-code="' + a.code + '" value="' + _fmtInput(amt) + '"' +
          ' oninput="this.value=ACCT.fmtInput(this.value)"' +
          ' style="text-align:right;font-size:14px;font-weight:700;padding:6px 10px;margin:0;width:180px"></td></tr>';
      });

      html += '</tbody></table></div></div>';
    });

    el.innerHTML = '<div style="padding-bottom:80px">' + html + '</div>';
    _ri();
  }

  function saveAllBalances() {
    var year = _selectedYear();
    var balances = _openingBalances().filter(function (b) { return b.year !== year; });
    var inputs = document.querySelectorAll('[data-ob-code]');
    inputs.forEach(function (inp) {
      var code = inp.getAttribute('data-ob-code');
      var rawVal = (inp.value || '').replace(/[^0-9]/g, '');
      var amt = parseInt(rawVal) || 0;
      if (amt > 0) {
        balances.push({ year: year, accountCode: code, amount: amt });
      }
    });
    _ls('acct_opening_balances', balances);
    _toast('success', year + '\uB144\uB3C4 \uAE30\uCD08\uC794\uC561\uC774 \uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4');
    renderAcctBalance();
  }

  function copyPrevYearBalance() {
    var year = _selectedYear();
    var prevYear = year - 1;
    var prevBalances = _openingBalances().filter(function (b) { return b.year === prevYear; });
    if (prevBalances.length === 0) {
      _toast('warning', (prevYear) + '\uB144\uB3C4 \uAE30\uCD08\uC794\uC561 \uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4');
      return;
    }
    var balances = _openingBalances().filter(function (b) { return b.year !== year; });
    prevBalances.forEach(function (pb) {
      balances.push({ year: year, accountCode: pb.accountCode, amount: pb.amount });
    });
    _ls('acct_opening_balances', balances);
    _toast('success', prevYear + '\uB144\uB3C4 \uC794\uC561\uC774 ' + year + '\uB144\uB3C4\uB85C \uBCF5\uC0AC\uB418\uC5C8\uC2B5\uB2C8\uB2E4');
    renderAcctBalance();
  }

    /* ══════════════════════════
     9. 회계현황보기 (재무제표)
  ══════════════════════════ */
  var _reportTab = 'bs'; // bs, is, tb, cb, al

  function renderAcctReports() {
    var el = document.getElementById('acct-reports');
    if (!el) return;
    _initDefaults();
    var year = _selectedYear();
    var accounts = _accounts();
    var vouchers = _vouchers().filter(function (v) { return _isInYear(v.date); });
    var balances = (_ls('acct_opening_balances') || []).filter(function (b) { return b.year === year; });

    var tabs = [
      { key: 'bs', label: '\uB300\uCC28\uB300\uC870\uD45C', icon: 'scale' },
      { key: 'is', label: '\uC190\uC775\uACC4\uC0B0\uC11C', icon: 'trending-up' },
      { key: 'tb', label: '\uD569\uACC4\uC794\uC561\uC2DC\uC0B0\uD45C', icon: 'table' },
      { key: 'cb', label: '\uD604\uAE08\uCD9C\uB0A9\uC7A5', icon: 'banknote' },
      { key: 'al', label: '거래처원장', icon: 'building-2' }
    ];

    var html = '<div class="page-header" style="position:sticky;top:0;z-index:10;background:var(--bg-primary)"><div>' +
      '<div class="page-title">\uD68C\uACC4\uD604\uD669\uBCF4\uAE30</div>' +
      '<div class="page-subtitle">' + year + '\uB144\uB3C4 \uC7AC\uBB34\uC81C\uD45C \uBC0F \uC7A5\uBD80\uB97C \uC870\uD68C\uD569\uB2C8\uB2E4</div>' +
      '</div></div>';

    // 탭바
    html += '<div class="acct-tab-bar" style="margin-bottom:16px;position:sticky;top:52px;z-index:9;background:var(--bg-primary);padding-top:4px">';
    tabs.forEach(function (t) {
      var active = _reportTab === t.key;
      html += '<button class="acct-tab' + (active ? ' active' : '') + '" onclick="ACCT.switchReportTab(\'' + t.key + '\')">' +
        '<i data-lucide="' + t.icon + '" style="width:13px;height:13px"></i> ' + t.label + '</button>';
    });
    html += '</div>';

    // 본문
    if (_reportTab === 'bs') html += _renderBS(accounts, vouchers, balances, year);
    else if (_reportTab === 'is') html += _renderIS(accounts, vouchers, year);
    else if (_reportTab === 'tb') html += _renderTB(accounts, vouchers, balances, year);
    else if (_reportTab === 'cb') html += _renderCB(vouchers, balances, year);
    else if (_reportTab === 'al') html += _renderAL(vouchers, year);

    el.innerHTML = '<div style="padding-bottom:80px">' + html + '</div>';
    _ri();
  }

  function switchReportTab(key) {
    _reportTab = key;
    renderAcctReports();
  }

  /* ── 계정별 기말잔액 계산 ── */
  function _calcEndBalance(code, type, vouchers, balances) {
    var opening = 0;
    var ob = balances.find(function (b) { return b.accountCode === code; });
    if (ob) opening = ob.amount || 0;

    var debitSum = 0, creditSum = 0;
    vouchers.forEach(function (v) {
      (v.entries || []).forEach(function (e) {
        if (e.accountCode === code) {
          if (e.side === 'debit') debitSum += e.amount;
          else creditSum += e.amount;
        }
      });
    });

    // 자산·비용은 차변 증가, 부채·자본·수익은 대변 증가
    if (type === 'asset' || type === 'expense') return opening + debitSum - creditSum;
    else return opening + creditSum - debitSum;
  }

  /* ── 1. 대차대조표 ── */
  function _renderBS(accounts, vouchers, balances, year) {
    var assetAccts = accounts.filter(function (a) { return a.type === 'asset'; });
    var liabAccts = accounts.filter(function (a) { return a.type === 'liability'; });
    var eqAccts = accounts.filter(function (a) { return a.type === 'equity'; });

    var sections = [
      { label: '\uC790\uC0B0', color: '#4f6ef7', accts: assetAccts, type: 'asset' },
      { label: '\uBD80\uCC44', color: '#ef4444', accts: liabAccts, type: 'liability' },
      { label: '\uC790\uBCF8', color: '#8b5cf6', accts: eqAccts, type: 'equity' }
    ];

    // ── 당기순이익 계산 (수익 - 비용) → 이익잉여금에 반영 ──
    var revAccts = accounts.filter(function (a) { return a.type === 'revenue'; });
    var expAccts = accounts.filter(function (a) { return a.type === 'expense'; });
    var netIncome = 0;
    revAccts.forEach(function (a) {
      netIncome += _calcEndBalance(a.code, 'revenue', vouchers, []);
    });
    expAccts.forEach(function (a) {
      netIncome -= _calcEndBalance(a.code, 'expense', vouchers, []);
    });

    var totals = {};
    var h = '<div class="acct-card"><div class="acct-card-head" style="display:flex;align-items:center;justify-content:space-between">' +
      '<div style="display:flex;align-items:center;gap:8px"><i data-lucide="scale" style="width:16px;height:16px"></i>' +
      '<span style="font-weight:800">\uB300\uCC28\uB300\uC870\uD45C</span>' +
      '<span style="font-size:12px;color:var(--text-muted)">' + year + '.12.31 \uAE30\uC900</span></div>' +
      '<button class="btn" onclick="window.print()" style="font-size:11px;padding:4px 10px"><i data-lucide="printer" style="width:12px;height:12px"></i> \uC778\uC1C4</button></div>';

    sections.forEach(function (s) {
      var sectionTotal = 0;
      var rows = '';
      s.accts.forEach(function (a) {
        var bal = _calcEndBalance(a.code, s.type, vouchers, balances);
        // 이익잉여금(3020)에 당기순이익 합산
        if (a.code === '3020') bal += netIncome;
        if (bal === 0) return;
        sectionTotal += bal;
        rows += '<tr><td style="padding:8px 14px;font-size:13px;color:var(--text-muted)">' + a.code + '</td>' +
          '<td style="padding:8px 14px;font-size:13px;font-weight:600">' + a.name + '</td>' +
          '<td style="padding:8px 14px;text-align:right;font-size:13px;font-weight:600">' + _fmtW(bal) + '</td></tr>';
      });
      totals[s.type] = sectionTotal;

      h += '<div style="margin:12px 0 4px 0;font-size:13px;font-weight:800;color:' + s.color + ';display:flex;align-items:center;gap:6px;padding:0 14px">' +
        '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + s.color + '"></span>' + s.label + '</div>' +
        '<table style="width:100%;border-collapse:collapse;table-layout:fixed">' +
        '<colgroup><col style="width:90px"><col><col style="width:150px"></colgroup>' + rows +
        '<tr style="border-top:2px solid ' + s.color + '"><td colspan="2" style="padding:8px 14px;font-size:13px;font-weight:800;text-align:right">' + s.label + ' \uD569\uACC4</td>' +
        '<td style="padding:8px 14px;text-align:right;font-size:14px;font-weight:800;color:' + s.color + '">' + _fmtW(sectionTotal) + '</td></tr></table>';
    });

    // 균형 확인
    var assetT = totals.asset || 0;
    var liabEqT = (totals.liability || 0) + (totals.equity || 0);
    var ok = assetT === liabEqT;
    h += '<div style="margin-top:16px;padding:12px 16px;border-radius:10px;display:flex;align-items:center;justify-content:space-between;' +
      'background:' + (ok ? 'rgba(34,197,94,.06);border:1.5px solid rgba(34,197,94,.2)' : 'rgba(239,68,68,.06);border:1.5px solid rgba(239,68,68,.2)') + '">' +
      '<div style="display:flex;align-items:center;gap:16px">' +
      '<span style="font-size:13px;font-weight:700">\uC790\uC0B0: ' + _fmtW(assetT) + '</span>' +
      '<span style="color:var(--text-muted)">=</span>' +
      '<span style="font-size:13px;font-weight:700">\uBD80\uCC44+\uC790\uBCF8: ' + _fmtW(liabEqT) + '</span></div>' +
      '<span style="font-size:12px;font-weight:700;color:' + (ok ? '#22c55e' : '#ef4444') + '">' + (ok ? '\u2705 \uADE0\uD615' : '\u274C \uBD88\uADE0\uD615') + '</span></div>';

    return h + '</div>';
  }

  /* ── 2. 손익계산서 ── */
  function _renderIS(accounts, vouchers, year) {
    var revAccts = accounts.filter(function (a) { return a.type === 'revenue'; });
    var expAccts = accounts.filter(function (a) { return a.type === 'expense'; });

    var h = '<div class="acct-card"><div class="acct-card-head" style="display:flex;align-items:center;justify-content:space-between">' +
      '<div style="display:flex;align-items:center;gap:8px"><i data-lucide="trending-up" style="width:16px;height:16px"></i>' +
      '<span style="font-weight:800">\uC190\uC775\uACC4\uC0B0\uC11C</span>' +
      '<span style="font-size:12px;color:var(--text-muted)">' + year + '.01.01 ~ ' + year + '.12.31</span></div>' +
      '<button class="btn" onclick="window.print()" style="font-size:11px;padding:4px 10px"><i data-lucide="printer" style="width:12px;height:12px"></i> \uC778\uC1C4</button></div>';

    // 수익
    var revTotal = 0;
    h += '<div style="margin:12px 0 4px;padding:0 14px;font-size:13px;font-weight:800;color:#22c55e;display:flex;align-items:center;gap:6px">' +
      '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#22c55e"></span>\uC218\uC775</div>' +
      '<table style="width:100%;border-collapse:collapse;table-layout:fixed">' +
      '<colgroup><col style="width:90px"><col><col style="width:150px"></colgroup>';
    revAccts.forEach(function (a) {
      var amt = _calcEndBalance(a.code, 'revenue', vouchers, []);
      if (amt === 0) return;
      revTotal += amt;
      h += '<tr><td style="padding:8px 14px;font-size:13px;color:var(--text-muted)">' + a.code + '</td>' +
        '<td style="padding:8px 14px;font-size:13px;font-weight:600">' + a.name + '</td>' +
        '<td style="padding:8px 14px;text-align:right;font-size:13px;font-weight:600;color:#22c55e">' + _fmtW(amt) + '</td></tr>';
    });
    h += '<tr style="border-top:2px solid #22c55e"><td colspan="2" style="padding:8px 14px;font-weight:800;text-align:right;font-size:13px">\uC218\uC775 \uD569\uACC4</td>' +
      '<td style="padding:8px 14px;text-align:right;font-size:14px;font-weight:800;color:#22c55e">' + _fmtW(revTotal) + '</td></tr></table>';

    // 비용
    var expTotal = 0;
    h += '<div style="margin:16px 0 4px;padding:0 14px;font-size:13px;font-weight:800;color:#ef4444;display:flex;align-items:center;gap:6px">' +
      '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#ef4444"></span>\uBE44\uC6A9</div>' +
      '<table style="width:100%;border-collapse:collapse;table-layout:fixed">' +
      '<colgroup><col style="width:90px"><col><col style="width:150px"></colgroup>';
    expAccts.forEach(function (a) {
      var amt = _calcEndBalance(a.code, 'expense', vouchers, []);
      if (amt === 0) return;
      expTotal += amt;
      h += '<tr><td style="padding:8px 14px;font-size:13px;color:var(--text-muted)">' + a.code + '</td>' +
        '<td style="padding:8px 14px;font-size:13px;font-weight:600">' + a.name + '</td>' +
        '<td style="padding:8px 14px;text-align:right;font-size:13px;font-weight:600;color:#ef4444">' + _fmtW(amt) + '</td></tr>';
    });
    h += '<tr style="border-top:2px solid #ef4444"><td colspan="2" style="padding:8px 14px;font-weight:800;text-align:right;font-size:13px">\uBE44\uC6A9 \uD569\uACC4</td>' +
      '<td style="padding:8px 14px;text-align:right;font-size:14px;font-weight:800;color:#ef4444">' + _fmtW(expTotal) + '</td></tr></table>';

    // 당기순이익
    var netIncome = revTotal - expTotal;
    var isProfit = netIncome >= 0;
    h += '<div style="margin-top:16px;padding:14px 18px;border-radius:10px;display:flex;align-items:center;justify-content:space-between;' +
      'background:' + (isProfit ? 'rgba(34,197,94,.06);border:1.5px solid rgba(34,197,94,.2)' : 'rgba(239,68,68,.06);border:1.5px solid rgba(239,68,68,.2)') + '">' +
      '<span style="font-size:14px;font-weight:800">\uB2F9\uAE30\uC21C' + (isProfit ? '\uC774\uC775' : '\uC190\uC2E4') + '</span>' +
      '<span style="font-size:18px;font-weight:800;color:' + (isProfit ? '#22c55e' : '#ef4444') + '">' + _fmtW(Math.abs(netIncome)) + '</span></div>';

    return h + '</div>';
  }

  /* ── 3. 합계잔액시산표 ── */
  function _renderTB(accounts, vouchers, balances, year) {
    var h = '<div class="acct-card"><div class="acct-card-head" style="display:flex;align-items:center;justify-content:space-between">' +
      '<div style="display:flex;align-items:center;gap:8px"><i data-lucide="table" style="width:16px;height:16px"></i>' +
      '<span style="font-weight:800">\uD569\uACC4\uC794\uC561\uC2DC\uC0B0\uD45C</span>' +
      '<span style="font-size:12px;color:var(--text-muted)">' + year + '\uB144\uB3C4</span></div>' +
      '<button class="btn" onclick="window.print()" style="font-size:11px;padding:4px 10px"><i data-lucide="printer" style="width:12px;height:12px"></i> \uC778\uC1C4</button></div>';

    var isMobTB = window.innerWidth < 768;
    /* ── 계정 데이터 계산 (공통) ── */
    var tbRows = [];
    var totalDr = 0, totalCr = 0, balDr = 0, balCr = 0;
    accounts.forEach(function (a) {
      var dr = 0, cr = 0;
      var ob = balances.find(function (b) { return b.accountCode === a.code; });
      if (ob) {
        if (a.type === 'asset' || a.type === 'expense') dr += ob.amount || 0;
        else cr += ob.amount || 0;
      }
      vouchers.forEach(function (v) {
        (v.entries || []).forEach(function (e) {
          if (e.accountCode === a.code) {
            if (e.side === 'debit') dr += e.amount;
            else cr += e.amount;
          }
        });
      });
      if (dr === 0 && cr === 0) return;
      totalDr += dr; totalCr += cr;
      var diff = dr - cr;
      var bDr = diff > 0 ? diff : 0;
      var bCr = diff < 0 ? -diff : 0;
      balDr += bDr; balCr += bCr;
      tbRows.push({ code: a.code, name: a.name, type: a.type, dr: dr, cr: cr, bDr: bDr, bCr: bCr });
    });
    var ok = totalDr === totalCr;

    var TYPE_COLORS = { asset: '#4f6ef7', liability: '#ef4444', equity: '#8b5cf6', expense: '#f59e0b', revenue: '#22c55e' };
    function _typeColor(t) { return TYPE_COLORS[t] || '#64748b'; }

    if (isMobTB) {
      /* ── 모바일: 카드 UI ── */
      h += '<div style="display:flex;flex-direction:column;gap:10px">';
      tbRows.forEach(function (r) {
        var cc = _typeColor(r.type);
        var netDr = r.bDr > 0;
        h +=
          '<div style="position:relative;border-radius:16px;overflow:hidden;background:var(--bg-card);border:1.5px solid var(--border-color);box-shadow:0 2px 8px rgba(0,0,0,.05);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)">' +
          '<div style="position:absolute;top:0;left:0;bottom:0;width:4px;background:' + cc + ';border-radius:16px 0 0 16px"></div>' +
          '<div style="padding:12px 14px 12px 18px">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">' +
              '<div>' +
                '<span style="font-size:11px;color:var(--text-muted);font-weight:600;margin-right:6px">' + r.code + '</span>' +
                '<span style="font-size:15px;font-weight:900;color:var(--text-primary)">' + r.name + '</span>' +
              '</div>' +
              '<span style="font-size:10px;font-weight:800;padding:2px 8px;border-radius:20px;background:' + cc + '18;color:' + cc + '">' + (netDr ? '\ucc28\ubcc0\uc794\uc561' : '\ub300\ubcc0\uc794\uc561') + '</span>' +
            '</div>' +
            '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">' +
              '<div style="text-align:center;padding:7px 4px;background:var(--bg-tertiary);border-radius:10px">' +
                '<div style="font-size:9px;font-weight:600;color:var(--text-muted);margin-bottom:2px">\ud569\uacc4\ucc28\ubcc0</div>' +
                '<div style="font-size:11.5px;font-weight:800;color:var(--text-primary)">' + (r.dr ? _fmtW(r.dr) : '-') + '</div>' +
              '</div>' +
              '<div style="text-align:center;padding:7px 4px;background:var(--bg-tertiary);border-radius:10px">' +
                '<div style="font-size:9px;font-weight:600;color:var(--text-muted);margin-bottom:2px">\ud569\uacc4\ub300\ubcc0</div>' +
                '<div style="font-size:11.5px;font-weight:800;color:var(--text-primary)">' + (r.cr ? _fmtW(r.cr) : '-') + '</div>' +
              '</div>' +
              '<div style="text-align:center;padding:7px 4px;border-radius:10px;background:' + (netDr ? 'rgba(79,110,247,.06)' : 'var(--bg-tertiary)') + '">' +
                '<div style="font-size:9px;font-weight:600;color:var(--text-muted);margin-bottom:2px">\uc794\uc561\ucc28\ubcc0</div>' +
                '<div style="font-size:11.5px;font-weight:800;color:#4f6ef7">' + (r.bDr ? _fmtW(r.bDr) : '-') + '</div>' +
              '</div>' +
              '<div style="text-align:center;padding:7px 4px;border-radius:10px;background:' + (!netDr && r.bCr ? 'rgba(239,68,68,.06)' : 'var(--bg-tertiary)') + '">' +
                '<div style="font-size:9px;font-weight:600;color:var(--text-muted);margin-bottom:2px">\uc794\uc561\ub300\ubcc0</div>' +
                '<div style="font-size:11.5px;font-weight:800;color:#ef4444">' + (r.bCr ? _fmtW(r.bCr) : '-') + '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
      });
      h += '</div>';
      /* 합계 카드 */
      h += '<div style="background:var(--bg-tertiary);border-radius:14px;padding:14px 16px;margin-top:6px">' +
        '<div style="font-size:12px;font-weight:800;color:var(--text-secondary);margin-bottom:10px;text-align:center">\ud569 \uacc4</div>' +
        '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">' +
          '<div style="text-align:center"><div style="font-size:9px;color:var(--text-muted);margin-bottom:2px">\ud569\uacc4\ucc28\ubcc0</div><div style="font-size:12px;font-weight:900;color:var(--text-primary)">' + _fmtW(totalDr) + '</div></div>' +
          '<div style="text-align:center"><div style="font-size:9px;color:var(--text-muted);margin-bottom:2px">\ud569\uacc4\ub300\ubcc0</div><div style="font-size:12px;font-weight:900;color:var(--text-primary)">' + _fmtW(totalCr) + '</div></div>' +
          '<div style="text-align:center"><div style="font-size:9px;color:var(--text-muted);margin-bottom:2px">\uc794\uc561\ucc28\ubcc0</div><div style="font-size:12px;font-weight:900;color:#4f6ef7">' + _fmtW(balDr) + '</div></div>' +
          '<div style="text-align:center"><div style="font-size:9px;color:var(--text-muted);margin-bottom:2px">\uc794\uc561\ub300\ubcc0</div><div style="font-size:12px;font-weight:900;color:#ef4444">' + _fmtW(balCr) + '</div></div>' +
        '</div>' +
        '<div style="margin-top:10px;padding:7px 12px;border-radius:8px;font-size:11px;font-weight:700;text-align:center;' +
        (ok ? 'background:rgba(34,197,94,.08);color:#22c55e;border:1px solid rgba(34,197,94,.2)">\u2705 \ucc28\ubcc0\ud569\uacc4 = \ub300\ubcc0\ud569\uacc4 (\uade0\ud615)' :
        'background:rgba(239,68,68,.08);color:#ef4444;border:1px solid rgba(239,68,68,.2)">\u274c \ubd88\uade0\ud615 (\ucc28\uc561: ' + _fmtW(totalDr - totalCr) + ')') +
        '</div>' +
      '</div>';
    } else {
      /* ── 데스크탑: 기존 테이블 ── */
      h += '<table style="width:100%;border-collapse:collapse;table-layout:fixed">' +
        '<colgroup><col style="width:80px"><col><col style="width:130px"><col style="width:130px"><col style="width:130px"><col style="width:130px"></colgroup>' +
        '<thead><tr style="background:var(--bg-tertiary);border-bottom:2px solid var(--border-color)">' +
        '<th style="padding:10px;text-align:left;font-size:12px" rowspan="2">\ucf54\ub4dc</th>' +
        '<th style="padding:10px;text-align:left;font-size:12px" rowspan="2">\uacc4\uc815\uacfc\ubaa9</th>' +
        '<th colspan="2" style="padding:6px 10px;text-align:center;font-size:12px;border-bottom:1px solid var(--border-color)">\ud569\uacc4</th>' +
        '<th colspan="2" style="padding:6px 10px;text-align:center;font-size:12px;border-bottom:1px solid var(--border-color)">\uc794\uc561</th></tr>' +
        '<tr style="background:var(--bg-tertiary)">' +
        '<th style="padding:6px 10px;text-align:right;font-size:11px">\ucc28\ubcc0</th><th style="padding:6px 10px;text-align:right;font-size:11px">\ub300\ubcc0</th>' +
        '<th style="padding:6px 10px;text-align:right;font-size:11px">\ucc28\ubcc0</th><th style="padding:6px 10px;text-align:right;font-size:11px">\ub300\ubcc0</th></tr></thead><tbody>';
      tbRows.forEach(function (r) {
        h += '<tr style="border-bottom:1px solid var(--border-color)">' +
          '<td style="padding:8px 10px;font-size:12px;color:var(--text-muted)">' + r.code + '</td>' +
          '<td style="padding:8px 10px;font-size:12.5px;font-weight:600">' + r.name + '</td>' +
          '<td style="padding:8px 10px;text-align:right;font-size:12.5px;white-space:nowrap">' + (r.dr ? _fmtW(r.dr) : '') + '</td>' +
          '<td style="padding:8px 10px;text-align:right;font-size:12.5px;white-space:nowrap">' + (r.cr ? _fmtW(r.cr) : '') + '</td>' +
          '<td style="padding:8px 10px;text-align:right;font-size:12.5px;color:#4f6ef7;font-weight:600;white-space:nowrap">' + (r.bDr ? _fmtW(r.bDr) : '') + '</td>' +
          '<td style="padding:8px 10px;text-align:right;font-size:12.5px;color:#ef4444;font-weight:600;white-space:nowrap">' + (r.bCr ? _fmtW(r.bCr) : '') + '</td></tr>';
      });
      h += '<tr style="border-top:2px solid var(--text-primary);background:var(--bg-tertiary)">' +
        '<td colspan="2" style="padding:10px;font-size:13px;font-weight:800;text-align:center">\ud569 \uacc4</td>' +
        '<td style="padding:10px;text-align:right;font-size:13px;font-weight:800;white-space:nowrap">' + _fmtW(totalDr) + '</td>' +
        '<td style="padding:10px;text-align:right;font-size:13px;font-weight:800;white-space:nowrap">' + _fmtW(totalCr) + '</td>' +
        '<td style="padding:10px;text-align:right;font-size:13px;font-weight:800;color:#4f6ef7;white-space:nowrap">' + _fmtW(balDr) + '</td>' +
        '<td style="padding:10px;text-align:right;font-size:13px;font-weight:800;color:#ef4444;white-space:nowrap">' + _fmtW(balCr) + '</td></tr>' +
        '</tbody></table>';
      h += '<div style="margin-top:12px;padding:8px 14px;border-radius:8px;font-size:12px;font-weight:700;text-align:center;' +
        (ok ? 'background:rgba(34,197,94,.06);color:#22c55e;border:1px solid rgba(34,197,94,.2)">\u2705 \ucc28\ubcc0\ud569\uacc4 = \ub300\ubcc0\ud569\uacc4 (\uade0\ud615)' :
        'background:rgba(239,68,68,.06);color:#ef4444;border:1px solid rgba(239,68,68,.2)">\u274c \ubd88\uade0\ud615 (\ucc28\uc561: ' + _fmtW(totalDr - totalCr) + ')') + '</div>';
    }
    return h + '</div>';
  }

  /* ── 4. 현금출납장 ── */
  function _renderCB(vouchers, balances, year) {
    var h = '<div class="acct-card"><div class="acct-card-head" style="display:flex;align-items:center;justify-content:space-between">' +
      '<div style="display:flex;align-items:center;gap:8px"><i data-lucide="banknote" style="width:16px;height:16px"></i>' +
      '<span style="font-weight:800">\uD604\uAE08\uCD9C\uB0A9\uC7A5</span>' +
      '<span style="font-size:12px;color:var(--text-muted)">' + year + '\uB144\uB3C4</span></div>' +
      '<button class="btn" onclick="window.print()" style="font-size:11px;padding:4px 10px"><i data-lucide="printer" style="width:12px;height:12px"></i> \uC778\uC1C4</button></div>';

    // 기초잔액
    var ob = balances.find(function (b) { return b.accountCode === '1010'; });
    var openBal = ob ? ob.amount : 0;
    var runBal = openBal;

    // 현금 관련 전표 시간순 정렬
    var cashTxns = [];
    vouchers.forEach(function (v) {
      (v.entries || []).forEach(function (e) {
        if (e.accountCode === '1010') {
          cashTxns.push({ date: v.date, desc: v.description, side: e.side, amount: e.amount });
        }
      });
    });
    cashTxns.sort(function (a, b) { return (a.date || '').localeCompare(b.date || ''); });

    var isMobCB = window.innerWidth < 768;

    if (isMobCB) {
      /* ── 모바일 카드 ── */
      /* 기초 카드 */
      h += '<div style="display:flex;flex-direction:column;gap:10px">';
      h += '<div style="border-radius:16px;overflow:hidden;background:var(--bg-card);border:1.5px solid var(--border-color);box-shadow:0 2px 8px rgba(0,0,0,.05)">' +
        '<div style="background:linear-gradient(135deg,rgba(79,110,247,.08),rgba(79,110,247,.02));padding:12px 16px;display:flex;align-items:center;justify-content:space-between">' +
          '<div>' +
            '<div style="font-size:11px;color:var(--text-muted);font-weight:600;margin-bottom:2px">' + year + '-01-01 &nbsp; \uae30\ucd08\uc794\uc561</div>' +
            '<div style="font-size:18px;font-weight:900;color:#4f6ef7">' + _fmtW(openBal) + '</div>' +
          '</div>' +
          '<div style="width:40px;height:40px;border-radius:12px;background:#4f6ef714;display:flex;align-items:center;justify-content:center;font-size:18px">\ud83c\udfe6</div>' +
        '</div></div>';

      var totalIn = 0, totalOut = 0;
      cashTxns.forEach(function (tx) {
        var inAmt = tx.side === 'debit' ? tx.amount : 0;
        var outAmt = tx.side === 'credit' ? tx.amount : 0;
        totalIn += inAmt; totalOut += outAmt;
        runBal += inAmt - outAmt;
        var isIn = inAmt > 0;
        var cc = isIn ? '#22c55e' : '#ef4444';
        var cbg = isIn ? 'rgba(34,197,94,.06)' : 'rgba(239,68,68,.06)';
        h += '<div style="position:relative;border-radius:16px;overflow:hidden;background:var(--bg-card);border:1.5px solid var(--border-color);box-shadow:0 2px 8px rgba(0,0,0,.05);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)">' +
          '<div style="position:absolute;top:0;left:0;bottom:0;width:4px;background:' + cc + ';border-radius:16px 0 0 16px"></div>' +
          '<div style="padding:12px 14px 12px 18px">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">' +
              '<div style="font-size:11.5px;color:var(--text-muted);font-weight:600">' + (tx.date || '') + '</div>' +
              '<span style="font-size:10.5px;font-weight:800;padding:2px 9px;border-radius:20px;background:' + cbg + ';color:' + cc + '">' + (isIn ? '\uc785\uae08' : '\ucd9c\uae08') + '</span>' +
            '</div>' +
            '<div style="font-size:14px;font-weight:800;color:var(--text-primary);margin-bottom:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + _esc(tx.desc || '') + '</div>' +
            '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">' +
              '<div style="text-align:center;padding:7px 4px;background:rgba(34,197,94,.06);border-radius:10px">' +
                '<div style="font-size:9px;font-weight:600;color:var(--text-muted);margin-bottom:2px">\uc785\uae08</div>' +
                '<div style="font-size:13px;font-weight:900;color:#22c55e">' + (inAmt ? _fmtW(inAmt) : '-') + '</div>' +
              '</div>' +
              '<div style="text-align:center;padding:7px 4px;background:rgba(239,68,68,.06);border-radius:10px">' +
                '<div style="font-size:9px;font-weight:600;color:var(--text-muted);margin-bottom:2px">\ucd9c\uae08</div>' +
                '<div style="font-size:13px;font-weight:900;color:#ef4444">' + (outAmt ? _fmtW(outAmt) : '-') + '</div>' +
              '</div>' +
              '<div style="text-align:center;padding:7px 4px;background:var(--bg-tertiary);border-radius:10px">' +
                '<div style="font-size:9px;font-weight:600;color:var(--text-muted);margin-bottom:2px">\uc794\uc561</div>' +
                '<div style="font-size:13px;font-weight:900;color:var(--text-primary)">' + _fmtW(runBal) + '</div>' +
              '</div>' +
            '</div>' +
          '</div></div>';
      });

      h += '</div>';
      /* 합계 요약 */
      h += '<div style="background:var(--bg-tertiary);border-radius:14px;padding:14px 16px;margin-top:6px">' +
        '<div style="font-size:12px;font-weight:800;color:var(--text-secondary);margin-bottom:10px;text-align:center">\ud569 \uacc4</div>' +
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">' +
          '<div style="text-align:center"><div style="font-size:9px;color:var(--text-muted);margin-bottom:2px">\uc785\uae08\ud569\uacc4</div><div style="font-size:13px;font-weight:900;color:#22c55e">' + _fmtW(totalIn) + '</div></div>' +
          '<div style="text-align:center;border-left:1px solid var(--border-color);border-right:1px solid var(--border-color)"><div style="font-size:9px;color:var(--text-muted);margin-bottom:2px">\ucd9c\uae08\ud569\uacc4</div><div style="font-size:13px;font-weight:900;color:#ef4444">' + _fmtW(totalOut) + '</div></div>' +
          '<div style="text-align:center"><div style="font-size:9px;color:var(--text-muted);margin-bottom:2px">\uc794\uc561</div><div style="font-size:13px;font-weight:900;color:#4f6ef7">' + _fmtW(runBal) + '</div></div>' +
        '</div>' +
      '</div>';
    } else {
      /* ── 데스크탑 테이블 ── */
      var totalIn = 0, totalOut = 0;
      h += '<table style="width:100%;border-collapse:collapse;table-layout:fixed">' +
        '<colgroup><col style="width:100px"><col><col style="width:110px"><col style="width:110px"><col style="width:120px"></colgroup>' +
        '<thead><tr style="background:var(--bg-tertiary);border-bottom:2px solid var(--border-color)">' +
        '<th style="padding:10px;text-align:left;font-size:12px">\ub0a0\uc9dc</th>' +
        '<th style="padding:10px;text-align:left;font-size:12px">\uc801\uc694</th>' +
        '<th style="padding:10px;text-align:right;font-size:12px">\uc785\uae08</th>' +
        '<th style="padding:10px;text-align:right;font-size:12px">\ucd9c\uae08</th>' +
        '<th style="padding:10px;text-align:right;font-size:12px">\uc794\uc561</th></tr></thead><tbody>';
      h += '<tr style="border-bottom:1px solid var(--border-color);background:var(--bg-tertiary)">' +
        '<td style="padding:8px 10px;font-size:12.5px;font-weight:700">' + year + '-01-01</td>' +
        '<td style="padding:8px 10px;font-size:12.5px;font-weight:700;color:var(--text-muted)">\uae30\ucd08\uc794\uc561</td>' +
        '<td></td><td></td>' +
        '<td style="padding:8px 10px;text-align:right;font-size:12.5px;font-weight:700">' + _fmtW(openBal) + '</td></tr>';
      cashTxns.forEach(function (tx) {
        var inAmt = tx.side === 'debit' ? tx.amount : 0;
        var outAmt = tx.side === 'credit' ? tx.amount : 0;
        totalIn += inAmt; totalOut += outAmt;
        runBal += inAmt - outAmt;
        h += '<tr style="border-bottom:1px solid var(--border-color)">' +
          '<td style="padding:8px 10px;font-size:12px;color:var(--text-muted)">' + (tx.date || '') + '</td>' +
          '<td style="padding:8px 10px;font-size:12.5px">' + _esc(tx.desc || '') + '</td>' +
          '<td style="padding:8px 10px;text-align:right;font-size:12.5px;color:#22c55e;font-weight:600">' + (inAmt ? _fmtW(inAmt) : '') + '</td>' +
          '<td style="padding:8px 10px;text-align:right;font-size:12.5px;color:#ef4444;font-weight:600;white-space:nowrap">' + (outAmt ? _fmtW(outAmt) : '') + '</td>' +
          '<td style="padding:8px 10px;text-align:right;font-size:12.5px;font-weight:700">' + _fmtW(runBal) + '</td></tr>';
      });
      h += '<tr style="border-top:2px solid var(--text-primary);background:var(--bg-tertiary)">' +
        '<td colspan="2" style="padding:10px;font-weight:800;text-align:center;font-size:13px">\ud569\uacc4</td>' +
        '<td style="padding:10px;text-align:right;font-weight:800;font-size:13px;color:#22c55e">' + _fmtW(totalIn) + '</td>' +
        '<td style="padding:10px;text-align:right;font-weight:800;font-size:13px;color:#ef4444">' + _fmtW(totalOut) + '</td>' +
        '<td style="padding:10px;text-align:right;font-weight:800;font-size:14px">' + _fmtW(runBal) + '</td></tr>' +
        '</tbody></table>';
    }
    if (cashTxns.length === 0) {
      h += '<div class="acct-empty" style="margin-top:12px">\uD604\uAE08 \uAC70\uB798 \uB0B4\uC5ED\uC774 \uC5C6\uC2B5\uB2C8\uB2E4</div>';
    }
    return h + '</div>';
  }

  /* ── 5. 거래처원장 ── */
  function _renderAL(vouchers, year) {
    var h = '<div class="acct-card"><div class="acct-card-head" style="display:flex;align-items:center;justify-content:space-between">' +
      '<div style="display:flex;align-items:center;gap:8px"><i data-lucide="building-2" style="width:16px;height:16px"></i>' +
      '<span style="font-weight:800">거래처원장</span>' +
      '<span style="font-size:12px;color:var(--text-muted)">' + year + '\ub144\ub3c4</span></div>' +
      '<button class="btn" onclick="window.print()" style="font-size:11px;padding:4px 10px"><i data-lucide="printer" style="width:12px;height:12px"></i> \uc778\uc1c4</button></div>';

    var byCounterpart = {};
    vouchers.forEach(function (v) {
      var cp = v.counterpart || '(\ubbf8\uc9c0\uc815)';
      if (!byCounterpart[cp]) byCounterpart[cp] = [];
      byCounterpart[cp].push(v);
    });

    var cpNames = Object.keys(byCounterpart).sort();
    if (cpNames.length === 0) {
      return h + '<div class="acct-empty">거래처 데이터가 없습니다</div></div>';
    }

    var isMobAL = window.innerWidth < 768;
    var TYPE = {
      ar:     { label: '\ubbf8\uc218\uae08(\uc678\uc0c1)', c: '#f59e0b', bg: 'rgba(245,158,11,.1)' },
      arCol:  { label: '\ud68c\uc218(\uc218\uae08)', c: '#22c55e', bg: 'rgba(34,197,94,.1)' },
      cash:   { label: '\ud604\uae08', c: '#4f6ef7', bg: 'rgba(79,110,247,.1)' },
      bank:   { label: '\uacc4\uc88c', c: '#4f6ef7', bg: 'rgba(79,110,247,.1)' },
      other:  { label: '\uae30\ud0c0', c: '#64748b', bg: 'rgba(100,116,139,.1)' }
    };

    function _txType(v) {
      var has1030D = false, has1030C = false;
      (v.entries || []).forEach(function(e) {
        if (e.accountCode === '1030' && e.side === 'debit')  has1030D = true;
        if (e.accountCode === '1030' && e.side === 'credit') has1030C = true;
      });
      if (has1030D) return 'ar';
      if (has1030C) return 'arCol';
      var pm = (v.paymentMethod || '');
      if (pm === '\ud604\uae08') return 'cash';
      if (pm === '\uacc4\uc88c\uc774\uccb4' || pm === '\uce74\ub4dc') return 'bank';
      return 'other';
    }

    cpNames.forEach(function (cp) {
      var txns = byCounterpart[cp].sort(function (a, b) { return (a.date || '').localeCompare(b.date || ''); });
      var cpDr = 0, cpCr = 0, arBal = 0, totalAR = 0, totalCol = 0;

      var rows = txns.map(function (v) {
        var dr = 0, cr = 0;
        (v.entries || []).forEach(function (e) {
          if (e.side === 'debit') dr += e.amount; else cr += e.amount;
        });
        var tt = _txType(v);
        if (tt === 'ar')    { arBal += dr; totalAR  += dr; }
        if (tt === 'arCol') { arBal -= cr; totalCol += cr; }
        cpDr += dr; cpCr += cr;
        return { v: v, dr: dr, cr: cr, tt: tt, arBal: arBal };
      });

      var arColor = arBal > 0 ? '#f59e0b' : arBal < 0 ? '#ef4444' : '#22c55e';

      /* ── 거래처 헤더 ── */
      h += '<div style="margin:16px 0 0;border-radius:16px;overflow:hidden;border:1.5px solid var(--border-color)">';
      h += '<div style="background:linear-gradient(135deg,rgba(79,110,247,.08),rgba(79,110,247,.02));padding:12px 16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">';
      h += '<div style="display:flex;align-items:center;gap:10px">';
      h += '<span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:10px;background:#4f6ef7;color:#fff;font-size:14px;font-weight:800">' + _esc(cp.charAt(0)) + '</span>';
      h += '<div><div style="font-size:15px;font-weight:900;color:var(--text-primary)">' + _esc(cp) + '</div>';
      h += '<div style="font-size:11px;color:var(--text-muted)">' + rows.length + '\uac74 \uac70\ub798</div></div></div>';
      /* AR 요약 */
      h += '<div style="display:flex;gap:12px;flex-wrap:wrap">';
      if (totalAR > 0) {
        h += '<div style="text-align:center"><div style="font-size:9px;color:var(--text-muted);margin-bottom:2px">\uc678\uc0c1\uc561</div><div style="font-size:13px;font-weight:900;color:#f59e0b">' + _fmtW(totalAR) + '</div></div>';
        h += '<div style="text-align:center"><div style="font-size:9px;color:var(--text-muted);margin-bottom:2px">\ud68c\uc218\uc561</div><div style="font-size:13px;font-weight:900;color:#22c55e">' + _fmtW(totalCol) + '</div></div>';
        h += '<div style="text-align:center"><div style="font-size:9px;color:var(--text-muted);margin-bottom:2px">\ubbf8\uc218\uc794\uc561</div><div style="font-size:13px;font-weight:900;color:' + arColor + '">' + _fmtW(arBal) + '</div></div>';
      }
      h += '</div></div>';

      if (isMobAL) {
        /* ── 모바일: 카드 리스트 ── */
        h += '<div style="display:flex;flex-direction:column;gap:8px;padding:10px 12px">';
        rows.forEach(function (r) {
          var t = TYPE[r.tt] || TYPE.other;
          h += '<div style="position:relative;border-radius:12px;background:var(--bg-card);border:1px solid var(--border-color);overflow:hidden">' +
            '<div style="position:absolute;top:0;left:0;bottom:0;width:3px;background:' + t.c + '"></div>' +
            '<div style="padding:10px 12px 10px 15px">' +
              '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">' +
                '<div style="font-size:11px;color:var(--text-muted);font-weight:600">' + (r.v.date || '') + '</div>' +
                '<span style="font-size:9.5px;font-weight:800;padding:2px 8px;border-radius:20px;background:' + t.bg + ';color:' + t.c + '">' + t.label + '</span>' +
              '</div>' +
              '<div style="font-size:13.5px;font-weight:800;color:var(--text-primary);margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + _esc(r.v.description || '') + '</div>' +
              '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">' +
                '<div style="text-align:center;padding:5px 0;background:rgba(79,110,247,.05);border-radius:8px"><div style="font-size:8.5px;color:var(--text-muted);margin-bottom:1px">\ucc28\ubcc0</div><div style="font-size:11.5px;font-weight:800;color:#4f6ef7">' + (r.dr ? _fmtW(r.dr) : '-') + '</div></div>' +
                '<div style="text-align:center;padding:5px 0;background:rgba(239,68,68,.05);border-radius:8px"><div style="font-size:8.5px;color:var(--text-muted);margin-bottom:1px">\ub300\ubcc0</div><div style="font-size:11.5px;font-weight:800;color:#ef4444">' + (r.cr ? _fmtW(r.cr) : '-') + '</div></div>' +
                '<div style="text-align:center;padding:5px 0;background:rgba(245,158,11,.05);border-radius:8px"><div style="font-size:8.5px;color:var(--text-muted);margin-bottom:1px">\ubbf8\uc218\uc794\uc561</div><div style="font-size:11.5px;font-weight:800;color:' + (r.arBal > 0 ? '#f59e0b' : '#22c55e') + '">' + _fmtW(r.arBal) + '</div></div>' +
              '</div>' +
            '</div></div>';
        });
        h += '</div>';
      } else {
        /* ── 데스크탑: 테이블 ── */
        h += '<table style="width:100%;border-collapse:collapse;table-layout:fixed">' +
          '<colgroup><col style="width:90px"><col><col style="width:110px"><col style="width:100px"><col style="width:100px"><col style="width:100px"></colgroup>' +
          '<thead><tr style="background:var(--bg-tertiary);border-bottom:1px solid var(--border-color)">' +
          '<th style="padding:7px 10px;text-align:left;font-size:11px">\ub0a0\uc9dc</th>' +
          '<th style="padding:7px 10px;text-align:left;font-size:11px">\uc801\uc694</th>' +
          '<th style="padding:7px 10px;text-align:left;font-size:11px">\uac70\ub798\uc720\ud615</th>' +
          '<th style="padding:7px 10px;text-align:right;font-size:11px">\ucc28\ubcc0</th>' +
          '<th style="padding:7px 10px;text-align:right;font-size:11px">\ub300\ubcc0</th>' +
          '<th style="padding:7px 10px;text-align:right;font-size:11px">\ubbf8\uc218\uc794\uc561</th>' +
          '</tr></thead><tbody>';

        rows.forEach(function (r) {
          var t = TYPE[r.tt] || TYPE.other;
          h += '<tr style="border-bottom:1px solid var(--border-color)">' +
            '<td style="padding:7px 10px;font-size:12px;color:var(--text-muted)">' + (r.v.date || '') + '</td>' +
            '<td style="padding:7px 10px;font-size:12px">' + _esc(r.v.description || '') + '</td>' +
            '<td style="padding:7px 10px"><span style="font-size:10px;font-weight:800;padding:2px 8px;border-radius:20px;background:' + t.bg + ';color:' + t.c + '">' + t.label + '</span></td>' +
            '<td style="padding:7px 10px;text-align:right;font-size:12px;font-weight:600;color:#4f6ef7">' + (r.dr ? _fmtW(r.dr) : '') + '</td>' +
            '<td style="padding:7px 10px;text-align:right;font-size:12px;font-weight:600;color:#ef4444">' + (r.cr ? _fmtW(r.cr) : '') + '</td>' +
            '<td style="padding:7px 10px;text-align:right;font-size:12px;font-weight:700;color:' + (r.arBal > 0 ? '#f59e0b' : '#22c55e') + '">' + _fmtW(r.arBal) + '</td></tr>';
        });

        h += '<tr style="border-top:1.5px solid var(--text-primary);background:var(--bg-tertiary)">' +
          '<td colspan="3" style="padding:7px 10px;font-weight:700;text-align:right;font-size:12px">\uc18c\uacc4</td>' +
          '<td style="padding:7px 10px;text-align:right;font-weight:700;font-size:12px;color:#4f6ef7">' + _fmtW(cpDr) + '</td>' +
          '<td style="padding:7px 10px;text-align:right;font-weight:700;font-size:12px;color:#ef4444">' + _fmtW(cpCr) + '</td>' +
          '<td style="padding:7px 10px;text-align:right;font-weight:800;font-size:12px;color:' + arColor + '">' + _fmtW(arBal) + '</td>' +
          '</tr></tbody></table>';
      }

      h += '</div>'; /* counterpart block */
    });

    return h + '</div>';
  }

    function renderAcctPayment() {
    var el = document.getElementById('acct-payment');
    if (!el) return;
    var vouchers = _vouchers().filter(function (v) { return _isInYear(v.date); }).sort(function (a, b) { return (b.date || '').localeCompare(a.date || '') || (b.createdAt || '').localeCompare(a.createdAt || ''); });

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
          '<table class="acct-entry-table" style="width:100%;table-layout:fixed;border-collapse:collapse">' +
          '<colgroup><col style="width:80px"><col><col style="width:120px"></colgroup>' +
          '<thead><tr><th style="text-align:left">구분</th><th style="text-align:left">계정과목</th><th style="text-align:right">금액</th></tr></thead>' +
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

    el.innerHTML = '<div style="padding-bottom:80px">' + html + '</div>';
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
        '<select class="form-input" style="flex:.8"><option value="debit"' + (e.side === 'debit' ? ' selected' : '') + '>\uCC28\uBCC0</option><option value="credit"' + (e.side === 'credit' ? ' selected' : '') + '>\uB300\uBCC0</option></select>' +
        '<select class="form-input" style="flex:2">' + acctOptions.replace('value="' + e.accountCode + '"', 'value="' + e.accountCode + '" selected') + '</select>' +
        '<input class="form-input" type="text" placeholder="\uAE08\uC561" style="flex:1" value="' + _fmtInput(e.amount || '') + '" oninput="this.value = ACCT.fmtInput(this.value)">' +
        '<button class="btn-icon-sm delete" onclick="this.parentElement.remove()" title="\uC0AD\uC81C"><i data-lucide="x" class="icon-sm"></i></button>' +
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
        var rawV = input.value || '';
        var amt = parseInt(rawV.replace(/,/g, '')) || 0;
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
    renderBudget: renderAcctBudget,
    renderBalance: renderAcctBalance,
    renderReports: renderAcctReports,
    switchReportTab: switchReportTab,
    saveAllBalances: saveAllBalances,
    copyPrevYearBalance: copyPrevYearBalance,
    _refreshYear: _refreshYear,
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
    _acItemName: _acItemName,
    _acItemKeydown: _acItemKeydown,
    _acSelect: _acSelect,
    _acHide: _acHide,
    fmtInput: _fmtInput,
    // 품의
    openApprovalModal: openApprovalModal,
    openApprovalEditModal: openApprovalEditModal,
    closeApprovalModal: closeApprovalModal,
    submitApproval: submitApproval,
    onAmBudgetCatChange: onAmBudgetCatChange,
    onAmBudgetItemChange: onAmBudgetItemChange,
    approveItem: approveItem,
    rejectItem: rejectItem,
    openApproveConfirm: openApproveConfirm,
    closeApproveConfirm: closeApproveConfirm,
    confirmApprove: confirmApprove,
    onApvBudgetCatChange: onApvBudgetCatChange,
    onApvBudgetItemChange: onApvBudgetItemChange,
    resubmitApproval: resubmitApproval,
    deleteApproval: deleteApproval,
    printApproval: printApproval,
    openEvidenceFromApproval: openEvidenceFromApproval,
    switchApprovalTab: switchApprovalTab,
    // 출금전표 상세
    openWithdrawalDetail: openWithdrawalDetail,
    closeWithdrawalDetail: closeWithdrawalDetail,
    saveWithdrawalDetail: saveWithdrawalDetail,
    printWithdrawalDetail: printWithdrawalDetail,
    addWithdrawalEvidence: addWithdrawalEvidence,
    removeEvidence: removeEvidence,
    // 입출금
    autoSuggestAccount: autoSuggestAccount,
    fillExpenseFromApproval: fillExpenseFromApproval,
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

  window.AcctModule = window.ACCT;

  // 글로벌 함수 노출 (사이드바/헤더에서 직접 호출)
  window.enterAccountingMode = enterAccountingMode;
  window.exitAccountingMode = exitAccountingMode;
  window.showAcctPage = showAcctPage;

})();
