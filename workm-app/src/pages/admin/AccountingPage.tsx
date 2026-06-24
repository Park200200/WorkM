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

/* ??? ?쒕쾭 ?ㅼ젙 ?숆린???? */
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

/** 濡쒖뺄 ?쒓컙 湲곗? YYYY-MM-DD (UTC媛 ?꾨땶 KST 湲곗?) */
function getLocalDate(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function getLocalISOString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`
}

export async function loadSettingsFromServer() {
  try {
    const base = import.meta.env.BASE_URL || '/'
    const res = await fetch(`${base}data/settings.json?t=${Date.now()}`)
    if (!res.ok) return false
    const data = await res.json()
    if (!data || typeof data !== 'object') return false
    let loaded = 0
    for (const key of Object.keys(data)) {
      // ?대? 濡쒖뺄???덉쑝硫???뼱?곗? ?딆쓬 (濡쒖뺄 ?곗꽑)
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

/* ??? ?뚭퀎 ?쒕뱶 ?곗씠??珥덇린???? */
export function initAccountingSeed() {
  // 湲곗〈 ?곗씠??蹂댁〈: ?쒕뱶???곗씠?곌? ?놁쓣 ?뚮쭔 珥덇린??
  // (???댁긽 ?쒕뱶 踰꾩쟾 蹂寃???湲곗〈 ?곗씠?곕? ??젣?섏? ?딆쓬)
  /* ?? 湲곗〈 怨꾩젙??description???꾨씫??寃쎌슦 蹂댁땐 ?⑥튂 (early return ?댁쟾 ?ㅽ뻾) ?? */
  if (!localStorage.getItem('_acct_desc_patch_v1')) {
    const descMap: Record<string, string> = {
      '1-01-01': '吏?먃룸룞????利됱떆 ?ъ슜 媛?ν븳 ?듯솕',
      '1-01-02': '?섑몴 諛쒗뻾??媛?ν븳 ????덇툑',
      '1-01-03': '?섏떆 ?낆텧湲?媛?ν븳 ?쇰컲 ?덇툑',
      '1-01-04': '?쇱젙 湲곌컙 ?덉튂 ?뺤젙湲덈━ ?덇툑',
      '1-01-05': '?명솕濡?蹂댁쑀?섎뒗 ????덇툑',
      '1-01-06': '嫄곕옒泥섎줈遺??諛쏆? ?쎌냽?댁쓬쨌?섏뼱??,
      '1-01-07': '?몄긽 ?먮ℓ濡?諛쒖깮??留ㅼ텧梨꾧텒',
      '1-01-08': '?뚯닔 遺덈뒫 ?덉긽??李④컧 ?됯?怨꾩젙',
      '1-01-09': '1???대궡 ?뚯닔 ?덉젙 ??ш툑',
      '1-01-10': '?곸뾽 ??嫄곕옒?먯꽌 諛쒖깮??誘몄닔梨꾧텒',
      '1-01-11': '諛쒖깮?덉쑝??誘몄닔痍⑦븳 ?섏씡',
      '1-01-12': '?곹뭹쨌?먯옱猷?援ъ엯 ???좎?湲??湲?,
      '1-01-13': '誘몃옒 湲곌컙 鍮꾩슜??誘몃━ 吏湲됲븳 湲덉븸',
      '1-01-14': '留ㅼ엯 ??遺?댄븳 遺媛???섍툒 ??곸븸',
      '1-01-15': '?먮ℓ 紐⑹쟻?쇰줈 留ㅼ엯???꾩꽦 ?곹뭹',
      '1-01-16': '?먯궗 ?쒖“ ?꾩꽦 ?먮ℓ???쒗뭹',
      '1-01-17': '?쒗뭹 ?쒖“???ъ엯???먯옄??,
      '1-01-18': '?쒖“ 怨쇱젙 以묒씤 誘몄셿???쒗뭹',
      '1-01-19': '留뚭린 1???대궡 湲덉쑖?곹뭹(CD, MMF ??',
      '1-02-01': '?ъ뾽???좎?(媛먭??곴컖 ????꾨떂)',
      '1-02-02': '?щТ?ㅒ룰났?Β룹갹怨????ъ뾽??嫄댁텞臾?,
      '1-02-03': '嫄대Ъ???꾩쟻 媛먭??곴컖??李④컧怨꾩젙)',
      '1-02-04': '?꾨줈쨌援먮웾쨌?댁옣 ???좎? ?뺤갑 援ъ“臾?,
      '1-02-05': '援ъ텞臾쇱쓽 ?꾩쟻 媛먭??곴컖??李④컧怨꾩젙)',
      '1-02-06': '?앹궛쨌?쒖“???ъ슜?섎뒗 湲곌퀎 ?ㅻ퉬',
      '1-02-07': '湲곌퀎?μ튂???꾩쟻 媛먭??곴컖??李④컧怨꾩젙)',
      '1-02-08': '?낅Т???먮룞李㉱룻듃?????대컲 李⑤웾',
      '1-02-09': '李⑤웾?대컲援ъ쓽 ?꾩쟻 媛먭??곴컖??李④컧怨꾩젙)',
      '1-02-10': '?щТ??媛援?룹쟾?먭린湲????낅Т??鍮꾪뭹',
      '1-02-11': '鍮꾪뭹???꾩쟻 媛먭??곴컖??李④컧怨꾩젙)',
      '1-02-12': '?낅Т??SW ?쇱씠?좎뒪쨌媛쒕컻鍮?,
      '1-02-13': '?뚰봽?몄썾?댁쓽 ?꾩쟻 ?곴컖??李④컧怨꾩젙)',
      '1-02-14': '?ъ뾽 ?몄닔 ??珥덇낵 吏湲됲븳 ?꾨━誘몄뾼',
      '1-02-15': '1??珥덇낵 ?κ린 ??ш툑',
      '1-02-16': '?꾩감蹂댁쬆湲댟룹쟾?멸툑 ??諛섑솚 ?덉젙 蹂댁쬆湲?,
      '1-02-17': '留뚭린 1??珥덇낵 湲덉쑖?곹뭹',
      '1-02-18': '?쇳닾?먭린?낆뿉 ???吏遺꾨쾿 ?곸슜 二쇱떇',
      '2-01-01': '?몄긽 留ㅼ엯?쇰줈 諛쒖깮??梨꾨Т',
      '2-01-02': '嫄곕옒泥섏뿉 諛쒗뻾???쎌냽?댁쓬',
      '2-01-03': '1???대궡 ?곹솚 ?덉젙 李⑥엯湲?,
      '2-01-04': '?곸뾽 ??嫄곕옒?먯꽌 諛쒖깮??誘몄?湲?梨꾨Т',
      '2-01-05': '諛쒖깮?덉쑝??誘몄?湲됲븳 鍮꾩슜',
      '2-01-06': '?ы솕쨌?⑹뿭 ?쒓났 ??誘몃━ 諛쏆? ?湲?,
      '2-01-07': '誘몃옒 湲곌컙 ?섏씡??誘몃━ 諛쏆? 湲덉븸',
      '2-01-08': '?쇱떆?곸쑝濡?蹂닿? 以묒씤 ????먭툑',
      '2-01-09': '留ㅼ텧 ??吏뺤닔??遺媛???⑸? ??곸븸',
      '2-01-10': '湲됱뿬?먯꽌 ?먯쿇吏뺤닔???뚮뱷??,
      '2-01-11': '湲됱뿬?먯꽌 怨듭젣??援???곌툑쨌嫄대낫쨌怨좎슜쨌?곗옱',
      '2-01-12': '1?????곹솚 ?꾨옒 ?κ린遺梨??꾪솚遺?,
      '2-02-01': '?곹솚湲고븳 1??珥덇낵 ?κ린 李⑥엯湲?,
      '2-02-02': '?댁쭅 ??吏湲??덉긽 ?댁쭅湲??곷┰??,
      '2-02-03': '?꾩감?몄쑝濡쒕???諛쏆? 蹂댁쬆湲?諛섑솚 ?섎Т)',
      '2-02-04': '?뚯궗媛 諛쒗뻾??梨꾧텒(?뚯궗梨?',
      '3-01-01': '蹂댄넻二?諛쒗뻾?쇰줈 ?⑹엯???먮낯湲?,
      '3-01-02': '?곗꽑二?諛쒗뻾?쇰줈 ?⑹엯???먮낯湲?,
      '3-02-01': '二쇱떇???〓㈃媛 珥덇낵濡?諛쒗뻾??李⑥븸',
      '3-02-02': '?먮낯 媛먯냼 ??諛쒖깮??李⑥씡',
      '3-03-01': '?곷쾿???섑빐 ?섎Т?곸쑝濡??곷┰?섎뒗 湲덉븸',
      '3-03-02': '?ъ뾽 ?뺤옣 ??紐⑹쟻?쇰줈 ?먮컻???곷┰',
      '3-03-03': '?꾩쭅 諛곕떦 ??泥섎텇?섏? ?딆? ?댁씡?됱뿬湲?,
      '3-03-04': '?대떦 ?뚭퀎?곕룄??理쒖쥌 ?쒖씠??,
      '4-01-01': '留ㅼ엯 ?곹뭹 ?먮ℓ濡?諛쒖깮???섏씡',
      '4-01-02': '?먯궗 ?쒖“ ?쒗뭹 ?먮ℓ ?섏씡',
      '4-01-03': '?쒕퉬???⑹뿭) ?쒓났?쇰줈 諛쒖깮???섏씡',
      '4-01-04': '留ㅼ텧 ?좎씤쨌諛섑뭹 ??留ㅼ텧 李④컧 ??ぉ',
      '4-02-01': '?덇툑쨌??ш툑 ?깆쓽 ?댁옄 ?섏엯',
      '4-02-02': '?ъ옄 二쇱떇?먯꽌 ?섎졊??諛곕떦湲?,
      '4-02-03': '遺?숈궛쨌?먯궛 ?꾨?濡?諛쒖깮???섏씡',
      '4-02-04': '?명솕 嫄곕옒 ???좊━???섏쑉 李⑥씠 ?댁씡',
      '4-02-05': '?명솕 ?먯궛쨌遺梨??섏궛 ???됯? ?댁씡',
      '4-02-06': '?좏삎?먯궛 ?λ?媛 珥덇낵 留ㅺ컖 ?댁씡',
      '4-02-07': '湲고? ?뚯븸쨌鍮꾧꼍?곸쟻 ?곸뾽???섏씡',
      '5-01-01': '?먮ℓ???곹뭹??留ㅼ엯 ?먭?',
      '5-01-02': '?먮ℓ???쒗뭹???쒖“ ?먭?',
      '5-01-03': '?쒗뭹 ?쒖“???ъ엯???먯옱猷?鍮꾩슜',
      '5-01-04': '?쒖“ ?꾩옣 洹쇰줈?먯쓽 ?멸굔鍮?,
      '5-01-05': '?먯옱猷뙿룸끂臾대퉬 ???쒖“ 愿??媛꾩젒 鍮꾩슜',
      '5-01-06': '?쒖“쨌?앹궛 怨듭젙 ?몃? ?꾪긽 媛怨?鍮꾩슜',
      '5-02-01': '?꾩쭅??湲곕낯湲됀룹닔????湲됱뿬 珥앹븸',
      '5-02-02': '?깃낵쨌紐낆젅 ???밸퀎 ?곸뿬湲?,
      '5-02-03': '?밴린 ?몄떇 ?댁쭅湲됱뿬 鍮꾩슜',
      '5-02-04': '?앸?쨌嫄닿컯寃吏꽷룰꼍議곗궗鍮???蹂듭? 鍮꾩슜',
      '5-02-05': '異쒖옣鍮꽷룰탳?듬퉬쨌?숇컯鍮???,
      '5-02-06': '嫄곕옒泥??묐?쨌?좊Ъ쨌?앹쓬猷?鍮꾩슜',
      '5-02-07': '?꾪솕쨌?명꽣?력룹슦?????듭떊 鍮꾩슜',
      '5-02-08': '?섎룄쨌媛?ㅒ룸궃諛????좏떥由ы떚 鍮꾩슜',
      '5-02-09': '?꾧린 ?ъ슜 ?붽툑',
      '5-02-10': '?ъ궛?맞룹옄?숈감?맞룰컖醫?怨듦낵湲?,
      '5-02-11': '?좏삎?먯궛???댁슜?곗닔蹂?媛移?媛먯냼 鍮꾩슜',
      '5-02-12': '?щТ?ㅒ룹옣鍮????꾩감 ?ъ슜猷?,
      '5-02-13': '嫄대Ъ쨌湲곌퀎 ???좎?蹂댁닔쨌?섎━ 鍮꾩슜',
      '5-02-14': '?붿옱쨌諛곗긽梨낆엫 ??媛곸쥌 蹂댄뿕 ?⑹엯??,
      '5-02-15': '?낅Т??李⑤웾 ?좊쪟鍮꽷룹젙鍮꾨퉬쨌二쇱감鍮?,
      '5-02-16': '?곌뎄쨌媛쒕컻 ?쒕룞???뚯슂?섎뒗 寃쎌긽 鍮꾩슜',
      '5-02-17': '?꾩쭅??援먯쑁쨌?곗닔쨌?먭꺽利?痍⑤뱷 鍮꾩슜',
      '5-02-18': '?쒖쟻 援ъ엯쨌紐낇븿쨌?몄뇙臾??쒖옉 鍮꾩슜',
      '5-02-19': '臾멸뎄쨌?щТ???뚮え??援ъ엯 鍮꾩슜',
      '5-02-20': '?쇰컲 ?뚮え??援ъ엯 鍮꾩슜',
      '5-02-21': '?몃Т쨌踰뺣Т쨌?????媛곸쥌 ?섏닔猷?,
      '5-02-22': '愿묎퀬쨌?띾낫쨌留덉???愿??鍮꾩슜',
      '5-02-23': '?뚯닔 遺덈뒫 梨꾧텒???밴린 ?곴컖 鍮꾩슜',
      '5-02-24': '?곹뭹쨌?쒗뭹 諛곗넚쨌?댁넚 鍮꾩슜',
      '5-02-25': '湲고? ?뚯븸쨌遺꾨쪟 遺덇? ?먭?鍮?,
      '5-02-26': '?쒓났쨌愿由????몃? ?몃젰 ?⑹뿭 ?멸굔鍮?,
      '5-03-01': '李⑥엯湲댟룹궗梨??깆뿉 ????댁옄 吏湲됱븸',
      '5-03-02': '?명솕 嫄곕옒 ??遺덈━???섏쑉 李⑥씠 ?먯떎',
      '5-03-03': '?명솕 ?먯궛쨌遺梨??섏궛 ???됯? ?먯떎',
      '5-03-04': '怨듭씡쨌?먯꽑 紐⑹쟻 湲곕? 吏異쒖븸',
      '5-03-05': '?좏삎?먯궛 ?λ?媛 誘몃쭔 留ㅺ컖 ?먯떎',
      '5-03-06': '湲고? ?뚯븸쨌鍮꾧꼍?곸쟻 ?곸뾽???먯떎',
      '5-04-01': '?밴린 踰뺤씤??諛?踰뺤씤吏諛⑹냼?앹꽭',
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

  /* ?? 蹂댁“湲덉닔??怨꾩젙怨쇰ぉ ?⑥튂 ?? */
  if (!localStorage.getItem('_acct_subsidy_patch_v1')) {
    const existing = getItem<any[]>('acct_accounts', [])
    if (existing.length > 0 && !existing.some(a => a.code === '4-02-08')) {
      existing.push({ code: '4-02-08', name: '蹂댁“湲덉닔??, type: 'revenue', group: '?곸뾽?몄닔??, description: '援??쨌吏?먯껜 ?깆쑝濡쒕???諛쏆? 蹂댁“湲??섏씡', active: true })
      setItem('acct_accounts', existing)
    }
    localStorage.setItem('_acct_subsidy_patch_v1', '1')
  }

  /* ?? ?곹뭹沅?怨꾩젙怨쇰ぉ ?⑥튂 ?? */
  if (!localStorage.getItem('_acct_voucher_acct_patch_v1')) {
    const existing = getItem<any[]>('acct_accounts', [])
    if (existing.length > 0 && !existing.some(a => a.name === '?곹뭹沅? && a.type === 'asset')) {
      existing.push({ code: '1-01-20', name: '?곹뭹沅?, type: 'asset', group: '?좊룞?먯궛', description: '臾명솕?곹뭹沅뙿룸갚?붿젏?곹뭹沅????좉?利앷텒 ?깃꺽???곹뭹沅?, active: true })
      setItem('acct_accounts', existing)
    }
    localStorage.setItem('_acct_voucher_acct_patch_v1', '1')
  }

  /* ?? ?좎?異??泥??덉쓽媛 approved/toResolve ?곹깭??寃쎌슦 completed濡??먮룞 留덉씠洹몃젅?댁뀡 ?? */
  if (!localStorage.getItem('_acct_preexp_completed_v4')) {
    const existingApprovals = getItem<any[]>('acct_approvals', [])
    const allCashflows: any[] = getItem('acct_cashflows', [])
    let patchedPre = false
    const updatedApprovals = existingApprovals.map((a: any) => {
      if (a.status !== 'approved' && a.status !== 'toResolve') return a
      // ?좎?異??먮퀎: ?뚮옒洹? ?쒕ぉ, ?먮뒗 ?곌껐??cashflow 議댁옱
      const hasCfLink = allCashflows.some((cf: any) => cf.approvalId && String(cf.approvalId) === String(a.id))
      const isPreExpItem = a.isPreExpense || a.selfExpense || (a.title || '').startsWith('[?좎?異?') || (a.title || '').startsWith('[?泥?') || hasCfLink
      if (isPreExpItem) {
        patchedPre = true
        return { ...a, status: 'completed', completedAt: a.completedAt || getLocalISOString() }
      }
      return a
    })
    if (patchedPre) setItem('acct_approvals', updatedApprovals)
    localStorage.setItem('_acct_preexp_completed_v4', '1')
  }

  /* ?? ?쒕뱶 踰꾩쟾 蹂寃????뚭퀎 ?곗씠??珥덇린?????ъ떆???? */
  const currentSeedVer = '_acct_react_seed_v11'
  const acctSeedDone = !!localStorage.getItem(currentSeedVer)  // early return ?쒓굅: 媛쒕퀎 ??泥댄겕濡?蹂듦뎄
  // ?댁쟾 踰꾩쟾 ?곗씠?곌? ?덉쑝硫??대━?????ъ떆??
  const oldKeys = ['_acct_react_seed_v1','_acct_react_seed_v2','_acct_react_seed_v3','_acct_react_seed_v4','_acct_react_seed_v5','_acct_react_seed_v6','_acct_react_seed_v7','_acct_react_seed_v8','_acct_react_seed_v9','_acct_react_seed_v10']
  const hadOldSeed = oldKeys.some(k => localStorage.getItem(k))
  if (hadOldSeed) {
    // ?댁쟾 ?쒕뱶 踰꾩쟾 ???쒓굅 + ?뚭퀎 ?곗씠???대━??
    oldKeys.forEach(k => localStorage.removeItem(k))
    ;['acct_budget_cats','acct_budgets','acct_approvals','acct_cashflows','acct_vouchers','acct_vendors'].forEach(k => localStorage.removeItem(k))
  }

  /* ?? 怨꾩젙怨쇰ぉ ?쒕뱶 (踰꾩쟾 蹂寃???媛뺤젣 由ъ뀑) ?? */
  {
    const defaultAccounts = [
      { code: '1-01-01', name: '?꾧툑', type: 'asset', group: '?좊룞?먯궛', description: '吏?먃룸룞????利됱떆 ?ъ슜 媛?ν븳 ?듯솕' },
      { code: '1-01-02', name: '?뱀쥖?덇툑', type: 'asset', group: '?좊룞?먯궛', description: '?섑몴 諛쒗뻾??媛?ν븳 ????덇툑' },
      { code: '1-01-03', name: '蹂댄넻?덇툑', type: 'asset', group: '?좊룞?먯궛', description: '?섏떆 ?낆텧湲?媛?ν븳 ?쇰컲 ?덇툑' },
      { code: '1-01-04', name: '?뺢린?덇툑', type: 'asset', group: '?좊룞?먯궛', description: '?쇱젙 湲곌컙 ?덉튂 ?뺤젙湲덈━ ?덇툑' },
      { code: '1-01-05', name: '?명솕?덇툑', type: 'asset', group: '?좊룞?먯궛', description: '?명솕濡?蹂댁쑀?섎뒗 ????덇툑' },
      { code: '1-01-06', name: '諛쏆쓣?댁쓬', type: 'asset', group: '?좊룞?먯궛', description: '嫄곕옒泥섎줈遺??諛쏆? ?쎌냽?댁쓬쨌?섏뼱?? },
      { code: '1-01-07', name: '?몄긽留ㅼ텧湲?, type: 'asset', group: '?좊룞?먯궛', description: '?몄긽 ?먮ℓ濡?諛쒖깮??留ㅼ텧梨꾧텒' },
      { code: '1-01-08', name: '??먯땐?밴툑', type: 'asset', group: '?좊룞?먯궛', description: '?뚯닔 遺덈뒫 ?덉긽??李④컧 ?됯?怨꾩젙' },
      { code: '1-01-09', name: '?④린??ш툑', type: 'asset', group: '?좊룞?먯궛', description: '1???대궡 ?뚯닔 ?덉젙 ??ш툑' },
      { code: '1-01-10', name: '誘몄닔湲?, type: 'asset', group: '?좊룞?먯궛', description: '?곸뾽 ??嫄곕옒?먯꽌 諛쒖깮??誘몄닔梨꾧텒' },
      { code: '1-01-11', name: '誘몄닔?섏씡', type: 'asset', group: '?좊룞?먯궛', description: '諛쒖깮?덉쑝??誘몄닔痍⑦븳 ?섏씡' },
      { code: '1-01-12', name: '?좉툒湲?, type: 'asset', group: '?좊룞?먯궛', description: '?곹뭹쨌?먯옱猷?援ъ엯 ???좎?湲??湲? },
      { code: '1-01-13', name: '?좉툒鍮꾩슜', type: 'asset', group: '?좊룞?먯궛', description: '誘몃옒 湲곌컙 鍮꾩슜??誘몃━ 吏湲됲븳 湲덉븸' },
      { code: '1-01-14', name: '遺媛?몃?湲됯툑', type: 'asset', group: '?좊룞?먯궛', description: '留ㅼ엯 ??遺?댄븳 遺媛???섍툒 ??곸븸' },
      { code: '1-01-15', name: '?ш퀬?먯궛(?곹뭹)', type: 'asset', group: '?좊룞?먯궛', description: '?먮ℓ 紐⑹쟻?쇰줈 留ㅼ엯???꾩꽦 ?곹뭹' },
      { code: '1-01-16', name: '?ш퀬?먯궛(?쒗뭹)', type: 'asset', group: '?좊룞?먯궛', description: '?먯궗 ?쒖“ ?꾩꽦 ?먮ℓ???쒗뭹' },
      { code: '1-01-17', name: '?ш퀬?먯궛(?먯옱猷?', type: 'asset', group: '?좊룞?먯궛', description: '?쒗뭹 ?쒖“???ъ엯???먯옄?? },
      { code: '1-01-18', name: '?ш퀬?먯궛(?ш났??', type: 'asset', group: '?좊룞?먯궛', description: '?쒖“ 怨쇱젙 以묒씤 誘몄셿???쒗뭹' },
      { code: '1-01-19', name: '?④린湲덉쑖?곹뭹', type: 'asset', group: '?좊룞?먯궛', description: '留뚭린 1???대궡 湲덉쑖?곹뭹(CD, MMF ??' },
      { code: '1-01-20', name: '?곹뭹沅?, type: 'asset', group: '?좊룞?먯궛', description: '臾명솕?곹뭹沅뙿룸갚?붿젏?곹뭹沅????좉?利앷텒 ?깃꺽???곹뭹沅? },
      { code: '1-02-01', name: '?좎?', type: 'asset', group: '鍮꾩쑀?숈옄??, description: '?ъ뾽???좎?(媛먭??곴컖 ????꾨떂)' },
      { code: '1-02-02', name: '嫄대Ъ', type: 'asset', group: '鍮꾩쑀?숈옄??, description: '?щТ?ㅒ룰났?Β룹갹怨????ъ뾽??嫄댁텞臾? },
      { code: '1-02-03', name: '嫄대Ъ媛먭??곴컖?꾧퀎??, type: 'asset', group: '鍮꾩쑀?숈옄??, description: '嫄대Ъ???꾩쟻 媛먭??곴컖??李④컧怨꾩젙)' },
      { code: '1-02-04', name: '援ъ텞臾?, type: 'asset', group: '鍮꾩쑀?숈옄??, description: '?꾨줈쨌援먮웾쨌?댁옣 ???좎? ?뺤갑 援ъ“臾? },
      { code: '1-02-05', name: '援ъ텞臾쇨컧媛?곴컖?꾧퀎??, type: 'asset', group: '鍮꾩쑀?숈옄??, description: '援ъ텞臾쇱쓽 ?꾩쟻 媛먭??곴컖??李④컧怨꾩젙)' },
      { code: '1-02-06', name: '湲곌퀎?μ튂', type: 'asset', group: '鍮꾩쑀?숈옄??, description: '?앹궛쨌?쒖“???ъ슜?섎뒗 湲곌퀎 ?ㅻ퉬' },
      { code: '1-02-07', name: '湲곌퀎?μ튂媛먭??곴컖?꾧퀎??, type: 'asset', group: '鍮꾩쑀?숈옄??, description: '湲곌퀎?μ튂???꾩쟻 媛먭??곴컖??李④컧怨꾩젙)' },
      { code: '1-02-08', name: '李⑤웾?대컲援?, type: 'asset', group: '鍮꾩쑀?숈옄??, description: '?낅Т???먮룞李㉱룻듃?????대컲 李⑤웾' },
      { code: '1-02-09', name: '李⑤웾?대컲援ш컧媛?곴컖?꾧퀎??, type: 'asset', group: '鍮꾩쑀?숈옄??, description: '李⑤웾?대컲援ъ쓽 ?꾩쟻 媛먭??곴컖??李④컧怨꾩젙)' },
      { code: '1-02-10', name: '鍮꾪뭹', type: 'asset', group: '鍮꾩쑀?숈옄??, description: '?щТ??媛援?룹쟾?먭린湲????낅Т??鍮꾪뭹' },
      { code: '1-02-11', name: '鍮꾪뭹媛먭??곴컖?꾧퀎??, type: 'asset', group: '鍮꾩쑀?숈옄??, description: '鍮꾪뭹???꾩쟻 媛먭??곴컖??李④컧怨꾩젙)' },
      { code: '1-02-12', name: '?뚰봽?몄썾??, type: 'asset', group: '鍮꾩쑀?숈옄??, description: '?낅Т??SW ?쇱씠?좎뒪쨌媛쒕컻鍮? },
      { code: '1-02-13', name: '?뚰봽?몄썾?댁긽媛곷늻怨꾩븸', type: 'asset', group: '鍮꾩쑀?숈옄??, description: '?뚰봽?몄썾?댁쓽 ?꾩쟻 ?곴컖??李④컧怨꾩젙)' },
      { code: '1-02-14', name: '?곸뾽沅?, type: 'asset', group: '鍮꾩쑀?숈옄??, description: '?ъ뾽 ?몄닔 ??珥덇낵 吏湲됲븳 ?꾨━誘몄뾼' },
      { code: '1-02-15', name: '?κ린??ш툑', type: 'asset', group: '鍮꾩쑀?숈옄??, description: '1??珥덇낵 ?κ린 ??ш툑' },
      { code: '1-02-16', name: '蹂댁쬆湲?, type: 'asset', group: '鍮꾩쑀?숈옄??, description: '?꾩감蹂댁쬆湲댟룹쟾?멸툑 ??諛섑솚 ?덉젙 蹂댁쬆湲? },
      { code: '1-02-17', name: '?κ린湲덉쑖?곹뭹', type: 'asset', group: '鍮꾩쑀?숈옄??, description: '留뚭린 1??珥덇낵 湲덉쑖?곹뭹' },
      { code: '1-02-18', name: '吏遺꾨쾿?곸슜?ъ옄二쇱떇', type: 'asset', group: '鍮꾩쑀?숈옄??, description: '?쇳닾?먭린?낆뿉 ???吏遺꾨쾿 ?곸슜 二쇱떇' },
      { code: '2-01-01', name: '?몄긽留ㅼ엯湲?, type: 'liability', group: '?좊룞遺梨?, description: '?몄긽 留ㅼ엯?쇰줈 諛쒖깮??梨꾨Т' },
      { code: '2-01-02', name: '吏湲됱뼱??, type: 'liability', group: '?좊룞遺梨?, description: '嫄곕옒泥섏뿉 諛쒗뻾???쎌냽?댁쓬' },
      { code: '2-01-03', name: '?④린李⑥엯湲?, type: 'liability', group: '?좊룞遺梨?, description: '1???대궡 ?곹솚 ?덉젙 李⑥엯湲? },
      { code: '2-01-04', name: '誘몄?湲됯툑', type: 'liability', group: '?좊룞遺梨?, description: '?곸뾽 ??嫄곕옒?먯꽌 諛쒖깮??誘몄?湲?梨꾨Т' },
      { code: '2-01-05', name: '誘몄?湲됰퉬??, type: 'liability', group: '?좊룞遺梨?, description: '諛쒖깮?덉쑝??誘몄?湲됲븳 鍮꾩슜' },
      { code: '2-01-06', name: '?좎닔湲?, type: 'liability', group: '?좊룞遺梨?, description: '?ы솕쨌?⑹뿭 ?쒓났 ??誘몃━ 諛쏆? ?湲? },
      { code: '2-01-07', name: '?좎닔?섏씡', type: 'liability', group: '?좊룞遺梨?, description: '誘몃옒 湲곌컙 ?섏씡??誘몃━ 諛쏆? 湲덉븸' },
      { code: '2-01-08', name: '?덉닔湲?, type: 'liability', group: '?좊룞遺梨?, description: '?쇱떆?곸쑝濡?蹂닿? 以묒씤 ????먭툑' },
      { code: '2-01-09', name: '遺媛?몄삁?섍툑', type: 'liability', group: '?좊룞遺梨?, description: '留ㅼ텧 ??吏뺤닔??遺媛???⑸? ??곸븸' },
      { code: '2-01-10', name: '?뚮뱷?몄삁?섍툑', type: 'liability', group: '?좊룞遺梨?, description: '湲됱뿬?먯꽌 ?먯쿇吏뺤닔???뚮뱷?? },
      { code: '2-01-11', name: '4?蹂댄뿕?덉닔湲?, type: 'liability', group: '?좊룞遺梨?, description: '湲됱뿬?먯꽌 怨듭젣??援???곌툑쨌嫄대낫쨌怨좎슜쨌?곗옱' },
      { code: '2-01-12', name: '?좊룞?깆옣湲곕?梨?, type: 'liability', group: '?좊룞遺梨?, description: '1?????곹솚 ?꾨옒 ?κ린遺梨??꾪솚遺? },
      { code: '2-02-01', name: '?κ린李⑥엯湲?, type: 'liability', group: '鍮꾩쑀?숇?梨?, description: '?곹솚湲고븳 1??珥덇낵 ?κ린 李⑥엯湲? },
      { code: '2-02-02', name: '?댁쭅湲됱뿬異⑸떦遺梨?, type: 'liability', group: '鍮꾩쑀?숇?梨?, description: '?댁쭅 ??吏湲??덉긽 ?댁쭅湲??곷┰?? },
      { code: '2-02-03', name: '?꾨?蹂댁쬆湲?, type: 'liability', group: '鍮꾩쑀?숇?梨?, description: '?꾩감?몄쑝濡쒕???諛쏆? 蹂댁쬆湲?諛섑솚 ?섎Т)' },
      { code: '2-02-04', name: '?ъ콈', type: 'liability', group: '鍮꾩쑀?숇?梨?, description: '?뚯궗媛 諛쒗뻾??梨꾧텒(?뚯궗梨?' },
      { code: '3-01-01', name: '蹂댄넻二쇱옄蹂멸툑', type: 'equity', group: '?먮낯湲?, description: '蹂댄넻二?諛쒗뻾?쇰줈 ?⑹엯???먮낯湲? },
      { code: '3-01-02', name: '?곗꽑二쇱옄蹂멸툑', type: 'equity', group: '?먮낯湲?, description: '?곗꽑二?諛쒗뻾?쇰줈 ?⑹엯???먮낯湲? },
      { code: '3-02-01', name: '二쇱떇諛쒗뻾珥덇낵湲?, type: 'equity', group: '?먮낯?됱뿬湲?, description: '二쇱떇???〓㈃媛 珥덇낵濡?諛쒗뻾??李⑥븸' },
      { code: '3-02-02', name: '媛먯옄李⑥씡', type: 'equity', group: '?먮낯?됱뿬湲?, description: '?먮낯 媛먯냼 ??諛쒖깮??李⑥씡' },
      { code: '3-03-01', name: '踰뺤젙?곷┰湲?, type: 'equity', group: '?댁씡?됱뿬湲?, description: '?곷쾿???섑빐 ?섎Т?곸쑝濡??곷┰?섎뒗 湲덉븸' },
      { code: '3-03-02', name: '?꾩쓽?곷┰湲?, type: 'equity', group: '?댁씡?됱뿬湲?, description: '?ъ뾽 ?뺤옣 ??紐⑹쟻?쇰줈 ?먮컻???곷┰' },
      { code: '3-03-03', name: '誘몄쿂遺꾩씠?듭엵?ш툑', type: 'equity', group: '?댁씡?됱뿬湲?, description: '?꾩쭅 諛곕떦 ??泥섎텇?섏? ?딆? ?댁씡?됱뿬湲? },
      { code: '3-03-04', name: '?밴린?쒖씠??, type: 'equity', group: '?댁씡?됱뿬湲?, description: '?대떦 ?뚭퀎?곕룄??理쒖쥌 ?쒖씠?? },
      { code: '4-01-01', name: '?곹뭹留ㅼ텧', type: 'revenue', group: '留ㅼ텧??, description: '留ㅼ엯 ?곹뭹 ?먮ℓ濡?諛쒖깮???섏씡' },
      { code: '4-01-02', name: '?쒗뭹留ㅼ텧', type: 'revenue', group: '留ㅼ텧??, description: '?먯궗 ?쒖“ ?쒗뭹 ?먮ℓ ?섏씡' },
      { code: '4-01-03', name: '?⑹뿭留ㅼ텧', type: 'revenue', group: '留ㅼ텧??, description: '?쒕퉬???⑹뿭) ?쒓났?쇰줈 諛쒖깮???섏씡' },
      { code: '4-01-04', name: '留ㅼ텧?먮늻由щ컦?섏엯', type: 'revenue', group: '留ㅼ텧??, description: '留ㅼ텧 ?좎씤쨌諛섑뭹 ??留ㅼ텧 李④컧 ??ぉ' },
      { code: '4-02-01', name: '?댁옄?섏씡', type: 'revenue', group: '?곸뾽?몄닔??, description: '?덇툑쨌??ш툑 ?깆쓽 ?댁옄 ?섏엯' },
      { code: '4-02-02', name: '諛곕떦湲덉닔??, type: 'revenue', group: '?곸뾽?몄닔??, description: '?ъ옄 二쇱떇?먯꽌 ?섎졊??諛곕떦湲? },
      { code: '4-02-03', name: '?꾨?猷뚯닔??, type: 'revenue', group: '?곸뾽?몄닔??, description: '遺?숈궛쨌?먯궛 ?꾨?濡?諛쒖깮???섏씡' },
      { code: '4-02-04', name: '?명솚李⑥씡', type: 'revenue', group: '?곸뾽?몄닔??, description: '?명솕 嫄곕옒 ???좊━???섏쑉 李⑥씠 ?댁씡' },
      { code: '4-02-05', name: '?명솕?섏궛?댁씡', type: 'revenue', group: '?곸뾽?몄닔??, description: '?명솕 ?먯궛쨌遺梨??섏궛 ???됯? ?댁씡' },
      { code: '4-02-06', name: '?좏삎?먯궛泥섎텇?댁씡', type: 'revenue', group: '?곸뾽?몄닔??, description: '?좏삎?먯궛 ?λ?媛 珥덇낵 留ㅺ컖 ?댁씡' },
      { code: '4-02-07', name: '?≪씠??, type: 'revenue', group: '?곸뾽?몄닔??, description: '湲고? ?뚯븸쨌鍮꾧꼍?곸쟻 ?곸뾽???섏씡' },
      { code: '4-02-08', name: '蹂댁“湲덉닔??, type: 'revenue', group: '?곸뾽?몄닔??, description: '援??쨌吏?먯껜 ?깆쑝濡쒕???諛쏆? 蹂댁“湲??섏씡' },
      { code: '5-01-01', name: '?곹뭹留ㅼ텧?먭?', type: 'expense', group: '留ㅼ텧?먭?', description: '?먮ℓ???곹뭹??留ㅼ엯 ?먭?' },
      { code: '5-01-02', name: '?쒗뭹留ㅼ텧?먭?', type: 'expense', group: '留ㅼ텧?먭?', description: '?먮ℓ???쒗뭹???쒖“ ?먭?' },
      { code: '5-01-03', name: '?먯옱猷뚮퉬', type: 'expense', group: '留ㅼ텧?먭?', description: '?쒗뭹 ?쒖“???ъ엯???먯옱猷?鍮꾩슜' },
      { code: '5-01-04', name: '?몃Т鍮?, type: 'expense', group: '留ㅼ텧?먭?', description: '?쒖“ ?꾩옣 洹쇰줈?먯쓽 ?멸굔鍮? },
      { code: '5-01-05', name: '?쒖“寃쎈퉬', type: 'expense', group: '留ㅼ텧?먭?', description: '?먯옱猷뙿룸끂臾대퉬 ???쒖“ 愿??媛꾩젒 鍮꾩슜' },
      { code: '5-01-06', name: '?몄＜媛怨듬퉬', type: 'expense', group: '留ㅼ텧?먭?', description: '?쒖“쨌?앹궛 怨듭젙 ?몃? ?꾪긽 媛怨?鍮꾩슜' },
      { code: '5-02-01', name: '湲됱뿬', type: 'expense', group: '?먮ℓ鍮꾨컦愿由щ퉬', description: '?꾩쭅??湲곕낯湲됀룹닔????湲됱뿬 珥앹븸' },
      { code: '5-02-02', name: '?곸뿬湲?, type: 'expense', group: '?먮ℓ鍮꾨컦愿由щ퉬', description: '?깃낵쨌紐낆젅 ???밸퀎 ?곸뿬湲? },
      { code: '5-02-03', name: '?댁쭅湲됱뿬', type: 'expense', group: '?먮ℓ鍮꾨컦愿由щ퉬', description: '?밴린 ?몄떇 ?댁쭅湲됱뿬 鍮꾩슜' },
      { code: '5-02-04', name: '蹂듬━?꾩깮鍮?, type: 'expense', group: '?먮ℓ鍮꾨컦愿由щ퉬', description: '?앸?쨌嫄닿컯寃吏꽷룰꼍議곗궗鍮???蹂듭? 鍮꾩슜' },
      { code: '5-02-05', name: '?щ퉬援먰넻鍮?, type: 'expense', group: '?먮ℓ鍮꾨컦愿由щ퉬', description: '異쒖옣鍮꽷룰탳?듬퉬쨌?숇컯鍮??? },
      { code: '5-02-06', name: '?묐?鍮?, type: 'expense', group: '?먮ℓ鍮꾨컦愿由щ퉬', description: '嫄곕옒泥??묐?쨌?좊Ъ쨌?앹쓬猷?鍮꾩슜' },
      { code: '5-02-07', name: '?듭떊鍮?, type: 'expense', group: '?먮ℓ鍮꾨컦愿由щ퉬', description: '?꾪솕쨌?명꽣?력룹슦?????듭떊 鍮꾩슜' },
      { code: '5-02-08', name: '?섎룄愿묒뿴鍮?, type: 'expense', group: '?먮ℓ鍮꾨컦愿由щ퉬', description: '?섎룄쨌媛?ㅒ룸궃諛????좏떥由ы떚 鍮꾩슜' },
      { code: '5-02-09', name: '?꾨젰鍮?, type: 'expense', group: '?먮ℓ鍮꾨컦愿由щ퉬', description: '?꾧린 ?ъ슜 ?붽툑' },
      { code: '5-02-10', name: '?멸툑怨쇨났怨?, type: 'expense', group: '?먮ℓ鍮꾨컦愿由щ퉬', description: '?ъ궛?맞룹옄?숈감?맞룰컖醫?怨듦낵湲? },
      { code: '5-02-11', name: '媛먭??곴컖鍮?, type: 'expense', group: '?먮ℓ鍮꾨컦愿由щ퉬', description: '?좏삎?먯궛???댁슜?곗닔蹂?媛移?媛먯냼 鍮꾩슜' },
      { code: '5-02-12', name: '吏湲됱엫李⑤즺', type: 'expense', group: '?먮ℓ鍮꾨컦愿由щ퉬', description: '?щТ?ㅒ룹옣鍮????꾩감 ?ъ슜猷? },
      { code: '5-02-13', name: '?섏꽑鍮?, type: 'expense', group: '?먮ℓ鍮꾨컦愿由щ퉬', description: '嫄대Ъ쨌湲곌퀎 ???좎?蹂댁닔쨌?섎━ 鍮꾩슜' },
      { code: '5-02-14', name: '蹂댄뿕猷?, type: 'expense', group: '?먮ℓ鍮꾨컦愿由щ퉬', description: '?붿옱쨌諛곗긽梨낆엫 ??媛곸쥌 蹂댄뿕 ?⑹엯?? },
      { code: '5-02-15', name: '李⑤웾?좎?鍮?, type: 'expense', group: '?먮ℓ鍮꾨컦愿由щ퉬', description: '?낅Т??李⑤웾 ?좊쪟鍮꽷룹젙鍮꾨퉬쨌二쇱감鍮? },
      { code: '5-02-16', name: '寃쎌긽媛쒕컻鍮?, type: 'expense', group: '?먮ℓ鍮꾨컦愿由щ퉬', description: '?곌뎄쨌媛쒕컻 ?쒕룞???뚯슂?섎뒗 寃쎌긽 鍮꾩슜' },
      { code: '5-02-17', name: '援먯쑁?덈젴鍮?, type: 'expense', group: '?먮ℓ鍮꾨컦愿由щ퉬', description: '?꾩쭅??援먯쑁쨌?곗닔쨌?먭꺽利?痍⑤뱷 鍮꾩슜' },
      { code: '5-02-18', name: '?꾩꽌?몄뇙鍮?, type: 'expense', group: '?먮ℓ鍮꾨컦愿由щ퉬', description: '?쒖쟻 援ъ엯쨌紐낇븿쨌?몄뇙臾??쒖옉 鍮꾩슜' },
      { code: '5-02-19', name: '?щТ?⑺뭹鍮?, type: 'expense', group: '?먮ℓ鍮꾨컦愿由щ퉬', description: '臾멸뎄쨌?щТ???뚮え??援ъ엯 鍮꾩슜' },
      { code: '5-02-20', name: '?뚮え?덈퉬', type: 'expense', group: '?먮ℓ鍮꾨컦愿由щ퉬', description: '?쇰컲 ?뚮え??援ъ엯 鍮꾩슜' },
      { code: '5-02-21', name: '吏湲됱닔?섎즺', type: 'expense', group: '?먮ℓ鍮꾨컦愿由щ퉬', description: '?몃Т쨌踰뺣Т쨌?????媛곸쥌 ?섏닔猷? },
      { code: '5-02-22', name: '愿묎퀬?좎쟾鍮?, type: 'expense', group: '?먮ℓ鍮꾨컦愿由щ퉬', description: '愿묎퀬쨌?띾낫쨌留덉???愿??鍮꾩슜' },
      { code: '5-02-23', name: '??먯긽媛곷퉬', type: 'expense', group: '?먮ℓ鍮꾨컦愿由щ퉬', description: '?뚯닔 遺덈뒫 梨꾧텒???밴린 ?곴컖 鍮꾩슜' },
      { code: '5-02-24', name: '?대컲鍮?, type: 'expense', group: '?먮ℓ鍮꾨컦愿由щ퉬', description: '?곹뭹쨌?쒗뭹 諛곗넚쨌?댁넚 鍮꾩슜' },
      { code: '5-02-25', name: '?〓퉬', type: 'expense', group: '?먮ℓ鍮꾨컦愿由щ퉬', description: '湲고? ?뚯븸쨌遺꾨쪟 遺덇? ?먭?鍮? },
      { code: '5-02-26', name: '?몄＜?멸굔鍮?, type: 'expense', group: '?먮ℓ鍮꾨컦愿由щ퉬', description: '?쒓났쨌愿由????몃? ?몃젰 ?⑹뿭 ?멸굔鍮? },
      { code: '5-03-01', name: '?댁옄鍮꾩슜', type: 'expense', group: '?곸뾽?몃퉬??, description: '李⑥엯湲댟룹궗梨??깆뿉 ????댁옄 吏湲됱븸' },
      { code: '5-03-02', name: '?명솚李⑥넀', type: 'expense', group: '?곸뾽?몃퉬??, description: '?명솕 嫄곕옒 ??遺덈━???섏쑉 李⑥씠 ?먯떎' },
      { code: '5-03-03', name: '?명솕?섏궛?먯떎', type: 'expense', group: '?곸뾽?몃퉬??, description: '?명솕 ?먯궛쨌遺梨??섏궛 ???됯? ?먯떎' },
      { code: '5-03-04', name: '湲곕?湲?, type: 'expense', group: '?곸뾽?몃퉬??, description: '怨듭씡쨌?먯꽑 紐⑹쟻 湲곕? 吏異쒖븸' },
      { code: '5-03-05', name: '?좏삎?먯궛泥섎텇?먯떎', type: 'expense', group: '?곸뾽?몃퉬??, description: '?좏삎?먯궛 ?λ?媛 誘몃쭔 留ㅺ컖 ?먯떎' },
      { code: '5-03-06', name: '?≪넀??, type: 'expense', group: '?곸뾽?몃퉬??, description: '湲고? ?뚯븸쨌鍮꾧꼍?곸쟻 ?곸뾽???먯떎' },
      { code: '5-04-01', name: '踰뺤씤?몃벑', type: 'expense', group: '踰뺤씤?몃퉬??, description: '?밴린 踰뺤씤??諛?踰뺤씤吏諛⑹냼?앹꽭' },
    ]
    if (getItem<any[]>('acct_accounts', []).length === 0) {
      setItem('acct_accounts', defaultAccounts)
    }
  }


  const uid = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 7)
  const year = new Date().getFullYear()

  /* ?? ?덉궛 ?쒕뱶 (湲곗〈 ?곗씠???놁쓣 ?뚮쭔) ?? */
  const cats = getItem<BudgetCat[]>('acct_budget_cats', [])
  const budgets = getItem<BudgetItem[]>('acct_budgets', [])

  if (cats.length === 0 || budgets.length === 0) {
    setItem('acct_budget_cats', [{"id":"mp6lpa67gfje3","name":"臾명솕?ъ껌","year":2026,"bankInfo":"移댁뭅?ㅻ콉??,"periodFrom":"2026-01-01","periodTo":"2026-12-31","bank":"移댁뭅?ㅻ콉??,"accounts":[{"id":1778912111737,"bankName":"移댁뭅?ㅻ콉??,"cards":["?쇰컲愿由ъ뭅??1234-5847-8282-7161"]},{"id":1778912224993,"bankName":"?랁삊 321-90-38475","cards":["異쒖옣?꾩슜 3847-3546-1232-0980"]}],"users":["?쒓꼍由?],"approvers":["理쒕???],"approver":"","budgetStatus":"confirmed"},{"id":"mp6lpa67ha0uy","name":"寃쎌＜?쒖껌","year":2026,"bankInfo":"?랁삊???2020-2200-34","periodFrom":"2026-01-01","periodTo":"2026-12-31","bank":"?랁삊???2020-2200-34","accounts":[],"users":["?쒓꼍由?],"approvers":["理쒕???],"approver":""},{"id":"mp6lpa676sg15","name":"?먯껜?덉궛","year":2026,"bankInfo":"援?????3030-3300-56","periodFrom":"2026-01-01","periodTo":"2026-12-31","bank":"援?????3030-3300-56","accounts":[],"users":["議곗쁺??],"approvers":[]},{"id":1778999557736,"name":"?먯껜?덉궛","bank":"","bankInfo":"","accounts":[],"periodFrom":"2027-01-01","periodTo":"2027-12-31","year":2027,"users":["理쒕???]},{"id":1779006937570,"name":"臾명솕?ъ껌","bank":"","bankInfo":"","accounts":[],"periodFrom":"2028-01-01","periodTo":"2028-12-31","year":2028,"users":["諛뺥???]}])
    setItem('acct_budgets', [{"id":1781996219161,"catId":"mp6lpa67gfje3","year":2026,"itemName":"臾명솕?щ낫?섎퉬","subItemName":"?⑥껌蹂댁닔","detailItemName":"","accountCode":"5-01-06","contraAccountCode":"1-01-03","amount":20000000,"spent":0,"budgetItemDefId":2},{"id":1781996218480,"catId":"mp6lpa67gfje3","year":2026,"itemName":"臾명솕?щ낫?섎퉬","subItemName":"?꾩옣?몃?","detailItemName":"","accountCode":"5-02-26","contraAccountCode":"1-01-03","amount":3000000,"spent":0,"budgetItemDefId":2},{"id":1781996218740,"catId":"mp6lpa67gfje3","year":2026,"itemName":"臾명솕?щ낫?섎퉬","subItemName":"?앹“蹂댁닔","detailItemName":"","accountCode":"5-02-13","contraAccountCode":"1-01-03","amount":2000000,"spent":0,"budgetItemDefId":2},{"id":1781948301126,"catId":"mp6lpa67gfje3","year":2026,"itemName":"?λ퉬援ъ엯鍮?,"subItemName":"?덉쟾?λ퉬","detailItemName":"","accountCode":"5-02-20","contraAccountCode":"2-01-04","amount":0,"spent":0,"budgetItemDefId":4},{"id":1781948304503,"catId":"mp6lpa67gfje3","year":2026,"itemName":"?λ퉬援ъ엯鍮?,"subItemName":"?щТ湲곌린","detailItemName":"","accountCode":"1-02-10","contraAccountCode":"2-01-04","amount":0,"spent":0,"budgetItemDefId":4},{"id":1781995470792,"catId":"mp6lpa67gfje3","year":2026,"itemName":"?댁쁺鍮?,"subItemName":"?쇰컲?섏슜鍮?,"detailItemName":"?щТ?⑺뭹 援ъ엯","accountCode":"5-02-19","contraAccountCode":"1-01-03","amount":0,"spent":50000,"budgetItemDefId":1304},{"id":1781948299578,"catId":"mp6lpa67gfje3","year":2026,"itemName":"?댁쁺鍮?,"subItemName":"?쇰컲?섏슜鍮?,"detailItemName":"?몄뇙鍮?諛??좎씤鍮?,"accountCode":"5-02-18","contraAccountCode":"1-01-03","amount":23000000,"spent":50000,"budgetItemDefId":1304},{"id":1781948299225,"catId":"mp6lpa67gfje3","year":2026,"itemName":"?댁쁺鍮?,"subItemName":"?쇰컲?섏슜鍮?,"detailItemName":"?띾낫鍮?,"accountCode":"5-02-22","contraAccountCode":"1-01-03","amount":50000,"spent":50000,"budgetItemDefId":1304},{"id":1781995470139,"catId":"mp6lpa67gfje3","year":2026,"itemName":"?댁쁺鍮?,"subItemName":"?쇰컲?섏슜鍮?,"detailItemName":"臾쇳뭹援ъ엯鍮?,"accountCode":"5060","contraAccountCode":"1-01-03","amount":0,"spent":50000,"budgetItemDefId":1304},{"id":1781995472077,"catId":"mp6lpa67gfje3","year":2026,"itemName":"?댁쁺鍮?,"subItemName":"?쇰컲?섏슜鍮?,"detailItemName":"媛꾪뻾臾???援ъ엯鍮?,"accountCode":"5-02-21","contraAccountCode":"1-01-03","amount":0,"spent":50000,"budgetItemDefId":1304},{"id":1781996904105,"catId":"mp6lpa67gfje3","year":2026,"itemName":"?멸굔鍮?,"subItemName":"怨좎젙?몃젰","detailItemName":"","accountCode":"5-02-01","contraAccountCode":"1-01-03","amount":0,"spent":0,"budgetItemDefId":1},{"id":1781996901855,"catId":"mp6lpa67gfje3","year":2026,"itemName":"?멸굔鍮?,"subItemName":"?쇱슜?몃젰","detailItemName":"","accountCode":"5-01-04","contraAccountCode":"1-01-03","amount":0,"spent":0,"budgetItemDefId":1},{"id":1781997001164,"catId":"mp6lpa67gfje3","year":2026,"itemName":"臾명솕?щ낫?섎퉬","subItemName":"紐⑹“蹂댁닔","detailItemName":"","accountCode":"5-02-13","contraAccountCode":"1-01-03","amount":0,"spent":0,"budgetItemDefId":2},{"id":1782026307941,"catId":"mp6lpa67gfje3","year":2026,"itemName":"諛쒓뎬議곗궗鍮?,"subItemName":"諛쒓뎬?λ퉬?꾨?","detailItemName":"","accountCode":"5-01-06","contraAccountCode":"2-01-04","amount":230000,"spent":0,"budgetItemDefId":3},{"id":1782026301705,"catId":"mp6lpa67gfje3","year":2026,"itemName":"諛쒓뎬議곗궗鍮?,"subItemName":"?쒓뎬議곗궗","detailItemName":"","accountCode":"5-01-06","contraAccountCode":"2-01-04","amount":0,"spent":0,"budgetItemDefId":3},{"id":1782026302071,"catId":"mp6lpa67gfje3","year":2026,"itemName":"諛쒓뎬議곗궗鍮?,"subItemName":"議곗궗?몃젰","detailItemName":"","accountCode":"5-02-26","contraAccountCode":"2-01-04","amount":0,"spent":0,"budgetItemDefId":3}])
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
    setItem('acct_approvals', [
            {
                  "id": 2001,
                  "title": "Q1 ?щТ?⑺뭹 ?쇨큵 援щℓ",
                  "amount": 1500000,
                  "date": "2026-01-15",
                  "status": "toResolve",
                  "accountCode": "5190",
                  "description": "1遺꾧린 ?щТ?⑺뭹 ?쇨큵 援щℓ ?덉쓽",
                  "applicant": "理쒕???,
                  "approver": "理쒕???,
                  "createdAt": "2026-01-14T09:00:00Z"
            },
            {
                  "id": 2002,
                  "title": "臾명솕???꾩옣 ?덉쟾?λ퉬 援ъ엯",
                  "amount": 3200000,
                  "date": "2026-02-05",
                  "status": "toResolve",
                  "accountCode": "5140",
                  "description": "?꾩옣 ?덉쟾紐? ?덉쟾踰⑦듃 ??援ъ엯",
                  "applicant": "?섑???,
                  "approver": "理쒕???,
                  "createdAt": "2026-02-04T10:00:00Z"
            },
            {
                  "id": 2003,
                  "title": "諛쒓뎬議곗궗 ?λ퉬 ?꾨?",
                  "amount": 8500000,
                  "date": "2026-02-20",
                  "status": "toResolve",
                  "accountCode": "5120",
                  "description": "3??諛쒓뎬議곗궗 ?λ퉬 ?꾨? 鍮꾩슜",
                  "applicant": "?쒓꼍由?,
                  "approver": "理쒕???,
                  "createdAt": "2026-02-19T14:00:00Z"
            },
            {
                  "id": 2004,
                  "title": "蹂닿퀬???몄뇙鍮?,
                  "amount": 2800000,
                  "date": "2026-03-10",
                  "status": "pending",
                  "accountCode": "5190",
                  "description": "2025?꾨룄 ?곌컙蹂닿퀬???몄뇙",
                  "applicant": "媛뺤꽑??,
                  "approver": "理쒕???,
                  "createdAt": "2026-03-09T11:00:00Z"
            },
            {
                  "id": 2005,
                  "title": "吏곸썝 ??웾媛뺥솕 援먯쑁鍮?,
                  "amount": 4500000,
                  "date": "2026-03-25",
                  "status": "pending",
                  "accountCode": "5350",
                  "description": "臾명솕??蹂듭썝湲곗닠 援먯쑁 ?섍컯猷?,
                  "applicant": "諛뺥???,
                  "approver": "理쒕???,
                  "createdAt": "2026-03-24T09:30:00Z"
            },
            {
                  "id": 2006,
                  "title": "踰뺤씤李⑤웾 ?뺢린?뺣퉬",
                  "amount": 780000,
                  "date": "2026-04-05",
                  "status": "toResolve",
                  "accountCode": "5310",
                  "description": "踰뺤씤李⑤웾 3? ?뺢린?뺣퉬",
                  "applicant": "議곗쁺??,
                  "approver": "理쒕???,
                  "createdAt": "2026-04-04T08:00:00Z"
            },
            {
                  "id": 2007,
                  "title": "?좎쟻吏 議곌꼍怨듭궗",
                  "amount": 12000000,
                  "date": "2026-04-12",
                  "status": "approved",
                  "accountCode": "5120",
                  "description": "寃쎌＜ ?좎쟻吏 遊?議곌꼍?뺣퉬",
                  "applicant": "?섑???,
                  "approver": "理쒕???,
                  "createdAt": "2026-04-11T10:00:00Z"
            },
            {
                  "id": 2008,
                  "title": "?щТ???듭떊鍮??곌컙怨꾩빟",
                  "amount": 3600000,
                  "date": "2026-05-01",
                  "status": "rejected",
                  "accountCode": "5340",
                  "description": "?명꽣???꾪솕 ?곌컙怨꾩빟 媛깆떊",
                  "applicant": "?꾧린??,
                  "approver": "理쒕???,
                  "createdAt": "2026-04-28T15:00:00Z"
            },
            {
                  "id": 2009,
                  "title": "?꾩옣 ?쒕줎 援ъ엯",
                  "amount": 5500000,
                  "date": "2026-05-10",
                  "status": "approved",
                  "accountCode": "5130",
                  "description": "??났珥ъ쁺??怨좎꽦???쒕줎 2?",
                  "applicant": "?쒓꼍由?,
                  "approver": "理쒕???,
                  "createdAt": "2026-05-09T09:00:00Z"
            },
            {
                  "id": 2010,
                  "title": "?됱궗??耳?댄꽣留?,
                  "amount": 2200000,
                  "date": "2026-05-20",
                  "status": "approved",
                  "accountCode": "5310",
                  "description": "臾명솕?좎궛?????됱궗 耳?댄꽣留?,
                  "applicant": "媛뺤꽑??,
                  "approver": "理쒕???,
                  "createdAt": "2026-05-19T13:00:00Z"
            },
            {
                  "id": 1778920129748,
                  "title": "而댄벂??援щℓ",
                  "amount": 1500000,
                  "date": "2026-05-16",
                  "status": "approved",
                  "accountCode": "",
                  "description": "而댄벂?곌? ?꾩슂?⑸땲??",
                  "applicant": "理쒕???,
                  "approver": "理쒕???,
                  "createdAt": "2026-05-16T08:28:49.714Z",
                  "resubmittedAt": "2026-05-16T12:09:43.200Z",
                  "budgetCatId": "mp6lpa676sg15",
                  "budgetCatName": "?먯껜?덉궛",
                  "budgetItemId": "mp6lpa67vtzi2",
                  "budgetItem": "?щТ?댁쁺鍮?,
                  "budgetSubId": "mp6lpa6700zwf",
                  "budgetSubItem": "?щТ?댁쁺鍮?,
                  "approvedAt": "2026-05-16T23:16:33.665Z"
            },
            {
                  "id": 1778924551839,
                  "title": "而댄벂?곌뎄留?,
                  "amount": 2000000,
                  "date": "2026-05-16",
                  "status": "approved",
                  "accountCode": "",
                  "description": "洹몃깷?ш쾶",
                  "applicant": "理쒕???,
                  "approver": "理쒕???,
                  "createdAt": "2026-05-16T09:42:31.807Z"
            },
            {
                  "id": 1778924741860,
                  "title": "而댄벂?곌뎄留?,
                  "amount": 6000000,
                  "date": "2026-05-16",
                  "status": "toResolve",
                  "accountCode": "",
                  "description": "?ㅼ엵\n",
                  "applicant": "理쒕???,
                  "approver": "理쒕???,
                  "createdAt": "2026-05-16T09:45:41.827Z",
                  "budgetCatId": "mp6lpa67gfje3",
                  "budgetItemId": "mp6lpa679xmm2",
                  "budgetSubId": "mp6lpa679xmm2",
                  "approvedAt": "2026-05-16T11:28:29.736Z"
            },
            {
                  "id": 1778933840182,
                  "title": "?곗뒿",
                  "amount": 50,
                  "date": "2026-05-16",
                  "status": "confirming",
                  "accountCode": "",
                  "description": "?뉎뀋",
                  "applicant": "理쒕???,
                  "approver": "理쒕???,
                  "createdAt": "2026-05-16T12:17:19.499Z",
                  "budgetCatId": "mp6lpa676sg15",
                  "budgetItemId": "mp6lpa67mn4l0",
                  "budgetSubId": "mp6lpa67jwi1z",
                  "approvedAt": "2026-05-16T15:34:11.609Z",
                  "attachments": [
                        {
                              "name": "?뚰겕??01.jpg",
                              "size": 2055082,
                              "type": "image/jpeg",
                              "addedAt": "2026-05-17T01:48:07.159Z",
                              "title": "?곗뒿",
                              "dimensions": "20"
                        }
                  ],
                  "confirmedAt": "2026-05-17T16:05:06.187Z",
                  "returnedAt": "2026-05-17T03:29:56.329Z"
            },
            {
                  "id": 1778944330150,
                  "title": "?뉎꽰??,
                  "amount": 345,
                  "date": "2026-05-16",
                  "status": "toResolve",
                  "accountCode": "",
                  "description": "?뉎꽮??,
                  "applicant": "理쒕???,
                  "approver": "理쒕???,
                  "createdAt": "2026-05-16T15:12:09.341Z",
                  "budgetCatId": "mp6lpa67gfje3",
                  "budgetItemId": "mp6lpa670zb6d",
                  "budgetSubId": "mp6lpa670zb6d",
                  "approvedAt": "2026-05-16T15:27:44.307Z"
            },
            {
                  "id": 1779027204813,
                  "status": "pending",
                  "title": "[?좎?異? 援щℓ",
                  "amount": 300000,
                  "date": "2026-05-17",
                  "createdAt": "2026-05-17T14:13:24.350Z",
                  "accountCode": "",
                  "description": "異쒓툑?꾪몴 ?좎?異?- 臾명솕??蹂댁닔鍮?> ?뚰깙?섎━",
                  "applicant": "理쒕???,
                  "approver": "理쒕???,
                  "budgetItem": "臾명솕??蹂댁닔鍮?,
                  "budgetSubItem": "?뚰깙?섎━",
                  "budgetCatId": "mp6lpa67gfje3",
                  "budgetCatName": "臾명솕?ъ껌",
                  "resubmittedAt": "2026-05-18T06:48:52.888Z"
            },
            {
                  "id": 1779087828586,
                  "title": "?뉎뀋",
                  "amount": 50,
                  "date": "2026-05-18",
                  "status": "pending",
                  "accountCode": "",
                  "description": "?뉎뀋",
                  "applicant": "理쒕???,
                  "approver": "理쒕???,
                  "budgetItem": "",
                  "budgetSubItem": "",
                  "createdAt": "2026-05-18T07:03:48.142Z"
            },
            {
                  "id": 1779089444785,
                  "status": "preExpense",
                  "isPreExpense": true,
                  "title": "[?좎?異? 硫뗭?寃뚯궡??,
                  "amount": 1700000,
                  "date": "2026-05-18",
                  "createdAt": "2026-05-18T07:30:44.615Z",
                  "accountCode": "",
                  "description": "異쒓툑?꾪몴 ?좎?異?- 臾명솕??蹂댁닔鍮?> ?뚰깙?섎━",
                  "applicant": "理쒕???,
                  "approver": "",
                  "budgetItem": "臾명솕??蹂댁닔鍮?,
                  "budgetSubItem": "?뚰깙?섎━",
                  "budgetCatId": "mp6lpa67gfje3",
                  "budgetCatName": "臾명솕?ъ껌",
                  "budgetItemId": "mp6lpa676bwjc",
                  "budgetSubId": "1779027171295"
            },
            {
                  "id": 1781937293865,
                  "status": "pending",
                  "isPreExpense": true,
                  "title": "[?좎?異? 而댄벂?곌뎄留?,
                  "amount": 1000000,
                  "date": "2026-06-20",
                  "createdAt": "2026-06-20T06:34:53.706Z",
                  "accountCode": "",
                  "description": "異쒓툑?꾪몴 ?좎?異?- ?댁쁺鍮?> ?쇰컲?섏슜鍮?,
                  "applicant": "諛뺥???,
                  "approver": "理쒕???,
                  "budgetItem": "?댁쁺鍮?,
                  "budgetSubItem": "?쇰컲?섏슜鍮?,
                  "budgetCatId": "mp6lpa67gfje3",
                  "budgetCatName": "臾명솕?ъ껌",
                  "budgetItemId": "1781925489685",
                  "budgetSubId": "1781925489685",
                  "resubmittedAt": "2026-06-21T04:01:15.274Z"
            },
            {
                  "id": 1782009881804,
                  "title": "而댄벂?곌뎄留?,
                  "amount": 1000000,
                  "date": "2026-06-21",
                  "status": "completed",
                  "accountCode": "",
                  "description": "而댄벂?곗궗以섏슂",
                  "applicant": "諛뺥???,
                  "approver": "理쒕???,
                  "isGeneral": false,
                  "budgetItem": "?λ퉬援ъ엯鍮?,
                  "budgetSubItem": "?щТ湲곌린",
                  "createdAt": "2026-06-21T02:44:41.665Z",
                  "budgetCatId": "mp6lpa67gfje3",
                  "budgetCatName": "臾명솕?ъ껌",
                  "budgetItemId": "1781948301126",
                  "budgetSubId": "1781948304503",
                  "approvedAmount": 1000000,
                  "approvedMemo": "鍮꾧탳寃ъ쟻諛쏄퀬 吏꾪뻾?섏꽭??,
                  "approvedAt": "2026-06-21T03:38:20.204Z",
                  "attachments": [
                        {
                              "name": "?곸닔利?01.jpg",
                              "size": 120825,
                              "type": "image/jpeg",
                              "addedAt": "2026-06-21T05:33:54.290Z",
                              "title": "?곸닔利?01",
                              "printWidth": 180,
                              "imageKey": "att_1782009881804_1782020034289_4gu0n7",
                              "row": 0
                        },
                        {
                              "name": "?곸닔利?01.jpg",
                              "size": 120825,
                              "type": "image/jpeg",
                              "addedAt": "2026-06-21T05:35:22.954Z",
                              "title": "?곸닔利?01",
                              "printWidth": 181,
                              "imageKey": "att_1782009881804_1782020122952_ojvco9",
                              "row": 0
                        },
                        {
                              "name": "KakaoTalk_20260615_115613910.jpg",
                              "size": 3705794,
                              "type": "image/jpeg",
                              "addedAt": "2026-06-21T05:35:57.809Z",
                              "title": "?ㅼ튂??,
                              "printWidth": 400,
                              "imageKey": "att_1782009881804_1782020157807_tmhg5n"
                        }
                  ],
                  "confirmedAt": "2026-06-21T05:52:45.542Z",
                  "returnedAt": "2026-06-21T05:52:11.919Z",
                  "returnReason": "?곸닔利앹씠 ?섎せ??寃?媛숈뒿?덈떎.",
                  "returnedBy": "?쒓꼍由?,
                  "completedAt": "2026-06-21T06:00:52.057Z",
                  "completedBy": "?쒓꼍由?
            },
            {
                  "id": 1782014550101,
                  "title": "吏異쒗뀒?ㅽ듃",
                  "amount": 500000,
                  "date": "2026-06-21",
                  "status": "toResolve",
                  "accountCode": "",
                  "description": "吏異??뚯뒪??,
                  "applicant": "諛뺥???,
                  "approver": "理쒕???,
                  "isGeneral": false,
                  "budgetItem": "?댁쁺鍮?,
                  "budgetSubItem": "?쇰컲?섏슜鍮?,
                  "createdAt": "2026-06-21T04:02:29.405Z",
                  "budgetCatId": "mp6lpa67gfje3",
                  "budgetCatName": "臾명솕?ъ껌",
                  "budgetItemId": "1781995470792",
                  "budgetSubId": "1781995470792",
                  "budgetDetailId": "1781995470792",
                  "budgetDetailItem": "?щТ?⑺뭹援ъ엯鍮?,
                  "approvedAmount": 500000,
                  "approvedMemo": "鍮꾧탳 寃ъ쟻 2怨??댁긽 ?붾쭩",
                  "approvedAt": "2026-06-21T04:33:31.500Z"
            },
            {
                  "id": 1782028353377,
                  "title": "吏異??뚯뒪??,
                  "amount": 200000,
                  "date": "2026-06-21",
                  "status": "confirming",
                  "accountCode": "",
                  "description": "吏異??곗뒿",
                  "applicant": "?쒓꼍由?,
                  "approver": "理쒕???,
                  "isGeneral": false,
                  "budgetCatId": "mp6lpa67gfje3",
                  "budgetCatName": "臾명솕?ъ껌",
                  "createdAt": "2026-06-21T07:52:32.616Z",
                  "resubmittedAt": "2026-06-21T08:06:48.968Z",
                  "budgetItemId": "1781995470792",
                  "budgetItem": "?댁쁺鍮?,
                  "budgetSubId": "1781995470792",
                  "budgetSubItem": "?쇰컲?섏슜鍮?,
                  "budgetDetailId": "1781948299578",
                  "budgetDetailItem": "?몄뇙諛륁쑀?몃퉬",
                  "approvedAmount": 200000,
                  "approvedMemo": "鍮꾧탳寃ъ쟻 2媛쒖씠??泥⑤?",
                  "approvedAt": "2026-06-21T08:52:10.064Z",
                  "attachments": [
                        {
                              "name": "?곸닔利?02.jpg",
                              "size": 111551,
                              "type": "image/jpeg",
                              "addedAt": "2026-06-21T08:58:22.338Z",
                              "title": "?곸닔利?02",
                              "printWidth": 183,
                              "imageKey": "att_1782028353377_1782032302338_usj9at"
                        }
                  ],
                  "confirmedAt": "2026-06-21T08:58:44.401Z"
            },
            {
                  "id": 1782029243828,
                  "title": "?곗뒿",
                  "amount": 0,
                  "date": "2026-06-21",
                  "status": "pending",
                  "accountCode": "",
                  "description": "?곗뒿",
                  "applicant": "?쒓꼍由?,
                  "approver": "理쒕???,
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
                  "title": "[?좎?異? ?곗뒿",
                  "amount": 50000,
                  "date": "2026-06-21",
                  "createdAt": "2026-06-21T11:17:02.009Z",
                  "accountCode": "",
                  "description": "異쒓툑?꾪몴 ?좎?異?- ?댁쁺鍮?> ?쇰컲?섏슜鍮?n?곗뒿?⑸땲??",
                  "applicant": "諛뺥???,
                  "approver": "理쒕???,
                  "budgetItem": "?댁쁺鍮?,
                  "budgetSubItem": "?쇰컲?섏슜鍮?,
                  "budgetCatId": "mp6lpa67gfje3",
                  "budgetCatName": "臾명솕?ъ껌",
                  "budgetItemId": "1781995470792",
                  "resubmittedAt": "2026-06-21T11:21:46.712Z",
                  "budgetDetailItem": "",
                  "approvedAmount": 50000,
                  "approvedMemo": "ok",
                  "approvedAt": "2026-06-21T12:30:52.604Z",
                  "attachments": [
                        {
                              "name": "?곸닔利?01.jpg",
                              "size": 120825,
                              "type": "image/jpeg",
                              "addedAt": "2026-06-21T12:45:40.668Z",
                              "title": "?곸닔利?01",
                              "printWidth": 156,
                              "imageKey": "att_1782040622302_1782045940668_4jyxyq"
                        }
                  ],
                  "confirmedAt": "2026-06-21T12:45:52.947Z",
                  "completedAt": "2026-06-21T12:46:28.413Z",
                  "completedBy": "?쒓꼍由?
            }
      ])
  }

  /* ?? 吏異??낃툑/異쒓툑 ?섑뵆 媛?10嫄??? */
  if (getItem<any[]>('acct_cashflows', []).length === 0) {
    setItem('acct_cashflows', [{"id":3031,"date":"2026-04-08","type":"income","amount":1500000,"description":"湲곕뀗???먮ℓ ?섏엯","accountCode":"4030","counter":"湲곕뀗?덉꺏","method":"?꾧툑","budgetCatId":"mp6lpa676sg15"},{"id":3033,"date":"2026-04-05","type":"income","amount":10000000,"description":"寃쎌＜??3李?蹂댁“湲?,"accountCode":"4030","counter":"寃쎌＜?쒖껌","method":"怨꾩쥖?댁껜","budgetCatId":"mp6lpa67ha0uy"},{"id":3035,"date":"2026-04-20","type":"income","amount":2400000,"description":"援먯쑁 ?꾨줈洹몃옩 李멸?鍮?,"accountCode":"4030","counter":"援먯쑁李멸???,"method":"?꾧툑","budgetCatId":"mp6lpa67ha0uy"},{"id":3039,"date":"2026-03-15","type":"income","amount":20000000,"description":"臾명솕?ъ껌 3李?蹂댁“湲?,"accountCode":"4030","counter":"臾명솕?ъ껌","method":"怨꾩쥖?댁껜","budgetCatId":"mp6lpa67gfje3"},{"id":1781937421402,"date":"2026-06-20","type":"expense","amount":3200000,"description":"臾명솕???꾩옣 ?덉쟾?λ퉬 援ъ엯","accountCode":"5110","counter":"","writeDate":"2026-06-20","manager":"?섑???,"approvalId":"2002"},{"id":1781937440808,"date":"2026-06-20","type":"expense","amount":8500000,"description":"諛쒓뎬議곗궗 ?λ퉬 ?꾨?","accountCode":"5110","counter":"","writeDate":"2026-06-20","manager":"?쒓꼍由?,"approvalId":"2003"},{"id":1781937450451,"date":"2026-06-20","type":"expense","amount":780000,"description":"踰뺤씤李⑤웾 ?뺢린?뺣퉬","accountCode":"5110","counter":"","writeDate":"2026-06-20","manager":"議곗쁺??,"approvalId":"2006"},{"id":1781937914840,"date":"2026-06-20","type":"income","amount":97000000,"description":"蹂댄넻?덇툑","accountCode":"4030","counter":"寃쎌＜臾명솕?ъ뿰援ъ썝","writeDate":"2026-06-20","manager":"","incomeNote":"蹂댁“湲?},{"id":1781938099754,"date":"2026-06-20","type":"income","amount":25499501,"description":"蹂댄넻?덇툑","accountCode":"4030","counter":"寃쎌＜臾명솕?ъ뿰援ъ썝","writeDate":"2026-06-20","manager":"","budgetCatId":"mp6lpa67gfje3","incomeNote":"?밸퀎蹂댁“湲?},{"id":1781938136357,"date":"2026-06-20","type":"income","amount":499,"description":"蹂댄넻?덇툑","accountCode":"4030","counter":"寃쎌＜臾명솕?ъ뿰援ъ썝","writeDate":"2026-06-20","manager":"","budgetCatId":"mp6lpa67gfje3","incomeNote":"洹몃깷"},{"id":1781945825620,"date":"2026-06-20","type":"income","amount":33333,"description":"?꾧툑","accountCode":"4030","counter":"","writeDate":"2026-06-20","manager":"","budgetCatId":"","incomeNote":"ddzzzz"},{"id":1782019260794,"date":"2026-06-21","type":"expense","amount":1000000,"description":"?λ퉬援ъ엯鍮?,"accountCode":"5110","counter":"(二??쒖슱嫄댁꽕","writeDate":"2026-06-21","manager":"諛뺥???,"budgetCatId":"","createdBy":"?쒓꼍由?,"approvalId":"1782009881804"},{"id":1782032173289,"date":"2026-06-21","type":"expense","amount":200000,"description":"?댁쁺鍮?,"accountCode":"5110","counter":"(二??쒖슱嫄댁꽕","writeDate":"2026-06-21","manager":"?쒓꼍由?,"budgetCatId":"","createdBy":"?쒓꼍由?,"approvalId":"1782028353377"},{"id":1782032222296,"date":"2026-06-21","type":"expense","amount":6000000,"description":"而댄벂?곌뎄留?,"accountCode":"5110","counter":"(二??쒖슱嫄댁꽕","writeDate":"2026-06-21","manager":"理쒕???,"budgetCatId":"","createdBy":"?쒓꼍由?,"approvalId":"1778924741860"},{"id":1782032253870,"date":"2026-06-21","type":"expense","amount":345,"description":"?뉎꽰??,"accountCode":"5110","counter":"寃쎌＜臾명솕?ъ뿰援ъ썝","writeDate":"2026-06-21","manager":"理쒕???,"budgetCatId":"","createdBy":"?쒓꼍由?,"approvalId":"1778944330150"},{"id":1782040622157,"date":"2026-06-21","type":"expense","amount":50000,"description":"?곗뒿","accountCode":"5110","counter":"寃쎌＜臾명솕?ъ뿰援ъ썝","writeDate":"2026-06-21","manager":"諛뺥???,"budgetCatId":"mp6lpa67gfje3","createdBy":"?쒓꼍由?,"approvalId":"1782040622302"}])
  }


  /* ?? ?꾪몴 ?쒕뱶 ?? */
  if (getItem<any[]>('acct_vouchers', []).length === 0) {
    setItem('acct_vouchers', [{"id":3002,"date":"2026-01-20","type":"expense","description":"?щТ?⑺뭹 援щℓ (蹂듭궗吏, ?좊꼫)","counterpart":"(二??ㅻ쭏?몄삤?쇱뒪","paymentMethod":"?꾧툑","createdAt":"2026-01-20T09:00:00Z","entries":[{"side":"debit","accountCode":"5110","amount":320000},{"side":"credit","accountCode":"1010","amount":320000}]},{"id":3004,"date":"2026-02-08","type":"expense","description":"?꾩옣?묒뾽???덉쟾?λ퉬","counterpart":"(二??쒓뎅?꾩옄","paymentMethod":"怨꾩쥖?댁껜","createdAt":"2026-02-08T09:00:00Z","entries":[{"side":"debit","accountCode":"5110","amount":1500000},{"side":"credit","accountCode":"1020","amount":1500000}]},{"id":3006,"date":"2026-03-15","type":"expense","description":"3??踰뺤씤李⑤웾 ?좊쪟鍮?,"counterpart":"二쇱쑀??,"paymentMethod":"?꾧툑","createdAt":"2026-03-15T09:00:00Z","entries":[{"side":"debit","accountCode":"5110","amount":450000},{"side":"credit","accountCode":"1010","amount":450000}]},{"id":3008,"date":"2026-03-28","type":"expense","description":"蹂닿퀬???몄뇙鍮?(300遺)","counterpart":"??쒖씤?꾧났??,"paymentMethod":"怨꾩쥖?댁껜","createdAt":"2026-03-28T09:00:00Z","entries":[{"side":"debit","accountCode":"5110","amount":1200000},{"side":"credit","accountCode":"1020","amount":1200000}]},{"id":3010,"date":"2026-04-05","type":"expense","description":"?꾩옣 ?뚮え??援ъ엯","counterpart":"泥좊Ъ??,"paymentMethod":"?꾧툑","createdAt":"2026-04-05T09:00:00Z","entries":[{"side":"debit","accountCode":"5110","amount":280000},{"side":"credit","accountCode":"1010","amount":280000}]},{"id":3012,"date":"2026-04-10","type":"expense","description":"議곌꼍 ?좎?蹂댁닔鍮?,"counterpart":"(二?洹몃┛議곌꼍","paymentMethod":"怨꾩쥖?댁껜","createdAt":"2026-04-10T09:00:00Z","entries":[{"side":"debit","accountCode":"5110","amount":3500000},{"side":"credit","accountCode":"1020","amount":3500000}]},{"id":3014,"date":"2026-04-12","type":"expense","description":"吏곸썝 媛꾩떇鍮?,"counterpart":"(二?留쏅굹?몃뱶","paymentMethod":"?꾧툑","createdAt":"2026-04-12T09:00:00Z","entries":[{"side":"debit","accountCode":"5110","amount":150000},{"side":"credit","accountCode":"1010","amount":150000}]},{"id":3016,"date":"2026-04-18","type":"expense","description":"踰뺣쪧?먮Ц ?섏닔猷?,"counterpart":"?몄쥌踰뺣쪧?щТ??,"paymentMethod":"怨꾩쥖?댁껜","createdAt":"2026-04-18T09:00:00Z","entries":[{"side":"debit","accountCode":"5110","amount":2200000},{"side":"credit","accountCode":"1020","amount":2200000}]},{"id":3018,"date":"2026-05-02","type":"expense","description":"李⑤웾 ?뺢린寃?щ퉬","counterpart":"(二??쇱뒪?몄뭅","paymentMethod":"?꾧툑","createdAt":"2026-05-02T09:00:00Z","entries":[{"side":"debit","accountCode":"5110","amount":350000},{"side":"credit","accountCode":"1010","amount":350000}]},{"id":3020,"date":"2026-05-05","type":"expense","description":"?щТ???뺤닔湲??뚰깉","counterpart":"?뺤닔湲곕젋??,"paymentMethod":"?꾧툑","createdAt":"2026-05-05T09:00:00Z","entries":[{"side":"debit","accountCode":"5110","amount":55000},{"side":"credit","accountCode":"1010","amount":55000}]},{"id":3022,"date":"2026-01-10","type":"income","description":"臾명솕?ъ껌 1李?蹂댁“湲?,"counterpart":"臾명솕?ъ껌","paymentMethod":"怨꾩쥖?댁껜","createdAt":"2026-01-10T09:00:00Z","entries":[{"side":"debit","accountCode":"1020","amount":25000000},{"side":"credit","accountCode":"4030","amount":25000000}]},{"id":3024,"date":"2026-02-28","type":"income","description":"二쇱감???댁쁺 ?섏엯","counterpart":"(二?洹몃┛議곌꼍","paymentMethod":"?꾧툑","createdAt":"2026-02-28T09:00:00Z","entries":[{"side":"debit","accountCode":"1010","amount":3200000},{"side":"credit","accountCode":"4030","amount":3200000}]},{"id":3026,"date":"2026-03-05","type":"income","description":"臾명솕?ъ껌 2李?蹂댁“湲?,"counterpart":"臾명솕?ъ껌","paymentMethod":"怨꾩쥖?댁껜","createdAt":"2026-03-05T09:00:00Z","entries":[{"side":"debit","accountCode":"1020","amount":25000000},{"side":"credit","accountCode":"4030","amount":25000000}]},{"id":3028,"date":"2026-03-01","type":"income","description":"?좎쟻 ?낆옣猷??섏엯","counterpart":"寃쎌＜?쒖껌","paymentMethod":"?꾧툑","createdAt":"2026-03-01T09:00:00Z","entries":[{"side":"debit","accountCode":"1010","amount":8500000},{"side":"credit","accountCode":"4030","amount":8500000}]},{"id":3030,"date":"2026-03-01","type":"income","description":"釉붾줈嫄?珥ъ쁺鍮??섏엯","counterpart":"KT?쒕툕留덈━?쁔V","paymentMethod":"?꾧툑","createdAt":"2026-03-01T09:00:00Z","entries":[{"side":"debit","accountCode":"1010","amount":1300000},{"side":"credit","accountCode":"4030","amount":1300000}]},{"id":3032,"date":"2026-04-08","type":"income","description":"湲곕뀗???먮ℓ ?섏엯","counterpart":"湲곕뀗?덉꺏","paymentMethod":"?꾧툑","createdAt":"2026-04-08T09:00:00Z","entries":[{"side":"debit","accountCode":"1010","amount":1500000},{"side":"credit","accountCode":"4030","amount":1500000}]},{"id":3034,"date":"2026-04-05","type":"income","description":"寃쎌＜??3李?蹂댁“湲?,"counterpart":"寃쎌＜?쒖껌","paymentMethod":"怨꾩쥖?댁껜","createdAt":"2026-04-05T09:00:00Z","entries":[{"side":"debit","accountCode":"1020","amount":10000000},{"side":"credit","accountCode":"4030","amount":10000000}]},{"id":3036,"date":"2026-04-20","type":"income","description":"援먯쑁 ?꾨줈洹몃옩 李멸?鍮?,"counterpart":"援먯쑁李멸???,"paymentMethod":"?꾧툑","createdAt":"2026-04-20T09:00:00Z","entries":[{"side":"debit","accountCode":"1010","amount":2400000},{"side":"credit","accountCode":"4030","amount":2400000}]},{"id":3038,"date":"2026-07-05","type":"income","description":"二쇱감???댁쁺 ?섏엯","counterpart":"(二?洹몃┛議곌꼍","paymentMethod":"?꾧툑","createdAt":"2026-07-05T09:00:00Z","entries":[{"side":"debit","accountCode":"1010","amount":1800000},{"side":"credit","accountCode":"4030","amount":1800000}]},{"id":3040,"date":"2026-03-15","type":"income","description":"臾명솕?ъ껌 3李?蹂댁“湲?,"counterpart":"臾명솕?ъ껌","paymentMethod":"怨꾩쥖?댁껜","createdAt":"2026-03-15T09:00:00Z","entries":[{"side":"debit","accountCode":"1020","amount":20000000},{"side":"credit","accountCode":"4030","amount":20000000}]},{"id":3042,"date":"2026-01-25","type":"expense","description":"?꾩쭅??1??湲됱뿬","counterpart":"吏곸썝怨꾩쥖","paymentMethod":"怨꾩쥖?댁껜","createdAt":"2026-01-25T09:00:00Z","entries":[{"side":"debit","accountCode":"5210","amount":15000000},{"side":"credit","accountCode":"1020","amount":15000000}]},{"id":3044,"date":"2026-02-20","type":"expense","description":"嫄곕옒泥??묐?鍮?,"counterpart":"寃쎌＜?쒖껌","paymentMethod":"?꾧툑","createdAt":"2026-02-20T09:00:00Z","entries":[{"side":"debit","accountCode":"5210","amount":650000},{"side":"credit","accountCode":"1010","amount":650000}]},{"id":3046,"date":"2026-02-28","type":"expense","description":"4?蹂댄뿕 ?⑸?","counterpart":"援??嫄닿컯蹂댄뿕怨듬떒","paymentMethod":"怨꾩쥖?댁껜","createdAt":"2026-02-28T09:00:00Z","entries":[{"side":"debit","accountCode":"5210","amount":4800000},{"side":"credit","accountCode":"1020","amount":4800000}]},{"id":3048,"date":"2026-03-05","type":"expense","description":"異쒖옣 ?щ퉬援먰넻鍮?,"counterpart":"?щТ??,"paymentMethod":"?꾧툑","createdAt":"2026-03-05T09:00:00Z","entries":[{"side":"debit","accountCode":"5210","amount":850000},{"side":"credit","accountCode":"1010","amount":850000}]},{"id":3050,"date":"2026-03-31","type":"expense","description":"?댁쭅?곌툑 ?곷┰","counterpart":"?댁쭅?곌툑?댁슜??,"paymentMethod":"怨꾩쥖?댁껜","createdAt":"2026-03-31T09:00:00Z","entries":[{"side":"debit","accountCode":"5210","amount":3000000},{"side":"credit","accountCode":"1020","amount":3000000}]},{"id":3052,"date":"2026-05-15","type":"expense","description":"?뚯쓽 ?ㅺ낵鍮?,"counterpart":"(二?誘몃땲諛붾줈","paymentMethod":"?꾧툑","createdAt":"2026-05-15T09:00:00Z","entries":[{"side":"debit","accountCode":"5210","amount":180000},{"side":"credit","accountCode":"1010","amount":180000}]},{"id":3054,"date":"2026-05-20","type":"expense","description":"VIP ?묐?鍮?,"counterpart":"寃쎌＜?쒖껌","paymentMethod":"?꾧툑","createdAt":"2026-05-20T09:00:00Z","entries":[{"side":"debit","accountCode":"5210","amount":450000},{"side":"credit","accountCode":"1010","amount":450000}]},{"id":3056,"date":"2026-05-01","type":"expense","description":"?щТ???꾨?猷?,"counterpart":"嫄대Ъ二?,"paymentMethod":"怨꾩쥖?댁껜","createdAt":"2026-05-01T09:00:00Z","entries":[{"side":"debit","accountCode":"5210","amount":3300000},{"side":"credit","accountCode":"1020","amount":3300000}]},{"id":3058,"date":"2026-05-05","type":"expense","description":"鍮꾪뭹 ?섎━鍮?,"counterpart":"?섎━?낆껜","paymentMethod":"?꾧툑","createdAt":"2026-05-05T09:00:00Z","entries":[{"side":"debit","accountCode":"5210","amount":220000},{"side":"credit","accountCode":"1010","amount":220000}]},{"id":3060,"date":"2026-05-10","type":"expense","description":"愿由щ퉬 ?⑸?","counterpart":"愿由ъ궗臾댁냼","paymentMethod":"怨꾩쥖?댁껜","createdAt":"2026-05-10T09:00:00Z","entries":[{"side":"debit","accountCode":"5210","amount":880000},{"side":"credit","accountCode":"1020","amount":880000}]},{"id":1778943487828,"date":"2026-05-16","type":"expense","description":"Q1 ?щТ?⑺뭹 ?쇨큵 援щℓ","entries":[{"side":"debit","accountCode":"5110","amount":1500000},{"side":"credit","accountCode":"1020","amount":1500000}],"createdAt":"2026-05-16T14:58:06.877Z"},{"id":1778943496791,"date":"2026-05-16","type":"expense","description":"臾명솕???꾩옣 ?덉쟾?λ퉬 援ъ엯","entries":[{"side":"debit","accountCode":"5110","amount":3200000},{"side":"credit","accountCode":"1020","amount":3200000}],"createdAt":"2026-05-16T14:58:16.509Z"},{"id":1778979213649,"date":"2026-05-17","type":"expense","description":"?꾩쭅??湲됱뿬","entries":[{"side":"debit","accountCode":"5110","amount":50},{"side":"credit","accountCode":"1020","amount":50}],"createdAt":"2026-05-17T00:53:33.425Z"},{"id":1779027204638,"date":"2026-05-17","type":"expense","description":"援щℓ","entries":[{"side":"debit","accountCode":"5110","amount":300000},{"side":"credit","accountCode":"1020","amount":300000}],"createdAt":"2026-05-17T14:13:24.349Z"},{"id":1779089445533,"date":"2026-05-18","type":"expense","description":"硫뗭?寃뚯궡??,"entries":[{"side":"debit","accountCode":"5110","amount":1700000},{"side":"credit","accountCode":"1020","amount":1700000}],"createdAt":"2026-05-18T07:30:44.614Z"},{"id":1781933526762,"date":"2026-06-20","type":"expense","description":"Q1 ?щТ?⑺뭹 ?쇨큵 援щℓ","entries":[{"side":"debit","accountCode":"5110","amount":1500000},{"side":"credit","accountCode":"1010","amount":1500000}],"createdAt":"2026-06-20T05:32:06.761Z"},{"id":1781937293873,"date":"2026-06-20","type":"expense","description":"而댄벂?곌뎄留?,"entries":[{"side":"debit","accountCode":"5110","amount":1000000},{"side":"credit","accountCode":"1020","amount":1000000}],"createdAt":"2026-06-20T06:34:53.705Z"},{"id":1781937421605,"date":"2026-06-20","type":"expense","description":"臾명솕???꾩옣 ?덉쟾?λ퉬 援ъ엯","entries":[{"side":"debit","accountCode":"5110","amount":3200000},{"side":"credit","accountCode":"1020","amount":3200000}],"createdAt":"2026-06-20T06:37:00.666Z"},{"id":1781937440763,"date":"2026-06-20","type":"expense","description":"諛쒓뎬議곗궗 ?λ퉬 ?꾨?","entries":[{"side":"debit","accountCode":"5110","amount":8500000},{"side":"credit","accountCode":"1020","amount":8500000}],"createdAt":"2026-06-20T06:37:20.728Z"},{"id":1781937450064,"date":"2026-06-20","type":"expense","description":"踰뺤씤李⑤웾 ?뺢린?뺣퉬","entries":[{"side":"debit","accountCode":"5110","amount":780000},{"side":"credit","accountCode":"1020","amount":780000}],"createdAt":"2026-06-20T06:37:29.993Z"},{"id":1781937818007,"date":"2026-06-20","type":"income","description":"蹂댄넻?덇툑","entries":[{"side":"debit","accountCode":"1020","amount":70000000},{"side":"credit","accountCode":"4030","amount":70000000}],"createdAt":"2026-06-20T06:43:37.523Z"},{"id":1781937914940,"date":"2026-06-20","type":"income","description":"蹂댄넻?덇툑","entries":[{"side":"debit","accountCode":"1020","amount":97000000},{"side":"credit","accountCode":"4030","amount":97000000}],"createdAt":"2026-06-20T06:45:14.227Z"},{"id":1781938100272,"date":"2026-06-20","type":"income","description":"蹂댄넻?덇툑","entries":[{"side":"debit","accountCode":"1020","amount":25499501},{"side":"credit","accountCode":"4030","amount":25499501}],"createdAt":"2026-06-20T06:48:19.535Z"},{"id":1781938136030,"date":"2026-06-20","type":"income","description":"蹂댄넻?덇툑","entries":[{"side":"debit","accountCode":"1020","amount":499},{"side":"credit","accountCode":"4030","amount":499}],"createdAt":"2026-06-20T06:48:55.463Z"},{"id":1781945825395,"date":"2026-06-20","type":"income","description":"?꾧툑","entries":[{"side":"debit","accountCode":"1020","amount":33333},{"side":"credit","accountCode":"4030","amount":33333}],"createdAt":"2026-06-20T08:57:05.047Z"},{"id":1782019135417,"date":"2026-06-21","type":"expense","description":"?댁쁺鍮?,"entries":[{"side":"debit","accountCode":"5110","amount":500000},{"side":"credit","accountCode":"1020","amount":500000}],"createdAt":"2026-06-21T05:18:55.398Z"},{"id":1782019260641,"date":"2026-06-21","type":"expense","description":"?λ퉬援ъ엯鍮?,"entries":[{"side":"debit","accountCode":"5110","amount":1000000},{"side":"credit","accountCode":"1020","amount":1000000}],"createdAt":"2026-06-21T05:21:00.545Z"},{"id":1782032173014,"date":"2026-06-21","type":"expense","description":"?댁쁺鍮?,"entries":[{"side":"debit","accountCode":"5110","amount":200000},{"side":"credit","accountCode":"1020","amount":200000}],"createdAt":"2026-06-21T08:56:12.880Z"},{"id":1782032221835,"date":"2026-06-21","type":"expense","description":"而댄벂?곌뎄留?,"entries":[{"side":"debit","accountCode":"5110","amount":6000000},{"side":"credit","accountCode":"1020","amount":6000000}],"createdAt":"2026-06-21T08:57:01.810Z"},{"id":1782032253984,"date":"2026-06-21","type":"expense","description":"?뉎꽰??,"entries":[{"side":"debit","accountCode":"5110","amount":345},{"side":"credit","accountCode":"1020","amount":345}],"createdAt":"2026-06-21T08:57:33.650Z"},{"id":1782040622110,"date":"2026-06-21","type":"expense","description":"?곗뒿","entries":[{"side":"debit","accountCode":"5110","amount":50000},{"side":"credit","accountCode":"1020","amount":50000}],"createdAt":"2026-06-21T11:17:02.009Z"}])
  }


  /* ?? 異붽? ?쒕뱶 ?곗씠??(濡쒖뺄 ?숆린?? ?? */
  if (getItem<any[]>('acct_payment_methods', []).length === 0) {
    setItem('acct_payment_methods', ["臾명솕?ъ껌","?먯껜?덉궛","?⑥닚寃쎈퉬","?앸떦寃쎈퉬","泥???","11","臾명솕?곹뭹沅?,"湲고봽?몄긽?덇텒","臾명솕?ъ껌?듯빀怨꾩쥖","?덇툑怨?,"?댁쓬1","諛깊솕?먯긽?덇텒","湲고봽?몄긽?덇텒"])
  }
  if (getItem<any[]>('acct_pay_methods_v2', []).length === 0) {
    setItem('acct_pay_methods_v2', [{"id":1782003160593,"name":"臾명솕?ъ껌","category":"怨꾩쥖","bankName":"援?????,"accountNumber":"110-23394-34948-00","accountHolder":"理쒕???,"purpose":"臾명솕?ъ껌?ъ뾽鍮?,"manager":"?쒓꼍由?,"memo":"","cards":[{"id":1782034666037,"cardName":"","cardCompany":"","cardNumber":"","cardType":"泥댄겕移대뱶","cardUser":""}]},{"id":1782003647695,"name":"?먯껜?덉궛","category":"怨꾩쥖","bankName":"移댁뭅?ㅻ콉??,"manager":"?꾧린??,"cards":[{"id":1782004087943,"cardName":"?쇰컲愿由ъ뭅??,"cardCompany":"移댁뭅?ㅻ콉??,"cardNumber":"1234-5847-8282-7161","cardType":"?좎슜移대뱶","cardUser":"媛뺤꽑??,"expiryDate":"12/04","cardLimit":5000000},{"id":1782004309966,"cardName":"?앸??꾩슜","cardCompany":"移댁뭅?ㅻ콉??,"cardNumber":"3233-3272-6635-2615","cardType":"泥댄겕移대뱶","cardUser":"?꾧린??,"expiryDate":"23/45"}]},{"id":1782004757518,"name":"?⑥닚寃쎈퉬","category":"?꾧툑","storageLocation":"?щТ??,"custodian":"諛뺥???,"cashLimit":200000,"purpose":"?뚯븸 諛??꾩옣 鍮꾩슜","memo":"?쒕룄???댁긽 愿由ы븯吏 留덉꽭??},{"id":1782004837483,"name":"?앸떦寃쎈퉬","category":"?꾧툑","storageLocation":"?앸떦","custodian":"諛뺥???,"cashLimit":500000,"purpose":"?앹옄???꾧툑援ъ엯","memo":"?쒕룄??珥덇낵 愿由??섏?留덉꽭??},{"id":1782005511576,"name":"泥???","category":"?댁쓬","noteType":"","noteBank":"援?????,"noteManager":"媛뺤꽑??,"defaultMaturity":"90??,"notes":[{"id":1782005792498,"noteNumber":"","issuer":"","receiver":"?곕━?뚯궗","amount":0,"issueDate":"2026-06-21","maturityDate":"","endorsement":"","status":"誘멸껐??},{"id":1782005999590,"noteNumber":"","issuer":"","receiver":"?곕━?뚯궗","amount":0,"issueDate":"2026-06-21","maturityDate":"","endorsement":"","bank":"","status":"誘멸껐??}]},{"id":1782006154142,"name":"11","category":"湲고?"},{"id":1782006950211,"name":"臾명솕?곹뭹沅?,"category":"?곹뭹沅?,"voucherAmount":100000,"voucherManager":"?꾧린??},{"id":1782006987466,"name":"湲고봽?몄긽?덇텒","category":"?곹뭹沅?,"voucherAmount":500000,"voucherManager":"議곗쁺??},{"id":1782037240641,"name":"臾명솕?ъ껌?듯빀怨꾩쥖","category":"怨꾩쥖","budgetCatId":"mp6lpa67gfje3","bankName":"援?????,"accountNumber":"1120-2345-1827-09","accountHolder":"理쒕??먯꽑?묓쉶","manager":"?쒓꼍由?,"purpose":"?ъ뾽鍮?,"memo":"臾명솕?ъ껌 26???ъ뾽鍮?,"cards":[{"id":1782037311536,"cardName":"?듯빀移대뱶","cardCompany":"援??移대뱶","cardNumber":"3453-4544-3345-5665","cardType":"泥댄겕移대뱶","cardUser":"?쒓꼍由?,"expiryDate":"23/45"}]},{"id":1782037514959,"name":"?덇툑怨?,"category":"?꾧툑","budgetCatId":"mp6lpa67gfje3","custodian":"?쒓꼍由?,"storageLocation":"?щТ??,"cashLimit":500000,"purpose":"?뚯븸寃쎈퉬"},{"id":1782037564895,"name":"?댁쓬1","category":"?댁쓬","budgetCatId":"mp6lpa67gfje3","noteManager":"?쒓꼍由?,"noteType":"?섏떊","defaultMaturity":"90??,"notes":[{"id":1782037585055,"noteNumber":"","issuer":"","receiver":"?곕━?뚯궗","amount":0,"issueDate":"2026-06-21","maturityDate":"","endorsement":"","bank":"","status":"誘멸껐??}]},{"id":1782037621726,"name":"諛깊솕?먯긽?덇텒","category":"?곹뭹沅?,"budgetCatId":"mp6lpa67gfje3","voucherManager":"?쒓꼍由?,"voucherAmount":100000,"voucherQty":10},{"id":1782037750752,"name":"湲고봽?몄긽?덇텒","category":"?곹뭹沅?,"budgetCatId":"mp6lpa67gfje3","voucherManager":"?쒓꼍由?,"voucherAmount":200000,"voucherQty":5,"voucherStorage":"?щТ?ㅺ툑怨?}])
  }
  if (getItem<any[]>('acct_hq_vendors', []).length === 0) {
    setItem('acct_hq_vendors', [{"id":1,"companyName":"(二??쒓뎅?붾（??,"zipCode":"","address1":"","address2":"","ceoName":"源???,"ceoPhone":"02-1234-5678","bizNo":"123-45-67890","bizPhone":"","bizType":"?쒖“","bizCategory":"而ㅽ듉.釉붾씪?몃뱶 ?먮떒 ?쒖“","taxEmail":"hg001@gmail.com","companyPhoto":"","managerName":"?닿꼍??,"managerTitle":"???,"managerPhone":"010-1111-2222","managerEmail":"lee@ksol.co.kr","managerId":"","managerPw":"","managerPhoto":"","solutions":[{"name":"?뚰겕??,"enabled":true},{"name":"?덊럹?댁?","enabled":true,"qty":1},{"name":"?먮떒怨듦툒??,"enabled":false},{"name":"?쒖“怨듦툒??,"enabled":false},{"name":"?좏넻愿由ъ궗","enabled":false},{"name":"媛留밸?由ъ젏","enabled":false},{"name":"?앹옱?由ъ젏","enabled":false}],"monthlyFee":200000,"vendorCode":"","serverFee":0,"dbFee":25000,"dbUsage":"25,000MB","dbUnitPrice":1000,"usageCount":5400,"usageCountLabel":"523,221嫄?,"usageUnitPrice":10,"salesRate":7,"periodSales":12350000,"bizCertPhoto":"","history":[{"date":"2026-04-21 06:33:32","desc":"?④? ?섏젙"},{"date":"2026-04-21 06:33:35","desc":"?뺣낫 ?섏젙"},{"date":"2026-04-21 06:35:47","desc":"?뺣낫 ?섏젙"}],"billingList":[{"period":"2026.01.01-2026.01.31","monthlyFee":200000,"dbFee":250000,"dataFee":48200,"commission":500000,"total":998200,"status":"?⑸?"},{"period":"2026.02.01-2026.02.28","monthlyFee":200000,"dbFee":280000,"dataFee":52100,"commission":520000,"total":1052100,"status":"?⑸?"},{"period":"2026.03.01-2026.03.31","monthlyFee":200000,"dbFee":250000,"dataFee":49800,"commission":480000,"total":979800,"status":"泥?뎄"}]},{"id":2,"companyName":"?紐낇뀒??二?","zipCode":"","address1":"","address2":"","ceoName":"諛뺤궗??,"ceoPhone":"02-9876-5432","bizNo":"234-56-78901","bizPhone":"","bizType":"","bizCategory":"","taxEmail":"","companyPhoto":"","managerName":"理쒖닔誘?,"managerTitle":"","managerPhone":"010-3333-4444","managerEmail":"choi@dmtech.co.kr","managerId":"","managerPw":"","managerPhoto":"","solutions":[{"name":"?뚰겕??,"enabled":true},{"name":"?덊럹?댁?","enabled":true,"qty":1},{"name":"?먮떒怨듦툒??,"enabled":false},{"name":"?쒖“怨듦툒??,"enabled":false},{"name":"?좏넻愿由ъ궗","enabled":false},{"name":"媛留밸?由ъ젏","enabled":false},{"name":"?앹옱?由ъ젏","enabled":false}],"monthlyFee":150000,"vendorCode":"","serverFee":0,"dbFee":25000,"dbUsage":"25,000MB","dbUnitPrice":1000,"usageCount":5400,"usageCountLabel":"523,221嫄?,"usageUnitPrice":10,"salesRate":7,"periodSales":8500000,"bizCertPhoto":"","history":[],"billingList":[{"period":"2026.01.01-2026.01.31","monthlyFee":200000,"dbFee":250000,"dataFee":48200,"commission":500000,"total":998200,"status":"?⑸?"},{"period":"2026.02.01-2026.02.28","monthlyFee":200000,"dbFee":280000,"dataFee":52100,"commission":520000,"total":1052100,"status":"?⑸?"},{"period":"2026.03.01-2026.03.31","monthlyFee":200000,"dbFee":250000,"dataFee":49800,"commission":480000,"total":979800,"status":"泥?뎄"}]},{"id":3,"companyName":"?쒖슱?좏넻(二?","zipCode":"","address1":"","address2":"","ceoName":"?뺥쉶??,"ceoPhone":"02-5555-6666","bizNo":"345-67-89012","bizPhone":"","bizType":"","bizCategory":"","taxEmail":"","companyPhoto":"","managerName":"媛뺣???,"managerTitle":"","managerPhone":"010-5555-6666","managerEmail":"kang@seouldt.co.kr","managerId":"","managerPw":"","managerPhoto":"","solutions":[{"name":"?뚰겕??,"enabled":true},{"name":"?덊럹?댁?","enabled":false,"qty":1},{"name":"?먮떒怨듦툒??,"enabled":false},{"name":"?쒖“怨듦툒??,"enabled":false},{"name":"?좏넻愿由ъ궗","enabled":true},{"name":"媛留밸?由ъ젏","enabled":true},{"name":"?앹옱?由ъ젏","enabled":false}],"monthlyFee":300000,"vendorCode":"","serverFee":0,"dbFee":25000,"dbUsage":"25,000MB","dbUnitPrice":1000,"usageCount":5400,"usageCountLabel":"523,221嫄?,"usageUnitPrice":10,"salesRate":3,"periodSales":25000000,"bizCertPhoto":"","history":[],"billingList":[{"period":"2026.01.01-2026.01.31","monthlyFee":200000,"dbFee":250000,"dataFee":48200,"commission":500000,"total":998200,"status":"?⑸?"},{"period":"2026.02.01-2026.02.28","monthlyFee":200000,"dbFee":280000,"dataFee":52100,"commission":520000,"total":1052100,"status":"?⑸?"},{"period":"2026.03.01-2026.03.31","monthlyFee":200000,"dbFee":250000,"dataFee":49800,"commission":480000,"total":979800,"status":"泥?뎄"}]}])
  }
  if (getItem<any[]>('acct_opening_balances', []).length === 0) {
    setItem('acct_opening_balances', [{"year":2026,"accountCode":"1010","amount":5000000},{"year":2026,"accountCode":"1020","amount":50000000},{"year":2026,"accountCode":"1030","amount":2000000},{"year":2026,"accountCode":"1040","amount":1000000},{"year":2026,"accountCode":"1530","amount":3000000},{"year":2026,"accountCode":"1540","amount":10000000},{"year":2026,"accountCode":"2010","amount":5000000},{"year":2026,"accountCode":"2030","amount":3000000},{"year":2026,"accountCode":"3010","amount":50000000},{"year":2026,"accountCode":"3020","amount":13000000}])
  }

  localStorage.setItem(currentSeedVer, '1')
}

/* ?????????????????????????????????????????????
   ???
   ????????????????????????????????????????????? */
interface BudgetCatAccount {
  id: number
  bankName: string   // ?? 湲곗뾽???10110-11001-12
  cards: string[]    // ?곌껐 移대뱶 紐⑸줉
}
interface BudgetCat {
  id: string | number
  name: string
  year?: number
  bank?: string
  bankInfo?: string
  accounts?: BudgetCatAccount[]  // 蹂듭닔 怨꾩쥖
  periodFrom?: string
  periodTo?: string
  users?: string[]  // 吏異쒕떞?뱀옄 (吏곸썝 ?대쫫 紐⑸줉)
  approver?: string  // ?뱀씤?대떦??
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
  manager?: string         // ?대떦??
  approvalStatus?: string  // ?덉쓽?곹깭: ?덉쓽以鍮? ?덉쓽?꾨즺 ??
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
  applicant?: string   // ?덉쓽??
  approver?: string    // ?뱀씤??
  budgetItem?: string      // ?덉궛紐?
  budgetSubItem?: string   // ?덉궛?몃ぉ
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
  { key: 'overview',     label: '湲곕낯?꾪솴',   icon: LayoutDashboard },
  { key: 'base_budget',  label: '湲곗큹?덉궛',   icon: PieChart },
  { key: 'approval',     label: '?덉쓽?섍린',   icon: FileCheck },
  { key: 'expense',      label: '吏異쒗븯湲?,   icon: TrendingDown },
  { key: 'income',       label: '?낃툑?꾪몴',   icon: TrendingUp },
  { key: 'withdrawal',   label: '異쒓툑?꾪몴',   icon: ArrowUpCircle },
  { key: 'payment',      label: '?꾪몴?λ?',   icon: BookOpen },
  { key: 'cashflow_list', label: '?낆텧湲덈궡??, icon: ArrowLeftRight },
  { key: 'reports',      label: '?뚭퀎?꾪솴',   icon: ScrollText },
  { key: 'vendors',      label: '嫄곕옒泥섍?由?,   icon: ContactRound },
  { key: 'methodReg',    label: '?섎떒?깅줉',   icon: CreditCard },
  { key: 'budgetTree',   label: '?덉궛怨쇰ぉ',   icon: Settings },
  { key: 'hq_vendor',    label: '蹂몄궗嫄곕옒泥?,   icon: Building2 },
  { key: 'acct_mgmt',    label: '怨꾩젙愿由?,   icon: Settings2 },
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
  const year = parseInt(searchParams.get('year') || '') || parseInt(localStorage.getItem('acct_active_year') || '') || currentYear
  const selectedOverviewCatId = searchParams.get('cat') || null
  const [yearDropOpen, setYearDropOpen] = useState(false)
  const overviewCats = useMemo(() => getItem<BudgetCat[]>('acct_budget_cats', []).filter(c => {
    const cy = c.year || (c.periodFrom ? parseInt(c.periodFrom.substring(0,4)) : currentYear)
    return cy === year
  }), [year])

  useEffect(() => {
    // ?쒕쾭?먯꽌 ?ㅼ젙 濡쒕뱶 ???쒕뱶 珥덇린??
    loadSettingsFromServer().finally(() => {
      initAccountingSeed()
    })
  }, [])

  // ?? 沅뚰븳 ?녿뒗 ???묎렐 ??由щ뵒?됲듃 ??
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




      {/* ?? ?쒕툕 ?섏씠吏 ?뚮뜑 ?? */}
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

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
   湲곕낯?꾪솴 (Overview)
   ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??*/
function AcctOverview({ year, selectedCatId }: { year: number; selectedCatId: string | number | null }) {
  const budgetCats = useMemo(() => getItem<BudgetCat[]>('acct_budget_cats', []), [])
  const budgets = useMemo(() => getItem<BudgetItem[]>('acct_budgets', []), [])
  const cashflows = useMemo(() => getItem<CashFlow[]>('acct_cashflows', []), [])
  const approvals = useMemo(() => getItem<Approval[]>('acct_approvals', []), [])
  const vouchers = useMemo(() => getItem<Voucher[]>('acct_vouchers', []), [])
  const user = useAuthStore(s => s.user)

  const selectedOverviewCatId = selectedCatId

  // ?덉궛 ?묎렐 沅뚰븳 ?뺤씤
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

  /* ?? ?곕룄蹂??꾪꽣 ?? */
  const allYearCats = budgetCats.filter(cat => {
    const catYear = cat.year || (cat.periodFrom ? parseInt(cat.periodFrom.substring(0, 4)) : new Date().getFullYear())
    return catYear === year
  })
  // 紐⑤뱺 移댄뀒怨좊━ ?쒖떆 (?대┃ 媛???щ????뚮뜑留곸뿉??媛쒕퀎 泥댄겕)
  const yearCats = allYearCats
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
  const totalIncomeAll = yearCashflows.filter(c => c.type === 'income').reduce((a, c) => a + (c.amount || 0), 0)
  const totalExpenseAll = yearCashflows.filter(c => c.type === 'expense').reduce((a, c) => a + (c.amount || 0), 0)
  const pendingCount = yearApprovals.filter(a => a.status === 'pending').length
  const totalBudgetAmt = filteredBudgets.reduce((a, b) => a + (b.amount || 0), 0)
  const totalBudgetSpent = filteredBudgets.reduce((a, b) => a + (b.spent || 0), 0)
  const budgetRate = totalBudgetAmt > 0 ? Math.round(totalBudgetSpent / totalBudgetAmt * 100) : 0

  // ?덉궛援щ텇 ?좏깮 ???대떦 ?덉궛???⑷퀎留??쒖떆, ?꾩껜 ??罹먯떆?뚮줈 ?⑷퀎 ?쒖떆
  const displayIncome = selectedOverviewCatId ? totalBudgetAmt : totalIncomeAll
  const displayExpense = selectedOverviewCatId ? totalBudgetSpent : totalExpenseAll
  const displayBalance = selectedOverviewCatId ? (totalBudgetAmt - totalBudgetSpent) : (totalIncomeAll - totalExpenseAll)

  const statCards = [
    { icon: ArrowDownCircle, label: selectedOverviewCatId ? '珥??덉궛' : '珥??섏엯', value: `${formatNumber(displayIncome)}??, color: '#22c55e' },
    { icon: ArrowUpCircle, label: selectedOverviewCatId ? '珥?吏묓뻾' : '珥?吏異?, value: `${formatNumber(displayExpense)}??, color: '#ef4444' },
    { icon: Banknote, label: selectedOverviewCatId ? '?붿뿬 ?덉궛' : '?붿븸', value: `${formatNumber(displayBalance)}??, color: displayBalance >= 0 ? '#4f6ef7' : '#ef4444' },
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

  const [searchParams, setSearchParams] = useSearchParams()

  /* ?곕룄 紐⑸줉 (湲곗큹?덉궛?먯꽌 ?ㅼ젙???곕룄?? */
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
    addToast('success', '?ㅼ젙 ?뚯씪(settings.json)???ㅼ슫濡쒕뱶?⑸땲?? docs/data/ ?대뜑???ｊ퀬 諛고룷?섏꽭??')
  }

  const handleServerLoad = async () => {
    const loaded = await loadSettingsFromServer()
    if (loaded) {
      addToast('success', '?쒕쾭?먯꽌 ?ㅼ젙??遺덈윭?붿뒿?덈떎. ?덈줈怨좎묠?⑸땲??')
      setTimeout(() => window.location.reload(), 1000)
    } else {
      addToast('info', '?쒕쾭????λ맂 ?ㅼ젙???녾굅???대? 理쒖떊 ?곹깭?낅땲??')
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
          addToast('success', `${count}媛??ㅼ젙??遺덈윭?붿뒿?덈떎. ?덈줈怨좎묠?⑸땲??`)
          setTimeout(() => window.location.reload(), 1000)
        } else {
          addToast('error', '?щ컮瑜??ㅼ젙 ?뚯씪???꾨떃?덈떎.')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  return (
    <div className="space-y-4">
      {/* ?? ?곗씠???숆린???? */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-sm font-extrabold text-[var(--text-primary)]">?벀 ?곗씠???숆린??/span>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">濡쒖뺄 ?ㅼ젙???쒕쾭????ν븯嫄곕굹, ?쒕쾭?먯꽌 遺덈윭?????덉뒿?덈떎</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleServerSave} className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors flex items-center gap-1">
              燧놅툘 ?쒕쾭 ???
            </button>
            <button onClick={handleServerLoad} className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center gap-1">
              燧뉛툘 ?쒕쾭?먯꽌 遺덈윭?ㅺ린
            </button>
            <button onClick={handleFileImport} className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[var(--bg-muted)] text-[var(--text-primary)] border border-[var(--border-default)] hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-1">
              ?뱛 ?뚯씪 遺덈윭?ㅺ린
            </button>
          </div>
        </div>
      </div>
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
        </div>        <div className="grid grid-cols-3 gap-4 mb-3">
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
   湲곗큹?덉궛 ???덉궛?ㅼ젙 + 湲곗큹?붿븸 ?듯빀 ?섑띁
   ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??*/
function AcctBaseBudget({ year: propYear }: { year: number }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentYear = new Date().getFullYear()
  const user = useAuthStore(s => s.user)
  const isBudgetApprover = useMemo(() => {
    const userName = user?.name || ''
    const sl = getItem<any[]>('ws_users', [])
    return sl.find(s => s.name === userName)?.approverType === 'approver'
  }, [user])

  /* ?대? ?? budget / balance */
  const [innerTab, setInnerTab] = useState<'budget' | 'balance'>('budget')
  const [yearDropOpen, setYearDropOpen] = useState(false)
  const [appliedYear, setAppliedYear] = useState<number>(() => parseInt(localStorage.getItem('acct_active_year') || '') || currentYear)

  /* ?곕룄 紐⑸줉: ?덉궛?ㅼ젙???깅줉???곕룄 + ?꾩옱 ?곕룄 + ?좏깮???곕룄 */
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

  /* + 踰꾪듉?쇰줈 ?곕룄 異붽? ???대떦 ?곕룄濡??꾪솚 */
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
      {/* ?? ?곷떒 ?ㅻ뜑: ???? */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          {/* ?대? ??*/}
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
              ?뱤 ?덉궛?ㅼ젙
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
              title={!isBudgetApprover ? '吏異쒖듅?멸텒?먮쭔 ?ъ슜 媛?? : undefined}
            >
              ?룱 湲곗큹?붿븸
            </button>
          </div>
        </div>

        {/* ?? ?곕룄 ?좏깮 + 異붽? + ?곸슜 (?곗륫) ?? */}
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
                title={!isBudgetApprover ? '吏異쒖듅?멸텒?먮쭔 ?ъ슜 媛?? : undefined}
              >
                {String(y).slice(-2)}?꾨룄
              </button>
            ))}
            <button
              onClick={isBudgetApprover ? addYear : undefined}
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${isBudgetApprover ? 'text-[var(--text-muted)] hover:bg-primary-100 hover:text-primary-600 dark:hover:bg-primary-900/30 dark:hover:text-primary-400 cursor-pointer' : 'text-[var(--text-muted)] opacity-50 cursor-not-allowed'} transition-all text-[14px] font-bold`}
              title={isBudgetApprover ? '?곕룄 異붽?' : '吏異쒖듅?멸텒?먮쭔 ?ъ슜 媛??}
            >
              +
            </button>
          </div>
          {/* ?곸슜???곕룄 ?곹깭 ?쒖떆 */}
          <button
            className="px-3 py-1.5 rounded-lg text-[12px] font-bold bg-emerald-500 text-white border border-emerald-500 shadow-sm cursor-default flex items-center gap-1"
          >
            ??{appliedYear}???곸슜??
          </button>
          {/* ?뚭퀎?꾨룄 ?곸슜 踰꾪듉 */}
          <button
            onClick={isBudgetApprover ? () => {
              localStorage.setItem('acct_active_year', String(propYear))
              setAppliedYear(propYear)
              const tab = searchParams.get('tab') || 'base_budget'
              const params: Record<string, string> = { tab, year: String(propYear) }
              setSearchParams(params)
            } : undefined}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-bold bg-primary-500 text-white border border-primary-500 ${isBudgetApprover ? 'hover:bg-primary-600 cursor-pointer' : 'opacity-50 cursor-not-allowed'} transition-all shadow-sm`}
            title={!isBudgetApprover ? '吏異쒖듅?멸텒?먮쭔 ?ъ슜 媛?? : undefined}
          >
            ?뚭퀎?꾨룄 ?곸슜
          </button>
        </div>
      </div>

      {/* ?? ??퀎 而⑦뀗痢??? */}
      {innerTab === 'budget' ? (
        <AcctBudget year={propYear} />
      ) : (
        <AcctBalance year={propYear} />
      )}
    </div>
  )
}

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
   ?덉궛?ㅼ젙 (Budget) ???덇굅??留ㅼ묶 CRUD
   ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??*/
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

  /* ?? 紐⑤떖 ?곹깭 ?? */
  const [catModalOpen, setCatModalOpen] = useState(false)
  const [catEditId, setCatEditId] = useState<string | number | null>(null)
  const [bankModalOpen, setBankModalOpen] = useState(false)
  const [bankAccounts, setBankAccounts] = useState<any[]>(() => getItem('acct_company_accounts', []))
  const [bankEditId, setBankEditId] = useState<string | number | null>(null)
  const emptyBankForm = { bankName: '', accountNumber: '', accountHolder: '', purpose: '', manager: '', memo: '', cards: [] as any[] }
  const [bankForm, setBankForm] = useState(emptyBankForm)
  const [bankAdding, setBankAdding] = useState(false)
  const [bankExpandedCards, setBankExpandedCards] = useState<Record<string, boolean>>({})
  const [bankAddingCardFor, setBankAddingCardFor] = useState<string | number | null>(null)
  const emptyCardForm = { cardName: '', cardCompany: '', cardNumber: '', cardType: '泥댄겕移대뱶', cardUser: '', expiryDate: '' }
  const [bankCardForm, setBankCardForm] = useState(emptyCardForm)
  const [catForm, setCatForm] = useState({ name: '', description: '', bank: '', accounts: [] as BudgetCatAccount[], periodFrom: `${year}-01-01`, periodTo: `${year}-12-31`, users: [] as string[], approver: '' })

  // 怨꾩쥖愿由ъ뿉???깅줉??怨꾩쥖+移대뱶 紐⑸줉
  const registeredAccounts = useMemo(() => {
    try {
      const accts = getItem<any[]>('acct_company_accounts', [])
      return accts.filter((a: any) => a.bankName || a.accountNumber).map((a: any) => ({
        ...a,
        bankName: a.bankName || '',
        accountNumber: a.accountNumber || '',
        accountHolder: a.accountHolder || '',
        cards: a.cards || []
      }))
    } catch { return [] }
  }, [catModalOpen, bankModalOpen])

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

  /* ?? ?덉궛怨쇰ぉ ?좏깮 紐⑤떖 ?? */
  const [budgetPickerOpen, setBudgetPickerOpen] = useState(false)
  const [pickerChecked, setPickerChecked] = useState<Set<string>>(new Set())
  const [pickerFilterItem, setPickerFilterItem] = useState<string | null>(null) // ?뱀젙 ?덉궛紐⑸쭔 ?쒖떆

  /* ?? ?몃씪??湲덉븸 ?몄쭛 ?? */
  const [editingAmountId, setEditingAmountId] = useState<string | number | null>(null)
  const [editingAmountVal, setEditingAmountVal] = useState('')

  /* ?? ?몄꽦/?뺤젙 鍮꾨?踰덊샇 紐⑤떖 ?? */
  const [budgetStatusModal, setBudgetStatusModal] = useState<{ catId: string | number; catName: string; newStatus: string } | null>(null)
  const [budgetStatusPw, setBudgetStatusPw] = useState('')
  const [budgetStatusPwErr, setBudgetStatusPwErr] = useState('')

  /* ?? ?숈쓽??蹂寃??? */
  const [aliasDropId, setAliasDropId] = useState<string | null>(null) // "item:?멸굔鍮? / "sub:?멸굔鍮?湲곕낯湲? / "det:?멸굔鍮?湲곕낯湲??뺢퇋吏곴린蹂멸툒"

  /* ?? ?곗씠???? */
  const budgetCats = useMemo(() => {
    const cats = getItem<BudgetCat[]>('acct_budget_cats', [])
    const yearCats = cats.filter(cat => {
      const pFrom = cat.periodFrom || ''
      const pTo = cat.periodTo || ''
      if (pFrom && pTo) {
        // ?ъ뾽湲곌컙???대떦 ?곕룄? 寃뱀튂?붿? ?뺤씤
        const yearStart = `${year}-01-01`
        const yearEnd = `${year}-12-31`
        return pFrom <= yearEnd && pTo >= yearStart
      }
      // periodFrom/To ?놁쑝硫?year ?띿꽦?쇰줈 ?대갚
      const catYear = cat.year || (pFrom ? parseInt(pFrom.substring(0, 4)) : new Date().getFullYear())
      return catYear === year
    })
    // ?덉궛?뱀씤??愿?⑥옄 ?꾪꽣
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

  // ?꾪꽣留곷맂 怨꾩젙怨쇰ぉ 由ъ뒪??
  const filteredAccounts = useMemo(() => {
    if (!acctSearch.trim()) return accounts
    const q = acctSearch.toLowerCase()
    return accounts.filter(a => a.code.includes(q) || a.name.toLowerCase().includes(q) || (a.group || '').toLowerCase().includes(q))
  }, [accounts, acctSearch])

  // ?곷?怨꾩젙 ?꾪꽣 (?먯궛쨌遺梨?怨꾩젙 ?꾩＜)
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
      const itemKey = b.itemName || '(誘몃텇瑜?'
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

  // 怨꾩젙 ??낅퀎 湲곕낯 ?곷?怨꾩젙 ?먮룞 異붿쿇
  const suggestContraAccount = (code: string): string => {
    const acct = accounts.find(a => a.code === code)
    if (!acct) return '1-01-03' // 湲곕낯: 蹂댄넻?덇툑
    switch (acct.type) {
      case 'expense': return '1-01-03'   // 鍮꾩슜 ??蹂댄넻?덇툑(?먯궛 媛먯냼)
      case 'revenue': return '1-01-03'   // ?섏씡 ??蹂댄넻?덇툑(?먯궛 利앷?)
      case 'asset': return '2-01-04'     // ?먯궛 ??誘몄?湲됯툑(遺梨?利앷?)
      case 'liability': return '1-01-01' // 遺梨????꾧툑(?먯궛 媛먯냼)
      case 'equity': return '1-01-03'    // ?먮낯 ??蹂댄넻?덇툑
      default: return '1-01-03'
    }
  }

  const colors = ['#4f6ef7', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

  /* ?? 援щ텇 CRUD ?? */
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
        // 湲곕낯 ?뱀씤沅뚯옄 + 異붽? ?뱀씤沅뚯옄瑜??⑹퀜 approvers 諛곗뿴 ?앹꽦
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

  /* ?? ?대쫫?믪썝??def ?대쫫 ?뺢퇋???? */
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

  /* ?? ?덉궛怨쇰ぉ ?좏깮 紐⑤떖 ?닿린 ?? */
  const openBudgetPicker = (filterItemName?: string) => {
    if (!selCat) return
    // ?대? ?깅줉????ぉ?ㅼ쓣 泥댄겕 ?곹깭濡?珥덇린??(?뺢퇋?붾맂 ???ъ슜)
    const checked = new Set<string>()
    filtered.forEach(b => {
      checked.add(buildNormalizedKey(b))
    })
    setPickerChecked(checked)
    // ?꾪꽣 ?대쫫???뺢퇋??
    setPickerFilterItem(filterItemName ? normalizeItemName(filterItemName) : null)
    setBudgetPickerOpen(true)
  }

  /* ?? ?덉궛怨쇰ぉ ?좏깮 ?곸슜 ?? */
  const applyBudgetPicker = () => {
    if (!selCat) return
    const all = getItem<BudgetItem[]>('acct_budgets', [])
    const catBudgets = all.filter(b => String(b.catId) === String(selCat.id))
    const otherBudgets = all.filter(b => String(b.catId) !== String(selCat.id))

    // 湲곗〈 ??ぉ???뺢퇋?붾맂 ??留?
    const existingKeys = new Map<string, BudgetItem>()
    catBudgets.forEach(b => {
      existingKeys.set(buildNormalizedKey(b), b)
    })

    const newBudgets: BudgetItem[] = []
    pickerChecked.forEach(key => {
      if (existingKeys.has(key)) {
        // 湲곗〈 ??ぉ ?좎? (?꾩옱 ?쒖떆 ?대쫫 洹몃?濡?
        newBudgets.push(existingKeys.get(key)!)
        existingKeys.delete(key)
      } else {
        // ?덈줈 異붽?: ?덉궛怨쇰ぉ?먯꽌 怨꾩젙怨쇰ぉ ?먮룞 ?곌껐
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

  /* ?? ?몃씪??湲덉븸 ?몄쭛 ????? */
  const saveInlineAmount = (budgetId: string | number) => {
    const amt = parseInt(editingAmountVal.replace(/,/g, '')) || 0
    const all = getItem<BudgetItem[]>('acct_budgets', [])
    const updated = all.map(b => b.id === budgetId ? { ...b, amount: amt } : b)
    localStorage.setItem('acct_budgets', JSON.stringify(updated))
    setEditingAmountId(null)
    setEditingAmountVal('')
    setRefresh(r => r + 1)
  }

  /* ?? 湲덉븸 ?щ㎎ ?낅젰 ?? */
  const handleAmountInput = (val: string) => {
    const digits = val.replace(/[^\d]/g, '')
    setBudgetForm(f => ({ ...f, amount: digits ? Number(digits).toLocaleString('ko-KR') : '' }))
  }

  /* ?? ?숈쓽?대줈 ?대쫫 蹂寃??? */
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

  /* ?숈쓽??紐⑸줉 媛?몄삤湲?*/
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
  /* 吏異쒕떞?뱀옄 ?щ?: ?꾩옱 ?좏깮 移댄뀒怨좊━??users濡??깅줉???ъ슜??*/
  const isExpenseManager = useMemo(() => {
    if (!selCat) return false
    const userName = user?.name || ''
    return selCat.users?.includes(userName) || false
  }, [selCat, user])
  /* ?덉궛媛??섏젙 媛???щ?: (?뱀씤沅뚯옄 ?먮뒗 吏異쒕떞?뱀옄) + ?뺤젙 ?꾨땶 ?곹깭 */
  const isConfirmed = (selCat as any)?.budgetStatus === 'confirmed'
  const canEditValues = (isBudgetApprover || isExpenseManager) && !isConfirmed

  /* 鍮꾩듅?멸텒???대┃ 李⑤떒 ?몃뱾??(援щ텇 異붽?/??젣 ??援ъ“ 蹂寃? */
  const guardClick = (fn: () => void) => {
    if (!isBudgetApprover || isConfirmed) return () => {}
    return fn
  }
  const guardBtnClass = (!isBudgetApprover || isConfirmed) ? ' opacity-50 cursor-not-allowed' : ' cursor-pointer'
  /* ?덉궛媛??섏젙???몃뱾??(?뱀씤沅뚯옄 + 吏異쒕떞?뱀옄 紐⑤몢 媛?? */
  const guardEditClick = (fn: () => void) => {
    if (!canEditValues) return () => {}
    return fn
  }
  const guardEditBtnClass = !canEditValues ? ' opacity-50 cursor-not-allowed' : ' cursor-pointer'

  return (
    <div className="space-y-4">
      {/* ?? ?덉궛援щ텇 愿由??? */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[var(--text-primary)]">
            <PieChart size={16} className="text-primary-500" /> ?덉궛援щ텇 愿由?
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBankModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[12px] font-bold text-[var(--text-secondary)] hover:border-blue-400 hover:text-blue-500 cursor-pointer transition-all"
            >
              <Landmark size={12} /> 怨꾩쥖愿由?
            </button>
            <button
              onClick={isBudgetApprover ? () => openCatModal() : undefined}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[12px] font-bold text-[var(--text-secondary)] ${isBudgetApprover ? 'hover:border-primary-400 hover:text-primary-500 cursor-pointer' : 'opacity-50 cursor-not-allowed'} transition-all`}
              title={!isBudgetApprover ? '吏異쒖듅?멸텒?먮쭔 ?ъ슜 媛?? : undefined}
            >
              <Plus size={12} /> 援щ텇 異붽?
            </button>
          </div>
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
                  {/* ?섏젙 / ??젣 / ?몄꽦쨌?뺤젙 */}
                  <div className="flex border-t border-[var(--border-default)]">
                    <button
                      onClick={e => { e.stopPropagation(); if (isBudgetApprover && (cat as any).budgetStatus !== 'confirmed') openCatModal(cat.id) }}
                      className={`flex-1 py-2 text-[11px] font-bold text-[var(--text-secondary)] ${isBudgetApprover && (cat as any).budgetStatus !== 'confirmed' ? 'hover:bg-[var(--bg-muted)] cursor-pointer' : 'opacity-50 cursor-not-allowed'} transition-colors border-r border-[var(--border-default)]`}
                    >
                      ?섏젙
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); if (isBudgetApprover && (cat as any).budgetStatus !== 'confirmed') deleteCat(cat.id) }}
                      className={`flex-1 py-2 text-[11px] font-bold text-danger ${isBudgetApprover && (cat as any).budgetStatus !== 'confirmed' ? 'hover:bg-[var(--bg-muted)] cursor-pointer' : 'opacity-50 cursor-not-allowed'} transition-colors border-r border-[var(--border-default)]`}
                    >
                      ??젣
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
                      {(cat as any).budgetStatus === 'confirmed' ? '???뺤젙' : '?뱷 ?몄꽦'}
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
              {isConfirmed && (
                <span className="text-[10px] font-bold text-[#22c55e] bg-green-100 dark:bg-green-900/20 px-2 py-0.5 rounded-full">???뺤젙??쨌 ?섏젙遺덇?</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={guardEditClick(() => openBudgetPicker())}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-500 text-white text-[12px] font-bold ${canEditValues ? 'hover:bg-primary-600' : 'opacity-50'} transition-all${guardEditBtnClass}`}
                title={!canEditValues ? '吏異쒖듅?멸텒???먮뒗 吏異쒕떞?뱀옄留??ъ슜 媛?? : undefined}
              >
                <Plus size={12} /> ?덉궛怨쇰ぉ ?좏깮
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-8 text-center">
              <EmptyState emoji="?뱥" title="?덉궛怨쇰ぉ???좏깮?섏꽭?? />
              <p className="text-[11px] text-[var(--text-muted)] mt-1">"?덉궛怨쇰ぉ ?좏깮" 踰꾪듉?쇰줈 ??ぉ??異붽??섏꽭??/p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="bg-[var(--bg-muted)]">
                    {['?덉궛??ぉ', '?먮룞遺꾧컻', '?몄꽦??, '吏묓뻾??, '?붿뿬', '?뚯쭊??, '愿由?].map(h => (
                      <th key={h} className={cn("py-2.5 px-3.5 text-[11px] font-bold text-[var(--text-muted)]", h === '愿由? ? 'text-center w-[80px]' : 'text-left')}>{h}</th>
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

                    {/* ??? 1?곸뒪: ?덉궛紐??뚭퀎 ??? */}
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
                            {hasSubs && <span className="text-[9px] font-bold text-primary-500 bg-primary-100 dark:bg-primary-900/20 px-1.5 py-0.5 rounded">{itemGroup.subs.size}媛??몃ぉ</span>}
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
                              >{formatNumber(itemAmt)}??/span>
                            )
                          ) : (
                            <span className="text-[12px] font-extrabold text-[var(--text-primary)]">{formatNumber(itemAmt)}??/span>
                          )}
                        </td>
                        <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-danger text-right">{formatNumber(itemSpent)}??/td>
                        <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-right" style={{ color: itemRemain < 0 ? '#ef4444' : '#22c55e' }}>{formatNumber(itemRemain)}??/td>
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
                              <button onClick={guardClick(() => deleteBudgetItem(itemGroup.budgets[0].id as number))} className={`w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-muted)] ${isBudgetApprover ? 'hover:bg-red-100 hover:text-danger cursor-pointer' : 'opacity-50 cursor-not-allowed'} transition-all`} title="??젣"><Trash2 size={12} /></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )

                    {/* ??? 2?곸뒪: ?몃ぉ ??? */}
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
                                <span className="text-[10px] text-primary-400">??/span>
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
                                {hasDetails && <span className="text-[8px] font-bold text-violet-500 bg-violet-50 dark:bg-violet-900/20 px-1 py-px rounded">{subGroup.details.size}嫄?/span>}
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
                                  >{formatNumber(subAmt)}??/span>
                                )
                              ) : (
                                <span className="text-[11px] font-bold text-[var(--text-secondary)]">{formatNumber(subAmt)}??/span>
                              )}
                            </td>
                            <td className="py-2 px-3.5 text-[11px] font-bold text-danger/80 text-right">{formatNumber(subSpent)}??/td>
                            <td className="py-2 px-3.5 text-[11px] font-bold text-right" style={{ color: subRemain < 0 ? '#ef4444' : '#22c55e' }}>{formatNumber(subRemain)}??/td>
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
                                  <button onClick={guardClick(() => deleteBudgetItem(subGroup.budgets[0].id as number))} className={`w-5 h-5 rounded flex items-center justify-center text-[var(--text-muted)] ${isBudgetApprover ? 'hover:bg-red-100 hover:text-danger cursor-pointer' : 'opacity-50 cursor-not-allowed'} transition-all`} title="??젣"><Trash2 size={10} /></button>
                                </div>
                              )}
                            </td>
                          </tr>
                        )

                        {/* ??? 3?곸뒪: ?몄꽭??ぉ ??? */}
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
                                    <span className="text-[9px] text-violet-400">??/span>
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
                                      <span className="font-bold text-[#4f6ef7]">李?/span>
                                      <span className="font-mono text-[var(--text-muted)]">{firstB.accountCode}</span>
                                      <span className="text-[var(--text-muted)]">??/span>
                                      <span className="font-bold text-[#ef4444]">?</span>
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
                                      >{formatNumber(detAmt)}??/span>
                                    )
                                  ) : (
                                    <span className="text-[10px] font-semibold text-[var(--text-muted)]">{formatNumber(detAmt)}??/span>
                                  )}
                                </td>
                                <td className="py-1.5 px-3.5 text-[10px] font-semibold text-danger/60 text-right">{formatNumber(detSpent)}??/td>
                                <td className="py-1.5 px-3.5 text-[10px] font-semibold text-right" style={{ color: detRemain < 0 ? '#ef4444' : '#22c55e' }}>{formatNumber(detRemain)}??/td>
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
                                      <button onClick={guardClick(() => deleteBudgetItem(dBudgets[0].id as number))} className={`w-5 h-5 rounded flex items-center justify-center text-[var(--text-muted)] ${isBudgetApprover ? 'hover:bg-red-100 hover:text-danger cursor-pointer' : 'opacity-50 cursor-not-allowed'} transition-all`} title="??젣"><Trash2 size={10} /></button>
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
                    <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-[var(--text-primary)]">?⑷퀎</td>
                    <td />
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
         紐⑤떖: ?몄꽦/?뺤젙 鍮꾨?踰덊샇 ?몄쬆
         ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??*/}
      {budgetStatusModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={() => setBudgetStatusModal(null)}>
          <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-[380px] mx-4 border border-[var(--border-default)]" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-[var(--border-default)]">
              <h3 className="text-base font-extrabold text-[var(--text-primary)]">
                {budgetStatusModal.newStatus === 'confirmed' ? '?뵏 ?덉궛 ?뺤젙' : '?뵑 ?뺤젙 ?댁젣'}
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                {budgetStatusModal.newStatus === 'confirmed'
                  ? `"${budgetStatusModal.catName}" ?덉궛???뺤젙?⑸땲??\n?뺤젙 ?꾩뿉???꾧뎄???덉궛???섏젙쨌??젣?????놁뒿?덈떎.`
                  : `"${budgetStatusModal.catName}" ?덉궛 ?뺤젙???댁젣?⑸땲??\n?몄꽦 ?곹깭濡?蹂寃쏀븯硫??섏젙??媛?ν빐吏묐땲??`}
              </p>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">鍮꾨?踰덊샇 ?뺤씤 *</label>
                <input
                  type="password"
                  autoFocus
                  value={budgetStatusPw}
                  onChange={e => { setBudgetStatusPw(e.target.value); setBudgetStatusPwErr('') }}
                  onKeyDown={e => { if (e.key === 'Enter') { (e.target as HTMLInputElement).blur(); document.getElementById('btn-budget-status-confirm')?.click() } }}
                  placeholder="鍮꾨?踰덊샇瑜??낅젰?섏꽭??
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none"
                />
                {budgetStatusPwErr && <p className="text-[10px] text-danger mt-1">{budgetStatusPwErr}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-[var(--border-default)]">
              <button
                onClick={() => setBudgetStatusModal(null)}
                className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] cursor-pointer"
              >痍⑥냼</button>
              <button
                id="btn-budget-status-confirm"
                onClick={() => {
                  if (!budgetStatusPw.trim()) { setBudgetStatusPwErr('鍮꾨?踰덊샇瑜??낅젰?댁＜?몄슂'); return }
                  const staffList = getItem<any[]>('ws_users', [])
                  const userName = user?.name || ''
                  const me = staffList.find(s => s.name === userName)
                  if (!me || me.pw !== budgetStatusPw) { setBudgetStatusPwErr('鍮꾨?踰덊샇媛 ?쇱튂?섏? ?딆뒿?덈떎'); return }
                  const cats = getItem<BudgetCat[]>('acct_budget_cats', [])
                  const updated = cats.map(c => String(c.id) === String(budgetStatusModal.catId) ? { ...c, budgetStatus: budgetStatusModal.newStatus } : c)
                  setItem('acct_budget_cats', updated)
                  setRefresh(r => r + 1)
                  setBudgetStatusModal(null)
                  setBudgetStatusPw('')
                }}
                className={`px-4 py-2 rounded-lg text-white text-sm font-bold cursor-pointer ${budgetStatusModal.newStatus === 'confirmed' ? 'bg-[#22c55e] hover:bg-[#16a34a]' : 'bg-[#f59e0b] hover:bg-[#d97706]'}`}
              >
                {budgetStatusModal.newStatus === 'confirmed' ? '?뺤젙' : '?댁젣'}
              </button>
            </div>
          </div>
        </div>
      , document.body)}

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
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">?덉궛?ㅻ챸</label>
                <textarea
                  value={catForm.description}
                  onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="?덉궛援щ텇??????ㅻ챸???낅젰?섏꽭??
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors resize-none"
                />
              </div>
              {/* ?듭옣/怨꾩쥖 愿由?*/}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-[var(--text-muted)]">
                    ?듭옣/怨꾩쥖
                    {catForm.accounts.length > 0 && <span className="ml-1 text-[9px] bg-blue-100 dark:bg-blue-900/20 text-blue-600 px-1.5 py-0.5 rounded">{catForm.accounts.length}媛?/span>}
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
                        + 怨꾩쥖 ?좏깮
                      </button>
                    </div>
                  ) : (
                    <span className="text-[9px] text-[var(--text-muted)]">怨꾩쥖愿由ъ뿉??怨꾩쥖瑜?癒쇱? ?깅줉?섏꽭??/span>
                  )}
                </div>
                {catForm.accounts.length === 0 ? (
                  <div className="text-center text-[11px] text-[var(--text-muted)] py-3 border border-dashed border-[var(--border-default)] rounded-lg">?깅줉??怨꾩쥖媛 ?놁뒿?덈떎</div>
                ) : (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {catForm.accounts.map((acct, ai) => {
                      // ?꾩옱 怨꾩쥖??留ㅼ묶?섎뒗 ?깅줉 怨꾩쥖 李얘린
                      const matchedRA = registeredAccounts.find((ra: any) => `${ra.bankName || ''} ${ra.accountNumber || ''}`.trim() === acct.bankName)
                      const availableCards: any[] = matchedRA?.cards || []
                      return (
                        <div key={acct.id} className="border border-[var(--border-default)] rounded-lg p-2.5 bg-[var(--bg-muted)]/30">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-[9px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">怨꾩쥖 {ai + 1}</span>
                            <select
                              value={acct.bankName}
                              onChange={e => {
                                const v = e.target.value
                                setCatForm(f => ({ ...f, accounts: f.accounts.map((a, i) => i === ai ? { ...a, bankName: v, cards: [] } : a) }))
                              }}
                              className="flex-1 px-2 py-1.5 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] text-[12px] text-[var(--text-primary)] outline-none focus:border-primary-400"
                            >
                              <option value="">怨꾩쥖 ?좏깮</option>
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
                          {/* ?곌껐 移대뱶 */}
                          <div className="pl-4">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[9px] font-bold text-[var(--text-muted)]">?곌껐 移대뱶{acct.cards.length > 0 && <span className="ml-1 text-[9px] bg-amber-100 dark:bg-amber-900/20 text-amber-600 px-1 py-0.5 rounded">{acct.cards.length}</span>}</span>
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
                                    <option value="">+ 移대뱶 ?곌껐</option>
                                    {unlinked.map((card: any) => {
                                      const cardLabel = `${card.cardName || ''} ${card.cardNumber || ''}`.trim()
                                      return <option key={card.id} value={cardLabel}>{card.cardName || '移대뱶'} {card.cardNumber || ''} {card.cardUser ? `(${card.cardUser})` : ''}</option>
                                    })}
                                  </select>
                                )
                              })()}
                            </div>
                            {acct.cards.length === 0 ? (
                              <div className="text-[10px] text-[var(--text-muted)]/60 py-1">{acct.bankName ? (availableCards.length > 0 ? '?곌껐??移대뱶 ?놁쓬' : '?깅줉??移대뱶 ?놁쓬') : '怨꾩쥖瑜?癒쇱? ?좏깮?섏꽭??}</div>
                            ) : (
                              <div className="space-y-1">
                                {acct.cards.map((cardLabel, ci) => (
                                  <div key={ci} className="flex items-center gap-1.5 text-[11px] text-[var(--text-primary)] bg-amber-50/50 dark:bg-amber-900/10 rounded px-2 py-1">
                                    <span className="text-[9px] text-amber-500">?뮩</span>
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
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">?쒖옉??/label>
                  <DatePicker value={catForm.periodFrom} onChange={v => setCatForm(f => ({ ...f, periodFrom: v }))} />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">醫낅즺??/label>
                  <DatePicker value={catForm.periodTo} onChange={v => setCatForm(f => ({ ...f, periodTo: v }))} />
                </div>
              </div>
              {/* 吏異쒕떞?뱀옄 */}
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1.5 block">
                  吏異쒕떞?뱀옄
                </label>
                <select
                  value={catForm.users[0] || ''}
                  onChange={e => {
                    setCatForm(f => ({ ...f, users: e.target.value ? [e.target.value] : [] }))
                  }}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors"
                >
                  <option value="">?좏깮?섏꽭??/option>
                  {staffListForBudget.map(s => (
                    <option key={s.id || s.name} value={s.name}>{s.name} {s.position || ''} {s.department || ''}</option>
                  ))}
                </select>
              </div>
              {/* ?뱀씤?대떦??*/}
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1.5 block">
                  ?뱀씤?대떦??
                </label>
                {(() => {
                  const defaultApprover = staffListForBudget.find(s => (s as any).approverType === 'approver')
                  const defaultApproverName = defaultApprover?.name || ''
                  return (
                    <>
                      {defaultApprover ? (
                        <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-lg bg-primary-50 dark:bg-primary-900/10 border border-primary-200 dark:border-primary-800">
                          <span className="text-[10px] font-bold text-primary-500 bg-primary-100 dark:bg-primary-900/20 px-1.5 py-0.5 rounded">湲곕낯</span>
                          <span className="text-[13px] font-bold text-primary-600">{defaultApprover.name}</span>
                          <span className="text-[10px] text-[var(--text-muted)]">{defaultApprover.position || ''} {(defaultApprover as any).department || ''}</span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-[var(--text-muted)] px-3 py-2 mb-2 rounded-lg border border-dashed border-[var(--border-default)]">湲곕낯?뱀씤?대떦?먭? ?ㅼ젙?섏? ?딆븯?듬땲??/div>
                      )}
                      <select
                        value={catForm.approver}
                        onChange={e => setCatForm(f => ({ ...f, approver: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors"
                      >
                        <option value="">異붽??뱀씤?대떦?먮? ?좏깮?섏꽭??/option>
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
              <button onClick={() => setCatModalOpen(false)} className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer">痍⑥냼</button>
              <button onClick={saveCat} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-bold hover:bg-primary-600 transition-colors cursor-pointer">???/button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
         紐⑤떖: ?뚯궗 怨꾩쥖쨌移대뱶 愿由?
         ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??*/}
      {bankModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={() => setBankModalOpen(false)}>
          <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-3xl mx-4 border border-[var(--border-default)] max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* ?ㅻ뜑 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)] rounded-t-2xl" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)' }}>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2"><Landmark size={18} /> ?뚯궗 怨꾩쥖쨌移대뱶 愿由?/h3>
              <button onClick={() => setBankModalOpen(false)} className="text-white/80 hover:text-white text-lg cursor-pointer transition-colors">??/button>
            </div>
            {/* 蹂몃Ц + ?섎떒 */}
            {(() => {
                const accounts = bankAccounts
                const setAccounts = setBankAccounts
                const editId = bankEditId
                const setEditId = setBankEditId
                const form = bankForm
                const setForm = setBankForm
                const adding = bankAdding
                const setAdding = setBankAdding
                const expandedCards = bankExpandedCards
                const setExpandedCards = setBankExpandedCards
                const addingCardFor = bankAddingCardFor
                const setAddingCardFor = setBankAddingCardFor
                const cardForm = bankCardForm
                const setCardForm = setBankCardForm

                const save = (list: typeof accounts) => { setAccounts(list); setItem('acct_company_accounts', list) }
                const toggleCards = (id: string | number) => setExpandedCards(p => ({ ...p, [String(id)]: !p[String(id)] }))
                const startAdd = () => { setAdding(true); setEditId(null); setForm(emptyBankForm) }
                const startEdit = (acc: typeof accounts[0]) => { setEditId(acc.id); setAdding(false); setForm({ bankName: acc.bankName, accountNumber: acc.accountNumber, accountHolder: acc.accountHolder, purpose: acc.purpose, manager: acc.manager, memo: acc.memo, cards: acc.cards || [] }) }
                const cancelEdit = () => { setEditId(null); setAdding(false); setForm(emptyBankForm) }

                const saveAccount = () => {
                  if (!form.bankName.trim() || !form.accountNumber.trim()) return
                  if (editId !== null) {
                    save(accounts.map(a => String(a.id) === String(editId) ? { ...a, ...form } : a))
                  } else {
                    save([...accounts, { id: Date.now(), ...form }])
                  }
                  cancelEdit()
                }
                const deleteAccount = (id: string | number) => { if (confirm('??怨꾩쥖瑜???젣?섏떆寃좎뒿?덇퉴?')) save(accounts.filter(a => String(a.id) !== String(id))) }

                const addCard = (acctId: string | number) => {
                  if (!cardForm.cardName.trim() || !cardForm.cardNumber.trim()) return
                  save(accounts.map(a => String(a.id) === String(acctId) ? { ...a, cards: [...(a.cards || []), { id: Date.now(), ...cardForm }] } : a))
                  setCardForm(emptyCardForm); setAddingCardFor(null)
                }
                const deleteCard = (acctId: string | number, cardId: string | number) => {
                  save(accounts.map(a => String(a.id) === String(acctId) ? { ...a, cards: (a.cards || []).filter(c => String(c.id) !== String(cardId)) } : a))
                }

                const renderForm = (isNew: boolean) => (
                  <div className="bg-[var(--bg-muted)] border border-[var(--border-default)] rounded-xl p-4 space-y-3">
                    <div className="text-sm font-extrabold text-[var(--text-primary)] mb-2">{isNew ? '??怨꾩쥖 異붽?' : '怨꾩쥖 ?섏젙'}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="relative">
                        <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">??됰챸 *</label>
                        <input value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} placeholder="?좏깮 ?먮뒗 吏곸젒 ?낅젰" className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors" onFocus={e => { const dd = e.currentTarget.nextElementSibling as HTMLElement; if (dd) dd.style.display = 'block' }} onBlur={() => setTimeout(() => { const dd = document.getElementById('bank-dropdown'); if (dd) dd.style.display = 'none' }, 150)} />
                        <div id="bank-dropdown" style={{ display: 'none' }} className="absolute z-50 top-full left-0 right-0 mt-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg shadow-lg max-h-40 overflow-y-auto">
                          {(() => {
                            const defaultBanks = ['援?????, '?좏븳???, '?곕━???, '?섎굹???, '?랁삊???, 'SC?쒖씪???, '湲곗뾽???, '移댁뭅?ㅻ콉??, '?좎뒪諭낇겕', '耳?대콉??, '?援ъ???, '遺?곗???, '寃쎈궓???, '愿묒＜???, '?꾨턿???, '?쒖＜???, '?섑삊???, '?곗뾽???, '?덈쭏?꾧툑怨?, '?좏삊', '?곗껜援?]
                            const custom = accounts.map(a => a.bankName).filter(Boolean)
                            const all = Array.from(new Set([...defaultBanks, ...custom]))
                            const filtered = all.filter(b => !form.bankName || b.includes(form.bankName))
                            if (filtered.length === 0) return <div className="px-3 py-2 text-xs text-[var(--text-muted)]">吏곸젒 ?낅젰?섏꽭??/div>
                            return filtered.map(b => (
                              <button key={b} type="button" onMouseDown={e => { e.preventDefault(); setForm(f => ({ ...f, bankName: b })); const dd = document.getElementById('bank-dropdown'); if (dd) dd.style.display = 'none' }} className="w-full text-left px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer transition-colors">
                                {b}
                              </button>
                            ))
                          })()}
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">怨꾩쥖踰덊샇 *</label>
                        <input value={form.accountNumber} onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))} placeholder="000-000-000000" className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors" />
                      </div>
                      <div className="relative">
                        <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">?덇툑二?/label>
                        <input value={form.accountHolder} onChange={e => setForm(f => ({ ...f, accountHolder: e.target.value }))} placeholder="?좏깮 ?먮뒗 吏곸젒 ?낅젰" className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors" onFocus={e => { const dd = e.currentTarget.nextElementSibling as HTMLElement; if (dd) dd.style.display = 'block' }} onBlur={() => setTimeout(() => { const dd = document.getElementById('holder-dropdown'); if (dd) dd.style.display = 'none' }, 150)} />
                        <div id="holder-dropdown" style={{ display: 'none' }} className="absolute z-50 top-full left-0 right-0 mt-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg shadow-lg max-h-32 overflow-y-auto">
                          {(() => {
                            const holders = Array.from(new Set(accounts.map(a => a.accountHolder).filter(Boolean)))
                            const filtered = holders.filter(h => !form.accountHolder || h.includes(form.accountHolder))
                            if (filtered.length === 0) return <div className="px-3 py-2 text-xs text-[var(--text-muted)]">吏곸젒 ?낅젰?섏꽭??/div>
                            return filtered.map(h => (
                              <button key={h} type="button" onMouseDown={e => { e.preventDefault(); setForm(f => ({ ...f, accountHolder: h })); const dd = document.getElementById('holder-dropdown'); if (dd) dd.style.display = 'none' }} className="w-full text-left px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer transition-colors">
                                {h}
                              </button>
                            ))
                          })()}
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">?⑸룄</label>
                        <input value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} placeholder="?댁쁺鍮? ?멸굔鍮??? className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors" />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">硫붾え</label>
                        <input value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))} placeholder="鍮꾧퀬" className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button onClick={cancelEdit} className="px-3 py-1.5 rounded-lg border border-[var(--border-default)] text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer">痍⑥냼</button>
                      <button onClick={saveAccount} className="px-3 py-1.5 rounded-lg bg-primary-500 text-white text-xs font-bold hover:bg-primary-600 transition-colors cursor-pointer">???/button>
                    </div>
                  </div>
                )

                return (
                  <>
                    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                      {accounts.length === 0 && !adding && (
                        <div className="text-center py-10 text-[var(--text-muted)] text-sm">
                          <Landmark size={32} className="mx-auto mb-2 opacity-40" />
                          ?깅줉??怨꾩쥖媛 ?놁뒿?덈떎
                        </div>
                      )}

                      {accounts.map(acc => (
                        editId !== null && String(editId) === String(acc.id) ? (
                          <div key={acc.id}>{renderForm(false)}</div>
                        ) : (
                          <div key={acc.id} className="border border-[var(--border-default)] rounded-xl overflow-hidden bg-[var(--bg-surface)] hover:border-blue-300 transition-colors">
                            {/* 怨꾩쥖 ?뺣낫 */}
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
                                {acc.accountHolder && <span>?덇툑二? <b>{acc.accountHolder}</b></span>}
                                {acc.purpose && <span>?⑸룄: {acc.purpose}</span>}

                                {acc.memo && <span className="text-[var(--text-muted)]">({acc.memo})</span>}
                              </div>
                            </div>
                            {/* ?곌껐移대뱶 ?꾩퐫?붿뼵 */}
                            <div className="border-t border-[var(--border-default)]">
                              <button onClick={() => toggleCards(acc.id)} className="w-full flex items-center justify-between px-4 py-2 text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] cursor-pointer transition-colors">
                                <span className="flex items-center gap-1"><CreditCard size={12} /> ?곌껐 移대뱶 ({(acc.cards || []).length})</span>
                                {expandedCards[String(acc.id)] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                              {expandedCards[String(acc.id)] && (
                                <div className="px-4 pb-3 space-y-2">
                                  {(acc.cards || []).length === 0 && String(addingCardFor) !== String(acc.id) && (
                                    <div className="text-xs text-[var(--text-muted)] text-center py-2">?곌껐??移대뱶媛 ?놁뒿?덈떎</div>
                                  )}
                                  {(acc.cards || []).map(card => (
                                    <div key={card.id} className="flex items-center justify-between bg-[var(--bg-muted)] rounded-lg px-3 py-2">
                                      <div className="flex items-center gap-2 text-xs flex-wrap">
                                        <CreditCard size={12} className="text-violet-500" />
                                        <span className="font-bold text-[var(--text-primary)]">{card.cardName}</span>
                                        <span className="text-[var(--text-muted)] font-mono">{card.cardNumber}</span>
                                        <span className="text-[var(--text-secondary)]">{card.cardCompany}</span>
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${card.cardType === '?좎슜移대뱶' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>{card.cardType}</span>
                                        {card.cardUser && <span className="text-[var(--text-muted)]">({card.cardUser})</span>}
                                        {card.expiryDate && <span className="text-[var(--text-muted)]">{card.expiryDate}</span>}
                                      </div>
                                      <button onClick={() => deleteCard(acc.id, card.id)} className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-[var(--text-muted)] hover:text-red-500 cursor-pointer transition-colors"><Trash2 size={11} /></button>
                                    </div>
                                  ))}
                                  {String(addingCardFor) === String(acc.id) ? (
                                    <div className="bg-[var(--bg-surface)] border border-dashed border-[var(--border-default)] rounded-lg p-3 space-y-2">
                                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        <input value={cardForm.cardName} onChange={e => setCardForm(f => ({ ...f, cardName: e.target.value }))} placeholder="移대뱶紐?*" className="px-2 py-1.5 rounded border border-[var(--border-default)] bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] focus:border-primary-500 outline-none" />
                                        <div className="relative">
                                          <input value={cardForm.cardCompany} onChange={e => setCardForm(f => ({ ...f, cardCompany: e.target.value }))} placeholder="?좏깮/?낅젰" className="w-full px-2 py-1.5 rounded border border-[var(--border-default)] bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] focus:border-primary-500 outline-none" onFocus={e => { const dd = e.currentTarget.nextElementSibling as HTMLElement; if (dd) dd.style.display = 'block' }} onBlur={() => setTimeout(() => { const dd = document.getElementById('cardco-dropdown'); if (dd) dd.style.display = 'none' }, 150)} />
                                          <div id="cardco-dropdown" style={{ display: 'none' }} className="absolute z-50 top-full left-0 right-0 mt-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg shadow-lg max-h-32 overflow-y-auto">
                                            {(() => {
                                              const defaults = ['援??移대뱶', '?좏븳移대뱶', '?쇱꽦移대뱶', '?꾨?移대뱶', '濡?뜲移대뱶', '?곕━移대뱶', '?섎굹移대뱶', 'BC移대뱶', 'NH?랁삊移대뱶', '移댁뭅?ㅻ콉??]
                                              const custom = accounts.flatMap(a => (a.cards || []).map((c: any) => c.cardCompany)).filter(Boolean)
                                              const all = Array.from(new Set([...defaults, ...custom]))
                                              const filtered = all.filter(c => !cardForm.cardCompany || c.includes(cardForm.cardCompany))
                                              if (filtered.length === 0) return <div className="px-2 py-1.5 text-[10px] text-[var(--text-muted)]">吏곸젒 ?낅젰</div>
                                              return filtered.map(c => (
                                                <button key={c} type="button" onMouseDown={e => { e.preventDefault(); setCardForm(f => ({ ...f, cardCompany: c })); const dd = document.getElementById('cardco-dropdown'); if (dd) dd.style.display = 'none' }} className="w-full text-left px-2 py-1.5 text-xs text-[var(--text-primary)] hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer transition-colors">
                                                  {c}
                                                </button>
                                              ))
                                            })()}
                                          </div>
                                        </div>
                                        <input value={cardForm.cardNumber} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 16); const fmt = v.replace(/(.{4})/g, '$1-').replace(/-$/, ''); setCardForm(f => ({ ...f, cardNumber: fmt })) }} placeholder="0000-0000-0000-0000" className="px-2 py-1.5 rounded border border-[var(--border-default)] bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] focus:border-primary-500 outline-none" />
                                        <select value={cardForm.cardType} onChange={e => setCardForm(f => ({ ...f, cardType: e.target.value }))} className="px-2 py-1.5 rounded border border-[var(--border-default)] bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] focus:border-primary-500 outline-none">
                                          <option>泥댄겕移대뱶</option><option>?좎슜移대뱶</option>
                                        </select>
                                        <input value={cardForm.expiryDate} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 4); const fmt = v.length > 2 ? v.slice(0, 2) + '/' + v.slice(2) : v; setCardForm(f => ({ ...f, expiryDate: fmt })) }} placeholder="MM/YY" maxLength={5} className="px-2 py-1.5 rounded border border-[var(--border-default)] bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] focus:border-primary-500 outline-none" />
                                        <input value={cardForm.cardUser} onChange={e => setCardForm(f => ({ ...f, cardUser: e.target.value }))} placeholder="鍮꾧퀬" className="px-2 py-1.5 rounded border border-[var(--border-default)] bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] focus:border-primary-500 outline-none" />
                                      </div>
                                      <div className="flex justify-end gap-2">
                                        <button onClick={() => { setAddingCardFor(null); setCardForm(emptyCardForm) }} className="px-2 py-1 rounded text-[11px] font-bold text-[var(--text-secondary)] border border-[var(--border-default)] hover:bg-[var(--bg-muted)] cursor-pointer transition-colors">痍⑥냼</button>
                                        <button onClick={() => addCard(acc.id)} className="px-2 py-1 rounded text-[11px] font-bold text-white bg-violet-500 hover:bg-violet-600 cursor-pointer transition-colors">異붽?</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button onClick={() => { setAddingCardFor(acc.id); setCardForm(emptyCardForm) }} className="w-full flex items-center justify-center gap-1 py-2 rounded-lg border border-dashed border-[var(--border-default)] text-xs font-bold text-[var(--text-muted)] hover:border-violet-400 hover:text-violet-500 cursor-pointer transition-colors">
                                      <Plus size={12} /> 移대뱶 異붽?
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
                    {/* ?섎떒 */}
                    <div className="flex justify-between items-center px-5 py-3 border-t border-[var(--border-default)]">
                      <button onClick={startAdd} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-dashed border-violet-400 text-xs font-bold text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 cursor-pointer transition-colors">
                        <Plus size={12} /> 怨꾩쥖 異붽?
                      </button>
                      <button onClick={() => setBankModalOpen(false)} className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer">?リ린</button>
                    </div>
                  </>
                )
              })()}
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
                          {def && <span className="ml-1 text-[9px] text-[var(--text-muted)]">({def.subItems.length}媛??몃ぉ)</span>}
                        </button>
                        )
                      })}
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


              {/* ?덉궛?몃ぉ ?쒕∼?ㅼ슫 */}
              {availableSubItems.length > 0 && (
              <div className="relative">
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">?덉궛?몃ぉ</label>
                <div
                  onClick={() => { setSubNamePopup(!subNamePopup); setItemNamePopup(false); setDetailNamePopup(false) }}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm cursor-pointer hover:border-primary-400 transition-colors min-h-[40px] flex items-center"
                >
                  {budgetForm.subItemName ? (
                    <span className="text-[var(--text-primary)] font-semibold">{budgetForm.subItemName}</span>
                  ) : (
                    <span className="text-[var(--text-muted)]">?몃ぉ???좏깮?섏꽭??/span>
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
                          {sub.detailItems && sub.detailItems.length > 0 && <span className="ml-1 text-[9px] text-[var(--text-muted)]">({sub.detailItems.length}媛??몄꽭??ぉ)</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              )}
              {availableSubItems.length === 0 && (
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">?덉궛?몃ぉ</label>
                <input
                  value={budgetForm.subItemName}
                  onChange={e => setBudgetForm(f => ({ ...f, subItemName: e.target.value }))}
                  placeholder="?덉궛?몃ぉ???낅젰?섏꽭??(?좏깮)"
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none transition-colors"
                />
              </div>
              )}

              {/* ?몄꽭??ぉ ?쒕∼?ㅼ슫 */}
              {availableDetailItems.length > 0 && (
              <div className="relative">
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">?몄꽭??ぉ</label>
                <div
                  onClick={() => { setDetailNamePopup(!detailNamePopup); setSubNamePopup(false); setItemNamePopup(false) }}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm cursor-pointer hover:border-primary-400 transition-colors min-h-[40px] flex items-center"
                >
                  {budgetForm.detailItemName ? (
                    <span className="text-[var(--text-primary)] font-semibold">{budgetForm.detailItemName}</span>
                  ) : (
                    <span className="text-[var(--text-muted)]">?몄꽭??ぉ???좏깮?섏꽭??/span>
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

              {/* 怨꾩젙怨쇰ぉ/?곷?怨꾩젙 - ?먮룞 ?쎄린?꾩슜 */}
              {budgetForm.accountCode && (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 flex items-center gap-1">
                      怨꾩젙怨쇰ぉ
                      <span className="text-[8px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">???먮룞</span>
                    </label>
                    <div className="w-full px-3 py-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-900/10 text-sm min-h-[40px] flex items-center">
                      <span className="text-primary-500 font-mono font-bold text-[11px]">{budgetForm.accountCode}</span>
                      <span className="ml-1.5 text-[var(--text-primary)] font-semibold">{accounts.find(a => a.code === budgetForm.accountCode)?.name || ''}</span>
                    </div>
                  </div>
                  {budgetForm.contraAccountCode && (
                    <div className="flex-1">
                      <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 flex items-center gap-1">
                        ?곷?怨꾩젙
                        <span className="text-[8px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">???먮룞</span>
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

      {/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
         紐⑤떖: ?덉궛怨쇰ぉ ?좏깮 (泥댄겕由ъ뒪??
         ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??*/}
      {budgetPickerOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={() => setBudgetPickerOpen(false)}>
          <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-[500px] mx-4 border border-[var(--border-default)] max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)]">
              <div>
                <h3 className="text-base font-extrabold text-[var(--text-primary)]">?뱥 {pickerFilterItem ? `${pickerFilterItem} ???몃ぉ ?좏깮` : '?덉궛怨쇰ぉ ?좏깮'}</h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{pickerFilterItem ? '???덉궛紐⑹쓽 ?몃ぉ???좏깮?섏꽭?? : '泥댄겕????ぉ???덉궛?쇰줈 ?깅줉?⑸땲??}</p>
              </div>
              <button onClick={() => setBudgetPickerOpen(false)} className="text-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">??/button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1">
              {budgetItemDefs.filter(def => !pickerFilterItem || def.name === pickerFilterItem || def.aliases.includes(pickerFilterItem)).map(def => {
                const itemKey = def.name
                const hasSub = def.subItems && def.subItems.length > 0
                // 紐⑤뱺 ?섏쐞 ???섏쭛
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
                    {/* ?덉궛紐?*/}
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
                      {hasSub && <span className="text-[9px] text-[var(--text-muted)] bg-[var(--bg-muted)] px-1.5 py-0.5 rounded">{def.subItems.length}媛??몃ぉ</span>}
                    </label>
                    {/* ?몃ぉ */}
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
                          {/* ?몄꽭??ぉ */}
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
              <span className="text-[11px] text-[var(--text-muted)]">{pickerChecked.size}媛??좏깮??/span>
              <div className="flex gap-2">
                <button onClick={() => setBudgetPickerOpen(false)} className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer">痍⑥냼</button>
                <button onClick={applyBudgetPicker} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-bold hover:bg-primary-600 transition-colors cursor-pointer">?곸슜</button>
              </div>
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
export function AcctApproval({ year }: { year: number }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [refresh, setRefresh] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [detailApproval, setDetailApproval] = useState<Approval | null>(null)
  // URL??openId ?뚮씪誘명꽣濡?諛섎젮 ?덉쓽 ?먮룞 ?닿린
  useEffect(() => {
    const openId = searchParams.get('openId')
    if (openId) {
      const all: any[] = getItem('acct_approvals', [])
      const found = all.find((a: any) => String(a.id) === openId)
      if (found) setDetailApproval(found)
    }
  }, [searchParams])
  const [approvalBtnLabel, setApprovalBtnLabel] = useState(() => getItem('acct_approval_btn_label', '?덉쓽 ?깅줉'))
  const [editingBtnLabel, setEditingBtnLabel] = useState(false)
  const [editingDescText, setEditingDescText] = useState('')
  const [editingTitleText, setEditingTitleText] = useState('')
  const [modalApprovalType, setModalApprovalType] = useState<'expense' | 'general'>('expense')

  const currentUser = useAuthStore(s => s.user)
  const currentUserName = currentUser?.name || (() => { try { const u = JSON.parse(localStorage.getItem('ws_user') || '{}'); return u?.name } catch { return '' } })() || 'admin'
  const [form, setForm] = useState({ title: '', amount: '', date: getLocalDate(), accountCode: '', description: '', applicant: currentUserName, approver: '', budgetItem: '', budgetSubItem: '' })
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
    preExpense: { label: '吏異쒗븳', color: '#f97316', bg: 'rgba(249,115,22,.1)' },
    pending: { label: '?덉쓽??, color: '#3b82f6', bg: 'rgba(59,130,246,.1)' },
    rejected: { label: '諛섎젮??, color: '#ef4444', bg: 'rgba(239,68,68,.1)' },
    approved: { label: '?뱀씤??, color: '#22c55e', bg: 'rgba(34,197,94,.1)' },
    expensed: { label: '吏異쒕맂', color: '#3b82f6', bg: 'rgba(59,130,246,.1)' },
    toResolve: { label: '寃곗쓽??, color: '#06b6d4', bg: 'rgba(6,182,212,.1)' },
    confirming: { label: '?뺤궛以?, color: '#8b5cf6', bg: 'rgba(139,92,246,.1)' },
    completed: { label: '?꾨즺??, color: '#4f6ef7', bg: 'rgba(79,110,247,.1)' },
    vouchered: { label: '?꾨즺??, color: '#4f6ef7', bg: 'rgba(79,110,247,.1)' },
  }

  type GroupKey = 'inbox' | 'process' | 'archive'
  const groupDefs: { key: GroupKey; label: string; icon: string; color: string; subTabs: { key: string; label: string; color: string }[] }[] = [
    {
      key: 'inbox', label: '?덉쓽??, icon: '?뱥', color: '#4f6ef7',
      subTabs: [
        { key: 'preExpense', label: '?덉쓽??, color: '#f97316' },
        { key: 'pending', label: '?덉쓽??, color: '#f59e0b' },
        { key: 'rejected', label: '諛섎젮??, color: '#ef4444' },
        { key: 'approved', label: '?뱀씤??, color: '#22c55e' },
        { key: 'toResolve', label: '寃곗쓽??, color: '#06b6d4' },
        { key: 'confirming', label: '?뺤궛以?, color: '#8b5cf6' },
      ],
    },
    {
      key: 'process', label: '寃곗젣??, icon: '??, color: '#22c55e',
      subTabs: [
        { key: 'ap_pending', label: '?뱀씤??, color: '#f59e0b' },
        { key: 'ap_approved', label: '?뱀씤??, color: '#22c55e' },
        { key: 'ap_rejected', label: '諛섎젮??, color: '#ef4444' },
        { key: 'ap_toResolve', label: '寃곗쓽??, color: '#06b6d4' },
        { key: 'ap_confirming', label: '?뺤궛以?, color: '#8b5cf6' },
        { key: 'ex_pending', label: '吏異쒗븷', color: '#3b82f6' },
        { key: 'ex_done', label: '吏異쒗븳', color: '#10b981' },
        { key: 'ex_settle', label: '?뺤궛??, color: '#06b6d4' },
        { key: 'ex_settled', label: '?뺤궛??, color: '#8b5cf6' },
      ],
    },
    {
      key: 'archive', label: '蹂닿???, icon: '?벀', color: '#6b7280',
      subTabs: [
        { key: 'generalDone', label: '?쇰컲?덉쓽?꾨즺', color: '#4f6ef7' },
        { key: 'expenseDone', label: '吏異쒗뭹?섏셿猷?, color: '#f97316' },
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

  // ?? 濡쒓렇???ъ슜????븷 ?먮퀎 (?꾩옱 ?곕룄 ?덉궛援щ텇 湲곗?) ??
  const userIsApprover = useMemo(() => {
    const bCats: BudgetCat[] = getItem('acct_budget_cats', []).filter((c: any) => { const pf = c.periodFrom || ''; const pt = c.periodTo || ''; if (pf && pt) return pf <= `${year}-12-31` && pt >= `${year}-01-01`; return (c.year || year) === year })
    return bCats.some(c => (c as any).approvers?.includes(currentUserName)) || bCats.some(c => c.approver === currentUserName) || approvals.some(a => (a as any).approver === currentUserName)
  }, [currentUserName, approvals, refresh, year])

  const userIsExpenseManager = useMemo(() => {
    const bCats: BudgetCat[] = getItem('acct_budget_cats', []).filter((c: any) => { const pf = c.periodFrom || ''; const pt = c.periodTo || ''; if (pf && pt) return pf <= `${year}-12-31` && pt >= `${year}-01-01`; return (c.year || year) === year })
    return bCats.some(c => c.users?.includes(currentUserName))
  }, [currentUserName, refresh, year])

  // 寃곗젣???쒕툕??쓣 ??븷???곕씪 ?숈쟻 ?꾪꽣留?
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
    const isPreExp = (() => {
      if ((detailApproval as any).isPreExpense || (detailApproval as any).selfExpense) return true
      if (detailApproval.status === 'preExpense') return true
      if ((detailApproval.title || '').startsWith('[?좎?異?')) return true
      // cashflow ?곌껐 ?щ?
      const cfs: any[] = getItem('acct_cashflows', [])
      return cfs.some(cf => cf.approvalId && String(cf.approvalId) === String(detailApproval.id))
    })()
    if (isGeneral) {
      // ?쇰컲?덉쓽: 鍮꾨?踰덊샇/?덉궛 寃利??놁씠 諛붾줈 ?꾨즺
      if (!approvePw.trim()) { setApprovePwError('鍮꾨?踰덊샇瑜??낅젰?댁＜?몄슂'); return }
      const myStaff = staffList.find(s => s.name === currentUserName)
      if (myStaff && myStaff.pw && myStaff.pw !== approvePw) {
        setApprovePwError('鍮꾨?踰덊샇媛 ?쇱튂?섏? ?딆뒿?덈떎'); return
      }
      const all = getItem<Approval[]>('acct_approvals', [])
      const updated = all.map(a => String(a.id) === String(detailApproval.id) ? {
        ...a,
        status: 'completed',
        approver: currentUserName,
        approvedAt: getLocalISOString(),
        completedAt: getLocalISOString(),
      } : a)
      setItem('acct_approvals', updated)
      resetApproveState()
      setDetailApproval(null)
      setRefresh(r => r + 1)
      return
    }
    // ?좎?異쒖씠 ?꾨땶 寃쎌슦留??덉궛 ?좏깮 寃利?
    if (!isPreExp) {
      if (!approveBudgetCat || !approveBudgetItem) { setApprovePwError('?덉궛??寃?됲븯???좏깮?댁＜?몄슂'); return }
    }
    if (!approvePw.trim()) { setApprovePwError('鍮꾨?踰덊샇瑜??낅젰?댁＜?몄슂'); return }
    const myStaff = staffList.find(s => s.name === currentUserName)
    if (myStaff && myStaff.pw && myStaff.pw !== approvePw) {
      setApprovePwError('鍮꾨?踰덊샇媛 ?쇱튂?섏? ?딆뒿?덈떎'); return
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
      // ?좎?異? ?대? 吏異?利앸튃 ?꾨즺?대?濡?諛붾줈 completed(蹂닿??? / ?쇰컲: approved
      status: isPreExp ? 'completed' : 'approved',
      ...((isPreExp) ? { completedAt: getLocalISOString() } : {}),
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
      approvedAt: getLocalISOString(),
    } : a)
    setItem('acct_approvals', updated)
    resetApproveState()
    setDetailApproval(null)
    setRefresh(r => r + 1)
  }

  // ?? 吏異쒕떞?뱀옄 ?먮퀎 ?ы띁 ??
  const isExpenseUser = (a: Approval) => {
    const bCats: BudgetCat[] = getItem('acct_budget_cats', []).filter((c: any) => { const pf = c.periodFrom || ''; const pt = c.periodTo || ''; if (pf && pt) return pf <= `${year}-12-31` && pt >= `${year}-01-01`; return (c.year || year) === year })
    const uCatIds = new Set(bCats.filter(c => c.users?.includes(currentUserName)).map(c => String(c.id)))
    const uCatNames = new Set(bCats.filter(c => c.users?.includes(currentUserName)).map(c => c.name))
    return ((a as any).budgetCatId && uCatIds.has(String((a as any).budgetCatId))) ||
           ((a as any).budgetCatName && uCatNames.has((a as any).budgetCatName))
  }

  // ?? ?듯빀 ?꾪꽣 ??
  const matchFilter = (a: Approval, group: string, tab: string): boolean => {
    const isCompleted = ['completed', 'vouchered'].includes(a.status)
    const isGeneral = !!(a as any).isGeneral

    // ?? ?덉쓽?? ?닿? ?좎껌???덉쓽 (?꾨즺 ?? ??
    if (group === 'inbox') {
      const isMyApplicant = (a as any).applicant === currentUserName
      const isPreExp = !!(a as any).isPreExpense || a.status === 'preExpense' || (a.title || '').startsWith('[?좎?異?')
      // ?좎?異? applicant ?먮뒗 ?대떦 異쒓툑?꾪몴???대떦?먮룄 蹂????덉쓬
      if (!isMyApplicant) {
        if (isPreExp && tab === 'preExpense') {
          // ?좎?異쒓굔: ?대떦 ?덉궛 ?대떦?먯씠嫄곕굹 cashflow manager媛 ?섏씤 寃쎌슦
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

    // ?? 寃곗젣?? ?뱀씤沅뚯옄/吏異쒕떞?뱀옄 ??븷蹂???
    if (group === 'process') {
      if (isCompleted) return false
      // ?뱀씤沅뚯옄 ?쒕툕??
      if (tab.startsWith('ap_')) {
        if ((a as any).approver !== currentUserName) return false
        const realStatus = tab.replace('ap_', '')
        if (realStatus === 'pending') return a.status === 'pending' || a.status === 'preExpense'
        return a.status === realStatus
      }
      // 吏異쒕떞?뱀옄 ?쒕툕??
      if (tab.startsWith('ex_')) {
        if (!isExpenseUser(a) && (a as any).applicant !== currentUserName) return false
        if (tab === 'ex_pending') return a.status === 'approved'
        if (tab === 'ex_done') return a.status === 'expensed'
        if (tab === 'ex_settle') return a.status === 'confirming'
        if (tab === 'ex_settled') return a.status === 'toResolve' && !!(a as any)._settled
        return false
      }
    }

    // ?? 蹂닿??? ?꾨즺??嫄?以?蹂몄씤 愿?⑤쭔 ??
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

  const filteredApprovals = approvals.filter(a => matchFilter(a, activeGroup, subTab)).sort((a, b) => {
    const da = a.date || (a as any).createdAt || ''
    const db = b.date || (b as any).createdAt || ''
    if (da > db) return -1
    if (da < db) return 1
    // 媛숈? ?좎쭨硫?id ?대┝李⑥닚
    return (Number(b.id) || 0) - (Number(a.id) || 0)
  })

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
    if (!form.title.trim()) return alert('?덉쓽紐낆쓣 ?낅젰?댁＜?몄슂')
    const isGeneral = modalApprovalType === 'general'
    const amt = isGeneral ? 0 : (parseInt(form.amount.replace(/,/g, '')) || 0)
    if (!isGeneral && amt <= 0) return alert('湲덉븸???낅젰?댁＜?몄슂')
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
        createdAt: getLocalISOString(),
      } as any)
      setItem('acct_approvals', all)
    }
    setModalOpen(false)
    setEditingId(null)
    setModalApprovalType('expense')
    setForm({ title: '', amount: '', date: getLocalDate(), accountCode: '', description: '', applicant: currentUserName, approver: '' })
    setRefresh(r => r + 1)
  }

  const updateStatus = (id: string | number, status: string) => {
    const all = getItem<Approval[]>('acct_approvals', [])
    const updated = all.map(a => String(a.id) === String(id) ? { ...a, status } : a)
    setItem('acct_approvals', updated)
    setRefresh(r => r + 1)
  }

  const deleteApproval = (id: string | number) => {
    const allApprovals = getItem<Approval[]>('acct_approvals', [])
    const target = allApprovals.find(a => String(a.id) === String(id))
    // ?좎?異??덉쓽(preExpense ?곹깭)????젣 遺덇?
    if (target && target.status === 'preExpense') {
      alert('?좎?異쒕맂 ?덉쓽????젣?????놁뒿?덈떎.')
      return
    }
    // ?덉쓽??pending) ?곹깭???좎?異쒓굔? ??젣 ??preExpense濡??섎룎由?
    if (target && target.status === 'pending' && (target as any).isPreExpense) {
      if (!confirm('???덉쓽瑜?痍⑥냼?섍퀬 ?좎?異??곹깭濡??섎룎由ъ떆寃좎뒿?덇퉴?')) return
      const updated = allApprovals.map(a =>
        String(a.id) === String(id)
          ? { ...a, status: 'preExpense' as const }
          : a
      )
      setItem('acct_approvals', updated)
      setRefresh(r => r + 1)
      return
    }
    if (!confirm('???덉쓽瑜???젣?섏떆寃좎뒿?덇퉴?')) return
    const all = allApprovals.filter(a => String(a.id) !== String(id))
    setItem('acct_approvals', all)
    setRefresh(r => r + 1)
  }

  // ?? ?뱀씤/諛섎젮 ?뚰겕?뚮줈???곹깭 ??
  const [approveMode, setApproveMode] = useState(false)
  const [rejectMode, setRejectMode] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [resubmitMode, setResubmitMode] = useState(false)
  const [resubmitForm, setResubmitForm] = useState({ title: '', amount: '', date: '', description: '' })
  const [resubmitEvidenceOpen, setResubmitEvidenceOpen] = useState(false)
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

  // ?뱀씤????뿉?쒖쓽 ?곸꽭 ?닿린 ?щ?
  const isApproverPendingView = activeGroup === 'process' && subTab === 'ap_pending'

  // ?좏깮???덉궛援щ텇???곕Ⅸ ?덉궛??ぉ ?꾪꽣 (怨좎쑀 itemName 湲곗?)
  const approveFilteredItems = useMemo(() => {
    if (!approveBudgetCat) return [] as BudgetItem[]
    const items = budgetItems.filter(b => String(b.catId) === String(approveBudgetCat))
    // 怨좎쑀 itemName 湲곗? 洹몃９??(泥?踰덉㎏ ??ぉ留????
    const seen = new Set<string>()
    return items.filter(b => {
      if (seen.has(b.itemName)) return false
      seen.add(b.itemName)
      return true
    })
  }, [approveBudgetCat, budgetItems])

  // ?? ?듯빀 寃?됱슜 ?뚮옯 由ъ뒪??(理쒖쥌???덉궛 寃쎈줈) ??
  const budgetFlatList = useMemo(() => {
    const acctList: { code: string; name: string }[] = getItem('acct_accounts', [])
    const result: { catId: string; catName: string; itemId: string; itemName: string; subId?: string; subName?: string; detailId?: string; detailName?: string; accountCode?: string; accountName?: string; aliases: string; path: string; amount: number; spent: number; remaining: number }[] = []
    budgetCats.forEach(cat => {
      // ?뱀씤沅뚯옄???대떦 ?덉궛嫄대쭔 ?꾪꽣留?
      const catAny = cat as any
      const isMyBudget = (catAny.approvers && catAny.approvers.includes(currentUserName)) ||
        catAny.approver === currentUserName ||
        (catAny.users && catAny.users.includes(currentUserName))
      if (!isMyBudget) return
      const catItems = budgetItems.filter(b => String(b.catId) === String(cat.id))
      // 怨좎쑀 itemName蹂?洹몃９
      const itemGroups = new Map<string, BudgetItem[]>()
      catItems.forEach(b => {
        const arr = itemGroups.get(b.itemName) || []
        arr.push(b)
        itemGroups.set(b.itemName, arr)
      })
      itemGroups.forEach((items, itemName) => {
        const firstItem = items[0]
        const def = approveBudgetDefs.find(d => d.name === itemName || d.aliases?.includes(itemName))
        // ?몃ぉ/?몄꽭??씠 ?덈뒗 寃쎌슦 媛곴컖 ?깅줉
        if (def && def.subItems && def.subItems.length > 0) {
          def.subItems.forEach(sub => {
            const subAcct = sub.accountCode ? acctList.find(a => a.code === sub.accountCode) : null
            // ?몄꽭??detailItems)???덉쑝硫??몄꽭???⑥쐞濡?
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
              // ?몃ぉ ?⑥쐞
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
          // ?몃ぉ ?놁씠 ??ぉ ?⑥쐞
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

  // ?듯빀 寃???꾪꽣 寃곌낵
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

  // ?좏깮???덉궛??ぉ???몃ぉ 紐⑸줉 (budgetItemDefs 湲곕컲 + ?ㅼ젣 ?곗씠??蹂묓빀)
  const approveFilteredSubs = useMemo(() => {
    if (!approveBudgetItem) return [] as { id: string; name: string; isFromDef?: boolean }[]
    const selectedItem = budgetItems.find(b => String(b.id) === String(approveBudgetItem))
    if (!selectedItem) return []
    // budgetItemDefs?먯꽌 ?대떦 ?덉궛??ぉ???몃ぉ ?뺤쓽 媛?몄삤湲?
    const def = approveBudgetDefs.find(d => d.name === selectedItem.itemName || d.aliases?.includes(selectedItem.itemName))
    if (def && def.subItems && def.subItems.length > 0) {
      // ?뺤쓽 湲곕컲 ?몃ぉ 紐⑸줉
      return def.subItems.sort((a, b) => a.sortOrder - b.sortOrder).map(sub => ({
        id: `def_${sub.id}`,
        name: sub.name,
        defId: sub.id,
        isFromDef: true,
      }))
    }
    // ?뺤쓽媛 ?놁쑝硫??ㅼ젣 ?곗씠?곗뿉??異붿텧
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

  // ?좏깮???몃ぉ???몄꽭??紐⑸줉
  const approveFilteredDetails = useMemo(() => {
    if (!approveBudgetSub || !approveBudgetItem) return [] as BudgetItem[]
    const selectedItem = budgetItems.find(b => String(b.id) === String(approveBudgetItem))
    if (!selectedItem) return []
    // ?좏깮???몃ぉ???대쫫 媛?몄삤湲?
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
    // ?몄꽭??씠 ?좏깮??寃쎌슦
    if (approveBudgetDetail) {
      const det = budgetItems.find(b => String(b.id) === String(approveBudgetDetail))
      if (det) return { amount: det.amount || 0, spent: det.spent || 0, remaining: (det.amount || 0) - (det.spent || 0) }
    }
    // ?몃ぉ???좏깮??寃쎌슦 ?대떦 ?몃ぉ???붿븸 (?대쫫?쇰줈 留ㅼ묶)
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
    // ??ぉ???좏깮??寃쎌슦 ?대떦 ??ぉ ?섏쐞 ?꾩껜 ?⑹궛
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

  // ?ы뭹???뺤씤: ?댁슜 ?섏젙 ??status瑜?pending?쇰줈 蹂寃?
  const handleResubmitConfirm = () => {
    if (!resubmitForm.title.trim()) { setApprovePwError('?덉쓽紐낆쓣 ?낅젰?댁＜?몄슂'); return }
    const isGeneral = !!(detailApproval as any).isGeneral
    const amt = isGeneral ? 0 : (parseInt(resubmitForm.amount.replace(/,/g, '')) || 0)
    if (!isGeneral && amt <= 0) { setApprovePwError('湲덉븸???낅젰?댁＜?몄슂'); return }
    if (!detailApproval) return
    const approverList = staffList.filter(s => (s as any).approverType === 'approver')
    const autoApprover = approverList.length > 0 ? approverList[0].name : (staffList.length > 0 ? staffList[0].name : '')
    const all = getItem<Approval[]>('acct_approvals', [])
    // ?덉궛援щ텇 留ㅽ븨
    const newCatId = (resubmitForm as any).budgetCatId || (a => (a as any).budgetCatId)(detailApproval)
    const selectedCat = newCatId ? budgetCats.find(c => String(c.id) === String(newCatId)) : null
    const updated = all.map(a => String(a.id) === String(detailApproval.id) ? {
      ...a,
      title: resubmitForm.title.trim(),
      amount: amt,
      date: resubmitForm.date || getLocalDate(),
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
      attachments: (resubmitForm as any).attachments || (a as any).attachments || [],
      approvedAt: undefined,
      rejectedAt: undefined,
      resubmittedAt: getLocalISOString(),
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
    if (!approvePw.trim()) { setApprovePwError('鍮꾨?踰덊샇瑜??낅젰?댁＜?몄슂'); return }
    const myStaff = staffList.find(s => s.name === currentUserName)
    if (myStaff && myStaff.pw && myStaff.pw !== approvePw) {
      setApprovePwError('鍮꾨?踰덊샇媛 ?쇱튂?섏? ?딆뒿?덈떎'); return
    }
    if (!detailApproval) return
    // 諛섎젮 泥섎━ + approver瑜??꾩옱 ?ъ슜?먮줈 媛깆떊
    const all = getItem<Approval[]>('acct_approvals', [])
    const updated = all.map(a => String(a.id) === String(detailApproval.id) ? {
      ...a,
      status: 'rejected',
      approver: currentUserName,
      rejectedAt: getLocalISOString(),
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
      {/* ?? ?멸렇癒쇳듃 ??諛??? */}
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

      {/* ?? ?몃씪???꾪꽣 移?+ ?≪뀡 踰꾪듉 ?? */}
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

      {/* ?? 紐⑸줉 ?? */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">

        {filteredApprovals.length === 0 ? (
          <div className="p-6"><EmptyState emoji="?뱥" title="?대떦 ?곹깭???덉쓽媛 ?놁뒿?덈떎" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-[var(--bg-muted)]">
                  {['?좎쭨', '?쒕ぉ', '湲덉븸', '?곹깭', '?대떦??, '愿由?].map(h => (
                    <th key={h} className={cn('py-2.5 px-3.5 text-[11px] font-bold text-[var(--text-muted)]',
                      h === '湲덉븸' ? 'text-right' : h === '?대떦?? ? 'text-center w-[160px]' : h === '?곹깭' ? 'text-center w-[70px]' : h === '愿由? ? 'text-center w-[80px]' : 'text-left')}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredApprovals.map(a => {
                  const isTransferApproval = !!(a as any).transferType || (a.title || '').startsWith('[?泥?')
                  const isPreExp = !!(a as any).isPreExpense || a.status === 'preExpense' || (a.title || '').startsWith('[?좎?異?')
                  const si = isTransferApproval && (isPreExp || a.status === 'preExpense')
                    ? { label: '?泥댄븳', color: '#8b5cf6', bg: 'rgba(139,92,246,.1)' }
                    : isPreExp
                      ? { label: '吏異쒗븳', color: '#f97316', bg: 'rgba(249,115,22,.1)' }
                      : (a.status === 'pending' && (a as any).resubmittedAt)
                        ? { label: '?덉쓽??, color: '#3b82f6', bg: 'rgba(59,130,246,.1)' }
                        : (statusInfo[a.status] || statusInfo.pending)
                  return (
                    <tr key={a.id} className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-muted)] transition-colors">
                      <td className="py-2.5 px-3.5 text-[12px] text-[var(--text-secondary)]">{(a.date || a.createdAt || '').slice(0, 10)}</td>
                      <td className="py-2.5 px-3.5 text-[12px] font-bold text-[var(--text-primary)]">{a.title || '-'}</td>
                      <td className="py-2.5 px-3.5 text-[12px] font-extrabold text-right text-[var(--text-primary)]">{formatNumber(a.amount || 0)}??/td>
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: si.bg, color: si.color }}>
                          {si.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1 text-[10px]">
                          {(a as any).applicant && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 font-bold">{isPreExp ? '吏異? : '?덉쓽'}-{(a as any).applicant}</span>
                          )}
                          {(a as any).approver && (
                            <span className={cn('px-1.5 py-0.5 rounded font-bold',
                              a.status === 'approved' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' :
                              a.status === 'rejected' ? 'bg-red-50 dark:bg-red-900/20 text-red-500' :
                              'bg-amber-50 dark:bg-amber-900/20 text-amber-600'
                            )}>
                              {a.status === 'approved' ? '?뱀씤' : a.status === 'rejected' ? '諛섎젮' : '?뱀씤'}-{(a as any).approver}
                            </span>
                          )}
                          {a.status === 'rejected' && (a as any).rejectReason && (
                            <span className="px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-900/20 text-red-400 font-bold text-[9px] max-w-[120px] truncate" title={(a as any).rejectReason}>
                              ?뮠 {(a as any).rejectReason}
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

      {/* ?? 吏異쒗뭹?섏꽌 ??(?곸꽭 ?앹뾽 ?泥? ?? */}
      {detailApproval && !resubmitEvidenceOpen && (
        <PrintApprovalForm
          readOnly={['approved','expensed','confirming','completed'].includes(detailApproval.status)}
          data={(() => {
            // ?곕룞??cashflow 議고쉶
            const allCfs: any[] = getItem('acct_cashflows', [])
            const linkedCf = allCfs.find(c => c.approvalId && String(c.approvalId) === String(detailApproval.id))
            const acctList: any[] = getItem('acct_accounts', [])
            const da = detailApproval as any
            const isPreExp = da.isPreExpense || detailApproval.status === 'preExpense'
            return {
            date: (detailApproval.date || detailApproval.createdAt || '').slice(0, 10),
            expenseDate: linkedCf?.tradeDate || linkedCf?.date || (isPreExp ? (detailApproval.date || detailApproval.createdAt || '').slice(0, 10) : ''),
            settleDate: linkedCf?.inputDate || linkedCf?.writeDate || linkedCf?.date || (isPreExp ? (detailApproval.date || detailApproval.createdAt || '').slice(0, 10) : ''),
            accountName: (() => {
              // linkedCf?먯꽌 怨꾩젙怨쇰ぉ 媛?몄삤湲?
              if (linkedCf?.accountCode) {
                const acct = acctList.find(a => a.code === linkedCf.accountCode)
                if (acct) return acct.name
              }
              if (da.budgetItemId) {
                const item = budgetItems.find(b => String(b.id) === String(da.budgetItemId))
                if (item?.accountCode) {
                  const acct = acctList.find(a => a.code === item.accountCode)
                  if (acct) return acct.name
                }
                return item?.itemName || da.budgetItem || ''
              }
              return da.budgetItem || ''
            })(),
            evidenceType: da.budgetCatName || '',
            vendor: linkedCf?.counter || da.vendor || da.counter || '',
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
            applicant: detailApproval.status === 'preExpense' ? currentUserName : ((detailApproval as any).applicant || ''),
            approver: detailApproval.approver || '',
            applicantSealImg: staffList.find(s => s.name === (detailApproval.status === 'preExpense' ? currentUserName : (detailApproval as any).applicant))?.sealImg || '',
            approverSealImg: staffList.find(s => s.name === detailApproval.approver)?.sealImg || '',
            applicantPosition: staffList.find(s => s.name === (detailApproval.status === 'preExpense' ? currentUserName : (detailApproval as any).applicant))?.position || '',
            approverPosition: staffList.find(s => s.name === detailApproval.approver)?.position || '',
            approvalStatus: detailApproval.status || '',
            approvedMemo: (detailApproval as any).approvedMemo || '',
            attachments: (detailApproval as any).attachments || [],
            isGeneral: !!(detailApproval as any).isGeneral,
            approvalType: (detailApproval as any).isGeneral ? '?쇰컲?덉쓽' : ['preExpense','toResolve','confirming','completed'].includes(detailApproval.status) || !!(detailApproval as any).isPreExpense ? '?좎?異? : '吏異쒗뭹??,
            approvedDate: (detailApproval as any).approvedAt ? (detailApproval as any).approvedAt.slice(0, 10) : '',
            department: (() => {
              const staff = staffList.find(s => s.name === (detailApproval as any).applicant)
              return (staff as any)?.department || (staff as any)?.dept || ''
            })(),
          }})()}
          onClose={() => { resetApproveState(); setDetailApproval(null) }}
          onUpdateAttachments={(updated) => {
            // ??젣??泥⑤???IndexedDB ?대?吏 ?뺣━
            const oldAtts: any[] = (detailApproval as any).attachments || []
            const newKeys = new Set(updated.map((a: any) => a.imageKey).filter(Boolean))
            oldAtts.forEach((a: any) => { if (a.imageKey && !newKeys.has(a.imageKey)) deleteAttachmentImage(a.imageKey) })
            // localStorage?먮뒗 dataUrl ?놁씠 硫뷀??곗씠?곕쭔 ???
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
                  <button onClick={() => { setApproveMode(true); setRejectMode(false); setApprovePw(''); setApprovePwError(''); setApproveAmount(detailApproval.amount ? Number(detailApproval.amount).toLocaleString('ko-KR') : ''); setApproveMemo(''); const da=detailApproval as any; let catId=da.budgetCatId?String(da.budgetCatId):''; if(!catId&&da.budgetCatName){const cat=budgetCats.find(c=>c.name===da.budgetCatName);if(cat)catId=String(cat.id)} if(catId){setApproveBudgetCat(catId);const itemName=da.budgetItem||'';let itemId=da.budgetItemId?String(da.budgetItemId):'';if(!itemId&&itemName){const f=budgetItems.find(b=>String(b.catId)===catId&&b.itemName===itemName);if(f)itemId=String(f.id)} if(itemId){setApproveBudgetItem(itemId);let subId=da.budgetSubId?String(da.budgetSubId):'';if(!subId&&da.budgetSubItem){const f=budgetItems.find(b=>String(b.catId)===catId&&b.itemName===itemName&&b.subItemName===da.budgetSubItem);if(f)subId=String(f.id)} if(!subId){const subs=budgetItems.filter(b=>String(b.catId)===catId&&b.itemName===itemName&&b.subItemName);if(subs.length===1)subId=String(subs[0].id)} if(subId)setApproveBudgetSub(subId)}} }} className="px-4 py-2 rounded-lg bg-[#22c55e] text-white text-sm font-bold hover:bg-[#16a34a] cursor-pointer flex items-center gap-1 shadow-sm"><Check size={13} /> ?뱀씤</button>
                  <button onClick={() => { setRejectMode(true); setApproveMode(false); setApprovePw(''); setApprovePwError('') }} className="px-4 py-2 rounded-lg bg-[#ef4444] text-white text-sm font-bold hover:bg-[#dc2626] cursor-pointer flex items-center gap-1 shadow-sm"><Ban size={13} /> 諛섎젮</button>
                </>
              )}
              {!isApproverPendingView && detailApproval.status === 'pending' && (
                <>
                  <button onClick={() => { const a=detailApproval; const da=a as any; let catId=da.budgetCatId?String(da.budgetCatId):''; if(!catId&&da.budgetCatName){const cat=budgetCats.find(c=>c.name===da.budgetCatName);if(cat)catId=String(cat.id)} setResubmitMode(true); setResubmitForm({title:a.title||'',amount:a.amount?Number(a.amount).toLocaleString('ko-KR'):'',date:(a.date||a.createdAt||'').slice(0,10),description:da.description||'',budgetCatId:catId,attachments:da.attachments||[]} as any); setApprovePwError('') }} className="px-4 py-2 rounded-lg bg-[#4f6ef7] text-white text-sm font-bold hover:bg-[#3b5de7] cursor-pointer flex items-center gap-1 shadow-sm"><Edit3 size={13} /> ?섏젙</button>
                  <button onClick={() => { deleteApproval(detailApproval.id); resetApproveState(); setDetailApproval(null) }} className="px-4 py-2 rounded-lg bg-[#ef4444] text-white text-sm font-bold hover:bg-[#dc2626] cursor-pointer flex items-center gap-1"><Trash2 size={13} /> ??젣</button>
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
                  : '吏異쒕떞?뱀옄'
                return (
                  <span className="px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                    {managerNames}?섏씠 吏異쒖쓣 泥섎━?⑸땲??
                  </span>
                )
              })()}
              {!isApproverPendingView && detailApproval.status === 'preExpense' && (
                <button onClick={() => { const a=detailApproval; const da=a as any; let catId=da.budgetCatId?String(da.budgetCatId):''; if(!catId&&da.budgetCatName){const cat=budgetCats.find(c=>c.name===da.budgetCatName);if(cat)catId=String(cat.id)} setResubmitMode(true); setResubmitForm({title:a.title||'',amount:a.amount?Number(a.amount).toLocaleString('ko-KR'):'',date:(a.date||a.createdAt||'').slice(0,10),description:da.description||'',budgetCatId:catId,attachments:da.attachments||[]} as any); setApprovePwError('') }} className="px-4 py-2 rounded-lg bg-[#f97316] text-white text-sm font-bold hover:bg-[#ea580c] cursor-pointer flex items-center gap-1 shadow-sm"><Edit3 size={13} /> ?덉쓽</button>
              )}
              {!isApproverPendingView && detailApproval.status === 'rejected' && (
                <>
                  <button onClick={() => { const a=detailApproval; const da=a as any; let catId=da.budgetCatId?String(da.budgetCatId):''; if(!catId&&da.budgetCatName){const cat=budgetCats.find(c=>c.name===da.budgetCatName);if(cat)catId=String(cat.id)} setResubmitMode(true); setResubmitForm({title:a.title||'',amount:a.amount?Number(a.amount).toLocaleString('ko-KR'):'',date:(a.date||a.createdAt||'').slice(0,10),description:da.description||'',budgetCatId:catId,attachments:da.attachments||[]} as any); setApprovePwError('') }} className="px-4 py-2 rounded-lg bg-[#f59e0b] text-white text-sm font-bold hover:bg-[#d97706] cursor-pointer flex items-center gap-1 shadow-sm"><RefreshCw size={13} /> ?ы뭹??/button>
                  <button onClick={() => { deleteApproval(detailApproval.id); resetApproveState(); setDetailApproval(null) }} className="px-4 py-2 rounded-lg bg-[#ef4444] text-white text-sm font-bold hover:bg-[#dc2626] cursor-pointer flex items-center gap-1"><Trash2 size={13} /> ??젣</button>
                </>
              )}
              {!isApproverPendingView && detailApproval.status === 'confirming' && (() => {
                const catId = (detailApproval as any).budgetCatId
                const bCats: BudgetCat[] = getItem('acct_budget_cats', [])
                const cat = catId ? bCats.find(c => String(c.id) === String(catId)) : null
                const isExpenseManager = cat?.users?.includes(currentUserName) || false
                return isExpenseManager ? (
                  <>
                    <button onClick={() => { setSettleCompleteMode(true); setSettleCompletePw(''); setSettleCompletePwError('') }} className="px-4 py-2 rounded-lg bg-[#22c55e] text-white text-sm font-bold hover:bg-[#16a34a] cursor-pointer flex items-center gap-1 shadow-sm"><Check size={13} /> ?뺤궛?꾨즺</button>
                    <button onClick={() => { setSettleRejectMode(true); setSettleRejectReason('') }} className="px-4 py-2 rounded-lg bg-[#ef4444] text-white text-sm font-bold hover:bg-[#dc2626] cursor-pointer flex items-center gap-1 shadow-sm"><Ban size={13} /> ?뺤궛諛섎젮</button>
                  </>
                ) : (
                  <span className="px-3 py-2 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-[11px] text-violet-600 dark:text-violet-400 font-bold">
                    ?뺤궛?뺤씤 ?湲?以??낅땲??
                  </span>
                )
              })()}
              {/* ?뺤궛?꾨즺 鍮꾨?踰덊샇 紐⑤떖 */}
              {settleCompleteMode && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={() => setSettleCompleteMode(false)}>
                  <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-[380px] p-5 space-y-3" onClick={e => e.stopPropagation()}>
                    <div className="text-sm font-extrabold text-[#22c55e] flex items-center gap-1.5"><Check size={16} /> ?뺤궛?꾨즺</div>
                    <p className="text-[11px] text-[var(--text-muted)]">蹂몄씤 ?뺤씤???꾪빐 鍮꾨?踰덊샇瑜??낅젰?댁＜?몄슂.</p>
                    <div>
                      <input
                        type="password"
                        value={settleCompletePw}
                        onChange={e => { setSettleCompletePw(e.target.value); setSettleCompletePwError('') }}
                        onKeyDown={e => { if (e.key === 'Enter') { (e.target as HTMLInputElement).closest('div')?.querySelector<HTMLButtonElement>('.settle-confirm-btn')?.click() } }}
                        placeholder="鍮꾨?踰덊샇"
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-sm text-[var(--text-primary)] focus:border-[#22c55e] outline-none"
                        autoFocus
                      />
                      {settleCompletePwError && <p className="text-[10px] text-[#ef4444] mt-1">{settleCompletePwError}</p>}
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button onClick={() => setSettleCompleteMode(false)} className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] cursor-pointer">痍⑥냼</button>
                      <button className="settle-confirm-btn px-4 py-2 rounded-lg bg-[#22c55e] text-white text-sm font-bold hover:bg-[#16a34a] cursor-pointer flex items-center gap-1" onClick={() => {
                        const me = staffList.find(s => s.name === currentUserName)
                        if (!me?.pw || settleCompletePw !== me.pw) { setSettleCompletePwError('鍮꾨?踰덊샇媛 ?쇱튂?섏? ?딆뒿?덈떎'); return }
                        const approvals:any[]=getItem('acct_approvals',[])
                        const idx=approvals.findIndex(a=>a.id===detailApproval.id)
                        if(idx>=0){
                          approvals[idx].status='completed'
                          approvals[idx].completedAt=getLocalISOString()
                          approvals[idx].completedBy=currentUserName
                          setItem('acct_approvals',approvals)
                          setRefresh(r=>r+1)
                        }
                        setSettleCompleteMode(false)
                        resetApproveState()
                        setDetailApproval(null)
                      }}><Check size={13} /> ?뺤궛?꾨즺 ?뺤씤</button>
                    </div>
                  </div>
                </div>
              )}
              {/* ?뺤궛諛섎젮 ?ъ쑀 ?낅젰 紐⑤떖 */}
              {settleRejectMode && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={() => setSettleRejectMode(false)}>
                  <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-[400px] p-5 space-y-3" onClick={e => e.stopPropagation()}>
                    <div className="text-sm font-extrabold text-[#ef4444] flex items-center gap-1.5"><Ban size={16} /> ?뺤궛諛섎젮</div>
                    <p className="text-[11px] text-[var(--text-muted)]">諛섎젮 ?ъ쑀瑜??낅젰?섏꽭?? 寃곗쓽?먭? ?뺤씤?????덉뒿?덈떎.</p>
                    <textarea
                      value={settleRejectReason}
                      onChange={e => setSettleRejectReason(e.target.value)}
                      placeholder="諛섎젮 ?ъ쑀瑜??낅젰?섏꽭??
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-sm text-[var(--text-primary)] focus:border-[#ef4444] outline-none resize-none h-[80px]"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2 pt-1">
                      <button onClick={() => setSettleRejectMode(false)} className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] cursor-pointer">痍⑥냼</button>
                      <button onClick={() => {
                        if (!settleRejectReason.trim()) { alert('諛섎젮 ?ъ쑀瑜??낅젰?댁＜?몄슂'); return }
                        const approvals:any[]=getItem('acct_approvals',[])
                        const idx=approvals.findIndex(a=>a.id===detailApproval.id)
                        if(idx>=0){
                          approvals[idx].status='toResolve'
                          approvals[idx].returnedAt=getLocalISOString()
                          approvals[idx].returnReason=settleRejectReason.trim()
                          approvals[idx].returnedBy=currentUserName
                          setItem('acct_approvals',approvals)
                          setRefresh(r=>r+1)
                        }
                        setSettleRejectMode(false)
                        resetApproveState()
                        setDetailApproval(null)
                      }} className="px-4 py-2 rounded-lg bg-[#ef4444] text-white text-sm font-bold hover:bg-[#dc2626] cursor-pointer flex items-center gap-1"><Ban size={13} /> 諛섎젮 ?뺤씤</button>
                    </div>
                  </div>
                </div>
              )}
              {!isApproverPendingView && detailApproval.status === 'toResolve' && (
                <>
                  {(detailApproval as any).returnReason && (
                    <div className="w-full px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800/30 text-[11px] space-y-0.5">
                      <div className="font-bold text-[#ef4444] flex items-center gap-1"><Ban size={12} /> ?뺤궛諛섎젮 ?ъ쑀</div>
                      <div className="text-[var(--text-primary)]">{(detailApproval as any).returnReason}</div>
                      <div className="text-[var(--text-muted)] text-[10px]">諛섎젮?? {(detailApproval as any).returnedBy || '-'} 쨌 {((detailApproval as any).returnedAt || '').slice(0,10)}</div>
                    </div>
                  )}
                  <label className="px-4 py-2 rounded-lg bg-[#4f6ef7] text-white text-sm font-bold hover:bg-[#3b5de7] cursor-pointer flex items-center gap-1">
                    <Paperclip size={13} /> 利앸튃泥⑤?
                    <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.hwp" className="hidden" onChange={async e => {
                      const fileList = e.target.files; if(!fileList||fileList.length===0)return
                      const fileArr = Array.from(fileList); const fileCount = fileArr.length
                      e.target.value = ''
                      const existing:any[] = (detailApproval as any).attachments||[]
                      const newFiles:any[] = []
                      for(const f of fileArr){
                        const imageKey = `att_${detailApproval.id}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`
                        const entry:any = {name:f.name,size:f.size,type:f.type,addedAt:getLocalISOString(),title:f.name.replace(/\.[^/.]+$/,''),printWidth:150,imageKey}
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
                          }catch(err){console.error('?대?吏 ????ㅽ뙣',err)}
                        }
                        newFiles.push(entry)
                      }
                      const updated=[...existing,...newFiles]
                      // localStorage?먮뒗 dataUrl ?놁씠 硫뷀??곗씠?곕쭔 ???
                      const metaOnly = updated.map(a => {const {dataUrl, ...rest} = a; return rest})
                      const approvals:any[]=getItem('acct_approvals',[])
                      const idx=approvals.findIndex(a=>a.id===detailApproval.id)
                      if(idx>=0){
                        approvals[idx].attachments=metaOnly
                        setItem('acct_approvals',approvals)
                        setDetailApproval({...detailApproval,attachments:updated} as any)
                      }
                      alert(`${fileCount}媛??뚯씪??泥⑤??섏뿀?듬땲??`)
                    }} />
                  </label>
                  {((detailApproval as any).attachments||[]).length>0 && (
                    <button onClick={() => { if(!confirm('?뱀씤?붿껌??吏꾪뻾?섏떆寃좎뒿?덇퉴?\n?뺤궛以?紐⑸줉?쇰줈 ?대룞?⑸땲??'))return; const approvals:any[]=getItem('acct_approvals',[]); const idx=approvals.findIndex(a=>a.id===detailApproval.id); if(idx>=0){approvals[idx].status='confirming';approvals[idx].confirmedAt=getLocalISOString();setItem('acct_approvals',approvals);setRefresh(r=>r+1)} resetApproveState();setDetailApproval(null) }} className="px-4 py-2 rounded-lg bg-[#8b5cf6] text-white text-sm font-bold hover:bg-[#7c3aed] cursor-pointer flex items-center gap-1 shadow-sm"><Send size={13} /> ?뱀씤?붿껌</button>
                  )}
                </>
              )}
            </>
          }
        />
      )}

      {/* ?? ?뱀씤 ?뺤씤 紐⑤떖 ?? */}
      {approveMode && detailApproval && (() => {
        const isPreExp = !!(detailApproval as any).isPreExpense || detailApproval.status === 'preExpense' || (detailApproval.title || '').startsWith('[?좎?異?')
        return createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/40" onClick={e => { if (e.target === e.currentTarget) { setApproveMode(false); setApprovePwError('') } }}>
          <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-fadeIn">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-default)]">
              <span className="text-sm font-extrabold text-[#22c55e] flex items-center gap-1.5">??{isPreExp ? '?좎?異??뱀씤' : '?덉쓽 ?뱀씤'}</span>
              <button onClick={() => { setApproveMode(false); setApprovePwError('') }} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* ?덉쓽 ?댁슜 ?뺤씤 */}
              <div className="space-y-2">
                <div className="text-[11px] font-extrabold text-[var(--text-primary)] flex items-center gap-1">?뱥 ?덉쓽 ?댁슜 ?뺤씤</div>
                <div className="bg-[var(--bg-muted)] rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--text-muted)]">?덉쓽紐?/span>
                    <span className="font-bold text-[var(--text-primary)]">{detailApproval.title}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--text-muted)]">?좎껌??/span>
                    <span className="font-bold text-[var(--text-primary)]">{(detailApproval as any).applicant || ''}</span>
                  </div>
                  {!!(detailApproval.amount) && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--text-muted)]">湲덉븸</span>
                    <span className="font-extrabold text-[var(--text-primary)] text-[14px]">??{(detailApproval.amount || 0).toLocaleString()}</span>
                  </div>
                  )}
                  {(detailApproval as any).budgetCatName && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--text-muted)]">?덉궛援щ텇</span>
                      <span className="font-bold text-[var(--text-primary)]">{(detailApproval as any).budgetCatName}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--text-muted)]">?쇱옄</span>
                    <span className="font-bold text-[var(--text-primary)]">{(detailApproval.date || detailApproval.createdAt || '').slice(0, 10)}</span>
                  </div>
                  {detailApproval.description && (
                    <div className="text-[11px] pt-1 border-t border-[var(--border-default)]">
                      <span className="text-[var(--text-muted)]">?ъ쑀: </span>
                      <span className="text-[var(--text-primary)]">{detailApproval.description}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 鍮꾨?踰덊샇 */}
              <div>
                <label className="block text-[11px] font-extrabold text-[var(--text-primary)] mb-1">?뵏 鍮꾨?踰덊샇 ?뺤씤</label>
                <input
                  type="password"
                  value={approvePw}
                  onChange={e => { setApprovePw(e.target.value); setApprovePwError('') }}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500"
                  placeholder="鍮꾨?踰덊샇瑜??낅젰?섏꽭??
                  onKeyDown={e => { if (e.key === 'Enter') handleApproveConfirm() }}
                />
                {approvePwError && <p className="text-[11px] text-[#ef4444] mt-1 font-bold">{approvePwError}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-[var(--border-default)]">
              <button onClick={() => { setApproveMode(false); setApprovePwError('') }} className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] cursor-pointer">痍⑥냼</button>
              <button onClick={handleApproveConfirm} className="px-4 py-2 rounded-lg bg-[#22c55e] text-white text-sm font-bold hover:bg-[#16a34a] cursor-pointer flex items-center gap-1"><Check size={14} /> ?뱀씤</button>
            </div>
          </div>
        </div>
      , document.body)
      })()}

      {/* ?? 諛섎젮 ?뺤씤 紐⑤떖 ?? */}
      {rejectMode && detailApproval && createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/40" onClick={e => { if (e.target === e.currentTarget) { setRejectMode(false); setApprovePwError('') } }}>
          <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-sm mx-4 animate-fadeIn">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-default)]">
              <span className="text-sm font-extrabold text-[#ef4444] flex items-center gap-1.5">?슟 ?덉쓽 諛섎젮</span>
              <button onClick={() => { setRejectMode(false); setApprovePwError('') }} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="text-[12px] text-[var(--text-secondary)]">
                <strong>{detailApproval.title}</strong> (??(detailApproval.amount || 0).toLocaleString()}) ??諛섎젮?⑸땲??
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-[var(--text-primary)] mb-1">?뱷 諛섎젮 ?ъ쑀</label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-red-400 resize-none"
                  placeholder="諛섎젮 ?ъ쑀瑜??낅젰?댁＜?몄슂 (?좏깮)"
                />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-[var(--text-primary)] mb-1">?뵏 鍮꾨?踰덊샇 ?뺤씤</label>
                <input
                  type="password"
                  value={approvePw}
                  onChange={e => { setApprovePw(e.target.value); setApprovePwError('') }}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500"
                  placeholder="鍮꾨?踰덊샇瑜??낅젰?섏꽭??
                  onKeyDown={e => { if (e.key === 'Enter') handleRejectConfirm() }}
                />
                {approvePwError && <p className="text-[11px] text-[#ef4444] mt-1 font-bold">{approvePwError}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-[var(--border-default)]">
              <button onClick={() => { setRejectMode(false); setApprovePwError('') }} className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] cursor-pointer">痍⑥냼</button>
              <button onClick={handleRejectConfirm} className="px-4 py-2 rounded-lg bg-[#ef4444] text-white text-sm font-bold hover:bg-[#dc2626] cursor-pointer flex items-center gap-1"><Ban size={14} /> 諛섎젮 ?뺤씤</button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* ?? ?섏젙 ??紐⑤떖 (PrintApprovalForm ?꾩뿉 ?쒖떆) ?? */}
      {resubmitMode && detailApproval && !resubmitEvidenceOpen && createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/40" onClick={e => { if (e.target === e.currentTarget) { setResubmitMode(false); setApprovePwError('') } }}>
          <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-fadeIn max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-default)]">
              <span className="text-sm font-extrabold text-[var(--text-primary)]">
                {detailApproval.status === 'preExpense' ? '?좎?異??덉쓽 ?섏젙' : detailApproval.status === 'rejected' ? '諛섎젮 ?덉쓽 ?섏젙 (?ы뭹??' : '?덉쓽 ?섏젙'}
              </span>
              <button onClick={() => { setResubmitMode(false); setApprovePwError('') }} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3 flex-1 overflow-y-auto">
              {!(detailApproval as any).isGeneral && ((detailApproval as any).isPreExpense || detailApproval.status === 'preExpense') ? (() => {
                const catName = (detailApproval as any).budgetCatName || budgetCats.find(c => String(c.id) === String((detailApproval as any).budgetCatId))?.name || '誘몄???
                const itemName = (detailApproval as any).budgetItem || ''
                const subName = (detailApproval as any).budgetSubItem || ''
                const detailName = (detailApproval as any).budgetDetailItem || ''
                const budgetPath = [catName, itemName, subName, detailName].filter(Boolean).join(' > ')
                return (
                  <>
                    {/* ?? ?섏젙 媛???곸뿭 ?? */}
                    <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200/50 dark:border-blue-800/30 space-y-3">
                      <div className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">?륅툘 ?섏젙 媛??/div>
                      <div>
                        <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-1">?덉쓽紐?(?쒕ぉ)</label>
                        <input value={resubmitForm.title} onChange={e => setResubmitForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500" placeholder="?덉쓽紐낆쓣 ?낅젰?댁＜?몄슂" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-1">?ъ쑀 / 鍮꾧퀬</label>
                        <textarea value={resubmitForm.description} onChange={e => setResubmitForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500 resize-none" placeholder="?ъ쑀瑜??낅젰?댁＜?몄슂" />
                      </div>
                    </div>

                    {/* ?? ?섏젙 遺덇? ?곸뿭 ?? */}
                    <div className="p-3 rounded-xl bg-[var(--bg-muted)] border border-[var(--border-default)] space-y-2.5">
                      <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">?뵏 吏異??뺣낫 (?섏젙 遺덇?)</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-[10px] text-[var(--text-muted)] font-bold mb-0.5">湲덉븸</div>
                          <div className="text-sm font-extrabold text-[var(--text-primary)] text-right">{typeof detailApproval.amount === 'number' ? detailApproval.amount.toLocaleString('ko-KR') : resubmitForm.amount}??/div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[var(--text-muted)] font-bold mb-0.5">吏異쒖씪??/div>
                          <div className="text-sm text-[var(--text-primary)]">?뱟 {resubmitForm.date}</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[var(--text-muted)] font-bold mb-0.5">?덉궛??ぉ</div>
                        <div className="text-[12px] text-[var(--text-primary)] font-bold">?뱥 {budgetPath}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-[10px] text-[var(--text-muted)] font-bold mb-0.5">嫄곕옒泥?/div>
                          <div className="text-[12px] text-[var(--text-primary)] font-bold">?룫 {(detailApproval as any).counter || '-'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[var(--text-muted)] font-bold mb-0.5">吏異쒖닔??/div>
                          <div className="text-[12px] text-[var(--text-primary)] font-bold">?뮩 {(detailApproval as any).method || '-'}</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[var(--text-muted)] font-bold mb-0.5">?뱀씤沅뚯옄</div>
                        <div className="text-[12px] text-[var(--text-primary)] font-bold">?뫀 {(() => {
                          const cat = budgetCats.find(c => String(c.id) === String((detailApproval as any).budgetCatId))
                          if (cat && (cat as any).approvers && (cat as any).approvers.length > 0) return (cat as any).approvers.join(', ')
                          return (detailApproval as any).approver || '誘몄???
                        })()}</div>
                      </div>
                    </div>

                    {/* ?? 利앸튃泥⑤? ?? */}
                    <div className="pt-1">
                      <div className="flex items-center gap-2">
                        <label className="text-[10.5px] font-bold text-[var(--text-muted)]">?뱨 利앸튃?쒕쪟</label>
                        {((resubmitForm as any).attachments || []).length > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 font-bold">{((resubmitForm as any).attachments || []).length}嫄?/span>}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <button type="button" onClick={() => setResubmitEvidenceOpen(true)} className="px-4 py-2 rounded-lg bg-[#4f6ef7] text-white text-sm font-bold hover:bg-[#3b5de7] cursor-pointer flex items-center gap-1">
                          <Paperclip size={13} /> 利앸튃泥⑤?
                        </button>
                        {((resubmitForm as any).attachments || []).length > 0 && (
                          <button type="button" onClick={() => setResubmitEvidenceOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-default)] text-[11px] font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] cursor-pointer transition-colors">
                            <Eye size={12} /> 誘몃━蹂닿린
                          </button>
                        )}
                      </div>
                      {((resubmitForm as any).attachments || []).length > 0 && (
                        <div className="mt-2 space-y-1">
                          {((resubmitForm as any).attachments || []).map((att: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[var(--bg-muted)] border border-[var(--border-default)]">
                              <span className="text-[11px] text-[var(--text-primary)] font-bold truncate flex-1">?뱞 {att.name || `?뚯씪 ${i + 1}`}</span>
                              <button type="button" onClick={() => {
                                const updated = [...((resubmitForm as any).attachments || [])]; updated.splice(i, 1)
                                setResubmitForm(f => ({ ...f, attachments: updated } as any))
                              }} className="text-[#ef4444] text-[12px] hover:text-[#dc2626] cursor-pointer shrink-0">??/button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {detailApproval.status === 'preExpense' && (
                      <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                        <div className="text-[11px] text-amber-700 dark:text-amber-400 font-bold">?좑툘 ?좎?異????꾪뭹???꾪솚</div>
                        <div className="text-[10px] text-amber-600 dark:text-amber-500 mt-1">?섏젙 ??'?덉쓽?? ?곹깭濡??꾪솚?섏뼱 ?뱀씤?먯뿉寃??뱀씤 ?붿껌???⑸땲??</div>
                      </div>
                    )}
                  </>
                )
              })() : (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-1">?덉쓽紐?/label>
                    <input value={resubmitForm.title} onChange={e => setResubmitForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500" placeholder="?덉쓽紐낆쓣 ?낅젰?댁＜?몄슂" />
                  </div>
                  {!(detailApproval as any).isGeneral && (
                    <>
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-1">?덉궛援щ텇</label>
                      <select value={(resubmitForm as any).budgetCatId || ''} onChange={e => setResubmitForm(f => ({ ...f, budgetCatId: e.target.value } as any))} className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500">
                        <option value="">???덉궛援щ텇 ?좏깮 ??/option>
                        {budgetCats.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-1">湲덉븸</label>
                      <input value={resubmitForm.amount} onChange={e => {
                        const d = e.target.value.replace(/[^\d]/g, '')
                        setResubmitForm(f => ({ ...f, amount: d ? Number(d).toLocaleString('ko-KR') : '' }))
                      }} className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] text-sm text-[var(--text-primary)] text-right font-bold focus:outline-none focus:border-primary-500" placeholder="0" />
                    </div>
                    </>
                  )}
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-1">?좎쭨</label>
                    <input type="date" value={resubmitForm.date} onChange={e => setResubmitForm(f => ({ ...f, date: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-1">鍮꾧퀬 / ?ㅻ챸</label>
                    <textarea value={resubmitForm.description} onChange={e => setResubmitForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500 resize-none" placeholder="鍮꾧퀬瑜??낅젰?댁＜?몄슂" />
                  </div>
                  {detailApproval.status === 'preExpense' && (
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                      <div className="text-[11px] text-amber-700 dark:text-amber-400 font-bold">?좑툘 ?좎?異????꾪뭹???꾪솚</div>
                      <div className="text-[10px] text-amber-600 dark:text-amber-500 mt-1">?섏젙 ??'?덉쓽?? ?곹깭濡??꾪솚?섏뼱 ?뱀씤?먯뿉寃??뱀씤 ?붿껌???⑸땲??</div>
                    </div>
                  )}
                </>
              )}
              {approvePwError && (
                <div className="text-[12px] text-red-500 font-bold text-center">{approvePwError}</div>
              )}
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-[var(--border-default)]">
              <button onClick={() => { setResubmitMode(false); setApprovePwError('') }} className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer">痍⑥냼</button>
              <button onClick={handleResubmitConfirm} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-bold hover:bg-primary-600 transition-colors cursor-pointer">{detailApproval.status === 'rejected' ? '?ы뭹???쒖텧' : '?덉쓽?섍린'}</button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* ?? ?좎?異??덉쓽 ?섏젙: 利앸튃?쒕쪟 臾몄꽌 酉??? */}
      {resubmitEvidenceOpen && detailApproval && (() => {
        const da = detailApproval as any
        const catName = da.budgetCatName || budgetCats.find((c: any) => String(c.id) === String(da.budgetCatId))?.name || ''
        const amt = typeof detailApproval.amount === 'number' ? detailApproval.amount : (parseInt(String(detailApproval.amount || '0').replace(/,/g, '')) || 0)
        const applicantStaff = staffList.find(s => s.name === currentUserName)
        const approverName = (() => {
          const cat = budgetCats.find((c: any) => String(c.id) === String(da.budgetCatId))
          if (cat && (cat as any).approvers && (cat as any).approvers.length > 0) return (cat as any).approvers[0]
          return da.approver || ''
        })()
        const approverStaff = staffList.find(s => s.name === approverName)
        const currentAttachments = ((resubmitForm as any).attachments || []).map((a: any) => ({
          name: a.name,
          type: a.type || (a.data?.startsWith('data:image') ? 'image/jpeg' : 'application/octet-stream'),
          dataUrl: a.dataUrl || a.data,
          title: a.title || a.name,
          printWidth: a.printWidth || 150,
          row: a.row,
          imageKey: a.imageKey,
        }))
        return (
          <PrintApprovalForm
            readOnly={false}
            data={{
              date: da.date || da.createdAt?.slice(0, 10) || '',
              expenseDate: da.date || da.createdAt?.slice(0, 10) || '',
              accountName: da.budgetItem || '',
              evidenceType: catName,
              vendor: da.counter || '',
              itemName: resubmitForm.title || detailApproval.title || '',
              purpose: da.budgetSubItem || '',
              amount: amt,
              memo: resubmitForm.description || da.description || '',
              applicant: currentUserName,
              approver: approverName,
              applicantSealImg: applicantStaff?.sealImg || '',
              approverSealImg: '',
              applicantPosition: applicantStaff?.position || '',
              approverPosition: approverStaff?.position || '',
              approvalStatus: 'preExpense',
              attachments: currentAttachments,
              approvalType: '?좎?異?,
              department: (applicantStaff as any)?.department || (applicantStaff as any)?.dept || '',
            }}
            onClose={() => setResubmitEvidenceOpen(false)}
            onUpdateAttachments={(updated) => {
              const mapped = updated.map((a: any) => ({
                name: a.name,
                data: a.dataUrl || '',
                dataUrl: a.dataUrl || '',
                size: 0,
                title: a.title,
                printWidth: a.printWidth,
                row: a.row,
                imageKey: a.imageKey,
                type: a.type,
              }))
              setResubmitForm(f => ({ ...f, attachments: mapped } as any))
            }}
            actions={
              <>
                <label className="px-4 py-2 rounded-lg bg-[#4f6ef7] text-white text-sm font-bold hover:bg-[#3b5de7] cursor-pointer flex items-center gap-1">
                  <Paperclip size={13} /> 利앸튃泥⑤?
                  <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.hwp" className="hidden" onChange={async e => {
                    const fileList = e.target.files; if(!fileList||fileList.length===0)return
                    const fileArr = Array.from(fileList); e.target.value = ''
                    const existing:any[] = (resubmitForm as any).attachments||[]
                    const newFiles:any[] = []
                    for(const f of fileArr){
                      const imageKey = `att_resubmit_${Date.now()}_${Math.random().toString(36).slice(2,8)}`
                      const entry:any = {name:f.name,size:f.size,type:f.type,addedAt:getLocalISOString(),title:f.name.replace(/\.[^/.]+$/,''),printWidth:150,imageKey}
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
                          entry.dataUrl = dataUrl; entry.data = dataUrl
                        }catch(err){console.error('?대?吏 ????ㅽ뙣',err)}
                      }
                      newFiles.push(entry)
                    }
                    const updated=[...existing,...newFiles]
                    setResubmitForm(f => ({ ...f, attachments: updated } as any))
                    // PrintApprovalForm??onUpdateAttachments???몄텧?섍린 ?꾪빐 利앸튃?쒕쪟 酉곕? 由щ줈??
                    setResubmitEvidenceOpen(false)
                    setTimeout(() => setResubmitEvidenceOpen(true), 50)
                  }} />
                </label>
                {((resubmitForm as any).attachments||[]).length > 0 && (
                  <button onClick={() => {
                    if (!confirm('?뱀씤?붿껌??吏꾪뻾?섏떆寃좎뒿?덇퉴?\n?덉쓽 ?댁슜怨?利앸튃????λ릺怨??뱀씤?먯뿉寃??뱀씤 ?붿껌?⑸땲??')) return
                    setResubmitEvidenceOpen(false)
                    // handleResubmitConfirm怨??숈씪??濡쒖쭅 ?섑뻾
                    handleResubmitConfirm()
                  }} className="px-4 py-2 rounded-lg bg-[#8b5cf6] text-white text-sm font-bold hover:bg-[#7c3aed] cursor-pointer flex items-center gap-1 shadow-sm"><Send size={13} /> ?뱀씤?붿껌</button>
                )}
              </>
            }
          />
        )
      })()}
      {/* ?덉쓽 ?깅줉 紐⑤떖 */}
      {modalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={e => { if (e.target === e.currentTarget) { setModalOpen(false); setEditingId(null); setModalApprovalType('expense'); setForm({ title: '', amount: '', date: getLocalDate(), accountCode: '', description: '', applicant: currentUserName, approver: '' }) } }}>
          <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-md mx-4" style={{ height: '560px', display: 'flex', flexDirection: 'column' }}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-default)]">
              <span className="text-sm font-extrabold text-[var(--text-primary)]">{editingId ? '?덉쓽 ?섏젙' : (modalApprovalType === 'general' ? '?쇰컲?덉쓽 ?깅줉' : '吏異쒗뭹???깅줉')}</span>
              <button onClick={() => { setModalOpen(false); setEditingId(null); setModalApprovalType('expense'); setForm({ title: '', amount: '', date: getLocalDate(), accountCode: '', description: '', applicant: currentUserName, approver: '' }) }} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4 flex-1 overflow-y-auto">
              {!editingId && (
                <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-[var(--bg-muted)] border border-[var(--border-default)]">
                  <button onClick={() => { setModalApprovalType('expense'); setForm(f => ({ ...f, approver: '' })) }} className={`flex-1 py-1.5 rounded-lg text-[12px] font-extrabold transition-all cursor-pointer ${modalApprovalType === 'expense' ? 'bg-[#4f6ef7] text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>?뮯 吏異쒗뭹??/button>
                  <button onClick={() => { setModalApprovalType('general'); setForm(f => ({ ...f, approver: '' })) }} className={`flex-1 py-1.5 rounded-lg text-[12px] font-extrabold transition-all cursor-pointer ${modalApprovalType === 'general' ? 'bg-[#8b5cf6] text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>?뱥 ?쇰컲?덉쓽</button>
                </div>
              )}
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">?덉쓽紐?*</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="?? ?щТ?⑺뭹 援щℓ" className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none" />
              </div>
              {modalApprovalType !== 'general' && (
              <>
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">?덉궛援щ텇</label>
                <select value={(form as any).budgetCatId || ''} onChange={e => {
                  const catId = e.target.value
                  const cat = budgetCats.find(c => String(c.id) === catId) as any
                  // ?덉궛援щ텇???뱀씤沅뚯옄 ?먮룞 ?ㅼ젙 (異붽? ?뱀씤沅뚯옄 ?곗꽑)
                  let autoApprover = ''
                  if (cat) {
                    if (cat.approver) {
                      // 異붽? ?뱀씤沅뚯옄媛 ?덉쑝硫?異붽? ?뱀씤沅뚯옄 ?ъ슜
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
                  <option value="">???덉궛援щ텇 ?좏깮 ??/option>
                  {budgetCats.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">湲덉븸 (?? *</label>
                <input value={form.amount} onChange={e => handleAmtInput(e.target.value)} placeholder="0" className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none text-right font-bold" />
              </div>
              </>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">?좎껌??/label>
                  <input value={form.applicant} onChange={e => setForm(f => ({ ...f, applicant: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-sm text-[var(--text-primary)] outline-none" readOnly />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">{modalApprovalType === 'general' ? '?뱀씤沅뚯옄' : '吏異쒖듅?멸텒?쒖옄'}</label>
                  {modalApprovalType === 'general' ? (
                    <CustomSelect
                      value={form.approver}
                      onChange={v => setForm(f => ({ ...f, approver: v }))}
                      placeholder="???뱀씤沅뚯옄 ?좏깮 ??
                      options={[
                        { value: '', label: '???좏깮 ?? },
                        ...staffList.map(s => ({ value: s.name, label: `${s.name}${s.position ? ' (' + s.position + ')' : ''}` })),
                      ]}
                    />
                  ) : (() => {
                    const selCatId = (form as any).budgetCatId || ''
                    const selCat = selCatId ? budgetCats.find(c => String(c.id) === selCatId) as any : null
                    // 異붽? ?뱀씤沅뚯옄媛 ?덉쑝硫?異붽? ?뱀씤沅뚯옄留??쒖떆
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
                        {form.approver || <span className="text-[var(--text-muted)] font-normal">?덉궛援щ텇???좏깮?섏꽭??/span>}
                      </div>
                    )
                  })()}
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">?ъ쑀/硫붾え</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="?덉쓽 ?ъ쑀瑜??낅젰?댁＜?몄슂" rows={3} className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none resize-none" />
              </div>
              {modalApprovalType === 'general' && (
                <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 text-[11px] text-purple-700 dark:text-purple-400">
                  ?뱥 ?쇰컲?덉쓽???뱀씤沅뚯옄媛 ?뱀씤 ??<strong>利됱떆 ?꾨즺</strong> 泥섎━?⑸땲??
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-[var(--border-default)]">
              <button onClick={() => { setModalOpen(false); setEditingId(null); setModalApprovalType('expense'); setForm({ title: '', amount: '', date: getLocalDate(), accountCode: '', description: '', applicant: currentUserName, approver: '' }) }} className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] cursor-pointer">痍⑥냼</button>
              <button onClick={saveApproval} className={`px-4 py-2 rounded-lg text-white text-sm font-bold cursor-pointer ${modalApprovalType === 'general' ? 'bg-[#8b5cf6] hover:bg-[#7c3aed]' : 'bg-[#22c55e] hover:bg-[#16a34a]'}`}>{editingId ? '?섏젙' : '?깅줉'}</button>
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
function AcctVoucherEntry({ year, type, catId }: { year: number; type: 'expense' | 'income' | 'withdrawal'; catId?: string | null }) {
  const [refresh, setRefresh] = useState(0)
  const [expenseTab, setExpenseTab] = useState<'waiting' | 'history'>('waiting')
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const typeLabels = { expense: '吏異쒗븯湲?, income: '?낃툑?꾪몴', withdrawal: '異쒓툑?꾪몴' }
  const typeEmojis = { expense: '?뮯', income: '?뮫', withdrawal: '?룲' }
  const typeColors = { expense: '#ef4444', income: '#22c55e', withdrawal: '#f59e0b' }
  const typeGrads = { expense: 'from-[#ef4444] to-[#dc2626]', income: 'from-[#22c55e] to-[#16a34a]', withdrawal: 'from-[#f59e0b] to-[#d97706]' }

  const today = getLocalDate()
  const currentUser = useAuthStore(s => s.user)
  const currentUserName = currentUser?.name || (() => { try { const u = JSON.parse(localStorage.getItem('ws_user') || '{}'); return u?.name } catch { return '' } })() || 'admin'
  const [form, setForm] = useState({ desc: '', subItem: '', detailItem: '', amount: '', counter: '', method: type === 'income' ? '怨꾩쥖?댁껜' : '怨꾩쥖?댁껜', writeDate: today, tradeDate: today, inputDate: today, manager: '', expenseManager: '', approvalStatus: '?덉쓽以鍮? })
  const [wdAttachments, setWdAttachments] = useState<{name:string; data:string; size:number; title:string; printWidth:number; row?:number}[]>([])
  const [wdEvidenceOpen, setWdEvidenceOpen] = useState(false)
  const [wdEvidenceEdit, setWdEvidenceEdit] = useState(true)
  const [withdrawalMode, setWithdrawalMode] = useState<'withdrawal' | 'transfer'>('withdrawal')
  const transferAccounts = ['?꾧툑', '?곹뭹沅?, '?댁쓬', '怨꾩쥖'] as const
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
  // 異쒓툑?꾪몴 ?듯빀 寃??
  const [wdSearchText, setWdSearchText] = useState('')
  const [wdSearchFocused, setWdSearchFocused] = useState(false)
  const [wdSearchSelected, setWdSearchSelected] = useState('')
  const [isReceivable, setIsReceivable] = useState(false)
  const [isPayable, setIsPayable] = useState(false)
  const [expectedDate, setExpectedDate] = useState('')

  const user = useAuthStore(s => s.user)

  /* ?덉궛 移댄뀒怨좊━ 紐⑸줉 (?대떦 ?곕룄 + ?덉궛?뱀씤??吏異쒕떞?뱀옄 ?꾪꽣) */
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
    // ?덉궛?뱀씤??approverType=approver)?몄? ?뺤씤
    const userName = user?.name || ''
    const staffList = getItem<any[]>('ws_users', [])
    const currentStaff = staffList.find(s => s.name === userName)
    const isBudgetApprover = currentStaff?.approverType === 'approver'
    
    // ?덉궛?뱀씤?먮뒗 紐⑤뱺 ?덉궛援щ텇 ?쒖떆
    if (isBudgetApprover) return yearCats
    
    // ?쇰컲 ?ъ슜?? 吏異쒕떞?뱀옄/?뱀씤?대떦?먮줈 吏?뺣맂 移댄뀒怨좊━留?
    if (userName) {
      return yearCats.filter(c =>
        (c.users && c.users.length > 0 && c.users.includes(userName)) ||
        ((c as any).approvers && (c as any).approvers.length > 0 && (c as any).approvers.includes(userName))
      )
    }
    return yearCats
  }, [refresh, year, type, user])

  /* 怨꾩젙怨쇰ぉ 紐⑸줉 */
  const acctAccounts = useMemo(() => getItem<{ code: string; name: string; type: string }[]>('acct_accounts', []), [refresh])

  /* ?곷떒 ?덉궛?좏깮 ??蹂寃??????숆린??*/
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

  /* ?덉궛 ??ぉ (?좏깮??移댄뀒怨좊━ 湲곗?) */
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

  /* 異쒓툑?꾪몴?? ?좏깮??移댄뀒怨좊━ ???ㅼ젣 ?덉궛??ぉ留?*/
  const wdBudgetItemNames = useMemo(() => {
    if (!selectedBudgetCat) return [] as string[]
    const budgets: BudgetItem[] = getItem('acct_budgets', [])
    const filtered = budgets.filter(b => String(b.catId) === String(selectedBudgetCat))
    return Array.from(new Set(filtered.map(b => b.itemName).filter(Boolean))).sort()
  }, [selectedBudgetCat, refresh])

  /* 異쒓툑?꾪몴?? ?좏깮???덉궛??ぉ???몃ぉ (budgetItemDefs ?곗꽑, ?놁쑝硫??ㅼ젣 ?곗씠?? */
  const wdSubItemNames = useMemo(() => {
    if (!wdBudgetItem || !selectedBudgetCat) return [] as string[]
    // budgetItemDefs?먯꽌 ?몃ぉ ?뺤쓽 媛?몄삤湲?
    const defs: BudgetItemDef[] = getItem('acct_budget_item_defs', [])
    const def = defs.find(d => d.name === wdBudgetItem || d.aliases?.includes(wdBudgetItem))
    if (def && def.subItems && def.subItems.length > 0) {
      return def.subItems.sort((a, b) => a.sortOrder - b.sortOrder).map(s => s.name)
    }
    // ?뺤쓽媛 ?놁쑝硫??ㅼ젣 ?곗씠?곗뿉??異붿텧
    const budgets: BudgetItem[] = getItem('acct_budgets', [])
    const filtered = budgets.filter(b =>
      String(b.catId) === String(selectedBudgetCat) && b.itemName === wdBudgetItem
    )
    return Array.from(new Set(filtered.map(b => b.subItemName).filter(Boolean))).sort() as string[]
  }, [wdBudgetItem, selectedBudgetCat, refresh])

  /* 異쒓툑?꾪몴?? BudgetItemDef 湲곕컲 ?몄꽭??ぉ */
  const wdVoucherItemDefs = useMemo(() => getItem<BudgetItemDef[]>('acct_budget_item_defs', []).sort((a, b) => a.sortOrder - b.sortOrder), [refresh])
  const wdSelectedDef = useMemo(() => wdVoucherItemDefs.find(d => d.name === wdBudgetItem), [wdVoucherItemDefs, wdBudgetItem])
  const wdSelectedSub = useMemo(() => wdSelectedDef?.subItems.find(s => s.name === form.subItem), [wdSelectedDef, form.subItem])
  const wdDetailItems = useMemo(() => (wdSelectedSub?.detailItems || []).sort((a, b) => a.sortOrder - b.sortOrder), [wdSelectedSub])

  // ?? 異쒓툑?꾪몴 ?듯빀 寃?됱슜 ?뚮옯 由ъ뒪????
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

  /* ?덉궛?몃ぉ (吏異쒗븯湲곗슜: ?좏깮???덉궛紐⑹뿉 ?대떦?섎뒗 ?몃ぉ 紐⑸줉) */
  const subItemNames = useMemo(() => {
    if (!form.desc) return []
    // budgetItemDefs?먯꽌 ?몃ぉ ?뺤쓽 媛?몄삤湲?
    const defs: BudgetItemDef[] = getItem('acct_budget_item_defs', [])
    const def = defs.find(d => d.name === form.desc || d.aliases?.includes(form.desc))
    if (def && def.subItems && def.subItems.length > 0) {
      return def.subItems.sort((a, b) => a.sortOrder - b.sortOrder).map(s => s.name)
    }
    // ?뺤쓽媛 ?놁쑝硫??ㅼ젣 ?곗씠?곗뿉??異붿텧
    return Array.from(new Set(
      budgetItems.filter(b => b.itemName === form.desc).map(b => b.subItemName).filter(Boolean)
    )).sort() as string[]
  }, [form.desc, budgetItems])

  /* 嫄곕옒泥?由ъ뒪??(嫄곕옒泥섍?由??곕룞) */
  const vendorOptions = useMemo(() => {
    const vendors: Vendor[] = getItem('acct_vendors', [])
    const cats: BudgetCat[] = getItem('acct_budget_cats', [])
    return vendors.map(v => {
      const cat = v.budgetCatId ? cats.find(c => String(c.id) === String(v.budgetCatId)) : null
      return { value: v.name, label: v.name, budgetCatId: v.budgetCatId || '', catName: cat?.name || '' }
    })
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
    // ?ъ슜??愿???덉궛 移댄뀒怨좊━ ID
    const userName = user?.name || ''
    const staffListData = getItem<any[]>('ws_users', [])
    const curStaff = staffListData.find(s => s.name === userName)
    const isApprover = curStaff?.approverType === 'approver'
    const cats: BudgetCat[] = getItem('acct_budget_cats', [])
    const myCatIds = isApprover
      ? null // ?뱀씤沅뚯옄??紐⑤몢 ?쒖떆
      : cats.filter(c =>
          (c.users && c.users.includes(userName)) ||
          ((c as any).approvers && (c as any).approvers.includes(userName))
        ).map(c => String(c.id))

    return all.filter(c => {
      if (!c.date) return false
      if (parseInt(c.date.substring(0, 4)) !== year) return false
      if (!(c.type === type || (type === 'withdrawal' && (c.type === 'expense' || c.type === 'transfer' as any)))) return false
      // 紐⑤뱺 ?꾪몴: ?닿? ?묒꽦??寃껊쭔 ?쒖떆 (?뱀씤沅뚯옄???꾩껜)
      if (!isApprover) {
        // 異쒓툑?꾪몴: ?대떦 ?덉궛???대떦??users)??紐⑤뱺 嫄??쒖떆
        if (type === 'withdrawal') {
          const cfCatId = String((c as any).budgetCatId || '')
          const isBudgetHandler = cfCatId && cats.some(ct => String(ct.id) === cfCatId && ct.users && ct.users.includes(userName))
          if (isBudgetHandler) { /* ?덉궛 ?대떦?먮뒗 ?듦낵 */ }
          else {
            const cfCreator = (c as any).createdBy || ''
            const cfManager = (c as any).manager || ''
            if (cfCreator && cfCreator !== userName && cfManager !== userName) return false
            if (!cfCreator && cfManager && cfManager !== userName) return false
          }
        } else {
          const cfCreator = (c as any).createdBy || ''
          const cfManager = (c as any).manager || ''
          // createdBy ?먮뒗 manager媛 ?섏? ?쇱튂?섎뒗 寃쎌슦留??쒖떆
          if (cfCreator && cfCreator !== userName && cfManager !== userName) return false
          if (!cfCreator && cfManager && cfManager !== userName) return false
        }
      }
      // 愿???덉궛 ?꾪꽣
      if (myCatIds !== null) {
        const cfCatId = String((c as any).budgetCatId || '')
        if (cfCatId && myCatIds.length > 0) return myCatIds.includes(cfCatId)
        // catId ?놁쑝硫?catName?쇰줈 留ㅼ묶
        if ((c as any).budgetCatName) {
          const matchCat = cats.find(ct => ct.name === (c as any).budgetCatName)
          if (matchCat) return myCatIds.includes(String(matchCat.id))
        }
        // 留ㅼ묶 ?덈릺硫??쒖떆 ?덊븿 (鍮꾧??⑥옄)
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
    // ?泥댁쟾?????
    if (type === 'withdrawal' && withdrawalMode === 'transfer') {
      if (!transferForm.debit) { alert('李⑤?(諛쏅뒗履????좏깮?섏꽭??); return }
      if (!transferForm.credit) { alert('?蹂(蹂대궡?붿そ)???좏깮?섏꽭??); return }
      if (transferForm.debit === transferForm.credit) { alert('李⑤?怨??蹂??媛숈쓣 ???놁뒿?덈떎'); return }
      const tAmt = parseInt(transferForm.amount.replace(/,/g, '')) || 0
      if (tAmt <= 0) { alert('湲덉븸???낅젰?섏꽭??); return }
      if (!transferForm.description.trim()) { alert('?곸슂瑜??낅젰?섏꽭??); return }
      const tId = uid()
      const vId = uid()
      const acctMap: Record<string, string> = { '?꾧툑': '1010', '怨꾩쥖': '1020', '?곹뭹沅?: '1030', '?댁쓬': '1040' }
      const vouchers = getItem<Voucher[]>('acct_vouchers', [])
      vouchers.push({
        id: vId, date: transferForm.tradeDate, type: 'transfer',
        description: `${transferForm.credit} ??${transferForm.debit}`,
        entries: [
          { side: 'debit', accountCode: acctMap[transferForm.debit] || '1010', amount: tAmt },
          { side: 'credit', accountCode: acctMap[transferForm.credit] || '1020', amount: tAmt },
        ],
        createdAt: getLocalISOString(),
      })
      setItem('acct_vouchers', vouchers)
      const debitLabel = transferForm.debitDetail ? `${transferForm.debit}(${transferForm.debitDetail})` : transferForm.debit
      const creditLabel = transferForm.creditDetail ? `${transferForm.credit}(${transferForm.creditDetail})` : transferForm.credit
      const cfs = getItem<CashFlow[]>('acct_cashflows', [])
      cfs.push({
        id: tId, date: transferForm.tradeDate, type: 'transfer' as any,
        amount: tAmt, description: transferForm.description,
        accountCode: acctMap[transferForm.debit] || '1010',
        counter: `${creditLabel} ??${debitLabel}`,
        writeDate: today,
        debitAccount: transferForm.debit,
        debitDetail: transferForm.debitDetail,
        creditAccount: transferForm.credit,
        creditDetail: transferForm.creditDetail,
        memo: transferForm.memo,
        createdBy: currentUserName,
      } as any)
      setItem('acct_cashflows', cfs)
      // ?泥닿껐?섏꽌(?덉쓽) ?먮룞 ?앹꽦
      const approvals = getItem<Approval[]>('acct_approvals', [])
      const budgetCats: BudgetCat[] = getItem('acct_budget_cats', [])
      // ?뱀씤沅뚯옄 ?먮룞 ?ㅼ젙
      let autoApprover = ''
      const staffData = getItem<any[]>('ws_users', [])
      // ?덉궛援щ텇?먯꽌 ?뱀씤沅뚯옄 李얘린
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
        title: `[?泥? ${transferForm.description || (creditLabel + ' ??' + debitLabel)}`,
        amount: tAmt,
        date: transferForm.tradeDate,
        createdAt: getLocalISOString(),
        accountCode: '',
        description: transferForm.reason || `?泥댁쟾??- ${creditLabel} ??${debitLabel}`,
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
      // cashflow??approvalId ?곌껐
      const allCfs2 = getItem<CashFlow[]>('acct_cashflows', [])
      const cfIdx2 = allCfs2.findIndex(x => String(x.id) === String(tId))
      if (cfIdx2 >= 0) { (allCfs2[cfIdx2] as any).approvalId = String(preApprovalId); setItem('acct_cashflows', allCfs2) }
      setTransferForm({ debit: '', debitDetail: '', credit: '', creditDetail: '', amount: '', tradeDate: today, description: '', memo: '', reason: '' })
      setTransferAttachments([])
      setRefresh(r => r + 1)
      return
    }
    if (!form.desc.trim()) { alert('?댁슜???낅젰?섏꽭??); return }
    const amt = parseInt(form.amount.replace(/,/g, '')) || 0
    if (amt <= 0) { alert('湲덉븸???낅젰?섏꽭??); return }
    // ?낃툑/異쒓툑?꾪몴: ?덉궛援щ텇 ?꾩닔
    if ((type === 'income' || type === 'withdrawal') && !selectedBudgetCat) { alert('?덉궛援щ텇???좏깮?섏꽭??); return }

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
      budgetCatId: selectedBudgetCat || '',
      createdAt: getLocalISOString(),
    } as any)
    setItem('acct_vouchers', vouchers)

    // 罹먯떆?뚮줈 ?깅줉
    const cfs = getItem<CashFlow[]>('acct_cashflows', [])
    const newCf: any = {
      id: cfId, date: form.tradeDate, type: type === 'withdrawal' ? 'expense' : type,
      amount: amt, description: form.desc, accountCode: type === 'income' ? '4030' : '5110',
      counter: form.counter, writeDate: form.writeDate,
      tradeDate: form.tradeDate, inputDate: form.inputDate,
      method: form.method || '',
      manager: form.manager,
      budgetCatId: selectedBudgetCat || '',
      createdBy: currentUserName,
      ...(type === 'income' && (form as any).incomeNote ? { incomeNote: (form as any).incomeNote } : {}),
      ...(type === 'income' && isReceivable ? { receivable: true, received: false, expectedDate: expectedDate || '' } : {}),
      ...(type !== 'income' && isPayable ? { payable: true, paid: false, expectedDate: expectedDate || '' } : {}),
    }
    // ?덉쓽?먯꽌 吏異쒕벑濡앺븳 寃쎌슦 approvalId ?곌껐
    if (isFromApproval && selectedApprovalId) {
      newCf.approvalId = String(selectedApprovalId)
    }
    cfs.push(newCf)
    setItem('acct_cashflows', cfs)

    // ?뱀씤???덉쓽?먯꽌 吏異쒕벑濡앺븳 寃쎌슦, ?대떦 ?덉쓽 ?곹깭瑜?'toResolve'(寃곗쓽??濡?蹂寃?
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

    // 異쒓툑?꾪몴: ?덉궛 吏묓뻾??spent) ?낅뜲?댄듃
    if (type === 'withdrawal' && selectedBudgetCat && wdBudgetItem) {
      const budgets: BudgetItem[] = getItem('acct_budgets', [])
      const updated = budgets.map(b => {
        const catMatch = String(b.catId) === String(selectedBudgetCat)
        const itemMatch = b.itemName === wdBudgetItem
        const subMatch = form.subItem ? b.subItemName === form.subItem : true
        if (catMatch && itemMatch && subMatch) {
          // ?몃ぉ??吏?뺣맂 寃쎌슦 ?대떦 ?몃ぉ?먮쭔, ?꾨땶 寃쎌슦 泥?留ㅼ묶 ??ぉ??遺꾨같
          return { ...b, spent: (b.spent || 0) + amt }
        }
        return b
      })
      setItem('acct_budgets', updated)
    }

    // 吏異쒗븯湲?expense): ?덉궛 吏묓뻾???낅뜲?댄듃
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

    // 異쒓툑?꾪몴: ?좎?異??덉쓽 ?먮룞 ?앹꽦 (?덉쓽?섍린 硫붾돱???쒖떆)
    if (type === 'withdrawal') {
      const approvals = getItem<Approval[]>('acct_approvals', [])
      const budgetCats: BudgetCat[] = getItem('acct_budget_cats', [])
      const budgets: BudgetItem[] = getItem('acct_budgets', [])
      const selectedCat = budgetCats.find(c => String(c.id) === String(selectedBudgetCat))
      const catName = selectedCat?.name || wdCatName || ''
      // 吏異쒕떞?뱀옄 蹂몄씤 ?щ? ?먮퀎
      const isSelfExpense = !!(selectedCat?.users && selectedCat.users.includes(currentUserName))
      // ?뱀씤沅뚯옄 ?먮룞 ?ㅼ젙
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
      // ?대쫫?쇰줈 budgetItemId, budgetSubId 留ㅽ븨
      const matchedItem = budgets.find(b => String(b.catId) === String(selectedBudgetCat) && b.itemName === wdBudgetItem)
      const matchedSub = form.subItem ? budgets.find(b => String(b.catId) === String(selectedBudgetCat) && b.itemName === wdBudgetItem && b.subItemName === form.subItem) : null

      // 諛섎젮???덉쓽 ?ъ?異? 湲곗〈 approval ?낅뜲?댄듃
      const existingRejected = selectedApprovalId ? approvals.find(a => String(a.id) === String(selectedApprovalId) && a.status === 'rejected') : null
      let finalApprovalId: string | number
      if (existingRejected) {
        // 湲곗〈 諛섎젮 approval??preExpense濡??낅뜲?댄듃
        const updatedApprovals = approvals.map(a => {
          if (String(a.id) === String(selectedApprovalId)) {
            return {
              ...a,
              status: 'preExpense' as const,
              isPreExpense: true,
              selfExpense: isSelfExpense,
              title: `[?좎?異? ${form.desc || wdBudgetItem}`,
              amount: amt,
              date: form.tradeDate,
              description: (form as any).memo || `異쒓툑?꾪몴 ?좎?異?- ${wdBudgetItem}${form.subItem ? ' > ' + form.subItem : ''}`,
              applicant: currentUserName,
              approver: autoApprover || (a as any).approver || '',
              budgetItem: wdBudgetItem,
              budgetSubItem: form.subItem || '',
              budgetDetailItem: form.detailItem || '',
              budgetCatId: selectedBudgetCat,
              budgetCatName: catName,
              budgetItemId: matchedItem ? String(matchedItem.id) : '',
              budgetSubId: matchedSub ? String(matchedSub.id) : '',
              counter: form.counter || '',
              method: form.method || '',
              attachments: wdAttachments.length > 0 ? wdAttachments : (a as any).attachments,
              resubmittedAt: getLocalISOString(),
            } as any
          }
          return a
        })
        setItem('acct_approvals', updatedApprovals)
        finalApprovalId = selectedApprovalId!
      } else {
        // ??approval ?앹꽦
        const preApprovalId = uid()
        approvals.push({
          id: preApprovalId,
          status: 'preExpense',
          isPreExpense: true,
          selfExpense: isSelfExpense,
          title: `[?좎?異? ${form.desc || wdBudgetItem}`,
          amount: amt,
          date: form.tradeDate,
          createdAt: getLocalISOString(),
          accountCode: '',
          description: (form as any).memo || `異쒓툑?꾪몴 ?좎?異?- ${wdBudgetItem}${form.subItem ? ' > ' + form.subItem : ''}`,
          applicant: currentUserName,
          approver: autoApprover,
          budgetItem: wdBudgetItem,
          budgetSubItem: form.subItem || '',
          budgetDetailItem: form.detailItem || '',
          budgetCatId: selectedBudgetCat,
          budgetCatName: catName,
          budgetItemId: matchedItem ? String(matchedItem.id) : '',
          budgetSubId: matchedSub ? String(matchedSub.id) : '',
          counter: form.counter || '',
          method: form.method || '',
          attachments: wdAttachments.length > 0 ? wdAttachments : undefined,
        } as any)
        setItem('acct_approvals', approvals)
        finalApprovalId = preApprovalId
      }
      // cashflow??approvalId ?곌껐
      const allCfs = getItem<CashFlow[]>('acct_cashflows', [])
      const cfIdx = allCfs.findIndex(x => String(x.id) === String(cfId))
      if (cfIdx >= 0) { (allCfs[cfIdx] as any).approvalId = String(finalApprovalId); setItem('acct_cashflows', allCfs) }
    }

    setForm({ desc: '', subItem: '', detailItem: '', amount: '', counter: '', method: type === 'income' ? '怨꾩쥖?댁껜' : '怨꾩쥖?댁껜', writeDate: today, tradeDate: today, inputDate: today, manager: '', expenseManager: '', approvalStatus: '?덉쓽以鍮? })
    setCounterSearch('')
    setIsFromApproval(false)
    setWdBudgetItem('')
    setWdAttachments([])
    setWdSearchSelected('')
    setWdSearchText('')
    setSelectedApprovalId(null)
    setRefresh(r => r + 1)
  }

  const deleteEntry = (id: string | number) => {
    if (!confirm('??젣?섏떆寃좎뒿?덇퉴?')) return
    const allCfs = getItem<CashFlow[]>('acct_cashflows', [])
    const target = allCfs.find(c => String(c.id) === String(id))
    // ?곕룞???덉쓽媛 ?덉쑝硫??곹깭瑜?approved濡??섎룎由?
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
    const stored: string[] = getItem('acct_payment_methods', ['怨꾩쥖?댁껜', '?꾧툑', '移대뱶', '踰뺤씤移대뱶', '湲고?'])
    return stored.length > 0 ? stored : ['怨꾩쥖?댁껜', '?꾧툑', '移대뱶', '踰뺤씤移대뱶', '湲고?']
  }, [refresh, selectedBudgetCat])

  return (
    <div className="space-y-4">
      {/* ?? 吏異쒗븯湲? ??遺꾨━ ?? */}
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
            吏異쒕?湲?
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
            吏異쒕궡??
          </button>
        </div>
      )}

      {/* ?? ?깅줉 ??(expense媛 ?꾨땺 ?뚮쭔 ?몃씪???쒖떆) ?? */}
      {type !== 'expense' && (
      <>
      <div className={`bg-gradient-to-r ${typeGrads[type]} rounded-2xl p-4 text-white`}>
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-xl">{typeEmojis[type]}</div>
          <div>
            <div className="text-[17px] font-extrabold">媛꾪렪 {type === 'withdrawal' && withdrawalMode === 'transfer' ? '?泥댁쟾?? : typeLabels[type]}</div>
            <div className="text-[11.5px] opacity-85">{type === 'withdrawal' && withdrawalMode === 'transfer' ? '?먯궛 ?泥??댁뿭???낅젰?섏꽭?? : (type === 'income' ? '?낃툑' : '吏異?) + ' ?댁뿭???낅젰?섏꽭??}</div>
          </div>
        </div>
        {type === 'withdrawal' && (
          <div className="flex gap-1.5 mt-1">
            <button onClick={() => setWithdrawalMode('withdrawal')} className={`px-3 py-1.5 rounded-lg text-[12px] font-bold cursor-pointer transition-all ${withdrawalMode === 'withdrawal' ? 'bg-white text-amber-600 shadow-md' : 'bg-white/20 text-white hover:bg-white/30'}`}>?룲 異쒓툑</button>
            <button onClick={() => setWithdrawalMode('transfer')} className={`px-3 py-1.5 rounded-lg text-[12px] font-bold cursor-pointer transition-all ${withdrawalMode === 'transfer' ? 'bg-white text-amber-600 shadow-md' : 'bg-white/20 text-white hover:bg-white/30'}`}>?봽 ?泥?/button>
          </div>
        )}
      </div>

      {/* ?곣봺 ?泥댁쟾???낅젰 ???곣봺 */}
      {type === 'withdrawal' && withdrawalMode === 'transfer' && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">李⑤? (諛쏅뒗履? *</label>
              <CustomSelect value={transferForm.debit} onChange={v => setTransferForm(f => ({ ...f, debit: v, debitDetail: '' }))} placeholder="???좏깮 ?? options={[{ value: '', label: '???좏깮 ?? }, ...transferAccounts.map(a => ({ value: a, label: a }))]} />
              {transferForm.debit && (() => {
                const items = transferPayMethods.filter(p => p.category === transferForm.debit)
                if (items.length === 0) return null
                return (
                  <div className="mt-1.5">
                    <CustomSelect value={transferForm.debitDetail} onChange={v => setTransferForm(f => ({ ...f, debitDetail: v }))} placeholder="???몃? ?좏깮 ??
                      options={[{ value: '', label: '???몃? ?좏깮 ?? }, ...items.map(p => ({
                        value: p.name,
                        label: transferForm.debit === '怨꾩쥖' ? `${p.name} (${p.bankName || ''} ${p.accountNumber || ''})` :
                               transferForm.debit === '?꾧툑' ? `${p.name} (${p.custodian || ''} 쨌 ${p.storageLocation || ''})` :
                               transferForm.debit === '?곹뭹沅? ? `${p.name} (${p.voucherManager || ''} 쨌 ${(p.voucherAmount||0).toLocaleString()}??` :
                               transferForm.debit === '?댁쓬' ? `${p.name} (${p.noteBank || ''} 쨌 ${p.noteManager || ''})` : p.name
                      }))]}
                    />
                  </div>
                )
              })()}
            </div>
            <div>
              <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">?蹂 (蹂대궡?붿そ) *</label>
              <CustomSelect value={transferForm.credit} onChange={v => setTransferForm(f => ({ ...f, credit: v, creditDetail: '' }))} placeholder="???좏깮 ?? options={[{ value: '', label: '???좏깮 ?? }, ...transferAccounts.filter(a => a !== transferForm.debit).map(a => ({ value: a, label: a }))]} />
              {transferForm.credit && (() => {
                const items = transferPayMethods.filter(p => p.category === transferForm.credit)
                if (items.length === 0) return null
                return (
                  <div className="mt-1.5">
                    <CustomSelect value={transferForm.creditDetail} onChange={v => setTransferForm(f => ({ ...f, creditDetail: v }))} placeholder="???몃? ?좏깮 ??
                      options={[{ value: '', label: '???몃? ?좏깮 ?? }, ...items.map(p => ({
                        value: p.name,
                        label: transferForm.credit === '怨꾩쥖' ? `${p.name} (${p.bankName || ''} ${p.accountNumber || ''})` :
                               transferForm.credit === '?꾧툑' ? `${p.name} (${p.custodian || ''} 쨌 ${p.storageLocation || ''})` :
                               transferForm.credit === '?곹뭹沅? ? `${p.name} (${p.voucherManager || ''} 쨌 ${(p.voucherAmount||0).toLocaleString()}??` :
                               transferForm.credit === '?댁쓬' ? `${p.name} (${p.noteBank || ''} 쨌 ${p.noteManager || ''})` : p.name
                      }))]}
                    />
                  </div>
                )
              })()}
            </div>
            <div>
              <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">湲덉븸 (?? *</label>
              <input value={transferForm.amount} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setTransferForm(f => ({ ...f, amount: v ? parseInt(v).toLocaleString('ko-KR') : '' })) }} placeholder="0" className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-right font-bold text-[var(--text-primary)] focus:border-primary-500 outline-none" />
            </div>
            <div>
              <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">嫄곕옒?쇱옄</label>
              <DatePicker value={transferForm.tradeDate} onChange={v => setTransferForm(f => ({ ...f, tradeDate: v }))} />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">?곸슂 *</label>
              <input value={transferForm.description} onChange={e => setTransferForm(f => ({ ...f, description: e.target.value }))} placeholder={transferForm.debit && transferForm.credit ? `${transferForm.credit} ??${transferForm.debit} ?꾪솚` : '?泥??댁슜 ?낅젰'} className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">?泥댁궗??/label>
              <textarea value={transferForm.reason} onChange={e => setTransferForm(f => ({ ...f, reason: e.target.value }))} placeholder="?泥??ъ쑀瑜??낅젰?섏꽭?? rows={2} className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none resize-none" />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">鍮꾧퀬</label>
              <input value={transferForm.memo} onChange={e => setTransferForm(f => ({ ...f, memo: e.target.value }))} placeholder="?좏깮 ?낅젰" className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none" />
            </div>
          </div>
          {transferForm.debit && transferForm.credit && (
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-700 dark:text-amber-400 font-bold">
              ?봽 {transferForm.creditDetail ? `${transferForm.credit}(${transferForm.creditDetail})` : transferForm.credit} ??{transferForm.debitDetail ? `${transferForm.debit}(${transferForm.debitDetail})` : transferForm.debit} ?泥댁쟾?쒓? ?앹꽦?⑸땲??
            </div>
          )}
          {/* ?? 利앸튃 泥⑤? / 誘몃━蹂닿린 ?? */}
          <div className="mt-1">
            <div className="flex items-center gap-2">
              <label className="text-[10.5px] font-bold text-[var(--text-muted)]">?뱨 泥⑤??뚯씪 (?곸닔利?利앸튃)</label>
              {transferAttachments.length > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 font-bold">{transferAttachments.length}嫄?/span>}
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <button type="button" onClick={() => { setTransferEvidenceOpen(true); setTransferEvidenceEdit(true) }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-[var(--border-default)] text-[11px] font-bold text-[var(--text-muted)] hover:border-primary-400 hover:text-primary-500 cursor-pointer transition-colors">
                <Paperclip size={12} /> {transferAttachments.length > 0 ? '利앸튃 ?몄쭛' : '利앸튃 泥⑤?'}
              </button>
              {transferAttachments.length > 0 && (
                <button type="button" onClick={() => { setTransferEvidenceOpen(true); setTransferEvidenceEdit(false) }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-default)] text-[11px] font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] cursor-pointer transition-colors">
                  <Eye size={12} /> 誘몃━蹂닿린
                </button>
              )}
            </div>
          </div>
          {/* 利앸튃?쒕쪟 臾몄꽌 酉?(PrintApprovalForm) */}
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
                title: `[?泥? ${transferForm.description || (creditLabel + ' ??' + debitLabel)}`,
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
                  const creditDesc = creditPM && transferForm.credit === '怨꾩쥖' ? `${creditPM.bankName || ''} ${creditPM.accountNumber || ''}` : (transferForm.creditDetail || transferForm.credit)
                  const debitDesc = debitPM && transferForm.debit === '怨꾩쥖' ? `${debitPM.bankName || ''} ${debitPM.accountNumber || ''}` : (transferForm.debitDetail || transferForm.debit)
                  return `${creditDesc} ?먯꽌 ${debitDesc}(??濡??泥?
                })(),
                counter: `${creditLabel} ??${debitLabel}`,
                method: '?泥?,
                memo: transferForm.memo,
                attachments: transferAttachments.map(a => ({
                  name: a.name,
                  type: a.data?.startsWith('data:image') ? 'image/jpeg' : 'application/octet-stream',
                  dataUrl: a.data,
                  title: a.title,
                  printWidth: a.printWidth,
                  row: a.row,
                })),
                approvalType: '?좎?異?,
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
                    <Paperclip size={14} /> 利앸튃泥⑤?
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
                    <Check size={14} /> 利앸튃?꾨즺
                  </button>
                </>
              }
            />
          )})()}
          <div className="flex justify-end">
            <button onClick={saveEntry} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white text-sm font-bold cursor-pointer shadow-md bg-gradient-to-r from-[#f59e0b] to-[#d97706]">
              <Save size={14} /> ?泥??깅줉
            </button>
          </div>
        </div>
      )}

      {(type !== 'withdrawal' || withdrawalMode !== 'transfer') && (
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4 space-y-3">
        {/* ?곣봺 ?낅젰 ?곸뿭 ?곣봺 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* ?? 吏異쒗븯湲? ?덉궛援щ텇 ?? */}
          {type === 'expense' ? (
          <div>
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">?덉궛援щ텇 *</label>
            <CustomSelect
              value={isFromApproval ? (approvalMeta.budgetCatName || '') : selectedBudgetCat}
              onChange={v => {
                if (!isFromApproval) {
                  setSelectedBudgetCat(v)
                  setForm(f => ({ ...f, desc: '', subItem: '' }))
                }
              }}
              placeholder="???덉궛援щ텇 ?좏깮 ??
              options={[
                { value: '', label: '???덉궛援щ텇 ?좏깮 ?? },
                ...expBudgetCats.map(c => ({ value: String(c.id), label: c.name })),
              ]}
            />
          </div>
          ) : type === 'income' ? (
          <>
            {/* ?낃툑?꾪몴: 1) ?덉궛?좏깮 */}
            <div>
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <label className="text-[10.5px] font-bold text-[var(--text-muted)]">?덉궛?좏깮</label>
                {selectedBudgetCat && (() => {
                  const allBudgets: BudgetItem[] = getItem('acct_budgets', [])
                  const catBudgets = allBudgets.filter(b => String(b.catId) === String(selectedBudgetCat))
                  const tb = catBudgets.reduce((s, b) => s + (b.amount || 0), 0)
                  const sp = catBudgets.reduce((s, b) => s + (b.spent || 0), 0)
                  const rm = tb - sp
                  const rt = tb > 0 ? Math.round(sp / tb * 100) : 0
                  return (
                    <>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800"><span className="text-[7px] text-blue-500 font-bold">珥앹삁??/span><span className="text-[9px] font-extrabold text-blue-600">{tb.toLocaleString('ko-KR')}</span></div>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800"><span className="text-[7px] text-amber-500 font-bold">湲곗쭛??/span><span className="text-[9px] font-extrabold text-amber-600">{sp.toLocaleString('ko-KR')}</span></div>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800"><span className="text-[7px] text-emerald-500 font-bold">?붿븸</span><span className="text-[9px] font-extrabold text-emerald-600">{rm.toLocaleString('ko-KR')}</span></div>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800"><span className="text-[9px] font-extrabold text-violet-600">{rt}%</span></div>
                    </>
                  )
                })()}
              </div>
              <input value={wdCatName || '?덉궛援щ텇 ?좏깮'} readOnly className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-sm text-[var(--text-primary)] cursor-not-allowed outline-none font-bold" />
            </div>
            {/* ?낃툑?꾪몴: 2) ?낃툑?댁슜 */}
            <div>
              <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">?낃툑?댁슜</label>
              <input value={(form as any).incomeNote || ''} onChange={e => setForm(f => ({ ...f, incomeNote: e.target.value } as any))} placeholder="?? 4??蹂댁“湲??낃툑" className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none" />
            </div>
            {/* ?낃툑?꾪몴: 3) ?낃툑怨꾩젙 */}
            <div>
              <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">?낃툑怨꾩젙 *</label>
              <CustomSelect
                value={form.desc}
                onChange={v => {
                  const allIM: PayMethodItem[] = (() => { try { return JSON.parse(localStorage.getItem('acct_income_methods') || '[]') } catch { return [] } })()
                  const selectedIM = allIM.find(a => a.name === v)
                  const revenueAcct = (selectedIM as any)?.revenueAccountCode || ''
                  const assetAcct = (selectedIM as any)?.accountCode || ''
                  // ?낃툑?섎떒 ?먮룞 ?명똿: 移댄뀒怨좊━ + 怨꾩쥖?뺣낫
                  let autoMethod = ''
                  if (selectedIM) {
                    if (selectedIM.category === '怨꾩쥖' && selectedIM.bankName) {
                      autoMethod = `?룱 ${selectedIM.name} ??${selectedIM.accountNumber || ''}`
                    } else if (selectedIM.category === '?꾧툑') {
                      autoMethod = `?뮫 ${selectedIM.name}`
                    } else if (selectedIM.category === '?댁쓬') {
                      autoMethod = `?뱞 ${selectedIM.name}`
                    } else if (selectedIM.category === '?곹뭹沅?) {
                      autoMethod = `?렅截?${selectedIM.name}`
                    } else {
                      autoMethod = selectedIM.name
                    }
                  }
                  setForm(f => ({ ...f, desc: v, accountCode: revenueAcct, incomeAssetAccount: assetAcct, method: autoMethod } as any))
                }}
                placeholder="???낃툑怨꾩젙 ?좏깮 ??
                options={[
                  { value: '', label: '???낃툑怨꾩젙 ?좏깮 ?? },
                  ...(() => {
                    const allIM: PayMethodItem[] = (() => { try { return JSON.parse(localStorage.getItem('acct_income_methods') || '[]') } catch { return [] } })()
                    const filtered = selectedBudgetCat
                      ? allIM.filter(p => String(p.budgetCatId) === String(selectedBudgetCat))
                      : allIM
                    return filtered.map(a => {
                      const detail = a.category === '怨꾩쥖' && a.bankName ? ` (${a.bankName} ${a.accountNumber || ''})` : a.category === '?꾧툑' ? ` (?꾧툑)` : ''
                      const revAcct = (a as any).revenueAccountCode ? ` ??${(a as any).revenueAccountCode}` : ''
                      return { value: a.name, label: `${a.category} ??${a.name}${detail}${revAcct}` }
                    })
                  })(),
                ]}
              />
            </div>
            {/* ?낃툑?꾪몴: 4) 湲덉븸 */}
            <div>
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <label className="text-[10.5px] font-bold text-[var(--text-muted)]">湲덉븸 (?? *</label>
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
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800"><span className="text-[7px] text-blue-500 font-bold">珥앹삁??/span><span className="text-[9px] font-extrabold text-blue-600">{totalBudget.toLocaleString('ko-KR')}</span></div>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800"><span className="text-[7px] text-emerald-500 font-bold">珥앹엯湲?/span><span className="text-[9px] font-extrabold text-emerald-600">{afterIncome.toLocaleString('ko-KR')}</span></div>
                      <div className={`flex items-center gap-0.5 px-1 py-px rounded border ${remaining < 0 ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'}`}>
                        <span className={`text-[7px] font-bold ${remaining < 0 ? 'text-red-500' : 'text-amber-500'}`}>?붿뿬</span>
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
            {/* 異쒓툑?꾪몴: 1) ?덉궛?좏깮 */}
            <div>
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <label className="text-[10.5px] font-bold text-[var(--text-muted)]">?덉궛?좏깮</label>
                {selectedBudgetCat && (() => {
                  const allBudgets: BudgetItem[] = getItem('acct_budgets', [])
                  const catBudgets = allBudgets.filter(b => String(b.catId) === String(selectedBudgetCat))
                  const tb = catBudgets.reduce((s, b) => s + (b.amount || 0), 0)
                  const sp = catBudgets.reduce((s, b) => s + (b.spent || 0), 0)
                  const rm = tb - sp
                  const rt = tb > 0 ? Math.round(sp / tb * 100) : 0
                  return (
                    <>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800"><span className="text-[7px] text-blue-500 font-bold">珥앹삁??/span><span className="text-[9px] font-extrabold text-blue-600">{tb.toLocaleString('ko-KR')}</span></div>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800"><span className="text-[7px] text-amber-500 font-bold">湲곗쭛??/span><span className="text-[9px] font-extrabold text-amber-600">{sp.toLocaleString('ko-KR')}</span></div>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800"><span className="text-[7px] text-emerald-500 font-bold">?붿븸</span><span className="text-[9px] font-extrabold text-emerald-600">{rm.toLocaleString('ko-KR')}</span></div>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800"><span className="text-[9px] font-extrabold text-violet-600">{rt}%</span></div>
                    </>
                  )
                })()}
              </div>
              <input value={wdCatName || '?덉궛援щ텇 ?좏깮'} readOnly className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-sm text-[var(--text-primary)] cursor-not-allowed outline-none font-bold" />
            </div>
            {/* 異쒓툑?꾪몴: 2) ?덉쓽紐?吏異쒕궡??*/}
            <div>
              <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">{(!form.manager || form.manager === currentUserName) ? '?덉쓽紐? : '吏異쒕궡??} *</label>
              <input value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} placeholder="?? ?щТ?⑺뭹 援щℓ" className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none" />
            </div>
          </>
          )}
          {/* ?덉궛??ぉ/?몃ぉ (異쒓툑?꾪몴?먯꽌留? - ?듯빀 寃??+ 湲곗〈 ?쒕∼?ㅼ슫 */}
          {type === 'withdrawal' && (
          <>
            {/* ?? ?듯빀 寃???? */}
            <div className="relative">
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <label className="text-[10.5px] font-bold text-[var(--text-muted)]">?뵇 ?덉궛 ?듯빀 寃??/label>
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
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800"><span className="text-[7px] text-blue-500 font-bold">珥앹삁??/span><span className="text-[9px] font-extrabold text-blue-600">{tb.toLocaleString('ko-KR')}</span></div>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800"><span className="text-[7px] text-amber-500 font-bold">湲곗쭛??/span><span className="text-[9px] font-extrabold text-amber-600">{sp.toLocaleString('ko-KR')}</span></div>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800"><span className="text-[7px] text-emerald-500 font-bold">?붿븸</span><span className={`text-[9px] font-extrabold ${rm < 0 ? 'text-[#ef4444]' : 'text-emerald-600'}`}>{rm.toLocaleString('ko-KR')}</span></div>
                      <div className="flex items-center gap-0.5 px-1 py-px rounded bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800"><span className="text-[9px] font-extrabold text-violet-600">{rt}%</span></div>
                    </>
                  )
                })()}
              </div>
              {wdSearchSelected ? (
                <div className="w-full px-3 py-2.5 rounded-lg border border-primary-400 bg-primary-50/30 text-[12px] flex items-center justify-between gap-1">
                  <span className="text-[var(--text-primary)] font-bold truncate">{wdSearchSelected}</span>
                  <button type="button" onClick={() => { setWdSearchSelected(''); setWdSearchText(''); setSelectedBudgetCat(''); setWdBudgetItem(''); setWdCatName(''); setForm(f => ({...f, subItem:'', detailItem:'', amount:''})) }} className="text-[var(--text-muted)] hover:text-[#ef4444] text-[14px] shrink-0 cursor-pointer">??/button>
                </div>
              ) : (
                <input
                  type="text"
                  value={wdSearchText}
                  onChange={e => setWdSearchText(e.target.value)}
                  onFocus={() => setWdSearchFocused(true)}
                  onBlur={() => setTimeout(() => setWdSearchFocused(false), 200)}
                  placeholder="?덉궛??ぉ, ?몃ぉ, 怨꾩젙怨쇰ぉ紐? ?숈쓽??寃??.."
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
                        <span className={`text-[10px] font-extrabold ${r.remaining < 0 ? 'text-[#ef4444]' : r.remaining > 0 ? 'text-[#22c55e]' : 'text-[var(--text-muted)]'}`}>?붿븸 {r.remaining.toLocaleString()}??/span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {wdSearchFocused && wdSearchText.trim() && wdSearchResults.length === 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg shadow-lg z-50 p-3 text-center">
                  <span className="text-[11px] text-[var(--text-muted)]">寃??寃곌낵媛 ?놁뒿?덈떎</span>
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <label className="text-[10.5px] font-bold text-[var(--text-muted)]">湲덉븸 (?? *</label>
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
                        <span className="text-[7px] text-blue-500 font-bold">珥앹삁??/span>
                        <span className="text-[9px] font-extrabold text-blue-600">{totalBudget.toLocaleString('ko-KR')}</span>
                      </div>
                      <div className={`flex items-center gap-0.5 px-1 py-px rounded border ${isOver ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'}`}>
                        <span className={`text-[7px] font-bold ${isOver ? 'text-red-500' : 'text-amber-500'}`}>吏묓뻾</span>
                        <span className={`text-[9px] font-extrabold ${isOver ? 'text-red-600' : 'text-amber-600'}`}>{afterSpent.toLocaleString('ko-KR')}</span>
                      </div>
                      <div className={`flex items-center gap-0.5 px-1 py-px rounded border ${isOver ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800'}`}>
                        <span className={`text-[7px] font-bold ${isOver ? 'text-red-500' : 'text-emerald-500'}`}>?붿븸</span>
                        <span className={`text-[9px] font-extrabold ${isOver ? 'text-red-600' : 'text-emerald-600'}`}>{afterRemain.toLocaleString('ko-KR')}</span>
                      </div>
                      <div className={`flex items-center gap-0.5 px-1 py-px rounded border ${afterPct > 100 ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' : afterPct > 80 ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800' : 'bg-violet-50 dark:bg-violet-900/10 border-violet-200 dark:border-violet-800'}`}>
                        <span className={`text-[9px] font-extrabold ${afterPct > 100 ? 'text-red-600' : afterPct > 80 ? 'text-amber-600' : 'text-violet-600'}`}>{afterPct}%</span>
                        {isOver && <span className="text-[9px]">?좑툘</span>}
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
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">湲덉븸 (?? *</label>
            <input value={form.amount} onChange={e => handleAmtInput(e.target.value)} placeholder="0" className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm font-bold text-right focus:border-primary-500 outline-none" style={{ color: typeColors[type] }} />
          </div>
          )}
          {type === 'expense' && (
          <div>
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">?덉궛紐?/label>
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
                    placeholder="???덉궛紐??좏깮 ??
                    options={[
                      { value: '', label: '???덉궛紐??좏깮 ?? },
                      ...budgetItemNames.map(name => ({ value: name, label: name })),
                      { value: '__direct__', label: '?륅툘 吏곸젒 ?낅젰' },
                    ]}
                  />
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
              <input value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} placeholder="?덉궛紐??낅젰" className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none" />
            )}
          </div>
          )}
          {/* ?덉궛?몃ぉ (吏異쒗븯湲곗뿉?쒕쭔) */}
          {type === 'expense' && (
          <div>
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">?덉궛?몃ぉ</label>
            {subItemNames.length > 0 ? (
              <CustomSelect
                value={form.subItem}
                onChange={v => setForm(f => ({ ...f, subItem: v }))}
                placeholder="???덉궛?몃ぉ ?좏깮 ??
                options={[
                  { value: '', label: '???덉궛?몃ぉ ?좏깮 ?? },
                  ...subItemNames.map(n => ({ value: n, label: n })),
                ]}
              />
            ) : (
              <input value={form.subItem || '-'} readOnly className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-sm text-[var(--text-primary)] cursor-not-allowed outline-none" />
            )}
          </div>
          )}
          {/* ?대떦??(吏異쒗븯湲곗뿉?쒕쭔) */}
          {type === 'expense' && (
          <div>
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">?대떦??/label>
            <CustomSelect
              value={form.manager}
              onChange={v => setForm(f => ({ ...f, manager: v }))}
              placeholder="???대떦???좏깮 ??
              options={[
                { value: '', label: '???대떦???좏깮 ?? },
                ...staffList.map(s => ({ value: s.name, label: s.name })),
              ]}
            />
          </div>
          )}

        </div>

        {/* ?곣봺 ?섏젙 媛???곸뿭 ?곣봺 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-dashed border-[var(--border-default)]">
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
                    <button key={i} onClick={() => {
                      setForm(f => ({ ...f, counter: v.value }))
                      setCounterSearch('')
                      setShowCounterList(false)
                      /* 嫄곕옒泥섏뿉 ?곌껐???덉궛援щ텇 ?먮룞 ?ㅼ젙 */
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
                  <div className="px-3 py-2 text-[12px] text-[var(--text-muted)]">寃??寃곌낵媛 ?놁뒿?덈떎</div>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">{type === 'income' ? '?낃툑' : '吏異?}?섎떒</label>
            {type === 'income' ? (
              <input
                value={form.method || '?낃툑怨꾩젙???좏깮?섎㈃ ?먮룞 ?ㅼ젙?⑸땲??}
                readOnly
                className={`w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] text-sm outline-none cursor-not-allowed ${form.method ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-300 font-bold' : 'bg-[var(--bg-muted)] text-[var(--text-muted)]'}`}
              />
            ) : (() => {
              // 吏異쒖닔??愿由ъ뿉???깅줉???섎떒留??ъ슜 (?덉궛援щ텇蹂??꾪꽣)
              const catIdVal = selectedBudgetCat
              if (!catIdVal) {
                return (
                  <select disabled className="w-full px-2.5 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-[12px] text-[var(--text-muted)] cursor-not-allowed outline-none">
                    <option value="">???덉궛??癒쇱? ?좏깮?섏꽭????/option>
                  </select>
                )
              }
              const payOpts: {value:string; label:string; group:string}[] = []
              const allPayItems: PayMethodItem[] = (() => { try { return JSON.parse(localStorage.getItem('acct_pay_methods_v2') || '[]') } catch { return [] } })()
              const payItemsRaw = allPayItems.filter(p => String(p.budgetCatId) === String(catIdVal))
              const seen = new Set<string>()
              const payItems = payItemsRaw.filter(p => {
                const key = `${p.category}:${p.name}`
                if (seen.has(key)) return false
                seen.add(key)
                return true
              })
              // 怨꾩쥖 + ?섏쐞 移대뱶 洹몃９
              const bankGroups: {bank: typeof payItems[0]; cards: any[]}[] = []
              payItems.filter(p => p.category === '怨꾩쥖').forEach(p => {
                bankGroups.push({ bank: p, cards: p.cards || [] })
              })
              payItems.filter(p => p.category === '?꾧툑').forEach(p => payOpts.push({ value: p.name, label: `?뮫 ${p.name}`, group: '?꾧툑' }))
              // ?댁쓬: 諛쒗뻾?댁쓬留?(?섏떊?댁쓬? 異쒓툑 遺덇?)
              payItems.filter(p => p.category === '?댁쓬').forEach(p => {
                if (p.notes && p.notes.length > 0) {
                  p.notes.forEach((note: any) => {
                    const typeLabel = p.noteType === '諛쒗뻾' ? '諛쒗뻾' : '?섏떊'
                    const amt = note.amount ? Number(note.amount).toLocaleString() + '?? : ''
                    const label = `?뱞 ${p.name} - ${typeLabel} ${note.noteNumber || ''} ${amt}`.trim()
                    payOpts.push({ value: `?댁쓬:${p.name}:${note.id}`, label, group: '?댁쓬' })
                  })
                }
              })
              payItems.filter(p => p.category === '?곹뭹沅?).forEach(p => payOpts.push({ value: p.name, label: `?렅截?${p.name}`, group: '?곹뭹沅? }))
              const totalOpts = bankGroups.length + payOpts.length
              if (totalOpts === 0) {
                return (
                  <select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))} className="w-full px-2.5 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[12px] text-[var(--text-muted)] focus:outline-none focus:border-primary-500">
                    <option value="">??吏異쒖닔?⑥쓣 癒쇱? ?깅줉?섏꽭????/option>
                  </select>
                )
              }
              return (
                <select value={form.method} onChange={e => {
                  const val = e.target.value
                  setForm(f => ({ ...f, method: val }))
                  // ?댁쓬 ?좏깮 ???대떦 ?명듃???섏랬??諛쒗뻾?몄쓣 嫄곕옒泥섎줈 ?먮룞 ?ㅼ젙
                  if (val.startsWith('?댁쓬:')) {
                    const parts = val.split(':')
                    const itemName = parts[1]
                    const noteId = Number(parts[2])
                    const matchItem = payItems.find(p => p.name === itemName)
                    if (matchItem) {
                      const matchNote = (matchItem.notes || []).find((n: any) => n.id === noteId)
                      if (matchNote) {
                        const vendor = matchItem.noteType === '諛쒗뻾' ? (matchNote.receiver || '') : (matchNote.issuer || '')
                        const amt = matchNote.amount ? Number(matchNote.amount).toLocaleString() : ''
                        setForm(f => ({ ...f, ...(vendor ? { counter: vendor } : {}), ...(amt ? { amount: amt } : {}) }))
                        if (vendor) setCounterSearch('')
                        // 留뚭린????吏湲됱삁?뺤씪 ?곕룞
                        if (matchNote.maturityDate) {
                          setIsPayable(true)
                          setExpectedDate(matchNote.maturityDate)
                        }
                      }
                    }
                  }
                }} className="w-full px-2.5 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[12px] text-[var(--text-primary)] focus:outline-none focus:border-primary-500">
                  <option value="">???좏깮 ??/option>
                  {bankGroups.map(bg => (
                    <optgroup key={bg.bank.name} label={`?룱 ${bg.bank.name}${bg.bank.bankName ? ' (' + bg.bank.bankName + ')' : ''}`}>
                      <option value={`怨꾩쥖:${bg.bank.name}`}>怨꾩쥖?댁껜{bg.bank.accountNumber ? ' ??' + bg.bank.accountNumber : ''}</option>
                      {bg.cards.map((card: any) => (
                        <option key={card.id || card.cardNumber} value={`移대뱶:${card.cardName || card.cardNumber}`}>?뮩 {card.cardName || '移대뱶'}{card.cardNumber ? ' ' + card.cardNumber : ''}</option>
                      ))}
                    </optgroup>
                  ))}
                  {payOpts.filter(o => o.group === '?꾧툑').length > 0 && (
                    <optgroup label="?뮫 ?꾧툑">
                      {payOpts.filter(o => o.group === '?꾧툑').map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </optgroup>
                  )}
                  {payOpts.filter(o => o.group === '?댁쓬').length > 0 && (
                    <optgroup label="?뱞 ?댁쓬">
                      {payOpts.filter(o => o.group === '?댁쓬').map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </optgroup>
                  )}
                  {payOpts.filter(o => o.group === '?곹뭹沅?).length > 0 && (
                    <optgroup label="?렅截??곹뭹沅?>
                      {payOpts.filter(o => o.group === '?곹뭹沅?).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </optgroup>
                  )}
                </select>
              )
            })()}
          </div>
          {type !== 'expense' && (
          <div>
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">{type === 'income' ? '?꾪몴 ?깅줉?쇱옄' : '?꾪몴?묒꽦?쇱옄'}</label>
            <DatePicker value={form.writeDate} onChange={v => setForm(f => ({ ...f, writeDate: v }))} />
          </div>
          )}
          <div>
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">{type === 'income' ? '?ㅼ젣嫄곕옒?쇱옄' : '?ㅼ젣嫄곕옒?쇱옄'}</label>
            <DatePicker value={form.tradeDate} onChange={v => setForm(f => ({ ...f, tradeDate: v }))} />
          </div>
          {/* 誘몄닔湲??듭뀡 (?낃툑?꾪몴) */}
          {type === 'income' && (
            <div className="bg-orange-50/60 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg p-2.5 col-span-2">
              <div className="flex items-center gap-3 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isReceivable} onChange={e => { setIsReceivable(e.target.checked); if (!e.target.checked) setExpectedDate('') }} className="w-4 h-4 rounded border-orange-300 text-orange-500 accent-orange-500" />
                  <span className="text-[11px] font-bold text-orange-700 dark:text-orange-400">?뱿 誘몄닔湲?/span>
                </label>
                <div className={`flex items-center gap-1.5 transition-opacity ${isReceivable ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                  <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 whitespace-nowrap">?낃툑?덉젙??/span>
                  <DatePicker value={expectedDate} onChange={v => setExpectedDate(v)} />
                </div>
              </div>
            </div>
          )}
          {/* 誘몄?湲됯툑 ?듭뀡 (異쒓툑?꾪몴) */}
          {type === 'withdrawal' && (
            <div className="bg-violet-50/60 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800 rounded-lg p-2.5 col-span-2">
              <div className="flex items-center gap-3 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isPayable} onChange={e => { setIsPayable(e.target.checked); if (!e.target.checked) setExpectedDate('') }} className="w-4 h-4 rounded border-violet-300 text-violet-500 accent-violet-500" />
                  <span className="text-[11px] font-bold text-violet-700 dark:text-violet-400">?뱾 誘몄?湲됯툑</span>
                </label>
                <div className={`flex items-center gap-1.5 transition-opacity ${isPayable ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                  <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 whitespace-nowrap">吏湲됱삁?뺤씪</span>
                  <DatePicker value={expectedDate} onChange={v => setExpectedDate(v)} />
                </div>
              </div>
            </div>
          )}
          {/* ?꾪몴?좎쭨 (湲곗〈 ?낅젰?쇱옄) */}
          {type === 'expense' && (
          <div>
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">?꾪몴?좎쭨</label>
            <DatePicker value={form.inputDate} onChange={v => setForm(f => ({ ...f, inputDate: v }))} />
          </div>
          )}
        </div>
        {/* ?대떦??(異쒓툑?꾪몴) */}
        {type === 'withdrawal' && (
          <div className="pt-2">
            <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">?대떦??/label>
            <CustomSelect
              value={form.manager}
              onChange={v => setForm(f => ({ ...f, manager: v }))}
              placeholder="???대떦???좏깮 ??
              options={[
                { value: '', label: '???대떦???좏깮 ?? },
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
                <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">{isSelfMode ? '?덉쓽?ъ쑀' : '鍮꾧퀬'}</label>
                <textarea
                  value={(form as any).memo || ''}
                  onChange={e => setForm(f => ({ ...f, memo: e.target.value } as any))}
                  placeholder={isSelfMode ? '?덉쓽 ?ъ쑀瑜??낅젰?섏꽭?? : '李멸퀬 ?ы빆???낅젰?섏꽭??}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none resize-none h-[56px]"
                />
              </div>
            )
          })()
        }
        {/* 泥⑤??뚯씪 (異쒓툑?꾪몴 - ?대떦??蹂몄씤???뚮쭔) */}
        {type === 'withdrawal' && (!form.manager || form.manager === currentUserName) && (
          <div className="pt-1">
            <div className="flex items-center gap-2">
              <label className="text-[10.5px] font-bold text-[var(--text-muted)]">?뱨 泥⑤??뚯씪 (?곸닔利?利앸튃)</label>
              {wdAttachments.length > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 font-bold">{wdAttachments.length}嫄?/span>}
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <button type="button" onClick={() => { setWdEvidenceOpen(true); setWdEvidenceEdit(true) }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-[var(--border-default)] text-[11px] font-bold text-[var(--text-muted)] hover:border-primary-400 hover:text-primary-500 cursor-pointer transition-colors">
                <Paperclip size={12} /> {wdAttachments.length > 0 ? '利앸튃 ?몄쭛' : '利앸튃 泥⑤?'}
              </button>
              {wdAttachments.length > 0 && (
                <button type="button" onClick={() => { setWdEvidenceOpen(true); setWdEvidenceEdit(false) }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-default)] text-[11px] font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] cursor-pointer transition-colors">
                  <Eye size={12} /> 誘몃━蹂닿린
                </button>
              )}
            </div>
          </div>
        )}
        {/* 利앸튃?쒕쪟 臾몄꽌 酉?(PrintApprovalForm) */}
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
                approvalType: '?좎?異?,
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
                    <Paperclip size={14} /> 利앸튃泥⑤?
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
                      <Check size={14} /> 利앸튃?꾨즺
                    </button>
                  )}
                </>
              }
            />
          )
        })()}
        <div className="flex justify-end">
          <button onClick={saveEntry} className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white text-sm font-bold cursor-pointer shadow-md bg-gradient-to-r ${typeGrads[type]}`}>
            <Save size={14} /> {type === 'income' ? '?낃툑 ?깅줉' : (type === 'withdrawal' && (!form.manager || form.manager === currentUserName) ? '寃곗쓽?덉쓽' : '吏異??깅줉')}
          </button>
        </div>
      </div>
      )}
      </>
      )}

      {/* ?? 吏異쒕?湲?由ъ뒪??(?뱀씤???덉쓽) ?? */}
      {type === 'expense' && expenseTab === 'waiting' && (() => {
        const approvals = getItem<Approval[]>('acct_approvals', [])
        const cats: BudgetCat[] = getItem('acct_budget_cats', [])
        // ?ъ슜?먭? 吏異쒕떞?뱀옄濡??깅줉??紐⑤뱺 移댄뀒怨좊━ (ID + ?대쫫 留ㅼ묶)
        const userName = currentUserName
        const userCatIds = new Set(cats.filter(c => c.users && c.users.includes(userName)).map(c => String(c.id)))
        const userCatNames = new Set(cats.filter(c => c.users && c.users.includes(userName)).map(c => c.name))
        const staffListData = getItem<any[]>('ws_users', [])
        const curStaff = staffListData.find(s => s.name === userName)
        const isApprover = curStaff?.approverType === 'approver'
        const approved = approvals.filter(a => {
          if (a.status !== 'approved') return false
          // ?덉궛援щ텇???녿뒗 ??ぉ? 吏異쒕?湲곗뿉 ?쒖떆?섏? ?딆쓬
          const aCatId = String((a as any).budgetCatId || '')
          const aCatName = (a as any).budgetCatName || ''
          if (!aCatId && !aCatName) return false
          // ID濡?留ㅼ묶
          if (aCatId && userCatIds.has(aCatId)) return true
          // ?대쫫?쇰줈 留ㅼ묶
          if (aCatName && userCatNames.has(aCatName)) return true
          // ?뱀씤?먮뒗 紐⑤뱺 ??ぉ 蹂????덉쓬
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
                <span className="text-sm font-extrabold text-[var(--text-primary)]">吏異쒕?湲?由ъ뒪??/span>
                <span className="text-[10px] text-white bg-amber-500 px-2 py-0.5 rounded-full font-bold">{approved.length}嫄?/span>
              </div>
              <span className="text-[11px] text-[var(--text-muted)]">?뱀씤???덉쓽瑜??대┃?섎㈃ 吏異??낅젰?쇰줈 ?대룞?⑸땲??/span>
            </div>
            <div className="divide-y divide-[var(--border-default)]">
              {approved.map(a => (
                <div key={a.id} className="flex items-center gap-3 px-4 py-3 hover:bg-amber-50/30 dark:hover:bg-amber-900/5 transition-colors cursor-pointer group"
                  onClick={() => {
                    const aa = a as any
                    // ?뱀씤 ???ㅼ젙???덉궛紐??몃ぉ 議고쉶
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
                    // ?덉궛 移댄뀒怨좊━??吏異쒖닔???먮룞 ?좏깮
                    const budgetCatsAll: BudgetCat[] = getItem('acct_budget_cats', [])
                    const matchedCat = aa.budgetCatId ? budgetCatsAll.find(c => String(c.id) === String(aa.budgetCatId)) : null
                    let autoMethod = ''
                    if (matchedCat?.accounts && matchedCat.accounts.length > 0) {
                      // 紐⑤뱺 怨꾩쥖+移대뱶 ?듭뀡 ?섏쭛
                      const allPayOpts: string[] = []
                      matchedCat.accounts.forEach(acct => {
                        if (acct.bankName) allPayOpts.push(`怨꾩쥖:${acct.bankName}`)
                        if (acct.cards) acct.cards.forEach(card => allPayOpts.push(`移대뱶:${card}`))
                      })
                      // 1媛쒕㈃ ?먮룞?좏깮, 蹂듭닔硫??좏깮?섎룄濡?鍮덇컪
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
                    // ?덉궛 ??ぉ?먯꽌 怨꾩젙肄붾뱶 議고쉶 (?뺤떇 肄붾뱶 ?곗꽑)
                    let resolvedAcctCode = aa.accountCode || ''
                    if (aa.budgetItemId) {
                      const bi = allBudgets.find(b => String(b.id) === String(aa.budgetItemId))
                      if (bi?.accountCode) resolvedAcctCode = bi.accountCode
                    }
                    if (aa.budgetSubId) {
                      const bs = allBudgets.find(b => String(b.id) === String(aa.budgetSubId))
                      if (bs?.accountCode) resolvedAcctCode = bs.accountCode
                    }
                    // budgetItem ?대쫫?쇰줈 ?덉궛 ??ぉ 議고쉶?섏뿬 ?뺤떇 怨꾩젙肄붾뱶 留ㅼ묶
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
                      <span className="text-[13px] font-bold text-[var(--text-primary)] truncate">{a.title || a.description || '(?쒕ぉ?놁쓬)'}</span>
                      {getCatName(a) && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400 font-bold whitespace-nowrap shrink-0">{getCatName(a)}</span>
                      )}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)]">
                      ?덉쓽?? {a.applicant || '-'} 쨌 ?뱀씤?? {a.approver || '-'} 쨌 {a.date || a.createdAt?.slice(0,10) || '-'}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[14px] font-extrabold text-amber-600">{a.amount ? formatNumber(a.amount) : '0'}??/div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-600 dark:bg-green-900/20 font-bold">?뱀씤?꾨즺</span>
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

      {/* ?? ?댁뿭 由ъ뒪???? */}
      {(type !== 'expense' || expenseTab === 'history') && (
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-2">
            <ScrollText size={14} className="text-primary-500" />
            <span className="text-sm font-extrabold text-[var(--text-primary)]">{type === 'income' ? '?낃툑' : '吏異?} ?댁뿭</span>
            {type === 'withdrawal' && <span className="text-[9px] text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded font-bold">?泥??ы븿</span>}
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
                  {['?좎쭨', '?댁슜', ...(type === 'income' ? ['?낃툑?댁슜'] : ['?대떦??, '?덉쓽?곹깭']), '湲덉븸', '??젣'].map(h => (
                    <th key={h} className={cn('py-2.5 px-3.5 text-[11px] font-bold text-[var(--text-muted)]',
                      h === '湲덉븸' ? 'text-right' : h === '??젣' ? 'text-center w-[50px]' : h === '?덉쓽?곹깭' ? 'text-center w-[80px]' : h === '?대떦?? ? 'text-center w-[70px]' : 'text-left')}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cashflows.map(c => (
                  <tr key={c.id} className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-muted)] transition-colors">
                    <td className="py-2.5 px-3.5 text-[12px] text-[var(--text-secondary)]">{c.date || ''}</td>
                    <td className="py-2.5 px-3.5 text-[12px] font-bold text-[var(--text-primary)]">{(c as any).type === 'transfer' ? '?봽 ' : ''}{c.description || '-'}{(c as any).type === 'transfer' && (c as any).counter && <span className="text-[10px] text-amber-600 ml-1">({(c as any).counter})</span>}</td>
                    {type === 'income' && (
                      <td className="py-2.5 px-3.5 text-[12px] text-[var(--text-secondary)]">{(c as any).incomeNote || '-'}</td>
                    )}
                    {type !== 'income' && (
                      <td className="py-2.5 px-3.5 text-[11px] text-center text-[var(--text-secondary)]">{(c as any).manager || '-'}</td>
                    )}
                    {type !== 'income' && (() => {
                      // ?곌껐???덉쓽???ㅼ젣 吏꾪뻾?곹깭 ?먮룞 ?쒖떆
                      const sMap: Record<string, { label: string; color: string; bg: string }> = {
                        preExpense: { label: (c as any).type === 'transfer' ? '?泥댄븳' : '吏異쒗븳', color: (c as any).type === 'transfer' ? '#8b5cf6' : '#f97316', bg: (c as any).type === 'transfer' ? 'rgba(139,92,246,.12)' : 'rgba(249,115,22,.12)' },
                        pending: { label: '?덉쓽??, color: '#3b82f6', bg: 'rgba(59,130,246,.12)' },
                        approved: { label: '?뱀씤', color: '#22c55e', bg: 'rgba(34,197,94,.12)' },
                        rejected: { label: '諛섎젮', color: '#ef4444', bg: 'rgba(239,68,68,.12)' },
                        expensed: { label: '吏異?, color: '#8b5cf6', bg: 'rgba(139,92,246,.12)' },
                        toResolve: { label: '寃곗쓽', color: '#6366f1', bg: 'rgba(99,102,241,.12)' },
                        confirming: { label: '?뺤궛以?, color: '#0ea5e9', bg: 'rgba(14,165,233,.12)' },
                        completed: { label: '?꾨즺', color: '#10b981', bg: 'rgba(16,185,129,.12)' },
                      }
                      let statusLabel = '誘몄뿰寃?
                      let statusColor = '#94a3b8'
                      let statusBg = 'rgba(148,163,184,.12)'
                      const allAp: any[] = getItem('acct_approvals', [])
                      let aId = (c as any).approvalId
                      // approvalId媛 ?놁쑝硫??쒕ぉ/湲덉븸?쇰줈 留ㅼ묶 ?쒕룄
                      if (!aId && c.description) {
                        const matched = allAp.find((a: any) =>
                          (a.title?.includes(c.description) || a.description?.includes(c.description)) && a.amount === c.amount
                        ) || allAp.find((a: any) =>
                          a.title?.includes(c.description)
                        )
                        if (matched) {
                          aId = String(matched.id)
                          // ?먮룞 ?곌껐 ???
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
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${statusLabel === '諛섎젮' ? 'cursor-pointer hover:ring-2 hover:ring-red-300 transition-all' : ''}`}
                            style={{ background: statusBg, color: statusColor }}
                            onClick={() => {
                              if (statusLabel === '諛섎젮' && aId) {
                                // 諛섎젮???덉쓽: cashflow + approval ?곗씠?곕? ?쇱뿉 梨꾩?
                                const cf = c as any
                                const apAll: any[] = getItem('acct_approvals', [])
                                const ap = apAll.find((a: any) => String(a.id) === String(aId))
                                const rawAmt = cf.amount || ap?.amount || 0
                                setForm(prev => ({
                                  ...prev,
                                  desc: cf.description || ap?.title?.replace('[?좎?異? ', '') || '',
                                  amount: rawAmt ? Number(rawAmt).toLocaleString('ko-KR') : '',
                                  writeDate: cf.date || today,
                                  tradeDate: cf.tradeDate || cf.date || today,
                                  manager: cf.manager || ap?.applicant || '',
                                  counter: cf.counter || ap?.counter || '',
                                  method: cf.method || ap?.method || '怨꾩쥖?댁껜',
                                  subItem: cf.subItem || ap?.budgetSubItem || '',
                                  detailItem: cf.detailItem || ap?.budgetDetailItem || '',
                                  memo: cf.memo || ap?.description || '',
                                } as any))
                                // 嫄곕옒泥?寃???꾨뱶
                                setCounterSearch(cf.counter || ap?.counter || '')
                                // ?덉궛 移댄뀒怨좊━ ?ㅼ젙 (approval?먯꽌 ?곗꽑)
                                const catId = cf.budgetCatId || ap?.budgetCatId || ''
                                if (catId) setSelectedBudgetCat(String(catId))
                                // ?덉궛??ぉ (approval?먯꽌 媛?몄샂)
                                const budgetItem = ap?.budgetItem || cf.budgetItem || ''
                                if (budgetItem) setWdBudgetItem(budgetItem)
                                // ?덉궛 移댄뀒怨좊━紐?
                                const catName = ap?.budgetCatName || cf.budgetCatName || ''
                                if (catName) setWdCatName(catName)
                                // ?덉궛 ?듯빀 寃???꾨뱶???좏깮??媛??쒖떆
                                const subItem = cf.subItem || ap?.budgetSubItem || ''
                                const detailItem = cf.detailItem || ap?.budgetDetailItem || ''
                                const searchLabel = [catName, budgetItem, subItem, detailItem].filter(Boolean).join(' > ')
                                if (searchLabel) setWdSearchSelected(searchLabel)
                                // 泥⑤??뚯씪 (approval?먯꽌 ?곗꽑)
                                const attachments = ap?.attachments || cf.attachments
                                if (attachments) setWdAttachments(attachments)
                                // ?몄쭛 以묒씤 approval ID ???
                                setSelectedApprovalId(aId)
                                // ?ㅽ겕濡??꾨줈
                                window.scrollTo({ top: 0, behavior: 'smooth' })
                              }
                            }}
                            title={statusLabel === '諛섎젮' ? '?대┃?섏뿬 ?섏젙' : ''}
                          >
                            {statusLabel}
                          </span>
                        </td>
                      )
                    })()}
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
      )}

      {/* ?먥븧??吏異쒕벑濡??앹뾽 紐⑤떖 (expense ?꾩슜) ?먥븧??*/}
      {type === 'expense' && showExpenseModal && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          {/* ?ㅻ쾭?덉씠 */}
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowExpenseModal(false)} />
          {/* 紐⑤떖 肄섑뀗痢?*/}
          <div className="flex min-h-full items-center justify-center py-8 px-4">
          <div className="relative w-full max-w-2xl rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-2xl">
            {/* 紐⑤떖 ?ㅻ뜑 */}
            <div className={`bg-gradient-to-r ${typeGrads[type]} rounded-t-2xl p-4 text-white`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-xl">{typeEmojis[type]}</div>
                  <div>
                    <div className="text-[17px] font-extrabold">吏異??깅줉</div>
                    <div className="text-[11.5px] opacity-85">?뱀씤???덉쓽??吏異??댁뿭???낅젰?섏꽭??/div>
                  </div>
                </div>
                <button onClick={() => setShowExpenseModal(false)} className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center cursor-pointer transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>
            {/* ?? ?곷떒: ?덉쓽 ?뺣낫 (?쎄린?꾩슜) ?? */}
            <div className="p-4 space-y-3 border-b border-[var(--border-default)] bg-amber-50/60 dark:bg-amber-900/5">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[11px] font-bold text-amber-600">?뱥 ?덉쓽 ?뺣낫</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
                <div>
                  <div className="text-[9.5px] font-bold text-[var(--text-muted)] mb-0.5">?덉궛援щ텇</div>
                  <div className="text-[12px] font-bold text-[var(--text-primary)]">{approvalMeta.budgetCatName || '-'}</div>
                </div>
                <div>
                  <div className="text-[9.5px] font-bold text-[var(--text-muted)] mb-0.5">?덉궛紐?/div>
                  <div className="text-[12px] font-bold text-[var(--text-primary)]">{form.desc || '-'}</div>
                </div>
                <div>
                  <div className="text-[9.5px] font-bold text-[var(--text-muted)] mb-0.5">?덉궛?몃ぉ</div>
                  <div className="text-[12px] font-bold text-[var(--text-primary)]">{form.subItem || '-'}</div>
                </div>
                <div>
                  <div className="text-[9.5px] font-bold text-[var(--text-muted)] mb-0.5">怨꾩젙怨쇰ぉ</div>
                  <div className="text-[12px] font-bold text-primary-600">
                    {(() => {
                      const code = approvalMeta.accountCode
                      if (!code) return '-'
                      // 1) ?뺥솗??肄붾뱶 留ㅼ묶
                      let found = acctAccounts.find(a => a.code === code)
                      // 2) ????쒓굅 留ㅼ묶
                      if (!found) found = acctAccounts.find(a => a.code.replace(/-/g, '') === code.replace(/-/g, ''))
                      // 3) ?덉궛紐??대쫫?쇰줈 留ㅼ묶 (?쒕뱶 ?곗씠???명솚)
                      if (!found && form.desc) found = acctAccounts.find(a => a.name === form.desc)
                      return found ? `${found.code} ${found.name}` : code
                    })()}
                  </div>
                </div>
                <div>
                  <div className="text-[9.5px] font-bold text-[var(--text-muted)] mb-0.5">湲덉븸</div>
                  <div className="text-[14px] font-extrabold text-[#ef4444]">{form.amount || '0'}??/div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 pt-1">
                <div>
                  <div className="text-[9.5px] font-bold text-[var(--text-muted)] mb-0.5">?덉쓽??/div>
                  <div className="text-[12px] text-[var(--text-secondary)]">{form.manager || '-'}</div>
                </div>
                <div>
                  <div className="text-[9.5px] font-bold text-[var(--text-muted)] mb-0.5">?덉쓽??/div>
                  <div className="text-[12px] text-[var(--text-secondary)]">{approvalMeta.requestDate || '-'}</div>
                </div>
                <div>
                  <div className="text-[9.5px] font-bold text-[var(--text-muted)] mb-0.5">?뱀씤??/div>
                  <div className="text-[12px] text-[var(--text-secondary)]">{approvalMeta.approver || '-'}</div>
                </div>
                <div>
                  <div className="text-[9.5px] font-bold text-[var(--text-muted)] mb-0.5">?뱀씤??/div>
                  <div className="text-[12px] text-[var(--text-secondary)]">{approvalMeta.approvedDate || '-'}</div>
                </div>
                <div>
                  <div className="text-[9.5px] font-bold text-[var(--text-muted)] mb-0.5">吏異쒕떞?뱀옄</div>
                  <div className="text-[12px] font-bold text-primary-600">{user?.name || '-'}</div>
                </div>
              </div>
            </div>

            {/* ?? ?섎떒: 吏異??낅젰 ?? */}
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[11px] font-bold text-[var(--text-muted)]">?륅툘 吏異??낅젰</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 嫄곕옒泥?*/}
                <div ref={counterRef} className="relative">
                  <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">嫄곕옒泥?/label>
                  <input value={counterSearch || form.counter} onChange={e => { setCounterSearch(e.target.value); setShowCounterList(true); setForm(f => ({ ...f, counter: '' })) }}
                    onFocus={() => setShowCounterList(true)} placeholder="嫄곕옒泥섎챸 寃??.." className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none" />
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
                        <div className="px-3 py-2 text-[12px] text-[var(--text-muted)]">寃??寃곌낵媛 ?놁뒿?덈떎</div>
                      )}
                    </div>
                  )}
                </div>
                {/* 吏異쒖닔??*/}
                <div>
                  <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">吏異쒖닔??/label>
                  {(() => {
                    // ?덉쓽 ?곕룞?????덉궛 移댄뀒怨좊━???ㅼ젣 怨꾩쥖/移대뱶 紐⑸줉 ?앹꽦
                    const catIdVal = isFromApproval ? approvalMeta.budgetCatId : selectedBudgetCat
                    const payOptions: {value:string; label:string; group:string}[] = []
                    // 吏異쒖닔??愿由ъ뿉???깅줉???섎떒留??ъ슜 (?덉궛援щ텇蹂??꾪꽣)
                    const allPM: PayMethodItem[] = (() => { try { return JSON.parse(localStorage.getItem('acct_pay_methods_v2') || '[]') } catch { return [] } })()
                    const filteredPMRaw = catIdVal
                      ? allPM.filter(p => String(p.budgetCatId) === String(catIdVal))
                      : []
                    // 媛숈? ?대쫫+移댄뀒怨좊━ 以묐났 ?쒓굅
                    const seenPM = new Set<string>()
                    const filteredPM = filteredPMRaw.filter(p => {
                      const key = `${p.category}:${p.name}`
                      if (seenPM.has(key)) return false
                      seenPM.add(key)
                      return true
                    })
                    // 怨꾩쥖 + ?섏쐞 移대뱶 洹몃９
                    const bankGroups2: {bank: typeof filteredPM[0]; cards: any[]}[] = []
                    filteredPM.filter(p => p.category === '怨꾩쥖').forEach(p => {
                      bankGroups2.push({ bank: p, cards: p.cards || [] })
                    })
                    filteredPM.filter(p => p.category === '?꾧툑').forEach(p => payOptions.push({ value: p.name, label: `?뮫 ${p.name}`, group: '?꾧툑' }))
                    // ?댁쓬: 媛쒕퀎 諛쒗뻾 ?명듃 由ъ뒪??
                    filteredPM.filter(p => p.category === '?댁쓬').forEach(p => {
                      if (p.notes && p.notes.length > 0) {
                        p.notes.forEach((note: any) => {
                          const typeLabel = p.noteType === '諛쒗뻾' ? '諛쒗뻾' : '?섏떊'
                          const amt = note.amount ? Number(note.amount).toLocaleString() + '?? : ''
                          const label = `?뱞 ${p.name} - ${typeLabel} ${note.noteNumber || ''} ${amt}`.trim()
                          payOptions.push({ value: `?댁쓬:${p.name}:${note.id}`, label, group: '?댁쓬' })
                        })
                      }
                    })
                    filteredPM.filter(p => p.category === '?곹뭹沅?).forEach(p => payOptions.push({ value: p.name, label: `?렅截?${p.name}`, group: '?곹뭹沅? }))
                    return (
                      <select value={form.method} onChange={e => {
                        const val = e.target.value
                        setForm(f => ({ ...f, method: val }))
                        if (val.startsWith('?댁쓬:')) {
                          const parts = val.split(':')
                          const itemName = parts[1]
                          const noteId = Number(parts[2])
                          const matchItem = filteredPM.find(p => p.name === itemName)
                          if (matchItem) {
                            const matchNote = (matchItem.notes || []).find((n: any) => n.id === noteId)
                            if (matchNote) {
                              const vendor = matchItem.noteType === '諛쒗뻾' ? (matchNote.receiver || '') : (matchNote.issuer || '')
                              const amt = matchNote.amount ? Number(matchNote.amount).toLocaleString() : ''
                              setForm(f => ({ ...f, ...(vendor ? { counter: vendor } : {}), ...(amt ? { amount: amt } : {}) }))
                              if (vendor) setCounterSearch('')
                              if (matchNote.maturityDate) {
                                setIsPayable(true)
                                setExpectedDate(matchNote.maturityDate)
                              }
                            }
                          }
                        }
                      }} className="w-full px-2.5 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[12px] text-[var(--text-primary)] focus:outline-none focus:border-primary-500">
                        <option value="">???좏깮 ??/option>
                        {bankGroups2.map(bg => (
                          <optgroup key={bg.bank.name} label={`?룱 ${bg.bank.name}${bg.bank.bankName ? ' (' + bg.bank.bankName + ')' : ''}`}>
                            <option value={`怨꾩쥖:${bg.bank.name}`}>怨꾩쥖?댁껜{bg.bank.accountNumber ? ' ??' + bg.bank.accountNumber : ''}</option>
                            {bg.cards.map((card: any) => (
                              <option key={card.id || card.cardNumber} value={`移대뱶:${card.cardName || card.cardNumber}`}>?뮩 {card.cardName || '移대뱶'}{card.cardNumber ? ' ' + card.cardNumber : ''}</option>
                            ))}
                          </optgroup>
                        ))}
                        {payOptions.filter(o => o.group === '?꾧툑').length > 0 && (
                          <optgroup label="?뮫 ?꾧툑">
                            {payOptions.filter(o => o.group === '?꾧툑').map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </optgroup>
                        )}
                        {payOptions.filter(o => o.group === '?댁쓬').length > 0 && (
                          <optgroup label="?뱞 ?댁쓬">
                            {payOptions.filter(o => o.group === '?댁쓬').map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </optgroup>
                        )}
                        {payOptions.filter(o => o.group === '?곹뭹沅?).length > 0 && (
                          <optgroup label="?렅截??곹뭹沅?>
                            {payOptions.filter(o => o.group === '?곹뭹沅?).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </optgroup>
                        )}
                      </select>
                    )
                  })()}
                </div>
                {/* ?ㅼ젣嫄곕옒?쇱옄 */}
                <div>
                  <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">?ㅼ젣嫄곕옒?쇱옄</label>
                  <DatePicker value={form.tradeDate} onChange={v => setForm(f => ({ ...f, tradeDate: v }))} />
                </div>
                {/* ?꾪몴?좎쭨 */}
                <div>
                  <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">?꾪몴?좎쭨</label>
                  <DatePicker value={form.inputDate} onChange={v => setForm(f => ({ ...f, inputDate: v }))} />
                </div>
              </div>
              {/* 鍮꾧퀬 */}
              <div>
                <label className="text-[10.5px] font-bold text-[var(--text-muted)] mb-1 block">鍮꾧퀬</label>
                <textarea
                  value={(form as any).memo || ''}
                  onChange={e => setForm(f => ({ ...f, memo: e.target.value } as any))}
                  placeholder="李멸퀬 ?ы빆???낅젰?섏꽭??
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none resize-none h-[56px]"
                />
              </div>
              {/* 踰꾪듉 */}
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => {
                  setShowExpenseModal(false)
                  setIsFromApproval(false)
                  setSelectedApprovalId(null)
                  setForm(f => ({ ...f, desc: '', subItem: '', amount: '', counter: '', manager: '', memo: '' } as any))
                }} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[var(--text-secondary)] text-sm font-bold cursor-pointer border border-[var(--border-default)] hover:bg-[var(--bg-muted)] transition-colors">
                  痍⑥냼
                </button>
                <button onClick={() => { saveEntry(); setShowExpenseModal(false) }} className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white text-sm font-bold cursor-pointer shadow-md bg-gradient-to-r ${typeGrads[type]}`}>
                  <Save size={14} /> 吏異??깅줉
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

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
   ?꾪몴?λ? (Payment Ledger) ??CRUD
   ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??*/
function AcctPaymentLedger({ year, catId }: { year: number; catId?: string | null }) {
  const [refresh, setRefresh] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | number | null>(null)
  const [vmDate, setVmDate] = useState(getLocalDate())
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

  // ?ㅻ뜑 ?덉궛 蹂寃????숆린??
  useEffect(() => {
    setVoucherBudgetFilter(catId && catId !== 'all' ? catId : '')
  }, [catId])

  // 湲곗〈 ?꾪몴??budgetCatId 留덉씠洹몃젅?댁뀡
  useEffect(() => {
    const all = getItem<any[]>('acct_vouchers', [])
    const cfs = getItem<any[]>('acct_cashflows', [])
    let changed = false
    all.forEach((v: any) => {
      if (!v.budgetCatId && v.date && v.entries) {
        const totalAmt = Number((v.entries || []).reduce((s: number, e: any) => e.side === 'debit' ? s + Number(e.amount || 0) : s, 0))
        // ?좎쭨+湲덉븸+???留ㅼ묶
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
      // 吏곸젒 budgetCatId媛 ?덉쑝硫??ъ슜, ?놁쑝硫?cashflow?먯꽌 留ㅼ묶
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
        // ?대갚: cashflow 留ㅼ묶
        const totalAmt = (v.entries || []).reduce((s, e) => e.side === 'debit' ? s + Number(e.amount || 0) : s, 0)
        const key = `${(v.date || '').slice(0,10)}_${totalAmt}`
        return cfMap.get(key) === voucherBudgetFilter
      })
    }
    return list
  }, [vouchers, voucherTypeFilter, voucherBudgetFilter, cashflows])

  // ?덉궛 ?꾪꽣留??곸슜 (?좏삎 ?꾪꽣 ?쒖쇅) - 移대뱶 移댁슫?몄슜
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
        setVmDate(v.date || getLocalDate())
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
      setVmDate(getLocalDate())
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
        createdAt: getLocalISOString(),
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
            { label: '珥??꾪몴', value: budgetBaseVouchers.length, bg: 'rgba(255,255,255,.18)', filter: '' },
            { label: '?낃툑', value: budgetBaseVouchers.filter(v => v.type === 'income').length, bg: 'rgba(34,197,94,.2)', filter: 'income' },
            { label: '異쒓툑', value: budgetBaseVouchers.filter(v => v.type === 'expense').length, bg: 'rgba(239,68,68,.2)', filter: 'expense' },
            { label: '?泥?, value: budgetBaseVouchers.filter(v => v.type !== 'income' && v.type !== 'expense').length, bg: 'rgba(245,158,11,.2)', filter: 'transfer' },
          ].map(s => (
            <div key={s.label} onClick={() => setVoucherTypeFilter(voucherTypeFilter === s.filter ? '' : s.filter)} className={`rounded-xl p-2 text-center cursor-pointer transition-all ${voucherTypeFilter === s.filter ? 'ring-2 ring-white shadow-lg scale-[1.02]' : 'hover:bg-white/10'}`} style={{ background: s.bg }}>
              <div className="text-[9px] opacity-80">{s.label}</div>
              <div className="text-[16px] font-extrabold">{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ?덉궛 ?꾪꽣 */}
      <div className="flex items-center gap-2">
        <select value={voucherBudgetFilter} onChange={e => setVoucherBudgetFilter(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)]">
          <option value="">?꾩껜 ?덉궛</option>
          {budgetCats.filter((c: any) => { const pf = c.periodFrom || ''; const pt = c.periodTo || ''; if (pf && pt) return pf <= `${year}-12-31` && pt >= `${year}-01-01`; return true }).map((c: any) => (
            <option key={c.id} value={String(c.id)}>{c.name}</option>
          ))}
        </select>
        {(voucherTypeFilter || voucherBudgetFilter) && (
          <button onClick={() => { setVoucherTypeFilter(''); setVoucherBudgetFilter('') }} className="px-2.5 py-2 rounded-lg bg-[var(--bg-muted)] text-[11px] font-bold text-[var(--text-muted)] hover:bg-primary-100 hover:text-primary-600 cursor-pointer transition-all whitespace-nowrap">??珥덇린??/button>
        )}
      </div>

      {/* ?꾪몴 紐⑸줉 */}
      {filteredVouchers.length === 0 ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-8">
          <EmptyState emoji="?뱬" title={voucherTypeFilter || voucherBudgetFilter ? '?대떦 議곌굔???꾪몴媛 ?놁뒿?덈떎' : '?깅줉???꾪몴媛 ?놁뒿?덈떎'} />
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredVouchers.map(v => {
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
  address1?: string
  address2?: string
  phone?: string
  /* ?곕씫泥섏젙蹂?*/
  ceoName?: string
  ceoPhone?: string
  managerName?: string
  managerRole?: string
  managerPhone?: string
  managerEmail?: string
  managerId?: string
  managerPw?: string
  /* ?ъ뾽?먯젙蹂?*/
  bizNo?: string
  bizType?: string
  bizCategory?: string
  invoiceEmail?: string
  bizRegImage?: string
  /* 鍮꾧퀬 */
  memo?: string
  /* ?덉궛援щ텇 ?곌껐 */
  budgetCatId?: string
  /* ?섏쐞 ?명솚 */
  address?: string
}

const EMPTY_VENDOR: Omit<Vendor, 'id'> = {
  name: '', zipCode: '', address1: '', address2: '', phone: '',
  ceoName: '', ceoPhone: '', managerName: '', managerRole: '', managerPhone: '', managerEmail: '', managerId: '', managerPw: '',
  bizNo: '', bizType: '', bizCategory: '', invoiceEmail: '', bizRegImage: '',
  memo: '', budgetCatId: '',
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
        {v.managerName && <div className="text-[11px] text-[var(--text-muted)] mt-0.5">?대떦: {v.managerName}</div>}
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
                  <Edit3 size={12} /> ?섏젙
                </button>
                <button onClick={() => { setMenuOpen(false); onDelete(v.id) }} className="flex items-center gap-2 w-full px-3 py-2 text-[12px] text-danger hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer">
                  <Trash2 size={12} /> ??젣
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
  }

  /* ?? 怨듯넻 ?ㅽ????? */
  const sectionCard = "bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl overflow-hidden"
  const sectionTitle = "flex items-center gap-2 px-5 py-3 border-b border-[var(--border-default)] bg-[var(--bg-muted)]"
  const inpCls2 = "w-full px-3 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)] text-[13px] text-[var(--text-primary)] focus:border-primary-400 outline-none transition-colors"
  const lbl = "block text-[10px] font-bold text-[var(--text-muted)] mb-1"

  /* ?? ?깅줉/?섏젙 ???? */
  const renderForm = () => (
    <div className="flex gap-4 h-full">
      {/* 醫? 硫붿씤 ??*/}
      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {/* 湲곕낯 ?뺣낫 */}
        <div className={sectionCard}>
          <div className={sectionTitle}>
            <span className="text-[11px]">?룫</span>
            <span className="text-[12px] font-extrabold text-[#4f6ef7]">湲곕낯 ?뺣낫</span>
          </div>
          <div className="p-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>??嫄곕옒泥섎챸 *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="(二??쒓뎅?꾩옄" className={inpCls2} />
              </div>
              <div>
                <label className={lbl}>????쒖옄</label>
                <input value={form.ceoName} onChange={e => setForm(f => ({ ...f, ceoName: e.target.value }))} placeholder="源??? className={inpCls2} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>????쒖쟾??/label>
                <input value={form.ceoPhone} onChange={e => setForm(f => ({ ...f, ceoPhone: fmtPhone(e.target.value) }))} placeholder="010-0000-0000" className={inpCls2} maxLength={13} />
              </div>
              <div>
                <label className={lbl}>???ъ뾽?먮쾲??/label>
                <input value={form.bizNo} onChange={e => setForm(f => ({ ...f, bizNo: fmtBizNo(e.target.value) }))} placeholder="000-00-00000" className={inpCls2} maxLength={12} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>?낇깭</label>
                <input value={form.bizType} onChange={e => setForm(f => ({ ...f, bizType: e.target.value }))} placeholder="?쒖“, ?쒕퉬?? className={inpCls2} />
              </div>
              <div>
                <label className={lbl}>醫낅ぉ</label>
                <input value={form.bizCategory} onChange={e => setForm(f => ({ ...f, bizCategory: e.target.value }))} placeholder="?꾩옄遺?? className={inpCls2} />
              </div>
            </div>
            <div>
              <label className={lbl}>???멸툑怨꾩궛???대찓??/label>
              <input type="email" value={form.invoiceEmail} onChange={e => setForm(f => ({ ...f, invoiceEmail: e.target.value }))} placeholder="tax@example.com" className={inpCls2} />
            </div>
            <div>
              <label className={lbl}>?꾪솕踰덊샇</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: fmtPhone(e.target.value) }))} placeholder="02-0000-0000" className={inpCls2} maxLength={13} />
            </div>
            <div>
              <label className={lbl}>?ъ뾽?μ＜??/label>
              <div className="flex gap-2 mb-2">
                <input value={form.zipCode} readOnly placeholder="?고렪踰덊샇" className={`${inpCls2} flex-1 bg-[var(--bg-muted)]`} />
                <button type="button" onClick={() => { const dp = (window as any).daum?.Postcode; if (!dp) { alert('?고렪踰덊샇 寃???쒕퉬?ㅻ? 遺덈윭?ㅻ뒗 以묒엯?덈떎...'); return } new dp({ oncomplete: (d: any) => setForm(f => ({ ...f, zipCode: d.zonecode, address1: d.roadAddress || d.jibunAddress })) }).open() }} className="px-4 py-2 rounded-xl bg-primary-500 text-white text-[12px] font-bold cursor-pointer shrink-0 hover:bg-primary-600 transition-colors">寃??/button>
              </div>
              <input value={form.address1} readOnly placeholder="二쇱냼" className={`${inpCls2} bg-[var(--bg-muted)] mb-2`} />
              <input value={form.address2} onChange={e => setForm(f => ({ ...f, address2: e.target.value }))} placeholder="?곸꽭二쇱냼瑜??낅젰?섏꽭?? className={inpCls2} />
            </div>
          </div>
        </div>

        {/* ?대떦???뺣낫 */}
        <div className={sectionCard}>
          <div className={sectionTitle}>
            <span className="text-[11px]">?뫀</span>
            <span className="text-[12px] font-extrabold text-[#22c55e]">?대떦???뺣낫</span>
          </div>
          <div className="p-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>???대떦???대쫫</label>
                <input value={form.managerName} onChange={e => setForm(f => ({ ...f, managerName: e.target.value }))} placeholder="諛뺣떞?? className={inpCls2} />
              </div>
              <div>
                <label className={lbl}>吏곹븿</label>
                <input value={form.managerRole || ''} onChange={e => setForm(f => ({ ...f, managerRole: e.target.value }))} placeholder="?? ????ъ옣" className={inpCls2} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>???대???/label>
                <input value={form.managerPhone} onChange={e => setForm(f => ({ ...f, managerPhone: fmtPhone(e.target.value) }))} placeholder="010-0000-0000" className={inpCls2} maxLength={13} />
              </div>
              <div>
                <label className={lbl}>???대찓??/label>
                <input type="email" value={form.managerEmail || ''} onChange={e => setForm(f => ({ ...f, managerEmail: e.target.value }))} placeholder="email@example.com" className={inpCls2} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>???꾩씠??ID)</label>
                <input value={form.managerId || ''} onChange={e => setForm(f => ({ ...f, managerId: e.target.value }))} placeholder="system_id" className={inpCls2} />
              </div>
              <div>
                <label className={lbl}>?뵏 鍮꾨?踰덊샇</label>
                <input type="password" value={form.managerPw || ''} onChange={e => setForm(f => ({ ...f, managerPw: e.target.value }))} placeholder="?™™? className={inpCls2} />
              </div>
            </div>
          </div>
        </div>

        {/* 鍮꾧퀬 */}
        <div className={sectionCard}>
          <div className={sectionTitle}>
            <span className="text-[11px]">?뱷</span>
            <span className="text-[12px] font-extrabold text-[#8b5cf6]">鍮꾧퀬</span>
          </div>
          <div className="p-5">
            <textarea value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))} placeholder="湲고? 李멸퀬 ?ы빆???낅젰?섏꽭?? rows={3} className={`${inpCls2} resize-none`} />
          </div>
        </div>
      </div>

      {/* ?? ?ъ뾽?먮벑濡앹쬆 */}
      <div className="w-[200px] shrink-0">
        <div className={sectionCard}>
          <div className={sectionTitle}>
            <span className="text-[11px]">?뱞</span>
            <span className="text-[12px] font-extrabold text-[var(--text-secondary)]">?ъ뾽?먮벑濡앹쬆</span>
          </div>
          <div className="p-4 space-y-3">
            <div className="min-h-[180px] rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-muted)] flex items-center justify-center overflow-hidden">
              {form.bizRegImage ? (
                form.bizRegImage.startsWith('data:image') ? (
                  <div className="relative group w-full h-full">
                    <img src={form.bizRegImage} alt="?ъ뾽?먮벑濡앹쬆" className="w-full h-full object-contain" />
                    <button type="button" onClick={() => setForm(f => ({ ...f, bizRegImage: '' }))} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[9px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">??/button>
                  </div>
                ) : (
                  <a href={form.bizRegImage} target="_blank" rel="noopener" className="text-[11px] text-primary-500 font-semibold">?뱞 PDF 蹂닿린</a>
                )
              ) : (
                <div className="text-center text-[var(--text-muted)]">
                  <div className="text-2xl mb-1">?뱞</div>
                  <div className="text-[10px]">?깅줉???ъ뾽?먮벑濡앹쬆???놁뒿?덈떎</div>
                </div>
              )}
            </div>
            <label className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-muted)] cursor-pointer hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
              <span className="text-[11px] text-[var(--text-muted)] font-bold">燧??낅줈??/span>
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 5*1024*1024) { alert('5MB ?댄븯'); return } const r = new FileReader(); r.onload = () => setForm(f => ({ ...f, bizRegImage: r.result as string })); r.readAsDataURL(file) }} />
            </label>
          </div>
        </div>
      </div>
    </div>
  )

  /* ?? 議고쉶 ?뚮뜑 ?? */
  const renderView = (v: Vendor) => {
    const Row = ({ label, value }: { label: string; value?: string }) => (
      <div className="flex py-2 border-b border-[var(--border-default)] last:border-0">
        <span className="text-[11px] font-bold text-[var(--text-muted)] w-24 shrink-0 self-center">{label}</span>
        <span className="text-[13px] text-[var(--text-primary)] flex-1">{value || '-'}</span>
      </div>
    )
    return (
      <div className="flex gap-4">
        {/* 醫? ?뺣낫 */}
        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {/* 湲곕낯 ?뺣낫 */}
          <div className={sectionCard}>
            <div className={sectionTitle}>
              <span className="text-[11px]">?룫</span>
              <span className="text-[12px] font-extrabold text-[#4f6ef7]">湲곕낯 ?뺣낫</span>
            </div>
            <div className="px-5 py-1">
              <Row label="嫄곕옒泥섎챸" value={v.name} />
              <Row label="?ъ뾽?먮쾲?? value={v.bizNo} />
              <Row label="??쒖옄" value={v.ceoName} />
              <Row label="??쒖쟾?? value={v.ceoPhone} />
              <Row label="?꾪솕踰덊샇" value={v.phone} />
              <Row label="?낇깭" value={v.bizType} />
              <Row label="醫낅ぉ" value={v.bizCategory} />
              <Row label="?대찓?? value={v.invoiceEmail} />
              <Row label="?고렪踰덊샇" value={v.zipCode} />
              <Row label="二쇱냼" value={[v.address1 || v.address, v.address2].filter(Boolean).join(' ') || undefined} />
            </div>
          </div>

          {/* ?대떦???뺣낫 */}
          <div className={sectionCard}>
            <div className={sectionTitle}>
              <span className="text-[11px]">?뫀</span>
              <span className="text-[12px] font-extrabold text-[#22c55e]">?대떦???뺣낫</span>
            </div>
            <div className="px-5 py-1">
              <Row label="?대떦?먮챸" value={v.managerName} />
              <Row label="吏곹븿" value={v.managerRole} />
              <Row label="?대??? value={v.managerPhone} />
              <Row label="?대찓?? value={v.managerEmail} />
              <Row label="?꾩씠?? value={v.managerId} />
            </div>
          </div>

          {/* 鍮꾧퀬 */}
          <div className={sectionCard}>
            <div className={sectionTitle}>
              <span className="text-[11px]">?뱷</span>
              <span className="text-[12px] font-extrabold text-[#8b5cf6]">鍮꾧퀬</span>
            </div>
            <div className="px-5 py-3">
              <p className="text-[13px] text-[var(--text-primary)] whitespace-pre-wrap">{v.memo || '-'}</p>
            </div>
          </div>
        </div>

        {/* ?? ?ъ뾽?먮벑濡앹쬆 */}
        <div className="w-[200px] shrink-0">
          <div className={sectionCard}>
            <div className={sectionTitle}>
              <span className="text-[11px]">?뱞</span>
              <span className="text-[12px] font-extrabold text-[var(--text-secondary)]">?ъ뾽?먮벑濡앹쬆</span>
            </div>
            <div className="p-4">
              <div className="min-h-[220px] rounded-xl border border-[var(--border-default)] bg-[var(--bg-muted)] flex items-center justify-center overflow-hidden">
                {v.bizRegImage ? (
                  v.bizRegImage.startsWith('data:image') ? (
                    <img src={v.bizRegImage} alt="?ъ뾽?먮벑濡앹쬆" className="w-full object-contain cursor-pointer" onClick={() => window.open(v.bizRegImage, '_blank')} />
                  ) : (
                    <a href={v.bizRegImage} target="_blank" rel="noopener" className="text-[11px] text-primary-500 font-semibold">?뱞 PDF 蹂닿린</a>
                  )
                ) : (
                  <div className="text-center text-[var(--text-muted)]">
                    <div className="text-2xl mb-1">?뱞</div>
                    <div className="text-[10px]">?깅줉???ъ뾽?먮벑濡앹쬆???놁뒿?덈떎</div>
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
      {/* ?ㅻ뜑 */}
      <div className="bg-gradient-to-r from-[#6366f1] to-[#4f6ef7] rounded-2xl p-4 text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-xl">?룫</div>
          <div>
            <div className="text-[17px] font-extrabold">嫄곕옒泥섍?由?/div>
            <div className="text-[11.5px] opacity-85">嫄곕옒泥??뺣낫瑜??깅줉?섍퀬 愿由ы빀?덈떎</div>
          </div>
        </div>
      </div>

      {/* 寃??+ ?깅줉 踰꾪듉 */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="嫄곕옒泥섎챸, ?ъ뾽?먮쾲?? ??쒖옄, ?대떦??寃??.."
            className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none pl-9"
          />
          <ContactRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f6ef7] text-white text-sm font-bold cursor-pointer shadow-md shrink-0">
          <Plus size={14} /> 嫄곕옒泥??깅줉
        </button>
      </div>

      {/* 嫄곕옒泥?紐⑸줉 - ?뚯씠釉??뺥깭 */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
          <span className="text-sm font-extrabold text-[var(--text-primary)]">嫄곕옒泥?紐⑸줉</span>
          <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-muted)] px-2 py-0.5 rounded-full">{vendors.length}嫄?/span>
        </div>
        {vendors.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-3xl mb-2">?룫</p>
            <p className="text-sm text-[var(--text-muted)]">?깅줉??嫄곕옒泥섍? ?놁뒿?덈떎</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-[var(--bg-muted)] border-b border-[var(--border-default)]">
                  <th className="px-4 py-3 text-[11px] font-bold text-[var(--text-muted)] text-center w-12">No</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-[var(--text-muted)] text-left">嫄곕옒泥섎챸</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-[var(--text-muted)] text-left w-28">??쒖옄</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-[var(--text-muted)] text-left w-44">?곕씫泥?/th>
                  <th className="px-4 py-3 text-[11px] font-bold text-[var(--text-muted)] text-center w-16">愿由?/th>
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

      {/* ?? ?깅줉/?섏젙 紐⑤떖 (?볦? 以묒븰) ?? */}
      {modalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4" onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="bg-[var(--bg-base)] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col animate-scaleIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)] bg-[var(--bg-surface)] rounded-t-2xl shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                  <ContactRound size={16} className="text-primary-500" />
                </div>
                <span className="text-sm font-extrabold text-[var(--text-primary)]">{editId ? '嫄곕옒泥??섏젙' : '嫄곕옒泥??깅줉'}</span>
              </div>
              <button onClick={() => setModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer transition-colors"><X size={18} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {renderForm()}
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-[var(--border-default)] bg-[var(--bg-surface)] rounded-b-2xl shrink-0">
              <button onClick={() => setModalOpen(false)} className="px-6 py-2.5 rounded-xl border border-[var(--border-default)] text-sm font-semibold text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--bg-muted)] transition-colors">痍⑥냼</button>
              <button onClick={saveVendor} className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f6ef7] text-white text-sm font-bold cursor-pointer shadow-md hover:shadow-lg transition-shadow flex items-center gap-1.5">
                <Save size={14} /> {editId ? '?섏젙' : '?깅줉'}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* ?? 議고쉶 紐⑤떖 (?볦? 以묒븰) ?? */}
      {viewOpen && viewVendor && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4" onClick={e => { if (e.target === e.currentTarget) setViewOpen(false) }}>
          <div className="bg-[var(--bg-base)] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col animate-scaleIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)] bg-[var(--bg-surface)] rounded-t-2xl shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                  <ContactRound size={16} className="text-primary-500" />
                </div>
                <span className="text-sm font-extrabold text-[var(--text-primary)]">嫄곕옒泥??곸꽭</span>
              </div>
              <button onClick={() => setViewOpen(false)} className="w-8 h-8 rounded-lg hover:bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer transition-colors"><X size={18} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {renderView(viewVendor)}
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-[var(--border-default)] bg-[var(--bg-surface)] rounded-b-2xl shrink-0">
              <button onClick={() => setViewOpen(false)} className="px-6 py-2.5 rounded-xl border border-[var(--border-default)] text-sm font-semibold text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--bg-muted)] transition-colors">?リ린</button>
              <button onClick={() => { setViewOpen(false); openEdit(viewVendor) }} className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f6ef7] text-white text-sm font-bold cursor-pointer shadow-md hover:shadow-lg transition-shadow flex items-center gap-1.5">
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

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
   怨꾩젙愿由?(AcctAccountsMgmt)
   ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??*/
type AcctAccount = { code: string; name: string; type: string; group?: string; source?: 'system' | 'user'; side?: 'debit' | 'credit'; description?: string; active?: boolean; incomeEnabled?: boolean }
const ACCT_TYPES = [
  { value: 'asset', label: '?먯궛', color: '#4f6ef7' },
  { value: 'liability', label: '遺梨?, color: '#ef4444' },
  { value: 'equity', label: '?먮낯', color: '#8b5cf6' },
  { value: 'revenue', label: '?섏씡', color: '#22c55e' },
  { value: 'expense', label: '鍮꾩슜', color: '#f59e0b' },
]
const DEBIT_TYPES = ['asset', 'expense']
/* 李④컧怨꾩젙(contra accounts): ?먯궛?댁?留??蹂 / ?섏씡?댁?留?李⑤? */
const CONTRA_CREDIT_CODES = new Set([
  '1-01-08',  // ??먯땐?밴툑
  '1-02-03',  // 嫄대Ъ媛먭??곴컖?꾧퀎??
  '1-02-05',  // 援ъ텞臾쇨컧媛?곴컖?꾧퀎??
  '1-02-07',  // 湲곌퀎?μ튂媛먭??곴컖?꾧퀎??
  '1-02-09',  // 李⑤웾?대컲援ш컧媛?곴컖?꾧퀎??
  '1-02-11',  // 鍮꾪뭹媛먭??곴컖?꾧퀎??
  '1-02-13',  // ?뚰봽?몄썾?댁긽媛곷늻怨꾩븸
])
const CONTRA_DEBIT_CODES = new Set([
  '4-01-04',  // 留ㅼ텧?먮늻由щ컦?섏엯
])
const getDebitCredit = (type: string, code?: string, sideOverride?: string) => {
  /* ?ъ슜?먭? 吏곸젒 吏?뺥븳 side媛 ?덉쑝硫?理쒖슦??*/
  if (sideOverride === 'debit') return { label: '李⑤?', color: '#4f6ef7' }
  if (sideOverride === 'credit') return { label: '?蹂', color: '#ef4444' }
  /* 李④컧怨꾩젙 ?덉쇅 */
  if (code && CONTRA_CREDIT_CODES.has(code)) return { label: '?蹂', color: '#ef4444' }
  if (code && CONTRA_DEBIT_CODES.has(code)) return { label: '李⑤?', color: '#4f6ef7' }
  return DEBIT_TYPES.includes(type) ? { label: '李⑤?', color: '#4f6ef7' } : { label: '?蹂', color: '#ef4444' }
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
    // 鍮?怨꾩젙???섎굹 異붽??섏뿬 洹몃９???섑??섎룄濡???(洹몃９? 怨꾩젙??group ?꾨뱶濡?議댁옱)
    const all = getItem<AcctAccount[]>('acct_accounts', [])
    const typePrefixMap: Record<string, string> = { asset: '1', liability: '2', equity: '3', revenue: '4', expense: '5' }
    const prefix = typePrefixMap[groupForm.type] || '9'
    // ?대떦 ??낆뿉???ъ슜 媛?ν븳 以묐텇瑜?踰덊샇 李얘린
    const usedMids = all.filter(a => a.type === groupForm.type).map(a => { const p = a.code.split('-'); return parseInt(p[1], 10) || 0 })
    const maxMid = usedMids.length > 0 ? Math.max(...usedMids) : 0
    const newMid = String(maxMid + 1).padStart(2, '0')
    const newCode = `${prefix}-${newMid}-01`
    all.push({ code: newCode, name: `${groupForm.name.trim()} (湲곕낯)`, type: groupForm.type, group: groupForm.name.trim(), source: 'user' })
    setItem('acct_accounts', all)
    setGroupModal(false)
    setRefresh(r => r + 1)
  }

  /* ?먮룞 肄붾뱶 ?앹꽦: ?대떦 洹몃９??留덉?留?肄붾뱶 + 1 */
  const generateNextCode = (type: string, group: string) => {
    const all = getItem<AcctAccount[]>('acct_accounts', [])
    const sameGroup = all.filter(a => a.type === type && a.group === group).sort((a, b) => a.code.localeCompare(b.code))
    if (sameGroup.length === 0) {
      // 洹몃９??以묐텇瑜?肄붾뱶 異붿텧 ?쒕룄
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
      const g = a.group || '湲고?'
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
    const currentSide = dc.label === '李⑤?' ? 'debit' : 'credit'
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
      {/* ?? ???? */}
      <div className="flex items-center gap-1 bg-[var(--bg-muted)] rounded-xl p-1 border border-[var(--border-default)] w-fit">
        <button onClick={() => setAcctTab('all')}
          className={cn('flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-bold transition-all cursor-pointer',
            acctTab === 'all' ? 'bg-primary-500 text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]')}>
          <Settings2 size={13} /> ?꾩껜怨꾩젙
        </button>
        <button onClick={() => setAcctTab('income')}
          className={cn('flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-bold transition-all cursor-pointer',
            acctTab === 'income' ? 'bg-emerald-500 text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]')}>
          <TrendingUp size={13} /> ?낃툑怨꾩젙
        </button>
      </div>

      {acctTab === 'all' ? (
      <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 size={18} className="text-primary-500" />
          <span className="text-base font-extrabold text-[var(--text-primary)]">怨꾩젙怨쇰ぉ 愿由?/span>
          <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-muted)] px-2 py-0.5 rounded-full">{filtered.length}媛?/span>
          <span className="mx-1 text-[var(--border-default)]">|</span>
          <span className="flex items-center gap-1 text-[10px] font-bold text-[#4f6ef7]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4f6ef7]" />李⑤?
            <span className="text-[9px] font-normal text-[var(--text-muted)] ml-0.5">= ?먯궛쨌鍮꾩슜 利앷?</span>
          </span>
          <span className="flex items-center gap-1 text-[10px] font-bold text-[#ef4444]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />?蹂
            <span className="text-[9px] font-normal text-[var(--text-muted)] ml-0.5">= 遺梨꽷룹옄蹂맞룹닔??利앷?</span>
          </span>
        </div>
        <button onClick={() => openAdd()} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary-500 text-white text-[12px] font-bold cursor-pointer hover:bg-primary-600 transition-colors shadow-sm">
          <Plus size={14} /> 怨꾩젙 異붽?
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="肄붾뱶, 怨쇰ぉ紐? 洹몃９ 寃??.."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] outline-none focus:border-primary-400" />
        </div>
        <div className="flex items-center gap-1 bg-[var(--bg-muted)] rounded-lg p-0.5 border border-[var(--border-default)]">
          <button onClick={() => setFilterType('all')} className={cn('px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer', filterType === 'all' ? 'bg-primary-500 text-white shadow-sm' : 'text-[var(--text-muted)]')}>?꾩껜</button>
          {ACCT_TYPES.map(t => (
            <button key={t.value} onClick={() => setFilterType(t.value)} className={cn('px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer', filterType === t.value ? 'text-white shadow-sm' : 'text-[var(--text-muted)]')} style={filterType === t.value ? { background: t.color } : {}}>{t.label}</button>
          ))}
        </div>
      </div>

      {typeGrouped.length === 0 ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-8">
          <EmptyState emoji="?뱥" title="?깅줉??怨꾩젙怨쇰ぉ???놁뒿?덈떎" />
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
                    <Plus size={11} /> 洹몃９ 異붽?
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
                      <span className="text-[9px] text-[var(--text-muted)]">{grp.items.length}嫄?/span>
                      <div className="flex-1" />
                      <button onClick={e => { e.stopPropagation(); openAdd(ts.type, grp.groupName) }}
                        className="text-[10px] font-bold text-primary-500 hover:text-primary-600 flex items-center gap-0.5 cursor-pointer w-[80px] justify-end shrink-0">+ ?뚭낵紐?異붽?</button>
                    </div>
                    {!grpCollapsed && grp.items.map(a => {
                      const isSys = a.source === 'system' || SYSTEM_CODES.has(a.code)
                      const dc2 = getDebitCredit(a.type, a.code, a.side)
                      const isDebitSide = dc2.label === '李⑤?'

                      // ?먯＜ ?ъ슜?섎뒗 ?곷?怨꾩젙 ?곗꽑?쒖쐞 留ㅽ븨
                      const frequentContraMap: Record<string, string[]> = {
                        // ?먯궛 怨꾩젙??鍮덈쾲???곷?怨꾩젙
                        'asset': ['4-01-01', '4-01-02', '4-01-03', '2-01-01', '2-01-04', '2-01-06', '2-01-08', '2-01-09', '3-03-03',
                                  '5-02-01', '5-02-04', '5-02-05', '5-02-06', '5-02-07', '5-02-08', '5-02-09', '5-02-10',
                                  '5-02-12', '5-02-14', '5-02-15', '5-02-21', '5-02-22', '5-02-24', '5-02-25',
                                  '1-01-01', '1-01-03'],
                        // 遺梨?怨꾩젙??鍮덈쾲???곷?怨꾩젙
                        'liability': ['1-01-01', '1-01-03', '1-01-06', '1-01-07', '1-01-10', '5-02-01', '5-02-03'],
                        // ?먮낯 怨꾩젙??鍮덈쾲???곷?怨꾩젙
                        'equity': ['1-01-01', '1-01-03', '1-01-04'],
                        // ?섏씡 怨꾩젙??鍮덈쾲???곷?怨꾩젙
                        'revenue': ['1-01-01', '1-01-03', '1-01-06', '1-01-07', '1-01-10'],
                        // 鍮꾩슜 怨꾩젙??鍮덈쾲???곷?怨꾩젙
                        'expense': ['1-01-01', '1-01-03', '2-01-04', '2-01-08', '1-01-12'],
                      }
                      const priorityCodes = new Set(frequentContraMap[a.type] || [])

                      // ?곷?怨꾩젙 ?꾨낫 + ?곗꽑?쒖쐞 ?뺣젹 (鍮꾪솢??怨꾩젙 ?쒖쇅)
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
                            title={a.active === false ? '鍮꾪솢?????대┃?섏뿬 ?쒖꽦?? : '?쒖꽦 ???대┃?섏뿬 鍮꾪솢?깊솕'}
                          >
                            <span className={cn('absolute top-[2px] w-[12px] h-[12px] rounded-full bg-white shadow-sm transition-all', a.active === false ? 'left-[2px]' : 'left-[18px]')} />
                          </button>
                          <span className={cn("text-[12px] font-mono font-bold w-[80px] shrink-0", a.active === false ? 'text-[var(--text-muted)]' : 'text-primary-500')}>{a.code}</span>
                          <span
                            className="text-[12px] font-bold text-[var(--text-primary)] w-[140px] shrink-0 truncate cursor-pointer hover:text-primary-500 hover:underline transition-colors"
                            onClick={() => setContraPopupCode(showContraPopup ? null : a.code)}
                            title="?대┃?섏뿬 ?곷?怨꾩젙 紐⑸줉 蹂닿린"
                          >{a.name}</span>
                          <input
                            defaultValue={a.description || ''}
                            placeholder="?ㅻ챸 ?낅젰..."
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
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--bg-muted)] text-[var(--text-muted)]">???쒖뒪??/span>
                            ) : (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded text-green-600 dark:text-green-400" style={{ background: 'rgba(34,197,94,.12)' }}>???ъ슜??/span>
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
                          {/* ?곷?怨꾩젙 ?앹뾽 ???곹솴蹂?遺꾧컻 */}
                          {showContraPopup && (() => {
                            // ?곹솴 ?ㅻ챸 ?앹꽦 ?⑥닔
                            const getSituation = (main: typeof a, contra: typeof a) => {
                              const mt = main.type; const ct = contra.type
                              if (mt === 'asset' && ct === 'revenue') return `${contra.name} 諛쒖깮 ??${main.name} ?낃툑`
                              if (mt === 'asset' && ct === 'liability') return `${contra.name} 諛쒖깮/利앷?`
                              if (mt === 'asset' && ct === 'equity') return `${contra.name} 異쒖옄/利앹옄`
                              if (mt === 'asset' && ct === 'asset') return `${contra.name}?먯꽌 ${main.name}?쇰줈 ?대룞`
                              if (mt === 'asset' && ct === 'expense') return `${contra.name} 吏湲???
                              if (mt === 'expense' && ct === 'asset') return `${contra.name}?먯꽌 異쒓툑`
                              if (mt === 'expense' && ct === 'liability') return `${contra.name}?쇰줈 誘몄?湲?泥섎━`
                              if (mt === 'liability' && ct === 'asset') return `${contra.name}?쇰줈 ?곹솚`
                              if (mt === 'liability' && ct === 'expense') return `${contra.name} 鍮꾩슜 ?뺤궛`
                              if (mt === 'revenue' && ct === 'asset') return `${contra.name}?쇰줈 ?섎졊`
                              if (mt === 'equity' && ct === 'asset') return `${contra.name}?쇰줈 諛곕떦/媛먯옄`
                              return `${contra.name} 嫄곕옒`
                            }
                            // ?ㅻ뜑 ?곹솴 ?띿뒪??
                            const headerText = (() => {
                              switch (a.type) {
                                case 'asset': return `?뮥 ${a.name}(??媛) ?ㅼ뼱????쨌 ?섍컝 ??
                                case 'expense': return `?뱾 ${a.name}(??瑜? 吏異쒗븷 ??
                                case 'liability': return `?뱿 ${a.name}(??媛) 諛쒖깮 쨌 ?곹솚????
                                case 'revenue': return `?뮫 ${a.name}(??媛) 諛쒖깮????
                                case 'equity': return `?룱 ${a.name}(??媛) 蹂?숉븷 ??
                                default: return `${a.name} 嫄곕옒 ??
                              }
                            })()
                            return (
                            <div className="absolute left-[86px] top-full mt-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-2xl z-50 w-[460px] overflow-hidden"
                              style={{ maxHeight: '420px' }}>
                              {/* ?ㅻ뜑 */}
                              <div className="px-3 py-2.5 border-b border-[var(--border-default)] bg-[var(--bg-muted)]/50 flex items-center justify-between">
                                <div>
                                  <div className="text-[12px] font-bold text-[var(--text-primary)]">{headerText}</div>
                                  <div className="text-[9px] text-[var(--text-muted)] mt-0.5 font-mono">{a.code} 쨌 {a.group}</div>
                                </div>
                                <button onClick={() => setContraPopupCode(null)} className="p-1 rounded hover:bg-[var(--bg-muted)] text-[var(--text-muted)] cursor-pointer">
                                  <X size={14} />
                                </button>
                              </div>
                              {/* ?뚯씠釉??ㅻ뜑 */}
                              <div className="flex border-b border-[var(--border-default)]">
                                <div className="w-[120px] shrink-0 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/10">
                                  <span className="text-[10px] font-bold text-[#4f6ef7]">李⑤? (Debit)</span>
                                </div>
                                <div className="w-[120px] shrink-0 px-3 py-1.5 bg-red-50 dark:bg-red-900/10 border-l border-[var(--border-default)]">
                                  <span className="text-[10px] font-bold text-[#ef4444]">?蹂 (Credit)</span>
                                </div>
                                <div className="flex-1 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/10 border-l border-[var(--border-default)]">
                                  <span className="text-[10px] font-bold text-amber-600">?곹솴 ?ㅻ챸</span>
                                </div>
                              </div>
                              {/* ?숆린 ?ㅽ겕濡?蹂몃Ц */}
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
              <span className="text-[14px] font-extrabold text-[var(--text-primary)]">{editTarget ? '怨꾩젙怨쇰ぉ ?섏젙' : '怨꾩젙怨쇰ぉ 異붽?'}</span>
              <button onClick={() => setEditModal(false)} className="p-1 rounded-lg hover:bg-[var(--bg-muted)] cursor-pointer transition-colors"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">怨꾩젙肄붾뱶 *</label>
                  <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="?? 5-02-26"
                    className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none font-mono" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">怨쇰ぉ紐?*</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="?? ?뚯쓽鍮?
                    className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">援щ텇</label>
                  <div className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-sm text-[var(--text-secondary)] font-bold">
                    {ACCT_TYPES.find(t => t.value === form.type)?.label || form.type}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">洹몃９</label>
                  <div className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-sm text-[var(--text-secondary)] font-bold truncate">
                    {form.group || '-'}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">李⑤?蹂 遺꾨쪟</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setForm(f => ({ ...f, side: 'debit' }))}
                    className={cn('flex-1 px-3 py-2.5 rounded-lg border text-sm font-bold transition-all cursor-pointer',
                      form.side === 'debit' ? 'border-[#4f6ef7] bg-[#4f6ef7]/10 text-[#4f6ef7]' : 'border-[var(--border-default)] text-[var(--text-muted)] hover:bg-[var(--bg-muted)]')}>
                    李⑤? (Debit)
                  </button>
                  <button type="button" onClick={() => setForm(f => ({ ...f, side: 'credit' }))}
                    className={cn('flex-1 px-3 py-2.5 rounded-lg border text-sm font-bold transition-all cursor-pointer',
                      form.side === 'credit' ? 'border-[#ef4444] bg-[#ef4444]/10 text-[#ef4444]' : 'border-[var(--border-default)] text-[var(--text-muted)] hover:bg-[var(--bg-muted)]')}>
                    ?蹂 (Credit)
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-muted)]">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded text-green-600 dark:text-green-400" style={{ background: 'rgba(34,197,94,.12)' }}>???ъ슜??/span>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-[var(--border-default)]">
              <button onClick={() => setEditModal(false)} className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer">痍⑥냼</button>
              <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-bold hover:bg-primary-600 transition-colors cursor-pointer">???/button>
            </div>
          </div>
        </div>
      , document.body)}

      {groupModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setGroupModal(false)}>
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-2xl w-[360px] max-w-[90vw]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-default)]">
              <span className="text-[14px] font-extrabold text-[var(--text-primary)]">洹몃９ 異붽?</span>
              <button onClick={() => setGroupModal(false)} className="p-1 rounded-lg hover:bg-[var(--bg-muted)] cursor-pointer transition-colors"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">援щ텇</label>
                <div className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-sm text-[var(--text-secondary)] font-bold">
                  {ACCT_TYPES.find(t => t.value === groupForm.type)?.label || groupForm.type}
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1 block">洹몃９紐?*</label>
                <input value={groupForm.name} onChange={e => setGroupForm(f => ({ ...f, name: e.target.value }))} placeholder="?? 湲고??먯궛, ?곸뾽鍮꾩슜..."
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleGroupSave()}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none" />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-[var(--border-default)]">
              <button onClick={() => setGroupModal(false)} className="px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer">痍⑥냼</button>
              <button onClick={handleGroupSave} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-bold hover:bg-primary-600 transition-colors cursor-pointer">異붽?</button>
            </div>
          </div>
        </div>
      , document.body)}
      </>
      ) : (
      /* ?? ?낃툑怨꾩젙 ???? */
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-emerald-500" />
          <span className="text-base font-extrabold text-[var(--text-primary)]">?낃툑怨꾩젙 愿由?/span>
          <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-muted)] px-2 py-0.5 rounded-full">
            {accounts.filter(a => a.incomeEnabled).length} / {accounts.length}媛??쒖꽦
          </span>
        </div>
        <div className="text-[11px] text-[var(--text-muted)] bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2">
          ?뮕 ?ㅼ쐞移섎? 耳쒕㈃ ?대떦 怨꾩젙??<span className="font-bold text-emerald-600">?낃툑?꾪몴</span>???낃툑?댁슜 ?좏깮 ???섑??⑸땲??
        </div>
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="怨꾩젙 寃??.."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] outline-none focus:border-emerald-400" />
        </div>
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
          {/* ?ㅻ뜑 */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--border-default)] bg-[var(--bg-muted)]">
            <span className="w-[40px] text-[10px] font-bold text-[var(--text-muted)] text-center">?ъ슜</span>
            <span className="w-[80px] text-[10px] font-bold text-[var(--text-muted)]">肄붾뱶</span>
            <span className="flex-1 text-[10px] font-bold text-[var(--text-muted)]">怨꾩젙怨쇰ぉ紐?/span>
            <span className="w-[80px] text-[10px] font-bold text-[var(--text-muted)]">援щ텇</span>
            <span className="w-[100px] text-[10px] font-bold text-[var(--text-muted)]">洹몃９</span>
          </div>
          {/* 紐⑸줉 */}
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
                // incomeEnabled ?곗꽑, 洹몃떎??肄붾뱶??
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
                      title={isEnabled ? '?낃툑?꾪몴???쒖떆?????대┃?섏뿬 ?댁젣' : '鍮꾪솢?????대┃?섏뿬 ?낃툑?꾪몴???쒖떆'}
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

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
   蹂몄궗嫄곕옒泥?(AcctHQVendor) - 由ъ뒪??+ 紐⑤떖
   ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??*/
interface HQV { id: number; company: string; ceo: string; ceoPhone: string; bizPhone: string; bizNo: string; bizType: string; bizItem: string; taxEmail: string; zip: string; addr1: string; addr2: string; mgrName: string; mgrTitle: string; mgrMobile: string; mgrEmail: string; mgrId: string; mgrPw: string; bizDocImg: string; solutions: { key: string; label: string; enabled: boolean; qty?: number }[]; billings: { period: string; total: string; status: string }[]; totalBill: number; unpaid: number; memo: string }

const HQ_BILLINGS_1 = [{period:'2026.05.01~',mgmt:'150,000',db:'250,000',data:'523,221',fee:'595,000',total:'1,518,221',status:'怨쇨툑以?},{period:'2026.03.01-2026.03.31',mgmt:'200,000',db:'250,000',data:'49,800',fee:'480,000',total:'979,800',status:'泥?뎄'},{period:'2026.02.01-2026.02.28',mgmt:'200,000',db:'280,000',data:'52,100',fee:'520,000',total:'1,052,100',status:'?⑸?'},{period:'2026.01.01-2026.01.31',mgmt:'200,000',db:'250,000',data:'48,200',fee:'500,000',total:'998,200',status:'?⑸?'}]
const HQ_BILLINGS_2 = [{period:'2026.05.01~',mgmt:'150,000',db:'250,000',data:'523,221',fee:'595,000',total:'1,518,221',status:'怨쇨툑以?},{period:'2026.03.01-2026.03.31',mgmt:'200,000',db:'250,000',data:'49,800',fee:'480,000',total:'979,800',status:'泥?뎄'},{period:'2026.02.01-2026.02.28',mgmt:'200,000',db:'280,000',data:'52,100',fee:'520,000',total:'1,052,100',status:'?⑸?'},{period:'2026.01.01-2026.01.31',mgmt:'200,000',db:'250,000',data:'48,200',fee:'500,000',total:'998,200',status:'?⑸?'}]
const HQ_BILLINGS_3 = [{period:'2026.05.01~',mgmt:'200,000',db:'300,000',data:'623,221',fee:'700,000',total:'1,823,221',status:'怨쇨툑以?},{period:'2026.03.01-2026.03.31',mgmt:'200,000',db:'250,000',data:'49,800',fee:'480,000',total:'979,800',status:'泥?뎄'},{period:'2026.02.01-2026.02.28',mgmt:'200,000',db:'280,000',data:'52,100',fee:'520,000',total:'1,052,100',status:'?⑸?'},{period:'2026.01.01-2026.01.31',mgmt:'200,000',db:'250,000',data:'48,200',fee:'500,000',total:'998,200',status:'?⑸?'}]

const HQ_SEED: HQV[] = [
  { id:1, company:'(二??쒓뎅?붾（??, ceo:'源???, ceoPhone:'010-1234-5678', bizPhone:'02-1234-5678', bizNo:'123-45-67890', bizType:'?쒕퉬??, bizItem:'?뚰봽?몄썾??, taxEmail:'tax@ksol.co.kr', zip:'06134', addr1:'?쒖슱?밸퀎??媛뺣궓援??뚰뿤?濡?152', addr2:'媛뺣궓?뚯씠?몄뒪?쇳꽣 3痢?, mgrName:'?댁???, mgrTitle:'???, mgrMobile:'010-1111-2222', mgrEmail:'lee@ksol.co.kr', mgrId:'system_id', mgrPw:'***', bizDocImg:'', solutions:[{key:'workm',label:'?뚰겕留?,enabled:true},{key:'homepage',label:'?덊럹?댁?',enabled:true,qty:1},{key:'fabric',label:'?먮떒怨듦툒??,enabled:true},{key:'mfg',label:'?쒖“怨듦툒??,enabled:false},{key:'dist',label:'?좏넻?먮ℓ??,enabled:false},{key:'franchise',label:'媛留밸?由ъ젏',enabled:false},{key:'food',label:'?앹옱?由ъ젏',enabled:false}], billings:HQ_BILLINGS_1, totalBill:1590721, unpaid:979800, memo:'' },
  { id:2, company:'?紐낇뀒??二?', ceo:'諛뺤궗??, ceoPhone:'010-3333-4444', bizPhone:'02-9878-5432', bizNo:'234-55-78901', bizType:'?쒖“', bizItem:'?꾩옄遺??, taxEmail:'bill@dmtech.kr', zip:'08500', addr1:'?쒖슱?밸퀎??湲덉쿇援?媛?곕뵒吏?몃줈 123', addr2:'?紐낅퉴??5痢?, mgrName:'理쒖닔誘?, mgrTitle:'怨쇱옣', mgrMobile:'010-5555-6666', mgrEmail:'choi@dmtech.kr', mgrId:'dm_admin', mgrPw:'***', bizDocImg:'', solutions:[{key:'workm',label:'?뚰겕留?,enabled:true},{key:'homepage',label:'?덊럹?댁?',enabled:false},{key:'fabric',label:'?먮떒怨듦툒??,enabled:false},{key:'mfg',label:'?쒖“怨듦툒??,enabled:false},{key:'dist',label:'?좏넻?먮ℓ??,enabled:false},{key:'franchise',label:'媛留밸?由ъ젏',enabled:false},{key:'food',label:'?앹옱?由ъ젏',enabled:false}], billings:HQ_BILLINGS_2, totalBill:1518221, unpaid:979800, memo:'' },
  { id:3, company:'?쒖슱?좏넻(二?', ceo:'?뺥쉶??, ceoPhone:'010-7777-8888', bizPhone:'02-5555-6666', bizNo:'345-67-89012', bizType:'?꾨ℓ', bizItem:'?앺솢?⑺뭹', taxEmail:'tax@seouldt.com', zip:'04100', addr1:'?쒖슱?밸퀎??以묎뎄 ?몄쥌?濡?110', addr2:'2痢?203??, mgrName:'媛뺣???, mgrTitle:'?由?, mgrMobile:'010-9999-0000', mgrEmail:'kang@seouldt.com', mgrId:'seoul_mgr', mgrPw:'***', bizDocImg:'', solutions:[{key:'workm',label:'?뚰겕留?,enabled:true},{key:'homepage',label:'?덊럹?댁?',enabled:false},{key:'fabric',label:'?먮떒怨듦툒??,enabled:false},{key:'mfg',label:'?쒖“怨듦툒??,enabled:false},{key:'dist',label:'?좏넻?먮ℓ??,enabled:true},{key:'franchise',label:'媛留밸?由ъ젏',enabled:true},{key:'food',label:'?앹옱?由ъ젏',enabled:false}], billings:HQ_BILLINGS_3, totalBill:1823221, unpaid:979800, memo:'' },
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
    setEditVendor({ id: Date.now(), company:'', ceo:'', ceoPhone:'', bizPhone:'', bizNo:'', bizType:'', bizItem:'', taxEmail:'', zip:'', addr1:'', addr2:'', mgrName:'', mgrTitle:'', mgrMobile:'', mgrEmail:'', mgrId:'', mgrPw:'', bizDocImg:'', solutions:[{key:'workm',label:'?뚰겕留?,enabled:false},{key:'homepage',label:'?덊럹?댁?',enabled:false},{key:'fabric',label:'?먮떒怨듦툒??,enabled:false},{key:'mfg',label:'?쒖“怨듦툒??,enabled:false},{key:'dist',label:'?좏넻?먮ℓ??,enabled:false},{key:'franchise',label:'媛留밸?由ъ젏',enabled:false},{key:'food',label:'?앹옱?由ъ젏',enabled:false}], billings:[], totalBill:0, unpaid:0, memo:'' })
    setModalOpen(true)
  }
  const openEdit = (v: HQV) => { setEditVendor({ ...v }); setModalOpen(true) }
  const saveVendor = () => {
    if (!editVendor?.company) { alert('嫄곕옒泥섎챸???낅젰?섏꽭??); return }
    const exists = vendors.find(v => v.id === editVendor.id)
    const next = exists ? vendors.map(v => v.id === editVendor.id ? editVendor : v) : [...vendors, editVendor]
    setVendors(next); setItem('acct_hq_vendors_v2', next); setModalOpen(false)
  }
  const deleteVendor = (id: number) => {
    if (!confirm('??젣?섏떆寃좎뒿?덇퉴?')) return
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
      {/* 寃??+ 異붽? */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="嫄곕옒泥섎챸, ??쒖옄, ?ъ뾽?먮쾲?? ?대떦??寃??.." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:border-primary-500 outline-none" />
        </div>
        <button onClick={openAdd} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f6ef7] text-white text-sm font-bold cursor-pointer shadow-md hover:shadow-lg transition-shadow flex items-center gap-1.5 shrink-0">
          <Plus size={14} /> 嫄곕옒泥?異붽?
        </button>
      </div>

      {/* ?뚯씠釉?*/}
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-[var(--bg-muted)] border-b border-[var(--border-default)]">
              {['No','嫄곕옒泥섎챸','??쒖옄','?곕씫泥?,'?ъ슜?붾（??,'?ъ슜猷?泥?뎄??,'誘몄닔湲?,'愿由?].map(h => (
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
                  <div className="text-[10px] text-[var(--text-muted)]">?대떦: {v.mgrName}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {v.solutions.filter(s => s.enabled).map(s => (
                      <span key={s.key} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-100 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400">{s.label}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 font-extrabold text-[var(--text-primary)] whitespace-nowrap">{(v.totalBill || 0).toLocaleString()}??/td>
                <td className="px-4 py-3 font-bold text-orange-500 whitespace-nowrap">{(v.unpaid || 0).toLocaleString()}??/td>
                <td className="px-4 py-3 relative" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setMenuId(menuId === v.id ? null : v.id)} className="w-7 h-7 rounded-lg hover:bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-muted)] cursor-pointer"><MoreHorizontal size={14} /></button>
                  {menuId === v.id && (
                    <div className="absolute right-4 top-10 z-50 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-lg py-1 min-w-[100px] animate-scaleIn">
                      <button onClick={() => { setMenuId(null); openEdit(v) }} className="w-full px-4 py-2 text-left text-[12px] text-[var(--text-primary)] hover:bg-[var(--bg-muted)] cursor-pointer flex items-center gap-2"><Edit3 size={12} /> ?섏젙</button>
                      <button onClick={() => { setMenuId(null); deleteVendor(v.id) }} className="w-full px-4 py-2 text-left text-[12px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer flex items-center gap-2"><Trash2 size={12} /> ??젣</button>
                    </div>
                  )}
                </td>
              </tr>
              {/* 泥?뎄 由ъ뒪???꾩퐫?붿뼵 */}
              {expandedId === v.id && v.billings.length > 0 && (
                <tr><td colSpan={8} className="p-0">
                  <div className="px-8 py-4 bg-blue-50/50 dark:bg-blue-900/5 border-b border-[var(--border-default)]">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[13px] font-bold text-[var(--text-primary)]">?뱥 泥?뎄 由ъ뒪??/span>
                    </div>
                    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden">
                      <table className="w-full text-[11px]">
                        <thead><tr className="bg-[var(--bg-muted)] border-b border-[var(--border-default)]">
                          {['怨쇨툑湲곌컙','?붽?由щ퉬','DB?ъ슜猷?,'Data?ъ슜嫄댁닔','?섏닔猷?,'珥앷툑??,'?곹깭'].map(h => <th key={h} className="px-3 py-2 text-left font-bold text-[var(--text-muted)] whitespace-nowrap">{h}</th>)}
                        </tr></thead>
                        <tbody>{(v.billings as any[]).map((b: any, bi: number) => (
                          <tr key={bi} className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-muted)]/50">
                            <td className="px-3 py-2 font-semibold text-[var(--text-primary)] whitespace-nowrap">{b.period}</td>
                            <td className="px-3 py-2 text-[var(--text-secondary)]">{b.mgmt || '-'}??/td>
                            <td className="px-3 py-2 text-[var(--text-secondary)]">{b.db || '-'}??/td>
                            <td className="px-3 py-2 text-[var(--text-secondary)]">{b.data || '-'}??/td>
                            <td className="px-3 py-2 text-[var(--text-secondary)]">{b.fee || '-'}??/td>
                            <td className="px-3 py-2 font-extrabold text-[var(--text-primary)]">{b.total}??/td>
                            <td className="px-3 py-2"><span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold', b.status==='怨쇨툑以??'bg-red-100 text-red-500 dark:bg-red-900/20':b.status==='泥?뎄'?'bg-blue-100 text-blue-500 dark:bg-blue-900/20':'bg-green-100 text-green-600 dark:bg-green-900/20')}>{b.status}</span></td>
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
        {/* ?명꽣 */}
        <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-muted)] border-t border-[var(--border-default)]">
          <span className="text-[12px] text-[var(--text-muted)]">珥?<b className="text-[var(--text-primary)]">{filtered.length}嫄?/b></span>
          <span className="text-[12px] text-[var(--text-muted)]">?뮥 泥?뎄?? <b className="text-primary-500">{totalBill.toLocaleString()}??/b></span>
        </div>
      </div>

      {/* 異붽?/?섏젙 紐⑤떖 */}
      {modalOpen && editVendor && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4" onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="bg-[var(--bg-base)] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col animate-scaleIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)] bg-[var(--bg-surface)] rounded-t-2xl shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center"><Building2 size={16} className="text-primary-500" /></div>
                <span className="text-sm font-extrabold text-[var(--text-primary)]">{vendors.find(v=>v.id===editVendor.id) ? editVendor.company || '嫄곕옒泥??섏젙' : '嫄곕옒泥?異붽?'}</span>
              </div>
              <button onClick={() => setModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-muted)] cursor-pointer"><X size={18} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* 湲곕낯 ?뺣낫 + ?ъ뾽?먮벑濡앹쬆 */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-5">
                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 space-y-3">
                  <SectionHeader icon="?룫" title="湲곕낯 ?뺣낫" color="#4f6ef7" />
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="嫄곕옒泥섎챸" required><input value={editVendor.company} onChange={e=>upd('company',e.target.value)} placeholder="(二??쒓뎅?붾（?? className={ic} /></FormField>
                    <FormField label="??쒖옄"><input value={editVendor.ceo} onChange={e=>upd('ceo',e.target.value)} placeholder="源??? className={ic} /></FormField>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="??쒖쟾??><input value={editVendor.ceoPhone} onChange={e=>upd('ceoPhone',fmtPhone(e.target.value))} placeholder="010-0000-0000" className={ic} maxLength={13} /></FormField>
                    <FormField label="?ъ뾽?먮쾲??><input value={editVendor.bizNo} onChange={e=>upd('bizNo',fmtBizNo(e.target.value))} placeholder="000-00-00000" className={ic} maxLength={12} /></FormField>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="?낇깭"><input value={editVendor.bizType} onChange={e=>upd('bizType',e.target.value)} placeholder="?쒕퉬?? className={ic} /></FormField>
                    <FormField label="?낆쥌"><input value={editVendor.bizItem} onChange={e=>upd('bizItem',e.target.value)} placeholder="?뚰봽?몄썾?? className={ic} /></FormField>
                  </div>
                  <FormField label="?멸툑怨꾩궛???대찓??><input type="email" value={editVendor.taxEmail} onChange={e=>upd('taxEmail',e.target.value)} placeholder="tax@company.com" className={ic} /></FormField>
                  <FormField label="?꾪솕踰덊샇"><input value={editVendor.bizPhone} onChange={e=>upd('bizPhone',fmtPhone(e.target.value))} placeholder="02-0000-0000" className={ic} maxLength={13} /></FormField>
                  <FormField label="?ъ뾽?μ＜??>
                    <div className="flex gap-2 mb-2">
                      <input value={editVendor.zip} readOnly placeholder="?고렪踰덊샇" className={`${ic} flex-1 bg-[var(--bg-muted)] cursor-default`} />
                      <button type="button" onClick={() => { const dp=(window as any).daum?.Postcode; if(!dp){alert('濡쒕뵫以?..');return} new dp({oncomplete:(d:any)=>{upd('zip',d.zonecode);upd('addr1',d.roadAddress||d.jibunAddress)}}).open() }} className="px-3 py-2.5 rounded-lg bg-primary-500 text-white text-[11px] font-bold cursor-pointer shrink-0">+ 寃??/button>
                    </div>
                    <input value={editVendor.addr1} readOnly placeholder="二쇱냼" className={`${ic} bg-[var(--bg-muted)] cursor-default mb-2`} />
                    <input value={editVendor.addr2} onChange={e=>upd('addr2',e.target.value)} placeholder="?곸꽭二쇱냼" className={ic} />
                  </FormField>
                </div>
                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 flex flex-col">
                  <SectionHeader icon="?뱥" title="?ъ뾽?먮벑濡앹쬆" color="#f59e0b" />
                  <div className="flex-1 flex flex-col items-center justify-center min-h-[150px]">
                    {editVendor.bizDocImg ? (
                      <div className="relative group w-full"><img src={editVendor.bizDocImg} alt="" className="w-full max-h-[150px] object-contain rounded-lg border border-[var(--border-default)] bg-white" /><button type="button" onClick={()=>upd('bizDocImg','')} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 cursor-pointer">??/button></div>
                    ) : (<div className="flex flex-col items-center gap-2 py-4 text-[var(--text-muted)]"><span className="text-3xl">?뱞</span><span className="text-[11px]">?깅줉???ъ뾽?먮벑濡앹쬆???놁뒿?덈떎</span></div>)}
                  </div>
                  <label className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-[var(--border-default)] bg-[var(--bg-muted)] cursor-pointer hover:border-primary-400 transition-colors mt-2">
                    <span className="text-[12px] text-[var(--text-muted)]">?뱨 ?뚯씪濡쒕뱶</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>upd('bizDocImg',r.result as string);r.readAsDataURL(f)}} />
                  </label>
                </div>
              </div>
              {/* ?대떦???뺣낫 */}
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 space-y-3">
                <SectionHeader icon="?뫀" title="?대떦???뺣낫" color="#22c55e" />
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="?대떦???대쫫"><input value={editVendor.mgrName} onChange={e=>upd('mgrName',e.target.value)} placeholder="?대떦?먮챸" className={ic} /></FormField>
                  <FormField label="吏곹븿"><input value={editVendor.mgrTitle} onChange={e=>upd('mgrTitle',e.target.value)} placeholder="?? ??? className={ic} /></FormField>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="?대???><input value={editVendor.mgrMobile} onChange={e=>upd('mgrMobile',fmtPhone(e.target.value))} placeholder="010-0000-0000" className={ic} maxLength={13} /></FormField>
                  <FormField label="?대찓??><input type="email" value={editVendor.mgrEmail} onChange={e=>upd('mgrEmail',e.target.value)} placeholder="email@example.com" className={ic} /></FormField>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="?꾩씠??怨꾩젙)"><input value={editVendor.mgrId} onChange={e=>upd('mgrId',e.target.value)} placeholder="system_id" className={ic} /></FormField>
                  <FormField label="鍮꾨?踰덊샇"><input type="password" value={editVendor.mgrPw} onChange={e=>upd('mgrPw',e.target.value)} placeholder="?™™™? className={ic} /></FormField>
                </div>
              </div>
              {/* ?ъ슜 ?붾（??*/}
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-default)]">
                  <div className="flex items-center gap-2"><span className="text-sm">?숋툘</span><span className="text-[12px] font-extrabold text-[var(--text-primary)]">?ъ슜 ?붾（??/span></div>
                  <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-muted)] px-2 py-0.5 rounded-full">{editVendor.solutions.filter(s=>s.enabled).length}媛??ъ슜以?/span>
                </div>
                <div className="p-4 flex flex-wrap gap-3">
                  {editVendor.solutions.map(sol => (
                    <div key={sol.key} className={cn('flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 transition-all min-w-[140px] cursor-pointer', sol.enabled ? 'border-primary-300 bg-primary-50 dark:bg-primary-900/10' : 'border-[var(--border-default)] bg-[var(--bg-muted)] opacity-60')} onClick={()=>toggleSol(sol.key)}>
                      <span className="text-[13px] font-bold text-[var(--text-primary)] flex-1">{sol.label}</span>
                      <div className={cn('relative w-11 h-6 rounded-full transition-colors', sol.enabled ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600')}>
                        <span className={cn('absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow transition-transform', sol.enabled ? 'left-[22px]' : 'left-0.5')} />
                      </div>
                      {sol.key==='homepage'&&sol.enabled&&<div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]"><span>?섎웾:</span><span className="w-10 px-1.5 py-0.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] text-center text-[12px] font-bold text-[var(--text-primary)]">{sol.qty||1}</span></div>}
                    </div>
                  ))}
                </div>
              </div>
              {/* 寃곗젣 ?뺣낫 */}
              {editVendor.billings.length > 0 && (() => {
                const enabledSols = editVendor.solutions.filter(s => s.enabled).map(s => s.label).join(', ')
                const curBill = (editVendor.billings as any[])[0] || {} as any
                return (
                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden">
                  <div className="flex items-center justify-between flex-wrap gap-2 px-5 py-3 border-b border-[var(--border-default)]">
                    <div className="flex items-center gap-2"><span className="text-sm">?뮩</span><span className="text-[12px] font-extrabold text-[var(--text-primary)]">寃곗젣 ?뺣낫</span></div>
                    <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
                      <span>?ъ슜?붾（?? <b className="text-primary-500">{enabledSols || '-'}</b></span>
                      <span>??怨쇨툑?쇱옄: <b>{curBill.period || '-'}</b></span>
                      <span>?뮥 珥앷툑?? <b className="text-primary-500">{curBill.total || '0'}??/b></span>
                      {editVendor.totalBill > 0 && <span>?뱤 ?④??섏젙</span>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4">
                    {[
                      { icon: '?뮲', label: '?붽?由щ퉬(?쒕쾭)', value: curBill.mgmt || '0', sub: '湲곕낯湲덉븸' },
                      { icon: '?뾼截?, label: 'DB?ъ슜猷??④?:100M??1,000??', value: curBill.db || '0', sub: '25,000MB' },
                      { icon: '#', label: '?먮즺?④?(10嫄대떦 1??', value: curBill.data || '0', sub: (curBill.data || '0') + '嫄? },
                      { icon: '%', label: '?섏닔猷?7%)', value: curBill.fee || '0', sub: '湲곌컙留ㅼ텧:500,000??, hl: true },
                    ].map((c, ci) => (
                      <div key={ci} className={cn('rounded-xl p-3 border', c.hl ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800' : 'bg-[var(--bg-muted)] border-[var(--border-default)]')}>
                        <div className="text-[10px] font-semibold text-[var(--text-muted)] mb-1 flex items-center gap-1 truncate"><span>{c.icon}</span> {c.label}</div>
                        <div className={cn('text-lg font-extrabold', c.hl ? 'text-orange-500' : 'text-[var(--text-primary)]')}>{c.value}<span className="text-[13px] font-semibold text-[var(--text-secondary)]">??/span></div>
                        <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{c.sub}</div>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] font-bold text-[var(--text-primary)] flex items-center gap-1.5">?뱥 泥?뎄 由ъ뒪??/span>
                      <span className="text-[11px] text-[var(--text-muted)]">{editVendor.billings.length}嫄?/span>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-[var(--border-default)]">
                      <table className="w-full text-[11px]">
                        <thead><tr className="bg-[var(--bg-muted)] border-b border-[var(--border-default)]">
                          {['怨쇨툑湲곌컙','?붽?由щ퉬','DB?ъ슜猷?,'Data?ъ슜嫄댁닔','?섏닔猷?,'珥앷툑??,'?곹깭'].map(h => <th key={h} className="px-3 py-2 text-left font-bold text-[var(--text-muted)] whitespace-nowrap">{h}</th>)}
                        </tr></thead>
                        <tbody>{(editVendor.billings as any[]).map((b: any, bi: number) => (
                          <tr key={bi} className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-muted)]/50">
                            <td className="px-3 py-2 font-semibold text-[var(--text-primary)] whitespace-nowrap">{b.period}</td>
                            <td className="px-3 py-2 text-[var(--text-secondary)]">{b.mgmt || '-'}??/td>
                            <td className="px-3 py-2 text-[var(--text-secondary)]">{b.db || '-'}??/td>
                            <td className="px-3 py-2 text-[var(--text-secondary)]">{b.data || '-'}??/td>
                            <td className="px-3 py-2 text-[var(--text-secondary)]">{b.fee || '-'}??/td>
                            <td className="px-3 py-2 font-extrabold text-[var(--text-primary)]">{b.total}??/td>
                            <td className="px-3 py-2"><span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold', b.status==='怨쇨툑以??'bg-red-100 text-red-500 dark:bg-red-900/20':b.status==='泥?뎄'?'bg-blue-100 text-blue-500 dark:bg-blue-900/20':'bg-green-100 text-green-600 dark:bg-green-900/20')}>{b.status}</span></td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  </div>
                </div>)
              })()}
              {/* 鍮꾧퀬 */}
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 space-y-3">
                <SectionHeader icon="?뱷" title="鍮꾧퀬" color="#8b5cf6" />
                <textarea value={editVendor.memo} onChange={e=>upd('memo',e.target.value)} placeholder="湲고? 李멸퀬 ?ы빆" rows={3} className={`${ic} resize-none`} />
              </div>

            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-[var(--border-default)] bg-[var(--bg-surface)] rounded-b-2xl shrink-0">
              <button onClick={()=>setModalOpen(false)} className="px-6 py-2.5 rounded-xl border border-[var(--border-default)] text-sm font-semibold text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--bg-muted)] transition-colors">痍⑥냼</button>
              <button onClick={saveVendor} className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f6ef7] text-white text-sm font-bold cursor-pointer shadow-md hover:shadow-lg transition-shadow flex items-center gap-1.5"><Save size={14} /> ???/button>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  )
}

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
   吏異쒖닔??愿由?(移댄뀒怨좊━蹂?
   ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??*/
interface PayMethodCard {
  id: number
  cardName: string
  cardCompany: string
  cardNumber: string
  cardType: '泥댄겕移대뱶' | '?좎슜移대뱶'
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
  status: '誘멸껐?? | '異붿떖以? | '寃곗젣?꾨즺' | '遺??
  memo?: string
}

interface PayMethodItem {
  id: number
  name: string
  category: '怨꾩쥖' | '?꾧툑' | '?댁쓬' | '?곹뭹沅?
  budgetCatId?: string | number  // ?덉궛援щ텇 ?곌껐
  // 怨꾩쥖 ?곸꽭
  bankName?: string
  accountNumber?: string
  accountHolder?: string
  manager?: string
  purpose?: string
  memo?: string
  cards?: PayMethodCard[]
  // ?꾧툑 ?곸꽭
  storageLocation?: string
  custodian?: string
  cashLimit?: number
  // ?댁쓬 ?곸꽭
  noteType?: '?섏떊' | '諛쒗뻾'
  noteBank?: string
  noteManager?: string
  defaultMaturity?: string
  noteLimit?: number
  notes?: PayMethodNote[]
  // ?곹뭹沅??곸꽭
  voucherAmount?: number
  voucherQty?: number
  voucherStorage?: string
  voucherManager?: string
}

const PAY_CATEGORIES = [
  { key: '怨꾩쥖' as const, label: '怨꾩쥖', icon: '?룱', color: '#3b82f6', bg: 'bg-blue-50 dark:bg-blue-900/10', border: 'border-blue-200 dark:border-blue-800', desc: '怨꾩쥖?댁껜, ?먮룞?댁껜 ?? },
  { key: '?꾧툑' as const, label: '?꾧툑', icon: '?뮫', color: '#22c55e', bg: 'bg-emerald-50 dark:bg-emerald-900/10', border: 'border-emerald-200 dark:border-emerald-800', desc: '?꾧툑, ?뚯븸?꾧툑 ?? },
  { key: '?댁쓬' as const, label: '?댁쓬', icon: '?뱞', color: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/10', border: 'border-amber-200 dark:border-amber-800', desc: '?섏떊?댁쓬, 諛쒗뻾?댁쓬, ?섑몴' },
  { key: '?곹뭹沅? as const, label: '?곹뭹沅?, icon: '?렅截?, color: '#8b5cf6', bg: 'bg-violet-50 dark:bg-violet-900/10', border: 'border-violet-200 dark:border-violet-800', desc: '臾명솕?곹뭹沅? 諛깊솕?먯긽?덇텒 ?? },
]

const DEFAULT_PAY_ITEMS: PayMethodItem[] = [
  { id: 1, name: '怨꾩쥖?댁껜', category: '怨꾩쥖' },
  { id: 2, name: '?먮룞?댁껜', category: '怨꾩쥖' },
  { id: 3, name: '?⑤씪?몃콉??, category: '怨꾩쥖' },
  { id: 4, name: '?꾧툑', category: '?꾧툑' },
  { id: 5, name: '?뚯븸?꾧툑', category: '?꾧툑' },
  { id: 6, name: '?섏떊?댁쓬', category: '?댁쓬', noteType: '?섏떊' },
  { id: 7, name: '諛쒗뻾?댁쓬', category: '?댁쓬', noteType: '諛쒗뻾' },
  { id: 11, name: '?섑몴', category: '?댁쓬' },
  { id: 8, name: '臾명솕?곹뭹沅?, category: '?곹뭹沅? },
  { id: 9, name: '諛깊솕?먯긽?덇텒', category: '?곹뭹沅? },
  { id: 10, name: '?⑤늻由ъ긽?덇텒', category: '?곹뭹沅? },
]

const DETAIL_FIELD_LABEL = 'text-[11px] font-bold text-[var(--text-muted)] mb-1 block'
const DETAIL_INPUT = 'w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-white dark:bg-gray-900 text-[12px] text-[var(--text-primary)] outline-none focus:border-primary-400 transition-colors placeholder:text-[var(--text-muted)]'

function AcctPayMethods({ catId }: { catId?: string | null }) {
  const [refresh, setRefresh] = useState(0)
  const [newName, setNewName] = useState('')
  const [activeCategory, setActiveCategory] = useState<'怨꾩쥖' | '?꾧툑' | '?댁쓬' | '?곹뭹沅?>('怨꾩쥖')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const addToast = useToastStore(s => s.add)

  // 吏곸썝 紐⑸줉
  const staffList = useMemo(() => getItem<any[]>('ws_users', []), [])

  // ?꾩옱 ?ㅼ젙 ?뚭퀎?꾨룄
  const currentYear = new Date().getFullYear()
  const activeYear = parseInt(new URLSearchParams(window.location.hash.split('?')[1] || '').get('year') || '') || parseInt(localStorage.getItem('acct_active_year') || '') || currentYear

  // ?덉궛援щ텇 紐⑸줉 (?ㅼ젙 ?꾨룄 湲곗?)
  const budgetCats = useMemo(() => {
    const all = getItem<BudgetCat[]>('acct_budget_cats', [])
    return all.filter(c => {
      const cy = c.year || (c.periodFrom ? parseInt(c.periodFrom.substring(0, 4)) : currentYear)
      return cy === activeYear
    })
  }, [refresh, activeYear])

  // ?곷떒 諛붿뿉???좏깮???덉궛援щ텇 ID ?ъ슜
  const selectedPayCatId = catId || (budgetCats.length > 0 ? String(budgetCats[0].id) : '')
  const selectedCatName = budgetCats.find(c => String(c.id) === selectedPayCatId)?.name || ''

  // 珥덇린??
  useEffect(() => {
    const raw = localStorage.getItem('acct_pay_methods_v2')
    if (!raw) {
      const oldMethods: string[] = getItem('acct_payment_methods', [])
      if (oldMethods.length > 0) {
        const migrated: PayMethodItem[] = oldMethods.map((name, i) => {
          let cat: PayMethodItem['category'] = '?곹뭹沅?
          if (['怨꾩쥖?댁껜', '?먮룞?댁껜', '?⑤씪?몃콉??].includes(name)) cat = '怨꾩쥖'
          else if (['?꾧툑', '?뚯븸?꾧툑'].includes(name)) cat = '?꾧툑'
          else if (['?쎌냽?댁쓬', '?섏뼱??, '?섑몴', '?댁쓬'].includes(name)) cat = '?댁쓬'
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
  // ?좏깮???덉궛援щ텇????ぉ留??쒖떆
  const filteredItems = selectedPayCatId
    ? allItems.filter(i => String(i.budgetCatId) === selectedPayCatId)
    : allItems
  const catItems = filteredItems.filter(i => i.category === activeCategory)
  const activeCatInfo = PAY_CATEGORIES.find(c => c.key === activeCategory)!

  // ?좏깮???덉궛援щ텇??吏異쒕떞?뱀옄 (湲곕낯媛믪쑝濡??ъ슜)
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
    // 媛숈? ?덉궛援щ텇 + 媛숈? 移댄뀒怨좊━ ?댁뿉?쒕쭔 以묐났 泥댄겕
    const isDuplicate = allItems.some(i =>
      i.name === newName.trim() &&
      i.category === activeCategory &&
      String(i.budgetCatId) === selectedPayCatId
    )
    if (isDuplicate) {
      addToast('error', '???덉궛援щ텇???대? 議댁옱?섎뒗 吏異쒖닔?⑥엯?덈떎')
      return
    }
    const newItem: PayMethodItem = {
      id: Date.now(),
      name: newName.trim(),
      category: activeCategory,
      budgetCatId: selectedPayCatId || undefined,
      manager: activeCategory === '怨꾩쥖' ? defaultManager : undefined,
      custodian: activeCategory === '?꾧툑' ? defaultManager : undefined,
      noteManager: activeCategory === '?댁쓬' ? defaultManager : undefined,
      voucherManager: activeCategory === '?곹뭹沅? ? defaultManager : undefined,
    }
    saveAll([...allItems, newItem])
    addToast('success', `"${newName.trim()}" 異붽???)
    setNewName('')
    setExpandedId(newItem.id)
  }

  const handleDelete = (id: number) => {
    const item = allItems.find(i => i.id === id)
    if (!item) return
    if (!confirm(`"${item.name}"??瑜? ??젣?섏떆寃좎뒿?덇퉴?`)) return
    saveAll(allItems.filter(i => i.id !== id))
    addToast('warning', `"${item.name}" ??젣??)
    if (expandedId === id) setExpandedId(null)
  }

  const updateField = (id: number, field: keyof PayMethodItem, value: string) => {
    saveAll(allItems.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  // ?? 移대뱶 CRUD ??
  const addCard = (itemId: number) => {
    const newCard: PayMethodCard = {
      id: Date.now(),
      cardName: '',
      cardCompany: '',
      cardNumber: '',
      cardType: '泥댄겕移대뱶',
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

  // ?? ?댁쓬???CRUD ??
  const addNote = (itemId: number) => {
    const item = allItems.find(i => i.id === itemId)
    const newNote: PayMethodNote = {
      id: Date.now(),
      noteNumber: '',
      issuer: item?.noteType === '諛쒗뻾' ? '?곕━?뚯궗' : '',
      receiver: item?.noteType === '?섏떊' ? '?곕━?뚯궗' : '',
      amount: 0,
      issueDate: getLocalDate(),
      maturityDate: '',
      endorsement: '',
      bank: '',
      status: '誘멸껐??,
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
      {/* ?ㅻ뜑 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-[var(--text-primary)] flex items-center gap-2">
            ?뮩 吏異쒖닔??愿由?
          </h2>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">?곷떒?먯꽌 ?덉궛援щ텇???좏깮?섏뿬 吏異쒖닔?⑥쓣 愿由ы빀?덈떎</p>
        </div>
        <span className="text-xs font-bold text-white bg-primary-500 px-3 py-1.5 rounded-full">
          {selectedCatName || '?꾩껜'} {filteredItems.length}嫄?
        </span>
      </div>

      {/* 移댄뀒怨좊━ ??*/}
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
                <div className="text-[10px] font-bold text-[var(--text-muted)] mt-0.5">{count}嫄?/div>
              </div>
            </button>
          )
        })}
      </div>

      {/* ?좏깮??移댄뀒怨좊━ ?곸뿭 */}
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
            {catItems.length}嫄?
          </span>
        </div>

        {/* 異붽? ??*/}
        <div className="flex gap-2 mb-4">
          <input
            placeholder={`??${activeCatInfo.label} ?섎떒 ?낅젰...`}
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
            <Plus size={14} /> 異붽?
          </button>
        </div>

        {/* ??ぉ 由ъ뒪??*/}
        {catItems.length === 0 ? (
          <div className="py-8 text-center text-sm text-[var(--text-muted)] rounded-xl border border-dashed border-[var(--border-default)] bg-white/50 dark:bg-gray-900/50">
            ?깅줉??{activeCatInfo.label} ?섎떒???놁뒿?덈떎
          </div>
        ) : (
          <div className="space-y-1.5">
            {catItems.map((item, idx) => {
              const isOpen = expandedId === item.id
              const hasDetail = activeCategory === '怨꾩쥖' && (item.bankName || item.accountNumber || item.accountHolder || item.manager)
              return (
                <div key={item.id} className={`rounded-xl transition-all border ${isOpen ? 'border-[var(--border-default)] bg-white dark:bg-gray-900/60 shadow-sm' : 'border-transparent bg-white/70 dark:bg-gray-900/30 hover:bg-white dark:hover:bg-gray-800/50 hover:border-[var(--border-default)]'}`}>
                  {/* 硫붿씤 ??*/}
                  <div
                    className="flex items-center gap-3 px-3.5 py-2.5 cursor-pointer group"
                    onClick={() => setExpandedId(isOpen ? null : item.id)}
                  >
                    <span className="text-[10px] font-bold w-5 text-center shrink-0 rounded-full py-0.5" style={{ color: activeCatInfo.color, background: `${activeCatInfo.color}15` }}>
                      {idx + 1}
                    </span>
                    <input value={item.name} onChange={e => { e.stopPropagation(); updateField(item.id, 'name', e.target.value) }} onClick={e => e.stopPropagation()} placeholder="?대쫫 ?낅젰" className="text-sm font-semibold text-[var(--text-primary)] flex-1 bg-transparent border-none outline-none focus:bg-[var(--bg-muted)] focus:px-2 focus:rounded-md transition-all" />
                    {/* ?꾧툑 怨꾩젙怨쇰ぉ 怨좎젙 ?쒖떆 */}
                    {activeCategory === '?꾧툑' && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 whitespace-nowrap">1-01-01 ?꾧툑</span>
                    )}
                    {activeCategory === '?곹뭹沅? && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-pink-50 dark:bg-pink-900/20 text-pink-600 whitespace-nowrap">1-01-08 ?곹뭹沅?/span>
                    )}
                    {/* 怨꾩쥖 ?붿빟 ?쒖떆 */}
                    {activeCategory === '怨꾩쥖' && item.bankName && !isOpen && (
                      <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[200px]">
                        {item.bankName} {item.accountNumber ? `??${item.accountNumber}` : ''}
                      </span>
                    )}
                    {hasDetail && !isOpen && <span className="text-[8px] text-primary-500 bg-primary-100 dark:bg-primary-900/20 px-1.5 py-0.5 rounded font-bold">?곸꽭</span>}
                    <ChevronDown size={14} className={`text-[var(--text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(item.id) }}
                      className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-danger cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* ?곸꽭 ?꾨뱶 (怨꾩쥖留? */}
                  {isOpen && activeCategory === '怨꾩쥖' && (
                    <div className="px-4 pb-4 pt-1 border-t border-[var(--border-default)] mx-3">
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>??됰챸 *</label>
                          <input
                            value={item.bankName || ''}
                            onChange={e => updateField(item.id, 'bankName', e.target.value)}
                            placeholder="援?????
                            className={DETAIL_INPUT}
                          />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>怨꾩쥖踰덊샇 *</label>
                          <input
                            value={item.accountNumber || ''}
                            onChange={e => updateField(item.id, 'accountNumber', e.target.value)}
                            placeholder="110-234-567890"
                            className={DETAIL_INPUT}
                          />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>?덇툑二?*</label>
                          <input
                            value={item.accountHolder || ''}
                            onChange={e => updateField(item.id, 'accountHolder', e.target.value)}
                            placeholder="(二?臾명솕?ъ껌"
                            className={DETAIL_INPUT}
                          />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>怨꾩쥖愿由ъ옄 *</label>
                          <select
                            value={item.manager || ''}
                            onChange={e => updateField(item.id, 'manager', e.target.value)}
                            className={DETAIL_INPUT}
                          >
                            <option value="">?좏깮?섏꽭??/option>
                            {staffList.map((s: any) => (
                              <option key={s.id || s.name} value={s.name}>{s.name}{s.role ? ` (${s.role})` : ''}{s.dept ? ` - ${s.dept}` : ''}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>怨꾩쥖?⑸룄</label>
                          <input
                            value={item.purpose || ''}
                            onChange={e => updateField(item.id, 'purpose', e.target.value)}
                            placeholder="?댁쁺?먭툑, ?ъ뾽鍮???
                            className={DETAIL_INPUT}
                          />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>硫붾え</label>
                          <input
                            value={item.memo || ''}
                            onChange={e => updateField(item.id, 'memo', e.target.value)}
                            placeholder="李멸퀬?ы빆"
                            className={DETAIL_INPUT}
                          />
                        </div>
                      </div>

                      {/* ?? 移대뱶 愿由??? */}
                      <div className="mt-5 pt-4 border-t border-dashed border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-1.5">
                            <CreditCard size={14} className="text-blue-500" />
                            <span className="text-[12px] font-extrabold text-[var(--text-primary)]">?곌껐 移대뱶</span>
                            {(item.cards || []).length > 0 && (
                              <span className="text-[9px] font-bold bg-blue-100 dark:bg-blue-900/20 text-blue-600 px-1.5 py-0.5 rounded">{(item.cards || []).length}??/span>
                            )}
                          </div>
                          <button
                            onClick={() => addCard(item.id)}
                            className="text-[11px] font-bold text-blue-500 hover:text-blue-700 cursor-pointer flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          >
                            <Plus size={12} /> 移대뱶 異붽?
                          </button>
                        </div>

                        {(!item.cards || item.cards.length === 0) ? (
                          <div className="py-4 text-center text-[11px] text-[var(--text-muted)] rounded-lg border border-dashed border-[var(--border-default)] bg-white/50 dark:bg-gray-900/30">
                            ?깅줉??移대뱶媛 ?놁뒿?덈떎
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {item.cards.map((card, ci) => (
                              <div key={card.id} className="rounded-lg border border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/5 p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] font-bold text-blue-500">?뮩 移대뱶 {ci + 1}</span>
                                  <button
                                    onClick={() => deleteCard(item.id, card.id)}
                                    className="text-[10px] text-red-400 hover:text-red-600 cursor-pointer flex items-center gap-0.5"
                                  >
                                    <Trash2 size={10} /> ??젣
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className={DETAIL_FIELD_LABEL}>移대뱶紐?*</label>
                                    <input
                                      value={card.cardName}
                                      onChange={e => updateCard(item.id, card.id, 'cardName', e.target.value)}
                                      placeholder="踰뺤씤移대뱶1"
                                      className={DETAIL_INPUT}
                                    />
                                  </div>
                                  <div>
                                    <label className={DETAIL_FIELD_LABEL}>移대뱶??*</label>
                                    <input
                                      value={card.cardCompany}
                                      onChange={e => updateCard(item.id, card.id, 'cardCompany', e.target.value)}
                                      placeholder="援??移대뱶"
                                      className={DETAIL_INPUT}
                                    />
                                  </div>
                                  <div>
                                    <label className={DETAIL_FIELD_LABEL}>移대뱶踰덊샇 *</label>
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
                                    <label className={DETAIL_FIELD_LABEL}>移대뱶醫낅쪟 *</label>
                                    <select
                                      value={card.cardType}
                                      onChange={e => updateCard(item.id, card.id, 'cardType', e.target.value)}
                                      className={DETAIL_INPUT}
                                    >
                                      <option value="泥댄겕移대뱶">泥댄겕移대뱶</option>
                                      <option value="?좎슜移대뱶">?좎슜移대뱶</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className={DETAIL_FIELD_LABEL}>?ъ슜??*</label>
                                    <select
                                      value={card.cardUser}
                                      onChange={e => updateCard(item.id, card.id, 'cardUser', e.target.value)}
                                      className={DETAIL_INPUT}
                                    >
                                      <option value="">?좏깮?섏꽭??/option>
                                      {staffList.map((s: any) => (
                                        <option key={s.id || s.name} value={s.name}>{s.name}{s.role ? ` (${s.role})` : ''}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className={DETAIL_FIELD_LABEL}>?좏슚湲곌컙</label>
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
                                  {card.cardType === '?좎슜移대뱶' && (
                                    <div>
                                      <label className={DETAIL_FIELD_LABEL}>?쒕룄</label>
                                      <input
                                        value={card.cardLimit ? card.cardLimit.toLocaleString() : ''}
                                        onChange={e => updateCard(item.id, card.id, 'cardLimit', parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0)}
                                        placeholder="5,000,000"
                                        className={DETAIL_INPUT}
                                      />
                                    </div>
                                  )}
                                  <div className={card.cardType === '?좎슜移대뱶' ? '' : 'col-span-1'}>
                                    <label className={DETAIL_FIELD_LABEL}>硫붾え</label>
                                    <input
                                      value={card.memo || ''}
                                      onChange={e => updateCard(item.id, card.id, 'memo', e.target.value)}
                                      placeholder="李멸퀬?ы빆"
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

                  {/* ?곸꽭 ?꾨뱶 (?꾧툑) */}
                  {isOpen && activeCategory === '?꾧툑' && (
                    <div className="px-4 pb-4 pt-1 border-t border-[var(--border-default)] mx-3">
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>蹂닿?泥?*</label>
                          <input
                            value={item.storageLocation || ''}
                            onChange={e => updateField(item.id, 'storageLocation' as any, e.target.value)}
                            placeholder="?щТ??湲덇퀬, ?꾩옣?щТ????
                            className={DETAIL_INPUT}
                          />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>蹂닿?梨낆엫??*</label>
                          <select
                            value={item.custodian || ''}
                            onChange={e => updateField(item.id, 'custodian' as any, e.target.value)}
                            className={DETAIL_INPUT}
                          >
                            <option value="">?좏깮?섏꽭??/option>
                            {staffList.map((s: any) => (
                              <option key={s.id || s.name} value={s.name}>{s.name}{s.role ? ` (${s.role})` : ''}{s.dept ? ` - ${s.dept}` : ''}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>?쒕룄??/label>
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
                          <label className={DETAIL_FIELD_LABEL}>?⑸룄</label>
                          <input
                            value={item.purpose || ''}
                            onChange={e => updateField(item.id, 'purpose', e.target.value)}
                            placeholder="?뚯븸寃쎈퉬, ?꾩옣寃쎈퉬 ??
                            className={DETAIL_INPUT}
                          />
                        </div>
                        <div className="col-span-2">
                          <label className={DETAIL_FIELD_LABEL}>硫붾え</label>
                          <input
                            value={item.memo || ''}
                            onChange={e => updateField(item.id, 'memo', e.target.value)}
                            placeholder="李멸퀬?ы빆"
                            className={DETAIL_INPUT}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ?곸꽭 ?꾨뱶 (?댁쓬) */}
                  {isOpen && activeCategory === '?댁쓬' && (
                    <div className="px-4 pb-4 pt-1 border-t border-[var(--border-default)] mx-3">
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>援щ텇 *</label>
                          <select
                            value={item.noteType || ''}
                            onChange={e => {
                              const v = e.target.value
                              const acctCode = v === '?섏떊' ? '1-01-06' : v === '諛쒗뻾' ? '2-01-02' : ''
                              saveAll(allItems.map(i => i.id === item.id ? { ...i, noteType: v, linkedAccountCode: acctCode } : i))
                            }}
                            className={DETAIL_INPUT}
                          >
                            <option value="">?좏깮?섏꽭??/option>
                            <option value="?섏떊">?섏떊 (諛쏆쓣?댁쓬)</option>
                            <option value="諛쒗뻾">諛쒗뻾 (吏湲됱뼱??</option>
                          </select>
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>?곌껐 怨꾩젙</label>
                          <div className={`${DETAIL_INPUT} flex items-center gap-1.5 !bg-[var(--bg-muted)]`}>
                            {item.noteType === '?섏떊' ? (
                              <><span className="text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">?먯궛</span><span className="text-xs font-bold">1-01-06 諛쏆쓣?댁쓬</span></>
                            ) : item.noteType === '諛쒗뻾' ? (
                              <><span className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-1.5 py-0.5 rounded">遺梨?/span><span className="text-xs font-bold">2-01-02 吏湲됱뼱??/span></>
                            ) : (
                              <span className="text-xs text-[var(--text-muted)]">援щ텇???좏깮?섏꽭??/span>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>?대떦??*</label>
                          <select
                            value={item.noteManager || ''}
                            onChange={e => updateField(item.id, 'noteManager' as any, e.target.value)}
                            className={DETAIL_INPUT}
                          >
                            <option value="">?좏깮?섏꽭??/option>
                            {staffList.map((s: any) => (
                              <option key={s.id || s.name} value={s.name}>{s.name}{s.role ? ` (${s.role})` : ''}{s.dept ? ` - ${s.dept}` : ''}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>湲곕낯留뚭린 *</label>
                          <select
                            value={item.defaultMaturity || ''}
                            onChange={e => updateField(item.id, 'defaultMaturity' as any, e.target.value)}
                            className={DETAIL_INPUT}
                          >
                            <option value="">?좏깮?섏꽭??/option>
                            <option value="30??>30??/option>
                            <option value="60??>60??/option>
                            <option value="90??>90??/option>
                            <option value="120??>120??/option>
                          </select>
                        </div>
                        {item.noteType === '諛쒗뻾' && (
                          <div>
                            <label className={DETAIL_FIELD_LABEL}>諛쒗뻾?쒕룄</label>
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
                        <div className={item.noteType === '諛쒗뻾' ? '' : 'col-span-2'}>
                          <label className={DETAIL_FIELD_LABEL}>硫붾え</label>
                          <input
                            value={item.memo || ''}
                            onChange={e => updateField(item.id, 'memo', e.target.value)}
                            placeholder="李멸퀬?ы빆"
                            className={DETAIL_INPUT}
                          />
                        </div>
                      </div>

                      {/* ?? ?댁쓬????? */}
                      {item.noteType && (
                        <div className="mt-5 pt-4 border-t border-dashed border-amber-200 dark:border-amber-800">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-1.5">
                              <ScrollText size={14} className="text-amber-500" />
                              <span className="text-[12px] font-extrabold text-[var(--text-primary)]">?댁쓬???/span>
                              {(item.notes || []).length > 0 && (
                                <span className="text-[9px] font-bold bg-amber-100 dark:bg-amber-900/20 text-amber-600 px-1.5 py-0.5 rounded">{(item.notes || []).length}嫄?/span>
                              )}
                            </div>
                            <button
                              onClick={() => addNote(item.id)}
                              className="text-[11px] font-bold text-amber-500 hover:text-amber-700 cursor-pointer flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                            >
                              <Plus size={12} /> ?댁쓬 異붽?
                            </button>
                          </div>

                          {(!item.notes || item.notes.length === 0) ? (
                            <div className="py-4 text-center text-[11px] text-[var(--text-muted)] rounded-lg border border-dashed border-[var(--border-default)] bg-white/50 dark:bg-gray-900/30">
                              ?깅줉???댁쓬???놁뒿?덈떎
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {item.notes.map((note, ni) => {
                                const statusColors: Record<string, string> = { '誘멸껐??: '#f59e0b', '異붿떖以?: '#3b82f6', '寃곗젣?꾨즺': '#22c55e', '遺??: '#ef4444' }
                                return (
                                  <div key={note.id} className="rounded-lg border border-amber-100 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-900/5 p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-amber-500">?뱞 ?댁쓬 {ni + 1}</span>
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
                                        <Trash2 size={10} /> ??젣
                                      </button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                      <div>
                                        <label className={DETAIL_FIELD_LABEL}>?댁쓬踰덊샇 *</label>
                                        <input
                                          value={note.noteNumber}
                                          onChange={e => updateNote(item.id, note.id, 'noteNumber', e.target.value)}
                                          placeholder="A-2026-001"
                                          className={DETAIL_INPUT}
                                        />
                                      </div>
                                      <div className="relative">
                                        <label className={DETAIL_FIELD_LABEL}>{item.noteType === '?섏떊' ? '諛쒗뻾?? : '?섏랬??} *</label>
                                        <input
                                          value={item.noteType === '?섏떊' ? (note.issuer || '') : (note.receiver || '')}
                                          onChange={e => {
                                            updateNote(item.id, note.id, item.noteType === '?섏떊' ? 'issuer' : 'receiver', e.target.value)
                                          }}
                                          onFocus={() => setVendorDropKey(`${item.id}-${note.id}`)}
                                          onBlur={() => setTimeout(() => setVendorDropKey(k => k === `${item.id}-${note.id}` ? null : k), 200)}
                                          placeholder="嫄곕옒泥?寃??.."
                                          className={DETAIL_INPUT}
                                        />
                                        {vendorDropKey === `${item.id}-${note.id}` && (() => {
                                          const vendorList: any[] = getItem('acct_vendors', [])
                                          const searchVal = (item.noteType === '?섏떊' ? (note.issuer || '') : (note.receiver || '')).toLowerCase()
                                          const filtered = vendorList.filter(v => !searchVal || v.name.toLowerCase().includes(searchVal))
                                          return (
                                            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-[var(--border-default)] rounded-xl shadow-lg max-h-[150px] overflow-y-auto">
                                              {filtered.map((v: any) => (
                                                <button
                                                  key={v.id}
                                                  onMouseDown={e => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    updateNote(item.id, note.id, item.noteType === '?섏떊' ? 'issuer' : 'receiver', v.name)
                                                    setVendorDropKey(null)
                                                  }}
                                                  className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--bg-muted)] cursor-pointer flex items-center gap-2 transition-colors"
                                                >
                                                  <span className="text-[10px]">?룫</span>
                                                  <span className="font-semibold text-[var(--text-primary)]">{v.name}</span>
                                                  {v.ceoName && <span className="text-[10px] text-[var(--text-muted)]">??? {v.ceoName}</span>}
                                                </button>
                                              ))}
                                              {filtered.length === 0 && (
                                                <div className="px-3 py-2 text-[11px] text-[var(--text-muted)]">寃??寃곌낵媛 ?놁뒿?덈떎</div>
                                              )}

                                            </div>
                                          )
                                        })()}
                                      </div>
                                      <div>
                                        <label className={DETAIL_FIELD_LABEL}>湲덉븸 *</label>
                                        <input
                                          value={note.amount ? note.amount.toLocaleString() : ''}
                                          onChange={e => updateNote(item.id, note.id, 'amount', parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0)}
                                          placeholder="5,000,000"
                                          className={DETAIL_INPUT}
                                        />
                                      </div>
                                      <div>
                                        <label className={DETAIL_FIELD_LABEL}>諛쒗뻾??*</label>
                                        <DatePicker value={note.issueDate || ''} onChange={v => updateNote(item.id, note.id, 'issueDate', v)} />
                                      </div>
                                      <div>
                                        <label className={DETAIL_FIELD_LABEL}>留뚭린??*</label>
                                        <DatePicker value={note.maturityDate || ''} onChange={v => updateNote(item.id, note.id, 'maturityDate', v)} />
                                      </div>
                                      <div>
                                        <label className={DETAIL_FIELD_LABEL}>{item.noteType === '?섏떊' ? '異붿떖??? : '寃곗젣???} *</label>
                                        <input
                                          value={note.bank || ''}
                                          onChange={e => updateNote(item.id, note.id, 'bank', e.target.value)}
                                          placeholder="援?????
                                          className={DETAIL_INPUT}
                                        />
                                      </div>
                                      <div>
                                        <label className={DETAIL_FIELD_LABEL}>?곹깭 *</label>
                                        <select
                                          value={note.status}
                                          onChange={e => updateNote(item.id, note.id, 'status', e.target.value)}
                                          className={DETAIL_INPUT}
                                        >
                                          <option value="誘멸껐??>誘멸껐??/option>
                                          {item.noteType === '?섏떊' && <option value="異붿떖以?>異붿떖以?/option>}
                                          <option value="寃곗젣?꾨즺">寃곗젣?꾨즺</option>
                                          <option value="遺??>遺??/option>
                                        </select>
                                      </div>
                                      <div className="col-span-2">
                                        <label className={DETAIL_FIELD_LABEL}>諛곗꽌?댁슜</label>
                                        <input
                                          value={note.endorsement}
                                          onChange={e => updateNote(item.id, note.id, 'endorsement', e.target.value)}
                                          placeholder="諛곗꽌?? 諛곗꽌?쇱옄 ??
                                          className={DETAIL_INPUT}
                                        />
                                      </div>
                                      <div>
                                        <label className={DETAIL_FIELD_LABEL}>硫붾え</label>
                                        <input
                                          value={note.memo || ''}
                                          onChange={e => updateNote(item.id, note.id, 'memo', e.target.value)}
                                          placeholder="李멸퀬?ы빆"
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

                  {/* ?곸꽭 ?꾨뱶 (?곹뭹沅? */}
                  {isOpen && activeCategory === '?곹뭹沅? && (
                    <div className="px-4 pb-4 pt-1 border-t border-[var(--border-default)] mx-3">
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>湲덉븸 *</label>
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
                          <label className={DETAIL_FIELD_LABEL}>蹂댁쑀?섎웾 *</label>
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
                          <label className={DETAIL_FIELD_LABEL}>蹂닿?泥?*</label>
                          <input
                            value={item.voucherStorage || ''}
                            onChange={e => updateField(item.id, 'voucherStorage' as any, e.target.value)}
                            placeholder="?щТ??湲덇퀬"
                            className={DETAIL_INPUT}
                          />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>?대떦??*</label>
                          <select
                            value={item.voucherManager || ''}
                            onChange={e => updateField(item.id, 'voucherManager' as any, e.target.value)}
                            className={DETAIL_INPUT}
                          >
                            <option value="">?좏깮?섏꽭??/option>
                            {staffList.map((s: any) => (
                              <option key={s.id || s.name} value={s.name}>{s.name}{s.role ? ` (${s.role})` : ''}{s.dept ? ` - ${s.dept}` : ''}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className={DETAIL_FIELD_LABEL}>硫붾え</label>
                          <input
                            value={item.memo || ''}
                            onChange={e => updateField(item.id, 'memo', e.target.value)}
                            placeholder="李멸퀬?ы빆"
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

/* ?먥븧???낃툑怨꾩젙 愿由??먥븧??*/
const INCOME_CATEGORIES = [
  { key: '怨꾩쥖' as const, label: '怨꾩쥖', icon: '?룱', color: '#3b82f6', bg: 'bg-blue-50 dark:bg-blue-900/10', border: 'border-blue-200 dark:border-blue-800', desc: '怨꾩쥖?낃툑, ?먮룞?댁껜 ?섏떊 ?? },
  { key: '?꾧툑' as const, label: '?꾧툑', icon: '?뮫', color: '#22c55e', bg: 'bg-emerald-50 dark:bg-emerald-900/10', border: 'border-emerald-200 dark:border-emerald-800', desc: '?꾧툑 ?섏엯, ?꾩옣 ?섎궔 ?? },
  { key: '?댁쓬' as const, label: '?댁쓬', icon: '?뱞', color: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/10', border: 'border-amber-200 dark:border-amber-800', desc: '?섏떊?댁쓬, ?섑몴 ?? },
  { key: '?곹뭹沅? as const, label: '?곹뭹沅?, icon: '?렅截?, color: '#8b5cf6', bg: 'bg-violet-50 dark:bg-violet-900/10', border: 'border-violet-200 dark:border-violet-800', desc: '?곹뭹沅??섏엯 ?? },
]

function AcctIncomeMethods({ catId }: { catId?: string | null }) {
  const [refresh, setRefresh] = useState(0)
  const [newName, setNewName] = useState('')
  const [activeCategory, setActiveCategory] = useState<'怨꾩쥖' | '?꾧툑' | '?댁쓬' | '?곹뭹沅?>('怨꾩쥖')
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
      addToast('error', '???덉궛援щ텇???대? 議댁옱?섎뒗 ?낃툑怨꾩젙?낅땲??)
      return
    }
    const newItem: PayMethodItem = {
      id: Date.now(),
      name: newName.trim(),
      category: activeCategory,
      budgetCatId: selectedCatId || undefined,
      manager: activeCategory === '怨꾩쥖' ? defaultManager : undefined,
      custodian: activeCategory === '?꾧툑' ? defaultManager : undefined,
      noteManager: activeCategory === '?댁쓬' ? defaultManager : undefined,
      voucherManager: activeCategory === '?곹뭹沅? ? defaultManager : undefined,
    }
    saveAll([...allItems, newItem])
    addToast('success', `"${newName.trim()}" 異붽???)
    setNewName('')
    setExpandedId(newItem.id)
  }

  const handleDelete = (id: number) => {
    const item = allItems.find(i => i.id === id)
    if (!item) return
    if (!confirm(`"${item.name}"??瑜? ??젣?섏떆寃좎뒿?덇퉴?`)) return
    saveAll(allItems.filter(i => i.id !== id))
    addToast('warning', `"${item.name}" ??젣??)
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
            ?룱 ?낃툑怨꾩젙 愿由?
          </h2>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">?곷떒?먯꽌 ?덉궛援щ텇???좏깮?섏뿬 ?낃툑怨꾩젙??愿由ы빀?덈떎</p>
        </div>
        <span className="text-xs font-bold text-white bg-emerald-500 px-3 py-1.5 rounded-full">
          {selectedCatName || '?꾩껜'} {filteredItems.length}嫄?
        </span>
      </div>

      {/* 移댄뀒怨좊━ ??*/}
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
                <div className="text-[10px] font-bold text-[var(--text-muted)] mt-0.5">{count}嫄?/div>
              </div>
            </button>
          )
        })}
      </div>

      {/* ?좏깮??移댄뀒怨좊━ ?곸뿭 */}
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
            {catItems.length}嫄?
          </span>
        </div>

        {/* 異붽? ??*/}
        <div className="flex gap-2 mb-4">
          <input
            placeholder={`??${activeCatInfo.label} ?낃툑怨꾩젙 ?낅젰...`}
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
            <Plus size={14} /> 異붽?
          </button>
        </div>

        {/* ??ぉ 由ъ뒪??*/}
        {catItems.length === 0 ? (
          <div className="py-8 text-center text-sm text-[var(--text-muted)] rounded-xl border border-dashed border-[var(--border-default)] bg-white/50 dark:bg-gray-900/50">
            ?깅줉??{activeCatInfo.label} ?낃툑怨꾩젙???놁뒿?덈떎
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
                    <input value={item.name} onChange={e => { e.stopPropagation(); updateField(item.id, 'name', e.target.value) }} onClick={e => e.stopPropagation()} placeholder="?대쫫 ?낅젰" className="text-sm font-semibold text-[var(--text-primary)] flex-1 bg-transparent border-none outline-none focus:bg-[var(--bg-muted)] focus:px-2 focus:rounded-md transition-all" />
                    {activeCategory === '?꾧툑' && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 whitespace-nowrap">1-01-01 ?꾧툑</span>
                    )}
                    {activeCategory === '?곹뭹沅? && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-pink-50 dark:bg-pink-900/20 text-pink-600 whitespace-nowrap">1-01-08 ?곹뭹沅?/span>
                    )}
                    {activeCategory === '怨꾩쥖' && item.bankName && !isOpen && (
                      <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[200px]">
                        {item.bankName} {item.accountNumber ? `??${item.accountNumber}` : ''}
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

                  {/* ?곸꽭 ?꾨뱶 (怨꾩쥖) */}
                  {isOpen && activeCategory === '怨꾩쥖' && (
                    <div className="px-4 pb-4 pt-1 border-t border-[var(--border-default)] mx-3">
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>??됰챸 *</label>
                          <input value={item.bankName || ''} onChange={e => updateField(item.id, 'bankName', e.target.value)} placeholder="援????? className={DETAIL_INPUT} />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>怨꾩쥖踰덊샇 *</label>
                          <input value={item.accountNumber || ''} onChange={e => updateField(item.id, 'accountNumber', e.target.value)} placeholder="110-234-567890" className={DETAIL_INPUT} />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>?덇툑二?*</label>
                          <input value={item.accountHolder || ''} onChange={e => updateField(item.id, 'accountHolder', e.target.value)} placeholder="(二?臾명솕?ъ껌" className={DETAIL_INPUT} />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>怨꾩쥖愿由ъ옄 *</label>
                          <select value={item.manager || ''} onChange={e => updateField(item.id, 'manager', e.target.value)} className={DETAIL_INPUT}>
                            <option value="">?좏깮?섏꽭??/option>
                            {staffList.map((s: any) => (
                              <option key={s.id || s.name} value={s.name}>{s.name}{s.role ? ` (${s.role})` : ''}{s.dept ? ` - ${s.dept}` : ''}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>?⑸룄</label>
                          <input value={item.purpose || ''} onChange={e => updateField(item.id, 'purpose', e.target.value)} placeholder="蹂댁“湲??섏엯, ?ъ뾽鍮??? className={DETAIL_INPUT} />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>硫붾え</label>
                          <input value={item.memo || ''} onChange={e => updateField(item.id, 'memo', e.target.value)} placeholder="李멸퀬?ы빆" className={DETAIL_INPUT} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ?곸꽭 ?꾨뱶 (?꾧툑) */}
                  {isOpen && activeCategory === '?꾧툑' && (
                    <div className="px-4 pb-4 pt-1 border-t border-[var(--border-default)] mx-3">
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>蹂닿?泥?*</label>
                          <input value={item.storageLocation || ''} onChange={e => updateField(item.id, 'storageLocation' as any, e.target.value)} placeholder="?щТ??湲덇퀬 ?? className={DETAIL_INPUT} />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>蹂닿?梨낆엫??*</label>
                          <select value={item.custodian || ''} onChange={e => updateField(item.id, 'custodian' as any, e.target.value)} className={DETAIL_INPUT}>
                            <option value="">?좏깮?섏꽭??/option>
                            {staffList.map((s: any) => (
                              <option key={s.id || s.name} value={s.name}>{s.name}{s.role ? ` (${s.role})` : ''}{s.dept ? ` - ${s.dept}` : ''}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>?⑸룄</label>
                          <input value={item.purpose || ''} onChange={e => updateField(item.id, 'purpose', e.target.value)} placeholder="?꾧툑 ?섎궔 ?? className={DETAIL_INPUT} />
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>硫붾え</label>
                          <input value={item.memo || ''} onChange={e => updateField(item.id, 'memo', e.target.value)} placeholder="李멸퀬?ы빆" className={DETAIL_INPUT} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ?곸꽭 ?꾨뱶 (?댁쓬) */}
                  {isOpen && activeCategory === '?댁쓬' && (
                    <div className="px-4 pb-4 pt-1 border-t border-[var(--border-default)] mx-3">
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>援щ텇 *</label>
                          <select value={item.noteType || ''} onChange={e => updateField(item.id, 'noteType' as any, e.target.value)} className={DETAIL_INPUT}>
                            <option value="">?좏깮?섏꽭??/option>
                            <option value="?섏떊">?섏떊 (諛쏆쓣?댁쓬)</option>
                          </select>
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>?대떦??*</label>
                          <select value={item.noteManager || ''} onChange={e => updateField(item.id, 'noteManager' as any, e.target.value)} className={DETAIL_INPUT}>
                            <option value="">?좏깮?섏꽭??/option>
                            {staffList.map((s: any) => (
                              <option key={s.id || s.name} value={s.name}>{s.name}{s.role ? ` (${s.role})` : ''}{s.dept ? ` - ${s.dept}` : ''}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>硫붾え</label>
                          <input value={item.memo || ''} onChange={e => updateField(item.id, 'memo', e.target.value)} placeholder="李멸퀬?ы빆" className={DETAIL_INPUT} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ?곸꽭 ?꾨뱶 (?곹뭹沅? */}
                  {isOpen && activeCategory === '?곹뭹沅? && (
                    <div className="px-4 pb-4 pt-1 border-t border-[var(--border-default)] mx-3">
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>湲덉븸 *</label>
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
                          <label className={DETAIL_FIELD_LABEL}>?대떦??*</label>
                          <select value={item.voucherManager || ''} onChange={e => updateField(item.id, 'voucherManager' as any, e.target.value)} className={DETAIL_INPUT}>
                            <option value="">?좏깮?섏꽭??/option>
                            {staffList.map((s: any) => (
                              <option key={s.id || s.name} value={s.name}>{s.name}{s.role ? ` (${s.role})` : ''}{s.dept ? ` - ${s.dept}` : ''}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={DETAIL_FIELD_LABEL}>硫붾え</label>
                          <input value={item.memo || ''} onChange={e => updateField(item.id, 'memo', e.target.value)} placeholder="李멸퀬?ы빆" className={DETAIL_INPUT} />
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

/* ?먥븧???섎떒?깅줉 (吏異쒖닔??+ ?낃툑怨꾩젙 ?듯빀) ?먥븧??*/
function AcctMethodReg({ catId }: { catId?: string | null }) {
  const [refresh, setRefresh] = useState(0)
  const [direction, setDirection] = useState<'expense' | 'income'>('expense')
  const [newName, setNewName] = useState('')
  const [activeCategory, setActiveCategory] = useState<'怨꾩쥖' | '?꾧툑' | '?댁쓬' | '?곹뭹沅?>('怨꾩쥖')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [showExpenseList, setShowExpenseList] = useState(false)
  const [checkedExpenseIds, setCheckedExpenseIds] = useState<number[]>([])
  const [noteSubTab, setNoteSubTab] = useState<'?섏떊' | '諛쒗뻾'>('?섏떊')
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

  // ?곗씠???? 吏異쒖? acct_pay_methods_v2, ?낃툑? acct_income_methods
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

  // ?낃툑 紐⑤뱶?먯꽌 李몄“??吏異쒖닔??由ъ뒪??
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
  const catItems = filteredItems.filter(i => i.category === activeCategory && (activeCategory !== '?댁쓬' || (i.noteType || '') === noteSubTab))
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
      addToast('error', `???덉궛援щ텇???대? 議댁옱?섎뒗 ${direction === 'expense' ? '吏異쒖닔?? : '?낃툑怨꾩젙'}?낅땲??)
      return
    }
    const newItem: PayMethodItem = {
      id: Date.now(),
      name: newName.trim(),
      category: activeCategory,
      budgetCatId: selectedCatId || undefined,
      manager: activeCategory === '怨꾩쥖' ? defaultManager : undefined,
      custodian: activeCategory === '?꾧툑' ? defaultManager : undefined,
      noteManager: activeCategory === '?댁쓬' ? defaultManager : undefined,
      voucherManager: activeCategory === '?곹뭹沅? ? defaultManager : undefined,
    }
    saveAll([...allItems, newItem])
    addToast('success', `"${newName.trim()}" 異붽???)
    setNewName('')
    setExpandedId(newItem.id)
  }

  const handleDelete = (id: number) => {
    const item = allItems.find(i => i.id === id)
    if (!item) return
    if (!confirm(`"${item.name}"??瑜? ??젣?섏떆寃좎뒿?덇퉴?`)) return
    saveAll(allItems.filter(i => i.id !== id))
    addToast('warning', `"${item.name}" ??젣??)
    if (expandedId === id) setExpandedId(null)
  }

  const updateField = (id: number, field: string, value: any) => {
    saveAll(allItems.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  // ?? 移대뱶 CRUD (吏異쒖닔??怨꾩쥖留? ??
  const addCard = (itemId: number) => {
    const newCard: PayMethodCard = { id: Date.now(), cardName: '', cardCompany: '', cardNumber: '', cardType: '泥댄겕移대뱶', cardUser: defaultManager }
    saveAll(allItems.map(i => i.id === itemId ? { ...i, cards: [...(i.cards || []), newCard] } : i))
  }
  const updateCard = (itemId: number, cardId: number, field: keyof PayMethodCard, value: string | number) => {
    saveAll(allItems.map(i => i.id === itemId ? { ...i, cards: (i.cards || []).map(c => c.id === cardId ? { ...c, [field]: value } : c) } : i))
  }
  const deleteCard = (itemId: number, cardId: number) => {
    saveAll(allItems.map(i => i.id === itemId ? { ...i, cards: (i.cards || []).filter(c => c.id !== cardId) } : i))
  }

  // ?? ?댁쓬 CRUD ??
  const addNote = (itemId: number) => {
    const item = allItems.find(i => i.id === itemId)
    const newNote: PayMethodNote = { id: Date.now(), noteNumber: '', issuer: item?.noteType === '諛쒗뻾' ? '?곕━?뚯궗' : '', receiver: item?.noteType === '?섏떊' ? '?곕━?뚯궗' : '', amount: 0, issueDate: getLocalDate(), maturityDate: '', endorsement: '', bank: '', status: '誘멸껐?? }
    saveAll(allItems.map(i => i.id === itemId ? { ...i, notes: [...(i.notes || []), newNote] } : i))
  }
  const updateNote = (itemId: number, noteId: number, field: keyof PayMethodNote, value: string | number) => {
    saveAll(allItems.map(i => i.id === itemId ? { ...i, notes: (i.notes || []).map(n => n.id === noteId ? { ...n, [field]: value } : n) } : i))
  }
  const deleteNote = (itemId: number, noteId: number) => {
    saveAll(allItems.map(i => i.id === itemId ? { ...i, notes: (i.notes || []).filter(n => n.id !== noteId) } : i))
  }
  const [endDropKey, setEndDropKey] = React.useState<string | null>(null)
  const [vendorDropKey, setVendorDropKey] = React.useState<string | null>(null)

  const dirLabel = direction === 'expense' ? '吏異쒖닔?? : '?낃툑怨꾩젙'

  return (
    <div className="space-y-5">
      {/* ?ㅻ뜑 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-[var(--text-primary)] flex items-center gap-2">
            ?뮩 ?섎떒?깅줉
          </h2>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">?덉궛援щ텇蹂?吏異쒖닔?④낵 ?낃툑怨꾩젙???듯빀 愿由ы빀?덈떎</p>
        </div>
        <span className="text-xs font-bold text-white px-3 py-1.5 rounded-full" style={{ background: direction === 'expense' ? '#f97316' : '#22c55e' }}>
          {selectedCatName || '?꾩껜'} ??{dirLabel} {filteredItems.length}嫄?
        </span>
      </div>

      {/* 吏異??낃툑 ?꾪솚 */}
      <div className="flex items-center gap-1 bg-[var(--bg-muted)] rounded-lg px-1 py-0.5 border border-[var(--border-default)] w-fit">
        <button
          onClick={() => { setDirection('expense'); setExpandedId(null); setNewName(''); setShowExpenseList(false) }}
          className={cn('px-3 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1',
            direction === 'expense' ? 'bg-orange-500 text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          )}
        >
          <ArrowUpCircle size={12} /> 吏異?
        </button>
        <button
          onClick={() => { setDirection('income'); setExpandedId(null); setNewName(''); setShowExpenseList(false) }}
          className={cn('px-3 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1',
            direction === 'income' ? 'bg-emerald-500 text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          )}
        >
          <ArrowDownCircle size={12} /> ?낃툑
        </button>
      </div>

      {/* 移댄뀒怨좊━ ??*/}
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
                <div className="text-[10px] font-bold text-[var(--text-muted)] mt-0.5">{count}嫄?/div>
              </div>
            </button>
          )
        })}
      </div>

      {/* ?좏깮??移댄뀒怨좊━ ?곸뿭 */}
      <div className={`rounded-2xl border-2 ${activeCatInfo.border} ${activeCatInfo.bg} p-5`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">{activeCatInfo.icon}</span>
            <div>
              <h3 className="text-sm font-extrabold" style={{ color: activeCatInfo.color }}>{activeCatInfo.label} {dirLabel}</h3>
              <p className="text-[10px] text-[var(--text-muted)]">{activeCatInfo.desc}</p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: activeCatInfo.color, background: `${activeCatInfo.color}15` }}>{catItems.length}嫄?/span>
        </div>

        {/* ?댁쓬: ?섏떊/諛쒗뻾 ?쒕툕??*/}
        {activeCategory === '?댁쓬' ? (
          <div className="mb-4">
            <div className="flex items-center gap-2">
              {(['?섏떊', '諛쒗뻾'] as const).map(sub => {
                const subCount = filteredItems.filter(i => i.category === '?댁쓬' && (i.noteType || '') === sub).length
                const isActive = noteSubTab === sub
                const subColor = sub === '?섏떊' ? '#3b82f6' : '#ef4444'
                const subIcon = sub === '?섏떊' ? '?뱿' : '?뱾'
                return (
                  <button
                    key={sub}
                    onClick={() => { setNoteSubTab(sub); setExpandedId(null) }}
                    className={`flex-1 py-2.5 px-4 rounded-xl border-2 transition-all cursor-pointer ${
                      isActive ? 'shadow-sm' : 'bg-white/50 dark:bg-gray-900/30 border-transparent hover:border-[var(--border-default)]'
                    }`}
                    style={isActive ? { borderColor: subColor, background: `${subColor}08` } : undefined}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm">{subIcon}</span>
                      <span className="text-[12px] font-extrabold" style={isActive ? { color: subColor } : { color: 'var(--text-secondary)' }}>{sub === '?섏떊' ? '?섏떊?댁쓬 (諛쏆쓣?댁쓬)' : '諛쒗뻾?댁쓬 (吏湲됱뼱??'}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: subColor, background: `${subColor}15` }}>{subCount}</span>
                    </div>
                  </button>
                )
              })}
              <button
                onClick={() => {
                  const nm = `${noteSubTab === '?섏떊' ? '?섏떊' : '諛쒗뻾'}?댁쓬 ${filteredItems.filter(i => i.category === '?댁쓬' && (i.noteType || '') === noteSubTab).length + 1}`
                  const acctCode = noteSubTab === '?섏떊' ? '1-01-06' : '2-01-02'
                  const newItem: any = {
                    id: Date.now(), name: nm, category: '?댁쓬' as const,
                    budgetCatId: selectedCatId || undefined,
                    noteType: noteSubTab, linkedAccountCode: acctCode,
                    noteManager: defaultManager || undefined,
                  }
                  saveAll([...allItems, newItem])
                  addToast('success', `${noteSubTab}?댁쓬 "${nm}" 異붽?`)
                  setRefresh(r => r + 1)
                }}
                className="px-3 py-2.5 rounded-xl text-white text-sm font-bold transition-all cursor-pointer hover:shadow-md flex items-center gap-1.5 shrink-0"
                style={{ background: noteSubTab === '?섏떊' ? '#3b82f6' : '#ef4444' }}
              >
                <Plus size={14} /> 異붽?
              </button>
            </div>
          </div>
        ) : (
        <>
        {/* 異붽? ??*/}
        <div className="relative mb-4">
          <div className="flex gap-2">
            {activeCategory === '怨꾩쥖' ? (
              <div className="flex-1 relative">
                <input
                  readOnly
                  placeholder="??怨꾩쥖愿由ъ뿉???깅줉??怨꾩쥖瑜??좏깮?섏꽭??
                  value={newName}
                  onClick={() => { const dd = document.getElementById('method-acct-dropdown'); if (dd) dd.style.display = dd.style.display === 'block' ? 'none' : 'block' }}
                  onBlur={() => setTimeout(() => { const dd = document.getElementById('method-acct-dropdown'); if (dd) dd.style.display = 'none' }, 200)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-default)] bg-white dark:bg-gray-900 text-sm text-[var(--text-primary)] outline-none focus:border-primary-400 transition-colors placeholder:text-[var(--text-muted)] cursor-pointer"
                />
                <div id="method-acct-dropdown" style={{ display: 'none' }} className="absolute z-50 top-full left-0 right-0 mt-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-xl max-h-48 overflow-y-auto">
                  {(() => {
                    const companyAccts = getItem<any[]>('acct_company_accounts', [])
                    if (companyAccts.length === 0) return <div className="px-3 py-3 text-xs text-[var(--text-muted)] text-center">怨꾩쥖愿由ъ뿉??怨꾩쥖瑜?癒쇱? ?깅줉?섏꽭??/div>
                    const filtered = companyAccts
                    return filtered.map((a: any) => {
                      const label = `${a.bankName || ''} ${a.accountNumber || ''}`.trim()
                      const alreadyAdded = catItems.some(ci => ci.name === label)
                      return (
                        <button
                          key={a.id}
                          type="button"
                          disabled={alreadyAdded}
                          onMouseDown={e => {
                            e.preventDefault()
                            if (alreadyAdded) return
                            // 怨꾩쥖 異붽? + 移대뱶 ?먮룞 ?곕룞
                            const newItem: PayMethodItem = {
                              id: Date.now(),
                              name: label,
                              category: '怨꾩쥖',
                              budgetCatId: selectedCatId || undefined,
                              manager: defaultManager,
                              bankName: a.bankName,
                              accountNumber: a.accountNumber,
                              accountHolder: a.accountHolder,
                              cards: (a.cards || []).map((c: any, idx: number) => ({
                                id: Date.now() + idx + 1,
                                cardName: c.cardName || '',
                                cardCompany: c.cardCompany || '',
                                cardNumber: c.cardNumber || '',
                                cardType: c.cardType || '泥댄겕移대뱶',
                                cardUser: c.cardUser || defaultManager
                              }))
                            }
                            saveAll([...allItems, newItem])
                            addToast('success', `"${label}" 怨꾩쥖 + ${(a.cards || []).length}??移대뱶 異붽???)
                            setNewName('')
                            setExpandedId(newItem.id)
                            const dd = document.getElementById('method-acct-dropdown'); if (dd) dd.style.display = 'none'
                          }}
                          className={`w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center justify-between ${alreadyAdded ? 'opacity-40 cursor-not-allowed' : 'hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer'}`}
                        >
                          <div>
                            <span className="font-bold text-[var(--text-primary)]">{a.bankName}</span>
                            <span className="text-[var(--text-muted)] ml-1.5 font-mono text-xs">{a.accountNumber}</span>
                            {a.accountHolder && <span className="text-[var(--text-secondary)] ml-1.5 text-xs">({a.accountHolder})</span>}
                          </div>
                          <div className="flex items-center gap-1">
                            {(a.cards || []).length > 0 && <span className="text-[10px] font-bold text-violet-500 bg-violet-50 dark:bg-violet-900/20 px-1.5 py-0.5 rounded">移대뱶 {(a.cards || []).length}</span>}
                            {alreadyAdded && <span className="text-[10px] font-bold text-emerald-500">?깅줉??/span>}
                          </div>
                        </button>
                      )
                    })
                  })()}
                </div>
              </div>
            ) : (
            <input
              placeholder={direction === 'income' ? `${activeCatInfo.label} ?낃툑怨꾩젙 ?낅젰 ?먮뒗 Enter濡?吏異쒖닔???좏깮...` : `??${activeCatInfo.label} 吏異쒖닔???낅젰...`}
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
            )}
            {activeCategory !== '怨꾩쥖' && (
            <button onClick={() => { handleAdd(); setShowExpenseList(false) }} className="px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-all cursor-pointer hover:shadow-md flex items-center gap-1.5" style={{ background: activeCatInfo.color }}>
              <Plus size={14} /> 異붽?
            </button>
            )}
          </div>

          {/* ?낃툑 紐⑤뱶: 吏異쒖닔??蹂듭닔?좏깮 ?쒕∼?ㅼ슫 */}
          {direction === 'income' && showExpenseList && (() => {
            const visibleItems = filteredExpenseItems.filter(ei => !newName.trim() || ei.name.toLowerCase().includes(newName.toLowerCase()))
            const selectableItems = visibleItems.filter(ei => !catItems.some(ci => ci.name === ei.name))
            const checkedCount = checkedExpenseIds.length
            return (
            <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white dark:bg-gray-900 rounded-xl border border-[var(--border-default)] shadow-lg max-h-[320px] flex flex-col">
              {/* ?ㅻ뜑 */}
              <div className="p-2.5 border-b border-[var(--border-default)] flex items-center justify-between shrink-0">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">?뱥 吏異쒖닔?⑥뿉???좏깮 ({filteredExpenseItems.length}嫄?</span>
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
                      {checkedExpenseIds.length === selectableItems.length ? '?꾩껜?댁젣' : '?꾩껜?좏깮'}
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
                        addToast('success', `${newItems.length}嫄??낃툑怨꾩젙??異붽???)
                        setShowExpenseList(false)
                        setCheckedExpenseIds([])
                        setNewName('')
                      }}
                      className="px-3 py-1 rounded-lg bg-emerald-500 text-white text-[11px] font-bold cursor-pointer hover:bg-emerald-600 flex items-center gap-1 shadow-sm"
                    >
                      <Check size={12} /> {checkedCount}嫄?異붽?
                    </button>
                  )}
                </div>
              </div>
              {/* 由ъ뒪??*/}
              <div className="overflow-y-auto flex-1">
              {filteredExpenseItems.length === 0 ? (
                <div className="p-4 text-center text-[11px] text-[var(--text-muted)]">
                  ???덉궛??{activeCatInfo.label} 吏異쒖닔?⑥씠 ?놁뒿?덈떎. 吏곸젒 ?낅젰 ??異붽??섏꽭??
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
                        {/* 泥댄겕諛뺤뒪 */}
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
                        {alreadyAdded && <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">?깅줉??/span>}
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
                    <Plus size={14} /> "{newName.trim()}" ?덈줈 異붽?
                  </button>
                </div>
              )}
            </div>
            )
          })()}
        </div>
        </>
        )}

        {/* ??ぉ 由ъ뒪??*/}
        {catItems.length === 0 ? (
          <div className="py-8 text-center text-sm text-[var(--text-muted)] rounded-xl border border-dashed border-[var(--border-default)] bg-white/50 dark:bg-gray-900/50">
            ?깅줉??{activeCatInfo.label} {dirLabel}???놁뒿?덈떎
          </div>
        ) : (
          <div className="space-y-1.5">
            {catItems.map((item, idx) => {
              const isOpen = expandedId === item.id
              return (
                <div key={item.id} className={`rounded-xl transition-all border ${isOpen ? 'border-[var(--border-default)] bg-white dark:bg-gray-900/60 shadow-sm' : 'border-transparent bg-white/70 dark:bg-gray-900/30 hover:bg-white dark:hover:bg-gray-800/50 hover:border-[var(--border-default)]'}`}>
                  {/* 硫붿씤 ??*/}
                  <div className="flex items-center gap-3 px-3.5 py-2.5 cursor-pointer group" onClick={() => setExpandedId(isOpen ? null : item.id)}>
                    <span className="text-[10px] font-bold w-5 text-center shrink-0 rounded-full py-0.5" style={{ color: activeCatInfo.color, background: `${activeCatInfo.color}15` }}>{idx + 1}</span>
                    <input value={item.name} onChange={e => { e.stopPropagation(); updateField(item.id, 'name', e.target.value) }} onClick={e => e.stopPropagation()} placeholder="?대쫫 ?낅젰" className="text-sm font-semibold text-[var(--text-primary)] flex-1 bg-transparent border-none outline-none focus:bg-[var(--bg-muted)] focus:px-2 focus:rounded-md transition-all" />
                    {activeCategory === '?꾧툑' && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 whitespace-nowrap">1-01-01 ?꾧툑</span>
                    )}
                    {activeCategory === '?곹뭹沅? && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-pink-50 dark:bg-pink-900/20 text-pink-600 whitespace-nowrap">1-01-08 ?곹뭹沅?/span>
                    )}
                    {activeCategory === '怨꾩쥖' && item.bankName && !isOpen && (
                      <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[200px]">{item.bankName} {item.accountNumber ? `??${item.accountNumber}` : ''}</span>
                    )}
                    {/* ?곌껐??怨꾩젙怨쇰ぉ ?쒖떆 */}
                    {activeCategory !== '?꾧툑' && activeCategory !== '?곹뭹沅? && (item as any).accountCode && !isOpen && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-violet-50 dark:bg-violet-900/20 text-violet-600">{(item as any).accountCode}</span>
                    )}
                    <ChevronDown size={14} className={`text-[var(--text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    <button onClick={e => { e.stopPropagation(); handleDelete(item.id) }} className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-danger cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* ?곸꽭 ?꾨뱶 */}
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 border-t border-[var(--border-default)] mx-3">
                      {/* 怨꾩젙怨쇰ぉ ?곌껐 (?댁쓬/?꾧툑/?곹뭹沅뚯? ?먮룞?곌껐?대?濡??쒖쇅) */}
                      {activeCategory !== '?댁쓬' && activeCategory !== '?꾧툑' && activeCategory !== '?곹뭹沅? && (
                      <div className="mb-3 mt-3 p-3 rounded-lg bg-violet-50/50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800">
                        {direction === 'income' ? (
                          <>
                            <label className="text-[11px] font-bold text-violet-600 mb-2 block">?뱥 怨꾩젙怨쇰ぉ ?곌껐 (?낃툑?꾪몴 ?먮룞 ?ㅼ젙)</label>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] font-bold text-blue-500 mb-1 block">?뮥 李⑤? (?낃툑泥?- ?먯궛怨꾩젙)</label>
                                <select
                                  value={(item as any).accountCode || ''}
                                  onChange={e => updateField(item.id, 'accountCode', e.target.value)}
                                  className={DETAIL_INPUT}
                                >
                                  <option value="">???낃툑怨꾩젙 ?좏깮 ??/option>
                                  {allAccounts.filter(a => a.active !== false && (a as any).incomeEnabled === true).map(a => (
                                    <option key={a.code} value={`${a.code} ${a.name}`}>{a.code} {a.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-emerald-500 mb-1 block">?뱢 ?蹂 (?섏씡怨꾩젙)</label>
                                <select
                                  value={(item as any).revenueAccountCode || ''}
                                  onChange={e => updateField(item.id, 'revenueAccountCode', e.target.value)}
                                  className={DETAIL_INPUT}
                                >
                                  <option value="">???섏씡怨꾩젙 ?좏깮 ??/option>
                                  {allAccounts.filter(a => a.active !== false && a.type === 'revenue').map(a => (
                                    <option key={a.code} value={`${a.code} ${a.name}`}>{a.code} {a.name}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <label className="text-[11px] font-bold text-violet-600 mb-1 block">?뱥 怨꾩젙怨쇰ぉ ?곌껐</label>
                            <select
                              value={(item as any).accountCode || ''}
                              onChange={e => updateField(item.id, 'accountCode', e.target.value)}
                              className={DETAIL_INPUT}
                            >
                              <option value="">??怨꾩젙怨쇰ぉ ?좏깮 ??/option>
                              {allAccounts.filter(a => a.active !== false).map(a => (
                                <option key={a.code} value={`${a.code} ${a.name}`}>{a.code} {a.name}</option>
                              ))}
                            </select>
                          </>
                        )}
                      </div>
                      )}

                      {/* 怨꾩쥖 ?곸꽭 */}
                      {activeCategory === '怨꾩쥖' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className={DETAIL_FIELD_LABEL}>??됰챸 *</label><input value={item.bankName || ''} onChange={e => updateField(item.id, 'bankName', e.target.value)} placeholder="援????? className={DETAIL_INPUT} /></div>
                          <div><label className={DETAIL_FIELD_LABEL}>怨꾩쥖踰덊샇 *</label><input value={item.accountNumber || ''} onChange={e => updateField(item.id, 'accountNumber', e.target.value)} placeholder="110-234-567890" className={DETAIL_INPUT} /></div>
                          <div><label className={DETAIL_FIELD_LABEL}>?덇툑二?*</label><input value={item.accountHolder || ''} onChange={e => updateField(item.id, 'accountHolder', e.target.value)} placeholder="(二?臾명솕?ъ껌" className={DETAIL_INPUT} /></div>
                          <div>
                            <label className={DETAIL_FIELD_LABEL}>怨꾩쥖愿由ъ옄 *</label>
                            <select value={item.manager || ''} onChange={e => updateField(item.id, 'manager', e.target.value)} className={DETAIL_INPUT}>
                              <option value="">?좏깮?섏꽭??/option>
                              {staffList.map((s: any) => (<option key={s.id || s.name} value={s.name}>{s.name}{s.role ? ` (${s.role})` : ''}{s.dept ? ` - ${s.dept}` : ''}</option>))}
                            </select>
                          </div>
                          <div><label className={DETAIL_FIELD_LABEL}>?⑸룄</label><input value={item.purpose || ''} onChange={e => updateField(item.id, 'purpose', e.target.value)} placeholder="?댁쁺?먭툑 ?? className={DETAIL_INPUT} /></div>
                          <div><label className={DETAIL_FIELD_LABEL}>硫붾え</label><input value={item.memo || ''} onChange={e => updateField(item.id, 'memo', e.target.value)} placeholder="李멸퀬?ы빆" className={DETAIL_INPUT} /></div>
                        </div>
                      )}

                      {/* ?꾧툑 ?곸꽭 */}
                      {activeCategory === '?꾧툑' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className={DETAIL_FIELD_LABEL}>蹂닿?泥?*</label><input value={item.storageLocation || ''} onChange={e => updateField(item.id, 'storageLocation', e.target.value)} placeholder="?щТ??湲덇퀬" className={DETAIL_INPUT} /></div>
                          <div>
                            <label className={DETAIL_FIELD_LABEL}>蹂닿?梨낆엫??*</label>
                            <select value={item.custodian || ''} onChange={e => updateField(item.id, 'custodian', e.target.value)} className={DETAIL_INPUT}>
                              <option value="">?좏깮?섏꽭??/option>
                              {staffList.map((s: any) => (<option key={s.id || s.name} value={s.name}>{s.name}{s.role ? ` (${s.role})` : ''}{s.dept ? ` - ${s.dept}` : ''}</option>))}
                            </select>
                          </div>
                          <div><label className={DETAIL_FIELD_LABEL}>?⑸룄</label><input value={item.purpose || ''} onChange={e => updateField(item.id, 'purpose', e.target.value)} placeholder="?뚯븸寃쎈퉬 ?? className={DETAIL_INPUT} /></div>
                          <div><label className={DETAIL_FIELD_LABEL}>硫붾え</label><input value={item.memo || ''} onChange={e => updateField(item.id, 'memo', e.target.value)} placeholder="李멸퀬?ы빆" className={DETAIL_INPUT} /></div>
                        </div>
                      )}

                      {/* ?댁쓬 ?곸꽭 */}
                      {activeCategory === '?댁쓬' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className={DETAIL_FIELD_LABEL}>援щ텇</label>
                              <div className={`${DETAIL_INPUT} flex items-center gap-1.5 !bg-[var(--bg-muted)]`}>
                                {item.noteType === '?섏떊' ? (
                                  <><span className="text-sm">?뱿</span><span className="text-xs font-bold text-blue-600">?섏떊?댁쓬 (諛쏆쓣?댁쓬)</span></>
                                ) : (
                                  <><span className="text-sm">?뱾</span><span className="text-xs font-bold text-rose-600">諛쒗뻾?댁쓬 (吏湲됱뼱??</span></>
                                )}
                              </div>
                            </div>
                            <div>
                              <label className={DETAIL_FIELD_LABEL}>?곌껐 怨꾩젙</label>
                              <div className={`${DETAIL_INPUT} flex items-center gap-1.5 !bg-[var(--bg-muted)]`}>
                                {item.noteType === '?섏떊' ? (
                                  <><span className="text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">?먯궛</span><span className="text-xs font-bold">1-01-06 諛쏆쓣?댁쓬</span></>
                                ) : (
                                  <><span className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-1.5 py-0.5 rounded">遺梨?/span><span className="text-xs font-bold">2-01-02 吏湲됱뼱??/span></>
                                )}
                              </div>
                            </div>
                            <div>
                              <label className={DETAIL_FIELD_LABEL}>?대떦??*</label>
                              <select value={item.noteManager || ''} onChange={e => updateField(item.id, 'noteManager', e.target.value)} className={DETAIL_INPUT}>
                                <option value="">?좏깮?섏꽭??/option>
                                {staffList.map((s: any) => (<option key={s.id || s.name} value={s.name}>{s.name}{s.role ? ` (${s.role})` : ''}{s.dept ? ` - ${s.dept}` : ''}</option>))}
                              </select>
                            </div>
                            <div><label className={DETAIL_FIELD_LABEL}>硫붾え</label><input value={item.memo || ''} onChange={e => updateField(item.id, 'memo', e.target.value)} placeholder="李멸퀬?ы빆" className={DETAIL_INPUT} /></div>
                          </div>

                          {/* ?? ?댁쓬????? */}
                          {item.noteType && (
                            <div className="pt-3 border-t border-dashed border-amber-200 dark:border-amber-800">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[12px] font-extrabold text-[var(--text-primary)]">?뱞 ?댁쓬???/span>
                                  {(item.notes || []).length > 0 && (
                                    <span className="text-[9px] font-bold bg-amber-100 dark:bg-amber-900/20 text-amber-600 px-1.5 py-0.5 rounded">{(item.notes || []).length}嫄?/span>
                                  )}
                                </div>
                                <button onClick={() => addNote(item.id)} className="text-[11px] font-bold text-amber-500 hover:text-amber-700 cursor-pointer flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                                  <Plus size={12} /> ?댁쓬 異붽?
                                </button>
                              </div>
                              {(!item.notes || item.notes.length === 0) ? (
                                <div className="py-3 text-center text-[11px] text-[var(--text-muted)] rounded-lg border border-dashed border-[var(--border-default)]">
                                  ?깅줉???댁쓬???놁뒿?덈떎
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {item.notes.map((note: any, ni: number) => {
                                    const statusColors: Record<string, string> = { '誘멸껐??: '#f59e0b', '異붿떖以?: '#3b82f6', '寃곗젣?꾨즺': '#22c55e', '遺??: '#ef4444' }
                                    return (
                                      <div key={note.id} className="rounded-lg border border-amber-100 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-900/5 p-2.5">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-amber-500">?뱞 ?댁쓬 {ni + 1}</span>
                                            {note.status && (
                                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ color: statusColors[note.status] || '#888', background: `${statusColors[note.status] || '#888'}15` }}>
                                                {note.status}
                                              </span>
                                            )}
                                          </div>
                                          <button onClick={() => deleteNote(item.id, note.id)} className="text-[10px] text-red-400 hover:text-red-600 cursor-pointer flex items-center gap-0.5">
                                            <Trash2 size={10} /> ??젣
                                          </button>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                          <div><label className={DETAIL_FIELD_LABEL}>?댁쓬踰덊샇</label><input value={note.noteNumber || ''} onChange={e => updateNote(item.id, note.id, 'noteNumber', e.target.value)} placeholder="A-2026-001" className={DETAIL_INPUT} /></div>
                                          <div className="relative">
                                            <label className={DETAIL_FIELD_LABEL}>{item.noteType === '?섏떊' ? '諛쒗뻾?? : '?섏랬??}</label>
                                            <input
                                              value={item.noteType === '?섏떊' ? (note.issuer || '') : (note.receiver || '')}
                                              onChange={e => {
                                                updateNote(item.id, note.id, item.noteType === '?섏떊' ? 'issuer' : 'receiver', e.target.value)
                                              }}
                                              onFocus={() => setVendorDropKey(`${item.id}-${note.id}`)}
                                              onBlur={() => setTimeout(() => setVendorDropKey(k => k === `${item.id}-${note.id}` ? null : k), 200)}
                                              placeholder="嫄곕옒泥?寃??.."
                                              className={DETAIL_INPUT}
                                            />
                                            {vendorDropKey === `${item.id}-${note.id}` && (() => {
                                              const vendorList: any[] = getItem('acct_vendors', [])
                                              const searchVal = (item.noteType === '?섏떊' ? (note.issuer || '') : (note.receiver || '')).toLowerCase()
                                              const filtered = vendorList.filter(v => !searchVal || v.name.toLowerCase().includes(searchVal))
                                              return (
                                                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-[var(--border-default)] rounded-xl shadow-lg max-h-[150px] overflow-y-auto">
                                                  {filtered.map((v: any) => (
                                                    <button
                                                      key={v.id}
                                                      onMouseDown={e => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                        updateNote(item.id, note.id, item.noteType === '?섏떊' ? 'issuer' : 'receiver', v.name)
                                                        setVendorDropKey(null)
                                                      }}
                                                      className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--bg-muted)] cursor-pointer flex items-center gap-2 transition-colors"
                                                    >
                                                      <span className="text-[10px]">?룫</span>
                                                      <span className="font-semibold text-[var(--text-primary)]">{v.name}</span>
                                                      {v.ceoName && <span className="text-[10px] text-[var(--text-muted)]">??? {v.ceoName}</span>}
                                                    </button>
                                                  ))}
                                                  {filtered.length === 0 && (
                                                    <div className="px-3 py-2 text-[11px] text-[var(--text-muted)]">寃??寃곌낵媛 ?놁뒿?덈떎</div>
                                                  )}

                                                </div>
                                              )
                                            })()}
                                          </div>
                                          <div><label className={DETAIL_FIELD_LABEL}>湲덉븸</label><input value={note.amount ? note.amount.toLocaleString() : ''} onChange={e => updateNote(item.id, note.id, 'amount', parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0)} placeholder="5,000,000" className={DETAIL_INPUT} /></div>
                                          <div><label className={DETAIL_FIELD_LABEL}>諛쒗뻾??/label><DatePicker value={note.issueDate || ''} onChange={v => updateNote(item.id, note.id, 'issueDate', v)} /></div>
                                          <div><label className={DETAIL_FIELD_LABEL}>留뚭린??/label><DatePicker value={note.maturityDate || ''} onChange={v => updateNote(item.id, note.id, 'maturityDate', v)} /></div>
                                          <div>
                                            <label className={DETAIL_FIELD_LABEL}>?곹깭</label>
                                            <select value={note.status || '誘멸껐??} onChange={e => updateNote(item.id, note.id, 'status', e.target.value)} className={DETAIL_INPUT}>
                                              <option value="誘멸껐??>誘멸껐??/option>
                                              {item.noteType === '?섏떊' && <option value="異붿떖以?>異붿떖以?/option>}
                                              <option value="寃곗젣?꾨즺">寃곗젣?꾨즺</option>
                                              <option value="遺??>遺??/option>
                                            </select>
                                          </div>
                                        </div>

                                        {/* ?섏떊?댁쓬: ?댁꽌(諛곗꽌) 由ъ뒪??*/}
                                        {/* ?섏떊?댁쓬: ?댁꽌(諛곗꽌) 由ъ뒪??*/}
                                        {item.noteType === '?섏떊' && (
                                          <div className="mt-2 pt-2 border-t border-dashed border-amber-200 dark:border-amber-800/40">
                                            <div className="flex items-center justify-between mb-1.5">
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] font-extrabold text-indigo-600">?뱥 ?댁꽌(諛곗꽌) ?댁뿭</span>
                                                {(note.endorsements || []).length > 0 && (
                                                  <span className="text-[9px] font-bold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 px-1.5 py-0.5 rounded">{(note.endorsements || []).length}嫄?/span>
                                                )}
                                              </div>
                                              <button
                                                onClick={() => {
                                                  const endorsements = [...(note.endorsements || []), { id: Date.now(), endorser: '', endorseDate: getLocalDate(), reason: '' }]
                                                  updateNote(item.id, note.id, 'endorsements', endorsements)
                                                }}
                                                className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 cursor-pointer flex items-center gap-0.5 px-2 py-0.5 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                                              >
                                                <Plus size={10} /> ?댁꽌 異붽?
                                              </button>
                                            </div>
                                            {(note.endorsements || []).length === 0 ? (
                                              <div className="text-[10px] text-[var(--text-muted)] text-center py-2 rounded-md border border-dashed border-[var(--border-default)]">?댁꽌 ?댁뿭???놁뒿?덈떎</div>
                                            ) : (
                                              <div className="space-y-2">
                                                {(note.endorsements || []).map((ed: any, ei: number) => {
                                                  const dropKey = `${note.id}-${ei}`
                                                  return (
                                                  <div key={ed.id} className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-lg p-2.5 border border-indigo-100 dark:border-indigo-900/30">
                                                    <div className="flex items-center justify-between mb-2">
                                                      <span className="text-[9px] font-bold text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded">?댁꽌 {ei + 1}</span>
                                                      <button
                                                        onClick={() => {
                                                          const updated = (note.endorsements || []).filter((_: any, i: number) => i !== ei)
                                                          updateNote(item.id, note.id, 'endorsements', updated)
                                                        }}
                                                        className="text-[10px] text-red-400 hover:text-red-600 cursor-pointer flex items-center gap-0.5"
                                                      >
                                                        <Trash2 size={10} /> ??젣
                                                      </button>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-2">
                                                      <div className="relative">
                                                        <label className="block text-[9px] font-bold text-[var(--text-muted)] mb-0.5">?댁꽌??/label>
                                                        <input
                                                          value={ed.endorser || ''}
                                                          onChange={e => {
                                                            const updated = [...(note.endorsements || [])]
                                                            updated[ei] = { ...updated[ei], endorser: e.target.value }
                                                            updateNote(item.id, note.id, 'endorsements', updated)
                                                            setEndDropKey(dropKey)
                                                          }}
                                                          onFocus={() => setEndDropKey(dropKey)}
                                                          onBlur={() => setTimeout(() => setEndDropKey(null), 200)}
                                                          placeholder="嫄곕옒泥?寃??.."
                                                          className="w-full text-[11px] px-2 py-1.5 rounded-md border border-[var(--border-default)] bg-white dark:bg-gray-900 outline-none"
                                                        />
                                                        {endDropKey === dropKey && (() => {
                                                          const vendorList: any[] = getItem('acct_vendors', [])
                                                          const sv = (ed.endorser || '').toLowerCase()
                                                          const flt = vendorList.filter(v => !sv || v.name.toLowerCase().includes(sv))
                                                          return (
                                                            <div className="absolute z-50 top-full left-0 right-0 mt-0.5 bg-white dark:bg-gray-900 border border-[var(--border-default)] rounded-lg shadow-lg max-h-[160px] overflow-y-auto">
                                                              {flt.map((v: any) => (
                                                                <button key={v.id} onMouseDown={e => {
                                                                  e.preventDefault()
                                                                  const updated = [...(note.endorsements || [])]
                                                                  updated[ei] = { ...updated[ei], endorser: v.name }
                                                                  updateNote(item.id, note.id, 'endorsements', updated)
                                                                  setEndDropKey(null)
                                                                }} className="w-full text-left px-2.5 py-1.5 text-[11px] hover:bg-[var(--bg-muted)] cursor-pointer flex items-center gap-1.5">
                                                                  <span className="text-[10px]">?룫</span>
                                                                  <span className="font-semibold">{v.name}</span>
                                                                  {v.ceoName && <span className="text-[9px] text-[var(--text-muted)]">??? {v.ceoName}</span>}
                                                                </button>
                                                              ))}
                                                              {flt.length === 0 && (
                                                                <div className="px-2.5 py-1.5 text-[10px] text-[var(--text-muted)]">寃??寃곌낵媛 ?놁뒿?덈떎</div>
                                                              )}
                                                            </div>
                                                          )
                                                        })()}
                                                      </div>
                                                      <div>
                                                        <label className="block text-[9px] font-bold text-[var(--text-muted)] mb-0.5">?댁꽌??/label>
                                                        <DatePicker value={ed.endorseDate || ''} onChange={v => {
                                                          const updated = [...(note.endorsements || [])]
                                                          updated[ei] = { ...updated[ei], endorseDate: v }
                                                          updateNote(item.id, note.id, 'endorsements', updated)
                                                        }} />
                                                      </div>
                                                      <div>
                                                        <label className="block text-[9px] font-bold text-[var(--text-muted)] mb-0.5">?ъ쑀</label>
                                                        <input
                                                          value={ed.reason || ''}
                                                          onChange={e => {
                                                            const updated = [...(note.endorsements || [])]
                                                            updated[ei] = { ...updated[ei], reason: e.target.value }
                                                            updateNote(item.id, note.id, 'endorsements', updated)
                                                          }}
                                                          placeholder="?댁꽌 ?ъ쑀"
                                                          className="w-full text-[11px] px-2 py-1.5 rounded-md border border-[var(--border-default)] bg-white dark:bg-gray-900 outline-none"
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

                                        {/* ?섏떊?댁쓬: ?ㅼ틪蹂?泥⑤? */}
                                        {item.noteType === '?섏떊' && (
                                          <div className="mt-2 pt-2 border-t border-dashed border-amber-200 dark:border-amber-800/40">
                                            <div className="flex items-center justify-between mb-1.5">
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] font-extrabold text-teal-600">?뱨 ?댁쓬 ?ㅼ틪蹂?/span>
                                                {(note.attachments || []).length > 0 && (
                                                  <span className="text-[9px] font-bold bg-teal-50 dark:bg-teal-900/20 text-teal-500 px-1.5 py-0.5 rounded">{(note.attachments || []).length}嫄?/span>
                                                )}
                                              </div>
                                              <label className="text-[10px] font-bold text-teal-500 hover:text-teal-700 cursor-pointer flex items-center gap-0.5 px-2 py-0.5 rounded-md hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors">
                                                <Plus size={10} /> ?뚯씪 泥⑤?
                                                <input type="file" accept="image/*,.pdf" multiple className="hidden" onChange={e => {
                                                  const files = Array.from(e.target.files || [])
                                                  if (files.length === 0) return
                                                  const existing = note.attachments || []
                                                  let processed = 0
                                                  const newAttachments: any[] = []
                                                  files.forEach(file => {
                                                    const reader = new FileReader()
                                                    reader.onload = () => {
                                                      newAttachments.push({
                                                        id: Date.now() + processed,
                                                        name: file.name,
                                                        size: file.size,
                                                        type: file.type,
                                                        data: reader.result as string,
                                                        uploadDate: getLocalDate()
                                                      })
                                                      processed++
                                                      if (processed === files.length) {
                                                        updateNote(item.id, note.id, 'attachments', [...existing, ...newAttachments])
                                                      }
                                                    }
                                                    reader.readAsDataURL(file)
                                                  })
                                                  e.target.value = ''
                                                }} />
                                              </label>
                                            </div>
                                            {(note.attachments || []).length === 0 ? (
                                              <div className="text-[10px] text-[var(--text-muted)] text-center py-2 rounded-md border border-dashed border-[var(--border-default)]">泥⑤????ㅼ틪蹂몄씠 ?놁뒿?덈떎</div>
                                            ) : (
                                              <div className="grid grid-cols-3 gap-2">
                                                {(note.attachments || []).map((att: any) => (
                                                  <div key={att.id} className="relative group rounded-lg border border-[var(--border-default)] overflow-hidden bg-white dark:bg-gray-900">
                                                    {att.type?.startsWith('image/') ? (
                                                      <img
                                                        src={att.data}
                                                        alt={att.name}
                                                        className="w-full h-20 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                                        onClick={() => window.open(att.data, '_blank')}
                                                      />
                                                    ) : (
                                                      <div
                                                        className="w-full h-20 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 transition-colors"
                                                        onClick={() => {
                                                          const link = document.createElement('a')
                                                          link.href = att.data
                                                          link.download = att.name
                                                          link.click()
                                                        }}
                                                      >
                                                        <span className="text-lg">?뱞</span>
                                                        <span className="text-[9px] text-[var(--text-muted)] mt-0.5">PDF</span>
                                                      </div>
                                                    )}
                                                    <div className="px-1.5 py-1 flex items-center justify-between">
                                                      <span className="text-[9px] text-[var(--text-secondary)] truncate flex-1" title={att.name}>{att.name}</span>
                                                      <button
                                                        onClick={() => {
                                                          const updated = (note.attachments || []).filter((a: any) => a.id !== att.id)
                                                          updateNote(item.id, note.id, 'attachments', updated)
                                                        }}
                                                        className="text-red-400 hover:text-red-600 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1"
                                                      >
                                                        <Trash2 size={10} />
                                                      </button>
                                                    </div>
                                                  </div>
                                                ))}
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
                          )}
                        </div>
                      )}

                      {/* ?곹뭹沅??곸꽭 */}
                      {activeCategory === '?곹뭹沅? && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={DETAIL_FIELD_LABEL}>湲덉븸 *</label>
                            <input value={item.voucherAmount ? item.voucherAmount.toLocaleString() : ''} onChange={e => { const num = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0; saveAll(allItems.map(i => i.id === item.id ? { ...i, voucherAmount: num } : i)) }} placeholder="50,000" className={DETAIL_INPUT} />
                          </div>
                          <div>
                            <label className={DETAIL_FIELD_LABEL}>?대떦??*</label>
                            <select value={item.voucherManager || ''} onChange={e => updateField(item.id, 'voucherManager', e.target.value)} className={DETAIL_INPUT}>
                              <option value="">?좏깮?섏꽭??/option>
                              {staffList.map((s: any) => (<option key={s.id || s.name} value={s.name}>{s.name}{s.role ? ` (${s.role})` : ''}{s.dept ? ` - ${s.dept}` : ''}</option>))}
                            </select>
                          </div>
                          <div><label className={DETAIL_FIELD_LABEL}>硫붾え</label><input value={item.memo || ''} onChange={e => updateField(item.id, 'memo', e.target.value)} placeholder="李멸퀬?ы빆" className={DETAIL_INPUT} /></div>
                        </div>
                      )}

                      {/* 移대뱶 愿由?(吏異쒖닔??怨꾩쥖留? */}
                      {direction === 'expense' && activeCategory === '怨꾩쥖' && (
                        <div className="mt-5 pt-4 border-t border-dashed border-blue-200 dark:border-blue-800">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-1.5">
                              <CreditCard size={14} className="text-blue-500" />
                              <span className="text-[12px] font-extrabold text-[var(--text-primary)]">?곌껐 移대뱶</span>
                              {(item.cards || []).length > 0 && <span className="text-[9px] font-bold bg-blue-100 dark:bg-blue-900/20 text-blue-600 px-1.5 py-0.5 rounded">{(item.cards || []).length}??/span>}
                            </div>
                            <button onClick={() => addCard(item.id)} className="text-[11px] font-bold text-blue-500 hover:text-blue-700 cursor-pointer flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><Plus size={12} /> 移대뱶 異붽?</button>
                          </div>
                          {(!item.cards || item.cards.length === 0) ? (
                            <div className="py-4 text-center text-[11px] text-[var(--text-muted)] rounded-lg border border-dashed border-[var(--border-default)] bg-white/50 dark:bg-gray-900/30">?깅줉??移대뱶媛 ?놁뒿?덈떎</div>
                          ) : (
                            <div className="space-y-2">
                              {item.cards.map((card, ci) => (
                                <div key={card.id} className="rounded-lg border border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/5 p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-blue-500">?뮩 移대뱶 {ci + 1}</span>
                                    <button onClick={() => deleteCard(item.id, card.id)} className="text-[10px] text-red-400 hover:text-red-600 cursor-pointer flex items-center gap-0.5"><Trash2 size={10} /> ??젣</button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div><label className={DETAIL_FIELD_LABEL}>移대뱶紐?*</label><input value={card.cardName} onChange={e => updateCard(item.id, card.id, 'cardName', e.target.value)} placeholder="踰뺤씤移대뱶1" className={DETAIL_INPUT} /></div>
                                    <div><label className={DETAIL_FIELD_LABEL}>移대뱶??*</label><input value={card.cardCompany} onChange={e => updateCard(item.id, card.id, 'cardCompany', e.target.value)} placeholder="援??移대뱶" className={DETAIL_INPUT} /></div>
                                    <div><label className={DETAIL_FIELD_LABEL}>移대뱶踰덊샇 *</label><input value={card.cardNumber} onChange={e => { const raw = e.target.value.replace(/[^0-9]/g, '').slice(0, 16); updateCard(item.id, card.id, 'cardNumber', raw.replace(/(.{4})/g, '$1-').replace(/-$/, '')) }} placeholder="1234-5678-9012-3456" className={DETAIL_INPUT} /></div>
                                    <div><label className={DETAIL_FIELD_LABEL}>移대뱶醫낅쪟 *</label><select value={card.cardType} onChange={e => updateCard(item.id, card.id, 'cardType', e.target.value)} className={DETAIL_INPUT}><option value="泥댄겕移대뱶">泥댄겕移대뱶</option><option value="?좎슜移대뱶">?좎슜移대뱶</option></select></div>
                                    <div>
                                      <label className={DETAIL_FIELD_LABEL}>?ъ슜??*</label>
                                      <select value={card.cardUser} onChange={e => updateCard(item.id, card.id, 'cardUser', e.target.value)} className={DETAIL_INPUT}>
                                        <option value="">?좏깮?섏꽭??/option>
                                        {staffList.map((s: any) => (<option key={s.id || s.name} value={s.name}>{s.name}{s.role ? ` (${s.role})` : ''}</option>))}
                                      </select>
                                    </div>
                                    <div><label className={DETAIL_FIELD_LABEL}>?좏슚湲곌컙</label><input value={card.expiryDate || ''} onChange={e => { const raw = e.target.value.replace(/[^0-9]/g, '').slice(0, 4); updateCard(item.id, card.id, 'expiryDate', raw.length > 2 ? `${raw.slice(0, 2)}/${raw.slice(2)}` : raw) }} placeholder="MM/YY" maxLength={5} className={DETAIL_INPUT} /></div>
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

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
   ?낆텧湲덈궡??(CashFlow List)
   ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??*/
function AcctCashflowList({ year }: { year: number }) {
  const [refresh, setRefresh] = useState(0)
  const currentUserName = useAuthStore.getState().user?.name || ''

  // ?? ?곗씠??濡쒕뱶 ??
  const cashflows: any[] = useMemo(() => getItem('acct_cashflows', []), [refresh])
  const approvals: any[] = useMemo(() => getItem('acct_approvals', []), [refresh])
  const budgetCats: any[] = useMemo(() => getItem('acct_budget_cats', []), [refresh])
  const staffList: any[] = useMemo(() => getItem('acct_staff', []), [refresh])

  // ?? ?꾪꽣 ?곹깭 ??
  const today = getLocalDate()
  const yearStart = `${year}-01-01`
  const yearEnd = `${year}-12-31`
  const [dateFrom, setDateFrom] = useState(yearStart)
  const [dateTo, setDateTo] = useState(yearEnd)
  const [filterCat, setFilterCat] = useState('')
  const [filterManager, setFilterManager] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [searchText, setSearchText] = useState('')
  const [cardFilter, setCardFilter] = useState<'' | 'receivable' | 'payable' | 'incomeScheduled' | 'expenseScheduled'>('')

  // ?? 湲곌컙 ?꾨━????
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

  // ?? ?대떦??紐⑸줉 ??
  const managers = useMemo(() => {
    const set = new Set<string>()
    cashflows.forEach(c => { if (c.manager) set.add(c.manager); if (c.createdBy) set.add(c.createdBy) })
    return Array.from(set).sort()
  }, [cashflows])

  // ?? ?꾪꽣 ?곸슜??紐⑸줉 ??
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

  // ?? 吏묎퀎 ??
  const stats = useMemo(() => {
    let totalIn = 0, totalOut = 0
    filtered.forEach(c => { if (c.type === 'income') totalIn += (c.amount || 0); else totalOut += (c.amount || 0) })
    // 誘몄닔湲? ?낃툑 ?꾪몴 以?receivable=true & !received
    const receivables = cashflows.filter(c => c.receivable && !c.received)
    const receivableAmt = receivables.reduce((s: number, c: any) => s + (c.amount || 0), 0)
    // 誘몄?湲됯툑: 異쒓툑 ?꾪몴 以?payable=true & !paid
    const payables = cashflows.filter(c => c.payable && !c.paid)
    const payableAmt = payables.reduce((s: number, c: any) => s + (c.amount || 0), 0)
    // ?낃툑?덉젙: ?뱀씤???낃툑 ?덉쓽(誘몄쿂由?
    const incomeScheduled = approvals.filter(a => a.status === 'approved' && a.type === 'income')
    const incomeSchedAmt = incomeScheduled.reduce((s: number, a: any) => s + (a.amount || 0), 0)
    // 異쒓툑?덉젙: ?뱀씤???덉쓽(誘몄쭛??
    const expenseScheduled = approvals.filter(a => a.status === 'approved' && !a.isGeneral)
    const expenseSchedAmt = expenseScheduled.reduce((s: number, a: any) => s + (a.amount || 0), 0)
    return { totalIn, totalOut, net: totalIn - totalOut, receivableAmt, receivableCount: receivables.length, payableAmt, payableCount: payables.length, incomeSchedAmt, incomeSchedCount: incomeScheduled.length, expenseSchedAmt, expenseSchedCount: expenseScheduled.length }
  }, [filtered, cashflows, approvals])

  // ?? ?꾩쟻?붿븸 怨꾩궛 ??
  const withBalance = useMemo(() => {
    let bal = 0
    // ??닚?대?濡?reverse?섏뿬 ?붿븸 怨꾩궛 ???ㅼ떆 ??닚
    const asc = [...filtered].reverse()
    const result = asc.map(c => {
      if (c.type === 'income') bal += (c.amount || 0); else bal -= (c.amount || 0)
      return { ...c, _balance: bal }
    })
    return result.reverse()
  }, [filtered])

  // ?? ?묒? ?ㅼ슫濡쒕뱶 ??
  const downloadCSV = () => {
    const header = '?좎쭨,援щ텇,?덉궛援щ텇,嫄곕옒泥??곸슂,?낃툑??異쒓툑???붿븸,?대떦??n'
    const rows = withBalance.map(c => {
      const catName = budgetCats.find((cat: any) => String(cat.id) === String(c.budgetCatId))?.name || ''
      return `${c.date||c.writeDate||''},${c.type==='income'?'?낃툑':'異쒓툑'},${catName},${c.counter||''},${(c.description||'').replace(/,/g,' ')},${c.type==='income'?(c.amount||0):''},${c.type==='expense'?(c.amount||0):''},${c._balance},${c.manager||c.createdBy||''}`
    }).join('\n')
    const bom = '\uFEFF'
    const blob = new Blob([bom + header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `?낆텧湲덈궡??${dateFrom}_${dateTo}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const cardStyle = (color: string, bg: string, active?: boolean) => `rounded-xl border ${active ? 'border-2 border-primary-500 ring-2 ring-primary-200 dark:ring-primary-800 shadow-lg' : 'border-[var(--border-default)]'} p-3.5 bg-gradient-to-br ${bg} transition-all hover:shadow-md`

  // ?? 移대뱶 ?꾪꽣 ?곸슜 由ъ뒪??(誘몄닔/誘몄?湲??덉젙) ??
  const cardFilteredList = useMemo(() => {
    if (cardFilter === 'receivable') return cashflows.filter(c => c.receivable && !c.received).map(c => ({ ...c, _cardType: '誘몄닔湲? }))
    if (cardFilter === 'payable') return cashflows.filter(c => c.payable && !c.paid).map(c => ({ ...c, _cardType: '誘몄?湲됯툑' }))
    if (cardFilter === 'incomeScheduled') return approvals.filter(a => a.status === 'approved' && a.type === 'income').map(a => ({ id: a.id, date: a.date || a.createdAt || '', type: 'income', amount: a.amount || 0, counter: a.applicant || '', description: a.title || '', manager: a.applicant || '', _cardType: '?낃툑?덉젙', _isApproval: true }))
    if (cardFilter === 'expenseScheduled') return approvals.filter(a => a.status === 'approved' && !a.isGeneral).map(a => ({ id: a.id, date: a.date || a.createdAt || '', type: 'expense', amount: a.amount || 0, counter: a.applicant || '', description: a.title || '', manager: a.applicant || '', budgetCatId: a.budgetCatId, _cardType: '異쒓툑?덉젙', _isApproval: true }))
    return []
  }, [cardFilter, cashflows, approvals])

  // ?? ?섍툑/吏湲??꾨즺 泥섎━ ??
  const handleSettlement = (cfId: any, settleType: 'received' | 'paid') => {
    const cfs = getItem('acct_cashflows', []) as any[]
    const idx = cfs.findIndex((c: any) => c.id === cfId)
    if (idx >= 0) {
      if (settleType === 'received') { cfs[idx].received = true; cfs[idx].receivedAt = getLocalISOString() }
      else { cfs[idx].paid = true; cfs[idx].paidAt = getLocalISOString() }
      setItem('acct_cashflows', cfs)
      setRefresh(r => r + 1)
      useToastStore.getState().addToast({ type: 'success', message: settleType === 'received' ? '???섍툑 ?꾨즺 泥섎━?섏뿀?듬땲?? : '??吏湲??꾨즺 泥섎━?섏뿀?듬땲?? })
    }
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* ?? ??댄? ?? */}
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-extrabold text-[var(--text-primary)] flex items-center gap-2">
          <ArrowLeftRight size={18} className="text-primary-500" />
          ?낆텧湲덈궡??
        </h2>
        <button onClick={downloadCSV} className="px-2.5 py-1.5 rounded-lg bg-[#22c55e] text-white text-[10px] sm:text-[11px] font-bold hover:bg-[#16a34a] cursor-pointer flex items-center gap-1 shadow-sm">
          <Download size={12} /> CSV
        </button>
      </div>

      {/* ?? 8媛???쒕낫??移대뱶 ?? */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {/* 1?? ?ㅼ쟻 */}
        <div className={cardStyle('#22c55e', 'from-emerald-50/80 to-emerald-100/40 dark:from-emerald-900/20 dark:to-emerald-800/10')}>
          <div className="text-[9px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mb-0.5 sm:mb-1">?뮫 珥??낃툑</div>
          <div className="text-[14px] sm:text-[18px] font-extrabold text-emerald-700 dark:text-emerald-300">??stats.totalIn.toLocaleString()}</div>
          <div className="text-[9px] sm:text-[10px] text-transparent mt-0.5 select-none">-</div>
        </div>
        <div className={cardStyle('#ef4444', 'from-red-50/80 to-red-100/40 dark:from-red-900/20 dark:to-red-800/10')}>
          <div className="text-[9px] sm:text-[10px] font-bold text-red-500 dark:text-red-400 mb-0.5 sm:mb-1">?뮯 珥?異쒓툑</div>
          <div className="text-[14px] sm:text-[18px] font-extrabold text-red-600 dark:text-red-300">??stats.totalOut.toLocaleString()}</div>
          <div className="text-[9px] sm:text-[10px] text-transparent mt-0.5 select-none">-</div>
        </div>
        <div className={cardStyle('#3b82f6', 'from-blue-50/80 to-blue-100/40 dark:from-blue-900/20 dark:to-blue-800/10')}>
          <div className="text-[9px] sm:text-[10px] font-bold text-blue-500 dark:text-blue-400 mb-0.5 sm:mb-1">?뱢 ??利앷컧</div>
          <div className={`text-[14px] sm:text-[18px] font-extrabold ${stats.net >= 0 ? 'text-blue-600 dark:text-blue-300' : 'text-red-600 dark:text-red-300'}`}>
            {stats.net >= 0 ? '+' : ''}??stats.net.toLocaleString()}
          </div>
          <div className="text-[9px] sm:text-[10px] text-transparent mt-0.5 select-none">-</div>
        </div>
        <div className={cardStyle('#1e293b', 'from-slate-50/80 to-slate-100/40 dark:from-slate-800/30 dark:to-slate-700/20')}>
          <div className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1">?룱 ?꾩옱 ?붿븸</div>
          <div className="text-[14px] sm:text-[18px] font-extrabold text-slate-700 dark:text-slate-200">??stats.net.toLocaleString()}</div>
          <div className="text-[9px] sm:text-[10px] text-transparent mt-0.5 select-none">-</div>
        </div>
        {/* 2?? 誘몄닔쨌誘몄?湲됀룹삁??(?대┃ 媛?? */}
        <div onClick={() => setCardFilter(cardFilter === 'receivable' ? '' : 'receivable')} className={cardStyle('#f97316', 'from-orange-50/80 to-orange-100/40 dark:from-orange-900/20 dark:to-orange-800/10', cardFilter === 'receivable') + ' cursor-pointer'}>
          <div className="text-[9px] sm:text-[10px] font-bold text-orange-500 dark:text-orange-400 mb-0.5 sm:mb-1">?뱿 誘몄닔湲?/div>
          <div className="text-[14px] sm:text-[18px] font-extrabold text-orange-600 dark:text-orange-300">??stats.receivableAmt.toLocaleString()}</div>
          <div className="text-[9px] sm:text-[10px] text-orange-400 mt-0.5">{stats.receivableCount}嫄?{cardFilter === 'receivable' && <span className="ml-1 text-primary-500">??蹂닿린 以?/span>}</div>
        </div>
        <div onClick={() => setCardFilter(cardFilter === 'payable' ? '' : 'payable')} className={cardStyle('#8b5cf6', 'from-violet-50/80 to-violet-100/40 dark:from-violet-900/20 dark:to-violet-800/10', cardFilter === 'payable') + ' cursor-pointer'}>
          <div className="text-[9px] sm:text-[10px] font-bold text-violet-500 dark:text-violet-400 mb-0.5 sm:mb-1">?뱾 誘몄?湲됯툑</div>
          <div className="text-[14px] sm:text-[18px] font-extrabold text-violet-600 dark:text-violet-300">??stats.payableAmt.toLocaleString()}</div>
          <div className="text-[9px] sm:text-[10px] text-violet-400 mt-0.5">{stats.payableCount}嫄?{cardFilter === 'payable' && <span className="ml-1 text-primary-500">??蹂닿린 以?/span>}</div>
        </div>
        <div onClick={() => setCardFilter(cardFilter === 'incomeScheduled' ? '' : 'incomeScheduled')} className={cardStyle('#10b981', 'from-teal-50/80 to-teal-100/40 dark:from-teal-900/20 dark:to-teal-800/10', cardFilter === 'incomeScheduled') + ' cursor-pointer'}>
          <div className="text-[9px] sm:text-[10px] font-bold text-teal-500 dark:text-teal-400 mb-0.5 sm:mb-1">?뵜 ?낃툑 ?덉젙</div>
          <div className="text-[14px] sm:text-[18px] font-extrabold text-teal-600 dark:text-teal-300">??stats.incomeSchedAmt.toLocaleString()}</div>
          <div className="text-[9px] sm:text-[10px] text-teal-400 mt-0.5">{stats.incomeSchedCount}嫄?{cardFilter === 'incomeScheduled' && <span className="ml-1 text-primary-500">??蹂닿린 以?/span>}</div>
        </div>
        <div onClick={() => setCardFilter(cardFilter === 'expenseScheduled' ? '' : 'expenseScheduled')} className={cardStyle('#f43f5e', 'from-rose-50/80 to-rose-100/40 dark:from-rose-900/20 dark:to-rose-800/10', cardFilter === 'expenseScheduled') + ' cursor-pointer'}>
          <div className="text-[9px] sm:text-[10px] font-bold text-rose-500 dark:text-rose-400 mb-0.5 sm:mb-1">?뵜 異쒓툑 ?덉젙</div>
          <div className="text-[14px] sm:text-[18px] font-extrabold text-rose-600 dark:text-rose-300">??stats.expenseSchedAmt.toLocaleString()}</div>
          <div className="text-[9px] sm:text-[10px] text-rose-400 mt-0.5">{stats.expenseSchedCount}嫄?{cardFilter === 'expenseScheduled' && <span className="ml-1 text-primary-500">??蹂닿린 以?/span>}</div>
        </div>
      </div>

      {/* ?? ?꾪꽣 諛??? */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-2.5 sm:p-3 space-y-2">
        {/* ?곗뒪?ы넲: 湲곌컙+?꾪꽣 ?듯빀 grid (??怨듭쑀) */}
        <div className="hidden sm:grid sm:grid-cols-[50px_1fr_auto_1fr_auto] items-center gap-x-2 gap-y-2">
          {/* 1?? 湲곌컙 */}
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-muted)]">
            <Calendar size={13} /> 湲곌컙
          </div>
          <DatePicker value={dateFrom} onChange={v => setDateFrom(v)} />
          <span className="text-[11px] text-[var(--text-muted)] text-center">~</span>
          <DatePicker value={dateTo} onChange={v => setDateTo(v)} />
          <div className="flex gap-1 items-center">
            {[{label:'?ㅻ뒛',key:'today'},{label:'?대쾲二?,key:'week'},{label:'?대쾲??,key:'month'},{label:'遺꾧린',key:'quarter'},{label:'?곌컙',key:'year'}].map(p => (
              <button key={p.key} onClick={() => setPreset(p.key)} className="px-2.5 py-2 rounded-lg text-[11px] font-bold border border-[var(--border-default)] text-[var(--text-muted)] hover:bg-primary-50 hover:text-primary-600 hover:border-primary-300 transition-all cursor-pointer whitespace-nowrap">{p.label}</button>
            ))}
          </div>
          {/* 2?? ?꾪꽣 */}
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-muted)]">
            <Filter size={13} /> ?꾪꽣
          </div>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)]">
            <option value="">?꾩껜 ?덉궛</option>
            {budgetCats.filter((c: any) => { const pf = c.periodFrom || ''; const pt = c.periodTo || ''; if (pf && pt) return pf <= `${year}-12-31` && pt >= `${year}-01-01`; return true }).map((c: any) => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
          </select>
          <span className="text-[var(--border-default)] text-center text-[11px]">|</span>
          <select value={filterManager} onChange={e => setFilterManager(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)]">
            <option value="">?꾩껜 ?대떦??/option>
            {managers.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-[var(--border-default)] overflow-hidden">
              {[{label:'?꾩껜',val:'all'},{label:'?낃툑',val:'income'},{label:'異쒓툑',val:'expense'}].map(t => (
                <button key={t.val} onClick={() => setFilterType(t.val as any)} className={cn('px-3 py-2.5 text-[11px] font-bold cursor-pointer transition-all', filterType === t.val ? 'bg-primary-500 text-white' : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-primary-50')}>{t.label}</button>
              ))}
            </div>
            <div className="relative flex-1 min-w-[150px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="嫄곕옒泥샕룹쟻?붋룰툑??寃?? className="w-full pl-8 pr-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500" />
            </div>
          </div>
        </div>
        {/* 紐⑤컮?? 湲곌컙 */}
        <div className="flex items-center gap-2 flex-wrap sm:hidden">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-muted)] shrink-0">
            <Calendar size={13} /> 湲곌컙
          </div>
          <DatePicker value={dateFrom} onChange={v => setDateFrom(v)} className="w-auto shrink-0" />
          <span className="text-[11px] text-[var(--text-muted)]">~</span>
          <DatePicker value={dateTo} onChange={v => setDateTo(v)} className="w-auto shrink-0" />
          {[{label:'?ㅻ뒛',key:'today'},{label:'?대쾲二?,key:'week'},{label:'?대쾲??,key:'month'},{label:'遺꾧린',key:'quarter'},{label:'?곌컙',key:'year'}].map(p => (
            <button key={p.key} onClick={() => setPreset(p.key)} className="px-1.5 py-1 rounded-full text-[9px] font-bold border border-[var(--border-default)] text-[var(--text-muted)] hover:bg-primary-50 hover:text-primary-600 cursor-pointer whitespace-nowrap shrink-0">{p.label}</button>
          ))}
        </div>
        {/* 紐⑤컮?? ?꾪꽣 */}
        <div className="flex items-center gap-2 flex-wrap sm:hidden">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-muted)] shrink-0">
            <Filter size={13} /> ?꾪꽣
          </div>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] max-w-[140px]">
            <option value="">?꾩껜 ?덉궛</option>
            {budgetCats.filter((c: any) => { const pf = c.periodFrom || ''; const pt = c.periodTo || ''; if (pf && pt) return pf <= `${year}-12-31` && pt >= `${year}-01-01`; return true }).map((c: any) => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
          </select>
          <select value={filterManager} onChange={e => setFilterManager(e.target.value)} className="px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] max-w-[120px]">
            <option value="">?꾩껜 ?대떦??/option>
            {managers.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <div className="flex rounded-lg border border-[var(--border-default)] overflow-hidden">
            {[{label:'?꾩껜',val:'all'},{label:'?낃툑',val:'income'},{label:'異쒓툑',val:'expense'}].map(t => (
              <button key={t.val} onClick={() => setFilterType(t.val as any)} className={cn('px-3 py-2.5 text-sm font-bold cursor-pointer transition-all', filterType === t.val ? 'bg-primary-500 text-white' : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-primary-50')}>{t.label}</button>
            ))}
          </div>
          <div className="flex-1 min-w-[120px]">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="嫄곕옒泥샕룹쟻?붋룰툑??寃?? className="w-full pl-8 pr-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-primary-500" />
            </div>
          </div>
        </div>
      </div>

      {/* ?? 嫄댁닔 ?? */}
      {cardFilter ? (
        <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
          <span className="text-[var(--text-muted)]">
            <span className="font-bold text-primary-600">{cardFilter === 'receivable' ? '?뱿 誘몄닔湲? : cardFilter === 'payable' ? '?뱾 誘몄?湲됯툑' : cardFilter === 'incomeScheduled' ? '?뵜 ?낃툑?덉젙' : '?뵜 異쒓툑?덉젙'}</span>
            {' '}<span className="font-bold text-[var(--text-primary)]">{cardFilteredList.length}</span>嫄?
          </span>
          <button onClick={() => setCardFilter('')} className="px-2 py-0.5 rounded-full bg-[var(--bg-muted)] text-[9px] sm:text-[10px] font-bold text-[var(--text-muted)] hover:bg-primary-100 hover:text-primary-600 cursor-pointer transition-all">???꾩껜蹂닿린</button>
        </div>
      ) : (
        <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
          <span className="text-[var(--text-muted)]">珥?<span className="font-bold text-[var(--text-primary)]">{filtered.length}</span>嫄?/span>
          <span className="text-[var(--text-muted)]">
            ?낃툑 <span className="font-bold text-emerald-600">??stats.totalIn.toLocaleString()}</span>
            {' 쨌 '}異쒓툑 <span className="font-bold text-red-500">??stats.totalOut.toLocaleString()}</span>
          </span>
        </div>
      )}

      {/* ?? ?곗뒪?ы넲 ?뚯씠釉?(sm ?댁긽) ?? */}
      <div className="hidden sm:block bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] table-fixed">
            <thead>
              <tr className="bg-[var(--bg-muted)] text-[var(--text-muted)] font-bold border-b border-[var(--border-default)]">
                <th className="px-3 py-2 text-left whitespace-nowrap w-[100px]">?좎쭨</th>
                <th className="px-2 py-2 text-center whitespace-nowrap w-[52px]">援щ텇</th>
                <th className="px-3 py-2 text-left whitespace-nowrap w-[90px]">?덉궛援щ텇</th>
                <th className="px-3 py-2 text-left whitespace-nowrap w-[120px]">嫄곕옒泥?/th>
                <th className="px-3 py-2 text-left whitespace-nowrap">?곸슂</th>
                <th className="px-3 py-2 text-right whitespace-nowrap w-[110px]">湲덉븸</th>
                <th className="px-3 py-2 text-right whitespace-nowrap w-[110px]">?붿븸</th>
                <th className="px-3 py-2 text-left whitespace-nowrap w-[70px]">?대떦??/th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const displayList = cardFilter ? cardFilteredList : withBalance
                if (displayList.length === 0) return (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-[var(--text-muted)]">
                    <div className="flex flex-col items-center gap-2">
                      <ArrowLeftRight size={32} className="text-[var(--border-default)]" />
                      <span>{cardFilter ? '?대떦 ??ぉ???놁뒿?덈떎' : '?대떦 湲곌컙???낆텧湲??댁뿭???놁뒿?덈떎'}</span>
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
                          {isIncome ? '?낃툑' : '異쒓툑'}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {catName && <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[9px] font-bold">{catName}</span>}
                      </td>
                      <td className="px-3 py-2 text-[var(--text-primary)] whitespace-nowrap max-w-[120px] truncate">{c.counter || '-'}</td>
                      <td className="px-3 py-2 text-[var(--text-secondary)] max-w-[180px] truncate" title={c.description || c.incomeNote || ''}>{c.description || c.incomeNote || '-'}</td>
                      <td className={`px-3 py-2 text-right font-bold whitespace-nowrap ${isIncome ? 'text-emerald-600' : 'text-red-500'}`}>??(c.amount||0).toLocaleString()}</td>
                      <td className={`px-3 py-2 text-right font-extrabold whitespace-nowrap ${!cardFilter ? ((c._balance||0) >= 0 ? 'text-[var(--text-primary)]' : 'text-red-500') : 'text-transparent select-none'}`}>
                        {!cardFilter ? `??{(c._balance||0).toLocaleString()}` : '-'}
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
                  <td colSpan={4} className="px-3 py-2 text-[var(--text-primary)]">?⑷퀎</td>
                  <td className="px-3 py-2 text-right text-emerald-600"></td>
                  <td className="px-3 py-2 text-right text-emerald-600">??stats.totalIn.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-[var(--text-primary)]">??stats.net.toLocaleString()}</td>
                  <td></td>
                </tr>
              )}
              {cardFilter && cardFilteredList.length > 0 && (
                <tr className="bg-[var(--bg-muted)] font-bold border-t-2 border-[var(--border-default)]">
                  <td colSpan={5} className="px-3 py-2 text-[var(--text-primary)]">?⑷퀎 ({cardFilteredList.length}嫄?</td>
                  <td className="px-3 py-2 text-right font-extrabold text-[var(--text-primary)]">??cardFilteredList.reduce((s: number, c: any) => s + (c.amount || 0), 0).toLocaleString()}</td>
                  <td></td>
                  <td></td>
                </tr>
              )}
            </tfoot>
          </table>
        </div>
      </div>

      {/* ?? 紐⑤컮??移대뱶 由ъ뒪??(sm 誘몃쭔) ?? */}
      <div className="block sm:hidden space-y-2">
        {(() => {
          const displayList = cardFilter ? cardFilteredList : withBalance
          if (displayList.length === 0) return (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-8 text-center text-[var(--text-muted)]">
              <div className="flex flex-col items-center gap-2">
                <ArrowLeftRight size={28} className="text-[var(--border-default)]" />
                <span className="text-[11px]">{cardFilter ? '?대떦 ??ぉ???놁뒿?덈떎' : '?대떦 湲곌컙???낆텧湲??댁뿭???놁뒿?덈떎'}</span>
              </div>
            </div>
          )
          return displayList.map((c: any, i: number) => {
            const catName = budgetCats.find((cat: any) => String(cat.id) === String(c.budgetCatId))?.name || ''
            const isIncome = c.type === 'income'
            return (
              <div key={c.id || i} className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-3 space-y-1.5">
                {/* 1以? ?좎쭨 + 援щ텇 + 湲덉븸 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-[var(--text-primary)]">{(c.date || c.writeDate || '').slice(0, 10)}</span>
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${isIncome ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {isIncome ? '?낃툑' : '異쒓툑'}
                    </span>
                    {cardFilter && c._cardType && (
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        c._cardType === '誘몄닔湲? ? 'bg-orange-100 text-orange-700' :
                        c._cardType === '誘몄?湲됯툑' ? 'bg-violet-100 text-violet-700' :
                        c._cardType === '?낃툑?덉젙' ? 'bg-teal-100 text-teal-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>{c._cardType}</span>
                    )}
                  </div>
                  <span className={`text-[13px] font-extrabold ${isIncome ? 'text-emerald-600' : 'text-red-500'}`}>??(c.amount||0).toLocaleString()}</span>
                </div>
                {/* 2以? 嫄곕옒泥?+ ?곸슂 */}
                <div className="flex items-center gap-2 text-[10px]">
                  {(c.counter || c.description || c.incomeNote) && (
                    <>
                      {c.counter && <span className="font-bold text-[var(--text-primary)]">{c.counter}</span>}
                      {(c.description || c.incomeNote) && <span className="text-[var(--text-muted)] truncate max-w-[200px]">{c.description || c.incomeNote}</span>}
                    </>
                  )}
                </div>
                {/* 3以? ?덉궛+?대떦???붿븸 */}
                <div className="flex items-center justify-between text-[9px]">
                  <div className="flex items-center gap-1.5">
                    {catName && <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold">{catName}</span>}
                    <span className="text-[var(--text-muted)]">{c.manager || c.createdBy || ''}</span>
                  </div>
                  {!cardFilter && <span className={`font-extrabold ${(c._balance||0) >= 0 ? 'text-[var(--text-secondary)]' : 'text-red-500'}`}>?붿븸 ??(c._balance||0).toLocaleString()}</span>}
                  {(cardFilter === 'receivable' || cardFilter === 'payable') && !c._isApproval && (
                    <button
                      onClick={() => handleSettlement(c.id, cardFilter === 'receivable' ? 'received' : 'paid')}
                      className={`px-2 py-1 rounded text-[9px] font-bold cursor-pointer ${
                        cardFilter === 'receivable' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {cardFilter === 'receivable' ? '???섍툑?꾨즺' : '??吏湲됱셿猷?}
                    </button>
                  )}
                </div>
              </div>
            )
          })
        })()}
        {/* 紐⑤컮???⑷퀎 */}
        {!cardFilter && withBalance.length > 0 && (
          <div className="bg-[var(--bg-muted)] border border-[var(--border-default)] rounded-xl p-3 flex items-center justify-between text-[10px] font-bold">
            <span className="text-[var(--text-primary)]">?⑷퀎</span>
            <div className="flex gap-3">
              <span className="text-emerald-600">?낃툑 ??stats.totalIn.toLocaleString()}</span>
              <span className="text-red-500">異쒓툑 ??stats.totalOut.toLocaleString()}</span>
            </div>
          </div>
        )}
        {cardFilter && cardFilteredList.length > 0 && (
          <div className="bg-[var(--bg-muted)] border border-[var(--border-default)] rounded-xl p-3 flex items-center justify-between text-[10px] font-bold">
            <span className="text-[var(--text-primary)]">?⑷퀎 ({cardFilteredList.length}嫄?</span>
            <span className="text-[var(--text-primary)]">??cardFilteredList.reduce((s: number, c: any) => s + (c.amount || 0), 0).toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  )
}


