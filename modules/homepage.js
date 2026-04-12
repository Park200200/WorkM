/**
 * modules/homepage.js
 */
/* ══════════════════════════════════════════════════════
   홈페이지 모드 - 사이드바 전환 및 서브페이지 라우팅
══════════════════════════════════════════════════════ */

// 홈페이지 모드 진입: mainNav 숨기고 homepageNav 표시
function enterHomepageMode() {
  var mainNav = document.getElementById('mainNav');
  var acctNav = document.getElementById('acctNav');
  var homepageNav = document.getElementById('homepageNav');
  if (mainNav) mainNav.style.display = 'none';
  if (acctNav) acctNav.style.display = 'none';
  if (homepageNav) homepageNav.style.display = 'block';
  // 하단 내책상으로 버튼 표시
  var backBtn = document.getElementById('backToDeskBtn');
  if (backBtn) backBtn.style.display = 'block';
  // 하단 사용자 프로필 숨기기
  var sideUser = document.getElementById('sidebarUser');
  if (sideUser) sideUser.style.display = 'none';
  // 첫 서브페이지(기본설정) 자동 표시
  var firstItem = document.querySelector('#homepageNav [data-hp-page="hp-basic"]');
  showHomepagePage('hp-basic', firstItem);
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 60);
}

// 홈페이지 모드 이탈: mainNav 복원 후 대시보드로
function exitHomepageMode() {
  var mainNav = document.getElementById('mainNav');
  var homepageNav = document.getElementById('homepageNav');
  if (homepageNav) homepageNav.style.display = 'none';
  if (mainNav) mainNav.style.display = 'block';
  // 헤더 breadcrumb 복원
  var headerSearch = document.getElementById('headerSearch');
  var homepageBar = document.getElementById('homepageModeBar');
  if (headerSearch) headerSearch.style.display = '';
  if (homepageBar) homepageBar.style.display = 'none';
  // 하단 내책상으로 버튼 숨기기
  var backBtn = document.getElementById('backToDeskBtn');
  if (backBtn) backBtn.style.display = 'none';
  // 하단 사용자 프로필 복원
  var sideUser = document.getElementById('sidebarUser');
  if (sideUser) sideUser.style.display = '';
  // 대시보드로 이동
  var dashEl = document.querySelector('[data-page="dashboard"]');
  if (typeof showPage === 'function') showPage('dashboard', dashEl);
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 60);
}

// 홈페이지 서브페이지 전환
function showHomepagePage(pageId, navEl) {
  // 서브 콘텐츠 영역 모두 숨기기
  var subPages = ['hp-menu', 'hp-basic', 'hp-content', 'hp-banner', 'hp-board', 'hp-inquiry', 'hp-media', 'hp-terms'];

  subPages.forEach(function (id) {
    var el = document.getElementById('page-' + id);
    if (el) { el.style.display = 'none'; el.classList.remove('active'); }
  });
  // 선택한 서브페이지 표시
  var target = document.getElementById('page-' + pageId);
  if (target) { target.style.display = 'block'; target.classList.add('active'); }
  // nav 활성 상태
  document.querySelectorAll('#homepageNav .nav-item').forEach(function (n) {
    n.classList.remove('active');
  });
  if (navEl) navEl.classList.add('active');
}

/* ══ 홈페이지 기본설정 - 로고 등록 ══ */
function _hpLogoPreview(input, previewId, hiddenId) {
  if (!input.files || !input.files[0]) return;
  var file = input.files[0];
  var reader = new FileReader();
  reader.onload = function (e) {
    var dataUrl = e.target.result;
    var previewEl = document.getElementById(previewId);
    var hiddenEl = document.getElementById(hiddenId);
    if (previewEl) {
      previewEl.innerHTML = '<img src="' + dataUrl + '" style="max-width:100%;max-height:100%;object-fit:contain;border-radius:8px">';
    }
    if (hiddenEl) hiddenEl.value = dataUrl;
    // localStorage 임시 저장
    try { localStorage.setItem('hp_logo_' + hiddenId, dataUrl); } catch (e2) { }
  };
  reader.readAsDataURL(file);
}

function _hpLogoSave() {
  var keys = ['hp_logo_top_h', 'hp_logo_top_v', 'hp_logo_bot_h', 'hp_logo_bot_v'];
  var saved = 0;
  keys.forEach(function (k) {
    var el = document.getElementById(k);
    if (el && el.value) {
      try { localStorage.setItem(k, el.value); saved++; } catch (e) { }
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
  Object.keys(map).forEach(function (k) {
    var dataUrl = localStorage.getItem(k);
    if (!dataUrl) return;
    var previewEl = document.getElementById(map[k]);
    var hiddenEl = document.getElementById(k);
    if (previewEl) previewEl.innerHTML = '<img src="' + dataUrl + '" style="max-width:100%;max-height:100%;object-fit:contain;border-radius:8px">';
    if (hiddenEl) hiddenEl.value = dataUrl;
  });
}

// showHomepagePage 시 로고 복원 호출
var _origShowHpPage = window.showHomepagePage;
window.showHomepagePage = function (pageId, navEl) {
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
  box.querySelectorAll('.rivet-chip').forEach(function (el) { el.remove(); });
  _rivetTags.forEach(function (tag, i) {
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
  var bgEl = document.getElementById('rivet_bg_color');
  var fcEl = document.getElementById('rivet_font_color');
  var fsEl = document.getElementById('rivet_font_size');
  var prev = document.getElementById('rivet_preview');
  var bgLbl = document.getElementById('rivet_bg_label');
  var fcLbl = document.getElementById('rivet_font_label');
  if (!prev) return;
  var bg = bgEl ? bgEl.value : '#1e40af';
  var fc = fcEl ? fcEl.value : '#ffffff';
  var fs = fsEl ? fsEl.value : '13';
  if (bgLbl) bgLbl.value = bg;
  if (fcLbl) fcLbl.value = fc;
  prev.style.background = bg;
  prev.style.color = fc;
  prev.style.fontSize = fs + 'px';
  prev.textContent = _rivetTags.length > 0 ? _rivetTags.join('  ·  ') : '공지 텍스트를 입력하세요';
}

function _rivetSave() {
  var bgEl = document.getElementById('rivet_bg_color');
  var fcEl = document.getElementById('rivet_font_color');
  var fsEl = document.getElementById('rivet_font_size');
  var alignEl = document.getElementById('rivet_align');
  var data = {
    bgColor: bgEl ? bgEl.value : '#1e40af',
    fontColor: fcEl ? fcEl.value : '#ffffff',
    fontSize: fsEl ? parseInt(fsEl.value) : 13,
    align: alignEl ? alignEl.value : 'center',
    tags: _rivetTags.slice()
  };
  try { localStorage.setItem('hp_rivet', JSON.stringify(data)); } catch (e) { }
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
    var lbl = document.getElementById('rivet_size_label');
    if (bgEl && data.bgColor) bgEl.value = data.bgColor;
    if (fcEl && data.fontColor) fcEl.value = data.fontColor;
    if (fsEl && data.fontSize) { fsEl.value = data.fontSize; if (lbl) lbl.textContent = data.fontSize + 'px'; }
    if (data.align && typeof _rivetSetAlign === 'function') _rivetSetAlign(data.align);
    if (Array.isArray(data.tags)) { _rivetTags = data.tags.slice(); _rivetRenderTags(); }
    _rivetPreview();
  } catch (e) { }
}

// hp-basic 진입 시 리벳 복원
var _prev_showHpPage2 = window.showHomepagePage;
window.showHomepagePage = function (pageId, navEl) {
  if (typeof _prev_showHpPage2 === 'function') _prev_showHpPage2(pageId, navEl);
  if (pageId === 'hp-basic') setTimeout(function () { _hpLogoRestore(); _rivetRestore(); if (typeof refreshIcons === 'function') refreshIcons(); }, 100);
};

/* ══ 리벳 정렬 선택 ══ */
function _rivetSetAlign(align) {
  var alignEl = document.getElementById('rivet_align');
  if (alignEl) alignEl.value = align;
  var btns = { left: 'rivet_align_left', center: 'rivet_align_center', right: 'rivet_align_right' };
  Object.keys(btns).forEach(function (k) {
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
window._rivetPreview = function () {
  var bgEl = document.getElementById('rivet_bg_color');
  var fcEl = document.getElementById('rivet_font_color');
  var fsEl = document.getElementById('rivet_font_size');
  var fwEl = document.getElementById('rivet_font_weight');
  var alEl = document.getElementById('rivet_align');
  var prev = document.getElementById('rivet_preview');
  var bgLbl = document.getElementById('rivet_bg_label');
  var fcLbl = document.getElementById('rivet_font_label');
  if (!prev) return;
  var bg = bgEl ? bgEl.value : '#1e40af';
  var fc = fcEl ? fcEl.value : '#ffffff';
  var fs = fsEl ? fsEl.value : '13';
  var fw = fwEl ? fwEl.value : '400';
  var align = alEl ? alEl.value : 'center';
  if (bgLbl) bgLbl.value = bg;
  if (fcLbl) fcLbl.value = fc;
  prev.style.background = bg;
  prev.style.color = fc;
  prev.style.fontSize = fs + 'px';
  prev.style.fontWeight = fw;
  prev.style.textAlign = align;
  prev.textContent = _rivetTags.length > 0 ? _rivetTags.join('  ·  ') : '공지 텍스트를 입력하세요';
};

window._rivetSave = function () {
  var bgEl = document.getElementById('rivet_bg_color');
  var fcEl = document.getElementById('rivet_font_color');
  var fsEl = document.getElementById('rivet_font_size');
  var fwEl = document.getElementById('rivet_font_weight');
  var alEl = document.getElementById('rivet_align');
  var data = {
    bgColor: bgEl ? bgEl.value : '#1e40af',
    fontColor: fcEl ? fcEl.value : '#ffffff',
    fontSize: fsEl ? parseInt(fsEl.value) : 13,
    fontWeight: fwEl ? parseInt(fwEl.value) : 400,
    align: alEl ? alEl.value : 'center',
    tags: _rivetTags.slice()
  };
  try { localStorage.setItem('hp_rivet', JSON.stringify(data)); } catch (e) { }
  if (typeof showToast === 'function') showToast('success', '리벳 설정이 저장되었습니다.');
};

window._rivetRestore = function () {
  try {
    var raw = localStorage.getItem('hp_rivet');
    if (!raw) return;
    var data = JSON.parse(raw);
    var bgEl = document.getElementById('rivet_bg_color');
    var fcEl = document.getElementById('rivet_font_color');
    var fsEl = document.getElementById('rivet_font_size');
    var lbl = document.getElementById('rivet_size_label');
    if (bgEl && data.bgColor) bgEl.value = data.bgColor;
    if (fcEl && data.fontColor) fcEl.value = data.fontColor;
    if (fsEl && data.fontSize) { fsEl.value = data.fontSize; if (lbl) lbl.textContent = data.fontSize + 'px'; }
    if (data.fontWeight) _rivetSetFontWeight(data.fontWeight);
    if (data.align) _rivetSetAlign(data.align);
    if (Array.isArray(data.tags)) { _rivetTags = data.tags.slice(); _rivetRenderTags(); }
    setTimeout(window._rivetPreview, 50);
  } catch (e) { }
};

/* ══ 리벳 폰트 굵기 토글 ══ */
window._rivetSetFontWeight = function (fw) {
  var fwEl = document.getElementById('rivet_font_weight');
  if (fwEl) fwEl.value = String(fw);
  [300, 400, 700, 900].forEach(function (w) {
    var btn = document.getElementById('rivet_fw_' + w);
    if (!btn) return;
    if (w === fw) {
      btn.style.background = 'var(--accent-blue)';
      btn.style.color = '#fff';
    } else {
      btn.style.background = 'transparent';
      btn.style.color = 'var(--text-secondary)';
    }
  });
  if (typeof window._rivetPreview === 'function') window._rivetPreview();
};
/* 로컬 별칭 */
var _rivetSetFontWeight = window._rivetSetFontWeight;

/* ══ 리벳 정렬 재정의 (window._rivetPreview 참조) ══ */
window._rivetSetAlign = function (align) {
  var alignEl = document.getElementById('rivet_align');
  if (alignEl) alignEl.value = align;
  var map = { left: 'rivet_align_left', center: 'rivet_align_center', right: 'rivet_align_right' };
  Object.keys(map).forEach(function (k) {
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
(function () {
  var ids = ['rivet_align_left', 'rivet_align_center', 'rivet_align_right'];
  var vals = ['left', 'center', 'right'];
  ids.forEach(function (id, i) {
    var el = document.getElementById(id);
    if (el) { el.onclick = function () { window._rivetSetAlign(vals[i]); }; }
  });
})();

/* ══ 리벳 태그 추가 - 좌우 스페이스 허용 ══ */
window._rivetAddTag = function () {
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
window._rivetRenderTags = function () {
  var box = document.getElementById('rivet_tag_box');
  var input = document.getElementById('rivet_tag_input');
  if (!box || !input) return;
  box.querySelectorAll('.rivet-chip').forEach(function (el) { el.remove(); });
  _rivetTags.forEach(function (tag, i) {
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

window._rivetRemoveTag = function (idx) {
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
  var box = document.getElementById('mn_tag_box');
  var input = document.getElementById('mn_tag_input');
  if (!box || !input) return;
  box.querySelectorAll('.mn-chip').forEach(function (el) { el.remove(); });
  _mnTags.forEach(function (tag, i) {
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
  var map = { left: 'mn_align_left', center: 'mn_align_center', right: 'mn_align_right' };
  Object.keys(map).forEach(function (k) {
    var btn = document.getElementById(map[k]);
    if (!btn) return;
    if (k === align) { btn.style.background = '#6366f1'; btn.style.color = '#fff'; }
    else { btn.style.background = 'transparent'; btn.style.color = 'var(--text-secondary)'; }
  });
  _mnPreview();
}

function _mnPreview() {
  var prev = document.getElementById('mn_preview');
  if (!prev) return;
  var bg = (document.getElementById('mn_bg_color') || { value: '#ffffff' }).value;
  var fc = (document.getElementById('mn_font_color') || { value: '#1a1a2e' }).value;
  var fs = (document.getElementById('mn_font_size') || { value: '14' }).value;
  var h = (document.getElementById('mn_height') || { value: '64' }).value;
  var op = (document.getElementById('mn_opacity') || { value: '100' }).value;
  var gap = (document.getElementById('mn_gap') || { value: '28' }).value;
  var align = (document.getElementById('mn_align') || { value: 'center' }).value;

  var bgLbl = document.getElementById('mn_bg_label');
  var fcLbl = document.getElementById('mn_fc_label');
  if (bgLbl) bgLbl.textContent = bg;
  if (fcLbl) fcLbl.textContent = fc;

  // 정렬 → justifyContent
  var jc = { left: 'flex-start', center: 'center', right: 'flex-end' }[align] || 'center';

  prev.style.background = bg;
  prev.style.opacity = (parseInt(op) / 100).toFixed(2);
  prev.style.height = h + 'px';
  prev.style.gap = gap + 'px';
  prev.style.justifyContent = jc;

  // 메뉴 항목 렌더
  var items = _mnTags.length > 0 ? _mnTags : ['홈', '소개', '서비스', '문의'];
  prev.innerHTML = items.map(function (t) {
    return '<span style="font-size:' + fs + 'px;color:' + fc + ';cursor:pointer;white-space:pre;' +
      'font-weight:500;padding:4px 2px;transition:opacity .15s" ' +
      'onmouseover="this.style.opacity=\'.65\'" onmouseout="this.style.opacity=\'1\'">' + t + '</span>';
  }).join('');
}

function _mnSave() {
  var data = {
    bgColor: (document.getElementById('mn_bg_color') || { value: '#ffffff' }).value,
    fontColor: (document.getElementById('mn_font_color') || { value: '#1a1a2e' }).value,
    fontSize: parseInt((document.getElementById('mn_font_size') || { value: '14' }).value),
    height: parseInt((document.getElementById('mn_height') || { value: '64' }).value),
    opacity: parseInt((document.getElementById('mn_opacity') || { value: '100' }).value),
    gap: parseInt((document.getElementById('mn_gap') || { value: '28' }).value),
    align: (document.getElementById('mn_align') || { value: 'center' }).value,
    menus: _mnTags.slice()
  };
  try { localStorage.setItem('hp_mainmenu', JSON.stringify(data)); } catch (e) { }
  if (typeof showToast === 'function') showToast('success', '메인메뉴 설정이 저장되었습니다.');
}

function _mnRestore() {
  try {
    var raw = localStorage.getItem('hp_mainmenu');
    if (!raw) return;
    var d = JSON.parse(raw);
    var set = function (id, val) { var el = document.getElementById(id); if (el) el.value = val; };
    if (d.bgColor) { set('mn_bg_color', d.bgColor); var l = document.getElementById('mn_bg_label'); if (l) l.textContent = d.bgColor; }
    if (d.fontColor) { set('mn_font_color', d.fontColor); var l = document.getElementById('mn_fc_label'); if (l) l.textContent = d.fontColor; }
    if (d.fontSize) { set('mn_font_size', d.fontSize); var l = document.getElementById('mn_fs_label'); if (l) l.textContent = d.fontSize + 'px'; }
    if (d.height) { set('mn_height', d.height); var l = document.getElementById('mn_height_label'); if (l) l.textContent = d.height + 'px'; }
    if (d.opacity) { set('mn_opacity', d.opacity); var l = document.getElementById('mn_opacity_label'); if (l) l.textContent = d.opacity + '%'; }
    if (d.gap) { set('mn_gap', d.gap); var l = document.getElementById('mn_gap_label'); if (l) l.textContent = d.gap + 'px'; }
    if (d.align) _mnSetAlign(d.align);
    if (Array.isArray(d.menus)) { _mnTags = d.menus.slice(); _mnRenderTags(); }
    setTimeout(_mnPreview, 60);
  } catch (e) { }
}

// hp-basic 진입 시 메인메뉴 복원도 포함
var _prev_showHpPage3 = window.showHomepagePage;
window.showHomepagePage = function (pageId, navEl) {
  if (typeof _prev_showHpPage3 === 'function') _prev_showHpPage3(pageId, navEl);
  if (pageId === 'hp-basic') setTimeout(function () {
    _hpLogoRestore(); _rivetRestore(); _mnRestore();
    if (typeof refreshIcons === 'function') refreshIcons();
  }, 100);
};

/* ══ 하단 로고박스 설정 ══ */
function _footerLogoPreview() {
  var box = document.getElementById('footer_logo_preview_box');
  var bgEl = document.getElementById('footer_bg_color');
  var hEl = document.getElementById('footer_height');
  var opEl = document.getElementById('footer_opacity');
  var bgLbl = document.getElementById('footer_bg_label');
  if (!box) return;
  var bg = bgEl ? bgEl.value : '#1a1a2e';
  var h = hEl ? hEl.value : '120';
  var op = opEl ? opEl.value : '100';
  if (bgLbl) bgLbl.textContent = bg;
  box.style.background = bg;
  box.style.height = h + 'px';
  box.style.opacity = (parseInt(op) / 100).toFixed(2);
  // 저장된 하단 로고 이미지 반영
  var lh = localStorage.getItem('hp_logo_hp_logo_bot_h') || localStorage.getItem('hp_logo_bot_h');
  var lv = localStorage.getItem('hp_logo_hp_logo_bot_v') || localStorage.getItem('hp_logo_bot_v');
  var ph = document.getElementById('footer_preview_logo_h');
  var pv = document.getElementById('footer_preview_logo_v');
  if (ph && lh) ph.innerHTML = '<img src="' + lh + '" style="max-height:' + Math.round(parseInt(h) * 0.6) + 'px;max-width:180px;object-fit:contain">';
  if (pv && lv) pv.innerHTML = '<img src="' + lv + '" style="max-height:' + Math.round(parseInt(h) * 0.7) + 'px;max-width:100px;object-fit:contain">';
}
function _footerLogoSave() {
  var data = {
    bgColor: (document.getElementById('footer_bg_color') || { value: '#1a1a2e' }).value,
    height: parseInt((document.getElementById('footer_height') || { value: '120' }).value),
    opacity: parseInt((document.getElementById('footer_opacity') || { value: '100' }).value)
  };
  try { localStorage.setItem('hp_footer_logobox', JSON.stringify(data)); } catch (e) { }
  if (typeof showToast === 'function') showToast('success', '하단 로고박스 설정이 저장되었습니다.');
}
function _footerLogoRestore() {
  try {
    var raw = localStorage.getItem('hp_footer_logobox');
    if (!raw) { _footerLogoPreview(); return; }
    var d = JSON.parse(raw);
    var set = function (id, val) { var el = document.getElementById(id); if (el) el.value = val; };
    if (d.bgColor) { set('footer_bg_color', d.bgColor); var l = document.getElementById('footer_bg_label'); if (l) l.textContent = d.bgColor; }
    if (d.height) { set('footer_height', d.height); var l = document.getElementById('footer_height_label'); if (l) l.textContent = d.height + 'px'; }
    if (d.opacity) { set('footer_opacity', d.opacity); var l = document.getElementById('footer_opacity_label'); if (l) l.textContent = d.opacity + '%'; }
    setTimeout(_footerLogoPreview, 60);
  } catch (e) { }
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
  var box = document.getElementById('fm_tag_box');
  var input = document.getElementById('fm_tag_input');
  if (!box || !input) return;
  box.querySelectorAll('.fm-chip').forEach(function (el) { el.remove(); });
  _fmTags.forEach(function (tag, i) {
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
  var map = { left: 'fm_align_left', center: 'fm_align_center', right: 'fm_align_right' };
  Object.keys(map).forEach(function (k) {
    var btn = document.getElementById(map[k]);
    if (!btn) return;
    if (k === align) { btn.style.background = '#14b8a6'; btn.style.color = '#fff'; }
    else { btn.style.background = 'transparent'; btn.style.color = 'var(--text-secondary)'; }
  });
  _fmPreview();
}
function _fmPreview() {
  var prev = document.getElementById('fm_preview');
  if (!prev) return;
  var bg = (document.getElementById('fm_bg_color') || { value: '#0f172a' }).value;
  var fc = (document.getElementById('fm_font_color') || { value: '#94a3b8' }).value;
  var fs = (document.getElementById('fm_font_size') || { value: '13' }).value;
  var h = (document.getElementById('fm_height') || { value: '56' }).value;
  var op = (document.getElementById('fm_opacity') || { value: '100' }).value;
  var gap = (document.getElementById('fm_gap') || { value: '24' }).value;
  var align = (document.getElementById('fm_align') || { value: 'center' }).value;
  var bgLbl = document.getElementById('fm_bg_label');
  var fcLbl = document.getElementById('fm_fc_label');
  if (bgLbl) bgLbl.textContent = bg;
  if (fcLbl) fcLbl.textContent = fc;
  var jc = { left: 'flex-start', center: 'center', right: 'flex-end' }[align] || 'center';
  prev.style.background = bg;
  prev.style.opacity = (parseInt(op) / 100).toFixed(2);
  prev.style.height = h + 'px';
  prev.style.gap = gap + 'px';
  prev.style.justifyContent = jc;
  var items = _fmTags.length > 0 ? _fmTags : ['홈', '소개', '서비스', '문의'];
  prev.innerHTML = items.map(function (t) {
    return '<span style="font-size:' + fs + 'px;color:' + fc + ';cursor:pointer;white-space:pre;' +
      'font-weight:400;padding:4px 2px;transition:opacity .15s" ' +
      'onmouseover="this.style.opacity=\'.5\'" onmouseout="this.style.opacity=\'1\'">' + t + '</span>';
  }).join('');
}
function _fmSave() {
  var data = {
    bgColor: (document.getElementById('fm_bg_color') || { value: '#0f172a' }).value,
    fontColor: (document.getElementById('fm_font_color') || { value: '#94a3b8' }).value,
    fontSize: parseInt((document.getElementById('fm_font_size') || { value: '13' }).value),
    height: parseInt((document.getElementById('fm_height') || { value: '56' }).value),
    opacity: parseInt((document.getElementById('fm_opacity') || { value: '100' }).value),
    gap: parseInt((document.getElementById('fm_gap') || { value: '24' }).value),
    align: (document.getElementById('fm_align') || { value: 'center' }).value,
    menus: _fmTags.slice()
  };
  try { localStorage.setItem('hp_footer_menu', JSON.stringify(data)); } catch (e) { }
  if (typeof showToast === 'function') showToast('success', '하단 메뉴 설정이 저장되었습니다.');
}
function _fmRestore() {
  try {
    var raw = localStorage.getItem('hp_footer_menu');
    if (!raw) { _fmPreview(); return; }
    var d = JSON.parse(raw);
    var set = function (id, val) { var el = document.getElementById(id); if (el) el.value = val; };
    if (d.bgColor) { set('fm_bg_color', d.bgColor); var l = document.getElementById('fm_bg_label'); if (l) l.textContent = d.bgColor; }
    if (d.fontColor) { set('fm_font_color', d.fontColor); var l = document.getElementById('fm_fc_label'); if (l) l.textContent = d.fontColor; }
    if (d.fontSize) { set('fm_font_size', d.fontSize); var l = document.getElementById('fm_fs_label'); if (l) l.textContent = d.fontSize + 'px'; }
    if (d.height) { set('fm_height', d.height); var l = document.getElementById('fm_height_label'); if (l) l.textContent = d.height + 'px'; }
    if (d.opacity) { set('fm_opacity', d.opacity); var l = document.getElementById('fm_opacity_label'); if (l) l.textContent = d.opacity + '%'; }
    if (d.gap) { set('fm_gap', d.gap); var l = document.getElementById('fm_gap_label'); if (l) l.textContent = d.gap + 'px'; }
    if (d.align) _fmSetAlign(d.align);
    if (Array.isArray(d.menus)) { _fmTags = d.menus.slice(); _fmRenderTags(); }
    setTimeout(_fmPreview, 60);
  } catch (e) { }
}

// hp-basic 진입 시 모든 복원 함수 통합
var _prev_showHpPage4 = window.showHomepagePage;
window.showHomepagePage = function (pageId, navEl) {
  if (typeof _prev_showHpPage4 === 'function') _prev_showHpPage4(pageId, navEl);
  if (pageId === 'hp-basic') setTimeout(function () {
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
  var map = { left: 'ft_align_left', center: 'ft_align_center', right: 'ft_align_right' };
  Object.keys(map).forEach(function (k) {
    var btn = document.getElementById(map[k]);
    if (!btn) return;
    if (k === align) { btn.style.background = '#fb923c'; btn.style.color = '#fff'; }
    else { btn.style.background = 'transparent'; btn.style.color = 'var(--text-secondary)'; }
  });
  _ftPreview();
}

function _ftPreview() {
  var prev = document.getElementById('ft_preview');
  var prevText = document.getElementById('ft_preview_text');
  if (!prev || !prevText) return;
  var bg = (document.getElementById('ft_bg_color') || { value: '#0a0a1a' }).value;
  var fc = (document.getElementById('ft_font_color') || { value: '#64748b' }).value;
  var fs = (document.getElementById('ft_font_size') || { value: '12' }).value;
  var h = (document.getElementById('ft_height') || { value: '80' }).value;
  var op = (document.getElementById('ft_opacity') || { value: '100' }).value;
  var align = (document.getElementById('ft_align') || { value: 'center' }).value;
  var txt = (document.getElementById('ft_text') || { value: '' }).value;

  var bgLbl = document.getElementById('ft_bg_label');
  var fcLbl = document.getElementById('ft_fc_label');
  if (bgLbl) bgLbl.textContent = bg;
  if (fcLbl) fcLbl.textContent = fc;

  var jc = { left: 'flex-start', center: 'center', right: 'flex-end' }[align] || 'center';
  prev.style.background = bg;
  prev.style.opacity = (parseInt(op) / 100).toFixed(2);
  prev.style.minHeight = h + 'px';
  prev.style.justifyContent = jc;
  prev.style.alignItems = 'center';

  prevText.style.fontSize = fs + 'px';
  prevText.style.color = fc;
  prevText.style.textAlign = align;
  prevText.style.whiteSpace = 'pre-wrap';
  prevText.textContent = txt.trim() ? txt : '© 2025 워크엠. All rights reserved.';
}

function _ftSave() {
  var data = {
    bgColor: (document.getElementById('ft_bg_color') || { value: '#0a0a1a' }).value,
    fontColor: (document.getElementById('ft_font_color') || { value: '#64748b' }).value,
    fontSize: parseInt((document.getElementById('ft_font_size') || { value: '12' }).value),
    height: parseInt((document.getElementById('ft_height') || { value: '80' }).value),
    opacity: parseInt((document.getElementById('ft_opacity') || { value: '100' }).value),
    align: (document.getElementById('ft_align') || { value: 'center' }).value,
    text: (document.getElementById('ft_text') || { value: '' }).value
  };
  try { localStorage.setItem('hp_footer_text', JSON.stringify(data)); } catch (e) { }
  if (typeof showToast === 'function') showToast('success', '하단 텍스트 설정이 저장되었습니다.');
}

function _ftRestore() {
  try {
    var raw = localStorage.getItem('hp_footer_text');
    if (!raw) { _ftPreview(); return; }
    var d = JSON.parse(raw);
    var set = function (id, val) { var el = document.getElementById(id); if (el) el.value = val; };
    if (d.bgColor) { set('ft_bg_color', d.bgColor); var l = document.getElementById('ft_bg_label'); if (l) l.textContent = d.bgColor; }
    if (d.fontColor) { set('ft_font_color', d.fontColor); var l = document.getElementById('ft_fc_label'); if (l) l.textContent = d.fontColor; }
    if (d.fontSize) { set('ft_font_size', d.fontSize); var l = document.getElementById('ft_fs_label'); if (l) l.textContent = d.fontSize + 'px'; }
    if (d.height) { set('ft_height', d.height); var l = document.getElementById('ft_height_label'); if (l) l.textContent = d.height + 'px'; }
    if (d.opacity) { set('ft_opacity', d.opacity); var l = document.getElementById('ft_opacity_label'); if (l) l.textContent = d.opacity + '%'; }
    if (d.align) _ftSetAlign(d.align);
    if (d.text !== undefined) set('ft_text', d.text);
    setTimeout(_ftPreview, 60);
  } catch (e) { }
}

// hp-basic 진입 시 모든 복원 통합
var _prev_showHpPage5 = window.showHomepagePage;
window.showHomepagePage = function (pageId, navEl) {
  if (typeof _prev_showHpPage5 === 'function') _prev_showHpPage5(pageId, navEl);
  if (pageId === 'hp-basic') setTimeout(function () {
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
  var map = { left: 'cp_align_left', center: 'cp_align_center', right: 'cp_align_right' };
  Object.keys(map).forEach(function (k) {
    var btn = document.getElementById(map[k]);
    if (!btn) return;
    if (k === align) { btn.style.background = '#eab308'; btn.style.color = '#000'; }
    else { btn.style.background = 'transparent'; btn.style.color = 'var(--text-secondary)'; }
  });
  _cpPreview();
}

function _cpPreview() {
  var prev = document.getElementById('cp_preview');
  var prevText = document.getElementById('cp_preview_text');
  if (!prev || !prevText) return;
  var bg = (document.getElementById('cp_bg_color') || { value: '#050510' }).value;
  var fc = (document.getElementById('cp_font_color') || { value: '#475569' }).value;
  var fs = (document.getElementById('cp_font_size') || { value: '11' }).value;
  var h = (document.getElementById('cp_height') || { value: '48' }).value;
  var op = (document.getElementById('cp_opacity') || { value: '100' }).value;
  var align = (document.getElementById('cp_align') || { value: 'center' }).value;
  var txt = (document.getElementById('cp_text') || { value: '' }).value;

  var bgLbl = document.getElementById('cp_bg_label');
  var fcLbl = document.getElementById('cp_fc_label');
  if (bgLbl) bgLbl.textContent = bg;
  if (fcLbl) fcLbl.textContent = fc;

  var jc = { left: 'flex-start', center: 'center', right: 'flex-end' }[align] || 'center';
  prev.style.background = bg;
  prev.style.opacity = (parseInt(op) / 100).toFixed(2);
  prev.style.minHeight = h + 'px';
  prev.style.justifyContent = jc;

  prevText.style.fontSize = fs + 'px';
  prevText.style.color = fc;
  prevText.style.textAlign = align;
  prevText.style.whiteSpace = 'pre-wrap';
  prevText.textContent = txt.trim() ? txt : '© 2025 워크엠(WorkM). All rights reserved.';
}

function _cpSave() {
  var data = {
    bgColor: (document.getElementById('cp_bg_color') || { value: '#050510' }).value,
    fontColor: (document.getElementById('cp_font_color') || { value: '#475569' }).value,
    fontSize: parseInt((document.getElementById('cp_font_size') || { value: '11' }).value),
    height: parseInt((document.getElementById('cp_height') || { value: '48' }).value),
    opacity: parseInt((document.getElementById('cp_opacity') || { value: '100' }).value),
    align: (document.getElementById('cp_align') || { value: 'center' }).value,
    text: (document.getElementById('cp_text') || { value: '' }).value
  };
  try { localStorage.setItem('hp_copyright', JSON.stringify(data)); } catch (e) { }
  if (typeof showToast === 'function') showToast('success', '카피라이트 설정이 저장되었습니다.');
}

function _cpRestore() {
  try {
    var raw = localStorage.getItem('hp_copyright');
    if (!raw) { _cpPreview(); return; }
    var d = JSON.parse(raw);
    var set = function (id, val) { var el = document.getElementById(id); if (el) el.value = val; };
    if (d.bgColor) { set('cp_bg_color', d.bgColor); var l = document.getElementById('cp_bg_label'); if (l) l.textContent = d.bgColor; }
    if (d.fontColor) { set('cp_font_color', d.fontColor); var l = document.getElementById('cp_fc_label'); if (l) l.textContent = d.fontColor; }
    if (d.fontSize) { set('cp_font_size', d.fontSize); var l = document.getElementById('cp_fs_label'); if (l) l.textContent = d.fontSize + 'px'; }
    if (d.height) { set('cp_height', d.height); var l = document.getElementById('cp_height_label'); if (l) l.textContent = d.height + 'px'; }
    if (d.opacity) { set('cp_opacity', d.opacity); var l = document.getElementById('cp_opacity_label'); if (l) l.textContent = d.opacity + '%'; }
    if (d.align) _cpSetAlign(d.align);
    if (d.text !== undefined) set('cp_text', d.text);
    setTimeout(_cpPreview, 60);
  } catch (e) { }
}

/* ── hp-basic 진입 시 전체 복원 (최종 통합) ── */
var _prev_showHpPage6 = window.showHomepagePage;
window.showHomepagePage = function (pageId, navEl) {
  if (typeof _prev_showHpPage6 === 'function') _prev_showHpPage6(pageId, navEl);
  if (pageId === 'hp-basic') setTimeout(function () {
    if (typeof _hpLogoRestore === 'function') _hpLogoRestore();
    if (typeof _rivetRestore === 'function') _rivetRestore();
    if (typeof _mnRestore === 'function') _mnRestore();
    if (typeof _footerLogoRestore === 'function') _footerLogoRestore();
    if (typeof _fmRestore === 'function') _fmRestore();
    if (typeof _ftRestore === 'function') _ftRestore();
    if (typeof _cpRestore === 'function') _cpRestore();
    if (typeof _hpMcInit === 'function') _hpMcInit();
    if (typeof refreshIcons === 'function') refreshIcons();
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
  var nameEl = document.getElementById('hp_menu_name');
  var urlEl = document.getElementById('hp_menu_url');
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
  var list = document.getElementById('hp_menu_list');
  var empty = document.getElementById('hp_menu_empty');
  if (!list) return;
  list.querySelectorAll('.hp-menu-row').forEach(function (el) { el.remove(); });
  if (_hpMenuItems.length === 0) {
    if (empty) empty.style.display = '';
    return;
  }
  if (empty) empty.style.display = 'none';
  _hpMenuItems.forEach(function (item, i) {
    var row = document.createElement('div');
    row.className = 'hp-menu-row';
    row.style.cssText = 'display:grid;grid-template-columns:40px 1fr 200px 100px 80px;align-items:center;' +
      'padding:10px 16px;border-bottom:1px solid var(--border-color);gap:8px;font-size:13px;' +
      'color:var(--text-primary);transition:background .15s';
    row.onmouseover = function () { this.style.background = 'var(--bg-secondary)'; };
    row.onmouseout = function () { this.style.background = ''; };
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
  try { localStorage.setItem('hp_menu_items', JSON.stringify(_hpMenuItems)); } catch (e) { }
  if (typeof showToast === 'function') showToast('success', '메뉴가 저장되었습니다.');
}

function _hpMenuRestore() {
  try {
    var raw = localStorage.getItem('hp_menu_items');
    if (!raw) return;
    _hpMenuItems = JSON.parse(raw) || [];
    _hpMenuRender();
  } catch (e) { }
}

// hp-menu 진입 시 복원
var _prev_showHpPage7 = window.showHomepagePage;
window.showHomepagePage = function (pageId, navEl) {
  if (typeof _prev_showHpPage7 === 'function') _prev_showHpPage7(pageId, navEl);
  if (pageId === 'hp-menu') setTimeout(function () { _hpMenuRestore(); if (typeof refreshIcons === 'function') refreshIcons(); }, 80);
  if (pageId === 'hp-basic') setTimeout(function () { if (typeof _hpMcInit === 'function') _hpMcInit(); }, 80);
};

/* ── 메뉴등록 > 메인메뉴 설정 현황 렌더 ── */
function _hpMenuRenderPreview() {
  var box = document.getElementById('hp_menu_preview_chips');
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
  } catch (e) { }

  // _mnTags(현재 세션 메모리)가 더 최신이면 우선 사용
  if (typeof _mnTags !== 'undefined' && Array.isArray(_mnTags) && _mnTags.length > 0) tags = _mnTags;

  box.querySelectorAll('.mn-preview-chip').forEach(function (el) { el.remove(); });

  if (tags.length === 0) {
    if (empty) empty.style.display = '';
    return;
  }
  if (empty) empty.style.display = 'none';

  tags.forEach(function (tag, i) {
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
window.showHomepagePage = function (pageId, navEl) {
  if (typeof _prev_showHpPage8 === 'function') _prev_showHpPage8(pageId, navEl);
  if (pageId === 'hp-menu') setTimeout(function () {
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
  var card = document.getElementById('hp_menu_detail_card');
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
  var setVal = function (id, val) { var el = document.getElementById(id); if (el) el.value = val || ''; };
  setVal('hp_menu_detail_name', saved.name || tag);
  setVal('hp_menu_detail_img_h', saved.imgH || '');
  setVal('hp_menu_detail_img_v', saved.imgV || '');
  setVal('hp_menu_detail_url', saved.url || '');
  var blankEl = document.getElementById('hp_menu_detail_blank');
  if (blankEl) blankEl.checked = saved.blank || false;
  // 이미지 미리보기 복원
  ['h', 'v'].forEach(function (t) {
    var imgUrl = t === 'h' ? (saved.imgH || '') : (saved.imgV || '');
    var div = document.getElementById('hp_menu_img_' + t + '_prev');
    if (div) {
      if (imgUrl) { div.style.display = 'block'; var img = div.querySelector('img'); if (img) img.src = imgUrl; }
      else div.style.display = 'none';
    }
  });
  card.style.display = 'block';
  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  if (typeof refreshIcons === 'function') refreshIcons();
}

function _hpMenuClearActive() {
  document.querySelectorAll('.mn-preview-chip').forEach(function (el) {
    el.style.background = 'rgba(99,102,241,.1)';
    el.style.color = '#6366f1';
    el.style.boxShadow = '';
  });
}

function _hpMenuFilePreview(input, inputId, prevId) {
  var file = input.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function (e) {
    _hpResizeImage(e.target.result, 800, 800, 0.7, function (resized) {
      var inputEl = document.getElementById(inputId);
      if (inputEl) inputEl.value = resized;
      var div = document.getElementById(prevId);
      if (div) {
        div.style.display = 'block';
        var img = div.querySelector('img');
        if (img) img.src = resized;
      }
    });
  };
  reader.readAsDataURL(file);
}

function _hpMenuDetailSave() {
  var idx = parseInt(document.getElementById('hp_menu_detail_idx').value || '0');
  var name = (document.getElementById('hp_menu_detail_name') || { value: '' }).value;
  var imgH = (document.getElementById('hp_menu_detail_img_h') || { value: '' }).value;
  var imgV = (document.getElementById('hp_menu_detail_img_v') || { value: '' }).value;
  var url = (document.getElementById('hp_menu_detail_url') || { value: '' }).value;
  var blank = (document.getElementById('hp_menu_detail_blank') || { checked: false }).checked;
  _hpMenuDetails[idx] = { name: name, imgH: imgH, imgV: imgV, url: url, blank: blank };
  _hpSafeSetItem('hp_menu_details', JSON.stringify(_hpMenuDetails));
  document.getElementById('hp_menu_detail_card').style.display = 'none';
  _hpMenuClearActive();
  if (typeof showToast === 'function') showToast('success', '"' + name + '" 메뉴 정보가 저장되었습니다.');
}

// _hpMenuRenderPreview 재정의: 칩 클릭 이벤트 포함
window._hpMenuRenderPreview = function () {
  var box = document.getElementById('hp_menu_preview_chips');
  var empty = document.getElementById('hp_menu_preview_empty');
  if (!box) return;
  var tags = [];
  try {
    var raw = localStorage.getItem('hp_mainmenu');
    if (raw) { var d = JSON.parse(raw); if (Array.isArray(d.menus) && d.menus.length) tags = d.menus; }
  } catch (e) { }
  if (typeof _mnTags !== 'undefined' && Array.isArray(_mnTags) && _mnTags.length) tags = _mnTags;
  // 상세 저장값 복원
  try {
    var dr = localStorage.getItem('hp_menu_details');
    if (dr) _hpMenuDetails = JSON.parse(dr) || {};
  } catch (e) { }
  box.querySelectorAll('.mn-preview-chip').forEach(function (el) { el.remove(); });
  if (tags.length === 0) { if (empty) empty.style.display = ''; return; }
  if (empty) empty.style.display = 'none';
  tags.forEach(function (tag, i) {
    var chip = document.createElement('div');
    chip.className = 'mn-preview-chip';
    chip.style.cssText =
      'display:inline-flex;align-items:center;gap:6px;padding:6px 14px;' +
      'border-radius:20px;background:rgba(99,102,241,.1);border:1.5px solid rgba(99,102,241,.2);' +
      'font-size:12px;font-weight:600;color:#6366f1;white-space:pre;cursor:pointer;' +
      'transition:all .15s;user-select:none';
    chip.title = '클릭하여 상세 등록';
    chip.innerHTML =
      '<span style="opacity:.6">' + (i + 1) + '</span>' +
      '<span style="opacity:.3;font-weight:400">|</span>' +
      '<span>' + tag + '</span>' +
      (_hpMenuDetails[i] ? '<span style="width:6px;height:6px;border-radius:50%;background:#22c55e;flex-shrink:0"></span>' : '');
    chip.onclick = (function (idx, t) { return function () { _hpMenuOpenDetail(idx, t); }; })(i, tag);
    chip.onmouseover = function () { if (this.style.boxShadow === '') this.style.background = 'rgba(99,102,241,.18)'; };
    chip.onmouseout = function () { if (this.style.boxShadow === '') this.style.background = 'rgba(99,102,241,.1)'; };
    box.appendChild(chip);
  });
};

/* ── 메뉴 상세 등록 v2 (테이블 행 관리) ── */
var _hpMenuRowData = {};   // { menuIdx: [ {imgH, imgV, url, blank}, ... ] }

function _hpMenuDetailAddRow() {
  var idx = parseInt(document.getElementById('hp_menu_detail_idx').value || '0');
  if (!_hpMenuRowData[idx]) _hpMenuRowData[idx] = [];
  _hpMenuRowData[idx].push({ imgH: '', imgV: '', url: '', blank: false });
  _hpMenuDetailRenderRows(idx);
}

function _hpMenuDetailRemoveRow(menuIdx, rowIdx) {
  if (!_hpMenuRowData[menuIdx]) return;
  _hpMenuRowData[menuIdx].splice(rowIdx, 1);
  _hpMenuDetailRenderRows(menuIdx);
}

function _hpMenuDetailRenderRows(menuIdx) {
  var container = document.getElementById('hp_menu_detail_rows');
  var empty = document.getElementById('hp_menu_detail_rows_empty');
  if (!container) return;
  container.querySelectorAll('.hp-detail-row').forEach(function (el) { el.remove(); });
  var rows = _hpMenuRowData[menuIdx] || [];
  if (rows.length === 0) { if (empty) empty.style.display = ''; return; }
  if (empty) empty.style.display = 'none';
  rows.forEach(function (row, ri) {
    var rowEl = document.createElement('div');
    rowEl.className = 'hp-detail-row';
    rowEl.style.cssText =
      'display:grid;grid-template-columns:1fr 1fr 1fr 80px 36px;gap:8px;align-items:center;' +
      'padding:8px 10px;border-bottom:1px solid var(--border-color);transition:background .15s';
    rowEl.onmouseover = function () { this.style.background = 'var(--bg-secondary)'; };
    rowEl.onmouseout = function () { this.style.background = ''; };

    // 각 셀 생성 함수
    function makeImgCell(field, fileId) {
      var wrap = document.createElement('div');
      wrap.style.cssText = 'position:relative;display:flex;flex-direction:column;gap:4px';
      var inp = document.createElement('input');
      inp.style.cssText = 'border:1px solid var(--border-color);border-radius:7px;padding:5px 52px 5px 8px;font-size:12px;width:100%;box-sizing:border-box;background:var(--bg-secondary);color:var(--text-primary);outline:none';
      inp.placeholder = 'URL 또는 파일';
      inp.value = row[field] || '';
      inp.oninput = function () { _hpMenuRowData[menuIdx][ri][field] = this.value; };
      var fileInp = document.createElement('input');
      fileInp.type = 'file'; fileInp.accept = 'image/*'; fileInp.style.display = 'none';
      fileInp.id = fileId + '_' + menuIdx + '_' + ri;
      fileInp.onchange = function () {
        var f = this.files[0]; if (!f) return;
        var reader = new FileReader();
        reader.onload = function (e) {
          _hpResizeImage(e.target.result, 800, 800, 0.7, function (resized) {
            inp.value = resized;
            _hpMenuRowData[menuIdx][ri][field] = resized;
            if (prev.style.display === 'none') { prev.style.display = 'block'; img.src = resized; }
            else img.src = resized;
          });
        };
        reader.readAsDataURL(f);
      };
      var btn = document.createElement('button');
      btn.textContent = '파일';
      btn.style.cssText = 'position:absolute;right:4px;top:5px;padding:2px 6px;border-radius:5px;border:1px solid var(--border-color);background:var(--bg-tertiary);font-size:10px;color:var(--text-secondary);cursor:pointer';
      btn.onclick = function () { fileInp.click(); };
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
    urlInp.oninput = function () { _hpMenuRowData[menuIdx][ri].url = this.value; };
    urlWrap.appendChild(urlInp);
    rowEl.appendChild(urlWrap);

    // 새탭
    var blankWrap = document.createElement('div');
    blankWrap.style.cssText = 'display:flex;justify-content:center';
    var blankChk = document.createElement('input');
    blankChk.type = 'checkbox';
    blankChk.style.cssText = 'width:16px;height:16px;accent-color:#6366f1;cursor:pointer';
    blankChk.checked = row.blank || false;
    blankChk.onchange = function () { _hpMenuRowData[menuIdx][ri].blank = this.checked; };
    blankWrap.appendChild(blankChk);
    rowEl.appendChild(blankWrap);

    // 삭제
    var delWrap = document.createElement('div');
    delWrap.style.cssText = 'display:flex;justify-content:center';
    var delBtn = document.createElement('button');
    delBtn.style.cssText = 'width:28px;height:28px;border:none;border-radius:7px;background:rgba(239,68,68,.1);color:#ef4444;cursor:pointer;display:flex;align-items:center;justify-content:center';
    delBtn.title = '삭제';
    delBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>';
    delBtn.onclick = (function (mi, ri) { return function () { _hpMenuDetailRemoveRow(mi, ri); }; })(menuIdx, ri);
    delWrap.appendChild(delBtn);
    rowEl.appendChild(delWrap);

    container.appendChild(rowEl);
  });
}

// _hpMenuDetailSave 재정의
window._hpMenuDetailSave = function () {
  var idx = parseInt(document.getElementById('hp_menu_detail_idx').value || '0');
  var name = (document.getElementById('hp_menu_detail_name') || { value: '' }).value;
  if (!_hpMenuDetails) _hpMenuDetails = {};
  _hpMenuDetails[idx] = { name: name, rows: (_hpMenuRowData[idx] || []).slice() };
  _hpSafeSetItem('hp_menu_details', JSON.stringify(_hpMenuDetails));
  document.getElementById('hp_menu_detail_card').style.display = 'none';
  _hpMenuClearActive();
  // 초록 점 갱신
  if (typeof window._hpMenuRenderPreview === 'function') window._hpMenuRenderPreview();
  if (typeof showToast === 'function') showToast('success', '"' + (name || '메뉴') + '" 상세 정보가 저장되었습니다.');
};

// _hpMenuOpenDetail 재정의: 행 데이터 복원 포함
window._hpMenuOpenDetail = function (idx, tag) {
  _hpMenuActiveIdx = idx;
  var card = document.getElementById('hp_menu_detail_card');
  var title = document.getElementById('hp_menu_detail_title');
  var idxEl = document.getElementById('hp_menu_detail_idx');
  if (!card) return;
  _hpMenuClearActive();
  var chips = document.querySelectorAll('.mn-preview-chip');
  if (chips[idx]) { chips[idx].style.background = '#6366f1'; chips[idx].style.color = '#fff'; chips[idx].style.boxShadow = '0 0 0 2px rgba(99,102,241,.35)'; }

  // 저장된 상세 정보 복원
  try {
    var dr = localStorage.getItem('hp_menu_details');
    if (dr) _hpMenuDetails = JSON.parse(dr) || {};
  } catch (e) { }

  var saved = _hpMenuDetails[idx] || {};
  if (title) title.textContent = '"' + tag + '" 메뉴 상세 등록';
  if (idxEl) idxEl.value = idx;
  var nameEl = document.getElementById('hp_menu_detail_name');
  if (nameEl) nameEl.value = saved.name || tag;

  // 행 데이터 복원
  _hpMenuRowData[idx] = Array.isArray(saved.rows) ? JSON.parse(JSON.stringify(saved.rows)) : [];
  _hpMenuDetailRenderRows(idx);

  card.style.display = 'block';
  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  if (typeof refreshIcons === 'function') refreshIcons();
};

/* ══ +메뉴 추가 버튼 → 인라인 폼 열기 ══ */

// 기존 _hpMenuAddItem 재정의
window._hpMenuAddItem = function () {
  var form = document.getElementById('hp_quick_add_form');
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
  } catch (e) { tags.push(name); }

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
  var lbl = document.getElementById('hp_menu_detail_img_label');
  var name = (document.getElementById('hp_menu_detail_name') || { value: '' }).value.trim();
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
window._hpMenuOpenDetail = function (idx, tag) {
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
/* ── 이미지 리사이즈 유틸리티 (localStorage 용량 초과 방지) ── */
function _hpResizeImage(dataUrl, maxW, maxH, quality, callback) {
  if (!dataUrl || !dataUrl.startsWith('data:image')) { callback(dataUrl); return; }
  maxW = maxW || 800; maxH = maxH || 800; quality = quality || 0.7;
  var img = new Image();
  img.onload = function () {
    var w = img.width, h = img.height;
    if (w <= maxW && h <= maxH) {
      // 이미 충분히 작으면 JPEG 재압축만 수행
      var c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      callback(c.toDataURL('image/jpeg', quality));
      return;
    }
    var ratio = Math.min(maxW / w, maxH / h);
    var nw = Math.round(w * ratio), nh = Math.round(h * ratio);
    var c = document.createElement('canvas'); c.width = nw; c.height = nh;
    c.getContext('2d').drawImage(img, 0, 0, nw, nh);
    callback(c.toDataURL('image/jpeg', quality));
  };
  img.onerror = function () { callback(dataUrl); };
  img.src = dataUrl;
}

/* ── localStorage 안전 저장 (용량 초과 시 토스트 알림) ── */
function _hpSafeSetItem(key, jsonStr) {
  try {
    localStorage.setItem(key, jsonStr);
    return true;
  } catch (e) {
    if (typeof showToast === 'function') {
      showToast('error', '저장 실패: 이미지 용량이 너무 큽니다. 이미지 크기를 줄이거나 URL로 등록해 주세요.', 5000);
    }
    console.error('[hp_menu_details] localStorage 저장 실패:', e.message, '데이터 크기:', Math.round(jsonStr.length / 1024) + 'KB');
    return false;
  }
}

var _hpSubSets = {};  // { menuIdx: [ { name, rows:[...] }, ... ] }

/* 세트 추가 */
function _hpSubMenuAddSet() {
  var idx = parseInt((document.getElementById('hp_menu_detail_idx') || { value: '0' }).value);
  if (!_hpSubSets[idx]) _hpSubSets[idx] = [];
  _hpSubSets[idx].push({ name: '', rows: [] });
  _hpSubMenuRenderSets(idx);
  // 새 세트로 스크롤
  var cont = document.getElementById('hp_submenu_sets');
  if (cont) cont.lastElementChild && cont.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
  _hpSubSets[menuIdx][setIdx].rows.push({ imgH: '', imgV: '', url: '', blank: false });
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

  sets.forEach(function (set, si) {
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
      '<span style="font-size:10px;font-weight:800;color:#6366f1">' + (si + 1) + '</span>' +
      '</div>' +
      '<span style="font-size:12px;font-weight:700;color:var(--text-primary)">서브메뉴 ' + (si + 1) + '</span>';

    // 삭제 버튼
    var delBtn = document.createElement('button');
    delBtn.title = '이 세트 삭제';
    delBtn.style.cssText =
      'margin-left:auto;width:24px;height:24px;border:none;border-radius:6px;' +
      'background:rgba(239,68,68,.1);color:#ef4444;cursor:pointer;' +
      'display:flex;align-items:center;justify-content:center;flex-shrink:0';
    delBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    delBtn.onclick = (function (mi, si) { return function () { _hpSubMenuRemoveSet(mi, si); }; })(menuIdx, si);
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
    nameInp.oninput = (function (mi, si) { return function () { _hpSubSets[mi][si].name = this.value; }; })(menuIdx, si);
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
      (_hpMenuCurrentTag && set.name ? '<strong style="color:var(--text-primary)">' + _hpMenuCurrentTag + '</strong><span style="color:var(--text-muted);margin:0 4px">›</span><strong style="color:var(--text-primary)">' + (set.name || '서브메뉴' + (si + 1)) + '</strong><span style="color:var(--text-muted);margin-left:4px">이미지 &amp; 링크 목록</span>' : '이미지 &amp; 링크 목록');

    var addRowBtn = document.createElement('button');
    addRowBtn.style.cssText =
      'display:flex;align-items:center;gap:4px;padding:3px 9px;border-radius:7px;' +
      'border:1px solid var(--accent-blue);background:rgba(59,130,246,.07);' +
      'color:var(--accent-blue);font-size:11px;font-weight:600;cursor:pointer';
    addRowBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> 항목 추가';
    addRowBtn.onclick = (function (mi, si) { return function () { _hpSubMenuAddRow(mi, si); }; })(menuIdx, si);
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
      set.rows.forEach(function (row, ri) {
        var rowEl = document.createElement('div');
        rowEl.style.cssText =
          'display:grid;grid-template-columns:1fr 1fr 1fr 70px 34px;gap:6px;align-items:center;' +
          'padding:7px 10px;border-bottom:1px solid var(--border-color);transition:background .15s';
        rowEl.onmouseover = function () { this.style.background = 'var(--bg-secondary)'; };
        rowEl.onmouseout = function () { this.style.background = ''; };

        function makeImgCell(field) {
          var w = document.createElement('div');
          w.style.cssText = 'display:flex;flex-direction:column;gap:3px';
          var row2 = document.createElement('div');
          row2.style.cssText = 'position:relative;display:flex';
          var inp = document.createElement('input');
          inp.style.cssText = 'flex:1;border:1px solid var(--border-color);border-radius:6px;padding:4px 46px 4px 7px;font-size:11px;background:var(--bg-secondary);color:var(--text-primary);outline:none;min-width:0';
          inp.placeholder = 'URL 또는 파일';
          inp.value = row[field] || '';
          inp.oninput = (function (mi, si, ri, f) { return function () { _hpSubSets[mi][si].rows[ri][f] = this.value; }; })(menuIdx, si, ri, field);
          var fileInp = document.createElement('input');
          fileInp.type = 'file'; fileInp.accept = 'image/*'; fileInp.style.display = 'none';
          fileInp.onchange = (function (mi, si, ri, f, el, prev) {
            return function () {
              var file = this.files[0]; if (!file) return;
              var reader = new FileReader();
              reader.onload = function (e) {
                _hpResizeImage(e.target.result, 800, 800, 0.7, function (resized) {
                  el.value = resized; _hpSubSets[mi][si].rows[ri][f] = resized;
                  prev.style.display = 'block'; prev.querySelector('img').src = resized;
                });
              };
              reader.readAsDataURL(file);
            };
          })(menuIdx, si, ri, field, inp, w);
          var fb = document.createElement('button');
          fb.textContent = '파일';
          fb.style.cssText = 'position:absolute;right:3px;top:3px;padding:1px 5px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-tertiary);font-size:10px;color:var(--text-secondary);cursor:pointer';
          fb.onclick = function () { fileInp.click(); };
          var prev = document.createElement('div'); prev.style.display = row[field] ? 'block' : 'none';
          var img = document.createElement('img'); img.style.cssText = 'max-width:100%;max-height:40px;border-radius:4px;border:1px solid var(--border-color);object-fit:contain';
          if (row[field]) img.src = row[field];
          prev.appendChild(img);
          row2.appendChild(inp); row2.appendChild(fileInp); row2.appendChild(fb);
          w.appendChild(row2); w.appendChild(prev);
          return w;
        }

        rowEl.appendChild(makeImgCell('imgH'));
        rowEl.appendChild(makeImgCell('imgV'));

        var urlW = document.createElement('div');
        var urlInp = document.createElement('input');
        urlInp.style.cssText = 'border:1px solid var(--border-color);border-radius:6px;padding:4px 7px;font-size:11px;width:100%;box-sizing:border-box;background:var(--bg-secondary);color:var(--text-primary);outline:none';
        urlInp.placeholder = '/page 또는 https://';
        urlInp.value = row.url || '';
        urlInp.oninput = (function (mi, si, ri) { return function () { _hpSubSets[mi][si].rows[ri].url = this.value; }; })(menuIdx, si, ri);
        urlW.appendChild(urlInp); rowEl.appendChild(urlW);

        var blankW = document.createElement('div'); blankW.style.cssText = 'display:flex;justify-content:center';
        var chk = document.createElement('input'); chk.type = 'checkbox'; chk.style.cssText = 'width:15px;height:15px;accent-color:#6366f1;cursor:pointer'; chk.checked = row.blank || false;
        chk.onchange = (function (mi, si, ri) { return function () { _hpSubSets[mi][si].rows[ri].blank = this.checked; }; })(menuIdx, si, ri);
        blankW.appendChild(chk); rowEl.appendChild(blankW);

        var delW = document.createElement('div'); delW.style.cssText = 'display:flex;justify-content:center';
        var dBtn = document.createElement('button');
        dBtn.style.cssText = 'width:26px;height:26px;border:none;border-radius:6px;background:rgba(239,68,68,.1);color:#ef4444;cursor:pointer;display:flex;align-items:center;justify-content:center';
        dBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>';
        dBtn.onclick = (function (mi, si, ri) { return function () { _hpSubMenuRemoveRow(mi, si, ri); }; })(menuIdx, si, ri);
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
window._hpMenuDetailSave = function () {
  var idx = parseInt((document.getElementById('hp_menu_detail_idx') || { value: '0' }).value);
  if (!_hpMenuDetails) _hpMenuDetails = {};
  _hpMenuDetails[idx] = { sets: (_hpSubSets[idx] || []).map(function (s) {
    var clone = JSON.parse(JSON.stringify(s));
    // 솔루션형인데 name이 비어있으면 솔루션명으로 자동 설정
    if (clone.type === 'solution' && clone.solution && !clone.name) {
      var found = _hpSolutionItems.find(function (item) { return item.id === clone.solution; });
      if (found) clone.name = found.label;
    }
    return clone;
  }) };
  var _saveJson = JSON.stringify(_hpMenuDetails);
  if (!_hpSafeSetItem('hp_menu_details', _saveJson)) return;
  document.getElementById('hp_menu_detail_card').style.display = 'none';
  _hpMenuClearActive();
  if (typeof window._hpMenuRenderPreview === 'function') window._hpMenuRenderPreview();
  if (typeof showToast === 'function') showToast('success', '서브메뉴 정보가 저장되었습니다.');
};

// _hpMenuOpenDetail 재정의: sets 복원
var _prev_hpMenuOpenDetail2 = window._hpMenuOpenDetail;
window._hpMenuOpenDetail = function (idx, tag) {
  _hpMenuCurrentTag = tag;
  _hpMenuActiveIdx = idx;
  var card = document.getElementById('hp_menu_detail_card');
  var title = document.getElementById('hp_menu_detail_title');
  var idxEl = document.getElementById('hp_menu_detail_idx');
  if (!card) return;
  _hpMenuClearActive();
  var chips = document.querySelectorAll('.mn-preview-chip');
  if (chips[idx]) { chips[idx].style.background = '#6366f1'; chips[idx].style.color = '#fff'; chips[idx].style.boxShadow = '0 0 0 2px rgba(99,102,241,.35)'; }
  // 저장된 데이터 복원
  try { var dr = localStorage.getItem('hp_menu_details'); if (dr) _hpMenuDetails = JSON.parse(dr) || {}; } catch (e) { }
  var saved = _hpMenuDetails[idx] || {};
  if (title) title.textContent = '\u201c' + tag + '\u201d \uc11c\ube0c\uba54\ub274 \ub4f1\ub85d';
  if (idxEl) idxEl.value = idx;
  // sets 복원
  _hpSubSets[idx] = Array.isArray(saved.sets) ? JSON.parse(JSON.stringify(saved.sets)) : [];
  // 세트가 없으면 기본 1개 추가
  if (_hpSubSets[idx].length === 0) _hpSubSets[idx].push({ name: '', rows: [] });
  _hpSubMenuRenderSets(idx);
  card.style.display = 'block';
  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  if (typeof refreshIcons === 'function') refreshIcons();
};

/* ══ 서브메뉴 세트 v4: 이미지형 / 솔루션형 스위치 ══ */

var _hpSolutionItems = [
  { id: 'terms',     label: '이용약관',        icon: 'scroll-text' },
  { id: 'privacy',   label: '개인정보 취급방침', icon: 'shield-check' },
  { id: 'content',   label: '컨텐츠관리',       icon: 'layout-panel-left' },
  { id: 'gallery',   label: '미디어 자료',        icon: 'image' },
  { id: 'board',     label: '게시판',           icon: 'message-square' },
  { id: 'notice',    label: '공지사항',          icon: 'bell' },
  { id: 'news',      label: '뉴스',             icon: 'newspaper' },
  { id: 'qna',       label: 'Q&A',              icon: 'help-circle' },
  { id: 'faq',       label: 'FAQ',              icon: 'clipboard-list' },
  { id: 'franchise', label: '가맹점 신청',       icon: 'store' }
];

window._hpSubMenuRenderSets = function (menuIdx) {
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

  sets.forEach(function (set, si) {
    if (!set.type) set.type = 'image';

    var wrap = document.createElement('div');
    wrap.setAttribute('data-set-wrap', si);
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
      '<span style="font-size:10px;font-weight:800;color:#6366f1">' + (si + 1) + '</span>' +
      '</div>' +
      '<span style="font-size:12px;font-weight:700;color:var(--text-primary)">서브메뉴 ' + (si + 1) + '</span>';

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
        'padding:4px 11px;border:none;font-size:11px;font-weight:' + (active ? '700' : '500') + ';cursor:pointer;' +
        'background:' + (active ? '#6366f1' : 'transparent') + ';' +
        'color:' + (active ? '#fff' : 'var(--text-secondary)') + ';' +
        'transition:all .15s;white-space:nowrap';
      btn.onclick = (function (mi, si, v, sw) {
        return function () {
          _hpSubSets[mi][si].type = v;
          sw.querySelectorAll('button').forEach(function (b) {
            var isA = b.dataset.val === v;
            b.style.background = isA ? '#6366f1' : 'transparent';
            b.style.color = isA ? '#fff' : 'var(--text-secondary)';
            b.style.fontWeight = isA ? '700' : '500';
          });
          // 바디 교체
          var body = wrap.querySelector('.hp-set-body');
          if (body) { body.innerHTML = ''; _hpSubMenuRenderBody(body, mi, si); }
        };
      })(menuIdx, si, val, swWrap);
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
    delBtn.onclick = (function (mi, si) { return function () { _hpSubMenuRemoveSet(mi, si); }; })(menuIdx, si);
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

    _hpSolutionItems.forEach(function (item) {
      var sel = Array.isArray(set.solutions) && set.solutions.indexOf(item.id) !== -1;
      var card = document.createElement('div');
      card.style.cssText =
        'display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:9px;cursor:pointer;' +
        'border:1.5px solid ' + (sel ? '#6366f1' : 'var(--border-color)') + ';' +
        'background:' + (sel ? 'rgba(99,102,241,.08)' : 'var(--bg-secondary)') + ';' +
        'transition:all .15s;user-select:none';

      var iconEl = document.createElement('div');
      iconEl.style.cssText =
        'width:28px;height:28px;border-radius:7px;flex-shrink:0;display:flex;align-items:center;justify-content:center;' +
        'background:' + (sel ? 'rgba(99,102,241,.15)' : 'var(--bg-tertiary)');
      iconEl.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" ' +
        'stroke="' + (sel ? '#6366f1' : 'var(--text-muted)') + '" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';

      var txt = document.createElement('span');
      txt.style.cssText = 'font-size:12px;font-weight:' + (sel ? '700' : '500') + ';color:' + (sel ? '#6366f1' : 'var(--text-primary)');
      txt.textContent = item.label;

      var chk = document.createElement('div');
      chk.style.cssText =
        'width:16px;height:16px;border-radius:4px;margin-left:auto;flex-shrink:0;' +
        'border:1.5px solid ' + (sel ? '#6366f1' : 'var(--border-color)') + ';' +
        'background:' + (sel ? '#6366f1' : 'transparent') + ';display:flex;align-items:center;justify-content:center';
      if (sel) chk.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';

      card.appendChild(iconEl);
      card.appendChild(txt);
      card.appendChild(chk);

      card.onclick = (function (mi, si, id, el) {
        return function () {
          if (!_hpSubSets[mi][si].solutions) _hpSubSets[mi][si].solutions = [];
          var arr = _hpSubSets[mi][si].solutions;
          var idx = arr.indexOf(id);
          if (idx === -1) arr.push(id);
          else arr.splice(idx, 1);
          // 바디 재렌더
          var body = el.closest('.hp-set-body');
          if (body) { body.innerHTML = ''; _hpSubMenuRenderBody(body, mi, si); }
        };
      })(menuIdx, si, item.id, card);

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
    nInp.oninput = (function (mi, si) { return function () { _hpSubSets[mi][si].name = this.value; }; })(menuIdx, si);
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
    addRowBtn.onclick = (function (mi, si) { return function () { _hpSubMenuAddRow(mi, si); }; })(menuIdx, si);
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
      set.rows.forEach(function (row, ri) {
        var rowEl = document.createElement('div');
        rowEl.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1fr 70px 34px;gap:6px;align-items:center;padding:7px 10px;border-bottom:1px solid var(--border-color);transition:background .15s';
        rowEl.onmouseover = function () { this.style.background = 'var(--bg-secondary)'; }; rowEl.onmouseout = function () { this.style.background = ''; };
        function makeImgCell(field) {
          var w = document.createElement('div'); w.style.cssText = 'display:flex;flex-direction:column;gap:3px';
          var r2 = document.createElement('div'); r2.style.cssText = 'position:relative;display:flex';
          var inp = document.createElement('input'); inp.style.cssText = 'flex:1;border:1px solid var(--border-color);border-radius:6px;padding:4px 46px 4px 7px;font-size:11px;background:var(--bg-secondary);color:var(--text-primary);outline:none;min-width:0'; inp.placeholder = 'URL 또는 파일'; inp.value = row[field] || '';
          inp.oninput = (function (mi, si, ri, f) { return function () { _hpSubSets[mi][si].rows[ri][f] = this.value; }; })(menuIdx, si, ri, field);
          var fi = document.createElement('input'); fi.type = 'file'; fi.accept = 'image/*'; fi.style.display = 'none';
          fi.onchange = (function (mi, si, ri, f, el, pv) { return function () { var fl = this.files[0]; if (!fl) return; var rd = new FileReader(); rd.onload = function (e) { _hpResizeImage(e.target.result, 800, 800, 0.7, function (resized) { el.value = resized; _hpSubSets[mi][si].rows[ri][f] = resized; pv.style.display = 'block'; pv.querySelector('img').src = resized; }); }; rd.readAsDataURL(fl); }; })(menuIdx, si, ri, field, inp, w);
          var fb = document.createElement('button'); fb.textContent = '파일'; fb.style.cssText = 'position:absolute;right:3px;top:3px;padding:1px 5px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-tertiary);font-size:10px;color:var(--text-secondary);cursor:pointer'; fb.onclick = function () { fi.click(); };
          var pv = document.createElement('div'); pv.style.display = row[field] ? 'block' : 'none'; var img = document.createElement('img'); img.style.cssText = 'max-width:100%;max-height:40px;border-radius:4px;border:1px solid var(--border-color);object-fit:contain'; if (row[field]) img.src = row[field]; pv.appendChild(img);
          r2.appendChild(inp); r2.appendChild(fi); r2.appendChild(fb); w.appendChild(r2); w.appendChild(pv); return w;
        }
        rowEl.appendChild(makeImgCell('imgH')); rowEl.appendChild(makeImgCell('imgV'));
        var uW = document.createElement('div'); var uInp = document.createElement('input'); uInp.style.cssText = 'border:1px solid var(--border-color);border-radius:6px;padding:4px 7px;font-size:11px;width:100%;box-sizing:border-box;background:var(--bg-secondary);color:var(--text-primary);outline:none'; uInp.placeholder = '/page 또는 https://'; uInp.value = row.url || ''; uInp.oninput = (function (mi, si, ri) { return function () { _hpSubSets[mi][si].rows[ri].url = this.value; }; })(menuIdx, si, ri); uW.appendChild(uInp); rowEl.appendChild(uW);
        var bW = document.createElement('div'); bW.style.cssText = 'display:flex;justify-content:center'; var chk = document.createElement('input'); chk.type = 'checkbox'; chk.style.cssText = 'width:15px;height:15px;accent-color:#6366f1;cursor:pointer'; chk.checked = row.blank || false; chk.onchange = (function (mi, si, ri) { return function () { _hpSubSets[mi][si].rows[ri].blank = this.checked; }; })(menuIdx, si, ri); bW.appendChild(chk); rowEl.appendChild(bW);
        var dW = document.createElement('div'); dW.style.cssText = 'display:flex;justify-content:center'; var dBtn = document.createElement('button'); dBtn.style.cssText = 'width:26px;height:26px;border:none;border-radius:6px;background:rgba(239,68,68,.1);color:#ef4444;cursor:pointer;display:flex;align-items:center;justify-content:center'; dBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>'; dBtn.onclick = (function (mi, si, ri) { return function () { _hpSubMenuRemoveRow(mi, si, ri); }; })(menuIdx, si, ri); dW.appendChild(dBtn); rowEl.appendChild(dW);
        rowCont.appendChild(rowEl);
      });
    }
    tblWrap.appendChild(rowCont);
    body.appendChild(tblWrap);
  }
}

/* ══ 솔루션 선택 단수 선택으로 수정 ══ */
var _prev_hpSubMenuRenderBody = window._hpSubMenuRenderBody;
window._hpSubMenuRenderBody = function (body, menuIdx, si) {
  var set = _hpSubSets[menuIdx][si];
  if (set.type !== 'solution') {
    // 이미지형은 기존 함수 그대로 사용
    _prev_hpSubMenuRenderBody(body, menuIdx, si);
    return;
  }

  body.innerHTML = '';

  // 저장 키를 solution (단수 문자열)로 통일
  var currentSel = set.solution || (Array.isArray(set.solutions) && set.solutions.length ? set.solutions[0] : '');

  /* ── 서브메뉴명 입력 (솔루션형에도 표시) ── */
  var nameWrap = document.createElement('div');
  nameWrap.style.cssText = 'margin-bottom:14px';
  var nameLabel = document.createElement('label');
  nameLabel.style.cssText = 'display:flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:var(--text-secondary);margin-bottom:5px';
  nameLabel.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg> 서브메뉴명';
  var nameInp = document.createElement('input');
  nameInp.className = 'form-input';
  nameInp.placeholder = '서브메뉴명을 입력하세요 (선택 시 자동완성)';
  nameInp.value = set.name || '';
  nameInp.style.width = '100%';
  nameInp.oninput = (function (mi, si) { return function () { _hpSubSets[mi][si].name = this.value; }; })(menuIdx, si);
  nameWrap.appendChild(nameLabel);
  nameWrap.appendChild(nameInp);
  body.appendChild(nameWrap);

  var soLabel = document.createElement('div');
  soLabel.style.cssText = 'font-size:11px;font-weight:600;color:var(--text-secondary);margin-bottom:10px;display:flex;align-items:center;gap:5px';
  soLabel.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
    '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><line x1="12" y1="17" x2="12" y2="21"/></svg> 솔루션 선택';
  body.appendChild(soLabel);


  var grid = document.createElement('div');
  grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px';

  _hpSolutionItems.forEach(function (item) {
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

    card.onclick = (function (mi, si, id, label, el) {
      return function () {
        // 솔루션 저장
        _hpSubSets[mi][si].solution = id;
        delete _hpSubSets[mi][si].solutions; // 구 배열 제거

        // 게시판 관련 솔루션이면 서브메뉴명 자동 입력 (재렌더 시 nameInp에 반영됨)
        var boardSolutions = ['board', 'notice', 'news', 'qna', 'faq', 'franchise'];
        if (boardSolutions.indexOf(id) !== -1) {
          _hpSubSets[mi][si].name = label;
        }

        // 바디 재렌더 (nameInp.value = set.name 으로 자동완성 반영)
        var b = el.closest('.hp-set-body');
        if (b) { b.innerHTML = ''; _hpSubMenuRenderBody(b, mi, si); }
      };
    })(menuIdx, si, item.id, item.label, card);

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
  try { results = JSON.parse(localStorage.getItem('ws_task_results') || '[]'); } catch (e) { }
  if (!results.length) results = WS.taskResults || [];
  if (!results.length) results = [
    { name: '정상완료', icon: 'check-circle', color: '#22c55e' },
    { name: '진행중', icon: 'refresh-cw', color: '#06b6d4' },
    { name: '부분완료', icon: 'git-branch', color: '#f59e0b' },
    { name: '보류', icon: 'pause-circle', color: '#6b7280' },
    { name: '취소', icon: 'x-circle', color: '#ef4444' }
  ];

  cont.innerHTML = results.map(function (r) {
    var c = r.color || '#6b7280';
    var ico = r.icon || 'check-circle';
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
  cont.querySelectorAll('span').forEach(function (s) {
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
window._initTdResultChips = function (taskId) {
  var cont = document.getElementById('tdResultChips_' + taskId);
  if (!cont) return;

  // 현재 instr 의 reportContent 읽기 (모달이 열릴 때 window._currentInstrData에 저장됨)
  var instrReport = '';
  try {
    var instrList = JSON.parse(localStorage.getItem('ws_instructions') || '[]');
    var t = WS.getTask(taskId);
    if (t) {
      var tid = t.id;
      var instr = instrList.find(function (i) {
        return i.id === tid || i.id === Number(tid) ||
          (i.taskId && (i.taskId === tid || i.taskId === String(tid) || i.taskId === Number(tid)));
      });
      if (instr) instrReport = instr.reportContent || instr.report || '';
    }
  } catch (e) { }

  // WS.taskResults 또는 localStorage ws_task_results
  var results = [];
  try { results = JSON.parse(localStorage.getItem('ws_task_results') || '[]'); } catch (e) { }
  if (!results.length) results = WS.taskResults || [];
  if (!results.length) results = [
    { name: '정상완료', icon: 'check-circle', color: '#22c55e' },
    { name: '진행중', icon: 'refresh-cw', color: '#06b6d4' },
    { name: '부분완료', icon: 'git-branch', color: '#f59e0b' },
    { name: '보류', icon: 'pause-circle', color: '#6b7280' },
    { name: '취소', icon: 'x-circle', color: '#ef4444' }
  ];

  // instr.reportContent에서 선택된 항목 파싱 (쉼표 구분)
  var preSelected = instrReport ? instrReport.split(',').map(function (s) { return s.trim(); }).filter(Boolean) : [];

  cont.innerHTML = results.map(function (r) {
    var c = r.color || '#6b7280';
    var ico = r.icon || 'check-circle';
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
    var firstResult = results.find(function (r) { return r.name === preSelected[0]; });
    if (firstResult) {
      var rtV = document.getElementById('td_reportText');
      var riV = document.getElementById('td_reportIconVal');
      if (rtV) rtV.value = preSelected[0];
      if (riV) riV.value = (firstResult.icon || 'check-circle') + '|' + preSelected[0] + '|' + (firstResult.color || '#6b7280');
    }
  }

  if (typeof refreshIcons === 'function') refreshIcons();
};

/* ══ 업무완료 결과 리스트 칩 렌더 함수 ══ */
window._renderReportContentChips = function (rc) {
  if (!rc) return '<span style="color:var(--text-muted);font-size:12px">-</span>';
  var results = [];
  try { results = JSON.parse(localStorage.getItem('ws_task_results') || '[]'); } catch (e) { }
  if (!results.length) results = (window.WS && WS.taskResults) || [];
  var chips = rc.split(',').map(function (name) {
    name = name.trim();
    if (!name) return '';
    var r = results.find(function (x) { return x.name === name; }) || {};
    var c = r.color || '#6b7280';
    var ico = r.icon || 'check-circle';
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
  try { window._hpMcData = JSON.parse(localStorage.getItem('hp_mc_data') || '[]'); } catch (e) { window._hpMcData = []; }
  if (!window._hpMcData.length) window._hpMcData = [{ type: 'image', items: [], solution: '' }];
  _hpMcRender();
}

/* 전체 렌더 */
function _hpMcRender() {
  var wrap = document.getElementById('hp_mc_lines');
  if (!wrap) return;
  wrap.innerHTML = '';
  (window._hpMcData || []).forEach(function (ln, i) {
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
  ['image', 'solution'].forEach(function (t) {
    var btn = document.createElement('button');
    var active = (ln.type || 'image') === t;
    btn.textContent = t === 'image' ? '이미지형' : '솔루션형';
    btn.style.cssText = 'padding:3px 12px;border-radius:20px;border:none;cursor:pointer;font-size:11.5px;font-weight:700;transition:all .15s;' +
      (active ? 'background:#4f6ef7;color:#fff;' : 'background:var(--bg-tertiary);color:var(--text-muted);');
    btn.onclick = (function (idx, type) { return function () { _hpMcSetType(idx, type); }; })(i, t);
    hdr.appendChild(btn);
  });

  /* 삭제 버튼 */
  var del = document.createElement('button');
  del.innerHTML = '<i data-lucide="x" style="width:12px;height:12px"></i>';
  del.style.cssText = 'margin-left:auto;width:22px;height:22px;border:none;border-radius:6px;background:rgba(239,68,68,.1);color:#ef4444;cursor:pointer;display:flex;align-items:center;justify-content:center';
  del.onclick = (function (idx) { return function () { window._hpMcData.splice(idx, 1); _hpMcRender(); }; })(i);
  hdr.appendChild(del);
  wrap.appendChild(hdr);

  /* ── 본문 ── */
  if ((ln.type || 'image') === 'image') {
    /* 이미지 & 텍스트 목록 */
    var body = document.createElement('div');
    body.style.cssText = 'padding:12px 14px';

    var tblHdr = document.createElement('div');
    tblHdr.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:8px';
    tblHdr.innerHTML = '<i data-lucide="image" style="width:12px;height:12px;color:var(--text-muted)"></i>' +
      '<span style="font-size:11.5px;font-weight:700;color:var(--text-secondary)">이미지 &amp; 텍스트 목록</span>' +
      '<span style="font-size:10px;color:var(--text-muted);font-weight:400">가로·세로 이미지(반응형) + 텍스트 3줄</span>';
    var addBtn = document.createElement('button');
    addBtn.innerHTML = '<i data-lucide="plus" style="width:11px;height:11px"></i> 항목 추가';
    addBtn.style.cssText = 'margin-left:auto;display:flex;align-items:center;gap:4px;padding:3px 10px;border-radius:7px;border:1.5px solid #4f6ef7;background:rgba(79,110,247,.07);color:#4f6ef7;font-size:11px;font-weight:700;cursor:pointer';
    addBtn.onclick = (function (idx) { return function () { _hpMcAddItem(idx); }; })(i);
    tblHdr.appendChild(addBtn);
    body.appendChild(tblHdr);

    /* 항목 카드 목록 */
    var cardList = document.createElement('div');
    cardList.style.cssText = 'display:flex;flex-direction:column;gap:10px';

    if (!ln.items || !ln.items.length) {
      var empty = document.createElement('div');
      empty.style.cssText = 'padding:24px;text-align:center;font-size:12px;color:var(--text-muted);border:1.5px dashed var(--border-color);border-radius:10px;background:var(--bg-tertiary)';
      empty.textContent = '+ 항목 추가 버튼으로 항목을 추가하세요';
      cardList.appendChild(empty);
    } else {
      ln.items.forEach(function (item, j) {
        var card = document.createElement('div');
        card.style.cssText = 'border:1.5px solid var(--border-color);border-radius:10px;overflow:hidden;background:var(--bg-secondary)';

        /* ── 카드 헤더 (번호 + 삭제) ── */
        var cardHdr = document.createElement('div');
        cardHdr.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:6px 10px;background:var(--bg-tertiary);border-bottom:1px solid var(--border-color)';
        var cardNum = document.createElement('span');
        cardNum.style.cssText = 'font-size:11px;font-weight:700;color:var(--text-muted)';
        cardNum.textContent = '항목 ' + (j + 1);
        cardHdr.appendChild(cardNum);
        var dl = document.createElement('button');
        dl.innerHTML = '×';
        dl.style.cssText = 'width:22px;height:22px;border:none;border-radius:6px;background:rgba(239,68,68,.1);color:#ef4444;cursor:pointer;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center';
        dl.onclick = (function (li, ji) { return function () { window._hpMcData[li].items.splice(ji, 1); _hpMcRender(); }; })(i, j);
        cardHdr.appendChild(dl);
        card.appendChild(cardHdr);

        /* ── 미리보기 영역 (이미지 위 텍스트 오버레이) ── */
        var previewWrap = document.createElement('div');
        previewWrap.className = 'mc-preview-' + i + '-' + j;
        previewWrap.style.cssText = 'position:relative;width:100%;min-height:180px;background:#0a0a12;border-radius:0;overflow:hidden;display:flex;align-items:center;justify-content:center';

        /* 배경 이미지 */
        var bgImg = document.createElement('img');
        bgImg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.55;transition:opacity .3s';
        var imgSrc = item.imgH || item.imgV || '';
        if (imgSrc && (imgSrc.startsWith('http') || imgSrc.startsWith('data:'))) {
          bgImg.src = imgSrc;
        }
        previewWrap.appendChild(bgImg);

        /* ── 가로/세로 전환 스위치 (미리보기 우측 상단) ── */
        (function(pWrap, bImg, li, ji) {
          var switchWrap = document.createElement('div');
          switchWrap.style.cssText = 'position:absolute;top:8px;right:8px;z-index:5;display:flex;border-radius:6px;overflow:hidden;border:1px solid rgba(255,255,255,.25);box-shadow:0 2px 8px rgba(0,0,0,.3)';

          var btnH = document.createElement('button');
          btnH.type = 'button';
          btnH.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>&nbsp;가로';
          btnH.title = '가로 이미지 (PC)';

          var btnV = document.createElement('button');
          btnV.type = 'button';
          btnV.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>&nbsp;세로';
          btnV.title = '세로 이미지 (모바일)';

          var baseBtnStyle = 'display:flex;align-items:center;gap:2px;padding:4px 10px;border:none;font-size:10px;font-weight:700;cursor:pointer;transition:all .2s;font-family:inherit';
          var activeStyle = ';background:rgba(79,110,247,.9);color:#fff';
          var inactiveStyle = ';background:rgba(0,0,0,.5);color:rgba(255,255,255,.6)';

          function setMode(mode) {
            var data = window._hpMcData[li] && window._hpMcData[li].items && window._hpMcData[li].items[ji];
            if (!data) return;
            var src = mode === 'v' ? (data.imgV || '') : (data.imgH || '');
            if (src && (src.startsWith('http') || src.startsWith('data:'))) {
              bImg.src = src;
              bImg.style.opacity = '.55';
            } else {
              bImg.style.opacity = '0';
            }
            btnH.style.cssText = baseBtnStyle + (mode === 'h' ? activeStyle : inactiveStyle);
            btnV.style.cssText = baseBtnStyle + (mode === 'v' ? activeStyle : inactiveStyle);
            pWrap.style.aspectRatio = mode === 'v' ? '3/4' : '';
            pWrap.style.minHeight = mode === 'v' ? '280px' : '180px';
          }

          btnH.onclick = function() { setMode('h'); };
          btnV.onclick = function() { setMode('v'); };

          switchWrap.appendChild(btnH);
          switchWrap.appendChild(btnV);
          pWrap.appendChild(switchWrap);

          setMode('h');
        })(previewWrap, bgImg, i, j);

        /* 오버레이 텍스트 컨테이너 */
        var overlay = document.createElement('div');
        overlay.style.cssText = 'position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:10px;padding:24px 20px;text-align:center;width:100%';

        /* 텍스트 1 — 소형 태그 (둥근 테두리) */
        var t1 = document.createElement('span');
        t1.style.cssText = 'display:inline-block;padding:4px 16px;border:1.5px solid rgba(255,255,255,.45);border-radius:20px;font-size:12px;font-weight:500;color:rgba(255,255,255,.85);letter-spacing:1px;backdrop-filter:blur(4px)';
        t1.textContent = item.text1 || '텍스트 1';
        overlay.appendChild(t1);

        /* 텍스트 2 — 대형 제목 */
        var t2 = document.createElement('div');
        t2.style.cssText = 'font-size:28px;font-weight:800;color:#fff;line-height:1.3;letter-spacing:-0.5px;text-shadow:0 2px 12px rgba(0,0,0,.4)';
        t2.textContent = item.text2 || '제목을 입력하세요';
        overlay.appendChild(t2);

        /* 텍스트 3 — 설명 */
        var t3 = document.createElement('div');
        t3.style.cssText = 'font-size:13px;font-weight:400;color:rgba(255,255,255,.7);line-height:1.5;max-width:80%';
        t3.textContent = item.text3 || '설명을 입력하세요';
        overlay.appendChild(t3);

        previewWrap.appendChild(overlay);
        card.appendChild(previewWrap);

        /* ── 입력 필드 영역 ── */
        var inputsWrap = document.createElement('div');
        inputsWrap.style.cssText = 'padding:10px;display:flex;flex-direction:column;gap:8px;background:var(--bg-tertiary);border-top:1px solid var(--border-color)';

        /* 이미지 입력 (가로 + 세로) */
        var imgRow = document.createElement('div');
        imgRow.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px';

        /* 이미지 라벨 + 입력 */
        var imgLblH = document.createElement('div');
        imgLblH.style.cssText = 'font-size:10px;font-weight:700;color:var(--text-muted);margin-bottom:3px;display:flex;align-items:center;gap:3px';
        imgLblH.innerHTML = '<i data-lucide="monitor" style="width:10px;height:10px"></i> 가로 이미지 (PC)';
        var imgLblV = document.createElement('div');
        imgLblV.style.cssText = 'font-size:10px;font-weight:700;color:var(--text-muted);margin-bottom:3px;display:flex;align-items:center;gap:3px';
        imgLblV.innerHTML = '<i data-lucide="smartphone" style="width:10px;height:10px"></i> 세로 이미지 (모바일)';

        var imgColH = document.createElement('div');
        imgColH.appendChild(imgLblH);
        var imgColV = document.createElement('div');
        imgColV.appendChild(imgLblV);

        /* ── 이미지 셀 빌더 (URL + 파일 업로드) ── */
        function _mcImgCell(field, lineIdx, itemIdx, placeholder) {
          var cellWrap = document.createElement('div');
          cellWrap.style.cssText = 'display:flex;gap:0;align-items:stretch';

          var inp = document.createElement('input');
          inp.value = item[field] || '';
          inp.placeholder = placeholder;
          inp.style.cssText = 'flex:1;min-width:0;border:1px solid var(--border-color);border-right:none;border-radius:6px 0 0 6px;padding:4px 7px;font-size:10.5px;background:var(--bg-secondary);color:var(--text-primary);outline:none;box-sizing:border-box';
          inp.oninput = function () {
            window._hpMcData[lineIdx].items[itemIdx][field] = this.value;
            /* 미리보기 배경 업데이트 */
            var src = window._hpMcData[lineIdx].items[itemIdx].imgH || window._hpMcData[lineIdx].items[itemIdx].imgV || '';
            if (src && (src.startsWith('http') || src.startsWith('data:'))) { bgImg.src = src; bgImg.style.opacity = '.55'; }
            else { bgImg.style.opacity = '0'; }
          };

          var fileInp = document.createElement('input');
          fileInp.type = 'file';
          fileInp.accept = 'image/*';
          fileInp.style.display = 'none';
          fileInp.onchange = function () {
            var file = this.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function (ev) {
              inp.value = ev.target.result;
              window._hpMcData[lineIdx].items[itemIdx][field] = ev.target.result;
              bgImg.src = ev.target.result;
              bgImg.style.opacity = '.55';
            };
            reader.readAsDataURL(file);
          };

          var fileBtn = document.createElement('button');
          fileBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>';
          fileBtn.title = '파일 업로드';
          fileBtn.style.cssText = 'display:flex;align-items:center;justify-content:center;padding:0 7px;border:1px solid var(--border-color);border-radius:0 6px 6px 0;background:var(--bg-secondary);color:var(--text-secondary);cursor:pointer;transition:all .15s;flex-shrink:0';
          fileBtn.onmouseover = function () { this.style.background = 'var(--accent-blue)'; this.style.color = '#fff'; this.style.borderColor = 'var(--accent-blue)'; };
          fileBtn.onmouseout = function () { this.style.background = 'var(--bg-secondary)'; this.style.color = 'var(--text-secondary)'; this.style.borderColor = 'var(--border-color)'; };
          fileBtn.onclick = function () { fileInp.click(); };

          cellWrap.appendChild(inp);
          cellWrap.appendChild(fileBtn);
          cellWrap.appendChild(fileInp);
          return cellWrap;
        }

        imgColH.appendChild(_mcImgCell('imgH', i, j, 'URL 또는 파일 업로드'));
        imgColV.appendChild(_mcImgCell('imgV', i, j, 'URL 또는 파일 업로드'));
        imgRow.appendChild(imgColH);
        imgRow.appendChild(imgColV);
        inputsWrap.appendChild(imgRow);

        /* 텍스트 입력 (3개 — 입력 시 미리보기 실시간 업데이트) */
        var txtRow = document.createElement('div');
        var _isMob = window.innerWidth <= 767;
        txtRow.style.cssText = 'display:grid;grid-template-columns:' + (_isMob ? '1fr' : '1fr 1fr 1fr') + ';gap:' + (_isMob ? '6px' : '8px') + ';margin-top:8px';

        var txtLabels = ['텍스트 1 (태그)', '텍스트 2 (제목)', '텍스트 3 (설명)'];
        var txtFields = ['text1', 'text2', 'text3'];
        var txtEls = [t1, t2, t3];
        var txtPlaceholders = ['텍스트 1', '제목을 입력하세요', '설명을 입력하세요'];

        txtFields.forEach(function (field, fi) {
          var txtCol = document.createElement('div');

          var txtLbl = document.createElement('div');
          txtLbl.style.cssText = 'font-size:10px;font-weight:700;color:var(--text-muted);margin-bottom:3px;display:flex;align-items:center;gap:3px';
          txtLbl.innerHTML = '<i data-lucide="type" style="width:9px;height:9px"></i> ' + txtLabels[fi];
          txtCol.appendChild(txtLbl);

          var txtInp = document.createElement('input');
          txtInp.value = item[field] || '';
          txtInp.placeholder = txtLabels[fi];
          txtInp.style.cssText = 'width:100%;border:1px solid var(--border-color);border-radius:6px;padding:' + (_isMob ? '8px 10px' : '4px 7px') + ';font-size:' + (_isMob ? '13px' : '10.5px') + ';background:var(--bg-secondary);color:var(--text-primary);outline:none;box-sizing:border-box;transition:border-color .15s';
          txtInp.onfocus = function () { this.style.borderColor = 'var(--accent-blue)'; };
          txtInp.onblur = function () { this.style.borderColor = 'var(--border-color)'; };
          txtInp.oninput = (function (li, ji, f, el, ph) {
            return function () {
              window._hpMcData[li].items[ji][f] = this.value;
              el.textContent = this.value || ph;
            };
          })(i, j, field, txtEls[fi], txtPlaceholders[fi]);
          txtCol.appendChild(txtInp);

          txtRow.appendChild(txtCol);
        });

        inputsWrap.appendChild(txtRow);
        card.appendChild(inputsWrap);

        cardList.appendChild(card);
      });
    }
    body.appendChild(cardList);
    wrap.appendChild(body);

  } else {
    /* 솔루션형 - 솔루션 목록 선택 */
    var sBody = document.createElement('div');
    sBody.style.cssText = 'padding:12px 14px;display:flex;flex-wrap:wrap;gap:8px';
    var solutions = ['홈페이지 이용약관', '개인정보 취급방침', '게시판', '거래처관리', '컨텐츠관리', '일정관리', '업무관리', '고객관리', '인사관리', '재무관리'];
    solutions.forEach(function (s) {
      var b = document.createElement('button');
      b.textContent = s;
      var sel = (ln.solution || '') === s;
      b.style.cssText = 'padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;border:1.5px solid ' +
        (sel ? '#4f6ef7;background:#4f6ef7;color:#fff' : 'var(--border-color);background:var(--bg-secondary);color:var(--text-secondary)');
      b.onclick = (function (idx, sv) {
        return function () {
          window._hpMcData[idx].solution = sv;
          _hpMcRender();
        };
      })(i, s);
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
  (window._hpMcData = window._hpMcData || []).push({ type: 'image', items: [], solution: '' });
  _hpMcRender();
}
function _hpMcAddItem(idx) {
  if (!window._hpMcData[idx].items) window._hpMcData[idx].items = [];
  window._hpMcData[idx].items.push({ imgH: '', imgV: '', text1: '', text2: '', text3: '' });
  _hpMcRender();
}
function _hpMcSave() {
  try { localStorage.setItem('hp_mc_data', JSON.stringify(window._hpMcData || [])); } catch (e) { }
  if (typeof showToast === 'function') showToast('success', '메인컨텐츠가 저장되었습니다.');
}
function _hpMcCancel() {
  _hpMcInit();
}

/* ══════════════════════════════════════════════
   미디어자료 관리 – 렌더 & 저장 시스템
   저장소: localStorage 'med_items'
══════════════════════════════════════════════ */
(function () {

  window._medView = 'masonry';
  window._medFilter = 'all';
  window._medItems = [];

  /* ── 로드 / 저장 ── */
  var MED_SAMPLES = [
    { id:'ms01', mediaType:'image', title:'보성나의 일몰', tags:['자연','풍경','해옆이'], desc:'녹아 롤리는 보성나의 품경. 잡관 낙조 강포사진.',           dataUrl:'https://picsum.photos/seed/aurora1/1200/800',  sizeHint:'wide',   regDate:'2026-04-01' },
    { id:'ms02', mediaType:'image', title:'커피 한 잌', tags:['스타일리시','카페','브러치'], desc:'스팀 아트가 담긴 라떼테. 따뜻한 미니멀 일상.',                dataUrl:'https://picsum.photos/seed/coffee2/800/1200',  sizeHint:'tall',   regDate:'2026-04-01' },
    { id:'ms03', mediaType:'image', title:'도시의 야경', tags:['도시','야경','트낭'], desc:'서울 스카이라인을 수놓는 드론 항공 사진.',                dataUrl:'https://picsum.photos/seed/city3/1200/900',   sizeHint:'large',  regDate:'2026-04-01' },
    { id:'ms04', mediaType:'image', title:'링크 플라워', tags:['플라워','모던','미니멀'], desc:'파스텔 톤의 션시티브 플라워 디테일.',                  dataUrl:'https://picsum.photos/seed/flower4/600/600',  sizeHint:'small',  regDate:'2026-03-30' },
    { id:'ms05', mediaType:'image', title:'하여카서 호수', tags:['자연','호수','에메랄드'], desc:'백색 연꾸가 슈는 하여카서 호수 품경.',                dataUrl:'https://picsum.photos/seed/lake5/900/600',   sizeHint:'medium', regDate:'2026-03-30' },
    { id:'ms06', mediaType:'image', title:'산업 공장 뷰', tags:['인더스트리얼','영화','데스크'], desc:'비운 공장 내의 쉬리얼 라이트. 영화적인 분위기.',           dataUrl:'https://picsum.photos/seed/factory6/1200/800',sizeHint:'wide',   regDate:'2026-03-29' },
    { id:'ms07', mediaType:'image', title:'패션 포트레잇', tags:['패션','포트레잇','시즌'], desc:'넌끔한 어렵만님 포트레잇. 시즌 콜렉션.',                dataUrl:'https://picsum.photos/seed/fashion7/800/1100',sizeHint:'tall',   regDate:'2026-03-28' },
    { id:'ms08', mediaType:'image', title:'우주의 하늘', tags:['우주','밤았','혼시믹'], desc:'으하수 폴라리스를 잡은 로얰 노출.',                     dataUrl:'https://picsum.photos/seed/space8/900/900',  sizeHint:'medium', regDate:'2026-03-28' },
    { id:'ms09', mediaType:'image', title:'전통 한옥', tags:['한옥','전통','고건축'], desc:'기와 지붕의 우아한 전통 건축 포트레잇.', dataUrl:'https://picsum.photos/seed/hanok9/600/900', sizeHint:'small', regDate:'2026-03-27' },
    { id:'ms10', mediaType:'image', title:'숲의 고요함', tags:['수풀','산상','하이킹'], desc:'빛과 그림자가 어우러지는 산상 수풀 풍경.', dataUrl:'https://picsum.photos/seed/forest10/1200/800', sizeHint:'wide', regDate:'2026-03-27' },
    { id:'ms11', mediaType:'image', title:'미니멀 인테리어', tags:['인테리어','사무실','럭셔리'], desc:'군더더기 없는 미니멀 사무실 인테리어.', dataUrl:'https://picsum.photos/seed/minimal11/900/600', sizeHint:'medium', regDate:'2026-03-26' },
    { id:'ms12', mediaType:'image', title:'황금 수확', tags:['농촌','수확','가을'], desc:'풍성한 논에서 구슬땀 흘리는 수확의 숭고함.', dataUrl:'https://picsum.photos/seed/harvest12/800/1200', sizeHint:'tall', regDate:'2026-03-25' },
    { id:'ms13', mediaType:'image', title:'사막의 단애', tags:['사막','로드트립','두바이'], desc:'진홍빛 사막과 미니멀 두바이 스카이라인.', dataUrl:'https://picsum.photos/seed/desert13/1000/600', sizeHint:'medium', regDate:'2026-03-24' },
    { id:'ms14', mediaType:'image', title:'블루 안도', tags:['바다','에게해','여행'], desc:'에게안 말름만에 정박 중인 유람선 스파.', dataUrl:'https://picsum.photos/seed/sea14/600/600', sizeHint:'small', regDate:'2026-03-23' },
    { id:'ms15', mediaType:'image', title:'버라진 하늘', tags:['하늘','구름','타임랩스'], desc:'지평선 너머 펼쳐지는 권적전 하늘.', dataUrl:'https://picsum.photos/seed/sky15/1200/500', sizeHint:'wide', regDate:'2026-03-22' }
  ];


  function medLoad() {
    try {
      var stored = JSON.parse(localStorage.getItem('med_items') || 'null');
      if (stored === null) {
        /* 최초 실행 시 샘플 데이터 작제 */
        window._medItems = MED_SAMPLES.slice();
        try { localStorage.setItem('med_items', JSON.stringify(window._medItems)); } catch(e){}
      } else {
        window._medItems = stored;
      }
    } catch (e) { window._medItems = MED_SAMPLES.slice(); }
  }
  function medPersist() {
    try { localStorage.setItem('med_items', JSON.stringify(window._medItems)); } catch (e) { }
  }

  /* ── 뷰 전환 ── */
  window.medSetView = function (v) {
    window._medView = v;
    ['masonry', 'grid', 'list'].forEach(function (x) {
      var el = document.getElementById('med-view-' + x);
      if (!el) return;
      el.style.background = x === v ? 'var(--accent-blue)' : 'transparent';
      el.style.color = x === v ? '#fff' : 'var(--text-muted)';
    });
    medRender();
  };

  /* ── 유형 필터 ── */
  window.medSetFilter = function (type) {
    window._medFilter = type;
    document.querySelectorAll('[data-med-type]').forEach(function (b) {
      var a = b.dataset.medType === type;
      b.style.background = a ? 'var(--accent-blue)' : 'transparent';
      b.style.color = a ? '#fff' : 'var(--text-secondary)';
      b.style.borderColor = a ? 'var(--accent-blue)' : 'var(--border-color)';
    });
    medRender();
  };

  /* ── 메인 렌더 ── */
  window.medRender = function () {
    medLoad();
    var keyword = ((document.getElementById('med-search') || {}).value || '').toLowerCase();
    var sort = (document.getElementById('med-sort') || {}).value || 'date';
    var filter = window._medFilter || 'all';

    var list = (window._medItems || []).filter(function (it) {
      if (filter !== 'all' && it.mediaType !== filter) return false;
      if (keyword) {
        var hay = (it.title + ' ' + (it.tags || []).join(' ') + ' ' + (it.desc || '')).toLowerCase();
        if (hay.indexOf(keyword) < 0) return false;
      }
      return true;
    });

    if (sort === 'name') list.sort(function (a, b) { return a.title.localeCompare(b.title); });
    else list.sort(function (a, b) { return new Date(b.regDate || 0) - new Date(a.regDate || 0); });

    var cnt = document.getElementById('med-count');
    if (cnt) cnt.textContent = '총 ' + list.length + '개의 미디어';

    var grid = document.getElementById('med-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (!list.length) {
      grid.innerHTML =
        '<div style="padding:80px;text-align:center;color:var(--text-muted)">' +
        '<div style="font-size:52px;margin-bottom:12px">🎬</div>' +
        '<div style="font-size:14px;font-weight:700">미디어가 없습니다</div>' +
        '<div style="font-size:12px;margin-top:4px">미디어 추가 버튼으로 이미지나 동영상을 등록하세요</div></div>';
      return;
    }

    var v = window._medView;

    if (v === 'masonry') {
      /* 매소너리: 좌우 2컬럼, 각 아이템 높이가 자연스럽게 달라짐 */
      grid.style.cssText = 'padding:12px 24px 32px;columns:2 320px;column-gap:16px';
      list.forEach(function (it) {
        var card = medBuildMasonryCard(it);
        grid.appendChild(card);
      });
    } else if (v === 'bento') {
      /* 벤토 그리드: sizeHint에 따라 colspan/rowspan */
      grid.style.cssText = 'padding:12px 24px 32px;display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:180px;gap:12px';
      list.forEach(function (it) { grid.appendChild(medBuildBentoCard(it)); });
    } else if (v === 'grid') {
      /* 균일 그리드 */
      grid.style.cssText = 'padding:12px 24px 32px;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px';
      list.forEach(function (it) { grid.appendChild(medBuildGridCard(it)); });
    } else {
      /* 리스트 */
      grid.style.cssText = 'padding:12px 24px 32px;display:flex;flex-direction:column;gap:10px';
      list.forEach(function (it) { grid.appendChild(medBuildListRow(it)); });
    }
  };

  /* -- 벤토 그리드 카드 (sizeHint로 크기 조합) -- */
  function medBuildBentoCard(it) {
    var size = it.sizeHint || 'medium';
    /* small=1x1, medium=2x1, large=2x2, wide=2x1, tall=1x2 */
    var col = 1, row = 1;
    if (size === 'medium' || size === 'wide') { col = 2; row = 1; }
    else if (size === 'large') { col = 2; row = 2; }
    else if (size === 'tall')  { col = 1; row = 2; }

    var wrap = document.createElement('div');
    wrap.style.cssText =
      'grid-column:span ' + col + ';grid-row:span ' + row + ';' +
      'border-radius:16px;overflow:hidden;position:relative;cursor:pointer;' +
      'background:#0f172a;border:1.5px solid var(--border-color);' +
      'transition:transform .2s,box-shadow .2s,border-color .2s;' +
      'box-shadow:0 2px 12px rgba(0,0,0,.08)';
    wrap.onmouseover = function () {
      this.style.transform = 'scale(1.018)';
      this.style.boxShadow = '0 16px 42px rgba(0,0,0,.22)';
      this.style.borderColor = '#f59e0b';
      this.style.zIndex = '5';
      var d = this.querySelector('[data-med-del]'); if (d) d.style.opacity = '1';
    };
    wrap.onmouseout = function () {
      this.style.transform = '';
      this.style.boxShadow = '0 2px 12px rgba(0,0,0,.08)';
      this.style.borderColor = 'var(--border-color)';
      this.style.zIndex = '';
      var d = this.querySelector('[data-med-del]'); if (d) d.style.opacity = '0';
    };
    wrap.onclick = function (e) { if (!e.target.closest('[data-med-del]')) medOpenDetail(it.id); };

    /* 이미지 */
    var imgEl = document.createElement('img');
    imgEl.src = it.dataUrl || '';
    imgEl.alt = it.title;
    imgEl.loading = 'lazy';
    imgEl.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block';
    wrap.appendChild(imgEl);

    /* 그라디언트 오버레이 */
    var grad = document.createElement('div');
    grad.style.cssText = 'position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.75) 0%,rgba(0,0,0,.08) 55%,transparent 100%);pointer-events:none';
    wrap.appendChild(grad);

    /* 사이즈 배지 */
    var colorMap = { small:'#8b5cf6', medium:'#3b82f6', large:'#ef4444', wide:'#10b981', tall:'#f59e0b' };
    var badge = document.createElement('span');
    badge.style.cssText = 'position:absolute;top:10px;left:10px;padding:3px 9px;border-radius:20px;font-size:9.5px;font-weight:800;color:#fff;background:' + (colorMap[size] || '#6b7280') + 'cc;backdrop-filter:blur(4px);letter-spacing:.4px;text-transform:uppercase;pointer-events:none';
    badge.textContent = size;
    wrap.appendChild(badge);

    /* 삭제 버튼 */
    var delBtn = document.createElement('button');
    delBtn.setAttribute('data-med-del', '1');
    delBtn.style.cssText = 'position:absolute;top:10px;right:10px;width:28px;height:28px;border-radius:50%;border:none;background:rgba(0,0,0,.65);color:#fff;cursor:pointer;font-size:15px;line-height:1;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .15s';
    delBtn.innerHTML = '&times;';
    delBtn.onclick = (function (itemId, itemTitle) {
      return function (e) {
        e.stopPropagation();
        if (!confirm('"' + itemTitle + '"\n이 미디어를 삭제하시겠습니까?')) return;
        medLoad(); window._medItems = (window._medItems || []).filter(function (x) { return x.id !== itemId; });
        medPersist(); medRender();
        if (typeof showToast === 'function') showToast('success', '삭제되었습니다');
      };
    })(it.id, it.title);
    wrap.appendChild(delBtn);

    /* 제목+태그 오버레이 */
    var info = document.createElement('div');
    info.style.cssText = 'position:absolute;bottom:0;left:0;right:0;padding:12px 14px 14px;pointer-events:none';
    var tagColors = ['#f59e0b', '#10b981', '#6366f1', '#ef4444', '#3b82f6'];
    info.innerHTML =
      '<div style="font-size:13px;font-weight:800;color:#fff;margin-bottom:5px;text-shadow:0 1px 4px rgba(0,0,0,.6);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + it.title + '</div>' +
      (it.tags && it.tags.length ?
        '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:4px">' +
        it.tags.slice(0, 3).map(function (t, i) {
          return '<span style="padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;background:' + tagColors[i % tagColors.length] + '33;color:#fff;backdrop-filter:blur(4px);border:1px solid ' + tagColors[i % tagColors.length] + '55">#' + t + '</span>';
        }).join('') + '</div>' : '') +
      '<div style="display:flex;gap:10px"><span style="font-size:10px;color:rgba(255,255,255,.75)">♥ ' + (it.likes || 0) + '</span><span style="font-size:10px;color:rgba(255,255,255,.75)">👁 ' + (it.views || 0) + '</span></div>';
    wrap.appendChild(info);
    return wrap;
  }

  /* -- 매소너리 카드 (자연 비율 + 삭제) -- */

  function medBuildMasonryCard(it) {
    var isVid = it.mediaType === 'video';
    var wrap = document.createElement('div');
    wrap.style.cssText =
      'break-inside:avoid;margin-bottom:14px;border-radius:14px;overflow:hidden;' +
      'background:var(--bg-secondary);border:1.5px solid var(--border-color);' +
      'cursor:pointer;transition:transform .18s,box-shadow .18s,border-color .18s;' +
      'box-shadow:0 2px 10px rgba(0,0,0,.06);position:relative';
    wrap.onmouseover = function () {
      this.style.boxShadow = '0 10px 32px rgba(0,0,0,.18)';
      this.style.borderColor = isVid ? '#ef4444' : '#f59e0b';
      this.style.transform = 'translateY(-3px)';
      var v2 = this.querySelector('video'); if (v2) v2.play();
      var d = this.querySelector('[data-med-del]'); if (d) d.style.opacity = '1';
    };
    wrap.onmouseout = function () {
      this.style.boxShadow = '0 2px 10px rgba(0,0,0,.06)';
      this.style.borderColor = 'var(--border-color)';
      this.style.transform = '';
      var v2 = this.querySelector('video'); if (v2) { v2.pause(); v2.currentTime = 0; }
      var d = this.querySelector('[data-med-del]'); if (d) d.style.opacity = '0';
    };
    wrap.onclick = function (e) { if (!e.target.closest('[data-med-del]')) medOpenDetail(it.id); };

    var mediaBox = document.createElement('div');
    mediaBox.style.cssText = 'width:100%;position:relative;background:#0f172a;overflow:hidden';

    if (isVid) {
      var video = document.createElement('video');
      video.src = it.dataUrl || '';
      /* 자연 비율 (max-height만 제한, object-fit:contain) */
      video.style.cssText = 'width:100%;display:block;height:auto;min-height:120px;max-height:380px;object-fit:contain;vertical-align:bottom';
      video.muted = true;
      video.loop = true;
      video.preload = 'metadata';
      mediaBox.appendChild(video);
      /* 동영상 오버레이 */
      var ov = document.createElement('div');
      ov.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none';
      ov.innerHTML = '<div style="width:48px;height:48px;border-radius:50%;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)"><svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21"/></svg></div>';
      mediaBox.appendChild(ov);
    } else {
      var img = document.createElement('img');
      img.src = it.dataUrl || '';
      img.alt = it.title;
      /* 자연 비율 완전 유지 */
      img.style.cssText = 'width:100%;display:block;height:auto;min-height:80px;object-fit:contain;vertical-align:bottom';
      img.loading = 'lazy';
      mediaBox.appendChild(img);
    }

    /* 타입 배지 */
    var badge = document.createElement('span');
    badge.style.cssText =
      'position:absolute;top:8px;left:8px;padding:3px 10px;border-radius:20px;' +
      'font-size:10px;font-weight:800;color:#fff;backdrop-filter:blur(4px);pointer-events:none;' +
      'background:' + (isVid ? 'rgba(239,68,68,.9)' : 'rgba(245,158,11,.9)');
    badge.textContent = isVid ? '🎬 동영상' : '🖼️ 이미지';
    mediaBox.appendChild(badge);

    /* 삭제 버튼 */
    var delBtn = document.createElement('button');
    delBtn.setAttribute('data-med-del', '1');
    delBtn.title = '삭제';
    delBtn.style.cssText =
      'position:absolute;top:8px;right:8px;width:28px;height:28px;border-radius:50%;' +
      'border:none;background:rgba(0,0,0,.6);color:#fff;cursor:pointer;font-size:14px;' +
      'display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);' +
      'opacity:0;transition:opacity .15s;z-index:5;line-height:1';
    delBtn.innerHTML = '×';
    delBtn.onclick = (function (itemId, itemTitle) {
      return function (e) {
        e.stopPropagation();
        if (!confirm('"' + itemTitle + '"\n이 미디어를 삭제하시겠습니까?')) return;
        medLoad(); window._medItems = (window._medItems || []).filter(function (x) { return x.id !== itemId; });
        medPersist(); medRender();
        if (typeof showToast === 'function') showToast('success', '삭제되었습니다');
      };
    })(it.id, it.title);
    mediaBox.appendChild(delBtn);
    wrap.appendChild(mediaBox);

    /* 정보 영역 */
    var info = document.createElement('div');
    info.style.cssText = 'padding:11px 13px 10px';
    info.innerHTML =
      '<div style="font-size:12.5px;font-weight:700;color:var(--text-primary);margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + it.title + '</div>' +
      (it.desc ? '<div style="font-size:11px;color:var(--text-muted);margin-bottom:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.5">' + it.desc + '</div>' : '') +
      (it.tags && it.tags.length ?
        '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:5px">' +
        it.tags.map(function (t) {
          return '<span style="padding:2px 7px;border-radius:8px;font-size:10px;font-weight:600;background:rgba(245,158,11,.1);color:#d97706">#' + t + '</span>';
        }).join('') + '</div>' : '') +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:2px"><div style="display:flex;gap:8px"><span style="font-size:10px;color:var(--text-muted)">♥ ' + (it.likes || 0) + '</span><span style="font-size:10px;color:var(--text-muted)">👁 ' + (it.views || 0) + '</span></div><span style="font-size:10px;color:var(--text-muted)">' + (it.regDate || '') + '</span></div>';
    wrap.appendChild(info);
    return wrap;
  }

  /* -- 균일 그리드 카드 (16:9 + 삭제) -- */
  function medBuildGridCard(it) {
    var isVid = it.mediaType === 'video';
    var wrap = document.createElement('div');
    wrap.style.cssText =
      'border-radius:12px;overflow:hidden;background:var(--bg-secondary);' +
      'border:1.5px solid var(--border-color);cursor:pointer;transition:all .18s;position:relative';
    wrap.onmouseover = function () {
      this.style.transform = 'translateY(-3px)';
      this.style.boxShadow = '0 10px 28px rgba(0,0,0,.16)';
      this.style.borderColor = isVid ? '#ef4444' : '#f59e0b';
      var d = this.querySelector('[data-med-del]'); if (d) d.style.opacity = '1';
      var v2 = this.querySelector('video'); if (v2) v2.play();
    };
    wrap.onmouseout = function () {
      this.style.transform = '';
      this.style.boxShadow = '';
      this.style.borderColor = 'var(--border-color)';
      var d = this.querySelector('[data-med-del]'); if (d) d.style.opacity = '0';
      var v2 = this.querySelector('video'); if (v2) { v2.pause(); v2.currentTime = 0; }
    };
    wrap.onclick = function (e) { if (!e.target.closest('[data-med-del]')) medOpenDetail(it.id); };

    /* 16:9 비율 박스 */
    var mediaBox = document.createElement('div');
    mediaBox.style.cssText = 'width:100%;padding-top:62.5%;position:relative;background:#0f172a;overflow:hidden';
    var inner = document.createElement('div');
    inner.style.cssText = 'position:absolute;inset:0';

    if (isVid) {
      var vid = document.createElement('video');
      vid.src = it.dataUrl || ''; vid.muted = true; vid.loop = true; vid.preload = 'metadata';
      vid.style.cssText = 'width:100%;height:100%;object-fit:cover';
      inner.appendChild(vid);
      var playOv = document.createElement('div');
      playOv.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none';
      playOv.innerHTML = '<div style="width:40px;height:40px;border-radius:50%;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center"><svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21"/></svg></div>';
      inner.appendChild(playOv);
    } else {
      var img = document.createElement('img');
      img.src = it.dataUrl || ''; img.alt = it.title; img.loading = 'lazy';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover';
      inner.appendChild(img);
    }
    var badge2 = document.createElement('span');
    badge2.style.cssText = 'position:absolute;top:6px;left:6px;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:800;color:#fff;background:' + (isVid ? 'rgba(239,68,68,.9)' : 'rgba(245,158,11,.9)') + ';pointer-events:none';
    badge2.textContent = isVid ? '🎬' : '🖼️';
    inner.appendChild(badge2);

    var db = document.createElement('button');
    db.setAttribute('data-med-del', '1');
    db.style.cssText = 'position:absolute;top:6px;right:6px;width:26px;height:26px;border-radius:50%;border:none;background:rgba(0,0,0,.6);color:#fff;cursor:pointer;font-size:13px;line-height:1;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .15s';
    db.innerHTML = '×';
    db.onclick = (function (itemId, itemTitle) {
      return function (e) {
        e.stopPropagation();
        if (!confirm('"' + itemTitle + '" 삭제하시겠습니까?')) return;
        medLoad(); window._medItems = (window._medItems || []).filter(function (x) { return x.id !== itemId; });
        medPersist(); medRender(); if (typeof showToast === 'function') showToast('success', '삭제되었습니다');
      };
    })(it.id, it.title);
    inner.appendChild(db);
    mediaBox.appendChild(inner);
    wrap.appendChild(mediaBox);

    var info2 = document.createElement('div');
    info2.style.cssText = 'padding:10px 12px';
    info2.innerHTML =
      '<div style="font-size:12px;font-weight:700;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:5px">' + it.title + '</div>' +
      (it.tags && it.tags.length ? '<div style="display:flex;flex-wrap:wrap;gap:3px">' +
        it.tags.slice(0, 4).map(function (t) { return '<span style="padding:1px 6px;border-radius:6px;font-size:9.5px;font-weight:600;background:rgba(245,158,11,.1);color:#d97706">#' + t + '</span>'; }).join('') + '</div>' : '') +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px"><div style="display:flex;gap:8px"><span style="font-size:10px;color:var(--text-muted)">♥ ' + (it.likes || 0) + '</span><span style="font-size:10px;color:var(--text-muted)">👁 ' + (it.views || 0) + '</span></div><span style="font-size:10px;color:var(--text-muted)">' + (it.regDate || '') + '</span></div>';
    wrap.appendChild(info2);
    return wrap;
  }

  /* -- 리스트 행 (삭제 버튼 추가) -- */
  function medBuildListRow(it) {
    var isVid = it.mediaType === 'video';
    var row = document.createElement('div');
    row.style.cssText =
      'display:grid;grid-template-columns:96px 1fr auto;gap:14px;padding:10px 12px;' +
      'border-radius:12px;background:var(--bg-secondary);border:1.5px solid var(--border-color);' +
      'cursor:pointer;transition:all .15s;align-items:center';
    row.onmouseover = function () { this.style.borderColor = isVid ? '#ef4444' : '#f59e0b'; this.style.background = 'var(--bg-tertiary)'; };
    row.onmouseout = function () { this.style.borderColor = 'var(--border-color)'; this.style.background = 'var(--bg-secondary)'; };
    row.onclick = function (e) { if (!e.target.closest('[data-med-del]')) medOpenDetail(it.id); };

    var thumbBox = document.createElement('div');
    thumbBox.style.cssText = 'width:96px;height:64px;border-radius:9px;overflow:hidden;background:#0f172a;position:relative;flex-shrink:0';
    if (it.dataUrl && it.mediaType === 'image') {
      var img = document.createElement('img');
      img.src = it.dataUrl;
      img.style.cssText = 'width:100%;height:100%;object-fit:cover';
      thumbBox.appendChild(img);
    } else if (isVid) {
      var vid = document.createElement('video');
      vid.src = it.dataUrl || '';
      vid.style.cssText = 'width:100%;height:100%;object-fit:cover';
      vid.muted = true;
      thumbBox.appendChild(vid);
      thumbBox.innerHTML += '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.25)"><span style="font-size:20px">🎬</span></div>';
    } else {
      thumbBox.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:24px">🖼️</div>';
    }
    var bLabel = document.createElement('span');
    bLabel.style.cssText = 'position:absolute;bottom:3px;left:3px;padding:1px 5px;border-radius:5px;font-size:9px;font-weight:800;color:#fff;background:' + (isVid ? 'rgba(239,68,68,.85)' : 'rgba(245,158,11,.85)');
    bLabel.textContent = isVid ? '동영상' : '이미지';
    thumbBox.appendChild(bLabel);
    row.appendChild(thumbBox);

    var info = document.createElement('div');
    info.style.cssText = 'min-width:0';
    info.innerHTML =
      '<div style="font-size:13px;font-weight:700;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:3px">' + it.title + '</div>' +
      (it.desc ? '<div style="font-size:11.5px;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:5px">' + it.desc + '</div>' : '') +
      '<div style="display:flex;flex-wrap:wrap;gap:4px;align-items:center">' +
      (it.tags || []).slice(0, 5).map(function (t) { return '<span style="padding:1px 7px;border-radius:8px;font-size:10px;font-weight:600;background:rgba(245,158,11,.1);color:#d97706">#' + t + '</span>'; }).join('') +
      '<span style="font-size:10px;color:var(--text-muted);margin-left:8px">♥ ' + (it.likes || 0) + '</span>' +
      '<span style="font-size:10px;color:var(--text-muted)">👁 ' + (it.views || 0) + '</span>' +
      '<span style="font-size:10px;color:var(--text-muted);margin-left:auto">' + (it.regDate || '') + '</span></div>';
    row.appendChild(info);

    /* 삭제 버튼 */
    var acts = document.createElement('div');
    acts.style.cssText = 'display:flex;padding-right:4px';
    var db3 = document.createElement('button');
    db3.setAttribute('data-med-del', '1');
    db3.style.cssText = 'width:32px;height:32px;border-radius:8px;border:1.5px solid var(--border-color);background:transparent;color:var(--text-muted);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:15px;transition:all .15s';
    db3.title = '삭제'; db3.innerHTML = '🗑️';
    db3.onmouseover = function () { this.style.background = 'rgba(239,68,68,.1)'; this.style.borderColor = '#ef4444'; this.style.color = '#ef4444'; };
    db3.onmouseout = function () { this.style.background = 'transparent'; this.style.borderColor = 'var(--border-color)'; this.style.color = 'var(--text-muted)'; };
    db3.onclick = (function (itemId, itemTitle) {
      return function (e) {
        e.stopPropagation();
        if (!confirm('"' + itemTitle + '" 삭제하시겠습니까?')) return;
        medLoad(); window._medItems = (window._medItems || []).filter(function (x) { return x.id !== itemId; });
        medPersist(); medRender(); if (typeof showToast === 'function') showToast('success', '삭제되었습니다');
      };
    })(it.id, it.title);
    acts.appendChild(db3);
    row.appendChild(acts);
    return row;
  }

  /* ── 상세 보기 ── */
  window.medOpenDetail = function (id) {
    medLoad();
    var it = (window._medItems || []).find(function (x) { return x.id === id; });
    if (!it) return;

    var mBox = document.getElementById('med-detail-media');
    var iBox = document.getElementById('med-detail-info');
    if (!mBox || !iBox) return;

    mBox.innerHTML = '';
    if (it.mediaType === 'video') {
      var vid = document.createElement('video');
      vid.src = it.dataUrl || '';
      vid.controls = true;
      vid.autoplay = true;
      vid.style.cssText = 'max-width:85vw;max-height:65vh;border-radius:10px';
      mBox.appendChild(vid);
    } else {
      var img = document.createElement('img');
      img.src = it.dataUrl || '';
      img.alt = it.title;
      img.style.cssText = 'max-width:85vw;max-height:65vh;border-radius:10px;object-fit:contain';
      mBox.appendChild(img);
    }

    iBox.innerHTML =
      '<div style="font-size:16px;font-weight:800;margin-bottom:6px">' + it.title + '</div>' +
      (it.desc ? '<div style="font-size:13px;opacity:.8;margin-bottom:8px;line-height:1.6">' + it.desc + '</div>' : '') +
      '<div style="display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin-bottom:8px">' +
      (it.tags || []).map(function (t) { return '<span style="padding:3px 10px;border-radius:12px;font-size:11.5px;font-weight:600;background:rgba(245,158,11,.25);color:#fcd34d">#' + t + '</span>'; }).join('') +
      '</div>' +
      '<div style="display:flex;gap:16px;justify-content:center;font-size:12px;color:rgba(255,255,255,.7)">' +
      '<span>♥ 좋아요 ' + (it.likes || 0) + '</span>' +
      '<span>👁 조회수 ' + (it.views || 0) + '</span>' +
      '<span>📅 ' + (it.regDate || '') + '</span>' +
      '</div>';

    var modal = document.getElementById('medDetailModal');
    if (modal) modal.style.display = 'flex';
  };

  window.medCloseDetail = function () {
    var m = document.getElementById('medDetailModal');
    if (m) {
      m.style.display = 'none';
      /* 동영상 정지 */
      var vid = m.querySelector('video');
      if (vid) { vid.pause(); vid.src = ''; }
    }
  };

  /* ── 다중 파일 업로드 처리 ── */
  window._pendingFiles = []; /* { dataUrl, mediaType, title, origName } */

  /* 드래그&드롭 */
  window.medHandleDrop = function (e) {
    e.preventDefault();
    var dz = document.getElementById('med-drop-zone');
    if (dz) { dz.style.borderColor = 'var(--border-color)'; dz.style.background = 'var(--bg-secondary)'; }
    medHandleFiles(e.dataTransfer.files);
  };

  /* 파일 목록 처리 */
  window.medHandleFiles = function (fileList) {
    if (!fileList || fileList.length === 0) return;
    var toProcess = Array.prototype.slice.call(fileList).filter(function (f) {
      return f.type.startsWith('image/') || f.type.startsWith('video/');
    });
    if (toProcess.length < fileList.length) {
      if (typeof showToast === 'function') showToast('warn', '이미지 또는 동영상 파일만 업로드 가능합니다');
    }
    if (toProcess.length === 0) return;
    var loaded = 0;
    toProcess.forEach(function (file) {
      var reader = new FileReader();
      reader.onload = function (ev) {
        var isVideo = file.type.startsWith('video/');
        window._pendingFiles.push({
          dataUrl: ev.target.result,
          mediaType: isVideo ? 'video' : 'image',
          title: file.name.replace(/\.[^/.]+$/, ''),
          origName: file.name
        });
        loaded++;
        if (loaded === toProcess.length) _medRenderFileList();
      };
      reader.readAsDataURL(file);
    });
    /* input 초기화 (같은 파일 재선택 허용) */
    var inp = document.getElementById('med-file-input');
    if (inp) inp.value = '';
  };

  /* 하위호환: 단일 파일 핸들러 */
  window.medHandleFile = function (file) { if (file) medHandleFiles([file]); };

  /* 파일 목록 카드 렌더링 */
  function _medRenderFileList() {
    var listEl = document.getElementById('med-file-list');
    var countEl = document.getElementById('med-file-count');
    if (!listEl) return;
    var files = window._pendingFiles;
    if (files.length === 0) {
      listEl.style.display = 'none';
      listEl.innerHTML = '';
      if (countEl) countEl.textContent = '';
      return;
    }
    listEl.style.display = 'flex';
    listEl.innerHTML = '';
    /* 제목 입력 영역 표시 여부 조정 */
    var titleSection = document.getElementById('med-title') && document.getElementById('med-title').closest('div[style]');
    files.forEach(function (f, idx) {
      var card = document.createElement('div');
      card.style.cssText = 'display:flex;align-items:center;gap:10px;background:var(--bg-secondary);border:1.5px solid var(--border-color);border-radius:12px;padding:8px 12px;position:relative;transition:border-color .15s';
      /* 썸네일 */
      var thumb = document.createElement('div');
      thumb.style.cssText = 'width:52px;height:52px;border-radius:8px;overflow:hidden;flex-shrink:0;background:var(--bg-tertiary)';
      if (f.mediaType === 'image') {
        var img = document.createElement('img');
        img.src = f.dataUrl;
        img.style.cssText = 'width:100%;height:100%;object-fit:cover';
        thumb.appendChild(img);
      } else {
        var videoThumb = document.createElement('div');
        videoThumb.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:20px';
        videoThumb.innerHTML = '▶';
        thumb.appendChild(videoThumb);
      }
      card.appendChild(thumb);
      /* 제목 입력 + 타입 배지 */
      var info = document.createElement('div');
      info.style.cssText = 'flex:1;display:flex;flex-direction:column;gap:4px;min-width:0';
      var badge = document.createElement('span');
      badge.textContent = f.mediaType === 'image' ? '이미지' : '동영상';
      badge.style.cssText = 'font-size:9.5px;font-weight:700;padding:2px 7px;border-radius:20px;background:' + (f.mediaType === 'image' ? '#f59e0b22' : '#6366f122') + ';color:' + (f.mediaType === 'image' ? '#f59e0b' : '#6366f1') + ';width:fit-content';
      var titleInput = document.createElement('input');
      titleInput.type = 'text';
      titleInput.value = f.title;
      titleInput.placeholder = '제목 입력';
      titleInput.dataset.idx = String(idx);
      titleInput.style.cssText = 'border:none;outline:none;background:transparent;font-size:13px;font-weight:600;color:var(--text-primary);width:100%;padding:0';
      titleInput.addEventListener('input', function () {
        var i = parseInt(this.dataset.idx, 10);
        if (window._pendingFiles[i] !== undefined) window._pendingFiles[i].title = this.value;
      });
      info.appendChild(badge);
      info.appendChild(titleInput);
      card.appendChild(info);
      /* 삭제 버튼 */
      var delBtn = document.createElement('button');
      delBtn.innerHTML = '&times;';
      delBtn.style.cssText = 'width:24px;height:24px;border-radius:50%;border:none;background:var(--bg-tertiary);cursor:pointer;font-size:14px;color:var(--text-muted);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .15s';
      delBtn.onmouseover = function () { this.style.background = '#ef444422'; this.style.color = '#ef4444'; };
      delBtn.onmouseout  = function () { this.style.background = 'var(--bg-tertiary)'; this.style.color = 'var(--text-muted)'; };
      delBtn.onclick = (function (i) {
        return function (e) {
          e.stopPropagation();
          window._pendingFiles.splice(i, 1);
          _medRenderFileList();
        };
      })(idx);
      card.appendChild(delBtn);
      listEl.appendChild(card);
    });
    if (countEl) countEl.textContent = '📎 ' + files.length + '개 파일 선택됨';
    /* 파일이 있으면 공통 제목 필드는 숨김 */
    var titleWrap = document.getElementById('med-title') ? document.getElementById('med-title').parentElement : null;
    if (titleWrap) titleWrap.style.display = files.length ? 'none' : '';
  }



  /* ── 태그 입력 컴포넌트 공통 유틸 ──
     prefix: 'med' 또는 'chub'
  ──────────────────────────────── */
  window._tagState = window._tagState || {};

  function _tagGetState(prefix) {
    if (!window._tagState[prefix]) window._tagState[prefix] = [];
    return window._tagState[prefix];
  }

  function _tagSync(prefix) {
    var tags = _tagGetState(prefix);
    var hi = document.getElementById(prefix + '-tags');
    if (hi) hi.value = tags.join(',');
    _tagRender(prefix);
  }

  function _tagRender(prefix) {
    var tags = _tagGetState(prefix);
    var listEl = document.getElementById(prefix + '-tags-list');
    if (!listEl) return;
    /* 기존 칩만 제거(input은 유지) */
    var existChips = listEl.parentNode ? listEl.parentNode.querySelectorAll('[data-tag-chip]') : [];
    for (var ci = existChips.length - 1; ci >= 0; ci--) {
      existChips[ci].parentNode.removeChild(existChips[ci]);
    }
    /* 콘텐츠 허브 vs 미디어 색상 구분 */
    var bg  = prefix === 'med' ? 'rgba(245,158,11,.15)' : 'rgba(99,102,241,.15)';
    var col = prefix === 'med' ? '#d97706' : '#6366f1';
    var bdr = prefix === 'med' ? '#d97706aa' : '#6366f1aa';
    var box = document.getElementById(prefix + '-tags-box');
    var inputEl = document.getElementById(prefix + '-tags-input');

    tags.forEach(function (tag, idx) {
      var chip = document.createElement('span');
      chip.setAttribute('data-tag-chip', idx);
      chip.style.cssText =
        'display:inline-flex;align-items:center;gap:4px;padding:3px 8px 3px 10px;' +
        'border-radius:30px;font-size:11.5px;font-weight:700;' +
        'background:' + bg + ';color:' + col + ';border:1px solid ' + bdr + ';' +
        'cursor:pointer;user-select:none;flex-shrink:0';
      chip.title = '클릭하면 수정';

      var txt = document.createTextNode('#' + tag);
      chip.appendChild(txt);

      /* × 삭제 버튼 */
      var del = document.createElement('span');
      del.textContent = '×';
      del.style.cssText = 'font-size:14px;line-height:1;opacity:.55;padding:0 1px;cursor:pointer;margin-left:1px';
      del.title = '태그 삭제';
      del.onclick = (function (i) {
        return function (e) {
          e.stopPropagation();
          _tagGetState(prefix).splice(i, 1);
          _tagSync(prefix);
        };
      })(idx);
      chip.appendChild(del);

      /* 칩 클릭 시 수정 모드 */
      chip.onclick = (function (i, t) {
        return function (e) {
          if (e.target === del) return;
          var inp2 = document.getElementById(prefix + '-tags-input');
          if (!inp2) return;
          _tagGetState(prefix).splice(i, 1);
          _tagSync(prefix);
          inp2.value = t;
          inp2.focus();
          var len = inp2.value.length;
          inp2.setSelectionRange(len, len);
        };
      })(idx, tag);

      if (box && inputEl) box.insertBefore(chip, inputEl);
    });

    /* placeholder 제어 */
    if (inputEl) {
      inputEl.placeholder = tags.length === 0 ? '태그 입력 후 Enter 또는 Space' : '태그 추가...';
    }
  }

  function _tagCommit(prefix, inputEl) {
    var val = (inputEl.value || '').trim().replace(/^#+/, '');
    if (!val) return;
    var parts = val.split(/[,\uff0c]+/).map(function (t) { return t.trim().replace(/^#+/, ''); }).filter(Boolean);
    var arr = _tagGetState(prefix);
    parts.forEach(function (p) {
      if (p && arr.indexOf(p) < 0) arr.push(p);
    });
    inputEl.value = '';
    _tagSync(prefix);
  }

  function _tagAddWord(prefix, inputEl) {
    var raw = inputEl.value;
    var parts = raw.split(/\s+/);
    var done = parts.slice(0, -1);
    var remaining = parts[parts.length - 1] || '';
    var arr = _tagGetState(prefix);
    done.forEach(function (p) {
      p = p.trim().replace(/^#+/, '');
      if (p && arr.indexOf(p) < 0) arr.push(p);
    });
    inputEl.value = remaining;
    if (done.length) _tagSync(prefix);
  }

  function _tagReset(prefix) {
    window._tagState[prefix] = [];
    var inpEl = document.getElementById(prefix + '-tags-input');
    if (inpEl) inpEl.value = '';
    _tagSync(prefix);
  }

  /* window에 노출 (chub IIFE 등 외부에서 사용 가능하도록) */
  window._tagSync   = _tagSync;
  window._tagCommit = _tagCommit;
  window._tagReset  = _tagReset;
  window._tagRender = _tagRender;
  window._tagGetState = _tagGetState;
  window._tagAddWord  = _tagAddWord;


  window._medTagKeydown = function (e) {
    var inp = e.target;
    if (e.key === 'Enter') {
      e.preventDefault();
      _tagCommit('med', inp);
    } else if (e.key === 'Backspace' && !inp.value) {
      var arr = _tagGetState('med');
      if (arr.length) { arr.pop(); _tagSync('med'); }
    }
  };
  window._medTagInput = function (e) {
    if (e.target.value.indexOf(' ') >= 0) _tagAddWord('med', e.target);
  };
  window._medTagCommit = function (inp) { _tagCommit('med', inp); };

  /* 콘텐츠 허브 태그 이벤트 핸들러 */
  window._chubTagKeydown = function (e) {
    var inp = e.target;
    if (e.key === 'Enter') {
      e.preventDefault();
      _tagCommit('chub', inp);
    } else if (e.key === 'Backspace' && !inp.value) {
      var arr2 = _tagGetState('chub');
      if (arr2.length) { arr2.pop(); _tagSync('chub'); }
    }
  };
  window._chubTagInput = function (e) {
    if (e.target.value.indexOf(' ') >= 0) _tagAddWord('chub', e.target);
  };
  window._chubTagCommit = function (inp) { _tagCommit('chub', inp); };

  /* medCloseModal – 모달 숨기기 + 태그 초기화 (직접 구현) */
  window.medCloseModal = function () {
    var m = document.getElementById('medAddModal');
    if (m) m.style.display = 'none';
    _tagReset('med');
    /* 파일 목록 초기화 */
    window._pendingFiles = [];
    var listEl = document.getElementById('med-file-list');
    if (listEl) { listEl.style.display = 'none'; listEl.innerHTML = ''; }
    var countEl = document.getElementById('med-file-count');
    if (countEl) countEl.textContent = '';
    /* 제목 필드 복구 */
    var titleWrap = document.getElementById('med-title') ? document.getElementById('med-title').parentElement : null;
    if (titleWrap) titleWrap.style.display = '';
  };

  /* med IIFE 안에서 medOpenAddModal 및 medSave 다시 정의 */
  var _origMedOpen = window.medOpenAddModal;
  window.medOpenAddModal = function () {
    /* 기본 필드 초기화 */
    ['med-title', 'med-desc'].forEach(function (id) {
      var el = document.getElementById(id); if (el) el.value = '';
    });
    var mLikes = document.getElementById('med-likes'); if (mLikes) mLikes.value = 0;
    var mViews = document.getElementById('med-views'); if (mViews) mViews.value = 0;
    _tagReset('med');
    /* 다중 파일 상태 초기화 */
    window._pendingFiles = [];
    var listEl = document.getElementById('med-file-list');
    if (listEl) { listEl.style.display = 'none'; listEl.innerHTML = ''; }
    var countEl = document.getElementById('med-file-count');
    if (countEl) countEl.textContent = '';
    /* 제목 필드 표시 */
    var titleWrap = document.getElementById('med-title') ? document.getElementById('med-title').parentElement : null;
    if (titleWrap) titleWrap.style.display = '';
    /* 파일 input 초기화 */
    var inp = document.getElementById('med-file-input'); if (inp) inp.value = '';
    var m = document.getElementById('medAddModal');
    if (m) { m.style.display = 'flex'; if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 30); }
    setTimeout(function () { _tagSync('med'); }, 50);
  };


  var _origMedSave = window.medSave;
  window.medSave = function () {
    /* 입력 중인 태그가 있다면 commit */
    var inp = document.getElementById('med-tags-input');
    if (inp && inp.value.trim()) _tagCommit('med', inp);
    var tagsVal = (document.getElementById('med-tags') || {}).value || '';
    var tags = tagsVal.split(',').map(function (t) { return t.trim(); }).filter(Boolean);
    var desc = (document.getElementById('med-desc') || {}).value || '';
    var today = new Date().toISOString().split('T')[0];

    /* ─ 다중 파일 모드 ─ */
    var files = window._pendingFiles || [];
    if (files.length > 0) {
      /* 제목이 비어있는 파일 체크 */
      var emptyTitle = files.some(function (f) { return !f.title.trim(); });
      if (emptyTitle) {
        if (typeof showToast === 'function') showToast('warn', '모든 파일의 제목을 입력하세요');
        return;
      }
      medLoad();
      var likesVal = parseInt((document.getElementById('med-likes') || {}).value) || 0;
      var viewsVal = parseInt((document.getElementById('med-views') || {}).value) || 0;
      files.forEach(function (f, i) {
        window._medItems.unshift({
          id: 'm' + (Date.now() + i),
          mediaType: f.mediaType,
          title: f.title.trim(),
          tags: tags,
          desc: desc,
          dataUrl: f.dataUrl,
          likes: likesVal, views: viewsVal,
          regDate: today
        });
      });
      medPersist();
      medCloseModal();
      medRender();
      if (typeof showToast === 'function') showToast('success', files.length + '개 미디어가 등록되었습니다');
      return;
    }

    /* ─ 단일 파일 모드 (기존 호환) ─ */
    var title = (document.getElementById('med-title') || {}).value || '';
    var dataUrl = (document.getElementById('med-file-data') || {}).value || '';
    var fileType = (document.getElementById('med-file-type') || {}).value || '';
    if (!title) { if (typeof showToast === 'function') showToast('warn', '제목을 입력하세요'); return; }
    if (!dataUrl) { if (typeof showToast === 'function') showToast('warn', '파일을 선택하세요'); return; }
    var likesVal2 = parseInt((document.getElementById('med-likes') || {}).value) || 0;
    var viewsVal2 = parseInt((document.getElementById('med-views') || {}).value) || 0;
    medLoad();
    window._medItems.unshift({
      id: 'm' + Date.now(),
      mediaType: fileType,
      title: title,
      tags: tags,
      desc: desc,
      dataUrl: dataUrl,
      likes: likesVal2, views: viewsVal2,
      regDate: today
    });
    medPersist();
    medCloseModal();
    medRender();
    if (typeof showToast === 'function') showToast('success', '미디어가 등록되었습니다');
  };


  /* ── hp-media 진입 시 자동 렌더 ── */
  var _prev_showHpMed = window.showHomepagePage;
  window.showHomepagePage = function (pageId, navEl) {
    if (typeof _prev_showHpMed === 'function') _prev_showHpMed(pageId, navEl);
    if (pageId === 'hp-media') {
      setTimeout(function () {
        medRender();
        if (typeof refreshIcons === 'function') refreshIcons();
      }, 100);
    }
  };

  /* ── 배경 클릭 닫기 ── */
  document.addEventListener('click', function (e) {
    var am = document.getElementById('medAddModal');
    if (am && e.target === am) medCloseModal();
  });


})(); /* med IIFE 닫기 */

/* ══════════════════════════════════════════════
   콘텐츠 허브 – 렌더 & 저장 시스템
   저장소: localStorage 'chub_items'
══════════════════════════════════════════════ */
(function () {

  var CHUB_SAMPLE = [
    /* ── 뉴스 (10개) ── */
    { id: 'c1', type: 'news', title: 'AI 반도체 시장 2026년 3천억 달러 전망', url: 'https://zdnet.co.kr', summary: '글로벌 AI 반도체 시장이 2026년 3천억 달러를 돌파할 것이라는 전망이 나왔다.', tags: ['AI', '반도체', '시장'], likes: 142, views: 3850, regDate: '2026-04-01', img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=480&h=280&fit=crop' },
    { id: 'c2', type: 'news', title: '정부 디지털전환 예산 20조 원 투입', url: 'https://dt.co.kr', summary: '정부가 디지털전환 가속화를 위해 향후 3년간 20조 원을 투입한다고 발표했다.', tags: ['디지털전환', '정부', '예산'], likes: 89, views: 2210, regDate: '2026-03-30', img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=480&h=280&fit=crop' },
    { id: 'c3', type: 'news', title: '테슬라 자율주행 레벨4 상용화 임박', url: 'https://electrek.co', summary: '테슬라가 레벨4 자율주행 기능을 2026년 하반기부터 상용화하겠다고 밝혔다.', tags: ['테슬라', '자율주행', 'EV'], likes: 203, views: 5640, regDate: '2026-03-28', img: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=480&h=280&fit=crop' },
    { id: 'c4', type: 'news', title: '오픈AI GPT-5 공개 임박, 멀티모달 강화', url: 'https://openai.com', summary: '오픈AI가 GPT-5를 곧 공개할 예정이며, 멀티모달 기능이 대폭 강화될 것으로 알려졌다.', tags: ['GPT-5', 'OpenAI', 'LLM'], likes: 331, views: 8900, regDate: '2026-03-25', img: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=480&h=280&fit=crop' },
    { id: 'c5', type: 'news', title: '국내 스타트업 투자 전년 대비 38% 급증', url: 'https://platum.kr', summary: '2026년 1분기 국내 스타트업 투자금액이 전년 동기 대비 38% 증가한 것으로 나타났다.', tags: ['스타트업', '투자', '벤처'], likes: 77, views: 1980, regDate: '2026-03-22', img: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=480&h=280&fit=crop' },
    { id: 'c6n', type: 'news', title: '삼성전자 3nm GAA 공정 양산 본격화', url: 'https://sammobile.com', summary: '삼성전자가 세계 최초로 3nm GAA 공정 기반 칩 양산을 본격화한다고 발표했다.', tags: ['삼성전자', '반도체', '3nm'], likes: 178, views: 4200, regDate: '2026-04-02', img: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=480&h=280&fit=crop' },
    { id: 'c7n', type: 'news', title: '메타 AR 글래스 상용 버전 출시 예정', url: 'https://meta.com', summary: '메타가 소비자용 AR 글래스를 2026년 3분기에 출시할 계획이라고 밝혔다.', tags: ['메타', 'AR', 'XR'], likes: 245, views: 6100, regDate: '2026-03-20', img: 'https://images.unsplash.com/photo-1617802690658-1173a812650d?w=480&h=280&fit=crop' },
    { id: 'c8n', type: 'news', title: '한국 5G 가입자 5천만 돌파', url: 'https://newsis.com', summary: '국내 5G 이동통신 가입자 수가 5천만 명을 돌파하며 세계 최고 보급률을 기록했다.', tags: ['5G', '통신', 'KT'], likes: 56, views: 1420, regDate: '2026-03-18', img: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=480&h=280&fit=crop' },
    { id: 'c9n', type: 'news', title: '글로벌 SaaS 시장 연 25% 성장 전망', url: 'https://techcrunch.com', summary: 'B2B SaaS 시장이 AI 기능 내장화로 인해 연간 25% 이상 성장할 것으로 전망된다.', tags: ['SaaS', 'B2B', '클라우드'], likes: 134, views: 3680, regDate: '2026-03-15', img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=480&h=280&fit=crop' },
    { id: 'c10n', type: 'news', title: 'EU AI 규제법 본격 시행', url: 'https://ec.europa.eu', summary: 'EU의 AI 규제법(AI Act)이 2026년 4월부터 본격 시행되며 기업들의 대응이 필요하다.', tags: ['EU', 'AI규제', '법률'], likes: 92, views: 2560, regDate: '2026-04-05', img: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=480&h=280&fit=crop' },

    /* ── 블로그 (10개) ── */
    { id: 'c6', type: 'blog', title: 'React 19 새 기능 완벽 정리', url: 'https://react.dev', summary: 'React 19의 주요 변경사항과 새로운 훅, 서버 컴포넌트 개선사항을 상세히 정리했습니다.', tags: ['React', 'JavaScript', '웹개발'], likes: 256, views: 6720, regDate: '2026-04-02', img: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=480&h=280&fit=crop' },
    { id: 'c7', type: 'blog', title: 'LLM 프롬프트 엔지니어링 10가지 핵심 기법', url: 'https://promptingguide.ai', summary: '실무에서 바로 쓸 수 있는 LLM 프롬프트 엔지니어링의 핵심 기법 10가지를 소개합니다.', tags: ['LLM', '프롬프트', 'AI'], likes: 418, views: 11200, regDate: '2026-03-29', img: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=480&h=280&fit=crop' },
    { id: 'c8', type: 'blog', title: 'CSS Grid vs Flexbox 2026 최신 기준', url: 'https://css-tricks.com', summary: 'CSS Grid와 Flexbox를 어떤 상황에서 써야 하는지 2026년 최신 기준으로 비교합니다.', tags: ['CSS', '웹디자인', '레이아웃'], likes: 189, views: 4830, regDate: '2026-03-26', img: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=480&h=280&fit=crop' },
    { id: 'c9', type: 'blog', title: '1인 SaaS 창업 6개월 회고록', url: 'https://velog.io', summary: '혼자서 SaaS 제품을 만들고 6개월 동안 운영하면서 배운 것들을 솔직하게 공유합니다.', tags: ['SaaS', '창업', '회고'], likes: 302, views: 8450, regDate: '2026-03-20', img: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=480&h=280&fit=crop' },
    { id: 'c10', type: 'blog', title: 'TypeScript 5.4 새 기능 완벽 정리', url: 'https://typescriptlang.org', summary: 'TypeScript 5.4에서 추가된 새로운 기능들을 예제와 함께 상세히 정리했습니다.', tags: ['TypeScript', 'JavaScript', '개발'], likes: 145, views: 3920, regDate: '2026-03-18', img: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=480&h=280&fit=crop' },
    { id: 'c6b', type: 'blog', title: 'Docker 컨테이너 보안 완벽 가이드', url: 'https://docs.docker.com', summary: '프로덕션 환경에서 Docker 컨테이너를 안전하게 운영하기 위한 15가지 핵심 보안 체크리스트.', tags: ['Docker', '보안', 'DevOps'], likes: 312, views: 7840, regDate: '2026-04-03', img: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=480&h=280&fit=crop' },
    { id: 'c7b', type: 'blog', title: 'Next.js 15 App Router 마이그레이션 가이드', url: 'https://nextjs.org', summary: 'Pages Router에서 App Router로 마이그레이션하는 단계별 가이드와 주의사항을 정리합니다.', tags: ['Next.js', 'React', '마이그레이션'], likes: 278, views: 6920, regDate: '2026-03-24', img: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=480&h=280&fit=crop' },
    { id: 'c8b', type: 'blog', title: 'PostgreSQL vs MySQL 2026 성능 벤치마크', url: 'https://blog.pganalyze.com', summary: '최신 버전 기준으로 PostgreSQL과 MySQL의 성능을 10가지 시나리오에서 비교 분석합니다.', tags: ['PostgreSQL', 'MySQL', 'DB'], likes: 198, views: 5340, regDate: '2026-03-16', img: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=480&h=280&fit=crop' },
    { id: 'c9b', type: 'blog', title: 'Rust로 첫 웹 서버 만들기 튜토리얼', url: 'https://rust-lang.org', summary: 'Rust와 Actix-web을 사용해 처음부터 REST API 서버를 구축하는 입문 튜토리얼입니다.', tags: ['Rust', '백엔드', 'API'], likes: 167, views: 4120, regDate: '2026-03-12', img: 'https://images.unsplash.com/photo-1515879218367-8466d910adef?w=480&h=280&fit=crop' },
    { id: 'c10b', type: 'blog', title: 'AI Agent 아키텍처 설계 패턴 총정리', url: 'https://langchain.dev', summary: 'ReAct, Plan-and-Execute 등 AI Agent 구축 시 사용되는 주요 아키텍처 패턴을 비교합니다.', tags: ['AI Agent', 'LangChain', '설계'], likes: 456, views: 12400, regDate: '2026-04-04', img: 'https://images.unsplash.com/photo-1555255707-c07966088b7b?w=480&h=280&fit=crop' },

    /* ── 유튜브 (10개) ── */
    { id: 'c11', type: 'youtube', title: '2026 웹 개발 트렌드 총정리', url: 'https://youtube.com/watch?v=a1', summary: '2026년 주목해야 할 웹 개발 트렌드를 한 영상에서 모두 정리했습니다.', tags: ['웹개발', '트렌드', '2026'], likes: 512, views: 18400, regDate: '2026-04-03', img: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=480&h=280&fit=crop' },
    { id: 'c12', type: 'youtube', title: 'n8n으로 AI 업무 자동화 완전 정복', url: 'https://youtube.com/watch?v=a2', summary: 'n8n을 활용해 반복 업무를 AI로 자동화하는 방법을 처음부터 끝까지 알려드립니다.', tags: ['n8n', '자동화', 'AI'], likes: 687, views: 23100, regDate: '2026-04-01', img: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=480&h=280&fit=crop' },
    { id: 'c13', type: 'youtube', title: '피그마 AI 기능 완벽 활용법', url: 'https://youtube.com/watch?v=a3', summary: '피그마의 AI 기능을 활용해 디자인 생산성을 10배 높이는 방법을 소개합니다.', tags: ['Figma', '디자인', 'AI'], likes: 423, views: 14200, regDate: '2026-03-27', img: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=480&h=280&fit=crop' },
    { id: 'c14', type: 'youtube', title: '연봉 협상 실전 스크립트 공개', url: 'https://youtube.com/watch?v=a4', summary: '실제로 효과 있었던 연봉 협상 스크립트와 전략을 공개합니다.', tags: ['연봉협상', '커리어', '직장인'], likes: 1240, views: 42000, regDate: '2026-03-24', img: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=480&h=280&fit=crop' },
    { id: 'c15', type: 'youtube', title: 'Claude vs GPT-4o 10라운드 실전 비교', url: 'https://youtube.com/watch?v=a5', summary: 'Claude와 GPT-4o를 10가지 실전 시나리오에서 직접 비교 테스트한 결과를 공개합니다.', tags: ['Claude', 'GPT-4o', 'LLM비교'], likes: 876, views: 31500, regDate: '2026-03-21', img: 'https://images.unsplash.com/photo-1531746790095-e5a6e0f78a1a?w=480&h=280&fit=crop' },
    { id: 'c11y', type: 'youtube', title: 'Kubernetes 입문부터 실전까지 3시간', url: 'https://youtube.com/watch?v=a6', summary: 'K8s 클러스터 구축부터 배포 파이프라인까지, 3시간 만에 마스터하는 쿠버네티스 강좌입니다.', tags: ['Kubernetes', 'DevOps', '인프라'], likes: 934, views: 28700, regDate: '2026-04-04', img: 'https://images.unsplash.com/photo-1667372393086-9d4001d51cf1?w=480&h=280&fit=crop' },
    { id: 'c12y', type: 'youtube', title: 'Notion AI로 업무 생산성 5배 올리기', url: 'https://youtube.com/watch?v=a7', summary: 'Notion의 AI 기능을 활용한 업무 자동화 및 프로젝트 관리 노하우를 공유합니다.', tags: ['Notion', '생산성', 'AI'], likes: 567, views: 19800, regDate: '2026-03-19', img: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=480&h=280&fit=crop' },
    { id: 'c13y', type: 'youtube', title: '개발자 포트폴리오 만들기 A to Z', url: 'https://youtube.com/watch?v=a8', summary: '취업 성공하는 개발자 포트폴리오 사이트를 처음부터 끝까지 만드는 과정을 보여드립니다.', tags: ['포트폴리오', '취업', '웹개발'], likes: 723, views: 24500, regDate: '2026-03-14', img: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=480&h=280&fit=crop' },
    { id: 'c14y', type: 'youtube', title: 'ChatGPT 플러그인 직접 만들기', url: 'https://youtube.com/watch?v=a9', summary: 'ChatGPT 플러그인을 직접 개발하고 배포하는 전체 과정을 라이브 코딩으로 보여드립니다.', tags: ['ChatGPT', '플러그인', '개발'], likes: 445, views: 15600, regDate: '2026-03-10', img: 'https://images.unsplash.com/photo-1676299081847-824916de030a?w=480&h=280&fit=crop' },
    { id: 'c15y', type: 'youtube', title: 'AWS 비용 절약 실전 가이드 2026', url: 'https://youtube.com/watch?v=a10', summary: 'AWS 월 비용을 50%까지 절약하는 실전 최적화 전략 7가지를 상세히 소개합니다.', tags: ['AWS', '클라우드', '비용절감'], likes: 389, views: 13200, regDate: '2026-04-06', img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=480&h=280&fit=crop' },

    /* ── 웹사이트 (10개) ── */
    { id: 'c16', type: 'website', title: 'Vercel – 최고의 프론트엔드 배포 플랫폼', url: 'https://vercel.com', summary: 'Next.js 프로젝트를 간편하게 배포할 수 있는 Vercel의 주요 기능과 사용법을 정리했습니다.', tags: ['Vercel', '배포', 'Next.js'], likes: 334, views: 9200, regDate: '2026-04-02', img: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=480&h=280&fit=crop' },
    { id: 'c17', type: 'website', title: 'shadcn/ui – 아름다운 컴포넌트 라이브러리', url: 'https://ui.shadcn.com', summary: '복사-붙여넣기 방식으로 사용하는 현대적인 UI 컴포넌트 라이브러리입니다.', tags: ['shadcn', 'UI', '컴포넌트'], likes: 445, views: 12300, regDate: '2026-03-30', img: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=480&h=280&fit=crop' },
    { id: 'c18', type: 'website', title: 'Supabase – Firebase 대안 오픈소스 BaaS', url: 'https://supabase.com', summary: '오픈소스 Firebase 대안인 Supabase로 빠르게 백엔드를 구축하는 방법을 소개합니다.', tags: ['Supabase', 'BaaS', '백엔드'], likes: 289, views: 7640, regDate: '2026-03-27', img: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=480&h=280&fit=crop' },
    { id: 'c19', type: 'website', title: 'Hugging Face – AI 모델 허브의 모든 것', url: 'https://huggingface.co', summary: 'AI 모델을 공유하고 활용하는 허깅페이스 플랫폼의 주요 기능을 소개합니다.', tags: ['HuggingFace', 'AI', '모델'], likes: 512, views: 16800, regDate: '2026-03-25', img: 'https://images.unsplash.com/photo-1655720828018-edd2daec9349?w=480&h=280&fit=crop' },
    { id: 'c20', type: 'website', title: 'Excalidraw – 손그림 스타일 화이트보드', url: 'https://excalidraw.com', summary: '팀 협업과 아이디어 정리에 최적화된 오픈소스 낙서풍 다이어그램 도구입니다.', tags: ['Excalidraw', '협업', '도구'], likes: 378, views: 10500, regDate: '2026-03-22', img: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=480&h=280&fit=crop' },
    { id: 'c16w', type: 'website', title: 'Linear – 차세대 프로젝트 관리 도구', url: 'https://linear.app', summary: '개발팀을 위한 빠르고 세련된 이슈 트래커. Jira 대안으로 급부상하고 있습니다.', tags: ['Linear', '프로젝트관리', 'PM'], likes: 367, views: 9800, regDate: '2026-04-01', img: 'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=480&h=280&fit=crop' },
    { id: 'c17w', type: 'website', title: 'Cursor – AI 네이티브 코드 에디터', url: 'https://cursor.sh', summary: 'AI가 코드를 이해하고 제안하는 차세대 IDE. VS Code 포크 기반으로 빠르게 성장 중입니다.', tags: ['Cursor', 'IDE', 'AI코딩'], likes: 623, views: 21400, regDate: '2026-03-28', img: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=480&h=280&fit=crop' },
    { id: 'c18w', type: 'website', title: 'Framer – 노코드 웹사이트 빌더', url: 'https://framer.com', summary: '디자이너와 마케터를 위한 강력한 노코드 웹사이트 빌더. 애니메이션 지원이 뛰어납니다.', tags: ['Framer', '노코드', '웹빌더'], likes: 298, views: 8120, regDate: '2026-03-17', img: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=480&h=280&fit=crop' },
    { id: 'c19w', type: 'website', title: 'Raycast – 맥 생산성 런처의 끝판왕', url: 'https://raycast.com', summary: 'Alfred를 넘어선 맥 생산성 도구. AI 통합, 확장 마켓플레이스가 강점입니다.', tags: ['Raycast', 'Mac', '생산성'], likes: 234, views: 6540, regDate: '2026-03-13', img: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=480&h=280&fit=crop' },
    { id: 'c20w', type: 'website', title: 'Posthog – 오픈소스 프로덕트 분석 도구', url: 'https://posthog.com', summary: '사용자 행동 분석, A/B 테스트, 피처 플래그를 하나의 플랫폼에서 제공합니다.', tags: ['Posthog', '분석', '데이터'], likes: 189, views: 5230, regDate: '2026-04-05', img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=480&h=280&fit=crop' }
  ];

  function chubLoad() {
    try {
      var stored = localStorage.getItem('chub_items');
      if (!stored) {
        localStorage.setItem('chub_items', JSON.stringify(CHUB_SAMPLE));
        window._chubItems = CHUB_SAMPLE.slice();
      } else {
        window._chubItems = JSON.parse(stored);
      }
    } catch (e) { window._chubItems = CHUB_SAMPLE.slice(); }
  }

  window._chubView = 'card';
  window._chubFilter = 'all';
  window._chubItems = [];

  function chubPersist() {
    try { localStorage.setItem('chub_items', JSON.stringify(window._chubItems)); } catch (e) { }
  }

  window.chubSetView = function (v) {
    window._chubView = v;
    ['card', 'list'].forEach(function (x) {
      var el = document.getElementById('chub-view-' + x);
      if (el) { el.style.background = x === v ? 'var(--accent-blue)' : 'transparent'; el.style.color = x === v ? '#fff' : 'var(--text-muted)'; }
    });
    chubRender();
  };

  window.chubSetFilter = function (type) {
    window._chubFilter = type;
    document.querySelectorAll('[data-chub-type]').forEach(function (b) {
      var a = b.dataset.chubType === type;
      b.style.background = a ? 'var(--accent-blue)' : 'transparent';
      b.style.color = a ? '#fff' : 'var(--text-secondary)';
      b.style.borderColor = a ? 'var(--accent-blue)' : 'var(--border-color)';
    });
    chubRender();
  };

  window.chubRender = function () {
    chubLoad();
    var keyword = ((document.getElementById('chub-search') || {}).value || '').toLowerCase();
    var sort = ((document.getElementById('chub-sort') || {}).value) || 'date';
    var filter = window._chubFilter || 'all';
    var list = (window._chubItems || []).filter(function (it) {
      if (filter !== 'all' && it.type !== filter) return false;
      if (keyword) { var h = (it.title + ' ' + (it.tags || []).join(' ') + ' ' + (it.summary || '') + ' ' + (it.url || '')).toLowerCase(); if (h.indexOf(keyword) < 0) return false; }
      return true;
    });
    if (sort === 'likes') list.sort(function (a, b) { return (b.likes || 0) - (a.likes || 0); });
    else if (sort === 'views') list.sort(function (a, b) { return (b.views || 0) - (a.views || 0); });
    else list.sort(function (a, b) { return new Date(b.regDate || 0) - new Date(a.regDate || 0); });

    var cnt = document.getElementById('chub-count');
    if (cnt) cnt.textContent = '총 ' + list.length + '개의 콘텐츠';

    var grid = document.getElementById('chub-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (!list.length) {
      grid.innerHTML = '<div style="padding:80px;text-align:center;color:var(--text-muted)"><div style="font-size:48px;margin-bottom:12px">📭</div><div style="font-size:14px;font-weight:700">콘텐츠가 없습니다</div><div style="font-size:12px;margin-top:4px">새 콘텐츠를 추가하거나 필터를 변경해보세요</div></div>';
      return;
    }

    var typeIcon = { news: '📰', blog: '✏️', youtube: '▶️', website: '🌐' };
    var typeColor = { news: '#3b82f6', blog: '#10b981', youtube: '#ef4444', website: '#8b5cf6' };

    if (window._chubView === 'card') {
      grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;padding:4px';
      list.forEach(function (it) {
        var card = document.createElement('div');
        card.style.cssText = 'border-radius:14px;background:var(--bg-secondary);border:1.5px solid var(--border-color);cursor:pointer;transition:all .18s;display:flex;flex-direction:column;overflow:hidden';
        card.onmouseover = function () { this.style.boxShadow = '0 8px 28px rgba(0,0,0,.12)'; this.style.borderColor = typeColor[it.type] || '#3b82f6'; this.style.transform = 'translateY(-2px)'; };
        card.onmouseout = function () { this.style.boxShadow = ''; this.style.borderColor = 'var(--border-color)'; this.style.transform = ''; };
        card.onclick = function () { chubOpenDetail(it.id); };
        var imgHtml = it.img ? '<div style="width:100%;aspect-ratio:16/9;overflow:hidden;background:var(--bg-tertiary)"><img src="' + it.img + '" alt="" style="width:100%;height:100%;object-fit:cover;transition:transform .3s" onmouseover="this.style.transform=\'scale(1.05)\'" onmouseout="this.style.transform=\'\'" loading="lazy"></div>' : '';
        card.innerHTML = imgHtml +
          '<div style="padding:14px;display:flex;flex-direction:column;gap:8px">' +
          '<div style="display:flex;align-items:center;gap:8px">' +
          '<span style="font-size:14px">' + (typeIcon[it.type] || '📄') + '</span>' +
          '<span style="font-size:10px;font-weight:800;padding:2px 8px;border-radius:8px;color:#fff;background:' + (typeColor[it.type] || '#3b82f6') + '">' + it.type + '</span>' +
          '</div>' +
          '<div style="font-size:13.5px;font-weight:700;color:var(--text-primary);line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">' + it.title + '</div>' +
          '<div style="font-size:11.5px;color:var(--text-muted);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">' + (it.summary || '') + '</div>' +
          '<div style="display:flex;flex-wrap:wrap;gap:4px">' + (it.tags || []).slice(0, 3).map(function (t) { return '<span style="padding:2px 8px;border-radius:8px;font-size:10px;font-weight:600;background:rgba(59,130,246,.1);color:#3b82f6">#' + t + '</span>'; }).join('') + '</div>' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px">' +
          '<div style="display:flex;gap:10px">' +
          '<span style="font-size:11px;color:var(--text-muted)">♥ ' + (it.likes || 0) + '</span>' +
          '<span style="font-size:11px;color:var(--text-muted)">👁 ' + (it.views || 0) + '</span>' +
          '</div>' +
          '<span style="font-size:10.5px;color:var(--text-muted)">' + (it.regDate || '') + '</span></div></div>';
        grid.appendChild(card);
      });
    } else {
      grid.style.cssText = 'display:flex;flex-direction:column;gap:8px;padding:4px';
      list.forEach(function (it) {
        var row = document.createElement('div');
        var hasThumbnail = !!it.img;
        row.style.cssText = 'display:grid;grid-template-columns:' + (hasThumbnail ? '64px ' : '') + '40px 1fr auto;gap:12px;padding:12px 16px;border-radius:12px;background:var(--bg-secondary);border:1.5px solid var(--border-color);cursor:pointer;transition:all .15s;align-items:center';
        row.onmouseover = function () { this.style.borderColor = typeColor[it.type] || '#3b82f6'; this.style.background = 'var(--bg-tertiary)'; };
        row.onmouseout = function () { this.style.borderColor = 'var(--border-color)'; this.style.background = 'var(--bg-secondary)'; };
        row.onclick = function () { chubOpenDetail(it.id); };
        var thumbHtml = hasThumbnail ? '<div style="width:64px;height:44px;border-radius:8px;overflow:hidden;background:var(--bg-tertiary)"><img src="' + it.img + '" style="width:100%;height:100%;object-fit:cover" loading="lazy"></div>' : '';
        row.innerHTML = thumbHtml +
          '<div style="text-align:center;font-size:18px">' + (typeIcon[it.type] || '📄') + '</div>' +
          '<div style="min-width:0">' +
          '<div style="font-size:13px;font-weight:700;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + it.title + '</div>' +
          '<div style="font-size:11px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + (it.summary || '') + '</div>' +
          '</div>' +
          '<div style="text-align:right;white-space:nowrap">' +
          '<div style="font-size:10.5px;color:var(--text-muted)">♥ ' + (it.likes || 0) + ' &nbsp; 👁 ' + (it.views || 0) + '</div>' +
          '<div style="font-size:10px;color:var(--text-muted)">' + (it.regDate || '') + '</div>' +
          '</div>';
        grid.appendChild(row);
      });
    }
  };

  /* ── 이미지 처리 헬퍼 ── */
  window._chubPendingImg = '';

  function _chubShowPreview(src) {
    window._chubPendingImg = src || '';
    var wrap = document.getElementById('chub-img-preview');
    var img = document.getElementById('chub-img-preview-img');
    var urlInput = document.getElementById('chub-img-url');
    if (src) {
      if (img) img.src = src;
      if (wrap) wrap.style.display = 'block';
      if (urlInput && !src.startsWith('data:')) urlInput.value = src;
    } else {
      if (wrap) wrap.style.display = 'none';
      if (img) img.src = '';
      if (urlInput) urlInput.value = '';
    }
  }

  window.chubHandleImageFile = function (input) {
    if (!input.files || !input.files[0]) return;
    var file = input.files[0];
    if (file.size > 2 * 1024 * 1024) {
      if (typeof showToast === 'function') showToast('warn', '이미지 크기는 2MB 이하로 제한됩니다');
      input.value = '';
      return;
    }
    var reader = new FileReader();
    reader.onload = function (e) { _chubShowPreview(e.target.result); };
    reader.readAsDataURL(file);
  };

  window.chubHandleImageUrl = function (url) {
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      _chubShowPreview(url);
    }
  };

  window.chubClearImage = function () {
    _chubShowPreview('');
    var fileInput = document.getElementById('chub-img-file');
    if (fileInput) fileInput.value = '';
  };

  window.chubOpenDetail = function (id) {
    chubLoad();
    var it = (window._chubItems || []).find(function (x) { return x.id === id; });
    if (!it) return;
    it.views = (it.views || 0) + 1;
    chubPersist();
    var modal = document.getElementById('chubDetailModal');
    if (!modal) return;
    var body = document.getElementById('chubDetailBody');
    if (body) {
      var typeIcon = { news: '📰', blog: '✏️', youtube: '▶️', website: '🌐' };
      var typeColor = { news: '#3b82f6', blog: '#10b981', youtube: '#ef4444', website: '#8b5cf6' };
      var detailImg = it.img ? '<div style="width:100%;aspect-ratio:16/9;border-radius:12px;overflow:hidden;margin-bottom:16px;background:var(--bg-tertiary)"><img src="' + it.img + '" style="width:100%;height:100%;object-fit:cover"></div>' : '';
      body.innerHTML =
        /* 상단 닫기 + 액션 버튼 */
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">' +
        '<div style="display:flex;align-items:center;gap:8px">' +
        '<span style="font-size:20px">' + (typeIcon[it.type] || '📄') + '</span>' +
        '<span style="font-size:11px;font-weight:800;padding:3px 10px;border-radius:8px;color:#fff;background:' + (typeColor[it.type] || '#3b82f6') + '">' + it.type.toUpperCase() + '</span>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:6px">' +
        '<button onclick="chubEditContent(\'' + it.id + '\')" style="padding:6px 14px;border-radius:8px;border:1.5px solid var(--border-color);background:var(--bg-tertiary);color:var(--text-secondary);font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:4px" title="수정"><i data-lucide="edit-3" style="width:13px;height:13px"></i> 수정</button>' +
        '<button onclick="chubDeleteContent(\'' + it.id + '\')" style="padding:6px 14px;border-radius:8px;border:1.5px solid rgba(239,68,68,.3);background:rgba(239,68,68,.06);color:#ef4444;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:4px" title="삭제"><i data-lucide="trash-2" style="width:13px;height:13px"></i> 삭제</button>' +
        '<button onclick="chubCloseDetail()" style="padding:6px 10px;border-radius:8px;border:1.5px solid var(--border-color);background:transparent;color:var(--text-muted);font-size:16px;cursor:pointer;line-height:1" title="닫기">✕</button>' +
        '</div></div>' +

        /* 이미지 */
        detailImg +

        /* 제목 */
        '<div style="font-size:20px;font-weight:800;color:var(--text-primary);line-height:1.3;margin-bottom:10px">' + (it.title || '') + '</div>' +

        /* 요약 */
        '<div style="font-size:13.5px;color:var(--text-secondary);line-height:1.7;margin-bottom:14px">' + (it.summary || '') + '</div>' +

        /* 태그 */
        '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px">' + (it.tags || []).map(function (t) { return '<span style="padding:3px 10px;border-radius:10px;font-size:11.5px;font-weight:700;background:rgba(59,130,246,.1);color:#3b82f6">#' + t + '</span>'; }).join('') + '</div>' +

        /* 관리 정보 테이블 */
        '<div style="border:1.5px solid var(--border-color);border-radius:12px;overflow:hidden;margin-bottom:16px">' +
        '<table style="width:100%;border-collapse:collapse;font-size:13px">' +
        '<tr style="border-bottom:1px solid var(--border-color)"><td style="padding:10px 14px;font-weight:700;color:var(--text-muted);background:var(--bg-tertiary);width:100px">종류</td><td style="padding:10px 14px;color:var(--text-primary)">' + (typeIcon[it.type] || '') + ' ' + (it.type || '').toUpperCase() + '</td></tr>' +
        '<tr style="border-bottom:1px solid var(--border-color)"><td style="padding:10px 14px;font-weight:700;color:var(--text-muted);background:var(--bg-tertiary)">등록일</td><td style="padding:10px 14px;color:var(--text-primary)">' + (it.regDate || '-') + '</td></tr>' +
        '<tr style="border-bottom:1px solid var(--border-color)"><td style="padding:10px 14px;font-weight:700;color:var(--text-muted);background:var(--bg-tertiary)">URL</td><td style="padding:10px 14px"><a href="' + (it.url || '#') + '" target="_blank" style="color:var(--accent-blue);text-decoration:none;word-break:break-all">' + (it.url || '-') + '</a></td></tr>' +
        '<tr style="border-bottom:1px solid var(--border-color)"><td style="padding:10px 14px;font-weight:700;color:var(--text-muted);background:var(--bg-tertiary)">조회수</td><td style="padding:10px 14px;color:var(--text-primary)">👁 ' + (it.views || 0) + '</td></tr>' +
        '<tr><td style="padding:10px 14px;font-weight:700;color:var(--text-muted);background:var(--bg-tertiary)">좋아요</td><td style="padding:10px 14px;color:var(--text-primary)">♥ ' + (it.likes || 0) + '</td></tr>' +
        '</table></div>' +

        /* 액션 버튼 하단 */
        '<div style="display:flex;gap:10px">' +
        '<a href="' + (it.url || '#') + '" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;padding:10px 20px;border-radius:10px;background:var(--accent-blue);color:#fff;text-decoration:none;font-size:13px;font-weight:700">🔗 원문 보기</a>' +
        '<button onclick="chubToggleLike(\'' + it.id + '\')" style="padding:10px 20px;border-radius:10px;border:1.5px solid var(--border-color);background:transparent;color:var(--text-secondary);font-size:13px;font-weight:700;cursor:pointer">♥ 좋아요</button>' +
        '</div>';
    }
    modal.style.display = 'flex';
    if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 30);
  };

  window.chubCloseDetail = function () {
    var m = document.getElementById('chubDetailModal'); if (m) m.style.display = 'none';
  };

  /* ── 콘텐츠 삭제 ── */
  window.chubDeleteContent = function (id) {
    if (!confirm('이 콘텐츠를 삭제하시겠습니까?')) return;
    chubLoad();
    window._chubItems = (window._chubItems || []).filter(function (x) { return x.id !== id; });
    chubPersist();
    chubCloseDetail();
    chubRender();
    if (typeof showToast === 'function') showToast('info', '콘텐츠가 삭제되었습니다');
  };

  /* ── 콘텐츠 수정 (모달 전환) ── */
  window._chubEditId = null;
  window.chubEditContent = function (id) {
    chubLoad();
    var it = (window._chubItems || []).find(function (x) { return x.id === id; });
    if (!it) return;
    window._chubEditId = id;
    chubCloseDetail();
    /* 추가 모달 재활용 */
    var typeEl = document.getElementById('chub-type'); if (typeEl) typeEl.value = it.type || 'website';
    var titleEl = document.getElementById('chub-title'); if (titleEl) titleEl.value = it.title || '';
    var urlEl = document.getElementById('chub-url'); if (urlEl) urlEl.value = it.url || '';
    var summaryEl = document.getElementById('chub-summary') || document.getElementById('chub-desc');
    if (summaryEl) summaryEl.value = it.summary || '';
    /* 이미지 복원 */
    _chubShowPreview(it.img || '');
    /* 좋아요/조회수 복원 */
    var likesEl = document.getElementById('chub-likes'); if (likesEl) likesEl.value = it.likes || 0;
    var viewsEl = document.getElementById('chub-views'); if (viewsEl) viewsEl.value = it.views || 0;
    /* 태그 복원 */
    if (typeof window._tagReset === 'function') window._tagReset('chub');
    var tagsHidden = document.getElementById('chub-tags');
    if (tagsHidden) tagsHidden.value = (it.tags || []).join(',');
    var tagsList = document.getElementById('chub-tags-list');
    if (tagsList) {
      tagsList.innerHTML = (it.tags || []).map(function (t) {
        return '<span style="display:inline-flex;align-items:center;gap:3px;padding:3px 10px;border-radius:8px;font-size:12px;font-weight:700;background:rgba(59,130,246,.12);color:#3b82f6;cursor:pointer" onclick="this.remove();var h=document.getElementById(\'chub-tags\');if(h){var a=h.value.split(\',\').filter(function(x){return x&&x!==\'' + t + '\'});h.value=a.join(\',\')}">' + t + ' <span style="font-size:14px;opacity:.6">&times;</span></span>';
      }).join('');
    }
    /* 모달 제목 변경 */
    var modalTitle = document.querySelector('#chubAddModal div[style*="font-size:16px"]');
    if (modalTitle) modalTitle.textContent = '콘텐츠 수정';
    var m = document.getElementById('chubAddModal');
    if (m) m.style.display = 'flex';
  };

  window.chubToggleLike = function (id) {
    chubLoad();
    var it = (window._chubItems || []).find(function (x) { return x.id === id; });
    if (it) {
      it.likes = (it.likes || 0) + 1;
      chubPersist();
      /* 상세보기가 열려있으면 갱신 */
      var modal = document.getElementById('chubDetailModal');
      if (modal && modal.style.display === 'flex') chubOpenDetail(id);
      chubRender();
    }
  };

  window.chubSaveContent = function () {
    var url = (document.getElementById('chub-url') || {}).value || '';
    var title = (document.getElementById('chub-title') || {}).value || '';
    var type = (document.getElementById('chub-type') || {}).value || 'website';
    /* 입력 중인 태그가 있다면 commit */
    var chubInp = document.getElementById('chub-tags-input');
    if (chubInp && chubInp.value.trim() && typeof window._tagCommit === 'function') window._tagCommit('chub', chubInp);
    var tags = (document.getElementById('chub-tags') || {}).value || '';
    var desc = (document.getElementById('chub-summary') || document.getElementById('chub-desc') || {}).value || '';
    if (!title) { if (typeof showToast === 'function') showToast('warn', '제목을 입력하세요'); return; }
    chubLoad();

    var imgVal = window._chubPendingImg || '';
    var likesVal = parseInt((document.getElementById('chub-likes') || {}).value) || 0;
    var viewsVal = parseInt((document.getElementById('chub-views') || {}).value) || 0;

    if (window._chubEditId) {
      /* 수정 모드 */
      window._chubItems = (window._chubItems || []).map(function (it) {
        if (it.id !== window._chubEditId) return it;
        return Object.assign({}, it, {
          type: type, title: title, url: url, summary: desc, img: imgVal,
          likes: likesVal, views: viewsVal,
          tags: tags.split(',').map(function (t) { return t.trim(); }).filter(Boolean)
        });
      });
      if (typeof showToast === 'function') showToast('success', '콘텐츠가 수정되었습니다');
      window._chubEditId = null;
    } else {
      /* 신규 추가 */
      window._chubItems.unshift({
        id: 'c' + Date.now(), type: type, title: title, url: url, img: imgVal,
        summary: desc, tags: tags.split(',').map(function (t) { return t.trim(); }).filter(Boolean),
        likes: likesVal, views: viewsVal, regDate: new Date().toISOString().split('T')[0]
      });
      if (typeof showToast === 'function') showToast('success', '콘텐츠가 등록되었습니다');
    }
    window._chubPendingImg = '';
    chubPersist();
    var m = document.getElementById('chubAddModal'); if (m) m.style.display = 'none';
    /* 태그 초기화 */
    if (typeof window._tagReset === 'function') window._tagReset('chub');
    chubRender();
  };

  /* chubSave 는 chubSaveContent 의 별칭 (HTML에서 호출) */
  window.chubSave = window.chubSaveContent;

  /* chubOpenAddModal – 모달 열기 + 태그 초기화 */
  window.chubOpenAddModal = function () {
    window._chubEditId = null;
    ['chub-title', 'chub-url', 'chub-summary', 'chub-desc'].forEach(function (id) {
      var el = document.getElementById(id); if (el) el.value = '';
    });
    /* 좋아요/조회수 초기화 */
    var likesEl = document.getElementById('chub-likes'); if (likesEl) likesEl.value = 0;
    var viewsEl = document.getElementById('chub-views'); if (viewsEl) viewsEl.value = 0;
    /* 이미지 초기화 */
    _chubShowPreview('');
    var fileInput = document.getElementById('chub-img-file');
    if (fileInput) fileInput.value = '';
    var typeEl = document.getElementById('chub-type'); if (typeEl) typeEl.value = 'website';
    /* 모달 제목 복원 */
    var modalTitle = document.querySelector('#chubAddModal div[style*="font-size:16px"]');
    if (modalTitle) modalTitle.textContent = '콘텐츠 추가';
    var m = document.getElementById('chubAddModal');
    if (m) { m.style.display = 'flex'; }
    setTimeout(function () {
      if (typeof window._tagReset === 'function') window._tagReset('chub');
    }, 50);
  };

  /* chubCloseModal – 모달 숨기기 + 태그 초기화 */
  window.chubCloseModal = function () {
    var m = document.getElementById('chubAddModal');
    if (m) m.style.display = 'none';
    window._chubEditId = null;
    if (typeof window._tagReset === 'function') window._tagReset('chub');
  };


  var _prev_chubHpPage = window.showHomepagePage;
  window.showHomepagePage = function (pageId, navEl) {
    if (typeof _prev_chubHpPage === 'function') _prev_chubHpPage(pageId, navEl);
    if (pageId === 'hp-content') setTimeout(function () { if (typeof chubRender === 'function') chubRender(); if (typeof refreshIcons === 'function') refreshIcons(); }, 80);
    if (pageId === 'hp-media') setTimeout(function () { if (typeof medRender === 'function') medRender(); if (typeof refreshIcons === 'function') refreshIcons(); }, 100);
  };

})();

/* ══════════════════════════════════════════════
   showPage 후킹 – homepage 진입/이탈 시 사이드바 전환
══════════════════════════════════════════════ */
(function () {
  // showPage가 완전히 로드된 이후에 후킹
  function _hookShowPage() {
    var _origSP = window.showPage;
    if (typeof _origSP !== 'function') return;

    window.showPage = function (pid, navEl) {
      _origSP.call(window, pid, navEl);
      if (pid === 'homepage') {
        // 홈페이지 모드 진입
        setTimeout(function () {
          if (typeof enterHomepageMode === 'function') enterHomepageMode();
        }, 30);
      } else {
        // 다른 페이지로 이동 시 homepageNav 숨기고 mainNav 복원
        var mainNav = document.getElementById('mainNav');
        var homepageNav = document.getElementById('homepageNav');
        var acctNav = document.getElementById('acctNav');
        if (homepageNav && homepageNav.style.display !== 'none') {
          if (homepageNav) homepageNav.style.display = 'none';
          if (mainNav) mainNav.style.display = 'block';
        }
      }
    };
  }

  // DOMContentLoaded 이후 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _hookShowPage);
  } else {
    _hookShowPage();
  }
})();

/* ══════════════════════════════════════════════
   게시판 관리 – 렌더 & 저장
   저장소: localStorage 'board_items'
══════════════════════════════════════════════ */
(function () {

  var BOARD_CAT = 'all';
  var BOARD_SAMPLE = [
    // 공지사항 (5개)
    { id: 'b01', cat: 'notice', title: '홈페이지 오픈 안내', content: '저희 홈페이지가 새롭게 오픈했습니다. 많은 관심 부탁드립니다.', author: '관리자', regDate: '2026-04-01', views: 284 },
    { id: 'b02', cat: 'notice', title: '개인정보처리방침 개정 안내', content: '개인정보처리방침이 2026년 4월 1일부로 개정되었습니다.', author: '관리자', regDate: '2026-03-28', views: 156 },
    { id: 'b03', cat: 'notice', title: '운영시간 변경 안내', content: '2026년 5월 1일부터 고객센터 운영시간이 변경됩니다. 평일 09:00 ~ 18:00', author: '관리자', regDate: '2026-03-25', views: 203 },
    { id: 'b04', cat: 'notice', title: '서비스 점검 안내 (4/15)', content: '4월 15일 새벽 2시~4시 시스템 점검이 예정되어 있습니다.', author: '관리자', regDate: '2026-04-05', views: 311 },
    { id: 'b05', cat: 'notice', title: '이용약관 개정 공지', content: '이용약관 제3조 및 제5조가 2026년 4월 20일부로 개정됩니다.', author: '관리자', regDate: '2026-04-06', views: 178 },
    // 뉴스 (5개)
    { id: 'b06', cat: 'news', title: '2026 상반기 신제품 출시 예정', content: '2026년 상반기 내 다양한 신제품이 출시될 예정입니다.', author: '홍보팀', regDate: '2026-04-02', views: 421 },
    { id: 'b07', cat: 'news', title: '업계 최우수 기업상 수상', content: '이번 업계 시상식에서 최우수 기업상을 수상했습니다.', author: '홍보팀', regDate: '2026-03-30', views: 338 },
    { id: 'b08', cat: 'news', title: '국내 최대 인테리어 박람회 참가', content: '4월 20일~23일 COEX에서 열리는 인테리어 박람회에 참가합니다.', author: '홍보팀', regDate: '2026-04-03', views: 512 },
    { id: 'b09', cat: 'news', title: '신규 가맹점 100호점 달성', content: '전국 신규 가맹점이 100호점을 돌파했습니다. 감사합니다.', author: '홍보팀', regDate: '2026-03-20', views: 689 },
    { id: 'b10', cat: 'news', title: '친환경 소재 제품 라인업 확장', content: '환경을 생각하는 친환경 소재 제품 라인업을 새롭게 확장합니다.', author: '홍보팀', regDate: '2026-04-07', views: 274 },
    // 자유게시판 (5개)
    { id: 'b11', cat: 'free', title: '봄 맞이 이벤트 참여하세요!', content: '봄을 맞아 다양한 이벤트를 준비했습니다. 많은 참여 바랍니다.', author: '이벤트팀', regDate: '2026-04-03', views: 198 },
    { id: 'b12', cat: 'free', title: '제품 사용 후기 공유해요', content: '블라인드 설치 후 정말 만족스럽습니다. 여러분의 후기도 공유해주세요!', author: '김지은', regDate: '2026-03-29', views: 145 },
    { id: 'b13', cat: 'free', title: '인테리어 팁 공유 (커튼 코디)', content: '거실 커튼과 소파 색상 매칭 팁을 공유합니다.', author: '박소영', regDate: '2026-04-01', views: 233 },
    { id: 'b14', cat: 'free', title: '시공 전 꼭 확인해야 할 사항', content: '블라인드 및 커튼 시공 전 창문 규격 측정 방법을 알려드립니다.', author: '이현수', regDate: '2026-03-27', views: 312 },
    { id: 'b15', cat: 'free', title: '봄 신상 제품 어떤가요?', content: '올봄 신상 롤스크린 색상이 정말 예쁘네요. 구매 고민 중입니다.', author: '정다운', regDate: '2026-04-06', views: 89 },
    // Q&A (5개)
    { id: 'b16', cat: 'qna', title: '블라인드 설치 높이는 어떻게 측정하나요?', content: '창문 안쪽 높이를 기준으로 측정하시면 됩니다. 자세한 내용은 가이드를 참고해 주세요.', author: '고객센터', regDate: '2026-04-04', views: 412 },
    { id: 'b17', cat: 'qna', title: 'A/S 신청은 어디서 하나요?', content: '홈페이지 문의하기 또는 고객센터 전화(010-6381-2233)로 신청 가능합니다.', author: '고객센터', regDate: '2026-04-02', views: 387 },
    { id: 'b18', cat: 'qna', title: '전동 블라인드 리모컨 분실 시 재구매 방법', content: '고객센터로 문의주시면 동일 모델 리모컨 구매를 안내해 드립니다.', author: '고객센터', regDate: '2026-03-31', views: 256 },
    { id: 'b19', cat: 'qna', title: '커튼 원단 세탁 방법 문의', content: '대부분의 원단은 드라이클리닝을 권장합니다. 제품별 세탁 라벨을 확인해 주세요.', author: '고객센터', regDate: '2026-03-28', views: 189 },
    { id: 'b20', cat: 'qna', title: '시공 후 하자 발생 시 어떻게 하나요?', content: '시공 완료 후 1년 이내 하자는 무상 A/S가 제공됩니다. 고객센터로 연락주세요.', author: '고객센터', regDate: '2026-04-05', views: 341 },
    // FAQ (5개)
    { id: 'b21', cat: 'faq', title: '방문 견적은 무료인가요?', content: '네, 방문 견적은 완전 무료입니다. 전화 또는 홈페이지로 신청하시면 됩니다.', author: '관리자', regDate: '2026-01-10', views: 892 },
    { id: 'b22', cat: 'faq', title: '설치까지 걸리는 기간은 얼마나 되나요?', content: '견적 확정 후 통상 3~7 영업일 이내에 설치가 완료됩니다.', author: '관리자', regDate: '2026-01-10', views: 754 },
    { id: 'b23', cat: 'faq', title: '할부 구매가 가능한가요?', content: '카드 무이자 할부(최대 12개월)가 가능합니다. 담당자에게 문의해 주세요.', author: '관리자', regDate: '2026-01-12', views: 623 },
    { id: 'b24', cat: 'faq', title: '맞춤 제작도 가능한가요?', content: '네, 모든 제품은 창문 규격에 맞춰 100% 맞춤 제작됩니다.', author: '관리자', regDate: '2026-01-15', views: 987 },
    { id: 'b25', cat: 'faq', title: '보증 기간은 얼마나 되나요?', content: '제품 및 시공에 대해 1년 품질 보증이 제공됩니다.', author: '관리자', regDate: '2026-01-15', views: 541 },
    // 가맹점 신청 (5개)
    { id: 'b26', cat: 'franchise', title: '서울 강남 지역 가맹 문의', content: '강남구 일대 가맹점 운영에 관심이 있습니다. 수익 구조와 초기 비용이 궁금합니다.', author: '김민준', regDate: '2026-04-07', views: 42 },
    { id: 'b27', cat: 'franchise', title: '부산 해운대 지역 가맹 신청', content: '해운대 상권에서 인테리어 전문점을 운영 중입니다. 가맹 절차를 알고 싶습니다.', author: '이수진', regDate: '2026-04-05', views: 67 },
    { id: 'b28', cat: 'franchise', title: '경기도 분당 가맹점 문의', content: '분당 지역에서 가맹점 개설을 희망합니다. 교육 지원이 어떻게 되는지 궁금합니다.', author: '박준혁', regDate: '2026-04-03', views: 55 },
    { id: 'b29', cat: 'franchise', title: '인천 송도 신규 가맹 문의', content: '인천 송도국제도시 내 가맹점 개설에 관심이 있습니다. 본사 지원 사항을 알려주세요.', author: '최유리', regDate: '2026-04-01', views: 48 },
    { id: 'b30', cat: 'franchise', title: '대구 수성구 가맹 신청서 제출', content: '수성구에서 가맹점 운영 희망합니다. 필요 서류 및 계약 절차를 안내해 주시기 바랍니다.', author: '정호준', regDate: '2026-03-30', views: 73 }
  ];

  function boardLoad() {
    try {
      var stored = JSON.parse(localStorage.getItem('board_items') || 'null');
      return stored || BOARD_SAMPLE;
    } catch (e) { return BOARD_SAMPLE; }
  }
  function boardPersist(items) {
    try { localStorage.setItem('board_items', JSON.stringify(items)); } catch (e) { }
  }

  var CAT_MAP = { all: '전체', notice: '📢 공지사항', news: '📰 뉴스', free: '💬 자유게시판', qna: '❓ Q&A', faq: '📋 FAQ', franchise: '🏪 가맹점 신청' };
  var CAT_COLOR = { notice: '#ef4444', news: '#4f6ef7', free: '#f59e0b', qna: '#8b5cf6', faq: '#06b6d4', franchise: '#ec4899' };

  window.boardSetCat = function (cat) {
    BOARD_CAT = cat;
    document.querySelectorAll('[data-board-cat]').forEach(function (b) {
      var isActive = b.dataset.boardCat === cat;
      b.style.background = isActive ? '#22c55e' : 'transparent';
      b.style.color = isActive ? '#fff' : 'var(--text-secondary)';
      b.style.borderColor = isActive ? '#22c55e' : 'var(--border-color)';
    });
    boardRender();
  };

  window.boardRender = function () {
    var items = boardLoad();
    if (BOARD_CAT !== 'all') items = items.filter(function (i) { return i.cat === BOARD_CAT; });
    var cnt = document.getElementById('board-count');
    if (cnt) cnt.textContent = '총 ' + items.length + '건';
    var list = document.getElementById('board-list');
    if (!list) return;
    if (!items.length) {
      list.innerHTML = '<div style="text-align:center;padding:80px 20px;color:var(--text-muted)"><div style="font-size:40px;margin-bottom:12px">📋</div><div style="font-size:14px;font-weight:700">등록된 게시글이 없습니다</div></div>';
      return;
    }
    list.innerHTML = '<table style="width:100%;border-collapse:collapse;table-layout:fixed">' +
      '<thead><tr style="border-bottom:2px solid var(--border-color)">' +
      '<th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:var(--text-muted);width:100px;white-space:nowrap">카테고리</th>' +
      '<th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:var(--text-muted)">제목</th>' +
      '<th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;color:var(--text-muted);width:70px;white-space:nowrap">작성자</th>' +
      '<th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;color:var(--text-muted);width:90px;white-space:nowrap">날짜</th>' +
      '<th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;color:var(--text-muted);width:50px;white-space:nowrap">조회</th>' +
      '</tr></thead><tbody>' +
      items.map(function (it) {
        var color = CAT_COLOR[it.cat] || '#94a3b8';
        var shortLabel = { notice: '📢 공지', news: '📰 뉴스', free: '💬 자유', qna: '❓ Q&A', faq: '📋 FAQ', franchise: '🏪 가맹' };
        var label = shortLabel[it.cat] || (CAT_MAP[it.cat] || it.cat);
        return '<tr style="border-bottom:1px solid var(--border-color);cursor:pointer;transition:background .12s" onmouseover="this.style.background=\'var(--bg-tertiary)\'" onmouseout="this.style.background=\'\'' + '" ondblclick="boardViewDetail(\'' + it.id + '\')">' +
          '<td style="padding:10px 12px;text-align:left;white-space:nowrap;overflow:hidden"><span style="padding:3px 7px;border-radius:8px;font-size:10px;font-weight:700;background:' + color + '18;color:' + color + ';white-space:nowrap">' + label + '</span></td>' +
          '<td style="padding:10px 12px;font-size:13.5px;font-weight:600;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + it.title + '</td>' +
          '<td style="padding:10px 12px;text-align:center;font-size:12px;color:var(--text-muted);white-space:nowrap">' + (it.author || '-') + '</td>' +
          '<td style="padding:10px 12px;text-align:center;font-size:12px;color:var(--text-muted);white-space:nowrap">' + (it.regDate || '') + '</td>' +
          '<td style="padding:10px 12px;text-align:center;font-size:12px;color:var(--text-muted);white-space:nowrap">' + (it.views || 0) + '</td>' +
          '</tr>';
      }).join('') + '</tbody></table>';
  };

  var _bdCurrentId = null;

  window.boardViewDetail = function (id) {
    var items = boardLoad();
    var it = null;
    for (var i = 0; i < items.length; i++) { if (items[i].id === id) { it = items[i]; break; } }
    if (!it) return;
    _bdCurrentId = id;
    var color = CAT_COLOR[it.cat] || '#94a3b8';
    var badge = document.getElementById('bd-cat-badge');
    if (badge) { badge.textContent = CAT_MAP[it.cat] || it.cat; badge.style.background = color + '18'; badge.style.color = color; }
    var s = function (elId, val) { var el = document.getElementById(elId); if (el) el.textContent = val || ''; };
    s('bd-title', it.title);
    s('bd-author', it.author || '-');
    s('bd-date', it.regDate || '-');
    s('bd-views', it.views || 0);
    s('bd-content', it.content || '내용이 없습니다.');
    it.views = (it.views || 0) + 1;
    boardPersist(items);
    var m = document.getElementById('boardDetailModal');
    if (m) m.style.display = 'flex';
  };

  window.boardDeleteCurrent = function () {
    if (!_bdCurrentId) return;
    if (!confirm('이 게시글을 삭제하시겠습니까?')) return;
    var items = boardLoad().filter(function (i) { return i.id !== _bdCurrentId; });
    boardPersist(items);
    _bdCurrentId = null;
    document.getElementById('boardDetailModal').style.display = 'none';
    boardRender();
    if (typeof showToast === 'function') showToast('success', '삭제되었습니다');
  };


  window.boardOpenAddModal = function () {
    ['board-title', 'board-content'].forEach(function (id) { var el = document.getElementById(id); if (el) el.value = ''; });
    var cat = document.getElementById('board-cat'); if (cat) cat.value = 'notice';
    var m = document.getElementById('boardAddModal'); if (m) { m.style.display = 'flex'; }
  };

  window.boardSave = function () {
    var title = (document.getElementById('board-title') || {}).value || '';
    var content = (document.getElementById('board-content') || {}).value || '';
    var cat = (document.getElementById('board-cat') || {}).value || 'notice';
    if (!title) { if (typeof showToast === 'function') showToast('warn', '제목을 입력하세요'); return; }
    var items = boardLoad();
    items.unshift({
      id: 'brd' + Date.now(), cat: cat, title: title, content: content,
      author: (window.WS && WS.currentUser) ? WS.currentUser.name : '관리자',
      regDate: new Date().toISOString().split('T')[0], views: 0
    });
    boardPersist(items);
    var m = document.getElementById('boardAddModal'); if (m) m.style.display = 'none';
    boardRender();
    if (typeof showToast === 'function') showToast('success', '게시글이 등록되었습니다');
  };

  /* hp-board 진입 시 자동 렌더 */
  var _prev_boardHpPage = window.showHomepagePage;
  window.showHomepagePage = function (pageId, navEl) {
    if (typeof _prev_boardHpPage === 'function') _prev_boardHpPage(pageId, navEl);
    if (pageId === 'hp-board') setTimeout(function () { boardRender(); if (typeof refreshIcons === 'function') refreshIcons(); }, 80);
  };

})();

/* ══════════════════════════════════════════════
   메인메뉴 등록 함수 (기본설정 카드 ↔ 메뉴등록 페이지 연동)
══════════════════════════════════════════════ */
(function () {

  var _hpMenuItems = [];  // 현재 메모리 상태 (string[])

  /* ── 공통 저장소 키: hp_mainmenu {menus:[...], settings:{...}} ── */
  function _hpMenuLoad() {
    _hpMenuItems = [];
    try {
      // 1순위: hp_mainmenu (메뉴등록 페이지의 저장소)
      var raw1 = localStorage.getItem('hp_mainmenu');
      if (raw1) {
        var d = JSON.parse(raw1);
        if (Array.isArray(d.menus) && d.menus.length > 0) {
          _hpMenuItems = d.menus.map(function (m) { return typeof m === 'string' ? m : (m.name || m.label || ''); }).filter(Boolean);
          return;
        }
      }
      // 2순위: hp_menu_items (기본설정 카드의 이전 저장소)
      var raw2 = localStorage.getItem('hp_menu_items');
      if (raw2) {
        var arr = JSON.parse(raw2);
        if (Array.isArray(arr) && arr.length > 0) {
          _hpMenuItems = arr.map(function (m) { return typeof m === 'string' ? m : (m.name || m.label || ''); }).filter(Boolean);
          return;
        }
      }
    } catch (e) { }
    // 기본값
    _hpMenuItems = ['홈', '회사소개', '서비스', '포트폴리오', '공지사항', '문의하기'];
  }

  function _hpMenuPersist() {
    try {
      // 두 키 모두 동기화
      var settings = _hpMenuGetSettings();
      localStorage.setItem('hp_mainmenu', JSON.stringify({ menus: _hpMenuItems, settings: settings }));
      localStorage.setItem('hp_menu_items', JSON.stringify(_hpMenuItems));
      localStorage.setItem('hp_menu_settings', JSON.stringify(settings));
    } catch (e) { }
  }

  function _hpMenuGetSettings() {
    return {
      bg: (document.getElementById('hp_menu_bg') || {}).value || '#1e293b',
      fc: (document.getElementById('hp_menu_fc') || {}).value || '#ffffff',
      fs: (document.getElementById('hp_menu_fs') || {}).value || 15,
      fw: (document.getElementById('hp_menu_fw') || {}).value || 700,
      h: (document.getElementById('hp_menu_h') || {}).value || 52,
      gap: (document.getElementById('hp_menu_gap') || {}).value || 20,
      align: (document.getElementById('hp_menu_align') || {}).value || 'center',
      opacity: (document.getElementById('hp_menu_opacity') || {}).value || 100
    };
  }

  /* ── 메뉴 스타일 설정 폼 복원 ── */
  function _hpMenuRestoreSettings() {
    try {
      var raw = localStorage.getItem('hp_menu_settings');
      if (!raw) {
        /* hp_mainmenu.settings에서도 시도 */
        var raw2 = localStorage.getItem('hp_mainmenu');
        if (raw2) {
          var d2 = JSON.parse(raw2);
          if (d2 && d2.settings) raw = JSON.stringify(d2.settings);
        }
      }
      if (!raw) return;
      var s = JSON.parse(raw);

      function _setVal(id, val) { var el = document.getElementById(id); if (el && val !== undefined && val !== null) el.value = val; }
      function _setTxt(id, val) { var el = document.getElementById(id); if (el && val !== undefined) el.textContent = val; }

      /* 배경 컬러 */
      _setVal('hp_menu_bg', s.bg);
      _setVal('hp_menu_bg_txt', s.bg);
      /* 폰트 컬러 */
      _setVal('hp_menu_fc', s.fc);
      _setVal('hp_menu_fc_txt', s.fc);
      /* 폰트 사이즈 */
      _setVal('hp_menu_fs', s.fs);
      _setTxt('hp_menu_fs_v', s.fs + 'px');
      /* 폰트 굵기 */
      if (s.fw && typeof window._hpMenuSetFw === 'function') window._hpMenuSetFw(parseInt(s.fw));
      /* 높이 */
      _setVal('hp_menu_h', s.h);
      _setTxt('hp_menu_h_v', s.h + 'px');
      /* 간격 */
      _setVal('hp_menu_gap', s.gap);
      _setTxt('hp_menu_gap_v', s.gap + 'px');
      /* 투명도 */
      if (s.opacity !== undefined) {
        _setVal('hp_menu_opacity', s.opacity);
        _setTxt('hp_menu_opacity_v', s.opacity + '%');
      }
      /* 정렬 */
      if (s.align && typeof window._hpMenuSetAlign === 'function') {
        window._hpMenuSetAlign(s.align);
      }
    } catch (e) { }
  }
  /* IIFE 외부에서도 접근 가능하도록 */
  window._hpMenuRestoreSettings = _hpMenuRestoreSettings;

  /* ── 정렬 버튼 토글 ── */
  window._hpMenuSetAlign = function (val) {
    var map = { 'flex-start': 'left', 'center': 'center', 'flex-end': 'right', 'space-between': 'space' };
    ['left', 'center', 'right', 'space'].forEach(function (k) {
      var btn = document.getElementById('hp_menu_align_' + k);
      if (!btn) return;
      var isActive = (map[val] === k);
      btn.style.background = isActive ? '#6366f1' : 'transparent';
      btn.style.color = isActive ? '#fff' : 'var(--text-secondary)';
    });
    var hidden = document.getElementById('hp_menu_align');
    if (hidden) hidden.value = val;
    window._hpMenuPreview();
    if (typeof refreshIcons === 'function') refreshIcons();
  };

  /* ── hex → RGB 분해 ── */
  function _hexToRgb(hex) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return isNaN(r) ? null : { r: r, g: g, b: b };
  }

  /* ── 미리보기 바 렌더 ── */
  window._hpMenuPreview = function () {
    var bar = document.getElementById('hp_menu_preview_bar');
    if (!bar) return;
    var s = _hpMenuGetSettings();
    /* 투명도 적용: hex → rgba */
    var bgColor = s.bg;
    var opacity = parseInt(s.opacity, 10);
    if (!isNaN(opacity)) {
      var rgb = _hexToRgb(bgColor);
      if (rgb) {
        bgColor = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + (opacity / 100).toFixed(2) + ')';
      }
    }
    bar.style.cssText = 'padding:0 20px;background:' + bgColor + ';display:flex;align-items:center;' +
      'justify-content:' + s.align + ';gap:' + s.gap + 'px;border-radius:10px;min-height:' + s.h + 'px;flex-wrap:wrap';
    bar.innerHTML = _hpMenuItems.map(function (m) {
      var name = typeof m === 'string' ? m : (m.name || m.label || String(m));
      return '<span style="font-size:' + s.fs + 'px;color:' + s.fc + ';font-weight:' + (s.fw || 700) + ';cursor:pointer;' +
        'padding:4px 6px;border-radius:4px;transition:opacity .15s" ' +
        'onmouseover="this.style.opacity=.7" onmouseout="this.style.opacity=1">' + name + '</span>';
    }).join('');
  };

  /* ── 폰트 굵기 토글 ── */
  window._hpMenuSetFw = function (fw) {
    var fwEl = document.getElementById('hp_menu_fw');
    if (fwEl) fwEl.value = String(fw);
    [300, 400, 700, 900].forEach(function (w) {
      var btn = document.getElementById('hp_menu_fw_' + w);
      if (!btn) return;
      if (w === fw) {
        btn.style.background = '#6366f1';
        btn.style.color = '#fff';
      } else {
        btn.style.background = 'transparent';
        btn.style.color = 'var(--text-secondary)';
      }
    });
    window._hpMenuPreview();
  };


  function _hpMenuRenderChips() {
    var wrap = document.getElementById('hp_menu_chips');
    if (!wrap) return;

    /* 메뉴 간격 설정값을 칩 컨테이너에도 반영 */
    var gapVal = (document.getElementById('hp_menu_gap') || {}).value || 20;
    wrap.style.gap = gapVal + 'px';

    if (!_hpMenuItems.length) {
      wrap.innerHTML = '<span style="font-size:12px;color:var(--text-muted)">등록된 메뉴가 없습니다</span>';
      return;
    }

    wrap.innerHTML = '';

    _hpMenuItems.forEach(function (m, i) {
      var name = typeof m === 'string' ? m : (m.name || m.label || String(m));

      var chip = document.createElement('span');
      chip.setAttribute('draggable', 'true');
      chip.setAttribute('data-idx', String(i));
      chip.style.cssText = 'display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border-radius:20px;' +
        'background:rgba(99,102,241,.12);border:1.5px solid rgba(99,102,241,.3);' +
        'font-size:12px;font-weight:700;color:#6366f1;cursor:grab;user-select:none;' +
        'transition:transform .15s,box-shadow .15s,opacity .15s';

      /* 드래그 핸들 아이콘 */
      var grip = document.createElement('span');
      grip.textContent = '⠿';
      grip.style.cssText = 'font-size:11px;color:rgba(99,102,241,.5);margin-right:1px;cursor:grab';

      /* 메뉴명 */
      var label = document.createElement('span');
      label.textContent = name;

      /* 삭제 버튼 */
      var delBtn = document.createElement('button');
      delBtn.innerHTML = '×';
      delBtn.style.cssText = 'background:none;border:none;color:#6366f1;cursor:pointer;font-size:14px;' +
        'line-height:1;padding:0 0 0 2px;display:flex;align-items:center';
      delBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        window._hpMenuRemove(i);
      });

      chip.appendChild(grip);
      chip.appendChild(label);
      chip.appendChild(delBtn);

      /* ── 드래그 이벤트 ── */
      chip.addEventListener('dragstart', function (e) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(i));
        chip.style.opacity = '0.4';
        chip.style.transform = 'scale(0.95)';
        wrap._dragSrcIdx = i;
      });
      chip.addEventListener('dragend', function () {
        chip.style.opacity = '1';
        chip.style.transform = '';
        /* 모든 칩의 드롭 인디케이터 제거 */
        wrap.querySelectorAll('[data-idx]').forEach(function (el) {
          el.style.borderLeft = '';
          el.style.borderRight = '';
          el.style.marginLeft = '';
          el.style.marginRight = '';
        });
      });
      chip.addEventListener('dragover', function (e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        /* 드롭 위치 시각 표시 */
        var rect = chip.getBoundingClientRect();
        var mid = rect.left + rect.width / 2;
        wrap.querySelectorAll('[data-idx]').forEach(function (el) {
          el.style.borderLeft = '';
          el.style.borderRight = '';
          el.style.marginLeft = '';
          el.style.marginRight = '';
        });
        if (e.clientX < mid) {
          chip.style.borderLeft = '3px solid #6366f1';
          chip.style.marginLeft = '2px';
        } else {
          chip.style.borderRight = '3px solid #6366f1';
          chip.style.marginRight = '2px';
        }
      });
      chip.addEventListener('dragleave', function () {
        chip.style.borderLeft = '';
        chip.style.borderRight = '';
        chip.style.marginLeft = '';
        chip.style.marginRight = '';
      });
      chip.addEventListener('drop', function (e) {
        e.preventDefault();
        var fromIdx = wrap._dragSrcIdx;
        var toIdx = i;
        if (fromIdx === undefined || fromIdx === toIdx) return;

        /* 드롭 위치에 따라 삽입 위치 결정 */
        var rect = chip.getBoundingClientRect();
        var mid = rect.left + rect.width / 2;
        var insertAfter = e.clientX >= mid;

        /* 배열 재정렬 */
        var item = _hpMenuItems.splice(fromIdx, 1)[0];
        var newIdx = insertAfter ? (fromIdx < toIdx ? toIdx : toIdx + 1) : (fromIdx < toIdx ? toIdx - 1 : toIdx);
        if (newIdx < 0) newIdx = 0;
        if (newIdx > _hpMenuItems.length) newIdx = _hpMenuItems.length;
        _hpMenuItems.splice(newIdx, 0, item);

        _hpMenuPersist();
        _hpMenuSyncAll();
      });

      wrap.appendChild(chip);
    });
  }


  /* ── 메뉴등록 페이지의 hp_menu_preview_chips 연동 ── */

  /* 기존 window._hpMenuRenderPreview(칩 클릭→서브메뉴 기능 포함)를 그대로 사용 */
  function _hpMenuSyncPreviewChips() {
    // hp_mainmenu에 최신 _hpMenuItems 반영 후 기존 렌더 함수 호출
    // (window._hpMenuRenderPreview는 hp_mainmenu에서 읽어 칩+클릭 이벤트 생성)
    if (typeof window._hpMenuRenderPreview === 'function') {
      window._hpMenuRenderPreview();
    }
  }

  /* ── 전체 UI 동기화 ── */
  function _hpMenuSyncAll() {
    _hpMenuRenderChips();
    window._hpMenuPreview();
    _hpMenuSyncPreviewChips();
  }

  /* ── 메뉴 추가 ── */
  window._hpMenuAdd = function () {
    var inp = document.getElementById('hp_menu_input');
    if (!inp || !inp.value.trim()) return;
    _hpMenuItems.push(inp.value.trim());
    inp.value = '';
    _hpMenuPersist();
    _hpMenuSyncAll();
  };

  /* ── 메뉴 삭제 (reload 없이 현재 배열에서 바로 삭제) ── */
  window._hpMenuRemove = function (i) {
    if (i < 0 || i >= _hpMenuItems.length) return;
    _hpMenuItems.splice(i, 1);
    _hpMenuPersist();
    _hpMenuSyncAll();
  };

  /* ── 저장 ── */
  window._hpMenuSave = function () {
    _hpMenuPersist();
    _hpMenuSyncAll();
    if (typeof showToast === 'function') showToast('success', '메인메뉴가 저장되었습니다');
  };

  /* ── hp-basic / hp-menu 진입 시 초기화 ── */
  var _prev_menuHpPage = window.showHomepagePage;
  window.showHomepagePage = function (pageId, navEl) {
    if (typeof _prev_menuHpPage === 'function') _prev_menuHpPage(pageId, navEl);
    if (pageId === 'hp-basic') {
      setTimeout(function () {
        _hpMenuLoad();
        _hpMenuRestoreSettings();
        _hpMenuSyncAll();
      }, 120);
    }
    if (pageId === 'hp-menu') {
      // hp_mainmenu 키에 최신 데이터 먼저 동기화 (칩 렌더는 기존 _hpMenuRenderPreview가 처리)
      setTimeout(function () {
        _hpMenuLoad();
        // _hpMenuPersist()로 hp_mainmenu 최신화 (메뉴 이름 문자열 보장)
        try {
          var cur = localStorage.getItem('hp_mainmenu');
          var parsed = cur ? JSON.parse(cur) : {};
          if (!Array.isArray(parsed.menus) || parsed.menus.length === 0) {
            // hp_mainmenu가 비어있으면 _hpMenuItems로 채워줌
            _hpMenuPersist();
          }
        } catch (e) { _hpMenuPersist(); }
      }, 50);
    }
  };

  /* ── 최초 로드 ── */
  (function () {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { _hpMenuLoad(); });
    } else {
      _hpMenuLoad();
    }
  })();

})();

/* ════════════════════════════════════════════
   약관관리 – 웹에디터 시스템
   저장소: localStorage 'terms_tos' / 'terms_privacy' / 'terms_post'
════════════════════════════════════════════ */
(function () {

  var _termsCurrentTab = 'tos';

  /* 샘플 문서 */
  var _TERMS_SAMPLES = {
    tos: `<h1 style="font-size:22px;font-weight:900;color:var(--text-primary);border-bottom:2.5px solid #6366f1;padding-bottom:10px;margin-bottom:20px">홈페이지 이용약관</h1>
<p style="font-size:12px;color:var(--text-muted);margin-bottom:24px">시행일자: <strong>2025년 1월 1일</strong> &nbsp;|&nbsp; 최종 개정일: <strong>2025년 1월 1일</strong> &nbsp;|&nbsp; 버전: <strong>v1.0</strong></p>

<h2 style="font-size:16px;font-weight:800;color:var(--accent-indigo);margin:28px 0 10px">제1장 총칙</h2>

<h3 style="font-size:14px;font-weight:700;color:var(--text-primary);margin:16px 0 6px">제1조 (목적)</h3>
<p style="font-size:13.5px;color:var(--text-secondary);line-height:1.9;margin:0 0 12px">이 약관은 <strong>(주)워크엠</strong>(이하 "회사"라 합니다)이 운영하는 홈페이지(이하 "사이트"라 합니다)에서 제공하는 인터넷 관련 서비스(이하 "서비스"라 합니다)를 이용함에 있어 회사와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.</p>

<h3 style="font-size:14px;font-weight:700;color:var(--text-primary);margin:16px 0 6px">제2조 (용어의 정의)</h3>
<p style="font-size:13.5px;color:var(--text-secondary);margin:0 0 8px">이 약관에서 사용하는 용어의 정의는 다음과 같습니다.</p>
<ol style="padding-left:20px;margin:0 0 12px;color:var(--text-secondary);font-size:13.5px;line-height:2">
  <li>"사이트"란 회사가 서비스를 이용자에게 제공하기 위하여 컴퓨터 등 정보통신설비를 이용하여 재화 또는 용역을 거래할 수 있도록 설정한 가상의 영업장을 말합니다.</li>
  <li>"이용자"란 사이트에 접속하여 이 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.</li>
  <li>"회원"이란 회사에 개인정보를 제공하여 회원등록을 한 자로서, 회사의 정보를 지속적으로 제공받으며 회사가 제공하는 서비스를 계속적으로 이용할 수 있는 자를 말합니다.</li>
  <li>"비회원"이란 회원에 가입하지 않고 회사가 제공하는 서비스를 이용하는 자를 말합니다.</li>
</ol>

<h3 style="font-size:14px;font-weight:700;color:var(--text-primary);margin:16px 0 6px">제3조 (약관의 명시와 개정)</h3>
<ol style="padding-left:20px;margin:0 0 12px;color:var(--text-secondary);font-size:13.5px;line-height:2">
  <li>회사는 이 약관의 내용과 상호, 영업소 소재지 주소, 전화번호, 팩스번호, 전자우편주소, 사업자등록번호 등을 이용자가 쉽게 알 수 있도록 사이트의 초기 서비스 화면에 게시합니다.</li>
  <li>회사는 「약관의 규제에 관한 법률」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.</li>
  <li>회사가 약관을 개정할 경우에는 적용일자 및 개정 사유를 명시하여 현행 약관과 함께 사이트의 초기화면에 그 적용일자 7일 이전부터 적용일자 전일까지 공지합니다.</li>
</ol>

<h2 style="font-size:16px;font-weight:800;color:var(--accent-indigo);margin:32px 0 10px">제2장 서비스 이용</h2>

<h3 style="font-size:14px;font-weight:700;color:var(--text-primary);margin:16px 0 6px">제4조 (서비스의 제공 및 변경)</h3>
<ol style="padding-left:20px;margin:0 0 12px;color:var(--text-secondary);font-size:13.5px;line-height:2">
  <li>회사는 다음과 같은 업무를 수행합니다.
    <ul style="margin:4px 0;padding-left:18px">
      <li>재화 또는 용역에 대한 정보 제공 및 구매계약의 체결</li>
      <li>구매계약이 체결된 재화 또는 용역의 배송</li>
      <li>기타 회사가 정하는 업무</li>
    </ul>
  </li>
  <li>회사는 재화 또는 용역의 품절 또는 기술적 사양의 변경 등의 경우에는 장차 체결되는 계약에 의해 제공할 재화 또는 용역의 내용을 변경할 수 있습니다.</li>
</ol>

<h3 style="font-size:14px;font-weight:700;color:var(--text-primary);margin:16px 0 6px">제5조 (서비스의 중단)</h3>
<ol style="padding-left:20px;margin:0 0 12px;color:var(--text-secondary);font-size:13.5px;line-height:2">
  <li>회사는 컴퓨터 등 정보통신설비의 보수점검·교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.</li>
  <li>회사는 제1항의 사유로 서비스의 제공이 일시적으로 중단됨으로 인하여 이용자 또는 제3자가 입은 손해에 대하여 배상합니다. 단, 회사가 고의 또는 과실이 없음을 입증하는 경우에는 그러하지 아니합니다.</li>
</ol>

<h2 style="font-size:16px;font-weight:800;color:var(--accent-indigo);margin:32px 0 10px">제3장 회원 가입 및 관리</h2>

<h3 style="font-size:14px;font-weight:700;color:var(--text-primary);margin:16px 0 6px">제6조 (회원가입)</h3>
<p style="font-size:13.5px;color:var(--text-secondary);margin:0 0 8px">이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 이 약관에 동의한다는 의사표시를 함으로써 회원가입을 신청합니다. 회사는 다음 각 호에 해당하지 않는 한 회원으로 등록합니다.</p>
<ol style="padding-left:20px;margin:0 0 12px;color:var(--text-secondary);font-size:13.5px;line-height:2">
  <li>가입신청자가 이 약관에 의하여 이전에 회원자격을 상실한 적이 있는 경우 (단, 회원자격 상실 후 3년이 경과한 자로서 회사의 회원 재가입 승낙을 얻은 경우는 예외)</li>
  <li>등록 내용에 허위, 기재누락, 오기가 있는 경우</li>
  <li>기타 회원으로 등록하는 것이 회사의 기술상 현저히 지장이 있다고 판단되는 경우</li>
</ol>

<h3 style="font-size:14px;font-weight:700;color:var(--text-primary);margin:16px 0 6px">제7조 (회원 탈퇴 및 자격 상실)</h3>
<ol style="padding-left:20px;margin:0 0 12px;color:var(--text-secondary);font-size:13.5px;line-height:2">
  <li>회원은 회사에 언제든지 탈퇴를 요청할 수 있으며 회사는 즉시 회원탈퇴를 처리합니다.</li>
  <li>회원이 다음 각 호의 사유에 해당하는 경우, 회사는 회원자격을 제한 및 정지시킬 수 있습니다.
    <ul style="margin:4px 0;padding-left:18px">
      <li>가입 신청 시에 허위 내용을 등록한 경우</li>
      <li>다른 사람의 서비스 이용을 방해하거나 그 정보를 도용하는 등 전자상거래 질서를 위협하는 경우</li>
      <li>서비스를 이용하여 법령 또는 이 약관이 금지하거나 공서양속에 반하는 행위를 하는 경우</li>
    </ul>
  </li>
</ol>

<h2 style="font-size:16px;font-weight:800;color:var(--accent-indigo);margin:32px 0 10px">제4장 개인정보 보호</h2>

<h3 style="font-size:14px;font-weight:700;color:var(--text-primary);margin:16px 0 6px">제8조 (개인정보 보호)</h3>
<p style="font-size:13.5px;color:var(--text-secondary);margin:0 0 12px">회사는 이용자의 개인정보 수집 시 서비스 제공을 위하여 필요한 최소한의 개인정보를 수집합니다. 회사는 회원가입 시 구매계약 이행에 필요한 정보를 미리 수집하지 않습니다. 다만, 관련 법령상 의무이행을 위하여 구매계약 이전에 본인확인이 필요한 경우에는 최소한의 특정 개인정보를 수집할 수 있습니다.</p>

<h2 style="font-size:16px;font-weight:800;color:var(--accent-indigo);margin:32px 0 10px">제5장 기타</h2>

<h3 style="font-size:14px;font-weight:700;color:var(--text-primary);margin:16px 0 6px">제9조 (분쟁 해결)</h3>
<ol style="padding-left:20px;margin:0 0 12px;color:var(--text-secondary);font-size:13.5px;line-height:2">
  <li>회사는 이용자가 제기하는 정당한 의견이나 불만을 반영하고 그 피해를 보상·처리하기 위하여 피해보상처리기구를 설치·운영합니다.</li>
  <li>회사는 이용자로부터 제출되는 불만사항 및 의견은 우선적으로 그 사항을 처리합니다. 다만, 신속한 처리가 곤란한 경우에는 이용자에게 그 사유와 처리일정을 즉시 통보해 드립니다.</li>
  <li>회사와 이용자 간에 발생한 전자상거래 분쟁에 관련하여 이용자의 피해구제신청이 있는 경우에는 공정거래위원회 또는 시·도지사가 의뢰하는 분쟁조정기관의 조정에 따를 수 있습니다.</li>
</ol>

<h3 style="font-size:14px;font-weight:700;color:var(--text-primary);margin:16px 0 6px">제10조 (재판권 및 준거법)</h3>
<p style="font-size:13.5px;color:var(--text-secondary);margin:0 0 24px">회사와 이용자 간에 발생한 전자상거래 분쟁에 관한 소송은 제소 당시의 이용자의 주소에 의하고, 주소가 없는 경우에는 거소를 관할하는 지방법원의 전속관할로 합니다. 회사와 이용자 간에 제기된 전자상거래 소송에는 한국법을 적용합니다.</p>

<hr style="border:none;border-top:1.5px solid var(--border-color);margin:28px 0">

<h3 style="font-size:14px;font-weight:700;color:var(--text-primary);margin:16px 0 10px">✅ 이용약관 동의</h3>
<div style="background:var(--bg-secondary);border:1.5px solid var(--border-color);border-radius:12px;padding:20px;margin-top:8px">
  <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;margin-bottom:12px">
    <input type="checkbox" style="width:16px;height:16px;margin-top:2px;accent-color:#6366f1" checked>
    <span style="font-size:13px;color:var(--text-primary)">(필수) 만 14세 이상이며, 홈페이지 이용약관에 동의합니다. <span style="color:#ef4444;font-weight:700">[필수]</span></span>
  </label>
  <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;margin-bottom:12px">
    <input type="checkbox" style="width:16px;height:16px;margin-top:2px;accent-color:#6366f1" checked>
    <span style="font-size:13px;color:var(--text-primary)">(필수) 개인정보 수집 및 이용에 동의합니다. <span style="color:#ef4444;font-weight:700">[필수]</span></span>
  </label>
  <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer">
    <input type="checkbox" style="width:16px;height:16px;margin-top:2px;accent-color:#6366f1">
    <span style="font-size:13px;color:var(--text-secondary)">(선택) 마케팅 정보 수신 및 활용에 동의합니다. [선택]</span>
  </label>
</div>

<p style="font-size:12px;color:var(--text-muted);text-align:center;margin-top:24px">본 약관은 2025년 1월 1일부터 시행됩니다. &nbsp;|&nbsp; (주)워크엠</p>`,

    privacy: `<h1 style="font-size:22px;font-weight:900;color:var(--text-primary);border-bottom:2.5px solid #10b981;padding-bottom:10px;margin-bottom:20px">개인정보 수집·이용 및 처리방침</h1>
<p style="font-size:12px;color:var(--text-muted);margin-bottom:24px">시행일: <strong>2026년 1월 1일</strong> &nbsp;|  개인정보보호법 제30조</p>

<h2 style="font-size:16px;font-weight:800;color:var(--text-primary);margin:28px 0 10px;display:flex;align-items:center;gap:8px">🔒 수집하는 개인정보</h2>
<div style="overflow:hidden;border-radius:10px;border:1.5px solid var(--border-color);margin:12px 0">
  <table style="width:100%;border-collapse:collapse;font-size:13px">
    <thead><tr style="background:var(--bg-secondary)">
      <th style="padding:10px 14px;text-align:left;font-weight:700;color:var(--text-primary);border-bottom:1.5px solid var(--border-color)">수집 항목</th>
      <th style="padding:10px 14px;text-align:left;font-weight:700;color:var(--text-primary);border-bottom:1.5px solid var(--border-color)">수집 목적</th>
      <th style="padding:10px 14px;text-align:left;font-weight:700;color:var(--text-primary);border-bottom:1.5px solid var(--border-color)">보유 기간</th>
    </tr></thead>
    <tbody>
      <tr><td style="padding:9px 14px;border-bottom:1px solid var(--border-color)">이름, 이메일</td><td style="padding:9px 14px;border-bottom:1px solid var(--border-color)">회원 식별</td><td style="padding:9px 14px;border-bottom:1px solid var(--border-color)">회원 탈퇴 시</td></tr>
      <tr><td style="padding:9px 14px;border-bottom:1px solid var(--border-color)">접속 IP, 쿠키</td><td style="padding:9px 14px;border-bottom:1px solid var(--border-color)">서비스 로그 분석</td><td style="padding:9px 14px;border-bottom:1px solid var(--border-color)">1년</td></tr>
      <tr><td style="padding:9px 14px">문의상담 내용</td><td style="padding:9px 14px">고객 지원</td><td style="padding:9px 14px">컨테츠 해결 시</td></tr>
    </tbody>
  </table>
</div>

<h2 style="font-size:16px;font-weight:800;color:var(--text-primary);margin:28px 0 10px;display:flex;align-items:center;gap:8px">🔒 개인정보 처리의 미우기</h2>
<p>당사는 인안하한 수 동마마 개인정보를 올바르게 처리하으며, 이용자의 동의가 없는 한 개인정보를 외부에 공개하거나 제3자에게 제공하지 않습니다.</p>
<blockquote style="border-left:4px solid #10b981;padding:10px 16px;margin:16px 0;background:rgba(16,185,129,.07);border-radius:0 8px 8px 0;color:var(--text-secondary);font-style:italic">다만, 법령에 의해 요청되는 경우 또는 수사기관의 수사에 필요한 경우는 예외입니다.</blockquote>

<h2 style="font-size:16px;font-weight:800;color:var(--text-primary);margin:28px 0 10px;display:flex;align-items:center;gap:8px">🔒 정보주체의 권리</h2>
<p>이용자는 시어준이어준이도 다음과 같은 권리를 행사할 수 있습니다.</p>
<div style="display:flex;flex-direction:column;gap:10px;margin:14px 0">
  <label style="display:flex;align-items:center;gap:10px">
    <input type="radio" name="privacy_right" value="access" style="accent-color:#10b981" checked>
    <span style="font-size:13px;color:var(--text-primary)">개인정보 열람 요청</span>
  </label>
  <label style="display:flex;align-items:center;gap:10px">
    <input type="radio" name="privacy_right" value="correct" style="accent-color:#10b981">
    <span style="font-size:13px;color:var(--text-primary)">개인정보 정정 요청</span>
  </label>
  <label style="display:flex;align-items:center;gap:10px">
    <input type="radio" name="privacy_right" value="delete" style="accent-color:#10b981">
    <span style="font-size:13px;color:var(--text-primary)">개인정보 삭제 요청</span>
  </label>
</div>

<hr style="margin:32px 0;border:none;border-top:1.5px solid var(--border-color)">

<h2 style="font-size:16px;font-weight:800;color:var(--text-primary);margin:28px 0 10px">📞 개인정보 보호 담당자</h2>
<div style="background:var(--bg-secondary);border:1.5px solid var(--border-color);border-radius:12px;padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:14px">
  <div>
    <div style="font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;margin-bottom:6px">담당자</div>
    <input type="text" value="개인정보 업무담당자" style="width:100%;padding:8px 12px;border:1.5px solid var(--border-color);border-radius:8px;font-size:13px;background:var(--bg-card);color:var(--text-primary);outline:none;box-sizing:border-box">
  </div>
  <div>
    <div style="font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;margin-bottom:6px">연락체계</div>
    <input type="text" value="privacy@yourcompany.com" style="width:100%;padding:8px 12px;border:1.5px solid var(--border-color);border-radius:8px;font-size:13px;background:var(--bg-card);color:var(--text-primary);outline:none;box-sizing:border-box">
  </div>
</div>`,

    post: `<h1 style="font-size:22px;font-weight:900;color:var(--text-primary);border-bottom:2.5px solid #f59e0b;padding-bottom:10px;margin-bottom:20px">게시물 게재 원칙</h1>
<p style="font-size:12px;color:var(--text-muted);margin-bottom:24px">최종 수정일: <strong>2026년 1월 1일</strong></p>

<h2 style="font-size:16px;font-weight:800;color:var(--text-primary);margin:28px 0 10px;display:flex;align-items:center;gap:8px">📃 1. 기본 원칙</h2>
<p>모든 게시물은 다음 기준을 준수해야 합니다.</p>
<ul style="padding-left:20px;margin:10px 0">
  <li style="margin-bottom:6px">✅ 회사의 제데3 업무 및 서비스에 관련된 무무주달 정보</li>
  <li style="margin-bottom:6px">✅ 다른 사용자에게 유익한 정보 제공</li>
  <li style="margin-bottom:6px">✅ 명확한 정보 출체 및 정확한 내용</li>
  <li style="margin-bottom:6px">❌ 혜스피치 먹ퟬ 포함 불법 콘텐츠</li>
  <li style="margin-bottom:6px">❌ 저작권 없는 이미지 또는 동영상 게시</li>
  <li style="margin-bottom:6px">❌ 특정 단체 또는 개인에 대한 비방·요설</li>
</ul>

<h2 style="font-size:16px;font-weight:800;color:var(--text-primary);margin:28px 0 10px;display:flex;align-items:center;gap:8px">📃 2. 콘텐츠 유형 분류</h2>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin:14px 0">
  <div style="background:rgba(99,102,241,.08);border:1.5px solid rgba(99,102,241,.25);border-radius:12px;padding:16px;text-align:center">
    <div style="font-size:24px;margin-bottom:6px">📝</div>
    <div style="font-size:13px;font-weight:700;color:var(--text-primary)">일반 게시물</div>
    <div style="font-size:11px;color:var(--text-muted);margin-top:4px">수시 게재 가능</div>
  </div>
  <div style="background:rgba(16,185,129,.08);border:1.5px solid rgba(16,185,129,.25);border-radius:12px;padding:16px;text-align:center">
    <div style="font-size:24px;margin-bottom:6px">🔍</div>
    <div style="font-size:13px;font-weight:700;color:var(--text-primary)">담당자 검토 후</div>
    <div style="font-size:11px;color:var(--text-muted);margin-top:4px">편집 제한 콘텐츠</div>
  </div>
  <div style="background:rgba(239,68,68,.08);border:1.5px solid rgba(239,68,68,.25);border-radius:12px;padding:16px;text-align:center">
    <div style="font-size:24px;margin-bottom:6px">⛔</div>
    <div style="font-size:13px;font-weight:700;color:var(--text-primary)">즉시 삭제</div>
    <div style="font-size:11px;color:var(--text-muted);margin-top:4px">출처 브기드 콘텐츠</div>
  </div>
</div>

<h2 style="font-size:16px;font-weight:800;color:var(--text-primary);margin:28px 0 10px;display:flex;align-items:center;gap:8px">📃 3. 신고 메커니즘</h2>
<p>게시물 신고는 아래 절차로 진행됩니다.</p>
<div style="display:flex;flex-direction:column;gap:6px;margin:14px 0">
  <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--bg-secondary);border-radius:9px">
    <span style="width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:11px;flex-shrink:0">1</span>
    <span style="font-size:13px;color:var(--text-primary)">신고 버튼 클릭 → 신고 사유 선택</span>
  </div>
  <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--bg-secondary);border-radius:9px">
    <span style="width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:11px;flex-shrink:0">2</span>
    <span style="font-size:13px;color:var(--text-primary)">담당자 1영업일 이내 1차 검토</span>
  </div>
  <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--bg-secondary);border-radius:9px">
    <span style="width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:11px;flex-shrink:0">3</span>
    <span style="font-size:13px;color:var(--text-primary)">위반 확인 시 콘텐츠 조치 실행</span>
  </div>
</div>

<hr style="margin:32px 0;border:none;border-top:1.5px solid var(--border-color)">

<h2 style="font-size:16px;font-weight:800;color:var(--text-primary);margin:28px 0 10px">📧 원칙 위반 신고</h2>
<div style="background:var(--bg-secondary);border:1.5px solid var(--border-color);border-radius:12px;padding:20px">
  <div style="margin-bottom:12px">
    <div style="font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;margin-bottom:6px">신고 사유</div>
    <select style="width:100%;padding:9px 12px;border:1.5px solid var(--border-color);border-radius:8px;font-size:13px;background:var(--bg-card);color:var(--text-primary);outline:none">
      <option>저작권 침해</option>
      <option>스팸/광고</option>
      <option>을란·모웅</option>
      <option>미성년자 보호</option>
      <option>기타</option>
    </select>
  </div>
  <div>
    <div style="font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;margin-bottom:6px">상세 내용</div>
    <textarea rows="3" placeholder="신고 내용을 입력하세요..." style="width:100%;padding:9px 12px;border:1.5px solid var(--border-color);border-radius:8px;font-size:13px;background:var(--bg-card);color:var(--text-primary);outline:none;resize:vertical;box-sizing:border-box;line-height:1.6"></textarea>
  </div>
</div>`
  };

  /* 에디터 컴맰드 */
  window.termsExecCmd = function (cmd, val) {
    document.getElementById('terms-editor').focus();
    document.execCommand(cmd, false, val || null);
  };

  /* 링크 삽입 */
  window.termsInsertLink = function () {
    var url = prompt('URL을 입력하세요:', 'https://');
    if (url) document.execCommand('createLink', false, url);
  };

  /* 탭 전환 */
  window.termsSwitchTab = function (tabId) {
    /* 현재 에디터 콘텐츠 저장 */
    var editor = document.getElementById('terms-editor');
    if (editor) {
      try { localStorage.setItem('terms_' + _termsCurrentTab, editor.innerHTML); } catch (e) { }
    }
    _termsCurrentTab = tabId;

    /* 탭 스타일 */
    ['tos', 'privacy', 'post'].forEach(function (t) {
      var btn = document.getElementById('terms-tab-' + t);
      if (!btn) return;
      var active = t === tabId;
      btn.style.color = active ? 'var(--accent-indigo)' : 'var(--text-muted)';
      btn.style.borderBottomColor = active ? 'var(--accent-indigo)' : 'transparent';
      btn.style.background = active ? 'rgba(99,102,241,.06)' : 'transparent';
    });

    /* 콘텐츠 로드 */
    if (editor) {
      var saved = '';
      try { saved = localStorage.getItem('terms_' + tabId) || ''; } catch (e) { }
      editor.innerHTML = saved || _TERMS_SAMPLES[tabId] || '';
    }
  };

  /* 저장 */
  window.termsDoSave = function () {
    var editor = document.getElementById('terms-editor');
    if (!editor) return;
    try { localStorage.setItem('terms_' + _termsCurrentTab, editor.innerHTML); } catch (e) { }
    if (typeof showToast === 'function') showToast('success', '약관이 저장되었습니다');
  };

  /* hp-terms 진입 시 초기화 */
  var _prev_showHpTerms = window.showHomepagePage;
  window.showHomepagePage = function (pageId, navEl) {
    if (typeof _prev_showHpTerms === 'function') _prev_showHpTerms(pageId, navEl);
    if (pageId === 'hp-terms') {
      setTimeout(function () {
        termsSwitchTab('tos');
        if (typeof refreshIcons === 'function') refreshIcons();
      }, 80);
    }
  };

})(); /* terms IIFE */

/* ══════════════════════════════════════════════
   홈페이지 업무 원형 숫자 카운터 – 나열형
   기본 ①, + 클릭 시 ②③④ 순서로 옆에 추가
   각 뱃지 클릭 시 해당 숫자 제거
   저장소: localStorage 'hp_work_badges_v2'
══════════════════════════════════════════════ */
(function () {
  var _KEY = 'hp_work_badges_v2';

  /* 뱃지 색상 팔레트 – 순서마다 다른 색 */
  var _COLORS = [
    'linear-gradient(135deg,#f59e0b,#ef4444)',   /* 1: 주황-빨강 */
    'linear-gradient(135deg,#3b82f6,#6366f1)',   /* 2: 파랑-인디고 */
    'linear-gradient(135deg,#10b981,#059669)',   /* 3: 에메랄드 */
    'linear-gradient(135deg,#8b5cf6,#ec4899)',   /* 4: 퍼플-핑크 */
    'linear-gradient(135deg,#f43f5e,#e11d48)',   /* 5: 로즈 */
    'linear-gradient(135deg,#0ea5e9,#0284c7)',   /* 6: 스카이 */
    'linear-gradient(135deg,#f97316,#c2410c)',   /* 7: 오렌지 */
    'linear-gradient(135deg,#14b8a6,#0d9488)',   /* 8: 틸 */
    'linear-gradient(135deg,#a855f7,#7c3aed)',   /* 9: 바이올렛 */
    'linear-gradient(135deg,#22c55e,#15803d)',   /* 10: 그린 */
  ];

  /* 현재 배열 (1-based 숫자들): 예) [1, 2, 3] */
  var _nums = [];

  function _load() {
    try {
      var raw = localStorage.getItem(_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) { _nums = parsed; return; }
      }
    } catch (e) {}
    _nums = [1]; /* 기본값 */
  }

  function _save() {
    try { localStorage.setItem(_KEY, JSON.stringify(_nums)); } catch (e) {}
  }

  function _getColor(n) {
    return _COLORS[(n - 1) % _COLORS.length];
  }

  function _makeBadge(n) {
    var el = document.createElement('div');
    el.textContent = String(n);
    el.title = n + ' 클릭하면 제거';
    var isSmall = n < 10;
    el.style.cssText = [
      'width:' + (isSmall ? '26px' : '32px'),
      'height:' + (isSmall ? '26px' : '26px'),
      'border-radius:50%',
      'background:' + _getColor(n),
      'color:#fff',
      'font-size:' + (isSmall ? '13px' : '11.5px'),
      'font-weight:900',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'cursor:pointer',
      'user-select:none',
      'box-shadow:0 2px 8px rgba(0,0,0,.22)',
      'transition:transform .15s,box-shadow .15s',
      'flex-shrink:0',
      'letter-spacing:-.5px'
    ].join(';');

    el.addEventListener('mouseenter', function () {
      el.style.transform = 'scale(1.18)';
      el.style.boxShadow = '0 4px 16px rgba(0,0,0,.32)';
    });
    el.addEventListener('mouseleave', function () {
      el.style.transform = '';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,.22)';
    });
    el.addEventListener('click', function () {
      /* 제거 애니메이션 */
      el.style.transform = 'scale(0)';
      el.style.opacity = '0';
      el.style.transition = 'transform .2s,opacity .2s';
      setTimeout(function () {
        var idx = _nums.indexOf(n);
        if (idx !== -1) {
          _nums.splice(idx, 1);
          /* 제거 후 남은 숫자 재정렬: 1부터 순서대로 재할당 */
          _nums = _nums.map(function (_, i) { return i + 1; });
          _save();
          _render();
        }
      }, 200);
    });
    return el;
  }

  function _render() {
    var wrap = document.getElementById('hp-work-badges');
    if (!wrap) return;
    wrap.innerHTML = '';
    _nums.forEach(function (n) {
      wrap.appendChild(_makeBadge(n));
    });
  }

  /* 공개: + 버튼 클릭 */
  window._hpWorkBadgeAdd = function () {
    var next = _nums.length + 1;
    _nums.push(next);
    _save();

    /* 새 뱃지만 추가 (전체 리렌더 대신 append) */
    var wrap = document.getElementById('hp-work-badges');
    if (wrap) {
      var el = _makeBadge(next);
      el.style.transform = 'scale(0)';
      el.style.opacity   = '0';
      el.style.transition = 'transform .25s cubic-bezier(.34,1.56,.64,1),opacity .2s';
      wrap.appendChild(el);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          el.style.transform = '';
          el.style.opacity   = '1';
        });
      });
    }
  };

  /* 구버전 함수도 호환 유지 (혹시 다른 곳에서 호출 시) */
  window._hpWorkBadgeInc = window._hpWorkBadgeAdd;
  window._hpWorkBadgeDec = function () {
    if (_nums.length <= 1) return;
    _nums.pop();
    _save();
    _render();
  };

  /* 초기화 */
  function _init() {
    _load();
    _render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    setTimeout(_init, 0);
  }
})();

/* ══════════════════════════════════════════════
   사이트 정보 저장/복원
   저장소: localStorage 'hp_site_info'
══════════════════════════════════════════════ */
function _hpSiteInfoSave() {
  var data = {
    name:   (document.getElementById('hp_site_name')   || {}).value || '',
    domain: (document.getElementById('hp_site_domain') || {}).value || '',
    email:  (document.getElementById('hp_site_email')  || {}).value || '',
    phone:  (document.getElementById('hp_site_phone')  || {}).value || ''
  };
  try { localStorage.setItem('hp_site_info', JSON.stringify(data)); } catch (e) {}
  if (typeof showToast === 'function') showToast('success', '사이트 정보가 저장되었습니다.');
}

function _hpSiteInfoRestore() {
  try {
    var raw = localStorage.getItem('hp_site_info');
    if (!raw) return;
    var data = JSON.parse(raw);
    var fields = { hp_site_name: 'name', hp_site_domain: 'domain', hp_site_email: 'email', hp_site_phone: 'phone' };
    Object.keys(fields).forEach(function (id) {
      var el = document.getElementById(id);
      if (el && data[fields[id]]) el.value = data[fields[id]];
    });
  } catch (e) {}
}

/* ── hp-basic 진입 시 사이트 정보 복원 ── */
var _prev_showHpPageSite = window.showHomepagePage;
window.showHomepagePage = function (pageId, navEl) {
  if (typeof _prev_showHpPageSite === 'function') _prev_showHpPageSite(pageId, navEl);
  if (pageId === 'hp-basic') {
    setTimeout(function () {
      _hpSiteInfoRestore();
    }, 130);
  }
};
