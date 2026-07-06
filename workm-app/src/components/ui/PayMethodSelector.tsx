import { useState, useRef, useEffect } from 'react'
import { Building2, CreditCard, Banknote, FileText, Ticket, ChevronDown, Check, ArrowRightLeft } from 'lucide-react'
import { cn } from '../../utils/cn'

export interface PayMethodGroup {
  id: string        // 'account' | 'cash' | 'note' | 'voucher'
  label: string     // '계좌' | '현금' | '어음' | '상품권'
  items: PayMethodOption[]
}

export interface PayMethodOption {
  value: string
  label: string
  sub?: string      // 하위 정보 (계좌번호, 잔액 등)
  isCard?: boolean   // 카드 여부
  section?: string   // 섹션 구분 ('이체' | '카드')
}

interface Props {
  value: string
  onChange: (value: string, option?: PayMethodOption) => void
  groups: PayMethodGroup[]
  placeholder?: string
}

const tabIcons: Record<string, typeof Building2> = {
  account: Building2,
  cash: Banknote,
  note: FileText,
  voucher: Ticket,
}

const tabColors: Record<string, string> = {
  account: 'text-blue-500',
  cash: 'text-emerald-500',
  note: 'text-amber-500',
  voucher: 'text-rose-500',
}

const tabBg: Record<string, string> = {
  account: 'bg-blue-500 text-white',
  cash: 'bg-emerald-500 text-white',
  note: 'bg-amber-500 text-white',
  voucher: 'bg-rose-500 text-white',
}

const sectionIcons: Record<string, typeof Building2> = {
  '이체': ArrowRightLeft,
  '카드': CreditCard,
}

export function PayMethodSelector({ value, onChange, groups, placeholder = '— 선택 —' }: Props) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(() => {
    for (const g of groups) {
      if (g.items.some(i => i.value === value)) return g.id
    }
    return groups[0]?.id || 'account'
  })
  const ref = useRef<HTMLDivElement>(null)

  // 외부 클릭 닫기
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // 드롭다운 위치 조정
  const [dropUp, setDropUp] = useState(false)
  useEffect(() => {
    if (!open || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    setDropUp(spaceBelow < 320)
  }, [open])

  // 선택된 항목 라벨 찾기
  const selectedLabel = (() => {
    for (const g of groups) {
      const item = g.items.find(i => i.value === value)
      if (item) {
        const Icon = item.isCard ? CreditCard : tabIcons[g.id] || Building2
        return (
          <span className="flex items-center gap-1.5">
            <Icon size={13} className={tabColors[g.id] || 'text-blue-500'} />
            <span className="truncate">{item.label}</span>
            {item.sub && <span className="text-[10px] text-[var(--text-muted)] truncate">({item.sub})</span>}
          </span>
        )
      }
    }
    return <span className="text-[var(--text-muted)]">{placeholder}</span>
  })()

  const activeGroup = groups.find(g => g.id === activeTab)
  const nonEmptyGroups = groups.filter(g => g.items.length > 0)

  // 섹션별 아이템 그룹핑
  const renderItems = () => {
    if (!activeGroup || activeGroup.items.length === 0) {
      return <div className="py-6 text-center text-[12px] text-[var(--text-muted)]">항목이 없습니다</div>
    }

    const sections: { name: string; items: PayMethodOption[] }[] = []
    let currentSection = ''
    activeGroup.items.forEach(item => {
      const sec = item.section || ''
      if (sec !== currentSection) {
        currentSection = sec
        sections.push({ name: sec, items: [item] })
      } else {
        if (sections.length === 0) sections.push({ name: '', items: [] })
        sections[sections.length - 1].items.push(item)
      }
    })

    return sections.map((sec, si) => (
      <div key={si}>
        {/* 섹션 헤더 */}
        {sec.name && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-muted)] border-b border-[var(--border-default)]">
            {sectionIcons[sec.name] && (() => {
              const SIcon = sectionIcons[sec.name]
              return <SIcon size={11} className="text-[var(--text-muted)]" />
            })()}
            <span className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider">{sec.name}</span>
            <span className="text-[9px] text-[var(--text-muted)]">({sec.items.length})</span>
          </div>
        )}
        {/* 섹션 아이템 */}
        {sec.items.map((item, idx) => {
          const isSelected = item.value === value
          const Icon = item.isCard ? CreditCard : (item.section === '이체' ? ArrowRightLeft : tabIcons[activeTab] || Building2)
          return (
            <button
              key={item.value + idx}
              type="button"
              onClick={() => {
                onChange(item.value, item)
                setOpen(false)
              }}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-[12px] transition-all cursor-pointer',
                isSelected
                  ? 'bg-primary-50 dark:bg-primary-900/20'
                  : 'hover:bg-[var(--bg-muted)]',
                idx > 0 && 'border-t border-[var(--border-default)]/30'
              )}
            >
              <div className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                isSelected
                  ? 'bg-primary-100 dark:bg-primary-900/40'
                  : item.isCard ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-blue-50 dark:bg-blue-900/20'
              )}>
                <Icon size={14} className={cn(
                  isSelected ? 'text-primary-500' : (item.isCard ? 'text-indigo-500' : tabColors[activeTab] || 'text-[var(--text-muted)]')
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn('font-bold truncate', isSelected && 'text-primary-700 dark:text-primary-300')}>{item.label}</div>
                {item.sub && <div className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">{item.sub}</div>}
              </div>
              {isSelected && <Check size={14} className="text-primary-500 shrink-0" />}
            </button>
          )
        })}
      </div>
    ))
  }

  return (
    <div ref={ref} className="relative w-full">
      {/* 트리거 */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full flex items-center justify-between px-2.5 py-2 rounded-lg border bg-[var(--bg-surface)] text-[12px] text-left transition-all cursor-pointer',
          open ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-[var(--border-default)] hover:border-[var(--border-hover)]'
        )}
      >
        <span className="flex-1 min-w-0 truncate">{selectedLabel}</span>
        <ChevronDown size={14} className={cn('shrink-0 text-[var(--text-muted)] transition-transform', open && 'rotate-180')} />
      </button>

      {/* 드롭다운 */}
      {open && (
        <div
          className={cn(
            'absolute left-0 right-0 z-50 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-xl overflow-hidden',
            dropUp ? 'bottom-full mb-1' : 'top-full mt-1'
          )}
          style={{ maxHeight: '360px' }}
        >
          {/* 탭 헤더 */}
          <div className="flex border-b border-[var(--border-default)] bg-[var(--bg-muted)] px-1 py-1 gap-0.5 overflow-x-auto scrollbar-hide">
            {nonEmptyGroups.map(g => {
              const Icon = tabIcons[g.id] || Building2
              const isActive = activeTab === g.id
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setActiveTab(g.id)}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer',
                    isActive
                      ? tabBg[g.id] + ' shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
                  )}
                >
                  <Icon size={12} />
                  {g.label}
                  <span className={cn(
                    'text-[9px] px-1 py-0.5 rounded-full font-bold min-w-[16px] text-center',
                    isActive ? 'bg-white/25' : 'bg-[var(--bg-subtle)] text-[var(--text-muted)]'
                  )}>
                    {g.items.length}
                  </span>
                </button>
              )
            })}
          </div>

          {/* 항목 리스트 */}
          <div className="overflow-y-auto" style={{ maxHeight: '300px' }}>
            {renderItems()}
          </div>
        </div>
      )}
    </div>
  )
}
