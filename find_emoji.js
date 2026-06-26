const fs = require('fs');
const path = require('path');

const files = [
    'workm-app/src/components/homepage/HpBasicSettings.tsx',
    'workm-app/src/pages/admin/accounting/AcctAccountsMgmt.tsx',
    'workm-app/src/components/homepage/HpBoardMgmt.tsx',
    'workm-app/src/pages/admin/accounting/AcctApproval.tsx',
    'workm-app/src/pages/admin/accounting/AcctBudget.tsx',
    'workm-app/src/pages/admin/HQInfoPage.tsx',
    'workm-app/src/pages/admin/accounting/AcctPayMethods.tsx',
    'workm-app/src/components/accounting/PrintApprovalForm.tsx',
    'workm-app/src/components/homepage/HomepageView.tsx',
    'workm-app/src/pages/admin/accounting/AcctPrintSettings.tsx',
    'workm-app/src/pages/admin/accounting/AcctClosing.tsx'
];

// Emoji regex that matches common emoji ranges
const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{27BF}]|[\u{2B05}-\u{2B07}\u{FE0F}]|[\u{2795}-\u{2797}]|[\u{274C}\u{2705}\u{26A1}\u{2699}\u{270F}\u{FE0F}]/gu;

for (const f of files) {
    const fullPath = path.resolve(f);
    if (!fs.existsSync(fullPath)) {
        console.log(`FILE NOT FOUND: ${f}`);
        continue;
    }
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');
    let found = false;
    for (let i = 0; i < lines.length; i++) {
        const matches = lines[i].match(emojiRegex);
        if (matches) {
            if (!found) {
                console.log(`\n=== ${f} ===`);
                found = true;
            }
            console.log(`  L${i+1}: [${matches.join(',')}] ${lines[i].trim().substring(0, 150)}`);
        }
    }
    if (!found) {
        console.log(`\n=== ${f} === (NO EMOJIS FOUND)`);
    }
}
