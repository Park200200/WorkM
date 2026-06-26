import React, { useState, useMemo, useEffect } from 'react'
import { getItem, setItem } from '../../../utils/storage'
import { formatNumber } from '../../../utils/format'
import { useAuthStore } from '../../../stores/authStore'
import type { BudgetCat, CashFlow, PayMethodItem } from './types'
import { getLocalDate, getLocalISOString } from './utils'
import { Search, ArrowLeftRight, Calendar, Filter, Download, Banknote, CreditCard, TrendingUp, Landmark, Inbox, Send, Clock, X } from 'lucide-react'
import { cn } from '../../../utils/cn'
import { DatePicker } from '../../../components/ui/DatePicker'
import { useToastStore } from '../../../stores/toastStore'

export default function AcctCashflowList({ year, catId }: { year: number; catId?: string | null }) {
  const [refresh, setRefresh] = useState(0)
  const currentUserName = useAuthStore.getState().user?.name || ''

  // ── 데이터 로드 ──
  const allCashflows: any[] = useMemo(() => getItem('acct_cashflows', []), [refresh])
  const allApprovals: any[] = useMemo(() => getItem('acct_approvals', []), [refresh])
  const budgetCats: any[] = useMemo(() => getItem('acct_budget_cats', []), [refresh])
  const staffList: any[] = useMemo(() => getItem('acct_staff', []), [refresh])

  // ── 예산별 필터링 ──
  const cashflows = useMemo(() => {
    if (!catId || catId === 'all') return allCashflows
    return allCashflows.filter(c => String(c.budgetCatId) === String(catId))
  }, [allCashflows, catId])
  const approvals = useMemo(() => {
    if (!catId || catId === 'all') return allApprovals
    return allApprovals.filter(a => String((a as any).budgetCatId) === String(catId))
  }, [allApprovals, catId])

  // ── 필터 상태 ──
  const today = getLocalDate()
  const yearStart = `${year}-01-01`
  const yearEnd = `${year}-12-31`
  const [dateFrom, setDateFrom] = useState(yearStart)
  const [dateTo, setDateTo] = useState(yearEnd)
  const [filterCat, setFilterCat] = useState('')
  const [filterManager, setFilterManager] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [searchText, setSearchText] = useState('')
  const [cardFilter, setCardFilter] = useState<'' | 'receivable' | 'payable' | 'incomeScheduled' | 'expenseScheduled'>('')

  // ── 기간 프리셋 ──
  const [activePreset, setActivePreset] = useState<string>('year')
  const fmtLocal = (dt: Date) => `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`
  const setPreset = (preset: string) => {
    const now = new Date()
    const y = now.getFullYear(), m = now.getMonth(), d = now.getDate()
    const dow = now.getDay()
    const todayStr = fmtLocal(now)
    if (preset === 'today') { setDateFrom(todayStr); setDateTo(todayStr) }
    else if (preset === 'week') { const mon = new Date(y,m,d-(dow===0?6:dow-1)); setDateFrom(fmtLocal(mon)); setDateTo(todayStr) }
    else if (preset === 'month') { setDateFrom(`${y}-${String(m+1).padStart(2,'0')}-01`); setDateTo(todayStr) }
    else if (preset === 'quarter') { const qm = Math.floor(m/3)*3; setDateFrom(`${y}-${String(qm+1).padStart(2,'0')}-01`); setDateTo(todayStr) }
    else if (preset === 'year') { setDateFrom(`${year}-01-01`); setDateTo(`${year}-12-31`) }
    setActivePreset(preset)
  }

  // ── 담당자 목록 ──
  const managers = useMemo(() => {
    const set = new Set<string>()
    cashflows.forEach(c => { if (c.manager) set.add(c.manager); if (c.createdBy) set.add(c.createdBy) })
    return Array.from(set).sort()
  }, [cashflows])

  // ── 필터 적용된 목록 ──
  const filtered = useMemo(() => {
    return cashflows.filter(c => {
      const d = c.date || c.writeDate || ''
      if (d < dateFrom || d > dateTo) return false
      if (filterCat && String(c.budgetCatId) !== filterCat) return false
      if (filterManager && c.manager !== filterManager && c.createdBy !== filterManager) return false
      if (filterType !== 'all' && c.type !== filterType) return false
      if (searchText.trim()) {
        const q = searchText.trim().toLowerCase()
        const haystack = `${c.counter||''} ${c.description||''} ${c.incomeNote||''} ${c.amount||''}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    }).sort((a: any, b: any) => {
      // 전체 예산일 때 예산별로 먼저 그룹핑
      if (!filterCat) {
        const catA = String(a.budgetCatId || '')
        const catB = String(b.budgetCatId || '')
        if (catA !== catB) return catA.localeCompare(catB)
      }
      return (b.date || b.writeDate || '').localeCompare(a.date || a.writeDate || '') || (Number(b.id) || 0) - (Number(a.id) || 0)
    })
  }, [cashflows, dateFrom, dateTo, filterCat, filterManager, filterType, searchText])

  // ── 집계 ──
  const stats = useMemo(() => {
    let totalIn = 0, totalOut = 0
    filtered.forEach(c => { if (c.type === 'income') totalIn += (c.amount || 0); else totalOut += (c.amount || 0) })
    // 미수금: 입금 전표 중 receivable=true & !received
    const receivables = cashflows.filter(c => c.receivable && !c.received)
    const receivableAmt = receivables.reduce((s: number, c: any) => s + (c.amount || 0), 0)
    // 미지급금: 출금 전표 중 payable=true & !paid
    const payables = cashflows.filter(c => c.payable && !c.paid)
    const payableAmt = payables.reduce((s: number, c: any) => s + (c.amount || 0), 0)
    // 입금예정: 승인된 입금 품의(미처리) + 기간 내 입금예정 미수금
    const incomeScheduled = approvals.filter(a => a.status === 'approved' && a.type === 'income')
    const receivablesInRange = receivables.filter(c => c.expectedDate && c.expectedDate >= dateFrom && c.expectedDate <= dateTo)
    const receivablesInRangeAmt = receivablesInRange.reduce((s: number, c: any) => s + (c.amount || 0), 0)
    const incomeSchedAmt = incomeScheduled.reduce((s: number, a: any) => s + (a.amount || 0), 0) + receivablesInRangeAmt
    // 출금예정: 승인된 품의(미집행) + 기간 내 지급예정 미지급금
    const expenseScheduled = approvals.filter(a => a.status === 'approved' && !a.isGeneral)
    const payablesInRange = payables.filter(c => c.expectedDate && c.expectedDate >= dateFrom && c.expectedDate <= dateTo)
    const payablesInRangeAmt = payablesInRange.reduce((s: number, c: any) => s + (c.amount || 0), 0)
    const expenseSchedAmt = expenseScheduled.reduce((s: number, a: any) => s + (a.amount || 0), 0) + payablesInRangeAmt
    return { totalIn, totalOut, net: totalIn - totalOut, receivableAmt, receivableCount: receivables.length, payableAmt, payableCount: payables.length, incomeSchedAmt, incomeSchedCount: incomeScheduled.length + receivablesInRange.length, expenseSchedAmt, expenseSchedCount: expenseScheduled.length + payablesInRange.length }
  }, [filtered, cashflows, approvals, dateFrom, dateTo])

  // ── 누적잔액 계산 ──
  const withBalance = useMemo(() => {
    let bal = 0
    // 역순이므로 reverse하여 잔액 계산 후 다시 역순
    const asc = [...filtered].reverse()
    const result = asc.map(c => {
      if (c.type === 'income') bal += (c.amount || 0); else bal -= (c.amount || 0)
      return { ...c, _balance: bal }
    })
    return result.reverse()
  }, [filtered])

  // ── 엑셀 다운로드 ──
  const downloadCSV = () => {
    const header = '날짜,구분,예산구분,거래처,적요,입금액,출금액,잔액,담당자\n'
    const rows = withBalance.map(c => {
      const catName = budgetCats.find((cat: any) => String(cat.id) === String(c.budgetCatId))?.name || ''
      return `${c.date||c.writeDate||''},${c.type==='income'?'입금':'출금'},${catName},${c.counter||''},${(c.description||'').replace(/,/g,' ')},${c.type==='income'?(c.amount||0):''},${c.type==='expense'?(c.amount||0):''},${c._balance},${c.manager||c.createdBy||''}`
    }).join('\n')
    const bom = '\uFEFF'
    const blob = new Blob([bom + header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `입출금내역_${dateFrom}_${dateTo}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const cardStyle = (color: string, bg: string, active?: boolean) => `rounded-xl border ${active ? 'border-2 border-primary-500 ring-2 ring-primary-200 dark:ring-primary-800 shadow-lg' : 'border-[var(--border-default)]'} p-3.5 bg-gradient-to-br ${bg} transition-all hover:shadow-md`

  // ── 카드 필터 적용 리스트 (미수/미지급/예정) ──
  const cardFilteredList = useMemo(() => {
    if (cardFilter === 'receivable') return cashflows.filter(c => c.receivable && !c.received).map(c => ({ ...c, _cardType: '미수금' }))
    if (cardFilter === 'payable') return cashflows.filter(c => c.payable && !c.paid).map(c => ({ ...c, _cardType: '미지급금' }))
    if (cardFilter === 'incomeScheduled') return [
      ...cashflows.filter(c => c.receivable && !c.received && c.expectedDate && c.expectedDate >= dateFrom && c.expectedDate <= dateTo).map(c => ({ ...c, _cardType: '미수금(입금예정)', _isReceivable: true })),
      ...approvals.filter(a => a.status === 'approved' && a.type === 'income').map(a => ({ id: a.id, date: a.date || a.createdAt || '', type: 'income', amount: a.amount || 0, counter: a.applicant || '', description: a.title || '', manager: a.applicant || '', _cardType: '입금예정', _isApproval: true }))
    ]
    if (cardFilter === 'expenseScheduled') return [
      ...cashflows.filter(c => c.payable && !c.paid && c.expectedDate && c.expectedDate >= dateFrom && c.expectedDate <= dateTo).map(c => ({ ...c, _cardType: '미지급금(출금예정)', _isPayable: true })),
      ...approvals.filter(a => a.status === 'approved' && !a.isGeneral).map(a => ({ id: a.id, date: a.date || a.createdAt || '', type: 'expense', amount: a.amount || 0, counter: a.applicant || '', description: a.title || '', manager: a.applicant || '', budgetCatId: a.budgetCatId, _cardType: '출금예정', _isApproval: true }))
    ]
    return []
  }, [cardFilter, cashflows, approvals, dateFrom, dateTo])

  // ── 수금/지급 완료 처리 ──
  const handleSettlement = (cfId: any, settleType: 'received' | 'paid') => {
    const cfs = getItem('acct_cashflows', []) as any[]
    const idx = cfs.findIndex((c: any) => c.id === cfId)
    if (idx >= 0) {
      if (settleType === 'received') { cfs[idx].received = true; cfs[idx].receivedAt = getLocalISOString() }
      else { cfs[idx].paid = true; cfs[idx].paidAt = getLocalISOString() }
      setItem('acct_cashflows', cfs)
      setRefresh(r => r + 1)
      useToastStore.getState().add('success', settleType === 'received' ? '수금 완료 처리되었습니다' : '지급 완료 처리되었습니다')
    }
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* ── 타이틀 ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-extrabold text-[var(--text-primary)] flex items-center gap-2">
          <ArrowLeftRight size={18} className="text-primary-500" />
          입출금내역
        </h2>
        <button onClick={downloadCSV} className="px-2.5 py-1.5 rounded-lg bg-success-500 text-white text-[10px] sm:text-[11px] font-bold hover:bg-success-600 cursor-pointer flex items-center gap-1 shadow-sm">
          <Download size={12} /> CSV
        </button>
      </div>

      {/* ── 8개 대시보드 카드 ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {/* 1행: 실적 */}
        <div className={cardStyle('#22c55e', 'from-emerald-50/80 to-emerald-100/40 dark:from-emerald-900/20 dark:to-emerald-800/10')}>
          <div className="text-[9px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mb-0.5 sm:mb-1"><Banknote size={12} className="inline -mt-0.5" /> 총 입금</div>
          <div className="text-[14px] sm:text-[18px] font-extrabold text-emerald-700 dark:text-emerald-300">₩{stats.totalIn.toLocaleString()}</div>
          <div className="text-[9px] sm:text-[10px] text-transparent mt-0.5 select-none">-</div>
        </div>
        <div className={cardStyle('#ef4444', 'from-red-50/80 to-red-100/40 dark:from-red-900/20 dark:to-red-800/10')}>
          <div className="text-[9px] sm:text-[10px] font-bold text-red-500 dark:text-red-400 mb-0.5 sm:mb-1"><CreditCard size={12} className="inline -mt-0.5" /> 총 출금</div>
          <div className="text-[14px] sm:text-[18px] font-extrabold text-red-600 dark:text-red-300">₩{stats.totalOut.toLocaleString()}</div>
          <div className="text-[9px] sm:text-[10px] text-transparent mt-0.5 select-none">-</div>
        </div>
        <div className={cardStyle('#3b82f6', 'from-blue-50/80 to-blue-100/40 dark:from-blue-900/20 dark:to-blue-800/10')}>
          <div className="text-[9px] sm:text-[10px] font-bold text-blue-500 dark:text-blue-400 mb-0.5 sm:mb-1"><TrendingUp size={12} className="inline -mt-0.5" /> 순 증감</div>
          <div className={`text-[14px] sm:text-[18px] font-extrabold ${stats.net >= 0 ? 'text-blue-600 dark:text-blue-300' : 'text-red-600 dark:text-red-300'}`}>
            {stats.net >= 0 ? '+' : ''}₩{stats.net.toLocaleString()}
          </div>
          <div className="text-[9px] sm:text-[10px] text-transparent mt-0.5 select-none">-</div>
        </div>
        <div className={cardStyle('#1e293b', 'from-slate-50/80 to-slate-100/40 dark:from-slate-800/30 dark:to-slate-700/20')}>
          <div className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1"><Landmark size={12} className="inline -mt-0.5" /> 현재 잔액</div>
          <div className="text-[14px] sm:text-[18px] font-extrabold text-slate-700 dark:text-slate-200">₩{stats.net.toLocaleString()}</div>
          <div className="text-[9px] sm:text-[10px] text-transparent mt-0.5 select-none">-</div>
        </div>
        {/* 2행: 미수·미지급·예정 (클릭 가능) */}
        <div onClick={() => setCardFilter(cardFilter === 'receivable' ? '' : 'receivable')} className={cardStyle('#f97316', 'from-orange-50/80 to-orange-100/40 dark:from-orange-900/20 dark:to-orange-800/10', cardFilter === 'receivable') + ' cursor-pointer'}>
          <div className="text-[9px] sm:text-[10px] font-bold text-orange-500 dark:text-orange-400 mb-0.5 sm:mb-1"><Inbox size={12} className="inline -mt-0.5" /> 미수금</div>
          <div className="text-[14px] sm:text-[18px] font-extrabold text-orange-600 dark:text-orange-300">₩{stats.receivableAmt.toLocaleString()}</div>
          <div className="text-[9px] sm:text-[10px] text-orange-400 mt-0.5">{stats.receivableCount}건 {cardFilter === 'receivable' && <span className="ml-1 text-primary-500">← 보기 중</span>}</div>
        </div>
        <div onClick={() => setCardFilter(cardFilter === 'payable' ? '' : 'payable')} className={cardStyle('#8b5cf6', 'from-violet-50/80 to-violet-100/40 dark:from-violet-900/20 dark:to-violet-800/10', cardFilter === 'payable') + ' cursor-pointer'}>
          <div className="text-[9px] sm:text-[10px] font-bold text-violet-500 dark:text-violet-400 mb-0.5 sm:mb-1"><Send size={12} className="inline -mt-0.5" /> 미지급금</div>
          <div className="text-[14px] sm:text-[18px] font-extrabold text-violet-600 dark:text-violet-300">₩{stats.payableAmt.toLocaleString()}</div>
          <div className="text-[9px] sm:text-[10px] text-violet-400 mt-0.5">{stats.payableCount}건 {cardFilter === 'payable' && <span className="ml-1 text-primary-500">← 보기 중</span>}</div>
        </div>
        <div onClick={() => setCardFilter(cardFilter === 'incomeScheduled' ? '' : 'incomeScheduled')} className={cardStyle('#10b981', 'from-teal-50/80 to-teal-100/40 dark:from-teal-900/20 dark:to-teal-800/10', cardFilter === 'incomeScheduled') + ' cursor-pointer'}>
          <div className="text-[9px] sm:text-[10px] font-bold text-teal-500 dark:text-teal-400 mb-0.5 sm:mb-1"><Clock size={12} className="inline -mt-0.5" /> 입금 예정</div>
          <div className="text-[14px] sm:text-[18px] font-extrabold text-teal-600 dark:text-teal-300">₩{stats.incomeSchedAmt.toLocaleString()}</div>
          <div className="text-[9px] sm:text-[10px] text-teal-400 mt-0.5">{stats.incomeSchedCount}건 {cardFilter === 'incomeScheduled' && <span className="ml-1 text-primary-500">← 보기 중</span>}</div>
        </div>
        <div onClick={() => setCardFilter(cardFilter === 'expenseScheduled' ? '' : 'expenseScheduled')} className={cardStyle('#f43f5e', 'from-rose-50/80 to-rose-100/40 dark:from-rose-900/20 dark:to-rose-800/10', cardFilter === 'expenseScheduled') + ' cursor-pointer'}>
          <div className="text-[9px] sm:text-[10px] font-bold text-rose-500 dark:text-rose-400 mb-0.5 sm:mb-1"><Clock size={12} className="inline -mt-0.5" /> 출금 예정</div>
          <div className="text-[14px] sm:text-[18px] font-extrabold text-rose-600 dark:text-rose-300">₩{stats.expenseSchedAmt.toLocaleString()}</div>
          <div className="text-[9px] sm:text-[10px] text-rose-400 mt-0.5">{stats.expenseSchedCount}건 {cardFilter === 'expenseScheduled' && <span className="ml-1 text-primary-500">← 보기 중</span>}</div>
        </div>
      </div>

      {/* ── 필터 바 ── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-2.5 sm:p-3 space-y-2">
        {/* 데스크톱: 기간+필터 통합 grid (열 공유) */}
        <div className="hidden sm:grid sm:grid-cols-[50px_1fr_auto_1fr_auto] items-center gap-x-2 gap-y-2">
          {/* 1행: 기간 */}
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-muted)]">
            <Calendar size={13} /> 기간
          </div>
          <DatePicker value={dateFrom} onChange={v => { setDateFrom(v); setActivePreset('') }} />
          <span className="text-[11px] text-[var(--text-muted)] text-center">~</span>
          <DatePicker value={dateTo} onChange={v => { setDateTo(v); setActivePreset('') }} />
          <div className="flex gap-1 items-center">
            {[{label:'오늘',key:'today'},{label:'이번주',key:'week'},{label:'이번달',key:'month'},{label:'분기',key:'quarter'},{label:'연간',key:'year'}].map(p => (
              <button key={p.key} onClick={() => setPreset(p.key)} className={`px-2.5 py-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer whitespace-nowrap ${activePreset === p.key ? 'bg-primary-500 text-white border-primary-500' : 'border-[var(--border-default)] text-[var(--text-muted)] hover:bg-primary-50 hover:text-primary-600 hover:border-primary-300'}`}>{p.label}</button>
            ))}
          </div>
          {/* 2행: 필터 */}
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-muted)]">
            <Filter size={13} /> 필터
          </div>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)]">
            <option value="">전체 예산</option>
            {budgetCats.filter((c: any) => { const pf = c.periodFrom || ''; const pt = c.periodTo || ''; if (pf && pt) return pf <= `${year}-12-31` && pt >= `${year}-01-01`; return true }).map((c: any) => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
          </select>
          <span className="text-[var(--border-default)] text-center text-[11px]">|</span>
          <select value={filterManager} onChange={e => setFilterManager(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)]">
            <option value="">전체 담당자</option>
            {managers.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-[var(--border-default)] overflow-hidden">
              {[{label:'전체',val:'all'},{label:'입금',val:'income'},{label:'출금',val:'expense'}].map(t => (
                <button key={t.val} onClick={() => setFilterType(t.val as any)} className={cn('px-3 py-2.5 text-[11px] font-bold cursor-pointer transition-all', filterType === t.val ? 'bg-primary-500 text-white' : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-primary-50')}>{t.label}</button>
              ))}
            </div>
            <div className="relative flex-1 min-w-[150px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="거래처·적요·금액 검색" className="w-full pl-8 pr-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500" />
            </div>
          </div>
        </div>
        {/* 모바일: 기간 */}
        <div className="flex items-center gap-2 flex-wrap sm:hidden">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-muted)] shrink-0">
            <Calendar size={13} /> 기간
          </div>
          <DatePicker value={dateFrom} onChange={v => { setDateFrom(v); setActivePreset('') }} className="w-auto shrink-0" />
          <span className="text-[11px] text-[var(--text-muted)]">~</span>
          <DatePicker value={dateTo} onChange={v => { setDateTo(v); setActivePreset('') }} className="w-auto shrink-0" />
          {[{label:'오늘',key:'today'},{label:'이번주',key:'week'},{label:'이번달',key:'month'},{label:'분기',key:'quarter'},{label:'연간',key:'year'}].map(p => (
            <button key={p.key} onClick={() => setPreset(p.key)} className={`px-1.5 py-1 rounded-full text-[9px] font-bold border cursor-pointer whitespace-nowrap shrink-0 ${activePreset === p.key ? 'bg-primary-500 text-white border-primary-500' : 'border-[var(--border-default)] text-[var(--text-muted)] hover:bg-primary-50 hover:text-primary-600'}`}>{p.label}</button>
          ))}
        </div>
        {/* 모바일: 필터 */}
        <div className="flex items-center gap-2 flex-wrap sm:hidden">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-muted)] shrink-0">
            <Filter size={13} /> 필터
          </div>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] max-w-[140px]">
            <option value="">전체 예산</option>
            {budgetCats.filter((c: any) => { const pf = c.periodFrom || ''; const pt = c.periodTo || ''; if (pf && pt) return pf <= `${year}-12-31` && pt >= `${year}-01-01`; return true }).map((c: any) => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
          </select>
          <select value={filterManager} onChange={e => setFilterManager(e.target.value)} className="px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] max-w-[120px]">
            <option value="">전체 담당자</option>
            {managers.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <div className="flex rounded-lg border border-[var(--border-default)] overflow-hidden">
            {[{label:'전체',val:'all'},{label:'입금',val:'income'},{label:'출금',val:'expense'}].map(t => (
              <button key={t.val} onClick={() => setFilterType(t.val as any)} className={cn('px-3 py-2.5 text-sm font-bold cursor-pointer transition-all', filterType === t.val ? 'bg-primary-500 text-white' : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-primary-50')}>{t.label}</button>
            ))}
          </div>
          <div className="flex-1 min-w-[120px]">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="거래처·적요·금액 검색" className="w-full pl-8 pr-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500" />
            </div>
          </div>
        </div>
      </div>

      {/* ── 건수 ── */}
      {cardFilter ? (
        <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
          <span className="text-[var(--text-muted)]">
            <span className="font-bold text-primary-600">{cardFilter === 'receivable' ? '미수금' : cardFilter === 'payable' ? '미지급금' : cardFilter === 'incomeScheduled' ? '입금예정' : '출금예정'}</span>
            {' '}<span className="font-bold text-[var(--text-primary)]">{cardFilteredList.length}</span>건
          </span>
          <button onClick={() => setCardFilter('')} className="px-2 py-0.5 rounded-full bg-[var(--bg-muted)] text-[9px] sm:text-[10px] font-bold text-[var(--text-muted)] hover:bg-primary-100 hover:text-primary-600 cursor-pointer transition-all"><X size={10} className="inline" /> 전체보기</button>
        </div>
      ) : (
        <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
          <span className="text-[var(--text-muted)]">총 <span className="font-bold text-[var(--text-primary)]">{filtered.length}</span>건</span>
          <span className="text-[var(--text-muted)]">
            입금 <span className="font-bold text-emerald-600">₩{stats.totalIn.toLocaleString()}</span>
            {' · '}출금 <span className="font-bold text-red-500">₩{stats.totalOut.toLocaleString()}</span>
          </span>
        </div>
      )}

      {/* ── 데스크톱 테이블 (sm 이상) ── */}
      <div className="hidden sm:block bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] table-fixed">
            <thead>
              <tr className="bg-[var(--bg-muted)] text-[var(--text-muted)] font-bold border-b border-[var(--border-default)]">
                <th className="px-3 py-2 text-left whitespace-nowrap w-[100px]">날짜</th>
                <th className="px-2 py-2 text-center whitespace-nowrap w-[52px]">구분</th>
                <th className="px-3 py-2 text-left whitespace-nowrap w-[90px]">예산구분</th>
                <th className="px-3 py-2 text-left whitespace-nowrap w-[120px]">거래처</th>
                <th className="px-3 py-2 text-left whitespace-nowrap">적요</th>
                <th className="px-3 py-2 text-right whitespace-nowrap w-[110px]">금액</th>
                <th className="px-3 py-2 text-right whitespace-nowrap w-[110px]">잔액</th>
                <th className="px-3 py-2 text-left whitespace-nowrap w-[70px]">담당자</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const displayList = cardFilter ? cardFilteredList : withBalance
                if (displayList.length === 0) return (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-[var(--text-muted)]">
                    <div className="flex flex-col items-center gap-2">
                      <ArrowLeftRight size={32} className="text-[var(--border-default)]" />
                      <span>{cardFilter ? '해당 항목이 없습니다' : '해당 기간의 입출금 내역이 없습니다'}</span>
                    </div>
                  </td></tr>
                )
                return (() => {
                  let lastCatId: string = ''
                  return displayList.map((c: any, i: number) => {
                    const catName = budgetCats.find((cat: any) => String(cat.id) === String(c.budgetCatId))?.name || ''
                    const isIncome = c.type === 'income'
                    const curCatId = String(c.budgetCatId || '')
                    const showGroupHeader = !cardFilter && !filterCat && curCatId !== lastCatId
                    if (showGroupHeader) lastCatId = curCatId
                    // 그룹 내 소계
                    const groupItems = !cardFilter && !filterCat && showGroupHeader ? displayList.filter((x: any) => String(x.budgetCatId || '') === curCatId) : []
                    const groupIn = groupItems.reduce((s: number, x: any) => s + (x.type === 'income' ? (x.amount || 0) : 0), 0)
                    const groupOut = groupItems.reduce((s: number, x: any) => s + (x.type !== 'income' ? (x.amount || 0) : 0), 0)
                    return (
                      <React.Fragment key={c.id || i}>
                        {showGroupHeader && (
                          <tr className="bg-gradient-to-r from-primary-50/60 to-blue-50/40 dark:from-primary-900/15 dark:to-blue-900/10">
                            <td colSpan={8} className="px-3 py-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-extrabold text-primary-600 dark:text-primary-400">{catName || '미지정'}</span>
                                <span className="text-[9px] text-[var(--text-muted)]">{groupItems.length}건</span>
                                <span className="text-[9px] text-emerald-600 font-bold">입금 ₩{groupIn.toLocaleString()}</span>
                                <span className="text-[9px] text-red-500 font-bold">출금 ₩{groupOut.toLocaleString()}</span>
                              </div>
                            </td>
                          </tr>
                        )}
                        <tr className="border-b border-[var(--border-default)] hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-colors">
                          <td className="px-3 py-2 whitespace-nowrap text-[var(--text-primary)]">{(c.date || c.writeDate || '').slice(0, 10)}</td>
                          <td className="px-2 py-2 text-center">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${isIncome ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                              {isIncome ? '입금' : '출금'}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {catName && <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[9px] font-bold">{catName}</span>}
                          </td>
                          <td className="px-3 py-2 text-[var(--text-primary)] whitespace-nowrap max-w-[120px] truncate">{c.counter || '-'}</td>
                          <td className="px-3 py-2 text-[var(--text-secondary)] max-w-[180px] truncate" title={c.description || c.incomeNote || ''}>{c.description || c.incomeNote || '-'}</td>
                          <td className={`px-3 py-2 text-right font-bold whitespace-nowrap ${isIncome ? 'text-emerald-600' : 'text-red-500'}`}>₩{(c.amount||0).toLocaleString()}</td>
                          <td className={`px-3 py-2 text-right font-extrabold whitespace-nowrap ${!cardFilter ? ((c._balance||0) >= 0 ? 'text-[var(--text-primary)]' : 'text-red-500') : 'text-transparent select-none'}`}>
                            {!cardFilter ? `₩${(c._balance||0).toLocaleString()}` : '-'}
                          </td>
                          <td className="px-3 py-2 text-[var(--text-muted)] whitespace-nowrap">{c.manager || c.createdBy || '-'}</td>
                        </tr>
                      </React.Fragment>
                    )
                  })
                })()
              })()}
            </tbody>
            <tfoot>
              {!cardFilter && withBalance.length > 0 && (
                <tr className="bg-[var(--bg-muted)] font-bold border-t-2 border-[var(--border-default)]">
                  <td colSpan={4} className="px-3 py-2 text-[var(--text-primary)]">합계</td>
                  <td className="px-3 py-2 text-right text-emerald-600"></td>
                  <td className="px-3 py-2 text-right text-emerald-600">₩{stats.totalIn.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-[var(--text-primary)]">₩{stats.net.toLocaleString()}</td>
                  <td></td>
                </tr>
              )}
              {cardFilter && cardFilteredList.length > 0 && (
                <tr className="bg-[var(--bg-muted)] font-bold border-t-2 border-[var(--border-default)]">
                  <td colSpan={5} className="px-3 py-2 text-[var(--text-primary)]">합계 ({cardFilteredList.length}건)</td>
                  <td className="px-3 py-2 text-right font-extrabold text-[var(--text-primary)]">₩{cardFilteredList.reduce((s: number, c: any) => s + (c.amount || 0), 0).toLocaleString()}</td>
                  <td></td>
                  <td></td>
                </tr>
              )}
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── 모바일 카드 리스트 (sm 미만) ── */}
      <div className="block sm:hidden space-y-2">
        {(() => {
          const displayList = cardFilter ? cardFilteredList : withBalance
          if (displayList.length === 0) return (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-8 text-center text-[var(--text-muted)]">
              <div className="flex flex-col items-center gap-2">
                <ArrowLeftRight size={28} className="text-[var(--border-default)]" />
                <span className="text-[11px]">{cardFilter ? '해당 항목이 없습니다' : '해당 기간의 입출금 내역이 없습니다'}</span>
              </div>
            </div>
          )
          return displayList.map((c: any, i: number) => {
            const catName = budgetCats.find((cat: any) => String(cat.id) === String(c.budgetCatId))?.name || ''
            const isIncome = c.type === 'income'
            return (
              <div key={c.id || i} className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-3 space-y-1.5">
                {/* 1줄: 날짜 + 구분 + 금액 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-[var(--text-primary)]">{(c.date || c.writeDate || '').slice(0, 10)}</span>
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${isIncome ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {isIncome ? '입금' : '출금'}
                    </span>
                    {cardFilter && c._cardType && (
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        c._cardType === '미수금' ? 'bg-orange-100 text-orange-700' :
                        c._cardType === '미지급금' ? 'bg-violet-100 text-violet-700' :
                        c._cardType === '입금예정' ? 'bg-teal-100 text-teal-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>{c._cardType}</span>
                    )}
                  </div>
                  <span className={`text-[13px] font-extrabold ${isIncome ? 'text-emerald-600' : 'text-red-500'}`}>₩{(c.amount||0).toLocaleString()}</span>
                </div>
                {/* 2줄: 거래처 + 적요 */}
                <div className="flex items-center gap-2 text-[10px]">
                  {(c.counter || c.description || c.incomeNote) && (
                    <>
                      {c.counter && <span className="font-bold text-[var(--text-primary)]">{c.counter}</span>}
                      {(c.description || c.incomeNote) && <span className="text-[var(--text-muted)] truncate max-w-[200px]">{c.description || c.incomeNote}</span>}
                    </>
                  )}
                </div>
                {/* 3줄: 예산+담당자+잔액 */}
                <div className="flex items-center justify-between text-[9px]">
                  <div className="flex items-center gap-1.5">
                    {catName && <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold">{catName}</span>}
                    <span className="text-[var(--text-muted)]">{c.manager || c.createdBy || ''}</span>
                  </div>
                  {!cardFilter && <span className={`font-extrabold ${(c._balance||0) >= 0 ? 'text-[var(--text-secondary)]' : 'text-red-500'}`}>잔액 ₩{(c._balance||0).toLocaleString()}</span>}
                  {(cardFilter === 'receivable' || cardFilter === 'payable') && !c._isApproval && (
                    <button
                      onClick={() => handleSettlement(c.id, cardFilter === 'receivable' ? 'received' : 'paid')}
                      className={`px-2 py-1 rounded text-[9px] font-bold cursor-pointer ${
                        cardFilter === 'receivable' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {cardFilter === 'receivable' ? '수금완료' : '지급완료'}
                    </button>
                  )}
                </div>
              </div>
            )
          })
        })()}
        {/* 모바일 합계 */}
        {!cardFilter && withBalance.length > 0 && (
          <div className="bg-[var(--bg-muted)] border border-[var(--border-default)] rounded-xl p-3 flex items-center justify-between text-[10px] font-bold">
            <span className="text-[var(--text-primary)]">합계</span>
            <div className="flex gap-3">
              <span className="text-emerald-600">입금 ₩{stats.totalIn.toLocaleString()}</span>
              <span className="text-red-500">출금 ₩{stats.totalOut.toLocaleString()}</span>
            </div>
          </div>
        )}
        {cardFilter && cardFilteredList.length > 0 && (
          <div className="bg-[var(--bg-muted)] border border-[var(--border-default)] rounded-xl p-3 flex items-center justify-between text-[10px] font-bold">
            <span className="text-[var(--text-primary)]">합계 ({cardFilteredList.length}건)</span>
            <span className="text-[var(--text-primary)]">₩{cardFilteredList.reduce((s: number, c: any) => s + (c.amount || 0), 0).toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  )
}
