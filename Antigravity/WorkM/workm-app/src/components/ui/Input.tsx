import { type InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../utils/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
  required?: boolean
}

/* ── 공통 입력 필드 스타일 (토큰 기반) ── */
export const inputBaseClass = cn(
  'w-full h-[44px] rounded-[var(--radius-sm)] border bg-[var(--bg-surface)]',
  'px-[var(--input-padding-x)]',
  'text-[length:var(--font-size-body)] leading-[44px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
  'border-[var(--border-default)]',
  'transition-all duration-150',
  'focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-[var(--border-focus)]',
  'disabled:opacity-50 disabled:cursor-not-allowed',
)

export const labelClass = cn(
  'text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]',
)

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, id, required, ...props }, ref) => {
    const inputId = id || label?.replace(/\s/g, '-').toLowerCase()

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className={labelClass}>
            {label}
            {required && <span className="text-[var(--color-danger-500)] ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              inputBaseClass,
              icon && 'pl-10',
              error && 'border-[var(--color-danger-500)] focus:ring-[var(--color-danger-500)]/30 focus:border-[var(--color-danger-500)]',
              className,
            )}
            {...props}
          />
        </div>
        {error && <p className="text-[length:var(--font-size-xs)] text-[var(--color-danger-500)] font-medium">{error}</p>}
        {hint && !error && <p className="text-[length:var(--font-size-xs)] text-[var(--text-muted)]">{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
