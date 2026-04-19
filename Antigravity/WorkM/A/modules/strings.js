/**
 * strings.js — WorkM UI 한글 문자열 상수
 * 
 * 모든 UI에 표시되는 한글 텍스트를 이 파일에서 중앙 관리합니다.
 * JS 편집 도구의 인코딩 혼용으로 한글이 깨지는 것을 방지하기 위해,
 * 수정이 필요한 경우 반드시 이 파일만 편집하세요.
 * 
 * 사용법: S.TOAST_STATUS_CHANGED  →  "업무 상태가 변경되었습니다."
 */
const S = {

  /* ── 공통 ── */
  EMPTY_TASK:        '진행 중인 업무가 없습니다',
  NO_TASK:           '업무가 없습니다.',
  LOADING:           '불러오는 중...',

  /* ── 업무 상태 변경 ── */
  TOAST_STATUS_CHANGED: (label) => `업무 상태가 "${label}"(으)로 변경되었습니다.`,

  /* ── 직원 관리 ── */
  TOAST_STAFF_SAVED:    '직원 정보가 저장되었습니다.',
  TOAST_STAFF_ADDED:    '새 직원이 등록되었습니다.',
  TOAST_STAFF_DELETED:  '직원이 삭제되었습니다.',
  CONFIRM_STAFF_DELETE: '정말로 직원을 명단에서 삭제하시겠습니까?\n진행 중인 업무가 미완료 상태가 될 수 있습니다.',
  TOAST_PHOTO_SIZE:     '5MB 이하 이미지만 등록 가능합니다.',

  /* ── 업무 배정 ── */
  TOAST_ASSIGN_REMOVED:  '해당 직원 배정이 해제되었습니다.',
  TOAST_ASSIGN_DONE:     (name) => `업무가 ${name}에게 배정되었습니다.`,
  TOAST_ASSIGN_SUCCESS:  '업무가 배정되었습니다.',
  NO_ASSIGN:             '배정된 업무가 없습니다.',

  /* ── 본사 설정 ── */
  TOAST_HQ_SAVED:        '본사 정보가 업데이트되었습니다.',

  /* ── 실적보기 테이블 헤더 ── */
  PERF_RANK:     '순위',
  PERF_STAFF:    '직원',
  PERF_RATE:     '달성률',
  PERF_TOTAL:    '전체',
  PERF_DONE:     '완료',
  PERF_INPROG:   '진행중',
  PERF_DELAY:    '지연',
  PERF_AVG:      '평균진행률',
  PERF_PERIOD_W: '주간',
  PERF_PERIOD_M: '월간',
  PERF_PERIOD_Y: '연간',
  PERF_TITLE:    '팀원별 업무 달성 현황',

  /* ── 일정보기 ── */
  SCHED_LEGEND_INPROG: '진행중',
  SCHED_LEGEND_DONE:   '완료',
  SCHED_LEGEND_DELAY:  '지연',
  SCHED_LEGEND_WAIT:   '대기',
  SCHED_LEGEND_DAILY:  '일일업무',
  SCHED_TODAY_BTN:     '현재',
  SCHED_WIDTH_LABEL:   '열 너비',
  SCHED_HEIGHT_LABEL:  '행 높이',
  SCHED_HEADER:        '월 \\ 일',

  /* ── 업무 등록 모달 ── */
  MODAL_START_DATE:    '시작일',
  MODAL_DUE_DATE:      '완료계획일',
  MODAL_DAILY_TASK:    '일일업무',
  MODAL_PERIOD_TASK:   '기간업무',
  MODAL_DATE_HINT:     '날짜를 선택하세요',

  /* ── 진행 보고 ── */
  PROGRESS_UPDATE:     '진행 업데이트',
};

// 브라우저 전역으로 노출
if (typeof window !== 'undefined') window.S = S;
