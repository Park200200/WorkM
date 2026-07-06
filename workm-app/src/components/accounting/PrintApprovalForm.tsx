import { useRef, useState, useEffect, useMemo, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { formatNumber } from '../../utils/format'
import { X, Printer, Eye, Edit3, Pin, Paperclip } from 'lucide-react'
import { loadMultipleImages } from '../../utils/attachmentDB'

/* ─── 숫자를 한글 금액으로 변환 ── */
function numberToKorean(n: number): string {
  if (n === 0) return '영'
  const units = ['', '만', '억', '조']
  const digits = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구']
  const smallUnits = ['', '십', '백', '천']

  let result = ''
  let unitIdx = 0
  let num = Math.abs(n)

  while (num > 0) {
    const chunk = num % 10000
    if (chunk > 0) {
      let chunkStr = ''
      let c = chunk
      for (let i = 0; i < 4; i++) {
        const d = c % 10
        if (d > 0) {
          chunkStr = digits[d] + smallUnits[i] + chunkStr
        }
        c = Math.floor(c / 10)
      }
      result = chunkStr + units[unitIdx] + result
    }
    num = Math.floor(num / 10000)
    unitIdx++
  }

  return (n < 0 ? '마이너스 ' : '') + result + '원정'
}

interface PrintAttachment {
  name: string
  type: string
  dataUrl?: string
  imageKey?: string
  title: string
  printWidth: number
  row?: number  // 같은 row 값이면 같은 줄에 나란히 배치
}

interface PrintApprovalData {
  // 기본 정보
  date?: string           // 품의일자
  expenseDate?: string    // 지출일자
  settleDate?: string     // 결제일자
  accountName?: string    // 계정과목
  evidenceType?: string   // 증빙구분
  vendor?: string         // 거래처
  itemName?: string       // 물품명
  purpose?: string        // 용도
  amount?: number         // 지출금액
  memo?: string           // 비고
  applicant?: string      // 품의자
  approver?: string       // 승인자/상임이사
  applicantSealImg?: string  // 품의자 도장/사인 이미지
  approverSealImg?: string   // 승인자 도장/사인 이미지
  applicantPosition?: string // 품의자 직함
  approverPosition?: string  // 승인자 직함
  approvalStatus?: string    // 승인 상태
  approvedMemo?: string      // 승인 메모
  attachments?: PrintAttachment[]  // 첨부파일
  isGeneral?: boolean      // 일반품의 여부
  approvalType?: string    // 품의유형 (지출/일반)
  approvedDate?: string    // 승인일자
  department?: string      // 소속 부서
  // 대체전표 전용
  isTransfer?: boolean
  debitAccount?: string    // 수신항목 (차변)
  debitDetail?: string
  creditAccount?: string   // 송신항목 (대변)
  creditDetail?: string
  transferContent?: string // 대체내용
  description?: string     // 적요
  counter?: string         // 대체경로
  method?: string
  title?: string
}

interface PrintApprovalFormProps {
  data: PrintApprovalData
  onClose: () => void
  actions?: ReactNode
  onUpdateAttachments?: (attachments: PrintAttachment[]) => void
  readOnly?: boolean
}

export function PrintApprovalForm({ data, onClose, actions, onUpdateAttachments, readOnly }: PrintApprovalFormProps) {
  const canEdit = !readOnly
  const printRef = useRef<HTMLDivElement>(null)
  const [formTitle, setFormTitle] = useState(() => {
    if (data.isTransfer) return '대체결의서'
    if (data.isGeneral) return localStorage.getItem('pf_title_general') || '품 의 서'
    if (data.approvalType === '선지출') return '선지출 품의서'
    return localStorage.getItem('pf_title') || '지출품의서'
  })
  const [printWidth, setPrintWidth] = useState(() => Number(localStorage.getItem('pf_width')) || 210)
  const [localAttachments, setLocalAttachments] = useState<PrintAttachment[]>(data.attachments || [])
  // 외부에서 첨부파일이 변경되면 동기화
  useEffect(() => {
    if (data.attachments && data.attachments.length !== localAttachments.length) {
      setLocalAttachments(data.attachments)
    }
  }, [data.attachments?.length])
  const [evidencePreview, setEvidencePreview] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dropTarget, setDropTarget] = useState<{ type: 'same-row' | 'new-row'; rowIdx: number } | null>(null)

  // 첨부파일을 row 기준으로 그룹핑
  const attachmentRows = useMemo(() => {
    if (localAttachments.length === 0) return [] as { att: PrintAttachment; fi: number }[][]
    const norm = localAttachments.map((a, i) => ({ att: { ...a, row: a.row ?? i }, fi: i }))
    const result: typeof norm[number][][] = []
    const seen = new Set<number>()
    for (const item of norm) {
      const r = item.att.row!
      if (!seen.has(r)) {
        seen.add(r)
        result.push(norm.filter(x => x.att.row === r))
      }
    }
    return result
  }, [localAttachments])

  // 드래그 드롭 처리
  const handleEvidenceDrop = (targetRowIdx: number, mode: 'same-row' | 'new-row') => {
    if (dragIdx === null) return
    const norm = localAttachments.map((a, i) => ({ ...a, row: a.row ?? i }))
    const dragged = { ...norm[dragIdx] }
    const without = norm.filter((_, i) => i !== dragIdx)
    // without에서 행 재계산
    const rows: PrintAttachment[][] = []
    const seenR = new Set<number>()
    for (const a of without) {
      if (!seenR.has(a.row!)) { seenR.add(a.row!); rows.push(without.filter(x => x.row === a.row)) }
    }
    if (mode === 'same-row' && rows[targetRowIdx]) {
      dragged.row = rows[targetRowIdx][0].row
      const lastItem = rows[targetRowIdx][rows[targetRowIdx].length - 1]
      const lastIdx = without.indexOf(lastItem as any)
      without.splice(lastIdx + 1, 0, dragged)
    } else {
      dragged.row = Date.now() + Math.random()
      if (rows.length === 0 || targetRowIdx >= rows.length) {
        without.push(dragged)
      } else {
        const firstItem = rows[targetRowIdx][0]
        const insertIdx = without.indexOf(firstItem as any)
        without.splice(insertIdx, 0, dragged)
      }
    }
    setLocalAttachments(without)
    onUpdateAttachments?.(without)
    setDragIdx(null)
    setDropTarget(null)
  }

  // data.attachments가 변경될 때 localAttachments 동기화 + IndexedDB 이미지 로드
  const attKeys = JSON.stringify((data.attachments || []).map((a: any) => a.imageKey || a.name))
  useEffect(() => {
    const atts = data.attachments || []
    // 우선 전달받은 데이터를 즉시 반영 (새로 추가된 파일도 바로 표시)
    setLocalAttachments(atts)
    // IndexedDB에서 아직 로드되지 않은 이미지 비동기 로드
    const keysToLoad = atts.filter(a => a.imageKey && !a.dataUrl).map(a => a.imageKey!)
    if (keysToLoad.length === 0) return
    loadMultipleImages(keysToLoad).then(loaded => {
      const updated = atts.map(a => {
        if (a.imageKey && loaded[a.imageKey]) {
          return { ...a, dataUrl: loaded[a.imageKey] }
        }
        return a
      })
      setLocalAttachments(updated)
    }).catch(err => console.error('IndexedDB 이미지 로드 실패', err))
  }, [attKeys])

  const handlePrint = () => {
    window.print()
  }

  return createPortal(
    <div className="print-approval-overlay">
      {/* 화면용 컨트롤 바 (인쇄 시 숨김) */}
      <div className="print-control-bar no-print">
        <div className="print-control-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap' }}>타이틀</span>
            <input
              value={formTitle}
              onChange={e => {
                setFormTitle(e.target.value)
                if (data.isGeneral) localStorage.setItem('pf_title_general', e.target.value)
                else localStorage.setItem('pf_title', e.target.value)
              }}
              className="pf-header-input"
              style={{ width: 160 }}
            />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap', marginLeft: 8 }}>가로(mm)</span>
            <input
              type="number"
              value={printWidth}
              onChange={e => { const v = Number(e.target.value) || 210; setPrintWidth(v); localStorage.setItem('pf_width', String(v)) }}
              className="pf-header-input"
              style={{ width: 70, textAlign: 'center' }}
              min={100}
              max={420}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="print-btn-action" onClick={handlePrint}>
              <Printer size={16} />
              인쇄하기
            </button>
            <button className="print-btn-close" onClick={onClose}>
              <X size={16} />
              닫기
            </button>
          </div>
        </div>
      </div>

      {/* ═══ A4 용지 ═══ */}
      <div className="print-page-wrapper">
        <div ref={printRef} className="print-a4-page" style={{ display: 'flex', flexDirection: 'column', width: `${printWidth}mm`, height: `${Math.round(printWidth * 297 / 210)}mm`, minHeight: `${Math.round(printWidth * 297 / 210)}mm`, maxHeight: `${Math.round(printWidth * 297 / 210)}mm`, maxWidth: '100%' }}>

          {/* ── 결재란 (우측 상단) ── */}
          <div className="pf-stamp-area">
            <table className="pf-stamp-table" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '50%' }} />
                <col style={{ width: '50%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>{data.applicantPosition || '담 당'}</th>
                  <th>{data.approverPosition || '승인자'}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="pf-stamp-cell">
                    {(() => {
                      const isApproved = ['approved','expensed','toResolve','confirming','completed'].includes(data.approvalStatus || '')
                      if (isApproved && data.applicantSealImg) return <img src={data.applicantSealImg} alt="담당 도장" className="pf-stamp-img" />
                      if (data.applicant) return <span className="pf-stamp-name">{data.applicant}</span>
                      return null
                    })()}
                  </td>
                  <td className="pf-stamp-cell">
                    {(() => {
                      const isApproved = ['approved','expensed','toResolve','confirming','completed'].includes(data.approvalStatus || '')
                      if (!isApproved) return null
                      if (data.approverSealImg) return <img src={data.approverSealImg} alt="승인자 도장" className="pf-stamp-img" />
                      if (data.approver) return <span className="pf-stamp-name">{data.approver}</span>
                      return null
                    })()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── 타이틀 ── */}
          <h1 className="pf-title">{formTitle}</h1>

          {/* ── 기본 정보 테이블 ── */}
          {data.isTransfer ? (
            /* ── 대체결의서 레이아웃 ── */
            <>
            <table className="pf-main-table">
              <colgroup>
                <col style={{ width: '14%' }} />
                <col style={{ width: '86%' }} />
              </colgroup>
              <tbody>
                <tr>
                  <th>대체일자</th>
                  <td>{data.expenseDate || data.date || ''}</td>
                </tr>
                <tr>
                  <th>수신항목</th>
                  <td>{data.debitDetail ? `${data.debitAccount}(${data.debitDetail})` : (data.debitAccount || '')}</td>
                </tr>
                <tr>
                  <th>송신항목</th>
                  <td>{data.creditDetail ? `${data.creditAccount}(${data.creditDetail})` : (data.creditAccount || '')}</td>
                </tr>
                <tr>
                  <th>대체내용</th>
                  <td>{data.transferContent || data.counter || ''}</td>
                </tr>
                <tr>
                  <th>적　　　요</th>
                  <td>{data.description || ''}</td>
                </tr>
              </tbody>
            </table>

            {/* ── 대체금액 테이블 ── */}
            <table className="pf-amount-table">
              <colgroup>
                <col style={{ width: '14%' }} />
                <col style={{ width: '86%' }} />
              </colgroup>
              <tbody>
                <tr>
                  <th>대체금액</th>
                  <td className="pf-amount-cell">
                    <div className="pf-amount-value">
                      ₩ {formatNumber(data.amount || 0)}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* ── 금액 한글 + 결의문 ── */}
            <div className="pf-declaration">
              <div className="pf-amount-korean">
                금 {numberToKorean(data.amount || 0)}
              </div>
              <div className="pf-declaration-text">
                상기 금액을 위와 같이 대체하였음을 결의합니다.
              </div>
            </div>

            {/* ── 비고 테이블 ── */}
            <table className="pf-memo-table" style={{ flex: 1 }}>
              <colgroup>
                <col style={{ width: '14%' }} />
                <col style={{ width: '86%' }} />
              </colgroup>
              <tbody style={{ height: '100%' }}>
                <tr style={{ height: '100%' }}>
                  <th>비 고</th>
                  <td className="pf-memo-cell">
                    {data.memo || ''}
                    {data.approvedMemo && (
                      <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #ccc' }}>
                        <span style={{ fontSize: '9px', fontWeight: 700, color: '#22c55e' }}>승인메모:</span>{' '}
                        <span style={{ fontSize: '10px' }}>{data.approvedMemo}</span>
                      </div>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
            </>
          ) : data.isGeneral ? (
            /* ── 일반품의서 레이아웃 ── */
            <>
            <table className="pf-main-table">
              <colgroup>
                <col style={{ width: '14%' }} />
                <col style={{ width: '36%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '36%' }} />
              </colgroup>
              <tbody>
                <tr>
                  <th>품의일자</th>
                  <td>{data.date || ''}</td>
                  <th>품의유형</th>
                  <td>{data.approvalType || '일반품의'}</td>
                </tr>
                <tr>
                  <th>승인일자</th>
                  <td>{data.approvedDate || ''}</td>
                  <th>증빙구분</th>
                  <td>{data.evidenceType || ''}</td>
                </tr>
                <tr>
                  <th>작 성 자</th>
                  <td>{data.applicant || ''}</td>
                  <th>소&ensp;&ensp;&ensp;속</th>
                  <td>{data.department || ''}</td>
                </tr>
                <tr>
                  <th>제&ensp;&ensp;&ensp;목</th>
                  <td colSpan={3}>{data.itemName || ''}</td>
                </tr>
              </tbody>
            </table>

            {/* ── 품의 요청문 ── */}
            <div className="pf-declaration">
              <div className="pf-declaration-text">
                아래의 내용으로 품의 하오니 허락을 요청 드립니다.
              </div>
            </div>

            {/* ── 설명 (비고) ── */}
            <table className="pf-memo-table" style={{ flex: 1 }}>
              <colgroup>
                <col style={{ width: '14%' }} />
                <col style={{ width: '86%' }} />
              </colgroup>
              <tbody style={{ height: '100%' }}>
                <tr style={{ height: '100%' }}>
                  <th>설&ensp;&ensp;&ensp;명</th>
                  <td className="pf-memo-cell">
                    {data.memo || ''}
                    {data.approvedMemo && (
                      <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #ccc' }}>
                        <span style={{ fontSize: '9px', fontWeight: 700, color: '#22c55e' }}>승인메모:</span>{' '}
                        <span style={{ fontSize: '10px' }}>{data.approvedMemo}</span>
                      </div>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
            </>
          ) : (
            /* ── 지출품의서 레이아웃 ── */
            <>
            <table className="pf-main-table">
              <colgroup>
                <col style={{ width: '14%' }} />
                <col style={{ width: '36%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '36%' }} />
              </colgroup>
              <tbody>
                <tr>
                  <th>품의일자</th>
                  <td>{data.date || ''}</td>
                  <th>계정과목</th>
                  <td>{data.accountName || ''}</td>
                </tr>
                <tr>
                  <th>지출일자</th>
                  <td>{data.expenseDate || ''}</td>
                  <th>증빙구분</th>
                  <td>{data.evidenceType || ''}</td>
                </tr>
                <tr>
                  <th>결제일자</th>
                  <td>{data.settleDate || ''}</td>
                  <th>거 래 처</th>
                  <td>{data.vendor || ''}</td>
                </tr>
                <tr>
                  <th>물 품 명</th>
                  <td>{data.itemName || ''}</td>
                  <th>용&ensp;&ensp;&ensp;도</th>
                  <td>{data.purpose || ''}</td>
                </tr>
              </tbody>
            </table>

            {/* ── 지출금액 테이블 ── */}
            <table className="pf-amount-table">
              <colgroup>
                <col style={{ width: '14%' }} />
                <col style={{ width: '86%' }} />
              </colgroup>
              <tbody>
                <tr>
                  <th>지출금액</th>
                  <td className="pf-amount-cell">
                    <div className="pf-amount-value">
                      ₩ {formatNumber(data.amount || 0)}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* ── 금액 한글 + 결의문 ── */}
            <div className="pf-declaration">
              <div className="pf-amount-korean">
                금 {numberToKorean(data.amount || 0)}
              </div>
              <div className="pf-declaration-text">
                {data.isTransfer
                  ? '상기 금액을 내용과 같이 지출하였음을 결의합니다.'
                  : data.approvalType === '선지출'
                    ? '상기 금액을 내용과 같이 선지출 품의를 올리오니 승인하여 주시기 바랍니다.'
                    : '상기 금액을 내용과 같이 지출하고자 하오니 승인하여 주시기 바랍니다.'}
              </div>
            </div>

            {/* ── 비고 테이블 (페이지 끝까지 채움) ── */}
            <table className="pf-memo-table" style={{ flex: 1 }}>
              <colgroup>
                <col style={{ width: '14%' }} />
                <col style={{ width: '86%' }} />
              </colgroup>
              <tbody style={{ height: '100%' }}>
                <tr style={{ height: '100%' }}>
                  <th>비 고</th>
                  <td className="pf-memo-cell">
                    {data.memo || ''}
                    {data.approvedMemo && (
                      <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #ccc' }}>
                        <span style={{ fontSize: '9px', fontWeight: 700, color: '#22c55e' }}>승인메모:</span>{' '}
                        <span style={{ fontSize: '10px' }}>{data.approvedMemo}</span>
                      </div>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
            </>
          )}

        </div>
      </div>

      {/* ═══ 증빙서류 영역 — 드래그앤드롭으로 같은줄/새줄 배치 ═══ */}
      {localAttachments.length > 0 && attachmentRows.map((row, ri) => (
        <div className="print-page-wrapper" key={ri}>
          <div className="print-evidence-page" style={{ width: `${printWidth}mm`, maxWidth: '100%' }}>
            {/* 증빙서류 헤더 (모든 페이지) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <h1 className="pf-title" style={{ margin: 0, flex: 1 }}>증 빙 서 류</h1>
              {ri === 0 && canEdit && (
                <div className="no-print" style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setEvidencePreview(false)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: !evidencePreview ? '2px solid #4f6ef7' : '1px solid #cbd5e1', background: !evidencePreview ? '#eef2ff' : '#f8fafc', color: !evidencePreview ? '#4f6ef7' : '#64748b' }}>
                    <Edit3 size={12} /> 편집
                  </button>
                  <button onClick={() => setEvidencePreview(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: evidencePreview ? '2px solid #4f6ef7' : '1px solid #cbd5e1', background: evidencePreview ? '#eef2ff' : '#f8fafc', color: evidencePreview ? '#4f6ef7' : '#64748b' }}>
                    <Eye size={12} /> 미리보기
                  </button>
                </div>
              )}
            </div>

            {/* 첫 페이지 상단 드롭 존 */}
            {ri === 0 && canEdit && !evidencePreview && dragIdx !== null && (
              <div
                onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDropTarget({ type: 'new-row', rowIdx: 0 }) }}
                onDragLeave={() => setDropTarget(p => p?.type === 'new-row' && p.rowIdx === 0 ? null : p)}
                onDrop={e => { e.preventDefault(); handleEvidenceDrop(0, 'new-row') }}
                style={{ height: 28, margin: '2px 0', borderRadius: 8, border: dropTarget?.type === 'new-row' && dropTarget.rowIdx === 0 ? '2px dashed #4f6ef7' : '2px dashed transparent', background: dropTarget?.type === 'new-row' && dropTarget.rowIdx === 0 ? '#eef2ff' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
              >
                {dropTarget?.type === 'new-row' && dropTarget.rowIdx === 0 && <span style={{ fontSize: 11, color: '#4f6ef7', fontWeight: 700 }}><Pin size={11} style={{ display: 'inline', verticalAlign: '-1px' }} /> 새 줄에 놓기</span>}
              </div>
            )}

            {/* 행 내용 (같은 줄 드롭존) */}
            <div
              onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (dragIdx !== null) setDropTarget({ type: 'same-row', rowIdx: ri }) }}
              onDragLeave={() => setDropTarget(p => p?.type === 'same-row' && p.rowIdx === ri ? null : p)}
              onDrop={e => { e.preventDefault(); handleEvidenceDrop(ri, 'same-row') }}
              style={{ display: 'flex', gap: 12, padding: 8, borderRadius: 10, transition: 'all 0.15s', border: dropTarget?.type === 'same-row' && dropTarget.rowIdx === ri ? '2px dashed #22c55e' : '2px solid transparent', background: dropTarget?.type === 'same-row' && dropTarget.rowIdx === ri ? '#f0fdf4' : 'transparent', position: 'relative' }}
            >
              {dropTarget?.type === 'same-row' && dropTarget.rowIdx === ri && (
                <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', fontSize: 10, color: '#22c55e', fontWeight: 700, background: '#f0fdf4', padding: '1px 8px', borderRadius: 4, border: '1px solid #bbf7d0', zIndex: 2 }}>같은 줄에 놓기</div>
              )}
              {row.map(({ att, fi }) => (
                <div
                  key={fi}
                  draggable={canEdit && !evidencePreview}
                  onDragStart={e => { if (!canEdit) return; setDragIdx(fi); e.dataTransfer.effectAllowed = 'move' }}
                  onDragEnd={() => { setDragIdx(null); setDropTarget(null) }}
                  style={{ flex: 1, textAlign: 'center', cursor: canEdit && !evidencePreview ? 'grab' : 'default', opacity: dragIdx === fi ? 0.4 : 1, transition: 'opacity 0.15s' }}
                >
                  {/* 편집 컨트롤 */}
                  {canEdit && !evidencePreview && (
                    <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, padding: '4px 8px', background: '#f1f5f9', borderRadius: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, color: '#94a3b8', cursor: 'grab' }}>⠿</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>타이틀</span>
                      <input value={att.title} onChange={e => { const u = [...localAttachments]; u[fi] = { ...u[fi], title: e.target.value }; setLocalAttachments(u); onUpdateAttachments?.(u) }} className="pf-header-input" style={{ width: 120, fontSize: 11 }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>가로</span>
                      <input type="number" value={att.printWidth} onChange={e => { const u = [...localAttachments]; u[fi] = { ...u[fi], printWidth: Number(e.target.value) || 150 }; setLocalAttachments(u); onUpdateAttachments?.(u) }} className="pf-header-input" style={{ width: 50, textAlign: 'center', fontSize: 11 }} min={50} max={800} />
                      <button onClick={() => { if (!confirm('삭제하시겠습니까?')) return; const u = localAttachments.filter((_, i) => i !== fi); setLocalAttachments(u); onUpdateAttachments?.(u) }} style={{ fontSize: 10, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>삭제</button>
                    </div>
                  )}
                  {/* 타이틀 (이미지 좌측 상단) */}
                  {att.title && <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 6, textAlign: 'left' }}>{att.title}</div>}
                  {/* 이미지 또는 파일 */}
                  <div style={{ textAlign: 'center', marginBottom: 12 }}>
                    {att.dataUrl && (att.type?.startsWith('image/') || att.dataUrl.startsWith('data:image')) ? (
                      <img src={att.dataUrl} alt={att.title} style={{ width: att.printWidth, maxWidth: '100%', objectFit: 'contain', border: '1px solid #e2e8f0', borderRadius: 4 }} />
                    ) : (
                      <div style={{ display: 'inline-block', padding: '10px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, color: '#64748b' }}><Paperclip size={11} style={{ display: 'inline', verticalAlign: '-1px' }} /> {att.name}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 행 사이 드롭 존 (새 줄) */}
            {canEdit && !evidencePreview && dragIdx !== null && (
              <div
                onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDropTarget({ type: 'new-row', rowIdx: ri + 1 }) }}
                onDragLeave={() => setDropTarget(p => p?.type === 'new-row' && p.rowIdx === ri + 1 ? null : p)}
                onDrop={e => { e.preventDefault(); handleEvidenceDrop(ri + 1, 'new-row') }}
                style={{ height: 28, margin: '2px 0', borderRadius: 8, border: dropTarget?.type === 'new-row' && dropTarget.rowIdx === ri + 1 ? '2px dashed #4f6ef7' : '2px dashed transparent', background: dropTarget?.type === 'new-row' && dropTarget.rowIdx === ri + 1 ? '#eef2ff' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
              >
                {dropTarget?.type === 'new-row' && dropTarget.rowIdx === ri + 1 && <span style={{ fontSize: 11, color: '#4f6ef7', fontWeight: 700 }}><Pin size={11} style={{ display: 'inline', verticalAlign: '-1px' }} /> 새 줄에 놓기</span>}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* 하단 액션 버튼 바 (인쇄 시 숨김) */}
      {actions && (
        <div className="print-bottom-bar no-print">
          {actions}
        </div>
      )}
    </div>,
    document.body,
  )
}
