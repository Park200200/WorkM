import React, { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getItem, setItem } from '../../../utils/storage'
import { formatNumber } from '../../../utils/format'
import type { BudgetCat } from './types'
import { Landmark, BarChart2 } from 'lucide-react'
import { cn } from '../../../utils/cn'
import { useAuthStore } from '../../../stores/authStore'
import AcctBudget from './AcctBudget'
import { AcctBalance } from '../../../components/accounting/AcctBalance'

export default function AcctBaseBudget({ year: propYear }: { year: number }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentYear = new Date().getFullYear()
  const user = useAuthStore(s => s.user)
  const isBudgetApprover = useMemo(() => {
    const userName = user?.name || ''
    const sl = getItem<any[]>('ws_users', [])
    return sl.find(s => s.name === userName)?.approverType === 'approver'
  }, [user])

  /* 내부 탭: budget / balance */
  const [innerTab, setInnerTab] = useState<'budget' | 'balance'>('budget')
  const [yearDropOpen, setYearDropOpen] = useState(false)
  const [appliedYear, setAppliedYear] = useState<number>(() => parseInt(localStorage.getItem('acct_active_year') || '') || currentYear)

  /* 연도 목록: 예산설정에 등록된 연도 + 현재 연도 + 선택된 연도 */
  const years = useMemo(() => {
    const budgetCats = getItem<BudgetCat[]>('acct_budget_cats', [])
    const existing = Array.from(new Set(budgetCats.map(c => {
      if (c.year) return c.year
      if (c.periodFrom) return parseInt(c.periodFrom.substring(0, 4))
      return currentYear
    })))
    if (!existing.includes(currentYear)) existing.push(currentYear)
    if (propYear && !existing.includes(propYear)) existing.push(propYear)
    return existing.sort((a, b) => a - b)
  }, [currentYear, propYear])

  /* + 버튼으로 연도 추가 후 해당 연도로 전환 */
  const addYear = () => {
    const maxYear = Math.max(...years, currentYear)
    const nextYear = maxYear + 1
    const tab = searchParams.get('tab') || 'base_budget'
    setSearchParams({ tab, year: String(nextYear) })
  }

  const setYear = (y: number) => {
    const tab = searchParams.get('tab') || 'base_budget'
    setSearchParams({ tab, year: String(y) })
  }

  return (
    <div className="animate-fadeIn">
      {/* ── 상단 헤더: 탭 ── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          {/* 내부 탭 */}
          <div className="flex items-center bg-[var(--bg-muted)] rounded-xl p-1 border border-[var(--border-default)]">
            <button
              onClick={() => setInnerTab('budget')}
              className={cn(
                'px-4 py-2 rounded-lg text-[13px] font-bold transition-all cursor-pointer flex items-center gap-1.5',
                innerTab === 'budget'
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              )}
            >
              <BarChart2 size={14} /> 예산설정
            </button>
            <button
              onClick={isBudgetApprover ? () => setInnerTab('balance') : undefined}
              className={cn(
                'px-4 py-2 rounded-lg text-[13px] font-bold transition-all flex items-center gap-1.5',
                isBudgetApprover ? 'cursor-pointer' : 'cursor-not-allowed opacity-50',
                innerTab === 'balance'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-[var(--text-muted)]' + (isBudgetApprover ? ' hover:text-[var(--text-primary)]' : '')
              )}
              title={!isBudgetApprover ? '지출승인권자만 사용 가능' : undefined}
            >
              <Landmark size={14} /> 기초잔액
            </button>
          </div>
        </div>

        {/* ── 연도 선택 + 추가 + 적용 (우측) ── */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[var(--bg-muted)] rounded-xl p-1 border border-[var(--border-default)]">
            {years.map(y => (
              <button
                key={y}
                onClick={isBudgetApprover ? () => setYear(y) : undefined}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all',
                  isBudgetApprover ? 'cursor-pointer' : 'cursor-not-allowed opacity-50',
                  y === propYear
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border-default)]'
                    : 'text-[var(--text-muted)]' + (isBudgetApprover ? ' hover:text-[var(--text-primary)]' : '')
                )}
                title={!isBudgetApprover ? '지출승인권자만 사용 가능' : undefined}
              >
                {String(y).slice(-2)}년도
              </button>
            ))}
            <button
              onClick={isBudgetApprover ? addYear : undefined}
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${isBudgetApprover ? 'text-[var(--text-muted)] hover:bg-primary-100 hover:text-primary-600 dark:hover:bg-primary-900/30 dark:hover:text-primary-400 cursor-pointer' : 'text-[var(--text-muted)] opacity-50 cursor-not-allowed'} transition-all text-[14px] font-bold`}
              title={isBudgetApprover ? '연도 추가' : '지출승인권자만 사용 가능'}
            >
              +
            </button>
          </div>
          {/* 적용된 연도 상태 표시 */}
          <button
            className="px-3 py-1.5 rounded-lg text-[12px] font-bold bg-emerald-500 text-white border border-emerald-500 shadow-sm cursor-default flex items-center gap-1"
          >
            ✓ {appliedYear}년 적용됨
          </button>
          {/* 회계년도 적용 버튼 */}
          <button
            onClick={isBudgetApprover ? () => {
              setItem('acct_active_year', String(propYear))
              setAppliedYear(propYear)
              const tab = searchParams.get('tab') || 'base_budget'
              const params: Record<string, string> = { tab, year: String(propYear) }
              setSearchParams(params)
            } : undefined}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-bold bg-primary-500 text-white border border-primary-500 ${isBudgetApprover ? 'hover:bg-primary-600 cursor-pointer' : 'opacity-50 cursor-not-allowed'} transition-all shadow-sm`}
            title={!isBudgetApprover ? '지출승인권자만 사용 가능' : undefined}
          >
            회계년도 적용
          </button>
        </div>
      </div>

      {/* ── 탭별 컨텐츠 ── */}
      {innerTab === 'budget' ? (
        <AcctBudget year={propYear} />
      ) : (
        <AcctBalance year={propYear} />
      )}
    </div>
  )
}
