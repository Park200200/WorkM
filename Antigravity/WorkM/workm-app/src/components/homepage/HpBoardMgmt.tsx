import { useState, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { getItem, setItem } from '../../utils/storage'
import {
  Plus, X, Save, Trash2, Edit3, ClipboardList, Eye, User, Calendar,
  MessageSquare,
} from 'lucide-react'

/* ── 타입 ── */
interface Reply { author: string; content: string; date: string }
interface BoardItem {
  id: string; cat: string; title: string; content: string
  author: string; regDate: string; views: number
  replies?: Reply[]
  // 공통 옵션
  img?: string; imgCap?: string; pwd?: string; featured?: boolean
  // FAQ 전용
  ans?: string; ansImg?: string; ansImgCap?: string

}

const STORAGE_KEY = 'board_items'

const ALL_CAT_MAP: Record<string,string> = {
  notice:'📢 공지사항', news:'📰 뉴스', free:'💬 자유게시판',
  qna:'❓ Q&A', faq:'📋 FAQ'
}
const CAT_COLOR: Record<string,string> = {
  notice:'#ef4444', news:'#4f6ef7', free:'#f59e0b', qna:'#8b5cf6', faq:'#06b6d4'
}
/* 솔루션 ID → 게시판 카테고리 매핑 (board→free) */
const SOL_TO_CAT: Record<string,string> = {
  notice:'notice', news:'news', board:'free', qna:'qna', faq:'faq'
}
const BOARD_SOL_IDS = Object.keys(SOL_TO_CAT)

/* ── 샘플 데이터 (카테고리별 10개) ── */
const SAMPLE: BoardItem[] = [
  /* ── 공지사항 (notice) ── */
  { id:'n1', cat:'notice', title:'2026년 봄 신제품 출시 안내', content:'2026 봄 시즌 블라인드 및 커튼 전 라인업이 새롭게 출시됩니다.', author:'관리자', regDate:'2026-04-15', views:1520 },
  { id:'n2', cat:'notice', title:'고객센터 운영시간 변경 안내', content:'4월부터 고객센터 운영시간이 09:00~18:00으로 변경됩니다.', author:'관리자', regDate:'2026-04-12', views:980 },
  { id:'n3', cat:'notice', title:'시스템 정기점검 안내 (4/20)', content:'4월 20일 02:00~06:00 서버 정기점검이 예정되어 있습니다.', author:'관리자', regDate:'2026-04-10', views:756 },
  { id:'n4', cat:'notice', title:'개인정보처리방침 개정 안내', content:'2026년 5월 1일부터 개정된 개인정보처리방침이 적용됩니다.', author:'관리자', regDate:'2026-04-08', views:645 },
  { id:'n5', cat:'notice', title:'2026 상반기 할인 이벤트 종료 안내', content:'많은 성원 감사드리며, 할인 이벤트가 4월 30일부로 종료됩니다.', author:'관리자', regDate:'2026-04-05', views:1230 },
  { id:'n6', cat:'notice', title:'신규 시공팀 배정 안내', content:'서울·경기 지역 시공팀이 추가 배정되어 더 빠른 시공이 가능합니다.', author:'관리자', regDate:'2026-04-02', views:534 },
  { id:'n7', cat:'notice', title:'홈페이지 리뉴얼 오픈 안내', content:'더 편리하고 빠른 서비스를 위해 홈페이지가 리뉴얼 오픈되었습니다.', author:'관리자', regDate:'2026-03-28', views:2100 },
  { id:'n8', cat:'notice', title:'설 연휴 배송 일정 안내', content:'설 연휴 기간(1/27~1/30) 배송이 일시 중단됩니다.', author:'관리자', regDate:'2026-03-25', views:890 },
  { id:'n9', cat:'notice', title:'제품 보증기간 연장 안내', content:'2026년 1월부터 전 제품 보증기간이 2년에서 3년으로 연장됩니다.', author:'관리자', regDate:'2026-03-20', views:1450 },
  { id:'n10', cat:'notice', title:'카카오톡 상담 채널 오픈', content:'카카오톡 채널을 통해 실시간 상담이 가능합니다. @윈테리어핏 검색!', author:'관리자', regDate:'2026-03-15', views:1780 },

  /* ── 뉴스 (news) ── */
  { id:'nw1', cat:'news', title:'2026 서울 리빙디자인페어 참가 확정', content:'올해 리빙디자인페어에 단독 부스로 참가하여 신제품을 선보입니다.', author:'언론팀', regDate:'2026-04-14', views:2340 },
  { id:'nw2', cat:'news', title:'친환경 원단 KC 인증 획득', content:'당사 커튼 원단이 KC 친환경 인증을 획득하였습니다.', author:'언론팀', regDate:'2026-04-11', views:1890 },
  { id:'nw3', cat:'news', title:'스마트홈 연동 블라인드 출시', content:'구글홈, 아마존 알렉사와 연동 가능한 스마트 블라인드를 출시합니다.', author:'언론팀', regDate:'2026-04-09', views:3120 },
  { id:'nw4', cat:'news', title:'일본 시장 진출 MOU 체결', content:'일본 최대 인테리어 유통사와 전략적 파트너십을 체결했습니다.', author:'언론팀', regDate:'2026-04-06', views:2780 },
  { id:'nw5', cat:'news', title:'2025 고객만족도 1위 수상', content:'한국소비자평가원 주관 고객만족도 조사에서 블라인드 부문 1위를 수상했습니다.', author:'언론팀', regDate:'2026-04-03', views:4560 },
  { id:'nw6', cat:'news', title:'TV 방송 협찬 – MBC 예능 출연', content:'MBC 인기 예능 프로그램에 당사 제품이 협찬으로 소개되었습니다.', author:'언론팀', regDate:'2026-03-30', views:5230 },
  { id:'nw7', cat:'news', title:'부산 직영점 오픈 소식', content:'부산 해운대에 직영 쇼룸이 새롭게 오픈합니다. 방문을 환영합니다!', author:'언론팀', regDate:'2026-03-26', views:1560 },
  { id:'nw8', cat:'news', title:'올해의 인테리어 브랜드 선정', content:'2026 대한민국 브랜드대상 인테리어 부문에 선정되었습니다.', author:'언론팀', regDate:'2026-03-22', views:3890 },
  { id:'nw9', cat:'news', title:'유튜브 채널 구독자 10만 돌파', content:'인테리어 꿀팁 유튜브 채널이 구독자 10만 명을 돌파했습니다.', author:'언론팀', regDate:'2026-03-18', views:2450 },
  { id:'nw10', cat:'news', title:'ESG 경영 보고서 발간', content:'지속가능경영 보고서를 발간하며 친환경 제조 공정을 소개합니다.', author:'언론팀', regDate:'2026-03-14', views:1120 },

  /* ── 자유게시판 (free) ── */
  { id:'f1', cat:'free', title:'거실 블라인드 추천 부탁드려요', content:'25평대 아파트 거실에 어울리는 블라인드 추천 부탁드립니다. 아이가 있어서 안전한 제품 원해요.', author:'행복한집', regDate:'2026-04-13', views:456 },
  { id:'f2', cat:'free', title:'시공 완료 후기 – 정말 만족합니다!', content:'지난주 시공 받았는데 정말 만족합니다. 친절한 설치기사님 감사해요!', author:'인테리어러', regDate:'2026-04-10', views:834 },
  { id:'f3', cat:'free', title:'롤스크린 vs 블라인드 고민 중', content:'안방에 롤스크린이 나을지 블라인드가 나을지 고민됩니다. 경험 공유해주세요.', author:'흰구름', regDate:'2026-04-08', views:623 },
  { id:'f4', cat:'free', title:'아이 방 커튼 색상 추천', content:'7살 아들 방에 어울리는 커튼 색상 추천 부탁합니다. 파란계열 고민 중이에요.', author:'엄마곰', regDate:'2026-04-06', views:312 },
  { id:'f5', cat:'free', title:'사무실 블라인드 대량 주문 가능할까요?', content:'사무실 이전 예정인데 30개 이상 대량주문 시 할인이 되는지 궁금합니다.', author:'사무장', regDate:'2026-04-04', views:278 },
  { id:'f6', cat:'free', title:'여름에 차열 효과 좋은 제품은?', content:'서향 집이라 여름에 너무 더운데 차열 효과가 좋은 블라인드가 있을까요?', author:'태양의후예', regDate:'2026-04-01', views:567 },
  { id:'f7', cat:'free', title:'셀프 설치 후기 공유합니다', content:'유튜브 보고 셀프 설치 해봤는데 생각보다 쉬웠어요! 사진 첨부합니다.', author:'DIY마스터', regDate:'2026-03-28', views:945 },
  { id:'f8', cat:'free', title:'세탁 가능한 커튼 있나요?', content:'아이가 있어서 자주 세탁해야 하는데 세탁기 돌려도 되는 커튼이 있을까요?', author:'깨끗한집', regDate:'2026-03-25', views:389 },
  { id:'f9', cat:'free', title:'암막 커튼 추천 부탁드려요', content:'야간 근무자입니다. 낮에 숙면할 수 있도록 완전차단 암막 커튼 추천해주세요.', author:'올빼미', regDate:'2026-03-22', views:712 },
  { id:'f10', cat:'free', title:'블라인드 청소 꿀팁 공유', content:'블라인드 먼지 제거에 양말을 활용하면 정말 깨끗해져요! 방법 공유합니다.', author:'살림왕', regDate:'2026-03-18', views:1230 },

  /* ── Q&A (qna) ── */
  { id:'q1', cat:'qna', title:'블라인드 설치 높이 측정 방법은?', content:'창문 안쪽 설치 시 정확한 측정 방법이 궁금합니다.', author:'신규고객', regDate:'2026-04-14', views:1120, replies:[{author:'관리자', content:'창프레임 내부 상단에서 하단까지 측정하시면 됩니다. 좌우 폭도 상/중/하 3곳 측정 후 최소값을 적용하세요.', date:'2026-04-14'}] },
  { id:'q2', cat:'qna', title:'A/S 신청은 어디서 하나요?', content:'제품 하자가 있는 것 같은데 A/S 접수 방법을 알려주세요.', author:'김민수', regDate:'2026-04-12', views:876, replies:[{author:'관리자', content:'홈페이지 문의하기 또는 고객센터 1588-0000으로 접수 가능합니다.', date:'2026-04-12'}] },
  { id:'q3', cat:'qna', title:'주문 후 배송까지 얼마나 걸리나요?', content:'주문 완료했는데 배송 소요 기간을 알고 싶습니다.', author:'이지현', regDate:'2026-04-10', views:654 },
  { id:'q4', cat:'qna', title:'설치비가 별도인가요?', content:'제품 가격에 설치비가 포함되어 있는지 궁금합니다.', author:'박정우', regDate:'2026-04-08', views:1340, replies:[{author:'관리자', content:'네, 기본 설치비는 제품 가격에 포함되어 있습니다. 특수 시공의 경우 별도 안내드립니다.', date:'2026-04-08'}] },
  { id:'q5', cat:'qna', title:'결제 방법에는 어떤 것이 있나요?', content:'카드 결제와 무통장입금 외에 다른 결제 수단이 있는지 궁금합니다.', author:'최은지', regDate:'2026-04-06', views:432 },
  { id:'q6', cat:'qna', title:'견적은 무료인가요?', content:'방문 견적 비용이 발생하는지 알고 싶습니다.', author:'홍길동', regDate:'2026-04-03', views:890, replies:[{author:'관리자', content:'네, 방문 견적은 완전 무료입니다. 부담 없이 신청해주세요!', date:'2026-04-03'}] },
  { id:'q7', cat:'qna', title:'반품/교환 절차는 어떻게 되나요?', content:'맞춤 제작 제품도 반품이 가능한지 궁금합니다.', author:'오수진', regDate:'2026-03-30', views:567 },
  { id:'q8', cat:'qna', title:'모터 블라인드 리모컨 추가 구매 가능한가요?', content:'리모컨을 분실했는데 별도로 구매할 수 있을까요?', author:'장태훈', regDate:'2026-03-26', views:345, replies:[{author:'관리자', content:'네, 리모컨 별도 구매 가능합니다. 모델명을 확인하여 고객센터로 문의해주세요.', date:'2026-03-27'}] },
  { id:'q9', cat:'qna', title:'시공 당일 부재 시 어떻게 되나요?', content:'시공 예약일에 외출해야 할 수도 있는데 일정 변경이 가능한가요?', author:'윤서연', regDate:'2026-03-22', views:234 },
  { id:'q10', cat:'qna', title:'커튼 원단 샘플을 받아볼 수 있나요?', content:'온라인으로 원단 샘플을 신청할 수 있는지 궁금합니다.', author:'정하늘', regDate:'2026-03-18', views:678, replies:[{author:'관리자', content:'네, 홈페이지에서 최대 5종까지 무료 샘플 신청이 가능합니다.', date:'2026-03-19'}] },

  /* ── FAQ (faq) ── */
  { id:'fq1', cat:'faq', title:'방문 견적은 무료인가요?', content:'네, 방문 견적은 완전 무료이며 전문 컨설턴트가 직접 방문합니다.', author:'관리자', regDate:'2026-01-10', views:4560, ans:'네, 방문 견적은 서울·경기·인천 전 지역 무료입니다. 예약 후 전문 컨설턴트가 방문하여 정확한 견적을 안내드립니다.' },
  { id:'fq2', cat:'faq', title:'설치까지 걸리는 기간은?', content:'견적 확정 후 통상 3~7 영업일 이내에 설치 완료됩니다.', author:'관리자', regDate:'2026-01-10', views:3890, ans:'맞춤 제작 제품은 확정 후 5~7 영업일, 기성 제품은 2~3 영업일 내 설치됩니다.' },
  { id:'fq3', cat:'faq', title:'A/S 보증기간은 얼마인가요?', content:'전 제품 3년 무상 A/S를 보장합니다.', author:'관리자', regDate:'2026-01-10', views:3450, ans:'2026년부터 전 제품 보증기간이 3년으로 연장되었습니다. 모터 제품은 5년 보증입니다.' },
  { id:'fq4', cat:'faq', title:'어떤 결제 방법을 지원하나요?', content:'카드, 무통장입금, 간편결제 등 다양한 결제 수단을 지원합니다.', author:'관리자', regDate:'2026-01-10', views:2340, ans:'신용카드(무이자 할부 가능), 무통장입금, 카카오페이, 네이버페이를 지원합니다.' },
  { id:'fq5', cat:'faq', title:'맞춤 제작이 가능한가요?', content:'네, 고객님의 창문 크기에 맞는 맞춤 제작을 지원합니다.', author:'관리자', regDate:'2026-01-10', views:2890, ans:'밀리미터 단위의 정밀 맞춤 제작이 가능하며, 모양·색상·원단도 선택 가능합니다.' },
  { id:'fq6', cat:'faq', title:'반품/교환이 가능한가요?', content:'제품 하자 시 무상 교환, 단순 변심 시 조건부 반품이 가능합니다.', author:'관리자', regDate:'2026-01-10', views:1980, ans:'제품 하자 시 무상 교환됩니다. 맞춤 제작 제품은 단순 변심 반품이 불가하며, 기성 제품은 미개봉 시 7일 이내 반품 가능합니다.' },
  { id:'fq7', cat:'faq', title:'원단 샘플을 받아볼 수 있나요?', content:'네, 온라인으로 최대 5종까지 무료 샘플 신청이 가능합니다.', author:'관리자', regDate:'2026-01-10', views:1560, ans:'홈페이지 샘플 신청 메뉴에서 최대 5종까지 무료 신청 가능합니다. 배송은 1~2영업일 소요됩니다.' },
  { id:'fq8', cat:'faq', title:'시공 범위에 제한이 있나요?', content:'서울·경기·인천은 직영팀, 전국 나머지 지역은 협력사 시공이 가능합니다.', author:'관리자', regDate:'2026-01-10', views:1230, ans:'수도권은 자사 직영팀이, 지방은 전국 협력 시공팀이 방문 설치합니다. 제주·도서산간은 별도 문의해주세요.' },
  { id:'fq9', cat:'faq', title:'스마트 블라인드의 전원은 어떻게 공급하나요?', content:'충전식 배터리 또는 콘센트 연결 두 가지 방식을 지원합니다.', author:'관리자', regDate:'2026-01-10', views:2670, ans:'충전식(USB-C, 1회 충전 약 6개월)과 어댑터 상시전원 방식 중 선택할 수 있습니다.' },
  { id:'fq10', cat:'faq', title:'기존 커튼/블라인드 철거도 해주나요?', content:'네, 시공 시 기존 제품 무상 철거 서비스를 제공합니다.', author:'관리자', regDate:'2026-01-10', views:1890, ans:'신규 시공 시 기존 블라인드/커튼 무상 철거해드립니다. 철거만 원하시는 경우 별도 비용이 발생합니다.' },
]

const inputCls = 'w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors'

/* ══════════════════════════════════════ */
export function HpBoardMgmt() {
  const [items, setItems] = useState<BoardItem[]>(() => {
    const saved = getItem<BoardItem[]>(STORAGE_KEY, null)
    if (saved) return saved
    // 샘플 데이터를 localStorage에도 저장 (홈페이지 뷰에서 접근 가능)
    setItem(STORAGE_KEY, SAMPLE)
    return SAMPLE
  })
  const [cat, setCat] = useState('all')

  /* ── 게시판 카테고리: 항상 전체 표시 ── */
  const activeCats = useMemo(() => Object.keys(ALL_CAT_MAP), [])

  const CAT_MAP = useMemo(() => {
    const map: Record<string,string> = { all: '전체' }
    activeCats.forEach(k => { if (ALL_CAT_MAP[k]) map[k] = ALL_CAT_MAP[k] })
    return map
  }, [activeCats])
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string|null>(null)
  const [detailId, setDetailId] = useState<string|null>(null)

  /* 폼 상태 */
  const [form, setForm] = useState({
    cat:'notice', title:'', content:'', author:'관리자',
    img:'', imgCap:'', pwd:'', featured:false,
    ans:'', ansImg:'', ansImgCap:'',
  })
  const [replyInput, setReplyInput] = useState('')

  const persist = useCallback((list: BoardItem[]) => { setItems(list); setItem(STORAGE_KEY, list) }, [])

  /* 필터 */
  const filtered = useMemo(() => {
    let list = items
    if (cat !== 'all') list = list.filter(i => i.cat === cat)
    return list.sort((a,b) => new Date(b.regDate).getTime() - new Date(a.regDate).getTime())
  }, [items, cat])

  /* 모달 열기 */
  const openAdd = () => {
    setEditId(null)
    setForm({ cat: cat !== 'all' ? cat : (activeCats[0] || 'notice'), title:'', content:'', author:'관리자', img:'', imgCap:'', pwd:'', featured:false, ans:'', ansImg:'', ansImgCap:'', views:'0' })
    setShowModal(true)
  }
  const openEdit = (id: string) => {
    const it = items.find(x => x.id === id)
    if (!it) return
    setEditId(id)
    setForm({ cat:it.cat, title:it.title, content:it.content, author:it.author, img:it.img||'', imgCap:it.imgCap||'', pwd:it.pwd||'', featured:!!it.featured, ans:it.ans||'', ansImg:it.ansImg||'', ansImgCap:it.ansImgCap||'', views:String(it.views||0) })
    setDetailId(null)
    setShowModal(true)
  }

  /* 저장 */
  const save = () => {
    const fc = form.cat
    if (!form.title.trim()) { alert('제목을 입력하세요'); return }
    const now = new Date().toISOString().slice(0,10)
    const base: any = { ...form }
    // FAQ: 작성자 = 관리자
    if (fc === 'faq') base.author = '관리자'
    if (editId) {
      persist(items.map(it => it.id === editId ? { ...it, ...base, views: parseInt(form.views)||0 } : it))
    } else {
      const newItem: BoardItem = { id:'b'+Date.now(), ...base, regDate:now, views:0, replies:[] }
      persist([newItem, ...items])
    }
    setShowModal(false)
  }

  /* 삭제 */
  const deleteItem = (id: string) => {
    if (!confirm('이 게시글을 삭제하시겠습니까?')) return
    persist(items.filter(x => x.id !== id))
    setDetailId(null)
  }

  /* 답변 추가 (Q&A) */
  const addReply = (id: string) => {
    if (!replyInput.trim()) return
    const now = new Date().toISOString().slice(0,10)
    persist(items.map(it => {
      if (it.id !== id) return it
      return { ...it, replies: [...(it.replies||[]), { author:'관리자', content:replyInput.trim(), date:now }] }
    }))
    setReplyInput('')
  }

  /* 답변 삭제 */
  const deleteReply = (itemId: string, replyIdx: number) => {
    persist(items.map(it => {
      if (it.id !== itemId) return it
      return { ...it, replies: (it.replies||[]).filter((_,i) => i !== replyIdx) }
    }))
  }



  const detailItem = detailId ? items.find(x => x.id === detailId) : null

  return (
    <div className="animate-fadeIn">
      {/* ═══ 헤더 ═══ */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'linear-gradient(135deg,#22c55e,#16a34a)' }}>
            <ClipboardList size={18} className="text-white" />
          </div>
          <div>
            <div className="text-lg font-extrabold text-[var(--text-primary)]">게시판 관리</div>
            <div className="text-[11.5px] text-[var(--text-muted)]">{activeCats.map(k => (ALL_CAT_MAP[k]||'').replace(/^[^\s]+ /, '')).join(' · ')} 관리</div>
          </div>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-[13px] font-bold cursor-pointer border-none transition-colors"
          style={{ background:'linear-gradient(135deg,#22c55e,#16a34a)' }}>
          <Plus size={14} /> 게시글 작성
        </button>
      </div>

      {/* ═══ 카테고리 탭 ═══ */}
      <div className="flex items-center gap-1.5 flex-wrap mb-4 pb-3.5 border-b border-[var(--border-default)]">
        <div className="flex gap-1.5 flex-1 overflow-x-auto" style={{ scrollbarWidth:'none' }}>
          {Object.entries(CAT_MAP).map(([k,label]) => (
            <button key={k} onClick={() => setCat(k)}
              className="px-4 py-1.5 rounded-full text-[12px] font-bold cursor-pointer transition-all whitespace-nowrap shrink-0 border-none"
              style={{
                background: cat === k ? '#22c55e' : 'transparent',
                border: `1.5px solid ${cat === k ? '#22c55e' : 'var(--border-default)'}`,
                color: cat === k ? '#fff' : 'var(--text-secondary)',
              }}>
              {label}
            </button>
          ))}
        </div>
        <span className="text-[12px] text-[var(--text-muted)] whitespace-nowrap shrink-0">총 {filtered.length}건</span>
      </div>

      {/* ═══ 게시글 목록 테이블 ═══ */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center text-[var(--text-muted)]">
          <div className="text-4xl mb-3">📋</div>
          <div className="text-sm font-bold">등록된 게시글이 없습니다</div>
        </div>
      ) : (
        <div className="border border-[var(--border-default)] rounded-xl overflow-hidden">
          <table className="w-full border-collapse" style={{ tableLayout:'fixed' }}>
            <thead>
              <tr className="border-b-2 border-[var(--border-default)]">
                <th className="px-3 py-2.5 text-left text-[11px] font-bold text-[var(--text-muted)] w-24">카테고리</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-bold text-[var(--text-muted)]">제목</th>
                <th className="px-3 py-2.5 text-center text-[11px] font-bold text-[var(--text-muted)] w-[70px]">작성자</th>
                <th className="px-3 py-2.5 text-center text-[11px] font-bold text-[var(--text-muted)] w-[90px]">날짜</th>
                <th className="px-3 py-2.5 text-center text-[11px] font-bold text-[var(--text-muted)] w-[60px]">조회</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(it => (
                <tr key={it.id} onClick={() => setDetailId(it.id)}
                  className="border-b border-[var(--border-default)] cursor-pointer hover:bg-[var(--bg-muted)] transition-colors">
                  <td className="px-3 py-2.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold text-white" style={{ background: CAT_COLOR[it.cat]||'#888' }}>
                      {(CAT_MAP[it.cat]||it.cat).replace(/^[^\s]+ /, '')}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[13px] font-bold text-[var(--text-primary)] truncate">
                    {it.title}
                    {it.cat === 'qna' && (it.replies?.length || 0) > 0 && (
                      <span className="ml-1.5 text-[10px] font-bold text-[#8b5cf6]">[답변 {it.replies!.length}]</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center text-[12px] text-[var(--text-muted)]">{it.author}</td>
                  <td className="px-3 py-2.5 text-center text-[11px] text-[var(--text-muted)]">{it.regDate}</td>
                  <td className="px-3 py-2.5 text-center text-[11px] text-[var(--text-muted)]">{it.views}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ 작성/수정 모달 ═══ */}
      {showModal && createPortal(
        <div className="fixed inset-0 bg-black/55 z-[3000] flex items-center justify-center" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="bg-[var(--bg-surface)] rounded-2xl w-[560px] max-w-[96vw] max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
            {/* 헤더 */}
            <div className="px-5 py-4 border-b border-[var(--border-default)] flex items-center justify-between">
              <div className="text-base font-extrabold text-[var(--text-primary)]">
                {editId
                  ? `편집: ${(CAT_MAP[form.cat]||'').replace(/^[^\s]+ /,'')}`
                  : ({notice:'📢 공지사항 작성', news:'📰 뉴스 작성', free:'💬 자유게시판 작성', qna:'❓ Q&A 작성', faq:'📋 FAQ 등록'} as any)[form.cat] || '게시글 작성'
                }
              </div>
              <button onClick={() => setShowModal(false)} className="text-xl text-[var(--text-muted)] cursor-pointer bg-transparent border-none">×</button>
            </div>
            {/* 카테고리 */}
            <div className="px-5 py-3 border-b border-[var(--border-default)]">
              <select value={form.cat} onChange={e => setForm(f => ({...f, cat: e.target.value}))} disabled={!!editId} className={inputCls}>
                {activeCats.map(k => <option key={k} value={k}>{ALL_CAT_MAP[k]}</option>)}
              </select>
            </div>
            {/* ═══ 카테고리별 필드 ═══ */}
            <div className="overflow-y-auto flex-1 p-5 space-y-3">

              {/* ── 공지/뉴스/자유/Q&A ── */}
              {['notice','news','free','qna'].includes(form.cat) && (
                <>
                  <div>
                    <label className="text-[11.5px] font-bold text-[var(--text-muted)] block mb-1">작성자</label>
                    <input value={form.author} onChange={e => setForm(f => ({...f, author: e.target.value}))} placeholder="이름 또는 닉네임" className={inputCls} />
                  </div>
                  <div>
                    <label className="text-[11.5px] font-bold text-[var(--text-muted)] block mb-1">제목</label>
                    <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="제목을 입력하세요" className={inputCls} />
                  </div>
                  <div>
                    <label className="text-[11.5px] font-bold text-[var(--text-muted)] block mb-1">내용</label>
                    <textarea value={form.content} onChange={e => setForm(f => ({...f, content: e.target.value}))} rows={5} placeholder="내용을 입력하세요..." className={`${inputCls} resize-vertical`} />
                  </div>
                  {/* Q&A 제외: 사진/비밀번호/상단노출 */}
                  {form.cat !== 'qna' && (
                    <>
                      <div>
                        <label className="text-[11.5px] font-bold text-[var(--text-muted)] block mb-1">사진 첨부 <span className="font-normal">(선택)</span></label>
                        <input value={form.img} onChange={e => setForm(f => ({...f, img: e.target.value}))} placeholder="이미지 URL 입력" className={inputCls} />
                        {(form.cat === 'notice' || form.cat === 'news') && (
                          <div className="mt-1.5 flex items-center gap-2">
                            <label className="px-3 py-1.5 rounded-lg bg-[#4f6ef710] border border-[#4f6ef730] text-[#4f6ef7] text-[11.5px] font-bold cursor-pointer hover:bg-[#4f6ef720] transition-colors flex items-center gap-1.5">
                              📎 이미지 파일 선택
                              <input type="file" accept="image/*" className="hidden" onChange={e => {
                                const file = e.target.files?.[0]
                                if (!file) return
                                const reader = new FileReader()
                                reader.onload = () => setForm(f => ({ ...f, img: reader.result as string }))
                                reader.readAsDataURL(file)
                              }} />
                            </label>
                            {form.img && <span className="text-[10px] text-[var(--text-muted)]">✅ 이미지 설정됨</span>}
                          </div>
                        )}
                        {form.img && (
                          <div className="mt-2 relative inline-block">
                            <img src={form.img} alt="" className="max-w-full max-h-[120px] rounded-lg border border-[var(--border-default)]" />
                            <button onClick={() => setForm(f => ({...f, img: ''}))} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center cursor-pointer border-none">×</button>
                          </div>
                        )}
                        <input value={form.imgCap} onChange={e => setForm(f => ({...f, imgCap: e.target.value}))} placeholder="사진 아래 설명 텍스트" className={`${inputCls} mt-1.5`} />
                      </div>
                      <div>
                        <label className="text-[11.5px] font-bold text-[var(--text-muted)] block mb-1">비밀번호</label>
                        <input type="password" value={form.pwd} onChange={e => setForm(f => ({...f, pwd: e.target.value}))} placeholder="삭제 시 사용할 비밀번호" className={inputCls} />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[var(--text-secondary)] font-bold select-none">
                        <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({...f, featured: e.target.checked}))} className="w-4 h-4 cursor-pointer" style={{ accentColor:'#22c55e' }} />
                        상단 노출 (공지 상단에 고정)
                      </label>
                    </>
                  )}
                </>
              )}

              {/* ── FAQ ── */}
              {form.cat === 'faq' && (
                <>
                  <div className="text-[12px] font-bold text-[#4f6ef7] pb-2 border-b-2 border-[#4f6ef720] mb-1">Q (질문)</div>
                  <div>
                    <label className="text-[11.5px] font-bold text-[var(--text-muted)] block mb-1">질문 제목</label>
                    <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="자주 묻는 질문 제목" className={inputCls} />
                  </div>
                  <div>
                    <label className="text-[11.5px] font-bold text-[var(--text-muted)] block mb-1">질문 내용</label>
                    <textarea value={form.content} onChange={e => setForm(f => ({...f, content: e.target.value}))} rows={3} placeholder="질문 내용을 입력하세요..." className={`${inputCls} resize-vertical`} />
                  </div>
                  <div>
                    <label className="text-[11.5px] font-bold text-[var(--text-muted)] block mb-1">Q 사진 <span className="font-normal">(선택)</span></label>
                    <input value={form.img} onChange={e => setForm(f => ({...f, img: e.target.value}))} placeholder="이미지 URL 또는 파일 선택" className={inputCls} />
                    <input value={form.imgCap} onChange={e => setForm(f => ({...f, imgCap: e.target.value}))} placeholder="사진 아래 설명 텍스트" className={`${inputCls} mt-1.5`} />
                  </div>
                  <div className="text-[12px] font-bold text-[#22c55e] pt-2 pb-2 border-b-2 border-[#22c55e20] mb-1">A (답변)</div>
                  <div>
                    <label className="text-[11.5px] font-bold text-[var(--text-muted)] block mb-1">답변 내용</label>
                    <textarea value={form.ans} onChange={e => setForm(f => ({...f, ans: e.target.value}))} rows={3} placeholder="답변 내용을 입력하세요..." className={`${inputCls} resize-vertical`} />
                  </div>
                  <div>
                    <label className="text-[11.5px] font-bold text-[var(--text-muted)] block mb-1">A 사진 <span className="font-normal">(선택)</span></label>
                    <input value={form.ansImg} onChange={e => setForm(f => ({...f, ansImg: e.target.value}))} placeholder="이미지 URL 또는 파일 선택" className={inputCls} />
                    <input value={form.ansImgCap} onChange={e => setForm(f => ({...f, ansImgCap: e.target.value}))} placeholder="사진 아래 설명 텍스트" className={`${inputCls} mt-1.5`} />
                  </div>
                </>
              )}



              {/* ── 조회수 (수정 시) ── */}
              {editId && (
                <div>
                  <label className="text-[11.5px] font-bold text-[var(--text-muted)] block mb-1 flex items-center gap-1"><Eye size={12}/> 조회수</label>
                  <input type="number" min="0" value={form.views} onChange={e => setForm(f => ({...f, views: e.target.value}))} placeholder="0" className={inputCls} />
                </div>
              )}
            </div>
            {/* 버튼 */}
            <div className="px-5 py-4 border-t border-[var(--border-default)] flex justify-end gap-2.5">
              <button onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-lg border border-[var(--border-default)] bg-transparent text-[var(--text-secondary)] text-[13px] font-bold cursor-pointer">취소</button>
              <button onClick={save}
                className="px-6 py-2.5 rounded-lg text-white text-[13px] font-bold cursor-pointer border-none"
                style={{ background:'linear-gradient(135deg,#22c55e,#16a34a)' }}>
                {editId ? '저장' : '등록'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ═══ 상세보기 모달 ═══ */}
      {detailItem && createPortal(
        <div className="fixed inset-0 bg-black/55 z-[3000] flex items-center justify-center" onClick={e => { if (e.target === e.currentTarget) setDetailId(null) }}>
          <div className="bg-[var(--bg-surface)] rounded-2xl w-[660px] max-w-[95vw] max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
            {/* 헤더 */}
            <div className="px-6 py-5 border-b border-[var(--border-default)] flex items-start gap-3.5">
              <div className="flex-1 min-w-0">
                <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-extrabold text-white mb-2" style={{ background: CAT_COLOR[detailItem.cat]||'#888' }}>
                  {CAT_MAP[detailItem.cat]}
                </span>
                <div className="text-lg font-extrabold text-[var(--text-primary)] leading-snug break-words">{detailItem.title}</div>
              </div>
              <button onClick={() => setDetailId(null)} className="text-xl text-[var(--text-muted)] cursor-pointer bg-transparent border-none shrink-0">×</button>
            </div>
            {/* 메타 */}
            <div className="px-6 py-3 border-b border-[var(--border-default)] flex gap-5 flex-wrap">
              <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)]"><User size={13}/> {detailItem.author}</div>
              <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)]"><Calendar size={13}/> {detailItem.regDate}</div>
              <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)]"><Eye size={13}/> 조회 {detailItem.views}</div>
              <div className="flex items-center gap-1.5 ml-auto">
                <button onClick={() => openEdit(detailItem.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-[var(--text-secondary)] text-[12px] font-bold cursor-pointer"><Edit3 size={12}/> 수정</button>
                <button onClick={() => deleteItem(detailItem.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-300/30 bg-red-500/5 text-red-500 text-[12px] font-bold cursor-pointer"><Trash2 size={12}/> 삭제</button>
              </div>
            </div>
            {/* 본문 */}
            <div className="overflow-y-auto flex-1 flex flex-col">
              <div className="p-6">
                <div className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap min-h-[100px]">{detailItem.content}</div>
              </div>



              {/* Q&A 답변 섹션 */}
              {detailItem.cat === 'qna' && (
                <div className="border-t-2 border-[var(--border-default)] bg-[var(--bg-muted)] p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare size={15} className="text-[#8b5cf6]" />
                    <span className="text-[13px] font-extrabold text-[var(--text-primary)]">관리자 답변</span>
                    <span className="text-[11px] font-bold bg-[#8b5cf620] text-[#8b5cf6] px-2 py-0.5 rounded-full">{detailItem.replies?.length||0}</span>
                  </div>
                  {/* 기존 답변 목록 */}
                  <div className="space-y-2.5 mb-4">
                    {(detailItem.replies||[]).map((r,ri) => (
                      <div key={ri} className="bg-[var(--bg-surface)] rounded-xl p-3.5 border border-[var(--border-default)]">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-[#8b5cf6]">{r.author}</span>
                            <span className="text-[10px] text-[var(--text-muted)]">{r.date}</span>
                          </div>
                          <button onClick={() => deleteReply(detailItem.id, ri)}
                            className="text-[var(--text-muted)] cursor-pointer bg-transparent border-none hover:text-red-500"><X size={13}/></button>
                        </div>
                        <div className="text-[13px] text-[var(--text-primary)] whitespace-pre-wrap">{r.content}</div>
                      </div>
                    ))}
                  </div>
                  {/* 새 답변 입력 */}
                  <div className="border-t-2 border-[#8b5cf630] pt-3.5">
                    <div className="text-[11px] font-extrabold text-[#8b5cf6] mb-2">✏️ 답변 등록</div>
                    <div className="bg-[var(--bg-surface)] rounded-xl border border-[#8b5cf640] overflow-hidden">
                      <textarea value={replyInput} onChange={e => setReplyInput(e.target.value)} rows={3} placeholder="답변을 입력하세요..."
                        className="w-full p-3 text-sm bg-transparent text-[var(--text-primary)] resize-none outline-none border-none" />
                      <div className="flex justify-end px-3 pb-3">
                        <button onClick={() => addReply(detailItem.id)}
                          className="px-4 py-1.5 rounded-lg text-white text-[12px] font-bold cursor-pointer border-none"
                          style={{ background:'linear-gradient(135deg,#8b5cf6,#7c3aed)' }}>
                          답변 등록
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
