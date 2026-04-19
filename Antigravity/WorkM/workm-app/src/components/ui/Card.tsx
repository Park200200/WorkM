import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

/* ═══════════════════════════════════════
   Card System — 토큰 기반
   ═══════════════════════════════════════ */

interface CardProps {
  children: ReactNode
  className?: string
  padding?: boolean
  hover?: boolean
  onClick?: () => void
}

export function Card({ children, className, padding = true, hover, onClick }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)]',
        'shadow-xs transition-all duration-200',
        padding && 'p-[var(--card-padding)]',
        hover && 'hover:shadow-md hover:border-[var(--border-strong)] cursor-pointer',
        onClick && 'cursor-pointer',
        className,
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

/* ── Sub-components ── */
export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between mb-[var(--space-4)]', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-[length:var(--font-size-body)] font-extrabold text-[var(--text-primary)]', className)}>
      {children}
    </h3>
  )
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(className)}>{children}</div>
}

/* ═══════════════════════════════════════
   SummaryCard — 대시보드 통계 요약
   ═══════════════════════════════════════ */
interface SummaryCardProps {
  icon: ReactNode
  label: string
  value: string | number
  change?: string
  changeType?: 'up' | 'down' | 'neutral'
  className?: string
  onClick?: () => void
}

export function SummaryCard({ icon, label, value, change, changeType = 'neutral', className, onClick }: SummaryCardProps) {
  return (
    <Card hover={!!onClick} onClick={onClick} className={cn('flex items-center gap-[var(--space-4)]', className)}>
      <div className="w-11 h-11 rounded-[var(--radius-md)] bg-[var(--tab-active-bg)] flex items-center justify-center text-[var(--tab-active-color)] shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[length:var(--font-size-xs)] text-[var(--text-muted)] font-medium truncate">{label}</p>
        <p className="text-[length:var(--font-size-h3)] font-extrabold text-[var(--text-primary)]">{value}</p>
      </div>
      {change && (
        <span
          className={cn(
            'text-[length:var(--font-size-xs)] font-bold',
            changeType === 'up' && 'text-[var(--color-success-500)]',
            changeType === 'down' && 'text-[var(--color-danger-500)]',
            changeType === 'neutral' && 'text-[var(--text-muted)]',
          )}
        >
          {change}
        </span>
      )}
    </Card>
  )
}

/* ═══════════════════════════════════════
   TaskCard — 업무 카드
   ═══════════════════════════════════════ */
interface TaskCardProps {
  title: string
  team?: string
  assignee?: ReactNode
  status?: ReactNode
  progress?: number
  dueDate?: string
  important?: boolean
  className?: string
  onClick?: () => void
}

export function TaskCard({ title, team, assignee, status, progress, dueDate, important, className, onClick }: TaskCardProps) {
  return (
    <Card hover onClick={onClick} className={cn(important && 'border-l-3 border-l-[var(--color-warning-500)]', className)}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-[length:var(--font-size-body)] font-bold text-[var(--text-primary)] truncate">{title}</h4>
          {team && <p className="text-[length:var(--font-size-xs)] text-[var(--text-muted)] mt-0.5">{team}</p>}
        </div>
        {status}
      </div>
      {typeof progress === 'number' && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[length:var(--font-size-xxs)] text-[var(--text-muted)]">진행률</span>
            <span className="text-[length:var(--font-size-xs)] font-bold text-[var(--text-primary)]">{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--progress-track)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--progress-fill)] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mt-3">
        {assignee && <div className="flex items-center gap-2">{assignee}</div>}
        {dueDate && <span className="text-[length:var(--font-size-xs)] text-[var(--text-muted)]">{dueDate}</span>}
      </div>
    </Card>
  )
}

/* ═══════════════════════════════════════
   ContentCard — 콘텐츠 카드 (썸네일 포함)
   ═══════════════════════════════════════ */
interface ContentCardProps {
  title: string
  description?: string
  thumbnail?: string
  badge?: ReactNode
  meta?: ReactNode
  className?: string
  onClick?: () => void
}

export function ContentCard({ title, description, thumbnail, badge, meta, className, onClick }: ContentCardProps) {
  return (
    <Card hover onClick={onClick} padding={false} className={cn('overflow-hidden', className)}>
      {thumbnail && (
        <div className="aspect-video bg-[var(--bg-muted)] overflow-hidden">
          <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-[var(--card-padding)]">
        {badge && <div className="mb-2">{badge}</div>}
        <h4 className="text-[length:var(--font-size-body)] font-bold text-[var(--text-primary)] line-clamp-2">{title}</h4>
        {description && (
          <p className="text-[length:var(--font-size-xs)] text-[var(--text-muted)] mt-1.5 line-clamp-2">{description}</p>
        )}
        {meta && <div className="mt-3 flex items-center gap-2 text-[length:var(--font-size-xxs)] text-[var(--text-muted)]">{meta}</div>}
      </div>
    </Card>
  )
}
