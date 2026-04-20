import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { getItem, setItem } from '../../utils/storage'
import { formatNumber } from '../../utils/format'
import {
  Building2, User, Phone, Mail, IdCard, Lock, Upload, X, Save,
  FileText, Clock, CreditCard, Server, Database, Hash, Percent, Calculator, Image, ScrollText,
} from 'lucide-react'

/* ─── 타입 ─── */
interface HqVendor {
  /* 기본정보 */
  companyName: string
  zipCode: string
  address1: string
  address2: string
  ceoName: string
  ceoPhone: string
  bizNo: string
  bizPhone: string
  bizType: string
  bizCategory: string
  taxEmail: string
  companyPhoto: string
  /* 담당자 정보 */
  managerName: string
  managerTitle: string
  managerPhone: string
  managerEmail: string
  managerId: string
  managerPw: string
  managerPhoto: string
  /* 솔루션 사용료 */
  monthlyFee: number
  vendorCode: string
  serverFee: number
  dbFee: number
  dbUsage: string
  dbUnitPrice: number
  usageCount: number
  usageCountLabel: string
  usageUnitPrice: number
  salesRate: number
  periodSales: number
  /* 사업자등록증 */
  bizCertPhoto: string
  /* 수정이력 */
  history: { date: string; desc: string }[]
  /* 청구리스트 */
  billingList: BillingItem[]
}

interface BillingItem {
  period: string
  monthlyFee: number
  dbFee: number
  dataFee: number
  commission: number
  total: number
  status: '청구' | '납부' | '미납' | '대기'
}

const EMPTY: HqVendor = {
  companyName: '', zipCode: '', address1: '', address2: '',
  ceoName: '', ceoPhone: '', bizNo: '', bizPhone: '',
  bizType: '', bizCategory: '', taxEmail: '', companyPhoto: '',
  managerName: '', managerTitle: '', managerPhone: '', managerEmail: '',
  managerId: '', managerPw: '', managerPhoto: '',
  monthlyFee: 200000, vendorCode: '', serverFee: 0,
  dbFee: 25000, dbUsage: '2,500MB', dbUnitPrice: 1000,
  usageCount: 5400, usageCountLabel: '540,000건', usageUnitPrice: 10,
  salesRate: 5, periodSales: 10000000, bizCertPhoto: '',
  history: [],
  billingList: [
    { period: '2026.01.11~2026.02.10', monthlyFee: 200000, dbFee: 25000, dataFee: 5400, commission: 500000, total: 730400, status: '납부' },
    { period: '2026.02.11~2026.03.10', monthlyFee: 200000, dbFee: 28000, dataFee: 6200, commission: 520000, total: 754200, status: '납부' },
    { period: '2026.03.11~2026.04.10', monthlyFee: 200000, dbFee: 25000, dataFee: 5800, commission: 480000, total: 710800, status: '청구' },
    { period: '2026.04.11~2026.05.10', monthlyFee: 200000, dbFee: 25000, dataFee: 0, commission: 0, total: 225000, status: '대기' },
  ],
}

const STORAGE_KEY = 'acct_hq_vendor'

const inputCls = 'w-full h-9 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[12px] text-[var(--text-primary)] outline-none focus:border-primary-500 transition-colors'
const labelCls = 'text-[10px] font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1'

function toFile(files: FileList | null, cb: (url: string) => void) {
  if (!files?.[0]) return
  const reader = new FileReader()
  reader.onload = () => cb(reader.result as string)
  reader.readAsDataURL(files[0])
}

export function AcctHqVendor() {
  const [data, setData] = useState<HqVendor>(() => getItem<HqVendor>(STORAGE_KEY, EMPTY))
  const [saved, setSaved] = useState(false)

  /* 단가수정 모달 */
  const [priceModal, setPriceModal] = useState(false)
  const [priceForm, setPriceForm] = useState({
    monthlyFee: '0', dbUnitPrice: '0', usageUnitPrice: '0', salesRate: '0',
  })

  const openPriceModal = () => {
    setPriceForm({
      monthlyFee: formatNumber(data.monthlyFee),
      dbUnitPrice: formatNumber(data.dbUnitPrice),
      usageUnitPrice: formatNumber(data.usageUnitPrice),
      salesRate: String(data.salesRate),
    })
    setPriceModal(true)
  }

  const savePriceModal = () => {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    const patch = {
      monthlyFee: parseInt(priceForm.monthlyFee.replace(/,/g, '')) || 0,
      dbUnitPrice: parseInt(priceForm.dbUnitPrice.replace(/,/g, '')) || 0,
      usageUnitPrice: parseInt(priceForm.usageUnitPrice.replace(/,/g, '')) || 0,
      salesRate: parseFloat(priceForm.salesRate) || 0,
      history: [...(data.history || []), { date: now, desc: '단가 수정' }],
    }
    const updated = { ...data, ...patch }
    setItem(STORAGE_KEY, updated)
    setData(updated)
    setPriceModal(false)
  }

  const upd = (patch: Partial<HqVendor>) => {
    setData(prev => ({ ...prev, ...patch }))
    setSaved(false)
  }

  const save = () => {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    const newHistory = [...(data.history || []), { date: now, desc: '정보 수정' }]
    const updated = { ...data, history: newHistory }
    setItem(STORAGE_KEY, updated)
    setData(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  /* 솔루션 사용료 계산 */
  const salesAmount = Math.round(data.periodSales * (data.salesRate / 100))
  const grandTotal = data.monthlyFee + data.dbFee + data.usageCount + salesAmount

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* ═══ 좌측: 메인 콘텐츠 ═══ */}
        <div className="flex-1 space-y-4 min-w-0">

          {/* ── 기본정보 ── */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-primary-500" />
                <span className="text-sm font-extrabold text-[var(--text-primary)]">기본 정보</span>
              </div>
              <span className="text-[9px] text-[var(--text-muted)]">사업자등록증 기반</span>
            </div>
            <div className="p-4 space-y-3">
              {/* 사업자 이름 */}
              <div>
                <label className={labelCls}><Building2 size={9}/> 사업자 이름(법인명)</label>
                <input value={data.companyName} onChange={e => upd({ companyName: e.target.value })} placeholder="법인명 입력" className={inputCls} />
              </div>
              {/* 주소 */}
              <div>
                <label className={labelCls}>📫 주소(우편번호 검색)</label>
                <div className="flex gap-2 mb-1.5">
                  <input value={data.zipCode} onChange={e => upd({ zipCode: e.target.value })} placeholder="우편번호" className={`${inputCls} !w-28`} />
                  <button className="px-3 py-1.5 rounded-lg bg-[var(--bg-muted)] border border-[var(--border-default)] text-[10px] font-bold text-[var(--text-secondary)] cursor-pointer hover:border-primary-400 transition-colors whitespace-nowrap">우편번호 검색</button>
                </div>
                <input value={data.address1} onChange={e => upd({ address1: e.target.value })} placeholder="기본 주소" className={inputCls} />
                <input value={data.address2} onChange={e => upd({ address2: e.target.value })} placeholder="상세 주소 (동, 층/호/실)" className={`${inputCls} mt-1.5`} />
              </div>
              {/* 2열 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}><User size={9}/> 대표자 이름</label>
                  <input value={data.ceoName} onChange={e => upd({ ceoName: e.target.value })} placeholder="대표자 이름" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}><Phone size={9}/> 대표자 전화</label>
                  <input value={data.ceoPhone} onChange={e => upd({ ceoPhone: e.target.value })} placeholder="010-0000-0000" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}><Phone size={9}/> 사업자 전화</label>
                  <input value={data.bizPhone} onChange={e => upd({ bizPhone: e.target.value })} placeholder="사업자 전화" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}><IdCard size={9}/> 사업자 번호</label>
                  <input value={data.bizNo} onChange={e => upd({ bizNo: e.target.value })} placeholder="000-00-00000" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}><FileText size={9}/> 업태</label>
                  <input value={data.bizType} onChange={e => upd({ bizType: e.target.value })} placeholder="업태 입력" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}><FileText size={9}/> 업종</label>
                  <input value={data.bizCategory} onChange={e => upd({ bizCategory: e.target.value })} placeholder="업종 입력" className={inputCls} />
                </div>
              </div>
              {/* 세금계산서 이메일 */}
              <div>
                <label className={labelCls}><Mail size={9}/> 세금계산서 이메일</label>
                <input value={data.taxEmail} onChange={e => upd({ taxEmail: e.target.value })} placeholder="tax@company.com" className={inputCls} />
              </div>
            </div>
          </div>

          {/* ── 담당자 정보 ── */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-default)]">
              <User size={16} className="text-violet-500" />
              <span className="text-sm font-extrabold text-[var(--text-primary)]">담당자 정보</span>
            </div>
            <div className="p-4 flex gap-4">
              {/* 프로필 사진 */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-[var(--border-default)] bg-[var(--bg-muted)] flex items-center justify-center overflow-hidden">
                  {data.managerPhoto ? (
                    <img src={data.managerPhoto} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User size={24} className="text-[var(--text-muted)]" />
                  )}
                </div>
                <div className="flex gap-1">
                  <label className="px-2 py-1 rounded-md bg-[var(--bg-muted)] border border-[var(--border-default)] text-[9px] font-bold text-[var(--text-secondary)] cursor-pointer hover:border-primary-400 transition-colors">
                    <Upload size={8} className="inline mr-0.5" /> 사진
                    <input type="file" accept="image/*" className="hidden" onChange={e => toFile(e.target.files, url => upd({ managerPhoto: url }))} />
                  </label>
                  {data.managerPhoto && (
                    <button onClick={() => upd({ managerPhoto: '' })} className="px-1.5 py-1 rounded-md bg-red-50 border border-red-200 text-[9px] text-red-500 cursor-pointer">
                      <X size={8} />
                    </button>
                  )}
                </div>
              </div>
              {/* 입력 필드 */}
              <div className="flex-1 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}><User size={9}/> 담당자 이름</label>
                    <input value={data.managerName} onChange={e => upd({ managerName: e.target.value })} placeholder="담당자 이름" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}><FileText size={9}/> 직함</label>
                    <input value={data.managerTitle} onChange={e => upd({ managerTitle: e.target.value })} placeholder="예) 팀장/과장" className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}><Phone size={9}/> 휴대폰</label>
                    <input value={data.managerPhone} onChange={e => upd({ managerPhone: e.target.value })} placeholder="010-0000-0000" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}><Mail size={9}/> 이메일</label>
                    <input value={data.managerEmail} onChange={e => upd({ managerEmail: e.target.value })} placeholder="email@example.com" className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}><IdCard size={9}/> 아이디(ID)</label>
                    <input value={data.managerId} onChange={e => upd({ managerId: e.target.value })} placeholder="system_id" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}><Lock size={9}/> 비밀번호</label>
                    <div className="flex gap-1.5">
                      <input value={data.managerPw} onChange={e => upd({ managerPw: e.target.value })} placeholder="•••" type="password" className={inputCls} />
                      <button className="px-2 py-1 rounded-lg border border-[var(--border-default)] text-[10px] font-bold text-[var(--text-muted)] cursor-pointer hover:border-primary-400 shrink-0 bg-[var(--bg-surface)]">•••</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── 솔루션 사용료 ── */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-emerald-500" />
                <span className="text-sm font-extrabold text-[var(--text-primary)]">결제 정보</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-[10px]">
                  <Clock size={10} className="text-[var(--text-muted)]" />
                  <span className="font-bold text-[var(--text-muted)]">과금일자 :</span>
                  <span className="font-extrabold text-[var(--text-primary)]">
                    {new Date(new Date().getFullYear(), new Date().getMonth(), 11).toISOString().slice(0,10).replace(/-/g,'.')}
                    {' - '}
                    {new Date().toISOString().slice(0,10).replace(/-/g,'.')}
                  </span>
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
                {/* 월관리비(서버) */}
                <div className="bg-[var(--bg-muted)] rounded-xl p-3 border border-[var(--border-default)]">
                  <div className="flex items-center gap-1 text-[9px] font-bold text-[var(--text-muted)] mb-1">
                    <Server size={9}/> 월관리비(서버)
                  </div>
                  <div className="text-[15px] font-extrabold text-[var(--text-primary)]">{formatNumber(data.monthlyFee)}원</div>
                  <div className="text-[9px] text-[var(--text-muted)] mt-0.5">기본금액</div>
                </div>
                {/* DB사용료 */}
                <div className="bg-[var(--bg-muted)] rounded-xl p-3 border border-[var(--border-default)]">
                  <div className="flex items-center gap-1 text-[9px] font-bold text-[var(--text-muted)] mb-1">
                    <Database size={9}/> DB사용료(단가:100M당 {formatNumber(data.dbUnitPrice)}원)
                  </div>
                  <div className="text-[15px] font-extrabold text-[var(--text-primary)]">{formatNumber(data.dbFee)}원</div>
                  <div className="text-[9px] text-[var(--text-muted)] mt-0.5">{data.dbUsage || '0MB'}</div>
                </div>
                {/* 사용건수 */}
                <div className="bg-[var(--bg-muted)] rounded-xl p-3 border border-[var(--border-default)]">
                  <div className="flex items-center gap-1 text-[9px] font-bold text-[var(--text-muted)] mb-1">
                    <Hash size={9}/> 사용건수(단가 건당:{formatNumber(data.usageUnitPrice)}건당 1원)
                  </div>
                  <div className="text-[15px] font-extrabold text-[var(--text-primary)]">{formatNumber(data.usageCount)}원</div>
                  <div className="text-[9px] text-[var(--text-muted)] mt-0.5">{data.usageCountLabel || '0건'}</div>
                </div>
                {/* 수수료 */}
                <div className="bg-[var(--bg-muted)] rounded-xl p-3 border border-[var(--border-default)]">
                  <div className="flex items-center gap-1 text-[9px] font-bold text-amber-600 dark:text-amber-400 mb-1">
                    <Percent size={9}/> 수수료({data.salesRate}%)
                  </div>
                  <div className="text-[15px] font-extrabold text-amber-600 dark:text-amber-400">{formatNumber(salesAmount)}원</div>
                  <div className="text-[9px] text-[var(--text-muted)] mt-0.5">기간매출:{formatNumber(data.periodSales)}원</div>
                </div>
              </div>

              {/* 청구리스트 */}
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <ScrollText size={14} className="text-primary-500" />
                  <span className="text-[12px] font-extrabold text-[var(--text-primary)]">청구 리스트</span>
                  <span className="text-[9px] text-[var(--text-muted)] ml-auto">{data.billingList?.length || 0}건</span>
                </div>
                <div className="overflow-x-auto rounded-lg border border-[var(--border-default)]">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="bg-[var(--bg-muted)]">
                        {['과금기간', '월관리비(서버)', 'DB사용료', 'Data사용건수', '수수료', '총금액', '상태'].map((h, i) => (
                          <th key={i} className={`py-2.5 px-3 text-[10px] font-bold text-[var(--text-muted)] ${i === 0 ? 'text-left' : 'text-right'}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(!data.billingList || data.billingList.length === 0) ? (
                        <tr><td colSpan={7} className="py-6 text-center text-[11px] text-[var(--text-muted)]">청구 내역이 없습니다</td></tr>
                      ) : data.billingList.map((b, i) => {
                        const statusStyle = b.status === '납부'
                          ? { bg: 'rgba(34,197,94,.1)', color: '#22c55e' }
                          : b.status === '청구'
                            ? { bg: 'rgba(79,110,247,.1)', color: '#4f6ef7' }
                            : b.status === '미납'
                              ? { bg: 'rgba(239,68,68,.1)', color: '#ef4444' }
                              : { bg: 'rgba(156,163,175,.1)', color: '#9ca3af' }
                        return (
                          <tr key={i} className="border-t border-[var(--border-default)] hover:bg-[var(--bg-muted)] transition-colors">
                            <td className="py-2.5 px-3 text-[11px] font-semibold text-[var(--text-primary)]">{b.period}</td>
                            <td className="py-2.5 px-3 text-[11px] text-[var(--text-secondary)] text-right tabular-nums">{formatNumber(b.monthlyFee)}원</td>
                            <td className="py-2.5 px-3 text-[11px] text-[var(--text-secondary)] text-right tabular-nums">{formatNumber(b.dbFee)}원</td>
                            <td className="py-2.5 px-3 text-[11px] text-[var(--text-secondary)] text-right tabular-nums">{formatNumber(b.dataFee)}원</td>
                            <td className="py-2.5 px-3 text-[11px] text-[var(--text-secondary)] text-right tabular-nums">{formatNumber(b.commission)}원</td>
                            <td className="py-2.5 px-3 text-[11px] font-extrabold text-[var(--text-primary)] text-right tabular-nums">{formatNumber(b.total)}원</td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: statusStyle.bg, color: statusStyle.color }}>{b.status}</span>
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

        {/* ═══ 우측 사이드바 ═══ */}
        <div className="w-full lg:w-64 space-y-4 shrink-0">

          {/* 사업자등록증 */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-default)]">
              <FileText size={14} className="text-violet-500" />
              <span className="text-[12px] font-extrabold text-[var(--text-primary)]">사업자등록증</span>
            </div>
            <div className="p-4 flex flex-col items-center gap-3">
              <div className="w-full aspect-[3/4] rounded-xl border-2 border-dashed border-[var(--border-default)] bg-[var(--bg-muted)] flex items-center justify-center overflow-hidden">
                {data.bizCertPhoto ? (
                  <img src={data.bizCertPhoto} alt="" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center">
                    <FileText size={32} className="text-[var(--text-muted)] mx-auto mb-2" />
                    <div className="text-[10px] text-[var(--text-muted)]">등록된 사업자등록증이 없습니다</div>
                  </div>
                )}
              </div>
              <div className="flex gap-2 w-full">
                <label className="flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg border border-dashed border-[var(--border-default)] bg-[var(--bg-muted)] text-[10px] font-bold text-[var(--text-secondary)] cursor-pointer hover:border-primary-400 transition-colors">
                  <Upload size={10}/> 업로드
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => toFile(e.target.files, url => upd({ bizCertPhoto: url }))} />
                </label>
                {data.bizCertPhoto && (
                  <button onClick={() => upd({ bizCertPhoto: '' })} className="px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-500 text-[10px] font-bold cursor-pointer hover:bg-red-100 transition-colors">
                    <X size={10} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 솔루션 메인 이미지 */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-default)]">
              <Image size={14} className="text-emerald-500" />
              <span className="text-[12px] font-extrabold text-[var(--text-primary)]">솔루션 메인 이미지</span>
            </div>
            <div className="p-4 flex flex-col items-center gap-3">
              <div className="w-full aspect-video rounded-xl border-2 border-dashed border-[var(--border-default)] bg-[var(--bg-muted)] flex items-center justify-center overflow-hidden">
                {data.companyPhoto ? (
                  <img src={data.companyPhoto} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <Image size={28} className="text-[var(--text-muted)] mx-auto mb-2" />
                    <div className="text-[10px] text-[var(--text-muted)]">메인이미지가 없습니다</div>
                  </div>
                )}
              </div>
              <div className="flex gap-2 w-full">
                <label className="flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg border border-dashed border-[var(--border-default)] bg-[var(--bg-muted)] text-[10px] font-bold text-[var(--text-secondary)] cursor-pointer hover:border-primary-400 transition-colors">
                  <Upload size={10}/> 업로드
                  <input type="file" accept="image/*" className="hidden" onChange={e => toFile(e.target.files, url => upd({ companyPhoto: url }))} />
                </label>
                {data.companyPhoto && (
                  <button onClick={() => upd({ companyPhoto: '' })} className="px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-500 text-[10px] font-bold cursor-pointer hover:bg-red-100 transition-colors">
                    <X size={10} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 수정 이력 */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-default)]">
              <Clock size={14} className="text-amber-500" />
              <span className="text-[12px] font-extrabold text-[var(--text-primary)]">수정 이력</span>
            </div>
            <div className="p-3 max-h-48 overflow-y-auto">
              {(!data.history || data.history.length === 0) ? (
                <div className="text-center text-[11px] text-[var(--text-muted)] py-4">수정이력이 없습니다.</div>
              ) : (
                <div className="space-y-1.5">
                  {[...data.history].reverse().slice(0, 20).map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px] py-1.5 px-2 rounded-lg hover:bg-[var(--bg-muted)] transition-colors">
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

      {/* ── 하단 저장 버튼 ── */}
      <div className="flex justify-end">
        <button onClick={save} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f6ef7] text-white text-[12px] font-bold cursor-pointer shadow-lg hover:shadow-xl transition-all">
          <Save size={14} />
          {saved ? '✓ 저장되었습니다' : '저장'}
        </button>
      </div>

      {/* ── 단가수정 모달 ── */}
      {priceModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={e => { if (e.target === e.currentTarget) setPriceModal(false) }}>
          <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-scaleIn">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-default)]">
              <div className="flex items-center gap-2">
                <Calculator size={16} className="text-primary-500" />
                <span className="text-sm font-extrabold text-[var(--text-primary)]">단가 수정</span>
              </div>
              <button onClick={() => setPriceModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer"><X size={18} /></button>
            </div>
            {/* 바디 */}
            <div className="p-5 space-y-4">
              <div>
                <label className={labelCls}><Server size={9} /> 기본금액 (월관리비)</label>
                <input
                  value={priceForm.monthlyFee}
                  onChange={e => {
                    const raw = e.target.value.replace(/,/g, '')
                    if (/^\d*$/.test(raw)) setPriceForm(p => ({ ...p, monthlyFee: formatNumber(parseInt(raw) || 0) }))
                  }}
                  className={inputCls}
                  placeholder="200,000"
                />
              </div>
              <div>
                <label className={labelCls}><Database size={9} /> DB 단가 (100MB당)</label>
                <input
                  value={priceForm.dbUnitPrice}
                  onChange={e => {
                    const raw = e.target.value.replace(/,/g, '')
                    if (/^\d*$/.test(raw)) setPriceForm(p => ({ ...p, dbUnitPrice: formatNumber(parseInt(raw) || 0) }))
                  }}
                  className={inputCls}
                  placeholder="1,000"
                />
              </div>
              <div>
                <label className={labelCls}><Hash size={9} /> 자료 단가 (건당)</label>
                <input
                  value={priceForm.usageUnitPrice}
                  onChange={e => {
                    const raw = e.target.value.replace(/,/g, '')
                    if (/^\d*$/.test(raw)) setPriceForm(p => ({ ...p, usageUnitPrice: formatNumber(parseInt(raw) || 0) }))
                  }}
                  className={inputCls}
                  placeholder="10"
                />
              </div>
              <div>
                <label className={labelCls}><Percent size={9} /> 수수료 (%)</label>
                <input
                  value={priceForm.salesRate}
                  onChange={e => {
                    const v = e.target.value
                    if (/^\d*\.?\d*$/.test(v)) setPriceForm(p => ({ ...p, salesRate: v }))
                  }}
                  className={inputCls}
                  placeholder="5"
                />
              </div>
            </div>
            {/* 푸터 */}
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
