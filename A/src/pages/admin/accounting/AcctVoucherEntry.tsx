import React, { useState, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { getItem, setItem } from '../../../utils/storage'
import { formatNumber } from '../../../utils/format'
import { useToastStore } from '../../../stores/toastStore'
import { saveAttachmentImage, deleteAttachmentImage } from '../../../utils/attachmentDB'
import { PrintApprovalForm } from '../../../components/accounting/PrintApprovalForm'
import type { BudgetCat, BudgetItem, BudgetItemDef, CashFlow, Approval, Voucher, PayMethodItem } from './types'
import { getLocalDate, getLocalISOString, uid } from './utils'
import { Wallet, ArrowDownCircle, ArrowUpCircle, ScrollText, Clock, ChevronDown, Trash2, Save, X, Check, ShieldCheck, RefreshCw, Paperclip, Eye, ArrowLeftRight } from 'lucide-react'
import { cn } from '../../../utils/cn'
import { EmptyState } from '../../../components/common/EmptyState'
import { DatePicker } from '../../../components/ui/DatePicker'
import { CustomSelect } from '../../../components/ui/CustomSelect'
import { useAuthStore } from '../../../stores/authStore'
import { useStaffStore } from '../../../stores/staffStore'

export default function AcctVoucherEntry({ year, type, catId }: { year: number; type: 'expense' | 'income' | 'withdrawal'; catId?: string | null }) {
  const [refresh, setRefresh] = useState(0)
  const [expenseTab, setExpenseTab] = useState<'waiting' | 'history'>('waiting')
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const typeLabels = { expense: '지출하기', income: '입금전표', withdrawal: '출금전표' }
  const typeEmojis = { expense: '💸', income: '💵', withdrawal: '🏧' }
  const typeColors = { expense: '#ef4444', income: '#22c55e', withdrawal: '#f59e0b' }
  const typeGrads = { expense: 'from-[#ef4444] to-[#dc2626]', income: 'from-[#22c55e] to-[#16a34a]', withdrawal: 'from-[#f59e0b] to-[#d97706]' }

  const today = getLocalDate()
  const currentUser = useAuthStore(s => s.user)
  const currentUserName = currentUser?.name || (() => { try { const u = JSON.parse(localStorage.getItem('ws_user') || '{}'); return u?.name } catch { return '' } })() || 'admin'
  const [form, setForm] = useState({ desc: '', subItem: '', detailItem: '', amount: '', counter: '', method: type === 'income' ? '계좌이체' : '계좌이체', writeDate: today, tradeDate: today, inputDate: today, manager: '', expenseManager: '', approvalStatus: '품의준비' })
  const [wdAttachments, setWdAttachments] = useState<{name:string; data:string; size:number; title:string; printWidth:number; row?:number}[]>([])
  const [wdEvidenceOpen, setWdEvidenceOpen] = useState(false)
  const [wdEvidenceEdit, setWdEvidenceEdit] = useState(true)
  const [withdrawalMode, setWithdrawalMode] = useState<'withdrawal' | 'transfer'>('withdrawal')

  const [transferForm, setTransferForm] = useState({ debit: '', debitDetail: '', credit: '', creditDetail: '', amount: '', tradeDate: today, description: '', memo: '', reason: '' })
  const [transferAttachments, setTransferAttachments] = useState<{name:string; data:string; size:number; title:string; printWidth:number; row?:number}[]>([])
  const [transferEvidenceOpen, setTransferEvidenceOpen] = useState(false)
  const [transferEvidenceEdit, setTransferEvidenceEdit] = useState(true)
  const staffList = useStaffStore(s => s.staff).filter(s => !s.resignedAt)
  const [counterSearch, setCounterSearch] = useState('')
  const [showCounterList, setShowCounterList] = useState(false)
  const counterRef = useRef<HTMLDivElement>(null)
  const [descMode, setDescMode] = useState<'select' | 'input'>('select')
  const [isFromApproval, setIsFromApproval] = useState(false)
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null)
  const [approvalMeta, setApprovalMeta] = useState<{approver:string; requestDate:string; approvedDate:string; budgetCatName:string; accountCode:string; budgetCatId?:string}>({approver:'',requestDate:'',approvedDate:'',budgetCatName:'',accountCode:''})
  const [selectedBudgetCat, setSelectedBudgetCat] = useState('')
  const allTransferCategories = ['현금', '상품권', '어음', '계좌'] as const
  const allPayMethodsRaw: any[] = (() => { try { return JSON.parse(localStorage.getItem('acct_pay_methods_v2') || '[]') } catch { return [] } })()
  const transferPayMethods: any[] = selectedBudgetCat
    ? allPayMethodsRaw.filter(p => String(p.budgetCatId || '') === String(selectedBudgetCat))
    : allPayMethodsRaw
  const transferAccounts = (() => {
    return allTransferCategories.filter(cat => transferPayMethods.some(p => p.category === cat))
  })()
  const [wdBudgetItem, setWdBudgetItem] = useState('')
  const [wdCatName, setWdCatName] = useState('')
  // 출금전표 통합 검색
  const [wdSearchText, setWdSearchText] = useState('')
  const [wdSearchFocused, setWdSearchFocused] = useState(false)
  const [wdSearchSelected, setWdSearchSelected] = useState('')
  const [isReceivable, setIsReceivable] = useState(false)
  const [isPayable, setIsPayable] = useState(false)
  const [expectedDate, setExpectedDate] = useState('')

  const user = useAuthStore(s => s.user)

  /* 예산 카테고리 목록 (해당 연도 + 예산승인자/지출담당자 필터) */
  const expBudgetCats = useMemo(() => {
    const cats: BudgetCat[] = getItem('acct_budget_cats', [])
    const yearCats = cats.filter(c => {
      const pFrom = c.periodFrom || ''
      const pTo = c.periodTo || ''
      if (pFrom && pTo) {
        const yearStart = `${year}-01-01`
        const yearEnd = `${year}-12-31`
        return pFrom <= yearEnd && pTo >= yearStart
      }
      const cy = c.year || (pFrom ? parseInt(pFrom.substring(0, 4)) : year)
      return cy === year
    })
    // 예산승인자(approverType=approver)인지 확인
    const userName = user?.name || ''
    const staffList = getItem<any[]>('ws_users', [])
    const currentStaff = staffList.find(s => s.name === userName)
    const isBudgetApprover = currentStaff?.approverType === 'approver'
    
    // 예산승인자는 모든 예산구분 표시
    if (isBudgetApprover) return yearCats
    
    // 일반 사용자: 지출담당자/승인담당자로 지정된 카테고리만
    if (userName) {
      return yearCats.filter(c =>
        (c.users && c.users.length > 0 && c.users.includes(userName)) ||
        ((c as any).approvers && (c as any).approvers.length > 0 && (c as any).approvers.includes(userName))
      )
    }
    return yearCats
  }, [refresh, year, type, user])

  /* 계정과목 목록 */
  const acctAccounts = useMemo(() => getItem<{ code: string; name: string; type: string }[]>('acct_accounts', []), [refresh])

  /* 상단 예산선택 탭 변경 시 폼 동기화 */
  useEffect(() => {
    if (catId && catId !== 'all') {
      setSelectedBudgetCat(catId)
      setWdBudgetItem('')
      setForm(f => ({ ...f, subItem: '', amount: '' }))
      const cats: BudgetCat[] = getItem('acct_budget_cats', [])
      const cat = cats.find(c => String(c.id) === String(catId))
      setWdCatName(cat?.name || '')
    } else {
      setSelectedBudgetCat('')
      setWdBudgetItem('')
      setWdCatName('')
      setForm(f => ({ ...f, subItem: '', amount: '' }))
    }
  }, [catId])

  /* 예산 항목 (선택된 카테고리 기준) */
  const budgetItems = useMemo(() => {
    const budgets: BudgetItem[] = getItem('acct_budgets', [])
    if (selectedBudgetCat) {
      return budgets.filter(b => String(b.catId) === String(selectedBudgetCat))
    }
    const cats: BudgetCat[] = getItem('acct_budget_cats', [])
    const userName = user?.name || ''
    const allowedCatIds = new Set(
      cats.filter(c => c.users && c.users.length > 0 && c.users.includes(userName)).map(c => String(c.id))
    )
    return budgets.filter(b => allowedCatIds.has(String(b.catId)))
  }, [refresh, user, selectedBudgetCat])

  const budgetItemNames = useMemo(() => {
    const hist: string[] = getItem('acct_itemName_history', [])
    return Array.from(new Set([
      ...budgetItems.map(b => b.itemName).filter(Boolean),
      ...hist.filter(Boolean),
    ])).sort()
  }, [budgetItems])

  /* 출금전표용: 선택된 카테고리 내 실제 예산항목만 */
  const wdBudgetItemNames = useMemo(() => {
    if (!selectedBudgetCat) return [] as string[]
    const budgets: BudgetItem[] = getItem('acct_budgets', [])
    const filtered = budgets.filter(b => String(b.catId) === String(selectedBudgetCat))
    return Array.from(new Set(filtered.map(b => b.itemName).filter(Boolean))).sort()
  }, [selectedBudgetCat, refresh])

  /* 출금전표용: 선택된 예산항목의 세목 (budgetItemDefs 우선, 없으면 실제 데이터) */
  const wdSubItemNames = useMemo(() => {
    if (!wdBudgetItem || !selectedBudgetCat) return [] as string[]
    // budgetItemDefs에서 세목 정의 가져오기
    const defs: BudgetItemDef[] = getItem('acct_budget_item_defs', [])
    const def = defs.find(d => d.name === wdBudgetItem || d.aliases?.includes(wdBudgetItem))
    if (def && def.subItems && def.subItems.length > 0) {
      return def.subItems.sort((a, b) => a.sortOrder - b.sortOrder).map(s => s.name)
    }
    // 정의가 없으면 실제 데이터에서 추출
    const budgets: BudgetItem[] = getItem('acct_budgets', [])
    const filtered = budgets.filter(b =>
      String(b.catId) === String(selectedBudgetCat) && b.itemName === wdBudgetItem
    )
    return Array.from(new Set(filtered.map(b => b.subItemName).filter(Boolean))).sort() as string[]
  }, [wdBudgetItem, selectedBudgetCat, refresh])

  /* 출금전표용: BudgetItemDef 기반 세세항목 */
  const wdVoucherItemDefs = useMemo(() => getItem<BudgetItemDef[]>('acct_budget_item_defs', []).sort((a, b) => a.sortOrder - b.sortOrder), [refresh])
  const wdSelectedDef = useMemo(() => wdVoucherItemDefs.find(d => d.name === wdBudgetItem), [wdVoucherItemDefs, wdBudgetItem])
  const wdSelectedSub = useMemo(() => wdSelectedDef?.subItems.find(s => s.name === form.subItem), [wdSelectedDef, form.subItem])
  const wdDetailItems = useMemo(() => (wdSelectedSub?.detailItems || []).sort((a, b) => a.sortOrder - b.sortOrder), [wdSelectedSub])

  // ── 출금전표 통합 검색용 플랫 리스트 ──
  const wdBudgetFlatList = useMemo(() => {
    const acctList: { code: string; name: string }[] = getItem('acct_accounts', [])
    const allBudgets: BudgetItem[] = getItem('acct_budgets', [])
    const defs: BudgetItemDef[] = getItem('acct_budget_item_defs', [])
    const allCats: BudgetCat[] = getItem('acct_budget_cats', [])
    const yearCats = allCats.filter(c => {
      const pFrom = c.periodFrom || ''
      const pTo = c.periodTo || ''
      if (pFrom && pTo) {
        return pFrom <= `${year}-12-31` && pTo >= `${year}-01-01`
      }
      return (c.year || year) === year
    })
    const result: { catId: string; catName: string; itemName: string; subName?: string; detailName?: string; accountCode?: string; accountName?: string; aliases: string; path: string; amount: number; spent: number; remaining: number }[] = []
    yearCats.forEach(cat => {
      const catItems = allBudgets.filter(b => String(b.catId) === String(cat.id))
      const itemGroups = new Map<string, BudgetItem[]>()
      catItems.forEach(b => { const a = itemGroups.get(b.itemName) || []; a.push(b); itemGroups.set(b.itemName, a) })
      itemGroups.forEach((items, itemName) => {
        const def = defs.find(d => d.name === itemName || d.aliases?.includes(itemName))
        if (def && def.subItems && def.subItems.length > 0) {
          def.subItems.forEach(sub => {
            const subAcct = sub.accountCode ? acctList.find(a => a.code === sub.accountCode) : null
            if (sub.detailItems && sub.detailItems.length > 0) {
              sub.detailItems.forEach(det => {
                const db = items.find(b => b.subItemName === sub.name && b.detailItemName === det.name)
                const amt = db?.amount || 0, sp = db?.spent || 0
                const detAcct = det.accountCode ? acctList.find(a => a.code === det.accountCode) : subAcct
                result.push({ catId: String(cat.id), catName: cat.name, itemName, subName: sub.name, detailName: det.name, accountCode: det.accountCode || sub.accountCode, accountName: detAcct?.name || '', aliases: [...(def?.aliases||[]),...(sub.aliases||[]),...(det.aliases||[])].join(' '), path: `${cat.name} > ${itemName} > ${sub.name} > ${det.name}`, amount: amt, spent: sp, remaining: amt - sp })
              })
            } else {
              const sbs = items.filter(b => b.subItemName === sub.name)
              const amt = sbs.reduce((s,b) => s+(b.amount||0),0), sp = sbs.reduce((s,b) => s+(b.spent||0),0)
              result.push({ catId: String(cat.id), catName: cat.name, itemName, subName: sub.name, accountCode: sub.accountCode, accountName: subAcct?.name || '', aliases: [...(def?.aliases||[]),...(sub.aliases||[])].join(' '), path: `${cat.name} > ${itemName} > ${sub.name}`, amount: amt, spent: sp, remaining: amt - sp })
            }
          })
        } else {
          const amt = items.reduce((s,b) => s+(b.amount||0),0), sp = items.reduce((s,b) => s+(b.spent||0),0)
          const defAcct = def?.defaultAccountCode ? acctList.find(a => a.code === def.defaultAccountCode) : null
          result.push({ catId: String(cat.id), catName: cat.name, itemName, accountCode: def?.defaultAccountCode, accountName: defAcct?.name || '', aliases: (def?.aliases||[]).join(' '), path: `${cat.name} > ${itemName}`, amount: amt, spent: sp, remaining: amt - sp })
        }
      })
    })
    return result
  }, [year, refresh])

  const wdSearchResults = useMemo(() => {
    const q = wdSearchText.trim().toLowerCase()
    if (!q) return []
    return wdBudgetFlatList.filter(r => r.path.toLowerCase().includes(q) || (r.accountCode && r.accountCode.includes(q)) || (r.accountName && r.accountName.toLowerCase().includes(q)) || (r.aliases && r.aliases.toLowerCase().includes(q))).slice(0, 10)
  }, [wdSearchText, wdBudgetFlatList])

  /* 예산세목 (지출하기용: 선택된 예산목에 해당하는 세목 목록) */
  const subItemNames = useMemo(() => {
    if (!form.desc) return []
    // budgetItemDefs에서 세목 정의 가져오기
    const defs: BudgetItemDef[] = getItem('acct_budget_item_defs', [])
    const def = defs.find(d => d.name === form.desc || d.aliases?.includes(form.desc))
    if (def && def.subItems && def.subItems.length > 0) {
      return def.subItems.sort((a, b) => a.sortOrder - b.sortOrder).map(s => s.name)
    }
    // 정의가 없으면 실제 데이터에서 추출
    return Array.from(new Set(
      budgetItems.filter(b => b.itemName === form.desc).map(b => b.subItemName).filter(Boolean)
    )).sort() as string[]
  }, [form.desc, budgetItems])

  /* 거래처 리스트 (거래처관리 연동) */
  const vendorOptions = useMemo(() => {
    const vendors: Vendor[] = getItem('acct_vendors', [])
    const cats: BudgetCat[] = getItem('acct_budget_cats', [])
    return vendors.map(v => {
      const cat = v.budgetCatId ? cats.find(c => String(c.id) === String(v.budgetCatId)) : null
      return { value: v.name, label: v.name, budgetCatId: v.budgetCatId || '', catName: cat?.name || '' }
    })
  }, [refresh])

  /* 거래처 드롭다운 외부 클릭 닫기 */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (counterRef.current && !counterRef.current.contains(e.target as Node)) setShowCounterList(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const cashflows = useMemo(() => {
    const all = getItem<CashFlow[]>('acct_cashflows', [])
    // 사용자 관련 예산 카테고리 ID
    const userName = user?.name || ''
    const staffListData = getItem<any[]>('ws_users', [])
    const curStaff = staffListData.find(s => s.name === userName)
    const isApprover = curStaff?.approverType === 'approver'
    const cats: BudgetCat[] = getItem('acct_budget_cats', [])
    const myCatIds = isApprover
      ? null // 승인권자는 모두 표시
      : cats.filter(c =>
          (c.users && c.users.includes(userName)) ||
          ((c as any).approvers && (c as any).approvers.includes(userName))
        ).map(c => String(c.id))

    return all.filter(c => {
      if (!c.date) return false
      if (parseInt(c.date.substring(0, 4)) !== year) return false
      if (!(c.type === type || (type === 'withdrawal' && (c.type === 'expense' || c.type === 'transfer' as any)))) return false
      // 모든 전표: 내가 작성한 것만 표시 (승인권자는 전체)
      if (!isApprover) {
        // 출금전표: 해당 예산의 담당자(users)는 모든 건 표시
        if (type === 'withdrawal') {
          const cfCatId = String((c as any).budgetCatId || '')
          const isBudgetHandler = cfCatId && cats.some(ct => String(ct.id) === cfCatId && ct.users && ct.users.includes(userName))
          if (isBudgetHandler) { /* 예산 담당자는 통과 */ }
          else {
            const cfCreator = (c as any).createdBy || ''
            const cfManager = (c as any).manager || ''
            if (cfCreator && cfCreator !== userName && cfManager !== userName) return false
            if (!cfCreator && cfManager && cfManager !== userName) return false
          }
        } else {
          const cfCreator = (c as any).createdBy || ''
          const cfManager = (c as any).manager || ''
          // createdBy 또는 manager가 나와 일치하는 경우만 표시
          if (cfCreator && cfCreator !== userName && cfManager !== userName) return false
          if (!cfCreator && cfManager && cfManager !== userName) return false
        }
      }
      // 관련 예산 필터
      if (myCatIds !== null) {
        const cfCatId = String((c as any).budgetCatId || '')
        if (cfCatId && myCatIds.length > 0) return myCatIds.includes(cfCatId)
        // catId 없으면 catName으로 매칭
        if ((c as any).budgetCatName) {
          const matchCat = cats.find(ct => ct.name === (c as any).budgetCatName)
          if (matchCat) return myCatIds.includes(String(matchCat.id))
        }
        // 매칭 안되면 표시 안함 (비관련자)
        if (myCatIds.length === 0) return false
      }
      // 상단 필터에서 선택된 예산구분이 있을 경우 필터링
      if (selectedBudgetCat && selectedBudgetCat !== 'all') {
        const cfCatId = String((c as any).budgetCatId || '')
        if (cfCatId) {
          if (cfCatId !== String(selectedBudgetCat)) return false
        } else if ((c as any).budgetCatName) {
          const matchCat = cats.find(ct => ct.name === (c as any).budgetCatName)
          if (matchCat && String(matchCat.id) !== String(selectedBudgetCat)) return false
          if (!matchCat) return false
        } else {
          return false
        }
      }

      return true
    }).sort((a, b) => (b.date || '').localeCompare(a.date || '') || Number(b.id) - Number(a.id))
  }, [year, type, refresh, user, selectedBudgetCat])

  const totalAmount = cashflows.reduce((a, c) => a + (c.amount || 0), 0)

  const handleAmtInput = (val: string) => {
    const digits = val.replace(/[^\d]/g, '')
    setForm(f => ({ ...f, amount: digits ? Number(digits).toLocaleString('ko-KR') : '' }))
  }

  const uid = () => Date.now() + Math.floor(Math.random() * 1000)

  const saveEntry = () => {
    // 대체전표 저장
    if (type === 'withdrawal' && withdrawalMode === 'transfer') {
      if (!transferForm.debit) { alert('차변(받는쪽)을 선택하세요'); return }
      if (!transferForm.credit) { alert('대변(보내는쪽)을 선택하세요'); return }
      if (transferForm.debit === transferForm.credit) { alert('차변과 대변이 같을 수 없습니다'); return }
      if (!selectedBudgetCat) { alert('예산을 선택하세요'); return }
      const tAmt = parseInt(transferForm.amount.replace(/,/g, '')) || 0
      if (tAmt <= 0) { alert('금액을 입력하세요'); return }
      if (!transferForm.description.trim()) { alert('적요를 입력하세요'); return }
      const tId = uid()
      const vId = uid()
      const acctMap: Record<string, string> = { '현금': '1010', '계좌': '1020', '상품권': '1030', '어음': '1040' }
      const vouchers = getItem<Voucher[]>('acct_vouchers', [])
      vouchers.push({
        id: vId, date: transferForm.tradeDate, type: 'transfer',
        description: `${transferForm.credit} → ${transferForm.debit}`,
        entries: [
          { side: 'debit', accountCode: acctMap[transferForm.debit] || '1010', amount: tAmt },
          { side: 'credit', accountCode: acctMap[transferForm.credit] || '1020', amount: tAmt },
        ],
        createdAt: getLocalISOString(),
      })
      setItem('acct_vouchers', vouchers)
      const debitLabel = transferForm.debitDetail ? `${transferForm.debit}(${transferForm.debitDetail})` : transferForm.debit
      const creditLabel = transferForm.creditDetail ? `${transferForm.credit}(${transferForm.creditDetail})` : transferForm.credit
      const cfs = getItem<CashFlow[]>('acct_cashflows', [])
      cfs.push({
        id: tId, date: transferForm.tradeDate, type: 'transfer' as any,
        amount: tAmt, description: transferForm.description,
        accountCode: acctMap[transferForm.debit] || '1010',
        counter: `${creditLabel} → ${debitLabel}`,
        writeDate: today,
        debitAccount: transferForm.debit,
        debitDetail: transferForm.debitDetail,
        creditAccount: transferForm.credit,
        creditDetail: transferForm.creditDetail,
        memo: transferForm.memo,
        manager: currentUserName,
        createdBy: currentUserName,
      } as any)
      setItem('acct_cashflows', cfs)
      // 대체결의서(품의) 자동 생성
      const approvals = getItem<Approval[]>('acct_approvals', [])
      const budgetCats: BudgetCat[] = getItem('acct_budget_cats', [])
      // 승인권자 자동 설정
      let autoApprover = ''
      const staffData = getItem<any[]>('ws_users', [])
      // 예산구분에서 승인권자 찾기
      for (const cat of budgetCats) {
        if ((cat as any).approvers?.length > 0) { autoApprover = (cat as any).approvers[0]; break }
      }
      if (!autoApprover) {
        const approverStaff = staffData.find(s => s.approverType === 'approver')
        if (approverStaff) autoApprover = approverStaff.name
      }
      const preApprovalId = uid()
      approvals.push({
        id: preApprovalId,
        status: 'preExpense',
        isPreExpense: true,
        selfExpense: true,
        title: `[대체] ${transferForm.description || (creditLabel + ' → ' + debitLabel)}`,
        amount: tAmt,
        date: transferForm.tradeDate,
        createdAt: getLocalISOString(),
        accountCode: '',
        description: transferForm.reason || `대체전표 - ${creditLabel} → ${debitLabel}`,
        applicant: currentUserName,
        approver: autoApprover,
        budgetItem: '',
        budgetSubItem: '',
        budgetCatId: selectedBudgetCat || '',
        budgetCatName: (() => { const cat = budgetCats.find(c => String(c.id) === String(selectedBudgetCat)); return cat?.name || '' })(),
        transferType: true,
        debitAccount: transferForm.debit,
        debitDetail: transferForm.debitDetail,
        creditAccount: transferForm.credit,
        creditDetail: transferForm.creditDetail,
        attachments: transferAttachments.length > 0 ? transferAttachments.map(a => ({ name: a.name, type: a.data?.startsWith('data:image') ? 'image/jpeg' : 'application/octet-stream', dataUrl: a.data, title: a.title, printWidth: a.printWidth, row: a.row })) : undefined,
      } as any)
      setItem('acct_approvals', approvals)
      // cashflow에 approvalId 연결
      const allCfs2 = getItem<CashFlow[]>('acct_cashflows', [])
      const cfIdx2 = allCfs2.findIndex(x => String(x.id) === String(tId))
      if (cfIdx2 >= 0) { (allCfs2[cfIdx2] as any).approvalId = String(preApprovalId); setItem('acct_cashflows', allCfs2) }
      setTransferForm({ debit: '', debitDetail: '', credit: '', creditDetail: '', amount: '', tradeDate: today, description: '', memo: '', reason: '' })
      setTransferAttachments([])
      setRefresh(r => r + 1)
      return
    }
    if (!form.desc.trim()) { alert('내용을 입력하세요'); return }
    const amt = parseInt(form.amount.replace(/,/g, '')) || 0
    if (amt <= 0) { alert('금액을 입력하세요'); return }
    // 입금/출금전표: 예산구분 필수
    if ((type === 'income' || type === 'withdrawal') && !selectedBudgetCat) { alert('예산구분을 선택하세요'); return }

    const cfId = uid()
    const vId = uid()

    // 전표 자동 생성
    const vouchers = getItem<Voucher[]>('acct_vouchers', [])
    let vEntries: { side: string; accountCode: string; amount: number }[]
    if (type === 'income') {
      const debitAcct = form.method === '현금' ? '1010' : '1020'
      vEntries = [
        { side: 'debit', accountCode: debitAcct, amount: amt },
        { side: 'credit', accountCode: '4030', amount: amt },
      ]
    } else {
      vEntries = [
        { side: 'debit', accountCode: '5110', amount: amt },
        { side: 'credit', accountCode: form.method === '현금' ? '1010' : '1020', amount: amt },
      ]
    }
    vouchers.push({
      id: vId, date: form.tradeDate, type: type,
      description: form.desc, entries: vEntries,
      budgetCatId: selectedBudgetCat || '',
      createdAt: getLocalISOString(),
    } as any)
    setItem('acct_vouchers', vouchers)

    // 캐시플로 등록 — payMethod/payDetail 분리 저장
    const methodVal = form.method || ''
    let payMethod = ''
    let payDetail = ''
    if (methodVal.startsWith('계좌:')) { payMethod = '계좌'; payDetail = methodVal.split(':')[1] || '' }
    else if (methodVal.startsWith('카드:')) { payMethod = '카드'; payDetail = methodVal.split(':')[1] || '' }
    else if (methodVal.startsWith('어음:')) { payMethod = '어음'; payDetail = methodVal.split(':').slice(1).join(':') }
    else if (type === 'income') { payMethod = methodVal; payDetail = '' }
    else {
      // 현금/상품권 등 — payItems에서 카테고리 조회
      const _allPI: PayMethodItem[] = (() => { try { return JSON.parse(localStorage.getItem('acct_pay_methods_v2') || '[]') } catch { return [] } })()
      const matchPI = _allPI.find(p => p.name === methodVal)
      payMethod = matchPI ? matchPI.category : methodVal
      payDetail = matchPI ? matchPI.name : ''
    }
    const cfs = getItem<CashFlow[]>('acct_cashflows', [])
    const newCf: any = {
      id: cfId, date: form.tradeDate, type: type,
      amount: amt, description: form.desc, accountCode: type === 'income' ? '4030' : '5110',
      counter: form.counter, writeDate: form.writeDate,
      tradeDate: form.tradeDate, inputDate: form.inputDate,
      method: methodVal,
      payMethod: payMethod,
      payDetail: payDetail,
      manager: form.manager,
      budgetCatId: selectedBudgetCat || '',
      budgetItem: type === 'withdrawal' ? (wdBudgetItem || '') : (form.desc || ''),
      budgetSubItem: form.subItem || '',
      createdBy: currentUserName,
      ...(type === 'income' && (form as any).incomeNote ? { incomeNote: (form as any).incomeNote } : {}),
      ...(type === 'income' && isReceivable ? { receivable: true, received: false, expectedDate: expectedDate || '' } : {}),
      ...(type !== 'income' && isPayable ? { payable: true, paid: false, expectedDate: expectedDate || '' } : {}),
    }
    // 품의에서 지출등록한 경우 approvalId 연결
    if (isFromApproval && selectedApprovalId) {
      newCf.approvalId = String(selectedApprovalId)
    }
    cfs.push(newCf)
    setItem('acct_cashflows', cfs)

    // 승인된 품의에서 지출등록한 경우, 해당 품의 상태를 'toResolve'(결의할)로 변경
    if (isFromApproval && selectedApprovalId) {
      const approvals = getItem<Approval[]>('acct_approvals', [])
      const updated = approvals.map(ap =>
        String(ap.id) === String(selectedApprovalId)
          ? { ...ap, status: 'toResolve' as const }
          : ap
      )
      setItem('acct_approvals', updated)
      setSelectedApprovalId(null)
    }

    // 출금전표: 예산 집행액(spent) 업데이트 (지출하기에서 이미 반영된 건은 제외)
    if (type === 'withdrawal' && selectedBudgetCat && wdBudgetItem && !isFromApproval) {
      const budgets: BudgetItem[] = getItem('acct_budgets', [])
      const updated = budgets.map(b => {
        const catMatch = String(b.catId) === String(selectedBudgetCat)
        const itemMatch = b.itemName === wdBudgetItem
        const subMatch = form.subItem ? b.subItemName === form.subItem : true
        if (catMatch && itemMatch && subMatch) {
          // 세목이 지정된 경우 해당 세목에만, 아닌 경우 첫 매칭 항목에 분배
          return { ...b, spent: (b.spent || 0) + amt }
        }
        return b
      })
      setItem('acct_budgets', updated)
    }

    // 지출하기(expense): 예산 집행액 업데이트
    if (type === 'expense' && selectedBudgetCat && form.desc) {
      const budgets: BudgetItem[] = getItem('acct_budgets', [])
      const updated = budgets.map(b => {
        const catMatch = String(b.catId) === String(selectedBudgetCat)
        const itemMatch = b.itemName === form.desc
        const subMatch = form.subItem ? b.subItemName === form.subItem : true
        if (catMatch && itemMatch && subMatch) {
          return { ...b, spent: (b.spent || 0) + amt }
        }
        return b
      })
      setItem('acct_budgets', updated)
    }

    // 출금전표: 선지출 품의 자동 생성 (품의하기 메뉴에 표시)
    if (type === 'withdrawal') {
      const approvals = getItem<Approval[]>('acct_approvals', [])
      const budgetCats: BudgetCat[] = getItem('acct_budget_cats', [])
      const budgets: BudgetItem[] = getItem('acct_budgets', [])
      const selectedCat = budgetCats.find(c => String(c.id) === String(selectedBudgetCat))
      const catName = selectedCat?.name || wdCatName || ''
      // 지출담당자 본인 여부 판별
      const isSelfExpense = !!(selectedCat?.users && selectedCat.users.includes(currentUserName))
      // 승인권자 자동 설정
      let autoApprover = ''
      if (selectedCat) {
        if ((selectedCat as any).approvers && (selectedCat as any).approvers.length > 0) {
          autoApprover = (selectedCat as any).approvers[0]
        } else {
          const staffData = getItem<any[]>('ws_users', [])
          const approverStaff = staffData.find(s => s.approverType === 'approver')
          if (approverStaff) autoApprover = approverStaff.name
        }
      }
      // 이름으로 budgetItemId, budgetSubId 매핑
      const matchedItem = budgets.find(b => String(b.catId) === String(selectedBudgetCat) && b.itemName === wdBudgetItem)
      const matchedSub = form.subItem ? budgets.find(b => String(b.catId) === String(selectedBudgetCat) && b.itemName === wdBudgetItem && b.subItemName === form.subItem) : null

      // 반려된 품의 재지출: 기존 approval 업데이트
      const existingRejected = selectedApprovalId ? approvals.find(a => String(a.id) === String(selectedApprovalId) && a.status === 'rejected') : null
      let finalApprovalId: string | number
      if (existingRejected) {
        // 기존 반려 approval을 preExpense로 업데이트
        const updatedApprovals = approvals.map(a => {
          if (String(a.id) === String(selectedApprovalId)) {
            return {
              ...a,
              status: 'preExpense' as const,
              isPreExpense: true,
              selfExpense: isSelfExpense,
              title: `[선지출] ${form.desc || wdBudgetItem}`,
              amount: amt,
              date: form.tradeDate,
              description: (form as any).memo || `출금전표 선지출 - ${wdBudgetItem}${form.subItem ? ' > ' + form.subItem : ''}`,
              applicant: currentUserName,
              approver: autoApprover || (a as any).approver || '',
              budgetItem: wdBudgetItem,
              budgetSubItem: form.subItem || '',
              budgetDetailItem: form.detailItem || '',
              budgetCatId: selectedBudgetCat,
              budgetCatName: catName,
              budgetItemId: matchedItem ? String(matchedItem.id) : '',
              budgetSubId: matchedSub ? String(matchedSub.id) : '',
              counter: form.counter || '',
              method: form.method || '',
              attachments: wdAttachments.length > 0 ? wdAttachments : (a as any).attachments,
              resubmittedAt: getLocalISOString(),
            } as any
          }
          return a
        })
        setItem('acct_approvals', updatedApprovals)
        finalApprovalId = selectedApprovalId!
      } else {
        // 새 approval 생성
        const preApprovalId = uid()
        approvals.push({
          id: preApprovalId,
          status: 'preExpense',
          isPreExpense: true,
          selfExpense: isSelfExpense,
          title: `[선지출] ${form.desc || wdBudgetItem}`,
          amount: amt,
          date: form.tradeDate,
          createdAt: getLocalISOString(),
          accountCode: '',
          description: (form as any).memo || `출금전표 선지출 - ${wdBudgetItem}${form.subItem ? ' > ' + form.subItem : ''}`,
          applicant: currentUserName,
          approver: autoApprover,
          budgetItem: wdBudgetItem,
          budgetSubItem: form.subItem || '',
          budgetDetailItem: form.detailItem || '',
          budgetCatId: selectedBudgetCat,
          budgetCatName: catName,
          budgetItemId: matchedItem ? String(matchedItem.id) : '',
          budgetSubId: matchedSub ? String(matchedSub.id) : '',
          counter: form.counter || '',
          method: form.method || '',
          attachments: wdAttachments.length > 0 ? wdAttachments : undefined,
        } as any)
        setItem('acct_approvals', approvals)
        finalApprovalId = preApprovalId
      }
      // cashflow에 approvalId 연결
      const allCfs = getItem<CashFlow[]>('acct_cashflows', [])
      const cfIdx = allCfs.findIndex(x => String(x.id) === String(cfId))
      if (cfIdx >= 0) { (allCfs[cfIdx] as any).approvalId = String(finalApprovalId); setItem('acct_cashflows', allCfs) }
    }

    setForm({ desc: '', subItem: '', detailItem: '', amount: '', counter: '', method: type === 'income' ? '계좌이체' : '계좌이체', writeDate: today, tradeDate: today, inputDate: today, manager: '', expenseManager: '', approvalStatus: '품의준비' })
    setCounterSearch('')
    setIsFromApproval(false)
    setWdBudgetItem('')
    setWdAttachments([])
    setWdSearchSelected('')
    setWdSearchText('')
    setSelectedApprovalId(null)
    setRefresh(r => r + 1)
  }

  const deleteEntry = (id: string | number) => {
    if (!confirm('삭제하시겠습니까?')) return
    const allCfs = getItem<CashFlow[]>('acct_cashflows', [])
    const target = allCfs.find(c => String(c.id) === String(id))
    // 연동된 품의가 있으면 상태를 approved로 되돌림
    if (target && (target as any).approvalId) {
      const approvals: any[] = getItem('acct_approvals', [])
      const aIdx = approvals.findIndex(a => String(a.id) === String((target as any).approvalId))
      if (aIdx >= 0) {
        approvals[aIdx].status = 'approved'
        delete approvals[aIdx].expensedAt
        setItem('acct_approvals', approvals)
      }
    }
    // 예산 집행액(spent) 복원: 출금/지출 전표 삭제 시 spent에서 차감
    if (target && (target.type === 'withdrawal' || target.type === 'expense') && (target as any).budgetCatId) {
      const budgets: BudgetItem[] = getItem('acct_budgets', [])
      const amt = target.amount || 0
      const budgetItem = (target as any).budgetItem || (target as any).budgetSubItem || ''
      if (amt > 0 && budgetItem) {
        const updated = budgets.map(b => {
          const catMatch = String(b.catId) === String((target as any).budgetCatId)
          const itemMatch = b.itemName === budgetItem || b.subItemName === budgetItem
          if (catMatch && itemMatch && (b.spent || 0) >= amt) {
            return { ...b, spent: (b.spent || 0) - amt }
          }
          return b
        })
        setItem('acct_budgets', updated)
      }
    }
    const cfs = allCfs.filter(c => String(c.id) !== String(id))
    setItem('acct_cashflows', cfs)
    setRefresh(r => r + 1)
  }

  const methods = useMemo(() => {
    const allPM: PayMethodItem[] = (() => { try { return JSON.parse(localStorage.getItem('acct_pay_methods_v2') || '[]') } catch { return [] } })()
    const filtered = selectedBudgetCat
      ? allPM.filter(p => String(p.budgetCatId) === String(selectedBudgetCat))
      : allPM
    if (filtered.length > 0) return filtered.map(p => p.name)
    const stored: string[] = getItem('acct_payment_methods', ['계좌이체', '현금', '카드', '법인카드', '기타'])
    return stored.length > 0 ? stored : ['계좌이체', '현금', '카드', '법인카드', '기타']
  }, [refresh, selectedBudgetCat])

  return (
    <div className="space-y-4">
      {/* ── 지출하기: 탭 분리 ── */}
      {type === 'expense' && (
        <div className="flex items-center gap-1 bg-[var(--bg-muted)] rounded-xl p-1 border border-[var(--border-default)]">
          <button
            onClick={() => setExpenseTab('waiting')}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-bold transition-all cursor-pointer',
              expenseTab === 'waiting'
                ? 'bg-amber-500 text-white shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            )}
          >
            <Clock size={13} />
            지출대기
          </button>
          <button
            onClick={() => setExpenseTab('history')}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-bold transition-all cursor-pointer',
              expenseTab === 'history'
                ? 'bg-[#ef4444] text-white shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            )}
          >
            <ScrollText size={13} />
            지출내역
          </button>
        </div>
      )}

      {/* ── 등록 폼 (expense가 아닐 때만 인라인 표시) ── */}
      {type !== 'expense' && (
      <>
      <div className={`bg-gradient-to-r ${typeGrads[type]} rounded-2xl p-4 text-white`}>
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-xl">{typeEmojis[type]}</div>
          <div>
            <div className="text-[17px] font-extrabold">간편 {type === 'withdrawal' && withdrawalMode === 'transfer' ? '대체전표' : typeLabels[type]}</div>
            <div className="text-[11.5px] opacity-85">{type === 'withdrawal' && withdrawalMode === 'transfer' ? '자산 대체 내역을 입력하세요' : (type === 'income' ? '입금' : '지출') + ' 내역을 입력하세요'}</div>
          </div>
        </div>
        {type === 'withdrawal' && (
          <div className="flex gap-1.5 mt-1">
            <button onClick={() => setWithdrawalMode('withdrawal')} className={`px-3 py-1.5 rounded-lg text-[12px] font-bold cursor-pointer transition-all flex items-center gap-1.5 ${withdrawalMode === 'withdrawal' ? 'bg-white text-amber-600 shadow-md' : 'bg-white/20 text-white hover:bg-white/30'}`}><Wallet size={13} /> 출금</button>
            <button onClick={() => setWithdrawalMode('transfer')} className={`px-3 py-1.5 rounded-lg text-[12px] font-bold cursor-pointer transition-all flex items-center gap-1.5 ${withdrawalMode === 'transfer' ? 'bg-white text-amber-600 shadow-md' : 'bg-white/20 text-white hover:bg-white/30'}`}><ArrowLeftRight size={13} /> 대체</button>
          </div>
        )}
      </div>

      {/* ━━ 대체전표 입력 폼 ━━ */}
      {type === 'withdrawal' && withdrawalMode === 'transfer' && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4 space-y-3">
          {!selectedBudgetCat && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-[13px] font-bold">
              <span>⚠️</span> 예산을 선택하세요 — 아래 예산구분에서 예산을 먼저 선택한 후 등록하세요.
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">차변 (받는쪽) *</label>
              <CustomSelect value={transferForm.debit} onChange={v => setTransferForm(f => ({ ...f, debit: v, debitDetail: '' }))} placeholder="— 선택 —" options={[{ value: '', label: '— 선택 —' }, ...transferAccounts.map(a => ({ value: a, label: a }))]} />
              {transferForm.debit && (() => {
                const items = transferPayMethods.filter(p => p.category === transferForm.debit)
                if (items.length === 0) return null
                return (
                  <div className="mt-1.5">
                    <CustomSelect value={transferForm.debitDetail} onChange={v => setTransferForm(f => ({ ...f, debitDetail: v }))} placeholder="— 세부 선택 —"
                      options={[{ value: '', label: '— 세부 선택 —' }, ...items.map(p => {
                        const cfs: CashFlow[] = getItem('acct_cashflows', [])
                        const cfPM = (cf: any) => cf.payMethod || (cf.method?.includes(':') ? cf.method.split(':')[0] : cf.method) || ''
                        const cfPD = (cf: any) => cf.payDetail || (cf.method?.includes(':') ? cf.method.split(':')[1] : '') || ''
                        const isWd = (cf: any) => cf.type === 'withdrawal' || cf.type === 'expense'
                        let balText = ''
                        if (transferForm.debit === '계좌') {
                          const acctIn = cfs.filter(cf => cf.type === 'income' && cfPM(cf) === p.name).reduce((s, cf) => s + (cf.amount || 0), 0)
                          const acctInT = cfs.filter(cf => (cf as any).type === 'transfer' && (cf as any).debitAccount === '계좌' && (cf as any).debitDetail === p.name).reduce((s, cf) => s + (cf.amount || 0), 0)
                          const acctOut = cfs.filter(cf => isWd(cf) && cfPM(cf) === '계좌' && cfPD(cf) === p.name).reduce((s, cf) => s + (cf.amount || 0), 0)
                          const acctOutT = cfs.filter(cf => (cf as any).type === 'transfer' && (cf as any).creditAccount === '계좌' && (cf as any).creditDetail === p.name).reduce((s, cf) => s + (cf.amount || 0), 0)
                          const bal = (p.initialBalance || 0) + acctIn + acctInT - acctOut - acctOutT
                          balText = ` [잔액 ${bal.toLocaleString()}원]`
                        } else if (transferForm.debit === '현금') {
                          const cashIn = cfs.filter(cf => (cf as any).type === 'transfer' && (cf as any).debitAccount === '현금' && (cf as any).debitDetail === p.name).reduce((s, cf) => s + (cf.amount || 0), 0)
                          const cashOutT = cfs.filter(cf => (cf as any).type === 'transfer' && (cf as any).creditAccount === '현금' && (cf as any).creditDetail === p.name).reduce((s, cf) => s + (cf.amount || 0), 0)
                          const cashOutE = cfs.filter(cf => isWd(cf) && cfPM(cf) === '현금' && cfPD(cf) === p.name).reduce((s, cf) => s + (cf.amount || 0), 0)
                          const bal = (p.initialBalance || 0) + cashIn - cashOutT - cashOutE
                          balText = ` [잔액 ${bal.toLocaleString()}원]`
                        } else if (transferForm.debit === '상품권') {
                          const qty = p.voucherQty || 0
                          const usedQty = cfs.filter(cf => isWd(cf) && cfPM(cf) === '상품권' && cfPD(cf) === p.name).length
                          balText = ` [잔여 ${qty - usedQty}매/${qty}매]`
                        }
                        return {
                          value: p.name,
                          label: transferForm.debit === '계좌' ? `${p.name} (${p.bankName || ''} ${p.accountNumber || ''})${balText}` :
                                 transferForm.debit === '현금' ? `${p.name} (${p.custodian || ''} · ${p.storageLocation || ''})${balText}` :
                                 transferForm.debit === '상품권' ? `${p.name} (${p.voucherManager || ''} · ${(p.voucherAmount||0).toLocaleString()}원)${balText}` :
                                 transferForm.debit === '어음' ? `${p.name} (${p.noteBank || ''} · ${p.noteManager || ''})` : p.name
                        }
                      })]}
                    />
                  </div>
                )
              })()}
            </div>
            <div>
              <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">대변 (보내는쪽) *</label>
              <CustomSelect value={transferForm.credit} onChange={v => setTransferForm(f => ({ ...f, credit: v, creditDetail: '' }))} placeholder="— 선택 —" options={[{ value: '', label: '— 선택 —' }, ...transferAccounts.filter(a => a !== transferForm.debit).map(a => ({ value: a, label: a }))]} />
              {transferForm.credit && (() => {
                const items = transferPayMethods.filter(p => p.category === transferForm.credit)
                if (items.length === 0) return null
                return (
                  <div className="mt-1.5">
                    <CustomSelect value={transferForm.creditDetail} onChange={v => setTransferForm(f => ({ ...f, creditDetail: v }))} placeholder="— 세부 선택 —"
                      options={[{ value: '', label: '— 세부 선택 —' }, ...items.map(p => {
                        const cfs: CashFlow[] = getItem('acct_cashflows', [])
                        const cfPM = (cf: any) => cf.payMethod || (cf.method?.includes(':') ? cf.method.split(':')[0] : cf.method) || ''
                        const cfPD = (cf: any) => cf.payDetail || (cf.method?.includes(':') ? cf.method.split(':')[1] : '') || ''
                        const isWd = (cf: any) => cf.type === 'withdrawal' || cf.type === 'expense'
                        let balText = ''
                        if (transferForm.credit === '계좌') {
                          const acctIn = cfs.filter(cf => cf.type === 'income' && cfPM(cf) === p.name).reduce((s, cf) => s + (cf.amount || 0), 0)
                          const acctInT = cfs.filter(cf => (cf as any).type === 'transfer' && (cf as any).debitAccount === '계좌' && (cf as any).debitDetail === p.name).reduce((s, cf) => s + (cf.amount || 0), 0)
                          const acctOut = cfs.filter(cf => isWd(cf) && cfPM(cf) === '계좌' && cfPD(cf) === p.name).reduce((s, cf) => s + (cf.amount || 0), 0)
                          const acctOutT = cfs.filter(cf => (cf as any).type === 'transfer' && (cf as any).creditAccount === '계좌' && (cf as any).creditDetail === p.name).reduce((s, cf) => s + (cf.amount || 0), 0)
                          const bal = (p.initialBalance || 0) + acctIn + acctInT - acctOut - acctOutT
                          balText = ` [잔액 ${bal.toLocaleString()}원]`
                        } else if (transferForm.credit === '현금') {
                          const cashIn = cfs.filter(cf => (cf as any).type === 'transfer' && (cf as any).debitAccount === '현금' && (cf as any).debitDetail === p.name).reduce((s, cf) => s + (cf.amount || 0), 0)
                          const cashOutT = cfs.filter(cf => (cf as any).type === 'transfer' && (cf as any).creditAccount === '현금' && (cf as any).creditDetail === p.name).reduce((s, cf) => s + (cf.amount || 0), 0)
                          const cashOutE = cfs.filter(cf => isWd(cf) && cfPM(cf) === '현금' && cfPD(cf) === p.name).reduce((s, cf) => s + (cf.amount || 0), 0)
                          const bal = (p.initialBalance || 0) + cashIn - cashOutT - cashOutE
                          balText = ` [잔액 ${bal.toLocaleString()}원]`
                        } else if (transferForm.credit === '상품권') {
                          const qty = p.voucherQty || 0
                          const usedQty = cfs.filter(cf => isWd(cf) && cfPM(cf) === '상품권' && cfPD(cf) === p.name).length
                          balText = ` [잔여 ${qty - usedQty}매/${qty}매]`
                        }
                        return {
                          value: p.name,
                          label: transferForm.credit === '계좌' ? `${p.name} (${p.bankName || ''} ${p.accountNumber || ''})${balText}` :
                                 transferForm.credit === '현금' ? `${p.name} (${p.custodian || ''} · ${p.storageLocation || ''})${balText}` :
                                 transferForm.credit === '상품권' ? `${p.name} (${p.voucherManager || ''} · ${(p.voucherAmount||0).toLocaleString()}원)${balText}` :
                                 transferForm.credit === '어음' ? `${p.name} (${p.noteBank || ''} · ${p.noteManager || ''})` : p.name
                        }
                      })]}
                    />
                  </div>
                )
              })()}
            </div>
            <div>
              <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">금액 (원) *</label>
              <input value={transferForm.amount} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setTransferForm(f => ({ ...f, amount: v ? parseInt(v).toLocaleString('ko-KR') : '' })) }} placeholder="0" className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-right font-bold text-[var(--text-primary)] focus:border-primary-500 outline-none" />
            </div>
            <div>
              <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">거래일자</label>
              <DatePicker value={transferForm.tradeDate} onChange={v => setTransferForm(f => ({ ...f, tradeDate: v }))} />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">적요 *</label>
              <input value={transferForm.description} onChange={e => setTransferForm(f => ({ ...f, description: e.target.value }))} placeholder={transferForm.debit && transferForm.credit ? `${transferForm.credit} → ${transferForm.debit} 전환` : '대체 내용 입력'} className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">대체사유</label>
              <textarea value={transferForm.reason} onChange={e => setTransferForm(f => ({ ...f, reason: e.target.value }))} placeholder="대체 사유를 입력하세요" rows={2} className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none resize-none" />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">비고</label>
              <input value={transferForm.memo} onChange={e => setTransferForm(f => ({ ...f, memo: e.target.value }))} placeholder="선택 입력" className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none" />
            </div>
          </div>
          {transferForm.debit && transferForm.credit && (
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-700 dark:text-amber-400 font-bold">
              <RefreshCw size={12} className="inline text-amber-600" /> {transferForm.creditDetail ? `${transferForm.credit}(${transferForm.creditDetail})` : transferForm.credit} → {transferForm.debitDetail ? `${transferForm.debit}(${transferForm.debitDetail})` : transferForm.debit} 대체전표가 생성됩니다.
            </div>
          )}
          {/* ── 증빙 첨부 / 미리보기 ── */}
          <div className="mt-1">
            <div className="flex items-center gap-2">
              <label className="text-[10.5px] font-bold text-[var(--text-muted)] flex items-center gap-1"><Paperclip size={11} /> 첨부파일 (영수증/증빙)</label>
              {transferAttachments.length > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 font-bold">{transferAttachments.length}건</span>}
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <button type="button" onClick={() => { setTransferEvidenceOpen(true); setTransferEvidenceEdit(true) }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-[var(--border-default)] text-[11px] font-bold text-[var(--text-muted)] hover:border-primary-400 hover:text-primary-500 cursor-pointer transition-colors">
                <Paperclip size={12} /> {transferAttachments.length > 0 ? '증빙 편집' : '증빙 첨부'}
              </button>
              {transferAttachments.length > 0 && (
                <button type="button" onClick={() => { setTransferEvidenceOpen(true); setTransferEvidenceEdit(false) }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-default)] text-[11px] font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] cursor-pointer transition-colors">
                  <Eye size={12} /> 미리보기
                </button>
              )}
            </div>
          </div>
          {/* 증빙서류 문서 뷰 (PrintApprovalForm) */}
          {transferEvidenceOpen && (() => {
            const staffListData = getItem<any[]>('ws_users', [])
            const applicantStaff = staffListData.find(s => s.name === currentUserName)
            const debitLabel = transferForm.debitDetail ? `${transferForm.debit}(${transferForm.debitDetail})` : transferForm.debit
            const creditLabel = transferForm.creditDetail ? `${transferForm.credit}(${transferForm.creditDetail})` : transferForm.credit
            return (
            <PrintApprovalForm
              editMode={transferEvidenceEdit}
              data={{
                isTransfer: true,
                title: `[대체] ${transferForm.description || (creditLabel + ' → ' + debitLabel)}`,
                amount: parseInt(transferForm.amount.replace(/,/g, '')) || 0,
                applicant: currentUserName,
                approver: '',
                date: transferForm.tradeDate,
                expenseDate: transferForm.tradeDate,
                description: transferForm.reason || '',
                debitAccount: transferForm.debit,
                debitDetail: transferForm.debitDetail,
                creditAccount: transferForm.credit,
                creditDetail: transferForm.creditDetail,
                transferContent: (() => {
                  const creditPM = transferPayMethods.find(p => p.category === transferForm.credit && p.name === transferForm.creditDetail)
                  const debitPM = transferPayMethods.find(p => p.category === transferForm.debit && p.name === transferForm.debitDetail)
                  const creditDesc = creditPM && transferForm.credit === '계좌' ? `${creditPM.bankName || ''} ${creditPM.accountNumber || ''}` : (transferForm.creditDetail || transferForm.credit)
                  const debitDesc = debitPM && transferForm.debit === '계좌' ? `${debitPM.bankName || ''} ${debitPM.accountNumber || ''}` : (transferForm.debitDetail || transferForm.debit)
                  return `${creditDesc} 에서 ${debitDesc}(으)로 대체`
                })(),
                counter: `${creditLabel} → ${debitLabel}`,
                method: '대체',
                memo: transferForm.memo,
                attachments: transferAttachments.map(a => ({
                  name: a.name,
                  type: a.data?.startsWith('data:image') ? 'image/jpeg' : 'application/octet-stream',
                  dataUrl: a.data,
                  title: a.title,
                  printWidth: a.printWidth,
                  row: a.row,
                })),
                approvalType: '선지출',
                department: (applicantStaff as any)?.department || (applicantStaff as any)?.dept || '',
              }}
              onClose={() => setTransferEvidenceOpen(false)}
              onUpdateAttachments={(updated) => {
                setTransferAttachments(updated.map(a => ({
                  name: a.name,
                  data: (a as any).dataUrl || '',
                  size: 0,
                  title: a.title,
                  printWidth: a.printWidth,
                  row: a.row,
                })))
              }}
              actions={
                <>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 12, background: '#4f6ef7', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,.1)' }}>
                    <Paperclip size={14} /> 증빙첨부
                    <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.hwp" style={{ display: 'none' }} onChange={e => {
                      const files = e.target.files
                      if (!files) return
                      Array.from(files).forEach(file => {
                        const reader = new FileReader()
                        reader.onload = () => {
                          if (file.type.startsWith('image/')) {
                            const img = new Image()
                            img.onload = () => {
                              const MAX = 800; let w = img.width, h = img.height
                              if (w > MAX || h > MAX) { if (w > h) { h = Math.round(h * MAX / w); w = MAX } else { w = Math.round(w * MAX / h); h = MAX } }
                              const c = document.createElement('canvas'); c.width = w; c.height = h
                              const ctx = c.getContext('2d'); ctx?.drawImage(img, 0, 0, w, h)
                              const resized = c.toDataURL('image/jpeg', 0.85)
                              setTransferAttachments(prev => [...prev, { name: file.name, data: resized, size: file.size, title: '', printWidth: 100 }])
                            }
                            img.src = reader.result as string
                          } else {
                            setTransferAttachments(prev => [...prev, { name: file.name, data: reader.result as string, size: file.size, title: '', printWidth: 100 }])
                          }
                        }
                        reader.readAsDataURL(file)
                      })
                    }} />
                  </label>
                  <button onClick={() => { setTransferEvidenceOpen(false) }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 12, background: '#ef4444', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,.1)' }}>
                    <Check size={14} /> 증빙완료
                  </button>
                </>
              }
            />
          )})()}
          <div className="flex justify-end">
            <button onClick={saveEntry} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white text-sm font-bold cursor-pointer shadow-md bg-gradient-to-r from-[#f59e0b] to-[#d97706]">
              <Save size={14} /> 대체 등록
            </button>
          </div>
        </div>
      )}

      {(type !== 'withdrawal' || withdrawalMode !== 'transfer') && (
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4 space-y-3">
        {/* ━━ 입력 영역 ━━ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* ── 지출하기: 예산구분 ── */}
          {type === 'expense' ? (
          <div>
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">예산구분 *</label>
            <CustomSelect
              value={isFromApproval ? (approvalMeta.budgetCatName || '') : selectedBudgetCat}
              onChange={v => {
                if (!isFromApproval) {
                  setSelectedBudgetCat(v)
                  setForm(f => ({ ...f, desc: '', subItem: '' }))
                }
              }}
              placeholder={selectedBudgetCat ? '예산구분 선택' : '예산을 먼저 선택하세요'}
              placeholderStyle={!selectedBudgetCat ? { color: '#ef4444', fontWeight: 700 } : undefined}
              options={[
                { value: '', label: selectedBudgetCat ? '— 예산구분 선택 —' : '⚠️ 예산을 먼저 선택하세요' },
                ...expBudgetCats.map(c => ({ value: String(c.id), label: c.name })),
              ]}
            />
          </div>
          ) : type === 'income' ? (
          <>
            {/* 입금전표: 1) 예산선택 */}
            <div>
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <label className="text-[10.5px] font-bold text-[var(--text-muted)]">예산선택</label>
                {selectedBudgetCat && (() => {
                  const allBudgets: BudgetItem[] = getItem('acct_budgets', [])
                  const catBudgets = allBudgets.filter(b => String(b.catId) === String(selectedBudgetCat))
                  const tb = catBudgets.reduce((s, b) => s + (b.amount || 0), 0)
                  const sp = catBudgets.reduce((s, b) => s + (b.spent || 0), 0)
                  const rm = tb - sp
                  const rt = tb > 0 ? Math.round(sp / tb * 100) : 0
                  return (
                    <>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800"><span className="text-[7px] text-blue-500 font-bold">총예산</span><span className="text-[9px] font-extrabold text-blue-600">{tb.toLocaleString('ko-KR')}</span></div>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800"><span className="text-[7px] text-amber-500 font-bold">기집행</span><span className="text-[9px] font-extrabold text-amber-600">{sp.toLocaleString('ko-KR')}</span></div>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800"><span className="text-[7px] text-emerald-500 font-bold">잔액</span><span className="text-[9px] font-extrabold text-emerald-600">{rm.toLocaleString('ko-KR')}</span></div>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800"><span className="text-[9px] font-extrabold text-violet-600">{rt}%</span></div>
                    </>
                  )
                })()}
              </div>
              <input value={wdCatName || '예산구분 선택'} readOnly className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-sm text-[var(--text-primary)] cursor-not-allowed outline-none font-bold" />
            </div>
            {/* 입금전표: 2) 입금내용 */}
            <div>
              <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">입금내용</label>
              <input value={(form as any).incomeNote || ''} onChange={e => setForm(f => ({ ...f, incomeNote: e.target.value } as any))} placeholder="예) 4월 보조금 입금" className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none" />
            </div>
            {/* 입금전표: 3) 입금계정 */}
            <div>
              <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">입금계정 *</label>
              <CustomSelect
                value={form.desc}
                onChange={v => {
                  const allIM: PayMethodItem[] = (() => { try { return JSON.parse(localStorage.getItem('acct_income_methods') || '[]') } catch { return [] } })()
                  const selectedIM = allIM.find(a => a.name === v)
                  const revenueAcct = (selectedIM as any)?.revenueAccountCode || ''
                  const assetAcct = (selectedIM as any)?.accountCode || ''
                  // 입금수단 자동 세팅: 카테고리 + 계좌정보
                  let autoMethod = ''
                  if (selectedIM) {
                    if (selectedIM.category === '계좌' && selectedIM.bankName) {
                      autoMethod = `🏦 ${selectedIM.name} • ${selectedIM.accountNumber || ''}`
                    } else if (selectedIM.category === '현금') {
                      autoMethod = `💵 ${selectedIM.name}`
                    } else if (selectedIM.category === '어음') {
                      autoMethod = `📄 ${selectedIM.name}`
                    } else if (selectedIM.category === '상품권') {
                      autoMethod = `🎟️ ${selectedIM.name}`
                    } else {
                      autoMethod = selectedIM.name
                    }
                  }
                  setForm(f => ({ ...f, desc: v, accountCode: revenueAcct, incomeAssetAccount: assetAcct, method: autoMethod } as any))
                }}
                placeholder="— 입금계정 선택 —"
                options={[
                  { value: '', label: '— 입금계정 선택 —' },
                  ...(() => {
                    const allIM: PayMethodItem[] = (() => { try { return JSON.parse(localStorage.getItem('acct_income_methods') || '[]') } catch { return [] } })()
                    const filtered = selectedBudgetCat
                      ? allIM.filter(p => String(p.budgetCatId) === String(selectedBudgetCat))
                      : allIM
                    return filtered.map(a => {
                      const detail = a.category === '계좌' && a.bankName ? ` (${a.bankName} ${a.accountNumber || ''})` : a.category === '현금' ? ` (현금)` : ''
                      const revAcct = (a as any).revenueAccountCode ? ` → ${(a as any).revenueAccountCode}` : ''
                      return { value: a.name, label: `${a.category} • ${a.name}${detail}${revAcct}` }
                    })
                  })(),
                ]}
              />
            </div>
            {/* 입금전표: 4) 금액 */}
            <div>
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <label className="text-[10.5px] font-bold text-[var(--text-muted)]">금액 (원) *</label>
                {selectedBudgetCat && (() => {
                  const allBudgets: BudgetItem[] = getItem('acct_budgets', [])
                  const catBudgets = allBudgets.filter(b => String(b.catId) === String(selectedBudgetCat))
                  const totalBudget = catBudgets.reduce((s, b) => s + (b.amount || 0), 0)
                  const allCfs: any[] = getItem('acct_cashflows', [])
                  const incomeCfs = allCfs.filter((c: any) => c.type === 'income' && (!c.budgetCatId || String(c.budgetCatId) === String(selectedBudgetCat)))
                  const totalIncome = incomeCfs.reduce((s: number, c: any) => s + (typeof c.amount === 'number' ? c.amount : (Number(String(c.amount || '0').replace(/,/g, '')) || 0)), 0)
                  const inputAmt = Number((form.amount || '0').replace(/,/g, '')) || 0
                  const afterIncome = totalIncome + inputAmt
                  const remaining = totalBudget - afterIncome
                  const incomePct = totalBudget > 0 ? Math.round(afterIncome / totalBudget * 100) : 0
                  return (
                    <>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800"><span className="text-[7px] text-blue-500 font-bold">총예산</span><span className="text-[9px] font-extrabold text-blue-600">{totalBudget.toLocaleString('ko-KR')}</span></div>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800"><span className="text-[7px] text-emerald-500 font-bold">총입금</span><span className="text-[9px] font-extrabold text-emerald-600">{afterIncome.toLocaleString('ko-KR')}</span></div>
                      <div className={`flex items-center gap-0.5 px-1 py-px rounded border ${remaining < 0 ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'}`}>
                        <span className={`text-[7px] font-bold ${remaining < 0 ? 'text-red-500' : 'text-amber-500'}`}>잔여</span>
                        <span className={`text-[9px] font-extrabold ${remaining < 0 ? 'text-red-600' : 'text-amber-600'}`}>{remaining.toLocaleString('ko-KR')}</span>
                      </div>
                      <div className={`flex items-center gap-0.5 px-1 py-px rounded border ${incomePct >= 100 ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800' : 'bg-violet-50 dark:bg-violet-900/10 border-violet-200 dark:border-violet-800'}`}>
                        <span className={`text-[9px] font-extrabold ${incomePct >= 100 ? 'text-emerald-600' : 'text-violet-600'}`}>{incomePct}%</span>
                      </div>
                    </>
                  )
                })()}
              </div>
              <input value={form.amount} onChange={e => handleAmtInput(e.target.value)} placeholder="0" className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm font-bold text-right focus:border-primary-500 outline-none" style={{ color: typeColors[type] }} />
            </div>
          </>
          ) : (
          <>
            {/* 출금전표: 1) 예산선택 */}
            <div>
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <label className="text-[10.5px] font-bold text-[var(--text-muted)]">예산선택</label>
                {selectedBudgetCat && (() => {
                  const allBudgets: BudgetItem[] = getItem('acct_budgets', [])
                  const catBudgets = allBudgets.filter(b => String(b.catId) === String(selectedBudgetCat))
                  const tb = catBudgets.reduce((s, b) => s + (b.amount || 0), 0)
                  const sp = catBudgets.reduce((s, b) => s + (b.spent || 0), 0)
                  const rm = tb - sp
                  const rt = tb > 0 ? Math.round(sp / tb * 100) : 0
                  return (
                    <>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800"><span className="text-[7px] text-blue-500 font-bold">총예산</span><span className="text-[9px] font-extrabold text-blue-600">{tb.toLocaleString('ko-KR')}</span></div>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800"><span className="text-[7px] text-amber-500 font-bold">기집행</span><span className="text-[9px] font-extrabold text-amber-600">{sp.toLocaleString('ko-KR')}</span></div>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800"><span className="text-[7px] text-emerald-500 font-bold">잔액</span><span className="text-[9px] font-extrabold text-emerald-600">{rm.toLocaleString('ko-KR')}</span></div>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800"><span className="text-[9px] font-extrabold text-violet-600">{rt}%</span></div>
                    </>
                  )
                })()}
              </div>
              <input value={wdCatName || '예산을 먼저 선택해주세요'} readOnly className={`w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-sm cursor-not-allowed outline-none font-bold ${wdCatName ? 'text-[var(--text-primary)]' : 'text-red-500'}`} />
            </div>
            {/* 출금전표: 2) 품의명/지출내용 */}
            <div>
              <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">{(!form.manager || form.manager === currentUserName) ? '품의명' : '지출내용'} *</label>
              <input value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} placeholder="예) 사무용품 구매" className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none" />
            </div>
          </>
          )}
          {/* 예산항목/세목 (출금전표에서만) - 통합 검색 + 기존 드롭다운 */}
          {type === 'withdrawal' && (
          <>
            {/* ── 통합 검색 ── */}
            <div className="relative">
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <label className="text-[10.5px] font-bold text-[var(--text-muted)]">🔍 예산 통합 검색</label>
                {wdSearchSelected && (() => {
                  const allBudgets: BudgetItem[] = getItem('acct_budgets', [])
                  let matched = allBudgets.filter(b => String(b.catId) === String(selectedBudgetCat) && b.itemName === wdBudgetItem)
                  if (form.subItem) matched = matched.filter(b => b.subItemName === form.subItem)
                  if (form.detailItem) matched = matched.filter(b => b.detailItemName === form.detailItem)
                  const tb = matched.reduce((s, b) => s + (b.amount || 0), 0)
                  const sp = matched.reduce((s, b) => s + (b.spent || 0), 0)
                  const rm = tb - sp
                  const rt = tb > 0 ? Math.round(sp / tb * 100) : 0
                  return (
                    <>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800"><span className="text-[7px] text-blue-500 font-bold">총예산</span><span className="text-[9px] font-extrabold text-blue-600">{tb.toLocaleString('ko-KR')}</span></div>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800"><span className="text-[7px] text-amber-500 font-bold">기집행</span><span className="text-[9px] font-extrabold text-amber-600">{sp.toLocaleString('ko-KR')}</span></div>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800"><span className="text-[7px] text-emerald-500 font-bold">잔액</span><span className={`text-[9px] font-extrabold ${rm < 0 ? 'text-[#ef4444]' : 'text-emerald-600'}`}>{rm.toLocaleString('ko-KR')}</span></div>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800"><span className="text-[9px] font-extrabold text-violet-600">{rt}%</span></div>
                    </>
                  )
                })()}
              </div>
              {wdSearchSelected ? (
                <div className="w-full px-3 py-2.5 rounded-lg border border-primary-400 bg-primary-50/30 text-[12px] flex items-center justify-between gap-1">
                  <span className="text-[var(--text-primary)] font-bold truncate">{wdSearchSelected}</span>
                  <button type="button" onClick={() => { setWdSearchSelected(''); setWdSearchText(''); setSelectedBudgetCat(''); setWdBudgetItem(''); setWdCatName(''); setForm(f => ({...f, subItem:'', detailItem:'', amount:''})) }} className="text-[var(--text-muted)] hover:text-[#ef4444] text-[14px] shrink-0 cursor-pointer">✕</button>
                </div>
              ) : (
                <input
                  type="text"
                  value={wdSearchText}
                  onChange={e => setWdSearchText(e.target.value)}
                  onFocus={() => setWdSearchFocused(true)}
                  onBlur={() => setTimeout(() => setWdSearchFocused(false), 200)}
                  placeholder="예산항목, 세목, 계정과목명, 동의어 검색..."
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none placeholder:text-[var(--text-muted)]"
                />
              )}
              {wdSearchFocused && wdSearchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg shadow-lg z-50 max-h-[240px] overflow-y-auto">
                  {wdSearchResults.map((r, i) => (
                    <button key={i} type="button"
                      onMouseDown={e => { e.preventDefault(); setWdSearchSelected(r.path); setWdSearchText(''); setSelectedBudgetCat(r.catId); setWdCatName(r.catName); setWdBudgetItem(r.itemName); setForm(f => ({...f, subItem: r.subName||'', detailItem: r.detailName||''})); setWdSearchFocused(false) }}
                      className="w-full text-left px-3 py-2.5 hover:bg-primary-50/50 border-b border-[var(--border-default)] last:border-b-0 cursor-pointer transition-colors"
                    >
                      <div className="text-[12px] font-bold text-[var(--text-primary)] leading-tight">{r.path}</div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[10px] text-[var(--text-muted)]">{r.accountCode && `${r.accountCode} ${r.accountName}`}</span>
                        <span className={`text-[10px] font-extrabold ${r.remaining < 0 ? 'text-[#ef4444]' : r.remaining > 0 ? 'text-[#22c55e]' : 'text-[var(--text-muted)]'}`}>잔액 {r.remaining.toLocaleString()}원</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {wdSearchFocused && wdSearchText.trim() && wdSearchResults.length === 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg shadow-lg z-50 p-3 text-center">
                  <span className="text-[11px] text-[var(--text-muted)]">검색 결과가 없습니다</span>
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <label className="text-[10.5px] font-bold text-[var(--text-muted)]">금액 (원) *</label>
                {wdBudgetItem && (() => {
                  const budgets: BudgetItem[] = getItem('acct_budgets', [])
                  let matched = form.subItem
                    ? budgets.filter(b => String(b.catId) === String(selectedBudgetCat) && b.itemName === wdBudgetItem && b.subItemName === form.subItem)
                    : budgets.filter(b => String(b.catId) === String(selectedBudgetCat) && b.itemName === wdBudgetItem)
                  if (form.detailItem) matched = matched.filter(b => b.detailItemName === form.detailItem)
                  const totalBudget = matched.reduce((s, b) => s + (b.amount || 0), 0)
                  const prevSpent = matched.reduce((s, b) => s + (b.spent || 0), 0)
                  const inputAmt = Number((form.amount || '0').replace(/,/g, '')) || 0
                  const afterSpent = prevSpent + inputAmt
                  const afterRemain = totalBudget - afterSpent
                  const afterPct = totalBudget > 0 ? Math.round(afterSpent / totalBudget * 100) : 0
                  const isOver = afterRemain < 0
                  return (
                    <>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
                        <span className="text-[7px] text-blue-500 font-bold">총예산</span>
                        <span className="text-[9px] font-extrabold text-blue-600">{totalBudget.toLocaleString('ko-KR')}</span>
                      </div>
                      <div className={`flex items-center gap-0.5 px-1 py-px rounded border ${isOver ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'}`}>
                        <span className={`text-[7px] font-bold ${isOver ? 'text-red-500' : 'text-amber-500'}`}>집행</span>
                        <span className={`text-[9px] font-extrabold ${isOver ? 'text-red-600' : 'text-amber-600'}`}>{afterSpent.toLocaleString('ko-KR')}</span>
                      </div>
                      <div className={`flex items-center gap-0.5 px-1 py-px rounded border ${isOver ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800'}`}>
                        <span className={`text-[7px] font-bold ${isOver ? 'text-red-500' : 'text-emerald-500'}`}>잔액</span>
                        <span className={`text-[9px] font-extrabold ${isOver ? 'text-red-600' : 'text-emerald-600'}`}>{afterRemain.toLocaleString('ko-KR')}</span>
                      </div>
                      <div className={`flex items-center gap-0.5 px-1 py-px rounded border ${afterPct > 100 ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' : afterPct > 80 ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800' : 'bg-violet-50 dark:bg-violet-900/10 border-violet-200 dark:border-violet-800'}`}>
                        <span className={`text-[9px] font-extrabold ${afterPct > 100 ? 'text-red-600' : afterPct > 80 ? 'text-amber-600' : 'text-violet-600'}`}>{afterPct}%</span>
                        {isOver && <span className="text-[9px]">⚠️</span>}
                      </div>
                    </>
                  )
                })()}
              </div>
              <input value={form.amount} onChange={e => handleAmtInput(e.target.value)} placeholder="0" className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm font-bold text-right focus:border-primary-500 outline-none" style={{ color: typeColors[type] }} />
            </div>
          </>
          )}

          {type === 'expense' && (
          <div>
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">금액 (원) *</label>
            <input value={form.amount} onChange={e => handleAmtInput(e.target.value)} placeholder="0" className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm font-bold text-right focus:border-primary-500 outline-none" style={{ color: typeColors[type] }} />
          </div>
          )}
          {type === 'expense' && (
          <div>
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">예산목</label>
            {budgetItemNames.length > 0 ? (
              <div className="relative">
                {descMode === 'select' ? (
                  <CustomSelect
                    value={form.desc}
                    onChange={v => {
                      if (v === '__direct__') {
                        setDescMode('input')
                        setForm(f => ({ ...f, desc: '', subItem: '' }))
                      } else {
                        setForm(f => ({ ...f, desc: v, subItem: '' }))
                      }
                    }}
                    placeholder="— 예산목 선택 —"
                    options={[
                      { value: '', label: '— 예산목 선택 —' },
                      ...budgetItemNames.map(name => ({ value: name, label: name })),
                      { value: '__direct__', label: '✏️ 직접 입력' },
                    ]}
                  />
                ) : (
                  <div className="flex gap-1.5">
                    <input
                      value={form.desc}
                      onChange={e => setForm(f => ({ ...f, desc: e.target.value }))}
                      placeholder="지출 내용을 직접 입력"
                      className="flex-1 px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => { setDescMode('select'); setForm(f => ({ ...f, desc: '' })) }}
                      className="px-2.5 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-[10.5px] font-bold text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer whitespace-nowrap"
                    >
                      목록
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <input value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} placeholder="예산목 입력" className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none" />
            )}
          </div>
          )}
          {/* 예산세목 (지출하기에서만) */}
          {type === 'expense' && (
          <div>
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">예산세목</label>
            {subItemNames.length > 0 ? (
              <CustomSelect
                value={form.subItem}
                onChange={v => setForm(f => ({ ...f, subItem: v }))}
                placeholder="— 예산세목 선택 —"
                options={[
                  { value: '', label: '— 예산세목 선택 —' },
                  ...subItemNames.map(n => ({ value: n, label: n })),
                ]}
              />
            ) : (
              <input value={form.subItem || '-'} readOnly className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-sm text-[var(--text-primary)] cursor-not-allowed outline-none" />
            )}
          </div>
          )}
          {/* 담당자 (지출하기에서만) */}
          {type === 'expense' && (
          <div>
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">담당자</label>
            <CustomSelect
              value={form.manager}
              onChange={v => setForm(f => ({ ...f, manager: v }))}
              placeholder="— 담당자 선택 —"
              options={[
                { value: '', label: '— 담당자 선택 —' },
                ...staffList.map(s => ({ value: s.name, label: s.name })),
              ]}
            />
          </div>
          )}

        </div>

        {/* ━━ 수정 가능 영역 ━━ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-dashed border-[var(--border-default)]">
          <div ref={counterRef} className="relative">
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">거래처</label>
            <input
              value={counterSearch || form.counter}
              onChange={e => { setCounterSearch(e.target.value); setShowCounterList(true); setForm(f => ({ ...f, counter: '' })) }}
              onFocus={() => setShowCounterList(true)}
              placeholder="거래처명 검색..."
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none"
            />
            {showCounterList && (
              <div className="absolute z-50 left-0 right-0 top-full mt-1 max-h-[200px] overflow-y-auto rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-lg">
                {vendorOptions
                  .filter(v => !counterSearch || v.label.toLowerCase().includes(counterSearch.toLowerCase()))
                  .map((v, i) => (
                    <button key={i} onClick={() => {
                      setForm(f => ({ ...f, counter: v.value }))
                      setCounterSearch('')
                      setShowCounterList(false)
                      /* 거래처에 연결된 예산구분 자동 설정 */
                      if (type !== 'expense' && v.budgetCatId) {
                        setSelectedBudgetCat(v.budgetCatId)
                        setWdBudgetItem('')
                        setForm(f2 => ({ ...f2, counter: v.value, subItem: '', amount: '' }))
                        const cats: BudgetCat[] = getItem('acct_budget_cats', [])
                        const cat = cats.find(c => String(c.id) === String(v.budgetCatId))
                        setWdCatName(cat?.name || '')
                      }
                    }}
                      className="w-full text-left px-3 py-2 text-[13px] text-[var(--text-primary)] hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer border-none bg-transparent flex items-center justify-between">
                      <span>{v.label}</span>
                      {v.catName && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 font-bold ml-2 shrink-0">{v.catName}</span>}
                    </button>
                  ))}
                {vendorOptions.filter(v => !counterSearch || v.label.toLowerCase().includes(counterSearch.toLowerCase())).length === 0 && (
                  <div className="px-3 py-2 text-[12px] text-[var(--text-muted)]">검색 결과가 없습니다</div>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">{type === 'income' ? '입금' : '지출'}수단</label>
            {type === 'income' ? (
              <input
                value={form.method || '입금계정을 선택하면 자동 설정됩니다'}
                readOnly
                className={`w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] text-sm outline-none cursor-not-allowed ${form.method ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-300 font-bold' : 'bg-[var(--bg-muted)] text-[var(--text-muted)]'}`}
              />
            ) : (() => {
              // 지출수단 관리에서 등록된 수단만 사용 (예산구분별 필터)
              const catIdVal = selectedBudgetCat
              if (!catIdVal) {
                return (
                  <select disabled className="w-full px-2.5 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-[12px] text-[var(--text-muted)] cursor-not-allowed outline-none">
                    <option value="">— 예산을 먼저 선택하세요 —</option>
                  </select>
                )
              }
              const payOpts: {value:string; label:string; group:string}[] = []
              const allPayItems: PayMethodItem[] = (() => { try { return JSON.parse(localStorage.getItem('acct_pay_methods_v2') || '[]') } catch { return [] } })()
              const payItemsRaw = allPayItems.filter(p => String(p.budgetCatId) === String(catIdVal))
              const seen = new Set<string>()
              const payItems = payItemsRaw.filter(p => {
                const key = `${p.category}:${p.name}`
                if (seen.has(key)) return false
                seen.add(key)
                return true
              })
              const cfs: CashFlow[] = getItem('acct_cashflows', [])
              // 헬퍼: cf에서 payMethod/payDetail 추출 (기존 데이터 호환)
              const cfPM = (cf: any) => cf.payMethod || (cf.method?.includes(':') ? cf.method.split(':')[0] : cf.method) || ''
              const cfPD = (cf: any) => cf.payDetail || (cf.method?.includes(':') ? cf.method.split(':')[1] : '') || ''
              const isWd = (cf: any) => cf.type === 'withdrawal' || cf.type === 'expense'
              // 계좌 잔액 계산 헬퍼
              const calcAcctBal = (p: PayMethodItem) => {
                const acctIn = cfs.filter(cf => cf.type === 'income' && cfPM(cf) === p.name).reduce((s, cf) => s + (cf.amount || 0), 0)
                const acctInT = cfs.filter(cf => (cf as any).type === 'transfer' && (cf as any).debitAccount === '계좌' && (cf as any).debitDetail === p.name).reduce((s, cf) => s + (cf.amount || 0), 0)
                const acctOut = cfs.filter(cf => isWd(cf) && cfPM(cf) === '계좌' && cfPD(cf) === p.name).reduce((s, cf) => s + (cf.amount || 0), 0)
                const acctOutT = cfs.filter(cf => (cf as any).type === 'transfer' && (cf as any).creditAccount === '계좌' && (cf as any).creditDetail === p.name).reduce((s, cf) => s + (cf.amount || 0), 0)
                return (p.initialBalance || 0) + acctIn + acctInT - acctOut - acctOutT
              }
              // 현금 잔액 계산 헬퍼
              const calcCashBal = (p: PayMethodItem) => {
                const cashIn = cfs.filter(cf => (cf as any).type === 'transfer' && (cf as any).debitAccount === '현금' && (cf as any).debitDetail === p.name).reduce((s, cf) => s + (cf.amount || 0), 0)
                const cashOutT = cfs.filter(cf => (cf as any).type === 'transfer' && (cf as any).creditAccount === '현금' && (cf as any).creditDetail === p.name).reduce((s, cf) => s + (cf.amount || 0), 0)
                const cashOutE = cfs.filter(cf => isWd(cf) && cfPM(cf) === '현금' && cfPD(cf) === p.name).reduce((s, cf) => s + (cf.amount || 0), 0)
                return (p.initialBalance || 0) + cashIn - cashOutT - cashOutE
              }
              // 상품권 잔여수 계산 헬퍼
              const calcVoucherRemain = (p: PayMethodItem) => {
                const qty = p.voucherQty || 0
                const usedQty = cfs.filter(cf => isWd(cf) && cfPM(cf) === '상품권' && cfPD(cf) === p.name).length
                return qty - usedQty
              }
              // 계좌 + 하위 카드 그룹
              const bankGroups: {bank: typeof payItems[0]; cards: any[]; balance: number}[] = []
              payItems.filter(p => p.category === '계좌').forEach(p => {
                bankGroups.push({ bank: p, cards: p.cards || [], balance: calcAcctBal(p) })
              })
              payItems.filter(p => p.category === '현금').forEach(p => {
                const bal = calcCashBal(p)
                payOpts.push({ value: p.name, label: `현금 ${p.name} [잔액 ${bal.toLocaleString()}원]`, group: '현금' })
              })
              // 어음: notes(실제 어음 리스트)가 있는 항목만 표시
              payItems.filter(p => p.category === '어음' && p.notes && p.notes.length > 0).forEach(p => {
                const validNotes = p.notes.filter((note: any) => (note.noteNumber && String(note.noteNumber).trim()) || (note.amount && Number(note.amount) > 0))
                if (validNotes.length === 0) return
                validNotes.forEach((note: any) => {
                  const typeLabel = p.noteType === '발행' ? '발행' : '수신'
                  const amt = note.amount ? Number(note.amount).toLocaleString() + '원' : ''
                  const label = `${p.name} - ${typeLabel} ${note.noteNumber || ''} ${amt}`.trim()
                  payOpts.push({ value: `어음:${p.name}:${note.id}`, label, group: '어음' })
                })
              })
              payItems.filter(p => p.category === '상품권').forEach(p => {
                const remain = calcVoucherRemain(p)
                const qty = p.voucherQty || 0
                payOpts.push({ value: p.name, label: `상품권 ${p.name} [잔여 ${remain}매/${qty}매]`, group: '상품권' })
              })
              const totalOpts = bankGroups.length + payOpts.length
              if (totalOpts === 0) {
                return (
                  <select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))} className="w-full px-2.5 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[12px] text-[var(--text-muted)] focus:outline-none focus:border-primary-500">
                    <option value="">— 지출수단을 먼저 등록하세요 —</option>
                  </select>
                )
              }
              return (
                <select value={form.method} onChange={e => {
                  const val = e.target.value
                  setForm(f => ({ ...f, method: val }))
                  // 어음 선택 시 해당 노트의 수취인/발행인을 거래처로 자동 설정
                  if (val.startsWith('어음:')) {
                    const parts = val.split(':')
                    const itemName = parts[1]
                    const noteId = Number(parts[2])
                    const matchItem = payItems.find(p => p.name === itemName)
                    if (matchItem) {
                      const matchNote = (matchItem.notes || []).find((n: any) => n.id === noteId)
                      if (matchNote) {
                        const vendor = matchItem.noteType === '발행' ? (matchNote.receiver || '') : (matchNote.issuer || '')
                        const amt = matchNote.amount ? Number(matchNote.amount).toLocaleString() : ''
                        setForm(f => ({ ...f, ...(vendor ? { counter: vendor } : {}), ...(amt ? { amount: amt } : {}) }))
                        if (vendor) setCounterSearch('')
                        // 만기일 → 지급예정일 연동
                        if (matchNote.maturityDate) {
                          setIsPayable(true)
                          setExpectedDate(matchNote.maturityDate)
                        }
                      }
                    }
                  }
                }} className="w-full px-2.5 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[12px] text-[var(--text-primary)] focus:outline-none focus:border-primary-500">
                  <option value="">— 선택 —</option>
                  {bankGroups.map(bg => (
                    <optgroup key={bg.bank.name} label={`${bg.bank.name}${bg.bank.bankName ? ' (' + bg.bank.bankName + ')' : ''} [잔액 ${bg.balance.toLocaleString()}원]`}>
                      <option value={`계좌:${bg.bank.name}`}>계좌이체{bg.bank.accountNumber ? ' • ' + bg.bank.accountNumber : ''}</option>
                      {bg.cards.map((card: any) => (
                        <option key={card.id || card.cardNumber} value={`카드:${card.cardName || card.cardNumber}`}>💳 {card.cardName || '카드'}{card.cardNumber ? ' ' + card.cardNumber : ''}</option>
                      ))}
                    </optgroup>
                  ))}
                  {payOpts.filter(o => o.group === '현금').length > 0 && (
                    <optgroup label="💵 현금">
                      {payOpts.filter(o => o.group === '현금').map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </optgroup>
                  )}
                  {payOpts.filter(o => o.group === '어음').length > 0 && (
                    <optgroup label="📄 어음">
                      {payOpts.filter(o => o.group === '어음').map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </optgroup>
                  )}
                  {payOpts.filter(o => o.group === '상품권').length > 0 && (
                    <optgroup label="🎟️ 상품권">
                      {payOpts.filter(o => o.group === '상품권').map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </optgroup>
                  )}
                </select>
              )
            })()}
          </div>
          {type !== 'expense' && (
          <div>
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">{type === 'income' ? '전표 등록일자' : '전표작성일자'}</label>
            <DatePicker value={form.writeDate} onChange={v => setForm(f => ({ ...f, writeDate: v }))} />
          </div>
          )}
          <div>
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">{type === 'income' ? '실제거래일자' : '실제거래일자'}</label>
            <DatePicker value={form.tradeDate} onChange={v => setForm(f => ({ ...f, tradeDate: v }))} />
          </div>
          {/* 미수금 옵션 (입금전표) */}
          {type === 'income' && (
            <div className="bg-orange-50/60 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg p-2.5 col-span-2">
              <div className="flex items-center gap-3 flex-wrap">
                <button type="button" onClick={() => { setIsReceivable(!isReceivable); if (isReceivable) setExpectedDate('') }} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isReceivable ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transform transition-transform ${isReceivable ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                  </button>
                  <span className="text-[11px] font-bold text-orange-700 dark:text-orange-400 flex items-center gap-1"><ArrowDownCircle size={12} /> 미수금</span>
                <div className={`flex items-center gap-1.5 transition-opacity ${isReceivable ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                  <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 whitespace-nowrap">입금예정일</span>
                  <DatePicker value={expectedDate} onChange={v => setExpectedDate(v)} />
                </div>
              </div>
            </div>
          )}
          {/* 미지급금 옵션 (출금전표) */}
          {type === 'withdrawal' && (
            <div className="bg-violet-50/60 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800 rounded-lg p-2.5 col-span-2">
              <div className="flex items-center gap-3 flex-wrap">
                <button type="button" onClick={() => { setIsPayable(!isPayable); if (isPayable) setExpectedDate('') }} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isPayable ? 'bg-violet-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transform transition-transform ${isPayable ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                  </button>
                  <span className="text-[11px] font-bold text-violet-700 dark:text-violet-400 flex items-center gap-1"><ArrowUpCircle size={12} /> 미지급금</span>
                <div className={`flex items-center gap-1.5 transition-opacity ${isPayable ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                  <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 whitespace-nowrap">지급예정일</span>
                  <DatePicker value={expectedDate} onChange={v => setExpectedDate(v)} />
                </div>
              </div>
            </div>
          )}
          {/* 전표날짜 (기존 입력일자) */}
          {type === 'expense' && (
          <div>
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">전표날짜</label>
            <DatePicker value={form.inputDate} onChange={v => setForm(f => ({ ...f, inputDate: v }))} />
          </div>
          )}
        </div>
        {/* 담당자 (출금전표) */}
        {type === 'withdrawal' && (
          <div className="pt-2">
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">담당자</label>
            <CustomSelect
              value={form.manager}
              onChange={v => setForm(f => ({ ...f, manager: v }))}
              placeholder="— 담당자 선택 —"
              options={[
                { value: '', label: '— 담당자 선택 —' },
                ...staffList.map(s => ({ value: s.name, label: s.name })),
              ]}
            />
          </div>
        )}
        {
          (() => {
            const isSelfMode = type === 'withdrawal' && (!form.manager || form.manager === currentUserName)
            return (
              <div>
                <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">{isSelfMode ? '품의사유' : '비고'}</label>
                <textarea
                  value={(form as any).memo || ''}
                  onChange={e => setForm(f => ({ ...f, memo: e.target.value } as any))}
                  placeholder={isSelfMode ? '품의 사유를 입력하세요' : '참고 사항을 입력하세요'}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none resize-none h-[56px]"
                />
              </div>
            )
          })()
        }
        {/* 첨부파일 (출금전표 - 담당자 본인일 때만) */}
        {type === 'withdrawal' && (!form.manager || form.manager === currentUserName) && (
          <div className="pt-1">
            <div className="flex items-center gap-2">
              <label className="text-[10.5px] font-bold text-[var(--text-muted)] flex items-center gap-1"><Paperclip size={11} /> 첨부파일 (영수증/증빙)</label>
              {wdAttachments.length > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 font-bold">{wdAttachments.length}건</span>}
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <button type="button" onClick={() => { setWdEvidenceOpen(true); setWdEvidenceEdit(true) }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-[var(--border-default)] text-[11px] font-bold text-[var(--text-muted)] hover:border-primary-400 hover:text-primary-500 cursor-pointer transition-colors">
                <Paperclip size={12} /> {wdAttachments.length > 0 ? '증빙 편집' : '증빙 첨부'}
              </button>
              {wdAttachments.length > 0 && (
                <button type="button" onClick={() => { setWdEvidenceOpen(true); setWdEvidenceEdit(false) }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-default)] text-[11px] font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] cursor-pointer transition-colors">
                  <Eye size={12} /> 미리보기
                </button>
              )}
            </div>
          </div>
        )}
        {/* 증빙서류 문서 뷰 (PrintApprovalForm) */}
        {wdEvidenceOpen && (() => {
          const budgetCats: BudgetCat[] = getItem('acct_budget_cats', [])
          const selectedCat = budgetCats.find(c => String(c.id) === String(selectedBudgetCat))
          const catName = selectedCat?.name || wdCatName || ''
          const amt = parseInt((form.amount || '0').replace(/,/g, '')) || 0
          const allStaff = getItem<any[]>('ws_users', [])
          let autoApprover = ''
          if (selectedCat) {
            if ((selectedCat as any).approvers && (selectedCat as any).approvers.length > 0) autoApprover = (selectedCat as any).approvers[0]
            else { const ap = allStaff.find(s => s.approverType === 'approver'); if (ap) autoApprover = ap.name }
          }
          const applicantStaff = allStaff.find(s => s.name === currentUserName)
          const approverStaff = allStaff.find(s => s.name === autoApprover)
          return (
            <PrintApprovalForm
              readOnly={false}
              data={{
                date: form.tradeDate || today,
                expenseDate: form.tradeDate || today,
                accountName: wdBudgetItem || '',
                evidenceType: catName,
                vendor: form.counter || '',
                itemName: form.desc || '',
                purpose: form.subItem || '',
                amount: amt,
                memo: (form as any).memo || '',
                applicant: currentUserName,
                approver: autoApprover,
                applicantSealImg: applicantStaff?.sealImg || '',
                approverSealImg: '',
                applicantPosition: applicantStaff?.position || '',
                approverPosition: approverStaff?.position || '',
                approvalStatus: 'preExpense',
                attachments: wdAttachments.map(a => ({
                  name: a.name,
                  type: a.data?.startsWith('data:image') ? 'image/jpeg' : 'application/octet-stream',
                  dataUrl: a.data,
                  title: a.title,
                  printWidth: a.printWidth,
                  row: a.row,
                })),
                approvalType: '선지출',
                department: (applicantStaff as any)?.department || (applicantStaff as any)?.dept || '',
              }}
              onClose={() => setWdEvidenceOpen(false)}
              onUpdateAttachments={(updated) => {
                setWdAttachments(updated.map(a => ({
                  name: a.name,
                  data: (a as any).dataUrl || '',
                  size: 0,
                  title: a.title,
                  printWidth: a.printWidth,
                  row: a.row,
                })))
              }}
              actions={
                <>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 12, background: '#4f6ef7', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,.1)' }}>
                    <Paperclip size={14} /> 증빙첨부
                    <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.hwp" style={{ display: 'none' }} onChange={e => {
                      const files = e.target.files
                      if (!files) return
                      let fileIdx = 0
                      Array.from(files).forEach(file => {
                        const currentFileIdx = fileIdx++
                        const reader = new FileReader()
                        reader.onload = () => {
                          if (file.type.startsWith('image/')) {
                            const img = new Image()
                            img.onload = () => {
                              const MAX = 800; let w = img.width, h = img.height
                              if (w > MAX || h > MAX) { if (w > h) { h = Math.round(h * MAX / w); w = MAX } else { w = Math.round(w * MAX / h); h = MAX } }
                              const c = document.createElement('canvas'); c.width = w; c.height = h
                              const ctx = c.getContext('2d'); ctx?.drawImage(img, 0, 0, w, h)
                              const compressed = c.toDataURL('image/jpeg', 0.7)
                              setWdAttachments(prev => {
                                const maxRow = prev.reduce((m, a) => Math.max(m, a.row ?? 0), -1)
                                return [...prev, { name: file.name, data: compressed, size: file.size, title: file.name.replace(/\.[^/.]+$/, ''), printWidth: 180, row: maxRow + 1 + currentFileIdx }]
                              })
                            }
                            img.src = reader.result as string
                          } else {
                            setWdAttachments(prev => {
                              const maxRow = prev.reduce((m, a) => Math.max(m, a.row ?? 0), -1)
                              return [...prev, { name: file.name, data: reader.result as string, size: file.size, title: file.name.replace(/\.[^/.]+$/, ''), printWidth: 150, row: maxRow + 1 + currentFileIdx }]
                            })
                          }
                        }
                        reader.readAsDataURL(file)
                      })
                      e.target.value = ''
                    }} />
                  </label>
                  {wdAttachments.length > 0 && (
                    <button type="button" onClick={() => setWdEvidenceOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 12, background: '#8b5cf6', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,.1)' }}>
                      <Check size={14} /> 증빙완료
                    </button>
                  )}
                </>
              }
            />
          )
        })()}
        <div className="flex justify-end">
          <button onClick={saveEntry} className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white text-sm font-bold cursor-pointer shadow-md bg-gradient-to-r ${typeGrads[type]}`}>
            <Save size={14} /> {type === 'income' ? '입금 등록' : (type === 'withdrawal' && (!form.manager || form.manager === currentUserName) ? '결의품의' : '지출 등록')}
          </button>
        </div>
      </div>
      )}
      </>
      )}

      {/* ── 지출대기 리스트 (승인된 품의) ── */}
      {type === 'expense' && expenseTab === 'waiting' && (() => {
        const approvals = getItem<Approval[]>('acct_approvals', [])
        const cats: BudgetCat[] = getItem('acct_budget_cats', [])
        // 사용자가 지출담당자로 등록된 모든 카테고리 (ID + 이름 매칭)
        const userName = currentUserName
        const userCatIds = new Set(cats.filter(c => c.users && c.users.includes(userName)).map(c => String(c.id)))
        const userCatNames = new Set(cats.filter(c => c.users && c.users.includes(userName)).map(c => c.name))
        const staffListData = getItem<any[]>('ws_users', [])
        const curStaff = staffListData.find(s => s.name === userName)
        const isApprover = curStaff?.approverType === 'approver'
        const approved = approvals.filter(a => {
          if (a.status !== 'approved') return false
          // 예산구분이 없는 항목은 지출대기에 표시하지 않음
          const aCatId = String((a as any).budgetCatId || '')
          if (selectedBudgetCat && selectedBudgetCat !== 'all') {
            if (aCatId !== String(selectedBudgetCat)) return false
          }
          const aCatName = (a as any).budgetCatName || ''
          if (!aCatId && !aCatName) return false
          // ID로 매칭
          if (aCatId && userCatIds.has(aCatId)) return true
          // 이름으로 매칭
          if (aCatName && userCatNames.has(aCatName)) return true
          // 승인자는 모든 항목 볼 수 있음
          if (isApprover) return true
          return false
        })
        if (approved.length === 0) return null
        const getCatName = (a: any) => {
          if (a.budgetCatName) return a.budgetCatName
          if (a.budgetCatId) {
            const cat = cats.find(c => String(c.id) === String(a.budgetCatId))
            return cat?.name || ''
          }
          return ''
        }
        return (
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)] bg-amber-50/50 dark:bg-amber-900/5">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-amber-500" />
                <span className="text-sm font-extrabold text-[var(--text-primary)]">지출대기 리스트</span>
                <span className="text-[10px] text-white bg-amber-500 px-2 py-0.5 rounded-full font-bold">{approved.length}건</span>
              </div>
              <span className="text-[11px] text-[var(--text-muted)]">승인된 품의를 클릭하면 지출 입력으로 이동합니다</span>
            </div>
            <div className="divide-y divide-[var(--border-default)]">
              {approved.map(a => (
                <div key={a.id} className="flex items-center gap-3 px-4 py-3 hover:bg-amber-50/30 dark:hover:bg-amber-900/5 transition-colors cursor-pointer group"
                  onClick={() => {
                    const aa = a as any
                    // 승인 시 설정된 예산목/세목 조회
                    const allBudgets: BudgetItem[] = getItem('acct_budgets', [])
                    let budgetItemName = aa.budgetItem || ''
                    let budgetSubItemName = aa.budgetSubItem || ''
                    if (aa.budgetItemId) {
                      const bi = allBudgets.find(b => String(b.id) === String(aa.budgetItemId))
                      if (bi) budgetItemName = bi.itemName || budgetItemName
                    }
                    if (aa.budgetSubId) {
                      const bs = allBudgets.find(b => String(b.id) === String(aa.budgetSubId))
                      if (bs) budgetSubItemName = bs.subItemName || bs.itemName || budgetSubItemName
                    }
                    // 예산 카테고리의 지출수단 자동 선택
                    const budgetCatsAll: BudgetCat[] = getItem('acct_budget_cats', [])
                    const matchedCat = aa.budgetCatId ? budgetCatsAll.find(c => String(c.id) === String(aa.budgetCatId)) : null
                    let autoMethod = ''
                    if (matchedCat?.accounts && matchedCat.accounts.length > 0) {
                      // 모든 계좌+카드 옵션 수집
                      const allPayOpts: string[] = []
                      matchedCat.accounts.forEach(acct => {
                        if (acct.bankName) allPayOpts.push(`계좌:${acct.bankName}`)
                        if (acct.cards) acct.cards.forEach(card => allPayOpts.push(`카드:${card}`))
                      })
                      // 1개면 자동선택, 복수면 선택하도록 빈값
                      if (allPayOpts.length === 1) autoMethod = allPayOpts[0]
                    }
                    setForm(f => ({
                      ...f,
                      desc: budgetItemName || a.title || a.description || '',
                      subItem: budgetSubItemName || '',
                      amount: a.amount ? a.amount.toLocaleString('ko-KR') : '',
                      counter: '',
                      tradeDate: today,
                      inputDate: today,
                      manager: a.applicant || '',
                      expenseManager: user?.name || '',
                      method: autoMethod,
                    }))
                    setIsFromApproval(true)
                    setSelectedApprovalId(String(a.id))
                    // 예산 항목에서 계정코드 조회 (정식 코드 우선)
                    let resolvedAcctCode = aa.accountCode || ''
                    if (aa.budgetItemId) {
                      const bi = allBudgets.find(b => String(b.id) === String(aa.budgetItemId))
                      if (bi?.accountCode) resolvedAcctCode = bi.accountCode
                    }
                    if (aa.budgetSubId) {
                      const bs = allBudgets.find(b => String(b.id) === String(aa.budgetSubId))
                      if (bs?.accountCode) resolvedAcctCode = bs.accountCode
                    }
                    // budgetItem 이름으로 예산 항목 조회하여 정식 계정코드 매칭
                    if (resolvedAcctCode && !resolvedAcctCode.includes('-') && budgetItemName) {
                      const matchedBi = allBudgets.find(b => b.itemName === budgetItemName)
                      if (matchedBi?.accountCode?.includes('-')) resolvedAcctCode = matchedBi.accountCode
                    }
                    setApprovalMeta({
                      approver: aa.approver || '-',
                      requestDate: (aa.date || aa.createdAt?.slice(0,10) || '-'),
                      approvedDate: (aa.approvedAt?.slice(0,10) || '-'),
                      budgetCatName: getCatName(a) || '-',
                      accountCode: resolvedAcctCode,
                      budgetCatId: aa.budgetCatId ? String(aa.budgetCatId) : undefined,
                    })
                    setDescMode('select')
                    setShowExpenseModal(true)
                  }}>
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                    <ShieldCheck size={14} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-bold text-[var(--text-primary)] truncate">{a.title || a.description || '(제목없음)'}</span>
                      {getCatName(a) && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400 font-bold whitespace-nowrap shrink-0">{getCatName(a)}</span>
                      )}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)]">
                      품의자: {a.applicant || '-'} · 승인자: {a.approver || '-'} · {a.date || a.createdAt?.slice(0,10) || '-'}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[14px] font-extrabold text-amber-600">{a.amount ? formatNumber(a.amount) : '0'}원</div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-600 dark:bg-green-900/20 font-bold">승인완료</span>
                  </div>
                  <div className="text-[var(--text-muted)] group-hover:text-primary-500 transition-colors shrink-0">
                    <ChevronDown size={14} className="-rotate-90" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* ── 내역 리스트 ── */}
      {(type !== 'expense' || expenseTab === 'history') && (
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden min-h-[420px] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-2">
            <ScrollText size={14} className="text-primary-500" />
            <span className="text-sm font-extrabold text-[var(--text-primary)]">{type === 'income' ? '입금' : '지출'} 내역</span>
            {type === 'withdrawal' && <span className="text-[9px] text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded font-bold">대체 포함</span>}
            <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-muted)] px-2 py-0.5 rounded-full">{cashflows.length}건</span>
          </div>
          <span className="text-[13px] font-extrabold" style={{ color: typeColors[type] }}>{formatNumber(totalAmount)}원</span>
        </div>
        {cashflows.length === 0 ? (
          <div className="p-6"><EmptyState emoji={typeEmojis[type]} title={`등록된 ${type === 'income' ? '입금' : '지출'}이 없습니다`} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="bg-[var(--bg-muted)]">
                  {['날짜', '내용', ...(type === 'income' ? ['입금내용'] : ['담당자', '품의상태']), '금액', '삭제'].map(h => (
                    <th key={h} className={cn('py-2.5 px-3.5 text-[11px] font-bold text-[var(--text-muted)]',
                      h === '금액' ? 'text-right' : h === '삭제' ? 'text-center w-[50px]' : h === '품의상태' ? 'text-center w-[80px]' : h === '담당자' ? 'text-center w-[70px]' : 'text-left')}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cashflows.map(c => (
                  <tr key={c.id} className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-muted)] transition-colors">
                    <td className="py-2.5 px-3.5 text-[12px] text-[var(--text-secondary)]">{c.date || ''}</td>
                    <td className="py-2.5 px-3.5 text-[12px] font-bold text-[var(--text-primary)]">{(c as any).type === 'transfer' ? <><RefreshCw size={11} className="inline text-amber-500 mr-1" /></> : ''}{c.description || '-'}{(c as any).type === 'transfer' && (c as any).counter && <span className="text-[10px] text-amber-600 ml-1">({(c as any).counter})</span>}</td>
                    {type === 'income' && (
                      <td className="py-2.5 px-3.5 text-[12px] text-[var(--text-secondary)]">{(c as any).incomeNote || '-'}</td>
                    )}
                    {type !== 'income' && (
                      <td className="py-2.5 px-3.5 text-[11px] text-center text-[var(--text-secondary)]">{(c as any).manager || '-'}</td>
                    )}
                    {type !== 'income' && (() => {
                      // 연결된 품의의 실제 진행상태 자동 표시
                      const sMap: Record<string, { label: string; color: string; bg: string }> = {
                        preExpense: { label: (c as any).type === 'transfer' ? '대체한' : '지출한', color: (c as any).type === 'transfer' ? '#8b5cf6' : '#f97316', bg: (c as any).type === 'transfer' ? 'rgba(139,92,246,.12)' : 'rgba(249,115,22,.12)' },
                        pending: { label: '품의한', color: '#3b82f6', bg: 'rgba(59,130,246,.12)' },
                        approved: { label: '승인', color: '#22c55e', bg: 'rgba(34,197,94,.12)' },
                        rejected: { label: '반려', color: '#ef4444', bg: 'rgba(239,68,68,.12)' },
                        expensed: { label: '지출', color: '#8b5cf6', bg: 'rgba(139,92,246,.12)' },
                        toResolve: { label: '결의', color: '#6366f1', bg: 'rgba(99,102,241,.12)' },
                        confirming: { label: '정산중', color: '#0ea5e9', bg: 'rgba(14,165,233,.12)' },
                        completed: { label: '완료', color: '#10b981', bg: 'rgba(16,185,129,.12)' },
                      }
                      let statusLabel = '미연결'
                      let statusColor = '#94a3b8'
                      let statusBg = 'rgba(148,163,184,.12)'
                      const allAp: any[] = getItem('acct_approvals', [])
                      let aId = (c as any).approvalId
                      // approvalId가 없으면 제목/금액으로 매칭 시도
                      if (!aId && c.description) {
                        const matched = allAp.find((a: any) =>
                          (a.title?.includes(c.description) || a.description?.includes(c.description)) && a.amount === c.amount
                        ) || allAp.find((a: any) =>
                          a.title?.includes(c.description)
                        )
                        if (matched) {
                          aId = String(matched.id)
                          // 자동 연결 저장
                          const allCfs = getItem<CashFlow[]>('acct_cashflows', [])
                          const ci = allCfs.findIndex(x => String(x.id) === String(c.id))
                          if (ci >= 0) { (allCfs[ci] as any).approvalId = aId; setItem('acct_cashflows', allCfs) }
                        }
                      }
                      if (aId) {
                        const linked = allAp.find((a: any) => String(a.id) === String(aId))
                        if (linked) {
                          const si = sMap[linked.status] || { label: linked.status, color: '#64748b', bg: 'rgba(100,116,139,.12)' }
                          statusLabel = si.label
                          statusColor = si.color
                          statusBg = si.bg
                        }
                      }
                      return (
                        <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${statusLabel === '반려' ? 'cursor-pointer hover:ring-2 hover:ring-red-300 transition-all' : ''}`}
                            style={{ background: statusBg, color: statusColor }}
                            onClick={() => {
                              if (statusLabel === '반려' && aId) {
                                // 반려된 품의: cashflow + approval 데이터를 폼에 채움
                                const cf = c as any
                                const apAll: any[] = getItem('acct_approvals', [])
                                const ap = apAll.find((a: any) => String(a.id) === String(aId))
                                const rawAmt = cf.amount || ap?.amount || 0
                                setForm(prev => ({
                                  ...prev,
                                  desc: cf.description || ap?.title?.replace('[선지출] ', '') || '',
                                  amount: rawAmt ? Number(rawAmt).toLocaleString('ko-KR') : '',
                                  writeDate: cf.date || today,
                                  tradeDate: cf.tradeDate || cf.date || today,
                                  manager: cf.manager || ap?.applicant || '',
                                  counter: cf.counter || ap?.counter || '',
                                  method: cf.method || ap?.method || '계좌이체',
                                  subItem: cf.subItem || ap?.budgetSubItem || '',
                                  detailItem: cf.detailItem || ap?.budgetDetailItem || '',
                                  memo: cf.memo || ap?.description || '',
                                } as any))
                                // 거래처 검색 필드
                                setCounterSearch(cf.counter || ap?.counter || '')
                                // 예산 카테고리 설정 (approval에서 우선)
                                const catId = cf.budgetCatId || ap?.budgetCatId || ''
                                if (catId) setSelectedBudgetCat(String(catId))
                                // 예산항목 (approval에서 가져옴)
                                const budgetItem = ap?.budgetItem || cf.budgetItem || ''
                                if (budgetItem) setWdBudgetItem(budgetItem)
                                // 예산 카테고리명
                                const catName = ap?.budgetCatName || cf.budgetCatName || ''
                                if (catName) setWdCatName(catName)
                                // 예산 통합 검색 필드에 선택된 값 표시
                                const subItem = cf.subItem || ap?.budgetSubItem || ''
                                const detailItem = cf.detailItem || ap?.budgetDetailItem || ''
                                const searchLabel = [catName, budgetItem, subItem, detailItem].filter(Boolean).join(' > ')
                                if (searchLabel) setWdSearchSelected(searchLabel)
                                // 첨부파일 (approval에서 우선)
                                const attachments = ap?.attachments || cf.attachments
                                if (attachments) setWdAttachments(attachments)
                                // 편집 중인 approval ID 저장
                                setSelectedApprovalId(aId)
                                // 스크롤 위로
                                window.scrollTo({ top: 0, behavior: 'smooth' })
                              }
                            }}
                            title={statusLabel === '반려' ? '클릭하여 수정' : ''}
                          >
                            {statusLabel}
                          </span>
                        </td>
                      )
                    })()}
                    <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-right" style={{ color: typeColors[type] }}>{formatNumber(c.amount || 0)}원</td>
                    <td className="py-2.5 px-3.5 text-center">
                      {(() => {
                        // 정산중/완료 상태만 삭제 불가 (결의 전은 삭제 가능)
                        const allAp: any[] = getItem('acct_approvals', [])
                        const linkedAp = (c as any).approvalId ? allAp.find((a: any) => String(a.id) === String((c as any).approvalId)) : null
                        const lockedStatuses = ['confirming', 'completed']
                        const isLocked = linkedAp && lockedStatuses.includes(linkedAp.status)
                        if (isLocked) return <span className="text-[10px] text-[var(--text-muted)]">🔒</span>
                        return <button onClick={() => deleteEntry(c.id)} className="p-1 rounded-md bg-[rgba(239,68,68,.08)] text-[#ef4444] hover:bg-[rgba(239,68,68,.15)] cursor-pointer"><Trash2 size={13} /></button>
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* ═══ 지출등록 팝업 모달 (expense 전용) ═══ */}
      {type === 'expense' && showExpenseModal && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          {/* 오버레이 */}
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowExpenseModal(false)} />
          {/* 모달 콘텐츠 */}
          <div className="flex min-h-full items-center justify-center py-8 px-4">
          <div className="relative w-full max-w-2xl rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-2xl">
            {/* 모달 헤더 */}
            <div className={`bg-gradient-to-r ${typeGrads[type]} rounded-t-2xl p-4 text-white`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-xl">{typeEmojis[type]}</div>
                  <div>
                    <div className="text-[17px] font-extrabold">지출 등록</div>
                    <div className="text-[11.5px] opacity-85">승인된 품의의 지출 내역을 입력하세요</div>
                  </div>
                </div>
                <button onClick={() => setShowExpenseModal(false)} className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center cursor-pointer transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>
            {/* ── 상단: 품의 정보 (읽기전용) ── */}
            <div className="p-4 space-y-3 border-b border-[var(--border-default)] bg-amber-50/60 dark:bg-amber-900/5">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[11px] font-bold text-amber-600">📋 품의 정보</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
                <div>
                  <div className="text-[9.5px] font-bold text-[var(--text-muted)] mb-0.5">예산구분</div>
                  <div className="text-[12px] font-bold text-[var(--text-primary)]">{approvalMeta.budgetCatName || '-'}</div>
                </div>
                <div>
                  <div className="text-[9.5px] font-bold text-[var(--text-muted)] mb-0.5">예산목</div>
                  <div className="text-[12px] font-bold text-[var(--text-primary)]">{form.desc || '-'}</div>
                </div>
                <div>
                  <div className="text-[9.5px] font-bold text-[var(--text-muted)] mb-0.5">예산세목</div>
                  <div className="text-[12px] font-bold text-[var(--text-primary)]">{form.subItem || '-'}</div>
                </div>
                <div>
                  <div className="text-[9.5px] font-bold text-[var(--text-muted)] mb-0.5">계정과목</div>
                  <div className="text-[12px] font-bold text-primary-600">
                    {(() => {
                      const code = approvalMeta.accountCode
                      if (!code) return '-'
                      // 1) 정확한 코드 매칭
                      let found = acctAccounts.find(a => a.code === code)
                      // 2) 대시 제거 매칭
                      if (!found) found = acctAccounts.find(a => a.code.replace(/-/g, '') === code.replace(/-/g, ''))
                      // 3) 예산목 이름으로 매칭 (시드 데이터 호환)
                      if (!found && form.desc) found = acctAccounts.find(a => a.name === form.desc)
                      return found ? `${found.code} ${found.name}` : code
                    })()}
                  </div>
                </div>
                <div>
                  <div className="text-[9.5px] font-bold text-[var(--text-muted)] mb-0.5">금액</div>
                  <div className="text-[14px] font-extrabold text-[#ef4444]">{form.amount || '0'}원</div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 pt-1">
                <div>
                  <div className="text-[9.5px] font-bold text-[var(--text-muted)] mb-0.5">품의자</div>
                  <div className="text-[12px] text-[var(--text-secondary)]">{form.manager || '-'}</div>
                </div>
                <div>
                  <div className="text-[9.5px] font-bold text-[var(--text-muted)] mb-0.5">품의일</div>
                  <div className="text-[12px] text-[var(--text-secondary)]">{approvalMeta.requestDate || '-'}</div>
                </div>
                <div>
                  <div className="text-[9.5px] font-bold text-[var(--text-muted)] mb-0.5">승인자</div>
                  <div className="text-[12px] text-[var(--text-secondary)]">{approvalMeta.approver || '-'}</div>
                </div>
                <div>
                  <div className="text-[9.5px] font-bold text-[var(--text-muted)] mb-0.5">승인일</div>
                  <div className="text-[12px] text-[var(--text-secondary)]">{approvalMeta.approvedDate || '-'}</div>
                </div>
                <div>
                  <div className="text-[9.5px] font-bold text-[var(--text-muted)] mb-0.5">지출담당자</div>
                  <div className="text-[12px] font-bold text-primary-600">{user?.name || '-'}</div>
                </div>
              </div>
            </div>

            {/* ── 하단: 지출 입력 ── */}
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[11px] font-bold text-[var(--text-muted)]">✏️ 지출 입력</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 거래처 */}
                <div ref={counterRef} className="relative">
                  <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">거래처</label>
                  <input value={counterSearch || form.counter} onChange={e => { setCounterSearch(e.target.value); setShowCounterList(true); setForm(f => ({ ...f, counter: '' })) }}
                    onFocus={() => setShowCounterList(true)} placeholder="거래처명 검색..." className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none" />
                  {showCounterList && (
                    <div className="absolute z-[10000] left-0 right-0 top-full mt-1 max-h-[200px] overflow-y-auto rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-lg">
                      {vendorOptions
                        .filter(v => !counterSearch || v.label.toLowerCase().includes(counterSearch.toLowerCase()))
                        .map((v, i) => (
                          <button key={i} onClick={() => {
                            setForm(f => ({ ...f, counter: v.value }))
                            setCounterSearch('')
                            setShowCounterList(false)
                          }}
                            className="w-full text-left px-3 py-2 text-[13px] text-[var(--text-primary)] hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer border-none bg-transparent flex items-center justify-between">
                            <span>{v.label}</span>
                            {v.catName && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 font-bold ml-2 shrink-0">{v.catName}</span>}
                          </button>
                        ))}
                      {vendorOptions.filter(v => !counterSearch || v.label.toLowerCase().includes(counterSearch.toLowerCase())).length === 0 && (
                        <div className="px-3 py-2 text-[12px] text-[var(--text-muted)]">검색 결과가 없습니다</div>
                      )}
                    </div>
                  )}
                </div>
                {/* 지출수단 */}
                <div>
                  <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">지출수단</label>
                  {(() => {
                    // 품의 연동일 때 예산 카테고리의 실제 계좌/카드 목록 생성
                    const catIdVal = isFromApproval ? approvalMeta.budgetCatId : selectedBudgetCat
                    const payOptions: {value:string; label:string; group:string}[] = []
                    // 지출수단 관리에서 등록된 수단만 사용 (예산구분별 필터)
                    const allPM: PayMethodItem[] = (() => { try { return JSON.parse(localStorage.getItem('acct_pay_methods_v2') || '[]') } catch { return [] } })()
                    const filteredPMRaw = catIdVal
                      ? allPM.filter(p => String(p.budgetCatId) === String(catIdVal))
                      : []
                    // 같은 이름+카테고리 중복 제거
                    const seenPM = new Set<string>()
                    const filteredPM = filteredPMRaw.filter(p => {
                      const key = `${p.category}:${p.name}`
                      if (seenPM.has(key)) return false
                      seenPM.add(key)
                      return true
                    })
                    // 계좌 + 하위 카드 그룹
                    const bankGroups2: {bank: typeof filteredPM[0]; cards: any[]}[] = []
                    filteredPM.filter(p => p.category === '계좌').forEach(p => {
                      bankGroups2.push({ bank: p, cards: p.cards || [] })
                    })
                    filteredPM.filter(p => p.category === '현금').forEach(p => payOptions.push({ value: p.name, label: `💵 ${p.name}`, group: '현금' }))
                    // 어음: notes(실제 어음 리스트)가 있는 항목만 표시
                    filteredPM.filter(p => p.category === '어음' && p.notes && p.notes.length > 0).forEach(p => {
                      const validNotes = p.notes.filter((note: any) => (note.noteNumber && String(note.noteNumber).trim()) || (note.amount && Number(note.amount) > 0))
                      if (validNotes.length === 0) return
                      validNotes.forEach((note: any) => {
                        const typeLabel = p.noteType === '발행' ? '발행' : '수신'
                        const amt = note.amount ? Number(note.amount).toLocaleString() + '원' : ''
                        const label = `📄 ${p.name} - ${typeLabel} ${note.noteNumber || ''} ${amt}`.trim()
                        payOptions.push({ value: `어음:${p.name}:${note.id}`, label, group: '어음' })
                      })
                    })
                    filteredPM.filter(p => p.category === '상품권').forEach(p => payOptions.push({ value: p.name, label: `🎟️ ${p.name}`, group: '상품권' }))
                    return (
                      <select value={form.method} onChange={e => {
                        const val = e.target.value
                        setForm(f => ({ ...f, method: val }))
                        if (val.startsWith('어음:')) {
                          const parts = val.split(':')
                          const itemName = parts[1]
                          const noteId = Number(parts[2])
                          const matchItem = filteredPM.find(p => p.name === itemName)
                          if (matchItem) {
                            const matchNote = (matchItem.notes || []).find((n: any) => n.id === noteId)
                            if (matchNote) {
                              const vendor = matchItem.noteType === '발행' ? (matchNote.receiver || '') : (matchNote.issuer || '')
                              const amt = matchNote.amount ? Number(matchNote.amount).toLocaleString() : ''
                              setForm(f => ({ ...f, ...(vendor ? { counter: vendor } : {}), ...(amt ? { amount: amt } : {}) }))
                              if (vendor) setCounterSearch('')
                              if (matchNote.maturityDate) {
                                setIsPayable(true)
                                setExpectedDate(matchNote.maturityDate)
                              }
                            }
                          }
                        }
                      }} className="w-full px-2.5 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[12px] text-[var(--text-primary)] focus:outline-none focus:border-primary-500">
                        <option value="">— 선택 —</option>
                        {bankGroups2.map(bg => (
                          <optgroup key={bg.bank.name} label={`🏦 ${bg.bank.name}${bg.bank.bankName ? ' (' + bg.bank.bankName + ')' : ''}`}>
                            <option value={`계좌:${bg.bank.name}`}>계좌이체{bg.bank.accountNumber ? ' • ' + bg.bank.accountNumber : ''}</option>
                            {bg.cards.map((card: any) => (
                              <option key={card.id || card.cardNumber} value={`카드:${card.cardName || card.cardNumber}`}>💳 {card.cardName || '카드'}{card.cardNumber ? ' ' + card.cardNumber : ''}</option>
                            ))}
                          </optgroup>
                        ))}
                        {payOptions.filter(o => o.group === '현금').length > 0 && (
                          <optgroup label="💵 현금">
                            {payOptions.filter(o => o.group === '현금').map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </optgroup>
                        )}
                        {payOptions.filter(o => o.group === '어음').length > 0 && (
                          <optgroup label="📄 어음">
                            {payOptions.filter(o => o.group === '어음').map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </optgroup>
                        )}
                        {payOptions.filter(o => o.group === '상품권').length > 0 && (
                          <optgroup label="🎟️ 상품권">
                            {payOptions.filter(o => o.group === '상품권').map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </optgroup>
                        )}
                      </select>
                    )
                  })()}
                </div>
                {/* 실제거래일자 */}
                <div>
                  <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">실제거래일자</label>
                  <DatePicker value={form.tradeDate} onChange={v => setForm(f => ({ ...f, tradeDate: v }))} />
                </div>
                {/* 전표날짜 */}
                <div>
                  <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">전표날짜</label>
                  <DatePicker value={form.inputDate} onChange={v => setForm(f => ({ ...f, inputDate: v }))} />
                </div>
              </div>
              {/* 비고 */}
              <div>
                <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">비고</label>
                <textarea
                  value={(form as any).memo || ''}
                  onChange={e => setForm(f => ({ ...f, memo: e.target.value } as any))}
                  placeholder="참고 사항을 입력하세요"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none resize-none h-[56px]"
                />
              </div>
              {/* 버튼 */}
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => {
                  setShowExpenseModal(false)
                  setIsFromApproval(false)
                  setSelectedApprovalId(null)
                  setForm(f => ({ ...f, desc: '', subItem: '', amount: '', counter: '', manager: '', memo: '' } as any))
                }} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[var(--text-secondary)] text-sm font-bold cursor-pointer border border-[var(--border-default)] hover:bg-[var(--bg-muted)] transition-colors">
                  취소
                </button>
                <button onClick={() => { saveEntry(); setShowExpenseModal(false) }} className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white text-sm font-bold cursor-pointer shadow-md bg-gradient-to-r ${typeGrads[type]}`}>
                  <Save size={14} /> 지출 등록
                </button>
              </div>
            </div>
          </div>
          </div>
        </div>
      , document.body)}
    </div>
  )
}
