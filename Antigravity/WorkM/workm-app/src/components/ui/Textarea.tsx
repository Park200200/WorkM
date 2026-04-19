import { type TextareaHTMLAttributes, forwardRef, useEffect, useRef } from 'react'
import { cn } from '../../utils/cn'
import { inputBaseClass, labelClass } from './Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  autoResize?: boolean
  showCount?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, required, autoResize, showCount, maxLength, id, value, ...props }, ref) => {
    const inputId = id || label?.replace(/\s/g, '-').toLowerCase()
    const internalRef = useRef<HTMLTextAreaElement>(null)
    const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef

    /* auto resize */
    useEffect(() => {
      if (autoResize && textareaRef.current) {
        const el = textareaRef.current
        el.style.height = 'auto'
        el.style.height = el.scrollHeight + 'px'
      }
    }, [autoResize, value, textareaRef])

    const charCount = typeof value === 'string' ? value.length : 0

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className={labelClass}>
            {label}
            {required && <span className="text-[var(--color-danger-500)] ml-0.5">*</span>}
          </label>
        )}
        <textarea
          ref={textareaRef}
          id={inputId}
          value={value}
          maxLength={maxLength}
          className={cn(
            inputBaseClass,
            'min-h-[80px] resize-y',
            autoResize && 'resize-none overflow-hidden',
            error && 'border-[var(--color-danger-500)] focus:ring-[var(--color-danger-500)]/30',
            className,
          )}
          {...props}
        />
        <div className="flex items-center justify-between">
          {error && <p className="text-[length:var(--font-size-xs)] text-[var(--color-danger-500)] font-medium">{error}</p>}
          {hint && !error && <p className="text-[length:var(--font-size-xs)] text-[var(--text-muted)]">{hint}</p>}
          {!error && !hint && <span />}
          {showCount && maxLength && (
            <span className="text-[length:var(--font-size-xxs)] text-[var(--text-muted)]">
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
