// ============================================================
//  WorkM - 공용 데이터 & 상태 관리
// ============================================================

const WS = {
  // 현재 로그인 사용자
  currentUser: null,

  // 본사 정보
  hqInfo: JSON.parse(localStorage.getItem('ws_hq_info')) || {
    name: 'WorkM 본사',
    ceo: '김지훈',
    businessNum: '123-45-67890',
    phone: '02-1234-5678',
    email: 'contact@workm.kr',
    address: '서울시 강남구 테헤란로 123, 워크엠빌딩 15층',
    logoText: 'WorkM'
  },

  // 부서 목록
  departments: JSON.parse(localStorage.getItem('ws_departments')) || [
    { id: 1, name: '개발팀' },
    { id: 2, name: '마케팅팀' },
    { id: 3, name: '디자인팀' },
    { id: 4, name: '영업팀' },
    { id: 5, name: '경영지원팀' }
  ],

  // 직급 목록
  ranks: JSON.parse(localStorage.getItem('ws_ranks')) || [
    { id: 1, name: '인턴', level: 1 },
    { id: 2, name: '사원', level: 2 },
    { id: 3, name: '주임', level: 3 },
    { id: 4, name: '대리', level: 4 },
    { id: 5, name: '과장', level: 5 },
    { id: 6, name: '차장', level: 6 },
    { id: 7, name: '팀장', level: 7 },
    { id: 8, name: '부장', level: 8 },
    { id: 9, name: '이사', level: 9 },
    { id: 10, name: '대표', level: 10 },
  ],

  // 직책 목록
  positions: JSON.parse(localStorage.getItem('ws_positions')) || [
    { id: 1, name: '팀원' },
    { id: 2, name: '팀장' },
    { id: 3, name: '프로젝트매니저' },
    { id: 4, name: '선임' },
    { id: 5, name: '수석' },
    { id: 6, name: 'CEO' },
  ],

  // 업무결과 목록
  taskResults: JSON.parse(localStorage.getItem('ws_task_results')) || [
    { id:1, name:'정상완료', icon:'✅' },
    { id:2, name:'진행중',   icon:'🔄' },
    { id:3, name:'부분완료', icon:'🔶' },
    { id:4, name:'보류',     icon:'⏸' },
    { id:5, name:'취소',     icon:'❌' },
  ],
  saveTaskResults() { localStorage.setItem('ws_task_results', JSON.stringify(this.taskResults)); },
  addTaskResult(name, icon = '') {
    const id = (Math.max(0, ...this.taskResults.map(r => r.id)) + 1);
    this.taskResults.push({ id, name: name.trim(), icon });
    this.saveTaskResults();
    return id;
  },
  updateTaskResult(id, name, icon) {
    const item = this.taskResults.find(r => r.id === id);
    if(item) { item.name = name.trim(); if(icon !== undefined) item.icon = icon; this.saveTaskResults(); }
  },
  deleteTaskResult(id) {
    this.taskResults = this.taskResults.filter(r => r.id !== id);
    this.saveTaskResults();
  },

  // 진행보고 유형 목록
  reportTypes: JSON.parse(localStorage.getItem('ws_report_types')) || [
    { id:1, label:'업무시작',  icon:'play-circle',    color:'#4f6ef7' },
    { id:2, label:'시장조사',  icon:'search',         color:'#06b6d4' },
    { id:3, label:'작업중',    icon:'wrench',         color:'#9747ff' },
    { id:4, label:'작업완료',  icon:'check-circle',   color:'#22c55e' },
    { id:5, label:'협의완료',  icon:'message-circle', color:'#f59e0b' },
    { id:6, label:'이슈발생',  icon:'alert-triangle', color:'#ef4444' },
    { id:7, label:'업무취소',  icon:'x-circle',       color:'#6b7280' },
    { id:8, label:'보고서작성',icon:'file-text',      color:'#8b5cf6' },
  ],
  saveReportTypes() { localStorage.setItem('ws_report_types', JSON.stringify(this.reportTypes)); },

  // 상세업무 목록
  detailTasks: JSON.parse(localStorage.getItem('ws_detail_tasks')) || [],
  saveDetailTasks() { localStorage.setItem('ws_detail_tasks', JSON.stringify(this.detailTasks)); },
  addDetailTask(name) {
    const id = Date.now();
    this.detailTasks.push({ id, name: name.trim() });
    this.saveDetailTasks();
    return id;
  },
  deleteDetailTask(id) {
    this.detailTasks = this.detailTasks.filter(d => d.id !== id);
    this.saveDetailTasks();
  },
  updateDetailTask(id, name) {
    const item = this.detailTasks.find(d => d.id === id);
    if (item) { item.name = name.trim(); this.saveDetailTasks(); }
  },

  // 사용자 목록
  users: JSON.parse(localStorage.getItem('ws_users')) || [
    { id:1, name:'김지훈', role:'팀장', dept:'개발팀', avatar:'KJ', color:'#4f6ef7',
      email:'kim@workm.kr', phone:'010-1234-5678', birthday:'1985-05-12',
      hiredAt:'2020-01-01', resignedAt:null, address:'서울시 강남구 테헤란로 123',
      loginId:'admin', password:'1234', status:'재직(재택)', note:'앱 개발 관리자', photo:'' },
    { id:2, name:'이수진', role:'선임', dept:'개발팀', avatar:'LS', color:'#9747ff',
      email:'lee@workm.kr', phone:'010-2345-6789', birthday:'1990-08-22',
      hiredAt:'2021-03-15', resignedAt:null, address:'경기도 성남시 분당구 판교로 456',
      loginId:'lee01', password:'1234', status:'재직', note:'Frontend 개발팀 리드', photo:'' },
    { id:3, name:'박민수', role:'대리', dept:'마케팅팀', avatar:'PM', color:'#06b6d4',
      email:'park@workm.kr', phone:'010-3456-7890', birthday:'1992-11-05',
      hiredAt:'2022-07-01', resignedAt:null, address:'서울시 마포구 월드컵로 789',
      loginId:'park02', password:'1234', status:'재직(출장)', note:'일정 관리 및 마케팅 담당', photo:'' },
    { id:4, name:'최유리', role:'주임', dept:'디자인팀', avatar:'CY', color:'#f59e0b',
      email:'choi@workm.kr', phone:'010-4567-8901', birthday:'1991-02-14',
      hiredAt:'2021-11-10', resignedAt:null, address:'서울시 서초구 서초대로 321',
      loginId:'choi03', password:'1234', status:'재직(외근)', note:'UI/UX 디자인 전담', photo:'' },
    { id:5, name:'정현수', role:'팀장', dept:'마케팅팀', avatar:'JH', color:'#22c55e',
      email:'jung@workm.kr', phone:'010-5678-9012', birthday:'1986-09-30',
      hiredAt:'2020-05-20', resignedAt:null, address:'인천시 연수구 컨벤시아대로 654',
      loginId:'jung04', password:'1234', status:'휴직', note:'육아휴직 중 (복직 예정)', photo:'' },
    { id:6, name:'한소희', role:'선임', dept:'영업팀', avatar:'HS', color:'#ef4444',
      email:'han@workm.kr', phone:'010-6789-0123', birthday:'1989-12-25',
      hiredAt:'2021-06-01', resignedAt:null, address:'서울시 강남구 학동로 987',
      loginId:'han05', password:'1234', status:'재직', note:'영업 실적 담당', photo:'' },
  ],

  // 샘플 업무 데이터
  tasks: JSON.parse(localStorage.getItem('ws_tasks')) || [
    {
      id:1, title:'메인 대시보드 UI 개발',
      desc:'메인 대시보드 페이지를 React로 개발하고 다양한 화면 크기 적용 필요.',
      assignerId:1, assigneeIds:[2],
      status:'progress', priority:'high',
      progress:65, dueDate:'2026-03-28',
      createdAt:'2026-03-10', startedAt:'2026-03-11',
      isImportant:true, team:'개발팀',
      score:15, spentTime:'12h', reportContent:'React 컴포넌트 완성 및 API 연동 완료', hasAttachment:true,
      parentId:null,
      history:[
        { date:'2026-03-10', event:'업무 등록', detail:'김지훈 → 이수진', icon:'clipboard-list', color:'#4f6ef7' },
        { date:'2026-03-11', event:'업무 시작', detail:'진행중 상태로 변경', icon:'play-circle', color:'#06b6d4' },
        { date:'2026-03-22', event:'진행율 65%', detail:'API 연동 작업 진행 중', icon:'wrench', color:'#9747ff' },
      ]
    },
    {
      id:2, title:'Q1 마케팅 기획서 작성',
      desc:'2026년 1분기 SNS 캠페인 기획서 작성 및 예산 책정.',
      assignerId:5, assigneeIds:[5],
      status:'delay', priority:'high',
      progress:30, dueDate:'2026-03-24',
      createdAt:'2026-03-05', startedAt:'2026-03-06',
      isImportant:true, team:'마케팅팀',
      score:10, spentTime:'8h', reportContent:'1분기 SNS 타겟 분석 및 예산안 기본 작성', hasAttachment:false,
      parentId:null,
      history:[
        { date:'2026-03-05', event:'업무 등록', detail:'정현수 → 정현수', icon:'clipboard-list', color:'#4f6ef7' },
        { date:'2026-03-20', event:'진행율 30%', detail:'기본 자료 수집 완료', icon:'file-text', color:'#f59e0b' },
      ]
    },
    {
      id:3, title:'보안 API 성능 최적화',
      desc:'응답시도 50% 개선 목표. 캐시 레이어 도입 및 쿼리 최적화.',
      assignerId:1, assigneeIds:[3],
      status:'progress', priority:'medium',
      progress:80, dueDate:'2026-03-30',
      createdAt:'2026-03-12', startedAt:'2026-03-13',
      isImportant:false, team:'개발팀',
      score:20, spentTime:'15h', reportContent:'DB 인덱스 최적화 및 캐시 레이어 적용 완료', hasAttachment:true,
      parentId:null,
      history:[
        { date:'2026-03-12', event:'업무 등록', detail:'김지훈 → 박민수', icon:'clipboard-list', color:'#4f6ef7' },
        { date:'2026-03-23', event:'진행율 80%', detail:'쿼리 최적화 작업 완료', icon:'zap', color:'#22c55e' },
      ]
    },
    {
      id:4, title:'UX 사용성 개선 보고서',
      desc:'사용자 설문조사 5명 이상 진행 후 개선 사항 정리 및 보고.',
      assignerId:1, assigneeIds:[4],
      status:'waiting', priority:'low',
      progress:0, dueDate:'2026-04-05',
      createdAt:'2026-03-20', startedAt:null,
      isImportant:false, team:'디자인팀',
      score:5, spentTime:'0h', reportContent:'설문 대상자 선정 작업 진행 중', hasAttachment:false,
      parentId:null,
      history:[
        { date:'2026-03-20', event:'업무 등록', detail:'김지훈 → 최유리', icon:'clipboard-list', color:'#4f6ef7' },
      ]
    },
  ],

  // 알림 목록
  notifications: [
    { id:1, type:'delay', msg:'Q1 마케팅 기획서 - 기한 초과!', time:'방금 전', read:false },
    { id:2, type:'new',  msg:'새 업무 등록: 보안 API 성능 최적화', time:'2시간 전', read:false },
    { id:3, type:'progress', msg:'이수진 - 대시보드 UI 65% 달성', time:'4시간 전', read:false },
  ],

  // 메시지 목록
  messages: JSON.parse(localStorage.getItem('ws_messages')) || [
    { id:1, senderId:2, text:'팀장님, 대시보드 UI 진행상황 확인 요청드립니다.', time:'10:25 AM' },
    { id:2, senderId:1, text:'네, 내일까지로 확인하겠습니다.', time:'10:30 AM' },
  ],

  // 강조색 목록
  accents: JSON.parse(localStorage.getItem('ws_accents')) || [
    '#4f6ef7','#9747ff','#06b6d4','#22c55e','#f59e0b','#6b7280','#ef4444'
  ],
  currentAccent: localStorage.getItem('ws_current_accent') || '#4f6ef7',

  // ── 유틸 메서드 ──────────────────────────────────────────
  getUser(id){ return this.users.find(u => u.id === id); },
  getTask(id){ return this.tasks.find(t => t.id === id); },

  getDday(dueDate){
    const due = new Date(dueDate);
    due.setHours(23,59,59,0);
    const diff = Math.ceil((due - new Date()) / (1000*60*60*24));
    return diff;
  },

  getDdayBadge(dueDate){
    const d = this.getDday(dueDate);
    if(d < 0) return { cls:'dday-today', label:`D+${Math.abs(d)} 지연` };
    if(d === 0) return { cls:'dday-today', label:'D-DAY' };
    if(d <= 2)  return { cls:'dday-urgent', label:`D-${d}` };
    if(d <= 7)  return { cls:'dday-soon',   label:`D-${d}` };
    if(d <= 14) return { cls:'dday-normal', label:`D-${d}` };
    return { cls:'dday-ok', label:`D-${d}` };
  },

  getStatusLabel(s){
    return { waiting:'대기', progress:'진행중', delay:'지연', done:'완료' }[s] || s;
  },

  getPriorityLabel(p){
    return { high:'높음', medium:'보통', low:'낮음' }[p] || p;
  },

  formatDate(d){
    if(!d) return '-';
    const dt = new Date(d);
    return `${dt.getMonth()+1}/${dt.getDate()}`;
  },

  // 내가 지시한 업무
  getAssignedByMe(){
    if(!this.currentUser) return [];
    return this.tasks.filter(t => t.assignerId === this.currentUser.id);
  },

  // 내가 받은 업무
  getAssignedToMe(){
    if(!this.currentUser) return [];
    return this.tasks.filter(t => {
      const ids = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
      return ids.includes(this.currentUser.id);
    });
  },

  // 오늘 마감 업무
  getTodayTasks(){
    if(!this.currentUser) return [];
    return this.tasks.filter(t => {
      const d = this.getDday(t.dueDate);
      const ids = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
      return d <= 0 && t.status !== 'done' && ids.includes(this.currentUser.id);
    });
  },

  // 마감일 기준 정렬
  getSortedByDue(){
    return [...this.tasks]
      .filter(t => t.status !== 'done')
      .sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate));
  },

  // 상태 변경
  changeTaskStatus(taskId, newStatus){
    const t = this.getTask(taskId);
    if(!t) return;
    const now = new Date().toISOString().split('T')[0];
    t.status = newStatus;
    const label = this.getStatusLabel(newStatus);
    t.history.push({ date:now, event:`상태 변경: ${label}`, detail:'사용자 직접 변경', icon:'refresh-cw', color:'#06b6d4' });
    if(newStatus === 'done') t.progress = 100;
    this.saveTasks();
  },

  // 진행율 변경
  changeProgress(taskId, pct){
    const t = this.getTask(taskId);
    if(!t) return;
    t.progress = pct;
    const now = new Date().toISOString().split('T')[0];
    t.history.push({ date:now, event:`진행율 ${pct}%`, detail:'직접 업데이트', icon:'trending-up', color:'#22c55e' });
    this.saveTasks();
  },

  saveTasks(){ localStorage.setItem('ws_tasks', JSON.stringify(this.tasks)); },

  unreadCount(){ return this.notifications.filter(n => !n.read).length; },

  // 사용자 CRUD
  saveUsers(){ localStorage.setItem('ws_users', JSON.stringify(this.users)); },
  addUser(u){ u.id = Date.now(); this.users.push(u); this.saveUsers(); },
  updateUser(id, data){
    const idx = this.users.findIndex(u => u.id === id);
    if(idx !== -1) { this.users[idx] = { ...this.users[idx], ...data }; this.saveUsers(); }
  },
  deleteUser(id){
    this.users = this.users.filter(u => u.id !== id);
    this.saveUsers();
    this.tasks.forEach(t => { if(t.assigneeId === id) t.assigneeId = null; });
  },

  // 강조색 CRUD
  addAccent(color){
    if(this.accents.includes(color)) return false;
    this.accents.push(color);
    this.saveAccents();
    return true;
  },
  removeAccent(color){
    this.accents = this.accents.filter(a => a !== color);
    this.saveAccents();
  },
  saveAccents(){ localStorage.setItem('ws_accents', JSON.stringify(this.accents)); },
  applyAccent(color){
    this.currentAccent = color;
    localStorage.setItem('ws_current_accent', color);
    document.documentElement.style.setProperty('--accent-blue', color);
    document.documentElement.style.setProperty('--accent-blue-light', color + '22');
  },

  // 본사 정보 저장
  saveHQInfo(){ localStorage.setItem('ws_hq_info', JSON.stringify(this.hqInfo)); },

  // 부서 CRUD
  saveDepts(){ localStorage.setItem('ws_departments', JSON.stringify(this.departments)); },
  addDept(name){ this.departments.push({ id:Date.now(), name }); this.saveDepts(); },
  updateDept(id, name){ const d=this.departments.find(x=>x.id===id); if(d) d.name=name; this.saveDepts(); },
  deleteDept(id){ this.departments=this.departments.filter(x=>x.id!==id); this.saveDepts(); },

  // 직급 CRUD
  saveRanks(){ localStorage.setItem('ws_ranks', JSON.stringify(this.ranks)); },
  addRank(name, level){ this.ranks.push({ id:Date.now(), name, level }); this.saveRanks(); },
  updateRank(id, name, level){ const r=this.ranks.find(x=>x.id===id); if(r){ r.name=name; r.level=level; } this.saveRanks(); },
  deleteRank(id){ this.ranks=this.ranks.filter(x=>x.id!==id); this.saveRanks(); },

  // 직책 CRUD
  savePos(){ localStorage.setItem('ws_positions', JSON.stringify(this.positions)); },
  addPos(name){ this.positions.push({ id:Date.now(), name }); this.savePos(); },
  updatePos(id, name){ const p=this.positions.find(x=>x.id===id); if(p) p.name=name; this.savePos(); },
  deletePos(id){ this.positions=this.positions.filter(x=>x.id!==id); this.savePos(); },

  // 출퇴근 기록
  get attendance() {
    return JSON.parse(localStorage.getItem('ws_attendance')) || {};
  },
  _todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  },
  getTodayAttendance(userId) {
    const all = this.attendance;
    const uid = String(userId);
    return (all[uid] && all[uid][this._todayKey()]) || null;
  },
  checkIn(userId) {
    const all = this.attendance;
    const uid = String(userId);
    const today = this._todayKey();
    if(!all[uid]) all[uid] = {};
    if(!all[uid][today]) all[uid][today] = {};
    if(all[uid][today].checkIn) return;
    const now = new Date();
    const ampm = now.getHours() < 12 ? '오전' : '오후';
    const hh12 = now.getHours() % 12 || 12;
    all[uid][today].checkIn = `${ampm} ${String(hh12).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    all[uid][today].checkInRaw = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    localStorage.setItem('ws_attendance', JSON.stringify(all));
  },
  checkOut(userId) {
    const all = this.attendance;
    const uid = String(userId);
    const today = this._todayKey();
    if(!all[uid] || !all[uid][today]) return;
    const now = new Date();
    const ampm = now.getHours() < 12 ? '오전' : '오후';
    const hh12 = now.getHours() % 12 || 12;
    all[uid][today].checkOut = `${ampm} ${String(hh12).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    localStorage.setItem('ws_attendance', JSON.stringify(all));
  },

  // 메시지
  saveMessages(){ localStorage.setItem('ws_messages', JSON.stringify(this.messages)); },
  addMessage(text){
    if(!this.currentUser) return;
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', hour12:true });
    this.messages.push({ id:Date.now(), senderId:this.currentUser.id, text, time });
    this.saveMessages();
  }
};

// 페이지 로드시 테마 및 강조색 적용
document.addEventListener('DOMContentLoaded', () => {
  const theme = localStorage.getItem('ws_theme') || 'light';
  document.documentElement.setAttribute('data-theme', theme);
  const accent = localStorage.getItem('ws_current_accent') || '#4f6ef7';
  document.documentElement.style.setProperty('--accent-blue', accent);
  document.documentElement.style.setProperty('--accent-blue-light', accent + '22');
});
