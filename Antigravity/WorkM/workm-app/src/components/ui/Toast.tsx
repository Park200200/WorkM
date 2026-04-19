import { useToastStore } from '../../stores/toastStore'
import { cn } from '../../utils/cn'
import { X, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react'
import { useThemeStore } from '../../stores/themeStore'

/* ═══════════════════════════════════════
   Toast — 위치/액션 확장
   ═══════════════════════════════════════ */

const icons = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error:   XCircle,
  info:    Info,
}

const styles = {
  success: 'border-[var(--color-success-500)]/30 bg-[var(--color-success-50)] text-[var(--color-success-700)] dark:bg-[var(--color-success-500)]/10 dark:text-[var(--color-success-300)]',
  warning: 'border-[var(--color-warning-500)]/30 bg-[var(--color-warning-50)] text-[var(--color-warning-700)] dark:bg-[var(--color-warning-500)]/10 dark:text-[var(--color-warning-300)]',
  error:   'border-[var(--color-danger-500)]/30 bg-[var(--color-danger-50)] text-[var(--color-danger-700)] dark:bg-[var(--color-danger-500)]/10 dark:text-[var(--color-danger-300)]',
  info:    'border-[var(--color-info-500)]/30 bg-[var(--color-info-50)] text-[var(--color-info-700)] dark:bg-[var(--color-info-500)]/10 dark:text-[var(--color-info-300)]',
}

const iconColors = {
  success: 'text-[var(--color-success-500)]',
  warning: 'text-[var(--color-warning-500)]',
  error:   'text-[var(--color-danger-500)]',
  info:    'text-[var(--color-info-500)]',
}

const positionClasses = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
}

export function ToastContainer() {
  const { toasts, remove } = useToastStore()
  const pos = useThemeStore((s) => s.toastPosition) || 'top-right'

  if (!toasts.length) return null

  return (
    <div className={cn('fixed z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none', positionClasses[pos])}>
      {toasts.map((toast) => {
        const Icon = icons[toast.type]
        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 px-4 py-3',
              'rounded-[var(--radius-md)] border shadow-lg',
              'animate-slideRight',
              styles[toast.type],
            )}
          >
            <Icon size={18} className={cn('shrink-0 mt-0.5', iconColors[toast.type])} />
            <div className="flex-1 min-w-0">
              <p className="text-[length:var(--font-size-body)] font-medium">{toast.message}</p>
            </div>
            <button
              onClick={() => remove(toast.id)}
              className="shrink-0 p-0.5 rounded-[var(--radius-xs)] hover:bg-black/10 transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
