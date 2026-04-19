import { cn } from '../../utils/cn'
import { useThemeStore } from '../../stores/themeStore'

/* ═══════════════════════════════════════
   Progress Bar — 토큰 기반
   ═══════════════════════════════════════ */

interface ProgressProps {
  value: number          // 0~100
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  colorMode?: 'auto' | 'primary' | 'success' | 'warning' | 'danger'
  className?: string
  animate?: boolean
}

const sizeH: Record<string, string> = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
}

function getAutoColor(value: number): string {
  if (value >= 70) return 'var(--color-success-500)'
  if (value >= 30) return 'var(--color-warning-500)'
  return 'var(--color-danger-500)'
}

const colorMap: Record<string, string> = {
  primary: 'var(--progress-fill)',
  success: 'var(--color-success-500)',
  warning: 'var(--color-warning-500)',
  danger:  'var(--color-danger-500)',
}

export function Progress({ value, showLabel, size = 'md', colorMode, className, animate = true }: ProgressProps) {
  const globalColor = useThemeStore((s) => s.progressColor) || 'auto'
  const mode = colorMode || globalColor
  const clamped = Math.max(0, Math.min(100, value))
  const fillColor = mode === 'auto' ? getAutoColor(clamped) : colorMap[mode]

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className={cn('flex-1 rounded-full bg-[var(--progress-track)] overflow-hidden', sizeH[size])}>
        <div
          className={cn(
            'h-full rounded-full',
            animate && 'transition-all duration-500 ease-out',
          )}
          style={{ width: `${clamped}%`, backgroundColor: fillColor }}
        />
      </div>
      {showLabel && (
        <span
          className="text-[length:var(--font-size-xs)] font-bold min-w-[36px] text-right"
          style={{ color: fillColor }}
        >
          {clamped}%
        </span>
      )}
    </div>
  )
}
