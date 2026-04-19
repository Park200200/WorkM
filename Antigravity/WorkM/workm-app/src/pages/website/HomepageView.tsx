import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Sun, Moon, Pencil, FileText, Pin, Lightbulb, MessageCircle, ClipboardList, Search, CheckCircle2, Send, AlertTriangle, Paperclip } from 'lucide-react'
import './homepage-view.css'

/* ══════════════════════════════════════════════
   HomepageView — 관리자 설정 기반 반응형 홈페이지
   localStorage 에서 설정을 읽어 동적 렌더링
   ══════════════════════════════════════════════ */

/* ── 타입 ── */
interface McItem { imgH: string; imgV: string; text1: string; text2: string; text3: string; url: string; blank: boolean }
interface McLine { type: 'image' | 'solution'; duration: number; items: McItem[]; solution: string }

/* 메뉴 등록 타입 */
interface SubRow { label: string; url: string; blank: boolean }
interface SubSet { name: string; type: 'image' | 'solution'; rows: SubRow[]; solutions: string[] }
interface MenuDetail { sets: SubSet[] }
interface MenuRegData { items: string[]; details: Record<number, MenuDetail> }

interface HpSettings {
  siteName: string; domain: string; email: string; phone: string
  logoTopH: string; logoTopV: string; logoBotH: string; logoBotV: string
  logoTopHW: string; logoTopVW: string; logoBotHW: string; logoBotVW: string
  rivetBg: string; rivetFontSize: number; rivetFontColor: string
  rivetFontWeight: number; rivetAlign: string; rivetTags: string[]
  menuBg: string; menuFc: string; menuFs: number; menuH: number
  menuOpacity: number; menuAlign: string; menuGap: number; menuFw: number
  menuPadX: number
  menuItems: string[]
  mcLines: McLine[]
  footerBg: string; footerHeight: number; footerOpacity: number
  ftBg: string; ftFc: string; ftFs: number; ftHeight: number
  ftOpacity: number; ftAlign: string; ftText: string
  cpBg: string; cpFc: string; cpFs: number; cpHeight: number
  cpOpacity: number; cpAlign: string; cpText: string
}

function getLS<T>(key: string, fb: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb } catch { return fb }
}

const SOLUTION_LABELS: Record<string, string> = {
  '컨텐츠관리': '📰 컨텐츠 관리', '미디어관리': '🖼️ 미디어 관리',
  '개인정보처리방침': '🔒 개인정보처리방침', '게시물 게재 원칙': '📜 게시물 게재 원칙',
  '홈페이지 이용약관': '📋 홈페이지 이용약관', '공지사항': '📢 공지사항',
  '뉴스': '📰 뉴스', '자유게시판': '💬 자유게시판', 'Q&A': '❓ Q&A',
  'FAQ': '📋 FAQ', '가맹점신청': '🏪 가맹점 신청',
  '워크샵': '🏕️ 워크샵', '대관(교육관)': '🏛️ 대관',
  terms: '📋 이용약관', privacy: '🔒 개인정보 취급방침',
  content: '📰 컨텐츠관리', gallery: '🖼️ 미디어 자료',
  board: '💬 게시판', notice: '📢 공지사항', news: '📰 뉴스',
  qna: '❓ Q&A', faq: '📋 FAQ', franchise: '🏪 가맹점 신청',
  workshop: '🏕️ 워크샵', venue: '🏛️ 대관(교육관)',
}

interface SubItem { name: string; url: string; blank: boolean; isSolution?: boolean; solutionIds?: string[] }

/* ═══════════════════════════════════
   캐러셀 컴포넌트
   ═══════════════════════════════════ */
function Carousel({ items, duration }: { items: McItem[]; duration: number }) {
  const [cur, setCur] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const valid = items.filter(it => (it.imgH || '').length > 4 || (it.imgV || '').length > 4)

  const go = useCallback((n: number) => {
    setCur((n % valid.length + valid.length) % valid.length)
  }, [valid.length])

  useEffect(() => {
    if (valid.length <= 1) return
    timerRef.current = setInterval(() => setCur(p => (p + 1) % valid.length), duration * 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [valid.length, duration])

  if (!valid.length) return null

  return (
    <div className="hp-carousel" style={{ aspectRatio: '16/7', maxHeight: '75vh' }}>
      {valid.map((item, i) => {
        const hasH = (item.imgH || '').length > 4
        const hasV = (item.imgV || '').length > 4
        const hasText = item.text1 || item.text2 || item.text3
        const content = (
          <>
            {hasH && <img className="hp-cs-img-h" src={item.imgH} alt="" loading="lazy" />}
            {hasV && <img className="hp-cs-img-v" src={item.imgV} alt="" loading="lazy" />}
            {!hasH && !hasV && null}
            {hasText && (
              <div className="hp-cs-overlay">
                <div className="hp-cs-overlay-inner">
                  {item.text1 && <span className="hp-cs-tag">{item.text1}</span>}
                  {item.text2 && <div className="hp-cs-title">{item.text2}</div>}
                  {item.text3 && <div className="hp-cs-desc">{item.text3}</div>}
                </div>
              </div>
            )}
          </>
        )
        return (
          <div key={i} className={`hp-carousel-slide ${i === cur ? 'active' : ''}`}>
            {item.url ? (
              <a href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                target={item.blank ? '_blank' : '_self'} rel="noopener noreferrer" className="hp-cs-link">
                {content}
              </a>
            ) : content}
          </div>
        )
      })}
      {valid.length > 1 && (
        <>
          <button className="hp-carousel-arrow prev" onClick={() => go(cur - 1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button className="hp-carousel-arrow next" onClick={() => go(cur + 1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <div className="hp-carousel-dots">
            {valid.map((_, i) => (
              <button key={i} className={`hp-carousel-dot ${i === cur ? 'active' : ''}`} onClick={() => go(i)} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ═══════════════════════════════════
   메인 컴포넌트
   ═══════════════════════════════════ */
export function HomepageView() {
  const [s, setS] = useState<HpSettings | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [menuReg, setMenuReg] = useState<MenuRegData>({ items: [], details: {} })
  const [hoveredMenu, setHoveredMenu] = useState<number | null>(null)
  const [activeSolution, setActiveSolution] = useState<string | null>(null)
  const [activeSolName, setActiveSolName] = useState<string | null>(null)
  const megaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const data = getLS<HpSettings | null>('hp_basic_settings', null)
    setS(data)
    setMenuReg(getLS<MenuRegData>('hp_menu_reg', { items: [], details: {} }))
    const saved = localStorage.getItem('hp_website_theme')
    if (saved === 'dark') setTheme('dark')
    document.title = data?.siteName ? `${data.siteName} - 홈페이지` : 'WorkM Homepage'
  }, [])

  /* 서브메뉴 헬퍼 */
  const getSubItems = (menuIdx: number): SubItem[] => {
    const detail = menuReg.details[menuIdx]
    if (!detail?.sets?.length) return []
    const subs: SubItem[] = []
    detail.sets.forEach(set => {
      if (set.type === 'solution' && set.solutions?.length) {
        // 솔루션형: 각 솔루션을 개별 서브메뉴로
        set.solutions.forEach(solId => {
          subs.push({
            name: (set.solutions!.length === 1 && set.name) ? set.name : solId,
            url: '#',
            blank: false,
            isSolution: true,
            solutionIds: [solId],
          })
        })
      } else if (set.name) {
        subs.push({ name: set.name, url: set.rows?.[0]?.url || '#', blank: set.rows?.[0]?.blank || false })
      }
    })
    return subs
  }
  const hasAnySub = Object.keys(menuReg.details).some(k => (menuReg.details[Number(k)]?.sets?.length || 0) > 0)

  const showMega = (idx: number) => {
    if (megaTimerRef.current) clearTimeout(megaTimerRef.current)
    setHoveredMenu(idx)
  }
  const hideMega = () => {
    megaTimerRef.current = setTimeout(() => setHoveredMenu(null), 180)
  }

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('hp_website_theme', next)
  }

  if (!s) return (
    <div className="hp-view" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>⚙️</div>
        <div style={{ fontSize:18, fontWeight:700 }}>홈페이지 설정이 없습니다</div>
        <div style={{ fontSize:14, color:'#94a3b8', marginTop:8 }}>관리자 패널에서 기본설정을 먼저 저장해주세요</div>
      </div>
    </div>
  )

  const menuItems = s.menuItems?.length ? s.menuItems : ['홈', '회사소개', '서비스', '포트폴리오', '공지사항', '문의하기']
  const menuBgRgba = (() => {
    const op = (s.menuOpacity ?? 100) / 100
    const hex = s.menuBg || '#ffffff'
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16)
    return `rgba(${r},${g},${b},${op})`
  })()

  const alignToJC = (a: string) => {
    if (a === 'left' || a === 'flex-start') return 'flex-start'
    if (a === 'right' || a === 'flex-end') return 'flex-end'
    if (a === 'space-between') return 'space-between'
    return 'center'
  }

  return (
    <div className="hp-view" data-hp-theme={theme}>

      {/* ═══ 1. 리벳 바 ═══ */}
      {s.rivetTags?.length > 0 && (
        <div className="hp-rivet hp-fade-in" style={{
          background: s.rivetBg || '#1e40af',
          color: s.rivetFontColor || '#fff',
          fontSize: `${s.rivetFontSize || 13}px`,
          fontWeight: s.rivetFontWeight || 400,
          justifyContent: alignToJC(s.rivetAlign),
        }}>
          {s.rivetTags.map((t, i) => (
            <span key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
              {i > 0 && <span className="hp-rivet-dot" />}
              <span>{t}</span>
            </span>
          ))}
        </div>
      )}

      {/* ═══ 2. 헤더 ═══ */}
      <header className="hp-header" ref={headerRef} style={{
        background: menuBgRgba,
        minHeight: `${s.menuH || 64}px`,
        top: s.rivetTags?.length > 0 ? '36px' : '0',
        backdropFilter: `blur(${Math.round((s.menuOpacity ?? 100) / 100 * 14)}px)`,
      }}>
        {/* 로고 */}
        <div className="hp-header-logo">
          {s.logoTopH ? (
            <img src={s.logoTopH} alt="Logo" className="hp-cs-img-h"
              style={s.logoTopHW ? { width:`${s.logoTopHW}px`, height:'auto', maxHeight:'44px' } : undefined} />
          ) : null}
          {s.logoTopV ? (
            <img src={s.logoTopV} alt="Logo" className="hp-cs-img-v"
              style={s.logoTopVW ? { width:`${s.logoTopVW}px`, height:'auto', maxHeight:'44px' } : undefined} />
          ) : null}
          {!s.logoTopH && !s.logoTopV && <span className="hp-logo-text">{s.siteName || 'WorkM'}</span>}
        </div>

        {/* 데스크탑 메뉴 */}
        <nav className="hp-header-nav" ref={navRef} style={{
          justifyContent: alignToJC(s.menuAlign),
          gap: `${s.menuGap || 28}px`,
          paddingLeft: `${s.menuPadX || 0}px`,
          paddingRight: `${s.menuPadX || 0}px`,
        }}>
          {menuItems.map((name, i) => (
            <a key={i} href="#" style={{
              fontSize: `${s.menuFs || 15}px`,
              color: s.menuFc || '#1a1a2e',
              fontWeight: s.menuFw || 600,
              cursor: 'default',
            }}
              onClick={(e) => e.preventDefault()}
              onMouseEnter={() => showMega(i)}
              onMouseLeave={hideMega}
            >{name}</a>
          ))}
        </nav>

        {/* 모바일 메뉴 버튼 */}
        <button className={`hp-mobile-btn ${drawerOpen ? 'active' : ''}`}
          onClick={() => setDrawerOpen(!drawerOpen)}>
          <span style={{ background: s.menuFc || '#1a1a2e' }} />
          <span style={{ background: s.menuFc || '#1a1a2e' }} />
          <span style={{ background: s.menuFc || '#1a1a2e' }} />
        </button>
      </header>

      {/* 메가메뉴 드롭다운 — 헤더 바로 아래 붙임 */}
      {hasAnySub && hoveredMenu !== null && (() => {
        // 각 메인메뉴 링크의 left 좌표 계산
        const navLinks = navRef.current?.querySelectorAll('a') || []
        const positions: number[] = []
        navLinks.forEach(a => { positions.push(a.getBoundingClientRect().left) })
        const maxSubs = Math.max(...menuItems.map((_, mi) => getSubItems(mi).length), 0)

        return (
          <div
            className="hp-mega-panel"
            style={{
              position: 'fixed',
              left: 0, right: 0,
              top: headerRef.current?.getBoundingClientRect().bottom ?? ((s.rivetTags?.length > 0 ? 36 : 0) + (s.menuH || 64)),
              background: menuBgRgba,
              backdropFilter: 'blur(16px)',
              borderTop: '1px solid rgba(128,128,128,.08)',
              boxShadow: '0 12px 40px rgba(0,0,0,.15)',
              zIndex: 88,
              minHeight: maxSubs * 30 + 32,
            }}
            onMouseEnter={() => showMega(hoveredMenu)}
            onMouseLeave={hideMega}
          >
            <div style={{ position: 'relative', width: '100%', height: '100%', padding: '14px 0 18px' }}>
              {menuItems.map((_, mi) => {
                const subs = getSubItems(mi)
                if (!subs.length) return null
                const leftPos = positions[mi] ?? 0
                return (
                  <div key={mi} style={{
                    position: 'absolute',
                    top: 14,
                    left: leftPos,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    textAlign: 'left',
                  }}>
                    {subs.map((sub, si) => {
                      const hasAction = sub.isSolution || (sub.url && sub.url !== '#')
                      return (
                      <a key={si} href={sub.isSolution ? undefined : (hasAction ? sub.url : undefined)}
                        target={sub.blank ? '_blank' : '_self'}
                        rel="noopener noreferrer"
                        style={{
                          fontSize: `${Math.max((s.menuFs || 15) - 2, 12)}px`,
                          color: s.menuFc || '#1a1a2e',
                          fontWeight: 400,
                          opacity: hasAction ? .7 : .35,
                          padding: '5px 0',
                          transition: 'opacity .15s, padding-left .15s',
                          whiteSpace: 'nowrap',
                          display: 'block',
                          cursor: hasAction ? 'pointer' : 'default',
                          pointerEvents: hasAction ? 'auto' : 'none',
                        }}
                        onClick={sub.isSolution ? (e) => { e.preventDefault(); setActiveSolution(sub.solutionIds?.[0] || null); setActiveSolName(sub.name); setHoveredMenu(null) } : undefined}
                        onMouseEnter={e => { if (hasAction) { (e.target as HTMLElement).style.opacity = '1'; (e.target as HTMLElement).style.paddingLeft = '6px' } }}
                        onMouseLeave={e => { if (hasAction) { (e.target as HTMLElement).style.opacity = '.7'; (e.target as HTMLElement).style.paddingLeft = '0' } }}
                      >{sub.name}</a>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* 모바일 드로어 */}
      <div className={`hp-mobile-overlay ${drawerOpen ? 'active' : ''}`} onClick={() => setDrawerOpen(false)} />
      <div className={`hp-mobile-drawer ${drawerOpen ? 'active' : ''}`}>
        {menuItems.map((name, i) => {
          const subs = getSubItems(i)
          return (
            <div key={i}>
              <a href="#" onClick={() => setDrawerOpen(false)}>{name}</a>
              {subs.map((sub, si) => {
                const hasAction = sub.isSolution || (sub.url && sub.url !== '#')
                return (
                <a key={si} href={sub.isSolution ? undefined : (hasAction ? sub.url : undefined)}
                  target={sub.blank ? '_blank' : '_self'}
                  style={{ paddingLeft: 24, fontSize: 14, fontWeight: 400, opacity: hasAction ? .7 : .35, cursor: hasAction ? 'pointer' : 'default', pointerEvents: hasAction ? 'auto' : 'none' }}
                  onClick={() => { if (sub.isSolution) { setActiveSolution(sub.solutionIds?.[0] || null); setActiveSolName(sub.name) } setDrawerOpen(false) }}
                >{sub.name}</a>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* ═══ 3. 메인 컨텐츠 ═══ */}
      <main style={{ paddingTop: (s.rivetTags?.length > 0 ? 36 : 0) + (s.menuH || 64) }}>
        {activeSolution ? (
          <SolutionPage solId={activeSolution} siteName={s.siteName || 'WorkM'} displayName={activeSolName} onBack={() => { setActiveSolution(null); setActiveSolName(null) }} />
        ) : (!s.mcLines || s.mcLines.length === 0) ? (
          <div className="hp-hero hp-fade-in">
            <div>
              <h1>{s.siteName || 'WorkM'}</h1>
              <p>고객과 함께 성장하는 최고의 파트너</p>
            </div>
          </div>
        ) : (
          s.mcLines.map((line, i) => {
            if (line.type === 'image') {
              return <Carousel key={i} items={line.items || []} duration={line.duration || 5} />
            }
            return (
              <div key={i} className="hp-solution-section hp-fade-in"
                style={{ cursor: 'pointer' }}
                onClick={() => { setActiveSolution(line.solution); setActiveSolName(null) }}
              >
                <h2>{SOLUTION_LABELS[line.solution] || line.solution || '솔루션'}</h2>
                <p style={{ fontSize: 14, opacity: .6 }}>클릭하여 상세 페이지로 이동</p>
              </div>
            )
          })
        )}
      </main>

      {/* ═══ 4. 푸터 ═══ */}
      {/* 하단 로고박스 */}
      <div className="hp-footer-logo" style={{
        background: s.footerBg || '#1a1a2e',
        height: `${s.footerHeight || 120}px`,
        opacity: (s.footerOpacity ?? 100) / 100,
      }}>
        {s.logoBotH && <img src={s.logoBotH} alt="" style={s.logoBotHW ? { width:`${s.logoBotHW}px`, height:'auto' } : undefined} />}
        {s.logoBotV && <img src={s.logoBotV} alt="" style={s.logoBotVW ? { width:`${s.logoBotVW}px`, height:'auto' } : undefined} />}
        {!s.logoBotH && !s.logoBotV && <span style={{ color:'rgba(255,255,255,.3)', fontSize:14 }}>하단 로고 미등록</span>}
      </div>

      {/* 하단 텍스트 */}
      <div className="hp-footer-text" style={{
        background: s.ftBg || '#0a0a1a',
        minHeight: `${s.ftHeight || 80}px`,
        opacity: (s.ftOpacity ?? 100) / 100,
        justifyContent: alignToJC(s.ftAlign),
      }}>
        <div style={{
          fontSize: `${s.ftFs || 12}px`,
          color: s.ftFc || '#64748b',
          textAlign: (s.ftAlign as any) || 'center',
          lineHeight: 1.7,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {s.ftText || `© ${new Date().getFullYear()} ${s.siteName || 'WorkM'}. All rights reserved.`}
        </div>
      </div>

      {/* 카피라이트 */}
      <div className="hp-copyright" style={{
        background: s.cpBg || '#050510',
        minHeight: `${s.cpHeight || 48}px`,
        opacity: (s.cpOpacity ?? 100) / 100,
        justifyContent: alignToJC(s.cpAlign),
      }}>
        <div style={{
          fontSize: `${s.cpFs || 11}px`,
          color: s.cpFc || '#475569',
          textAlign: (s.cpAlign as any) || 'center',
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {s.cpText || `© ${new Date().getFullYear()} ${s.siteName || 'WorkM'}. All rights reserved.`}
        </div>
      </div>

      {/* ═══ 테마 토글 ═══ */}
      <button className="hp-theme-btn" onClick={toggleTheme} title="테마 변경">
        {theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}
      </button>
    </div>
  )
}

/* ═══════════════════════════════════
   솔루션 페이지 컴포넌트
   ═══════════════════════════════════ */
function SolutionPage({ solId: rawSolId, siteName, displayName, onBack }: { solId: string; siteName: string; displayName?: string | null; onBack: () => void }) {
  /* 한글 솔루션 ID → 영문 정규화 */
  const SOL_NORMALIZE: Record<string, string> = {
    '공지사항': 'notice', '뉴스': 'news', '자유게시판': 'board',
    'Q&A': 'qna', 'FAQ': 'faq', '가맹점신청': 'franchise',
    '워크샵': 'workshop', '대관(교육관)': 'venue',
    '컨텐츠관리': 'content', '미디어관리': 'gallery',
    '개인정보처리방침': 'privacy', '홈페이지 이용약관': 'terms',
    '게시물 게재 원칙': 'postpolicy',
  }
  const solId = SOL_NORMALIZE[rawSolId] || rawSolId
  const title = displayName || SOLUTION_LABELS[solId] || SOLUTION_LABELS[rawSolId] || rawSolId
  // 솔루션별 색상
  const colorMap: Record<string, string> = {
    terms: '#6366f1', privacy: '#8b5cf6', content: '#2563eb',
    gallery: '#f59e0b', board: '#06b6d4', notice: '#ef4444',
    news: '#22c55e', qna: '#f97316', faq: '#14b8a6',
    franchise: '#ec4899', workshop: '#10b981', venue: '#7c3aed',
    postpolicy: '#64748b',
  }
  const accentColor = colorMap[solId] || '#6366f1'

  const renderContent = () => {
    switch (solId) {
      case 'terms': {
        const data = getLS<{ tos?: string }>('hp_terms', {})
        return data.tos
          ? <div style={{ lineHeight: 1.8, fontSize: 14 }} dangerouslySetInnerHTML={{ __html: data.tos }} />
          : <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 0' }}>이용약관이 등록되지 않았습니다.</p>
      }
      case 'privacy': {
        const data = getLS<{ privacy?: string }>('hp_terms', {})
        return data.privacy
          ? <div style={{ lineHeight: 1.8, fontSize: 14 }} dangerouslySetInnerHTML={{ __html: data.privacy }} />
          : <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 0' }}>개인정보 취급방침이 등록되지 않았습니다.</p>
      }
      case 'notice': case 'news': case 'board': case 'qna': case 'faq': {
        const catMap: Record<string, string> = { notice: 'notice', news: 'news', board: 'free', qna: 'qna', faq: 'faq' }
        return <BoardSolutionView cat={catMap[solId] || 'free'} accent={accentColor} solId={solId} />
      }
      case 'franchise': case 'workshop': case 'venue': {
        return <ApplicationSolutionView solId={solId} accent={accentColor} />
      }
      case 'media': case 'gallery': {
        return <MediaSolutionView accent={accentColor} />
      }
      case 'content': {
        return <ContentSolutionView accent={accentColor} />
      }
      case 'postpolicy': {
        const data = getLS<{ post?: string }>('hp_terms', {})
        return data.post
          ? <div style={{ lineHeight: 1.8, fontSize: 14 }} dangerouslySetInnerHTML={{ __html: data.post }} />
          : <PostPolicySampleView />
      }
      default:
        return <p style={{ color: '#94a3b8', textAlign: 'center', padding: '60px 0', fontSize: 14 }}>해당 솔루션 페이지를 준비 중입니다.</p>
    }
  }

  return (
    <div style={{ padding: '40px 20px', minHeight: 400 }} className="hp-fade-in">
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* ═ 타이틀 박스: 컨러 폰트 + 박스 ═ */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          marginBottom: 28, paddingBottom: 18,
          borderBottom: `3px solid ${accentColor}`,
        }}>
          <button onClick={onBack} style={{
            padding: '5px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0',
            background: '#fff', color: '#475569', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', flexShrink: 0,
          }}>←</button>
          <h2 style={{
            fontSize: 20, fontWeight: 800, color: accentColor, margin: 0,
            letterSpacing: '-0.02em',
          }}>{title.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, '')}</h2>
        </div>
        {/* ═ 콘텐츠 ═ */}
        {renderContent()}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════
   게시판 솔루션 뷰 (쓰기 + 아코디언)
   ═══════════════════════════════════ */
function BoardSolutionView({ cat, accent, solId }: { cat: string; accent: string; solId: string }) {
  const [items, setItems] = useState<any[]>(() => {
    const all = getLS<any[]>('board_items', [])
    return all.filter((it: any) => it.cat === cat)
  })
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showWrite, setShowWrite] = useState(false)
  const [wTitle, setWTitle] = useState('')
  const [wAuthor, setWAuthor] = useState('')
  const [wContent, setWContent] = useState('')
  const [bSearch, setBSearch] = useState('')
  const [wSecret, setWSecret] = useState(false)
  const [wSecretPw, setWSecretPw] = useState('')
  const [secretPromptId, setSecretPromptId] = useState<string | null>(null)
  const [secretInput, setSecretInput] = useState('')
  const [secretError, setSecretError] = useState(false)
  const [unlockedIds] = useState<Set<string>>(() => new Set())

  const toggleExpand = (id: string) => {
    if (expandedId === id) { setExpandedId(null); return }
    const item = items.find((it: any) => it.id === id)
    if (item?.secret && item.secretPw && !unlockedIds.has(id)) {
      setSecretPromptId(id); setSecretInput(''); setSecretError(false)
      return
    }
    setExpandedId(id)
  }

  const handleSecretSubmit = () => {
    const item = items.find((it: any) => it.id === secretPromptId)
    if (item && secretInput === item.secretPw) {
      unlockedIds.add(secretPromptId!)
      setExpandedId(secretPromptId)
      setSecretPromptId(null); setSecretInput(''); setSecretError(false)
    } else {
      setSecretError(true)
    }
  }

  const handleWrite = () => {
    if (!wTitle.trim()) return
    const newItem: any = {
      id: 'bp' + Date.now(),
      cat,
      title: wTitle.trim(),
      content: wContent.trim(),
      author: wAuthor.trim() || '방문자',
      regDate: new Date().toISOString().slice(0, 10),
      views: 0,
    }
    if (solId === 'qna' && wSecret && wSecretPw.trim()) {
      newItem.secret = true
      newItem.secretPw = wSecretPw.trim()
    }
    const allItems = getLS<any[]>('board_items', [])
    const updated = [newItem, ...allItems]
    localStorage.setItem('board_items', JSON.stringify(updated))
    setItems(updated.filter((it: any) => it.cat === cat))
    setWTitle(''); setWAuthor(''); setWContent(''); setWSecret(false); setWSecretPw('')
    setShowWrite(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1.5px solid #e2e8f0', background: '#fff',
    fontSize: 14, outline: 'none', fontFamily: 'inherit',
  }

  return (
    <div>
      {/* FAQ/공지/뉴스: 검색창 / 그 외: 게시글 쓰기 버튼 */}
      {(solId === 'faq' || solId === 'notice' || solId === 'news') ? (
        <div style={{ marginBottom: 16, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input value={bSearch} onChange={e => setBSearch(e.target.value)}
            placeholder={solId === 'faq' ? 'FAQ 검색...' : solId === 'notice' ? '공지사항 검색...' : '뉴스 검색...'}
            style={{ width: '100%', padding: '10px 14px 10px 34px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', fontSize: 14, outline: 'none' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button onClick={() => setShowWrite(!showWrite)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 18px', borderRadius: 10, border: 'none',
            background: accent, color: '#fff', fontSize: 13, fontWeight: 700,
            cursor: 'pointer',
          }}>
            <Pencil size={14} style={{display:'inline'}}/> {solId === 'qna' ? '질문등록' : '게시글 쓰기'}
          </button>
        </div>
      )}

      {/* 게시글 쓰기 폼 */}
      {showWrite && (
        <div style={{
          background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 14,
          padding: 20, marginBottom: 20,
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: '#334155' }}>
            <Pencil size={15} style={{display:'inline',marginRight:4}}/> {solId === 'qna' ? '새 질문 등록' : '새 게시글 작성'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 2 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 3 }}>제목</label>
                <input value={wTitle} onChange={e => setWTitle(e.target.value)}
                  placeholder="제목을 입력하세요" style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 3 }}>작성자</label>
                <input value={wAuthor} onChange={e => setWAuthor(e.target.value)}
                  placeholder="이름" style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 3 }}>내용</label>
              <textarea value={wContent} onChange={e => setWContent(e.target.value)}
                rows={5} placeholder="내용을 입력하세요"
                style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            {solId === 'qna' && (
              <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap', padding:'10px 14px', borderRadius:10, background: wSecret ? '#fef2f2' : '#f0fdf4', border: `1.5px solid ${wSecret ? '#fecaca' : '#bbf7d0'}`, transition:'all .3s' }}>
                <span style={{ fontSize:13, fontWeight:600, color: wSecret ? '#94a3b8' : '#16a34a' }}>📢 오픈질문</span>
                <div onClick={() => setWSecret(!wSecret)} style={{ width:48, height:26, borderRadius:13, background: wSecret ? accent : '#d1d5db', position:'relative', cursor:'pointer', transition:'background .3s', flexShrink:0 }}>
                  <div style={{ width:22, height:22, borderRadius:'50%', background:'#fff', position:'absolute', top:2, left: wSecret ? 24 : 2, transition:'left .3s', boxShadow:'0 1px 3px rgba(0,0,0,.2)' }} />
                </div>
                <span style={{ fontSize:13, fontWeight:600, color: wSecret ? '#dc2626' : '#94a3b8' }}>🔒 비밀질문</span>
                <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:180, visibility: wSecret ? 'visible' : 'hidden', opacity: wSecret ? 1 : 0, transition:'opacity .3s' }}>
                  <input type="password" value={wSecretPw} onChange={e => setWSecretPw(e.target.value)}
                    placeholder="비밀번호 입력 (4자리 이상)"
                    style={{ ...inputStyle, padding:'8px 12px', fontSize:13, borderColor: wSecret ? '#fecaca' : '#e2e8f0', flex:1 }} />
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowWrite(false)} style={{
                padding: '8px 20px', borderRadius: 8, border: '1.5px solid #e2e8f0',
                background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>취소</button>
              <button onClick={handleWrite} style={{
                padding: '8px 20px', borderRadius: 8, border: 'none',
                background: accent, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}>등록</button>
            </div>
          </div>
        </div>
      )}

      {/* 게시글 리스트 (아코디언) */}
      {(() => {
        const filtered = bSearch
          ? items.filter(it => (it.title + ' ' + it.content + ' ' + (it.ans || '')).toLowerCase().includes(bSearch.toLowerCase()))
          : items
        if (filtered.length === 0) return (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 0', fontSize: 14 }}>등록된 게시글이 없습니다.</p>
        )
        return (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
          {filtered.map((it: any, i: number) => {
            const isOpen = expandedId === it.id
            return (
              <div key={it.id || i}>
                {/* 헤더 행 */}
                <div
                  onClick={() => toggleExpand(it.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '13px 16px',
                    borderBottom: '1px solid #f1f5f9',
                    cursor: 'pointer', transition: 'background .15s',
                    background: isOpen ? '#f8fafc' : 'transparent',
                  }}
                  onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = '#fafbfc' }}
                  onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: `${accent}18`, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0, fontSize: 14,
                  }}>
                    {it.featured ? <Pin size={14}/> : <FileText size={14}/>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {it.secret && <span style={{ marginRight: 4 }}>🔒</span>}{it.title}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                      {it.author || '관리자'} · {it.regDate || ''} · 조회 {it.views || 0}
                    </div>
                  </div>
                  <span style={{
                    color: '#94a3b8', fontSize: 18, flexShrink: 0,
                    transition: 'transform .2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                  }}>▾</span>
                </div>
                {/* 아코디언 본문 */}
                {/* 아코디언 본문 */}
                {isOpen && (
                  <div style={{
                    padding: '16px 20px 20px',
                    borderBottom: '1px solid #e2e8f0',
                    background: '#fcfcfd',
                    animation: 'hp-fade-in .25s ease',
                  }}>
                    {(solId === 'qna' || solId === 'faq') ? (
                      <div>
                        {/* Q 질문 */}
                        <div style={{ display:'flex', gap:12, marginBottom:16 }}>
                          <div style={{ width:36,height:36,borderRadius:'50%',flexShrink:0, background:'linear-gradient(135deg,#3b82f6,#2563eb)', color:'#fff',display:'flex',alignItems:'center',justifyContent:'center', fontSize:18,fontWeight:900,fontFamily:'serif' }}>Q</div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:11,color:'#94a3b8',marginBottom:4 }}>{it.author||'질문자'} · {it.regDate}</div>
                            <div style={{ fontSize:14,lineHeight:1.8,color:'#334155',whiteSpace:'pre-wrap' }}>{it.content||'(내용 없음)'}</div>
                            {it.files?.length > 0 && (
                              <div style={{ marginTop:10,display:'flex',flexWrap:'wrap',gap:6 }}>
                                {it.files.map((f:any,fi:number)=>(<div key={fi} style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 10px',borderRadius:8,background:'#f1f5f9',border:'1px solid #e2e8f0',fontSize:11,color:'#475569' }}><Paperclip size={11}/> {f.name||`첨부파일 ${fi+1}`}</div>))}
                              </div>
                            )}
                            {it.img && (<div style={{ marginTop:10 }}><img src={it.img} alt="" style={{ maxWidth:'100%',maxHeight:300,borderRadius:10,border:'1px solid #e2e8f0' }}/></div>)}
                          </div>
                        </div>
                        {/* A 답변 — FAQ는 ans 필드, Q&A는 replies 배열 */}
                        {solId === 'faq' && it.ans ? (
                          <div style={{ display:'flex',gap:12,padding:'16px 0' }}>
                            <div style={{ width:36,height:36,borderRadius:'50%',flexShrink:0, background:`linear-gradient(135deg,${accent},${accent}cc)`, color:'#fff',display:'flex',alignItems:'center',justifyContent:'center', fontSize:18,fontWeight:900,fontFamily:'serif' }}>A</div>
                            <div style={{ flex:1 }}>
                              <div style={{ fontSize:11,color:'#94a3b8',marginBottom:4 }}>관리자</div>
                              <div style={{ fontSize:14,lineHeight:1.8,color:'#334155',whiteSpace:'pre-wrap' }}>{it.ans}</div>
                            </div>
                          </div>
                        ) : solId === 'qna' ? (
                          <>
                            {it.replies?.length > 0 && it.replies.map((r:any,ri:number)=>(
                              <div key={ri} style={{ display:'flex',gap:12,marginTop:ri===0?0:12,padding:'16px 0',borderRadius:12,background:'transparent' }}>
                                <div style={{ width:36,height:36,borderRadius:'50%',flexShrink:0, background:`linear-gradient(135deg,${accent},${accent}cc)`, color:'#fff',display:'flex',alignItems:'center',justifyContent:'center', fontSize:18,fontWeight:900,fontFamily:'serif' }}>A</div>
                                <div style={{ flex:1 }}>
                                  <div style={{ fontSize:11,color:'#94a3b8',marginBottom:4 }}>{r.author||'관리자'} · {r.date||''}</div>
                                  <div style={{ fontSize:14,lineHeight:1.8,color:'#334155',whiteSpace:'pre-wrap' }}>{r.content}</div>
                                  {r.files?.length > 0 && (
                                    <div style={{ marginTop:10,display:'flex',flexWrap:'wrap',gap:6 }}>
                                      {r.files.map((f:any,fi:number)=>(<div key={fi} style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 10px',borderRadius:8,background:'#fff',border:'1px solid #e2e8f0',fontSize:11,color:'#475569' }}><Paperclip size={11}/> {f.name||`첨부파일 ${fi+1}`}</div>))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                            {(!it.replies||it.replies.length===0) && (
                              <div style={{ display:'flex',gap:12,padding:'16px 0' }}>
                                <div style={{ width:36,height:36,borderRadius:'50%',flexShrink:0, background:'#e2e8f0', color:'#94a3b8',display:'flex',alignItems:'center',justifyContent:'center', fontSize:18,fontWeight:900,fontFamily:'serif' }}>A</div>
                                <div style={{ flex:1,display:'flex',alignItems:'center' }}><span style={{ fontSize:13,color:'#94a3b8',fontStyle:'italic' }}>답변 준비 중입니다.</span></div>
                              </div>
                            )}
                          </>
                        ) : null}
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize:14,lineHeight:1.8,color:'#334155',whiteSpace:'pre-wrap',paddingLeft:44 }}>{it.content||'(내용 없음)'}</div>
                        {it.ans && (<div style={{ marginTop:14,marginLeft:44,padding:'12px 16px',background:`${accent}08`,borderRadius:10,borderLeft:`3px solid ${accent}` }}><div style={{ fontSize:12,fontWeight:700,color:accent,marginBottom:4,display:'flex',alignItems:'center',gap:4 }}><Lightbulb size={13}/> 답변</div><div style={{ fontSize:13,lineHeight:1.7,color:'#475569' }}>{it.ans}</div></div>)}
                        {it.replies?.length > 0 && (<div style={{ marginTop:14,marginLeft:44 }}><div style={{ fontSize:12,fontWeight:700,color:'#64748b',marginBottom:6,display:'flex',alignItems:'center',gap:4 }}><MessageCircle size={13}/> 댓글 ({it.replies.length})</div>{it.replies.map((r:any,ri:number)=>(<div key={ri} style={{ padding:'8px 0',borderBottom:'1px solid #f1f5f9',fontSize:13 }}><span style={{ fontWeight:600,color:'#475569' }}>{r.author}</span><span style={{ color:'#94a3b8',fontSize:11,marginLeft:8 }}>{r.date}</span><div style={{ marginTop:3,color:'#64748b',lineHeight:1.6 }}>{r.content}</div></div>))}</div>)}
                        {it.img && (<div style={{ marginTop:14,marginLeft:44 }}><img src={it.img} alt="" style={{ maxWidth:'100%',borderRadius:10,border:'1px solid #e2e8f0' }}/>{it.imgCap && <div style={{ fontSize:11,color:'#94a3b8',marginTop:4 }}>{it.imgCap}</div>}</div>)}
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        )
      })()}
      {/* 비밀번호 확인 모달 */}
      {secretPromptId && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, animation:'hp-fade-in .2s ease' }}
          onClick={() => setSecretPromptId(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:16, padding:'28px 32px', width:360, maxWidth:'90vw', boxShadow:'0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ fontSize:40, marginBottom:8 }}>🔒</div>
              <div style={{ fontSize:17, fontWeight:800, color:'#1e293b' }}>비밀질문입니다</div>
              <div style={{ fontSize:13, color:'#94a3b8', marginTop:4 }}>내용을 확인하려면 비밀번호를 입력하세요.</div>
            </div>
            <input type="password" value={secretInput} onChange={e => { setSecretInput(e.target.value); setSecretError(false) }}
              onKeyDown={e => e.key === 'Enter' && handleSecretSubmit()}
              placeholder="비밀번호 입력" autoFocus
              style={{ width:'100%', padding:'12px 16px', borderRadius:10, border: `2px solid ${secretError ? '#ef4444' : '#e2e8f0'}`, fontSize:15, outline:'none', textAlign:'center', letterSpacing:4, fontWeight:700, transition:'border-color .2s' }} />
            {secretError && (
              <div style={{ textAlign:'center', fontSize:12, color:'#ef4444', fontWeight:600, marginTop:6, animation:'hp-fade-in .2s ease' }}>비밀번호가 일치하지 않습니다.</div>
            )}
            <div style={{ display:'flex', gap:8, marginTop:16 }}>
              <button onClick={() => setSecretPromptId(null)} style={{ flex:1, padding:'10px', borderRadius:10, border:'1.5px solid #e2e8f0', background:'#fff', color:'#64748b', fontSize:14, fontWeight:600, cursor:'pointer' }}>취소</button>
              <button onClick={handleSecretSubmit} style={{ flex:1, padding:'10px', borderRadius:10, border:'none', background:accent, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>확인</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════
   신청서 솔루션 뷰 (작성 + 결과확인)
   ═══════════════════════════════════ */
function ApplicationSolutionView({ solId, accent }: { solId: string; accent: string }) {
  const typeMap: Record<string, string> = { franchise: 'franchise', workshop: 'workshop', venue: 'venue' }
  const labelMap: Record<string, string> = { franchise: '가맹점', workshop: '워크샵', venue: '대관' }
  const wsType = typeMap[solId] || 'workshop'
  const label = labelMap[solId] || '워크샵'

  const [tab, setTab] = useState<'write' | 'result'>('write')
  const [form, setForm] = useState({
    groupName: '', manager: '', phone: '', email: '',
    checkin: '', checkout: '', headcount: '',
    pwd: '', extras: [] as string[], inquiry: '',
  })
  const [resultPwd, setResultPwd] = useState('')
  const [resultName, setResultName] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  /* 관리자 준비물관리에서 설정한 리스트를 추가선택사항으로 사용 */
  const extraOptions = (() => {
    const allItems = getLS<any[]>('ws_items', [])
    const typeItems = allItems.filter((it: any) => it.type === wsType)
    const allPreps = typeItems.flatMap((it: any) => it.prepList || [])
    const uniquePreps = [...new Set(allPreps)] as string[]
    if (uniquePreps.length > 0) return uniquePreps
    // 펴백: 관리자가 설정한 준비물이 없으면 기본값
    return solId === 'workshop'
      ? ['명찰', '다과세트', '식당', '특강']
      : solId === 'venue'
        ? ['빔프로젝터', '마이크세트', '화이트보드', '다과']
        : []
  })()

  const toggleExtra = (e: string) => {
    setForm(f => ({
      ...f,
      extras: f.extras.includes(e) ? f.extras.filter(x => x !== e) : [...f.extras, e],
    }))
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1.5px solid #e2e8f0', background: '#fff',
    fontSize: 14, outline: 'none', fontFamily: 'inherit',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 700, color: '#6366f1', display: 'block', marginBottom: 4,
  }

  const handleSubmit = () => {
    if (!form.groupName.trim() || !form.manager.trim() || !form.phone.trim()) {
      alert('필수 항목을 입력해주세요.'); return
    }
    const newItem = {
      id: 'app' + Date.now(), type: wsType,
      regDate: new Date().toISOString().slice(0, 10),
      status: '접수대기',
      groupName: form.groupName, manager: form.manager,
      phone: form.phone, email: form.email,
      checkin: form.checkin, checkout: form.checkout,
      headcount: parseInt(form.headcount) || 0,
      extras: form.extras.join(', '),
      inquiry: form.inquiry, memo: '',
      pwd: form.pwd,
    }
    const all = getLS<any[]>('ws_items', [])
    localStorage.setItem('ws_items', JSON.stringify([newItem, ...all]))
    setSubmitted(true)
    setForm({ groupName: '', manager: '', phone: '', email: '', checkin: '', checkout: '', headcount: '', pwd: '', extras: [], inquiry: '' })
  }

  const searchResults = () => {
    const all = getLS<any[]>('ws_items', [])
    const found = all.filter((it: any) =>
      it.type === wsType &&
      (resultName ? it.manager === resultName : true) &&
      (resultPwd ? it.pwd === resultPwd : true) &&
      (resultName || resultPwd)
    )
    setResults(found)
  }

  const STATUS_COLOR: Record<string, string> = { '접수대기': '#94a3b8', '접수완료': '#22c55e', '계약준비': '#f59e0b', '계약완료': '#3b82f6', '신청취소': '#ef4444' }

  return (
    <div>
      {/* 탭 */}
      <div style={{ display: 'flex', marginBottom: 24, borderRadius: 12, overflow: 'hidden', border: '1.5px solid #e2e8f0' }}>
        <button onClick={() => { setTab('write'); setSubmitted(false) }} style={{
          flex: 1, padding: '12px 0', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          background: tab === 'write' ? accent : '#fff',
          color: tab === 'write' ? '#fff' : '#64748b',
        }}><ClipboardList size={14} style={{display:'inline',marginRight:4}}/> 신청서 작성</button>
        <button onClick={() => setTab('result')} style={{
          flex: 1, padding: '12px 0', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          background: tab === 'result' ? accent : '#fff',
          color: tab === 'result' ? '#fff' : '#64748b',
        }}><Search size={14} style={{display:'inline',marginRight:4}}/> 신청결과 확인</button>
      </div>

      {tab === 'write' ? (
        submitted ? (
          <div style={{ textAlign: 'center', padding: '50px 20px' }}>
            <div style={{ marginBottom: 12 }}><CheckCircle2 size={48} color="#22c55e"/></div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>신청이 접수되었습니다</div>
            <p style={{ fontSize: 14, color: '#64748b' }}>접수 후 담당자가 2~3 영업일 내 연락드립니다.</p>
            <button onClick={() => setSubmitted(false)} style={{
              marginTop: 16, padding: '10px 24px', borderRadius: 10, border: 'none',
              background: accent, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}>새 신청서 작성</button>
          </div>
        ) : (
          <div style={{ background: '#fafbfc', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '24px 20px' }}>
            {solId === 'franchise' ? (
              /* ── 가맹점 전용 신청서 ── */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={labelStyle}>신청인 *</label>
                  <input value={form.manager} onChange={e => setForm(f => ({ ...f, manager: e.target.value }))}
                    placeholder="신청인 이름 입력" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>전화번호 *</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="010-0000-0000" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>이메일</label>
                  <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="example@email.com" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>신청지역 *</label>
                  <input value={form.groupName} onChange={e => setForm(f => ({ ...f, groupName: e.target.value }))}
                    placeholder="예: 서울 강남구 역삼동" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>기타문의</label>
                  <textarea value={form.inquiry} onChange={e => setForm(f => ({ ...f, inquiry: e.target.value }))}
                    rows={4} placeholder="추가 문의사항을 입력해 주세요."
                    style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
                <div style={{ background: '#fef3c7', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>
                  ⚠ <b>유의사항:</b> 접수 후 담당자가 2~3 영업일 내 연락드립니다.
                </div>
                <button onClick={handleSubmit} style={{
                  width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                  background: accent, color: '#fff', fontWeight: 800, fontSize: 15,
                  cursor: 'pointer',
                }}>
                  가맹점 신청하기
                </button>
              </div>
            ) : (
              /* ── 워크샵/대관 신청서 ── */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {/* 단체명 */}
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>단체명 / 기업명 * <span style={{ fontWeight: 400, fontSize: 11, color: '#94a3b8' }}>(개인 신청 불가)</span></label>
                  <input value={form.groupName} onChange={e => setForm(f => ({ ...f, groupName: e.target.value }))}
                    placeholder="단체명 또는 기업명 입력" style={inputStyle} />
                </div>
                {/* 체크인/체크아웃 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={labelStyle}>{solId === 'venue' ? '이용일 *' : '체크인 *'}</label>
                    <input type="date" value={form.checkin} onChange={e => setForm(f => ({ ...f, checkin: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>{solId === 'venue' ? '이용종료일' : '체크아웃 *'}</label>
                    <input type="date" value={form.checkout} onChange={e => setForm(f => ({ ...f, checkout: e.target.value }))} style={inputStyle} />
                  </div>
                </div>
                {/* 연락처 / 인원 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={labelStyle}>담당자 연락처 *</label>
                    <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="010-0000-0000" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>참여 총 인원 *</label>
                    <input value={form.headcount} onChange={e => setForm(f => ({ ...f, headcount: e.target.value }))}
                      placeholder="최소 10명" style={inputStyle} />
                  </div>
                </div>
                {/* 이메일 */}
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>담당자 이메일</label>
                  <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="example@email.com" style={inputStyle} />
                </div>
                {/* 담당자 / 비밀번호 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={labelStyle}>담당자 이름 *</label>
                    <input value={form.manager} onChange={e => setForm(f => ({ ...f, manager: e.target.value }))}
                      placeholder="신청인 이름 입력" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>접수확인용 비밀번호 *</label>
                    <input type="password" value={form.pwd} onChange={e => setForm(f => ({ ...f, pwd: e.target.value }))}
                      placeholder="4자리 이상 입력" style={inputStyle} />
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>접수 후 신청내역 확인시 사용됩니다</div>
                  </div>
                </div>
                {/* 추가 선택사항 */}
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>추가 선택사항 <span style={{ fontWeight: 400, fontSize: 11, color: '#94a3b8' }}>(옵션 · 복수 선택 가능)</span></label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 }}>
                    {extraOptions.map(e => (
                      <label key={e} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0',
                        background: form.extras.includes(e) ? `${accent}10` : '#fff',
                        cursor: 'pointer', fontSize: 14,
                      }}>
                        <input type="checkbox" checked={form.extras.includes(e)} onChange={() => toggleExtra(e)}
                          style={{ accentColor: accent }} />
                        {e}
                      </label>
                    ))}
                  </div>
                </div>
                {/* 기타 문의 */}
                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>기타 문의 / 견적 요청사항</label>
                  <textarea value={form.inquiry} onChange={e => setForm(f => ({ ...f, inquiry: e.target.value }))}
                    rows={4} placeholder="추가 요청사항이나 견적 문의사항을 입력해 주세요."
                    style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
                {/* 유의사항 */}
                <div style={{ background: '#fef3c7', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>
                  ⚠ <b>유의사항:</b> 본 신청서는 개인 신청이 불가하며 단체·기업·기관 단위로만 접수됩니다.<br />
                  접수 후 담당자가 2~3 영업일 내 연락드립니다.
                </div>
                {/* 신청 버튼 */}
                <button onClick={handleSubmit} style={{
                  width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                  background: accent, color: '#fff', fontWeight: 800, fontSize: 15,
                  cursor: 'pointer',
                }}>
                  {label} 신청하기
                </button>
              </div>
            )}
          </div>
        )
      ) : (
        /* ── 신청결과 확인 탭 ── */
        <div>
          <div style={{ background: '#fafbfc', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 12, display:'flex', alignItems:'center', gap:5 }}><Search size={14}/> 신청내역 조회</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>담당자 이름</label>
                <input value={resultName} onChange={e => setResultName(e.target.value)}
                  placeholder="신청 시 입력한 이름" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>접수확인용 비밀번호</label>
                <input type="password" value={resultPwd} onChange={e => setResultPwd(e.target.value)}
                  placeholder="비밀번호 입력" style={inputStyle} />
              </div>
            </div>
            <button onClick={searchResults} style={{
              width: '100%', padding: '12px 0', borderRadius: 10, border: 'none',
              background: accent, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}>조회하기</button>
          </div>

          {/* 결과 리스트 (아코디언) */}
          {results.length > 0 ? (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
              {results.map((it: any) => {
                const isOpen = expandedId === it.id
                const sc = STATUS_COLOR[it.status] || '#94a3b8'
                return (
                  <div key={it.id}>
                    <div onClick={() => setExpandedId(isOpen ? null : it.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
                      borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                      background: isOpen ? '#f8fafc' : 'transparent', transition: 'background .15s',
                    }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}><ClipboardList size={15} color={accent}/></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{it.groupName}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{it.manager} · {it.regDate}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: sc, padding: '3px 10px', borderRadius: 20, background: `${sc}15` }}>{it.status}</span>
                      <span style={{ color: '#94a3b8', fontSize: 18, transition: 'transform .2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
                    </div>
                    {isOpen && (
                      <div style={{ padding: '16px 20px 20px 60px', borderBottom: '1px solid #e2e8f0', background: '#fcfcfd', animation: 'hp-fade-in .25s ease' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '6px 12px', fontSize: 13 }}>
                          {[
                            ['상태', it.status],
                            ['신청일', it.regDate],
                            ['담당자', `${it.manager} / ${it.phone}`],
                            it.email && ['이메일', it.email],
                            it.checkin && ['체크인', it.checkin],
                            it.checkout && ['체크아웃', it.checkout],
                            it.headcount && ['인원', `${it.headcount}명`],
                            it.extras && ['추가사항', it.extras],
                            it.inquiry && ['문의사항', it.inquiry],
                            it.memo && ['메모', it.memo],
                          ].filter(Boolean).map((row: any, ri: number) => (
                            <React.Fragment key={ri}>
                              <span style={{ fontWeight: 700, color: '#64748b' }}>{row[0]}</span>
                              <span style={{ color: '#334155' }}>{row[1]}</span>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '30px 0', fontSize: 14 }}>
              담당자 이름과 비밀번호로 조회해 주세요.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════
   미디어 솔루션 뷰 (갤러리 + 검색)
   ═══════════════════════════════════ */
function MediaSolutionView({ accent }: { accent: string }) {
  const MEDIA_SAMPLE = [
    { id:'ms01', mediaType:'image', title:'오로라 일몰', tags:['자연','풍경'], desc:'녹아내리는 오로라의 풍경.', dataUrl:'https://picsum.photos/seed/aurora1/1200/800', regDate:'2026-04-01' },
    { id:'ms02', mediaType:'image', title:'커피 한 잔', tags:['카페','일상'], desc:'스팀 아트가 담긴 라떼.', dataUrl:'https://picsum.photos/seed/coffee2/800/1200', regDate:'2026-04-01' },
    { id:'ms03', mediaType:'image', title:'도시의 야경', tags:['도시','야경'], desc:'서울 스카이라인 드론 사진.', dataUrl:'https://picsum.photos/seed/city3/1200/900', regDate:'2026-04-01' },
    { id:'ms04', mediaType:'image', title:'핑크 플라워', tags:['플라워','미니멀'], desc:'파스텔 톤의 플라워 디테일.', dataUrl:'https://picsum.photos/seed/flower4/600/600', regDate:'2026-03-30' },
    { id:'ms05', mediaType:'image', title:'에메랄드 호수', tags:['자연','호수'], desc:'에메랄드빛 호수 풍경.', dataUrl:'https://picsum.photos/seed/lake5/900/600', regDate:'2026-03-30' },
    { id:'ms06', mediaType:'image', title:'산업 공장 뷰', tags:['인더스트리얼'], desc:'공장 내부 시네마틱 라이트.', dataUrl:'https://picsum.photos/seed/factory6/1200/800', regDate:'2026-03-29' },
    { id:'ms07', mediaType:'image', title:'패션 포트레잇', tags:['패션','시즌'], desc:'시즌 컬렉션 포트레잇.', dataUrl:'https://picsum.photos/seed/fashion7/800/1100', regDate:'2026-03-28' },
    { id:'ms08', mediaType:'image', title:'은하수 하늘', tags:['우주','밤하늘'], desc:'은하수를 잡은 장노출 사진.', dataUrl:'https://picsum.photos/seed/space8/900/900', regDate:'2026-03-28' },
    { id:'ms09', mediaType:'image', title:'전통 한옥', tags:['한옥','전통'], desc:'기와 지붕의 전통 건축.', dataUrl:'https://picsum.photos/seed/hanok9/600/900', regDate:'2026-03-27' },
    { id:'ms10', mediaType:'image', title:'숲의 고요함', tags:['숲','하이킹'], desc:'빛과 그림자의 숲 풍경.', dataUrl:'https://picsum.photos/seed/forest10/1200/800', regDate:'2026-03-27' },
    { id:'ms11', mediaType:'image', title:'미니멀 인테리어', tags:['인테리어','사무실'], desc:'미니멀 사무실 인테리어.', dataUrl:'https://picsum.photos/seed/minimal11/900/600', regDate:'2026-03-26' },
    { id:'ms12', mediaType:'image', title:'황금 수확', tags:['농촌','가을'], desc:'풍성한 수확의 순간.', dataUrl:'https://picsum.photos/seed/harvest12/800/1200', regDate:'2026-03-25' },
  ]
  const [items] = useState<any[]>(() => { const s = getLS<any[]>('med_items', []); return s.length > 0 ? s : MEDIA_SAMPLE })
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all'|'image'|'video'>('all')
  const [dMode, setDMode] = useState<'grid'|'list'|'masonry'|'slide'>('grid')
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [sIdx, setSIdx] = useState(0)

  const fl = items.filter(it => {
    if (filter !== 'all' && it.mediaType !== filter) return false
    if (search) { const kw = search.toLowerCase(); return (it.title+' '+(it.tags||[]).join(' ')+' '+it.desc).toLowerCase().includes(kw) }
    return true
  }).sort((a,b) => new Date(b.regDate).getTime() - new Date(a.regDate).getTime())

  const modes: {k:typeof dMode;l:string;ic:string}[] = [{k:'grid',l:'격자',ic:'▦'},{k:'list',l:'목록',ic:'☰'},{k:'masonry',l:'핀터레스트',ic:'▥'},{k:'slide',l:'슬라이드',ic:'▷'}]

  const card = (it:any,mas=false) => (
    <div key={it.id} onClick={()=>setSelectedItem(selectedItem?.id===it.id?null:it)} style={{borderRadius:14,border:'1.5px solid #e2e8f0',background:'#fff',overflow:'hidden',cursor:'pointer',transition:'box-shadow .2s, transform .2s',breakInside:mas?'avoid':undefined,marginBottom:mas?14:undefined}}
      onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='0 8px 24px rgba(0,0,0,.08)';(e.currentTarget as HTMLDivElement).style.transform='translateY(-2px)'}}
      onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='none';(e.currentTarget as HTMLDivElement).style.transform='none'}}>
      <div style={{width:'100%',aspectRatio:mas?undefined:'4/3',overflow:'hidden',background:'#f1f5f9',position:'relative'}}>
        <img src={it.dataUrl} alt="" style={{width:'100%',height:mas?'auto':'100%',objectFit:'cover'}} loading="lazy"/>
        {it.mediaType==='video'&&<div style={{position:'absolute',top:8,left:8,width:24,height:24,borderRadius:'50%',background:'#ef4444',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10}}>▶</div>}
      </div>
      <div style={{padding:12}}>
        <div style={{fontSize:14,fontWeight:700,color:'#1e293b',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{it.title}</div>
        {it.desc&&<div style={{fontSize:12,color:'#94a3b8',marginTop:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{it.desc}</div>}
        {it.tags?.length>0&&<div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:6}}>{it.tags.slice(0,3).map((t:string)=><span key={t} style={{padding:'2px 6px',borderRadius:4,fontSize:10,fontWeight:700,background:`${accent}15`,color:accent}}>#{t}</span>)}</div>}
        <div style={{fontSize:11,color:'#94a3b8',marginTop:4}}>{it.regDate}</div>
      </div>
    </div>
  )

  return (
    <div>
      <div style={{display:'flex',gap:10,marginBottom:20,flexWrap:'wrap',alignItems:'center'}}>
        <div style={{flex:1,minWidth:200,position:'relative'}}>
          <Search size={14} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'#94a3b8'}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="제목, 태그 검색..." style={{width:'100%',padding:'10px 14px 10px 34px',borderRadius:10,border:'1.5px solid #e2e8f0',background:'#fff',fontSize:14,outline:'none'}}/>
        </div>
        <div style={{display:'flex',gap:6}}>
          {([{k:'all' as const,l:'전체'},{k:'image' as const,l:'이미지'},{k:'video' as const,l:'동영상'}]).map(f=>
            <button key={f.k} onClick={()=>setFilter(f.k)} style={{padding:'7px 14px',borderRadius:20,fontSize:12,fontWeight:700,border:`1.5px solid ${filter===f.k?accent:'#e2e8f0'}`,background:filter===f.k?accent:'#fff',color:filter===f.k?'#fff':'#64748b',cursor:'pointer'}}>{f.l}</button>
          )}
        </div>
        <div style={{display:'flex',gap:3,marginLeft:'auto',background:'#f1f5f9',borderRadius:10,padding:3}}>
          {modes.map(m=><button key={m.k} onClick={()=>{setDMode(m.k);setSIdx(0)}} title={m.l} style={{width:32,height:32,borderRadius:8,border:'none',fontSize:15,background:dMode===m.k?accent:'transparent',color:dMode===m.k?'#fff':'#64748b',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .2s'}}>{m.ic}</button>)}
        </div>
        <span style={{fontSize:12,color:'#94a3b8'}}>총 {fl.length}건</span>
      </div>

      {fl.length===0?<p style={{color:'#94a3b8',textAlign:'center',padding:'40px 0'}}>등록된 미디어가 없습니다.</p>
      :dMode==='grid'?<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:14}}>{fl.map(it=>card(it))}</div>
      :dMode==='list'?<div style={{display:'flex',flexDirection:'column',gap:10}}>{fl.map(it=>(
        <div key={it.id} onClick={()=>setSelectedItem(selectedItem?.id===it.id?null:it)} style={{display:'flex',gap:14,padding:12,borderRadius:12,border:'1.5px solid #e2e8f0',background:'#fff',cursor:'pointer',transition:'box-shadow .2s',alignItems:'center'}}
          onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='0 4px 16px rgba(0,0,0,.06)'}} onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='none'}}>
          <div style={{width:100,height:75,borderRadius:10,overflow:'hidden',flexShrink:0,background:'#f1f5f9',position:'relative'}}>
            <img src={it.dataUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} loading="lazy"/>
            {it.mediaType==='video'&&<div style={{position:'absolute',top:4,left:4,width:18,height:18,borderRadius:'50%',background:'#ef4444',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:8}}>▶</div>}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:14,fontWeight:700,color:'#1e293b',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{it.title}</div>
            {it.desc&&<div style={{fontSize:12,color:'#94a3b8',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{it.desc}</div>}
            {it.tags?.length>0&&<div style={{display:'flex',gap:4,marginTop:4}}>{it.tags.slice(0,3).map((t:string)=><span key={t} style={{padding:'1px 5px',borderRadius:4,fontSize:9,fontWeight:700,background:`${accent}15`,color:accent}}>#{t}</span>)}</div>}
          </div>
          <div style={{fontSize:11,color:'#94a3b8',whiteSpace:'nowrap'}}>{it.regDate}</div>
        </div>
      ))}</div>
      :dMode==='masonry'?<div style={{columnCount:3,columnGap:14}}>{fl.map(it=>card(it,true))}</div>
      :<div style={{position:'relative'}}>
        {fl.length>0&&(()=>{const item=fl[sIdx%fl.length];return(
          <div style={{borderRadius:16,overflow:'hidden',border:'1.5px solid #e2e8f0',background:'#fff'}}>
            <div style={{width:'100%',aspectRatio:'16/9',overflow:'hidden',background:'#0a0a0a',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <img src={item.dataUrl} alt="" style={{width:'100%',height:'100%',objectFit:'contain'}}/>
            </div>
            <div style={{padding:'16px 20px',display:'flex',alignItems:'center',gap:14}}>
              <div style={{flex:1}}>
                <div style={{fontSize:18,fontWeight:800,color:'#1e293b'}}>{item.title}</div>
                {item.desc&&<div style={{fontSize:13,color:'#64748b',marginTop:4}}>{item.desc}</div>}
                {item.tags?.length>0&&<div style={{display:'flex',gap:5,marginTop:8}}>{item.tags.map((t:string)=><span key={t} style={{padding:'2px 8px',borderRadius:6,fontSize:11,fontWeight:700,background:`${accent}15`,color:accent}}>#{t}</span>)}</div>}
              </div>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <button onClick={()=>setSIdx(p=>(p-1+fl.length)%fl.length)} style={{width:36,height:36,borderRadius:'50%',border:'1.5px solid #e2e8f0',background:'#fff',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>◀</button>
                <span style={{fontSize:13,fontWeight:700,color:'#64748b',minWidth:50,textAlign:'center'}}>{(sIdx%fl.length)+1} / {fl.length}</span>
                <button onClick={()=>setSIdx(p=>(p+1)%fl.length)} style={{width:36,height:36,borderRadius:'50%',border:'1.5px solid #e2e8f0',background:'#fff',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>▶</button>
              </div>
            </div>
          </div>
        )})()}
        <div style={{display:'flex',gap:8,marginTop:12,overflowX:'auto',paddingBottom:4}}>
          {fl.map((it,i)=><div key={it.id} onClick={()=>setSIdx(i)} style={{width:64,height:48,borderRadius:8,overflow:'hidden',cursor:'pointer',flexShrink:0,border:i===(sIdx%fl.length)?`2.5px solid ${accent}`:'2px solid transparent',opacity:i===(sIdx%fl.length)?1:0.5,transition:'all .2s'}}><img src={it.dataUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} loading="lazy"/></div>)}
        </div>
      </div>}

      {selectedItem && createPortal(
        <div onClick={() => setSelectedItem(null)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, animation: 'hp-fade-in .2s ease', padding: 20,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: 20, maxWidth: 800, width: '100%',
            maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 80px rgba(0,0,0,.3)',
          }}>
            {/* 이미지 영역 */}
            <div style={{ position: 'relative', background: '#0a0a12', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, maxHeight: '55vh' }}>
              <img src={selectedItem.dataUrl} alt="" style={{ maxWidth: '100%', maxHeight: '55vh', objectFit: 'contain' }} />
              {/* 닫기 */}
              <button onClick={() => setSelectedItem(null)} style={{
                position: 'absolute', top: 12, right: 12, width: 36, height: 36,
                borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,.5)',
                color: '#fff', fontSize: 20, cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>✕</button>
              {/* 이전/다음 */}
              {fl.length > 1 && (
                <>
                  <button onClick={() => {
                    const idx = fl.findIndex(it => it.id === selectedItem.id)
                    setSelectedItem(fl[(idx - 1 + fl.length) % fl.length])
                  }} style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    width: 40, height: 40, borderRadius: '50%', border: 'none',
                    background: 'rgba(0,0,0,.45)', color: '#fff', fontSize: 20,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>◀</button>
                  <button onClick={() => {
                    const idx = fl.findIndex(it => it.id === selectedItem.id)
                    setSelectedItem(fl[(idx + 1) % fl.length])
                  }} style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    width: 40, height: 40, borderRadius: '50%', border: 'none',
                    background: 'rgba(0,0,0,.45)', color: '#fff', fontSize: 20,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>▶</button>
                </>
              )}
              {/* 인디케이터 */}
              <div style={{
                position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
                padding: '4px 12px', borderRadius: 20, background: 'rgba(0,0,0,.5)',
                color: '#fff', fontSize: 12, fontWeight: 700,
              }}>
                {fl.findIndex(it => it.id === selectedItem.id) + 1} / {fl.length}
              </div>
            </div>
            {/* 정보 영역 */}
            <div style={{ padding: '20px 24px', overflowY: 'auto' }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', margin: '0 0 8px' }}>{selectedItem.title}</h3>
              {selectedItem.desc && <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, margin: '0 0 12px' }}>{selectedItem.desc}</p>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                {selectedItem.tags?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {selectedItem.tags.map((t: string) => (
                      <span key={t} style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: `${accent}15`, color: accent }}>#{t}</span>
                    ))}
                  </div>
                )}
                <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 'auto' }}>{selectedItem.regDate}</span>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}


/* ═══════════════════════════════════
   컨텐츠 솔루션 뷰 (리스트 + 검색)
   ═══════════════════════════════════ */
function ContentSolutionView({ accent }: { accent: string }) {
  const CONTENT_SAMPLE: any[] = [
    // 뉴스 8건
    { id:'cn01', category:'news', title:'2026 상반기 실적 발표', summary:'전년 대비 35% 성장한 실적을 기록했습니다.', date:'2026-04-15', tags:['실적','경영'], thumbnail:'https://picsum.photos/seed/news1/400/300', url:'' },
    { id:'cn02', category:'news', title:'신규 지점 오픈 안내', summary:'강남 플래그십 스토어가 4월 20일 오픈합니다.', date:'2026-04-12', tags:['오픈','강남'], thumbnail:'https://picsum.photos/seed/news2/400/300', url:'' },
    { id:'cn03', category:'news', title:'ESG 경영 우수기업 선정', summary:'환경부 주관 ESG 경영 우수기업에 선정되었습니다.', date:'2026-04-10', tags:['ESG','수상'], thumbnail:'https://picsum.photos/seed/news3/400/300', url:'' },
    { id:'cn04', category:'news', title:'AI 기반 서비스 도입', summary:'인공지능 고객 응대 시스템을 전면 도입합니다.', date:'2026-04-08', tags:['AI','혁신'], thumbnail:'https://picsum.photos/seed/news4/400/300', url:'' },
    { id:'cn05', category:'news', title:'해외 시장 진출 MOU 체결', summary:'일본 파트너사와 전략적 MOU를 체결했습니다.', date:'2026-04-05', tags:['해외','MOU'], thumbnail:'https://picsum.photos/seed/news5/400/300', url:'' },
    { id:'cn06', category:'news', title:'직원 복지 정책 개편', summary:'유연근무제 확대 및 복지포인트를 상향합니다.', date:'2026-04-03', tags:['복지','인사'], thumbnail:'https://picsum.photos/seed/news6/400/300', url:'' },
    { id:'cn07', category:'news', title:'특허 기술 등록 완료', summary:'핵심 기술 3건에 대한 국내외 특허를 취득했습니다.', date:'2026-04-01', tags:['특허','기술'], thumbnail:'https://picsum.photos/seed/news7/400/300', url:'' },
    { id:'cn08', category:'news', title:'고객 만족도 1위 달성', summary:'업계 최초 3년 연속 고객 만족도 1위를 기록했습니다.', date:'2026-03-28', tags:['고객','만족도'], thumbnail:'https://picsum.photos/seed/news8/400/300', url:'' },
    // 블로그 8건
    { id:'cb01', category:'blog', title:'효과적인 팀 빌딩 방법 5가지', summary:'팀워크를 극대화하는 실전 노하우를 공유합니다.', date:'2026-04-14', tags:['팀빌딩','경영'], thumbnail:'https://picsum.photos/seed/blog1/400/300', url:'' },
    { id:'cb02', category:'blog', title:'2026 인테리어 트렌드 분석', summary:'올해 주목할 인테리어 디자인 트렌드를 분석했습니다.', date:'2026-04-11', tags:['인테리어','트렌드'], thumbnail:'https://picsum.photos/seed/blog2/400/300', url:'' },
    { id:'cb03', category:'blog', title:'원격 근무 생산성 높이는 팁', summary:'재택근무 환경에서 집중력을 유지하는 방법입니다.', date:'2026-04-09', tags:['원격근무','생산성'], thumbnail:'https://picsum.photos/seed/blog3/400/300', url:'' },
    { id:'cb04', category:'blog', title:'브랜딩 전략 수립 가이드', summary:'중소기업을 위한 실전 브랜딩 가이드입니다.', date:'2026-04-07', tags:['브랜딩','마케팅'], thumbnail:'https://picsum.photos/seed/blog4/400/300', url:'' },
    { id:'cb05', category:'blog', title:'건강한 사무실 환경 만들기', summary:'직장인 건강을 위한 사무실 환경 개선 팁입니다.', date:'2026-04-04', tags:['건강','사무실'], thumbnail:'https://picsum.photos/seed/blog5/400/300', url:'' },
    { id:'cb06', category:'blog', title:'디지털 마케팅 A to Z', summary:'입문자를 위한 디지털 마케팅 완벽 가이드입니다.', date:'2026-04-02', tags:['디지털','마케팅'], thumbnail:'https://picsum.photos/seed/blog6/400/300', url:'' },
    { id:'cb07', category:'blog', title:'고객 경험 혁신 사례', summary:'CX 혁신으로 매출 40%를 성장시킨 사례입니다.', date:'2026-03-30', tags:['CX','혁신'], thumbnail:'https://picsum.photos/seed/blog7/400/300', url:'' },
    { id:'cb08', category:'blog', title:'스타트업 성장 전략', summary:'빠르게 성장하는 스타트업의 공통 전략을 분석했습니다.', date:'2026-03-27', tags:['스타트업','성장'], thumbnail:'https://picsum.photos/seed/blog8/400/300', url:'' },
    // YouTube 8건
    { id:'cy01', category:'youtube', title:'회사 소개 영상', summary:'우리 회사의 비전과 미션을 소개합니다.', date:'2026-04-13', tags:['소개','회사'], thumbnail:'https://picsum.photos/seed/yt1/400/300', url:'https://youtube.com' },
    { id:'cy02', category:'youtube', title:'워크샵 현장 스케치', summary:'2026 봄 워크샵 현장을 담았습니다.', date:'2026-04-10', tags:['워크샵','현장'], thumbnail:'https://picsum.photos/seed/yt2/400/300', url:'https://youtube.com' },
    { id:'cy03', category:'youtube', title:'제품 사용법 튜토리얼', summary:'신제품 사용법을 쉽게 알려드립니다.', date:'2026-04-08', tags:['튜토리얼','제품'], thumbnail:'https://picsum.photos/seed/yt3/400/300', url:'https://youtube.com' },
    { id:'cy04', category:'youtube', title:'CEO 인터뷰', summary:'대표이사가 말하는 회사의 미래 비전입니다.', date:'2026-04-06', tags:['인터뷰','CEO'], thumbnail:'https://picsum.photos/seed/yt4/400/300', url:'https://youtube.com' },
    { id:'cy05', category:'youtube', title:'고객 후기 인터뷰', summary:'실제 고객이 말하는 서비스 경험담입니다.', date:'2026-04-03', tags:['고객후기'], thumbnail:'https://picsum.photos/seed/yt5/400/300', url:'https://youtube.com' },
    { id:'cy06', category:'youtube', title:'직원 일상 VLOG', summary:'우리 직원들의 하루를 공개합니다.', date:'2026-04-01', tags:['VLOG','직원'], thumbnail:'https://picsum.photos/seed/yt6/400/300', url:'https://youtube.com' },
    { id:'cy07', category:'youtube', title:'서비스 업데이트 소식', summary:'3월 주요 업데이트 내용을 정리했습니다.', date:'2026-03-29', tags:['업데이트'], thumbnail:'https://picsum.photos/seed/yt7/400/300', url:'https://youtube.com' },
    { id:'cy08', category:'youtube', title:'업계 트렌드 리뷰', summary:'2026년 업계 트렌드를 영상으로 분석합니다.', date:'2026-03-26', tags:['트렌드','리뷰'], thumbnail:'https://picsum.photos/seed/yt8/400/300', url:'https://youtube.com' },
    // 웹사이트 8건
    { id:'cw01', category:'website', title:'공식 홈페이지 리뉴얼', summary:'새롭게 단장한 공식 홈페이지를 소개합니다.', date:'2026-04-14', tags:['홈페이지','리뉴얼'], thumbnail:'https://picsum.photos/seed/web1/400/300', url:'https://example.com' },
    { id:'cw02', category:'website', title:'온라인 쇼핑몰 오픈', summary:'공식 온라인 스토어가 오픈했습니다.', date:'2026-04-11', tags:['쇼핑몰','오픈'], thumbnail:'https://picsum.photos/seed/web2/400/300', url:'https://example.com' },
    { id:'cw03', category:'website', title:'파트너 포털 안내', summary:'협력사 전용 파트너 포털을 안내합니다.', date:'2026-04-09', tags:['파트너','포털'], thumbnail:'https://picsum.photos/seed/web3/400/300', url:'https://example.com' },
    { id:'cw04', category:'website', title:'채용 페이지 업데이트', summary:'2026년 하반기 채용 정보를 업데이트했습니다.', date:'2026-04-07', tags:['채용','커리어'], thumbnail:'https://picsum.photos/seed/web4/400/300', url:'https://example.com' },
    { id:'cw05', category:'website', title:'고객 지원 센터', summary:'FAQ와 1:1 문의를 이용할 수 있습니다.', date:'2026-04-04', tags:['고객지원','FAQ'], thumbnail:'https://picsum.photos/seed/web5/400/300', url:'https://example.com' },
    { id:'cw06', category:'website', title:'IR 정보 페이지', summary:'투자자를 위한 IR 자료를 공개합니다.', date:'2026-04-02', tags:['IR','투자'], thumbnail:'https://picsum.photos/seed/web6/400/300', url:'https://example.com' },
    { id:'cw07', category:'website', title:'지속가능경영 보고서', summary:'2025 지속가능경영 보고서를 발간했습니다.', date:'2026-03-30', tags:['ESG','보고서'], thumbnail:'https://picsum.photos/seed/web7/400/300', url:'https://example.com' },
    { id:'cw08', category:'website', title:'이벤트 랜딩 페이지', summary:'봄맞이 특별 이벤트 페이지를 오픈했습니다.', date:'2026-03-27', tags:['이벤트','프로모션'], thumbnail:'https://picsum.photos/seed/web8/400/300', url:'https://example.com' },
  ]
  const [items] = useState<any[]>(() => {
    const stored = getLS<any[]>('chub_items', [])
    const raw = stored.length > 0 ? stored : CONTENT_SAMPLE
    // 관리자(type/img) ↔ 사이트(category/thumbnail) 호환
    return raw.map((it: any) => ({
      ...it,
      category: it.category || it.type || 'news',
      thumbnail: it.thumbnail || it.img || '',
    }))
  })
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedItem, setSelectedItem] = useState<any>(null)

  const categories = ['all', ...new Set(items.map((it: any) => it.category).filter(Boolean))]
  const catLabels: Record<string, string> = { all: '전체', news: '뉴스', blog: '블로그', youtube: 'YouTube', website: '웹사이트' }

  const filtered = items.filter(it => {
    if (catFilter !== 'all' && it.category !== catFilter) return false
    if (search) {
      const kw = search.toLowerCase()
      return (it.title + ' ' + (it.summary || '') + ' ' + (it.tags || []).join(' ')).toLowerCase().includes(kw)
    }
    return true
  }).sort((a, b) => new Date(b.date || b.regDate || 0).getTime() - new Date(a.date || a.regDate || 0).getTime())

  const catColors: Record<string, string> = { news: '#ef4444', blog: '#3b82f6', youtube: '#f59e0b', website: '#22c55e' }

  return (
    <div>
      {/* 검색 + 카테고리 + 보기 모드 */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="제목, 요약, 태그 검색..."
            style={{ width: '100%', padding: '10px 14px 10px 34px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', fontSize: 14, outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {categories.map(c => (
            <button key={c} onClick={() => setCatFilter(c)} style={{
              padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
              border: `1.5px solid ${catFilter === c ? accent : '#e2e8f0'}`,
              background: catFilter === c ? accent : '#fff',
              color: catFilter === c ? '#fff' : '#64748b', cursor: 'pointer',
            }}>{catLabels[c] || c}</button>
          ))}
        </div>
        {/* 보기 모드 토글 */}
        <div style={{ display: 'flex', gap: 3, background: '#f1f5f9', borderRadius: 10, padding: 3, marginLeft: 'auto' }}>
          <button onClick={() => setViewMode('grid')} title="격자" style={{
            width: 32, height: 32, borderRadius: 8, border: 'none', fontSize: 15,
            background: viewMode === 'grid' ? accent : 'transparent',
            color: viewMode === 'grid' ? '#fff' : '#64748b',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s',
          }}>▦</button>
          <button onClick={() => setViewMode('list')} title="목록" style={{
            width: 32, height: 32, borderRadius: 8, border: 'none', fontSize: 15,
            background: viewMode === 'list' ? accent : 'transparent',
            color: viewMode === 'list' ? '#fff' : '#64748b',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s',
          }}>☰</button>
        </div>
        <span style={{ fontSize: 12, color: '#94a3b8' }}>총 {filtered.length}건</span>
      </div>

      {/* 컨텐츠 */}
      {filtered.length === 0 ? (
        <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 0' }}>등록된 컨텐츠가 없습니다.</p>
      ) : viewMode === 'grid' ? (
        /* ── 격자(카드) 모드 ── */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {filtered.map(it => {
            const cc = catColors[it.category] || '#94a3b8'
            return (
              <div key={it.id} onClick={() => setSelectedItem(it)}
                style={{
                  borderRadius: 14, border: '1.5px solid #e2e8f0', background: '#fff',
                  overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow .2s, transform .2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,.08)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.transform = 'none' }}
              >
                {it.thumbnail && (
                  <div style={{ width: '100%', aspectRatio: '16/10', overflow: 'hidden', background: '#f1f5f9', position: 'relative' }}>
                    <img src={it.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                    <span style={{
                      position: 'absolute', top: 10, left: 10, padding: '3px 10px',
                      borderRadius: 6, fontSize: 10, fontWeight: 700, background: cc, color: '#fff',
                    }}>{catLabels[it.category] || it.category}</span>
                    {it.category === 'youtube' && (
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,.6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>▶</div>
                    )}
                  </div>
                )}
                <div style={{ padding: 14 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>{it.title}</div>
                  {it.summary && <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{it.summary}</div>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    {it.tags?.slice(0, 3).map((t: string) => (
                      <span key={t} style={{ padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: `${accent}15`, color: accent }}>#{t}</span>
                    ))}
                    <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto' }}>{it.date || it.regDate || ''}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* ── 리스트(아코디언) 모드 ── */
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
          {filtered.map((it, i) => {
            const isOpen = expandedId === it.id
            const cc = catColors[it.category] || '#94a3b8'
            return (
              <div key={it.id}>
                <div onClick={() => setExpandedId(isOpen ? null : it.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
                  borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                  background: isOpen ? '#f8fafc' : 'transparent', transition: 'background .15s',
                }}>
                  {it.thumbnail && (
                    <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', background: '#f1f5f9', flexShrink: 0 }}>
                      <img src={it.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: `${cc}18`, color: cc }}>{catLabels[it.category] || it.category}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.title}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{it.date || it.regDate || ''}</div>
                  </div>
                  <span style={{ color: '#94a3b8', fontSize: 18, transition: 'transform .2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
                </div>
                {isOpen && (
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#fafbfc' }}>
                    {it.summary && <p style={{ fontSize: 14, lineHeight: 1.7, color: '#475569', margin: 0 }}>{it.summary}</p>}
                    {it.thumbnail && (
                      <div style={{ marginTop: 12 }}>
                        <img src={it.thumbnail} alt="" style={{ maxWidth: '100%', borderRadius: 10, border: '1px solid #e2e8f0' }} />
                      </div>
                    )}
                    {it.url && (
                      <a href={it.url.startsWith('http') ? it.url : `https://${it.url}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-block', marginTop: 12, padding: '8px 16px', borderRadius: 8, background: accent, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                        원본 보기
                      </a>
                    )}
                    {it.tags?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 12 }}>
                        {it.tags.map((t: string) => (
                          <span key={t} style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: `${accent}15`, color: accent }}>#{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* 상세보기 모달 */}
      {selectedItem && createPortal(
        <div onClick={() => setSelectedItem(null)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, animation: 'hp-fade-in .2s ease', padding: 20,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: 20, maxWidth: 700, width: '100%',
            maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 80px rgba(0,0,0,.3)',
          }}>
            {/* 이미지 */}
            {selectedItem.thumbnail && (
              <div style={{ position: 'relative', background: '#0a0a12', display: 'flex', alignItems: 'center', justifyContent: 'center', maxHeight: '50vh' }}>
                <img src={selectedItem.thumbnail} alt="" style={{ maxWidth: '100%', maxHeight: '50vh', objectFit: 'contain' }} />
                <span style={{
                  position: 'absolute', top: 14, left: 14, padding: '4px 12px',
                  borderRadius: 8, fontSize: 11, fontWeight: 700,
                  background: catColors[selectedItem.category] || '#94a3b8', color: '#fff',
                }}>{catLabels[selectedItem.category] || selectedItem.category}</span>
                {selectedItem.category === 'youtube' && (
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 56, height: 56, borderRadius: '50%', background: 'rgba(0,0,0,.6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>▶</div>
                )}
              </div>
            )}
            {/* 닫기 */}
            <button onClick={() => setSelectedItem(null)} style={{
              position: 'absolute', top: 12, right: 12, width: 36, height: 36,
              borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,.5)',
              color: '#fff', fontSize: 20, cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', zIndex: 1,
            }}>✕</button>
            {/* 정보 */}
            <div style={{ padding: '20px 24px', overflowY: 'auto' }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', margin: '0 0 8px' }}>{selectedItem.title}</h3>
              {selectedItem.summary && <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, margin: '0 0 14px' }}>{selectedItem.summary}</p>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                {selectedItem.tags?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {selectedItem.tags.map((t: string) => (
                      <span key={t} style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: `${accent}15`, color: accent }}>#{t}</span>
                    ))}
                  </div>
                )}
                <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 'auto' }}>{selectedItem.date || selectedItem.regDate || ''}</span>
              </div>
              {selectedItem.url && (
                <a href={selectedItem.url.startsWith('http') ? selectedItem.url : `https://${selectedItem.url}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-block', marginTop: 16, padding: '10px 20px', borderRadius: 10, background: accent, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                  원본 보기 ↗
                </a>
              )}
            </div>
            {/* 이전/다음 */}
            {filtered.length > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 24px 16px', gap: 8 }}>
                <button onClick={() => {
                  const idx = filtered.findIndex(it => it.id === selectedItem.id)
                  setSelectedItem(filtered[(idx - 1 + filtered.length) % filtered.length])
                }} style={{
                  flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid #e2e8f0',
                  background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>◀ 이전</button>
                <button onClick={() => {
                  const idx = filtered.findIndex(it => it.id === selectedItem.id)
                  setSelectedItem(filtered[(idx + 1) % filtered.length])
                }} style={{
                  flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid #e2e8f0',
                  background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>다음 ▶</button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

/* ═══════════════════════════════════
   게시물 게재 원칙 샘플 뷰
   ═══════════════════════════════════ */
function PostPolicySampleView() {
  const sStyle: React.CSSProperties = { marginBottom: 28 }
  const h2S: React.CSSProperties = { fontSize: 17, fontWeight: 800, color: '#1e293b', marginBottom: 10, paddingBottom: 8, borderBottom: '2px solid #e2e8f0' }
  const h3S: React.CSSProperties = { fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 6, marginTop: 14 }
  const pS: React.CSSProperties = { fontSize: 13.5, color: '#475569', lineHeight: 1.85, margin: '0 0 8px' }
  const ulS: React.CSSProperties = { paddingLeft: 20, margin: '6px 0 10px' }
  const liS: React.CSSProperties = { fontSize: 13, color: '#475569', lineHeight: 1.8 }
  return (
    <div style={{ lineHeight: 1.8 }}>
      <div style={sStyle}><h2 style={h2S}>제1장 총칙</h2>
        <h3 style={h3S}>제1조 (목적)</h3>
        <p style={pS}>본 게시물 게재 원칙(이하 "본 원칙")은 회사가 운영하는 홈페이지, 게시판, 커뮤니티 등 모든 온라인 채널(이하 "서비스")에 게시되는 게시물의 작성, 관리 및 운영에 관한 기본 원칙을 정하는 것을 목적으로 합니다.</p>
        <h3 style={h3S}>제2조 (적용 범위)</h3>
        <p style={pS}>본 원칙은 서비스를 이용하는 모든 회원 및 비회원 게시자에게 적용되며, 다음의 게시물 유형을 포함합니다:</p>
        <ul style={ulS}><li style={liS}>공지사항, 뉴스, 자유게시판, Q&A, FAQ 등 게시판 게시물</li><li style={liS}>댓글, 답변, 리뷰 등 부속 게시물</li><li style={liS}>이미지, 동영상, 파일 등 멀티미디어 첨부물</li></ul>
      </div>
      <div style={sStyle}><h2 style={h2S}>제2장 게시물 작성 원칙</h2>
        <h3 style={h3S}>제3조 (작성 기준)</h3>
        <p style={pS}>게시물 작성 시 다음 사항을 준수해야 합니다:</p>
        <ul style={ulS}><li style={liS}>정확하고 사실에 기반한 정보만 게시합니다.</li><li style={liS}>타인의 명예를 훼손하거나 비방하는 내용을 포함하지 않습니다.</li><li style={liS}>음란물, 불법 정보, 스팸성 광고를 게시하지 않습니다.</li><li style={liS}>저작권, 초상권 등 타인의 지적재산권을 침해하지 않습니다.</li><li style={liS}>개인정보(주민등록번호, 전화번호, 주소 등)를 무단으로 공개하지 않습니다.</li></ul>
        <h3 style={h3S}>제4조 (게시물 형식)</h3>
        <ul style={ulS}><li style={liS}>제목은 게시물의 내용을 명확하게 표현해야 합니다.</li><li style={liS}>본문은 가독성을 위해 적절한 단락 구분과 문장 부호를 사용합니다.</li><li style={liS}>첨부 이미지는 10MB 이하, 지원 형식(JPG, PNG, GIF)으로 제한합니다.</li><li style={liS}>외부 링크는 안전한 사이트만 허용하며, 악성 URL 포함 시 삭제됩니다.</li></ul>
      </div>
      <div style={sStyle}><h2 style={h2S}>제3장 금지 행위</h2>
        <h3 style={h3S}>제5조 (금지 게시물)</h3>
        <p style={pS}>다음에 해당하는 게시물은 사전 통보 없이 삭제되며, 반복 위반 시 이용이 제한될 수 있습니다:</p>
        <ul style={ulS}><li style={liS}>허위 사실 유포 또는 사기성 정보 게시</li><li style={liS}>정치적 선전, 종교적 권유 목적의 게시물</li><li style={liS}>동일하거나 유사한 내용의 반복 게시(도배)</li><li style={liS}>서비스 운영을 방해하는 프로그램 코드 등 포함</li><li style={liS}>법률에 위반되는 일체의 내용</li></ul>
      </div>
      <div style={sStyle}><h2 style={h2S}>제4장 게시물 관리</h2>
        <h3 style={h3S}>제6조 (검토 및 삭제)</h3>
        <p style={pS}>운영자는 본 원칙에 위배되는 게시물을 발견 시 다음 조치를 취할 수 있습니다:</p>
        <ul style={ulS}><li style={liS}>해당 게시물의 비공개 처리 또는 삭제</li><li style={liS}>작성자에 대한 경고 통지</li><li style={liS}>반복 위반자의 게시 권한 정지 또는 회원 탈퇴 처리</li></ul>
        <h3 style={h3S}>제7조 (게시물 보존)</h3>
        <p style={pS}>삭제된 게시물은 법적 분쟁 대비를 위해 최대 30일간 백업 보존되며, 이후 완전히 파기됩니다.</p>
      </div>
      <div style={sStyle}><h2 style={h2S}>제5장 저작권 및 책임</h2>
        <h3 style={h3S}>제8조 (저작권)</h3>
        <p style={pS}>게시물의 저작권은 작성자에게 귀속됩니다. 단, 서비스 내 게시함으로써 회사는 해당 게시물을 서비스 운영 목적으로 이용할 수 있는 비독점적 라이선스를 부여받습니다.</p>
        <h3 style={h3S}>제9조 (면책)</h3>
        <p style={pS}>회원이 게시한 게시물로 인해 발생하는 법적 책임은 해당 게시물 작성자에게 있으며, 회사는 게시물의 정확성이나 신뢰성에 대해 보증하지 않습니다.</p>
      </div>
      <div style={{marginTop:30,padding:16,borderRadius:10,background:'#f8fafc',border:'1px solid #e2e8f0',textAlign:'center'}}>
        <p style={{fontSize:12,color:'#94a3b8',margin:0}}>본 게시물 게재 원칙은 2026년 1월 1일부터 시행됩니다.</p>
        <p style={{fontSize:12,color:'#94a3b8',margin:'4px 0 0'}}>문의사항은 고객센터로 연락해 주시기 바랍니다.</p>
      </div>
    </div>
  )
}
