import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '../../utils/cn'
import { Avatar } from '../ui/Avatar'
import { useAuthStore } from '../../stores/authStore'
import { useThemeStore, SIDEBAR_WIDTH_VALUES } from '../../stores/themeStore'
import {
  Home, Building2, Info, Contact, SlidersHorizontal, Users,
  Settings, Calendar, BarChart3, Briefcase, Globe, Calculator,
  ChevronDown, ArrowLeft,
  /* 회계 전용 아이콘 (레거시 매칭) */
  LayoutDashboard, Wallet, Landmark, FileCheck, CreditCard,
  ArrowDownCircle, ArrowUpCircle, ScrollText, ContactRound, ArrowLeftRight,
  /* 홈페이지 전용 아이콘 (레거시 매칭) */
  Settings2, MenuSquare, LayoutPanelLeft, ClipboardList, Film, FileText, PenLine,
} from 'lucide-react'

interface NavEntry {
  path: string
  label: string
  icon: React.ElementType
  badge?: number
  disabled?: boolean
}

interface NavGroup {
  label: string
  icon: React.ElementType
  children: NavEntry[]
}

type NavItem = NavEntry | NavGroup

function isGroup(item: NavItem): item is NavGroup {
  return 'children' in item
}

/* ═══════════════════════════════════════════
   기본 사이드바 메뉴 (레거시와 동일)
   ═══════════════════════════════════════════ */
const mainNav: NavItem[] = [
  { path: '/', label: '나의책상', icon: Home },
  {
    label: '기본관리', icon: Building2,
    children: [
      { path: '/hq-info', label: '본사정보', icon: Info },
      { path: '/settings', label: '기타설정', icon: SlidersHorizontal },
      { path: '/staff', label: '사원관리', icon: Contact },
      { path: '/tasks', label: '업무분장', icon: Users },
    ],
  },
  { path: '/progress', label: '진행현황', icon: Settings },
]

const analyticsNav: NavItem[] = [
  { path: '/schedule', label: '일정보기', icon: Calendar },
  { path: '/performance', label: '실적보기', icon: BarChart3 },
]

const workNav: NavItem[] = [
  {
    label: '업무관리', icon: Briefcase,
    children: [
      { path: '/homepage', label: '홈페이지', icon: Globe },
      { path: '/accounting', label: '회계관리', icon: Calculator },
    ],
  },
]

/* ═══════════════════════════════════════════
   회계관리 전용 사이드바 메뉴 (레거시 acctNav 매칭)
   ═══════════════════════════════════════════ */
const acctNav: { tab: string; label: string; icon: React.ElementType }[] = [
  { tab: 'overview',     label: '기본현황',   icon: LayoutDashboard },
  { tab: 'base_budget',  label: '기초예산',   icon: Wallet },
  { tab: 'approval',     label: '품의하기',   icon: FileCheck },
  { tab: 'expense',      label: '지출하기',   icon: CreditCard },
  { tab: 'income',       label: '입금전표',   icon: ArrowDownCircle },
  { tab: 'withdrawal',   label: '출금전표',   icon: ArrowUpCircle },
  { tab: 'payment',      label: '전표장부',   icon: ScrollText },
  { tab: 'cashflow_list', label: '입출금내역', icon: ArrowLeftRight },
  { tab: 'reports',      label: '회계현황',   icon: BarChart3 },
  { tab: 'vendors',      label: '거래처관리',   icon: ContactRound },
  { tab: 'methodReg',    label: '수단등록',   icon: CreditCard },
  { tab: 'budgetTree',   label: '예산과목',   icon: Wallet },
  { tab: 'hq_vendor',    label: '본사거래처',   icon: Building2 },
  { tab: 'acct_mgmt',    label: '계정관리',   icon: Settings2 },
]

/* ═══════════════════════════════════════════
   홈페이지 전용 사이드바 메뉴 (레거시 homepageNav 매칭)
   ═══════════════════════════════════════════ */
const hpNav: { tab: string; label: string; icon: React.ElementType }[] = [
  { tab: 'basic',    label: '기본설정',          icon: Settings2 },
  { tab: 'menu',     label: '메뉴등록',          icon: MenuSquare },
  { tab: 'content',  label: '컨텐츠관리',        icon: LayoutPanelLeft },
  { tab: 'board',    label: '게시판관리',        icon: ClipboardList },
  { tab: 'media',    label: '미디어자료',        icon: Film },
  { tab: 'terms',    label: '약관관리',          icon: ScrollText },
  { tab: 'workshop', label: '신청서', icon: FileText },
  { tab: 'formBuilder', label: '신청서작성', icon: PenLine },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()
  const navigate = useNavigate()

  const isAcctMode = location.pathname === '/accounting'
  const isHpMode = location.pathname === '/homepage'
  const sidebarW = SIDEBAR_WIDTH_VALUES[useThemeStore((s) => s.sidebarWidth) || 'default']

  /* ═══════════════════════════════════════════
     회계관리 전용 사이드바
     ═══════════════════════════════════════════ */
  if (isAcctMode) {
    const currentTab = new URLSearchParams(location.search).get('tab') || 'overview'
    const currentYear = new URLSearchParams(location.search).get('year') || ''

    return (
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col',
          'bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)]',
          'transition-all duration-300 ease-in-out',
          collapsed ? 'w-[68px]' : '',
          'max-md:hidden',
        )}
        style={!collapsed ? { width: sidebarW } : undefined}
      >
        {/* 로고 */}
        <div
          className="flex items-center gap-3 px-4 h-16 shrink-0 cursor-pointer hover:bg-[var(--sidebar-hover)] transition-colors"
          onClick={onToggle}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-black text-sm shadow-lg shrink-0">
            W
          </div>
          {!collapsed && (
            <div className="overflow-hidden animate-fadeIn">
              <div className="text-sm font-extrabold text-[var(--sidebar-title)] tracking-tight">회계관리</div>
              <div className="text-[10px] text-[var(--sidebar-text)]">경리 시스템</div>
            </div>
          )}
        </div>

        {/* 네비게이션 */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5">
          <SectionLabel collapsed={collapsed}>회계관리</SectionLabel>
          {(() => {
            const userName = user?.name || JSON.parse(localStorage.getItem('ws_user') || '{}')?.name || ''
            const staffList = JSON.parse(localStorage.getItem('ws_users') || '[]') as any[]
            const currentStaff = staffList.find((s: any) => s.name === userName)
            const isAdmin = currentStaff?.role === 'admin'
            // 현재 선택된 회계연도 기준으로 예산 권한 확인
            const currentYear = parseInt(new URLSearchParams(location.search).get('year') || String(new Date().getFullYear()))
            const budgetCats = JSON.parse(localStorage.getItem('acct_budget_cats') || '[]') as any[]
            const yearCats = budgetCats.filter((c: any) => {
              const catYear = c.year || (c.periodFrom ? parseInt(c.periodFrom.substring(0, 4)) : 0)
              return catYear === currentYear
            })
            const isBudgetHandler = yearCats.some((c: any) =>
              (c.users && c.users.includes(userName)) ||
              (c.approvers && c.approvers.includes(userName)) ||
              (c.approver === userName)
            )
            // 품의에서 승인자로 지정된 경우도 관련자
            const approvals = JSON.parse(localStorage.getItem('acct_approvals') || '[]') as any[]
            const isApproverInApprovals = approvals.some((a: any) => a.approver === userName)
            const hasBudgetAccess = isAdmin || isBudgetHandler || isApproverInApprovals
            // 품의하기만 허용, 나머지 모든 탭 제한 (화이트리스트 방식)
            const allowedTabs = ['approval']

            return acctNav.map((entry) => {
              const Icon = entry.icon
              const isActive = currentTab === entry.tab
              const isRestricted = !hasBudgetAccess && !allowedTabs.includes(entry.tab)

              return (
                <button
                  key={entry.tab}
                  onClick={isRestricted ? undefined : () => navigate(`/accounting?tab=${entry.tab}${currentYear ? `&year=${currentYear}` : ''}`)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg h-9 w-full transition-all duration-150',
                    collapsed ? 'justify-center px-0 mx-1' : 'px-3',
                    isRestricted
                      ? 'opacity-40 cursor-not-allowed'
                      : 'cursor-pointer',
                    isActive && !isRestricted
                      ? 'font-bold'
                      : isRestricted
                        ? ''
                        : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-title)]',
                  )}
                  style={isActive && !isRestricted ? { color: 'var(--sidebar-active)', background: 'color-mix(in srgb, var(--sidebar-active) 10%, transparent)' } : undefined}
                  title={isRestricted ? '예산담당자 또는 지출승인권자만 사용 가능' : (collapsed ? entry.label : undefined)}
                >
                  <Icon size={18} className="shrink-0" style={isActive && !isRestricted ? { color: 'var(--sidebar-active)' } : undefined} />
                  {!collapsed && <span className="text-[13px] truncate" style={isActive && !isRestricted ? { color: 'var(--sidebar-active)' } : undefined}>{entry.label}</span>}
                  {!collapsed && isRestricted && <span className="ml-auto text-[8px]">🔒</span>}
                </button>
              )
            })
          })()}
        </nav>

        {/* 내 책상으로 */}
        <div className="border-t border-[var(--sidebar-border)] px-2.5 py-3 shrink-0">
          <button
            onClick={() => navigate('/')}
            className={cn(
              'flex items-center gap-3 rounded-lg h-10 w-full transition-all duration-150 cursor-pointer',
              'hover:opacity-80 font-bold',
              collapsed ? 'justify-center px-0' : 'px-3',
            )}
            style={{ color: 'var(--sidebar-active)', background: 'color-mix(in srgb, var(--sidebar-active) 10%, transparent)' }}
            title={collapsed ? '내 책상으로' : undefined}
          >
            <ArrowLeft size={18} className="shrink-0" />
            {!collapsed && <span className="text-[13px]">내 책상으로</span>}
          </button>
        </div>
      </aside>
    )
  }

  /* ═══════════════════════════════════════════
     홈페이지 전용 사이드바
     ═══════════════════════════════════════════ */
  if (isHpMode) {
    const currentTab = new URLSearchParams(location.search).get('tab') || 'basic'

    return (
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col',
          'bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)]',
          'transition-all duration-300 ease-in-out',
          collapsed ? 'w-[68px]' : '',
          'max-md:hidden',
        )}
        style={!collapsed ? { width: sidebarW } : undefined}
      >
        {/* 로고 */}
        <div
          className="flex items-center gap-3 px-4 h-16 shrink-0 cursor-pointer hover:bg-[var(--sidebar-hover)] transition-colors"
          onClick={onToggle}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-black text-sm shadow-lg shrink-0">
            W
          </div>
          {!collapsed && (
            <div className="overflow-hidden animate-fadeIn">
              <div className="text-sm font-extrabold text-[var(--sidebar-title)] tracking-tight">홈페이지</div>
              <div className="text-[10px] text-[var(--sidebar-text)]">홈페이지 업무</div>
            </div>
          )}
        </div>

        {/* 네비게이션 */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5">
          <SectionLabel collapsed={collapsed}>홈페이지 업무</SectionLabel>
          {hpNav.map((entry) => {
            const Icon = entry.icon
            const isActive = currentTab === entry.tab

            return (
              <button
                key={entry.tab}
                onClick={() => navigate(`/homepage?tab=${entry.tab}`)}
                className={cn(
                  'flex items-center gap-3 rounded-lg h-9 w-full transition-all duration-150 cursor-pointer',
                  collapsed ? 'justify-center px-0 mx-1' : 'px-3',
                  isActive
                    ? 'font-bold'
                    : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-title)]',
                )}
                style={isActive ? { color: 'var(--sidebar-active)', background: 'color-mix(in srgb, var(--sidebar-active) 10%, transparent)' } : undefined}
                title={collapsed ? entry.label : undefined}
              >
                <Icon size={18} className="shrink-0" style={isActive ? { color: 'var(--sidebar-active)' } : undefined} />
                {!collapsed && <span className="text-[13px] truncate" style={isActive ? { color: 'var(--sidebar-active)' } : undefined}>{entry.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* 내 책상으로 */}
        <div className="border-t border-[var(--sidebar-border)] px-2.5 py-3 shrink-0">
          <button
            onClick={() => navigate('/')}
            className={cn(
              'flex items-center gap-3 rounded-lg h-10 w-full transition-all duration-150 cursor-pointer',
              'hover:opacity-80 font-bold',
              collapsed ? 'justify-center px-0' : 'px-3',
            )}
            title={collapsed ? '내 책상으로' : undefined}
          >
            <ArrowLeft size={18} className="shrink-0" />
            {!collapsed && <span className="text-[13px]">내 책상으로</span>}
          </button>
        </div>
      </aside>
    )
  }

  /* ═══════════════════════════════════════════
     기본 사이드바
     ═══════════════════════════════════════════ */
  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex flex-col',
        'bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)]',
        'transition-all duration-300 ease-in-out',
        collapsed ? 'w-[68px]' : '',
        'max-md:hidden',
      )}
      style={!collapsed ? { width: sidebarW } : undefined}
    >
      {/* 로고 */}
      <div
        className="flex items-center gap-3 px-4 h-16 shrink-0 cursor-pointer hover:bg-[var(--sidebar-hover)] transition-colors"
        onClick={onToggle}
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-black text-sm shadow-lg shrink-0">
          W
        </div>
        {!collapsed && (
          <div className="overflow-hidden animate-fadeIn">
            <div className="text-sm font-extrabold text-[var(--sidebar-title)] tracking-tight">WorkM</div>
            <div className="text-[10px] text-[var(--sidebar-text)]">v3.0.0</div>
          </div>
        )}
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5">
        <SectionLabel collapsed={collapsed}>Main</SectionLabel>
        {(() => {
          const userName = user?.name || ''
          const staffList = JSON.parse(localStorage.getItem('ws_users') || '[]') as any[]
          const currentStaff = staffList.find((s: any) => s.name === userName)
          const isBudgetApprover = currentStaff?.approverType === 'approver'
          
          // 사원관리(/staff)는 지출승인권자만 클릭 가능
          const filteredMainNav = mainNav.map(item => {
            if (isGroup(item) && item.label === '기본관리') {
              return {
                ...item,
                children: item.children.map(child => 
                  child.path === '/staff' && !isBudgetApprover
                    ? { ...child, disabled: true }
                    : child
                )
              }
            }
            return item
          })
          
          return filteredMainNav.map((item, i) => (
            <NavItemRenderer key={i} item={item} collapsed={collapsed} currentPath={location.pathname} />
          ))
        })()}

        <SectionLabel collapsed={collapsed}>Analytics</SectionLabel>
        {analyticsNav.map((item, i) => (
          <NavItemRenderer key={i} item={item} collapsed={collapsed} currentPath={location.pathname} />
        ))}

        <SectionLabel collapsed={collapsed}>Work</SectionLabel>
        {workNav.map((item, i) => (
          <NavItemRenderer key={i} item={item} collapsed={collapsed} currentPath={location.pathname} />
        ))}
      </nav>

      {/* 사용자 정보 */}
      {user && (
        <div className={cn(
          'border-t border-[var(--sidebar-border)] px-3 py-3 shrink-0',
          collapsed ? 'flex justify-center' : '',
        )}>
          <NavLink
            to="/profile"
            className={cn(
              'flex items-center gap-3 rounded-lg px-2 py-2',
              'hover:bg-[var(--sidebar-hover)] transition-colors',
            )}
          >
            <Avatar name={user.name} useAccent size="sm" />
            {!collapsed && (
              <div className="min-w-0 animate-fadeIn">
                <div className="text-xs font-bold text-[var(--sidebar-title)] truncate">{user.name}</div>
                <div className="text-[10px] text-[var(--sidebar-text)] truncate">
                  {user.rank || user.position || '사원'}
                </div>
              </div>
            )}
          </NavLink>
        </div>
      )}
    </aside>
  )
}

/* ── 섹션 라벨 ── */
function SectionLabel({ children, collapsed }: { children: string; collapsed: boolean }) {
  if (collapsed) return <div className="h-px bg-[var(--sidebar-border)] my-2 mx-1" />
  return (
    <div className="text-[10px] font-bold uppercase tracking-[.12em] text-[var(--sidebar-text)] px-3 pt-4 pb-1.5">
      {children}
    </div>
  )
}

/* ── 네비게이션 아이템 렌더러 ── */
function NavItemRenderer({
  item,
  collapsed,
  currentPath,
}: {
  item: NavItem
  collapsed: boolean
  currentPath: string
}) {
  if (isGroup(item)) {
    return <NavGroupItem group={item} collapsed={collapsed} currentPath={currentPath} />
  }
  return <NavSingleItem entry={item} collapsed={collapsed} />
}

/* ── 단일 링크 ── */
function NavSingleItem({ entry, collapsed }: { entry: NavEntry; collapsed: boolean }) {
  const Icon = entry.icon
  const location = useLocation()
  const nav = useNavigate()
  const hasQuery = entry.path.includes('?')

  // disabled 상태
  if (entry.disabled) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 rounded-lg h-9 w-full opacity-40 cursor-not-allowed',
          collapsed ? 'justify-center px-0 mx-1' : 'px-3',
        )}
        title={collapsed ? entry.label : '접근 권한이 없습니다'}
      >
        <span className="shrink-0 flex items-center text-[var(--sidebar-text)]">
          <Icon size={18} />
        </span>
        {!collapsed && <span className="text-[13px] truncate text-[var(--sidebar-text)]">{entry.label}</span>}
        {!collapsed && <span className="ml-auto text-[8px] text-[var(--text-muted)]">🔒</span>}
      </div>
    )
  }

  // 쿼리 파라미터가 있는 경우: button + useNavigate 방식
  if (hasQuery) {
    const [pathname, search] = entry.path.split('?')
    const isActive = location.pathname === pathname && location.search === '?' + search
    return (
      <button
        onClick={() => nav(entry.path)}
        className={cn(
          'flex items-center gap-3 rounded-lg h-9 w-full transition-all duration-150 cursor-pointer',
          collapsed ? 'justify-center px-0 mx-1' : 'px-3',
          isActive
            ? 'font-bold'
            : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-title)]',
        )}
        style={isActive ? { color: 'var(--sidebar-active)', background: 'color-mix(in srgb, var(--sidebar-active) 10%, transparent)' } : undefined}
        title={collapsed ? entry.label : undefined}
      >
        <span className="shrink-0 flex items-center" style={isActive ? { color: 'var(--sidebar-active)' } : undefined}>
          <Icon size={18} />
        </span>
        {!collapsed && <span className="text-[13px] truncate" style={isActive ? { color: 'var(--sidebar-active)' } : undefined}>{entry.label}</span>}
      </button>
    )
  }

  // 일반 경로: NavLink 사용
  return (
    <NavLink
      to={entry.path}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg h-9 transition-all duration-150',
          collapsed ? 'justify-center px-0 mx-1' : 'px-3',
          isActive
            ? 'font-bold'
            : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-title)]',
        )
      }
      style={({ isActive }) => isActive ? { color: 'var(--sidebar-active)', background: 'color-mix(in srgb, var(--sidebar-active) 10%, transparent)' } : undefined}
      title={collapsed ? entry.label : undefined}
    >
      {({ isActive }) => (
        <>
          <span className="shrink-0 flex items-center" style={isActive ? { color: 'var(--sidebar-active)' } : undefined}>
            <Icon size={18} />
          </span>
          {!collapsed && <span className="text-[13px] truncate" style={isActive ? { color: 'var(--sidebar-active)' } : undefined}>{entry.label}</span>}
          {!collapsed && entry.badge !== undefined && entry.badge > 0 && (
            <span className="ml-auto text-[10px] font-bold text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center" style={{ background: 'var(--sidebar-active)' }}>
              {entry.badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

/* ── 서브메뉴 그룹 ── */
function NavGroupItem({
  group,
  collapsed,
  currentPath,
}: {
  group: NavGroup
  collapsed: boolean
  currentPath: string
}) {
  const hasActiveChild = group.children.some((c) => currentPath === c.path)
  const [expanded, setExpanded] = useState(hasActiveChild)
  const Icon = group.icon

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'flex items-center gap-3 rounded-lg h-9 w-full transition-all duration-150 cursor-pointer',
          collapsed ? 'justify-center px-0 mx-1' : 'px-3',
          hasActiveChild
            ? 'text-[var(--sidebar-title)]'
            : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-title)]',
        )}
        title={collapsed ? group.label : undefined}
      >
        <Icon size={18} className="shrink-0" />
        {!collapsed && (
          <>
            <span className="text-[13px] truncate flex-1 text-left">{group.label}</span>
            <ChevronDown
              size={14}
              className={cn('shrink-0 transition-transform duration-200', expanded && 'rotate-180')}
            />
          </>
        )}
      </button>

      {!collapsed && expanded && (
        <div className="ml-4 pl-3 border-l border-[var(--sidebar-border)] mt-0.5 space-y-0.5 animate-fadeIn">
          {group.children.map((child) => (
            <NavSingleItem key={child.path} entry={child} collapsed={false} />
          ))}
        </div>
      )}
    </div>
  )
}
