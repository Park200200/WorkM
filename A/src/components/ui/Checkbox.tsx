import { type InputHTMLAttributes, forwardRef, useId } from 'react'
import { cn } from '../../utils/cn'
import { Check } from 'lucide-react'
import { useThemeStore, CHECKBOX_SIZE_VALUES } from '../../stores/themeStore'

/* ═══════════════════════════════════════
   Checkbox & Radio — 토큰 기반
   ═══════════════════════════════════════ */

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  description?: string
  error?: string
  variant?: 'checkbox' | 'radio'
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, variant = 'checkbox', id, ...props }, ref) => {
    const autoId = useId()
    const inputId = id || autoId
    const cbStyle = useThemeStore((s) => s.checkboxStyle) || 'default'
    const cbSize = useThemeStore((s) => s.checkboxSize) || 'default'
    const sizeVal = CHECKBOX_SIZE_VALUES[cbSize]

    // 스타일별 라운딩
    const checkRound = { default: 'rounded-[var(--radius-xs)]', sharp: 'rounded-none', circle: 'rounded-full' }[cbStyle]
    const shapeClass = variant === 'radio' ? 'rounded-full' : checkRound

    return (
      <div className={cn('flex items-start gap-3', className)}>
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            ref={ref}
            type={variant === 'radio' ? 'radio' : 'checkbox'}
            id={inputId}
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              'border-2 transition-all duration-150 cursor-pointer',
              'border-[var(--border-strong)]',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-primary-400/40 peer-focus-visible:ring-offset-2',
              'peer-checked:bg-[var(--btn-save-bg)] peer-checked:border-[var(--btn-save-bg)]',
              'peer-disabled:opacity-50 peer-disabled:cursor-not-allowed',
              shapeClass,
              error && 'border-[var(--color-danger-500)]',
            )}
            style={{ width: sizeVal.box, height: sizeVal.box }}
            onClick={() => {
              const el = document.getElementById(inputId) as HTMLInputElement
              if (el && !el.disabled) el.click()
            }}
          >
            {variant === 'checkbox' && (
              <Check
                size={sizeVal.icon}
                className="text-white opacity-0 peer-checked:opacity-100 transition-opacity absolute inset-0 m-auto pointer-events-none"
                strokeWidth={3}
              />
            )}
            {variant === 'radio' && (
              <div
                className="rounded-full bg-white opacity-0 peer-checked:opacity-100 transition-opacity absolute inset-0 m-auto pointer-events-none"
                style={{ width: sizeVal.dot, height: sizeVal.dot }}
              />
            )}
          </div>
          {/* Overlay for peer-checked icon visibility */}
          <Check
            size={sizeVal.icon}
            className={cn(
              'absolute text-white transition-opacity pointer-events-none',
              variant === 'checkbox' ? 'opacity-0 peer-checked:opacity-100' : 'hidden',
            )}
            strokeWidth={3}
          />
          {variant === 'radio' && (
            <div
              className="absolute rounded-full bg-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
              style={{ width: sizeVal.dot, height: sizeVal.dot }}
            />
          )}
        </div>
        {(label || description) && (
          <label htmlFor={inputId} className="cursor-pointer select-none">
            {label && (
              <span className="text-[length:var(--font-size-body)] font-medium text-[var(--text-primary)]">
                {label}
              </span>
            )}
            {description && (
              <span className="block text-[length:var(--font-size-xs)] text-[var(--text-muted)] mt-0.5">
                {description}
              </span>
            )}
          </label>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'
