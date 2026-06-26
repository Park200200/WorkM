import React, { useState, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../../components/common/PageHeader'
import { EmptyState } from '../../components/common/EmptyState'
import { cn } from '../../utils/cn'
import { getItem, setItem } from '../../utils/storage'
import { useToastStore } from '../../stores/toastStore'
import { saveAttachmentImage, deleteAttachmentImage } from '../../utils/attachmentDB'
import { formatNumber } from '../../utils/format'
// 분리된 모듈 (Phase 2)
export type { BudgetCatAccount, BudgetCat, AccountPoolEntry, BudgetDetailDef, BudgetSubDef, BudgetItemDef, BudgetItem, CashFlow, Approval, Voucher, Vendor, HQV, PayMethodCard, PayMethodNote, PayMethodItem } from './accounting/types'
export { getLocalDate, getLocalISOString, fmtPhone, fmtBizNo, uid } from './accounting/utils'
import { initAccountingSeed } from './accounting/seed'
export { initAccountingSeed }
import { ACCT_TYPES, DEBIT_TYPES, CONTRA_CREDIT_CODES, CONTRA_DEBIT_CODES, getDebitCredit, SYSTEM_CODES } from './accounting/constants'
import type { AcctAccount } from './accounting/constants'
import AcctMethodReg from './accounting/AcctMethodReg'
import AcctIncomeMethods from './accounting/AcctIncomeMethods'
import AcctPayMethods from './accounting/AcctPayMethods'
import AcctPaymentLedger from './accounting/AcctPaymentLedger'
import AcctVoucherEntry from './accounting/AcctVoucherEntry'
import AcctApproval from './accounting/AcctApproval'
import AcctBudget from './accounting/AcctBudget'
import AcctOverview from './accounting/AcctOverview'
import AcctBaseBudget from './accounting/AcctBaseBudget'
import AcctCashflowList from './accounting/AcctCashflowList'
import AcctHQVendor from './accounting/AcctHQVendor'
import AcctAccountsMgmt from './accounting/AcctAccountsMgmt'
import AcctVendors from './accounting/AcctVendors'
import { AcctBalance } from '../../components/accounting/AcctBalance'
import { AcctReports } from '../../components/accounting/AcctReports'
import { PrintApprovalForm } from '../../components/accounting/PrintApprovalForm'
import { BudgetTreePanel } from './SettingsPage'
import { useStaffStore } from '../../stores/staffStore'
import { useAuthStore } from '../../stores/authStore'
import { CustomSelect } from '../../components/ui/CustomSelect'
import { DatePicker } from '../../components/ui/DatePicker'
import {
  LayoutDashboard, Wallet, FileCheck, ArrowDownCircle, ArrowUpCircle,
  BookOpen, PieChart, ScrollText, Settings2, ContactRound, Building2,
  TrendingDown, TrendingUp, Banknote, Clock, Search, ChevronDown, ChevronUp,
  Plus, Edit3, Trash2, Save, X, Check, Ban, MoreHorizontal,
  Lock, ShieldCheck, RefreshCw, Printer, Paperclip, Send, Eye,
  CreditCard, Settings, Smartphone, User, Phone, Mail, Landmark,
  ArrowLeftRight, Calendar, Filter, Download, BarChart2, CheckCircle2, Archive, Ticket, FileText, Coins, ClipboardList, Wrench,
} from 'lucide-react'

/* ─── 서버 설정 동기화 ── */
const SYNC_KEYS = [
  'acct_accounts', 'acct_budgets', 'acct_budget_cats', 'acct_budget_item_defs',
  'acct_pay_methods_v2', 'acct_income_methods', 'acct_payment_methods',
  'acct_cashflows', 'acct_vouchers', 'acct_approvals', 'acct_vendors',
  'acct_opening_balances', 'acct_hq_vendors', 'ws_users',
  'acct_itemName_history', 'acct_subItemName_history',
  'acct_desc_myRequest_pending', 'acct_desc_myRequest_preExpense',
  'acct_title_myRequest_pending', 'acct_title_myRequest_preExpense',
  'acct_title_myRequest_approved', 'acct_title_myApproval_approved',
  'acct_company_accounts',
]

/** 로컬 시간 기준 YYYY-MM-DD */
function getLocalDate(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function getLocalISOString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`
}

export async function loadSettingsFromServer() {
  try {
    const base = import.meta.env.BASE_URL || '/'
    const res = await fetch(`${base}data/settings.json?t=${Date.now()}`)
    if (!res.ok) return false
    const data = await res.json()
    if (!data || typeof data !== 'object') return false
    let loaded = 0
    for (const key of Object.keys(data)) {
      // 이미 로컬에 있으면 덮어쓰지 않음 (로컬 우선)
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]))
        loaded++
      }
    }
    return loaded > 0
  } catch { return false }
}

export function exportSettingsJson(): string {
  const data: Record<string, any> = {}
  for (const key of SYNC_KEYS) {
    const val = localStorage.getItem(key)
    if (val) {
      try { data[key] = JSON.parse(val) } catch { data[key] = val }
    }
  }
  return JSON.stringify(data, null, 2)
}

export function downloadSettingsJson() {
  const json = exportSettingsJson()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'settings.json'
  a.click()
  URL.revokeObjectURL(url)
}

export function importSettingsFromJson(json: string, overwrite = true): number {
  try {
    const data = JSON.parse(json)
    const keysToSet: { key: string; value: string }[] = []
    for (const key of Object.keys(data)) {
      if (overwrite || !localStorage.getItem(key)) {
        keysToSet.push({ key, value: typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]) })
      }
    }
    // 원자성 보장: 기존 값 백업 후 일괄 적용
    const backup = keysToSet.map(({ key }) => ({ key, prev: localStorage.getItem(key) }))
    try {
      keysToSet.forEach(({ key, value }) => localStorage.setItem(key, value))
    } catch (e) {
      // 적용 중 오류 시 롤백
      backup.forEach(({ key, prev }) => {
        if (prev === null) localStorage.removeItem(key)
        else localStorage.setItem(key, prev)
      })
      return 0
    }
    return keysToSet.length
  } catch { return 0 }
}


/* ─────────────────────────────────────────────
   타입
   ───────────────────────────────────────────── */
interface BudgetCatAccount {
  id: number
  bankName: string   // 예) 기업은행 10110-11001-12
  cards: string[]    // 연결 카드 목록
}
interface BudgetCat {
  id: string | number
  name: string
  year?: number
  bank?: string
  bankInfo?: string
  accounts?: BudgetCatAccount[]  // 복수 계좌
  periodFrom?: string
  periodTo?: string
  users?: string[]  // 지출담당자 (직원 이름 목록)
  approver?: string  // 승인담당자
}

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

interface BudgetItem {
  id: string | number
  catId: string | number
  year?: number
  itemName: string
  subItemName?: string
  detailItemName?: string
  accountCode?: string
  contraAccountCode?: string
  amount: number
  spent: number
  memo?: string
  budgetItemDefId?: number
  budgetSubDefId?: number
}

interface CashFlow {
  id: string | number
  type: 'income' | 'expense'
  amount: number
  date: string
  description?: string
  accountCode?: string
  manager?: string         // 담당자
  approvalStatus?: string  // 품의상태: 품의준비, 품의완료 등
}

interface Approval {
  id: string | number
  status: string
  date?: string
  createdAt?: string
  accountCode?: string
  amount?: number
  title?: string
  description?: string
  applicant?: string   // 품의자
  approver?: string    // 승인자
  budgetItem?: string      // 예산목
  budgetSubItem?: string   // 예산세목
}

interface Voucher {
  id: string | number
  type?: string
  date?: string
  description?: string
  createdAt?: string
  entries?: Array<{ side: string; amount: number; accountCode?: string; account?: string }>
}

/* ─── 서브 페이지 정의 ── */
const SUB_PAGES = [
  { key: 'overview',     label: '기본현황',   icon: LayoutDashboard },
  { key: 'base_budget',  label: '기초예산',   icon: PieChart },
  { key: 'approval',     label: '품의하기',   icon: FileCheck },
  { key: 'expense',      label: '지출하기',   icon: TrendingDown },
  { key: 'income',       label: '입금전표',   icon: TrendingUp },
  { key: 'withdrawal',   label: '출금전표',   icon: ArrowUpCircle },
  { key: 'payment',      label: '전표장부',   icon: BookOpen },
  { key: 'cashflow_list', label: '입출금내역', icon: ArrowLeftRight },
  { key: 'reports',      label: '회계현황',   icon: ScrollText },
  { key: 'vendors',      label: '거래처관리',   icon: ContactRound },
  { key: 'methodReg',    label: '수단등록',   icon: CreditCard },
  { key: 'budgetTree',   label: '예산과목',   icon: Settings },
  { key: 'hq_vendor',    label: '본사거래처',   icon: Building2 },
  { key: 'acct_mgmt',    label: '계정관리',   icon: Settings2 },
]

/* ═══════════════════════════════════════════
   AccountingPage 메인
   ═══════════════════════════════════════════ */
export function AccountingPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeSub = searchParams.get('tab') || 'overview'
  const setActiveSub = (tab: string) => {
    const year = searchParams.get('year') || ''
    const params: Record<string, string> = { tab }
    if (year) params.year = year
    setSearchParams(params)
  }
  const currentYear = new Date().getFullYear()
  const year = parseInt(searchParams.get('year') || '') || parseInt(localStorage.getItem('acct_active_year') || '') || currentYear
  const selectedOverviewCatId = searchParams.get('cat') || null
  const [yearDropOpen, setYearDropOpen] = useState(false)
  const overviewCats = useMemo(() => getItem<BudgetCat[]>('acct_budget_cats', []).filter(c => {
    const cy = c.year || (c.periodFrom ? parseInt(c.periodFrom.substring(0,4)) : currentYear)
    return cy === year
  }), [year])

  useEffect(() => {
    // 서버에서 설정 로드 후 시드 초기화
    loadSettingsFromServer().finally(() => {
      initAccountingSeed()
    })
  }, [])

  // ── 권한 없는 탭 접근 시 리디렉트 ──
  useEffect(() => {
    const userName = JSON.parse(localStorage.getItem('ws_user') || '{}')?.name || ''
    const staffList = JSON.parse(localStorage.getItem('ws_users') || '[]') as any[]
    const currentStaff = staffList.find((s: any) => s.name === userName)
    const isAdmin = currentStaff?.role === 'admin'
    const budgetCats = JSON.parse(localStorage.getItem('acct_budget_cats') || '[]') as any[]
    const yearCats = budgetCats.filter((c: any) => {
      const catYear = c.year || (c.periodFrom ? parseInt(c.periodFrom.substring(0, 4)) : 0)
      return catYear === year
    })
    const isBudgetHandler = yearCats.some((c: any) =>
      (c.users && c.users.includes(userName)) ||
      (c.approvers && c.approvers.includes(userName)) ||
      (c.approver === userName)
    )
    const hasBudgetAccess = isAdmin || isBudgetHandler
    const allowedTabs = ['approval']
    if (!hasBudgetAccess && !allowedTabs.includes(activeSub)) {
      setActiveSub('approval')
    }
  }, [activeSub])

  return (
    <div className="animate-fadeIn">




      {/* ── 서브 페이지 렌더 ── */}
      {activeSub === 'overview' && <AcctOverview year={year} selectedCatId={selectedOverviewCatId === 'all' ? null : selectedOverviewCatId} />}
      {(activeSub === 'base_budget' || activeSub === 'budget' || activeSub === 'balance') && <AcctBaseBudget year={year} />}
      {activeSub === 'approval' && <AcctApproval year={year} />}
      {(activeSub === 'expense' || activeSub === 'income' || activeSub === 'withdrawal') && (
        <AcctVoucherEntry year={year} type={activeSub as 'expense' | 'income' | 'withdrawal'} catId={selectedOverviewCatId} />
      )}
      {activeSub === 'payment' && <AcctPaymentLedger year={year} catId={selectedOverviewCatId} />}
      {activeSub === 'cashflow_list' && <AcctCashflowList year={year} catId={selectedOverviewCatId} />}
      {activeSub === 'reports' && <AcctReports year={year} />}
      {activeSub === 'vendors' && <AcctVendors />}
      {activeSub === 'methodReg' && <AcctMethodReg catId={selectedOverviewCatId} />}
      {activeSub === 'hq_vendor' && <AcctHQVendor />}
      {activeSub === 'budgetTree' && <BudgetTreePanel />}
      {activeSub === 'acct_mgmt' && <AcctAccountsMgmt />}
      {!['overview','base_budget','budget','balance','approval','expense','income','withdrawal','payment','cashflow_list','reports','vendors','methodReg','hq_vendor','budgetTree','acct_mgmt'].includes(activeSub) && (
        <AcctSubPlaceholder
          pageKey={activeSub}
          label={SUB_PAGES.find(s => s.key === activeSub)?.label || ''}
        />
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════
   기본현황 (Overview)
   ═══════════════════════════════════════════ */

/* ═══════════════════════════════════════════
   기초예산 — 예산설정 + 기초잔액 통합 래퍼
   ═══════════════════════════════════════════ */

/* ═══════════════════════════════════════════
   예산설정 (Budget) — 레거시 매칭 CRUD
   ═══════════════════════════════════════════ */

/* ═══════════════════════════════════════════
   품의 (Approval) — CRUD
   ═══════════════════════════════════════════ */


/* ═══════════════════════════════════════════
   전표 입력 (지출/입금/출금) — CRUD
   ═══════════════════════════════════════════ */

/* ═══════════════════════════════════════════
   전표장부 (Payment Ledger) — CRUD
   ═══════════════════════════════════════════ */

/* ═══════════════════════════════════════════
   서브 페이지 플레이스홀더
   ═══════════════════════════════════════════ */
function AcctSubPlaceholder({ pageKey, label }: { pageKey: string; label: string }) {
  const descriptions: Record<string, string> = {
    budget: '예산구분별 연간 예산을 설정하고 소진 현황을 확인합니다',
    balance: '회계연도 초기 잔액을 설정합니다',
    approval: '품의서를 작성하고 결재 상태를 관리합니다',
    expense: '지출 전표를 등록하고 관리합니다',
    income: '입금 전표를 등록하고 관리합니다',
    withdrawal: '출금 전표를 등록하고 관리합니다',
    payment: '전체 전표 장부를 조회합니다',
    reports: '수입·지출 현황을 분석합니다',
  }

  const acctIcons: Record<string, React.ReactNode> = {
    budget: <Coins size={28} />, balance: <Landmark size={28} />, approval: <ClipboardList size={28} />, expense: <TrendingDown size={28} />,
    income: <TrendingUp size={28} />, withdrawal: <Banknote size={28} />, payment: <BookOpen size={28} />, reports: <BarChart2 size={28} />,
  }

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl py-16 text-center">
      <div className="mb-3 text-[var(--text-muted)] flex justify-center">{acctIcons[pageKey] || <Wrench size={28} />}</div>
      <p className="text-base font-bold text-[var(--text-primary)]">{label}</p>
      <p className="text-[12px] text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
        {descriptions[pageKey] || '이 기능은 준비 중입니다.'}
      </p>
      <p className="text-[11px] text-[var(--text-muted)] mt-4 bg-[var(--bg-muted)] inline-block px-4 py-1.5 rounded-full">
        Phase 4에서 구현 예정
      </p>
    </div>
  )
}

/* ═══════════════════════════════════════════
   거래처관리 — CRUD
   ═══════════════════════════════════════════ */
interface Vendor {
  id: number
  /* 기본정보 */
  name: string
  zipCode?: string
  address1?: string
  address2?: string
  phone?: string
  /* 연락처정보 */
  ceoName?: string
  ceoPhone?: string
  managerName?: string
  managerRole?: string
  managerPhone?: string
  managerEmail?: string
  managerId?: string
  managerPw?: string
  /* 사업자정보 */
  bizNo?: string
  bizType?: string
  bizCategory?: string
  invoiceEmail?: string
  bizRegImage?: string
  /* 비고 */
  memo?: string
  /* 예산구분 연결 */
  budgetCatId?: string
  /* 하위 호환 */
  address?: string
}

const EMPTY_VENDOR: Omit<Vendor, 'id'> = {
  name: '', zipCode: '', address1: '', address2: '', phone: '',
  ceoName: '', ceoPhone: '', managerName: '', managerRole: '', managerPhone: '', managerEmail: '', managerId: '', managerPw: '',
  bizNo: '', bizType: '', bizCategory: '', invoiceEmail: '', bizRegImage: '',
  memo: '', budgetCatId: '',
}

/* 섹션 헤더 */
function SectionHeader({ icon, title, color }: { icon: React.ReactNode; title: string; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-1">
      <span className="text-sm">{icon}</span>
      <span className="text-[12px] font-extrabold tracking-tight" style={{ color }}>{title}</span>
      <div className="flex-1 h-px bg-[var(--border-default)]" />
    </div>
  )
}

/* 필드 */
function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">
        {label}{required && ' *'}
      </label>
      {children}
    </div>
  )
}

const inputCls = "w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors"

/* 자동 하이픈 포맷터 */
function fmtPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.startsWith('02')) {
    if (d.length <= 2) return d
    if (d.length <= 6) return `${d.slice(0, 2)}-${d.slice(2)}`
    return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6)}`
  }
  if (d.length <= 3) return d
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`
}

function fmtBizNo(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 10)
  if (d.length <= 3) return d
  if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`
}

function VendorRow({ v, idx, onView, onEdit, onDelete }: { v: any; idx: number; onView: (v: any) => void; onEdit: (v: any) => void; onDelete: (id: number) => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <tr className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-muted)] transition-colors cursor-pointer" onClick={() => onView(v)}>
      <td className="px-4 py-3 text-center text-[12px] text-[var(--text-muted)]">{idx + 1}</td>
      <td className="px-4 py-3">
        <div className="font-bold text-[13px] text-[var(--text-primary)]">{v.name}</div>
        {v.bizNo && <div className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">{v.bizNo}</div>}
      </td>
      <td className="px-4 py-3 text-[13px] text-[var(--text-primary)]">{v.ceoName || '-'}</td>
      <td className="px-4 py-3">
        {v.phone && <div className="text-[12px] text-[var(--text-primary)]">{v.phone}</div>}
        {v.managerName && <div className="text-[11px] text-[var(--text-muted)] mt-0.5">담당: {v.managerName}</div>}
      </td>
      <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
        <div className="relative inline-block">
          <button onClick={e => { e.stopPropagation(); setMenuOpen(o => !o) }} className="p-1.5 rounded-lg hover:bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer transition-colors">
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-xl py-1 min-w-[100px]">
                <button onClick={() => { setMenuOpen(false); onEdit(v) }} className="flex items-center gap-2 w-full px-3 py-2 text-[12px] text-[var(--text-primary)] hover:bg-[var(--bg-muted)] cursor-pointer">
                  <Edit3 size={12} /> 수정
                </button>
                <button onClick={() => { setMenuOpen(false); onDelete(v.id) }} className="flex items-center gap-2 w-full px-3 py-2 text-[12px] text-danger hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer">
                  <Trash2 size={12} /> 삭제
                </button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}

/* ═══════════════════════════════════════════
   계정관리 (AcctAccountsMgmt)
   ═══════════════════════════════════════════ */


/* ═══════════════════════════════════════════
   본사거래처 (AcctHQVendor) - 리스트 + 모달
   ═══════════════════════════════════════════ */
interface HQV { id: number; company: string; ceo: string; ceoPhone: string; bizPhone: string; bizNo: string; bizType: string; bizItem: string; taxEmail: string; zip: string; addr1: string; addr2: string; mgrName: string; mgrTitle: string; mgrMobile: string; mgrEmail: string; mgrId: string; mgrPw: string; bizDocImg: string; solutions: { key: string; label: string; enabled: boolean; qty?: number }[]; billings: { period: string; total: string; status: string }[]; totalBill: number; unpaid: number; memo: string }

const HQ_BILLINGS_1 = [{period:'2026.05.01~',mgmt:'150,000',db:'250,000',data:'523,221',fee:'595,000',total:'1,518,221',status:'과금중'},{period:'2026.03.01-2026.03.31',mgmt:'200,000',db:'250,000',data:'49,800',fee:'480,000',total:'979,800',status:'청구'},{period:'2026.02.01-2026.02.28',mgmt:'200,000',db:'280,000',data:'52,100',fee:'520,000',total:'1,052,100',status:'납부'},{period:'2026.01.01-2026.01.31',mgmt:'200,000',db:'250,000',data:'48,200',fee:'500,000',total:'998,200',status:'납부'}]
const HQ_BILLINGS_2 = [{period:'2026.05.01~',mgmt:'150,000',db:'250,000',data:'523,221',fee:'595,000',total:'1,518,221',status:'과금중'},{period:'2026.03.01-2026.03.31',mgmt:'200,000',db:'250,000',data:'49,800',fee:'480,000',total:'979,800',status:'청구'},{period:'2026.02.01-2026.02.28',mgmt:'200,000',db:'280,000',data:'52,100',fee:'520,000',total:'1,052,100',status:'납부'},{period:'2026.01.01-2026.01.31',mgmt:'200,000',db:'250,000',data:'48,200',fee:'500,000',total:'998,200',status:'납부'}]
const HQ_BILLINGS_3 = [{period:'2026.05.01~',mgmt:'200,000',db:'300,000',data:'623,221',fee:'700,000',total:'1,823,221',status:'과금중'},{period:'2026.03.01-2026.03.31',mgmt:'200,000',db:'250,000',data:'49,800',fee:'480,000',total:'979,800',status:'청구'},{period:'2026.02.01-2026.02.28',mgmt:'200,000',db:'280,000',data:'52,100',fee:'520,000',total:'1,052,100',status:'납부'},{period:'2026.01.01-2026.01.31',mgmt:'200,000',db:'250,000',data:'48,200',fee:'500,000',total:'998,200',status:'납부'}]

const HQ_SEED: HQV[] = [
  { id:1, company:'(주)한국솔루션', ceo:'김대표', ceoPhone:'010-1234-5678', bizPhone:'02-1234-5678', bizNo:'123-45-67890', bizType:'서비스', bizItem:'소프트웨어', taxEmail:'tax@ksol.co.kr', zip:'06134', addr1:'서울특별시 강남구 테헤란로 152', addr2:'강남파이낸스센터 3층', mgrName:'이지훈', mgrTitle:'팀장', mgrMobile:'010-1111-2222', mgrEmail:'lee@ksol.co.kr', mgrId:'system_id', mgrPw:'***', bizDocImg:'', solutions:[{key:'workm',label:'워크맵',enabled:true},{key:'homepage',label:'홈페이지',enabled:true,qty:1},{key:'fabric',label:'원단공급사',enabled:true},{key:'mfg',label:'제조공급사',enabled:false},{key:'dist',label:'유통판매서',enabled:false},{key:'franchise',label:'가맹대리점',enabled:false},{key:'food',label:'식재대리점',enabled:false}], billings:HQ_BILLINGS_1, totalBill:1590721, unpaid:979800, memo:'' },
  { id:2, company:'대명테크(주)', ceo:'박사장', ceoPhone:'010-3333-4444', bizPhone:'02-9878-5432', bizNo:'234-55-78901', bizType:'제조', bizItem:'전자부품', taxEmail:'bill@dmtech.kr', zip:'08500', addr1:'서울특별시 금천구 가산디지털로 123', addr2:'대명빌딩 5층', mgrName:'최수민', mgrTitle:'과장', mgrMobile:'010-5555-6666', mgrEmail:'choi@dmtech.kr', mgrId:'dm_admin', mgrPw:'***', bizDocImg:'', solutions:[{key:'workm',label:'워크맵',enabled:true},{key:'homepage',label:'홈페이지',enabled:false},{key:'fabric',label:'원단공급사',enabled:false},{key:'mfg',label:'제조공급사',enabled:false},{key:'dist',label:'유통판매서',enabled:false},{key:'franchise',label:'가맹대리점',enabled:false},{key:'food',label:'식재대리점',enabled:false}], billings:HQ_BILLINGS_2, totalBill:1518221, unpaid:979800, memo:'' },
  { id:3, company:'서울유통(주)', ceo:'정회장', ceoPhone:'010-7777-8888', bizPhone:'02-5555-6666', bizNo:'345-67-89012', bizType:'도매', bizItem:'생활용품', taxEmail:'tax@seouldt.com', zip:'04100', addr1:'서울특별시 중구 세종대로 110', addr2:'2층 203호', mgrName:'강민아', mgrTitle:'대리', mgrMobile:'010-9999-0000', mgrEmail:'kang@seouldt.com', mgrId:'seoul_mgr', mgrPw:'***', bizDocImg:'', solutions:[{key:'workm',label:'워크맵',enabled:true},{key:'homepage',label:'홈페이지',enabled:false},{key:'fabric',label:'원단공급사',enabled:false},{key:'mfg',label:'제조공급사',enabled:false},{key:'dist',label:'유통판매서',enabled:true},{key:'franchise',label:'가맹대리점',enabled:true},{key:'food',label:'식재대리점',enabled:false}], billings:HQ_BILLINGS_3, totalBill:1823221, unpaid:979800, memo:'' },
]

/* ═══════════════════════════════════════════
   지출수단 관리 (카테고리별)
   ═══════════════════════════════════════════ */
interface PayMethodCard {
  id: number
  cardName: string
  cardCompany: string
  cardNumber: string
  cardType: '체크카드' | '신용카드'
  cardUser: string
  expiryDate?: string
  cardLimit?: number
  memo?: string
}

interface PayMethodNote {
  id: number
  noteNumber: string
  issuer: string
  receiver: string
  amount: number
  issueDate: string
  maturityDate: string
  endorsement: string
  bank: string
  status: '미결제' | '추심중' | '결제완료' | '부도'
  memo?: string
}

interface PayMethodItem {
  id: number
  name: string
  category: '계좌' | '현금' | '어음' | '상품권'
  budgetCatId?: string | number  // 예산구분 연결
  // 계좌 상세
  bankName?: string
  accountNumber?: string
  accountHolder?: string
  manager?: string
  purpose?: string
  memo?: string
  cards?: PayMethodCard[]
  initialBalance?: number  // 기초잔액
  // 현금 상세
  storageLocation?: string
  custodian?: string
  cashLimit?: number
  // 어음 상세
  noteType?: '수신' | '발행'
  noteBank?: string
  noteManager?: string
  defaultMaturity?: string
  noteLimit?: number
  notes?: PayMethodNote[]
  // 상품권 상세
  voucherAmount?: number
  voucherQty?: number
  voucherStorage?: string
  voucherManager?: string
}

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
  { id: 11, name: '수표', category: '어음' },
  { id: 8, name: '문화상품권', category: '상품권' },
  { id: 9, name: '백화점상품권', category: '상품권' },
  { id: 10, name: '온누리상품권', category: '상품권' },
]

// build-force-v7

/* ═══ 입금계정 관리 ═══ */
const INCOME_CATEGORIES = [
  { key: '계좌' as const, label: '계좌', Icon: Landmark, color: '#3b82f6', bg: 'bg-blue-50 dark:bg-blue-900/10', border: 'border-blue-200 dark:border-blue-800', desc: '계좌입금, 자동이체 수신 등' },
  { key: '현금' as const, label: '현금', Icon: Coins, color: '#22c55e', bg: 'bg-emerald-50 dark:bg-emerald-900/10', border: 'border-emerald-200 dark:border-emerald-800', desc: '현금 수입, 현장 수납 등' },
  { key: '어음' as const, label: '어음', Icon: FileText, color: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/10', border: 'border-amber-200 dark:border-amber-800', desc: '수신어음, 수표 등' },
  { key: '상품권' as const, label: '상품권', Icon: Ticket, color: '#8b5cf6', bg: 'bg-violet-50 dark:bg-violet-900/10', border: 'border-violet-200 dark:border-violet-800', desc: '상품권 수입 등' },
]

/* ═══════════════════════════════════════════
   입출금내역 (CashFlow List)
   ═══════════════════════════════════════════ */
