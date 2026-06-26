import React, { useState, useMemo, useEffect } from 'react'
import { getItem, setItem } from '../../../utils/storage'
import { formatNumber } from '../../../utils/format'
import { useToastStore } from '../../../stores/toastStore'
import type { BudgetCat, PayMethodItem, PayMethodCard, PayMethodNote, CashFlow } from './types'
import { getLocalDate } from './utils'
import { Landmark, Coins, FileText, Ticket, CreditCard, Plus, Trash2, ChevronDown, ChevronUp, Search, ScrollText } from 'lucide-react'
import { cn } from '../../../utils/cn'
import { DatePicker } from '../../../components/ui/DatePicker'


const PAY_CATEGORIES = [
  { key: '계좌' as const, label: '계좌', Icon: Landmark, color: '#3b82f6', bg: 'bg-blue-50 dark:bg-blue-900/10', border: 'border-blue-200 dark:border-blue-800', desc: '계좌이체, 자동이체 등' },
  { key: '현금' as const, label: '현금', Icon: Coins, color: '#22c55e', bg: 'bg-emerald-50 dark:bg-emerald-900/10', border: 'border-emerald-200 dark:border-emerald-800', desc: '현금, 소액현금 등' },
  { key: '어음' as const, label: '어음', Icon: FileText, color: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/10', border: 'border-amber-200 dark:border-amber-800', desc: '수신어음, 발행어음, 수표' },
  { key: '상품권' as const, label: '상품권', Icon: Ticket, color: '#8b5cf6', bg: 'bg-violet-50 dark:bg-violet-900/10', border: 'border-violet-200 dark:border-violet-800', desc: '문화상품권, 백화점상품권 등' },
]

const DEFAULT_PAY_ITEMS: PayMethodItem[] = [
  { id: 1, name: '계좌이체', category: '계좌' },
  { id: 2, name: '자동이체', category: '계좌' },
  { id: 3, name: '온라인뱅킹', category: '계좌' },
  { id: 4, name: '현금', category: '현금' },
  { id: 5, name: '소액현금', category: '현금' },
  { id: 6, name: '수신어음', category: '어음', noteType: '수신' },
  { id: 7, name: '발행어음', category: '어음', noteType: '발행' },
]

const DETAIL_FIELD_LABEL = 'text-[11px] font-bold text-[var(--text-muted)] mb-1 block'
const DETAIL_INPUT = 'w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-white dark:bg-gray-900 text-[12px] text-[var(--text-primary)] outline-none focus:border-primary-400 transition-colors placeholder:text-[var(--text-muted)]'

export default function AcctPayMethods({ catId }: { catId?: string | null }) {
  const [refresh, setRefresh] = useState(0)
  const [newName, setNewName] = useState('')
  const [activeCategory, setActiveCategory] = useState<'계좌' | '현금' | '어음' | '상품권'>('계좌')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [vendorDropKey, setVendorDropKey] = useState<string | null>(null)
  const addToast = useToastStore(s => s.add)

  // 직원 목록
  const staffList = useMemo(() => getItem<any[]>('ws_users', []), [])

  // 현재 설정 회계년도
  const currentYear = new Date().getFullYear()
  const activeYear = parseInt(new URLSearchParams(window.location.hash.split('?')[1] || '').get('year') || '') || parseInt(localStorage.getItem('acct_active_year') || '') || currentYear

  // 예산구분 목록 (설정 년도 기준)
  const budgetCats = useMemo(() => {
    const all = getItem<BudgetCat[]>('acct_budget_cats', [])
    return all.filter(c => {
      const cy = c.year || (c.periodFrom ? parseInt(c.periodFrom.substring(0, 4)) : currentYear)
      return cy === activeYear
    })
  }, [refresh, activeYear])

  // 상단 바에서 선택된 예산구분 ID 사용
  const selectedPayCatId = catId || (budgetCats.length > 0 ? String(budgetCats[0].id) : '')
  const selectedCatName = budgetCats.find(c => String(c.id) === selectedPayCatId)?.name || ''

  // 초기화
  useEffect(() => {
    const raw = localStorage.getItem('acct_pay_methods_v2')
    if (!raw) {
      const oldMethods: string[] = getItem('acct_payment_methods', [])
      if (oldMethods.length > 0) {
        const migrated: PayMethodItem[] = oldMethods.map((name, i) => {
          let cat: PayMethodItem['category'] = '상품권'
          if (['계좌이체', '자동이체', '온라인뱅킹'].includes(name)) cat = '계좌'
          else if (['현금', '소액현금'].includes(name)) cat = '현금'
          else if (['약속어음', '환어음', '수표', '어음'].includes(name)) cat = '어음'
          return { id: Date.now() + i, name, category: cat }
        })
        setItem('acct_pay_methods_v2', migrated)
      } else {
        setItem('acct_pay_methods_v2', DEFAULT_PAY_ITEMS)
      }
      setRefresh(r => r + 1)
    }
  }, [])

  void refresh
  const allItems: PayMethodItem[] = useMemo(() => {
    try {
      const raw = localStorage.getItem('acct_pay_methods_v2')
      if (!raw) return DEFAULT_PAY_ITEMS
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return DEFAULT_PAY_ITEMS
      if (parsed.length > 0 && typeof parsed[0] === 'string') return DEFAULT_PAY_ITEMS
      return parsed as PayMethodItem[]
    } catch { return DEFAULT_PAY_ITEMS }
  }, [refresh])
  // 선택된 예산구분의 항목만 표시
  const filteredItems = selectedPayCatId
    ? allItems.filter(i => String(i.budgetCatId) === selectedPayCatId)
    : allItems
  const catItems = filteredItems.filter(i => i.category === activeCategory)
  const activeCatInfo = PAY_CATEGORIES.find(c => c.key === activeCategory)!

  // 선택된 예산구분의 지출담당자 (기본값으로 사용)
  const defaultManager = useMemo(() => {
    const cat = budgetCats.find(c => String(c.id) === selectedPayCatId)
    if (cat?.users && cat.users.length > 0) return cat.users[0]
    return ''
  }, [budgetCats, selectedPayCatId])

  const saveAll = (updated: PayMethodItem[]) => {
    setItem('acct_pay_methods_v2', updated)
    setItem('acct_payment_methods', updated.map(i => i.name))
    setRefresh(r => r + 1)
  }

  const handleAdd = () => {
    if (!newName.trim()) return
    // 같은 예산구분 + 같은 카테고리 내에서만 중복 체크
    const isDuplicate = allItems.some(i =>
      i.name === newName.trim() &&
      i.category === activeCategory &&
      String(i.budgetCatId) === selectedPayCatId
    )
    if (isDuplicate) {
      addToast('error', '이 예산구분에 이미 존재하는 지출수단입니다')
      return
    }
    const newItem: PayMethodItem = {
      id: Date.now(),
      name: newName.trim(),
      category: activeCategory,
      budgetCatId: selectedPayCatId || undefined,
      manager: activeCategory === '계좌' ? defaultManager : undefined,
      custodian: activeCategory === '현금' ? defaultManager : undefined,
      noteManager: activeCategory === '어음' ? defaultManager : undefined,
      voucherManager: activeCategory === '상품권' ? defaultManager : undefined,
    }
    saveAll([...allItems, newItem])
    addToast('success', `"${newName.trim()}" 추가됨`)
    setNewName('')
    setExpandedId(newItem.id)
  }

  const handleDelete = (id: number) => {
    const item = allItems.find(i => i.id === id)
    if (!item) return
    if (!confirm(`"${item.name}"을(를) 삭제하시겠습니까?`)) return
    saveAll(allItems.filter(i => i.id !== id))
    addToast('warning', `"${item.name}" 삭제됨`)
    if (expandedId === id) setExpandedId(null)
  }

  const updateField = (id: number, field: keyof PayMethodItem, value: string) => {
    saveAll(allItems.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  // ── 카드 CRUD ──
  const addCard = (itemId: number) => {
    const newCard: PayMethodCard = {
      id: Date.now(),
      cardName: '',
      cardCompany: '',
      cardNumber: '',
      cardType: '체크카드',
      cardUser: defaultManager,
    }
    saveAll(allItems.map(i => i.id === itemId ? { ...i, cards: [...(i.cards || []), newCard] } : i))
  }
  const updateCard = (itemId: number, cardId: number, field: keyof PayMethodCard, value: string | number) => {
    saveAll(allItems.map(i => i.id === itemId ? {
      ...i,
      cards: (i.cards || []).map(c => c.id === cardId ? { ...c, [field]: value } : c)
    } : i))
  }
  const deleteCard = (itemId: number, cardId: number) => {
    saveAll(allItems.map(i => i.id === itemId ? {
      ...i,
      cards: (i.cards || []).filter(c => c.id !== cardId)
    } : i))
  }

  // ── 어음대장 CRUD ──
  const addNote = (itemId: number) => {
    const item = allItems.find(i => i.id === itemId)
    const newNote: PayMethodNote = {
      id: Date.now(),
      noteNumber: '',
      issuer: item?.noteType === '발행' ? '우리회사' : '',
      receiver: item?.noteType === '수신' ? '우리회사' : '',
      amount: 0,
      issueDate: getLocalDate(),
      maturityDate: '',
      endorsement: '',
      bank: '',
      status: '미결제',
    }
    saveAll(allItems.map(i => i.id === itemId ? { ...i, notes: [...(i.notes || []), newNote] } : i))
  }
  const updateNote = (itemId: number, noteId: number, field: keyof PayMethodNote, value: string | number) => {
    saveAll(allItems.map(i => i.id === itemId ? {
      ...i,
      notes: (i.notes || []).map(n => n.id === noteId ? { ...n, [field]: value } : n)
    } : i))
  }
  const deleteNote = (itemId: number, noteId: number) => {
    saveAll(allItems.map(i => i.id === itemId ? {
      ...i,
      notes: (i.notes || []).filter(n => n.id !== noteId)
    } : i))
  }

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-[var(--text-primary)] flex items-center gap-2">
            <CreditCard size={18} /> 지출수단 관리
          </h2>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">상단에서 예산구분을 선택하여 지출수단을 관리합니다</p>
        </div>
        <span className="text-xs font-bold text-white bg-primary-500 px-3 py-1.5 rounded-full">
          {selectedCatName || '전체'} {filteredItems.length}건
        </span>
      </div>

      {/* 카테고리 탭 */}
      <div className="flex gap-2">
        {PAY_CATEGORIES.map(cat => {
          const count = filteredItems.filter(i => i.category === cat.key).length
          const isActive = activeCategory === cat.key
          return (
            <button
              key={cat.key}
              onClick={() => { setActiveCategory(cat.key); setExpandedId(null) }}
              className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all cursor-pointer ${
                isActive
                  ? `${cat.bg} ${cat.border} shadow-sm`
                  : 'bg-[var(--bg-surface)] border-transparent hover:border-[var(--border-default)]'
              }`}
            >
              <div className="flex flex-col items-center">
                <cat.Icon size={18} style={{ color: isActive ? cat.color : undefined }} />
                <div className={`text-[12px] font-extrabold mt-1 ${isActive ? '' : 'text-[var(--text-secondary)]'}`} style={isActive ? { color: cat.color } : undefined}>
                  {cat.label}
                </div>
                <div className="text-[10px] font-bold text-[var(--text-muted)] mt-0.5">{count}건</div>
              </div>
            </button>
          )
        })}
      </div>

      {/* 선택된 카테고리 영역 */}
      <div className={`rounded-2xl border-2 ${activeCatInfo.border} ${activeCatInfo.bg} p-5`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <activeCatInfo.Icon size={20} style={{ color: activeCatInfo.color }} />
            <div>
              <h3 className="text-sm font-extrabold" style={{ color: activeCatInfo.color }}>{activeCatInfo.label}</h3>
              <p className="text-[10px] text-[var(--text-muted)]">{activeCatInfo.desc}</p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: activeCatInfo.color, background: `${activeCatInfo.color}15` }}>
            {catItems.length}건
          </span>
        </div>

        {/* 추가 폼 */}
        <div className="flex gap-2 mb-4">
          <input
            placeholder={`새 ${activeCatInfo.label} 수단 입력...`}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-[var(--border-default)] bg-white dark:bg-gray-900 text-sm text-[var(--text-primary)] outline-none focus:border-primary-400 transition-colors placeholder:text-[var(--text-muted)]"
          />
          <button
            onClick={handleAdd}
            className="px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-all cursor-pointer hover:shadow-md flex items-center gap-1.5"
            style={{ background: activeCatInfo.color }}
          >
            <Plus size={14} /> 추가
          </button>
        </div>

        {/* 항목 리스트 */}
        {catItems.length === 0 ? (
          <div className="py-8 text-center text-sm text-[var(--text-muted)] rounded-xl border border-dashed border-[var(--border-default)] bg-white/50 dark:bg-gray-900/50">
            등록된 {activeCatInfo.label} 수단이 없습니다
          </div>
        ) : (
          <div className="space-y-1.5">
            {catItems.map((item, idx) => {
              const isOpen = expandedId === item.id
              const hasDetail = activeCategory === '계좌' && (item.bankName || item.accountNumber || item.accountHolder || item.manager)
              return (
                <div key={item.id} className={`rounded-xl transition-all border ${isOpen ? 'border-[var(--border-default)] bg-white dark:bg-gray-900/60 shadow-sm' : 'border-transparent bg-white/70 dark:bg-gray-900/30 hover:bg-white dark:hover:bg-gray-800/50 hover:border-[var(--border-default)]'}`}>
                  {/* 메인 행 */}
                  <div
                    className="flex items-center gap-3 px-3.5 py-2.5 cursor-pointer group"
                    onClick={() => setExpandedId(isOpen ? null : item.id)}
                  >
                    <span className="text-[10px] font-bold w-5 text-center shrink-0 rounded-full py-0.5" style={{ color: activeCatInfo.color, background: `${activeCatInfo.color}15` }}>
                      {idx + 1}
                    </span>
                    <input value={item.name} onChange={e => { e.stopPropagation(); updateField(item.id, 'name', e.target.value) }} onClick={e => e.stopPropagation()} placeholder="이름 입력" className="text-sm font-semibold text-[var(--text-primary)] flex-1 bg-transparent border-none outline-none focus:bg-[var(--bg-muted)] focus:px-2 focus:rounded-md transition-all" />
                    {/* 현금 계정과목 고정 표시 */}
                    {activeCategory === '현금' && (() => {
                      const cfs: CashFlow[] = getItem('acct_cashflows', [])
                      const cashIn = cfs.filter(cf => (cf as any).type === 'transfer' && (cf as any).debitAccount === '현금' && (cf as any).debitDetail === item.name).reduce((s, cf) => s + (cf.amount || 0), 0)
                      const cashOutT = cfs.filter(cf => (cf as any).type === 'transfer' && (cf as any).creditAccount === '현금' && (cf as any).creditDetail === item.name).reduce((s, cf) => s + (cf.amount || 0), 0)
                      const cashOutE = cfs.filter(cf => (cf.type === 'withdrawal' || cf.type === 'expense') && ((cf as any).payMethod || (cf as any).method) === '현금' && ((cf as any).payDetail || '') === item.name).reduce((s, cf) => s + (cf.amount || 0), 0)
                      const bal = (item.initialBalance || 0) + cashIn - cashOutT - cashOutE
                      return (
                        <>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 whitespace-nowrap">1-01-01 현금</span>
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded whitespace-nowrap ${bal < 0 ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'}`}>
                            💰 {bal.toLocaleString('ko-KR')}원
                          </span>
                        </>
                      )
                    })()}
                    {activeCategory === '상품권' && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-pink-50 dark:bg-pink-900/20 text-pink-600 whitespace-nowrap">1-01-08 상품권</span>
                    )}
                    {/* 계좌 요약 표시 */}
                    {activeCategory === '계좌' && item.bankName && !isOpen && (
                      <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[200px]">
                        {item.bankName} {item.accountNumber ? `• ${item.accountNumber}` : ''}
                      </span>
                    )}
                    {hasDetail && !isOpen && <span className="text-[8px] text-primary-500 bg-primary-100 dark:bg-primary-900/20 px-1.5 py-0.5 rounded font-bold">상세</span>}
                    <ChevronDown size={14} className={`text-[var(--text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(item.id) }}
                      className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-danger cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* 상세 필드 (계좌만) */}
                  {isOpen && activeCategory === '계좌' && (
                    <div className="px-4 pb-4 pt-1 border-t border-[var(--border-default)] mx-3">
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>은행명 *</label>
                          <input
                            value={item.bankName || ''}
                            onChange={e => updateField(item.id, 'bankName', e.target.value)}
                            placeholder="국민은행"
                            className={DETAIL_INPUT}
                          />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>계좌번호 *</label>
                          <input
                            value={item.accountNumber || ''}
                            onChange={e => updateField(item.id, 'accountNumber', e.target.value)}
                            placeholder="110-234-567890"
                            className={DETAIL_INPUT}
                          />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>예금주 *</label>
                          <input
                            value={item.accountHolder || ''}
                            onChange={e => updateField(item.id, 'accountHolder', e.target.value)}
                            placeholder="(주)문화재청"
                            className={DETAIL_INPUT}
                          />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>계좌관리자 *</label>
                          <select
                            value={item.manager || ''}
                            onChange={e => updateField(item.id, 'manager', e.target.value)}
                            className={DETAIL_INPUT}
                          >
                            <option value="">선택하세요</option>
                            {staffList.map((s: any) => (
                              <option key={s.id || s.name} value={s.name}>{s.name}{s.role ? ` (${s.role})` : ''}{s.dept ? ` - ${s.dept}` : ''}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>계좌용도</label>
                          <input
                            value={item.purpose || ''}
                            onChange={e => updateField(item.id, 'purpose', e.target.value)}
                            placeholder="운영자금, 사업비 등"
                            className={DETAIL_INPUT}
                          />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>메모</label>
                          <input
                            value={item.memo || ''}
                            onChange={e => updateField(item.id, 'memo', e.target.value)}
                            placeholder="참고사항"
                            className={DETAIL_INPUT}
                          />
                        </div>
                      </div>

                      {/* ── 카드 관리 ── */}
                      <div className="mt-5 pt-4 border-t border-dashed border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-1.5">
                            <CreditCard size={14} className="text-blue-500" />
                            <span className="text-[12px] font-extrabold text-[var(--text-primary)]">연결 카드</span>
                            {(item.cards || []).length > 0 && (
                              <span className="text-[9px] font-bold bg-blue-100 dark:bg-blue-900/20 text-blue-600 px-1.5 py-0.5 rounded">{(item.cards || []).length}장</span>
                            )}
                          </div>
                          <button
                            onClick={() => addCard(item.id)}
                            className="text-[11px] font-bold text-blue-500 hover:text-blue-700 cursor-pointer flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          >
                            <Plus size={12} /> 카드 추가
                          </button>
                        </div>

                        {(!item.cards || item.cards.length === 0) ? (
                          <div className="py-4 text-center text-[11px] text-[var(--text-muted)] rounded-lg border border-dashed border-[var(--border-default)] bg-white/50 dark:bg-gray-900/30">
                            등록된 카드가 없습니다
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {item.cards.map((card, ci) => (
                              <div key={card.id} className="rounded-lg border border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/5 p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] font-bold text-blue-500">💳 카드 {ci + 1}</span>
                                  <button
                                    onClick={() => deleteCard(item.id, card.id)}
                                    className="text-[10px] text-red-400 hover:text-red-600 cursor-pointer flex items-center gap-0.5"
                                  >
                                    <Trash2 size={10} /> 삭제
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className={DETAIL_FIELD_LABEL}>카드명 *</label>
                                    <input
                                      value={card.cardName}
                                      onChange={e => updateCard(item.id, card.id, 'cardName', e.target.value)}
                                      placeholder="법인카드1"
                                      className={DETAIL_INPUT}
                                    />
                                  </div>
                                  <div>
                                    <label className={DETAIL_FIELD_LABEL}>카드사 *</label>
                                    <input
                                      value={card.cardCompany}
                                      onChange={e => updateCard(item.id, card.id, 'cardCompany', e.target.value)}
                                      placeholder="국민카드"
                                      className={DETAIL_INPUT}
                                    />
                                  </div>
                                  <div>
                                    <label className={DETAIL_FIELD_LABEL}>카드번호 *</label>
                                    <input
                                      value={card.cardNumber}
                                      onChange={e => {
                                        const raw = e.target.value.replace(/[^0-9]/g, '').slice(0, 16)
                                        const formatted = raw.replace(/(.{4})/g, '$1-').replace(/-$/, '')
                                        updateCard(item.id, card.id, 'cardNumber', formatted)
                                      }}
                                      placeholder="1234-5678-9012-3456"
                                      className={DETAIL_INPUT}
                                    />
                                  </div>
                                  <div>
                                    <label className={DETAIL_FIELD_LABEL}>카드종류 *</label>
                                    <select
                                      value={card.cardType}
                                      onChange={e => updateCard(item.id, card.id, 'cardType', e.target.value)}
                                      className={DETAIL_INPUT}
                                    >
                                      <option value="체크카드">체크카드</option>
                                      <option value="신용카드">신용카드</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className={DETAIL_FIELD_LABEL}>사용자 *</label>
                                    <select
                                      value={card.cardUser}
                                      onChange={e => updateCard(item.id, card.id, 'cardUser', e.target.value)}
                                      className={DETAIL_INPUT}
                                    >
                                      <option value="">선택하세요</option>
                                      {staffList.map((s: any) => (
                                        <option key={s.id || s.name} value={s.name}>{s.name}{s.role ? ` (${s.role})` : ''}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className={DETAIL_FIELD_LABEL}>유효기간</label>
                                    <input
                                      value={card.expiryDate || ''}
                                      onChange={e => {
                                        const raw = e.target.value.replace(/[^0-9]/g, '').slice(0, 4)
                                        const formatted = raw.length > 2 ? `${raw.slice(0, 2)}/${raw.slice(2)}` : raw
                                        updateCard(item.id, card.id, 'expiryDate', formatted)
                                      }}
                                      placeholder="MM/YY"
                                      maxLength={5}
                                      className={DETAIL_INPUT}
                                    />
                                  </div>
                                  {card.cardType === '신용카드' && (
                                    <div>
                                      <label className={DETAIL_FIELD_LABEL}>한도</label>
                                      <input
                                        value={card.cardLimit ? card.cardLimit.toLocaleString() : ''}
                                        onChange={e => updateCard(item.id, card.id, 'cardLimit', parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0)}
                                        placeholder="5,000,000"
                                        className={DETAIL_INPUT}
                                      />
                                    </div>
                                  )}
                                  <div className={card.cardType === '신용카드' ? '' : 'col-span-1'}>
                                    <label className={DETAIL_FIELD_LABEL}>메모</label>
                                    <input
                                      value={card.memo || ''}
                                      onChange={e => updateCard(item.id, card.id, 'memo', e.target.value)}
                                      placeholder="참고사항"
                                      className={DETAIL_INPUT}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 상세 필드 (현금) */}
                  {isOpen && activeCategory === '현금' && (
                    <div className="px-4 pb-4 pt-1 border-t border-[var(--border-default)] mx-3">
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>보관처 *</label>
                          <input
                            value={item.storageLocation || ''}
                            onChange={e => updateField(item.id, 'storageLocation' as any, e.target.value)}
                            placeholder="사무실 금고, 현장사무소 등"
                            className={DETAIL_INPUT}
                          />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>보관책임자 *</label>
                          <select
                            value={item.custodian || ''}
                            onChange={e => updateField(item.id, 'custodian' as any, e.target.value)}
                            className={DETAIL_INPUT}
                          >
                            <option value="">선택하세요</option>
                            {staffList.map((s: any) => (
                              <option key={s.id || s.name} value={s.name}>{s.name}{s.role ? ` (${s.role})` : ''}{s.dept ? ` - ${s.dept}` : ''}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>한도액</label>
                          <input
                            value={item.cashLimit ? item.cashLimit.toLocaleString() : ''}
                            onChange={e => {
                              const num = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0
                              saveAll(allItems.map(i => i.id === item.id ? { ...i, cashLimit: num } : i))
                            }}
                            placeholder="500,000"
                            className={DETAIL_INPUT}
                          />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>용도</label>
                          <input
                            value={item.purpose || ''}
                            onChange={e => updateField(item.id, 'purpose', e.target.value)}
                            placeholder="소액경비, 현장경비 등"
                            className={DETAIL_INPUT}
                          />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>💰 현금잔액</label>
                          {(() => {
                            const cfs: CashFlow[] = getItem('acct_cashflows', [])
                            // 현금 입금(대체 차변이 이 현금수단)
                            const cashIn = cfs.filter(cf =>
                              (cf as any).type === 'transfer' &&
                              (cf as any).debitAccount === '현금' &&
                              (cf as any).debitDetail === item.name
                            ).reduce((s, cf) => s + (cf.amount || 0), 0)
                            // 현금 출금(대체 대변이 이 현금수단)
                            const cashOutTransfer = cfs.filter(cf =>
                              (cf as any).type === 'transfer' &&
                              (cf as any).creditAccount === '현금' &&
                              (cf as any).creditDetail === item.name
                            ).reduce((s, cf) => s + (cf.amount || 0), 0)
                            // 현금 지출(출금전표에서 이 현금수단 사용)
                            const cashOutExpense = cfs.filter(cf =>
                              (cf.type === 'withdrawal' || cf.type === 'expense') &&
                              ((cf as any).payMethod || (cf as any).method) === '현금' &&
                              ((cf as any).payDetail || '') === item.name
                            ).reduce((s, cf) => s + (cf.amount || 0), 0)
                            const balance = (item.initialBalance || 0) + cashIn - cashOutTransfer - cashOutExpense
                            const isOver = item.cashLimit && balance > item.cashLimit
                            return (
                              <div className={`w-full px-3 py-2.5 rounded-lg border text-sm font-extrabold text-right ${balance < 0 ? 'border-red-300 bg-red-50 dark:bg-red-900/10 text-red-600' : isOver ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/10 text-amber-600' : 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600'}`}>
                                {balance.toLocaleString('ko-KR')}원
                              </div>
                            )
                          })()}
                        </div>
                        <div className="col-span-2">
                          <label className={DETAIL_FIELD_LABEL}>메모</label>
                          <input
                            value={item.memo || ''}
                            onChange={e => updateField(item.id, 'memo', e.target.value)}
                            placeholder="참고사항"
                            className={DETAIL_INPUT}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 상세 필드 (어음) */}
                  {isOpen && activeCategory === '어음' && (
                    <div className="px-4 pb-4 pt-1 border-t border-[var(--border-default)] mx-3">
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>구분 *</label>
                          <select
                            value={item.noteType || ''}
                            onChange={e => {
                              const v = e.target.value
                              const acctCode = v === '수신' ? '1-01-06' : v === '발행' ? '2-01-02' : ''
                              saveAll(allItems.map(i => i.id === item.id ? { ...i, noteType: v as '수신' | '발행', linkedAccountCode: acctCode } : i))
                            }}
                            className={DETAIL_INPUT}
                          >
                            <option value="">선택하세요</option>
                            <option value="수신">수신 (받을어음)</option>
                            <option value="발행">발행 (지급어음)</option>
                          </select>
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>연결 계정</label>
                          <div className={`${DETAIL_INPUT} flex items-center gap-1.5 !bg-[var(--bg-muted)]`}>
                            {item.noteType === '수신' ? (
                              <><span className="text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">자산</span><span className="text-xs font-bold">1-01-06 받을어음</span></>
                            ) : item.noteType === '발행' ? (
                              <><span className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-1.5 py-0.5 rounded">부채</span><span className="text-xs font-bold">2-01-02 지급어음</span></>
                            ) : (
                              <span className="text-xs text-[var(--text-muted)]">구분을 선택하세요</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>담당자 *</label>
                          <select
                            value={item.noteManager || ''}
                            onChange={e => updateField(item.id, 'noteManager' as any, e.target.value)}
                            className={DETAIL_INPUT}
                          >
                            <option value="">선택하세요</option>
                            {staffList.map((s: any) => (
                              <option key={s.id || s.name} value={s.name}>{s.name}{s.role ? ` (${s.role})` : ''}{s.dept ? ` - ${s.dept}` : ''}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>기본만기 *</label>
                          <select
                            value={item.defaultMaturity || ''}
                            onChange={e => updateField(item.id, 'defaultMaturity' as any, e.target.value)}
                            className={DETAIL_INPUT}
                          >
                            <option value="">선택하세요</option>
                            <option value="30일">30일</option>
                            <option value="60일">60일</option>
                            <option value="90일">90일</option>
                            <option value="120일">120일</option>
                          </select>
                        </div>
                        {item.noteType === '발행' && (
                          <div>
                            <label className={DETAIL_FIELD_LABEL}>발행한도</label>
                            <input
                              value={item.noteLimit ? item.noteLimit.toLocaleString() : ''}
                              onChange={e => {
                                const num = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0
                                saveAll(allItems.map(i => i.id === item.id ? { ...i, noteLimit: num } : i))
                              }}
                              placeholder="50,000,000"
                              className={DETAIL_INPUT}
                            />
                          </div>
                        )}
                        <div className={item.noteType === '발행' ? '' : 'col-span-2'}>
                          <label className={DETAIL_FIELD_LABEL}>메모</label>
                          <input
                            value={item.memo || ''}
                            onChange={e => updateField(item.id, 'memo', e.target.value)}
                            placeholder="참고사항"
                            className={DETAIL_INPUT}
                          />
                        </div>
                      </div>

                      {/* ── 어음대장 ── */}
                      {item.noteType && (
                        <div className="mt-5 pt-4 border-t border-dashed border-amber-200 dark:border-amber-800">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-1.5">
                              <ScrollText size={14} className="text-amber-500" />
                              <span className="text-[12px] font-extrabold text-[var(--text-primary)]">어음대장</span>
                              {(item.notes || []).length > 0 && (
                                <span className="text-[9px] font-bold bg-amber-100 dark:bg-amber-900/20 text-amber-600 px-1.5 py-0.5 rounded">{(item.notes || []).length}건</span>
                              )}
                            </div>
                            <button
                              onClick={() => addNote(item.id)}
                              className="text-[11px] font-bold text-amber-500 hover:text-amber-700 cursor-pointer flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                            >
                              <Plus size={12} /> 어음 추가
                            </button>
                          </div>

                          {(!item.notes || item.notes.length === 0) ? (
                            <div className="py-4 text-center text-[11px] text-[var(--text-muted)] rounded-lg border border-dashed border-[var(--border-default)] bg-white/50 dark:bg-gray-900/30">
                              등록된 어음이 없습니다
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {item.notes.map((note, ni) => {
                                const statusColors: Record<string, string> = { '미결제': '#f59e0b', '추심중': '#3b82f6', '결제완료': '#22c55e', '부도': '#ef4444' }
                                return (
                                  <div key={note.id} className="rounded-lg border border-amber-100 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-900/5 p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1"><FileText size={10} /> 어음 {ni + 1}</span>
                                        {note.status && (
                                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ color: statusColors[note.status] || '#888', background: `${statusColors[note.status] || '#888'}15` }}>
                                            {note.status}
                                          </span>
                                        )}
                                      </div>
                                      <button
                                        onClick={() => deleteNote(item.id, note.id)}
                                        className="text-[10px] text-red-400 hover:text-red-600 cursor-pointer flex items-center gap-0.5"
                                      >
                                        <Trash2 size={10} /> 삭제
                                      </button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                      <div>
                                        <label className={DETAIL_FIELD_LABEL}>어음번호 *</label>
                                        <input
                                          value={note.noteNumber}
                                          onChange={e => updateNote(item.id, note.id, 'noteNumber', e.target.value)}
                                          placeholder="A-2026-001"
                                          className={DETAIL_INPUT}
                                        />
                                      </div>
                                      <div className="relative">
                                        <label className={DETAIL_FIELD_LABEL}>{item.noteType === '수신' ? '발행인' : '수취인'} *</label>
                                        <input
                                          value={item.noteType === '수신' ? (note.issuer || '') : (note.receiver || '')}
                                          onChange={e => {
                                            updateNote(item.id, note.id, item.noteType === '수신' ? 'issuer' : 'receiver', e.target.value)
                                          }}
                                          onFocus={() => setVendorDropKey(`${item.id}-${note.id}`)}
                                          onBlur={() => setTimeout(() => setVendorDropKey(k => k === `${item.id}-${note.id}` ? null : k), 200)}
                                          placeholder="거래처 검색..."
                                          className={DETAIL_INPUT}
                                        />
                                        {vendorDropKey === `${item.id}-${note.id}` && (() => {
                                          const vendorList: any[] = getItem('acct_vendors', [])
                                          const searchVal = (item.noteType === '수신' ? (note.issuer || '') : (note.receiver || '')).toLowerCase()
                                          const filtered = vendorList.filter(v => !searchVal || v.name.toLowerCase().includes(searchVal))
                                          return (
                                            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-[var(--border-default)] rounded-xl shadow-lg max-h-[150px] overflow-y-auto">
                                              {filtered.map((v: any) => (
                                                <button
                                                  key={v.id}
                                                  onMouseDown={e => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    updateNote(item.id, note.id, item.noteType === '수신' ? 'issuer' : 'receiver', v.name)
                                                    setVendorDropKey(null)
                                                  }}
                                                  className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--bg-muted)] cursor-pointer flex items-center gap-2 transition-colors"
                                                >
                                                  <span className="text-[10px]">🏢</span>
                                                  <span className="font-semibold text-[var(--text-primary)]">{v.name}</span>
                                                  {v.ceoName && <span className="text-[10px] text-[var(--text-muted)]">대표: {v.ceoName}</span>}
                                                </button>
                                              ))}
                                              {filtered.length === 0 && (
                                                <div className="px-3 py-2 text-[11px] text-[var(--text-muted)]">검색 결과가 없습니다</div>
                                              )}

                                            </div>
                                          )
                                        })()}
                                      </div>
                                      <div>
                                        <label className={DETAIL_FIELD_LABEL}>금액 *</label>
                                        <input
                                          value={note.amount ? note.amount.toLocaleString() : ''}
                                          onChange={e => updateNote(item.id, note.id, 'amount', parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0)}
                                          placeholder="5,000,000"
                                          className={DETAIL_INPUT}
                                        />
                                      </div>
                                      <div>
                                        <label className={DETAIL_FIELD_LABEL}>발행일 *</label>
                                        <DatePicker value={note.issueDate || ''} onChange={v => updateNote(item.id, note.id, 'issueDate', v)} />
                                      </div>
                                      <div>
                                        <label className={DETAIL_FIELD_LABEL}>만기일 *</label>
                                        <DatePicker value={note.maturityDate || ''} onChange={v => updateNote(item.id, note.id, 'maturityDate', v)} />
                                      </div>
                                      <div>
                                        <label className={DETAIL_FIELD_LABEL}>{item.noteType === '수신' ? '추심은행' : '결제은행'} *</label>
                                        <input
                                          value={note.bank || ''}
                                          onChange={e => updateNote(item.id, note.id, 'bank', e.target.value)}
                                          placeholder="국민은행"
                                          className={DETAIL_INPUT}
                                        />
                                      </div>
                                      <div>
                                        <label className={DETAIL_FIELD_LABEL}>상태 *</label>
                                        <select
                                          value={note.status}
                                          onChange={e => updateNote(item.id, note.id, 'status', e.target.value)}
                                          className={DETAIL_INPUT}
                                        >
                                          <option value="미결제">미결제</option>
                                          {item.noteType === '수신' && <option value="추심중">추심중</option>}
                                          <option value="결제완료">결제완료</option>
                                          <option value="부도">부도</option>
                                        </select>
                                      </div>
                                      <div className="col-span-2">
                                        <label className={DETAIL_FIELD_LABEL}>배서내용</label>
                                        <input
                                          value={note.endorsement}
                                          onChange={e => updateNote(item.id, note.id, 'endorsement', e.target.value)}
                                          placeholder="배서인, 배서일자 등"
                                          className={DETAIL_INPUT}
                                        />
                                      </div>
                                      <div>
                                        <label className={DETAIL_FIELD_LABEL}>메모</label>
                                        <input
                                          value={note.memo || ''}
                                          onChange={e => updateNote(item.id, note.id, 'memo', e.target.value)}
                                          placeholder="참고사항"
                                          className={DETAIL_INPUT}
                                        />
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
                  )}

                  {/* 상세 필드 (상품권) */}
                  {isOpen && activeCategory === '상품권' && (
                    <div className="px-4 pb-4 pt-1 border-t border-[var(--border-default)] mx-3">
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>금액 *</label>
                          <input
                            value={item.voucherAmount ? item.voucherAmount.toLocaleString() : ''}
                            onChange={e => {
                              const num = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0
                              saveAll(allItems.map(i => i.id === item.id ? { ...i, voucherAmount: num } : i))
                            }}
                            placeholder="50,000"
                            className={DETAIL_INPUT}
                          />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>보유수량 *</label>
                          <input
                            type="number"
                            value={item.voucherQty || ''}
                            onChange={e => {
                              const num = parseInt(e.target.value) || 0
                              saveAll(allItems.map(i => i.id === item.id ? { ...i, voucherQty: num } : i))
                            }}
                            placeholder="10"
                            min={0}
                            className={DETAIL_INPUT}
                          />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>보관처 *</label>
                          <input
                            value={item.voucherStorage || ''}
                            onChange={e => updateField(item.id, 'voucherStorage' as any, e.target.value)}
                            placeholder="사무실 금고"
                            className={DETAIL_INPUT}
                          />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>담당자 *</label>
                          <select
                            value={item.voucherManager || ''}
                            onChange={e => updateField(item.id, 'voucherManager' as any, e.target.value)}
                            className={DETAIL_INPUT}
                          >
                            <option value="">선택하세요</option>
                            {staffList.map((s: any) => (
                              <option key={s.id || s.name} value={s.name}>{s.name}{s.role ? ` (${s.role})` : ''}{s.dept ? ` - ${s.dept}` : ''}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className={DETAIL_FIELD_LABEL}>메모</label>
                          <input
                            value={item.memo || ''}
                            onChange={e => updateField(item.id, 'memo', e.target.value)}
                            placeholder="참고사항"
                            className={DETAIL_INPUT}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
