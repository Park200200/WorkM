import React, { useState, useMemo } from 'react'
import { getItem, setItem } from '../../../utils/storage'
import { formatNumber } from '../../../utils/format'
import type { HQV } from './types'
import { fmtPhone, fmtBizNo } from './utils'
import { Building2, Search, ChevronDown, Plus, Edit3, Trash2, Save, X, MoreHorizontal, Paperclip } from 'lucide-react'
import { cn } from '../../../utils/cn'
import { createPortal } from 'react-dom'


export default function AcctHQVendor() {
  const [vendors, setVendors] = useState<HQV[]>(() => getItem('acct_hq_vendors_v2', HQ_SEED))
  const [search, setSearch] = useState('')
  const [editVendor, setEditVendor] = useState<HQV | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [menuId, setMenuId] = useState<number | null>(null)

  const filtered = vendors.filter(v => !search || v.company.includes(search) || v.ceo.includes(search) || v.bizNo.includes(search))
  const totalBill = filtered.reduce((s, v) => s + (v.totalBill || 0), 0)

  const openAdd = () => {
    setEditVendor({ id: Date.now(), company:'', ceo:'', ceoPhone:'', bizPhone:'', bizNo:'', bizType:'', bizItem:'', taxEmail:'', zip:'', addr1:'', addr2:'', mgrName:'', mgrTitle:'', mgrMobile:'', mgrEmail:'', mgrId:'', mgrPw:'', bizDocImg:'', solutions:[{key:'workm',label:'워크맵',enabled:false},{key:'homepage',label:'홈페이지',enabled:false},{key:'fabric',label:'원단공급사',enabled:false},{key:'mfg',label:'제조공급사',enabled:false},{key:'dist',label:'유통판매서',enabled:false},{key:'franchise',label:'가맹대리점',enabled:false},{key:'food',label:'식재대리점',enabled:false}], billings:[], totalBill:0, unpaid:0, memo:'' })
    setModalOpen(true)
  }
  const openEdit = (v: HQV) => { setEditVendor({ ...v }); setModalOpen(true) }
  const saveVendor = () => {
    if (!editVendor?.company) { alert('거래처명을 입력하세요'); return }
    const exists = vendors.find(v => v.id === editVendor.id)
    const next = exists ? vendors.map(v => v.id === editVendor.id ? editVendor : v) : [...vendors, editVendor]
    setVendors(next); setItem('acct_hq_vendors_v2', next); setModalOpen(false)
  }
  const deleteVendor = (id: number) => {
    if (!confirm('삭제하시겠습니까?')) return
    const next = vendors.filter(v => v.id !== id)
    setVendors(next); setItem('acct_hq_vendors_v2', next)
  }
  const upd = (k: keyof HQV, v: any) => setEditVendor(p => p ? { ...p, [k]: v } : p)
  const toggleSol = (key: string) => {
    if (!editVendor) return
    upd('solutions', editVendor.solutions.map(s => s.key === key ? { ...s, enabled: !s.enabled } : s))
  }
  const ic = "w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors"

  return (
    <div className="animate-fadeIn">
      {/* 검색 + 추가 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="거래처명, 대표자, 사업자번호, 담당자 검색..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none" />
        </div>
        <button onClick={openAdd} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f6ef7] text-white text-sm font-bold cursor-pointer shadow-md hover:shadow-lg transition-shadow flex items-center gap-1.5 shrink-0">
          <Plus size={14} /> 거래처 추가
        </button>
      </div>

      {/* 테이블 */}
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-[var(--bg-muted)] border-b border-[var(--border-default)]">
              {['No','거래처명','대표자','연락처','사용솔루션','사용료 청구액','미수금','관리'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-bold text-[var(--text-muted)] whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((v, i) => (<React.Fragment key={v.id}>
              <tr className={cn('border-b border-[var(--border-default)] hover:bg-[var(--bg-muted)]/50 transition-colors cursor-pointer', expandedId === v.id && 'bg-[var(--bg-muted)]/30')} onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}>
                <td className="px-4 py-3 text-[var(--text-muted)]">
                  <div className="flex items-center gap-1">
                    <ChevronDown size={12} className={cn('transition-transform text-[var(--text-muted)]', expandedId === v.id && 'rotate-180')} />
                    {i + 1}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-bold text-[var(--text-primary)]">{v.company}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">{v.bizNo}</div>
                </td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{v.ceo}</td>
                <td className="px-4 py-3">
                  <div className="text-[var(--text-secondary)]">{v.bizPhone}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">담당: {v.mgrName}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {v.solutions.filter(s => s.enabled).map(s => (
                      <span key={s.key} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-100 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400">{s.label}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 font-extrabold text-[var(--text-primary)] whitespace-nowrap">{(v.totalBill || 0).toLocaleString()}원</td>
                <td className="px-4 py-3 font-bold text-orange-500 whitespace-nowrap">{(v.unpaid || 0).toLocaleString()}원</td>
                <td className="px-4 py-3 relative" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setMenuId(menuId === v.id ? null : v.id)} className="w-7 h-7 rounded-lg hover:bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-muted)] cursor-pointer"><MoreHorizontal size={14} /></button>
                  {menuId === v.id && (
                    <div className="absolute right-4 top-10 z-50 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-lg py-1 min-w-[100px] animate-scaleIn">
                      <button onClick={() => { setMenuId(null); openEdit(v) }} className="w-full px-4 py-2 text-left text-[12px] text-[var(--text-primary)] hover:bg-[var(--bg-muted)] cursor-pointer flex items-center gap-2"><Edit3 size={12} /> 수정</button>
                      <button onClick={() => { setMenuId(null); deleteVendor(v.id) }} className="w-full px-4 py-2 text-left text-[12px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer flex items-center gap-2"><Trash2 size={12} /> 삭제</button>
                    </div>
                  )}
                </td>
              </tr>
              {/* 청구 리스트 아코디언 */}
              {expandedId === v.id && v.billings.length > 0 && (
                <tr><td colSpan={8} className="p-0">
                  <div className="px-8 py-4 bg-blue-50/50 dark:bg-blue-900/5 border-b border-[var(--border-default)]">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[13px] font-bold text-[var(--text-primary)]">📋 청구 리스트</span>
                    </div>
                    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden">
                      <table className="w-full text-[11px]">
                        <thead><tr className="bg-[var(--bg-muted)] border-b border-[var(--border-default)]">
                          {['과금기간','월관리비','DB사용료','Data사용건수','수수료','총금액','상태'].map(h => <th key={h} className="px-3 py-2 text-left font-bold text-[var(--text-muted)] whitespace-nowrap">{h}</th>)}
                        </tr></thead>
                        <tbody>{(v.billings as any[]).map((b: any, bi: number) => (
                          <tr key={bi} className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-muted)]/50">
                            <td className="px-3 py-2 font-semibold text-[var(--text-primary)] whitespace-nowrap">{b.period}</td>
                            <td className="px-3 py-2 text-[var(--text-secondary)]">{b.mgmt || '-'}원</td>
                            <td className="px-3 py-2 text-[var(--text-secondary)]">{b.db || '-'}원</td>
                            <td className="px-3 py-2 text-[var(--text-secondary)]">{b.data || '-'}원</td>
                            <td className="px-3 py-2 text-[var(--text-secondary)]">{b.fee || '-'}원</td>
                            <td className="px-3 py-2 font-extrabold text-[var(--text-primary)]">{b.total}원</td>
                            <td className="px-3 py-2"><span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold', b.status==='과금중'?'bg-red-100 text-red-500 dark:bg-red-900/20':b.status==='청구'?'bg-blue-100 text-blue-500 dark:bg-blue-900/20':'bg-green-100 text-green-600 dark:bg-green-900/20')}>{b.status}</span></td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  </div>
                </td></tr>
              )}
            </React.Fragment>))}
          </tbody>
        </table>
        {/* 푸터 */}
        <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-muted)] border-t border-[var(--border-default)]">
          <span className="text-[12px] text-[var(--text-muted)]">총 <b className="text-[var(--text-primary)]">{filtered.length}건</b></span>
          <span className="text-[12px] text-[var(--text-muted)]">💰 청구액: <b className="text-primary-500">{totalBill.toLocaleString()}원</b></span>
        </div>
      </div>

      {/* 추가/수정 모달 */}
      {modalOpen && editVendor && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4" onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="bg-[var(--bg-base)] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col animate-scaleIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)] bg-[var(--bg-surface)] rounded-t-2xl shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center"><Building2 size={16} className="text-primary-500" /></div>
                <span className="text-sm font-extrabold text-[var(--text-primary)]">{vendors.find(v=>v.id===editVendor.id) ? editVendor.company || '거래처 수정' : '거래처 추가'}</span>
              </div>
              <button onClick={() => setModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-muted)] cursor-pointer"><X size={18} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* 기본 정보 + 사업자등록증 */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-5">
                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 space-y-3">
                  <SectionHeader icon="🏢" title="기본 정보" color="#4f6ef7" />
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="거래처명" required><input value={editVendor.company} onChange={e=>upd('company',e.target.value)} placeholder="(주)한국솔루션" className={ic} /></FormField>
                    <FormField label="대표자"><input value={editVendor.ceo} onChange={e=>upd('ceo',e.target.value)} placeholder="김대표" className={ic} /></FormField>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="대표전화"><input value={editVendor.ceoPhone} onChange={e=>upd('ceoPhone',fmtPhone(e.target.value))} placeholder="010-0000-0000" className={ic} maxLength={13} /></FormField>
                    <FormField label="사업자번호"><input value={editVendor.bizNo} onChange={e=>upd('bizNo',fmtBizNo(e.target.value))} placeholder="000-00-00000" className={ic} maxLength={12} /></FormField>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="업태"><input value={editVendor.bizType} onChange={e=>upd('bizType',e.target.value)} placeholder="서비스" className={ic} /></FormField>
                    <FormField label="업종"><input value={editVendor.bizItem} onChange={e=>upd('bizItem',e.target.value)} placeholder="소프트웨어" className={ic} /></FormField>
                  </div>
                  <FormField label="세금계산서 이메일"><input type="email" value={editVendor.taxEmail} onChange={e=>upd('taxEmail',e.target.value)} placeholder="tax@company.com" className={ic} /></FormField>
                  <FormField label="전화번호"><input value={editVendor.bizPhone} onChange={e=>upd('bizPhone',fmtPhone(e.target.value))} placeholder="02-0000-0000" className={ic} maxLength={13} /></FormField>
                  <FormField label="사업장주소">
                    <div className="flex gap-2 mb-2">
                      <input value={editVendor.zip} readOnly placeholder="우편번호" className={`${ic} flex-1 bg-[var(--bg-muted)] cursor-default`} />
                      <button type="button" onClick={() => { const dp=(window as any).daum?.Postcode; if(!dp){alert('로딩중...');return} new dp({oncomplete:(d:any)=>{upd('zip',d.zonecode);upd('addr1',d.roadAddress||d.jibunAddress)}}).open() }} className="px-3 py-2.5 rounded-lg bg-primary-500 text-white text-[11px] font-bold cursor-pointer shrink-0">+ 검색</button>
                    </div>
                    <input value={editVendor.addr1} readOnly placeholder="주소" className={`${ic} bg-[var(--bg-muted)] cursor-default mb-2`} />
                    <input value={editVendor.addr2} onChange={e=>upd('addr2',e.target.value)} placeholder="상세주소" className={ic} />
                  </FormField>
                </div>
                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 flex flex-col">
                  <SectionHeader icon="📋" title="사업자등록증" color="#f59e0b" />
                  <div className="flex-1 flex flex-col items-center justify-center min-h-[150px]">
                    {editVendor.bizDocImg ? (
                      <div className="relative group w-full"><img src={editVendor.bizDocImg} alt="" className="w-full max-h-[150px] object-contain rounded-lg border border-[var(--border-default)] bg-white" /><button type="button" onClick={()=>upd('bizDocImg','')} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 cursor-pointer">✕</button></div>
                    ) : (<div className="flex flex-col items-center gap-2 py-4 text-[var(--text-muted)]"><span className="text-3xl">📄</span><span className="text-[11px]">등록된 사업자등록증이 없습니다</span></div>)}
                  </div>
                  <label className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-[var(--border-default)] bg-[var(--bg-muted)] cursor-pointer hover:border-primary-400 transition-colors mt-2">
                    <span className="text-[12px] text-[var(--text-muted)] flex items-center gap-1"><Paperclip size={11} /> 파일로드</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>upd('bizDocImg',r.result as string);r.readAsDataURL(f)}} />
                  </label>
                </div>
              </div>
              {/* 담당자 정보 */}
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 space-y-3">
                <SectionHeader icon="👤" title="담당자 정보" color="#22c55e" />
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="담당자 이름"><input value={editVendor.mgrName} onChange={e=>upd('mgrName',e.target.value)} placeholder="담당자명" className={ic} /></FormField>
                  <FormField label="직함"><input value={editVendor.mgrTitle} onChange={e=>upd('mgrTitle',e.target.value)} placeholder="예) 팀장" className={ic} /></FormField>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="휴대폰"><input value={editVendor.mgrMobile} onChange={e=>upd('mgrMobile',fmtPhone(e.target.value))} placeholder="010-0000-0000" className={ic} maxLength={13} /></FormField>
                  <FormField label="이메일"><input type="email" value={editVendor.mgrEmail} onChange={e=>upd('mgrEmail',e.target.value)} placeholder="email@example.com" className={ic} /></FormField>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="아이디(계정)"><input value={editVendor.mgrId} onChange={e=>upd('mgrId',e.target.value)} placeholder="system_id" className={ic} /></FormField>
                  <FormField label="비밀번호"><input type="password" value={editVendor.mgrPw} onChange={e=>upd('mgrPw',e.target.value)} placeholder="••••" className={ic} /></FormField>
                </div>
              </div>
              {/* 사용 솔루션 */}
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-default)]">
                  <div className="flex items-center gap-2"><span className="text-sm">⚙️</span><span className="text-[12px] font-extrabold text-[var(--text-primary)]">사용 솔루션</span></div>
                  <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-muted)] px-2 py-0.5 rounded-full">{editVendor.solutions.filter(s=>s.enabled).length}개 사용중</span>
                </div>
                <div className="p-4 flex flex-wrap gap-3">
                  {editVendor.solutions.map(sol => (
                    <div key={sol.key} className={cn('flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 transition-all min-w-[140px] cursor-pointer', sol.enabled ? 'border-primary-300 bg-primary-50 dark:bg-primary-900/10' : 'border-[var(--border-default)] bg-[var(--bg-muted)] opacity-60')} onClick={()=>toggleSol(sol.key)}>
                      <span className="text-[13px] font-bold text-[var(--text-primary)] flex-1">{sol.label}</span>
                      <div className={cn('relative w-11 h-6 rounded-full transition-colors', sol.enabled ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600')}>
                        <span className={cn('absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow transition-transform', sol.enabled ? 'left-[22px]' : 'left-0.5')} />
                      </div>
                      {sol.key==='homepage'&&sol.enabled&&<div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]"><span>수량:</span><span className="w-10 px-1.5 py-0.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-center text-[12px] font-bold text-[var(--text-primary)]">{sol.qty||1}</span></div>}
                    </div>
                  ))}
                </div>
              </div>
              {/* 결제 정보 */}
              {editVendor.billings.length > 0 && (() => {
                const enabledSols = editVendor.solutions.filter(s => s.enabled).map(s => s.label).join(', ')
                const curBill = (editVendor.billings as any[])[0] || {} as any
                return (
                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden">
                  <div className="flex items-center justify-between flex-wrap gap-2 px-5 py-3 border-b border-[var(--border-default)]">
                    <div className="flex items-center gap-2"><span className="text-sm">💳</span><span className="text-[12px] font-extrabold text-[var(--text-primary)]">결제 정보</span></div>
                    <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
                      <span>사용솔루션: <b className="text-primary-500">{enabledSols || '-'}</b></span>
                      <span>⏱ 과금일자: <b>{curBill.period || '-'}</b></span>
                      <span>💰 총금액: <b className="text-primary-500">{curBill.total || '0'}원</b></span>
                      {editVendor.totalBill > 0 && <span>📊 단가수정</span>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4">
                    {[
                      { icon: '💻', label: '월관리비(서버)', value: curBill.mgmt || '0', sub: '기본금액' },
                      { icon: '🗄️', label: 'DB사용료(단가:100M당 1,000원)', value: curBill.db || '0', sub: '25,000MB' },
                      { icon: '#', label: '자료단가(10건당 1원)', value: curBill.data || '0', sub: (curBill.data || '0') + '건' },
                      { icon: '%', label: '수수료(7%)', value: curBill.fee || '0', sub: '기간매출:500,000원', hl: true },
                    ].map((c, ci) => (
                      <div key={ci} className={cn('rounded-xl p-3 border', c.hl ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800' : 'bg-[var(--bg-muted)] border-[var(--border-default)]')}>
                        <div className="text-[10px] font-semibold text-[var(--text-muted)] mb-1 flex items-center gap-1 truncate"><span>{c.icon}</span> {c.label}</div>
                        <div className={cn('text-lg font-extrabold', c.hl ? 'text-orange-500' : 'text-[var(--text-primary)]')}>{c.value}<span className="text-[13px] font-semibold text-[var(--text-secondary)]">원</span></div>
                        <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{c.sub}</div>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] font-bold text-[var(--text-primary)] flex items-center gap-1.5">📋 청구 리스트</span>
                      <span className="text-[11px] text-[var(--text-muted)]">{editVendor.billings.length}건</span>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-[var(--border-default)]">
                      <table className="w-full text-[11px]">
                        <thead><tr className="bg-[var(--bg-muted)] border-b border-[var(--border-default)]">
                          {['과금기간','월관리비','DB사용료','Data사용건수','수수료','총금액','상태'].map(h => <th key={h} className="px-3 py-2 text-left font-bold text-[var(--text-muted)] whitespace-nowrap">{h}</th>)}
                        </tr></thead>
                        <tbody>{(editVendor.billings as any[]).map((b: any, bi: number) => (
                          <tr key={bi} className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-muted)]/50">
                            <td className="px-3 py-2 font-semibold text-[var(--text-primary)] whitespace-nowrap">{b.period}</td>
                            <td className="px-3 py-2 text-[var(--text-secondary)]">{b.mgmt || '-'}원</td>
                            <td className="px-3 py-2 text-[var(--text-secondary)]">{b.db || '-'}원</td>
                            <td className="px-3 py-2 text-[var(--text-secondary)]">{b.data || '-'}원</td>
                            <td className="px-3 py-2 text-[var(--text-secondary)]">{b.fee || '-'}원</td>
                            <td className="px-3 py-2 font-extrabold text-[var(--text-primary)]">{b.total}원</td>
                            <td className="px-3 py-2"><span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold', b.status==='과금중'?'bg-red-100 text-red-500 dark:bg-red-900/20':b.status==='청구'?'bg-blue-100 text-blue-500 dark:bg-blue-900/20':'bg-green-100 text-green-600 dark:bg-green-900/20')}>{b.status}</span></td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  </div>
                </div>)
              })()}
              {/* 비고 */}
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 space-y-3">
                <SectionHeader icon="📝" title="비고" color="#8b5cf6" />
                <textarea value={editVendor.memo} onChange={e=>upd('memo',e.target.value)} placeholder="기타 참고 사항" rows={3} className={`${ic} resize-none`} />
              </div>

            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-[var(--border-default)] bg-[var(--bg-surface)] rounded-b-2xl shrink-0">
              <button onClick={()=>setModalOpen(false)} className="px-6 py-2.5 rounded-xl border border-[var(--border-default)] text-sm font-semibold text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--bg-muted)] transition-colors">취소</button>
              <button onClick={saveVendor} className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f6ef7] text-white text-sm font-bold cursor-pointer shadow-md hover:shadow-lg transition-shadow flex items-center gap-1.5"><Save size={14} /> 저장</button>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  )
}
