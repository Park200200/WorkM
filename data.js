// ============================================================
//  WorkM - 怨듭슜 ?곗씠??& ?곹깭 愿由?// ============================================================

const WS = {
  // ?? ?꾩옱 ?ъ슜????
  currentUser: null,

  // ?? 蹂몄궗 ?뺣낫 ??
  hqInfo: JSON.parse(localStorage.getItem('ws_hq_info')) || {
    name: 'WorkM Headquarters',
    ceo: '源吏??,
    businessNum: '123-45-67890',
    phone: '02-1234-5678',
    email: 'contact@workm.kr',
    address: '?쒖슱??媛뺣궓援??뚰뿤?濡?123, ?뚰겕???15痢?,
    logoText: 'WorkM'
  },

  // ?? 遺??愿由???
  departments: JSON.parse(localStorage.getItem('ws_departments')) || [
    { id: 1, name: '媛쒕컻?' },
    { id: 2, name: '湲고쉷?' },
    { id: 3, name: '?붿옄?명?' },
    { id: 4, name: '留덉??낇?' },
    { id: 5, name: '寃쎌쁺吏?먰?' }
  ],

  // ?? 吏곴툒 愿由???
  ranks: JSON.parse(localStorage.getItem('ws_ranks')) || [
    { id: 1, name: '?ъ썝', level: 1 },
    { id: 2, name: '二쇱엫', level: 2 },
    { id: 3, name: '?由?, level: 3 },
    { id: 4, name: '怨쇱옣', level: 4 },
    { id: 5, name: '李⑥옣', level: 5 },
    { id: 6, name: '遺??, level: 6 },
    { id: 7, name: '?댁궗', level: 7 },
  ],

  // ?? 吏곸콉 愿由???
  positions: JSON.parse(localStorage.getItem('ws_positions')) || [
    { id: 1, name: '??? },
    { id: 2, name: '??? },
    { id: 3, name: '?뚰듃?? },
    { id: 4, name: '?ㅼ옣' },
    { id: 5, name: '蹂몃??? },
    { id: 6, name: 'CEO' },
  ],

  // ?먥븧 議곗쭅 愿由?CRUD ?먥븧

  /* ?? 遺???? */
  saveDepartments()  { localStorage.setItem('ws_departments', JSON.stringify(this.departments)); },
  addDepartment(name) {
    const id = (Math.max(0, ...this.departments.map(d=>d.id)) + 1);
    this.departments.push({ id, name: name.trim() });
    this.saveDepartments();
    return id;
  },
  updateDepartment(id, name) {
    const d = this.departments.find(d=>d.id===id);
    if(d) { d.name = name.trim(); this.saveDepartments(); }
  },
  deleteDepartment(id) {
    this.departments = this.departments.filter(d=>d.id!==id);
    this.saveDepartments();
  },

  /* ?? 吏곴툒 ?? */
  saveRanks()  { localStorage.setItem('ws_ranks', JSON.stringify(this.ranks)); },
  addRank(name) {
    const id = (Math.max(0, ...this.ranks.map(r=>r.id)) + 1);
    const level = this.ranks.length + 1;
    this.ranks.push({ id, name: name.trim(), level });
    this.saveRanks();
    return id;
  },
  updateRank(id, name) {
    const r = this.ranks.find(r=>r.id===id);
    if(r) { r.name = name.trim(); this.saveRanks(); }
  },
  deleteRank(id) {
    this.ranks = this.ranks.filter(r=>r.id!==id);
    // level ?ъ젙??    this.ranks.forEach((r,i) => r.level = i+1);
    this.saveRanks();
  },

  /* ?? 吏곸콉 ?? */
  savePositions()  { localStorage.setItem('ws_positions', JSON.stringify(this.positions)); },
  addPosition(name) {
    const id = (Math.max(0, ...this.positions.map(p=>p.id)) + 1);
    this.positions.push({ id, name: name.trim() });
    this.savePositions();
    return id;
  },
  updatePosition(id, name) {
    const p = this.positions.find(p=>p.id===id);
    if(p) { p.name = name.trim(); this.savePositions(); }
  },
  deletePosition(id) {
    this.positions = this.positions.filter(p=>p.id!==id);
    this.savePositions();
  },

  // ?? 媛뺤“??愿由???
  accents: JSON.parse(localStorage.getItem('ws_accents')) || [
    '#4f6ef7','#9747ff','#06b6d4','#22c55e','#f59e0b','#6b7280','#ef4444'
  ],
  currentAccent: localStorage.getItem('ws_current_accent') || '#4f6ef7',
  saveAccents() { localStorage.setItem('ws_accents', JSON.stringify(this.accents)); },

  // ?? ?낅Т寃곌낵 愿由???
  taskResults: JSON.parse(localStorage.getItem('ws_task_results')) || [
    { id:1, name:'誘몄셿猷?, icon:'?? },
    { id:2, name:'吏꾪뻾以?, icon:'?봽' },
    { id:3, name:'遺遺꾩셿猷?, icon:'?뵸' },
    { id:4, name:'?꾨즺',   icon:'?? },
    { id:5, name:'蹂대쪟',   icon:'?? },
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

  users: JSON.parse(localStorage.getItem('ws_users')) || [
    { id:1, name:'源吏??, role:'???, dept:'媛쒕컻?', avatar:'KJ', color:'#4f6ef7', email:'kim@workm.kr', phone:'010-1234-5678', birthday:'1985-05-12', hiredAt:'2020-01-01', resignedAt:null, address:'?쒖슱??媛뺣궓援??뚰뿤?濡?123', loginId:'admin', password:'password123', status:'洹쇰Т(?닿렐)', note:'? 珥앷큵 愿由ъ옄', photo:'' },
    { id:2, name:'?댁닔吏?, role:'?좎엫', dept:'媛쒕컻?', avatar:'LS', color:'#9747ff', email:'lee@workm.kr', phone:'010-2345-6789', birthday:'1990-08-22', hiredAt:'2021-03-15', resignedAt:null, address:'寃쎄린???깅궓??遺꾨떦援??먭탳??줈 456', loginId:'lee01', password:'password123', status:'洹쇰Т', note:'Frontend 媛쒕컻 由щ뱶', photo:'' },
    { id:3, name:'諛뺣?以', role:'二쇱엫', dept:'湲고쉷?', avatar:'PM', color:'#06b6d4', email:'park@workm.kr', phone:'010-3456-7890', birthday:'1992-11-05', hiredAt:'2022-07-01', resignedAt:null, address:'?쒖슱??留덊룷援??낅쭑濡?789', loginId:'park02', password:'password123', status:'洹쇰Т(異쒖옣)', note:'?좉퇋 ?쒕퉬??湲고쉷 ?대떦', photo:'' },
    { id:4, name:'理쒖쑀由?, role:'?由?, dept:'?붿옄?명?', avatar:'CY', color:'#f59e0b', email:'choi@workm.kr', phone:'010-4567-8901', birthday:'1991-02-14', hiredAt:'2021-11-10', resignedAt:null, address:'?쒖슱???≫뙆援??щ┝?쎈줈 321', loginId:'choi03', password:'password123', status:'洹쇰Т(?닿?)', note:'UI/UX ?붿옄??珥앷큵', photo:'' },
    { id:5, name:'?뺥쁽??, role:'???, dept:'留덉??낇?', avatar:'JH', color:'#22c55e', email:'jung@workm.kr', phone:'010-5678-9012', birthday:'1986-09-30', hiredAt:'2020-05-20', resignedAt:null, address:'?덉뼇???숈븞援??쒕??濡?654', loginId:'jung04', password:'password123', status:'?댁쭅', note:'?≪븘?댁쭅 以?(蹂듦? ?덉젙)', photo:'' },
    { id:6, name:'?쒖냼??, role:'?좎엫', dept:'留덉??낇?', avatar:'HS', color:'#ef4444', email:'han@workm.kr', phone:'010-6789-0123', birthday:'1989-12-25', hiredAt:'2021-06-01', resignedAt:null, address:'?쒖슱??媛뺤꽌援?媛?묐?濡?987', loginId:'han05', password:'password123', status:'洹쇰Т', note:'肄섑뀗痢?留덉????대떦', photo:'' },
  ],

  // ?? ?섑뵆 ?낅Т ?곗씠??(濡쒖뺄 ?ㅽ넗由ъ? ?곕룞) ??
  tasks: JSON.parse(localStorage.getItem('ws_tasks')) || [
    {
      id:1, title:'?좉퇋 ?꾩껜?꾪솴 UI 媛쒕컻', 
      desc:'硫붿씤 ?꾩껜?꾪솴 ?붾㈃??React濡??ш컻諛? 諛섏쓳???덉씠?꾩썐 ?곸슜 ?꾩슂.',
      assignerId:1, assigneeId:2, 
      status:'progress', priority:'high',
      progress:65, dueDate:'2026-03-25',
      createdAt:'2026-03-10', startedAt:'2026-03-11',
      isImportant:true, team:'媛쒕컻?',
      score: 15, spentTime: '12h', reportContent: 'React 而댄룷?뚰듃 援ъ“ ?ㅺ퀎 諛?API ?곕룞 以鍮??꾨즺', hasAttachment: true,
      parentId: null,
      history:[
        { date:'2026-03-10', event:'?낅Т 吏??, detail:'源吏?????댁닔吏?, icon:'clipboard-list', color:'#4f6ef7' },
        { date:'2026-03-11', event:'?낅Т ?쒖옉', detail:'吏꾪뻾以묒쑝濡??곹깭 蹂寃?, icon:'play-circle', color:'#06b6d4' },
        { date:'2026-03-18', event:'吏꾩쿃 50%', detail:'湲곕낯 而댄룷?뚰듃 援ы쁽 ?꾨즺', icon:'zap', color:'#f59e0b' },
        { date:'2026-03-22', event:'吏꾩쿃 65%', detail:'API ?곕룞 ?묒뾽 吏꾪뻾 以?, icon:'wrench', color:'#9747ff' },
      ]
    },
    {
      id:2, title:'Q1 留덉???湲고쉷???묒꽦',
      desc:'2026??1遺꾧린 SNS 罹좏럹??湲고쉷???묒꽦 諛??덉궛 ?몄꽦.',
      assignerId:5, assigneeId:6,
      status:'delay', priority:'high',
      progress:30, dueDate:'2026-03-24',
      createdAt:'2026-03-05', startedAt:'2026-03-06',
      isImportant:true, team:'留덉??낇?',
      score: 10, spentTime: '8h', reportContent: '1遺꾧린 SNS ?寃?遺꾩꽍 諛??덉궛??珥덉븞 ?묒꽦', hasAttachment: false,
      parentId: null,
      history:[
        { date:'2026-03-05', event:'?낅Т 吏??, detail:'?뺥쁽?????쒖냼??, icon:'clipboard-list', color:'#4f6ef7' },
        { date:'2026-03-06', event:'?낅Т ?쒖옉', detail:'?먮즺 ?섏쭛 ?쒖옉', icon:'play-circle', color:'#06b6d4' },
        { date:'2026-03-15', event:'吏??諛쒖깮', detail:'?몃? ?곗씠???섍툒 吏??, icon:'alert-triangle', color:'#ef4444' },
        { date:'2026-03-20', event:'吏꾩쿃 30%', detail:'湲곕낯 援ъ“ ?묒꽦 ?꾨즺', icon:'file-text', color:'#f59e0b' },
      ]
    },
    {
      id:3, title:'?쒕쾭 API ?깅뒫 理쒖쟻??,
      desc:'?묐떟?띾룄 50% 媛쒖꽑 紐⑺몴. 罹먯떆 ?덉씠???꾩엯 諛?荑쇰━ ?쒕떇.',
      assignerId:1, assigneeId:3,
      status:'progress', priority:'medium',
      progress:80, dueDate:'2026-03-30',
      createdAt:'2026-03-12', startedAt:'2026-03-13',
      isImportant:false, team:'媛쒕컻?',
      score: 20, spentTime: '15h', reportContent: 'DB ?몃뜳??理쒖쟻??諛??덈뵒??罹먯떆 ?곸슜 ?꾨즺', hasAttachment: true,
      parentId: null,
      history:[
        { date:'2026-03-12', event:'?낅Т 吏??, detail:'源吏????諛뺣?以', icon:'clipboard-list', color:'#4f6ef7' },
        { date:'2026-03-13', event:'?낅Т ?쒖옉', detail:'?깅뒫 ?꾨줈?뚯씪留??쒖옉', icon:'play-circle', color:'#06b6d4' },
        { date:'2026-03-19', event:'吏꾩쿃 60%', detail:'罹먯떆 ?쒕쾭 援ъ텞 ?꾨즺', icon:'zap', color:'#22c55e' },
        { date:'2026-03-23', event:'吏꾩쿃 80%', detail:'荑쇰━ 理쒖쟻???묒뾽 以?, icon:'wrench', color:'#9747ff' },
      ]
    },
    {
      id:4, title:'UX ?ъ슜??媛쒖꽑 由ы룷??,
      desc:'?ъ슜???명꽣酉?5嫄?吏꾪뻾 ??媛쒖꽑 ?ъ씤???뺣━ 諛?蹂닿퀬.',
      assignerId:1, assigneeId:4,
      status:'waiting', priority:'low',
      progress:0, dueDate:'2026-04-05',
      createdAt:'2026-03-20', startedAt:null,
      isImportant:false, team:'?붿옄?명?',
      score: 5, spentTime: '0h', reportContent: '?명꽣酉???곸옄 ??쇅 吏꾪뻾 以?, hasAttachment: false,
      parentId: null,
      history:[
        { date:'2026-03-20', event:'?낅Т 吏??, detail:'源吏????理쒖쑀由?, icon:'clipboard-list', color:'#4f6ef7' },
      ]
    },
    {
      id:5, title:'?붽컙 ?ㅼ쟻 蹂닿퀬??,
      desc:'2026??2???蹂?KPI ?ъ꽦瑜?痍⑦빀 諛?寃쎌쁺吏?蹂닿퀬 ?먮즺 ?묒꽦.',
      assignerId:5, assigneeId:1,
      status:'progress', priority:'high',
      progress:45, dueDate:'2026-03-24',
      createdAt:'2026-03-18', startedAt:'2026-03-19',
      isImportant:true, team:'媛쒕컻?',
      score: 12, spentTime: '5h', reportContent: '2???ㅼ쟻 ?곗씠??異붿텧 諛?遺꾩꽍 蹂닿퀬???묒꽦 以?, hasAttachment: true,
      parentId: null,
      history:[
        { date:'2026-03-18', event:'?낅Т 吏??, detail:'?뺥쁽????源吏??, icon:'clipboard-list', color:'#4f6ef7' },
        { date:'2026-03-19', event:'?낅Т ?쒖옉', detail:'?곗씠???섏쭛 ?쒖옉', icon:'play-circle', color:'#06b6d4' },
        { date:'2026-03-22', event:'吏꾩쿃 45%', detail:'媛쒕컻? ?곗씠??痍⑦빀 ?꾨즺', icon:'bar-chart-3', color:'#f59e0b' },
      ]
    },
    {
      id:6, title:'怨좉컼 ?쇰뱶諛?DB ?뺣━',
      desc:'?묐뀈 ?섎컲湲?CS 臾몄쓽 ?댁슜 移댄뀒怨좊━??諛??몄궗?댄듃 ?꾩텧.',
      assignerId:1, assigneeId:2,
      status:'done', priority:'low',
      progress:100, dueDate:'2026-03-20',
      createdAt:'2026-03-14', startedAt:'2026-03-15',
      isImportant:false, team:'媛쒕컻?',
      score: 8, spentTime: '10h', reportContent: 'CS ?쇰뱶諛?DB 留덉씠洹몃젅?댁뀡 諛??뺤젣 ?꾨즺', hasAttachment: false,
      parentId: null,
      history:[
        { date:'2026-03-14', event:'?낅Т 吏??, detail:'源吏?????댁닔吏?, icon:'clipboard-list', color:'#4f6ef7' },
        { date:'2026-03-15', event:'?낅Т ?쒖옉', detail:'DB ?묎렐 沅뚰븳 ?뺤씤', icon:'play-circle', color:'#06b6d4' },
        { date:'2026-03-19', event:'?꾨즺', detail:'蹂닿퀬??怨듭쑀 ?꾨즺', icon:'check-circle-2', color:'#22c55e' },
      ]
    },
    {
      id:7, title:'?쒕뵫?섏씠吏 由щ돱??,
      desc:'?좉퇋 釉뚮옖???꾩씠?댄떚??湲곕컲?쇰줈 ?덊럹?댁? ?꾨㈃ ?ъ꽕怨?',
      assignerId:5, assigneeId:4,
      status:'progress', priority:'medium',
      progress:55, dueDate:'2026-04-10',
      createdAt:'2026-03-15', startedAt:'2026-03-16',
      isImportant:true, team:'?붿옄?명?',
      score: 18, spentTime: '20h', reportContent: '硫붿씤 鍮꾩＜???붿옄??諛??됱긽 媛?대뱶 ?뺤젙', hasAttachment: true,
      parentId: null,
      history:[
        { date:'2026-03-15', event:'?낅Т 吏??, detail:'?뺥쁽????理쒖쑀由?, icon:'clipboard-list', color:'#4f6ef7' },
        { date:'2026-03-16', event:'?낅Т ?쒖옉', detail:'?붿옄???쒖븞 ?묒뾽 ?쒖옉', icon:'play-circle', color:'#06b6d4' },
        { date:'2026-03-22', event:'吏꾩쿃 55%', detail:'硫붿씤 ?섏씠吏 ?붿옄???꾨즺', icon:'palette', color:'#9747ff' },
      ]
    },
    {
      id:8, title:'蹂댁븞 痍⑥빟???먭?',
      desc:'?뺢린 蹂댁븞 媛먯궗. OWASP Top 10 湲곗? ?꾩닔 ?먭?.',
      assignerId:1, assigneeId:3,
      status:'waiting', priority:'high',
      progress:0, dueDate:'2026-03-28',
      createdAt:'2026-03-22', startedAt:null,
      isImportant:true, team:'媛쒕컻?',
      score: 15, spentTime: '0h', reportContent: '痍⑥빟??吏꾨떒 ?먭? ??ぉ 由ъ뒪???묒꽦 以?, hasAttachment: false,
      parentId: null,
      history:[
        { date:'2026-03-22', event:'?낅Т 吏??, detail:'源吏????諛뺣?以', icon:'clipboard-list', color:'#4f6ef7' },
      ]
    },
  ],

  // ?? ?뚮┝ 紐⑸줉 ??
  notifications: [
    { id:1, type:'delay', msg:'Q1 留덉???湲고쉷??- ?ㅻ뒛源뚯?!', time:'諛⑷툑 ??, read:false },
    { id:2, type:'new', msg:'???낅Т 吏?? 蹂댁븞 痍⑥빟???먭?', time:'2?쒓컙 ??, read:false },
    { id:3, type:'progress', msg:'?댁닔吏?- ?꾩껜?꾪솴 UI 65% ?ъ꽦', time:'4?쒓컙 ??, read:false },
    { id:4, type:'done', msg:'怨좉컼 ?쇰뱶諛?DB ?뺣━ ?꾨즺??, time:'1????, read:true },
    { id:5, type:'info', msg:'?붽컙 ?ㅼ쟻 蹂닿퀬??留덇컧 D-1', time:'1????, read:true },
  ],

  // ?? 硫붿떆吏 紐⑸줉 (濡쒖뺄 ?ㅽ넗由ъ? ?곕룞) ??
  messages: JSON.parse(localStorage.getItem('ws_messages')) || [
    { id: 1, senderId: 2, text: '??λ떂, ?좉퇋 UI ?쒖븞 ?뺤씤 遺?곷뱶由쎈땲??', time: '10:25 AM' },
    { id: 2, senderId: 1, text: '?? 吏湲?諛붾줈 ?뺤씤?대낵寃뚯슂. 怨좎깮 留롮쑝?⑥뼱??', time: '10:30 AM' },
    { id: 3, senderId: 3, text: '?쒕쾭 理쒖쟻???묒뾽 80% ?꾨즺?섏뿀?듬땲?? ?ㅽ썑??諛고룷 媛?ν븷 寃?媛숈븘??', time: '11:15 AM' },
    { id: 4, senderId: 4, text: '?붿옄??媛?대뱶 ?섏젙蹂?怨듭쑀?대몢?덉뒿?덈떎. 李멸퀬諛붾엻?덈떎.', time: '01:45 PM' }
  ],

  // ?? 異쒗눜洹?湲곕줉 ??
  attendance: { checkedIn: false, checkInTime: null, checkOutTime: null },

  // ?? ?좏떥 ?⑥닔 ??
  getUser(id){ return this.users.find(u => u.id === id); },
  getTask(id){ return this.tasks.find(t => t.id === id); },

  getDday(dueDate){
    const due = new Date(dueDate);
    due.setHours(23,59,59,0);
    const now = new Date();
    const diff = Math.ceil((due - now) / (1000*60*60*24));
    return diff;
  },

  getDdayBadge(dueDate){
    const d = this.getDday(dueDate);
    if(d < 0) return { cls:'dday-today', label:`D+${Math.abs(d)} 吏?? };
    if(d === 0) return { cls:'dday-today', label:'D-DAY' };
    if(d <= 2) return { cls:'dday-urgent', label:`D-${d}` };
    if(d <= 7) return { cls:'dday-soon', label:`D-${d}` };
    if(d <= 14) return { cls:'dday-normal', label:`D-${d}` };
    return { cls:'dday-ok', label:`D-${d}` };
  },

  getStatusLabel(s){
    return { waiting:'?湲?, progress:'吏꾪뻾以?, delay:'吏??, done:'?꾨즺' }[s] || s;
  },

  getPriorityLabel(p){
    return { high:'湲닿툒', medium:'以묎컙', low:'??쓬' }[p] || p;
  },

  formatDate(d){
    if(!d) return '-';
    const dt = new Date(d);
    return `${dt.getMonth()+1}/${dt.getDate()}`;
  },

  // ?닿? 吏?쒗븳 ?낅Т
  getAssignedByMe(){
    if(!this.currentUser) return [];
    return this.tasks.filter(t => t.assignerId === this.currentUser.id);
  },

  // ?닿? 諛쏆? ?낅Т
  getAssignedToMe(){
    if(!this.currentUser) return [];
    return this.tasks.filter(t => t.assigneeId === this.currentUser.id);
  },

  // ?ㅻ뒛 ?꾨즺?댁빞 ???낅Т
  getTodayTasks(){
    if(!this.currentUser) return [];
    return this.tasks.filter(t => {
      const d = this.getDday(t.dueDate);
      return d <= 0 && t.status !== 'done' && t.assigneeId === this.currentUser.id;
    });
  },

  // 留덇컧??湲곗? ?뺣젹
  getSortedByDue(){
    return [...this.tasks]
      .filter(t => t.status !== 'done')
      .sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate));
  },

  // ?곹깭 蹂寃?  changeTaskStatus(taskId, newStatus){
    const t = this.getTask(taskId);
    if(!t) return;
    const now = new Date().toISOString().split('T')[0];
    t.status = newStatus;
    const label = this.getStatusLabel(newStatus);
    t.history.push({ date:now, event:`?곹깭 蹂寃? ${label}`, detail:'?ъ슜??吏곸젒 蹂寃?, icon:'refresh-cw', color:'#06b6d4' });
    if(newStatus === 'done') t.progress = 100;
    this.saveTasks();
  },

  // 吏꾩쿃瑜?蹂寃?  changeProgress(taskId, pct){
    const t = this.getTask(taskId);
    if(!t) return;
    t.progress = pct;
    const now = new Date().toISOString().split('T')[0];
    t.history.push({ date:now, event:`吏꾩쿃瑜?${pct}%`, detail:'吏곸젒 ?낅뜲?댄듃', icon:'trending-up', color:'#22c55e' });
    this.saveTasks();
  },

  saveTasks(){
    localStorage.setItem('ws_tasks', JSON.stringify(this.tasks));
  },

  unreadCount(){
    return this.notifications.filter(n => !n.read).length;
  },

  // ?? ?ъ슜??愿由???
  saveUsers(){
    localStorage.setItem('ws_users', JSON.stringify(this.users));
  },
  addUser(u){
    u.id = Date.now();
    this.users.push(u);
    this.saveUsers();
  },
  updateUser(id, data){
    const idx = this.users.findIndex(u=>u.id===id);
    if(idx!==-1) {
      this.users[idx] = { ...this.users[idx], ...data };
      this.saveUsers();
    }
  },
  deleteUser(id){
    this.users = this.users.filter(u=>u.id!==id);
    this.saveUsers();
    // ?대떦 ?ъ슜?먭? ?대떦???낅Т 泥섎━ (null 泥섎━ ??
    this.tasks.forEach(t=>{ if(t.assigneeId===id) t.assigneeId=null; });
  },

  // ?? 媛뺤“??愿由???
  accents: JSON.parse(localStorage.getItem('ws_accents')) || ['#4f6ef7', '#9747ff', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444'],
  currentAccent: localStorage.getItem('ws_current_accent') || '#4f6ef7',

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
  saveAccents(){
    localStorage.setItem('ws_accents', JSON.stringify(this.accents));
  },
  applyAccent(color){
    this.currentAccent = color;
    localStorage.setItem('ws_current_accent', color);
    document.documentElement.style.setProperty('--accent-blue', color);
    // 蹂댁“ ?됱긽 (?고븳 諛곌꼍 ?? ?먮룞 怨꾩궛 (?⑥닚??
    document.documentElement.style.setProperty('--accent-blue-light', color + '22'); 
  },

  saveHQInfo(){
    localStorage.setItem('ws_hq_info', JSON.stringify(this.hqInfo));
  },
  saveRanks(){ localStorage.setItem('ws_ranks', JSON.stringify(this.ranks)); },
  saveDepts(){ localStorage.setItem('ws_departments', JSON.stringify(this.departments)); },
  savePos(){ localStorage.setItem('ws_positions', JSON.stringify(this.positions)); },
  
  // CRUD - 遺??  addDept(name){ this.departments.push({ id:Date.now(), name }); this.saveDepts(); },
  updateDept(id, name){ const d=this.departments.find(x=>x.id===id); if(d) d.name=name; this.saveDepts(); },
  deleteDept(id){ this.departments=this.departments.filter(x=>x.id!==id); this.saveDepts(); },

  // CRUD - 吏곴툒
  addRank(name, level){ this.ranks.push({ id:Date.now(), name, level }); this.saveRanks(); },
  updateRank(id, name, level){ const r=this.ranks.find(x=>x.id===id); if(r){ r.name=name; r.level=level; } this.saveRanks(); },
  deleteRank(id){ this.ranks=this.ranks.filter(x=>x.id!==id); this.saveRanks(); },

  // CRUD - 吏곸콉
  addPos(name){ this.positions.push({ id:Date.now(), name }); this.savePos(); },
  updatePos(id, name){ const p=this.positions.find(x=>x.id===id); if(p) p.name=name; this.savePos(); },
  deletePos(id){ this.positions=this.positions.filter(x=>x.id!==id); this.savePos(); },

  // ?? 異쒗눜洹?湲곕줉  { userId: { "YYYY-MM-DD": { checkIn: "HH:MM", checkOut: "HH:MM" } } }
  get attendance() {
    return JSON.parse(localStorage.getItem('ws_attendance')) || {};
  },

  // ?ㅻ뒛 ?좎쭨 ??諛섑솚
  _todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  },

  // ?ㅻ뒛 ???ъ슜?먯쓽 異쒗눜洹?湲곕줉 媛?몄삤湲?  getTodayAttendance(userId) {
    const all = this.attendance;
    const uid = String(userId);
    return (all[uid] && all[uid][this._todayKey()]) || null;
  },

  // 異쒓렐 湲곕줉
  checkIn(userId) {
    const all = this.attendance;
    const uid = String(userId);
    const today = this._todayKey();
    if (!all[uid]) all[uid] = {};
    const now = new Date();
    const hhmm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const ampm = now.getHours() < 12 ? '?ㅼ쟾' : '?ㅽ썑';
    const hh12 = now.getHours() % 12 || 12;
    const timeStr = `${ampm} ${String(hh12).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    if (!all[uid][today]) all[uid][today] = {};
    // 異쒓렐 ?쒓컙???대? 湲곕줉?섏뼱 ?덉쑝硫???뼱?곗? ?딆쓬 (?뱀씪 理쒖큹 湲곕줉 怨좎젙)
    if (all[uid][today].checkIn) return;
    all[uid][today].checkIn = timeStr;
    all[uid][today].checkInRaw = hhmm;
    localStorage.setItem('ws_attendance', JSON.stringify(all));
  },

  // ?닿렐 湲곕줉
  checkOut(userId) {
    const all = this.attendance;
    const uid = String(userId);
    const today = this._todayKey();
    if (!all[uid] || !all[uid][today]) return;
    const now = new Date();
    const ampm = now.getHours() < 12 ? '?ㅼ쟾' : '?ㅽ썑';
    const hh12 = now.getHours() % 12 || 12;
    const timeStr = `${ampm} ${String(hh12).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    all[uid][today].checkOut = timeStr;
    localStorage.setItem('ws_attendance', JSON.stringify(all));
  },

  saveMessages(){

    localStorage.setItem('ws_messages', JSON.stringify(this.messages));
  },
  addMessage(text){
    if(!this.currentUser) return;
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    this.messages.push({
      id: Date.now(),
      senderId: this.currentUser.id,
      text: text,
      time: time
    });
    this.saveMessages();
  }
};

// 濡쒖뺄?ㅽ넗由ъ??먯꽌 ?뚮쭏 諛?媛뺤“??蹂듭썝
document.addEventListener('DOMContentLoaded', () => {
  const theme = localStorage.getItem('ws_theme') || 'light';
  document.documentElement.setAttribute('data-theme', theme);
  const accent = localStorage.getItem('ws_current_accent') || '#4f6ef7';
  document.documentElement.style.setProperty('--accent-blue', accent);
  document.documentElement.style.setProperty('--accent-blue-light', accent + '22');
});
