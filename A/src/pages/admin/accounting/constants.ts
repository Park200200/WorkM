// 회계 모듈 공유 상수/타입/함수
// 여러 파일에서 공통으로 사용하는 코드를 중앙 관리

export interface AcctAccount {
  code: string; name: string; type: string; group: string; side: 'debit' | 'credit';
  source?: 'system' | 'user'; contraAccounts?: string[];
  active?: boolean;
  description?: string;
  incomeEnabled?: boolean;
}

export const ACCT_TYPES = [
  { value: 'asset', label: '자산', color: '#4f6ef7' },
  { value: 'liability', label: '부채', color: '#ef4444' },
  { value: 'equity', label: '자본', color: '#8b5cf6' },
  { value: 'revenue', label: '수익', color: '#22c55e' },
  { value: 'expense', label: '비용', color: '#f59e0b' },
]

export const DEBIT_TYPES = ['asset', 'expense']

export const CONTRA_CREDIT_CODES = new Set([
  '1-01-08','1-02-03','1-02-05','1-02-07','1-02-09','1-02-11','1-02-13',
])

export const CONTRA_DEBIT_CODES = new Set(['4-01-04'])

export const getDebitCredit = (type: string, code?: string, sideOverride?: string) => {
  if (sideOverride === 'debit') return { label: '차변', color: '#4f6ef7' }
  if (sideOverride === 'credit') return { label: '대변', color: '#ef4444' }
  if (code && CONTRA_CREDIT_CODES.has(code)) return { label: '대변', color: '#ef4444' }
  if (code && CONTRA_DEBIT_CODES.has(code)) return { label: '차변', color: '#4f6ef7' }
  return DEBIT_TYPES.includes(type) ? { label: '차변', color: '#4f6ef7' } : { label: '대변', color: '#ef4444' }
}

export const SYSTEM_CODES = new Set([
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
