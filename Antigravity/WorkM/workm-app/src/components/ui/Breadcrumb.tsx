import { cn } from '../../utils/cn'
import { ChevronRight } from 'lucide-react'

/* ═══════════════════════════════════════
   Breadcrumb — 현재 위치 표시
   ═══════════════════════════════════════ */

interface BreadcrumbItem {
  label: string
  onClick?: () => void
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn('flex items-center gap-1.5', className)} aria-label="breadcrumb">
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <div key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={14} className="text-[var(--text-muted)]" />}
            {isLast ? (
              <span className="text-[length:var(--font-size-sm)] font-semibold text-[var(--text-primary)]">
                {item.label}
              </span>
            ) : (
              <button
                type="button"
                onClick={item.onClick}
                className={cn(
                  'text-[length:var(--font-size-sm)] text-[var(--text-muted)]',
                  'hover:text-[var(--text-primary)] transition-colors cursor-pointer',
                )}
              >
                {item.label}
              </button>
            )}
          </div>
        )
      })}
    </nav>
  )
}
