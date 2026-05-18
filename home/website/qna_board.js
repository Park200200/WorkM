/* ═══════════════════════════════════════════════
   Q&A – 사이트 전역 함수
   펼침으로 답변 보기, 재질문, 재답변
   localStorage board_items (cat=qna) 기반
═══════════════════════════════════════════════ */
(function () {
  'use strict';

  function _qaAll() {
    try { return JSON.parse(localStorage.getItem('board_items') || '[]'); } catch(e) { return []; }
  }
  function _qaSave(all) {
    try { localStorage.setItem('board_items', JSON.stringify(all)); } catch(e) {}
  }
  function _qaContainer() { return document.getElementById('hp-qna-board'); }

  function _qaRerender() {
    var c = _qaContainer(); if (!c) return;
    var items = _qaAll().filter(function(i){ return i.cat === 'qna'; });
    items.sort(function(a,b){ return (b.featured?1:0)-(a.featured?1:0); });
    c.innerHTML = _qaBuildList(items);
  }

  function _qaEsc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function _qaNow() {
    var d = new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }

  function _qaBuildList(items) {
    if (!items.length) {
      return '<p style="text-align:center;color:var(--hp-text-muted);padding:40px 0;font-size:14px">등록된 Q&amp;A가 없습니다.</p>';
    }
    return items.map(function(it) {
      var replies = it.replies || [];
      var threads = it.threads || [];
      var totalCount = replies.length + threads.length;

      /* ── 관리자 답변 ── */
      var adminHtml = replies.length
        ? replies.map(function(r) {
            return '<div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:12px">' +
              '<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#8b5cf6,#6d28d9);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#fff;flex-shrink:0">A</div>' +
              '<div style="flex:1;background:rgba(139,92,246,.06);border-radius:10px;padding:12px 14px;border-left:3px solid #8b5cf6">' +
              '<div style="font-size:11px;color:#8b5cf6;font-weight:700;margin-bottom:6px">관리자 · ' + _qaEsc(r.author||'관리자') + ' · ' + (r.date||'') + '</div>' +
              '<div style="font-size:13px;color:var(--hp-text);line-height:1.7;white-space:pre-wrap">' + _qaEsc(r.content||'') + '</div>' +
              '</div></div>';
          }).join('')
        : '<div style="font-size:13px;color:var(--hp-text-muted);padding:4px 0 14px">아직 답변이 등록되지 않았습니다.</div>';

      /* ── 재질문+재답변 스레드 (Q/A 쌍 카드형) ── */
      var threadsHtml = threads.map(function(t, ti) {
        /* Q 카드 */
        var qCard =
          '<div style="display:grid;grid-template-columns:auto 1fr;gap:0;border-radius:10px;overflow:hidden;border:1px solid rgba(99,102,241,.2);margin-bottom:5px">' +
          '<div style="background:#6366f1;display:flex;align-items:center;justify-content:center;width:32px;padding:12px 0">' +
          '<span style="font-size:13px;font-weight:900;color:#fff">Q</span>' +
          '</div>' +
          '<div style="padding:10px 13px;background:rgba(99,102,241,.04)">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">' +
          '<span style="font-size:11px;color:#6366f1;font-weight:700">' + _qaEsc(t.author||'익명') + ' · ' + (t.date||'') + '</span>' +
          '<button onclick="hpQnaDelThread(\'' + it.id + '\',' + ti + ')" style="border:none;background:none;font-size:11px;color:#ef4444;cursor:pointer;padding:0">삭제</button>' +
          '</div>' +
          '<div style="font-size:13px;color:var(--hp-text);line-height:1.6;white-space:pre-wrap">' + _qaEsc(t.content||'') + '</div>' +
          '</div></div>';

        /* A 카드 – 재답변 있으면 내용, 없으면 관리자 대기 안내 */
        var hasAns = !!(t.answer && t.answer.content);
        var aCard =
          '<div style="display:grid;grid-template-columns:auto 1fr;gap:0;border-radius:10px;overflow:hidden;border:1px solid ' + (hasAns ? 'rgba(34,197,94,.25)' : 'rgba(0,0,0,.08)') + ';margin-bottom:14px">' +
          '<div style="background:' + (hasAns ? '#22c55e' : '#94a3b8') + ';display:flex;align-items:flex-start;justify-content:center;width:32px;padding:12px 0">' +
          '<span style="font-size:13px;font-weight:900;color:#fff">A</span>' +
          '</div>' +
          '<div style="padding:10px 13px;background:' + (hasAns ? 'rgba(34,197,94,.04)' : 'rgba(0,0,0,.02)') + '">';

        if (hasAns) {
          aCard +=
            '<div style="font-size:11px;color:#22c55e;font-weight:700;margin-bottom:4px">' + _qaEsc(t.answer.author||'관리자') + ' · ' + (t.answer.date||'') + '</div>' +
            '<div style="font-size:13px;color:var(--hp-text);line-height:1.6;white-space:pre-wrap">' + _qaEsc(t.answer.content||'') + '</div>';
        } else {
          /* 사이트에서는 재답변 입력 불가 – 관리자만 워bc에서 등록 */
          aCard +=
            '<div style="display:flex;align-items:center;gap:8px;padding:2px 0">' +
            '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' +
            '<span style="font-size:13px;color:var(--hp-text-muted)">답변 준비중</span></div>';
        }
        aCard += '</div></div>';

        return qCard + aCard;
      }).join('');

      /* ── 재질문 입력 폼 (Q 카드 스타일) ── */
      var reQForm =
        '<div style="display:grid;grid-template-columns:auto 1fr;gap:0;border-radius:10px;overflow:hidden;border:1.5px dashed rgba(99,102,241,.3);margin-top:4px">' +
        '<div style="background:rgba(99,102,241,.18);display:flex;align-items:center;justify-content:center;width:32px;padding:12px 0">' +
        '<span style="font-size:13px;font-weight:900;color:#6366f1">Q</span>' +
        '</div>' +
        '<div style="padding:10px 13px;background:rgba(99,102,241,.03)">' +
        '<div style="font-size:11px;color:#6366f1;font-weight:700;margin-bottom:8px">재질문 남기기</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px">' +
        '<input id="rq-author-' + it.id + '" type="text" placeholder="이름" style="padding:7px 10px;border:1.5px solid rgba(0,0,0,.12);border-radius:8px;font-size:12px;background:var(--hp-bg,#fff);color:var(--hp-text);outline:none">' +
        '<input id="rq-pwd-' + it.id + '" type="password" placeholder="비밀번호(삭제용)" style="padding:7px 10px;border:1.5px solid rgba(0,0,0,.12);border-radius:8px;font-size:12px;background:var(--hp-bg,#fff);color:var(--hp-text);outline:none">' +
        '</div>' +
        '<div style="display:flex;gap:6px">' +
        '<textarea id="rq-content-' + it.id + '" rows="2" placeholder="추가 질문을 입력하세요..." style="flex:1;padding:8px 10px;border:1.5px solid rgba(0,0,0,.12);border-radius:8px;font-size:12px;background:var(--hp-bg,#fff);color:var(--hp-text);resize:none;outline:none;font-family:inherit"></textarea>' +
        '<button onclick="hpQnaReQ(\'' + it.id + '\')" style="padding:8px 14px;border:none;border-radius:8px;background:#6366f1;color:#fff;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap">재질문</button>' +
        '</div></div></div>';

      /* ── 본문 종합 (펼쳐지는 영역) ── */
      var bodyHtml =
        '<div style="padding:14px 18px 18px;border-top:1px solid rgba(0,0,0,.07);background:var(--hp-bg-card2,#f9fafb)">' +

        /* 원본 질문 전체 내용 */
        '<div style="font-size:11px;font-weight:800;color:var(--hp-text-muted);letter-spacing:.5px;margin-bottom:10px">전체 내용</div>' +

        /* Q 카드 */
        '<div style="display:grid;grid-template-columns:auto 1fr;gap:0;border-radius:10px;overflow:hidden;border:1px solid rgba(99,102,241,.2);margin-bottom:5px">' +
        '<div style="background:#6366f1;display:flex;align-items:flex-start;justify-content:center;width:32px;padding:12px 0">' +
        '<span style="font-size:13px;font-weight:900;color:#fff">Q</span>' +
        '</div>' +
        '<div style="padding:11px 13px;background:rgba(99,102,241,.04)">' +
        '<div style="font-size:11px;color:#6366f1;font-weight:700;margin-bottom:6px">' + _qaEsc(it.author||'익명') + ' · ' + (it.regDate||'') + '</div>' +
        '<div style="font-size:14px;color:var(--hp-text);line-height:1.8;white-space:pre-wrap">' + _qaEsc(it.content||'') + '</div>' +
        '</div></div>' +

        /* A 카드 – 모든 관리자 답변을 하나의 카드에 통합 / 없으면 '답변 준비중' */
        '<div style="display:grid;grid-template-columns:auto 1fr;gap:0;border-radius:10px;overflow:hidden;border:1px solid ' + (replies.length ? 'rgba(139,92,246,.2)' : 'rgba(0,0,0,.08)') + ';margin-bottom:12px">' +
        '<div style="background:' + (replies.length ? '#8b5cf6' : '#94a3b8') + ';display:flex;align-items:flex-start;justify-content:center;width:32px;padding:12px 0">' +
        '<span style="font-size:13px;font-weight:900;color:#fff">A</span>' +
        '</div>' +
        '<div style="padding:11px 13px;background:' + (replies.length ? 'rgba(139,92,246,.04)' : 'rgba(0,0,0,.02)') + '">' +
        (replies.length
          ? replies.map(function(r, ri) {
              return (ri > 0 ? '<div style="border-top:1px dashed rgba(139,92,246,.2);margin:10px 0"></div>' : '') +
                '<div style="font-size:11px;color:#8b5cf6;font-weight:700;margin-bottom:6px">' + _qaEsc(r.author||'관리자') + ' · ' + (r.date||'') + '</div>' +
                '<div style="font-size:14px;color:var(--hp-text);line-height:1.8;white-space:pre-wrap">' + _qaEsc(r.content||'') + '</div>';
            }).join('')
          : '<div style="display:flex;align-items:center;gap:8px;padding:2px 0">' +
            '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' +
            '<span style="font-size:13px;color:var(--hp-text-muted)">답변 준비중</span></div>') +
        '</div></div>' +

        /* 재질문·재답변 스레드 */
        (threads.length
          ? '<div style="border-top:1px solid rgba(0,0,0,.08);padding-top:14px;margin-bottom:14px">' +
            '<div style="font-size:11px;font-weight:800;color:var(--hp-text-muted);margin-bottom:12px">&#128172; 추가 Q&amp;A</div>' +
            threadsHtml + '</div>'
          : '') +
        /* 재질문 폼 */
        reQForm +
        '</div>';

      return '<div class="hp-qna-item" style="border-bottom:1px solid rgba(0,0,0,.07)">' +

        /* ── 헤더(항상 보임): Q/A 쌍 카드 ── */
        '<div style="padding:16px 18px;cursor:pointer;transition:background .15s" ' +
        'onmouseover="this.style.background=\'rgba(139,92,246,.03)\'" onmouseout="this.style.background=\'\'">' +

        /* 메타 정보 줄 */
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">' +
        '<span style="font-size:11px;font-weight:700;background:#8b5cf620;color:#8b5cf6;padding:2px 8px;border-radius:4px">Q&amp;A</span>' +
        '<span style="font-size:12px;color:var(--hp-text-muted)">' + _qaEsc(it.author||'익명') + ' · ' + (it.regDate||'') + '</span>' +
        '<span style="font-size:12px;color:var(--hp-text-muted);margin-left:auto">&#128065; ' + (it.views||0) + '</span>' +
        '<span style="font-size:12px;color:#8b5cf6;margin-left:8px">&#128172; ' + totalCount + '</span>' +
        (replies.length ? '<span style="font-size:11px;background:#22c55e20;color:#22c55e;padding:1px 7px;border-radius:10px;margin-left:6px">답변완료</span>' : '<span style="font-size:11px;background:#f59e0b20;color:#f59e0b;padding:1px 7px;border-radius:10px;margin-left:6px">답변대기</span>') +
        '</div>' +

        /* Q 영역 */
        '<div onclick="hpQnaToggle(\'' + it.id + '\')" ' +
        'style="display:grid;grid-template-columns:auto 1fr;gap:0;border-radius:10px;overflow:hidden;border:1px solid rgba(99,102,241,.15);margin-bottom:6px">' +

        '<div style="background:#6366f1;display:flex;align-items:center;justify-content:center;width:36px;padding:14px 0">' +
        '<span style="font-size:14px;font-weight:900;color:#fff">Q</span>' +
        '</div>' +
        '<div style="padding:12px 14px;background:rgba(99,102,241,.04)">' +
        '<div style="font-size:14px;font-weight:700;color:var(--hp-text);margin-bottom:4px">' + _qaEsc(it.title) + '</div>' +
        '<div style="font-size:12px;color:var(--hp-text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:600px">' + _qaEsc((it.content||'').split('\n')[0]) + '</div>' +
        '</div></div>' +

        /* A 영역 - 실제 답변이 있을 때만 표시 */
        (replies.length
          ? '<div onclick="hpQnaToggle(\'' + it.id + '\')" ' +
            'style="display:grid;grid-template-columns:auto 1fr;gap:0;border-radius:10px;overflow:hidden;border:1px solid rgba(139,92,246,.2);margin-bottom:6px">' +
            '<div style="background:#8b5cf6;display:flex;align-items:center;justify-content:center;width:36px;padding:14px 0">' +
            '<span style="font-size:14px;font-weight:900;color:#fff">A</span>' +
            '</div>' +
            '<div style="padding:12px 14px;background:rgba(139,92,246,.04)">' +
            '<div style="font-size:13px;color:var(--hp-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:600px">' + _qaEsc((replies[0].content||'').split('\n')[0]) + '</div>' +
            '<div style="font-size:11px;color:#8b5cf6;margin-top:3px">' + _qaEsc(replies[0].author||'관리자') + ' · ' + (replies[0].date||'') + (replies.length > 1 ? ' 외 ' + (replies.length-1) + '개' : '') + '</div>' +
            '</div></div>'
          : '') +

        /* 펼치기 힌트 */
        '<div onclick="hpQnaToggle(\'' + it.id + '\')" style="display:flex;align-items:center;justify-content:center;padding:6px 0;cursor:pointer">' +
        '<span id="hp-qna-arr-' + it.id + '" style="font-size:11px;color:var(--hp-text-muted);transition:transform .25s">&#9660; 전체보기 / 재질문</span>' +
        '</div>' +

        '</div>' + /* /헤더 */

        /* ── 펼쳐지는 본문 영역 ── */
        '<div id="hp-qna-bd-' + it.id + '" style="max-height:0px;overflow:hidden;transition:max-height .4s ease">' + bodyHtml + '</div>' +
        '</div>';
    }).join('');
  }

  /* ── 질문 작성 폼 토글 ── */
  window.hpQnaToggleWrite = function() {
    var form = document.getElementById('hp-qna-write-form');
    var btn  = document.getElementById('hp-qna-write-btn');
    if (!form) return;
    var isOpen = form.style.maxHeight && form.style.maxHeight !== '0px';
    if (isOpen) {
      form.style.maxHeight = '0px';
      form.style.overflow  = 'hidden';
      if (btn) btn.innerHTML = '&#10067; 질문하기';
    } else {
      form.style.overflow  = 'visible';
      form.style.maxHeight = form.scrollHeight + 400 + 'px';
      if (btn) btn.innerHTML = '&#10005; 닫기';
      /* 제목 필드로 포커스 */
      setTimeout(function() {
        var t = document.getElementById('hp-qna-w-title');
        if (t) t.focus();
      }, 300);
    }
  };

  /* ── 새 질문 등록 ── */
  window.hpQnaPost = function() {
    var g = function(id){ var e=document.getElementById(id); return e ? e.value.trim() : ''; };
    var author  = g('hp-qna-w-author')  || '익명';
    var title   = g('hp-qna-w-title');
    var content = g('hp-qna-w-content');
    var pwd     = g('hp-qna-w-pwd');
    if (!title)   { alert('질문 제목을 입력하세요.'); return; }
    if (!content) { alert('질문 내용을 입력하세요.'); return; }
    var all = _qaAll();
    all.unshift({
      id:      'brd' + Date.now(),
      cat:     'qna',
      title:   title,
      content: content,
      author:  author,
      pwd:     pwd,
      regDate: _qaNow(),
      views:   0,
      replies: [],
      threads: []
    });
    _qaSave(all);
    /* 입력 초기화 */
    ['hp-qna-w-author','hp-qna-w-title','hp-qna-w-content','hp-qna-w-pwd'].forEach(function(id){
      var e = document.getElementById(id); if (e) e.value = '';
    });
    window.hpQnaToggleWrite();
    _qaRerender();
  };

  /* ── 펼치기/접기 ── */
  window.hpQnaToggle = function(id) {
    var bd  = document.getElementById('hp-qna-bd-'  + id);
    var arr = document.getElementById('hp-qna-arr-' + id);
    if (!bd) return;
    var isOpen = bd.style.maxHeight && bd.style.maxHeight !== '0px';
    if (isOpen) {
      bd.style.maxHeight = '0px'; bd.style.overflow = 'hidden';
      if (arr) { arr.innerHTML = '&#9660; 전체보기 / 재질문'; arr.style.opacity = '1'; }
    } else {
      var all = _qaAll();
      for (var i=0;i<all.length;i++) { if(all[i].id===id){ all[i].views=(all[i].views||0)+1; break; } }
      _qaSave(all);
      bd.style.overflow = 'visible';
      bd.style.maxHeight = bd.scrollHeight + 800 + 'px';
      if (arr) { arr.innerHTML = '&#9650; 접기'; arr.style.color = '#8b5cf6'; }
    }
  };

  /* ── 재질문 등록 ── */
  window.hpQnaReQ = function(postId) {
    var g = function(elId){ var e=document.getElementById(elId); return e ? e.value.trim() : ''; };
    var content = g('rq-content-' + postId);
    if (!content) { alert('재질문 내용을 입력하세요.'); return; }
    var all = _qaAll();
    for (var i=0;i<all.length;i++) {
      if (all[i].id===postId) {
        if (!all[i].threads) all[i].threads = [];
        all[i].threads.push({
          type: 'q',
          author:  g('rq-author-' + postId) || '익명',
          content: content,
          pwd:     g('rq-pwd-'    + postId),
          date:    _qaNow(),
          answer:  null
        });
        break;
      }
    }
    _qaSave(all);
    var wasOpen = _qaIsOpen(postId);
    _qaRerender();
    if (wasOpen) _qaReopen(postId);
  };

  /* ── 재답변 등록 ── */
  window.hpQnaReA = function(postId, ti) {
    var g = function(elId){ var e=document.getElementById(elId); return e ? e.value.trim() : ''; };
    var sfx = postId + '-' + ti;
    var content = g('ra-content-' + sfx);
    if (!content) { alert('재답변 내용을 입력하세요.'); return; }
    var all = _qaAll();
    for (var i=0;i<all.length;i++) {
      if (all[i].id===postId && all[i].threads && all[i].threads[ti]) {
        all[i].threads[ti].answer = {
          author:  g('ra-author-' + sfx) || '답변자',
          content: content,
          pwd:     g('ra-pwd-'    + sfx),
          date:    _qaNow()
        };
        break;
      }
    }
    _qaSave(all);
    var wasOpen = _qaIsOpen(postId);
    _qaRerender();
    if (wasOpen) _qaReopen(postId);
  };

  /* ── 재질문 삭제 ── */
  window.hpQnaDelThread = function(postId, ti) {
    var pwd = prompt('비밀번호를 입력하세요 (없으면 빈칸)');
    if (pwd === null) return;
    var all = _qaAll();
    for (var i=0;i<all.length;i++) {
      if (all[i].id===postId && all[i].threads) {
        var t = all[i].threads[ti];
        if (t && (t.pwd===pwd || (!t.pwd && pwd===''))) {
          all[i].threads.splice(ti, 1);
          _qaSave(all);
          var wasOpen = _qaIsOpen(postId);
          _qaRerender();
          if (wasOpen) _qaReopen(postId);
        } else { alert('비밀번호가 틀렸습니다.'); }
        break;
      }
    }
  };

  function _qaIsOpen(id) {
    var bd = document.getElementById('hp-qna-bd-' + id);
    return !!(bd && bd.style.maxHeight && bd.style.maxHeight !== '0px');
  }
  function _qaReopen(id) {
    var bd  = document.getElementById('hp-qna-bd-'  + id);
    var arr = document.getElementById('hp-qna-arr-' + id);
    if (bd)  { bd.style.overflow='visible'; bd.style.maxHeight = bd.scrollHeight + 800 + 'px'; }
    if (arr) arr.style.transform = 'rotate(90deg)';
  }

  window._qaRerender = _qaRerender;

}());
