import { useState, useMemo } from 'react'
import { getItem, setItem } from '../../utils/storage'
import { formatNumber } from '../../utils/format'
import {
  Building2, User, Phone, Mail, IdCard, Lock, Upload, X, Save,
  FileText, Clock, CreditCard, Server, Database, Hash, Percent, Calculator, Image,
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
  usageCount: number
  usageCountLabel: string
  salesRate: number
  /* 사업자등록증 */
  bizCertPhoto: string
  /* 수정이력 */
  history: { date: string; desc: string }[]
}

const EMPTY: HqVendor = {
  companyName: '', zipCode: '', address1: '', address2: '',
  ceoName: '', ceoPhone: '', bizNo: '', bizPhone: '',
  bizType: '', bizCategory: '', taxEmail: '', companyPhoto: '',
  managerName: '', managerTitle: '', managerPhone: '', managerEmail: '',
  managerId: '', managerPw: '', managerPhoto: '',
  monthlyFee: 200000, vendorCode: '', serverFee: 0,
  dbFee: 17500, dbUsage: '', usageCount: 0, usageCountLabel: '',
  salesRate: 7, bizCertPhoto: '',
  history: [],
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
  const monthlyTotal = data.monthlyFee + data.serverFee
  const dbTotal = data.dbFee
  const usageTotal = data.usageCount
  const salesAmount = Math.round((monthlyTotal + dbTotal + usageTotal) * (data.salesRate / 100))
  const grandTotal = monthlyTotal + dbTotal + usageTotal + salesAmount

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
              <button className="px-3 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 text-[10px] font-bold cursor-pointer border border-violet-200 dark:border-violet-700 hover:bg-violet-100 transition-colors flex items-center gap-1">
                <Calculator size={10} /> 매출 고과 정보
              </button>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {/* 월관리비 */}
                <div className="bg-[var(--bg-muted)] rounded-xl p-3 border border-[var(--border-default)]">
                  <div className="flex items-center gap-1 text-[9px] font-bold text-[var(--text-muted)] mb-1">
                    <Server size={9}/> 월관리(서버)
                  </div>
                  <div className="text-[15px] font-extrabold text-[var(--text-primary)]">{formatNumber(data.monthlyFee)}원</div>
                  <div className="text-[9px] text-[var(--text-muted)] mt-0.5">
                    <input value={data.vendorCode} onChange={e => upd({ vendorCode: e.target.value })} placeholder="거래처코드" className="w-full bg-transparent border-none outline-none text-[9px] text-[var(--text-muted)]" />
                  </div>
                </div>
                {/* DB 사용료 */}
                <div className="bg-[var(--bg-muted)] rounded-xl p-3 border border-[var(--border-default)]">
                  <div className="flex items-center gap-1 text-[9px] font-bold text-[var(--text-muted)] mb-1">
                    <Database size={9}/> DB사용료(용량)
                  </div>
                  <div className="text-[15px] font-extrabold text-[var(--text-primary)]">{formatNumber(data.dbFee)}원</div>
                  <div className="text-[9px] text-[var(--text-muted)] mt-0.5">
                    <input value={data.dbUsage} onChange={e => upd({ dbUsage: e.target.value })} placeholder="2.5GB" className="w-full bg-transparent border-none outline-none text-[9px] text-[var(--text-muted)]" />
                  </div>
                </div>
                {/* 사용건수 */}
                <div className="bg-[var(--bg-muted)] rounded-xl p-3 border border-[var(--border-default)]">
                  <div className="flex items-center gap-1 text-[9px] font-bold text-[var(--text-muted)] mb-1">
                    <Hash size={9}/> 사용건수(건수)
                  </div>
                  <div className="text-[15px] font-extrabold text-[var(--text-primary)]">{formatNumber(data.usageCount)}원</div>
                  <div className="text-[9px] text-[var(--text-muted)] mt-0.5">
                    <input value={data.usageCountLabel} onChange={e => upd({ usageCountLabel: e.target.value })} placeholder="856건" className="w-full bg-transparent border-none outline-none text-[9px] text-[var(--text-muted)]" />
                  </div>
                </div>
                {/* 매출수수료 */}
                <div className="bg-[var(--bg-muted)] rounded-xl p-3 border border-[var(--border-default)]">
                  <div className="flex items-center gap-1 text-[9px] font-bold text-[var(--text-muted)] mb-1">
                    <Percent size={9}/> 수수료({data.salesRate}%)
                  </div>
                  <div className="text-[15px] font-extrabold text-amber-600 dark:text-amber-400">{formatNumber(salesAmount)}원</div>
                  <div className="text-[9px] text-[var(--text-muted)] mt-0.5">
                    전체 합산 × {data.salesRate}%
                  </div>
                </div>
                {/* 합계 */}
                <div className="bg-gradient-to-br from-primary-50 to-violet-50 dark:from-primary-900/20 dark:to-violet-900/20 rounded-xl p-3 border border-primary-200 dark:border-primary-700">
                  <div className="flex items-center gap-1 text-[9px] font-bold text-primary-600 dark:text-primary-400 mb-1">
                    <Calculator size={9}/> 합계·총액 금액
                  </div>
                  <div className="text-[15px] font-extrabold text-primary-600 dark:text-primary-400">{formatNumber(grandTotal)}원</div>
                  <div className="text-[9px] text-primary-500/60 mt-0.5">
                    VAT 별도
                  </div>
                </div>
              </div>

              {/* 세부 금액 입력 */}
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                <div>
                  <label className={labelCls}><Server size={9}/> 월관리비</label>
                  <input value={formatNumber(data.monthlyFee)} onChange={e => upd({ monthlyFee: parseInt(e.target.value.replace(/,/g, '')) || 0 })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}><Server size={9}/> 서버요금</label>
                  <input value={formatNumber(data.serverFee)} onChange={e => upd({ serverFee: parseInt(e.target.value.replace(/,/g, '')) || 0 })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}><Database size={9}/> DB사용료</label>
                  <input value={formatNumber(data.dbFee)} onChange={e => upd({ dbFee: parseInt(e.target.value.replace(/,/g, '')) || 0 })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}><Hash size={9}/> 사용건수금액</label>
                  <input value={formatNumber(data.usageCount)} onChange={e => upd({ usageCount: parseInt(e.target.value.replace(/,/g, '')) || 0 })} className={inputCls} />
                </div>
              </div>

              <div className="flex justify-end mt-3">
                <button onClick={save} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f6ef7] text-white text-[11px] font-bold cursor-pointer shadow-md hover:shadow-lg transition-all">
                  <Save size={12} /> 결과 수정
                </button>
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
    </div>
  )
}
