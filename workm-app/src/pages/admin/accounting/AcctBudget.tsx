import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { getItem, setItem } from '../../../utils/storage'
import { formatNumber } from '../../../utils/format'
import { useToastStore } from '../../../stores/toastStore'
import type { BudgetCat, BudgetItem, BudgetItemDef, BudgetSubDef, BudgetDetailDef, AccountPoolEntry, BudgetCatAccount } from './types'
import { Settings, Plus, Trash2, ChevronDown, ChevronUp, Search, Edit3, PieChart, ScrollText, X, Check, Ban, CreditCard, User, Landmark, Calendar, Filter, CheckCircle2, Building2, ArrowLeftRight, Banknote, FileText, Ticket } from 'lucide-react'
import { cn } from '../../../utils/cn'
import { createPortal } from 'react-dom'
import { EmptyState } from '../../../components/common/EmptyState'
import { DatePicker } from '../../../components/ui/DatePicker'
import { useAuthStore } from '../../../stores/authStore'

export default function AcctBudget({ year }: { year: number }) {
  const [selectedCatId, setSelectedCatId] = useState<string | number | null>(null)
  const [refresh, setRefresh] = useState(0)
  const staffListForBudget = useMemo(() => {
    const sl = getItem<any[]>('ws_users', [])
    return sl.filter((s: any) => !s.resignedAt)
  }, [refresh])
  const user = useAuthStore(s => s.user)
  const isBudgetApprover = useMemo(() => {
    const userName = user?.name || ''
    const sl = getItem<any[]>('ws_users', [])
    return sl.find(s => s.name === userName)?.approverType === 'approver'
  }, [user])

  /* ── 모달 상태 ── */
  const [catModalOpen, setCatModalOpen] = useState(false)
  const [catEditId, setCatEditId] = useState<string | number | null>(null)
  const [bankModalOpen, setBankModalOpen] = useState(false)
  const [bankAccounts, setBankAccounts] = useState<any[]>(() => getItem('acct_company_accounts', []))
  const [bankEditId, setBankEditId] = useState<string | number | null>(null)
  const emptyBankForm = { bankName: '', accountNumber: '', accountHolder: '', purpose: '', manager: '', memo: '', cards: [] as any[] }
  const [bankForm, setBankForm] = useState(emptyBankForm)
  const [bankAdding, setBankAdding] = useState(false)
  const [bankExpandedCards, setBankExpandedCards] = useState<Record<string, boolean>>({})
  const [bankAddingCardFor, setBankAddingCardFor] = useState<string | number | null>(null)
  const emptyCardForm = { cardName: '', cardCompany: '', cardNumber: '', cardType: '체크카드', cardUser: '', expiryDate: '' }
  const [bankCardForm, setBankCardForm] = useState(emptyCardForm)
  const [catForm, setCatForm] = useState({ name: '', description: '', bank: '', accounts: [] as BudgetCatAccount[], periodFrom: `${year}-01-01`, periodTo: `${year}-12-31`, users: [] as string[], approver: '' })

  // 계좌관리에서 등록된 계좌+카드 목록
  const registeredAccounts = useMemo(() => {
    try {
      const accts = getItem<any[]>('acct_company_accounts', [])
      return accts.filter((a: any) => a.bankName || a.accountNumber).map((a: any) => ({
        ...a,
        bankName: a.bankName || '',
        accountNumber: a.accountNumber || '',
        accountHolder: a.accountHolder || '',
        cards: a.cards || []
      }))
    } catch { return [] }
  }, [catModalOpen, bankModalOpen])

  const [budgetModalOpen, setBudgetModalOpen] = useState(false)
  const [budgetEditId, setBudgetEditId] = useState<number | null>(null)
  const [budgetForm, setBudgetForm] = useState({ itemName: '', subItemName: '', detailItemName: '', accountCode: '', contraAccountCode: '', amount: '', memo: '', budgetItemDefId: undefined as number | undefined, budgetSubDefId: undefined as number | undefined })
  const [itemNameSearch, setItemNameSearch] = useState('')
  const [itemNamePopup, setItemNamePopup] = useState(false)
  const [subNamePopup, setSubNamePopup] = useState(false)
  const [detailNamePopup, setDetailNamePopup] = useState(false)
  const [acctSearch, setAcctSearch] = useState('')
  const [acctPopup, setAcctPopup] = useState(false)
  const [contraAcctSearch, setContraAcctSearch] = useState('')
  const [contraAcctPopup, setContraAcctPopup] = useState(false)

  /* ── 예산과목 선택 모달 ── */
  const [budgetPickerOpen, setBudgetPickerOpen] = useState(false)
  const [pickerChecked, setPickerChecked] = useState<Set<string>>(new Set())
  const [pickerFilterItem, setPickerFilterItem] = useState<string | null>(null) // 특정 예산목만 표시

  /* ── 인라인 금액 편집 ── */
  const [editingAmountId, setEditingAmountId] = useState<string | number | null>(null)
  const [editingAmountVal, setEditingAmountVal] = useState('')

  /* ── 편성/확정 비밀번호 모달 ── */
  const [budgetStatusModal, setBudgetStatusModal] = useState<{ catId: string | number; catName: string; newStatus: string } | null>(null)
  const [budgetStatusPw, setBudgetStatusPw] = useState('')
  const [budgetStatusPwErr, setBudgetStatusPwErr] = useState('')

  /* ── 동의어 변경 ── */
  const [aliasDropId, setAliasDropId] = useState<string | null>(null) // "item:인건비" / "sub:인건비>기본급" / "det:인건비>기본급>정규직기본급"

  /* ── 피커 모달 내 동의어 팝오버 ── */
  const [pickerAliasPovId, setPickerAliasPovId] = useState<string | null>(null)
  const [pickerAliasInput, setPickerAliasInput] = useState('')
  const [pickerDisplayNames, setPickerDisplayNames] = useState<Record<string, string>>({})
  const [pickerSearch, setPickerSearch] = useState('')

  /* ── 예산카드 수평 드래그 스크롤 ── */
  const catScrollRef = useRef<HTMLDivElement>(null)
  const [isDraggingCat, setIsDraggingCat] = useState(false)
  const catDragState = useRef({ isDown: false, startX: 0, scrollLeft: 0, moved: false })
  const onCatMouseDown = useCallback((e: React.MouseEvent) => {
    const el = catScrollRef.current
    if (!el) return
    catDragState.current = { isDown: true, startX: e.pageX, scrollLeft: el.scrollLeft, moved: false }
    setIsDraggingCat(true)
  }, [])
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!catDragState.current.isDown) return
      e.preventDefault()
      const el = catScrollRef.current
      if (!el) return
      const dx = e.pageX - catDragState.current.startX
      if (Math.abs(dx) > 3) catDragState.current.moved = true
      el.scrollLeft = catDragState.current.scrollLeft - dx
    }
    const onUp = () => {
      if (catDragState.current.isDown) {
        catDragState.current.isDown = false
        setIsDraggingCat(false)
      }
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [])

  /* ── 데이터 ── */
  const budgetCats = useMemo(() => {
    const cats = getItem<BudgetCat[]>('acct_budget_cats', [])
    const yearCats = cats.filter(cat => {
      const pFrom = cat.periodFrom || ''
      const pTo = cat.periodTo || ''
      if (pFrom && pTo) {
        // 사업기간이 해당 연도와 겹치는지 확인
        const yearStart = `${year}-01-01`
        const yearEnd = `${year}-12-31`
        return pFrom <= yearEnd && pTo >= yearStart
      }
      // periodFrom/To 없으면 year 속성으로 폴백
      const catYear = cat.year || (pFrom ? parseInt(pFrom.substring(0, 4)) : new Date().getFullYear())
      return catYear === year
    })
    // 예산승인자/관련자 필터
    const userName = user?.name || ''
    const staffList = getItem<any[]>('ws_users', [])
    const currentStaff = staffList.find(s => s.name === userName)
    const isBudgetApprover = currentStaff?.approverType === 'approver'
    if (isBudgetApprover) return yearCats
    if (userName) {
      return yearCats.filter(c =>
        (c.users && c.users.length > 0 && c.users.includes(userName)) ||
        ((c as any).approvers && (c as any).approvers.length > 0 && (c as any).approvers.includes(userName))
      )
    }
    return yearCats
  }, [year, refresh, user])

  const budgets = useMemo(() => getItem<BudgetItem[]>('acct_budgets', []), [refresh])
  const accounts = useMemo(() => getItem<{ code: string; name: string; type: string; group?: string }[]>('acct_accounts', []), [refresh])
  const expenseAccounts = accounts.filter(a => a.type === 'expense')
  const itemNameHistory = useMemo(() => getItem<string[]>('acct_itemName_history', []), [refresh])

  const budgetItemDefs = useMemo(() => getItem<BudgetItemDef[]>('acct_budget_item_defs', []).sort((a, b) => a.sortOrder - b.sortOrder), [refresh])
  const allItemNames = useMemo(() => budgetItemDefs.map(d => d.name), [budgetItemDefs])
  const selectedItemDef = useMemo(() => budgetItemDefs.find(d => d.name === budgetForm.itemName || d.id === budgetForm.budgetItemDefId), [budgetItemDefs, budgetForm.itemName, budgetForm.budgetItemDefId])
  const availableSubItems = useMemo(() => selectedItemDef?.subItems.sort((a, b) => a.sortOrder - b.sortOrder) || [], [selectedItemDef])
  const selectedSubDef = useMemo(() => availableSubItems.find(s => s.name === budgetForm.subItemName), [availableSubItems, budgetForm.subItemName])
  const availableDetailItems = useMemo(() => (selectedSubDef?.detailItems || []).sort((a, b) => a.sortOrder - b.sortOrder), [selectedSubDef])
  const filteredItemNames = useMemo(() => {
    if (!itemNameSearch.trim()) return allItemNames
    const q = itemNameSearch.toLowerCase()
    return allItemNames.filter(n => {
      if (n.toLowerCase().includes(q)) return true
      const def = budgetItemDefs.find(d => d.name === n)
      if (def?.aliases.some(a => a.toLowerCase().includes(q))) return true
      return false
    })
  }, [allItemNames, itemNameSearch, budgetItemDefs])
  const isNewItemName = itemNameSearch.trim() && !allItemNames.includes(itemNameSearch.trim())

  // 필터링된 계정과목 리스트
  const filteredAccounts = useMemo(() => {
    if (!acctSearch.trim()) return accounts
    const q = acctSearch.toLowerCase()
    return accounts.filter(a => a.code.includes(q) || a.name.toLowerCase().includes(q) || (a.group || '').toLowerCase().includes(q))
  }, [accounts, acctSearch])

  // 상대계정 필터 (자산·부채 계정 위주)
  const filteredContraAccounts = useMemo(() => {
    const contraList = accounts.filter(a => ['asset', 'liability'].includes(a.type))
    if (!contraAcctSearch.trim()) return contraList
    const q = contraAcctSearch.toLowerCase()
    return contraList.filter(a => a.code.includes(q) || a.name.toLowerCase().includes(q) || (a.group || '').toLowerCase().includes(q))
  }, [accounts, contraAcctSearch])

  const selCat = selectedCatId ? budgetCats.find(c => String(c.id) === String(selectedCatId)) : budgetCats[0]
  const filtered = selCat ? budgets.filter(b => String(b.catId) === String(selCat.id)) : []
  const totalAmt = filtered.reduce((a, b) => a + (b.amount || 0), 0)
  const totalSpent = filtered.reduce((a, b) => a + (b.spent || 0), 0)

  const budgetTreeGroups = (() => {
    const grouped = new Map<string, { budgets: typeof filtered; subs: Map<string, { budgets: typeof filtered; details: Map<string, typeof filtered> }> }>()
    filtered.forEach(b => {
      const itemKey = b.itemName || '(미분류)'
      if (!grouped.has(itemKey)) grouped.set(itemKey, { budgets: [] as typeof filtered, subs: new Map() })
      const itemGroup = grouped.get(itemKey)!
      itemGroup.budgets.push(b)
      const subKey = b.subItemName || ''
      if (!itemGroup.subs.has(subKey)) itemGroup.subs.set(subKey, { budgets: [] as typeof filtered, details: new Map() })
      const subGroup = itemGroup.subs.get(subKey)!
      subGroup.budgets.push(b)
      const detailKey = b.detailItemName || ''
      if (!subGroup.details.has(detailKey)) subGroup.details.set(detailKey, [] as typeof filtered)
      subGroup.details.get(detailKey)!.push(b)
    })
    return grouped
  })()

  // 계정 타입별 기본 상대계정 자동 추천
  const suggestContraAccount = (code: string): string => {
    const acct = accounts.find(a => a.code === code)
    if (!acct) return '1-01-03' // 기본: 보통예금
    switch (acct.type) {
      case 'expense': return '1-01-03'   // 비용 → 보통예금(자산 감소)
      case 'revenue': return '1-01-03'   // 수익 → 보통예금(자산 증가)
      case 'asset': return '2-01-04'     // 자산 → 미지급금(부채 증가)
      case 'liability': return '1-01-01' // 부채 → 현금(자산 감소)
      case 'equity': return '1-01-03'    // 자본 → 보통예금
      default: return '1-01-03'
    }
  }

  const colors = ['#4f6ef7', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

  /* ── 구분 CRUD ── */
  const openCatModal = (editId?: string | number) => {
    if (editId) {
      const c = getItem<BudgetCat[]>('acct_budget_cats', []).find(x => String(x.id) === String(editId))
      if (c) {
        setCatEditId(editId)
        setCatForm({ name: c.name || '', description: (c as any).description || '', bank: c.bank || c.bankInfo || '', accounts: c.accounts || (c.bank ? [{ id: Date.now(), bankName: c.bank || c.bankInfo || '', cards: [] }] : []), periodFrom: c.periodFrom || `${year}-01-01`, periodTo: c.periodTo || `${year}-12-31`, users: c.users || [], approver: c.approver || '' })
      }
    } else {
      setCatEditId(null)
      setCatForm({ name: '', description: '', bank: '', accounts: [], periodFrom: `${year}-01-01`, periodTo: `${year}-12-31`, users: [], approver: '' })
    }
    setCatModalOpen(true)
  }

  const saveCat = () => {
    if (!catForm.name.trim()) return
    const all = getItem<BudgetCat[]>('acct_budget_cats', [])
    if (catEditId) {
      const updated = all.map(c => {
        if (String(c.id) !== String(catEditId)) return c
        const y = catForm.periodFrom ? parseInt(catForm.periodFrom.substring(0, 4)) : year
        // 기본 승인권자 + 추가 승인권자를 합쳐 approvers 배열 생성
        const defaultApprover = staffListForBudget.find(s => (s as any).approverType === 'approver')?.name || ''
        const approversList = [defaultApprover, catForm.approver].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i)
        return { ...c, name: catForm.name.trim(), description: catForm.description.trim(), bank: catForm.accounts[0]?.bankName || catForm.bank, bankInfo: catForm.accounts[0]?.bankName || catForm.bank, accounts: catForm.accounts, periodFrom: catForm.periodFrom, periodTo: catForm.periodTo, year: y, users: catForm.users, approver: catForm.approver, approvers: approversList }
      })
      setItem('acct_budget_cats', updated)
    } else {
      const y = catForm.periodFrom ? parseInt(catForm.periodFrom.substring(0, 4)) : year
      const defaultApproverNew = staffListForBudget.find(s => (s as any).approverType === 'approver')?.name || ''
      const approversListNew = [defaultApproverNew, catForm.approver].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i)
      const newCat: BudgetCat = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        name: catForm.name.trim(),
        description: catForm.description.trim(),
        bank: catForm.accounts[0]?.bankName || catForm.bank,
        bankInfo: catForm.accounts[0]?.bankName || catForm.bank,
        accounts: catForm.accounts,
        periodFrom: catForm.periodFrom,
        periodTo: catForm.periodTo,
        year: y,
        users: catForm.users,
        approver: catForm.approver,
        approvers: approversListNew,
      } as any
      all.push(newCat)
      setItem('acct_budget_cats', all)
      setSelectedCatId(newCat.id)
    }
    setCatModalOpen(false)
    setRefresh(r => r + 1)
  }

  const deleteCat = (id: string | number) => {
    if (!confirm('이 예산구분과 관련 예산항목을 모두 삭제하시겠습니까?')) return
    const sid = String(id)
    const cats = getItem<BudgetCat[]>('acct_budget_cats', []).filter(c => String(c.id) !== sid)
    const bds = getItem<BudgetItem[]>('acct_budgets', []).filter(b => String(b.catId) !== sid)
    setItem('acct_budget_cats', cats)
    setItem('acct_budgets', bds)
    if (String(selectedCatId) === sid) setSelectedCatId(null)
    setRefresh(r => r + 1)
  }

  /* ── 예산항목 CRUD ── */
  const openBudgetModal = (editId?: number) => {
    if (editId) {
      const b = budgets.find(x => x.id === editId)
      if (b) {
        setBudgetEditId(editId)
        setBudgetForm({ itemName: b.itemName || '', subItemName: b.subItemName || '', detailItemName: (b as any).detailItemName || '', accountCode: b.accountCode || '', contraAccountCode: b.contraAccountCode || '', amount: formatNumber(b.amount), memo: b.memo || '', budgetItemDefId: (b as any).budgetItemDefId, budgetSubDefId: (b as any).budgetSubDefId })
      }
    } else {
      setBudgetEditId(null)
      setBudgetForm({ itemName: '', subItemName: '', detailItemName: '', accountCode: '', contraAccountCode: '', amount: '', memo: '', budgetItemDefId: undefined, budgetSubDefId: undefined })
    }
    setBudgetModalOpen(true)
    setItemNameSearch('')
    setItemNamePopup(false)
    setSubNamePopup(false)
    setDetailNamePopup(false)
    setAcctSearch('')
    setAcctPopup(false)
    setContraAcctSearch('')
    setContraAcctPopup(false)
  }

  const saveBudgetItem = () => {
    if (!budgetForm.itemName.trim()) return
    const amt = parseInt(budgetForm.amount.replace(/,/g, '')) || 0
    if (amt <= 0) return
    const all = getItem<BudgetItem[]>('acct_budgets', [])
    if (budgetEditId) {
      const updated = all.map(b => {
        if (b.id !== budgetEditId) return b
        return { ...b, itemName: budgetForm.itemName.trim(), subItemName: budgetForm.subItemName.trim(), detailItemName: budgetForm.detailItemName.trim(), accountCode: budgetForm.accountCode, contraAccountCode: budgetForm.contraAccountCode, amount: amt, memo: budgetForm.memo, budgetItemDefId: budgetForm.budgetItemDefId, budgetSubDefId: budgetForm.budgetSubDefId }
      })
      setItem('acct_budgets', updated)
    } else {
      all.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        catId: selCat!.id,
        year,
        itemName: budgetForm.itemName.trim(),
        subItemName: budgetForm.subItemName.trim(),
        detailItemName: budgetForm.detailItemName.trim(),
        accountCode: budgetForm.accountCode,
        contraAccountCode: budgetForm.contraAccountCode,
        amount: amt,
        spent: 0,
        memo: budgetForm.memo,
        budgetItemDefId: budgetForm.budgetItemDefId,
        budgetSubDefId: budgetForm.budgetSubDefId,
      })
      setItem('acct_budgets', all)
    }
    // 새 예산목이면 히스토리에 자동 추가
    const trimName = budgetForm.itemName.trim()
    const hist = getItem<string[]>('acct_itemName_history', [])
    if (!hist.includes(trimName)) {
      setItem('acct_itemName_history', [...hist, trimName])
    }

    setBudgetModalOpen(false)
    setRefresh(r => r + 1)
  }

  const deleteBudgetItem = (id: number) => {
    if (!confirm('이 예산항목을 삭제하시겠습니까?')) return
    const bds = getItem<BudgetItem[]>('acct_budgets', []).filter(b => b.id !== id)
    setItem('acct_budgets', bds)
    setRefresh(r => r + 1)
  }

  /* ── 이름→원래 def 이름 정규화 ── */
  const normalizeItemName = (name: string) => {
    const def = budgetItemDefs.find(d => d.name === name || d.aliases.includes(name))
    return def?.name || name
  }
  const normalizeSubName = (itemName: string, subName: string) => {
    const def = budgetItemDefs.find(d => d.name === itemName || d.aliases.includes(itemName))
    if (!def) return subName
    const sub = def.subItems.find(s => s.name === subName || (s.aliases || []).includes(subName))
    return sub?.name || subName
  }
  const normalizeDetName = (itemName: string, subName: string, detName: string) => {
    const def = budgetItemDefs.find(d => d.name === itemName || d.aliases.includes(itemName))
    if (!def) return detName
    const sub = def.subItems.find(s => s.name === subName || (s.aliases || []).includes(subName))
    if (!sub?.detailItems) return detName
    const det = sub.detailItems.find(d => d.name === detName || (d.aliases || []).includes(detName))
    return det?.name || detName
  }
  const buildNormalizedKey = (b: BudgetItem) => {
    const ni = normalizeItemName(b.itemName)
    if (!b.subItemName) return ni
    const ns = normalizeSubName(b.itemName, b.subItemName)
    if (!(b as any).detailItemName) return `${ni}>${ns}`
    const nd = normalizeDetName(b.itemName, b.subItemName, (b as any).detailItemName)
    return `${ni}>${ns}>${nd}`
  }

  /* ── 예산과목 선택 모달 열기 ── */
  const openBudgetPicker = (filterItemName?: string) => {
    if (!selCat) return
    // 이미 등록된 항목들을 체크 상태로 초기화 (정규화된 키 사용)
    const checked = new Set<string>()
    const displayNames: Record<string, string> = {}
    filtered.forEach(b => {
      const nk = buildNormalizedKey(b)
      checked.add(nk)
      // 현재 표시 이름 저장 (원래 def.name과 다를 수 있음)
      const parts = nk.split('>')
      if (parts.length === 1) displayNames[`item:${nk}`] = b.itemName
      if (parts.length >= 2) displayNames[`sub:${nk}`] = b.subItemName || ''
      if (parts.length === 3) displayNames[`det:${nk}`] = (b as any).detailItemName || ''
    })
    setPickerChecked(checked)
    setPickerDisplayNames(displayNames)
    // 필터 이름도 정규화
    setPickerFilterItem(filterItemName ? normalizeItemName(filterItemName) : null)
    setPickerSearch('')
    setBudgetPickerOpen(true)
  }

  /* ── 예산과목 선택 적용 ── */
  const applyBudgetPicker = () => {
    if (!selCat) return
    const all = getItem<BudgetItem[]>('acct_budgets', [])
    const catBudgets = all.filter(b => String(b.catId) === String(selCat.id))
    const otherBudgets = all.filter(b => String(b.catId) !== String(selCat.id))

    // 기존 항목의 정규화된 키 맵
    const existingKeys = new Map<string, BudgetItem>()
    catBudgets.forEach(b => {
      existingKeys.set(buildNormalizedKey(b), b)
    })

    const newBudgets: BudgetItem[] = []
    pickerChecked.forEach(key => {
      if (existingKeys.has(key)) {
        // 기존 항목 유지 (현재 표시 이름 그대로)
        newBudgets.push(existingKeys.get(key)!)
        existingKeys.delete(key)
      } else {
        // 새로 추가: 예산과목에서 계정과목 자동 연결
        const parts = key.split('>')
        const defItemName = parts[0]
        const defSubName = parts[1] || ''
        const defDetName = parts[2] || ''
        // 사용자가 선택한 표시이름 사용 (없으면 원본)
        const displayItem = pickerDisplayNames[`item:${defItemName}`] || defItemName
        const displaySub = defSubName ? (pickerDisplayNames[`sub:${defItemName}>${defSubName}`] || defSubName) : ''
        const displayDet = defDetName ? (pickerDisplayNames[`det:${defItemName}>${defSubName}>${defDetName}`] || defDetName) : ''
        const def = budgetItemDefs.find(d => d.name === defItemName)
        let acctCode = def?.defaultAccountCode || ''
        let contraAcctCode = def?.accountPool?.[0]?.contraAccountCode || ''
        if (defSubName && def) {
          const subDef = def.subItems.find(s => s.name === defSubName)
          if (subDef?.accountCode) acctCode = subDef.accountCode
          if (defDetName && subDef?.detailItems) {
            const detDef = subDef.detailItems.find(d => d.name === defDetName)
            if (detDef?.accountCode) acctCode = detDef.accountCode
          }
        }
        newBudgets.push({
          id: Date.now() + Math.floor(Math.random() * 10000) + newBudgets.length,
          catId: selCat.id,
          year,
          itemName: displayItem,
          subItemName: displaySub,
          detailItemName: displayDet,
          accountCode: acctCode,
          contraAccountCode: contraAcctCode,
          amount: 0,
          spent: 0,
          budgetItemDefId: def?.id,
        })
      }
    })

    setItem('acct_budgets', [...otherBudgets, ...newBudgets])
    setBudgetPickerOpen(false)
    setRefresh(r => r + 1)
  }

  /* ── 인라인 금액 편집 저장 ── */
  const saveInlineAmount = (budgetId: string | number) => {
    const amt = parseInt(editingAmountVal.replace(/,/g, '')) || 0
    const all = getItem<BudgetItem[]>('acct_budgets', [])
    const updated = all.map(b => b.id === budgetId ? { ...b, amount: amt } : b)
    setItem('acct_budgets', updated)
    setEditingAmountId(null)
    setEditingAmountVal('')
    setRefresh(r => r + 1)
  }

  /* ── 금액 포맷 입력 ── */
  const handleAmountInput = (val: string) => {
    const digits = val.replace(/[^\d]/g, '')
    setBudgetForm(f => ({ ...f, amount: digits ? Number(digits).toLocaleString('ko-KR') : '' }))
  }

  /* ── 동의어로 이름 변경 ── */
  const renameByAlias = (level: 'item' | 'sub' | 'det', origName: string, newName: string, parentItem?: string, parentSub?: string) => {
    if (origName === newName) return
    const all = getItem<BudgetItem[]>('acct_budgets', [])
    const updated = all.map(b => {
      if (String(b.catId) !== String(selCat?.id)) return b
      if (level === 'item') {
        const normOrig = normalizeItemName(origName)
        const normCur = normalizeItemName(b.itemName)
        if (normCur === normOrig) {
          return { ...b, itemName: newName }
        }
      }
      if (level === 'sub') {
        const normPI = normalizeItemName(parentItem || '')
        const normBI = normalizeItemName(b.itemName)
        if (normBI === normPI) {
          const normOrig = normalizeSubName(parentItem || '', origName)
          const normCur = normalizeSubName(b.itemName, b.subItemName || '')
          if (normCur === normOrig) {
            return { ...b, subItemName: newName }
          }
        }
      }
      if (level === 'det') {
        const normPI = normalizeItemName(parentItem || '')
        const normBI = normalizeItemName(b.itemName)
        if (normBI === normPI) {
          const normPS = normalizeSubName(parentItem || '', parentSub || '')
          const normBS = normalizeSubName(b.itemName, b.subItemName || '')
          if (normBS === normPS) {
            const normOrig = normalizeDetName(parentItem || '', parentSub || '', origName)
            const normCur = normalizeDetName(b.itemName, b.subItemName || '', (b as any).detailItemName || '')
            if (normCur === normOrig) {
              return { ...b, detailItemName: newName }
            }
          }
        }
      }
      return b
    })
    setItem('acct_budgets', updated)
    setAliasDropId(null)

    // 피커가 열려있으면 pickerDisplayNames도 동기화
    if (budgetPickerOpen) {
      setPickerDisplayNames(prev => {
        const next = { ...prev }
        if (level === 'item') {
          const nk = normalizeItemName(origName)
          next[`item:${nk}`] = newName
        } else if (level === 'sub') {
          const ni = normalizeItemName(parentItem || '')
          const ns = normalizeSubName(parentItem || '', origName)
          next[`sub:${ni}>${ns}`] = newName
        } else if (level === 'det') {
          const ni = normalizeItemName(parentItem || '')
          const ns = normalizeSubName(parentItem || '', parentSub || '')
          const nd = normalizeDetName(parentItem || '', parentSub || '', origName)
          next[`det:${ni}>${ns}>${nd}`] = newName
        }
        return next
      })
    }

    setRefresh(r => r + 1)
  }

  /* 동의어 목록 가져오기 */
  const getAliases = (level: 'item' | 'sub' | 'det', name: string, parentItem?: string, parentSub?: string): string[] => {
    if (level === 'item') {
      const def = budgetItemDefs.find(d => d.name === name || d.aliases.includes(name))
      if (!def) return []
      return [def.name, ...def.aliases].filter(a => a !== name)
    }
    if (level === 'sub') {
      const itemDef = budgetItemDefs.find(d => d.name === parentItem || d.aliases.includes(parentItem || ''))
      if (!itemDef) return []
      const subDef = itemDef.subItems.find(s => s.name === name || (s.aliases || []).includes(name))
      if (!subDef) return []
      return [subDef.name, ...(subDef.aliases || [])].filter(a => a !== name)
    }
    if (level === 'det') {
      const itemDef = budgetItemDefs.find(d => d.name === parentItem || d.aliases.includes(parentItem || ''))
      if (!itemDef) return []
      const subDef = itemDef.subItems.find(s => s.name === parentSub || (s.aliases || []).includes(parentSub || ''))
      if (!subDef?.detailItems) return []
      const detDef = subDef.detailItems.find(d => d.name === name || (d.aliases || []).includes(name))
      if (!detDef) return []
      return [detDef.name, ...(detDef.aliases || [])].filter(a => a !== name)
    }
    return []
  }

  /* ── 피커 모달 내 동의어 추가/삭제 ── */
  const addPickerAlias = (level: 'item' | 'sub' | 'det', defName: string, subName?: string, detName?: string, newAlias?: string) => {
    if (!newAlias?.trim()) return
    const defs = getItem<BudgetItemDef[]>('acct_budget_item_defs', [])
    const def = defs.find(d => d.name === defName)
    if (!def) return
    if (level === 'item') {
      if (!def.aliases.includes(newAlias.trim())) def.aliases.push(newAlias.trim())
    } else if (level === 'sub') {
      const sub = def.subItems.find(s => s.name === subName)
      if (sub && !(sub.aliases || []).includes(newAlias.trim())) {
        if (!sub.aliases) sub.aliases = []
        sub.aliases.push(newAlias.trim())
      }
    } else if (level === 'det') {
      const sub = def.subItems.find(s => s.name === subName)
      const det = sub?.detailItems?.find(d => d.name === detName)
      if (det && !(det.aliases || []).includes(newAlias.trim())) {
        if (!det.aliases) det.aliases = []
        det.aliases.push(newAlias.trim())
      }
    }
    setItem('acct_budget_item_defs', defs)
    setPickerAliasInput('')
    setRefresh(r => r + 1)
  }
  const removePickerAlias = (level: 'item' | 'sub' | 'det', defName: string, alias: string, subName?: string, detName?: string) => {
    const defs = getItem<BudgetItemDef[]>('acct_budget_item_defs', [])
    const def = defs.find(d => d.name === defName)
    if (!def) return
    if (level === 'item') {
      def.aliases = def.aliases.filter(a => a !== alias)
    } else if (level === 'sub') {
      const sub = def.subItems.find(s => s.name === subName)
      if (sub) sub.aliases = (sub.aliases || []).filter(a => a !== alias)
    } else if (level === 'det') {
      const sub = def.subItems.find(s => s.name === subName)
      const det = sub?.detailItems?.find(d => d.name === detName)
      if (det) det.aliases = (det.aliases || []).filter(a => a !== alias)
    }
    setItem('acct_budget_item_defs', defs)
    setRefresh(r => r + 1)
  }
  /* 지출담당자 여부: 현재 선택 카테고리에 users로 등록된 사용자 */
  const isExpenseManager = useMemo(() => {
    if (!selCat) return false
    const userName = user?.name || ''
    return selCat.users?.includes(userName) || false
  }, [selCat, user])
  /* 예산값 수정 가능 여부: (승인권자 또는 지출담당자) + 확정 아닌 상태 */
  const isConfirmed = (selCat as any)?.budgetStatus === 'confirmed'
  const canEditValues = (isBudgetApprover || isExpenseManager) && !isConfirmed

  /* 비승인권자 클릭 차단 핸들러 (구분 추가/삭제 등 구조 변경) */
  const guardClick = (fn: () => void) => {
    if (!isBudgetApprover || isConfirmed) return () => {}
    return fn
  }
  const guardBtnClass = (!isBudgetApprover || isConfirmed) ? ' opacity-50 cursor-not-allowed' : ' cursor-pointer'
  /* 예산값 수정용 핸들러 (승인권자 + 지출담당자 모두 가능) */
  const guardEditClick = (fn: () => void) => {
    if (!canEditValues) return () => {}
    return fn
  }
  const guardEditBtnClass = !canEditValues ? ' opacity-50 cursor-not-allowed' : ' cursor-pointer'

  return (
    <div className="space-y-4">
      {/* ── 예산구분 관리 ── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4 overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[var(--text-primary)]">
            <PieChart size={16} className="text-primary-500" /> 예산구분 관리
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBankModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[12px] font-bold text-[var(--text-secondary)] hover:border-blue-400 hover:text-blue-500 cursor-pointer transition-all"
            >
              <Landmark size={12} /> 계좌관리
            </button>
            <button
              onClick={isBudgetApprover ? () => openCatModal() : undefined}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[12px] font-bold text-[var(--text-secondary)] ${isBudgetApprover ? 'hover:border-primary-400 hover:text-primary-500 cursor-pointer' : 'opacity-50 cursor-not-allowed'} transition-all`}
              title={!isBudgetApprover ? '지출승인권자만 사용 가능' : undefined}
            >
              <Plus size={12} /> 구분 추가
            </button>
          </div>
        </div>
        {budgetCats.length === 0 ? (
          <EmptyState emoji="📁" title={`${year}년 등록된 예산구분이 없습니다. "구분 추가" 버튼으로 먼저 등록하세요.`} />
        ) : (
          <div
            ref={catScrollRef}
            onMouseDown={onCatMouseDown}
            className="flex gap-3 overflow-x-auto pb-2 select-none scrollbar-hide"
            style={{ cursor: isDraggingCat ? 'grabbing' : 'grab' }}
          >
            {budgetCats.map((cat, idx) => {
              const isActive = String(cat.id) === String(selCat?.id)
              const catBudgets = budgets.filter(b => String(b.catId) === String(cat.id))
              const amt = catBudgets.reduce((a, b) => a + (b.amount || 0), 0)
              const spent = catBudgets.reduce((a, b) => a + (b.spent || 0), 0)
              const pct = amt > 0 ? Math.round(spent / amt * 100) : 0
              const cc = colors[idx % colors.length]

              return (
                <div
                  key={cat.id}
                  onClick={() => { if (catDragState.current.moved) return; setSelectedCatId(cat.id) }}
                  className={cn(
                    'text-left rounded-xl border cursor-pointer transition-all overflow-hidden flex-shrink-0',
                    'w-[260px] sm:w-[280px]',
                    isActive
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)]',
                  )}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-extrabold" style={{ color: isActive ? cc : 'var(--text-primary)' }}>
                        {cat.name}
                      </span>
                      {isActive && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${cc}22`, color: cc }}>
                          선택
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] mb-1 flex items-center gap-1"><Landmark size={10} /> {cat.bankInfo || cat.bank || '-'}</div>
                    <div className="text-[10px] text-[var(--text-muted)] mb-2 flex items-center gap-1"><Calendar size={10} /> {cat.periodFrom || ''} ~ {cat.periodTo || ''}</div>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-[var(--text-secondary)]">{catBudgets.length}건</span>
                      <span className="font-bold">{formatNumber(amt)}원</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: pct > 100 ? '#ef4444' : cc }} />
                    </div>
                  </div>
                  {/* 수정 / 삭제 / 편성·확정 */}
                  <div className="flex border-t border-[var(--border-default)]">
                    <button
                      onClick={e => { e.stopPropagation(); if (isBudgetApprover && (cat as any).budgetStatus !== 'confirmed') openCatModal(cat.id) }}
                      className={`flex-1 py-2 text-[11px] font-bold text-[var(--text-secondary)] ${isBudgetApprover && (cat as any).budgetStatus !== 'confirmed' ? 'hover:bg-[var(--bg-muted)] cursor-pointer' : 'opacity-50 cursor-not-allowed'} transition-colors border-r border-[var(--border-default)]`}
                    >
                      수정
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); if (isBudgetApprover && (cat as any).budgetStatus !== 'confirmed') deleteCat(cat.id) }}
                      className={`flex-1 py-2 text-[11px] font-bold text-danger ${isBudgetApprover && (cat as any).budgetStatus !== 'confirmed' ? 'hover:bg-[var(--bg-muted)] cursor-pointer' : 'opacity-50 cursor-not-allowed'} transition-colors border-r border-[var(--border-default)]`}
                    >
                      삭제
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        if (!isBudgetApprover) return
                        const newStatus = (cat as any).budgetStatus === 'confirmed' ? 'drafting' : 'confirmed'
                        setBudgetStatusModal({ catId: cat.id, catName: cat.name, newStatus })
                        setBudgetStatusPw('')
                        setBudgetStatusPwErr('')
                      }}
                      className={`flex-1 py-2 text-[11px] font-bold flex items-center justify-center gap-1 ${(cat as any).budgetStatus === 'confirmed' ? 'text-[#22c55e] bg-green-50 dark:bg-green-900/10' : 'text-[#f59e0b]'} ${isBudgetApprover ? 'hover:bg-[var(--bg-muted)] cursor-pointer' : 'opacity-50 cursor-not-allowed'} transition-colors`}
                    >
                      {(cat as any).budgetStatus === 'confirmed' ? <><CheckCircle2 size={12} /> 확정</> : <><Edit3 size={12} /> 편성</>}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── 예산항목 테이블 ── */}
      {selCat && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
            <div className="flex items-center gap-2">
              <ScrollText size={14} className="text-primary-500" />
              <span className="text-sm font-extrabold text-[var(--text-primary)]">{selCat.name} — 예산항목</span>
              <span className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--bg-muted)] px-2 py-0.5 rounded-full">
                {filtered.length}건 · {formatNumber(totalAmt)}원
              </span>
              {isConfirmed && (
                <span className="text-[10px] font-bold text-[#22c55e] bg-green-100 dark:bg-green-900/20 px-2 py-0.5 rounded-full">✅ 확정됨 · 수정불가</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={guardEditClick(() => openBudgetPicker())}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-500 text-white text-[12px] font-bold ${canEditValues ? 'hover:bg-primary-600' : 'opacity-50'} transition-all${guardEditBtnClass}`}
                title={!canEditValues ? '지출승인권자 또는 지출담당자만 사용 가능' : undefined}
              >
                <Plus size={12} /> 예산과목 선택
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-8 text-center">
              <EmptyState emoji="📋" title="예산과목을 선택하세요" />
              <p className="text-[11px] text-[var(--text-muted)] mt-1">"예산과목 선택" 버튼으로 항목을 추가하세요</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="bg-[var(--bg-muted)]">
                    {['예산항목', '자동분개', '편성액', '집행액', '잔여', '소진율', '관리'].map(h => (
                      <th key={h} className={cn("py-2.5 px-3.5 text-[11px] font-bold text-[var(--text-muted)]", h === '관리' ? 'text-center w-[80px]' : 'text-left')}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from(budgetTreeGroups.entries()).map(([itemName, itemGroup]) => {
                    const itemAmt = itemGroup.budgets.reduce((s: number, b: BudgetItem) => s + (b.amount || 0), 0)
                    const itemSpent = itemGroup.budgets.reduce((s: number, b: BudgetItem) => s + (b.spent || 0), 0)
                    const itemRemain = itemAmt - itemSpent
                    const itemPct = itemAmt > 0 ? Math.round(itemSpent / itemAmt * 100) : 0
                    const itemColor = itemPct > 100 ? '#ef4444' : itemPct > 80 ? '#f59e0b' : '#4f6ef7'
                    const hasSubs = itemGroup.subs.size > 1 || (itemGroup.subs.size === 1 && !itemGroup.subs.has(''))

                    const rows: React.ReactNode[] = []

                    {/* ─── 1뎁스: 예산목 소계 ─── */}
                    rows.push(
                      <tr key={`item-${itemName}`} className="border-b border-[var(--border-default)] bg-blue-50/40 dark:bg-blue-900/5" onDoubleClick={() => canEditValues && openBudgetPicker(itemName)} style={canEditValues ? { cursor: 'pointer' } : undefined}>
                        <td className="py-2.5 px-3.5">
                          <div className="relative inline-flex items-center gap-2">
                            {(() => {
                              const aliases = getAliases('item', itemName)
                              const dropKey = `item:${itemName}`
                              return aliases.length > 0 && canEditValues ? (
                                <>
                                  <span
                                    className="text-[13px] font-extrabold text-[var(--text-primary)] cursor-pointer hover:text-primary-500 transition-colors border-b border-dashed border-transparent hover:border-primary-400"
                                    onClick={() => setAliasDropId(aliasDropId === dropKey ? null : dropKey)}
                                  >{itemName}</span>
                                  {aliasDropId === dropKey && (
                                    <div className="absolute top-full left-0 mt-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-xl z-50 min-w-[160px] py-1">
                                      {aliases.map(a => (
                                        <button key={a} onClick={() => renameByAlias('item', itemName, a)} className="w-full text-left px-3 py-1.5 text-[12px] text-[var(--text-secondary)] hover:bg-primary-50 dark:hover:bg-primary-900/10 hover:text-primary-600 transition-colors cursor-pointer">
                                          {a}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <span className="text-[13px] font-extrabold text-[var(--text-primary)]">{itemName}</span>
                              )
                            })()}
                            {hasSubs && <span className="text-[9px] font-bold text-primary-500 bg-primary-100 dark:bg-primary-900/20 px-1.5 py-0.5 rounded">{itemGroup.subs.size}개 세목</span>}
                          </div>
                        </td>
                        <td className="py-2.5 px-3.5" />
                        <td className="py-2.5 px-3.5 text-right">
                          {!hasSubs && itemGroup.budgets.length === 1 && canEditValues ? (
                            editingAmountId === itemGroup.budgets[0].id ? (
                              <input
                                autoFocus
                                value={editingAmountVal}
                                onChange={e => {
                                  const d = e.target.value.replace(/[^\d]/g, '')
                                  setEditingAmountVal(d ? Number(d).toLocaleString('ko-KR') : '')
                                }}
                                onBlur={() => saveInlineAmount(itemGroup.budgets[0].id)}
                                onKeyDown={e => { if (e.key === 'Enter') saveInlineAmount(itemGroup.budgets[0].id); if (e.key === 'Escape') setEditingAmountId(null) }}
                                className="w-[120px] px-2 py-1 text-right text-[12px] font-extrabold border border-primary-400 rounded-md bg-white dark:bg-gray-800 outline-none text-[var(--text-primary)]"
                              />
                            ) : (
                              <span
                                className="text-[12px] font-extrabold text-[var(--text-primary)] cursor-pointer hover:text-primary-500 hover:underline transition-colors"
                                onClick={() => { setEditingAmountId(itemGroup.budgets[0].id); setEditingAmountVal(formatNumber(itemAmt)) }}
                              >{formatNumber(itemAmt)}원</span>
                            )
                          ) : (
                            <span className="text-[12px] font-extrabold text-[var(--text-primary)]">{formatNumber(itemAmt)}원</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-danger text-right">{formatNumber(itemSpent)}원</td>
                        <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-right" style={{ color: itemRemain < 0 ? '#ef4444' : '#22c55e' }}>{formatNumber(itemRemain)}원</td>
                        <td className="py-2.5 px-3.5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden max-w-[80px]">
                              <div className="h-full rounded-full" style={{ width: `${Math.min(100, itemPct)}%`, background: itemColor }} />
                            </div>
                            <span className="text-[11px] font-extrabold" style={{ color: itemColor }}>{itemPct}%</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3.5 text-center">
                          {!hasSubs && itemGroup.budgets.length === 1 && (
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={guardClick(() => deleteBudgetItem(itemGroup.budgets[0].id as number))} className={`w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-muted)] ${isBudgetApprover ? 'hover:bg-red-100 hover:text-danger cursor-pointer' : 'opacity-50 cursor-not-allowed'} transition-all`} title="삭제"><Trash2 size={12} /></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )

                    {/* ─── 2뎁스: 세목 ─── */}
                    if (hasSubs) {
                      Array.from(itemGroup.subs.entries()).forEach(([subName, subGroup]) => {
                        if (!subName) return
                        const subAmt = subGroup.budgets.reduce((s: number, b: BudgetItem) => s + (b.amount || 0), 0)
                        const subSpent = subGroup.budgets.reduce((s: number, b: BudgetItem) => s + (b.spent || 0), 0)
                        const subRemain = subAmt - subSpent
                        const subPct = subAmt > 0 ? Math.round(subSpent / subAmt * 100) : 0
                        const subColor = subPct > 100 ? '#ef4444' : subPct > 80 ? '#f59e0b' : '#22c55e'
                        const hasDetails = subGroup.details.size > 1 || (subGroup.details.size === 1 && !subGroup.details.has(''))

                        rows.push(
                          <tr key={`sub-${itemName}-${subName}`} className="border-b border-[var(--border-default)]/50 hover:bg-[var(--bg-muted)] transition-colors">
                            <td className="py-2 px-3.5 pl-8">
                              <div className="relative inline-flex items-center gap-1.5">
                                <span className="text-[10px] text-primary-400">└</span>
                                {(() => {
                                  const aliases = getAliases('sub', subName, itemName)
                                  const dropKey = `sub:${itemName}>${subName}`
                                  return aliases.length > 0 && canEditValues ? (
                                    <>
                                      <span
                                        className="text-[12px] font-bold text-[var(--text-secondary)] cursor-pointer hover:text-primary-500 transition-colors border-b border-dashed border-transparent hover:border-primary-400"
                                        onClick={() => setAliasDropId(aliasDropId === dropKey ? null : dropKey)}
                                      >{subName}</span>
                                      {aliasDropId === dropKey && (
                                        <div className="absolute top-full left-4 mt-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-xl z-50 min-w-[140px] py-1">
                                          {aliases.map(a => (
                                            <button key={a} onClick={() => renameByAlias('sub', subName, a, itemName)} className="w-full text-left px-3 py-1.5 text-[11px] text-[var(--text-secondary)] hover:bg-primary-50 dark:hover:bg-primary-900/10 hover:text-primary-600 transition-colors cursor-pointer">
                                              {a}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-[12px] font-bold text-[var(--text-secondary)]">{subName}</span>
                                  )
                                })()}
                                {hasDetails && <span className="text-[8px] font-bold text-violet-500 bg-violet-50 dark:bg-violet-900/20 px-1 py-px rounded">{subGroup.details.size}건</span>}
                              </div>
                            </td>
                            <td className="py-2 px-3.5" />
                            <td className="py-2 px-3.5 text-right">
                              {!hasDetails && subGroup.budgets.length === 1 && canEditValues ? (
                                editingAmountId === subGroup.budgets[0].id ? (
                                  <input
                                    autoFocus
                                    value={editingAmountVal}
                                    onChange={e => {
                                      const d = e.target.value.replace(/[^\d]/g, '')
                                      setEditingAmountVal(d ? Number(d).toLocaleString('ko-KR') : '')
                                    }}
                                    onBlur={() => saveInlineAmount(subGroup.budgets[0].id)}
                                    onKeyDown={e => { if (e.key === 'Enter') saveInlineAmount(subGroup.budgets[0].id); if (e.key === 'Escape') setEditingAmountId(null) }}
                                    className="w-[110px] px-2 py-0.5 text-right text-[11px] font-bold border border-primary-400 rounded-md bg-white dark:bg-gray-800 outline-none text-[var(--text-primary)]"
                                  />
                                ) : (
                                  <span
                                    className="text-[11px] font-bold text-[var(--text-secondary)] cursor-pointer hover:text-primary-500 hover:underline transition-colors"
                                    onClick={() => { setEditingAmountId(subGroup.budgets[0].id); setEditingAmountVal(formatNumber(subAmt)) }}
                                  >{formatNumber(subAmt)}원</span>
                                )
                              ) : (
                                <span className="text-[11px] font-bold text-[var(--text-secondary)]">{formatNumber(subAmt)}원</span>
                              )}
                            </td>
                            <td className="py-2 px-3.5 text-[11px] font-bold text-danger/80 text-right">{formatNumber(subSpent)}원</td>
                            <td className="py-2 px-3.5 text-[11px] font-bold text-right" style={{ color: subRemain < 0 ? '#ef4444' : '#22c55e' }}>{formatNumber(subRemain)}원</td>
                            <td className="py-2 px-3.5">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1 rounded-full bg-[var(--bg-subtle)] overflow-hidden max-w-[80px]">
                                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, subPct)}%`, background: subColor }} />
                                </div>
                                <span className="text-[10px] font-bold" style={{ color: subColor }}>{subPct}%</span>
                              </div>
                            </td>
                            <td className="py-2 px-3.5 text-center">
                              {!hasDetails && subGroup.budgets.length === 1 && (
                                <div className="flex items-center justify-center gap-1">
                                  <button onClick={guardClick(() => deleteBudgetItem(subGroup.budgets[0].id as number))} className={`w-5 h-5 rounded flex items-center justify-center text-[var(--text-muted)] ${isBudgetApprover ? 'hover:bg-red-100 hover:text-danger cursor-pointer' : 'opacity-50 cursor-not-allowed'} transition-all`} title="삭제"><Trash2 size={10} /></button>
                                </div>
                              )}
                            </td>
                          </tr>
                        )

                        {/* ─── 3뎁스: 세세항목 ─── */}
                        if (hasDetails) {
                          Array.from(subGroup.details.entries()).forEach(([detailName, detailBudgets]) => {
                            if (!detailName) return
                            const dBudgets = detailBudgets as BudgetItem[]
                            const detAmt = dBudgets.reduce((s, b) => s + (b.amount || 0), 0)
                            const detSpent = dBudgets.reduce((s, b) => s + (b.spent || 0), 0)
                            const detRemain = detAmt - detSpent
                            const detPct = detAmt > 0 ? Math.round(detSpent / detAmt * 100) : 0
                            const detColor = detPct > 100 ? '#ef4444' : detPct > 80 ? '#f59e0b' : '#a78bfa'
                            const firstB = dBudgets[0]

                            rows.push(
                              <tr key={`det-${itemName}-${subName}-${detailName}`} className="border-b border-dashed border-[var(--border-default)]/30 hover:bg-violet-50/10 dark:hover:bg-violet-900/5 transition-colors">
                                <td className="py-1.5 px-3.5 pl-14">
                                  <div className="relative inline-flex items-center gap-1.5">
                                    <span className="text-[9px] text-violet-400">└</span>
                                    {(() => {
                                      const aliases = getAliases('det', detailName, itemName, subName)
                                      const dropKey = `det:${itemName}>${subName}>${detailName}`
                                      return aliases.length > 0 && canEditValues ? (
                                        <>
                                          <span
                                            className="text-[11px] font-semibold text-[var(--text-muted)] cursor-pointer hover:text-primary-500 transition-colors border-b border-dashed border-transparent hover:border-primary-400"
                                            onClick={() => setAliasDropId(aliasDropId === dropKey ? null : dropKey)}
                                          >{detailName}</span>
                                          {aliasDropId === dropKey && (
                                            <div className="absolute top-full left-4 mt-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-xl z-50 min-w-[130px] py-1">
                                              {aliases.map(a => (
                                                <button key={a} onClick={() => renameByAlias('det', detailName, a, itemName, subName)} className="w-full text-left px-3 py-1.5 text-[10px] text-[var(--text-secondary)] hover:bg-primary-50 dark:hover:bg-primary-900/10 hover:text-primary-600 transition-colors cursor-pointer">
                                                  {a}
                                                </button>
                                              ))}
                                            </div>
                                          )}
                                        </>
                                      ) : (
                                        <span className="text-[11px] font-semibold text-[var(--text-muted)]">{detailName}</span>
                                      )
                                    })()}
                                  </div>
                                </td>
                                <td className="py-1.5 px-3.5">
                                  {firstB.contraAccountCode && firstB.accountCode ? (
                                    <div className="flex items-center gap-1 text-[9px]">
                                      <span className="font-bold text-[#4f6ef7]">차</span>
                                      <span className="font-mono text-[var(--text-muted)]">{firstB.accountCode}</span>
                                      <span className="text-[var(--text-muted)]">→</span>
                                      <span className="font-bold text-[#ef4444]">대</span>
                                      <span className="font-mono text-[var(--text-muted)]">{firstB.contraAccountCode}</span>
                                    </div>
                                  ) : (
                                    <span className="text-[9px] text-[var(--text-muted)]">{firstB.accountCode || ''}</span>
                                  )}
                                </td>
                                <td className="py-1.5 px-3.5 text-right">
                                  {dBudgets.length === 1 && canEditValues ? (
                                    editingAmountId === dBudgets[0].id ? (
                                      <input
                                        autoFocus
                                        value={editingAmountVal}
                                        onChange={e => {
                                          const d = e.target.value.replace(/[^\d]/g, '')
                                          setEditingAmountVal(d ? Number(d).toLocaleString('ko-KR') : '')
                                        }}
                                        onBlur={() => saveInlineAmount(dBudgets[0].id)}
                                        onKeyDown={e => { if (e.key === 'Enter') saveInlineAmount(dBudgets[0].id); if (e.key === 'Escape') setEditingAmountId(null) }}
                                        className="w-[100px] px-2 py-0.5 text-right text-[10px] font-semibold border border-primary-400 rounded-md bg-white dark:bg-gray-800 outline-none text-[var(--text-primary)]"
                                      />
                                    ) : (
                                      <span
                                        className="text-[10px] font-semibold text-[var(--text-muted)] cursor-pointer hover:text-primary-500 hover:underline transition-colors"
                                        onClick={() => { setEditingAmountId(dBudgets[0].id); setEditingAmountVal(formatNumber(detAmt)) }}
                                      >{formatNumber(detAmt)}원</span>
                                    )
                                  ) : (
                                    <span className="text-[10px] font-semibold text-[var(--text-muted)]">{formatNumber(detAmt)}원</span>
                                  )}
                                </td>
                                <td className="py-1.5 px-3.5 text-[10px] font-semibold text-danger/60 text-right">{formatNumber(detSpent)}원</td>
                                <td className="py-1.5 px-3.5 text-[10px] font-semibold text-right" style={{ color: detRemain < 0 ? '#ef4444' : '#22c55e' }}>{formatNumber(detRemain)}원</td>
                                <td className="py-1.5 px-3.5">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1 rounded-full bg-[var(--bg-subtle)] overflow-hidden max-w-[80px]">
                                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, detPct)}%`, background: detColor }} />
                                    </div>
                                    <span className="text-[9px] font-bold" style={{ color: detColor }}>{detPct}%</span>
                                  </div>
                                </td>
                                <td className="py-1.5 px-3.5 text-center">
                                  {dBudgets.length === 1 && (
                                    <div className="flex items-center justify-center gap-1">
                                      <button onClick={guardClick(() => deleteBudgetItem(dBudgets[0].id as number))} className={`w-5 h-5 rounded flex items-center justify-center text-[var(--text-muted)] ${isBudgetApprover ? 'hover:bg-red-100 hover:text-danger cursor-pointer' : 'opacity-50 cursor-not-allowed'} transition-all`} title="삭제"><Trash2 size={10} /></button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )
                          })
                        }
                      })
                    }

                    return rows
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-[var(--bg-muted)]">
                    <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-[var(--text-primary)]">합계</td>
                    <td />
                    <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-[var(--text-primary)] text-right">{formatNumber(totalAmt)}원</td>
                    <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-danger text-right">{formatNumber(totalSpent)}원</td>
                    <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-success text-right">{formatNumber(totalAmt - totalSpent)}원</td>
                    <td className="py-2.5 px-3.5 text-[11px] font-bold text-[var(--text-muted)]">
                      {totalAmt > 0 ? Math.round(totalSpent / totalAmt * 100) : 0}%
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════
         모달: 편성/확정 비밀번호 인증
         ═══════════════════════════════════════════ */}
      {budgetStatusModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={() => setBudgetStatusModal(null)}>
          <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-[380px] mx-4 border border-[var(--border-default)]" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-[var(--border-default)]">
              <h3 className="text-base font-extrabold text-[var(--text-primary)]">
                {budgetStatusModal.newStatus === 'confirmed' ? '🔒 예산 확정' : '🔓 확정 해제'}
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                {budgetStatusModal.newStatus === 'confirmed'
                  ? `"${budgetStatusModal.catName}" 예산을 확정합니다.\n확정 후에는 누구도 예산을 수정·삭제할 수 없습니다.`
                  : `"${budgetStatusModal.catName}" 예산 확정을 해제합니다.\n편성 상태로 변경하면 수정이 가능해집니다.`}
              </p>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">비밀번호 확인 *</label>
                <input
                  type="password"
                  autoFocus
                  value={budgetStatusPw}
                  onChange={e => { setBudgetStatusPw(e.target.value); setBudgetStatusPwErr('') }}
                  onKeyDown={e => { if (e.key === 'Enter') { (e.target as HTMLInputElement).blur(); document.getElementById('btn-budget-status-confirm')?.click() } }}
                  placeholder="비밀번호를 입력하세요"
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none"
                />
                {budgetStatusPwErr && <p className="text-[10px] text-danger mt-1">{budgetStatusPwErr}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-[var(--border-default)]">
              <button
                onClick={() => setBudgetStatusModal(null)}
                className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] cursor-pointer"
              >취소</button>
              <button
                id="btn-budget-status-confirm"
                onClick={() => {
                  if (!budgetStatusPw.trim()) { setBudgetStatusPwErr('비밀번호를 입력해주세요'); return }
                  const staffList = getItem<any[]>('ws_users', [])
                  const userName = user?.name || ''
                  const me = staffList.find(s => s.name === userName)
                  if (!me || me.pw !== budgetStatusPw) { setBudgetStatusPwErr('비밀번호가 일치하지 않습니다'); return }
                  const cats = getItem<BudgetCat[]>('acct_budget_cats', [])
                  const updated = cats.map(c => String(c.id) === String(budgetStatusModal.catId) ? { ...c, budgetStatus: budgetStatusModal.newStatus } : c)
                  setItem('acct_budget_cats', updated)
                  setRefresh(r => r + 1)
                  setBudgetStatusModal(null)
                  setBudgetStatusPw('')
                }}
                className={`px-4 py-2 rounded-lg text-white text-sm font-bold cursor-pointer ${budgetStatusModal.newStatus === 'confirmed' ? 'bg-[#22c55e] hover:bg-[#16a34a]' : 'bg-[#f59e0b] hover:bg-[#d97706]'}`}
              >
                {budgetStatusModal.newStatus === 'confirmed' ? '확정' : '해제'}
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* ═══════════════════════════════════════════
         모달: 예산구분 추가/수정
         ═══════════════════════════════════════════ */}
      {catModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={() => setCatModalOpen(false)}>
          <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-[460px] mx-4 border border-[var(--border-default)] flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)]">
              <h3 className="text-base font-extrabold text-[var(--text-primary)]">{catEditId ? '예산구분 수정' : '예산구분 추가'}</h3>
              <button onClick={() => setCatModalOpen(false)} className="text-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">✕</button>
            </div>
            <div className="px-5 py-4 space-y-3 overflow-y-auto flex-1">
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">예산구분명 *</label>
                <input
                  value={catForm.name}
                  onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="예) 문화재청, 자체예산"
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">예산설명</label>
                <textarea
                  value={catForm.description}
                  onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="예산구분에 대한 설명을 입력하세요"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors resize-none"
                />
              </div>
              {/* 등록된 지출수단 (수단등록 데이터에서 읽기 전용 표시) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-[var(--text-muted)]">
                    등록된 지출수단
                  </label>
                  <span className="text-[9px] text-[var(--text-muted)]">수단등록에서 편집</span>
                </div>
                {(() => {
                  // acct_pay_methods_v2에서 현재 예산구분에 연결된 수단 조회
                  let allPMs: any[] = []
                  try {
                    const raw = localStorage.getItem('acct_pay_methods_v2')
                    if (raw) allPMs = JSON.parse(raw)
                  } catch {}
                  const catIdStr = catEditId ? String(catEditId) : ''
                  const linkedPMs = catIdStr ? allPMs.filter((pm: any) => String(pm.budgetCatId) === catIdStr) : []
                  if (linkedPMs.length === 0) {
                    return <div className="text-center text-[11px] text-[var(--text-muted)] py-3 border border-dashed border-[var(--border-default)] rounded-lg">등록된 지출수단이 없습니다</div>
                  }
                  // 구분별 그룹핑
                  const acctPMs = linkedPMs.filter((pm: any) => pm.category === '계좌')
                  const cashPMs = linkedPMs.filter((pm: any) => pm.category === '현금')
                  const notePMs = linkedPMs.filter((pm: any) => pm.category === '어음')
                  const voucherPMs = linkedPMs.filter((pm: any) => pm.category === '상품권')
                  return (
                    <div className="space-y-2 max-h-[240px] overflow-y-auto">
                      {/* 계좌 */}
                      {acctPMs.length > 0 && (
                        <div className="border border-blue-200 dark:border-blue-800/40 rounded-lg overflow-hidden">
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/15 border-b border-blue-200 dark:border-blue-800/40">
                            <Building2 size={11} className="text-blue-500" />
                            <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400">계좌</span>
                            <span className="text-[9px] text-blue-400 dark:text-blue-500">({acctPMs.length})</span>
                          </div>
                          <div className="divide-y divide-[var(--border-default)]/40">
                            {acctPMs.map((pm: any) => (
                              <div key={pm.id}>
                                {/* 이체 */}
                                <div className="flex items-center gap-2 px-3 py-2">
                                  <ArrowLeftRight size={12} className="text-blue-400 shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-[11px] font-bold text-[var(--text-primary)] truncate">{pm.name}{pm.bankName ? ` (${pm.bankName})` : ''}</div>
                                    <div className="text-[9.5px] text-[var(--text-muted)] truncate">{pm.accountNumber || ''}{pm.accountHolder ? ` • ${pm.accountHolder}` : ''}</div>
                                  </div>
                                </div>
                                {/* 카드 */}
                                {(pm.cards || []).length > 0 && (pm.cards || []).map((card: any) => (
                                  <div key={card.id || card.cardNumber} className="flex items-center gap-2 px-3 py-1.5 pl-6 bg-indigo-50/50 dark:bg-indigo-900/5">
                                    <CreditCard size={11} className="text-indigo-400 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <span className="text-[10.5px] font-bold text-[var(--text-primary)]">{card.cardName || '카드'}</span>
                                      <span className="text-[9.5px] text-[var(--text-muted)] ml-1.5">{card.cardNumber || ''}{card.cardUser ? ` (${card.cardUser})` : ''}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* 현금 */}
                      {cashPMs.length > 0 && (
                        <div className="border border-emerald-200 dark:border-emerald-800/40 rounded-lg overflow-hidden">
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-900/15 border-b border-emerald-200 dark:border-emerald-800/40">
                            <Banknote size={11} className="text-emerald-500" />
                            <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">현금</span>
                            <span className="text-[9px] text-emerald-400 dark:text-emerald-500">({cashPMs.length})</span>
                          </div>
                          <div className="divide-y divide-[var(--border-default)]/40">
                            {cashPMs.map((pm: any) => (
                              <div key={pm.id} className="flex items-center gap-2 px-3 py-2">
                                <Banknote size={12} className="text-emerald-400 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="text-[11px] font-bold text-[var(--text-primary)] truncate">{pm.name}</div>
                                  {pm.storageLocation && <div className="text-[9.5px] text-[var(--text-muted)]">보관: {pm.storageLocation}</div>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* 어음 */}
                      {notePMs.length > 0 && (
                        <div className="border border-amber-200 dark:border-amber-800/40 rounded-lg overflow-hidden">
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 dark:bg-amber-900/15 border-b border-amber-200 dark:border-amber-800/40">
                            <FileText size={11} className="text-amber-500" />
                            <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400">어음</span>
                            <span className="text-[9px] text-amber-400 dark:text-amber-500">({notePMs.length})</span>
                          </div>
                          <div className="divide-y divide-[var(--border-default)]/40">
                            {notePMs.map((pm: any) => (
                              <div key={pm.id} className="flex items-center gap-2 px-3 py-2">
                                <FileText size={12} className="text-amber-400 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="text-[11px] font-bold text-[var(--text-primary)] truncate">{pm.name}</div>
                                  <div className="text-[9.5px] text-[var(--text-muted)]">{pm.noteType || ''}{pm.noteBank ? ` • ${pm.noteBank}` : ''}{pm.notes?.length ? ` • ${pm.notes.length}건` : ''}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* 상품권 */}
                      {voucherPMs.length > 0 && (
                        <div className="border border-rose-200 dark:border-rose-800/40 rounded-lg overflow-hidden">
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-50 dark:bg-rose-900/15 border-b border-rose-200 dark:border-rose-800/40">
                            <Ticket size={11} className="text-rose-500" />
                            <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400">상품권</span>
                            <span className="text-[9px] text-rose-400 dark:text-rose-500">({voucherPMs.length})</span>
                          </div>
                          <div className="divide-y divide-[var(--border-default)]/40">
                            {voucherPMs.map((pm: any) => (
                              <div key={pm.id} className="flex items-center gap-2 px-3 py-2">
                                <Ticket size={12} className="text-rose-400 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="text-[11px] font-bold text-[var(--text-primary)] truncate">{pm.name}</div>
                                  <div className="text-[9.5px] text-[var(--text-muted)]">{pm.voucherQty ? `${pm.voucherQty}매` : ''}{pm.voucherAmount ? ` • 액면 ${Number(pm.voucherAmount).toLocaleString()}원` : ''}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">시작일</label>
                  <DatePicker value={catForm.periodFrom} onChange={v => setCatForm(f => ({ ...f, periodFrom: v }))} />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">종료일</label>
                  <DatePicker value={catForm.periodTo} onChange={v => setCatForm(f => ({ ...f, periodTo: v }))} />
                </div>
              </div>
              {/* 지출담당자 */}
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1.5 block">
                  지출담당자
                </label>
                <select
                  value={catForm.users[0] || ''}
                  onChange={e => {
                    setCatForm(f => ({ ...f, users: e.target.value ? [e.target.value] : [] }))
                  }}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors"
                >
                  <option value="">선택하세요</option>
                  {staffListForBudget.map(s => (
                    <option key={s.id || s.name} value={s.name}>{s.name} {s.position || ''} {s.department || ''}</option>
                  ))}
                </select>
              </div>
              {/* 승인담당자 */}
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1.5 block">
                  승인담당자
                </label>
                {(() => {
                  const defaultApprover = staffListForBudget.find(s => (s as any).approverType === 'approver')
                  const defaultApproverName = defaultApprover?.name || ''
                  return (
                    <>
                      {defaultApprover ? (
                        <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-lg bg-primary-50 dark:bg-primary-900/10 border border-primary-200 dark:border-primary-800">
                          <span className="text-[10px] font-bold text-primary-500 bg-primary-100 dark:bg-primary-900/20 px-1.5 py-0.5 rounded">기본</span>
                          <span className="text-[13px] font-bold text-primary-600">{defaultApprover.name}</span>
                          <span className="text-[10px] text-[var(--text-muted)]">{defaultApprover.position || ''} {(defaultApprover as any).department || ''}</span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-[var(--text-muted)] px-3 py-2 mb-2 rounded-lg border border-dashed border-[var(--border-default)]">기본승인담당자가 설정되지 않았습니다</div>
                      )}
                      <select
                        value={catForm.approver}
                        onChange={e => setCatForm(f => ({ ...f, approver: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors"
                      >
                        <option value="">추가승인담당자를 선택하세요</option>
                        {staffListForBudget.filter(s => s.name !== defaultApproverName && (s as any).approverType !== 'approver').map(s => (
                          <option key={s.id || s.name} value={s.name}>{s.name} {s.position || ''} {(s as any).department || ''}</option>
                        ))}
                      </select>
                    </>
                  )
                })()}
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-[var(--border-default)]">
              <button onClick={() => setCatModalOpen(false)} className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer">취소</button>
              <button onClick={saveCat} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-bold hover:bg-primary-600 transition-colors cursor-pointer">저장</button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* ═══════════════════════════════════════════
         모달: 회사 계좌·카드 관리
         ═══════════════════════════════════════════ */}
      {bankModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={() => setBankModalOpen(false)}>
          <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-3xl mx-4 border border-[var(--border-default)] max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)] rounded-t-2xl" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)' }}>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2"><Landmark size={18} /> 회사 계좌·카드 관리</h3>
              <button onClick={() => setBankModalOpen(false)} className="text-white/80 hover:text-white text-lg cursor-pointer transition-colors">✕</button>
            </div>
            {/* 본문 + 하단 */}
            {(() => {
                const accounts = bankAccounts
                const setAccounts = setBankAccounts
                const editId = bankEditId
                const setEditId = setBankEditId
                const form = bankForm
                const setForm = setBankForm
                const adding = bankAdding
                const setAdding = setBankAdding
                const expandedCards = bankExpandedCards
                const setExpandedCards = setBankExpandedCards
                const addingCardFor = bankAddingCardFor
                const setAddingCardFor = setBankAddingCardFor
                const cardForm = bankCardForm
                const setCardForm = setBankCardForm

                const save = (list: typeof accounts) => { setAccounts(list); setItem('acct_company_accounts', list) }
                const toggleCards = (id: string | number) => setExpandedCards(p => ({ ...p, [String(id)]: !p[String(id)] }))
                const startAdd = () => { setAdding(true); setEditId(null); setForm(emptyBankForm) }
                const startEdit = (acc: typeof accounts[0]) => { setEditId(acc.id); setAdding(false); setForm({ bankName: acc.bankName, accountNumber: acc.accountNumber, accountHolder: acc.accountHolder, purpose: acc.purpose, manager: acc.manager, memo: acc.memo, cards: acc.cards || [] }) }
                const cancelEdit = () => { setEditId(null); setAdding(false); setForm(emptyBankForm) }

                const saveAccount = () => {
                  if (!form.bankName.trim() || !form.accountNumber.trim()) return
                  if (editId !== null) {
                    save(accounts.map(a => String(a.id) === String(editId) ? { ...a, ...form } : a))
                  } else {
                    save([...accounts, { id: Date.now(), ...form }])
                  }
                  cancelEdit()
                }
                const deleteAccount = (id: string | number) => { if (confirm('이 계좌를 삭제하시겠습니까?')) save(accounts.filter(a => String(a.id) !== String(id))) }

                const addCard = (acctId: string | number) => {
                  if (!cardForm.cardName.trim() || !cardForm.cardNumber.trim()) return
                  save(accounts.map(a => String(a.id) === String(acctId) ? { ...a, cards: [...(a.cards || []), { id: Date.now(), ...cardForm }] } : a))
                  setCardForm(emptyCardForm); setAddingCardFor(null)
                }
                const deleteCard = (acctId: string | number, cardId: string | number) => {
                  save(accounts.map(a => String(a.id) === String(acctId) ? { ...a, cards: (a.cards || []).filter(c => String(c.id) !== String(cardId)) } : a))
                }

                const renderForm = (isNew: boolean) => (
                  <div className="bg-[var(--bg-muted)] border border-[var(--border-default)] rounded-xl p-4 space-y-3">
                    <div className="text-sm font-extrabold text-[var(--text-primary)] mb-2">{isNew ? '새 계좌 추가' : '계좌 수정'}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="relative">
                        <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">은행명 *</label>
                        <input value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} placeholder="선택 또는 직접 입력" className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors" onFocus={e => { const dd = e.currentTarget.nextElementSibling as HTMLElement; if (dd) dd.style.display = 'block' }} onBlur={() => setTimeout(() => { const dd = document.getElementById('bank-dropdown'); if (dd) dd.style.display = 'none' }, 150)} />
                        <div id="bank-dropdown" style={{ display: 'none' }} className="absolute z-50 top-full left-0 right-0 mt-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg shadow-lg max-h-40 overflow-y-auto">
                          {(() => {
                            const defaultBanks = ['국민은행', '신한은행', '우리은행', '하나은행', '농협은행', 'SC제일은행', '기업은행', '카카오뱅크', '토스뱅크', '케이뱅크', '대구은행', '부산은행', '경남은행', '광주은행', '전북은행', '제주은행', '수협은행', '산업은행', '새마을금고', '신협', '우체국']
                            const custom = accounts.map(a => a.bankName).filter(Boolean)
                            const all = Array.from(new Set([...defaultBanks, ...custom]))
                            const filtered = all.filter(b => !form.bankName || b.includes(form.bankName))
                            if (filtered.length === 0) return <div className="px-3 py-2 text-xs text-[var(--text-muted)]">직접 입력하세요</div>
                            return filtered.map(b => (
                              <button key={b} type="button" onMouseDown={e => { e.preventDefault(); setForm(f => ({ ...f, bankName: b })); const dd = document.getElementById('bank-dropdown'); if (dd) dd.style.display = 'none' }} className="w-full text-left px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer transition-colors">
                                {b}
                              </button>
                            ))
                          })()}
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">계좌번호 *</label>
                        <input value={form.accountNumber} onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))} placeholder="000-000-000000" className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors" />
                      </div>
                      <div className="relative">
                        <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">예금주</label>
                        <input value={form.accountHolder} onChange={e => setForm(f => ({ ...f, accountHolder: e.target.value }))} placeholder="선택 또는 직접 입력" className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors" onFocus={e => { const dd = e.currentTarget.nextElementSibling as HTMLElement; if (dd) dd.style.display = 'block' }} onBlur={() => setTimeout(() => { const dd = document.getElementById('holder-dropdown'); if (dd) dd.style.display = 'none' }, 150)} />
                        <div id="holder-dropdown" style={{ display: 'none' }} className="absolute z-50 top-full left-0 right-0 mt-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg shadow-lg max-h-32 overflow-y-auto">
                          {(() => {
                            const holders = Array.from(new Set(accounts.map(a => a.accountHolder).filter(Boolean)))
                            const filtered = holders.filter(h => !form.accountHolder || h.includes(form.accountHolder))
                            if (filtered.length === 0) return <div className="px-3 py-2 text-xs text-[var(--text-muted)]">직접 입력하세요</div>
                            return filtered.map(h => (
                              <button key={h} type="button" onMouseDown={e => { e.preventDefault(); setForm(f => ({ ...f, accountHolder: h })); const dd = document.getElementById('holder-dropdown'); if (dd) dd.style.display = 'none' }} className="w-full text-left px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer transition-colors">
                                {h}
                              </button>
                            ))
                          })()}
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">용도</label>
                        <input value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} placeholder="운영비, 인건비 등" className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors" />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">메모</label>
                        <input value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))} placeholder="비고" className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button onClick={cancelEdit} className="px-3 py-1.5 rounded-lg border border-[var(--border-default)] text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer">취소</button>
                      <button onClick={saveAccount} className="px-3 py-1.5 rounded-lg bg-primary-500 text-white text-xs font-bold hover:bg-primary-600 transition-colors cursor-pointer">저장</button>
                    </div>
                  </div>
                )

                return (
                  <>
                    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                      {accounts.length === 0 && !adding && (
                        <div className="text-center py-10 text-[var(--text-muted)] text-sm">
                          <Landmark size={32} className="mx-auto mb-2 opacity-40" />
                          등록된 계좌가 없습니다
                        </div>
                      )}

                      {accounts.map(acc => (
                        editId !== null && String(editId) === String(acc.id) ? (
                          <div key={acc.id}>{renderForm(false)}</div>
                        ) : (
                          <div key={acc.id} className="border border-[var(--border-default)] rounded-xl overflow-hidden bg-[var(--bg-surface)] hover:border-blue-300 transition-colors">
                            {/* 계좌 정보 */}
                            <div className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white"><Landmark size={14} /></div>
                                  <div>
                                    <div className="text-sm font-extrabold text-[var(--text-primary)]">{acc.bankName}</div>
                                    <div className="text-xs text-[var(--text-muted)] font-mono">{acc.accountNumber}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button onClick={() => startEdit(acc)} className="p-1.5 rounded-lg hover:bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-blue-500 cursor-pointer transition-colors"><Edit3 size={13} /></button>
                                  <button onClick={() => deleteAccount(acc.id)} className="p-1.5 rounded-lg hover:bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-red-500 cursor-pointer transition-colors"><Trash2 size={13} /></button>
                                </div>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)]">
                                {acc.accountHolder && <span>예금주: <b>{acc.accountHolder}</b></span>}
                                {acc.purpose && <span>용도: {acc.purpose}</span>}

                                {acc.memo && <span className="text-[var(--text-muted)]">({acc.memo})</span>}
                              </div>
                            </div>
                            {/* 연결카드 아코디언 */}
                            <div className="border-t border-[var(--border-default)]">
                              <button onClick={() => toggleCards(acc.id)} className="w-full flex items-center justify-between px-4 py-2 text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] cursor-pointer transition-colors">
                                <span className="flex items-center gap-1"><CreditCard size={12} /> 연결 카드 ({(acc.cards || []).length})</span>
                                {expandedCards[String(acc.id)] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                              {expandedCards[String(acc.id)] && (
                                <div className="px-4 pb-3 space-y-2">
                                  {(acc.cards || []).length === 0 && String(addingCardFor) !== String(acc.id) && (
                                    <div className="text-xs text-[var(--text-muted)] text-center py-2">연결된 카드가 없습니다</div>
                                  )}
                                  {(acc.cards || []).map(card => (
                                    <div key={card.id} className="flex items-center justify-between bg-[var(--bg-muted)] rounded-lg px-3 py-2">
                                      <div className="flex items-center gap-2 text-xs flex-wrap">
                                        <CreditCard size={12} className="text-violet-500" />
                                        <span className="font-bold text-[var(--text-primary)]">{card.cardName}</span>
                                        <span className="text-[var(--text-muted)] font-mono">{card.cardNumber}</span>
                                        <span className="text-[var(--text-secondary)]">{card.cardCompany}</span>
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${card.cardType === '신용카드' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>{card.cardType}</span>
                                        {card.cardUser && <span className="text-[var(--text-muted)]">({card.cardUser})</span>}
                                        {card.expiryDate && <span className="text-[var(--text-muted)]">{card.expiryDate}</span>}
                                      </div>
                                      <button onClick={() => deleteCard(acc.id, card.id)} className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-[var(--text-muted)] hover:text-red-500 cursor-pointer transition-colors"><Trash2 size={11} /></button>
                                    </div>
                                  ))}
                                  {String(addingCardFor) === String(acc.id) ? (
                                    <div className="bg-[var(--bg-surface)] border border-dashed border-[var(--border-default)] rounded-lg p-3 space-y-2">
                                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        <input value={cardForm.cardName} onChange={e => setCardForm(f => ({ ...f, cardName: e.target.value }))} placeholder="카드명 *" className="px-2 py-1.5 rounded border border-[var(--border-default)] bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] focus:border-primary-500 outline-none" />
                                        <div className="relative">
                                          <input value={cardForm.cardCompany} onChange={e => setCardForm(f => ({ ...f, cardCompany: e.target.value }))} placeholder="선택/입력" className="w-full px-2 py-1.5 rounded border border-[var(--border-default)] bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] focus:border-primary-500 outline-none" onFocus={e => { const dd = e.currentTarget.nextElementSibling as HTMLElement; if (dd) dd.style.display = 'block' }} onBlur={() => setTimeout(() => { const dd = document.getElementById('cardco-dropdown'); if (dd) dd.style.display = 'none' }, 150)} />
                                          <div id="cardco-dropdown" style={{ display: 'none' }} className="absolute z-50 top-full left-0 right-0 mt-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg shadow-lg max-h-32 overflow-y-auto">
                                            {(() => {
                                              const defaults = ['국민카드', '신한카드', '삼성카드', '현대카드', '롯데카드', '우리카드', '하나카드', 'BC카드', 'NH농협카드', '카카오뱅크']
                                              const custom = accounts.flatMap(a => (a.cards || []).map((c: any) => c.cardCompany)).filter(Boolean)
                                              const all = Array.from(new Set([...defaults, ...custom]))
                                              const filtered = all.filter(c => !cardForm.cardCompany || c.includes(cardForm.cardCompany))
                                              if (filtered.length === 0) return <div className="px-2 py-1.5 text-[10px] text-[var(--text-muted)]">직접 입력</div>
                                              return filtered.map(c => (
                                                <button key={c} type="button" onMouseDown={e => { e.preventDefault(); setCardForm(f => ({ ...f, cardCompany: c })); const dd = document.getElementById('cardco-dropdown'); if (dd) dd.style.display = 'none' }} className="w-full text-left px-2 py-1.5 text-xs text-[var(--text-primary)] hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer transition-colors">
                                                  {c}
                                                </button>
                                              ))
                                            })()}
                                          </div>
                                        </div>
                                        <input value={cardForm.cardNumber} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 16); const fmt = v.replace(/(.{4})/g, '$1-').replace(/-$/, ''); setCardForm(f => ({ ...f, cardNumber: fmt })) }} placeholder="0000-0000-0000-0000" className="px-2 py-1.5 rounded border border-[var(--border-default)] bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] focus:border-primary-500 outline-none" />
                                        <select value={cardForm.cardType} onChange={e => setCardForm(f => ({ ...f, cardType: e.target.value }))} className="px-2 py-1.5 rounded border border-[var(--border-default)] bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] focus:border-primary-500 outline-none">
                                          <option>체크카드</option><option>신용카드</option>
                                        </select>
                                        <input value={cardForm.expiryDate} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 4); const fmt = v.length > 2 ? v.slice(0, 2) + '/' + v.slice(2) : v; setCardForm(f => ({ ...f, expiryDate: fmt })) }} placeholder="MM/YY" maxLength={5} className="px-2 py-1.5 rounded border border-[var(--border-default)] bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] focus:border-primary-500 outline-none" />
                                        <input value={cardForm.cardUser} onChange={e => setCardForm(f => ({ ...f, cardUser: e.target.value }))} placeholder="비고" className="px-2 py-1.5 rounded border border-[var(--border-default)] bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] focus:border-primary-500 outline-none" />
                                      </div>
                                      <div className="flex justify-end gap-2">
                                        <button onClick={() => { setAddingCardFor(null); setCardForm(emptyCardForm) }} className="px-2 py-1 rounded text-[11px] font-bold text-[var(--text-secondary)] border border-[var(--border-default)] hover:bg-[var(--bg-muted)] cursor-pointer transition-colors">취소</button>
                                        <button onClick={() => addCard(acc.id)} className="px-2 py-1 rounded text-[11px] font-bold text-white bg-violet-500 hover:bg-violet-600 cursor-pointer transition-colors">추가</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button onClick={() => { setAddingCardFor(acc.id); setCardForm(emptyCardForm) }} className="w-full flex items-center justify-center gap-1 py-2 rounded-lg border border-dashed border-[var(--border-default)] text-xs font-bold text-[var(--text-muted)] hover:border-violet-400 hover:text-violet-500 cursor-pointer transition-colors">
                                      <Plus size={12} /> 카드 추가
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      ))}

                      {adding && renderForm(true)}
                    </div>
                    {/* 하단 */}
                    <div className="flex justify-between items-center px-5 py-3 border-t border-[var(--border-default)]">
                      <button onClick={startAdd} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-dashed border-violet-400 text-xs font-bold text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 cursor-pointer transition-colors">
                        <Plus size={12} /> 계좌 추가
                      </button>
                      <button onClick={() => setBankModalOpen(false)} className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer">닫기</button>
                    </div>
                  </>
                )
              })()}
          </div>
        </div>
      , document.body)}

      {/* ═══════════════════════════════════════════
         모달: 예산항목 추가/수정
         ═══════════════════════════════════════════ */}
      {budgetModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={() => setBudgetModalOpen(false)}>
          <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-[460px] mx-4 border border-[var(--border-default)]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)]">
              <h3 className="text-base font-extrabold text-[var(--text-primary)]">{budgetEditId ? '예산 수정' : '예산 추가'}</h3>
              <button onClick={() => setBudgetModalOpen(false)} className="text-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">✕</button>
            </div>
            <div className="px-5 py-4 space-y-3">
              {/* 예산목 - 검색 콤보박스 */}
              <div className="relative">
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 flex items-center gap-1">
                  예산목 *
                  {isNewItemName && <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">+ 새 항목</span>}
                </label>
                <input
                  value={budgetForm.itemName}
                  onChange={e => {
                    setBudgetForm(f => ({ ...f, itemName: e.target.value }))
                    setItemNameSearch(e.target.value)
                    setItemNamePopup(true)
                    setAcctPopup(false)
                  }}
                  onFocus={() => { setItemNamePopup(true); setAcctPopup(false); setItemNameSearch(budgetForm.itemName) }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (filteredItemNames.length > 0) {
                        const first = filteredItemNames[0]
                        setBudgetForm(f => ({ ...f, itemName: first }))
                        setItemNameSearch(first)
                      }
                      setItemNamePopup(false)
                    }
                  }}
                  placeholder="예산목을 검색하거나 새로 입력하세요"
                  className={cn(
                    'w-full px-3 py-2.5 rounded-lg border bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors',
                    isNewItemName ? 'border-emerald-400' : 'border-[var(--border-default)]'
                  )}
                  autoFocus
                />
                {itemNamePopup && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-xl z-50 max-h-[220px] overflow-hidden">
                    <div className="max-h-[200px] overflow-y-auto p-1.5">
                      {filteredItemNames.map(name => {
                        const def = budgetItemDefs.find(d => d.name === name)
                        return (
                        <button key={name}
                          onClick={() => {
                            const acctCode = def?.defaultAccountCode || ''
                            const contraCode = def?.accountPool?.[0]?.contraAccountCode || (acctCode ? suggestContraAccount(acctCode) : '')
                            setBudgetForm(f => ({ ...f, itemName: name, subItemName: '', detailItemName: '', budgetItemDefId: def?.id, accountCode: acctCode, contraAccountCode: contraCode }))
                            setItemNameSearch(name)
                            setItemNamePopup(false)
                          }}
                          className={cn('w-full text-left text-[12px] px-3 py-2 rounded-lg cursor-pointer transition-colors',
                            budgetForm.itemName === name ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 font-bold' : 'hover:bg-[var(--bg-muted)] text-[var(--text-secondary)]')}
                        >
                          {name}
                          {def && <span className="ml-1 text-[9px] text-[var(--text-muted)]">({def.subItems.length}개 세목)</span>}
                        </button>
                        )
                      })}
                      {filteredItemNames.length === 0 && budgetForm.itemName.trim() && (
                        <div className="text-center text-xs py-3 space-y-1">
                          <div className="text-emerald-500 font-bold">✨ "{budgetForm.itemName.trim()}"</div>
                          <div className="text-[var(--text-muted)]">새 예산목으로 등록됩니다</div>
                        </div>
                      )}
                      {filteredItemNames.length === 0 && !budgetForm.itemName.trim() && (
                        <div className="text-center text-xs text-[var(--text-muted)] py-3">등록된 예산목이 없습니다</div>
                      )}
                    </div>
                  </div>
                )}
              </div>


              {/* 예산세목 드롭다운 */}
              {availableSubItems.length > 0 && (
              <div className="relative">
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">예산세목</label>
                <div
                  onClick={() => { setSubNamePopup(!subNamePopup); setItemNamePopup(false); setDetailNamePopup(false) }}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm cursor-pointer hover:border-primary-400 transition-colors min-h-[40px] flex items-center"
                >
                  {budgetForm.subItemName ? (
                    <span className="text-[var(--text-primary)] font-semibold">{budgetForm.subItemName}</span>
                  ) : (
                    <span className="text-[var(--text-muted)]">세목을 선택하세요</span>
                  )}
                </div>
                {subNamePopup && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-xl z-50 max-h-[220px] overflow-hidden">
                    <div className="max-h-[200px] overflow-y-auto p-1.5">
                      {availableSubItems.map(sub => (
                        <button key={sub.id}
                          onClick={() => {
                            const acctCode = sub.accountCode || selectedItemDef?.defaultAccountCode || budgetForm.accountCode
                            const contraCode = selectedItemDef?.accountPool?.find(p => p.accountCode === acctCode)?.contraAccountCode || budgetForm.contraAccountCode
                            setBudgetForm(f => ({ ...f, subItemName: sub.name, detailItemName: '', budgetSubDefId: sub.id, accountCode: acctCode, contraAccountCode: contraCode }))
                            setSubNamePopup(false)
                          }}
                          className={cn('w-full text-left text-[12px] px-3 py-2 rounded-lg cursor-pointer transition-colors',
                            budgetForm.subItemName === sub.name ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 font-bold' : 'hover:bg-[var(--bg-muted)] text-[var(--text-secondary)]')}
                        >
                          {sub.name}
                          {sub.detailItems && sub.detailItems.length > 0 && <span className="ml-1 text-[9px] text-[var(--text-muted)]">({sub.detailItems.length}개 세세항목)</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              )}
              {availableSubItems.length === 0 && (
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">예산세목</label>
                <input
                  value={budgetForm.subItemName}
                  onChange={e => setBudgetForm(f => ({ ...f, subItemName: e.target.value }))}
                  placeholder="예산세목을 입력하세요 (선택)"
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors"
                />
              </div>
              )}

              {/* 세세항목 드롭다운 */}
              {availableDetailItems.length > 0 && (
              <div className="relative">
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">세세항목</label>
                <div
                  onClick={() => { setDetailNamePopup(!detailNamePopup); setSubNamePopup(false); setItemNamePopup(false) }}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm cursor-pointer hover:border-primary-400 transition-colors min-h-[40px] flex items-center"
                >
                  {budgetForm.detailItemName ? (
                    <span className="text-[var(--text-primary)] font-semibold">{budgetForm.detailItemName}</span>
                  ) : (
                    <span className="text-[var(--text-muted)]">세세항목을 선택하세요</span>
                  )}
                </div>
                {detailNamePopup && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-xl z-50 max-h-[220px] overflow-hidden">
                    <div className="max-h-[200px] overflow-y-auto p-1.5">
                      {availableDetailItems.map(det => (
                        <button key={det.id}
                          onClick={() => {
                            const acctCode = det.accountCode || selectedSubDef?.accountCode || selectedItemDef?.defaultAccountCode || budgetForm.accountCode
                            const contraCode = selectedItemDef?.accountPool?.find(p => p.accountCode === acctCode)?.contraAccountCode || budgetForm.contraAccountCode
                            setBudgetForm(f => ({ ...f, detailItemName: det.name, accountCode: acctCode, contraAccountCode: contraCode }))
                            setDetailNamePopup(false)
                          }}
                          className={cn('w-full text-left text-[12px] px-3 py-2 rounded-lg cursor-pointer transition-colors',
                            budgetForm.detailItemName === det.name ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 font-bold' : 'hover:bg-[var(--bg-muted)] text-[var(--text-secondary)]')}
                        >
                          {det.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              )}

              {/* 계정과목/상대계정 - 자동 읽기전용 */}
              {budgetForm.accountCode && (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 flex items-center gap-1">
                      계정과목
                      <span className="text-[8px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">⚙ 자동</span>
                    </label>
                    <div className="w-full px-3 py-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-900/10 text-sm min-h-[40px] flex items-center">
                      <span className="text-primary-500 font-mono font-bold text-[11px]">{budgetForm.accountCode}</span>
                      <span className="ml-1.5 text-[var(--text-primary)] font-semibold">{accounts.find(a => a.code === budgetForm.accountCode)?.name || ''}</span>
                    </div>
                  </div>
                  {budgetForm.contraAccountCode && (
                    <div className="flex-1">
                      <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 flex items-center gap-1">
                        상대계정
                        <span className="text-[8px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">⚙ 자동</span>
                      </label>
                      <div className="w-full px-3 py-2.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-900/10 text-sm min-h-[40px] flex items-center">
                        <span className="text-amber-600 font-mono font-bold text-[11px]">{budgetForm.contraAccountCode}</span>
                        <span className="ml-1.5 text-[var(--text-primary)] font-semibold">{accounts.find(a => a.code === budgetForm.contraAccountCode)?.name || ''}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">연간 예산액 (원) *</label>
                <input
                  value={budgetForm.amount}
                  onChange={e => handleAmountInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveBudgetItem() }}
                  placeholder="예) 50,000,000"
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">메모</label>
                <input
                  value={budgetForm.memo}
                  onChange={e => setBudgetForm(f => ({ ...f, memo: e.target.value }))}
                  placeholder="예산 설명"
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-[var(--border-default)]">
              <button onClick={() => setBudgetModalOpen(false)} className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer">취소</button>
              <button onClick={saveBudgetItem} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-bold hover:bg-primary-600 transition-colors cursor-pointer">저장</button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* ═══════════════════════════════════════════
         모달: 예산과목 선택 — 예산서 스타일
         ═══════════════════════════════════════════ */}
      {budgetPickerOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={() => { setBudgetPickerOpen(false); setPickerAliasPovId(null) }}>
          <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-[700px] mx-4 border border-[var(--border-default)] max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)]">
              <div>
                <h3 className="text-base font-extrabold text-[var(--text-primary)] flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-500"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M9 14l2 2 4-4"/></svg>{pickerFilterItem ? `${pickerFilterItem} — 세목 선택` : '예산과목 선택'}</h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">항목을 선택하세요. 숫자 배지를 클릭하면 동의어를 관리합니다.</p>
              </div>
              <button onClick={() => { setBudgetPickerOpen(false); setPickerAliasPovId(null) }} className="text-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">✕</button>
            </div>
            {/* 검색 */}
            <div className="px-4 py-2 border-b border-[var(--border-default)]">
              <div className="relative">
                <input value={pickerSearch} onChange={e => setPickerSearch(e.target.value)}
                  placeholder="예산과목 검색... (구분, 항목, 세목, 동의어)"
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[12px] text-[var(--text-primary)] focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400/30 transition-all" />
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                {pickerSearch && <button onClick={() => setPickerSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-[11px] cursor-pointer">✕</button>}
              </div>
            </div>
            {/* 테이블 */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full border-collapse" style={{ borderSpacing: 0 }}>
                <thead className="sticky top-0 z-10">
                  <tr style={{ background: 'var(--bg-muted)' }}>
                    <th className="text-[11px] font-extrabold text-[var(--text-muted)] text-center px-3 py-2.5 border border-[var(--border-default)]" style={{ width: '140px' }}>예산구분</th>
                    <th className="text-[11px] font-extrabold text-[var(--text-muted)] text-center px-3 py-2.5 border border-[var(--border-default)]" style={{ width: '140px' }}>예산항목</th>
                    <th className="text-[11px] font-extrabold text-[var(--text-muted)] text-center px-3 py-2.5 border border-[var(--border-default)]">예산세목</th>
                    <th className="text-[11px] font-extrabold text-[var(--text-muted)] text-center px-3 py-2.5 border border-[var(--border-default)]" style={{ width: '45px' }}>선택</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const CC = { item: '#8b5cf6', sub: '#4f6ef7', det: '#22c55e' }
                    const sq = pickerSearch.trim().toLowerCase()
                    const defs = budgetItemDefs.filter(d => {
                      if (pickerFilterItem && d.name !== pickerFilterItem && !d.aliases.includes(pickerFilterItem)) return false
                      if (!sq) return true
                      // 구분명/동의어 매칭
                      if (d.name.toLowerCase().includes(sq) || d.aliases.some(a => a.toLowerCase().includes(sq))) return true
                      // 하위 과목/세목/동의어 매칭
                      if (d.subItems?.some(s => {
                        if (s.name.toLowerCase().includes(sq) || (s.aliases||[]).some(a => a.toLowerCase().includes(sq))) return true
                        return s.detailItems?.some(dt => dt.name.toLowerCase().includes(sq) || (dt.aliases||[]).some(a => a.toLowerCase().includes(sq)))
                      })) return true
                      return false
                    })
                    const R: React.ReactNode[] = []

                    /* 검색어 하이라이트 함수 */
                    const hlText = (text: string) => {
                      if (!sq || !text) return <>{text}</>
                      const idx = text.toLowerCase().indexOf(sq)
                      if (idx === -1) return <>{text}</>
                      return <>{text.slice(0, idx)}<span style={{ color: '#ea580c', fontWeight: 800 }}>{text.slice(idx, idx + sq.length)}</span>{text.slice(idx + sq.length)}</>
                    }
                    const hl = (text: string, aliases?: string[]) => {
                      if (!sq || !text) return text
                      // 표시이름에 검색어 포함
                      if (text.toLowerCase().includes(sq)) return hlText(text)
                      // 동의어에 검색어 포함 시 매칭 동의어 표시
                      if (aliases && aliases.length > 0) {
                        const matched = aliases.find(a => a.toLowerCase().includes(sq))
                        if (matched) return <>{text} <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: '#ea580c15', color: '#ea580c', fontWeight: 700 }}>={hlText(matched)}</span></>
                      }
                      return text
                    }

                    /* 배지 + 인라인 팝업 통합 컴포넌트 */
                    const badgeWithPov = (cnt: number, c: string, pid: string, lv: 'item'|'sub'|'det', lb: string, nm: string, al: string[], dn: string, sn?: string, dtn?: string) => {
                      const isOpen = pickerAliasPovId === pid
                      // 원래 이름 찾기
                      const origDef = budgetItemDefs.find(d => d.name === dn || d.aliases.includes(dn))
                      let origName = dn
                      if (lv === 'sub' && origDef) {
                        const origSub = origDef.subItems.find(s => s.name === sn || (s.aliases||[]).includes(sn||''))
                        if (origSub) origName = origSub.name
                      } else if (lv === 'det' && origDef) {
                        const origSub = origDef.subItems.find(s => s.name === sn || (s.aliases||[]).includes(sn||''))
                        const origDet = origSub?.detailItems?.find(d => d.name === dtn || (d.aliases||[]).includes(dtn||''))
                        if (origDet) origName = origDet.name
                      } else if (origDef) {
                        origName = origDef.name
                      }
                      // 현재 표시이름
                      let displayKey = ''
                      if (lv === 'item') displayKey = `item:${dn}`
                      else if (lv === 'sub') displayKey = `sub:${dn}>${sn}`
                      else displayKey = `det:${dn}>${sn}>${dtn}`
                      const curDisplay = pickerDisplayNames[displayKey] || nm

                      const handleSelect = (newName: string) => {
                        setPickerDisplayNames(prev => ({ ...prev, [displayKey]: newName }))
                        renameByAlias(lv, nm, newName, lv === 'sub' || lv === 'det' ? dn : undefined, lv === 'det' ? sn : undefined)
                        setPickerAliasPovId(null)
                      }

                      return (
                        <span className="relative inline-block">
                          <button onClick={(e) => { e.stopPropagation(); setPickerAliasPovId(isOpen ? null : pid); setPickerAliasInput('') }}
                            className="inline-flex items-center justify-center min-w-[16px] h-[16px] rounded-full text-[8px] font-extrabold ml-1 cursor-pointer hover:scale-110 transition-transform"
                            style={cnt > 0 ? { background: c, color: 'white' } : { border: `1.5px dashed ${c}`, color: c, background: 'transparent' }}
                            title="동의어 관리">{cnt > 0 ? cnt : '+'}</button>
                          {isOpen && (
                            <div className="absolute left-0 top-full mt-1 z-50 w-[320px] rounded-xl shadow-xl border border-[var(--border-default)] bg-[var(--bg-surface)]" onClick={e => e.stopPropagation()}>
                              <div className="px-3 py-2.5" style={{ background: `${c}06`, borderRadius: 'inherit' }}>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full text-white" style={{ background: c }}>{lb}</span>
                                  <span className="text-[11px] font-bold text-[var(--text-primary)]">{nm} 동의어</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                  <button onClick={() => handleSelect(origName)}
                                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border-2 cursor-pointer hover:scale-105 transition-transform"
                                    style={{ borderColor: c, color: c, background: curDisplay === origName ? `${c}20` : 'transparent' }}>
                                    📌 {origName} {curDisplay === origName && <span className="text-[7px]">(현재)</span>}
                                  </button>
                                  {al.map(a => (
                                    <button key={a} onClick={() => handleSelect(a)}
                                      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer hover:scale-105 transition-transform"
                                      style={{ background: curDisplay === a ? `${c}30` : `${c}15`, color: c, border: curDisplay === a ? `2px solid ${c}` : 'none' }}>
                                      {a} {curDisplay === a && <span className="text-[7px]">(현재)</span>}
                                    </button>
                                  ))}
                                </div>
                                <div className="flex gap-1.5">
                                  <input value={pickerAliasInput} onChange={e => setPickerAliasInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') addPickerAlias(lv, dn, sn, dtn, pickerAliasInput) }}
                                    placeholder="새 동의어..." className="flex-1 px-2 py-1 rounded-lg border border-[var(--border-default)] text-[10px] bg-[var(--bg-surface)] focus:outline-none focus:ring-1" />
                                  <button onClick={() => addPickerAlias(lv, dn, sn, dtn, pickerAliasInput)}
                                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-white cursor-pointer hover:opacity-90" style={{ background: c }}>추가</button>
                                </div>
                                {al.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2 pt-1.5 border-t border-dashed" style={{ borderColor: `${c}30` }}>
                                    <span className="text-[8px] text-[var(--text-muted)] mr-1 self-center">삭제:</span>
                                    {al.map(a => (
                                      <button key={`del-${a}`} onClick={() => removePickerAlias(lv, dn, a, sn, dtn)}
                                        className="text-[8px] px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-900/10 text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 cursor-pointer transition-colors">
                                        {a} ✕
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </span>
                      )
                    }
                    defs.forEach(def => {
                      const hasSub = def.subItems && def.subItems.length > 0
                      const ip = `item:${def.name}`
                      const itemDisplay = pickerDisplayNames[`item:${def.name}`] || def.name
                      // 행 단위 매칭 함수
                      const matchRow = (names: string[]) => {
                        if (!sq) return true
                        return names.some(n => n.toLowerCase().includes(sq))
                      }
                      if (!hasSub) {
                        if (!matchRow([def.name, ...def.aliases, itemDisplay])) return
                        const chk = pickerChecked.has(def.name)
                        R.push(
                          <tr key={`i-${def.id}`} className="hover:bg-[var(--bg-muted)]/40 transition-colors">
                            <td className="px-3 py-2 border border-[var(--border-default)] text-[13px] font-extrabold text-[var(--text-primary)] align-middle">{hl(itemDisplay, def.aliases)}{badgeWithPov(def.aliases.length, CC.item, ip, 'item', '구분', def.name, def.aliases, def.name)}</td>
                            <td className="px-3 py-2 border border-[var(--border-default)] text-center text-[var(--text-muted)] align-middle">—</td>
                            <td className="px-3 py-2 border border-[var(--border-default)] text-center text-[var(--text-muted)] align-middle">—</td>
                            <td className="border border-[var(--border-default)] text-center align-middle">
                              <input type="checkbox" checked={chk} onChange={() => { const n = new Set(pickerChecked); if (chk) n.delete(def.name); else n.add(def.name); setPickerChecked(n) }} className="w-4 h-4 accent-primary-500 cursor-pointer" />
                            </td>
                          </tr>
                        )
                        return
                      }

                      if (sq) {
                        /* ── 검색 모드: 구분은 rowSpan, 행별 필터 ── */
                        // 1) 매칭 행 수 먼저 계산
                        let matchCount = 0
                        def.subItems.forEach(sub => {
                          const subDisplay = pickerDisplayNames[`sub:${def.name}>${sub.name}`] || sub.name
                          const hd = sub.detailItems && sub.detailItems.length > 0
                          if (!hd) {
                            if (matchRow([def.name, ...def.aliases, itemDisplay, sub.name, ...(sub.aliases||[]), subDisplay])) matchCount++
                          } else {
                            sub.detailItems!.forEach(det => {
                              if (matchRow([def.name, ...def.aliases, itemDisplay, sub.name, ...(sub.aliases||[]), subDisplay, det.name, ...(det.aliases||[]), pickerDisplayNames[`det:${def.name}>${sub.name}>${det.name}`] || ''])) matchCount++
                            })
                          }
                        })
                        if (matchCount === 0) return
                        // 2) 렌더링
                        let isFirst = true
                        def.subItems.forEach(sub => {
                          const sp = `sub:${def.name}>${sub.name}`
                          const subDisplay = pickerDisplayNames[`sub:${def.name}>${sub.name}`] || sub.name
                          const hd = sub.detailItems && sub.detailItems.length > 0
                          if (!hd) {
                            if (!matchRow([def.name, ...def.aliases, itemDisplay, sub.name, ...(sub.aliases||[]), subDisplay])) return
                            const ck = `${def.name}>${sub.name}`
                            const chk = pickerChecked.has(ck)
                            R.push(
                              <tr key={`s-${def.id}-${sub.id}`} className="hover:bg-[var(--bg-muted)]/40 transition-colors">
                                {isFirst && <td className="px-3 py-2 border border-[var(--border-default)] text-[13px] font-extrabold text-[var(--text-primary)]" rowSpan={matchCount} style={{ verticalAlign: 'top', paddingTop: 10 }}>{hl(itemDisplay, def.aliases)}{badgeWithPov(def.aliases.length, CC.item, ip, 'item', '구분', def.name, def.aliases, def.name)}</td>}
                                <td className="px-3 py-2 border border-[var(--border-default)] text-[12px] font-semibold text-[var(--text-secondary)] align-middle">{hl(subDisplay, sub.aliases||[])}{badgeWithPov((sub.aliases||[]).length, CC.sub, sp, 'sub', '항목', sub.name, sub.aliases||[], def.name, sub.name)}</td>
                                <td className="px-3 py-2 border border-[var(--border-default)] text-center text-[var(--text-muted)] align-middle">—</td>
                                <td className="border border-[var(--border-default)] text-center align-middle">
                                  <input type="checkbox" checked={chk} onChange={() => { const n = new Set(pickerChecked); if (chk) n.delete(ck); else n.add(ck); setPickerChecked(n) }} className="w-4 h-4 accent-primary-500 cursor-pointer" />
                                </td>
                              </tr>
                            )
                            isFirst = false
                          } else {
                            sub.detailItems!.forEach(det => {
                              if (!matchRow([def.name, ...def.aliases, itemDisplay, sub.name, ...(sub.aliases||[]), subDisplay, det.name, ...(det.aliases||[]), pickerDisplayNames[`det:${def.name}>${sub.name}>${det.name}`] || ''])) return
                              const dp = `det:${def.name}>${sub.name}>${det.name}`
                              const detDisplay = pickerDisplayNames[`det:${def.name}>${sub.name}>${det.name}`] || det.name
                              const dk = `${def.name}>${sub.name}>${det.name}`
                              const chk = pickerChecked.has(dk)
                              R.push(
                                <tr key={`d-${def.id}-${sub.id}-${det.id}`} className="hover:bg-[var(--bg-muted)]/40 transition-colors">
                                  {isFirst && <td className="px-3 py-2 border border-[var(--border-default)] text-[13px] font-extrabold text-[var(--text-primary)]" rowSpan={matchCount} style={{ verticalAlign: 'top', paddingTop: 10 }}>{hl(itemDisplay, def.aliases)}{badgeWithPov(def.aliases.length, CC.item, ip, 'item', '구분', def.name, def.aliases, def.name)}</td>}
                                  <td className="px-3 py-2 border border-[var(--border-default)] text-[12px] font-semibold text-[var(--text-secondary)] align-middle">{hl(subDisplay, sub.aliases||[])}{badgeWithPov((sub.aliases||[]).length, CC.sub, sp, 'sub', '항목', sub.name, sub.aliases||[], def.name, sub.name)}</td>
                                  <td className="px-3 py-1.5 border border-[var(--border-default)] text-[11px] text-[var(--text-secondary)] align-middle">{hl(detDisplay, det.aliases||[])}{badgeWithPov((det.aliases||[]).length, CC.det, dp, 'det', '세목', det.name, det.aliases||[], def.name, sub.name, det.name)}</td>
                                  <td className="border border-[var(--border-default)] text-center align-middle">
                                    <input type="checkbox" checked={chk} onChange={() => { const n = new Set(pickerChecked); if (chk) n.delete(dk); else n.add(dk); setPickerChecked(n) }} className="w-3.5 h-3.5 accent-primary-500 cursor-pointer" />
                                  </td>
                                </tr>
                              )
                              isFirst = false
                            })
                          }
                        })
                      } else {
                        /* ── 기본 모드: rowSpan 사용 ── */
                        let dt = 0
                        def.subItems.forEach(s => { dt += (s.detailItems && s.detailItems.length > 0) ? s.detailItems.length : 1 })
                        let fd = true
                        def.subItems.forEach(sub => {
                          const sp = `sub:${def.name}>${sub.name}`
                          const subDisplay = pickerDisplayNames[`sub:${def.name}>${sub.name}`] || sub.name
                          const hd = sub.detailItems && sub.detailItems.length > 0
                          const ss = hd ? sub.detailItems!.length : 1
                          if (!hd) {
                            const ck = `${def.name}>${sub.name}`
                            const chk = pickerChecked.has(ck)
                            R.push(
                              <tr key={`s-${def.id}-${sub.id}`} className="hover:bg-[var(--bg-muted)]/40 transition-colors">
                                {fd && <td className="px-3 py-2 border border-[var(--border-default)] text-[13px] font-extrabold text-[var(--text-primary)]" rowSpan={dt} style={{ verticalAlign: 'top', paddingTop: 10 }}>{hl(itemDisplay, def.aliases)}{badgeWithPov(def.aliases.length, CC.item, ip, 'item', '구분', def.name, def.aliases, def.name)}</td>}
                                <td className="px-3 py-2 border border-[var(--border-default)] text-[12px] font-semibold text-[var(--text-secondary)] align-middle">{hl(subDisplay, sub.aliases||[])}{badgeWithPov((sub.aliases||[]).length, CC.sub, sp, 'sub', '항목', sub.name, sub.aliases||[], def.name, sub.name)}</td>
                                <td className="px-3 py-2 border border-[var(--border-default)] text-center text-[var(--text-muted)] align-middle">—</td>
                                <td className="border border-[var(--border-default)] text-center align-middle">
                                  <input type="checkbox" checked={chk} onChange={() => { const n = new Set(pickerChecked); if (chk) n.delete(ck); else n.add(ck); setPickerChecked(n) }} className="w-4 h-4 accent-primary-500 cursor-pointer" />
                                </td>
                              </tr>
                            )
                            fd = false
                          } else {
                            sub.detailItems!.forEach((det, di) => {
                              const dp = `det:${def.name}>${sub.name}>${det.name}`
                              const detDisplay = pickerDisplayNames[`det:${def.name}>${sub.name}>${det.name}`] || det.name
                              const dk = `${def.name}>${sub.name}>${det.name}`
                              const chk = pickerChecked.has(dk)
                              R.push(
                                <tr key={`d-${def.id}-${sub.id}-${det.id}`} className="hover:bg-[var(--bg-muted)]/40 transition-colors">
                                  {fd && di === 0 && <td className="px-3 py-2 border border-[var(--border-default)] text-[13px] font-extrabold text-[var(--text-primary)]" rowSpan={dt} style={{ verticalAlign: 'top', paddingTop: 10 }}>{hl(itemDisplay, def.aliases)}{badgeWithPov(def.aliases.length, CC.item, ip, 'item', '구분', def.name, def.aliases, def.name)}</td>}
                                  {di === 0 && <td className="px-3 py-2 border border-[var(--border-default)] text-[12px] font-semibold text-[var(--text-secondary)]" rowSpan={ss} style={{ verticalAlign: 'top', paddingTop: 10 }}>{hl(subDisplay, sub.aliases||[])}{badgeWithPov((sub.aliases||[]).length, CC.sub, sp, 'sub', '항목', sub.name, sub.aliases||[], def.name, sub.name)}</td>}
                                  <td className="px-3 py-1.5 border border-[var(--border-default)] text-[11px] text-[var(--text-secondary)] align-middle">{hl(detDisplay, det.aliases||[])}{badgeWithPov((det.aliases||[]).length, CC.det, dp, 'det', '세목', det.name, det.aliases||[], def.name, sub.name, det.name)}</td>
                                  <td className="border border-[var(--border-default)] text-center align-middle">
                                    <input type="checkbox" checked={chk} onChange={() => { const n = new Set(pickerChecked); if (chk) n.delete(dk); else n.add(dk); setPickerChecked(n) }} className="w-3.5 h-3.5 accent-primary-500 cursor-pointer" />
                                  </td>
                                </tr>
                              )
                              if (di === 0) fd = false
                            })
                          }
                        })
                      }
                    })
                    return R
                  })()}
                </tbody>
              </table>
            </div>
            {/* 푸터 */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border-default)]">
              <span className="text-[11px] text-[var(--text-muted)]">{pickerChecked.size}개 선택됨</span>
              <div className="flex gap-2">
                <button onClick={() => { setBudgetPickerOpen(false); setPickerAliasPovId(null) }} className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer">취소</button>
                <button onClick={applyBudgetPicker} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-bold hover:bg-primary-600 transition-colors cursor-pointer">적용</button>
              </div>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  )
}
