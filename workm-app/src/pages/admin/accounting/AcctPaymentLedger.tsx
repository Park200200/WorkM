import React, { useState, useMemo, useEffect } from 'react'
import { getItem, setItem } from '../../../utils/storage'
import { formatNumber } from '../../../utils/format'
import type { Voucher } from './types'
import { getLocalDate, getLocalISOString } from './utils'
import { BookOpen, Plus, Edit3, Trash2, X } from 'lucide-react'

export default function AcctPaymentLedger({ year, catId }: { year: number; catId?: string | null }) {
  const [refresh, setRefresh] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | number | null>(null)
  const [vmDate, setVmDate] = useState(getLocalDate())
  const [vmType, setVmType] = useState<'expense' | 'income' | 'transfer'>('expense')
  const [vmDesc, setVmDesc] = useState('')
  const [vmEntries, setVmEntries] = useState<{ side: string; accountCode: string; amount: string }[]>([
    { side: 'debit', accountCode: '', amount: '' },
    { side: 'credit', accountCode: '', amount: '' },
  ])

  const accounts = useMemo(() => getItem<{ code: string; name: string; type: string }[]>('acct_accounts', []), [])
  const budgetCats = useMemo(() => getItem<any[]>('acct_budget_cats', []), [])
  const cashflows = useMemo(() => getItem<any[]>('acct_cashflows', []), [refresh])

  const vouchers = useMemo(() => {
    const all = getItem<Voucher[]>('acct_vouchers', [])
    return all.filter(v => v.date && parseInt(v.date.substring(0, 4)) === year)
      .sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || '').localeCompare(a.createdAt || '') || Number(b.id) - Number(a.id))
  }, [year, refresh])

  const incCnt = vouchers.filter(v => v.type === 'income').length
  const expCnt = vouchers.filter(v => v.type === 'expense').length
  const etcCnt = vouchers.length - incCnt - expCnt
  const [voucherTypeFilter, setVoucherTypeFilter] = useState<string>('')
  const [voucherBudgetFilter, setVoucherBudgetFilter] = useState<string>(catId && catId !== 'all' ? catId : '')

  // 헤더 예산 변경 시 동기화
  useEffect(() => {
    setVoucherBudgetFilter(catId && catId !== 'all' ? catId : '')
  }, [catId])

  // 기존 전표에 budgetCatId 마이그레이션
  useEffect(() => {
    const all = getItem<any[]>('acct_vouchers', [])
    const cfs = getItem<any[]>('acct_cashflows', [])
    let changed = false
    all.forEach((v: any) => {
      if (!v.budgetCatId && v.date && v.entries) {
        const totalAmt = Number((v.entries || []).reduce((s: number, e: any) => e.side === 'debit' ? s + Number(e.amount || 0) : s, 0))
        // 날짜+금액+타입 매칭
        const match = cfs.find((c: any) => {
          const cfDate = (c.date || c.writeDate || '').slice(0, 10)
          const vDate = (v.date || '').slice(0, 10)
          return cfDate === vDate && Number(c.amount) === totalAmt && c.budgetCatId
        })
        if (match) {
          v.budgetCatId = match.budgetCatId
          changed = true
        }
      }
    })
    if (changed) {
      setItem('acct_vouchers', all)
      setRefresh(r => r + 1)
    }
  }, [])

  const filteredVouchers = useMemo(() => {
    let list = vouchers
    if (voucherTypeFilter) {
      list = list.filter(v => {
        if (voucherTypeFilter === 'income') return v.type === 'income'
        if (voucherTypeFilter === 'expense') return v.type === 'expense'
        if (voucherTypeFilter === 'transfer') return v.type !== 'income' && v.type !== 'expense'
        return true
      })
    }
    if (voucherBudgetFilter) {
      // 직접 budgetCatId가 있으면 사용, 없으면 cashflow에서 매칭
      const cfMap = new Map<string, string>()
      cashflows.forEach((c: any) => {
        if (c.budgetCatId) {
          const key = `${(c.date || c.writeDate || '').slice(0,10)}_${Number(c.amount)}`
          cfMap.set(key, String(c.budgetCatId))
        }
      })
      list = list.filter(v => {
        const directCat = String((v as any).budgetCatId || '')
        if (directCat) return directCat === voucherBudgetFilter
        // 폴백: cashflow 매칭
        const totalAmt = (v.entries || []).reduce((s, e) => e.side === 'debit' ? s + Number(e.amount || 0) : s, 0)
        const key = `${(v.date || '').slice(0,10)}_${totalAmt}`
        return cfMap.get(key) === voucherBudgetFilter
      })
    }
    return list
  }, [vouchers, voucherTypeFilter, voucherBudgetFilter, cashflows])

  // 예산 필터만 적용 (유형 필터 제외) - 카드 카운트용
  const budgetBaseVouchers = useMemo(() => {
    if (!voucherBudgetFilter) return vouchers
    const cfMap = new Map<string, string>()
    cashflows.forEach((c: any) => {
      if (c.budgetCatId) {
        const key = `${(c.date || c.writeDate || '').slice(0,10)}_${Number(c.amount)}`
        cfMap.set(key, String(c.budgetCatId))
      }
    })
    return vouchers.filter(v => {
      const directCat = String((v as any).budgetCatId || '')
      if (directCat) return directCat === voucherBudgetFilter
      const totalAmt = (v.entries || []).reduce((s, e) => e.side === 'debit' ? s + Number(e.amount || 0) : s, 0)
      const key = `${(v.date || '').slice(0,10)}_${totalAmt}`
      return cfMap.get(key) === voucherBudgetFilter
    })
  }, [vouchers, voucherBudgetFilter, cashflows])
  const openModal = (id?: string | number) => {
    if (id) {
      const v = getItem<Voucher[]>('acct_vouchers', []).find(x => String(x.id) === String(id))
      if (v) {
        setEditId(id)
        setVmDate(v.date || getLocalDate())
        setVmType((v.type as 'expense' | 'income' | 'transfer') || 'expense')
        setVmDesc(v.description || '')
        setVmEntries((v.entries || []).map(e => ({
          side: e.side,
          accountCode: e.accountCode || '',
          amount: e.amount ? formatNumber(e.amount) : '',
        })))
      }
    } else {
      setEditId(null)
      setVmDate(getLocalDate())
      setVmType('expense')
      setVmDesc('')
      setVmEntries([
        { side: 'debit', accountCode: '', amount: '' },
        { side: 'credit', accountCode: '', amount: '' },
      ])
    }
    setModalOpen(true)
  }

  const addEntry = () => setVmEntries(prev => [...prev, { side: 'debit', accountCode: '', amount: '' }])
  const removeEntry = (idx: number) => setVmEntries(prev => prev.filter((_, i) => i !== idx))

  const saveVoucher = () => {
    if (!vmDesc.trim()) { alert('적요를 입력하세요'); return }
    const entries = vmEntries
      .map(e => ({ side: e.side, accountCode: e.accountCode, amount: parseInt(e.amount.replace(/,/g, '')) || 0 }))
      .filter(e => e.accountCode && e.amount > 0)
    if (entries.length < 2) { alert('차변/대변 항목을 최소 2개 입력하세요'); return }

    const all = getItem<Voucher[]>('acct_vouchers', [])
    if (editId) {
      const updated = all.map(v => String(v.id) === String(editId)
        ? { ...v, date: vmDate, type: vmType, description: vmDesc, entries }
        : v
      )
      setItem('acct_vouchers', updated)
    } else {
      all.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        date: vmDate, type: vmType, description: vmDesc, entries,
        createdAt: getLocalISOString(),
      })
      setItem('acct_vouchers', all)
    }
    setModalOpen(false)
    setRefresh(r => r + 1)
  }

  const deleteVoucher = (id: string | number) => {
    if (!confirm('이 전표를 삭제하시겠습니까?')) return
    const all = getItem<Voucher[]>('acct_vouchers', []).filter(v => String(v.id) !== String(id))
    setItem('acct_vouchers', all)
    setRefresh(r => r + 1)
  }

  const typeColors: Record<string, string> = { income: '#22c55e', expense: '#ef4444', transfer: '#f59e0b' }
  const typeLabels: Record<string, string> = { income: '입금', expense: '출금', transfer: '대체' }
  const typeBgs: Record<string, string> = { income: 'rgba(34,197,94,.1)', expense: 'rgba(239,68,68,.1)', transfer: 'rgba(245,158,11,.1)' }

  return (
    <div className="space-y-4">
      {/* 요약 */}
      <div className="bg-gradient-to-r from-[#6366f1] to-[#4f6ef7] rounded-2xl p-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <BookOpen size={18} />
            </div>
            <div>
              <div className="text-[17px] font-extrabold">전표장부</div>
              <div className="text-[11.5px] opacity-85">모든 전표 조회·수정 (회계담당자용)</div>
            </div>
          </div>
          <button onClick={() => openModal()} className="flex items-center gap-1.5 px-3.5 py-2 bg-white/20 border border-white/40 rounded-xl text-[13px] font-bold cursor-pointer hover:bg-white/30 transition-colors">
            <Plus size={14} /> 등록
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: '총 전표', value: budgetBaseVouchers.length, bg: 'rgba(255,255,255,.18)', filter: '' },
            { label: '입금', value: budgetBaseVouchers.filter(v => v.type === 'income').length, bg: 'rgba(34,197,94,.2)', filter: 'income' },
            { label: '출금', value: budgetBaseVouchers.filter(v => v.type === 'expense').length, bg: 'rgba(239,68,68,.2)', filter: 'expense' },
            { label: '대체', value: budgetBaseVouchers.filter(v => v.type !== 'income' && v.type !== 'expense').length, bg: 'rgba(245,158,11,.2)', filter: 'transfer' },
          ].map(s => (
            <div key={s.label} onClick={() => setVoucherTypeFilter(voucherTypeFilter === s.filter ? '' : s.filter)} className={`rounded-xl p-2 text-center cursor-pointer transition-all ${voucherTypeFilter === s.filter ? 'ring-2 ring-white shadow-lg scale-[1.02]' : 'hover:bg-white/10'}`} style={{ background: s.bg }}>
              <div className="text-[9px] opacity-80">{s.label}</div>
              <div className="text-[16px] font-extrabold">{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 예산 필터 */}
      <div className="flex items-center gap-2">
        <select value={voucherBudgetFilter} onChange={e => setVoucherBudgetFilter(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)]">
          <option value="">전체 예산</option>
          {budgetCats.filter((c: any) => { const pf = c.periodFrom || ''; const pt = c.periodTo || ''; if (pf && pt) return pf <= `${year}-12-31` && pt >= `${year}-01-01`; return true }).map((c: any) => (
            <option key={c.id} value={String(c.id)}>{c.name}</option>
          ))}
        </select>
        {(voucherTypeFilter || voucherBudgetFilter) && (
          <button onClick={() => { setVoucherTypeFilter(''); setVoucherBudgetFilter('') }} className="px-2.5 py-2 rounded-lg bg-[var(--bg-muted)] text-[11px] font-bold text-[var(--text-muted)] hover:bg-primary-100 hover:text-primary-600 cursor-pointer transition-all whitespace-nowrap">✕ 초기화</button>
        )}
      </div>

      {/* 전표 목록 */}
      {filteredVouchers.length === 0 ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-8">
          <EmptyState emoji="📒" title={voucherTypeFilter || voucherBudgetFilter ? '해당 조건의 전표가 없습니다' : '등록된 전표가 없습니다'} />
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredVouchers.map(v => {
            let ds = 0, cs = 0
            ;(v.entries || []).forEach(e => { if (e.side === 'debit') ds += e.amount; else cs += e.amount })
            const tc = typeColors[v.type || ''] || '#8b5cf6'
            const tl = typeLabels[v.type || ''] || '대체'
            const tb = typeBgs[v.type || ''] || 'rgba(139,92,246,.1)'
            return (
              <div key={v.id} className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden" style={{ borderLeft: `4px solid ${tc}` }}>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[var(--text-muted)] font-semibold">{v.date || ''}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: tb, color: tc }}>{tl}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openModal(v.id)} className="p-1 rounded-md bg-[rgba(79,110,247,.1)] text-[#4f6ef7] hover:bg-[rgba(79,110,247,.2)] cursor-pointer"><Edit3 size={12} /></button>
                    <button onClick={() => deleteVoucher(v.id)} className="p-1 rounded-md bg-[rgba(239,68,68,.08)] text-[#ef4444] hover:bg-[rgba(239,68,68,.15)] cursor-pointer"><Trash2 size={12} /></button>
                  </div>
                </div>
                <div className="px-4 pb-3">
                  <div className="text-[14px] font-bold text-[var(--text-primary)] mb-2">{v.description || ''}</div>
                  <div className="bg-[var(--bg-muted)] rounded-lg p-2.5 space-y-1.5">
                    {(v.entries || []).map((e, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: e.side === 'debit' ? 'rgba(79,110,247,.12)' : 'rgba(239,68,68,.12)', color: e.side === 'debit' ? '#4f6ef7' : '#ef4444' }}>
                            {e.side === 'debit' ? '차변' : '대변'}
                          </span>
                          <span className="text-[12px] text-[var(--text-secondary)]">{e.accountCode}</span>
                        </div>
                        <span className="text-[12px] font-bold" style={{ color: e.side === 'debit' ? '#4f6ef7' : '#ef4444' }}>{formatNumber(e.amount)}원</span>
                      </div>
                    ))}
                    <div className="border-t border-[var(--border-default)] pt-1.5 flex justify-between">
                      <span className="text-[11px] font-bold text-[var(--text-muted)]">합계</span>
                      <span className="text-[13px] font-extrabold" style={{ color: tc }}>{formatNumber(ds)}원</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 전표 등록/수정 모달 */}
      {modalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center bg-black/40" onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="bg-[var(--bg-surface)] rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-[600px] mx-0 md:mx-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-default)]">
              <span className="text-sm font-extrabold text-[var(--text-primary)]">{editId ? '전표 수정' : '전표 등록'}</span>
              <button onClick={() => setModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">날짜 *</label>
                <DatePicker value={vmDate} onChange={setVmDate} />
              </div>
              <div>
                <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">유형</label>
                <div className="flex gap-2">
                  {(['expense', 'income', 'transfer'] as const).map(t => {
                    const active = vmType === t
                    const c = typeColors[t] || '#4f6ef7'
                    return (
                      <button key={t} onClick={() => setVmType(t)} className={cn('flex-1 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer transition-all border', active ? 'text-white' : 'text-[var(--text-muted)] border-[var(--border-default)] bg-[var(--bg-muted)]')} style={active ? { background: c, borderColor: c } : {}}>
                        {typeLabels[t] || t}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">적요 *</label>
                <input value={vmDesc} onChange={e => setVmDesc(e.target.value)} placeholder="거래 내용" className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none" />
              </div>
              <div>
                <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-2 block">차변 / 대변 항목</label>
                <div className="space-y-2">
                  {vmEntries.map((entry, idx) => (
                    <div key={idx} className="bg-[var(--bg-muted)] rounded-xl p-3 space-y-2 relative">
                      {idx >= 2 && (
                        <button onClick={() => removeEntry(idx)} className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded bg-[rgba(239,68,68,.1)] text-[#ef4444] cursor-pointer text-[10px]"><X size={10} /></button>
                      )}
                      <div className="flex gap-2">
                        <select value={entry.side} onChange={e => { const v = e.target.value; setVmEntries(prev => prev.map((en, i) => i === idx ? { ...en, side: v } : en)) }} className="w-[80px] px-2 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[12px] font-bold outline-none" style={{ color: entry.side === 'debit' ? '#4f6ef7' : '#ef4444' }}>
                          <option value="debit">차변</option>
                          <option value="credit">대변</option>
                        </select>
                        <select value={entry.accountCode} onChange={e => { const v = e.target.value; setVmEntries(prev => prev.map((en, i) => i === idx ? { ...en, accountCode: v } : en)) }} className="flex-1 px-2 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[12px] outline-none">
                          <option value="">계정과목 선택</option>
                          {accounts.map(a => <option key={a.code} value={a.code}>{a.code} {a.name}</option>)}
                        </select>
                      </div>
                      <input value={entry.amount} onChange={e => { const digits = e.target.value.replace(/[^\d]/g, ''); const formatted = digits ? Number(digits).toLocaleString('ko-KR') : ''; setVmEntries(prev => prev.map((en, i) => i === idx ? { ...en, amount: formatted } : en)) }} placeholder="금액" className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm font-bold text-right outline-none" />
                    </div>
                  ))}
                </div>
                <button onClick={addEntry} className="w-full mt-2 py-2.5 rounded-xl border border-dashed border-[var(--border-default)] text-[13px] font-semibold text-[var(--text-muted)] cursor-pointer hover:border-primary-400 hover:text-primary-500 transition-colors flex items-center justify-center gap-1.5">
                  <Plus size={14} /> 항목 추가
                </button>
              </div>
            </div>
            <div className="flex gap-2 px-5 py-3 border-t border-[var(--border-default)]">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-[var(--border-default)] text-sm font-semibold text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--bg-muted)]">취소</button>
              <button onClick={saveVoucher} className="flex-[2] py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f6ef7] text-white text-sm font-bold cursor-pointer shadow-md">저장</button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  )
}
