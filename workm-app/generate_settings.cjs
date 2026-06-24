// restore_data.js에서 settings.json 생성
const fs = require('fs');
const path = require('path');

// restore_data.js 읽기
const script = fs.readFileSync(path.join(__dirname, 'restore_data.js'), 'utf8');

// localStorage.setItem 호출 추출
const data = {};
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

// regex로 localStorage.setItem('key', "value") 추출
const regex = /localStorage\.setItem\('([^']+)',\s*"(.+?)"\);$/gm;
let match;
while ((match = regex.exec(script)) !== null) {
  const key = match[1];
  let val = match[2];
  // escape된 큰따옴표 복원
  val = val.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  if (SYNC_KEYS.includes(key)) {
    try {
      data[key] = JSON.parse(val);
    } catch {
      data[key] = val;
    }
  }
}

// settings.json 저장
const outPath = path.join(__dirname, '..', 'docs', 'data', 'settings.json');
const outDir = path.dirname(outPath);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(data, null, 2));

console.log(`✅ settings.json 생성 완료! (${Object.keys(data).length}개 키)`);
console.log('키 목록:', Object.keys(data).join(', '));
