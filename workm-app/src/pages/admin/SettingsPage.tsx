import { useState, useRef } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal, ModalBody, ModalFooter } from '../../components/ui/Modal'
import { useSettingsStore } from '../../stores/settingsStore'
import { useToastStore } from '../../stores/toastStore'
import { useThemeStore, PRESET_ACCENTS, PRESET_KEYS, ACCENT_COLORS, RADIUS_LABELS, DENSITY_LABELS, FONT_SCALE_LABELS, FONT_COLOR_PRESETS, DATEPICKER_LABELS, CHECKBOX_STYLE_LABELS, CHECKBOX_SIZE_LABELS, CHECKBOX_SIZE_VALUES, TAB_STYLE_LABELS, BUTTON_SIZE_LABELS, TOAST_POSITION_LABELS, TABLE_STRIPE_LABELS, TABLE_DENSITY_LABELS, BADGE_SHAPE_LABELS, SIDEBAR_WIDTH_LABELS, PROGRESS_COLOR_LABELS, TYPO_CATEGORY_LABELS, DEFAULT_TYPO, TYPO_SIZE_OPTIONS, TYPO_WEIGHT_OPTIONS, TYPO_COLOR_OPTIONS, type ThemeRadius, type ThemeDensity, type ThemeFontScale, type ThemeDatePicker, type ThemeCheckboxStyle, type ThemeCheckboxSize, type ThemeTabStyle, type ThemeButtonSize, type ThemeToastPosition, type ThemeTableStripe, type ThemeTableDensity, type ThemeBadgeShape, type ThemeSidebarWidth, type ThemeProgressColor, type TypoCategory } from '../../stores/themeStore'
import { cn } from '../../utils/cn'
import { getItem } from '../../utils/storage'
import {
  Building2, Medal, Briefcase, ListChecks, FileText, Layers,
  Plus, Pencil, Trash2, GripVertical, Calculator, Wallet, CreditCard,
  Palette, Sun, Moon, Check, X, RotateCcw, ChevronRight, ContactRound,
} from 'lucide-react'
import { ICON_MAP, renderIcon } from '../../utils/iconMap'
import { Badge } from '../../components/ui/Badge'
import { Progress } from '../../components/ui/Progress'
import { Tabs } from '../../components/ui/Tabs'
import { DatePicker } from '../../components/ui/DatePicker'
import { Checkbox } from '../../components/ui/Checkbox'
import { CustomSelect } from '../../components/ui/CustomSelect'

const ICON_COLORS = [
  '#22c55e','#06b6d4','#9747ff','#ef4444','#f59e0b','#4f6ef7',
  '#8b5cf6','#ec4899','#6b7280','#14b8a6','#3b82f6','#dc2626',
  '#0ea5e9','#f43f5e','#a855f7','#10b981','#6366f1','#0284c7',
  '#ea580c','#16a34a',
]
const ICON_KEYS = Object.keys(ICON_MAP)

/* ── 탭 정의 ── */
interface Tab {
  key: string
  label: string
  icon: React.ElementType
  color: string
}

const tabs: Tab[] = [
  { key: 'dept',       label: '부서',                icon: Building2,  color: '#4f6ef7' },
  { key: 'rank',       label: '직급',                icon: Medal,      color: '#9747ff' },
  { key: 'position',   label: '직함',                icon: Briefcase,  color: '#f59e0b' },
  { key: 'result',     label: '예상결과물', icon: ListChecks, color: '#22c55e' },
  { key: 'reportType', label: '진행절차',        icon: FileText,   color: '#8b5cf6' },
  { key: 'detailTask', label: '상세업무',             icon: Layers,     color: '#4f6ef7' },
  { key: 'importance', label: '중요도',          icon: Building2,  color: '#ef4444' },
  { key: 'taskStatus', label: '진행상태',             icon: Layers,     color: '#06b6d4' },
  { key: 'bizCategory',label: '거래처구분',            icon: ContactRound, color: '#14b8a6' },
]

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('dept')
  const globalTabStyle = useThemeStore((s) => s.tabStyle) || 'underline'
  const tabRef = useRef<HTMLDivElement>(null)
  const dragState = useRef({ isDown: false, startX: 0, scrollLeft: 0 })

  const onPointerDown = (e: React.PointerEvent) => {
    const el = tabRef.current; if (!el) return
    // 버튼 클릭은 드래그로 처리하지 않음
    if ((e.target as HTMLElement).closest('button')) return
    dragState.current = { isDown: true, startX: e.clientX, scrollLeft: el.scrollLeft }
    el.setPointerCapture(e.pointerId)
    el.style.cursor = 'grabbing'
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragState.current.isDown) return
    const el = tabRef.current; if (!el) return
    const dx = e.clientX - dragState.current.startX
    el.scrollLeft = dragState.current.scrollLeft - dx
  }
  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragState.current.isDown) return
    dragState.current.isDown = false
    const el = tabRef.current; if (!el) return
    el.releasePointerCapture(e.pointerId)
    el.style.cursor = 'grab'
  }

  return (
    <div className="animate-fadeIn">
      <PageHeader title="기타설정" subtitle="직급관리 및 기타 관리 항목을 설정합니다" />

      {/* 탭 바 — 모바일: 드래그 스크롤, 데스크탑: 래핑 */}
      <div
        ref={tabRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        className="flex gap-1.5 mb-5 overflow-x-auto pb-2 -mx-1 px-1 md:flex-wrap select-none scrollbar-hide"
        style={{ cursor: 'grab', WebkitOverflowScrolling: 'touch' }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          const ts = globalTabStyle
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 text-xs font-bold whitespace-nowrap',
                'transition-all duration-150 cursor-pointer shrink-0',
                /* underline */
                ts === 'underline' && [
                  'rounded-none border-b-2',
                  isActive
                    ? 'border-[var(--tab-active-color)] text-[var(--tab-active-color)]'
                    : 'border-transparent text-[var(--text-muted)]',
                ],
                /* box */
                ts === 'box' && [
                  'rounded-[var(--radius-md)] border',
                  isActive
                    ? 'bg-[var(--tab-active-bg)] border-[var(--tab-active-color)]/20 text-[var(--tab-active-color)] shadow-sm'
                    : 'border-transparent text-[var(--text-muted)]',
                ],
                /* pill */
                ts === 'pill' && [
                  'rounded-[var(--radius-md)]',
                  isActive
                    ? 'bg-[var(--btn-save-bg)] text-white shadow-sm'
                    : 'text-[var(--text-muted)]',
                ],
              )}
              onMouseEnter={(e) => {
                if (!isActive) {
                  const el = e.currentTarget
                  el.style.color = 'var(--color-primary-500)'
                  if (ts === 'box') el.style.background = 'color-mix(in srgb, var(--color-primary-500) 8%, transparent)'
                  if (ts === 'pill') el.style.background = 'color-mix(in srgb, var(--color-primary-500) 8%, transparent)'
                }
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget
                el.style.color = ''
                el.style.background = ''
              }}
            >
              <Icon size={15} style={isActive ? { color: ts === 'pill' && isActive ? 'white' : tab.color } : undefined} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === 'dept'       && <DeptPanel />}
      {activeTab === 'rank'       && <RankPanel />}
      {activeTab === 'position'   && <PositionPanel />}
      {activeTab === 'result'     && <ResultPanel />}
      {activeTab === 'reportType' && <ReportTypePanel />}
      {activeTab === 'detailTask' && <DetailTaskPanel />}
      {activeTab === 'importance' && <ImportancePanel />}
      {activeTab === 'taskStatus' && <TaskStatusPanel />}
      {activeTab === 'accounts' && <AccountPanel />}
      {activeTab === 'payMethods' && <PaymentMethodPanel />}
      {activeTab === 'bizCategory' && <BizCategoryPanel />}
    </div>
  )
}

/* ══════════════════════════════════════════════
   부서 패널
   ══════════════════════════════════════════════ */
function DeptPanel() {
  const { departments, addDept, updateDept, deleteDept, reorderItems,
    detailTasks, deptDetailTasks, toggleDeptDetailTask } = useSettingsStore()
  const [expandedDeptId, setExpandedDeptId] = useState<number | null>(null)

  return (
    <div className="space-y-4">
      <CrudListPanel
        title="부서"
        items={departments.map(d => ({ id: d.id, name: d.name }))}
        onAdd={(name) => addDept(name)}
        onUpdate={(id, name) => updateDept(id, name)}
        onDelete={deleteDept}
        onReorder={(ids) => reorderItems('departments', ids)}
        placeholder="새 부서명 입력"
        color="#4f6ef7"
      />

      {/* 부서별 상세업무 배정 */}
      {departments.length > 0 && detailTasks.length > 0 && (
        <Card>
          <div className="text-[12px] font-extrabold text-[var(--text-secondary)] mb-1">📋 부서별 상세업무 배정</div>
          <div className="text-[10px] text-[var(--text-muted)] mb-3">부서를 클릭하여 해당 부서에 배정할 상세업무를 선택하세요.</div>

          <div className="space-y-2">
            {departments.map(dept => {
              const isExpanded = expandedDeptId === dept.id
              const assigned = deptDetailTasks[dept.id] || []
              const assignedNames = detailTasks.filter(t => assigned.includes(t.id)).map(t => t.name)

              return (
                <div key={dept.id} className="border border-[var(--border-default)] rounded-xl overflow-hidden">
                  {/* 부서 헤더 */}
                  <button
                    onClick={() => setExpandedDeptId(isExpanded ? null : dept.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center text-white text-[10px] font-extrabold shrink-0">
                      {dept.name.charAt(0)}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-[12px] font-bold text-[var(--text-primary)]">{dept.name}</div>
                      {assigned.length > 0 ? (
                        <div className="text-[10px] text-[var(--text-muted)] truncate max-w-[300px]">
                          {assignedNames.join(', ')}
                        </div>
                      ) : (
                        <div className="text-[10px] text-[var(--text-muted)]">배정된 업무 없음</div>
                      )}
                    </div>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: assigned.length > 0 ? '#4f6ef718' : '#6b728018', color: assigned.length > 0 ? '#4f6ef7' : '#6b7280' }}
                    >
                      {assigned.length}건
                    </span>
                    <ChevronRight
                      size={14}
                      className={cn(
                        'text-[var(--text-muted)] transition-transform duration-200',
                        isExpanded && 'rotate-90'
                      )}
                    />
                  </button>

                  {/* 상세업무 체크리스트 */}
                  {isExpanded && (
                    <div className="border-t border-[var(--border-default)] bg-[var(--bg-muted)]/50">
                      <div className="px-4 py-2 text-[10px] font-bold text-[var(--text-muted)] flex justify-between">
                        <span>상세업무 선택</span>
                        <span className="text-primary-500">{assigned.length}/{detailTasks.length}개 선택</span>
                      </div>
                      <div className="divide-y divide-[var(--border-default)]">
                        {detailTasks.map(task => {
                          const isChecked = assigned.includes(task.id)
                          return (
                            <label
                              key={task.id}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleDeptDetailTask(dept.id, task.id)}
                                className="w-4 h-4 rounded accent-[var(--color-primary-500)] cursor-pointer"
                              />
                              <span className={cn(
                                'text-[12px]',
                                isChecked ? 'text-[var(--text-primary)] font-bold' : 'text-[var(--text-secondary)] font-medium'
                              )}>
                                {task.name}
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}

function RankPanel() {
  const { ranks, addRank, updateRank, deleteRank, reorderItems } = useSettingsStore()
  return (
    <CrudListPanel
      title="직급"
      items={ranks.map(r => ({ id: r.id, name: r.name }))}
      onAdd={(name) => addRank(name)}
      onUpdate={(id, name) => updateRank(id, name)}
      onDelete={deleteRank}
      onReorder={(ids) => reorderItems('ranks', ids)}
      placeholder="새 직급명 입력"
      color="#f59e0b"
    />
  )
}

function PositionPanel() {
  const { positions, addPos, updatePos, deletePos, reorderItems } = useSettingsStore()
  return (
    <CrudListPanel
      title="직함"
      items={positions.map(p => ({ id: p.id, name: p.name }))}
      onAdd={(name) => addPos(name)}
      onUpdate={(id, name) => updatePos(id, name)}
      onDelete={deletePos}
      onReorder={(ids) => reorderItems('positions', ids)}
      placeholder="새 직함명 입력"
      color="#22c55e"
    />
  )
}

/* 예상결과물 전용 아이콘 */
const RESULT_ICON_KEYS = [
  'file-spreadsheet', 'message-square-text', 'users-round',
  'presentation', 'file-type', 'file-image',
  'file-video', 'film', 'file-text',
  'camera', 'file-audio',
  'link-2', 'cog',
]

function ResultPanel() {
  const { taskResults, addResult, updateResult, deleteResult, reorderItems } = useSettingsStore()
  return (
    <CrudListPanel
      title="예상결과물"
      items={taskResults.map(r => ({ id: r.id, name: r.name, icon: r.icon }))}
      onAdd={(name, icon) => addResult(name, icon)}
      onUpdate={(id, name, icon) => updateResult(id, name, icon)}
      onDelete={deleteResult}
      onReorder={(ids) => reorderItems('taskResults', ids)}
      placeholder="새 예상결과물 입력"
      color="#9747ff"
      showIcon
      iconKeys={RESULT_ICON_KEYS}
    />
  )
}

/* 진행절차 전용 아이콘: 시작/조사/작업중/완료/협의/취소/일부완료/보고서/업무지시 */
const REPORT_TYPE_ICON_KEYS = [
  'play-circle', 'search', 'wrench', 'check-circle-2',
  'message-circle', 'x-circle', 'check-check', 'file-text', 'list-checks',
  'send',
]

function ReportTypePanel() {
  const { reportTypes, addReportType, updateReportType, deleteReportType, reorderItems } = useSettingsStore()
  return (
    <CrudListPanel
      title="진행절차"
      items={reportTypes.map(r => ({ id: r.id, name: r.label, icon: r.icon }))}
      onAdd={(name, icon) => addReportType(name, icon || 'circle', '#4f6ef7')}
      onUpdate={(id, name, icon) => updateReportType(id, name, icon || 'circle', '#4f6ef7')}
      onDelete={deleteReportType}
      onReorder={(ids) => reorderItems('reportTypes', ids)}
      placeholder="새 진행절차 입력"
      color="#06b6d4"
      showIcon
      iconKeys={REPORT_TYPE_ICON_KEYS}
    />
  )
}

function DetailTaskPanel() {
  const { detailTasks, addDetailTask, updateDetailTask, deleteDetailTask, reorderItems,
    departments, deptDetailTasks, toggleDeptDetailTask } = useSettingsStore()
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null)

  return (
    <div className="space-y-4">
      {/* 상세업무 CRUD */}
      <CrudListPanel
        title="상세업무"
        items={detailTasks.map(d => ({ id: d.id, name: d.name }))}
        onAdd={(name) => addDetailTask(name)}
        onUpdate={(id, name) => updateDetailTask(id, name)}
        onDelete={deleteDetailTask}
        onReorder={(ids) => reorderItems('detailTasks', ids)}
        placeholder="새 상세업무 입력"
        color="#4f6ef7"
      />

      {/* 부서별 상세업무 배정 */}
      {departments.length > 0 && detailTasks.length > 0 && (
        <Card>
          <div className="text-[12px] font-extrabold text-[var(--text-secondary)] mb-3">📋 부서별 상세업무 배정</div>
          <div className="text-[10px] text-[var(--text-muted)] mb-3">부서를 선택한 후 체크박스로 해당 부서에 배정할 상세업무를 선택하세요.</div>

          {/* 부서 탭 */}
          <div className="flex items-center gap-1.5 flex-wrap mb-4">
            {departments.map(dept => {
              const isActive = selectedDeptId === dept.id
              const assignedCount = (deptDetailTasks[dept.id] || []).length
              return (
                <button
                  key={dept.id}
                  onClick={() => setSelectedDeptId(isActive ? null : dept.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all border',
                    isActive
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'text-[var(--text-secondary)] border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)]'
                  )}
                >
                  {dept.name}
                  {assignedCount > 0 && (
                    <span className={cn(
                      'text-[9px] font-extrabold min-w-[16px] h-[16px] rounded-full flex items-center justify-center',
                      isActive ? 'bg-white/25 text-white' : 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300'
                    )}>
                      {assignedCount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* 상세업무 체크리스트 */}
          {selectedDeptId && (
            <div className="border border-[var(--border-default)] rounded-xl overflow-hidden">
              <div className="bg-[var(--bg-muted)] px-4 py-2 text-[11px] font-bold text-[var(--text-muted)] flex items-center justify-between">
                <span>{departments.find(d => d.id === selectedDeptId)?.name} 상세업무</span>
                <span className="text-primary-500">
                  {(deptDetailTasks[selectedDeptId] || []).length}/{detailTasks.length}개 선택
                </span>
              </div>
              <div className="divide-y divide-[var(--border-default)]">
                {detailTasks.map(task => {
                  const isChecked = (deptDetailTasks[selectedDeptId] || []).includes(task.id)
                  return (
                    <label
                      key={task.id}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleDeptDetailTask(selectedDeptId, task.id)}
                        className="w-4 h-4 rounded accent-[var(--color-primary-500)] cursor-pointer"
                      />
                      <span className={cn(
                        'text-[12px] font-medium',
                        isChecked ? 'text-[var(--text-primary)] font-bold' : 'text-[var(--text-secondary)]'
                      )}>
                        {task.name}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {!selectedDeptId && (
            <div className="py-6 text-center text-[11px] text-[var(--text-muted)] border border-dashed border-[var(--border-default)] rounded-xl">
              위에서 부서를 선택하면 상세업무를 배정할 수 있습니다.
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

/* 중요도 전용 아이콘: 최상/상/중/하/참고 */
const IMPORTANCE_ICON_KEYS = [
  'chevrons-up', 'chevron-up', 'equal', 'chevron-down', 'book-open',
]

function ImportancePanel() {
  const { instrImportances, addImportance, updateImportance, deleteImportance, reorderItems } = useSettingsStore()
  return (
    <CrudListPanel
      title="중요도"
      items={instrImportances.map(i => ({ id: i.id, name: i.name, icon: i.icon }))}
      onAdd={(name, icon) => addImportance(name, icon)}
      onUpdate={(id, name, icon) => updateImportance(id, name, icon)}
      onDelete={deleteImportance}
      onReorder={(ids) => reorderItems('instrImportances', ids)}
      placeholder="새 중요도 입력"
      color="#ef4444"
      showIcon
      iconKeys={IMPORTANCE_ICON_KEYS}
    />
  )
}

/* 진행상태 전용 아이콘: 준비/시작/정상진행/지연진행/대기중/보류/일부완료/포기/완료/검토중 */
const STATUS_ICON_KEYS = [
  'circle-dot', 'play-circle', 'activity', 'alert-triangle', 'pause-circle',
  'ban', 'check-check', 'x-circle', 'check-circle-2', 'eye',
]

function TaskStatusPanel() {
  const { taskStatuses, addTaskStatus, updateTaskStatus, deleteTaskStatus, reorderItems } = useSettingsStore()
  return (
    <CrudListPanel
      title="진행상태"
      items={taskStatuses.map(t => ({ id: t.id, name: t.name, icon: t.icon }))}
      onAdd={(name, icon) => addTaskStatus(name, icon || 'activity', '#06b6d4')}
      onUpdate={(id, name, icon) => updateTaskStatus(id, name, icon || 'activity', '#06b6d4')}
      onDelete={deleteTaskStatus}
      onReorder={(ids) => reorderItems('taskStatuses', ids)}
      placeholder="새 진행상태 입력 (예: 진행중)"
      color="#06b6d4"
      showIcon
      iconKeys={STATUS_ICON_KEYS}
    />
  )
}

/* ══════════════════════════════════════════════
   재사용 가능한 CRUD 리스트
   ══════════════════════════════════════════════ */
interface CrudItem { id: number; name: string; icon?: string; color?: string }

interface CrudListPanelProps {
  title: string
  items: CrudItem[]
  onAdd: (name: string, icon?: string) => void
  onUpdate: (id: number, name: string, icon?: string) => void
  onDelete: (id: number) => void
  onReorder?: (ids: number[]) => void
  placeholder: string
  color: string
  showIcon?: boolean
  iconKeys?: string[]
}

function CrudListPanel({ title, items, onAdd, onUpdate, onDelete, onReorder, placeholder, color, showIcon, iconKeys }: CrudListPanelProps) {
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editIcon, setEditIcon] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<CrudItem | null>(null)
  const addToast = useToastStore((s) => s.add)
  const inputRef = useRef<HTMLInputElement>(null)

  // 드래그 상태
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)

  const handleAdd = () => {
    if (!newName.trim()) return
    onAdd(newName.trim(), showIcon ? newIcon || undefined : undefined)
    setNewName('')
    setNewIcon('')
    addToast('success', `"${newName.trim()}" 추가 완료`)
    inputRef.current?.focus()
  }

  const handleUpdate = () => {
    if (editId === null || !editName.trim()) return
    onUpdate(editId, editName.trim(), showIcon ? editIcon || undefined : undefined)
    setEditId(null)
    setEditName('')
    setEditIcon('')
    addToast('info', '항목이 수정되었습니다')
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    onDelete(deleteTarget.id)
    setDeleteTarget(null)
    addToast('warning', `"${deleteTarget.name}" 삭제 완료`)
  }

  const handleDragStart = (idx: number) => {
    setDragIdx(idx)
  }
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    setOverIdx(idx)
  }
  const handleDrop = (idx: number) => {
    if (dragIdx === null || dragIdx === idx || !onReorder) return
    const reordered = [...items]
    const [moved] = reordered.splice(dragIdx, 1)
    reordered.splice(idx, 0, moved)
    onReorder(reordered.map(i => i.id))
    setDragIdx(null)
    setOverIdx(null)
  }
  const handleDragEnd = () => {
    setDragIdx(null)
    setOverIdx(null)
  }

  return (
    <>
      <Card>
        {/* 추가 폼 */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 border border-[var(--border-default)] rounded-xl p-1.5 bg-[var(--bg-surface)]">
            {showIcon && (
              <div
                className="w-[36px] h-[36px] shrink-0 rounded-lg border border-[var(--border-default)] flex items-center justify-center cursor-default"
                style={{ background: newIcon ? `${ICON_COLORS[ICON_KEYS.indexOf(newIcon) % ICON_COLORS.length]}20` : 'var(--bg-muted)', color: newIcon ? ICON_COLORS[ICON_KEYS.indexOf(newIcon) % ICON_COLORS.length] : 'var(--text-muted)' }}
                title="아래에서 아이콘을 선택하세요"
              >
                {renderIcon(newIcon, 18)}
              </div>
            )}
            <div className="flex-1">
              <input
                ref={inputRef}
                placeholder={placeholder}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="w-full bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
              />
            </div>
            <Button onClick={handleAdd} icon={<Plus size={15} />} size="md" className="shrink-0">
              <span className="hidden sm:inline">추가</span>
            </Button>
          </div>

          {/* 아이콘 빠른 선택 */}
          {showIcon && (
            <div>
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">빠른 아이콘 선택</span>
              <div className="flex flex-wrap gap-1.5">
                {(iconKeys || ICON_KEYS).map((key, i) => {
                  const c = ICON_COLORS[i % ICON_COLORS.length]
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setNewIcon(key)}
                      className={cn(
                        'w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all',
                        newIcon === key
                          ? 'ring-2 ring-primary-500 ring-offset-1 shadow-md scale-110'
                          : 'hover:scale-105 hover:shadow-sm',
                      )}
                      style={{ background: `${c}20`, color: c }}
                      title={key}
                    >
                      {renderIcon(key, 16)}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border-default)]">
          <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
            {title} 목록
          </span>
          <span className="text-[11px] font-bold" style={{ color }}>
            {items.length}건
          </span>
        </div>

        {/* 리스트 */}
        {items.length === 0 ? (
          <div className="py-10 text-center text-sm text-[var(--text-muted)]">
            등록된 {title}이 없습니다
          </div>
        ) : (
          <div className="space-y-0.5">
            {items.map((item, idx) => (
              <div
                key={item.id}
                draggable={!!onReorder}
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={() => handleDrop(idx)}
                onDragEnd={handleDragEnd}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-[var(--bg-muted)] transition-all group',
                  dragIdx === idx && 'opacity-40 scale-95',
                  overIdx === idx && dragIdx !== idx && 'ring-2 ring-primary-300 bg-primary-50/50 dark:bg-primary-900/10',
                )}
              >
                {/* 드래그 핸들 */}
                {onReorder && (
                  <span className="cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors shrink-0">
                    <GripVertical size={14} />
                  </span>
                )}

                {/* 순서 번호 */}
                <span className="text-[11px] font-bold text-[var(--text-muted)] w-5 text-center shrink-0">
                  {idx + 1}
                </span>

                {/* 아이콘 */}
                {showIcon && (
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${ICON_COLORS[ICON_KEYS.indexOf(item.icon || '') % ICON_COLORS.length] || '#6b7280'}20`, color: ICON_COLORS[ICON_KEYS.indexOf(item.icon || '') % ICON_COLORS.length] || '#6b7280' }}
                  >
                    {renderIcon(item.icon, 14)}
                  </span>
                )}

                {/* 이름 */}
                <span className="text-sm font-semibold text-[var(--text-primary)] flex-1 truncate">
                  {item.name}
                </span>

                {/* 액션 (데스크탑: hover) */}
                <div className="hidden md:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setEditId(item.id); setEditName(item.name); setEditIcon(item.icon || '') }}
                    className="p-1.5 rounded-md hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-500 cursor-pointer transition-colors"
                    title="수정"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(item)}
                    className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-danger cursor-pointer transition-colors"
                    title="삭제"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* 모바일: 항상 보이는 액션 */}
                <div className="flex items-center gap-1 md:hidden">
                  <button
                    onClick={() => { setEditId(item.id); setEditName(item.name); setEditIcon(item.icon || '') }}
                    className="p-1.5 rounded-md text-[var(--text-muted)] cursor-pointer"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(item)}
                    className="p-1.5 rounded-md text-danger/60 cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 수정 모달 */}
      <Modal
        open={editId !== null}
        onClose={() => setEditId(null)}
        title={`${title} 수정`}
      >
        <ModalBody className="space-y-3">
          <Input
            label={`${title}명`}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
            autoFocus
          />
          {showIcon && (
            <div>
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">아이콘 선택</span>
              <div className="flex flex-wrap gap-1.5">
                {(iconKeys || ICON_KEYS).map((key, i) => {
                  const c = ICON_COLORS[i % ICON_COLORS.length]
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setEditIcon(key)}
                      className={cn(
                        'w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all',
                        editIcon === key
                          ? 'ring-2 ring-primary-500 ring-offset-1 shadow-md scale-110'
                          : 'hover:scale-105 hover:shadow-sm',
                      )}
                      style={{ background: `${c}20`, color: c }}
                      title={key}
                    >
                      {renderIcon(key, 16)}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setEditId(null)}>취소</Button>
          <Button onClick={handleUpdate}>저장</Button>
        </ModalFooter>
      </Modal>

      {/* 삭제 확인 모달 */}
      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="삭제 확인"
      >
        <ModalBody>
          <p className="text-sm text-[var(--text-secondary)]">
            <strong>"{deleteTarget?.name}"</strong>을(를) 삭제하시겠습니까?
          </p>
          <p className="text-xs text-danger mt-2">이 작업은 되돌릴 수 없습니다.</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>취소</Button>
          <Button variant="danger" onClick={handleDelete}>삭제</Button>
        </ModalFooter>
      </Modal>
    </>
  )
}

/* ══════════════════════════════════════════════
   계정과목 관리 패널
   ══════════════════════════════════════════════ */
interface AcctAccount { code: string; name: string; type: string; group: string }

const DEFAULT_ACCOUNTS: AcctAccount[] = [
  // ── 1. 자산 (37개) ──
  // 유동자산 1-01 (19개)
  { code: '1-01-01', name: '현금', type: 'asset', group: '유동자산' },
  { code: '1-01-02', name: '당좌예금', type: 'asset', group: '유동자산' },
  { code: '1-01-03', name: '보통예금', type: 'asset', group: '유동자산' },
  { code: '1-01-04', name: '정기예금', type: 'asset', group: '유동자산' },
  { code: '1-01-05', name: '외화예금', type: 'asset', group: '유동자산' },
  { code: '1-01-06', name: '받을어음', type: 'asset', group: '유동자산' },
  { code: '1-01-07', name: '외상매출금', type: 'asset', group: '유동자산' },
  { code: '1-01-08', name: '대손충당금', type: 'asset', group: '유동자산' },
  { code: '1-01-09', name: '단기대여금', type: 'asset', group: '유동자산' },
  { code: '1-01-10', name: '미수금', type: 'asset', group: '유동자산' },
  { code: '1-01-11', name: '미수수익', type: 'asset', group: '유동자산' },
  { code: '1-01-12', name: '선급금', type: 'asset', group: '유동자산' },
  { code: '1-01-13', name: '선급비용', type: 'asset', group: '유동자산' },
  { code: '1-01-14', name: '부가세대급금', type: 'asset', group: '유동자산' },
  { code: '1-01-15', name: '재고자산(상품)', type: 'asset', group: '유동자산' },
  { code: '1-01-16', name: '재고자산(제품)', type: 'asset', group: '유동자산' },
  { code: '1-01-17', name: '재고자산(원재료)', type: 'asset', group: '유동자산' },
  { code: '1-01-18', name: '재고자산(재공품)', type: 'asset', group: '유동자산' },
  { code: '1-01-19', name: '단기금융상품', type: 'asset', group: '유동자산' },
  // 비유동자산 1-02 (18개)
  { code: '1-02-01', name: '토지', type: 'asset', group: '비유동자산' },
  { code: '1-02-02', name: '건물', type: 'asset', group: '비유동자산' },
  { code: '1-02-03', name: '건물감가상각누계액', type: 'asset', group: '비유동자산' },
  { code: '1-02-04', name: '구축물', type: 'asset', group: '비유동자산' },
  { code: '1-02-05', name: '구축물감가상각누계액', type: 'asset', group: '비유동자산' },
  { code: '1-02-06', name: '기계장치', type: 'asset', group: '비유동자산' },
  { code: '1-02-07', name: '기계장치감가상각누계액', type: 'asset', group: '비유동자산' },
  { code: '1-02-08', name: '차량운반구', type: 'asset', group: '비유동자산' },
  { code: '1-02-09', name: '차량운반구감가상각누계액', type: 'asset', group: '비유동자산' },
  { code: '1-02-10', name: '비품', type: 'asset', group: '비유동자산' },
  { code: '1-02-11', name: '비품감가상각누계액', type: 'asset', group: '비유동자산' },
  { code: '1-02-12', name: '소프트웨어', type: 'asset', group: '비유동자산' },
  { code: '1-02-13', name: '소프트웨어상각누계액', type: 'asset', group: '비유동자산' },
  { code: '1-02-14', name: '영업권', type: 'asset', group: '비유동자산' },
  { code: '1-02-15', name: '장기대여금', type: 'asset', group: '비유동자산' },
  { code: '1-02-16', name: '보증금', type: 'asset', group: '비유동자산' },
  { code: '1-02-17', name: '장기금융상품', type: 'asset', group: '비유동자산' },
  { code: '1-02-18', name: '지분법적용투자주식', type: 'asset', group: '비유동자산' },
  // ── 2. 부채 (16개) ──
  // 유동부채 2-01 (12개)
  { code: '2-01-01', name: '외상매입금', type: 'liability', group: '유동부채' },
  { code: '2-01-02', name: '지급어음', type: 'liability', group: '유동부채' },
  { code: '2-01-03', name: '단기차입금', type: 'liability', group: '유동부채' },
  { code: '2-01-04', name: '미지급금', type: 'liability', group: '유동부채' },
  { code: '2-01-05', name: '미지급비용', type: 'liability', group: '유동부채' },
  { code: '2-01-06', name: '선수금', type: 'liability', group: '유동부채' },
  { code: '2-01-07', name: '선수수익', type: 'liability', group: '유동부채' },
  { code: '2-01-08', name: '예수금', type: 'liability', group: '유동부채' },
  { code: '2-01-09', name: '부가세예수금', type: 'liability', group: '유동부채' },
  { code: '2-01-10', name: '소득세예수금', type: 'liability', group: '유동부채' },
  { code: '2-01-11', name: '4대보험예수금', type: 'liability', group: '유동부채' },
  { code: '2-01-12', name: '유동성장기부채', type: 'liability', group: '유동부채' },
  // 비유동부채 2-02 (4개)
  { code: '2-02-01', name: '장기차입금', type: 'liability', group: '비유동부채' },
  { code: '2-02-02', name: '퇴직급여충당부채', type: 'liability', group: '비유동부채' },
  { code: '2-02-03', name: '임대보증금', type: 'liability', group: '비유동부채' },
  { code: '2-02-04', name: '사채', type: 'liability', group: '비유동부채' },
  // ── 3. 자본 (8개) ──
  // 자본금 3-01 (2개)
  { code: '3-01-01', name: '보통주자본금', type: 'equity', group: '자본금' },
  { code: '3-01-02', name: '우선주자본금', type: 'equity', group: '자본금' },
  // 자본잉여금 3-02 (2개)
  { code: '3-02-01', name: '주식발행초과금', type: 'equity', group: '자본잉여금' },
  { code: '3-02-02', name: '감자차익', type: 'equity', group: '자본잉여금' },
  // 이익잉여금 3-03 (4개)
  { code: '3-03-01', name: '법정적립금', type: 'equity', group: '이익잉여금' },
  { code: '3-03-02', name: '임의적립금', type: 'equity', group: '이익잉여금' },
  { code: '3-03-03', name: '미처분이익잉여금', type: 'equity', group: '이익잉여금' },
  { code: '3-03-04', name: '당기순이익', type: 'equity', group: '이익잉여금' },
  // ── 4. 수익 (11개) ──
  // 매출액 4-01 (4개)
  { code: '4-01-01', name: '상품매출', type: 'revenue', group: '매출액' },
  { code: '4-01-02', name: '제품매출', type: 'revenue', group: '매출액' },
  { code: '4-01-03', name: '용역매출', type: 'revenue', group: '매출액' },
  { code: '4-01-04', name: '매출에누리및환입', type: 'revenue', group: '매출액' },
  // 영업외수익 4-02 (7개)
  { code: '4-02-01', name: '이자수익', type: 'revenue', group: '영업외수익' },
  { code: '4-02-02', name: '배당금수익', type: 'revenue', group: '영업외수익' },
  { code: '4-02-03', name: '임대료수익', type: 'revenue', group: '영업외수익' },
  { code: '4-02-04', name: '외환차익', type: 'revenue', group: '영업외수익' },
  { code: '4-02-05', name: '외화환산이익', type: 'revenue', group: '영업외수익' },
  { code: '4-02-06', name: '유형자산처분이익', type: 'revenue', group: '영업외수익' },
  { code: '4-02-07', name: '잡이익', type: 'revenue', group: '영업외수익' },
  // ── 5. 비용 (37개) ──
  // 매출원가 5-01 (5개)
  { code: '5-01-01', name: '상품매출원가', type: 'expense', group: '매출원가' },
  { code: '5-01-02', name: '제품매출원가', type: 'expense', group: '매출원가' },
  { code: '5-01-03', name: '원재료비', type: 'expense', group: '매출원가' },
  { code: '5-01-04', name: '노무비', type: 'expense', group: '매출원가' },
  { code: '5-01-05', name: '제조경비', type: 'expense', group: '매출원가' },
  // 판매비및관리비 5-02 (25개)
  { code: '5-02-01', name: '급여', type: 'expense', group: '판매비및관리비' },
  { code: '5-02-02', name: '상여금', type: 'expense', group: '판매비및관리비' },
  { code: '5-02-03', name: '퇴직급여', type: 'expense', group: '판매비및관리비' },
  { code: '5-02-04', name: '복리후생비', type: 'expense', group: '판매비및관리비' },
  { code: '5-02-05', name: '여비교통비', type: 'expense', group: '판매비및관리비' },
  { code: '5-02-06', name: '접대비', type: 'expense', group: '판매비및관리비' },
  { code: '5-02-07', name: '통신비', type: 'expense', group: '판매비및관리비' },
  { code: '5-02-08', name: '수도광열비', type: 'expense', group: '판매비및관리비' },
  { code: '5-02-09', name: '전력비', type: 'expense', group: '판매비및관리비' },
  { code: '5-02-10', name: '세금과공과', type: 'expense', group: '판매비및관리비' },
  { code: '5-02-11', name: '감가상각비', type: 'expense', group: '판매비및관리비' },
  { code: '5-02-12', name: '지급임차료', type: 'expense', group: '판매비및관리비' },
  { code: '5-02-13', name: '수선비', type: 'expense', group: '판매비및관리비' },
  { code: '5-02-14', name: '보험료', type: 'expense', group: '판매비및관리비' },
  { code: '5-02-15', name: '차량유지비', type: 'expense', group: '판매비및관리비' },
  { code: '5-02-16', name: '경상개발비', type: 'expense', group: '판매비및관리비' },
  { code: '5-02-17', name: '교육훈련비', type: 'expense', group: '판매비및관리비' },
  { code: '5-02-18', name: '도서인쇄비', type: 'expense', group: '판매비및관리비' },
  { code: '5-02-19', name: '사무용품비', type: 'expense', group: '판매비및관리비' },
  { code: '5-02-20', name: '소모품비', type: 'expense', group: '판매비및관리비' },
  { code: '5-02-21', name: '지급수수료', type: 'expense', group: '판매비및관리비' },
  { code: '5-02-22', name: '광고선전비', type: 'expense', group: '판매비및관리비' },
  { code: '5-02-23', name: '대손상각비', type: 'expense', group: '판매비및관리비' },
  { code: '5-02-24', name: '운반비', type: 'expense', group: '판매비및관리비' },
  { code: '5-02-25', name: '잡비', type: 'expense', group: '판매비및관리비' },
  // 영업외비용 5-03 (6개)
  { code: '5-03-01', name: '이자비용', type: 'expense', group: '영업외비용' },
  { code: '5-03-02', name: '외환차손', type: 'expense', group: '영업외비용' },
  { code: '5-03-03', name: '외화환산손실', type: 'expense', group: '영업외비용' },
  { code: '5-03-04', name: '기부금', type: 'expense', group: '영업외비용' },
  { code: '5-03-05', name: '유형자산처분손실', type: 'expense', group: '영업외비용' },
  { code: '5-03-06', name: '잡손실', type: 'expense', group: '영업외비용' },
  // 법인세비용 5-04 (1개)
  { code: '5-04-01', name: '법인세등', type: 'expense', group: '법인세비용' },
]
function initAcctAccounts() {
  localStorage.setItem('acct_accounts', JSON.stringify(DEFAULT_ACCOUNTS))
}

const ACCT_TYPES = [
  { value: 'asset', label: '자산', color: '#4f6ef7' },
  { value: 'liability', label: '부채', color: '#ef4444' },
  { value: 'equity', label: '자본', color: '#8b5cf6' },
  { value: 'revenue', label: '수익', color: '#22c55e' },
  { value: 'expense', label: '비용', color: '#f59e0b' },
]

function AccountPanel() {
  const [refresh, setRefresh] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editCode, setEditCode] = useState<string | null>(null)
  const [form, setForm] = useState({ code: '', name: '', type: 'expense', group: '' })
  const addToast = useToastStore((s) => s.add)

  // 초기화 (기본 계정과목 시딩)
  initAcctAccounts()

  const accounts: AcctAccount[] = getItem('acct_accounts', [])
  void refresh // trigger re-read

  const grouped = ACCT_TYPES.map(t => ({
    ...t,
    items: accounts.filter(a => a.type === t.value),
  }))

  const openModal = (code?: string) => {
    if (code) {
      const a = accounts.find(x => x.code === code)
      if (a) {
        setEditCode(code)
        setForm({ code: a.code, name: a.name, type: a.type, group: a.group })
      }
    } else {
      setEditCode(null)
      setForm({ code: '', name: '', type: 'expense', group: '' })
    }
    setModalOpen(true)
  }

  const save = () => {
    if (!form.code.trim() || !form.name.trim()) {
      addToast('error', '코드와 이름을 모두 입력하세요')
      return
    }
    let all: AcctAccount[] = getItem('acct_accounts', [])
    if (editCode) {
      all = all.map(a => a.code === editCode ? { ...a, ...form } : a)
      addToast('info', '계정과목이 수정되었습니다')
    } else {
      if (all.some(a => a.code === form.code.trim())) {
        addToast('error', '이미 존재하는 코드입니다')
        return
      }
      all.push({ code: form.code.trim(), name: form.name.trim(), type: form.type, group: form.group.trim() })
      addToast('success', `계정과목 "${form.name}" 추가 완료`)
    }
    localStorage.setItem('acct_accounts', JSON.stringify(all))
    setModalOpen(false)
    setRefresh(r => r + 1)
  }

  const deleteAcct = (code: string) => {
    if (!confirm('이 계정과목을 삭제하시겠습니까?')) return
    const all: AcctAccount[] = getItem('acct_accounts', [])
    localStorage.setItem('acct_accounts', JSON.stringify(all.filter(a => a.code !== code)))
    addToast('warning', '계정과목이 삭제되었습니다')
    setRefresh(r => r + 1)
  }

  return (
    <>
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-extrabold text-[var(--text-primary)]">계정과목 관리</div>
            <div className="text-[11px] text-[var(--text-muted)]">자산/부채/자본/수익/비용 계정과목을 관리합니다</div>
          </div>
          <Button onClick={() => openModal()} icon={<Plus size={15} />} size="md">
            <span className="hidden sm:inline">추가</span>
          </Button>
        </div>

        {grouped.map(g => (
          <div key={g.value} className="mb-4 last:mb-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: g.color }}>{g.label}</span>
              <span className="text-[10px] text-[var(--text-muted)]">{g.items.length}건</span>
            </div>
            {g.items.length === 0 ? (
              <div className="py-3 text-center text-[11px] text-[var(--text-muted)]">등록된 {g.label} 계정이 없습니다</div>
            ) : (
              <div className="space-y-0.5">
                {g.items.map(a => (
                  <div key={a.code} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-muted)] transition-all group">
                    <span className="text-xs font-mono font-bold w-12 shrink-0" style={{ color: g.color }}>{a.code}</span>
                    <span className="text-sm font-semibold text-[var(--text-primary)] flex-1 truncate">{a.name}</span>
                    <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-muted)] px-2 py-0.5 rounded-full">{a.group}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal(a.code)} className="p-1.5 rounded-md hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-500 cursor-pointer"><Pencil size={13} /></button>
                      <button onClick={() => deleteAcct(a.code)} className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-danger cursor-pointer"><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </Card>

      {/* 추가/수정 모달 */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editCode ? '계정과목 수정' : '계정과목 추가'}>
        <ModalBody className="space-y-3">
          <Input label="계정코드 *" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="예) 5200" disabled={!!editCode} autoFocus />
          <Input label="계정명 *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="예) 퇴직급여" />
          <div>
            <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">유형 *</label>
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] outline-none"
            >
              {ACCT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <Input label="그룹" value={form.group} onChange={e => setForm(f => ({ ...f, group: e.target.value }))} placeholder="예) 인건비, 경비" />
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setModalOpen(false)}>취소</Button>
          <Button onClick={save}>저장</Button>
        </ModalFooter>
      </Modal>
    </>
  )
}

/* ══════════════════════════════════════════════
   예산목·세목 통합 트리 패널
   ══════════════════════════════════════════════ */
interface AccountPoolEntry {
  accountCode: string
  contraAccountCode?: string
}
interface BudgetDetailDef {
  id: number
  name: string
  parentId: number
  aliases: string[]
  accountCode?: string
  sortOrder: number
}
interface BudgetSubDef {
  id: number
  name: string
  parentId: number
  aliases: string[]
  accountCode?: string
  detailItems?: BudgetDetailDef[]
  sortOrder: number
}
interface BudgetItemDef {
  id: number
  name: string
  aliases: string[]
  accountPool: AccountPoolEntry[]
  defaultAccountCode?: string
  subItems: BudgetSubDef[]
  sortOrder: number
}

export function BudgetTreePanel() {
  const [refresh, setRefresh] = useState(0)
  const addToast = useToastStore((s) => s.add)
  void refresh

  // ── 데이터 로드 (비어있으면 기본 시드 자동 생성) ──
  let items: BudgetItemDef[] = getItem('acct_budget_item_defs', [])
  const accounts: AcctAccount[] = getItem('acct_accounts', [])

  // 시드가 아직 로드되지 않은 경우 기본 데이터 생성
  if (items.length === 0 && refresh === 0) {
    const defaultDefs: BudgetItemDef[] = [{"id":1,"name":"인건비","aliases":["전문인력인건비","인건비(보조)"],"sortOrder":1,"accountPool":[{"accountCode":"5-02-01","contraAccountCode":"1-01-03"},{"accountCode":"5-02-02","contraAccountCode":"1-01-03"},{"accountCode":"5-02-03","contraAccountCode":"2-02-02"},{"accountCode":"5-02-04","contraAccountCode":"1-01-03"},{"accountCode":"5-01-04","contraAccountCode":"1-01-03"}],"defaultAccountCode":"5-02-01","subItems":[{"id":101,"name":"기본급","parentId":1,"aliases":["기본급여","본봉","고정임금"],"accountCode":"5-02-01","sortOrder":1},{"id":102,"name":"제수당","parentId":1,"aliases":["각종수당","수당"],"accountCode":"5-02-01","sortOrder":2},{"id":103,"name":"상여금","parentId":1,"aliases":["특별상여","성과급"],"accountCode":"5-02-02","sortOrder":3},{"id":104,"name":"퇴직급여","parentId":1,"aliases":["퇴직금"],"accountCode":"5-02-03","sortOrder":4},{"id":105,"name":"복리후생","parentId":1,"aliases":["4대보험"],"accountCode":"5-02-04","sortOrder":5},{"id":1303,"name":"일용임금","parentId":1,"aliases":["외주가공비","강사초빙"],"sortOrder":5,"accountCode":"5-01-04"}]},{"id":2,"name":"문화재보수비","aliases":["문화재보수정비사업비","보수비","보수공사비"],"sortOrder":2,"accountPool":[{"accountCode":"5-02-13","contraAccountCode":"1-01-03"},{"accountCode":"5-01-06","contraAccountCode":"2-01-04"},{"accountCode":"5-02-26","contraAccountCode":"1-01-03"}],"defaultAccountCode":"5-02-13","subItems":[{"id":201,"name":"석조보수","parentId":2,"aliases":["석조문화재보수"],"accountCode":"5-02-13","sortOrder":1},{"id":202,"name":"목조보수","parentId":2,"aliases":["목조문화재보수"],"accountCode":"5-02-13","sortOrder":2},{"id":203,"name":"단청보수","parentId":2,"aliases":["단청보수정비"],"accountCode":"5-01-06","sortOrder":3},{"id":204,"name":"현장인부","parentId":2,"aliases":["현장인력","시공인력"],"accountCode":"5-02-26","sortOrder":4}]},{"id":3,"name":"발굴조사비","aliases":["발굴비","조사비"],"sortOrder":3,"accountPool":[{"accountCode":"5-01-06","contraAccountCode":"2-01-04"},{"accountCode":"5-02-26","contraAccountCode":"1-01-03"},{"accountCode":"5-02-13","contraAccountCode":"1-01-03"}],"defaultAccountCode":"5-01-06","subItems":[{"id":301,"name":"발굴장비임대","parentId":3,"aliases":["장비임대"],"accountCode":"5-01-06","sortOrder":1},{"id":302,"name":"시굴조사","parentId":3,"aliases":["시굴"],"accountCode":"5-01-06","sortOrder":2},{"id":303,"name":"조사인력","parentId":3,"aliases":["조사원인건비"],"accountCode":"5-02-26","sortOrder":3}]},{"id":4,"name":"장비구입비","aliases":["장비·기자재구입비","시설장비비","장비비"],"sortOrder":4,"accountPool":[{"accountCode":"1-02-10","contraAccountCode":"2-01-04"},{"accountCode":"1-02-06","contraAccountCode":"2-01-04"},{"accountCode":"5-02-20","contraAccountCode":"1-01-03"}],"defaultAccountCode":"1-02-10","subItems":[{"id":401,"name":"측량장비","parentId":4,"aliases":["측량기기"],"accountCode":"1-02-06","sortOrder":1},{"id":402,"name":"촬영장비","parentId":4,"aliases":["카메라","드론"],"accountCode":"1-02-10","sortOrder":2},{"id":403,"name":"안전장비","parentId":4,"aliases":["안전용품"],"accountCode":"5-02-20","sortOrder":3},{"id":404,"name":"사무기기","parentId":4,"aliases":["PC","프린터"],"accountCode":"1-02-10","sortOrder":4}]},{"id":5,"name":"안전관리비","aliases":["현장안전관리비","안전비"],"sortOrder":5,"accountPool":[{"accountCode":"5-02-20","contraAccountCode":"1-01-03"},{"accountCode":"5-02-14","contraAccountCode":"1-01-03"},{"accountCode":"5-02-04","contraAccountCode":"1-01-03"}],"defaultAccountCode":"5-02-20","subItems":[{"id":501,"name":"안전장비","parentId":5,"aliases":["안전용품구입"],"accountCode":"5-02-20","sortOrder":1},{"id":502,"name":"안전보험","parentId":5,"aliases":["산재보험"],"accountCode":"5-02-14","sortOrder":2},{"id":503,"name":"안전교육","parentId":5,"aliases":["안전교육훈련"],"accountCode":"5-02-04","sortOrder":3}]},{"id":6,"name":"사무용품비","aliases":["사무비","소모품"],"sortOrder":6,"accountPool":[{"accountCode":"5-02-19","contraAccountCode":"1-01-03"},{"accountCode":"5-02-18","contraAccountCode":"1-01-03"},{"accountCode":"5-02-20","contraAccountCode":"1-01-03"}],"defaultAccountCode":"5-02-19","subItems":[{"id":601,"name":"사무용품","parentId":6,"aliases":["문구류"],"accountCode":"5-02-19","sortOrder":1},{"id":602,"name":"인쇄비","parentId":6,"aliases":["보고서인쇄","명함인쇄"],"accountCode":"5-02-18","sortOrder":2},{"id":603,"name":"소모품","parentId":6,"aliases":["일반소모품"],"accountCode":"5-02-20","sortOrder":3}]},{"id":7,"name":"통신비","aliases":["통신요금"],"sortOrder":7,"accountPool":[{"accountCode":"5-02-07","contraAccountCode":"1-01-03"}],"defaultAccountCode":"5-02-07","subItems":[{"id":701,"name":"전화요금","parentId":7,"aliases":["유선전화"],"accountCode":"5-02-07","sortOrder":1},{"id":702,"name":"인터넷","parentId":7,"aliases":["인터넷요금"],"accountCode":"5-02-07","sortOrder":2},{"id":703,"name":"우편비","parentId":7,"aliases":["우편요금","택배비"],"accountCode":"5-02-07","sortOrder":3}]},{"id":8,"name":"차량유지비","aliases":["차량비","운행비"],"sortOrder":8,"accountPool":[{"accountCode":"5-02-15","contraAccountCode":"1-01-03"}],"defaultAccountCode":"5-02-15","subItems":[{"id":801,"name":"유류비","parentId":8,"aliases":["주유비"],"accountCode":"5-02-15","sortOrder":1},{"id":802,"name":"정비비","parentId":8,"aliases":["수리비","차량수리"],"accountCode":"5-02-15","sortOrder":2},{"id":803,"name":"주차비","parentId":8,"aliases":["주차요금"],"accountCode":"5-02-15","sortOrder":3}]},{"id":9,"name":"복리후생비","aliases":["후생비","직원복지"],"sortOrder":9,"accountPool":[{"accountCode":"5-02-04","contraAccountCode":"1-01-03"},{"accountCode":"5-02-17","contraAccountCode":"1-01-03"}],"defaultAccountCode":"5-02-04","subItems":[{"id":901,"name":"식대","parentId":9,"aliases":["중식대","식비"],"accountCode":"5-02-04","sortOrder":1},{"id":902,"name":"건강검진","parentId":9,"aliases":["건강검진비"],"accountCode":"5-02-04","sortOrder":2},{"id":903,"name":"경조사비","parentId":9,"aliases":["경조금"],"accountCode":"5-02-04","sortOrder":3},{"id":904,"name":"행사비","parentId":9,"aliases":["행사운영비","체육행사"],"accountCode":"5-02-04","sortOrder":4},{"id":905,"name":"교육비","parentId":9,"aliases":["교육훈련비","연수비"],"accountCode":"5-02-17","sortOrder":5}]},{"id":10,"name":"여비교통비","aliases":["출장비","교통비"],"sortOrder":10,"accountPool":[{"accountCode":"5-02-05","contraAccountCode":"1-01-03"}],"defaultAccountCode":"5-02-05","subItems":[{"id":1001,"name":"국내출장비","parentId":10,"aliases":["국내출장"],"accountCode":"5-02-05","sortOrder":1},{"id":1002,"name":"교통비","parentId":10,"aliases":["대중교통"],"accountCode":"5-02-05","sortOrder":2},{"id":1003,"name":"숙박비","parentId":10,"aliases":["숙박료"],"accountCode":"5-02-05","sortOrder":3}]},{"id":11,"name":"관광홍보비","aliases":["홍보비","광고비"],"sortOrder":11,"accountPool":[{"accountCode":"5-02-22","contraAccountCode":"1-01-03"},{"accountCode":"5-02-21","contraAccountCode":"1-01-03"}],"defaultAccountCode":"5-02-22","subItems":[{"id":1101,"name":"홍보인쇄물","parentId":11,"aliases":["리플렛","브로셔"],"accountCode":"5-02-22","sortOrder":1},{"id":1102,"name":"광고비","parentId":11,"aliases":["온라인광고"],"accountCode":"5-02-22","sortOrder":2},{"id":1103,"name":"행사운영비","parentId":11,"aliases":["이벤트비"],"accountCode":"5-02-21","sortOrder":3}]},{"id":12,"name":"시설유지비","aliases":["시설관리비","유지보수비"],"sortOrder":12,"accountPool":[{"accountCode":"5-02-13","contraAccountCode":"1-01-03"},{"accountCode":"5-02-12","contraAccountCode":"1-01-03"},{"accountCode":"5-02-08","contraAccountCode":"1-01-03"},{"accountCode":"5-02-09","contraAccountCode":"1-01-03"}],"defaultAccountCode":"5-02-13","subItems":[{"id":1201,"name":"시설보수","parentId":12,"aliases":["건물수선"],"accountCode":"5-02-13","sortOrder":1},{"id":1202,"name":"임차료","parentId":12,"aliases":["사무실임대료"],"accountCode":"5-02-12","sortOrder":2},{"id":1203,"name":"수도광열","parentId":12,"aliases":["수도료","가스비"],"accountCode":"5-02-08","sortOrder":3},{"id":1204,"name":"전기료","parentId":12,"aliases":["전력비"],"accountCode":"5-02-09","sortOrder":4}]},{"id":13,"name":"조경공사비","aliases":["조경비","조경정비비"],"sortOrder":13,"accountPool":[{"accountCode":"5-01-06","contraAccountCode":"2-01-04"},{"accountCode":"5-02-13","contraAccountCode":"1-01-03"}],"defaultAccountCode":"5-01-06","subItems":[{"id":1301,"name":"조경공사","parentId":13,"aliases":["조경시공"],"accountCode":"5-01-06","sortOrder":1},{"id":1302,"name":"조경유지","parentId":13,"aliases":["조경유지보수"],"accountCode":"5-02-13","sortOrder":2}]},{"id":1304,"name":"운영비","aliases":["운용비","운영관리비","기타관리비","소모품구매비"],"accountPool":[{"accountCode":"5-02-19","contraAccountCode":"1-01-03"},{"accountCode":"5-02-18","contraAccountCode":"1-01-03"},{"accountCode":"5-02-22","contraAccountCode":"1-01-03"},{"accountCode":"5060","contraAccountCode":"1-01-03"},{"accountCode":"5-02-21","contraAccountCode":"1-01-03"},{"accountCode":"5-02-12"},{"accountCode":"5-02-09"}],"subItems":[{"id":1305,"name":"일반수용비","parentId":1304,"aliases":["소모품 구매비"],"sortOrder":0,"detailItems":[{"id":1306,"name":"사무용품구입비","parentId":1305,"aliases":["사무실비품구입비"],"sortOrder":0,"accountCode":"5-02-19"},{"id":1307,"name":"인쇄및유인비","parentId":1305,"aliases":[],"sortOrder":1,"accountCode":"5-02-18"},{"id":1308,"name":"안내홍보물등 제작비","parentId":1305,"aliases":[],"sortOrder":2,"accountCode":"5-02-22"},{"id":1309,"name":"소모성 물품 구입비","parentId":1305,"aliases":[],"sortOrder":3,"accountCode":"5060"},{"id":1310,"name":"간행물 등 구입비","parentId":1305,"aliases":["구독서비스수수료"],"sortOrder":4,"accountCode":"5-02-21"}]},{"id":1311,"name":"임차료","parentId":1304,"aliases":["임대료","사무실임대료"],"sortOrder":1,"accountCode":"5-02-12"},{"id":1312,"name":"공공요금","parentId":1304,"aliases":[],"sortOrder":2,"accountCode":"5-02-09"}],"sortOrder":13}]
    localStorage.setItem('acct_budget_item_defs', JSON.stringify(defaultDefs))
    items = defaultDefs
  }

  const save = (next: BudgetItemDef[]) => {
    localStorage.setItem('acct_budget_item_defs', JSON.stringify(next))
    setRefresh(r => r + 1)
  }
  const nextId = () => {
    const all = items.flatMap(it => [it.id, ...it.subItems.flatMap(s => [s.id, ...(s.detailItems || []).map(d => d.id)])])
    return all.length > 0 ? Math.max(...all) + 1 : 1
  }
  const acctName = (code?: string) => accounts.find(a => a.code === code)?.name || code || ''

  // ── 펼침 상태 ──
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // ── 예산목 추가/수정 모달 ──
  const [itemModal, setItemModal] = useState<{ mode: 'add' | 'edit'; item?: BudgetItemDef } | null>(null)
  const [imName, setImName] = useState('')
  const [imAliases, setImAliases] = useState<string[]>([])
  const [imAliasInput, setImAliasInput] = useState('')
  const [imPool, setImPool] = useState<AccountPoolEntry[]>([])
  const [imDefaultAcct, setImDefaultAcct] = useState<string | undefined>(undefined)
  const [imAcctSearch, setImAcctSearch] = useState('')

  // ── 세목 추가/수정 모달 ──
  const [subModal, setSubModal] = useState<{ mode: 'add' | 'edit'; parentId: number; sub?: BudgetSubDef } | null>(null)
  const [smName, setSmName] = useState('')
  const [smAliases, setSmAliases] = useState<string[]>([])
  const [smAliasInput, setSmAliasInput] = useState('')
  const [smAcctCode, setSmAcctCode] = useState<string | undefined>(undefined)

  // ── 세세항목 추가/수정 모달 ──
  const [detailModal, setDetailModal] = useState<{ mode: 'add' | 'edit'; itemId: number; subId: number; detail?: BudgetDetailDef } | null>(null)
  const [dmName, setDmName] = useState('')
  const [dmAliases, setDmAliases] = useState<string[]>([])
  const [dmAliasInput, setDmAliasInput] = useState('')
  const [dmAcctCode, setDmAcctCode] = useState<string | undefined>(undefined)

  // ── 삭제 모달 ──
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'item' | 'sub' | 'detail'; id: number; parentId?: number; grandParentId?: number; name: string } | null>(null)

  // ── 세목 드래그 ──
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)

  // ── 세목 펼침 (세세항목 표시) ──
  const [expandedSubId, setExpandedSubId] = useState<number | null>(null)

  // ── 예산목 모달 열기 ──
  const openItemModal = (mode: 'add' | 'edit', item?: BudgetItemDef) => {
    setItemModal({ mode, item })
    setImName(item?.name || '')
    setImAliases(item?.aliases || [])
    setImAliasInput('')
    setImPool(item?.accountPool || [])
    setImDefaultAcct(item?.defaultAccountCode)
    setImAcctSearch('')
  }

  const saveItemModal = () => {
    if (!imName.trim()) { addToast('error', '예산목명을 입력하세요'); return }
    if (!itemModal) return
    if (itemModal.mode === 'add') {
      const newItem: BudgetItemDef = {
        id: nextId(),
        name: imName.trim(),
        aliases: imAliases,
        accountPool: imPool,
        defaultAccountCode: imDefaultAcct,
        subItems: [],
        sortOrder: items.length,
      }
      save([...items, newItem])
      addToast('success', `예산목 "${imName.trim()}" 추가 완료`)
    } else {
      const updated = items.map(it =>
        it.id === itemModal.item!.id
          ? { ...it, name: imName.trim(), aliases: imAliases, accountPool: imPool, defaultAccountCode: imDefaultAcct }
          : it
      )
      save(updated)
      addToast('info', '예산목이 수정되었습니다')
    }
    setItemModal(null)
  }

  // ── 세목 모달 열기 ──
  const openSubModal = (mode: 'add' | 'edit', parentId: number, sub?: BudgetSubDef) => {
    setSubModal({ mode, parentId, sub })
    setSmName(sub?.name || '')
    setSmAliases(sub?.aliases || [])
    setSmAliasInput('')
    setSmAcctCode(sub?.accountCode)
  }

  const saveSubModal = () => {
    if (!smName.trim()) { addToast('error', '세목명을 입력하세요'); return }
    if (!subModal) return
    const updated = items.map(it => {
      if (it.id !== subModal.parentId) return it
      if (subModal.mode === 'add') {
        const newSub: BudgetSubDef = {
          id: nextId(),
          name: smName.trim(),
          parentId: subModal.parentId,
          aliases: smAliases,
          accountCode: smAcctCode,
          sortOrder: it.subItems.length,
        }
        return { ...it, subItems: [...it.subItems, newSub] }
      } else {
        return {
          ...it,
          subItems: it.subItems.map(s =>
            s.id === subModal.sub!.id
              ? { ...s, name: smName.trim(), aliases: smAliases, accountCode: smAcctCode }
              : s
          ),
        }
      }
    })
    save(updated)
    addToast(subModal.mode === 'add' ? 'success' : 'info', subModal.mode === 'add' ? `세목 "${smName.trim()}" 추가 완료` : '세목이 수정되었습니다')
    setSubModal(null)
  }

  // ── 삭제 ──
  const handleDelete = () => {
    if (!deleteTarget) return
    if (deleteTarget.type === 'item') {
      save(items.filter(it => it.id !== deleteTarget.id))
      if (expandedId === deleteTarget.id) setExpandedId(null)
    } else if (deleteTarget.type === 'sub') {
      const updated = items.map(it =>
        it.id === deleteTarget.parentId
          ? { ...it, subItems: it.subItems.filter(s => s.id !== deleteTarget.id) }
          : it
      )
      save(updated)
    } else if (deleteTarget.type === 'detail') {
      const updated = items.map(it =>
        it.id === deleteTarget.grandParentId
          ? {
              ...it,
              subItems: it.subItems.map(s =>
                s.id === deleteTarget.parentId
                  ? { ...s, detailItems: (s.detailItems || []).filter(d => d.id !== deleteTarget.id) }
                  : s
              ),
            }
          : it
      )
      save(updated)
    }
    addToast('warning', `"${deleteTarget.name}" 삭제 완료`)
    setDeleteTarget(null)
  }

  // ── 세세항목 모달 열기 ──
  const openDetailModal = (mode: 'add' | 'edit', itemId: number, subId: number, detail?: BudgetDetailDef) => {
    setDetailModal({ mode, itemId, subId, detail })
    setDmName(detail?.name || '')
    setDmAliases(detail?.aliases || [])
    setDmAliasInput('')
    setDmAcctCode(detail?.accountCode)
  }

  const saveDetailModal = () => {
    if (!dmName.trim()) { addToast('error', '세세항목명을 입력하세요'); return }
    if (!detailModal) return
    const updated = items.map(it => {
      if (it.id !== detailModal.itemId) return it
      return {
        ...it,
        subItems: it.subItems.map(s => {
          if (s.id !== detailModal.subId) return s
          const existing = s.detailItems || []
          if (detailModal.mode === 'add') {
            const newDetail: BudgetDetailDef = {
              id: nextId(),
              name: dmName.trim(),
              parentId: detailModal.subId,
              aliases: dmAliases,
              accountCode: dmAcctCode,
              sortOrder: existing.length,
            }
            return { ...s, detailItems: [...existing, newDetail] }
          } else {
            return {
              ...s,
              detailItems: existing.map(d =>
                d.id === detailModal.detail!.id
                  ? { ...d, name: dmName.trim(), aliases: dmAliases, accountCode: dmAcctCode }
                  : d
              ),
            }
          }
        }),
      }
    })
    save(updated)
    addToast(detailModal.mode === 'add' ? 'success' : 'info', detailModal.mode === 'add' ? `세세항목 "${dmName.trim()}" 추가 완료` : '세세항목이 수정되었습니다')
    setDetailModal(null)
  }

  // ── 세목 드래그 정렬 ──
  const handleSubDrop = (parentId: number, fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return
    const updated = items.map(it => {
      if (it.id !== parentId) return it
      const reordered = [...it.subItems]
      const [moved] = reordered.splice(fromIdx, 1)
      reordered.splice(toIdx, 0, moved)
      return { ...it, subItems: reordered.map((s, i) => ({ ...s, sortOrder: i })) }
    })
    save(updated)
    setDragIdx(null)
    setOverIdx(null)
  }

  // ── 계정 검색 결과 (예산목 모달) ──
  const acctSearchResults = imAcctSearch.trim()
    ? accounts.filter(a =>
        (a.code.includes(imAcctSearch) || a.name.includes(imAcctSearch)) &&
        !imPool.some(p => p.accountCode === a.code)
      ).slice(0, 8)
    : []

  return (
    <>
      <Card>
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-extrabold text-[var(--text-primary)]">예산목·세목 관리</div>
            <div className="text-[11px] text-[var(--text-muted)]">예산목을 정의하고 하위 세목을 관리합니다</div>
          </div>
          <Button onClick={() => openItemModal('add')} icon={<Plus size={15} />} size="md">
            예산목 추가
          </Button>
        </div>

        {/* 예산목 리스트 */}
        {items.length === 0 ? (
          <div className="py-10 text-center text-sm text-[var(--text-muted)]">등록된 예산목이 없습니다</div>
        ) : (
          <div className="space-y-2">
            {items.map(item => {
              const isExpanded = expandedId === item.id
              return (
                <div key={item.id} className="border border-[var(--border-default)] rounded-xl overflow-hidden">
                  {/* 예산목 헤더 */}
                  <div className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-muted)] transition-colors">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-extrabold shrink-0" style={{ background: '#f97316' }}>
                        {item.name.charAt(0)}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-[12px] font-bold text-[var(--text-primary)]">{item.name}</div>
                        {item.accountPool.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {item.accountPool.map(p => (
                              <span key={p.accountCode} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600">
                                {acctName(p.accountCode) || p.accountCode}
                                {item.defaultAccountCode === p.accountCode && ' ★'}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                        style={{ background: item.subItems.length > 0 ? '#f9731618' : '#6b728018', color: item.subItems.length > 0 ? '#f97316' : '#6b7280' }}
                      >
                        세목 {item.subItems.length}건
                      </span>
                      <ChevronRight
                        size={14}
                        className={cn(
                          'text-[var(--text-muted)] transition-transform duration-200',
                          isExpanded && 'rotate-90'
                        )}
                      />
                    </button>
                    {/* 수정/삭제 */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openItemModal('edit', item)}
                        className="p-1.5 rounded-md hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-500 cursor-pointer transition-colors"
                        title="수정"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ type: 'item', id: item.id, name: item.name })}
                        className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-danger cursor-pointer transition-colors"
                        title="삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* 펼침: 세목 테이블 */}
                  {isExpanded && (
                    <div className="border-t border-[var(--border-default)] bg-[var(--bg-muted)]/50">
                      <div className="px-4 py-2 text-[10px] font-bold text-[var(--text-muted)] flex justify-between">
                        <span>하위 세목</span>
                        <Button size="sm" onClick={() => openSubModal('add', item.id)} icon={<Plus size={12} />}>
                          세목 추가
                        </Button>
                      </div>

                      {item.subItems.length === 0 ? (
                        <div className="px-4 py-6 text-center text-[11px] text-[var(--text-muted)]">등록된 세목이 없습니다</div>
                      ) : (
                        <>
                          {/* 테이블 헤더 */}
                          <div className="grid grid-cols-[28px_32px_1fr_120px_1fr_64px] gap-2 px-4 py-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-default)]">
                            <span></span>
                            <span>#</span>
                            <span>세목명</span>
                            <span>연결 계정</span>
                            <span>동의어</span>
                            <span className="text-center">관리</span>
                          </div>
                          {/* 세목 행 */}
                          <div className="divide-y divide-[var(--border-default)]">
                            {item.subItems.map((sub, idx) => {
                              const details = sub.detailItems || []
                              const isSubExpanded = expandedSubId === sub.id
                              return (
                                <div key={sub.id}>
                                  <div
                                    draggable
                                    onDragStart={() => setDragIdx(idx)}
                                    onDragOver={(e) => { e.preventDefault(); setOverIdx(idx) }}
                                    onDrop={() => handleSubDrop(item.id, dragIdx!, idx)}
                                    onDragEnd={() => { setDragIdx(null); setOverIdx(null) }}
                                    className={cn(
                                      'grid grid-cols-[28px_32px_1fr_120px_1fr_64px] gap-2 px-4 py-2.5 items-center hover:bg-[var(--bg-surface)] transition-all group',
                                      dragIdx === idx && 'opacity-40 scale-95',
                                      overIdx === idx && dragIdx !== idx && 'ring-2 ring-primary-300 bg-primary-50/50 dark:bg-primary-900/10',
                                    )}
                                  >
                                    <span className="cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
                                      <GripVertical size={14} />
                                    </span>
                                    <span className="text-[11px] font-bold text-[var(--text-muted)] text-center">{idx + 1}</span>
                                    <span className="flex items-center gap-1.5">
                                      {details.length > 0 && (
                                        <button onClick={() => setExpandedSubId(isSubExpanded ? null : sub.id)} className="cursor-pointer">
                                          <ChevronRight size={12} className={cn('text-[var(--text-muted)] transition-transform', isSubExpanded && 'rotate-90')} />
                                        </button>
                                      )}
                                      <span className="text-[12px] font-semibold text-[var(--text-primary)] truncate">{sub.name}</span>
                                      {details.length > 0 && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/20 text-violet-600">{details.length}</span>
                                      )}
                                    </span>
                                    <span className="text-[11px] text-[var(--text-secondary)] truncate">
                                      {sub.accountCode
                                        ? acctName(sub.accountCode)
                                        : <span className="text-[var(--text-muted)] italic">기본값</span>
                                      }
                                    </span>
                                    <div className="flex flex-wrap gap-1">
                                      {sub.aliases.map(a => (
                                        <span key={a} className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[var(--text-secondary)]">{a}</span>
                                      ))}
                                    </div>
                                    <div className="flex items-center gap-1 justify-center">
                                      <button
                                        onClick={() => openDetailModal('add', item.id, sub.id)}
                                        className="p-1 rounded-md hover:bg-violet-50 dark:hover:bg-violet-900/20 text-violet-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="세세항목 추가"
                                      >
                                        <Plus size={12} />
                                      </button>
                                      <button
                                        onClick={() => openSubModal('edit', item.id, sub)}
                                        className="p-1 rounded-md hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <Pencil size={12} />
                                      </button>
                                      <button
                                        onClick={() => setDeleteTarget({ type: 'sub', id: sub.id, parentId: item.id, name: sub.name })}
                                        className="p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-danger cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  </div>
                                  {/* 세세항목 펼침 */}
                                  {isSubExpanded && details.length > 0 && (
                                    <div className="bg-violet-50/30 dark:bg-violet-900/5 border-t border-dashed border-violet-200 dark:border-violet-800">
                                      {details.map((d, di) => (
                                        <div key={d.id} className="grid grid-cols-[28px_32px_28px_1fr_120px_1fr_64px] gap-2 px-4 py-1.5 items-center hover:bg-violet-50/50 dark:hover:bg-violet-900/10 group/detail">
                                          <span />
                                          <span />
                                          <span className="text-[10px] font-bold text-violet-400 text-center">{di + 1}</span>
                                          <span className="text-[11px] text-[var(--text-primary)] truncate pl-1">↳ {d.name}</span>
                                          <span className="text-[10px] text-[var(--text-secondary)] truncate">
                                            {d.accountCode ? acctName(d.accountCode) : <span className="text-[var(--text-muted)] italic">상위값</span>}
                                          </span>
                                          <div className="flex flex-wrap gap-1">
                                            {d.aliases.map(a => (
                                              <span key={a} className="text-[8px] px-1 py-0.5 rounded bg-violet-100 dark:bg-violet-800/30 text-violet-600">{a}</span>
                                            ))}
                                          </div>
                                          <div className="flex items-center gap-1 justify-center">
                                            <button
                                              onClick={() => openDetailModal('edit', item.id, sub.id, d)}
                                              className="p-1 rounded-md hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-500 cursor-pointer opacity-0 group-hover/detail:opacity-100 transition-opacity"
                                            >
                                              <Pencil size={10} />
                                            </button>
                                            <button
                                              onClick={() => setDeleteTarget({ type: 'detail', id: d.id, parentId: sub.id, grandParentId: item.id, name: d.name })}
                                              className="p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-danger cursor-pointer opacity-0 group-hover/detail:opacity-100 transition-opacity"
                                            >
                                              <Trash2 size={10} />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* ── 예산목 추가/수정 모달 ── */}
      <Modal
        open={itemModal !== null}
        onClose={() => setItemModal(null)}
        title={itemModal?.mode === 'add' ? '예산목 추가' : '예산목 수정'}
      >
        <ModalBody className="space-y-4">
          {/* 예산목명 */}
          <Input
            label="예산목명"
            value={imName}
            onChange={(e) => setImName(e.target.value)}
            placeholder="예: 인건비, 소모품비"
            autoFocus
          />

          {/* 동의어 */}
          <div>
            <span className="text-[11px] font-bold text-[var(--text-muted)] mb-1.5 block">동의어</span>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {imAliases.map(a => (
                <span key={a} className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-[var(--text-secondary)]">
                  {a}
                  <button onClick={() => setImAliases(imAliases.filter(x => x !== a))} className="hover:text-danger cursor-pointer">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="동의어 입력 후 Enter"
                value={imAliasInput}
                onChange={(e) => setImAliasInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && imAliasInput.trim()) {
                    e.preventDefault()
                    if (!imAliases.includes(imAliasInput.trim())) {
                      setImAliases([...imAliases, imAliasInput.trim()])
                    }
                    setImAliasInput('')
                  }
                }}
              />
            </div>
          </div>

          {/* 허용 계정 풀 */}
          <div>
            <span className="text-[11px] font-bold text-[var(--text-muted)] mb-1.5 block">허용 계정 풀</span>
            {imPool.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {imPool.map(p => (
                  <div key={p.accountCode} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-muted)]">
                    <button
                      onClick={() => setImDefaultAcct(imDefaultAcct === p.accountCode ? undefined : p.accountCode)}
                      className={cn('text-[14px] cursor-pointer shrink-0', imDefaultAcct === p.accountCode ? 'text-yellow-500' : 'text-[var(--text-muted)] hover:text-yellow-400')}
                      title="기본 계정 지정"
                    >
                      ★
                    </button>
                    <span className="text-[12px] font-semibold text-[var(--text-primary)] flex-1">
                      {p.accountCode} {acctName(p.accountCode)}
                    </span>
                    {/* 상대계정 선택 */}
                    <select
                      className="text-[11px] bg-[var(--bg-surface)] border border-[var(--border-default)] rounded px-1.5 py-0.5 text-[var(--text-secondary)] max-w-[140px]"
                      value={p.contraAccountCode || ''}
                      onChange={(e) => {
                        setImPool(imPool.map(pp =>
                          pp.accountCode === p.accountCode
                            ? { ...pp, contraAccountCode: e.target.value || undefined }
                            : pp
                        ))
                      }}
                    >
                      <option value="">상대계정 선택</option>
                      {accounts.map(a => (
                        <option key={a.code} value={a.code}>{a.code} {a.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        setImPool(imPool.filter(pp => pp.accountCode !== p.accountCode))
                        if (imDefaultAcct === p.accountCode) setImDefaultAcct(undefined)
                      }}
                      className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-danger cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {/* 계정 검색 */}
            <Input
              placeholder="계정 코드 또는 이름으로 검색"
              value={imAcctSearch}
              onChange={(e) => setImAcctSearch(e.target.value)}
            />
            {acctSearchResults.length > 0 && (
              <div className="mt-1 border border-[var(--border-default)] rounded-lg max-h-[160px] overflow-y-auto">
                {acctSearchResults.map(a => (
                  <button
                    key={a.code}
                    onClick={() => {
                      setImPool([...imPool, { accountCode: a.code }])
                      setImAcctSearch('')
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--bg-muted)] transition-colors cursor-pointer text-[12px]"
                  >
                    <span className="font-mono text-[var(--text-muted)]">{a.code}</span>
                    <span className="font-semibold text-[var(--text-primary)]">{a.name}</span>
                    <span className="text-[10px] text-[var(--text-muted)] ml-auto">{a.group}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setItemModal(null)}>취소</Button>
          <Button onClick={saveItemModal}>저장</Button>
        </ModalFooter>
      </Modal>

      {/* ── 세목 추가/수정 모달 ── */}
      <Modal
        open={subModal !== null}
        onClose={() => setSubModal(null)}
        title={subModal?.mode === 'add' ? '세목 추가' : '세목 수정'}
      >
        <ModalBody className="space-y-4">
          {/* 세목명 */}
          <Input
            label="세목명"
            value={smName}
            onChange={(e) => setSmName(e.target.value)}
            placeholder="예: 기본급, 상여금"
            autoFocus
          />

          {/* 동의어 */}
          <div>
            <span className="text-[11px] font-bold text-[var(--text-muted)] mb-1.5 block">동의어</span>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {smAliases.map(a => (
                <span key={a} className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-[var(--text-secondary)]">
                  {a}
                  <button onClick={() => setSmAliases(smAliases.filter(x => x !== a))} className="hover:text-danger cursor-pointer">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="동의어 입력 후 Enter"
                value={smAliasInput}
                onChange={(e) => setSmAliasInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && smAliasInput.trim()) {
                    e.preventDefault()
                    if (!smAliases.includes(smAliasInput.trim())) {
                      setSmAliases([...smAliases, smAliasInput.trim()])
                    }
                    setSmAliasInput('')
                  }
                }}
              />
            </div>
          </div>

          {/* 계정과목 선택 (부모 풀에서만) */}
          <div>
            <span className="text-[11px] font-bold text-[var(--text-muted)] mb-1.5 block">계정과목</span>
            {(() => {
              const parent = items.find(it => it.id === subModal?.parentId)
              if (!parent || parent.accountPool.length === 0) {
                return <div className="text-[11px] text-[var(--text-muted)] italic">부모 예산목에 허용 계정 풀이 없습니다</div>
              }
              return (
                <div className="space-y-1.5">
                  {parent.accountPool.map(p => (
                    <label key={p.accountCode} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--bg-muted)] transition-colors cursor-pointer">
                      <input
                        type="radio"
                        name="sub_acct"
                        checked={smAcctCode === p.accountCode}
                        onChange={() => setSmAcctCode(p.accountCode)}
                        className="accent-[var(--color-primary-500)]"
                      />
                      <span className="text-[12px] font-mono text-[var(--text-muted)]">{p.accountCode}</span>
                      <span className="text-[12px] font-semibold text-[var(--text-primary)]">{acctName(p.accountCode)}</span>
                      {parent.defaultAccountCode === p.accountCode && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600">기본</span>
                      )}
                    </label>
                  ))}
                  <button
                    onClick={() => setSmAcctCode(undefined)}
                    className="text-[11px] text-primary-500 hover:underline cursor-pointer px-3"
                  >
                    선택 해제 (기본 계정 사용)
                  </button>
                  {!smAcctCode && parent.defaultAccountCode && (
                    <div className="text-[10px] text-[var(--text-muted)] italic px-3">
                      미선택 시 예산목의 기본 계정 ({acctName(parent.defaultAccountCode)})이 적용됩니다
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setSubModal(null)}>취소</Button>
          <Button onClick={saveSubModal}>저장</Button>
        </ModalFooter>
      </Modal>

      {/* ── 세세항목 추가/수정 모달 ── */}
      <Modal
        open={detailModal !== null}
        onClose={() => setDetailModal(null)}
        title={detailModal?.mode === 'add' ? '세세항목 추가' : '세세항목 수정'}
      >
        <ModalBody className="space-y-4">
          {/* 세세항목명 */}
          <div>
            <label className="text-[11px] font-bold text-[var(--text-secondary)] mb-1 block">세세항목명 *</label>
            <Input value={dmName} onChange={e => setDmName(e.target.value)} placeholder="예) 정규직기본급" />
          </div>
          {/* 동의어 */}
          <div>
            <label className="text-[11px] font-bold text-[var(--text-secondary)] mb-1 block">동의어</label>
            <div className="flex flex-wrap gap-1 mb-2">
              {dmAliases.map(a => (
                <span key={a} className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-600">
                  {a}
                  <button onClick={() => setDmAliases(prev => prev.filter(x => x !== a))} className="hover:text-danger cursor-pointer"><X size={10} /></button>
                </span>
              ))}
            </div>
            <Input
              value={dmAliasInput}
              onChange={e => setDmAliasInput(e.target.value)}
              placeholder="동의어 입력 후 Enter"
              onKeyDown={e => {
                if (e.key === 'Enter' && dmAliasInput.trim()) {
                  e.preventDefault()
                  if (!dmAliases.includes(dmAliasInput.trim())) setDmAliases(prev => [...prev, dmAliasInput.trim()])
                  setDmAliasInput('')
                }
              }}
            />
          </div>
          {/* 계정 선택 (부모 세목의 계정 풀에서) */}
          {detailModal && (() => {
            const parentItem = items.find(it => it.id === detailModal.itemId)
            const pool = parentItem?.accountPool || []
            return (
              <div>
                <label className="text-[11px] font-bold text-[var(--text-secondary)] mb-1 block">계정과목 (미선택 시 세목 계정 사용)</label>
                <div className="space-y-1">
                  <label className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[var(--bg-muted)] cursor-pointer">
                    <input type="radio" name="dm_acct" checked={!dmAcctCode} onChange={() => setDmAcctCode(undefined)} />
                    <span className="text-[11px] text-[var(--text-muted)] italic">상위 세목 계정 사용</span>
                  </label>
                  {pool.map(p => (
                    <label key={p.accountCode} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[var(--bg-muted)] cursor-pointer">
                      <input type="radio" name="dm_acct" checked={dmAcctCode === p.accountCode} onChange={() => setDmAcctCode(p.accountCode)} />
                      <span className="text-[11px]">{p.accountCode} {acctName(p.accountCode)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )
          })()}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setDetailModal(null)}>취소</Button>
          <Button onClick={saveDetailModal}>{detailModal?.mode === 'add' ? '추가' : '저장'}</Button>
        </ModalFooter>
      </Modal>

      {/* ── 삭제 확인 모달 ── */}
      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="삭제 확인"
      >
        <ModalBody>
          <p className="text-sm text-[var(--text-secondary)]">
            <strong>"{deleteTarget?.name}"</strong> {deleteTarget?.type === 'item' ? '예산목' : '세목'}을(를) 삭제하시겠습니까?
          </p>
          {deleteTarget?.type === 'item' && (
            <p className="text-xs text-danger mt-2">하위 세목도 함께 삭제됩니다.</p>
          )}
          <p className="text-xs text-danger mt-1">이 작업은 되돌릴 수 없습니다.</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>취소</Button>
          <Button variant="danger" onClick={handleDelete}>삭제</Button>
        </ModalFooter>
      </Modal>
    </>
  )
}

/* ══════════════════════════════════════════════
   지출수단 관리 패널
   ══════════════════════════════════════════════ */
const DEFAULT_PAY_METHODS = ['계좌이체', '현금', '카드', '법인카드', '기타']

function PaymentMethodPanel() {
  const [refresh, setRefresh] = useState(0)
  const [newName, setNewName] = useState('')
  const addToast = useToastStore((s) => s.add)
  const inputRef = useRef<HTMLInputElement>(null)

  // 초기화: 기본 지출수단 시딩
  const stored: string[] = getItem('acct_payment_methods', [])
  if (stored.length === 0) {
    localStorage.setItem('acct_payment_methods', JSON.stringify(DEFAULT_PAY_METHODS))
  }
  void refresh

  const methods: string[] = getItem('acct_payment_methods', DEFAULT_PAY_METHODS)

  const handleAdd = () => {
    if (!newName.trim()) return
    if (methods.includes(newName.trim())) {
      addToast('error', '이미 존재하는 지출수단입니다')
      return
    }
    const updated = [...methods, newName.trim()]
    localStorage.setItem('acct_payment_methods', JSON.stringify(updated))
    addToast('success', `지출수단 "${newName.trim()}" 추가 완료`)
    setNewName('')
    setRefresh(r => r + 1)
    inputRef.current?.focus()
  }

  const handleDelete = (name: string) => {
    if (!confirm(`"${name}" 지출수단을 삭제하시겠습니까?`)) return
    const updated = methods.filter(m => m !== name)
    localStorage.setItem('acct_payment_methods', JSON.stringify(updated))
    addToast('warning', `지출수단 "${name}" 삭제 완료`)
    setRefresh(r => r + 1)
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-extrabold text-[var(--text-primary)]">지출수단 관리</div>
          <div className="text-[11px] text-[var(--text-muted)]">지출/입금 등록 시 선택 가능한 지출수단 목록입니다</div>
        </div>
      </div>

      {/* 추가 폼 */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1">
          <Input
            ref={inputRef}
            placeholder="새 지출수단 입력 (예: 간편결제, 상품권)"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
        </div>
        <Button onClick={handleAdd} icon={<Plus size={15} />} size="md" className="shrink-0">
          <span className="hidden sm:inline">추가</span>
        </Button>
      </div>

      {/* 헤더 */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border-default)]">
        <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">지출수단 목록</span>
        <span className="text-[11px] font-bold text-[#ec4899]">{methods.length}건</span>
      </div>

      {methods.length === 0 ? (
        <div className="py-10 text-center text-sm text-[var(--text-muted)]">등록된 지출수단이 없습니다</div>
      ) : (
        <div className="space-y-0.5">
          {methods.map((name, idx) => (
            <div key={name} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--bg-muted)] transition-all group">
              <span className="text-[11px] font-bold text-[var(--text-muted)] w-5 text-center shrink-0">{idx + 1}</span>
              <span className="text-sm font-semibold text-[var(--text-primary)] flex-1 truncate">{name}</span>
              {DEFAULT_PAY_METHODS.includes(name) && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600">기본</span>
              )}
              <button
                onClick={() => handleDelete(name)}
                className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-danger cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

/* ══════════════════════════════════════════════
   🎨 테마 설정 패널
   ══════════════════════════════════════════════ */
export function ThemePanel() {
  const { theme, accent, radius, density, fontScale, fontColor, datePickerStyle, checkboxStyle, checkboxSize, tabStyle, buttonSize, toastPosition, tableStripe, tableDensity, badgeShape, sidebarWidth, progressColor, toggle, setAccent, setRadius, setDensity, setFontScale, setFontColor, setDatePickerStyle, setCheckboxStyle, setCheckboxSize, setTabStyle, setButtonSize, setToastPosition, setTableStripe, setTableDensity, setBadgeShape, setSidebarWidth, setProgressColor, customAccents, addCustomAccent, removeCustomAccent, typography, setTypo, resetTypo } = useThemeStore()
  const addToast = useToastStore((s) => s.add)

  const radiusKeys = Object.keys(RADIUS_LABELS) as ThemeRadius[]
  const densityKeys = Object.keys(DENSITY_LABELS) as ThemeDensity[]

  /* 커스텀 색상 추가 */
  const [showAddColor, setShowAddColor] = useState(false)
  const [newColorName, setNewColorName] = useState('')
  const [newColorValue, setNewColorValue] = useState('#6366f1')

  const handleAddColor = () => {
    if (!newColorName.trim()) {
      addToast('error', '색상 이름을 입력하세요')
      return
    }
    addCustomAccent(newColorName.trim(), newColorValue)
    addToast('success', `"${newColorName.trim()}" 색상이 추가되었습니다`)
    setNewColorName('')
    setNewColorValue('#6366f1')
    setShowAddColor(false)
  }

  const handleDeleteColor = (key: string, label: string) => {
    removeCustomAccent(key)
    addToast('warning', `"${label}" 색상이 삭제되었습니다`)
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* 모드 */}
      <Card>
        <div className="text-sm font-extrabold text-[var(--text-primary)] mb-3">모드</div>
        <div className="flex gap-3">
          {[
            { key: 'light' as const, label: '라이트', Icon: Sun },
            { key: 'dark' as const, label: '다크', Icon: Moon },
          ].map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => { if (theme !== key) toggle() }}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-bold cursor-pointer transition-all',
                theme === key
                  ? 'border-[var(--btn-save-bg)] bg-[var(--tab-active-bg)] text-[var(--tab-active-color)]'
                  : 'border-[var(--border-default)] text-[var(--text-muted)] hover:border-[var(--border-strong)]',
              )}
            >
              <Icon size={18} />
              {label}
              {theme === key && <Check size={14} />}
            </button>
          ))}
        </div>
      </Card>

      {/* 메인 색상 */}
      <Card>
        <div className="flex items-center justify-between mb-1">
          <div className="text-sm font-extrabold text-[var(--text-primary)]">메인 색상</div>
          <Button
            variant="add"
            size="xs"
            icon={<Plus size={13} />}
            onClick={() => setShowAddColor(!showAddColor)}
          >
            추가
          </Button>
        </div>
        <p className="text-[11px] text-[var(--text-muted)] mb-3">UI 전체에 적용되는 브랜드 색상입니다</p>

        {/* 커스텀 색상 추가 폼 */}
        {showAddColor && (
          <div className="mb-4 p-3 rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-muted)] space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={newColorValue}
                onChange={(e) => setNewColorValue(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
              />
              <div className="flex-1">
                <Input
                  placeholder="색상 이름 (예: 기업 브랜드)"
                  value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddColor()}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[var(--text-muted)] font-mono">{newColorValue.toUpperCase()}</span>
              <div className="flex gap-2">
                <Button variant="cancel" size="xs" onClick={() => setShowAddColor(false)}>취소</Button>
                <Button variant="save" size="xs" onClick={handleAddColor}>추가</Button>
              </div>
            </div>
          </div>
        )}

        {/* 기본 프리셋 */}
        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">기본 프리셋 (삭제 불가)</span>
        <div className="grid grid-cols-7 gap-2 mb-4">
          {PRESET_ACCENTS.map((p) => (
            <button
              key={p.key}
              onClick={() => setAccent(p.key)}
              className={cn(
                'flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 cursor-pointer transition-all',
                accent === p.key
                  ? 'border-[var(--btn-save-bg)] shadow-md scale-105'
                  : 'border-transparent hover:border-[var(--border-default)]',
              )}
            >
              <div
                className="w-8 h-8 rounded-full shadow-sm flex items-center justify-center"
                style={{ backgroundColor: p.color }}
              >
                {accent === p.key && <Check size={14} className="text-white" />}
              </div>
              <span className="text-[10px] font-bold text-[var(--text-secondary)]">{p.label}</span>
            </button>
          ))}
        </div>

        {/* 커스텀 색상 */}
        {customAccents.length > 0 && (
          <>
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">커스텀 색상</span>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {customAccents.map((c) => (
                <div key={c.key} className="relative group">
                  <button
                    onClick={() => setAccent(c.key)}
                    className={cn(
                      'w-full flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 cursor-pointer transition-all',
                      accent === c.key
                        ? 'border-[var(--btn-save-bg)] shadow-md scale-105'
                        : 'border-transparent hover:border-[var(--border-default)]',
                    )}
                  >
                    <div
                      className="w-8 h-8 rounded-full shadow-sm flex items-center justify-center"
                      style={{ backgroundColor: c.color }}
                    >
                      {accent === c.key && <Check size={14} className="text-white" />}
                    </div>
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] truncate max-w-full px-1">{c.label}</span>
                  </button>
                  {/* 삭제 버튼 */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteColor(c.key, c.label) }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[var(--color-danger-500)] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm"
                    title="삭제"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* 모서리 둥글기 */}
      <Card>
        <div className="text-sm font-extrabold text-[var(--text-primary)] mb-1">모서리 둥글기</div>
        <p className="text-[11px] text-[var(--text-muted)] mb-3">버튼, 카드 등의 모서리 스타일입니다</p>
        <div className="grid grid-cols-4 gap-2">
          {radiusKeys.map((key) => {
            const previewR = key === 'sharp' ? '2px' : key === 'default' ? '8px' : key === 'rounded' ? '14px' : '20px'
            return (
              <button
                key={key}
                onClick={() => setRadius(key)}
                className={cn(
                  'flex flex-col items-center gap-2 py-3 rounded-xl border-2 cursor-pointer transition-all',
                  radius === key
                    ? 'border-[var(--btn-save-bg)] bg-[var(--tab-active-bg)]'
                    : 'border-[var(--border-default)] hover:border-[var(--border-strong)]',
                )}
              >
                <div
                  className="w-10 h-8 border-2 border-[var(--text-muted)]"
                  style={{ borderRadius: previewR }}
                />
                <span className="text-[10px] font-bold text-[var(--text-secondary)]">{RADIUS_LABELS[key]}</span>
              </button>
            )
          })}
        </div>
      </Card>

      {/* 밀도 */}
      <Card>
        <div className="text-sm font-extrabold text-[var(--text-primary)] mb-1">밀도</div>
        <p className="text-[11px] text-[var(--text-muted)] mb-3">UI 요소 간의 간격과 여백입니다</p>
        <div className="grid grid-cols-3 gap-2">
          {densityKeys.map((key) => (
            <button
              key={key}
              onClick={() => setDensity(key)}
              className={cn(
                'flex flex-col items-center gap-2 py-3 rounded-xl border-2 cursor-pointer transition-all',
                density === key
                  ? 'border-[var(--btn-save-bg)] bg-[var(--tab-active-bg)]'
                  : 'border-[var(--border-default)] hover:border-[var(--border-strong)]',
              )}
            >
              <div className="flex flex-col items-center gap-0.5">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-[var(--text-muted)] rounded-sm"
                    style={{
                      width: 28,
                      height: key === 'compact' ? 3 : key === 'default' ? 4 : 5,
                      marginBottom: key === 'compact' ? 1 : key === 'default' ? 3 : 5,
                    }}
                  />
                ))}
              </div>
              <span className="text-[10px] font-bold text-[var(--text-secondary)]">{DENSITY_LABELS[key]}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* 날짜피커 스타일 */}
      <Card>
        <div className="text-sm font-extrabold text-[var(--text-primary)] mb-1">날짜 피커 스타일</div>
        <p className="text-[11px] text-[var(--text-muted)] mb-3">달력의 형태를 변경합니다</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(Object.keys(DATEPICKER_LABELS) as ThemeDatePicker[]).map((key) => {
            const dayShape = key === 'default' ? 'rounded-lg' : key === 'modern' ? 'rounded-md' : key === 'minimal' ? 'rounded-none' : 'rounded-full'
            const panelShape = key === 'default' ? 'rounded-xl' : key === 'modern' ? 'rounded-lg border-t-2 border-t-primary-500' : key === 'minimal' ? 'rounded-sm' : 'rounded-2xl'
            return (
              <button
                key={key}
                onClick={() => setDatePickerStyle(key)}
                className={cn(
                  'flex flex-col items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all',
                  datePickerStyle === key
                    ? 'border-[var(--btn-save-bg)] bg-[var(--tab-active-bg)] shadow-md'
                    : 'border-[var(--border-default)] hover:border-[var(--border-strong)]',
                )}
              >
                {/* 미니 캘린더 프리뷰 */}
                <div className={cn('w-full bg-[var(--bg-surface)] border border-[var(--border-default)] p-2', panelShape)}>
                  <div className="text-[8px] font-bold text-center text-[var(--text-primary)] mb-1">2026년 04월</div>
                  <div className="grid grid-cols-7 gap-px">
                    {['일','월','화','수','목','금','토'].map((d,i) => (
                      <div key={d} className={`text-[6px] text-center ${i===0?'text-red-300':i===6?'text-blue-300':'text-[var(--text-muted)]'}`}>{d}</div>
                    ))}
                    {[14,15,16,17,18,19,20].map((d) => (
                      <div
                        key={d}
                        className={cn(
                          'text-[7px] w-full aspect-square flex items-center justify-center font-medium',
                          dayShape,
                          d === 18 ? 'bg-primary-500 text-white font-bold' : 'text-[var(--text-primary)]',
                        )}
                      >{d}</div>
                    ))}
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[var(--text-secondary)]">{DATEPICKER_LABELS[key]}</span>
              </button>
            )
          })}
        </div>
      </Card>

      {/* 체크박스/라디오 스타일 */}
      <Card>
        <div className="text-sm font-extrabold text-[var(--text-primary)] mb-1">체크박스 / 라디오 스타일</div>
        <p className="text-[11px] text-[var(--text-muted)] mb-3">체크박스와 라디오 버튼의 형태를 변경합니다</p>
        <div className="grid grid-cols-3 gap-3">
          {(Object.keys(CHECKBOX_STYLE_LABELS) as ThemeCheckboxStyle[]).map((key) => {
            const cbR = key === 'default' ? 'rounded-md' : key === 'sharp' ? 'rounded-none' : 'rounded-full'
            return (
              <button
                key={key}
                onClick={() => setCheckboxStyle(key)}
                className={cn(
                  'flex flex-col items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                  checkboxStyle === key
                    ? 'border-[var(--btn-save-bg)] bg-[var(--tab-active-bg)] shadow-md'
                    : 'border-[var(--border-default)] hover:border-[var(--border-strong)]',
                )}
              >
                <div className="flex items-center gap-3">
                  {/* 체크박스 미니 */}
                  <div className={cn('w-5 h-5 border-2 border-primary-500 bg-primary-500 flex items-center justify-center', cbR)}>
                    <Check size={12} className="text-white" strokeWidth={3} />
                  </div>
                  {/* 라디오 미니 */}
                  <div className={cn('w-5 h-5 border-2 border-primary-500 bg-primary-500 flex items-center justify-center', key === 'circle' ? 'rounded-full' : 'rounded-full')}>
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[var(--text-secondary)]">{CHECKBOX_STYLE_LABELS[key]}</span>
              </button>
            )
          })}
        </div>
      </Card>

      {/* 체크박스/라디오 크기 */}
      <Card>
        <div className="text-sm font-extrabold text-[var(--text-primary)] mb-1">체크박스 / 라디오 크기</div>
        <p className="text-[11px] text-[var(--text-muted)] mb-3">체크박스와 라디오 버튼의 크기를 변경합니다</p>
        <div className="grid grid-cols-4 gap-3">
          {(Object.keys(CHECKBOX_SIZE_LABELS) as ThemeCheckboxSize[]).map((key) => {
            const sv = CHECKBOX_SIZE_VALUES[key]
            return (
              <button
                key={key}
                onClick={() => setCheckboxSize(key)}
                className={cn(
                  'flex flex-col items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                  checkboxSize === key
                    ? 'border-[var(--btn-save-bg)] bg-[var(--tab-active-bg)] shadow-md'
                    : 'border-[var(--border-default)] hover:border-[var(--border-strong)]',
                )}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="border-2 border-primary-500 bg-primary-500 flex items-center justify-center rounded-[var(--radius-xs)]"
                    style={{ width: sv.box, height: sv.box }}
                  >
                    <Check size={sv.icon} className="text-white" strokeWidth={3} />
                  </div>
                  <div
                    className="border-2 border-primary-500 bg-primary-500 flex items-center justify-center rounded-full"
                    style={{ width: sv.box, height: sv.box }}
                  >
                    <div className="rounded-full bg-white" style={{ width: sv.dot, height: sv.dot }} />
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[var(--text-secondary)]">{CHECKBOX_SIZE_LABELS[key]}</span>
              </button>
            )
          })}
        </div>
      </Card>

      {/* 탭 스타일 */}
      <Card>
        <div className="text-sm font-extrabold text-[var(--text-primary)] mb-1">탭 스타일</div>
        <p className="text-[11px] text-[var(--text-muted)] mb-3">탭 버튼의 기본 형태를 변경합니다</p>
        <div className="grid grid-cols-3 gap-3">
          {(Object.keys(TAB_STYLE_LABELS) as ThemeTabStyle[]).map((key) => (
            <button
              key={key}
              onClick={() => setTabStyle(key)}
              className={cn(
                'flex flex-col items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all',
                tabStyle === key
                  ? 'border-[var(--btn-save-bg)] bg-[var(--tab-active-bg)] shadow-md'
                  : 'border-[var(--border-default)] hover:border-[var(--border-strong)]',
              )}
            >
              {/* 미니 탭 프리뷰 */}
              <div className="w-full flex gap-1 justify-center">
                {['전체','진행','완료'].map((t, i) => (
                  <span
                    key={t}
                    className={cn(
                      'text-[8px] font-bold px-2 py-1 transition-all',
                      key === 'underline' && (i === 0 ? 'text-primary-500 border-b-2 border-primary-500' : 'text-[var(--text-muted)] border-b-2 border-transparent'),
                      key === 'box' && (i === 0 ? 'text-primary-500 bg-[var(--tab-active-bg)] border border-primary-200 rounded-md' : 'text-[var(--text-muted)]'),
                      key === 'pill' && (i === 0 ? 'text-white bg-primary-500 rounded-full' : 'text-[var(--text-muted)]'),
                    )}
                  >{t}</span>
                ))}
              </div>
              <span className="text-[10px] font-bold text-[var(--text-secondary)]">{TAB_STYLE_LABELS[key]}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* 버튼 기본 크기 */}
      <Card>
        <div className="text-sm font-extrabold text-[var(--text-primary)] mb-1">버튼 기본 크기</div>
        <p className="text-[11px] text-[var(--text-muted)] mb-3">버튼의 기본 크기를 변경합니다</p>
        <div className="grid grid-cols-4 gap-3">
          {(Object.keys(BUTTON_SIZE_LABELS) as ThemeButtonSize[]).map((key) => (
            <button
              key={key}
              onClick={() => setButtonSize(key)}
              className={cn(
                'flex flex-col items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all',
                buttonSize === key
                  ? 'border-[var(--btn-save-bg)] bg-[var(--tab-active-bg)] shadow-md'
                  : 'border-[var(--border-default)] hover:border-[var(--border-strong)]',
              )}
            >
              <div className={cn(
                'bg-[var(--btn-save-bg)] text-white font-bold rounded-[var(--radius-sm)] flex items-center justify-center',
                key === 'xs' ? 'h-5 px-2 text-[9px]' : key === 'sm' ? 'h-6 px-2.5 text-[10px]' : key === 'md' ? 'h-7 px-3 text-[11px]' : 'h-9 px-4 text-xs',
              )}>
                버튼
              </div>
              <span className="text-[10px] font-bold text-[var(--text-secondary)]">{BUTTON_SIZE_LABELS[key]}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* 토스트 알림 위치 */}
      <Card>
        <div className="text-sm font-extrabold text-[var(--text-primary)] mb-1">토스트 알림 위치</div>
        <p className="text-[11px] text-[var(--text-muted)] mb-3">알림 메시지의 표시 위치를 변경합니다</p>
        <div className="grid grid-cols-5 gap-2">
          {(Object.keys(TOAST_POSITION_LABELS) as ThemeToastPosition[]).map((key) => (
            <button
              key={key}
              onClick={() => { setToastPosition(key); addToast('info', `알림위치: ${TOAST_POSITION_LABELS[key]}`) }}
              className={cn(
                'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 cursor-pointer transition-all',
                toastPosition === key
                  ? 'border-[var(--btn-save-bg)] bg-[var(--tab-active-bg)] shadow-md'
                  : 'border-[var(--border-default)] hover:border-[var(--border-strong)]',
              )}
            >
              <div className="w-8 h-6 rounded border border-[var(--border-strong)] relative bg-[var(--bg-muted)]">
                <div className={cn(
                  'absolute w-2.5 h-1.5 rounded-sm bg-[var(--btn-save-bg)]',
                  key === 'top-right' && 'top-0.5 right-0.5',
                  key === 'top-left' && 'top-0.5 left-0.5',
                  key === 'bottom-right' && 'bottom-0.5 right-0.5',
                  key === 'bottom-left' && 'bottom-0.5 left-0.5',
                  key === 'top-center' && 'top-0.5 left-1/2 -translate-x-1/2',
                )} />
              </div>
              <span className="text-[9px] font-bold text-[var(--text-secondary)]">{TOAST_POSITION_LABELS[key]}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* 테이블 줄무늬 */}
      <Card>
        <div className="text-sm font-extrabold text-[var(--text-primary)] mb-1">테이블 줄무늬</div>
        <p className="text-[11px] text-[var(--text-muted)] mb-3">테이블의 짝수 행에 배경색을 표시합니다</p>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(TABLE_STRIPE_LABELS) as ThemeTableStripe[]).map((key) => (
            <button
              key={key}
              onClick={() => setTableStripe(key)}
              className={cn(
                'flex flex-col items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all',
                tableStripe === key
                  ? 'border-[var(--btn-save-bg)] bg-[var(--tab-active-bg)] shadow-md'
                  : 'border-[var(--border-default)] hover:border-[var(--border-strong)]',
              )}
            >
              <div className="w-full max-w-[80px] rounded overflow-hidden border border-[var(--border-default)]">
                {[0,1,2,3].map(i => (
                  <div key={i} className={cn('h-2', key === 'on' && i % 2 === 1 ? 'bg-[var(--bg-muted)]' : 'bg-[var(--bg-surface)]')} />
                ))}
              </div>
              <span className="text-[10px] font-bold text-[var(--text-secondary)]">{TABLE_STRIPE_LABELS[key]}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* 테이블 행 밀도 */}
      <Card>
        <div className="text-sm font-extrabold text-[var(--text-primary)] mb-1">테이블 행 밀도</div>
        <p className="text-[11px] text-[var(--text-muted)] mb-3">테이블 행의 패딩 크기를 변경합니다</p>
        <div className="grid grid-cols-3 gap-3">
          {(Object.keys(TABLE_DENSITY_LABELS) as ThemeTableDensity[]).map((key) => (
            <button
              key={key}
              onClick={() => setTableDensity(key)}
              className={cn(
                'flex flex-col items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all',
                tableDensity === key
                  ? 'border-[var(--btn-save-bg)] bg-[var(--tab-active-bg)] shadow-md'
                  : 'border-[var(--border-default)] hover:border-[var(--border-strong)]',
              )}
            >
              <div className="w-full max-w-[60px] rounded overflow-hidden border border-[var(--border-default)]">
                {[0,1,2].map(i => (
                  <div key={i} className={cn('bg-[var(--bg-surface)] border-b border-[var(--border-default)] last:border-b-0', key === 'compact' ? 'h-1.5' : key === 'comfortable' ? 'h-4' : 'h-2.5')} />
                ))}
              </div>
              <span className="text-[10px] font-bold text-[var(--text-secondary)]">{TABLE_DENSITY_LABELS[key]}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* 뱃지 모양 */}
      <Card>
        <div className="text-sm font-extrabold text-[var(--text-primary)] mb-1">뱃지 모양</div>
        <p className="text-[11px] text-[var(--text-muted)] mb-3">상태 뱃지의 형태를 변경합니다</p>
        <div className="grid grid-cols-3 gap-3">
          {(Object.keys(BADGE_SHAPE_LABELS) as ThemeBadgeShape[]).map((key) => (
            <button
              key={key}
              onClick={() => setBadgeShape(key)}
              className={cn(
                'flex flex-col items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all',
                badgeShape === key
                  ? 'border-[var(--btn-save-bg)] bg-[var(--tab-active-bg)] shadow-md'
                  : 'border-[var(--border-default)] hover:border-[var(--border-strong)]',
              )}
            >
              <span className={cn(
                'px-3 py-0.5 text-[10px] font-bold border bg-primary-50 text-primary-600 border-primary-200 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-800',
                key === 'pill' ? 'rounded-full' : key === 'rounded' ? 'rounded-[var(--radius-sm)]' : 'rounded-none',
              )}>진행중</span>
              <span className="text-[10px] font-bold text-[var(--text-secondary)]">{BADGE_SHAPE_LABELS[key]}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* 사이드바 너비 */}
      <Card>
        <div className="text-sm font-extrabold text-[var(--text-primary)] mb-1">사이드바 너비</div>
        <p className="text-[11px] text-[var(--text-muted)] mb-3">좌측 사이드바의 펼침 너비를 변경합니다</p>
        <div className="grid grid-cols-3 gap-3">
          {(Object.keys(SIDEBAR_WIDTH_LABELS) as ThemeSidebarWidth[]).map((key) => (
            <button
              key={key}
              onClick={() => setSidebarWidth(key)}
              className={cn(
                'flex flex-col items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all',
                sidebarWidth === key
                  ? 'border-[var(--btn-save-bg)] bg-[var(--tab-active-bg)] shadow-md'
                  : 'border-[var(--border-default)] hover:border-[var(--border-strong)]',
              )}
            >
              <div className="flex h-8 w-12 rounded border border-[var(--border-strong)] overflow-hidden bg-[var(--bg-muted)]">
                <div className={cn('bg-[var(--btn-save-bg)]/20 border-r border-[var(--border-strong)]', key === 'narrow' ? 'w-2.5' : key === 'wide' ? 'w-5' : 'w-3.5')} />
                <div className="flex-1" />
              </div>
              <span className="text-[10px] font-bold text-[var(--text-secondary)]">{SIDEBAR_WIDTH_LABELS[key]}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* 프로그레스 바 색상 */}
      <Card>
        <div className="text-sm font-extrabold text-[var(--text-primary)] mb-1">프로그레스 바 색상</div>
        <p className="text-[11px] text-[var(--text-muted)] mb-3">진행률 바의 기본 색상 모드를 변경합니다</p>
        <div className="grid grid-cols-3 gap-3">
          {(Object.keys(PROGRESS_COLOR_LABELS) as ThemeProgressColor[]).map((key) => (
            <button
              key={key}
              onClick={() => setProgressColor(key)}
              className={cn(
                'flex flex-col items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all',
                progressColor === key
                  ? 'border-[var(--btn-save-bg)] bg-[var(--tab-active-bg)] shadow-md'
                  : 'border-[var(--border-default)] hover:border-[var(--border-strong)]',
              )}
            >
              <div className="w-full max-w-[60px] h-2 rounded-full bg-[var(--progress-track)] overflow-hidden">
                <div className={cn('h-full rounded-full w-2/3', key === 'auto' ? 'bg-[var(--color-warning-500)]' : key === 'primary' ? 'bg-[var(--progress-fill)]' : 'bg-[var(--color-success-500)]')} />
              </div>
              <span className="text-[10px] font-bold text-[var(--text-secondary)]">{PROGRESS_COLOR_LABELS[key]}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* ── 텍스트 스타일 가이드 ── */}
      <Card>
        <div className="flex items-center justify-between mb-1">
          <div className="text-sm font-extrabold text-[var(--text-primary)]">텍스트 스타일 가이드</div>
          <button
            onClick={() => { resetTypo(); addToast('success', '텍스트 스타일이 기본값으로 복원되었습니다') }}
            className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-all cursor-pointer"
          >
            <RotateCcw size={11} /> 전체 초기화
          </button>
        </div>
        <p className="text-[11px] text-[var(--text-muted)] mb-4">각 항목의 크기와 두께를 변경하면 시스템 전체에 즉시 반영됩니다</p>

        <div className="space-y-1">
          {(Object.keys(TYPO_CATEGORY_LABELS) as TypoCategory[]).map((cat) => {
            const token = typography[cat]
            const def = DEFAULT_TYPO[cat]
            const isModified = token.size !== def.size || token.weight !== def.weight || token.color !== def.color

            return (
              <div key={cat} className={cn(
                'flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all',
                isModified ? 'bg-[var(--tab-active-bg)] border border-[var(--tab-active-color)]/10' : 'border border-transparent hover:bg-[var(--bg-muted)]',
              )}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold text-[var(--text-secondary)]">{TYPO_CATEGORY_LABELS[cat]}</span>
                    {isModified && (
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">수정됨</span>
                    )}
                  </div>
                  <span style={{ fontSize: token.size, fontWeight: token.weight, color: token.color }} className="block truncate">
                    {TYPO_CATEGORY_LABELS[cat]} 미리보기
                  </span>
                </div>
                <select
                  value={token.size}
                  onChange={(e) => setTypo(cat, { ...token, size: e.target.value })}
                  className="text-[10px] font-mono font-bold px-2 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] cursor-pointer outline-none w-[70px]"
                >
                  {TYPO_SIZE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <select
                  value={token.weight}
                  onChange={(e) => setTypo(cat, { ...token, weight: Number(e.target.value) })}
                  className="text-[10px] font-mono font-bold px-2 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] cursor-pointer outline-none w-[90px]"
                >
                  {TYPO_WEIGHT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <select
                  value={token.color}
                  onChange={(e) => setTypo(cat, { ...token, color: e.target.value })}
                  className="text-[10px] font-bold px-2 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] cursor-pointer outline-none w-[85px]"
                >
                  {TYPO_COLOR_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                {isModified && (
                  <button
                    onClick={() => setTypo(cat, { ...def })}
                    className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer shrink-0"
                    title="기본값 복원"
                  >
                    <RotateCcw size={12} />
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-5 p-3 rounded-lg bg-[var(--bg-muted)] border border-[var(--border-default)]">
          <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">CSS 변수 사용법</div>
          <code className="text-[11px] text-[var(--text-secondary)] block leading-relaxed font-mono">
            font-size: var(--typo-page-title-size);<br/>
            font-weight: var(--typo-page-title-weight);<br/>
            /* page-title | page-subtitle | section-title | card-title |<br/>
            &nbsp;&nbsp; menu | menu-group | tab | btn | badge | body | caption | input | toast */
          </code>
        </div>
      </Card>

      {/* ── 컴포넌트 프리뷰 ── */}
      <Card>
        <div className="text-sm font-extrabold text-[var(--text-primary)] mb-1">컴포넌트 프리뷰</div>
        <p className="text-[11px] text-[var(--text-muted)] mb-4">위의 설정이 적용된 실시간 미리보기입니다</p>

        {/* 버튼 */}
        <div className="mb-5">
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">버튼</span>
          <div className="flex flex-wrap gap-2">
            <Button variant="save" size="sm">저장</Button>
            <Button variant="edit" size="sm">수정</Button>
            <Button variant="delete" size="sm">삭제</Button>
            <Button variant="cancel" size="sm">취소</Button>
            <Button variant="search" size="sm">검색</Button>
            <Button variant="confirm" size="sm">확인</Button>
            <Button variant="upload" size="sm">업로드</Button>
            <Button variant="download" size="sm">다운로드</Button>
            <Button variant="add" size="sm">추가</Button>
            <Button variant="approve" size="sm">승인</Button>
            <Button variant="reject" size="sm">반려</Button>
            <Button variant="ghost" size="sm">Ghost</Button>
            <Button variant="outline" size="sm">Outline</Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <Button variant="save" size="sm" loading>로딩중</Button>
            <Button variant="save" size="sm" disabled>비활성</Button>
          </div>
        </div>

        {/* 뱃지 */}
        <div className="mb-5">
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">뱃지 (상태)</span>
          <div className="flex flex-wrap gap-2">
            <Badge status="waiting" dot />
            <Badge status="progress" dot />
            <Badge status="complete" dot />
            <Badge status="delay" dot />
          </div>
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 mt-3 block">뱃지 (분류)</span>
          <div className="flex flex-wrap gap-2">
            <Badge category="news" />
            <Badge category="youtube" />
            <Badge category="blog" />
            <Badge category="website" />
          </div>
        </div>

        {/* 진행률 */}
        <div className="mb-5">
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">진행률</span>
          <div className="space-y-2">
            <Progress value={20} showLabel />
            <Progress value={55} showLabel />
            <Progress value={85} showLabel />
          </div>
        </div>

        {/* 입력 요소 */}
        <div className="mb-5">
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">입력 요소</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="텍스트 입력" placeholder="내용을 입력하세요" />
            <Input label="에러 상태" placeholder="필수 항목" error="필수 항목을 입력해주세요" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <DatePickerPreview />
            <SelectPreview />
          </div>
        </div>
      </Card>
    </div>
  )
}

/* 탭 프리뷰 헬퍼 */
function TabsPreview({ style }: { style: 'underline' | 'box' | 'pill' }) {
  const [active, setActive] = useState('all')
  return (
    <div>
      <span className="text-[10px] text-[var(--text-muted)] mb-1 block">{style}</span>
      <Tabs
        items={[
          { key: 'all', label: '전체', count: 12 },
          { key: 'progress', label: '진행중', count: 5 },
          { key: 'done', label: '완료', count: 7 },
        ]}
        activeKey={active}
        onChange={setActive}
        style={style}
      />
    </div>
  )
}

/* 날짜 피커 프리뷰 (인라인 캘린더 항상 표시) */
function DatePickerPreview() {
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
  const [date, setDate] = useState(todayStr)
  const [viewYear] = useState(today.getFullYear())
  const [viewMonth] = useState(today.getMonth())

  const WEEK = ['일','월','화','수','목','금','토']
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const prevDays = new Date(viewYear, viewMonth, 0).getDate()

  const cells: { day: number; current: boolean }[] = []
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevDays - i, current: false })
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, current: true })
  while (cells.length % 7 !== 0) cells.push({ day: cells.length - daysInMonth - firstDay + 1, current: false })

  const selectedDay = date ? parseInt(date.split('-')[2]) : -1
  const dpStyle = useThemeStore((s) => s.datePickerStyle) || 'default'

  const panelR = { default: 'rounded-2xl', modern: 'rounded-xl border-t-4 border-t-primary-500', minimal: 'rounded-lg', bubble: 'rounded-3xl' }[dpStyle]
  const dayR = { default: 'rounded-xl', modern: 'rounded-lg', minimal: 'rounded-none', bubble: 'rounded-full' }[dpStyle]

  return (
    <div>
      <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">날짜 선택</label>
      <DatePicker value={date} onChange={setDate} placeholder="날짜를 선택하세요" />

      {/* 인라인 캘린더 */}
      <div className={cn('mt-3 bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-lg p-4 w-[290px]', panelR)}>
        <div className="flex items-center justify-center mb-3">
          <span className="text-[13px] font-extrabold text-[var(--text-primary)] tracking-tight">
            {viewYear}년 {String(viewMonth + 1).padStart(2, '0')}월
          </span>
        </div>
        <div className="grid grid-cols-7 mb-1">
          {WEEK.map((w, i) => (
            <div key={w} className={`text-center text-[11px] font-bold py-1 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-[var(--text-muted)]'}`}>{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((cell, idx) => {
            const dayOfWeek = idx % 7
            const isToday = cell.current && cell.day === today.getDate()
            const isSelected = cell.current && cell.day === selectedDay
            return (
              <div
                key={idx}
                className={cn(
                  'w-full aspect-square flex items-center justify-center text-[12px] font-medium transition-all',
                  dayR,
                  !cell.current ? 'text-[var(--text-muted)]/30'
                  : isSelected ? 'bg-primary-500 text-white font-bold shadow-md'
                  : isToday ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-bold ring-1 ring-primary-300/50'
                  : dayOfWeek === 0 ? 'text-red-400'
                  : dayOfWeek === 6 ? 'text-blue-400'
                  : 'text-[var(--text-primary)]',
                )}
              >
                {cell.day}
              </div>
            )
          })}
        </div>
        <div className="flex justify-between mt-3 pt-3 border-t border-[var(--border-default)]">
          <span className={cn('px-3 py-1.5 text-[11px] font-bold text-[var(--text-muted)]', dayR)}>지우기</span>
          <span className={cn('px-3 py-1.5 text-[11px] font-bold text-primary-500', dayR)}>오늘</span>
        </div>
      </div>
    </div>
  )
}

/* 셀렉트 프리뷰 */
function SelectPreview() {
  const [val, setVal] = useState('')
  return (
    <div>
      <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">드롭다운</label>
      <CustomSelect
        value={val}
        onChange={setVal}
        options={[
          { value: 'design', label: '디자인팀' },
          { value: 'dev', label: '개발팀' },
          { value: 'marketing', label: '마케팅팀' },
        ]}
        placeholder="부서를 선택하세요"
      />
    </div>
  )
}

/* ══════════════════════════════════════════════
   거래처구분 패널
   ══════════════════════════════════════════════ */
function BizCategoryPanel() {
  const { bizCategories, addBizCategory, updateBizCategory, deleteBizCategory, reorderItems } = useSettingsStore()
  return (
    <CrudListPanel
      title="거래처구분"
      items={bizCategories.map(c => ({ id: c.id, name: c.name }))}
      onAdd={(name) => addBizCategory(name)}
      onUpdate={(id, name) => updateBizCategory(id, name)}
      onDelete={deleteBizCategory}
      onReorder={(ids) => reorderItems('bizCategories', ids)}
      placeholder="새 거래처구분 입력 (예: 일반거래처, 협력업체)"
      color="#14b8a6"
    />
  )
}

