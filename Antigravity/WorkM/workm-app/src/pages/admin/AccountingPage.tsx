import { useState, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../../components/common/PageHeader'
import { EmptyState } from '../../components/common/EmptyState'
import { cn } from '../../utils/cn'
import { getItem, setItem } from '../../utils/storage'
import { formatNumber } from '../../utils/format'
import { AcctBalance } from '../../components/accounting/AcctBalance'
import { AcctReports } from '../../components/accounting/AcctReports'
import { AcctHqVendor } from '../../components/accounting/AcctHqVendor'
import { useStaffStore } from '../../stores/staffStore'
import { CustomSelect } from '../../components/ui/CustomSelect'
import { DatePicker } from '../../components/ui/DatePicker'
import {
  LayoutDashboard, Wallet, FileCheck, ArrowDownCircle, ArrowUpCircle,
  BookOpen, PieChart, ScrollText, Settings2, ContactRound, Building2,
  TrendingDown, TrendingUp, Banknote, Clock,
  Plus, Edit3, Trash2, Save, X, Check, Ban,
  Search, MoreVertical, Upload, User, Phone, Mail, IdCard, FileText,
} from 'lucide-react'

/* ??? ?뚭퀎 ?쒕뱶 ?곗씠??珥덇린???? */
function initAccountingSeed() {
  if (localStorage.getItem('_acct_react_seed_v2')) return

  const uid = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 7)
  const year = new Date().getFullYear()

  /* ?? ?덉궛 ?쒕뱶 (湲곗〈 ?곗씠???놁쓣 ?뚮쭔) ?? */
  const cats = getItem<BudgetCat[]>('acct_budget_cats', [])
  const budgets = getItem<BudgetItem[]>('acct_budgets', [])

  if (cats.length === 0 || budgets.length === 0) {
    const catDefs = [
      { name: '臾명솕?ъ껌', bank: '湲곗뾽???1010-1100-12', from: `${year}-01-01`, to: `${year}-12-31` },
      { name: '寃쎌＜?쒖껌', bank: '?랁삊???2020-2200-34', from: `${year}-01-01`, to: `${year}-12-31` },
      { name: '?먯껜?덉궛', bank: '援?????3030-3300-56', from: `${year}-01-01`, to: `${year}-12-31` },
    ]

    const itemSets = [
      [
        { item: '臾명솕??蹂댁닔鍮?, code: '5110', amt: 50000000 },
        { item: '諛쒓뎬議곗궗鍮?, code: '5120', amt: 30000000 },
        { item: '?꾨Ц?몃젰 ?멸굔鍮?, code: '5210', amt: 25000000 },
        { item: '?λ퉬 援ъ엯鍮?, code: '5130', amt: 15000000 },
        { item: '?덉쟾愿由щ퉬', code: '5140', amt: 8000000 },
      ],
      [
        { item: '?좎쟻?뺣퉬鍮?, code: '5110', amt: 40000000 },
        { item: '愿愿묓솉蹂대퉬', code: '5320', amt: 20000000 },
        { item: '?쒖꽕?좎?鍮?, code: '5130', amt: 15000000 },
        { item: '議곌꼍怨듭궗鍮?, code: '5120', amt: 12000000 },
        { item: '?됱궗?댁쁺鍮?, code: '5310', amt: 8000000 },
      ],
      [
        { item: '?꾩쭅??湲됱뿬', code: '5210', amt: 60000000 },
        { item: '?щТ?⑺뭹鍮?, code: '5190', amt: 5000000 },
        { item: '?듭떊鍮?, code: '5340', amt: 3000000 },
        { item: '李⑤웾?좎?鍮?, code: '5310', amt: 4000000 },
        { item: '蹂듬━?꾩깮鍮?, code: '5350', amt: 6000000 },
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

  /* ?? 嫄곕옒泥??섑뵆 10嫄??? */
  if (getItem<any[]>('acct_vendors', []).length === 0) {
    const vendors = [
      { id: 1001, name: '(二??쒓뎅?꾩옄', zipCode: '06134', address1: '?쒖슱?밸퀎??媛뺣궓援??뚰뿤?濡?152', address2: '媛뺣궓?뚯씠?몄뒪?쇳꽣 3痢?, phone: '02-555-1234', ceoName: '源???, ceoPhone: '010-1111-2222', managerName: '諛뺣떞??, managerPhone: '010-3333-4444', bizNo: '123-45-67890', bizType: '?쒖“', bizCategory: '?꾩옄遺??, invoiceEmail: 'tax@hankook.co.kr', memo: '二쇱슂 ?꾩옄遺??怨듦툒泥? },
      { id: 1002, name: '(二??쒖슱嫄댁꽕', zipCode: '04536', address1: '?쒖슱?밸퀎??以묎뎄 ?몄쥌?濡?110', address2: '2痢?203??, phone: '02-777-5678', ceoName: '?닿굔??, ceoPhone: '010-5555-6666', managerName: '理쒗쁽??, managerPhone: '010-7777-8888', bizNo: '234-56-78901', bizType: '嫄댁꽕', bizCategory: '醫낇빀嫄댁꽕', invoiceEmail: 'bill@seoulcon.kr', memo: '臾명솕??蹂댁닔怨듭궗 ?꾨Ц' },
      { id: 1003, name: '??쒖씤?꾧났??, zipCode: '07236', address1: '?쒖슱?밸퀎???곷벑?ш뎄 ?ъ쓽?濡?24', address2: '', phone: '02-333-9012', ceoName: '?뺤씤??, ceoPhone: '010-9999-0000', managerName: '?쒖쁺??, managerPhone: '010-1234-5678', bizNo: '345-67-89012', bizType: '?몄뇙', bizCategory: '?몄뇙異쒗뙋', invoiceEmail: 'invoice@daehanprint.com', memo: '蹂닿퀬???몄뇙 ?꾨Ц?낆껜' },
      { id: 1004, name: '寃쎌＜臾명솕?ъ뿰援ъ썝', zipCode: '38065', address1: '寃쎌긽遺곷룄 寃쎌＜???뚯쿇遺곷줈 345', address2: '?곌뎄??501??, phone: '054-772-3456', ceoName: '?좎뿰援?, ceoPhone: '010-2345-6789', managerName: '?좎“??, managerPhone: '010-3456-7890', bizNo: '456-78-90123', bizType: '?쒕퉬??, bizCategory: '?숈닠?곌뎄', invoiceEmail: 'gyeongju@research.or.kr', memo: '諛쒓뎬議곗궗 ?⑹뿭 ?뚰듃?? },
      { id: 1005, name: '(二??ㅻ쭏?몄삤?쇱뒪', zipCode: '13487', address1: '寃쎄린???깅궓??遺꾨떦援??먭탳濡?228', address2: '?먭탳?뚰겕?몃갭由?A??, phone: '031-888-1111', ceoName: '?ㅼ궗臾?, ceoPhone: '010-4567-8901', managerName: '媛뺤궗??, managerPhone: '010-5678-9012', bizNo: '567-89-01234', bizType: '?꾩냼留?, bizCategory: '?щТ?⑺뭹', invoiceEmail: 'smart@smartoffice.co.kr', memo: '?щТ?⑺뭹 ?뺢린 怨듦툒' },
      { id: 1006, name: '?쒕튆?듭떊(二?', zipCode: '06164', address1: '?쒖슱?밸퀎??媛뺣궓援??쇱꽦濡?180', address2: '', phone: '02-444-2222', ceoName: '?섑넻??, ceoPhone: '010-6789-0123', managerName: '臾멸린??, managerPhone: '010-7890-1234', bizNo: '678-90-12345', bizType: '?쒕퉬??, bizCategory: '?듭떊?쒕퉬??, invoiceEmail: 'billing@hanbit.net', memo: '?명꽣???꾪솕 ?쒕퉬?? },
      { id: 1007, name: '(二?洹몃┛議곌꼍', zipCode: '31116', address1: '異⑹껌?⑤룄 泥쒖븞???숇궓援?異⑹젅濡?12', address2: '洹몃┛鍮뚮뵫 2痢?, phone: '041-555-3333', ceoName: '珥덉“寃?, ceoPhone: '010-8901-2345', managerName: '瑜섏썝??, managerPhone: '010-9012-3456', bizNo: '789-01-23456', bizType: '?쒕퉬??, bizCategory: '議곌꼍', invoiceEmail: 'green@greenland.kr', memo: '?좎쟻吏 議곌꼍怨듭궗 ?꾨Ц' },
      { id: 1008, name: '?몄쥌踰뺣쪧?щТ??, zipCode: '04526', address1: '?쒖슱?밸퀎??以묎뎄 ?⑤?臾몃줈 117', address2: '踰뺤“鍮뚮뵫 15痢?, phone: '02-666-4444', ceoName: '蹂踰뺣쪧', ceoPhone: '010-0123-4567', managerName: '?쒕???, managerPhone: '010-1111-3333', bizNo: '890-12-34567', bizType: '?쒕퉬??, bizCategory: '踰뺣쪧?쒕퉬??, invoiceEmail: 'sejong@lawoffice.co.kr', memo: '踰뺣쪧?먮Ц 怨꾩빟 ?낆껜' },
      { id: 1009, name: '(二??쇱뒪?몄뭅', zipCode: '16878', address1: '寃쎄린???⑹씤???섏?援??띾뜒泥쒕줈 67', address2: '', phone: '031-222-5555', ceoName: '李⑥젙鍮?, ceoPhone: '010-2222-4444', managerName: '源?뺣퉬', managerPhone: '010-3333-5555', bizNo: '901-23-45678', bizType: '?쒕퉬??, bizCategory: '?먮룞李⑥젙鍮?, invoiceEmail: 'firstcar@firstcar.kr', memo: '踰뺤씤李⑤웾 ?뺣퉬' },
      { id: 1010, name: '(二?留쏅굹?몃뱶', zipCode: '06037', address1: '?쒖슱?밸퀎??媛뺣궓援?遊됱??щ줈 317', address2: 'B1痢?, phone: '02-999-6666', ceoName: '留쏅???, ceoPhone: '010-4444-6666', managerName: '?대같??, managerPhone: '010-5555-7777', bizNo: '012-34-56789', bizType: '?쒕퉬??, bizCategory: '?앺뭹?몄떇', invoiceEmail: 'food@matnafood.com', memo: '?됱궗??耳?댄꽣留? },
    ]
    setItem('acct_vendors', vendors)
  }

  /* ?? ?덉쓽 ?섑뵆 10嫄??? */
  if (getItem<any[]>('acct_approvals', []).length === 0) {
    const mm = (m: number) => String(m).padStart(2, '0')
    const approvals = [
      { id: 2001, title: 'Q1 ?щТ?⑺뭹 ?쇨큵 援щℓ', amount: 1500000, date: `${year}-01-15`, status: 'approved', accountCode: '5190', description: '1遺꾧린 ?щТ?⑺뭹 ?쇨큵 援щℓ ?덉쓽', applicant: 'admin', approver: '源吏??, createdAt: `${year}-01-14T09:00:00Z` },
      { id: 2002, title: '臾명솕???꾩옣 ?덉쟾?λ퉬 援ъ엯', amount: 3200000, date: `${year}-02-05`, status: 'approved', accountCode: '5140', description: '?꾩옣 ?덉쟾紐? ?덉쟾踰⑦듃 ??援ъ엯', applicant: 'admin', approver: '源吏??, createdAt: `${year}-02-04T10:00:00Z` },
      { id: 2003, title: '諛쒓뎬議곗궗 ?λ퉬 ?꾨?', amount: 8500000, date: `${year}-02-20`, status: 'approved', accountCode: '5120', description: '3??諛쒓뎬議곗궗 ?λ퉬 ?꾨? 鍮꾩슜', applicant: 'admin', approver: '?댁닔吏?, createdAt: `${year}-02-19T14:00:00Z` },
      { id: 2004, title: '蹂닿퀬???몄뇙鍮?, amount: 2800000, date: `${year}-03-10`, status: 'pending', accountCode: '5190', description: '2025?꾨룄 ?곌컙蹂닿퀬???몄뇙', applicant: 'admin', approver: '諛뺣???, createdAt: `${year}-03-09T11:00:00Z` },
      { id: 2005, title: '吏곸썝 ??웾媛뺥솕 援먯쑁鍮?, amount: 4500000, date: `${year}-03-25`, status: 'pending', accountCode: '5350', description: '臾명솕??蹂듭썝湲곗닠 援먯쑁 ?섍컯猷?, applicant: 'admin', approver: '源吏??, createdAt: `${year}-03-24T09:30:00Z` },
      { id: 2006, title: '踰뺤씤李⑤웾 ?뺢린?뺣퉬', amount: 780000, date: `${year}-${mm(new Date().getMonth())}-05`, status: 'approved', accountCode: '5310', description: '踰뺤씤李⑤웾 3? ?뺢린?뺣퉬', applicant: 'admin', approver: '?뺥쁽??, createdAt: `${year}-${mm(new Date().getMonth())}-04T08:00:00Z` },
      { id: 2007, title: '?좎쟻吏 議곌꼍怨듭궗', amount: 12000000, date: `${year}-${mm(new Date().getMonth())}-12`, status: 'pending', accountCode: '5120', description: '寃쎌＜ ?좎쟻吏 遊?議곌꼍?뺣퉬', applicant: 'admin', approver: '?댁닔吏?, createdAt: `${year}-${mm(new Date().getMonth())}-11T10:00:00Z` },
      { id: 2008, title: '?щТ???듭떊鍮??곌컙怨꾩빟', amount: 3600000, date: `${year}-${mm(new Date().getMonth() + 1)}-01`, status: 'rejected', accountCode: '5340', description: '?명꽣???꾪솕 ?곌컙怨꾩빟 媛깆떊', applicant: 'admin', approver: '諛뺣???, createdAt: `${year}-${mm(new Date().getMonth())}-28T15:00:00Z` },
      { id: 2009, title: '?꾩옣 ?쒕줎 援ъ엯', amount: 5500000, date: `${year}-${mm(new Date().getMonth() + 1)}-10`, status: 'pending', accountCode: '5130', description: '??났珥ъ쁺??怨좎꽦???쒕줎 2?', applicant: 'admin', approver: '理쒖쑀由?, createdAt: `${year}-${mm(new Date().getMonth() + 1)}-09T09:00:00Z` },
      { id: 2010, title: '?됱궗??耳?댄꽣留?, amount: 2200000, date: `${year}-${mm(new Date().getMonth() + 1)}-20`, status: 'pending', accountCode: '5310', description: '臾명솕?좎궛?????됱궗 耳?댄꽣留?, applicant: 'admin', approver: '?쒖냼??, createdAt: `${year}-${mm(new Date().getMonth() + 1)}-19T13:00:00Z` },
    ]
    setItem('acct_approvals', approvals)
  }

  /* ?? 吏異??낃툑/異쒓툑 ?섑뵆 媛?10嫄??? */
  if (getItem<any[]>('acct_cashflows', []).length === 0) {
    const cfs: any[] = []
    const vs: any[] = []
    let sid = 3001

    // 吏異?10嫄?
    const expenses = [
      { desc: '?щТ?⑺뭹 援щℓ (蹂듭궗吏, ?좊꼫)', amt: 320000, date: `${year}-01-20`, counter: '(二??ㅻ쭏?몄삤?쇱뒪', method: '移대뱶' },
      { desc: '?꾩옣?묒뾽???덉쟾?λ퉬', amt: 1500000, date: `${year}-02-08`, counter: '(二??쒓뎅?꾩옄', method: '怨꾩쥖?댁껜' },
      { desc: '3??踰뺤씤李⑤웾 ?좊쪟鍮?, amt: 450000, date: `${year}-03-15`, counter: '二쇱쑀??, method: '踰뺤씤移대뱶' },
      { desc: '蹂닿퀬???몄뇙鍮?(300遺)', amt: 1200000, date: `${year}-03-28`, counter: '??쒖씤?꾧났??, method: '怨꾩쥖?댁껜' },
      { desc: '?щТ???명꽣???붽툑', amt: 88000, date: `${year}-${String(new Date().getMonth()).padStart(2, '0')}-05`, counter: '?쒕튆?듭떊(二?', method: '怨꾩쥖?댁껜' },
      { desc: '議곌꼍 ?좎?蹂댁닔鍮?, amt: 3500000, date: `${year}-${String(new Date().getMonth()).padStart(2, '0')}-10`, counter: '(二?洹몃┛議곌꼍', method: '怨꾩쥖?댁껜' },
      { desc: '吏곸썝 媛꾩떇鍮?, amt: 150000, date: `${year}-${String(new Date().getMonth()).padStart(2, '0')}-12`, counter: '(二?留쏅굹?몃뱶', method: '踰뺤씤移대뱶' },
      { desc: '踰뺣쪧?먮Ц ?섏닔猷?, amt: 2200000, date: `${year}-${String(new Date().getMonth()).padStart(2, '0')}-18`, counter: '?몄쥌踰뺣쪧?щТ??, method: '怨꾩쥖?댁껜' },
      { desc: '李⑤웾 ?뺢린寃?щ퉬', amt: 350000, date: `${year}-${String(new Date().getMonth() + 1).padStart(2, '0')}-02`, counter: '(二??쇱뒪?몄뭅', method: '移대뱶' },
      { desc: '?щТ???뺤닔湲??뚰깉', amt: 55000, date: `${year}-${String(new Date().getMonth() + 1).padStart(2, '0')}-05`, counter: '?뺤닔湲곕젋??, method: '怨꾩쥖?댁껜' },
    ]
    expenses.forEach(e => {
      const id = sid++
      cfs.push({ id, date: e.date, type: 'expense', amount: e.amt, description: e.desc, accountCode: '5110', counter: e.counter, method: e.method })
      vs.push({ id: sid++, date: e.date, type: 'expense', description: e.desc, createdAt: e.date + 'T09:00:00Z', entries: [
        { side: 'debit', accountCode: '5110', amount: e.amt },
        { side: 'credit', accountCode: e.method === '?꾧툑' ? '1010' : '1020', amount: e.amt },
      ]})
    })

    // ?낃툑 10嫄?
    const incomes = [
      { desc: '臾명솕?ъ껌 1李?蹂댁“湲?, amt: 25000000, date: `${year}-01-10`, counter: '臾명솕?ъ껌', method: '怨꾩쥖?댁껜' },
      { desc: '寃쎌＜??愿愿묓솉蹂?蹂댁“湲?, amt: 10000000, date: `${year}-02-01`, counter: '寃쎌＜?쒖껌', method: '怨꾩쥖?댁껜' },
      { desc: '臾명솕?ъ껌 2李?蹂댁“湲?, amt: 25000000, date: `${year}-03-05`, counter: '臾명솕?ъ껌', method: '怨꾩쥖?댁껜' },
      { desc: '諛쒓뎬議곗궗 ?⑹뿭 ?섏엯', amt: 8000000, date: `${year}-03-20`, counter: '寃쎌＜臾명솕?ъ뿰援ъ썝', method: '怨꾩쥖?댁껜' },
      { desc: '?좎쟻 ?낆옣猷??섏엯', amt: 3200000, date: `${year}-${String(new Date().getMonth()).padStart(2, '0')}-01`, counter: '?꾩옣留ㅽ몴??, method: '?꾧툑' },
      { desc: '湲곕뀗???먮ℓ ?섏엯', amt: 1500000, date: `${year}-${String(new Date().getMonth()).padStart(2, '0')}-08`, counter: '湲곕뀗?덉꺏', method: '移대뱶' },
      { desc: '寃쎌＜??3李?蹂댁“湲?, amt: 10000000, date: `${year}-${String(new Date().getMonth()).padStart(2, '0')}-15`, counter: '寃쎌＜?쒖껌', method: '怨꾩쥖?댁껜' },
      { desc: '援먯쑁 ?꾨줈洹몃옩 李멸?鍮?, amt: 2400000, date: `${year}-${String(new Date().getMonth()).padStart(2, '0')}-20`, counter: '援먯쑁李멸???, method: '怨꾩쥖?댁껜' },
      { desc: '?꾩꽌 ?먮ℓ ?섏엯', amt: 850000, date: `${year}-${String(new Date().getMonth() + 1).padStart(2, '0')}-03`, counter: '?⑤씪?몄꽌??, method: '怨꾩쥖?댁껜' },
      { desc: '臾명솕?ъ껌 3李?蹂댁“湲?, amt: 20000000, date: `${year}-${String(new Date().getMonth() + 1).padStart(2, '0')}-10`, counter: '臾명솕?ъ껌', method: '怨꾩쥖?댁껜' },
    ]
    incomes.forEach(e => {
      const id = sid++
      cfs.push({ id, date: e.date, type: 'income', amount: e.amt, description: e.desc, accountCode: '4030', counter: e.counter, method: e.method })
      vs.push({ id: sid++, date: e.date, type: 'income', description: e.desc, createdAt: e.date + 'T09:00:00Z', entries: [
        { side: 'debit', accountCode: e.method === '?꾧툑' ? '1010' : '1020', amount: e.amt },
        { side: 'credit', accountCode: '4030', amount: e.amt },
      ]})
    })

    // 異쒓툑 10嫄?(type: 'expense' + withdrawal ?뺥깭)
    const withdrawals = [
      { desc: '?꾩쭅??1??湲됱뿬', amt: 15000000, date: `${year}-01-25`, counter: '吏곸썝怨꾩쥖', method: '怨꾩쥖?댁껜' },
      { desc: '?꾩쭅??2??湲됱뿬', amt: 15000000, date: `${year}-02-25`, counter: '吏곸썝怨꾩쥖', method: '怨꾩쥖?댁껜' },
      { desc: '4?蹂댄뿕 ?⑸?', amt: 4800000, date: `${year}-02-28`, counter: '援??嫄닿컯蹂댄뿕怨듬떒', method: '怨꾩쥖?댁껜' },
      { desc: '?꾩쭅??3??湲됱뿬', amt: 15000000, date: `${year}-03-25`, counter: '吏곸썝怨꾩쥖', method: '怨꾩쥖?댁껜' },
      { desc: '?댁쭅?곌툑 ?곷┰', amt: 3000000, date: `${year}-03-31`, counter: '?댁쭅?곌툑?댁슜??, method: '怨꾩쥖?댁껜' },
      { desc: '?멸툑 ?⑸? (遺媛??', amt: 5500000, date: `${year}-${String(new Date().getMonth()).padStart(2, '0')}-10`, counter: '援?꽭泥?, method: '怨꾩쥖?댁껜' },
      { desc: '?꾩쭅??${new Date().getMonth() + 1}??湲됱뿬', amt: 15000000, date: `${year}-${String(new Date().getMonth()).padStart(2, '0')}-25`, counter: '吏곸썝怨꾩쥖', method: '怨꾩쥖?댁껜' },
      { desc: '?щТ???꾨?猷?, amt: 3300000, date: `${year}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`, counter: '嫄대Ъ二?, method: '怨꾩쥖?댁껜' },
      { desc: '4?蹂댄뿕 ?⑸?', amt: 4800000, date: `${year}-${String(new Date().getMonth() + 1).padStart(2, '0')}-05`, counter: '援??嫄닿컯蹂댄뿕怨듬떒', method: '怨꾩쥖?댁껜' },
      { desc: '愿由щ퉬 ?⑸?', amt: 880000, date: `${year}-${String(new Date().getMonth() + 1).padStart(2, '0')}-10`, counter: '愿由ъ궗臾댁냼', method: '怨꾩쥖?댁껜' },
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

  localStorage.setItem('_acct_react_seed_v2', '1')
}

/* ?????????????????????????????????????????????
   ???
   ????????????????????????????????????????????? */
interface BudgetCat {
  id: string | number
  name: string
  year?: number
  bank?: string
  bankInfo?: string
  periodFrom?: string
  periodTo?: string
}

interface BudgetItem {
  id: string | number
  catId: string | number
  year?: number
  itemName: string
  accountCode?: string
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
}

interface Approval {
  id: string | number
  status: string
  date?: string
  createdAt?: string
  accountCode?: string
  amount?: number
  title?: string
}

interface Voucher {
  id: string | number
  type?: string
  date?: string
  description?: string
  createdAt?: string
  entries?: Array<{ side: string; amount: number; accountCode?: string; account?: string }>
}

/* ??? ?쒕툕 ?섏씠吏 ?뺤쓽 ?? */
const SUB_PAGES = [
  { key: 'overview',   label: '湲곕낯?꾪솴',   icon: LayoutDashboard },
  { key: 'budget',     label: '?덉궛?ㅼ젙',   icon: PieChart },
  { key: 'balance',    label: '湲곗큹?붿븸',   icon: Wallet },
  { key: 'approval',   label: '?덉쓽?섍린',   icon: FileCheck },
  { key: 'expense',    label: '吏異쒗븯湲?,   icon: TrendingDown },
  { key: 'income',     label: '?낃툑?꾪몴',   icon: TrendingUp },
  { key: 'withdrawal', label: '異쒓툑?꾪몴',   icon: ArrowUpCircle },
  { key: 'payment',    label: '?꾪몴?λ?',   icon: BookOpen },
  { key: 'reports',    label: '?뚭퀎?꾪솴',   icon: ScrollText },
  { key: 'vendors',    label: '嫄곕옒泥섍?由?,   icon: ContactRound },
  { key: 'hq_vendor',  label: '蹂몄궗嫄곕옒泥?,   icon: Building2 },
]

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
   AccountingPage 硫붿씤
   ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??*/
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
  const year = parseInt(searchParams.get('year') || '') || currentYear

  useEffect(() => { initAccountingSeed() }, [])

  return (
    <div className="animate-fadeIn">
      {/* ?? 紐⑤컮???곕룄 ?좏깮 (?곗뒪?ы깙? ?ㅻ뜑???쒖떆) ?? */}
      {(() => {
        const budgetCatsAll = getItem<BudgetCat[]>('acct_budget_cats', [])
        const budgetYrs = Array.from(new Set(budgetCatsAll.map(c => {
          if (c.year) return c.year
          if (c.periodFrom) return parseInt(c.periodFrom!.substring(0, 4))
          return currentYear
        }))).sort((a, b) => b - a)
        const mobileYears = budgetYrs.length > 0 ? budgetYrs : [currentYear]
        const isOverview = activeSub === 'overview'
        return (
          <div className="mb-4 md:hidden">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1">
                <Clock size={12} /> ?뚭퀎?곕룄
              </span>
              {mobileYears.map(y => (
                <button
                  key={y}
                  onClick={() => {
                    if (isOverview) return
                    const tab = searchParams.get('tab') || 'overview'
                    setSearchParams({ tab, year: String(y) })
                  }}
                  className={cn(
                    'px-3 py-1 rounded-full text-[11px] font-bold transition-all border',
                    isOverview ? 'cursor-default' : 'cursor-pointer',
                    y === year
                      ? 'bg-primary-500 text-white border-primary-500'
                      : isOverview
                        ? 'bg-transparent text-[var(--text-muted)] border-[var(--border-default)] opacity-40'
                        : 'bg-transparent text-[var(--text-muted)] border-[var(--border-default)] hover:border-primary-400',
                  )}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
        )
      })()}




      {/* ?? ?쒕툕 ?섏씠吏 ?뚮뜑 ?? */}
      {activeSub === 'overview' && <AcctOverview year={year} />}
      {activeSub === 'budget' && <AcctBudget year={year} />}
      {activeSub === 'balance' && <AcctBalance year={year} />}
      {activeSub === 'approval' && <AcctApproval year={year} />}
      {(activeSub === 'expense' || activeSub === 'income' || activeSub === 'withdrawal') && (
        <AcctVoucherEntry year={year} type={activeSub as 'expense' | 'income' | 'withdrawal'} />
      )}
      {activeSub === 'payment' && <AcctPaymentLedger year={year} />}
      {activeSub === 'reports' && <AcctReports year={year} />}
      {activeSub === 'vendors' && <AcctVendors />}
      {activeSub === 'hq_vendor' && <AcctHqVendor />}
      {!['overview','budget','balance','approval','expense','income','withdrawal','payment','reports','vendors','hq_vendor'].includes(activeSub) && (
        <AcctSubPlaceholder
          pageKey={activeSub}
          label={SUB_PAGES.find(s => s.key === activeSub)?.label || ''}
        />
      )}
    </div>
  )
}

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
   湲곕낯?꾪솴 (Overview)
   ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??*/
function AcctOverview({ year }: { year: number }) {
  const budgetCats = useMemo(() => getItem<BudgetCat[]>('acct_budget_cats', []), [])
  const budgets = useMemo(() => getItem<BudgetItem[]>('acct_budgets', []), [])
  const cashflows = useMemo(() => getItem<CashFlow[]>('acct_cashflows', []), [])
  const approvals = useMemo(() => getItem<Approval[]>('acct_approvals', []), [])
  const vouchers = useMemo(() => getItem<Voucher[]>('acct_vouchers', []), [])

  const [selectedOverviewCatId, setSelectedOverviewCatId] = useState<string | number | null>(null)

  const isInYear = (dateStr?: string) => {
    if (!dateStr) return false
    return parseInt(String(dateStr).substring(0, 4)) === year
  }

  /* ?? ?곕룄蹂??꾪꽣 ?? */
  const yearCats = budgetCats.filter(cat => {
    const catYear = cat.year || (cat.periodFrom ? parseInt(cat.periodFrom.substring(0, 4)) : new Date().getFullYear())
    return catYear === year
  })
  const yearCatIds = yearCats.map(c => c.id)
  const yearBudgets = budgets.filter(b => yearCatIds.includes(b.catId))
  const yearCashflows = cashflows.filter(cf => isInYear(cf.date))
  const yearApprovals = approvals.filter(a => isInYear(a.date || a.createdAt))
  const yearVouchers = vouchers.filter(v => isInYear(v.date))

  /* ?? ?좏깮 援щ텇蹂??덉궛 ?꾪꽣 ?? */
  const filteredBudgets = selectedOverviewCatId
    ? yearBudgets.filter(b => String(b.catId) === String(selectedOverviewCatId))
    : yearBudgets

  /* ?? ?듦퀎 ?? */
  const totalIncome = yearCashflows.filter(c => c.type === 'income').reduce((a, c) => a + (c.amount || 0), 0)
  const totalExpense = yearCashflows.filter(c => c.type === 'expense').reduce((a, c) => a + (c.amount || 0), 0)
  const balance = totalIncome - totalExpense
  const pendingCount = yearApprovals.filter(a => a.status === 'pending').length
  const totalBudgetAmt = filteredBudgets.reduce((a, b) => a + (b.amount || 0), 0)
  const totalBudgetSpent = filteredBudgets.reduce((a, b) => a + (b.spent || 0), 0)
  const budgetRate = totalBudgetAmt > 0 ? Math.round(totalBudgetSpent / totalBudgetAmt * 100) : 0

  const statCards = [
    { icon: ArrowDownCircle, label: '珥??섏엯', value: `${formatNumber(totalIncome)}??, color: '#22c55e' },
    { icon: ArrowUpCircle, label: '珥?吏異?, value: `${formatNumber(totalExpense)}??, color: '#ef4444' },
    { icon: Banknote, label: '?붿븸', value: `${formatNumber(balance)}??, color: balance >= 0 ? '#4f6ef7' : '#ef4444' },
    { icon: FileCheck, label: '寃곗옱 ?湲?, value: `${pendingCount}嫄?, color: '#f59e0b' },
  ]

  /* ?? 理쒓렐 ?꾪몴 5嫄??? */
  const recentVouchers = [...yearVouchers]
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, 5)

  /* ?? ?덉궛 ?뚯쭊??TOP 5 ?? */
  const budgetBars = filteredBudgets
    .map(b => ({
      name: b.itemName,
      pct: b.amount > 0 ? Math.round((b.spent || 0) / b.amount * 100) : 0,
      spent: b.spent || 0,
      amount: b.amount,
    }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5)

  /* ?? ?붾퀎 ?섏엯/吏異?(理쒓렐 6媛쒖썡) ?? */
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

  return (
    <div className="space-y-4">
      {/* ?? ?듦퀎 移대뱶 ?? */}
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

      {/* ?? ?덉궛 吏묓뻾 ?꾪솴 ?? */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4">
        <div className="flex items-center gap-2 text-sm font-extrabold text-[var(--text-primary)] mb-3">
          <PieChart size={16} className="text-primary-500" /> ?덉궛 吏묓뻾 ?꾪솴
        </div>

        {/* ?? ?덉궛 援щ텇蹂????? */}
        {yearCats.length > 0 && (
          <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedOverviewCatId(null)}
              className={cn(
                'text-[11px] font-bold px-3.5 py-1.5 rounded-full cursor-pointer transition-all border whitespace-nowrap',
                selectedOverviewCatId === null
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'text-[var(--text-secondary)] border-[var(--border-default)] hover:border-primary-400 hover:text-primary-500'
              )}
            >
              ?꾩껜
            </button>
            {yearCats.map((cat, idx) => {
              const isActive = String(selectedOverviewCatId) === String(cat.id)
              const tc = tabColors[idx % tabColors.length]
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedOverviewCatId(cat.id)}
                  className={cn(
                    'text-[11px] font-bold px-3.5 py-1.5 rounded-full cursor-pointer transition-all border whitespace-nowrap',
                    isActive
                      ? 'text-white border-transparent'
                      : 'text-[var(--text-secondary)] border-[var(--border-default)] hover:border-primary-400 hover:text-primary-500'
                  )}
                  style={isActive ? { background: tc, borderColor: tc } : {}}
                >
                  {cat.name}
                </button>
              )
            })}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 mb-3">
          <div className="text-center">
            <div className="text-[11px] text-[var(--text-muted)] mb-1">珥??몄꽦 ?덉궛</div>
            <div className="text-base font-extrabold text-[var(--text-primary)]">{formatNumber(totalBudgetAmt)}??/div>
          </div>
          <div className="text-center">
            <div className="text-[11px] text-[var(--text-muted)] mb-1">珥?吏묓뻾??/div>
            <div className="text-base font-extrabold text-danger">{formatNumber(totalBudgetSpent)}??/div>
          </div>
          <div className="text-center">
            <div className="text-[11px] text-[var(--text-muted)] mb-1">?붿뿬?덉궛</div>
            <div className="text-base font-extrabold text-success">{formatNumber(totalBudgetAmt - totalBudgetSpent)}??/div>
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
          {budgetRate}% 吏묓뻾
        </div>
      </div>

      {/* ?? 2移쇰읆: ?붾퀎 李⑦듃 + ?덉궛 ?뚯쭊???? */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ?붾퀎 李⑦듃 */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[var(--text-primary)] mb-4">
            <Settings2 size={16} className="text-primary-500" /> ?붾퀎 ?섏엯 쨌 吏異?
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
                      title={`?섏엯 ${formatNumber(d.income)}??}
                    />
                    <div
                      className="w-3 rounded-t-sm transition-all duration-500"
                      style={{ height: eh, background: '#ef4444' }}
                      title={`吏異?${formatNumber(d.expense)}??}
                    />
                  </div>
                  <span className="text-[9px] font-bold text-[var(--text-muted)]">{key.slice(5)}??/span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-4 justify-center mt-3">
            <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#22c55e' }} /> ?섏엯
            </span>
            <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#ef4444' }} /> 吏異?
            </span>
          </div>
        </div>

        {/* ?덉궛 ?뚯쭊??TOP 5 */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[var(--text-primary)] mb-4">
            <PieChart size={16} className="text-primary-500" /> ?덉궛 ?뚯쭊??TOP 5
          </div>
          {budgetBars.length === 0 ? (
            <EmptyState emoji="?뱤" title="?깅줉???덉궛???놁뒿?덈떎" />
          ) : (
            <div className="space-y-3">
              {budgetBars.map((b, i) => {
                const color = b.pct > 100 ? '#ef4444' : b.pct > 80 ? '#f59e0b' : '#4f6ef7'
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-bold text-[var(--text-primary)] truncate">{b.name}</span>
                      <span className="font-extrabold" style={{ color }}>{b.pct}%{b.pct > 100 ? ' ?좑툘' : ''}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, b.pct)}%`, background: color }}
                      />
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                      {formatNumber(b.spent)}??/ {formatNumber(b.amount)}??
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ?? 理쒓렐 ?꾪몴 ?? */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-default)]">
          <ScrollText size={16} className="text-primary-500" />
          <span className="text-sm font-extrabold text-[var(--text-primary)]">理쒓렐 ?꾪몴</span>
        </div>
        {recentVouchers.length === 0 ? (
          <div className="p-6">
            <EmptyState emoji="?뱥" title="?깅줉???꾪몴媛 ?놁뒿?덈떎" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-[var(--bg-muted)]">
                  {['?좎쭨', '?좏삎', '?곸슂', '李⑤?', '?蹂'].map((h, i) => (
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
                    ? { label: '?낃툑', color: '#22c55e', bg: 'rgba(34,197,94,.1)' }
                    : v.type === 'expense'
                      ? { label: '異쒓툑', color: '#ef4444', bg: 'rgba(239,68,68,.1)' }
                      : { label: '?泥?, color: '#8b5cf6', bg: 'rgba(139,92,246,.1)' }
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
                      <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-danger text-right">{formatNumber(ds)}??/td>
                      <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-success text-right">{formatNumber(cs)}??/td>
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

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
   ?덉궛?ㅼ젙 (Budget) ???덇굅??留ㅼ묶 CRUD
   ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??*/
function AcctBudget({ year }: { year: number }) {
  const [selectedCatId, setSelectedCatId] = useState<string | number | null>(null)
  const [refresh, setRefresh] = useState(0)

  /* ?? 紐⑤떖 ?곹깭 ?? */
  const [catModalOpen, setCatModalOpen] = useState(false)
  const [catEditId, setCatEditId] = useState<string | number | null>(null)
  const [catForm, setCatForm] = useState({ name: '', bank: '', periodFrom: `${year}-01-01`, periodTo: `${year}-12-31` })

  const [budgetModalOpen, setBudgetModalOpen] = useState(false)
  const [budgetEditId, setBudgetEditId] = useState<number | null>(null)
  const [budgetForm, setBudgetForm] = useState({ itemName: '', accountCode: '', amount: '', memo: '' })
  const [itemNameSearch, setItemNameSearch] = useState('')
  const [itemNamePopup, setItemNamePopup] = useState(false)
  const [acctSearch, setAcctSearch] = useState('')
  const [acctPopup, setAcctPopup] = useState(false)

  /* ?? ?곗씠???? */
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

  // 湲고??ㅼ젙???덉궛紐⑷낵 ?숈씪: ?덉뒪?좊━ + 湲곗〈 ?덉궛 ?곗씠?곗쓽 itemName ?⑹궛
  const allItemNames = useMemo(() => {
    return Array.from(new Set([
      ...budgets.map(b => b.itemName).filter(Boolean),
      ...itemNameHistory.filter(Boolean),
    ])).sort()
  }, [budgets, itemNameHistory])

  // ?꾪꽣留곷맂 ?덉궛紐?由ъ뒪??
  const filteredItemNames = useMemo(() => {
    if (!itemNameSearch.trim()) return allItemNames
    const q = itemNameSearch.toLowerCase()
    return allItemNames.filter(n => n.toLowerCase().includes(q))
  }, [allItemNames, itemNameSearch])
  const isNewItemName = itemNameSearch.trim() && !allItemNames.includes(itemNameSearch.trim())

  // ?꾪꽣留곷맂 怨꾩젙怨쇰ぉ 由ъ뒪??
  const filteredAccounts = useMemo(() => {
    if (!acctSearch.trim()) return accounts
    const q = acctSearch.toLowerCase()
    return accounts.filter(a => a.code.includes(q) || a.name.toLowerCase().includes(q) || (a.group || '').toLowerCase().includes(q))
  }, [accounts, acctSearch])

  const selCat = selectedCatId ? budgetCats.find(c => String(c.id) === String(selectedCatId)) : budgetCats[0]
  const filtered = selCat ? budgets.filter(b => String(b.catId) === String(selCat.id)) : []
  const totalAmt = filtered.reduce((a, b) => a + (b.amount || 0), 0)
  const totalSpent = filtered.reduce((a, b) => a + (b.spent || 0), 0)

  const colors = ['#4f6ef7', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

  /* ?? 援щ텇 CRUD ?? */
  const openCatModal = (editId?: string | number) => {
    if (editId) {
      const c = getItem<BudgetCat[]>('acct_budget_cats', []).find(x => String(x.id) === String(editId))
      if (c) {
        setCatEditId(editId)
        setCatForm({ name: c.name || '', bank: c.bank || c.bankInfo || '', periodFrom: c.periodFrom || `${year}-01-01`, periodTo: c.periodTo || `${year}-12-31` })
      }
    } else {
      setCatEditId(null)
      setCatForm({ name: '', bank: '', periodFrom: `${year}-01-01`, periodTo: `${year}-12-31` })
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
        return { ...c, name: catForm.name.trim(), bank: catForm.bank, bankInfo: catForm.bank, periodFrom: catForm.periodFrom, periodTo: catForm.periodTo, year: y }
      })
      localStorage.setItem('acct_budget_cats', JSON.stringify(updated))
    } else {
      const y = catForm.periodFrom ? parseInt(catForm.periodFrom.substring(0, 4)) : year
      const newCat: BudgetCat = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        name: catForm.name.trim(),
        bank: catForm.bank,
        bankInfo: catForm.bank,
        periodFrom: catForm.periodFrom,
        periodTo: catForm.periodTo,
        year: y,
      }
      all.push(newCat)
      localStorage.setItem('acct_budget_cats', JSON.stringify(all))
      setSelectedCatId(newCat.id)
    }
    setCatModalOpen(false)
    setRefresh(r => r + 1)
  }

  const deleteCat = (id: string | number) => {
    if (!confirm('???덉궛援щ텇怨?愿???덉궛??ぉ??紐⑤몢 ??젣?섏떆寃좎뒿?덇퉴?')) return
    const sid = String(id)
    const cats = getItem<BudgetCat[]>('acct_budget_cats', []).filter(c => String(c.id) !== sid)
    const bds = getItem<BudgetItem[]>('acct_budgets', []).filter(b => String(b.catId) !== sid)
    localStorage.setItem('acct_budget_cats', JSON.stringify(cats))
    localStorage.setItem('acct_budgets', JSON.stringify(bds))
    if (String(selectedCatId) === sid) setSelectedCatId(null)
    setRefresh(r => r + 1)
  }

  /* ?? ?덉궛??ぉ CRUD ?? */
  const openBudgetModal = (editId?: number) => {
    if (editId) {
      const b = budgets.find(x => x.id === editId)
      if (b) {
        setBudgetEditId(editId)
        setBudgetForm({ itemName: b.itemName || '', accountCode: b.accountCode || '', amount: formatNumber(b.amount), memo: b.memo || '' })
      }
    } else {
      setBudgetEditId(null)
      setBudgetForm({ itemName: '', accountCode: '', amount: '', memo: '' })
    }
    setBudgetModalOpen(true)
    setItemNameSearch('')
    setItemNamePopup(false)
    setAcctSearch('')
    setAcctPopup(false)
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
        return { ...b, itemName: budgetForm.itemName.trim(), accountCode: budgetForm.accountCode, amount: amt, memo: budgetForm.memo }
      })
      localStorage.setItem('acct_budgets', JSON.stringify(updated))
    } else {
      all.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        catId: selCat!.id,
        year,
        itemName: budgetForm.itemName.trim(),
        accountCode: budgetForm.accountCode,
        amount: amt,
        spent: 0,
        memo: budgetForm.memo,
      })
      localStorage.setItem('acct_budgets', JSON.stringify(all))
    }
    // ???덉궛紐⑹씠硫??덉뒪?좊━???먮룞 異붽?
    const trimName = budgetForm.itemName.trim()
    const hist = getItem<string[]>('acct_itemName_history', [])
    if (!hist.includes(trimName)) {
      setItem('acct_itemName_history', [...hist, trimName])
    }

    setBudgetModalOpen(false)
    setRefresh(r => r + 1)
  }

  const deleteBudgetItem = (id: number) => {
    if (!confirm('???덉궛??ぉ????젣?섏떆寃좎뒿?덇퉴?')) return
    const bds = getItem<BudgetItem[]>('acct_budgets', []).filter(b => b.id !== id)
    localStorage.setItem('acct_budgets', JSON.stringify(bds))
    setRefresh(r => r + 1)
  }

  /* ?? 湲덉븸 ?щ㎎ ?낅젰 ?? */
  const handleAmountInput = (val: string) => {
    const digits = val.replace(/[^\d]/g, '')
    setBudgetForm(f => ({ ...f, amount: digits ? Number(digits).toLocaleString('ko-KR') : '' }))
  }

  return (
    <div className="space-y-4">
      {/* ?? ?덉궛援щ텇 愿由??? */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[var(--text-primary)]">
            <PieChart size={16} className="text-primary-500" /> ?덉궛援щ텇 愿由?
          </div>
          <button
            onClick={() => openCatModal()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[12px] font-bold text-[var(--text-secondary)] hover:border-primary-400 hover:text-primary-500 transition-all cursor-pointer"
          >
            <Plus size={12} /> 援щ텇 異붽?
          </button>
        </div>
        {budgetCats.length === 0 ? (
          <EmptyState emoji="?뱚" title={`${year}???깅줉???덉궛援щ텇???놁뒿?덈떎. "援щ텇 異붽?" 踰꾪듉?쇰줈 癒쇱? ?깅줉?섏꽭??`} />
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
                          ?좏깮
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] mb-1">?룱 {cat.bankInfo || cat.bank || '-'}</div>
                    <div className="text-[10px] text-[var(--text-muted)] mb-2">?뱟 {cat.periodFrom || ''} ~ {cat.periodTo || ''}</div>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-[var(--text-secondary)]">{catBudgets.length}嫄?/span>
                      <span className="font-bold">{formatNumber(amt)}??/span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: pct > 100 ? '#ef4444' : cc }} />
                    </div>
                  </div>
                  {/* ?섏젙 / ??젣 */}
                  <div className="flex border-t border-[var(--border-default)]">
                    <button
                      onClick={e => { e.stopPropagation(); openCatModal(cat.id) }}
                      className="flex-1 py-2 text-[11px] font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer border-r border-[var(--border-default)]"
                    >
                      ?섏젙
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); deleteCat(cat.id) }}
                      className="flex-1 py-2 text-[11px] font-bold text-danger hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
                    >
                      ??젣
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ?? ?덉궛??ぉ ?뚯씠釉??? */}
      {selCat && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
            <div className="flex items-center gap-2">
              <ScrollText size={14} className="text-primary-500" />
              <span className="text-sm font-extrabold text-[var(--text-primary)]">{selCat.name} ???덉궛??ぉ</span>
              <span className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--bg-muted)] px-2 py-0.5 rounded-full">
                {filtered.length}嫄?쨌 {formatNumber(totalAmt)}??
              </span>
            </div>
            <button
              onClick={() => openBudgetModal()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-500 text-white text-[12px] font-bold hover:bg-primary-600 transition-all cursor-pointer"
            >
              <Plus size={12} /> ?덉궛 異붽?
            </button>
          </div>

          {filtered.length === 0 ? (
            <div className="p-8 text-center">
              <EmptyState emoji="?뮥" title="?깅줉???덉궛???놁뒿?덈떎" />
              <p className="text-[11px] text-[var(--text-muted)] mt-1">"?덉궛 異붽?" 踰꾪듉???뚮윭 ?깅줉?섏꽭??/p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="bg-[var(--bg-muted)]">
                    {['?덉궛??ぉ', '怨꾩젙肄붾뱶', '?몄꽦??, '吏묓뻾??, '?붿뿬', '?뚯쭊??, '愿由?].map(h => (
                      <th key={h} className={cn("py-2.5 px-3.5 text-[11px] font-bold text-[var(--text-muted)]", h === '愿由? ? 'text-center w-[80px]' : 'text-left')}>{h}</th>
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
                        <td className="py-2.5 px-3.5 text-[11px] text-[var(--text-muted)] font-mono">{b.accountCode || '-'}</td>
                        <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-[var(--text-primary)] text-right">{formatNumber(b.amount)}??/td>
                        <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-danger text-right">{formatNumber(b.spent || 0)}??/td>
                        <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-right" style={{ color: (b.amount - (b.spent || 0)) < 0 ? '#ef4444' : '#22c55e' }}>
                          {formatNumber(b.amount - (b.spent || 0))}??
                        </td>
                        <td className="py-2.5 px-3.5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden max-w-[80px]">
                              <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
                            </div>
                            <span className="text-[11px] font-extrabold" style={{ color }}>{pct}%</span>
                            {pct > 100 && <span className="text-[10px] text-danger font-bold">?좑툘</span>}
                          </div>
                        </td>
                        <td className="py-2.5 px-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openBudgetModal(b.id as number)}
                              className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:bg-primary-100 hover:text-primary-500 transition-all cursor-pointer"
                              title="?섏젙"
                            >
                              <Edit3 size={12} />
                            </button>
                            <button
                              onClick={() => deleteBudgetItem(b.id as number)}
                              className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:bg-red-100 hover:text-danger transition-all cursor-pointer"
                              title="??젣"
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
                    <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-[var(--text-primary)]" colSpan={2}>?⑷퀎</td>
                    <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-[var(--text-primary)] text-right">{formatNumber(totalAmt)}??/td>
                    <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-danger text-right">{formatNumber(totalSpent)}??/td>
                    <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-success text-right">{formatNumber(totalAmt - totalSpent)}??/td>
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

      {/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
         紐⑤떖: ?덉궛援щ텇 異붽?/?섏젙
         ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??*/}
      {catModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={() => setCatModalOpen(false)}>
          <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-[460px] mx-4 border border-[var(--border-default)]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)]">
              <h3 className="text-base font-extrabold text-[var(--text-primary)]">{catEditId ? '?덉궛援щ텇 ?섏젙' : '?덉궛援щ텇 異붽?'}</h3>
              <button onClick={() => setCatModalOpen(false)} className="text-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">??/button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">?덉궛援щ텇紐?*</label>
                <input
                  value={catForm.name}
                  onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="?? 臾명솕?ъ껌, ?먯껜?덉궛"
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">?듭옣?뺣낫</label>
                <input
                  value={catForm.bank}
                  onChange={e => setCatForm(f => ({ ...f, bank: e.target.value }))}
                  placeholder="?? 湲곗뾽???10110-11001-12"
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">?쒖옉??/label>
                  <DatePicker value={catForm.periodFrom} onChange={v => setCatForm(f => ({ ...f, periodFrom: v }))} />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">醫낅즺??/label>
                  <DatePicker value={catForm.periodTo} onChange={v => setCatForm(f => ({ ...f, periodTo: v }))} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-[var(--border-default)]">
              <button onClick={() => setCatModalOpen(false)} className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer">痍⑥냼</button>
              <button onClick={saveCat} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-bold hover:bg-primary-600 transition-colors cursor-pointer">???/button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
         紐⑤떖: ?덉궛??ぉ 異붽?/?섏젙
         ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??*/}
      {budgetModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={() => setBudgetModalOpen(false)}>
          <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-[460px] mx-4 border border-[var(--border-default)]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)]">
              <h3 className="text-base font-extrabold text-[var(--text-primary)]">{budgetEditId ? '?덉궛 ?섏젙' : '?덉궛 異붽?'}</h3>
              <button onClick={() => setBudgetModalOpen(false)} className="text-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">??/button>
            </div>
            <div className="px-5 py-4 space-y-3">
              {/* ?덉궛紐?- 寃??肄ㅻ낫諛뺤뒪 */}
              <div className="relative">
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 flex items-center gap-1">
                  ?덉궛紐?*
                  {isNewItemName && <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">+ ????ぉ</span>}
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
                  placeholder="?덉궛紐⑹쓣 寃?됲븯嫄곕굹 ?덈줈 ?낅젰?섏꽭??
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
                          <div className="text-emerald-500 font-bold">??"{budgetForm.itemName.trim()}"</div>
                          <div className="text-[var(--text-muted)]">???덉궛紐⑹쑝濡??깅줉?⑸땲??/div>
                        </div>
                      )}
                      {filteredItemNames.length === 0 && !budgetForm.itemName.trim() && (
                        <div className="text-center text-xs text-[var(--text-muted)] py-3">?깅줉???덉궛紐⑹씠 ?놁뒿?덈떎</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 怨꾩젙怨쇰ぉ - 寃??肄ㅻ낫諛뺤뒪 */}
              <div className="relative">
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">怨꾩젙怨쇰ぉ *</label>
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
                    <span className="text-[var(--text-muted)]">怨꾩젙怨쇰ぉ???좏깮?섏꽭??/span>
                  )}
                </div>
                {acctPopup && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-xl z-50 max-h-[280px] overflow-hidden">
                    <div className="p-2 border-b border-[var(--border-default)]">
                      <input
                        value={acctSearch}
                        onChange={e => setAcctSearch(e.target.value)}
                        placeholder="肄붾뱶 ?먮뒗 ?대쫫?쇰줈 寃??.."
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-[var(--text-primary)] outline-none focus:border-primary-400"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-[220px] overflow-y-auto p-1.5">
                      {filteredAccounts.map(a => (
                        <button key={a.code}
                          onClick={() => {
                            setBudgetForm(f => ({ ...f, accountCode: a.code }))
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
                        <div className="text-center text-xs text-[var(--text-muted)] py-3">寃??寃곌낵媛 ?놁뒿?덈떎</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">?곌컙 ?덉궛??(?? *</label>
                <input
                  value={budgetForm.amount}
                  onChange={e => handleAmountInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveBudgetItem() }}
                  placeholder="?? 50,000,000"
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">硫붾え</label>
                <input
                  value={budgetForm.memo}
                  onChange={e => setBudgetForm(f => ({ ...f, memo: e.target.value }))}
                  placeholder="?덉궛 ?ㅻ챸"
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-[var(--border-default)]">
              <button onClick={() => setBudgetModalOpen(false)} className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer">痍⑥냼</button>
              <button onClick={saveBudgetItem} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-bold hover:bg-primary-600 transition-colors cursor-pointer">???/button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  )
}

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
   ?덉쓽 (Approval) ??CRUD
   ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??*/
function AcctApproval({ year }: { year: number }) {
  const [refresh, setRefresh] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ title: '', amount: '', date: new Date().toISOString().slice(0, 10), accountCode: '', description: '', applicant: 'admin', approver: '' })
  const staffList = useStaffStore(s => s.staff).filter(s => !s.resignedAt)

  /* ?덉궛怨쇰ぉ 紐⑸줉 (?덉궛援щ텇 > ??ぉ) */
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
    pending: { label: '?湲?, color: '#f59e0b', bg: 'rgba(245,158,11,.1)' },
    approved: { label: '?뱀씤', color: '#22c55e', bg: 'rgba(34,197,94,.1)' },
    rejected: { label: '諛섎젮', color: '#ef4444', bg: 'rgba(239,68,68,.1)' },
    expensed: { label: '吏異쒖셿猷?, color: '#4f6ef7', bg: 'rgba(79,110,247,.1)' },
    vouchered: { label: '?꾪몴?꾨즺', color: '#8b5cf6', bg: 'rgba(139,92,246,.1)' },
  }

  const counts = {
    all: approvals.length,
    pending: approvals.filter(a => a.status === 'pending').length,
    approved: approvals.filter(a => a.status === 'approved').length,
    rejected: approvals.filter(a => a.status === 'rejected').length,
  }

  const handleAmtInput = (val: string) => {
    const digits = val.replace(/[^\d]/g, '')
    setForm(f => ({ ...f, amount: digits ? Number(digits).toLocaleString('ko-KR') : '' }))
  }

  const saveApproval = () => {
    if (!form.title.trim()) return alert('?덉쓽紐낆쓣 ?낅젰?댁＜?몄슂')
    const amt = parseInt(form.amount.replace(/,/g, '')) || 0
    if (amt <= 0) return alert('湲덉븸???낅젰?댁＜?몄슂')
    if (!form.approver) return alert('?뱀씤?먮? ?좏깮?댁＜?몄슂')
    const all = getItem<Approval[]>('acct_approvals', [])
    all.push({
      id: Date.now() + Math.floor(Math.random() * 1000),
      title: form.title.trim(),
      amount: amt,
      date: form.date,
      status: 'pending',
      accountCode: form.accountCode,
      description: form.description,
      applicant: form.applicant,
      approver: form.approver,
      createdAt: new Date().toISOString(),
    })
    setItem('acct_approvals', all)
    setModalOpen(false)
    setForm({ title: '', amount: '', date: new Date().toISOString().slice(0, 10), accountCode: '', description: '', applicant: 'admin', approver: '' })
    setRefresh(r => r + 1)
  }

  const updateStatus = (id: string | number, status: string) => {
    const all = getItem<Approval[]>('acct_approvals', [])
    const updated = all.map(a => String(a.id) === String(id) ? { ...a, status } : a)
    setItem('acct_approvals', updated)
    setRefresh(r => r + 1)
  }

  const deleteApproval = (id: string | number) => {
    if (!confirm('???덉쓽瑜???젣?섏떆寃좎뒿?덇퉴?')) return
    const all = getItem<Approval[]>('acct_approvals', []).filter(a => String(a.id) !== String(id))
    setItem('acct_approvals', all)
    setRefresh(r => r + 1)
  }

  return (
    <div className="space-y-4">
      {/* ?듦퀎 移대뱶 */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: '?꾩껜', value: counts.all, color: '#4f6ef7' },
          { label: '?湲?, value: counts.pending, color: '#f59e0b' },
          { label: '?뱀씤', value: counts.approved, color: '#22c55e' },
          { label: '諛섎젮', value: counts.rejected, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-3 text-center">
            <div className="text-xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] font-bold text-[var(--text-muted)]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* 紐⑸줉 */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-2">
            <FileCheck size={14} className="text-primary-500" />
            <span className="text-sm font-extrabold text-[var(--text-primary)]">?덉쓽 紐⑸줉</span>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-500 text-white text-[12px] font-bold hover:bg-primary-600 transition-all cursor-pointer"
          >
            <Plus size={13} /> ?덉쓽 ?깅줉
          </button>
        </div>
        {approvals.length === 0 ? (
          <div className="p-6"><EmptyState emoji="?뱥" title="?깅줉???덉쓽媛 ?놁뒿?덈떎" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-[var(--bg-muted)]">
                  {['?좎쭨', '?쒕ぉ', '湲덉븸', '?곹깭', '愿由?].map(h => (
                    <th key={h} className="py-2.5 px-3.5 text-[11px] font-bold text-[var(--text-muted)] text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {approvals.map(a => {
                  const si = statusInfo[a.status] || statusInfo.pending
                  return (
                    <tr key={a.id} className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-muted)] transition-colors">
                      <td className="py-2.5 px-3.5 text-[12px] text-[var(--text-secondary)]">{a.date || a.createdAt || ''}</td>
                      <td className="py-2.5 px-3.5 text-[12px] font-bold text-[var(--text-primary)]">{a.title || '-'}</td>
                      <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-right text-[var(--text-primary)]">{formatNumber(a.amount || 0)}??/td>
                      <td className="py-2.5 px-3.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: si.bg, color: si.color }}>
                          {si.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5">
                        <div className="flex items-center gap-1">
                          {a.status === 'pending' && (
                            <>
                              <button onClick={() => updateStatus(a.id, 'approved')} title="?뱀씤" className="p-1 rounded-md bg-[rgba(34,197,94,.1)] text-[#22c55e] hover:bg-[rgba(34,197,94,.2)] cursor-pointer transition-colors">
                                <Check size={12} />
                              </button>
                              <button onClick={() => updateStatus(a.id, 'rejected')} title="諛섎젮" className="p-1 rounded-md bg-[rgba(239,68,68,.1)] text-[#ef4444] hover:bg-[rgba(239,68,68,.2)] cursor-pointer transition-colors">
                                <Ban size={12} />
                              </button>
                            </>
                          )}
                          <button onClick={() => deleteApproval(a.id)} title="??젣" className="p-1 rounded-md bg-[rgba(239,68,68,.06)] text-[#ef4444] hover:bg-[rgba(239,68,68,.15)] cursor-pointer transition-colors">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ?덉쓽 ?깅줉 紐⑤떖 */}
      {modalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-default)]">
              <span className="text-sm font-extrabold text-[var(--text-primary)]">?덉쓽 ?깅줉</span>
              <button onClick={() => setModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* ?덉쓽紐?*/}
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">?덉쓽紐?*</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="?? ?щТ?⑺뭹 援щℓ" className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none" />
              </div>
              {/* ?덉궛怨쇰ぉ + 湲덉븸 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">?덉궛怨쇰ぉ *</label>
                  <CustomSelect
                    value={form.accountCode}
                    onChange={v => setForm(f => ({ ...f, accountCode: v }))}
                    placeholder="???좏깮 ??
                    options={[
                      { value: '', label: '???좏깮 ?? },
                      ...budgetCats.flatMap(cat =>
                        budgetItems.filter(b => b.catId === cat.id).map(b => ({
                          value: b.accountCode || b.itemName,
                          label: `${cat.name} > ${b.itemName}`,
                        }))
                      ),
                    ]}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">湲덉븸 (?? *</label>
                  <input value={form.amount} onChange={e => handleAmtInput(e.target.value)} placeholder="0" className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none text-right font-bold" />
                </div>
              </div>
              {/* ?좎껌??+ ?뱀씤??*/}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">?좎껌??/label>
                  <input value={form.applicant} onChange={e => setForm(f => ({ ...f, applicant: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-sm text-[var(--text-primary)] outline-none" readOnly />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">?뱀씤??*</label>
                  <CustomSelect
                    value={form.approver}
                    onChange={v => setForm(f => ({ ...f, approver: v }))}
                    placeholder="???좏깮 ??
                    options={[
                      { value: '', label: '???좏깮 ?? },
                      ...staffList.map(s => ({
                        value: s.name,
                        label: `${s.name}${s.rank ? ` (${s.rank})` : ''}${s.dept ? ` - ${s.dept}` : ''}`,
                      })),
                    ]}
                  />
                </div>
              </div>
              {/* ?ъ쑀/硫붾え */}
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">?ъ쑀/硫붾え</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="?덉쓽 ?ъ쑀瑜??낅젰?댁＜?몄슂" rows={3} className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-[var(--border-default)]">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] cursor-pointer">痍⑥냼</button>
              <button onClick={saveApproval} className="px-4 py-2 rounded-lg bg-[#22c55e] text-white text-sm font-bold hover:bg-[#16a34a] cursor-pointer">?깅줉</button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  )
}

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
   ?꾪몴 ?낅젰 (吏異??낃툑/異쒓툑) ??CRUD
   ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??*/
function AcctVoucherEntry({ year, type }: { year: number; type: 'expense' | 'income' | 'withdrawal' }) {
  const [refresh, setRefresh] = useState(0)
  const typeLabels = { expense: '吏異쒗븯湲?, income: '?낃툑?꾪몴', withdrawal: '異쒓툑?꾪몴' }
  const typeEmojis = { expense: '?뮯', income: '?뮫', withdrawal: '?룲' }
  const typeColors = { expense: '#ef4444', income: '#22c55e', withdrawal: '#f59e0b' }
  const typeGrads = { expense: 'from-[#ef4444] to-[#dc2626]', income: 'from-[#22c55e] to-[#16a34a]', withdrawal: 'from-[#f59e0b] to-[#d97706]' }

  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({ desc: '', amount: '', counter: '', method: type === 'income' ? '怨꾩쥖?댁껜' : '怨꾩쥖?댁껜', writeDate: today, tradeDate: today })
  const [counterSearch, setCounterSearch] = useState('')
  const [showCounterList, setShowCounterList] = useState(false)
  const counterRef = useRef<HTMLDivElement>(null)
  const [descMode, setDescMode] = useState<'select' | 'input'>('select')

  /* ?덉궛紐?紐⑸줉 (湲고??ㅼ젙???덉궛紐??곗씠?? */
  const budgetItemNames = useMemo(() => {
    const budgets: { itemName: string }[] = getItem('acct_budgets', [])
    const hist: string[] = getItem('acct_itemName_history', [])
    return Array.from(new Set([
      ...budgets.map(b => b.itemName).filter(Boolean),
      ...hist.filter(Boolean),
    ])).sort()
  }, [refresh])

  /* 嫄곕옒泥?由ъ뒪??(嫄곕옒泥섍?由??곕룞) */
  const vendorOptions = useMemo(() => {
    const vendors: { id: number; name: string }[] = getItem('acct_vendors', [])
    return vendors.map(v => ({ value: v.name, label: v.name }))
  }, [refresh])

  /* 嫄곕옒泥??쒕∼?ㅼ슫 ?몃? ?대┃ ?リ린 */
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
    if (!form.desc.trim()) { alert('?댁슜???낅젰?섏꽭??); return }
    const amt = parseInt(form.amount.replace(/,/g, '')) || 0
    if (amt <= 0) { alert('湲덉븸???낅젰?섏꽭??); return }

    const cfId = uid()
    const vId = uid()

    // ?꾪몴 ?먮룞 ?앹꽦
    const vouchers = getItem<Voucher[]>('acct_vouchers', [])
    let vEntries: { side: string; accountCode: string; amount: number }[]
    if (type === 'income') {
      const debitAcct = form.method === '?꾧툑' ? '1010' : '1020'
      vEntries = [
        { side: 'debit', accountCode: debitAcct, amount: amt },
        { side: 'credit', accountCode: '4030', amount: amt },
      ]
    } else {
      vEntries = [
        { side: 'debit', accountCode: '5110', amount: amt },
        { side: 'credit', accountCode: form.method === '?꾧툑' ? '1010' : '1020', amount: amt },
      ]
    }
    vouchers.push({
      id: vId, date: form.tradeDate, type: type === 'withdrawal' ? 'expense' : type,
      description: form.desc, entries: vEntries,
      createdAt: new Date().toISOString(),
    })
    setItem('acct_vouchers', vouchers)

    // 罹먯떆?뚮줈 ?깅줉
    const cfs = getItem<CashFlow[]>('acct_cashflows', [])
    cfs.push({
      id: cfId, date: form.tradeDate, type: type === 'withdrawal' ? 'expense' : type,
      amount: amt, description: form.desc, accountCode: type === 'income' ? '4030' : '5110',
      counter: form.counter, writeDate: form.writeDate,
    })
    setItem('acct_cashflows', cfs)

    setForm({ desc: '', amount: '', counter: '', method: type === 'income' ? '怨꾩쥖?댁껜' : '怨꾩쥖?댁껜', writeDate: today, tradeDate: today })
    setCounterSearch('')
    setRefresh(r => r + 1)
  }

  const deleteEntry = (id: string | number) => {
    if (!confirm('??젣?섏떆寃좎뒿?덇퉴?')) return
    const cfs = getItem<CashFlow[]>('acct_cashflows', []).filter(c => String(c.id) !== String(id))
    setItem('acct_cashflows', cfs)
    setRefresh(r => r + 1)
  }

  const methods = useMemo(() => {
    const stored: string[] = getItem('acct_payment_methods', ['怨꾩쥖?댁껜', '?꾧툑', '移대뱶', '踰뺤씤移대뱶', '湲고?'])
    return stored.length > 0 ? stored : ['怨꾩쥖?댁껜', '?꾧툑', '移대뱶', '踰뺤씤移대뱶', '湲고?']
  }, [refresh])

  return (
    <div className="space-y-4">
      {/* ?? ?깅줉 ???? */}
      <div className={`bg-gradient-to-r ${typeGrads[type]} rounded-2xl p-4 text-white`}>
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-xl">{typeEmojis[type]}</div>
          <div>
            <div className="text-[17px] font-extrabold">媛꾪렪 {typeLabels[type]}</div>
            <div className="text-[11.5px] opacity-85">{type === 'income' ? '?낃툑' : '吏異?} ?댁뿭???낅젰?섏꽭??/div>
          </div>
        </div>
      </div>

      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">
              {type === 'income' ? '?낃툑 ?댁슜' : '吏異쒕궡???덉궛紐⑸줉)'} *
            </label>
            {type !== 'income' && budgetItemNames.length > 0 ? (
              <div className="relative">
                {descMode === 'select' ? (
                  <>
                    <CustomSelect
                      value={form.desc}
                      onChange={v => {
                        if (v === '__direct__') {
                          setDescMode('input')
                          setForm(f => ({ ...f, desc: '' }))
                        } else {
                          setForm(f => ({ ...f, desc: v }))
                        }
                      }}
                      placeholder="???덉궛紐??좏깮 ??
                      options={[
                        { value: '', label: '???덉궛紐??좏깮 ?? },
                        ...budgetItemNames.map(name => ({ value: name, label: name })),
                        { value: '__direct__', label: '?륅툘 吏곸젒 ?낅젰' },
                      ]}
                    />
                  </>
                ) : (
                  <div className="flex gap-1.5">
                    <input
                      value={form.desc}
                      onChange={e => setForm(f => ({ ...f, desc: e.target.value }))}
                      placeholder="吏異??댁슜??吏곸젒 ?낅젰"
                      className="flex-1 px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => { setDescMode('select'); setForm(f => ({ ...f, desc: '' })) }}
                      className="px-2.5 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-[10.5px] font-bold text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer whitespace-nowrap"
                    >
                      紐⑸줉
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <input value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} placeholder="?? 4??留ㅼ텧" className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none" />
            )}
          </div>
          <div>
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">湲덉븸 (?? *</label>
            <input value={form.amount} onChange={e => handleAmtInput(e.target.value)} placeholder="0" className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm font-bold text-right focus:border-primary-500 outline-none" style={{ color: typeColors[type] }} />
          </div>
          <div ref={counterRef} className="relative">
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">嫄곕옒泥?/label>
            <input
              value={counterSearch || form.counter}
              onChange={e => { setCounterSearch(e.target.value); setShowCounterList(true); setForm(f => ({ ...f, counter: '' })) }}
              onFocus={() => setShowCounterList(true)}
              placeholder="嫄곕옒泥섎챸 寃??.."
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none"
            />
            {showCounterList && (
              <div className="absolute z-50 left-0 right-0 top-full mt-1 max-h-[200px] overflow-y-auto rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-lg">
                {vendorOptions
                  .filter(v => !counterSearch || v.label.toLowerCase().includes(counterSearch.toLowerCase()))
                  .map((v, i) => (
                    <button key={i} onClick={() => { setForm(f => ({ ...f, counter: v.value })); setCounterSearch(''); setShowCounterList(false) }}
                      className="w-full text-left px-3 py-2 text-[13px] text-[var(--text-primary)] hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer border-none bg-transparent">
                      {v.label}
                    </button>
                  ))}
                {vendorOptions.filter(v => !counterSearch || v.label.toLowerCase().includes(counterSearch.toLowerCase())).length === 0 && (
                  <div className="px-3 py-2 text-[12px] text-[var(--text-muted)]">寃??寃곌낵媛 ?놁뒿?덈떎</div>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">{type === 'income' ? '?낃툑' : '吏異?}?섎떒</label>
            <CustomSelect
              value={form.method}
              onChange={v => setForm(f => ({ ...f, method: v }))}
              options={methods.map(m => ({ value: m, label: m }))}
            />
          </div>
          {type !== 'expense' && (
          <div>
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">?꾪몴?묒꽦?쇱옄</label>
            <DatePicker value={form.writeDate} onChange={v => setForm(f => ({ ...f, writeDate: v }))} />
          </div>
          )}
          <div>
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">?ㅼ젣嫄곕옒?쇱옄</label>
            <DatePicker value={form.tradeDate} onChange={v => setForm(f => ({ ...f, tradeDate: v }))} />
          </div>
        </div>
        <div className="flex justify-end">
          <button onClick={saveEntry} className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white text-sm font-bold cursor-pointer shadow-md bg-gradient-to-r ${typeGrads[type]}`}>
            <Save size={14} /> {type === 'income' ? '?낃툑' : '吏異?} ?깅줉
          </button>
        </div>
      </div>

      {/* ?? ?댁뿭 由ъ뒪???? */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-2">
            <ScrollText size={14} className="text-primary-500" />
            <span className="text-sm font-extrabold text-[var(--text-primary)]">{type === 'income' ? '?낃툑' : '吏異?} ?댁뿭</span>
            <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-muted)] px-2 py-0.5 rounded-full">{cashflows.length}嫄?/span>
          </div>
          <span className="text-[13px] font-extrabold" style={{ color: typeColors[type] }}>{formatNumber(totalAmount)}??/span>
        </div>
        {cashflows.length === 0 ? (
          <div className="p-6"><EmptyState emoji={typeEmojis[type]} title={`?깅줉??${type === 'income' ? '?낃툑' : '吏異?}???놁뒿?덈떎`} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="bg-[var(--bg-muted)]">
                  {['?좎쭨', '?댁슜', '湲덉븸', '??젣'].map(h => (
                    <th key={h} className={cn('py-2.5 px-3.5 text-[11px] font-bold text-[var(--text-muted)]', h === '湲덉븸' ? 'text-right' : h === '??젣' ? 'text-center w-[60px]' : 'text-left')}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cashflows.map(c => (
                  <tr key={c.id} className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-muted)] transition-colors">
                    <td className="py-2.5 px-3.5 text-[12px] text-[var(--text-secondary)]">{c.date || ''}</td>
                    <td className="py-2.5 px-3.5 text-[12px] font-bold text-[var(--text-primary)]">{c.description || '-'}</td>
                    <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-right" style={{ color: typeColors[type] }}>{formatNumber(c.amount || 0)}??/td>
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
    </div>
  )
}

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
   ?꾪몴?λ? (Payment Ledger) ??CRUD
   ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??*/
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
    if (!vmDesc.trim()) { alert('?곸슂瑜??낅젰?섏꽭??); return }
    const entries = vmEntries
      .map(e => ({ side: e.side, accountCode: e.accountCode, amount: parseInt(e.amount.replace(/,/g, '')) || 0 }))
      .filter(e => e.accountCode && e.amount > 0)
    if (entries.length < 2) { alert('李⑤?/?蹂 ??ぉ??理쒖냼 2媛??낅젰?섏꽭??); return }

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
    if (!confirm('???꾪몴瑜???젣?섏떆寃좎뒿?덇퉴?')) return
    const all = getItem<Voucher[]>('acct_vouchers', []).filter(v => String(v.id) !== String(id))
    setItem('acct_vouchers', all)
    setRefresh(r => r + 1)
  }

  const typeColors: Record<string, string> = { income: '#22c55e', expense: '#ef4444', transfer: '#f59e0b' }
  const typeLabels: Record<string, string> = { income: '?낃툑', expense: '異쒓툑', transfer: '?泥? }
  const typeBgs: Record<string, string> = { income: 'rgba(34,197,94,.1)', expense: 'rgba(239,68,68,.1)', transfer: 'rgba(245,158,11,.1)' }

  return (
    <div className="space-y-4">
      {/* ?붿빟 */}
      <div className="bg-gradient-to-r from-[#6366f1] to-[#4f6ef7] rounded-2xl p-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <BookOpen size={18} />
            </div>
            <div>
              <div className="text-[17px] font-extrabold">?꾪몴?λ?</div>
              <div className="text-[11.5px] opacity-85">紐⑤뱺 ?꾪몴 議고쉶쨌?섏젙 (?뚭퀎?대떦?먯슜)</div>
            </div>
          </div>
          <button onClick={() => openModal()} className="flex items-center gap-1.5 px-3.5 py-2 bg-white/20 border border-white/40 rounded-xl text-[13px] font-bold cursor-pointer hover:bg-white/30 transition-colors">
            <Plus size={14} /> ?깅줉
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: '珥??꾪몴', value: vouchers.length, bg: 'rgba(255,255,255,.18)' },
            { label: '?낃툑', value: incCnt, bg: 'rgba(34,197,94,.2)' },
            { label: '異쒓툑', value: expCnt, bg: 'rgba(239,68,68,.2)' },
            { label: '?泥?, value: etcCnt, bg: 'rgba(245,158,11,.2)' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-2 text-center" style={{ background: s.bg }}>
              <div className="text-[9px] opacity-80">{s.label}</div>
              <div className="text-[16px] font-extrabold">{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ?꾪몴 紐⑸줉 */}
      {vouchers.length === 0 ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-8">
          <EmptyState emoji="?뱬" title="?깅줉???꾪몴媛 ?놁뒿?덈떎" />
        </div>
      ) : (
        <div className="space-y-2.5">
          {vouchers.map(v => {
            let ds = 0, cs = 0
            ;(v.entries || []).forEach(e => { if (e.side === 'debit') ds += e.amount; else cs += e.amount })
            const tc = typeColors[v.type || ''] || '#8b5cf6'
            const tl = typeLabels[v.type || ''] || '?泥?
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
                            {e.side === 'debit' ? '李⑤?' : '?蹂'}
                          </span>
                          <span className="text-[12px] text-[var(--text-secondary)]">{e.accountCode}</span>
                        </div>
                        <span className="text-[12px] font-bold" style={{ color: e.side === 'debit' ? '#4f6ef7' : '#ef4444' }}>{formatNumber(e.amount)}??/span>
                      </div>
                    ))}
                    <div className="border-t border-[var(--border-default)] pt-1.5 flex justify-between">
                      <span className="text-[11px] font-bold text-[var(--text-muted)]">?⑷퀎</span>
                      <span className="text-[13px] font-extrabold" style={{ color: tc }}>{formatNumber(ds)}??/span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ?꾪몴 ?깅줉/?섏젙 紐⑤떖 */}
      {modalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center bg-black/40" onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="bg-[var(--bg-surface)] rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-[600px] mx-0 md:mx-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-default)]">
              <span className="text-sm font-extrabold text-[var(--text-primary)]">{editId ? '?꾪몴 ?섏젙' : '?꾪몴 ?깅줉'}</span>
              <button onClick={() => setModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">?좎쭨 *</label>
                <DatePicker value={vmDate} onChange={setVmDate} />
              </div>
              <div>
                <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">?좏삎</label>
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
                <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">?곸슂 *</label>
                <input value={vmDesc} onChange={e => setVmDesc(e.target.value)} placeholder="嫄곕옒 ?댁슜" className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none" />
              </div>
              <div>
                <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-2 block">李⑤? / ?蹂 ??ぉ</label>
                <div className="space-y-2">
                  {vmEntries.map((entry, idx) => (
                    <div key={idx} className="bg-[var(--bg-muted)] rounded-xl p-3 space-y-2 relative">
                      {idx >= 2 && (
                        <button onClick={() => removeEntry(idx)} className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded bg-[rgba(239,68,68,.1)] text-[#ef4444] cursor-pointer text-[10px]"><X size={10} /></button>
                      )}
                      <div className="flex gap-2">
                        <select value={entry.side} onChange={e => { const v = e.target.value; setVmEntries(prev => prev.map((en, i) => i === idx ? { ...en, side: v } : en)) }} className="w-[80px] px-2 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[12px] font-bold outline-none" style={{ color: entry.side === 'debit' ? '#4f6ef7' : '#ef4444' }}>
                          <option value="debit">李⑤?</option>
                          <option value="credit">?蹂</option>
                        </select>
                        <select value={entry.accountCode} onChange={e => { const v = e.target.value; setVmEntries(prev => prev.map((en, i) => i === idx ? { ...en, accountCode: v } : en)) }} className="flex-1 px-2 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[12px] outline-none">
                          <option value="">怨꾩젙怨쇰ぉ ?좏깮</option>
                          {accounts.map(a => <option key={a.code} value={a.code}>{a.code} {a.name}</option>)}
                        </select>
                      </div>
                      <input value={entry.amount} onChange={e => { const digits = e.target.value.replace(/[^\d]/g, ''); const formatted = digits ? Number(digits).toLocaleString('ko-KR') : ''; setVmEntries(prev => prev.map((en, i) => i === idx ? { ...en, amount: formatted } : en)) }} placeholder="湲덉븸" className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm font-bold text-right outline-none" />
                    </div>
                  ))}
                </div>
                <button onClick={addEntry} className="w-full mt-2 py-2.5 rounded-xl border border-dashed border-[var(--border-default)] text-[13px] font-semibold text-[var(--text-muted)] cursor-pointer hover:border-primary-400 hover:text-primary-500 transition-colors flex items-center justify-center gap-1.5">
                  <Plus size={14} /> ??ぉ 異붽?
                </button>
              </div>
            </div>
            <div className="flex gap-2 px-5 py-3 border-t border-[var(--border-default)]">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-[var(--border-default)] text-sm font-semibold text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--bg-muted)]">痍⑥냼</button>
              <button onClick={saveVoucher} className="flex-[2] py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f6ef7] text-white text-sm font-bold cursor-pointer shadow-md">???/button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  )
}

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
   ?쒕툕 ?섏씠吏 ?뚮젅?댁뒪???
   ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??*/
function AcctSubPlaceholder({ pageKey, label }: { pageKey: string; label: string }) {
  const descriptions: Record<string, string> = {
    budget: '?덉궛援щ텇蹂??곌컙 ?덉궛???ㅼ젙?섍퀬 ?뚯쭊 ?꾪솴???뺤씤?⑸땲??,
    balance: '?뚭퀎?곕룄 珥덇린 ?붿븸???ㅼ젙?⑸땲??,
    approval: '?덉쓽?쒕? ?묒꽦?섍퀬 寃곗옱 ?곹깭瑜?愿由ы빀?덈떎',
    expense: '吏異??꾪몴瑜??깅줉?섍퀬 愿由ы빀?덈떎',
    income: '?낃툑 ?꾪몴瑜??깅줉?섍퀬 愿由ы빀?덈떎',
    withdrawal: '異쒓툑 ?꾪몴瑜??깅줉?섍퀬 愿由ы빀?덈떎',
    payment: '?꾩껜 ?꾪몴 ?λ?瑜?議고쉶?⑸땲??,
    reports: '?섏엯쨌吏異??꾪솴??遺꾩꽍?⑸땲??,
  }

  const emojis: Record<string, string> = {
    budget: '?뮥', balance: '?룱', approval: '?뱥', expense: '?뮯',
    income: '?뮫', withdrawal: '?룲', payment: '?뱬', reports: '?뱤',
  }

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl py-16 text-center">
      <p className="text-4xl mb-3">{emojis[pageKey] || '?뵩'}</p>
      <p className="text-base font-bold text-[var(--text-primary)]">{label}</p>
      <p className="text-[12px] text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
        {descriptions[pageKey] || '??湲곕뒫? 以鍮?以묒엯?덈떎.'}
      </p>
      <p className="text-[11px] text-[var(--text-muted)] mt-4 bg-[var(--bg-muted)] inline-block px-4 py-1.5 rounded-full">
        Phase 4?먯꽌 援ы쁽 ?덉젙
      </p>
    </div>
  )
}

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
   嫄곕옒泥섍?由???CRUD
   ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??*/
interface Vendor {
  id: number
  /* 湲곕낯?뺣낫 */
  name: string
  zipCode?: string
  address1?: string      // ?ㅼ쓬 API 二쇱냼
  address2?: string      // ?곸꽭二쇱냼
  phone?: string
  /* ?곕씫泥섏젙蹂?*/
  ceoName?: string
  ceoPhone?: string
  managerName?: string
  managerPhone?: string
  /* ?ъ뾽?먯젙蹂?*/
  bizNo?: string
  bizType?: string       // ?낇깭
  bizCategory?: string   // ?낆쥌
  invoiceEmail?: string  // 怨꾩궛?쒖씠硫붿씪
  bizRegImage?: string   // ?ъ뾽?먮벑濡앹쬆 base64
  /* 鍮꾧퀬 */
  memo?: string
  /* ?섏쐞 ?명솚 */
  address?: string
}

const EMPTY_VENDOR: Omit<Vendor, 'id'> = {
  name: '', zipCode: '', address1: '', address2: '', phone: '',
  ceoName: '', ceoPhone: '', managerName: '', managerPhone: '',
  bizNo: '', bizType: '', bizCategory: '', invoiceEmail: '', bizRegImage: '',
  memo: '',
}

/* ?뱀뀡 ?ㅻ뜑 */
function SectionHeader({ icon, title, color }: { icon: string; title: string; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-1">
      <span className="text-sm">{icon}</span>
      <span className="text-[12px] font-extrabold tracking-tight" style={{ color }}>{title}</span>
      <div className="flex-1 h-px bg-[var(--border-default)]" />
    </div>
  )
}

/* ?꾨뱶 */
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

/* ?먮룞 ?섏씠???щ㎎??*/
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
  const [menuOpen, setMenuOpen] = useState<number | null>(null)

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
    setMenuOpen(null)
  }

  const openView = (v: Vendor) => {
    setViewVendor(v)
    setViewOpen(true)
  }

  const saveVendor = () => {
    if (!form.name.trim()) { alert('嫄곕옒泥섎챸???낅젰?섏꽭??); return }
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
    if (!confirm('??嫄곕옒泥섎? ??젣?섏떆寃좎뒿?덇퉴?')) return
    const all = getItem<Vendor[]>('acct_vendors', []).filter(v => v.id !== id)
    setItem('acct_vendors', all)
    setRefresh(r => r + 1)
    setMenuOpen(null)
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* ?? 寃??+ 異붽? 踰꾪듉 ?? */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="嫄곕옒泥섎챸, ?ъ뾽?먮쾲?? ??쒖옄, ?대떦??寃??.."
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-[12px] text-[var(--text-primary)] outline-none focus:border-primary-500 transition-colors"
          />
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f6ef7] text-white text-[12px] font-bold cursor-pointer shadow-lg hover:shadow-xl transition-all shrink-0">
          <Plus size={14} /> 嫄곕옒泥??깅줉
        </button>
      </div>

      {/* ?? 嫄곕옒泥??뚯씠釉?由ъ뒪???? */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="bg-[var(--bg-muted)] border-b border-[var(--border-default)]">
                {['No', '嫄곕옒泥섎챸', '??쒖옄', '?곕씫泥?, '愿由?].map((h, i) => (
                  <th key={i} className={`py-3 px-3 text-[10px] font-bold text-[var(--text-muted)] ${i === 4 ? 'text-center' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vendors.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-[12px] text-[var(--text-muted)]">
                  <ContactRound size={32} className="mx-auto mb-2 opacity-30" />
                  ?깅줉??嫄곕옒泥섍? ?놁뒿?덈떎
                </td></tr>
              ) : vendors.map((v, idx) => (
                <tr key={v.id} className="border-t border-[var(--border-default)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer" onClick={() => openView(v)}>
                  <td className="py-3 px-3 text-[11px] text-[var(--text-muted)] tabular-nums">{idx + 1}</td>
                  <td className="py-3 px-3">
                    <div className="text-[12px] font-bold text-[var(--text-primary)]">{v.name || '(誘몄엯??'}</div>
                    <div className="text-[9px] text-[var(--text-muted)]">{v.bizNo || '-'}</div>
                  </td>
                  <td className="py-3 px-3 text-[11px] text-[var(--text-secondary)]">{v.ceoName || '-'}</td>
                  <td className="py-3 px-3">
                    <div className="text-[10px] text-[var(--text-secondary)]">{v.phone || v.ceoPhone || '-'}</div>
                    <div className="text-[9px] text-[var(--text-muted)]">{v.managerName ? `?대떦: ${v.managerName}` : ''}</div>
                  </td>
                  <td className="py-3 px-3 text-center relative" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setMenuOpen(menuOpen === v.id ? null : v.id)} className="p-1.5 rounded-lg hover:bg-[var(--bg-muted)] cursor-pointer transition-colors">
                      <MoreVertical size={14} className="text-[var(--text-muted)]" />
                    </button>
                    {menuOpen === v.id && (
                      <div className="absolute right-3 top-full z-50 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-xl py-1 min-w-[100px] animate-scaleIn">
                        <button onClick={() => openEdit(v)} className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] cursor-pointer transition-colors">
                          <Edit3 size={12} /> ?섏젙
                        </button>
                        <button onClick={() => deleteVendor(v.id)} className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 cursor-pointer transition-colors">
                          <Trash2 size={12} /> ??젣
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 border-t border-[var(--border-default)] bg-[var(--bg-muted)] flex items-center justify-between">
          <span className="text-[10px] text-[var(--text-muted)]">珥?{vendors.length}嫄?/span>
        </div>
      </div>

      {/* ?먥븧???깅줉/?섏젙 ??섏씠吏 紐⑤떖 ?먥븧??*/}
      {modalOpen && createPortal(
        <div className="fixed inset-0 z-[9998] flex items-start justify-center bg-[var(--bg-muted)] overflow-y-auto py-8">
          <div className="bg-[var(--bg-default)] rounded-2xl shadow-2xl w-full max-w-5xl mx-4 animate-scaleIn">
            {/* 紐⑤떖 ?ㅻ뜑 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)] bg-[var(--bg-surface)] rounded-t-2xl">
              <div className="flex items-center gap-2">
                <ContactRound size={18} className="text-primary-500" />
                <span className="text-base font-extrabold text-[var(--text-primary)]">{editId ? '嫄곕옒泥??섏젙' : '?좉퇋 嫄곕옒泥??깅줉'}</span>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer"><X size={20} /></button>
            </div>

            {/* 紐⑤떖 諛붾뵒 */}
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* 醫뚯륫 硫붿씤 */}
                <div className="flex-1 space-y-4 min-w-0">
                  {/* 湲곕낯?뺣낫 移대뱶 */}
                  <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-default)]">
                      <Building2 size={14} className="text-primary-500" />
                      <span className="text-[12px] font-extrabold text-[var(--text-primary)]">湲곕낯 ?뺣낫</span>
                    </div>
                    <div className="p-4 space-y-2.5">
                      <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-[10px] font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1"><Building2 size={9}/> 嫄곕옒泥섎챸</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="(二?嫄곕옒泥섎챸" className={inputCls} /></div>
                        <div><label className="text-[10px] font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1"><User size={9}/> ??쒖옄</label><input value={form.ceoName} onChange={e => setForm(f => ({ ...f, ceoName: e.target.value }))} placeholder="??쒖옄 ?대쫫" className={inputCls} /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-[10px] font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1"><Phone size={9}/> ??쒖쟾??/label><input value={form.ceoPhone} onChange={e => setForm(f => ({ ...f, ceoPhone: fmtPhone(e.target.value) }))} placeholder="02-0000-0000" className={inputCls} maxLength={13} /></div>
                        <div><label className="text-[10px] font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1"><IdCard size={9}/> ?ъ뾽?먮쾲??/label><input value={form.bizNo} onChange={e => setForm(f => ({ ...f, bizNo: fmtBizNo(e.target.value) }))} placeholder="000-00-00000" className={inputCls} maxLength={12} /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-[10px] font-bold text-[var(--text-muted)] mb-1 block">?낇깭</label><input value={form.bizType} onChange={e => setForm(f => ({ ...f, bizType: e.target.value }))} placeholder="?쒕퉬?? className={inputCls} /></div>
                        <div><label className="text-[10px] font-bold text-[var(--text-muted)] mb-1 block">醫낅ぉ</label><input value={form.bizCategory} onChange={e => setForm(f => ({ ...f, bizCategory: e.target.value }))} placeholder="?뚰봽?몄썾?? className={inputCls} /></div>
                      </div>
                      <div><label className="text-[10px] font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1"><Mail size={9}/> ?멸툑怨꾩궛???대찓??/label><input value={form.invoiceEmail} onChange={e => setForm(f => ({ ...f, invoiceEmail: e.target.value }))} placeholder="tax@company.com" className={inputCls} /></div>
                      <div><label className="text-[10px] font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1"><Phone size={9}/> ?꾪솕踰덊샇</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: fmtPhone(e.target.value) }))} placeholder="02-0000-0000" className={inputCls} maxLength={13} /></div>
                      <div>
                        <label className="text-[10px] font-bold text-[var(--text-muted)] mb-1 block">?ъ뾽?μ＜??/label>
                        <div className="flex gap-2 mb-1.5">
                          <input value={form.zipCode} readOnly placeholder="?고렪踰덊샇" className={`${inputCls} flex-1 bg-[var(--bg-muted)] cursor-default`} />
                          <button type="button" onClick={() => {
                            const daumPostcode = (window as any).daum?.Postcode
                            if (!daumPostcode) { alert('?고렪踰덊샇 寃???쒕퉬?ㅻ? 遺덈윭?ㅻ뒗 以묒엯?덈떎...'); return }
                            new daumPostcode({ oncomplete: (data: any) => { setForm(f => ({ ...f, zipCode: data.zonecode, address1: data.roadAddress || data.jibunAddress })) } }).open()
                          }} className="px-2.5 py-1.5 rounded-lg bg-primary-500 text-white text-[10px] font-bold cursor-pointer shrink-0 hover:bg-primary-600 transition-colors">?뵇 寃??/button>
                        </div>
                        <input value={form.address1} readOnly placeholder="二쇱냼" className={`${inputCls} bg-[var(--bg-muted)] cursor-default mb-1.5`} />
                        <input value={form.address2} onChange={e => setForm(f => ({ ...f, address2: e.target.value }))} placeholder="?곸꽭二쇱냼" className={inputCls} />
                      </div>
                    </div>
                  </div>

                  {/* ?대떦???뺣낫 移대뱶 */}
                  <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-default)]">
                      <User size={14} className="text-blue-500" />
                      <span className="text-[12px] font-extrabold text-[var(--text-primary)]">?대떦???뺣낫</span>
                    </div>
                    <div className="p-4 space-y-2.5">
                      <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-[10px] font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1"><User size={9}/> ?대떦?먮챸</label><input value={form.managerName} onChange={e => setForm(f => ({ ...f, managerName: e.target.value }))} placeholder="?대떦???대쫫" className={inputCls} /></div>
                        <div><label className="text-[10px] font-bold text-[var(--text-muted)] flex items-center gap-1 mb-1"><Phone size={9}/> ?곕씫泥?/label><input value={form.managerPhone} onChange={e => setForm(f => ({ ...f, managerPhone: fmtPhone(e.target.value) }))} placeholder="010-0000-0000" className={inputCls} maxLength={13} /></div>
                      </div>
                    </div>
                  </div>

                  {/* 鍮꾧퀬 移대뱶 */}
                  <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-default)]">
                      <FileText size={14} className="text-violet-500" />
                      <span className="text-[12px] font-extrabold text-[var(--text-primary)]">鍮꾧퀬</span>
                    </div>
                    <div className="p-4">
                      <textarea value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))} placeholder="湲고? 李멸퀬 ?ы빆???낅젰?섏꽭??.." rows={4} className={`${inputCls} resize-none !h-auto`} />
                    </div>
                  </div>
                </div>

                {/* ?곗륫 ?ъ씠?쒕컮 */}
                <div className="w-full lg:w-56 space-y-4 shrink-0">
                  {/* ?ъ뾽?먮벑濡앹쬆 */}
                  <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-default)]">
                      <FileText size={14} className="text-violet-500" />
                      <span className="text-[12px] font-extrabold text-[var(--text-primary)]">?ъ뾽?먮벑濡앹쬆</span>
                    </div>
                    <div className="p-3 flex flex-col items-center gap-2">
                      <div className="w-full aspect-[3/4] rounded-xl border-2 border-dashed border-[var(--border-default)] bg-[var(--bg-muted)] flex items-center justify-center overflow-hidden">
                        {form.bizRegImage ? <img src={form.bizRegImage} alt="" className="w-full h-full object-contain" /> : (
                          <div className="text-center"><FileText size={28} className="text-[var(--text-muted)] mx-auto mb-1" /><div className="text-[9px] text-[var(--text-muted)]">?깅줉???ъ뾽?먮벑濡앹쬆???놁뒿?덈떎</div></div>
                        )}
                      </div>
                      <label className="w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border border-dashed border-[var(--border-default)] bg-[var(--bg-muted)] text-[10px] font-bold text-[var(--text-secondary)] cursor-pointer hover:border-primary-400 transition-colors">
                        <Upload size={10}/> ?낅줈??
                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          if (file.size > 5 * 1024 * 1024) { alert('5MB ?댄븯留?媛?ν빀?덈떎'); return }
                          const reader = new FileReader()
                          reader.onload = () => setForm(f => ({ ...f, bizRegImage: reader.result as string }))
                          reader.readAsDataURL(file)
                        }} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 紐⑤떖 ?명꽣 */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-[var(--border-default)] bg-[var(--bg-surface)] rounded-b-2xl">
              <button onClick={() => setModalOpen(false)} className="px-6 py-2.5 rounded-xl border border-[var(--border-default)] text-[12px] font-semibold text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--bg-muted)] transition-colors">痍⑥냼</button>
              <button onClick={saveVendor} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f6ef7] text-white text-[12px] font-bold cursor-pointer shadow-lg hover:shadow-xl transition-all">
                <Save size={14} /> {editId ? '?섏젙' : '?깅줉'}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* ?먥븧??議고쉶 ??섏씠吏 紐⑤떖 ?먥븧??*/}
      {viewOpen && viewVendor && createPortal(
        <div className="fixed inset-0 z-[9998] flex items-start justify-center bg-[var(--bg-muted)] overflow-y-auto py-8">
          <div className="bg-[var(--bg-default)] rounded-2xl shadow-2xl w-full max-w-5xl mx-4 animate-scaleIn">
            {/* 紐⑤떖 ?ㅻ뜑 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)] bg-[var(--bg-surface)] rounded-t-2xl">
              <div className="flex items-center gap-2">
                <ContactRound size={18} className="text-primary-500" />
                <span className="text-base font-extrabold text-[var(--text-primary)]">{viewVendor.name || '嫄곕옒泥??곸꽭'}</span>
              </div>
              <button onClick={() => setViewOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer"><X size={20} /></button>
            </div>

            {/* 紐⑤떖 諛붾뵒 */}
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* 醫뚯륫 硫붿씤 */}
                <div className="flex-1 space-y-4 min-w-0">
                  {/* 湲곕낯?뺣낫 */}
                  <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-default)]">
                      <Building2 size={14} className="text-primary-500" />
                      <span className="text-[12px] font-extrabold text-[var(--text-primary)]">湲곕낯 ?뺣낫</span>
                    </div>
                    <div className="p-4 space-y-1.5">
                      {[
                        { label: '嫄곕옒泥섎챸', value: viewVendor.name },
                        { label: '?ъ뾽?먮쾲??, value: viewVendor.bizNo },
                        { label: '??쒖옄', value: viewVendor.ceoName },
                        { label: '??쒖쟾??, value: viewVendor.ceoPhone },
                        { label: '?꾪솕踰덊샇', value: viewVendor.phone },
                        { label: '?낇깭', value: viewVendor.bizType },
                        { label: '醫낅ぉ', value: viewVendor.bizCategory },
                        { label: '?대찓??, value: viewVendor.invoiceEmail },
                        { label: '?고렪踰덊샇', value: viewVendor.zipCode },
                        { label: '二쇱냼', value: [viewVendor.address1 || viewVendor.address, viewVendor.address2].filter(Boolean).join(' ') },
                      ].map((row, i) => (
                        <div key={i} className="flex items-start gap-2 py-1.5">
                          <span className="text-[10px] font-bold text-[var(--text-muted)] w-20 shrink-0">{row.label}</span>
                          <span className="text-[12px] text-[var(--text-primary)] flex-1">{row.value || '-'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ?대떦???뺣낫 */}
                  <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-default)]">
                      <User size={14} className="text-blue-500" />
                      <span className="text-[12px] font-extrabold text-[var(--text-primary)]">?대떦???뺣낫</span>
                    </div>
                    <div className="p-4 space-y-1.5">
                      {[
                        { label: '?대떦?먮챸', value: viewVendor.managerName },
                        { label: '?곕씫泥?, value: viewVendor.managerPhone },
                      ].map((row, i) => (
                        <div key={i} className="flex items-start gap-2 py-1.5">
                          <span className="text-[10px] font-bold text-[var(--text-muted)] w-20 shrink-0">{row.label}</span>
                          <span className="text-[12px] text-[var(--text-primary)] flex-1">{row.value || '-'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 鍮꾧퀬 */}
                  <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-default)]">
                      <FileText size={14} className="text-violet-500" />
                      <span className="text-[12px] font-extrabold text-[var(--text-primary)]">鍮꾧퀬</span>
                    </div>
                    <div className="p-4">
                      <p className="text-[12px] text-[var(--text-primary)] whitespace-pre-wrap">{viewVendor.memo || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* ?곗륫 ?ъ씠?쒕컮 */}
                <div className="w-full lg:w-56 space-y-4 shrink-0">
                  {/* ?ъ뾽?먮벑濡앹쬆 */}
                  <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-default)]">
                      <FileText size={14} className="text-violet-500" />
                      <span className="text-[12px] font-extrabold text-[var(--text-primary)]">?ъ뾽?먮벑濡앹쬆</span>
                    </div>
                    <div className="p-3 flex flex-col items-center gap-2">
                      <div className="w-full aspect-[3/4] rounded-xl border-2 border-dashed border-[var(--border-default)] bg-[var(--bg-muted)] flex items-center justify-center overflow-hidden">
                        {viewVendor.bizRegImage ? (
                          viewVendor.bizRegImage.startsWith('data:image') ? (
                            <img src={viewVendor.bizRegImage} alt="?ъ뾽?먮벑濡앹쬆" className="w-full h-full object-contain cursor-pointer" onClick={() => window.open(viewVendor.bizRegImage, '_blank')} />
                          ) : (
                            <a href={viewVendor.bizRegImage} target="_blank" rel="noopener" className="text-sm text-primary-500 font-semibold hover:underline">?뱞 PDF 蹂닿린</a>
                          )
                        ) : (
                          <div className="text-center"><FileText size={28} className="text-[var(--text-muted)] mx-auto mb-1" /><div className="text-[9px] text-[var(--text-muted)]">?깅줉???ъ뾽?먮벑濡앹쬆???놁뒿?덈떎</div></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 紐⑤떖 ?명꽣 */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-[var(--border-default)] bg-[var(--bg-surface)] rounded-b-2xl">
              <button onClick={() => setViewOpen(false)} className="px-6 py-2.5 rounded-xl border border-[var(--border-default)] text-[12px] font-semibold text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--bg-muted)] transition-colors">?リ린</button>
              <button onClick={() => { setViewOpen(false); openEdit(viewVendor) }} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f6ef7] text-white text-[12px] font-bold cursor-pointer shadow-lg hover:shadow-xl transition-all">
                <Edit3 size={14} /> ?섏젙
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}

