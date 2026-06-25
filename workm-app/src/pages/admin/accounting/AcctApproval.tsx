import React, { useState, useMemo, useEffect, useRef } from 'react'
import { getItem, setItem } from '../../../utils/storage'
import { formatNumber } from '../../../utils/format'
import { useToastStore } from '../../../stores/toastStore'
import { saveAttachmentImage, deleteAttachmentImage } from '../../../utils/attachmentDB'
import { PrintApprovalForm } from '../../../components/accounting/PrintApprovalForm'
import type { BudgetCat, BudgetItem, Approval } from './types'
import { getLocalDate, getLocalISOString, uid } from './utils'
import { Wallet, FileCheck, Search, Plus, Edit3, Trash2, X, Check, Ban, MoreHorizontal, RefreshCw, Paperclip, Send, Eye, CheckCircle2, Archive, ClipboardList } from 'lucide-react'
import { cn } from '../../../utils/cn'
import { createPortal } from 'react-dom'
import { EmptyState } from '../../../components/common/EmptyState'
import { CustomSelect } from '../../../components/ui/CustomSelect'
import { useAuthStore } from '../../../stores/authStore'
import { useStaffStore } from '../../../stores/staffStore'
import { useSearchParams } from 'react-router-dom'

export default function AcctApproval({ year }: { year: number }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [refresh, setRefresh] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [detailApproval, setDetailApproval] = useState<Approval | null>(null)
  // URL의 openId 파라미터로 반려 품의 자동 열기
  useEffect(() => {
    const openId = searchParams.get('openId')
    if (openId) {
      const all: any[] = getItem('acct_approvals', [])
      const found = all.find((a: any) => String(a.id) === openId)
      if (found) setDetailApproval(found)
    }
  }, [searchParams])
  const [approvalBtnLabel, setApprovalBtnLabel] = useState(() => getItem('acct_approval_btn_label', '품의 등록'))
  const [editingBtnLabel, setEditingBtnLabel] = useState(false)
  const [editingDescText, setEditingDescText] = useState('')
  const [editingTitleText, setEditingTitleText] = useState('')
  const [modalApprovalType, setModalApprovalType] = useState<'expense' | 'general'>('expense')

  const currentUser = useAuthStore(s => s.user)
  const currentUserName = currentUser?.name || (() => { try { const u = JSON.parse(localStorage.getItem('ws_user') || '{}'); return u?.name } catch { return '' } })() || 'admin'
  const [form, setForm] = useState({ title: '', amount: '', date: getLocalDate(), accountCode: '', description: '', applicant: currentUserName, approver: '', budgetItem: '', budgetSubItem: '' })
  const staffList = useStaffStore(s => s.staff).filter(s => !s.resignedAt)

  const budgetCats = useMemo(() => getItem<BudgetCat[]>('acct_budget_cats', []).filter(c => { const pf = c.periodFrom || ''; const pt = c.periodTo || ''; if (pf && pt) return pf <= `${year}-12-31` && pt >= `${year}-01-01`; return (c.year || year) === year }), [year, refresh])
  const budgetItems = useMemo(() => getItem<BudgetItem[]>('acct_budgets', []), [refresh])
  const approveBudgetDefs = useMemo(() => getItem<BudgetItemDef[]>('acct_budget_item_defs', []).sort((a, b) => a.sortOrder - b.sortOrder), [refresh])

  const approvals = useMemo(() => {
    const all = getItem<Approval[]>('acct_approvals', [])
    return all.filter(a => {
      const dateStr = a.date || a.createdAt
      return dateStr && parseInt(String(dateStr).substring(0, 4)) === year
    }).sort((a, b) => (b.createdAt || b.date || '').localeCompare(a.createdAt || a.date || ''))
  }, [year, refresh])

  const statusInfo: Record<string, { label: string; color: string; bg: string }> = {
    preExpense: { label: '지출한', color: '#f97316', bg: 'rgba(249,115,22,.1)' },
    pending: { label: '품의한', color: '#3b82f6', bg: 'rgba(59,130,246,.1)' },
    rejected: { label: '반려된', color: '#ef4444', bg: 'rgba(239,68,68,.1)' },
    approved: { label: '승인된', color: '#22c55e', bg: 'rgba(34,197,94,.1)' },
    expensed: { label: '지출된', color: '#3b82f6', bg: 'rgba(59,130,246,.1)' },
    toResolve: { label: '결의할', color: '#06b6d4', bg: 'rgba(6,182,212,.1)' },
    confirming: { label: '정산중', color: '#8b5cf6', bg: 'rgba(139,92,246,.1)' },
    completed: { label: '완료됨', color: '#4f6ef7', bg: 'rgba(79,110,247,.1)' },
    vouchered: { label: '완료됨', color: '#4f6ef7', bg: 'rgba(79,110,247,.1)' },
  }

  type GroupKey = 'inbox' | 'process' | 'archive'
  const groupDefs: { key: GroupKey; label: string; icon: React.ElementType; color: string; subTabs: { key: string; label: string; color: string }[] }[] = [
    {
      key: 'inbox', label: '품의함', icon: FileCheck, color: '#4f6ef7',
      subTabs: [
        { key: 'preExpense', label: '품의할', color: '#f97316' },
        { key: 'pending', label: '품의한', color: '#f59e0b' },
        { key: 'rejected', label: '반려됨', color: '#ef4444' },
        { key: 'approved', label: '승인됨', color: '#22c55e' },
        { key: 'toResolve', label: '결의할', color: '#06b6d4' },
        { key: 'confirming', label: '정산중', color: '#8b5cf6' },
      ],
    },
    {
      key: 'process', label: '결제함', icon: CheckCircle2, color: '#22c55e',
      subTabs: [
        { key: 'ap_pending', label: '승인할', color: '#f59e0b' },
        { key: 'ap_approved', label: '승인한', color: '#22c55e' },
        { key: 'ap_rejected', label: '반려한', color: '#ef4444' },
        { key: 'ap_toResolve', label: '결의할', color: '#06b6d4' },
        { key: 'ap_confirming', label: '정산중', color: '#8b5cf6' },
        { key: 'ex_pending', label: '지출할', color: '#3b82f6' },
        { key: 'ex_done', label: '지출한', color: '#10b981' },
        { key: 'ex_settle', label: '정산할', color: '#06b6d4' },
        { key: 'ex_settled', label: '정산한', color: '#8b5cf6' },
      ],
    },
    {
      key: 'archive', label: '보관함', icon: Archive, color: '#6b7280',
      subTabs: [
        { key: 'generalDone', label: '일반품의완료', color: '#4f6ef7' },
        { key: 'expenseDone', label: '지출품의완료', color: '#f97316' },
      ],
    },
  ]

  const [activeGroup, setActiveGroup] = useState<GroupKey>(() => {
    const g = searchParams.get('group')
    if (g && ['inbox', 'process', 'archive'].includes(g)) return g as GroupKey
    return 'inbox'
  })
  const [subTab, setSubTab] = useState<string>(() => {
    return searchParams.get('subtab') || 'preExpense'
  })

  // ── 로그인 사용자 역할 판별 (현재 연도 예산구분 기준) ──
  const userIsApprover = useMemo(() => {
    const bCats: BudgetCat[] = getItem('acct_budget_cats', []).filter((c: any) => { const pf = c.periodFrom || ''; const pt = c.periodTo || ''; if (pf && pt) return pf <= `${year}-12-31` && pt >= `${year}-01-01`; return (c.year || year) === year })
    return bCats.some(c => (c as any).approvers?.includes(currentUserName)) || bCats.some(c => c.approver === currentUserName) || approvals.some(a => (a as any).approver === currentUserName)
  }, [currentUserName, approvals, refresh, year])

  const userIsExpenseManager = useMemo(() => {
    const bCats: BudgetCat[] = getItem('acct_budget_cats', []).filter((c: any) => { const pf = c.periodFrom || ''; const pt = c.periodTo || ''; if (pf && pt) return pf <= `${year}-12-31` && pt >= `${year}-01-01`; return (c.year || year) === year })
    return bCats.some(c => c.users?.includes(currentUserName))
  }, [currentUserName, refresh, year])

  // 결제함 서브탭을 역할에 따라 동적 필터링
  const currentGroup = useMemo(() => {
    const g = groupDefs.find(g => g.key === activeGroup)!
    if (activeGroup !== 'process') return g
    const ft = g.subTabs.filter(t => {
      if (t.key.startsWith('ap_')) return userIsApprover
      if (t.key.startsWith('ex_')) return userIsExpenseManager
      return true
    })
    return { ...g, subTabs: ft }
  }, [activeGroup, userIsApprover, userIsExpenseManager])

  const changeGroup = (gk: GroupKey) => {
    setActiveGroup(gk)
    const g = groupDefs.find(g => g.key === gk)!
    let tabs = g.subTabs
    if (gk === 'process') {
      const ft = tabs.filter(t => { if (t.key.startsWith('ap_')) return userIsApprover; if (t.key.startsWith('ex_')) return userIsExpenseManager; return true })
      if (ft.length > 0) tabs = ft
    }
    setSubTab(tabs[0].key)
  }

  const handleApproveConfirm = () => {
    if (!detailApproval) return
    const isGeneral = !!(detailApproval as any).isGeneral
    const isPreExp = (() => {
      if ((detailApproval as any).isPreExpense || (detailApproval as any).selfExpense) return true
      if (detailApproval.status === 'preExpense') return true
      if ((detailApproval.title || '').startsWith('[선지출]')) return true
      // cashflow 연결 여부
      const cfs: any[] = getItem('acct_cashflows', [])
      return cfs.some(cf => cf.approvalId && String(cf.approvalId) === String(detailApproval.id))
    })()
    if (isGeneral) {
      // 일반품의: 비밀번호/예산 검증 없이 바로 완료
      if (!approvePw.trim()) { setApprovePwError('비밀번호를 입력해주세요'); return }
      const myStaff = staffList.find(s => s.name === currentUserName)
      if (myStaff && (!myStaff.pw || myStaff.pw !== approvePw)) {
        setApprovePwError(myStaff.pw ? '비밀번호가 일치하지 않습니다' : '비밀번호가 설정되지 않았습니다. 직원관리에서 비밀번호를 설정해주세요'); return
      }
      const all = getItem<Approval[]>('acct_approvals', [])
      const updated = all.map(a => String(a.id) === String(detailApproval.id) ? {
        ...a,
        status: 'completed',
        approver: currentUserName,
        approvedAt: getLocalISOString(),
        completedAt: getLocalISOString(),
      } : a)
      setItem('acct_approvals', updated)
      resetApproveState()
      setDetailApproval(null)
      setRefresh(r => r + 1)
      return
    }
    // 선지출이 아닌 경우만 예산 선택 검증
    if (!isPreExp) {
      if (!approveBudgetCat || !approveBudgetItem) { setApprovePwError('예산을 검색하여 선택해주세요'); return }
    }
    if (!approvePw.trim()) { setApprovePwError('비밀번호를 입력해주세요'); return }
    const myStaff = staffList.find(s => s.name === currentUserName)
    if (myStaff && (!myStaff.pw || myStaff.pw !== approvePw)) {
      setApprovePwError(myStaff.pw ? '비밀번호가 일치하지 않습니다' : '비밀번호가 설정되지 않았습니다. 직원관리에서 비밀번호를 설정해주세요'); return
    }
    const all = getItem<Approval[]>('acct_approvals', [])
    const selectedBudgetItem = budgetItems.find(b => String(b.id) === String(approveBudgetItem))
    const subEntry = approveBudgetSub ? approveFilteredSubs.find(s => s.id === approveBudgetSub) : null
    const subName = subEntry?.name || ''
    const selectedBudgetSub = subName ? budgetItems.find(b =>
      String(b.catId) === String(selectedBudgetItem?.catId) &&
      b.itemName === selectedBudgetItem?.itemName &&
      b.subItemName === subName
    ) : null
    const selectedBudgetDetail = approveBudgetDetail ? budgetItems.find(b => String(b.id) === String(approveBudgetDetail)) : null
    const selectedCat = budgetCats.find(c => String(c.id) === String(approveBudgetCat))
    const approvedAmt = isPreExp ? (detailApproval.amount || 0) : (parseInt(approveAmount.replace(/[^0-9]/g, '')) || detailApproval.amount || 0)
    const updated = all.map(a => String(a.id) === String(detailApproval.id) ? {
      ...a,
      // 선지출: 이미 지출+증빙 완료이므로 바로 completed(보관함) / 일반: approved
      status: isPreExp ? 'completed' : 'approved',
      ...((isPreExp) ? { completedAt: getLocalISOString() } : {}),
      approver: currentUserName,
      ...(isPreExp ? {} : {
        budgetCatId: approveBudgetCat,
        budgetCatName: selectedCat?.name || '',
        budgetItemId: approveBudgetItem,
        budgetItem: selectedBudgetItem?.itemName || '',
        budgetSubId: selectedBudgetSub ? String(selectedBudgetSub.id) : undefined,
        budgetSubItem: subName || selectedBudgetItem?.subItemName || '',
        budgetDetailId: approveBudgetDetail || undefined,
        budgetDetailItem: selectedBudgetDetail?.detailItemName || '',
      }),
      amount: approvedAmt,
      approvedAmount: approvedAmt,
      approvedMemo: approveMemo || '',
      approvedAt: getLocalISOString(),
    } : a)
    setItem('acct_approvals', updated)
    resetApproveState()
    setDetailApproval(null)
    setRefresh(r => r + 1)
  }

  // ── 지출담당자 판별 헬퍼 ──
  const isExpenseUser = (a: Approval) => {
    const bCats: BudgetCat[] = getItem('acct_budget_cats', []).filter((c: any) => { const pf = c.periodFrom || ''; const pt = c.periodTo || ''; if (pf && pt) return pf <= `${year}-12-31` && pt >= `${year}-01-01`; return (c.year || year) === year })
    const uCatIds = new Set(bCats.filter(c => c.users?.includes(currentUserName)).map(c => String(c.id)))
    const uCatNames = new Set(bCats.filter(c => c.users?.includes(currentUserName)).map(c => c.name))
    return ((a as any).budgetCatId && uCatIds.has(String((a as any).budgetCatId))) ||
           ((a as any).budgetCatName && uCatNames.has((a as any).budgetCatName))
  }

  // ── 통합 필터 ──
  const matchFilter = (a: Approval, group: string, tab: string): boolean => {
    const isCompleted = ['completed', 'vouchered'].includes(a.status)
    const isGeneral = !!(a as any).isGeneral

    // ── 품의함: 내가 신청한 품의 (완료 전) ──
    if (group === 'inbox') {
      const isMyApplicant = (a as any).applicant === currentUserName
      const isPreExp = !!(a as any).isPreExpense || a.status === 'preExpense' || (a.title || '').startsWith('[선지출]')
      // 선지출: applicant 또는 해당 출금전표의 담당자도 볼 수 있음
      if (!isMyApplicant) {
        if (isPreExp && tab === 'preExpense') {
          // 선지출건: 해당 예산 담당자이거나 cashflow manager가 나인 경우
          const cfAll: CashFlow[] = getItem('acct_cashflows', [])
          const linkedCf = cfAll.find(cf => String((cf as any).approvalId) === String(a.id))
          const cfManager = linkedCf ? (linkedCf as any).manager || '' : ''
          if (cfManager !== currentUserName && !isExpenseUser(a)) return false
        } else if (tab === 'rejected' && a.status === 'rejected' && (a as any).approver === currentUserName) {
          return true
        } else {
          return false
        }
      }
      if (isCompleted) return false
      return a.status === tab
    }

    // ── 결제함: 승인권자/지출담당자 역할별 ──
    if (group === 'process') {
      if (isCompleted) return false
      // 승인권자 서브탭
      if (tab.startsWith('ap_')) {
        if ((a as any).approver !== currentUserName) return false
        const realStatus = tab.replace('ap_', '')
        if (realStatus === 'pending') return a.status === 'pending' || a.status === 'preExpense'
        return a.status === realStatus
      }
      // 지출담당자 서브탭
      if (tab.startsWith('ex_')) {
        if (!isExpenseUser(a) && (a as any).applicant !== currentUserName) return false
        if (tab === 'ex_pending') return a.status === 'approved'
        if (tab === 'ex_done') return a.status === 'expensed'
        if (tab === 'ex_settle') return a.status === 'confirming'
        if (tab === 'ex_settled') return a.status === 'toResolve' && !!(a as any)._settled
        return false
      }
    }

    // ── 보관함: 완료된 건 중 본인 관련만 ──
    if (group === 'archive') {
      if (!isCompleted) return false
      const isMine = userIsApprover || (a as any).applicant === currentUserName || (a as any).approver === currentUserName || isExpenseUser(a)
      if (!isMine) return false
      if (tab === 'generalDone') return isGeneral
      if (tab === 'expenseDone') return !isGeneral
      return true
    }
    return false
  }

  const getSubTabCount = (tabKey: string) => {
    return approvals.filter(a => matchFilter(a, activeGroup, tabKey)).length
  }

  const filteredApprovals = approvals.filter(a => matchFilter(a, activeGroup, subTab)).sort((a, b) => {
    const da = a.date || (a as any).createdAt || ''
    const db = b.date || (b as any).createdAt || ''
    if (da > db) return -1
    if (da < db) return 1
    return (Number(b.id) || 0) - (Number(a.id) || 0)
  })

  const groupCounts = groupDefs.map(g => {
    return approvals.filter(a => {
      return g.subTabs.some(t => matchFilter(a, g.key, t.key))
    }).length
  })

  const handleAmtInput = (val: string) => {
    const digits = val.replace(/[^\d]/g, '')
    setForm(f => ({ ...f, amount: digits ? Number(digits).toLocaleString('ko-KR') : '' }))
  }

  const saveApproval = () => {
    if (!form.title.trim()) return alert('품의명을 입력해주세요')
    const isGeneral = modalApprovalType === 'general'
    const amt = isGeneral ? 0 : (parseInt(form.amount.replace(/,/g, '')) || 0)
    if (!isGeneral && amt <= 0) return alert('금액을 입력해주세요')
    const approverList = staffList.filter(s => (s as any).approverType === 'approver')
    const autoApprover = form.approver || (isGeneral ? (staffList.length > 0 ? staffList[0].name : '') : (approverList.length > 0 ? approverList[0].name : (staffList.length > 0 ? staffList[0].name : '')))
    const all = getItem<Approval[]>('acct_approvals', [])
    if (editingId) {
      const updated = all.map(a => String(a.id) === String(editingId) ? {
        ...a,
        title: form.title.trim(),
        amount: amt,
        date: form.date,
        accountCode: form.accountCode,
        description: form.description,
        applicant: form.applicant,
        approver: autoApprover,
        budgetItem: form.budgetItem,
        budgetSubItem: form.budgetSubItem,
      } : a)
      setItem('acct_approvals', updated)
    } else {
      const selectedCat = budgetCats.find(c => String(c.id) === String((form as any).budgetCatId))
      all.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        title: form.title.trim(),
        amount: amt,
        date: form.date,
        status: 'pending',
        accountCode: form.accountCode,
        description: form.description,
        applicant: form.applicant,
        approver: autoApprover,
        isGeneral: isGeneral,
        budgetItem: form.budgetItem,
        budgetSubItem: form.budgetSubItem,
        budgetCatId: (form as any).budgetCatId || '',
        budgetCatName: selectedCat?.name || '',
        createdAt: getLocalISOString(),
      } as any)
      setItem('acct_approvals', all)
    }
    setModalOpen(false)
    setEditingId(null)
    setModalApprovalType('expense')
    setForm({ title: '', amount: '', date: getLocalDate(), accountCode: '', description: '', applicant: currentUserName, approver: '' })
    setRefresh(r => r + 1)
  }

  const updateStatus = (id: string | number, status: string) => {
    const all = getItem<Approval[]>('acct_approvals', [])
    const updated = all.map(a => String(a.id) === String(id) ? { ...a, status } : a)
    setItem('acct_approvals', updated)
    setRefresh(r => r + 1)
  }

  const deleteApproval = (id: string | number) => {
    const allApprovals = getItem<Approval[]>('acct_approvals', [])
    const target = allApprovals.find(a => String(a.id) === String(id))
    // 선지출 품의(preExpense 상태)는 삭제 불가
    if (target && target.status === 'preExpense') {
      alert('선지출된 품의는 삭제할 수 없습니다.')
      return
    }
    // 품의한(pending) 상태의 선지출건은 삭제 시 preExpense로 되돌림
    if (target && target.status === 'pending' && (target as any).isPreExpense) {
      if (!confirm('이 품의를 취소하고 선지출 상태로 되돌리시겠습니까?')) return
      const updated = allApprovals.map(a =>
        String(a.id) === String(id)
          ? { ...a, status: 'preExpense' as const }
          : a
      )
      setItem('acct_approvals', updated)
      setRefresh(r => r + 1)
      return
    }
    if (!confirm('이 품의를 삭제하시겠습니까?')) return
    const all = allApprovals.filter(a => String(a.id) !== String(id))
    setItem('acct_approvals', all)
    setRefresh(r => r + 1)
  }

  // ── 승인/반려 워크플로우 상태 ──
  const [approveMode, setApproveMode] = useState(false)
  const [rejectMode, setRejectMode] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [resubmitMode, setResubmitMode] = useState(false)
  const [resubmitForm, setResubmitForm] = useState({ title: '', amount: '', date: '', description: '' })
  const [resubmitEvidenceOpen, setResubmitEvidenceOpen] = useState(false)
  const [approvePw, setApprovePw] = useState('')
  const [approvePwError, setApprovePwError] = useState('')
  const [approveBudgetCat, setApproveBudgetCat] = useState('')
  const [approveBudgetItem, setApproveBudgetItem] = useState('')
  const [approveBudgetSub, setApproveBudgetSub] = useState('')
  const [approveBudgetDetail, setApproveBudgetDetail] = useState('')
  const [budgetSearchText, setBudgetSearchText] = useState('')
  const [budgetSearchFocused, setBudgetSearchFocused] = useState(false)
  const [budgetSearchSelected, setBudgetSearchSelected] = useState('')
  const [approveAmount, setApproveAmount] = useState('')
  const [approveMemo, setApproveMemo] = useState('')
  const [settleRejectMode, setSettleRejectMode] = useState(false)
  const [settleRejectReason, setSettleRejectReason] = useState('')
  const [settleCompleteMode, setSettleCompleteMode] = useState(false)
  const [settleCompletePw, setSettleCompletePw] = useState('')
  const [settleCompletePwError, setSettleCompletePwError] = useState('')

  // 승인할 탭에서의 상세 열기 여부
  const isApproverPendingView = activeGroup === 'process' && subTab === 'ap_pending'

  // 선택된 예산구분에 따른 예산항목 필터 (고유 itemName 기준)
  const approveFilteredItems = useMemo(() => {
    if (!approveBudgetCat) return [] as BudgetItem[]
    const items = budgetItems.filter(b => String(b.catId) === String(approveBudgetCat))
    // 고유 itemName 기준 그룹핑 (첫 번째 항목만 대표)
    const seen = new Set<string>()
    return items.filter(b => {
      if (seen.has(b.itemName)) return false
      seen.add(b.itemName)
      return true
    })
  }, [approveBudgetCat, budgetItems])

  // ── 통합 검색용 플랫 리스트 (최종단 예산 경로) ──
  const budgetFlatList = useMemo(() => {
    const acctList: { code: string; name: string }[] = getItem('acct_accounts', [])
    const result: { catId: string; catName: string; itemId: string; itemName: string; subId?: string; subName?: string; detailId?: string; detailName?: string; accountCode?: string; accountName?: string; aliases: string; path: string; amount: number; spent: number; remaining: number }[] = []
    budgetCats.forEach(cat => {
      // 승인권자의 해당 예산건만 필터링
      const catAny = cat as any
      const isMyBudget = (catAny.approvers && catAny.approvers.includes(currentUserName)) ||
        catAny.approver === currentUserName ||
        (catAny.users && catAny.users.includes(currentUserName))
      if (!isMyBudget) return
      const catItems = budgetItems.filter(b => String(b.catId) === String(cat.id))
      // 고유 itemName별 그룹
      const itemGroups = new Map<string, BudgetItem[]>()
      catItems.forEach(b => {
        const arr = itemGroups.get(b.itemName) || []
        arr.push(b)
        itemGroups.set(b.itemName, arr)
      })
      itemGroups.forEach((items, itemName) => {
        const firstItem = items[0]
        const def = approveBudgetDefs.find(d => d.name === itemName || d.aliases?.includes(itemName))
        // 세목/세세항이 있는 경우: 실제 편성된 항목만 표시
        const hasSubItems = items.some(b => b.subItemName)
        if (hasSubItems) {
          // subItemName별 그룹
          const subGroups = new Map<string, BudgetItem[]>()
          items.forEach(b => {
            if (!b.subItemName) return
            const arr = subGroups.get(b.subItemName) || []
            arr.push(b)
            subGroups.set(b.subItemName, arr)
          })
          subGroups.forEach((subBudgets, subName) => {
            const sub = def?.subItems?.find(s => s.name === subName)
            const subAcct = (sub?.accountCode || subBudgets[0]?.accountCode) ? acctList.find(a => a.code === (sub?.accountCode || subBudgets[0]?.accountCode)) : null
            // 세세항이 있는 경우
            const hasDetail = subBudgets.some(b => b.detailItemName)
            if (hasDetail) {
              subBudgets.filter(b => b.detailItemName).forEach(b => {
                const det = sub?.detailItems?.find(d => d.name === b.detailItemName)
                const detAcct = (det?.accountCode || b.accountCode) ? acctList.find(a => a.code === (det?.accountCode || b.accountCode)) : subAcct
                result.push({
                  catId: String(cat.id), catName: cat.name,
                  itemId: String(firstItem.id), itemName,
                  subId: sub ? `def_${sub.id}` : String(b.id), subName,
                  detailId: String(b.id), detailName: b.detailItemName!,
                  accountCode: det?.accountCode || b.accountCode || sub?.accountCode, accountName: detAcct?.name || '',
                  aliases: [...(def?.aliases || []), ...(sub?.aliases || []), ...(det?.aliases || [])].join(' '),
                  path: `${cat.name} > ${itemName}${subName !== itemName ? ` > ${subName}` : ''}${b.detailItemName !== subName ? ` > ${b.detailItemName}` : ''}`,
                  amount: b.amount || 0, spent: b.spent || 0, remaining: (b.amount || 0) - (b.spent || 0),
                })
              })
            } else {
              // 세목 단위
              const amt = subBudgets.reduce((s, b) => s + (b.amount || 0), 0)
              const sp = subBudgets.reduce((s, b) => s + (b.spent || 0), 0)
              result.push({
                catId: String(cat.id), catName: cat.name,
                itemId: String(firstItem.id), itemName,
                subId: sub ? `def_${sub.id}` : String(subBudgets[0].id), subName,
                accountCode: sub?.accountCode || subBudgets[0]?.accountCode, accountName: subAcct?.name || '',
                aliases: [...(def?.aliases || []), ...(sub?.aliases || [])].join(' '),
                path: subName === itemName ? `${cat.name} > ${itemName}` : `${cat.name} > ${itemName} > ${subName}`,
                amount: amt, spent: sp, remaining: amt - sp,
              })
            }
          })
        } else {
          // 세목 없이 항목 단위
          const amt = items.reduce((s, b) => s + (b.amount || 0), 0)
          const sp = items.reduce((s, b) => s + (b.spent || 0), 0)
          const defAcct = def?.defaultAccountCode ? acctList.find(a => a.code === def.defaultAccountCode) : null
          result.push({
            catId: String(cat.id), catName: cat.name,
            itemId: String(firstItem.id), itemName,
            accountCode: def?.defaultAccountCode, accountName: defAcct?.name || '',
            aliases: (def?.aliases || []).join(' '),
            path: `${cat.name} > ${itemName}`,
            amount: amt, spent: sp, remaining: amt - sp,
          })
        }
      })
    })
    // path 기준 중복 제거
    const seen = new Set<string>()
    return result.filter(r => {
      const key = `${r.catId}_${r.path}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [budgetCats, budgetItems, approveBudgetDefs, refresh, currentUserName])

  // 통합 검색 필터 결과
  const budgetSearchResults = useMemo(() => {
    const q = budgetSearchText.trim().toLowerCase()
    if (!q) return []
    return budgetFlatList.filter(r =>
      r.path.toLowerCase().includes(q) ||
      (r.accountCode && r.accountCode.includes(q)) ||
      (r.accountName && r.accountName.toLowerCase().includes(q)) ||
      (r.aliases && r.aliases.toLowerCase().includes(q))
    ).slice(0, 10)
  }, [budgetSearchText, budgetFlatList])

  // 선택된 예산항목의 세목 목록 (budgetItemDefs 기반 + 실제 데이터 병합)
  const approveFilteredSubs = useMemo(() => {
    if (!approveBudgetItem) return [] as { id: string; name: string; isFromDef?: boolean }[]
    const selectedItem = budgetItems.find(b => String(b.id) === String(approveBudgetItem))
    if (!selectedItem) return []
    // budgetItemDefs에서 해당 예산항목의 세목 정의 가져오기
    const def = approveBudgetDefs.find(d => d.name === selectedItem.itemName || d.aliases?.includes(selectedItem.itemName))
    if (def && def.subItems && def.subItems.length > 0) {
      // 정의 기반 세목 목록
      return def.subItems.sort((a, b) => a.sortOrder - b.sortOrder).map(sub => ({
        id: `def_${sub.id}`,
        name: sub.name,
        defId: sub.id,
        isFromDef: true,
      }))
    }
    // 정의가 없으면 실제 데이터에서 추출
    const allForItem = budgetItems.filter(b =>
      String(b.catId) === String(selectedItem.catId) &&
      b.itemName === selectedItem.itemName &&
      b.subItemName
    )
    const seen = new Set<string>()
    return allForItem.filter(b => {
      const key = b.subItemName!
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }).map(b => ({ id: String(b.id), name: b.subItemName! }))
  }, [approveBudgetItem, budgetItems, approveBudgetDefs])

  // 선택된 세목의 세세항 목록
  const approveFilteredDetails = useMemo(() => {
    if (!approveBudgetSub || !approveBudgetItem) return [] as BudgetItem[]
    const selectedItem = budgetItems.find(b => String(b.id) === String(approveBudgetItem))
    if (!selectedItem) return []
    // 선택된 세목의 이름 가져오기
    const subEntry = approveFilteredSubs.find(s => s.id === approveBudgetSub)
    const subName = subEntry?.name || ''
    if (!subName) return []
    return budgetItems.filter(b =>
      String(b.catId) === String(selectedItem.catId) &&
      b.itemName === selectedItem.itemName &&
      b.subItemName === subName &&
      b.detailItemName
    )
  }, [approveBudgetSub, approveBudgetItem, budgetItems, approveFilteredSubs])

  const approveRemainingBudget = useMemo(() => {
    // 세세항이 선택된 경우
    if (approveBudgetDetail) {
      const det = budgetItems.find(b => String(b.id) === String(approveBudgetDetail))
      if (det) return { amount: det.amount || 0, spent: det.spent || 0, remaining: (det.amount || 0) - (det.spent || 0) }
    }
    // 세목이 선택된 경우 해당 세목의 잔액 (이름으로 매칭)
    if (approveBudgetSub && approveBudgetItem) {
      const selectedItem = budgetItems.find(b => String(b.id) === String(approveBudgetItem))
      const subEntry = approveFilteredSubs.find(s => s.id === approveBudgetSub)
      const subName = subEntry?.name || ''
      if (selectedItem && subName) {
        const related = budgetItems.filter(b =>
          String(b.catId) === String(selectedItem.catId) &&
          b.itemName === selectedItem.itemName &&
          b.subItemName === subName
        )
        const totalAmt = related.reduce((s, b) => s + (b.amount || 0), 0)
        const totalSpent = related.reduce((s, b) => s + (b.spent || 0), 0)
        return { amount: totalAmt, spent: totalSpent, remaining: totalAmt - totalSpent }
      }
    }
    // 항목이 선택된 경우 해당 항목 하위 전체 합산
    if (approveBudgetItem) {
      const selectedItem = budgetItems.find(b => String(b.id) === String(approveBudgetItem))
      if (selectedItem) {
        const related = budgetItems.filter(b =>
          String(b.catId) === String(selectedItem.catId) &&
          b.itemName === selectedItem.itemName
        )
        const totalAmt = related.reduce((s, b) => s + (b.amount || 0), 0)
        const totalSpent = related.reduce((s, b) => s + (b.spent || 0), 0)
        return { amount: totalAmt, spent: totalSpent, remaining: totalAmt - totalSpent }
      }
    }
    return null
  }, [approveBudgetItem, approveBudgetSub, approveBudgetDetail, budgetItems, approveFilteredSubs])

  const resetApproveState = () => {
    setApproveMode(false)
    setRejectMode(false)
    setResubmitMode(false)
    setResubmitForm({ title: '', amount: '', date: '', description: '' })
    setApprovePw('')
    setApprovePwError('')
    setApproveBudgetCat('')
    setApproveBudgetItem('')
    setApproveBudgetSub('')
    setApproveBudgetDetail('')
    setBudgetSearchText('')
    setBudgetSearchSelected('')
    setBudgetSearchFocused(false)
    setApproveAmount('')
    setApproveMemo('')
    setSettleRejectMode(false)
    setSettleRejectReason('')
    setSettleCompleteMode(false)
    setSettleCompletePw('')
    setSettleCompletePwError('')
  }

  // 재품의 확인: 내용 수정 후 status를 pending으로 변경
  const handleResubmitConfirm = () => {
    if (!resubmitForm.title.trim()) { setApprovePwError('품의명을 입력해주세요'); return }
    const isGeneral = !!(detailApproval as any).isGeneral
    const amt = isGeneral ? 0 : (parseInt(resubmitForm.amount.replace(/,/g, '')) || 0)
    if (!isGeneral && amt <= 0) { setApprovePwError('금액을 입력해주세요'); return }
    if (!detailApproval) return
    const approverList = staffList.filter(s => (s as any).approverType === 'approver')
    const autoApprover = approverList.length > 0 ? approverList[0].name : (staffList.length > 0 ? staffList[0].name : '')
    const all = getItem<Approval[]>('acct_approvals', [])
    // 예산구분 매핑
    const newCatId = (resubmitForm as any).budgetCatId || (a => (a as any).budgetCatId)(detailApproval)
    const selectedCat = newCatId ? budgetCats.find(c => String(c.id) === String(newCatId)) : null
    const updated = all.map(a => String(a.id) === String(detailApproval.id) ? {
      ...a,
      title: resubmitForm.title.trim(),
      amount: amt,
      date: resubmitForm.date || getLocalDate(),
      description: resubmitForm.description,
      status: (detailApproval.status === 'rejected' || detailApproval.status === 'preExpense') ? 'pending' : detailApproval.status,
      isPreExpense: (a as any).isPreExpense || detailApproval.status === 'preExpense' || undefined,
      applicant: currentUserName,
      approver: autoApprover,
      budgetCatId: newCatId || (a as any).budgetCatId,
      budgetCatName: selectedCat ? selectedCat.name : (a as any).budgetCatName,
      budgetItemId: (a as any).budgetItemId,
      budgetSubId: (a as any).budgetSubId,
      budgetItem: (a as any).budgetItem,
      budgetSubItem: (a as any).budgetSubItem,
      attachments: (resubmitForm as any).attachments || (a as any).attachments || [],
      approvedAt: undefined,
      rejectedAt: undefined,
      resubmittedAt: getLocalISOString(),
    } : a)
    setItem('acct_approvals', updated)
    setRefresh(r => r + 1)
    resetApproveState()
    setDetailApproval(null)
  }

  const handleResubmitAmtInput = (val: string) => {
    const digits = val.replace(/[^\d]/g, '')
    setResubmitForm(f => ({ ...f, amount: digits ? Number(digits).toLocaleString('ko-KR') : '' }))
  }

  const handleRejectConfirm = () => {
    if (!approvePw.trim()) { setApprovePwError('비밀번호를 입력해주세요'); return }
    const myStaff = staffList.find(s => s.name === currentUserName)
    if (myStaff && (!myStaff.pw || myStaff.pw !== approvePw)) {
      setApprovePwError(myStaff.pw ? '비밀번호가 일치하지 않습니다' : '비밀번호가 설정되지 않았습니다. 직원관리에서 비밀번호를 설정해주세요'); return
    }
    if (!detailApproval) return
    // 반려 처리 + approver를 현재 사용자로 갱신
    const all = getItem<Approval[]>('acct_approvals', [])
    const updated = all.map(a => String(a.id) === String(detailApproval.id) ? {
      ...a,
      status: 'rejected',
      approver: currentUserName,
      rejectedAt: getLocalISOString(),
      rejectReason: rejectReason.trim() || undefined,
    } : a)
    setItem('acct_approvals', updated)
    setRefresh(r => r + 1)
    resetApproveState()
    setRejectReason('')
    setDetailApproval(null)
  }

  return (
    <div className="space-y-3">
      {/* ── 세그먼트 탭 바 ── */}
      <div className="bg-[var(--bg-muted)] rounded-xl p-1 inline-flex gap-1">
        {groupDefs.filter(g => g.key !== 'process' || userIsApprover || userIsExpenseManager).map((g) => {
          const isActive = activeGroup === g.key
          const cnt = groupCounts[groupDefs.indexOf(g)]
          return (
            <button key={g.key}
              onClick={() => changeGroup(g.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-bold transition-all cursor-pointer select-none',
                isActive
                  ? 'bg-[var(--bg-surface)] shadow-md text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]/50'
              )}
            >
              <g.icon size={14} />
              <span>{g.label}</span>
              {cnt > 0 && (
                <span className={cn(
                  'min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-black',
                  isActive ? 'text-white' : 'bg-[var(--bg-surface)] text-[var(--text-muted)]'
                )}
                  style={isActive ? { background: g.color } : {}}
                >{cnt}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── 인라인 필터 칩 + 액션 버튼 ── */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto flex-wrap">
          {currentGroup.subTabs.map((t) => {
            const cnt = getSubTabCount(t.key)
            const isActive = subTab === t.key
            return (
              <button key={t.key}
                onClick={() => setSubTab(t.key)}
                className={cn(
                  'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer border whitespace-nowrap',
                  isActive
                    ? 'text-white border-transparent shadow-sm'
                    : 'text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[var(--text-muted)]'
                )}
                style={isActive ? { background: t.color, borderColor: t.color } : {}}
              >
                {t.label}
                <span className={cn(
                  'min-w-[16px] h-[16px] flex items-center justify-center rounded-full text-[9px] font-black',
                  isActive ? 'bg-white/25' : 'bg-[var(--bg-muted)]'
                )}>{cnt}</span>
              </button>
            )
          })}
        </div>
        {activeGroup === 'inbox' && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-500 text-white text-[12px] font-bold hover:bg-primary-600 transition-all cursor-pointer shadow-sm shrink-0"
          >
            <Plus size={13} /> {approvalBtnLabel}
          </button>
        )}
      </div>

      {/* ── 목록 ── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">

        {filteredApprovals.length === 0 ? (
          <div className="p-6"><EmptyState emoji="📋" title="해당 상태의 품의가 없습니다" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-[var(--bg-muted)]">
                  {['날짜', '제목', '금액', '상태', '담당자', '관리'].map(h => (
                    <th key={h} className={cn('py-2.5 px-3.5 text-[11px] font-bold text-[var(--text-muted)]',
                      h === '금액' ? 'text-right' : h === '담당자' ? 'text-center w-[160px]' : h === '상태' ? 'text-center w-[70px]' : h === '관리' ? 'text-center w-[80px]' : 'text-left')}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredApprovals.map(a => {
                  const isTransferApproval = !!(a as any).transferType || (a.title || '').startsWith('[대체]')
                  const isPreExp = !!(a as any).isPreExpense || a.status === 'preExpense' || (a.title || '').startsWith('[선지출]')
                  const si = isTransferApproval && (isPreExp || a.status === 'preExpense')
                    ? { label: '대체한', color: '#8b5cf6', bg: 'rgba(139,92,246,.1)' }
                    : isPreExp
                      ? { label: '지출한', color: '#f97316', bg: 'rgba(249,115,22,.1)' }
                      : (a.status === 'pending' && (a as any).resubmittedAt)
                        ? { label: '품의한', color: '#3b82f6', bg: 'rgba(59,130,246,.1)' }
                        : (statusInfo[a.status] || statusInfo.pending)
                  return (
                    <tr key={a.id} className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-muted)] transition-colors">
                      <td className="py-2.5 px-3.5 text-[12px] text-[var(--text-secondary)]">{(a.date || a.createdAt || '').slice(0, 10)}</td>
                      <td className="py-2.5 px-3.5 text-[12px] font-bold text-[var(--text-primary)]">{a.title || '-'}</td>
                      <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-right text-[var(--text-primary)]">{formatNumber(a.amount || 0)}원</td>
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: si.bg, color: si.color }}>
                          {si.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1 text-[10px]">
                          {(a as any).applicant && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 font-bold">{isPreExp ? '지출' : '품의'}-{(a as any).applicant}</span>
                          )}
                          {(a as any).approver && (
                            <span className={cn('px-1.5 py-0.5 rounded font-bold',
                              a.status === 'approved' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' :
                              a.status === 'rejected' ? 'bg-red-50 dark:bg-red-900/20 text-red-500' :
                              'bg-amber-50 dark:bg-amber-900/20 text-amber-600'
                            )}>
                              {a.status === 'approved' ? '승인' : a.status === 'rejected' ? '반려' : '승인'}-{(a as any).approver}
                            </span>
                          )}
                          {a.status === 'rejected' && (a as any).rejectReason && (
                            <span className="px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-900/20 text-red-400 font-bold text-[9px] max-w-[120px] truncate" title={(a as any).rejectReason}>
                              💬 {(a as any).rejectReason}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <button
                          onClick={() => setDetailApproval(a)}
                          className="p-1.5 rounded-md hover:bg-[var(--bg-muted)] cursor-pointer transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 지출품의서 폼 (상세 팝업 대체) ── */}
      {detailApproval && !resubmitEvidenceOpen && (
        <PrintApprovalForm
          readOnly={['approved','expensed','confirming','completed'].includes(detailApproval.status)}
          data={(() => {
            // 연동된 cashflow 조회
            const allCfs: any[] = getItem('acct_cashflows', [])
            const linkedCf = allCfs.find(c => c.approvalId && String(c.approvalId) === String(detailApproval.id))
            const acctList: any[] = getItem('acct_accounts', [])
            const da = detailApproval as any
            const isPreExp = da.isPreExpense || detailApproval.status === 'preExpense'
            return {
            date: (detailApproval.date || detailApproval.createdAt || '').slice(0, 10),
            expenseDate: linkedCf?.tradeDate || linkedCf?.date || (isPreExp ? (detailApproval.date || detailApproval.createdAt || '').slice(0, 10) : ''),
            settleDate: linkedCf?.inputDate || linkedCf?.writeDate || linkedCf?.date || (isPreExp ? (detailApproval.date || detailApproval.createdAt || '').slice(0, 10) : ''),
            accountName: (() => {
              // linkedCf에서 계정과목 가져오기
              if (linkedCf?.accountCode) {
                const acct = acctList.find(a => a.code === linkedCf.accountCode)
                if (acct) return acct.name
              }
              if (da.budgetItemId) {
                const item = budgetItems.find(b => String(b.id) === String(da.budgetItemId))
                if (item?.accountCode) {
                  const acct = acctList.find(a => a.code === item.accountCode)
                  if (acct) return acct.name
                }
                return item?.itemName || da.budgetItem || ''
              }
              return da.budgetItem || ''
            })(),
            evidenceType: da.budgetCatName || '',
            vendor: linkedCf?.counter || da.vendor || da.counter || '',
            itemName: detailApproval.title || '',
            purpose: (() => {
              const d = detailApproval as any
              if (d.budgetSubId) {
                const item = budgetItems.find(b => String(b.id) === String(d.budgetSubId))
                return item?.subItemName || d.budgetSubItem || ''
              }
              if (d.budgetItemId) {
                const item = budgetItems.find(b => String(b.id) === String(d.budgetItemId))
                return item?.subItemName || d.budgetSubItem || ''
              }
              return d.budgetSubItem || ''
            })(),
            amount: detailApproval.amount || 0,
            memo: (detailApproval as any).description || '',
            applicant: (detailApproval as any).applicant || '',
            approver: detailApproval.approver || '',
            applicantSealImg: staffList.find(s => s.name === (detailApproval as any).applicant)?.sealImg || '',
            approverSealImg: staffList.find(s => s.name === detailApproval.approver)?.sealImg || '',
            applicantPosition: staffList.find(s => s.name === (detailApproval as any).applicant)?.position || '',
            approverPosition: staffList.find(s => s.name === detailApproval.approver)?.position || '',
            approvalStatus: detailApproval.status || '',
            approvedMemo: (detailApproval as any).approvedMemo || '',
            attachments: ((detailApproval as any).attachments || []).map((a: any) => ({
              ...a,
              type: a.type || (a.data?.startsWith?.('data:image') ? 'image/jpeg' : a.type),
              dataUrl: a.dataUrl || a.data,
            })),
            isGeneral: !!(detailApproval as any).isGeneral,
            approvalType: (detailApproval as any).isGeneral ? '일반품의' : ['preExpense','toResolve','confirming','completed'].includes(detailApproval.status) || !!(detailApproval as any).isPreExpense ? '선지출' : '지출품의',
            approvedDate: (detailApproval as any).approvedAt ? (detailApproval as any).approvedAt.slice(0, 10) : '',
            department: (() => {
              const staff = staffList.find(s => s.name === (detailApproval as any).applicant)
              return (staff as any)?.department || (staff as any)?.dept || ''
            })(),
          }})()}
          onClose={() => { resetApproveState(); setDetailApproval(null) }}
          onUpdateAttachments={(updated) => {
            // 삭제된 첨부의 IndexedDB 이미지 정리
            const oldAtts: any[] = (detailApproval as any).attachments || []
            const newKeys = new Set(updated.map((a: any) => a.imageKey).filter(Boolean))
            oldAtts.forEach((a: any) => { if (a.imageKey && !newKeys.has(a.imageKey)) deleteAttachmentImage(a.imageKey) })
            // localStorage에는 dataUrl 없이 메타데이터만 저장
            const metaOnly = updated.map((a: any) => { const { dataUrl, ...rest } = a; return rest })
            const approvals: any[] = getItem('acct_approvals', [])
            const idx = approvals.findIndex(a => a.id === detailApproval.id)
            if (idx >= 0) {
              approvals[idx].attachments = metaOnly
              setItem('acct_approvals', approvals)
              setDetailApproval({ ...detailApproval, attachments: updated } as any)
            }
          }}
          actions={
            <>
              {isApproverPendingView && (detailApproval.status === 'pending' || detailApproval.status === 'preExpense') && (
                <>
                  <button onClick={() => { setApproveMode(true); setRejectMode(false); setApprovePw(''); setApprovePwError(''); setApproveAmount(detailApproval.amount ? String(detailApproval.amount) : ''); setApproveMemo(''); setBudgetSearchText(''); setBudgetSearchSelected(''); setBudgetSearchFocused(false); const da=detailApproval as any; let catId=da.budgetCatId?String(da.budgetCatId):''; if(!catId&&da.budgetCatName){const cat=budgetCats.find(c=>c.name===da.budgetCatName);if(cat)catId=String(cat.id)} if(catId){setApproveBudgetCat(catId);const itemName=da.budgetItem||'';let itemId=da.budgetItemId?String(da.budgetItemId):'';if(!itemId&&itemName){const f=budgetItems.find(b=>String(b.catId)===catId&&b.itemName===itemName);if(f)itemId=String(f.id)} if(itemId){setApproveBudgetItem(itemId);let subId=da.budgetSubId?String(da.budgetSubId):'';if(!subId&&da.budgetSubItem){const f=budgetItems.find(b=>String(b.catId)===catId&&b.itemName===itemName&&b.subItemName===da.budgetSubItem);if(f)subId=String(f.id)} if(!subId){const subs=budgetItems.filter(b=>String(b.catId)===catId&&b.itemName===itemName&&b.subItemName);if(subs.length===1)subId=String(subs[0].id)} if(subId)setApproveBudgetSub(subId)}} }} className="px-4 py-2 rounded-lg bg-[#22c55e] text-white text-sm font-bold hover:bg-[#16a34a] cursor-pointer flex items-center gap-1 shadow-sm"><Check size={13} /> 승인</button>
                  <button onClick={() => { setRejectMode(true); setApproveMode(false); setApprovePw(''); setApprovePwError('') }} className="px-4 py-2 rounded-lg bg-[#ef4444] text-white text-sm font-bold hover:bg-[#dc2626] cursor-pointer flex items-center gap-1 shadow-sm"><Ban size={13} /> 반려</button>
                </>
              )}
              {!isApproverPendingView && detailApproval.status === 'pending' && (
                <>
                  <button onClick={() => { const a=detailApproval; const da=a as any; let catId=da.budgetCatId?String(da.budgetCatId):''; if(!catId&&da.budgetCatName){const cat=budgetCats.find(c=>c.name===da.budgetCatName);if(cat)catId=String(cat.id)} setResubmitMode(true); setResubmitForm({title:a.title||'',amount:a.amount?Number(a.amount).toLocaleString('ko-KR'):'',date:(a.date||a.createdAt||'').slice(0,10),description:da.description||'',budgetCatId:catId,attachments:da.attachments||[]} as any); setApprovePwError('') }} className="px-4 py-2 rounded-lg bg-[#4f6ef7] text-white text-sm font-bold hover:bg-[#3b5de7] cursor-pointer flex items-center gap-1 shadow-sm"><Edit3 size={13} /> 수정</button>
                  <button onClick={() => { deleteApproval(detailApproval.id); resetApproveState(); setDetailApproval(null) }} className="px-4 py-2 rounded-lg bg-[#ef4444] text-white text-sm font-bold hover:bg-[#dc2626] cursor-pointer flex items-center gap-1"><Trash2 size={13} /> 삭제</button>
                </>
              )}
              {!isApproverPendingView && detailApproval.status === 'approved' && (() => {
                const catId = (detailApproval as any).budgetCatId
                const cat = catId ? budgetCats.find(c => String(c.id) === String(catId)) : null
                const expenseManagers = cat?.users || []
                const managerNames = expenseManagers.length > 0
                  ? expenseManagers.map((name: string) => {
                      const staff = staffList.find(s => s.name === name)
                      return staff ? `${name} ${staff.position || ''}` : name
                    }).join(', ')
                  : '지출담당자'
                return (
                  <span className="px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                    {managerNames}님이 지출을 처리합니다.
                  </span>
                )
              })()}
              {!isApproverPendingView && detailApproval.status === 'preExpense' && (
                <button onClick={() => { const a=detailApproval; const da=a as any; let catId=da.budgetCatId?String(da.budgetCatId):''; if(!catId&&da.budgetCatName){const cat=budgetCats.find(c=>c.name===da.budgetCatName);if(cat)catId=String(cat.id)} setResubmitMode(true); setResubmitForm({title:a.title||'',amount:a.amount?Number(a.amount).toLocaleString('ko-KR'):'',date:(a.date||a.createdAt||'').slice(0,10),description:da.description||'',budgetCatId:catId,attachments:da.attachments||[]} as any); setApprovePwError('') }} className="px-4 py-2 rounded-lg bg-[#f97316] text-white text-sm font-bold hover:bg-[#ea580c] cursor-pointer flex items-center gap-1 shadow-sm"><Edit3 size={13} /> 품의</button>
              )}
              {!isApproverPendingView && detailApproval.status === 'rejected' && (
                <>
                  <button onClick={() => { const a=detailApproval; const da=a as any; let catId=da.budgetCatId?String(da.budgetCatId):''; if(!catId&&da.budgetCatName){const cat=budgetCats.find(c=>c.name===da.budgetCatName);if(cat)catId=String(cat.id)} setResubmitMode(true); setResubmitForm({title:a.title||'',amount:a.amount?Number(a.amount).toLocaleString('ko-KR'):'',date:(a.date||a.createdAt||'').slice(0,10),description:da.description||'',budgetCatId:catId,attachments:da.attachments||[]} as any); setApprovePwError('') }} className="px-4 py-2 rounded-lg bg-[#f59e0b] text-white text-sm font-bold hover:bg-[#d97706] cursor-pointer flex items-center gap-1 shadow-sm"><RefreshCw size={13} /> 재품의</button>
                  <button onClick={() => { deleteApproval(detailApproval.id); resetApproveState(); setDetailApproval(null) }} className="px-4 py-2 rounded-lg bg-[#ef4444] text-white text-sm font-bold hover:bg-[#dc2626] cursor-pointer flex items-center gap-1"><Trash2 size={13} /> 삭제</button>
                </>
              )}
              {!isApproverPendingView && detailApproval.status === 'confirming' && (() => {
                const catId = (detailApproval as any).budgetCatId
                const bCats: BudgetCat[] = getItem('acct_budget_cats', [])
                const cat = catId ? bCats.find(c => String(c.id) === String(catId)) : null
                const isExpenseManager = cat?.users?.includes(currentUserName) || false
                return isExpenseManager ? (
                  <>
                    <button onClick={() => { setSettleCompleteMode(true); setSettleCompletePw(''); setSettleCompletePwError('') }} className="px-4 py-2 rounded-lg bg-[#22c55e] text-white text-sm font-bold hover:bg-[#16a34a] cursor-pointer flex items-center gap-1 shadow-sm"><Check size={13} /> 정산완료</button>
                    <button onClick={() => { setSettleRejectMode(true); setSettleRejectReason('') }} className="px-4 py-2 rounded-lg bg-[#ef4444] text-white text-sm font-bold hover:bg-[#dc2626] cursor-pointer flex items-center gap-1 shadow-sm"><Ban size={13} /> 정산반려</button>
                  </>
                ) : (
                  <span className="px-3 py-2 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-[11px] text-violet-600 dark:text-violet-400 font-bold">
                    정산확인 대기 중 입니다.
                  </span>
                )
              })()}
              {/* 정산완료 비밀번호 모달 */}
              {settleCompleteMode && createPortal(
                <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/40" onClick={() => setSettleCompleteMode(false)}>
                  <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-[380px] p-5 space-y-3" onClick={e => e.stopPropagation()}>
                    <div className="text-sm font-extrabold text-[#22c55e] flex items-center gap-1.5"><Check size={16} /> 정산완료</div>
                    <p className="text-[11px] text-[var(--text-muted)]">본인 확인을 위해 비밀번호를 입력해주세요.</p>
                    <div>
                      <input
                        type="password"
                        value={settleCompletePw}
                        onChange={e => { setSettleCompletePw(e.target.value); setSettleCompletePwError('') }}
                        onKeyDown={e => { if (e.key === 'Enter') { (e.target as HTMLInputElement).closest('div')?.querySelector<HTMLButtonElement>('.settle-confirm-btn')?.click() } }}
                        placeholder="비밀번호"
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-sm text-[var(--text-primary)] focus:border-[#22c55e] outline-none"
                        autoFocus
                      />
                      {settleCompletePwError && <p className="text-[10px] text-[#ef4444] mt-1">{settleCompletePwError}</p>}
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button onClick={() => setSettleCompleteMode(false)} className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] cursor-pointer">취소</button>
                      <button className="settle-confirm-btn px-4 py-2 rounded-lg bg-[#22c55e] text-white text-sm font-bold hover:bg-[#16a34a] cursor-pointer flex items-center gap-1" onClick={() => {
                        const me = staffList.find(s => s.name === currentUserName)
                        if (!me?.pw || settleCompletePw !== me.pw) { setSettleCompletePwError('비밀번호가 일치하지 않습니다'); return }
                        const approvals:any[]=getItem('acct_approvals',[])
                        const idx=approvals.findIndex(a=>a.id===detailApproval.id)
                        if(idx>=0){
                          approvals[idx].status='completed'
                          approvals[idx].completedAt=getLocalISOString()
                          approvals[idx].completedBy=currentUserName
                          setItem('acct_approvals',approvals)
                          setRefresh(r=>r+1)
                        }
                        setSettleCompleteMode(false)
                        resetApproveState()
                        setDetailApproval(null)
                      }}><Check size={13} /> 정산완료 확인</button>
                    </div>
                  </div>
                </div>
              , document.body)}
              {/* 정산반려 사유 입력 모달 */}
              {settleRejectMode && createPortal(
                <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/40" onClick={() => setSettleRejectMode(false)}>
                  <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-[400px] p-5 space-y-3" onClick={e => e.stopPropagation()}>
                    <div className="text-sm font-extrabold text-[#ef4444] flex items-center gap-1.5"><Ban size={16} /> 정산반려</div>
                    <p className="text-[11px] text-[var(--text-muted)]">반려 사유를 입력하세요. 결의자가 확인할 수 있습니다.</p>
                    <textarea
                      value={settleRejectReason}
                      onChange={e => setSettleRejectReason(e.target.value)}
                      placeholder="반려 사유를 입력하세요"
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-sm text-[var(--text-primary)] focus:border-[#ef4444] outline-none resize-none h-[80px]"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2 pt-1">
                      <button onClick={() => setSettleRejectMode(false)} className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] cursor-pointer">취소</button>
                      <button onClick={() => {
                        if (!settleRejectReason.trim()) { alert('반려 사유를 입력해주세요'); return }
                        const approvals:any[]=getItem('acct_approvals',[])
                        const idx=approvals.findIndex(a=>a.id===detailApproval.id)
                        if(idx>=0){
                          approvals[idx].status='toResolve'
                          approvals[idx].returnedAt=getLocalISOString()
                          approvals[idx].returnReason=settleRejectReason.trim()
                          approvals[idx].returnedBy=currentUserName
                          setItem('acct_approvals',approvals)
                          setRefresh(r=>r+1)
                        }
                        setSettleRejectMode(false)
                        resetApproveState()
                        setDetailApproval(null)
                      }} className="px-4 py-2 rounded-lg bg-[#ef4444] text-white text-sm font-bold hover:bg-[#dc2626] cursor-pointer flex items-center gap-1"><Ban size={13} /> 반려 확인</button>
                    </div>
                  </div>
                </div>
              , document.body)}
              {!isApproverPendingView && detailApproval.status === 'toResolve' && (
                <>
                  {(detailApproval as any).returnReason && (
                    <div className="w-full px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800/30 text-[11px] space-y-0.5">
                      <div className="font-bold text-[#ef4444] flex items-center gap-1"><Ban size={12} /> 정산반려 사유</div>
                      <div className="text-[var(--text-primary)]">{(detailApproval as any).returnReason}</div>
                      <div className="text-[var(--text-muted)] text-[10px]">반려자: {(detailApproval as any).returnedBy || '-'} · {((detailApproval as any).returnedAt || '').slice(0,10)}</div>
                    </div>
                  )}
                  <label className="px-4 py-2 rounded-lg bg-[#4f6ef7] text-white text-sm font-bold hover:bg-[#3b5de7] cursor-pointer flex items-center gap-1">
                    <Paperclip size={13} /> 증빙첨부
                    <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.hwp" className="hidden" onChange={async e => {
                      const fileList = e.target.files; if(!fileList||fileList.length===0)return
                      const fileArr = Array.from(fileList); const fileCount = fileArr.length
                      e.target.value = ''
                      const existing:any[] = (detailApproval as any).attachments||[]
                      const newFiles:any[] = []
                      for(const f of fileArr){
                        const imageKey = `att_${detailApproval.id}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`
                        const entry:any = {name:f.name,size:f.size,type:f.type,addedAt:getLocalISOString(),title:f.name.replace(/\.[^/.]+$/,''),printWidth:150,imageKey}
                        if(f.type.startsWith('image/')){
                          try{
                            const dataUrl:string = await new Promise((resolve,reject)=>{
                              const reader=new FileReader()
                              reader.onload=()=>{
                                const img=new Image()
                                img.onload=()=>{
                                  const MAX=800; let w=img.width,h=img.height
                                  if(w>MAX||h>MAX){if(w>h){h=Math.round(h*MAX/w);w=MAX}else{w=Math.round(w*MAX/h);h=MAX}}
                                  const c=document.createElement('canvas');c.width=w;c.height=h
                                  const ctx=c.getContext('2d');ctx?.drawImage(img,0,0,w,h)
                                  resolve(c.toDataURL('image/jpeg',0.7))
                                }
                                img.onerror=reject; img.src=reader.result as string
                              }
                              reader.onerror=reject; reader.readAsDataURL(f)
                            })
                            await saveAttachmentImage(imageKey, dataUrl)
                            entry.dataUrl = dataUrl
                          }catch(err){console.error('이미지 저장 실패',err)}
                        }
                        newFiles.push(entry)
                      }
                      const updated=[...existing,...newFiles]
                      // localStorage에는 dataUrl 없이 메타데이터만 저장
                      const metaOnly = updated.map(a => {const {dataUrl, ...rest} = a; return rest})
                      const approvals:any[]=getItem('acct_approvals',[])
                      const idx=approvals.findIndex(a=>a.id===detailApproval.id)
                      if(idx>=0){
                        approvals[idx].attachments=metaOnly
                        setItem('acct_approvals',approvals)
                        setDetailApproval({...detailApproval,attachments:updated} as any)
                      }
                      alert(`${fileCount}개 파일이 첨부되었습니다.`)
                    }} />
                  </label>
                  {((detailApproval as any).attachments||[]).length>0 && (
                    <button onClick={() => { if(!confirm('승인요청을 진행하시겠습니까?\n정산중 목록으로 이동됩니다.'))return; const approvals:any[]=getItem('acct_approvals',[]); const idx=approvals.findIndex(a=>a.id===detailApproval.id); if(idx>=0){approvals[idx].status='confirming';approvals[idx].confirmedAt=getLocalISOString();setItem('acct_approvals',approvals);setRefresh(r=>r+1)} resetApproveState();setDetailApproval(null) }} className="px-4 py-2 rounded-lg bg-[#8b5cf6] text-white text-sm font-bold hover:bg-[#7c3aed] cursor-pointer flex items-center gap-1 shadow-sm"><Send size={13} /> 승인요청</button>
                  )}
                </>
              )}
            </>
          }
        />
      )}

      {/* ── 승인 확인 모달 ── */}
      {approveMode && detailApproval && (() => {
        const isPreExp = !!(detailApproval as any).isPreExpense || detailApproval.status === 'preExpense' || (detailApproval.title || '').startsWith('[선지출]')
        return createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/40" onClick={e => { if (e.target === e.currentTarget) { setApproveMode(false); setApprovePwError('') } }}>
          <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-default)]">
              <span className="text-sm font-extrabold text-[#22c55e] flex items-center gap-1.5">✅ {isPreExp ? '선지출 승인' : '품의 승인'}</span>
              <button onClick={() => { setApproveMode(false); setApprovePwError('') }} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* 품의 내용 확인 */}
              <div className="space-y-2">
                <div className="text-[11px] font-extrabold text-[var(--text-primary)] flex items-center gap-1">📋 품의 내용 확인</div>
                <div className="bg-[var(--bg-muted)] rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--text-muted)]">품의명</span>
                    <span className="font-bold text-[var(--text-primary)]">{detailApproval.title}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--text-muted)]">신청자</span>
                    <span className="font-bold text-[var(--text-primary)]">{(detailApproval as any).applicant || ''}</span>
                  </div>
                  {!!(detailApproval.amount) && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--text-muted)]">신청금액</span>
                    <span className="font-extrabold text-[var(--text-primary)] text-[14px]">₩ {(detailApproval.amount || 0).toLocaleString()}</span>
                  </div>
                  )}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--text-muted)]">일자</span>
                    <span className="font-bold text-[var(--text-primary)]">{(detailApproval.date || detailApproval.createdAt || '').slice(0, 10)}</span>
                  </div>
                  {detailApproval.description && (
                    <div className="text-[11px] pt-1 border-t border-[var(--border-default)]">
                      <span className="text-[var(--text-muted)]">사유: </span>
                      <span className="text-[var(--text-primary)]">{detailApproval.description}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 예산 선택 (지출품의 + 비선지출만) */}
              {!isPreExp && !(detailApproval as any).isGeneral && (
              <div className="space-y-2">
                <label className="block text-[11px] font-extrabold text-[var(--text-primary)]">📂 예산 선택 *</label>
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    value={budgetSearchText}
                    onChange={e => { setBudgetSearchText(e.target.value); setBudgetSearchFocused(true) }}
                    onFocus={() => setBudgetSearchFocused(true)}
                    placeholder="예산항목, 세목, 계정코드 검색..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500"
                  />
                  {budgetSearchFocused && budgetSearchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg shadow-xl max-h-[200px] overflow-y-auto">
                      {budgetSearchResults.map((r, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setApproveBudgetCat(r.catId)
                            setApproveBudgetItem(r.itemId)
                            setApproveBudgetSub(r.subId || '')
                            setApproveBudgetDetail(r.detailId || '')
                            setBudgetSearchText(r.path)
                            setBudgetSearchSelected(r.path)
                            setBudgetSearchFocused(false)
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-[var(--bg-muted)] transition-colors cursor-pointer border-b border-[var(--border-default)] last:border-0"
                        >
                          <div className="text-[11px] font-bold text-[var(--text-primary)]">{r.path}</div>
                          <div className="text-[10px] font-bold text-[#ef4444]">
                            예산 ₩{r.amount.toLocaleString()} | 잔액 ₩{r.remaining.toLocaleString()} | 사용율 {r.amount > 0 ? Math.round((r.spent / r.amount) * 100) : 0}%
                            {r.accountCode && <span className="text-[var(--text-muted)] font-normal"> | {r.accountCode} {r.accountName || ''}</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {budgetSearchSelected && (
                  <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 px-2.5 py-1.5 rounded-lg">✅ {budgetSearchSelected}</div>
                )}
              </div>
              )}

              {/* 승인 금액 (수정 가능) */}
              {!isPreExp && !(detailApproval as any).isGeneral && (
              <div>
                <label className="block text-[11px] font-extrabold text-[var(--text-primary)] mb-1">💰 승인 금액</label>
                <input
                  value={approveAmount ? Number(approveAmount.replace(/[^0-9]/g, '')).toLocaleString() : ''}
                  onChange={e => { const raw = e.target.value.replace(/[^0-9]/g, ''); setApproveAmount(raw) }}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-primary-500 text-right"
                  placeholder={(detailApproval.amount || 0).toLocaleString()}
                />
                {approveAmount && parseInt(approveAmount.replace(/[^0-9]/g, '')) !== (detailApproval.amount || 0) && (
                  <p className="text-[10px] text-amber-500 font-bold mt-0.5">⚠️ 신청금액과 다릅니다 (신청: ₩{(detailApproval.amount || 0).toLocaleString()})</p>
                )}
              </div>
              )}

              {/* 승인 메시지 */}
              <div>
                <label className="block text-[11px] font-extrabold text-[var(--text-primary)] mb-1">💬 승인 메시지</label>
                <textarea
                  value={approveMemo}
                  onChange={e => setApproveMemo(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-400 resize-none"
                  placeholder="승인 메시지 (선택)"
                />
              </div>

              {/* 비밀번호 */}
              <div>
                <label className="block text-[11px] font-extrabold text-[var(--text-primary)] mb-1">🔒 비밀번호 확인</label>
                <input
                  type="password"
                  value={approvePw}
                  onChange={e => { setApprovePw(e.target.value); setApprovePwError('') }}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500"
                  placeholder="비밀번호를 입력하세요"
                  onKeyDown={e => { if (e.key === 'Enter') handleApproveConfirm() }}
                />
                {approvePwError && <p className="text-[11px] text-[#ef4444] mt-1 font-bold">{approvePwError}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-[var(--border-default)]">
              <button onClick={() => { setApproveMode(false); setApprovePwError('') }} className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] cursor-pointer">취소</button>
              <button onClick={handleApproveConfirm} className="px-4 py-2 rounded-lg bg-[#22c55e] text-white text-sm font-bold hover:bg-[#16a34a] cursor-pointer flex items-center gap-1"><Check size={14} /> 승인</button>
            </div>
          </div>
        </div>
      , document.body)
      })()}

      {/* ── 반려 확인 모달 ── */}
      {rejectMode && detailApproval && createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/40" onClick={e => { if (e.target === e.currentTarget) { setRejectMode(false); setApprovePwError('') } }}>
          <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-sm mx-4 animate-fadeIn">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-default)]">
              <span className="text-sm font-extrabold text-[#ef4444] flex items-center gap-1.5">🚫 품의 반려</span>
              <button onClick={() => { setRejectMode(false); setApprovePwError('') }} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="text-[12px] text-[var(--text-secondary)]">
                <strong>{detailApproval.title}</strong> (₩{(detailApproval.amount || 0).toLocaleString()}) 을 반려합니다.
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-[var(--text-primary)] mb-1">📝 반려 사유</label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-red-400 resize-none"
                  placeholder="반려 사유를 입력해주세요 (선택)"
                />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-[var(--text-primary)] mb-1">🔒 비밀번호 확인</label>
                <input
                  type="password"
                  value={approvePw}
                  onChange={e => { setApprovePw(e.target.value); setApprovePwError('') }}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500"
                  placeholder="비밀번호를 입력하세요"
                  onKeyDown={e => { if (e.key === 'Enter') handleRejectConfirm() }}
                />
                {approvePwError && <p className="text-[11px] text-[#ef4444] mt-1 font-bold">{approvePwError}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-[var(--border-default)]">
              <button onClick={() => { setRejectMode(false); setApprovePwError('') }} className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] cursor-pointer">취소</button>
              <button onClick={handleRejectConfirm} className="px-4 py-2 rounded-lg bg-[#ef4444] text-white text-sm font-bold hover:bg-[#dc2626] cursor-pointer flex items-center gap-1"><Ban size={14} /> 반려 확인</button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* ── 수정 폼 모달 (PrintApprovalForm 위에 표시) ── */}
      {resubmitMode && detailApproval && !resubmitEvidenceOpen && createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/40" onClick={e => { if (e.target === e.currentTarget) { setResubmitMode(false); setApprovePwError('') } }}>
          <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-fadeIn max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-default)]">
              <span className="text-sm font-extrabold text-[var(--text-primary)]">
                {detailApproval.status === 'preExpense' ? '선지출 품의 수정' : detailApproval.status === 'rejected' ? '반려 품의 수정 (재품의)' : '품의 수정'}
              </span>
              <button onClick={() => { setResubmitMode(false); setApprovePwError('') }} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3 flex-1 overflow-y-auto">
              {!(detailApproval as any).isGeneral && ((detailApproval as any).isPreExpense || detailApproval.status === 'preExpense') ? (() => {
                const catName = (detailApproval as any).budgetCatName || budgetCats.find(c => String(c.id) === String((detailApproval as any).budgetCatId))?.name || '미지정'
                const itemName = (detailApproval as any).budgetItem || ''
                const subName = (detailApproval as any).budgetSubItem || ''
                const detailName = (detailApproval as any).budgetDetailItem || ''
                const budgetPath = [catName, itemName, subName, detailName].filter(Boolean).join(' > ')
                return (
                  <>
                    {/* ── 수정 가능 영역 ── */}
                    <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200/50 dark:border-blue-800/30 space-y-3">
                      <div className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">✏️ 수정 가능</div>
                      <div>
                        <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-1">품의명 (제목)</label>
                        <input value={resubmitForm.title} onChange={e => setResubmitForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500" placeholder="품의명을 입력해주세요" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-1">사유 / 비고</label>
                        <textarea value={resubmitForm.description} onChange={e => setResubmitForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500 resize-none" placeholder="사유를 입력해주세요" />
                      </div>
                    </div>

                    {/* ── 수정 불가 영역 ── */}
                    <div className="p-3 rounded-xl bg-[var(--bg-muted)] border border-[var(--border-default)] space-y-2.5">
                      <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">🔒 지출 정보 (수정 불가)</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-[10px] text-[var(--text-muted)] font-bold mb-0.5">금액</div>
                          <div className="text-sm font-extrabold text-[var(--text-primary)] text-right">{typeof detailApproval.amount === 'number' ? detailApproval.amount.toLocaleString('ko-KR') : resubmitForm.amount}원</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[var(--text-muted)] font-bold mb-0.5">지출일자</div>
                          <div className="text-sm text-[var(--text-primary)]">📅 {resubmitForm.date}</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[var(--text-muted)] font-bold mb-0.5">예산항목</div>
                        <div className="text-[12px] text-[var(--text-primary)] font-bold">📋 {budgetPath}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-[10px] text-[var(--text-muted)] font-bold mb-0.5">거래처</div>
                          <div className="text-[12px] text-[var(--text-primary)] font-bold">🏢 {(detailApproval as any).counter || '-'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[var(--text-muted)] font-bold mb-0.5">지출수단</div>
                          <div className="text-[12px] text-[var(--text-primary)] font-bold">💳 {(detailApproval as any).method || '-'}</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[var(--text-muted)] font-bold mb-0.5">승인권자</div>
                        <div className="text-[12px] text-[var(--text-primary)] font-bold">👤 {(() => {
                          const cat = budgetCats.find(c => String(c.id) === String((detailApproval as any).budgetCatId))
                          if (cat && (cat as any).approvers && (cat as any).approvers.length > 0) return (cat as any).approvers.join(', ')
                          return (detailApproval as any).approver || '미지정'
                        })()}</div>
                      </div>
                    </div>

                    {/* ── 증빙첨부 ── */}
                    <div className="pt-1">
                      <div className="flex items-center gap-2">
                        <label className="text-[10.5px] font-bold text-[var(--text-muted)] flex items-center gap-1"><Paperclip size={11} /> 증빙서류</label>
                        {((resubmitForm as any).attachments || []).length > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 font-bold">{((resubmitForm as any).attachments || []).length}건</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <button type="button" onClick={() => setResubmitEvidenceOpen(true)} className="px-4 py-2 rounded-lg bg-[#4f6ef7] text-white text-sm font-bold hover:bg-[#3b5de7] cursor-pointer flex items-center gap-1">
                          <Paperclip size={13} /> 증빙첨부
                        </button>
                        {((resubmitForm as any).attachments || []).length > 0 && (
                          <button type="button" onClick={() => setResubmitEvidenceOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-default)] text-[11px] font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] cursor-pointer transition-colors">
                            <Eye size={12} /> 미리보기
                          </button>
                        )}
                      </div>
                      {((resubmitForm as any).attachments || []).length > 0 && (
                        <div className="mt-2 space-y-1">
                          {((resubmitForm as any).attachments || []).map((att: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[var(--bg-muted)] border border-[var(--border-default)]">
                              <span className="text-[11px] text-[var(--text-primary)] font-bold truncate flex-1">📄 {att.name || `파일 ${i + 1}`}</span>
                              <button type="button" onClick={() => {
                                const updated = [...((resubmitForm as any).attachments || [])]; updated.splice(i, 1)
                                setResubmitForm(f => ({ ...f, attachments: updated } as any))
                              }} className="text-[#ef4444] text-[12px] hover:text-[#dc2626] cursor-pointer shrink-0">✕</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {detailApproval.status === 'preExpense' && (
                      <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                        <div className="text-[11px] text-amber-700 dark:text-amber-400 font-bold">⚠️ 선지출 → 후품의 전환</div>
                        <div className="text-[10px] text-amber-600 dark:text-amber-500 mt-1">수정 후 '품의할' 상태로 전환되어 승인자에게 승인 요청이 됩니다.</div>
                      </div>
                    )}
                  </>
                )
              })() : (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-1">품의명</label>
                    <input value={resubmitForm.title} onChange={e => setResubmitForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500" placeholder="품의명을 입력해주세요" />
                  </div>
                  {!(detailApproval as any).isGeneral && (
                    <>
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-1">예산구분</label>
                      <select value={(resubmitForm as any).budgetCatId || ''} onChange={e => setResubmitForm(f => ({ ...f, budgetCatId: e.target.value } as any))} className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500">
                        <option value="">— 예산구분 선택 —</option>
                        {budgetCats.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-1">금액</label>
                      <input value={resubmitForm.amount} onChange={e => {
                        const d = e.target.value.replace(/[^\d]/g, '')
                        setResubmitForm(f => ({ ...f, amount: d ? Number(d).toLocaleString('ko-KR') : '' }))
                      }} className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] text-sm text-[var(--text-primary)] text-right font-bold focus:outline-none focus:border-primary-500" placeholder="0" />
                    </div>
                    </>
                  )}
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-1">날짜</label>
                    <input type="date" value={resubmitForm.date} onChange={e => setResubmitForm(f => ({ ...f, date: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-1">비고 / 설명</label>
                    <textarea value={resubmitForm.description} onChange={e => setResubmitForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500 resize-none" placeholder="비고를 입력해주세요" />
                  </div>
                  {detailApproval.status === 'preExpense' && (
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                      <div className="text-[11px] text-amber-700 dark:text-amber-400 font-bold">⚠️ 선지출 → 후품의 전환</div>
                      <div className="text-[10px] text-amber-600 dark:text-amber-500 mt-1">수정 후 '품의할' 상태로 전환되어 승인자에게 승인 요청이 됩니다.</div>
                    </div>
                  )}
                </>
              )}
              {approvePwError && (
                <div className="text-[12px] text-red-500 font-bold text-center">{approvePwError}</div>
              )}
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-[var(--border-default)]">
              <button onClick={() => { setResubmitMode(false); setApprovePwError('') }} className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer">취소</button>
              <button onClick={handleResubmitConfirm} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-bold hover:bg-primary-600 transition-colors cursor-pointer">{detailApproval.status === 'rejected' ? '재품의 제출' : '품의하기'}</button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* ── 선지출 품의 수정: 증빙서류 문서 뷰 ── */}
      {resubmitEvidenceOpen && detailApproval && (() => {
        const da = detailApproval as any
        const catName = da.budgetCatName || budgetCats.find((c: any) => String(c.id) === String(da.budgetCatId))?.name || ''
        const amt = typeof detailApproval.amount === 'number' ? detailApproval.amount : (parseInt(String(detailApproval.amount || '0').replace(/,/g, '')) || 0)
        const applicantStaff = staffList.find(s => s.name === da.applicant)
        const approverName = (() => {
          const cat = budgetCats.find((c: any) => String(c.id) === String(da.budgetCatId))
          if (cat && (cat as any).approvers && (cat as any).approvers.length > 0) return (cat as any).approvers[0]
          return da.approver || ''
        })()
        const approverStaff = staffList.find(s => s.name === approverName)
        const currentAttachments = ((resubmitForm as any).attachments || []).map((a: any) => ({
          name: a.name,
          type: a.type || (a.data?.startsWith('data:image') ? 'image/jpeg' : 'application/octet-stream'),
          dataUrl: a.dataUrl || a.data,
          title: a.title || a.name,
          printWidth: a.printWidth || 150,
          row: a.row,
          imageKey: a.imageKey,
        }))
        return (
          <PrintApprovalForm
            readOnly={false}
            data={{
              date: da.date || da.createdAt?.slice(0, 10) || '',
              expenseDate: da.date || da.createdAt?.slice(0, 10) || '',
              accountName: da.budgetItem || '',
              evidenceType: catName,
              vendor: da.counter || '',
              itemName: resubmitForm.title || detailApproval.title || '',
              purpose: da.budgetSubItem || '',
              amount: amt,
              memo: resubmitForm.description || da.description || '',
              applicant: da.applicant || '',
              approver: approverName,
              applicantSealImg: applicantStaff?.sealImg || '',
              approverSealImg: '',
              applicantPosition: applicantStaff?.position || '',
              approverPosition: approverStaff?.position || '',
              approvalStatus: 'preExpense',
              attachments: currentAttachments,
              approvalType: '선지출',
              department: (applicantStaff as any)?.department || (applicantStaff as any)?.dept || '',
            }}
            onClose={() => setResubmitEvidenceOpen(false)}
            onUpdateAttachments={(updated) => {
              const mapped = updated.map((a: any) => ({
                name: a.name,
                data: a.dataUrl || '',
                dataUrl: a.dataUrl || '',
                size: 0,
                title: a.title,
                printWidth: a.printWidth,
                row: a.row,
                imageKey: a.imageKey,
                type: a.type,
              }))
              setResubmitForm(f => ({ ...f, attachments: mapped } as any))
            }}
            actions={
              <>
                <label className="px-4 py-2 rounded-lg bg-[#4f6ef7] text-white text-sm font-bold hover:bg-[#3b5de7] cursor-pointer flex items-center gap-1">
                  <Paperclip size={13} /> 증빙첨부
                  <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.hwp" className="hidden" onChange={async e => {
                    const fileList = e.target.files; if(!fileList||fileList.length===0)return
                    const fileArr = Array.from(fileList); e.target.value = ''
                    const existing:any[] = (resubmitForm as any).attachments||[]
                    const newFiles:any[] = []
                    for(const f of fileArr){
                      const imageKey = `att_resubmit_${Date.now()}_${Math.random().toString(36).slice(2,8)}`
                      const entry:any = {name:f.name,size:f.size,type:f.type,addedAt:getLocalISOString(),title:f.name.replace(/\.[^/.]+$/,''),printWidth:150,imageKey}
                      if(f.type.startsWith('image/')){
                        try{
                          const dataUrl:string = await new Promise((resolve,reject)=>{
                            const reader=new FileReader()
                            reader.onload=()=>{
                              const img=new Image()
                              img.onload=()=>{
                                const MAX=800; let w=img.width,h=img.height
                                if(w>MAX||h>MAX){if(w>h){h=Math.round(h*MAX/w);w=MAX}else{w=Math.round(w*MAX/h);h=MAX}}
                                const c=document.createElement('canvas');c.width=w;c.height=h
                                const ctx=c.getContext('2d');ctx?.drawImage(img,0,0,w,h)
                                resolve(c.toDataURL('image/jpeg',0.7))
                              }
                              img.onerror=reject; img.src=reader.result as string
                            }
                            reader.onerror=reject; reader.readAsDataURL(f)
                          })
                          entry.dataUrl = dataUrl; entry.data = dataUrl
                        }catch(err){console.error('이미지 저장 실패',err)}
                      }
                      newFiles.push(entry)
                    }
                    const updated=[...existing,...newFiles]
                    setResubmitForm(f => ({ ...f, attachments: updated } as any))
                    // PrintApprovalForm의 onUpdateAttachments도 호출하기 위해 증빙서류 뷰를 리로드
                    setResubmitEvidenceOpen(false)
                    setTimeout(() => setResubmitEvidenceOpen(true), 50)
                  }} />
                </label>
                {((resubmitForm as any).attachments||[]).length > 0 && (
                  <button onClick={() => {
                    if (!confirm('승인요청을 진행하시겠습니까?\n품의 내용과 증빙이 저장되고 승인자에게 승인 요청됩니다.')) return
                    setResubmitEvidenceOpen(false)
                    // handleResubmitConfirm과 동일한 로직 수행
                    handleResubmitConfirm()
                  }} className="px-4 py-2 rounded-lg bg-[#8b5cf6] text-white text-sm font-bold hover:bg-[#7c3aed] cursor-pointer flex items-center gap-1 shadow-sm"><Send size={13} /> 승인요청</button>
                )}
              </>
            }
          />
        )
      })()}
      {/* 품의 등록 모달 */}
      {modalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={e => { if (e.target === e.currentTarget) { setModalOpen(false); setEditingId(null); setModalApprovalType('expense'); setForm({ title: '', amount: '', date: getLocalDate(), accountCode: '', description: '', applicant: currentUserName, approver: '' }) } }}>
          <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-md mx-4" style={{ height: '560px', display: 'flex', flexDirection: 'column' }}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-default)]">
              <span className="text-sm font-extrabold text-[var(--text-primary)]">{editingId ? '품의 수정' : (modalApprovalType === 'general' ? '일반품의 등록' : '지출품의 등록')}</span>
              <button onClick={() => { setModalOpen(false); setEditingId(null); setModalApprovalType('expense'); setForm({ title: '', amount: '', date: getLocalDate(), accountCode: '', description: '', applicant: currentUserName, approver: '' }) }} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4 flex-1 overflow-y-auto">
              {!editingId && (
                <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-[var(--bg-muted)] border border-[var(--border-default)]">
                  <button onClick={() => { setModalApprovalType('expense'); setForm(f => ({ ...f, approver: '' })) }} className={`flex-1 py-1.5 rounded-lg text-[12px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1 ${modalApprovalType === 'expense' ? 'bg-[#4f6ef7] text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}><Wallet size={12} /> 지출품의</button>
                  <button onClick={() => { setModalApprovalType('general'); setForm(f => ({ ...f, approver: '' })) }} className={`flex-1 py-1.5 rounded-lg text-[12px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1 ${modalApprovalType === 'general' ? 'bg-[#8b5cf6] text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}><ClipboardList size={12} /> 일반품의</button>
                </div>
              )}
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">품의명 *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="예) 사무용품 구매" className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none" />
              </div>
              {modalApprovalType !== 'general' && (
              <>
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">예산구분</label>
                <select value={(form as any).budgetCatId || ''} onChange={e => {
                  const catId = e.target.value
                  const cat = budgetCats.find(c => String(c.id) === catId) as any
                  // 예산구분의 승인권자 자동 설정 (추가 승인권자 우선)
                  let autoApprover = ''
                  if (cat) {
                    if (cat.approver) {
                      // 추가 승인권자가 있으면 추가 승인권자 사용
                      autoApprover = cat.approver
                    } else if (cat.approvers && cat.approvers.length > 0) {
                      autoApprover = cat.approvers[0]
                    } else {
                      const approverStaff = staffList.find(s => (s as any).approverType === 'approver')
                      if (approverStaff) autoApprover = approverStaff.name
                    }
                  }
                  setForm(f => ({ ...f, budgetCatId: catId, approver: autoApprover } as any))
                }} className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none">
                  <option value="">— 예산구분 선택 —</option>
                  {budgetCats.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">금액 (원) *</label>
                <input value={form.amount} onChange={e => handleAmtInput(e.target.value)} placeholder="0" className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none text-right font-bold" />
              </div>
              </>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">신청자</label>
                  <input value={form.applicant} onChange={e => setForm(f => ({ ...f, applicant: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-sm text-[var(--text-primary)] outline-none" readOnly />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">{modalApprovalType === 'general' ? '승인권자' : '지출승인권한자'}</label>
                  {modalApprovalType === 'general' ? (
                    <CustomSelect
                      value={form.approver}
                      onChange={v => setForm(f => ({ ...f, approver: v }))}
                      placeholder="— 승인권자 선택 —"
                      options={[
                        { value: '', label: '— 선택 —' },
                        ...staffList.map(s => ({ value: s.name, label: `${s.name}${s.position ? ' (' + s.position + ')' : ''}` })),
                      ]}
                    />
                  ) : (() => {
                    const selCatId = (form as any).budgetCatId || ''
                    const selCat = selCatId ? budgetCats.find(c => String(c.id) === selCatId) as any : null
                    // 추가 승인권자가 있으면 추가 승인권자만 표시
                    const additionalApprover = selCat?.approver || ''
                    if (additionalApprover) {
                      return (
                        <div className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-sm font-bold text-[var(--text-primary)]">
                          {additionalApprover}
                        </div>
                      )
                    }
                    return (
                      <div className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-sm font-bold text-[var(--text-primary)]">
                        {form.approver || <span className="text-[var(--text-muted)] font-normal">예산구분을 선택하세요</span>}
                      </div>
                    )
                  })()}
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">사유/메모</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="품의 사유를 입력해주세요" rows={3} className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none resize-none" />
              </div>
              {modalApprovalType === 'general' && (
                <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 text-[11px] text-purple-700 dark:text-purple-400">
                  📋 일반품의는 승인권자가 승인 시 <strong>즉시 완료</strong> 처리됩니다.
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-[var(--border-default)]">
              <button onClick={() => { setModalOpen(false); setEditingId(null); setModalApprovalType('expense'); setForm({ title: '', amount: '', date: getLocalDate(), accountCode: '', description: '', applicant: currentUserName, approver: '' }) }} className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] cursor-pointer">취소</button>
              <button onClick={saveApproval} className={`px-4 py-2 rounded-lg text-white text-sm font-bold cursor-pointer ${modalApprovalType === 'general' ? 'bg-[#8b5cf6] hover:bg-[#7c3aed]' : 'bg-[#22c55e] hover:bg-[#16a34a]'}`}>{editingId ? '수정' : '등록'}</button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  )
}
