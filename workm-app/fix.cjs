const fs = require('fs');
const f = 'src/pages/admin/AccountingPage.tsx';
let c = fs.readFileSync(f, 'utf8');
let lines = c.split('\n');

// 4724~4726 (0-indexed 4723~4725) 제거
console.log('제거 대상:');
console.log(4724, ':', JSON.stringify(lines[4723]?.substring(0, 60)));
console.log(4725, ':', JSON.stringify(lines[4724]?.substring(0, 60)));
console.log(4726, ':', JSON.stringify(lines[4725]?.substring(0, 60)));

lines.splice(4723, 3);

// 이제 통합검색 div 닫히는 곳 찾기
for (let i = 5100; i < 5200; i++) {
  const line = lines[i]?.trimEnd();
  const next = lines[i+1]?.trim();
  if (line && line.endsWith('</div>') && next && next.startsWith('<div className="flex items-center gap-1.5 mb-1 flex-wrap"')) {
    // 이 다음줄 바로 앞에 <div> 추가
    console.log(`\n통합검색 div 끝: 라인 ${i+1}`);
    console.log(`예산항목 시작: 라인 ${i+2}`);
    lines.splice(i+1, 0, '            <div>');
    console.log(`<div> 삽입 완료`);
    break;
  }
}

fs.writeFileSync(f, lines.join('\n'), 'utf8');
console.log('\n완료:', lines.length, '라인');
