import { useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { formatNumber } from '../../utils/format'
import { X, Printer } from 'lucide-react'

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

interface PrintApprovalData {
  // 기본 정보
  date?: string           // 품의일자
  expenseDate?: string    // 지출일지
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
}

interface PrintApprovalFormProps {
  data: PrintApprovalData
  onClose: () => void
  actions?: ReactNode
}

export function PrintApprovalForm({ data, onClose, actions }: PrintApprovalFormProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    window.print()
  }

  return createPortal(
    <div className="print-approval-overlay">
      {/* 화면용 컨트롤 바 (인쇄 시 숨김) */}
      <div className="print-control-bar no-print">
        <div className="print-control-inner">
          <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>
            지출품의서 미리보기
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="print-btn-action" onClick={handlePrint}>
              <Printer size={15} />
              인쇄하기
            </button>
            <button className="print-btn-close" onClick={onClose}>
              <X size={15} />
              닫기
            </button>
          </div>
        </div>
      </div>

      {/* ═══ A4 용지 ═══ */}
      <div className="print-page-wrapper">
        <div ref={printRef} className="print-a4-page" style={{ display: 'flex', flexDirection: 'column' }}>

          {/* ── 결재란 (우측 상단) ── */}
          <div className="pf-stamp-area">
            <table className="pf-stamp-table" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '50%' }} />
                <col style={{ width: '50%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>담 당</th>
                  <th>상임이사</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="pf-stamp-cell">
                    {data.applicantSealImg ? (
                      <img src={data.applicantSealImg} alt="담당 도장" className="pf-stamp-img" />
                    ) : data.applicant ? (
                      <span className="pf-stamp-name">{data.applicant}</span>
                    ) : null}
                  </td>
                  <td className="pf-stamp-cell">
                    {data.approverSealImg ? (
                      <img src={data.approverSealImg} alt="상임이사 도장" className="pf-stamp-img" />
                    ) : data.approver ? (
                      <span className="pf-stamp-name">{data.approver}</span>
                    ) : null}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── 타이틀 ── */}
          <h1 className="pf-title">지 출 품 의 서</h1>

          {/* ── 기본 정보 테이블 ── */}
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
                <th>지출일지</th>
                <td>{data.expenseDate || ''}</td>
                <th>증빙구분</th>
                <td>{data.evidenceType || ''}</td>
              </tr>
              <tr>
                <th>결제일자</th>
                <td>{data.settleDate || ''}</td>
                <th>거래처</th>
                <td>{data.vendor || ''}</td>
              </tr>
              <tr>
                <th>물 품 명</th>
                <td>{data.itemName || ''}</td>
                <th>용 도</th>
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
              상기 금액을 용도에 따라 지출하였음을 결의합니다.
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
                </td>
              </tr>
            </tbody>
          </table>

        </div>
      </div>

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
