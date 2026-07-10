import React, { useState, useMemo, useEffect } from 'react'
import { getItem, setItem } from '../../../utils/storage'
import { formatNumber } from '../../../utils/format'
import { useToastStore } from '../../../stores/toastStore'
import { saveAttachmentImage, deleteAttachmentImage } from '../../../utils/attachmentDB'
import type { BudgetCat, PayMethodItem, PayMethodCard, PayMethodNote, CashFlow, Vendor } from './types'
import { getLocalDate } from './utils'
import { Landmark, Coins, FileText, Ticket, CreditCard, Plus, Trash2, ChevronDown, ChevronUp, Eye, Search, Wallet, ArrowDownCircle, ArrowUpCircle, ScrollText, Check, Paperclip, AlertTriangle, TrendingUp, Lightbulb, ClipboardList, Building2 } from 'lucide-react'
import { cn } from '../../../utils/cn'
import { DatePicker } from '../../../components/ui/DatePicker'
import type { AcctAccount } from './constants'

const DETAIL_FIELD_LABEL = 'text-[11px] font-bold text-[var(--text-muted)] mb-1 block'
const DETAIL_INPUT = 'w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-white dark:bg-gray-900 text-[12px] text-[var(--text-primary)] outline-none focus:border-primary-400 transition-colors placeholder:text-[var(--text-muted)]'

const PAY_CATEGORIES = [
  { key: '계좌' as const, label: '계좌', Icon: Landmark, color: '#3b82f6', bg: 'bg-blue-50 dark:bg-blue-900/10', border: 'border-blue-200 dark:border-blue-800', desc: '계좌이체, automatic transfer 등' },
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
  { id: 11, name: '수표', category: '어음' },
  { id: 8, name: '문화상품권', category: '상품권' },
  { id: 9, name: '백화점상품권', category: '상품권' },
  { id: 10, name: '온누리상품권', category: '상품권' },
]


/* ═══ 수단등록 (지출수단 + 입금계정 통합) ═══ */
export default function AcctMethodReg({ catId }: { catId?: string | null }) {
  const [refresh, setRefresh] = useState(0)
  const [direction, setDirection] = useState<'expense' | 'income'>('expense')
  const [newName, setNewName] = useState('')
  const [activeCategory, setActiveCategory] = useState<'계좌' | '현금' | '어음' | '상품권'>('계좌')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [showExpenseList, setShowExpenseList] = useState(false)
  const [checkedExpenseIds, setCheckedExpenseIds] = useState<number[]>([])
  const [noteSubTab, setNoteSubTab] = useState<'수신' | '발행'>('수신')
  const addToast = useToastStore(s => s.add)
  const staffList = useMemo(() => getItem<any[]>('ws_users', []), [])
  const allAccounts: AcctAccount[] = useMemo(() => getItem('acct_accounts', []), [refresh])

  const currentYear = new Date().getFullYear()
  const activeYear = parseInt(new URLSearchParams(window.location.hash.split('?')[1] || '').get('year') || '') || parseInt(localStorage.getItem('acct_active_year') || '') || currentYear

  const budgetCats = useMemo(() => {
    const all = getItem<BudgetCat[]>('acct_budget_cats', [])
    return all.filter(c => {
      const cy = c.year || (c.periodFrom ? parseInt(c.periodFrom.substring(0, 4)) : currentYear)
      return cy === activeYear
    })
  }, [refresh, activeYear])

  const selectedCatId = (catId && catId !== 'all') ? catId : (catId === 'all' ? '' : (budgetCats.length > 0 ? String(budgetCats[0].id) : ''))
  const selectedCatName = selectedCatId ? (budgetCats.find(c => String(c.id) === selectedCatId)?.name || '') : (catId === 'all' ? '전체' : '')

  // 데이터 키: 지출은 acct_pay_methods_v2, 입금은 acct_income_methods
  const storageKey = direction === 'expense' ? 'acct_pay_methods_v2' : 'acct_income_methods'

  void refresh
  const allItems: PayMethodItem[] = useMemo(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return direction === 'expense' ? DEFAULT_PAY_ITEMS : []
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return direction === 'expense' ? DEFAULT_PAY_ITEMS : []
      return parsed as PayMethodItem[]
    } catch { return direction === 'expense' ? DEFAULT_PAY_ITEMS : [] }
  }, [refresh, direction, storageKey])

  // 입금 모드에서 참조할 지출수단 리스트
  const expenseItems: PayMethodItem[] = useMemo(() => {
    if (direction !== 'income') return []
    try {
      const raw = localStorage.getItem('acct_pay_methods_v2')
      if (!raw) return DEFAULT_PAY_ITEMS
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed as PayMethodItem[] : DEFAULT_PAY_ITEMS
    } catch { return DEFAULT_PAY_ITEMS }
  }, [refresh, direction])

  const filteredExpenseItems = useMemo(() => {
    const items = selectedCatId ? expenseItems.filter(i => String(i.budgetCatId) === selectedCatId) : expenseItems
    return items.filter(i => i.category === activeCategory)
  }, [expenseItems, selectedCatId, activeCategory])

  const filteredItems = selectedCatId
    ? allItems.filter(i => String(i.budgetCatId) === selectedCatId)
    : allItems
  const catItems = filteredItems.filter(i => i.category === activeCategory && (activeCategory !== '어음' || (i.noteType || '') === noteSubTab))
  const activeCatInfo = PAY_CATEGORIES.find(c => c.key === activeCategory)!

  /* 카테고리별 총잔액 계산 */
  const categoryBalances = useMemo(() => {
    const cfs: CashFlow[] = getItem('acct_cashflows', [])
    const result: Record<string, number> = {}
    const calcItemBal = (item: any, catKey: string) => {
      const initial = item.initialBalance || 0
      const incomeIn = cfs.filter(cf => cf.type === 'income' && ((cf as any).payMethod || (cf as any).method) === item.name).reduce((s, cf) => s + (cf.amount || 0), 0)
      const transferIn = cfs.filter(cf => (cf as any).type === 'transfer' && (cf as any).debitAccount === catKey && (cf as any).debitDetail === item.name).reduce((s, cf) => s + (cf.amount || 0), 0)
      const expOut = cfs.filter(cf => (cf.type === 'withdrawal' || cf.type === 'expense') && ((cf as any).payMethod || (cf as any).method?.split(':')[0]) === catKey && ((cf as any).payDetail || (cf as any).method?.split(':')[1] || '') === item.name).reduce((s, cf) => s + (cf.amount || 0), 0)
      const transferOut = cfs.filter(cf => (cf as any).type === 'transfer' && (cf as any).creditAccount === catKey && (cf as any).creditDetail === item.name).reduce((s, cf) => s + (cf.amount || 0), 0)
      return initial + incomeIn + transferIn - expOut - transferOut
    }
    // 어음 잔액: 어음대장(notes)의 미결제/추심중 금액 합산
    const calcNoteBal = (item: any) => {
      const notes: any[] = item.notes || []
      return notes.filter((n: any) => !n.status || n.status === '미결제' || n.status === '추심중').reduce((s: number, n: any) => s + (n.amount || 0), 0)
    }
    PAY_CATEGORIES.forEach(cat => {
      const items = filteredItems.filter(i => i.category === cat.key)
      if (cat.key === '어음') {
        result[cat.key] = items.reduce((t, item) => t + calcNoteBal(item), 0)
      } else {
        result[cat.key] = items.reduce((t, item) => t + calcItemBal(item, cat.key), 0)
      }
    })
    // 어음 수신/발행 별도
    const noteItems = filteredItems.filter(i => i.category === '어음')
    result['어음_수신'] = noteItems.filter(i => (i.noteType || '') === '수신').reduce((t, item) => t + calcNoteBal(item), 0)
    result['어음_발행'] = noteItems.filter(i => (i.noteType || '') === '발행').reduce((t, item) => t + calcNoteBal(item), 0)
    return result
  }, [filteredItems, refresh])
  const defaultManager = useMemo(() => {
    const cat = budgetCats.find(c => String(c.id) === selectedCatId)
    if (cat?.users && cat.users.length > 0) return cat.users[0]
    return ''
  }, [budgetCats, selectedCatId])

  const saveAll = (updated: PayMethodItem[]) => {
    setItem(storageKey, updated)
    if (direction === 'expense') {
      setItem('acct_payment_methods', updated.map(i => i.name))
    }
    setRefresh(r => r + 1)
  }

  const handleAdd = () => {
    if (!newName.trim()) return
    const isDuplicate = allItems.some(i =>
      i.name === newName.trim() &&
      i.category === activeCategory &&
      String(i.budgetCatId) === selectedCatId
    )
    if (isDuplicate) {
      addToast('error', `이 예산구분에 이미 존재하는 ${direction === 'expense' ? '지출수단' : '입금계정'}입니다`)
      return
    }
    const newItem: PayMethodItem = {
      id: Date.now(),
      name: newName.trim(),
      category: activeCategory,
      budgetCatId: selectedCatId || undefined,
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

  const updateField = (id: number, field: string, value: any) => {
    saveAll(allItems.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  // ── 카드 CRUD (지출수단 계좌만) ──
  const addCard = (itemId: number) => {
    const newCard: PayMethodCard = { id: Date.now(), cardName: '', cardCompany: '', cardNumber: '', cardType: '체크카드', cardUser: defaultManager }
    saveAll(allItems.map(i => i.id === itemId ? { ...i, cards: [...(i.cards || []), newCard] } : i))
  }
  const updateCard = (itemId: number, cardId: number, field: keyof PayMethodCard, value: string | number) => {
    saveAll(allItems.map(i => i.id === itemId ? { ...i, cards: (i.cards || []).map(c => c.id === cardId ? { ...c, [field]: value } : c) } : i))
  }
  const deleteCard = (itemId: number, cardId: number) => {
    saveAll(allItems.map(i => i.id === itemId ? { ...i, cards: (i.cards || []).filter(c => c.id !== cardId) } : i))
  }

  // ── 어음 CRUD ──
  const addNote = (itemId: number) => {
    const item = allItems.find(i => i.id === itemId)
    const newNote: PayMethodNote = { id: Date.now(), noteNumber: '', issuer: item?.noteType === '발행' ? '우리회사' : '', receiver: item?.noteType === '수신' ? '우리회사' : '', amount: 0, issueDate: getLocalDate(), maturityDate: '', endorsement: '', bank: '', status: '미결제' }
    saveAll(allItems.map(i => i.id === itemId ? { ...i, notes: [...(i.notes || []), newNote] } : i))
  }
  const updateNote = (itemId: number, noteId: number, field: keyof PayMethodNote, value: string | number) => {
    saveAll(allItems.map(i => i.id === itemId ? { ...i, notes: (i.notes || []).map(n => n.id === noteId ? { ...n, [field]: value } : n) } : i))
  }
  const deleteNote = (itemId: number, noteId: number) => {
    saveAll(allItems.map(i => i.id === itemId ? { ...i, notes: (i.notes || []).filter(n => n.id !== noteId) } : i))
  }
  const [endDropKey, setEndDropKey] = React.useState<string | null>(null)
  const [vendorDropKey, setVendorDropKey] = React.useState<string | null>(null)

  const dirLabel = direction === 'expense' ? '지출수단' : '입금계정'

  if (!catId || catId === 'all') {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-[var(--text-primary)] flex items-center gap-2">
              <CreditCard size={20} /> 수단등록
            </h2>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">예산구분별 지출수단과 입금계정을 통합 관리합니다</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-500">
            <AlertTriangle size={32} />
          </div>
          <h3 className="text-lg font-extrabold text-red-500">예산을 먼저 선택해주세요</h3>
          <p className="text-sm text-[var(--text-muted)] text-center">
            상단 예산 탭에서 관리할 예산을 선택한 후<br/>수단등록을 이용할 수 있습니다.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-default)]">
        <div>
          <h2 className="text-lg font-extrabold text-[var(--text-primary)] flex items-center gap-2">
            <CreditCard size={20} /> 수단등록
          </h2>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">예산구분별 지출수단과 수익계정을 관리합니다</p>
        </div>
        <span className="text-xs font-bold text-white px-3 py-1.5 rounded-full w-fit shrink-0" style={{ background: direction === 'expense' ? '#f97316' : '#22c55e' }}>
          {selectedCatName || '전체'} • {direction === 'expense' ? `지출수단 ${filteredItems.length}건` : `수익계정`}
        </span>
      </div>

      {/* 지출/입금 전환 */}
      <div className="flex items-center gap-1 bg-[var(--bg-muted)] rounded-lg px-1 py-0.5 border border-[var(--border-default)] w-fit">
        <button
          onClick={() => { setDirection('expense'); setExpandedId(null); setNewName(''); setShowExpenseList(false) }}
          className={cn('px-3 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1',
            direction === 'expense' ? 'bg-orange-500 text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          )}
        >
          <ArrowUpCircle size={12} /> 지출
        </button>
        <button
          onClick={() => { setDirection('income'); setExpandedId(null); setNewName(''); setShowExpenseList(false) }}
          className={cn('px-3 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1',
            direction === 'income' ? 'bg-emerald-500 text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          )}
        >
          <ArrowDownCircle size={12} /> 수익계정
        </button>
      </div>

      {/* 입금 방향: 공통 수익계정 관리 */}
      {direction === 'income' ? (
        <div className="rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-900/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl text-emerald-500"><TrendingUp size={20} /></span>
              <div>
                <h3 className="text-sm font-extrabold text-emerald-600">공통 수익계정</h3>
                <p className="text-[10px] text-[var(--text-muted)]">입금전표 작성 시 선택할 수익계정을 관리합니다</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20">
              {(() => {
                const codes: string[] = getItem(`acct_revenue_accounts_${selectedCatId}`, [])
                return `${codes.length}건`
              })()}
            </span>
          </div>

          {/* 수익계정 목록 — 스위치 토글 */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
            {/* 헤더 */}
            <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--border-default)] bg-[var(--bg-muted)]">
              <span className="w-[40px] text-[10px] font-bold text-[var(--text-muted)] text-center">사용</span>
              <span className="w-[80px] text-[10px] font-bold text-[var(--text-muted)]">코드</span>
              <span className="flex-1 text-[10px] font-bold text-[var(--text-muted)]">계정과목명</span>
              <span className="w-[60px] text-[10px] font-bold text-[var(--text-muted)]">구분</span>
              <span className="w-[100px] text-[10px] font-bold text-[var(--text-muted)]">그룹</span>
            </div>
            {/* 목록 */}
            <div className="max-h-[400px] overflow-y-auto">
              {(() => {
                const incomeAccounts = allAccounts.filter(a => a.active !== false && (a as any).incomeEnabled === true)
                const enabledCodes: string[] = getItem(`acct_revenue_accounts_${selectedCatId}`, [])
                if (incomeAccounts.length === 0) return (
                  <div className="py-8 text-center text-sm text-[var(--text-muted)]">
                    입금계정에서 활성화된 계정이 없습니다.<br/>계정관리 &gt; 입금계정 탭에서 먼저 활성화해주세요.
                  </div>
                )
                // 활성화된 것 우선, 그다음 코드순
                const sorted = [...incomeAccounts].sort((a, b) => {
                  const aOn = enabledCodes.some(c => c.startsWith(a.code))
                  const bOn = enabledCodes.some(c => c.startsWith(b.code))
                  if (aOn && !bOn) return -1
                  if (!aOn && bOn) return 1
                  return a.code.localeCompare(b.code)
                })
                const ACCT_TYPE_MAP: Record<string, { label: string; color: string }> = {
                  asset: { label: '자산', color: '#4f6ef7' },
                  liability: { label: '부채', color: '#ef4444' },
                  equity: { label: '자본', color: '#8b5cf6' },
                  revenue: { label: '수익', color: '#22c55e' },
                  expense: { label: '비용', color: '#f59e0b' },
                }
                return sorted.map(a => {
                  const codeStr = `${a.code} ${a.name}`
                  const isOn = enabledCodes.includes(codeStr)
                  const typeInfo = ACCT_TYPE_MAP[a.type] || { label: a.type, color: '#888' }
                  return (
                    <div key={a.code} className={cn("flex items-center gap-3 px-4 py-2.5 border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-muted)] transition-colors", !isOn && 'opacity-50')}>
                      <button
                        onClick={() => {
                          let codes: string[] = getItem(`acct_revenue_accounts_${selectedCatId}`, [])
                          if (isOn) {
                            codes = codes.filter(c => c !== codeStr)
                          } else {
                            codes.push(codeStr)
                          }
                          setItem(`acct_revenue_accounts_${selectedCatId}`, codes)
                          setRefresh(r => r + 1)
                        }}
                        className={cn('w-[36px] h-[18px] rounded-full transition-colors shrink-0 cursor-pointer relative', isOn ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600')}
                      >
                        <span className={cn('absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow transition-all', isOn ? 'left-[19px]' : 'left-[2px]')} />
                      </button>
                      <span className="w-[80px] text-xs font-bold text-[var(--text-primary)]">{a.code}</span>
                      <span className="flex-1 text-sm font-semibold text-[var(--text-primary)]">{a.name}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: typeInfo.color, background: `${typeInfo.color}15` }}>{typeInfo.label}</span>
                      <span className="w-[100px] text-[10px] text-[var(--text-muted)]">{a.group || '-'}</span>
                    </div>
                  )
                })
              })()}
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
            <p className="text-[10px] text-blue-600 font-bold flex items-center gap-1"><Lightbulb size={11} /> 입금전표 작성 시</p>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">입금수단은 <b>지출수단</b>(계좌, 현금 등)에서 선택하고, 여기서 활성화한 수익계정 중 하나를 선택합니다.</p>
          </div>
        </div>
      ) : (
      <>

      {/* 카테고리 탭 */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {PAY_CATEGORIES.map(cat => {
          const count = filteredItems.filter(i => i.category === cat.key).length
          const isActive = activeCategory === cat.key
          const bal = categoryBalances[cat.key] || 0
          return (
            <button
              key={cat.key}
              onClick={() => { setActiveCategory(cat.key); setExpandedId(null) }}
              className={`py-2 px-1 sm:py-3 sm:px-4 rounded-xl border-2 transition-all cursor-pointer ${
                isActive ? `${cat.bg} ${cat.border} shadow-sm` : 'bg-[var(--bg-surface)] border-transparent hover:border-[var(--border-default)]'
              }`}
            >
              <div className="flex flex-col items-center">
                <cat.Icon size={16} style={{ color: isActive ? cat.color : undefined }} className="sm:w-[18px] sm:h-[18px]" />
                <div className={`text-[11px] sm:text-[12px] font-extrabold mt-1 ${isActive ? '' : 'text-[var(--text-secondary)]'}`} style={isActive ? { color: cat.color } : undefined}>{cat.label}</div>
                <div className="text-[9px] sm:text-[10px] font-bold text-[var(--text-muted)] mt-0.5">{count}건</div>
                {count > 0 && cat.key === '어음' ? (
                  <div className="flex flex-col items-center mt-0.5 gap-px">
                    <div className={`text-[8px] sm:text-[9px] font-extrabold ${(categoryBalances['어음_수신'] || 0) < 0 ? 'text-red-500' : 'text-blue-600'}`}>받을 {formatNumber(categoryBalances['어음_수신'] || 0)}원</div>
                    <div className={`text-[8px] sm:text-[9px] font-extrabold ${(categoryBalances['어음_발행'] || 0) < 0 ? 'text-red-500' : 'text-amber-600'}`}>지급 {formatNumber(categoryBalances['어음_발행'] || 0)}원</div>
                  </div>
                ) : count > 0 && <div className={`text-[9px] sm:text-[10px] font-extrabold mt-0.5 ${bal < 0 ? 'text-red-500' : 'text-blue-600'}`}>{formatNumber(bal)}원</div>}
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
              <h3 className="text-sm font-extrabold" style={{ color: activeCatInfo.color }}>{activeCatInfo.label} {dirLabel}</h3>
              <p className="text-[10px] text-[var(--text-muted)]">{activeCatInfo.desc}</p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: activeCatInfo.color, background: `${activeCatInfo.color}15` }}>{catItems.length}건</span>
        </div>

        {/* 어음: 수신/발행 서브탭 */}
        {activeCategory === '어음' ? (
          <div className="mb-4">
            <div className="flex items-center gap-1.5 sm:gap-2">
              {(['수신', '발행'] as const).map(sub => {
                const subCount = filteredItems.filter(i => i.category === '어음' && (i.noteType || '') === sub).length
                const isActive = noteSubTab === sub
                const subColor = sub === '수신' ? '#3b82f6' : '#ef4444'
                const subBal = categoryBalances[`어음_${sub}`] || 0
                return (
                  <button
                    key={sub}
                    onClick={() => { setNoteSubTab(sub); setExpandedId(null) }}
                    className={`flex-1 py-2 px-1.5 sm:py-2.5 sm:px-4 rounded-xl border-2 transition-all cursor-pointer ${
                      isActive ? 'shadow-sm' : 'bg-white/50 dark:bg-gray-900/30 border-transparent hover:border-[var(--border-default)]'
                    }`}
                    style={isActive ? { borderColor: subColor, background: `${subColor}08` } : undefined}
                  >
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                      {sub === '수신' ? <ArrowDownCircle size={13} style={{ color: subColor }} className="shrink-0" /> : <ArrowUpCircle size={13} style={{ color: subColor }} className="shrink-0" />}
                      <span className="text-[11px] sm:text-[12px] font-extrabold whitespace-nowrap" style={isActive ? { color: subColor } : { color: 'var(--text-secondary)' }}>
                        {sub === '수신' ? (
                          <>
                            <span className="hidden xs:inline">수신어음 (받을어음)</span>
                            <span className="inline xs:hidden">받을어음</span>
                          </>
                        ) : (
                          <>
                            <span className="hidden xs:inline">발행어음 (지급어음)</span>
                            <span className="inline xs:hidden">지급어음</span>
                          </>
                        )}
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0" style={{ color: subColor, background: `${subColor}15` }}>{subCount}</span>
                    </div>
                    {subCount > 0 && (
                      <div className="text-[10px] sm:text-[11px] font-extrabold mt-1" style={{ color: subColor }}>
                        {formatNumber(subBal)}원
                      </div>
                    )}
                  </button>
                )
              })}
              <button
                onClick={() => {
                  const nm = `${noteSubTab === '수신' ? '수신' : '발행'}어음 ${filteredItems.filter(i => i.category === '어음' && (i.noteType || '') === noteSubTab).length + 1}`
                  const acctCode = noteSubTab === '수신' ? '1-01-06' : '2-01-02'
                  const newItem: any = {
                    id: Date.now(), name: nm, category: '어음' as const,
                    budgetCatId: selectedCatId || undefined,
                    noteType: noteSubTab, linkedAccountCode: acctCode,
                    noteManager: defaultManager || undefined,
                  }
                  saveAll([...allItems, newItem])
                  addToast('success', `${noteSubTab}어음 "${nm}" 추가`)
                  setRefresh(r => r + 1)
                }}
                className="px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold transition-all cursor-pointer hover:shadow-md flex items-center gap-1 shrink-0"
                style={{ background: noteSubTab === '수신' ? '#3b82f6' : '#ef4444' }}
              >
                <Plus size={13} /> 추가
              </button>
            </div>
          </div>
        ) : (
        <>
        {/* 추가 폼 */}
        <div className="relative mb-4">
          <div className="flex gap-2">
            {activeCategory === '계좌' ? (
              <div className="flex-1 relative">
                <input
                  readOnly
                  placeholder="▼ 계좌관리에서 등록된 계좌를 선택하세요"
                  value={newName}
                  onClick={() => { const dd = document.getElementById('method-acct-dropdown'); if (dd) dd.style.display = dd.style.display === 'block' ? 'none' : 'block' }}
                  onBlur={() => setTimeout(() => { const dd = document.getElementById('method-acct-dropdown'); if (dd) dd.style.display = 'none' }, 200)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-default)] bg-white dark:bg-gray-900 text-sm text-[var(--text-primary)] outline-none focus:border-primary-400 transition-colors placeholder:text-[var(--text-muted)] cursor-pointer"
                />
                <div id="method-acct-dropdown" style={{ display: 'none' }} className="absolute z-50 top-full left-0 right-0 mt-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-xl max-h-48 overflow-y-auto">
                  {(() => {
                    const companyAccts = getItem<any[]>('acct_company_accounts', [])
                    if (companyAccts.length === 0) return <div className="px-3 py-3 text-xs text-[var(--text-muted)] text-center">계좌관리에서 계좌를 먼저 등록하세요</div>
                    const filtered = companyAccts
                    return filtered.map((a: any) => {
                      const label = `${a.bankName || ''} ${a.accountNumber || ''}`.trim()
                      const alreadyAdded = catItems.some(ci => ci.name === label)
                      return (
                        <button
                          key={a.id}
                          type="button"
                          disabled={alreadyAdded}
                          onMouseDown={e => {
                            e.preventDefault()
                            if (alreadyAdded) return
                            // 계좌 추가 + 카드 자동 연동
                            const newItem: PayMethodItem = {
                              id: Date.now(),
                              name: label,
                              category: '계좌',
                              budgetCatId: selectedCatId || undefined,
                              manager: defaultManager,
                              bankName: a.bankName,
                              accountNumber: a.accountNumber,
                              accountHolder: a.accountHolder,
                              cards: (a.cards || []).map((c: any, idx: number) => ({
                                id: Date.now() + idx + 1,
                                cardName: c.cardName || '',
                                cardCompany: c.cardCompany || '',
                                cardNumber: c.cardNumber || '',
                                cardType: c.cardType || '체크카드',
                                cardUser: c.cardUser || defaultManager
                              }))
                            }
                            saveAll([...allItems, newItem])
                            addToast('success', `"${label}" 계좌 + ${(a.cards || []).length}장 카드 추가됨`)
                            setNewName('')
                            setExpandedId(newItem.id)
                            const dd = document.getElementById('method-acct-dropdown'); if (dd) dd.style.display = 'none'
                          }}
                          className={`w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center justify-between ${alreadyAdded ? 'opacity-40 cursor-not-allowed' : 'hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer'}`}
                        >
                          <div>
                            <span className="font-bold text-[var(--text-primary)]">{a.bankName}</span>
                            <span className="text-[var(--text-muted)] ml-1.5 font-mono text-xs">{a.accountNumber}</span>
                            {a.accountHolder && <span className="text-[var(--text-secondary)] ml-1.5 text-xs">({a.accountHolder})</span>}
                          </div>
                          <div className="flex items-center gap-1">
                            {(a.cards || []).length > 0 && <span className="text-[10px] font-bold text-violet-500 bg-violet-50 dark:bg-violet-900/20 px-1.5 py-0.5 rounded">카드 {(a.cards || []).length}</span>}
                            {alreadyAdded && <span className="text-[10px] font-bold text-emerald-500">등록됨</span>}
                          </div>
                        </button>
                      )
                    })
                  })()}
                </div>
              </div>
            ) : (
            <input
              placeholder={direction === 'income' ? `${activeCatInfo.label} 입금계정 입력 또는 Enter로 지출수단 선택...` : `새 ${activeCatInfo.label} 지출수단 입력...`}
              value={newName}
              onChange={e => { setNewName(e.target.value); if (direction === 'income') setShowExpenseList(true) }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  if (direction === 'income' && !newName.trim()) {
                    e.preventDefault()
                    setShowExpenseList(!showExpenseList)
                  } else {
                    handleAdd()
                    setShowExpenseList(false)
                  }
                }
                if (e.key === 'Escape') setShowExpenseList(false)
              }}
              onFocus={() => { if (direction === 'income') setShowExpenseList(true) }}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-[var(--border-default)] bg-white dark:bg-gray-900 text-sm text-[var(--text-primary)] outline-none focus:border-primary-400 transition-colors placeholder:text-[var(--text-muted)]"
            />
            )}
            {activeCategory !== '계좌' && (
            <button onClick={() => { handleAdd(); setShowExpenseList(false) }} className="px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-all cursor-pointer hover:shadow-md flex items-center gap-1.5" style={{ background: activeCatInfo.color }}>
              <Plus size={14} /> 추가
            </button>
            )}
          </div>

          {/* 입금 모드: 지출수단 복수선택 드롭다운 */}
          {direction === 'income' && showExpenseList && (() => {
            const visibleItems = filteredExpenseItems.filter(ei => !newName.trim() || ei.name.toLowerCase().includes(newName.toLowerCase()))
            const selectableItems = visibleItems.filter(ei => !catItems.some(ci => ci.name === ei.name))
            const checkedCount = checkedExpenseIds.length
            return (
            <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white dark:bg-gray-900 rounded-xl border border-[var(--border-default)] shadow-lg max-h-[320px] flex flex-col">
              {/* 헤더 */}
              <div className="p-2.5 border-b border-[var(--border-default)] flex items-center justify-between shrink-0">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase flex items-center gap-1"><ClipboardList size={11} /> 지출수단에서 선택 ({filteredExpenseItems.length}건)</span>
                <div className="flex items-center gap-2">
                  {selectableItems.length > 0 && (
                    <button
                      onClick={() => {
                        if (checkedExpenseIds.length === selectableItems.length) {
                          setCheckedExpenseIds([])
                        } else {
                          setCheckedExpenseIds(selectableItems.map(i => i.id))
                        }
                      }}
                      className="text-[10px] font-bold text-primary-500 hover:text-primary-700 cursor-pointer"
                    >
                      {checkedExpenseIds.length === selectableItems.length ? '전체해제' : '전체선택'}
                    </button>
                  )}
                  {checkedCount > 0 && (
                    <button
                      onClick={() => {
                        const incomeAll: PayMethodItem[] = (() => { try { return JSON.parse(localStorage.getItem('acct_income_methods') || '[]') } catch { return [] } })()
                        const toAdd = filteredExpenseItems.filter(ei => checkedExpenseIds.includes(ei.id) && !catItems.some(ci => ci.name === ei.name))
                        const newItems = toAdd.map((ei, i) => ({ ...ei, id: Date.now() + i, budgetCatId: selectedCatId || undefined }))
                        setItem('acct_income_methods', [...incomeAll, ...newItems])
                        setRefresh(r => r + 1)
                        addToast('success', `${newItems.length}건 입금계정에 추가됨`)
                        setShowExpenseList(false)
                        setCheckedExpenseIds([])
                        setNewName('')
                      }}
                      className="px-3 py-1 rounded-lg bg-emerald-500 text-white text-[11px] font-bold cursor-pointer hover:bg-emerald-600 flex items-center gap-1 shadow-sm"
                    >
                      <Check size={12} /> {checkedCount}건 추가
                    </button>
                  )}
                </div>
              </div>
              {/* 리스트 */}
              <div className="overflow-y-auto flex-1">
              {filteredExpenseItems.length === 0 ? (
                <div className="p-4 text-center text-[11px] text-[var(--text-muted)]">
                  이 예산의 {activeCatInfo.label} 지출수단이 없습니다. 직접 입력 후 추가하세요.
                </div>
              ) : (
                visibleItems.map(ei => {
                    const alreadyAdded = catItems.some(ci => ci.name === ei.name)
                    const isChecked = checkedExpenseIds.includes(ei.id)
                    return (
                      <button
                        key={ei.id}
                        onClick={() => {
                          if (alreadyAdded) return
                          setCheckedExpenseIds(prev => isChecked ? prev.filter(id => id !== ei.id) : [...prev, ei.id])
                        }}
                        className={cn(
                          'w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors',
                          alreadyAdded ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[var(--bg-muted)] cursor-pointer',
                          isChecked && !alreadyAdded && 'bg-emerald-50/50 dark:bg-emerald-900/10'
                        )}
                      >
                        {/* 체크박스 */}
                        <div className={cn(
                          'w-4.5 h-4.5 rounded border-2 flex items-center justify-center shrink-0 transition-all',
                          alreadyAdded ? 'border-emerald-300 bg-emerald-100' : isChecked ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300 dark:border-gray-600'
                        )}>
                          {(isChecked || alreadyAdded) && <Check size={10} className={alreadyAdded ? 'text-emerald-400' : 'text-white'} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold text-[var(--text-primary)]">{ei.name}</span>
                          {ei.bankName && <span className="text-[10px] text-[var(--text-muted)] ml-2">{ei.bankName} {ei.accountNumber || ''}</span>}
                        </div>
                        {alreadyAdded && <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">등록됨</span>}
                        {(ei as any).accountCode && <span className="text-[9px] font-bold text-violet-500 bg-violet-50 dark:bg-violet-900/20 px-1.5 py-0.5 rounded">{(ei as any).accountCode}</span>}
                      </button>
                    )
                  })
              )}
              </div>
              {newName.trim() && !filteredExpenseItems.some(ei => ei.name === newName.trim()) && (
                <div className="p-2 border-t border-[var(--border-default)] shrink-0">
                  <button
                    onClick={() => { handleAdd(); setShowExpenseList(false); setCheckedExpenseIds([]) }}
                    className="w-full text-left px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 text-sm font-bold hover:bg-emerald-100 cursor-pointer flex items-center gap-2"
                  >
                    <Plus size={14} /> "{newName.trim()}" 새로 추가
                  </button>
                </div>
              )}
            </div>
            )
          })()}
        </div>
        </>
        )}

        {/* 항목 리스트 */}
        {catItems.length === 0 ? (
          <div className="py-8 text-center text-sm text-[var(--text-muted)] rounded-xl border border-dashed border-[var(--border-default)] bg-white/50 dark:bg-gray-900/50">
            등록된 {activeCatInfo.label} {dirLabel}이 없습니다
          </div>
        ) : (
          <div className="space-y-1.5">
            {catItems.map((item, idx) => {
              const isOpen = expandedId === item.id
              return (
                <div key={item.id} className={`rounded-xl transition-all border ${isOpen ? 'border-[var(--border-default)] bg-white dark:bg-gray-900/60 shadow-sm' : 'border-transparent bg-white/70 dark:bg-gray-900/30 hover:bg-white dark:hover:bg-gray-800/50 hover:border-[var(--border-default)]'}`}>
                  {/* 메인 행 */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2.5 cursor-pointer group" onClick={() => setExpandedId(isOpen ? null : item.id)}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-[10px] font-bold w-5 h-5 flex items-center justify-center shrink-0 rounded-full py-0.5" style={{ color: activeCatInfo.color, background: `${activeCatInfo.color}15` }}>{idx + 1}</span>
                      <input value={item.name} onChange={e => { e.stopPropagation(); updateField(item.id, 'name', e.target.value) }} onClick={e => e.stopPropagation()} placeholder="이름 입력" className="text-sm font-semibold text-[var(--text-primary)] flex-1 min-w-0 bg-transparent border-none outline-none focus:bg-[var(--bg-muted)] focus:px-2 focus:rounded-md transition-all" />
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto flex-wrap justify-end">
                      {activeCategory === '현금' && (() => {
                        const cfs: CashFlow[] = getItem('acct_cashflows', [])
                        const cashIn = cfs.filter(cf => (cf as any).type === 'transfer' && (cf as any).debitAccount === '현금' && (cf as any).debitDetail === item.name).reduce((s, cf) => s + (cf.amount || 0), 0)
                        const cashOutT = cfs.filter(cf => (cf as any).type === 'transfer' && (cf as any).creditAccount === '현금' && (cf as any).creditDetail === item.name).reduce((s, cf) => s + (cf.amount || 0), 0)
                        const cashOutE = cfs.filter(cf => (cf.type === 'withdrawal' || cf.type === 'expense') && ((cf as any).payMethod || (cf as any).method) === '현금' && ((cf as any).payDetail || '') === item.name).reduce((s, cf) => s + (cf.amount || 0), 0)
                        const bal = (item.initialBalance || 0) + cashIn - cashOutT - cashOutE
                        return (
                          <>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 whitespace-nowrap shrink-0">1-01-01 현금</span>
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded whitespace-nowrap shrink-0 ${bal < 0 ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'} flex items-center gap-1`}>
                              <Coins size={10} /> {bal.toLocaleString('ko-KR')}원
                            </span>
                          </>
                        )
                      })()}
                      {activeCategory === '상품권' && (() => {
                        const qty = item.voucherQty || 0
                        const cfs: CashFlow[] = getItem('acct_cashflows', [])
                        const usedQty = cfs.filter(cf => (cf.type === 'withdrawal' || cf.type === 'expense') && ((cf as any).payMethod || (cf as any).method) === '상품권' && ((cf as any).payDetail || '') === item.name).length
                        const remain = qty - usedQty
                        return (
                          <>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-pink-50 dark:bg-pink-900/20 text-pink-600 whitespace-nowrap shrink-0">1-01-08 상품권</span>
                            {qty > 0 && (
                              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded whitespace-nowrap shrink-0 ${remain <= 0 ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'} flex items-center gap-1`}>
                                <Ticket size={10} /> {remain}매 / {qty}매
                              </span>
                            )}
                          </>
                        )
                      })()}
                      {activeCategory === '계좌' && (() => {
                        const cfs: CashFlow[] = getItem('acct_cashflows', [])
                        const acctIn = cfs.filter(cf => cf.type === 'income' && ((cf as any).payMethod || (cf as any).method) === item.name).reduce((s, cf) => s + (cf.amount || 0), 0)
                        const acctInT = cfs.filter(cf => (cf as any).type === 'transfer' && (cf as any).debitAccount === '계좌' && (cf as any).debitDetail === item.name).reduce((s, cf) => s + (cf.amount || 0), 0)
                        const acctOut = cfs.filter(cf => (cf.type === 'withdrawal' || cf.type === 'expense') && ((cf as any).payMethod || (cf as any).method?.split(':')[0]) === '계좌' && ((cf as any).payDetail || (cf as any).method?.split(':')[1] || '') === item.name).reduce((s, cf) => s + (cf.amount || 0), 0)
                        const acctOutT = cfs.filter(cf => (cf as any).type === 'transfer' && (cf as any).creditAccount === '계좌' && (cf as any).creditDetail === item.name).reduce((s, cf) => s + (cf.amount || 0), 0)
                        const bal = (item.initialBalance || 0) + acctIn + acctInT - acctOut - acctOutT
                        return (
                          <>
                            {item.bankName && !isOpen && <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[120px] sm:max-w-[200px] whitespace-nowrap shrink-0">{item.bankName} {item.accountNumber ? `• ${item.accountNumber}` : ''}</span>}
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded whitespace-nowrap shrink-0 ${bal < 0 ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'}`}>
                              {bal.toLocaleString('ko-KR')}원
                            </span>
                          </>
                        )
                      })()}
                      {activeCategory === '어음' && (() => {
                        const notes: any[] = item.notes || []
                        const activeNotes = notes.filter((n: any) => !n.status || n.status === '미결제' || n.status === '추심중')
                        const noteBal = activeNotes.reduce((s: number, n: any) => s + (n.amount || 0), 0)
                        const noteColor = item.noteType === '수신' ? '#3b82f6' : '#ef4444'
                        return (
                          <>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap shrink-0" style={{ color: noteColor, background: `${noteColor}15` }}>
                              {notes.length}건
                            </span>
                            {noteBal > 0 && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded whitespace-nowrap shrink-0" style={{ color: noteColor, background: `${noteColor}10` }}>
                                {formatNumber(noteBal)}원
                              </span>
                            )}
                          </>
                        )
                      })()}
                      {/* 연결된 계정과목 표시 */}
                      {activeCategory !== '현금' && activeCategory !== '상품권' && (item as any).accountCode && !isOpen && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-violet-50 dark:bg-violet-900/20 text-violet-600 whitespace-nowrap shrink-0">{(item as any).accountCode}</span>
                      )}
                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        <ChevronDown size={14} className={`text-[var(--text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        <button onClick={e => { e.stopPropagation(); handleDelete(item.id) }} className="p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-danger cursor-pointer opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 상세 필드 */}
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 border-t border-[var(--border-default)] mx-3">
                      {/* 계정과목 연결 */}
                      {(activeCategory !== '어음' && activeCategory !== '현금' && activeCategory !== '상품권' || direction === 'income') && (
                      <div className="mb-3 mt-3 p-3 rounded-lg bg-violet-50/50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800">
                        {direction === 'income' ? (
                          <>
                            <label className="text-[11px] font-bold text-violet-600 mb-2 block flex items-center gap-1"><ClipboardList size={12} /> 계정과목 연결 (입금전표 자동 설정)</label>
                            <div className="mb-3">
                              <label className="text-[10px] font-bold text-blue-500 mb-1 block flex items-center gap-1"><Coins size={11} /> 차변 (입금처 - 자산계정) — 고정</label>
                              {activeCategory === '현금' ? (
                                <div className={`${DETAIL_INPUT} !bg-[var(--bg-muted)] flex items-center gap-1.5`}>
                                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">자산</span>
                                  <span className="text-xs font-bold">1-01-01 현금</span>
                                </div>
                              ) : activeCategory === '상품권' ? (
                                <div className={`${DETAIL_INPUT} !bg-[var(--bg-muted)] flex items-center gap-1.5`}>
                                  <span className="text-[10px] font-bold text-pink-500 bg-pink-50 dark:bg-pink-900/20 px-1.5 py-0.5 rounded">자산</span>
                                  <span className="text-xs font-bold">1-01-08 상품권</span>
                                </div>
                              ) : (
                                <select
                                  value={(item as any).accountCode || ''}
                                  onChange={e => updateField(item.id, 'accountCode', e.target.value)}
                                  className={DETAIL_INPUT}
                                >
                                  <option value="">— 입금계정 선택 —</option>
                                  {allAccounts.filter(a => a.active !== false && (a as any).incomeEnabled === true).map(a => (
                                    <option key={a.code} value={`${a.code} ${a.name}`}>{a.code} {a.name}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[10px] font-bold text-emerald-500 flex items-center gap-1"><TrendingUp size={11} /> 대변 (수익계정) — 복수 등록 가능</label>
                                <button
                                  onClick={() => {
                                    const codes: string[] = (item as any).revenueAccountCodes || ((item as any).revenueAccountCode ? [(item as any).revenueAccountCode] : [])
                                    codes.push('')
                                    saveAll(allItems.map(i => i.id === item.id ? { ...i, revenueAccountCodes: codes } : i))
                                  }}
                                  className="text-[10px] font-bold text-emerald-500 hover:text-emerald-700 cursor-pointer flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                                >
                                  <Plus size={10} /> 추가
                                </button>
                              </div>
                              {(() => {
                                const codes: string[] = (item as any).revenueAccountCodes || ((item as any).revenueAccountCode ? [(item as any).revenueAccountCode] : [''])
                                if (codes.length === 0) codes.push('')
                                return codes.map((code: string, ci: number) => (
                                  <div key={ci} className="flex items-center gap-1.5 mb-1.5">
                                    <select
                                      value={code}
                                      onChange={e => {
                                        const newCodes = [...codes]
                                        newCodes[ci] = e.target.value
                                        saveAll(allItems.map(i => i.id === item.id ? { ...i, revenueAccountCodes: newCodes } : i))
                                      }}
                                      className={DETAIL_INPUT + ' flex-1'}
                                    >
                                      <option value="">— 수익계정 선택 —</option>
                                      {allAccounts.filter(a => a.active !== false && a.type === 'revenue').map(a => (
                                        <option key={a.code} value={`${a.code} ${a.name}`}>{a.code} {a.name}</option>
                                      ))}
                                    </select>
                                    {codes.length > 1 && (
                                      <button
                                        onClick={() => {
                                          const newCodes = codes.filter((_, idx) => idx !== ci)
                                          saveAll(allItems.map(i => i.id === item.id ? { ...i, revenueAccountCodes: newCodes } : i))
                                        }}
                                        className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-600 cursor-pointer"
                                      >
                                        <Trash2 size={11} />
                                      </button>
                                    )}
                                  </div>
                                ))
                              })()}
                            </div>
                          </>
                        ) : (
                          <>
                            <label className="text-[11px] font-bold text-violet-600 mb-1 block flex items-center gap-1"><ClipboardList size={12} /> 계정과목 연결</label>
                            <select
                              value={(item as any).accountCode || ''}
                              onChange={e => updateField(item.id, 'accountCode', e.target.value)}
                              className={DETAIL_INPUT}
                            >
                              <option value="">— 계정과목 선택 —</option>
                              {allAccounts.filter(a => a.active !== false).map(a => (
                                <option key={a.code} value={`${a.code} ${a.name}`}>{a.code} {a.name}</option>
                              ))}
                            </select>
                          </>
                        )}
                      </div>
                      )}

                      {/* 계좌 상세 */}
                      {activeCategory === '계좌' && (
                        <>
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className={DETAIL_FIELD_LABEL}>은행명 *</label><input value={item.bankName || ''} onChange={e => updateField(item.id, 'bankName', e.target.value)} placeholder="국민은행" className={DETAIL_INPUT} /></div>
                          <div><label className={DETAIL_FIELD_LABEL}>계좌번호 *</label><input value={item.accountNumber || ''} onChange={e => updateField(item.id, 'accountNumber', e.target.value)} placeholder="110-234-567890" className={DETAIL_INPUT} /></div>
                          <div><label className={DETAIL_FIELD_LABEL}>예금주 *</label><input value={item.accountHolder || ''} onChange={e => updateField(item.id, 'accountHolder', e.target.value)} placeholder="(주)문화재청" className={DETAIL_INPUT} /></div>
                          <div>
                            <label className={DETAIL_FIELD_LABEL}>계좌관리자 *</label>
                            <select value={item.manager || ''} onChange={e => updateField(item.id, 'manager', e.target.value)} className={DETAIL_INPUT}>
                              <option value="">선택하세요</option>
                              {staffList.map((s: any) => (<option key={s.id || s.name} value={s.name}>{s.name}{s.role ? ` (${s.role})` : ''}{s.dept ? ` - ${s.dept}` : ''}</option>))}
                            </select>
                          </div>
                          <div><label className={DETAIL_FIELD_LABEL}>용도</label><input value={item.purpose || ''} onChange={e => updateField(item.id, 'purpose', e.target.value)} placeholder="운영자금 등" className={DETAIL_INPUT} /></div>
                          <div><label className={DETAIL_FIELD_LABEL}>메모</label><input value={item.memo || ''} onChange={e => updateField(item.id, 'memo', e.target.value)} placeholder="참고사항" className={DETAIL_INPUT} /></div>
                        </div>
                        {/* 잔액 관리 */}
                        <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/10 dark:to-indigo-900/10 border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-1.5 mb-2.5">
                            <Wallet size={13} className="text-blue-500" />
                            <span className="text-[11px] font-extrabold text-blue-700 dark:text-blue-400">잔액 관리</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className={DETAIL_FIELD_LABEL}>기초잔액</label>
                              <input
                                value={item.initialBalance ? item.initialBalance.toLocaleString() : ''}
                                onChange={e => {
                                  const num = parseInt(e.target.value.replace(/[^0-9-]/g, '')) || 0
                                  saveAll(allItems.map(i => i.id === item.id ? { ...i, initialBalance: num } : i))
                                }}
                                placeholder="0"
                                className={`${DETAIL_INPUT} text-right`}
                              />
                            </div>
                            {(() => {
                              const cfs: CashFlow[] = getItem('acct_cashflows', [])
                              const acctIn = cfs.filter(cf => cf.type === 'income' && ((cf as any).payMethod || (cf as any).method) === item.name).reduce((s, cf) => s + (cf.amount || 0), 0)
                              const acctInT = cfs.filter(cf => (cf as any).type === 'transfer' && (cf as any).debitAccount === '계좌' && (cf as any).debitDetail === item.name).reduce((s, cf) => s + (cf.amount || 0), 0)
                              const acctOut = cfs.filter(cf => (cf.type === 'withdrawal' || cf.type === 'expense') && ((cf as any).payMethod || (cf as any).method?.split(':')[0]) === '계좌' && ((cf as any).payDetail || (cf as any).method?.split(':')[1] || '') === item.name).reduce((s, cf) => s + (cf.amount || 0), 0)
                              const acctOutT = cfs.filter(cf => (cf as any).type === 'transfer' && (cf as any).creditAccount === '계좌' && (cf as any).creditDetail === item.name).reduce((s, cf) => s + (cf.amount || 0), 0)
                              const totalIn = acctIn + acctInT
                              const totalOut = acctOut + acctOutT
                              const currentBal = (item.initialBalance || 0) + totalIn - totalOut
                              return (
                                <>
                                  <div>
                                    <label className={DETAIL_FIELD_LABEL}>입금 / 출금</label>
                                    <div className="flex items-center gap-1">
                                      <span className="text-[11px] font-bold text-emerald-600">+{totalIn.toLocaleString('ko-KR')}</span>
                                      <span className="text-[10px] text-[var(--text-muted)]">/</span>
                                      <span className="text-[11px] font-bold text-red-500">-{totalOut.toLocaleString('ko-KR')}</span>
                                    </div>
                                  </div>
                                  <div>
                                    <label className={DETAIL_FIELD_LABEL}>현재잔액</label>
                                    <div className={`w-full px-3 py-2 rounded-lg border text-sm font-extrabold text-right ${currentBal < 0 ? 'border-red-300 bg-red-50 dark:bg-red-900/10 text-red-600' : 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600'}`}>
                                      {currentBal.toLocaleString('ko-KR')}원
                                    </div>
                                  </div>
                                </>
                              )
                            })()}
                          </div>
                        </div>
                        </>
                      )}

                      {/* 현금 상세 */}
                      {activeCategory === '현금' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className={DETAIL_FIELD_LABEL}>보관처 *</label><input value={item.storageLocation || ''} onChange={e => updateField(item.id, 'storageLocation', e.target.value)} placeholder="사무실 금고" className={DETAIL_INPUT} /></div>
                          <div>
                            <label className={DETAIL_FIELD_LABEL}>보관책임자 *</label>
                            <select value={item.custodian || ''} onChange={e => updateField(item.id, 'custodian', e.target.value)} className={DETAIL_INPUT}>
                              <option value="">선택하세요</option>
                              {staffList.map((s: any) => (<option key={s.id || s.name} value={s.name}>{s.name}{s.role ? ` (${s.role})` : ''}{s.dept ? ` - ${s.dept}` : ''}</option>))}
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
                            <label className={cn(DETAIL_FIELD_LABEL, "flex items-center gap-1")}><Coins size={11} /> 현금잔액</label>
                            {(() => {
                              const cfs: CashFlow[] = getItem('acct_cashflows', [])
                              const cashIn = cfs.filter(cf => (cf as any).type === 'transfer' && (cf as any).debitAccount === '현금' && (cf as any).debitDetail === item.name).reduce((s, cf) => s + (cf.amount || 0), 0)
                              const cashOutT = cfs.filter(cf => (cf as any).type === 'transfer' && (cf as any).creditAccount === '현금' && (cf as any).creditDetail === item.name).reduce((s, cf) => s + (cf.amount || 0), 0)
                              const cashOutE = cfs.filter(cf => (cf.type === 'withdrawal' || cf.type === 'expense') && ((cf as any).payMethod || (cf as any).method) === '현금' && ((cf as any).payDetail || '') === item.name).reduce((s, cf) => s + (cf.amount || 0), 0)
                              const balance = (item.initialBalance || 0) + cashIn - cashOutT - cashOutE
                              const isOver = item.cashLimit && balance > item.cashLimit
                              return (
                                <div className={`w-full px-3 py-2.5 rounded-lg border text-sm font-extrabold text-right ${balance < 0 ? 'border-red-300 bg-red-50 dark:bg-red-900/10 text-red-600' : isOver ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/10 text-amber-600' : 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600'}`}>
                                  {balance.toLocaleString('ko-KR')}원
                                </div>
                              )
                            })()}
                          </div>
                          <div><label className={DETAIL_FIELD_LABEL}>용도</label><input value={item.purpose || ''} onChange={e => updateField(item.id, 'purpose', e.target.value)} placeholder="소액경비 등" className={DETAIL_INPUT} /></div>
                          <div><label className={DETAIL_FIELD_LABEL}>메모</label><input value={item.memo || ''} onChange={e => updateField(item.id, 'memo', e.target.value)} placeholder="참고사항" className={DETAIL_INPUT} /></div>
                        </div>
                      )}

                      {/* 어음 상세 */}
                      {activeCategory === '어음' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className={DETAIL_FIELD_LABEL}>구분</label>
                              <div className={`${DETAIL_INPUT} flex items-center gap-1.5 !bg-[var(--bg-muted)]`}>
                                {item.noteType === '수신' ? (
                                  <><ArrowDownCircle size={14} className="text-blue-500" /><span className="text-xs font-bold text-blue-600">수신어음 (받을어음)</span></>
                                ) : (
                                  <><ArrowUpCircle size={14} className="text-rose-500" /><span className="text-xs font-bold text-rose-600">발행어음 (지급어음)</span></>
                                )}
                              </div>
                            </div>
                            <div>
                              <label className={DETAIL_FIELD_LABEL}>연결 계정</label>
                              <div className={`${DETAIL_INPUT} flex items-center gap-1.5 !bg-[var(--bg-muted)]`}>
                                {item.noteType === '수신' ? (
                                  <><span className="text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">자산</span><span className="text-xs font-bold">1-01-06 받을어음</span></>
                                ) : (
                                  <><span className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-1.5 py-0.5 rounded">부채</span><span className="text-xs font-bold">2-01-02 지급어음</span></>
                                )}
                              </div>
                            </div>
                            <div>
                              <label className={DETAIL_FIELD_LABEL}>담당자 *</label>
                              <select value={item.noteManager || ''} onChange={e => updateField(item.id, 'noteManager', e.target.value)} className={DETAIL_INPUT}>
                                <option value="">선택하세요</option>
                                {staffList.map((s: any) => (<option key={s.id || s.name} value={s.name}>{s.name}{s.role ? ` (${s.role})` : ''}{s.dept ? ` - ${s.dept}` : ''}</option>))}
                              </select>
                            </div>
                            <div><label className={DETAIL_FIELD_LABEL}>메모</label><input value={item.memo || ''} onChange={e => updateField(item.id, 'memo', e.target.value)} placeholder="참고사항" className={DETAIL_INPUT} /></div>
                          </div>

                          {/* ── 어음대장 ── */}
                          {item.noteType && (
                            <div className="pt-3 border-t border-dashed border-amber-200 dark:border-amber-800">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[12px] font-extrabold text-[var(--text-primary)] flex items-center gap-1"><FileText size={13} /> 어음대장</span>
                                  {(item.notes || []).length > 0 && (
                                    <span className="text-[9px] font-bold bg-amber-100 dark:bg-amber-900/20 text-amber-600 px-1.5 py-0.5 rounded">{(item.notes || []).length}건</span>
                                  )}
                                </div>
                                <button onClick={() => addNote(item.id)} className="text-[11px] font-bold text-amber-500 hover:text-amber-700 cursor-pointer flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                                  <Plus size={12} /> 어음 추가
                                </button>
                              </div>
                              {(!item.notes || item.notes.length === 0) ? (
                                <div className="py-3 text-center text-[11px] text-[var(--text-muted)] rounded-lg border border-dashed border-[var(--border-default)]">
                                  등록된 어음이 없습니다
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {item.notes.map((note: any, ni: number) => {
                                    const statusColors: Record<string, string> = { '미결제': '#f59e0b', '추심중': '#3b82f6', '결제완료': '#22c55e', '부도': '#ef4444' }
                                    return (
                                      <div key={note.id} className="rounded-lg border border-amber-100 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-900/5 p-2.5">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1"><FileText size={10} /> 어음 {ni + 1}</span>
                                            {note.status && (
                                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ color: statusColors[note.status] || '#888', background: `${statusColors[note.status] || '#888'}15` }}>
                                                {note.status}
                                              </span>
                                            )}
                                          </div>
                                          <button onClick={() => deleteNote(item.id, note.id)} className="text-[10px] text-red-400 hover:text-red-600 cursor-pointer flex items-center gap-0.5">
                                            <Trash2 size={10} /> 삭제
                                          </button>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                          <div><label className={DETAIL_FIELD_LABEL}>어음번호</label><input value={note.noteNumber || ''} onChange={e => updateNote(item.id, note.id, 'noteNumber', e.target.value)} placeholder="A-2026-001" className={DETAIL_INPUT} /></div>
                                          <div className="relative">
                                            <label className={DETAIL_FIELD_LABEL}>{item.noteType === '수신' ? '발행인' : '수취인'}</label>
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
                                                      <span className="text-[10px] text-[var(--text-muted)]"><Building2 size={11} /></span>
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
                                          <div><label className={DETAIL_FIELD_LABEL}>금액</label><input value={note.amount ? note.amount.toLocaleString() : ''} onChange={e => updateNote(item.id, note.id, 'amount', parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0)} placeholder="5,000,000" className={DETAIL_INPUT} /></div>
                                          <div><label className={DETAIL_FIELD_LABEL}>발행일</label><DatePicker value={note.issueDate || ''} onChange={v => updateNote(item.id, note.id, 'issueDate', v)} /></div>
                                          <div><label className={DETAIL_FIELD_LABEL}>만기일</label><DatePicker value={note.maturityDate || ''} onChange={v => updateNote(item.id, note.id, 'maturityDate', v)} /></div>
                                          <div>
                                            <label className={DETAIL_FIELD_LABEL}>상태</label>
                                            <select value={note.status || '미결제'} onChange={e => updateNote(item.id, note.id, 'status', e.target.value)} className={DETAIL_INPUT}>
                                              <option value="미결제">미결제</option>
                                              {item.noteType === '수신' && <option value="추심중">추심중</option>}
                                              <option value="결제완료">결제완료</option>
                                              <option value="부도">부도</option>
                                            </select>
                                          </div>
                                        </div>

                                        {/* 수신어음: 이서(배서) 리스트 */}
                                        {/* 수신어음: 이서(배서) 리스트 */}
                                        {item.noteType === '수신' && (
                                          <div className="mt-2 pt-2 border-t border-dashed border-amber-200 dark:border-amber-800/40">
                                            <div className="flex items-center justify-between mb-1.5">
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] font-extrabold text-indigo-600 flex items-center gap-1"><ScrollText size={11} /> 이서(배서) 내역</span>
                                                {(note.endorsements || []).length > 0 && (
                                                  <span className="text-[9px] font-bold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 px-1.5 py-0.5 rounded">{(note.endorsements || []).length}건</span>
                                                )}
                                              </div>
                                              <button
                                                onClick={() => {
                                                  const endorsements = [...(note.endorsements || []), { id: Date.now(), endorser: '', endorseDate: getLocalDate(), reason: '' }]
                                                  updateNote(item.id, note.id, 'endorsements', endorsements)
                                                }}
                                                className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 cursor-pointer flex items-center gap-0.5 px-2 py-0.5 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                                              >
                                                <Plus size={10} /> 이서 추가
                                              </button>
                                            </div>
                                            {(note.endorsements || []).length === 0 ? (
                                              <div className="text-[10px] text-[var(--text-muted)] text-center py-2 rounded-md border border-dashed border-[var(--border-default)]">이서 내역이 없습니다</div>
                                            ) : (
                                              <div className="space-y-2">
                                                {(note.endorsements || []).map((ed: any, ei: number) => {
                                                  const dropKey = `${note.id}-${ei}`
                                                  return (
                                                  <div key={ed.id} className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-lg p-2.5 border border-indigo-100 dark:border-indigo-900/30">
                                                    <div className="flex items-center justify-between mb-2">
                                                      <span className="text-[9px] font-bold text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded">이서 {ei + 1}</span>
                                                      <button
                                                        onClick={() => {
                                                          const updated = (note.endorsements || []).filter((_: any, i: number) => i !== ei)
                                                          updateNote(item.id, note.id, 'endorsements', updated)
                                                        }}
                                                        className="text-[10px] text-red-400 hover:text-red-600 cursor-pointer flex items-center gap-0.5"
                                                      >
                                                        <Trash2 size={10} /> 삭제
                                                      </button>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-2">
                                                      <div className="relative">
                                                        <label className="block text-[9px] font-bold text-[var(--text-muted)] mb-0.5">이서인</label>
                                                        <input
                                                          value={ed.endorser || ''}
                                                          onChange={e => {
                                                            const updated = [...(note.endorsements || [])]
                                                            updated[ei] = { ...updated[ei], endorser: e.target.value }
                                                            updateNote(item.id, note.id, 'endorsements', updated)
                                                            setEndDropKey(dropKey)
                                                          }}
                                                          onFocus={() => setEndDropKey(dropKey)}
                                                          onBlur={() => setTimeout(() => setEndDropKey(null), 200)}
                                                          placeholder="거래처 검색..."
                                                          className="w-full text-[11px] px-2 py-1.5 rounded-md border border-[var(--border-default)] bg-white dark:bg-gray-900 outline-none"
                                                        />
                                                        {endDropKey === dropKey && (() => {
                                                          const vendorList: any[] = getItem('acct_vendors', [])
                                                          const sv = (ed.endorser || '').toLowerCase()
                                                          const flt = vendorList.filter(v => !sv || v.name.toLowerCase().includes(sv))
                                                          return (
                                                            <div className="absolute z-50 top-full left-0 right-0 mt-0.5 bg-white dark:bg-gray-900 border border-[var(--border-default)] rounded-lg shadow-lg max-h-[160px] overflow-y-auto">
                                                              {flt.map((v: any) => (
                                                                <button key={v.id} onMouseDown={e => {
                                                                  e.preventDefault()
                                                                  const updated = [...(note.endorsements || [])]
                                                                  updated[ei] = { ...updated[ei], endorser: v.name }
                                                                  updateNote(item.id, note.id, 'endorsements', updated)
                                                                  setEndDropKey(null)
                                                                }} className="w-full text-left px-2.5 py-1.5 text-[11px] hover:bg-[var(--bg-muted)] cursor-pointer flex items-center gap-1.5">
                                                                  <span className="text-[10px] text-[var(--text-muted)]"><Building2 size={11} /></span>
                                                                  <span className="font-semibold">{v.name}</span>
                                                                  {v.ceoName && <span className="text-[9px] text-[var(--text-muted)]">대표: {v.ceoName}</span>}
                                                                </button>
                                                              ))}
                                                              {flt.length === 0 && (
                                                                <div className="px-2.5 py-1.5 text-[10px] text-[var(--text-muted)]">검색 결과가 없습니다</div>
                                                              )}
                                                            </div>
                                                          )
                                                        })()}
                                                      </div>
                                                      <div>
                                                        <label className="block text-[9px] font-bold text-[var(--text-muted)] mb-0.5">이서일</label>
                                                        <DatePicker value={ed.endorseDate || ''} onChange={v => {
                                                          const updated = [...(note.endorsements || [])]
                                                          updated[ei] = { ...updated[ei], endorseDate: v }
                                                          updateNote(item.id, note.id, 'endorsements', updated)
                                                        }} />
                                                      </div>
                                                      <div>
                                                        <label className="block text-[9px] font-bold text-[var(--text-muted)] mb-0.5">사유</label>
                                                        <input
                                                          value={ed.reason || ''}
                                                          onChange={e => {
                                                            const updated = [...(note.endorsements || [])]
                                                            updated[ei] = { ...updated[ei], reason: e.target.value }
                                                            updateNote(item.id, note.id, 'endorsements', updated)
                                                          }}
                                                          placeholder="이서 사유"
                                                          className="w-full text-[11px] px-2 py-1.5 rounded-md border border-[var(--border-default)] bg-white dark:bg-gray-900 outline-none"
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

                                        {/* 수신어음: 스캔본 첨부 */}
                                        {item.noteType === '수신' && (
                                          <div className="mt-2 pt-2 border-t border-dashed border-amber-200 dark:border-amber-800/40">
                                            <div className="flex items-center justify-between mb-1.5">
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] font-extrabold text-teal-600 flex items-center gap-1"><Paperclip size={11} /> 어음 스캔본</span>
                                                {(note.attachments || []).length > 0 && (
                                                  <span className="text-[9px] font-bold bg-teal-50 dark:bg-teal-900/20 text-teal-500 px-1.5 py-0.5 rounded">{(note.attachments || []).length}건</span>
                                                )}
                                              </div>
                                              <label className="text-[10px] font-bold text-teal-500 hover:text-teal-700 cursor-pointer flex items-center gap-0.5 px-2 py-0.5 rounded-md hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors">
                                                <Plus size={10} /> 파일 첨부
                                                <input type="file" accept="image/*,.pdf" multiple className="hidden" onChange={e => {
                                                  const files = Array.from(e.target.files || [])
                                                  if (files.length === 0) return
                                                  const existing = note.attachments || []
                                                  let processed = 0
                                                  const newAttachments: any[] = []
                                                  files.forEach(file => {
                                                    const reader = new FileReader()
                                                    reader.onload = () => {
                                                      newAttachments.push({
                                                        id: Date.now() + processed,
                                                        name: file.name,
                                                        size: file.size,
                                                        type: file.type,
                                                        data: reader.result as string,
                                                        uploadDate: getLocalDate()
                                                      })
                                                      processed++
                                                      if (processed === files.length) {
                                                        updateNote(item.id, note.id, 'attachments', [...existing, ...newAttachments])
                                                      }
                                                    }
                                                    reader.readAsDataURL(file)
                                                  })
                                                  e.target.value = ''
                                                }} />
                                              </label>
                                            </div>
                                            {(note.attachments || []).length === 0 ? (
                                              <div className="text-[10px] text-[var(--text-muted)] text-center py-2 rounded-md border border-dashed border-[var(--border-default)]">첨부된 스캔본이 없습니다</div>
                                            ) : (
                                              <div className="grid grid-cols-3 gap-2">
                                                {(note.attachments || []).map((att: any) => (
                                                  <div key={att.id} className="relative group rounded-lg border border-[var(--border-default)] overflow-hidden bg-white dark:bg-gray-900">
                                                    {att.type?.startsWith('image/') ? (
                                                      <img
                                                        src={att.data}
                                                        alt={att.name}
                                                        className="w-full h-20 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                                        onClick={() => window.open(att.data, '_blank')}
                                                      />
                                                    ) : (
                                                      <div
                                                        className="w-full h-20 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 transition-colors"
                                                        onClick={() => {
                                                          const link = document.createElement('a')
                                                          link.href = att.data
                                                          link.download = att.name
                                                          link.click()
                                                        }}
                                                      >
                                                        <span className="text-lg text-[var(--text-secondary)]"><FileText size={18} /></span>
                                                        <span className="text-[9px] text-[var(--text-muted)] mt-0.5">PDF</span>
                                                      </div>
                                                    )}
                                                    <div className="px-1.5 py-1 flex items-center justify-between">
                                                      <span className="text-[9px] text-[var(--text-secondary)] truncate flex-1" title={att.name}>{att.name}</span>
                                                      <button
                                                        onClick={() => {
                                                          const updated = (note.attachments || []).filter((a: any) => a.id !== att.id)
                                                          updateNote(item.id, note.id, 'attachments', updated)
                                                        }}
                                                        className="text-red-400 hover:text-red-600 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1"
                                                      >
                                                        <Trash2 size={10} />
                                                      </button>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        )}

                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 상품권 상세 */}
                      {activeCategory === '상품권' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={DETAIL_FIELD_LABEL}>액면가 *</label>
                            <input value={item.voucherAmount ? item.voucherAmount.toLocaleString() : ''} onChange={e => { const num = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0; saveAll(allItems.map(i => i.id === item.id ? { ...i, voucherAmount: num } : i)) }} placeholder="50,000" className={DETAIL_INPUT} />
                          </div>
                          <div>
                            <label className={DETAIL_FIELD_LABEL}>보유수량</label>
                            <input value={item.voucherQty || ''} onChange={e => { const num = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0; saveAll(allItems.map(i => i.id === item.id ? { ...i, voucherQty: num } : i)) }} placeholder="10" className={DETAIL_INPUT} />
                          </div>
                          <div>
                            <label className={DETAIL_FIELD_LABEL}>담당자 *</label>
                            <select value={item.voucherManager || ''} onChange={e => updateField(item.id, 'voucherManager', e.target.value)} className={DETAIL_INPUT}>
                              <option value="">선택하세요</option>
                              {staffList.map((s: any) => (<option key={s.id || s.name} value={s.name}>{s.name}{s.role ? ` (${s.role})` : ''}{s.dept ? ` - ${s.dept}` : ''}</option>))}
                            </select>
                          </div>
                          <div>
                            <label className={cn(DETAIL_FIELD_LABEL, "flex items-center gap-1")}><Ticket size={11} /> 잔여수량</label>
                            {(() => {
                              const qty = item.voucherQty || 0
                              const cfs: CashFlow[] = getItem('acct_cashflows', [])
                              const usedQty = cfs.filter(cf => (cf.type === 'withdrawal' || cf.type === 'expense') && ((cf as any).payMethod || (cf as any).method) === '상품권' && ((cf as any).payDetail || '') === item.name).length
                              const remain = qty - usedQty
                              const totalValue = remain * (item.voucherAmount || 0)
                              return (
                                <div className={`w-full px-3 py-2.5 rounded-lg border text-sm font-extrabold text-right ${remain <= 0 ? 'border-red-300 bg-red-50 dark:bg-red-900/10 text-red-600' : remain <= 2 ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/10 text-amber-600' : 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600'}`}>
                                  {remain}매 ({totalValue.toLocaleString('ko-KR')}원)
                                </div>
                              )
                            })()}
                          </div>
                          <div><label className={DETAIL_FIELD_LABEL}>보관장소</label><input value={item.voucherStorage || ''} onChange={e => updateField(item.id, 'voucherStorage', e.target.value)} placeholder="금고, 사무실 등" className={DETAIL_INPUT} /></div>
                          <div><label className={DETAIL_FIELD_LABEL}>메모</label><input value={item.memo || ''} onChange={e => updateField(item.id, 'memo', e.target.value)} placeholder="참고사항" className={DETAIL_INPUT} /></div>
                        </div>
                      )}

                      {/* 카드 관리 (지출수단 계좌만) */}
                      {direction === 'expense' && activeCategory === '계좌' && (
                        <div className="mt-5 pt-4 border-t border-dashed border-blue-200 dark:border-blue-800">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-1.5">
                              <CreditCard size={14} className="text-blue-500" />
                              <span className="text-[12px] font-extrabold text-[var(--text-primary)]">연결 카드</span>
                              {(item.cards || []).length > 0 && <span className="text-[9px] font-bold bg-blue-100 dark:bg-blue-900/20 text-blue-600 px-1.5 py-0.5 rounded">{(item.cards || []).length}장</span>}
                            </div>
                            <button onClick={() => addCard(item.id)} className="text-[11px] font-bold text-blue-500 hover:text-blue-700 cursor-pointer flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><Plus size={12} /> 카드 추가</button>
                          </div>
                          {(!item.cards || item.cards.length === 0) ? (
                            <div className="py-4 text-center text-[11px] text-[var(--text-muted)] rounded-lg border border-dashed border-[var(--border-default)] bg-white/50 dark:bg-gray-900/30">등록된 카드가 없습니다</div>
                          ) : (
                            <div className="space-y-2">
                              {item.cards.map((card, ci) => (
                                <div key={card.id} className="rounded-lg border border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/5 p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-blue-500 flex items-center gap-1"><CreditCard size={11} /> 카드 {ci + 1}</span>
                                    <button onClick={() => deleteCard(item.id, card.id)} className="text-[10px] text-red-400 hover:text-red-600 cursor-pointer flex items-center gap-0.5"><Trash2 size={10} /> 삭제</button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div><label className={DETAIL_FIELD_LABEL}>카드명 *</label><input value={card.cardName} onChange={e => updateCard(item.id, card.id, 'cardName', e.target.value)} placeholder="법인카드1" className={DETAIL_INPUT} /></div>
                                    <div><label className={DETAIL_FIELD_LABEL}>카드사 *</label><input value={card.cardCompany} onChange={e => updateCard(item.id, card.id, 'cardCompany', e.target.value)} placeholder="국민카드" className={DETAIL_INPUT} /></div>
                                    <div><label className={DETAIL_FIELD_LABEL}>카드번호 *</label><input value={card.cardNumber} onChange={e => { const raw = e.target.value.replace(/[^0-9]/g, '').slice(0, 16); updateCard(item.id, card.id, 'cardNumber', raw.replace(/(.{4})/g, '$1-').replace(/-$/, '')) }} placeholder="1234-5678-9012-3456" className={DETAIL_INPUT} /></div>
                                    <div><label className={DETAIL_FIELD_LABEL}>카드종류 *</label><select value={card.cardType} onChange={e => updateCard(item.id, card.id, 'cardType', e.target.value)} className={DETAIL_INPUT}><option value="체크카드">체크카드</option><option value="신용카드">신용카드</option></select></div>
                                    <div>
                                      <label className={DETAIL_FIELD_LABEL}>사용자 *</label>
                                      <select value={card.cardUser} onChange={e => updateCard(item.id, card.id, 'cardUser', e.target.value)} className={DETAIL_INPUT}>
                                        <option value="">선택하세요</option>
                                        {staffList.map((s: any) => (<option key={s.id || s.name} value={s.name}>{s.name}{s.role ? ` (${s.role})` : ''}</option>))}
                                      </select>
                                    </div>
                                    <div><label className={DETAIL_FIELD_LABEL}>유효기간</label><input value={card.expiryDate || ''} onChange={e => { const raw = e.target.value.replace(/[^0-9]/g, '').slice(0, 4); updateCard(item.id, card.id, 'expiryDate', raw.length > 2 ? `${raw.slice(0, 2)}/${raw.slice(2)}` : raw) }} placeholder="MM/YY" maxLength={5} className={DETAIL_INPUT} /></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}


                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
      </>
      )}
    </div>
  )
}
