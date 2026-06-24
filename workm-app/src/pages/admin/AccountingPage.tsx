import React, { useState, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../../components/common/PageHeader'
import { EmptyState } from '../../components/common/EmptyState'
import { cn } from '../../utils/cn'
import { getItem, setItem } from '../../utils/storage'
import { useToastStore } from '../../stores/toastStore'
import { saveAttachmentImage, deleteAttachmentImage } from '../../utils/attachmentDB'
import { formatNumber } from '../../utils/format'
import { AcctBalance } from '../../components/accounting/AcctBalance'
import { AcctReports } from '../../components/accounting/AcctReports'
import { PrintApprovalForm } from '../../components/accounting/PrintApprovalForm'
import { BudgetTreePanel } from './SettingsPage'
import { useStaffStore } from '../../stores/staffStore'
import { useAuthStore } from '../../stores/authStore'
import { CustomSelect } from '../../components/ui/CustomSelect'
import { DatePicker } from '../../components/ui/DatePicker'
import {
  LayoutDashboard, Wallet, FileCheck, ArrowDownCircle, ArrowUpCircle,
  BookOpen, PieChart, ScrollText, Settings2, ContactRound, Building2,
  TrendingDown, TrendingUp, Banknote, Clock, Search, ChevronDown, ChevronUp,
  Plus, Edit3, Trash2, Save, X, Check, Ban, MoreHorizontal,
  Lock, ShieldCheck, RefreshCw, Printer, Paperclip, Send, Eye,
  CreditCard, Settings, Smartphone, User, Phone, Mail, Landmark,
  ArrowLeftRight, Calendar, Filter, Download,
} from 'lucide-react'

/* ─── 서버 설정 동기화 ── */
const SYNC_KEYS = [
  'acct_accounts', 'acct_budgets', 'acct_budget_cats', 'acct_budget_item_defs',
  'acct_pay_methods_v2', 'acct_income_methods', 'acct_payment_methods',
  'acct_cashflows', 'acct_vouchers', 'acct_approvals', 'acct_vendors',
  'acct_opening_balances', 'acct_hq_vendors', 'ws_users',
  'acct_itemName_history', 'acct_subItemName_history',
  'acct_desc_myRequest_pending', 'acct_desc_myRequest_preExpense',
  'acct_title_myRequest_pending', 'acct_title_myRequest_preExpense',
  'acct_title_myRequest_approved', 'acct_title_myApproval_approved',
  'acct_company_accounts',
]

export async function loadSettingsFromServer() {
  try {
    const base = import.meta.env.BASE_URL || '/'
    const res = await fetch(`${base}data/settings.json?t=${Date.now()}`)
    if (!res.ok) return false
    const data = await res.json()
    if (!data || typeof data !== 'object') return false
    let loaded = 0
    for (const key of Object.keys(data)) {
      // 이미 로컬에 있으면 덮어쓰지 않음 (로컬 우선)
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]))
        loaded++
      }
    }
    return loaded > 0
  } catch { return false }
}

export function exportSettingsJson(): string {
  const data: Record<string, any> = {}
  for (const key of SYNC_KEYS) {
    const val = localStorage.getItem(key)
    if (val) {
      try { data[key] = JSON.parse(val) } catch { data[key] = val }
    }
  }
  return JSON.stringify(data, null, 2)
}

export function downloadSettingsJson() {
  const json = exportSettingsJson()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'settings.json'
  a.click()
  URL.revokeObjectURL(url)
}

export function importSettingsFromJson(json: string, overwrite = true): number {
  try {
    const data = JSON.parse(json)
    let count = 0
    for (const key of Object.keys(data)) {
      if (overwrite || !localStorage.getItem(key)) {
        localStorage.setItem(key, typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]))
        count++
      }
    }
    return count
  } catch { return 0 }
}

/* ─── 회계 시드 데이터 초기화 ── */
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
    localStorage.setItem('_acct_desc_patch_v1', '1')
  }

  /* ── 보조금수익 계정과목 패치 ── */
  if (!localStorage.getItem('_acct_subsidy_patch_v1')) {
    const existing = getItem<any[]>('acct_accounts', [])
    if (existing.length > 0 && !existing.some(a => a.code === '4-02-08')) {
      existing.push({ code: '4-02-08', name: '보조금수익', type: 'revenue', group: '영업외수익', description: '국가·지자체 등으로부터 받은 보조금 수익', active: true })
      setItem('acct_accounts', existing)
    }
    localStorage.setItem('_acct_subsidy_patch_v1', '1')
  }

  /* ── 선지출 품의가 approved 상태인 경우 toResolve로 자동 마이그레이션 ── */
  if (!localStorage.getItem('_acct_preexp_resolve_v1')) {
    const existingApprovals = getItem<any[]>('acct_approvals', [])
    let patchedPre = false
    const updatedApprovals = existingApprovals.map((a: any) => {
      if (a.status === 'approved' && (a.isPreExpense || (a.title || '').startsWith('[선지출]'))) {
        patchedPre = true
        return { ...a, status: 'toResolve' }
      }
      return a
    })
    if (patchedPre) setItem('acct_approvals', updatedApprovals)
    localStorage.setItem('_acct_preexp_resolve_v1', '1')
  }

  /* ── 시드 버전 변경 시 회계 데이터 초기화 후 재시드 ── */
  const currentSeedVer = '_acct_react_seed_v11'
  const acctSeedDone = !!localStorage.getItem(currentSeedVer)  // early return 제거: 개별 키 체크로 복구
  // 이전 버전 데이터가 있으면 클리어 후 재시드
  const oldKeys = ['_acct_react_seed_v1','_acct_react_seed_v2','_acct_react_seed_v3','_acct_react_seed_v4','_acct_react_seed_v5','_acct_react_seed_v6','_acct_react_seed_v7','_acct_react_seed_v8','_acct_react_seed_v9','_acct_react_seed_v10']
  const hadOldSeed = oldKeys.some(k => localStorage.getItem(k))
  if (hadOldSeed) {
    // 이전 시드 버전 키 제거 + 회계 데이터 클리어
    oldKeys.forEach(k => localStorage.removeItem(k))
    ;['acct_budget_cats','acct_budgets','acct_approvals','acct_cashflows','acct_vouchers','acct_vendors'].forEach(k => localStorage.removeItem(k))
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

  localStorage.setItem(currentSeedVer, '1')
}

/* ─────────────────────────────────────────────
   타입
   ───────────────────────────────────────────── */
interface BudgetCatAccount {
  id: number
  bankName: string   // 예) 기업은행 10110-11001-12
  cards: string[]    // 연결 카드 목록
}
interface BudgetCat {
  id: string | number
  name: string
  year?: number
  bank?: string
  bankInfo?: string
  accounts?: BudgetCatAccount[]  // 복수 계좌
  periodFrom?: string
  periodTo?: string
  users?: string[]  // 지출담당자 (직원 이름 목록)
  approver?: string  // 승인담당자
}

interface AccountPoolEntry {
  accountCode: string
  contraAccountCode?: string
}
interface BudgetDetailDef {
  id: number
  name: string
  parentId: number
  aliases: string[]
  accountCode?: string
  sortOrder: number
}
interface BudgetSubDef {
  id: number
  name: string
  parentId: number
  aliases: string[]
  accountCode?: string
  detailItems?: BudgetDetailDef[]
  sortOrder: number
}
interface BudgetItemDef {
  id: number
  name: string
  aliases: string[]
  accountPool: AccountPoolEntry[]
  defaultAccountCode?: string
  subItems: BudgetSubDef[]
  sortOrder: number
}

interface BudgetItem {
  id: string | number
  catId: string | number
  year?: number
  itemName: string
  subItemName?: string
  detailItemName?: string
  accountCode?: string
  contraAccountCode?: string
  amount: number
  spent: number
  memo?: string
  budgetItemDefId?: number
  budgetSubDefId?: number
}

interface CashFlow {
  id: string | number
  type: 'income' | 'expense'
  amount: number
  date: string
  description?: string
  accountCode?: string
  manager?: string         // 담당자
  approvalStatus?: string  // 품의상태: 품의준비, 품의완료 등
}

interface Approval {
  id: string | number
  status: string
  date?: string
  createdAt?: string
  accountCode?: string
  amount?: number
  title?: string
  description?: string
  applicant?: string   // 품의자
  approver?: string    // 승인자
  budgetItem?: string      // 예산목
  budgetSubItem?: string   // 예산세목
}

interface Voucher {
  id: string | number
  type?: string
  date?: string
  description?: string
  createdAt?: string
  entries?: Array<{ side: string; amount: number; accountCode?: string; account?: string }>
}

/* ─── 서브 페이지 정의 ── */
const SUB_PAGES = [
  { key: 'overview',     label: '기본현황',   icon: LayoutDashboard },
  { key: 'base_budget',  label: '기초예산',   icon: PieChart },
  { key: 'approval',     label: '품의하기',   icon: FileCheck },
  { key: 'expense',      label: '지출하기',   icon: TrendingDown },
  { key: 'income',       label: '입금전표',   icon: TrendingUp },
  { key: 'withdrawal',   label: '출금전표',   icon: ArrowUpCircle },
  { key: 'payment',      label: '전표장부',   icon: BookOpen },
  { key: 'cashflow_list', label: '입출금내역', icon: ArrowLeftRight },
  { key: 'reports',      label: '회계현황',   icon: ScrollText },
  { key: 'vendors',      label: '거래처관리',   icon: ContactRound },
  { key: 'methodReg',    label: '수단등록',   icon: CreditCard },
  { key: 'budgetTree',   label: '예산과목',   icon: Settings },
  { key: 'hq_vendor',    label: '본사거래처',   icon: Building2 },
  { key: 'acct_mgmt',    label: '계정관리',   icon: Settings2 },
]

/* ═══════════════════════════════════════════
   AccountingPage 메인
   ═══════════════════════════════════════════ */
export function AccountingPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeSub = searchParams.get('tab') || 'overview'
  const setActiveSub = (tab: string) => {
    const year = searchParams.get('year') || ''
    const params: Record<string, string> = { tab }
    if (year) params.year = year
    setSearchParams(params)
  }
  const currentYear = new Date().getFullYear()
  const year = parseInt(searchParams.get('year') || '') || parseInt(localStorage.getItem('acct_active_year') || '') || currentYear
  const selectedOverviewCatId = searchParams.get('cat') || null
  const [yearDropOpen, setYearDropOpen] = useState(false)
  const overviewCats = useMemo(() => getItem<BudgetCat[]>('acct_budget_cats', []).filter(c => {
    const cy = c.year || (c.periodFrom ? parseInt(c.periodFrom.substring(0,4)) : currentYear)
    return cy === year
  }), [year])

  useEffect(() => {
    // 서버에서 설정 로드 후 시드 초기화
    loadSettingsFromServer().finally(() => {
      initAccountingSeed()
    })
  }, [])

  // ── 권한 없는 탭 접근 시 리디렉트 ──
  useEffect(() => {
    const userName = JSON.parse(localStorage.getItem('ws_current_user') || '{}')?.name || ''
    const staffList = JSON.parse(localStorage.getItem('ws_users') || '[]') as any[]
    const currentStaff = staffList.find((s: any) => s.name === userName)
    const isAdmin = currentStaff?.role === 'admin'
    const isBudgetApprover = currentStaff?.approverType === 'approver'
    const budgetCats = JSON.parse(localStorage.getItem('acct_budget_cats') || '[]') as any[]
    const isBudgetHandler = budgetCats.some((c: any) =>
      (c.users && c.users.includes(userName)) ||
      (c.approvers && c.approvers.includes(userName)) ||
      (c.approver === userName)
    )
    const approvals = JSON.parse(localStorage.getItem('acct_approvals') || '[]') as any[]
    const isApproverInApprovals = approvals.some((a: any) => a.approver === userName)
    const hasBudgetAccess = isAdmin || isBudgetApprover || isBudgetHandler || isApproverInApprovals
    const restrictedTabs = ['overview', 'base_budget', 'expense', 'income', 'withdrawal', 'payment', 'cashflow_list', 'reports', 'vendors', 'budgetTree', 'accounts', 'hq_vendor', 'methodReg', 'acct_mgmt']
    if (!hasBudgetAccess && restrictedTabs.includes(activeSub)) {
      setActiveSub('approval')
    }
  }, [activeSub])

  return (
    <div className="animate-fadeIn">




      {/* ── 서브 페이지 렌더 ── */}
      {activeSub === 'overview' && <AcctOverview year={year} selectedCatId={selectedOverviewCatId === 'all' ? null : selectedOverviewCatId} />}
      {(activeSub === 'base_budget' || activeSub === 'budget' || activeSub === 'balance') && <AcctBaseBudget year={year} />}
      {activeSub === 'approval' && <AcctApproval year={year} />}
      {(activeSub === 'expense' || activeSub === 'income' || activeSub === 'withdrawal') && (
        <AcctVoucherEntry year={year} type={activeSub as 'expense' | 'income' | 'withdrawal'} catId={selectedOverviewCatId} />
      )}
      {activeSub === 'payment' && <AcctPaymentLedger year={year} catId={selectedOverviewCatId} />}
      {activeSub === 'cashflow_list' && <AcctCashflowList year={year} />}
      {activeSub === 'reports' && <AcctReports year={year} />}
      {activeSub === 'vendors' && <AcctVendors />}
      {activeSub === 'methodReg' && <AcctMethodReg catId={selectedOverviewCatId} />}
      {activeSub === 'hq_vendor' && <AcctHQVendor />}
      {activeSub === 'budgetTree' && <BudgetTreePanel />}
      {activeSub === 'acct_mgmt' && <AcctAccountsMgmt />}
      {!['overview','base_budget','budget','balance','approval','expense','income','withdrawal','payment','cashflow_list','reports','vendors','methodReg','hq_vendor','budgetTree','acct_mgmt'].includes(activeSub) && (
        <AcctSubPlaceholder
          pageKey={activeSub}
          label={SUB_PAGES.find(s => s.key === activeSub)?.label || ''}
        />
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════
   기본현황 (Overview)
   ═══════════════════════════════════════════ */
function AcctOverview({ year, selectedCatId }: { year: number; selectedCatId: string | number | null }) {
  const budgetCats = useMemo(() => getItem<BudgetCat[]>('acct_budget_cats', []), [])
  const budgets = useMemo(() => getItem<BudgetItem[]>('acct_budgets', []), [])
  const cashflows = useMemo(() => getItem<CashFlow[]>('acct_cashflows', []), [])
  const approvals = useMemo(() => getItem<Approval[]>('acct_approvals', []), [])
  const vouchers = useMemo(() => getItem<Voucher[]>('acct_vouchers', []), [])
  const user = useAuthStore(s => s.user)

  const selectedOverviewCatId = selectedCatId

  // 예산 접근 권한 확인
  const { hasBudgetAccess, isBudgetApprover } = useMemo(() => {
    const userName = user?.name || ''
    const staffList = getItem<any[]>('ws_users', [])
    const currentStaff = staffList.find(s => s.name === userName)
    const isApprover = currentStaff?.approverType === 'approver'
    const isHandler = budgetCats.some(c =>
      (c.users && c.users.includes(userName)) ||
      ((c as any).approvers && (c as any).approvers.includes(userName))
    )
    return { hasBudgetAccess: isApprover || isHandler, isBudgetApprover: isApprover }
  }, [user, budgetCats])

  const isInYear = (dateStr?: string) => {
    if (!dateStr) return false
    return parseInt(String(dateStr).substring(0, 4)) === year
  }

  /* ── 연도별 필터 ── */
  const allYearCats = budgetCats.filter(cat => {
    const catYear = cat.year || (cat.periodFrom ? parseInt(cat.periodFrom.substring(0, 4)) : new Date().getFullYear())
    return catYear === year
  })
  // 모든 카테고리 표시 (클릭 가능 여부는 렌더링에서 개별 체크)
  const yearCats = allYearCats
  const yearCatIds = yearCats.map(c => c.id)
  const yearBudgets = budgets.filter(b => yearCatIds.includes(b.catId))
  const yearCashflows = cashflows.filter(cf => isInYear(cf.date))
  const yearApprovals = approvals.filter(a => isInYear(a.date || a.createdAt))
  const yearVouchers = vouchers.filter(v => isInYear(v.date))

  /* ── 선택 구분별 예산 필터 ── */
  const filteredBudgets = selectedOverviewCatId
    ? yearBudgets.filter(b => String(b.catId) === String(selectedOverviewCatId))
    : yearBudgets

  /* ── 통계 ── */
  const totalIncomeAll = yearCashflows.filter(c => c.type === 'income').reduce((a, c) => a + (c.amount || 0), 0)
  const totalExpenseAll = yearCashflows.filter(c => c.type === 'expense').reduce((a, c) => a + (c.amount || 0), 0)
  const pendingCount = yearApprovals.filter(a => a.status === 'pending').length
  const totalBudgetAmt = filteredBudgets.reduce((a, b) => a + (b.amount || 0), 0)
  const totalBudgetSpent = filteredBudgets.reduce((a, b) => a + (b.spent || 0), 0)
  const budgetRate = totalBudgetAmt > 0 ? Math.round(totalBudgetSpent / totalBudgetAmt * 100) : 0

  // 예산구분 선택 시 해당 예산의 합계만 표시, 전체 시 캐시플로 합계 표시
  const displayIncome = selectedOverviewCatId ? totalBudgetAmt : totalIncomeAll
  const displayExpense = selectedOverviewCatId ? totalBudgetSpent : totalExpenseAll
  const displayBalance = selectedOverviewCatId ? (totalBudgetAmt - totalBudgetSpent) : (totalIncomeAll - totalExpenseAll)

  const statCards = [
    { icon: ArrowDownCircle, label: selectedOverviewCatId ? '총 예산' : '총 수입', value: `${formatNumber(displayIncome)}원`, color: '#22c55e' },
    { icon: ArrowUpCircle, label: selectedOverviewCatId ? '총 집행' : '총 지출', value: `${formatNumber(displayExpense)}원`, color: '#ef4444' },
    { icon: Banknote, label: selectedOverviewCatId ? '잔여 예산' : '잔액', value: `${formatNumber(displayBalance)}원`, color: displayBalance >= 0 ? '#4f6ef7' : '#ef4444' },
    { icon: FileCheck, label: '결재 대기', value: `${pendingCount}건`, color: '#f59e0b' },
  ]

  /* ── 최근 전표 5건 ── */
  const recentVouchers = [...yearVouchers]
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, 5)

  /* ── 예산 소진율 TOP 5 ── */
  const budgetBars = filteredBudgets
    .map(b => ({
      name: b.itemName,
      pct: b.amount > 0 ? Math.round((b.spent || 0) / b.amount * 100) : 0,
      spent: b.spent || 0,
      amount: b.amount,
    }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5)

  /* ── 월별 수입/지출 (최근 6개월) ── */
  const monthData = useMemo(() => {
    const now = new Date()
    const data: Record<string, { income: number; expense: number }> = {}
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      data[key] = { income: 0, expense: 0 }
    }
    yearCashflows.forEach(c => {
      const mk = c.date ? c.date.slice(0, 7) : ''
      if (data[mk]) {
        if (c.type === 'income') data[mk].income += (c.amount || 0)
        else data[mk].expense += (c.amount || 0)
      }
    })
    return data
  }, [yearCashflows])

  const maxMonthVal = Math.max(1, ...Object.values(monthData).map(d => Math.max(d.income, d.expense)))
  const tabColors = ['#4f6ef7', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

  const [searchParams, setSearchParams] = useSearchParams()

  /* 연도 목록 (기초예산에서 설정된 연도들) */
  const allYears = useMemo(() => {
    const ySet = new Set(budgetCats.map(c => {
      if (c.year) return c.year
      if (c.periodFrom) return parseInt(c.periodFrom.substring(0, 4))
      return new Date().getFullYear()
    }))
    ySet.add(year)
    return Array.from(ySet).sort((a, b) => a - b)
  }, [budgetCats, year])

  const setOverviewYear = (y: number) => {
    const params: Record<string, string> = { tab: 'overview', year: String(y) }
    setSearchParams(params)
  }

  const setOverviewCat = (catId: string | null) => {
    const params: Record<string, string> = { tab: 'overview', year: String(year) }
    if (catId) params.cat = catId
    setSearchParams(params)
  }

  const addToast = useToastStore(s => s.add)

  const handleServerSave = () => {
    downloadSettingsJson()
    addToast('success', '설정 파일(settings.json)이 다운로드됩니다. docs/data/ 폴더에 넣고 배포하세요.')
  }

  const handleServerLoad = async () => {
    const loaded = await loadSettingsFromServer()
    if (loaded) {
      addToast('success', '서버에서 설정을 불러왔습니다. 새로고침합니다.')
      setTimeout(() => window.location.reload(), 1000)
    } else {
      addToast('info', '서버에 저장된 설정이 없거나 이미 최신 상태입니다.')
    }
  }

  const handleFileImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e: any) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const count = importSettingsFromJson(reader.result as string, true)
        if (count > 0) {
          addToast('success', `${count}개 설정을 불러왔습니다. 새로고침합니다.`)
          setTimeout(() => window.location.reload(), 1000)
        } else {
          addToast('error', '올바른 설정 파일이 아닙니다.')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  return (
    <div className="space-y-4">
      {/* ── 데이터 동기화 ── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-sm font-extrabold text-[var(--text-primary)]">📦 데이터 동기화</span>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">로컬 설정을 서버에 저장하거나, 서버에서 불러올 수 있습니다</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleServerSave} className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors flex items-center gap-1">
              ⬆️ 서버 저장
            </button>
            <button onClick={handleServerLoad} className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center gap-1">
              ⬇️ 서버에서 불러오기
            </button>
            <button onClick={handleFileImport} className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[var(--bg-muted)] text-[var(--text-primary)] border border-[var(--border-default)] hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-1">
              📂 파일 불러오기
            </button>
          </div>
        </div>
      </div>
      {/* ── 통계 카드 ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(card => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center mb-2"
                style={{ background: `${card.color}22`, color: card.color }}
              >
                <Icon size={17} />
              </div>
              <div className="text-[11px] font-bold text-[var(--text-muted)]">{card.label}</div>
              <div className="text-lg font-extrabold" style={{ color: card.color }}>{card.value}</div>
            </div>
          )
        })}
      </div>

      {/* ── 예산 집행 현황 ── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4">
        <div className="flex items-center gap-2 text-sm font-extrabold text-[var(--text-primary)] mb-3">
          <PieChart size={16} className="text-primary-500" /> 예산 집행 현황
        </div>        <div className="grid grid-cols-3 gap-4 mb-3">
          <div className="text-center">
            <div className="text-[11px] text-[var(--text-muted)] mb-1">총 편성 예산</div>
            <div className="text-base font-extrabold text-[var(--text-primary)]">{formatNumber(totalBudgetAmt)}원</div>
          </div>
          <div className="text-center">
            <div className="text-[11px] text-[var(--text-muted)] mb-1">총 집행액</div>
            <div className="text-base font-extrabold text-danger">{formatNumber(totalBudgetSpent)}원</div>
          </div>
          <div className="text-center">
            <div className="text-[11px] text-[var(--text-muted)] mb-1">잔여예산</div>
            <div className="text-base font-extrabold text-success">{formatNumber(totalBudgetAmt - totalBudgetSpent)}원</div>
          </div>
        </div>
        <div className="h-3.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, budgetRate)}%`,
              background: budgetRate > 100 ? '#ef4444' : budgetRate > 80 ? '#f59e0b' : '#4f6ef7',
            }}
          />
        </div>
        <div
          className="text-right text-xs font-bold mt-1"
          style={{ color: budgetRate > 100 ? '#ef4444' : 'var(--text-muted)' }}
        >
          {budgetRate}% 집행
        </div>
      </div>

      {/* ── 2칼럼: 월별 차트 + 예산 소진율 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 월별 차트 */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[var(--text-primary)] mb-4">
            <Settings2 size={16} className="text-primary-500" /> 월별 수입 · 지출
          </div>
          <div className="flex items-end justify-between gap-2 h-[140px]">
            {Object.entries(monthData).map(([key, d]) => {
              const ih = Math.max(4, (d.income / maxMonthVal) * 120)
              const eh = Math.max(4, (d.expense / maxMonthVal) * 120)
              return (
                <div key={key} className="flex-1 flex flex-col items-center gap-1">
                  <div className="flex items-end gap-0.5 h-[120px]">
                    <div
                      className="w-3 rounded-t-sm transition-all duration-500"
                      style={{ height: ih, background: '#22c55e' }}
                      title={`수입 ${formatNumber(d.income)}원`}
                    />
                    <div
                      className="w-3 rounded-t-sm transition-all duration-500"
                      style={{ height: eh, background: '#ef4444' }}
                      title={`지출 ${formatNumber(d.expense)}원`}
                    />
                  </div>
                  <span className="text-[9px] font-bold text-[var(--text-muted)]">{key.slice(5)}월</span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-4 justify-center mt-3">
            <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#22c55e' }} /> 수입
            </span>
            <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#ef4444' }} /> 지출
            </span>
          </div>
        </div>

        {/* 예산 소진율 TOP 5 */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[var(--text-primary)] mb-4">
            <PieChart size={16} className="text-primary-500" /> 예산 소진율 TOP 5
          </div>
          {budgetBars.length === 0 ? (
            <EmptyState emoji="📊" title="등록된 예산이 없습니다" />
          ) : (
            <div className="space-y-3">
              {budgetBars.map((b, i) => {
                const color = b.pct > 100 ? '#ef4444' : b.pct > 80 ? '#f59e0b' : '#4f6ef7'
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-bold text-[var(--text-primary)] truncate">{b.name}</span>
                      <span className="font-extrabold" style={{ color }}>{b.pct}%{b.pct > 100 ? ' ⚠️' : ''}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, b.pct)}%`, background: color }}
                      />
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                      {formatNumber(b.spent)}원 / {formatNumber(b.amount)}원
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── 최근 전표 ── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-default)]">
          <ScrollText size={16} className="text-primary-500" />
          <span className="text-sm font-extrabold text-[var(--text-primary)]">최근 전표</span>
        </div>
        {recentVouchers.length === 0 ? (
          <div className="p-6">
            <EmptyState emoji="📋" title="등록된 전표가 없습니다" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-[var(--bg-muted)]">
                  {['날짜', '유형', '적요', '차변', '대변'].map((h, i) => (
                    <th key={i} className="py-2.5 px-3.5 text-[11px] font-bold text-[var(--text-muted)] text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentVouchers.map(v => {
                  let ds = 0, cs = 0
                  ;(v.entries || []).forEach(e => {
                    if (e.side === 'debit') ds += e.amount
                    else cs += e.amount
                  })
                  const typeInfo = v.type === 'income'
                    ? { label: '입금', color: '#22c55e', bg: 'rgba(34,197,94,.1)' }
                    : v.type === 'expense'
                      ? { label: '출금', color: '#ef4444', bg: 'rgba(239,68,68,.1)' }
                      : { label: '대체', color: '#8b5cf6', bg: 'rgba(139,92,246,.1)' }
                  return (
                    <tr key={v.id} className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-muted)] transition-colors">
                      <td className="py-2.5 px-3.5 text-[12px] text-[var(--text-secondary)]">{v.date || ''}</td>
                      <td className="py-2.5 px-3.5">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: typeInfo.bg, color: typeInfo.color }}
                        >
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-[12px] text-[var(--text-primary)] font-bold truncate max-w-[200px]">
                        {v.description || ''}
                      </td>
                      <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-danger text-right">{formatNumber(ds)}원</td>
                      <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-success text-right">{formatNumber(cs)}원</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>


    </div>
  )
}

/* ═══════════════════════════════════════════
   기초예산 — 예산설정 + 기초잔액 통합 래퍼
   ═══════════════════════════════════════════ */
function AcctBaseBudget({ year: propYear }: { year: number }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentYear = new Date().getFullYear()
  const user = useAuthStore(s => s.user)
  const isBudgetApprover = useMemo(() => {
    const userName = user?.name || ''
    const sl = getItem<any[]>('ws_users', [])
    return sl.find(s => s.name === userName)?.approverType === 'approver'
  }, [user])

  /* 내부 탭: budget / balance */
  const [innerTab, setInnerTab] = useState<'budget' | 'balance'>('budget')
  const [yearDropOpen, setYearDropOpen] = useState(false)
  const [appliedYear, setAppliedYear] = useState<number>(() => parseInt(localStorage.getItem('acct_active_year') || '') || currentYear)

  /* 연도 목록: 예산설정에 등록된 연도 + 현재 연도 + 선택된 연도 */
  const years = useMemo(() => {
    const budgetCats = getItem<BudgetCat[]>('acct_budget_cats', [])
    const existing = Array.from(new Set(budgetCats.map(c => {
      if (c.year) return c.year
      if (c.periodFrom) return parseInt(c.periodFrom.substring(0, 4))
      return currentYear
    })))
    if (!existing.includes(currentYear)) existing.push(currentYear)
    if (propYear && !existing.includes(propYear)) existing.push(propYear)
    return existing.sort((a, b) => a - b)
  }, [currentYear, propYear])

  /* + 버튼으로 연도 추가 후 해당 연도로 전환 */
  const addYear = () => {
    const maxYear = Math.max(...years, currentYear)
    const nextYear = maxYear + 1
    const tab = searchParams.get('tab') || 'base_budget'
    setSearchParams({ tab, year: String(nextYear) })
  }

  const setYear = (y: number) => {
    const tab = searchParams.get('tab') || 'base_budget'
    setSearchParams({ tab, year: String(y) })
  }

  return (
    <div className="animate-fadeIn">
      {/* ── 상단 헤더: 탭 ── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          {/* 내부 탭 */}
          <div className="flex items-center bg-[var(--bg-muted)] rounded-xl p-1 border border-[var(--border-default)]">
            <button
              onClick={() => setInnerTab('budget')}
              className={cn(
                'px-4 py-2 rounded-lg text-[13px] font-bold transition-all cursor-pointer',
                innerTab === 'budget'
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              )}
            >
              📊 예산설정
            </button>
            <button
              onClick={isBudgetApprover ? () => setInnerTab('balance') : undefined}
              className={cn(
                'px-4 py-2 rounded-lg text-[13px] font-bold transition-all',
                isBudgetApprover ? 'cursor-pointer' : 'cursor-not-allowed opacity-50',
                innerTab === 'balance'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-[var(--text-muted)]' + (isBudgetApprover ? ' hover:text-[var(--text-primary)]' : '')
              )}
              title={!isBudgetApprover ? '지출승인권자만 사용 가능' : undefined}
            >
              🏦 기초잔액
            </button>
          </div>
        </div>

        {/* ── 연도 선택 + 추가 + 적용 (우측) ── */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[var(--bg-muted)] rounded-xl p-1 border border-[var(--border-default)]">
            {years.map(y => (
              <button
                key={y}
                onClick={isBudgetApprover ? () => setYear(y) : undefined}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all',
                  isBudgetApprover ? 'cursor-pointer' : 'cursor-not-allowed opacity-50',
                  y === propYear
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border-default)]'
                    : 'text-[var(--text-muted)]' + (isBudgetApprover ? ' hover:text-[var(--text-primary)]' : '')
                )}
                title={!isBudgetApprover ? '지출승인권자만 사용 가능' : undefined}
              >
                {String(y).slice(-2)}년도
              </button>
            ))}
            <button
              onClick={isBudgetApprover ? addYear : undefined}
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${isBudgetApprover ? 'text-[var(--text-muted)] hover:bg-primary-100 hover:text-primary-600 dark:hover:bg-primary-900/30 dark:hover:text-primary-400 cursor-pointer' : 'text-[var(--text-muted)] opacity-50 cursor-not-allowed'} transition-all text-[14px] font-bold`}
              title={isBudgetApprover ? '연도 추가' : '지출승인권자만 사용 가능'}
            >
              +
            </button>
          </div>
          {/* 적용된 연도 상태 표시 */}
          <button
            className="px-3 py-1.5 rounded-lg text-[12px] font-bold bg-emerald-500 text-white border border-emerald-500 shadow-sm cursor-default flex items-center gap-1"
          >
            ✓ {appliedYear}년 적용됨
          </button>
          {/* 회계년도 적용 버튼 */}
          <button
            onClick={isBudgetApprover ? () => {
              localStorage.setItem('acct_active_year', String(propYear))
              setAppliedYear(propYear)
              const tab = searchParams.get('tab') || 'base_budget'
              const params: Record<string, string> = { tab, year: String(propYear) }
              setSearchParams(params)
            } : undefined}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-bold bg-primary-500 text-white border border-primary-500 ${isBudgetApprover ? 'hover:bg-primary-600 cursor-pointer' : 'opacity-50 cursor-not-allowed'} transition-all shadow-sm`}
            title={!isBudgetApprover ? '지출승인권자만 사용 가능' : undefined}
          >
            회계년도 적용
          </button>
        </div>
      </div>

      {/* ── 탭별 컨텐츠 ── */}
      {innerTab === 'budget' ? (
        <AcctBudget year={propYear} />
      ) : (
        <AcctBalance year={propYear} />
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════
   예산설정 (Budget) — 레거시 매칭 CRUD
   ═══════════════════════════════════════════ */
function AcctBudget({ year }: { year: number }) {
  const [selectedCatId, setSelectedCatId] = useState<string | number | null>(null)
  const [refresh, setRefresh] = useState(0)
  const staffListForBudget = useMemo(() => {
    const sl = getItem<any[]>('ws_users', [])
    return sl.filter((s: any) => !s.resignedAt)
  }, [refresh])
  const user = useAuthStore(s => s.user)
  const isBudgetApprover = useMemo(() => {
    const userName = user?.name || ''
    const sl = getItem<any[]>('ws_users', [])
    return sl.find(s => s.name === userName)?.approverType === 'approver'
  }, [user])

  /* ── 모달 상태 ── */
  const [catModalOpen, setCatModalOpen] = useState(false)
  const [catEditId, setCatEditId] = useState<string | number | null>(null)
  const [bankModalOpen, setBankModalOpen] = useState(false)
  const [catForm, setCatForm] = useState({ name: '', description: '', bank: '', accounts: [] as BudgetCatAccount[], periodFrom: `${year}-01-01`, periodTo: `${year}-12-31`, users: [] as string[], approver: '' })

  // 지출수단에서 등록된 계좌+카드 목록
  const registeredAccounts = useMemo(() => {
    try {
      const raw = localStorage.getItem('acct_pay_methods_v2')
      if (!raw) return []
      const items = JSON.parse(raw) as any[]
      return items.filter((i: any) => i.category === '계좌' && (i.bankName || i.accountNumber))
    } catch { return [] }
  }, [catModalOpen])

  const [budgetModalOpen, setBudgetModalOpen] = useState(false)
  const [budgetEditId, setBudgetEditId] = useState<number | null>(null)
  const [budgetForm, setBudgetForm] = useState({ itemName: '', subItemName: '', detailItemName: '', accountCode: '', contraAccountCode: '', amount: '', memo: '', budgetItemDefId: undefined as number | undefined, budgetSubDefId: undefined as number | undefined })
  const [itemNameSearch, setItemNameSearch] = useState('')
  const [itemNamePopup, setItemNamePopup] = useState(false)
  const [subNamePopup, setSubNamePopup] = useState(false)
  const [detailNamePopup, setDetailNamePopup] = useState(false)
  const [acctSearch, setAcctSearch] = useState('')
  const [acctPopup, setAcctPopup] = useState(false)
  const [contraAcctSearch, setContraAcctSearch] = useState('')
  const [contraAcctPopup, setContraAcctPopup] = useState(false)

  /* ── 예산과목 선택 모달 ── */
  const [budgetPickerOpen, setBudgetPickerOpen] = useState(false)
  const [pickerChecked, setPickerChecked] = useState<Set<string>>(new Set())
  const [pickerFilterItem, setPickerFilterItem] = useState<string | null>(null) // 특정 예산목만 표시

  /* ── 인라인 금액 편집 ── */
  const [editingAmountId, setEditingAmountId] = useState<string | number | null>(null)
  const [editingAmountVal, setEditingAmountVal] = useState('')

  /* ── 편성/확정 비밀번호 모달 ── */
  const [budgetStatusModal, setBudgetStatusModal] = useState<{ catId: string | number; catName: string; newStatus: string } | null>(null)
  const [budgetStatusPw, setBudgetStatusPw] = useState('')
  const [budgetStatusPwErr, setBudgetStatusPwErr] = useState('')

  /* ── 동의어 변경 ── */
  const [aliasDropId, setAliasDropId] = useState<string | null>(null) // "item:인건비" / "sub:인건비>기본급" / "det:인건비>기본급>정규직기본급"

  /* ── 데이터 ── */
  const budgetCats = useMemo(() => {
    const cats = getItem<BudgetCat[]>('acct_budget_cats', [])
    const yearCats = cats.filter(cat => {
      const pFrom = cat.periodFrom || ''
      const pTo = cat.periodTo || ''
      if (pFrom && pTo) {
        // 사업기간이 해당 연도와 겹치는지 확인
        const yearStart = `${year}-01-01`
        const yearEnd = `${year}-12-31`
        return pFrom <= yearEnd && pTo >= yearStart
      }
      // periodFrom/To 없으면 year 속성으로 폴백
      const catYear = cat.year || (pFrom ? parseInt(pFrom.substring(0, 4)) : new Date().getFullYear())
      return catYear === year
    })
    // 예산승인자/관련자 필터
    const userName = user?.name || ''
    const staffList = getItem<any[]>('ws_users', [])
    const currentStaff = staffList.find(s => s.name === userName)
    const isBudgetApprover = currentStaff?.approverType === 'approver'
    if (isBudgetApprover) return yearCats
    if (userName) {
      return yearCats.filter(c =>
        (c.users && c.users.length > 0 && c.users.includes(userName)) ||
        ((c as any).approvers && (c as any).approvers.length > 0 && (c as any).approvers.includes(userName))
      )
    }
    return yearCats
  }, [year, refresh, user])

  const budgets = useMemo(() => getItem<BudgetItem[]>('acct_budgets', []), [refresh])
  const accounts = useMemo(() => getItem<{ code: string; name: string; type: string; group?: string }[]>('acct_accounts', []), [refresh])
  const expenseAccounts = accounts.filter(a => a.type === 'expense')
  const itemNameHistory = useMemo(() => getItem<string[]>('acct_itemName_history', []), [refresh])

  const budgetItemDefs = useMemo(() => getItem<BudgetItemDef[]>('acct_budget_item_defs', []).sort((a, b) => a.sortOrder - b.sortOrder), [refresh])
  const allItemNames = useMemo(() => budgetItemDefs.map(d => d.name), [budgetItemDefs])
  const selectedItemDef = useMemo(() => budgetItemDefs.find(d => d.name === budgetForm.itemName || d.id === budgetForm.budgetItemDefId), [budgetItemDefs, budgetForm.itemName, budgetForm.budgetItemDefId])
  const availableSubItems = useMemo(() => selectedItemDef?.subItems.sort((a, b) => a.sortOrder - b.sortOrder) || [], [selectedItemDef])
  const selectedSubDef = useMemo(() => availableSubItems.find(s => s.name === budgetForm.subItemName), [availableSubItems, budgetForm.subItemName])
  const availableDetailItems = useMemo(() => (selectedSubDef?.detailItems || []).sort((a, b) => a.sortOrder - b.sortOrder), [selectedSubDef])
  const filteredItemNames = useMemo(() => {
    if (!itemNameSearch.trim()) return allItemNames
    const q = itemNameSearch.toLowerCase()
    return allItemNames.filter(n => {
      if (n.toLowerCase().includes(q)) return true
      const def = budgetItemDefs.find(d => d.name === n)
      if (def?.aliases.some(a => a.toLowerCase().includes(q))) return true
      return false
    })
  }, [allItemNames, itemNameSearch, budgetItemDefs])
  const isNewItemName = itemNameSearch.trim() && !allItemNames.includes(itemNameSearch.trim())

  // 필터링된 계정과목 리스트
  const filteredAccounts = useMemo(() => {
    if (!acctSearch.trim()) return accounts
    const q = acctSearch.toLowerCase()
    return accounts.filter(a => a.code.includes(q) || a.name.toLowerCase().includes(q) || (a.group || '').toLowerCase().includes(q))
  }, [accounts, acctSearch])

  // 상대계정 필터 (자산·부채 계정 위주)
  const filteredContraAccounts = useMemo(() => {
    const contraList = accounts.filter(a => ['asset', 'liability'].includes(a.type))
    if (!contraAcctSearch.trim()) return contraList
    const q = contraAcctSearch.toLowerCase()
    return contraList.filter(a => a.code.includes(q) || a.name.toLowerCase().includes(q) || (a.group || '').toLowerCase().includes(q))
  }, [accounts, contraAcctSearch])

  const selCat = selectedCatId ? budgetCats.find(c => String(c.id) === String(selectedCatId)) : budgetCats[0]
  const filtered = selCat ? budgets.filter(b => String(b.catId) === String(selCat.id)) : []
  const totalAmt = filtered.reduce((a, b) => a + (b.amount || 0), 0)
  const totalSpent = filtered.reduce((a, b) => a + (b.spent || 0), 0)

  const budgetTreeGroups = (() => {
    const grouped = new Map<string, { budgets: typeof filtered; subs: Map<string, { budgets: typeof filtered; details: Map<string, typeof filtered> }> }>()
    filtered.forEach(b => {
      const itemKey = b.itemName || '(미분류)'
      if (!grouped.has(itemKey)) grouped.set(itemKey, { budgets: [] as typeof filtered, subs: new Map() })
      const itemGroup = grouped.get(itemKey)!
      itemGroup.budgets.push(b)
      const subKey = b.subItemName || ''
      if (!itemGroup.subs.has(subKey)) itemGroup.subs.set(subKey, { budgets: [] as typeof filtered, details: new Map() })
      const subGroup = itemGroup.subs.get(subKey)!
      subGroup.budgets.push(b)
      const detailKey = b.detailItemName || ''
      if (!subGroup.details.has(detailKey)) subGroup.details.set(detailKey, [] as typeof filtered)
      subGroup.details.get(detailKey)!.push(b)
    })
    return grouped
  })()

  // 계정 타입별 기본 상대계정 자동 추천
  const suggestContraAccount = (code: string): string => {
    const acct = accounts.find(a => a.code === code)
    if (!acct) return '1-01-03' // 기본: 보통예금
    switch (acct.type) {
      case 'expense': return '1-01-03'   // 비용 → 보통예금(자산 감소)
      case 'revenue': return '1-01-03'   // 수익 → 보통예금(자산 증가)
      case 'asset': return '2-01-04'     // 자산 → 미지급금(부채 증가)
      case 'liability': return '1-01-01' // 부채 → 현금(자산 감소)
      case 'equity': return '1-01-03'    // 자본 → 보통예금
      default: return '1-01-03'
    }
  }

  const colors = ['#4f6ef7', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

  /* ── 구분 CRUD ── */
  const openCatModal = (editId?: string | number) => {
    if (editId) {
      const c = getItem<BudgetCat[]>('acct_budget_cats', []).find(x => String(x.id) === String(editId))
      if (c) {
        setCatEditId(editId)
        setCatForm({ name: c.name || '', description: (c as any).description || '', bank: c.bank || c.bankInfo || '', accounts: c.accounts || (c.bank ? [{ id: Date.now(), bankName: c.bank || c.bankInfo || '', cards: [] }] : []), periodFrom: c.periodFrom || `${year}-01-01`, periodTo: c.periodTo || `${year}-12-31`, users: c.users || [], approver: c.approver || '' })
      }
    } else {
      setCatEditId(null)
      setCatForm({ name: '', description: '', bank: '', accounts: [], periodFrom: `${year}-01-01`, periodTo: `${year}-12-31`, users: [], approver: '' })
    }
    setCatModalOpen(true)
  }

  const saveCat = () => {
    if (!catForm.name.trim()) return
    const all = getItem<BudgetCat[]>('acct_budget_cats', [])
    if (catEditId) {
      const updated = all.map(c => {
        if (String(c.id) !== String(catEditId)) return c
        const y = catForm.periodFrom ? parseInt(catForm.periodFrom.substring(0, 4)) : year
        // 기본 승인권자 + 추가 승인권자를 합쳐 approvers 배열 생성
        const defaultApprover = staffListForBudget.find(s => (s as any).approverType === 'approver')?.name || ''
        const approversList = [defaultApprover, catForm.approver].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i)
        return { ...c, name: catForm.name.trim(), description: catForm.description.trim(), bank: catForm.accounts[0]?.bankName || catForm.bank, bankInfo: catForm.accounts[0]?.bankName || catForm.bank, accounts: catForm.accounts, periodFrom: catForm.periodFrom, periodTo: catForm.periodTo, year: y, users: catForm.users, approver: catForm.approver, approvers: approversList }
      })
      localStorage.setItem('acct_budget_cats', JSON.stringify(updated))
    } else {
      const y = catForm.periodFrom ? parseInt(catForm.periodFrom.substring(0, 4)) : year
      const defaultApproverNew = staffListForBudget.find(s => (s as any).approverType === 'approver')?.name || ''
      const approversListNew = [defaultApproverNew, catForm.approver].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i)
      const newCat: BudgetCat = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        name: catForm.name.trim(),
        description: catForm.description.trim(),
        bank: catForm.accounts[0]?.bankName || catForm.bank,
        bankInfo: catForm.accounts[0]?.bankName || catForm.bank,
        accounts: catForm.accounts,
        periodFrom: catForm.periodFrom,
        periodTo: catForm.periodTo,
        year: y,
        users: catForm.users,
        approver: catForm.approver,
        approvers: approversListNew,
      } as any
      all.push(newCat)
      localStorage.setItem('acct_budget_cats', JSON.stringify(all))
      setSelectedCatId(newCat.id)
    }
    setCatModalOpen(false)
    setRefresh(r => r + 1)
  }

  const deleteCat = (id: string | number) => {
    if (!confirm('이 예산구분과 관련 예산항목을 모두 삭제하시겠습니까?')) return
    const sid = String(id)
    const cats = getItem<BudgetCat[]>('acct_budget_cats', []).filter(c => String(c.id) !== sid)
    const bds = getItem<BudgetItem[]>('acct_budgets', []).filter(b => String(b.catId) !== sid)
    localStorage.setItem('acct_budget_cats', JSON.stringify(cats))
    localStorage.setItem('acct_budgets', JSON.stringify(bds))
    if (String(selectedCatId) === sid) setSelectedCatId(null)
    setRefresh(r => r + 1)
  }

  /* ── 예산항목 CRUD ── */
  const openBudgetModal = (editId?: number) => {
    if (editId) {
      const b = budgets.find(x => x.id === editId)
      if (b) {
        setBudgetEditId(editId)
        setBudgetForm({ itemName: b.itemName || '', subItemName: b.subItemName || '', detailItemName: (b as any).detailItemName || '', accountCode: b.accountCode || '', contraAccountCode: b.contraAccountCode || '', amount: formatNumber(b.amount), memo: b.memo || '', budgetItemDefId: (b as any).budgetItemDefId, budgetSubDefId: (b as any).budgetSubDefId })
      }
    } else {
      setBudgetEditId(null)
      setBudgetForm({ itemName: '', subItemName: '', detailItemName: '', accountCode: '', contraAccountCode: '', amount: '', memo: '', budgetItemDefId: undefined, budgetSubDefId: undefined })
    }
    setBudgetModalOpen(true)
    setItemNameSearch('')
    setItemNamePopup(false)
    setSubNamePopup(false)
    setDetailNamePopup(false)
    setAcctSearch('')
    setAcctPopup(false)
    setContraAcctSearch('')
    setContraAcctPopup(false)
  }

  const saveBudgetItem = () => {
    if (!budgetForm.itemName.trim()) return
    const amt = parseInt(budgetForm.amount.replace(/,/g, '')) || 0
    if (amt <= 0) return
    const all = getItem<BudgetItem[]>('acct_budgets', [])
    if (budgetEditId) {
      const updated = all.map(b => {
        if (b.id !== budgetEditId) return b
        return { ...b, itemName: budgetForm.itemName.trim(), subItemName: budgetForm.subItemName.trim(), detailItemName: budgetForm.detailItemName.trim(), accountCode: budgetForm.accountCode, contraAccountCode: budgetForm.contraAccountCode, amount: amt, memo: budgetForm.memo, budgetItemDefId: budgetForm.budgetItemDefId, budgetSubDefId: budgetForm.budgetSubDefId }
      })
      localStorage.setItem('acct_budgets', JSON.stringify(updated))
    } else {
      all.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        catId: selCat!.id,
        year,
        itemName: budgetForm.itemName.trim(),
        subItemName: budgetForm.subItemName.trim(),
        detailItemName: budgetForm.detailItemName.trim(),
        accountCode: budgetForm.accountCode,
        contraAccountCode: budgetForm.contraAccountCode,
        amount: amt,
        spent: 0,
        memo: budgetForm.memo,
        budgetItemDefId: budgetForm.budgetItemDefId,
        budgetSubDefId: budgetForm.budgetSubDefId,
      })
      localStorage.setItem('acct_budgets', JSON.stringify(all))
    }
    // 새 예산목이면 히스토리에 자동 추가
    const trimName = budgetForm.itemName.trim()
    const hist = getItem<string[]>('acct_itemName_history', [])
    if (!hist.includes(trimName)) {
      setItem('acct_itemName_history', [...hist, trimName])
    }

    setBudgetModalOpen(false)
    setRefresh(r => r + 1)
  }

  const deleteBudgetItem = (id: number) => {
    if (!confirm('이 예산항목을 삭제하시겠습니까?')) return
    const bds = getItem<BudgetItem[]>('acct_budgets', []).filter(b => b.id !== id)
    localStorage.setItem('acct_budgets', JSON.stringify(bds))
    setRefresh(r => r + 1)
  }

  /* ── 이름→원래 def 이름 정규화 ── */
  const normalizeItemName = (name: string) => {
    const def = budgetItemDefs.find(d => d.name === name || d.aliases.includes(name))
    return def?.name || name
  }
  const normalizeSubName = (itemName: string, subName: string) => {
    const def = budgetItemDefs.find(d => d.name === itemName || d.aliases.includes(itemName))
    if (!def) return subName
    const sub = def.subItems.find(s => s.name === subName || (s.aliases || []).includes(subName))
    return sub?.name || subName
  }
  const normalizeDetName = (itemName: string, subName: string, detName: string) => {
    const def = budgetItemDefs.find(d => d.name === itemName || d.aliases.includes(itemName))
    if (!def) return detName
    const sub = def.subItems.find(s => s.name === subName || (s.aliases || []).includes(subName))
    if (!sub?.detailItems) return detName
    const det = sub.detailItems.find(d => d.name === detName || (d.aliases || []).includes(detName))
    return det?.name || detName
  }
  const buildNormalizedKey = (b: BudgetItem) => {
    const ni = normalizeItemName(b.itemName)
    if (!b.subItemName) return ni
    const ns = normalizeSubName(b.itemName, b.subItemName)
    if (!(b as any).detailItemName) return `${ni}>${ns}`
    const nd = normalizeDetName(b.itemName, b.subItemName, (b as any).detailItemName)
    return `${ni}>${ns}>${nd}`
  }

  /* ── 예산과목 선택 모달 열기 ── */
  const openBudgetPicker = (filterItemName?: string) => {
    if (!selCat) return
    // 이미 등록된 항목들을 체크 상태로 초기화 (정규화된 키 사용)
    const checked = new Set<string>()
    filtered.forEach(b => {
      checked.add(buildNormalizedKey(b))
    })
    setPickerChecked(checked)
    // 필터 이름도 정규화
    setPickerFilterItem(filterItemName ? normalizeItemName(filterItemName) : null)
    setBudgetPickerOpen(true)
  }

  /* ── 예산과목 선택 적용 ── */
  const applyBudgetPicker = () => {
    if (!selCat) return
    const all = getItem<BudgetItem[]>('acct_budgets', [])
    const catBudgets = all.filter(b => String(b.catId) === String(selCat.id))
    const otherBudgets = all.filter(b => String(b.catId) !== String(selCat.id))

    // 기존 항목의 정규화된 키 맵
    const existingKeys = new Map<string, BudgetItem>()
    catBudgets.forEach(b => {
      existingKeys.set(buildNormalizedKey(b), b)
    })

    const newBudgets: BudgetItem[] = []
    pickerChecked.forEach(key => {
      if (existingKeys.has(key)) {
        // 기존 항목 유지 (현재 표시 이름 그대로)
        newBudgets.push(existingKeys.get(key)!)
        existingKeys.delete(key)
      } else {
        // 새로 추가: 예산과목에서 계정과목 자동 연결
        const parts = key.split('>')
        const itemName = parts[0]
        const subItemName = parts[1] || ''
        const detailItemName = parts[2] || ''
        const def = budgetItemDefs.find(d => d.name === itemName)
        let acctCode = def?.defaultAccountCode || ''
        let contraAcctCode = def?.accountPool?.[0]?.contraAccountCode || ''
        if (subItemName && def) {
          const subDef = def.subItems.find(s => s.name === subItemName)
          if (subDef?.accountCode) acctCode = subDef.accountCode
          if (detailItemName && subDef?.detailItems) {
            const detDef = subDef.detailItems.find(d => d.name === detailItemName)
            if (detDef?.accountCode) acctCode = detDef.accountCode
          }
        }
        newBudgets.push({
          id: Date.now() + Math.floor(Math.random() * 10000) + newBudgets.length,
          catId: selCat.id,
          year,
          itemName,
          subItemName,
          detailItemName,
          accountCode: acctCode,
          contraAccountCode: contraAcctCode,
          amount: 0,
          spent: 0,
          budgetItemDefId: def?.id,
        })
      }
    })

    localStorage.setItem('acct_budgets', JSON.stringify([...otherBudgets, ...newBudgets]))
    setBudgetPickerOpen(false)
    setRefresh(r => r + 1)
  }

  /* ── 인라인 금액 편집 저장 ── */
  const saveInlineAmount = (budgetId: string | number) => {
    const amt = parseInt(editingAmountVal.replace(/,/g, '')) || 0
    const all = getItem<BudgetItem[]>('acct_budgets', [])
    const updated = all.map(b => b.id === budgetId ? { ...b, amount: amt } : b)
    localStorage.setItem('acct_budgets', JSON.stringify(updated))
    setEditingAmountId(null)
    setEditingAmountVal('')
    setRefresh(r => r + 1)
  }

  /* ── 금액 포맷 입력 ── */
  const handleAmountInput = (val: string) => {
    const digits = val.replace(/[^\d]/g, '')
    setBudgetForm(f => ({ ...f, amount: digits ? Number(digits).toLocaleString('ko-KR') : '' }))
  }

  /* ── 동의어로 이름 변경 ── */
  const renameByAlias = (level: 'item' | 'sub' | 'det', origName: string, newName: string, parentItem?: string, parentSub?: string) => {
    const all = getItem<BudgetItem[]>('acct_budgets', [])
    const updated = all.map(b => {
      if (String(b.catId) !== String(selCat?.id)) return b
      if (level === 'item' && b.itemName === origName) {
        return { ...b, itemName: newName }
      }
      if (level === 'sub' && b.itemName === parentItem && b.subItemName === origName) {
        return { ...b, subItemName: newName }
      }
      if (level === 'det' && b.itemName === parentItem && b.subItemName === parentSub && (b as any).detailItemName === origName) {
        return { ...b, detailItemName: newName }
      }
      return b
    })
    localStorage.setItem('acct_budgets', JSON.stringify(updated))
    setAliasDropId(null)
    setRefresh(r => r + 1)
  }

  /* 동의어 목록 가져오기 */
  const getAliases = (level: 'item' | 'sub' | 'det', name: string, parentItem?: string, parentSub?: string): string[] => {
    if (level === 'item') {
      const def = budgetItemDefs.find(d => d.name === name || d.aliases.includes(name))
      if (!def) return []
      return [def.name, ...def.aliases].filter(a => a !== name)
    }
    if (level === 'sub') {
      const itemDef = budgetItemDefs.find(d => d.name === parentItem || d.aliases.includes(parentItem || ''))
      if (!itemDef) return []
      const subDef = itemDef.subItems.find(s => s.name === name || (s.aliases || []).includes(name))
      if (!subDef) return []
      return [subDef.name, ...(subDef.aliases || [])].filter(a => a !== name)
    }
    if (level === 'det') {
      const itemDef = budgetItemDefs.find(d => d.name === parentItem || d.aliases.includes(parentItem || ''))
      if (!itemDef) return []
      const subDef = itemDef.subItems.find(s => s.name === parentSub || (s.aliases || []).includes(parentSub || ''))
      if (!subDef?.detailItems) return []
      const detDef = subDef.detailItems.find(d => d.name === name || (d.aliases || []).includes(name))
      if (!detDef) return []
      return [detDef.name, ...(detDef.aliases || [])].filter(a => a !== name)
    }
    return []
  }
  /* 지출담당자 여부: 현재 선택 카테고리에 users로 등록된 사용자 */
  const isExpenseManager = useMemo(() => {
    if (!selCat) return false
    const userName = user?.name || ''
    return selCat.users?.includes(userName) || false
  }, [selCat, user])
  /* 예산값 수정 가능 여부: (승인권자 또는 지출담당자) + 확정 아닌 상태 */
  const isConfirmed = (selCat as any)?.budgetStatus === 'confirmed'
  const canEditValues = (isBudgetApprover || isExpenseManager) && !isConfirmed

  /* 비승인권자 클릭 차단 핸들러 (구분 추가/삭제 등 구조 변경) */
  const guardClick = (fn: () => void) => {
    if (!isBudgetApprover || isConfirmed) return () => {}
    return fn
  }
  const guardBtnClass = (!isBudgetApprover || isConfirmed) ? ' opacity-50 cursor-not-allowed' : ' cursor-pointer'
  /* 예산값 수정용 핸들러 (승인권자 + 지출담당자 모두 가능) */
  const guardEditClick = (fn: () => void) => {
    if (!canEditValues) return () => {}
    return fn
  }
  const guardEditBtnClass = !canEditValues ? ' opacity-50 cursor-not-allowed' : ' cursor-pointer'

  return (
    <div className="space-y-4">
      {/* ── 예산구분 관리 ── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[var(--text-primary)]">
            <PieChart size={16} className="text-primary-500" /> 예산구분 관리
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBankModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[12px] font-bold text-[var(--text-secondary)] hover:border-blue-400 hover:text-blue-500 cursor-pointer transition-all"
            >
              <Landmark size={12} /> 계좌관리
            </button>
            <button
              onClick={isBudgetApprover ? () => openCatModal() : undefined}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[12px] font-bold text-[var(--text-secondary)] ${isBudgetApprover ? 'hover:border-primary-400 hover:text-primary-500 cursor-pointer' : 'opacity-50 cursor-not-allowed'} transition-all`}
              title={!isBudgetApprover ? '지출승인권자만 사용 가능' : undefined}
            >
              <Plus size={12} /> 구분 추가
            </button>
          </div>
        </div>
        {budgetCats.length === 0 ? (
          <EmptyState emoji="📁" title={`${year}년 등록된 예산구분이 없습니다. "구분 추가" 버튼으로 먼저 등록하세요.`} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {budgetCats.map((cat, idx) => {
              const isActive = String(cat.id) === String(selCat?.id)
              const catBudgets = budgets.filter(b => String(b.catId) === String(cat.id))
              const amt = catBudgets.reduce((a, b) => a + (b.amount || 0), 0)
              const spent = catBudgets.reduce((a, b) => a + (b.spent || 0), 0)
              const pct = amt > 0 ? Math.round(spent / amt * 100) : 0
              const cc = colors[idx % colors.length]

              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCatId(cat.id)}
                  className={cn(
                    'text-left rounded-xl border cursor-pointer transition-all overflow-hidden',
                    isActive
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)]',
                  )}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-extrabold" style={{ color: isActive ? cc : 'var(--text-primary)' }}>
                        {cat.name}
                      </span>
                      {isActive && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${cc}22`, color: cc }}>
                          선택
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] mb-1">🏦 {cat.bankInfo || cat.bank || '-'}</div>
                    <div className="text-[10px] text-[var(--text-muted)] mb-2">📅 {cat.periodFrom || ''} ~ {cat.periodTo || ''}</div>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-[var(--text-secondary)]">{catBudgets.length}건</span>
                      <span className="font-bold">{formatNumber(amt)}원</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: pct > 100 ? '#ef4444' : cc }} />
                    </div>
                  </div>
                  {/* 수정 / 삭제 / 편성·확정 */}
                  <div className="flex border-t border-[var(--border-default)]">
                    <button
                      onClick={e => { e.stopPropagation(); if (isBudgetApprover && (cat as any).budgetStatus !== 'confirmed') openCatModal(cat.id) }}
                      className={`flex-1 py-2 text-[11px] font-bold text-[var(--text-secondary)] ${isBudgetApprover && (cat as any).budgetStatus !== 'confirmed' ? 'hover:bg-[var(--bg-muted)] cursor-pointer' : 'opacity-50 cursor-not-allowed'} transition-colors border-r border-[var(--border-default)]`}
                    >
                      수정
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); if (isBudgetApprover && (cat as any).budgetStatus !== 'confirmed') deleteCat(cat.id) }}
                      className={`flex-1 py-2 text-[11px] font-bold text-danger ${isBudgetApprover && (cat as any).budgetStatus !== 'confirmed' ? 'hover:bg-[var(--bg-muted)] cursor-pointer' : 'opacity-50 cursor-not-allowed'} transition-colors border-r border-[var(--border-default)]`}
                    >
                      삭제
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        if (!isBudgetApprover) return
                        const newStatus = (cat as any).budgetStatus === 'confirmed' ? 'drafting' : 'confirmed'
                        setBudgetStatusModal({ catId: cat.id, catName: cat.name, newStatus })
                        setBudgetStatusPw('')
                        setBudgetStatusPwErr('')
                      }}
                      className={`flex-1 py-2 text-[11px] font-bold ${(cat as any).budgetStatus === 'confirmed' ? 'text-[#22c55e] bg-green-50 dark:bg-green-900/10' : 'text-[#f59e0b]'} ${isBudgetApprover ? 'hover:bg-[var(--bg-muted)] cursor-pointer' : 'opacity-50 cursor-not-allowed'} transition-colors`}
                    >
                      {(cat as any).budgetStatus === 'confirmed' ? '✅ 확정' : '📝 편성'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── 예산항목 테이블 ── */}
      {selCat && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
            <div className="flex items-center gap-2">
              <ScrollText size={14} className="text-primary-500" />
              <span className="text-sm font-extrabold text-[var(--text-primary)]">{selCat.name} — 예산항목</span>
              <span className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--bg-muted)] px-2 py-0.5 rounded-full">
                {filtered.length}건 · {formatNumber(totalAmt)}원
              </span>
              {isConfirmed && (
                <span className="text-[10px] font-bold text-[#22c55e] bg-green-100 dark:bg-green-900/20 px-2 py-0.5 rounded-full">✅ 확정됨 · 수정불가</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={guardEditClick(() => openBudgetPicker())}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-500 text-white text-[12px] font-bold ${canEditValues ? 'hover:bg-primary-600' : 'opacity-50'} transition-all${guardEditBtnClass}`}
                title={!canEditValues ? '지출승인권자 또는 지출담당자만 사용 가능' : undefined}
              >
                <Plus size={12} /> 예산과목 선택
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-8 text-center">
              <EmptyState emoji="📋" title="예산과목을 선택하세요" />
              <p className="text-[11px] text-[var(--text-muted)] mt-1">"예산과목 선택" 버튼으로 항목을 추가하세요</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="bg-[var(--bg-muted)]">
                    {['예산항목', '자동분개', '편성액', '집행액', '잔여', '소진율', '관리'].map(h => (
                      <th key={h} className={cn("py-2.5 px-3.5 text-[11px] font-bold text-[var(--text-muted)]", h === '관리' ? 'text-center w-[80px]' : 'text-left')}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from(budgetTreeGroups.entries()).map(([itemName, itemGroup]) => {
                    const itemAmt = itemGroup.budgets.reduce((s: number, b: BudgetItem) => s + (b.amount || 0), 0)
                    const itemSpent = itemGroup.budgets.reduce((s: number, b: BudgetItem) => s + (b.spent || 0), 0)
                    const itemRemain = itemAmt - itemSpent
                    const itemPct = itemAmt > 0 ? Math.round(itemSpent / itemAmt * 100) : 0
                    const itemColor = itemPct > 100 ? '#ef4444' : itemPct > 80 ? '#f59e0b' : '#4f6ef7'
                    const hasSubs = itemGroup.subs.size > 1 || (itemGroup.subs.size === 1 && !itemGroup.subs.has(''))

                    const rows: React.ReactNode[] = []

                    {/* ─── 1뎁스: 예산목 소계 ─── */}
                    rows.push(
                      <tr key={`item-${itemName}`} className="border-b border-[var(--border-default)] bg-blue-50/40 dark:bg-blue-900/5" onDoubleClick={() => canEditValues && openBudgetPicker(itemName)} style={canEditValues ? { cursor: 'pointer' } : undefined}>
                        <td className="py-2.5 px-3.5">
                          <div className="relative inline-flex items-center gap-2">
                            {(() => {
                              const aliases = getAliases('item', itemName)
                              const dropKey = `item:${itemName}`
                              return aliases.length > 0 && isBudgetApprover ? (
                                <>
                                  <span
                                    className="text-[13px] font-extrabold text-[var(--text-primary)] cursor-pointer hover:text-primary-500 transition-colors border-b border-dashed border-transparent hover:border-primary-400"
                                    onClick={() => setAliasDropId(aliasDropId === dropKey ? null : dropKey)}
                                  >{itemName}</span>
                                  {aliasDropId === dropKey && (
                                    <div className="absolute top-full left-0 mt-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-xl z-50 min-w-[160px] py-1">
                                      {aliases.map(a => (
                                        <button key={a} onClick={() => renameByAlias('item', itemName, a)} className="w-full text-left px-3 py-1.5 text-[12px] text-[var(--text-secondary)] hover:bg-primary-50 dark:hover:bg-primary-900/10 hover:text-primary-600 transition-colors cursor-pointer">
                                          {a}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <span className="text-[13px] font-extrabold text-[var(--text-primary)]">{itemName}</span>
                              )
                            })()}
                            {hasSubs && <span className="text-[9px] font-bold text-primary-500 bg-primary-100 dark:bg-primary-900/20 px-1.5 py-0.5 rounded">{itemGroup.subs.size}개 세목</span>}
                          </div>
                        </td>
                        <td className="py-2.5 px-3.5" />
                        <td className="py-2.5 px-3.5 text-right">
                          {!hasSubs && itemGroup.budgets.length === 1 && canEditValues ? (
                            editingAmountId === itemGroup.budgets[0].id ? (
                              <input
                                autoFocus
                                value={editingAmountVal}
                                onChange={e => {
                                  const d = e.target.value.replace(/[^\d]/g, '')
                                  setEditingAmountVal(d ? Number(d).toLocaleString('ko-KR') : '')
                                }}
                                onBlur={() => saveInlineAmount(itemGroup.budgets[0].id)}
                                onKeyDown={e => { if (e.key === 'Enter') saveInlineAmount(itemGroup.budgets[0].id); if (e.key === 'Escape') setEditingAmountId(null) }}
                                className="w-[120px] px-2 py-1 text-right text-[12px] font-extrabold border border-primary-400 rounded-md bg-white dark:bg-gray-800 outline-none text-[var(--text-primary)]"
                              />
                            ) : (
                              <span
                                className="text-[12px] font-extrabold text-[var(--text-primary)] cursor-pointer hover:text-primary-500 hover:underline transition-colors"
                                onClick={() => { setEditingAmountId(itemGroup.budgets[0].id); setEditingAmountVal(formatNumber(itemAmt)) }}
                              >{formatNumber(itemAmt)}원</span>
                            )
                          ) : (
                            <span className="text-[12px] font-extrabold text-[var(--text-primary)]">{formatNumber(itemAmt)}원</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-danger text-right">{formatNumber(itemSpent)}원</td>
                        <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-right" style={{ color: itemRemain < 0 ? '#ef4444' : '#22c55e' }}>{formatNumber(itemRemain)}원</td>
                        <td className="py-2.5 px-3.5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden max-w-[80px]">
                              <div className="h-full rounded-full" style={{ width: `${Math.min(100, itemPct)}%`, background: itemColor }} />
                            </div>
                            <span className="text-[11px] font-extrabold" style={{ color: itemColor }}>{itemPct}%</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3.5 text-center">
                          {!hasSubs && itemGroup.budgets.length === 1 && (
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={guardClick(() => deleteBudgetItem(itemGroup.budgets[0].id as number))} className={`w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-muted)] ${isBudgetApprover ? 'hover:bg-red-100 hover:text-danger cursor-pointer' : 'opacity-50 cursor-not-allowed'} transition-all`} title="삭제"><Trash2 size={12} /></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )

                    {/* ─── 2뎁스: 세목 ─── */}
                    if (hasSubs) {
                      Array.from(itemGroup.subs.entries()).forEach(([subName, subGroup]) => {
                        if (!subName) return
                        const subAmt = subGroup.budgets.reduce((s: number, b: BudgetItem) => s + (b.amount || 0), 0)
                        const subSpent = subGroup.budgets.reduce((s: number, b: BudgetItem) => s + (b.spent || 0), 0)
                        const subRemain = subAmt - subSpent
                        const subPct = subAmt > 0 ? Math.round(subSpent / subAmt * 100) : 0
                        const subColor = subPct > 100 ? '#ef4444' : subPct > 80 ? '#f59e0b' : '#22c55e'
                        const hasDetails = subGroup.details.size > 1 || (subGroup.details.size === 1 && !subGroup.details.has(''))

                        rows.push(
                          <tr key={`sub-${itemName}-${subName}`} className="border-b border-[var(--border-default)]/50 hover:bg-[var(--bg-muted)] transition-colors">
                            <td className="py-2 px-3.5 pl-8">
                              <div className="relative inline-flex items-center gap-1.5">
                                <span className="text-[10px] text-primary-400">└</span>
                                {(() => {
                                  const aliases = getAliases('sub', subName, itemName)
                                  const dropKey = `sub:${itemName}>${subName}`
                                  return aliases.length > 0 && isBudgetApprover ? (
                                    <>
                                      <span
                                        className="text-[12px] font-bold text-[var(--text-secondary)] cursor-pointer hover:text-primary-500 transition-colors border-b border-dashed border-transparent hover:border-primary-400"
                                        onClick={() => setAliasDropId(aliasDropId === dropKey ? null : dropKey)}
                                      >{subName}</span>
                                      {aliasDropId === dropKey && (
                                        <div className="absolute top-full left-4 mt-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-xl z-50 min-w-[140px] py-1">
                                          {aliases.map(a => (
                                            <button key={a} onClick={() => renameByAlias('sub', subName, a, itemName)} className="w-full text-left px-3 py-1.5 text-[11px] text-[var(--text-secondary)] hover:bg-primary-50 dark:hover:bg-primary-900/10 hover:text-primary-600 transition-colors cursor-pointer">
                                              {a}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-[12px] font-bold text-[var(--text-secondary)]">{subName}</span>
                                  )
                                })()}
                                {hasDetails && <span className="text-[8px] font-bold text-violet-500 bg-violet-50 dark:bg-violet-900/20 px-1 py-px rounded">{subGroup.details.size}건</span>}
                              </div>
                            </td>
                            <td className="py-2 px-3.5" />
                            <td className="py-2 px-3.5 text-right">
                              {!hasDetails && subGroup.budgets.length === 1 && canEditValues ? (
                                editingAmountId === subGroup.budgets[0].id ? (
                                  <input
                                    autoFocus
                                    value={editingAmountVal}
                                    onChange={e => {
                                      const d = e.target.value.replace(/[^\d]/g, '')
                                      setEditingAmountVal(d ? Number(d).toLocaleString('ko-KR') : '')
                                    }}
                                    onBlur={() => saveInlineAmount(subGroup.budgets[0].id)}
                                    onKeyDown={e => { if (e.key === 'Enter') saveInlineAmount(subGroup.budgets[0].id); if (e.key === 'Escape') setEditingAmountId(null) }}
                                    className="w-[110px] px-2 py-0.5 text-right text-[11px] font-bold border border-primary-400 rounded-md bg-white dark:bg-gray-800 outline-none text-[var(--text-primary)]"
                                  />
                                ) : (
                                  <span
                                    className="text-[11px] font-bold text-[var(--text-secondary)] cursor-pointer hover:text-primary-500 hover:underline transition-colors"
                                    onClick={() => { setEditingAmountId(subGroup.budgets[0].id); setEditingAmountVal(formatNumber(subAmt)) }}
                                  >{formatNumber(subAmt)}원</span>
                                )
                              ) : (
                                <span className="text-[11px] font-bold text-[var(--text-secondary)]">{formatNumber(subAmt)}원</span>
                              )}
                            </td>
                            <td className="py-2 px-3.5 text-[11px] font-bold text-danger/80 text-right">{formatNumber(subSpent)}원</td>
                            <td className="py-2 px-3.5 text-[11px] font-bold text-right" style={{ color: subRemain < 0 ? '#ef4444' : '#22c55e' }}>{formatNumber(subRemain)}원</td>
                            <td className="py-2 px-3.5">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1 rounded-full bg-[var(--bg-subtle)] overflow-hidden max-w-[80px]">
                                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, subPct)}%`, background: subColor }} />
                                </div>
                                <span className="text-[10px] font-bold" style={{ color: subColor }}>{subPct}%</span>
                              </div>
                            </td>
                            <td className="py-2 px-3.5 text-center">
                              {!hasDetails && subGroup.budgets.length === 1 && (
                                <div className="flex items-center justify-center gap-1">
                                  <button onClick={guardClick(() => deleteBudgetItem(subGroup.budgets[0].id as number))} className={`w-5 h-5 rounded flex items-center justify-center text-[var(--text-muted)] ${isBudgetApprover ? 'hover:bg-red-100 hover:text-danger cursor-pointer' : 'opacity-50 cursor-not-allowed'} transition-all`} title="삭제"><Trash2 size={10} /></button>
                                </div>
                              )}
                            </td>
                          </tr>
                        )

                        {/* ─── 3뎁스: 세세항목 ─── */}
                        if (hasDetails) {
                          Array.from(subGroup.details.entries()).forEach(([detailName, detailBudgets]) => {
                            if (!detailName) return
                            const dBudgets = detailBudgets as BudgetItem[]
                            const detAmt = dBudgets.reduce((s, b) => s + (b.amount || 0), 0)
                            const detSpent = dBudgets.reduce((s, b) => s + (b.spent || 0), 0)
                            const detRemain = detAmt - detSpent
                            const detPct = detAmt > 0 ? Math.round(detSpent / detAmt * 100) : 0
                            const detColor = detPct > 100 ? '#ef4444' : detPct > 80 ? '#f59e0b' : '#a78bfa'
                            const firstB = dBudgets[0]

                            rows.push(
                              <tr key={`det-${itemName}-${subName}-${detailName}`} className="border-b border-dashed border-[var(--border-default)]/30 hover:bg-violet-50/10 dark:hover:bg-violet-900/5 transition-colors">
                                <td className="py-1.5 px-3.5 pl-14">
                                  <div className="relative inline-flex items-center gap-1.5">
                                    <span className="text-[9px] text-violet-400">└</span>
                                    {(() => {
                                      const aliases = getAliases('det', detailName, itemName, subName)
                                      const dropKey = `det:${itemName}>${subName}>${detailName}`
                                      return aliases.length > 0 && isBudgetApprover ? (
                                        <>
                                          <span
                                            className="text-[11px] font-semibold text-[var(--text-muted)] cursor-pointer hover:text-primary-500 transition-colors border-b border-dashed border-transparent hover:border-primary-400"
                                            onClick={() => setAliasDropId(aliasDropId === dropKey ? null : dropKey)}
                                          >{detailName}</span>
                                          {aliasDropId === dropKey && (
                                            <div className="absolute top-full left-4 mt-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-xl z-50 min-w-[130px] py-1">
                                              {aliases.map(a => (
                                                <button key={a} onClick={() => renameByAlias('det', detailName, a, itemName, subName)} className="w-full text-left px-3 py-1.5 text-[10px] text-[var(--text-secondary)] hover:bg-primary-50 dark:hover:bg-primary-900/10 hover:text-primary-600 transition-colors cursor-pointer">
                                                  {a}
                                                </button>
                                              ))}
                                            </div>
                                          )}
                                        </>
                                      ) : (
                                        <span className="text-[11px] font-semibold text-[var(--text-muted)]">{detailName}</span>
                                      )
                                    })()}
                                  </div>
                                </td>
                                <td className="py-1.5 px-3.5">
                                  {firstB.contraAccountCode && firstB.accountCode ? (
                                    <div className="flex items-center gap-1 text-[9px]">
                                      <span className="font-bold text-[#4f6ef7]">차</span>
                                      <span className="font-mono text-[var(--text-muted)]">{firstB.accountCode}</span>
                                      <span className="text-[var(--text-muted)]">→</span>
                                      <span className="font-bold text-[#ef4444]">대</span>
                                      <span className="font-mono text-[var(--text-muted)]">{firstB.contraAccountCode}</span>
                                    </div>
                                  ) : (
                                    <span className="text-[9px] text-[var(--text-muted)]">{firstB.accountCode || ''}</span>
                                  )}
                                </td>
                                <td className="py-1.5 px-3.5 text-right">
                                  {dBudgets.length === 1 && canEditValues ? (
                                    editingAmountId === dBudgets[0].id ? (
                                      <input
                                        autoFocus
                                        value={editingAmountVal}
                                        onChange={e => {
                                          const d = e.target.value.replace(/[^\d]/g, '')
                                          setEditingAmountVal(d ? Number(d).toLocaleString('ko-KR') : '')
                                        }}
                                        onBlur={() => saveInlineAmount(dBudgets[0].id)}
                                        onKeyDown={e => { if (e.key === 'Enter') saveInlineAmount(dBudgets[0].id); if (e.key === 'Escape') setEditingAmountId(null) }}
                                        className="w-[100px] px-2 py-0.5 text-right text-[10px] font-semibold border border-primary-400 rounded-md bg-white dark:bg-gray-800 outline-none text-[var(--text-primary)]"
                                      />
                                    ) : (
                                      <span
                                        className="text-[10px] font-semibold text-[var(--text-muted)] cursor-pointer hover:text-primary-500 hover:underline transition-colors"
                                        onClick={() => { setEditingAmountId(dBudgets[0].id); setEditingAmountVal(formatNumber(detAmt)) }}
                                      >{formatNumber(detAmt)}원</span>
                                    )
                                  ) : (
                                    <span className="text-[10px] font-semibold text-[var(--text-muted)]">{formatNumber(detAmt)}원</span>
                                  )}
                                </td>
                                <td className="py-1.5 px-3.5 text-[10px] font-semibold text-danger/60 text-right">{formatNumber(detSpent)}원</td>
                                <td className="py-1.5 px-3.5 text-[10px] font-semibold text-right" style={{ color: detRemain < 0 ? '#ef4444' : '#22c55e' }}>{formatNumber(detRemain)}원</td>
                                <td className="py-1.5 px-3.5">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1 rounded-full bg-[var(--bg-subtle)] overflow-hidden max-w-[80px]">
                                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, detPct)}%`, background: detColor }} />
                                    </div>
                                    <span className="text-[9px] font-bold" style={{ color: detColor }}>{detPct}%</span>
                                  </div>
                                </td>
                                <td className="py-1.5 px-3.5 text-center">
                                  {dBudgets.length === 1 && (
                                    <div className="flex items-center justify-center gap-1">
                                      <button onClick={guardClick(() => deleteBudgetItem(dBudgets[0].id as number))} className={`w-5 h-5 rounded flex items-center justify-center text-[var(--text-muted)] ${isBudgetApprover ? 'hover:bg-red-100 hover:text-danger cursor-pointer' : 'opacity-50 cursor-not-allowed'} transition-all`} title="삭제"><Trash2 size={10} /></button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )
                          })
                        }
                      })
                    }

                    return rows
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-[var(--bg-muted)]">
                    <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-[var(--text-primary)]">합계</td>
                    <td />
                    <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-[var(--text-primary)] text-right">{formatNumber(totalAmt)}원</td>
                    <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-danger text-right">{formatNumber(totalSpent)}원</td>
                    <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-success text-right">{formatNumber(totalAmt - totalSpent)}원</td>
                    <td className="py-2.5 px-3.5 text-[11px] font-bold text-[var(--text-muted)]">
                      {totalAmt > 0 ? Math.round(totalSpent / totalAmt * 100) : 0}%
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════
         모달: 편성/확정 비밀번호 인증
         ═══════════════════════════════════════════ */}
      {budgetStatusModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={() => setBudgetStatusModal(null)}>
          <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-[380px] mx-4 border border-[var(--border-default)]" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-[var(--border-default)]">
              <h3 className="text-base font-extrabold text-[var(--text-primary)]">
                {budgetStatusModal.newStatus === 'confirmed' ? '🔒 예산 확정' : '🔓 확정 해제'}
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                {budgetStatusModal.newStatus === 'confirmed'
                  ? `"${budgetStatusModal.catName}" 예산을 확정합니다.\n확정 후에는 누구도 예산을 수정·삭제할 수 없습니다.`
                  : `"${budgetStatusModal.catName}" 예산 확정을 해제합니다.\n편성 상태로 변경하면 수정이 가능해집니다.`}
              </p>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">비밀번호 확인 *</label>
                <input
                  type="password"
                  autoFocus
                  value={budgetStatusPw}
                  onChange={e => { setBudgetStatusPw(e.target.value); setBudgetStatusPwErr('') }}
                  onKeyDown={e => { if (e.key === 'Enter') { (e.target as HTMLInputElement).blur(); document.getElementById('btn-budget-status-confirm')?.click() } }}
                  placeholder="비밀번호를 입력하세요"
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none"
                />
                {budgetStatusPwErr && <p className="text-[10px] text-danger mt-1">{budgetStatusPwErr}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-[var(--border-default)]">
              <button
                onClick={() => setBudgetStatusModal(null)}
                className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] cursor-pointer"
              >취소</button>
              <button
                id="btn-budget-status-confirm"
                onClick={() => {
                  if (!budgetStatusPw.trim()) { setBudgetStatusPwErr('비밀번호를 입력해주세요'); return }
                  const staffList = getItem<any[]>('ws_users', [])
                  const userName = user?.name || ''
                  const me = staffList.find(s => s.name === userName)
                  if (!me || me.pw !== budgetStatusPw) { setBudgetStatusPwErr('비밀번호가 일치하지 않습니다'); return }
                  const cats = getItem<BudgetCat[]>('acct_budget_cats', [])
                  const updated = cats.map(c => String(c.id) === String(budgetStatusModal.catId) ? { ...c, budgetStatus: budgetStatusModal.newStatus } : c)
                  setItem('acct_budget_cats', updated)
                  setRefresh(r => r + 1)
                  setBudgetStatusModal(null)
                  setBudgetStatusPw('')
                }}
                className={`px-4 py-2 rounded-lg text-white text-sm font-bold cursor-pointer ${budgetStatusModal.newStatus === 'confirmed' ? 'bg-[#22c55e] hover:bg-[#16a34a]' : 'bg-[#f59e0b] hover:bg-[#d97706]'}`}
              >
                {budgetStatusModal.newStatus === 'confirmed' ? '확정' : '해제'}
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* ═══════════════════════════════════════════
         모달: 예산구분 추가/수정
         ═══════════════════════════════════════════ */}
      {catModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={() => setCatModalOpen(false)}>
          <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-[460px] mx-4 border border-[var(--border-default)]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)]">
              <h3 className="text-base font-extrabold text-[var(--text-primary)]">{catEditId ? '예산구분 수정' : '예산구분 추가'}</h3>
              <button onClick={() => setCatModalOpen(false)} className="text-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">✕</button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">예산구분명 *</label>
                <input
                  value={catForm.name}
                  onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="예) 문화재청, 자체예산"
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">예산설명</label>
                <textarea
                  value={catForm.description}
                  onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="예산구분에 대한 설명을 입력하세요"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors resize-none"
                />
              </div>
              {/* 통장/계좌 관리 */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-[var(--text-muted)]">
                    통장/계좌
                    {catForm.accounts.length > 0 && <span className="ml-1 text-[9px] bg-blue-100 dark:bg-blue-900/20 text-blue-600 px-1.5 py-0.5 rounded">{catForm.accounts.length}개</span>}
                  </label>
                  {registeredAccounts.length > 0 ? (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          const availAccts = registeredAccounts.filter((ra: any) => !catForm.accounts.some(a => a.bankName === `${ra.bankName || ''} ${ra.accountNumber || ''}`.trim()))
                          if (availAccts.length === 0) return
                          const ra = availAccts[0]
                          const label = `${ra.bankName || ''} ${ra.accountNumber || ''}`.trim()
                          setCatForm(f => ({ ...f, accounts: [...f.accounts, { id: Date.now(), bankName: label, cards: [] }] }))
                        }}
                        className="text-[10px] font-bold text-primary-500 hover:text-primary-600 cursor-pointer flex items-center gap-0.5"
                      >
                        + 계좌 선택
                      </button>
                    </div>
                  ) : (
                    <span className="text-[9px] text-[var(--text-muted)]">지출수단에서 계좌를 먼저 등록하세요</span>
                  )}
                </div>
                {catForm.accounts.length === 0 ? (
                  <div className="text-center text-[11px] text-[var(--text-muted)] py-3 border border-dashed border-[var(--border-default)] rounded-lg">등록된 계좌가 없습니다</div>
                ) : (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {catForm.accounts.map((acct, ai) => {
                      // 현재 계좌에 매칭되는 등록 계좌 찾기
                      const matchedRA = registeredAccounts.find((ra: any) => `${ra.bankName || ''} ${ra.accountNumber || ''}`.trim() === acct.bankName)
                      const availableCards: any[] = matchedRA?.cards || []
                      return (
                        <div key={acct.id} className="border border-[var(--border-default)] rounded-lg p-2.5 bg-[var(--bg-muted)]/30">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-[9px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">계좌 {ai + 1}</span>
                            <select
                              value={acct.bankName}
                              onChange={e => {
                                const v = e.target.value
                                setCatForm(f => ({ ...f, accounts: f.accounts.map((a, i) => i === ai ? { ...a, bankName: v, cards: [] } : a) }))
                              }}
                              className="flex-1 px-2 py-1.5 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] text-[12px] text-[var(--text-primary)] outline-none focus:border-primary-400"
                            >
                              <option value="">계좌 선택</option>
                              {registeredAccounts.map((ra: any) => {
                                const label = `${ra.bankName || ''} ${ra.accountNumber || ''}`.trim()
                                return <option key={ra.id} value={label}>{label}{ra.accountHolder ? ` (${ra.accountHolder})` : ''}</option>
                              })}
                            </select>
                            <button
                              type="button"
                              onClick={() => setCatForm(f => ({ ...f, accounts: f.accounts.filter((_, i) => i !== ai) }))}
                              className="p-1 rounded text-[#ef4444] hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                            ><Trash2 size={12} /></button>
                          </div>
                          {/* 연결 카드 */}
                          <div className="pl-4">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[9px] font-bold text-[var(--text-muted)]">연결 카드{acct.cards.length > 0 && <span className="ml-1 text-[9px] bg-amber-100 dark:bg-amber-900/20 text-amber-600 px-1 py-0.5 rounded">{acct.cards.length}</span>}</span>
                              {(() => {
                                const unlinked = availableCards.filter((c: any) => !acct.cards.includes(`${c.cardName || ''} ${c.cardNumber || ''}`.trim()))
                                if (unlinked.length === 0) return null
                                return (
                                  <select
                                    value=""
                                    onChange={e => {
                                      if (!e.target.value) return
                                      setCatForm(f => ({
                                        ...f,
                                        accounts: f.accounts.map((a, i) => i === ai ? { ...a, cards: [...a.cards, e.target.value] } : a)
                                      }))
                                    }}
                                    className="text-[9px] font-bold text-amber-500 bg-transparent border border-amber-200 dark:border-amber-800 rounded px-1.5 py-0.5 cursor-pointer outline-none"
                                  >
                                    <option value="">+ 카드 연결</option>
                                    {unlinked.map((card: any) => {
                                      const cardLabel = `${card.cardName || ''} ${card.cardNumber || ''}`.trim()
                                      return <option key={card.id} value={cardLabel}>{card.cardName || '카드'} {card.cardNumber || ''} {card.cardUser ? `(${card.cardUser})` : ''}</option>
                                    })}
                                  </select>
                                )
                              })()}
                            </div>
                            {acct.cards.length === 0 ? (
                              <div className="text-[10px] text-[var(--text-muted)]/60 py-1">{acct.bankName ? (availableCards.length > 0 ? '연결된 카드 없음' : '등록된 카드 없음') : '계좌를 먼저 선택하세요'}</div>
                            ) : (
                              <div className="space-y-1">
                                {acct.cards.map((cardLabel, ci) => (
                                  <div key={ci} className="flex items-center gap-1.5 text-[11px] text-[var(--text-primary)] bg-amber-50/50 dark:bg-amber-900/10 rounded px-2 py-1">
                                    <span className="text-[9px] text-amber-500">💳</span>
                                    <span className="flex-1">{cardLabel}</span>
                                    <button
                                      type="button"
                                      onClick={() => setCatForm(f => ({
                                        ...f,
                                        accounts: f.accounts.map((a, i) => i === ai ? { ...a, cards: a.cards.filter((_, j) => j !== ci) } : a)
                                      }))}
                                      className="p-0.5 rounded text-[#ef4444] hover:bg-red-50 cursor-pointer"
                                    ><X size={10} /></button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">시작일</label>
                  <DatePicker value={catForm.periodFrom} onChange={v => setCatForm(f => ({ ...f, periodFrom: v }))} />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">종료일</label>
                  <DatePicker value={catForm.periodTo} onChange={v => setCatForm(f => ({ ...f, periodTo: v }))} />
                </div>
              </div>
              {/* 지출담당자 */}
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1.5 block">
                  지출담당자
                </label>
                <select
                  value={catForm.users[0] || ''}
                  onChange={e => {
                    setCatForm(f => ({ ...f, users: e.target.value ? [e.target.value] : [] }))
                  }}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors"
                >
                  <option value="">선택하세요</option>
                  {staffListForBudget.map(s => (
                    <option key={s.id || s.name} value={s.name}>{s.name} {s.position || ''} {s.department || ''}</option>
                  ))}
                </select>
              </div>
              {/* 승인담당자 */}
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1.5 block">
                  승인담당자
                </label>
                {(() => {
                  const defaultApprover = staffListForBudget.find(s => (s as any).approverType === 'approver')
                  const defaultApproverName = defaultApprover?.name || ''
                  return (
                    <>
                      {defaultApprover ? (
                        <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-lg bg-primary-50 dark:bg-primary-900/10 border border-primary-200 dark:border-primary-800">
                          <span className="text-[10px] font-bold text-primary-500 bg-primary-100 dark:bg-primary-900/20 px-1.5 py-0.5 rounded">기본</span>
                          <span className="text-[13px] font-bold text-primary-600">{defaultApprover.name}</span>
                          <span className="text-[10px] text-[var(--text-muted)]">{defaultApprover.position || ''} {(defaultApprover as any).department || ''}</span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-[var(--text-muted)] px-3 py-2 mb-2 rounded-lg border border-dashed border-[var(--border-default)]">기본승인담당자가 설정되지 않았습니다</div>
                      )}
                      <select
                        value={catForm.approver}
                        onChange={e => setCatForm(f => ({ ...f, approver: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors"
                      >
                        <option value="">추가승인담당자를 선택하세요</option>
                        {staffListForBudget.filter(s => s.name !== defaultApproverName && (s as any).approverType !== 'approver').map(s => (
                          <option key={s.id || s.name} value={s.name}>{s.name} {s.position || ''} {(s as any).department || ''}</option>
                        ))}
                      </select>
                    </>
                  )
                })()}
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-[var(--border-default)]">
              <button onClick={() => setCatModalOpen(false)} className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer">취소</button>
              <button onClick={saveCat} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-bold hover:bg-primary-600 transition-colors cursor-pointer">저장</button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* ═══════════════════════════════════════════
         모달: 회사 계좌·카드 관리
         ═══════════════════════════════════════════ */}
      {bankModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={() => setBankModalOpen(false)}>
          <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-3xl mx-4 border border-[var(--border-default)] max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)] rounded-t-2xl" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)' }}>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2"><Landmark size={18} /> 회사 계좌·카드 관리</h3>
              <button onClick={() => setBankModalOpen(false)} className="text-white/80 hover:text-white text-lg cursor-pointer transition-colors">✕</button>
            </div>
            {/* 본문 + 하단 */}
            {(() => {
                const [accounts, setAccounts] = React.useState<Array<{
                  id: string | number; bankName: string; accountNumber: string; accountHolder: string;
                  purpose: string; manager: string; memo: string;
                  cards: Array<{ id: string | number; cardName: string; cardCompany: string; cardNumber: string; cardType: string; cardUser: string; expiryDate: string }>
                }>>(getItem('acct_company_accounts', []))
                const [editId, setEditId] = React.useState<string | number | null>(null)
                const emptyForm = { bankName: '', accountNumber: '', accountHolder: '', purpose: '', manager: '', memo: '', cards: [] as any[] }
                const [form, setForm] = React.useState(emptyForm)
                const [adding, setAdding] = React.useState(false)
                const [expandedCards, setExpandedCards] = React.useState<Record<string, boolean>>({})
                const [addingCardFor, setAddingCardFor] = React.useState<string | number | null>(null)
                const emptyCard = { cardName: '', cardCompany: '', cardNumber: '', cardType: '체크카드', cardUser: '', expiryDate: '' }
                const [cardForm, setCardForm] = React.useState(emptyCard)

                const save = (list: typeof accounts) => { setAccounts(list); setItem('acct_company_accounts', list) }
                const toggleCards = (id: string | number) => setExpandedCards(p => ({ ...p, [String(id)]: !p[String(id)] }))
                const startAdd = () => { setAdding(true); setEditId(null); setForm(emptyForm) }
                const startEdit = (acc: typeof accounts[0]) => { setEditId(acc.id); setAdding(false); setForm({ bankName: acc.bankName, accountNumber: acc.accountNumber, accountHolder: acc.accountHolder, purpose: acc.purpose, manager: acc.manager, memo: acc.memo, cards: acc.cards || [] }) }
                const cancelEdit = () => { setEditId(null); setAdding(false); setForm(emptyForm) }

                const saveAccount = () => {
                  if (!form.bankName.trim() || !form.accountNumber.trim()) return
                  if (editId !== null) {
                    save(accounts.map(a => String(a.id) === String(editId) ? { ...a, ...form } : a))
                  } else {
                    save([...accounts, { id: Date.now(), ...form }])
                  }
                  cancelEdit()
                }
                const deleteAccount = (id: string | number) => { if (confirm('이 계좌를 삭제하시겠습니까?')) save(accounts.filter(a => String(a.id) !== String(id))) }

                const addCard = (acctId: string | number) => {
                  if (!cardForm.cardName.trim() || !cardForm.cardNumber.trim()) return
                  save(accounts.map(a => String(a.id) === String(acctId) ? { ...a, cards: [...(a.cards || []), { id: Date.now(), ...cardForm }] } : a))
                  setCardForm(emptyCard); setAddingCardFor(null)
                }
                const deleteCard = (acctId: string | number, cardId: string | number) => {
                  save(accounts.map(a => String(a.id) === String(acctId) ? { ...a, cards: (a.cards || []).filter(c => String(c.id) !== String(cardId)) } : a))
                }

                const renderForm = (isNew: boolean) => (
                  <div className="bg-[var(--bg-muted)] border border-[var(--border-default)] rounded-xl p-4 space-y-3">
                    <div className="text-sm font-extrabold text-[var(--text-primary)] mb-2">{isNew ? '새 계좌 추가' : '계좌 수정'}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">은행명 *</label>
                        <input value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} placeholder="예) 국민은행" className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors" />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">계좌번호 *</label>
                        <input value={form.accountNumber} onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))} placeholder="000-000-000000" className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors" />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">예금주</label>
                        <input value={form.accountHolder} onChange={e => setForm(f => ({ ...f, accountHolder: e.target.value }))} placeholder="예금주명" className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors" />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">용도</label>
                        <input value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} placeholder="운영비, 인건비 등" className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors" />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">담당자</label>
                        <input value={form.manager} onChange={e => setForm(f => ({ ...f, manager: e.target.value }))} placeholder="담당자명" className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors" />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">메모</label>
                        <input value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))} placeholder="비고" className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button onClick={cancelEdit} className="px-3 py-1.5 rounded-lg border border-[var(--border-default)] text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer">취소</button>
                      <button onClick={saveAccount} className="px-3 py-1.5 rounded-lg bg-primary-500 text-white text-xs font-bold hover:bg-primary-600 transition-colors cursor-pointer">저장</button>
                    </div>
                  </div>
                )

                return (
                  <>
                    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                      {accounts.length === 0 && !adding && (
                        <div className="text-center py-10 text-[var(--text-muted)] text-sm">
                          <Landmark size={32} className="mx-auto mb-2 opacity-40" />
                          등록된 계좌가 없습니다
                        </div>
                      )}

                      {accounts.map(acc => (
                        editId !== null && String(editId) === String(acc.id) ? (
                          <div key={acc.id}>{renderForm(false)}</div>
                        ) : (
                          <div key={acc.id} className="border border-[var(--border-default)] rounded-xl overflow-hidden bg-[var(--bg-surface)] hover:border-blue-300 transition-colors">
                            {/* 계좌 정보 */}
                            <div className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white"><Landmark size={14} /></div>
                                  <div>
                                    <div className="text-sm font-extrabold text-[var(--text-primary)]">{acc.bankName}</div>
                                    <div className="text-xs text-[var(--text-muted)] font-mono">{acc.accountNumber}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button onClick={() => startEdit(acc)} className="p-1.5 rounded-lg hover:bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-blue-500 cursor-pointer transition-colors"><Edit3 size={13} /></button>
                                  <button onClick={() => deleteAccount(acc.id)} className="p-1.5 rounded-lg hover:bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-red-500 cursor-pointer transition-colors"><Trash2 size={13} /></button>
                                </div>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)]">
                                {acc.accountHolder && <span>예금주: <b>{acc.accountHolder}</b></span>}
                                {acc.purpose && <span>용도: {acc.purpose}</span>}
                                {acc.manager && <span>담당자: {acc.manager}</span>}
                                {acc.memo && <span className="text-[var(--text-muted)]">({acc.memo})</span>}
                              </div>
                            </div>
                            {/* 연결카드 아코디언 */}
                            <div className="border-t border-[var(--border-default)]">
                              <button onClick={() => toggleCards(acc.id)} className="w-full flex items-center justify-between px-4 py-2 text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] cursor-pointer transition-colors">
                                <span className="flex items-center gap-1"><CreditCard size={12} /> 연결 카드 ({(acc.cards || []).length})</span>
                                {expandedCards[String(acc.id)] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                              {expandedCards[String(acc.id)] && (
                                <div className="px-4 pb-3 space-y-2">
                                  {(acc.cards || []).length === 0 && String(addingCardFor) !== String(acc.id) && (
                                    <div className="text-xs text-[var(--text-muted)] text-center py-2">연결된 카드가 없습니다</div>
                                  )}
                                  {(acc.cards || []).map(card => (
                                    <div key={card.id} className="flex items-center justify-between bg-[var(--bg-muted)] rounded-lg px-3 py-2">
                                      <div className="flex items-center gap-2 text-xs flex-wrap">
                                        <CreditCard size={12} className="text-violet-500" />
                                        <span className="font-bold text-[var(--text-primary)]">{card.cardName}</span>
                                        <span className="text-[var(--text-muted)] font-mono">{card.cardNumber}</span>
                                        <span className="text-[var(--text-secondary)]">{card.cardCompany}</span>
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${card.cardType === '신용카드' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>{card.cardType}</span>
                                        {card.cardUser && <span className="text-[var(--text-muted)]">({card.cardUser})</span>}
                                        {card.expiryDate && <span className="text-[var(--text-muted)]">{card.expiryDate}</span>}
                                      </div>
                                      <button onClick={() => deleteCard(acc.id, card.id)} className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-[var(--text-muted)] hover:text-red-500 cursor-pointer transition-colors"><Trash2 size={11} /></button>
                                    </div>
                                  ))}
                                  {String(addingCardFor) === String(acc.id) ? (
                                    <div className="bg-[var(--bg-surface)] border border-dashed border-[var(--border-default)] rounded-lg p-3 space-y-2">
                                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        <input value={cardForm.cardName} onChange={e => setCardForm(f => ({ ...f, cardName: e.target.value }))} placeholder="카드명 *" className="px-2 py-1.5 rounded border border-[var(--border-default)] bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] focus:border-primary-500 outline-none" />
                                        <input value={cardForm.cardCompany} onChange={e => setCardForm(f => ({ ...f, cardCompany: e.target.value }))} placeholder="카드사" className="px-2 py-1.5 rounded border border-[var(--border-default)] bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] focus:border-primary-500 outline-none" />
                                        <input value={cardForm.cardNumber} onChange={e => setCardForm(f => ({ ...f, cardNumber: e.target.value }))} placeholder="카드번호 *" className="px-2 py-1.5 rounded border border-[var(--border-default)] bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] focus:border-primary-500 outline-none" />
                                        <select value={cardForm.cardType} onChange={e => setCardForm(f => ({ ...f, cardType: e.target.value }))} className="px-2 py-1.5 rounded border border-[var(--border-default)] bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] focus:border-primary-500 outline-none">
                                          <option>체크카드</option><option>신용카드</option>
                                        </select>
                                        <input value={cardForm.cardUser} onChange={e => setCardForm(f => ({ ...f, cardUser: e.target.value }))} placeholder="사용자" className="px-2 py-1.5 rounded border border-[var(--border-default)] bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] focus:border-primary-500 outline-none" />
                                        <input value={cardForm.expiryDate} onChange={e => setCardForm(f => ({ ...f, expiryDate: e.target.value }))} placeholder="유효기간" className="px-2 py-1.5 rounded border border-[var(--border-default)] bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] focus:border-primary-500 outline-none" />
                                      </div>
                                      <div className="flex justify-end gap-2">
                                        <button onClick={() => { setAddingCardFor(null); setCardForm(emptyCard) }} className="px-2 py-1 rounded text-[11px] font-bold text-[var(--text-secondary)] border border-[var(--border-default)] hover:bg-[var(--bg-muted)] cursor-pointer transition-colors">취소</button>
                                        <button onClick={() => addCard(acc.id)} className="px-2 py-1 rounded text-[11px] font-bold text-white bg-violet-500 hover:bg-violet-600 cursor-pointer transition-colors">추가</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button onClick={() => { setAddingCardFor(acc.id); setCardForm(emptyCard) }} className="w-full flex items-center justify-center gap-1 py-2 rounded-lg border border-dashed border-[var(--border-default)] text-xs font-bold text-[var(--text-muted)] hover:border-violet-400 hover:text-violet-500 cursor-pointer transition-colors">
                                      <Plus size={12} /> 카드 추가
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      ))}

                      {adding && renderForm(true)}
                    </div>
                    {/* 하단 */}
                    <div className="flex justify-between items-center px-5 py-3 border-t border-[var(--border-default)]">
                      <button onClick={startAdd} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-dashed border-violet-400 text-xs font-bold text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 cursor-pointer transition-colors">
                        <Plus size={12} /> 계좌 추가
                      </button>
                      <button onClick={() => setBankModalOpen(false)} className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer">닫기</button>
                    </div>
                  </>
                )
              })()}
          </div>
        </div>
      , document.body)}

      {/* ═══════════════════════════════════════════
         모달: 예산항목 추가/수정
         ═══════════════════════════════════════════ */}
      {budgetModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={() => setBudgetModalOpen(false)}>
          <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-[460px] mx-4 border border-[var(--border-default)]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)]">
              <h3 className="text-base font-extrabold text-[var(--text-primary)]">{budgetEditId ? '예산 수정' : '예산 추가'}</h3>
              <button onClick={() => setBudgetModalOpen(false)} className="text-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">✕</button>
            </div>
            <div className="px-5 py-4 space-y-3">
              {/* 예산목 - 검색 콤보박스 */}
              <div className="relative">
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 flex items-center gap-1">
                  예산목 *
                  {isNewItemName && <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">+ 새 항목</span>}
                </label>
                <input
                  value={budgetForm.itemName}
                  onChange={e => {
                    setBudgetForm(f => ({ ...f, itemName: e.target.value }))
                    setItemNameSearch(e.target.value)
                    setItemNamePopup(true)
                    setAcctPopup(false)
                  }}
                  onFocus={() => { setItemNamePopup(true); setAcctPopup(false); setItemNameSearch(budgetForm.itemName) }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (filteredItemNames.length > 0) {
                        const first = filteredItemNames[0]
                        setBudgetForm(f => ({ ...f, itemName: first }))
                        setItemNameSearch(first)
                      }
                      setItemNamePopup(false)
                    }
                  }}
                  placeholder="예산목을 검색하거나 새로 입력하세요"
                  className={cn(
                    'w-full px-3 py-2.5 rounded-lg border bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors',
                    isNewItemName ? 'border-emerald-400' : 'border-[var(--border-default)]'
                  )}
                  autoFocus
                />
                {itemNamePopup && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-xl z-50 max-h-[220px] overflow-hidden">
                    <div className="max-h-[200px] overflow-y-auto p-1.5">
                      {filteredItemNames.map(name => {
                        const def = budgetItemDefs.find(d => d.name === name)
                        return (
                        <button key={name}
                          onClick={() => {
                            const acctCode = def?.defaultAccountCode || ''
                            const contraCode = def?.accountPool?.[0]?.contraAccountCode || (acctCode ? suggestContraAccount(acctCode) : '')
                            setBudgetForm(f => ({ ...f, itemName: name, subItemName: '', detailItemName: '', budgetItemDefId: def?.id, accountCode: acctCode, contraAccountCode: contraCode }))
                            setItemNameSearch(name)
                            setItemNamePopup(false)
                          }}
                          className={cn('w-full text-left text-[12px] px-3 py-2 rounded-lg cursor-pointer transition-colors',
                            budgetForm.itemName === name ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 font-bold' : 'hover:bg-[var(--bg-muted)] text-[var(--text-secondary)]')}
                        >
                          {name}
                          {def && <span className="ml-1 text-[9px] text-[var(--text-muted)]">({def.subItems.length}개 세목)</span>}
                        </button>
                        )
                      })}
                      {filteredItemNames.length === 0 && budgetForm.itemName.trim() && (
                        <div className="text-center text-xs py-3 space-y-1">
                          <div className="text-emerald-500 font-bold">✨ "{budgetForm.itemName.trim()}"</div>
                          <div className="text-[var(--text-muted)]">새 예산목으로 등록됩니다</div>
                        </div>
                      )}
                      {filteredItemNames.length === 0 && !budgetForm.itemName.trim() && (
                        <div className="text-center text-xs text-[var(--text-muted)] py-3">등록된 예산목이 없습니다</div>
                      )}
                    </div>
                  </div>
                )}
              </div>


              {/* 예산세목 드롭다운 */}
              {availableSubItems.length > 0 && (
              <div className="relative">
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">예산세목</label>
                <div
                  onClick={() => { setSubNamePopup(!subNamePopup); setItemNamePopup(false); setDetailNamePopup(false) }}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm cursor-pointer hover:border-primary-400 transition-colors min-h-[40px] flex items-center"
                >
                  {budgetForm.subItemName ? (
                    <span className="text-[var(--text-primary)] font-semibold">{budgetForm.subItemName}</span>
                  ) : (
                    <span className="text-[var(--text-muted)]">세목을 선택하세요</span>
                  )}
                </div>
                {subNamePopup && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-xl z-50 max-h-[220px] overflow-hidden">
                    <div className="max-h-[200px] overflow-y-auto p-1.5">
                      {availableSubItems.map(sub => (
                        <button key={sub.id}
                          onClick={() => {
                            const acctCode = sub.accountCode || selectedItemDef?.defaultAccountCode || budgetForm.accountCode
                            const contraCode = selectedItemDef?.accountPool?.find(p => p.accountCode === acctCode)?.contraAccountCode || budgetForm.contraAccountCode
                            setBudgetForm(f => ({ ...f, subItemName: sub.name, detailItemName: '', budgetSubDefId: sub.id, accountCode: acctCode, contraAccountCode: contraCode }))
                            setSubNamePopup(false)
                          }}
                          className={cn('w-full text-left text-[12px] px-3 py-2 rounded-lg cursor-pointer transition-colors',
                            budgetForm.subItemName === sub.name ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 font-bold' : 'hover:bg-[var(--bg-muted)] text-[var(--text-secondary)]')}
                        >
                          {sub.name}
                          {sub.detailItems && sub.detailItems.length > 0 && <span className="ml-1 text-[9px] text-[var(--text-muted)]">({sub.detailItems.length}개 세세항목)</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              )}
              {availableSubItems.length === 0 && (
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">예산세목</label>
                <input
                  value={budgetForm.subItemName}
                  onChange={e => setBudgetForm(f => ({ ...f, subItemName: e.target.value }))}
                  placeholder="예산세목을 입력하세요 (선택)"
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors"
                />
              </div>
              )}

              {/* 세세항목 드롭다운 */}
              {availableDetailItems.length > 0 && (
              <div className="relative">
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">세세항목</label>
                <div
                  onClick={() => { setDetailNamePopup(!detailNamePopup); setSubNamePopup(false); setItemNamePopup(false) }}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm cursor-pointer hover:border-primary-400 transition-colors min-h-[40px] flex items-center"
                >
                  {budgetForm.detailItemName ? (
                    <span className="text-[var(--text-primary)] font-semibold">{budgetForm.detailItemName}</span>
                  ) : (
                    <span className="text-[var(--text-muted)]">세세항목을 선택하세요</span>
                  )}
                </div>
                {detailNamePopup && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-xl z-50 max-h-[220px] overflow-hidden">
                    <div className="max-h-[200px] overflow-y-auto p-1.5">
                      {availableDetailItems.map(det => (
                        <button key={det.id}
                          onClick={() => {
                            const acctCode = det.accountCode || selectedSubDef?.accountCode || selectedItemDef?.defaultAccountCode || budgetForm.accountCode
                            const contraCode = selectedItemDef?.accountPool?.find(p => p.accountCode === acctCode)?.contraAccountCode || budgetForm.contraAccountCode
                            setBudgetForm(f => ({ ...f, detailItemName: det.name, accountCode: acctCode, contraAccountCode: contraCode }))
                            setDetailNamePopup(false)
                          }}
                          className={cn('w-full text-left text-[12px] px-3 py-2 rounded-lg cursor-pointer transition-colors',
                            budgetForm.detailItemName === det.name ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 font-bold' : 'hover:bg-[var(--bg-muted)] text-[var(--text-secondary)]')}
                        >
                          {det.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              )}

              {/* 계정과목/상대계정 - 자동 읽기전용 */}
              {budgetForm.accountCode && (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 flex items-center gap-1">
                      계정과목
                      <span className="text-[8px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">⚙ 자동</span>
                    </label>
                    <div className="w-full px-3 py-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-900/10 text-sm min-h-[40px] flex items-center">
                      <span className="text-primary-500 font-mono font-bold text-[11px]">{budgetForm.accountCode}</span>
                      <span className="ml-1.5 text-[var(--text-primary)] font-semibold">{accounts.find(a => a.code === budgetForm.accountCode)?.name || ''}</span>
                    </div>
                  </div>
                  {budgetForm.contraAccountCode && (
                    <div className="flex-1">
                      <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 flex items-center gap-1">
                        상대계정
                        <span className="text-[8px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">⚙ 자동</span>
                      </label>
                      <div className="w-full px-3 py-2.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-900/10 text-sm min-h-[40px] flex items-center">
                        <span className="text-amber-600 font-mono font-bold text-[11px]">{budgetForm.contraAccountCode}</span>
                        <span className="ml-1.5 text-[var(--text-primary)] font-semibold">{accounts.find(a => a.code === budgetForm.contraAccountCode)?.name || ''}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">연간 예산액 (원) *</label>
                <input
                  value={budgetForm.amount}
                  onChange={e => handleAmountInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveBudgetItem() }}
                  placeholder="예) 50,000,000"
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">메모</label>
                <input
                  value={budgetForm.memo}
                  onChange={e => setBudgetForm(f => ({ ...f, memo: e.target.value }))}
                  placeholder="예산 설명"
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-[var(--border-default)]">
              <button onClick={() => setBudgetModalOpen(false)} className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer">취소</button>
              <button onClick={saveBudgetItem} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-bold hover:bg-primary-600 transition-colors cursor-pointer">저장</button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* ═══════════════════════════════════════════
         모달: 예산과목 선택 (체크리스트)
         ═══════════════════════════════════════════ */}
      {budgetPickerOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={() => setBudgetPickerOpen(false)}>
          <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-[500px] mx-4 border border-[var(--border-default)] max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)]">
              <div>
                <h3 className="text-base font-extrabold text-[var(--text-primary)]">📋 {pickerFilterItem ? `${pickerFilterItem} — 세목 선택` : '예산과목 선택'}</h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{pickerFilterItem ? '이 예산목의 세목을 선택하세요' : '체크한 항목이 예산으로 등록됩니다'}</p>
              </div>
              <button onClick={() => setBudgetPickerOpen(false)} className="text-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1">
              {budgetItemDefs.filter(def => !pickerFilterItem || def.name === pickerFilterItem || def.aliases.includes(pickerFilterItem)).map(def => {
                const itemKey = def.name
                const hasSub = def.subItems && def.subItems.length > 0
                // 모든 하위 키 수집
                const allChildKeys: string[] = []
                if (hasSub) {
                  def.subItems.forEach(sub => {
                    if (sub.detailItems && sub.detailItems.length > 0) {
                      sub.detailItems.forEach(det => allChildKeys.push(`${def.name}>${sub.name}>${det.name}`))
                    } else {
                      allChildKeys.push(`${def.name}>${sub.name}`)
                    }
                  })
                }
                const allChecked = hasSub ? allChildKeys.every(k => pickerChecked.has(k)) : pickerChecked.has(itemKey)
                const someChecked = hasSub ? allChildKeys.some(k => pickerChecked.has(k)) : false

                return (
                  <div key={def.id}>
                    {/* 예산목 */}
                    <label className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[var(--bg-muted)] transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        ref={el => { if (el) el.indeterminate = !allChecked && someChecked }}
                        onChange={() => {
                          const next = new Set(pickerChecked)
                          if (allChecked) {
                            if (hasSub) allChildKeys.forEach(k => next.delete(k))
                            else next.delete(itemKey)
                          } else {
                            if (hasSub) allChildKeys.forEach(k => next.add(k))
                            else next.add(itemKey)
                          }
                          setPickerChecked(next)
                        }}
                        className="w-4 h-4 rounded border-2 border-[var(--border-default)] accent-primary-500 cursor-pointer"
                      />
                      <span className="text-[13px] font-bold text-[var(--text-primary)]">{def.name}</span>
                      {hasSub && <span className="text-[9px] text-[var(--text-muted)] bg-[var(--bg-muted)] px-1.5 py-0.5 rounded">{def.subItems.length}개 세목</span>}
                    </label>
                    {/* 세목 */}
                    {hasSub && def.subItems.map(sub => {
                      const subHasDetail = sub.detailItems && sub.detailItems.length > 0
                      const subChildKeys = subHasDetail
                        ? sub.detailItems!.map(d => `${def.name}>${sub.name}>${d.name}`)
                        : [`${def.name}>${sub.name}`]
                      const subAllChecked = subChildKeys.every(k => pickerChecked.has(k))
                      const subSomeChecked = subChildKeys.some(k => pickerChecked.has(k))

                      return (
                        <div key={sub.id}>
                          <label className="flex items-center gap-2.5 pl-9 pr-3 py-1.5 rounded-lg hover:bg-[var(--bg-muted)] transition-colors cursor-pointer">
                            <input
                              type="checkbox"
                              checked={subAllChecked}
                              ref={el => { if (el) el.indeterminate = !subAllChecked && subSomeChecked }}
                              onChange={() => {
                                const next = new Set(pickerChecked)
                                if (subAllChecked) subChildKeys.forEach(k => next.delete(k))
                                else subChildKeys.forEach(k => next.add(k))
                                setPickerChecked(next)
                              }}
                              className="w-3.5 h-3.5 rounded border-2 border-[var(--border-default)] accent-primary-500 cursor-pointer"
                            />
                            <span className="text-[12px] font-semibold text-[var(--text-secondary)]">{sub.name}</span>
                          </label>
                          {/* 세세항목 */}
                          {subHasDetail && sub.detailItems!.map(det => {
                            const detKey = `${def.name}>${sub.name}>${det.name}`
                            return (
                              <label key={det.id} className="flex items-center gap-2.5 pl-16 pr-3 py-1 rounded-lg hover:bg-[var(--bg-muted)] transition-colors cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={pickerChecked.has(detKey)}
                                  onChange={() => {
                                    const next = new Set(pickerChecked)
                                    if (next.has(detKey)) next.delete(detKey)
                                    else next.add(detKey)
                                    setPickerChecked(next)
                                  }}
                                  className="w-3 h-3 rounded border-2 border-[var(--border-default)] accent-primary-500 cursor-pointer"
                                />
                                <span className="text-[11px] text-[var(--text-muted)]">{det.name}</span>
                              </label>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border-default)]">
              <span className="text-[11px] text-[var(--text-muted)]">{pickerChecked.size}개 선택됨</span>
              <div className="flex gap-2">
                <button onClick={() => setBudgetPickerOpen(false)} className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer">취소</button>
                <button onClick={applyBudgetPicker} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-bold hover:bg-primary-600 transition-colors cursor-pointer">적용</button>
              </div>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  )
}

/* ═══════════════════════════════════════════
   품의 (Approval) — CRUD
   ═══════════════════════════════════════════ */
export function AcctApproval({ year }: { year: number }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [refresh, setRefresh] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [detailApproval, setDetailApproval] = useState<Approval | null>(null)
  const [approvalBtnLabel, setApprovalBtnLabel] = useState(() => getItem('acct_approval_btn_label', '품의 등록'))
  const [editingBtnLabel, setEditingBtnLabel] = useState(false)
  const [editingDescText, setEditingDescText] = useState('')
  const [editingTitleText, setEditingTitleText] = useState('')
  const [modalApprovalType, setModalApprovalType] = useState<'expense' | 'general'>('expense')

  const currentUser = useAuthStore(s => s.user)
  const currentUserName = currentUser?.name || (() => { try { const u = JSON.parse(localStorage.getItem('ws_user') || '{}'); return u?.name } catch { return '' } })() || 'admin'
  const [form, setForm] = useState({ title: '', amount: '', date: new Date().toISOString().slice(0, 10), accountCode: '', description: '', applicant: currentUserName, approver: '', budgetItem: '', budgetSubItem: '' })
  const staffList = useStaffStore(s => s.staff).filter(s => !s.resignedAt)

  const budgetCats = useMemo(() => getItem<BudgetCat[]>('acct_budget_cats', []).filter(c => { const pf = c.periodFrom || ''; const pt = c.periodTo || ''; if (pf && pt) return pf <= `${year}-12-31` && pt >= `${year}-01-01`; return (c.year || year) === year }), [year, refresh])
  const budgetItems = useMemo(() => getItem<BudgetItem[]>('acct_budgets', []), [refresh])
  const approveBudgetDefs = useMemo(() => getItem<BudgetItemDef[]>('acct_budget_item_defs', []).sort((a, b) => a.sortOrder - b.sortOrder), [refresh])

  const approvals = useMemo(() => {
    const all = getItem<Approval[]>('acct_approvals', [])
    return all.filter(a => {
      const dateStr = a.date || a.createdAt
      return dateStr && parseInt(String(dateStr).substring(0, 4)) === year
    }).sort((a, b) => (b.createdAt || b.date || '').localeCompare(a.createdAt || a.date || ''))
  }, [year, refresh])

  const statusInfo: Record<string, { label: string; color: string; bg: string }> = {
    preExpense: { label: '지출한', color: '#f97316', bg: 'rgba(249,115,22,.1)' },
    pending: { label: '품의한', color: '#3b82f6', bg: 'rgba(59,130,246,.1)' },
    rejected: { label: '반려된', color: '#ef4444', bg: 'rgba(239,68,68,.1)' },
    approved: { label: '승인된', color: '#22c55e', bg: 'rgba(34,197,94,.1)' },
    expensed: { label: '지출된', color: '#3b82f6', bg: 'rgba(59,130,246,.1)' },
    toResolve: { label: '결의할', color: '#06b6d4', bg: 'rgba(6,182,212,.1)' },
    confirming: { label: '정산중', color: '#8b5cf6', bg: 'rgba(139,92,246,.1)' },
    completed: { label: '완료됨', color: '#4f6ef7', bg: 'rgba(79,110,247,.1)' },
    vouchered: { label: '완료됨', color: '#4f6ef7', bg: 'rgba(79,110,247,.1)' },
  }

  type GroupKey = 'inbox' | 'process' | 'archive'
  const groupDefs: { key: GroupKey; label: string; icon: string; color: string; subTabs: { key: string; label: string; color: string }[] }[] = [
    {
      key: 'inbox', label: '품의함', icon: '📋', color: '#4f6ef7',
      subTabs: [
        { key: 'preExpense', label: '선지출', color: '#f97316' },
        { key: 'pending', label: '품의한', color: '#f59e0b' },
        { key: 'rejected', label: '반려됨', color: '#ef4444' },
        { key: 'approved', label: '승인됨', color: '#22c55e' },
        { key: 'toResolve', label: '결의할', color: '#06b6d4' },
        { key: 'confirming', label: '정산중', color: '#8b5cf6' },
      ],
    },
    {
      key: 'process', label: '결제함', icon: '✅', color: '#22c55e',
      subTabs: [
        { key: 'ap_pending', label: '승인할', color: '#f59e0b' },
        { key: 'ap_approved', label: '승인한', color: '#22c55e' },
        { key: 'ap_rejected', label: '반려한', color: '#ef4444' },
        { key: 'ap_toResolve', label: '결의할', color: '#06b6d4' },
        { key: 'ap_confirming', label: '정산중', color: '#8b5cf6' },
        { key: 'ex_pending', label: '지출할', color: '#3b82f6' },
        { key: 'ex_done', label: '지출한', color: '#10b981' },
        { key: 'ex_settle', label: '정산할', color: '#06b6d4' },
        { key: 'ex_settled', label: '정산한', color: '#8b5cf6' },
      ],
    },
    {
      key: 'archive', label: '보관함', icon: '📦', color: '#6b7280',
      subTabs: [
        { key: 'generalDone', label: '일반품의완료', color: '#4f6ef7' },
        { key: 'expenseDone', label: '지출품의완료', color: '#f97316' },
      ],
    },
  ]

  const [activeGroup, setActiveGroup] = useState<GroupKey>(() => {
    const g = searchParams.get('group')
    if (g && ['inbox', 'process', 'archive'].includes(g)) return g as GroupKey
    return 'inbox'
  })
  const [subTab, setSubTab] = useState<string>(() => {
    return searchParams.get('subtab') || 'preExpense'
  })

  // ── 로그인 사용자 역할 판별 (현재 연도 예산구분 기준) ──
  const userIsApprover = useMemo(() => {
    const bCats: BudgetCat[] = getItem('acct_budget_cats', []).filter((c: any) => { const pf = c.periodFrom || ''; const pt = c.periodTo || ''; if (pf && pt) return pf <= `${year}-12-31` && pt >= `${year}-01-01`; return (c.year || year) === year })
    return bCats.some(c => (c as any).approvers?.includes(currentUserName)) || bCats.some(c => c.approver === currentUserName) || approvals.some(a => (a as any).approver === currentUserName)
  }, [currentUserName, approvals, refresh, year])

  const userIsExpenseManager = useMemo(() => {
    const bCats: BudgetCat[] = getItem('acct_budget_cats', []).filter((c: any) => { const pf = c.periodFrom || ''; const pt = c.periodTo || ''; if (pf && pt) return pf <= `${year}-12-31` && pt >= `${year}-01-01`; return (c.year || year) === year })
    return bCats.some(c => c.users?.includes(currentUserName))
  }, [currentUserName, refresh, year])

  // 결제함 서브탭을 역할에 따라 동적 필터링
  const currentGroup = useMemo(() => {
    const g = groupDefs.find(g => g.key === activeGroup)!
    if (activeGroup !== 'process') return g
    const ft = g.subTabs.filter(t => {
      if (t.key.startsWith('ap_')) return userIsApprover
      if (t.key.startsWith('ex_')) return userIsExpenseManager
      return true
    })
    return { ...g, subTabs: ft }
  }, [activeGroup, userIsApprover, userIsExpenseManager])

  const changeGroup = (gk: GroupKey) => {
    setActiveGroup(gk)
    const g = groupDefs.find(g => g.key === gk)!
    let tabs = g.subTabs
    if (gk === 'process') {
      const ft = tabs.filter(t => { if (t.key.startsWith('ap_')) return userIsApprover; if (t.key.startsWith('ex_')) return userIsExpenseManager; return true })
      if (ft.length > 0) tabs = ft
    }
    setSubTab(tabs[0].key)
  }

  const handleApproveConfirm = () => {
    if (!detailApproval) return
    const isGeneral = !!(detailApproval as any).isGeneral
    const isPreExp = !!(detailApproval as any).isPreExpense || detailApproval.status === 'preExpense' || (detailApproval.title || '').startsWith('[선지출]')
    if (isGeneral) {
      // 일반품의: 비밀번호/예산 검증 없이 바로 완료
      if (!approvePw.trim()) { setApprovePwError('비밀번호를 입력해주세요'); return }
      const myStaff = staffList.find(s => s.name === currentUserName)
      if (myStaff && myStaff.pw && myStaff.pw !== approvePw) {
        setApprovePwError('비밀번호가 일치하지 않습니다'); return
      }
      const all = getItem<Approval[]>('acct_approvals', [])
      const updated = all.map(a => String(a.id) === String(detailApproval.id) ? {
        ...a,
        status: 'completed',
        approver: currentUserName,
        approvedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      } : a)
      setItem('acct_approvals', updated)
      resetApproveState()
      setDetailApproval(null)
      setRefresh(r => r + 1)
      return
    }
    // 선지출이 아닌 경우만 예산 선택 검증
    if (!isPreExp) {
      if (!approveBudgetCat || !approveBudgetItem) { setApprovePwError('예산을 검색하여 선택해주세요'); return }
    }
    if (!approvePw.trim()) { setApprovePwError('비밀번호를 입력해주세요'); return }
    const myStaff = staffList.find(s => s.name === currentUserName)
    if (myStaff && myStaff.pw && myStaff.pw !== approvePw) {
      setApprovePwError('비밀번호가 일치하지 않습니다'); return
    }
    const all = getItem<Approval[]>('acct_approvals', [])
    const selectedBudgetItem = budgetItems.find(b => String(b.id) === String(approveBudgetItem))
    const subEntry = approveBudgetSub ? approveFilteredSubs.find(s => s.id === approveBudgetSub) : null
    const subName = subEntry?.name || ''
    const selectedBudgetSub = subName ? budgetItems.find(b =>
      String(b.catId) === String(selectedBudgetItem?.catId) &&
      b.itemName === selectedBudgetItem?.itemName &&
      b.subItemName === subName
    ) : null
    const selectedBudgetDetail = approveBudgetDetail ? budgetItems.find(b => String(b.id) === String(approveBudgetDetail)) : null
    const selectedCat = budgetCats.find(c => String(c.id) === String(approveBudgetCat))
    const approvedAmt = isPreExp ? (detailApproval.amount || 0) : (parseInt(approveAmount.replace(/[^0-9]/g, '')) || detailApproval.amount || 0)
    const updated = all.map(a => String(a.id) === String(detailApproval.id) ? {
      ...a,
      // 선지출: 담당자 본인 지출이면 바로 completed, 아니면 toResolve / 일반: approved
      status: isPreExp ? ((detailApproval as any).selfExpense ? 'completed' : 'toResolve') : 'approved',
      ...((isPreExp && (detailApproval as any).selfExpense) ? { completedAt: new Date().toISOString() } : {}),
      approver: currentUserName,
      ...(isPreExp ? {} : {
        budgetCatId: approveBudgetCat,
        budgetCatName: selectedCat?.name || '',
        budgetItemId: approveBudgetItem,
        budgetItem: selectedBudgetItem?.itemName || '',
        budgetSubId: selectedBudgetSub ? String(selectedBudgetSub.id) : undefined,
        budgetSubItem: subName || selectedBudgetItem?.subItemName || '',
        budgetDetailId: approveBudgetDetail || undefined,
        budgetDetailItem: selectedBudgetDetail?.detailItemName || '',
      }),
      amount: approvedAmt,
      approvedAmount: approvedAmt,
      approvedMemo: approveMemo || '',
      approvedAt: new Date().toISOString(),
    } : a)
    setItem('acct_approvals', updated)
    resetApproveState()
    setDetailApproval(null)
    setRefresh(r => r + 1)
  }

  // ── 지출담당자 판별 헬퍼 ──
  const isExpenseUser = (a: Approval) => {
    const bCats: BudgetCat[] = getItem('acct_budget_cats', []).filter((c: any) => { const pf = c.periodFrom || ''; const pt = c.periodTo || ''; if (pf && pt) return pf <= `${year}-12-31` && pt >= `${year}-01-01`; return (c.year || year) === year })
    const uCatIds = new Set(bCats.filter(c => c.users?.includes(currentUserName)).map(c => String(c.id)))
    const uCatNames = new Set(bCats.filter(c => c.users?.includes(currentUserName)).map(c => c.name))
    return ((a as any).budgetCatId && uCatIds.has(String((a as any).budgetCatId))) ||
           ((a as any).budgetCatName && uCatNames.has((a as any).budgetCatName))
  }

  // ── 통합 필터 ──
  const matchFilter = (a: Approval, group: string, tab: string): boolean => {
    const isCompleted = ['completed', 'vouchered'].includes(a.status)
    const isGeneral = !!(a as any).isGeneral

    // ── 품의함: 내가 신청한 품의 (완료 전) ──
    if (group === 'inbox') {
      const isMyApplicant = (a as any).applicant === currentUserName
      const isPreExp = !!(a as any).isPreExpense || a.status === 'preExpense' || (a.title || '').startsWith('[선지출]')
      // 선지출: applicant 또는 해당 출금전표의 담당자도 볼 수 있음
      if (!isMyApplicant) {
        if (isPreExp && tab === 'preExpense') {
          // 선지출건: 해당 예산 담당자이거나 cashflow manager가 나인 경우
          const cfAll: CashFlow[] = getItem('acct_cashflows', [])
          const linkedCf = cfAll.find(cf => String((cf as any).approvalId) === String(a.id))
          const cfManager = linkedCf ? (linkedCf as any).manager || '' : ''
          if (cfManager !== currentUserName && !isExpenseUser(a)) return false
        } else if (tab === 'rejected' && a.status === 'rejected' && (a as any).approver === currentUserName) {
          return true
        } else {
          return false
        }
      }
      if (isCompleted) return false
      return a.status === tab
    }

    // ── 결제함: 승인권자/지출담당자 역할별 ──
    if (group === 'process') {
      if (isCompleted) return false
      // 승인권자 서브탭
      if (tab.startsWith('ap_')) {
        if ((a as any).approver !== currentUserName) return false
        const realStatus = tab.replace('ap_', '')
        if (realStatus === 'pending') return a.status === 'pending' || a.status === 'preExpense'
        return a.status === realStatus
      }
      // 지출담당자 서브탭
      if (tab.startsWith('ex_')) {
        if (!isExpenseUser(a) && (a as any).applicant !== currentUserName) return false
        if (tab === 'ex_pending') return a.status === 'approved'
        if (tab === 'ex_done') return a.status === 'expensed'
        if (tab === 'ex_settle') return a.status === 'confirming'
        if (tab === 'ex_settled') return a.status === 'toResolve' && !!(a as any)._settled
        return false
      }
    }

    // ── 보관함: 완료된 건 중 본인 관련만 ──
    if (group === 'archive') {
      if (!isCompleted) return false
      const isMine = (a as any).applicant === currentUserName || (a as any).approver === currentUserName || isExpenseUser(a)
      if (!isMine) return false
      if (tab === 'generalDone') return isGeneral
      if (tab === 'expenseDone') return !isGeneral
      return true
    }
    return false
  }

  const getSubTabCount = (tabKey: string) => {
    return approvals.filter(a => matchFilter(a, activeGroup, tabKey)).length
  }

  const filteredApprovals = approvals.filter(a => matchFilter(a, activeGroup, subTab))

  const groupCounts = groupDefs.map(g => {
    return approvals.filter(a => {
      return g.subTabs.some(t => matchFilter(a, g.key, t.key))
    }).length
  })

  const handleAmtInput = (val: string) => {
    const digits = val.replace(/[^\d]/g, '')
    setForm(f => ({ ...f, amount: digits ? Number(digits).toLocaleString('ko-KR') : '' }))
  }

  const saveApproval = () => {
    if (!form.title.trim()) return alert('품의명을 입력해주세요')
    const isGeneral = modalApprovalType === 'general'
    const amt = isGeneral ? 0 : (parseInt(form.amount.replace(/,/g, '')) || 0)
    if (!isGeneral && amt <= 0) return alert('금액을 입력해주세요')
    const approverList = staffList.filter(s => (s as any).approverType === 'approver')
    const autoApprover = form.approver || (isGeneral ? (staffList.length > 0 ? staffList[0].name : '') : (approverList.length > 0 ? approverList[0].name : (staffList.length > 0 ? staffList[0].name : '')))
    const all = getItem<Approval[]>('acct_approvals', [])
    if (editingId) {
      const updated = all.map(a => String(a.id) === String(editingId) ? {
        ...a,
        title: form.title.trim(),
        amount: amt,
        date: form.date,
        accountCode: form.accountCode,
        description: form.description,
        applicant: form.applicant,
        approver: autoApprover,
        budgetItem: form.budgetItem,
        budgetSubItem: form.budgetSubItem,
      } : a)
      setItem('acct_approvals', updated)
    } else {
      const selectedCat = budgetCats.find(c => String(c.id) === String((form as any).budgetCatId))
      all.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        title: form.title.trim(),
        amount: amt,
        date: form.date,
        status: 'pending',
        accountCode: form.accountCode,
        description: form.description,
        applicant: form.applicant,
        approver: autoApprover,
        isGeneral: isGeneral,
        budgetItem: form.budgetItem,
        budgetSubItem: form.budgetSubItem,
        budgetCatId: (form as any).budgetCatId || '',
        budgetCatName: selectedCat?.name || '',
        createdAt: new Date().toISOString(),
      } as any)
      setItem('acct_approvals', all)
    }
    setModalOpen(false)
    setEditingId(null)
    setModalApprovalType('expense')
    setForm({ title: '', amount: '', date: new Date().toISOString().slice(0, 10), accountCode: '', description: '', applicant: currentUserName, approver: '' })
    setRefresh(r => r + 1)
  }

  const updateStatus = (id: string | number, status: string) => {
    const all = getItem<Approval[]>('acct_approvals', [])
    const updated = all.map(a => String(a.id) === String(id) ? { ...a, status } : a)
    setItem('acct_approvals', updated)
    setRefresh(r => r + 1)
  }

  const deleteApproval = (id: string | number) => {
    // 선지출 품의는 삭제 불가
    const target = getItem<Approval[]>('acct_approvals', []).find(a => String(a.id) === String(id))
    if (target && target.status === 'preExpense') {
      alert('선지출된 품의는 삭제할 수 없습니다.')
      return
    }
    if (!confirm('이 품의를 삭제하시겠습니까?')) return
    const all = getItem<Approval[]>('acct_approvals', []).filter(a => String(a.id) !== String(id))
    setItem('acct_approvals', all)
    setRefresh(r => r + 1)
  }

  // ── 승인/반려 워크플로우 상태 ──
  const [approveMode, setApproveMode] = useState(false)
  const [rejectMode, setRejectMode] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [resubmitMode, setResubmitMode] = useState(false)
  const [resubmitForm, setResubmitForm] = useState({ title: '', amount: '', date: '', description: '' })
  const [approvePw, setApprovePw] = useState('')
  const [approvePwError, setApprovePwError] = useState('')
  const [approveBudgetCat, setApproveBudgetCat] = useState('')
  const [approveBudgetItem, setApproveBudgetItem] = useState('')
  const [approveBudgetSub, setApproveBudgetSub] = useState('')
  const [approveBudgetDetail, setApproveBudgetDetail] = useState('')
  const [budgetSearchText, setBudgetSearchText] = useState('')
  const [budgetSearchFocused, setBudgetSearchFocused] = useState(false)
  const [budgetSearchSelected, setBudgetSearchSelected] = useState('')
  const [approveAmount, setApproveAmount] = useState('')
  const [approveMemo, setApproveMemo] = useState('')
  const [settleRejectMode, setSettleRejectMode] = useState(false)
  const [settleRejectReason, setSettleRejectReason] = useState('')
  const [settleCompleteMode, setSettleCompleteMode] = useState(false)
  const [settleCompletePw, setSettleCompletePw] = useState('')
  const [settleCompletePwError, setSettleCompletePwError] = useState('')

  // 승인할 탭에서의 상세 열기 여부
  const isApproverPendingView = activeGroup === 'process' && subTab === 'ap_pending'

  // 선택된 예산구분에 따른 예산항목 필터 (고유 itemName 기준)
  const approveFilteredItems = useMemo(() => {
    if (!approveBudgetCat) return [] as BudgetItem[]
    const items = budgetItems.filter(b => String(b.catId) === String(approveBudgetCat))
    // 고유 itemName 기준 그룹핑 (첫 번째 항목만 대표)
    const seen = new Set<string>()
    return items.filter(b => {
      if (seen.has(b.itemName)) return false
      seen.add(b.itemName)
      return true
    })
  }, [approveBudgetCat, budgetItems])

  // ── 통합 검색용 플랫 리스트 (최종단 예산 경로) ──
  const budgetFlatList = useMemo(() => {
    const acctList: { code: string; name: string }[] = getItem('acct_accounts', [])
    const result: { catId: string; catName: string; itemId: string; itemName: string; subId?: string; subName?: string; detailId?: string; detailName?: string; accountCode?: string; accountName?: string; aliases: string; path: string; amount: number; spent: number; remaining: number }[] = []
    budgetCats.forEach(cat => {
      // 승인권자의 해당 예산건만 필터링
      const catAny = cat as any
      const isMyBudget = (catAny.approvers && catAny.approvers.includes(currentUserName)) ||
        catAny.approver === currentUserName ||
        (catAny.users && catAny.users.includes(currentUserName))
      if (!isMyBudget) return
      const catItems = budgetItems.filter(b => String(b.catId) === String(cat.id))
      // 고유 itemName별 그룹
      const itemGroups = new Map<string, BudgetItem[]>()
      catItems.forEach(b => {
        const arr = itemGroups.get(b.itemName) || []
        arr.push(b)
        itemGroups.set(b.itemName, arr)
      })
      itemGroups.forEach((items, itemName) => {
        const firstItem = items[0]
        const def = approveBudgetDefs.find(d => d.name === itemName || d.aliases?.includes(itemName))
        // 세목/세세항이 있는 경우 각각 등록
        if (def && def.subItems && def.subItems.length > 0) {
          def.subItems.forEach(sub => {
            const subAcct = sub.accountCode ? acctList.find(a => a.code === sub.accountCode) : null
            // 세세항(detailItems)이 있으면 세세항 단위로
            if (sub.detailItems && sub.detailItems.length > 0) {
              sub.detailItems.forEach(det => {
                const detBudget = items.find(b => b.subItemName === sub.name && b.detailItemName === det.name)
                const amt = detBudget?.amount || 0
                const sp = detBudget?.spent || 0
                const detAcct = det.accountCode ? acctList.find(a => a.code === det.accountCode) : subAcct
                result.push({
                  catId: String(cat.id), catName: cat.name,
                  itemId: String(firstItem.id), itemName,
                  subId: `def_${sub.id}`, subName: sub.name,
                  detailId: detBudget ? String(detBudget.id) : undefined, detailName: det.name,
                  accountCode: det.accountCode || sub.accountCode, accountName: detAcct?.name || '',
                  aliases: [...(def?.aliases || []), ...(sub.aliases || []), ...(det.aliases || [])].join(' '),
                  path: `${cat.name} > ${itemName} > ${sub.name} > ${det.name}`,
                  amount: amt, spent: sp, remaining: amt - sp,
                })
              })
            } else {
              // 세목 단위
              const subBudgets = items.filter(b => b.subItemName === sub.name)
              const amt = subBudgets.reduce((s, b) => s + (b.amount || 0), 0)
              const sp = subBudgets.reduce((s, b) => s + (b.spent || 0), 0)
              result.push({
                catId: String(cat.id), catName: cat.name,
                itemId: String(firstItem.id), itemName,
                subId: `def_${sub.id}`, subName: sub.name,
                accountCode: sub.accountCode, accountName: subAcct?.name || '',
                aliases: [...(def?.aliases || []), ...(sub.aliases || [])].join(' '),
                path: `${cat.name} > ${itemName} > ${sub.name}`,
                amount: amt, spent: sp, remaining: amt - sp,
              })
            }
          })
        } else {
          // 세목 없이 항목 단위
          const amt = items.reduce((s, b) => s + (b.amount || 0), 0)
          const sp = items.reduce((s, b) => s + (b.spent || 0), 0)
          const defAcct = def?.defaultAccountCode ? acctList.find(a => a.code === def.defaultAccountCode) : null
          result.push({
            catId: String(cat.id), catName: cat.name,
            itemId: String(firstItem.id), itemName,
            accountCode: def?.defaultAccountCode, accountName: defAcct?.name || '',
            aliases: (def?.aliases || []).join(' '),
            path: `${cat.name} > ${itemName}`,
            amount: amt, spent: sp, remaining: amt - sp,
          })
        }
      })
    })
    return result
  }, [budgetCats, budgetItems, approveBudgetDefs, refresh, currentUserName])

  // 통합 검색 필터 결과
  const budgetSearchResults = useMemo(() => {
    const q = budgetSearchText.trim().toLowerCase()
    if (!q) return []
    return budgetFlatList.filter(r =>
      r.path.toLowerCase().includes(q) ||
      (r.accountCode && r.accountCode.includes(q)) ||
      (r.accountName && r.accountName.toLowerCase().includes(q)) ||
      (r.aliases && r.aliases.toLowerCase().includes(q))
    ).slice(0, 10)
  }, [budgetSearchText, budgetFlatList])

  // 선택된 예산항목의 세목 목록 (budgetItemDefs 기반 + 실제 데이터 병합)
  const approveFilteredSubs = useMemo(() => {
    if (!approveBudgetItem) return [] as { id: string; name: string; isFromDef?: boolean }[]
    const selectedItem = budgetItems.find(b => String(b.id) === String(approveBudgetItem))
    if (!selectedItem) return []
    // budgetItemDefs에서 해당 예산항목의 세목 정의 가져오기
    const def = approveBudgetDefs.find(d => d.name === selectedItem.itemName || d.aliases?.includes(selectedItem.itemName))
    if (def && def.subItems && def.subItems.length > 0) {
      // 정의 기반 세목 목록
      return def.subItems.sort((a, b) => a.sortOrder - b.sortOrder).map(sub => ({
        id: `def_${sub.id}`,
        name: sub.name,
        defId: sub.id,
        isFromDef: true,
      }))
    }
    // 정의가 없으면 실제 데이터에서 추출
    const allForItem = budgetItems.filter(b =>
      String(b.catId) === String(selectedItem.catId) &&
      b.itemName === selectedItem.itemName &&
      b.subItemName
    )
    const seen = new Set<string>()
    return allForItem.filter(b => {
      const key = b.subItemName!
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }).map(b => ({ id: String(b.id), name: b.subItemName! }))
  }, [approveBudgetItem, budgetItems, approveBudgetDefs])

  // 선택된 세목의 세세항 목록
  const approveFilteredDetails = useMemo(() => {
    if (!approveBudgetSub || !approveBudgetItem) return [] as BudgetItem[]
    const selectedItem = budgetItems.find(b => String(b.id) === String(approveBudgetItem))
    if (!selectedItem) return []
    // 선택된 세목의 이름 가져오기
    const subEntry = approveFilteredSubs.find(s => s.id === approveBudgetSub)
    const subName = subEntry?.name || ''
    if (!subName) return []
    return budgetItems.filter(b =>
      String(b.catId) === String(selectedItem.catId) &&
      b.itemName === selectedItem.itemName &&
      b.subItemName === subName &&
      b.detailItemName
    )
  }, [approveBudgetSub, approveBudgetItem, budgetItems, approveFilteredSubs])

  const approveRemainingBudget = useMemo(() => {
    // 세세항이 선택된 경우
    if (approveBudgetDetail) {
      const det = budgetItems.find(b => String(b.id) === String(approveBudgetDetail))
      if (det) return { amount: det.amount || 0, spent: det.spent || 0, remaining: (det.amount || 0) - (det.spent || 0) }
    }
    // 세목이 선택된 경우 해당 세목의 잔액 (이름으로 매칭)
    if (approveBudgetSub && approveBudgetItem) {
      const selectedItem = budgetItems.find(b => String(b.id) === String(approveBudgetItem))
      const subEntry = approveFilteredSubs.find(s => s.id === approveBudgetSub)
      const subName = subEntry?.name || ''
      if (selectedItem && subName) {
        const related = budgetItems.filter(b =>
          String(b.catId) === String(selectedItem.catId) &&
          b.itemName === selectedItem.itemName &&
          b.subItemName === subName
        )
        const totalAmt = related.reduce((s, b) => s + (b.amount || 0), 0)
        const totalSpent = related.reduce((s, b) => s + (b.spent || 0), 0)
        return { amount: totalAmt, spent: totalSpent, remaining: totalAmt - totalSpent }
      }
    }
    // 항목이 선택된 경우 해당 항목 하위 전체 합산
    if (approveBudgetItem) {
      const selectedItem = budgetItems.find(b => String(b.id) === String(approveBudgetItem))
      if (selectedItem) {
        const related = budgetItems.filter(b =>
          String(b.catId) === String(selectedItem.catId) &&
          b.itemName === selectedItem.itemName
        )
        const totalAmt = related.reduce((s, b) => s + (b.amount || 0), 0)
        const totalSpent = related.reduce((s, b) => s + (b.spent || 0), 0)
        return { amount: totalAmt, spent: totalSpent, remaining: totalAmt - totalSpent }
      }
    }
    return null
  }, [approveBudgetItem, approveBudgetSub, approveBudgetDetail, budgetItems, approveFilteredSubs])

  const resetApproveState = () => {
    setApproveMode(false)
    setRejectMode(false)
    setResubmitMode(false)
    setResubmitForm({ title: '', amount: '', date: '', description: '' })
    setApprovePw('')
    setApprovePwError('')
    setApproveBudgetCat('')
    setApproveBudgetItem('')
    setApproveBudgetSub('')
    setApproveBudgetDetail('')
    setBudgetSearchText('')
    setBudgetSearchSelected('')
    setBudgetSearchFocused(false)
    setApproveAmount('')
    setApproveMemo('')
    setSettleRejectMode(false)
    setSettleRejectReason('')
    setSettleCompleteMode(false)
    setSettleCompletePw('')
    setSettleCompletePwError('')
  }

  // 재품의 확인: 내용 수정 후 status를 pending으로 변경
  const handleResubmitConfirm = () => {
    if (!resubmitForm.title.trim()) { setApprovePwError('품의명을 입력해주세요'); return }
    const isGeneral = !!(detailApproval as any).isGeneral
    const amt = isGeneral ? 0 : (parseInt(resubmitForm.amount.replace(/,/g, '')) || 0)
    if (!isGeneral && amt <= 0) { setApprovePwError('금액을 입력해주세요'); return }
    if (!detailApproval) return
    const approverList = staffList.filter(s => (s as any).approverType === 'approver')
    const autoApprover = approverList.length > 0 ? approverList[0].name : (staffList.length > 0 ? staffList[0].name : '')
    const all = getItem<Approval[]>('acct_approvals', [])
    // 예산구분 매핑
    const newCatId = (resubmitForm as any).budgetCatId || (a => (a as any).budgetCatId)(detailApproval)
    const selectedCat = newCatId ? budgetCats.find(c => String(c.id) === String(newCatId)) : null
    const updated = all.map(a => String(a.id) === String(detailApproval.id) ? {
      ...a,
      title: resubmitForm.title.trim(),
      amount: amt,
      date: resubmitForm.date || new Date().toISOString().slice(0, 10),
      description: resubmitForm.description,
      status: (detailApproval.status === 'rejected' || detailApproval.status === 'preExpense') ? 'pending' : detailApproval.status,
      isPreExpense: (a as any).isPreExpense || detailApproval.status === 'preExpense' || undefined,
      applicant: currentUserName,
      approver: autoApprover,
      budgetCatId: newCatId || (a as any).budgetCatId,
      budgetCatName: selectedCat ? selectedCat.name : (a as any).budgetCatName,
      budgetItemId: (a as any).budgetItemId,
      budgetSubId: (a as any).budgetSubId,
      budgetItem: (a as any).budgetItem,
      budgetSubItem: (a as any).budgetSubItem,
      approvedAt: undefined,
      rejectedAt: undefined,
      resubmittedAt: new Date().toISOString(),
    } : a)
    setItem('acct_approvals', updated)
    setRefresh(r => r + 1)
    resetApproveState()
    setDetailApproval(null)
  }

  const handleResubmitAmtInput = (val: string) => {
    const digits = val.replace(/[^\d]/g, '')
    setResubmitForm(f => ({ ...f, amount: digits ? Number(digits).toLocaleString('ko-KR') : '' }))
  }

  const handleRejectConfirm = () => {
    if (!approvePw.trim()) { setApprovePwError('비밀번호를 입력해주세요'); return }
    const myStaff = staffList.find(s => s.name === currentUserName)
    if (myStaff && myStaff.pw && myStaff.pw !== approvePw) {
      setApprovePwError('비밀번호가 일치하지 않습니다'); return
    }
    if (!detailApproval) return
    // 반려 처리 + approver를 현재 사용자로 갱신
    const all = getItem<Approval[]>('acct_approvals', [])
    const updated = all.map(a => String(a.id) === String(detailApproval.id) ? {
      ...a,
      status: 'rejected',
      approver: currentUserName,
      rejectedAt: new Date().toISOString(),
      rejectReason: rejectReason.trim() || undefined,
    } : a)
    setItem('acct_approvals', updated)
    setRefresh(r => r + 1)
    resetApproveState()
    setRejectReason('')
    setDetailApproval(null)
  }

  return (
    <div className="space-y-3">
      {/* ── 세그먼트 탭 바 ── */}
      <div className="bg-[var(--bg-muted)] rounded-xl p-1 inline-flex gap-1">
        {groupDefs.filter(g => g.key !== 'process' || userIsApprover || userIsExpenseManager).map((g) => {
          const isActive = activeGroup === g.key
          const cnt = groupCounts[groupDefs.indexOf(g)]
          return (
            <button key={g.key}
              onClick={() => changeGroup(g.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-bold transition-all cursor-pointer select-none',
                isActive
                  ? 'bg-[var(--bg-surface)] shadow-md text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]/50'
              )}
            >
              <span className="text-[14px]">{g.icon}</span>
              <span>{g.label}</span>
              {cnt > 0 && (
                <span className={cn(
                  'min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-black',
                  isActive ? 'text-white' : 'bg-[var(--bg-surface)] text-[var(--text-muted)]'
                )}
                  style={isActive ? { background: g.color } : {}}
                >{cnt}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── 인라인 필터 칩 + 액션 버튼 ── */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto flex-wrap">
          {currentGroup.subTabs.map((t) => {
            const cnt = getSubTabCount(t.key)
            const isActive = subTab === t.key
            return (
              <button key={t.key}
                onClick={() => setSubTab(t.key)}
                className={cn(
                  'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer border whitespace-nowrap',
                  isActive
                    ? 'text-white border-transparent shadow-sm'
                    : 'text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[var(--text-muted)]'
                )}
                style={isActive ? { background: t.color, borderColor: t.color } : {}}
              >
                {t.label}
                <span className={cn(
                  'min-w-[16px] h-[16px] flex items-center justify-center rounded-full text-[9px] font-black',
                  isActive ? 'bg-white/25' : 'bg-[var(--bg-muted)]'
                )}>{cnt}</span>
              </button>
            )
          })}
        </div>
        {activeGroup === 'inbox' && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-500 text-white text-[12px] font-bold hover:bg-primary-600 transition-all cursor-pointer shadow-sm shrink-0"
          >
            <Plus size={13} /> {approvalBtnLabel}
          </button>
        )}
      </div>

      {/* ── 목록 ── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">

        {filteredApprovals.length === 0 ? (
          <div className="p-6"><EmptyState emoji="📋" title="해당 상태의 품의가 없습니다" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-[var(--bg-muted)]">
                  {['날짜', '제목', '금액', '상태', '담당자', '관리'].map(h => (
                    <th key={h} className={cn('py-2.5 px-3.5 text-[11px] font-bold text-[var(--text-muted)]',
                      h === '금액' ? 'text-right' : h === '담당자' ? 'text-center w-[160px]' : h === '상태' ? 'text-center w-[70px]' : h === '관리' ? 'text-center w-[80px]' : 'text-left')}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredApprovals.map(a => {
                  const isTransferApproval = !!(a as any).transferType || (a.title || '').startsWith('[대체]')
                  const isPreExp = !!(a as any).isPreExpense || a.status === 'preExpense' || (a.title || '').startsWith('[선지출]')
                  const si = isTransferApproval && (isPreExp || a.status === 'preExpense')
                    ? { label: '대체한', color: '#8b5cf6', bg: 'rgba(139,92,246,.1)' }
                    : isPreExp
                      ? { label: '지출한', color: '#f97316', bg: 'rgba(249,115,22,.1)' }
                      : (a.status === 'pending' && (a as any).resubmittedAt)
                        ? { label: '품의한', color: '#3b82f6', bg: 'rgba(59,130,246,.1)' }
                        : (statusInfo[a.status] || statusInfo.pending)
                  return (
                    <tr key={a.id} className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-muted)] transition-colors">
                      <td className="py-2.5 px-3.5 text-[12px] text-[var(--text-secondary)]">{(a.date || a.createdAt || '').slice(0, 10)}</td>
                      <td className="py-2.5 px-3.5 text-[12px] font-bold text-[var(--text-primary)]">{a.title || '-'}</td>
                      <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-right text-[var(--text-primary)]">{formatNumber(a.amount || 0)}원</td>
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: si.bg, color: si.color }}>
                          {si.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1 text-[10px]">
                          {(a as any).applicant && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 font-bold">품의-{(a as any).applicant}</span>
                          )}
                          {(a as any).approver && (
                            <span className={cn('px-1.5 py-0.5 rounded font-bold',
                              a.status === 'approved' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' :
                              a.status === 'rejected' ? 'bg-red-50 dark:bg-red-900/20 text-red-500' :
                              'bg-amber-50 dark:bg-amber-900/20 text-amber-600'
                            )}>
                              {a.status === 'approved' ? '승인' : a.status === 'rejected' ? '반려' : '승인'}-{(a as any).approver}
                            </span>
                          )}
                          {a.status === 'rejected' && (a as any).rejectReason && (
                            <span className="px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-900/20 text-red-400 font-bold text-[9px] max-w-[120px] truncate" title={(a as any).rejectReason}>
                              💬 {(a as any).rejectReason}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <button
                          onClick={() => setDetailApproval(a)}
                          className="p-1.5 rounded-md hover:bg-[var(--bg-muted)] cursor-pointer transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 지출품의서 폼 (상세 팝업 대체) ── */}
      {detailApproval && (
        <PrintApprovalForm
          readOnly={['approved','expensed','confirming','completed'].includes(detailApproval.status)}
          data={(() => {
            // 연동된 cashflow 조회
            const allCfs: any[] = getItem('acct_cashflows', [])
            const linkedCf = allCfs.find(c => c.approvalId && String(c.approvalId) === String(detailApproval.id))
            return {
            date: (detailApproval.date || detailApproval.createdAt || '').slice(0, 10),
            expenseDate: linkedCf?.tradeDate || (((detailApproval as any).isPreExpense || detailApproval.status === 'preExpense') ? (detailApproval.date || detailApproval.createdAt || '').slice(0, 10) : ''),
            settleDate: linkedCf?.inputDate || '',
            accountName: (() => {
              const d = detailApproval as any
              if (d.budgetItemId) {
                const item = budgetItems.find(b => String(b.id) === String(d.budgetItemId))
                return item?.itemName || d.budgetItem || ''
              }
              return d.budgetItem || ''
            })(),
            evidenceType: (detailApproval as any).budgetCatName || '',
            vendor: linkedCf?.counter || (detailApproval as any).vendor || '',
            itemName: detailApproval.title || '',
            purpose: (() => {
              const d = detailApproval as any
              if (d.budgetSubId) {
                const item = budgetItems.find(b => String(b.id) === String(d.budgetSubId))
                return item?.subItemName || d.budgetSubItem || ''
              }
              if (d.budgetItemId) {
                const item = budgetItems.find(b => String(b.id) === String(d.budgetItemId))
                return item?.subItemName || d.budgetSubItem || ''
              }
              return d.budgetSubItem || ''
            })(),
            amount: detailApproval.amount || 0,
            memo: (detailApproval as any).description || '',
            applicant: (detailApproval as any).applicant || '',
            approver: detailApproval.approver || '',
            applicantSealImg: staffList.find(s => s.name === (detailApproval as any).applicant)?.sealImg || '',
            approverSealImg: staffList.find(s => s.name === detailApproval.approver)?.sealImg || '',
            applicantPosition: staffList.find(s => s.name === (detailApproval as any).applicant)?.position || '',
            approverPosition: staffList.find(s => s.name === detailApproval.approver)?.position || '',
            approvalStatus: detailApproval.status || '',
            approvedMemo: (detailApproval as any).approvedMemo || '',
            attachments: (detailApproval as any).attachments || [],
            isGeneral: !!(detailApproval as any).isGeneral,
            approvalType: (detailApproval as any).isGeneral ? '일반품의' : ['toResolve','confirming','completed'].includes(detailApproval.status) ? '선지출' : '지출품의',
            approvedDate: (detailApproval as any).approvedAt ? (detailApproval as any).approvedAt.slice(0, 10) : '',
            department: (() => {
              const staff = staffList.find(s => s.name === (detailApproval as any).applicant)
              return (staff as any)?.department || (staff as any)?.dept || ''
            })(),
          }})()}
          onClose={() => { resetApproveState(); setDetailApproval(null) }}
          onUpdateAttachments={(updated) => {
            // 삭제된 첨부의 IndexedDB 이미지 정리
            const oldAtts: any[] = (detailApproval as any).attachments || []
            const newKeys = new Set(updated.map((a: any) => a.imageKey).filter(Boolean))
            oldAtts.forEach((a: any) => { if (a.imageKey && !newKeys.has(a.imageKey)) deleteAttachmentImage(a.imageKey) })
            // localStorage에는 dataUrl 없이 메타데이터만 저장
            const metaOnly = updated.map((a: any) => { const { dataUrl, ...rest } = a; return rest })
            const approvals: any[] = getItem('acct_approvals', [])
            const idx = approvals.findIndex(a => a.id === detailApproval.id)
            if (idx >= 0) {
              approvals[idx].attachments = metaOnly
              setItem('acct_approvals', approvals)
              setDetailApproval({ ...detailApproval, attachments: updated } as any)
            }
          }}
          actions={
            <>
              {isApproverPendingView && (detailApproval.status === 'pending' || detailApproval.status === 'preExpense') && (
                <>
                  <button onClick={() => { setApproveMode(true); setRejectMode(false); setApprovePw(''); setApprovePwError(''); setApproveAmount(detailApproval.amount ? Number(detailApproval.amount).toLocaleString('ko-KR') : ''); setApproveMemo(''); const da=detailApproval as any; let catId=da.budgetCatId?String(da.budgetCatId):''; if(!catId&&da.budgetCatName){const cat=budgetCats.find(c=>c.name===da.budgetCatName);if(cat)catId=String(cat.id)} if(catId){setApproveBudgetCat(catId);const itemName=da.budgetItem||'';let itemId=da.budgetItemId?String(da.budgetItemId):'';if(!itemId&&itemName){const f=budgetItems.find(b=>String(b.catId)===catId&&b.itemName===itemName);if(f)itemId=String(f.id)} if(itemId){setApproveBudgetItem(itemId);let subId=da.budgetSubId?String(da.budgetSubId):'';if(!subId&&da.budgetSubItem){const f=budgetItems.find(b=>String(b.catId)===catId&&b.itemName===itemName&&b.subItemName===da.budgetSubItem);if(f)subId=String(f.id)} if(!subId){const subs=budgetItems.filter(b=>String(b.catId)===catId&&b.itemName===itemName&&b.subItemName);if(subs.length===1)subId=String(subs[0].id)} if(subId)setApproveBudgetSub(subId)}} }} className="px-4 py-2 rounded-lg bg-[#22c55e] text-white text-sm font-bold hover:bg-[#16a34a] cursor-pointer flex items-center gap-1 shadow-sm"><Check size={13} /> 승인</button>
                  <button onClick={() => { setRejectMode(true); setApproveMode(false); setApprovePw(''); setApprovePwError('') }} className="px-4 py-2 rounded-lg bg-[#ef4444] text-white text-sm font-bold hover:bg-[#dc2626] cursor-pointer flex items-center gap-1 shadow-sm"><Ban size={13} /> 반려</button>
                </>
              )}
              {!isApproverPendingView && detailApproval.status === 'pending' && (
                <>
                  <button onClick={() => { const a=detailApproval; const da=a as any; let catId=da.budgetCatId?String(da.budgetCatId):''; if(!catId&&da.budgetCatName){const cat=budgetCats.find(c=>c.name===da.budgetCatName);if(cat)catId=String(cat.id)} setResubmitMode(true); setResubmitForm({title:a.title||'',amount:a.amount?Number(a.amount).toLocaleString('ko-KR'):'',date:(a.date||a.createdAt||'').slice(0,10),description:da.description||'',budgetCatId:catId} as any); setApprovePwError('') }} className="px-4 py-2 rounded-lg bg-[#4f6ef7] text-white text-sm font-bold hover:bg-[#3b5de7] cursor-pointer flex items-center gap-1 shadow-sm"><Edit3 size={13} /> 수정</button>
                  <button onClick={() => { deleteApproval(detailApproval.id); resetApproveState(); setDetailApproval(null) }} className="px-4 py-2 rounded-lg bg-[#ef4444] text-white text-sm font-bold hover:bg-[#dc2626] cursor-pointer flex items-center gap-1"><Trash2 size={13} /> 삭제</button>
                </>
              )}
              {!isApproverPendingView && detailApproval.status === 'approved' && (() => {
                const catId = (detailApproval as any).budgetCatId
                const cat = catId ? budgetCats.find(c => String(c.id) === String(catId)) : null
                const expenseManagers = cat?.users || []
                const managerNames = expenseManagers.length > 0
                  ? expenseManagers.map((name: string) => {
                      const staff = staffList.find(s => s.name === name)
                      return staff ? `${name} ${staff.position || ''}` : name
                    }).join(', ')
                  : '지출담당자'
                return (
                  <span className="px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                    {managerNames}님이 지출을 처리합니다.
                  </span>
                )
              })()}
              {!isApproverPendingView && detailApproval.status === 'preExpense' && (
                <button onClick={() => { const a=detailApproval; const da=a as any; let catId=da.budgetCatId?String(da.budgetCatId):''; if(!catId&&da.budgetCatName){const cat=budgetCats.find(c=>c.name===da.budgetCatName);if(cat)catId=String(cat.id)} setResubmitMode(true); setResubmitForm({title:a.title||'',amount:a.amount?Number(a.amount).toLocaleString('ko-KR'):'',date:(a.date||a.createdAt||'').slice(0,10),description:da.description||'',budgetCatId:catId} as any); setApprovePwError('') }} className="px-4 py-2 rounded-lg bg-[#f97316] text-white text-sm font-bold hover:bg-[#ea580c] cursor-pointer flex items-center gap-1 shadow-sm"><Edit3 size={13} /> 수정</button>
              )}
              {!isApproverPendingView && detailApproval.status === 'rejected' && (
                <>
                  <button onClick={() => { const a=detailApproval; const da=a as any; let catId=da.budgetCatId?String(da.budgetCatId):''; if(!catId&&da.budgetCatName){const cat=budgetCats.find(c=>c.name===da.budgetCatName);if(cat)catId=String(cat.id)} setResubmitMode(true); setResubmitForm({title:a.title||'',amount:a.amount?Number(a.amount).toLocaleString('ko-KR'):'',date:(a.date||a.createdAt||'').slice(0,10),description:da.description||'',budgetCatId:catId} as any); setApprovePwError('') }} className="px-4 py-2 rounded-lg bg-[#f59e0b] text-white text-sm font-bold hover:bg-[#d97706] cursor-pointer flex items-center gap-1 shadow-sm"><RefreshCw size={13} /> 재품의</button>
                  <button onClick={() => { deleteApproval(detailApproval.id); resetApproveState(); setDetailApproval(null) }} className="px-4 py-2 rounded-lg bg-[#ef4444] text-white text-sm font-bold hover:bg-[#dc2626] cursor-pointer flex items-center gap-1"><Trash2 size={13} /> 삭제</button>
                </>
              )}
              {!isApproverPendingView && detailApproval.status === 'confirming' && (() => {
                const catId = (detailApproval as any).budgetCatId
                const bCats: BudgetCat[] = getItem('acct_budget_cats', [])
                const cat = catId ? bCats.find(c => String(c.id) === String(catId)) : null
                const isExpenseManager = cat?.users?.includes(currentUserName) || false
                return isExpenseManager ? (
                  <>
                    <button onClick={() => { setSettleCompleteMode(true); setSettleCompletePw(''); setSettleCompletePwError('') }} className="px-4 py-2 rounded-lg bg-[#22c55e] text-white text-sm font-bold hover:bg-[#16a34a] cursor-pointer flex items-center gap-1 shadow-sm"><Check size={13} /> 정산완료</button>
                    <button onClick={() => { setSettleRejectMode(true); setSettleRejectReason('') }} className="px-4 py-2 rounded-lg bg-[#ef4444] text-white text-sm font-bold hover:bg-[#dc2626] cursor-pointer flex items-center gap-1 shadow-sm"><Ban size={13} /> 정산반려</button>
                  </>
                ) : (
                  <span className="px-3 py-2 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-[11px] text-violet-600 dark:text-violet-400 font-bold">
                    정산확인 대기 중 입니다.
                  </span>
                )
              })()}
              {/* 정산완료 비밀번호 모달 */}
              {settleCompleteMode && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={() => setSettleCompleteMode(false)}>
                  <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-[380px] p-5 space-y-3" onClick={e => e.stopPropagation()}>
                    <div className="text-sm font-extrabold text-[#22c55e] flex items-center gap-1.5"><Check size={16} /> 정산완료</div>
                    <p className="text-[11px] text-[var(--text-muted)]">본인 확인을 위해 비밀번호를 입력해주세요.</p>
                    <div>
                      <input
                        type="password"
                        value={settleCompletePw}
                        onChange={e => { setSettleCompletePw(e.target.value); setSettleCompletePwError('') }}
                        onKeyDown={e => { if (e.key === 'Enter') { (e.target as HTMLInputElement).closest('div')?.querySelector<HTMLButtonElement>('.settle-confirm-btn')?.click() } }}
                        placeholder="비밀번호"
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-sm text-[var(--text-primary)] focus:border-[#22c55e] outline-none"
                        autoFocus
                      />
                      {settleCompletePwError && <p className="text-[10px] text-[#ef4444] mt-1">{settleCompletePwError}</p>}
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button onClick={() => setSettleCompleteMode(false)} className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] cursor-pointer">취소</button>
                      <button className="settle-confirm-btn px-4 py-2 rounded-lg bg-[#22c55e] text-white text-sm font-bold hover:bg-[#16a34a] cursor-pointer flex items-center gap-1" onClick={() => {
                        const me = staffList.find(s => s.name === currentUserName)
                        if (!me?.pw || settleCompletePw !== me.pw) { setSettleCompletePwError('비밀번호가 일치하지 않습니다'); return }
                        const approvals:any[]=getItem('acct_approvals',[])
                        const idx=approvals.findIndex(a=>a.id===detailApproval.id)
                        if(idx>=0){
                          approvals[idx].status='completed'
                          approvals[idx].completedAt=new Date().toISOString()
                          approvals[idx].completedBy=currentUserName
                          setItem('acct_approvals',approvals)
                          setRefresh(r=>r+1)
                        }
                        setSettleCompleteMode(false)
                        resetApproveState()
                        setDetailApproval(null)
                      }}><Check size={13} /> 정산완료 확인</button>
                    </div>
                  </div>
                </div>
              )}
              {/* 정산반려 사유 입력 모달 */}
              {settleRejectMode && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={() => setSettleRejectMode(false)}>
                  <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-[400px] p-5 space-y-3" onClick={e => e.stopPropagation()}>
                    <div className="text-sm font-extrabold text-[#ef4444] flex items-center gap-1.5"><Ban size={16} /> 정산반려</div>
                    <p className="text-[11px] text-[var(--text-muted)]">반려 사유를 입력하세요. 결의자가 확인할 수 있습니다.</p>
                    <textarea
                      value={settleRejectReason}
                      onChange={e => setSettleRejectReason(e.target.value)}
                      placeholder="반려 사유를 입력하세요"
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-sm text-[var(--text-primary)] focus:border-[#ef4444] outline-none resize-none h-[80px]"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2 pt-1">
                      <button onClick={() => setSettleRejectMode(false)} className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] cursor-pointer">취소</button>
                      <button onClick={() => {
                        if (!settleRejectReason.trim()) { alert('반려 사유를 입력해주세요'); return }
                        const approvals:any[]=getItem('acct_approvals',[])
                        const idx=approvals.findIndex(a=>a.id===detailApproval.id)
                        if(idx>=0){
                          approvals[idx].status='toResolve'
                          approvals[idx].returnedAt=new Date().toISOString()
                          approvals[idx].returnReason=settleRejectReason.trim()
                          approvals[idx].returnedBy=currentUserName
                          setItem('acct_approvals',approvals)
                          setRefresh(r=>r+1)
                        }
                        setSettleRejectMode(false)
                        resetApproveState()
                        setDetailApproval(null)
                      }} className="px-4 py-2 rounded-lg bg-[#ef4444] text-white text-sm font-bold hover:bg-[#dc2626] cursor-pointer flex items-center gap-1"><Ban size={13} /> 반려 확인</button>
                    </div>
                  </div>
                </div>
              )}
              {!isApproverPendingView && detailApproval.status === 'toResolve' && (
                <>
                  {(detailApproval as any).returnReason && (
                    <div className="w-full px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800/30 text-[11px] space-y-0.5">
                      <div className="font-bold text-[#ef4444] flex items-center gap-1"><Ban size={12} /> 정산반려 사유</div>
                      <div className="text-[var(--text-primary)]">{(detailApproval as any).returnReason}</div>
                      <div className="text-[var(--text-muted)] text-[10px]">반려자: {(detailApproval as any).returnedBy || '-'} · {((detailApproval as any).returnedAt || '').slice(0,10)}</div>
                    </div>
                  )}
                  <label className="px-4 py-2 rounded-lg bg-[#4f6ef7] text-white text-sm font-bold hover:bg-[#3b5de7] cursor-pointer flex items-center gap-1">
                    <Paperclip size={13} /> 증빙첨부
                    <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.hwp" className="hidden" onChange={async e => {
                      const fileList = e.target.files; if(!fileList||fileList.length===0)return
                      const fileArr = Array.from(fileList); const fileCount = fileArr.length
                      e.target.value = ''
                      const existing:any[] = (detailApproval as any).attachments||[]
                      const newFiles:any[] = []
                      for(const f of fileArr){
                        const imageKey = `att_${detailApproval.id}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`
                        const entry:any = {name:f.name,size:f.size,type:f.type,addedAt:new Date().toISOString(),title:f.name.replace(/\.[^/.]+$/,''),printWidth:150,imageKey}
                        if(f.type.startsWith('image/')){
                          try{
                            const dataUrl:string = await new Promise((resolve,reject)=>{
                              const reader=new FileReader()
                              reader.onload=()=>{
                                const img=new Image()
                                img.onload=()=>{
                                  const MAX=800; let w=img.width,h=img.height
                                  if(w>MAX||h>MAX){if(w>h){h=Math.round(h*MAX/w);w=MAX}else{w=Math.round(w*MAX/h);h=MAX}}
                                  const c=document.createElement('canvas');c.width=w;c.height=h
                                  const ctx=c.getContext('2d');ctx?.drawImage(img,0,0,w,h)
                                  resolve(c.toDataURL('image/jpeg',0.7))
                                }
                                img.onerror=reject; img.src=reader.result as string
                              }
                              reader.onerror=reject; reader.readAsDataURL(f)
                            })
                            await saveAttachmentImage(imageKey, dataUrl)
                            entry.dataUrl = dataUrl
                          }catch(err){console.error('이미지 저장 실패',err)}
                        }
                        newFiles.push(entry)
                      }
                      const updated=[...existing,...newFiles]
                      // localStorage에는 dataUrl 없이 메타데이터만 저장
                      const metaOnly = updated.map(a => {const {dataUrl, ...rest} = a; return rest})
                      const approvals:any[]=getItem('acct_approvals',[])
                      const idx=approvals.findIndex(a=>a.id===detailApproval.id)
                      if(idx>=0){
                        approvals[idx].attachments=metaOnly
                        setItem('acct_approvals',approvals)
                        setDetailApproval({...detailApproval,attachments:updated} as any)
                      }
                      alert(`${fileCount}개 파일이 첨부되었습니다.`)
                    }} />
                  </label>
                  {((detailApproval as any).attachments||[]).length>0 && (
                    <button onClick={() => { if(!confirm('정산요청을 진행하시겠습니까?\n정산중 목록으로 이동됩니다.'))return; const approvals:any[]=getItem('acct_approvals',[]); const idx=approvals.findIndex(a=>a.id===detailApproval.id); if(idx>=0){approvals[idx].status='confirming';approvals[idx].confirmedAt=new Date().toISOString();setItem('acct_approvals',approvals);setRefresh(r=>r+1)} resetApproveState();setDetailApproval(null) }} className="px-4 py-2 rounded-lg bg-[#8b5cf6] text-white text-sm font-bold hover:bg-[#7c3aed] cursor-pointer flex items-center gap-1 shadow-sm"><Send size={13} /> 정산요청</button>
                  )}
                </>
              )}
            </>
          }
        />
      )}

      {/* ── 승인 확인 모달 ── */}
      {approveMode && detailApproval && (() => {
        const isPreExp = !!(detailApproval as any).isPreExpense || detailApproval.status === 'preExpense' || (detailApproval.title || '').startsWith('[선지출]')
        return createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/40" onClick={e => { if (e.target === e.currentTarget) { setApproveMode(false); setApprovePwError('') } }}>
          <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-fadeIn">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-default)]">
              <span className="text-sm font-extrabold text-[#22c55e] flex items-center gap-1.5">✅ {isPreExp ? '선지출 승인' : '품의 승인'}</span>
              <button onClick={() => { setApproveMode(false); setApprovePwError('') }} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* 품의 내용 확인 */}
              <div className="space-y-2">
                <div className="text-[11px] font-extrabold text-[var(--text-primary)] flex items-center gap-1">📋 품의 내용 확인</div>
                <div className="bg-[var(--bg-muted)] rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--text-muted)]">품의명</span>
                    <span className="font-bold text-[var(--text-primary)]">{detailApproval.title}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--text-muted)]">신청자</span>
                    <span className="font-bold text-[var(--text-primary)]">{(detailApproval as any).applicant || ''}</span>
                  </div>
                  {!!(detailApproval.amount) && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--text-muted)]">금액</span>
                    <span className="font-extrabold text-[var(--text-primary)] text-[14px]">₩ {(detailApproval.amount || 0).toLocaleString()}</span>
                  </div>
                  )}
                  {(detailApproval as any).budgetCatName && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--text-muted)]">예산구분</span>
                      <span className="font-bold text-[var(--text-primary)]">{(detailApproval as any).budgetCatName}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--text-muted)]">일자</span>
                    <span className="font-bold text-[var(--text-primary)]">{(detailApproval.date || detailApproval.createdAt || '').slice(0, 10)}</span>
                  </div>
                  {detailApproval.description && (
                    <div className="text-[11px] pt-1 border-t border-[var(--border-default)]">
                      <span className="text-[var(--text-muted)]">사유: </span>
                      <span className="text-[var(--text-primary)]">{detailApproval.description}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 비밀번호 */}
              <div>
                <label className="block text-[11px] font-extrabold text-[var(--text-primary)] mb-1">🔒 비밀번호 확인</label>
                <input
                  type="password"
                  value={approvePw}
                  onChange={e => { setApprovePw(e.target.value); setApprovePwError('') }}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500"
                  placeholder="비밀번호를 입력하세요"
                  onKeyDown={e => { if (e.key === 'Enter') handleApproveConfirm() }}
                />
                {approvePwError && <p className="text-[11px] text-[#ef4444] mt-1 font-bold">{approvePwError}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-[var(--border-default)]">
              <button onClick={() => { setApproveMode(false); setApprovePwError('') }} className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] cursor-pointer">취소</button>
              <button onClick={handleApproveConfirm} className="px-4 py-2 rounded-lg bg-[#22c55e] text-white text-sm font-bold hover:bg-[#16a34a] cursor-pointer flex items-center gap-1"><Check size={14} /> 승인</button>
            </div>
          </div>
        </div>
      , document.body)
      })()}

      {/* ── 반려 확인 모달 ── */}
      {rejectMode && detailApproval && createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/40" onClick={e => { if (e.target === e.currentTarget) { setRejectMode(false); setApprovePwError('') } }}>
          <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-sm mx-4 animate-fadeIn">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-default)]">
              <span className="text-sm font-extrabold text-[#ef4444] flex items-center gap-1.5">🚫 품의 반려</span>
              <button onClick={() => { setRejectMode(false); setApprovePwError('') }} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="text-[12px] text-[var(--text-secondary)]">
                <strong>{detailApproval.title}</strong> (₩{(detailApproval.amount || 0).toLocaleString()}) 을 반려합니다.
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-[var(--text-primary)] mb-1">📝 반려 사유</label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-red-400 resize-none"
                  placeholder="반려 사유를 입력해주세요 (선택)"
                />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-[var(--text-primary)] mb-1">🔒 비밀번호 확인</label>
                <input
                  type="password"
                  value={approvePw}
                  onChange={e => { setApprovePw(e.target.value); setApprovePwError('') }}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500"
                  placeholder="비밀번호를 입력하세요"
                  onKeyDown={e => { if (e.key === 'Enter') handleRejectConfirm() }}
                />
                {approvePwError && <p className="text-[11px] text-[#ef4444] mt-1 font-bold">{approvePwError}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-[var(--border-default)]">
              <button onClick={() => { setRejectMode(false); setApprovePwError('') }} className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] cursor-pointer">취소</button>
              <button onClick={handleRejectConfirm} className="px-4 py-2 rounded-lg bg-[#ef4444] text-white text-sm font-bold hover:bg-[#dc2626] cursor-pointer flex items-center gap-1"><Ban size={14} /> 반려 확인</button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* ── 수정 폼 모달 (PrintApprovalForm 위에 표시) ── */}
      {resubmitMode && detailApproval && createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/40" onClick={e => { if (e.target === e.currentTarget) { setResubmitMode(false); setApprovePwError('') } }}>
          <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-fadeIn">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-default)]">
              <span className="text-sm font-extrabold text-[var(--text-primary)]">
                {detailApproval.status === 'preExpense' ? '선지출 품의 수정' : detailApproval.status === 'rejected' ? '반려 품의 수정 (재품의)' : '품의 수정'}
              </span>
              <button onClick={() => { setResubmitMode(false); setApprovePwError('') }} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-1">품의명</label>
                <input value={resubmitForm.title} onChange={e => setResubmitForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500" placeholder="품의명을 입력해주세요" />
              </div>
              {!(detailApproval as any).isGeneral && (() => {
                const isPreExpEdit = !!(detailApproval as any).isPreExpense || detailApproval.status === 'preExpense'
                if (isPreExpEdit) {
                  // 선지출: 예산 정보 읽기전용 상세 텍스트
                  const catName = (detailApproval as any).budgetCatName || budgetCats.find(c => String(c.id) === String((detailApproval as any).budgetCatId))?.name || '미지정'
                  const itemName = (detailApproval as any).budgetItem || ''
                  const subName = (detailApproval as any).budgetSubItem || ''
                  const detailName = (detailApproval as any).budgetDetailItem || ''
                  const budgetPath = [catName, itemName, subName, detailName].filter(Boolean).join(' > ')
                  return (
                    <>
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-1">예산 정보</label>
                      <div className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-sm text-[var(--text-primary)] font-bold">
                        📋 {budgetPath}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-1">금액</label>
                      <div className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-sm text-[var(--text-primary)] text-right font-extrabold">
                        {typeof detailApproval.amount === 'number' ? detailApproval.amount.toLocaleString('ko-KR') : resubmitForm.amount}원
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-1">지출일자</label>
                      <div className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-sm text-[var(--text-primary)]">
                        📅 {resubmitForm.date}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-1">지출승인권자</label>
                      <div className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-sm text-[var(--text-primary)] font-bold">
                        👤 {(() => {
                          const cat = budgetCats.find(c => String(c.id) === String((detailApproval as any).budgetCatId))
                          if (cat && (cat as any).approvers && (cat as any).approvers.length > 0) {
                            return (cat as any).approvers.join(', ')
                          }
                          return (detailApproval as any).approver || '미지정'
                        })()}
                      </div>
                    </div>
                    </>
                  )
                }
                // 일반 품의 수정: 기존 편집 가능 필드
                return (
                  <>
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-1">예산구분</label>
                    <select value={(resubmitForm as any).budgetCatId || ''} onChange={e => setResubmitForm(f => ({ ...f, budgetCatId: e.target.value } as any))} className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500">
                      <option value="">— 예산구분 선택 —</option>
                      {budgetCats.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-1">금액</label>
                    <input value={resubmitForm.amount} onChange={e => {
                      const d = e.target.value.replace(/[^\d]/g, '')
                      setResubmitForm(f => ({ ...f, amount: d ? Number(d).toLocaleString('ko-KR') : '' }))
                    }} className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] text-sm text-[var(--text-primary)] text-right font-bold focus:outline-none focus:border-primary-500" placeholder="0" />
                  </div>
                  </>
                )
              })()}
              {!((detailApproval as any).isPreExpense || detailApproval.status === 'preExpense') && (
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-1">날짜</label>
                <input type="date" value={resubmitForm.date} onChange={e => setResubmitForm(f => ({ ...f, date: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500" />
              </div>
              )}
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-1">비고 / 설명</label>
                <textarea value={resubmitForm.description} onChange={e => setResubmitForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500 resize-none" placeholder="비고를 입력해주세요" />
              </div>
              {approvePwError && (
                <div className="text-[12px] text-red-500 font-bold text-center">{approvePwError}</div>
              )}
              {detailApproval.status === 'preExpense' && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <div className="text-[11px] text-amber-700 dark:text-amber-400 font-bold">⚠️ 선지출 → 후품의 전환</div>
                  <div className="text-[10px] text-amber-600 dark:text-amber-500 mt-1">수정 후 '품의할' 상태로 전환되어 승인자에게 승인 요청이 됩니다.</div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-[var(--border-default)]">
              <button onClick={() => { setResubmitMode(false); setApprovePwError('') }} className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer">취소</button>
              <button onClick={handleResubmitConfirm} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-bold hover:bg-primary-600 transition-colors cursor-pointer">{detailApproval.status === 'rejected' ? '재품의 제출' : '품의하기'}</button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* 품의 등록 모달 */}
      {modalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={e => { if (e.target === e.currentTarget) { setModalOpen(false); setEditingId(null); setModalApprovalType('expense'); setForm({ title: '', amount: '', date: new Date().toISOString().slice(0, 10), accountCode: '', description: '', applicant: currentUserName, approver: '' }) } }}>
          <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-md mx-4" style={{ height: '560px', display: 'flex', flexDirection: 'column' }}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-default)]">
              <span className="text-sm font-extrabold text-[var(--text-primary)]">{editingId ? '품의 수정' : (modalApprovalType === 'general' ? '일반품의 등록' : '지출품의 등록')}</span>
              <button onClick={() => { setModalOpen(false); setEditingId(null); setModalApprovalType('expense'); setForm({ title: '', amount: '', date: new Date().toISOString().slice(0, 10), accountCode: '', description: '', applicant: currentUserName, approver: '' }) }} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4 flex-1 overflow-y-auto">
              {!editingId && (
                <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-[var(--bg-muted)] border border-[var(--border-default)]">
                  <button onClick={() => { setModalApprovalType('expense'); setForm(f => ({ ...f, approver: '' })) }} className={`flex-1 py-1.5 rounded-lg text-[12px] font-extrabold transition-all cursor-pointer ${modalApprovalType === 'expense' ? 'bg-[#4f6ef7] text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>💸 지출품의</button>
                  <button onClick={() => { setModalApprovalType('general'); setForm(f => ({ ...f, approver: '' })) }} className={`flex-1 py-1.5 rounded-lg text-[12px] font-extrabold transition-all cursor-pointer ${modalApprovalType === 'general' ? 'bg-[#8b5cf6] text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>📋 일반품의</button>
                </div>
              )}
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">품의명 *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="예) 사무용품 구매" className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none" />
              </div>
              {modalApprovalType !== 'general' && (
              <>
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">예산구분</label>
                <select value={(form as any).budgetCatId || ''} onChange={e => {
                  const catId = e.target.value
                  const cat = budgetCats.find(c => String(c.id) === catId) as any
                  // 예산구분의 승인권자 자동 설정 (추가 승인권자 우선)
                  let autoApprover = ''
                  if (cat) {
                    if (cat.approver) {
                      // 추가 승인권자가 있으면 추가 승인권자 사용
                      autoApprover = cat.approver
                    } else if (cat.approvers && cat.approvers.length > 0) {
                      autoApprover = cat.approvers[0]
                    } else {
                      const approverStaff = staffList.find(s => (s as any).approverType === 'approver')
                      if (approverStaff) autoApprover = approverStaff.name
                    }
                  }
                  setForm(f => ({ ...f, budgetCatId: catId, approver: autoApprover } as any))
                }} className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none">
                  <option value="">— 예산구분 선택 —</option>
                  {budgetCats.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">금액 (원) *</label>
                <input value={form.amount} onChange={e => handleAmtInput(e.target.value)} placeholder="0" className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none text-right font-bold" />
              </div>
              </>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">신청자</label>
                  <input value={form.applicant} onChange={e => setForm(f => ({ ...f, applicant: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-sm text-[var(--text-primary)] outline-none" readOnly />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">{modalApprovalType === 'general' ? '승인권자' : '지출승인권한자'}</label>
                  {modalApprovalType === 'general' ? (
                    <CustomSelect
                      value={form.approver}
                      onChange={v => setForm(f => ({ ...f, approver: v }))}
                      placeholder="— 승인권자 선택 —"
                      options={[
                        { value: '', label: '— 선택 —' },
                        ...staffList.map(s => ({ value: s.name, label: `${s.name}${s.position ? ' (' + s.position + ')' : ''}` })),
                      ]}
                    />
                  ) : (() => {
                    const selCatId = (form as any).budgetCatId || ''
                    const selCat = selCatId ? budgetCats.find(c => String(c.id) === selCatId) as any : null
                    // 추가 승인권자가 있으면 추가 승인권자만 표시
                    const additionalApprover = selCat?.approver || ''
                    if (additionalApprover) {
                      return (
                        <div className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-sm font-bold text-[var(--text-primary)]">
                          {additionalApprover}
                        </div>
                      )
                    }
                    return (
                      <div className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-sm font-bold text-[var(--text-primary)]">
                        {form.approver || <span className="text-[var(--text-muted)] font-normal">예산구분을 선택하세요</span>}
                      </div>
                    )
                  })()}
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">사유/메모</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="품의 사유를 입력해주세요" rows={3} className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none resize-none" />
              </div>
              {modalApprovalType === 'general' && (
                <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 text-[11px] text-purple-700 dark:text-purple-400">
                  📋 일반품의는 승인권자가 승인 시 <strong>즉시 완료</strong> 처리됩니다.
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-[var(--border-default)]">
              <button onClick={() => { setModalOpen(false); setEditingId(null); setModalApprovalType('expense'); setForm({ title: '', amount: '', date: new Date().toISOString().slice(0, 10), accountCode: '', description: '', applicant: currentUserName, approver: '' }) }} className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] cursor-pointer">취소</button>
              <button onClick={saveApproval} className={`px-4 py-2 rounded-lg text-white text-sm font-bold cursor-pointer ${modalApprovalType === 'general' ? 'bg-[#8b5cf6] hover:bg-[#7c3aed]' : 'bg-[#22c55e] hover:bg-[#16a34a]'}`}>{editingId ? '수정' : '등록'}</button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  )
}


/* ═══════════════════════════════════════════
   전표 입력 (지출/입금/출금) — CRUD
   ═══════════════════════════════════════════ */
function AcctVoucherEntry({ year, type, catId }: { year: number; type: 'expense' | 'income' | 'withdrawal'; catId?: string | null }) {
  const [refresh, setRefresh] = useState(0)
  const [expenseTab, setExpenseTab] = useState<'waiting' | 'history'>('waiting')
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const typeLabels = { expense: '지출하기', income: '입금전표', withdrawal: '출금전표' }
  const typeEmojis = { expense: '💸', income: '💵', withdrawal: '🏧' }
  const typeColors = { expense: '#ef4444', income: '#22c55e', withdrawal: '#f59e0b' }
  const typeGrads = { expense: 'from-[#ef4444] to-[#dc2626]', income: 'from-[#22c55e] to-[#16a34a]', withdrawal: 'from-[#f59e0b] to-[#d97706]' }

  const today = new Date().toISOString().slice(0, 10)
  const currentUser = useAuthStore(s => s.user)
  const currentUserName = currentUser?.name || (() => { try { const u = JSON.parse(localStorage.getItem('ws_user') || '{}'); return u?.name } catch { return '' } })() || 'admin'
  const [form, setForm] = useState({ desc: '', subItem: '', detailItem: '', amount: '', counter: '', method: type === 'income' ? '계좌이체' : '계좌이체', writeDate: today, tradeDate: today, inputDate: today, manager: '', expenseManager: '', approvalStatus: '품의준비' })
  const [wdAttachments, setWdAttachments] = useState<{name:string; data:string; size:number; title:string; printWidth:number; row?:number}[]>([])
  const [wdEvidenceOpen, setWdEvidenceOpen] = useState(false)
  const [wdEvidenceEdit, setWdEvidenceEdit] = useState(true)
  const [withdrawalMode, setWithdrawalMode] = useState<'withdrawal' | 'transfer'>('withdrawal')
  const transferAccounts = ['현금', '상품권', '어음', '계좌'] as const
  const [transferForm, setTransferForm] = useState({ debit: '', debitDetail: '', credit: '', creditDetail: '', amount: '', tradeDate: today, description: '', memo: '', reason: '' })
  const transferPayMethods: any[] = (() => { try { return JSON.parse(localStorage.getItem('acct_pay_methods_v2') || '[]') } catch { return [] } })()
  const [transferAttachments, setTransferAttachments] = useState<{name:string; data:string; size:number; title:string; printWidth:number; row?:number}[]>([])
  const [transferEvidenceOpen, setTransferEvidenceOpen] = useState(false)
  const [transferEvidenceEdit, setTransferEvidenceEdit] = useState(true)
  const staffList = useStaffStore(s => s.staff).filter(s => !s.resignedAt)
  const [counterSearch, setCounterSearch] = useState('')
  const [showCounterList, setShowCounterList] = useState(false)
  const counterRef = useRef<HTMLDivElement>(null)
  const [descMode, setDescMode] = useState<'select' | 'input'>('select')
  const [isFromApproval, setIsFromApproval] = useState(false)
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null)
  const [approvalMeta, setApprovalMeta] = useState<{approver:string; requestDate:string; approvedDate:string; budgetCatName:string; accountCode:string; budgetCatId?:string}>({approver:'',requestDate:'',approvedDate:'',budgetCatName:'',accountCode:''})
  const [selectedBudgetCat, setSelectedBudgetCat] = useState('')
  const [wdBudgetItem, setWdBudgetItem] = useState('')
  const [wdCatName, setWdCatName] = useState('')
  // 출금전표 통합 검색
  const [wdSearchText, setWdSearchText] = useState('')
  const [wdSearchFocused, setWdSearchFocused] = useState(false)
  const [wdSearchSelected, setWdSearchSelected] = useState('')
  const [isReceivable, setIsReceivable] = useState(false)
  const [isPayable, setIsPayable] = useState(false)
  const [expectedDate, setExpectedDate] = useState('')

  const user = useAuthStore(s => s.user)

  /* 예산 카테고리 목록 (해당 연도 + 예산승인자/지출담당자 필터) */
  const expBudgetCats = useMemo(() => {
    const cats: BudgetCat[] = getItem('acct_budget_cats', [])
    const yearCats = cats.filter(c => {
      const pFrom = c.periodFrom || ''
      const pTo = c.periodTo || ''
      if (pFrom && pTo) {
        const yearStart = `${year}-01-01`
        const yearEnd = `${year}-12-31`
        return pFrom <= yearEnd && pTo >= yearStart
      }
      const cy = c.year || (pFrom ? parseInt(pFrom.substring(0, 4)) : year)
      return cy === year
    })
    // 예산승인자(approverType=approver)인지 확인
    const userName = user?.name || ''
    const staffList = getItem<any[]>('ws_users', [])
    const currentStaff = staffList.find(s => s.name === userName)
    const isBudgetApprover = currentStaff?.approverType === 'approver'
    
    // 예산승인자는 모든 예산구분 표시
    if (isBudgetApprover) return yearCats
    
    // 일반 사용자: 지출담당자/승인담당자로 지정된 카테고리만
    if (userName) {
      return yearCats.filter(c =>
        (c.users && c.users.length > 0 && c.users.includes(userName)) ||
        ((c as any).approvers && (c as any).approvers.length > 0 && (c as any).approvers.includes(userName))
      )
    }
    return yearCats
  }, [refresh, year, type, user])

  /* 계정과목 목록 */
  const acctAccounts = useMemo(() => getItem<{ code: string; name: string; type: string }[]>('acct_accounts', []), [refresh])

  /* 상단 예산선택 탭 변경 시 폼 동기화 */
  useEffect(() => {
    if (catId && catId !== 'all') {
      setSelectedBudgetCat(catId)
      setWdBudgetItem('')
      setForm(f => ({ ...f, subItem: '', amount: '' }))
      const cats: BudgetCat[] = getItem('acct_budget_cats', [])
      const cat = cats.find(c => String(c.id) === String(catId))
      setWdCatName(cat?.name || '')
    } else {
      setSelectedBudgetCat('')
      setWdBudgetItem('')
      setWdCatName('')
      setForm(f => ({ ...f, subItem: '', amount: '' }))
    }
  }, [catId])

  /* 예산 항목 (선택된 카테고리 기준) */
  const budgetItems = useMemo(() => {
    const budgets: BudgetItem[] = getItem('acct_budgets', [])
    if (selectedBudgetCat) {
      return budgets.filter(b => String(b.catId) === String(selectedBudgetCat))
    }
    const cats: BudgetCat[] = getItem('acct_budget_cats', [])
    const userName = user?.name || ''
    const allowedCatIds = new Set(
      cats.filter(c => c.users && c.users.length > 0 && c.users.includes(userName)).map(c => String(c.id))
    )
    return budgets.filter(b => allowedCatIds.has(String(b.catId)))
  }, [refresh, user, selectedBudgetCat])

  const budgetItemNames = useMemo(() => {
    const hist: string[] = getItem('acct_itemName_history', [])
    return Array.from(new Set([
      ...budgetItems.map(b => b.itemName).filter(Boolean),
      ...hist.filter(Boolean),
    ])).sort()
  }, [budgetItems])

  /* 출금전표용: 선택된 카테고리 내 실제 예산항목만 */
  const wdBudgetItemNames = useMemo(() => {
    if (!selectedBudgetCat) return [] as string[]
    const budgets: BudgetItem[] = getItem('acct_budgets', [])
    const filtered = budgets.filter(b => String(b.catId) === String(selectedBudgetCat))
    return Array.from(new Set(filtered.map(b => b.itemName).filter(Boolean))).sort()
  }, [selectedBudgetCat, refresh])

  /* 출금전표용: 선택된 예산항목의 세목 (budgetItemDefs 우선, 없으면 실제 데이터) */
  const wdSubItemNames = useMemo(() => {
    if (!wdBudgetItem || !selectedBudgetCat) return [] as string[]
    // budgetItemDefs에서 세목 정의 가져오기
    const defs: BudgetItemDef[] = getItem('acct_budget_item_defs', [])
    const def = defs.find(d => d.name === wdBudgetItem || d.aliases?.includes(wdBudgetItem))
    if (def && def.subItems && def.subItems.length > 0) {
      return def.subItems.sort((a, b) => a.sortOrder - b.sortOrder).map(s => s.name)
    }
    // 정의가 없으면 실제 데이터에서 추출
    const budgets: BudgetItem[] = getItem('acct_budgets', [])
    const filtered = budgets.filter(b =>
      String(b.catId) === String(selectedBudgetCat) && b.itemName === wdBudgetItem
    )
    return Array.from(new Set(filtered.map(b => b.subItemName).filter(Boolean))).sort() as string[]
  }, [wdBudgetItem, selectedBudgetCat, refresh])

  /* 출금전표용: BudgetItemDef 기반 세세항목 */
  const wdVoucherItemDefs = useMemo(() => getItem<BudgetItemDef[]>('acct_budget_item_defs', []).sort((a, b) => a.sortOrder - b.sortOrder), [refresh])
  const wdSelectedDef = useMemo(() => wdVoucherItemDefs.find(d => d.name === wdBudgetItem), [wdVoucherItemDefs, wdBudgetItem])
  const wdSelectedSub = useMemo(() => wdSelectedDef?.subItems.find(s => s.name === form.subItem), [wdSelectedDef, form.subItem])
  const wdDetailItems = useMemo(() => (wdSelectedSub?.detailItems || []).sort((a, b) => a.sortOrder - b.sortOrder), [wdSelectedSub])

  // ── 출금전표 통합 검색용 플랫 리스트 ──
  const wdBudgetFlatList = useMemo(() => {
    const acctList: { code: string; name: string }[] = getItem('acct_accounts', [])
    const allBudgets: BudgetItem[] = getItem('acct_budgets', [])
    const defs: BudgetItemDef[] = getItem('acct_budget_item_defs', [])
    const allCats: BudgetCat[] = getItem('acct_budget_cats', [])
    const yearCats = allCats.filter(c => {
      const pFrom = c.periodFrom || ''
      const pTo = c.periodTo || ''
      if (pFrom && pTo) {
        return pFrom <= `${year}-12-31` && pTo >= `${year}-01-01`
      }
      return (c.year || year) === year
    })
    const result: { catId: string; catName: string; itemName: string; subName?: string; detailName?: string; accountCode?: string; accountName?: string; aliases: string; path: string; amount: number; spent: number; remaining: number }[] = []
    yearCats.forEach(cat => {
      const catItems = allBudgets.filter(b => String(b.catId) === String(cat.id))
      const itemGroups = new Map<string, BudgetItem[]>()
      catItems.forEach(b => { const a = itemGroups.get(b.itemName) || []; a.push(b); itemGroups.set(b.itemName, a) })
      itemGroups.forEach((items, itemName) => {
        const def = defs.find(d => d.name === itemName || d.aliases?.includes(itemName))
        if (def && def.subItems && def.subItems.length > 0) {
          def.subItems.forEach(sub => {
            const subAcct = sub.accountCode ? acctList.find(a => a.code === sub.accountCode) : null
            if (sub.detailItems && sub.detailItems.length > 0) {
              sub.detailItems.forEach(det => {
                const db = items.find(b => b.subItemName === sub.name && b.detailItemName === det.name)
                const amt = db?.amount || 0, sp = db?.spent || 0
                const detAcct = det.accountCode ? acctList.find(a => a.code === det.accountCode) : subAcct
                result.push({ catId: String(cat.id), catName: cat.name, itemName, subName: sub.name, detailName: det.name, accountCode: det.accountCode || sub.accountCode, accountName: detAcct?.name || '', aliases: [...(def?.aliases||[]),...(sub.aliases||[]),...(det.aliases||[])].join(' '), path: `${cat.name} > ${itemName} > ${sub.name} > ${det.name}`, amount: amt, spent: sp, remaining: amt - sp })
              })
            } else {
              const sbs = items.filter(b => b.subItemName === sub.name)
              const amt = sbs.reduce((s,b) => s+(b.amount||0),0), sp = sbs.reduce((s,b) => s+(b.spent||0),0)
              result.push({ catId: String(cat.id), catName: cat.name, itemName, subName: sub.name, accountCode: sub.accountCode, accountName: subAcct?.name || '', aliases: [...(def?.aliases||[]),...(sub.aliases||[])].join(' '), path: `${cat.name} > ${itemName} > ${sub.name}`, amount: amt, spent: sp, remaining: amt - sp })
            }
          })
        } else {
          const amt = items.reduce((s,b) => s+(b.amount||0),0), sp = items.reduce((s,b) => s+(b.spent||0),0)
          const defAcct = def?.defaultAccountCode ? acctList.find(a => a.code === def.defaultAccountCode) : null
          result.push({ catId: String(cat.id), catName: cat.name, itemName, accountCode: def?.defaultAccountCode, accountName: defAcct?.name || '', aliases: (def?.aliases||[]).join(' '), path: `${cat.name} > ${itemName}`, amount: amt, spent: sp, remaining: amt - sp })
        }
      })
    })
    return result
  }, [year, refresh])

  const wdSearchResults = useMemo(() => {
    const q = wdSearchText.trim().toLowerCase()
    if (!q) return []
    return wdBudgetFlatList.filter(r => r.path.toLowerCase().includes(q) || (r.accountCode && r.accountCode.includes(q)) || (r.accountName && r.accountName.toLowerCase().includes(q)) || (r.aliases && r.aliases.toLowerCase().includes(q))).slice(0, 10)
  }, [wdSearchText, wdBudgetFlatList])

  /* 예산세목 (지출하기용: 선택된 예산목에 해당하는 세목 목록) */
  const subItemNames = useMemo(() => {
    if (!form.desc) return []
    // budgetItemDefs에서 세목 정의 가져오기
    const defs: BudgetItemDef[] = getItem('acct_budget_item_defs', [])
    const def = defs.find(d => d.name === form.desc || d.aliases?.includes(form.desc))
    if (def && def.subItems && def.subItems.length > 0) {
      return def.subItems.sort((a, b) => a.sortOrder - b.sortOrder).map(s => s.name)
    }
    // 정의가 없으면 실제 데이터에서 추출
    return Array.from(new Set(
      budgetItems.filter(b => b.itemName === form.desc).map(b => b.subItemName).filter(Boolean)
    )).sort() as string[]
  }, [form.desc, budgetItems])

  /* 거래처 리스트 (거래처관리 연동) */
  const vendorOptions = useMemo(() => {
    const vendors: Vendor[] = getItem('acct_vendors', [])
    const cats: BudgetCat[] = getItem('acct_budget_cats', [])
    return vendors.map(v => {
      const cat = v.budgetCatId ? cats.find(c => String(c.id) === String(v.budgetCatId)) : null
      return { value: v.name, label: v.name, budgetCatId: v.budgetCatId || '', catName: cat?.name || '' }
    })
  }, [refresh])

  /* 거래처 드롭다운 외부 클릭 닫기 */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (counterRef.current && !counterRef.current.contains(e.target as Node)) setShowCounterList(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const cashflows = useMemo(() => {
    const all = getItem<CashFlow[]>('acct_cashflows', [])
    // 사용자 관련 예산 카테고리 ID
    const userName = user?.name || ''
    const staffListData = getItem<any[]>('ws_users', [])
    const curStaff = staffListData.find(s => s.name === userName)
    const isApprover = curStaff?.approverType === 'approver'
    const cats: BudgetCat[] = getItem('acct_budget_cats', [])
    const myCatIds = isApprover
      ? null // 승인권자는 모두 표시
      : cats.filter(c =>
          (c.users && c.users.includes(userName)) ||
          ((c as any).approvers && (c as any).approvers.includes(userName))
        ).map(c => String(c.id))

    return all.filter(c => {
      if (!c.date) return false
      if (parseInt(c.date.substring(0, 4)) !== year) return false
      if (!(c.type === type || (type === 'withdrawal' && (c.type === 'expense' || c.type === 'transfer' as any)))) return false
      // 모든 전표: 내가 작성한 것만 표시 (승인권자는 전체)
      if (!isApprover) {
        // 출금전표: 해당 예산의 담당자(users)는 모든 건 표시
        if (type === 'withdrawal') {
          const cfCatId = String((c as any).budgetCatId || '')
          const isBudgetHandler = cfCatId && cats.some(ct => String(ct.id) === cfCatId && ct.users && ct.users.includes(userName))
          if (isBudgetHandler) { /* 예산 담당자는 통과 */ }
          else {
            const cfCreator = (c as any).createdBy || ''
            const cfManager = (c as any).manager || ''
            if (cfCreator && cfCreator !== userName && cfManager !== userName) return false
            if (!cfCreator && cfManager && cfManager !== userName) return false
          }
        } else {
          const cfCreator = (c as any).createdBy || ''
          const cfManager = (c as any).manager || ''
          // createdBy 또는 manager가 나와 일치하는 경우만 표시
          if (cfCreator && cfCreator !== userName && cfManager !== userName) return false
          if (!cfCreator && cfManager && cfManager !== userName) return false
        }
      }
      // 관련 예산 필터
      if (myCatIds !== null) {
        const cfCatId = String((c as any).budgetCatId || '')
        if (cfCatId && myCatIds.length > 0) return myCatIds.includes(cfCatId)
        // catId 없으면 catName으로 매칭
        if ((c as any).budgetCatName) {
          const matchCat = cats.find(ct => ct.name === (c as any).budgetCatName)
          if (matchCat) return myCatIds.includes(String(matchCat.id))
        }
        // 매칭 안되면 표시 안함 (비관련자)
        if (myCatIds.length === 0) return false
      }
      return true
    }).sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  }, [year, type, refresh, user])

  const totalAmount = cashflows.reduce((a, c) => a + (c.amount || 0), 0)

  const handleAmtInput = (val: string) => {
    const digits = val.replace(/[^\d]/g, '')
    setForm(f => ({ ...f, amount: digits ? Number(digits).toLocaleString('ko-KR') : '' }))
  }

  const uid = () => Date.now() + Math.floor(Math.random() * 1000)

  const saveEntry = () => {
    // 대체전표 저장
    if (type === 'withdrawal' && withdrawalMode === 'transfer') {
      if (!transferForm.debit) { alert('차변(받는쪽)을 선택하세요'); return }
      if (!transferForm.credit) { alert('대변(보내는쪽)을 선택하세요'); return }
      if (transferForm.debit === transferForm.credit) { alert('차변과 대변이 같을 수 없습니다'); return }
      const tAmt = parseInt(transferForm.amount.replace(/,/g, '')) || 0
      if (tAmt <= 0) { alert('금액을 입력하세요'); return }
      if (!transferForm.description.trim()) { alert('적요를 입력하세요'); return }
      const tId = uid()
      const vId = uid()
      const acctMap: Record<string, string> = { '현금': '1010', '계좌': '1020', '상품권': '1030', '어음': '1040' }
      const vouchers = getItem<Voucher[]>('acct_vouchers', [])
      vouchers.push({
        id: vId, date: transferForm.tradeDate, type: 'transfer',
        description: `${transferForm.credit} → ${transferForm.debit}`,
        entries: [
          { side: 'debit', accountCode: acctMap[transferForm.debit] || '1010', amount: tAmt },
          { side: 'credit', accountCode: acctMap[transferForm.credit] || '1020', amount: tAmt },
        ],
        createdAt: new Date().toISOString(),
      })
      setItem('acct_vouchers', vouchers)
      const debitLabel = transferForm.debitDetail ? `${transferForm.debit}(${transferForm.debitDetail})` : transferForm.debit
      const creditLabel = transferForm.creditDetail ? `${transferForm.credit}(${transferForm.creditDetail})` : transferForm.credit
      const cfs = getItem<CashFlow[]>('acct_cashflows', [])
      cfs.push({
        id: tId, date: transferForm.tradeDate, type: 'transfer' as any,
        amount: tAmt, description: transferForm.description,
        accountCode: acctMap[transferForm.debit] || '1010',
        counter: `${creditLabel} → ${debitLabel}`,
        writeDate: today,
        debitAccount: transferForm.debit,
        debitDetail: transferForm.debitDetail,
        creditAccount: transferForm.credit,
        creditDetail: transferForm.creditDetail,
        memo: transferForm.memo,
        createdBy: currentUserName,
      } as any)
      setItem('acct_cashflows', cfs)
      // 대체결의서(품의) 자동 생성
      const approvals = getItem<Approval[]>('acct_approvals', [])
      const budgetCats: BudgetCat[] = getItem('acct_budget_cats', [])
      // 승인권자 자동 설정
      let autoApprover = ''
      const staffData = getItem<any[]>('ws_users', [])
      // 예산구분에서 승인권자 찾기
      for (const cat of budgetCats) {
        if ((cat as any).approvers?.length > 0) { autoApprover = (cat as any).approvers[0]; break }
      }
      if (!autoApprover) {
        const approverStaff = staffData.find(s => s.approverType === 'approver')
        if (approverStaff) autoApprover = approverStaff.name
      }
      const preApprovalId = uid()
      approvals.push({
        id: preApprovalId,
        status: 'preExpense',
        isPreExpense: true,
        selfExpense: true,
        title: `[대체] ${transferForm.description || (creditLabel + ' → ' + debitLabel)}`,
        amount: tAmt,
        date: transferForm.tradeDate,
        createdAt: new Date().toISOString(),
        accountCode: '',
        description: transferForm.reason || `대체전표 - ${creditLabel} → ${debitLabel}`,
        applicant: currentUserName,
        approver: autoApprover,
        budgetItem: '',
        budgetSubItem: '',
        budgetCatId: '',
        budgetCatName: '',
        transferType: true,
        debitAccount: transferForm.debit,
        debitDetail: transferForm.debitDetail,
        creditAccount: transferForm.credit,
        creditDetail: transferForm.creditDetail,
        attachments: transferAttachments.length > 0 ? transferAttachments.map(a => ({ name: a.name, type: a.data?.startsWith('data:image') ? 'image/jpeg' : 'application/octet-stream', dataUrl: a.data, title: a.title, printWidth: a.printWidth, row: a.row })) : undefined,
      } as any)
      setItem('acct_approvals', approvals)
      // cashflow에 approvalId 연결
      const allCfs2 = getItem<CashFlow[]>('acct_cashflows', [])
      const cfIdx2 = allCfs2.findIndex(x => String(x.id) === String(tId))
      if (cfIdx2 >= 0) { (allCfs2[cfIdx2] as any).approvalId = String(preApprovalId); setItem('acct_cashflows', allCfs2) }
      setTransferForm({ debit: '', debitDetail: '', credit: '', creditDetail: '', amount: '', tradeDate: today, description: '', memo: '', reason: '' })
      setTransferAttachments([])
      setRefresh(r => r + 1)
      return
    }
    if (!form.desc.trim()) { alert('내용을 입력하세요'); return }
    const amt = parseInt(form.amount.replace(/,/g, '')) || 0
    if (amt <= 0) { alert('금액을 입력하세요'); return }
    // 입금/출금전표: 예산구분 필수
    if ((type === 'income' || type === 'withdrawal') && !selectedBudgetCat) { alert('예산구분을 선택하세요'); return }

    const cfId = uid()
    const vId = uid()

    // 전표 자동 생성
    const vouchers = getItem<Voucher[]>('acct_vouchers', [])
    let vEntries: { side: string; accountCode: string; amount: number }[]
    if (type === 'income') {
      const debitAcct = form.method === '현금' ? '1010' : '1020'
      vEntries = [
        { side: 'debit', accountCode: debitAcct, amount: amt },
        { side: 'credit', accountCode: '4030', amount: amt },
      ]
    } else {
      vEntries = [
        { side: 'debit', accountCode: '5110', amount: amt },
        { side: 'credit', accountCode: form.method === '현금' ? '1010' : '1020', amount: amt },
      ]
    }
    vouchers.push({
      id: vId, date: form.tradeDate, type: type === 'withdrawal' ? 'expense' : type,
      description: form.desc, entries: vEntries,
      budgetCatId: selectedBudgetCat || '',
      createdAt: new Date().toISOString(),
    } as any)
    setItem('acct_vouchers', vouchers)

    // 캐시플로 등록
    const cfs = getItem<CashFlow[]>('acct_cashflows', [])
    const newCf: any = {
      id: cfId, date: form.tradeDate, type: type === 'withdrawal' ? 'expense' : type,
      amount: amt, description: form.desc, accountCode: type === 'income' ? '4030' : '5110',
      counter: form.counter, writeDate: form.writeDate,
      manager: form.manager,
      budgetCatId: selectedBudgetCat || '',
      createdBy: currentUserName,
      ...(type === 'income' && (form as any).incomeNote ? { incomeNote: (form as any).incomeNote } : {}),
      ...(type === 'income' && isReceivable ? { receivable: true, received: false, expectedDate: expectedDate || '' } : {}),
      ...(type !== 'income' && isPayable ? { payable: true, paid: false, expectedDate: expectedDate || '' } : {}),
    }
    // 품의에서 지출등록한 경우 approvalId 연결
    if (isFromApproval && selectedApprovalId) {
      newCf.approvalId = String(selectedApprovalId)
    }
    cfs.push(newCf)
    setItem('acct_cashflows', cfs)

    // 승인된 품의에서 지출등록한 경우, 해당 품의 상태를 'toResolve'(결의할)로 변경
    if (isFromApproval && selectedApprovalId) {
      const approvals = getItem<Approval[]>('acct_approvals', [])
      const updated = approvals.map(ap =>
        String(ap.id) === String(selectedApprovalId)
          ? { ...ap, status: 'toResolve' as const }
          : ap
      )
      setItem('acct_approvals', updated)
      setSelectedApprovalId(null)
    }

    // 출금전표: 예산 집행액(spent) 업데이트
    if (type === 'withdrawal' && selectedBudgetCat && wdBudgetItem) {
      const budgets: BudgetItem[] = getItem('acct_budgets', [])
      const updated = budgets.map(b => {
        const catMatch = String(b.catId) === String(selectedBudgetCat)
        const itemMatch = b.itemName === wdBudgetItem
        const subMatch = form.subItem ? b.subItemName === form.subItem : true
        if (catMatch && itemMatch && subMatch) {
          // 세목이 지정된 경우 해당 세목에만, 아닌 경우 첫 매칭 항목에 분배
          return { ...b, spent: (b.spent || 0) + amt }
        }
        return b
      })
      setItem('acct_budgets', updated)
    }

    // 지출하기(expense): 예산 집행액 업데이트
    if (type === 'expense' && selectedBudgetCat && form.desc) {
      const budgets: BudgetItem[] = getItem('acct_budgets', [])
      const updated = budgets.map(b => {
        const catMatch = String(b.catId) === String(selectedBudgetCat)
        const itemMatch = b.itemName === form.desc
        const subMatch = form.subItem ? b.subItemName === form.subItem : true
        if (catMatch && itemMatch && subMatch) {
          return { ...b, spent: (b.spent || 0) + amt }
        }
        return b
      })
      setItem('acct_budgets', updated)
    }

    // 출금전표: 선지출 품의 자동 생성 (품의하기 메뉴에 표시)
    if (type === 'withdrawal') {
      const approvals = getItem<Approval[]>('acct_approvals', [])
      const budgetCats: BudgetCat[] = getItem('acct_budget_cats', [])
      const budgets: BudgetItem[] = getItem('acct_budgets', [])
      const selectedCat = budgetCats.find(c => String(c.id) === String(selectedBudgetCat))
      const catName = selectedCat?.name || wdCatName || ''
      // 지출담당자 본인 여부 판별
      const isSelfExpense = !!(selectedCat?.users && selectedCat.users.includes(currentUserName))
      // 승인권자 자동 설정
      let autoApprover = ''
      if (selectedCat) {
        if ((selectedCat as any).approvers && (selectedCat as any).approvers.length > 0) {
          autoApprover = (selectedCat as any).approvers[0]
        } else {
          const staffData = getItem<any[]>('ws_users', [])
          const approverStaff = staffData.find(s => s.approverType === 'approver')
          if (approverStaff) autoApprover = approverStaff.name
        }
      }
      // 이름으로 budgetItemId, budgetSubId 매핑
      const matchedItem = budgets.find(b => String(b.catId) === String(selectedBudgetCat) && b.itemName === wdBudgetItem)
      const matchedSub = form.subItem ? budgets.find(b => String(b.catId) === String(selectedBudgetCat) && b.itemName === wdBudgetItem && b.subItemName === form.subItem) : null
      const preApprovalId = uid()
      approvals.push({
        id: preApprovalId,
        status: 'preExpense',
        isPreExpense: true,
        selfExpense: isSelfExpense,
        title: `[선지출] ${form.desc || wdBudgetItem}`,
        amount: amt,
        date: form.tradeDate,
        createdAt: new Date().toISOString(),
        accountCode: '',
        description: (form as any).memo || `출금전표 선지출 - ${wdBudgetItem}${form.subItem ? ' > ' + form.subItem : ''}`,
        applicant: currentUserName,
        approver: autoApprover,
        budgetItem: wdBudgetItem,
        budgetSubItem: form.subItem || '',
        budgetDetailItem: form.detailItem || '',
        budgetCatId: selectedBudgetCat,
        budgetCatName: catName,
        budgetItemId: matchedItem ? String(matchedItem.id) : '',
        budgetSubId: matchedSub ? String(matchedSub.id) : '',
        attachments: wdAttachments.length > 0 ? wdAttachments : undefined,
      } as any)
      setItem('acct_approvals', approvals)
      // cashflow에 approvalId 연결
      const allCfs = getItem<CashFlow[]>('acct_cashflows', [])
      const cfIdx = allCfs.findIndex(x => String(x.id) === String(cfId))
      if (cfIdx >= 0) { (allCfs[cfIdx] as any).approvalId = String(preApprovalId); setItem('acct_cashflows', allCfs) }
    }

    setForm({ desc: '', subItem: '', detailItem: '', amount: '', counter: '', method: type === 'income' ? '계좌이체' : '계좌이체', writeDate: today, tradeDate: today, inputDate: today, manager: '', expenseManager: '', approvalStatus: '품의준비' })
    setCounterSearch('')
    setIsFromApproval(false)
    setWdBudgetItem('')
    setWdAttachments([])
    setRefresh(r => r + 1)
  }

  const deleteEntry = (id: string | number) => {
    if (!confirm('삭제하시겠습니까?')) return
    const allCfs = getItem<CashFlow[]>('acct_cashflows', [])
    const target = allCfs.find(c => String(c.id) === String(id))
    // 연동된 품의가 있으면 상태를 approved로 되돌림
    if (target && (target as any).approvalId) {
      const approvals: any[] = getItem('acct_approvals', [])
      const aIdx = approvals.findIndex(a => String(a.id) === String((target as any).approvalId))
      if (aIdx >= 0) {
        approvals[aIdx].status = 'approved'
        delete approvals[aIdx].expensedAt
        setItem('acct_approvals', approvals)
      }
    }
    const cfs = allCfs.filter(c => String(c.id) !== String(id))
    setItem('acct_cashflows', cfs)
    setRefresh(r => r + 1)
  }

  const methods = useMemo(() => {
    const allPM: PayMethodItem[] = (() => { try { return JSON.parse(localStorage.getItem('acct_pay_methods_v2') || '[]') } catch { return [] } })()
    const filtered = selectedBudgetCat
      ? allPM.filter(p => String(p.budgetCatId) === String(selectedBudgetCat))
      : allPM
    if (filtered.length > 0) return filtered.map(p => p.name)
    const stored: string[] = getItem('acct_payment_methods', ['계좌이체', '현금', '카드', '법인카드', '기타'])
    return stored.length > 0 ? stored : ['계좌이체', '현금', '카드', '법인카드', '기타']
  }, [refresh, selectedBudgetCat])

  return (
    <div className="space-y-4">
      {/* ── 지출하기: 탭 분리 ── */}
      {type === 'expense' && (
        <div className="flex items-center gap-1 bg-[var(--bg-muted)] rounded-xl p-1 border border-[var(--border-default)]">
          <button
            onClick={() => setExpenseTab('waiting')}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-bold transition-all cursor-pointer',
              expenseTab === 'waiting'
                ? 'bg-amber-500 text-white shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            )}
          >
            <Clock size={13} />
            지출대기
          </button>
          <button
            onClick={() => setExpenseTab('history')}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-bold transition-all cursor-pointer',
              expenseTab === 'history'
                ? 'bg-[#ef4444] text-white shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            )}
          >
            <ScrollText size={13} />
            지출내역
          </button>
        </div>
      )}

      {/* ── 등록 폼 (expense가 아닐 때만 인라인 표시) ── */}
      {type !== 'expense' && (
      <>
      <div className={`bg-gradient-to-r ${typeGrads[type]} rounded-2xl p-4 text-white`}>
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-xl">{typeEmojis[type]}</div>
          <div>
            <div className="text-[17px] font-extrabold">간편 {type === 'withdrawal' && withdrawalMode === 'transfer' ? '대체전표' : typeLabels[type]}</div>
            <div className="text-[11.5px] opacity-85">{type === 'withdrawal' && withdrawalMode === 'transfer' ? '자산 대체 내역을 입력하세요' : (type === 'income' ? '입금' : '지출') + ' 내역을 입력하세요'}</div>
          </div>
        </div>
        {type === 'withdrawal' && (
          <div className="flex gap-1.5 mt-1">
            <button onClick={() => setWithdrawalMode('withdrawal')} className={`px-3 py-1.5 rounded-lg text-[12px] font-bold cursor-pointer transition-all ${withdrawalMode === 'withdrawal' ? 'bg-white text-amber-600 shadow-md' : 'bg-white/20 text-white hover:bg-white/30'}`}>🏧 출금</button>
            <button onClick={() => setWithdrawalMode('transfer')} className={`px-3 py-1.5 rounded-lg text-[12px] font-bold cursor-pointer transition-all ${withdrawalMode === 'transfer' ? 'bg-white text-amber-600 shadow-md' : 'bg-white/20 text-white hover:bg-white/30'}`}>🔄 대체</button>
          </div>
        )}
      </div>

      {/* ━━ 대체전표 입력 폼 ━━ */}
      {type === 'withdrawal' && withdrawalMode === 'transfer' && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">차변 (받는쪽) *</label>
              <CustomSelect value={transferForm.debit} onChange={v => setTransferForm(f => ({ ...f, debit: v, debitDetail: '' }))} placeholder="— 선택 —" options={[{ value: '', label: '— 선택 —' }, ...transferAccounts.map(a => ({ value: a, label: a }))]} />
              {transferForm.debit && (() => {
                const items = transferPayMethods.filter(p => p.category === transferForm.debit)
                if (items.length === 0) return null
                return (
                  <div className="mt-1.5">
                    <CustomSelect value={transferForm.debitDetail} onChange={v => setTransferForm(f => ({ ...f, debitDetail: v }))} placeholder="— 세부 선택 —"
                      options={[{ value: '', label: '— 세부 선택 —' }, ...items.map(p => ({
                        value: p.name,
                        label: transferForm.debit === '계좌' ? `${p.name} (${p.bankName || ''} ${p.accountNumber || ''})` :
                               transferForm.debit === '현금' ? `${p.name} (${p.custodian || ''} · ${p.storageLocation || ''})` :
                               transferForm.debit === '상품권' ? `${p.name} (${p.voucherManager || ''} · ${(p.voucherAmount||0).toLocaleString()}원)` :
                               transferForm.debit === '어음' ? `${p.name} (${p.noteBank || ''} · ${p.noteManager || ''})` : p.name
                      }))]}
                    />
                  </div>
                )
              })()}
            </div>
            <div>
              <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">대변 (보내는쪽) *</label>
              <CustomSelect value={transferForm.credit} onChange={v => setTransferForm(f => ({ ...f, credit: v, creditDetail: '' }))} placeholder="— 선택 —" options={[{ value: '', label: '— 선택 —' }, ...transferAccounts.filter(a => a !== transferForm.debit).map(a => ({ value: a, label: a }))]} />
              {transferForm.credit && (() => {
                const items = transferPayMethods.filter(p => p.category === transferForm.credit)
                if (items.length === 0) return null
                return (
                  <div className="mt-1.5">
                    <CustomSelect value={transferForm.creditDetail} onChange={v => setTransferForm(f => ({ ...f, creditDetail: v }))} placeholder="— 세부 선택 —"
                      options={[{ value: '', label: '— 세부 선택 —' }, ...items.map(p => ({
                        value: p.name,
                        label: transferForm.credit === '계좌' ? `${p.name} (${p.bankName || ''} ${p.accountNumber || ''})` :
                               transferForm.credit === '현금' ? `${p.name} (${p.custodian || ''} · ${p.storageLocation || ''})` :
                               transferForm.credit === '상품권' ? `${p.name} (${p.voucherManager || ''} · ${(p.voucherAmount||0).toLocaleString()}원)` :
                               transferForm.credit === '어음' ? `${p.name} (${p.noteBank || ''} · ${p.noteManager || ''})` : p.name
                      }))]}
                    />
                  </div>
                )
              })()}
            </div>
            <div>
              <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">금액 (원) *</label>
              <input value={transferForm.amount} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setTransferForm(f => ({ ...f, amount: v ? parseInt(v).toLocaleString('ko-KR') : '' })) }} placeholder="0" className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-right font-bold text-[var(--text-primary)] focus:border-primary-500 outline-none" />
            </div>
            <div>
              <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">거래일자</label>
              <DatePicker value={transferForm.tradeDate} onChange={v => setTransferForm(f => ({ ...f, tradeDate: v }))} />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">적요 *</label>
              <input value={transferForm.description} onChange={e => setTransferForm(f => ({ ...f, description: e.target.value }))} placeholder={transferForm.debit && transferForm.credit ? `${transferForm.credit} → ${transferForm.debit} 전환` : '대체 내용 입력'} className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">대체사유</label>
              <textarea value={transferForm.reason} onChange={e => setTransferForm(f => ({ ...f, reason: e.target.value }))} placeholder="대체 사유를 입력하세요" rows={2} className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none resize-none" />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">비고</label>
              <input value={transferForm.memo} onChange={e => setTransferForm(f => ({ ...f, memo: e.target.value }))} placeholder="선택 입력" className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none" />
            </div>
          </div>
          {transferForm.debit && transferForm.credit && (
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-700 dark:text-amber-400 font-bold">
              🔄 {transferForm.creditDetail ? `${transferForm.credit}(${transferForm.creditDetail})` : transferForm.credit} → {transferForm.debitDetail ? `${transferForm.debit}(${transferForm.debitDetail})` : transferForm.debit} 대체전표가 생성됩니다.
            </div>
          )}
          {/* ── 증빙 첨부 / 미리보기 ── */}
          <div className="mt-1">
            <div className="flex items-center gap-2">
              <label className="text-[10.5px] font-bold text-[var(--text-muted)]">📎 첨부파일 (영수증/증빙)</label>
              {transferAttachments.length > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 font-bold">{transferAttachments.length}건</span>}
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <button type="button" onClick={() => { setTransferEvidenceOpen(true); setTransferEvidenceEdit(true) }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-[var(--border-default)] text-[11px] font-bold text-[var(--text-muted)] hover:border-primary-400 hover:text-primary-500 cursor-pointer transition-colors">
                <Paperclip size={12} /> {transferAttachments.length > 0 ? '증빙 편집' : '증빙 첨부'}
              </button>
              {transferAttachments.length > 0 && (
                <button type="button" onClick={() => { setTransferEvidenceOpen(true); setTransferEvidenceEdit(false) }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-default)] text-[11px] font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] cursor-pointer transition-colors">
                  <Eye size={12} /> 미리보기
                </button>
              )}
            </div>
          </div>
          {/* 증빙서류 문서 뷰 (PrintApprovalForm) */}
          {transferEvidenceOpen && (() => {
            const staffListData = getItem<any[]>('ws_users', [])
            const applicantStaff = staffListData.find(s => s.name === currentUserName)
            const debitLabel = transferForm.debitDetail ? `${transferForm.debit}(${transferForm.debitDetail})` : transferForm.debit
            const creditLabel = transferForm.creditDetail ? `${transferForm.credit}(${transferForm.creditDetail})` : transferForm.credit
            return (
            <PrintApprovalForm
              editMode={transferEvidenceEdit}
              data={{
                isTransfer: true,
                title: `[대체] ${transferForm.description || (creditLabel + ' → ' + debitLabel)}`,
                amount: parseInt(transferForm.amount.replace(/,/g, '')) || 0,
                applicant: currentUserName,
                approver: '',
                date: transferForm.tradeDate,
                expenseDate: transferForm.tradeDate,
                description: transferForm.reason || '',
                debitAccount: transferForm.debit,
                debitDetail: transferForm.debitDetail,
                creditAccount: transferForm.credit,
                creditDetail: transferForm.creditDetail,
                transferContent: (() => {
                  const creditPM = transferPayMethods.find(p => p.category === transferForm.credit && p.name === transferForm.creditDetail)
                  const debitPM = transferPayMethods.find(p => p.category === transferForm.debit && p.name === transferForm.debitDetail)
                  const creditDesc = creditPM && transferForm.credit === '계좌' ? `${creditPM.bankName || ''} ${creditPM.accountNumber || ''}` : (transferForm.creditDetail || transferForm.credit)
                  const debitDesc = debitPM && transferForm.debit === '계좌' ? `${debitPM.bankName || ''} ${debitPM.accountNumber || ''}` : (transferForm.debitDetail || transferForm.debit)
                  return `${creditDesc} 에서 ${debitDesc}(으)로 대체`
                })(),
                counter: `${creditLabel} → ${debitLabel}`,
                method: '대체',
                memo: transferForm.memo,
                attachments: transferAttachments.map(a => ({
                  name: a.name,
                  type: a.data?.startsWith('data:image') ? 'image/jpeg' : 'application/octet-stream',
                  dataUrl: a.data,
                  title: a.title,
                  printWidth: a.printWidth,
                  row: a.row,
                })),
                approvalType: '선지출',
                department: (applicantStaff as any)?.department || (applicantStaff as any)?.dept || '',
              }}
              onClose={() => setTransferEvidenceOpen(false)}
              onUpdateAttachments={(updated) => {
                setTransferAttachments(updated.map(a => ({
                  name: a.name,
                  data: (a as any).dataUrl || '',
                  size: 0,
                  title: a.title,
                  printWidth: a.printWidth,
                  row: a.row,
                })))
              }}
              actions={
                <>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 12, background: '#4f6ef7', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,.1)' }}>
                    <Paperclip size={14} /> 증빙첨부
                    <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.hwp" style={{ display: 'none' }} onChange={e => {
                      const files = e.target.files
                      if (!files) return
                      Array.from(files).forEach(file => {
                        const reader = new FileReader()
                        reader.onload = () => {
                          if (file.type.startsWith('image/')) {
                            const img = new Image()
                            img.onload = () => {
                              const MAX = 800; let w = img.width, h = img.height
                              if (w > MAX || h > MAX) { if (w > h) { h = Math.round(h * MAX / w); w = MAX } else { w = Math.round(w * MAX / h); h = MAX } }
                              const c = document.createElement('canvas'); c.width = w; c.height = h
                              const ctx = c.getContext('2d'); ctx?.drawImage(img, 0, 0, w, h)
                              const resized = c.toDataURL('image/jpeg', 0.85)
                              setTransferAttachments(prev => [...prev, { name: file.name, data: resized, size: file.size, title: '', printWidth: 100 }])
                            }
                            img.src = reader.result as string
                          } else {
                            setTransferAttachments(prev => [...prev, { name: file.name, data: reader.result as string, size: file.size, title: '', printWidth: 100 }])
                          }
                        }
                        reader.readAsDataURL(file)
                      })
                    }} />
                  </label>
                  <button onClick={() => { setTransferEvidenceOpen(false) }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 12, background: '#ef4444', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,.1)' }}>
                    <Check size={14} /> 증빙완료
                  </button>
                </>
              }
            />
          )})()}
          <div className="flex justify-end">
            <button onClick={saveEntry} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white text-sm font-bold cursor-pointer shadow-md bg-gradient-to-r from-[#f59e0b] to-[#d97706]">
              <Save size={14} /> 대체 등록
            </button>
          </div>
        </div>
      )}

      {(type !== 'withdrawal' || withdrawalMode !== 'transfer') && (
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4 space-y-3">
        {/* ━━ 입력 영역 ━━ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* ── 지출하기: 예산구분 ── */}
          {type === 'expense' ? (
          <div>
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">예산구분 *</label>
            <CustomSelect
              value={isFromApproval ? (approvalMeta.budgetCatName || '') : selectedBudgetCat}
              onChange={v => {
                if (!isFromApproval) {
                  setSelectedBudgetCat(v)
                  setForm(f => ({ ...f, desc: '', subItem: '' }))
                }
              }}
              placeholder="— 예산구분 선택 —"
              options={[
                { value: '', label: '— 예산구분 선택 —' },
                ...expBudgetCats.map(c => ({ value: String(c.id), label: c.name })),
              ]}
            />
          </div>
          ) : type === 'income' ? (
          <>
            {/* 입금전표: 1) 예산선택 */}
            <div>
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <label className="text-[10.5px] font-bold text-[var(--text-muted)]">예산선택</label>
                {selectedBudgetCat && (() => {
                  const allBudgets: BudgetItem[] = getItem('acct_budgets', [])
                  const catBudgets = allBudgets.filter(b => String(b.catId) === String(selectedBudgetCat))
                  const tb = catBudgets.reduce((s, b) => s + (b.amount || 0), 0)
                  const sp = catBudgets.reduce((s, b) => s + (b.spent || 0), 0)
                  const rm = tb - sp
                  const rt = tb > 0 ? Math.round(sp / tb * 100) : 0
                  return (
                    <>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800"><span className="text-[7px] text-blue-500 font-bold">총예산</span><span className="text-[9px] font-extrabold text-blue-600">{tb.toLocaleString('ko-KR')}</span></div>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800"><span className="text-[7px] text-amber-500 font-bold">기집행</span><span className="text-[9px] font-extrabold text-amber-600">{sp.toLocaleString('ko-KR')}</span></div>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800"><span className="text-[7px] text-emerald-500 font-bold">잔액</span><span className="text-[9px] font-extrabold text-emerald-600">{rm.toLocaleString('ko-KR')}</span></div>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800"><span className="text-[9px] font-extrabold text-violet-600">{rt}%</span></div>
                    </>
                  )
                })()}
              </div>
              <input value={wdCatName || '예산구분 선택'} readOnly className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-sm text-[var(--text-primary)] cursor-not-allowed outline-none font-bold" />
            </div>
            {/* 입금전표: 2) 입금내용 */}
            <div>
              <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">입금내용</label>
              <input value={(form as any).incomeNote || ''} onChange={e => setForm(f => ({ ...f, incomeNote: e.target.value } as any))} placeholder="예) 4월 보조금 입금" className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none" />
            </div>
            {/* 입금전표: 3) 입금계정 */}
            <div>
              <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">입금계정 *</label>
              <CustomSelect
                value={form.desc}
                onChange={v => {
                  const allIM: PayMethodItem[] = (() => { try { return JSON.parse(localStorage.getItem('acct_income_methods') || '[]') } catch { return [] } })()
                  const selectedIM = allIM.find(a => a.name === v)
                  const revenueAcct = (selectedIM as any)?.revenueAccountCode || ''
                  const assetAcct = (selectedIM as any)?.accountCode || ''
                  // 입금수단 자동 세팅: 카테고리 + 계좌정보
                  let autoMethod = ''
                  if (selectedIM) {
                    if (selectedIM.category === '계좌' && selectedIM.bankName) {
                      autoMethod = `🏦 ${selectedIM.name} • ${selectedIM.accountNumber || ''}`
                    } else if (selectedIM.category === '현금') {
                      autoMethod = `💵 ${selectedIM.name}`
                    } else if (selectedIM.category === '어음') {
                      autoMethod = `📄 ${selectedIM.name}`
                    } else if (selectedIM.category === '상품권') {
                      autoMethod = `🎟️ ${selectedIM.name}`
                    } else {
                      autoMethod = selectedIM.name
                    }
                  }
                  setForm(f => ({ ...f, desc: v, accountCode: revenueAcct, incomeAssetAccount: assetAcct, method: autoMethod } as any))
                }}
                placeholder="— 입금계정 선택 —"
                options={[
                  { value: '', label: '— 입금계정 선택 —' },
                  ...(() => {
                    const allIM: PayMethodItem[] = (() => { try { return JSON.parse(localStorage.getItem('acct_income_methods') || '[]') } catch { return [] } })()
                    const filtered = selectedBudgetCat
                      ? allIM.filter(p => String(p.budgetCatId) === String(selectedBudgetCat))
                      : allIM
                    return filtered.map(a => {
                      const detail = a.category === '계좌' && a.bankName ? ` (${a.bankName} ${a.accountNumber || ''})` : a.category === '현금' ? ` (현금)` : ''
                      const revAcct = (a as any).revenueAccountCode ? ` → ${(a as any).revenueAccountCode}` : ''
                      return { value: a.name, label: `${a.category} • ${a.name}${detail}${revAcct}` }
                    })
                  })(),
                ]}
              />
            </div>
            {/* 입금전표: 4) 금액 */}
            <div>
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <label className="text-[10.5px] font-bold text-[var(--text-muted)]">금액 (원) *</label>
                {selectedBudgetCat && (() => {
                  const allBudgets: BudgetItem[] = getItem('acct_budgets', [])
                  const catBudgets = allBudgets.filter(b => String(b.catId) === String(selectedBudgetCat))
                  const totalBudget = catBudgets.reduce((s, b) => s + (b.amount || 0), 0)
                  const allCfs: any[] = getItem('acct_cashflows', [])
                  const incomeCfs = allCfs.filter((c: any) => c.type === 'income' && (!c.budgetCatId || String(c.budgetCatId) === String(selectedBudgetCat)))
                  const totalIncome = incomeCfs.reduce((s: number, c: any) => s + (typeof c.amount === 'number' ? c.amount : (Number(String(c.amount || '0').replace(/,/g, '')) || 0)), 0)
                  const inputAmt = Number((form.amount || '0').replace(/,/g, '')) || 0
                  const afterIncome = totalIncome + inputAmt
                  const remaining = totalBudget - afterIncome
                  const incomePct = totalBudget > 0 ? Math.round(afterIncome / totalBudget * 100) : 0
                  return (
                    <>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800"><span className="text-[7px] text-blue-500 font-bold">총예산</span><span className="text-[9px] font-extrabold text-blue-600">{totalBudget.toLocaleString('ko-KR')}</span></div>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800"><span className="text-[7px] text-emerald-500 font-bold">총입금</span><span className="text-[9px] font-extrabold text-emerald-600">{afterIncome.toLocaleString('ko-KR')}</span></div>
                      <div className={`flex items-center gap-0.5 px-1 py-px rounded border ${remaining < 0 ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'}`}>
                        <span className={`text-[7px] font-bold ${remaining < 0 ? 'text-red-500' : 'text-amber-500'}`}>잔여</span>
                        <span className={`text-[9px] font-extrabold ${remaining < 0 ? 'text-red-600' : 'text-amber-600'}`}>{remaining.toLocaleString('ko-KR')}</span>
                      </div>
                      <div className={`flex items-center gap-0.5 px-1 py-px rounded border ${incomePct >= 100 ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800' : 'bg-violet-50 dark:bg-violet-900/10 border-violet-200 dark:border-violet-800'}`}>
                        <span className={`text-[9px] font-extrabold ${incomePct >= 100 ? 'text-emerald-600' : 'text-violet-600'}`}>{incomePct}%</span>
                      </div>
                    </>
                  )
                })()}
              </div>
              <input value={form.amount} onChange={e => handleAmtInput(e.target.value)} placeholder="0" className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm font-bold text-right focus:border-primary-500 outline-none" style={{ color: typeColors[type] }} />
            </div>
          </>
          ) : (
          <>
            {/* 출금전표: 1) 예산선택 */}
            <div>
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <label className="text-[10.5px] font-bold text-[var(--text-muted)]">예산선택</label>
                {selectedBudgetCat && (() => {
                  const allBudgets: BudgetItem[] = getItem('acct_budgets', [])
                  const catBudgets = allBudgets.filter(b => String(b.catId) === String(selectedBudgetCat))
                  const tb = catBudgets.reduce((s, b) => s + (b.amount || 0), 0)
                  const sp = catBudgets.reduce((s, b) => s + (b.spent || 0), 0)
                  const rm = tb - sp
                  const rt = tb > 0 ? Math.round(sp / tb * 100) : 0
                  return (
                    <>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800"><span className="text-[7px] text-blue-500 font-bold">총예산</span><span className="text-[9px] font-extrabold text-blue-600">{tb.toLocaleString('ko-KR')}</span></div>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800"><span className="text-[7px] text-amber-500 font-bold">기집행</span><span className="text-[9px] font-extrabold text-amber-600">{sp.toLocaleString('ko-KR')}</span></div>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800"><span className="text-[7px] text-emerald-500 font-bold">잔액</span><span className="text-[9px] font-extrabold text-emerald-600">{rm.toLocaleString('ko-KR')}</span></div>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800"><span className="text-[9px] font-extrabold text-violet-600">{rt}%</span></div>
                    </>
                  )
                })()}
              </div>
              <input value={wdCatName || '예산구분 선택'} readOnly className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-sm text-[var(--text-primary)] cursor-not-allowed outline-none font-bold" />
            </div>
            {/* 출금전표: 2) 품의명/지출내용 */}
            <div>
              <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">{(!form.manager || form.manager === currentUserName) ? '품의명' : '지출내용'} *</label>
              <input value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} placeholder="예) 사무용품 구매" className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none" />
            </div>
          </>
          )}
          {/* 예산항목/세목 (출금전표에서만) - 통합 검색 + 기존 드롭다운 */}
          {type === 'withdrawal' && (
          <>
            {/* ── 통합 검색 ── */}
            <div className="relative">
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <label className="text-[10.5px] font-bold text-[var(--text-muted)]">🔍 예산 통합 검색</label>
                {wdSearchSelected && (() => {
                  const allBudgets: BudgetItem[] = getItem('acct_budgets', [])
                  let matched = allBudgets.filter(b => String(b.catId) === String(selectedBudgetCat) && b.itemName === wdBudgetItem)
                  if (form.subItem) matched = matched.filter(b => b.subItemName === form.subItem)
                  if (form.detailItem) matched = matched.filter(b => b.detailItemName === form.detailItem)
                  const tb = matched.reduce((s, b) => s + (b.amount || 0), 0)
                  const sp = matched.reduce((s, b) => s + (b.spent || 0), 0)
                  const rm = tb - sp
                  const rt = tb > 0 ? Math.round(sp / tb * 100) : 0
                  return (
                    <>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800"><span className="text-[7px] text-blue-500 font-bold">총예산</span><span className="text-[9px] font-extrabold text-blue-600">{tb.toLocaleString('ko-KR')}</span></div>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800"><span className="text-[7px] text-amber-500 font-bold">기집행</span><span className="text-[9px] font-extrabold text-amber-600">{sp.toLocaleString('ko-KR')}</span></div>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800"><span className="text-[7px] text-emerald-500 font-bold">잔액</span><span className={`text-[9px] font-extrabold ${rm < 0 ? 'text-[#ef4444]' : 'text-emerald-600'}`}>{rm.toLocaleString('ko-KR')}</span></div>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800"><span className="text-[9px] font-extrabold text-violet-600">{rt}%</span></div>
                    </>
                  )
                })()}
              </div>
              {wdSearchSelected ? (
                <div className="w-full px-3 py-2.5 rounded-lg border border-primary-400 bg-primary-50/30 text-[12px] flex items-center justify-between gap-1">
                  <span className="text-[var(--text-primary)] font-bold truncate">{wdSearchSelected}</span>
                  <button type="button" onClick={() => { setWdSearchSelected(''); setWdSearchText(''); setSelectedBudgetCat(''); setWdBudgetItem(''); setWdCatName(''); setForm(f => ({...f, subItem:'', detailItem:'', amount:''})) }} className="text-[var(--text-muted)] hover:text-[#ef4444] text-[14px] shrink-0 cursor-pointer">✕</button>
                </div>
              ) : (
                <input
                  type="text"
                  value={wdSearchText}
                  onChange={e => setWdSearchText(e.target.value)}
                  onFocus={() => setWdSearchFocused(true)}
                  onBlur={() => setTimeout(() => setWdSearchFocused(false), 200)}
                  placeholder="예산항목, 세목, 계정과목명, 동의어 검색..."
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none placeholder:text-[var(--text-muted)]"
                />
              )}
              {wdSearchFocused && wdSearchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg shadow-lg z-50 max-h-[240px] overflow-y-auto">
                  {wdSearchResults.map((r, i) => (
                    <button key={i} type="button"
                      onMouseDown={e => { e.preventDefault(); setWdSearchSelected(r.path); setWdSearchText(''); setSelectedBudgetCat(r.catId); setWdCatName(r.catName); setWdBudgetItem(r.itemName); setForm(f => ({...f, subItem: r.subName||'', detailItem: r.detailName||''})); setWdSearchFocused(false) }}
                      className="w-full text-left px-3 py-2.5 hover:bg-primary-50/50 border-b border-[var(--border-default)] last:border-b-0 cursor-pointer transition-colors"
                    >
                      <div className="text-[12px] font-bold text-[var(--text-primary)] leading-tight">{r.path}</div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[10px] text-[var(--text-muted)]">{r.accountCode && `${r.accountCode} ${r.accountName}`}</span>
                        <span className={`text-[10px] font-extrabold ${r.remaining < 0 ? 'text-[#ef4444]' : r.remaining > 0 ? 'text-[#22c55e]' : 'text-[var(--text-muted)]'}`}>잔액 {r.remaining.toLocaleString()}원</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {wdSearchFocused && wdSearchText.trim() && wdSearchResults.length === 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg shadow-lg z-50 p-3 text-center">
                  <span className="text-[11px] text-[var(--text-muted)]">검색 결과가 없습니다</span>
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <label className="text-[10.5px] font-bold text-[var(--text-muted)]">금액 (원) *</label>
                {wdBudgetItem && (() => {
                  const budgets: BudgetItem[] = getItem('acct_budgets', [])
                  let matched = form.subItem
                    ? budgets.filter(b => String(b.catId) === String(selectedBudgetCat) && b.itemName === wdBudgetItem && b.subItemName === form.subItem)
                    : budgets.filter(b => String(b.catId) === String(selectedBudgetCat) && b.itemName === wdBudgetItem)
                  if (form.detailItem) matched = matched.filter(b => b.detailItemName === form.detailItem)
                  const totalBudget = matched.reduce((s, b) => s + (b.amount || 0), 0)
                  const prevSpent = matched.reduce((s, b) => s + (b.spent || 0), 0)
                  const inputAmt = Number((form.amount || '0').replace(/,/g, '')) || 0
                  const afterSpent = prevSpent + inputAmt
                  const afterRemain = totalBudget - afterSpent
                  const afterPct = totalBudget > 0 ? Math.round(afterSpent / totalBudget * 100) : 0
                  const isOver = afterRemain < 0
                  return (
                    <>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
                        <span className="text-[7px] text-blue-500 font-bold">총예산</span>
                        <span className="text-[9px] font-extrabold text-blue-600">{totalBudget.toLocaleString('ko-KR')}</span>
                      </div>
                      <div className={`flex items-center gap-0.5 px-1 py-px rounded border ${isOver ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'}`}>
                        <span className={`text-[7px] font-bold ${isOver ? 'text-red-500' : 'text-amber-500'}`}>집행</span>
                        <span className={`text-[9px] font-extrabold ${isOver ? 'text-red-600' : 'text-amber-600'}`}>{afterSpent.toLocaleString('ko-KR')}</span>
                      </div>
                      <div className={`flex items-center gap-0.5 px-1 py-px rounded border ${isOver ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800'}`}>
                        <span className={`text-[7px] font-bold ${isOver ? 'text-red-500' : 'text-emerald-500'}`}>잔액</span>
                        <span className={`text-[9px] font-extrabold ${isOver ? 'text-red-600' : 'text-emerald-600'}`}>{afterRemain.toLocaleString('ko-KR')}</span>
                      </div>
                      <div className={`flex items-center gap-0.5 px-1 py-px rounded border ${afterPct > 100 ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' : afterPct > 80 ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800' : 'bg-violet-50 dark:bg-violet-900/10 border-violet-200 dark:border-violet-800'}`}>
                        <span className={`text-[9px] font-extrabold ${afterPct > 100 ? 'text-red-600' : afterPct > 80 ? 'text-amber-600' : 'text-violet-600'}`}>{afterPct}%</span>
                        {isOver && <span className="text-[9px]">⚠️</span>}
                      </div>
                    </>
                  )
                })()}
              </div>
              <input value={form.amount} onChange={e => handleAmtInput(e.target.value)} placeholder="0" className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm font-bold text-right focus:border-primary-500 outline-none" style={{ color: typeColors[type] }} />
            </div>
          </>
          )}

          {type === 'expense' && (
          <div>
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">금액 (원) *</label>
            <input value={form.amount} onChange={e => handleAmtInput(e.target.value)} placeholder="0" className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm font-bold text-right focus:border-primary-500 outline-none" style={{ color: typeColors[type] }} />
          </div>
          )}
          {type === 'expense' && (
          <div>
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">예산목</label>
            {budgetItemNames.length > 0 ? (
              <div className="relative">
                {descMode === 'select' ? (
                  <CustomSelect
                    value={form.desc}
                    onChange={v => {
                      if (v === '__direct__') {
                        setDescMode('input')
                        setForm(f => ({ ...f, desc: '', subItem: '' }))
                      } else {
                        setForm(f => ({ ...f, desc: v, subItem: '' }))
                      }
                    }}
                    placeholder="— 예산목 선택 —"
                    options={[
                      { value: '', label: '— 예산목 선택 —' },
                      ...budgetItemNames.map(name => ({ value: name, label: name })),
                      { value: '__direct__', label: '✏️ 직접 입력' },
                    ]}
                  />
                ) : (
                  <div className="flex gap-1.5">
                    <input
                      value={form.desc}
                      onChange={e => setForm(f => ({ ...f, desc: e.target.value }))}
                      placeholder="지출 내용을 직접 입력"
                      className="flex-1 px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => { setDescMode('select'); setForm(f => ({ ...f, desc: '' })) }}
                      className="px-2.5 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-[10.5px] font-bold text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer whitespace-nowrap"
                    >
                      목록
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <input value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} placeholder="예산목 입력" className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none" />
            )}
          </div>
          )}
          {/* 예산세목 (지출하기에서만) */}
          {type === 'expense' && (
          <div>
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">예산세목</label>
            {subItemNames.length > 0 ? (
              <CustomSelect
                value={form.subItem}
                onChange={v => setForm(f => ({ ...f, subItem: v }))}
                placeholder="— 예산세목 선택 —"
                options={[
                  { value: '', label: '— 예산세목 선택 —' },
                  ...subItemNames.map(n => ({ value: n, label: n })),
                ]}
              />
            ) : (
              <input value={form.subItem || '-'} readOnly className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-sm text-[var(--text-primary)] cursor-not-allowed outline-none" />
            )}
          </div>
          )}
          {/* 담당자 (지출하기에서만) */}
          {type === 'expense' && (
          <div>
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">담당자</label>
            <CustomSelect
              value={form.manager}
              onChange={v => setForm(f => ({ ...f, manager: v }))}
              placeholder="— 담당자 선택 —"
              options={[
                { value: '', label: '— 담당자 선택 —' },
                ...staffList.map(s => ({ value: s.name, label: s.name })),
              ]}
            />
          </div>
          )}

        </div>

        {/* ━━ 수정 가능 영역 ━━ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-dashed border-[var(--border-default)]">
          <div ref={counterRef} className="relative">
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">거래처</label>
            <input
              value={counterSearch || form.counter}
              onChange={e => { setCounterSearch(e.target.value); setShowCounterList(true); setForm(f => ({ ...f, counter: '' })) }}
              onFocus={() => setShowCounterList(true)}
              placeholder="거래처명 검색..."
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none"
            />
            {showCounterList && (
              <div className="absolute z-50 left-0 right-0 top-full mt-1 max-h-[200px] overflow-y-auto rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-lg">
                {vendorOptions
                  .filter(v => !counterSearch || v.label.toLowerCase().includes(counterSearch.toLowerCase()))
                  .map((v, i) => (
                    <button key={i} onClick={() => {
                      setForm(f => ({ ...f, counter: v.value }))
                      setCounterSearch('')
                      setShowCounterList(false)
                      /* 거래처에 연결된 예산구분 자동 설정 */
                      if (type !== 'expense' && v.budgetCatId) {
                        setSelectedBudgetCat(v.budgetCatId)
                        setWdBudgetItem('')
                        setForm(f2 => ({ ...f2, counter: v.value, subItem: '', amount: '' }))
                        const cats: BudgetCat[] = getItem('acct_budget_cats', [])
                        const cat = cats.find(c => String(c.id) === String(v.budgetCatId))
                        setWdCatName(cat?.name || '')
                      }
                    }}
                      className="w-full text-left px-3 py-2 text-[13px] text-[var(--text-primary)] hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer border-none bg-transparent flex items-center justify-between">
                      <span>{v.label}</span>
                      {v.catName && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 font-bold ml-2 shrink-0">{v.catName}</span>}
                    </button>
                  ))}
                {vendorOptions.filter(v => !counterSearch || v.label.toLowerCase().includes(counterSearch.toLowerCase())).length === 0 && (
                  <div className="px-3 py-2 text-[12px] text-[var(--text-muted)]">검색 결과가 없습니다</div>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">{type === 'income' ? '입금' : '지출'}수단</label>
            {type === 'income' ? (
              <input
                value={form.method || '입금계정을 선택하면 자동 설정됩니다'}
                readOnly
                className={`w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] text-sm outline-none cursor-not-allowed ${form.method ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-300 font-bold' : 'bg-[var(--bg-muted)] text-[var(--text-muted)]'}`}
              />
            ) : (() => {
              // 지출수단 관리에서 등록된 수단만 사용 (예산구분별 필터)
              const catIdVal = selectedBudgetCat
              if (!catIdVal) {
                return (
                  <select disabled className="w-full px-2.5 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-[12px] text-[var(--text-muted)] cursor-not-allowed outline-none">
                    <option value="">— 예산을 먼저 선택하세요 —</option>
                  </select>
                )
              }
              const payOpts: {value:string; label:string; group:string}[] = []
              const allPayItems: PayMethodItem[] = (() => { try { return JSON.parse(localStorage.getItem('acct_pay_methods_v2') || '[]') } catch { return [] } })()
              const payItemsRaw = allPayItems.filter(p => String(p.budgetCatId) === String(catIdVal))
              // 같은 이름+카테고리 중복 제거
              const seen = new Set<string>()
              const payItems = payItemsRaw.filter(p => {
                const key = `${p.category}:${p.name}`
                if (seen.has(key)) return false
                seen.add(key)
                return true
              })
              // 계좌 + 연결 카드
              payItems.filter(p => p.category === '계좌').forEach(p => {
                payOpts.push({ value: `계좌:${p.name}`, label: `🏦 ${p.name}${p.accountNumber ? ' • ' + p.accountNumber : ''}`, group: '계좌' })
                if (p.cards) p.cards.forEach(card => {
                  payOpts.push({ value: `카드:${card.cardName || card.cardNumber}`, label: `💳 ${card.cardName || '카드'}${card.cardNumber ? ' ' + card.cardNumber : ''}`, group: '카드' })
                })
              })
              payItems.filter(p => p.category === '현금').forEach(p => payOpts.push({ value: p.name, label: `💵 ${p.name}`, group: '현금' }))
              payItems.filter(p => p.category === '어음').forEach(p => payOpts.push({ value: p.name, label: `📄 ${p.name}`, group: '어음' }))
              payItems.filter(p => p.category === '상품권').forEach(p => payOpts.push({ value: p.name, label: `🎟️ ${p.name}`, group: '상품권' }))
              // 등록된 수단이 없으면 안내 표시
              if (payOpts.length === 0) {
                return (
                  <select
                    value={form.method}
                    onChange={e => setForm(f => ({ ...f, method: e.target.value }))}
                    className="w-full px-2.5 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[12px] text-[var(--text-muted)] focus:outline-none focus:border-primary-500"
                  >
                    <option value="">— 지출수단을 먼저 등록하세요 —</option>
                  </select>
                )
              }
              return (
                <select
                  value={form.method}
                  onChange={e => setForm(f => ({ ...f, method: e.target.value }))}
                  className="w-full px-2.5 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[12px] text-[var(--text-primary)] focus:outline-none focus:border-primary-500"
                >
                  <option value="">— 선택 —</option>
                  {payOpts.filter(o => o.group === '계좌').length > 0 && (
                    <optgroup label="🏦 계좌">
                      {payOpts.filter(o => o.group === '계좌').map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </optgroup>
                  )}
                  {payOpts.filter(o => o.group === '카드').length > 0 && (
                    <optgroup label="💳 카드">
                      {payOpts.filter(o => o.group === '카드').map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </optgroup>
                  )}
                  {payOpts.filter(o => o.group === '현금').length > 0 && (
                    <optgroup label="💵 현금">
                      {payOpts.filter(o => o.group === '현금').map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </optgroup>
                  )}
                  {payOpts.filter(o => o.group === '어음').length > 0 && (
                    <optgroup label="📄 어음">
                      {payOpts.filter(o => o.group === '어음').map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </optgroup>
                  )}
                  {payOpts.filter(o => o.group === '상품권').length > 0 && (
                    <optgroup label="🎟️ 상품권">
                      {payOpts.filter(o => o.group === '상품권').map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </optgroup>
                  )}
                </select>
              )
            })()}
          </div>
          {type !== 'expense' && (
          <div>
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">{type === 'income' ? '전표 등록일자' : '전표작성일자'}</label>
            <DatePicker value={form.writeDate} onChange={v => setForm(f => ({ ...f, writeDate: v }))} />
          </div>
          )}
          <div>
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">{type === 'income' ? '실제거래일자' : '실제거래일자'}</label>
            <DatePicker value={form.tradeDate} onChange={v => setForm(f => ({ ...f, tradeDate: v }))} />
          </div>
          {/* 미수금 옵션 (입금전표) */}
          {type === 'income' && (
            <div className="bg-orange-50/60 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg p-2.5 col-span-2">
              <div className="flex items-center gap-3 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isReceivable} onChange={e => { setIsReceivable(e.target.checked); if (!e.target.checked) setExpectedDate('') }} className="w-4 h-4 rounded border-orange-300 text-orange-500 accent-orange-500" />
                  <span className="text-[11px] font-bold text-orange-700 dark:text-orange-400">📥 미수금</span>
                </label>
                <div className={`flex items-center gap-1.5 transition-opacity ${isReceivable ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                  <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 whitespace-nowrap">입금예정일</span>
                  <DatePicker value={expectedDate} onChange={v => setExpectedDate(v)} />
                </div>
              </div>
            </div>
          )}
          {/* 미지급금 옵션 (출금전표) */}
          {type === 'withdrawal' && (
            <div className="bg-violet-50/60 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800 rounded-lg p-2.5 col-span-2">
              <div className="flex items-center gap-3 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isPayable} onChange={e => { setIsPayable(e.target.checked); if (!e.target.checked) setExpectedDate('') }} className="w-4 h-4 rounded border-violet-300 text-violet-500 accent-violet-500" />
                  <span className="text-[11px] font-bold text-violet-700 dark:text-violet-400">📤 미지급금</span>
                </label>
                <div className={`flex items-center gap-1.5 transition-opacity ${isPayable ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                  <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 whitespace-nowrap">지급예정일</span>
                  <DatePicker value={expectedDate} onChange={v => setExpectedDate(v)} />
                </div>
              </div>
            </div>
          )}
          {/* 전표날짜 (기존 입력일자) */}
          {type === 'expense' && (
          <div>
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">전표날짜</label>
            <DatePicker value={form.inputDate} onChange={v => setForm(f => ({ ...f, inputDate: v }))} />
          </div>
          )}
        </div>
        {/* 담당자 (출금전표) */}
        {type === 'withdrawal' && (
          <div className="pt-2">
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">담당자</label>
            <CustomSelect
              value={form.manager}
              onChange={v => setForm(f => ({ ...f, manager: v }))}
              placeholder="— 담당자 선택 —"
              options={[
                { value: '', label: '— 담당자 선택 —' },
                ...staffList.map(s => ({ value: s.name, label: s.name })),
              ]}
            />
          </div>
        )}
        {
          (() => {
            const isSelfMode = type === 'withdrawal' && (!form.manager || form.manager === currentUserName)
            return (
              <div>
                <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">{isSelfMode ? '품의사유' : '비고'}</label>
                <textarea
                  value={(form as any).memo || ''}
                  onChange={e => setForm(f => ({ ...f, memo: e.target.value } as any))}
                  placeholder={isSelfMode ? '품의 사유를 입력하세요' : '참고 사항을 입력하세요'}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none resize-none h-[56px]"
                />
              </div>
            )
          })()
        }
        {/* 첨부파일 (출금전표 - 담당자 본인일 때만) */}
        {type === 'withdrawal' && (!form.manager || form.manager === currentUserName) && (
          <div className="pt-1">
            <div className="flex items-center gap-2">
              <label className="text-[10.5px] font-bold text-[var(--text-muted)]">📎 첨부파일 (영수증/증빙)</label>
              {wdAttachments.length > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 font-bold">{wdAttachments.length}건</span>}
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <button type="button" onClick={() => { setWdEvidenceOpen(true); setWdEvidenceEdit(true) }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-[var(--border-default)] text-[11px] font-bold text-[var(--text-muted)] hover:border-primary-400 hover:text-primary-500 cursor-pointer transition-colors">
                <Paperclip size={12} /> {wdAttachments.length > 0 ? '증빙 편집' : '증빙 첨부'}
              </button>
              {wdAttachments.length > 0 && (
                <button type="button" onClick={() => { setWdEvidenceOpen(true); setWdEvidenceEdit(false) }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-default)] text-[11px] font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] cursor-pointer transition-colors">
                  <Eye size={12} /> 미리보기
                </button>
              )}
            </div>
          </div>
        )}
        {/* 증빙서류 문서 뷰 (PrintApprovalForm) */}
        {wdEvidenceOpen && (() => {
          const budgetCats: BudgetCat[] = getItem('acct_budget_cats', [])
          const selectedCat = budgetCats.find(c => String(c.id) === String(selectedBudgetCat))
          const catName = selectedCat?.name || wdCatName || ''
          const amt = parseInt((form.amount || '0').replace(/,/g, '')) || 0
          const allStaff = getItem<any[]>('ws_users', [])
          let autoApprover = ''
          if (selectedCat) {
            if ((selectedCat as any).approvers && (selectedCat as any).approvers.length > 0) autoApprover = (selectedCat as any).approvers[0]
            else { const ap = allStaff.find(s => s.approverType === 'approver'); if (ap) autoApprover = ap.name }
          }
          const applicantStaff = allStaff.find(s => s.name === currentUserName)
          const approverStaff = allStaff.find(s => s.name === autoApprover)
          return (
            <PrintApprovalForm
              readOnly={false}
              data={{
                date: form.tradeDate || today,
                expenseDate: form.tradeDate || today,
                accountName: wdBudgetItem || '',
                evidenceType: catName,
                vendor: form.counter || '',
                itemName: form.desc || '',
                purpose: form.subItem || '',
                amount: amt,
                memo: (form as any).memo || '',
                applicant: currentUserName,
                approver: autoApprover,
                applicantSealImg: applicantStaff?.sealImg || '',
                approverSealImg: '',
                applicantPosition: applicantStaff?.position || '',
                approverPosition: approverStaff?.position || '',
                approvalStatus: 'preExpense',
                attachments: wdAttachments.map(a => ({
                  name: a.name,
                  type: a.data?.startsWith('data:image') ? 'image/jpeg' : 'application/octet-stream',
                  dataUrl: a.data,
                  title: a.title,
                  printWidth: a.printWidth,
                  row: a.row,
                })),
                approvalType: '선지출',
                department: (applicantStaff as any)?.department || (applicantStaff as any)?.dept || '',
              }}
              onClose={() => setWdEvidenceOpen(false)}
              onUpdateAttachments={(updated) => {
                setWdAttachments(updated.map(a => ({
                  name: a.name,
                  data: (a as any).dataUrl || '',
                  size: 0,
                  title: a.title,
                  printWidth: a.printWidth,
                  row: a.row,
                })))
              }}
              actions={
                <>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 12, background: '#4f6ef7', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,.1)' }}>
                    <Paperclip size={14} /> 증빙첨부
                    <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.hwp" style={{ display: 'none' }} onChange={e => {
                      const files = e.target.files
                      if (!files) return
                      let fileIdx = 0
                      Array.from(files).forEach(file => {
                        const currentFileIdx = fileIdx++
                        const reader = new FileReader()
                        reader.onload = () => {
                          if (file.type.startsWith('image/')) {
                            const img = new Image()
                            img.onload = () => {
                              const MAX = 800; let w = img.width, h = img.height
                              if (w > MAX || h > MAX) { if (w > h) { h = Math.round(h * MAX / w); w = MAX } else { w = Math.round(w * MAX / h); h = MAX } }
                              const c = document.createElement('canvas'); c.width = w; c.height = h
                              const ctx = c.getContext('2d'); ctx?.drawImage(img, 0, 0, w, h)
                              const compressed = c.toDataURL('image/jpeg', 0.7)
                              setWdAttachments(prev => {
                                const maxRow = prev.reduce((m, a) => Math.max(m, a.row ?? 0), -1)
                                return [...prev, { name: file.name, data: compressed, size: file.size, title: file.name.replace(/\.[^/.]+$/, ''), printWidth: 180, row: maxRow + 1 + currentFileIdx }]
                              })
                            }
                            img.src = reader.result as string
                          } else {
                            setWdAttachments(prev => {
                              const maxRow = prev.reduce((m, a) => Math.max(m, a.row ?? 0), -1)
                              return [...prev, { name: file.name, data: reader.result as string, size: file.size, title: file.name.replace(/\.[^/.]+$/, ''), printWidth: 150, row: maxRow + 1 + currentFileIdx }]
                            })
                          }
                        }
                        reader.readAsDataURL(file)
                      })
                      e.target.value = ''
                    }} />
                  </label>
                  {wdAttachments.length > 0 && (
                    <button type="button" onClick={() => setWdEvidenceOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 12, background: '#8b5cf6', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,.1)' }}>
                      <Check size={14} /> 증빙완료
                    </button>
                  )}
                </>
              }
            />
          )
        })()}
        <div className="flex justify-end">
          <button onClick={saveEntry} className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white text-sm font-bold cursor-pointer shadow-md bg-gradient-to-r ${typeGrads[type]}`}>
            <Save size={14} /> {type === 'income' ? '입금 등록' : (type === 'withdrawal' && (!form.manager || form.manager === currentUserName) ? '결의품의' : '지출 등록')}
          </button>
        </div>
      </div>
      )}
      </>
      )}

      {/* ── 지출대기 리스트 (승인된 품의) ── */}
      {type === 'expense' && expenseTab === 'waiting' && (() => {
        const approvals = getItem<Approval[]>('acct_approvals', [])
        const cats: BudgetCat[] = getItem('acct_budget_cats', [])
        // 사용자가 지출담당자로 등록된 모든 카테고리 (ID + 이름 매칭)
        const userName = currentUserName
        const userCatIds = new Set(cats.filter(c => c.users && c.users.includes(userName)).map(c => String(c.id)))
        const userCatNames = new Set(cats.filter(c => c.users && c.users.includes(userName)).map(c => c.name))
        const staffListData = getItem<any[]>('ws_users', [])
        const curStaff = staffListData.find(s => s.name === userName)
        const isApprover = curStaff?.approverType === 'approver'
        const approved = approvals.filter(a => {
          if (a.status !== 'approved') return false
          // 예산구분이 없는 항목은 지출대기에 표시하지 않음
          const aCatId = String((a as any).budgetCatId || '')
          const aCatName = (a as any).budgetCatName || ''
          if (!aCatId && !aCatName) return false
          // ID로 매칭
          if (aCatId && userCatIds.has(aCatId)) return true
          // 이름으로 매칭
          if (aCatName && userCatNames.has(aCatName)) return true
          // 승인자는 모든 항목 볼 수 있음
          if (isApprover) return true
          return false
        })
        if (approved.length === 0) return null
        const getCatName = (a: any) => {
          if (a.budgetCatName) return a.budgetCatName
          if (a.budgetCatId) {
            const cat = cats.find(c => String(c.id) === String(a.budgetCatId))
            return cat?.name || ''
          }
          return ''
        }
        return (
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)] bg-amber-50/50 dark:bg-amber-900/5">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-amber-500" />
                <span className="text-sm font-extrabold text-[var(--text-primary)]">지출대기 리스트</span>
                <span className="text-[10px] text-white bg-amber-500 px-2 py-0.5 rounded-full font-bold">{approved.length}건</span>
              </div>
              <span className="text-[11px] text-[var(--text-muted)]">승인된 품의를 클릭하면 지출 입력으로 이동합니다</span>
            </div>
            <div className="divide-y divide-[var(--border-default)]">
              {approved.map(a => (
                <div key={a.id} className="flex items-center gap-3 px-4 py-3 hover:bg-amber-50/30 dark:hover:bg-amber-900/5 transition-colors cursor-pointer group"
                  onClick={() => {
                    const aa = a as any
                    // 승인 시 설정된 예산목/세목 조회
                    const allBudgets: BudgetItem[] = getItem('acct_budgets', [])
                    let budgetItemName = aa.budgetItem || ''
                    let budgetSubItemName = aa.budgetSubItem || ''
                    if (aa.budgetItemId) {
                      const bi = allBudgets.find(b => String(b.id) === String(aa.budgetItemId))
                      if (bi) budgetItemName = bi.itemName || budgetItemName
                    }
                    if (aa.budgetSubId) {
                      const bs = allBudgets.find(b => String(b.id) === String(aa.budgetSubId))
                      if (bs) budgetSubItemName = bs.subItemName || bs.itemName || budgetSubItemName
                    }
                    // 예산 카테고리의 지출수단 자동 선택
                    const budgetCatsAll: BudgetCat[] = getItem('acct_budget_cats', [])
                    const matchedCat = aa.budgetCatId ? budgetCatsAll.find(c => String(c.id) === String(aa.budgetCatId)) : null
                    let autoMethod = ''
                    if (matchedCat?.accounts && matchedCat.accounts.length > 0) {
                      // 모든 계좌+카드 옵션 수집
                      const allPayOpts: string[] = []
                      matchedCat.accounts.forEach(acct => {
                        if (acct.bankName) allPayOpts.push(`계좌:${acct.bankName}`)
                        if (acct.cards) acct.cards.forEach(card => allPayOpts.push(`카드:${card}`))
                      })
                      // 1개면 자동선택, 복수면 선택하도록 빈값
                      if (allPayOpts.length === 1) autoMethod = allPayOpts[0]
                    }
                    setForm(f => ({
                      ...f,
                      desc: budgetItemName || a.title || a.description || '',
                      subItem: budgetSubItemName || '',
                      amount: a.amount ? a.amount.toLocaleString('ko-KR') : '',
                      counter: '',
                      tradeDate: today,
                      inputDate: today,
                      manager: a.applicant || '',
                      expenseManager: user?.name || '',
                      method: autoMethod,
                    }))
                    setIsFromApproval(true)
                    setSelectedApprovalId(String(a.id))
                    // 예산 항목에서 계정코드 조회 (정식 코드 우선)
                    let resolvedAcctCode = aa.accountCode || ''
                    if (aa.budgetItemId) {
                      const bi = allBudgets.find(b => String(b.id) === String(aa.budgetItemId))
                      if (bi?.accountCode) resolvedAcctCode = bi.accountCode
                    }
                    if (aa.budgetSubId) {
                      const bs = allBudgets.find(b => String(b.id) === String(aa.budgetSubId))
                      if (bs?.accountCode) resolvedAcctCode = bs.accountCode
                    }
                    // budgetItem 이름으로 예산 항목 조회하여 정식 계정코드 매칭
                    if (resolvedAcctCode && !resolvedAcctCode.includes('-') && budgetItemName) {
                      const matchedBi = allBudgets.find(b => b.itemName === budgetItemName)
                      if (matchedBi?.accountCode?.includes('-')) resolvedAcctCode = matchedBi.accountCode
                    }
                    setApprovalMeta({
                      approver: aa.approver || '-',
                      requestDate: (aa.date || aa.createdAt?.slice(0,10) || '-'),
                      approvedDate: (aa.approvedAt?.slice(0,10) || '-'),
                      budgetCatName: getCatName(a) || '-',
                      accountCode: resolvedAcctCode,
                      budgetCatId: aa.budgetCatId ? String(aa.budgetCatId) : undefined,
                    })
                    setDescMode('select')
                    setShowExpenseModal(true)
                  }}>
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                    <ShieldCheck size={14} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-bold text-[var(--text-primary)] truncate">{a.title || a.description || '(제목없음)'}</span>
                      {getCatName(a) && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400 font-bold whitespace-nowrap shrink-0">{getCatName(a)}</span>
                      )}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)]">
                      품의자: {a.applicant || '-'} · 승인자: {a.approver || '-'} · {a.date || a.createdAt?.slice(0,10) || '-'}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[14px] font-extrabold text-amber-600">{a.amount ? formatNumber(a.amount) : '0'}원</div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-600 dark:bg-green-900/20 font-bold">승인완료</span>
                  </div>
                  <div className="text-[var(--text-muted)] group-hover:text-primary-500 transition-colors shrink-0">
                    <ChevronDown size={14} className="-rotate-90" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* ── 내역 리스트 ── */}
      {(type !== 'expense' || expenseTab === 'history') && (
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-2">
            <ScrollText size={14} className="text-primary-500" />
            <span className="text-sm font-extrabold text-[var(--text-primary)]">{type === 'income' ? '입금' : '지출'} 내역</span>
            {type === 'withdrawal' && <span className="text-[9px] text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded font-bold">대체 포함</span>}
            <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-muted)] px-2 py-0.5 rounded-full">{cashflows.length}건</span>
          </div>
          <span className="text-[13px] font-extrabold" style={{ color: typeColors[type] }}>{formatNumber(totalAmount)}원</span>
        </div>
        {cashflows.length === 0 ? (
          <div className="p-6"><EmptyState emoji={typeEmojis[type]} title={`등록된 ${type === 'income' ? '입금' : '지출'}이 없습니다`} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="bg-[var(--bg-muted)]">
                  {['날짜', '내용', ...(type === 'income' ? ['입금내용'] : ['담당자', '품의상태']), '금액', '삭제'].map(h => (
                    <th key={h} className={cn('py-2.5 px-3.5 text-[11px] font-bold text-[var(--text-muted)]',
                      h === '금액' ? 'text-right' : h === '삭제' ? 'text-center w-[50px]' : h === '품의상태' ? 'text-center w-[80px]' : h === '담당자' ? 'text-center w-[70px]' : 'text-left')}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cashflows.map(c => (
                  <tr key={c.id} className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-muted)] transition-colors">
                    <td className="py-2.5 px-3.5 text-[12px] text-[var(--text-secondary)]">{c.date || ''}</td>
                    <td className="py-2.5 px-3.5 text-[12px] font-bold text-[var(--text-primary)]">{(c as any).type === 'transfer' ? '🔄 ' : ''}{c.description || '-'}{(c as any).type === 'transfer' && (c as any).counter && <span className="text-[10px] text-amber-600 ml-1">({(c as any).counter})</span>}</td>
                    {type === 'income' && (
                      <td className="py-2.5 px-3.5 text-[12px] text-[var(--text-secondary)]">{(c as any).incomeNote || '-'}</td>
                    )}
                    {type !== 'income' && (
                      <td className="py-2.5 px-3.5 text-[11px] text-center text-[var(--text-secondary)]">{(c as any).manager || '-'}</td>
                    )}
                    {type !== 'income' && (() => {
                      // 연결된 품의의 실제 진행상태 자동 표시
                      const sMap: Record<string, { label: string; color: string; bg: string }> = {
                        preExpense: { label: (c as any).type === 'transfer' ? '대체한' : '지출한', color: (c as any).type === 'transfer' ? '#8b5cf6' : '#f97316', bg: (c as any).type === 'transfer' ? 'rgba(139,92,246,.12)' : 'rgba(249,115,22,.12)' },
                        pending: { label: '품의한', color: '#3b82f6', bg: 'rgba(59,130,246,.12)' },
                        approved: { label: '승인', color: '#22c55e', bg: 'rgba(34,197,94,.12)' },
                        rejected: { label: '반려', color: '#ef4444', bg: 'rgba(239,68,68,.12)' },
                        expensed: { label: '지출', color: '#8b5cf6', bg: 'rgba(139,92,246,.12)' },
                        toResolve: { label: '결의', color: '#6366f1', bg: 'rgba(99,102,241,.12)' },
                        confirming: { label: '정산중', color: '#0ea5e9', bg: 'rgba(14,165,233,.12)' },
                        completed: { label: '완료', color: '#10b981', bg: 'rgba(16,185,129,.12)' },
                      }
                      let statusLabel = '미연결'
                      let statusColor = '#94a3b8'
                      let statusBg = 'rgba(148,163,184,.12)'
                      const allAp: any[] = getItem('acct_approvals', [])
                      let aId = (c as any).approvalId
                      // approvalId가 없으면 제목/금액으로 매칭 시도
                      if (!aId && c.description) {
                        const matched = allAp.find((a: any) =>
                          (a.title?.includes(c.description) || a.description?.includes(c.description)) && a.amount === c.amount
                        ) || allAp.find((a: any) =>
                          a.title?.includes(c.description)
                        )
                        if (matched) {
                          aId = String(matched.id)
                          // 자동 연결 저장
                          const allCfs = getItem<CashFlow[]>('acct_cashflows', [])
                          const ci = allCfs.findIndex(x => String(x.id) === String(c.id))
                          if (ci >= 0) { (allCfs[ci] as any).approvalId = aId; setItem('acct_cashflows', allCfs) }
                        }
                      }
                      if (aId) {
                        const linked = allAp.find((a: any) => String(a.id) === String(aId))
                        if (linked) {
                          const si = sMap[linked.status] || { label: linked.status, color: '#64748b', bg: 'rgba(100,116,139,.12)' }
                          statusLabel = si.label
                          statusColor = si.color
                          statusBg = si.bg
                        }
                      }
                      return (
                        <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: statusBg, color: statusColor }}>
                            {statusLabel}
                          </span>
                        </td>
                      )
                    })()}
                    <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-right" style={{ color: typeColors[type] }}>{formatNumber(c.amount || 0)}원</td>
                    <td className="py-2.5 px-3.5 text-center">
                      <button onClick={() => deleteEntry(c.id)} className="p-1 rounded-md bg-[rgba(239,68,68,.08)] text-[#ef4444] hover:bg-[rgba(239,68,68,.15)] cursor-pointer"><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* ═══ 지출등록 팝업 모달 (expense 전용) ═══ */}
      {type === 'expense' && showExpenseModal && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          {/* 오버레이 */}
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowExpenseModal(false)} />
          {/* 모달 콘텐츠 */}
          <div className="flex min-h-full items-center justify-center py-8 px-4">
          <div className="relative w-full max-w-2xl rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-2xl">
            {/* 모달 헤더 */}
            <div className={`bg-gradient-to-r ${typeGrads[type]} rounded-t-2xl p-4 text-white`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-xl">{typeEmojis[type]}</div>
                  <div>
                    <div className="text-[17px] font-extrabold">지출 등록</div>
                    <div className="text-[11.5px] opacity-85">승인된 품의의 지출 내역을 입력하세요</div>
                  </div>
                </div>
                <button onClick={() => setShowExpenseModal(false)} className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center cursor-pointer transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>
            {/* ── 상단: 품의 정보 (읽기전용) ── */}
            <div className="p-4 space-y-3 border-b border-[var(--border-default)] bg-amber-50/60 dark:bg-amber-900/5">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[11px] font-bold text-amber-600">📋 품의 정보</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
                <div>
                  <div className="text-[9.5px] font-bold text-[var(--text-muted)] mb-0.5">예산구분</div>
                  <div className="text-[12px] font-bold text-[var(--text-primary)]">{approvalMeta.budgetCatName || '-'}</div>
                </div>
                <div>
                  <div className="text-[9.5px] font-bold text-[var(--text-muted)] mb-0.5">예산목</div>
                  <div className="text-[12px] font-bold text-[var(--text-primary)]">{form.desc || '-'}</div>
                </div>
                <div>
                  <div className="text-[9.5px] font-bold text-[var(--text-muted)] mb-0.5">예산세목</div>
                  <div className="text-[12px] font-bold text-[var(--text-primary)]">{form.subItem || '-'}</div>
                </div>
                <div>
                  <div className="text-[9.5px] font-bold text-[var(--text-muted)] mb-0.5">계정과목</div>
                  <div className="text-[12px] font-bold text-primary-600">
                    {(() => {
                      const code = approvalMeta.accountCode
                      if (!code) return '-'
                      // 1) 정확한 코드 매칭
                      let found = acctAccounts.find(a => a.code === code)
                      // 2) 대시 제거 매칭
                      if (!found) found = acctAccounts.find(a => a.code.replace(/-/g, '') === code.replace(/-/g, ''))
                      // 3) 예산목 이름으로 매칭 (시드 데이터 호환)
                      if (!found && form.desc) found = acctAccounts.find(a => a.name === form.desc)
                      return found ? `${found.code} ${found.name}` : code
                    })()}
                  </div>
                </div>
                <div>
                  <div className="text-[9.5px] font-bold text-[var(--text-muted)] mb-0.5">금액</div>
                  <div className="text-[14px] font-extrabold text-[#ef4444]">{form.amount || '0'}원</div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 pt-1">
                <div>
                  <div className="text-[9.5px] font-bold text-[var(--text-muted)] mb-0.5">품의자</div>
                  <div className="text-[12px] text-[var(--text-secondary)]">{form.manager || '-'}</div>
                </div>
                <div>
                  <div className="text-[9.5px] font-bold text-[var(--text-muted)] mb-0.5">품의일</div>
                  <div className="text-[12px] text-[var(--text-secondary)]">{approvalMeta.requestDate || '-'}</div>
                </div>
                <div>
                  <div className="text-[9.5px] font-bold text-[var(--text-muted)] mb-0.5">승인자</div>
                  <div className="text-[12px] text-[var(--text-secondary)]">{approvalMeta.approver || '-'}</div>
                </div>
                <div>
                  <div className="text-[9.5px] font-bold text-[var(--text-muted)] mb-0.5">승인일</div>
                  <div className="text-[12px] text-[var(--text-secondary)]">{approvalMeta.approvedDate || '-'}</div>
                </div>
                <div>
                  <div className="text-[9.5px] font-bold text-[var(--text-muted)] mb-0.5">지출담당자</div>
                  <div className="text-[12px] font-bold text-primary-600">{user?.name || '-'}</div>
                </div>
              </div>
            </div>

            {/* ── 하단: 지출 입력 ── */}
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[11px] font-bold text-[var(--text-muted)]">✏️ 지출 입력</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 거래처 */}
                <div ref={counterRef} className="relative">
                  <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">거래처</label>
                  <input value={counterSearch || form.counter} onChange={e => { setCounterSearch(e.target.value); setShowCounterList(true); setForm(f => ({ ...f, counter: '' })) }}
                    onFocus={() => setShowCounterList(true)} placeholder="거래처명 검색..." className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none" />
                  {showCounterList && (
                    <div className="absolute z-[10000] left-0 right-0 top-full mt-1 max-h-[200px] overflow-y-auto rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-lg">
                      {vendorOptions
                        .filter(v => !counterSearch || v.label.toLowerCase().includes(counterSearch.toLowerCase()))
                        .map((v, i) => (
                          <button key={i} onClick={() => {
                            setForm(f => ({ ...f, counter: v.value }))
                            setCounterSearch('')
                            setShowCounterList(false)
                          }}
                            className="w-full text-left px-3 py-2 text-[13px] text-[var(--text-primary)] hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer border-none bg-transparent flex items-center justify-between">
                            <span>{v.label}</span>
                            {v.catName && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 font-bold ml-2 shrink-0">{v.catName}</span>}
                          </button>
                        ))}
                      {vendorOptions.filter(v => !counterSearch || v.label.toLowerCase().includes(counterSearch.toLowerCase())).length === 0 && (
                        <div className="px-3 py-2 text-[12px] text-[var(--text-muted)]">검색 결과가 없습니다</div>
                      )}
                    </div>
                  )}
                </div>
                {/* 지출수단 */}
                <div>
                  <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">지출수단</label>
                  {(() => {
                    // 품의 연동일 때 예산 카테고리의 실제 계좌/카드 목록 생성
                    const catIdVal = isFromApproval ? approvalMeta.budgetCatId : selectedBudgetCat
                    const payOptions: {value:string; label:string; group:string}[] = []
                    // 지출수단 관리에서 등록된 수단만 사용 (예산구분별 필터)
                    const allPM: PayMethodItem[] = (() => { try { return JSON.parse(localStorage.getItem('acct_pay_methods_v2') || '[]') } catch { return [] } })()
                    const filteredPMRaw = catIdVal
                      ? allPM.filter(p => String(p.budgetCatId) === String(catIdVal))
                      : allPM
                    // 같은 이름+카테고리 중복 제거
                    const seenPM = new Set<string>()
                    const filteredPM = filteredPMRaw.filter(p => {
                      const key = `${p.category}:${p.name}`
                      if (seenPM.has(key)) return false
                      seenPM.add(key)
                      return true
                    })
                    filteredPM.filter(p => p.category === '계좌').forEach(p => {
                      payOptions.push({ value: `계좌:${p.name}`, label: `🏦 ${p.name}${p.accountNumber ? ' • ' + p.accountNumber : ''}`, group: '계좌' })
                      if (p.cards) p.cards.forEach(card => {
                        payOptions.push({ value: `카드:${card.cardName || card.cardNumber}`, label: `💳 ${card.cardName || '카드'}${card.cardNumber ? ' ' + card.cardNumber : ''}`, group: '카드' })
                      })
                    })
                    filteredPM.filter(p => p.category === '현금').forEach(p => payOptions.push({ value: p.name, label: `💵 ${p.name}`, group: '현금' }))
                    filteredPM.filter(p => p.category === '어음').forEach(p => payOptions.push({ value: p.name, label: `📄 ${p.name}`, group: '어음' }))
                    filteredPM.filter(p => p.category === '상품권').forEach(p => payOptions.push({ value: p.name, label: `🎟️ ${p.name}`, group: '상품권' }))
                    return (
                      <select
                        value={form.method}
                        onChange={e => setForm(f => ({ ...f, method: e.target.value }))}
                        className="w-full px-2.5 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[12px] text-[var(--text-primary)] focus:outline-none focus:border-primary-500"
                      >
                        <option value="">— 선택 —</option>
                        {payOptions.filter(o => o.group === '계좌').length > 0 && (
                          <optgroup label="🏦 계좌">
                            {payOptions.filter(o => o.group === '계좌').map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </optgroup>
                        )}
                        {payOptions.filter(o => o.group === '카드').length > 0 && (
                          <optgroup label="💳 카드">
                            {payOptions.filter(o => o.group === '카드').map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </optgroup>
                        )}
                        {payOptions.filter(o => o.group === '현금').length > 0 && (
                          <optgroup label="💵 현금">
                            {payOptions.filter(o => o.group === '현금').map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </optgroup>
                        )}
                        {payOptions.filter(o => o.group === '어음').length > 0 && (
                          <optgroup label="📄 어음">
                            {payOptions.filter(o => o.group === '어음').map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </optgroup>
                        )}
                        {payOptions.filter(o => o.group === '상품권').length > 0 && (
                          <optgroup label="🎟️ 상품권">
                            {payOptions.filter(o => o.group === '상품권').map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </optgroup>
                        )}
                      </select>
                    )
                  })()}
                </div>
                {/* 실제거래일자 */}
                <div>
                  <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">실제거래일자</label>
                  <DatePicker value={form.tradeDate} onChange={v => setForm(f => ({ ...f, tradeDate: v }))} />
                </div>
                {/* 전표날짜 */}
                <div>
                  <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">전표날짜</label>
                  <DatePicker value={form.inputDate} onChange={v => setForm(f => ({ ...f, inputDate: v }))} />
                </div>
              </div>
              {/* 비고 */}
              <div>
                <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">비고</label>
                <textarea
                  value={(form as any).memo || ''}
                  onChange={e => setForm(f => ({ ...f, memo: e.target.value } as any))}
                  placeholder="참고 사항을 입력하세요"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none resize-none h-[56px]"
                />
              </div>
              {/* 버튼 */}
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => {
                  setShowExpenseModal(false)
                  setIsFromApproval(false)
                  setSelectedApprovalId(null)
                  setForm(f => ({ ...f, desc: '', subItem: '', amount: '', counter: '', manager: '', memo: '' } as any))
                }} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[var(--text-secondary)] text-sm font-bold cursor-pointer border border-[var(--border-default)] hover:bg-[var(--bg-muted)] transition-colors">
                  취소
                </button>
                <button onClick={() => { saveEntry(); setShowExpenseModal(false) }} className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white text-sm font-bold cursor-pointer shadow-md bg-gradient-to-r ${typeGrads[type]}`}>
                  <Save size={14} /> 지출 등록
                </button>
              </div>
            </div>
          </div>
          </div>
        </div>
      , document.body)}
    </div>
  )
}

/* ═══════════════════════════════════════════
   전표장부 (Payment Ledger) — CRUD
   ═══════════════════════════════════════════ */
function AcctPaymentLedger({ year, catId }: { year: number; catId?: string | null }) {
  const [refresh, setRefresh] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | number | null>(null)
  const [vmDate, setVmDate] = useState(new Date().toISOString().slice(0, 10))
  const [vmType, setVmType] = useState<'expense' | 'income' | 'transfer'>('expense')
  const [vmDesc, setVmDesc] = useState('')
  const [vmEntries, setVmEntries] = useState<{ side: string; accountCode: string; amount: string }[]>([
    { side: 'debit', accountCode: '', amount: '' },
    { side: 'credit', accountCode: '', amount: '' },
  ])

  const accounts = useMemo(() => getItem<{ code: string; name: string; type: string }[]>('acct_accounts', []), [])
  const budgetCats = useMemo(() => getItem<any[]>('acct_budget_cats', []), [])
  const cashflows = useMemo(() => getItem<any[]>('acct_cashflows', []), [refresh])

  const vouchers = useMemo(() => {
    const all = getItem<Voucher[]>('acct_vouchers', [])
    return all.filter(v => v.date && parseInt(v.date.substring(0, 4)) === year)
      .sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || '').localeCompare(a.createdAt || ''))
  }, [year, refresh])

  const incCnt = vouchers.filter(v => v.type === 'income').length
  const expCnt = vouchers.filter(v => v.type === 'expense').length
  const etcCnt = vouchers.length - incCnt - expCnt
  const [voucherTypeFilter, setVoucherTypeFilter] = useState<string>('')
  const [voucherBudgetFilter, setVoucherBudgetFilter] = useState<string>(catId && catId !== 'all' ? catId : '')

  // 헤더 예산 변경 시 동기화
  useEffect(() => {
    setVoucherBudgetFilter(catId && catId !== 'all' ? catId : '')
  }, [catId])

  // 기존 전표에 budgetCatId 마이그레이션
  useEffect(() => {
    const all = getItem<any[]>('acct_vouchers', [])
    const cfs = getItem<any[]>('acct_cashflows', [])
    let changed = false
    all.forEach((v: any) => {
      if (!v.budgetCatId && v.date && v.entries) {
        const totalAmt = Number((v.entries || []).reduce((s: number, e: any) => e.side === 'debit' ? s + Number(e.amount || 0) : s, 0))
        // 날짜+금액+타입 매칭
        const match = cfs.find((c: any) => {
          const cfDate = (c.date || c.writeDate || '').slice(0, 10)
          const vDate = (v.date || '').slice(0, 10)
          return cfDate === vDate && Number(c.amount) === totalAmt && c.budgetCatId
        })
        if (match) {
          v.budgetCatId = match.budgetCatId
          changed = true
        }
      }
    })
    if (changed) {
      setItem('acct_vouchers', all)
      setRefresh(r => r + 1)
    }
  }, [])

  const filteredVouchers = useMemo(() => {
    let list = vouchers
    if (voucherTypeFilter) {
      list = list.filter(v => {
        if (voucherTypeFilter === 'income') return v.type === 'income'
        if (voucherTypeFilter === 'expense') return v.type === 'expense'
        if (voucherTypeFilter === 'transfer') return v.type !== 'income' && v.type !== 'expense'
        return true
      })
    }
    if (voucherBudgetFilter) {
      // 직접 budgetCatId가 있으면 사용, 없으면 cashflow에서 매칭
      const cfMap = new Map<string, string>()
      cashflows.forEach((c: any) => {
        if (c.budgetCatId) {
          const key = `${(c.date || c.writeDate || '').slice(0,10)}_${Number(c.amount)}`
          cfMap.set(key, String(c.budgetCatId))
        }
      })
      list = list.filter(v => {
        const directCat = String((v as any).budgetCatId || '')
        if (directCat) return directCat === voucherBudgetFilter
        // 폴백: cashflow 매칭
        const totalAmt = (v.entries || []).reduce((s, e) => e.side === 'debit' ? s + Number(e.amount || 0) : s, 0)
        const key = `${(v.date || '').slice(0,10)}_${totalAmt}`
        return cfMap.get(key) === voucherBudgetFilter
      })
    }
    return list
  }, [vouchers, voucherTypeFilter, voucherBudgetFilter, cashflows])

  // 예산 필터만 적용 (유형 필터 제외) - 카드 카운트용
  const budgetBaseVouchers = useMemo(() => {
    if (!voucherBudgetFilter) return vouchers
    const cfMap = new Map<string, string>()
    cashflows.forEach((c: any) => {
      if (c.budgetCatId) {
        const key = `${(c.date || c.writeDate || '').slice(0,10)}_${Number(c.amount)}`
        cfMap.set(key, String(c.budgetCatId))
      }
    })
    return vouchers.filter(v => {
      const directCat = String((v as any).budgetCatId || '')
      if (directCat) return directCat === voucherBudgetFilter
      const totalAmt = (v.entries || []).reduce((s, e) => e.side === 'debit' ? s + Number(e.amount || 0) : s, 0)
      const key = `${(v.date || '').slice(0,10)}_${totalAmt}`
      return cfMap.get(key) === voucherBudgetFilter
    })
  }, [vouchers, voucherBudgetFilter, cashflows])
  const openModal = (id?: string | number) => {
    if (id) {
      const v = getItem<Voucher[]>('acct_vouchers', []).find(x => String(x.id) === String(id))
      if (v) {
        setEditId(id)
        setVmDate(v.date || new Date().toISOString().slice(0, 10))
        setVmType((v.type as 'expense' | 'income' | 'transfer') || 'expense')
        setVmDesc(v.description || '')
        setVmEntries((v.entries || []).map(e => ({
          side: e.side,
          accountCode: e.accountCode || '',
          amount: e.amount ? formatNumber(e.amount) : '',
        })))
      }
    } else {
      setEditId(null)
      setVmDate(new Date().toISOString().slice(0, 10))
      setVmType('expense')
      setVmDesc('')
      setVmEntries([
        { side: 'debit', accountCode: '', amount: '' },
        { side: 'credit', accountCode: '', amount: '' },
      ])
    }
    setModalOpen(true)
  }

  const addEntry = () => setVmEntries(prev => [...prev, { side: 'debit', accountCode: '', amount: '' }])
  const removeEntry = (idx: number) => setVmEntries(prev => prev.filter((_, i) => i !== idx))

  const saveVoucher = () => {
    if (!vmDesc.trim()) { alert('적요를 입력하세요'); return }
    const entries = vmEntries
      .map(e => ({ side: e.side, accountCode: e.accountCode, amount: parseInt(e.amount.replace(/,/g, '')) || 0 }))
      .filter(e => e.accountCode && e.amount > 0)
    if (entries.length < 2) { alert('차변/대변 항목을 최소 2개 입력하세요'); return }

    const all = getItem<Voucher[]>('acct_vouchers', [])
    if (editId) {
      const updated = all.map(v => String(v.id) === String(editId)
        ? { ...v, date: vmDate, type: vmType, description: vmDesc, entries }
        : v
      )
      setItem('acct_vouchers', updated)
    } else {
      all.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        date: vmDate, type: vmType, description: vmDesc, entries,
        createdAt: new Date().toISOString(),
      })
      setItem('acct_vouchers', all)
    }
    setModalOpen(false)
    setRefresh(r => r + 1)
  }

  const deleteVoucher = (id: string | number) => {
    if (!confirm('이 전표를 삭제하시겠습니까?')) return
    const all = getItem<Voucher[]>('acct_vouchers', []).filter(v => String(v.id) !== String(id))
    setItem('acct_vouchers', all)
    setRefresh(r => r + 1)
  }

  const typeColors: Record<string, string> = { income: '#22c55e', expense: '#ef4444', transfer: '#f59e0b' }
  const typeLabels: Record<string, string> = { income: '입금', expense: '출금', transfer: '대체' }
  const typeBgs: Record<string, string> = { income: 'rgba(34,197,94,.1)', expense: 'rgba(239,68,68,.1)', transfer: 'rgba(245,158,11,.1)' }

  return (
    <div className="space-y-4">
      {/* 요약 */}
      <div className="bg-gradient-to-r from-[#6366f1] to-[#4f6ef7] rounded-2xl p-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <BookOpen size={18} />
            </div>
            <div>
              <div className="text-[17px] font-extrabold">전표장부</div>
              <div className="text-[11.5px] opacity-85">모든 전표 조회·수정 (회계담당자용)</div>
            </div>
          </div>
          <button onClick={() => openModal()} className="flex items-center gap-1.5 px-3.5 py-2 bg-white/20 border border-white/40 rounded-xl text-[13px] font-bold cursor-pointer hover:bg-white/30 transition-colors">
            <Plus size={14} /> 등록
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: '총 전표', value: budgetBaseVouchers.length, bg: 'rgba(255,255,255,.18)', filter: '' },
            { label: '입금', value: budgetBaseVouchers.filter(v => v.type === 'income').length, bg: 'rgba(34,197,94,.2)', filter: 'income' },
            { label: '출금', value: budgetBaseVouchers.filter(v => v.type === 'expense').length, bg: 'rgba(239,68,68,.2)', filter: 'expense' },
            { label: '대체', value: budgetBaseVouchers.filter(v => v.type !== 'income' && v.type !== 'expense').length, bg: 'rgba(245,158,11,.2)', filter: 'transfer' },
          ].map(s => (
            <div key={s.label} onClick={() => setVoucherTypeFilter(voucherTypeFilter === s.filter ? '' : s.filter)} className={`rounded-xl p-2 text-center cursor-pointer transition-all ${voucherTypeFilter === s.filter ? 'ring-2 ring-white shadow-lg scale-[1.02]' : 'hover:bg-white/10'}`} style={{ background: s.bg }}>
              <div className="text-[9px] opacity-80">{s.label}</div>
              <div className="text-[16px] font-extrabold">{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 예산 필터 */}
      <div className="flex items-center gap-2">
        <select value={voucherBudgetFilter} onChange={e => setVoucherBudgetFilter(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)]">
          <option value="">전체 예산</option>
          {budgetCats.filter((c: any) => { const pf = c.periodFrom || ''; const pt = c.periodTo || ''; if (pf && pt) return pf <= `${year}-12-31` && pt >= `${year}-01-01`; return true }).map((c: any) => (
            <option key={c.id} value={String(c.id)}>{c.name}</option>
          ))}
        </select>
        {(voucherTypeFilter || voucherBudgetFilter) && (
          <button onClick={() => { setVoucherTypeFilter(''); setVoucherBudgetFilter('') }} className="px-2.5 py-2 rounded-lg bg-[var(--bg-muted)] text-[11px] font-bold text-[var(--text-muted)] hover:bg-primary-100 hover:text-primary-600 cursor-pointer transition-all whitespace-nowrap">✕ 초기화</button>
        )}
      </div>

      {/* 전표 목록 */}
      {filteredVouchers.length === 0 ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-8">
          <EmptyState emoji="📒" title={voucherTypeFilter || voucherBudgetFilter ? '해당 조건의 전표가 없습니다' : '등록된 전표가 없습니다'} />
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredVouchers.map(v => {
            let ds = 0, cs = 0
            ;(v.entries || []).forEach(e => { if (e.side === 'debit') ds += e.amount; else cs += e.amount })
            const tc = typeColors[v.type || ''] || '#8b5cf6'
            const tl = typeLabels[v.type || ''] || '대체'
            const tb = typeBgs[v.type || ''] || 'rgba(139,92,246,.1)'
            return (
              <div key={v.id} className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden" style={{ borderLeft: `4px solid ${tc}` }}>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[var(--text-muted)] font-semibold">{v.date || ''}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: tb, color: tc }}>{tl}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openModal(v.id)} className="p-1 rounded-md bg-[rgba(79,110,247,.1)] text-[#4f6ef7] hover:bg-[rgba(79,110,247,.2)] cursor-pointer"><Edit3 size={12} /></button>
                    <button onClick={() => deleteVoucher(v.id)} className="p-1 rounded-md bg-[rgba(239,68,68,.08)] text-[#ef4444] hover:bg-[rgba(239,68,68,.15)] cursor-pointer"><Trash2 size={12} /></button>
                  </div>
                </div>
                <div className="px-4 pb-3">
                  <div className="text-[14px] font-bold text-[var(--text-primary)] mb-2">{v.description || ''}</div>
                  <div className="bg-[var(--bg-muted)] rounded-lg p-2.5 space-y-1.5">
                    {(v.entries || []).map((e, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: e.side === 'debit' ? 'rgba(79,110,247,.12)' : 'rgba(239,68,68,.12)', color: e.side === 'debit' ? '#4f6ef7' : '#ef4444' }}>
                            {e.side === 'debit' ? '차변' : '대변'}
                          </span>
                          <span className="text-[12px] text-[var(--text-secondary)]">{e.accountCode}</span>
                        </div>
                        <span className="text-[12px] font-bold" style={{ color: e.side === 'debit' ? '#4f6ef7' : '#ef4444' }}>{formatNumber(e.amount)}원</span>
                      </div>
                    ))}
                    <div className="border-t border-[var(--border-default)] pt-1.5 flex justify-between">
                      <span className="text-[11px] font-bold text-[var(--text-muted)]">합계</span>
                      <span className="text-[13px] font-extrabold" style={{ color: tc }}>{formatNumber(ds)}원</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 전표 등록/수정 모달 */}
      {modalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center bg-black/40" onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="bg-[var(--bg-surface)] rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-[600px] mx-0 md:mx-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-default)]">
              <span className="text-sm font-extrabold text-[var(--text-primary)]">{editId ? '전표 수정' : '전표 등록'}</span>
              <button onClick={() => setModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">날짜 *</label>
                <DatePicker value={vmDate} onChange={setVmDate} />
              </div>
              <div>
                <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">유형</label>
                <div className="flex gap-2">
                  {(['expense', 'income', 'transfer'] as const).map(t => {
                    const active = vmType === t
                    const c = typeColors[t] || '#4f6ef7'
                    return (
                      <button key={t} onClick={() => setVmType(t)} className={cn('flex-1 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer transition-all border', active ? 'text-white' : 'text-[var(--text-muted)] border-[var(--border-default)] bg-[var(--bg-muted)]')} style={active ? { background: c, borderColor: c } : {}}>
                        {typeLabels[t] || t}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">적요 *</label>
                <input value={vmDesc} onChange={e => setVmDesc(e.target.value)} placeholder="거래 내용" className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none" />
              </div>
              <div>
                <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-2 block">차변 / 대변 항목</label>
                <div className="space-y-2">
                  {vmEntries.map((entry, idx) => (
                    <div key={idx} className="bg-[var(--bg-muted)] rounded-xl p-3 space-y-2 relative">
                      {idx >= 2 && (
                        <button onClick={() => removeEntry(idx)} className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded bg-[rgba(239,68,68,.1)] text-[#ef4444] cursor-pointer text-[10px]"><X size={10} /></button>
                      )}
                      <div className="flex gap-2">
                        <select value={entry.side} onChange={e => { const v = e.target.value; setVmEntries(prev => prev.map((en, i) => i === idx ? { ...en, side: v } : en)) }} className="w-[80px] px-2 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[12px] font-bold outline-none" style={{ color: entry.side === 'debit' ? '#4f6ef7' : '#ef4444' }}>
                          <option value="debit">차변</option>
                          <option value="credit">대변</option>
                        </select>
                        <select value={entry.accountCode} onChange={e => { const v = e.target.value; setVmEntries(prev => prev.map((en, i) => i === idx ? { ...en, accountCode: v } : en)) }} className="flex-1 px-2 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[12px] outline-none">
                          <option value="">계정과목 선택</option>
                          {accounts.map(a => <option key={a.code} value={a.code}>{a.code} {a.name}</option>)}
                        </select>
                      </div>
                      <input value={entry.amount} onChange={e => { const digits = e.target.value.replace(/[^\d]/g, ''); const formatted = digits ? Number(digits).toLocaleString('ko-KR') : ''; setVmEntries(prev => prev.map((en, i) => i === idx ? { ...en, amount: formatted } : en)) }} placeholder="금액" className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm font-bold text-right outline-none" />
                    </div>
                  ))}
                </div>
                <button onClick={addEntry} className="w-full mt-2 py-2.5 rounded-xl border border-dashed border-[var(--border-default)] text-[13px] font-semibold text-[var(--text-muted)] cursor-pointer hover:border-primary-400 hover:text-primary-500 transition-colors flex items-center justify-center gap-1.5">
                  <Plus size={14} /> 항목 추가
                </button>
              </div>
            </div>
            <div className="flex gap-2 px-5 py-3 border-t border-[var(--border-default)]">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-[var(--border-default)] text-sm font-semibold text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--bg-muted)]">취소</button>
              <button onClick={saveVoucher} className="flex-[2] py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f6ef7] text-white text-sm font-bold cursor-pointer shadow-md">저장</button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  )
}

/* ═══════════════════════════════════════════
   서브 페이지 플레이스홀더
   ═══════════════════════════════════════════ */
function AcctSubPlaceholder({ pageKey, label }: { pageKey: string; label: string }) {
  const descriptions: Record<string, string> = {
    budget: '예산구분별 연간 예산을 설정하고 소진 현황을 확인합니다',
    balance: '회계연도 초기 잔액을 설정합니다',
    approval: '품의서를 작성하고 결재 상태를 관리합니다',
    expense: '지출 전표를 등록하고 관리합니다',
    income: '입금 전표를 등록하고 관리합니다',
    withdrawal: '출금 전표를 등록하고 관리합니다',
    payment: '전체 전표 장부를 조회합니다',
    reports: '수입·지출 현황을 분석합니다',
  }

  const emojis: Record<string, string> = {
    budget: '💰', balance: '🏦', approval: '📋', expense: '💸',
    income: '💵', withdrawal: '🏧', payment: '📒', reports: '📊',
  }

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl py-16 text-center">
      <p className="text-4xl mb-3">{emojis[pageKey] || '🔧'}</p>
      <p className="text-base font-bold text-[var(--text-primary)]">{label}</p>
      <p className="text-[12px] text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
        {descriptions[pageKey] || '이 기능은 준비 중입니다.'}
      </p>
      <p className="text-[11px] text-[var(--text-muted)] mt-4 bg-[var(--bg-muted)] inline-block px-4 py-1.5 rounded-full">
        Phase 4에서 구현 예정
      </p>
    </div>
  )
}

/* ═══════════════════════════════════════════
   거래처관리 — CRUD
   ═══════════════════════════════════════════ */
interface Vendor {
  id: number
  /* 기본정보 */
  name: string
  zipCode?: string
  address1?: string
  address2?: string
  phone?: string
  /* 연락처정보 */
  ceoName?: string
  ceoPhone?: string
  managerName?: string
  managerRole?: string
  managerPhone?: string
  managerEmail?: string
  managerId?: string
  managerPw?: string
  /* 사업자정보 */
  bizNo?: string
  bizType?: string
  bizCategory?: string
  invoiceEmail?: string
  bizRegImage?: string
  /* 비고 */
  memo?: string
  /* 예산구분 연결 */
  budgetCatId?: string
  /* 하위 호환 */
  address?: string
}

const EMPTY_VENDOR: Omit<Vendor, 'id'> = {
  name: '', zipCode: '', address1: '', address2: '', phone: '',
  ceoName: '', ceoPhone: '', managerName: '', managerRole: '', managerPhone: '', managerEmail: '', managerId: '', managerPw: '',
  bizNo: '', bizType: '', bizCategory: '', invoiceEmail: '', bizRegImage: '',
  memo: '', budgetCatId: '',
}

/* 섹션 헤더 */
function SectionHeader({ icon, title, color }: { icon: string; title: string; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-1">
      <span className="text-sm">{icon}</span>
      <span className="text-[12px] font-extrabold tracking-tight" style={{ color }}>{title}</span>
      <div className="flex-1 h-px bg-[var(--border-default)]" />
    </div>
  )
}

/* 필드 */
function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">
        {label}{required && ' *'}
      </label>
      {children}
    </div>
  )
}

const inputCls = "w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors"

/* 자동 하이픈 포맷터 */
function fmtPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.startsWith('02')) {
    if (d.length <= 2) return d
    if (d.length <= 6) return `${d.slice(0, 2)}-${d.slice(2)}`
    return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6)}`
  }
  if (d.length <= 3) return d
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`
}

function fmtBizNo(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 10)
  if (d.length <= 3) return d
  if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`
}

function VendorRow({ v, idx, onView, onEdit, onDelete }: { v: any; idx: number; onView: (v: any) => void; onEdit: (v: any) => void; onDelete: (id: number) => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <tr className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-muted)] transition-colors cursor-pointer" onClick={() => onView(v)}>
      <td className="px-4 py-3 text-center text-[12px] text-[var(--text-muted)]">{idx + 1}</td>
      <td className="px-4 py-3">
        <div className="font-bold text-[13px] text-[var(--text-primary)]">{v.name}</div>
        {v.bizNo && <div className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">{v.bizNo}</div>}
      </td>
      <td className="px-4 py-3 text-[13px] text-[var(--text-primary)]">{v.ceoName || '-'}</td>
      <td className="px-4 py-3">
        {v.phone && <div className="text-[12px] text-[var(--text-primary)]">{v.phone}</div>}
        {v.managerName && <div className="text-[11px] text-[var(--text-muted)] mt-0.5">담당: {v.managerName}</div>}
      </td>
      <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
        <div className="relative inline-block">
          <button onClick={e => { e.stopPropagation(); setMenuOpen(o => !o) }} className="p-1.5 rounded-lg hover:bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer transition-colors">
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-xl py-1 min-w-[100px]">
                <button onClick={() => { setMenuOpen(false); onEdit(v) }} className="flex items-center gap-2 w-full px-3 py-2 text-[12px] text-[var(--text-primary)] hover:bg-[var(--bg-muted)] cursor-pointer">
                  <Edit3 size={12} /> 수정
                </button>
                <button onClick={() => { setMenuOpen(false); onDelete(v.id) }} className="flex items-center gap-2 w-full px-3 py-2 text-[12px] text-danger hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer">
                  <Trash2 size={12} /> 삭제
                </button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}

function AcctVendors() {
  const [refresh, setRefresh] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<Omit<Vendor, 'id'>>(EMPTY_VENDOR)
  const [viewVendor, setViewVendor] = useState<Vendor | null>(null)

  const vendors = useMemo(() => {
    const all = getItem<Vendor[]>('acct_vendors', [])
    if (!search.trim()) return all
    const q = search.trim().toLowerCase()
    return all.filter(v =>
      v.name.toLowerCase().includes(q) ||
      v.bizNo?.toLowerCase().includes(q) ||
      v.ceoName?.toLowerCase().includes(q) ||
      v.managerName?.toLowerCase().includes(q)
    )
  }, [refresh, search])

  const openAdd = () => {
    setEditId(null)
    setForm({ ...EMPTY_VENDOR })
    setModalOpen(true)
  }

  const openEdit = (v: Vendor) => {
    setEditId(v.id)
    setForm({
      name: v.name, zipCode: v.zipCode || '', address1: v.address1 || v.address || '', address2: v.address2 || '', phone: v.phone || '',
      ceoName: v.ceoName || '', ceoPhone: v.ceoPhone || '',
      managerName: v.managerName || '', managerRole: v.managerRole || '', managerPhone: v.managerPhone || '',
      managerEmail: v.managerEmail || '', managerId: v.managerId || '', managerPw: v.managerPw || '',
      bizNo: v.bizNo || '', bizType: v.bizType || '', bizCategory: v.bizCategory || '',
      invoiceEmail: v.invoiceEmail || '', bizRegImage: v.bizRegImage || '', memo: v.memo || '',
      budgetCatId: v.budgetCatId || '',
    })
    setModalOpen(true)
  }

  const openView = (v: Vendor) => {
    setViewVendor(v)
    setViewOpen(true)
  }

  const saveVendor = () => {
    if (!form.name.trim()) { alert('거래처명을 입력하세요'); return }
    const all = getItem<Vendor[]>('acct_vendors', [])
    if (editId) {
      const updated = all.map(v => v.id === editId ? { ...v, ...form } : v)
      setItem('acct_vendors', updated)
    } else {
      all.push({ id: Date.now(), ...form })
      setItem('acct_vendors', all)
    }
    setModalOpen(false)
    setRefresh(r => r + 1)
  }

  const deleteVendor = (id: number) => {
    if (!confirm('이 거래처를 삭제하시겠습니까?')) return
    const all = getItem<Vendor[]>('acct_vendors', []).filter(v => v.id !== id)
    setItem('acct_vendors', all)
    setRefresh(r => r + 1)
  }

  /* ── 공통 스타일 ── */
  const sectionCard = "bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl overflow-hidden"
  const sectionTitle = "flex items-center gap-2 px-5 py-3 border-b border-[var(--border-default)] bg-[var(--bg-muted)]"
  const inpCls2 = "w-full px-3 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)] text-[13px] text-[var(--text-primary)] focus:border-primary-400 outline-none transition-colors"
  const lbl = "block text-[10px] font-bold text-[var(--text-muted)] mb-1"

  /* ── 등록/수정 폼 ── */
  const renderForm = () => (
    <div className="flex gap-4 h-full">
      {/* 좌: 메인 폼 */}
      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {/* 기본 정보 */}
        <div className={sectionCard}>
          <div className={sectionTitle}>
            <span className="text-[11px]">🏢</span>
            <span className="text-[12px] font-extrabold text-[#4f6ef7]">기본 정보</span>
          </div>
          <div className="p-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>◎ 거래처명 *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="(주)한국전자" className={inpCls2} />
              </div>
              <div>
                <label className={lbl}>◎ 대표자</label>
                <input value={form.ceoName} onChange={e => setForm(f => ({ ...f, ceoName: e.target.value }))} placeholder="김대표" className={inpCls2} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>◎ 대표전화</label>
                <input value={form.ceoPhone} onChange={e => setForm(f => ({ ...f, ceoPhone: fmtPhone(e.target.value) }))} placeholder="010-0000-0000" className={inpCls2} maxLength={13} />
              </div>
              <div>
                <label className={lbl}>◎ 사업자번호</label>
                <input value={form.bizNo} onChange={e => setForm(f => ({ ...f, bizNo: fmtBizNo(e.target.value) }))} placeholder="000-00-00000" className={inpCls2} maxLength={12} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>업태</label>
                <input value={form.bizType} onChange={e => setForm(f => ({ ...f, bizType: e.target.value }))} placeholder="제조, 서비스" className={inpCls2} />
              </div>
              <div>
                <label className={lbl}>종목</label>
                <input value={form.bizCategory} onChange={e => setForm(f => ({ ...f, bizCategory: e.target.value }))} placeholder="전자부품" className={inpCls2} />
              </div>
            </div>
            <div>
              <label className={lbl}>◎ 세금계산서 이메일</label>
              <input type="email" value={form.invoiceEmail} onChange={e => setForm(f => ({ ...f, invoiceEmail: e.target.value }))} placeholder="tax@example.com" className={inpCls2} />
            </div>
            <div>
              <label className={lbl}>전화번호</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: fmtPhone(e.target.value) }))} placeholder="02-0000-0000" className={inpCls2} maxLength={13} />
            </div>
            <div>
              <label className={lbl}>사업장주소</label>
              <div className="flex gap-2 mb-2">
                <input value={form.zipCode} readOnly placeholder="우편번호" className={`${inpCls2} flex-1 bg-[var(--bg-muted)]`} />
                <button type="button" onClick={() => { const dp = (window as any).daum?.Postcode; if (!dp) { alert('우편번호 검색 서비스를 불러오는 중입니다...'); return } new dp({ oncomplete: (d: any) => setForm(f => ({ ...f, zipCode: d.zonecode, address1: d.roadAddress || d.jibunAddress })) }).open() }} className="px-4 py-2 rounded-xl bg-primary-500 text-white text-[12px] font-bold cursor-pointer shrink-0 hover:bg-primary-600 transition-colors">검색</button>
              </div>
              <input value={form.address1} readOnly placeholder="주소" className={`${inpCls2} bg-[var(--bg-muted)] mb-2`} />
              <input value={form.address2} onChange={e => setForm(f => ({ ...f, address2: e.target.value }))} placeholder="상세주소를 입력하세요" className={inpCls2} />
            </div>
          </div>
        </div>

        {/* 담당자 정보 */}
        <div className={sectionCard}>
          <div className={sectionTitle}>
            <span className="text-[11px]">👤</span>
            <span className="text-[12px] font-extrabold text-[#22c55e]">담당자 정보</span>
          </div>
          <div className="p-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>◎ 담당자 이름</label>
                <input value={form.managerName} onChange={e => setForm(f => ({ ...f, managerName: e.target.value }))} placeholder="박담당" className={inpCls2} />
              </div>
              <div>
                <label className={lbl}>직함</label>
                <input value={form.managerRole || ''} onChange={e => setForm(f => ({ ...f, managerRole: e.target.value }))} placeholder="예) 팀장/사장" className={inpCls2} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>◈ 휴대폰</label>
                <input value={form.managerPhone} onChange={e => setForm(f => ({ ...f, managerPhone: fmtPhone(e.target.value) }))} placeholder="010-0000-0000" className={inpCls2} maxLength={13} />
              </div>
              <div>
                <label className={lbl}>✉ 이메일</label>
                <input type="email" value={form.managerEmail || ''} onChange={e => setForm(f => ({ ...f, managerEmail: e.target.value }))} placeholder="email@example.com" className={inpCls2} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>◎ 아이디(ID)</label>
                <input value={form.managerId || ''} onChange={e => setForm(f => ({ ...f, managerId: e.target.value }))} placeholder="system_id" className={inpCls2} />
              </div>
              <div>
                <label className={lbl}>🔒 비밀번호</label>
                <input type="password" value={form.managerPw || ''} onChange={e => setForm(f => ({ ...f, managerPw: e.target.value }))} placeholder="•••" className={inpCls2} />
              </div>
            </div>
          </div>
        </div>

        {/* 비고 */}
        <div className={sectionCard}>
          <div className={sectionTitle}>
            <span className="text-[11px]">📝</span>
            <span className="text-[12px] font-extrabold text-[#8b5cf6]">비고</span>
          </div>
          <div className="p-5">
            <textarea value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))} placeholder="기타 참고 사항을 입력하세요" rows={3} className={`${inpCls2} resize-none`} />
          </div>
        </div>
      </div>

      {/* 우: 사업자등록증 */}
      <div className="w-[200px] shrink-0">
        <div className={sectionCard}>
          <div className={sectionTitle}>
            <span className="text-[11px]">📄</span>
            <span className="text-[12px] font-extrabold text-[var(--text-secondary)]">사업자등록증</span>
          </div>
          <div className="p-4 space-y-3">
            <div className="min-h-[180px] rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-muted)] flex items-center justify-center overflow-hidden">
              {form.bizRegImage ? (
                form.bizRegImage.startsWith('data:image') ? (
                  <div className="relative group w-full h-full">
                    <img src={form.bizRegImage} alt="사업자등록증" className="w-full h-full object-contain" />
                    <button type="button" onClick={() => setForm(f => ({ ...f, bizRegImage: '' }))} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[9px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">✕</button>
                  </div>
                ) : (
                  <a href={form.bizRegImage} target="_blank" rel="noopener" className="text-[11px] text-primary-500 font-semibold">📄 PDF 보기</a>
                )
              ) : (
                <div className="text-center text-[var(--text-muted)]">
                  <div className="text-2xl mb-1">📄</div>
                  <div className="text-[10px]">등록된 사업자등록증이 없습니다</div>
                </div>
              )}
            </div>
            <label className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-muted)] cursor-pointer hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
              <span className="text-[11px] text-[var(--text-muted)] font-bold">⬆ 업로드</span>
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 5*1024*1024) { alert('5MB 이하'); return } const r = new FileReader(); r.onload = () => setForm(f => ({ ...f, bizRegImage: r.result as string })); r.readAsDataURL(file) }} />
            </label>
          </div>
        </div>
      </div>
    </div>
  )

  /* ── 조회 렌더 ── */
  const renderView = (v: Vendor) => {
    const Row = ({ label, value }: { label: string; value?: string }) => (
      <div className="flex py-2 border-b border-[var(--border-default)] last:border-0">
        <span className="text-[11px] font-bold text-[var(--text-muted)] w-24 shrink-0 self-center">{label}</span>
        <span className="text-[13px] text-[var(--text-primary)] flex-1">{value || '-'}</span>
      </div>
    )
    return (
      <div className="flex gap-4">
        {/* 좌: 정보 */}
        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {/* 기본 정보 */}
          <div className={sectionCard}>
            <div className={sectionTitle}>
              <span className="text-[11px]">🏢</span>
              <span className="text-[12px] font-extrabold text-[#4f6ef7]">기본 정보</span>
            </div>
            <div className="px-5 py-1">
              <Row label="거래처명" value={v.name} />
              <Row label="사업자번호" value={v.bizNo} />
              <Row label="대표자" value={v.ceoName} />
              <Row label="대표전화" value={v.ceoPhone} />
              <Row label="전화번호" value={v.phone} />
              <Row label="업태" value={v.bizType} />
              <Row label="종목" value={v.bizCategory} />
              <Row label="이메일" value={v.invoiceEmail} />
              <Row label="우편번호" value={v.zipCode} />
              <Row label="주소" value={[v.address1 || v.address, v.address2].filter(Boolean).join(' ') || undefined} />
            </div>
          </div>

          {/* 담당자 정보 */}
          <div className={sectionCard}>
            <div className={sectionTitle}>
              <span className="text-[11px]">👤</span>
              <span className="text-[12px] font-extrabold text-[#22c55e]">담당자 정보</span>
            </div>
            <div className="px-5 py-1">
              <Row label="담당자명" value={v.managerName} />
              <Row label="직함" value={v.managerRole} />
              <Row label="휴대폰" value={v.managerPhone} />
              <Row label="이메일" value={v.managerEmail} />
              <Row label="아이디" value={v.managerId} />
            </div>
          </div>

          {/* 비고 */}
          <div className={sectionCard}>
            <div className={sectionTitle}>
              <span className="text-[11px]">📝</span>
              <span className="text-[12px] font-extrabold text-[#8b5cf6]">비고</span>
            </div>
            <div className="px-5 py-3">
              <p className="text-[13px] text-[var(--text-primary)] whitespace-pre-wrap">{v.memo || '-'}</p>
            </div>
          </div>
        </div>

        {/* 우: 사업자등록증 */}
        <div className="w-[200px] shrink-0">
          <div className={sectionCard}>
            <div className={sectionTitle}>
              <span className="text-[11px]">📄</span>
              <span className="text-[12px] font-extrabold text-[var(--text-secondary)]">사업자등록증</span>
            </div>
            <div className="p-4">
              <div className="min-h-[220px] rounded-xl border border-[var(--border-default)] bg-[var(--bg-muted)] flex items-center justify-center overflow-hidden">
                {v.bizRegImage ? (
                  v.bizRegImage.startsWith('data:image') ? (
                    <img src={v.bizRegImage} alt="사업자등록증" className="w-full object-contain cursor-pointer" onClick={() => window.open(v.bizRegImage, '_blank')} />
                  ) : (
                    <a href={v.bizRegImage} target="_blank" rel="noopener" className="text-[11px] text-primary-500 font-semibold">📄 PDF 보기</a>
                  )
                ) : (
                  <div className="text-center text-[var(--text-muted)]">
                    <div className="text-2xl mb-1">📄</div>
                    <div className="text-[10px]">등록된 사업자등록증이 없습니다</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }


  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-[#6366f1] to-[#4f6ef7] rounded-2xl p-4 text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-xl">🏢</div>
          <div>
            <div className="text-[17px] font-extrabold">거래처관리</div>
            <div className="text-[11.5px] opacity-85">거래처 정보를 등록하고 관리합니다</div>
          </div>
        </div>
      </div>

      {/* 검색 + 등록 버튼 */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="거래처명, 사업자번호, 대표자, 담당자 검색..."
            className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none pl-9"
          />
          <ContactRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f6ef7] text-white text-sm font-bold cursor-pointer shadow-md shrink-0">
          <Plus size={14} /> 거래처 등록
        </button>
      </div>

      {/* 거래처 목록 - 테이블 형태 */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
          <span className="text-sm font-extrabold text-[var(--text-primary)]">거래처 목록</span>
          <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-muted)] px-2 py-0.5 rounded-full">{vendors.length}건</span>
        </div>
        {vendors.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-3xl mb-2">🏢</p>
            <p className="text-sm text-[var(--text-muted)]">등록된 거래처가 없습니다</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-[var(--bg-muted)] border-b border-[var(--border-default)]">
                  <th className="px-4 py-3 text-[11px] font-bold text-[var(--text-muted)] text-center w-12">No</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-[var(--text-muted)] text-left">거래처명</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-[var(--text-muted)] text-left w-28">대표자</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-[var(--text-muted)] text-left w-44">연락처</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-[var(--text-muted)] text-center w-16">관리</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((v, idx) => (
                  <VendorRow key={v.id} v={v} idx={idx} onView={openView} onEdit={openEdit} onDelete={deleteVendor} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 등록/수정 모달 (넓은 중앙) ── */}
      {modalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4" onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="bg-[var(--bg-base)] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col animate-scaleIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)] bg-[var(--bg-surface)] rounded-t-2xl shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                  <ContactRound size={16} className="text-primary-500" />
                </div>
                <span className="text-sm font-extrabold text-[var(--text-primary)]">{editId ? '거래처 수정' : '거래처 등록'}</span>
              </div>
              <button onClick={() => setModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer transition-colors"><X size={18} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {renderForm()}
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-[var(--border-default)] bg-[var(--bg-surface)] rounded-b-2xl shrink-0">
              <button onClick={() => setModalOpen(false)} className="px-6 py-2.5 rounded-xl border border-[var(--border-default)] text-sm font-semibold text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--bg-muted)] transition-colors">취소</button>
              <button onClick={saveVendor} className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f6ef7] text-white text-sm font-bold cursor-pointer shadow-md hover:shadow-lg transition-shadow flex items-center gap-1.5">
                <Save size={14} /> {editId ? '수정' : '등록'}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* ── 조회 모달 (넓은 중앙) ── */}
      {viewOpen && viewVendor && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4" onClick={e => { if (e.target === e.currentTarget) setViewOpen(false) }}>
          <div className="bg-[var(--bg-base)] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col animate-scaleIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)] bg-[var(--bg-surface)] rounded-t-2xl shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                  <ContactRound size={16} className="text-primary-500" />
                </div>
                <span className="text-sm font-extrabold text-[var(--text-primary)]">거래처 상세</span>
              </div>
              <button onClick={() => setViewOpen(false)} className="w-8 h-8 rounded-lg hover:bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer transition-colors"><X size={18} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {renderView(viewVendor)}
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-[var(--border-default)] bg-[var(--bg-surface)] rounded-b-2xl shrink-0">
              <button onClick={() => setViewOpen(false)} className="px-6 py-2.5 rounded-xl border border-[var(--border-default)] text-sm font-semibold text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--bg-muted)] transition-colors">닫기</button>
              <button onClick={() => { setViewOpen(false); openEdit(viewVendor) }} className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f6ef7] text-white text-sm font-bold cursor-pointer shadow-md hover:shadow-lg transition-shadow flex items-center gap-1.5">
                <Edit3 size={14} /> 수정
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════
   계정관리 (AcctAccountsMgmt)
   ═══════════════════════════════════════════ */
type AcctAccount = { code: string; name: string; type: string; group?: string; source?: 'system' | 'user'; side?: 'debit' | 'credit'; description?: string; active?: boolean; incomeEnabled?: boolean }
const ACCT_TYPES = [
  { value: 'asset', label: '자산', color: '#4f6ef7' },
  { value: 'liability', label: '부채', color: '#ef4444' },
  { value: 'equity', label: '자본', color: '#8b5cf6' },
  { value: 'revenue', label: '수익', color: '#22c55e' },
  { value: 'expense', label: '비용', color: '#f59e0b' },
]
const DEBIT_TYPES = ['asset', 'expense']
/* 차감계정(contra accounts): 자산이지만 대변 / 수익이지만 차변 */
const CONTRA_CREDIT_CODES = new Set([
  '1-01-08',  // 대손충당금
  '1-02-03',  // 건물감가상각누계액
  '1-02-05',  // 구축물감가상각누계액
  '1-02-07',  // 기계장치감가상각누계액
  '1-02-09',  // 차량운반구감가상각누계액
  '1-02-11',  // 비품감가상각누계액
  '1-02-13',  // 소프트웨어상각누계액
])
const CONTRA_DEBIT_CODES = new Set([
  '4-01-04',  // 매출에누리및환입
])
const getDebitCredit = (type: string, code?: string, sideOverride?: string) => {
  /* 사용자가 직접 지정한 side가 있으면 최우선 */
  if (sideOverride === 'debit') return { label: '차변', color: '#4f6ef7' }
  if (sideOverride === 'credit') return { label: '대변', color: '#ef4444' }
  /* 차감계정 예외 */
  if (code && CONTRA_CREDIT_CODES.has(code)) return { label: '대변', color: '#ef4444' }
  if (code && CONTRA_DEBIT_CODES.has(code)) return { label: '차변', color: '#4f6ef7' }
  return DEBIT_TYPES.includes(type) ? { label: '차변', color: '#4f6ef7' } : { label: '대변', color: '#ef4444' }
}
const SYSTEM_CODES = new Set([
  '1-01-01','1-01-02','1-01-03','1-01-04','1-01-05','1-01-06','1-01-07','1-01-08','1-01-09','1-01-10',
  '1-01-11','1-01-12','1-01-13','1-01-14','1-01-15','1-01-16','1-01-17','1-01-18','1-01-19',
  '1-02-01','1-02-02','1-02-03','1-02-04','1-02-05','1-02-06','1-02-07','1-02-08','1-02-09','1-02-10',
  '1-02-11','1-02-12','1-02-13','1-02-14','1-02-15','1-02-16','1-02-17','1-02-18',
  '2-01-01','2-01-02','2-01-03','2-01-04','2-01-05','2-01-06','2-01-07','2-01-08','2-01-09','2-01-10','2-01-11','2-01-12',
  '2-02-01','2-02-02','2-02-03','2-02-04',
  '3-01-01','3-01-02','3-02-01','3-02-02','3-03-01','3-03-02','3-03-03','3-03-04',
  '4-01-01','4-01-02','4-01-03','4-01-04','4-02-01','4-02-02','4-02-03','4-02-04','4-02-05','4-02-06','4-02-07',
  '5-01-01','5-01-02','5-01-03','5-01-04','5-01-05','5-01-06',
  '5-02-01','5-02-02','5-02-03','5-02-04','5-02-05','5-02-06','5-02-07','5-02-08','5-02-09','5-02-10',
  '5-02-11','5-02-12','5-02-13','5-02-14','5-02-15','5-02-16','5-02-17','5-02-18','5-02-19','5-02-20',
  '5-02-21','5-02-22','5-02-23','5-02-24','5-02-25','5-02-26',
  '5-03-01','5-03-02','5-03-03','5-03-04','5-03-05','5-03-06',
  '5-04-01',
])

function AcctAccountsMgmt() {
  const [refresh, setRefresh] = useState(0)
  const accounts = useMemo(() => {
    const raw = getItem<AcctAccount[]>('acct_accounts', [])
    return raw.map(a => ({ ...a, source: a.source || (SYSTEM_CODES.has(a.code) ? 'system' as const : 'user' as const) }))
  }, [refresh])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [editModal, setEditModal] = useState(false)
  const [editTarget, setEditTarget] = useState<AcctAccount | null>(null)
  const [form, setForm] = useState({ code: '', name: '', type: 'expense', group: '', side: 'debit' as 'debit' | 'credit' })
  const [collapsedTypes, setCollapsedTypes] = useState<Record<string, boolean>>({})
  const toggleType = (type: string) => setCollapsedTypes(prev => ({ ...prev, [type]: !prev[type] }))
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})
  const toggleGroup = (key: string) => setCollapsedGroups(prev => ({ ...prev, [key]: !prev[key] }))
  const [contraPopupCode, setContraPopupCode] = useState<string | null>(null)
  const [groupModal, setGroupModal] = useState(false)
  const [groupForm, setGroupForm] = useState({ type: '', name: '' })
  const openGroupAdd = (type: string) => {
    setGroupForm({ type, name: '' })
    setGroupModal(true)
  }
  const handleGroupSave = () => {
    if (!groupForm.name.trim()) return
    // 빈 계정을 하나 추가하여 그룹이 나타나도록 함 (그룹은 계정의 group 필드로 존재)
    const all = getItem<AcctAccount[]>('acct_accounts', [])
    const typePrefixMap: Record<string, string> = { asset: '1', liability: '2', equity: '3', revenue: '4', expense: '5' }
    const prefix = typePrefixMap[groupForm.type] || '9'
    // 해당 타입에서 사용 가능한 중분류 번호 찾기
    const usedMids = all.filter(a => a.type === groupForm.type).map(a => { const p = a.code.split('-'); return parseInt(p[1], 10) || 0 })
    const maxMid = usedMids.length > 0 ? Math.max(...usedMids) : 0
    const newMid = String(maxMid + 1).padStart(2, '0')
    const newCode = `${prefix}-${newMid}-01`
    all.push({ code: newCode, name: `${groupForm.name.trim()} (기본)`, type: groupForm.type, group: groupForm.name.trim(), source: 'user' })
    setItem('acct_accounts', all)
    setGroupModal(false)
    setRefresh(r => r + 1)
  }

  /* 자동 코드 생성: 해당 그룹의 마지막 코드 + 1 */
  const generateNextCode = (type: string, group: string) => {
    const all = getItem<AcctAccount[]>('acct_accounts', [])
    const sameGroup = all.filter(a => a.type === type && a.group === group).sort((a, b) => a.code.localeCompare(b.code))
    if (sameGroup.length === 0) {
      // 그룹의 중분류 코드 추출 시도
      const typePrefixMap: Record<string, string> = { asset: '1', liability: '2', equity: '3', revenue: '4', expense: '5' }
      const prefix = typePrefixMap[type] || '9'
      return `${prefix}-99-01`
    }
    const lastCode = sameGroup[sameGroup.length - 1].code
    const parts = lastCode.split('-')
    if (parts.length === 3) {
      const nextNum = (parseInt(parts[2], 10) || 0) + 1
      return `${parts[0]}-${parts[1]}-${String(nextNum).padStart(2, '0')}`
    }
    return ''
  }

  const filtered = useMemo(() => {
    let list = accounts
    if (filterType !== 'all') list = list.filter(a => a.type === filterType)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(a => a.code.includes(q) || a.name.toLowerCase().includes(q) || (a.group || '').toLowerCase().includes(q))
    }
    return list.sort((a, b) => a.code.localeCompare(b.code))
  }, [accounts, filterType, search])

  const typeGrouped = useMemo(() => {
    const typeOrder = ACCT_TYPES.map(t => t.value)
    const result: { type: string; label: string; color: string; groups: { groupName: string; items: AcctAccount[] }[] }[] = []
    const typeMap: Record<string, Record<string, AcctAccount[]>> = {}
    filtered.forEach(a => {
      const t = a.type || 'expense'
      const g = a.group || '기타'
      if (!typeMap[t]) typeMap[t] = {}
      if (!typeMap[t][g]) typeMap[t][g] = []
      typeMap[t][g].push(a)
    })
    typeOrder.forEach(t => {
      if (!typeMap[t]) return
      const ti = ACCT_TYPES.find(x => x.value === t)!
      const groups = Object.entries(typeMap[t]).map(([gn, items]) => ({ groupName: gn, items: items.sort((a, b) => a.code.localeCompare(b.code)) }))
      result.push({ type: t, label: ti.label, color: ti.color, groups })
    })
    Object.keys(typeMap).filter(t => !typeOrder.includes(t)).forEach(t => {
      const groups = Object.entries(typeMap[t]).map(([gn, items]) => ({ groupName: gn, items: items.sort((a, b) => a.code.localeCompare(b.code)) }))
      result.push({ type: t, label: t, color: '#6b7280', groups })
    })
    return result
  }, [filtered])

  const openAdd = (preType?: string, preGroup?: string) => {
    setEditTarget(null)
    const t = preType || 'expense'
    const g = preGroup || ''
    const defaultSide = DEBIT_TYPES.includes(t) ? 'debit' : 'credit'
    const autoCode = g ? generateNextCode(t, g) : ''
    setForm({ code: autoCode, name: '', type: t, group: g, side: defaultSide as 'debit' | 'credit' })
    setEditModal(true)
  }
  const openEdit = (a: AcctAccount) => {
    setEditTarget(a)
    const dc = getDebitCredit(a.type, a.code)
    const currentSide = dc.label === '차변' ? 'debit' : 'credit'
    setForm({ code: a.code, name: a.name, type: a.type, group: a.group || '', side: currentSide as 'debit' | 'credit' })
    setEditModal(true)
  }
  const handleSave = () => {
    if (!form.code.trim() || !form.name.trim()) return
    const all = getItem<AcctAccount[]>('acct_accounts', [])
    if (editTarget) {
      const updated = all.map(a => a.code === editTarget.code ? { ...a, name: form.name.trim(), type: form.type, group: form.group.trim(), side: form.side } : a)
      setItem('acct_accounts', updated)
    } else {
      if (all.some(a => a.code === form.code.trim())) return
      all.push({ code: form.code.trim(), name: form.name.trim(), type: form.type, group: form.group.trim(), source: 'user', side: form.side })
      setItem('acct_accounts', all)
    }
    setEditModal(false)
    setRefresh(r => r + 1)
  }
  const handleDelete = (code: string) => {
    const all = getItem<AcctAccount[]>('acct_accounts', [])
    setItem('acct_accounts', all.filter(a => a.code !== code))
    setRefresh(r => r + 1)
  }

  const [acctTab, setAcctTab] = useState<'all' | 'income'>('all')

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* ── 탭 ── */}
      <div className="flex items-center gap-1 bg-[var(--bg-muted)] rounded-xl p-1 border border-[var(--border-default)] w-fit">
        <button onClick={() => setAcctTab('all')}
          className={cn('flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-bold transition-all cursor-pointer',
            acctTab === 'all' ? 'bg-primary-500 text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]')}>
          <Settings2 size={13} /> 전체계정
        </button>
        <button onClick={() => setAcctTab('income')}
          className={cn('flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-bold transition-all cursor-pointer',
            acctTab === 'income' ? 'bg-emerald-500 text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]')}>
          <TrendingUp size={13} /> 입금계정
        </button>
      </div>

      {acctTab === 'all' ? (
      <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 size={18} className="text-primary-500" />
          <span className="text-base font-extrabold text-[var(--text-primary)]">계정과목 관리</span>
          <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-muted)] px-2 py-0.5 rounded-full">{filtered.length}개</span>
          <span className="mx-1 text-[var(--border-default)]">|</span>
          <span className="flex items-center gap-1 text-[10px] font-bold text-[#4f6ef7]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4f6ef7]" />차변
            <span className="text-[9px] font-normal text-[var(--text-muted)] ml-0.5">= 자산·비용 증가</span>
          </span>
          <span className="flex items-center gap-1 text-[10px] font-bold text-[#ef4444]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />대변
            <span className="text-[9px] font-normal text-[var(--text-muted)] ml-0.5">= 부채·자본·수익 증가</span>
          </span>
        </div>
        <button onClick={() => openAdd()} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary-500 text-white text-[12px] font-bold cursor-pointer hover:bg-primary-600 transition-colors shadow-sm">
          <Plus size={14} /> 계정 추가
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="코드, 과목명, 그룹 검색..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] outline-none focus:border-primary-400" />
        </div>
        <div className="flex items-center gap-1 bg-[var(--bg-muted)] rounded-lg p-0.5 border border-[var(--border-default)]">
          <button onClick={() => setFilterType('all')} className={cn('px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer', filterType === 'all' ? 'bg-primary-500 text-white shadow-sm' : 'text-[var(--text-muted)]')}>전체</button>
          {ACCT_TYPES.map(t => (
            <button key={t.value} onClick={() => setFilterType(t.value)} className={cn('px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer', filterType === t.value ? 'text-white shadow-sm' : 'text-[var(--text-muted)]')} style={filterType === t.value ? { background: t.color } : {}}>{t.label}</button>
          ))}
        </div>
      </div>

      {typeGrouped.length === 0 ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-8">
          <EmptyState emoji="📋" title="등록된 계정과목이 없습니다" />
        </div>
      ) : (
        <div className="space-y-2">
          {typeGrouped.map(ts => {
            const collapsed = collapsedTypes[ts.type]
            const cnt = ts.groups.reduce((s, g) => s + g.items.length, 0)
            const dc = getDebitCredit(ts.type)
            return (
              <div key={ts.type} className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
                <button onClick={() => toggleType(ts.type)}
                  className="w-full px-4 py-3 flex items-center gap-2 cursor-pointer hover:bg-[var(--bg-muted)] transition-colors border-b border-[var(--border-default)]"
                  style={{ background: `${ts.color}06` }}>
                  <ChevronDown size={14} className={cn('transition-transform shrink-0', collapsed && '-rotate-90')} style={{ color: ts.color }} />
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: ts.color }} />
                  <span className="text-[13px] font-extrabold text-[var(--text-primary)]">{ts.label}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">{cnt}</span>
                  <div className="flex-1" />
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full w-[36px] text-center shrink-0" style={{ color: dc.color, background: `${dc.color}12` }}>{dc.label}</span>
                  <span onClick={e => { e.stopPropagation(); openGroupAdd(ts.type) }}
                    className="text-[10px] font-bold text-primary-500 hover:text-primary-600 flex items-center gap-0.5 cursor-pointer w-[80px] justify-end shrink-0">
                    <Plus size={11} /> 그룹 추가
                  </span>
                </button>
                {!collapsed && ts.groups.map(grp => {
                  const grpKey = `${ts.type}:${grp.groupName}`
                  const grpCollapsed = collapsedGroups[grpKey]
                  return (
                  <div key={grp.groupName}>
                    <div className="px-4 py-1.5 bg-[var(--bg-muted)] border-b border-[var(--border-default)] flex items-center gap-2 cursor-pointer hover:bg-[var(--bg-muted)]/80 transition-colors"
                      onClick={() => toggleGroup(grpKey)}>
                      <ChevronDown size={11} className={cn('transition-transform shrink-0 text-[var(--text-muted)]', grpCollapsed && '-rotate-90')} />
                      <span className="text-[11px] font-bold text-[var(--text-secondary)]">{grp.groupName}</span>
                      <span className="text-[9px] text-[var(--text-muted)]">{grp.items.length}건</span>
                      <div className="flex-1" />
                      <button onClick={e => { e.stopPropagation(); openAdd(ts.type, grp.groupName) }}
                        className="text-[10px] font-bold text-primary-500 hover:text-primary-600 flex items-center gap-0.5 cursor-pointer w-[80px] justify-end shrink-0">+ 소과목 추가</button>
                    </div>
                    {!grpCollapsed && grp.items.map(a => {
                      const isSys = a.source === 'system' || SYSTEM_CODES.has(a.code)
                      const dc2 = getDebitCredit(a.type, a.code, a.side)
                      const isDebitSide = dc2.label === '차변'

                      // 자주 사용되는 상대계정 우선순위 매핑
                      const frequentContraMap: Record<string, string[]> = {
                        // 자산 계정의 빈번한 상대계정
                        'asset': ['4-01-01', '4-01-02', '4-01-03', '2-01-01', '2-01-04', '2-01-06', '2-01-08', '2-01-09', '3-03-03',
                                  '5-02-01', '5-02-04', '5-02-05', '5-02-06', '5-02-07', '5-02-08', '5-02-09', '5-02-10',
                                  '5-02-12', '5-02-14', '5-02-15', '5-02-21', '5-02-22', '5-02-24', '5-02-25',
                                  '1-01-01', '1-01-03'],
                        // 부채 계정의 빈번한 상대계정
                        'liability': ['1-01-01', '1-01-03', '1-01-06', '1-01-07', '1-01-10', '5-02-01', '5-02-03'],
                        // 자본 계정의 빈번한 상대계정
                        'equity': ['1-01-01', '1-01-03', '1-01-04'],
                        // 수익 계정의 빈번한 상대계정
                        'revenue': ['1-01-01', '1-01-03', '1-01-06', '1-01-07', '1-01-10'],
                        // 비용 계정의 빈번한 상대계정
                        'expense': ['1-01-01', '1-01-03', '2-01-04', '2-01-08', '1-01-12'],
                      }
                      const priorityCodes = new Set(frequentContraMap[a.type] || [])

                      // 상대계정 후보 + 우선순위 정렬 (비활성 계정 제외)
                      const contraTypes = isDebitSide ? ['liability', 'equity', 'revenue', 'asset', 'expense'] : ['asset', 'expense', 'liability', 'revenue']
                      const contraAll = accounts.filter(ca => ca.code !== a.code && contraTypes.includes(ca.type) && ca.active !== false)
                      const contraList = [
                        ...contraAll.filter(ca => priorityCodes.has(ca.code)),
                        ...contraAll.filter(ca => !priorityCodes.has(ca.code))
                      ].slice(0, 60)

                      const showContraPopup = contraPopupCode === a.code
                      return (
                        <div key={a.code} className={cn("flex items-center gap-2 px-4 py-2 border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-muted)] transition-colors group relative", a.active === false && 'opacity-40')}>
                          <button
                            onClick={() => {
                              const all = getItem<AcctAccount[]>('acct_accounts', [])
                              const updated = all.map(x => x.code === a.code ? { ...x, active: a.active === false ? true : false } : x)
                              setItem('acct_accounts', updated)
                              setRefresh(r => r + 1)
                            }}
                            className={cn('w-[32px] h-[16px] rounded-full transition-colors shrink-0 cursor-pointer relative', a.active === false ? 'bg-gray-300 dark:bg-gray-600' : 'bg-emerald-500')}
                            title={a.active === false ? '비활성 — 클릭하여 활성화' : '활성 — 클릭하여 비활성화'}
                          >
                            <span className={cn('absolute top-[2px] w-[12px] h-[12px] rounded-full bg-white shadow-sm transition-all', a.active === false ? 'left-[2px]' : 'left-[18px]')} />
                          </button>
                          <span className={cn("text-[12px] font-mono font-bold w-[80px] shrink-0", a.active === false ? 'text-[var(--text-muted)]' : 'text-primary-500')}>{a.code}</span>
                          <span
                            className="text-[12px] font-bold text-[var(--text-primary)] w-[140px] shrink-0 truncate cursor-pointer hover:text-primary-500 hover:underline transition-colors"
                            onClick={() => setContraPopupCode(showContraPopup ? null : a.code)}
                            title="클릭하여 상대계정 목록 보기"
                          >{a.name}</span>
                          <input
                            defaultValue={a.description || ''}
                            placeholder="설명 입력..."
                            onBlur={e => {
                              const val = e.target.value.trim()
                              if (val !== (a.description || '')) {
                                const all = getItem<AcctAccount[]>('acct_accounts', [])
                                const updated = all.map(x => x.code === a.code ? { ...x, description: val } : x)
                                setItem('acct_accounts', updated)
                              }
                            }}
                            onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                            className="flex-1 text-[11px] text-[var(--text-muted)] bg-transparent border-0 outline-none px-1 py-0.5 rounded hover:bg-[var(--bg-muted)] focus:bg-[var(--bg-surface)] focus:ring-1 focus:ring-primary-300 transition-all placeholder:text-[var(--text-muted)]/40"
                          />
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded w-[36px] text-center shrink-0" style={{ color: dc2.color, background: `${dc2.color}12` }}>{dc2.label}</span>
                          <span className="w-[52px] shrink-0 text-center">
                            {isSys ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--bg-muted)] text-[var(--text-muted)]">◇ 시스템</span>
                            ) : (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded text-green-600 dark:text-green-400" style={{ background: 'rgba(34,197,94,.12)' }}>◆ 사용자</span>
                            )}
                          </span>
                          {!isSys ? (
                            <div className="flex items-center gap-0.5 w-[52px] shrink-0 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEdit(a)} className="p-1 rounded text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer transition-colors"><Edit3 size={12} /></button>
                              <button onClick={() => handleDelete(a.code)} className="p-1 rounded text-[#ef4444] hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors"><Trash2 size={12} /></button>
                            </div>
                          ) : (
                            <div className="w-[52px] shrink-0" />
                          )}
                          {/* 상대계정 팝업 — 상황별 분개 */}
                          {showContraPopup && (() => {
                            // 상황 설명 생성 함수
                            const getSituation = (main: typeof a, contra: typeof a) => {
                              const mt = main.type; const ct = contra.type
                              if (mt === 'asset' && ct === 'revenue') return `${contra.name} 발생 → ${main.name} 입금`
                              if (mt === 'asset' && ct === 'liability') return `${contra.name} 발생/증가`
                              if (mt === 'asset' && ct === 'equity') return `${contra.name} 출자/증자`
                              if (mt === 'asset' && ct === 'asset') return `${contra.name}에서 ${main.name}으로 이동`
                              if (mt === 'asset' && ct === 'expense') return `${contra.name} 지급 시`
                              if (mt === 'expense' && ct === 'asset') return `${contra.name}에서 출금`
                              if (mt === 'expense' && ct === 'liability') return `${contra.name}으로 미지급 처리`
                              if (mt === 'liability' && ct === 'asset') return `${contra.name}으로 상환`
                              if (mt === 'liability' && ct === 'expense') return `${contra.name} 비용 정산`
                              if (mt === 'revenue' && ct === 'asset') return `${contra.name}으로 수령`
                              if (mt === 'equity' && ct === 'asset') return `${contra.name}으로 배당/감자`
                              return `${contra.name} 거래`
                            }
                            // 헤더 상황 텍스트
                            const headerText = (() => {
                              switch (a.type) {
                                case 'asset': return `💰 ${a.name}(이/가) 들어올 때 · 나갈 때`
                                case 'expense': return `📤 ${a.name}(을/를) 지출할 때`
                                case 'liability': return `📥 ${a.name}(이/가) 발생 · 상환할 때`
                                case 'revenue': return `💵 ${a.name}(이/가) 발생할 때`
                                case 'equity': return `🏦 ${a.name}(이/가) 변동할 때`
                                default: return `${a.name} 거래 시`
                              }
                            })()
                            return (
                            <div className="absolute left-[86px] top-full mt-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-2xl z-50 w-[460px] overflow-hidden"
                              style={{ maxHeight: '420px' }}>
                              {/* 헤더 */}
                              <div className="px-3 py-2.5 border-b border-[var(--border-default)] bg-[var(--bg-muted)]/50 flex items-center justify-between">
                                <div>
                                  <div className="text-[12px] font-bold text-[var(--text-primary)]">{headerText}</div>
                                  <div className="text-[9px] text-[var(--text-muted)] mt-0.5 font-mono">{a.code} · {a.group}</div>
                                </div>
                                <button onClick={() => setContraPopupCode(null)} className="p-1 rounded hover:bg-[var(--bg-muted)] text-[var(--text-muted)] cursor-pointer">
                                  <X size={14} />
                                </button>
                              </div>
                              {/* 테이블 헤더 */}
                              <div className="flex border-b border-[var(--border-default)]">
                                <div className="w-[120px] shrink-0 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/10">
                                  <span className="text-[10px] font-bold text-[#4f6ef7]">차변 (Debit)</span>
                                </div>
                                <div className="w-[120px] shrink-0 px-3 py-1.5 bg-red-50 dark:bg-red-900/10 border-l border-[var(--border-default)]">
                                  <span className="text-[10px] font-bold text-[#ef4444]">대변 (Credit)</span>
                                </div>
                                <div className="flex-1 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/10 border-l border-[var(--border-default)]">
                                  <span className="text-[10px] font-bold text-amber-600">상황 설명</span>
                                </div>
                              </div>
                              {/* 동기 스크롤 본문 */}
                              <div className="max-h-[300px] overflow-y-auto">
                                {contraList.map(ca => (
                                  <div key={ca.code} className="flex items-center border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-muted)]/50 transition-colors">
                                    <div className="w-[120px] shrink-0 px-3 py-1.5">
                                      {isDebitSide ? (
                                        <div className="text-[10px] font-bold text-[#4f6ef7] truncate">{a.name}</div>
                                      ) : (
                                        <div className="text-[10px] font-bold text-[#4f6ef7] truncate">{ca.name}</div>
                                      )}
                                    </div>
                                    <div className="w-[120px] shrink-0 px-3 py-1.5 border-l border-[var(--border-default)]">
                                      {isDebitSide ? (
                                        <div className="text-[10px] font-bold text-[#ef4444] truncate">{ca.name}</div>
                                      ) : (
                                        <div className="text-[10px] font-bold text-[#ef4444] truncate">{a.name}</div>
                                      )}
                                    </div>
                                    <div className="flex-1 px-3 py-1.5 border-l border-[var(--border-default)]">
                                      <div className="text-[10px] text-[var(--text-secondary)] truncate">{getSituation(a, ca)}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            )
                          })()}
                        </div>
                      )
                    })}
                  </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {editModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setEditModal(false)}>
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-2xl w-[420px] max-w-[90vw]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-default)]">
              <span className="text-[14px] font-extrabold text-[var(--text-primary)]">{editTarget ? '계정과목 수정' : '계정과목 추가'}</span>
              <button onClick={() => setEditModal(false)} className="p-1 rounded-lg hover:bg-[var(--bg-muted)] cursor-pointer transition-colors"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">계정코드 *</label>
                  <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="예) 5-02-26"
                    className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none font-mono" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">과목명 *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="예) 회의비"
                    className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">구분</label>
                  <div className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-sm text-[var(--text-secondary)] font-bold">
                    {ACCT_TYPES.find(t => t.value === form.type)?.label || form.type}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">그룹</label>
                  <div className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-sm text-[var(--text-secondary)] font-bold truncate">
                    {form.group || '-'}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">차대변 분류</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setForm(f => ({ ...f, side: 'debit' }))}
                    className={cn('flex-1 px-3 py-2.5 rounded-lg border text-sm font-bold transition-all cursor-pointer',
                      form.side === 'debit' ? 'border-[#4f6ef7] bg-[#4f6ef7]/10 text-[#4f6ef7]' : 'border-[var(--border-default)] text-[var(--text-muted)] hover:bg-[var(--bg-muted)]')}>
                    차변 (Debit)
                  </button>
                  <button type="button" onClick={() => setForm(f => ({ ...f, side: 'credit' }))}
                    className={cn('flex-1 px-3 py-2.5 rounded-lg border text-sm font-bold transition-all cursor-pointer',
                      form.side === 'credit' ? 'border-[#ef4444] bg-[#ef4444]/10 text-[#ef4444]' : 'border-[var(--border-default)] text-[var(--text-muted)] hover:bg-[var(--bg-muted)]')}>
                    대변 (Credit)
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-muted)]">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded text-green-600 dark:text-green-400" style={{ background: 'rgba(34,197,94,.12)' }}>◆ 사용자</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-[var(--border-default)]">
              <button onClick={() => setEditModal(false)} className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer">취소</button>
              <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-bold hover:bg-primary-600 transition-colors cursor-pointer">저장</button>
            </div>
          </div>
        </div>
      , document.body)}

      {groupModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setGroupModal(false)}>
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-2xl w-[360px] max-w-[90vw]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-default)]">
              <span className="text-[14px] font-extrabold text-[var(--text-primary)]">그룹 추가</span>
              <button onClick={() => setGroupModal(false)} className="p-1 rounded-lg hover:bg-[var(--bg-muted)] cursor-pointer transition-colors"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">구분</label>
                <div className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-sm text-[var(--text-secondary)] font-bold">
                  {ACCT_TYPES.find(t => t.value === groupForm.type)?.label || groupForm.type}
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">그룹명 *</label>
                <input value={groupForm.name} onChange={e => setGroupForm(f => ({ ...f, name: e.target.value }))} placeholder="예) 기타자산, 영업비용..."
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleGroupSave()}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none" />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-[var(--border-default)]">
              <button onClick={() => setGroupModal(false)} className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer">취소</button>
              <button onClick={handleGroupSave} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-bold hover:bg-primary-600 transition-colors cursor-pointer">추가</button>
            </div>
          </div>
        </div>
      , document.body)}
      </>
      ) : (
      /* ── 입금계정 탭 ── */
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-emerald-500" />
          <span className="text-base font-extrabold text-[var(--text-primary)]">입금계정 관리</span>
          <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-muted)] px-2 py-0.5 rounded-full">
            {accounts.filter(a => a.incomeEnabled).length} / {accounts.length}개 활성
          </span>
        </div>
        <div className="text-[11px] text-[var(--text-muted)] bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2">
          💡 스위치를 켜면 해당 계정이 <span className="font-bold text-emerald-600">입금전표</span>의 입금내용 선택 시 나타납니다.
        </div>
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="계정 검색..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] outline-none focus:border-emerald-400" />
        </div>
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--border-default)] bg-[var(--bg-muted)]">
            <span className="w-[40px] text-[10px] font-bold text-[var(--text-muted)] text-center">사용</span>
            <span className="w-[80px] text-[10px] font-bold text-[var(--text-muted)]">코드</span>
            <span className="flex-1 text-[10px] font-bold text-[var(--text-muted)]">계정과목명</span>
            <span className="w-[80px] text-[10px] font-bold text-[var(--text-muted)]">구분</span>
            <span className="w-[100px] text-[10px] font-bold text-[var(--text-muted)]">그룹</span>
          </div>
          {/* 목록 */}
          <div className="max-h-[500px] overflow-y-auto">
            {accounts
              .filter(a => {
                if (search.trim()) {
                  const q = search.toLowerCase()
                  return a.code.includes(q) || a.name.toLowerCase().includes(q) || (a.group || '').toLowerCase().includes(q)
                }
                return true
              })
              .sort((a, b) => {
                // incomeEnabled 우선, 그다음 코드순
                if ((a as any).incomeEnabled && !(b as any).incomeEnabled) return -1
                if (!(a as any).incomeEnabled && (b as any).incomeEnabled) return 1
                return a.code.localeCompare(b.code)
              })
              .map(a => {
                const isEnabled = (a as any).incomeEnabled === true
                const typeInfo = ACCT_TYPES.find(t => t.value === a.type)
                return (
                  <div key={a.code} className={cn("flex items-center gap-3 px-4 py-2.5 border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-muted)] transition-colors", !isEnabled && 'opacity-50')}>
                    <button
                      onClick={() => {
                        const all = getItem<AcctAccount[]>('acct_accounts', [])
                        const updated = all.map(x => x.code === a.code ? { ...x, incomeEnabled: !isEnabled } : x)
                        setItem('acct_accounts', updated)
                        setRefresh(r => r + 1)
                      }}
                      className={cn('w-[36px] h-[18px] rounded-full transition-colors shrink-0 cursor-pointer relative', isEnabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600')}
                      title={isEnabled ? '입금전표에 표시됨 — 클릭하여 해제' : '비활성 — 클릭하여 입금전표에 표시'}
                    >
                      <span className={cn('absolute top-[3px] w-[12px] h-[12px] rounded-full bg-white shadow-sm transition-all', isEnabled ? 'left-[21px]' : 'left-[3px]')} />
                    </button>
                    <span className={cn("text-[12px] font-mono font-bold w-[80px] shrink-0", isEnabled ? 'text-emerald-600' : 'text-[var(--text-muted)]')}>{a.code}</span>
                    <span className={cn("text-[12px] font-bold flex-1", isEnabled ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]')}>{a.name}</span>
                    <span className="w-[80px] shrink-0">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ color: typeInfo?.color || '#6b7280', background: `${typeInfo?.color || '#6b7280'}12` }}>{typeInfo?.label || a.type}</span>
                    </span>
                    <span className="w-[100px] text-[11px] text-[var(--text-muted)] truncate">{a.group || '-'}</span>
                  </div>
                )
              })}
          </div>
        </div>
      </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════
   본사거래처 (AcctHQVendor) - 리스트 + 모달
   ═══════════════════════════════════════════ */
interface HQV { id: number; company: string; ceo: string; ceoPhone: string; bizPhone: string; bizNo: string; bizType: string; bizItem: string; taxEmail: string; zip: string; addr1: string; addr2: string; mgrName: string; mgrTitle: string; mgrMobile: string; mgrEmail: string; mgrId: string; mgrPw: string; bizDocImg: string; solutions: { key: string; label: string; enabled: boolean; qty?: number }[]; billings: { period: string; total: string; status: string }[]; totalBill: number; unpaid: number; memo: string }

const HQ_BILLINGS_1 = [{period:'2026.05.01~',mgmt:'150,000',db:'250,000',data:'523,221',fee:'595,000',total:'1,518,221',status:'과금중'},{period:'2026.03.01-2026.03.31',mgmt:'200,000',db:'250,000',data:'49,800',fee:'480,000',total:'979,800',status:'청구'},{period:'2026.02.01-2026.02.28',mgmt:'200,000',db:'280,000',data:'52,100',fee:'520,000',total:'1,052,100',status:'납부'},{period:'2026.01.01-2026.01.31',mgmt:'200,000',db:'250,000',data:'48,200',fee:'500,000',total:'998,200',status:'납부'}]
const HQ_BILLINGS_2 = [{period:'2026.05.01~',mgmt:'150,000',db:'250,000',data:'523,221',fee:'595,000',total:'1,518,221',status:'과금중'},{period:'2026.03.01-2026.03.31',mgmt:'200,000',db:'250,000',data:'49,800',fee:'480,000',total:'979,800',status:'청구'},{period:'2026.02.01-2026.02.28',mgmt:'200,000',db:'280,000',data:'52,100',fee:'520,000',total:'1,052,100',status:'납부'},{period:'2026.01.01-2026.01.31',mgmt:'200,000',db:'250,000',data:'48,200',fee:'500,000',total:'998,200',status:'납부'}]
const HQ_BILLINGS_3 = [{period:'2026.05.01~',mgmt:'200,000',db:'300,000',data:'623,221',fee:'700,000',total:'1,823,221',status:'과금중'},{period:'2026.03.01-2026.03.31',mgmt:'200,000',db:'250,000',data:'49,800',fee:'480,000',total:'979,800',status:'청구'},{period:'2026.02.01-2026.02.28',mgmt:'200,000',db:'280,000',data:'52,100',fee:'520,000',total:'1,052,100',status:'납부'},{period:'2026.01.01-2026.01.31',mgmt:'200,000',db:'250,000',data:'48,200',fee:'500,000',total:'998,200',status:'납부'}]

const HQ_SEED: HQV[] = [
  { id:1, company:'(주)한국솔루션', ceo:'김대표', ceoPhone:'010-1234-5678', bizPhone:'02-1234-5678', bizNo:'123-45-67890', bizType:'서비스', bizItem:'소프트웨어', taxEmail:'tax@ksol.co.kr', zip:'06134', addr1:'서울특별시 강남구 테헤란로 152', addr2:'강남파이낸스센터 3층', mgrName:'이지훈', mgrTitle:'팀장', mgrMobile:'010-1111-2222', mgrEmail:'lee@ksol.co.kr', mgrId:'system_id', mgrPw:'***', bizDocImg:'', solutions:[{key:'workm',label:'워크맵',enabled:true},{key:'homepage',label:'홈페이지',enabled:true,qty:1},{key:'fabric',label:'원단공급사',enabled:true},{key:'mfg',label:'제조공급사',enabled:false},{key:'dist',label:'유통판매서',enabled:false},{key:'franchise',label:'가맹대리점',enabled:false},{key:'food',label:'식재대리점',enabled:false}], billings:HQ_BILLINGS_1, totalBill:1590721, unpaid:979800, memo:'' },
  { id:2, company:'대명테크(주)', ceo:'박사장', ceoPhone:'010-3333-4444', bizPhone:'02-9878-5432', bizNo:'234-55-78901', bizType:'제조', bizItem:'전자부품', taxEmail:'bill@dmtech.kr', zip:'08500', addr1:'서울특별시 금천구 가산디지털로 123', addr2:'대명빌딩 5층', mgrName:'최수민', mgrTitle:'과장', mgrMobile:'010-5555-6666', mgrEmail:'choi@dmtech.kr', mgrId:'dm_admin', mgrPw:'***', bizDocImg:'', solutions:[{key:'workm',label:'워크맵',enabled:true},{key:'homepage',label:'홈페이지',enabled:false},{key:'fabric',label:'원단공급사',enabled:false},{key:'mfg',label:'제조공급사',enabled:false},{key:'dist',label:'유통판매서',enabled:false},{key:'franchise',label:'가맹대리점',enabled:false},{key:'food',label:'식재대리점',enabled:false}], billings:HQ_BILLINGS_2, totalBill:1518221, unpaid:979800, memo:'' },
  { id:3, company:'서울유통(주)', ceo:'정회장', ceoPhone:'010-7777-8888', bizPhone:'02-5555-6666', bizNo:'345-67-89012', bizType:'도매', bizItem:'생활용품', taxEmail:'tax@seouldt.com', zip:'04100', addr1:'서울특별시 중구 세종대로 110', addr2:'2층 203호', mgrName:'강민아', mgrTitle:'대리', mgrMobile:'010-9999-0000', mgrEmail:'kang@seouldt.com', mgrId:'seoul_mgr', mgrPw:'***', bizDocImg:'', solutions:[{key:'workm',label:'워크맵',enabled:true},{key:'homepage',label:'홈페이지',enabled:false},{key:'fabric',label:'원단공급사',enabled:false},{key:'mfg',label:'제조공급사',enabled:false},{key:'dist',label:'유통판매서',enabled:true},{key:'franchise',label:'가맹대리점',enabled:true},{key:'food',label:'식재대리점',enabled:false}], billings:HQ_BILLINGS_3, totalBill:1823221, unpaid:979800, memo:'' },
]

function AcctHQVendor() {
  const [vendors, setVendors] = useState<HQV[]>(() => getItem('acct_hq_vendors_v2', HQ_SEED))
  const [search, setSearch] = useState('')
  const [editVendor, setEditVendor] = useState<HQV | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [menuId, setMenuId] = useState<number | null>(null)

  const filtered = vendors.filter(v => !search || v.company.includes(search) || v.ceo.includes(search) || v.bizNo.includes(search))
  const totalBill = filtered.reduce((s, v) => s + (v.totalBill || 0), 0)

  const openAdd = () => {
    setEditVendor({ id: Date.now(), company:'', ceo:'', ceoPhone:'', bizPhone:'', bizNo:'', bizType:'', bizItem:'', taxEmail:'', zip:'', addr1:'', addr2:'', mgrName:'', mgrTitle:'', mgrMobile:'', mgrEmail:'', mgrId:'', mgrPw:'', bizDocImg:'', solutions:[{key:'workm',label:'워크맵',enabled:false},{key:'homepage',label:'홈페이지',enabled:false},{key:'fabric',label:'원단공급사',enabled:false},{key:'mfg',label:'제조공급사',enabled:false},{key:'dist',label:'유통판매서',enabled:false},{key:'franchise',label:'가맹대리점',enabled:false},{key:'food',label:'식재대리점',enabled:false}], billings:[], totalBill:0, unpaid:0, memo:'' })
    setModalOpen(true)
  }
  const openEdit = (v: HQV) => { setEditVendor({ ...v }); setModalOpen(true) }
  const saveVendor = () => {
    if (!editVendor?.company) { alert('거래처명을 입력하세요'); return }
    const exists = vendors.find(v => v.id === editVendor.id)
    const next = exists ? vendors.map(v => v.id === editVendor.id ? editVendor : v) : [...vendors, editVendor]
    setVendors(next); setItem('acct_hq_vendors_v2', next); setModalOpen(false)
  }
  const deleteVendor = (id: number) => {
    if (!confirm('삭제하시겠습니까?')) return
    const next = vendors.filter(v => v.id !== id)
    setVendors(next); setItem('acct_hq_vendors_v2', next)
  }
  const upd = (k: keyof HQV, v: any) => setEditVendor(p => p ? { ...p, [k]: v } : p)
  const toggleSol = (key: string) => {
    if (!editVendor) return
    upd('solutions', editVendor.solutions.map(s => s.key === key ? { ...s, enabled: !s.enabled } : s))
  }
  const ic = "w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors"

  return (
    <div className="animate-fadeIn">
      {/* 검색 + 추가 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="거래처명, 대표자, 사업자번호, 담당자 검색..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none" />
        </div>
        <button onClick={openAdd} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f6ef7] text-white text-sm font-bold cursor-pointer shadow-md hover:shadow-lg transition-shadow flex items-center gap-1.5 shrink-0">
          <Plus size={14} /> 거래처 추가
        </button>
      </div>

      {/* 테이블 */}
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-[var(--bg-muted)] border-b border-[var(--border-default)]">
              {['No','거래처명','대표자','연락처','사용솔루션','사용료 청구액','미수금','관리'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-bold text-[var(--text-muted)] whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((v, i) => (<React.Fragment key={v.id}>
              <tr className={cn('border-b border-[var(--border-default)] hover:bg-[var(--bg-muted)]/50 transition-colors cursor-pointer', expandedId === v.id && 'bg-[var(--bg-muted)]/30')} onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}>
                <td className="px-4 py-3 text-[var(--text-muted)]">
                  <div className="flex items-center gap-1">
                    <ChevronDown size={12} className={cn('transition-transform text-[var(--text-muted)]', expandedId === v.id && 'rotate-180')} />
                    {i + 1}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-bold text-[var(--text-primary)]">{v.company}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">{v.bizNo}</div>
                </td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{v.ceo}</td>
                <td className="px-4 py-3">
                  <div className="text-[var(--text-secondary)]">{v.bizPhone}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">담당: {v.mgrName}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {v.solutions.filter(s => s.enabled).map(s => (
                      <span key={s.key} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-100 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400">{s.label}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 font-extrabold text-[var(--text-primary)] whitespace-nowrap">{(v.totalBill || 0).toLocaleString()}원</td>
                <td className="px-4 py-3 font-bold text-orange-500 whitespace-nowrap">{(v.unpaid || 0).toLocaleString()}원</td>
                <td className="px-4 py-3 relative" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setMenuId(menuId === v.id ? null : v.id)} className="w-7 h-7 rounded-lg hover:bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-muted)] cursor-pointer"><MoreHorizontal size={14} /></button>
                  {menuId === v.id && (
                    <div className="absolute right-4 top-10 z-50 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-lg py-1 min-w-[100px] animate-scaleIn">
                      <button onClick={() => { setMenuId(null); openEdit(v) }} className="w-full px-4 py-2 text-left text-[12px] text-[var(--text-primary)] hover:bg-[var(--bg-muted)] cursor-pointer flex items-center gap-2"><Edit3 size={12} /> 수정</button>
                      <button onClick={() => { setMenuId(null); deleteVendor(v.id) }} className="w-full px-4 py-2 text-left text-[12px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer flex items-center gap-2"><Trash2 size={12} /> 삭제</button>
                    </div>
                  )}
                </td>
              </tr>
              {/* 청구 리스트 아코디언 */}
              {expandedId === v.id && v.billings.length > 0 && (
                <tr><td colSpan={8} className="p-0">
                  <div className="px-8 py-4 bg-blue-50/50 dark:bg-blue-900/5 border-b border-[var(--border-default)]">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[13px] font-bold text-[var(--text-primary)]">📋 청구 리스트</span>
                    </div>
                    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden">
                      <table className="w-full text-[11px]">
                        <thead><tr className="bg-[var(--bg-muted)] border-b border-[var(--border-default)]">
                          {['과금기간','월관리비','DB사용료','Data사용건수','수수료','총금액','상태'].map(h => <th key={h} className="px-3 py-2 text-left font-bold text-[var(--text-muted)] whitespace-nowrap">{h}</th>)}
                        </tr></thead>
                        <tbody>{(v.billings as any[]).map((b: any, bi: number) => (
                          <tr key={bi} className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-muted)]/50">
                            <td className="px-3 py-2 font-semibold text-[var(--text-primary)] whitespace-nowrap">{b.period}</td>
                            <td className="px-3 py-2 text-[var(--text-secondary)]">{b.mgmt || '-'}원</td>
                            <td className="px-3 py-2 text-[var(--text-secondary)]">{b.db || '-'}원</td>
                            <td className="px-3 py-2 text-[var(--text-secondary)]">{b.data || '-'}원</td>
                            <td className="px-3 py-2 text-[var(--text-secondary)]">{b.fee || '-'}원</td>
                            <td className="px-3 py-2 font-extrabold text-[var(--text-primary)]">{b.total}원</td>
                            <td className="px-3 py-2"><span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold', b.status==='과금중'?'bg-red-100 text-red-500 dark:bg-red-900/20':b.status==='청구'?'bg-blue-100 text-blue-500 dark:bg-blue-900/20':'bg-green-100 text-green-600 dark:bg-green-900/20')}>{b.status}</span></td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  </div>
                </td></tr>
              )}
            </React.Fragment>))}
          </tbody>
        </table>
        {/* 푸터 */}
        <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-muted)] border-t border-[var(--border-default)]">
          <span className="text-[12px] text-[var(--text-muted)]">총 <b className="text-[var(--text-primary)]">{filtered.length}건</b></span>
          <span className="text-[12px] text-[var(--text-muted)]">💰 청구액: <b className="text-primary-500">{totalBill.toLocaleString()}원</b></span>
        </div>
      </div>

      {/* 추가/수정 모달 */}
      {modalOpen && editVendor && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4" onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="bg-[var(--bg-base)] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col animate-scaleIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)] bg-[var(--bg-surface)] rounded-t-2xl shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center"><Building2 size={16} className="text-primary-500" /></div>
                <span className="text-sm font-extrabold text-[var(--text-primary)]">{vendors.find(v=>v.id===editVendor.id) ? editVendor.company || '거래처 수정' : '거래처 추가'}</span>
              </div>
              <button onClick={() => setModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-muted)] cursor-pointer"><X size={18} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* 기본 정보 + 사업자등록증 */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-5">
                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 space-y-3">
                  <SectionHeader icon="🏢" title="기본 정보" color="#4f6ef7" />
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="거래처명" required><input value={editVendor.company} onChange={e=>upd('company',e.target.value)} placeholder="(주)한국솔루션" className={ic} /></FormField>
                    <FormField label="대표자"><input value={editVendor.ceo} onChange={e=>upd('ceo',e.target.value)} placeholder="김대표" className={ic} /></FormField>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="대표전화"><input value={editVendor.ceoPhone} onChange={e=>upd('ceoPhone',fmtPhone(e.target.value))} placeholder="010-0000-0000" className={ic} maxLength={13} /></FormField>
                    <FormField label="사업자번호"><input value={editVendor.bizNo} onChange={e=>upd('bizNo',fmtBizNo(e.target.value))} placeholder="000-00-00000" className={ic} maxLength={12} /></FormField>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="업태"><input value={editVendor.bizType} onChange={e=>upd('bizType',e.target.value)} placeholder="서비스" className={ic} /></FormField>
                    <FormField label="업종"><input value={editVendor.bizItem} onChange={e=>upd('bizItem',e.target.value)} placeholder="소프트웨어" className={ic} /></FormField>
                  </div>
                  <FormField label="세금계산서 이메일"><input type="email" value={editVendor.taxEmail} onChange={e=>upd('taxEmail',e.target.value)} placeholder="tax@company.com" className={ic} /></FormField>
                  <FormField label="전화번호"><input value={editVendor.bizPhone} onChange={e=>upd('bizPhone',fmtPhone(e.target.value))} placeholder="02-0000-0000" className={ic} maxLength={13} /></FormField>
                  <FormField label="사업장주소">
                    <div className="flex gap-2 mb-2">
                      <input value={editVendor.zip} readOnly placeholder="우편번호" className={`${ic} flex-1 bg-[var(--bg-muted)] cursor-default`} />
                      <button type="button" onClick={() => { const dp=(window as any).daum?.Postcode; if(!dp){alert('로딩중...');return} new dp({oncomplete:(d:any)=>{upd('zip',d.zonecode);upd('addr1',d.roadAddress||d.jibunAddress)}}).open() }} className="px-3 py-2.5 rounded-lg bg-primary-500 text-white text-[11px] font-bold cursor-pointer shrink-0">+ 검색</button>
                    </div>
                    <input value={editVendor.addr1} readOnly placeholder="주소" className={`${ic} bg-[var(--bg-muted)] cursor-default mb-2`} />
                    <input value={editVendor.addr2} onChange={e=>upd('addr2',e.target.value)} placeholder="상세주소" className={ic} />
                  </FormField>
                </div>
                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 flex flex-col">
                  <SectionHeader icon="📋" title="사업자등록증" color="#f59e0b" />
                  <div className="flex-1 flex flex-col items-center justify-center min-h-[150px]">
                    {editVendor.bizDocImg ? (
                      <div className="relative group w-full"><img src={editVendor.bizDocImg} alt="" className="w-full max-h-[150px] object-contain rounded-lg border border-[var(--border-default)] bg-white" /><button type="button" onClick={()=>upd('bizDocImg','')} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 cursor-pointer">✕</button></div>
                    ) : (<div className="flex flex-col items-center gap-2 py-4 text-[var(--text-muted)]"><span className="text-3xl">📄</span><span className="text-[11px]">등록된 사업자등록증이 없습니다</span></div>)}
                  </div>
                  <label className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-[var(--border-default)] bg-[var(--bg-muted)] cursor-pointer hover:border-primary-400 transition-colors mt-2">
                    <span className="text-[12px] text-[var(--text-muted)]">📎 파일로드</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>upd('bizDocImg',r.result as string);r.readAsDataURL(f)}} />
                  </label>
                </div>
              </div>
              {/* 담당자 정보 */}
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 space-y-3">
                <SectionHeader icon="👤" title="담당자 정보" color="#22c55e" />
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="담당자 이름"><input value={editVendor.mgrName} onChange={e=>upd('mgrName',e.target.value)} placeholder="담당자명" className={ic} /></FormField>
                  <FormField label="직함"><input value={editVendor.mgrTitle} onChange={e=>upd('mgrTitle',e.target.value)} placeholder="예) 팀장" className={ic} /></FormField>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="휴대폰"><input value={editVendor.mgrMobile} onChange={e=>upd('mgrMobile',fmtPhone(e.target.value))} placeholder="010-0000-0000" className={ic} maxLength={13} /></FormField>
                  <FormField label="이메일"><input type="email" value={editVendor.mgrEmail} onChange={e=>upd('mgrEmail',e.target.value)} placeholder="email@example.com" className={ic} /></FormField>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="아이디(계정)"><input value={editVendor.mgrId} onChange={e=>upd('mgrId',e.target.value)} placeholder="system_id" className={ic} /></FormField>
                  <FormField label="비밀번호"><input type="password" value={editVendor.mgrPw} onChange={e=>upd('mgrPw',e.target.value)} placeholder="••••" className={ic} /></FormField>
                </div>
              </div>
              {/* 사용 솔루션 */}
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-default)]">
                  <div className="flex items-center gap-2"><span className="text-sm">⚙️</span><span className="text-[12px] font-extrabold text-[var(--text-primary)]">사용 솔루션</span></div>
                  <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-muted)] px-2 py-0.5 rounded-full">{editVendor.solutions.filter(s=>s.enabled).length}개 사용중</span>
                </div>
                <div className="p-4 flex flex-wrap gap-3">
                  {editVendor.solutions.map(sol => (
                    <div key={sol.key} className={cn('flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 transition-all min-w-[140px] cursor-pointer', sol.enabled ? 'border-primary-300 bg-primary-50 dark:bg-primary-900/10' : 'border-[var(--border-default)] bg-[var(--bg-muted)] opacity-60')} onClick={()=>toggleSol(sol.key)}>
                      <span className="text-[13px] font-bold text-[var(--text-primary)] flex-1">{sol.label}</span>
                      <div className={cn('relative w-11 h-6 rounded-full transition-colors', sol.enabled ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600')}>
                        <span className={cn('absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow transition-transform', sol.enabled ? 'left-[22px]' : 'left-0.5')} />
                      </div>
                      {sol.key==='homepage'&&sol.enabled&&<div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]"><span>수량:</span><span className="w-10 px-1.5 py-0.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-center text-[12px] font-bold text-[var(--text-primary)]">{sol.qty||1}</span></div>}
                    </div>
                  ))}
                </div>
              </div>
              {/* 결제 정보 */}
              {editVendor.billings.length > 0 && (() => {
                const enabledSols = editVendor.solutions.filter(s => s.enabled).map(s => s.label).join(', ')
                const curBill = (editVendor.billings as any[])[0] || {} as any
                return (
                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden">
                  <div className="flex items-center justify-between flex-wrap gap-2 px-5 py-3 border-b border-[var(--border-default)]">
                    <div className="flex items-center gap-2"><span className="text-sm">💳</span><span className="text-[12px] font-extrabold text-[var(--text-primary)]">결제 정보</span></div>
                    <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
                      <span>사용솔루션: <b className="text-primary-500">{enabledSols || '-'}</b></span>
                      <span>⏱ 과금일자: <b>{curBill.period || '-'}</b></span>
                      <span>💰 총금액: <b className="text-primary-500">{curBill.total || '0'}원</b></span>
                      {editVendor.totalBill > 0 && <span>📊 단가수정</span>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4">
                    {[
                      { icon: '💻', label: '월관리비(서버)', value: curBill.mgmt || '0', sub: '기본금액' },
                      { icon: '🗄️', label: 'DB사용료(단가:100M당 1,000원)', value: curBill.db || '0', sub: '25,000MB' },
                      { icon: '#', label: '자료단가(10건당 1원)', value: curBill.data || '0', sub: (curBill.data || '0') + '건' },
                      { icon: '%', label: '수수료(7%)', value: curBill.fee || '0', sub: '기간매출:500,000원', hl: true },
                    ].map((c, ci) => (
                      <div key={ci} className={cn('rounded-xl p-3 border', c.hl ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800' : 'bg-[var(--bg-muted)] border-[var(--border-default)]')}>
                        <div className="text-[10px] font-semibold text-[var(--text-muted)] mb-1 flex items-center gap-1 truncate"><span>{c.icon}</span> {c.label}</div>
                        <div className={cn('text-lg font-extrabold', c.hl ? 'text-orange-500' : 'text-[var(--text-primary)]')}>{c.value}<span className="text-[13px] font-semibold text-[var(--text-secondary)]">원</span></div>
                        <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{c.sub}</div>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] font-bold text-[var(--text-primary)] flex items-center gap-1.5">📋 청구 리스트</span>
                      <span className="text-[11px] text-[var(--text-muted)]">{editVendor.billings.length}건</span>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-[var(--border-default)]">
                      <table className="w-full text-[11px]">
                        <thead><tr className="bg-[var(--bg-muted)] border-b border-[var(--border-default)]">
                          {['과금기간','월관리비','DB사용료','Data사용건수','수수료','총금액','상태'].map(h => <th key={h} className="px-3 py-2 text-left font-bold text-[var(--text-muted)] whitespace-nowrap">{h}</th>)}
                        </tr></thead>
                        <tbody>{(editVendor.billings as any[]).map((b: any, bi: number) => (
                          <tr key={bi} className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-muted)]/50">
                            <td className="px-3 py-2 font-semibold text-[var(--text-primary)] whitespace-nowrap">{b.period}</td>
                            <td className="px-3 py-2 text-[var(--text-secondary)]">{b.mgmt || '-'}원</td>
                            <td className="px-3 py-2 text-[var(--text-secondary)]">{b.db || '-'}원</td>
                            <td className="px-3 py-2 text-[var(--text-secondary)]">{b.data || '-'}원</td>
                            <td className="px-3 py-2 text-[var(--text-secondary)]">{b.fee || '-'}원</td>
                            <td className="px-3 py-2 font-extrabold text-[var(--text-primary)]">{b.total}원</td>
                            <td className="px-3 py-2"><span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold', b.status==='과금중'?'bg-red-100 text-red-500 dark:bg-red-900/20':b.status==='청구'?'bg-blue-100 text-blue-500 dark:bg-blue-900/20':'bg-green-100 text-green-600 dark:bg-green-900/20')}>{b.status}</span></td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  </div>
                </div>)
              })()}
              {/* 비고 */}
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 space-y-3">
                <SectionHeader icon="📝" title="비고" color="#8b5cf6" />
                <textarea value={editVendor.memo} onChange={e=>upd('memo',e.target.value)} placeholder="기타 참고 사항" rows={3} className={`${ic} resize-none`} />
              </div>

            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-[var(--border-default)] bg-[var(--bg-surface)] rounded-b-2xl shrink-0">
              <button onClick={()=>setModalOpen(false)} className="px-6 py-2.5 rounded-xl border border-[var(--border-default)] text-sm font-semibold text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--bg-muted)] transition-colors">취소</button>
              <button onClick={saveVendor} className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f6ef7] text-white text-sm font-bold cursor-pointer shadow-md hover:shadow-lg transition-shadow flex items-center gap-1.5"><Save size={14} /> 저장</button>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════
   지출수단 관리 (카테고리별)
   ═══════════════════════════════════════════ */
interface PayMethodCard {
  id: number
  cardName: string
  cardCompany: string
  cardNumber: string
  cardType: '체크카드' | '신용카드'
  cardUser: string
  expiryDate?: string
  cardLimit?: number
  memo?: string
}

interface PayMethodNote {
  id: number
  noteNumber: string
  issuer: string
  receiver: string
  amount: number
  issueDate: string
  maturityDate: string
  endorsement: string
  bank: string
  status: '미결제' | '추심중' | '결제완료' | '부도'
  memo?: string
}

interface PayMethodItem {
  id: number
  name: string
  category: '계좌' | '현금' | '어음' | '상품권'
  budgetCatId?: string | number  // 예산구분 연결
  // 계좌 상세
  bankName?: string
  accountNumber?: string
  accountHolder?: string
  manager?: string
  purpose?: string
  memo?: string
  cards?: PayMethodCard[]
  // 현금 상세
  storageLocation?: string
  custodian?: string
  cashLimit?: number
  // 어음 상세
  noteType?: '수신' | '발행'
  noteBank?: string
  noteManager?: string
  defaultMaturity?: string
  noteLimit?: number
  notes?: PayMethodNote[]
  // 상품권 상세
  voucherAmount?: number
  voucherQty?: number
  voucherStorage?: string
  voucherManager?: string
}

const PAY_CATEGORIES = [
  { key: '계좌' as const, label: '계좌', icon: '🏦', color: '#3b82f6', bg: 'bg-blue-50 dark:bg-blue-900/10', border: 'border-blue-200 dark:border-blue-800', desc: '계좌이체, 자동이체 등' },
  { key: '현금' as const, label: '현금', icon: '💵', color: '#22c55e', bg: 'bg-emerald-50 dark:bg-emerald-900/10', border: 'border-emerald-200 dark:border-emerald-800', desc: '현금, 소액현금 등' },
  { key: '어음' as const, label: '어음', icon: '📄', color: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/10', border: 'border-amber-200 dark:border-amber-800', desc: '수신어음, 발행어음, 수표' },
  { key: '상품권' as const, label: '상품권', icon: '🎟️', color: '#8b5cf6', bg: 'bg-violet-50 dark:bg-violet-900/10', border: 'border-violet-200 dark:border-violet-800', desc: '문화상품권, 백화점상품권 등' },
]

const DEFAULT_PAY_ITEMS: PayMethodItem[] = [
  { id: 1, name: '계좌이체', category: '계좌' },
  { id: 2, name: '자동이체', category: '계좌' },
  { id: 3, name: '온라인뱅킹', category: '계좌' },
  { id: 4, name: '현금', category: '현금' },
  { id: 5, name: '소액현금', category: '현금' },
  { id: 6, name: '수신어음', category: '어음', noteType: '수신' },
  { id: 7, name: '발행어음', category: '어음', noteType: '발행' },
  { id: 11, name: '수표', category: '어음' },
  { id: 8, name: '문화상품권', category: '상품권' },
  { id: 9, name: '백화점상품권', category: '상품권' },
  { id: 10, name: '온누리상품권', category: '상품권' },
]

const DETAIL_FIELD_LABEL = 'text-[11px] font-bold text-[var(--text-muted)] mb-1 block'
const DETAIL_INPUT = 'w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-white dark:bg-gray-900 text-[12px] text-[var(--text-primary)] outline-none focus:border-primary-400 transition-colors placeholder:text-[var(--text-muted)]'

function AcctPayMethods({ catId }: { catId?: string | null }) {
  const [refresh, setRefresh] = useState(0)
  const [newName, setNewName] = useState('')
  const [activeCategory, setActiveCategory] = useState<'계좌' | '현금' | '어음' | '상품권'>('계좌')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const addToast = useToastStore(s => s.add)

  // 직원 목록
  const staffList = useMemo(() => getItem<any[]>('ws_users', []), [])

  // 현재 설정 회계년도
  const currentYear = new Date().getFullYear()
  const activeYear = parseInt(new URLSearchParams(window.location.hash.split('?')[1] || '').get('year') || '') || parseInt(localStorage.getItem('acct_active_year') || '') || currentYear

  // 예산구분 목록 (설정 년도 기준)
  const budgetCats = useMemo(() => {
    const all = getItem<BudgetCat[]>('acct_budget_cats', [])
    return all.filter(c => {
      const cy = c.year || (c.periodFrom ? parseInt(c.periodFrom.substring(0, 4)) : currentYear)
      return cy === activeYear
    })
  }, [refresh, activeYear])

  // 상단 바에서 선택된 예산구분 ID 사용
  const selectedPayCatId = catId || (budgetCats.length > 0 ? String(budgetCats[0].id) : '')
  const selectedCatName = budgetCats.find(c => String(c.id) === selectedPayCatId)?.name || ''

  // 초기화
  useEffect(() => {
    const raw = localStorage.getItem('acct_pay_methods_v2')
    if (!raw) {
      const oldMethods: string[] = getItem('acct_payment_methods', [])
      if (oldMethods.length > 0) {
        const migrated: PayMethodItem[] = oldMethods.map((name, i) => {
          let cat: PayMethodItem['category'] = '상품권'
          if (['계좌이체', '자동이체', '온라인뱅킹'].includes(name)) cat = '계좌'
          else if (['현금', '소액현금'].includes(name)) cat = '현금'
          else if (['약속어음', '환어음', '수표', '어음'].includes(name)) cat = '어음'
          return { id: Date.now() + i, name, category: cat }
        })
        localStorage.setItem('acct_pay_methods_v2', JSON.stringify(migrated))
      } else {
        localStorage.setItem('acct_pay_methods_v2', JSON.stringify(DEFAULT_PAY_ITEMS))
      }
      setRefresh(r => r + 1)
    }
  }, [])

  void refresh
  const allItems: PayMethodItem[] = useMemo(() => {
    try {
      const raw = localStorage.getItem('acct_pay_methods_v2')
      if (!raw) return DEFAULT_PAY_ITEMS
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return DEFAULT_PAY_ITEMS
      if (parsed.length > 0 && typeof parsed[0] === 'string') return DEFAULT_PAY_ITEMS
      return parsed as PayMethodItem[]
    } catch { return DEFAULT_PAY_ITEMS }
  }, [refresh])
  // 선택된 예산구분의 항목만 표시
  const filteredItems = selectedPayCatId
    ? allItems.filter(i => String(i.budgetCatId) === selectedPayCatId)
    : allItems
  const catItems = filteredItems.filter(i => i.category === activeCategory)
  const activeCatInfo = PAY_CATEGORIES.find(c => c.key === activeCategory)!

  // 선택된 예산구분의 지출담당자 (기본값으로 사용)
  const defaultManager = useMemo(() => {
    const cat = budgetCats.find(c => String(c.id) === selectedPayCatId)
    if (cat?.users && cat.users.length > 0) return cat.users[0]
    return ''
  }, [budgetCats, selectedPayCatId])

  const saveAll = (updated: PayMethodItem[]) => {
    localStorage.setItem('acct_pay_methods_v2', JSON.stringify(updated))
    localStorage.setItem('acct_payment_methods', JSON.stringify(updated.map(i => i.name)))
    setRefresh(r => r + 1)
  }

  const handleAdd = () => {
    if (!newName.trim()) return
    // 같은 예산구분 + 같은 카테고리 내에서만 중복 체크
    const isDuplicate = allItems.some(i =>
      i.name === newName.trim() &&
      i.category === activeCategory &&
      String(i.budgetCatId) === selectedPayCatId
    )
    if (isDuplicate) {
      addToast('error', '이 예산구분에 이미 존재하는 지출수단입니다')
      return
    }
    const newItem: PayMethodItem = {
      id: Date.now(),
      name: newName.trim(),
      category: activeCategory,
      budgetCatId: selectedPayCatId || undefined,
      manager: activeCategory === '계좌' ? defaultManager : undefined,
      custodian: activeCategory === '현금' ? defaultManager : undefined,
      noteManager: activeCategory === '어음' ? defaultManager : undefined,
      voucherManager: activeCategory === '상품권' ? defaultManager : undefined,
    }
    saveAll([...allItems, newItem])
    addToast('success', `"${newName.trim()}" 추가됨`)
    setNewName('')
    setExpandedId(newItem.id)
  }

  const handleDelete = (id: number) => {
    const item = allItems.find(i => i.id === id)
    if (!item) return
    if (!confirm(`"${item.name}"을(를) 삭제하시겠습니까?`)) return
    saveAll(allItems.filter(i => i.id !== id))
    addToast('warning', `"${item.name}" 삭제됨`)
    if (expandedId === id) setExpandedId(null)
  }

  const updateField = (id: number, field: keyof PayMethodItem, value: string) => {
    saveAll(allItems.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  // ── 카드 CRUD ──
  const addCard = (itemId: number) => {
    const newCard: PayMethodCard = {
      id: Date.now(),
      cardName: '',
      cardCompany: '',
      cardNumber: '',
      cardType: '체크카드',
      cardUser: defaultManager,
    }
    saveAll(allItems.map(i => i.id === itemId ? { ...i, cards: [...(i.cards || []), newCard] } : i))
  }
  const updateCard = (itemId: number, cardId: number, field: keyof PayMethodCard, value: string | number) => {
    saveAll(allItems.map(i => i.id === itemId ? {
      ...i,
      cards: (i.cards || []).map(c => c.id === cardId ? { ...c, [field]: value } : c)
    } : i))
  }
  const deleteCard = (itemId: number, cardId: number) => {
    saveAll(allItems.map(i => i.id === itemId ? {
      ...i,
      cards: (i.cards || []).filter(c => c.id !== cardId)
    } : i))
  }

  // ── 어음대장 CRUD ──
  const addNote = (itemId: number) => {
    const item = allItems.find(i => i.id === itemId)
    const newNote: PayMethodNote = {
      id: Date.now(),
      noteNumber: '',
      issuer: item?.noteType === '발행' ? '우리회사' : '',
      receiver: item?.noteType === '수신' ? '우리회사' : '',
      amount: 0,
      issueDate: new Date().toISOString().slice(0, 10),
      maturityDate: '',
      endorsement: '',
      bank: '',
      status: '미결제',
    }
    saveAll(allItems.map(i => i.id === itemId ? { ...i, notes: [...(i.notes || []), newNote] } : i))
  }
  const updateNote = (itemId: number, noteId: number, field: keyof PayMethodNote, value: string | number) => {
    saveAll(allItems.map(i => i.id === itemId ? {
      ...i,
      notes: (i.notes || []).map(n => n.id === noteId ? { ...n, [field]: value } : n)
    } : i))
  }
  const deleteNote = (itemId: number, noteId: number) => {
    saveAll(allItems.map(i => i.id === itemId ? {
      ...i,
      notes: (i.notes || []).filter(n => n.id !== noteId)
    } : i))
  }

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-[var(--text-primary)] flex items-center gap-2">
            💳 지출수단 관리
          </h2>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">상단에서 예산구분을 선택하여 지출수단을 관리합니다</p>
        </div>
        <span className="text-xs font-bold text-white bg-primary-500 px-3 py-1.5 rounded-full">
          {selectedCatName || '전체'} {filteredItems.length}건
        </span>
      </div>

      {/* 카테고리 탭 */}
      <div className="flex gap-2">
        {PAY_CATEGORIES.map(cat => {
          const count = filteredItems.filter(i => i.category === cat.key).length
          const isActive = activeCategory === cat.key
          return (
            <button
              key={cat.key}
              onClick={() => { setActiveCategory(cat.key); setExpandedId(null) }}
              className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all cursor-pointer ${
                isActive
                  ? `${cat.bg} ${cat.border} shadow-sm`
                  : 'bg-[var(--bg-surface)] border-transparent hover:border-[var(--border-default)]'
              }`}
            >
              <div className="text-center">
                <span className="text-lg">{cat.icon}</span>
                <div className={`text-[12px] font-extrabold mt-1 ${isActive ? '' : 'text-[var(--text-secondary)]'}`} style={isActive ? { color: cat.color } : undefined}>
                  {cat.label}
                </div>
                <div className="text-[10px] font-bold text-[var(--text-muted)] mt-0.5">{count}건</div>
              </div>
            </button>
          )
        })}
      </div>

      {/* 선택된 카테고리 영역 */}
      <div className={`rounded-2xl border-2 ${activeCatInfo.border} ${activeCatInfo.bg} p-5`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">{activeCatInfo.icon}</span>
            <div>
              <h3 className="text-sm font-extrabold" style={{ color: activeCatInfo.color }}>{activeCatInfo.label}</h3>
              <p className="text-[10px] text-[var(--text-muted)]">{activeCatInfo.desc}</p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: activeCatInfo.color, background: `${activeCatInfo.color}15` }}>
            {catItems.length}건
          </span>
        </div>

        {/* 추가 폼 */}
        <div className="flex gap-2 mb-4">
          <input
            placeholder={`새 ${activeCatInfo.label} 수단 입력...`}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-[var(--border-default)] bg-white dark:bg-gray-900 text-sm text-[var(--text-primary)] outline-none focus:border-primary-400 transition-colors placeholder:text-[var(--text-muted)]"
          />
          <button
            onClick={handleAdd}
            className="px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-all cursor-pointer hover:shadow-md flex items-center gap-1.5"
            style={{ background: activeCatInfo.color }}
          >
            <Plus size={14} /> 추가
          </button>
        </div>

        {/* 항목 리스트 */}
        {catItems.length === 0 ? (
          <div className="py-8 text-center text-sm text-[var(--text-muted)] rounded-xl border border-dashed border-[var(--border-default)] bg-white/50 dark:bg-gray-900/50">
            등록된 {activeCatInfo.label} 수단이 없습니다
          </div>
        ) : (
          <div className="space-y-1.5">
            {catItems.map((item, idx) => {
              const isOpen = expandedId === item.id
              const hasDetail = activeCategory === '계좌' && (item.bankName || item.accountNumber || item.accountHolder || item.manager)
              return (
                <div key={item.id} className={`rounded-xl transition-all border ${isOpen ? 'border-[var(--border-default)] bg-white dark:bg-gray-900/60 shadow-sm' : 'border-transparent bg-white/70 dark:bg-gray-900/30 hover:bg-white dark:hover:bg-gray-800/50 hover:border-[var(--border-default)]'}`}>
                  {/* 메인 행 */}
                  <div
                    className="flex items-center gap-3 px-3.5 py-2.5 cursor-pointer group"
                    onClick={() => setExpandedId(isOpen ? null : item.id)}
                  >
                    <span className="text-[10px] font-bold w-5 text-center shrink-0 rounded-full py-0.5" style={{ color: activeCatInfo.color, background: `${activeCatInfo.color}15` }}>
                      {idx + 1}
                    </span>
                    <span className="text-sm font-semibold text-[var(--text-primary)] flex-1">{item.name}</span>
                    {/* 계좌 요약 표시 */}
                    {activeCategory === '계좌' && item.bankName && !isOpen && (
                      <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[200px]">
                        {item.bankName} {item.accountNumber ? `• ${item.accountNumber}` : ''}
                      </span>
                    )}
                    {hasDetail && !isOpen && <span className="text-[8px] text-primary-500 bg-primary-100 dark:bg-primary-900/20 px-1.5 py-0.5 rounded font-bold">상세</span>}
                    <ChevronDown size={14} className={`text-[var(--text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(item.id) }}
                      className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-danger cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* 상세 필드 (계좌만) */}
                  {isOpen && activeCategory === '계좌' && (
                    <div className="px-4 pb-4 pt-1 border-t border-[var(--border-default)] mx-3">
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>은행명 *</label>
                          <input
                            value={item.bankName || ''}
                            onChange={e => updateField(item.id, 'bankName', e.target.value)}
                            placeholder="국민은행"
                            className={DETAIL_INPUT}
                          />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>계좌번호 *</label>
                          <input
                            value={item.accountNumber || ''}
                            onChange={e => updateField(item.id, 'accountNumber', e.target.value)}
                            placeholder="110-234-567890"
                            className={DETAIL_INPUT}
                          />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>예금주 *</label>
                          <input
                            value={item.accountHolder || ''}
                            onChange={e => updateField(item.id, 'accountHolder', e.target.value)}
                            placeholder="(주)문화재청"
                            className={DETAIL_INPUT}
                          />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>계좌관리자 *</label>
                          <select
                            value={item.manager || ''}
                            onChange={e => updateField(item.id, 'manager', e.target.value)}
                            className={DETAIL_INPUT}
                          >
                            <option value="">선택하세요</option>
                            {staffList.map((s: any) => (
                              <option key={s.id || s.name} value={s.name}>{s.name}{s.role ? ` (${s.role})` : ''}{s.dept ? ` - ${s.dept}` : ''}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>계좌용도</label>
                          <input
                            value={item.purpose || ''}
                            onChange={e => updateField(item.id, 'purpose', e.target.value)}
                            placeholder="운영자금, 사업비 등"
                            className={DETAIL_INPUT}
                          />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>메모</label>
                          <input
                            value={item.memo || ''}
                            onChange={e => updateField(item.id, 'memo', e.target.value)}
                            placeholder="참고사항"
                            className={DETAIL_INPUT}
                          />
                        </div>
                      </div>

                      {/* ── 카드 관리 ── */}
                      <div className="mt-5 pt-4 border-t border-dashed border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-1.5">
                            <CreditCard size={14} className="text-blue-500" />
                            <span className="text-[12px] font-extrabold text-[var(--text-primary)]">연결 카드</span>
                            {(item.cards || []).length > 0 && (
                              <span className="text-[9px] font-bold bg-blue-100 dark:bg-blue-900/20 text-blue-600 px-1.5 py-0.5 rounded">{(item.cards || []).length}장</span>
                            )}
                          </div>
                          <button
                            onClick={() => addCard(item.id)}
                            className="text-[11px] font-bold text-blue-500 hover:text-blue-700 cursor-pointer flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          >
                            <Plus size={12} /> 카드 추가
                          </button>
                        </div>

                        {(!item.cards || item.cards.length === 0) ? (
                          <div className="py-4 text-center text-[11px] text-[var(--text-muted)] rounded-lg border border-dashed border-[var(--border-default)] bg-white/50 dark:bg-gray-900/30">
                            등록된 카드가 없습니다
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {item.cards.map((card, ci) => (
                              <div key={card.id} className="rounded-lg border border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/5 p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] font-bold text-blue-500">💳 카드 {ci + 1}</span>
                                  <button
                                    onClick={() => deleteCard(item.id, card.id)}
                                    className="text-[10px] text-red-400 hover:text-red-600 cursor-pointer flex items-center gap-0.5"
                                  >
                                    <Trash2 size={10} /> 삭제
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className={DETAIL_FIELD_LABEL}>카드명 *</label>
                                    <input
                                      value={card.cardName}
                                      onChange={e => updateCard(item.id, card.id, 'cardName', e.target.value)}
                                      placeholder="법인카드1"
                                      className={DETAIL_INPUT}
                                    />
                                  </div>
                                  <div>
                                    <label className={DETAIL_FIELD_LABEL}>카드사 *</label>
                                    <input
                                      value={card.cardCompany}
                                      onChange={e => updateCard(item.id, card.id, 'cardCompany', e.target.value)}
                                      placeholder="국민카드"
                                      className={DETAIL_INPUT}
                                    />
                                  </div>
                                  <div>
                                    <label className={DETAIL_FIELD_LABEL}>카드번호 *</label>
                                    <input
                                      value={card.cardNumber}
                                      onChange={e => {
                                        const raw = e.target.value.replace(/[^0-9]/g, '').slice(0, 16)
                                        const formatted = raw.replace(/(.{4})/g, '$1-').replace(/-$/, '')
                                        updateCard(item.id, card.id, 'cardNumber', formatted)
                                      }}
                                      placeholder="1234-5678-9012-3456"
                                      className={DETAIL_INPUT}
                                    />
                                  </div>
                                  <div>
                                    <label className={DETAIL_FIELD_LABEL}>카드종류 *</label>
                                    <select
                                      value={card.cardType}
                                      onChange={e => updateCard(item.id, card.id, 'cardType', e.target.value)}
                                      className={DETAIL_INPUT}
                                    >
                                      <option value="체크카드">체크카드</option>
                                      <option value="신용카드">신용카드</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className={DETAIL_FIELD_LABEL}>사용자 *</label>
                                    <select
                                      value={card.cardUser}
                                      onChange={e => updateCard(item.id, card.id, 'cardUser', e.target.value)}
                                      className={DETAIL_INPUT}
                                    >
                                      <option value="">선택하세요</option>
                                      {staffList.map((s: any) => (
                                        <option key={s.id || s.name} value={s.name}>{s.name}{s.role ? ` (${s.role})` : ''}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className={DETAIL_FIELD_LABEL}>유효기간</label>
                                    <input
                                      value={card.expiryDate || ''}
                                      onChange={e => {
                                        const raw = e.target.value.replace(/[^0-9]/g, '').slice(0, 4)
                                        const formatted = raw.length > 2 ? `${raw.slice(0, 2)}/${raw.slice(2)}` : raw
                                        updateCard(item.id, card.id, 'expiryDate', formatted)
                                      }}
                                      placeholder="MM/YY"
                                      maxLength={5}
                                      className={DETAIL_INPUT}
                                    />
                                  </div>
                                  {card.cardType === '신용카드' && (
                                    <div>
                                      <label className={DETAIL_FIELD_LABEL}>한도</label>
                                      <input
                                        value={card.cardLimit ? card.cardLimit.toLocaleString() : ''}
                                        onChange={e => updateCard(item.id, card.id, 'cardLimit', parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0)}
                                        placeholder="5,000,000"
                                        className={DETAIL_INPUT}
                                      />
                                    </div>
                                  )}
                                  <div className={card.cardType === '신용카드' ? '' : 'col-span-1'}>
                                    <label className={DETAIL_FIELD_LABEL}>메모</label>
                                    <input
                                      value={card.memo || ''}
                                      onChange={e => updateCard(item.id, card.id, 'memo', e.target.value)}
                                      placeholder="참고사항"
                                      className={DETAIL_INPUT}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 상세 필드 (현금) */}
                  {isOpen && activeCategory === '현금' && (
                    <div className="px-4 pb-4 pt-1 border-t border-[var(--border-default)] mx-3">
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>보관처 *</label>
                          <input
                            value={item.storageLocation || ''}
                            onChange={e => updateField(item.id, 'storageLocation' as any, e.target.value)}
                            placeholder="사무실 금고, 현장사무소 등"
                            className={DETAIL_INPUT}
                          />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>보관책임자 *</label>
                          <select
                            value={item.custodian || ''}
                            onChange={e => updateField(item.id, 'custodian' as any, e.target.value)}
                            className={DETAIL_INPUT}
                          >
                            <option value="">선택하세요</option>
                            {staffList.map((s: any) => (
                              <option key={s.id || s.name} value={s.name}>{s.name}{s.role ? ` (${s.role})` : ''}{s.dept ? ` - ${s.dept}` : ''}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>한도액</label>
                          <input
                            value={item.cashLimit ? item.cashLimit.toLocaleString() : ''}
                            onChange={e => {
                              const num = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0
                              saveAll(allItems.map(i => i.id === item.id ? { ...i, cashLimit: num } : i))
                            }}
                            placeholder="500,000"
                            className={DETAIL_INPUT}
                          />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>용도</label>
                          <input
                            value={item.purpose || ''}
                            onChange={e => updateField(item.id, 'purpose', e.target.value)}
                            placeholder="소액경비, 현장경비 등"
                            className={DETAIL_INPUT}
                          />
                        </div>
                        <div className="col-span-2">
                          <label className={DETAIL_FIELD_LABEL}>메모</label>
                          <input
                            value={item.memo || ''}
                            onChange={e => updateField(item.id, 'memo', e.target.value)}
                            placeholder="참고사항"
                            className={DETAIL_INPUT}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 상세 필드 (어음) */}
                  {isOpen && activeCategory === '어음' && (
                    <div className="px-4 pb-4 pt-1 border-t border-[var(--border-default)] mx-3">
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>구분 *</label>
                          <select
                            value={item.noteType || ''}
                            onChange={e => updateField(item.id, 'noteType' as any, e.target.value)}
                            className={DETAIL_INPUT}
                          >
                            <option value="">선택하세요</option>
                            <option value="수신">수신 (받을어음)</option>
                            <option value="발행">발행 (지급어음)</option>
                          </select>
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>담당자 *</label>
                          <select
                            value={item.noteManager || ''}
                            onChange={e => updateField(item.id, 'noteManager' as any, e.target.value)}
                            className={DETAIL_INPUT}
                          >
                            <option value="">선택하세요</option>
                            {staffList.map((s: any) => (
                              <option key={s.id || s.name} value={s.name}>{s.name}{s.role ? ` (${s.role})` : ''}{s.dept ? ` - ${s.dept}` : ''}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>기본만기 *</label>
                          <select
                            value={item.defaultMaturity || ''}
                            onChange={e => updateField(item.id, 'defaultMaturity' as any, e.target.value)}
                            className={DETAIL_INPUT}
                          >
                            <option value="">선택하세요</option>
                            <option value="30일">30일</option>
                            <option value="60일">60일</option>
                            <option value="90일">90일</option>
                            <option value="120일">120일</option>
                          </select>
                        </div>
                        {item.noteType === '발행' && (
                          <div>
                            <label className={DETAIL_FIELD_LABEL}>발행한도</label>
                            <input
                              value={item.noteLimit ? item.noteLimit.toLocaleString() : ''}
                              onChange={e => {
                                const num = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0
                                saveAll(allItems.map(i => i.id === item.id ? { ...i, noteLimit: num } : i))
                              }}
                              placeholder="50,000,000"
                              className={DETAIL_INPUT}
                            />
                          </div>
                        )}
                        <div className={item.noteType === '발행' ? '' : 'col-span-2'}>
                          <label className={DETAIL_FIELD_LABEL}>메모</label>
                          <input
                            value={item.memo || ''}
                            onChange={e => updateField(item.id, 'memo', e.target.value)}
                            placeholder="참고사항"
                            className={DETAIL_INPUT}
                          />
                        </div>
                      </div>

                      {/* ── 어음대장 ── */}
                      {item.noteType && (
                        <div className="mt-5 pt-4 border-t border-dashed border-amber-200 dark:border-amber-800">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-1.5">
                              <ScrollText size={14} className="text-amber-500" />
                              <span className="text-[12px] font-extrabold text-[var(--text-primary)]">어음대장</span>
                              {(item.notes || []).length > 0 && (
                                <span className="text-[9px] font-bold bg-amber-100 dark:bg-amber-900/20 text-amber-600 px-1.5 py-0.5 rounded">{(item.notes || []).length}건</span>
                              )}
                            </div>
                            <button
                              onClick={() => addNote(item.id)}
                              className="text-[11px] font-bold text-amber-500 hover:text-amber-700 cursor-pointer flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                            >
                              <Plus size={12} /> 어음 추가
                            </button>
                          </div>

                          {(!item.notes || item.notes.length === 0) ? (
                            <div className="py-4 text-center text-[11px] text-[var(--text-muted)] rounded-lg border border-dashed border-[var(--border-default)] bg-white/50 dark:bg-gray-900/30">
                              등록된 어음이 없습니다
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {item.notes.map((note, ni) => {
                                const statusColors: Record<string, string> = { '미결제': '#f59e0b', '추심중': '#3b82f6', '결제완료': '#22c55e', '부도': '#ef4444' }
                                return (
                                  <div key={note.id} className="rounded-lg border border-amber-100 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-900/5 p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-amber-500">📄 어음 {ni + 1}</span>
                                        {note.status && (
                                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ color: statusColors[note.status] || '#888', background: `${statusColors[note.status] || '#888'}15` }}>
                                            {note.status}
                                          </span>
                                        )}
                                      </div>
                                      <button
                                        onClick={() => deleteNote(item.id, note.id)}
                                        className="text-[10px] text-red-400 hover:text-red-600 cursor-pointer flex items-center gap-0.5"
                                      >
                                        <Trash2 size={10} /> 삭제
                                      </button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                      <div>
                                        <label className={DETAIL_FIELD_LABEL}>어음번호 *</label>
                                        <input
                                          value={note.noteNumber}
                                          onChange={e => updateNote(item.id, note.id, 'noteNumber', e.target.value)}
                                          placeholder="A-2026-001"
                                          className={DETAIL_INPUT}
                                        />
                                      </div>
                                      <div>
                                        <label className={DETAIL_FIELD_LABEL}>{item.noteType === '수신' ? '발행인' : '수취인'} *</label>
                                        <input
                                          value={item.noteType === '수신' ? note.issuer : note.receiver}
                                          onChange={e => updateNote(item.id, note.id, item.noteType === '수신' ? 'issuer' : 'receiver', e.target.value)}
                                          placeholder="거래처명"
                                          className={DETAIL_INPUT}
                                        />
                                      </div>
                                      <div>
                                        <label className={DETAIL_FIELD_LABEL}>금액 *</label>
                                        <input
                                          value={note.amount ? note.amount.toLocaleString() : ''}
                                          onChange={e => updateNote(item.id, note.id, 'amount', parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0)}
                                          placeholder="5,000,000"
                                          className={DETAIL_INPUT}
                                        />
                                      </div>
                                      <div>
                                        <label className={DETAIL_FIELD_LABEL}>발행일 *</label>
                                        <input
                                          type="date"
                                          value={note.issueDate}
                                          onChange={e => updateNote(item.id, note.id, 'issueDate', e.target.value)}
                                          className={DETAIL_INPUT}
                                        />
                                      </div>
                                      <div>
                                        <label className={DETAIL_FIELD_LABEL}>만기일 *</label>
                                        <input
                                          type="date"
                                          value={note.maturityDate}
                                          onChange={e => updateNote(item.id, note.id, 'maturityDate', e.target.value)}
                                          className={DETAIL_INPUT}
                                        />
                                      </div>
                                      <div>
                                        <label className={DETAIL_FIELD_LABEL}>{item.noteType === '수신' ? '추심은행' : '결제은행'} *</label>
                                        <input
                                          value={note.bank || ''}
                                          onChange={e => updateNote(item.id, note.id, 'bank', e.target.value)}
                                          placeholder="국민은행"
                                          className={DETAIL_INPUT}
                                        />
                                      </div>
                                      <div>
                                        <label className={DETAIL_FIELD_LABEL}>상태 *</label>
                                        <select
                                          value={note.status}
                                          onChange={e => updateNote(item.id, note.id, 'status', e.target.value)}
                                          className={DETAIL_INPUT}
                                        >
                                          <option value="미결제">미결제</option>
                                          {item.noteType === '수신' && <option value="추심중">추심중</option>}
                                          <option value="결제완료">결제완료</option>
                                          <option value="부도">부도</option>
                                        </select>
                                      </div>
                                      <div className="col-span-2">
                                        <label className={DETAIL_FIELD_LABEL}>배서내용</label>
                                        <input
                                          value={note.endorsement}
                                          onChange={e => updateNote(item.id, note.id, 'endorsement', e.target.value)}
                                          placeholder="배서인, 배서일자 등"
                                          className={DETAIL_INPUT}
                                        />
                                      </div>
                                      <div>
                                        <label className={DETAIL_FIELD_LABEL}>메모</label>
                                        <input
                                          value={note.memo || ''}
                                          onChange={e => updateNote(item.id, note.id, 'memo', e.target.value)}
                                          placeholder="참고사항"
                                          className={DETAIL_INPUT}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 상세 필드 (상품권) */}
                  {isOpen && activeCategory === '상품권' && (
                    <div className="px-4 pb-4 pt-1 border-t border-[var(--border-default)] mx-3">
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>금액 *</label>
                          <input
                            value={item.voucherAmount ? item.voucherAmount.toLocaleString() : ''}
                            onChange={e => {
                              const num = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0
                              saveAll(allItems.map(i => i.id === item.id ? { ...i, voucherAmount: num } : i))
                            }}
                            placeholder="50,000"
                            className={DETAIL_INPUT}
                          />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>보유수량 *</label>
                          <input
                            type="number"
                            value={item.voucherQty || ''}
                            onChange={e => {
                              const num = parseInt(e.target.value) || 0
                              saveAll(allItems.map(i => i.id === item.id ? { ...i, voucherQty: num } : i))
                            }}
                            placeholder="10"
                            min={0}
                            className={DETAIL_INPUT}
                          />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>보관처 *</label>
                          <input
                            value={item.voucherStorage || ''}
                            onChange={e => updateField(item.id, 'voucherStorage' as any, e.target.value)}
                            placeholder="사무실 금고"
                            className={DETAIL_INPUT}
                          />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>담당자 *</label>
                          <select
                            value={item.voucherManager || ''}
                            onChange={e => updateField(item.id, 'voucherManager' as any, e.target.value)}
                            className={DETAIL_INPUT}
                          >
                            <option value="">선택하세요</option>
                            {staffList.map((s: any) => (
                              <option key={s.id || s.name} value={s.name}>{s.name}{s.role ? ` (${s.role})` : ''}{s.dept ? ` - ${s.dept}` : ''}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className={DETAIL_FIELD_LABEL}>메모</label>
                          <input
                            value={item.memo || ''}
                            onChange={e => updateField(item.id, 'memo', e.target.value)}
                            placeholder="참고사항"
                            className={DETAIL_INPUT}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// build-force-v7

/* ═══ 입금계정 관리 ═══ */
const INCOME_CATEGORIES = [
  { key: '계좌' as const, label: '계좌', icon: '🏦', color: '#3b82f6', bg: 'bg-blue-50 dark:bg-blue-900/10', border: 'border-blue-200 dark:border-blue-800', desc: '계좌입금, 자동이체 수신 등' },
  { key: '현금' as const, label: '현금', icon: '💵', color: '#22c55e', bg: 'bg-emerald-50 dark:bg-emerald-900/10', border: 'border-emerald-200 dark:border-emerald-800', desc: '현금 수입, 현장 수납 등' },
  { key: '어음' as const, label: '어음', icon: '📄', color: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/10', border: 'border-amber-200 dark:border-amber-800', desc: '수신어음, 수표 등' },
  { key: '상품권' as const, label: '상품권', icon: '🎟️', color: '#8b5cf6', bg: 'bg-violet-50 dark:bg-violet-900/10', border: 'border-violet-200 dark:border-violet-800', desc: '상품권 수입 등' },
]

function AcctIncomeMethods({ catId }: { catId?: string | null }) {
  const [refresh, setRefresh] = useState(0)
  const [newName, setNewName] = useState('')
  const [activeCategory, setActiveCategory] = useState<'계좌' | '현금' | '어음' | '상품권'>('계좌')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const addToast = useToastStore(s => s.add)
  const staffList = useMemo(() => getItem<any[]>('ws_users', []), [])

  const currentYear = new Date().getFullYear()
  const activeYear = parseInt(new URLSearchParams(window.location.hash.split('?')[1] || '').get('year') || '') || parseInt(localStorage.getItem('acct_active_year') || '') || currentYear

  const budgetCats = useMemo(() => {
    const all = getItem<BudgetCat[]>('acct_budget_cats', [])
    return all.filter(c => {
      const cy = c.year || (c.periodFrom ? parseInt(c.periodFrom.substring(0, 4)) : currentYear)
      return cy === activeYear
    })
  }, [refresh, activeYear])

  const selectedCatId = catId || (budgetCats.length > 0 ? String(budgetCats[0].id) : '')
  const selectedCatName = budgetCats.find(c => String(c.id) === selectedCatId)?.name || ''

  void refresh
  const allItems: PayMethodItem[] = useMemo(() => {
    try {
      const raw = localStorage.getItem('acct_income_methods')
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch { return [] }
  }, [refresh])

  const filteredItems = selectedCatId
    ? allItems.filter(i => String(i.budgetCatId) === selectedCatId)
    : allItems
  const catItems = filteredItems.filter(i => i.category === activeCategory)
  const activeCatInfo = INCOME_CATEGORIES.find(c => c.key === activeCategory)!

  const defaultManager = useMemo(() => {
    const cat = budgetCats.find(c => String(c.id) === selectedCatId)
    if (cat?.users && cat.users.length > 0) return cat.users[0]
    return ''
  }, [budgetCats, selectedCatId])

  const saveAll = (updated: PayMethodItem[]) => {
    localStorage.setItem('acct_income_methods', JSON.stringify(updated))
    setRefresh(r => r + 1)
  }

  const handleAdd = () => {
    if (!newName.trim()) return
    const isDuplicate = allItems.some(i =>
      i.name === newName.trim() &&
      i.category === activeCategory &&
      String(i.budgetCatId) === selectedCatId
    )
    if (isDuplicate) {
      addToast('error', '이 예산구분에 이미 존재하는 입금계정입니다')
      return
    }
    const newItem: PayMethodItem = {
      id: Date.now(),
      name: newName.trim(),
      category: activeCategory,
      budgetCatId: selectedCatId || undefined,
      manager: activeCategory === '계좌' ? defaultManager : undefined,
      custodian: activeCategory === '현금' ? defaultManager : undefined,
      noteManager: activeCategory === '어음' ? defaultManager : undefined,
      voucherManager: activeCategory === '상품권' ? defaultManager : undefined,
    }
    saveAll([...allItems, newItem])
    addToast('success', `"${newName.trim()}" 추가됨`)
    setNewName('')
    setExpandedId(newItem.id)
  }

  const handleDelete = (id: number) => {
    const item = allItems.find(i => i.id === id)
    if (!item) return
    if (!confirm(`"${item.name}"을(를) 삭제하시겠습니까?`)) return
    saveAll(allItems.filter(i => i.id !== id))
    addToast('warning', `"${item.name}" 삭제됨`)
    if (expandedId === id) setExpandedId(null)
  }

  const updateField = (id: number, field: keyof PayMethodItem, value: string) => {
    saveAll(allItems.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-[var(--text-primary)] flex items-center gap-2">
            🏦 입금계정 관리
          </h2>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">상단에서 예산구분을 선택하여 입금계정을 관리합니다</p>
        </div>
        <span className="text-xs font-bold text-white bg-emerald-500 px-3 py-1.5 rounded-full">
          {selectedCatName || '전체'} {filteredItems.length}건
        </span>
      </div>

      {/* 카테고리 탭 */}
      <div className="flex gap-2">
        {INCOME_CATEGORIES.map(cat => {
          const count = filteredItems.filter(i => i.category === cat.key).length
          const isActive = activeCategory === cat.key
          return (
            <button
              key={cat.key}
              onClick={() => { setActiveCategory(cat.key); setExpandedId(null) }}
              className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all cursor-pointer ${
                isActive
                  ? `${cat.bg} ${cat.border} shadow-sm`
                  : 'bg-[var(--bg-surface)] border-transparent hover:border-[var(--border-default)]'
              }`}
            >
              <div className="text-center">
                <span className="text-lg">{cat.icon}</span>
                <div className={`text-[12px] font-extrabold mt-1 ${isActive ? '' : 'text-[var(--text-secondary)]'}`} style={isActive ? { color: cat.color } : undefined}>
                  {cat.label}
                </div>
                <div className="text-[10px] font-bold text-[var(--text-muted)] mt-0.5">{count}건</div>
              </div>
            </button>
          )
        })}
      </div>

      {/* 선택된 카테고리 영역 */}
      <div className={`rounded-2xl border-2 ${activeCatInfo.border} ${activeCatInfo.bg} p-5`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">{activeCatInfo.icon}</span>
            <div>
              <h3 className="text-sm font-extrabold" style={{ color: activeCatInfo.color }}>{activeCatInfo.label}</h3>
              <p className="text-[10px] text-[var(--text-muted)]">{activeCatInfo.desc}</p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: activeCatInfo.color, background: `${activeCatInfo.color}15` }}>
            {catItems.length}건
          </span>
        </div>

        {/* 추가 폼 */}
        <div className="flex gap-2 mb-4">
          <input
            placeholder={`새 ${activeCatInfo.label} 입금계정 입력...`}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-[var(--border-default)] bg-white dark:bg-gray-900 text-sm text-[var(--text-primary)] outline-none focus:border-primary-400 transition-colors placeholder:text-[var(--text-muted)]"
          />
          <button
            onClick={handleAdd}
            className="px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-all cursor-pointer hover:shadow-md flex items-center gap-1.5"
            style={{ background: activeCatInfo.color }}
          >
            <Plus size={14} /> 추가
          </button>
        </div>

        {/* 항목 리스트 */}
        {catItems.length === 0 ? (
          <div className="py-8 text-center text-sm text-[var(--text-muted)] rounded-xl border border-dashed border-[var(--border-default)] bg-white/50 dark:bg-gray-900/50">
            등록된 {activeCatInfo.label} 입금계정이 없습니다
          </div>
        ) : (
          <div className="space-y-1.5">
            {catItems.map((item, idx) => {
              const isOpen = expandedId === item.id
              return (
                <div key={item.id} className={`rounded-xl transition-all border ${isOpen ? 'border-[var(--border-default)] bg-white dark:bg-gray-900/60 shadow-sm' : 'border-transparent bg-white/70 dark:bg-gray-900/30 hover:bg-white dark:hover:bg-gray-800/50 hover:border-[var(--border-default)]'}`}>
                  <div
                    className="flex items-center gap-3 px-3.5 py-2.5 cursor-pointer group"
                    onClick={() => setExpandedId(isOpen ? null : item.id)}
                  >
                    <span className="text-[10px] font-bold w-5 text-center shrink-0 rounded-full py-0.5" style={{ color: activeCatInfo.color, background: `${activeCatInfo.color}15` }}>
                      {idx + 1}
                    </span>
                    <span className="text-sm font-semibold text-[var(--text-primary)] flex-1">{item.name}</span>
                    {activeCategory === '계좌' && item.bankName && !isOpen && (
                      <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[200px]">
                        {item.bankName} {item.accountNumber ? `• ${item.accountNumber}` : ''}
                      </span>
                    )}
                    <ChevronDown size={14} className={`text-[var(--text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(item.id) }}
                      className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-danger cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* 상세 필드 (계좌) */}
                  {isOpen && activeCategory === '계좌' && (
                    <div className="px-4 pb-4 pt-1 border-t border-[var(--border-default)] mx-3">
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>은행명 *</label>
                          <input value={item.bankName || ''} onChange={e => updateField(item.id, 'bankName', e.target.value)} placeholder="국민은행" className={DETAIL_INPUT} />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>계좌번호 *</label>
                          <input value={item.accountNumber || ''} onChange={e => updateField(item.id, 'accountNumber', e.target.value)} placeholder="110-234-567890" className={DETAIL_INPUT} />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>예금주 *</label>
                          <input value={item.accountHolder || ''} onChange={e => updateField(item.id, 'accountHolder', e.target.value)} placeholder="(주)문화재청" className={DETAIL_INPUT} />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>계좌관리자 *</label>
                          <select value={item.manager || ''} onChange={e => updateField(item.id, 'manager', e.target.value)} className={DETAIL_INPUT}>
                            <option value="">선택하세요</option>
                            {staffList.map((s: any) => (
                              <option key={s.id || s.name} value={s.name}>{s.name}{s.role ? ` (${s.role})` : ''}{s.dept ? ` - ${s.dept}` : ''}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>용도</label>
                          <input value={item.purpose || ''} onChange={e => updateField(item.id, 'purpose', e.target.value)} placeholder="보조금 수입, 사업비 등" className={DETAIL_INPUT} />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>메모</label>
                          <input value={item.memo || ''} onChange={e => updateField(item.id, 'memo', e.target.value)} placeholder="참고사항" className={DETAIL_INPUT} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 상세 필드 (현금) */}
                  {isOpen && activeCategory === '현금' && (
                    <div className="px-4 pb-4 pt-1 border-t border-[var(--border-default)] mx-3">
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>보관처 *</label>
                          <input value={item.storageLocation || ''} onChange={e => updateField(item.id, 'storageLocation' as any, e.target.value)} placeholder="사무실 금고 등" className={DETAIL_INPUT} />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>보관책임자 *</label>
                          <select value={item.custodian || ''} onChange={e => updateField(item.id, 'custodian' as any, e.target.value)} className={DETAIL_INPUT}>
                            <option value="">선택하세요</option>
                            {staffList.map((s: any) => (
                              <option key={s.id || s.name} value={s.name}>{s.name}{s.role ? ` (${s.role})` : ''}{s.dept ? ` - ${s.dept}` : ''}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>용도</label>
                          <input value={item.purpose || ''} onChange={e => updateField(item.id, 'purpose', e.target.value)} placeholder="현금 수납 등" className={DETAIL_INPUT} />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>메모</label>
                          <input value={item.memo || ''} onChange={e => updateField(item.id, 'memo', e.target.value)} placeholder="참고사항" className={DETAIL_INPUT} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 상세 필드 (어음) */}
                  {isOpen && activeCategory === '어음' && (
                    <div className="px-4 pb-4 pt-1 border-t border-[var(--border-default)] mx-3">
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>구분 *</label>
                          <select value={item.noteType || ''} onChange={e => updateField(item.id, 'noteType' as any, e.target.value)} className={DETAIL_INPUT}>
                            <option value="">선택하세요</option>
                            <option value="수신">수신 (받을어음)</option>
                          </select>
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>담당자 *</label>
                          <select value={item.noteManager || ''} onChange={e => updateField(item.id, 'noteManager' as any, e.target.value)} className={DETAIL_INPUT}>
                            <option value="">선택하세요</option>
                            {staffList.map((s: any) => (
                              <option key={s.id || s.name} value={s.name}>{s.name}{s.role ? ` (${s.role})` : ''}{s.dept ? ` - ${s.dept}` : ''}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>메모</label>
                          <input value={item.memo || ''} onChange={e => updateField(item.id, 'memo', e.target.value)} placeholder="참고사항" className={DETAIL_INPUT} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 상세 필드 (상품권) */}
                  {isOpen && activeCategory === '상품권' && (
                    <div className="px-4 pb-4 pt-1 border-t border-[var(--border-default)] mx-3">
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>금액 *</label>
                          <input
                            value={item.voucherAmount ? item.voucherAmount.toLocaleString() : ''}
                            onChange={e => {
                              const num = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0
                              saveAll(allItems.map(i => i.id === item.id ? { ...i, voucherAmount: num } : i))
                            }}
                            placeholder="50,000"
                            className={DETAIL_INPUT}
                          />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>담당자 *</label>
                          <select value={item.voucherManager || ''} onChange={e => updateField(item.id, 'voucherManager' as any, e.target.value)} className={DETAIL_INPUT}>
                            <option value="">선택하세요</option>
                            {staffList.map((s: any) => (
                              <option key={s.id || s.name} value={s.name}>{s.name}{s.role ? ` (${s.role})` : ''}{s.dept ? ` - ${s.dept}` : ''}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>메모</label>
                          <input value={item.memo || ''} onChange={e => updateField(item.id, 'memo', e.target.value)} placeholder="참고사항" className={DETAIL_INPUT} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══ 수단등록 (지출수단 + 입금계정 통합) ═══ */
function AcctMethodReg({ catId }: { catId?: string | null }) {
  const [refresh, setRefresh] = useState(0)
  const [direction, setDirection] = useState<'expense' | 'income'>('expense')
  const [newName, setNewName] = useState('')
  const [activeCategory, setActiveCategory] = useState<'계좌' | '현금' | '어음' | '상품권'>('계좌')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [showExpenseList, setShowExpenseList] = useState(false)
  const [checkedExpenseIds, setCheckedExpenseIds] = useState<number[]>([])
  const addToast = useToastStore(s => s.add)
  const staffList = useMemo(() => getItem<any[]>('ws_users', []), [])
  const allAccounts: AcctAccount[] = useMemo(() => getItem('acct_accounts', []), [refresh])

  const currentYear = new Date().getFullYear()
  const activeYear = parseInt(new URLSearchParams(window.location.hash.split('?')[1] || '').get('year') || '') || parseInt(localStorage.getItem('acct_active_year') || '') || currentYear

  const budgetCats = useMemo(() => {
    const all = getItem<BudgetCat[]>('acct_budget_cats', [])
    return all.filter(c => {
      const cy = c.year || (c.periodFrom ? parseInt(c.periodFrom.substring(0, 4)) : currentYear)
      return cy === activeYear
    })
  }, [refresh, activeYear])

  const selectedCatId = catId || (budgetCats.length > 0 ? String(budgetCats[0].id) : '')
  const selectedCatName = budgetCats.find(c => String(c.id) === selectedCatId)?.name || ''

  // 데이터 키: 지출은 acct_pay_methods_v2, 입금은 acct_income_methods
  const storageKey = direction === 'expense' ? 'acct_pay_methods_v2' : 'acct_income_methods'

  void refresh
  const allItems: PayMethodItem[] = useMemo(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return direction === 'expense' ? DEFAULT_PAY_ITEMS : []
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return direction === 'expense' ? DEFAULT_PAY_ITEMS : []
      return parsed as PayMethodItem[]
    } catch { return direction === 'expense' ? DEFAULT_PAY_ITEMS : [] }
  }, [refresh, direction, storageKey])

  // 입금 모드에서 참조할 지출수단 리스트
  const expenseItems: PayMethodItem[] = useMemo(() => {
    if (direction !== 'income') return []
    try {
      const raw = localStorage.getItem('acct_pay_methods_v2')
      if (!raw) return DEFAULT_PAY_ITEMS
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed as PayMethodItem[] : DEFAULT_PAY_ITEMS
    } catch { return DEFAULT_PAY_ITEMS }
  }, [refresh, direction])

  const filteredExpenseItems = useMemo(() => {
    const items = selectedCatId ? expenseItems.filter(i => String(i.budgetCatId) === selectedCatId) : expenseItems
    return items.filter(i => i.category === activeCategory)
  }, [expenseItems, selectedCatId, activeCategory])

  const filteredItems = selectedCatId
    ? allItems.filter(i => String(i.budgetCatId) === selectedCatId)
    : allItems
  const catItems = filteredItems.filter(i => i.category === activeCategory)
  const activeCatInfo = PAY_CATEGORIES.find(c => c.key === activeCategory)!

  const defaultManager = useMemo(() => {
    const cat = budgetCats.find(c => String(c.id) === selectedCatId)
    if (cat?.users && cat.users.length > 0) return cat.users[0]
    return ''
  }, [budgetCats, selectedCatId])

  const saveAll = (updated: PayMethodItem[]) => {
    localStorage.setItem(storageKey, JSON.stringify(updated))
    if (direction === 'expense') {
      localStorage.setItem('acct_payment_methods', JSON.stringify(updated.map(i => i.name)))
    }
    setRefresh(r => r + 1)
  }

  const handleAdd = () => {
    if (!newName.trim()) return
    const isDuplicate = allItems.some(i =>
      i.name === newName.trim() &&
      i.category === activeCategory &&
      String(i.budgetCatId) === selectedCatId
    )
    if (isDuplicate) {
      addToast('error', `이 예산구분에 이미 존재하는 ${direction === 'expense' ? '지출수단' : '입금계정'}입니다`)
      return
    }
    const newItem: PayMethodItem = {
      id: Date.now(),
      name: newName.trim(),
      category: activeCategory,
      budgetCatId: selectedCatId || undefined,
      manager: activeCategory === '계좌' ? defaultManager : undefined,
      custodian: activeCategory === '현금' ? defaultManager : undefined,
      noteManager: activeCategory === '어음' ? defaultManager : undefined,
      voucherManager: activeCategory === '상품권' ? defaultManager : undefined,
    }
    saveAll([...allItems, newItem])
    addToast('success', `"${newName.trim()}" 추가됨`)
    setNewName('')
    setExpandedId(newItem.id)
  }

  const handleDelete = (id: number) => {
    const item = allItems.find(i => i.id === id)
    if (!item) return
    if (!confirm(`"${item.name}"을(를) 삭제하시겠습니까?`)) return
    saveAll(allItems.filter(i => i.id !== id))
    addToast('warning', `"${item.name}" 삭제됨`)
    if (expandedId === id) setExpandedId(null)
  }

  const updateField = (id: number, field: string, value: any) => {
    saveAll(allItems.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  // ── 카드 CRUD (지출수단 계좌만) ──
  const addCard = (itemId: number) => {
    const newCard: PayMethodCard = { id: Date.now(), cardName: '', cardCompany: '', cardNumber: '', cardType: '체크카드', cardUser: defaultManager }
    saveAll(allItems.map(i => i.id === itemId ? { ...i, cards: [...(i.cards || []), newCard] } : i))
  }
  const updateCard = (itemId: number, cardId: number, field: keyof PayMethodCard, value: string | number) => {
    saveAll(allItems.map(i => i.id === itemId ? { ...i, cards: (i.cards || []).map(c => c.id === cardId ? { ...c, [field]: value } : c) } : i))
  }
  const deleteCard = (itemId: number, cardId: number) => {
    saveAll(allItems.map(i => i.id === itemId ? { ...i, cards: (i.cards || []).filter(c => c.id !== cardId) } : i))
  }

  // ── 어음 CRUD ──
  const addNote = (itemId: number) => {
    const item = allItems.find(i => i.id === itemId)
    const newNote: PayMethodNote = { id: Date.now(), noteNumber: '', issuer: item?.noteType === '발행' ? '우리회사' : '', receiver: item?.noteType === '수신' ? '우리회사' : '', amount: 0, issueDate: new Date().toISOString().slice(0, 10), maturityDate: '', endorsement: '', bank: '', status: '미결제' }
    saveAll(allItems.map(i => i.id === itemId ? { ...i, notes: [...(i.notes || []), newNote] } : i))
  }
  const updateNote = (itemId: number, noteId: number, field: keyof PayMethodNote, value: string | number) => {
    saveAll(allItems.map(i => i.id === itemId ? { ...i, notes: (i.notes || []).map(n => n.id === noteId ? { ...n, [field]: value } : n) } : i))
  }
  const deleteNote = (itemId: number, noteId: number) => {
    saveAll(allItems.map(i => i.id === itemId ? { ...i, notes: (i.notes || []).filter(n => n.id !== noteId) } : i))
  }

  const dirLabel = direction === 'expense' ? '지출수단' : '입금계정'

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-[var(--text-primary)] flex items-center gap-2">
            💳 수단등록
          </h2>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">예산구분별 지출수단과 입금계정을 통합 관리합니다</p>
        </div>
        <span className="text-xs font-bold text-white px-3 py-1.5 rounded-full" style={{ background: direction === 'expense' ? '#f97316' : '#22c55e' }}>
          {selectedCatName || '전체'} • {dirLabel} {filteredItems.length}건
        </span>
      </div>

      {/* 지출/입금 전환 */}
      <div className="flex items-center gap-1 bg-[var(--bg-muted)] rounded-lg px-1 py-0.5 border border-[var(--border-default)] w-fit">
        <button
          onClick={() => { setDirection('expense'); setExpandedId(null); setNewName(''); setShowExpenseList(false) }}
          className={cn('px-3 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1',
            direction === 'expense' ? 'bg-orange-500 text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          )}
        >
          <ArrowUpCircle size={12} /> 지출
        </button>
        <button
          onClick={() => { setDirection('income'); setExpandedId(null); setNewName(''); setShowExpenseList(false) }}
          className={cn('px-3 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1',
            direction === 'income' ? 'bg-emerald-500 text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          )}
        >
          <ArrowDownCircle size={12} /> 입금
        </button>
      </div>

      {/* 카테고리 탭 */}
      <div className="flex gap-2">
        {PAY_CATEGORIES.map(cat => {
          const count = filteredItems.filter(i => i.category === cat.key).length
          const isActive = activeCategory === cat.key
          return (
            <button
              key={cat.key}
              onClick={() => { setActiveCategory(cat.key); setExpandedId(null) }}
              className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all cursor-pointer ${
                isActive ? `${cat.bg} ${cat.border} shadow-sm` : 'bg-[var(--bg-surface)] border-transparent hover:border-[var(--border-default)]'
              }`}
            >
              <div className="text-center">
                <span className="text-lg">{cat.icon}</span>
                <div className={`text-[12px] font-extrabold mt-1 ${isActive ? '' : 'text-[var(--text-secondary)]'}`} style={isActive ? { color: cat.color } : undefined}>{cat.label}</div>
                <div className="text-[10px] font-bold text-[var(--text-muted)] mt-0.5">{count}건</div>
              </div>
            </button>
          )
        })}
      </div>

      {/* 선택된 카테고리 영역 */}
      <div className={`rounded-2xl border-2 ${activeCatInfo.border} ${activeCatInfo.bg} p-5`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">{activeCatInfo.icon}</span>
            <div>
              <h3 className="text-sm font-extrabold" style={{ color: activeCatInfo.color }}>{activeCatInfo.label} {dirLabel}</h3>
              <p className="text-[10px] text-[var(--text-muted)]">{activeCatInfo.desc}</p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: activeCatInfo.color, background: `${activeCatInfo.color}15` }}>{catItems.length}건</span>
        </div>

        {/* 추가 폼 */}
        <div className="relative mb-4">
          <div className="flex gap-2">
            <input
              placeholder={direction === 'income' ? `${activeCatInfo.label} 입금계정 입력 또는 Enter로 지출수단 선택...` : `새 ${activeCatInfo.label} 지출수단 입력...`}
              value={newName}
              onChange={e => { setNewName(e.target.value); if (direction === 'income') setShowExpenseList(true) }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  if (direction === 'income' && !newName.trim()) {
                    e.preventDefault()
                    setShowExpenseList(!showExpenseList)
                  } else {
                    handleAdd()
                    setShowExpenseList(false)
                  }
                }
                if (e.key === 'Escape') setShowExpenseList(false)
              }}
              onFocus={() => { if (direction === 'income') setShowExpenseList(true) }}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-[var(--border-default)] bg-white dark:bg-gray-900 text-sm text-[var(--text-primary)] outline-none focus:border-primary-400 transition-colors placeholder:text-[var(--text-muted)]"
            />
            <button onClick={() => { handleAdd(); setShowExpenseList(false) }} className="px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-all cursor-pointer hover:shadow-md flex items-center gap-1.5" style={{ background: activeCatInfo.color }}>
              <Plus size={14} /> 추가
            </button>
          </div>

          {/* 입금 모드: 지출수단 복수선택 드롭다운 */}
          {direction === 'income' && showExpenseList && (() => {
            const visibleItems = filteredExpenseItems.filter(ei => !newName.trim() || ei.name.toLowerCase().includes(newName.toLowerCase()))
            const selectableItems = visibleItems.filter(ei => !catItems.some(ci => ci.name === ei.name))
            const checkedCount = checkedExpenseIds.length
            return (
            <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white dark:bg-gray-900 rounded-xl border border-[var(--border-default)] shadow-lg max-h-[320px] flex flex-col">
              {/* 헤더 */}
              <div className="p-2.5 border-b border-[var(--border-default)] flex items-center justify-between shrink-0">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">📋 지출수단에서 선택 ({filteredExpenseItems.length}건)</span>
                <div className="flex items-center gap-2">
                  {selectableItems.length > 0 && (
                    <button
                      onClick={() => {
                        if (checkedExpenseIds.length === selectableItems.length) {
                          setCheckedExpenseIds([])
                        } else {
                          setCheckedExpenseIds(selectableItems.map(i => i.id))
                        }
                      }}
                      className="text-[10px] font-bold text-primary-500 hover:text-primary-700 cursor-pointer"
                    >
                      {checkedExpenseIds.length === selectableItems.length ? '전체해제' : '전체선택'}
                    </button>
                  )}
                  {checkedCount > 0 && (
                    <button
                      onClick={() => {
                        const incomeAll: PayMethodItem[] = (() => { try { return JSON.parse(localStorage.getItem('acct_income_methods') || '[]') } catch { return [] } })()
                        const toAdd = filteredExpenseItems.filter(ei => checkedExpenseIds.includes(ei.id) && !catItems.some(ci => ci.name === ei.name))
                        const newItems = toAdd.map((ei, i) => ({ ...ei, id: Date.now() + i, budgetCatId: selectedCatId || undefined }))
                        localStorage.setItem('acct_income_methods', JSON.stringify([...incomeAll, ...newItems]))
                        setRefresh(r => r + 1)
                        addToast('success', `${newItems.length}건 입금계정에 추가됨`)
                        setShowExpenseList(false)
                        setCheckedExpenseIds([])
                        setNewName('')
                      }}
                      className="px-3 py-1 rounded-lg bg-emerald-500 text-white text-[11px] font-bold cursor-pointer hover:bg-emerald-600 flex items-center gap-1 shadow-sm"
                    >
                      <Check size={12} /> {checkedCount}건 추가
                    </button>
                  )}
                </div>
              </div>
              {/* 리스트 */}
              <div className="overflow-y-auto flex-1">
              {filteredExpenseItems.length === 0 ? (
                <div className="p-4 text-center text-[11px] text-[var(--text-muted)]">
                  이 예산의 {activeCatInfo.label} 지출수단이 없습니다. 직접 입력 후 추가하세요.
                </div>
              ) : (
                visibleItems.map(ei => {
                    const alreadyAdded = catItems.some(ci => ci.name === ei.name)
                    const isChecked = checkedExpenseIds.includes(ei.id)
                    return (
                      <button
                        key={ei.id}
                        onClick={() => {
                          if (alreadyAdded) return
                          setCheckedExpenseIds(prev => isChecked ? prev.filter(id => id !== ei.id) : [...prev, ei.id])
                        }}
                        className={cn(
                          'w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors',
                          alreadyAdded ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[var(--bg-muted)] cursor-pointer',
                          isChecked && !alreadyAdded && 'bg-emerald-50/50 dark:bg-emerald-900/10'
                        )}
                      >
                        {/* 체크박스 */}
                        <div className={cn(
                          'w-4.5 h-4.5 rounded border-2 flex items-center justify-center shrink-0 transition-all',
                          alreadyAdded ? 'border-emerald-300 bg-emerald-100' : isChecked ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300 dark:border-gray-600'
                        )}>
                          {(isChecked || alreadyAdded) && <Check size={10} className={alreadyAdded ? 'text-emerald-400' : 'text-white'} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold text-[var(--text-primary)]">{ei.name}</span>
                          {ei.bankName && <span className="text-[10px] text-[var(--text-muted)] ml-2">{ei.bankName} {ei.accountNumber || ''}</span>}
                        </div>
                        {alreadyAdded && <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">등록됨</span>}
                        {(ei as any).accountCode && <span className="text-[9px] font-bold text-violet-500 bg-violet-50 dark:bg-violet-900/20 px-1.5 py-0.5 rounded">{(ei as any).accountCode}</span>}
                      </button>
                    )
                  })
              )}
              </div>
              {newName.trim() && !filteredExpenseItems.some(ei => ei.name === newName.trim()) && (
                <div className="p-2 border-t border-[var(--border-default)] shrink-0">
                  <button
                    onClick={() => { handleAdd(); setShowExpenseList(false); setCheckedExpenseIds([]) }}
                    className="w-full text-left px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 text-sm font-bold hover:bg-emerald-100 cursor-pointer flex items-center gap-2"
                  >
                    <Plus size={14} /> "{newName.trim()}" 새로 추가
                  </button>
                </div>
              )}
            </div>
            )
          })()}
        </div>

        {/* 항목 리스트 */}
        {catItems.length === 0 ? (
          <div className="py-8 text-center text-sm text-[var(--text-muted)] rounded-xl border border-dashed border-[var(--border-default)] bg-white/50 dark:bg-gray-900/50">
            등록된 {activeCatInfo.label} {dirLabel}이 없습니다
          </div>
        ) : (
          <div className="space-y-1.5">
            {catItems.map((item, idx) => {
              const isOpen = expandedId === item.id
              return (
                <div key={item.id} className={`rounded-xl transition-all border ${isOpen ? 'border-[var(--border-default)] bg-white dark:bg-gray-900/60 shadow-sm' : 'border-transparent bg-white/70 dark:bg-gray-900/30 hover:bg-white dark:hover:bg-gray-800/50 hover:border-[var(--border-default)]'}`}>
                  {/* 메인 행 */}
                  <div className="flex items-center gap-3 px-3.5 py-2.5 cursor-pointer group" onClick={() => setExpandedId(isOpen ? null : item.id)}>
                    <span className="text-[10px] font-bold w-5 text-center shrink-0 rounded-full py-0.5" style={{ color: activeCatInfo.color, background: `${activeCatInfo.color}15` }}>{idx + 1}</span>
                    <span className="text-sm font-semibold text-[var(--text-primary)] flex-1">{item.name}</span>
                    {activeCategory === '계좌' && item.bankName && !isOpen && (
                      <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[200px]">{item.bankName} {item.accountNumber ? `• ${item.accountNumber}` : ''}</span>
                    )}
                    {/* 연결된 계정과목 표시 */}
                    {(item as any).accountCode && !isOpen && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-violet-50 dark:bg-violet-900/20 text-violet-600">{(item as any).accountCode}</span>
                    )}
                    <ChevronDown size={14} className={`text-[var(--text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    <button onClick={e => { e.stopPropagation(); handleDelete(item.id) }} className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-danger cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* 상세 필드 */}
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 border-t border-[var(--border-default)] mx-3">
                      {/* 계정과목 연결 */}
                      <div className="mb-3 mt-3 p-3 rounded-lg bg-violet-50/50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800">
                        {direction === 'income' ? (
                          <>
                            <label className="text-[11px] font-bold text-violet-600 mb-2 block">📋 계정과목 연결 (입금전표 자동 설정)</label>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] font-bold text-blue-500 mb-1 block">💰 차변 (입금처 - 자산계정)</label>
                                <select
                                  value={(item as any).accountCode || ''}
                                  onChange={e => updateField(item.id, 'accountCode', e.target.value)}
                                  className={DETAIL_INPUT}
                                >
                                  <option value="">— 입금계정 선택 —</option>
                                  {allAccounts.filter(a => a.active !== false && (a as any).incomeEnabled === true).map(a => (
                                    <option key={a.code} value={`${a.code} ${a.name}`}>{a.code} {a.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-emerald-500 mb-1 block">📈 대변 (수익계정)</label>
                                <select
                                  value={(item as any).revenueAccountCode || ''}
                                  onChange={e => updateField(item.id, 'revenueAccountCode', e.target.value)}
                                  className={DETAIL_INPUT}
                                >
                                  <option value="">— 수익계정 선택 —</option>
                                  {allAccounts.filter(a => a.active !== false && a.type === 'revenue').map(a => (
                                    <option key={a.code} value={`${a.code} ${a.name}`}>{a.code} {a.name}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <label className="text-[11px] font-bold text-violet-600 mb-1 block">📋 계정과목 연결</label>
                            <select
                              value={(item as any).accountCode || ''}
                              onChange={e => updateField(item.id, 'accountCode', e.target.value)}
                              className={DETAIL_INPUT}
                            >
                              <option value="">— 계정과목 선택 —</option>
                              {allAccounts.filter(a => a.active !== false).map(a => (
                                <option key={a.code} value={`${a.code} ${a.name}`}>{a.code} {a.name}</option>
                              ))}
                            </select>
                          </>
                        )}
                      </div>

                      {/* 계좌 상세 */}
                      {activeCategory === '계좌' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className={DETAIL_FIELD_LABEL}>은행명 *</label><input value={item.bankName || ''} onChange={e => updateField(item.id, 'bankName', e.target.value)} placeholder="국민은행" className={DETAIL_INPUT} /></div>
                          <div><label className={DETAIL_FIELD_LABEL}>계좌번호 *</label><input value={item.accountNumber || ''} onChange={e => updateField(item.id, 'accountNumber', e.target.value)} placeholder="110-234-567890" className={DETAIL_INPUT} /></div>
                          <div><label className={DETAIL_FIELD_LABEL}>예금주 *</label><input value={item.accountHolder || ''} onChange={e => updateField(item.id, 'accountHolder', e.target.value)} placeholder="(주)문화재청" className={DETAIL_INPUT} /></div>
                          <div>
                            <label className={DETAIL_FIELD_LABEL}>계좌관리자 *</label>
                            <select value={item.manager || ''} onChange={e => updateField(item.id, 'manager', e.target.value)} className={DETAIL_INPUT}>
                              <option value="">선택하세요</option>
                              {staffList.map((s: any) => (<option key={s.id || s.name} value={s.name}>{s.name}{s.role ? ` (${s.role})` : ''}{s.dept ? ` - ${s.dept}` : ''}</option>))}
                            </select>
                          </div>
                          <div><label className={DETAIL_FIELD_LABEL}>용도</label><input value={item.purpose || ''} onChange={e => updateField(item.id, 'purpose', e.target.value)} placeholder="운영자금 등" className={DETAIL_INPUT} /></div>
                          <div><label className={DETAIL_FIELD_LABEL}>메모</label><input value={item.memo || ''} onChange={e => updateField(item.id, 'memo', e.target.value)} placeholder="참고사항" className={DETAIL_INPUT} /></div>
                        </div>
                      )}

                      {/* 현금 상세 */}
                      {activeCategory === '현금' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className={DETAIL_FIELD_LABEL}>보관처 *</label><input value={item.storageLocation || ''} onChange={e => updateField(item.id, 'storageLocation', e.target.value)} placeholder="사무실 금고" className={DETAIL_INPUT} /></div>
                          <div>
                            <label className={DETAIL_FIELD_LABEL}>보관책임자 *</label>
                            <select value={item.custodian || ''} onChange={e => updateField(item.id, 'custodian', e.target.value)} className={DETAIL_INPUT}>
                              <option value="">선택하세요</option>
                              {staffList.map((s: any) => (<option key={s.id || s.name} value={s.name}>{s.name}{s.role ? ` (${s.role})` : ''}{s.dept ? ` - ${s.dept}` : ''}</option>))}
                            </select>
                          </div>
                          <div><label className={DETAIL_FIELD_LABEL}>용도</label><input value={item.purpose || ''} onChange={e => updateField(item.id, 'purpose', e.target.value)} placeholder="소액경비 등" className={DETAIL_INPUT} /></div>
                          <div><label className={DETAIL_FIELD_LABEL}>메모</label><input value={item.memo || ''} onChange={e => updateField(item.id, 'memo', e.target.value)} placeholder="참고사항" className={DETAIL_INPUT} /></div>
                        </div>
                      )}

                      {/* 어음 상세 */}
                      {activeCategory === '어음' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={DETAIL_FIELD_LABEL}>구분 *</label>
                            <select value={item.noteType || ''} onChange={e => updateField(item.id, 'noteType', e.target.value)} className={DETAIL_INPUT}>
                              <option value="">선택하세요</option>
                              <option value="수신">수신 (받을어음)</option>
                              {direction === 'expense' && <option value="발행">발행 (지급어음)</option>}
                            </select>
                          </div>
                          <div>
                            <label className={DETAIL_FIELD_LABEL}>담당자 *</label>
                            <select value={item.noteManager || ''} onChange={e => updateField(item.id, 'noteManager', e.target.value)} className={DETAIL_INPUT}>
                              <option value="">선택하세요</option>
                              {staffList.map((s: any) => (<option key={s.id || s.name} value={s.name}>{s.name}{s.role ? ` (${s.role})` : ''}{s.dept ? ` - ${s.dept}` : ''}</option>))}
                            </select>
                          </div>
                          <div><label className={DETAIL_FIELD_LABEL}>메모</label><input value={item.memo || ''} onChange={e => updateField(item.id, 'memo', e.target.value)} placeholder="참고사항" className={DETAIL_INPUT} /></div>
                        </div>
                      )}

                      {/* 상품권 상세 */}
                      {activeCategory === '상품권' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={DETAIL_FIELD_LABEL}>금액 *</label>
                            <input value={item.voucherAmount ? item.voucherAmount.toLocaleString() : ''} onChange={e => { const num = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0; saveAll(allItems.map(i => i.id === item.id ? { ...i, voucherAmount: num } : i)) }} placeholder="50,000" className={DETAIL_INPUT} />
                          </div>
                          <div>
                            <label className={DETAIL_FIELD_LABEL}>담당자 *</label>
                            <select value={item.voucherManager || ''} onChange={e => updateField(item.id, 'voucherManager', e.target.value)} className={DETAIL_INPUT}>
                              <option value="">선택하세요</option>
                              {staffList.map((s: any) => (<option key={s.id || s.name} value={s.name}>{s.name}{s.role ? ` (${s.role})` : ''}{s.dept ? ` - ${s.dept}` : ''}</option>))}
                            </select>
                          </div>
                          <div><label className={DETAIL_FIELD_LABEL}>메모</label><input value={item.memo || ''} onChange={e => updateField(item.id, 'memo', e.target.value)} placeholder="참고사항" className={DETAIL_INPUT} /></div>
                        </div>
                      )}

                      {/* 카드 관리 (지출수단 계좌만) */}
                      {direction === 'expense' && activeCategory === '계좌' && (
                        <div className="mt-5 pt-4 border-t border-dashed border-blue-200 dark:border-blue-800">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-1.5">
                              <CreditCard size={14} className="text-blue-500" />
                              <span className="text-[12px] font-extrabold text-[var(--text-primary)]">연결 카드</span>
                              {(item.cards || []).length > 0 && <span className="text-[9px] font-bold bg-blue-100 dark:bg-blue-900/20 text-blue-600 px-1.5 py-0.5 rounded">{(item.cards || []).length}장</span>}
                            </div>
                            <button onClick={() => addCard(item.id)} className="text-[11px] font-bold text-blue-500 hover:text-blue-700 cursor-pointer flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><Plus size={12} /> 카드 추가</button>
                          </div>
                          {(!item.cards || item.cards.length === 0) ? (
                            <div className="py-4 text-center text-[11px] text-[var(--text-muted)] rounded-lg border border-dashed border-[var(--border-default)] bg-white/50 dark:bg-gray-900/30">등록된 카드가 없습니다</div>
                          ) : (
                            <div className="space-y-2">
                              {item.cards.map((card, ci) => (
                                <div key={card.id} className="rounded-lg border border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/5 p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-blue-500">💳 카드 {ci + 1}</span>
                                    <button onClick={() => deleteCard(item.id, card.id)} className="text-[10px] text-red-400 hover:text-red-600 cursor-pointer flex items-center gap-0.5"><Trash2 size={10} /> 삭제</button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div><label className={DETAIL_FIELD_LABEL}>카드명 *</label><input value={card.cardName} onChange={e => updateCard(item.id, card.id, 'cardName', e.target.value)} placeholder="법인카드1" className={DETAIL_INPUT} /></div>
                                    <div><label className={DETAIL_FIELD_LABEL}>카드사 *</label><input value={card.cardCompany} onChange={e => updateCard(item.id, card.id, 'cardCompany', e.target.value)} placeholder="국민카드" className={DETAIL_INPUT} /></div>
                                    <div><label className={DETAIL_FIELD_LABEL}>카드번호 *</label><input value={card.cardNumber} onChange={e => { const raw = e.target.value.replace(/[^0-9]/g, '').slice(0, 16); updateCard(item.id, card.id, 'cardNumber', raw.replace(/(.{4})/g, '$1-').replace(/-$/, '')) }} placeholder="1234-5678-9012-3456" className={DETAIL_INPUT} /></div>
                                    <div><label className={DETAIL_FIELD_LABEL}>카드종류 *</label><select value={card.cardType} onChange={e => updateCard(item.id, card.id, 'cardType', e.target.value)} className={DETAIL_INPUT}><option value="체크카드">체크카드</option><option value="신용카드">신용카드</option></select></div>
                                    <div>
                                      <label className={DETAIL_FIELD_LABEL}>사용자 *</label>
                                      <select value={card.cardUser} onChange={e => updateCard(item.id, card.id, 'cardUser', e.target.value)} className={DETAIL_INPUT}>
                                        <option value="">선택하세요</option>
                                        {staffList.map((s: any) => (<option key={s.id || s.name} value={s.name}>{s.name}{s.role ? ` (${s.role})` : ''}</option>))}
                                      </select>
                                    </div>
                                    <div><label className={DETAIL_FIELD_LABEL}>유효기간</label><input value={card.expiryDate || ''} onChange={e => { const raw = e.target.value.replace(/[^0-9]/g, '').slice(0, 4); updateCard(item.id, card.id, 'expiryDate', raw.length > 2 ? `${raw.slice(0, 2)}/${raw.slice(2)}` : raw) }} placeholder="MM/YY" maxLength={5} className={DETAIL_INPUT} /></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 어음대장 (지출수단 어음만) */}
                      {direction === 'expense' && activeCategory === '어음' && item.noteType && (
                        <div className="mt-5 pt-4 border-t border-dashed border-amber-200 dark:border-amber-800">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-1.5">
                              <ScrollText size={14} className="text-amber-500" />
                              <span className="text-[12px] font-extrabold text-[var(--text-primary)]">어음대장</span>
                              {(item.notes || []).length > 0 && <span className="text-[9px] font-bold bg-amber-100 dark:bg-amber-900/20 text-amber-600 px-1.5 py-0.5 rounded">{(item.notes || []).length}건</span>}
                            </div>
                            <button onClick={() => addNote(item.id)} className="text-[11px] font-bold text-amber-500 hover:text-amber-700 cursor-pointer flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"><Plus size={12} /> 어음 추가</button>
                          </div>
                          {(!item.notes || item.notes.length === 0) ? (
                            <div className="py-4 text-center text-[11px] text-[var(--text-muted)] rounded-lg border border-dashed border-[var(--border-default)] bg-white/50 dark:bg-gray-900/30">등록된 어음이 없습니다</div>
                          ) : (
                            <div className="space-y-2">
                              {item.notes.map((note, ni) => (
                                <div key={note.id} className="rounded-lg border border-amber-100 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-900/5 p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-amber-500">📄 어음 {ni + 1}</span>
                                    <button onClick={() => deleteNote(item.id, note.id)} className="text-[10px] text-red-400 hover:text-red-600 cursor-pointer flex items-center gap-0.5"><Trash2 size={10} /> 삭제</button>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2">
                                    <div><label className={DETAIL_FIELD_LABEL}>어음번호 *</label><input value={note.noteNumber} onChange={e => updateNote(item.id, note.id, 'noteNumber', e.target.value)} placeholder="A-2026-001" className={DETAIL_INPUT} /></div>
                                    <div><label className={DETAIL_FIELD_LABEL}>{item.noteType === '수신' ? '발행인' : '수취인'} *</label><input value={item.noteType === '수신' ? note.issuer : note.receiver} onChange={e => updateNote(item.id, note.id, item.noteType === '수신' ? 'issuer' : 'receiver', e.target.value)} placeholder="거래처명" className={DETAIL_INPUT} /></div>
                                    <div><label className={DETAIL_FIELD_LABEL}>금액 *</label><input value={note.amount ? note.amount.toLocaleString() : ''} onChange={e => updateNote(item.id, note.id, 'amount', parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0)} placeholder="5,000,000" className={DETAIL_INPUT} /></div>
                                    <div><label className={DETAIL_FIELD_LABEL}>발행일 *</label><input type="date" value={note.issueDate} onChange={e => updateNote(item.id, note.id, 'issueDate', e.target.value)} className={DETAIL_INPUT} /></div>
                                    <div><label className={DETAIL_FIELD_LABEL}>만기일 *</label><input type="date" value={note.maturityDate} onChange={e => updateNote(item.id, note.id, 'maturityDate', e.target.value)} className={DETAIL_INPUT} /></div>
                                    <div>
                                      <label className={DETAIL_FIELD_LABEL}>상태 *</label>
                                      <select value={note.status} onChange={e => updateNote(item.id, note.id, 'status', e.target.value)} className={DETAIL_INPUT}>
                                        <option value="미결제">미결제</option>
                                        {item.noteType === '수신' && <option value="추심중">추심중</option>}
                                        <option value="결제완료">결제완료</option>
                                        <option value="부도">부도</option>
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   입출금내역 (CashFlow List)
   ═══════════════════════════════════════════ */
function AcctCashflowList({ year }: { year: number }) {
  const [refresh, setRefresh] = useState(0)
  const currentUserName = useAuthStore.getState().user?.name || ''

  // ── 데이터 로드 ──
  const cashflows: any[] = useMemo(() => getItem('acct_cashflows', []), [refresh])
  const approvals: any[] = useMemo(() => getItem('acct_approvals', []), [refresh])
  const budgetCats: any[] = useMemo(() => getItem('acct_budget_cats', []), [refresh])
  const staffList: any[] = useMemo(() => getItem('acct_staff', []), [refresh])

  // ── 필터 상태 ──
  const today = new Date().toISOString().slice(0, 10)
  const yearStart = `${year}-01-01`
  const yearEnd = `${year}-12-31`
  const [dateFrom, setDateFrom] = useState(yearStart)
  const [dateTo, setDateTo] = useState(yearEnd)
  const [filterCat, setFilterCat] = useState('')
  const [filterManager, setFilterManager] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [searchText, setSearchText] = useState('')
  const [cardFilter, setCardFilter] = useState<'' | 'receivable' | 'payable' | 'incomeScheduled' | 'expenseScheduled'>('')

  // ── 기간 프리셋 ──
  const setPreset = (preset: string) => {
    const now = new Date()
    const y = now.getFullYear(), m = now.getMonth(), d = now.getDate()
    const dow = now.getDay()
    if (preset === 'today') { const t = now.toISOString().slice(0,10); setDateFrom(t); setDateTo(t) }
    else if (preset === 'week') { const mon = new Date(y,m,d-(dow===0?6:dow-1)); setDateFrom(mon.toISOString().slice(0,10)); setDateTo(now.toISOString().slice(0,10)) }
    else if (preset === 'month') { setDateFrom(`${y}-${String(m+1).padStart(2,'0')}-01`); setDateTo(now.toISOString().slice(0,10)) }
    else if (preset === 'quarter') { const qm = Math.floor(m/3)*3; setDateFrom(`${y}-${String(qm+1).padStart(2,'0')}-01`); setDateTo(now.toISOString().slice(0,10)) }
    else if (preset === 'year') { setDateFrom(`${year}-01-01`); setDateTo(`${year}-12-31`) }
  }

  // ── 담당자 목록 ──
  const managers = useMemo(() => {
    const set = new Set<string>()
    cashflows.forEach(c => { if (c.manager) set.add(c.manager); if (c.createdBy) set.add(c.createdBy) })
    return Array.from(set).sort()
  }, [cashflows])

  // ── 필터 적용된 목록 ──
  const filtered = useMemo(() => {
    return cashflows.filter(c => {
      const d = c.date || c.writeDate || ''
      if (d < dateFrom || d > dateTo) return false
      if (filterCat && String(c.budgetCatId) !== filterCat) return false
      if (filterManager && c.manager !== filterManager && c.createdBy !== filterManager) return false
      if (filterType !== 'all' && c.type !== filterType) return false
      if (searchText.trim()) {
        const q = searchText.trim().toLowerCase()
        const haystack = `${c.counter||''} ${c.description||''} ${c.incomeNote||''} ${c.amount||''}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    }).sort((a: any, b: any) => (b.date || b.writeDate || '').localeCompare(a.date || a.writeDate || ''))
  }, [cashflows, dateFrom, dateTo, filterCat, filterManager, filterType, searchText])

  // ── 집계 ──
  const stats = useMemo(() => {
    let totalIn = 0, totalOut = 0
    filtered.forEach(c => { if (c.type === 'income') totalIn += (c.amount || 0); else totalOut += (c.amount || 0) })
    // 미수금: 입금 전표 중 receivable=true & !received
    const receivables = cashflows.filter(c => c.receivable && !c.received)
    const receivableAmt = receivables.reduce((s: number, c: any) => s + (c.amount || 0), 0)
    // 미지급금: 출금 전표 중 payable=true & !paid
    const payables = cashflows.filter(c => c.payable && !c.paid)
    const payableAmt = payables.reduce((s: number, c: any) => s + (c.amount || 0), 0)
    // 입금예정: 승인된 입금 품의(미처리)
    const incomeScheduled = approvals.filter(a => a.status === 'approved' && a.type === 'income')
    const incomeSchedAmt = incomeScheduled.reduce((s: number, a: any) => s + (a.amount || 0), 0)
    // 출금예정: 승인된 품의(미집행)
    const expenseScheduled = approvals.filter(a => a.status === 'approved' && !a.isGeneral)
    const expenseSchedAmt = expenseScheduled.reduce((s: number, a: any) => s + (a.amount || 0), 0)
    return { totalIn, totalOut, net: totalIn - totalOut, receivableAmt, receivableCount: receivables.length, payableAmt, payableCount: payables.length, incomeSchedAmt, incomeSchedCount: incomeScheduled.length, expenseSchedAmt, expenseSchedCount: expenseScheduled.length }
  }, [filtered, cashflows, approvals])

  // ── 누적잔액 계산 ──
  const withBalance = useMemo(() => {
    let bal = 0
    // 역순이므로 reverse하여 잔액 계산 후 다시 역순
    const asc = [...filtered].reverse()
    const result = asc.map(c => {
      if (c.type === 'income') bal += (c.amount || 0); else bal -= (c.amount || 0)
      return { ...c, _balance: bal }
    })
    return result.reverse()
  }, [filtered])

  // ── 엑셀 다운로드 ──
  const downloadCSV = () => {
    const header = '날짜,구분,예산구분,거래처,적요,입금액,출금액,잔액,담당자\n'
    const rows = withBalance.map(c => {
      const catName = budgetCats.find((cat: any) => String(cat.id) === String(c.budgetCatId))?.name || ''
      return `${c.date||c.writeDate||''},${c.type==='income'?'입금':'출금'},${catName},${c.counter||''},${(c.description||'').replace(/,/g,' ')},${c.type==='income'?(c.amount||0):''},${c.type==='expense'?(c.amount||0):''},${c._balance},${c.manager||c.createdBy||''}`
    }).join('\n')
    const bom = '\uFEFF'
    const blob = new Blob([bom + header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `입출금내역_${dateFrom}_${dateTo}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const cardStyle = (color: string, bg: string, active?: boolean) => `rounded-xl border ${active ? 'border-2 border-primary-500 ring-2 ring-primary-200 dark:ring-primary-800 shadow-lg' : 'border-[var(--border-default)]'} p-3.5 bg-gradient-to-br ${bg} transition-all hover:shadow-md`

  // ── 카드 필터 적용 리스트 (미수/미지급/예정) ──
  const cardFilteredList = useMemo(() => {
    if (cardFilter === 'receivable') return cashflows.filter(c => c.receivable && !c.received).map(c => ({ ...c, _cardType: '미수금' }))
    if (cardFilter === 'payable') return cashflows.filter(c => c.payable && !c.paid).map(c => ({ ...c, _cardType: '미지급금' }))
    if (cardFilter === 'incomeScheduled') return approvals.filter(a => a.status === 'approved' && a.type === 'income').map(a => ({ id: a.id, date: a.date || a.createdAt || '', type: 'income', amount: a.amount || 0, counter: a.applicant || '', description: a.title || '', manager: a.applicant || '', _cardType: '입금예정', _isApproval: true }))
    if (cardFilter === 'expenseScheduled') return approvals.filter(a => a.status === 'approved' && !a.isGeneral).map(a => ({ id: a.id, date: a.date || a.createdAt || '', type: 'expense', amount: a.amount || 0, counter: a.applicant || '', description: a.title || '', manager: a.applicant || '', budgetCatId: a.budgetCatId, _cardType: '출금예정', _isApproval: true }))
    return []
  }, [cardFilter, cashflows, approvals])

  // ── 수금/지급 완료 처리 ──
  const handleSettlement = (cfId: any, settleType: 'received' | 'paid') => {
    const cfs = getItem('acct_cashflows', []) as any[]
    const idx = cfs.findIndex((c: any) => c.id === cfId)
    if (idx >= 0) {
      if (settleType === 'received') { cfs[idx].received = true; cfs[idx].receivedAt = new Date().toISOString() }
      else { cfs[idx].paid = true; cfs[idx].paidAt = new Date().toISOString() }
      setItem('acct_cashflows', cfs)
      setRefresh(r => r + 1)
      useToastStore.getState().addToast({ type: 'success', message: settleType === 'received' ? '✅ 수금 완료 처리되었습니다' : '✅ 지급 완료 처리되었습니다' })
    }
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* ── 타이틀 ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-extrabold text-[var(--text-primary)] flex items-center gap-2">
          <ArrowLeftRight size={18} className="text-primary-500" />
          입출금내역
        </h2>
        <button onClick={downloadCSV} className="px-2.5 py-1.5 rounded-lg bg-[#22c55e] text-white text-[10px] sm:text-[11px] font-bold hover:bg-[#16a34a] cursor-pointer flex items-center gap-1 shadow-sm">
          <Download size={12} /> CSV
        </button>
      </div>

      {/* ── 8개 대시보드 카드 ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {/* 1행: 실적 */}
        <div className={cardStyle('#22c55e', 'from-emerald-50/80 to-emerald-100/40 dark:from-emerald-900/20 dark:to-emerald-800/10')}>
          <div className="text-[9px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mb-0.5 sm:mb-1">💵 총 입금</div>
          <div className="text-[14px] sm:text-[18px] font-extrabold text-emerald-700 dark:text-emerald-300">₩{stats.totalIn.toLocaleString()}</div>
          <div className="text-[9px] sm:text-[10px] text-transparent mt-0.5 select-none">-</div>
        </div>
        <div className={cardStyle('#ef4444', 'from-red-50/80 to-red-100/40 dark:from-red-900/20 dark:to-red-800/10')}>
          <div className="text-[9px] sm:text-[10px] font-bold text-red-500 dark:text-red-400 mb-0.5 sm:mb-1">💸 총 출금</div>
          <div className="text-[14px] sm:text-[18px] font-extrabold text-red-600 dark:text-red-300">₩{stats.totalOut.toLocaleString()}</div>
          <div className="text-[9px] sm:text-[10px] text-transparent mt-0.5 select-none">-</div>
        </div>
        <div className={cardStyle('#3b82f6', 'from-blue-50/80 to-blue-100/40 dark:from-blue-900/20 dark:to-blue-800/10')}>
          <div className="text-[9px] sm:text-[10px] font-bold text-blue-500 dark:text-blue-400 mb-0.5 sm:mb-1">📈 순 증감</div>
          <div className={`text-[14px] sm:text-[18px] font-extrabold ${stats.net >= 0 ? 'text-blue-600 dark:text-blue-300' : 'text-red-600 dark:text-red-300'}`}>
            {stats.net >= 0 ? '+' : ''}₩{stats.net.toLocaleString()}
          </div>
          <div className="text-[9px] sm:text-[10px] text-transparent mt-0.5 select-none">-</div>
        </div>
        <div className={cardStyle('#1e293b', 'from-slate-50/80 to-slate-100/40 dark:from-slate-800/30 dark:to-slate-700/20')}>
          <div className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1">🏦 현재 잔액</div>
          <div className="text-[14px] sm:text-[18px] font-extrabold text-slate-700 dark:text-slate-200">₩{stats.net.toLocaleString()}</div>
          <div className="text-[9px] sm:text-[10px] text-transparent mt-0.5 select-none">-</div>
        </div>
        {/* 2행: 미수·미지급·예정 (클릭 가능) */}
        <div onClick={() => setCardFilter(cardFilter === 'receivable' ? '' : 'receivable')} className={cardStyle('#f97316', 'from-orange-50/80 to-orange-100/40 dark:from-orange-900/20 dark:to-orange-800/10', cardFilter === 'receivable') + ' cursor-pointer'}>
          <div className="text-[9px] sm:text-[10px] font-bold text-orange-500 dark:text-orange-400 mb-0.5 sm:mb-1">📥 미수금</div>
          <div className="text-[14px] sm:text-[18px] font-extrabold text-orange-600 dark:text-orange-300">₩{stats.receivableAmt.toLocaleString()}</div>
          <div className="text-[9px] sm:text-[10px] text-orange-400 mt-0.5">{stats.receivableCount}건 {cardFilter === 'receivable' && <span className="ml-1 text-primary-500">← 보기 중</span>}</div>
        </div>
        <div onClick={() => setCardFilter(cardFilter === 'payable' ? '' : 'payable')} className={cardStyle('#8b5cf6', 'from-violet-50/80 to-violet-100/40 dark:from-violet-900/20 dark:to-violet-800/10', cardFilter === 'payable') + ' cursor-pointer'}>
          <div className="text-[9px] sm:text-[10px] font-bold text-violet-500 dark:text-violet-400 mb-0.5 sm:mb-1">📤 미지급금</div>
          <div className="text-[14px] sm:text-[18px] font-extrabold text-violet-600 dark:text-violet-300">₩{stats.payableAmt.toLocaleString()}</div>
          <div className="text-[9px] sm:text-[10px] text-violet-400 mt-0.5">{stats.payableCount}건 {cardFilter === 'payable' && <span className="ml-1 text-primary-500">← 보기 중</span>}</div>
        </div>
        <div onClick={() => setCardFilter(cardFilter === 'incomeScheduled' ? '' : 'incomeScheduled')} className={cardStyle('#10b981', 'from-teal-50/80 to-teal-100/40 dark:from-teal-900/20 dark:to-teal-800/10', cardFilter === 'incomeScheduled') + ' cursor-pointer'}>
          <div className="text-[9px] sm:text-[10px] font-bold text-teal-500 dark:text-teal-400 mb-0.5 sm:mb-1">🔜 입금 예정</div>
          <div className="text-[14px] sm:text-[18px] font-extrabold text-teal-600 dark:text-teal-300">₩{stats.incomeSchedAmt.toLocaleString()}</div>
          <div className="text-[9px] sm:text-[10px] text-teal-400 mt-0.5">{stats.incomeSchedCount}건 {cardFilter === 'incomeScheduled' && <span className="ml-1 text-primary-500">← 보기 중</span>}</div>
        </div>
        <div onClick={() => setCardFilter(cardFilter === 'expenseScheduled' ? '' : 'expenseScheduled')} className={cardStyle('#f43f5e', 'from-rose-50/80 to-rose-100/40 dark:from-rose-900/20 dark:to-rose-800/10', cardFilter === 'expenseScheduled') + ' cursor-pointer'}>
          <div className="text-[9px] sm:text-[10px] font-bold text-rose-500 dark:text-rose-400 mb-0.5 sm:mb-1">🔜 출금 예정</div>
          <div className="text-[14px] sm:text-[18px] font-extrabold text-rose-600 dark:text-rose-300">₩{stats.expenseSchedAmt.toLocaleString()}</div>
          <div className="text-[9px] sm:text-[10px] text-rose-400 mt-0.5">{stats.expenseSchedCount}건 {cardFilter === 'expenseScheduled' && <span className="ml-1 text-primary-500">← 보기 중</span>}</div>
        </div>
      </div>

      {/* ── 필터 바 ── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-2.5 sm:p-3 space-y-2">
        {/* 데스크톱: 기간+필터 통합 grid (열 공유) */}
        <div className="hidden sm:grid sm:grid-cols-[50px_1fr_auto_1fr_auto] items-center gap-x-2 gap-y-2">
          {/* 1행: 기간 */}
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-muted)]">
            <Calendar size={13} /> 기간
          </div>
          <DatePicker value={dateFrom} onChange={v => setDateFrom(v)} />
          <span className="text-[11px] text-[var(--text-muted)] text-center">~</span>
          <DatePicker value={dateTo} onChange={v => setDateTo(v)} />
          <div className="flex gap-1 items-center">
            {[{label:'오늘',key:'today'},{label:'이번주',key:'week'},{label:'이번달',key:'month'},{label:'분기',key:'quarter'},{label:'연간',key:'year'}].map(p => (
              <button key={p.key} onClick={() => setPreset(p.key)} className="px-2.5 py-2 rounded-lg text-[11px] font-bold border border-[var(--border-default)] text-[var(--text-muted)] hover:bg-primary-50 hover:text-primary-600 hover:border-primary-300 transition-all cursor-pointer whitespace-nowrap">{p.label}</button>
            ))}
          </div>
          {/* 2행: 필터 */}
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-muted)]">
            <Filter size={13} /> 필터
          </div>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)]">
            <option value="">전체 예산</option>
            {budgetCats.filter((c: any) => { const pf = c.periodFrom || ''; const pt = c.periodTo || ''; if (pf && pt) return pf <= `${year}-12-31` && pt >= `${year}-01-01`; return true }).map((c: any) => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
          </select>
          <span className="text-[var(--border-default)] text-center text-[11px]">|</span>
          <select value={filterManager} onChange={e => setFilterManager(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)]">
            <option value="">전체 담당자</option>
            {managers.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-[var(--border-default)] overflow-hidden">
              {[{label:'전체',val:'all'},{label:'입금',val:'income'},{label:'출금',val:'expense'}].map(t => (
                <button key={t.val} onClick={() => setFilterType(t.val as any)} className={cn('px-3 py-2.5 text-[11px] font-bold cursor-pointer transition-all', filterType === t.val ? 'bg-primary-500 text-white' : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-primary-50')}>{t.label}</button>
              ))}
            </div>
            <div className="relative flex-1 min-w-[150px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="거래처·적요·금액 검색" className="w-full pl-8 pr-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500" />
            </div>
          </div>
        </div>
        {/* 모바일: 기간 */}
        <div className="flex items-center gap-2 flex-wrap sm:hidden">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-muted)] shrink-0">
            <Calendar size={13} /> 기간
          </div>
          <DatePicker value={dateFrom} onChange={v => setDateFrom(v)} className="w-auto shrink-0" />
          <span className="text-[11px] text-[var(--text-muted)]">~</span>
          <DatePicker value={dateTo} onChange={v => setDateTo(v)} className="w-auto shrink-0" />
          {[{label:'오늘',key:'today'},{label:'이번주',key:'week'},{label:'이번달',key:'month'},{label:'분기',key:'quarter'},{label:'연간',key:'year'}].map(p => (
            <button key={p.key} onClick={() => setPreset(p.key)} className="px-1.5 py-1 rounded-full text-[9px] font-bold border border-[var(--border-default)] text-[var(--text-muted)] hover:bg-primary-50 hover:text-primary-600 cursor-pointer whitespace-nowrap shrink-0">{p.label}</button>
          ))}
        </div>
        {/* 모바일: 필터 */}
        <div className="flex items-center gap-2 flex-wrap sm:hidden">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-muted)] shrink-0">
            <Filter size={13} /> 필터
          </div>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] max-w-[140px]">
            <option value="">전체 예산</option>
            {budgetCats.filter((c: any) => { const pf = c.periodFrom || ''; const pt = c.periodTo || ''; if (pf && pt) return pf <= `${year}-12-31` && pt >= `${year}-01-01`; return true }).map((c: any) => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
          </select>
          <select value={filterManager} onChange={e => setFilterManager(e.target.value)} className="px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] max-w-[120px]">
            <option value="">전체 담당자</option>
            {managers.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <div className="flex rounded-lg border border-[var(--border-default)] overflow-hidden">
            {[{label:'전체',val:'all'},{label:'입금',val:'income'},{label:'출금',val:'expense'}].map(t => (
              <button key={t.val} onClick={() => setFilterType(t.val as any)} className={cn('px-3 py-2.5 text-sm font-bold cursor-pointer transition-all', filterType === t.val ? 'bg-primary-500 text-white' : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-primary-50')}>{t.label}</button>
            ))}
          </div>
          <div className="flex-1 min-w-[120px]">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="거래처·적요·금액 검색" className="w-full pl-8 pr-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500" />
            </div>
          </div>
        </div>
      </div>

      {/* ── 건수 ── */}
      {cardFilter ? (
        <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
          <span className="text-[var(--text-muted)]">
            <span className="font-bold text-primary-600">{cardFilter === 'receivable' ? '📥 미수금' : cardFilter === 'payable' ? '📤 미지급금' : cardFilter === 'incomeScheduled' ? '🔜 입금예정' : '🔜 출금예정'}</span>
            {' '}<span className="font-bold text-[var(--text-primary)]">{cardFilteredList.length}</span>건
          </span>
          <button onClick={() => setCardFilter('')} className="px-2 py-0.5 rounded-full bg-[var(--bg-muted)] text-[9px] sm:text-[10px] font-bold text-[var(--text-muted)] hover:bg-primary-100 hover:text-primary-600 cursor-pointer transition-all">✕ 전체보기</button>
        </div>
      ) : (
        <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
          <span className="text-[var(--text-muted)]">총 <span className="font-bold text-[var(--text-primary)]">{filtered.length}</span>건</span>
          <span className="text-[var(--text-muted)]">
            입금 <span className="font-bold text-emerald-600">₩{stats.totalIn.toLocaleString()}</span>
            {' · '}출금 <span className="font-bold text-red-500">₩{stats.totalOut.toLocaleString()}</span>
          </span>
        </div>
      )}

      {/* ── 데스크톱 테이블 (sm 이상) ── */}
      <div className="hidden sm:block bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] table-fixed">
            <thead>
              <tr className="bg-[var(--bg-muted)] text-[var(--text-muted)] font-bold border-b border-[var(--border-default)]">
                <th className="px-3 py-2 text-left whitespace-nowrap w-[100px]">날짜</th>
                <th className="px-2 py-2 text-center whitespace-nowrap w-[52px]">구분</th>
                <th className="px-3 py-2 text-left whitespace-nowrap w-[90px]">예산구분</th>
                <th className="px-3 py-2 text-left whitespace-nowrap w-[120px]">거래처</th>
                <th className="px-3 py-2 text-left whitespace-nowrap">적요</th>
                <th className="px-3 py-2 text-right whitespace-nowrap w-[110px]">금액</th>
                <th className="px-3 py-2 text-right whitespace-nowrap w-[110px]">잔액</th>
                <th className="px-3 py-2 text-left whitespace-nowrap w-[70px]">담당자</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const displayList = cardFilter ? cardFilteredList : withBalance
                if (displayList.length === 0) return (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-[var(--text-muted)]">
                    <div className="flex flex-col items-center gap-2">
                      <ArrowLeftRight size={32} className="text-[var(--border-default)]" />
                      <span>{cardFilter ? '해당 항목이 없습니다' : '해당 기간의 입출금 내역이 없습니다'}</span>
                    </div>
                  </td></tr>
                )
                return displayList.map((c: any, i: number) => {
                  const catName = budgetCats.find((cat: any) => String(cat.id) === String(c.budgetCatId))?.name || ''
                  const isIncome = c.type === 'income'
                  return (
                    <tr key={c.id || i} className="border-b border-[var(--border-default)] hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-colors">
                      <td className="px-3 py-2 whitespace-nowrap text-[var(--text-primary)]">{(c.date || c.writeDate || '').slice(0, 10)}</td>
                      <td className="px-2 py-2 text-center">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${isIncome ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                          {isIncome ? '입금' : '출금'}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {catName && <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[9px] font-bold">{catName}</span>}
                      </td>
                      <td className="px-3 py-2 text-[var(--text-primary)] whitespace-nowrap max-w-[120px] truncate">{c.counter || '-'}</td>
                      <td className="px-3 py-2 text-[var(--text-secondary)] max-w-[180px] truncate" title={c.description || c.incomeNote || ''}>{c.description || c.incomeNote || '-'}</td>
                      <td className={`px-3 py-2 text-right font-bold whitespace-nowrap ${isIncome ? 'text-emerald-600' : 'text-red-500'}`}>₩{(c.amount||0).toLocaleString()}</td>
                      <td className={`px-3 py-2 text-right font-extrabold whitespace-nowrap ${!cardFilter ? ((c._balance||0) >= 0 ? 'text-[var(--text-primary)]' : 'text-red-500') : 'text-transparent select-none'}`}>
                        {!cardFilter ? `₩${(c._balance||0).toLocaleString()}` : '-'}
                      </td>
                      <td className="px-3 py-2 text-[var(--text-muted)] whitespace-nowrap">{c.manager || c.createdBy || '-'}</td>
                    </tr>
                  )
                })
              })()}
            </tbody>
            <tfoot>
              {!cardFilter && withBalance.length > 0 && (
                <tr className="bg-[var(--bg-muted)] font-bold border-t-2 border-[var(--border-default)]">
                  <td colSpan={4} className="px-3 py-2 text-[var(--text-primary)]">합계</td>
                  <td className="px-3 py-2 text-right text-emerald-600"></td>
                  <td className="px-3 py-2 text-right text-emerald-600">₩{stats.totalIn.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-[var(--text-primary)]">₩{stats.net.toLocaleString()}</td>
                  <td></td>
                </tr>
              )}
              {cardFilter && cardFilteredList.length > 0 && (
                <tr className="bg-[var(--bg-muted)] font-bold border-t-2 border-[var(--border-default)]">
                  <td colSpan={5} className="px-3 py-2 text-[var(--text-primary)]">합계 ({cardFilteredList.length}건)</td>
                  <td className="px-3 py-2 text-right font-extrabold text-[var(--text-primary)]">₩{cardFilteredList.reduce((s: number, c: any) => s + (c.amount || 0), 0).toLocaleString()}</td>
                  <td></td>
                  <td></td>
                </tr>
              )}
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── 모바일 카드 리스트 (sm 미만) ── */}
      <div className="block sm:hidden space-y-2">
        {(() => {
          const displayList = cardFilter ? cardFilteredList : withBalance
          if (displayList.length === 0) return (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-8 text-center text-[var(--text-muted)]">
              <div className="flex flex-col items-center gap-2">
                <ArrowLeftRight size={28} className="text-[var(--border-default)]" />
                <span className="text-[11px]">{cardFilter ? '해당 항목이 없습니다' : '해당 기간의 입출금 내역이 없습니다'}</span>
              </div>
            </div>
          )
          return displayList.map((c: any, i: number) => {
            const catName = budgetCats.find((cat: any) => String(cat.id) === String(c.budgetCatId))?.name || ''
            const isIncome = c.type === 'income'
            return (
              <div key={c.id || i} className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-3 space-y-1.5">
                {/* 1줄: 날짜 + 구분 + 금액 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-[var(--text-primary)]">{(c.date || c.writeDate || '').slice(0, 10)}</span>
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${isIncome ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {isIncome ? '입금' : '출금'}
                    </span>
                    {cardFilter && c._cardType && (
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        c._cardType === '미수금' ? 'bg-orange-100 text-orange-700' :
                        c._cardType === '미지급금' ? 'bg-violet-100 text-violet-700' :
                        c._cardType === '입금예정' ? 'bg-teal-100 text-teal-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>{c._cardType}</span>
                    )}
                  </div>
                  <span className={`text-[13px] font-extrabold ${isIncome ? 'text-emerald-600' : 'text-red-500'}`}>₩{(c.amount||0).toLocaleString()}</span>
                </div>
                {/* 2줄: 거래처 + 적요 */}
                <div className="flex items-center gap-2 text-[10px]">
                  {(c.counter || c.description || c.incomeNote) && (
                    <>
                      {c.counter && <span className="font-bold text-[var(--text-primary)]">{c.counter}</span>}
                      {(c.description || c.incomeNote) && <span className="text-[var(--text-muted)] truncate max-w-[200px]">{c.description || c.incomeNote}</span>}
                    </>
                  )}
                </div>
                {/* 3줄: 예산+담당자+잔액 */}
                <div className="flex items-center justify-between text-[9px]">
                  <div className="flex items-center gap-1.5">
                    {catName && <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold">{catName}</span>}
                    <span className="text-[var(--text-muted)]">{c.manager || c.createdBy || ''}</span>
                  </div>
                  {!cardFilter && <span className={`font-extrabold ${(c._balance||0) >= 0 ? 'text-[var(--text-secondary)]' : 'text-red-500'}`}>잔액 ₩{(c._balance||0).toLocaleString()}</span>}
                  {(cardFilter === 'receivable' || cardFilter === 'payable') && !c._isApproval && (
                    <button
                      onClick={() => handleSettlement(c.id, cardFilter === 'receivable' ? 'received' : 'paid')}
                      className={`px-2 py-1 rounded text-[9px] font-bold cursor-pointer ${
                        cardFilter === 'receivable' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {cardFilter === 'receivable' ? '✅ 수금완료' : '✅ 지급완료'}
                    </button>
                  )}
                </div>
              </div>
            )
          })
        })()}
        {/* 모바일 합계 */}
        {!cardFilter && withBalance.length > 0 && (
          <div className="bg-[var(--bg-muted)] border border-[var(--border-default)] rounded-xl p-3 flex items-center justify-between text-[10px] font-bold">
            <span className="text-[var(--text-primary)]">합계</span>
            <div className="flex gap-3">
              <span className="text-emerald-600">입금 ₩{stats.totalIn.toLocaleString()}</span>
              <span className="text-red-500">출금 ₩{stats.totalOut.toLocaleString()}</span>
            </div>
          </div>
        )}
        {cardFilter && cardFilteredList.length > 0 && (
          <div className="bg-[var(--bg-muted)] border border-[var(--border-default)] rounded-xl p-3 flex items-center justify-between text-[10px] font-bold">
            <span className="text-[var(--text-primary)]">합계 ({cardFilteredList.length}건)</span>
            <span className="text-[var(--text-primary)]">₩{cardFilteredList.reduce((s: number, c: any) => s + (c.amount || 0), 0).toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  )
}
