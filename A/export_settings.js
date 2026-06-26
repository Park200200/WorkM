// 서버 설정 저장 스크립트
// 브라우저 콘솔에서 실행하여 현재 localStorage를 JSON으로 추출합니다

const SYNC_KEYS = [
  'acct_accounts', 'acct_budgets', 'acct_budget_cats', 'acct_budget_item_defs',
  'acct_pay_methods_v2', 'acct_income_methods', 'acct_payment_methods',
  'acct_cashflows', 'acct_vouchers', 'acct_approvals', 'acct_vendors',
  'acct_opening_balances', 'acct_hq_vendors', 'ws_users',
  'acct_itemName_history', 'acct_subItemName_history',
  'acct_desc_myRequest_pending', 'acct_desc_myRequest_preExpense',
  'acct_title_myRequest_pending', 'acct_title_myRequest_preExpense',
  'acct_title_myRequest_approved', 'acct_title_myApproval_approved',
];

const data = {};
for (const key of SYNC_KEYS) {
  const val = localStorage.getItem(key);
  if (val) {
    try { data[key] = JSON.parse(val); } catch { data[key] = val; }
  }
}

// 다운로드
const json = JSON.stringify(data, null, 2);
const blob = new Blob([json], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'settings.json';
a.click();
URL.revokeObjectURL(url);
console.log('✅ settings.json 다운로드 완료! docs/data/ 폴더에 넣으세요.');
