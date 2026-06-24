import { useState, useEffect, useRef, useMemo } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { Search, Bell, Moon, Sun, LogOut, User, Clock, ArrowRight, Timer, Calculator, Globe, ChevronRight, ChevronDown, FileCheck, Calendar } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useThemeStore } from '../../stores/themeStore'
import { Avatar } from '../ui/Avatar'
import { cn } from '../../utils/cn'

import { getItem, setItem } from '../../utils/storage'
import { useToastStore } from '../../stores/toastStore'



/* ── 출퇴근 기록 타입 ── */
interface AttendanceRecord {
  checkInRaw: string | null
  checkOutRaw: string | null
}

function pad(n: number) { return String(n).padStart(2, '0') }

export function Header() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { theme, toggle: toggleTheme } = useThemeStore()
  const addToast = useToastStore((s) => s.add)
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [now, setNow] = useState(new Date())
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [yearDropOpen, setYearDropOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const isAcctMode = location.pathname === '/accounting'
  const isHpMode = location.pathname === '/homepage'

  /* ── 회계연도 (URL searchParams로 공유) ── */
  const currentYear = new Date().getFullYear()
  const acctYear = parseInt(searchParams.get('year') || '') || parseInt(localStorage.getItem('acct_active_year') || '') || currentYear

  const setAcctYear = (y: number) => {
    const tab = searchParams.get('tab') || 'overview'
    setSearchParams({ tab, year: String(y) })
  }

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // 외부 클릭으로 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
        setNotifOpen(false)
        setYearDropOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ── 출퇴근 데이터 ──
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  const todayKey = `ws_attendance_${todayStr}`
  const attendance: AttendanceRecord = getItem(todayKey, { checkInRaw: null, checkOutRaw: null })

  // 최초 접속 시 자동 출근
  useEffect(() => {
    if (user && !attendance.checkInRaw) {
      const nowTime = `${pad(new Date().getHours())}:${pad(new Date().getMinutes())}`
      setItem(todayKey, { ...attendance, checkInRaw: nowTime })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const checkInTime = attendance.checkInRaw || '--:--'

  // 근무시간 계산
  const workTime = useMemo(() => {
    if (!attendance.checkInRaw) return '--:--'
    const [h, m] = attendance.checkInRaw.split(':').map(Number)
    const cin = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0)
    const diff = now.getTime() - cin.getTime()
    if (diff < 0) return '00:00'
    const totalMin = Math.floor(diff / 60000)
    return `${pad(Math.floor(totalMin / 60))}:${pad(totalMin % 60)}`
  }, [attendance.checkInRaw, now])

  // 퇴근 처리
  const handleCheckOut = () => {
    const outTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`
    setItem(todayKey, { ...attendance, checkOutRaw: outTime })
    addToast('success', `${user?.name}님, 오늘도 수고하셨습니다! 총 근무시간: ${workTime}`)
    setTimeout(() => {
      logout()
      window.location.hash = '#/login'
    }, 2000)
  }

  /* ══════════════════════════════════════════
     좌측 영역: 모드별 분기
     ══════════════════════════════════════════ */
  const renderLeft = () => {
    if (isAcctMode) {
      /* ── 회계관리 모드: 배지 + 회계연도 탭 ── */
      /* 예산설정에 등록된 년도 목록을 동적으로 가져옴 */
      const budgetCats = JSON.parse(localStorage.getItem('acct_budget_cats') || '[]') as any[]
      
      const activeTab = searchParams.get('tab') || 'overview'

      return (
        <div className="flex items-center gap-2 min-w-0">
          {/* > 구분 아이콘 */}
          <ChevronRight size={14} className="text-[var(--text-muted)] shrink-0 hidden md:block" />

          {/* 모드별 배지 */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500 text-white shrink-0">
            <Calculator size={13} />
            <span className="text-[12px] font-bold">{
              (() => {
                const tabLabels: Record<string, string> = { overview: '기본현황', base_budget: '기초예산', approval: '품의하기', expense: '지출하기', income: '입금전표', withdrawal: '출금전표', payment: '전표장부', cashflow_list: '입출금내역', reports: '회계현황', vendors: '거래처관리', methodReg: '수단등록', budgetTree: '예산과목', hq_vendor: '본사거래처', acct_mgmt: '계정관리' }
                return tabLabels[activeTab] || '기본현황'
              })()
            }</span>
          </div>

          {/* 회계년도 + 예산구분 */}
          {(() => {
            // 해당 연도 전체 카테고리
            const allCatsForYear = budgetCats.filter((c: any) => {
              const catYear = c.year || (c.periodFrom ? parseInt(c.periodFrom.substring(0, 4)) : currentYear)
              return catYear === acctYear
            })
            // 지출담당(users) + 지출승인(approvers) 필터 + 예산승인자는 전체 표시
            const userName = user?.name || ''
            // staffList에서 현재 사용자가 예산승인자(approverType='approver')인지 확인
            const staffList = JSON.parse(localStorage.getItem('ws_users') || '[]') as any[]
            const currentStaff = staffList.find((s: any) => s.name === userName)
            const isBudgetApprover = currentStaff?.approverType === 'approver'
            
            let budgetCatsForYear = allCatsForYear
            if (!isBudgetApprover && userName) {
              budgetCatsForYear = allCatsForYear.filter((c: any) =>
                (c.users && c.users.length > 0 && c.users.includes(userName)) ||
                (c.approvers && c.approvers.length > 0 && c.approvers.includes(userName))
              )
            }
            // 예산담당자 여부 확인
            const isBudgetHandler = allCatsForYear.some((c: any) =>
              (c.users && c.users.includes(userName)) ||
              (c.approvers && c.approvers.includes(userName))
            )
            const hasBudgetAccess = isBudgetApprover || isBudgetHandler

            const currentCat = searchParams.get('cat') || 'all'
            const setCat = (catId: string) => {
              if (!hasBudgetAccess) return
              const params: Record<string, string> = { tab: activeTab, year: String(acctYear), cat: catId }
              setSearchParams(params)
            }

            return (
              <div className="hidden md:flex items-center gap-1 bg-[var(--bg-muted)] rounded-lg px-1 py-0.5 border border-[var(--border-default)]">
                {/* 회계년도 라벨 */}
                <span className="px-2 py-1 text-[11px] font-bold text-[var(--text-muted)]">회계년도</span>
                {/* 적용된 회계년도 (한 개만 표시) */}
                {(() => {
                  const appliedYear = parseInt(localStorage.getItem('acct_active_year') || '') || acctYear
                  return (
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-500 text-white border border-emerald-500 shadow-sm flex items-center gap-0.5">
                      ✓ {appliedYear}년
                    </span>
                  )
                })()}
                {/* 구분선 */}
                <div className="w-px h-4 bg-[var(--border-default)] mx-0.5" />
                {/* 전체 + 예산구분 */}
                {/* 전체 버튼 (지출하기 탭에서는 숨김) */}
                {activeTab !== 'expense' && (
                <button onClick={() => setCat('all')}
                  className={cn('px-2.5 py-1 rounded-md text-[11px] font-bold transition-all',
                    !hasBudgetAccess ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
                    currentCat === 'all' ? 'bg-primary-500 text-white shadow-sm' : 'text-[var(--text-muted)]' + (hasBudgetAccess ? ' hover:text-[var(--text-primary)]' : ''))}
                  title={!hasBudgetAccess ? '예산담당자 또는 지출승인권자만 사용 가능' : undefined}>
                  전체
                </button>
                )}
                {budgetCatsForYear.map((c: any) => (
                  <button key={c.id} onClick={() => setCat(String(c.id))}
                    className={cn('px-2.5 py-1 rounded-md text-[11px] font-bold transition-all',
                      !hasBudgetAccess ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
                      currentCat === String(c.id) ? 'bg-primary-500 text-white shadow-sm' : 'text-[var(--text-muted)]' + (hasBudgetAccess ? ' hover:text-[var(--text-primary)]' : ''))}
                    title={!hasBudgetAccess ? '예산담당자 또는 지출승인권자만 사용 가능' : undefined}>
                    {c.name}
                  </button>
                ))}
              </div>
            )
          })()}
        </div>
      )
    }
    if (isHpMode) {
      return (
        <div className="flex items-center gap-2 min-w-0">
          <ChevronRight size={14} className="text-[var(--text-muted)] shrink-0 hidden md:block" />
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500 text-white shrink-0">
            <Globe size={13} />
            <span className="text-[12px] font-bold">홈페이지</span>
          </div>
        </div>
      )
    }
    return (
      <div className="relative flex-1 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="업무, 담당자, 키워드 검색..."
          className={cn(
            'w-full pl-9 pr-4 py-2 rounded-lg text-sm',
            'bg-[var(--bg-muted)] border border-transparent',
            'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
            'focus:outline-none focus:border-primary-500 focus:bg-[var(--bg-surface)]',
            'transition-all duration-200',
          )}
        />
      </div>
    )
  }

  return (
    <header className="border-b border-[var(--border-default)] bg-[var(--bg-surface)] shrink-0 sticky top-0 z-30">
      {/* ── 1줄: 출퇴근 + 우측 액션 (모바일&데스크탑) ── */}
      <div className="flex items-center gap-2 px-3 md:px-5 h-14">
        {/* 데스크탑: 모드별 좌측영역 */}
        <div className="hidden md:block flex-1 min-w-0">
          {renderLeft()}
        </div>

        {/* 모바일: 출퇴근 위젯 (컴팩트) */}
        <div className="flex md:hidden items-center gap-0.5 bg-[var(--bg-muted)] rounded-xl px-1 py-0.5 border border-[var(--border-default)] flex-1 min-w-0">
          <div className="flex items-center gap-1 px-2 py-1.5 text-[10px] font-bold text-[var(--text-muted)]">
            <span className="text-[var(--text-muted)]">출근</span>
            <span className="text-green-600 dark:text-green-400 font-extrabold">{checkInTime}</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1.5 text-[10px] font-bold text-[var(--text-muted)]">
            <Clock size={10} className="text-primary-500" />
            <span className="text-[var(--text-primary)] font-extrabold tabular-nums">
              {`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`}
            </span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1.5 text-[10px] font-bold text-[var(--text-muted)]">
            <Timer size={10} className="text-amber-500" />
            <span className="text-amber-600 dark:text-amber-400 font-extrabold tabular-nums">{workTime}</span>
          </div>
          <button
            onClick={handleCheckOut}
            className="ml-auto w-6 h-6 rounded-lg bg-primary-500 hover:bg-primary-600 flex items-center justify-center cursor-pointer transition-colors shadow-sm shrink-0"
            title="퇴근하기"
          >
            <ArrowRight size={12} className="text-white" />
          </button>
        </div>

        {/* ── 출퇴근 위젯 (데스크탑) ── */}
        <div className="hidden lg:flex items-center gap-0.5 bg-[var(--bg-muted)] rounded-xl px-1 py-0.5 border border-[var(--border-default)] mx-auto">
          <div className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-[var(--text-muted)]">
            <ArrowRight size={11} className="text-green-500" />
            <span className="text-green-600 dark:text-green-400 font-extrabold">{checkInTime}</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-[var(--text-muted)]">
            <Clock size={11} className="text-primary-500" />
            <span className="text-[var(--text-primary)] font-extrabold tabular-nums">
              {`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`}
            </span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-[var(--text-muted)]">
            <Timer size={11} className="text-amber-500" />
            <span className="text-amber-600 dark:text-amber-400 font-extrabold tabular-nums">{workTime}</span>
          </div>
          <button
            onClick={handleCheckOut}
            className="ml-0.5 w-7 h-7 rounded-lg bg-primary-500 hover:bg-primary-600 flex items-center justify-center cursor-pointer transition-colors shadow-sm"
            title="퇴근하기"
          >
            <ArrowRight size={13} className="text-white" />
          </button>
        </div>

        {/* 오른쪽: 액션 */}
        <div className="flex items-center gap-0.5 ml-auto md:ml-0" ref={dropdownRef}>
          {/* 테마 토글 */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-[var(--text-muted)] transition-colors cursor-pointer"
            style={{ ['--hover-color' as string]: 'var(--color-primary-500)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-primary-500)'; e.currentTarget.style.background = 'color-mix(in srgb, var(--color-primary-500) 8%, transparent)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = ''; e.currentTarget.style.background = '' }}
            title="테마 변경"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* 알림 */}
          <div className="relative">
            <button
              onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false) }}
              className="p-2 rounded-lg text-[var(--text-muted)] transition-colors relative cursor-pointer"
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-primary-500)'; e.currentTarget.style.background = 'color-mix(in srgb, var(--color-primary-500) 8%, transparent)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = ''; e.currentTarget.style.background = '' }}
            >
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full border border-[var(--bg-surface)]" />
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-1 w-72 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-xl animate-scaleIn z-50">
                <div className="px-4 py-3 border-b border-[var(--border-default)]">
                  <span className="text-xs font-bold text-[var(--text-secondary)]">알림</span>
                </div>
                <div className="p-4 text-center text-sm text-[var(--text-muted)]">
                  새로운 알림이 없습니다
                </div>
              </div>
            )}
          </div>

          {/* 프로필 (모바일+데스크탑) */}
          {user && (
            <div className="relative">
              <button
                onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false) }}
                className="flex items-center gap-1.5 px-1.5 py-1 rounded-lg hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
              >
                <Avatar name={user.name} useAccent size="xs" />
                <span className="text-[11px] font-bold text-[var(--text-primary)] hidden md:inline">
                  {user.name}
                </span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-xl animate-scaleIn z-50 overflow-hidden">
                  <button
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
                  >
                    <User size={15} /> 개인설정
                  </button>
                  <div className="h-px bg-[var(--border-default)]" />
                  <button
                    onClick={() => { logout(); window.location.hash = '#/login' }}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-danger hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                  >
                    <LogOut size={15} /> 로그아웃
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── 2줄: 검색창 (모바일 전용) ── */}
      {!isAcctMode && !isHpMode && (
        <div className="md:hidden px-3 pb-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="업무, 담당자, 키워드 검색..."
              className={cn(
                'w-full pl-9 pr-4 py-2 rounded-lg text-sm',
                'bg-[var(--bg-muted)] border border-transparent',
                'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
                'focus:outline-none focus:border-primary-500 focus:bg-[var(--bg-surface)]',
                'transition-all duration-200',
              )}
            />
          </div>
        </div>
      )}
    </header>
  )
}
