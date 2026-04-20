import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { getItem, setItem } from '../../utils/storage'
import { formatNumber } from '../../utils/format'
import {
  Building2, User, Phone, Mail, IdCard, Lock, Upload, X, Save, Search, Plus,
  FileText, Clock, CreditCard, Server, Database, Hash, Percent, Calculator, ScrollText, Puzzle,
  Edit3, Trash2, MoreVertical, Eye, ChevronDown,
} from 'lucide-react'

/* ─── 타입 ─── */
interface HqVendor {
  id: number
  companyName: string
  zipCode: string; address1: string; address2: string
  ceoName: string; ceoPhone: string
  bizNo: string; bizPhone: string
  bizType: string; bizCategory: string
  taxEmail: string; companyPhoto: string
  managerName: string; managerTitle: string
  managerPhone: string; managerEmail: string
  managerId: string; managerPw: string; managerPhoto: string
  solutions: { name: string; enabled: boolean; qty?: number }[]
  monthlyFee: number; vendorCode: string; serverFee: number
  dbFee: number; dbUsage: string; dbUnitPrice: number
  usageCount: number; usageCountLabel: string; usageUnitPrice: number
  salesRate: number; periodSales: number
  bizCertPhoto: string
  history: { date: string; desc: string }[]
  billingList: BillingItem[]
}

interface BillingItem {
  period: string; monthlyFee: number; dbFee: number
  dataFee: number; commission: number; total: number; status: string
}

/* ─── 기본값 ─── */
const SOLUTIONS_DEFAULT = [
  { name: '워크엠', enabled: true },
  { name: '홈페이지', enabled: true, qty: 1 },
  { name: '원단공급사', enabled: true },
  { name: '제조공급사', enabled: false },
  { name: '유통관리사', enabled: false },
  { name: '가맹대리점', enabled: false },
  { name: '식재대리점', enabled: false },
]

const BILLING_DEFAULT: BillingItem[] = [
  { period: '2026.01.01-2026.01.31', monthlyFee: 200000, dbFee: 250000, dataFee: 48200, commission: 500000, total: 998200, status: '납부' },
  { period: '2026.02.01-2026.02.28', monthlyFee: 200000, dbFee: 280000, dataFee: 52100, commission: 520000, total: 1052100, status: '납부' },
  { period: '2026.03.01-2026.03.31', monthlyFee: 200000, dbFee: 250000, dataFee: 49800, commission: 480000, total: 979800, status: '청구' },
]

function newVendor(id: number): HqVendor {
  return {
    id,
    companyName: '', zipCode: '', address1: '', address2: '',
    ceoName: '', ceoPhone: '', bizNo: '', bizPhone: '',
    bizType: '', bizCategory: '', taxEmail: '', companyPhoto: '',
    managerName: '', managerTitle: '', managerPhone: '', managerEmail: '',
    managerId: '', managerPw: '', managerPhoto: '',
    solutions: SOLUTIONS_DEFAULT.map(s => ({ ...s })),
    monthlyFee: 200000, vendorCode: '', serverFee: 0,
    dbFee: 25000, dbUsage: '25,000MB', dbUnitPrice: 1000,
    usageCount: 5400, usageCountLabel: '523,221건', usageUnitPrice: 10,
    salesRate: 5, periodSales: 12350000, bizCertPhoto: '',
    history: [], billingList: BILLING_DEFAULT.map(b => ({ ...b })),
  }
}

/* ─── 샘플 데이터 ─── */
const SAMPLE_VENDORS: HqVendor[] = [
  { ...newVendor(1), companyName: '(주)한국솔루션', ceoName: '김대표', ceoPhone: '02-1234-5678', bizNo: '123-45-67890', managerName: '이지훈', managerPhone: '010-1111-2222', managerEmail: 'lee@ksol.co.kr' },
  { ...newVendor(2), companyName: '대명테크(주)', ceoName: '박사장', ceoPhone: '02-9876-5432', bizNo: '234-56-78901', managerName: '최수민', managerPhone: '010-3333-4444', managerEmail: 'choi@dmtech.co.kr', monthlyFee: 150000, salesRate: 7, periodSales: 8500000, solutions: SOLUTIONS_DEFAULT.map((s, i) => i < 2 ? { ...s, enabled: true } : { ...s, enabled: false }) },
  { ...newVendor(3), companyName: '서울유통(주)', ceoName: '정회장', ceoPhone: '02-5555-6666', bizNo: '345-67-89012', managerName: '강미영', managerPhone: '010-5555-6666', managerEmail: 'kang@seouldt.co.kr', monthlyFee: 300000, salesRate: 3, periodSales: 25000000, solutions: SOLUTIONS_DEFAULT.map((s, i) => i === 0 || i === 4 || i === 5 ? { ...s, enabled: true } : { ...s, enabled: false }) },
]

const STORAGE_KEY = 'acct_hq_vendors'

const inputCls = 'w-full h-9 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[12px] text-[var(--text-primary)] outline-none focus:border-primary-500 transition-colors'
const labelCls = 'text-[10px] font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1'

function fmtUnit(val: string | number, unit: string): string {
  const num = typeof val === 'number' ? val : parseInt(String(val).replace(/[^\d]/g, '')) || 0
  return num === 0 ? '' : `${formatNumber(num)} ${unit}`
}
function stripUnit(val: string): number {
  return parseInt(val.replace(/[^\d]/g, '')) || 0
}
function toFile(files: FileList | null, cb: (url: string) => void) {
  if (!files?.[0]) return
  const reader = new FileReader()
  reader.onload = () => cb(reader.result as string)
  reader.readAsDataURL(files[0])
}
function calcTotal(v: HqVendor) {
  const db = Math.round((stripUnit(v.dbUsage || '0') / 100) * v.dbUnitPrice)
  const data = Math.round((stripUnit(v.usageCountLabel || '0') / 10) * v.usageUnitPrice)
  const comm = Math.round(v.periodSales * (v.salesRate / 100))
  return { db, data, comm, total: v.monthlyFee + db + data + comm }
}

/* ═══════════════════════════════════════════════════════════════ */
export function AcctHqVendor() {
  const [vendors, setVendors] = useState<HqVendor[]>(() => getItem(STORAGE_KEY, SAMPLE_VENDORS))
  const [search, setSearch] = useState('')
  const [editVendor, setEditVendor] = useState<HqVendor | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [menuOpen, setMenuOpen] = useState<number | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const saveAll = (list: HqVendor[]) => { setVendors(list); setItem(STORAGE_KEY, list) }

  const filtered = vendors.filter(v =>
    !search || v.companyName.includes(search) || v.ceoName.includes(search) || v.bizNo.includes(search) || v.managerName.includes(search)
  )

  const openAdd = () => { setEditVendor(newVendor(Date.now())); setShowDetail(true) }
  const openEdit = (v: HqVendor) => { setEditVendor({ ...v, solutions: v.solutions?.map(s => ({ ...s })) || SOLUTIONS_DEFAULT.map(s => ({ ...s })) }); setShowDetail(true); setMenuOpen(null) }
  const deleteVendor = (id: number) => { if (confirm('삭제하시겠습니까?')) saveAll(vendors.filter(v => v.id !== id)); setMenuOpen(null) }

  const saveVendor = (v: HqVendor) => {
    const exists = vendors.find(x => x.id === v.id)
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    v.history = [...(v.history || []), { date: now, desc: exists ? '정보 수정' : '거래처 등록' }]
    const next = exists ? vendors.map(x => x.id === v.id ? v : x) : [...vendors, v]
    saveAll(next)
    setShowDetail(false)
    setEditVendor(null)
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* ── 검색 + 추가 버튼 ── */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="거래처명, 대표자, 사업자번호, 담당자 검색..."
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-[12px] text-[var(--text-primary)] outline-none focus:border-primary-500 transition-colors"
          />
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f6ef7] text-white text-[12px] font-bold cursor-pointer shadow-lg hover:shadow-xl transition-all shrink-0">
          <Plus size={14} /> 거래처 추가
        </button>
      </div>

      {/* ── 거래처 리스트 테이블 ── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-[var(--bg-muted)] border-b border-[var(--border-default)]">
                {['No', '거래처명', '대표자', '연락처', '사용솔루션', '사용료 청구액', '미수금', '관리'].map((h, i) => (
                  <th key={i} className={`py-3 px-3 text-[10px] font-bold text-[var(--text-muted)] ${i <= 3 ? 'text-left' : i === 7 ? 'text-center' : 'text-right'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-[12px] text-[var(--text-muted)]">
                  <Building2 size={32} className="mx-auto mb-2 opacity-30" />
                  등록된 거래처가 없습니다
                </td></tr>
              ) : filtered.map((v, idx) => {
                const { total } = calcTotal(v)
                const activeSols = (v.solutions || []).filter(s => s.enabled).map(s => s.name)
                const unpaid = (v.billingList || []).filter(b => b.status === '청구' || b.status === '미납').reduce((s, b) => s + b.total, 0)
                return (
                  <React.Fragment key={v.id}>
                  <tr className="border-t border-[var(--border-default)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer" onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}>
                    <td className="py-3 px-3 text-[11px] text-[var(--text-muted)] tabular-nums">
                      <ChevronDown size={12} className={`inline transition-transform ${expandedId === v.id ? 'rotate-180' : ''}`} />
                      {' '}{idx + 1}
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-[12px] font-bold text-[var(--text-primary)]">{v.companyName || '(미입력)'}</div>
                      <div className="text-[9px] text-[var(--text-muted)]">{v.bizNo || '-'}</div>
                    </td>
                    <td className="py-3 px-3 text-[11px] text-[var(--text-secondary)]">{v.ceoName || '-'}</td>
                    <td className="py-3 px-3">
                      <div className="text-[10px] text-[var(--text-secondary)]">{v.ceoPhone || '-'}</div>
                      <div className="text-[9px] text-[var(--text-muted)]">{v.managerName ? `담당: ${v.managerName}` : ''}</div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex flex-wrap gap-1 justify-end">
                        {activeSols.length === 0 ? <span className="text-[9px] text-[var(--text-muted)]">-</span> : activeSols.map((s, i) => (
                          <span key={i} className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400">{s}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-[11px] font-bold text-[var(--text-primary)] text-right tabular-nums">{formatNumber(total)}원</td>
                    <td className="py-3 px-3 text-right tabular-nums">
                      {unpaid > 0 ? (
                        <span className="text-[11px] font-bold text-red-500">{formatNumber(unpaid)}원</span>
                      ) : (
                        <span className="text-[11px] text-emerald-500 font-bold">없음</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center relative" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setMenuOpen(menuOpen === v.id ? null : v.id)} className="p-1.5 rounded-lg hover:bg-[var(--bg-muted)] cursor-pointer transition-colors">
                        <MoreVertical size={14} className="text-[var(--text-muted)]" />
                      </button>
                      {menuOpen === v.id && (
                        <div className="absolute right-3 top-full z-50 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-xl py-1 min-w-[100px] animate-scaleIn">
                          <button onClick={() => openEdit(v)} className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] cursor-pointer transition-colors">
                            <Edit3 size={12} /> 수정
                          </button>
                          <button onClick={() => deleteVendor(v.id)} className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 cursor-pointer transition-colors">
                            <Trash2 size={12} /> 삭제
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                  {expandedId === v.id && (() => {
                    const { db, data: df, comm } = calcTotal(v)
                    const curBilling: BillingItem = { period: `${new Date().getFullYear()}.${String(new Date().getMonth()+1).padStart(2,'0')}.01~`, monthlyFee: v.monthlyFee, dbFee: db, dataFee: df, commission: comm, total: v.monthlyFee + db + df + comm, status: '과금중' }
                    const all = [...(v.billingList || []), curBilling]
                    return (
                      <tr>
                        <td colSpan={8} className="p-0">
                          <div className="bg-[var(--bg-muted)]/50 px-6 py-3 border-t border-[var(--border-default)]">
                            <div className="flex items-center gap-2 mb-2">
                              <ScrollText size={12} className="text-primary-500" />
                              <span className="text-[10px] font-bold text-[var(--text-primary)]">청구 리스트</span>
                              <span className="text-[8px] text-[var(--text-muted)] ml-auto">{all.length}건</span>
                            </div>
                            <table className="w-full">
                              <thead>
                                <tr>
                                  {['과금기간','월관리비','DB사용료','Data사용건수','수수료','총금액','상태'].map((h,i) => (
                                    <th key={i} className={`py-1.5 px-2 text-[9px] font-bold text-[var(--text-muted)] ${i===6?'text-center':i===0?'text-left':'text-right'}`}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {[...all].reverse().map((b,i) => {
                                  const sc = b.status==='납부'?'#22c55e':b.status==='청구'?'#4f6ef7':b.status==='미납'?'#ef4444':b.status==='과금중'?'#f59e0b':'#9ca3af'
                                  return (
                                    <tr key={i} className="border-t border-[var(--border-default)]/50">
                                      <td className="py-1.5 px-2 text-[10px] font-semibold text-[var(--text-primary)]">{b.period}</td>
                                      <td className="py-1.5 px-2 text-[10px] text-[var(--text-secondary)] text-right tabular-nums">{formatNumber(b.monthlyFee)}원</td>
                                      <td className="py-1.5 px-2 text-[10px] text-[var(--text-secondary)] text-right tabular-nums">{formatNumber(b.dbFee)}원</td>
                                      <td className="py-1.5 px-2 text-[10px] text-[var(--text-secondary)] text-right tabular-nums">{formatNumber(b.dataFee)}원</td>
                                      <td className="py-1.5 px-2 text-[10px] text-[var(--text-secondary)] text-right tabular-nums">{formatNumber(b.commission)}원</td>
                                      <td className="py-1.5 px-2 text-[10px] font-bold text-[var(--text-primary)] text-right tabular-nums">{formatNumber(b.total)}원</td>
                                      <td className="py-1.5 px-2 text-center">
                                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: sc+'1a', color: sc }}>{b.status}</span>
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )
                  })()}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 border-t border-[var(--border-default)] bg-[var(--bg-muted)] flex items-center justify-between">
          <span className="text-[10px] text-[var(--text-muted)]">총 {filtered.length}건</span>
          <span className="text-[10px] font-bold text-[var(--text-muted)]">
            총 청구액: <span className="text-primary-600 dark:text-primary-400">{formatNumber(filtered.reduce((s, v) => s + calcTotal(v).total, 0))}원</span>
          </span>
        </div>
      </div>

      {/* ═══ 거래처 상세 모달 ═══ */}
      {showDetail && editVendor && createPortal(
        <VendorDetailModal
          vendor={editVendor}
          onSave={saveVendor}
          onClose={() => { setShowDetail(false); setEditVendor(null) }}
        />,
        document.body,
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════ */
/* 거래처 상세 모달 */
/* ═══════════════════════════════════════════════════════════════ */
function VendorDetailModal({ vendor, onSave, onClose }: { vendor: HqVendor; onSave: (v: HqVendor) => void; onClose: () => void }) {
  const [data, setData] = useState<HqVendor>(vendor)
  const [priceModal, setPriceModal] = useState(false)
  const [priceForm, setPriceForm] = useState({
    monthlyFee: '0', dbUnitPrice: '0', dbUsage: '', usageUnitPrice: '0', usageCount: '', salesRate: '0', periodSales: '0',
  })

  const upd = (patch: Partial<HqVendor>) => setData(prev => ({ ...prev, ...patch }))

  const openPriceModal = () => {
    setPriceForm({
      monthlyFee: formatNumber(data.monthlyFee),
      dbUnitPrice: formatNumber(data.dbUnitPrice),
      dbUsage: fmtUnit(stripUnit(data.dbUsage || '0'), 'MB'),
      usageUnitPrice: formatNumber(data.usageUnitPrice),
      usageCount: fmtUnit(stripUnit(data.usageCountLabel || '0'), '건'),
      salesRate: String(data.salesRate),
      periodSales: fmtUnit(data.periodSales, '원'),
    })
    setPriceModal(true)
  }

  const savePriceModal = () => {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    const patch = {
      monthlyFee: parseInt(priceForm.monthlyFee.replace(/,/g, '')) || 0,
      dbUnitPrice: parseInt(priceForm.dbUnitPrice.replace(/,/g, '')) || 0,
      dbUsage: `${formatNumber(stripUnit(priceForm.dbUsage))}MB`,
      usageUnitPrice: parseInt(priceForm.usageUnitPrice.replace(/,/g, '')) || 0,
      usageCountLabel: `${formatNumber(stripUnit(priceForm.usageCount))}건`,
      salesRate: parseFloat(priceForm.salesRate) || 0,
      periodSales: stripUnit(priceForm.periodSales),
      history: [...(data.history || []), { date: now, desc: '단가 수정' }],
    }
    setData(prev => ({ ...prev, ...patch }))
    setPriceModal(false)
  }

  const { db: calcDbFee, data: calcDataFee, comm: salesAmount, total: grandTotal } = calcTotal(data)

  const now2 = new Date()
  const curY = now2.getFullYear()
  const curM = String(now2.getMonth() + 1).padStart(2, '0')
  const curD = String(now2.getDate()).padStart(2, '0')
  const currentBilling: BillingItem = {
    period: `${curY}.${curM}.01~`,
    monthlyFee: data.monthlyFee, dbFee: calcDbFee, dataFee: calcDataFee,
    commission: salesAmount, total: grandTotal, status: '과금중',
  }
  const fullBillingList = [...(data.billingList || []), currentBilling]

  return (
    <div className="fixed inset-0 z-[9998] flex items-start justify-center bg-[var(--bg-default)] overflow-y-auto py-8">
      <div className="bg-[var(--bg-default)] rounded-2xl shadow-2xl w-full max-w-5xl mx-4 animate-scaleIn">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)] bg-[var(--bg-surface)] rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-primary-500" />
            <span className="text-base font-extrabold text-[var(--text-primary)]">{data.companyName || '신규 거래처'}</span>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer"><X size={20} /></button>
        </div>

        {/* 모달 바디 */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 좌측 메인 */}
            <div className="flex-1 space-y-4 min-w-0">

              {/* 기본정보 */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-default)]">
                  <Building2 size={14} className="text-primary-500" />
                  <span className="text-[12px] font-extrabold text-[var(--text-primary)]">기본 정보</span>
                </div>
                <div className="p-4 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className={labelCls}><Building2 size={9}/> 거래처명</label><input value={data.companyName} onChange={e => upd({ companyName: e.target.value })} placeholder="(주)거래처명" className={inputCls} /></div>
                    <div><label className={labelCls}><User size={9}/> 대표자</label><input value={data.ceoName} onChange={e => upd({ ceoName: e.target.value })} placeholder="대표자 이름" className={inputCls} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className={labelCls}><Phone size={9}/> 대표전화</label><input value={data.ceoPhone} onChange={e => upd({ ceoPhone: e.target.value })} placeholder="02-0000-0000" className={inputCls} /></div>
                    <div><label className={labelCls}><IdCard size={9}/> 사업자번호</label><input value={data.bizNo} onChange={e => upd({ bizNo: e.target.value })} placeholder="000-00-00000" className={inputCls} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className={labelCls}>업태</label><input value={data.bizType} onChange={e => upd({ bizType: e.target.value })} placeholder="서비스" className={inputCls} /></div>
                    <div><label className={labelCls}>종목</label><input value={data.bizCategory} onChange={e => upd({ bizCategory: e.target.value })} placeholder="소프트웨어" className={inputCls} /></div>
                  </div>
                  <div><label className={labelCls}><Mail size={9}/> 세금계산서 이메일</label><input value={data.taxEmail} onChange={e => upd({ taxEmail: e.target.value })} placeholder="tax@company.com" className={inputCls} /></div>
                </div>
              </div>

              {/* 담당자 정보 */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-default)]">
                  <User size={14} className="text-blue-500" />
                  <span className="text-[12px] font-extrabold text-[var(--text-primary)]">담당자 정보</span>
                </div>
                <div className="p-4 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className={labelCls}><User size={9}/> 담당자 이름</label><input value={data.managerName} onChange={e => upd({ managerName: e.target.value })} placeholder="담당자 이름" className={inputCls} /></div>
                    <div><label className={labelCls}>직함</label><input value={data.managerTitle} onChange={e => upd({ managerTitle: e.target.value })} placeholder="예) 팀장/사장" className={inputCls} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className={labelCls}><Phone size={9}/> 휴대폰</label><input value={data.managerPhone} onChange={e => upd({ managerPhone: e.target.value })} placeholder="010-0000-0000" className={inputCls} /></div>
                    <div><label className={labelCls}><Mail size={9}/> 이메일</label><input value={data.managerEmail} onChange={e => upd({ managerEmail: e.target.value })} placeholder="email@example.com" className={inputCls} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className={labelCls}><IdCard size={9}/> 아이디(ID)</label><input value={data.managerId} onChange={e => upd({ managerId: e.target.value })} placeholder="system_id" className={inputCls} /></div>
                    <div><label className={labelCls}><Lock size={9}/> 비밀번호</label><input value={data.managerPw} onChange={e => upd({ managerPw: e.target.value })} placeholder="•••" type="password" className={inputCls} /></div>
                  </div>
                </div>
              </div>

              {/* 사용솔루션 */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-default)]">
                  <Puzzle size={14} className="text-violet-500" />
                  <span className="text-[12px] font-extrabold text-[var(--text-primary)]">사용 솔루션</span>
                  <span className="text-[9px] text-[var(--text-muted)] ml-auto">{(data.solutions || []).filter(s => s.enabled).length}개 사용중</span>
                </div>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {(data.solutions || []).map((sol, idx) => (
                    <div key={idx} className={`rounded-xl p-3 border transition-all ${sol.enabled ? 'bg-primary-50/50 dark:bg-primary-900/10 border-primary-300 dark:border-primary-700' : 'bg-[var(--bg-muted)] border-[var(--border-default)] opacity-60'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[11px] font-bold ${sol.enabled ? 'text-primary-700 dark:text-primary-300' : 'text-[var(--text-muted)]'}`}>{sol.name}</span>
                        <button onClick={() => { const next = [...data.solutions]; next[idx] = { ...next[idx], enabled: !next[idx].enabled }; upd({ solutions: next }) }}
                          className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${sol.enabled ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${sol.enabled ? 'left-[18px]' : 'left-0.5'}`} />
                        </button>
                      </div>
                      {sol.name === '홈페이지' && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-[9px] text-[var(--text-muted)]">수량:</span>
                          <input value={sol.qty ?? 1} onChange={e => { const next = [...data.solutions]; next[idx] = { ...next[idx], qty: parseInt(e.target.value) || 0 }; upd({ solutions: next }) }}
                            className="w-12 h-5 px-1 rounded border border-[var(--border-default)] bg-[var(--bg-surface)] text-[10px] text-center text-[var(--text-primary)] outline-none" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 결제 정보 */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
                  <div className="flex items-center gap-2">
                    <CreditCard size={14} className="text-emerald-500" />
                    <span className="text-[12px] font-extrabold text-[var(--text-primary)]">결제 정보</span>
                    <span className="text-[9px] font-bold text-[var(--text-muted)] ml-1">사용솔루션 :</span>
                    <span className="text-[9px] font-bold text-primary-600 dark:text-primary-400">{(data.solutions || []).filter(s => s.enabled).map(s => s.name).join(', ') || '없음'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <Clock size={10} className="text-[var(--text-muted)]" />
                      <span className="font-bold text-[var(--text-muted)]">과금일자 :</span>
                      <span className="font-extrabold text-[var(--text-primary)]">{curY}.{curM}.01 - {curY}.{curM}.{curD}</span>
                    </div>
                    <div className="h-4 w-px bg-[var(--border-default)]" />
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <Calculator size={10} className="text-primary-500" />
                      <span className="font-bold text-[var(--text-muted)]">총금액 :</span>
                      <span className="font-extrabold text-primary-600 dark:text-primary-400">{formatNumber(grandTotal)}원</span>
                    </div>
                    <button onClick={openPriceModal} className="px-3 py-1.5 rounded-lg bg-[var(--bg-muted)] border border-[var(--border-default)] text-[10px] font-bold text-[var(--text-secondary)] cursor-pointer hover:border-primary-400 transition-colors flex items-center gap-1">
                      <Save size={10} /> 단가수정
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-[var(--bg-muted)] rounded-xl p-3 border border-[var(--border-default)]">
                      <div className="flex items-center gap-1 text-[9px] font-bold text-[var(--text-muted)] mb-1"><Server size={9}/> 월관리비(서버)</div>
                      <div className="text-[15px] font-extrabold text-[var(--text-primary)]">{formatNumber(data.monthlyFee)}원</div>
                      <div className="text-[9px] text-[var(--text-muted)] mt-0.5">기본금액</div>
                    </div>
                    <div className="bg-[var(--bg-muted)] rounded-xl p-3 border border-[var(--border-default)]">
                      <div className="flex items-center gap-1 text-[9px] font-bold text-[var(--text-muted)] mb-1"><Database size={9}/> DB사용료(단가:100M당 {formatNumber(data.dbUnitPrice)}원)</div>
                      <div className="text-[15px] font-extrabold text-[var(--text-primary)]">{formatNumber(calcDbFee)}원</div>
                      <div className="text-[9px] text-[var(--text-muted)] mt-0.5">{data.dbUsage || '0MB'}</div>
                    </div>
                    <div className="bg-[var(--bg-muted)] rounded-xl p-3 border border-[var(--border-default)]">
                      <div className="flex items-center gap-1 text-[9px] font-bold text-[var(--text-muted)] mb-1"><Hash size={9}/> 자료단가(10건당 1원)</div>
                      <div className="text-[15px] font-extrabold text-[var(--text-primary)]">{formatNumber(calcDataFee)}원</div>
                      <div className="text-[9px] text-[var(--text-muted)] mt-0.5">{data.usageCountLabel || '0건'}</div>
                    </div>
                    <div className="bg-[var(--bg-muted)] rounded-xl p-3 border border-[var(--border-default)]">
                      <div className="flex items-center gap-1 text-[9px] font-bold text-amber-600 dark:text-amber-400 mb-1"><Percent size={9}/> 수수료({data.salesRate}%)</div>
                      <div className="text-[15px] font-extrabold text-amber-600 dark:text-amber-400">{formatNumber(salesAmount)}원</div>
                      <div className="text-[9px] text-[var(--text-muted)] mt-0.5">기간매출:{formatNumber(data.periodSales)}원</div>
                    </div>
                  </div>

                  {/* 청구리스트 */}
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ScrollText size={14} className="text-primary-500" />
                      <span className="text-[12px] font-extrabold text-[var(--text-primary)]">청구 리스트</span>
                      <span className="text-[9px] text-[var(--text-muted)] ml-auto">{fullBillingList.length}건</span>
                    </div>
                    <div className="overflow-x-auto rounded-lg border border-[var(--border-default)]">
                      <table className="w-full min-w-[700px]">
                        <thead>
                          <tr className="bg-[var(--bg-muted)]">
                            {['과금기간', '월관리비(서버)', 'DB사용료', 'Data사용건수', '수수료', '총금액', '상태'].map((h, i) => (
                              <th key={i} className={`py-2.5 px-3 text-[10px] font-bold text-[var(--text-muted)] ${i === 6 ? 'text-center' : i === 0 ? 'text-left' : 'text-right'}`}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[...fullBillingList].reverse().map((b, i) => {
                            const ss = b.status === '납부' ? { bg: 'rgba(34,197,94,.1)', color: '#22c55e' }
                              : b.status === '청구' ? { bg: 'rgba(79,110,247,.1)', color: '#4f6ef7' }
                              : b.status === '미납' ? { bg: 'rgba(239,68,68,.1)', color: '#ef4444' }
                              : b.status === '과금중' ? { bg: 'rgba(245,158,11,.15)', color: '#f59e0b' }
                              : { bg: 'rgba(156,163,175,.1)', color: '#9ca3af' }
                            return (
                              <tr key={i} className="border-t border-[var(--border-default)] hover:bg-[var(--bg-muted)] transition-colors">
                                <td className="py-2.5 px-3 text-[11px] font-semibold text-[var(--text-primary)]">{b.period}</td>
                                <td className="py-2.5 px-3 text-[11px] text-[var(--text-secondary)] text-right tabular-nums">{formatNumber(b.monthlyFee)}원</td>
                                <td className="py-2.5 px-3 text-[11px] text-[var(--text-secondary)] text-right tabular-nums">{formatNumber(b.dbFee)}원</td>
                                <td className="py-2.5 px-3 text-[11px] text-[var(--text-secondary)] text-right tabular-nums">{formatNumber(b.dataFee)}원</td>
                                <td className="py-2.5 px-3 text-[11px] text-[var(--text-secondary)] text-right tabular-nums">{formatNumber(b.commission)}원</td>
                                <td className="py-2.5 px-3 text-[11px] font-extrabold text-[var(--text-primary)] text-right tabular-nums">{formatNumber(b.total)}원</td>
                                <td className="py-2.5 px-3 text-center align-middle">
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full inline-block" style={{ background: ss.bg, color: ss.color }}>{b.status}</span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 우측 사이드바 */}
            <div className="w-full lg:w-56 space-y-4 shrink-0">
              {/* 사업자등록증 */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-default)]">
                  <FileText size={14} className="text-violet-500" />
                  <span className="text-[12px] font-extrabold text-[var(--text-primary)]">사업자등록증</span>
                </div>
                <div className="p-3 flex flex-col items-center gap-2">
                  <div className="w-full aspect-[3/4] rounded-xl border-2 border-dashed border-[var(--border-default)] bg-[var(--bg-muted)] flex items-center justify-center overflow-hidden">
                    {data.bizCertPhoto ? <img src={data.bizCertPhoto} alt="" className="w-full h-full object-contain" /> : (
                      <div className="text-center"><FileText size={28} className="text-[var(--text-muted)] mx-auto mb-1" /><div className="text-[9px] text-[var(--text-muted)]">등록된 사업자등록증이 없습니다</div></div>
                    )}
                  </div>
                  <label className="w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border border-dashed border-[var(--border-default)] bg-[var(--bg-muted)] text-[10px] font-bold text-[var(--text-secondary)] cursor-pointer hover:border-primary-400 transition-colors">
                    <Upload size={10}/> 업로드
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => toFile(e.target.files, url => upd({ bizCertPhoto: url }))} />
                  </label>
                </div>
              </div>

              {/* 수정 이력 */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-default)]">
                  <Clock size={14} className="text-amber-500" />
                  <span className="text-[12px] font-extrabold text-[var(--text-primary)]">수정 이력</span>
                </div>
                <div className="p-3 max-h-40 overflow-y-auto">
                  {(!data.history || data.history.length === 0) ? (
                    <div className="text-center text-[10px] text-[var(--text-muted)] py-3">수정이력이 없습니다.</div>
                  ) : (
                    <div className="space-y-1">
                      {[...data.history].reverse().slice(0, 15).map((h, i) => (
                        <div key={i} className="flex items-center gap-2 text-[9px] py-1 px-2 rounded-lg hover:bg-[var(--bg-muted)] transition-colors">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0" />
                          <span className="text-[var(--text-muted)] tabular-nums shrink-0">{h.date}</span>
                          <span className="text-[var(--text-secondary)] font-semibold truncate">{h.desc}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 모달 푸터 */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-[var(--border-default)] bg-[var(--bg-surface)] rounded-b-2xl">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl border border-[var(--border-default)] text-[12px] font-semibold text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--bg-muted)] transition-colors">취소</button>
          <button onClick={() => onSave(data)} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f6ef7] text-white text-[12px] font-bold cursor-pointer shadow-lg hover:shadow-xl transition-all">
            <Save size={14} /> 저장
          </button>
        </div>
      </div>

      {/* 단가수정 모달 */}
      {priceModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={e => { if (e.target === e.currentTarget) setPriceModal(false) }}>
          <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-scaleIn">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-default)]">
              <div className="flex items-center gap-2"><Calculator size={16} className="text-primary-500" /><span className="text-sm font-extrabold text-[var(--text-primary)]">단가 수정</span></div>
              <button onClick={() => setPriceModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className={labelCls}><Server size={9} /> 기본금액 (월관리비)</label>
                <input value={priceForm.monthlyFee} onChange={e => { const r = e.target.value.replace(/,/g, ''); if (/^\d*$/.test(r)) setPriceForm(p => ({ ...p, monthlyFee: formatNumber(parseInt(r) || 0) })) }} className={inputCls} placeholder="50,000" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}><Database size={9} /> DB 단가 (100MB당)</label><input value={priceForm.dbUnitPrice} onChange={e => { const r = e.target.value.replace(/,/g, ''); if (/^\d*$/.test(r)) setPriceForm(p => ({ ...p, dbUnitPrice: formatNumber(parseInt(r) || 0) })) }} className={inputCls} placeholder="1,000" /></div>
                <div><label className={labelCls}>사용량</label><input value={priceForm.dbUsage} onChange={e => { const n = stripUnit(e.target.value); setPriceForm(p => ({ ...p, dbUsage: n === 0 ? '' : fmtUnit(n, 'MB') })) }} className={inputCls} placeholder="25,000 MB" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}><Hash size={9} /> 자료 단가 (10건당)</label><input value={priceForm.usageUnitPrice} onChange={e => { const r = e.target.value.replace(/,/g, ''); if (/^\d*$/.test(r)) setPriceForm(p => ({ ...p, usageUnitPrice: formatNumber(parseInt(r) || 0) })) }} className={inputCls} placeholder="1" /></div>
                <div><label className={labelCls}>사용건수</label><input value={priceForm.usageCount} onChange={e => { const n = stripUnit(e.target.value); setPriceForm(p => ({ ...p, usageCount: n === 0 ? '' : fmtUnit(n, '건') })) }} className={inputCls} placeholder="135,321 건" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}><Percent size={9} /> 수수료 (%)</label><input value={priceForm.salesRate} onChange={e => { const v = e.target.value; if (/^\d*\.?\d*$/.test(v)) setPriceForm(p => ({ ...p, salesRate: v })) }} className={inputCls} placeholder="7" /></div>
                <div><label className={labelCls}>매출</label><input value={priceForm.periodSales} onChange={e => { const n = stripUnit(e.target.value); setPriceForm(p => ({ ...p, periodSales: n === 0 ? '' : fmtUnit(n, '원') })) }} className={inputCls} placeholder="12,350,000 원" /></div>
              </div>
            </div>
            <div className="flex gap-2 px-5 py-3.5 border-t border-[var(--border-default)]">
              <button onClick={() => setPriceModal(false)} className="flex-1 py-2.5 rounded-xl border border-[var(--border-default)] text-sm font-semibold text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--bg-muted)] transition-colors">취소</button>
              <button onClick={savePriceModal} className="flex-[2] py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f6ef7] text-white text-sm font-bold cursor-pointer shadow-md hover:shadow-lg transition-all">등록</button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
