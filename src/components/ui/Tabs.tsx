import { type ReactNode, useState } from 'react'
import { cn } from '../../utils/cn'

/* ═══════════════════════════════════════
   Tabs — 토큰 기반
   ═══════════════════════════════════════ */

export type TabStyle = 'underline' | 'box' | 'pill'

interface TabItem {
  key: string
  label: ReactNode
  icon?: ReactNode
  count?: number
  disabled?: boolean
}

interface TabsProps {
  items: TabItem[]
  activeKey: string
  onChange: (key: string) => void
  style?: TabStyle
  className?: string
  fullWidth?: boolean
}

export function Tabs({ items, activeKey, onChange, style = 'underline', className, fullWidth }: TabsProps) {
  return (
    <div
      className={cn(
        'flex gap-1',
        style === 'underline' && 'border-b border-[var(--tab-border)]',
        fullWidth && 'w-full',
        className,
      )}
    >
      {items.map((item) => {
        const isActive = item.key === activeKey
        return (
          <button
            key={item.key}
            type="button"
            disabled={item.disabled}
            onClick={() => !item.disabled && onChange(item.key)}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 text-[length:var(--font-size-sm)] font-semibold',
              'transition-all duration-200 cursor-pointer select-none whitespace-nowrap',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              fullWidth && 'flex-1 justify-center',

              /* ── Underline ── */
              style === 'underline' && [
                'border-b-2 -mb-px',
                isActive
                  ? 'border-[var(--tab-active-color)] text-[var(--tab-active-color)]'
                  : 'border-transparent text-[var(--tab-text)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]',
              ],

              /* ── Box ── */
              style === 'box' && [
                'rounded-[var(--radius-sm)] border',
                isActive
                  ? 'bg-[var(--tab-active-bg)] text-[var(--tab-active-color)] border-[var(--tab-active-color)]/20'
                  : 'bg-transparent text-[var(--tab-text)] border-transparent hover:bg-[var(--bg-muted)]',
              ],

              /* ── Pill ── */
              style === 'pill' && [
                'rounded-full',
                isActive
                  ? 'bg-[var(--btn-save-bg)] text-white shadow-sm'
                  : 'text-[var(--tab-text)] hover:bg-[var(--bg-muted)]',
              ],
            )}
          >
            {item.icon && <span className="shrink-0">{item.icon}</span>}
            {item.label}
            {item.count !== undefined && (
              <span
                className={cn(
                  'text-[length:var(--font-size-xxs)] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center',
                  isActive
                    ? (style === 'pill' ? 'bg-white/20 text-white' : 'bg-[var(--tab-active-color)]/10 text-[var(--tab-active-color)]')
                    : 'bg-[var(--bg-muted)] text-[var(--text-muted)]',
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/* ── Controlled Tabs with Content ── */
interface TabPanelsProps {
  items: (TabItem & { content: ReactNode })[]
  defaultKey?: string
  style?: TabStyle
  className?: string
}

export function TabPanels({ items, defaultKey, style, className }: TabPanelsProps) {
  const [active, setActive] = useState(defaultKey || items[0]?.key || '')

  return (
    <div className={className}>
      <Tabs items={items} activeKey={active} onChange={setActive} style={style} />
      <div className="mt-4">
        {items.find(i => i.key === active)?.content}
      </div>
    </div>
  )
}
