import React, { useState, useMemo } from 'react'
import { getItem, setItem } from '../../../utils/storage'
import { useToastStore } from '../../../stores/toastStore'
import { Settings2, TrendingUp, Search, ChevronDown, Plus, Edit3, Trash2, X, Settings } from 'lucide-react'


export default function AcctAccountsMgmt() {
  const [refresh, setRefresh] = useState(0)
  const accounts = useMemo(() => {
    const raw = getItem<AcctAccount[]>('acct_accounts', [])
    return raw.map(a => ({ ...a, source: a.source || (SYSTEM_CODES.has(a.code) ? 'system' as const : 'user' as const) }))
  }, [refresh])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [editModal, setEditModal] = useState(false)
  const [editTarget, setEditTarget] = useState<AcctAccount | null>(null)
  const [form, setForm] = useState({ code: '', name: '', type: 'expense', group: '', side: 'debit' as 'debit' | 'credit' })
  const [collapsedTypes, setCollapsedTypes] = useState<Record<string, boolean>>({})
  const toggleType = (type: string) => setCollapsedTypes(prev => ({ ...prev, [type]: !prev[type] }))
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})
  const toggleGroup = (key: string) => setCollapsedGroups(prev => ({ ...prev, [key]: !prev[key] }))
  const [contraPopupCode, setContraPopupCode] = useState<string | null>(null)
  const [groupModal, setGroupModal] = useState(false)
  const [groupForm, setGroupForm] = useState({ type: '', name: '' })
  const openGroupAdd = (type: string) => {
    setGroupForm({ type, name: '' })
    setGroupModal(true)
  }
  const handleGroupSave = () => {
    if (!groupForm.name.trim()) return
    // 빈 계정을 하나 추가하여 그룹이 나타나도록 함 (그룹은 계정의 group 필드로 존재)
    const all = getItem<AcctAccount[]>('acct_accounts', [])
    const typePrefixMap: Record<string, string> = { asset: '1', liability: '2', equity: '3', revenue: '4', expense: '5' }
    const prefix = typePrefixMap[groupForm.type] || '9'
    // 해당 타입에서 사용 가능한 중분류 번호 찾기
    const usedMids = all.filter(a => a.type === groupForm.type).map(a => { const p = a.code.split('-'); return parseInt(p[1], 10) || 0 })
    const maxMid = usedMids.length > 0 ? Math.max(...usedMids) : 0
    const newMid = String(maxMid + 1).padStart(2, '0')
    const newCode = `${prefix}-${newMid}-01`
    all.push({ code: newCode, name: `${groupForm.name.trim()} (기본)`, type: groupForm.type, group: groupForm.name.trim(), source: 'user' })
    setItem('acct_accounts', all)
    setGroupModal(false)
    setRefresh(r => r + 1)
  }

  /* 자동 코드 생성: 해당 그룹의 마지막 코드 + 1 */
  const generateNextCode = (type: string, group: string) => {
    const all = getItem<AcctAccount[]>('acct_accounts', [])
    const sameGroup = all.filter(a => a.type === type && a.group === group).sort((a, b) => a.code.localeCompare(b.code))
    if (sameGroup.length === 0) {
      // 그룹의 중분류 코드 추출 시도
      const typePrefixMap: Record<string, string> = { asset: '1', liability: '2', equity: '3', revenue: '4', expense: '5' }
      const prefix = typePrefixMap[type] || '9'
      return `${prefix}-99-01`
    }
    const lastCode = sameGroup[sameGroup.length - 1].code
    const parts = lastCode.split('-')
    if (parts.length === 3) {
      const nextNum = (parseInt(parts[2], 10) || 0) + 1
      return `${parts[0]}-${parts[1]}-${String(nextNum).padStart(2, '0')}`
    }
    return ''
  }

  const filtered = useMemo(() => {
    let list = accounts
    if (filterType !== 'all') list = list.filter(a => a.type === filterType)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(a => a.code.includes(q) || a.name.toLowerCase().includes(q) || (a.group || '').toLowerCase().includes(q))
    }
    return list.sort((a, b) => a.code.localeCompare(b.code))
  }, [accounts, filterType, search])

  const typeGrouped = useMemo(() => {
    const typeOrder = ACCT_TYPES.map(t => t.value)
    const result: { type: string; label: string; color: string; groups: { groupName: string; items: AcctAccount[] }[] }[] = []
    const typeMap: Record<string, Record<string, AcctAccount[]>> = {}
    filtered.forEach(a => {
      const t = a.type || 'expense'
      const g = a.group || '기타'
      if (!typeMap[t]) typeMap[t] = {}
      if (!typeMap[t][g]) typeMap[t][g] = []
      typeMap[t][g].push(a)
    })
    typeOrder.forEach(t => {
      if (!typeMap[t]) return
      const ti = ACCT_TYPES.find(x => x.value === t)!
      const groups = Object.entries(typeMap[t]).map(([gn, items]) => ({ groupName: gn, items: items.sort((a, b) => a.code.localeCompare(b.code)) }))
      result.push({ type: t, label: ti.label, color: ti.color, groups })
    })
    Object.keys(typeMap).filter(t => !typeOrder.includes(t)).forEach(t => {
      const groups = Object.entries(typeMap[t]).map(([gn, items]) => ({ groupName: gn, items: items.sort((a, b) => a.code.localeCompare(b.code)) }))
      result.push({ type: t, label: t, color: '#6b7280', groups })
    })
    return result
  }, [filtered])

  const openAdd = (preType?: string, preGroup?: string) => {
    setEditTarget(null)
    const t = preType || 'expense'
    const g = preGroup || ''
    const defaultSide = DEBIT_TYPES.includes(t) ? 'debit' : 'credit'
    const autoCode = g ? generateNextCode(t, g) : ''
    setForm({ code: autoCode, name: '', type: t, group: g, side: defaultSide as 'debit' | 'credit' })
    setEditModal(true)
  }
  const openEdit = (a: AcctAccount) => {
    setEditTarget(a)
    const dc = getDebitCredit(a.type, a.code)
    const currentSide = dc.label === '차변' ? 'debit' : 'credit'
    setForm({ code: a.code, name: a.name, type: a.type, group: a.group || '', side: currentSide as 'debit' | 'credit' })
    setEditModal(true)
  }
  const handleSave = () => {
    if (!form.code.trim() || !form.name.trim()) return
    const all = getItem<AcctAccount[]>('acct_accounts', [])
    if (editTarget) {
      const updated = all.map(a => a.code === editTarget.code ? { ...a, name: form.name.trim(), type: form.type, group: form.group.trim(), side: form.side } : a)
      setItem('acct_accounts', updated)
    } else {
      if (all.some(a => a.code === form.code.trim())) return
      all.push({ code: form.code.trim(), name: form.name.trim(), type: form.type, group: form.group.trim(), source: 'user', side: form.side })
      setItem('acct_accounts', all)
    }
    setEditModal(false)
    setRefresh(r => r + 1)
  }
  const handleDelete = (code: string) => {
    const all = getItem<AcctAccount[]>('acct_accounts', [])
    setItem('acct_accounts', all.filter(a => a.code !== code))
    setRefresh(r => r + 1)
  }

  const [acctTab, setAcctTab] = useState<'all' | 'income'>('all')

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* ── 탭 ── */}
      <div className="flex items-center gap-1 bg-[var(--bg-muted)] rounded-xl p-1 border border-[var(--border-default)] w-fit">
        <button onClick={() => setAcctTab('all')}
          className={cn('flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-bold transition-all cursor-pointer',
            acctTab === 'all' ? 'bg-primary-500 text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]')}>
          <Settings2 size={13} /> 전체계정
        </button>
        <button onClick={() => setAcctTab('income')}
          className={cn('flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-bold transition-all cursor-pointer',
            acctTab === 'income' ? 'bg-emerald-500 text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]')}>
          <TrendingUp size={13} /> 입금계정
        </button>
      </div>

      {acctTab === 'all' ? (
      <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 size={18} className="text-primary-500" />
          <span className="text-base font-extrabold text-[var(--text-primary)]">계정과목 관리</span>
          <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-muted)] px-2 py-0.5 rounded-full">{filtered.length}개</span>
          <span className="mx-1 text-[var(--border-default)]">|</span>
          <span className="flex items-center gap-1 text-[10px] font-bold text-[#4f6ef7]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4f6ef7]" />차변
            <span className="text-[9px] font-normal text-[var(--text-muted)] ml-0.5">= 자산·비용 증가</span>
          </span>
          <span className="flex items-center gap-1 text-[10px] font-bold text-[#ef4444]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />대변
            <span className="text-[9px] font-normal text-[var(--text-muted)] ml-0.5">= 부채·자본·수익 증가</span>
          </span>
        </div>
        <button onClick={() => openAdd()} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary-500 text-white text-[12px] font-bold cursor-pointer hover:bg-primary-600 transition-colors shadow-sm">
          <Plus size={14} /> 계정 추가
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="코드, 과목명, 그룹 검색..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] outline-none focus:border-primary-400" />
        </div>
        <div className="flex items-center gap-1 bg-[var(--bg-muted)] rounded-lg p-0.5 border border-[var(--border-default)]">
          <button onClick={() => setFilterType('all')} className={cn('px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer', filterType === 'all' ? 'bg-primary-500 text-white shadow-sm' : 'text-[var(--text-muted)]')}>전체</button>
          {ACCT_TYPES.map(t => (
            <button key={t.value} onClick={() => setFilterType(t.value)} className={cn('px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer', filterType === t.value ? 'text-white shadow-sm' : 'text-[var(--text-muted)]')} style={filterType === t.value ? { background: t.color } : {}}>{t.label}</button>
          ))}
        </div>
      </div>

      {typeGrouped.length === 0 ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-8">
          <EmptyState emoji="📋" title="등록된 계정과목이 없습니다" />
        </div>
      ) : (
        <div className="space-y-2">
          {typeGrouped.map(ts => {
            const collapsed = collapsedTypes[ts.type]
            const cnt = ts.groups.reduce((s, g) => s + g.items.length, 0)
            const dc = getDebitCredit(ts.type)
            return (
              <div key={ts.type} className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
                <button onClick={() => toggleType(ts.type)}
                  className="w-full px-4 py-3 flex items-center gap-2 cursor-pointer hover:bg-[var(--bg-muted)] transition-colors border-b border-[var(--border-default)]"
                  style={{ background: `${ts.color}06` }}>
                  <ChevronDown size={14} className={cn('transition-transform shrink-0', collapsed && '-rotate-90')} style={{ color: ts.color }} />
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: ts.color }} />
                  <span className="text-[13px] font-extrabold text-[var(--text-primary)]">{ts.label}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">{cnt}</span>
                  <div className="flex-1" />
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full w-[36px] text-center shrink-0" style={{ color: dc.color, background: `${dc.color}12` }}>{dc.label}</span>
                  <span onClick={e => { e.stopPropagation(); openGroupAdd(ts.type) }}
                    className="text-[10px] font-bold text-primary-500 hover:text-primary-600 flex items-center gap-0.5 cursor-pointer w-[80px] justify-end shrink-0">
                    <Plus size={11} /> 그룹 추가
                  </span>
                </button>
                {!collapsed && ts.groups.map(grp => {
                  const grpKey = `${ts.type}:${grp.groupName}`
                  const grpCollapsed = collapsedGroups[grpKey]
                  return (
                  <div key={grp.groupName}>
                    <div className="px-4 py-1.5 bg-[var(--bg-muted)] border-b border-[var(--border-default)] flex items-center gap-2 cursor-pointer hover:bg-[var(--bg-muted)]/80 transition-colors"
                      onClick={() => toggleGroup(grpKey)}>
                      <ChevronDown size={11} className={cn('transition-transform shrink-0 text-[var(--text-muted)]', grpCollapsed && '-rotate-90')} />
                      <span className="text-[11px] font-bold text-[var(--text-secondary)]">{grp.groupName}</span>
                      <span className="text-[9px] text-[var(--text-muted)]">{grp.items.length}건</span>
                      <div className="flex-1" />
                      <button onClick={e => { e.stopPropagation(); openAdd(ts.type, grp.groupName) }}
                        className="text-[10px] font-bold text-primary-500 hover:text-primary-600 flex items-center gap-0.5 cursor-pointer w-[80px] justify-end shrink-0">+ 소과목 추가</button>
                    </div>
                    {!grpCollapsed && grp.items.map(a => {
                      const isSys = a.source === 'system' || SYSTEM_CODES.has(a.code)
                      const dc2 = getDebitCredit(a.type, a.code, a.side)
                      const isDebitSide = dc2.label === '차변'

                      // 자주 사용되는 상대계정 우선순위 매핑
                      const frequentContraMap: Record<string, string[]> = {
                        // 자산 계정의 빈번한 상대계정
                        'asset': ['4-01-01', '4-01-02', '4-01-03', '2-01-01', '2-01-04', '2-01-06', '2-01-08', '2-01-09', '3-03-03',
                                  '5-02-01', '5-02-04', '5-02-05', '5-02-06', '5-02-07', '5-02-08', '5-02-09', '5-02-10',
                                  '5-02-12', '5-02-14', '5-02-15', '5-02-21', '5-02-22', '5-02-24', '5-02-25',
                                  '1-01-01', '1-01-03'],
                        // 부채 계정의 빈번한 상대계정
                        'liability': ['1-01-01', '1-01-03', '1-01-06', '1-01-07', '1-01-10', '5-02-01', '5-02-03'],
                        // 자본 계정의 빈번한 상대계정
                        'equity': ['1-01-01', '1-01-03', '1-01-04'],
                        // 수익 계정의 빈번한 상대계정
                        'revenue': ['1-01-01', '1-01-03', '1-01-06', '1-01-07', '1-01-10'],
                        // 비용 계정의 빈번한 상대계정
                        'expense': ['1-01-01', '1-01-03', '2-01-04', '2-01-08', '1-01-12'],
                      }
                      const priorityCodes = new Set(frequentContraMap[a.type] || [])

                      // 상대계정 후보 + 우선순위 정렬 (비활성 계정 제외)
                      const contraTypes = isDebitSide ? ['liability', 'equity', 'revenue', 'asset', 'expense'] : ['asset', 'expense', 'liability', 'revenue']
                      const contraAll = accounts.filter(ca => ca.code !== a.code && contraTypes.includes(ca.type) && ca.active !== false)
                      const contraList = [
                        ...contraAll.filter(ca => priorityCodes.has(ca.code)),
                        ...contraAll.filter(ca => !priorityCodes.has(ca.code))
                      ].slice(0, 60)

                      const showContraPopup = contraPopupCode === a.code
                      return (
                        <div key={a.code} className={cn("flex items-center gap-2 px-4 py-2 border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-muted)] transition-colors group relative", a.active === false && 'opacity-40')}>
                          <button
                            onClick={() => {
                              const all = getItem<AcctAccount[]>('acct_accounts', [])
                              const updated = all.map(x => x.code === a.code ? { ...x, active: a.active === false ? true : false } : x)
                              setItem('acct_accounts', updated)
                              setRefresh(r => r + 1)
                            }}
                            className={cn('w-[32px] h-[16px] rounded-full transition-colors shrink-0 cursor-pointer relative', a.active === false ? 'bg-gray-300 dark:bg-gray-600' : 'bg-emerald-500')}
                            title={a.active === false ? '비활성 — 클릭하여 활성화' : '활성 — 클릭하여 비활성화'}
                          >
                            <span className={cn('absolute top-[2px] w-[12px] h-[12px] rounded-full bg-white shadow-sm transition-all', a.active === false ? 'left-[2px]' : 'left-[18px]')} />
                          </button>
                          <span className={cn("text-[12px] font-mono font-bold w-[80px] shrink-0", a.active === false ? 'text-[var(--text-muted)]' : 'text-primary-500')}>{a.code}</span>
                          <span
                            className="text-[12px] font-bold text-[var(--text-primary)] w-[140px] shrink-0 truncate cursor-pointer hover:text-primary-500 hover:underline transition-colors"
                            onClick={() => setContraPopupCode(showContraPopup ? null : a.code)}
                            title="클릭하여 상대계정 목록 보기"
                          >{a.name}</span>
                          <input
                            defaultValue={a.description || ''}
                            placeholder="설명 입력..."
                            onBlur={e => {
                              const val = e.target.value.trim()
                              if (val !== (a.description || '')) {
                                const all = getItem<AcctAccount[]>('acct_accounts', [])
                                const updated = all.map(x => x.code === a.code ? { ...x, description: val } : x)
                                setItem('acct_accounts', updated)
                              }
                            }}
                            onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                            className="flex-1 text-[11px] text-[var(--text-muted)] bg-transparent border-0 outline-none px-1 py-0.5 rounded hover:bg-[var(--bg-muted)] focus:bg-[var(--bg-surface)] focus:ring-1 focus:ring-primary-300 transition-all placeholder:text-[var(--text-muted)]/40"
                          />
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded w-[36px] text-center shrink-0" style={{ color: dc2.color, background: `${dc2.color}12` }}>{dc2.label}</span>
                          <span className="w-[52px] shrink-0 text-center">
                            {isSys ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--bg-muted)] text-[var(--text-muted)]">◇ 시스템</span>
                            ) : (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded text-green-600 dark:text-green-400" style={{ background: 'rgba(34,197,94,.12)' }}>◆ 사용자</span>
                            )}
                          </span>
                          {!isSys ? (
                            <div className="flex items-center gap-0.5 w-[52px] shrink-0 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEdit(a)} className="p-1 rounded text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer transition-colors"><Edit3 size={12} /></button>
                              <button onClick={() => handleDelete(a.code)} className="p-1 rounded text-[#ef4444] hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors"><Trash2 size={12} /></button>
                            </div>
                          ) : (
                            <div className="w-[52px] shrink-0" />
                          )}
                          {/* 상대계정 팝업 — 상황별 분개 */}
                          {showContraPopup && (() => {
                            // 상황 설명 생성 함수
                            const getSituation = (main: typeof a, contra: typeof a) => {
                              const mt = main.type; const ct = contra.type
                              if (mt === 'asset' && ct === 'revenue') return `${contra.name} 발생 → ${main.name} 입금`
                              if (mt === 'asset' && ct === 'liability') return `${contra.name} 발생/증가`
                              if (mt === 'asset' && ct === 'equity') return `${contra.name} 출자/증자`
                              if (mt === 'asset' && ct === 'asset') return `${contra.name}에서 ${main.name}으로 이동`
                              if (mt === 'asset' && ct === 'expense') return `${contra.name} 지급 시`
                              if (mt === 'expense' && ct === 'asset') return `${contra.name}에서 출금`
                              if (mt === 'expense' && ct === 'liability') return `${contra.name}으로 미지급 처리`
                              if (mt === 'liability' && ct === 'asset') return `${contra.name}으로 상환`
                              if (mt === 'liability' && ct === 'expense') return `${contra.name} 비용 정산`
                              if (mt === 'revenue' && ct === 'asset') return `${contra.name}으로 수령`
                              if (mt === 'equity' && ct === 'asset') return `${contra.name}으로 배당/감자`
                              return `${contra.name} 거래`
                            }
                            // 헤더 상황 텍스트
                            const headerText = (() => {
                              switch (a.type) {
                                case 'asset': return `💰 ${a.name}(이/가) 들어올 때 · 나갈 때`
                                case 'expense': return `📤 ${a.name}(을/를) 지출할 때`
                                case 'liability': return `📥 ${a.name}(이/가) 발생 · 상환할 때`
                                case 'revenue': return `💵 ${a.name}(이/가) 발생할 때`
                                case 'equity': return `🏦 ${a.name}(이/가) 변동할 때`
                                default: return `${a.name} 거래 시`
                              }
                            })()
                            return (
                            <div className="absolute left-[86px] top-full mt-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-2xl z-50 w-[460px] overflow-hidden"
                              style={{ maxHeight: '420px' }}>
                              {/* 헤더 */}
                              <div className="px-3 py-2.5 border-b border-[var(--border-default)] bg-[var(--bg-muted)]/50 flex items-center justify-between">
                                <div>
                                  <div className="text-[12px] font-bold text-[var(--text-primary)]">{headerText}</div>
                                  <div className="text-[9px] text-[var(--text-muted)] mt-0.5 font-mono">{a.code} · {a.group}</div>
                                </div>
                                <button onClick={() => setContraPopupCode(null)} className="p-1 rounded hover:bg-[var(--bg-muted)] text-[var(--text-muted)] cursor-pointer">
                                  <X size={14} />
                                </button>
                              </div>
                              {/* 테이블 헤더 */}
                              <div className="flex border-b border-[var(--border-default)]">
                                <div className="w-[120px] shrink-0 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/10">
                                  <span className="text-[10px] font-bold text-[#4f6ef7]">차변 (Debit)</span>
                                </div>
                                <div className="w-[120px] shrink-0 px-3 py-1.5 bg-red-50 dark:bg-red-900/10 border-l border-[var(--border-default)]">
                                  <span className="text-[10px] font-bold text-[#ef4444]">대변 (Credit)</span>
                                </div>
                                <div className="flex-1 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/10 border-l border-[var(--border-default)]">
                                  <span className="text-[10px] font-bold text-amber-600">상황 설명</span>
                                </div>
                              </div>
                              {/* 동기 스크롤 본문 */}
                              <div className="max-h-[300px] overflow-y-auto">
                                {contraList.map(ca => (
                                  <div key={ca.code} className="flex items-center border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-muted)]/50 transition-colors">
                                    <div className="w-[120px] shrink-0 px-3 py-1.5">
                                      {isDebitSide ? (
                                        <div className="text-[10px] font-bold text-[#4f6ef7] truncate">{a.name}</div>
                                      ) : (
                                        <div className="text-[10px] font-bold text-[#4f6ef7] truncate">{ca.name}</div>
                                      )}
                                    </div>
                                    <div className="w-[120px] shrink-0 px-3 py-1.5 border-l border-[var(--border-default)]">
                                      {isDebitSide ? (
                                        <div className="text-[10px] font-bold text-[#ef4444] truncate">{ca.name}</div>
                                      ) : (
                                        <div className="text-[10px] font-bold text-[#ef4444] truncate">{a.name}</div>
                                      )}
                                    </div>
                                    <div className="flex-1 px-3 py-1.5 border-l border-[var(--border-default)]">
                                      <div className="text-[10px] text-[var(--text-secondary)] truncate">{getSituation(a, ca)}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            )
                          })()}
                        </div>
                      )
                    })}
                  </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {editModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setEditModal(false)}>
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-2xl w-[420px] max-w-[90vw]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-default)]">
              <span className="text-[14px] font-extrabold text-[var(--text-primary)]">{editTarget ? '계정과목 수정' : '계정과목 추가'}</span>
              <button onClick={() => setEditModal(false)} className="p-1 rounded-lg hover:bg-[var(--bg-muted)] cursor-pointer transition-colors"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">계정코드 *</label>
                  <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="예) 5-02-26"
                    className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none font-mono" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">과목명 *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="예) 회의비"
                    className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">구분</label>
                  <div className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-sm text-[var(--text-secondary)] font-bold">
                    {ACCT_TYPES.find(t => t.value === form.type)?.label || form.type}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">그룹</label>
                  <div className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-sm text-[var(--text-secondary)] font-bold truncate">
                    {form.group || '-'}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">차대변 분류</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setForm(f => ({ ...f, side: 'debit' }))}
                    className={cn('flex-1 px-3 py-2.5 rounded-lg border text-sm font-bold transition-all cursor-pointer',
                      form.side === 'debit' ? 'border-[#4f6ef7] bg-[#4f6ef7]/10 text-[#4f6ef7]' : 'border-[var(--border-default)] text-[var(--text-muted)] hover:bg-[var(--bg-muted)]')}>
                    차변 (Debit)
                  </button>
                  <button type="button" onClick={() => setForm(f => ({ ...f, side: 'credit' }))}
                    className={cn('flex-1 px-3 py-2.5 rounded-lg border text-sm font-bold transition-all cursor-pointer',
                      form.side === 'credit' ? 'border-[#ef4444] bg-[#ef4444]/10 text-[#ef4444]' : 'border-[var(--border-default)] text-[var(--text-muted)] hover:bg-[var(--bg-muted)]')}>
                    대변 (Credit)
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-muted)]">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded text-green-600 dark:text-green-400" style={{ background: 'rgba(34,197,94,.12)' }}>◆ 사용자</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-[var(--border-default)]">
              <button onClick={() => setEditModal(false)} className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer">취소</button>
              <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-bold hover:bg-primary-600 transition-colors cursor-pointer">저장</button>
            </div>
          </div>
        </div>
      , document.body)}

      {groupModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setGroupModal(false)}>
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-2xl w-[360px] max-w-[90vw]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-default)]">
              <span className="text-[14px] font-extrabold text-[var(--text-primary)]">그룹 추가</span>
              <button onClick={() => setGroupModal(false)} className="p-1 rounded-lg hover:bg-[var(--bg-muted)] cursor-pointer transition-colors"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">구분</label>
                <div className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-sm text-[var(--text-secondary)] font-bold">
                  {ACCT_TYPES.find(t => t.value === groupForm.type)?.label || groupForm.type}
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">그룹명 *</label>
                <input value={groupForm.name} onChange={e => setGroupForm(f => ({ ...f, name: e.target.value }))} placeholder="예) 기타자산, 영업비용..."
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleGroupSave()}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none" />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-[var(--border-default)]">
              <button onClick={() => setGroupModal(false)} className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer">취소</button>
              <button onClick={handleGroupSave} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-bold hover:bg-primary-600 transition-colors cursor-pointer">추가</button>
            </div>
          </div>
        </div>
      , document.body)}
      </>
      ) : (
      /* ── 입금계정 탭 ── */
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-emerald-500" />
          <span className="text-base font-extrabold text-[var(--text-primary)]">입금계정 관리</span>
          <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-muted)] px-2 py-0.5 rounded-full">
            {accounts.filter(a => a.incomeEnabled).length} / {accounts.length}개 활성
          </span>
        </div>
        <div className="text-[11px] text-[var(--text-muted)] bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2">
          💡 스위치를 켜면 해당 계정이 <span className="font-bold text-emerald-600">입금전표</span>의 입금내용 선택 시 나타납니다.
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="계정 검색..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] outline-none focus:border-emerald-400" />
          </div>
          <div className="flex items-center bg-[var(--bg-muted)] rounded-lg border border-[var(--border-default)] overflow-hidden shrink-0">
            <button onClick={() => setFilterType('all')} className={cn('px-2.5 py-2 text-[11px] font-bold transition-all cursor-pointer', filterType === 'all' ? 'bg-primary-500 text-white shadow-sm' : 'text-[var(--text-muted)]')}>전체</button>
            {ACCT_TYPES.map(t => (
              <button key={t.value} onClick={() => setFilterType(t.value)} className={cn('px-2.5 py-2 text-[11px] font-bold transition-all cursor-pointer', filterType === t.value ? 'text-white shadow-sm' : 'text-[var(--text-muted)]')} style={filterType === t.value ? { background: t.color } : {}}>{t.label}</button>
            ))}
          </div>
        </div>
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--border-default)] bg-[var(--bg-muted)]">
            <span className="w-[40px] text-[10px] font-bold text-[var(--text-muted)] text-center">사용</span>
            <span className="w-[80px] text-[10px] font-bold text-[var(--text-muted)]">코드</span>
            <span className="flex-1 text-[10px] font-bold text-[var(--text-muted)]">계정과목명</span>
            <span className="w-[80px] text-[10px] font-bold text-[var(--text-muted)]">구분</span>
            <span className="w-[100px] text-[10px] font-bold text-[var(--text-muted)]">그룹</span>
          </div>
          {/* 목록 */}
          <div className="max-h-[500px] overflow-y-auto">
            {accounts
              .filter(a => {
                if (filterType !== 'all' && a.type !== filterType) return false
                if (search.trim()) {
                  const q = search.toLowerCase()
                  return a.code.includes(q) || a.name.toLowerCase().includes(q) || (a.group || '').toLowerCase().includes(q)
                }
                return true
              })
              .sort((a, b) => {
                // incomeEnabled 우선, 그다음 코드순
                if ((a as any).incomeEnabled && !(b as any).incomeEnabled) return -1
                if (!(a as any).incomeEnabled && (b as any).incomeEnabled) return 1
                return a.code.localeCompare(b.code)
              })
              .map(a => {
                const isEnabled = (a as any).incomeEnabled === true
                const typeInfo = ACCT_TYPES.find(t => t.value === a.type)
                return (
                  <div key={a.code} className={cn("flex items-center gap-3 px-4 py-2.5 border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-muted)] transition-colors", !isEnabled && 'opacity-50')}>
                    <button
                      onClick={() => {
                        const all = getItem<AcctAccount[]>('acct_accounts', [])
                        const updated = all.map(x => x.code === a.code ? { ...x, incomeEnabled: !isEnabled } : x)
                        setItem('acct_accounts', updated)
                        setRefresh(r => r + 1)
                      }}
                      className={cn('w-[36px] h-[18px] rounded-full transition-colors shrink-0 cursor-pointer relative', isEnabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600')}
                      title={isEnabled ? '입금전표에 표시됨 — 클릭하여 해제' : '비활성 — 클릭하여 입금전표에 표시'}
                    >
                      <span className={cn('absolute top-[3px] w-[12px] h-[12px] rounded-full bg-white shadow-sm transition-all', isEnabled ? 'left-[21px]' : 'left-[3px]')} />
                    </button>
                    <span className={cn("text-[12px] font-mono font-bold w-[80px] shrink-0", isEnabled ? 'text-emerald-600' : 'text-[var(--text-muted)]')}>{a.code}</span>
                    <span className={cn("text-[12px] font-bold flex-1", isEnabled ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]')}>{a.name}</span>
                    <span className="w-[80px] shrink-0">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ color: typeInfo?.color || '#6b7280', background: `${typeInfo?.color || '#6b7280'}12` }}>{typeInfo?.label || a.type}</span>
                    </span>
                    <span className="w-[100px] text-[11px] text-[var(--text-muted)] truncate">{a.group || '-'}</span>
                  </div>
                )
              })}
          </div>
        </div>
      </div>
      )}
    </div>
  )
}
