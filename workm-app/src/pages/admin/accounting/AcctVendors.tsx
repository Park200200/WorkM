import React, { useState, useMemo, useEffect } from 'react'
import { getItem, setItem } from '../../../utils/storage'
import { formatNumber } from '../../../utils/format'
import { fmtPhone, fmtBizNo } from './utils'
import { ContactRound, Plus, Edit3, Save, X, Building2, User, FileText, Lock, ArrowUp, Mail, MoreHorizontal, Trash2, CreditCard, Wrench } from 'lucide-react'
import { createPortal } from 'react-dom'

export interface Vendor {
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
  /* 구분 */
  vendorType?: '거래처' | '개인' | '직원'
  /* 계좌정보 */
  bankName?: string
  accountNumber?: string
  accountHolder?: string
  /* 소속 거래처 연결 (개인→거래처, 용역 관계) - 복수 가능 */
  linkedVendorIds?: number[]
}

const EMPTY_VENDOR: Omit<Vendor, 'id'> = {
  name: '', zipCode: '', address1: '', address2: '', phone: '',
  ceoName: '', ceoPhone: '', managerName: '', managerRole: '', managerPhone: '', managerEmail: '', managerId: '', managerPw: '',
  bizNo: '', bizType: '', bizCategory: '', invoiceEmail: '', bizRegImage: '',
  memo: '', budgetCatId: '',
  vendorType: '거래처', bankName: '', accountNumber: '', accountHolder: '',
  linkedVendorIds: [],
}

function VendorRow({ v, idx, onView, onEdit, onDelete }: { v: any; idx: number; onView: (v: any) => void; onEdit: (v: any) => void; onDelete: (id: number) => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <tr className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-muted)] transition-colors cursor-pointer" onClick={() => onView(v)}>
      <td className="px-4 py-3 text-center text-[12px] text-[var(--text-muted)]">{idx + 1}</td>
      <td className="px-4 py-3">
        <div className="font-bold text-[13px] text-[var(--text-primary)] flex items-center gap-1.5">
          {v.name}
          {v.vendorType && (() => {
            const ids: number[] = v.linkedVendorIds || []
            const isYongyeok = v.vendorType === '개인' && ids.length > 0
            if (isYongyeok) {
              return (
                <>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">용역</span>
                  <span className="text-[9px] px-1 py-0.5 rounded-full font-bold bg-purple-50 text-purple-500 dark:bg-purple-900/20 dark:text-purple-400 border border-purple-200 dark:border-purple-800/30">{ids.length}개사</span>
                </>
              )
            }
            return <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${v.vendorType === '거래처' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : v.vendorType === '개인' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>{v.vendorType}</span>
          })()}
        </div>
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


export default function AcctVendors() {
  const [refresh, setRefresh] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('전체')
  const [form, setForm] = useState<Omit<Vendor, 'id'>>(EMPTY_VENDOR)
  const [viewVendor, setViewVendor] = useState<Vendor | null>(null)
  const [linkedSearch, setLinkedSearch] = useState('')
  const [showLinkedList, setShowLinkedList] = useState(false)

  // 초기 샘플 데이터 (한 번만 생성)
  useEffect(() => {
    const seeded = getItem<boolean>('acct_vendors_seeded', false)
    if (seeded) return
    const existing = getItem<Vendor[]>('acct_vendors', [])
    const samples: Vendor[] = [
      // 거래처 (3)
      { id: 1, name: '(주)삼성전자', vendorType: '거래처', bizNo: '124-81-00998', ceoName: '한종희', phone: '031-200-1114', managerName: '김담당', managerPhone: '010-1234-5678', bankName: '국민은행', accountNumber: '123-456-78901', accountHolder: '(주)삼성전자' },
      { id: 2, name: '(주)현대오피스', vendorType: '거래처', bizNo: '211-86-12345', ceoName: '박사장', phone: '02-555-1234', managerName: '이영업', managerPhone: '010-2345-6789', bankName: '신한은행', accountNumber: '110-234-567890', accountHolder: '(주)현대오피스' },
      { id: 3, name: '쿠팡(주)', vendorType: '거래처', bizNo: '120-88-00767', ceoName: '강한승', phone: '1577-7011', managerName: '최매니저', bankName: '우리은행', accountNumber: '1005-801-234567', accountHolder: '쿠팡(주)' },
      // 개인 (3)
      { id: 4, name: '김프리', vendorType: '개인', phone: '010-3456-7890', bankName: '카카오뱅크', accountNumber: '3333-01-2345678', accountHolder: '김프리', memo: '프리랜서 디자이너' },
      { id: 5, name: '이작가', vendorType: '개인', phone: '010-4567-8901', bankName: '토스뱅크', accountNumber: '1000-1234-5678', accountHolder: '이작가', memo: '콘텐츠 작가' },
      { id: 6, name: '박강사', vendorType: '개인', phone: '010-5678-9012', bankName: '국민은행', accountNumber: '987-654-32101', accountHolder: '박강사', memo: '외부 강사' },
      // 직원 (3)
      { id: 7, name: '최대표', vendorType: '직원', phone: '010-1111-2222', bankName: '신한은행', accountNumber: '110-111-222222', accountHolder: '최대표', memo: '대표이사' },
      { id: 8, name: '한경리', vendorType: '직원', phone: '010-3333-4444', bankName: '국민은행', accountNumber: '123-333-44444', accountHolder: '한경리', memo: '경리 담당' },
      { id: 9, name: '박팀장', vendorType: '직원', phone: '010-5555-6666', bankName: '우리은행', accountNumber: '1005-555-666666', accountHolder: '박팀장', memo: '기획팀장' },
      // 거래처 - 용역 (3)
      { id: 10, name: '클린서비스', vendorType: '거래처', ceoName: '정대표', phone: '02-777-8888', bankName: '기업은행', accountNumber: '012-345-678901', accountHolder: '클린서비스', memo: '청소 용역' },
      { id: 11, name: '세무법인 한울', vendorType: '거래처', ceoName: '강세무사', phone: '02-888-9999', bizNo: '107-86-54321', bankName: '하나은행', accountNumber: '267-890-123456', accountHolder: '세무법인 한울', memo: '세무/회계 용역' },
      { id: 12, name: '보안솔루션', vendorType: '거래처', ceoName: '윤보안', phone: '02-999-1111', bankName: '신한은행', accountNumber: '110-999-111111', accountHolder: '보안솔루션', memo: 'IT 보안 용역' },
    ]
    // 기존 데이터에 병합 (이름 중복 제외)
    const existingNames = new Set(existing.map(v => v.name))
    const maxId = existing.length > 0 ? Math.max(...existing.map(v => v.id || 0)) : 0
    const toAdd = samples.filter(s => !existingNames.has(s.name)).map((s, i) => ({ ...s, id: maxId + i + 1 }))
    setItem('acct_vendors', [...existing, ...toAdd])
    setItem('acct_vendors_seeded', true)
    setRefresh(r => r + 1)
  }, [])

  // 마이그레이션: 기존 '용역'/'회사' → '거래처'로 변환
  useEffect(() => {
    const all = getItem<Vendor[]>('acct_vendors', [])
    let changed = false
    const migrated = all.map(v => {
      let updated = { ...v }
      if (!v.vendorType || (v as any).vendorType === '용역' || (v as any).vendorType === '회사') {
        changed = true
        updated = { ...updated, vendorType: '거래처' as const }
      }
      // linkedVendorId(단수) → linkedVendorIds(배열) 마이그레이션
      if ((v as any).linkedVendorId && !v.linkedVendorIds) {
        changed = true
        updated = { ...updated, linkedVendorIds: [(v as any).linkedVendorId] }
        delete (updated as any).linkedVendorId
      }
      return updated
    })
    if (changed) {
      setItem('acct_vendors', migrated)
      setRefresh(r => r + 1)
    }
  }, [])

  // 사원관리(ws_users) → 직원 거래처 자동 동기화
  useEffect(() => {
    const staffList = getItem<any[]>('ws_users', [])
    if (staffList.length === 0) return
    const vendors = getItem<Vendor[]>('acct_vendors', [])
    const existingStaffNames = new Set(vendors.filter(v => v.vendorType === '직원').map(v => v.name))
    let changed = false
    let maxId = vendors.length > 0 ? Math.max(...vendors.map(v => v.id || 0)) : 0

    // 기존 직원 정보 업데이트
    const updated = vendors.map(v => {
      if (v.vendorType !== '직원') return v
      const staff = staffList.find(s => s.name === v.name)
      if (!staff) return v
      const newPhone = staff.phone || ''
      const newMemo = [staff.dept, staff.rank].filter(Boolean).join(' · ')
      if (v.phone !== newPhone || v.memo !== newMemo) {
        changed = true
        return { ...v, phone: newPhone, memo: newMemo }
      }
      return v
    })

    // 새 사원 추가 (퇴사자 제외)
    const toAdd: Vendor[] = []
    for (const s of staffList) {
      if (s.resignedAt || s.status === '퇴사') continue
      if (existingStaffNames.has(s.name)) continue
      maxId++
      toAdd.push({
        id: maxId,
        name: s.name,
        vendorType: '직원',
        phone: s.phone || '',
        memo: [s.dept, s.rank].filter(Boolean).join(' · '),
        bankName: '', accountNumber: '', accountHolder: '',
      })
      changed = true
    }

    if (changed) {
      setItem('acct_vendors', [...updated, ...toAdd])
      setRefresh(r => r + 1)
    }
  }, [])

  const vendors = useMemo(() => {
    const all = getItem<Vendor[]>('acct_vendors', [])
    let filtered = all
    if (filterType !== '전체') filtered = filtered.filter(v => (v as any).vendorType === filterType)
    if (!search.trim()) return filtered
    const q = search.trim().toLowerCase()
    return filtered.filter(v =>
      v.name.toLowerCase().includes(q) ||
      v.bizNo?.toLowerCase().includes(q) ||
      v.ceoName?.toLowerCase().includes(q) ||
      v.managerName?.toLowerCase().includes(q)
    )
  }, [refresh, search, filterType])

  const openAdd = () => {
    setEditId(null)
    setForm({ ...EMPTY_VENDOR })
    setModalOpen(true)
  }

  const openEdit = (v: Vendor) => {
    setEditId(v.id)
    setForm({
      name: v.name, zipCode: v.zipCode || '', address1: v.address1 || v.address || '', address2: v.address2 || '', phone: v.phone || '',
      ceoName: v.ceoName || '', ceoPhone: v.ceoPhone || '',
      managerName: v.managerName || '', managerRole: v.managerRole || '', managerPhone: v.managerPhone || '',
      managerEmail: v.managerEmail || '', managerId: v.managerId || '', managerPw: v.managerPw || '',
      bizNo: v.bizNo || '', bizType: v.bizType || '', bizCategory: v.bizCategory || '',
      invoiceEmail: v.invoiceEmail || '', bizRegImage: v.bizRegImage || '', memo: v.memo || '',
      budgetCatId: v.budgetCatId || '',
      vendorType: v.vendorType || '거래처', bankName: v.bankName || '', accountNumber: v.accountNumber || '', accountHolder: v.accountHolder || '',
      linkedVendorIds: v.linkedVendorIds || [],
    })
    setModalOpen(true)
  }

  const openView = (v: Vendor) => {
    setViewVendor(v)
    setViewOpen(true)
  }

  const saveVendor = () => {
    if (!form.name.trim()) { alert('거래처명을 입력하세요'); return }
    const all = getItem<Vendor[]>('acct_vendors', [])
    if (editId) {
      const updated = all.map(v => v.id === editId ? { ...v, ...form } : v)
      setItem('acct_vendors', updated)
    } else {
      all.push({ id: Date.now(), ...form })
      setItem('acct_vendors', all)
    }
    setModalOpen(false)
    setRefresh(r => r + 1)
  }

  const deleteVendor = (id: number) => {
    if (!confirm('이 거래처를 삭제하시겠습니까?')) return
    const all = getItem<Vendor[]>('acct_vendors', []).filter(v => v.id !== id)
    setItem('acct_vendors', all)
    setRefresh(r => r + 1)
  }

  /* ── 공통 스타일 ── */
  const sectionCard = "bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl overflow-hidden"
  const sectionTitle = "flex items-center gap-2 px-5 py-3 border-b border-[var(--border-default)] bg-[var(--bg-muted)]"
  const inpCls2 = "w-full px-3 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)] text-[13px] text-[var(--text-primary)] focus:border-primary-400 outline-none transition-colors"
  const lbl = "block text-[10px] font-bold text-[var(--text-muted)] mb-1"

  /* ── 등록/수정 폼 ── */
  const renderForm = () => (
    <div className="flex gap-4 h-full">
      {/* 좌: 메인 폼 */}
      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {/* 기본 정보 */}
        <div className={sectionCard}>
          <div className={sectionTitle}>
            <span className="text-[11px]"><Building2 size={11} /></span>
            <span className="text-[12px] font-extrabold text-primary-500">기본 정보</span>
          </div>
          <div className="p-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>{form.vendorType === '직원' ? '◎ 사원명 *' : form.vendorType === '개인' ? '◎ 성명 *' : '◎ 거래처명 *'}</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={form.vendorType === '직원' ? '홍길동' : form.vendorType === '개인' ? '홍길동' : '(주)한국전자'} className={inpCls2} />
              </div>
              {/* 구분 */}
              <div>
                <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">구분</label>
                <div className="flex items-center gap-1.5">
                  {(['거래처', '개인', '직원'] as const).map(t => (
                    <button key={t} type="button" onClick={() => setForm(f => ({ ...f, vendorType: t }))} className={`flex-1 py-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${form.vendorType === t ? (t === '거래처' ? 'bg-blue-500 text-white' : t === '개인' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white') : 'border border-[var(--border-default)] text-[var(--text-muted)] hover:bg-[var(--bg-muted)]'}`}>{t}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* 거래처: 대표자 */}
            {form.vendorType === '거래처' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>◎ 대표자</label>
                  <input value={form.ceoName} onChange={e => setForm(f => ({ ...f, ceoName: e.target.value }))} placeholder="김대표" className={inpCls2} />
                </div>
                <div>
                  <label className={lbl}>◎ 대표전화</label>
                  <input value={form.ceoPhone} onChange={e => setForm(f => ({ ...f, ceoPhone: fmtPhone(e.target.value) }))} placeholder="010-0000-0000" className={inpCls2} maxLength={13} />
                </div>
              </div>
            </>
            )}

            {/* 거래처만: 사업자정보 */}
            {form.vendorType === '거래처' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>◎ 사업자번호</label>
                  <input value={form.bizNo} onChange={e => setForm(f => ({ ...f, bizNo: fmtBizNo(e.target.value) }))} placeholder="000-00-00000" className={inpCls2} maxLength={12} />
                </div>
                <div>
                  <label className={lbl}>◎ 세금계산서 이메일</label>
                  <input type="email" value={form.invoiceEmail} onChange={e => setForm(f => ({ ...f, invoiceEmail: e.target.value }))} placeholder="tax@example.com" className={inpCls2} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>업태</label>
                  <input value={form.bizType} onChange={e => setForm(f => ({ ...f, bizType: e.target.value }))} placeholder="제조, 서비스" className={inpCls2} />
                </div>
                <div>
                  <label className={lbl}>종목</label>
                  <input value={form.bizCategory} onChange={e => setForm(f => ({ ...f, bizCategory: e.target.value }))} placeholder="전자부품" className={inpCls2} />
                </div>
              </div>
            </>
            )}

            {/* 공통: 전화번호 */}
            <div>
              <label className={lbl}>{form.vendorType === '직원' || form.vendorType === '개인' ? '연락처' : '전화번호'}</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: fmtPhone(e.target.value) }))} placeholder={form.vendorType === '직원' || form.vendorType === '개인' ? '010-0000-0000' : '02-0000-0000'} className={inpCls2} maxLength={13} />
            </div>

            {/* 개인: 소속 거래처 연결 (용역 관계, 복수) */}
            {form.vendorType === '개인' && (() => {
              const companyList = getItem<Vendor[]>('acct_vendors', []).filter(v => (v as any).vendorType === '거래처')
              const ids: number[] = (form as any).linkedVendorIds || []
              const linkedItems = companyList.filter(v => ids.includes(v.id))
              const available = companyList.filter(v => !ids.includes(v.id))
              const q = linkedSearch.trim().toLowerCase()
              const filtered = q ? available.filter(c => c.name.toLowerCase().includes(q) || (c.ceoName || '').toLowerCase().includes(q)) : available
              return (
                <div className="border-t border-dashed border-[var(--border-default)] pt-3 mt-1">
                  <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-2 block flex items-center gap-1"><Building2 size={12} /> 소속 거래처 (용역)</label>
                  {/* 이미 연결된 거래처 목록 */}
                  {linkedItems.length > 0 && (
                    <div className="space-y-1.5 mb-2">
                      {linkedItems.map(lk => (
                        <div key={lk.id} className="flex items-center gap-2">
                          <div className="flex-1 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/15 dark:border-blue-800/30 text-[12px] font-bold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                            <Building2 size={11} /> {lk.name}
                            {lk.ceoName && <span className="text-[10px] text-blue-400 font-normal">({lk.ceoName})</span>}
                          </div>
                          <button type="button" onClick={() => setForm(f => ({ ...f, linkedVendorIds: ((f as any).linkedVendorIds || []).filter((id: number) => id !== lk.id) } as any))} className="p-1 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 cursor-pointer transition-colors"><X size={13} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* 검색 추가 */}
                  <div className="relative">
                    <input
                      value={linkedSearch}
                      onChange={e => { setLinkedSearch(e.target.value); setShowLinkedList(true) }}
                      onFocus={() => setShowLinkedList(true)}
                      placeholder="거래처명 검색하여 추가..."
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] outline-none focus:border-blue-400 transition-colors"
                    />
                    {showLinkedList && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowLinkedList(false)} />
                        <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-xl max-h-[180px] overflow-y-auto">
                          {filtered.length > 0 ? filtered.slice(0, 10).map(c => (
                            <button key={c.id} type="button" onClick={() => { setForm(f => ({ ...f, linkedVendorIds: [...((f as any).linkedVendorIds || []), c.id] } as any)); setLinkedSearch(''); setShowLinkedList(false) }}
                              className="w-full text-left px-3 py-2.5 text-[13px] text-[var(--text-primary)] hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer border-none bg-transparent flex items-center gap-2">
                              <Building2 size={11} className="text-blue-500 shrink-0" />
                              <span className="font-bold">{c.name}</span>
                              {c.ceoName && <span className="text-[11px] text-[var(--text-muted)]">({c.ceoName})</span>}
                            </button>
                          )) : (
                            <div className="px-3 py-3 text-[12px] text-[var(--text-muted)] text-center">{available.length === 0 ? '모든 거래처가 연결됨' : '검색 결과가 없습니다'}</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* 거래처만: 사업장주소 */}
            {form.vendorType === '거래처' && (
            <div>
              <label className={lbl}>사업장주소</label>
              <div className="flex gap-2 mb-2">
                <input value={form.zipCode} readOnly placeholder="우편번호" className={`${inpCls2} flex-1 bg-[var(--bg-muted)]`} />
                <button type="button" onClick={() => { const dp = (window as any).daum?.Postcode; if (!dp) { alert('우편번호 검색 서비스를 불러오는 중입니다...'); return } new dp({ oncomplete: (d: any) => setForm(f => ({ ...f, zipCode: d.zonecode, address1: d.roadAddress || d.jibunAddress })) }).open() }} className="px-4 py-2 rounded-xl bg-primary-500 text-white text-[12px] font-bold cursor-pointer shrink-0 hover:bg-primary-600 transition-colors">검색</button>
              </div>
              <input value={form.address1} readOnly placeholder="주소" className={`${inpCls2} bg-[var(--bg-muted)] mb-2`} />
              <input value={form.address2} onChange={e => setForm(f => ({ ...f, address2: e.target.value }))} placeholder="상세주소를 입력하세요" className={inpCls2} />
            </div>
            )}

            {/* 공통: 계좌정보 */}
            <div className="col-span-2 border-t border-dashed border-[var(--border-default)] pt-3 mt-1">
              <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-2 block flex items-center gap-1"><CreditCard size={12} /> 계좌정보</label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[9px] text-[var(--text-muted)] mb-0.5 block">은행명</label>
                  <input value={(form as any).bankName || ''} onChange={e => setForm(f => ({ ...f, bankName: e.target.value } as any))} placeholder="은행명" className="w-full px-2.5 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] outline-none focus:border-primary-500" />
                </div>
                <div>
                  <label className="text-[9px] text-[var(--text-muted)] mb-0.5 block">계좌번호</label>
                  <input value={(form as any).accountNumber || ''} onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value } as any))} placeholder="계좌번호" className="w-full px-2.5 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] outline-none focus:border-primary-500" />
                </div>
                <div>
                  <label className="text-[9px] text-[var(--text-muted)] mb-0.5 block">예금주</label>
                  <input value={(form as any).accountHolder || ''} onChange={e => setForm(f => ({ ...f, accountHolder: e.target.value } as any))} placeholder="예금주" className="w-full px-2.5 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] outline-none focus:border-primary-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 거래처만: 담당자 정보 */}
        {form.vendorType === '거래처' && (
        <div className={sectionCard}>
          <div className={sectionTitle}>
            <span className="text-[11px]"><User size={11} /></span>
            <span className="text-[12px] font-extrabold text-success-500">담당자 정보</span>
          </div>
          <div className="p-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>◎ 담당자 이름</label>
                <input value={form.managerName} onChange={e => setForm(f => ({ ...f, managerName: e.target.value }))} placeholder="박담당" className={inpCls2} />
              </div>
              <div>
                <label className={lbl}>직함</label>
                <input value={form.managerRole || ''} onChange={e => setForm(f => ({ ...f, managerRole: e.target.value }))} placeholder="예) 팀장/사장" className={inpCls2} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>◈ 휴대폰</label>
                <input value={form.managerPhone} onChange={e => setForm(f => ({ ...f, managerPhone: fmtPhone(e.target.value) }))} placeholder="010-0000-0000" className={inpCls2} maxLength={13} />
              </div>
              <div>
                <label className={lbl}>✉ 이메일</label>
                <input type="email" value={form.managerEmail || ''} onChange={e => setForm(f => ({ ...f, managerEmail: e.target.value }))} placeholder="email@example.com" className={inpCls2} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>◎ 아이디(ID)</label>
                <input value={form.managerId || ''} onChange={e => setForm(f => ({ ...f, managerId: e.target.value }))} placeholder="system_id" className={inpCls2} />
              </div>
              <div>
                <label className={lbl}>🔒 비밀번호</label>
                <input type="password" value={form.managerPw || ''} onChange={e => setForm(f => ({ ...f, managerPw: e.target.value }))} placeholder="•••" className={inpCls2} />
              </div>
            </div>
          </div>
        </div>
        )}

        {/* 공통: 비고 */}
        <div className={sectionCard}>
          <div className={sectionTitle}>
            <span className="text-[11px]"><Edit3 size={11} /></span>
            <span className="text-[12px] font-extrabold text-violet-500">비고</span>
          </div>
          <div className="p-5">
            <textarea value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))} placeholder="기타 참고 사항을 입력하세요" rows={3} className={`${inpCls2} resize-none`} />
          </div>
        </div>
      </div>

      {/* 우: 사업자등록증 (거래처만) */}
      {form.vendorType === '거래처' ? (
      <div className="w-[200px] shrink-0">
        <div className={sectionCard}>
          <div className={sectionTitle}>
            <span className="text-[11px]"><FileText size={11} /></span>
            <span className="text-[12px] font-extrabold text-[var(--text-secondary)]">사업자등록증</span>
          </div>
          <div className="p-4 space-y-3">
            <div className="min-h-[180px] rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-muted)] flex items-center justify-center overflow-hidden">
              {form.bizRegImage ? (
                form.bizRegImage.startsWith('data:image') ? (
                  <div className="relative group w-full h-full">
                    <img src={form.bizRegImage} alt="사업자등록증" className="w-full h-full object-contain" />
                    <button type="button" onClick={() => setForm(f => ({ ...f, bizRegImage: '' }))} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[9px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">✕</button>
                  </div>
                ) : (
                  <a href={form.bizRegImage} target="_blank" rel="noopener" className="text-[11px] text-primary-500 font-semibold flex items-center gap-1"><FileText size={10} /> PDF 보기</a>
                )
              ) : (
                <div className="text-center text-[var(--text-muted)]">
                  <div className="text-2xl mb-1"><FileText size={24} className="mx-auto" /></div>
                  <div className="text-[10px]">등록된 사업자등록증이 없습니다</div>
                </div>
              )}
            </div>
            <label className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-muted)] cursor-pointer hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
              <span className="text-[11px] text-[var(--text-muted)] font-bold flex items-center gap-1"><ArrowUp size={10} /> 업로드</span>
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 5*1024*1024) { alert('5MB 이하'); return } const r = new FileReader(); r.onload = () => setForm(f => ({ ...f, bizRegImage: r.result as string })); r.readAsDataURL(file) }} />
            </label>
          </div>
        </div>
      </div>
      ) : null}
    </div>
  )

  /* ── 조회 렌더 ── */
  const renderView = (v: Vendor) => {
    const Row = ({ label, value }: { label: string; value?: string }) => (
      <div className="flex py-2 border-b border-[var(--border-default)] last:border-0">
        <span className="text-[11px] font-bold text-[var(--text-muted)] w-24 shrink-0 self-center">{label}</span>
        <span className="text-[13px] text-[var(--text-primary)] flex-1">{value || '-'}</span>
      </div>
    )
    return (
      <div className="flex gap-4">
        {/* 좌: 정보 */}
        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {/* 기본 정보 */}
          <div className={sectionCard}>
            <div className={sectionTitle}>
              <span className="text-[11px]"><Building2 size={11} /></span>
              <span className="text-[12px] font-extrabold text-primary-500">기본 정보</span>
            </div>
            <div className="px-5 py-1">
              <Row label={v.vendorType === '직원' ? '사원명' : v.vendorType === '개인' ? '성명' : '거래처명'} value={v.name} />
              {(v.vendorType === '거래처') && <Row label="사업자번호" value={v.bizNo} />}
              {v.vendorType === '거래처' && <Row label="대표자" value={v.ceoName} />}
              {v.vendorType === '거래처' && <Row label="대표전화" value={v.ceoPhone} />}
              <Row label={v.vendorType === '직원' || v.vendorType === '개인' ? '연락처' : '전화번호'} value={v.phone} />
              {v.vendorType === '거래처' && <Row label="업태" value={v.bizType} />}
              {v.vendorType === '거래처' && <Row label="종목" value={v.bizCategory} />}
              {v.vendorType === '거래처' && <Row label="이메일" value={v.invoiceEmail} />}
              {v.vendorType === '거래처' && <Row label="우편번호" value={v.zipCode} />}
              {v.vendorType === '거래처' && <Row label="주소" value={[v.address1 || v.address, v.address2].filter(Boolean).join(' ') || undefined} />}
              {(v as any).bankName && <Row label="계좌" value={`${(v as any).bankName} ${(v as any).accountNumber || ''} (${(v as any).accountHolder || ''})`} />}
            </div>
          </div>

          {/* 거래처: 담당자 정보 */}
          {v.vendorType === '거래처' && (v.managerName || v.managerPhone) && (
          <div className={sectionCard}>
            <div className={sectionTitle}>
              <span className="text-[11px]"><User size={11} /></span>
              <span className="text-[12px] font-extrabold text-success-500">담당자 정보</span>
            </div>
            <div className="px-5 py-1">
              <Row label="담당자명" value={v.managerName} />
              <Row label="직함" value={v.managerRole} />
              <Row label="휴대폰" value={v.managerPhone} />
              <Row label="이메일" value={v.managerEmail} />
              <Row label="아이디" value={v.managerId} />
            </div>
          </div>
          )}

          {/* 거래처: 소속 개인 목록 */}
          {v.vendorType === '거래처' && (() => {
            const allV = getItem<Vendor[]>('acct_vendors', [])
            const linked = allV.filter(p => ((p as any).linkedVendorIds || []).includes(v.id))
            if (linked.length === 0) return null
            return (
              <div className={sectionCard}>
                <div className={sectionTitle}>
                  <span className="text-[11px]"><User size={11} /></span>
                  <span className="text-[12px] font-extrabold text-amber-500">소속 인원 (용역)</span>
                </div>
                <div className="px-5 py-2">
                  <div className="space-y-1.5">
                    {linked.map(p => (
                      <div key={p.id} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
                        <User size={11} className="text-amber-500 shrink-0" />
                        <span className="text-[12px] font-bold text-[var(--text-primary)]">{p.name}</span>
                        {p.phone && <span className="text-[11px] text-[var(--text-muted)]">{p.phone}</span>}
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 font-bold ml-auto">개인</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })()}

          {/* 개인: 소속 거래처 (복수) */}
          {v.vendorType === '개인' && ((v as any).linkedVendorIds || []).length > 0 && (() => {
            const allV = getItem<Vendor[]>('acct_vendors', [])
            const linkedList = allV.filter(y => ((v as any).linkedVendorIds || []).includes(y.id))
            if (linkedList.length === 0) return null
            return (
              <div className={sectionCard}>
                <div className={sectionTitle}>
                  <span className="text-[11px]"><Building2 size={11} /></span>
                  <span className="text-[12px] font-extrabold text-blue-500">소속 거래처 (용역)</span>
                </div>
                <div className="px-5 py-2">
                  <div className="space-y-1.5">
                    {linkedList.map(lk => (
                      <div key={lk.id} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30">
                        <Building2 size={11} className="text-blue-500 shrink-0" />
                        <span className="text-[12px] font-bold text-[var(--text-primary)]">{lk.name}</span>
                        {lk.ceoName && <span className="text-[11px] text-[var(--text-muted)]">({lk.ceoName})</span>}
                        {lk.phone && <span className="text-[11px] text-[var(--text-muted)]">{lk.phone}</span>}
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 font-bold ml-auto">거래처</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })()}

          {/* 비고 */}
          <div className={sectionCard}>
            <div className={sectionTitle}>
              <span className="text-[11px]"><Edit3 size={11} /></span>
              <span className="text-[12px] font-extrabold text-violet-500">비고</span>
            </div>
            <div className="px-5 py-3">
              <p className="text-[13px] text-[var(--text-primary)] whitespace-pre-wrap">{v.memo || '-'}</p>
            </div>
          </div>
        </div>

        {/* 우: 사업자등록증 (거래처만) */}
        {v.vendorType === '거래처' && (
        <div className="w-[200px] shrink-0">
          <div className={sectionCard}>
            <div className={sectionTitle}>
              <span className="text-[11px]"><FileText size={11} /></span>
              <span className="text-[12px] font-extrabold text-[var(--text-secondary)]">사업자등록증</span>
            </div>
            <div className="p-4">
              <div className="min-h-[220px] rounded-xl border border-[var(--border-default)] bg-[var(--bg-muted)] flex items-center justify-center overflow-hidden">
                {v.bizRegImage ? (
                  v.bizRegImage.startsWith('data:image') ? (
                    <img src={v.bizRegImage} alt="사업자등록증" className="w-full object-contain cursor-pointer" onClick={() => window.open(v.bizRegImage, '_blank')} />
                  ) : (
                    <a href={v.bizRegImage} target="_blank" rel="noopener" className="text-[11px] text-primary-500 font-semibold flex items-center gap-1"><FileText size={10} /> PDF 보기</a>
                  )
                ) : (
                  <div className="text-center text-[var(--text-muted)]">
                    <div className="text-2xl mb-1"><FileText size={24} className="mx-auto" /></div>
                    <div className="text-[10px]">등록된 사업자등록증이 없습니다</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    )
  }


  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-indigo-500 to-primary-500 rounded-2xl p-4 text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-xl"><Building2 size={20} /></div>
          <div>
            <div className="text-[17px] font-extrabold">거래처관리</div>
            <div className="text-[11.5px] opacity-85">거래처 정보를 등록하고 관리합니다</div>
          </div>
        </div>
      </div>

      {/* 구분별 탭 */}
      <div className="flex items-center gap-1 mb-3">
        {['전체', '거래처', '개인', '직원'].map(t => (
          <button key={t} onClick={() => setFilterType(t)} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${filterType === t ? 'bg-primary-500 text-white shadow-sm' : 'text-[var(--text-muted)] hover:bg-[var(--bg-muted)]'}`}>{t}</button>
        ))}
      </div>

      {/* 검색 + 등록 버튼 */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="거래처명, 사업자번호, 대표자, 담당자 검색..."
            className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none pl-9"
          />
          <ContactRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-primary-500 text-white text-sm font-bold cursor-pointer shadow-md shrink-0">
          <Plus size={14} /> 거래처 등록
        </button>
      </div>

      {/* 거래처 목록 - 테이블 형태 */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
          <span className="text-sm font-extrabold text-[var(--text-primary)]">거래처 목록</span>
          <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-muted)] px-2 py-0.5 rounded-full">{vendors.length}건</span>
        </div>
        {vendors.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-3xl mb-2"><Building2 size={32} className="mx-auto text-[var(--text-muted)]" /></p>
            <p className="text-sm text-[var(--text-muted)]">등록된 거래처가 없습니다</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-[var(--bg-muted)] border-b border-[var(--border-default)]">
                  <th className="px-4 py-3 text-[11px] font-bold text-[var(--text-muted)] text-center w-12">No</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-[var(--text-muted)] text-left">거래처명</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-[var(--text-muted)] text-left w-28">대표자</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-[var(--text-muted)] text-left w-44">연락처</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-[var(--text-muted)] text-center w-16">관리</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((v, idx) => (
                  <VendorRow key={v.id} v={v} idx={idx} onView={openView} onEdit={openEdit} onDelete={deleteVendor} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 등록/수정 모달 (넓은 중앙) ── */}
      {modalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4" onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="bg-[var(--bg-base)] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col animate-scaleIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)] bg-[var(--bg-surface)] rounded-t-2xl shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                  <ContactRound size={16} className="text-primary-500" />
                </div>
                <span className="text-sm font-extrabold text-[var(--text-primary)]">{editId ? '거래처 수정' : '거래처 등록'}</span>
              </div>
              <button onClick={() => setModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer transition-colors"><X size={18} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {renderForm()}
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-[var(--border-default)] bg-[var(--bg-surface)] rounded-b-2xl shrink-0">
              <button onClick={() => setModalOpen(false)} className="px-6 py-2.5 rounded-xl border border-[var(--border-default)] text-sm font-semibold text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--bg-muted)] transition-colors">취소</button>
              <button onClick={saveVendor} className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-primary-500 text-white text-sm font-bold cursor-pointer shadow-md hover:shadow-lg transition-shadow flex items-center gap-1.5">
                <Save size={14} /> {editId ? '수정' : '등록'}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* ── 조회 모달 (넓은 중앙) ── */}
      {viewOpen && viewVendor && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4" onClick={e => { if (e.target === e.currentTarget) setViewOpen(false) }}>
          <div className="bg-[var(--bg-base)] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col animate-scaleIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)] bg-[var(--bg-surface)] rounded-t-2xl shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                  <ContactRound size={16} className="text-primary-500" />
                </div>
                <span className="text-sm font-extrabold text-[var(--text-primary)]">거래처 상세</span>
              </div>
              <button onClick={() => setViewOpen(false)} className="w-8 h-8 rounded-lg hover:bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer transition-colors"><X size={18} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {renderView(viewVendor)}
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-[var(--border-default)] bg-[var(--bg-surface)] rounded-b-2xl shrink-0">
              <button onClick={() => setViewOpen(false)} className="px-6 py-2.5 rounded-xl border border-[var(--border-default)] text-sm font-semibold text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--bg-muted)] transition-colors">닫기</button>
              <button onClick={() => { setViewOpen(false); openEdit(viewVendor) }} className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-primary-500 text-white text-sm font-bold cursor-pointer shadow-md hover:shadow-lg transition-shadow flex items-center gap-1.5">
                <Edit3 size={14} /> 수정
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
