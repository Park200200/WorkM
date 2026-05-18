import React, { useState, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../../components/common/PageHeader'
import { EmptyState } from '../../components/common/EmptyState'
import { cn } from '../../utils/cn'
import { getItem, setItem } from '../../utils/storage'
import { formatNumber } from '../../utils/format'
import { AcctBalance } from '../../components/accounting/AcctBalance'
import { AcctReports } from '../../components/accounting/AcctReports'
import { PrintApprovalForm } from '../../components/accounting/PrintApprovalForm'
import { useStaffStore } from '../../stores/staffStore'
import { useAuthStore } from '../../stores/authStore'
import { CustomSelect } from '../../components/ui/CustomSelect'
import { DatePicker } from '../../components/ui/DatePicker'
import {
  LayoutDashboard, Wallet, FileCheck, ArrowDownCircle, ArrowUpCircle,
  BookOpen, PieChart, ScrollText, Settings2, ContactRound, Building2,
  TrendingDown, TrendingUp, Banknote, Clock, Search, ChevronDown,
  Plus, Edit3, Trash2, Save, X, Check, Ban, MoreHorizontal,
  Lock, ShieldCheck, RefreshCw, Printer, Paperclip, Send,
  CreditCard, Settings, Smartphone, User, Phone, Mail,
} from 'lucide-react'

/* ─── 회계 시드 데이터 초기화 ── */
function initAccountingSeed() {
  if (localStorage.getItem('_acct_react_seed_v9')) return

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
    setItem('acct_accounts', defaultAccounts)
  }

  const uid = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 7)
  const year = new Date().getFullYear()

  /* ── 예산 시드 (기존 데이터 없을 때만) ── */
  const cats = getItem<BudgetCat[]>('acct_budget_cats', [])
  const budgets = getItem<BudgetItem[]>('acct_budgets', [])

  if (cats.length === 0 || budgets.length === 0) {
    const catDefs = [
      { name: '문화재청', bank: '기업은행 1010-1100-12', from: `${year}-01-01`, to: `${year}-12-31` },
      { name: '경주시청', bank: '농협은행 2020-2200-34', from: `${year}-01-01`, to: `${year}-12-31` },
      { name: '자체예산', bank: '국민은행 3030-3300-56', from: `${year}-01-01`, to: `${year}-12-31` },
    ]

    const itemSets = [
      [
        { item: '문화재 보수비', code: '5110', amt: 50000000 },
        { item: '발굴조사비', code: '5120', amt: 30000000 },
        { item: '전문인력 인건비', code: '5210', amt: 25000000 },
        { item: '장비 구입비', code: '5130', amt: 15000000 },
        { item: '안전관리비', code: '5140', amt: 8000000 },
      ],
      [
        { item: '유적정비비', code: '5110', amt: 40000000 },
        { item: '관광홍보비', code: '5320', amt: 20000000 },
        { item: '시설유지비', code: '5130', amt: 15000000 },
        { item: '조경공사비', code: '5120', amt: 12000000 },
        { item: '행사운영비', code: '5310', amt: 8000000 },
      ],
      [
        { item: '임직원 급여', code: '5210', amt: 60000000 },
        { item: '사무용품비', code: '5190', amt: 5000000 },
        { item: '통신비', code: '5340', amt: 3000000 },
        { item: '차량유지비', code: '5310', amt: 4000000 },
        { item: '복리후생비', code: '5350', amt: 6000000 },
      ],
    ]

    const newCats = [...cats]
    const newBudgets = [...budgets]

    catDefs.forEach((def, ci) => {
      const catId = uid()
      newCats.push({
        id: catId, name: def.name, year,
        bankInfo: def.bank, periodFrom: def.from, periodTo: def.to,
      })
      itemSets[ci].forEach(b => {
        newBudgets.push({
          id: uid(), catId, year,
          itemName: b.item, accountCode: b.code,
          amount: b.amt, spent: Math.round(b.amt * (Math.random() * 0.4)), memo: '',
        })
      })
    })

    setItem('acct_budget_cats', newCats)
    setItem('acct_budgets', newBudgets)
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
    const mm = (m: number) => String(m).padStart(2, '0')
    const approvals = [
      { id: 2001, title: 'Q1 사무용품 일괄 구매', amount: 1500000, date: `${year}-01-15`, status: 'approved', accountCode: '5190', description: '1분기 사무용품 일괄 구매 품의', applicant: 'admin', approver: '김지훈', budgetItem: '사무용품비', budgetSubItem: '사무용품', budgetCatName: '문화재청', createdAt: `${year}-01-14T09:00:00Z` },
      { id: 2002, title: '문화재 현장 안전장비 구입', amount: 3200000, date: `${year}-02-05`, status: 'approved', accountCode: '5140', description: '현장 안전모, 안전벨트 등 구입', applicant: '최경리', approver: '김지훈', budgetItem: '안전관리비', budgetSubItem: '안전장비', budgetCatName: '문화재청', createdAt: `${year}-02-04T10:00:00Z` },
      { id: 2003, title: '발굴조사 장비 임대', amount: 8500000, date: `${year}-02-20`, status: 'approved', accountCode: '5120', description: '3월 발굴조사 장비 임대 비용', applicant: '한정민', approver: '이수진', budgetItem: '발굴조사비', budgetSubItem: '장비임대', budgetCatName: '문화재청', createdAt: `${year}-02-19T14:00:00Z` },
      { id: 2004, title: '보고서 인쇄비', amount: 2800000, date: `${year}-03-10`, status: 'pending', accountCode: '5190', description: '2025년도 연간보고서 인쇄', applicant: 'admin', approver: '박민수', budgetItem: '사무용품비', budgetSubItem: '인쇄비', budgetCatName: '자체예산', createdAt: `${year}-03-09T11:00:00Z` },
      { id: 2005, title: '직원 역량강화 교육비', amount: 4500000, date: `${year}-03-25`, status: 'pending', accountCode: '5350', description: '문화재 복원기술 교육 수강료', applicant: 'admin', approver: '김지훈', budgetItem: '복리후생비', budgetSubItem: '교육비', budgetCatName: '자체예산', createdAt: `${year}-03-24T09:30:00Z` },
      { id: 2006, title: '법인차량 정기정비', amount: 780000, date: `${year}-${mm(new Date().getMonth())}-05`, status: 'approved', accountCode: '5310', description: '법인차량 3대 정기정비', applicant: '조영민', approver: '정현수', budgetItem: '차량유지비', budgetSubItem: '정비비', budgetCatName: '자체예산', createdAt: `${year}-${mm(new Date().getMonth())}-04T08:00:00Z` },
      { id: 2007, title: '유적지 조경공사', amount: 12000000, date: `${year}-${mm(new Date().getMonth())}-12`, status: 'pending', accountCode: '5120', description: '경주 유적지 봄 조경정비', applicant: 'admin', approver: '이수진', budgetItem: '문화재 보수비', budgetSubItem: '조경공사', budgetCatName: '문화재청', createdAt: `${year}-${mm(new Date().getMonth())}-11T10:00:00Z` },
      { id: 2008, title: '사무실 통신비 연간계약', amount: 3600000, date: `${year}-${mm(new Date().getMonth() + 1)}-01`, status: 'rejected', accountCode: '5340', description: '인터넷/전화 연간계약 갱신', applicant: 'admin', approver: '박민수', budgetItem: '통신비', budgetSubItem: '인터넷', budgetCatName: '자체예산', createdAt: `${year}-${mm(new Date().getMonth())}-28T15:00:00Z` },
      { id: 2009, title: '현장 드론 구입', amount: 5500000, date: `${year}-${mm(new Date().getMonth() + 1)}-10`, status: 'pending', accountCode: '5130', description: '항공촬영용 고성능 드론 2대', applicant: 'admin', approver: '최유리', budgetItem: '장비 구입비', budgetSubItem: '촬영장비', budgetCatName: '문화재청', createdAt: `${year}-${mm(new Date().getMonth() + 1)}-09T09:00:00Z` },
      { id: 2010, title: '행사장 케이터링', amount: 2200000, date: `${year}-${mm(new Date().getMonth() + 1)}-20`, status: 'pending', accountCode: '5310', description: '문화유산의 날 행사 케이터링', applicant: 'admin', approver: '한소희', budgetItem: '복리후생비', budgetSubItem: '행사비', budgetCatName: '자체예산', createdAt: `${year}-${mm(new Date().getMonth() + 1)}-19T13:00:00Z` },
    ]
    setItem('acct_approvals', approvals)
  }

  /* ── 지출/입금/출금 샘플 각 10건 ── */
  if (getItem<any[]>('acct_cashflows', []).length === 0) {
    const cfs: any[] = []
    const vs: any[] = []
    let sid = 3001

    // 지출 10건
    const expenses = [
      { desc: '사무용품 구매 (복사지, 토너)', amt: 320000, date: `${year}-01-20`, counter: '(주)스마트오피스', method: '카드' },
      { desc: '현장작업자 안전장비', amt: 1500000, date: `${year}-02-08`, counter: '(주)한국전자', method: '계좌이체' },
      { desc: '3월 법인차량 유류비', amt: 450000, date: `${year}-03-15`, counter: '주유소', method: '법인카드' },
      { desc: '보고서 인쇄비 (300부)', amt: 1200000, date: `${year}-03-28`, counter: '대한인쇄공사', method: '계좌이체' },
      { desc: '사무실 인터넷 요금', amt: 88000, date: `${year}-${String(new Date().getMonth()).padStart(2, '0')}-05`, counter: '한빛통신(주)', method: '계좌이체' },
      { desc: '조경 유지보수비', amt: 3500000, date: `${year}-${String(new Date().getMonth()).padStart(2, '0')}-10`, counter: '(주)그린조경', method: '계좌이체' },
      { desc: '직원 간식비', amt: 150000, date: `${year}-${String(new Date().getMonth()).padStart(2, '0')}-12`, counter: '(주)맛나푸드', method: '법인카드' },
      { desc: '법률자문 수수료', amt: 2200000, date: `${year}-${String(new Date().getMonth()).padStart(2, '0')}-18`, counter: '세종법률사무소', method: '계좌이체' },
      { desc: '차량 정기검사비', amt: 350000, date: `${year}-${String(new Date().getMonth() + 1).padStart(2, '0')}-02`, counter: '(주)퍼스트카', method: '카드' },
      { desc: '사무실 정수기 렌탈', amt: 55000, date: `${year}-${String(new Date().getMonth() + 1).padStart(2, '0')}-05`, counter: '정수기렌탈', method: '계좌이체' },
    ]
    expenses.forEach(e => {
      const id = sid++
      cfs.push({ id, date: e.date, type: 'expense', amount: e.amt, description: e.desc, accountCode: '5110', counter: e.counter, method: e.method })
      vs.push({ id: sid++, date: e.date, type: 'expense', description: e.desc, createdAt: e.date + 'T09:00:00Z', entries: [
        { side: 'debit', accountCode: '5110', amount: e.amt },
        { side: 'credit', accountCode: e.method === '현금' ? '1010' : '1020', amount: e.amt },
      ]})
    })

    // 입금 10건
    const incomes = [
      { desc: '문화재청 1차 보조금', amt: 25000000, date: `${year}-01-10`, counter: '문화재청', method: '계좌이체' },
      { desc: '경주시 관광홍보 보조금', amt: 10000000, date: `${year}-02-01`, counter: '경주시청', method: '계좌이체' },
      { desc: '문화재청 2차 보조금', amt: 25000000, date: `${year}-03-05`, counter: '문화재청', method: '계좌이체' },
      { desc: '발굴조사 용역 수입', amt: 8000000, date: `${year}-03-20`, counter: '경주문화재연구원', method: '계좌이체' },
      { desc: '유적 입장료 수입', amt: 3200000, date: `${year}-${String(new Date().getMonth()).padStart(2, '0')}-01`, counter: '현장매표소', method: '현금' },
      { desc: '기념품 판매 수입', amt: 1500000, date: `${year}-${String(new Date().getMonth()).padStart(2, '0')}-08`, counter: '기념품샵', method: '카드' },
      { desc: '경주시 3차 보조금', amt: 10000000, date: `${year}-${String(new Date().getMonth()).padStart(2, '0')}-15`, counter: '경주시청', method: '계좌이체' },
      { desc: '교육 프로그램 참가비', amt: 2400000, date: `${year}-${String(new Date().getMonth()).padStart(2, '0')}-20`, counter: '교육참가자', method: '계좌이체' },
      { desc: '도서 판매 수입', amt: 850000, date: `${year}-${String(new Date().getMonth() + 1).padStart(2, '0')}-03`, counter: '온라인서점', method: '계좌이체' },
      { desc: '문화재청 3차 보조금', amt: 20000000, date: `${year}-${String(new Date().getMonth() + 1).padStart(2, '0')}-10`, counter: '문화재청', method: '계좌이체' },
    ]
    incomes.forEach(e => {
      const id = sid++
      cfs.push({ id, date: e.date, type: 'income', amount: e.amt, description: e.desc, accountCode: '4030', counter: e.counter, method: e.method })
      vs.push({ id: sid++, date: e.date, type: 'income', description: e.desc, createdAt: e.date + 'T09:00:00Z', entries: [
        { side: 'debit', accountCode: e.method === '현금' ? '1010' : '1020', amount: e.amt },
        { side: 'credit', accountCode: '4030', amount: e.amt },
      ]})
    })

    // 출금 10건 (type: 'expense' + withdrawal 형태)
    const withdrawals = [
      { desc: '임직원 1월 급여', amt: 15000000, date: `${year}-01-25`, counter: '직원계좌', method: '계좌이체' },
      { desc: '임직원 2월 급여', amt: 15000000, date: `${year}-02-25`, counter: '직원계좌', method: '계좌이체' },
      { desc: '4대보험 납부', amt: 4800000, date: `${year}-02-28`, counter: '국민건강보험공단', method: '계좌이체' },
      { desc: '임직원 3월 급여', amt: 15000000, date: `${year}-03-25`, counter: '직원계좌', method: '계좌이체' },
      { desc: '퇴직연금 적립', amt: 3000000, date: `${year}-03-31`, counter: '퇴직연금운용사', method: '계좌이체' },
      { desc: '세금 납부 (부가세)', amt: 5500000, date: `${year}-${String(new Date().getMonth()).padStart(2, '0')}-10`, counter: '국세청', method: '계좌이체' },
      { desc: '임직원 ${new Date().getMonth() + 1}월 급여', amt: 15000000, date: `${year}-${String(new Date().getMonth()).padStart(2, '0')}-25`, counter: '직원계좌', method: '계좌이체' },
      { desc: '사무실 임대료', amt: 3300000, date: `${year}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`, counter: '건물주', method: '계좌이체' },
      { desc: '4대보험 납부', amt: 4800000, date: `${year}-${String(new Date().getMonth() + 1).padStart(2, '0')}-05`, counter: '국민건강보험공단', method: '계좌이체' },
      { desc: '관리비 납부', amt: 880000, date: `${year}-${String(new Date().getMonth() + 1).padStart(2, '0')}-10`, counter: '관리사무소', method: '계좌이체' },
    ]
    withdrawals.forEach(e => {
      const id = sid++
      cfs.push({ id, date: e.date, type: 'expense', amount: e.amt, description: e.desc, accountCode: '5210', counter: e.counter, method: e.method, isWithdrawal: true })
      vs.push({ id: sid++, date: e.date, type: 'expense', description: e.desc, createdAt: e.date + 'T09:00:00Z', entries: [
        { side: 'debit', accountCode: '5210', amount: e.amt },
        { side: 'credit', accountCode: '1020', amount: e.amt },
      ]})
    })

    setItem('acct_cashflows', cfs)
    setItem('acct_vouchers', vs)
  }

  localStorage.setItem('_acct_react_seed_v9', '1')
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
}

interface BudgetItem {
  id: string | number
  catId: string | number
  year?: number
  itemName: string
  subItemName?: string
  accountCode?: string
  contraAccountCode?: string
  amount: number
  spent: number
  memo?: string
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
  { key: 'reports',      label: '회계현황',   icon: ScrollText },
  { key: 'vendors',      label: '거래처관리',   icon: ContactRound },
  { key: 'accounts',     label: '계정관리',   icon: Settings2 },
  { key: 'hq_vendor',    label: '본사거래처',   icon: Building2 },
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

  useEffect(() => { initAccountingSeed() }, [])

  return (
    <div className="animate-fadeIn">
      {/* ── 모바일 연도 선택 (데스크탑은 헤더에 표시) ── */}
      <div className="mb-4 md:hidden">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1">
            <Clock size={12} /> 회계연도
          </span>
          {[currentYear + 1, currentYear, currentYear - 1].map(y => (
            <button
              key={y}
              onClick={() => {
                const tab = searchParams.get('tab') || 'overview'
                setSearchParams({ tab, year: String(y) })
              }}
              className={cn(
                'px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all border',
                y === year
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-transparent text-[var(--text-muted)] border-[var(--border-default)] hover:border-primary-400',
              )}
            >
              {y}
            </button>
          ))}
        </div>
      </div>



      {/* ── 서브 페이지 렌더 ── */}
      {activeSub === 'overview' && <AcctOverview year={year} selectedCatId={selectedOverviewCatId === 'all' ? null : selectedOverviewCatId} />}
      {(activeSub === 'base_budget' || activeSub === 'budget' || activeSub === 'balance') && <AcctBaseBudget year={year} />}
      {activeSub === 'approval' && <AcctApproval year={year} />}
      {(activeSub === 'expense' || activeSub === 'income' || activeSub === 'withdrawal') && (
        <AcctVoucherEntry year={year} type={activeSub as 'expense' | 'income' | 'withdrawal'} catId={selectedOverviewCatId} />
      )}
      {activeSub === 'payment' && <AcctPaymentLedger year={year} />}
      {activeSub === 'reports' && <AcctReports year={year} />}
      {activeSub === 'vendors' && <AcctVendors />}
      {activeSub === 'accounts' && <AcctAccountsMgmt />}
      {activeSub === 'hq_vendor' && <AcctHQVendor />}
      {!['overview','base_budget','budget','balance','approval','expense','income','withdrawal','payment','reports','vendors','accounts','hq_vendor'].includes(activeSub) && (
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

  const selectedOverviewCatId = selectedCatId


  const isInYear = (dateStr?: string) => {
    if (!dateStr) return false
    return parseInt(String(dateStr).substring(0, 4)) === year
  }

  /* ── 연도별 필터 ── */
  const yearCats = budgetCats.filter(cat => {
    const catYear = cat.year || (cat.periodFrom ? parseInt(cat.periodFrom.substring(0, 4)) : new Date().getFullYear())
    return catYear === year
  })
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

  return (
    <div className="space-y-4">
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
        </div>
        {/* 예산구분 서브탭 */}
        <div className="flex items-center gap-1 mb-4">
          <button
            onClick={() => setOverviewCat(null)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border',
              !selectedOverviewCatId
                ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                : 'bg-transparent text-[var(--text-muted)] border-[var(--border-default)] hover:border-primary-400'
            )}
          >
            전체
          </button>
          {yearCats.map(cat => (
            <button
              key={cat.id}
              onClick={() => setOverviewCat(String(cat.id))}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border',
                String(selectedOverviewCatId) === String(cat.id)
                  ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                  : 'bg-transparent text-[var(--text-muted)] border-[var(--border-default)] hover:border-primary-400'
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>


        <div className="grid grid-cols-3 gap-4 mb-3">
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
              onClick={() => setInnerTab('balance')}
              className={cn(
                'px-4 py-2 rounded-lg text-[13px] font-bold transition-all cursor-pointer',
                innerTab === 'balance'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              )}
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
                onClick={() => setYear(y)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all cursor-pointer',
                  y === propYear
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border-default)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                )}
              >
                {String(y).slice(-2)}년도
              </button>
            ))}
            <button
              onClick={addYear}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-primary-100 hover:text-primary-600 dark:hover:bg-primary-900/30 dark:hover:text-primary-400 transition-all cursor-pointer text-[14px] font-bold"
              title="연도 추가"
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
            onClick={() => {
              localStorage.setItem('acct_active_year', String(propYear))
              setAppliedYear(propYear)
              const tab = searchParams.get('tab') || 'base_budget'
              const params: Record<string, string> = { tab, year: String(propYear) }
              setSearchParams(params)
            }}
            className="px-3 py-1.5 rounded-lg text-[12px] font-bold bg-primary-500 text-white border border-primary-500 hover:bg-primary-600 transition-all cursor-pointer shadow-sm"
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
  const staffListForBudget = useStaffStore(s => s.staff).filter(s => !s.resignedAt)

  /* ── 모달 상태 ── */
  const [catModalOpen, setCatModalOpen] = useState(false)
  const [catEditId, setCatEditId] = useState<string | number | null>(null)
  const [catForm, setCatForm] = useState({ name: '', bank: '', accounts: [] as BudgetCatAccount[], periodFrom: `${year}-01-01`, periodTo: `${year}-12-31`, users: [] as string[] })

  const [budgetModalOpen, setBudgetModalOpen] = useState(false)
  const [budgetEditId, setBudgetEditId] = useState<number | null>(null)
  const [budgetForm, setBudgetForm] = useState({ itemName: '', subItemName: '', accountCode: '', contraAccountCode: '', amount: '', memo: '' })
  const [itemNameSearch, setItemNameSearch] = useState('')
  const [itemNamePopup, setItemNamePopup] = useState(false)
  const [acctSearch, setAcctSearch] = useState('')
  const [acctPopup, setAcctPopup] = useState(false)
  const [contraAcctSearch, setContraAcctSearch] = useState('')
  const [contraAcctPopup, setContraAcctPopup] = useState(false)

  /* ── 데이터 ── */
  const budgetCats = useMemo(() => {
    const cats = getItem<BudgetCat[]>('acct_budget_cats', [])
    return cats.filter(cat => {
      const catYear = cat.year || (cat.periodFrom ? parseInt(cat.periodFrom.substring(0, 4)) : new Date().getFullYear())
      return catYear === year
    })
  }, [year, refresh])

  const budgets = useMemo(() => getItem<BudgetItem[]>('acct_budgets', []), [refresh])
  const accounts = useMemo(() => getItem<{ code: string; name: string; type: string; group?: string }[]>('acct_accounts', []), [refresh])
  const expenseAccounts = accounts.filter(a => a.type === 'expense')
  const itemNameHistory = useMemo(() => getItem<string[]>('acct_itemName_history', []), [refresh])

  // 기타설정의 예산목과 동일: 히스토리 + 기존 예산 데이터의 itemName 합산
  const allItemNames = useMemo(() => {
    return Array.from(new Set([
      ...budgets.map(b => b.itemName).filter(Boolean),
      ...itemNameHistory.filter(Boolean),
    ])).sort()
  }, [budgets, itemNameHistory])

  // 필터링된 예산목 리스트
  const filteredItemNames = useMemo(() => {
    if (!itemNameSearch.trim()) return allItemNames
    const q = itemNameSearch.toLowerCase()
    return allItemNames.filter(n => n.toLowerCase().includes(q))
  }, [allItemNames, itemNameSearch])
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
        setCatForm({ name: c.name || '', bank: c.bank || c.bankInfo || '', accounts: c.accounts || (c.bank ? [{ id: Date.now(), bankName: c.bank || c.bankInfo || '', cards: [] }] : []), periodFrom: c.periodFrom || `${year}-01-01`, periodTo: c.periodTo || `${year}-12-31`, users: c.users || [] })
      }
    } else {
      setCatEditId(null)
      setCatForm({ name: '', bank: '', accounts: [], periodFrom: `${year}-01-01`, periodTo: `${year}-12-31`, users: [] })
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
        return { ...c, name: catForm.name.trim(), bank: catForm.accounts[0]?.bankName || catForm.bank, bankInfo: catForm.accounts[0]?.bankName || catForm.bank, accounts: catForm.accounts, periodFrom: catForm.periodFrom, periodTo: catForm.periodTo, year: y, users: catForm.users }
      })
      localStorage.setItem('acct_budget_cats', JSON.stringify(updated))
    } else {
      const y = catForm.periodFrom ? parseInt(catForm.periodFrom.substring(0, 4)) : year
      const newCat: BudgetCat = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        name: catForm.name.trim(),
        bank: catForm.accounts[0]?.bankName || catForm.bank,
        bankInfo: catForm.accounts[0]?.bankName || catForm.bank,
        accounts: catForm.accounts,
        periodFrom: catForm.periodFrom,
        periodTo: catForm.periodTo,
        year: y,
        users: catForm.users,
      }
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
        setBudgetForm({ itemName: b.itemName || '', subItemName: b.subItemName || '', accountCode: b.accountCode || '', contraAccountCode: b.contraAccountCode || '', amount: formatNumber(b.amount), memo: b.memo || '' })
      }
    } else {
      setBudgetEditId(null)
      setBudgetForm({ itemName: '', subItemName: '', accountCode: '', contraAccountCode: '', amount: '', memo: '' })
    }
    setBudgetModalOpen(true)
    setItemNameSearch('')
    setItemNamePopup(false)
    setAcctSearch('')
    setAcctPopup(false)
    setContraAcctSearch('')
    setContraAcctPopup(false)
  }

  const saveBudgetItem = () => {
    if (!budgetForm.itemName.trim()) return
    if (!budgetForm.accountCode) return
    const amt = parseInt(budgetForm.amount.replace(/,/g, '')) || 0
    if (amt <= 0) return
    const all = getItem<BudgetItem[]>('acct_budgets', [])
    if (budgetEditId) {
      const updated = all.map(b => {
        if (b.id !== budgetEditId) return b
        return { ...b, itemName: budgetForm.itemName.trim(), subItemName: budgetForm.subItemName.trim(), accountCode: budgetForm.accountCode, contraAccountCode: budgetForm.contraAccountCode, amount: amt, memo: budgetForm.memo }
      })
      localStorage.setItem('acct_budgets', JSON.stringify(updated))
    } else {
      all.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        catId: selCat!.id,
        year,
        itemName: budgetForm.itemName.trim(),
        subItemName: budgetForm.subItemName.trim(),
        accountCode: budgetForm.accountCode,
        contraAccountCode: budgetForm.contraAccountCode,
        amount: amt,
        spent: 0,
        memo: budgetForm.memo,
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

  /* ── 금액 포맷 입력 ── */
  const handleAmountInput = (val: string) => {
    const digits = val.replace(/[^\d]/g, '')
    setBudgetForm(f => ({ ...f, amount: digits ? Number(digits).toLocaleString('ko-KR') : '' }))
  }

  return (
    <div className="space-y-4">
      {/* ── 예산구분 관리 ── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[var(--text-primary)]">
            <PieChart size={16} className="text-primary-500" /> 예산구분 관리
          </div>
          <button
            onClick={() => openCatModal()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[12px] font-bold text-[var(--text-secondary)] hover:border-primary-400 hover:text-primary-500 transition-all cursor-pointer"
          >
            <Plus size={12} /> 구분 추가
          </button>
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
                  {/* 수정 / 삭제 */}
                  <div className="flex border-t border-[var(--border-default)]">
                    <button
                      onClick={e => { e.stopPropagation(); openCatModal(cat.id) }}
                      className="flex-1 py-2 text-[11px] font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer border-r border-[var(--border-default)]"
                    >
                      수정
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); deleteCat(cat.id) }}
                      className="flex-1 py-2 text-[11px] font-bold text-danger hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
                    >
                      삭제
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
            </div>
            <button
              onClick={() => openBudgetModal()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-500 text-white text-[12px] font-bold hover:bg-primary-600 transition-all cursor-pointer"
            >
              <Plus size={12} /> 예산 추가
            </button>
          </div>

          {filtered.length === 0 ? (
            <div className="p-8 text-center">
              <EmptyState emoji="💰" title="등록된 예산이 없습니다" />
              <p className="text-[11px] text-[var(--text-muted)] mt-1">"예산 추가" 버튼을 눌러 등록하세요</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="bg-[var(--bg-muted)]">
                    {['예산항목', '예산세목', '자동분개', '편성액', '집행액', '잔여', '소진율', '관리'].map(h => (
                      <th key={h} className={cn("py-2.5 px-3.5 text-[11px] font-bold text-[var(--text-muted)]", h === '관리' ? 'text-center w-[80px]' : 'text-left')}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(b => {
                    const pct = b.amount > 0 ? Math.round((b.spent || 0) / b.amount * 100) : 0
                    const color = pct > 100 ? '#ef4444' : pct > 80 ? '#f59e0b' : '#4f6ef7'
                    return (
                      <tr key={b.id} className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-muted)] transition-colors">
                        <td className="py-2.5 px-3.5 text-[12px] font-bold text-[var(--text-primary)]">{b.itemName}</td>
                        <td className="py-2.5 px-3.5 text-[12px] text-[var(--text-secondary)]">{b.subItemName || '-'}</td>
                        <td className="py-2.5 px-3.5">
                          {b.contraAccountCode && b.accountCode ? (
                            <div className="flex items-center gap-1 text-[10px]">
                              <span className="font-bold text-[#4f6ef7]">차</span>
                              <span className="font-mono text-[var(--text-muted)]">{b.accountCode}</span>
                              <span className="text-[var(--text-muted)]">→</span>
                              <span className="font-bold text-[#ef4444]">대</span>
                              <span className="font-mono text-[var(--text-muted)]">{b.contraAccountCode}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-[var(--text-muted)]">{b.accountCode || '-'}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-[var(--text-primary)] text-right">{formatNumber(b.amount)}원</td>
                        <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-danger text-right">{formatNumber(b.spent || 0)}원</td>
                        <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-right" style={{ color: (b.amount - (b.spent || 0)) < 0 ? '#ef4444' : '#22c55e' }}>
                          {formatNumber(b.amount - (b.spent || 0))}원
                        </td>
                        <td className="py-2.5 px-3.5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden max-w-[80px]">
                              <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
                            </div>
                            <span className="text-[11px] font-extrabold" style={{ color }}>{pct}%</span>
                            {pct > 100 && <span className="text-[10px] text-danger font-bold">⚠️</span>}
                          </div>
                        </td>
                        <td className="py-2.5 px-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openBudgetModal(b.id as number)}
                              className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:bg-primary-100 hover:text-primary-500 transition-all cursor-pointer"
                              title="수정"
                            >
                              <Edit3 size={12} />
                            </button>
                            <button
                              onClick={() => deleteBudgetItem(b.id as number)}
                              className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:bg-red-100 hover:text-danger transition-all cursor-pointer"
                              title="삭제"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-[var(--bg-muted)]">
                    <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-[var(--text-primary)]" colSpan={2}>합계</td>
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
              {/* 통장/계좌 관리 */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-[var(--text-muted)]">
                    통장/계좌
                    {catForm.accounts.length > 0 && <span className="ml-1 text-[9px] bg-blue-100 dark:bg-blue-900/20 text-blue-600 px-1.5 py-0.5 rounded">{catForm.accounts.length}개</span>}
                  </label>
                  <button
                    type="button"
                    onClick={() => setCatForm(f => ({ ...f, accounts: [...f.accounts, { id: Date.now(), bankName: '', cards: [] }] }))}
                    className="text-[10px] font-bold text-primary-500 hover:text-primary-600 cursor-pointer flex items-center gap-0.5"
                  >
                    + 계좌 추가
                  </button>
                </div>
                {catForm.accounts.length === 0 ? (
                  <div className="text-center text-[11px] text-[var(--text-muted)] py-3 border border-dashed border-[var(--border-default)] rounded-lg">등록된 계좌가 없습니다</div>
                ) : (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {catForm.accounts.map((acct, ai) => (
                      <div key={acct.id} className="border border-[var(--border-default)] rounded-lg p-2.5 bg-[var(--bg-muted)]/30">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-[9px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">계좌 {ai + 1}</span>
                          <input
                            value={acct.bankName}
                            onChange={e => {
                              const v = e.target.value
                              setCatForm(f => ({ ...f, accounts: f.accounts.map((a, i) => i === ai ? { ...a, bankName: v } : a) }))
                            }}
                            placeholder="예) 기업은행 10110-11001-12"
                            className="flex-1 px-2 py-1.5 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] text-[12px] text-[var(--text-primary)] outline-none focus:border-primary-400"
                          />
                          <button
                            type="button"
                            onClick={() => setCatForm(f => ({ ...f, accounts: f.accounts.filter((_, i) => i !== ai) }))}
                            className="p-1 rounded text-[#ef4444] hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                          ><Trash2 size={12} /></button>
                        </div>
                        {/* 연결 카드 */}
                        <div className="pl-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-bold text-[var(--text-muted)]">연결 카드</span>
                            <button
                              type="button"
                              onClick={() => setCatForm(f => ({ ...f, accounts: f.accounts.map((a, i) => i === ai ? { ...a, cards: [...a.cards, ''] } : a) }))}
                              className="text-[9px] font-bold text-amber-500 hover:text-amber-600 cursor-pointer"
                            >+ 카드 추가</button>
                          </div>
                          {acct.cards.length === 0 ? (
                            <div className="text-[10px] text-[var(--text-muted)]/60 py-1">연결된 카드 없음</div>
                          ) : (
                            <div className="space-y-1">
                              {acct.cards.map((card, ci) => (
                                <div key={ci} className="flex items-center gap-1">
                                  <span className="text-[9px] text-amber-500">💳</span>
                                  <input
                                    value={card}
                                    onChange={e => {
                                      const v = e.target.value
                                      setCatForm(f => ({ ...f, accounts: f.accounts.map((a, i) => i === ai ? { ...a, cards: a.cards.map((c, j) => j === ci ? v : c) } : a) }))
                                    }}
                                    placeholder="카드번호 또는 카드명"
                                    className="flex-1 px-2 py-1 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] text-[11px] text-[var(--text-primary)] outline-none focus:border-amber-400"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setCatForm(f => ({ ...f, accounts: f.accounts.map((a, i) => i === ai ? { ...a, cards: a.cards.filter((_, j) => j !== ci) } : a) }))}
                                    className="p-0.5 rounded text-[#ef4444] hover:bg-red-50 cursor-pointer"
                                  ><X size={10} /></button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
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
                  {catForm.users.length > 0 && <span className="ml-1.5 text-[9px] bg-primary-100 dark:bg-primary-900/20 text-primary-600 px-1.5 py-0.5 rounded">{catForm.users.length}명</span>}
                </label>
                <div className="border border-[var(--border-default)] rounded-lg max-h-[140px] overflow-y-auto p-1.5">
                  {staffListForBudget.length === 0 ? (
                    <div className="text-center text-[11px] text-[var(--text-muted)] py-2">등록된 직원이 없습니다</div>
                  ) : (
                    staffListForBudget.map(s => {
                      const checked = catForm.users.includes(s.name)
                      return (
                        <label key={s.id || s.name}
                          className={cn('flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors text-[12px]',
                            checked ? 'bg-primary-50 dark:bg-primary-900/10' : 'hover:bg-[var(--bg-muted)]'
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setCatForm(f => ({
                                ...f,
                                users: checked ? f.users.filter(u => u !== s.name) : [...f.users, s.name]
                              }))
                            }}
                            className="accent-primary-500 w-3.5 h-3.5"
                          />
                          <span className={cn('font-bold', checked ? 'text-primary-600' : 'text-[var(--text-primary)]')}>{s.name}</span>
                          <span className="text-[10px] text-[var(--text-muted)]">{s.position || ''} {s.department || ''}</span>
                        </label>
                      )
                    })
                  )}
                </div>
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
                      {filteredItemNames.map(name => (
                        <button key={name}
                          onClick={() => {
                            setBudgetForm(f => ({ ...f, itemName: name }))
                            setItemNameSearch(name)
                            setItemNamePopup(false)
                          }}
                          className={cn('w-full text-left text-[12px] px-3 py-2 rounded-lg cursor-pointer transition-colors',
                            budgetForm.itemName === name ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 font-bold' : 'hover:bg-[var(--bg-muted)] text-[var(--text-secondary)]')}
                        >
                          {name}
                        </button>
                      ))}
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

              {/* 예산세목 입력 */}
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">예산세목</label>
                <input
                  value={budgetForm.subItemName}
                  onChange={e => setBudgetForm(f => ({ ...f, subItemName: e.target.value }))}
                  placeholder="예산세목을 입력하세요 (선택)"
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors"
                />
              </div>

              {/* 계정과목 - 검색 콤보박스 */}
              <div className="relative">
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">계정과목 *</label>
                <div
                  onClick={() => { setAcctPopup(!acctPopup); setItemNamePopup(false) }}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm cursor-pointer hover:border-primary-400 transition-colors min-h-[40px] flex items-center"
                >
                  {budgetForm.accountCode ? (
                    <span className="text-[var(--text-primary)] font-semibold">
                      <span className="text-primary-500 font-mono">{budgetForm.accountCode}</span>
                      {' '}{accounts.find(a => a.code === budgetForm.accountCode)?.name || ''}
                    </span>
                  ) : (
                    <span className="text-[var(--text-muted)]">계정과목을 선택하세요</span>
                  )}
                </div>
                {acctPopup && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-xl z-50 max-h-[280px] overflow-hidden">
                    <div className="p-2 border-b border-[var(--border-default)]">
                      <input
                        value={acctSearch}
                        onChange={e => setAcctSearch(e.target.value)}
                        placeholder="코드 또는 이름으로 검색..."
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-[var(--text-primary)] outline-none focus:border-primary-400"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-[220px] overflow-y-auto p-1.5">
                      {filteredAccounts.map(a => (
                        <button key={a.code}
                          onClick={() => {
                            const contra = suggestContraAccount(a.code)
                            setBudgetForm(f => ({ ...f, accountCode: a.code, contraAccountCode: contra }))
                            setAcctPopup(false)
                            setAcctSearch('')
                          }}
                          className={cn('w-full text-left text-[12px] px-3 py-2 rounded-lg cursor-pointer transition-colors flex items-center gap-2',
                            budgetForm.accountCode === a.code ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 font-bold' : 'hover:bg-[var(--bg-muted)] text-[var(--text-secondary)]')}
                        >
                          <span className="font-mono text-primary-500 text-[11px] font-bold w-[40px] shrink-0">{a.code}</span>
                          <span className="flex-1">{a.name}</span>
                          <span className="text-[9px] text-[var(--text-muted)] shrink-0">{a.group || a.type}</span>
                        </button>
                      ))}
                      {filteredAccounts.length === 0 && (
                        <div className="text-center text-xs text-[var(--text-muted)] py-3">검색 결과가 없습니다</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 자동분개: 상대계정(대변) 선택 */}
              <div className="relative">
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 flex items-center gap-1">
                  상대계정 (대변)
                  <span className="text-[9px] font-normal text-[var(--text-muted)]">— 자동분개</span>
                  {budgetForm.contraAccountCode && budgetForm.accountCode && budgetForm.contraAccountCode === suggestContraAccount(budgetForm.accountCode) && (
                    <span className="text-[8px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">⚙ 시스템 추천</span>
                  )}
                  {budgetForm.contraAccountCode && budgetForm.accountCode && budgetForm.contraAccountCode !== suggestContraAccount(budgetForm.accountCode) && (
                    <span className="text-[8px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">✎ 사용자 설정</span>
                  )}
                </label>
                <div
                  onClick={() => { setContraAcctPopup(!contraAcctPopup); setAcctPopup(false); setItemNamePopup(false) }}
                  className={cn(
                    'w-full px-3 py-2.5 rounded-lg border bg-[var(--bg-surface)] text-sm cursor-pointer hover:border-primary-400 transition-colors min-h-[40px] flex items-center',
                    budgetForm.contraAccountCode ? 'border-amber-300 dark:border-amber-600' : 'border-[var(--border-default)]'
                  )}
                >
                  {budgetForm.contraAccountCode ? (
                    <span className="text-[var(--text-primary)] font-semibold flex items-center gap-1.5">
                      <span className="text-amber-500 font-mono text-[11px] font-bold">{budgetForm.contraAccountCode}</span>
                      {accounts.find(a => a.code === budgetForm.contraAccountCode)?.name || ''}
                      <button onClick={e => { e.stopPropagation(); setBudgetForm(f => ({ ...f, contraAccountCode: '' })) }}
                        className="ml-1 text-[var(--text-muted)] hover:text-danger text-xs cursor-pointer">✕</button>
                    </span>
                  ) : (
                    <span className="text-[var(--text-muted)]">상대계정을 선택하세요 (선택)</span>
                  )}
                </div>
                {budgetForm.contraAccountCode && budgetForm.accountCode && (
                  <div className="mt-1.5 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
                    <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mb-1">⚡ 자동분개 미리보기</div>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="font-bold text-[#4f6ef7]">차변</span>
                      <span className="font-mono text-[var(--text-secondary)]">{budgetForm.accountCode} {accounts.find(a => a.code === budgetForm.accountCode)?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="font-bold text-[#ef4444]">대변</span>
                      <span className="font-mono text-[var(--text-secondary)]">{budgetForm.contraAccountCode} {accounts.find(a => a.code === budgetForm.contraAccountCode)?.name}</span>
                    </div>
                  </div>
                )}
                {contraAcctPopup && (() => {
                  const mainAcct = accounts.find(x => x.code === budgetForm.accountCode)
                  const mainType = mainAcct?.type || 'expense'
                  const isMainDebit = ['asset', 'expense'].includes(mainType)
                  const mainName = mainAcct?.name || budgetForm.accountCode
                  const headerText = mainAcct
                    ? (mainType === 'asset' ? `💰 ${mainName} 들어올 때 · 나갈 때`
                      : mainType === 'expense' ? `📤 ${mainName} 지출할 때`
                      : mainType === 'revenue' ? `💵 ${mainName} 발생할 때`
                      : `${mainName} 거래 시`)
                    : '상대계정 선택'
                  const getSit = (contra: typeof mainAcct) => {
                    if (!contra || !mainAcct) return ''
                    const ct = contra.type
                    if (mainType === 'asset' && ct === 'revenue') return `${contra.name} 발생 → ${mainName} 입금`
                    if (mainType === 'asset' && ct === 'liability') return `${contra.name} 발생/증가`
                    if (mainType === 'asset' && ct === 'asset') return `${contra.name}에서 이동`
                    if (mainType === 'expense' && ct === 'asset') return `${contra.name}에서 출금`
                    if (mainType === 'expense' && ct === 'liability') return `${contra.name}으로 미지급`
                    if (mainType === 'revenue' && ct === 'asset') return `${contra.name}으로 수령`
                    return `${contra.name} 거래`
                  }
                  // 비활성 계정 제외
                  const list = filteredContraAccounts.filter(x => x.active !== false)
                  return (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-xl z-50 overflow-hidden">
                    {/* 헤더 */}
                    <div className="px-3 py-2 border-b border-[var(--border-default)] bg-[var(--bg-muted)]/50 flex items-center justify-between">
                      <div className="text-[11px] font-bold text-[var(--text-primary)]">{headerText}</div>
                      <button onClick={() => setContraAcctPopup(false)} className="p-1 rounded hover:bg-[var(--bg-muted)] text-[var(--text-muted)] cursor-pointer">
                        <X size={14} />
                      </button>
                    </div>
                    {/* 검색 */}
                    <div className="p-2 border-b border-[var(--border-default)]">
                      <input
                        value={contraAcctSearch}
                        onChange={e => setContraAcctSearch(e.target.value)}
                        placeholder="코드 또는 이름으로 검색..."
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-[var(--text-primary)] outline-none focus:border-primary-400"
                        autoFocus
                      />
                    </div>
                    {/* 테이블 헤더 */}
                    <div className="flex border-b border-[var(--border-default)]">
                      <div className="w-[100px] shrink-0 px-2 py-1 bg-blue-50 dark:bg-blue-900/10">
                        <span className="text-[9px] font-bold text-[#4f6ef7]">차변</span>
                      </div>
                      <div className="w-[100px] shrink-0 px-2 py-1 bg-red-50 dark:bg-red-900/10 border-l border-[var(--border-default)]">
                        <span className="text-[9px] font-bold text-[#ef4444]">대변</span>
                      </div>
                      <div className="flex-1 px-2 py-1 bg-amber-50 dark:bg-amber-900/10 border-l border-[var(--border-default)]">
                        <span className="text-[9px] font-bold text-amber-600">상황</span>
                      </div>
                    </div>
                    {/* 목록 */}
                    <div className="max-h-[200px] overflow-y-auto">
                      {list.map(ca => (
                        <div key={ca.code}
                          onClick={() => {
                            setBudgetForm(f => ({ ...f, contraAccountCode: ca.code }))
                            setContraAcctPopup(false)
                            setContraAcctSearch('')
                          }}
                          className={cn('flex items-center border-b border-[var(--border-default)] last:border-0 cursor-pointer transition-colors',
                            budgetForm.contraAccountCode === ca.code ? 'bg-amber-50 dark:bg-amber-900/20' : 'hover:bg-[var(--bg-muted)]/50')}
                        >
                          <div className="w-[100px] shrink-0 px-2 py-1.5">
                            <div className="text-[10px] font-bold text-[#4f6ef7] truncate">{isMainDebit ? mainName : ca.name}</div>
                          </div>
                          <div className="w-[100px] shrink-0 px-2 py-1.5 border-l border-[var(--border-default)]">
                            <div className="text-[10px] font-bold text-[#ef4444] truncate">{isMainDebit ? ca.name : mainName}</div>
                          </div>
                          <div className="flex-1 px-2 py-1.5 border-l border-[var(--border-default)]">
                            <div className="text-[9px] text-[var(--text-secondary)] truncate">{getSit(ca)}</div>
                          </div>
                        </div>
                      ))}
                      {list.length === 0 && (
                        <div className="text-center text-xs text-[var(--text-muted)] py-3">검색 결과가 없습니다</div>
                      )}
                    </div>
                  </div>
                  )
                })()}
              </div>

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
    </div>
  )
}

/* ═══════════════════════════════════════════
   품의 (Approval) — CRUD
   ═══════════════════════════════════════════ */
function AcctApproval({ year }: { year: number }) {
  const [refresh, setRefresh] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [detailApproval, setDetailApproval] = useState<Approval | null>(null)
  const [approvalBtnLabel, setApprovalBtnLabel] = useState(() => getItem('acct_approval_btn_label', '지출품의 등록'))
  const [editingBtnLabel, setEditingBtnLabel] = useState(false)
  const [editingDescText, setEditingDescText] = useState('')
  const [editingTitleText, setEditingTitleText] = useState('')

  const currentUser = useAuthStore(s => s.user)
  const currentUserName = currentUser?.name || (() => { try { const u = JSON.parse(localStorage.getItem('ws_user') || '{}'); return u?.name } catch { return '' } })() || 'admin'
  const [form, setForm] = useState({ title: '', amount: '', date: new Date().toISOString().slice(0, 10), accountCode: '', description: '', applicant: currentUserName, approver: '', budgetItem: '', budgetSubItem: '' })
  const staffList = useStaffStore(s => s.staff).filter(s => !s.resignedAt)

  const budgetCats = useMemo(() => getItem<BudgetCat[]>('acct_budget_cats', []).filter(c => c.year === year), [year, refresh])
  const budgetItems = useMemo(() => getItem<BudgetItem[]>('acct_budgets', []).filter(b => b.year === year), [year, refresh])

  const approvals = useMemo(() => {
    const all = getItem<Approval[]>('acct_approvals', [])
    return all.filter(a => {
      const dateStr = a.date || a.createdAt
      return dateStr && parseInt(String(dateStr).substring(0, 4)) === year
    }).sort((a, b) => (b.createdAt || b.date || '').localeCompare(a.createdAt || a.date || ''))
  }, [year, refresh])

  const statusInfo: Record<string, { label: string; color: string; bg: string }> = {
    preExpense: { label: '선지출', color: '#f97316', bg: 'rgba(249,115,22,.1)' },
    pending: { label: '품의할', color: '#f59e0b', bg: 'rgba(245,158,11,.1)' },
    rejected: { label: '반려된', color: '#ef4444', bg: 'rgba(239,68,68,.1)' },
    approved: { label: '승인된', color: '#22c55e', bg: 'rgba(34,197,94,.1)' },
    expensed: { label: '지출된', color: '#3b82f6', bg: 'rgba(59,130,246,.1)' },
    toResolve: { label: '결의할', color: '#06b6d4', bg: 'rgba(6,182,212,.1)' },
    confirming: { label: '정산중', color: '#8b5cf6', bg: 'rgba(139,92,246,.1)' },
    completed: { label: '완료됨', color: '#4f6ef7', bg: 'rgba(79,110,247,.1)' },
    vouchered: { label: '완료됨', color: '#4f6ef7', bg: 'rgba(79,110,247,.1)' },
  }

  type GroupKey = 'myRequest' | 'myApproval' | 'myExpense'
  const groupDefs: { key: GroupKey; label: string; icon: string; color: string; subTabs: { key: string; label: string; color: string }[] }[] = [
    {
      key: 'myRequest', label: '나의 품의리스트', icon: '📝', color: '#4f6ef7',
      subTabs: [
        { key: 'preExpense', label: '선지출', color: '#f97316' },
        { key: 'pending', label: '품의한', color: '#f59e0b' },
        { key: 'rejected', label: '반려된', color: '#ef4444' },
        { key: 'approved', label: '승인된', color: '#22c55e' },
        { key: 'toResolve', label: '결의할', color: '#06b6d4' },
        { key: 'confirming', label: '정산중', color: '#8b5cf6' },
        { key: 'completed', label: '완료됨', color: '#4f6ef7' },
      ],
    },
    {
      key: 'myApproval', label: '나의 승인리스트', icon: '✅', color: '#22c55e',
      subTabs: [
        { key: 'pending', label: '승인할', color: '#f59e0b' },
        { key: 'approved', label: '승인한', color: '#22c55e' },
        { key: 'rejected', label: '반려한', color: '#ef4444' },
        { key: 'expensed', label: '지출된', color: '#3b82f6' },
        { key: 'toResolve', label: '결의할', color: '#06b6d4' },
        { key: 'confirming', label: '정산중', color: '#8b5cf6' },
        { key: 'completed', label: '완료됨', color: '#4f6ef7' },
      ],
    },
    {
      key: 'myExpense', label: '나의 지출리스트', icon: '💰', color: '#f59e0b',
      subTabs: [
        { key: 'expensed', label: '지출할', color: '#3b82f6' },
        { key: 'toResolve', label: '정산할', color: '#06b6d4' },
        { key: 'completed', label: '완료됨', color: '#4f6ef7' },
      ],
    },
  ]

  const [activeGroup, setActiveGroup] = useState<GroupKey>('myRequest')
  const [subTab, setSubTab] = useState<string>('preExpense')

  const currentGroup = groupDefs.find(g => g.key === activeGroup)!

  const changeGroup = (gk: GroupKey) => {
    setActiveGroup(gk)
    const g = groupDefs.find(g => g.key === gk)!
    setSubTab(g.subTabs[0].key)
  }

  // 나의 품의리스트에서 반려된 탭: 내가 신청한 것 + 내가 승인자로서 반려한 것 모두 포함
  const isMyRequestRejected = (a: Approval, groupKey: string, tabKey: string) => {
    if (groupKey === 'myRequest' && tabKey === 'rejected' && a.status === 'rejected') {
      return (a as any).applicant === currentUserName || (a as any).approver === currentUserName
    }
    return false
  }

  const getSubTabCount = (tabKey: string) => {
    const userFiltered = approvals.filter(a => {
      // 반려된 탭 특수 처리: 내가 신청한 것 + 내가 반려한 것 모두 포함
      if (isMyRequestRejected(a, activeGroup, tabKey)) return true
      if (activeGroup === 'myRequest' && (a as any).applicant !== currentUserName) return false
      if (activeGroup === 'myApproval' && (a as any).approver !== currentUserName) return false
      if (activeGroup === 'myExpense') {
        const bCats: BudgetCat[] = getItem('acct_budget_cats', [])
        const uCatIds = new Set(bCats.filter(c => c.users && c.users.includes(currentUserName)).map(c => String(c.id)))
        const uCatNames = new Set(bCats.filter(c => c.users && c.users.includes(currentUserName)).map(c => c.name))
        const hasCatId = (a as any).budgetCatId && uCatIds.has(String((a as any).budgetCatId))
        const hasCatName = (a as any).budgetCatName && uCatNames.has((a as any).budgetCatName)
        if (!hasCatId && !hasCatName && (a as any).applicant !== currentUserName) return false
      }
      return true
    })
    if (tabKey === 'completed') return userFiltered.filter(a => ['completed', 'vouchered'].includes(a.status)).length
    // 정산할 탭: toResolve + confirming
    if (tabKey === 'toResolve' && activeGroup === 'myExpense') return userFiltered.filter(a => a.status === 'confirming').length
    return userFiltered.filter(a => a.status === tabKey).length
  }

  const filteredApprovals = approvals.filter(a => {
    // 나의 품의리스트 → 반려된 탭: 내가 신청한 것 + 내가 승인자로서 반려한 것
    if (isMyRequestRejected(a, activeGroup, subTab)) return true
    // 그룹별 본인 기준 필터
    if (activeGroup === 'myRequest' && (a as any).applicant !== currentUserName) return false
    if (activeGroup === 'myApproval' && (a as any).approver !== currentUserName) return false
    if (activeGroup === 'myExpense') {
      const budgetCats: BudgetCat[] = getItem('acct_budget_cats', [])
      const userCatIds = new Set(budgetCats.filter(c => c.users && c.users.includes(currentUserName)).map(c => String(c.id)))
      const userCatNames = new Set(budgetCats.filter(c => c.users && c.users.includes(currentUserName)).map(c => c.name))
      const hasCatId = (a as any).budgetCatId && userCatIds.has(String((a as any).budgetCatId))
      const hasCatName = (a as any).budgetCatName && userCatNames.has((a as any).budgetCatName)
      if (!hasCatId && !hasCatName && (a as any).applicant !== currentUserName) return false
    }
    // 상태 필터
    if (subTab === 'completed') return ['completed', 'vouchered'].includes(a.status)
    // 나의 지출리스트 정산할 탭: confirming 상태만 표시
    if (subTab === 'toResolve' && activeGroup === 'myExpense') return a.status === 'confirming'
    return a.status === subTab
  })

  const groupCounts = groupDefs.map(g => {
    const keys = [...new Set(g.subTabs.map(t => t.key))]
    return approvals.filter(a => {
      // 반려된 항목 특수 처리
      if (g.key === 'myRequest' && a.status === 'rejected' && keys.includes('rejected')) {
        return (a as any).applicant === currentUserName || (a as any).approver === currentUserName
      }
      // 그룹별 본인 기준 필터
      if (g.key === 'myRequest' && (a as any).applicant !== currentUserName) return false
      if (g.key === 'myApproval' && (a as any).approver !== currentUserName) return false
      if (g.key === 'myExpense') {
        const budgetCats: BudgetCat[] = getItem('acct_budget_cats', [])
        const userCatIds = new Set(budgetCats.filter(c => c.users && c.users.includes(currentUserName)).map(c => String(c.id)))
        const userCatNames = new Set(budgetCats.filter(c => c.users && c.users.includes(currentUserName)).map(c => c.name))
        const hasCatId = (a as any).budgetCatId && userCatIds.has(String((a as any).budgetCatId))
        const hasCatName = (a as any).budgetCatName && userCatNames.has((a as any).budgetCatName)
        if (!hasCatId && !hasCatName && (a as any).applicant !== currentUserName) return false
      }
      if (keys.includes('completed') && ['completed', 'vouchered'].includes(a.status)) return true
      // myExpense: 정산할 탭은 confirming만 표시, toResolve는 제외
      if (g.key === 'myExpense' && a.status === 'toResolve') return false
      if (g.key === 'myExpense' && keys.includes('toResolve') && a.status === 'confirming') return true
      return keys.includes(a.status)
    }).length
  })

  const handleAmtInput = (val: string) => {
    const digits = val.replace(/[^\d]/g, '')
    setForm(f => ({ ...f, amount: digits ? Number(digits).toLocaleString('ko-KR') : '' }))
  }

  const saveApproval = () => {
    if (!form.title.trim()) return alert('품의명을 입력해주세요')
    const amt = parseInt(form.amount.replace(/,/g, '')) || 0
    if (amt <= 0) return alert('금액을 입력해주세요')
    const approverList = staffList.filter(s => (s as any).approverType === 'approver')
    const autoApprover = form.approver || (approverList.length > 0 ? approverList[0].name : (staffList.length > 0 ? staffList[0].name : ''))
    const all = getItem<Approval[]>('acct_approvals', [])
    if (editingId) {
      // 수정 모드
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
      // 신규 등록
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
        budgetItem: form.budgetItem,
        budgetSubItem: form.budgetSubItem,
        createdAt: new Date().toISOString(),
      })
      setItem('acct_approvals', all)
    }
    setModalOpen(false)
    setEditingId(null)
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
    if (!confirm('이 품의를 삭제하시겠습니까?')) return
    const all = getItem<Approval[]>('acct_approvals', []).filter(a => String(a.id) !== String(id))
    setItem('acct_approvals', all)
    setRefresh(r => r + 1)
  }

  // ── 승인/반려 워크플로우 상태 ──
  const [approveMode, setApproveMode] = useState(false)
  const [rejectMode, setRejectMode] = useState(false)
  const [resubmitMode, setResubmitMode] = useState(false)
  const [resubmitForm, setResubmitForm] = useState({ title: '', amount: '', date: '', description: '' })
  const [approvePw, setApprovePw] = useState('')
  const [approvePwError, setApprovePwError] = useState('')
  const [approveBudgetCat, setApproveBudgetCat] = useState('')
  const [approveBudgetItem, setApproveBudgetItem] = useState('')
  const [approveBudgetSub, setApproveBudgetSub] = useState('')

  // 승인할 탭에서의 상세 열기 여부
  const isApproverPendingView = activeGroup === 'myApproval' && subTab === 'pending'

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

  // 선택된 예산항목의 세목 목록 (항상 표시)
  const approveFilteredSubs = useMemo(() => {
    if (!approveBudgetItem) return [] as BudgetItem[]
    const selectedItem = budgetItems.find(b => String(b.id) === String(approveBudgetItem))
    if (!selectedItem) return []
    // 같은 catId + 같은 itemName을 가진 모든 세부 항목
    return budgetItems.filter(b =>
      String(b.catId) === String(selectedItem.catId) &&
      b.itemName === selectedItem.itemName
    )
  }, [approveBudgetItem, budgetItems])

  // 선택된 예산의 남은 금액 계산
  const approveRemainingBudget = useMemo(() => {
    // 세목이 선택된 경우 해당 세목의 잔액
    if (approveBudgetSub) {
      const sub = budgetItems.find(b => String(b.id) === String(approveBudgetSub))
      if (sub) return { amount: sub.amount || 0, spent: sub.spent || 0, remaining: (sub.amount || 0) - (sub.spent || 0) }
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
  }, [approveBudgetItem, approveBudgetSub, budgetItems])

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
  }

  // 재품의 확인: 내용 수정 후 status를 pending으로 변경
  const handleResubmitConfirm = () => {
    if (!resubmitForm.title.trim()) { setApprovePwError('품의명을 입력해주세요'); return }
    const amt = parseInt(resubmitForm.amount.replace(/,/g, '')) || 0
    if (amt <= 0) { setApprovePwError('금액을 입력해주세요'); return }
    if (!detailApproval) return
    const approverList = staffList.filter(s => (s as any).approverType === 'approver')
    const autoApprover = approverList.length > 0 ? approverList[0].name : (staffList.length > 0 ? staffList[0].name : '')
    const all = getItem<Approval[]>('acct_approvals', [])
    const updated = all.map(a => String(a.id) === String(detailApproval.id) ? {
      ...a,
      title: resubmitForm.title.trim(),
      amount: amt,
      date: resubmitForm.date || new Date().toISOString().slice(0, 10),
      description: resubmitForm.description,
      status: (detailApproval.status === 'rejected' || detailApproval.status === 'preExpense') ? 'pending' : detailApproval.status,
      applicant: currentUserName,
      approver: autoApprover,
      budgetCatId: detailApproval.status === 'preExpense' ? (a as any).budgetCatId : undefined,
      budgetItemId: detailApproval.status === 'preExpense' ? (a as any).budgetItemId : undefined,
      budgetSubId: detailApproval.status === 'preExpense' ? (a as any).budgetSubId : undefined,
      budgetItem: detailApproval.status === 'preExpense' ? (a as any).budgetItem : undefined,
      budgetSubItem: detailApproval.status === 'preExpense' ? (a as any).budgetSubItem : undefined,
      budgetCatName: detailApproval.status === 'preExpense' ? (a as any).budgetCatName : undefined,
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

  const handleApproveConfirm = () => {
    if (!approveBudgetCat) { setApprovePwError('예산구분을 선택해주세요'); return }
    if (!approveBudgetItem) { setApprovePwError('예산항목을 선택해주세요'); return }
    // 세목이 존재하는 항목이면 세목 선택 필수
    if (approveFilteredSubs.length > 0 && !approveBudgetSub) { setApprovePwError('예산세목을 선택해주세요'); return }
    if (!approvePw.trim()) { setApprovePwError('비밀번호를 입력해주세요'); return }
    // 비밀번호 검증: 현재 로그인 사용자의 pw 확인
    const myStaff = staffList.find(s => s.name === currentUserName)
    if (myStaff && myStaff.pw && myStaff.pw !== approvePw) {
      setApprovePwError('비밀번호가 일치하지 않습니다'); return
    }
    if (!detailApproval) return
    // 승인 처리 + 예산 정보 저장 (ID + 이름 모두 저장)
    const all = getItem<Approval[]>('acct_approvals', [])
    const selectedBudgetItem = budgetItems.find(b => String(b.id) === String(approveBudgetItem))
    const selectedBudgetSub = approveBudgetSub ? budgetItems.find(b => String(b.id) === String(approveBudgetSub)) : null
    const selectedCat = budgetCats.find(c => String(c.id) === String(approveBudgetCat))
    const updated = all.map(a => String(a.id) === String(detailApproval.id) ? {
      ...a,
      status: 'approved',
      approver: currentUserName,
      budgetCatId: approveBudgetCat,
      budgetCatName: selectedCat?.name || '',
      budgetItemId: approveBudgetItem,
      budgetItem: selectedBudgetItem?.itemName || '',
      budgetSubId: approveBudgetSub || undefined,
      budgetSubItem: selectedBudgetSub?.subItemName || selectedBudgetSub?.itemName || selectedBudgetItem?.subItemName || '',
      approvedAt: new Date().toISOString(),
    } : a)
    setItem('acct_approvals', updated)
    resetApproveState()
    setDetailApproval(null)
    setRefresh(r => r + 1)
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
    } : a)
    setItem('acct_approvals', updated)
    setRefresh(r => r + 1)
    resetApproveState()
    setDetailApproval(null)
  }

  return (
    <div className="space-y-4">
      {/* ── 3개 그룹 카드 ── */}
      <div className="grid grid-cols-3 gap-3">
        {groupDefs.map((g, gi) => (
          <div key={g.key}
            onClick={() => changeGroup(g.key)}
            className={cn('bg-[var(--bg-surface)] border-2 rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg',
              activeGroup === g.key ? 'shadow-md' : 'border-[var(--border-default)] opacity-70 hover:opacity-100'
            )}
            style={activeGroup === g.key ? { borderColor: g.color } : {}}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{g.icon}</span>
              <span className="text-[12px] font-extrabold text-[var(--text-primary)]">{g.label}</span>
            </div>
            <div className="text-2xl font-extrabold" style={{ color: g.color }}>{groupCounts[gi]}</div>
          </div>
        ))}
      </div>

      {/* ── 세부탭 ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {currentGroup.subTabs.map(t => {
          const cnt = getSubTabCount(t.key)
          return (
            <button
              key={t.key}
              onClick={() => setSubTab(t.key)}
              className={cn(
                'text-[11px] font-bold px-3 py-1.5 rounded-full cursor-pointer transition-all border whitespace-nowrap',
                subTab === t.key
                  ? 'text-white border-transparent'
                  : 'text-[var(--text-secondary)] border-[var(--border-default)] hover:border-primary-400'
              )}
              style={subTab === t.key ? { background: t.color, borderColor: t.color } : {}}
            >
              {t.label} {cnt}
            </button>
          )
        })}
      </div>

      {/* ── 목록 ── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border-default)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck size={14} className="text-primary-500" />
              {editingBtnLabel ? (
                <input
                  autoFocus
                  value={editingTitleText}
                  onChange={e => setEditingTitleText(e.target.value)}
                  onBlur={() => setItem(`acct_title_${activeGroup}_${subTab}`, editingTitleText)}
                  onKeyDown={e => { if (e.key === 'Enter') { setItem(`acct_title_${activeGroup}_${subTab}`, editingTitleText); setEditingBtnLabel(false) } }}
                  className="text-sm font-extrabold text-[var(--text-primary)] px-1 py-0.5 rounded border border-primary-300 bg-[var(--bg-surface)] outline-none w-[180px]"
                />
              ) : (
                <span className="text-sm font-extrabold text-[var(--text-primary)]">
                  {(() => {
                    const titleDefaults: Record<string, Record<string, string>> = {
                      myApproval: { pending:'승인할 품의목록', approved:'승인한 품의목록', rejected:'반려한 품의목록', expensed:'지출된 품의목록', toResolve:'결의할 품의목록', completed:'완료된 품의목록' },
                      myRequest: { preExpense:'선지출 품의목록', pending:'품의한 품의목록', rejected:'반려된 품의목록', approved:'승인된 품의목록', expensed:'지출된 품의목록', toResolve:'결의할 품의목록', confirming:'확인중 품의목록', completed:'완료된 품의목록' },
                    }
                    const def = titleDefaults[activeGroup]?.[subTab] || '품의 목록'
                    return getItem(`acct_title_${activeGroup}_${subTab}`, def)
                  })()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {activeGroup === 'myRequest' && (
                <button
                  onClick={() => setModalOpen(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-500 text-white text-[12px] font-bold hover:bg-primary-600 transition-all cursor-pointer"
                >
                  <Plus size={13} /> {approvalBtnLabel}
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <button
              onClick={() => {
                const isEditing = !editingBtnLabel
                setEditingBtnLabel(isEditing)
                if (isEditing) {
                  const descDefaults: Record<string, Record<string, string>> = {
                    myApproval: { pending:'나에게 승인 요청된 품의 목록입니다.', approved:'내가 승인한 품의 목록입니다.', rejected:'내가 반려한 품의 목록입니다.', expensed:'승인 후 지출이 집행된 목록입니다.', toResolve:'집행 후 결의를 작성해야 할 목록입니다.', completed:'회계처리가 완료된 목록입니다.' },
                    myRequest: { preExpense:'선지출된 리스트로 사후품의를 해야하는 목록입니다.', pending:'품의한 품의 리스트로 수정 삭제 가능합니다.', rejected:'반려된 품의 리스트로 재품의, 수정, 삭제 가능합니다.', approved:'승인된 품의 리스트로 지출담당자에게 지출을 요구하고 집행해야할 목록 입니다.', expensed:'지출이 집행된 품의 리스트입니다.', toResolve:'집행된 품의 리스트로 증빙서류 준비후 지출결의를 작성해야하는 목록 입니다.', confirming:'지출결의가 완료된 리스트로 자금집행자가 확인하고 최종 회계처리를 완료할 목록입니다.', completed:'자금집행자가 회계처리를 완료한 목록입니다.' },
                  }
                  const dDesc = descDefaults[activeGroup]?.[subTab] || ''
                  setEditingDescText(getItem(`acct_desc_${activeGroup}_${subTab}`, dDesc))
                  const titleDefaults: Record<string, Record<string, string>> = {
                    myApproval: { pending:'승인할 품의목록', approved:'승인한 품의목록', rejected:'반려한 품의목록', expensed:'지출된 품의목록', toResolve:'결의할 품의목록', completed:'완료된 품의목록' },
                    myRequest: { preExpense:'선지출 품의목록', pending:'품의한 품의목록', rejected:'반려된 품의목록', approved:'승인된 품의목록', expensed:'지출된 품의목록', toResolve:'결의할 품의목록', confirming:'확인중 품의목록', completed:'완료된 품의목록' },
                  }
                  const dTitle = titleDefaults[activeGroup]?.[subTab] || '품의 목록'
                  setEditingTitleText(getItem(`acct_title_${activeGroup}_${subTab}`, dTitle))
                }
              }}
              className="p-0.5 rounded hover:bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-all cursor-pointer"
              title="텍스트 편집"
            >
              <Settings2 size={12} />
            </button>
            {editingBtnLabel ? (
              <input
                value={editingDescText}
                onChange={e => setEditingDescText(e.target.value)}
                onBlur={() => setItem(`acct_desc_${activeGroup}_${subTab}`, editingDescText)}
                onKeyDown={e => { if (e.key === 'Enter') { setItem(`acct_desc_${activeGroup}_${subTab}`, editingDescText); setEditingBtnLabel(false) } }}
                className="flex-1 text-[11px] text-[var(--text-muted)] px-1 py-0.5 rounded border border-primary-300 bg-[var(--bg-surface)] outline-none"
              />
            ) : (
              <p className="text-[11px] text-[var(--text-muted)]">
                {(() => {
                  const descDefaults: Record<string, Record<string, string>> = {
                    myApproval: { pending:'나에게 승인 요청된 품의 목록입니다.', approved:'내가 승인한 품의 목록입니다.', rejected:'내가 반려한 품의 목록입니다.', expensed:'승인 후 지출이 집행된 목록입니다.', toResolve:'집행 후 결의를 작성해야 할 목록입니다.', completed:'회계처리가 완료된 목록입니다.' },
                    myRequest: { preExpense:'선지출된 리스트로 사후품의를 해야하는 목록입니다.', pending:'품의한 품의 리스트로 수정 삭제 가능합니다.', rejected:'반려된 품의 리스트로 재품의, 수정, 삭제 가능합니다.', approved:'승인된 품의 리스트로 지출담당자에게 지출을 요구하고 집행해야할 목록 입니다.', expensed:'지출이 집행된 품의 리스트입니다.', toResolve:'집행된 품의 리스트로 증빙서류 준비후 지출결의를 작성해야하는 목록 입니다.', confirming:'지출결의가 완료된 리스트로 자금집행자가 확인하고 최종 회계처리를 완료할 목록입니다.', completed:'자금집행자가 회계처리를 완료한 목록입니다.' },
                  }
                  const def = descDefaults[activeGroup]?.[subTab] || ''
                  return getItem(`acct_desc_${activeGroup}_${subTab}`, def)
                })()}
              </p>
            )}
          </div>
        </div>

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
                  const isResubmitted = a.status === 'pending' && (a as any).resubmittedAt
                  const si = isResubmitted
                    ? { label: '재품의', color: '#f59e0b', bg: 'rgba(245,158,11,.15)' }
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
                            )}>{a.status === 'approved' ? '승인' : a.status === 'rejected' ? '반려' : '승인'}-{(a as any).approver}</span>
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
          data={{
            date: (detailApproval.date || detailApproval.createdAt || '').slice(0, 10),
            accountName: (() => {
              const d = detailApproval as any
              if (d.budgetItemId) {
                const item = budgetItems.find(b => String(b.id) === String(d.budgetItemId))
                return item?.itemName || d.budgetItem || ''
              }
              return d.budgetItem || ''
            })(),
            evidenceType: (detailApproval as any).budgetCatName || '',
            vendor: (detailApproval as any).vendor || '',
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
          }}
          onClose={() => { resetApproveState(); setDetailApproval(null) }}
          actions={
            <>
              <button onClick={() => { resetApproveState(); setDetailApproval(null) }} className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] cursor-pointer">취소</button>
              {isApproverPendingView && detailApproval.status === 'pending' && (
                <>
                  <button onClick={() => { setApproveMode(true); setRejectMode(false); setApprovePw(''); setApprovePwError(''); const da=detailApproval as any; let catId=da.budgetCatId?String(da.budgetCatId):''; if(!catId&&da.budgetCatName){const cat=budgetCats.find(c=>c.name===da.budgetCatName);if(cat)catId=String(cat.id)} if(catId){setApproveBudgetCat(catId);const itemName=da.budgetItem||'';let itemId=da.budgetItemId?String(da.budgetItemId):'';if(!itemId&&itemName){const f=budgetItems.find(b=>String(b.catId)===catId&&b.itemName===itemName);if(f)itemId=String(f.id)} if(itemId){setApproveBudgetItem(itemId);let subId=da.budgetSubId?String(da.budgetSubId):'';if(!subId&&da.budgetSubItem){const f=budgetItems.find(b=>String(b.catId)===catId&&b.itemName===itemName&&b.subItemName===da.budgetSubItem);if(f)subId=String(f.id)} if(!subId){const subs=budgetItems.filter(b=>String(b.catId)===catId&&b.itemName===itemName&&b.subItemName);if(subs.length===1)subId=String(subs[0].id)} if(subId)setApproveBudgetSub(subId)}} }} className="px-4 py-2 rounded-lg bg-[#22c55e] text-white text-sm font-bold hover:bg-[#16a34a] cursor-pointer flex items-center gap-1 shadow-sm"><Check size={13} /> 승인</button>
                  <button onClick={() => { setRejectMode(true); setApproveMode(false); setApprovePw(''); setApprovePwError('') }} className="px-4 py-2 rounded-lg bg-[#ef4444] text-white text-sm font-bold hover:bg-[#dc2626] cursor-pointer flex items-center gap-1 shadow-sm"><Ban size={13} /> 반려</button>
                </>
              )}
              {!isApproverPendingView && detailApproval.status === 'pending' && (
                <>
                  <button onClick={() => { const a=detailApproval; setResubmitMode(true); setResubmitForm({title:a.title||'',amount:a.amount?Number(a.amount).toLocaleString('ko-KR'):'',date:(a.date||a.createdAt||'').slice(0,10),description:(a as any).description||''}); setApprovePwError('') }} className="px-4 py-2 rounded-lg bg-[#4f6ef7] text-white text-sm font-bold hover:bg-[#3b5de7] cursor-pointer flex items-center gap-1 shadow-sm"><Edit3 size={13} /> 수정</button>
                  <button onClick={() => { deleteApproval(detailApproval.id); resetApproveState(); setDetailApproval(null) }} className="px-4 py-2 rounded-lg bg-[#ef4444] text-white text-sm font-bold hover:bg-[#dc2626] cursor-pointer flex items-center gap-1"><Trash2 size={13} /> 삭제</button>
                </>
              )}
              {!isApproverPendingView && detailApproval.status === 'preExpense' && (
                <button onClick={() => { const a=detailApproval; setResubmitMode(true); setResubmitForm({title:a.title||'',amount:a.amount?Number(a.amount).toLocaleString('ko-KR'):'',date:(a.date||a.createdAt||'').slice(0,10),description:(a as any).description||''}); setApprovePwError('') }} className="px-4 py-2 rounded-lg bg-[#f97316] text-white text-sm font-bold hover:bg-[#ea580c] cursor-pointer flex items-center gap-1 shadow-sm"><Edit3 size={13} /> 수정</button>
              )}
              {!isApproverPendingView && detailApproval.status === 'rejected' && (
                <>
                  <button onClick={() => { const a=detailApproval; setResubmitMode(true); setResubmitForm({title:a.title||'',amount:a.amount?Number(a.amount).toLocaleString('ko-KR'):'',date:(a.date||a.createdAt||'').slice(0,10),description:(a as any).description||''}); setApprovePwError('') }} className="px-4 py-2 rounded-lg bg-[#f59e0b] text-white text-sm font-bold hover:bg-[#d97706] cursor-pointer flex items-center gap-1 shadow-sm"><RefreshCw size={13} /> 재품의</button>
                  <button onClick={() => { deleteApproval(detailApproval.id); resetApproveState(); setDetailApproval(null) }} className="px-4 py-2 rounded-lg bg-[#ef4444] text-white text-sm font-bold hover:bg-[#dc2626] cursor-pointer flex items-center gap-1"><Trash2 size={13} /> 삭제</button>
                </>
              )}
              {!isApproverPendingView && detailApproval.status === 'confirming' && (
                <>
                  <button onClick={() => { if(!confirm('정산완료 처리하시겠습니까?\n완료됨 목록으로 이동됩니다.'))return; const approvals:any[]=getItem('acct_approvals',[]); const idx=approvals.findIndex(a=>a.id===detailApproval.id); if(idx>=0){approvals[idx].status='completed';approvals[idx].completedAt=new Date().toISOString();setItem('acct_approvals',approvals);setRefresh(r=>r+1)} resetApproveState();setDetailApproval(null) }} className="px-4 py-2 rounded-lg bg-[#22c55e] text-white text-sm font-bold hover:bg-[#16a34a] cursor-pointer flex items-center gap-1 shadow-sm"><Check size={13} /> 정산완료</button>
                  <button onClick={() => { if(!confirm('정산반려 하시겠습니까?\n결의할 목록으로 되돌아갑니다.'))return; const approvals:any[]=getItem('acct_approvals',[]); const idx=approvals.findIndex(a=>a.id===detailApproval.id); if(idx>=0){approvals[idx].status='toResolve';approvals[idx].returnedAt=new Date().toISOString();setItem('acct_approvals',approvals);setRefresh(r=>r+1)} resetApproveState();setDetailApproval(null) }} className="px-4 py-2 rounded-lg bg-[#ef4444] text-white text-sm font-bold hover:bg-[#dc2626] cursor-pointer flex items-center gap-1 shadow-sm"><Ban size={13} /> 정산반려</button>
                </>
              )}
              {!isApproverPendingView && detailApproval.status === 'toResolve' && (
                <>
                  <label className="px-4 py-2 rounded-lg bg-[#4f6ef7] text-white text-sm font-bold hover:bg-[#3b5de7] cursor-pointer flex items-center gap-1">
                    <Paperclip size={13} /> 증빙첨부
                    <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.hwp" className="hidden" onChange={e => { const files=e.target.files; if(!files||files.length===0)return; const existing:any[]=(detailApproval as any).attachments||[]; const newFiles=Array.from(files).map(f=>({name:f.name,size:f.size,type:f.type,addedAt:new Date().toISOString()})); const updated=[...existing,...newFiles]; const approvals:any[]=getItem('acct_approvals',[]); const idx=approvals.findIndex(a=>a.id===detailApproval.id); if(idx>=0){approvals[idx].attachments=updated;setItem('acct_approvals',approvals);setDetailApproval({...detailApproval,attachments:updated} as any)} e.target.value='';alert(`${files.length}개 파일이 첨부되었습니다.`) }} />
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



      {/* 지출품의 등록 모달 */}
      {modalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={e => { if (e.target === e.currentTarget) { setModalOpen(false); setEditingId(null); setForm({ title: '', amount: '', date: new Date().toISOString().slice(0, 10), accountCode: '', description: '', applicant: currentUserName, approver: '' }) } }}>
          <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-default)]">
              <span className="text-sm font-extrabold text-[var(--text-primary)]">{editingId ? '지출품의 수정' : '지출품의 등록'}</span>
              <button onClick={() => { setModalOpen(false); setEditingId(null); setForm({ title: '', amount: '', date: new Date().toISOString().slice(0, 10), accountCode: '', description: '', applicant: currentUserName, approver: '' }) }} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">품의명 *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="예) 사무용품 구매" className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">금액 (원) *</label>
                <input value={form.amount} onChange={e => handleAmtInput(e.target.value)} placeholder="0" className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none text-right font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">신청자</label>
                  <input value={form.applicant} onChange={e => setForm(f => ({ ...f, applicant: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-sm text-[var(--text-primary)] outline-none" readOnly />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">지출승인권한자</label>
                  {(() => {
                    const approvers = staffList.filter(s => (s as any).approverType === 'approver')
                    if (approvers.length === 0) {
                      return <div className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-sm text-[var(--text-muted)]">설정된 권한자 없음</div>
                    } else if (approvers.length === 1) {
                      return <div className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-sm text-[var(--text-primary)] font-bold">{approvers[0].name}</div>
                    } else {
                      return (
                        <CustomSelect
                          value={form.approver}
                          onChange={v => setForm(f => ({ ...f, approver: v }))}
                          placeholder="— 선택 —"
                          options={[
                            { value: '', label: '— 선택 —' },
                            ...approvers.map(s => ({ value: s.name, label: `${s.name} (${s.position || ''})` })),
                          ]}
                        />
                      )
                    }
                  })()}
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">사유/메모</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="품의 사유를 입력해주세요" rows={3} className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-[var(--border-default)]">
              <button onClick={() => { setModalOpen(false); setEditingId(null); setForm({ title: '', amount: '', date: new Date().toISOString().slice(0, 10), accountCode: '', description: '', applicant: currentUserName, approver: '' }) }} className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] cursor-pointer">취소</button>
              <button onClick={saveApproval} className="px-4 py-2 rounded-lg bg-[#22c55e] text-white text-sm font-bold hover:bg-[#16a34a] cursor-pointer">{editingId ? '수정' : '등록'}</button>
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
  const [form, setForm] = useState({ desc: '', subItem: '', amount: '', counter: '', method: type === 'income' ? '계좌이체' : '계좌이체', writeDate: today, tradeDate: today, inputDate: today, manager: '', expenseManager: '', approvalStatus: '품의준비' })
  const staffList = useStaffStore(s => s.staff).filter(s => !s.resignedAt)
  const [counterSearch, setCounterSearch] = useState('')
  const [showCounterList, setShowCounterList] = useState(false)
  const counterRef = useRef<HTMLDivElement>(null)
  const [descMode, setDescMode] = useState<'select' | 'input'>('select')
  const [isFromApproval, setIsFromApproval] = useState(false)
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null)
  const [approvalMeta, setApprovalMeta] = useState<{approver:string; requestDate:string; approvedDate:string; budgetCatName:string; accountCode:string}>({approver:'',requestDate:'',approvedDate:'',budgetCatName:'',accountCode:''})
  const [selectedBudgetCat, setSelectedBudgetCat] = useState('')
  const [wdBudgetItem, setWdBudgetItem] = useState('')
  const [wdCatName, setWdCatName] = useState('')

  const user = useAuthStore(s => s.user)

  /* 예산 카테고리 목록 (해당 연도 + 지출담당자 필터) */
  const expBudgetCats = useMemo(() => {
    const cats: BudgetCat[] = getItem('acct_budget_cats', [])
    const yearCats = cats.filter(c => {
      const cy = c.year || (c.periodFrom ? parseInt(c.periodFrom.substring(0, 4)) : year)
      return cy === year
    })
    // 지출하기일 때: 현재 사용자가 지출담당자로 설정된 카테고리만 표시
    if (type === 'expense') {
      const userName = user?.name || ''
      const userCats = yearCats.filter(c => c.users && c.users.length > 0 && c.users.includes(userName))
      return userCats.length > 0 ? userCats : yearCats
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

  /* 출금전표용: 선택된 예산항목의 세목 */
  const wdSubItemNames = useMemo(() => {
    if (!wdBudgetItem || !selectedBudgetCat) return [] as string[]
    const budgets: BudgetItem[] = getItem('acct_budgets', [])
    const filtered = budgets.filter(b =>
      String(b.catId) === String(selectedBudgetCat) && b.itemName === wdBudgetItem
    )
    return Array.from(new Set(filtered.map(b => b.subItemName).filter(Boolean))).sort() as string[]
  }, [wdBudgetItem, selectedBudgetCat, refresh])

  /* 예산세목 (지출하기용: 선택된 예산목에 해당하는 세목 목록) */
  const subItemNames = useMemo(() => {
    if (!form.desc) return []
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
    return all.filter(c => {
      if (!c.date) return false
      if (parseInt(c.date.substring(0, 4)) !== year) return false
      return c.type === type || (type === 'withdrawal' && c.type === 'expense')
    }).sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  }, [year, type, refresh])

  const totalAmount = cashflows.reduce((a, c) => a + (c.amount || 0), 0)

  const handleAmtInput = (val: string) => {
    const digits = val.replace(/[^\d]/g, '')
    setForm(f => ({ ...f, amount: digits ? Number(digits).toLocaleString('ko-KR') : '' }))
  }

  const uid = () => Date.now() + Math.floor(Math.random() * 1000)

  const saveEntry = () => {
    if (!form.desc.trim()) { alert('내용을 입력하세요'); return }
    const amt = parseInt(form.amount.replace(/,/g, '')) || 0
    if (amt <= 0) { alert('금액을 입력하세요'); return }

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
      createdAt: new Date().toISOString(),
    })
    setItem('acct_vouchers', vouchers)

    // 캐시플로 등록
    const cfs = getItem<CashFlow[]>('acct_cashflows', [])
    cfs.push({
      id: cfId, date: form.tradeDate, type: type === 'withdrawal' ? 'expense' : type,
      amount: amt, description: form.desc, accountCode: type === 'income' ? '4030' : '5110',
      counter: form.counter, writeDate: form.writeDate,
      manager: form.manager, approvalStatus: form.approvalStatus,
    })
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
      const catName = budgetCats.find(c => String(c.id) === String(selectedBudgetCat))?.name || wdCatName || ''
      // 이름으로 budgetItemId, budgetSubId 매핑
      const matchedItem = budgets.find(b => String(b.catId) === String(selectedBudgetCat) && b.itemName === wdBudgetItem)
      const matchedSub = form.subItem ? budgets.find(b => String(b.catId) === String(selectedBudgetCat) && b.itemName === wdBudgetItem && b.subItemName === form.subItem) : null
      approvals.push({
        id: uid(),
        status: 'preExpense',
        title: `[선지출] ${form.desc || wdBudgetItem}`,
        amount: amt,
        date: form.tradeDate,
        createdAt: new Date().toISOString(),
        accountCode: '',
        description: `출금전표 선지출 - ${wdBudgetItem}${form.subItem ? ' > ' + form.subItem : ''}`,
        applicant: form.manager || currentUserName,
        approver: '',
        budgetItem: wdBudgetItem,
        budgetSubItem: form.subItem || '',
        budgetCatId: selectedBudgetCat,
        budgetCatName: catName,
        budgetItemId: matchedItem ? String(matchedItem.id) : '',
        budgetSubId: matchedSub ? String(matchedSub.id) : '',
      } as any)
      setItem('acct_approvals', approvals)
    }

    setForm({ desc: '', subItem: '', amount: '', counter: '', method: type === 'income' ? '계좌이체' : '계좌이체', writeDate: today, tradeDate: today, inputDate: today, manager: '', expenseManager: '', approvalStatus: '품의준비' })
    setCounterSearch('')
    setIsFromApproval(false)
    setWdBudgetItem('')
    setRefresh(r => r + 1)
  }

  const deleteEntry = (id: string | number) => {
    if (!confirm('삭제하시겠습니까?')) return
    const cfs = getItem<CashFlow[]>('acct_cashflows', []).filter(c => String(c.id) !== String(id))
    setItem('acct_cashflows', cfs)
    setRefresh(r => r + 1)
  }

  const methods = useMemo(() => {
    const stored: string[] = getItem('acct_payment_methods', ['계좌이체', '현금', '카드', '법인카드', '기타'])
    return stored.length > 0 ? stored : ['계좌이체', '현금', '카드', '법인카드', '기타']
  }, [refresh])

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
            <div className="text-[17px] font-extrabold">간편 {typeLabels[type]}</div>
            <div className="text-[11.5px] opacity-85">{type === 'income' ? '입금' : '지출'} 내역을 입력하세요</div>
          </div>
        </div>
      </div>

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
          ) : (
          <>
            {/* 출금/입금전표: 내용 + 예산선택 */}
            <div>
              <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">{type === 'income' ? '계정과목' : '지출내용'} *</label>
              {type === 'income' ? (
                <CustomSelect
                  value={form.desc}
                  onChange={v => setForm(f => ({ ...f, desc: v }))}
                  placeholder="— 입금계정 선택 —"
                  options={[
                    { value: '', label: '— 입금계정 선택 —' },
                    ...(() => {
                      const allAccts: AcctAccount[] = getItem('acct_accounts', [])
                      return allAccts.filter(a => (a as any).incomeEnabled === true).map(a => ({ value: a.name, label: `${a.code} ${a.name}` }))
                    })(),
                  ]}
                />
              ) : (
                <input value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} placeholder="예) 사무용품 구매" className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none" />
              )}
            </div>
            <div>
              <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">예산선택</label>
              <input
                value={wdCatName || '예산구분 선택'}
                readOnly
                className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-sm text-[var(--text-primary)] cursor-not-allowed outline-none font-bold"
              />
            </div>
            {type === 'income' && (
            <div>
              <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">입금내용</label>
              <input value={(form as any).incomeNote || ''} onChange={e => setForm(f => ({ ...f, incomeNote: e.target.value } as any))} placeholder="예) 4월 보조금 입금" className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none" />
            </div>
            )}
          </>
          )}
          {/* 예산항목/세목 (출금전표에서만) - 한 칸에 반반 + 금액은 오른쪽 */}
          {type === 'withdrawal' && (
          <>
            <div>
              <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">예산항목 / 세목</label>
              <div className="flex gap-1.5">
                <CustomSelect
                  value={wdBudgetItem}
                  onChange={v => {
                    setWdBudgetItem(v)
                    const budgets: BudgetItem[] = getItem('acct_budgets', [])
                    const matched = budgets.filter(b =>
                      String(b.catId) === String(selectedBudgetCat) && b.itemName === v
                    )
                    const totalAmt = matched.reduce((sum, b) => sum + ((b.amount || 0) - (b.spent || 0)), 0)
                    setForm(f => ({ ...f, subItem: '', amount: totalAmt > 0 ? totalAmt.toLocaleString('ko-KR') : '' }))
                  }}
                  placeholder="예산항목"
                  options={[
                    { value: '', label: '예산항목' },
                    ...wdBudgetItemNames.map(n => ({ value: n, label: n })),
                  ]}
                />
                {wdSubItemNames.length > 0 ? (
                  <CustomSelect
                    value={form.subItem}
                    onChange={v => {
                      const budgets: BudgetItem[] = getItem('acct_budgets', [])
                      const matched = budgets.find(b =>
                        String(b.catId) === String(selectedBudgetCat) &&
                        b.itemName === wdBudgetItem &&
                        b.subItemName === v
                      )
                      const amt = matched ? ((matched.amount || 0) - (matched.spent || 0)) : 0
                      setForm(f => ({
                        ...f,
                        subItem: v,
                        amount: amt > 0 ? amt.toLocaleString('ko-KR') : f.amount,
                      }))
                    }}
                    placeholder="예산세목"
                    options={[
                      { value: '', label: '예산세목' },
                      ...wdSubItemNames.map(n => ({ value: n, label: n })),
                    ]}
                  />
                ) : (
                  <input value={form.subItem || '세목 없음'} readOnly className="flex-1 px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-sm text-[var(--text-muted)] cursor-not-allowed outline-none" />
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <label className="text-[10.5px] font-bold text-[var(--text-muted)]">금액 (원) *</label>
                {wdBudgetItem && (() => {
                  const budgets: BudgetItem[] = getItem('acct_budgets', [])
                  const matched = form.subItem
                    ? budgets.filter(b => String(b.catId) === String(selectedBudgetCat) && b.itemName === wdBudgetItem && b.subItemName === form.subItem)
                    : budgets.filter(b => String(b.catId) === String(selectedBudgetCat) && b.itemName === wdBudgetItem)
                  const totalBudget = matched.reduce((s, b) => s + (b.amount || 0), 0)
                  const spent = matched.reduce((s, b) => s + (b.spent || 0), 0)
                  const remaining = totalBudget - spent
                  return (
                    <>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
                        <span className="text-[7px] text-blue-500 font-bold">총예산</span>
                        <span className="text-[9px] font-extrabold text-blue-600">{totalBudget.toLocaleString('ko-KR')}</span>
                      </div>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                        <span className="text-[7px] text-amber-500 font-bold">기집행</span>
                        <span className="text-[9px] font-extrabold text-amber-600">{spent.toLocaleString('ko-KR')}</span>
                      </div>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800">
                        <span className="text-[7px] text-emerald-500 font-bold">잔액</span>
                        <span className="text-[9px] font-extrabold text-emerald-600">{remaining.toLocaleString('ko-KR')}</span>
                      </div>
                    </>
                  )
                })()}
              </div>
              <input value={form.amount} onChange={e => handleAmtInput(e.target.value)} placeholder="0" className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm font-bold text-right focus:border-primary-500 outline-none" style={{ color: typeColors[type] }} />
            </div>
          </>
          )}
          {/* 금액 (출금전표 외) */}
          {type !== 'withdrawal' && (
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
            <CustomSelect
              value={form.method}
              onChange={v => setForm(f => ({ ...f, method: v }))}
              options={methods.map(m => ({ value: m, label: m }))}
            />
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
          <div>
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">비고</label>
            <textarea
              value={(form as any).memo || ''}
              onChange={e => setForm(f => ({ ...f, memo: e.target.value } as any))}
              placeholder="참고 사항을 입력하세요"
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none resize-none h-[56px]"
            />
          </div>
        }
        <div className="flex justify-end">
          <button onClick={saveEntry} className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white text-sm font-bold cursor-pointer shadow-md bg-gradient-to-r ${typeGrads[type]}`}>
            <Save size={14} /> {type === 'income' ? '입금' : '지출'} 등록
          </button>
        </div>
      </div>
      </>
      )}

      {/* ── 지출대기 리스트 (승인된 품의) ── */}
      {type === 'expense' && expenseTab === 'waiting' && (() => {
        const approvals = getItem<Approval[]>('acct_approvals', [])
        const cats: BudgetCat[] = getItem('acct_budget_cats', [])
        const approved = approvals.filter(a => a.status === 'approved')
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
                  {['날짜', '내용', ...(type !== 'income' ? ['담당자', '품의상태'] : []), '금액', '삭제'].map(h => (
                    <th key={h} className={cn('py-2.5 px-3.5 text-[11px] font-bold text-[var(--text-muted)]',
                      h === '금액' ? 'text-right' : h === '삭제' ? 'text-center w-[50px]' : h === '품의상태' ? 'text-center w-[80px]' : h === '담당자' ? 'text-center w-[70px]' : 'text-left')}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cashflows.map(c => (
                  <tr key={c.id} className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-muted)] transition-colors">
                    <td className="py-2.5 px-3.5 text-[12px] text-[var(--text-secondary)]">{c.date || ''}</td>
                    <td className="py-2.5 px-3.5 text-[12px] font-bold text-[var(--text-primary)]">{c.description || '-'}</td>
                    {type !== 'income' && (
                      <td className="py-2.5 px-3.5 text-[11px] text-center text-[var(--text-secondary)]">{(c as any).manager || '-'}</td>
                    )}
                    {type !== 'income' && (
                      <td className="py-2.5 px-3.5 text-center">
                        <button
                          onClick={() => {
                            const cfs = getItem<CashFlow[]>('acct_cashflows', [])
                            const next = (c as any).approvalStatus === '품의완료' ? '품의준비' : '품의완료'
                            const updated = cfs.map(x => String(x.id) === String(c.id) ? { ...x, approvalStatus: next } : x)
                            setItem('acct_cashflows', updated)
                            setRefresh(r => r + 1)
                          }}
                          className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer transition-colors',
                            (c as any).approvalStatus === '품의완료'
                              ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600'
                              : 'bg-amber-100 dark:bg-amber-900/20 text-amber-600'
                          )}
                        >
                          {(c as any).approvalStatus || '품의준비'}
                        </button>
                      </td>
                    )}
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
                  <CustomSelect value={form.method} onChange={v => setForm(f => ({ ...f, method: v }))} options={methods.map(m => ({ value: m, label: m }))} />
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
function AcctPaymentLedger({ year }: { year: number }) {
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

  const vouchers = useMemo(() => {
    const all = getItem<Voucher[]>('acct_vouchers', [])
    return all.filter(v => v.date && parseInt(v.date.substring(0, 4)) === year)
      .sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || '').localeCompare(a.createdAt || ''))
  }, [year, refresh])

  const incCnt = vouchers.filter(v => v.type === 'income').length
  const expCnt = vouchers.filter(v => v.type === 'expense').length
  const etcCnt = vouchers.length - incCnt - expCnt

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
            { label: '총 전표', value: vouchers.length, bg: 'rgba(255,255,255,.18)' },
            { label: '입금', value: incCnt, bg: 'rgba(34,197,94,.2)' },
            { label: '출금', value: expCnt, bg: 'rgba(239,68,68,.2)' },
            { label: '대체', value: etcCnt, bg: 'rgba(245,158,11,.2)' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-2 text-center" style={{ background: s.bg }}>
              <div className="text-[9px] opacity-80">{s.label}</div>
              <div className="text-[16px] font-extrabold">{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 전표 목록 */}
      {vouchers.length === 0 ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-8">
          <EmptyState emoji="📒" title="등록된 전표가 없습니다" />
        </div>
      ) : (
        <div className="space-y-2.5">
          {vouchers.map(v => {
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
  address1?: string      // 다음 API 주소
  address2?: string      // 상세주소
  phone?: string
  /* 연락처정보 */
  ceoName?: string
  ceoPhone?: string
  managerName?: string
  managerPhone?: string
  /* 사업자정보 */
  bizNo?: string
  bizType?: string       // 업태
  bizCategory?: string   // 업종
  invoiceEmail?: string  // 계산서이메일
  bizRegImage?: string   // 사업자등록증 base64
  /* 비고 */
  memo?: string
  /* 예산구분 연결 */
  budgetCatId?: string
  /* 하위 호환 */
  address?: string
}

const EMPTY_VENDOR: Omit<Vendor, 'id'> = {
  name: '', zipCode: '', address1: '', address2: '', phone: '',
  ceoName: '', ceoPhone: '', managerName: '', managerPhone: '',
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
      managerName: v.managerName || '', managerPhone: v.managerPhone || '',
      bizNo: v.bizNo || '', bizType: v.bizType || '', bizCategory: v.bizCategory || '',
      invoiceEmail: v.invoiceEmail || '', bizRegImage: v.bizRegImage || '', memo: v.memo || '',
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

  /* ── 등록/수정 폼 렌더 (테이블 기반 양식) ── */
  const renderForm = () => {
    const thCls = 'px-4 py-3 text-[12px] font-bold text-gray-700 dark:text-gray-300 bg-[#f7f8fa] dark:bg-[var(--bg-muted)] text-left whitespace-nowrap align-middle'
    const tdCls = 'px-4 py-2'
    const inpCls = 'w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[13px] text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors'
    return (
    <div className="space-y-5">
      {/* 기본 정보 테이블 */}
      <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse', border: '1.5px solid #d1d5db' }}>
        <tbody>
          <tr>
            <td className={thCls} style={{ border: '1px solid #d1d5db', width: '120px' }}>거래처명 <span className="text-red-500">*</span></td>
            <td className={tdCls} style={{ border: '1px solid #d1d5db' }}>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="(주)한국전자" className={inpCls} />
            </td>
            <td className={thCls} style={{ border: '1px solid #d1d5db', width: '120px' }}>대표자</td>
            <td className={tdCls} style={{ border: '1px solid #d1d5db' }}>
              <input value={form.ceoName} onChange={e => setForm(f => ({ ...f, ceoName: e.target.value }))} placeholder="김대표" className={inpCls} />
            </td>
          </tr>
          <tr>
            <td className={thCls} style={{ border: '1px solid #d1d5db' }}>사업자번호</td>
            <td className={tdCls} style={{ border: '1px solid #d1d5db' }}>
              <input value={form.bizNo} onChange={e => setForm(f => ({ ...f, bizNo: fmtBizNo(e.target.value) }))} placeholder="000-00-00000" className={inpCls} maxLength={12} />
            </td>
            <td className={thCls} style={{ border: '1px solid #d1d5db' }}>대표전화</td>
            <td className={tdCls} style={{ border: '1px solid #d1d5db' }}>
              <input value={form.ceoPhone} onChange={e => setForm(f => ({ ...f, ceoPhone: fmtPhone(e.target.value) }))} placeholder="010-0000-0000" className={inpCls} maxLength={13} />
            </td>
          </tr>
          <tr>
            <td className={thCls} style={{ border: '1px solid #d1d5db' }}>업태</td>
            <td className={tdCls} style={{ border: '1px solid #d1d5db' }}>
              <input value={form.bizType} onChange={e => setForm(f => ({ ...f, bizType: e.target.value }))} placeholder="제조, 서비스" className={inpCls} />
            </td>
            <td className={thCls} style={{ border: '1px solid #d1d5db' }}>업종</td>
            <td className={tdCls} style={{ border: '1px solid #d1d5db' }}>
              <input value={form.bizCategory} onChange={e => setForm(f => ({ ...f, bizCategory: e.target.value }))} placeholder="전자부품" className={inpCls} />
            </td>
          </tr>
          <tr>
            <td className={thCls} style={{ border: '1px solid #d1d5db' }}>전화번호</td>
            <td className={tdCls} style={{ border: '1px solid #d1d5db' }}>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: fmtPhone(e.target.value) }))} placeholder="02-0000-0000" className={inpCls} maxLength={13} />
            </td>
            <td className={thCls} style={{ border: '1px solid #d1d5db' }}>세금계산서 이메일</td>
            <td className={tdCls} style={{ border: '1px solid #d1d5db' }}>
              <input type="email" value={form.invoiceEmail} onChange={e => setForm(f => ({ ...f, invoiceEmail: e.target.value }))} placeholder="tax@example.com" className={inpCls} />
            </td>
          </tr>
          <tr>
            <td className={thCls} style={{ border: '1px solid #d1d5db' }}>예산구분 연결</td>
            <td className={tdCls} colSpan={3} style={{ border: '1px solid #d1d5db' }}>
              <CustomSelect
                value={form.budgetCatId || ''}
                onChange={v => setForm(f => ({ ...f, budgetCatId: v }))}
                placeholder="— 예산구분 선택 —"
                options={[
                  { value: '', label: '— 예산구분 미연결 —' },
                  ...getItem<BudgetCat[]>('acct_budget_cats', []).map(c => ({ value: String(c.id), label: c.name })),
                ]}
              />
            </td>
          </tr>
          <tr>
            <td className={thCls} style={{ border: '1px solid #d1d5db' }}>사업장주소</td>
            <td className={tdCls} colSpan={3} style={{ border: '1px solid #d1d5db' }}>
              <div className="flex gap-2 mb-2">
                <input value={form.zipCode} readOnly placeholder="우편번호" className={`${inpCls} flex-1 bg-[var(--bg-muted)] cursor-default`} />
                <button type="button" onClick={() => { const dp = (window as any).daum?.Postcode; if (!dp) { alert('우편번호 검색 서비스를 불러오는 중입니다...'); return } new dp({ oncomplete: (d: any) => setForm(f => ({ ...f, zipCode: d.zonecode, address1: d.roadAddress || d.jibunAddress })) }).open() }} className="px-3 py-2 rounded-lg bg-primary-500 text-white text-[11px] font-bold cursor-pointer shrink-0 hover:bg-primary-600 transition-colors">+ 우편번호 검색</button>
              </div>
              <input value={form.address1} readOnly placeholder="주소" className={`${inpCls} bg-[var(--bg-muted)] cursor-default mb-2`} />
              <input value={form.address2} onChange={e => setForm(f => ({ ...f, address2: e.target.value }))} placeholder="상세주소를 입력하세요" className={inpCls} />
            </td>
          </tr>
          <tr>
            <td className={thCls} style={{ border: '1px solid #d1d5db' }}>담당자명</td>
            <td className={tdCls} style={{ border: '1px solid #d1d5db' }}>
              <input value={form.managerName} onChange={e => setForm(f => ({ ...f, managerName: e.target.value }))} placeholder="담당자명" className={inpCls} />
            </td>
            <td className={thCls} style={{ border: '1px solid #d1d5db' }}>담당자연락처</td>
            <td className={tdCls} style={{ border: '1px solid #d1d5db' }}>
              <input value={form.managerPhone} onChange={e => setForm(f => ({ ...f, managerPhone: fmtPhone(e.target.value) }))} placeholder="010-0000-0000" className={inpCls} maxLength={13} />
            </td>
          </tr>
          <tr>
            <td className={thCls} style={{ border: '1px solid #d1d5db' }}>비고</td>
            <td className={tdCls} colSpan={3} style={{ border: '1px solid #d1d5db' }}>
              <textarea value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))} placeholder="기타 참고 사항을 입력하세요" rows={3} className={`${inpCls} resize-none`} />
            </td>
          </tr>
          <tr>
            <td className={thCls} style={{ border: '1px solid #d1d5db' }}>사업자등록증</td>
            <td className={tdCls} colSpan={3} style={{ border: '1px solid #d1d5db' }}>
              <div className="flex items-center gap-4">
                {form.bizRegImage ? (
                  <div className="relative group">
                    {form.bizRegImage.startsWith('data:image') ? (
                      <img src={form.bizRegImage} alt="사업자등록증" className="h-[80px] object-contain rounded-lg border border-[var(--border-default)] bg-white" />
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-[var(--text-primary)]">📄 PDF 파일 첨부됨</div>
                    )}
                    <button type="button" onClick={() => setForm(f => ({ ...f, bizRegImage: '' }))} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[9px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">✕</button>
                  </div>
                ) : (
                  <span className="text-[12px] text-[var(--text-muted)]">등록된 파일이 없습니다</span>
                )}
                <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-[var(--border-default)] bg-[var(--bg-muted)] cursor-pointer hover:border-primary-400 transition-colors shrink-0">
                  <span className="text-[11px] text-[var(--text-muted)]">📎 파일 선택</span>
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 5*1024*1024) { alert('5MB 이하'); return } const r = new FileReader(); r.onload = () => setForm(f => ({ ...f, bizRegImage: r.result as string })); r.readAsDataURL(file) }} />
                </label>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    )
  }

  /* ── 조회 렌더 ── */
  const renderView = (v: Vendor) => {
    const InfoRow = ({ label, value }: { label: string; value?: string }) => (
      <div className="flex items-start gap-2 py-1.5">
        <span className="text-[11px] font-bold text-[var(--text-muted)] w-24 shrink-0">{label}</span>
        <span className="text-[13px] text-[var(--text-primary)] flex-1">{value || '-'}</span>
      </div>
    )
    return (
      <div className="space-y-4">
        <SectionHeader icon="🏢" title="기본정보" color="#4f6ef7" />
        <InfoRow label="거래처명" value={v.name} />
        <InfoRow label="우편번호" value={v.zipCode} />
        <InfoRow label="주소" value={[v.address1 || v.address, v.address2].filter(Boolean).join(' ') || undefined} />
        <InfoRow label="전화번호" value={v.phone} />

        <SectionHeader icon="📞" title="연락처정보" color="#22c55e" />
        <div className="grid grid-cols-2 gap-x-4">
          <InfoRow label="대표자명" value={v.ceoName} />
          <InfoRow label="대표자연락처" value={v.ceoPhone} />
          <InfoRow label="담당자명" value={v.managerName} />
          <InfoRow label="담당자연락처" value={v.managerPhone} />
        </div>

        <SectionHeader icon="📋" title="사업자정보" color="#f59e0b" />
        <InfoRow label="사업자번호" value={v.bizNo} />
        <div className="grid grid-cols-2 gap-x-4">
          <InfoRow label="업태" value={v.bizType} />
          <InfoRow label="업종" value={v.bizCategory} />
        </div>
        <InfoRow label="계산서이메일" value={v.invoiceEmail} />
        {v.bizRegImage && (
          <div>
            <span className="text-[11px] font-bold text-[var(--text-muted)] block mb-1.5">사업자등록증</span>
            {v.bizRegImage.startsWith('data:image') ? (
              <img src={v.bizRegImage} alt="사업자등록증" className="w-full max-h-[300px] object-contain rounded-xl border border-[var(--border-default)] bg-white cursor-pointer" onClick={() => window.open(v.bizRegImage, '_blank')} />
            ) : (
              <a href={v.bizRegImage} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-sm text-primary-500 font-semibold hover:underline">📄 사업자등록증 PDF 보기</a>
            )}
          </div>
        )}

        <SectionHeader icon="📝" title="비고" color="#8b5cf6" />
        <p className="text-[13px] text-[var(--text-primary)] whitespace-pre-wrap">{v.memo || '-'}</p>
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

      {/* 거래처 목록 */}
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
          <div className="divide-y divide-[var(--border-default)]">
            {vendors.map(v => (
              <div key={v.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-muted)] transition-colors group cursor-pointer" onClick={() => openView(v)}>
                <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-500 shrink-0">
                  <ContactRound size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold text-[var(--text-primary)] truncate">{v.name}</span>
                    {v.bizNo && <span className="text-[9px] text-[var(--text-muted)] bg-[var(--bg-muted)] px-1.5 py-0.5 rounded font-mono">{v.bizNo}</span>}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
                    {v.ceoName && <span>대표: {v.ceoName}</span>}
                    {v.managerName && <span>담당: {v.managerName}</span>}
                    {v.phone && <span>☎ {v.phone}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                  <button onClick={() => openEdit(v)} className="p-1.5 rounded-lg hover:bg-[var(--bg-subtle)] text-[var(--text-muted)] cursor-pointer"><Edit3 size={13} /></button>
                  <button onClick={() => deleteVendor(v.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-danger cursor-pointer"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
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
