import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { getItem, setItem } from '../../utils/storage'
import {
  Plus, Trash2, X, GripVertical, ChevronLeft, Save, Eye, Palette,
  Type, AlignLeft, FileText, ClipboardList, Shield, Layers, Settings2,
  PenLine, Copy, MoreHorizontal, ChevronDown, ChevronUp, Move,
  Lock, Paperclip, RefreshCw, LayoutList, ToggleLeft,
  Sparkles, Store, TentTree, Building2, CheckCircle2,
} from 'lucide-react'

/* ═══════════════════════════════════════════
   타입 정의
   ═══════════════════════════════════════════ */
type SectionType = 'basic_info' | 'category' | 'extra_info' | 'privacy_consent'
type FieldType = 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'date' | 'time' | 'phone' | 'email'

interface FormField {
  id: string; label: string; type: FieldType
  placeholder?: string; required: boolean; options?: string[]
  inline?: boolean
}
interface FormSection {
  id: string; type: SectionType
  titleText: string; titleColor: string; titleSize: number
  descText: string; descSize: number
  fields: FormField[]
  selectionMode?: 'none' | 'checkbox' | 'radio'
  privacyContent?: string
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
const SUBMISSIONS_KEY = 'hp_form_submissions'
const uid = () => Math.random().toString(36).slice(2, 10)

const SECTION_TYPES: { type: SectionType; label: string; icon: any; desc: string }[] = [
  { type: 'basic_info', label: '기본정보', icon: ClipboardList, desc: '이름, 연락처 등 기본 입력 항목' },
  { type: 'category', label: '접수분야', icon: Layers, desc: '분야 선택 (체크박스/라디오)' },
  { type: 'extra_info', label: '추가정보', icon: AlignLeft, desc: '추가 문의, 메모 등 자유 입력' },
  { type: 'privacy_consent', label: '개인정보 수집 및 동의', icon: Shield, desc: '동의 체크박스 자동 생성' },
]

const FIELD_TYPES: { type: FieldType; label: string }[] = [
  { type: 'text', label: '텍스트' }, { type: 'textarea', label: '장문 텍스트' },
  { type: 'select', label: '선택 (드롭다운)' }, { type: 'file', label: '첨부파일' },
  { type: 'date', label: '날짜' }, { type: 'time', label: '시간' },
  { type: 'phone', label: '전화번호' }, { type: 'email', label: '이메일' },
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
   관리 형태 미리보기
   ═══════════════════════════════════════════ */
function MgmtPreview({ tpl, managedFields, allFields }: {
  tpl: FormTemplate
  managedFields: string[]
  allFields: Array<FormField & { sectionTitle: string; isSectionGroup?: boolean }>
}) {
  const cols = allFields.filter(f => managedFields.includes(f.id))
  const DUMMY_ROWS = [
    { name: '한국문화재단', status: tpl.workflow[0] },
    { name: '(주)디자인하우스', status: tpl.workflow[1] || tpl.workflow[0] },
    { name: '스마트테크(주)', status: tpl.workflow[2] || tpl.workflow[0] },
    { name: '미래수업(주)', status: tpl.workflow[0] },
  ]
  const DUMMY_CATEGORIES = [
    ['제조공급사', '판매대리점'],
    ['원단공급사'],
    ['지역서비스', '유통관리사'],
    ['판매대리점', '원단공급사'],
  ]
  return (
    <div className="bg-[var(--bg-muted)] rounded-xl shadow-inner min-h-full">
      {/* 헤더 */}
      <div className="px-4 pt-4 pb-3 border-b border-[var(--border-default)] bg-[var(--bg-surface)] rounded-t-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: tpl.bgColor }}>
              <LayoutList size={13} className="text-white" />
            </div>
            <span className="text-[13px] font-extrabold text-[var(--text-primary)]">{tpl.title || '신청서'} 접수 목록</span>
          </div>
          <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-muted)] px-2 py-0.5 rounded-full">총 {DUMMY_ROWS.length}건</span>
        </div>
        {/* 상태 필터 */}
        <div className="flex gap-1.5 flex-wrap">
          <button className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[var(--bg-muted)] text-[var(--text-secondary)] border border-[var(--border-default)]">전체</button>
          {tpl.workflow.map(step => (
            <button key={step.id}
              className="text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors"
              style={{ color: step.color, borderColor: `${step.color}40`, background: `${step.color}10` }}>
              {step.label}
            </button>
          ))}
        </div>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-[var(--bg-muted)] border-b border-[var(--border-default)]">
              <th className="text-left px-3 py-2.5 font-bold text-[var(--text-muted)] w-8">#</th>
              <th className="text-left px-3 py-2.5 font-bold text-[var(--text-muted)] whitespace-nowrap">접수일</th>
              {cols.length === 0 ? (
                <th className="text-left px-3 py-2.5 font-bold text-amber-500">⚠️ 관리항목을 선택하세요</th>
              ) : (
                cols.map(c => (
                  <th key={c.id} className="text-left px-3 py-2.5 font-bold text-[var(--text-muted)] whitespace-nowrap">
                    {c.isSectionGroup ? (
                      <span className="flex items-center gap-1">
                        <span>{c.label}</span>
                        <span className="text-[8px] text-primary-500 font-extrabold bg-primary-50 dark:bg-primary-900/20 px-1 py-0.5 rounded">선택분야</span>
                      </span>
                    ) : c.label}
                  </th>
                ))
              )}
              <th className="text-left px-3 py-2.5 font-bold text-[var(--text-muted)] whitespace-nowrap">진행상태</th>
              <th className="px-3 py-2.5 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {DUMMY_ROWS.map((row, i) => (
              <tr key={i} className="border-b border-[var(--border-default)] hover:bg-[var(--bg-muted)] transition-colors">
                <td className="px-3 py-2.5 text-[var(--text-muted)] font-bold">{i + 1}</td>
                <td className="px-3 py-2.5 text-[var(--text-muted)] whitespace-nowrap">2026-06-{(25 + i).toString().padStart(2, '0')}</td>
                {cols.length === 0 ? (
                  <td className="px-3 py-2.5 text-[var(--text-muted)] italic">필드 미선택</td>
                ) : (
                  cols.map((c, ci) => (
                    <td key={c.id} className="px-3 py-2.5 text-[var(--text-primary)]">
                      {c.isSectionGroup ? (
                        /* 접수분야: 선택된 분야를 배지로 표시 */
                        <div className="flex flex-wrap gap-1">
                          {(DUMMY_CATEGORIES[i] || []).map(cat => (
                            <span key={cat}
                              className="text-[9px] font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap"
                              style={{ background: `${tpl.bgColor}18`, color: tpl.bgColor }}>
                              {cat}
                            </span>
                          ))}
                        </div>
                      ) : ci === 0 ? row.name : <span className="text-[var(--text-muted)]">-</span>}
                    </td>
                  ))
                )}
                <td className="px-3 py-2.5">
                  {row.status && (
                    <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap"
                      style={{ color: row.status.color, background: `${row.status.color}15` }}>
                      {row.status.label}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex gap-1">
                    <div className="w-5 h-5 rounded bg-[var(--bg-muted)] flex items-center justify-center"><Eye size={10} className="text-[var(--text-muted)]" /></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-default)] bg-[var(--bg-surface)] rounded-b-xl">
        <span className="text-[10px] text-[var(--text-muted)]">1-4 / 4건</span>
        <div className="flex gap-1">
          {[1,2,3].map(n => (
            <button key={n} className={`w-6 h-6 rounded text-[10px] font-bold transition-colors ${
              n === 1 ? 'text-white' : 'text-[var(--text-muted)] hover:bg-[var(--bg-muted)]'
            }`} style={n === 1 ? { background: tpl.bgColor } : {}}>{n}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   실시간 미리보기
   ═══════════════════════════════════════════ */

/* ── 커스텀 드롭다운 ── */
function CustomSelect({ placeholder, options, bgColor, optionMode }: { placeholder?: string; options?: string[]; bgColor?: string; optionMode?: string }) {
  const [open, setOpen] = useState(false)
  const [val, setVal] = useState('')
  const [multiVals, setMultiVals] = useState<string[]>([])
  const isMulti = optionMode === 'multi'
  const color = bgColor || '#6366f1'
  const displayText = isMulti
    ? (multiVals.length > 0 ? multiVals.join(', ') : '')
    : val
  return (
    <div style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(!open)}
        style={{
          width: '100%', padding: '8px 14px', borderRadius: 10,
          border: '1.5px solid var(--border-default)', background: 'var(--bg-surface)',
          fontSize: 12, textAlign: 'left', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', color: displayText ? 'var(--text-primary)' : 'var(--text-muted)',
          transition: 'all 0.15s', outline: 'none',
        }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayText || placeholder || '선택해주세요'}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          marginTop: 4, borderRadius: 12, overflow: 'hidden',
          border: '1.5px solid var(--border-default)', background: 'var(--bg-surface)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)', maxHeight: 280, overflowY: 'auto',
        }}>
          <div style={{
            padding: '8px 14px', fontWeight: 800, fontSize: 11, color: '#fff',
            background: `linear-gradient(135deg, ${color}, ${color}cc)`,
            position: 'sticky', top: 0, zIndex: 1,
          }}>
            {placeholder || '선택해주세요'}
            {isMulti && multiVals.length > 0 && <span style={{ opacity: 0.7, marginLeft: 6 }}>({multiVals.length}개 선택)</span>}
          </div>
          {(options || []).map((o, i) => {
            const isSelected = isMulti ? multiVals.includes(o) : val === o
            return (
              <button key={i} type="button"
                onClick={() => {
                  if (isMulti) {
                    setMultiVals(prev => prev.includes(o) ? prev.filter(v => v !== o) : [...prev, o])
                  } else {
                    setVal(o); setOpen(false)
                  }
                }}
                style={{
                  width: '100%', padding: '8px 14px', border: 'none',
                  background: isSelected ? `${color}12` : 'transparent',
                  fontSize: 12, fontWeight: isSelected ? 700 : 500, cursor: 'pointer',
                  textAlign: 'left', color: isSelected ? color : 'var(--text-primary)',
                  borderBottom: i < (options || []).length - 1 ? '1px solid var(--border-default)' : 'none',
                  display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${color}08` }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isSelected ? `${color}12` : 'transparent' }}
              >
                {isMulti ? (
                  <span style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    border: `1.5px solid ${isSelected ? color : 'var(--border-default)'}`,
                    background: isSelected ? color : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isSelected && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </span>
                ) : (
                  <span style={{
                    width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                    border: `1.5px solid ${isSelected ? color : 'var(--border-default)'}`,
                    background: isSelected ? color : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isSelected && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </span>
                )}
                {o}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}


function FormPreview({ tpl, activeSectionId, scrollContainerRef }: {
  tpl: FormTemplate
  activeSectionId: string | null
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
}) {
  const sectionTypeLabel = (t: SectionType) =>
    SECTION_TYPES.find(s => s.type === t)?.label || t
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  // 접수분야 선택 상태: { [secId]: Set<fieldId> }
  const [selectedFields, setSelectedFields] = useState<Record<string, string[]>>({})

  const toggleField = (secId: string, fieldId: string, mode: 'checkbox' | 'radio') => {
    setSelectedFields(prev => {
      const cur = prev[secId] || []
      if (mode === 'radio') {
        return { ...prev, [secId]: [fieldId] }
      } else {
        const next = cur.includes(fieldId) ? cur.filter(id => id !== fieldId) : [...cur, fieldId]
        return { ...prev, [secId]: next }
      }
    })
  }

  useEffect(() => {
    if (!activeSectionId) return
    const el = sectionRefs.current[activeSectionId]
    const container = scrollContainerRef.current
    if (el && container) {
      const elTop = el.offsetTop
      container.scrollTo({ top: elTop - 80, behavior: 'smooth' })
    }
  }, [activeSectionId, scrollContainerRef])

  return (
    <div className="bg-[var(--bg-muted)] rounded-xl shadow-inner min-h-full">
      <div className="max-w-[480px] mx-auto pb-24">
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
          {tpl.sections.map(sec => {
            const isActive = activeSectionId === sec.id
            return (
              <div
                key={sec.id}
                ref={el => { sectionRefs.current[sec.id] = el }}
                className={`bg-white dark:bg-[var(--bg-surface)] rounded-xl p-5 shadow-sm border-2 transition-all duration-300 ${
                  isActive
                    ? 'border-primary-400 shadow-primary-100 dark:shadow-primary-900/20 shadow-lg'
                    : 'border-transparent shadow-sm border border-[var(--border-default)]'
                }`}
              >
                {/* 활성 표시 배지 */}
                {isActive && (
                  <div className="flex items-center gap-1 mb-2">
                    <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-primary-500 bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded-full animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                      편집 중
                    </span>
                  </div>
                )}
                {/* 섹션 헤더 */}
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-black" style={{ background: sec.titleColor }}>
                    {sec.type === 'privacy_consent' ? <Lock size={10} /> : <ClipboardList size={10} />}
                  </div>
                  <div style={{ fontSize: sec.titleSize, color: sec.titleColor }} className="font-extrabold">
                    {sec.titleText || sectionTypeLabel(sec.type)}
                  </div>
                  {/* 접수분야 선택방식 배지 */}
                  {sec.type === 'category' && sec.selectionMode && sec.selectionMode !== 'none' && (
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ml-auto"
                      style={{ background: `${sec.titleColor}15`, color: sec.titleColor }}>
                      {sec.selectionMode === 'checkbox' ? '복수선택' : '단수선택'}
                    </span>
                  )}
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
                    <div className="text-[10px] text-[var(--text-muted)] leading-relaxed mb-3 whitespace-pre-line">
                      {sec.privacyContent || '수집항목: 성명, 연락처, 이메일\n수집목적: 신청 접수 및 안내\n보유기간: 접수일로부터 1년'}
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded accent-primary-500" readOnly />
                      <span className="text-[12px] font-bold text-[var(--text-primary)]">동의합니다</span>
                    </label>
                  </div>
                ) : sec.type === 'category' && sec.selectionMode && sec.selectionMode !== 'none' ? (
                  /* 접수분야 선택 모드 - 인터랙티브 */
                  <div className="space-y-2 mt-2">
                    {sec.fields.length === 0 && (
                      <div className="text-[11px] text-[var(--text-muted)] py-2">필드를 추가해주세요</div>
                    )}
                    {(() => {
                      // inline 그룹핑: inline=true인 필드는 이전 그룹에 합침
                      const groups: FormField[][] = []
                      sec.fields.forEach(f => {
                        if ((f as any).inline && groups.length > 0) groups[groups.length - 1].push(f)
                        else groups.push([f])
                      })
                      return groups.map((group, gi) => {
                        // 같은줄 그룹: 첫번째 필드 선택 여부로 판단
                        const anyChecked = group.length > 1
                          ? (selectedFields[sec.id] || []).includes(group[0].id)
                          : group.some(f => (selectedFields[sec.id] || []).includes(f.id))
                        return (
                          <div key={gi}>
                            {/* 그룹의 첫 번째 필드만 라디오/체크 표시, inline 필드는 숨김 */}
                            {group.filter((_, fi) => fi === 0).map(f => {
                              const checked = (selectedFields[sec.id] || []).includes(f.id)
                              return (
                                <label
                                  key={f.id}
                                  className="flex items-center gap-2 py-1 cursor-pointer select-none"
                                  onClick={() => toggleField(sec.id, f.id, sec.selectionMode as 'checkbox' | 'radio')}
                                >
                                  <div className={`flex-shrink-0 w-4 h-4 border-2 flex items-center justify-center transition-all ${
                                    sec.selectionMode === 'radio'
                                      ? `rounded-full ${checked ? 'border-primary-500 bg-primary-500' : 'border-[var(--border-default)]'}`
                                      : `rounded ${checked ? 'border-primary-500 bg-primary-500' : 'border-[var(--border-default)]'}`
                                  }`}>
                                    {checked && (
                                      sec.selectionMode === 'radio'
                                        ? <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                        : <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    )}
                                  </div>
                                  <span className={`text-[12px] font-bold transition-colors ${
                                    checked ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                                  }`}>
                                    {f.label}
                                  </span>
                                </label>
                              )
                            })}
                            {/* 같은줄 그룹: 하나라도 선택 시 그룹 전체 입력란 한줄 표시 */}
                            {anyChecked && (
                              <div className="ml-6 mt-1 mb-2 animate-fadeIn" style={{ display: 'flex', gap: 8 }}>
                                {group.map(f => (
                                  <div key={f.id} style={{ flex: 1 }}>
                                    {group.length > 1 && <div className="text-[10px] font-bold text-[var(--text-muted)] mb-1">{f.label}</div>}
                                    {f.type === 'select' ? (
                                      <CustomSelect placeholder={f.placeholder} options={f.options} bgColor={tpl.bgColor} optionMode={(f as any).optionMode}/>
                                    ) : f.type === 'textarea' ? (
                                      <textarea
                                        placeholder={f.placeholder || '입력해주세요'}
                                        className={`${inputCls} h-14 resize-none`}
                                      />
                                    ) : f.type === 'date' ? (
                                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)]" style={{ fontSize: 12 }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                        <span className="text-[var(--text-muted)]">년-월-일</span>
                                      </div>
                                    ) : f.type === 'time' ? (
                                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)]" style={{ fontSize: 12 }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                        <span className="text-[var(--text-muted)]">시:분</span>
                                      </div>
                                    ) : (
                                      <input
                                        type="text"
                                        placeholder={f.placeholder || '입력해주세요'}
                                        className={inputCls}
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })
                    })()}
                  </div>
                ) : (
                  /* 일반 필드들 */
                  <div className="space-y-3 ml-7">
                    {sec.fields.length === 0 && (
                      <div className="text-[11px] text-[var(--text-muted)] py-2">필드를 추가해주세요</div>
                    )}
                    {(() => {
                      const rows: FormField[][] = []
                      sec.fields.forEach(f => {
                        if ((f as any).inline && rows.length > 0) rows[rows.length - 1].push(f)
                        else rows.push([f])
                      })
                      return rows.map((row, ri) => (
                        <div key={ri} style={{ display: 'flex', gap: 12 }}>
                          {row.map(f => (
                            <div key={f.id} style={{ flex: 1 }}>
                              <label className="text-[11px] font-bold text-[var(--text-secondary)] mb-1 block">
                                {f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}
                              </label>
                              {f.type === 'textarea' ? (
                                <textarea placeholder={f.placeholder} className={inputCls + ' h-16 resize-none'} readOnly />
                              ) : f.type === 'select' ? (
                                <CustomSelect placeholder={f.placeholder} options={f.options} bgColor={tpl.bgColor} optionMode={(f as any).optionMode}/>
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
                                  <Paperclip size={12} className="inline -mt-0.5" /> 파일을 드래그하거나 클릭하여 업로드
                                </div>
                              ) : (
                                <input type={f.type === 'phone' ? 'tel' : f.type === 'email' ? 'email' : f.type === 'date' ? 'date' : f.type === 'time' ? 'time' : 'text'}
                                  placeholder={f.placeholder} className={inputCls} readOnly />
                              )}
                            </div>
                          ))}
                        </div>
                      ))
                    })()}
                  </div>
                )}
              </div>
            )
          })}

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
  // 타입 라벨
  const typeLabel = FIELD_TYPES.find(ft => ft.type === field.type)?.label || field.type
  // 활성화된 설정 뱃지 표시
  const badges: string[] = []
  if (field.required) badges.push('필수')
  if ((field as any).inline) badges.push('같은줄')
  return (
    <div className="bg-[var(--bg-muted)] rounded-lg border border-[var(--border-default)]">
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="flex flex-col gap-0.5">
          <button onClick={onMoveUp} disabled={isFirst} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 cursor-pointer disabled:cursor-default"><ChevronUp size={12} /></button>
          <button onClick={onMoveDown} disabled={isLast} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 cursor-pointer disabled:cursor-default"><ChevronDown size={12} /></button>
        </div>
        <input value={field.label} onChange={e => onUpdate({ ...field, label: e.target.value })}
          className="flex-1 px-2 py-1 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] text-[12px] font-bold text-[var(--text-primary)] outline-none" placeholder="필드 라벨" />
        {/* 타입 + 설정 뱃지 */}
        <div className="flex gap-1 items-center">
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-default)] whitespace-nowrap">{typeLabel}</span>
          {badges.map(b => (
            <span key={b} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary-500/15 text-primary-500 whitespace-nowrap">{b}</span>
          ))}
        </div>
        <button onClick={() => setExpanded(!expanded)} className={`p-1 rounded cursor-pointer transition-colors ${expanded ? 'bg-primary-500/15 text-primary-500' : 'hover:bg-[var(--bg-surface)] text-[var(--text-muted)]'}`}
          title="설정">
          <MoreHorizontal size={14} />
        </button>
        <button onClick={onDelete} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--text-muted)] hover:text-red-500 cursor-pointer">
          <Trash2 size={14} />
        </button>
      </div>
      {expanded && (
        <div className="px-3 pb-3 pt-2 space-y-3 border-t border-[var(--border-default)]">
          {/* 필드 타입 */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[var(--text-muted)] whitespace-nowrap w-14">필드 타입</span>
            <select value={field.type} onChange={e => onUpdate({ ...field, type: e.target.value as FieldType })}
              className="flex-1 px-2 py-1.5 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] text-[11px] text-[var(--text-secondary)] outline-none cursor-pointer">
              {FIELD_TYPES.map(ft => <option key={ft.type} value={ft.type}>{ft.label}</option>)}
            </select>
          </div>
          {/* 필수 / 같은줄 설정 */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-secondary)] cursor-pointer whitespace-nowrap">
              <input type="checkbox" checked={field.required} onChange={e => onUpdate({ ...field, required: e.target.checked })} className="accent-primary-500 w-3.5 h-3.5" />
              필수 입력
            </label>
            {!isFirst && (
              <label className="flex items-center gap-1.5 text-[11px] font-bold cursor-pointer whitespace-nowrap" style={{ color: (field as any).inline ? 'var(--primary-500)' : 'var(--text-secondary)' }}>
                <input type="checkbox" checked={!!(field as any).inline} onChange={e => onUpdate({ ...field, inline: e.target.checked } as any)} className="accent-primary-500 w-3.5 h-3.5" />
                ↑같은줄 배치
              </label>
            )}
          </div>
          <input value={field.placeholder || ''} onChange={e => onUpdate({ ...field, placeholder: e.target.value })}
            placeholder="플레이스홀더 텍스트" className={inputCls + ' text-[11px]'} />
          {hasOptions && (
            <div>
              <div className="text-[10px] font-bold text-[var(--text-muted)] mb-1">옵션 (줄바꿈으로 구분)</div>
              <textarea value={(field.options || []).join('\n')} onChange={e => onUpdate({ ...field, options: e.target.value.split('\n').filter(Boolean) })}
                className={inputCls + ' text-[11px] h-20'} placeholder="옵션1&#10;옵션2&#10;옵션3" />
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold text-[var(--text-muted)]">옵션 선택방식</span>
                <div className="flex gap-1">
                  {([
                    { value: "radio", label: "단수선택" },
                    { value: "multi", label: "복수선택" },
                  ] as const).map(m => (
                    <button key={m.value} type="button"
                      onClick={() => onUpdate({ ...field, optionMode: (field as any).optionMode === m.value ? undefined : m.value as any })}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border cursor-pointer transition-colors ${
                        (field as any).optionMode === m.value
                          ? "bg-primary-500 text-white border-primary-500"
                          : "bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-default)] hover:border-primary-300"
                      }`}>
                      {m.label}
                    </button>
                  ))}
                </div>

              </div>
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
function SectionEditor({ section, onUpdate, onDelete, onMoveUp, onMoveDown, isFirst, isLast, onFocus }:
  { section: FormSection; onUpdate: (s: FormSection) => void; onDelete: () => void; onMoveUp: () => void; onMoveDown: () => void; isFirst: boolean; isLast: boolean; onFocus: () => void }) {
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
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden" onClick={onFocus}>
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-[var(--bg-muted)] cursor-pointer" onClick={() => setCollapsed(!collapsed)}>
        <div className="flex flex-col gap-0.5 mr-1" onClick={e => e.stopPropagation()}>
          <button onClick={onMoveUp} disabled={isFirst} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 cursor-pointer disabled:cursor-default"><ChevronUp size={12} /></button>
          <button onClick={onMoveDown} disabled={isLast} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 cursor-pointer disabled:cursor-default"><ChevronDown size={12} /></button>
        </div>
        <TypeIcon size={14} className="text-primary-500 shrink-0" />
        <span className="text-[12px] font-extrabold text-[var(--text-primary)] flex-1">{section.titleText || typeLabel}</span>
        <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-surface)] px-2 py-0.5 rounded-full">
          {section.type === 'privacy_consent' ? '자동' : `${section.fields.length}개 필드`}
        </span>
        <button onClick={e => { e.stopPropagation(); onDelete() }} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--text-muted)] hover:text-red-500 cursor-pointer">
          <Trash2 size={14} />
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

          {/* 접수항목 선택방식 (접수분야 섹션 전용) */}
          {section.type === 'category' && (
            <div className="border-t border-[var(--border-default)] pt-3">
              <div className="text-[10px] font-bold text-[var(--text-muted)] mb-2 flex items-center gap-1">
                <Layers size={11} className="text-primary-500" /> 접수항목 선택방식
              </div>
              <div className="flex gap-2">
                {([
                  { value: 'none', label: '기본 필드형', desc: '일반 입력' },
                  { value: 'checkbox', label: '복수선택', desc: '체크박스' },
                  { value: 'radio', label: '단수선택', desc: '라디오' },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => onUpdate({ ...section, selectionMode: opt.value })}
                    className={`flex-1 flex flex-col items-center gap-0.5 py-2 px-2 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                      (section.selectionMode ?? 'none') === opt.value
                        ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                        : 'border-[var(--border-default)] text-[var(--text-muted)] hover:border-primary-300'
                    }`}
                  >
                    <span className="text-[9px] font-extrabold">{opt.label}</span>
                    <span className="text-[8px] opacity-70">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 개인정보 내용 편집 (개인정보 동의 전용) */}
          {section.type === 'privacy_consent' && (
            <div className="border-t border-[var(--border-default)] pt-3">
              <div className="text-[10px] font-bold text-[var(--text-muted)] mb-2 flex items-center gap-1">
                <Shield size={11} className="text-primary-500" /> 개인정보 수집 내용
              </div>
              <textarea
                value={section.privacyContent || '수집항목: 성명, 연락처, 이메일\n수집목적: 신청 접수 및 안내\n보유기간: 접수일로부터 1년'}
                onChange={e => onUpdate({ ...section, privacyContent: e.target.value })}
                className={inputCls + ' text-[11px] h-24'}
                placeholder="개인정보 수집 내용을 입력하세요"
              />
              <div className="text-[9px] text-[var(--text-muted)] mt-1">줄바꿈으로 항목을 구분합니다</div>
            </div>
          )}

          {/* 필드 목록 (개인정보 동의 제외) */}
          {section.type !== 'privacy_consent' && (
            <>
              <div className="border-t border-[var(--border-default)] pt-2">
                <div className="text-[10px] font-bold text-[var(--text-muted)] mb-2"><FileText size={12} className="inline -mt-0.5" /> 입력 필드</div>
                <div className="space-y-1.5">
                  {section.fields.map((f, i) => (
                    <FieldRow key={f.id} field={f} onUpdate={nf => updateField(i, nf)} onDelete={() => deleteField(i)}
                      onMoveUp={() => moveField(i, -1)} onMoveDown={() => moveField(i, 1)}
                      isFirst={i === 0} isLast={i === section.fields.length - 1} />
                  ))}
                </div>
                <button onClick={addField}
                  className={btnCls + ' mt-2 border border-dashed border-[var(--border-default)] text-[var(--text-muted)] hover:text-primary-500 hover:border-primary-400 w-full justify-center'}>
                  <Plus size={14} /> 필드 추가
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
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const [showMgmtPreview, setShowMgmtPreview] = useState(false)
  const previewScrollRef = useRef<HTMLDivElement | null>(null)

  /* ═══ 상위 탭 ═══ */
  const [topTab, setTopTab] = useState<'create' | 'manage'>('create')

  /* ═══ 접수 관리 상태 ═══ */
  const [submissions, setSubmissions] = useState<FormSubmission[]>(() =>
    getItem<FormSubmission[]>(SUBMISSIONS_KEY, []).map(s => ({ ...s, status: s.status || '접수완료' }))
  )
  const [viewMode, setViewMode] = useState<'list' | 'builder' | 'submissions'>('list')
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null)
  const [submissionFilter, setSubmissionFilter] = useState<string>('all')

  const saveSubmissions = useCallback((list: FormSubmission[]) => {
    setSubmissions(list); setItem(SUBMISSIONS_KEY, list)
  }, [])

  const submissionsForTemplate = useMemo(() => {
    if (!editId) return []
    return submissions.filter(s => (s.templateId || (s as any).tplId) === editId)
  }, [submissions, editId])

  const filteredSubmissions = useMemo(() => {
    if (submissionFilter === 'all') return submissionsForTemplate
    return submissionsForTemplate.filter(s => s.status === submissionFilter)
  }, [submissionsForTemplate, submissionFilter])

  const updateSubmissionStatus = useCallback((subId: string, newStatus: string) => {
    saveSubmissions(submissions.map(s => s.id === subId ? { ...s, status: newStatus } : s))
  }, [submissions, saveSubmissions])

  const deleteSubmission = useCallback((subId: string) => {
    if (!confirm('이 접수 건을 삭제하시겠습니까?')) return
    saveSubmissions(submissions.filter(s => s.id !== subId))
    if (selectedSubmissionId === subId) setSelectedSubmissionId(null)
  }, [submissions, saveSubmissions, selectedSubmissionId])

  const save = useCallback((list: FormTemplate[]) => { setTemplates(list); setItem(STORAGE_KEY, list) }, [])

  const editing = useMemo(() => templates.find(t => t.id === editId) || null, [templates, editId])

  const updateEditing = useCallback((patch: Partial<FormTemplate>) => {
    if (!editId) return
    save(templates.map(t => t.id === editId ? { ...t, ...patch } : t))
  }, [editId, templates, save])

  const createNew = () => {
    const t = newTemplate()
    const list = [...templates, t]
    save(list); setEditId(t.id); setViewMode('builder')
  }

  /* 프리셋 템플릿 생성 */
  const createFromPreset = (preset: 'franchise' | 'workshop' | 'venue') => {
    const p = uid
    const now = new Date().toISOString().slice(0, 10)
    const wf = (labels: string[], colors: string[]) =>
      labels.map((label, i) => ({ id: p(), label, color: colors[i] }))

    const PRESETS: Record<string, FormTemplate> = {
      franchise: {
        id: p(), name: '가맹점 신청서', createdAt: now,
        bgColor: '#ec4899', title: '가맹점 신청', titleSize: 28, titleColor: '#ffffff',
        description: '저희 플랫폼의 가맹점 개설을 신청해 주세요.', descColor: '#ffffffcc',
        managedFields: [],
        workflow: wf(['접수완료', '서류검토', '현장시찰', '계약준비', '계약완료', '신청취소'], ['#22c55e','#3b82f6','#f59e0b','#8b5cf6','#6366f1','#ef4444']),
        sections: [
          {
            id: p(), type: 'basic_info',
            titleText: '신청인 기본정보', titleColor: '#be185d', titleSize: 16,
            descText: '신청인의 기본 정보를 입력해 주세요', descSize: 12,
            fields: [
              { id: p(), label: '단체/기업명', type: 'text', placeholder: '단체명 또는 대표자명을 입력하세요', required: true },
              { id: p(), label: '담당자', type: 'text', placeholder: '담당자 성명', required: true },
              { id: p(), label: '연락처', type: 'phone', placeholder: '010-0000-0000', required: true },
              { id: p(), label: '이메일', type: 'email', placeholder: 'example@email.com', required: false },
            ],
          },
          {
            id: p(), type: 'category',
            titleText: '신청 분야', titleColor: '#be185d', titleSize: 16,
            descText: '원하시는 분야를 선택해 주세요 (독점 신청 불가)', descSize: 12,
            selectionMode: 'checkbox',
            fields: [
              { id: p(), label: '제조공급사', type: 'select', placeholder: '선택해주세요', required: false, options: ['직접제조', 'OEM', 'ODM'] },
              { id: p(), label: '원단공급사', type: 'select', placeholder: '선택해주세요', required: false, options: ['직물류', '편물류', '니트류'] },
              { id: p(), label: '판매대리점', type: 'text', placeholder: '지역과 직원수를 입력하세요', required: false },
              { id: p(), label: '지역서비스', type: 'text', placeholder: '지역과 직원수를 입력하세요', required: false },
              { id: p(), label: '유통관리사', type: 'select', placeholder: '선택해주세요', required: false, options: ['도매', '소매', '온라인'] },
            ],
          },
          {
            id: p(), type: 'extra_info',
            titleText: '개설 예정 지역 및 문의', titleColor: '#be185d', titleSize: 16,
            descText: '', descSize: 12,
            fields: [
              { id: p(), label: '개설 예정 지역', type: 'text', placeholder: '예: 서울 강남구 역삼동', required: true },
              { id: p(), label: '상권 내 현재 업종', type: 'text', placeholder: '현재 운영 중인 사업 (없으면 해당 없음)', required: false },
              { id: p(), label: '문의사항', type: 'textarea', placeholder: '추가 문의사항을 입력해 주세요', required: false },
            ],
          },
          { id: p(), type: 'privacy_consent', titleText: '개인정보 수집 및 동의', titleColor: '#be185d', titleSize: 16, descText: '', descSize: 12, fields: [] },
        ],
      },
      workshop: {
        id: p(), name: '워크샵 신청서', createdAt: now,
        bgColor: '#f59e0b', title: '워크샵 신청', titleSize: 28, titleColor: '#ffffff',
        description: '워크샵 예약을 신청해 주세요.', descColor: '#ffffffcc',
        managedFields: [],
        workflow: wf(['접수완료', '검토중', '예약확정', '계약완료', '취소'], ['#22c55e','#3b82f6','#f59e0b','#6366f1','#ef4444']),
        sections: [
          {
            id: p(), type: 'basic_info',
            titleText: '단체 기본정보', titleColor: '#b45309', titleSize: 16,
            descText: '', descSize: 12,
            fields: [
              { id: p(), label: '단체/기업명', type: 'text', placeholder: '단체명 또는 기업명', required: true },
              { id: p(), label: '담당자', type: 'text', placeholder: '담당자 성명', required: true },
              { id: p(), label: '연락처', type: 'phone', placeholder: '010-0000-0000', required: true },
              { id: p(), label: '이메일', type: 'email', placeholder: 'example@email.com', required: false },
            ],
          },
          {
            id: p(), type: 'extra_info',
            titleText: '워크샵 상세정보', titleColor: '#b45309', titleSize: 16,
            descText: '', descSize: 12,
            fields: [
              { id: p(), label: '체크인 날짜', type: 'date', placeholder: '', required: true },
              { id: p(), label: '체크아웃 날짜', type: 'date', placeholder: '', required: true },
              { id: p(), label: '인원', type: 'text', placeholder: '예: 45명', required: true },
              { id: p(), label: '프로그램 유형', type: 'select', placeholder: '선택해주세요', required: true, options: ['체크인', '당일치기', '팀빌딩', '리더십', '스트레스 해소'] },
              { id: p(), label: '필요한 강당사이즈', type: 'select', placeholder: '선택해주세요', required: false, options: ['소형(~30명)', '중형(31~80명)', '대형(81명~)'] },
              { id: p(), label: '필요 장비/서비스', type: 'textarea', placeholder: '필요한 장비나 서비스를 입력해 주세요', required: false },
              { id: p(), label: '미리 문의사항', type: 'textarea', placeholder: '문의하실 내용을 입력해 주세요', required: false },
            ],
          },
          { id: p(), type: 'privacy_consent', titleText: '개인정보 수집 및 동의', titleColor: '#b45309', titleSize: 16, descText: '', descSize: 12, fields: [] },
        ],
      },
      venue: {
        id: p(), name: '대관 신청서', createdAt: now,
        bgColor: '#6366f1', title: '대관(교육관) 신청', titleSize: 28, titleColor: '#ffffff',
        description: '대관 신청서를 작성해 주세요.', descColor: '#ffffffcc',
        managedFields: [],
        workflow: wf(['접수완료', '검토중', '대관확정', '계약완료', '취소'], ['#22c55e','#3b82f6','#f59e0b','#6366f1','#ef4444']),
        sections: [
          {
            id: p(), type: 'basic_info',
            titleText: '신청인 기본정보', titleColor: '#4338ca', titleSize: 16,
            descText: '', descSize: 12,
            fields: [
              { id: p(), label: '단체/기관명', type: 'text', placeholder: '단체명 또는 기관명', required: true },
              { id: p(), label: '담당자', type: 'text', placeholder: '담당자 성명', required: true },
              { id: p(), label: '연락처', type: 'phone', placeholder: '010-0000-0000', required: true },
              { id: p(), label: '이메일', type: 'email', placeholder: 'example@email.com', required: false },
            ],
          },
          {
            id: p(), type: 'extra_info',
            titleText: '대관 상세정보', titleColor: '#4338ca', titleSize: 16,
            descText: '', descSize: 12,
            fields: [
              { id: p(), label: '대관 일자', type: 'date', placeholder: '', required: true },
              { id: p(), label: '시작 시간', type: 'text', placeholder: '예: 09:00', required: true },
              { id: p(), label: '종료 시간', type: 'text', placeholder: '예: 18:00', required: true },
              { id: p(), label: '예상 인원', type: 'text', placeholder: '예: 60명', required: true },
              { id: p(), label: '행사 유형', type: 'select', placeholder: '선택해주세요', required: true, options: ['교육연수', '회의세미나', '문화행사', '전시행사', '영업행사', '기타'] },
              { id: p(), label: '필요한 시설/장비', type: 'textarea', placeholder: '필요한 시설이나 장비를 입력해 주세요', required: false },
              { id: p(), label: '미리 문의사항', type: 'textarea', placeholder: '문의하실 내용을 입력해 주세요', required: false },
            ],
          },
          { id: p(), type: 'privacy_consent', titleText: '개인정보 수집 및 동의', titleColor: '#4338ca', titleSize: 16, descText: '', descSize: 12, fields: [] },
        ],
      },
    }
    const t = PRESETS[preset]
    const list = [...templates, t]
    save(list); setEditId(t.id); setViewMode('builder')
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

  /* ═══ 섹션 조작 함수들 ═══ */
  const updateSection = useCallback((index: number, updated: FormSection) => {
    if (!editing) return
    const secs = [...editing.sections]
    secs[index] = updated
    updateEditing({ sections: secs })
  }, [editing, updateEditing])

  const deleteSection = useCallback((index: number) => {
    if (!editing) return
    if (!confirm('이 섹션을 삭제하시겠습니까?')) return
    const secs = editing.sections.filter((_, i) => i !== index)
    updateEditing({ sections: secs })
  }, [editing, updateEditing])

  const moveSection = useCallback((index: number, direction: number) => {
    if (!editing) return
    const secs = [...editing.sections]
    const target = index + direction
    if (target < 0 || target >= secs.length) return
    ;[secs[index], secs[target]] = [secs[target], secs[index]]
    updateEditing({ sections: secs })
  }, [editing, updateEditing])

  /* ═══ 관리 설정 함수들 ═══ */
  const allFields = useMemo(() => {
    if (!editing) return []
    const result: Array<FormField & { sectionTitle: string; isSectionGroup?: boolean }> = []
    for (const sec of editing.sections) {
      if (sec.type === 'category') {
        // 접수분야는 섹션 타이틀만 관리항목으로 추가 (개별 필드는 숨김)
        result.push({ id: 'cat_' + sec.id, label: sec.titleText, type: 'text', required: false, sectionTitle: sec.titleText, isSectionGroup: true } as any)
        continue
      }
      for (const f of sec.fields) {
        result.push({ ...f, sectionTitle: sec.titleText } as any)
      }
    }
    return result
  }, [editing])

  const toggleManagedField = useCallback((fieldId: string) => {
    if (!editing) return
    const mf = editing.managedFields.includes(fieldId)
      ? editing.managedFields.filter(id => id !== fieldId)
      : [...editing.managedFields, fieldId]
    updateEditing({ managedFields: mf })
  }, [editing, updateEditing])

  /* ═══ 워크플로우 편집 함수들 ═══ */
  const updateWorkflowStep = useCallback((index: number, patch: Partial<WorkflowStep>) => {
    if (!editing) return
    const wf = editing.workflow.map((s, i) => i === index ? { ...s, ...patch } : s)
    updateEditing({ workflow: wf })
  }, [editing, updateEditing])

  const deleteWorkflowStep = useCallback((index: number) => {
    if (!editing) return
    if (editing.workflow.length <= 2) { alert('최소 2개의 단계가 필요합니다'); return }
    updateEditing({ workflow: editing.workflow.filter((_, i) => i !== index) })
  }, [editing, updateEditing])

  const addWorkflowStep = useCallback(() => {
    if (!editing) return
    updateEditing({ workflow: [...editing.workflow, { id: uid(), label: '새 단계', color: '#64748b' }] })
  }, [editing, updateEditing])

  /* 섹션 조작 */
  const addSection = (type: SectionType) => {
    if (!editing) return
    const label = SECTION_TYPES.find(s => s.type === type)!.label
    const sec: FormSection = {
      id: uid(), type,
      titleText: label, titleColor: '#1e40af', titleSize: 16,
      descText: type === 'category' ? '전체 플랫폼의 속에 담당하고자 하는 역할을 선택해 주세요' : '',
      descSize: 12,
      selectionMode: type === 'category' ? 'checkbox' : 'none',
      fields: type === 'basic_info' ? [
        { id: uid(), label: '이름/단체명', type: 'text', placeholder: '이름 또는 단체명을 입력하세요', required: true },
        { id: uid(), label: '담당자', type: 'text', placeholder: '담당자명', required: true },
        { id: uid(), label: '연락처', type: 'phone', placeholder: '010-0000-0000', required: true },
        { id: uid(), label: '이메일', type: 'email', placeholder: 'example@email.com', required: false },
      ] : type === 'category' ? [
        { id: uid(), label: '제조공급사', type: 'select', placeholder: '선택해주세요', required: false, options: ['직접제조', 'OEM', 'ODM'] },
        { id: uid(), label: '원단공급사', type: 'select', placeholder: '선택해주세요', required: false, options: ['직물류', '편물류', '니트류'] },
        { id: uid(), label: '판매대리점', type: 'text', placeholder: '지역과 직원수를 입력하세요', required: false },
        { id: uid(), label: '지역서비스', type: 'text', placeholder: '지역과 직원수를 입력하세요', required: false },
        { id: uid(), label: '유통관리사', type: 'select', placeholder: '선택해주세요', required: false, options: ['도매', '소매', '온라인'] },
      ] : type === 'extra_info' ? [
        { id: uid(), label: '추가 문의사항', type: 'textarea', placeholder: '문의사항을 입력해 주세요', required: false },
      ] : [],
    }
    updateEditing({ sections: [...editing.sections, sec] })
    setShowAddSection(false)
  }

  /* ═══ PRESET_CARDS ═══ */
  const PRESET_CARDS = [
    { id: 'franchise', label: '가맹점', icon: Store, color: '#be185d' },
    { id: 'workshop', label: '워크샵', icon: TentTree, color: '#f59e0b' },
    { id: 'venue', label: '대관', icon: Building2, color: '#6366f1' },
  ]

  /* ═══════════════════ 렌더링 ═══════════════════ */


  if (viewMode === 'list' || !editing) {
    return (
      <div className="space-y-4">
        {/* ═══ 상위 탭: 신청서 작성 / 신청서 관리 ═══ */}
        <div className="flex bg-[var(--bg-muted)] rounded-xl p-1 gap-1">
          {([
            { key: 'create' as const, label: '신청서 작성', icon: PenLine },
            { key: 'manage' as const, label: '신청서 관리', icon: LayoutList },
          ]).map(tab => (
            <button key={tab.key} onClick={() => { setTopTab(tab.key); setEditId(null) }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-bold transition-all cursor-pointer ${
                topTab === tab.key
                  ? 'bg-[var(--bg-surface)] text-primary-500 shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}>
              <tab.icon size={15} />
              {tab.label}
              {tab.key === 'manage' && submissions.length > 0 && (
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-primary-500 text-white">{submissions.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* ═══ 신청서 작성 탭 ═══ */}
        {topTab === 'create' && (
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
                <div className="text-4xl mb-3"><ClipboardList size={40} className="mx-auto text-[var(--text-muted)]" /></div>
                <div className="text-[14px] font-bold text-[var(--text-secondary)] mb-1">아직 만든 신청서가 없습니다</div>
                <div className="text-[12px] text-[var(--text-muted)] mb-6">새 신청서를 만들거나 아래의 빠른 시작 템플릿을 사용해보세요</div>
                <div className="flex gap-3 justify-center flex-wrap">
                  {PRESET_CARDS.map(pc => (
                    <button key={pc.id} onClick={() => createFromPreset(pc.id as any)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-bold text-[12px] hover:shadow-md transition-all cursor-pointer"
                      style={{ borderColor: pc.color, color: pc.color, background: `${pc.color}10` }}>
                      <pc.icon size={16} />{pc.label} 템플릿
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 빠른 시작 */}
                <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4">
                  <div className="text-[11px] font-extrabold text-[var(--text-muted)] mb-3 flex items-center gap-1.5">
                    <Sparkles size={12} className="text-amber-400" /> 빠른 시작 템플릿
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {PRESET_CARDS.map(pc => (
                      <button key={pc.id} onClick={() => createFromPreset(pc.id as any)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold text-[11px] hover:shadow-sm transition-all cursor-pointer"
                        style={{ borderColor: pc.color, color: pc.color, background: `${pc.color}10` }}>
                        <pc.icon size={13} />{pc.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* 신청서 카드 목록 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {templates.map(t => (
                    <div key={t.id}
                      className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                      onClick={() => { setEditId(t.id); setViewMode('builder') }}>
                      <div className="h-16 relative" style={{ background: `linear-gradient(135deg, ${t.bgColor}, ${t.bgColor}cc)` }}>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white font-extrabold text-[14px] drop-shadow">{t.name}</span>
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-[13px] font-extrabold text-[var(--text-primary)]">{t.name}</div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                            <button onClick={() => duplicateTemplate(t)} className="p-1 rounded hover:bg-[var(--bg-muted)] text-[var(--text-muted)] cursor-pointer" title="복제"><Copy size={14} /></button>
                            <button onClick={() => deleteTemplate(t.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--text-muted)] hover:text-red-500 cursor-pointer" title="삭제"><Trash2 size={14} /></button>
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
              </div>
            )}
          </div>
        )}

        {/* ═══ 신청서 관리 탭 ═══ */}
        {topTab === 'manage' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <LayoutList size={20} className="text-primary-500" />
              <h2 className="text-lg font-extrabold text-[var(--text-primary)]">신청서 관리</h2>
            </div>

            {templates.length === 0 ? (
              <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-12 text-center">
                <div className="text-4xl mb-3"><ClipboardList size={40} className="mx-auto text-[var(--text-muted)]" /></div>
                <div className="text-[14px] font-bold text-[var(--text-secondary)] mb-1">연결된 신청서가 없습니다</div>
                <div className="text-[12px] text-[var(--text-muted)]">먼저 신청서 작성 탭에서 신청서를 만들어주세요</div>
              </div>
            ) : (
              <div className="space-y-2">
                {templates.map(t => {
                  const count = submissions.filter(s => (s.templateId || (s as any).tplId) === t.id).length
                  const statusMap: Record<string, number> = {}
                  submissions.filter(s => (s.templateId || (s as any).tplId) === t.id).forEach(s => {
                    statusMap[s.status] = (statusMap[s.status] || 0) + 1
                  })
                  return (
                    <div key={t.id}
                      className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden hover:shadow-md transition-all cursor-pointer"
                      onClick={() => { setEditId(t.id); setViewMode('submissions'); setTopTab('create') }}>
                      <div className="flex items-center gap-4 p-4">
                        {/* 컬러 바 */}
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: `linear-gradient(135deg, ${t.bgColor}, ${t.bgColor}cc)` }}>
                          <ClipboardList size={20} className="text-white" />
                        </div>
                        {/* 신청서 정보 */}
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] font-extrabold text-[var(--text-primary)] truncate">{t.name}</div>
                          <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] mt-1">
                            <span>섹션 {t.sections.length}개</span>
                            <span>•</span>
                            <span>필드 {t.sections.reduce((a, s) => a + s.fields.length, 0)}개</span>
                            <span>•</span>
                            <span>{t.createdAt}</span>
                          </div>
                        </div>
                        {/* 접수 건수 */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {count > 0 ? (
                            <div className="text-right">
                              <div className="text-[18px] font-extrabold text-primary-500">{count}<span className="text-[11px] font-bold text-[var(--text-muted)] ml-1">건</span></div>
                              <div className="flex gap-1 mt-1">
                                {Object.entries(statusMap).slice(0, 3).map(([status, cnt]) => (
                                  <span key={status} className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--bg-muted)] text-[var(--text-muted)]">
                                    {status} {cnt}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[12px] text-[var(--text-muted)]">접수 없음</span>
                          )}
                          <ChevronDown size={16} className="text-[var(--text-muted)] -rotate-90" />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  /* ═══════════════════════════════════════════
     접수 관리 뷰
     ═══════════════════════════════════════════ */
  if (viewMode === 'submissions' && editing) {
    const selectedSub = submissions.find(s => s.id === selectedSubmissionId) || null
    const statusCounts: Record<string, number> = {}
    submissionsForTemplate.forEach(s => { statusCounts[s.status] = (statusCounts[s.status] || 0) + 1 })

    return (
      <div className="space-y-3">
        {/* 상단 바 */}
        <div className="flex items-center gap-3">
          <button onClick={() => { setEditId(null); setViewMode('list'); setTopTab('manage') }}
            className="flex items-center gap-1 text-[12px] font-bold text-[var(--text-muted)] hover:text-primary-500 cursor-pointer transition-colors">
            <ChevronLeft size={16} /> 목록으로
          </button>
          <div className="text-[15px] font-extrabold text-[var(--text-primary)] flex-1">{editing.name} — 접수 관리</div>
          <button onClick={() => setViewMode('builder')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-[var(--border-default)] text-[var(--text-muted)] hover:text-primary-500 hover:border-primary-400 cursor-pointer transition-all">
            <Settings2 size={13} /> 양식 편집
          </button>
        </div>

        {/* 상태 필터 배지 */}
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setSubmissionFilter('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${submissionFilter === 'all' ? 'bg-[var(--text-primary)] text-white border-transparent' : 'border-[var(--border-default)] text-[var(--text-muted)] hover:border-primary-400'}`}>
            전체 <span className="bg-white/20 px-1.5 rounded-full text-[10px]">{submissionsForTemplate.length}</span>
          </button>
          {editing.workflow.map(step => {
            const cnt = statusCounts[step.label] || 0
            return (
              <button key={step.id} onClick={() => setSubmissionFilter(step.label)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${submissionFilter === step.label ? 'text-white border-transparent' : 'border-[var(--border-default)] text-[var(--text-muted)] hover:border-primary-400'}`}
                style={submissionFilter === step.label ? { background: step.color, borderColor: step.color } : {}}>
                {step.label} <span className={`px-1.5 rounded-full text-[10px] ${submissionFilter === step.label ? 'bg-white/20' : 'bg-[var(--bg-muted)]'}`}>{cnt}</span>
              </button>
            )
          })}
        </div>

        {/* 접수 목록 */}
        {filteredSubmissions.length === 0 ? (
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-12 text-center">
            <ClipboardList size={40} className="mx-auto text-[var(--text-muted)] mb-3" />
            <div className="text-[14px] font-bold text-[var(--text-secondary)] mb-1">접수된 신청서가 없습니다</div>
            <div className="text-[12px] text-[var(--text-muted)]">홈페이지에서 신청서가 접수되면 여기에 표시됩니다</div>
          </div>
        ) : (
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
            <table className="w-full text-left">
              {(() => {
                // 유효한 관리필드만 필터링 (allFields에 존재하는 것만)
                const validManagedFields = editing.managedFields.filter(fid => allFields.find(af => af.id === fid))
                return (
                  <>
              <thead>
                <tr className="border-b border-[var(--border-default)] bg-[var(--bg-muted)]">
                  <th className="px-4 py-2.5 text-[11px] font-extrabold text-[var(--text-muted)]">상태</th>
                  {validManagedFields.map(fid => {
                    const f = allFields.find(af => af.id === fid)!
                    return <th key={fid} className="px-4 py-2.5 text-[11px] font-extrabold text-[var(--text-muted)]">{f.label}</th>
                  })}
                  <th className="px-4 py-2.5 text-[11px] font-extrabold text-[var(--text-muted)]">신청일</th>
                  <th className="px-4 py-2.5 text-[11px] font-extrabold text-[var(--text-muted)]"></th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map(sub => {
                  const stepColor = editing.workflow.find(w => w.label === sub.status)?.color || '#64748b'
                  return (
                    <tr key={sub.id} className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
                      onClick={() => setSelectedSubmissionId(sub.id === selectedSubmissionId ? null : sub.id)}>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold text-white" style={{ background: stepColor }}>{sub.status}</span>
                      </td>
                      {validManagedFields.map(fid => {
                        if (fid.startsWith('cat_')) {
                          const secId = fid.replace('cat_', '')
                          const selectedIds = (sub as any).selectedFields?.[secId] || []
                          const sec = editing.sections.find(s => s.id === secId)
                          const labels = selectedIds.map((id: string) => {
                            const found = sec?.fields.find(f => f.id === id)
                            return found ? found.label : id
                          }).filter((l: string) => l && !/^[a-z0-9]{6,}$/.test(l))
                          // fallback: 라벨 변환 실패 시 전체 필드에서 검색
                          if (labels.length === 0 && selectedIds.length > 0) {
                            selectedIds.forEach((id: string) => {
                              for (const s of editing.sections) {
                                const ff = s.fields.find(f => f.id === id)
                                if (ff) { labels.push(ff.label); break }
                              }
                            })
                          }
                          return <td key={fid} className="px-4 py-3 text-[12px] text-[var(--text-primary)]">{labels.join(', ') || '-'}</td>
                        }
                        return <td key={fid} className="px-4 py-3 text-[12px] text-[var(--text-primary)]">{sub.data[fid] || '-'}</td>
                      })}
                      <td className="px-4 py-3 text-[11px] text-[var(--text-muted)]">{(sub as any).submittedAt || (sub as any).date || '-'}</td>
                      <td className="px-4 py-3">
                        <button onClick={(e) => { e.stopPropagation(); deleteSubmission(sub.id) }}
                          className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--text-muted)] hover:text-red-500 cursor-pointer">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
                  </>
                )
              })()}
            </table>
          </div>
        )}

        {/* 상세 모달 */}
        {selectedSub && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={() => setSelectedSubmissionId(null)}>
            <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)]">
                <div className="flex items-center gap-3">
                  <span className="text-[14px] font-extrabold text-[var(--text-primary)]">접수 상세</span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white"
                    style={{ background: editing.workflow.find(w => w.label === selectedSub.status)?.color || '#64748b' }}>
                    {selectedSub.status}
                  </span>
                </div>
                <button onClick={() => setSelectedSubmissionId(null)} className="p-1.5 rounded-lg hover:bg-[var(--bg-muted)] text-[var(--text-muted)] cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              {/* 상태 변경 */}
              <div className="px-5 py-3 border-b border-[var(--border-default)] bg-[var(--bg-muted)]">
                <div className="text-[10px] font-bold text-[var(--text-muted)] mb-2">상태 변경</div>
                <div className="flex gap-1.5 flex-wrap">
                  {editing.workflow.map(step => (
                    <button key={step.id} onClick={() => updateSubmissionStatus(selectedSub.id, step.label)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border-2 transition-all cursor-pointer ${selectedSub.status === step.label ? 'text-white border-transparent' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      style={{ background: selectedSub.status === step.label ? step.color : step.color + '20', color: selectedSub.status === step.label ? 'white' : step.color, borderColor: selectedSub.status === step.label ? step.color : 'transparent' }}>
                      {step.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 접수 데이터 */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                <div className="text-[11px] text-[var(--text-muted)] mb-1">신청일: {(selectedSub as any).submittedAt || (selectedSub as any).date || '-'}</div>
                {editing.sections.map(sec => (
                  <div key={sec.id} className="bg-[var(--bg-muted)] rounded-xl p-3">
                    <div className="text-[11px] font-extrabold mb-2" style={{ color: sec.titleColor }}>{sec.titleText}</div>
                    {sec.type === 'privacy_consent' ? (
                      <div className="flex items-start gap-2 py-1.5">
                        <span className="text-[11px] font-bold text-[var(--text-muted)] min-w-[80px] shrink-0">동의여부</span>
                        <span className="text-[12px] text-green-600 font-bold">✓ 동의함</span>
                      </div>
                    ) : sec.type === 'category' ? (
                      /* 접수분야: 선택된 항목 + 세부내용 표시 */
                      (() => {
                        const selectedIds = (selectedSub as any).selectedFields?.[sec.id] || []
                        const selectedFieldItems = sec.fields.filter(f => selectedIds.includes(f.id))
                        return selectedFieldItems.length > 0 ? (
                          <div className="space-y-2">
                            {selectedFieldItems.map(f => (
                              <div key={f.id} className="flex items-start gap-2 py-1.5 border-b border-[var(--border-default)] last:border-0">
                                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0"
                                  style={{ background: `${sec.titleColor}15`, color: sec.titleColor }}>
                                  {f.label}
                                </span>
                                {selectedSub.data[f.id] && (
                                  <span className="text-[12px] text-[var(--text-primary)] break-all">{selectedSub.data[f.id]}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-[var(--text-muted)]">선택 없음</span>
                        )
                      })()
                    ) : (
                      sec.fields.map(f => (
                        <div key={f.id} className="flex items-start gap-2 py-1.5 border-b border-[var(--border-default)] last:border-0">
                          <span className="text-[11px] font-bold text-[var(--text-muted)] min-w-[80px] shrink-0">{f.label}</span>
                          <span className="text-[12px] text-[var(--text-primary)] break-all">{selectedSub.data[f.id] || '-'}</span>
                        </div>
                      ))
                    )}
                  </div>
                ))}
                {/* 비밀번호 */}
                {(() => {
                  // phone 타입 필드에서 전화번호 찾기
                  let phoneVal = (selectedSub as any).phone || ''
                  if (!phoneVal) {
                    editing.sections.forEach(sec => {
                      sec.fields.forEach(f => {
                        if (f.type === 'phone' && selectedSub.data[f.id]) phoneVal = selectedSub.data[f.id]
                      })
                    })
                  }
                  return (
                    <div className="bg-[var(--bg-muted)] rounded-xl p-3">
                      <div className="text-[11px] font-extrabold mb-2" style={{ color: '#6366f1' }}>조회 정보</div>
                      <div className="flex items-start gap-2 py-1.5 border-b border-[var(--border-default)]">
                        <span className="text-[11px] font-bold text-[var(--text-muted)] min-w-[80px] shrink-0">전화번호</span>
                        <span className="text-[12px] text-[var(--text-primary)]">{phoneVal || '-'}</span>
                      </div>
                      <div className="flex items-start gap-2 py-1.5">
                        <span className="text-[11px] font-bold text-[var(--text-muted)] min-w-[80px] shrink-0">비밀번호</span>
                        <span className="text-[12px] text-[var(--text-primary)]">{selectedSub.data?.['__pwd'] || (selectedSub as any).pwd || '-'}</span>
                      </div>
                    </div>
                  )
                })()}
              </div>

              <div className="px-5 py-3 border-t border-[var(--border-default)] flex justify-end gap-2">
                <button onClick={() => deleteSubmission(selectedSub.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors">
                  <Trash2 size={13} /> 삭제
                </button>
                <button onClick={() => setSelectedSubmissionId(null)}
                  className="px-4 py-1.5 rounded-lg text-[11px] font-bold bg-primary-500 text-white hover:bg-primary-600 cursor-pointer transition-colors">
                  닫기
                </button>
              </div>
            </div>
          </div>,
          document.body
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
        <button onClick={() => { setEditId(null); setViewMode('list') }}
          className="p-2 rounded-xl border border-[var(--border-default)] text-[var(--text-muted)] hover:text-red-500 hover:border-red-300 transition-all cursor-pointer" title="닫기">
          <X size={16} />
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
                <tab.icon size={14} /> {tab.label}
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
                  isFirst={i === 0} isLast={i === editing.sections.length - 1}
                  onFocus={() => setActiveSectionId(sec.id)} />
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
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[12px] font-extrabold text-[var(--text-primary)] flex items-center gap-1.5">
                    <ClipboardList size={14} className="text-primary-500" /> 관리항목 (리스트에 표시할 필드)
                  </div>
                  <button
                    onClick={() => setShowMgmtPreview(v => !v)}
                    title="관리 형태 미리보기"
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                      showMgmtPreview
                        ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                        : 'bg-[var(--bg-muted)] text-[var(--text-muted)] border-[var(--border-default)] hover:border-primary-400 hover:text-primary-500'
                    }`}
                  >
                    <LayoutList size={12} />
                    {showMgmtPreview ? '미리보기 ON' : '목록 미리보기'}
                  </button>
                </div>
                {allFields.length === 0 ? (
                  <div className="text-[11px] text-[var(--text-muted)] py-2">섹션에 필드를 먼저 추가해주세요</div>
                ) : (
                  <div className="space-y-1">
                    {allFields.map(f => (
                      <label key={f.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-[var(--bg-muted)] cursor-pointer transition-colors">
                        <input type="checkbox" checked={editing.managedFields.includes(f.id)}
                          onChange={() => toggleManagedField(f.id)} className="accent-primary-500" />
                        <span className="text-[12px] font-bold text-[var(--text-primary)]">{'isSectionGroup' in f && f.isSectionGroup ? '🗂 ' : ''}{f.label}</span>
                        {'isSectionGroup' in f && f.isSectionGroup
                          ? <span className="text-[9px] font-extrabold text-primary-500 bg-primary-50 dark:bg-primary-900/20 px-1.5 py-0.5 rounded-full">접수분야 전체</span>
                          : <span className="text-[10px] text-[var(--text-muted)]">({f.sectionTitle})</span>
                        }
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* 진행절차 */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4">
                <div className="text-[12px] font-extrabold text-[var(--text-primary)] flex items-center gap-1.5 mb-3">
                  <RefreshCw size={14} className="inline -mt-0.5" /> 진행절차
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
                    <Plus size={14} /> 단계 추가
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 오른쪽: 실시간 미리보기 ── */}
        <div ref={previewScrollRef} className="lg:sticky lg:top-4 pb-12" style={{ maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' }}>
          <div className="flex items-center gap-1.5 mb-2">
            {showMgmtPreview ? (
              <><LayoutList size={14} className="text-primary-500" />
              <span className="text-[12px] font-extrabold text-[var(--text-primary)]">관리 형태 미리보기</span>
              <span className="ml-1 text-[9px] font-bold text-primary-500 bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded-full">목록 관리 화면</span>
              <button
                onClick={() => setShowMgmtPreview(false)}
                className="ml-auto flex items-center gap-1 text-[10px] font-bold text-[var(--text-muted)] hover:text-primary-500 px-2 py-0.5 rounded-lg hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
              >
                <Eye size={12} /> 신청서 미리보기로 전환
              </button></>
            ) : (
              <><Eye size={14} className="text-primary-500" />
              <span className="text-[12px] font-extrabold text-[var(--text-primary)]">실시간 미리보기</span>
              {activeSectionId && (
                <span className="ml-2 text-[10px] font-bold text-primary-500 bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse"></span>
                  편집 중인 섹션 추적 중
                </span>
              )}</>
            )}
          </div>
          {showMgmtPreview ? (
            <MgmtPreview tpl={editing} managedFields={editing.managedFields} allFields={allFields} />
          ) : (
            <FormPreview tpl={editing} activeSectionId={activeSectionId} scrollContainerRef={previewScrollRef} />
          )}
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
