/* ══════════════════════════════════════════════
   기존 앱과 동일한 샘플 데이터 시드
   ══════════════════════════════════════════════ */
import { getItem, setItem } from './storage'

const SEED_VERSION = 'v6'

export function seedIfEmpty() {
  const prevVersion = getItem<string>('ws_seed_version', '')
  // 이미 시드된 경우 스킵
  if (prevVersion === SEED_VERSION) return

  // 버전 업그레이드 시 사원·부서·업무 데이터 강제 갱신
  if (prevVersion && prevVersion !== SEED_VERSION) {
    localStorage.removeItem('ws_users')
    localStorage.removeItem('ws_departments')
    localStorage.removeItem('ws_tasks')
  }

  // ── 부서 ──
  if (!getItem('ws_departments', null)) {
    setItem('ws_departments', [
      { id: 1, name: '개발팀' },
      { id: 2, name: '마케팅팀' },
      { id: 3, name: '디자인팀' },
      { id: 4, name: '영업팀' },
      { id: 5, name: '경영지원팀' },
      { id: 6, name: '기획팀' },
    ])
  }

  // ── 직급 ──
  if (!getItem('ws_ranks', null)) {
    setItem('ws_ranks', [
      { id: 1, name: '인턴', level: 1 },
      { id: 2, name: '사원', level: 2 },
      { id: 3, name: '주임', level: 3 },
      { id: 4, name: '대리', level: 4 },
      { id: 5, name: '과장', level: 5 },
      { id: 6, name: '차장', level: 6 },
      { id: 7, name: '팀장', level: 7 },
      { id: 8, name: '부장', level: 8 },
      { id: 9, name: '이사', level: 9 },
      { id: 10, name: '대표', level: 10 },
    ])
  }

  // ── 직책 ──
  if (!getItem('ws_positions', null)) {
    setItem('ws_positions', [
      { id: 1, name: '팀원' },
      { id: 2, name: '팀장' },
      { id: 3, name: '프로젝트매니저' },
      { id: 4, name: '선임' },
      { id: 5, name: '수석' },
      { id: 6, name: 'CEO' },
    ])
  }

  // ── 업무결과 ──
  if (!getItem('ws_task_results', null)) {
    setItem('ws_task_results', [
      { id: 1, name: '정상완료', icon: 'check-circle-2', color: '#22c55e' },
      { id: 2, name: '진행중', icon: 'activity', color: '#06b6d4' },
      { id: 3, name: '부분완료', icon: 'circle-dot', color: '#f59e0b' },
      { id: 4, name: '보류', icon: 'pause-circle', color: '#9ca3af' },
      { id: 5, name: '취소', icon: 'x-circle', color: '#ef4444' },
    ])
  }

  // ── 진행보고 유형 ──
  if (!getItem('ws_report_types', null)) {
    setItem('ws_report_types', [
      { id: 1, label: '업무시작', icon: 'play-circle', color: '#4f6ef7' },
      { id: 2, label: '시장조사', icon: 'search', color: '#06b6d4' },
      { id: 3, label: '작업중', icon: 'wrench', color: '#9747ff' },
      { id: 4, label: '작업완료', icon: 'check-circle', color: '#22c55e' },
      { id: 5, label: '협의완료', icon: 'message-circle', color: '#f59e0b' },
      { id: 6, label: '이슈발생', icon: 'alert-triangle', color: '#ef4444' },
      { id: 7, label: '업무취소', icon: 'x-circle', color: '#6b7280' },
      { id: 8, label: '보고서작성', icon: 'file-text', color: '#8b5cf6' },
    ])
  }

  // ── 지시 중요도 ──
  if (!getItem('ws_instr_importances', null)) {
    setItem('ws_instr_importances', [
      { id: 1, name: '최상', icon: 'zap', color: '#ef4444' },
      { id: 2, name: '상', icon: 'alert-triangle', color: '#f59e0b' },
      { id: 3, name: '중', icon: 'circle-dot', color: '#eab308' },
      { id: 4, name: '하', icon: 'check-circle-2', color: '#22c55e' },
      { id: 5, name: '참고', icon: 'eye', color: '#06b6d4' },
    ])
  }

  // ── 진행상태 ──
  if (!getItem('ws_task_statuses', null)) {
    setItem('ws_task_statuses', [
      { id: 1, name: '준비', icon: 'clipboard-list', color: '#9ca3af' },
      { id: 2, name: '시작', icon: 'play-circle', color: '#06b6d4' },
      { id: 3, name: '진행중', icon: 'activity', color: '#3b82f6' },
      { id: 4, name: '대기', icon: 'clock', color: '#8b5cf6' },
      { id: 5, name: '보류', icon: 'pause-circle', color: '#f59e0b' },
      { id: 6, name: '일부완료', icon: 'circle-dot', color: '#22c55e' },
      { id: 7, name: '지연중', icon: 'alert-triangle', color: '#ef4444' },
      { id: 8, name: '포기', icon: 'x-circle', color: '#dc2626' },
      { id: 9, name: '완료', icon: 'check-circle-2', color: '#10b981' },
      { id: 10, name: '검토중', icon: 'eye', color: '#6366f1' },
    ])
  }

  // ── 직원 (사용자) ──
  if (!getItem('ws_users', null)) {
    setItem('ws_users', [
      {
        id: 1, name: '최대표', role: 'admin', rank: '대표', dept: '경영지원팀', avatar: 'CD', color: '#4f6ef7',
        email: '최대표@workm.kr', phone: '010-1000-0001', birthday: '1975-03-15',
        hiredAt: '2015-01-01', resignedAt: null, address: '서울시 강남구 테헤란로 100',
        loginId: '최대표', pw: '1234', status: '근무', note: '대표이사', photo: '',
        position: 'CEO', approverType: 'approver'
      },
      {
        id: 2, name: '박팀장', role: 'admin', rank: '팀장', dept: '개발팀', avatar: 'PT', color: '#8b5cf6',
        email: '박팀장@workm.kr', phone: '010-1000-0002', birthday: '1982-07-20',
        hiredAt: '2018-03-01', resignedAt: null, address: '경기도 성남시 분당구 판교로 200',
        loginId: '박팀장', pw: '1234', status: '근무', note: '개발팀 팀장', photo: '',
        position: '팀장', approverType: 'approver'
      },
      {
        id: 3, name: '하팀원', role: 'user', rank: '사원', dept: '개발팀', avatar: 'HT', color: '#06b6d4',
        email: '하팀원@workm.kr', phone: '010-1000-0003', birthday: '1998-11-05',
        hiredAt: '2024-03-01', resignedAt: null, address: '서울시 마포구 월드컵로 300',
        loginId: '하팀원', pw: '1234', status: '근무', note: '개발팀 신입사원', photo: '',
        position: '팀원', approverType: 'requester'
      },
      {
        id: 4, name: '최경리', role: 'user', rank: '대리', dept: '경영지원팀', avatar: 'CK', color: '#22c55e',
        email: '최경리@workm.kr', phone: '010-1000-0004', birthday: '1992-04-18',
        hiredAt: '2020-06-01', resignedAt: null, address: '서울시 서초구 서초대로 400',
        loginId: '최경리', pw: '1234', status: '근무', note: '경리/회계 담당', photo: '',
        position: '팀원', approverType: 'requester'
      },
      {
        id: 5, name: '강선임', role: 'user', rank: '선임', dept: '기획팀', avatar: 'KS', color: '#f59e0b',
        email: '강선임@workm.kr', phone: '010-1000-0005', birthday: '1990-09-25',
        hiredAt: '2019-09-01', resignedAt: null, address: '서울시 종로구 종로 500',
        loginId: '강선임', pw: '1234', status: '근무', note: '기획팀 선임', photo: '',
        position: '선임', approverType: 'requester'
      },
      {
        id: 6, name: '조영업', role: 'user', rank: '과장', dept: '영업팀', avatar: 'JY', color: '#ef4444',
        email: '조영업@workm.kr', phone: '010-1000-0006', birthday: '1987-12-10',
        hiredAt: '2018-08-01', resignedAt: null, address: '서울시 강남구 학동로 600',
        loginId: '조영업', pw: '1234', status: '근무', note: '영업팀 과장', photo: '',
        position: '팀원', approverType: 'requester'
      },
      {
        id: 7, name: '임기획', role: 'user', rank: '대리', dept: '기획팀', avatar: 'IK', color: '#ec4899',
        email: '임기획@workm.kr', phone: '010-1000-0007', birthday: '1993-06-30',
        hiredAt: '2021-02-01', resignedAt: null, address: '경기도 고양시 일산서구 700',
        loginId: '임기획', pw: '1234', status: '근무', note: '기획팀 대리', photo: '',
        position: '팀원', approverType: 'requester'
      },
      {
        id: 8, name: '오개발', role: 'user', rank: '주임', dept: '개발팀', avatar: 'OG', color: '#14b8a6',
        email: '오개발@workm.kr', phone: '010-1000-0008', birthday: '1995-01-22',
        hiredAt: '2022-04-01', resignedAt: null, address: '서울시 송파구 올림픽로 800',
        loginId: '오개발', pw: '1234', status: '근무', note: '개발팀 주임', photo: '',
        position: '팀원', approverType: 'requester'
      },
    ])
  }

  // ── 업무 (tasks) ── v2: 20개 샘플
  const existingTasks = getItem('ws_tasks', null) as any[] | null
  if (!existingTasks || existingTasks.length < 10) {
    const today = new Date().toISOString().slice(0, 10)
    const dOff = (offset: number) => { const dt = new Date(); dt.setDate(dt.getDate() + offset); return dt.toISOString().slice(0, 10) }
    setItem('ws_tasks', [
      { id: 1, title: '메인 대시보드 UI 개발', desc: '메인 대시보드 페이지를 React로 개발', assignerId: 1, assigneeIds: [2], status: 'progress', priority: 'high', progress: 65, dueDate: dOff(10), createdAt: dOff(-8), startedAt: dOff(-5), isImportant: true, team: '개발팀', importance: 'high', history: [{ date: dOff(-8), event: '업무 등록', detail: 'admin → 이수진', icon: 'clipboard-list', color: '#4f6ef7' }, { date: dOff(-5), event: '업무 시작', detail: '진행중', icon: 'play-circle', color: '#06b6d4' }] },
      { id: 3, title: '보안 API 성능 최적화', desc: '응답시간 50% 개선', assignerId: 1, assigneeIds: [3], status: 'progress', priority: 'high', progress: 80, dueDate: dOff(12), createdAt: dOff(-10), startedAt: dOff(-7), team: '개발팀', importance: 'high', history: [{ date: dOff(-10), event: '업무 등록', detail: 'admin → 박민수', icon: 'clipboard-list', color: '#4f6ef7' }] },
      { id: 4, title: 'UX 사용성 개선 보고서', desc: '설문조사 후 개선사항 정리', assignerId: 1, assigneeIds: [4], status: 'waiting', priority: 'medium', progress: 0, dueDate: dOff(17), createdAt: dOff(-2), team: '디자인팀', importance: 'medium' },
      { id: 1004, title: '모바일 앱 푸시 알림 연동', assignerId: 1, assigneeIds: [2, 3], status: 'progress', priority: 'medium', progress: 40, dueDate: dOff(8), createdAt: dOff(-5), startedAt: dOff(-3), team: '개발팀', importance: 'medium' },
      { id: 1005, title: 'Q2 마케팅 전략 검토', assignerId: 1, assigneeIds: [5], status: 'waiting', priority: 'low', progress: 0, dueDate: dOff(20), createdAt: dOff(-1), team: '마케팅팀', importance: 'low' },
      { id: 2, title: 'Q1 마케팅 기획서 작성', desc: 'SNS 캠페인 기획서 작성', assignerId: 5, assigneeIds: [1], status: 'delay', priority: 'high', progress: 30, dueDate: dOff(-2), createdAt: dOff(-12), startedAt: dOff(-10), isImportant: true, team: '마케팅팀', importance: 'high', history: [{ date: dOff(-12), event: '업무 등록', detail: '정현우 → admin', icon: 'clipboard-list', color: '#4f6ef7' }] },
      { id: 2002, title: '신규 입사자 온보딩 자료 준비', assignerId: 5, assigneeIds: [1], status: 'progress', priority: 'medium', progress: 55, dueDate: dOff(5), createdAt: dOff(-6), startedAt: dOff(-4), team: '경영지원팀', importance: 'medium' },
      { id: 2003, title: '클라이언트 미팅 자료 작성', assignerId: 4, assigneeIds: [1], status: 'progress', priority: 'high', progress: 70, dueDate: dOff(3), createdAt: dOff(-4), startedAt: dOff(-2), team: '디자인팀', importance: 'high' },
      { id: 2004, title: '예산 집행 현황 보고', assignerId: 5, assigneeIds: [1], status: 'waiting', priority: 'medium', progress: 0, dueDate: dOff(7), createdAt: dOff(-1), team: '경영지원팀', importance: 'medium' },
      { id: 2005, title: '서버 인프라 점검 결과 정리', assignerId: 3, assigneeIds: [1], status: 'progress', priority: 'low', progress: 20, dueDate: dOff(14), createdAt: dOff(-3), startedAt: dOff(-1), team: '개발팀', importance: 'low' },
      { id: 3001, title: '개인 역량 개발 계획 수립', status: 'progress', priority: 'medium', progress: 40, dueDate: dOff(15), createdAt: dOff(-5), startedAt: dOff(-3), isSchedule: true, importance: 'medium' },
      { id: 3002, title: '업무 프로세스 개선안 연구', status: 'waiting', priority: 'low', progress: 0, dueDate: dOff(25), createdAt: dOff(-2), isSchedule: true, importance: 'low' },
      { id: 3003, title: '팀 워크샵 기획', status: 'progress', priority: 'medium', progress: 60, dueDate: dOff(10), createdAt: dOff(-7), startedAt: dOff(-5), isSchedule: true, importance: 'medium' },
      { id: 3004, title: '기술 블로그 포스트 작성', status: 'progress', priority: 'low', progress: 25, dueDate: dOff(18), createdAt: dOff(-4), startedAt: dOff(-2), isSchedule: true, importance: 'low' },
      { id: 3005, title: '분기 실적 분석 대시보드 구축', status: 'waiting', priority: 'high', progress: 0, dueDate: dOff(30), createdAt: dOff(-1), isSchedule: true, isImportant: true, importance: 'high' },
      { id: 4001, title: '주간 업무 보고서 제출', assignerId: 5, assigneeIds: [1], status: 'progress', priority: 'high', progress: 85, dueDate: today, createdAt: dOff(-4), startedAt: dOff(-2), isImportant: true, team: '경영지원팀', importance: 'high' },
      { id: 4002, title: '디자인 리뷰 피드백 정리', assignerId: 1, assigneeIds: [4], status: 'progress', priority: 'medium', progress: 50, dueDate: today, createdAt: dOff(-3), startedAt: dOff(-1), team: '디자인팀', importance: 'medium' },
      { id: 4003, title: '고객사 견적서 발송', assignerId: 5, assigneeIds: [1], status: 'waiting', priority: 'high', progress: 0, dueDate: today, createdAt: dOff(-2), team: '마케팅팀', importance: 'high' },
      { id: 4004, title: 'CI/CD 파이프라인 테스트', assignerId: 1, assigneeIds: [3], status: 'progress', priority: 'medium', progress: 90, dueDate: today, createdAt: dOff(-5), startedAt: dOff(-3), team: '개발팀', importance: 'medium' },
      { id: 4005, title: '월간 KPI 데이터 수집', status: 'progress', priority: 'low', progress: 60, dueDate: today, createdAt: dOff(-3), startedAt: dOff(-1), isSchedule: true, importance: 'low' },
      { id: 4006, title: '거래처 계약서 검토', assignerId: 6, assigneeIds: [1], status: 'progress', priority: 'high', progress: 40, dueDate: today, createdAt: dOff(-3), startedAt: dOff(-1), team: '영업팀', importance: 'high' },
      { id: 4007, title: '사내 교육자료 업데이트', status: 'waiting', priority: 'medium', progress: 0, dueDate: today, createdAt: dOff(-2), isSchedule: true, importance: 'medium' },
      { id: 1006, title: '신규 기능 QA 테스트', assignerId: 1, assigneeIds: [8], status: 'progress', priority: 'high', progress: 55, dueDate: dOff(6), createdAt: dOff(-4), startedAt: dOff(-2), isImportant: true, team: '개발팀', importance: 'high' },
      { id: 1007, title: '홈페이지 리뉴얼 기획', assignerId: 1, assigneeIds: [7], status: 'waiting', priority: 'medium', progress: 0, dueDate: dOff(14), createdAt: dOff(-1), team: '기획팀', importance: 'medium' },
      { id: 2006, title: '프로모션 이벤트 기획안 작성', assignerId: 6, assigneeIds: [1], status: 'progress', priority: 'medium', progress: 35, dueDate: dOff(4), createdAt: dOff(-5), startedAt: dOff(-3), team: '영업팀', importance: 'medium' },
      { id: 2007, title: '분기 매출 보고서 작성', assignerId: 4, assigneeIds: [1], status: 'waiting', priority: 'high', progress: 0, dueDate: dOff(9), createdAt: dOff(-2), team: '경영지원팀', importance: 'high' },
      { id: 3006, title: '신기술 트렌드 리서치', status: 'progress', priority: 'medium', progress: 30, dueDate: dOff(12), createdAt: dOff(-6), startedAt: dOff(-4), isSchedule: true, importance: 'medium' },
    ])
  }

  // ── 메시지 ──
  if (!getItem('ws_messages', null)) {
    setItem('ws_messages', [
      { id: 1, senderId: 2, text: '팀장님, 대시보드 UI 진행상황 확인 요청드립니다.', time: '10:25 AM' },
      { id: 2, senderId: 1, text: '네, 내일까지로 확인하겠습니다.', time: '10:30 AM' },
    ])
  }

  // ── 게시판 데이터 갱신 (v4: 50개 샘플) ──
  localStorage.removeItem('board_items')

  setItem('ws_seed_version', SEED_VERSION)
}
