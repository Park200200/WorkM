import React, { useState, useMemo } from 'react'
import { getItem, setItem } from '../../../utils/storage'
import { formatNumber } from '../../../utils/format'
import type { Vendor } from './types'
import { fmtPhone, fmtBizNo } from './utils'
import { ContactRound, Plus, Edit3, Save, X } from 'lucide-react'
import { createPortal } from 'react-dom'


export default function AcctVendors() {
  const [refresh, setRefresh] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<Omit<Vendor, 'id'>>(EMPTY_VENDOR)
  const [viewVendor, setViewVendor] = useState<Vendor | null>(null)

  const vendors = useMemo(() => {
    const all = getItem<Vendor[]>('acct_vendors', [])
    if (!search.trim()) return all
    const q = search.trim().toLowerCase()
    return all.filter(v =>
      v.name.toLowerCase().includes(q) ||
      v.bizNo?.toLowerCase().includes(q) ||
      v.ceoName?.toLowerCase().includes(q) ||
      v.managerName?.toLowerCase().includes(q)
    )
  }, [refresh, search])

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
            <span className="text-[11px]">🏢</span>
            <span className="text-[12px] font-extrabold text-[#4f6ef7]">기본 정보</span>
          </div>
          <div className="p-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>◎ 거래처명 *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="(주)한국전자" className={inpCls2} />
              </div>
              <div>
                <label className={lbl}>◎ 대표자</label>
                <input value={form.ceoName} onChange={e => setForm(f => ({ ...f, ceoName: e.target.value }))} placeholder="김대표" className={inpCls2} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>◎ 대표전화</label>
                <input value={form.ceoPhone} onChange={e => setForm(f => ({ ...f, ceoPhone: fmtPhone(e.target.value) }))} placeholder="010-0000-0000" className={inpCls2} maxLength={13} />
              </div>
              <div>
                <label className={lbl}>◎ 사업자번호</label>
                <input value={form.bizNo} onChange={e => setForm(f => ({ ...f, bizNo: fmtBizNo(e.target.value) }))} placeholder="000-00-00000" className={inpCls2} maxLength={12} />
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
            <div>
              <label className={lbl}>◎ 세금계산서 이메일</label>
              <input type="email" value={form.invoiceEmail} onChange={e => setForm(f => ({ ...f, invoiceEmail: e.target.value }))} placeholder="tax@example.com" className={inpCls2} />
            </div>
            <div>
              <label className={lbl}>전화번호</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: fmtPhone(e.target.value) }))} placeholder="02-0000-0000" className={inpCls2} maxLength={13} />
            </div>
            <div>
              <label className={lbl}>사업장주소</label>
              <div className="flex gap-2 mb-2">
                <input value={form.zipCode} readOnly placeholder="우편번호" className={`${inpCls2} flex-1 bg-[var(--bg-muted)]`} />
                <button type="button" onClick={() => { const dp = (window as any).daum?.Postcode; if (!dp) { alert('우편번호 검색 서비스를 불러오는 중입니다...'); return } new dp({ oncomplete: (d: any) => setForm(f => ({ ...f, zipCode: d.zonecode, address1: d.roadAddress || d.jibunAddress })) }).open() }} className="px-4 py-2 rounded-xl bg-primary-500 text-white text-[12px] font-bold cursor-pointer shrink-0 hover:bg-primary-600 transition-colors">검색</button>
              </div>
              <input value={form.address1} readOnly placeholder="주소" className={`${inpCls2} bg-[var(--bg-muted)] mb-2`} />
              <input value={form.address2} onChange={e => setForm(f => ({ ...f, address2: e.target.value }))} placeholder="상세주소를 입력하세요" className={inpCls2} />
            </div>
          </div>
        </div>

        {/* 담당자 정보 */}
        <div className={sectionCard}>
          <div className={sectionTitle}>
            <span className="text-[11px]">👤</span>
            <span className="text-[12px] font-extrabold text-[#22c55e]">담당자 정보</span>
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

        {/* 비고 */}
        <div className={sectionCard}>
          <div className={sectionTitle}>
            <span className="text-[11px]">📝</span>
            <span className="text-[12px] font-extrabold text-[#8b5cf6]">비고</span>
          </div>
          <div className="p-5">
            <textarea value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))} placeholder="기타 참고 사항을 입력하세요" rows={3} className={`${inpCls2} resize-none`} />
          </div>
        </div>
      </div>

      {/* 우: 사업자등록증 */}
      <div className="w-[200px] shrink-0">
        <div className={sectionCard}>
          <div className={sectionTitle}>
            <span className="text-[11px]">📄</span>
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
                  <a href={form.bizRegImage} target="_blank" rel="noopener" className="text-[11px] text-primary-500 font-semibold">📄 PDF 보기</a>
                )
              ) : (
                <div className="text-center text-[var(--text-muted)]">
                  <div className="text-2xl mb-1">📄</div>
                  <div className="text-[10px]">등록된 사업자등록증이 없습니다</div>
                </div>
              )}
            </div>
            <label className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-muted)] cursor-pointer hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
              <span className="text-[11px] text-[var(--text-muted)] font-bold">⬆ 업로드</span>
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 5*1024*1024) { alert('5MB 이하'); return } const r = new FileReader(); r.onload = () => setForm(f => ({ ...f, bizRegImage: r.result as string })); r.readAsDataURL(file) }} />
            </label>
          </div>
        </div>
      </div>
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
              <span className="text-[11px]">🏢</span>
              <span className="text-[12px] font-extrabold text-[#4f6ef7]">기본 정보</span>
            </div>
            <div className="px-5 py-1">
              <Row label="거래처명" value={v.name} />
              <Row label="사업자번호" value={v.bizNo} />
              <Row label="대표자" value={v.ceoName} />
              <Row label="대표전화" value={v.ceoPhone} />
              <Row label="전화번호" value={v.phone} />
              <Row label="업태" value={v.bizType} />
              <Row label="종목" value={v.bizCategory} />
              <Row label="이메일" value={v.invoiceEmail} />
              <Row label="우편번호" value={v.zipCode} />
              <Row label="주소" value={[v.address1 || v.address, v.address2].filter(Boolean).join(' ') || undefined} />
            </div>
          </div>

          {/* 담당자 정보 */}
          <div className={sectionCard}>
            <div className={sectionTitle}>
              <span className="text-[11px]">👤</span>
              <span className="text-[12px] font-extrabold text-[#22c55e]">담당자 정보</span>
            </div>
            <div className="px-5 py-1">
              <Row label="담당자명" value={v.managerName} />
              <Row label="직함" value={v.managerRole} />
              <Row label="휴대폰" value={v.managerPhone} />
              <Row label="이메일" value={v.managerEmail} />
              <Row label="아이디" value={v.managerId} />
            </div>
          </div>

          {/* 비고 */}
          <div className={sectionCard}>
            <div className={sectionTitle}>
              <span className="text-[11px]">📝</span>
              <span className="text-[12px] font-extrabold text-[#8b5cf6]">비고</span>
            </div>
            <div className="px-5 py-3">
              <p className="text-[13px] text-[var(--text-primary)] whitespace-pre-wrap">{v.memo || '-'}</p>
            </div>
          </div>
        </div>

        {/* 우: 사업자등록증 */}
        <div className="w-[200px] shrink-0">
          <div className={sectionCard}>
            <div className={sectionTitle}>
              <span className="text-[11px]">📄</span>
              <span className="text-[12px] font-extrabold text-[var(--text-secondary)]">사업자등록증</span>
            </div>
            <div className="p-4">
              <div className="min-h-[220px] rounded-xl border border-[var(--border-default)] bg-[var(--bg-muted)] flex items-center justify-center overflow-hidden">
                {v.bizRegImage ? (
                  v.bizRegImage.startsWith('data:image') ? (
                    <img src={v.bizRegImage} alt="사업자등록증" className="w-full object-contain cursor-pointer" onClick={() => window.open(v.bizRegImage, '_blank')} />
                  ) : (
                    <a href={v.bizRegImage} target="_blank" rel="noopener" className="text-[11px] text-primary-500 font-semibold">📄 PDF 보기</a>
                  )
                ) : (
                  <div className="text-center text-[var(--text-muted)]">
                    <div className="text-2xl mb-1">📄</div>
                    <div className="text-[10px]">등록된 사업자등록증이 없습니다</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }


  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-[#6366f1] to-[#4f6ef7] rounded-2xl p-4 text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-xl">🏢</div>
          <div>
            <div className="text-[17px] font-extrabold">거래처관리</div>
            <div className="text-[11.5px] opacity-85">거래처 정보를 등록하고 관리합니다</div>
          </div>
        </div>
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
        <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f6ef7] text-white text-sm font-bold cursor-pointer shadow-md shrink-0">
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
            <p className="text-3xl mb-2">🏢</p>
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
              <button onClick={saveVendor} className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f6ef7] text-white text-sm font-bold cursor-pointer shadow-md hover:shadow-lg transition-shadow flex items-center gap-1.5">
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
              <button onClick={() => { setViewOpen(false); openEdit(viewVendor) }} className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f6ef7] text-white text-sm font-bold cursor-pointer shadow-md hover:shadow-lg transition-shadow flex items-center gap-1.5">
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
