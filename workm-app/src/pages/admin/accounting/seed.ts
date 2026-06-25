import { getItem, setItem } from '../../../utils/storage'
import { getLocalISOString } from './utils'
import type { BudgetCat, BudgetItem } from './types'

export function initAccountingSeed() {
  // 기존 데이터 보존: 시드는 데이터가 없을 때만 초기화
  // (더 이상 시드 버전 변경 시 기존 데이터를 삭제하지 않음)
  /* ── 기존 계정에 description이 누락된 경우 보충 패치 (early return 이전 실행) ── */
  if (!localStorage.getItem('_acct_desc_patch_v1')) {
    const descMap: Record<string, string> = {
      '1-01-01': '지폐·동전 등 즉시 사용 가능한 통화',
      '1-01-02': '수표 발행이 가능한 은행 예금',
      '1-01-03': '수시 입출금 가능한 일반 예금',
      '1-01-04': '일정 기간 예치 확정금리 예금',
      '1-01-05': '외화로 보유하는 은행 예금',
      '1-01-06': '거래처로부터 받은 약속어음·환어음',
      '1-01-07': '외상 판매로 발생한 매출채권',
      '1-01-08': '회수 불능 예상액 차감 평가계정',
      '1-01-09': '1년 이내 회수 예정 대여금',
      '1-01-10': '영업 외 거래에서 발생한 미수채권',
      '1-01-11': '발생했으나 미수취한 수익',
      '1-01-12': '상품·원재료 구입 시 선지급 대금',
      '1-01-13': '미래 기간 비용을 미리 지급한 금액',
      '1-01-14': '매입 시 부담한 부가세 환급 대상액',
      '1-01-15': '판매 목적으로 매입한 완성 상품',
      '1-01-16': '자사 제조 완성 판매용 제품',
      '1-01-17': '제품 제조에 투입될 원자재',
      '1-01-18': '제조 과정 중인 미완성 제품',
      '1-01-19': '만기 1년 이내 금융상품(CD, MMF 등)',
      '1-02-01': '사업용 토지(감가상각 대상 아님)',
      '1-02-02': '사무실·공장·창고 등 사업용 건축물',
      '1-02-03': '건물의 누적 감가상각액(차감계정)',
      '1-02-04': '도로·교량·담장 등 토지 정착 구조물',
      '1-02-05': '구축물의 누적 감가상각액(차감계정)',
      '1-02-06': '생산·제조에 사용되는 기계 설비',
      '1-02-07': '기계장치의 누적 감가상각액(차감계정)',
      '1-02-08': '업무용 자동차·트럭 등 운반 차량',
      '1-02-09': '차량운반구의 누적 감가상각액(차감계정)',
      '1-02-10': '사무용 가구·전자기기 등 업무용 비품',
      '1-02-11': '비품의 누적 감가상각액(차감계정)',
      '1-02-12': '업무용 SW 라이선스·개발비',
      '1-02-13': '소프트웨어의 누적 상각액(차감계정)',
      '1-02-14': '사업 인수 시 초과 지급한 프리미엄',
      '1-02-15': '1년 초과 장기 대여금',
      '1-02-16': '임차보증금·전세금 등 반환 예정 보증금',
      '1-02-17': '만기 1년 초과 금융상품',
      '1-02-18': '피투자기업에 대한 지분법 적용 주식',
      '2-01-01': '외상 매입으로 발생한 채무',
      '2-01-02': '거래처에 발행한 약속어음',
      '2-01-03': '1년 이내 상환 예정 차입금',
      '2-01-04': '영업 외 거래에서 발생한 미지급 채무',
      '2-01-05': '발생했으나 미지급한 비용',
      '2-01-06': '재화·용역 제공 전 미리 받은 대금',
      '2-01-07': '미래 기간 수익을 미리 받은 금액',
      '2-01-08': '일시적으로 보관 중인 타인 자금',
      '2-01-09': '매출 시 징수한 부가세 납부 대상액',
      '2-01-10': '급여에서 원천징수한 소득세',
      '2-01-11': '급여에서 공제한 국민연금·건보·고용·산재',
      '2-01-12': '1년 내 상환 도래 장기부채 전환분',
      '2-02-01': '상환기한 1년 초과 장기 차입금',
      '2-02-02': '퇴직 시 지급 예상 퇴직금 적립액',
      '2-02-03': '임차인으로부터 받은 보증금(반환 의무)',
      '2-02-04': '회사가 발행한 채권(회사채)',
      '3-01-01': '보통주 발행으로 납입된 자본금',
      '3-01-02': '우선주 발행으로 납입된 자본금',
      '3-02-01': '주식을 액면가 초과로 발행한 차액',
      '3-02-02': '자본 감소 시 발생한 차익',
      '3-03-01': '상법에 의해 의무적으로 적립하는 금액',
      '3-03-02': '사업 확장 등 목적으로 자발적 적립',
      '3-03-03': '아직 배당 등 처분되지 않은 이익잉여금',
      '3-03-04': '해당 회계연도의 최종 순이익',
      '4-01-01': '매입 상품 판매로 발생한 수익',
      '4-01-02': '자사 제조 제품 판매 수익',
      '4-01-03': '서비스(용역) 제공으로 발생한 수익',
      '4-01-04': '매출 할인·반품 등 매출 차감 항목',
      '4-02-01': '예금·대여금 등의 이자 수입',
      '4-02-02': '투자 주식에서 수령한 배당금',
      '4-02-03': '부동산·자산 임대로 발생한 수익',
      '4-02-04': '외화 거래 시 유리한 환율 차이 이익',
      '4-02-05': '외화 자산·부채 환산 시 평가 이익',
      '4-02-06': '유형자산 장부가 초과 매각 이익',
      '4-02-07': '기타 소액·비경상적 영업외 수익',
      '5-01-01': '판매된 상품의 매입 원가',
      '5-01-02': '판매된 제품의 제조 원가',
      '5-01-03': '제품 제조에 투입된 원재료 비용',
      '5-01-04': '제조 현장 근로자의 인건비',
      '5-01-05': '원재료·노무비 외 제조 관련 간접 비용',
      '5-01-06': '제조·생산 공정 외부 위탁 가공 비용',
      '5-02-01': '임직원 기본급·수당 등 급여 총액',
      '5-02-02': '성과·명절 등 특별 상여금',
      '5-02-03': '당기 인식 퇴직급여 비용',
      '5-02-04': '식대·건강검진·경조사비 등 복지 비용',
      '5-02-05': '출장비·교통비·숙박비 등',
      '5-02-06': '거래처 접대·선물·식음료 비용',
      '5-02-07': '전화·인터넷·우편 등 통신 비용',
      '5-02-08': '수도·가스·난방 등 유틸리티 비용',
      '5-02-09': '전기 사용 요금',
      '5-02-10': '재산세·자동차세·각종 공과금',
      '5-02-11': '유형자산의 내용연수별 가치 감소 비용',
      '5-02-12': '사무실·장비 등 임차 사용료',
      '5-02-13': '건물·기계 등 유지보수·수리 비용',
      '5-02-14': '화재·배상책임 등 각종 보험 납입액',
      '5-02-15': '업무용 차량 유류비·정비비·주차비',
      '5-02-16': '연구·개발 활동에 소요되는 경상 비용',
      '5-02-17': '임직원 교육·연수·자격증 취득 비용',
      '5-02-18': '서적 구입·명함·인쇄물 제작 비용',
      '5-02-19': '문구·사무용 소모품 구입 비용',
      '5-02-20': '일반 소모품 구입 비용',
      '5-02-21': '세무·법무·은행 등 각종 수수료',
      '5-02-22': '광고·홍보·마케팅 관련 비용',
      '5-02-23': '회수 불능 채권의 당기 상각 비용',
      '5-02-24': '상품·제품 배송·운송 비용',
      '5-02-25': '기타 소액·분류 불가 판관비',
      '5-02-26': '시공·관리 등 외부 인력 용역 인건비',
      '5-03-01': '차입금·사채 등에 대한 이자 지급액',
      '5-03-02': '외화 거래 시 불리한 환율 차이 손실',
      '5-03-03': '외화 자산·부채 환산 시 평가 손실',
      '5-03-04': '공익·자선 목적 기부 지출액',
      '5-03-05': '유형자산 장부가 미만 매각 손실',
      '5-03-06': '기타 소액·비경상적 영업외 손실',
      '5-04-01': '당기 법인세 및 법인지방소득세',
    }
    const existing = getItem<any[]>('acct_accounts', [])
    if (existing.length > 0) {
      let patched = false
      const updated = existing.map((a: any) => {
        if (!a.description && descMap[a.code]) {
          patched = true
          return { ...a, description: descMap[a.code] }
        }
        return a
      })
      if (patched) {
        setItem('acct_accounts', updated)
      }
    }
    setItem('_acct_desc_patch_v1', '1')
  }

  /* ── 보조금수익 계정과목 패치 ── */
  if (!localStorage.getItem('_acct_subsidy_patch_v1')) {
    const existing = getItem<any[]>('acct_accounts', [])
    if (existing.length > 0 && !existing.some(a => a.code === '4-02-08')) {
      existing.push({ code: '4-02-08', name: '보조금수익', type: 'revenue', group: '영업외수익', description: '국가·지자체 등으로부터 받은 보조금 수익', active: true })
      setItem('acct_accounts', existing)
    }
    setItem('_acct_subsidy_patch_v1', '1')
  }

  /* ── 상품권 계정과목 패치 ── */
  if (!localStorage.getItem('_acct_voucher_acct_patch_v1')) {
    const existing = getItem<any[]>('acct_accounts', [])
    if (existing.length > 0 && !existing.some(a => a.name === '상품권' && a.type === 'asset')) {
      existing.push({ code: '1-01-20', name: '상품권', type: 'asset', group: '유동자산', description: '문화상품권·백화점상품권 등 유가증권 성격의 상품권', active: true })
      setItem('acct_accounts', existing)
    }
    setItem('_acct_voucher_acct_patch_v1', '1')
  }

  /* ── 선지출/대체 품의가 approved/toResolve 상태인 경우 completed로 자동 마이그레이션 ── */
  if (!localStorage.getItem('_acct_preexp_completed_v4')) {
    const existingApprovals = getItem<any[]>('acct_approvals', [])
    const allCashflows: any[] = getItem('acct_cashflows', [])
    let patchedPre = false
    const updatedApprovals = existingApprovals.map((a: any) => {
      if (a.status !== 'approved' && a.status !== 'toResolve') return a
      // 선지출 판별: 플래그, 제목, 또는 연결된 cashflow 존재
      const hasCfLink = allCashflows.some((cf: any) => cf.approvalId && String(cf.approvalId) === String(a.id))
      const isPreExpItem = a.isPreExpense || a.selfExpense || (a.title || '').startsWith('[선지출]') || (a.title || '').startsWith('[대체]') || hasCfLink
      if (isPreExpItem) {
        patchedPre = true
        return { ...a, status: 'completed', completedAt: a.completedAt || getLocalISOString() }
      }
      return a
    })
    if (patchedPre) setItem('acct_approvals', updatedApprovals)
    setItem('_acct_preexp_completed_v4', '1')
  }

  // ── 예산구분 없는 테스트 데이터 일괄 삭제 패치 ──
  if (!localStorage.getItem('_acct_clean_no_budgetcat_v1')) {
    const cfs: any[] = getItem('acct_cashflows', [])
    const removeCfIds = cfs.filter(c => !c.budgetCatId && c.type !== 'transfer').map(c => String(c.id))
    if (removeCfIds.length > 0) {
      // cashflow 삭제
      const cleanedCfs = cfs.filter(c => !removeCfIds.includes(String(c.id)))
      setItem('acct_cashflows', cleanedCfs)
      // 연결된 voucher 삭제
      const vouchers: any[] = getItem('acct_vouchers', [])
      const cleanedVouchers = vouchers.filter(v => !removeCfIds.includes(String(v.id)))
      setItem('acct_vouchers', cleanedVouchers)
      // 연결된 approval 상태 복원
      const approvals: any[] = getItem('acct_approvals', [])
      const linkedApIds = cfs.filter(c => removeCfIds.includes(String(c.id)) && c.approvalId).map(c => String(c.approvalId))
      if (linkedApIds.length > 0) {
        const updatedAps = approvals.map(a => linkedApIds.includes(String(a.id)) ? { ...a, status: 'approved' } : a)
        setItem('acct_approvals', updatedAps)
      }
      console.log(`[patch] 예산구분 없는 데이터 ${removeCfIds.length}건 삭제`)
    }
    setItem('_acct_clean_no_budgetcat_v1', '1')
  }

  /* ── 시드 버전 변경 시 회계 데이터 초기화 후 재시드 ── */
  const currentSeedVer = '_acct_react_seed_v11'
  const acctSeedDone = !!localStorage.getItem(currentSeedVer)  // early return 제거: 개별 키 체크로 복구
  // 이전 버전 데이터가 있으면 클리어 후 재시드
  const oldKeys = ['_acct_react_seed_v1','_acct_react_seed_v2','_acct_react_seed_v3','_acct_react_seed_v4','_acct_react_seed_v5','_acct_react_seed_v6','_acct_react_seed_v7','_acct_react_seed_v8','_acct_react_seed_v9','_acct_react_seed_v10']
  const hadOldSeed = oldKeys.some(k => localStorage.getItem(k))
  if (hadOldSeed) {
    // 이전 시드 버전 키만 제거 (사용자 거래 데이터는 보존)
    oldKeys.forEach(k => localStorage.removeItem(k))
    // 주의: acct_approvals, acct_cashflows, acct_vouchers, acct_vendors 등
    // 사용자 거래 데이터는 삭제하지 않음 (시드 갱신과 무관한 실제 업무 데이터)
  }

  /* ── 계정과목 시드 (버전 변경 시 강제 리셋) ── */
  {
    const defaultAccounts = [
      { code: '1-01-01', name: '현금', type: 'asset', group: '유동자산', description: '지폐·동전 등 즉시 사용 가능한 통화' },
      { code: '1-01-02', name: '당좌예금', type: 'asset', group: '유동자산', description: '수표 발행이 가능한 은행 예금' },
      { code: '1-01-03', name: '보통예금', type: 'asset', group: '유동자산', description: '수시 입출금 가능한 일반 예금' },
      { code: '1-01-04', name: '정기예금', type: 'asset', group: '유동자산', description: '일정 기간 예치 확정금리 예금' },
      { code: '1-01-05', name: '외화예금', type: 'asset', group: '유동자산', description: '외화로 보유하는 은행 예금' },
      { code: '1-01-06', name: '받을어음', type: 'asset', group: '유동자산', description: '거래처로부터 받은 약속어음·환어음' },
      { code: '1-01-07', name: '외상매출금', type: 'asset', group: '유동자산', description: '외상 판매로 발생한 매출채권' },
      { code: '1-01-08', name: '대손충당금', type: 'asset', group: '유동자산', description: '회수 불능 예상액 차감 평가계정' },
      { code: '1-01-09', name: '단기대여금', type: 'asset', group: '유동자산', description: '1년 이내 회수 예정 대여금' },
      { code: '1-01-10', name: '미수금', type: 'asset', group: '유동자산', description: '영업 외 거래에서 발생한 미수채권' },
      { code: '1-01-11', name: '미수수익', type: 'asset', group: '유동자산', description: '발생했으나 미수취한 수익' },
      { code: '1-01-12', name: '선급금', type: 'asset', group: '유동자산', description: '상품·원재료 구입 시 선지급 대금' },
      { code: '1-01-13', name: '선급비용', type: 'asset', group: '유동자산', description: '미래 기간 비용을 미리 지급한 금액' },
      { code: '1-01-14', name: '부가세대급금', type: 'asset', group: '유동자산', description: '매입 시 부담한 부가세 환급 대상액' },
      { code: '1-01-15', name: '재고자산(상품)', type: 'asset', group: '유동자산', description: '판매 목적으로 매입한 완성 상품' },
      { code: '1-01-16', name: '재고자산(제품)', type: 'asset', group: '유동자산', description: '자사 제조 완성 판매용 제품' },
      { code: '1-01-17', name: '재고자산(원재료)', type: 'asset', group: '유동자산', description: '제품 제조에 투입될 원자재' },
      { code: '1-01-18', name: '재고자산(재공품)', type: 'asset', group: '유동자산', description: '제조 과정 중인 미완성 제품' },
      { code: '1-01-19', name: '단기금융상품', type: 'asset', group: '유동자산', description: '만기 1년 이내 금융상품(CD, MMF 등)' },
      { code: '1-01-20', name: '상품권', type: 'asset', group: '유동자산', description: '문화상품권·백화점상품권 등 유가증권 성격의 상품권' },
      { code: '1-02-01', name: '토지', type: 'asset', group: '비유동자산', description: '사업용 토지(감가상각 대상 아님)' },
      { code: '1-02-02', name: '건물', type: 'asset', group: '비유동자산', description: '사무실·공장·창고 등 사업용 건축물' },
      { code: '1-02-03', name: '건물감가상각누계액', type: 'asset', group: '비유동자산', description: '건물의 누적 감가상각액(차감계정)' },
      { code: '1-02-04', name: '구축물', type: 'asset', group: '비유동자산', description: '도로·교량·담장 등 토지 정착 구조물' },
      { code: '1-02-05', name: '구축물감가상각누계액', type: 'asset', group: '비유동자산', description: '구축물의 누적 감가상각액(차감계정)' },
      { code: '1-02-06', name: '기계장치', type: 'asset', group: '비유동자산', description: '생산·제조에 사용되는 기계 설비' },
      { code: '1-02-07', name: '기계장치감가상각누계액', type: 'asset', group: '비유동자산', description: '기계장치의 누적 감가상각액(차감계정)' },
      { code: '1-02-08', name: '차량운반구', type: 'asset', group: '비유동자산', description: '업무용 자동차·트럭 등 운반 차량' },
      { code: '1-02-09', name: '차량운반구감가상각누계액', type: 'asset', group: '비유동자산', description: '차량운반구의 누적 감가상각액(차감계정)' },
      { code: '1-02-10', name: '비품', type: 'asset', group: '비유동자산', description: '사무용 가구·전자기기 등 업무용 비품' },
      { code: '1-02-11', name: '비품감가상각누계액', type: 'asset', group: '비유동자산', description: '비품의 누적 감가상각액(차감계정)' },
      { code: '1-02-12', name: '소프트웨어', type: 'asset', group: '비유동자산', description: '업무용 SW 라이선스·개발비' },
      { code: '1-02-13', name: '소프트웨어상각누계액', type: 'asset', group: '비유동자산', description: '소프트웨어의 누적 상각액(차감계정)' },
      { code: '1-02-14', name: '영업권', type: 'asset', group: '비유동자산', description: '사업 인수 시 초과 지급한 프리미엄' },
      { code: '1-02-15', name: '장기대여금', type: 'asset', group: '비유동자산', description: '1년 초과 장기 대여금' },
      { code: '1-02-16', name: '보증금', type: 'asset', group: '비유동자산', description: '임차보증금·전세금 등 반환 예정 보증금' },
      { code: '1-02-17', name: '장기금융상품', type: 'asset', group: '비유동자산', description: '만기 1년 초과 금융상품' },
      { code: '1-02-18', name: '지분법적용투자주식', type: 'asset', group: '비유동자산', description: '피투자기업에 대한 지분법 적용 주식' },
      { code: '2-01-01', name: '외상매입금', type: 'liability', group: '유동부채', description: '외상 매입으로 발생한 채무' },
      { code: '2-01-02', name: '지급어음', type: 'liability', group: '유동부채', description: '거래처에 발행한 약속어음' },
      { code: '2-01-03', name: '단기차입금', type: 'liability', group: '유동부채', description: '1년 이내 상환 예정 차입금' },
      { code: '2-01-04', name: '미지급금', type: 'liability', group: '유동부채', description: '영업 외 거래에서 발생한 미지급 채무' },
      { code: '2-01-05', name: '미지급비용', type: 'liability', group: '유동부채', description: '발생했으나 미지급한 비용' },
      { code: '2-01-06', name: '선수금', type: 'liability', group: '유동부채', description: '재화·용역 제공 전 미리 받은 대금' },
      { code: '2-01-07', name: '선수수익', type: 'liability', group: '유동부채', description: '미래 기간 수익을 미리 받은 금액' },
      { code: '2-01-08', name: '예수금', type: 'liability', group: '유동부채', description: '일시적으로 보관 중인 타인 자금' },
      { code: '2-01-09', name: '부가세예수금', type: 'liability', group: '유동부채', description: '매출 시 징수한 부가세 납부 대상액' },
      { code: '2-01-10', name: '소득세예수금', type: 'liability', group: '유동부채', description: '급여에서 원천징수한 소득세' },
      { code: '2-01-11', name: '4대보험예수금', type: 'liability', group: '유동부채', description: '급여에서 공제한 국민연금·건보·고용·산재' },
      { code: '2-01-12', name: '유동성장기부채', type: 'liability', group: '유동부채', description: '1년 내 상환 도래 장기부채 전환분' },
      { code: '2-02-01', name: '장기차입금', type: 'liability', group: '비유동부채', description: '상환기한 1년 초과 장기 차입금' },
      { code: '2-02-02', name: '퇴직급여충당부채', type: 'liability', group: '비유동부채', description: '퇴직 시 지급 예상 퇴직금 적립액' },
      { code: '2-02-03', name: '임대보증금', type: 'liability', group: '비유동부채', description: '임차인으로부터 받은 보증금(반환 의무)' },
      { code: '2-02-04', name: '사채', type: 'liability', group: '비유동부채', description: '회사가 발행한 채권(회사채)' },
      { code: '3-01-01', name: '보통주자본금', type: 'equity', group: '자본금', description: '보통주 발행으로 납입된 자본금' },
      { code: '3-01-02', name: '우선주자본금', type: 'equity', group: '자본금', description: '우선주 발행으로 납입된 자본금' },
      { code: '3-02-01', name: '주식발행초과금', type: 'equity', group: '자본잉여금', description: '주식을 액면가 초과로 발행한 차액' },
      { code: '3-02-02', name: '감자차익', type: 'equity', group: '자본잉여금', description: '자본 감소 시 발생한 차익' },
      { code: '3-03-01', name: '법정적립금', type: 'equity', group: '이익잉여금', description: '상법에 의해 의무적으로 적립하는 금액' },
      { code: '3-03-02', name: '임의적립금', type: 'equity', group: '이익잉여금', description: '사업 확장 등 목적으로 자발적 적립' },
      { code: '3-03-03', name: '미처분이익잉여금', type: 'equity', group: '이익잉여금', description: '아직 배당 등 처분되지 않은 이익잉여금' },
      { code: '3-03-04', name: '당기순이익', type: 'equity', group: '이익잉여금', description: '해당 회계연도의 최종 순이익' },
      { code: '4-01-01', name: '상품매출', type: 'revenue', group: '매출액', description: '매입 상품 판매로 발생한 수익' },
      { code: '4-01-02', name: '제품매출', type: 'revenue', group: '매출액', description: '자사 제조 제품 판매 수익' },
      { code: '4-01-03', name: '용역매출', type: 'revenue', group: '매출액', description: '서비스(용역) 제공으로 발생한 수익' },
      { code: '4-01-04', name: '매출에누리및환입', type: 'revenue', group: '매출액', description: '매출 할인·반품 등 매출 차감 항목' },
      { code: '4-02-01', name: '이자수익', type: 'revenue', group: '영업외수익', description: '예금·대여금 등의 이자 수입' },
      { code: '4-02-02', name: '배당금수익', type: 'revenue', group: '영업외수익', description: '투자 주식에서 수령한 배당금' },
      { code: '4-02-03', name: '임대료수익', type: 'revenue', group: '영업외수익', description: '부동산·자산 임대로 발생한 수익' },
      { code: '4-02-04', name: '외환차익', type: 'revenue', group: '영업외수익', description: '외화 거래 시 유리한 환율 차이 이익' },
      { code: '4-02-05', name: '외화환산이익', type: 'revenue', group: '영업외수익', description: '외화 자산·부채 환산 시 평가 이익' },
      { code: '4-02-06', name: '유형자산처분이익', type: 'revenue', group: '영업외수익', description: '유형자산 장부가 초과 매각 이익' },
      { code: '4-02-07', name: '잡이익', type: 'revenue', group: '영업외수익', description: '기타 소액·비경상적 영업외 수익' },
      { code: '4-02-08', name: '보조금수익', type: 'revenue', group: '영업외수익', description: '국가·지자체 등으로부터 받은 보조금 수익' },
      { code: '5-01-01', name: '상품매출원가', type: 'expense', group: '매출원가', description: '판매된 상품의 매입 원가' },
      { code: '5-01-02', name: '제품매출원가', type: 'expense', group: '매출원가', description: '판매된 제품의 제조 원가' },
      { code: '5-01-03', name: '원재료비', type: 'expense', group: '매출원가', description: '제품 제조에 투입된 원재료 비용' },
      { code: '5-01-04', name: '노무비', type: 'expense', group: '매출원가', description: '제조 현장 근로자의 인건비' },
      { code: '5-01-05', name: '제조경비', type: 'expense', group: '매출원가', description: '원재료·노무비 외 제조 관련 간접 비용' },
      { code: '5-01-06', name: '외주가공비', type: 'expense', group: '매출원가', description: '제조·생산 공정 외부 위탁 가공 비용' },
      { code: '5-02-01', name: '급여', type: 'expense', group: '판매비및관리비', description: '임직원 기본급·수당 등 급여 총액' },
      { code: '5-02-02', name: '상여금', type: 'expense', group: '판매비및관리비', description: '성과·명절 등 특별 상여금' },
      { code: '5-02-03', name: '퇴직급여', type: 'expense', group: '판매비및관리비', description: '당기 인식 퇴직급여 비용' },
      { code: '5-02-04', name: '복리후생비', type: 'expense', group: '판매비및관리비', description: '식대·건강검진·경조사비 등 복지 비용' },
      { code: '5-02-05', name: '여비교통비', type: 'expense', group: '판매비및관리비', description: '출장비·교통비·숙박비 등' },
      { code: '5-02-06', name: '접대비', type: 'expense', group: '판매비및관리비', description: '거래처 접대·선물·식음료 비용' },
      { code: '5-02-07', name: '통신비', type: 'expense', group: '판매비및관리비', description: '전화·인터넷·우편 등 통신 비용' },
      { code: '5-02-08', name: '수도광열비', type: 'expense', group: '판매비및관리비', description: '수도·가스·난방 등 유틸리티 비용' },
      { code: '5-02-09', name: '전력비', type: 'expense', group: '판매비및관리비', description: '전기 사용 요금' },
      { code: '5-02-10', name: '세금과공과', type: 'expense', group: '판매비및관리비', description: '재산세·자동차세·각종 공과금' },
      { code: '5-02-11', name: '감가상각비', type: 'expense', group: '판매비및관리비', description: '유형자산의 내용연수별 가치 감소 비용' },
      { code: '5-02-12', name: '지급임차료', type: 'expense', group: '판매비및관리비', description: '사무실·장비 등 임차 사용료' },
      { code: '5-02-13', name: '수선비', type: 'expense', group: '판매비및관리비', description: '건물·기계 등 유지보수·수리 비용' },
      { code: '5-02-14', name: '보험료', type: 'expense', group: '판매비및관리비', description: '화재·배상책임 등 각종 보험 납입액' },
      { code: '5-02-15', name: '차량유지비', type: 'expense', group: '판매비및관리비', description: '업무용 차량 유류비·정비비·주차비' },
      { code: '5-02-16', name: '경상개발비', type: 'expense', group: '판매비및관리비', description: '연구·개발 활동에 소요되는 경상 비용' },
      { code: '5-02-17', name: '교육훈련비', type: 'expense', group: '판매비및관리비', description: '임직원 교육·연수·자격증 취득 비용' },
      { code: '5-02-18', name: '도서인쇄비', type: 'expense', group: '판매비및관리비', description: '서적 구입·명함·인쇄물 제작 비용' },
      { code: '5-02-19', name: '사무용품비', type: 'expense', group: '판매비및관리비', description: '문구·사무용 소모품 구입 비용' },
      { code: '5-02-20', name: '소모품비', type: 'expense', group: '판매비및관리비', description: '일반 소모품 구입 비용' },
      { code: '5-02-21', name: '지급수수료', type: 'expense', group: '판매비및관리비', description: '세무·법무·은행 등 각종 수수료' },
      { code: '5-02-22', name: '광고선전비', type: 'expense', group: '판매비및관리비', description: '광고·홍보·마케팅 관련 비용' },
      { code: '5-02-23', name: '대손상각비', type: 'expense', group: '판매비및관리비', description: '회수 불능 채권의 당기 상각 비용' },
      { code: '5-02-24', name: '운반비', type: 'expense', group: '판매비및관리비', description: '상품·제품 배송·운송 비용' },
      { code: '5-02-25', name: '잡비', type: 'expense', group: '판매비및관리비', description: '기타 소액·분류 불가 판관비' },
      { code: '5-02-26', name: '외주인건비', type: 'expense', group: '판매비및관리비', description: '시공·관리 등 외부 인력 용역 인건비' },
      { code: '5-03-01', name: '이자비용', type: 'expense', group: '영업외비용', description: '차입금·사채 등에 대한 이자 지급액' },
      { code: '5-03-02', name: '외환차손', type: 'expense', group: '영업외비용', description: '외화 거래 시 불리한 환율 차이 손실' },
      { code: '5-03-03', name: '외화환산손실', type: 'expense', group: '영업외비용', description: '외화 자산·부채 환산 시 평가 손실' },
      { code: '5-03-04', name: '기부금', type: 'expense', group: '영업외비용', description: '공익·자선 목적 기부 지출액' },
      { code: '5-03-05', name: '유형자산처분손실', type: 'expense', group: '영업외비용', description: '유형자산 장부가 미만 매각 손실' },
      { code: '5-03-06', name: '잡손실', type: 'expense', group: '영업외비용', description: '기타 소액·비경상적 영업외 손실' },
      { code: '5-04-01', name: '법인세등', type: 'expense', group: '법인세비용', description: '당기 법인세 및 법인지방소득세' },
    ]
    if (getItem<any[]>('acct_accounts', []).length === 0) {
      setItem('acct_accounts', defaultAccounts)
    }
  }


  const uid = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 7)
  const year = new Date().getFullYear()

  /* ── 예산 시드 (기존 데이터 없을 때만) ── */
  const cats = getItem<BudgetCat[]>('acct_budget_cats', [])
  const budgets = getItem<BudgetItem[]>('acct_budgets', [])

  if (cats.length === 0 || budgets.length === 0) {
    setItem('acct_budget_cats', [{"id":"mp6lpa67gfje3","name":"문화재청","year":2026,"bankInfo":"카카오뱅크","periodFrom":"2026-01-01","periodTo":"2026-12-31","bank":"카카오뱅크","accounts":[{"id":1778912111737,"bankName":"카카오뱅크","cards":["일반관리카드 1234-5847-8282-7161"]},{"id":1778912224993,"bankName":"농협 321-90-38475","cards":["출장전용 3847-3546-1232-0980"]}],"users":["한경리"],"approvers":["최대표"],"approver":"","budgetStatus":"confirmed"},{"id":"mp6lpa67ha0uy","name":"경주시청","year":2026,"bankInfo":"농협은행 2020-2200-34","periodFrom":"2026-01-01","periodTo":"2026-12-31","bank":"농협은행 2020-2200-34","accounts":[],"users":["한경리"],"approvers":["최대표"],"approver":""},{"id":"mp6lpa676sg15","name":"자체예산","year":2026,"bankInfo":"국민은행 3030-3300-56","periodFrom":"2026-01-01","periodTo":"2026-12-31","bank":"국민은행 3030-3300-56","accounts":[],"users":["조영업"],"approvers":[]},{"id":1778999557736,"name":"자체예산","bank":"","bankInfo":"","accounts":[],"periodFrom":"2027-01-01","periodTo":"2027-12-31","year":2027,"users":["최대표"]},{"id":1779006937570,"name":"문화재청","bank":"","bankInfo":"","accounts":[],"periodFrom":"2028-01-01","periodTo":"2028-12-31","year":2028,"users":["박팀장"]}])
    setItem('acct_budgets', [{"id":1781996219161,"catId":"mp6lpa67gfje3","year":2026,"itemName":"문화재보수비","subItemName":"단청보수","detailItemName":"","accountCode":"5-01-06","contraAccountCode":"1-01-03","amount":20000000,"spent":0,"budgetItemDefId":2},{"id":1781996218480,"catId":"mp6lpa67gfje3","year":2026,"itemName":"문화재보수비","subItemName":"현장인부","detailItemName":"","accountCode":"5-02-26","contraAccountCode":"1-01-03","amount":3000000,"spent":0,"budgetItemDefId":2},{"id":1781996218740,"catId":"mp6lpa67gfje3","year":2026,"itemName":"문화재보수비","subItemName":"석조보수","detailItemName":"","accountCode":"5-02-13","contraAccountCode":"1-01-03","amount":2000000,"spent":0,"budgetItemDefId":2},{"id":1781948301126,"catId":"mp6lpa67gfje3","year":2026,"itemName":"장비구입비","subItemName":"안전장비","detailItemName":"","accountCode":"5-02-20","contraAccountCode":"2-01-04","amount":0,"spent":0,"budgetItemDefId":4},{"id":1781948304503,"catId":"mp6lpa67gfje3","year":2026,"itemName":"장비구입비","subItemName":"사무기기","detailItemName":"","accountCode":"1-02-10","contraAccountCode":"2-01-04","amount":0,"spent":0,"budgetItemDefId":4},{"id":1781995470792,"catId":"mp6lpa67gfje3","year":2026,"itemName":"운영비","subItemName":"일반수용비","detailItemName":"사무용품 구입","accountCode":"5-02-19","contraAccountCode":"1-01-03","amount":0,"spent":50000,"budgetItemDefId":1304},{"id":1781948299578,"catId":"mp6lpa67gfje3","year":2026,"itemName":"운영비","subItemName":"일반수용비","detailItemName":"인쇄비 및 유인비","accountCode":"5-02-18","contraAccountCode":"1-01-03","amount":23000000,"spent":50000,"budgetItemDefId":1304},{"id":1781948299225,"catId":"mp6lpa67gfje3","year":2026,"itemName":"운영비","subItemName":"일반수용비","detailItemName":"홍보비","accountCode":"5-02-22","contraAccountCode":"1-01-03","amount":50000,"spent":50000,"budgetItemDefId":1304},{"id":1781995470139,"catId":"mp6lpa67gfje3","year":2026,"itemName":"운영비","subItemName":"일반수용비","detailItemName":"물품구입비","accountCode":"5060","contraAccountCode":"1-01-03","amount":0,"spent":50000,"budgetItemDefId":1304},{"id":1781995472077,"catId":"mp6lpa67gfje3","year":2026,"itemName":"운영비","subItemName":"일반수용비","detailItemName":"간행물 등 구입비","accountCode":"5-02-21","contraAccountCode":"1-01-03","amount":0,"spent":50000,"budgetItemDefId":1304},{"id":1781996904105,"catId":"mp6lpa67gfje3","year":2026,"itemName":"인건비","subItemName":"고정인력","detailItemName":"","accountCode":"5-02-01","contraAccountCode":"1-01-03","amount":0,"spent":0,"budgetItemDefId":1},{"id":1781996901855,"catId":"mp6lpa67gfje3","year":2026,"itemName":"인건비","subItemName":"일용인력","detailItemName":"","accountCode":"5-01-04","contraAccountCode":"1-01-03","amount":0,"spent":0,"budgetItemDefId":1},{"id":1781997001164,"catId":"mp6lpa67gfje3","year":2026,"itemName":"문화재보수비","subItemName":"목조보수","detailItemName":"","accountCode":"5-02-13","contraAccountCode":"1-01-03","amount":0,"spent":0,"budgetItemDefId":2},{"id":1782026307941,"catId":"mp6lpa67gfje3","year":2026,"itemName":"발굴조사비","subItemName":"발굴장비임대","detailItemName":"","accountCode":"5-01-06","contraAccountCode":"2-01-04","amount":230000,"spent":0,"budgetItemDefId":3},{"id":1782026301705,"catId":"mp6lpa67gfje3","year":2026,"itemName":"발굴조사비","subItemName":"시굴조사","detailItemName":"","accountCode":"5-01-06","contraAccountCode":"2-01-04","amount":0,"spent":0,"budgetItemDefId":3},{"id":1782026302071,"catId":"mp6lpa67gfje3","year":2026,"itemName":"발굴조사비","subItemName":"조사인력","detailItemName":"","accountCode":"5-02-26","contraAccountCode":"2-01-04","amount":0,"spent":0,"budgetItemDefId":3}])
  }

  /* ── 거래처 샘플 10건 ── */
  if (getItem<any[]>('acct_vendors', []).length === 0) {
    const vendors = [
      { id: 1001, name: '(주)한국전자', zipCode: '06134', address1: '서울특별시 강남구 테헤란로 152', address2: '강남파이낸스센터 3층', phone: '02-555-1234', ceoName: '김대표', ceoPhone: '010-1111-2222', managerName: '박담당', managerPhone: '010-3333-4444', bizNo: '123-45-67890', bizType: '제조', bizCategory: '전자부품', invoiceEmail: 'tax@hankook.co.kr', memo: '주요 전자부품 공급처' },
      { id: 1002, name: '(주)서울건설', zipCode: '04536', address1: '서울특별시 중구 세종대로 110', address2: '2층 203호', phone: '02-777-5678', ceoName: '이건설', ceoPhone: '010-5555-6666', managerName: '최현장', managerPhone: '010-7777-8888', bizNo: '234-56-78901', bizType: '건설', bizCategory: '종합건설', invoiceEmail: 'bill@seoulcon.kr', memo: '문화재 보수공사 전문' },
      { id: 1003, name: '대한인쇄공사', zipCode: '07236', address1: '서울특별시 영등포구 여의대로 24', address2: '', phone: '02-333-9012', ceoName: '정인쇄', ceoPhone: '010-9999-0000', managerName: '한영업', managerPhone: '010-1234-5678', bizNo: '345-67-89012', bizType: '인쇄', bizCategory: '인쇄출판', invoiceEmail: 'invoice@daehanprint.com', memo: '보고서 인쇄 전문업체' },
      { id: 1004, name: '경주문화재연구원', zipCode: '38065', address1: '경상북도 경주시 알천북로 345', address2: '연구동 501호', phone: '054-772-3456', ceoName: '신연구', ceoPhone: '010-2345-6789', managerName: '유조사', managerPhone: '010-3456-7890', bizNo: '456-78-90123', bizType: '서비스', bizCategory: '학술연구', invoiceEmail: 'gyeongju@research.or.kr', memo: '발굴조사 용역 파트너' },
      { id: 1005, name: '(주)스마트오피스', zipCode: '13487', address1: '경기도 성남시 분당구 판교로 228', address2: '판교테크노밸리 A동', phone: '031-888-1111', ceoName: '오사무', ceoPhone: '010-4567-8901', managerName: '강사원', managerPhone: '010-5678-9012', bizNo: '567-89-01234', bizType: '도소매', bizCategory: '사무용품', invoiceEmail: 'smart@smartoffice.co.kr', memo: '사무용품 정기 공급' },
      { id: 1006, name: '한빛통신(주)', zipCode: '06164', address1: '서울특별시 강남구 삼성로 180', address2: '', phone: '02-444-2222', ceoName: '나통신', ceoPhone: '010-6789-0123', managerName: '문기술', managerPhone: '010-7890-1234', bizNo: '678-90-12345', bizType: '서비스', bizCategory: '통신서비스', invoiceEmail: 'billing@hanbit.net', memo: '인터넷/전화 서비스' },
      { id: 1007, name: '(주)그린조경', zipCode: '31116', address1: '충청남도 천안시 동남구 충절로 12', address2: '그린빌딩 2층', phone: '041-555-3333', ceoName: '초조경', ceoPhone: '010-8901-2345', managerName: '류원예', managerPhone: '010-9012-3456', bizNo: '789-01-23456', bizType: '서비스', bizCategory: '조경', invoiceEmail: 'green@greenland.kr', memo: '유적지 조경공사 전문' },
      { id: 1008, name: '세종법률사무소', zipCode: '04526', address1: '서울특별시 중구 남대문로 117', address2: '법조빌딩 15층', phone: '02-666-4444', ceoName: '변법률', ceoPhone: '010-0123-4567', managerName: '서변호', managerPhone: '010-1111-3333', bizNo: '890-12-34567', bizType: '서비스', bizCategory: '법률서비스', invoiceEmail: 'sejong@lawoffice.co.kr', memo: '법률자문 계약 업체' },
      { id: 1009, name: '(주)퍼스트카', zipCode: '16878', address1: '경기도 용인시 수지구 풍덕천로 67', address2: '', phone: '031-222-5555', ceoName: '차정비', ceoPhone: '010-2222-4444', managerName: '김정비', managerPhone: '010-3333-5555', bizNo: '901-23-45678', bizType: '서비스', bizCategory: '자동차정비', invoiceEmail: 'firstcar@firstcar.kr', memo: '법인차량 정비' },
      { id: 1010, name: '(주)맛나푸드', zipCode: '06037', address1: '서울특별시 강남구 봉은사로 317', address2: 'B1층', phone: '02-999-6666', ceoName: '맛대표', ceoPhone: '010-4444-6666', managerName: '이배달', managerPhone: '010-5555-7777', bizNo: '012-34-56789', bizType: '서비스', bizCategory: '식품외식', invoiceEmail: 'food@matnafood.com', memo: '행사용 케이터링' },
    ]
    setItem('acct_vendors', vendors)
  }

  /* ── 품의 샘플 10건 ── */
  if (getItem<any[]>('acct_approvals', []).length === 0) {
    setItem('acct_approvals', [
            {
                  "id": 2001,
                  "title": "Q1 사무용품 일괄 구매",
                  "amount": 1500000,
                  "date": "2026-01-15",
                  "status": "toResolve",
                  "accountCode": "5190",
                  "description": "1분기 사무용품 일괄 구매 품의",
                  "applicant": "최대표",
                  "approver": "최대표",
                  "createdAt": "2026-01-14T09:00:00Z"
            },
            {
                  "id": 2002,
                  "title": "문화재 현장 안전장비 구입",
                  "amount": 3200000,
                  "date": "2026-02-05",
                  "status": "toResolve",
                  "accountCode": "5140",
                  "description": "현장 안전모, 안전벨트 등 구입",
                  "applicant": "하팀원",
                  "approver": "최대표",
                  "createdAt": "2026-02-04T10:00:00Z"
            },
            {
                  "id": 2003,
                  "title": "발굴조사 장비 임대",
                  "amount": 8500000,
                  "date": "2026-02-20",
                  "status": "toResolve",
                  "accountCode": "5120",
                  "description": "3월 발굴조사 장비 임대 비용",
                  "applicant": "한경리",
                  "approver": "최대표",
                  "createdAt": "2026-02-19T14:00:00Z"
            },
            {
                  "id": 2004,
                  "title": "보고서 인쇄비",
                  "amount": 2800000,
                  "date": "2026-03-10",
                  "status": "pending",
                  "accountCode": "5190",
                  "description": "2025년도 연간보고서 인쇄",
                  "applicant": "강선임",
                  "approver": "최대표",
                  "createdAt": "2026-03-09T11:00:00Z"
            },
            {
                  "id": 2005,
                  "title": "직원 역량강화 교육비",
                  "amount": 4500000,
                  "date": "2026-03-25",
                  "status": "pending",
                  "accountCode": "5350",
                  "description": "문화재 복원기술 교육 수강료",
                  "applicant": "박팀장",
                  "approver": "최대표",
                  "createdAt": "2026-03-24T09:30:00Z"
            },
            {
                  "id": 2006,
                  "title": "법인차량 정기정비",
                  "amount": 780000,
                  "date": "2026-04-05",
                  "status": "toResolve",
                  "accountCode": "5310",
                  "description": "법인차량 3대 정기정비",
                  "applicant": "조영업",
                  "approver": "최대표",
                  "createdAt": "2026-04-04T08:00:00Z"
            },
            {
                  "id": 2007,
                  "title": "유적지 조경공사",
                  "amount": 12000000,
                  "date": "2026-04-12",
                  "status": "approved",
                  "accountCode": "5120",
                  "description": "경주 유적지 봄 조경정비",
                  "applicant": "하팀원",
                  "approver": "최대표",
                  "createdAt": "2026-04-11T10:00:00Z"
            },
            {
                  "id": 2008,
                  "title": "사무실 통신비 연간계약",
                  "amount": 3600000,
                  "date": "2026-05-01",
                  "status": "rejected",
                  "accountCode": "5340",
                  "description": "인터넷/전화 연간계약 갱신",
                  "applicant": "임기획",
                  "approver": "최대표",
                  "createdAt": "2026-04-28T15:00:00Z"
            },
            {
                  "id": 2009,
                  "title": "현장 드론 구입",
                  "amount": 5500000,
                  "date": "2026-05-10",
                  "status": "approved",
                  "accountCode": "5130",
                  "description": "항공촬영용 고성능 드론 2대",
                  "applicant": "한경리",
                  "approver": "최대표",
                  "createdAt": "2026-05-09T09:00:00Z"
            },
            {
                  "id": 2010,
                  "title": "행사장 케이터링",
                  "amount": 2200000,
                  "date": "2026-05-20",
                  "status": "approved",
                  "accountCode": "5310",
                  "description": "문화유산의 날 행사 케이터링",
                  "applicant": "강선임",
                  "approver": "최대표",
                  "createdAt": "2026-05-19T13:00:00Z"
            },
            {
                  "id": 1778920129748,
                  "title": "컴퓨터 구매",
                  "amount": 1500000,
                  "date": "2026-05-16",
                  "status": "approved",
                  "accountCode": "",
                  "description": "컴퓨터가 필요합니다.",
                  "applicant": "최대표",
                  "approver": "최대표",
                  "createdAt": "2026-05-16T08:28:49.714Z",
                  "resubmittedAt": "2026-05-16T12:09:43.200Z",
                  "budgetCatId": "mp6lpa676sg15",
                  "budgetCatName": "자체예산",
                  "budgetItemId": "mp6lpa67vtzi2",
                  "budgetItem": "사무운영비",
                  "budgetSubId": "mp6lpa6700zwf",
                  "budgetSubItem": "사무운영비",
                  "approvedAt": "2026-05-16T23:16:33.665Z"
            },
            {
                  "id": 1778924551839,
                  "title": "컴퓨터구매",
                  "amount": 2000000,
                  "date": "2026-05-16",
                  "status": "approved",
                  "accountCode": "",
                  "description": "그냥사게",
                  "applicant": "최대표",
                  "approver": "최대표",
                  "createdAt": "2026-05-16T09:42:31.807Z"
            },
            {
                  "id": 1778924741860,
                  "title": "컴퓨터구매",
                  "amount": 6000000,
                  "date": "2026-05-16",
                  "status": "toResolve",
                  "accountCode": "",
                  "description": "오잉\n",
                  "applicant": "최대표",
                  "approver": "최대표",
                  "createdAt": "2026-05-16T09:45:41.827Z",
                  "budgetCatId": "mp6lpa67gfje3",
                  "budgetItemId": "mp6lpa679xmm2",
                  "budgetSubId": "mp6lpa679xmm2",
                  "approvedAt": "2026-05-16T11:28:29.736Z"
            },
            {
                  "id": 1778933840182,
                  "title": "연습",
                  "amount": 50,
                  "date": "2026-05-16",
                  "status": "confirming",
                  "accountCode": "",
                  "description": "ㅇㅇ",
                  "applicant": "최대표",
                  "approver": "최대표",
                  "createdAt": "2026-05-16T12:17:19.499Z",
                  "budgetCatId": "mp6lpa676sg15",
                  "budgetItemId": "mp6lpa67mn4l0",
                  "budgetSubId": "mp6lpa67jwi1z",
                  "approvedAt": "2026-05-16T15:34:11.609Z",
                  "attachments": [
                        {
                              "name": "워크엠_01.jpg",
                              "size": 2055082,
                              "type": "image/jpeg",
                              "addedAt": "2026-05-17T01:48:07.159Z",
                              "title": "연습",
                              "dimensions": "20"
                        }
                  ],
                  "confirmedAt": "2026-05-17T16:05:06.187Z",
                  "returnedAt": "2026-05-17T03:29:56.329Z"
            },
            {
                  "id": 1778944330150,
                  "title": "ㅇㄻㄹ",
                  "amount": 345,
                  "date": "2026-05-16",
                  "status": "toResolve",
                  "accountCode": "",
                  "description": "ㅇㄹㄹ",
                  "applicant": "최대표",
                  "approver": "최대표",
                  "createdAt": "2026-05-16T15:12:09.341Z",
                  "budgetCatId": "mp6lpa67gfje3",
                  "budgetItemId": "mp6lpa670zb6d",
                  "budgetSubId": "mp6lpa670zb6d",
                  "approvedAt": "2026-05-16T15:27:44.307Z"
            },
            {
                  "id": 1779027204813,
                  "status": "pending",
                  "title": "[선지출] 구매",
                  "amount": 300000,
                  "date": "2026-05-17",
                  "createdAt": "2026-05-17T14:13:24.350Z",
                  "accountCode": "",
                  "description": "출금전표 선지출 - 문화재 보수비 > 돌탑수리",
                  "applicant": "최대표",
                  "approver": "최대표",
                  "budgetItem": "문화재 보수비",
                  "budgetSubItem": "돌탑수리",
                  "budgetCatId": "mp6lpa67gfje3",
                  "budgetCatName": "문화재청",
                  "resubmittedAt": "2026-05-18T06:48:52.888Z"
            },
            {
                  "id": 1779087828586,
                  "title": "ㅇㅇ",
                  "amount": 50,
                  "date": "2026-05-18",
                  "status": "pending",
                  "accountCode": "",
                  "description": "ㅇㅇ",
                  "applicant": "최대표",
                  "approver": "최대표",
                  "budgetItem": "",
                  "budgetSubItem": "",
                  "createdAt": "2026-05-18T07:03:48.142Z"
            },
            {
                  "id": 1779089444785,
                  "status": "preExpense",
                  "isPreExpense": true,
                  "title": "[선지출] 멋지게살자",
                  "amount": 1700000,
                  "date": "2026-05-18",
                  "createdAt": "2026-05-18T07:30:44.615Z",
                  "accountCode": "",
                  "description": "출금전표 선지출 - 문화재 보수비 > 돌탑수리",
                  "applicant": "최대표",
                  "approver": "",
                  "budgetItem": "문화재 보수비",
                  "budgetSubItem": "돌탑수리",
                  "budgetCatId": "mp6lpa67gfje3",
                  "budgetCatName": "문화재청",
                  "budgetItemId": "mp6lpa676bwjc",
                  "budgetSubId": "1779027171295"
            },
            {
                  "id": 1781937293865,
                  "status": "pending",
                  "isPreExpense": true,
                  "title": "[선지출] 컴퓨터구매",
                  "amount": 1000000,
                  "date": "2026-06-20",
                  "createdAt": "2026-06-20T06:34:53.706Z",
                  "accountCode": "",
                  "description": "출금전표 선지출 - 운영비 > 일반수용비",
                  "applicant": "박팀장",
                  "approver": "최대표",
                  "budgetItem": "운영비",
                  "budgetSubItem": "일반수용비",
                  "budgetCatId": "mp6lpa67gfje3",
                  "budgetCatName": "문화재청",
                  "budgetItemId": "1781925489685",
                  "budgetSubId": "1781925489685",
                  "resubmittedAt": "2026-06-21T04:01:15.274Z"
            },
            {
                  "id": 1782009881804,
                  "title": "컴퓨터구매",
                  "amount": 1000000,
                  "date": "2026-06-21",
                  "status": "completed",
                  "accountCode": "",
                  "description": "컴퓨터사줘요",
                  "applicant": "박팀장",
                  "approver": "최대표",
                  "isGeneral": false,
                  "budgetItem": "장비구입비",
                  "budgetSubItem": "사무기기",
                  "createdAt": "2026-06-21T02:44:41.665Z",
                  "budgetCatId": "mp6lpa67gfje3",
                  "budgetCatName": "문화재청",
                  "budgetItemId": "1781948301126",
                  "budgetSubId": "1781948304503",
                  "approvedAmount": 1000000,
                  "approvedMemo": "비교견적받고 진행하세요",
                  "approvedAt": "2026-06-21T03:38:20.204Z",
                  "attachments": [
                        {
                              "name": "영수증-01.jpg",
                              "size": 120825,
                              "type": "image/jpeg",
                              "addedAt": "2026-06-21T05:33:54.290Z",
                              "title": "영수증-01",
                              "printWidth": 180,
                              "imageKey": "att_1782009881804_1782020034289_4gu0n7",
                              "row": 0
                        },
                        {
                              "name": "영수증-01.jpg",
                              "size": 120825,
                              "type": "image/jpeg",
                              "addedAt": "2026-06-21T05:35:22.954Z",
                              "title": "영수증-01",
                              "printWidth": 181,
                              "imageKey": "att_1782009881804_1782020122952_ojvco9",
                              "row": 0
                        },
                        {
                              "name": "KakaoTalk_20260615_115613910.jpg",
                              "size": 3705794,
                              "type": "image/jpeg",
                              "addedAt": "2026-06-21T05:35:57.809Z",
                              "title": "설치후",
                              "printWidth": 400,
                              "imageKey": "att_1782009881804_1782020157807_tmhg5n"
                        }
                  ],
                  "confirmedAt": "2026-06-21T05:52:45.542Z",
                  "returnedAt": "2026-06-21T05:52:11.919Z",
                  "returnReason": "영수증이 잘못된 것 같습니다.",
                  "returnedBy": "한경리",
                  "completedAt": "2026-06-21T06:00:52.057Z",
                  "completedBy": "한경리"
            },
            {
                  "id": 1782014550101,
                  "title": "지출테스트",
                  "amount": 500000,
                  "date": "2026-06-21",
                  "status": "toResolve",
                  "accountCode": "",
                  "description": "지출 테스트",
                  "applicant": "박팀장",
                  "approver": "최대표",
                  "isGeneral": false,
                  "budgetItem": "운영비",
                  "budgetSubItem": "일반수용비",
                  "createdAt": "2026-06-21T04:02:29.405Z",
                  "budgetCatId": "mp6lpa67gfje3",
                  "budgetCatName": "문화재청",
                  "budgetItemId": "1781995470792",
                  "budgetSubId": "1781995470792",
                  "budgetDetailId": "1781995470792",
                  "budgetDetailItem": "사무용품구입비",
                  "approvedAmount": 500000,
                  "approvedMemo": "비교 견적 2곳 이상 요망",
                  "approvedAt": "2026-06-21T04:33:31.500Z"
            },
            {
                  "id": 1782028353377,
                  "title": "지출 테스트",
                  "amount": 200000,
                  "date": "2026-06-21",
                  "status": "confirming",
                  "accountCode": "",
                  "description": "지출 연습",
                  "applicant": "한경리",
                  "approver": "최대표",
                  "isGeneral": false,
                  "budgetCatId": "mp6lpa67gfje3",
                  "budgetCatName": "문화재청",
                  "createdAt": "2026-06-21T07:52:32.616Z",
                  "resubmittedAt": "2026-06-21T08:06:48.968Z",
                  "budgetItemId": "1781995470792",
                  "budgetItem": "운영비",
                  "budgetSubId": "1781995470792",
                  "budgetSubItem": "일반수용비",
                  "budgetDetailId": "1781948299578",
                  "budgetDetailItem": "인쇄및유인비",
                  "approvedAmount": 200000,
                  "approvedMemo": "비교견적 2개이상 첨부",
                  "approvedAt": "2026-06-21T08:52:10.064Z",
                  "attachments": [
                        {
                              "name": "영수증-02.jpg",
                              "size": 111551,
                              "type": "image/jpeg",
                              "addedAt": "2026-06-21T08:58:22.338Z",
                              "title": "영수증-02",
                              "printWidth": 183,
                              "imageKey": "att_1782028353377_1782032302338_usj9at"
                        }
                  ],
                  "confirmedAt": "2026-06-21T08:58:44.401Z"
            },
            {
                  "id": 1782029243828,
                  "title": "연습",
                  "amount": 0,
                  "date": "2026-06-21",
                  "status": "pending",
                  "accountCode": "",
                  "description": "연습",
                  "applicant": "한경리",
                  "approver": "최대표",
                  "isGeneral": true,
                  "budgetItem": "",
                  "budgetSubItem": "",
                  "budgetCatId": "",
                  "budgetCatName": "",
                  "createdAt": "2026-06-21T08:07:22.872Z"
            },
            {
                  "id": 1782040622302,
                  "status": "completed",
                  "isPreExpense": true,
                  "title": "[선지출] 연습",
                  "amount": 50000,
                  "date": "2026-06-21",
                  "createdAt": "2026-06-21T11:17:02.009Z",
                  "accountCode": "",
                  "description": "출금전표 선지출 - 운영비 > 일반수용비\n연습합니다.",
                  "applicant": "박팀장",
                  "approver": "최대표",
                  "budgetItem": "운영비",
                  "budgetSubItem": "일반수용비",
                  "budgetCatId": "mp6lpa67gfje3",
                  "budgetCatName": "문화재청",
                  "budgetItemId": "1781995470792",
                  "resubmittedAt": "2026-06-21T11:21:46.712Z",
                  "budgetDetailItem": "",
                  "approvedAmount": 50000,
                  "approvedMemo": "ok",
                  "approvedAt": "2026-06-21T12:30:52.604Z",
                  "attachments": [
                        {
                              "name": "영수증-01.jpg",
                              "size": 120825,
                              "type": "image/jpeg",
                              "addedAt": "2026-06-21T12:45:40.668Z",
                              "title": "영수증-01",
                              "printWidth": 156,
                              "imageKey": "att_1782040622302_1782045940668_4jyxyq"
                        }
                  ],
                  "confirmedAt": "2026-06-21T12:45:52.947Z",
                  "completedAt": "2026-06-21T12:46:28.413Z",
                  "completedBy": "한경리"
            }
      ])
  }

  /* ── 지출/입금/출금 샘플 각 10건 ── */
  if (getItem<any[]>('acct_cashflows', []).length === 0) {
    setItem('acct_cashflows', [{"id":3031,"date":"2026-04-08","type":"income","amount":1500000,"description":"기념품 판매 수입","accountCode":"4030","counter":"기념품샵","method":"현금","budgetCatId":"mp6lpa676sg15"},{"id":3033,"date":"2026-04-05","type":"income","amount":10000000,"description":"경주시 3차 보조금","accountCode":"4030","counter":"경주시청","method":"계좌이체","budgetCatId":"mp6lpa67ha0uy"},{"id":3035,"date":"2026-04-20","type":"income","amount":2400000,"description":"교육 프로그램 참가비","accountCode":"4030","counter":"교육참가자","method":"현금","budgetCatId":"mp6lpa67ha0uy"},{"id":3039,"date":"2026-03-15","type":"income","amount":20000000,"description":"문화재청 3차 보조금","accountCode":"4030","counter":"문화재청","method":"계좌이체","budgetCatId":"mp6lpa67gfje3"},{"id":1781937421402,"date":"2026-06-20","type":"expense","amount":3200000,"description":"문화재 현장 안전장비 구입","accountCode":"5110","counter":"","writeDate":"2026-06-20","manager":"하팀원","approvalId":"2002"},{"id":1781937440808,"date":"2026-06-20","type":"expense","amount":8500000,"description":"발굴조사 장비 임대","accountCode":"5110","counter":"","writeDate":"2026-06-20","manager":"한경리","approvalId":"2003"},{"id":1781937450451,"date":"2026-06-20","type":"expense","amount":780000,"description":"법인차량 정기정비","accountCode":"5110","counter":"","writeDate":"2026-06-20","manager":"조영업","approvalId":"2006"},{"id":1781937914840,"date":"2026-06-20","type":"income","amount":97000000,"description":"보통예금","accountCode":"4030","counter":"경주문화재연구원","writeDate":"2026-06-20","manager":"","incomeNote":"보조금"},{"id":1781938099754,"date":"2026-06-20","type":"income","amount":25499501,"description":"보통예금","accountCode":"4030","counter":"경주문화재연구원","writeDate":"2026-06-20","manager":"","budgetCatId":"mp6lpa67gfje3","incomeNote":"특별보조금"},{"id":1781938136357,"date":"2026-06-20","type":"income","amount":499,"description":"보통예금","accountCode":"4030","counter":"경주문화재연구원","writeDate":"2026-06-20","manager":"","budgetCatId":"mp6lpa67gfje3","incomeNote":"그냥"},{"id":1781945825620,"date":"2026-06-20","type":"income","amount":33333,"description":"현금","accountCode":"4030","counter":"","writeDate":"2026-06-20","manager":"","budgetCatId":"","incomeNote":"ddzzzz"},{"id":1782019260794,"date":"2026-06-21","type":"expense","amount":1000000,"description":"장비구입비","accountCode":"5110","counter":"(주)서울건설","writeDate":"2026-06-21","manager":"박팀장","budgetCatId":"","createdBy":"한경리","approvalId":"1782009881804"},{"id":1782032173289,"date":"2026-06-21","type":"expense","amount":200000,"description":"운영비","accountCode":"5110","counter":"(주)서울건설","writeDate":"2026-06-21","manager":"한경리","budgetCatId":"","createdBy":"한경리","approvalId":"1782028353377"},{"id":1782032222296,"date":"2026-06-21","type":"expense","amount":6000000,"description":"컴퓨터구매","accountCode":"5110","counter":"(주)서울건설","writeDate":"2026-06-21","manager":"최대표","budgetCatId":"","createdBy":"한경리","approvalId":"1778924741860"},{"id":1782032253870,"date":"2026-06-21","type":"expense","amount":345,"description":"ㅇㄻㄹ","accountCode":"5110","counter":"경주문화재연구원","writeDate":"2026-06-21","manager":"최대표","budgetCatId":"","createdBy":"한경리","approvalId":"1778944330150"},{"id":1782040622157,"date":"2026-06-21","type":"expense","amount":50000,"description":"연습","accountCode":"5110","counter":"경주문화재연구원","writeDate":"2026-06-21","manager":"박팀장","budgetCatId":"mp6lpa67gfje3","createdBy":"한경리","approvalId":"1782040622302"}])
  }


  /* ── 전표 시드 ── */
  if (getItem<any[]>('acct_vouchers', []).length === 0) {
    setItem('acct_vouchers', [{"id":3002,"date":"2026-01-20","type":"expense","description":"사무용품 구매 (복사지, 토너)","counterpart":"(주)스마트오피스","paymentMethod":"현금","createdAt":"2026-01-20T09:00:00Z","entries":[{"side":"debit","accountCode":"5110","amount":320000},{"side":"credit","accountCode":"1010","amount":320000}]},{"id":3004,"date":"2026-02-08","type":"expense","description":"현장작업자 안전장비","counterpart":"(주)한국전자","paymentMethod":"계좌이체","createdAt":"2026-02-08T09:00:00Z","entries":[{"side":"debit","accountCode":"5110","amount":1500000},{"side":"credit","accountCode":"1020","amount":1500000}]},{"id":3006,"date":"2026-03-15","type":"expense","description":"3월 법인차량 유류비","counterpart":"주유소","paymentMethod":"현금","createdAt":"2026-03-15T09:00:00Z","entries":[{"side":"debit","accountCode":"5110","amount":450000},{"side":"credit","accountCode":"1010","amount":450000}]},{"id":3008,"date":"2026-03-28","type":"expense","description":"보고서 인쇄비 (300부)","counterpart":"대한인쇄공사","paymentMethod":"계좌이체","createdAt":"2026-03-28T09:00:00Z","entries":[{"side":"debit","accountCode":"5110","amount":1200000},{"side":"credit","accountCode":"1020","amount":1200000}]},{"id":3010,"date":"2026-04-05","type":"expense","description":"현장 소모품 구입","counterpart":"철물점","paymentMethod":"현금","createdAt":"2026-04-05T09:00:00Z","entries":[{"side":"debit","accountCode":"5110","amount":280000},{"side":"credit","accountCode":"1010","amount":280000}]},{"id":3012,"date":"2026-04-10","type":"expense","description":"조경 유지보수비","counterpart":"(주)그린조경","paymentMethod":"계좌이체","createdAt":"2026-04-10T09:00:00Z","entries":[{"side":"debit","accountCode":"5110","amount":3500000},{"side":"credit","accountCode":"1020","amount":3500000}]},{"id":3014,"date":"2026-04-12","type":"expense","description":"직원 간식비","counterpart":"(주)맛나푸드","paymentMethod":"현금","createdAt":"2026-04-12T09:00:00Z","entries":[{"side":"debit","accountCode":"5110","amount":150000},{"side":"credit","accountCode":"1010","amount":150000}]},{"id":3016,"date":"2026-04-18","type":"expense","description":"법률자문 수수료","counterpart":"세종법률사무소","paymentMethod":"계좌이체","createdAt":"2026-04-18T09:00:00Z","entries":[{"side":"debit","accountCode":"5110","amount":2200000},{"side":"credit","accountCode":"1020","amount":2200000}]},{"id":3018,"date":"2026-05-02","type":"expense","description":"차량 정기검사비","counterpart":"(주)퍼스트카","paymentMethod":"현금","createdAt":"2026-05-02T09:00:00Z","entries":[{"side":"debit","accountCode":"5110","amount":350000},{"side":"credit","accountCode":"1010","amount":350000}]},{"id":3020,"date":"2026-05-05","type":"expense","description":"사무실 정수기 렌탈","counterpart":"정수기렌탈","paymentMethod":"현금","createdAt":"2026-05-05T09:00:00Z","entries":[{"side":"debit","accountCode":"5110","amount":55000},{"side":"credit","accountCode":"1010","amount":55000}]},{"id":3022,"date":"2026-01-10","type":"income","description":"문화재청 1차 보조금","counterpart":"문화재청","paymentMethod":"계좌이체","createdAt":"2026-01-10T09:00:00Z","entries":[{"side":"debit","accountCode":"1020","amount":25000000},{"side":"credit","accountCode":"4030","amount":25000000}]},{"id":3024,"date":"2026-02-28","type":"income","description":"주차장 운영 수입","counterpart":"(주)그린조경","paymentMethod":"현금","createdAt":"2026-02-28T09:00:00Z","entries":[{"side":"debit","accountCode":"1010","amount":3200000},{"side":"credit","accountCode":"4030","amount":3200000}]},{"id":3026,"date":"2026-03-05","type":"income","description":"문화재청 2차 보조금","counterpart":"문화재청","paymentMethod":"계좌이체","createdAt":"2026-03-05T09:00:00Z","entries":[{"side":"debit","accountCode":"1020","amount":25000000},{"side":"credit","accountCode":"4030","amount":25000000}]},{"id":3028,"date":"2026-03-01","type":"income","description":"유적 입장료 수입","counterpart":"경주시청","paymentMethod":"현금","createdAt":"2026-03-01T09:00:00Z","entries":[{"side":"debit","accountCode":"1010","amount":8500000},{"side":"credit","accountCode":"4030","amount":8500000}]},{"id":3030,"date":"2026-03-01","type":"income","description":"블로거 촬영비 수입","counterpart":"KT서브마리나TV","paymentMethod":"현금","createdAt":"2026-03-01T09:00:00Z","entries":[{"side":"debit","accountCode":"1010","amount":1300000},{"side":"credit","accountCode":"4030","amount":1300000}]},{"id":3032,"date":"2026-04-08","type":"income","description":"기념품 판매 수입","counterpart":"기념품샵","paymentMethod":"현금","createdAt":"2026-04-08T09:00:00Z","entries":[{"side":"debit","accountCode":"1010","amount":1500000},{"side":"credit","accountCode":"4030","amount":1500000}]},{"id":3034,"date":"2026-04-05","type":"income","description":"경주시 3차 보조금","counterpart":"경주시청","paymentMethod":"계좌이체","createdAt":"2026-04-05T09:00:00Z","entries":[{"side":"debit","accountCode":"1020","amount":10000000},{"side":"credit","accountCode":"4030","amount":10000000}]},{"id":3036,"date":"2026-04-20","type":"income","description":"교육 프로그램 참가비","counterpart":"교육참가자","paymentMethod":"현금","createdAt":"2026-04-20T09:00:00Z","entries":[{"side":"debit","accountCode":"1010","amount":2400000},{"side":"credit","accountCode":"4030","amount":2400000}]},{"id":3038,"date":"2026-07-05","type":"income","description":"주차장 운영 수입","counterpart":"(주)그린조경","paymentMethod":"현금","createdAt":"2026-07-05T09:00:00Z","entries":[{"side":"debit","accountCode":"1010","amount":1800000},{"side":"credit","accountCode":"4030","amount":1800000}]},{"id":3040,"date":"2026-03-15","type":"income","description":"문화재청 3차 보조금","counterpart":"문화재청","paymentMethod":"계좌이체","createdAt":"2026-03-15T09:00:00Z","entries":[{"side":"debit","accountCode":"1020","amount":20000000},{"side":"credit","accountCode":"4030","amount":20000000}]},{"id":3042,"date":"2026-01-25","type":"expense","description":"임직원 1월 급여","counterpart":"직원계좌","paymentMethod":"계좌이체","createdAt":"2026-01-25T09:00:00Z","entries":[{"side":"debit","accountCode":"5210","amount":15000000},{"side":"credit","accountCode":"1020","amount":15000000}]},{"id":3044,"date":"2026-02-20","type":"expense","description":"거래처 접대비","counterpart":"경주시청","paymentMethod":"현금","createdAt":"2026-02-20T09:00:00Z","entries":[{"side":"debit","accountCode":"5210","amount":650000},{"side":"credit","accountCode":"1010","amount":650000}]},{"id":3046,"date":"2026-02-28","type":"expense","description":"4대보험 납부","counterpart":"국민건강보험공단","paymentMethod":"계좌이체","createdAt":"2026-02-28T09:00:00Z","entries":[{"side":"debit","accountCode":"5210","amount":4800000},{"side":"credit","accountCode":"1020","amount":4800000}]},{"id":3048,"date":"2026-03-05","type":"expense","description":"출장 여비교통비","counterpart":"사무실","paymentMethod":"현금","createdAt":"2026-03-05T09:00:00Z","entries":[{"side":"debit","accountCode":"5210","amount":850000},{"side":"credit","accountCode":"1010","amount":850000}]},{"id":3050,"date":"2026-03-31","type":"expense","description":"퇴직연금 적립","counterpart":"퇴직연금운용사","paymentMethod":"계좌이체","createdAt":"2026-03-31T09:00:00Z","entries":[{"side":"debit","accountCode":"5210","amount":3000000},{"side":"credit","accountCode":"1020","amount":3000000}]},{"id":3052,"date":"2026-05-15","type":"expense","description":"회의 다과비","counterpart":"(주)미니바로","paymentMethod":"현금","createdAt":"2026-05-15T09:00:00Z","entries":[{"side":"debit","accountCode":"5210","amount":180000},{"side":"credit","accountCode":"1010","amount":180000}]},{"id":3054,"date":"2026-05-20","type":"expense","description":"VIP 접대비","counterpart":"경주시청","paymentMethod":"현금","createdAt":"2026-05-20T09:00:00Z","entries":[{"side":"debit","accountCode":"5210","amount":450000},{"side":"credit","accountCode":"1010","amount":450000}]},{"id":3056,"date":"2026-05-01","type":"expense","description":"사무실 임대료","counterpart":"건물주","paymentMethod":"계좌이체","createdAt":"2026-05-01T09:00:00Z","entries":[{"side":"debit","accountCode":"5210","amount":3300000},{"side":"credit","accountCode":"1020","amount":3300000}]},{"id":3058,"date":"2026-05-05","type":"expense","description":"비품 수리비","counterpart":"수리업체","paymentMethod":"현금","createdAt":"2026-05-05T09:00:00Z","entries":[{"side":"debit","accountCode":"5210","amount":220000},{"side":"credit","accountCode":"1010","amount":220000}]},{"id":3060,"date":"2026-05-10","type":"expense","description":"관리비 납부","counterpart":"관리사무소","paymentMethod":"계좌이체","createdAt":"2026-05-10T09:00:00Z","entries":[{"side":"debit","accountCode":"5210","amount":880000},{"side":"credit","accountCode":"1020","amount":880000}]},{"id":1778943487828,"date":"2026-05-16","type":"expense","description":"Q1 사무용품 일괄 구매","entries":[{"side":"debit","accountCode":"5110","amount":1500000},{"side":"credit","accountCode":"1020","amount":1500000}],"createdAt":"2026-05-16T14:58:06.877Z"},{"id":1778943496791,"date":"2026-05-16","type":"expense","description":"문화재 현장 안전장비 구입","entries":[{"side":"debit","accountCode":"5110","amount":3200000},{"side":"credit","accountCode":"1020","amount":3200000}],"createdAt":"2026-05-16T14:58:16.509Z"},{"id":1778979213649,"date":"2026-05-17","type":"expense","description":"임직원 급여","entries":[{"side":"debit","accountCode":"5110","amount":50},{"side":"credit","accountCode":"1020","amount":50}],"createdAt":"2026-05-17T00:53:33.425Z"},{"id":1779027204638,"date":"2026-05-17","type":"expense","description":"구매","entries":[{"side":"debit","accountCode":"5110","amount":300000},{"side":"credit","accountCode":"1020","amount":300000}],"createdAt":"2026-05-17T14:13:24.349Z"},{"id":1779089445533,"date":"2026-05-18","type":"expense","description":"멋지게살자","entries":[{"side":"debit","accountCode":"5110","amount":1700000},{"side":"credit","accountCode":"1020","amount":1700000}],"createdAt":"2026-05-18T07:30:44.614Z"},{"id":1781933526762,"date":"2026-06-20","type":"expense","description":"Q1 사무용품 일괄 구매","entries":[{"side":"debit","accountCode":"5110","amount":1500000},{"side":"credit","accountCode":"1010","amount":1500000}],"createdAt":"2026-06-20T05:32:06.761Z"},{"id":1781937293873,"date":"2026-06-20","type":"expense","description":"컴퓨터구매","entries":[{"side":"debit","accountCode":"5110","amount":1000000},{"side":"credit","accountCode":"1020","amount":1000000}],"createdAt":"2026-06-20T06:34:53.705Z"},{"id":1781937421605,"date":"2026-06-20","type":"expense","description":"문화재 현장 안전장비 구입","entries":[{"side":"debit","accountCode":"5110","amount":3200000},{"side":"credit","accountCode":"1020","amount":3200000}],"createdAt":"2026-06-20T06:37:00.666Z"},{"id":1781937440763,"date":"2026-06-20","type":"expense","description":"발굴조사 장비 임대","entries":[{"side":"debit","accountCode":"5110","amount":8500000},{"side":"credit","accountCode":"1020","amount":8500000}],"createdAt":"2026-06-20T06:37:20.728Z"},{"id":1781937450064,"date":"2026-06-20","type":"expense","description":"법인차량 정기정비","entries":[{"side":"debit","accountCode":"5110","amount":780000},{"side":"credit","accountCode":"1020","amount":780000}],"createdAt":"2026-06-20T06:37:29.993Z"},{"id":1781937818007,"date":"2026-06-20","type":"income","description":"보통예금","entries":[{"side":"debit","accountCode":"1020","amount":70000000},{"side":"credit","accountCode":"4030","amount":70000000}],"createdAt":"2026-06-20T06:43:37.523Z"},{"id":1781937914940,"date":"2026-06-20","type":"income","description":"보통예금","entries":[{"side":"debit","accountCode":"1020","amount":97000000},{"side":"credit","accountCode":"4030","amount":97000000}],"createdAt":"2026-06-20T06:45:14.227Z"},{"id":1781938100272,"date":"2026-06-20","type":"income","description":"보통예금","entries":[{"side":"debit","accountCode":"1020","amount":25499501},{"side":"credit","accountCode":"4030","amount":25499501}],"createdAt":"2026-06-20T06:48:19.535Z"},{"id":1781938136030,"date":"2026-06-20","type":"income","description":"보통예금","entries":[{"side":"debit","accountCode":"1020","amount":499},{"side":"credit","accountCode":"4030","amount":499}],"createdAt":"2026-06-20T06:48:55.463Z"},{"id":1781945825395,"date":"2026-06-20","type":"income","description":"현금","entries":[{"side":"debit","accountCode":"1020","amount":33333},{"side":"credit","accountCode":"4030","amount":33333}],"createdAt":"2026-06-20T08:57:05.047Z"},{"id":1782019135417,"date":"2026-06-21","type":"expense","description":"운영비","entries":[{"side":"debit","accountCode":"5110","amount":500000},{"side":"credit","accountCode":"1020","amount":500000}],"createdAt":"2026-06-21T05:18:55.398Z"},{"id":1782019260641,"date":"2026-06-21","type":"expense","description":"장비구입비","entries":[{"side":"debit","accountCode":"5110","amount":1000000},{"side":"credit","accountCode":"1020","amount":1000000}],"createdAt":"2026-06-21T05:21:00.545Z"},{"id":1782032173014,"date":"2026-06-21","type":"expense","description":"운영비","entries":[{"side":"debit","accountCode":"5110","amount":200000},{"side":"credit","accountCode":"1020","amount":200000}],"createdAt":"2026-06-21T08:56:12.880Z"},{"id":1782032221835,"date":"2026-06-21","type":"expense","description":"컴퓨터구매","entries":[{"side":"debit","accountCode":"5110","amount":6000000},{"side":"credit","accountCode":"1020","amount":6000000}],"createdAt":"2026-06-21T08:57:01.810Z"},{"id":1782032253984,"date":"2026-06-21","type":"expense","description":"ㅇㄻㄹ","entries":[{"side":"debit","accountCode":"5110","amount":345},{"side":"credit","accountCode":"1020","amount":345}],"createdAt":"2026-06-21T08:57:33.650Z"},{"id":1782040622110,"date":"2026-06-21","type":"expense","description":"연습","entries":[{"side":"debit","accountCode":"5110","amount":50000},{"side":"credit","accountCode":"1020","amount":50000}],"createdAt":"2026-06-21T11:17:02.009Z"}])
  }


  /* ── 추가 시드 데이터 (로컬 동기화) ── */
  if (getItem<any[]>('acct_payment_methods', []).length === 0) {
    setItem('acct_payment_methods', ["문화재청","자체예산","단순경비","식당경비","청와대","11","문화상품권","기프트상품권","문화재청통합계좌","새금고","어음1","백화점상품권","기프트상품권"])
  }
  if (getItem<any[]>('acct_pay_methods_v2', []).length === 0) {
    setItem('acct_pay_methods_v2', [{"id":1782003160593,"name":"문화재청","category":"계좌","bankName":"국민은행","accountNumber":"110-23394-34948-00","accountHolder":"최부자","purpose":"문화재청사업비","manager":"한경리","memo":"","cards":[{"id":1782034666037,"cardName":"","cardCompany":"","cardNumber":"","cardType":"체크카드","cardUser":""}]},{"id":1782003647695,"name":"자체예산","category":"계좌","bankName":"카카오뱅크","manager":"임기획","cards":[{"id":1782004087943,"cardName":"일반관리카드","cardCompany":"카카오뱅크","cardNumber":"1234-5847-8282-7161","cardType":"신용카드","cardUser":"강선임","expiryDate":"12/04","cardLimit":5000000},{"id":1782004309966,"cardName":"식대전용","cardCompany":"카카오뱅크","cardNumber":"3233-3272-6635-2615","cardType":"체크카드","cardUser":"임기획","expiryDate":"23/45"}]},{"id":1782004757518,"name":"단순경비","category":"현금","storageLocation":"사무실","custodian":"박팀장","cashLimit":200000,"purpose":"소액 및 현장 비용","memo":"한도액 이상 관리하지 마세요"},{"id":1782004837483,"name":"식당경비","category":"현금","storageLocation":"식당","custodian":"박팀장","cashLimit":500000,"purpose":"식자재 현금구입","memo":"한도액 초과 관리 하지마세요"},{"id":1782005511576,"name":"청와대","category":"어음","noteType":"","noteBank":"국민은행","noteManager":"강선임","defaultMaturity":"90일","notes":[{"id":1782005792498,"noteNumber":"","issuer":"","receiver":"우리회사","amount":0,"issueDate":"2026-06-21","maturityDate":"","endorsement":"","status":"미결제"},{"id":1782005999590,"noteNumber":"","issuer":"","receiver":"우리회사","amount":0,"issueDate":"2026-06-21","maturityDate":"","endorsement":"","bank":"","status":"미결제"}]},{"id":1782006154142,"name":"11","category":"기타"},{"id":1782006950211,"name":"문화상품권","category":"상품권","voucherAmount":100000,"voucherManager":"임기획"},{"id":1782006987466,"name":"기프트상품권","category":"상품권","voucherAmount":500000,"voucherManager":"조영업"},{"id":1782037240641,"name":"문화재청통합계좌","category":"계좌","budgetCatId":"mp6lpa67gfje3","bankName":"국민은행","accountNumber":"1120-2345-1827-09","accountHolder":"최부자선양회","manager":"한경리","purpose":"사업비","memo":"문화재청 26년 사업비","cards":[{"id":1782037311536,"cardName":"통합카드","cardCompany":"국민카드","cardNumber":"3453-4544-3345-5665","cardType":"체크카드","cardUser":"한경리","expiryDate":"23/45"}]},{"id":1782037514959,"name":"새금고","category":"현금","budgetCatId":"mp6lpa67gfje3","custodian":"한경리","storageLocation":"사무실","cashLimit":500000,"purpose":"소액경비"},{"id":1782037564895,"name":"어음1","category":"어음","budgetCatId":"mp6lpa67gfje3","noteManager":"한경리","noteType":"수신","defaultMaturity":"90일","notes":[{"id":1782037585055,"noteNumber":"","issuer":"","receiver":"우리회사","amount":0,"issueDate":"2026-06-21","maturityDate":"","endorsement":"","bank":"","status":"미결제"}]},{"id":1782037621726,"name":"백화점상품권","category":"상품권","budgetCatId":"mp6lpa67gfje3","voucherManager":"한경리","voucherAmount":100000,"voucherQty":10},{"id":1782037750752,"name":"기프트상품권","category":"상품권","budgetCatId":"mp6lpa67gfje3","voucherManager":"한경리","voucherAmount":200000,"voucherQty":5,"voucherStorage":"사무실금고"}])
  }
  if (getItem<any[]>('acct_hq_vendors', []).length === 0) {
    setItem('acct_hq_vendors', [{"id":1,"companyName":"(주)한국솔루션","zipCode":"","address1":"","address2":"","ceoName":"김대표","ceoPhone":"02-1234-5678","bizNo":"123-45-67890","bizPhone":"","bizType":"제조","bizCategory":"커튼.블라인드 원단 제조","taxEmail":"hg001@gmail.com","companyPhoto":"","managerName":"이경자","managerTitle":"팀장","managerPhone":"010-1111-2222","managerEmail":"lee@ksol.co.kr","managerId":"","managerPw":"","managerPhoto":"","solutions":[{"name":"워크엠","enabled":true},{"name":"홈페이지","enabled":true,"qty":1},{"name":"원단공급사","enabled":false},{"name":"제조공급사","enabled":false},{"name":"유통관리사","enabled":false},{"name":"가맹대리점","enabled":false},{"name":"식재대리점","enabled":false}],"monthlyFee":200000,"vendorCode":"","serverFee":0,"dbFee":25000,"dbUsage":"25,000MB","dbUnitPrice":1000,"usageCount":5400,"usageCountLabel":"523,221건","usageUnitPrice":10,"salesRate":7,"periodSales":12350000,"bizCertPhoto":"","history":[{"date":"2026-04-21 06:33:32","desc":"단가 수정"},{"date":"2026-04-21 06:33:35","desc":"정보 수정"},{"date":"2026-04-21 06:35:47","desc":"정보 수정"}],"billingList":[{"period":"2026.01.01-2026.01.31","monthlyFee":200000,"dbFee":250000,"dataFee":48200,"commission":500000,"total":998200,"status":"납부"},{"period":"2026.02.01-2026.02.28","monthlyFee":200000,"dbFee":280000,"dataFee":52100,"commission":520000,"total":1052100,"status":"납부"},{"period":"2026.03.01-2026.03.31","monthlyFee":200000,"dbFee":250000,"dataFee":49800,"commission":480000,"total":979800,"status":"청구"}]},{"id":2,"companyName":"대명테크(주)","zipCode":"","address1":"","address2":"","ceoName":"박사장","ceoPhone":"02-9876-5432","bizNo":"234-56-78901","bizPhone":"","bizType":"","bizCategory":"","taxEmail":"","companyPhoto":"","managerName":"최수민","managerTitle":"","managerPhone":"010-3333-4444","managerEmail":"choi@dmtech.co.kr","managerId":"","managerPw":"","managerPhoto":"","solutions":[{"name":"워크엠","enabled":true},{"name":"홈페이지","enabled":true,"qty":1},{"name":"원단공급사","enabled":false},{"name":"제조공급사","enabled":false},{"name":"유통관리사","enabled":false},{"name":"가맹대리점","enabled":false},{"name":"식재대리점","enabled":false}],"monthlyFee":150000,"vendorCode":"","serverFee":0,"dbFee":25000,"dbUsage":"25,000MB","dbUnitPrice":1000,"usageCount":5400,"usageCountLabel":"523,221건","usageUnitPrice":10,"salesRate":7,"periodSales":8500000,"bizCertPhoto":"","history":[],"billingList":[{"period":"2026.01.01-2026.01.31","monthlyFee":200000,"dbFee":250000,"dataFee":48200,"commission":500000,"total":998200,"status":"납부"},{"period":"2026.02.01-2026.02.28","monthlyFee":200000,"dbFee":280000,"dataFee":52100,"commission":520000,"total":1052100,"status":"납부"},{"period":"2026.03.01-2026.03.31","monthlyFee":200000,"dbFee":250000,"dataFee":49800,"commission":480000,"total":979800,"status":"청구"}]},{"id":3,"companyName":"서울유통(주)","zipCode":"","address1":"","address2":"","ceoName":"정회장","ceoPhone":"02-5555-6666","bizNo":"345-67-89012","bizPhone":"","bizType":"","bizCategory":"","taxEmail":"","companyPhoto":"","managerName":"강미영","managerTitle":"","managerPhone":"010-5555-6666","managerEmail":"kang@seouldt.co.kr","managerId":"","managerPw":"","managerPhoto":"","solutions":[{"name":"워크엠","enabled":true},{"name":"홈페이지","enabled":false,"qty":1},{"name":"원단공급사","enabled":false},{"name":"제조공급사","enabled":false},{"name":"유통관리사","enabled":true},{"name":"가맹대리점","enabled":true},{"name":"식재대리점","enabled":false}],"monthlyFee":300000,"vendorCode":"","serverFee":0,"dbFee":25000,"dbUsage":"25,000MB","dbUnitPrice":1000,"usageCount":5400,"usageCountLabel":"523,221건","usageUnitPrice":10,"salesRate":3,"periodSales":25000000,"bizCertPhoto":"","history":[],"billingList":[{"period":"2026.01.01-2026.01.31","monthlyFee":200000,"dbFee":250000,"dataFee":48200,"commission":500000,"total":998200,"status":"납부"},{"period":"2026.02.01-2026.02.28","monthlyFee":200000,"dbFee":280000,"dataFee":52100,"commission":520000,"total":1052100,"status":"납부"},{"period":"2026.03.01-2026.03.31","monthlyFee":200000,"dbFee":250000,"dataFee":49800,"commission":480000,"total":979800,"status":"청구"}]}])
  }
  if (getItem<any[]>('acct_opening_balances', []).length === 0) {
    setItem('acct_opening_balances', [{"year":2026,"accountCode":"1010","amount":5000000},{"year":2026,"accountCode":"1020","amount":50000000},{"year":2026,"accountCode":"1030","amount":2000000},{"year":2026,"accountCode":"1040","amount":1000000},{"year":2026,"accountCode":"1530","amount":3000000},{"year":2026,"accountCode":"1540","amount":10000000},{"year":2026,"accountCode":"2010","amount":5000000},{"year":2026,"accountCode":"2030","amount":3000000},{"year":2026,"accountCode":"3010","amount":50000000},{"year":2026,"accountCode":"3020","amount":13000000}])
  }

  setItem(currentSeedVer, '1')
}
