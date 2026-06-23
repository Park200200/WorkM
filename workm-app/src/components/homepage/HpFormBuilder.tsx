import { useState, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { getItem, setItem } from '../../utils/storage'
import {
  Plus, Trash2, X, GripVertical, ChevronLeft, Save, Eye, Palette,
  Type, AlignLeft, FileText, ClipboardList, Shield, Layers, Settings2,
  PenLine, Copy, MoreHorizontal, ChevronDown, ChevronUp, Move,
} from 'lucide-react'

/* ═══════════════════════════════════════════
   타입 정의
   ═══════════════════════════════════════════ */
type SectionType = 'basic_info' | 'category' | 'extra_info' | 'privacy_consent'
type FieldType = 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'date' | 'phone' | 'email'

interface FormField {
  id: string; label: string; type: FieldType
  placeholder?: string; required: boolean; options?: string[]
}
interface FormSection {
  id: string; type: SectionType
  titleText: string; titleColor: string; titleSize: number
  descText: string; descSize: number
  fields: FormField[]
}
interface WorkflowStep { id: string; label: string; color: string }
interface FormTemplate {
  id: string; name: string; createdAt: string
  bgColor: string; title: string; titleSize: number; titleColor: string
  description: string; descColor: string
  sections: FormSection[]
  managedFields: string[]
  workflow: WorkflowStep[]
}

const STORAGE_KEY = 'hp_form_templates'
const uid = () => Math.random().toString(36).slice(2, 10)

const SECTION_TYPES: { type: SectionType; label: string; icon: any; desc: string }[] = [
  { type: 'basic_info', label: '기본정보', icon: ClipboardList, desc: '이름, 연락처 등 기본 입력 항목' },
  { type: 'category', label: '접수분야', icon: Layers, desc: '분야 선택 (체크박스/라디오)' },
  { type: 'extra_info', label: '추가정보', icon: AlignLeft, desc: '추가 문의, 메모 등 자유 입력' },
  { type: 'privacy_consent', label: '개인정보 수집 및 동의', icon: Shield, desc: '동의 체크박스 자동 생성' },
]

const FIELD_TYPES: { type: FieldType; label: string }[] = [
  { type: 'text', label: '텍스트' }, { type: 'textarea', label: '장문 텍스트' },
  { type: 'select', label: '선택 (드롭다운)' }, { type: 'checkbox', label: '체크박스' },
  { type: 'radio', label: '라디오' }, { type: 'file', label: '첨부파일' },
  { type: 'date', label: '날짜' }, { type: 'phone', label: '전화번호' }, { type: 'email', label: '이메일' },
]

const DEFAULT_WORKFLOW: WorkflowStep[] = [
  { id: uid(), label: '접수완료', color: '#22c55e' },
  { id: uid(), label: '검토중', color: '#f59e0b' },
  { id: uid(), label: '계약준비', color: '#3b82f6' },
  { id: uid(), label: '계약완료', color: '#8b5cf6' },
  { id: uid(), label: '취소', color: '#ef4444' },
]

function newTemplate(): FormTemplate {
  return {
    id: uid(), name: '새 신청서', createdAt: new Date().toISOString().slice(0, 10),
    bgColor: '#2563eb', title: '신청서', titleSize: 28, titleColor: '#ffffff',
    description: '아래 양식을 작성해 주세요.', descColor: '#ffffffcc',
    sections: [], managedFields: [], workflow: [...DEFAULT_WORKFLOW.map(w => ({ ...w, id: uid() }))],
  }
}

const inputCls = 'w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors'
const btnCls = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all cursor-pointer'

/* ═══════════════════════════════════════════
   컬러 피커 인라인
   ═══════════════════════════════════════════ */
function ColorPick({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-bold text-[var(--text-muted)] min-w-[70px]">{label}</span>
      <div className="relative">
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          className="w-7 h-7 rounded-lg border border-[var(--border-default)] cursor-pointer p-0 bg-transparent" />
      </div>
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        className="w-[80px] px-2 py-1 rounded-md border border-[var(--border-default)] bg-[var(--bg-muted)] text-[11px] text-[var(--text-secondary)] font-mono outline-none" />
    </div>
  )
}

/* ═══════════════════════════════════════════
   사이즈 셀렉트
   ═══════════════════════════════════════════ */
function SizePick({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const sizes = [10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40]
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-bold text-[var(--text-muted)] min-w-[70px]">{label}</span>
      <select value={value} onChange={e => onChange(Number(e.target.value))}
        className="px-2 py-1 rounded-md border border-[var(--border-default)] bg-[var(--bg-muted)] text-[12px] text-[var(--text-primary)] outline-none cursor-pointer">
        {sizes.map(s => <option key={s} value={s}>{s}px</option>)}
      </select>
    </div>
  )
}

/* ═══════════════════════════════════════════
   실시간 미리보기
   ═══════════════════════════════════════════ */
function FormPreview({ tpl }: { tpl: FormTemplate }) {
  const sectionTypeLabel = (t: SectionType) =>
    SECTION_TYPES.find(s => s.type === t)?.label || t
  return (
    <div className="bg-[var(--bg-muted)] rounded-xl overflow-hidden shadow-inner h-full">
      <div className="max-w-[480px] mx-auto pb-8">
        {/* 헤더 */}
        <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${tpl.bgColor}, ${tpl.bgColor}dd, ${tpl.bgColor}99)` }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div className="relative text-center py-10 px-6">
            <div style={{ fontSize: tpl.titleSize, color: tpl.titleColor }} className="font-extrabold tracking-tight leading-tight">
              {tpl.title || '신청서 타이틀'}
            </div>
            {tpl.description && (
              <div style={{ color: tpl.descColor }} className="mt-2 text-[13px] leading-relaxed whitespace-pre-line">
                {tpl.description}
              </div>
            )}
          </div>
        </div>

        {/* 섹션들 */}
        <div className="px-4 space-y-4 mt-4">
          {tpl.sections.length === 0 && (
            <div className="bg-white dark:bg-[var(--bg-surface)] rounded-xl p-8 text-center text-[var(--text-muted)] text-[13px]">
              왼쪽에서 [+ 항목 추가]로 섹션을 추가하세요
            </div>
          )}
          {tpl.sections.map(sec => (
            <div key={sec.id} className="bg-white dark:bg-[var(--bg-surface)] rounded-xl p-5 shadow-sm border border-[var(--border-default)]">
              {/* 섹션 헤더 */}
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-black" style={{ background: sec.titleColor }}>
                  {sec.type === 'privacy_consent' ? '🔒' : '📋'}
                </div>
                <div style={{ fontSize: sec.titleSize, color: sec.titleColor }} className="font-extrabold">
                  {sec.titleText || sectionTypeLabel(sec.type)}
                </div>
              </div>
              {sec.descText && (
                <div style={{ fontSize: sec.descSize }} className="text-[var(--text-muted)] mb-3 ml-7">
                  {sec.descText}
                </div>
              )}

              {/* 개인정보 동의 */}
              {sec.type === 'privacy_consent' ? (
                <div className="bg-[var(--bg-muted)] rounded-lg p-4 mt-2">
                  <div className="text-[12px] font-bold text-[var(--text-secondary)] mb-2">개인정보 수집 및 이용에 동의합니다.</div>
                  <div className="text-[10px] text-[var(--text-muted)] leading-relaxed mb-3">
                    수집항목: 성명, 연락처, 이메일<br/>
                    수집목적: 신청 접수 및 안내<br/>
                    보유기간: 접수일로부터 1년
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded accent-primary-500" readOnly />
                    <span className="text-[12px] font-bold text-[var(--text-primary)]">동의합니다</span>
                  </label>
                </div>
              ) : (
                /* 일반 필드들 */
                <div className="space-y-3 ml-7">
                  {sec.fields.length === 0 && (
                    <div className="text-[11px] text-[var(--text-muted)] py-2">필드를 추가해주세요</div>
                  )}
                  {sec.fields.map(f => (
                    <div key={f.id}>
                      <label className="text-[11px] font-bold text-[var(--text-secondary)] mb-1 block">
                        {f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}
                      </label>
                      {f.type === 'textarea' ? (
                        <textarea placeholder={f.placeholder} className={inputCls + ' h-16 resize-none'} readOnly />
                      ) : f.type === 'select' ? (
                        <select className={inputCls}>
                          <option>{f.placeholder || '선택해주세요'}</option>
                          {f.options?.map((o, i) => <option key={i}>{o}</option>)}
                        </select>
                      ) : f.type === 'checkbox' || f.type === 'radio' ? (
                        <div className="flex flex-wrap gap-3">
                          {(f.options || ['옵션1']).map((o, i) => (
                            <label key={i} className="flex items-center gap-1.5 text-[12px] text-[var(--text-secondary)]">
                              <input type={f.type} name={f.id} className="accent-primary-500" readOnly /> {o}
                            </label>
                          ))}
                        </div>
                      ) : f.type === 'file' ? (
                        <div className="border-2 border-dashed border-[var(--border-default)] rounded-lg p-4 text-center text-[var(--text-muted)] text-[11px]">
                          📎 파일을 드래그하거나 클릭하여 업로드
                        </div>
                      ) : (
                        <input type={f.type === 'phone' ? 'tel' : f.type === 'email' ? 'email' : f.type === 'date' ? 'date' : 'text'}
                          placeholder={f.placeholder} className={inputCls} readOnly />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* 신청하기 버튼 */}
          {tpl.sections.length > 0 && (
            <button className="w-full py-3 rounded-xl text-white font-extrabold text-[14px] shadow-lg transition-all"
              style={{ background: tpl.bgColor }}>
              신청하기
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   필드 편집 행
   ═══════════════════════════════════════════ */
function FieldRow({ field, onUpdate, onDelete, onMoveUp, onMoveDown, isFirst, isLast }:
  { field: FormField; onUpdate: (f: FormField) => void; onDelete: () => void; onMoveUp: () => void; onMoveDown: () => void; isFirst: boolean; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const hasOptions = ['select', 'checkbox', 'radio'].includes(field.type)
  return (
    <div className="bg-[var(--bg-muted)] rounded-lg border border-[var(--border-default)]">
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="flex flex-col gap-0.5">
          <button onClick={onMoveUp} disabled={isFirst} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 cursor-pointer disabled:cursor-default"><ChevronUp size={12} /></button>
          <button onClick={onMoveDown} disabled={isLast} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 cursor-pointer disabled:cursor-default"><ChevronDown size={12} /></button>
        </div>
        <input value={field.label} onChange={e => onUpdate({ ...field, label: e.target.value })}
          className="flex-1 px-2 py-1 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] text-[12px] font-bold text-[var(--text-primary)] outline-none" placeholder="필드 라벨" />
        <select value={field.type} onChange={e => onUpdate({ ...field, type: e.target.value as FieldType })}
          className="px-2 py-1 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] text-[11px] text-[var(--text-secondary)] outline-none cursor-pointer">
          {FIELD_TYPES.map(ft => <option key={ft.type} value={ft.type}>{ft.label}</option>)}
        </select>
        <label className="flex items-center gap-1 text-[10px] font-bold text-[var(--text-muted)] cursor-pointer whitespace-nowrap">
          <input type="checkbox" checked={field.required} onChange={e => onUpdate({ ...field, required: e.target.checked })} className="accent-primary-500" />
          필수
        </label>
        <button onClick={() => setExpanded(!expanded)} className="p-1 rounded hover:bg-[var(--bg-surface)] text-[var(--text-muted)] cursor-pointer">
          <MoreHorizontal size={14} />
        </button>
        <button onClick={onDelete} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--text-muted)] hover:text-red-500 cursor-pointer">
          <Trash2 size={13} />
        </button>
      </div>
      {expanded && (
        <div className="px-3 pb-3 pt-1 space-y-2 border-t border-[var(--border-default)]">
          <input value={field.placeholder || ''} onChange={e => onUpdate({ ...field, placeholder: e.target.value })}
            placeholder="플레이스홀더 텍스트" className={inputCls + ' text-[11px]'} />
          {hasOptions && (
            <div>
              <div className="text-[10px] font-bold text-[var(--text-muted)] mb-1">옵션 (줄바꿈으로 구분)</div>
              <textarea value={(field.options || []).join('\n')} onChange={e => onUpdate({ ...field, options: e.target.value.split('\n').filter(Boolean) })}
                className={inputCls + ' text-[11px] h-20'} placeholder="옵션1&#10;옵션2&#10;옵션3" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════
   섹션 편집 패널
   ═══════════════════════════════════════════ */
function SectionEditor({ section, onUpdate, onDelete, onMoveUp, onMoveDown, isFirst, isLast }:
  { section: FormSection; onUpdate: (s: FormSection) => void; onDelete: () => void; onMoveUp: () => void; onMoveDown: () => void; isFirst: boolean; isLast: boolean }) {
  const [collapsed, setCollapsed] = useState(false)
  const typeLabel = SECTION_TYPES.find(s => s.type === section.type)?.label || ''
  const TypeIcon = SECTION_TYPES.find(s => s.type === section.type)?.icon || FileText

  const addField = () => {
    const newField: FormField = { id: uid(), label: '새 항목', type: 'text', placeholder: '', required: false }
    onUpdate({ ...section, fields: [...section.fields, newField] })
  }
  const updateField = (idx: number, f: FormField) => {
    const fields = [...section.fields]; fields[idx] = f; onUpdate({ ...section, fields })
  }
  const deleteField = (idx: number) => {
    onUpdate({ ...section, fields: section.fields.filter((_, i) => i !== idx) })
  }
  const moveField = (idx: number, dir: -1 | 1) => {
    const fields = [...section.fields]; const t = fields[idx]; fields[idx] = fields[idx + dir]; fields[idx + dir] = t
    onUpdate({ ...section, fields })
  }

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-[var(--bg-muted)] cursor-pointer" onClick={() => setCollapsed(!collapsed)}>
        <div className="flex flex-col gap-0.5 mr-1" onClick={e => e.stopPropagation()}>
          <button onClick={onMoveUp} disabled={isFirst} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 cursor-pointer disabled:cursor-default"><ChevronUp size={11} /></button>
          <button onClick={onMoveDown} disabled={isLast} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 cursor-pointer disabled:cursor-default"><ChevronDown size={11} /></button>
        </div>
        <TypeIcon size={14} className="text-primary-500 shrink-0" />
        <span className="text-[12px] font-extrabold text-[var(--text-primary)] flex-1">{section.titleText || typeLabel}</span>
        <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-surface)] px-2 py-0.5 rounded-full">
          {section.type === 'privacy_consent' ? '자동' : `${section.fields.length}개 필드`}
        </span>
        <button onClick={e => { e.stopPropagation(); onDelete() }} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--text-muted)] hover:text-red-500 cursor-pointer">
          <Trash2 size={13} />
        </button>
        {collapsed ? <ChevronDown size={14} className="text-[var(--text-muted)]" /> : <ChevronUp size={14} className="text-[var(--text-muted)]" />}
      </div>

      {!collapsed && (
        <div className="p-3 space-y-3">
          {/* 스타일 설정 */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] font-bold text-[var(--text-muted)] mb-1 block">타이틀</span>
              <input value={section.titleText} onChange={e => onUpdate({ ...section, titleText: e.target.value })}
                className={inputCls + ' text-[12px]'} placeholder="섹션 타이틀" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[var(--text-muted)] mb-1 block">설명</span>
              <input value={section.descText} onChange={e => onUpdate({ ...section, descText: e.target.value })}
                className={inputCls + ' text-[12px]'} placeholder="섹션 설명" />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <ColorPick label="타이틀 색" value={section.titleColor} onChange={v => onUpdate({ ...section, titleColor: v })} />
            <SizePick label="타이틀 크기" value={section.titleSize} onChange={v => onUpdate({ ...section, titleSize: v })} />
            <SizePick label="설명 크기" value={section.descSize} onChange={v => onUpdate({ ...section, descSize: v })} />
          </div>

          {/* 필드 목록 (개인정보 동의 제외) */}
          {section.type !== 'privacy_consent' && (
            <>
              <div className="border-t border-[var(--border-default)] pt-2">
                <div className="text-[10px] font-bold text-[var(--text-muted)] mb-2">📝 입력 필드</div>
                <div className="space-y-1.5">
                  {section.fields.map((f, i) => (
                    <FieldRow key={f.id} field={f} onUpdate={nf => updateField(i, nf)} onDelete={() => deleteField(i)}
                      onMoveUp={() => moveField(i, -1)} onMoveDown={() => moveField(i, 1)}
                      isFirst={i === 0} isLast={i === section.fields.length - 1} />
                  ))}
                </div>
                <button onClick={addField}
                  className={btnCls + ' mt-2 border border-dashed border-[var(--border-default)] text-[var(--text-muted)] hover:text-primary-500 hover:border-primary-400 w-full justify-center'}>
                  <Plus size={13} /> 필드 추가
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════
   메인 컴포넌트: HpFormBuilder
   ═══════════════════════════════════════════ */
export function HpFormBuilder() {
  const [templates, setTemplates] = useState<FormTemplate[]>(() => getItem<FormTemplate[]>(STORAGE_KEY, []))
  const [editId, setEditId] = useState<string | null>(null)
  const [showAddSection, setShowAddSection] = useState(false)
  const [activePanel, setActivePanel] = useState<'basic' | 'sections' | 'management'>('basic')

  const save = useCallback((list: FormTemplate[]) => { setTemplates(list); setItem(STORAGE_KEY, list) }, [])

  const editing = useMemo(() => templates.find(t => t.id === editId) || null, [templates, editId])

  const updateEditing = useCallback((patch: Partial<FormTemplate>) => {
    if (!editId) return
    save(templates.map(t => t.id === editId ? { ...t, ...patch } : t))
  }, [editId, templates, save])

  const createNew = () => {
    const t = newTemplate()
    const list = [...templates, t]
    save(list); setEditId(t.id)
  }

  const deleteTemplate = (id: string) => {
    if (!confirm('이 신청서 양식을 삭제하시겠습니까?')) return
    save(templates.filter(t => t.id !== id))
    if (editId === id) setEditId(null)
  }

  const duplicateTemplate = (t: FormTemplate) => {
    const dup = { ...t, id: uid(), name: t.name + ' (사본)', createdAt: new Date().toISOString().slice(0, 10),
      sections: t.sections.map(s => ({ ...s, id: uid(), fields: s.fields.map(f => ({ ...f, id: uid() })) })),
      workflow: t.workflow.map(w => ({ ...w, id: uid() })),
    }
    save([...templates, dup])
  }

  /* 섹션 조작 */
  const addSection = (type: SectionType) => {
    if (!editing) return
    const label = SECTION_TYPES.find(s => s.type === type)!.label
    const sec: FormSection = {
      id: uid(), type,
      titleText: label, titleColor: '#1e40af', titleSize: 16,
      descText: type === 'privacy_consent' ? '' : '', descSize: 12,
      fields: type === 'basic_info' ? [
        { id: uid(), label: '이름/단체명', type: 'text', placeholder: '이름 또는 단체명을 입력하세요', required: true },
        { id: uid(), label: '담당자', type: 'text', placeholder: '담당자명', required: true },
        { id: uid(), label: '연락처', type: 'phone', placeholder: '010-0000-0000', required: true },
        { id: uid(), label: '이메일', type: 'email', placeholder: 'example@email.com', required: false },
      ] : type === 'category' ? [
        { id: uid(), label: '접수 분야', type: 'checkbox', required: true, options: ['분야1', '분야2', '분야3'] },
      ] : type === 'extra_info' ? [
        { id: uid(), label: '추가 문의사항', type: 'textarea', placeholder: '추가 문의사항을 입력해주세요', required: false },
      ] : [],
    }
    updateEditing({ sections: [...editing.sections, sec] })
    setShowAddSection(false)
  }

  const updateSection = (idx: number, sec: FormSection) => {
    if (!editing) return
    const arr = [...editing.sections]; arr[idx] = sec; updateEditing({ sections: arr })
  }
  const deleteSection = (idx: number) => {
    if (!editing) return
    updateEditing({ sections: editing.sections.filter((_, i) => i !== idx) })
  }
  const moveSection = (idx: number, dir: -1 | 1) => {
    if (!editing) return
    const arr = [...editing.sections]; const t = arr[idx]; arr[idx] = arr[idx + dir]; arr[idx + dir] = t
    updateEditing({ sections: arr })
  }

  /* 워크플로우 조작 */
  const addWorkflowStep = () => {
    if (!editing) return
    updateEditing({ workflow: [...editing.workflow, { id: uid(), label: '새 단계', color: '#6b7280' }] })
  }
  const updateWorkflowStep = (idx: number, patch: Partial<WorkflowStep>) => {
    if (!editing) return
    const arr = [...editing.workflow]; arr[idx] = { ...arr[idx], ...patch }; updateEditing({ workflow: arr })
  }
  const deleteWorkflowStep = (idx: number) => {
    if (!editing) return
    updateEditing({ workflow: editing.workflow.filter((_, i) => i !== idx) })
  }

  /* 관리필드 토글 */
  const allFields = useMemo(() => {
    if (!editing) return []
    return editing.sections.flatMap(s => s.fields.map(f => ({ ...f, sectionTitle: s.titleText })))
  }, [editing])

  const toggleManagedField = (fieldId: string) => {
    if (!editing) return
    const set = new Set(editing.managedFields)
    set.has(fieldId) ? set.delete(fieldId) : set.add(fieldId)
    updateEditing({ managedFields: Array.from(set) })
  }

  /* ═══════════════════════════════════════════
     목록 뷰
     ═══════════════════════════════════════════ */
  if (!editing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PenLine size={20} className="text-primary-500" />
            <h2 className="text-lg font-extrabold text-[var(--text-primary)]">신청서 양식 관리</h2>
          </div>
          <button onClick={createNew}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-500 text-white text-[12px] font-bold hover:bg-primary-600 transition-all cursor-pointer shadow-sm">
            <Plus size={14} /> 새 신청서 만들기
          </button>
        </div>

        {templates.length === 0 ? (
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-12 text-center">
            <div className="text-4xl mb-3">📋</div>
            <div className="text-[14px] font-bold text-[var(--text-secondary)] mb-1">아직 만든 신청서가 없습니다</div>
            <div className="text-[12px] text-[var(--text-muted)]">새 신청서를 만들어 양식을 디자인해보세요</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {templates.map(t => (
              <div key={t.id}
                className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => setEditId(t.id)}>
                {/* 미니 프리뷰 헤더 */}
                <div className="h-16 relative" style={{ background: `linear-gradient(135deg, ${t.bgColor}, ${t.bgColor}cc)` }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-extrabold text-[14px] drop-shadow">{t.title}</span>
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[13px] font-extrabold text-[var(--text-primary)]">{t.name}</div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      <button onClick={() => duplicateTemplate(t)} className="p-1 rounded hover:bg-[var(--bg-muted)] text-[var(--text-muted)] cursor-pointer" title="복제"><Copy size={13} /></button>
                      <button onClick={() => deleteTemplate(t.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--text-muted)] hover:text-red-500 cursor-pointer" title="삭제"><Trash2 size={13} /></button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                    <span>섹션 {t.sections.length}개</span>
                    <span>•</span>
                    <span>필드 {t.sections.reduce((a, s) => a + s.fields.length, 0)}개</span>
                    <span>•</span>
                    <span>{t.createdAt}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  /* ═══════════════════════════════════════════
     빌더 뷰
     ═══════════════════════════════════════════ */
  return (
    <div className="space-y-3">
      {/* 상단 바 */}
      <div className="flex items-center gap-3">
        <button onClick={() => setEditId(null)}
          className="flex items-center gap-1 text-[12px] font-bold text-[var(--text-muted)] hover:text-primary-500 cursor-pointer transition-colors">
          <ChevronLeft size={16} /> 목록으로
        </button>
        <input value={editing.name} onChange={e => updateEditing({ name: e.target.value })}
          className="flex-1 px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[14px] font-extrabold text-[var(--text-primary)] outline-none focus:border-primary-500" />
        <button onClick={() => { save(templates); alert('저장되었습니다!') }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-500 text-white text-[12px] font-bold hover:bg-primary-600 transition-all cursor-pointer shadow-sm">
          <Save size={14} /> 저장
        </button>
      </div>

      {/* 2단 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ minHeight: 'calc(100vh - 180px)' }}>

        {/* ── 왼쪽: 설정 패널 ── */}
        <div className="space-y-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
          {/* 패널 탭 */}
          <div className="bg-[var(--bg-muted)] rounded-xl p-1 inline-flex gap-1">
            {([
              { key: 'basic', label: '기본 설정', icon: Palette },
              { key: 'sections', label: '섹션(항목)', icon: Layers },
              { key: 'management', label: '관리 설정', icon: Settings2 },
            ] as const).map(tab => (
              <button key={tab.key} onClick={() => setActivePanel(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  activePanel === tab.key
                    ? 'bg-[var(--bg-surface)] shadow-md text-[var(--text-primary)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}>
                <tab.icon size={13} /> {tab.label}
              </button>
            ))}
          </div>

          {/* 기본 설정 */}
          {activePanel === 'basic' && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4 space-y-3">
              <div className="text-[12px] font-extrabold text-[var(--text-primary)] flex items-center gap-1.5 mb-1">
                <Palette size={14} className="text-primary-500" /> 기본 설정
              </div>
              <ColorPick label="바탕 칼라" value={editing.bgColor} onChange={v => updateEditing({ bgColor: v })} />
              <div>
                <span className="text-[10px] font-bold text-[var(--text-muted)] mb-1 block">타이틀 텍스트</span>
                <input value={editing.title} onChange={e => updateEditing({ title: e.target.value })}
                  className={inputCls} placeholder="신청서 타이틀" />
              </div>
              <div className="flex flex-wrap gap-3">
                <SizePick label="타이틀 크기" value={editing.titleSize} onChange={v => updateEditing({ titleSize: v })} />
                <ColorPick label="타이틀 색" value={editing.titleColor} onChange={v => updateEditing({ titleColor: v })} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[var(--text-muted)] mb-1 block">설명 텍스트</span>
                <textarea value={editing.description} onChange={e => updateEditing({ description: e.target.value })}
                  className={inputCls + ' h-20 resize-none'} placeholder="신청서 설명" />
              </div>
              <ColorPick label="설명 색" value={editing.descColor} onChange={v => updateEditing({ descColor: v })} />
            </div>
          )}

          {/* 섹션(항목) */}
          {activePanel === 'sections' && (
            <div className="space-y-2">
              <div className="text-[12px] font-extrabold text-[var(--text-primary)] flex items-center gap-1.5">
                <Layers size={14} className="text-primary-500" /> 섹션 목록
                <span className="text-[10px] text-[var(--text-muted)] font-normal ml-1">{editing.sections.length}개</span>
              </div>
              {editing.sections.map((sec, i) => (
                <SectionEditor key={sec.id} section={sec}
                  onUpdate={s => updateSection(i, s)} onDelete={() => deleteSection(i)}
                  onMoveUp={() => moveSection(i, -1)} onMoveDown={() => moveSection(i, 1)}
                  isFirst={i === 0} isLast={i === editing.sections.length - 1} />
              ))}
              <button onClick={() => setShowAddSection(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-[var(--border-default)] text-[var(--text-muted)] hover:text-primary-500 hover:border-primary-400 transition-all cursor-pointer text-[12px] font-bold">
                <Plus size={16} /> 항목 추가
              </button>
            </div>
          )}

          {/* 관리 설정 */}
          {activePanel === 'management' && (
            <div className="space-y-4">
              {/* 관리항목 */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4">
                <div className="text-[12px] font-extrabold text-[var(--text-primary)] flex items-center gap-1.5 mb-3">
                  <ClipboardList size={14} className="text-primary-500" /> 관리항목 (리스트에 표시할 필드)
                </div>
                {allFields.length === 0 ? (
                  <div className="text-[11px] text-[var(--text-muted)] py-2">섹션에 필드를 먼저 추가해주세요</div>
                ) : (
                  <div className="space-y-1">
                    {allFields.map(f => (
                      <label key={f.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-[var(--bg-muted)] cursor-pointer transition-colors">
                        <input type="checkbox" checked={editing.managedFields.includes(f.id)}
                          onChange={() => toggleManagedField(f.id)} className="accent-primary-500" />
                        <span className="text-[12px] font-bold text-[var(--text-primary)]">{f.label}</span>
                        <span className="text-[10px] text-[var(--text-muted)]">({f.sectionTitle})</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* 진행절차 */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4">
                <div className="text-[12px] font-extrabold text-[var(--text-primary)] flex items-center gap-1.5 mb-3">
                  🔄 진행절차
                </div>
                <div className="space-y-2">
                  {editing.workflow.map((step, i) => (
                    <div key={step.id} className="flex items-center gap-2">
                      <span className="text-[10px] text-[var(--text-muted)] font-bold w-4">{i + 1}</span>
                      <input type="color" value={step.color} onChange={e => updateWorkflowStep(i, { color: e.target.value })}
                        className="w-6 h-6 rounded border border-[var(--border-default)] cursor-pointer p-0 bg-transparent" />
                      <input value={step.label} onChange={e => updateWorkflowStep(i, { label: e.target.value })}
                        className="flex-1 px-2 py-1 rounded-md border border-[var(--border-default)] bg-[var(--bg-muted)] text-[12px] font-bold text-[var(--text-primary)] outline-none" />
                      {i < editing.workflow.length - 1 && <span className="text-[var(--text-muted)]">→</span>}
                      <button onClick={() => deleteWorkflowStep(i)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--text-muted)] hover:text-red-500 cursor-pointer">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  <button onClick={addWorkflowStep}
                    className={btnCls + ' border border-dashed border-[var(--border-default)] text-[var(--text-muted)] hover:text-primary-500 hover:border-primary-400 w-full justify-center mt-1'}>
                    <Plus size={13} /> 단계 추가
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 오른쪽: 실시간 미리보기 ── */}
        <div className="lg:sticky lg:top-4" style={{ maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' }}>
          <div className="flex items-center gap-1.5 mb-2">
            <Eye size={14} className="text-primary-500" />
            <span className="text-[12px] font-extrabold text-[var(--text-primary)]">실시간 미리보기</span>
          </div>
          <FormPreview tpl={editing} />
        </div>
      </div>

      {/* ── 섹션 추가 모달 ── */}
      {showAddSection && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 animate-fadeIn" onClick={() => setShowAddSection(false)}>
          <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-slideUp" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)]">
              <div className="flex items-center gap-2">
                <Plus size={18} className="text-primary-500" />
                <span className="text-[14px] font-extrabold text-[var(--text-primary)]">섹션 추가</span>
              </div>
              <button onClick={() => setShowAddSection(false)} className="p-1.5 rounded-lg hover:bg-[var(--bg-muted)] text-[var(--text-muted)] cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-3">
              {SECTION_TYPES.map(st => {
                const Icon = st.icon
                return (
                  <button key={st.type} onClick={() => addSection(st.type)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-[var(--border-default)] hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all cursor-pointer group">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 transition-colors">
                      <Icon size={20} className="text-primary-500" />
                    </div>
                    <div className="text-[12px] font-extrabold text-[var(--text-primary)]">{st.label}</div>
                    <div className="text-[10px] text-[var(--text-muted)] text-center leading-tight">{st.desc}</div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
