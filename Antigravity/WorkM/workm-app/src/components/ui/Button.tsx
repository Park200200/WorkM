import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../utils/cn'

/* ═══════════════════════════════════════
   Button — 용도별 의미 기반 Variant
   ═══════════════════════════════════════ */

export type ButtonVariant =
  | 'save'      // 등록 / 저장
  | 'edit'      // 수정
  | 'delete'    // 삭제
  | 'cancel'    // 취소
  | 'search'    // 검색
  | 'confirm'   // 확인 / 닫기
  | 'upload'    // 업로드
  | 'download'  // 다운로드
  | 'add'       // 추가 (+)
  | 'approve'   // 승인
  | 'reject'    // 반려
  | 'ghost'     // 투명 배경
  | 'outline'   // 테두리만
  /* legacy compat */
  | 'primary'
  | 'secondary'
  | 'danger'

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: React.ReactNode
}

/* ── Variant → CSS Token 매핑 ── */
const variantStyles: Record<ButtonVariant, string> = {
  // === 용도별 의미 기반 ===
  save:     'bg-[var(--btn-save-bg)] text-[var(--btn-save-text)] hover:bg-[var(--btn-save-hover)] shadow-sm',
  edit:     'bg-[var(--btn-edit-bg)] text-[var(--btn-edit-text)] hover:bg-[var(--btn-edit-hover)] shadow-sm',
  delete:   'bg-[var(--btn-delete-bg)] text-[var(--btn-delete-text)] hover:bg-[var(--btn-delete-hover)] shadow-sm',
  cancel:   'bg-[var(--btn-cancel-bg)] text-[var(--btn-cancel-text)] hover:bg-[var(--btn-cancel-hover)] border border-[var(--border-default)]',
  search:   'bg-[var(--btn-search-bg)] text-[var(--btn-search-text)] hover:bg-[var(--btn-search-hover)] shadow-sm',
  confirm:  'bg-[var(--btn-confirm-bg)] text-[var(--btn-confirm-text)] hover:bg-[var(--btn-confirm-hover)] shadow-sm',
  upload:   'bg-[var(--btn-upload-bg)] text-[var(--btn-upload-text)] hover:bg-[var(--btn-upload-hover)] shadow-sm',
  download: 'bg-[var(--btn-download-bg)] text-[var(--btn-download-text)] hover:bg-[var(--btn-download-hover)] shadow-sm',
  add:      'bg-[var(--btn-add-bg)] text-[var(--btn-add-text)] hover:bg-[var(--btn-add-hover)] shadow-sm',
  approve:  'bg-[var(--btn-approve-bg)] text-[var(--btn-approve-text)] hover:bg-[var(--btn-approve-hover)] shadow-sm',
  reject:   'bg-[var(--btn-reject-bg)] text-[var(--btn-reject-text)] hover:bg-[var(--btn-reject-hover)] shadow-sm',
  ghost:    'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]',
  outline:  'bg-transparent border-2 border-primary-500 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20',

  // === legacy compat aliases ===
  primary:   'bg-[var(--btn-save-bg)] text-[var(--btn-save-text)] hover:bg-[var(--btn-save-hover)] shadow-sm',
  secondary: 'bg-[var(--btn-cancel-bg)] text-[var(--btn-cancel-text)] hover:bg-[var(--btn-cancel-hover)] border border-[var(--border-default)]',
  danger:    'bg-[var(--btn-delete-bg)] text-[var(--btn-delete-text)] hover:bg-[var(--btn-delete-hover)] shadow-sm',
}

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs gap-1 rounded-[var(--radius-sm)]',
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-[var(--radius-sm)]',
  md: 'h-9 px-4 text-sm gap-2 rounded-[var(--radius-sm)]',
  lg: 'h-11 px-5 text-base gap-2.5 rounded-[var(--radius-md)]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'save', size = 'md', loading, icon, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none',
        'active:scale-[0.97]',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  )
)

Button.displayName = 'Button'
