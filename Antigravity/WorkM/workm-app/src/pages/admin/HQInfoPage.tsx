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
  Image as ImageIcon, Save, RotateCcw, Upload, X, Paperclip,
  Clock, Pencil, Briefcase, Smartphone, Monitor, Trash2, Download,
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

function pad(n: number) { return String(n).padStart(2, '0') }

export function HQInfoPage() {
  const user = useAuthStore(s => s.user)
  const addToast = useToastStore(s => s.add)

  const [data, setData] = useState<HQData>(() => getItem('ws_hq_info', {}))
  const [attachments, setAttachments] = useState<AttachmentItem[]>(() => getItem('ws_hq_attachments', []))
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

      {/* ── 첨부파일 ── */}
      <div className="mt-4">
        <Card>
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Paperclip size={14} className="text-emerald-500" />
              </div>
              <span className="text-sm font-bold text-[var(--text-primary)]">첨부파일</span>
              <span className="text-[11px] font-bold text-[var(--text-muted)] bg-[var(--bg-muted)] px-2 py-0.5 rounded-full">
                {attachments.length}개
              </span>
            </div>
            <button
              onClick={() => attachRef.current?.click()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 text-white text-[12px] font-bold hover:bg-emerald-600 transition-colors cursor-pointer"
            >
              <Upload size={12} /> 파일 추가
            </button>
            <input
              ref={attachRef}
              type="file"
              multiple
              className="hidden"
              onChange={e => handleAttach(e.target.files)}
            />
          </div>

          <div className="p-4">
            {attachments.length === 0 ? (
              <div
                onClick={() => attachRef.current?.click()}
                className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-[var(--border-default)] rounded-xl cursor-pointer hover:border-emerald-400 transition-colors"
              >
                <Paperclip size={32} className="text-[var(--text-muted)] mb-2" />
                <span className="text-[13px] font-semibold text-[var(--text-muted)]">클릭하여 파일을 첨부하세요</span>
                <span className="text-[11px] text-[var(--text-muted)] mt-1">이미지, PDF, 문서 등 모든 파일 형식 지원</span>
              </div>
            ) : (
              <div className="space-y-2">
                {attachments.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-muted)] hover:border-emerald-300 transition-colors group"
                  >
                    <span className="text-lg shrink-0">{getFileIcon(item.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-bold text-[var(--text-primary)] truncate">{item.name}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">
                        {item.size} · {item.uploadedAt} · {item.uploadedBy}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => downloadAttach(item)}
                        className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-emerald-500 transition-colors cursor-pointer"
                        title="다운로드"
                      >
                        <Download size={13} />
                      </button>
                      <button
                        onClick={() => removeAttach(item.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--text-muted)] hover:text-red-500 transition-colors cursor-pointer"
                        title="삭제"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
