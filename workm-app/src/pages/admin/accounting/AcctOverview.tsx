import React, { useMemo } from 'react'
import { getItem } from '../../../utils/storage'
import { formatNumber } from '../../../utils/format'
import { useAuthStore } from '../../../stores/authStore'
import type { BudgetCat, BudgetItem, CashFlow, Approval, Voucher } from './types'
import { cn } from '../../../utils/cn'
import { FileCheck, ArrowDownCircle, ArrowUpCircle, PieChart, ScrollText, Settings2, Banknote, Settings } from 'lucide-react'

export default function AcctOverview({ year, selectedCatId }: { year: number; selectedCatId: string | number | null }) {
  const budgetCats = useMemo(() => getItem<BudgetCat[]>('acct_budget_cats', []), [])
  const budgets = useMemo(() => getItem<BudgetItem[]>('acct_budgets', []), [])
  const cashflows = useMemo(() => getItem<CashFlow[]>('acct_cashflows', []), [])
  const approvals = useMemo(() => getItem<Approval[]>('acct_approvals', []), [])
  const vouchers = useMemo(() => getItem<Voucher[]>('acct_vouchers', []), [])
  const user = useAuthStore(s => s.user)

  const selectedOverviewCatId = selectedCatId

  // 예산 접근 권한 확인
  const { hasBudgetAccess, isBudgetApprover } = useMemo(() => {
    const userName = user?.name || ''
    const staffList = getItem<any[]>('ws_users', [])
    const currentStaff = staffList.find(s => s.name === userName)
    const isApprover = currentStaff?.approverType === 'approver'
    const isHandler = budgetCats.some(c =>
      (c.users && c.users.includes(userName)) ||
      ((c as any).approvers && (c as any).approvers.includes(userName))
    )
    return { hasBudgetAccess: isApprover || isHandler, isBudgetApprover: isApprover }
  }, [user, budgetCats])

  const isInYear = (dateStr?: string) => {
    if (!dateStr) return false
    return parseInt(String(dateStr).substring(0, 4)) === year
  }

  /* ── 연도별 필터 ── */
  const allYearCats = budgetCats.filter(cat => {
    const catYear = cat.year || (cat.periodFrom ? parseInt(cat.periodFrom.substring(0, 4)) : new Date().getFullYear())
    return catYear === year
  })
  // 모든 카테고리 표시 (클릭 가능 여부는 렌더링에서 개별 체크)
  const yearCats = allYearCats
  const yearCatIds = yearCats.map(c => c.id)
  const yearBudgets = budgets.filter(b => yearCatIds.includes(b.catId))
  const yearCashflows = cashflows.filter(cf => isInYear(cf.date))
  const yearApprovals = approvals.filter(a => isInYear(a.date || a.createdAt))
  const yearVouchers = vouchers.filter(v => isInYear(v.date))

  /* ── 선택 구분별 예산 필터 ── */
  const filteredBudgets = selectedOverviewCatId
    ? yearBudgets.filter(b => String(b.catId) === String(selectedOverviewCatId))
    : yearBudgets

  /* ── 통계 ── */
  const totalIncomeAll = yearCashflows.filter(c => c.type === 'income').reduce((a, c) => a + (c.amount || 0), 0)
  const totalExpenseAll = yearCashflows.filter(c => c.type === 'expense').reduce((a, c) => a + (c.amount || 0), 0)
  const pendingCount = yearApprovals.filter(a => a.status === 'pending').length
  const totalBudgetAmt = filteredBudgets.reduce((a, b) => a + (b.amount || 0), 0)
  const totalBudgetSpent = filteredBudgets.reduce((a, b) => a + (b.spent || 0), 0)
  const budgetRate = totalBudgetAmt > 0 ? Math.round(totalBudgetSpent / totalBudgetAmt * 100) : 0

  // 예산구분 선택 시 해당 예산의 합계만 표시, 전체 시 캐시플로 합계 표시
  const displayIncome = selectedOverviewCatId ? totalBudgetAmt : totalIncomeAll
  const displayExpense = selectedOverviewCatId ? totalBudgetSpent : totalExpenseAll
  const displayBalance = selectedOverviewCatId ? (totalBudgetAmt - totalBudgetSpent) : (totalIncomeAll - totalExpenseAll)

  const statCards = [
    { icon: ArrowDownCircle, label: selectedOverviewCatId ? '총 예산' : '총 수입', value: `${formatNumber(displayIncome)}원`, color: '#22c55e' },
    { icon: ArrowUpCircle, label: selectedOverviewCatId ? '총 집행' : '총 지출', value: `${formatNumber(displayExpense)}원`, color: '#ef4444' },
    { icon: Banknote, label: selectedOverviewCatId ? '잔여 예산' : '잔액', value: `${formatNumber(displayBalance)}원`, color: displayBalance >= 0 ? '#4f6ef7' : '#ef4444' },
    { icon: FileCheck, label: '결재 대기', value: `${pendingCount}건`, color: '#f59e0b' },
  ]

  /* ── 최근 전표 5건 ── */
  const recentVouchers = [...yearVouchers]
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, 5)

  /* ── 예산 소진율 TOP 5 ── */
  const budgetBars = filteredBudgets
    .map(b => ({
      name: b.itemName,
      pct: b.amount > 0 ? Math.round((b.spent || 0) / b.amount * 100) : 0,
      spent: b.spent || 0,
      amount: b.amount,
    }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5)

  /* ── 월별 수입/지출 (최근 6개월) ── */
  const monthData = useMemo(() => {
    const now = new Date()
    const data: Record<string, { income: number; expense: number }> = {}
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      data[key] = { income: 0, expense: 0 }
    }
    yearCashflows.forEach(c => {
      const mk = c.date ? c.date.slice(0, 7) : ''
      if (data[mk]) {
        if (c.type === 'income') data[mk].income += (c.amount || 0)
        else data[mk].expense += (c.amount || 0)
      }
    })
    return data
  }, [yearCashflows])

  const maxMonthVal = Math.max(1, ...Object.values(monthData).map(d => Math.max(d.income, d.expense)))
  const tabColors = ['#4f6ef7', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

  const [searchParams, setSearchParams] = useSearchParams()

  /* 연도 목록 (기초예산에서 설정된 연도들) */
  const allYears = useMemo(() => {
    const ySet = new Set(budgetCats.map(c => {
      if (c.year) return c.year
      if (c.periodFrom) return parseInt(c.periodFrom.substring(0, 4))
      return new Date().getFullYear()
    }))
    ySet.add(year)
    return Array.from(ySet).sort((a, b) => a - b)
  }, [budgetCats, year])

  const setOverviewYear = (y: number) => {
    const params: Record<string, string> = { tab: 'overview', year: String(y) }
    setSearchParams(params)
  }

  const setOverviewCat = (catId: string | null) => {
    const params: Record<string, string> = { tab: 'overview', year: String(year) }
    if (catId) params.cat = catId
    setSearchParams(params)
  }

  const addToast = useToastStore(s => s.add)

  const handleServerSave = () => {
    downloadSettingsJson()
    addToast('success', '설정 파일(settings.json)이 다운로드됩니다. docs/data/ 폴더에 넣고 배포하세요.')
  }

  const handleServerLoad = async () => {
    const loaded = await loadSettingsFromServer()
    if (loaded) {
      addToast('success', '서버에서 설정을 불러왔습니다. 새로고침합니다.')
      setTimeout(() => window.location.reload(), 1000)
    } else {
      addToast('info', '서버에 저장된 설정이 없거나 이미 최신 상태입니다.')
    }
  }

  const handleFileImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e: any) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const count = importSettingsFromJson(reader.result as string, true)
        if (count > 0) {
          addToast('success', `${count}개 설정을 불러왔습니다. 새로고침합니다.`)
          setTimeout(() => window.location.reload(), 1000)
        } else {
          addToast('error', '올바른 설정 파일이 아닙니다.')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  return (
    <div className="space-y-4">
      {/* ── 데이터 동기화 ── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-sm font-extrabold text-[var(--text-primary)]">📦 데이터 동기화</span>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">로컬 설정을 서버에 저장하거나, 서버에서 불러올 수 있습니다</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleServerSave} className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors flex items-center gap-1">
              ⬆️ 서버 저장
            </button>
            <button onClick={handleServerLoad} className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center gap-1">
              ⬇️ 서버에서 불러오기
            </button>
            <button onClick={handleFileImport} className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[var(--bg-muted)] text-[var(--text-primary)] border border-[var(--border-default)] hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-1">
              📂 파일 불러오기
            </button>
          </div>
        </div>
      </div>
      {/* ── 통계 카드 ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(card => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center mb-2"
                style={{ background: `${card.color}22`, color: card.color }}
              >
                <Icon size={17} />
              </div>
              <div className="text-[11px] font-bold text-[var(--text-muted)]">{card.label}</div>
              <div className="text-lg font-extrabold" style={{ color: card.color }}>{card.value}</div>
            </div>
          )
        })}
      </div>

      {/* ── 예산 집행 현황 ── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4">
        <div className="flex items-center gap-2 text-sm font-extrabold text-[var(--text-primary)] mb-3">
          <PieChart size={16} className="text-primary-500" /> 예산 집행 현황
        </div>        <div className="grid grid-cols-3 gap-4 mb-3">
          <div className="text-center">
            <div className="text-[11px] text-[var(--text-muted)] mb-1">총 편성 예산</div>
            <div className="text-base font-extrabold text-[var(--text-primary)]">{formatNumber(totalBudgetAmt)}원</div>
          </div>
          <div className="text-center">
            <div className="text-[11px] text-[var(--text-muted)] mb-1">총 집행액</div>
            <div className="text-base font-extrabold text-danger">{formatNumber(totalBudgetSpent)}원</div>
          </div>
          <div className="text-center">
            <div className="text-[11px] text-[var(--text-muted)] mb-1">잔여예산</div>
            <div className="text-base font-extrabold text-success">{formatNumber(totalBudgetAmt - totalBudgetSpent)}원</div>
          </div>
        </div>
        <div className="h-3.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, budgetRate)}%`,
              background: budgetRate > 100 ? '#ef4444' : budgetRate > 80 ? '#f59e0b' : '#4f6ef7',
            }}
          />
        </div>
        <div
          className="text-right text-xs font-bold mt-1"
          style={{ color: budgetRate > 100 ? '#ef4444' : 'var(--text-muted)' }}
        >
          {budgetRate}% 집행
        </div>
      </div>

      {/* ── 2칼럼: 월별 차트 + 예산 소진율 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 월별 차트 */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[var(--text-primary)] mb-4">
            <Settings2 size={16} className="text-primary-500" /> 월별 수입 · 지출
          </div>
          <div className="flex items-end justify-between gap-2 h-[140px]">
            {Object.entries(monthData).map(([key, d]) => {
              const ih = Math.max(4, (d.income / maxMonthVal) * 120)
              const eh = Math.max(4, (d.expense / maxMonthVal) * 120)
              return (
                <div key={key} className="flex-1 flex flex-col items-center gap-1">
                  <div className="flex items-end gap-0.5 h-[120px]">
                    <div
                      className="w-3 rounded-t-sm transition-all duration-500"
                      style={{ height: ih, background: '#22c55e' }}
                      title={`수입 ${formatNumber(d.income)}원`}
                    />
                    <div
                      className="w-3 rounded-t-sm transition-all duration-500"
                      style={{ height: eh, background: '#ef4444' }}
                      title={`지출 ${formatNumber(d.expense)}원`}
                    />
                  </div>
                  <span className="text-[9px] font-bold text-[var(--text-muted)]">{key.slice(5)}월</span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-4 justify-center mt-3">
            <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#22c55e' }} /> 수입
            </span>
            <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#ef4444' }} /> 지출
            </span>
          </div>
        </div>

        {/* 예산 소진율 TOP 5 */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[var(--text-primary)] mb-4">
            <PieChart size={16} className="text-primary-500" /> 예산 소진율 TOP 5
          </div>
          {budgetBars.length === 0 ? (
            <EmptyState emoji="📊" title="등록된 예산이 없습니다" />
          ) : (
            <div className="space-y-3">
              {budgetBars.map((b, i) => {
                const color = b.pct > 100 ? '#ef4444' : b.pct > 80 ? '#f59e0b' : '#4f6ef7'
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-bold text-[var(--text-primary)] truncate">{b.name}</span>
                      <span className="font-extrabold" style={{ color }}>{b.pct}%{b.pct > 100 ? ' ⚠️' : ''}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, b.pct)}%`, background: color }}
                      />
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                      {formatNumber(b.spent)}원 / {formatNumber(b.amount)}원
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── 최근 전표 ── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-default)]">
          <ScrollText size={16} className="text-primary-500" />
          <span className="text-sm font-extrabold text-[var(--text-primary)]">최근 전표</span>
        </div>
        {recentVouchers.length === 0 ? (
          <div className="p-6">
            <EmptyState emoji="📋" title="등록된 전표가 없습니다" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-[var(--bg-muted)]">
                  {['날짜', '유형', '적요', '차변', '대변'].map((h, i) => (
                    <th key={i} className="py-2.5 px-3.5 text-[11px] font-bold text-[var(--text-muted)] text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentVouchers.map(v => {
                  let ds = 0, cs = 0
                  ;(v.entries || []).forEach(e => {
                    if (e.side === 'debit') ds += e.amount
                    else cs += e.amount
                  })
                  const typeInfo = v.type === 'income'
                    ? { label: '입금', color: '#22c55e', bg: 'rgba(34,197,94,.1)' }
                    : v.type === 'expense'
                      ? { label: '출금', color: '#ef4444', bg: 'rgba(239,68,68,.1)' }
                      : { label: '대체', color: '#8b5cf6', bg: 'rgba(139,92,246,.1)' }
                  return (
                    <tr key={v.id} className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-muted)] transition-colors">
                      <td className="py-2.5 px-3.5 text-[12px] text-[var(--text-secondary)]">{v.date || ''}</td>
                      <td className="py-2.5 px-3.5">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: typeInfo.bg, color: typeInfo.color }}
                        >
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-[12px] text-[var(--text-primary)] font-bold truncate max-w-[200px]">
                        {v.description || ''}
                      </td>
                      <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-danger text-right">{formatNumber(ds)}원</td>
                      <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-success text-right">{formatNumber(cs)}원</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>


    </div>
  )
}
