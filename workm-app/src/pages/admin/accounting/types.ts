/**
 * 회계 모듈 공통 타입 정의
 */

// ── 예산 관련 ──

export interface BudgetCatAccount {
  id: number
  bankName: string   // 예) 기업은행 10110-11001-12
  cards: string[]    // 연결 카드 목록
}

export interface BudgetCat {
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

export interface AccountPoolEntry {
  accountCode: string
  contraAccountCode?: string
}

export interface BudgetDetailDef {
  id: number
  name: string
  parentId: number
  aliases: string[]
  accountCode?: string
  sortOrder: number
}

export interface BudgetSubDef {
  id: number
  name: string
  parentId: number
  aliases: string[]
  accountCode?: string
  detailItems?: BudgetDetailDef[]
  sortOrder: number
}

export interface BudgetItemDef {
  id: number
  name: string
  aliases: string[]
  accountPool: AccountPoolEntry[]
  defaultAccountCode?: string
  subItems: BudgetSubDef[]
  sortOrder: number
}

export interface BudgetItem {
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

// ── 거래 관련 ──

export interface CashFlow {
  id: string | number
  type: 'income' | 'expense'
  amount: number
  date: string
  description?: string
  accountCode?: string
  manager?: string         // 담당자
  approvalStatus?: string  // 품의상태: 품의준비, 품의완료 등
}

export interface Approval {
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

export interface Voucher {
  id: string | number
  type?: string
  date?: string
  description?: string
  createdAt?: string
  entries?: Array<{ side: string; amount: number; accountCode?: string; account?: string }>
}

// ── 거래처 ──

export interface Vendor {
  companyName: string
  bizNo: string
  ceoName: string
  ceoPhone: string
  address1: string
  address2: string
  zipCode: string
  bizType: string
  bizCategory: string
  bizPhone: string
  taxEmail: string
  companyPhoto: string
  managerName: string
  managerTitle: string
  managerPhone: string
  managerEmail: string
  managerId: string
  managerPw: string
  managerPhoto: string
  memo?: string
}

export interface HQV {
  id: number
  companyName: string
  [key: string]: any
}

// ── 결제수단 ──

export interface PayMethodCard {
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

export interface PayMethodNote {
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

export interface PayMethodItem {
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
  initialBalance?: number  // 기초잔액
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
