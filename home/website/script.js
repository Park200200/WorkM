/* ═══════════════════════════════════════════════
   WorkM Homepage – Visitor-Facing Script
   관리자 패널 localStorage 설정을 읽어 홈페이지 렌더링
   다크/라이트 모드 동시 지원
═══════════════════════════════════════════════ */

/* ── 공지사항 아코디언 토글 (전역) ── */
window.hpNoticeToggle = function (hd) {
  var body = hd.nextElementSibling;
  if (!body) return;
  var arr = hd.querySelector('.hp-nacc-arr');
  var isOpen = body.style.maxHeight && body.style.maxHeight !== '0' && body.style.maxHeight !== '0px';
  if (isOpen) {
    body.style.maxHeight = '0px';
    body.style.overflow = 'hidden';
    if (arr) arr.style.transform = '';
    hd.style.background = '';
  } else {
    body.style.overflow = 'visible';
    body.style.maxHeight = body.scrollHeight + 'px';
    if (arr) arr.style.transform = 'rotate(90deg)';
    hd.style.background = 'rgba(239,68,68,.04)';
  }
};

/* ═══════════════════════════════════════════════
   자유게시판 – 사이트 전역 함수
   localStorage board_items (cat=free) 기반
═══════════════════════════════════════════════ */
(function(){

  function _fbAll() {
    try { return JSON.parse(localStorage.getItem('board_items') || '[]'); } catch(e){ return []; }
  }
  function _fbSave(all) {
    try { localStorage.setItem('board_items', JSON.stringify(all)); } catch(e){}
  }
  function _fbFree(all) { return all.filter(function(i){ return i.cat === 'free'; }); }

  /* 자유게시판 컨테이너 찾기 */
  function _fbContainer() { return document.getElementById('hp-free-board'); }

  /* 전체 재렌더 */
  function _fbRerender() {
    var c = _fbContainer(); if (!c) return;
    c.innerHTML = _fbBuildList(_fbFree(_fbAll()));
  }

  /* 게시물 목록 HTML 생성 */
  function _fbBuildList(items) {
    if (!items.length) return '<p style="text-align:center;color:var(--hp-text-muted);padding:30px 0;font-size:14px">등록된 게시글이 없습니다. 첫 번째 글을 작성해보세요!</p>';
    return items.map(function(it) {
      var cmts = it.comments || [];
      var pinTag = it.featured ? '<span style="color:#f59e0b;margin-right:3px">📌</span>' : '';
      /* 본문 영역 */
      var bodyHtml = '<div style="padding:18px 20px 10px;border-top:1px solid rgba(0,0,0,.07);background:var(--hp-bg-card2,#f9fafb)">';
      bodyHtml += '<div style="font-size:14px;color:var(--hp-text);line-height:1.8;white-space:pre-wrap;margin-bottom:14px">' + _fbEsc(it.content||'') + '</div>';
      if (it.img) {
        bodyHtml += '<img src="' + _fbEscA(it.img) + '" style="max-width:100%;border-radius:8px;margin-bottom:10px" loading="lazy">';
        if (it.imgCap) bodyHtml += '<div style="font-size:11px;color:var(--hp-text-muted);text-align:center;margin-bottom:12px">' + _fbEsc(it.imgCap) + '</div>';
      }
      /* 댓글 목록 */
      bodyHtml += '<div style="border-top:1px solid rgba(0,0,0,.07);padding-top:14px;margin-top:6px">';
      bodyHtml += '<div style="font-size:12px;font-weight:700;color:var(--hp-text-muted);margin-bottom:10px">💬 댓글 ' + cmts.length + '개</div>';
      if (cmts.length) {
        bodyHtml += cmts.map(function(c, ci) {
          return '<div style="display:flex;gap:10px;margin-bottom:10px;align-items:flex-start">' +
            '<div style="width:30px;height:30px;border-radius:50%;background:#6366f1;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0">' + _fbEsc(c.author||'?').charAt(0) + '</div>' +
            '<div style="flex:1">' +
              '<div style="font-size:12px"><span style="font-weight:700;color:var(--hp-text)">' + _fbEsc(c.author||'익명') + '</span><span style="color:var(--hp-text-muted);margin-left:8px">' + (c.date||'') + '</span>' +
              '<button onclick="hpFreeDelComment(\''+it.id+'\','+ci+')" style="float:right;border:none;background:none;font-size:11px;color:#ef4444;cursor:pointer">삭제</button></div>' +
              '<div style="font-size:13px;color:var(--hp-text);line-height:1.6;margin-top:3px;white-space:pre-wrap">' + _fbEsc(c.content||'') + '</div>' +
            '</div>' +
            '</div>';
        }).join('');
      } else {
        bodyHtml += '<div style="font-size:13px;color:var(--hp-text-muted);padding:8px 0">아직 댓글이 없습니다.</div>';
      }
      /* 댓글 입력 */
      bodyHtml += '<div id="cmt-'+it.id+'" style="margin-top:12px">';
      bodyHtml += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px">';
      bodyHtml += '<input id="cmt-author-'+it.id+'" type="text" placeholder="이름" style="padding:7px 10px;border:1.5px solid rgba(0,0,0,.12);border-radius:8px;font-size:12px;background:var(--hp-bg,#fff);color:var(--hp-text);outline:none">';
      bodyHtml += '<input id="cmt-pwd-'+it.id+'" type="password" placeholder="비밀번호(삭제용)" style="padding:7px 10px;border:1.5px solid rgba(0,0,0,.12);border-radius:8px;font-size:12px;background:var(--hp-bg,#fff);color:var(--hp-text);outline:none">';
      bodyHtml += '</div>';
      bodyHtml += '<div style="display:flex;gap:6px">';
      bodyHtml += '<textarea id="cmt-content-'+it.id+'" rows="2" placeholder="댓글을 입력하세요..." style="flex:1;padding:8px 10px;border:1.5px solid rgba(0,0,0,.12);border-radius:8px;font-size:12px;background:var(--hp-bg,#fff);color:var(--hp-text);resize:none;outline:none;font-family:inherit"></textarea>';
      bodyHtml += '<button onclick="hpFreeComment(\''+it.id+'\')" style="padding:8px 14px;border:none;border-radius:8px;background:#6366f1;color:#fff;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap">등록</button>';
      bodyHtml += '</div></div>';
      bodyHtml += '</div></div>';
      return '<div class="hp-free-item" style="border-bottom:1px solid rgba(0,0,0,.07)">' +
        '<div onclick="hpFreeToggle(\''+it.id+'\')" style="display:flex;align-items:center;gap:10px;padding:13px 16px;cursor:pointer;transition:background .15s;user-select:none" onmouseover="this.style.background=\'rgba(99,102,241,.04)\'" onmouseout="this.style.background=\'\' ">' +
        '<span style="flex:1;font-size:14px;font-weight:600;color:var(--hp-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + pinTag + _fbEsc(it.title) + '</span>' +
        '<span style="font-size:12px;color:var(--hp-text-muted);white-space:nowrap;flex-shrink:0">' + _fbEsc(it.author||'익명') + '</span>' +
        '<span style="font-size:12px;color:var(--hp-text-muted);white-space:nowrap;flex-shrink:0;margin-left:10px">' + (it.regDate||'') + '</span>' +
        '<span style="font-size:12px;color:var(--hp-text-muted);white-space:nowrap;flex-shrink:0;margin-left:10px">👁 ' + (it.views||0) + '</span>' +
        '<span style="font-size:12px;color:#6366f1;white-space:nowrap;flex-shrink:0;margin-left:10px">💬 ' + cmts.length + '</span>' +
        '<span id="hp-free-arr-'+it.id+'" style="font-size:11px;color:var(--hp-text-muted);margin-left:8px;flex-shrink:0;transition:transform .25s">&#9658;</span>' +
        '</div>' +
        '<div id="hp-free-bd-'+it.id+'" style="max-height:0px;overflow:hidden;transition:max-height .4s ease">' + bodyHtml + '</div>' +
        '</div>';
    }).join('');
  }

  /* 텍스트 이스케이프 */
  function _fbEsc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function _fbEscA(s) { return String(s).replace(/"/g,'&quot;'); }

  /* 날짜 문자열 */
  function _fbNow() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }

  /* ── 글쓰기 폼 토글 ── */
  window.hpFreeToggleWrite = function() {
    var form = document.getElementById('hp-free-write-form');
    var btn  = document.getElementById('hp-free-write-btn');
    if (!form) return;
    var isOpen = form.style.maxHeight && form.style.maxHeight !== '0px';
    if (isOpen) {
      form.style.maxHeight = '0px';
      form.style.overflow = 'hidden';
      if (btn) btn.textContent = '✏️ 글쓰기';
    } else {
      form.style.overflow = 'visible';
      form.style.maxHeight = form.scrollHeight + 400 + 'px';
      if (btn) btn.textContent = '✕ 닫기';
    }
  };

  /* ── 새 게시글 등록 ── */
  window.hpFreePost = function() {
    var g = function(id){ var e=document.getElementById(id); return e ? e.value.trim() : ''; };
    var author  = g('hp-free-w-author')  || '익명';
    var title   = g('hp-free-w-title');
    var content = g('hp-free-w-content');
    var pwd     = g('hp-free-w-pwd');
    if (!title)   { alert('제목을 입력하세요.'); return; }
    if (!content) { alert('내용을 입력하세요.'); return; }
    var all = _fbAll();
    all.unshift({
      id: 'brd' + Date.now(), cat: 'free',
      title: title, content: content, author: author, pwd: pwd,
      regDate: _fbNow(), views: 0, comments: []
    });
    _fbSave(all);
    /* 입력 초기화 */
    ['hp-free-w-author','hp-free-w-title','hp-free-w-content','hp-free-w-pwd'].forEach(function(id){
      var e=document.getElementById(id); if(e) e.value='';
    });
    window.hpFreeToggleWrite();
    _fbRerender();
  };

  /* ── 게시글 펼치기/접기 ── */
  window.hpFreeToggle = function(id) {
    var bd  = document.getElementById('hp-free-bd-' + id);
    var arr = document.getElementById('hp-free-arr-' + id);
    if (!bd) return;
    /* 조회수 +1 */
    var all = _fbAll();
    var it = all.find ? all.find(function(i){ return i.id===id; }) : (function(){ for(var i=0;i<all.length;i++) if(all[i].id===id) return all[i]; }());
    if (!it) return;
    var isOpen = bd.style.maxHeight && bd.style.maxHeight !== '0px';
    if (isOpen) {
      bd.style.maxHeight = '0px';
      bd.style.overflow = 'hidden';
      if (arr) arr.style.transform = '';
    } else {
      it.views = (it.views||0) + 1;
      _fbSave(all);
      bd.style.overflow = 'visible';
      bd.style.maxHeight = bd.scrollHeight + 600 + 'px';
      if (arr) arr.style.transform = 'rotate(90deg)';
    }
  };

  /* ── 댓글 등록 ── */
  window.hpFreeComment = function(postId) {
    var g = function(id){ var e=document.getElementById(id); return e ? e.value.trim() : ''; };
    var content = g('cmt-content-' + postId);
    if (!content) { alert('댓글 내용을 입력하세요.'); return; }
    var all = _fbAll();
    for (var i=0; i<all.length; i++) {
      if (all[i].id === postId) {
        if (!all[i].comments) all[i].comments = [];
        all[i].comments.push({
          author:  g('cmt-author-' + postId) || '익명',
          content: content,
          pwd:     g('cmt-pwd-' + postId),
          date:    _fbNow()
        });
        break;
      }
    }
    _fbSave(all);
    /* 해당 아이템 본문 높이 재설정 후 내용 갱신 */
    var bd = document.getElementById('hp-free-bd-' + postId);
    var prevHeight = bd ? bd.style.maxHeight : null;
    _fbRerender();
    /* 갱신 후 다시 열기 */
    var bd2 = document.getElementById('hp-free-bd-' + postId);
    var arr2 = document.getElementById('hp-free-arr-' + postId);
    if (bd2 && prevHeight && prevHeight !== '0px') {
      bd2.style.overflow = 'visible';
      bd2.style.maxHeight = bd2.scrollHeight + 600 + 'px';
      if (arr2) arr2.style.transform = 'rotate(90deg)';
    }
  };

  /* ── 댓글 삭제 ── */
  window.hpFreeDelComment = function(postId, idx) {
    var pwd = prompt('비밀번호를 입력하세요 (비밀번호 없이 등록한 경우 빈칸으로 확인)');
    if (pwd === null) return;
    var all = _fbAll();
    for (var i=0; i<all.length; i++) {
      if (all[i].id === postId && all[i].comments) {
        var c = all[i].comments[idx];
        if (c && (c.pwd === pwd || (!c.pwd && pwd === ''))) {
          all[i].comments.splice(idx, 1);
          _fbSave(all);
          var bd  = document.getElementById('hp-free-bd-' + postId);
          var arr = document.getElementById('hp-free-arr-' + postId);
          var wasOpen = bd && bd.style.maxHeight !== '0px';
          _fbRerender();
          if (wasOpen) {
            var bd2 = document.getElementById('hp-free-bd-' + postId);
            var arr2 = document.getElementById('hp-free-arr-' + postId);
            if (bd2) { bd2.style.overflow='visible'; bd2.style.maxHeight = bd2.scrollHeight+600+'px'; }
            if (arr2) arr2.style.transform = 'rotate(90deg)';
          }
        } else { alert('비밀번호가 틀렸습니다.'); }
        break;
      }
    }
  };

  /* ── 게시글 삭제 ── */
  window.hpFreeDelPost = function(postId) {
    var pwd = prompt('게시글 비밀번호를 입력하세요');
    if (pwd === null) return;
    var all = _fbAll();
    var idx = -1;
    for (var i=0; i<all.length; i++) { if(all[i].id===postId){ idx=i; break; } }
    if (idx < 0) return;
    var it = all[idx];
    if (it.pwd !== pwd && !((!it.pwd) && pwd === '')) { alert('비밀번호가 틀렸습니다.'); return; }
    all.splice(idx, 1);
    _fbSave(all);
    _fbRerender();
  };

  /* IIFE 외부에서 접근 가능하게 노출 */
  window._fbBuildListRef = _fbBuildList;
  window._fbRerender     = _fbRerender;

}());


(function () {
  'use strict';

  /* ══════════════════════════
     설정 로드 유틸
  ══════════════════════════ */
  function getLS(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback || null;
      return JSON.parse(raw);
    } catch (e) { return fallback || null; }
  }

  function getLSRaw(key) {
    return localStorage.getItem(key) || '';
  }

  /* ══════════════════════════
     테마 관리 (다크/라이트)
  ══════════════════════════ */
  function initTheme() {
    // 우선순위: 1) 홈페이지 전용 설정 → 2) 관리자패널 테마 → 3) OS 선호 → 4) light
    var saved = getLSRaw('hp_website_theme');
    if (!saved) {
      var adminTheme = getLSRaw('ws_theme');
      if (adminTheme === 'dark') saved = 'dark';
      else if (adminTheme === 'light') saved = 'light';
    }
    if (!saved) {
      saved = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    applyTheme(saved);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    var btn = document.getElementById('hpThemeToggle');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme') || 'light';
    var next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('hp_website_theme', next); } catch (e) { }
  }

  /* ══════════════════════════
     1. 리벳 바 (공지)
  ══════════════════════════ */
  function renderRivet() {
    var el = document.getElementById('hpRivet');
    if (!el) return;
    var data = getLS('hp_rivet');
    if (!data || !data.tags || !data.tags.length) {
      el.style.display = 'none';
      updateLayout();
      return;
    }
    el.style.display = 'flex';
    el.style.background = data.bgColor || '#1e40af';
    el.style.color = data.fontColor || '#ffffff';
    el.style.fontSize = (data.fontSize || 13) + 'px';
    el.style.fontWeight = data.fontWeight || 400;
    el.style.textAlign = data.align || 'center';
    el.style.justifyContent = { left: 'flex-start', center: 'center', right: 'flex-end' }[data.align] || 'center';

    var html = '<div class="rivet-content">';
    data.tags.forEach(function (tag, i) {
      if (i > 0) html += '<span class="rivet-dot"></span>';
      html += '<span style="white-space:pre">' + escHtml(tag) + '</span>';
    });
    html += '</div>';
    el.innerHTML = html;
    updateLayout();
  }

  /* ══════════════════════════
     2. 헤더 (로고 + 메인메뉴)
  ══════════════════════════ */
  function renderHeader() {
    var headerEl = document.getElementById('hpHeader');
    var navEl = document.getElementById('hpNav');
    var logoEl = document.getElementById('hpLogo');
    if (!headerEl) return;

    /* ── 로고 (반응형: 가로=PC, 세로=모바일) ── */
    var logoH = getLSRaw('hp_logo_top_h') || getLSRaw('hp_logo_hp_logo_top_h');
    var logoV = getLSRaw('hp_logo_top_v') || getLSRaw('hp_logo_hp_logo_top_v');
    var logoWidthH = getLSRaw('hp_logo_width_hp_logo_top_h');
    var logoWidthV = getLSRaw('hp_logo_width_hp_logo_top_v');
    if (logoEl) {
      if (logoH || logoV) {
        var logoHtml = '';
        if (logoH && logoV) {
          var styleH = logoWidthH ? 'width:' + logoWidthH + 'px;height:auto' : '';
          var styleV = logoWidthV ? 'width:' + logoWidthV + 'px;height:auto' : '';
          logoHtml += '<img class="hp-logo-h" src="' + logoH + '" alt="Logo"' + (styleH ? ' style="' + styleH + '"' : '') + '>';
          logoHtml += '<img class="hp-logo-v" src="' + logoV + '" alt="Logo"' + (styleV ? ' style="' + styleV + '"' : '') + '>';
        } else if (logoH) {
          var styleH2 = logoWidthH ? 'width:' + logoWidthH + 'px;height:auto' : '';
          logoHtml += '<img src="' + logoH + '" alt="Logo"' + (styleH2 ? ' style="' + styleH2 + '"' : '') + '>';
        } else {
          var styleV2 = logoWidthV ? 'width:' + logoWidthV + 'px;height:auto' : '';
          logoHtml += '<img src="' + logoV + '" alt="Logo"' + (styleV2 ? ' style="' + styleV2 + '"' : '') + '>';
        }
        logoEl.innerHTML = logoHtml;
      } else {
        logoEl.innerHTML = '<span class="logo-text">WorkM</span>';
      }
    }

    /* ── 메뉴 항목 & 스타일 ── */
    var menuData = getLS('hp_mainmenu');
    var menuSettings = getLS('hp_menu_settings');
    var menus = [];
    var settings = {
      bg: '#ffffff', fc: '#1a1a2e', fs: 15, fw: 600, h: 64, gap: 28,
      align: 'center', opacity: 100
    };

    if (menuData) {
      if (Array.isArray(menuData.menus) && menuData.menus.length) {
        menus = menuData.menus.map(function (m) { return typeof m === 'string' ? m : (m.name || m.label || ''); }).filter(Boolean);
      }
      if (menuData.settings) {
        Object.keys(menuData.settings).forEach(function (k) { settings[k] = menuData.settings[k]; });
      }
    }

    if (menuSettings) {
      Object.keys(menuSettings).forEach(function (k) { settings[k] = menuSettings[k]; });
    }

    if (!menus.length) {
      var items2 = getLS('hp_menu_items');
      if (Array.isArray(items2) && items2.length) {
        menus = items2.map(function (m) { return typeof m === 'string' ? m : (m.name || ''); }).filter(Boolean);
      }
    }
    if (!menus.length) menus = ['홈', '회사소개', '서비스', '포트폴리오', '공지사항', '문의하기'];

    // 헤더 스타일
    var opacityVal = parseInt(settings.opacity, 10);
    if (isNaN(opacityVal)) opacityVal = 100;
    var bgColor = settings.bg || '#ffffff';
    if (opacityVal < 100) {
      var rgb = hexToRgb(bgColor);
      if (rgb) bgColor = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + (opacityVal / 100).toFixed(2) + ')';
    }

    headerEl.style.background = bgColor;
    headerEl.style.minHeight = (settings.h || 64) + 'px';

    // 투명도에 비례해 blur 조절 (투명할수록 blur 감소 → 뒤 이미지 선명)
    var blurPx = Math.round((opacityVal / 100) * 14);
    headerEl.style.backdropFilter = 'blur(' + blurPx + 'px)';
    headerEl.style.webkitBackdropFilter = 'blur(' + blurPx + 'px)';

    var jc = settings.align || 'center';
    if (jc === 'left') jc = 'flex-start';
    else if (jc === 'right') jc = 'flex-end';
    else if (jc === 'space') jc = 'space-between';

    // 메뉴 상세 데이터 (클릭 시 URL 이동 + 서브메뉴)
    var menuDetails = getLS('hp_menu_details', {});

    /* getSolutionLabel: 통합 솔루션 목록(_solutionItemsForPage)에서 라벨 조회 */
    function getSolutionLabel(id) {
      var info = getSolPageInfo(id);
      return info.label || id || '솔루션';
    }

    /* ── 서브메뉴 항목 추출 헬퍼 (sets 구조 + rows 구조 둘 다 지원) ── */
    function getSubItems(detail, menuIdx) {
      var items = [];
      // 1) sets 구조: [{name, rows, type, solution}, ...]
      if (Array.isArray(detail.sets) && detail.sets.length) {
        detail.sets.forEach(function (s, si) {
          if (s.type === 'solution' && s.solution) {
            var solLabel = s.name || getSolutionLabel(s.solution);
            items.push({
              name: solLabel,
              url: '#submenu-' + menuIdx + '-' + si,
              blank: false,
              isSolution: true,
              solutionId: s.solution
            });
          } else {
            // 이미지형: 서브메뉴 페이지로 라우팅 (이미지가 있으면 페이지 표시, 없으면 URL 동작)
            var hasImages = s.rows && s.rows.length > 0 && s.rows.some(function (r) { return r.imgH || r.imgV; });
            var subUrl = hasImages
              ? '#submenu-' + menuIdx + '-' + si
              : (s.rows && s.rows[0] && s.rows[0].url) || '#';
            items.push({
              name: s.name || '서브메뉴',
              url: subUrl,
              blank: (!hasImages && s.rows && s.rows[0] && s.rows[0].blank) || false
            });
          }
        });
      }
      // 2) rows 구조: [{desc, url, blank, imgH, imgV}, ...]
      else if (Array.isArray(detail.rows) && detail.rows.length) {
        detail.rows.forEach(function (r) {
          items.push({ name: r.desc || r.name || (r.url || '서브메뉴'), url: r.url || '#', blank: r.blank || false });
        });
      }
      return items;
    }

    /* ── 메가메뉴 전체 데이터 준비 ── */
    var megaData = [];
    var hasMega = false;
    menus.forEach(function (name, i) {
      var detail = menuDetails[i] || {};
      var subs = getSubItems(detail, i);
      megaData.push({ name: name, detail: detail, subs: subs });
      if (subs.length > 0) hasMega = true;
    });

    if (navEl) {
      navEl.style.justifyContent = jc;
      navEl.style.gap = (settings.gap || 28) + 'px';
      navEl.innerHTML = '';

      menus.forEach(function (name, i) {
        var detail = menuDetails[i] || {};
        var href = detail.url || '#';

        var a = document.createElement('a');
        a.href = escAttr(href);
        if (detail.blank) a.target = '_blank';
        a.style.cssText = 'font-size:' + (settings.fs || 15) + 'px;color:' + (settings.fc || '#1a1a2e') + ';position:relative;font-weight:' + (settings.fw || 600) + ';padding:6px 2px;transition:opacity .2s';
        a.textContent = name;
        a.setAttribute('data-menu-idx', i);
        navEl.appendChild(a);
      });

      /* ── 풀 너비 메가메뉴 패널 (헤더 아래에 고정) ── */
      if (hasMega) {
        var megaPanel = document.getElementById('hpMegaMenu');
        if (!megaPanel) {
          megaPanel = document.createElement('div');
          megaPanel.id = 'hpMegaMenu';
          megaPanel.className = 'hp-mega-menu';
          document.body.appendChild(megaPanel);
        }

        // 메가메뉴 배경 = 헤더 배경색과 동일
        megaPanel.style.cssText = 'position:fixed;left:0;width:100%;background:' + bgColor + ';backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);z-index:89;opacity:0;visibility:hidden;transition:opacity .25s ease,transform .25s ease;transform:translateY(-8px);pointer-events:none;border-top:1px solid rgba(128,128,128,.1);box-shadow:0 12px 40px rgba(0,0,0,.2)';

        // top 위치 계산 (리벳 높이 + 헤더 높이)
        var rivetEl = document.getElementById('hpRivet');
        var rivetH = (rivetEl && rivetEl.style.display !== 'none') ? (rivetEl.offsetHeight || 0) : 0;
        megaPanel.style.top = (rivetH + (parseInt(settings.h) || 64)) + 'px';

        // 메가메뉴 컨텐츠 컨테이너
        var megaInner = document.createElement('div');
        megaInner.style.cssText = 'position:relative;padding:14px 0 18px;min-height:20px';

        var maxBottom = 0;

        megaData.forEach(function (md, idx) {
          if (md.subs.length === 0) return;

          var col = document.createElement('div');
          col.setAttribute('data-col-idx', idx);
          col.style.cssText = 'position:absolute;top:14px;left:0;text-align:left';

          md.subs.forEach(function (sub) {
            var subLink = document.createElement('a');
            subLink.href = escAttr(sub.url);
            if (sub.blank) subLink.target = '_blank';
            subLink.style.cssText = 'display:block;padding:5px 0;font-size:' + Math.max(parseInt(settings.fs || 15) - 2, 12) + 'px;color:' + (settings.fc || '#1a1a2e') + ';font-weight:400;opacity:.7;transition:opacity .15s,padding-left .15s;text-decoration:none;white-space:nowrap';
            subLink.textContent = sub.name;
            subLink.onmouseover = function () { this.style.opacity = '1'; this.style.paddingLeft = '6px'; };
            subLink.onmouseout = function () { this.style.opacity = '.7'; this.style.paddingLeft = '0'; };
            col.appendChild(subLink);
          });

          megaInner.appendChild(col);
          maxBottom = Math.max(maxBottom, md.subs.length);
        });

        megaInner.style.minHeight = (maxBottom * 30 + 32) + 'px';
        megaPanel.innerHTML = '';
        megaPanel.appendChild(megaInner);

        /* ── 컬럼 위치 재계산 (열릴 때마다 최신 좌표) ── */
        function updateMegaPositions() {
          var cols = megaInner.querySelectorAll('[data-col-idx]');
          var currentNavLinks = navEl.querySelectorAll('a');
          cols.forEach(function (c) {
            var ci = parseInt(c.getAttribute('data-col-idx'));
            var nl = currentNavLinks[ci];
            if (nl) {
              var r = nl.getBoundingClientRect();
              // 메인메뉴 텍스트 시작점과 정확히 맞춤
              c.style.left = r.left + 'px';
            }
          });
        }

        /* 메뉴 호버 시 메가메뉴 표시 */
        var megaTimer = null;

        function showMega() {
          clearTimeout(megaTimer);
          updateMegaPositions();
          megaPanel.style.opacity = '1';
          megaPanel.style.visibility = 'visible';
          megaPanel.style.transform = 'translateY(0)';
          megaPanel.style.pointerEvents = 'auto';
        }

        function hideMega() {
          megaTimer = setTimeout(function () {
            megaPanel.style.opacity = '0';
            megaPanel.style.visibility = 'hidden';
            megaPanel.style.transform = 'translateY(-8px)';
            megaPanel.style.pointerEvents = 'none';
          }, 150);
        }

        // 메뉴 링크 호버
        navEl.querySelectorAll('a').forEach(function (a) {
          a.addEventListener('mouseenter', showMega);
          a.addEventListener('mouseleave', hideMega);
        });

        // 메가메뉴 패널 호버
        megaPanel.addEventListener('mouseenter', showMega);
        megaPanel.addEventListener('mouseleave', hideMega);
      }
    }

    // 모바일 메뉴 (서브메뉴 포함)
    var drawer = document.getElementById('hpMobileDrawer');
    if (drawer) {
      drawer.innerHTML = '';
      menus.forEach(function (name, i) {
        var detail = menuDetails[i] || {};
        var href = detail.url || '#';
        var subs = getSubItems(detail, i);

        var mainLink = document.createElement('a');
        mainLink.href = escAttr(href);
        if (detail.blank) mainLink.target = '_blank';
        mainLink.textContent = name;
        drawer.appendChild(mainLink);

        /* 서브메뉴 표시 */
        if (subs.length > 0) {
          subs.forEach(function (sub) {
            var subLink = document.createElement('a');
            subLink.href = escAttr(sub.url);
            if (sub.blank) subLink.target = '_blank';
            subLink.style.cssText = 'padding-left:24px;font-size:14px;font-weight:400;opacity:.7';
            subLink.textContent = sub.name;
            drawer.appendChild(subLink);
          });
        }
      });
    }

    var mobileBtn = document.getElementById('hpMobileBtn');
    if (mobileBtn) mobileBtn.style.color = settings.fc || '#1a1a2e';

    updateLayout();
  }

  /* ══════════════════════════
     3. 메인 컨텐츠
  ══════════════════════════ */
  function renderMainContent() {
    var wrap = document.getElementById('hpMainContent');
    if (!wrap) return;

    var mcData = getLS('hp_mc_data', []);
    if (!mcData || !mcData.length) {
      wrap.innerHTML = renderHero();
      setTimeout(observeNewElements, 50);
      return;
    }

    // 분리 저장된 이미지 데이터 복원 (hp_mc_img_[l]_[j]_h/v 키)
    mcData.forEach(function(line, li) {
      if (!Array.isArray(line.items)) return;
      line.items.forEach(function(item, ji) {
        ['H', 'V'].forEach(function(dir) {
          var field = 'img' + dir;
          var val = item[field] || '';
          // 참조 키 형식이면 실제 데이터로 대체
          if (val && val.startsWith('hp_mc_img_')) {
            var imgData = localStorage.getItem(val);
            if (imgData) item[field] = imgData;
          }
          // 직접 분리 키로도 조회 시도 (이전 저장 방식 호환)
          if (!item[field] || item[field].length <= 3) {
            var backupKey = 'hp_mc_img_' + li + '_' + ji + '_' + dir.toLowerCase();
            var backupData = localStorage.getItem(backupKey);
            if (backupData) item[field] = backupData;
          }
        });
      });
    });

    var html = '';
    mcData.forEach(function (line) {
      if ((line.type || 'image') === 'image') {
        html += renderImageLine(line);
      } else {
        html += renderSolutionLine(line);
      }
    });

    if (!html.trim()) {
      html = renderHero();
    }

    wrap.innerHTML = html;
    setTimeout(function () { observeNewElements(); initIcons(); initCarousels(); }, 50);
  }

  function renderHero() {
    var hqInfo = getLS('ws_hq_info');
    var companyName = (hqInfo && hqInfo.name) ? hqInfo.name : 'WorkM';
    return '<div class="hp-hero">' +
      '<div class="hp-hero-content fade-in-up">' +
      '<h1>' + escHtml(companyName) + '</h1>' +
      '<p>고객과 함께 성장하는 최고의 파트너</p>' +
      '</div></div>';
  }

  function renderImageLine(line) {
    if (!line.items || !line.items.length) return '';

    // 실제 이미지가 있는 항목만 필터
    var validItems = line.items.filter(function(item) {
      var h = (item.imgH || '').trim();
      var v = (item.imgV || '').trim();
      return h.length > 4 || v.length > 4;
    });
    if (!validItems.length) return '';

    var duration = Math.max(1, parseInt(line.duration || 5)) * 1000;
    var cid = 'hpcs' + (Date.now() % 1e9) + (Math.random() * 1e4 | 0);
    var single = validItems.length === 1;

    /* ── 슬라이드 HTML 생성 ── */
    var slidesHtml = validItems.map(function(item, idx) {
      var imgH = (item.imgH || '').trim();
      var imgV = (item.imgV || '').trim();
      var hasH = imgH.length > 4;
      var hasV = imgV.length > 4;

      var imgHtml = '';
      if (hasH && hasV) {
        imgHtml += '<img class="hp-cs-img-h" src="' + escAttr(imgH) + '" alt="" loading="lazy">';
        imgHtml += '<img class="hp-cs-img-v" src="' + escAttr(imgV) + '" alt="" loading="lazy">';
      } else {
        imgHtml += '<img src="' + escAttr(hasH ? imgH : imgV) + '" alt="" loading="lazy">';
      }

      var hasText = item.text1 || item.text2 || item.text3;
      var overlayHtml = '';
      if (hasText) {
        overlayHtml = '<div class="hp-cs-overlay"><div class="hp-cs-overlay-inner">';
        if (item.text1) overlayHtml += '<span class="hp-cs-tag">' + escHtml(item.text1) + '</span>';
        if (item.text2) overlayHtml += '<div class="hp-cs-title">' + escHtml(item.text2) + '</div>';
        if (item.text3) overlayHtml += '<div class="hp-cs-desc">' + escHtml(item.text3) + '</div>';
        overlayHtml += '</div></div>';
      }

      var slideContent = imgHtml + overlayHtml;
      var itemUrl = (item.url || '').trim();
      if (itemUrl) {
        /* 프로토콜 없으면 https:// 자동 추가 */
        if (itemUrl && !/^https?:\/\//i.test(itemUrl) && !/^\//.test(itemUrl)) {
          itemUrl = 'https://' + itemUrl;
        }
        /* 새탭=_blank, 기본=_top (iframe 바깥에서 독립 페이지로 이동) */
        var linkTarget = item.blank ? '_blank' : '_top';
        var linkRel = item.blank ? ' rel="noopener noreferrer"' : '';
        slideContent = '<a class="hp-cs-link" href="' + escAttr(itemUrl) + '"' +
          ' target="' + linkTarget + '"' + linkRel + '>' +
          slideContent + '</a>';
      }

      return '<div class="hp-cs-slide' + (idx === 0 ? ' active' : '') + '">' + slideContent + '</div>';
    }).join('');

    /* ── 화살표 + 돈 ── */
    var arrowsHtml = !single
      ? '<button class="hp-cs-arrow hp-cs-prev" aria-label="이전">' +
        '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>' +
        '</button>' +
        '<button class="hp-cs-arrow hp-cs-next" aria-label="다음">' +
        '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>' +
        '</button>'
      : '';

    var dotsHtml = !single
      ? '<div class="hp-cs-dots">' +
        validItems.map(function(_, i) {
          return '<button class="hp-cs-dot' + (i === 0 ? ' active' : '') + '" aria-label="슬라이드 ' + (i+1) + '"></button>';
        }).join('') +
        '</div>'
      : '';

    /* 슬라이드 카운터 */
    var counterHtml = !single
      ? '<div class="hp-cs-counter"><span class="hp-cs-cur">1</span> / <span class="hp-cs-total">' + validItems.length + '</span></div>'
      : '';

    return '<div class="hp-carousel-section fade-in-up" id="' + cid + '" data-duration="' + duration + '" data-count="' + validItems.length + '">' +
      '<div class="hp-cs-track">' + slidesHtml + '</div>' +
      arrowsHtml + dotsHtml + counterHtml +
      '</div>';
  }

  /* ── 캐루셀 취기화 ── */
  function initCarousels() {
    document.querySelectorAll('.hp-carousel-section').forEach(function(sec) {
      if (sec.dataset.init) return; // 중복 취기화 방지
      sec.dataset.init = '1';

      var slides = sec.querySelectorAll('.hp-cs-slide');
      var dots = sec.querySelectorAll('.hp-cs-dot');
      var curEl = sec.querySelector('.hp-cs-cur');
      if (slides.length <= 1) return;

      var duration = parseInt(sec.dataset.duration) || 5000;
      var cur = 0;
      var timer;

      function go(n) {
        slides[cur].classList.remove('active');
        if (dots[cur]) dots[cur].classList.remove('active');
        cur = ((n % slides.length) + slides.length) % slides.length;
        slides[cur].classList.add('active');
        if (dots[cur]) dots[cur].classList.add('active');
        if (curEl) curEl.textContent = cur + 1;
      }

      function startTimer() {
        timer = setInterval(function () { go(cur + 1); }, duration);
      }
      function stopTimer() { clearInterval(timer); }

      /* 호버 일시 정지 */
      sec.addEventListener('mouseenter', stopTimer);
      sec.addEventListener('mouseleave', startTimer);

      /* 화살표 */
      var prev = sec.querySelector('.hp-cs-prev');
      var next = sec.querySelector('.hp-cs-next');
      if (prev) prev.addEventListener('click', function (e) { e.stopPropagation(); stopTimer(); go(cur - 1); startTimer(); });
      if (next) next.addEventListener('click', function (e) { e.stopPropagation(); stopTimer(); go(cur + 1); startTimer(); });

      /* 돈 클릭 */
      dots.forEach(function (d, i) {
        d.addEventListener('click', function () { stopTimer(); go(i); startTimer(); });
      });

      /* 터치 스와이프 (w/ passive listener) */
      var tsX = 0;
      sec.addEventListener('touchstart', function (e) { tsX = e.touches[0].clientX; }, { passive: true });
      sec.addEventListener('touchend', function (e) {
        var diff = tsX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) { stopTimer(); go(diff > 0 ? cur + 1 : cur - 1); startTimer(); }
      }, { passive: true });

      startTimer();
    });
  }

  function renderSolutionLine(line) {
    var sol = (line.solution || '').trim();
    if (!sol) return '';

    /* ── 솔루션별 렌더 라우팅 ── */
    switch (sol) {
      case '컨텐츠관리':    return _solRenderChub();
      case '미디어관리':    return _solRenderMedia();
      case '개인정보처리방침': return _solRenderTerms('privacy', '개인정보처리방침');
      case '게시물 게재 원칙':  return _solRenderTerms('post', '게시물 게재 원칙');
      case '홈페이지 이용약관': return _solRenderTerms('tos', '홈페이지 이용약관');
      case '공지사항':      return _solRenderBoard('notice',    '📢 공지사항');
      case '뉴스':          return _solRenderBoard('news',      '📰 뉴스');
      case '자유게시판':    return _solRenderFreeBoard();
      case 'Q&A':           return _solRenderQnaBoard();
      case 'FAQ':           return _solRenderBoard('faq',       '📋 FAQ');
      case '가맹점신청':    return _solRenderFranchise();
      case '워크샵':
      case 'workshop':      return _solRenderWorkshop('workshop');
      case '대관(교육관)':
      case '대관':
      case '교육관':
      case 'venue':         return _solRenderWorkshop('venue');
      default:
        /* 포함 검사 (부분 일치) */
        if (sol.indexOf('워크샵') !== -1) return _solRenderWorkshop('workshop');
        if (sol.indexOf('대관') !== -1 || sol.indexOf('교육관') !== -1) return _solRenderWorkshop('venue');
        return '<div class="hp-solution-line fade-in-up"><div class="solution-title">' + escHtml(sol) + '</div></div>';
    }
  }

  /* ══════════════════════════════════════════
     워크샵 / 대관(교육관) 신청서 렌더
  ══════════════════════════════════════════ */
  function _solRenderWorkshop(type) {
    var isVenue      = (type === 'venue');
    var accentColor  = isVenue ? '#8b5cf6' : '#6366f1';
    var iconEmoji    = isVenue ? '🏛️' : '🏕️';
    var pageTitle    = isVenue ? '대관(교육관) 신청서 작성' : '워크샵 신청서 작성';
    var pageDesc     = isVenue ? '교육관 대관 신청을 위해 아래 정보를 입력해 주세요.' : '단체 워크샵 신청을 위해 아래 정보를 입력해 주세요.';
    var checkinLabel  = isVenue ? '이용일'   : '체크인';
    var checkoutLabel = isVenue ? '체크아웃'  : '체크아웃';  /* venue에선 미사용 */

    /* ── 준비물 리스트 로드 (관리자 패널 ws_prep_list 사용) ── */
    var _prepMap = {};
    try { _prepMap = JSON.parse(localStorage.getItem('ws_prep_list') || '{}'); } catch(e) {}
    var _prepKey     = 'global_' + type;            /* global_workshop | global_venue */
    var savedOptions = Array.isArray(_prepMap[_prepKey]) ? _prepMap[_prepKey] : [];

    /* 저장된 준비물이 없으면 기본값 사용 */
    var extraOptions = savedOptions.length
      ? savedOptions
      : (isVenue
          ? ['강의 기자재(빔프로젝터/스크린)', '마이크 세트', '화이트보드', '음향 장비', '케이터링', '주차 이용', '현수막 설치', '포토존 설치']
          : ['빔프로젝터', '마이크 세트', '화이트보드', '팀빌딩 프로그램', '레크리에이션 강사', '케이터링(식사)', '버스 셔틀', '포토존']);

    var checkboxHtml = extraOptions.length
      ? extraOptions.map(function(opt) {
          return '<label style="display:flex;align-items:center;gap:8px;padding:8px 12px;border:1.5px solid var(--hp-border,#e2e8f0);border-radius:8px;cursor:pointer;font-size:13px;color:var(--hp-text,#1e293b);transition:all .15s">' +
            '<input type="checkbox" class="ws-extra-chk" value="' + escAttr(opt) + '" style="accent-color:' + accentColor + ';width:15px;height:15px">' +
            escHtml(opt) + '</label>';
        }).join('')
      : '<p style="font-size:13px;color:var(--hp-muted,#94a3b8);text-align:center;padding:12px 0;margin:0">관리자 패널에서 준비물을 설정하면 여기에 표시됩니다.</p>';


    var uid = 'ws' + Date.now();

    /* ── 커스텀 달력 입력 필드 HTML 생성 헬퍼 ── */
    function dpFieldHtml(fieldId, labelText) {
      var calBorder = '1.5px solid var(--hp-border,#e2e8f0)';
      return '<div id="' + uid + '-' + fieldId + '-wrap" style="position:relative">' +
        '<div id="' + uid + '-' + fieldId + '-btn" style="display:flex;align-items:center;gap:10px;padding:12px 16px;border:' + calBorder + ';border-radius:10px;background:var(--hp-bg,#f8fafc);cursor:pointer;transition:border-color .15s;user-select:none">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' +
        '<span id="' + uid + '-' + fieldId + '-display" style="font-size:14px;color:#94a3b8;flex:1">날짜를 선택하세요</span>' +
        '</div>' +
        '<input type="hidden" id="' + uid + '-' + fieldId + '">' +
        /* 달력 드롭다운 */
        '<div id="' + uid + '-' + fieldId + '-cal" style="display:none;position:absolute;top:calc(100% + 6px);left:0;z-index:9999;background:var(--hp-card,#fff);border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,.16);border:1px solid rgba(0,0,0,.08);padding:18px;min-width:288px">' +
        /* 달력 헤더 */
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">' +
        '<button id="' + uid + '-' + fieldId + '-prev" style="width:30px;height:30px;border:none;background:rgba(0,0,0,.05);border-radius:8px;cursor:pointer;font-size:16px;font-weight:700;color:var(--hp-text,#1e293b);display:flex;align-items:center;justify-content:center;line-height:1">‹</button>' +
        '<strong id="' + uid + '-' + fieldId + '-ym" style="font-size:15px;font-weight:800;color:var(--hp-text,#1e293b)"></strong>' +
        '<button id="' + uid + '-' + fieldId + '-next" style="width:30px;height:30px;border:none;background:rgba(0,0,0,.05);border-radius:8px;cursor:pointer;font-size:16px;font-weight:700;color:var(--hp-text,#1e293b);display:flex;align-items:center;justify-content:center;line-height:1">›</button>' +
        '</div>' +
        /* 요일 헤더 */
        '<div style="display:grid;grid-template-columns:repeat(7,1fr);text-align:center;margin-bottom:8px;padding:0 2px">' +
        '<span style="font-size:11px;font-weight:700;color:#ef4444;padding:4px 0">일</span>' +
        '<span style="font-size:11px;font-weight:700;color:var(--hp-muted,#64748b);padding:4px 0">월</span>' +
        '<span style="font-size:11px;font-weight:700;color:var(--hp-muted,#64748b);padding:4px 0">화</span>' +
        '<span style="font-size:11px;font-weight:700;color:var(--hp-muted,#64748b);padding:4px 0">수</span>' +
        '<span style="font-size:11px;font-weight:700;color:var(--hp-muted,#64748b);padding:4px 0">목</span>' +
        '<span style="font-size:11px;font-weight:700;color:var(--hp-muted,#64748b);padding:4px 0">금</span>' +
        '<span style="font-size:11px;font-weight:700;color:#6366f1;padding:4px 0">토</span>' +
        '</div>' +
        /* 날짜 그리드 */
        '<div id="' + uid + '-' + fieldId + '-grid" style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center"></div>' +
        /* 하단 버튼 */
        '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px;padding-top:12px;border-top:1px solid rgba(0,0,0,.07)">' +
        '<button id="' + uid + '-' + fieldId + '-today" style="padding:7px 16px;border:1.5px solid var(--hp-border,#e2e8f0);border-radius:8px;background:transparent;color:var(--hp-muted,#64748b);font-size:13px;font-weight:600;cursor:pointer">오늘</button>' +
        '<button id="' + uid + '-' + fieldId + '-close" style="padding:7px 16px;border:none;border-radius:8px;background:' + accentColor + ';color:#fff;font-size:13px;font-weight:700;cursor:pointer">닫기</button>' +
        '</div>' +
        '</div>' +
        '</div>';
    }

    var html =
      '<div class="hp-solution-line fade-in-up">' +
      '<div style="max-width:680px;margin:0 auto;padding:20px 0 40px">' +

      /* 헤더 */
      '<div style="text-align:center;margin-bottom:36px">' +
      '<div style="width:64px;height:64px;border-radius:18px;background:linear-gradient(135deg,' + accentColor + ',' + accentColor + 'cc);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;box-shadow:0 8px 24px ' + accentColor + '44;font-size:30px">' + iconEmoji + '</div>' +
      '<h2 style="font-size:26px;font-weight:900;color:var(--hp-text,#1e293b);margin:0 0 10px">' + escHtml(pageTitle) + '</h2>' +
      '<p style="font-size:14px;color:var(--hp-muted,#64748b);margin:0">' + escHtml(pageDesc) + '</p>' +
      '</div>' +

      /* ── 탭 막대 ── */
      '<div style="display:flex;gap:4px;background:var(--hp-bg,#f1f5f9);border-radius:14px;padding:4px;margin-bottom:24px">' +
      '<button id="' + uid + '-tab-form" style="flex:1;padding:10px 0;border:none;border-radius:10px;background:' + accentColor + ';color:#fff;font-size:13px;font-weight:700;cursor:pointer;transition:all .2s">📝 신청서 작성</button>' +
      '<button id="' + uid + '-tab-check" style="flex:1;padding:10px 0;border:none;border-radius:10px;background:transparent;color:var(--hp-muted,#64748b);font-size:13px;font-weight:600;cursor:pointer;transition:all .2s">🔍 신청결과 확인</button>' +
      '</div>' +

      /* ── panel-form ── */
      '<div id="' + uid + '-panel-form">' +

      /* 폼 카드 */
      '<div style="background:var(--hp-card,#fff);border-radius:20px;padding:32px;box-shadow:0 4px 24px rgba(0,0,0,.08);border:1px solid var(--hp-border,#e2e8f0)">' +

      /* 단체명 */
      '<div style="margin-bottom:20px">' +
      '<label style="display:block;font-size:11px;font-weight:700;color:var(--hp-muted,#64748b);text-transform:uppercase;letter-spacing:.5px;margin-bottom:7px">단체명 / 기업명 <span style="color:#ef4444">*</span> <span style="font-weight:400;text-transform:none;font-size:11px">(개인 신청 불가)</span></label>' +
      '<input id="' + uid + '-group" type="text" placeholder="단체명 또는 기업명 입력" style="width:100%;padding:12px 16px;border:1.5px solid var(--hp-border,#e2e8f0);border-radius:10px;font-size:14px;color:var(--hp-text,#1e293b);background:var(--hp-bg,#f8fafc);outline:none;box-sizing:border-box;font-family:inherit;transition:border-color .15s" onfocus="this.style.borderColor=\'' + accentColor + '\'" onblur="this.style.borderColor=\'var(--hp-border,#e2e8f0)\'">' +
      '</div>' +

      /* 날짜/시간 행 - 대관: 이용일+시작시간+종료시간 / 워크샵: 체크인+체크아웃 */
      (isVenue
        ? ('<div style="display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:16px;margin-bottom:20px">' +
           '<div><label style="display:block;font-size:11px;font-weight:700;color:var(--hp-muted,#64748b);text-transform:uppercase;letter-spacing:.5px;margin-bottom:7px">이용일 <span style="color:#ef4444">*</span></label>' +
           dpFieldHtml('checkin', '이용일') + '</div>' +
           '<div><label style="display:block;font-size:11px;font-weight:700;color:var(--hp-muted,#64748b);text-transform:uppercase;letter-spacing:.5px;margin-bottom:7px">시작시간 <span style="color:#ef4444">*</span></label>' +
           '<input id="' + uid + '-starttime" type="time" style="width:100%;padding:12px 16px;border:1.5px solid var(--hp-border,#e2e8f0);border-radius:10px;font-size:14px;color:var(--hp-text,#1e293b);background:var(--hp-bg,#f8fafc);outline:none;box-sizing:border-box;font-family:inherit;transition:border-color .15s" onfocus="this.style.borderColor=\'' + accentColor + '\'" onblur="this.style.borderColor=\'var(--hp-border,#e2e8f0)\'"></div>' +
           '<div><label style="display:block;font-size:11px;font-weight:700;color:var(--hp-muted,#64748b);text-transform:uppercase;letter-spacing:.5px;margin-bottom:7px">종료시간 <span style="color:#ef4444">*</span></label>' +
           '<input id="' + uid + '-endtime" type="time" style="width:100%;padding:12px 16px;border:1.5px solid var(--hp-border,#e2e8f0);border-radius:10px;font-size:14px;color:var(--hp-text,#1e293b);background:var(--hp-bg,#f8fafc);outline:none;box-sizing:border-box;font-family:inherit;transition:border-color .15s" onfocus="this.style.borderColor=\'' + accentColor + '\'" onblur="this.style.borderColor=\'var(--hp-border,#e2e8f0)\'"></div>' +
           '</div>')
        : ('<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">' +
           '<div><label style="display:block;font-size:11px;font-weight:700;color:var(--hp-muted,#64748b);text-transform:uppercase;letter-spacing:.5px;margin-bottom:7px">체크인 <span style="color:#ef4444">*</span></label>' +
           dpFieldHtml('checkin', '체크인') + '</div>' +
           '<div><label style="display:block;font-size:11px;font-weight:700;color:var(--hp-muted,#64748b);text-transform:uppercase;letter-spacing:.5px;margin-bottom:7px">체크아웃 <span style="color:#ef4444">*</span></label>' +
           dpFieldHtml('checkout', '체크아웃') + '</div>' +
           '</div>')
      ) +

      /* 연락처 + 인원 */
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">' +
      '<div><label style="display:block;font-size:11px;font-weight:700;color:var(--hp-muted,#64748b);text-transform:uppercase;letter-spacing:.5px;margin-bottom:7px">담당자 연락처 <span style="color:#ef4444">*</span></label>' +
      '<input id="' + uid + '-phone" type="tel" placeholder="010-0000-0000" maxlength="13" style="width:100%;padding:12px 16px;border:1.5px solid var(--hp-border,#e2e8f0);border-radius:10px;font-size:14px;color:var(--hp-text,#1e293b);background:var(--hp-bg,#f8fafc);outline:none;box-sizing:border-box;font-family:inherit;transition:border-color .15s" onfocus="this.style.borderColor=\'' + accentColor + '\'" onblur="this.style.borderColor=\'var(--hp-border,#e2e8f0)\'"></div>' +
      '<div><label style="display:block;font-size:11px;font-weight:700;color:var(--hp-muted,#64748b);text-transform:uppercase;letter-spacing:.5px;margin-bottom:7px">참여 총 인원 <span style="color:#ef4444">*</span></label>' +
      '<input id="' + uid + '-headcount" type="number"' + (isVenue ? ' max="60"' : ' min="10"') + ' placeholder="' + (isVenue ? '최대 60명' : '최소 10명') + '" style="width:100%;padding:12px 16px;border:1.5px solid var(--hp-border,#e2e8f0);border-radius:10px;font-size:14px;color:var(--hp-text,#1e293b);background:var(--hp-bg,#f8fafc);outline:none;box-sizing:border-box;font-family:inherit;transition:border-color .15s" onfocus="this.style.borderColor=\'' + accentColor + '\'" onblur="this.style.borderColor=\'var(--hp-border,#e2e8f0)\'"></div>' +
      '</div>' +

      /* 담당자 이름 + 접수확인 비밀번호 */
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">' +
      '<div><label style="display:block;font-size:11px;font-weight:700;color:var(--hp-muted,#64748b);text-transform:uppercase;letter-spacing:.5px;margin-bottom:7px">담당자 이름 <span style="color:#ef4444">*</span></label>' +
      '<input id="' + uid + '-manager" type="text" placeholder="신청인 이름 입력" style="width:100%;padding:12px 16px;border:1.5px solid var(--hp-border,#e2e8f0);border-radius:10px;font-size:14px;color:var(--hp-text,#1e293b);background:var(--hp-bg,#f8fafc);outline:none;box-sizing:border-box;font-family:inherit;transition:border-color .15s" onfocus="this.style.borderColor=\'' + accentColor + '\'" onblur="this.style.borderColor=\'var(--hp-border,#e2e8f0)\'"></div>' +
      '<div><label style="display:block;font-size:11px;font-weight:700;color:var(--hp-muted,#64748b);text-transform:uppercase;letter-spacing:.5px;margin-bottom:7px">접수확인용 비밀번호 <span style="color:#ef4444">*</span></label>' +
      '<div style="position:relative">' +
      '<input id="' + uid + '-password" type="password" placeholder="4자리 이상 입력" maxlength="20" style="width:100%;padding:12px 44px 12px 16px;border:1.5px solid var(--hp-border,#e2e8f0);border-radius:10px;font-size:14px;color:var(--hp-text,#1e293b);background:var(--hp-bg,#f8fafc);outline:none;box-sizing:border-box;font-family:inherit;transition:border-color .15s" onfocus="this.style.borderColor=\'' + accentColor + '\'" onblur="this.style.borderColor=\'var(--hp-border,#e2e8f0)\'">' +
      '<button type="button" id="' + uid + '-pw-toggle" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#94a3b8;padding:0;line-height:1;font-size:16px" title="비밀번호 보기/숨기기">👁️</button>' +
      '</div>' +
      '<p style="font-size:11px;color:var(--hp-muted,#94a3b8);margin:5px 0 0 4px">접수 후 신청내역 확인시 사용됩니다</p>' +
      '</div>' +
      '</div>' +

      '<div style="margin-bottom:20px">' +
      '<label style="display:block;font-size:11px;font-weight:700;color:var(--hp-muted,#64748b);text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px">추가 선택사항 <span style="font-weight:400;text-transform:none;font-size:11px">(옵션 · 복수 선택 가능)</span></label>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px">' + checkboxHtml + '</div>' +
      '</div>' +

      /* 기타 문의 */
      '<div style="margin-bottom:24px">' +
      '<label style="display:block;font-size:11px;font-weight:700;color:var(--hp-muted,#64748b);text-transform:uppercase;letter-spacing:.5px;margin-bottom:7px">기타 문의 / 견적 요청사항</label>' +
      '<textarea id="' + uid + '-inquiry" rows="4" placeholder="추가 요청사항이나 견적 문의사항을 입력해 주세요." style="width:100%;padding:12px 16px;border:1.5px solid var(--hp-border,#e2e8f0);border-radius:10px;font-size:14px;color:var(--hp-text,#1e293b);background:var(--hp-bg,#f8fafc);outline:none;box-sizing:border-box;font-family:inherit;resize:vertical;min-height:100px;line-height:1.6;transition:border-color .15s" onfocus="this.style.borderColor=\'' + accentColor + '\'" onblur="this.style.borderColor=\'var(--hp-border,#e2e8f0)\'"></textarea>' +
      '</div>' +

      /* 유의사항 */
      '<div style="background:rgba(239,68,68,.05);border:1px solid rgba(239,68,68,.2);border-radius:10px;padding:12px 16px;margin-bottom:24px;font-size:12px;color:#dc2626;line-height:1.7">' +
      '⚠️ <strong>유의사항:</strong> 본 신청서는 개인 신청이 불가하며 단체·기업·기관 단위로만 접수됩니다.<br>접수 후 담당자가 2~3 영업일 내 연락드립니다.' +
      '</div>' +

      /* 신청하기 버튼 */
      '<button id="' + uid + '-submit" style="width:100%;height:52px;border:none;border-radius:12px;background:linear-gradient(135deg,' + accentColor + ',' + accentColor + 'cc);color:#fff;font-size:16px;font-weight:800;cursor:pointer;letter-spacing:.3px;box-shadow:0 4px 16px ' + accentColor + '44;transition:all .2s" onmouseover="this.style.transform=\'translateY(-1px)\';this.style.boxShadow=\'0 8px 24px ' + accentColor + '55\'" onmouseout="this.style.transform=\'\';this.style.boxShadow=\'0 4px 16px ' + accentColor + '44\'">' +
      iconEmoji + ' 신청하기</button>' +

      '</div></div>' + /* form-card + panel-form 닫기 */

      /* ── panel-check ── */
      '<div id="' + uid + '-panel-check" style="display:none">' +
      '<div style="background:var(--hp-card,#fff);border-radius:20px;padding:32px;box-shadow:0 4px 24px rgba(0,0,0,.08);border:1px solid var(--hp-border,#e2e8f0)">' +
      '<h3 style="font-size:18px;font-weight:800;color:var(--hp-text,#1e293b);margin:0 0 6px">신청결과 조회</h3>' +
      '<p style="font-size:13px;color:var(--hp-muted,#64748b);margin:0 0 24px">신청 시 입력한 연락처와 비밀번호로 접수 상태를 확인하세요.</p>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">' +
      '<div><label style="display:block;font-size:11px;font-weight:700;color:var(--hp-muted,#64748b);text-transform:uppercase;letter-spacing:.5px;margin-bottom:7px">신청인 전화번호</label>' +
      '<input id="' + uid + '-ck-phone" type="tel" placeholder="010-0000-0000" maxlength="13" style="width:100%;padding:12px 16px;border:1.5px solid var(--hp-border,#e2e8f0);border-radius:10px;font-size:14px;color:var(--hp-text,#1e293b);background:var(--hp-bg,#f8fafc);outline:none;box-sizing:border-box;font-family:inherit;transition:border-color .15s" onfocus="this.style.borderColor=\'' + accentColor + '\'" onblur="this.style.borderColor=\'var(--hp-border,#e2e8f0)\'"></div>' +
      '<div><label style="display:block;font-size:11px;font-weight:700;color:var(--hp-muted,#64748b);text-transform:uppercase;letter-spacing:.5px;margin-bottom:7px">신청 비밀번호</label>' +
      '<input id="' + uid + '-ck-pw" type="password" placeholder="접수확인용 비밀번호" style="width:100%;padding:12px 16px;border:1.5px solid var(--hp-border,#e2e8f0);border-radius:10px;font-size:14px;color:var(--hp-text,#1e293b);background:var(--hp-bg,#f8fafc);outline:none;box-sizing:border-box;font-family:inherit;transition:border-color .15s" onfocus="this.style.borderColor=\'' + accentColor + '\'" onblur="this.style.borderColor=\'var(--hp-border,#e2e8f0)\'"></div>' +
      '</div>' +
      '<button id="' + uid + '-ck-btn" style="width:100%;height:48px;border:none;border-radius:12px;background:linear-gradient(135deg,' + accentColor + ',' + accentColor + 'cc);color:#fff;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 4px 16px ' + accentColor + '44;transition:all .2s;margin-bottom:20px">🔍 확인하기</button>' +
      '<div id="' + uid + '-ck-result"></div>' +
      '</div>' +
      '</div>' + /* panel-check 닫기 */

      '</div></div>'; /* max-width + solution-line 닫기 */


    /* ─────── DOM 삽입 후 초기화 ─────── */
    setTimeout(function() {

      /* ══ 탭 전환 (항상 바인딩 - submitBtn 불필요) ══ */
      var tabForm  = document.getElementById(uid + '-tab-form');
      var tabCheck = document.getElementById(uid + '-tab-check');
      var pForm    = document.getElementById(uid + '-panel-form');
      var pCheck   = document.getElementById(uid + '-panel-check');
      function switchTab(toCheck) {
        if (toCheck) {
          if (pForm)  pForm.style.display  = 'none';
          if (pCheck) pCheck.style.display = 'block';
          if (tabForm)  { tabForm.style.background = 'transparent'; tabForm.style.color = 'var(--hp-muted,#64748b)'; }
          if (tabCheck) { tabCheck.style.background = accentColor; tabCheck.style.color = '#fff'; }
        } else {
          if (pForm)  pForm.style.display  = 'block';
          if (pCheck) pCheck.style.display = 'none';
          if (tabForm)  { tabForm.style.background = accentColor; tabForm.style.color = '#fff'; }
          if (tabCheck) { tabCheck.style.background = 'transparent'; tabCheck.style.color = 'var(--hp-muted,#64748b)'; }
        }
      }
      if (tabForm)  tabForm.addEventListener('click',  function() { switchTab(false); });
      if (tabCheck) tabCheck.addEventListener('click', function() { switchTab(true); });

      /* ══ 조회 탭 전화번호 자동 하이픈 ══ */
      var ckPhoneEl = document.getElementById(uid + '-ck-phone');
      if (ckPhoneEl) {
        ckPhoneEl.addEventListener('input', function() {
          var v = this.value.replace(/\D/g, '');
          if (v.length > 11) v = v.slice(0, 11);
          if (v.length <= 3)      this.value = v;
          else if (v.length <= 7) this.value = v.slice(0,3) + '-' + v.slice(3);
          else                    this.value = v.slice(0,3) + '-' + v.slice(3,7) + '-' + v.slice(7);
        });
      }

      /* ══ 조회 버튼 클릭 (항상 바인딩) ══ */
      var ckBtn    = document.getElementById(uid + '-ck-btn');
      var ckResult = document.getElementById(uid + '-ck-result');
      if (ckBtn && ckResult) {
        ckBtn.addEventListener('click', function() {
          var phone = (ckPhoneEl || {}).value || '';
          var pw    = (document.getElementById(uid + '-ck-pw') || {}).value || '';
          if (!phone.trim()) { alert('전화번호를 입력해 주세요.'); return; }
          if (!pw)           { alert('비밀번호를 입력해 주세요.'); return; }

          var apps = [];
          try { apps = JSON.parse(localStorage.getItem('workshop_apps') || '[]'); } catch(e) {}
          var matched = apps.filter(function(a) {
            return a.type === type && a.phone === phone && a.password === pw;
          });

          if (!matched.length) {
            ckResult.innerHTML =
              '<div style="text-align:center;padding:28px;background:rgba(239,68,68,.05);border:1px solid rgba(239,68,68,.2);border-radius:12px;color:#dc2626;font-size:14px">' +
              '❌ 일치하는 신청 내역이 없습니다.<br><span style="font-size:12px;opacity:.8">전화번호와 비밀번호를 다시 확인해 주세요.</span></div>';
            return;
          }

          var ST_COLORS = {
            '접수완료': { color:'#6366f1', bg:'rgba(99,102,241,.12)', icon:'✅' },
            '계약진행': { color:'#f59e0b', bg:'rgba(245,158,11,.12)',  icon:'🔄' },
            '계약완료': { color:'#22c55e', bg:'rgba(34,197,94,.12)',   icon:'🎉' },
            '신청취소': { color:'#ef4444', bg:'rgba(239,68,68,.12)',   icon:'❌' }
          };
          var cards = matched.map(function(a) {
            var sc = ST_COLORS[a.status] || { color:'#94a3b8', bg:'rgba(148,163,184,.12)', icon:'•' };
            var dateInfo = isVenue
              ? ('<strong>' + (a.checkin||a.venueDate||'-') + '</strong> ' + ((a.starttime||a.startTime) ? (a.starttime||a.startTime) + ' ~ ' + (a.endtime||a.endTime) : ''))
              : ('<strong>' + (a.checkin||'-') + '</strong> ~ <strong>' + (a.checkout||'-') + '</strong>');
            return '<div style="border:1.5px solid var(--hp-border,#e2e8f0);border-radius:14px;padding:18px 20px;margin-bottom:12px">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">' +
              '<div style="font-size:15px;font-weight:800;color:var(--hp-text,#1e293b)">' + escHtml(a.groupName||'-') + '</div>' +
              '<span style="font-size:12px;font-weight:700;color:' + sc.color + ';background:' + sc.bg + ';padding:4px 12px;border-radius:20px">' + sc.icon + ' ' + (a.status||'접수완료') + '</span>' +
              '</div>' +
              '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;color:var(--hp-muted,#64748b)">' +
              '<div>📅 ' + (isVenue ? '이용일' : '기간') + ': <span style="color:var(--hp-text,#1e293b);font-weight:600">' + dateInfo + '</span></div>' +
              '<div>👥 인원: <span style="color:var(--hp-text,#1e293b);font-weight:600">' + (a.headcount||'-') + '명</span></div>' +
              '<div>🧑 담당자: <span style="color:var(--hp-text,#1e293b);font-weight:600">' + escHtml(a.manager||'-') + '</span></div>' +
              '<div>📋 신청일: <span style="color:var(--hp-text,#1e293b);font-weight:600">' + (a.regDate||'-') + '</span></div>' +
              '</div>' +
              (a.extras ? '<div style="margin-top:10px;font-size:12px;color:var(--hp-muted,#64748b)">추가 선택: <span style="color:var(--hp-text,#1e293b)">' + escHtml(a.extras) + '</span></div>' : '') +
              '</div>';
          }).join('');
          ckResult.innerHTML = '<div style="font-size:13px;font-weight:700;color:var(--hp-muted,#64748b);margin-bottom:10px">총 ' + matched.length + '건의 신청 내역</div>' + cards;
        });
      }

      /* ══ 이하 신청서 폼 버튼에 대한 초기화 ══ */
      var submitBtn = document.getElementById(uid + '-submit');
      var section = submitBtn && submitBtn.closest('.hp-solution-line');
      if (!submitBtn) return;

      /* ── 1. 전화번호 자동 하이픈 포맷 ── */
      var phoneEl = document.getElementById(uid + '-phone');
      if (phoneEl) {
        phoneEl.addEventListener('input', function() {
          var v = this.value.replace(/\D/g, '');
          if (v.length > 11) v = v.slice(0, 11);
          if (v.length <= 3)       this.value = v;
          else if (v.length <= 7)  this.value = v.slice(0,3) + '-' + v.slice(3);
          else                     this.value = v.slice(0,3) + '-' + v.slice(3,7) + '-' + v.slice(7);
        });

      }

      /* ── 2. 커스텀 달력 초기화 함수 ── */
      function initDatePicker(fieldId) {
        var today     = new Date();
        var todayStr  = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
        var curYear   = today.getFullYear();
        var curMonth  = today.getMonth();
        var selected  = '';

        var btn     = document.getElementById(uid + '-' + fieldId + '-btn');
        var cal     = document.getElementById(uid + '-' + fieldId + '-cal');
        var ym      = document.getElementById(uid + '-' + fieldId + '-ym');
        var grid    = document.getElementById(uid + '-' + fieldId + '-grid');
        var display = document.getElementById(uid + '-' + fieldId + '-display');
        var hidden  = document.getElementById(uid + '-' + fieldId);
        var prevB   = document.getElementById(uid + '-' + fieldId + '-prev');
        var nextB   = document.getElementById(uid + '-' + fieldId + '-next');
        var todayB  = document.getElementById(uid + '-' + fieldId + '-today');
        var closeB  = document.getElementById(uid + '-' + fieldId + '-close');
        if (!btn || !cal) return;

        function renderGrid() {
          var firstDay    = new Date(curYear, curMonth, 1).getDay();
          var daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
          ym.textContent  = curYear + '년 ' + (curMonth + 1) + '월';
          var cells = '';
          for (var e = 0; e < firstDay; e++) cells += '<div></div>';
          for (var d = 1; d <= daysInMonth; d++) {
            var ds  = curYear + '-' + String(curMonth+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
            var dow = (firstDay + d - 1) % 7;
            var isSel   = ds === selected;
            var isTod   = ds === todayStr;
            var color   = isSel ? '#fff' : (dow === 0 ? '#ef4444' : (dow === 6 ? '#6366f1' : 'var(--hp-text,#1e293b)'));
            var bg      = isSel ? accentColor : (isTod ? accentColor + '18' : 'transparent');
            var border2 = isTod && !isSel ? '1.5px solid ' + accentColor : '1.5px solid transparent';
            var fw      = (isSel || isTod) ? '700' : '400';
            cells += '<div data-ds="' + ds + '" style="height:34px;display:flex;align-items:center;justify-content:center;border-radius:50%;cursor:pointer;font-size:13px;font-weight:' + fw + ';color:' + color + ';background:' + bg + ';border:' + border2 + ';transition:background .1s">' + d + '</div>';
          }
          grid.innerHTML = cells;
          grid.querySelectorAll('[data-ds]').forEach(function(cell) {
            cell.addEventListener('mouseenter', function() {
              if (cell.dataset.ds !== selected) cell.style.background = accentColor + '22';
            });
            cell.addEventListener('mouseleave', function() {
              if (cell.dataset.ds !== selected) cell.style.background = cell.dataset.ds === todayStr ? accentColor + '18' : 'transparent';
            });
            cell.addEventListener('click', function(ev) {
              ev.stopPropagation();
              selected = cell.dataset.ds;
              hidden.value = selected;
              var parts = selected.split('-');
              display.textContent = parts[0] + '년 ' + parseInt(parts[1]) + '월 ' + parseInt(parts[2]) + '일';
              display.style.color = 'var(--hp-text,#1e293b)';
              btn.style.borderColor = accentColor;
              cal.style.display = 'none';
              renderGrid();
            });
          });
        }

        btn.addEventListener('click', function(ev) {
          ev.stopPropagation();
          var open = cal.style.display !== 'none';
          /* 다른 달력은 모두 닫기 */
          document.querySelectorAll('[id$="-cal"]').forEach(function(c) { if (c !== cal) c.style.display = 'none'; });
          cal.style.display = open ? 'none' : 'block';
          if (!open) { btn.style.borderColor = accentColor; renderGrid(); }
        });

        prevB.addEventListener('click', function(ev) { ev.stopPropagation(); curMonth--; if (curMonth < 0) { curMonth = 11; curYear--; } renderGrid(); });
        nextB.addEventListener('click', function(ev) { ev.stopPropagation(); curMonth++; if (curMonth > 11) { curMonth = 0; curYear++; } renderGrid(); });

        todayB.addEventListener('click', function(ev) {
          ev.stopPropagation();
          curYear = today.getFullYear(); curMonth = today.getMonth();
          selected = todayStr;
          hidden.value = selected;
          var parts = selected.split('-');
          display.textContent = parts[0] + '년 ' + parseInt(parts[1]) + '월 ' + parseInt(parts[2]) + '일';
          display.style.color = 'var(--hp-text,#1e293b)';
          btn.style.borderColor = accentColor;
          cal.style.display = 'none';
          renderGrid();
        });

        closeB.addEventListener('click', function(ev) {
          ev.stopPropagation();
          cal.style.display = 'none';
          if (!selected) btn.style.borderColor = 'var(--hp-border,#e2e8f0)';
        });

        document.addEventListener('click', function(ev) {
          var wrap = document.getElementById(uid + '-' + fieldId + '-wrap');
          if (wrap && !wrap.contains(ev.target)) {
            cal.style.display = 'none';
            if (!selected) btn.style.borderColor = 'var(--hp-border,#e2e8f0)';
          }
        });

        renderGrid();
      }

      initDatePicker('checkin');
      if (!isVenue) initDatePicker('checkout');

      /* ── 비밀번호 보기/숨기기 토글 ── */
      var pwToggle = document.getElementById(uid + '-pw-toggle');
      var pwInput  = document.getElementById(uid + '-password');
      if (pwToggle && pwInput) {
        pwToggle.addEventListener('click', function() {
          var isText = pwInput.type === 'text';
          pwInput.type = isText ? 'password' : 'text';
          pwToggle.style.opacity = isText ? '0.5' : '1';
        });
      }


      /* ── 3. 체크박스 선택 스타일 토글 ── */
      if (section) {
        section.querySelectorAll('.ws-extra-chk').forEach(function(chk) {
          chk.addEventListener('change', function() {
            var lbl = chk.closest('label');
            if (chk.checked) {
              lbl.style.borderColor = accentColor;
              lbl.style.background  = accentColor + '11';
              lbl.style.fontWeight  = '600';
              lbl.style.color       = accentColor;
            } else {
              lbl.style.borderColor = 'var(--hp-border,#e2e8f0)';
              lbl.style.background  = '';
              lbl.style.fontWeight  = '';
              lbl.style.color       = 'var(--hp-text,#1e293b)';
            }
          });
        });
      }

      /* ── 4. 신청하기 클릭 ── */
      submitBtn.addEventListener('click', function() {
        var group     = (document.getElementById(uid + '-group')     || {}).value || '';
        var checkin   = (document.getElementById(uid + '-checkin')   || {}).value || '';
        var checkout  = isVenue ? '' : ((document.getElementById(uid + '-checkout') || {}).value || '');
        var starttime = isVenue ? ((document.getElementById(uid + '-starttime') || {}).value || '') : '';
        var endtime   = isVenue ? ((document.getElementById(uid + '-endtime')   || {}).value || '') : '';
        var phone     = (document.getElementById(uid + '-phone')     || {}).value || '';
        var headcnt   = (document.getElementById(uid + '-headcount') || {}).value || '';
        var manager   = (document.getElementById(uid + '-manager')   || {}).value || '';
        var password  = (document.getElementById(uid + '-password')  || {}).value || '';
        var inquiry   = (document.getElementById(uid + '-inquiry')   || {}).value || '';

        if (!group.trim())   { alert('단체명 / 기업명을 입력해 주세요.'); return; }
        if (!checkin)         { alert('이용일을 선택해 주세요.'); return; }
        if (isVenue) {
          if (!starttime)                        { alert('시작시간을 선택해 주세요.'); return; }
          if (!endtime)                          { alert('종료시간을 선택해 주세요.'); return; }
          if (starttime >= endtime)              { alert('종료시간이 시작시간보다 빠릅니다.'); return; }
          if (headcnt && parseInt(headcnt) > 60) { alert('최대 60명까지 신청 가능합니다.'); return; }
        } else {
          if (!checkout)                          { alert('체크아웃 날짜를 선택해 주세요.'); return; }
          if (checkin > checkout)                 { alert('체크아웃이 체크인보다 빠릅니다.'); return; }
          if (!headcnt || parseInt(headcnt) < 10) { alert('참여 인원을 10명 이상 입력해 주세요.'); return; }
        }
        if (!phone.trim())   { alert('담당자 연락처를 입력해 주세요.'); return; }
        if (!headcnt)         { alert('참여 인원을 입력해 주세요.'); return; }
        if (!manager.trim())  { alert('담당자 이름을 입력해 주세요.'); return; }
        if (password.length < 4) { alert('접수확인용 비밀번호를 4자리 이상 입력해 주세요.'); return; }

        var extras = [];
        if (section) {
          section.querySelectorAll('.ws-extra-chk:checked').forEach(function(c) { extras.push(c.value); });
        }

        try {
          var arr = JSON.parse(localStorage.getItem('workshop_apps') || '[]');
          arr.push({
            id: type + '_' + Date.now(), type: type,
            regDate: new Date().toISOString().slice(0, 10),
            groupName: group.trim(), phone: phone.trim(),
            manager: manager.trim(), password: password,
            checkin: checkin,
            checkout: isVenue ? '' : checkout,
            starttime: starttime, endtime: endtime,
            headcount: parseInt(headcnt),
            extras: extras.join(', '), inquiry: inquiry.trim(),
            status: '접수완료'
          });
          localStorage.setItem('workshop_apps', JSON.stringify(arr));
        } catch(e) {}

        /* 성공 화면 */
        var ciParts = checkin.split('-');
        var checkinDisp = ciParts[0] + '년 ' + parseInt(ciParts[1]) + '월 ' + parseInt(ciParts[2]) + '일';
        var timeInfo = isVenue
          ? ('🕐 ' + starttime + ' ~ ' + endtime)
          : ('📅 체크아웃: <strong>' + (function(){ var p=checkout.split('-'); return p[0]+'년 '+parseInt(p[1])+'월 '+parseInt(p[2])+'일'; })() + '</strong>');

        if (section) {
          section.innerHTML =
            '<div style="max-width:480px;margin:60px auto;text-align:center;padding:20px">' +
            '<div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#22c55e,#16a34a);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:34px">✅</div>' +
            '<h2 style="font-size:22px;font-weight:900;color:var(--hp-text,#1e293b);margin:0 0 12px">신청이 완료되었습니다!</h2>' +
            '<p style="font-size:14px;color:var(--hp-muted,#64748b);line-height:1.7;margin:0 0 24px"><strong style="color:' + accentColor + '">' + escHtml(group) + '</strong> 님의 ' + (isVenue ? '대관' : '워크샵') + ' 신청이 접수되었습니다.<br>담당자 <strong>' + escHtml(manager) + '</strong> 님 연락처(<strong>' + escHtml(phone) + '</strong>)으로 2~3 영업일 내 연락드립니다.</p>' +
            '<div style="background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.2);border-radius:12px;padding:14px;text-align:left;font-size:13px;line-height:1.8">' +
            '📅 이용일: <strong>' + checkinDisp + '</strong><br>' + timeInfo + '<br>' +
            '👥 총 인원: <strong>' + headcnt + '명</strong>' +
            (extras.length ? '<br>📋 추가 선택: <strong>' + escHtml(extras.join(', ')) + '</strong>' : '') +
            '<br><br><div style="background:rgba(99,102,241,.06);border:1px solid rgba(99,102,241,.2);border-radius:8px;padding:10px 14px;font-size:12px;color:#6366f1">🔑 접수확인용 비밀번호를 안전하게 보관하세요.</div>' +
            '</div></div>';
        }
      });
    }, 80);

    return html;
  }


  function _solWrap(title, inner) {
    return '<div class="hp-solution-line fade-in-up">' +
      '<div class="solution-title">' + escHtml(title) + '</div>' +
      inner + '</div>';
  }

  /* ── 자유게시판 렌더 ── */
  function _solRenderFreeBoard() {
    var items = [];
    try { items = JSON.parse(localStorage.getItem('board_items') || '[]').filter(function(i){ return i.cat === 'free'; }); } catch(e) {}
    items.sort(function(a,b){ return (b.featured?1:0)-(a.featured?1:0); });

    /* 글쓰기 폼 HTML */
    var writeForm =
      '<div id="hp-free-write-form" style="max-height:0px;overflow:hidden;transition:max-height .4s ease;background:rgba(99,102,241,.04);border-radius:12px;margin-bottom:12px">' +
      '<div style="padding:18px 20px">' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">' +
      '<input id="hp-free-w-author" type="text" placeholder="이름 (익명)" style="padding:9px 12px;border:1.5px solid rgba(99,102,241,.25);border-radius:8px;font-size:13px;background:var(--hp-bg,#fff);color:var(--hp-text);outline:none">' +
      '<input id="hp-free-w-pwd" type="password" placeholder="비밀번호 (삭제할 때 사용)" style="padding:9px 12px;border:1.5px solid rgba(99,102,241,.25);border-radius:8px;font-size:13px;background:var(--hp-bg,#fff);color:var(--hp-text);outline:none">' +
      '</div>' +
      '<input id="hp-free-w-title" type="text" placeholder="제목을 입력하세요" style="width:100%;padding:9px 12px;border:1.5px solid rgba(99,102,241,.25);border-radius:8px;font-size:13px;background:var(--hp-bg,#fff);color:var(--hp-text);outline:none;box-sizing:border-box;margin-bottom:8px">' +
      '<textarea id="hp-free-w-content" rows="5" placeholder="내용을 입력하세요..." style="width:100%;padding:9px 12px;border:1.5px solid rgba(99,102,241,.25);border-radius:8px;font-size:13px;background:var(--hp-bg,#fff);color:var(--hp-text);resize:vertical;outline:none;box-sizing:border-box;line-height:1.6;font-family:inherit;margin-bottom:10px"></textarea>' +
      '<div style="display:flex;justify-content:flex-end;gap:8px">' +
      '<button onclick="hpFreeToggleWrite()" style="padding:9px 18px;border:1.5px solid #6366f1;border-radius:8px;background:transparent;color:#6366f1;font-size:13px;font-weight:700;cursor:pointer">취소</button>' +
      '<button onclick="hpFreePost()" style="padding:9px 20px;border:none;border-radius:8px;background:#6366f1;color:#fff;font-size:13px;font-weight:700;cursor:pointer">등록하기</button>' +
      '</div>' +
      '</div></div>';

    /* 전체 목록 빌더는 전역 IIFE 함수가 처리 */
    var listContainer = '<div id="hp-free-board" style="border:1px solid rgba(0,0,0,.08);border-radius:12px;overflow:hidden"></div>';
    /* 렌더 후 목록 채우기용 스크립트 */
    var initScript = '<script>setTimeout(function(){var c=document.getElementById("hp-free-board");if(c&&typeof _fbBuildList==="undefined"){c.innerHTML="<p style=\'text-align:center;color:gray;padding:20px\'>로딩 중...</p>";}},0);<\/script>';

    var html =
      '<div style="max-width:960px;margin:0 auto">' +
      '<div style="display:flex;justify-content:flex-end;margin-bottom:10px">' +
      '<button id="hp-free-write-btn" onclick="hpFreeToggleWrite()" style="padding:9px 20px;border:none;border-radius:10px;background:#6366f1;color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px">&#9998;&#65039; 글쓰기</button>' +
      '</div>' +
      writeForm +
      listContainer +
      '</div>';

    /* 렌더 완료 후 목록 채우기 (DOM 삽입 후 실행) */
    setTimeout(function() {
      if (typeof window._fbRerender === 'function') window._fbRerender();
    }, 30);

    return _solWrap('💬 자유게시판', html);
  }

  /* ── 약관 렌더 ── */
  function _solRenderTerms(tabId, label) {
    var html = '';
    try { html = localStorage.getItem('terms_' + tabId) || ''; } catch(e) {}
    if (!html) html = '<p style="color:var(--hp-text-muted);font-size:14px;text-align:center;padding:40px 0">' + escHtml(label) + ' 내용이 없습니다.</p>';
    return _solWrap(label,
      '<div class="sol-terms-body" style="max-width:900px;margin:0 auto;color:var(--hp-text);font-size:14px;line-height:1.8;padding:20px 0">' + html + '</div>');
  }

  /* ── 게시판 렌더 ── */
  function _solRenderBoard(cat, label) {
    var items = [];
    try { items = JSON.parse(localStorage.getItem('board_items') || 'null') || []; } catch(e) {}
    var filtered = items.filter(function(it) { return it.cat === cat; });
    filtered.sort(function(a,b){ return (b.featured?1:0)-(a.featured?1:0); });
    filtered = filtered.slice(0, 10);
    var CAT_COLOR = { notice:'#ef4444', news:'#4f6ef7', free:'#f59e0b', qna:'#8b5cf6', faq:'#06b6d4', franchise:'#ec4899' };
    var color = CAT_COLOR[cat] || '#4f6ef7';

    /* ── 공지사항: 아코디언 ── */
    if (cat === 'notice') {
      if (!filtered.length) return _solWrap(label,
        '<p style="text-align:center;color:var(--hp-text-muted);padding:40px 0;font-size:14px">등록된 공지가 없습니다.</p>');
      var rows = filtered.map(function(it) {
        var pinTag = it.featured ? '<span style="font-size:10px;color:#f59e0b;margin-right:4px">&#128204;</span>' : '';
        var imgHtml = '';
        if (it.img) {
          imgHtml = '<img src="' + escAttr(it.img) + '" style="max-width:100%;border-radius:8px;margin-top:12px;display:block" loading="lazy">';
          if (it.imgCap) imgHtml += '<div style="font-size:11px;color:var(--hp-text-muted);margin-top:5px;text-align:center">' + escHtml(it.imgCap) + '</div>';
        }
        var inner = '<div style="padding:16px 20px 18px 52px;background:rgba(239,68,68,.03);border-top:1px solid #ef444418">' +
          '<div style="font-size:14px;color:var(--hp-text);line-height:1.8;white-space:pre-wrap">' + escHtml(it.content || '') + '</div>' +
          imgHtml + '</div>';
        return '<div class="hp-notice-item" style="border-bottom:1px solid rgba(0,0,0,.07)">' +
          '<div class="hp-nacc-hd" onclick="hpNoticeToggle(this)" style="display:flex;align-items:center;gap:10px;padding:14px 16px;cursor:pointer;user-select:none;transition:background .15s">' +
          '<span style="flex-shrink:0;font-size:11px;font-weight:700;background:#ef444422;color:#ef4444;padding:2px 8px;border-radius:4px">공지</span>' +
          '<span style="flex:1;font-size:14px;font-weight:600;color:var(--hp-text)">' + pinTag + escHtml(it.title) + '</span>' +
          '<span style="font-size:12px;color:var(--hp-text-muted);white-space:nowrap">' + (it.regDate||'') + '</span>' +
          '<span style="font-size:12px;color:var(--hp-text-muted);white-space:nowrap;margin-left:8px">&#128065; ' + (it.views||0) + '</span>' +
          '<span class="hp-nacc-arr" style="font-size:11px;color:var(--hp-text-muted);margin-left:8px;flex-shrink:0;transition:transform .25s">&#9658;</span>' +
          '</div>' +
          '<div class="hp-nacc-bd" style="max-height:0px;overflow:hidden;transition:max-height .35s ease">' + inner + '</div>' +
          '</div>';
      }).join('');
      return _solWrap(label,
        '<div style="max-width:960px;margin:0 auto;border:1px solid rgba(0,0,0,.08);border-radius:12px;overflow:hidden">' + rows + '</div>');
    }

    /* ── FAQ: Q/A 아코디언 ── */
    if (cat === 'faq') {
      if (!filtered.length) return _solWrap(label,
        '<p style="text-align:center;color:var(--hp-text-muted);padding:40px 0;font-size:14px">등록된 FAQ가 없습니다.</p>');
      var faqRows = filtered.map(function(it) {
        var qImgHtml = '';
        if (it.img) {
          qImgHtml = '<img src="' + escAttr(it.img) + '" style="max-width:100%;border-radius:8px;margin-top:10px;display:block" loading="lazy">';
          if (it.imgCap) qImgHtml += '<div style="font-size:11px;color:var(--hp-text-muted);margin-top:5px;text-align:center">' + escHtml(it.imgCap) + '</div>';
        }
        var aImgHtml = '';
        if (it.ansImg) {
          aImgHtml = '<img src="' + escAttr(it.ansImg) + '" style="max-width:100%;border-radius:8px;margin-top:10px;display:block" loading="lazy">';
          if (it.ansImgCap) aImgHtml += '<div style="font-size:11px;color:var(--hp-text-muted);margin-top:5px;text-align:center">' + escHtml(it.ansImgCap) + '</div>';
        }
        var bodyHtml =
          '<div style="padding:0 16px 16px">' +
          '<div style="display:grid;grid-template-columns:auto 1fr;gap:0;border-radius:10px;overflow:hidden;border:1px solid rgba(6,182,212,.2);margin-bottom:8px">' +
          '<div style="background:#06b6d4;display:flex;align-items:flex-start;justify-content:center;width:32px;padding:12px 0">' +
          '<span style="font-size:13px;font-weight:900;color:#fff">Q</span></div>' +
          '<div style="padding:11px 13px;background:rgba(6,182,212,.04)">' +
          '<div style="font-size:14px;color:var(--hp-text);line-height:1.8;white-space:pre-wrap">' + escHtml(it.content || it.title || '') + '</div>' +
          qImgHtml + '</div></div>' +
          (it.ans
            ? '<div style="display:grid;grid-template-columns:auto 1fr;gap:0;border-radius:10px;overflow:hidden;border:1px solid rgba(8,145,178,.18)">' +
              '<div style="background:#0891b2;display:flex;align-items:flex-start;justify-content:center;width:32px;padding:12px 0">' +
              '<span style="font-size:13px;font-weight:900;color:#fff">A</span></div>' +
              '<div style="padding:11px 13px;background:rgba(6,182,212,.03)">' +
              '<div style="font-size:14px;color:var(--hp-text);line-height:1.8;white-space:pre-wrap">' + escHtml(it.ans) + '</div>' +
              aImgHtml + '</div></div>'
            : '<div style="display:grid;grid-template-columns:auto 1fr;gap:0;border-radius:10px;overflow:hidden;border:1px solid rgba(0,0,0,.08)">' +
              '<div style="background:#94a3b8;display:flex;align-items:center;justify-content:center;width:32px;padding:12px 0">' +
              '<span style="font-size:13px;font-weight:900;color:#fff">A</span></div>' +
              '<div style="padding:11px 13px;background:rgba(0,0,0,.02)">' +
              '<div style="display:flex;align-items:center;gap:8px;padding:2px 0">' +
              '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' +
              '<span style="font-size:13px;color:var(--hp-text-muted)">답변 준비중</span></div></div></div>') +
          '</div>';
        return '<div class="hp-notice-item" style="border-bottom:1px solid rgba(0,0,0,.07)">' +
          '<div class="hp-nacc-hd" onclick="hpNoticeToggle(this)" style="display:flex;align-items:center;gap:10px;padding:14px 16px;cursor:pointer;user-select:none;transition:background .15s">' +
          '<span style="flex-shrink:0;font-size:11px;font-weight:700;background:#06b6d422;color:#06b6d4;padding:2px 8px;border-radius:4px">Q</span>' +
          '<span style="flex:1;font-size:14px;font-weight:600;color:var(--hp-text)">' + escHtml(it.title) + '</span>' +
          (it.ans
            ? '<span style="font-size:11px;background:#22c55e20;color:#22c55e;padding:1px 7px;border-radius:10px;white-space:nowrap;flex-shrink:0">답변완료</span>'
            : '<span style="font-size:11px;background:#f59e0b20;color:#f59e0b;padding:1px 7px;border-radius:10px;white-space:nowrap;flex-shrink:0">답변준비중</span>') +
          '<span class="hp-nacc-arr" style="font-size:11px;color:var(--hp-text-muted);margin-left:8px;flex-shrink:0;transition:transform .25s">&#9658;</span>' +
          '</div>' +
          '<div class="hp-nacc-bd" style="max-height:0px;overflow:hidden;transition:max-height .4s ease">' + bodyHtml + '</div>' +
          '</div>';
      }).join('');
      return _solWrap(label,
        '<div style="max-width:960px;margin:0 auto;border:1px solid rgba(0,0,0,.08);border-radius:12px;overflow:hidden">' + faqRows + '</div>');
    }

    var rows2 = filtered.map(function(it) {
      return '<div style="display:flex;align-items:baseline;gap:12px;padding:14px 0;border-bottom:1px solid rgba(0,0,0,.07)">' +
        '<span style="flex-shrink:0;font-size:11px;font-weight:700;background:' + color + '22;color:' + color + ';padding:2px 8px;border-radius:4px">' + escHtml(label.replace(/[^가-힣a-zA-Z0-9&]/g,'')) + '</span>' +
        '<span style="flex:1;font-size:14px;font-weight:600;color:var(--hp-text)">' + escHtml(it.title) + '</span>' +
        '<span style="flex-shrink:0;font-size:12px;color:var(--hp-text-muted)">' + (it.regDate || '') + '</span>' +
        '<span style="flex-shrink:0;font-size:12px;color:var(--hp-text-muted)">&#128065; ' + (it.views || 0) + '</span>' +
        '</div>';
    }).join('');
    if (!rows2) rows2 = '<p style="text-align:center;color:var(--hp-text-muted);padding:40px 0;font-size:14px">등록된 게시글이 없습니다.</p>';
    return _solWrap(label,
      '<div style="max-width:960px;margin:0 auto">' + rows2 + '</div>');
  }

  /* ── 가맹점 신청 전용 폼 ── */
  var _KR_REGIONS = [
    '서울 종로구','서울 중구','서울 용산구','서울 성동구','서울 광진구','서울 동대문구','서울 중랑구',
    '서울 성북구','서울 강북구','서울 도봉구','서울 노원구','서울 은평구','서울 서대문구','서울 마포구',
    '서울 양천구','서울 강서구','서울 구로구','서울 금천구','서울 영등포구','서울 동작구','서울 관악구',
    '서울 서초구','서울 강남구','서울 송파구','서울 강동구',
    '부산 중구','부산 서구','부산 동구','부산 영도구','부산 부산진구','부산 동래구','부산 남구',
    '부산 북구','부산 해운대구','부산 사하구','부산 금정구','부산 강서구','부산 연제구',
    '부산 수영구','부산 사상구','부산 기장군',
    '대구 중구','대구 동구','대구 서구','대구 남구','대구 북구','대구 수성구','대구 달서구','대구 달성군',
    '인천 중구','인천 동구','인천 미추홀구','인천 연수구','인천 남동구','인천 부평구','인천 계양구',
    '인천 서구','인천 강화군','인천 옹진군',
    '광주 동구','광주 서구','광주 남구','광주 북구','광주 광산구',
    '대전 동구','대전 중구','대전 서구','대전 유성구','대전 대덕구',
    '울산 중구','울산 남구','울산 동구','울산 북구','울산 울주군',
    '세종시',
    '경기 수원시','경기 성남시','경기 의정부시','경기 안양시','경기 부천시','경기 광명시','경기 평택시',
    '경기 동두천시','경기 안산시','경기 고양시','경기 과천시','경기 구리시','경기 남양주시','경기 오산시',
    '경기 시흥시','경기 군포시','경기 의왕시','경기 하남시','경기 용인시','경기 파주시','경기 이천시',
    '경기 안성시','경기 김포시','경기 화성시','경기 광주시','경기 양주시','경기 포천시','경기 여주시',
    '경기 연천군','경기 가평군','경기 양평군',
    '강원 춘천시','강원 원주시','강원 강릉시','강원 동해시','강원 태백시','강원 속초시','강원 삼척시',
    '강원 홍천군','강원 횡성군','강원 영월군','강원 평창군','강원 정선군','강원 철원군',
    '강원 화천군','강원 양구군','강원 인제군','강원 고성군','강원 양양군',
    '충북 청주시','충북 충주시','충북 제천시','충북 보은군','충북 옥천군','충북 영동군',
    '충북 증평군','충북 진천군','충북 괴산군','충북 음성군','충북 단양군',
    '충남 천안시','충남 공주시','충남 보령시','충남 아산시','충남 서산시','충남 논산시',
    '충남 계룡시','충남 당진시','충남 금산군','충남 부여군','충남 서천군','충남 청양군',
    '충남 홍성군','충남 예산군','충남 태안군',
    '전북 전주시','전북 군산시','전북 익산시','전북 정읍시','전북 남원시','전북 김제시',
    '전북 완주군','전북 진안군','전북 무주군','전북 장수군','전북 임실군','전북 순창군','전북 고창군','전북 부안군',
    '전남 목포시','전남 여수시','전남 순천시','전남 나주시','전남 광양시','전남 담양군','전남 곡성군',
    '전남 구례군','전남 고흥군','전남 보성군','전남 화순군','전남 장흥군','전남 강진군','전남 해남군',
    '전남 영암군','전남 무안군','전남 함평군','전남 영광군','전남 장성군','전남 완도군','전남 진도군','전남 신안군',
    '경북 포항시','경북 경주시','경북 김천시','경북 안동시','경북 구미시','경북 영주시','경북 영천시',
    '경북 상주시','경북 문경시','경북 경산시','경북 군위군','경북 의성군','경북 청송군','경북 영양군',
    '경북 영덕군','경북 청도군','경북 고령군','경북 성주군','경북 칠곡군','경북 예천군','경북 봉화군',
    '경북 울진군','경북 울릉군',
    '경남 창원시','경남 진주시','경남 통영시','경남 사천시','경남 김해시','경남 밀양시','경남 거제시',
    '경남 양산시','경남 의령군','경남 함안군','경남 창녕군','경남 고성군','경남 남해군','경남 하동군',
    '경남 산청군','경남 함양군','경남 거창군','경남 합천군',
    '제주 제주시','제주 서귀포시'
  ];

  function _solRenderFranchise() {
    /* 기존 신청 목록 로드 */
    var items = [];
    try { items = JSON.parse(localStorage.getItem('board_items') || '[]').filter(function(i){ return i.cat === 'franchise'; }); } catch(e) {}

    /* 상태 색상 */
    var ST = {
      '접수대기': { color:'#94a3b8', bg:'rgba(148,163,184,.12)' },
      '접수완료': { color:'#3b82f6', bg:'rgba(59,130,246,.1)' },
      '상담완료': { color:'#22c55e', bg:'rgba(34,197,94,.1)' },
      '계약완료': { color:'#ec4899', bg:'rgba(236,72,153,.12)' }
    };

    /* 마스킹 헬퍼 */
    var maskName = function(name) {
      if (!name) return '-';
      var chars = name.split('');
      return chars[0] + (chars.length > 1 ? ' ' + chars.slice(1).map(function(){ return '0'; }).join(' ') : '') + ' 님';
    };
    var maskPhone = function(phone) {
      if (!phone) return '-';
      return phone.replace(/(\d{3}-\d{2})\d{2}(-\d{4})/, '$1**$2').replace(/-\d{4}$/, '-****');
    };

    /* 목록 HTML */
    var listHtml;
    if (!items.length) {
      listHtml = '<div style="text-align:center;padding:60px 20px;color:var(--hp-text-muted);font-size:14px">아직 접수된 신청이 없습니다.</div>';
    } else {
      var rows = items.map(function(it) {
        var st = it.status || '접수대기';
        var sc = ST[st] || ST['접수대기'];
        return '<tr style="border-bottom:1px solid rgba(0,0,0,.06);transition:background .12s" onmouseover="this.style.background=\'rgba(236,72,153,.03)\'" onmouseout="this.style.background=\'\'">' +
          '<td style="padding:13px 14px;font-size:13px;font-weight:700;color:var(--hp-text)">' + escHtml(maskName(it.author)) + '</td>' +
          '<td style="padding:13px 14px;font-size:13px;color:var(--hp-text)">' + escHtml(it.region || '-') + '</td>' +
          '<td style="padding:13px 14px;font-size:12px;color:var(--hp-text-muted);font-family:monospace">' + escHtml(maskPhone(it.phone)) + '</td>' +
          '<td style="padding:13px 14px;font-size:12px;color:var(--hp-text-muted)">' + escHtml(it.regDate || '-') + '</td>' +
          '<td style="padding:13px 14px"><span style="font-size:11px;font-weight:700;color:' + sc.color + ';background:' + sc.bg + ';padding:3px 10px;border-radius:20px;white-space:nowrap">' + escHtml(st) + '</span></td>' +
          '</tr>';
      }).join('');
      listHtml =
        '<div style="overflow-x:auto">' +
        '<table style="width:100%;border-collapse:collapse;min-width:560px">' +
        '<thead><tr style="border-bottom:2px solid rgba(0,0,0,.08)">' +
        '<th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:var(--hp-text-muted)">이름</th>' +
        '<th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:var(--hp-text-muted)">신청지역</th>' +
        '<th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:var(--hp-text-muted)">연락처</th>' +
        '<th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:var(--hp-text-muted)">신청일</th>' +
        '<th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:var(--hp-text-muted)">상태</th>' +
        '</tr></thead><tbody>' + rows + '</tbody></table></div>';
    }

    /* 폼 팝업 모달 */
    var inp = function(id, type, ph, extra) {
      return '<input id="' + id + '" type="' + type + '" placeholder="' + ph + '" autocomplete="off" ' + (extra||'') +
        ' style="width:100%;height:44px;padding:0 13px;border:1.5px solid rgba(0,0,0,.12);border-radius:9px;font-size:14px;background:var(--hp-bg-card,#fff);color:var(--hp-text);outline:none;box-sizing:border-box;font-family:inherit;transition:border-color .2s"' +
        ' onfocus="this.style.borderColor=\'#ec4899\'" onblur="this.style.borderColor=\'rgba(0,0,0,.12)\'">';
    };
    var lbl = function(t, sub) {
      return '<label style="font-size:12px;font-weight:800;color:var(--hp-text-muted);display:block;margin-bottom:6px">' + t +
        (sub ? ' <span style="font-weight:500;font-size:11px">' + sub + '</span>' : '') + '</label>';
    };
    var fRow = function(inner) { return '<div style="margin-bottom:15px">' + inner + '</div>'; };

    var modalHtml =
      '<div id="frc-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:5000;align-items:center;justify-content:center;padding:16px" onclick="if(event.target===this)hpFrcCloseModal()">' +
      '<div style="background:var(--hp-bg-card,#fff);border-radius:18px;width:520px;max-width:100%;max-height:92vh;overflow-y:auto;box-shadow:0 28px 60px rgba(0,0,0,.35);display:flex;flex-direction:column">' +
      /* 모달 헤더 */
      '<div style="background:linear-gradient(135deg,#ec4899,#db2777);border-radius:18px 18px 0 0;padding:22px 24px 18px;color:#fff;display:flex;align-items:center;justify-content:space-between">' +
      '<div><div style="font-size:18px;font-weight:900;margin-bottom:3px">🏪 가맹점 신청</div>' +
      '<div style="font-size:12px;opacity:.88">담당자가 확인 후 연락드립니다</div></div>' +
      '<button onclick="hpFrcCloseModal()" style="background:rgba(255,255,255,.2);border:none;color:#fff;font-size:20px;width:32px;height:32px;border-radius:50%;cursor:pointer;line-height:1">×</button>' +
      '</div>' +
      /* 폼 */
      '<div style="padding:22px 24px">' +
      fRow(lbl('신청자 이름 <span style="color:#ec4899">*</span>') + inp('frc-name','text','성함을 입력하세요')) +
      fRow(lbl('연락처 <span style="color:#ec4899">*</span>') + inp('frc-phone','text','010-0000-0000','oninput="hpFrcFormatPhone(this)" maxlength="13"')) +
      /* 지역 자동완성 */
      '<div style="margin-bottom:15px;position:relative">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">' +
      lbl('신청 지역 <span style="color:#ec4899">*</span>') +
      '<span id="frc-ip-badge" style="font-size:11px;color:#ec4899;font-weight:600;display:flex;align-items:center;gap:4px">' +
      '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>' +
      '위치 감지 중...</span></div>' +
      inp('frc-region','text','지역명 입력 (예: 서울 강남구)','oninput="hpFrcSearch(this.value)"') +
      '<div id="frc-dropdown" style="display:none;position:absolute;top:calc(100% - 1px);left:0;right:0;background:var(--hp-bg-card,#fff);border:1.5px solid #ec4899;border-top:1px solid rgba(0,0,0,.07);border-radius:0 0 9px 9px;box-shadow:0 8px 20px rgba(236,72,153,.15);z-index:99;max-height:200px;overflow-y:auto"></div>' +
      '</div>' +
      fRow(lbl('신청 내용') +
        '<textarea id="frc-content" rows="3" placeholder="가맹 신청 내용을 자유롭게 작성해주세요..."' +
        ' style="width:100%;padding:11px 13px;border:1.5px solid rgba(0,0,0,.12);border-radius:9px;font-size:14px;background:var(--hp-bg-card,#fff);color:var(--hp-text);outline:none;resize:none;box-sizing:border-box;font-family:inherit;line-height:1.7;transition:border-color .2s"' +
        ' onfocus="this.style.borderColor=\'#ec4899\'" onblur="this.style.borderColor=\'rgba(0,0,0,.12)\'"></textarea>') +
      fRow(lbl('비밀번호', '(신청 내역 조회 시 사용)') + inp('frc-pwd','password','비밀번호를 설정하세요')) +
      '<div style="background:rgba(236,72,153,.04);border:1px solid rgba(236,72,153,.18);border-radius:9px;padding:12px 14px;margin-bottom:18px">' +
      '<label style="display:flex;align-items:flex-start;gap:9px;cursor:pointer">' +
      '<input id="frc-agree" type="checkbox" style="margin-top:2px;width:15px;height:15px;accent-color:#ec4899;flex-shrink:0;cursor:pointer">' +
      '<span style="font-size:12px;color:var(--hp-text-muted);line-height:1.6">개인정보 수집 및 이용에 동의합니다.<br>' +
      '<span style="font-size:11px;opacity:.75">수집 항목: 이름, 연락처, 지역 / 목적: 가맹점 신청 처리</span></span>' +
      '</label></div>' +
      '<button onclick="hpFranchiseSubmit()" style="width:100%;height:50px;border:none;border-radius:11px;background:linear-gradient(135deg,#ec4899,#db2777);color:#fff;font-size:15px;font-weight:800;cursor:pointer;box-shadow:0 4px 14px rgba(236,72,153,.35);transition:transform .15s" onmouseover="this.style.transform=\'translateY(-1px)\'" onmouseout="this.style.transform=\'\'">🏪 가맹점 신청하기</button>' +
      '</div></div></div>';

    /* 상태 범례 */
    var legendHtml = ['접수대기','접수완료','상담완료','계약완료'].map(function(s) {
      var sc = ST[s];
      return '<span style="font-size:11px;font-weight:700;color:' + sc.color + ';background:' + sc.bg + ';padding:3px 9px;border-radius:20px">' + s + '</span>';
    }).join('');

    var pageHtml =
      modalHtml +
      '<div style="max-width:960px;margin:0 auto">' +
      /* 상단 헤더 */
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px">' +
      '<div>' +
      '<div style="font-size:15px;font-weight:800;color:var(--hp-text);margin-bottom:4px">신청 현황</div>' +
      '<div style="display:flex;align-items:center;gap:6px">' + legendHtml + '</div>' +
      '</div>' +
      '<button onclick="hpFrcOpenModal()" style="padding:10px 20px;border:none;border-radius:10px;background:linear-gradient(135deg,#ec4899,#db2777);color:#fff;font-size:13px;font-weight:800;cursor:pointer;box-shadow:0 3px 12px rgba(236,72,153,.3);display:flex;align-items:center;gap:6px;white-space:nowrap;transition:transform .15s" onmouseover="this.style.transform=\'translateY(-1px)\'" onmouseout="this.style.transform=\'\'">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
      '가맹점 신청하기</button>' +
      '</div>' +
      /* 목록 카드 */
      '<div id="frc-list-wrap" style="background:var(--hp-bg-card,#fff);border-radius:14px;border:1px solid rgba(0,0,0,.07);overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.06)">' +
      listHtml +
      '</div></div>';

    setTimeout(function() {
      /* IP 위치 자동 감지 */
      var badge = document.getElementById('frc-ip-badge');
      var regionInp = document.getElementById('frc-region');
      if (regionInp && badge) {
        fetch('https://ip-api.com/json/?lang=ko&fields=status,city,regionName,district')
          .then(function(r){ return r.json(); })
          .then(function(d){
            if (d.status === 'success') {
              var rawCity = d.city || '';
              var rawDist = d.district || '';
              var rawReg  = d.regionName || '';
              /* 매칭용 — 시/군/구 접미사 제거 */
              var city = rawCity.replace(/시$|군$|구$/, '');
              var dist = rawDist.replace(/시$|군$|구$/, '');
              /* 도 이름 단축: 강원특별자치도→강원, 경기도→경기 등 */
              var prov = rawReg.replace(/특별자치[도시]|광역시|특별시|도$|시$/, '').trim();
              var matched =
                _KR_REGIONS.filter(function(r){ return rawCity && r.replace(/\s/g,'').indexOf(rawCity.replace(/\s/g,'')) !== -1; })[0] ||
                _KR_REGIONS.filter(function(r){ return city && r.replace(/\s/g,'').indexOf(city) !== -1; })[0] ||
                _KR_REGIONS.filter(function(r){ return dist && r.replace(/\s/g,'').indexOf(dist) !== -1; })[0] ||
                _KR_REGIONS.filter(function(r){ return prov && r.indexOf(prov) !== -1; })[0] ||
                '';
              if (matched) {
                regionInp.value = matched;
                badge.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg><span style="color:#22c55e">위치 감지 완료</span>';
              } else {
                if (rawCity) regionInp.placeholder = rawCity + ' (직접 입력)';
                badge.innerHTML = '<span style="color:var(--hp-text-muted)">직접 입력해 주세요</span>';
              }
            } else { badge.innerHTML = '<span style="color:var(--hp-text-muted)">직접 입력해 주세요</span>'; }
          }).catch(function(){ badge.innerHTML = '<span style="color:var(--hp-text-muted)">직접 입력해 주세요</span>'; });
      }
      /* 바깥 클릭 닫기 */
      document.addEventListener('click', function(e) {
        var dd = document.getElementById('frc-dropdown');
        var ir = document.getElementById('frc-region');
        if (dd && ir && !ir.contains(e.target) && !dd.contains(e.target)) dd.style.display = 'none';
      });
    }, 80);

    return _solWrap('🏪 가맹점 신청', pageHtml);
  }

  /* 팝업 모달 열기/닫기 */
  window.hpFrcOpenModal = function() {
    var m = document.getElementById('frc-modal');
    if (m) { m.style.display = 'flex'; }
  };
  window.hpFrcCloseModal = function() {
    var m = document.getElementById('frc-modal');
    if (m) { m.style.display = 'none'; }
  };


  /* 지역 실시간 검색 */
  window.hpFrcSearch = function(val) {
    var dd = document.getElementById('frc-dropdown');
    if (!dd) return;
    var q = val.trim().replace(/\s+/g, ' ');
    if (!q) { dd.style.display = 'none'; return; }
    var hits = _KR_REGIONS.filter(function(r) {
      return r.replace(/\s/g,'').indexOf(q.replace(/\s/g,'')) !== -1;
    }).slice(0, 10);
    if (!hits.length) { dd.style.display = 'none'; return; }
    dd.innerHTML = hits.map(function(r, i) {
      var parts = r.split(' '), prefix = parts[0], name = parts.slice(1).join(' ');
      return '<div onclick="hpFrcSelect(\'' + r.replace(/'/g,"\\'") + '\')" ' +
        'style="padding:10px 13px;cursor:pointer;font-size:13px;display:flex;align-items:center;gap:10px;' +
        'border-bottom:' + (i < hits.length-1 ? '1px solid rgba(0,0,0,.06)' : 'none') + ';transition:background .1s" ' +
        'onmouseover="this.style.background=\'rgba(236,72,153,.07)\'" onmouseout="this.style.background=\'\'">' +
        '<span style="font-size:10px;font-weight:700;background:#ec489918;color:#ec4899;padding:2px 6px;border-radius:4px;flex-shrink:0">' + escHtml(prefix) + '</span>' +
        '<span style="font-weight:600;color:var(--hp-text)">' + escHtml(name || prefix) + '</span>' +
        '</div>';
    }).join('');
    dd.style.display = 'block';
  };

  window.hpFrcSelect = function(region) {
    var inp = document.getElementById('frc-region'), dd = document.getElementById('frc-dropdown');
    if (inp) inp.value = region;
    if (dd) dd.style.display = 'none';
  };

  /* 전화번호 자동 하이픈 포맷 */
  window.hpFrcFormatPhone = function(el) {
    var pos = el.selectionStart;
    var prev = el.value;
    var digits = prev.replace(/\D/g, '').slice(0, 11); /* 최대 11자리 */
    var formatted;
    if (digits.startsWith('02')) {
      /* 서울 지역번호: 02-XXXX-XXXX or 02-XXX-XXXX */
      if (digits.length <= 2)       formatted = digits;
      else if (digits.length <= 5)  formatted = digits.slice(0,2) + '-' + digits.slice(2);
      else if (digits.length <= 9)  formatted = digits.slice(0,2) + '-' + digits.slice(2,5) + '-' + digits.slice(5);
      else                          formatted = digits.slice(0,2) + '-' + digits.slice(2,6) + '-' + digits.slice(6,10);
    } else {
      /* 010/011/031 등: XXX-XXXX-XXXX or XXX-XXX-XXXX */
      if (digits.length <= 3)       formatted = digits;
      else if (digits.length <= 6)  formatted = digits.slice(0,3) + '-' + digits.slice(3);
      else if (digits.length <= 10) formatted = digits.slice(0,3) + '-' + digits.slice(3,6) + '-' + digits.slice(6);
      else                          formatted = digits.slice(0,3) + '-' + digits.slice(3,7) + '-' + digits.slice(7,11);
    }
    if (el.value !== formatted) {
      var addedDashes = (formatted.match(/-/g)||[]).length - (prev.slice(0,pos).match(/-/g)||[]).length;
      el.value = formatted;
      var newPos = pos + addedDashes;
      el.setSelectionRange(newPos, newPos);
    }
  };

  /* 가맹점 신청 제출 */
  window.hpFranchiseSubmit = function() {
    var g = function(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
    var name = g('frc-name'), phone = g('frc-phone'), region = g('frc-region'), content = g('frc-content'), pwd = g('frc-pwd');
    var agree = document.getElementById('frc-agree');
    if (!name)   { if(typeof showToast==='function') showToast('warning','신청자 이름을 입력하세요'); return; }
    if (!phone)  { if(typeof showToast==='function') showToast('warning','연락처를 입력하세요'); return; }
    if (!region) { if(typeof showToast==='function') showToast('warning','신청 지역을 입력하세요'); return; }
    if (!agree || !agree.checked) { if(typeof showToast==='function') showToast('warning','개인정보 수집에 동의해주세요'); return; }
    var item = {
      id: 'frc' + Date.now(), cat: 'franchise', status: '접수대기',
      author: name, phone: phone, region: region, content: content, pwd: pwd,
      title: region + ' 가맹점 신청 – ' + name,
      regDate: new Date().toISOString().split('T')[0], views: 0
    };
    try {
      var arr = JSON.parse(localStorage.getItem('board_items') || '[]');
      arr.unshift(item);
      localStorage.setItem('board_items', JSON.stringify(arr));
    } catch(e) {}
    ['frc-name','frc-phone','frc-region','frc-content','frc-pwd'].forEach(function(id){ var el = document.getElementById(id); if (el) el.value = ''; });
    if (agree) agree.checked = false;
    window.hpFrcCloseModal();
    _hpRefreshFrcList(); /* ← 목록 즉시 갱신 */
    if(typeof showToast==='function') showToast('success','가맹점 신청이 완료되었습니다. 담당자가 연락드리겠습니다 🎉');
  };

  /* 가맹점 목록 즉시 재렌더링 */
  function _hpRefreshFrcList() {
    var wrap = document.getElementById('frc-list-wrap');
    if (!wrap) return;
    var items = [];
    try { items = JSON.parse(localStorage.getItem('board_items') || '[]').filter(function(i){ return i.cat === 'franchise'; }); } catch(e) {}
    var ST = {
      '접수대기':{ color:'#94a3b8', bg:'rgba(148,163,184,.12)' },
      '접수완료':{ color:'#3b82f6', bg:'rgba(59,130,246,.1)' },
      '상담완료':{ color:'#22c55e', bg:'rgba(34,197,94,.1)' },
      '계약완료':{ color:'#ec4899', bg:'rgba(236,72,153,.12)' }
    };
    var maskName = function(n) {
      if (!n) return '-';
      var c = n.split('');
      return c[0] + (c.length > 1 ? ' ' + c.slice(1).map(function(){ return '0'; }).join(' ') : '') + ' 님';
    };
    var maskPhone = function(p) {
      if (!p) return '-';
      return p.replace(/(\d{3}-\d{2})\d{2}(-\d{4})/, '$1**$2').replace(/-\d{4}$/, '-****');
    };
    if (!items.length) {
      wrap.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--hp-text-muted);font-size:14px">아직 접수된 신청이 없습니다.</div>';
      return;
    }
    var rows = items.map(function(it) {
      var st = it.status || '접수대기';
      var sc = ST[st] || ST['접수대기'];
      return '<tr style="border-bottom:1px solid rgba(0,0,0,.06);transition:background .12s" onmouseover="this.style.background=\'rgba(236,72,153,.03)\'" onmouseout="this.style.background=\'\'">' +
        '<td style="padding:13px 14px;font-size:13px;font-weight:700;color:var(--hp-text)">' + escHtml(maskName(it.author)) + '</td>' +
        '<td style="padding:13px 14px;font-size:13px;color:var(--hp-text)">' + escHtml(it.region || '-') + '</td>' +
        '<td style="padding:13px 14px;font-size:12px;color:var(--hp-text-muted);font-family:monospace">' + escHtml(maskPhone(it.phone)) + '</td>' +
        '<td style="padding:13px 14px;font-size:12px;color:var(--hp-text-muted)">' + escHtml(it.regDate || '-') + '</td>' +
        '<td style="padding:13px 14px"><span style="font-size:11px;font-weight:700;color:' + sc.color + ';background:' + sc.bg + ';padding:3px 10px;border-radius:20px;white-space:nowrap">' + escHtml(st) + '</span></td>' +
        '</tr>';
    }).join('');
    wrap.innerHTML =
      '<div style="overflow-x:auto">' +
      '<table style="width:100%;border-collapse:collapse;min-width:560px">' +
      '<thead><tr style="border-bottom:2px solid rgba(0,0,0,.08)">' +
      '<th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:var(--hp-text-muted)">이름</th>' +
      '<th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:var(--hp-text-muted)">신청지역</th>' +
      '<th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:var(--hp-text-muted)">연락처</th>' +
      '<th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:var(--hp-text-muted)">신청일</th>' +
      '<th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:var(--hp-text-muted)">상태</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  /* ── 컨텐츠관리 렌더 ── */
  function _solRenderChub() {
    var items = [];
    try { items = JSON.parse(localStorage.getItem('chub_items') || '[]'); } catch(e) {}
    var visible = items.slice(0, 8);
    if (!visible.length) return _solWrap('컨텐츠관리', '<p style="text-align:center;color:var(--hp-text-muted);padding:40px 0;font-size:14px">등록된 컨텐츠가 없습니다.</p>');
    var TYPE_COLOR = { news:'#4f6ef7', blog:'#22c55e', youtube:'#ef4444', website:'#f59e0b' };
    var cards = visible.map(function(it) {
      var c = TYPE_COLOR[it.type] || '#6b7280';
      var img = it.img ? '<div style="width:100%;aspect-ratio:16/9;overflow:hidden;border-radius:8px 8px 0 0"><img src="' + escAttr(it.img) + '" style="width:100%;height:100%;object-fit:cover" loading="lazy" onerror="this.style.display=\'none\'"></div>' : '';
      return '<div style="background:var(--hp-bg-card,#fff);border-radius:10px;box-shadow:0 2px 12px rgba(0,0,0,.08);overflow:hidden">' +
        img +
        '<div style="padding:12px 14px">' +
        '<span style="font-size:10px;font-weight:700;color:' + c + ';background:' + c + '18;padding:2px 7px;border-radius:4px">' + escHtml(it.type||'') + '</span>' +
        '<div style="font-size:13px;font-weight:700;color:var(--hp-text);margin-top:7px;line-height:1.4">' + escHtml(it.title||'') + '</div>' +
        '<div style="font-size:11px;color:var(--hp-text-muted);margin-top:4px">' + escHtml((it.summary||'').slice(0,60)) + '</div>' +
        '</div></div>';
    }).join('');
    return _solWrap('컨텐츠관리',
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;max-width:1100px;margin:0 auto">' + cards + '</div>');
  }

  /* ── 미디어관리 렌더 ── */
  function _solRenderMedia() {
    var items = [];
    try { items = JSON.parse(localStorage.getItem('med_items') || '[]'); } catch(e) {}
    var visible = items.slice(0, 12);
    if (!visible.length) return _solWrap('미디어관리', '<p style="text-align:center;color:var(--hp-text-muted);padding:40px 0;font-size:14px">등록된 미디어가 없습니다.</p>');
    var imgs = visible.map(function(it) {
      var src = it.dataUrl || it.img || '';
      if (!src) return '';
      return '<div style="overflow:hidden;border-radius:8px;aspect-ratio:1">' +
        '<img src="' + escAttr(src) + '" alt="' + escAttr(it.title||'') + '" style="width:100%;height:100%;object-fit:cover;transition:transform .3s" loading="lazy" onmouseover="this.style.transform=\'scale(1.05)\'" onmouseout="this.style.transform=\'scale(1)\'" onerror="this.parentElement.style.display=\'none\'">' +
        '</div>';
    }).join('');
    return _solWrap('미디어관리',
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;max-width:1100px;margin:0 auto">' + imgs + '</div>');
  }

  /* ── Q&A 렌더 ── */
  function _solRenderQnaBoard() {
    /* ── 질문 작성 폼 (초기 접힘) ── */
    var writeForm =
      '<div id="hp-qna-write-form" style="max-height:0px;overflow:hidden;transition:max-height .4s ease;background:rgba(139,92,246,.04);border-radius:12px;margin-bottom:12px">' +
      '<div style="padding:18px 20px">' +
      '<div style="font-size:13px;font-weight:700;color:#8b5cf6;margin-bottom:12px">&#10067; 새 질문 작성</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">' +
      '<input id="hp-qna-w-author" type="text" placeholder="이름 (익명)" style="padding:9px 12px;border:1.5px solid rgba(139,92,246,.25);border-radius:8px;font-size:13px;background:var(--hp-bg,#fff);color:var(--hp-text);outline:none">' +
      '<input id="hp-qna-w-pwd" type="password" placeholder="비밀번호 (삭제용)" style="padding:9px 12px;border:1.5px solid rgba(139,92,246,.25);border-radius:8px;font-size:13px;background:var(--hp-bg,#fff);color:var(--hp-text);outline:none">' +
      '</div>' +
      '<input id="hp-qna-w-title" type="text" placeholder="질문 제목을 입력하세요" style="width:100%;padding:9px 12px;border:1.5px solid rgba(139,92,246,.25);border-radius:8px;font-size:13px;background:var(--hp-bg,#fff);color:var(--hp-text);outline:none;box-sizing:border-box;margin-bottom:8px">' +
      '<textarea id="hp-qna-w-content" rows="5" placeholder="질문 내용을 자세히 입력하세요..." style="width:100%;padding:9px 12px;border:1.5px solid rgba(139,92,246,.25);border-radius:8px;font-size:13px;background:var(--hp-bg,#fff);color:var(--hp-text);resize:vertical;outline:none;box-sizing:border-box;line-height:1.6;font-family:inherit;margin-bottom:10px"></textarea>' +
      '<div style="display:flex;justify-content:flex-end;gap:8px">' +
      '<button onclick="hpQnaToggleWrite()" style="padding:9px 18px;border:1.5px solid #8b5cf6;border-radius:8px;background:transparent;color:#8b5cf6;font-size:13px;font-weight:700;cursor:pointer">취소</button>' +
      '<button onclick="hpQnaPost()" style="padding:9px 20px;border:none;border-radius:8px;background:#8b5cf6;color:#fff;font-size:13px;font-weight:700;cursor:pointer">질문 등록</button>' +
      '</div>' +
      '</div></div>';

    var html =
      '<div style="max-width:960px;margin:0 auto">' +
      '<div style="display:flex;justify-content:flex-end;margin-bottom:10px">' +
      '<button id="hp-qna-write-btn" onclick="hpQnaToggleWrite()" style="padding:9px 20px;border:none;border-radius:10px;background:#8b5cf6;color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px">&#10067; 질문하기</button>' +
      '</div>' +
      writeForm +
      '<div id="hp-qna-board" style="border:1px solid rgba(0,0,0,.08);border-radius:12px;overflow:hidden">' +
      '<p style="text-align:center;color:var(--hp-text-muted);padding:30px;font-size:13px">로딩 중...</p>' +
      '</div></div>';

    setTimeout(function() {
      if (typeof window._qaRerender === 'function') window._qaRerender();
    }, 30);
    return _solWrap('❓ Q&A', html);
  }

  /* ══════════════════════════
     4. 푸터 영역
  ══════════════════════════ */
  function renderFooter() {
    renderFooterLogo();
    renderFooterMenu();
    renderFooterText();
    renderCopyright();
  }

  function renderFooterLogo() {
    var el = document.getElementById('hpFooterLogo');
    if (!el) return;
    var data = getLS('hp_footer_logobox');
    var bg = '#1a1a2e', h = 120, op = 100;
    if (data) {
      bg = data.bgColor || bg;
      h = data.height || h;
      op = data.opacity || op;
    }
    el.style.background = bg;
    el.style.minHeight = h + 'px';
    el.style.opacity = (parseInt(op) / 100).toFixed(2);

    var botH = getLSRaw('hp_logo_bot_h') || getLSRaw('hp_logo_hp_logo_bot_h');
    var botV = getLSRaw('hp_logo_bot_v') || getLSRaw('hp_logo_hp_logo_bot_v');

    var inner = '';
    if (botH && botV) {
      /* 가로/세로 모두 있을 때: CSS 반응형 전환 */
      var wBotH = getLSRaw('hp_logo_width_hp_logo_bot_h');
      var wBotV = getLSRaw('hp_logo_width_hp_logo_bot_v');
      var sBotH = wBotH ? 'width:' + wBotH + 'px;height:auto' : 'max-height:' + Math.round(h * 0.6) + 'px';
      var sBotV = wBotV ? 'width:' + wBotV + 'px;height:auto' : 'max-height:' + Math.round(h * 0.7) + 'px';
      inner += '<img class="hp-logo-h" src="' + botH + '" alt="Logo" style="' + sBotH + '">';
      inner += '<img class="hp-logo-v" src="' + botV + '" alt="Logo" style="' + sBotV + '">';
    } else if (botH) {
      var wBotH2 = getLSRaw('hp_logo_width_hp_logo_bot_h');
      inner += '<img src="' + botH + '" alt="Logo" style="' + (wBotH2 ? 'width:' + wBotH2 + 'px;height:auto' : 'max-height:' + Math.round(h * 0.6) + 'px') + '">';
    } else if (botV) {
      var wBotV2 = getLSRaw('hp_logo_width_hp_logo_bot_v');
      inner += '<img src="' + botV + '" alt="Logo" style="' + (wBotV2 ? 'width:' + wBotV2 + 'px;height:auto' : 'max-height:' + Math.round(h * 0.7) + 'px') + '">';
    }
    if (!inner) {
      inner = '<span style="font-size:28px;font-weight:900;color:rgba(255,255,255,0.2);letter-spacing:2px">WORKM</span>';
    }
    el.innerHTML = inner;
  }

  function renderFooterMenu() {
    var el = document.getElementById('hpFooterMenu');
    if (!el) return;
    var data = getLS('hp_footer_menu');
    if (!data || !data.menus || !data.menus.length) { el.style.display = 'none'; return; }

    el.style.display = 'flex';
    el.style.background = data.bgColor || '#0f172a';
    el.style.minHeight = (data.height || 56) + 'px';
    el.style.opacity = (parseInt(data.opacity || 100) / 100).toFixed(2);

    var jc = { left: 'flex-start', center: 'center', right: 'flex-end' }[data.align] || 'center';
    el.style.justifyContent = jc;
    el.style.gap = (data.gap || 24) + 'px';

    el.innerHTML = data.menus.map(function (name) {
      return '<a href="#" style="font-size:' + (data.fontSize || 13) + 'px;color:' + (data.fontColor || '#94a3b8') + '">' + escHtml(name) + '</a>';
    }).join('');
  }

  function renderFooterText() {
    var el = document.getElementById('hpFooterText');
    if (!el) return;
    var data = getLS('hp_footer_text');
    var d = { bgColor: '#0a0a1a', fontColor: '#64748b', fontSize: 12, height: 80, opacity: 100, align: 'center', text: '' };
    if (data) Object.keys(data).forEach(function (k) { d[k] = data[k]; });

    el.style.background = d.bgColor;
    el.style.minHeight = d.height + 'px';
    el.style.opacity = (parseInt(d.opacity) / 100).toFixed(2);
    el.style.justifyContent = { left: 'flex-start', center: 'center', right: 'flex-end' }[d.align] || 'center';

    var content = el.querySelector('.hp-footer-text-content');
    if (content) {
      content.style.fontSize = d.fontSize + 'px';
      content.style.color = d.fontColor;
      content.style.textAlign = d.align || 'center';

      var text = d.text || '';
      if (!text.trim()) {
        var hq = getLS('ws_hq_info');
        if (hq) {
          var parts = [];
          if (hq.name) parts.push(hq.name);
          if (hq.address) parts.push('주소: ' + hq.address);
          if (hq.phone) parts.push('TEL: ' + hq.phone);
          if (hq.fax) parts.push('FAX: ' + hq.fax);
          if (hq.email) parts.push('E-mail: ' + hq.email);
          text = parts.join('  |  ');
        } else {
          text = '© ' + new Date().getFullYear() + ' 워크엠. All rights reserved.';
        }
      }
      content.textContent = text;
    }
  }

  function renderCopyright() {
    var el = document.getElementById('hpCopyright');
    if (!el) return;
    var data = getLS('hp_copyright');
    var d = { bgColor: '#050510', fontColor: '#475569', fontSize: 11, height: 48, opacity: 100, align: 'center', text: '' };
    if (data) Object.keys(data).forEach(function (k) { d[k] = data[k]; });

    el.style.background = d.bgColor;
    el.style.minHeight = d.height + 'px';
    el.style.opacity = (parseInt(d.opacity) / 100).toFixed(2);
    el.style.justifyContent = { left: 'flex-start', center: 'center', right: 'flex-end' }[d.align] || 'center';

    var content = el.querySelector('.hp-copyright-content');
    if (content) {
      content.style.fontSize = d.fontSize + 'px';
      content.style.color = d.fontColor;
      content.style.textAlign = d.align || 'center';
      content.textContent = d.text || '© ' + new Date().getFullYear() + ' 워크엠(WorkM). All rights reserved.';
    }
  }

  /* ══════════════════════════
     레이아웃 업데이트 (리벳+헤더 위치 계산)
     헤더 배경 투명도 < 100%이면 메인컨텐츠가 헤더 뒤로 비침
  ══════════════════════════ */
  function updateLayout() {
    var rivetEl = document.getElementById('hpRivet');
    var headerEl = document.getElementById('hpHeader');
    var mainEl = document.getElementById('hpMainContent');
    if (!headerEl) return;

    // 리벳 높이 계산 (리벳 표시 여부)
    var rivetH = 0;
    if (rivetEl && rivetEl.style.display !== 'none') {
      rivetH = rivetEl.offsetHeight || 0;
    }

    // 헤더 top 위치 = 리벳 높이 아래
    headerEl.style.top = rivetH + 'px';

    // 메인 컨텐츠: 항상 페이지 최상단부터 (헤더 뒤로 비침)
    // 투명도가 있으면 컨텐츠가 보이고, 불투명이면 가려짐
    if (mainEl) {
      mainEl.style.marginTop = '0';
    }
  }

  /* ══════════════════════════
     유틸리티
  ══════════════════════════ */
  function escHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escAttr(str) {
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function hexToRgb(hex) {
    if (!hex || hex.charAt(0) !== '#') return null;
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return isNaN(r) ? null : { r: r, g: g, b: b };
  }

  /* ══════════════════════════
     모바일 메뉴
  ══════════════════════════ */
  function initMobileMenu() {
    var btn = document.getElementById('hpMobileBtn');
    var drawer = document.getElementById('hpMobileDrawer');
    var overlay = document.getElementById('hpMobileOverlay');
    if (!btn || !drawer) return;

    function toggle() {
      var isOpen = drawer.classList.contains('open');
      if (isOpen) {
        drawer.classList.remove('open');
        btn.classList.remove('active');
        if (overlay) { overlay.classList.remove('show'); setTimeout(function () { overlay.style.display = 'none'; }, 300); }
      } else {
        drawer.classList.add('open');
        btn.classList.add('active');
        if (overlay) { overlay.style.display = 'block'; setTimeout(function () { overlay.classList.add('show'); }, 10); }
      }
    }

    btn.addEventListener('click', toggle);
    if (overlay) overlay.addEventListener('click', toggle);
  }

  /* ══════════════════════════
     스크롤 효과
  ══════════════════════════ */
  function initScrollEffects() {
    var header = document.getElementById('hpHeader');

    window.addEventListener('scroll', function () {
      if (header) {
        if (window.scrollY > 20) header.classList.add('scrolled');
        else header.classList.remove('scrolled');
      }
    }, { passive: true });

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });

      document.querySelectorAll('.fade-in-up').forEach(function (el) {
        observer.observe(el);
      });

      window._hpObserver = observer;
    }
  }

  function observeNewElements() {
    if (!window._hpObserver) return;
    document.querySelectorAll('.fade-in-up:not(.visible)').forEach(function (el) {
      window._hpObserver.observe(el);
    });
  }

  /* ══════════════════════════
     로딩 / 아이콘
  ══════════════════════════ */
  function hideLoading() {
    var loader = document.getElementById('hpLoading');
    if (loader) {
      loader.classList.add('hide');
      setTimeout(function () { loader.remove(); }, 500);
    }
  }

  function initIcons() {
    if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
      lucide.createIcons();
    }
  }

  /* ══════════════════════════
     솔루션 페이지 렌더링
  ══════════════════════════ */
  /* ── 통합 솔루션 마스터 목록 (라벨, 아이콘, 설명 포함) ── */
  var _solutionItemsForPage = [
    { id: 'terms',     label: '이용약관',         icon: 'scroll-text',     desc: '서비스 이용에 관한 약관 정보를 확인하세요.' },
    { id: 'privacy',   label: '개인정보 취급방침', icon: 'shield-check',    desc: '개인정보 보호 및 처리에 관한 방침입니다.' },
    { id: 'content',   label: '컨텐츠관리',       icon: 'layout-panel-left', desc: '다양한 컨텐츠를 관리하고 배포합니다.' },
    { id: 'gallery',   label: '미디어 자료',      icon: 'image',           desc: '사진과 미디어 자료를 감상하세요.' },
    { id: 'board',     label: '게시판',           icon: 'message-square',  desc: '커뮤니티 게시판에서 소통하세요.' },
    { id: 'notice',    label: '공지사항',         icon: 'bell',            desc: '최신 공지사항과 업데이트 소식입니다.' },
    { id: 'news',      label: '뉴스',             icon: 'newspaper',       desc: '최신 뉴스와 소식을 확인하세요.' },
    { id: 'qna',       label: 'Q&A',              icon: 'help-circle',     desc: '궁금한 사항을 질문하고 답변을 받으세요.' },
    { id: 'faq',       label: 'FAQ',              icon: 'clipboard-list',  desc: '자주 묻는 질문과 답변을 확인하세요.' },
    { id: 'franchise', label: '가맹점 신청',      icon: 'store',           desc: '가맹점 신청 및 문의를 접수합니다.' },
    { id: 'biz',       label: '거래처관리',       icon: 'building-2',      desc: '거래처 정보를 관리합니다.' },
    { id: 'contact',   label: '문의하기',         icon: 'mail',            desc: '궁금한 사항을 문의해 주세요.' },
    { id: 'about',     label: '소개페이지',       icon: 'info',            desc: '회사 소개 정보를 확인하세요.' }
  ];

  function getSolPageInfo(id) {
    for (var i = 0; i < _solutionItemsForPage.length; i++) {
      if (_solutionItemsForPage[i].id === id) return _solutionItemsForPage[i];
    }
    return { id: id, label: id, icon: 'layout', desc: '' };
  }

  /* ── 게시판 카테고리 매핑 ── */
  var _boardCatMap = {
    board:     { label: '게시판',      icon: 'message-square', color: '#6366f1', cat: null       },
    notice:    { label: '공지사항',    icon: 'bell',           color: '#ef4444', cat: 'notice'   },
    news:      { label: '뉴스',        icon: 'newspaper',      color: '#4f6ef7', cat: 'news'     },
    qna:       { label: 'Q&A',         icon: 'help-circle',    color: '#8b5cf6', cat: 'qna'      },
    faq:       { label: 'FAQ',         icon: 'clipboard-list', color: '#06b6d4', cat: 'faq'      },
    franchise: { label: '가맹점 신청', icon: 'store',          color: '#ec4899', cat: 'franchise'}
  };

  function renderBoardPage(solutionId) {
    var wrap = document.getElementById('hpMainContent');
    if (!wrap) return;
    var bInfo = _boardCatMap[solutionId];
    var catFilter = bInfo.cat;
    var items = [];
    try { items = JSON.parse(localStorage.getItem('board_items') || 'null') || []; }
    catch(e) { items = []; }
    if (catFilter) items = items.filter(function(i){ return i.cat === catFilter; });

    /* CSS는 style.css에 정의됨 (.hp-bd-*) */

    /* ── 타이틀 배경 파스텔 그라디언트 ── */
    var rgb = hexToRgb(bInfo.color);
    var pastelGrad = rgb
      ? 'linear-gradient(135deg, rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',.35) 0%, rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',.15) 100%)'
      : 'linear-gradient(135deg,' + bInfo.color + '59 0%,' + bInfo.color + '26 100%)';
    var grad = pastelGrad;
    var html = '<div class="hp-bd-page">';

    html +=
      '<div class="hp-bd-title-box" style="background:' + grad + '">' +
      '<div class="hp-bd-title-icon">' +
      '<i data-lucide="' + bInfo.icon + '"></i>' +
      '</div>' +
      '<div>' +
      '<h1 class="hp-bd-h1">' + escHtml(bInfo.label) + '</h1>' +
      '<p class="hp-bd-sub">총 ' + items.length + '건</p>' +
      '</div></div>';

    if (!items.length) {
      html +=
        '<div class="hp-bd-empty">' +
        '<i data-lucide="' + bInfo.icon + '" style="width:52px;height:52px;opacity:.15;display:block;margin:0 auto 16px"></i>' +
        '<p style="font-size:15px;font-weight:600">등록된 ' + escHtml(bInfo.label) + ' 게시글이 없습니다.</p>' +
        '</div>';
    } else {
      html += '<div class="hp-bd-wrap">';
      html +=
        '<div class="hp-bd-col-hdr">' +
        '<span style="text-align:center">번호</span>' +
        '<span>제목</span>' +
        '<span style="text-align:center">작성자</span>' +
        '<span style="text-align:center">날짜</span>' +
        '<span style="text-align:center">조회</span>' +
        '<span></span>' +
        '</div>';

      items.forEach(function(it, idx) {
        /* 역순 번호: 가장 위 항목이 가장 큰 번호 */
        var num = items.length - idx;
        html +=
          '<div class="hp-bd-row">' +
          '<div class="hp-bd-hdr">' +
          '<span class="hp-bd-num" style="color:' + bInfo.color + '">' + num + '</span>' +
          '<span class="hp-bd-ttl">' + escHtml(it.title) + '</span>' +
          '<span class="hp-bd-mt">' + escHtml(it.author || '-') + '</span>' +
          '<span class="hp-bd-mt">' + escHtml(it.regDate || '') + '</span>' +
          '<span class="hp-bd-mt">' + (it.views || 0) + '</span>' +
          '<span class="hp-bd-chev">&#9660;</span>' +
          '</div>' +
          '<div class="hp-bd-body">' +
          '<div class="hp-bd-inner">' +
          '<div class="hp-bd-label" style="color:' + bInfo.color + '">' + escHtml(bInfo.label) + '</div>' +
          '<div class="hp-bd-content-title">' + escHtml(it.title) + '</div>' +
          '<p class="hp-bd-content-body">' + escHtml(it.content || '내용이 없습니다.') + '</p>' +
          '<div class="hp-bd-footer">' +
          '<span>&#9998; ' + escHtml(it.author || '-') + '</span>' +
          '<span>&#128197; ' + escHtml(it.regDate || '') + '</span>' +
          '<span>&#128065; ' + (it.views || 0) + '</span>' +
          '</div></div></div>' +
          '</div>';
      });

      html += '</div>'; /* .hp-bd-wrap */
    }
    html += '</div>'; /* .hp-bd-page */

    wrap.innerHTML = html;

    /* ── 아코디언 이벤트: innerHTML 후 addEventListener 연결 ── */
    wrap.querySelectorAll('.hp-bd-hdr').forEach(function(hdr) {
      hdr.addEventListener('click', function() {
        var body = hdr.nextElementSibling;
        var isOpen = body.classList.contains('hp-open');
        wrap.querySelectorAll('.hp-bd-body').forEach(function(b) { b.classList.remove('hp-open'); });
        wrap.querySelectorAll('.hp-bd-hdr').forEach(function(h) { h.classList.remove('hp-open'); });
        if (!isOpen) {
          body.classList.add('hp-open');
          hdr.classList.add('hp-open');
        }
      });
    });

    wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(function() { observeNewElements(); initIcons(); }, 50);
  }


  /* ══════════════════════════
     컨텐츠관리 페이지
  ══════════════════════════ */
  var _contentTypeMap = {
    news:    { label: '뉴스',    icon: 'newspaper',   color: '#3b82f6' },
    blog:    { label: '블로그',  icon: 'pen-line',    color: '#10b981' },
    youtube: { label: '유튜브',  icon: 'youtube',     color: '#ef4444' },
    website: { label: '웹사이트', icon: 'globe',      color: '#8b5cf6' }
  };

  function renderContentPage() {
    var wrap = document.getElementById('hpMainContent');
    if (!wrap) return;

    /* chub_items 로드 */
    var items = [];
    try { items = JSON.parse(localStorage.getItem('chub_items') || 'null') || []; }
    catch(e) { items = []; }

    /* CSS는 style.css에 정의됨 (.hp-ct-*) */

    var html = '<div class="hp-ct-page">';

    /* 타이틀 박스 (파스텔) */
    html +=
      '<div class="hp-ct-title-box">' +
      '<div class="hp-ct-title-icon"><i data-lucide="layout-panel-left"></i></div>' +
      '<div><h1 class="hp-ct-h1">컨텐츠관리</h1>' +
      '<p class="hp-ct-sub">총 ' + items.length + '건</p></div></div>';

    /* 검색 + 필터 */
    html +=
      '<div class="hp-ct-toolbar">' +
      '<div class="hp-ct-filters">' +
      '<button class="hp-ct-filter-btn hp-ct-active" data-filter="all">전체</button>' +
      '<button class="hp-ct-filter-btn" data-filter="news">뉴스</button>' +
      '<button class="hp-ct-filter-btn" data-filter="blog">블로그</button>' +
      '<button class="hp-ct-filter-btn" data-filter="youtube">유튜브</button>' +
      '<button class="hp-ct-filter-btn" data-filter="website">웹사이트</button>' +
      '</div>' +
      '<div class="hp-gal-search-wrap">' +
      '<svg class="hp-gal-search-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
      '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>' +
      '<input type="text" class="hp-gal-search" id="hpCtSearch" placeholder="제목 또는 태그 검색...">' +
      '</div></div>';

    if (!items.length) {
      html +=
        '<div class="hp-ct-empty">' +
        '<i data-lucide="layout-panel-left" style="width:52px;height:52px;opacity:.15;display:block;margin:0 auto 16px"></i>' +
        '<p style="font-size:15px;font-weight:600">등록된 컨텐츠가 없습니다.</p></div>';
    } else {
      html += '<div class="hp-ct-grid" id="hpCtGrid">';
      items.forEach(function(it, idx) {
        var tInfo = _contentTypeMap[it.type] || { label: it.type || '기타', icon: 'file-text', color: '#64748b' };
        html +=
          '<div class="hp-ct-card" data-type="' + escAttr(it.type || '') + '" data-idx="' + idx + '" data-search="' + escAttr((it.title || '') + ' ' + (it.tags || []).join(' ')) + '">';

        /* 이미지 썸네일 */
        if (it.img) {
          html += '<div class="hp-ct-card-img"><img src="' + escAttr(it.img) + '" alt="' + escAttr(it.title || '') + '" loading="lazy"></div>';
        }

        html +=
          '<div class="hp-ct-card-body">' +
          '<div class="hp-ct-card-header">' +
          '<span class="hp-ct-badge" style="background:' + tInfo.color + '20;color:' + tInfo.color + '">' +
          '<i data-lucide="' + tInfo.icon + '" style="width:12px;height:12px"></i> ' + escHtml(tInfo.label) + '</span>' +
          '<span class="hp-ct-date">' + escHtml(it.regDate || '') + '</span></div>' +
          '<h3 class="hp-ct-card-title">' + escHtml(it.title || '') + '</h3>' +
          '<p class="hp-ct-card-summary">' + escHtml(it.summary || '') + '</p>';

        if (it.tags && it.tags.length) {
          html += '<div class="hp-ct-card-tags">';
          it.tags.forEach(function(t) {
            html += '<span class="hp-ct-tag">#' + escHtml(t) + '</span>';
          });
          html += '</div>';
        }

        html +=
          '<div class="hp-ct-card-footer">' +
          '<span>❤️ ' + (it.likes || 0) + '</span>' +
          '<span>👁 ' + (it.views || 0) + '</span>' +
          '<button class="hp-ct-detail-btn" data-idx="' + idx + '">상세보기 →</button>' +
          '</div></div></div>';
      });
      html += '</div>';
    }

    html += '</div>';
    wrap.innerHTML = html;

    /* 필터 이벤트 */
    var filterBtns = wrap.querySelectorAll('.hp-ct-filter-btn');
    filterBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        filterBtns.forEach(function(b) { b.classList.remove('hp-ct-active'); });
        btn.classList.add('hp-ct-active');
        var f = btn.getAttribute('data-filter');
        wrap.querySelectorAll('.hp-ct-card').forEach(function(card) {
          card.style.display = (f === 'all' || card.getAttribute('data-type') === f) ? '' : 'none';
        });
      });
    });

    /* 검색 이벤트 */
    var searchInput = document.getElementById('hpCtSearch');
    if (searchInput) {
      searchInput.addEventListener('input', function() {
        var q = this.value.toLowerCase().trim();
        wrap.querySelectorAll('.hp-ct-card').forEach(function(card) {
          var searchText = (card.getAttribute('data-search') || '').toLowerCase();
          card.style.display = (!q || searchText.indexOf(q) !== -1) ? '' : 'none';
        });
      });
    }

    /* 상세보기 이벤트 */
    wrap.querySelectorAll('.hp-ct-detail-btn').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var idx = parseInt(btn.getAttribute('data-idx'));
        if (!isNaN(idx) && items[idx]) {
          renderContentDetail(items[idx], items);
        }
      });
    });

    wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(function() { observeNewElements(); initIcons(); }, 50);
  }

  /* ── 컨텐츠 상세보기 페이지 ── */
  function renderContentDetail(item, allItems) {
    var wrap = document.getElementById('hpMainContent');
    if (!wrap) return;
    var tInfo = _contentTypeMap[item.type] || { label: item.type || '기타', icon: 'file-text', color: '#64748b' };

    var html = '<div class="hp-ct-detail-page">';

    /* 뒤로가기 */
    html +=
      '<button class="hp-ct-back-btn" id="hpCtBack">' +
      '<i data-lucide="arrow-left" style="width:16px;height:16px"></i> 목록으로 돌아가기</button>';

    /* 상단 카드 영역 */
    html += '<div class="hp-ct-detail-card">';

    /* 이미지 (있으면) */
    if (item.img) {
      html += '<div class="hp-ct-detail-img"><img src="' + escAttr(item.img) + '" alt="' + escAttr(item.title || '') + '"></div>';
    }

    html += '<div class="hp-ct-detail-body">';

    /* 배지 + 날짜 */
    html +=
      '<div class="hp-ct-card-header" style="margin-bottom:16px">' +
      '<span class="hp-ct-badge" style="background:' + tInfo.color + '20;color:' + tInfo.color + '">' +
      '<i data-lucide="' + tInfo.icon + '" style="width:14px;height:14px"></i> ' + escHtml(tInfo.label) + '</span>' +
      '<span class="hp-ct-date">' + escHtml(item.regDate || '') + '</span></div>';

    /* 제목 */
    html += '<h1 class="hp-ct-detail-title">' + escHtml(item.title || '') + '</h1>';

    /* 요약 */
    html += '<p class="hp-ct-detail-summary">' + escHtml(item.summary || '') + '</p>';

    /* 태그 */
    if (item.tags && item.tags.length) {
      html += '<div class="hp-ct-card-tags" style="margin-top:16px">';
      item.tags.forEach(function(t) {
        html += '<span class="hp-ct-tag">#' + escHtml(t) + '</span>';
      });
      html += '</div>';
    }

    /* 통계 */
    html +=
      '<div class="hp-ct-detail-stats">' +
      '<span>❤️ 좋아요 ' + (item.likes || 0) + '</span>' +
      '<span>👁 조회수 ' + (item.views || 0) + '</span></div>';

    /* 바로가기 버튼 */
    if (item.url) {
      html +=
        '<button class="hp-ct-goto-btn" id="hpCtGoto">' +
        '<i data-lucide="external-link" style="width:16px;height:16px"></i> 바로가기 (사이트 열기)</button>';
    }

    html += '</div></div>'; /* detail-body, detail-card 닫기 */

    /* iframe 영역 (기본 숨김) */
    if (item.url) {
      html +=
        '<div class="hp-ct-iframe-wrap" id="hpCtIframeWrap" style="display:none">' +
        '<div class="hp-ct-iframe-header">' +
        '<span class="hp-ct-iframe-url">' + escHtml(item.url) + '</span>' +
        '<button class="hp-ct-iframe-close" id="hpCtIframeClose">✕ 닫기</button></div>' +
        '<iframe class="hp-ct-iframe" id="hpCtIframe" src="" frameborder="0" allowfullscreen></iframe>' +
        '</div>';
    }

    html += '</div>';
    wrap.innerHTML = html;

    /* 뒤로가기 이벤트 */
    var backBtn = document.getElementById('hpCtBack');
    if (backBtn) {
      backBtn.addEventListener('click', function() { renderContentPage(); });
    }

    /* 바로가기 이벤트 → iframe 표시 */
    var gotoBtn = document.getElementById('hpCtGoto');
    if (gotoBtn && item.url) {
      gotoBtn.addEventListener('click', function() {
        var iframeWrap = document.getElementById('hpCtIframeWrap');
        var iframe = document.getElementById('hpCtIframe');
        if (iframeWrap && iframe) {
          iframe.src = item.url;
          iframeWrap.style.display = '';
          iframeWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    /* iframe 닫기 */
    var closeBtn = document.getElementById('hpCtIframeClose');
    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        var iframeWrap = document.getElementById('hpCtIframeWrap');
        var iframe = document.getElementById('hpCtIframe');
        if (iframe) iframe.src = '';
        if (iframeWrap) iframeWrap.style.display = 'none';
      });
    }

    wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(function() { observeNewElements(); initIcons(); }, 50);
  }



  function renderGalleryPage() {
    var wrap = document.getElementById('hpMainContent');
    if (!wrap) return;

    /* med_items 로드 */
    var items = [];
    try { items = JSON.parse(localStorage.getItem('med_items') || 'null') || []; }
    catch(e) { items = []; }

    /* CSS는 style.css에 정의됨 (.hp-gal-*) */

    var html = '<div class="hp-gal-page">';
    html +=
      '<div class="hp-gal-title-box">' +
      '<div style="width:50px;height:50px;border-radius:14px;background:rgba(255,255,255,.18);' +
      'display:flex;align-items:center;justify-content:center;flex-shrink:0">' +
      '<i data-lucide="image" style="width:26px;height:26px;color:#fff"></i></div>' +
      '<div>' +
      '<h1 class="hp-gal-h1">미디어 자료</h1>' +
      '<p class="hp-gal-sub">총 ' + items.length + '건</p>' +
      '</div></div>';

    /* 검색창 */
    html += '<div class="hp-gal-search-wrap">' +
      '<svg class="hp-gal-search-ico" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
      '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
      '<input class="hp-gal-search" id="galSearchInp" type="text" placeholder="제목 또는 태그 검색...">' +
      '</div>';

    if (!items.length) {
      html += '<div class="hp-gal-empty"><p style="font-size:15px;font-weight:600">등록된 미디어 자료가 없습니다.</p></div>';
    } else {
      html += '<div class="hp-gal-grid">';
      items.forEach(function(it, idx) {
        var tags = (it.tags || []).map(function(t) {
          return '<span class="hp-gal-tag">' + escHtml(t) + '</span>';
        }).join('');
        html +=
          '<div class="hp-gal-item" data-gal-idx="' + idx + '">' +
          (it.dataUrl
            ? '<img src="' + it.dataUrl + '" alt="' + escHtml(it.title) + '" loading="lazy">'
            : '<div style="padding-top:62%;background:#2a2d4a"></div>') +
          '<div class="hp-gal-overlay">' +
          '<div class="hp-gal-ttl">' + escHtml(it.title) + '</div>' +
          '<div class="hp-gal-tags">' + tags + '</div>' +
          '</div></div>';
      });
      html += '</div>';
    }
    html += '</div>';

    wrap.innerHTML = html;

    /* 검색 이벤트 */
    var searchInp = wrap.querySelector('#galSearchInp');
    if (searchInp) {
      searchInp.addEventListener('input', function() {
        var q = this.value.toLowerCase().trim();
        wrap.querySelectorAll('.hp-gal-item').forEach(function(el) {
          var idx2 = parseInt(el.dataset.galIdx);
          var it2 = items[idx2];
          var match = !q ||
            (it2.title || '').toLowerCase().includes(q) ||
            (it2.tags || []).some(function(t){ return t.toLowerCase().includes(q); }) ||
            (it2.desc || '').toLowerCase().includes(q);
          el.style.display = match ? '' : 'none';
        });
      });
    }

    /* 라이트박스 이벤트 */
    wrap.querySelectorAll('.hp-gal-item').forEach(function(el) {
      el.addEventListener('click', function() {
        var idx = parseInt(el.dataset.galIdx);
        var it = items[idx];
        if (!it || !it.dataUrl) return;
        var lb = document.createElement('div');
        lb.className = 'hp-gal-lb';
        lb.innerHTML =
          '<div class="hp-gal-lb-inner">' +
          '<button class="hp-gal-lb-close">✕</button>' +
          '<img src="' + it.dataUrl + '" alt="' + escHtml(it.title) + '">' +
          '<div class="hp-gal-lb-info">' + escHtml(it.title) + '</div>' +
          '</div>';
        document.body.appendChild(lb);
        lb.querySelector('.hp-gal-lb-close').addEventListener('click', function() { lb.remove(); });
        lb.addEventListener('click', function(e) { if (e.target === lb) lb.remove(); });
      });
    });

    wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(function() { observeNewElements(); initIcons(); }, 50);
  }

  function renderSolutionPage(solutionId) {
    /* 게시판 관련 솔루션이면 게시판 뷰로 분기 */
    if (_boardCatMap[solutionId]) { renderBoardPage(solutionId); return; }
    /* 미디어 자료 솔루션 */
    if (solutionId === 'gallery') { renderGalleryPage(); return; }
    /* 컨텐츠관리 */
    if (solutionId === 'content') { renderContentPage(); return; }


    var wrap = document.getElementById('hpMainContent');
    if (!wrap) return;
    var sol = getSolPageInfo(solutionId);
    var html = '<div class="hp-solution-page fade-in-up">' +
      '<div class="hp-solution-page-inner">' +
      '<div class="hp-sol-header">' +
      '<div class="hp-sol-icon-wrap"><i data-lucide="' + sol.icon + '"></i></div>' +
      '<h1>' + escHtml(sol.label) + '</h1>' +
      '<p>' + escHtml(sol.desc) + '</p>' +
      '</div><div class="hp-sol-body"><div class="hp-sol-placeholder">' +
      '<i data-lucide="' + sol.icon + '" style="width:48px;height:48px;opacity:.2"></i>' +
      '<p>이 영역에 <strong>' + escHtml(sol.label) + '</strong> 컨텐츠가 표시됩니다.</p>' +
      '</div></div></div></div>';
    wrap.innerHTML = html;
    wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(function () { observeNewElements(); initIcons(); }, 50);
  }


  function renderSubmenuPage(menuIdx, setIdx) {
    var wrap = document.getElementById('hpMainContent');
    if (!wrap) return;
    var menuDetails = getLS('hp_menu_details', {});
    var detail = menuDetails[menuIdx];
    if (!detail || !Array.isArray(detail.sets) || !detail.sets[setIdx]) { renderMainContent(); return; }
    var set = detail.sets[setIdx];
    var subMenuName = set.name || '서브메뉴 ' + (parseInt(setIdx) + 1);
    if (set.type === 'solution' && set.solution) { renderSolutionPage(set.solution); return; }
    var rows = set.rows || [];
    var imgItems = rows.filter(function (r) { return r.imgH || r.imgV; });
    if (!imgItems.length) { renderMainContent(); return; }
    var colCount = Math.min(imgItems.length, 4);
    var html = '<div class="hp-content-line"><div class="line-grid cols-' + colCount + '">';
    imgItems.forEach(function (item) {
      var imgH = item.imgH || '';
      var imgV = item.imgV || '';
      var isValidImg = function(v) { return !!v && typeof v === 'string' && v.length > 3; };
      var hasVertical = isValidImg(imgH) && isValidImg(imgV);
      var linkUrl = item.url || '';
      var isBlank = item.blank || false;
      html += '<div class="hp-content-item' + (hasVertical ? ' has-vertical' : '') + '">';
      if (linkUrl) html += '<a href="' + escAttr(linkUrl) + '"' + (isBlank ? ' target="_blank" rel="noopener"' : '') + '>';
      if (hasVertical) {
        html += '<img class="mc-img-h" src="' + escAttr(imgH) + '" alt="' + escAttr(item.desc || subMenuName) + '" loading="lazy">';
        html += '<img class="mc-img-v" src="' + escAttr(imgV) + '" alt="' + escAttr(item.desc || subMenuName) + '" loading="lazy">';
      } else {
        html += '<img src="' + escAttr(imgH || imgV) + '" alt="' + escAttr(item.desc || subMenuName) + '" loading="lazy">';
      }
      if (item.desc) html += '<div class="item-overlay"><div class="item-desc">' + escHtml(item.desc) + '</div></div>';
      if (linkUrl) html += '</a>';
      html += '</div>';
    });
    html += '</div></div>';
    wrap.innerHTML = html;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(function () { observeNewElements(); initIcons(); }, 50);
  }
  /* 해시 라우팅: #solution-{id} / #submenu-{menuIdx}-{setIdx} 감지 */
  function handleHashRoute() {
    var hash = window.location.hash || '';
    // #submenu-X-Y 라우팅 (이미지형/솔루션형 서브메뉴)
    if (hash.indexOf('#submenu-') === 0) {
      var parts = hash.replace('#submenu-', '').split('-');
      var mi = parseInt(parts[0]);
      var si = parseInt(parts[1]);
      if (!isNaN(mi) && !isNaN(si)) {
        renderSubmenuPage(mi, si);
        return true;
      }
    }
    // #solution-{id} 라우팅 (기존 솔루션 페이지)
    if (hash.indexOf('#solution-') === 0) {
      var solutionId = hash.replace('#solution-', '');
      if (solutionId) {
        renderSolutionPage(solutionId);
        return true;
      }
    }
    return false;
  }

  /* ══════════════════════════
     초기화
  ══════════════════════════ */
  function init() {
    initTheme();
    renderRivet();
    renderHeader();

    // 해시 라우팅: 솔루션 페이지가 있으면 솔루션 표시, 없으면 메인 컨텐츠
    if (!handleHashRoute()) {
      renderMainContent();
    }

    renderFooter();
    initMobileMenu();

    setTimeout(initIcons, 50);
    setTimeout(function () {
      initScrollEffects();
      observeNewElements();
    }, 100);
    setTimeout(hideLoading, 300);
  }

  /* 해시 변경 감지 (뒤로가기 / 메뉴 클릭 시) */
  window.addEventListener('hashchange', function () {
    if (!handleHashRoute()) {
      renderMainContent();
    }
    setTimeout(function () { initIcons(); observeNewElements(); }, 100);
  });

  /* ── DOM Ready ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ── 테마 토글 버튼 이벤트 ── */
  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('hpThemeToggle');
    if (btn) btn.addEventListener('click', toggleTheme);
  });

  /* ── 관리자 패널에서 설정 변경 시 자동 반영 ── */
  window.addEventListener('storage', function (e) {
    var hpKeys = ['hp_rivet', 'hp_mainmenu', 'hp_menu_settings', 'hp_menu_items',
      'hp_mc_data', 'hp_footer_logobox', 'hp_footer_menu', 'hp_footer_text',
      'hp_copyright', 'hp_logo_top_h', 'hp_logo_top_v', 'hp_logo_bot_h', 'hp_logo_bot_v',
      'hp_menu_details', 'ws_theme', 'ws_hq_info'];
    if (hpKeys.indexOf(e.key) !== -1) {
      init();
    }
  });

})();
