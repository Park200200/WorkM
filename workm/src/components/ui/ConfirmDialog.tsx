import { type ReactNode, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, Trash2, Info, CheckCircle } from 'lucide-react'
import { cn } from '../../utils/cn'
import { Button } from './Button'

/* ═══════════════════════════════════════
   ConfirmDialog — 확인/삭제 대화상자
   ═══════════════════════════════════════ */

export type ConfirmType = 'danger' | 'warning' | 'info' | 'success'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message: string
  type?: ConfirmType
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
}

const typeConfig: Record<ConfirmType, { icon: typeof AlertTriangle; iconColor: string; iconBg: string }> = {
  danger:  { icon: Trash2,       iconColor: 'text-[var(--color-danger-500)]',  iconBg: 'bg-[var(--color-danger-50)]  dark:bg-[var(--color-danger-500)]/10' },
  warning: { icon: AlertTriangle, iconColor: 'text-[var(--color-warning-500)]', iconBg: 'bg-[var(--color-warning-50)] dark:bg-[var(--color-warning-500)]/10' },
  info:    { icon: Info,          iconColor: 'text-[var(--color-info-500)]',    iconBg: 'bg-[var(--color-info-50)]    dark:bg-[var(--color-info-500)]/10' },
  success: { icon: CheckCircle,   iconColor: 'text-[var(--color-success-500)]', iconBg: 'bg-[var(--color-success-50)] dark:bg-[var(--color-success-500)]/10' },
}

const btnVariant: Record<ConfirmType, 'delete' | 'save' | 'confirm'> = {
  danger: 'delete', warning: 'save', info: 'confirm', success: 'save',
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, message,
  type = 'danger', confirmLabel, cancelLabel = '취소', loading,
}: ConfirmDialogProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }, [onClose])

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, handleKeyDown])

  if (!open) return null

  const cfg = typeConfig[type]
  const Icon = cfg.icon
  const defaultLabel = type === 'danger' ? '삭제' : '확인'

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn" />
      <div className="relative w-full max-w-sm bg-[var(--bg-surface)] rounded-[var(--radius-lg)] shadow-xl border border-[var(--border-default)] animate-scaleIn">
        <div className="p-6 text-center">
          <div className={cn('w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4', cfg.iconBg)}>
            <Icon size={24} className={cfg.iconColor} />
          </div>
          {title && (
            <h3 className="text-[length:var(--font-size-h4)] font-bold text-[var(--text-primary)] mb-2">{title}</h3>
          )}
          <p className="text-[length:var(--font-size-body)] text-[var(--text-secondary)] leading-relaxed">{message}</p>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <Button variant="cancel" size="md" onClick={onClose} className="flex-1">
            {cancelLabel}
          </Button>
          <Button variant={btnVariant[type]} size="md" onClick={onConfirm} loading={loading} className="flex-1">
            {confirmLabel || defaultLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
