import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes, TableHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'
import { ChevronUp, ChevronDown } from 'lucide-react'

/* ═══════════════════════════════════════
   Table System — 토큰 기반
   ═══════════════════════════════════════ */

/* ── Table Wrapper ── */
export function Table({ children, className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--table-border)]">
      <table className={cn('w-full text-[length:var(--font-size-body)]', className)} {...props}>
        {children}
      </table>
    </div>
  )
}

/* ── Head ── */
export function TableHead({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <thead className={cn('bg-[var(--table-header-bg)] border-b border-[var(--table-border)]', className)}>
      {children}
    </thead>
  )
}

/* ── Body ── */
export function TableBody({ children, className, striped }: { children: ReactNode; className?: string; striped?: boolean }) {
  return (
    <tbody className={cn(striped && '[&>tr:nth-child(even)]:bg-[var(--table-stripe)]', className)}>
      {children}
    </tbody>
  )
}

/* ── Row ── */
export function TableRow({ children, className, onClick, selected }: {
  children: ReactNode; className?: string; onClick?: () => void; selected?: boolean
}) {
  return (
    <tr
      className={cn(
        'border-b border-[var(--table-border)] last:border-b-0 transition-colors',
        'hover:bg-[var(--table-row-hover)]',
        selected && 'bg-primary-50/50 dark:bg-primary-900/10',
        onClick && 'cursor-pointer',
        className,
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  )
}

/* ── Header Cell ── */
interface ThProps extends ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean
  sorted?: 'asc' | 'desc' | null
  onSort?: () => void
}

export function Th({ children, className, sortable, sorted, onSort, ...props }: ThProps) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-left text-[length:var(--font-size-xs)] font-bold uppercase tracking-wider',
        'text-[var(--text-muted)]',
        sortable && 'cursor-pointer select-none hover:text-[var(--text-primary)]',
        className,
      )}
      onClick={sortable ? onSort : undefined}
      {...props}
    >
      <div className="flex items-center gap-1.5">
        {children}
        {sortable && (
          <span className="flex flex-col">
            <ChevronUp size={10} className={cn('text-[var(--text-muted)]', sorted === 'asc' && 'text-primary-500')} />
            <ChevronDown size={10} className={cn('-mt-1 text-[var(--text-muted)]', sorted === 'desc' && 'text-primary-500')} />
          </span>
        )}
      </div>
    </th>
  )
}

/* ── Data Cell ── */
export function Td({ children, className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        'px-4 py-3 text-[length:var(--font-size-body)] text-[var(--text-primary)]',
        className,
      )}
      {...props}
    >
      {children}
    </td>
  )
}

/* ── Empty Table Message ── */
export function TableEmpty({ message = '데이터가 없습니다', colSpan = 5 }: { message?: string; colSpan?: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="text-center py-12 text-[var(--text-muted)] text-[length:var(--font-size-sm)]">
        {message}
      </td>
    </tr>
  )
}
