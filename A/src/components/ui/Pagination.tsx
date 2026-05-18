import { cn } from '../../utils/cn'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

/* ═══════════════════════════════════════
   Pagination — 토큰 기반
   ═══════════════════════════════════════ */

interface PaginationProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
  className?: string
  showFirstLast?: boolean
}

export function Pagination({ page, totalPages, onChange, className, showFirstLast = true }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = getPageRange(page, totalPages)

  const btnBase = cn(
    'w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)] text-[length:var(--font-size-sm)]',
    'transition-all duration-150 cursor-pointer select-none',
  )

  return (
    <div className={cn('flex items-center gap-1 justify-center', className)}>
      {showFirstLast && (
        <button className={cn(btnBase, 'text-[var(--text-muted)] hover:bg-[var(--bg-muted)]')} onClick={() => onChange(1)} disabled={page === 1}>
          <ChevronsLeft size={16} />
        </button>
      )}
      <button className={cn(btnBase, 'text-[var(--text-muted)] hover:bg-[var(--bg-muted)]')} onClick={() => onChange(page - 1)} disabled={page === 1}>
        <ChevronLeft size={16} />
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dot-${i}`} className={cn(btnBase, 'text-[var(--text-muted)] cursor-default')}>…</span>
        ) : (
          <button
            key={p}
            className={cn(
              btnBase,
              p === page
                ? 'bg-[var(--btn-save-bg)] text-white font-bold shadow-sm'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]',
            )}
            onClick={() => onChange(p as number)}
          >
            {p}
          </button>
        )
      )}

      <button className={cn(btnBase, 'text-[var(--text-muted)] hover:bg-[var(--bg-muted)]')} onClick={() => onChange(page + 1)} disabled={page === totalPages}>
        <ChevronRight size={16} />
      </button>
      {showFirstLast && (
        <button className={cn(btnBase, 'text-[var(--text-muted)] hover:bg-[var(--bg-muted)]')} onClick={() => onChange(totalPages)} disabled={page === totalPages}>
          <ChevronsRight size={16} />
        </button>
      )}
    </div>
  )
}

function getPageRange(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '...')[] = [1]
  if (current > 3) pages.push('...')
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i)
  if (current < total - 2) pages.push('...')
  pages.push(total)
  return pages
}
