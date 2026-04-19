import { cn } from '../../utils/cn'
import { useThemeStore } from '../../stores/themeStore'

/* ═══════════════════════════════════════
   Badge — 상태/분류 프리셋 포함
   ═══════════════════════════════════════ */

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple'

/* ── 상태 프리셋 ── */
export type StatusPreset = 'waiting' | 'progress' | 'complete' | 'delay'
/* ── 분류 프리셋 ── */
export type CategoryPreset = 'news' | 'youtube' | 'blog' | 'website'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  status?: StatusPreset
  category?: CategoryPreset
  className?: string
  dot?: boolean
  size?: 'sm' | 'md'
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[var(--bg-muted)] text-[var(--text-secondary)] border-[var(--border-default)]',
  primary: 'bg-primary-50 text-primary-600 border-primary-200 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-800',
  success: 'bg-[var(--color-success-50)] text-[var(--color-success-700)] border-[var(--color-success-200)] dark:bg-[var(--color-success-500)]/10 dark:text-[var(--color-success-400)] dark:border-[var(--color-success-700)]',
  warning: 'bg-[var(--color-warning-50)] text-[var(--color-warning-700)] border-[var(--color-warning-200)] dark:bg-[var(--color-warning-500)]/10 dark:text-[var(--color-warning-400)] dark:border-[var(--color-warning-700)]',
  danger:  'bg-[var(--color-danger-50)] text-[var(--color-danger-700)] border-[var(--color-danger-200)] dark:bg-[var(--color-danger-500)]/10 dark:text-[var(--color-danger-400)] dark:border-[var(--color-danger-700)]',
  info:    'bg-[var(--color-info-50)] text-[var(--color-info-700)] border-[var(--color-info-200)] dark:bg-[var(--color-info-500)]/10 dark:text-[var(--color-info-400)] dark:border-[var(--color-info-700)]',
  purple:  'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
}

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-[var(--text-muted)]',
  primary: 'bg-primary-500',
  success: 'bg-[var(--color-success-500)]',
  warning: 'bg-[var(--color-warning-500)]',
  danger:  'bg-[var(--color-danger-500)]',
  info:    'bg-[var(--color-info-500)]',
  purple:  'bg-purple-500',
}

/* ── 상태 → variant 매핑 ── */
const statusMap: Record<StatusPreset, { variant: BadgeVariant; label: string }> = {
  waiting:  { variant: 'warning', label: '대기' },
  progress: { variant: 'info',    label: '진행중' },
  complete: { variant: 'success', label: '완료' },
  delay:    { variant: 'danger',  label: '지연' },
}

/* ── 분류 → variant 매핑 ── */
const categoryMap: Record<CategoryPreset, { variant: BadgeVariant; label: string }> = {
  news:    { variant: 'info',    label: '뉴스' },
  youtube: { variant: 'danger',  label: '유튜브' },
  blog:    { variant: 'success', label: '블로그' },
  website: { variant: 'purple',  label: '웹사이트' },
}

export function Badge({ children, variant = 'default', status, category, className, dot, size = 'md' }: BadgeProps) {
  /* 프리셋 자동 적용 */
  let resolvedVariant = variant
  let resolvedLabel = children

  if (status) {
    const preset = statusMap[status]
    resolvedVariant = preset.variant
    resolvedLabel = resolvedLabel || preset.label
  } else if (category) {
    const preset = categoryMap[category]
    resolvedVariant = preset.variant
    resolvedLabel = resolvedLabel || preset.label
  }

  const shape = useThemeStore((s) => s.badgeShape) || 'pill'
  const shapeClass = shape === 'pill' ? 'rounded-full' : shape === 'rounded' ? 'rounded-[var(--radius-sm)]' : 'rounded-none'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-bold border',
        shapeClass,
        size === 'sm' ? 'px-2 py-px text-[10px]' : 'px-2.5 py-0.5 text-xs',
        variantClasses[resolvedVariant],
        className,
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[resolvedVariant])} />}
      {resolvedLabel}
    </span>
  )
}

/* ── 편의 컴포넌트 ── */
export function StatusBadge({ status, className }: { status: StatusPreset; className?: string }) {
  return <Badge status={status} dot className={className} />
}

export function CategoryBadge({ category, className }: { category: CategoryPreset; className?: string }) {
  return <Badge category={category} className={className} />
}
