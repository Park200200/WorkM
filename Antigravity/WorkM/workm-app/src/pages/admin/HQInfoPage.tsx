import { useState, useRef } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { getItem, setItem } from '../../utils/storage'
import { useAuthStore } from '../../stores/authStore'
import { useToastStore } from '../../stores/toastStore'
import {
  MapPin, User, Phone, Mail, FileText,
  Image as ImageIcon, Save, RotateCcw, Upload, X, Paperclip, CreditCard,
  Clock, Pencil, Briefcase, Smartphone, Monitor, Trash2, Download, Settings,
} from 'lucide-react'
import { cn } from '../../utils/cn'

/* ── 포맷터 ── */
function formatPhone(val: string): string {
  const d = val.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.startsWith('02')) {
    if (d.length <= 5) return `${d.slice(0, 2)}-${d.slice(2)}`
    if (d.length <= 9) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`
    return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6)}`
  }
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`
}

function formatBizNo(val: string): string {
  const d = val.replace(/\D/g, '').slice(0, 10)
  if (d.length <= 3) return d
  if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`
}

/* ── 타입 ── */
interface HQData {
  company?: string
  zip?: string
  addr1?: string
  addr2?: string
  ceo?: string
  ceoPhone?: string
  bizPhone?: string
  bizNo?: string
  bizType?: string
  bizItem?: string
  taxEmail?: string
  mgrName?: string
  mgrTitle?: string
  mgrMobile?: string
  mgrId?: string
  mgrPw?: string
  code?: string
  bizDocImg?: string
  mainImg?: string
  mgrPhoto?: string
  history?: Array<{ date: string; text: string; by: string }>
}

interface AttachmentItem {
  id: number
  name: string
  size: string
  type: string
  data: string
  uploadedAt: string
  uploadedBy: string
}

interface SolutionItem {
  key: string
  label: string
  enabled: boolean
  qty?: number
}

interface BillingRow {
  id: number
  period: string
  mgmt: string
  db: string
  dataCnt: string
  fee: string
  total: string
  status: string
}

interface PaymentConfig {
  mgmtFee: string
  dbFee: string
  dataUnitPrice: string
  feeRate: string
}

function pad(n: number) { return String(n).padStart(2, '0') }

export function HQInfoPage() {
  const user = useAuthStore(s => s.user)
  const addToast = useToastStore(s => s.add)

  const [data, setData] = useState<HQData>(() => getItem('ws_hq_info', {}))
  const [attachments, setAttachments] = useState<AttachmentItem[]>(() => getItem('ws_hq_attachments', []))
  const [solutions, setSolutions] = useState<SolutionItem[]>(() => getItem('ws_hq_solutions', [
    { key: 'workm', label: '워크엠', enabled: true },
    { key: 'homepage', label: '홈페이지', enabled: true, qty: 1 },
    { key: 'fabric', label: '원단공급사', enabled: true },
    { key: 'mfg', label: '제조공급사', enabled: false },
    { key: 'dist', label: '유통관리사', enabled: false },
    { key: 'franchise', label: '가맹대리점', enabled: false },
    { key: 'food', label: '식재대리점', enabled: false },
  ]))
  const [billings, setBillings] = useState<BillingRow[]>(() => getItem('ws_hq_billings', [
    { id: 1, period: '2026.04.01~', mgmt: '200,000', db: '250,000', dataCnt: '523,221', fee: '617,500', total: '1,590,721', status: '과금중' },
    { id: 2, period: '2026.03.01-2026.03.31', mgmt: '200,000', db: '250,000', dataCnt: '49,800', fee: '480,000', total: '979,800', status: '청구' },
    { id: 3, period: '2026.02.01-2026.02.28', mgmt: '200,000', db: '280,000', dataCnt: '52,100', fee: '520,000', total: '1,052,100', status: '납부' },
    { id: 4, period: '2026.01.01-2026.01.31', mgmt: '200,000', db: '250,000', dataCnt: '48,200', fee: '500,000', total: '998,200', status: '납부' },
  ]))
  const [payConfig, setPayConfig] = useState<PaymentConfig>(() => getItem('ws_hq_payconfig', {
    mgmtFee: '200,000', dbFee: '250,000', dataUnitPrice: '1', feeRate: '5',
  }))
  const [dirty, setDirty] = useState(false)
  const attachRef = useRef<HTMLInputElement>(null)

  const bizDocRef = useRef<HTMLInputElement>(null)
  const mainImgRef = useRef<HTMLInputElement>(null)
  const mgrPhotoRef = useRef<HTMLInputElement>(null)

  const update = (key: keyof HQData, value: string) => {
    setData(prev => ({ ...prev, [key]: value }))
    setDirty(true)
  }

  // ── 저장 ──
  const save = () => {
    const now = new Date()
    const ds = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
    const history = [
      { date: ds, text: '정보 수정', by: user?.name ? `${user.name}` : '관리자' },
      ...(data.history || []),
    ].slice(0, 10)
    const saved = { ...data, history }
    setItem('ws_hq_info', saved)
    setData(saved)
    setDirty(false)
    addToast('success', '본사정보가 저장되었습니다.')
  }

  // ── 초기화 ──
  const reset = () => {
    if (!confirm('입력한 내용을 초기화하시겠습니까?')) return
    const blank: HQData = { history: data.history }
    setItem('ws_hq_info', blank)
    setData(blank)
    setDirty(false)
    addToast('info', '초기화되었습니다.')
  }

  // ── 이미지 업로드 ──
  const handleImage = (key: 'bizDocImg' | 'mainImg' | 'mgrPhoto', file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const url = e.target?.result as string
      const updated = { ...data, [key]: url }
      setItem('ws_hq_info', updated)
      setData(updated)
      addToast('success', '이미지가 등록되었습니다.')
    }
    reader.readAsDataURL(file)
  }

  const clearImage = (key: 'bizDocImg' | 'mainImg' | 'mgrPhoto') => {
    const updated = { ...data }
    delete updated[key]
    setItem('ws_hq_info', updated)
    setData(updated)
  }

  // ── 첨부파일 ──
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + 'B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
    return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
  }

  const handleAttach = (files: FileList | null) => {
    if (!files) return
    const now = new Date()
    const ds = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
    const newItems: AttachmentItem[] = []
    let processed = 0
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        newItems.push({
          id: Date.now() + processed,
          name: file.name,
          size: formatFileSize(file.size),
          type: file.type || 'file',
          data: e.target?.result as string,
          uploadedAt: ds,
          uploadedBy: user?.name || '관리자',
        })
        processed++
        if (processed === files.length) {
          const updated = [...attachments, ...newItems]
          setAttachments(updated)
          setItem('ws_hq_attachments', updated)
          addToast('success', `${files.length}개 파일이 첨부되었습니다.`)
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removeAttach = (id: number) => {
    const updated = attachments.filter(a => a.id !== id)
    setAttachments(updated)
    setItem('ws_hq_attachments', updated)
    addToast('info', '첨부파일이 삭제되었습니다.')
  }

  const downloadAttach = (item: AttachmentItem) => {
    const link = document.createElement('a')
    link.href = item.data
    link.download = item.name
    link.click()
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️'
    if (type.includes('pdf')) return '📄'
    if (type.includes('word') || type.includes('document')) return '📝'
    if (type.includes('sheet') || type.includes('excel')) return '📊'
    if (type.includes('zip') || type.includes('rar')) return '📦'
    return '📎'
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-4">
        <PageHeader title="본사정보" subtitle="본사 기본 정보 및 담당자를 관리합니다" />
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcw size={14} /> 초기화
          </Button>
          <Button size="sm" onClick={save} disabled={!dirty}>
            <Save size={14} /> 저장
          </Button>
        </div>
      </div>

      {/* ── 메인 2컬럼 레이아웃 ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-4">
        {/* ============ 왼쪽 ============ */}
        <div className="space-y-4">

          {/* ── 기본 정보 ── */}
          <Card>
            <SectionHeader icon={<FileText size={16} />} title="기본 정보" badge={`# 코드: ${data.code || 'CODE-F1'}`} />
            <div className="p-4 space-y-4">

              {/* 사업자 이름 (법인명) */}
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">사업자 이름 (법인명)</label>
                <Input
                  placeholder="법인명 입력"
                  value={data.company || ''}
                  onChange={e => update('company', e.target.value)}
                />
              </div>

              {/* 주소 (우편번호 검색) */}
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block flex items-center gap-1">
                  <MapPin size={11} className="text-[var(--text-muted)]" />
                  주소 (우편번호 검색)
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <Input
                    placeholder="우편번호"
                    value={data.zip || ''}
                    onChange={e => update('zip', e.target.value)}
                    className="w-28"
                  />
                  <Button variant="secondary" size="sm">우편번호 검색</Button>
                </div>
                <Input
                  placeholder="기본 주소"
                  value={data.addr1 || ''}
                  onChange={e => update('addr1', e.target.value)}
                  className="mb-2"
                />
                <Input
                  placeholder="상세 주소 입력 (예: 101호)"
                  value={data.addr2 || ''}
                  onChange={e => update('addr2', e.target.value)}
                />
              </div>

              {/* 대표자 이름 + 대표자 전화 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">대표자 이름</label>
                  <Input
                    icon={<User size={14} />}
                    placeholder="대표자 이름"
                    value={data.ceo || ''}
                    onChange={e => update('ceo', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block flex items-center gap-1">
                    <Phone size={11} className="text-[var(--text-muted)]" />
                    대표자 전화
                  </label>
                  <Input
                    placeholder="010-0000-0000"
                    value={data.ceoPhone || ''}
                    onChange={e => update('ceoPhone', formatPhone(e.target.value))}
                  />
                </div>
              </div>

              {/* 사업자 전화 + 사업자 번호 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block flex items-center gap-1">
                    <Phone size={11} className="text-[var(--text-muted)]" />
                    사업자 전화
                  </label>
                  <Input
                    placeholder="053-000-0000"
                    value={data.bizPhone || ''}
                    onChange={e => update('bizPhone', formatPhone(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">사업자 번호</label>
                  <Input
                    placeholder="000-00-00000"
                    value={data.bizNo || ''}
                    onChange={e => update('bizNo', formatBizNo(e.target.value))}
                  />
                </div>
              </div>

              {/* 업태 + 종목 (업종) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">업태</label>
                  <Input
                    placeholder="예) 도매"
                    value={data.bizType || ''}
                    onChange={e => update('bizType', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">종목 (업종)</label>
                  <Input
                    placeholder="예) 원단"
                    value={data.bizItem || ''}
                    onChange={e => update('bizItem', e.target.value)}
                  />
                </div>
              </div>

              {/* 세금계산서 이메일 */}
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block flex items-center gap-1">
                  <Mail size={11} className="text-[var(--text-muted)]" />
                  세금계산서 이메일
                </label>
                <Input
                  icon={<Mail size={14} />}
                  type="email"
                  placeholder="tax@company.com"
                  value={data.taxEmail || ''}
                  onChange={e => update('taxEmail', e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* ── 담당자 정보 ── */}
          <Card>
            <SectionHeader icon={<User size={16} />} title="담당자 정보" />
            <div className="p-4">
              <div className="flex gap-4">
                {/* 프로필 사진 */}
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <div
                    onClick={() => mgrPhotoRef.current?.click()}
                    className="w-[70px] h-[70px] rounded-full border-2 border-dashed border-[var(--border-default)] hover:border-primary-400 bg-[var(--bg-muted)] flex items-center justify-center cursor-pointer overflow-hidden transition-colors"
                  >
                    {data.mgrPhoto ? (
                      <img src={data.mgrPhoto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User size={28} className="text-[var(--text-muted)]" />
                    )}
                  </div>
                  <input ref={mgrPhotoRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleImage('mgrPhoto', e.target.files[0])} />
                  <span className="text-[10px] text-[var(--text-muted)]">프로필 사진</span>
                </div>

                {/* 필드들 */}
                <div className="flex-1 space-y-3">
                  {/* 담당자 이름 + 직함 */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">담당자 이름</label>
                      <Input
                        placeholder="담당자 이름"
                        value={data.mgrName || ''}
                        onChange={e => update('mgrName', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block flex items-center gap-1">
                        <Briefcase size={11} className="text-[var(--text-muted)]" />
                        직함
                      </label>
                      <Input
                        placeholder="예) 담당자"
                        value={data.mgrTitle || ''}
                        onChange={e => update('mgrTitle', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* 담당자 휴대폰 */}
                  <div>
                    <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block flex items-center gap-1">
                      <Smartphone size={11} className="text-[var(--text-muted)]" />
                      담당자 휴대폰
                    </label>
                    <Input
                      placeholder="010-0000-0000"
                      value={data.mgrMobile || ''}
                      onChange={e => update('mgrMobile', formatPhone(e.target.value))}
                    />
                  </div>

                  {/* 시스템 ID + 비밀번호 */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">시스템 ID</label>
                      <Input
                        placeholder="system_id"
                        value={data.mgrId || ''}
                        readOnly
                        className="bg-[var(--bg-muted)] text-[var(--text-muted)]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">비밀번호</label>
                      <Input
                        type="password"
                        placeholder="••••••"
                        value={data.mgrPw || '***'}
                        onChange={e => update('mgrPw', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* ============ 오른쪽 사이드바 ============ */}
        <div className="space-y-3">
          {/* 사업자등록증 */}
          <Card>
            <SectionHeader icon={<FileText size={16} />} title="사업자등록증" />
            <div className="p-4">
              <div
                onClick={() => bizDocRef.current?.click()}
                className="w-full aspect-[3/2] border-2 border-dashed border-[var(--border-default)] rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary-400 transition-colors overflow-hidden bg-[var(--bg-muted)]"
              >
                {data.bizDocImg ? (
                  <img src={data.bizDocImg} alt="사업자등록증" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <ImageIcon size={36} className="text-[var(--text-muted)]" />
                    <span className="text-[12px] text-[var(--text-muted)]">등록된 이미지가 없습니다.</span>
                  </>
                )}
              </div>
              <input ref={bizDocRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleImage('bizDocImg', e.target.files[0])} />
              <div className="flex gap-1.5 mt-2">
                <button
                  onClick={() => bizDocRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border-default)] text-[12px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
                >
                  <Upload size={12} /> 업로드
                </button>
                <button
                  onClick={() => clearImage('bizDocImg')}
                  className="px-2 py-1.5 rounded-lg border border-[var(--border-default)] text-danger hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          </Card>

          {/* 솔루션 메인 이미지 */}
          <Card>
            <SectionHeader icon={<Monitor size={16} />} title="솔루션 메인 이미지" />
            <div className="p-4">
              <div
                onClick={() => mainImgRef.current?.click()}
                className="w-full aspect-video border-2 border-dashed border-[var(--border-default)] rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary-400 transition-colors overflow-hidden bg-[var(--bg-muted)]"
              >
                {data.mainImg ? (
                  <img src={data.mainImg} alt="솔루션메인" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Upload size={36} className="text-[var(--text-muted)]" />
                    <span className="text-[12px] text-[var(--text-muted)]">클릭하여 이미지 업로드</span>
                  </>
                )}
              </div>
              <input ref={mainImgRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleImage('mainImg', e.target.files[0])} />
              <div className="flex gap-1.5 mt-2">
                <button
                  onClick={() => mainImgRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border-default)] text-[12px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
                >
                  <Upload size={12} /> 업로드
                </button>
                <button
                  onClick={() => clearImage('mainImg')}
                  className="px-2 py-1.5 rounded-lg border border-[var(--border-default)] text-danger hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          </Card>

          {/* 수정 이력 */}
          <Card>
            <SectionHeader icon={<Clock size={16} />} title="수정 이력" />
            <div className="p-4">
              {(data.history || []).length === 0 ? (
                <div className="text-center text-[13px] text-[var(--text-muted)] py-5">이력이 없습니다.</div>
              ) : (
                <div className="space-y-2.5 max-h-48 overflow-y-auto">
                  {(data.history || []).map((h, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className={cn(
                        'w-2 h-2 rounded-full mt-1.5 shrink-0',
                        i === 0 ? 'bg-primary-500' : 'bg-[var(--border-default)]',
                      )} />
                      <div>
                        <div className="text-[10px] text-[var(--text-muted)]">{h.date}</div>
                        <div className="text-[12px] font-semibold text-[var(--text-primary)]">{h.text}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">✎ {h.by}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* ── 사용 솔루션 ── */}
      <div className="mt-4">
        <Card>
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <Settings size={14} className="text-indigo-500" />
              </div>
              <span className="text-sm font-bold text-[var(--text-primary)]">사용 솔루션</span>
            </div>
            <span className="text-[12px] font-semibold text-[var(--text-muted)]">
              {solutions.filter(s => s.enabled).length}개 사용중
            </span>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-3">
              {solutions.map(sol => (
                <div
                  key={sol.key}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 transition-all min-w-[150px]',
                    sol.enabled
                      ? 'border-primary-300 bg-primary-50 dark:bg-primary-900/10'
                      : 'border-[var(--border-default)] bg-[var(--bg-muted)] opacity-60',
                  )}
                >
                  <span className="text-[13px] font-bold text-[var(--text-primary)] flex-1">{sol.label}</span>
                  <button
                    onClick={() => {
                      const updated = solutions.map(s => s.key === sol.key ? { ...s, enabled: !s.enabled } : s)
                      setSolutions(updated)
                      setItem('ws_hq_solutions', updated)
                    }}
                    className={cn(
                      'relative w-11 h-6 rounded-full transition-colors cursor-pointer',
                      sol.enabled ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600',
                    )}
                  >
                    <span className={cn(
                      'absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow transition-transform',
                      sol.enabled ? 'left-[22px]' : 'left-0.5',
                    )} />
                  </button>
                  {sol.key === 'homepage' && sol.enabled && (
                    <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                      <span>수량:</span>
                      <input
                        type="number"
                        min={1}
                        value={sol.qty || 1}
                        onChange={e => {
                          const updated = solutions.map(s => s.key === 'homepage' ? { ...s, qty: parseInt(e.target.value) || 1 } : s)
                          setSolutions(updated)
                          setItem('ws_hq_solutions', updated)
                        }}
                        className="w-12 px-1.5 py-0.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-center text-[12px] font-bold text-[var(--text-primary)]"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* ── 결제 정보 + 청구 리스트 ── */}
      <div className="mt-4">
        <Card>
          {/* 헤더 */}
          <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-3 border-b border-[var(--border-default)]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <CreditCard size={14} className="text-blue-500" />
              </div>
              <span className="text-sm font-bold text-[var(--text-primary)]">결제 정보</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap text-[11px] text-[var(--text-muted)]">
              <span>사용솔루션: <b className="text-primary-500">{solutions.filter(s => s.enabled).map(s => s.label).join(', ')}</b></span>
              <span>⏳ 과금일자: <b>{billings[0]?.period || '-'}</b></span>
              <span>📅 총금액: <b className="text-primary-500">{billings[0]?.total || '0'}원</b></span>
            </div>
          </div>

          {/* 요약 카드 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 p-3 sm:p-4">
            {[
              { icon: '💻', label: '월관리비', labelFull: '월관리비(서버)', value: payConfig.mgmtFee, sub: '기본금액' },
              { icon: '🗄️', label: 'DB사용료', labelFull: 'DB사용료(단가:100M당 1,000원)', value: payConfig.dbFee, sub: '25,000MB' },
              { icon: '#', label: '자료단가', labelFull: '자료단가(10건당 ' + payConfig.dataUnitPrice + '원)', value: billings[0]?.dataCnt || '0', sub: (billings[0]?.dataCnt || '0') + '건' },
              { icon: '%', label: '수수료', labelFull: '수수료(' + payConfig.feeRate + '%)', value: billings[0]?.fee || '0', sub: '기간매출:12,350,000원', highlight: true },
            ].map((c, i) => (
              <div key={i} className={cn(
                'rounded-xl p-2.5 sm:p-3.5 border',
                c.highlight
                  ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800'
                  : 'bg-[var(--bg-muted)] border-[var(--border-default)]',
              )}>
                <div className="text-[9.5px] sm:text-[10.5px] font-semibold text-[var(--text-muted)] mb-0.5 sm:mb-1 flex items-center gap-1 truncate">
                  <span>{c.icon}</span> <span className="hidden sm:inline">{c.labelFull}</span><span className="sm:hidden">{c.label}</span>
                </div>
                <div className={cn(
                  'text-[15px] sm:text-lg font-extrabold',
                  c.highlight ? 'text-orange-500' : 'text-[var(--text-primary)]',
                )}>
                  {c.value}<span className="text-[11px] sm:text-[13px] font-semibold text-[var(--text-secondary)]">원</span>
                </div>
                <div className="text-[9px] sm:text-[10px] text-[var(--text-muted)] mt-0.5 truncate">{c.sub}</div>
              </div>
            ))}
          </div>

          {/* 청구 리스트 - PC: 테이블 / 모바일: 카드 */}
          <div className="px-3 sm:px-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                📋 청구 리스트
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">{billings.length}건</span>
            </div>

            {/* PC 테이블 */}
            <div className="hidden sm:block overflow-x-auto rounded-xl border border-[var(--border-default)]">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-[var(--bg-muted)] border-b border-[var(--border-default)]">
                    {['과금기간','월관리비','DB사용료','Data건수','수수료','총금액','상태'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left font-bold text-[var(--text-muted)] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {billings.map(row => (
                    <tr key={row.id} className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-muted)] transition-colors">
                      <td className="px-3 py-2.5 font-semibold text-[var(--text-primary)] whitespace-nowrap">{row.period}</td>
                      <td className="px-3 py-2.5 text-[var(--text-secondary)]">{row.mgmt}원</td>
                      <td className="px-3 py-2.5 text-[var(--text-secondary)]">{row.db}원</td>
                      <td className="px-3 py-2.5 text-[var(--text-secondary)]">{row.dataCnt}원</td>
                      <td className="px-3 py-2.5 text-[var(--text-secondary)]">{row.fee}원</td>
                      <td className="px-3 py-2.5 font-extrabold text-[var(--text-primary)]">{row.total}원</td>
                      <td className="px-3 py-2.5">
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-bold',
                          row.status === '과금중' ? 'bg-red-100 text-red-500 dark:bg-red-900/20' :
                          row.status === '청구' ? 'bg-blue-100 text-blue-500 dark:bg-blue-900/20' :
                          'bg-green-100 text-green-600 dark:bg-green-900/20',
                        )}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 모바일 카드 */}
            <div className="sm:hidden space-y-2.5">
              {billings.map(row => (
                <div key={row.id} className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-muted)] p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-bold text-[var(--text-primary)]">{row.period}</span>
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-bold',
                      row.status === '과금중' ? 'bg-red-100 text-red-500 dark:bg-red-900/20' :
                      row.status === '청구' ? 'bg-blue-100 text-blue-500 dark:bg-blue-900/20' :
                      'bg-green-100 text-green-600 dark:bg-green-900/20',
                    )}>
                      {row.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                    <div className="flex justify-between"><span className="text-[var(--text-muted)]">월관리비</span><span className="font-semibold text-[var(--text-secondary)]">{row.mgmt}원</span></div>
                    <div className="flex justify-between"><span className="text-[var(--text-muted)]">DB사용료</span><span className="font-semibold text-[var(--text-secondary)]">{row.db}원</span></div>
                    <div className="flex justify-between"><span className="text-[var(--text-muted)]">Data건수</span><span className="font-semibold text-[var(--text-secondary)]">{row.dataCnt}원</span></div>
                    <div className="flex justify-between"><span className="text-[var(--text-muted)]">수수료</span><span className="font-semibold text-[var(--text-secondary)]">{row.fee}원</span></div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--border-default)]">
                    <span className="text-[11px] font-bold text-[var(--text-muted)]">총금액</span>
                    <span className="text-[14px] font-extrabold text-[var(--text-primary)]">{row.total}원</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

    </div>
  )
}

/* ── 섹션 헤더 ── */
function SectionHeader({ icon, title, badge }: { icon: React.ReactNode; title: string; badge?: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-500">
          {icon}
        </div>
        <span className="text-sm font-bold text-[var(--text-primary)]">{title}</span>
      </div>
      {badge && (
        <span className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--bg-muted)] px-2 py-0.5 rounded">
          {badge}
        </span>
      )}
    </div>
  )
}
