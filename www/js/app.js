/* ============================================================
   FoodNow – app-logik (vanilla JS, ingen afhængigheder)
   ============================================================ */
'use strict';
const R = window.FN;                       // alle retter (klassikere, salater, vegetar, vegansk)
/* rigtige fotos (data/billeder.js) – falder tilbage til tegning hvis et foto mangler */
const IMG = window.FN_IMG || {};
R.forEach(r => { if (IMG[r.id]) r.img = IMG[r.id].f; });
const BYID = Object.fromEntries(R.map(r => [r.id, r]));
/* rækkefølge for de kendte salater – de mest berømte først */
const KENDT = ['caesar','graesk-salat','waldorf','caprese','nicoise','s-cobb','coleslaw','s-hoensesalat','s-italiensk','s-panzanella','tabbouleh','s-fattoush','s-olivier','s-chefsalat','s-tunsalat','s-karrysalat','s-som-tam','s-shopska','s-wedge','s-tysk-kartoffelsalat','kold-kartoffelsalat','pastasalat','broccolisalat','s-makrelsalat','s-sildesalat','roedbedesalat','agurkesalat','aeg-rejesalat','pasta-tun-salat','fransk-kartoffelsalat'];
const kRank = r => { const i = KENDT.indexOf(r.id); return i<0 ? 999 : i; };
/* enkle streg-ikoner (i stedet for emojis) */
const svg = p => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
const IC = {
  clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  flame: svg('<path d="M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4 2.5-5 .3 1.5 1 2.5 2 3 0-3 0-5.5.5-8z"/>'),
  level: svg('<path d="M5 19v-4M12 19V9M19 19V5"/>'),
  cal: svg('<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
  users: svg('<circle cx="9" cy="8" r="3.2"/><path d="M3 19c.6-3.2 3-5 6-5s5.4 1.8 6 5"/><path d="M16 5.5a3 3 0 0 1 0 5.6M18 14.3c1.6.7 2.7 2.4 3 4.7"/>'),
  book: svg('<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5"/>'),
  wine: svg('<path d="M8 3h8l-.5 6a3.5 3.5 0 0 1-7 0z"/><path d="M12 12.5V20M8.5 20h7"/>'),
  chef: svg('<path d="M7 14v5h10v-5"/><path d="M7 14a4 4 0 0 1-1-7.8A4 4 0 0 1 12 4a4 4 0 0 1 6 2.2A4 4 0 0 1 17 14z"/>'),
  cart: svg('<path d="M3 4h2l2.4 11h10.2L20 8H6.2"/><circle cx="9" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/>'),
  check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  share: svg('<path d="M12 15V3.5M7.5 8 12 3.5 16.5 8"/><path d="M5 12v6.5A2 2 0 0 0 7 20.5h10a2 2 0 0 0 2-2V12"/>'),
  heart: svg('<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20z"/>'),
  heartOn: '<svg class="ic heartOn" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20z"/></svg>',
  back: svg('<path d="M15 5l-7 7 7 7"/>')
};
const COUNT = R.reduce((c,r)=>(c[r.c]=(c[r.c]||0)+1,c),{});
const tabFor = m => m==='g' ? 'v' : (['home','k','s','v','week'].includes(m) ? m : null);
const BASE = 4;                            // opskrifterne er skrevet til 4 personer
const TOP10 = ['stegt-flaesk','frikadeller','spaghetti-bolognese','flaeskesteg','lasagne','pizza','boller-i-karry','smoerrebroed','sprode-kyllingelaar','hakkeboef'];
const DAYS = ['Mandag','Tirsdag','Onsdag','Torsdag','Fredag','Lørdag','Søndag'];
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm = s => String(s||'').toLowerCase().normalize('NFC').trim();

/* ---------------- STATE (gemmes kun på enheden) ---------------- */
const KEY = 'foodnow_v1';
const S = { favs:[], plan:{}, shop:[], serv:{}, bought:[], showStaples:false, defServ:4, fridge:[], autoShop:true, auto:[], extra:[] };
try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch(e) {}
const favs = new Set(S.favs), bought = new Set(S.bought);
function save(){
  S.favs=[...favs]; S.bought=[...bought];
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e) {}
  updateWeekDot();
}

/* ---------------- OPSKRIFTS-PARSER ---------------- */
const UNIT = '(?:kg|g|dl|l|ml|tsk|spsk|fed|ds|knsp|stk|bundt|glas|pose|skiver|blade)';
const AMT_RE = new RegExp('^((?:\\d+(?:[,.]\\d+)?)?\\s*[½¼¾]?(?:-\\d+)?)\\s*(' + UNIT + ')?\\s+(.+)$', 'i');
const STAPLES = ['salt','peber','salt og peber','sort peber','olie','olivenolie','sukker','hvedemel','mel','vand','eddike','maizena','kulør','paprika','karry','oregano','timian','spidskommen','laurbærblade','muskat','soja','kanel','chiliflager','bagepulver','rasp','brun farin','gurkemeje','garam masala','riseddike'];
function parseIng(line){
  line = line.trim();
  const m = line.match(AMT_RE);
  if (m && /[\d½¼¾]/.test(m[1])) return { q:m[1].trim(), u:(m[2]||'').toLowerCase(), name:m[3].trim(), raw:line };
  return { q:'', u:'', name:line, raw:line };
}
function isStaple(name){
  const n = norm(name).replace(/\s*\(.*\)$/,'');
  if (STAPLES.includes(n)) return true;
  const first = n.split(',')[0].trim();
  return STAPLES.includes(first) || /^(?:revet )?muskat/.test(n) || /^(?:hele )?peberkorn/.test(n);
}
const cache = {};
function recipe(r){
  if (cache[r.id]) return cache[r.id];
  const ing = r.i.split(';').map(parseIng).map(x => ({...x, staple:isStaple(x.name)}));
  const steps = r.s.split(';').map(t => { const m = t.match(/^(.*?)~(\d+)\s*$/); return m ? {t:m[1].trim(), timer:+m[2]*60} : {t:t.trim()}; });
  return cache[r.id] = { ing, steps };
}

/* ---------------- OMREGNING AF MÆNGDER ---------------- */
const FR = {'½':.5,'¼':.25,'¾':.75};
function qToNum(q){
  if (/-/.test(q)) return null;
  const m = q.match(/^(\d+(?:[,.]\d+)?)?\s*([½¼¾])?$/); if (!m) return null;
  return (m[1] ? parseFloat(m[1].replace(',','.')) : 0) + (m[2] ? FR[m[2]] : 0);
}
function fmt(v, step){
  v = Math.max(step, Math.round(v/step)*step);
  const w = Math.floor(v + 1e-9), f = Math.round((v-w)*4)/4;
  const fs = f===.25?'¼':f===.5?'½':f===.75?'¾':'';
  if (step < .25 && f !== 0 && !fs) return String(Math.round(v*10)/10).replace('.',',');
  return (w ? String(w) : (fs ? '' : '0')) + fs;
}
function amount(x, n){
  if (!x.q) return '';
  const u = x.u;
  if (n === BASE) return x.q + (u ? ' '+u : '');
  const v = qToNum(x.q); if (v === null) return x.q + (u ? ' '+u : '');
  let t = v * n / BASE, out;
  if (u === 'kg') { t *= 1000; return grams(t); }
  if (u === 'g') return grams(t);
  if (u === 'l') { t *= 10; return t >= 10 ? fmt(t/10, .25)+' l' : fmt(t,.25)+' dl'; }
  if (['fed','ds','glas','pose','stk','skiver','blade'].includes(u)) out = String(Math.max(1, Math.round(t)));
  else if (['dl','tsk','spsk','ml'].includes(u)) out = fmt(t, .25);
  else if (u === 'knsp' || u === 'bundt') out = String(Math.max(1, Math.round(t)));
  else out = v >= 1 ? String(Math.max(1, Math.round(t))) : fmt(t, .5);
  return out + (u ? ' '+u : '');
}
function grams(g){
  g = g >= 100 ? Math.round(g/25)*25 : Math.max(5, Math.round(g/5)*5);
  return g >= 1000 ? String(Math.round(g/50)/20).replace('.',',')+' kg' : g+' g';
}
const pers = id => S.serv[id] || S.defServ || BASE;

/* ---------------- INDKØBS-AFDELINGER ---------------- */
const AISLES = [
  ['🥬 Frugt & grønt', /banan|kiwi|blomme|clementin|mandarin|nektarin|fersken|hindbær|blåbær|brombær|vindruer|grapefrugt|ananas$|^salat|agurk$|kartof|løg|hvidløg|gulerød|porre|selleri|salat|romaine|rucola|spinat|kål|broccoli|blomkål|squash|aubergine|peberfrugt|agurk(?!er)|^agurk|tomat(?!puré)|cherrytomat|avocado|æble|pære|citron|lime|appelsin|mango|melon|druer|jordbær|granatæble|ananas(?! i tern)|svampe|champignon|asparges|radise|rødbede|græskar|jordskok|fennikel|ingefær|chili(?!flager)|persille|dild|purløg|basilikum|koriander|mynte|estragon|forårsløg|bønnespirer|pak choi|sukkerærter|grønne bønner|majskolbe|søde kartofler|sød kartoffel|perleløg|skalotteløg|karse|timian(?! ,)|frugt/],
  ['🥩 Kød, fisk & fjerkræ', /kød|flæsk|bacon|kylling|høne|(?:^| )and\b|laks|torsk|fisk|sej|rejer|pølse|medister|mørbrad|steg|bøf|okse|svine|kalv|lam|sild|rødspætte|skinke|chorizo|pepperoni|guanciale|muslinger|ryg|spareribs|nakke|schnitzel|roastbeef|leverpostej|entrecote|inderlår|spæk|rogn|tofu/],
  ['🧀 Mejeri, æg & plantedrik', /mælk|fløde|smør|ost|parmesan|mozzarella|feta|yoghurt|creme fraiche|æg|ricotta|pecorino|cheddar|havre|kærnemælk|mayonnaise/],
  ['🍞 Brød', /brød|rugbrød|boller|pita|tortilla|naan|tarteletter|nachos|tacoskaller|cannellonirør/],
  ['❄️ Frost', /frost|pommes|edamame|frosne/],
];
function aisleOf(name){
  const n = norm(name);
  if (/toilet|køkkenrulle|opvask|vaskepulver|vaskemiddel|skyllemiddel|sæbe|tandpasta|tandbørste|shampoo|balsam|deodorant|skraldepose|affaldspose|poser|bleer|vatpinde|plaster|batteri|elpære|lyspære|alufolie|bagepapir|husholdningsfilm|frysepose|rengøring|klude|svamp|kattemad|hundemad|blomster/.test(n)) return '🧴 Husholdning & andet';
  if (/frost|frosne|pommes|edamame|^ærter$|is\b|isvaffel/.test(n)) return '❄️ Frost';
  if (/havregryn|gryn\b|hakkede tomater|ds |dåse|tun\b|kokosmælk|bønner|kikærter|majs\b|tomatpuré|pesto|glas|bouillon|fond\b|fond |sauce|chutney|eddike|kerner|syltet|ristede løg|oliven|gærflager|sweet chili|asparges$|hvide asparges/.test(n) && !/grønne bønner|grønne asparges/.test(n)) return '🥫 Kolonial & tørvarer';
  for (const [a, re] of AISLES) if (re.test(n)) return a;
  return '🥫 Kolonial & tørvarer';
}

/* ---------------- NATIVE HJÆLPERE ---------------- */
const plugin = n => { try { return (window.Capacitor && Capacitor.Plugins && Capacitor.Plugins[n]) || null; } catch(e){ return null; } };
function haptic(kind){
  const h = plugin('Haptics');
  if (h) { (kind==='success' ? h.notification({type:'SUCCESS'}) : h.impact({style:'LIGHT'})).catch(()=>{}); return; }
  try { navigator.vibrate && navigator.vibrate(kind==='success'?[200,100,200,100,400]:8); } catch(e){}
}
let toastT;
function toast(msg){ const t=$('toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),2300); }
let wakeLock=null;
async function keepAwake(on){
  const k = plugin('KeepAwake');
  try {
    if (k) { on ? await k.keepAwake() : await k.allowSleep(); return; }
    if (on && navigator.wakeLock) wakeLock = await navigator.wakeLock.request('screen');
    else if (!on && wakeLock) { await wakeLock.release(); wakeLock=null; }
  } catch(e){}
}
async function shareText(title, text){
  try {
    const sh = plugin('Share');
    if (sh) return await sh.share({title, text});
    if (navigator.share) return await navigator.share({title, text});
    await navigator.clipboard.writeText(text); toast('📋 Kopieret – klar til at indsætte');
  } catch(e){}
}

/* ---------------- TEMA ---------------- */
let themeMode = 'auto';
try { themeMode = localStorage.getItem('foodnow_theme') || 'auto'; } catch(e){}
function applyTheme(){
  const dark = themeMode==='dark' || (themeMode==='auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  $('themeColor').setAttribute('content', dark ? '#121110' : '#faf7f2');
  statusBar();
}
function setTheme(m){ themeMode=m; try{localStorage.setItem('foodnow_theme',m)}catch(e){} applyTheme(); openSettings(); haptic(); }
try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ()=>{ if(themeMode==='auto') applyTheme(); }); } catch(e){}
function statusBar(){
  const sb = plugin('StatusBar'); if (!sb) return;
  const dark = cur==='cook' || document.documentElement.dataset.theme==='dark';
  sb.setStyle({style: dark ? 'DARK' : 'LIGHT'}).catch(()=>{});
}

/* ---------------- NAVIGATION ---------------- */
let cur = 'home', stack = [], listMode = 'k', current = null;
const TABS = ['home','k','s','v','week'];
function show(id){
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id===id));
  cur = id;
  $('tabs').classList.toggle('hidden', id==='cook' || id==='detail');
  document.body.classList.toggle('noTabs', id==='cook' || id==='detail');
  window.scrollTo(0,0);
  statusBar();
}
function setTabHighlight(t){ if(!t) return; TABS.forEach(x => $('t-'+x).setAttribute('aria-current', x===t)); }
function tab(t){
  stack = []; haptic();
  setTabHighlight(t);
  if (t==='home'){ renderHome(); show('home'); }
  else if (t==='week'){ renderWeek(); show('week'); }
  else openList(t==='v' ? 'g' : t, true);
}
function push(){ stack.push({screen:cur, mode:listMode, dish:current&&current.id, y:window.scrollY}); }
function goBack(){
  const p = stack.pop();
  if (!p) { tab('home'); return; }
  if (p.screen==='list'){ listMode=p.mode; renderList(); show('list'); setTabHighlight(tabFor(listMode)); }
  else if (p.screen==='detail' && p.dish){ current=BYID[p.dish]; renderDetail(); show('detail'); }
  else if (p.screen==='week'){ renderWeek(); show('week'); setTabHighlight('week'); }
  else if (p.screen==='fridge'){ renderFridge(); show('fridge'); }
  else { renderHome(); show('home'); setTabHighlight('home'); }
  requestAnimationFrame(()=>window.scrollTo(0,p.y||0));
}

/* ---------------- KORT ---------------- */
function card(r, rank){
  const fav = favs.has(r.id);
  return `<div class="card" role="button" tabindex="0" onclick="openDish('${r.id}')" onkeydown="if(event.key==='Enter')openDish('${r.id}')">
    <div class="art">${dishArt(r)}${rank?`<span class="rank">${rank}</span>`:''}
      <button class="heart" onclick="event.stopPropagation();toggleFav('${r.id}',this)" aria-label="${fav?'Fjern fra':'Gem i'} favoritter">${fav?IC.heartOn:IC.heart}</button>
      ${r.c==='k'&&r.o==='dk'?'<span class="tagPill">🇩🇰 Klassiker</span>':r.kendt?'<span class="tagPill">⭐ Kendt</span>':r.pr==='vegan'&&r.c!=='v'?'<span class="tagPill">🌱 Vegansk</span>':r.c==='g'?'<span class="tagPill">🥚 Vegetar</span>':''}
    </div>
    <div class="cBody"><h3>${esc(r.n)}</h3><div class="cMeta"><span>${IC.clock} ${r.t} min</span><span>${IC.flame} ${r.kcal} kcal/portion</span></div></div>
  </div>`;
}
function rail(list, ranked){ return `<div class="rail">${list.map((r,i)=>card(r, ranked?i+1:0)).join('')}</div>`; }
function toggleFav(id, btn){
  favs.has(id) ? favs.delete(id) : favs.add(id); save(); haptic();
  const on = favs.has(id);
  if (btn) { btn.innerHTML = on?IC.heartOn:IC.heart; btn.setAttribute('aria-label', (on?'Fjern fra':'Gem i')+' favoritter'); }
  toast(on ? '❤️ Gemt i favoritter' : 'Fjernet fra favoritter');
  if (cur==='week' && seg==='fav') renderWeek();
}

/* ---------------- OPDAG ---------------- */
function dayIndex(){ return Math.floor((Date.now() - new Date().getTimezoneOffset()*60000) / 864e5); }
function season(){
  const m = new Date().getMonth();
  if (m===11) return [['jul','🎄 Jul i køkkenet','Julens klassikere – fra and til grønlangkål'],['vinter','🔥 Vintervarme gryder','Langtidsretter til mørke aftener']];
  if (m===10) return [['vinter','🍂 Efterårsgryder & suppe','Varmende retter til mørke aftener'],['jul','🎄 Glæd dig til jul','Øv dig på julens klassikere']];
  if (m<=1) return [['vinter','❄️ Vintervarme gryder','Langtidsretter og suppe']];
  if (m<=4) return [['forår','🌱 Forårsfrisk','Lette retter med årets første grønt'],['sommer','☀️ Snart grillsæson','']];
  if (m<=7) return [['sommer','☀️ Sommer & grill','Lette retter, salater og grill']];
  return [['vinter','🍂 Efterårsgryder','Varmende retter til mørke aftener']];
}
function renderHome(){
  const h = new Date().getHours();
  $('greet').textContent = (h<5?'God nat':h<10?'Godmorgen':h<12?'God formiddag':h<18?'God eftermiddag':'Godaften');
  const light = r => !r.tung;
  const pool = R.filter(r=>light(r) && r.img && r.kcal<=750 && r.c!=='s');
  const today = pool[dayIndex() % pool.length];
  const BURGERS = ['burger','g-halloumiburger','v-boennebuffer'].map(id=>BYID[id]).filter(Boolean);
  const italian = R.filter(r=>r.ku==='italiensk' && light(r) && r.c!=='s' && r.img);
  const indian = R.filter(r=>r.ku==='indisk' && light(r));
  const asian = R.filter(r=>r.ku==='asiatisk' && light(r) && r.c!=='s');
  const healthy = R.filter(r=>light(r) && r.kcal<=550 && r.c!=='s' && r.img).sort((a,b)=>a.kcal-b.kcal).slice(0,14);
  let html = `
  <button class="hero" onclick="openDish('${today.id}')">
    <div class="art">${dishArt(today)}</div>
    <div class="heroBody"><div class="kicker">Dagens forslag</div><h2>${esc(today.n)}</h2>
      <div class="meta"><span>${IC.clock} ${today.t} min</span><span>${IC.flame} ${today.kcal} kcal pr. portion</span></div></div>
  </button>
  ${weekCard()}
  <div class="quick">
    <button class="qBtn wide" onclick="surprise()"><span>🎲</span>Overrask mig – find aftensmaden for mig</button>
    <button class="qBtn" onclick="openList('k',false,['hurtig'])"><span>⚡</span>Under 30 min</button>
    <button class="qBtn" onclick="openFridge()"><span>🧊</span>Hvad har jeg i køleskabet?</button>
  </div>
  <div class="secHead"><h2>Italienske favoritter<small>Pasta, risotto og pizza</small></h2><button onclick="openList('k',false,['italiensk'])">Se alle</button></div>
  ${rail(italian)}
  <div class="secHead"><h2>Indisk<small>Fra butter chicken til biryani</small></h2><button onclick="openList('k',false,['indisk'])">Se alle</button></div>
  ${rail(indian)}
  <div class="secHead"><h2>Burgere<small>Hjemmelavede – med oksekød, halloumi eller bønner</small></h2></div>
  ${rail(BURGERS)}
  <div class="secHead"><h2>Friske salater<small>Fra cæsarsalat til tabbouleh</small></h2><button onclick="tab('s')">Se alle</button></div>
  ${rail(R.filter(r=>r.c==='s'&&r.kendt&&light(r)&&r.img).sort((a,b)=>kRank(a)-kRank(b)).slice(0,12))}
  <div class="secHead"><h2>Sundt & let<small>Under 550 kcal pr. portion</small></h2><button onclick="openList('k',false,['let'])">Se alle</button></div>
  ${rail(healthy)}
  <div class="secHead"><h2>Vegetar<small>Med ost, æg og masser af grønt</small></h2><button onclick="tab('v')">Se alle</button></div>
  ${rail(R.filter(r=>r.c==='g'&&light(r)).slice(0,12))}
  <div class="secHead"><h2>Asiatisk<small>Thai, japansk, koreansk og vietnamesisk</small></h2><button onclick="openList('k',false,['asiatisk'])">Se alle</button></div>
  ${rail(asian)}
  ${favs.size?`<div class="secHead"><h2>Dine favoritter</h2><button onclick="openWeekSeg('fav')">Se alle</button></div>${rail([...favs].map(id=>BYID[id]).filter(Boolean))}`:''}
  <p class="footer">FoodNow · ${R.length} opskrifter</p>`;
  $('homeBody').innerHTML = html;
}
function weekCard(){
  const planned = Object.values(S.plan).flat().filter(id=>BYID[id]).length;
  if (!planned) return `<div class="howTo"><b>Sådan bruger du FoodNow</b>
    <ol><li><span>1</span>Find en ret du har lyst til</li><li><span>2</span>Tryk <b>Tilføj til ugeplan</b> og vælg en dag</li><li><span>3</span>Handl ind efter <b>indkøbslisten</b> under Min uge</li></ol></div>`;
  const g = shopItems(); const left = Object.values(g).flat().filter(it=>!bought.has(it.key)).length;
  return `<button class="weekCard" onclick="openWeekSeg('plan')"><span class="wcIcon">🗓️</span><span class="wcTxt"><b>Din uge: ${planned} ${planned===1?'ret':'retter'} planlagt</b><small>🛒 ${left} varer på indkøbslisten</small></span><span class="wcGo">›</span></button>`;
}
function surprise(){
  const pool = R.filter(r=>r.c!=='s' && r.t<=60 && !r.tung);
  const r = pool[Math.floor(Math.random()*pool.length)];
  haptic(); openDish(r.id); toast('🎲 Hvad med '+r.n.toLowerCase()+'?');
}

/* ---------------- LISTER ---------------- */
const FILTERS = {
  dk:['🇩🇰 Dansk', r=>r.o==='dk'], int:['🌍 Verden', r=>r.o==='int'],
  kylling:['🐔 Kylling', r=>r.pr==='kylling'||r.pr==='fjerkræ'], okse:['🐄 Okse', r=>r.pr==='okse'||r.pr==='lam'], svin:['🐖 Svin', r=>r.pr==='svin'],
  fisk:['🐟 Fisk', r=>r.pr==='fisk'], veg:['🥕 Vegetar', r=>r.pr==='vegetar'||r.pr==='vegan'],
  vegan:['🌱 Vegansk', r=>r.pr==='vegan'], kod:['🍗 Med kød/fisk', r=>!['vegan','vegetar'].includes(r.pr)],
  hurtig:['⚡ Under 30 min', r=>r.t<=30], let:['🔥 Under 600 kcal', r=>r.kcal<600], let400:['🔥 Under 400 kcal', r=>r.kcal<400],
  born:['👶 Børnevenlig', r=>r.b], suppe:['🍲 Supper & gryder', r=>/^(soup|bowl)/.test(r.look)], pasta:['🍝 Pasta', r=>/^pasta/.test(r.look)],
  fav:['❤️ Favoritter', r=>favs.has(r.id)], kendt:['⭐ Kendte salater', r=>r.kendt], italiensk:['🇮🇹 Italiensk', r=>r.ku==='italiensk'], indisk:['🇮🇳 Indisk', r=>r.ku==='indisk'], asiatisk:['🥢 Asiatisk', r=>r.ku==='asiatisk'], ost:['🧀 Med ost', r=>/ost|feta|parmesan|mozzarella|halloumi|paneer|cheddar|ricotta|gruyère/.test(r.i)]
};
const MODE = {
  k:{t:'Retter', sub:COUNT.k+' retter – danske klassikere og verdens køkken', f:['dk','italiensk','indisk','asiatisk','int','kylling','okse','svin','fisk','hurtig','let','born','fav']},
  s:{t:'Salater', sub:COUNT.s+' salater – de kendte klassikere først', f:['kendt','vegan','kod','hurtig','let400','fav']},
  g:{t:'Grønt', sub:COUNT.g+' vegetarretter med ost, æg og grønt', f:['hurtig','ost','let','born','fav']},
  v:{t:'Grønt', sub:COUNT.v+' veganske retter helt uden animalske produkter', f:['hurtig','suppe','pasta','let','born','fav']},
  search:{t:'Søg', sub:'Søg i alle '+R.length+' retter – navn, beskrivelse og ingredienser', f:['hurtig','let','veg','born']}
};
let active = new Set(), query = '';
function openList(mode, isTab, preset){
  if (!isTab) push();
  listMode = mode; active = new Set(preset||[]); query = '';
  $('listSearch').value = ''; $('listClear').classList.add('hidden');
  setTabHighlight(tabFor(mode));
  renderList(); show('list');
}
function openSearch(){ push(); listMode='search'; active=new Set(); query=''; $('listSearch').value=''; renderList(); show('list'); setTimeout(()=>$('listSearch').focus(),250); }
function onListSearch(v){ query = norm(v); $('listClear').classList.toggle('hidden', !v); renderListGrid(); }
function clearListSearch(){ $('listSearch').value=''; onListSearch(''); }
function toggleChip(k){ active.has(k)?active.delete(k):active.add(k); haptic(); renderList(); }
function renderList(){
  const m = MODE[listMode];
  $('listTop').innerHTML = stack.length ? `<button class="roundBtn" onclick="goBack()" aria-label="Tilbage">←</button><span></span>` : `<div class="logo">food<b>now</b><i></i></div><button class="roundBtn" onclick="openSettings()" aria-label="Indstillinger">⚙️</button>`;
  $('listTitle').textContent = m.t; $('listSub').textContent = m.sub;
  const green = listMode==='g'||listMode==='v'; $('greenSeg').classList.toggle('hidden', !green);
  if (green){ $('segG').setAttribute('aria-selected', listMode==='g'); $('segV').setAttribute('aria-selected', listMode==='v'); }
  $('listSearch').placeholder = listMode==='search' ? 'Søg i alle retter …' : 'Søg i '+(listMode==='g'?'vegetar':listMode==='v'?'vegansk':m.t.toLowerCase())+' …';
  $('listChips').innerHTML = [...new Set([...m.f, ...active])].map(k=>`<button class="chip" aria-pressed="${active.has(k)}" onclick="toggleChip('${k}')">${FILTERS[k][0]}</button>`).join('');
  renderListGrid();
}
function matchesQuery(r){
  if (!query) return true;
  const words = query.split(/\s+/);
  const hay = norm(r.n+' '+r.d+' '+r.i);
  return words.every(w => hay.includes(w));
}
function renderListGrid(){
  let l = listMode==='search' ? R : (listMode==='k' && (active.has('indisk')||active.has('asiatisk')||active.has('italiensk'))) ? R.filter(r=>r.c!=='s') : R.filter(r=>r.c===listMode);
  if (listMode==='s' && !query) l = l.slice().sort((a,b)=>kRank(a)-kRank(b));
  active.forEach(k => { l = l.filter(FILTERS[k][1]); });
  l = l.filter(matchesQuery);
  if (query) l = l.slice().sort((a,b)=> (norm(b.n).includes(query)?1:0)-(norm(a.n).includes(query)?1:0));
  $('listCount').textContent = l.length + (l.length===1?' ret':' retter');
  $('listGrid').innerHTML = l.length ? l.map(r=>card(r)).join('') :
    `<div class="empty"><span class="big">🍽️</span>Ingen retter matcher${query?` "${esc(query)}"`:''}.<br><button onclick="active.clear();clearListSearch();renderList()">Nulstil filtre</button></div>`;
}

/* ---------------- DETALJE ---------------- */
function openDish(id){ push(); current = BYID[id]; renderDetail(); show('detail'); }
function renderDetail(){
  const r = current, rc = recipe(r), n = pers(r.id);
  const fav = favs.has(r.id);
  const planDay = Object.keys(S.plan).find(d => (S.plan[d]||[]).includes(r.id));
  const inShop = S.shop.includes(r.id);
  const dayName = planDay ? (planDay==='x' ? 'senere på ugen' : DAYS[+planDay].toLowerCase()) : '';
  const tags = [
    r.c==='k' && r.o==='dk' ? '🇩🇰 Dansk klassiker' : '', r.ku==='indisk' ? '🇮🇳 Indisk' : r.ku==='asiatisk' ? '🥢 Asiatisk' : '',
    r.pr==='vegan' ? '🌱 Vegansk' : r.pr==='vegetar' ? '🥕 Vegetar' : '', r.b ? '👶 Børnevenlig' : '', r.se==='jul' ? '🎄 Jul' : ''
  ].filter(Boolean);
  const similar = R.filter(x=>x.id!==r.id && !x.tung && x.c===r.c && (x.pr===r.pr || (r.ku && x.ku===r.ku))).sort((a,b)=>Math.abs(a.kcal-r.kcal)-Math.abs(b.kcal-r.kcal)).slice(0,8);
  const shown = rc.ing;
  $('detail').innerHTML = `
  <div class="dHero"><div class="art">${dishArt(r)}</div>
    <div class="dHeroBar"><button class="roundBtn" onclick="goBack()" aria-label="Tilbage">${IC.back}</button>
      <div><button class="roundBtn" onclick="shareDish()" aria-label="Del opskrift">${IC.share}</button>
      <button class="roundBtn" id="dFav" onclick="toggleFav('${r.id}',this);renderDetail()" aria-label="${fav?'Fjern fra':'Gem i'} favoritter">${fav?IC.heartOn:IC.heart}</button></div></div></div>
  <div class="dSheet">
    <h1>${esc(r.n)}</h1>
    <p class="dMeta"><span>${IC.clock} ${r.t} min</span><span>${IC.flame} ${r.kcal} kcal pr. portion</span><span>${IC.level} ${['','Nem','Mellem','Svær'][r.lv]}</span></p>
    <p class="dDesc">${esc(r.d)}</p>

    ${planDay
      ? `<div class="planned"><div><b>${IC.check} På ugeplanen ${esc(dayName)}</b><small>${inShop?'Ingredienserne er på din indkøbsliste':'Ikke på indkøbslisten'}</small></div>
          <button onclick="pickDay('${r.id}')">Skift dag</button></div>
         <button class="cta ghost" onclick="openWeekSeg('shop')">${IC.cart} Se indkøbsliste</button>`
      : `<button class="cta planCta" onclick="pickDay('${r.id}')">${IC.cal} Tilføj til ugeplan</button>
         <p class="ctaHint">Vælg en dag – så kommer ingredienserne automatisk på indkøbslisten.</p>`}

    <div class="servRow"><span>${IC.users}<span>Til <b>${n}</b> ${n===1?'person':'personer'}</span></span>
      <span class="stepper"><button onclick="serv(-1)" aria-label="Færre personer" ${n<=1?'disabled':''}>−</button><output aria-live="polite">${n}</output><button onclick="serv(1)" aria-label="Flere personer" ${n>=16?'disabled':''}>+</button></span></div>

    <h2 class="secTitle">Ingredienser</h2>
    <ul class="ing">${shown.map(x=>{const a=amount(x,n);return `<li class="${x.staple?'stapleRow':''}"><span class="amt ${n!==BASE&&a?'scaled':''}">${a||'–'}</span><span>${esc(x.name)}</span>${x.staple?`<button class="addStaple ${(S.extra||[]).some(e=>norm(e.t)===norm(x.name))?'on':''}" onclick="addExtra('${esc(x.name).replace(/'/g,'')}','${esc(r.n).replace(/'/g,'')}')" aria-label="Læg ${esc(x.name)} på indkøbslisten">${(S.extra||[]).some(e=>norm(e.t)===norm(x.name))?IC.check:'+'}</button>`:''}</li>`}).join('')}</ul>

    <details class="more" id="stepsBox">
      <summary>${IC.book} Vis hele opskriften <small>${rc.steps.length} trin</small></summary>
      <ol class="steps">${rc.steps.map(s=>`<li>${esc(s.t)}${s.timer?`<span class="tm">⏱ ${s.timer/60} min</span>`:''}</li>`).join('')}</ol>
      <button class="cta" onclick="startCook()">${IC.chef} Start madlavning trin for trin</button>
    </details>

    <details class="more">
      <summary>${IC.wine} Vin, tip og mere</summary>
      <div class="moreBody">
        ${r.w && r.w!=='—' ? `<p><b>Vin:</b> ${esc(r.w)}</p><p><b>Alkoholfrit:</b> ${esc(r.a)}</p>`:''}
        ${r.p?`<p><b>Spar tid:</b> ${esc(r.p)}</p>`:''}
        ${tags.length?`<p class="tagLine">${tags.join(' · ')}</p>`:''}
        <p class="note">Kalorier er et skøn pr. portion (én person) inkl. tilbehør. Grå varer er basisvarer, som de fleste har derhjemme. Tryk + for at sætte dem på indkøbslisten.</p>
      </div>
    </details>

    ${similar.length?`<div class="secHead"><h2>Prøv også</h2></div>${rail(similar)}`:''}
  </div>`;
}
function serv(d){ const id=current.id; const n=Math.min(16,Math.max(1,pers(id)+d)); if(n===(S.defServ||BASE)) delete S.serv[id]; else S.serv[id]=n; save(); haptic(); const y=window.scrollY; renderDetail(); window.scrollTo(0,y); }
function toggleShop(id){
  const i = S.shop.indexOf(id);
  S.auto=(S.auto||[]).filter(x=>x!==id);
  if (i>=0){ S.shop.splice(i,1); [...bought].forEach(k=>{ if(k.startsWith(id+':')) bought.delete(k); }); toast('Fjernet fra indkøbslisten'); }
  else { S.shop.push(id); toast('🛒 Lagt på indkøbslisten'); }
  save(); haptic();
  if (cur==='detail'){ const y=window.scrollY; renderDetail(); window.scrollTo(0,y); }
  if (cur==='week'){ const y=window.scrollY; renderWeek(); window.scrollTo(0,y); }
}
function shareDish(){
  const r=current, rc=recipe(r), n=pers(r.id);
  const txt = `${r.n} (${n} pers.)\n\nIngredienser:\n${rc.ing.map(x=>'• '+(amount(x,n)?amount(x,n)+' ':'')+x.name).join('\n')}\n\nSådan gør du:\n${rc.steps.map((s,i)=>(i+1)+'. '+s.t).join('\n')}\n\n🍷 ${r.w}\n\nFra FoodNow-appen`;
  shareText(r.n, txt);
}

/* ---------------- ARK (bottom sheets) ---------------- */
function openSheet(html){ $('sheet').innerHTML = '<div class="grab"></div>'+html; $('sheet').classList.add('show'); $('scrim').classList.add('show'); }
function closeSheet(){ $('sheet').classList.remove('show'); $('scrim').classList.remove('show'); }
/* næste forekomst af hver ugedag (i dag eller senere) – og rækkefølge der starter i dag */
function weekDates(){
  const now = new Date(); const dow = (now.getDay()+6)%7;
  return DAYS.map((_,i)=>{ const d=new Date(now); d.setDate(now.getDate()+((i-dow+7)%7)); return d; });
}
function dayOrder(){ const dow=(new Date().getDay()+6)%7; return DAYS.map((_,k)=>(dow+k)%7); }
function pickDay(id){
  const dates = weekDates(), today=(new Date().getDay()+6)%7;
  const curDay = Object.keys(S.plan).find(d=>(S.plan[d]||[]).includes(id));
  openSheet(`<h2>🗓️ Hvilken dag?</h2><p class="sheetSub">${esc(BYID[id].n)}${S.autoShop!==false?' · ingredienserne kommer automatisk på indkøbslisten':''}</p><div class="sheetList">
    ${dayOrder().map(i=>[DAYS[i],i]).map(([d,i])=>`<button aria-selected="${curDay===String(i)}" onclick="setDay('${id}','${i}')">${d}${i===today?' · i dag':''}<small>${dates[i].getDate()}/${dates[i].getMonth()+1} · ${(S.plan[i]||[]).length?(S.plan[i]||[]).map(x=>BYID[x]?BYID[x].n:'').join(', ').slice(0,28):'ledig'}</small></button>`).join('')}
    <button aria-selected="${curDay==='x'}" onclick="setDay('${id}','x')">Senere på ugen<small>uden fast dag</small></button>
    ${curDay?`<button onclick="setDay('${id}',null)" style="color:var(--brand)">Fjern fra ugeplanen</button>`:''}
  </div>`);
}
function setDay(id, day){
  Object.keys(S.plan).forEach(d=>{ S.plan[d]=(S.plan[d]||[]).filter(x=>x!==id); });
  if (day!==null){ (S.plan[day]=S.plan[day]||[]).push(id); const added=autoAdd(id); toast('✓ '+(day==='x'?'På ugeplanen':DAYS[+day])+(added||S.shop.includes(id)?' · ingredienser på indkøbslisten':'')); }
  else { autoRemove(id); toast('Fjernet fra ugeplanen'); }
  save(); haptic(); closeSheet();
  if (cur==='detail'){ const y=window.scrollY; renderDetail(); window.scrollTo(0,y); }
  if (cur==='week') renderWeek();
}
function openSettings(){
  const m=themeMode;
  openSheet(`<h2>Indstillinger</h2>
  <p class="count">Udseende</p>
  <div class="sheetList">
    <button aria-selected="${m==='auto'}" onclick="setTheme('auto')">🌓 Automatisk<small>følger telefonen</small></button>
    <button aria-selected="${m==='light'}" onclick="setTheme('light')">☀️ Dagtilstand<small>lys</small></button>
    <button aria-selected="${m==='dark'}" onclick="setTheme('dark')">🌙 Nattilstand<small>mørk</small></button>
  </div>
  <p class="count">Ugeplan</p>
  <div class="toggleRow" style="background:var(--card);box-shadow:var(--shadow);border-radius:var(--r-sm);padding:12px 14px;margin:0 0 8px"><span>Læg ugeplanens retter automatisk på indkøbslisten</span>
    <button class="switch" role="switch" aria-checked="${S.autoShop!==false}" onclick="S.autoShop=!(S.autoShop!==false);save();openSettings()" aria-label="Automatisk indkøbsliste"></button></div>
  <p class="count">Standard antal personer</p>
  <div class="servings" style="margin-top:0"><span class="lbl"><b>👥 ${S.defServ} personer</b><small>Bruges når du åbner en ny opskrift</small></span>
    <span class="stepper"><button onclick="setDef(-1)" ${S.defServ<=1?'disabled':''} aria-label="Færre">−</button><output>${S.defServ}</output><button onclick="setDef(1)" ${S.defServ>=12?'disabled':''} aria-label="Flere">+</button></span></div>
  <div class="sheetList"><button onclick="openCredits()">📷 Billedkreditter<small>›</small></button></div>
  <p class="about"><b>FoodNow</b> · version 1.0<br>${R.length} opskrifter skrevet til FoodNow: ${COUNT.k} danske favoritter, ${COUNT.s} salater, ${COUNT.g} vegetarretter og ${COUNT.v} veganske retter.
  Kalorier er vejledende skøn. Dine favoritter, ugeplan og indkøbsliste gemmes kun på din egen telefon – vi indsamler ingen data.<br><br>Nyd alkohol med måde. Vinforslag er inspiration til voksne.</p>`);
}
function openCredits(){
  const l = R.filter(r=>IMG[r.id]);
  openSheet(`<h2>📷 Billedkreditter</h2><p class="about" style="margin-top:0">Tak til fotograferne bag billederne i FoodNow. Billederne bruges under Creative Commons-licenser og er tilpasset appen.</p>
  <div class="credits">${l.map(r=>`<p><b>${esc(r.n)}</b><br>${esc(IMG[r.id].title||'')} – ${esc(IMG[r.id].by||'ukendt')} · <a href="${esc(IMG[r.id].licUrl||'#')}" target="_blank" rel="noopener">${esc(IMG[r.id].lic)}</a> · <a href="${esc(IMG[r.id].src)}" target="_blank" rel="noopener">kilde</a></p>`).join('')}</div>`);
}
function setDef(d){ S.defServ=Math.min(12,Math.max(1,(S.defServ||4)+d)); save(); haptic(); openSettings(); }

/* ---------------- MIN UGE ---------------- */
let seg = 'plan', hideBought = false;
function setSeg(s){ seg=s; haptic(); renderWeek(); }
function openWeekSeg(s){ seg=s; tab('week'); }
function renderWeek(){
  ['plan','shop','fav'].forEach(x=>$('seg'+x[0].toUpperCase()+x.slice(1)).setAttribute('aria-selected', x===seg));
  $('weekBody').innerHTML = seg==='plan' ? planHTML() : seg==='shop' ? shopHTML() : favHTML();
}
const openIngs = new Set();
function thumbRow(r, extra, removeFn){
  const n=pers(r.id), open=openIngs.has(r.id), inShop=S.shop.includes(r.id);
  return `<div class="dayDish">
    <button class="thumb" onclick="openDish('${r.id}')" aria-label="Åbn ${esc(r.n)}">${dishArt(r)}</button>
    <button class="dTxt" onclick="openDish('${r.id}')"><b>${esc(r.n)}</b><small>⏱ ${r.t} min · 👥 ${n} pers.${extra||''}</small></button>
    <button class="iconX" onclick="${removeFn}" aria-label="Fjern ${esc(r.n)} fra ugeplanen">✕</button></div>
    <div class="dayTools">
      <button onclick="toggleIngs('${r.id}')">${open?'▾':'▸'} Ingredienser</button>
      ${inShop?'<span class="onList">✓ På indkøbslisten</span>':`<button onclick="toggleShop('${r.id}')">🛒 Læg på indkøbslisten</button>`}
    </div>
    ${open?`<ul class="miniIng">${recipe(r).ing.map(x=>{const a=amount(x,n);return `<li><b>${a||''}</b> ${esc(x.name)}${x.staple?' <span class="staple">🏠</span>':''}</li>`}).join('')}</ul>`:''}`;
}
function toggleIngs(id){ openIngs.has(id)?openIngs.delete(id):openIngs.add(id); haptic(); const y=window.scrollY; renderWeek(); window.scrollTo(0,y); }
function planHTML(){
  const dates = weekDates(), today=(new Date().getDay()+6)%7;
  const all = Object.values(S.plan).flat().filter(id=>BYID[id]);
  const kcal = all.reduce((s,id)=>s+BYID[id].kcal,0);
  let h = `<div class="weekActions">
    ${all.length && all.some(id=>!S.shop.includes(id)) ? `<button class="primary" onclick="planToShop()">🛒 Læg alt på indkøbslisten</button>` : `<button class="primary" onclick="setSeg('shop')">🛒 Se indkøbsliste</button>`}
    <button onclick="fillWeek()">🎲 Fyld tomme hverdage</button></div>
    <p class="count">${all.length} ${all.length===1?'ret':'retter'} planlagt${all.length?` · gns. ${Math.round(kcal/all.length)} kcal pr. portion`:''}</p>`;
  dayOrder().forEach(i=>{ const d=DAYS[i];
    const l=(S.plan[i]||[]).filter(id=>BYID[id]);
    h+=`<div class="day"><div class="dayHead ${i===today?'today':''}"><b>${d}${i===today?' · i dag':''}</b><small>${dates[i].getDate()}/${dates[i].getMonth()+1}</small></div>
      ${l.map(id=>thumbRow(BYID[id],'',`setDay('${id}',null)`)).join('')}
      ${l.length?'':`<button class="addDay" onclick="suggestDay(${i})">+ Foreslå en ret 🎲</button>`}</div>`;
  });
  const x=(S.plan.x||[]).filter(id=>BYID[id]);
  if (x.length) h+=`<div class="day"><div class="dayHead"><b>Senere på ugen</b></div>${x.map(id=>thumbRow(BYID[id],'',`setDay('${id}',null)`)).join('')}</div>`;
  return h;
}
/* retter i ugeplanen lægges automatisk på indkøbslisten (kan slås fra i Indstillinger) */
function autoAdd(id){
  if (!S.autoShop || S.shop.includes(id)) return false;
  S.shop.push(id); S.auto=[...new Set([...(S.auto||[]), id])]; return true;
}
function autoRemove(id){
  if (Object.values(S.plan).flat().includes(id)) return;
  if ((S.auto||[]).includes(id)){ S.shop=S.shop.filter(x=>x!==id); S.auto=S.auto.filter(x=>x!==id); [...bought].forEach(k=>{ if(k.startsWith(id+':')) bought.delete(k); }); }
}
function randomDish(exclude){
  const used = new Set(exclude), prs = Object.values(S.plan).flat().map(id=>BYID[id]&&BYID[id].pr);
  let pool = R.filter(r=>r.c!=='s' && !used.has(r.id) && r.t<=60);
  const last = prs[prs.length-1]; const p2 = pool.filter(r=>r.pr!==last); if (p2.length) pool=p2;
  return pool[Math.floor(Math.random()*pool.length)];
}
function suggestDay(i){ const r=randomDish(Object.values(S.plan).flat()); (S.plan[i]=S.plan[i]||[]).push(r.id); autoAdd(r.id); save(); haptic(); renderWeek(); toast('🎲 '+DAYS[i]+': '+r.n); }
function fillWeek(){
  let n=0; for(let i=0;i<5;i++){ if(!(S.plan[i]||[]).length){ const r=randomDish(Object.values(S.plan).flat()); (S.plan[i]=S.plan[i]||[]).push(r.id); autoAdd(r.id); n++; } }
  save(); haptic('success'); renderWeek(); toast(n?`🎲 ${n} hverdage fyldt ud – byt gerne om`:'Hverdagene er allerede planlagt');
}
function planToShop(){
  const ids = Object.values(S.plan).flat().filter(id=>BYID[id] && !S.shop.includes(id));
  ids.forEach(id=>S.shop.push(id)); save(); haptic('success');
  toast(ids.length?`🛒 ${ids.length} retter lagt på indkøbslisten`:'Alt er allerede på listen'); if(ids.length){ seg='shop'; renderWeek(); }
}
function shopItems(){
  const groups = {};
  S.shop.filter(id=>BYID[id]).forEach(id=>{
    const r=BYID[id], n=pers(id);
    recipe(r).ing.forEach((x,i)=>{
      if (x.staple && !S.showStaples) return;
      const a = aisleOf(x.name);
      (groups[a]=groups[a]||[]).push({key:id+':'+i, txt:(amount(x,n)?amount(x,n)+' ':'')+x.name, dish:r.n, name:x.name});
    });
  });
  (S.extra||[]).forEach(e=>{
    const a = aisleOf(e.t);
    (groups[a]=groups[a]||[]).push({key:'x:'+e.id, txt:e.t, dish:e.from?('Fra '+e.from):'Egen vare', name:e.t, extra:e.id});
  });
  return groups;
}
const AORDER = ['🥬 Frugt & grønt','🥩 Kød, fisk & fjerkræ','🧀 Mejeri, æg & plantedrik','🍞 Brød','❄️ Frost','🥫 Kolonial & tørvarer','🧴 Husholdning & andet'];
function shopHTML(){
  const dishes = S.shop.filter(id=>BYID[id]);
  const have = new Set((S.extra||[]).map(e=>norm(e.t)));
  const addBox = `<div class="addBox"><label class="search" style="margin:8px 0 6px"><span>➕</span><input id="extraInput" type="text" placeholder="Tilføj vare, fx mælk, 2 l juice, kaffe" autocomplete="off" enterkeyhint="done"
      onkeydown="if(event.key==='Enter'){addExtra(this.value);}"><button class="addBtn" onclick="addExtra($('extraInput').value)">Tilføj</button></label>
    <div class="chips" style="margin-top:0">${QUICK.filter(q=>!have.has(q)).map(q=>`<button class="chip" onclick="addExtra('${q}')">+ ${q}</button>`).join('')}</div></div>`;
  if (!dishes.length && !(S.extra||[]).length) return addBox + `<div class="empty"><span class="big">🛒</span>Indkøbslisten er tom.<br>Skriv dine egne varer ovenfor, åbn en ret og tryk "Læg på listen" – eller læg hele ugeplanen på.<br><button onclick="tab('k')">Find retter</button></div>`;
  const g = shopItems(); let left=0, done=0;
  Object.values(g).flat().forEach(it=>bought.has(it.key)?done++:left++);
  let h = addBox + `<div class="shopDishes">${dishes.map(id=>`<span class="sdPill"><span class="thumb">${dishArt(BYID[id])}</span>${esc(BYID[id].n.split(' ').slice(0,3).join(' '))} · ${pers(id)}p<button onclick="toggleShop('${id}')" aria-label="Fjern ${esc(BYID[id].n)}">✕</button></span>`).join('')}</div>
    <div class="weekActions"><button class="primary" onclick="shareShop()">${IC.share} Del listen</button>${hideBought&&done?`<button onclick="hideBought=false;renderWeek()">👁️ Vis købte (${done})</button>`:`<button onclick="clearBought()">🧹 Ryd købte</button>`}</div>
    <div class="toggleRow"><span>${left} varer tilbage${done?` · ${done} købt`:''}</span><span style="display:flex;align-items:center;gap:8px">Vis basisvarer <button class="switch" role="switch" aria-checked="${!!S.showStaples}" onclick="S.showStaples=!S.showStaples;save();renderWeek()" aria-label="Vis basisvarer"></button></span></div>`;
  AORDER.filter(a=>g[a]).forEach(a=>{
    const items = g[a].filter(it=>!(hideBought && bought.has(it.key))).sort((x,y)=>(bought.has(x.key)-bought.has(y.key)) || x.name.localeCompare(y.name,'da'));
    if (!items.length) return;
    h += `<div class="aisle"><h3>${a}</h3>${items.map(it=>it.extra
      ? `<div class="item ${bought.has(it.key)?'bought':''}"><button class="itemMain" onclick="toggleBought('${it.key}')"><span class="check"></span><span class="txt"><span>${esc(it.txt)}</span><small>✏️ ${esc(it.dish)}</small></span></button><button class="iconX" onclick="rmExtra('${it.extra}')" aria-label="Slet ${esc(it.txt)}">✕</button></div>`
      : `<button class="item ${bought.has(it.key)?'bought':''}" onclick="toggleBought('${it.key}')"><span class="check"></span><span class="txt"><span>${esc(it.txt)}</span><small>${esc(it.dish)}</small></span></button>`).join('')}</div>`;
  });
  return h;
}
/* ---------- egne varer på indkøbslisten ---------- */
const QUICK = ['mælk','brød','æg','smør','kaffe','bananer','æbler','ost','yoghurt','havregryn','juice','toiletpapir','køkkenrulle','opvasketabs'];
function addExtra(v, from){
  const items = String(v||'').split(',').map(x=>x.trim()).filter(Boolean);
  if (!items.length){ toast('Skriv en vare først'); return; }
  S.extra = S.extra||[];
  let added=0;
  items.forEach(t=>{ if(!S.extra.some(e=>norm(e.t)===norm(t))){ S.extra.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,6), t, from:from||''}); added++; } });
  save(); haptic();
  toast(added ? `🛒 ${added===1?items[0]:added+' varer'} lagt på listen` : 'Står allerede på listen');
  if (cur==='week'){ const y=window.scrollY; renderWeek(); window.scrollTo(0,y); const i=$('extraInput'); if(i && !from){ i.value=''; i.focus(); } }
  else if (cur==='detail'){ const y=window.scrollY; renderDetail(); window.scrollTo(0,y); }
}
function rmExtra(id){
  S.extra=(S.extra||[]).filter(e=>e.id!==id); bought.delete('x:'+id); save(); haptic();
  const y=window.scrollY; renderWeek(); window.scrollTo(0,y);
}
function toggleBought(k){ bought.has(k)?bought.delete(k):bought.add(k); save(); haptic(); const y=window.scrollY; renderWeek(); window.scrollTo(0,y); }
function clearBought(){
  const ks=[...bought]; if(!ks.length){ toast('Intet er krydset af endnu'); return; }
  // fjern retter hvor alt er købt
  const before=S.shop.length;
  S.shop = S.shop.filter(id=>{ const r=BYID[id]; if(!r) return false; const need=recipe(r).ing.map((x,i)=>({x,k:id+':'+i})).filter(o=>!o.x.staple||S.showStaples); return !need.every(o=>bought.has(o.k)); });
  const ex0=(S.extra||[]).length;
  S.extra=(S.extra||[]).filter(e=>!bought.has('x:'+e.id));
  [...bought].forEach(k=>{ if(!S.shop.includes(k.split(':')[0])) bought.delete(k); });
  const exGone = ex0 - S.extra.length;
  hideBought = true; save(); renderWeek();
  const gone=before-S.shop.length; toast(gone||exGone?`🧹 ${gone?gone+' færdigkøbte retter':''}${gone&&exGone?' og ':''}${exGone?exGone+' egne varer':''} fjernet`:'🧹 Købte varer er skjult');
}
function shareShop(){
  const g=shopItems(); let t='🛒 Indkøbsliste fra FoodNow\n';
  AORDER.filter(a=>g[a]).forEach(a=>{ const l=g[a].filter(it=>!bought.has(it.key)); if(!l.length) return; t+=`\n${a}\n`+l.map(it=>'• '+it.txt).join('\n')+'\n'; });
  shareText('Indkøbsliste', t.trim());
}
function favHTML(){
  const l=[...favs].map(id=>BYID[id]).filter(Boolean);
  if (!l.length) return `<div class="empty"><span class="big">❤️</span>Du har ingen favoritter endnu.<br>Tryk på hjertet på en ret for at gemme den her.</div>`;
  return `<p class="count">${l.length} favoritter</p><div class="grid">${l.map(r=>card(r)).join('')}</div>`;
}
function updateWeekDot(){
  const n = S.shop.filter(id=>BYID[id]).length + (S.extra||[]).filter(e=>!bought.has('x:'+e.id)).length;
  const d=$('weekDot'); if(!d) return; d.textContent=n; d.classList.toggle('hidden', !n);
}

/* ---------------- KØLESKAB ---------------- */
const FRIDGE_SUG = ['kylling','hakket oksekød','laks','bacon','kartofler','ris','pasta','løg','æg','fløde','tomater','peberfrugt','broccoli','kikærter','linser','feta','spinat','squash'];
function openFridge(){ push(); renderFridge(); show('fridge'); }
function addFridge(v){ v=norm(v); if(!v) return; v.split(',').map(x=>x.trim()).filter(Boolean).forEach(x=>{ if(!S.fridge.includes(x)) S.fridge.push(x); }); save(); haptic(); renderFridge(); }
function rmFridge(i){ S.fridge.splice(i,1); save(); renderFridge(); }
function renderFridge(){
  $('fridgeChips').innerHTML = S.fridge.map((x,i)=>`<button class="fChip" onclick="rmFridge(${i})" aria-label="Fjern ${esc(x)}">${esc(x)} ✕</button>`).join('') +
    FRIDGE_SUG.filter(x=>!S.fridge.includes(x)).slice(0, S.fridge.length?8:18).map(x=>`<button class="fChip sug" onclick="addFridge('${x}')">+ ${x}</button>`).join('');
  if (!S.fridge.length){ $('fridgeResults').innerHTML = `<div class="empty"><span class="big">🧊</span>Tilføj et par råvarer, fx <b>kylling</b> og <b>ris</b>.</div>`; return; }
  const res = R.map(r=>{
    const need = recipe(r).ing.filter(x=>!x.staple);
    const have = need.filter(x=>{ const nm=norm(x.name), w=nm.split(/[ ,]/)[0]; return S.fridge.some(f=>nm.includes(f) || (w.length>=4 && f.includes(w))); });
    return {r, need, have, score: have.length/need.length + have.length*.05};
  }).filter(o=>o.have.length).sort((a,b)=>b.score-a.score).slice(0,20);
  $('fridgeResults').innerHTML = `<p class="count">${res.length} forslag</p>` + (res.map(o=>{
    const miss=o.need.filter(x=>!o.have.includes(x)).map(x=>x.name.split(',')[0]);
    return `<button class="matchRow" onclick="openDish('${o.r.id}')"><span class="thumb">${dishArt(o.r)}</span><span class="mTxt"><b>${esc(o.r.n)}</b>
      <small>Du har ${o.have.length} af ${o.need.length} råvarer${miss.length?' · mangler: '+esc(miss.slice(0,4).join(', '))+(miss.length>4?' …':''):' – du har det hele! 🎉'}</small>
      <span class="bar"><i style="width:${Math.round(o.have.length/o.need.length*100)}%"></i></span></span></button>`;
  }).join('') || `<div class="empty">Ingen retter matcher endnu – prøv en anden råvare.</div>`);
}

/* ---------------- KOKKETILSTAND ----------------
   Timere er knyttet til trinnet og fortsætter med at køre, når man går videre.
   Flere timere kan køre samtidig; de vises som chips øverst. */
let idx=0, audioCtx=null, tick=null, cookDish=null;
const timers = {};   // stepIdx -> {total, left, endAt, running, ringing}
function startCook(){
  idx=0; cookDish=current; Object.keys(timers).forEach(k=>delete timers[k]);
  push(); show('cook'); renderStep(); keepAwake(true);
}
function exitCook(){
  const running = Object.values(timers).some(t=>t.running);
  if (running && !confirm('Der kører stadig en timer. Vil du afslutte madlavningen alligevel?')) return;
  Object.keys(timers).forEach(k=>{ cancelNotif(+k); delete timers[k]; });
  clearInterval(tick); tick=null; keepAwake(false); goBack();
}
function cookStep(d){
  const st=recipe(cookDish).steps; const n=idx+d;
  if (n<0) return;
  if (n>=st.length){ haptic('success'); toast('🎉 Velbekomme!'); exitCook(); return; }
  idx=n; haptic(); renderStep(); window.scrollTo(0,0);
}
function jumpStep(i){ idx=i; haptic(); renderStep(); }
const clock = s => String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
function timerOf(i){
  const s=recipe(cookDish).steps[i]; if(!s||!s.timer) return null;
  return timers[i] || (timers[i]={total:s.timer,left:s.timer,endAt:0,running:false,ringing:false});
}
function renderStep(){
  const r=cookDish, rc=recipe(r), s=rc.steps[idx], tot=rc.steps.length, n=pers(r.id);
  $('cookTitle').textContent = `Trin ${idx+1} af ${tot} · ${n} pers.`;
  $('progress').innerHTML = rc.steps.map((_,i)=>`<span class="${i<=idx?'done':''}"></span>`).join('');
  $('cookStep').textContent = s.t;
  $('prevBtn').disabled = idx===0;
  $('nextBtn').textContent = idx===tot-1 ? 'Færdig 🎉' : 'Næste';
  const t = timerOf(idx);
  $('timerBox').innerHTML = t ? `<div class="timer ${t.ringing?'ringing':''}" id="timer"><div class="clock" id="clock">${t.ringing?'Klar! ⏰':clock(t.left)}</div>
    <button id="timerBtn" onclick="toggleTimer(${idx})">${t.ringing?'Nulstil':t.running?'Pause':t.left<t.total?'Fortsæt':'Start timer'}</button><button onclick="resetTimer(${idx})">Nulstil</button>
    ${t.running?'<p class="timerHint">Timeren kører videre, når du går til næste trin.</p>':''}</div>` : '';
  renderTimerChips();
  const ci=$('cookIngs'), open=ci.open;
  ci.innerHTML = `<summary>Ingredienser til ${n} ${n===1?'person':'personer'}</summary><ul>${rc.ing.map(x=>{const a=amount(x,n);return `<li>${a?`<b>${a}</b> `:''}${esc(x.name)}</li>`}).join('')}</ul>`;
  ci.open = open;
}
function renderTimerChips(){
  const el=$('timerChips'); if(!el) return;
  const list=Object.entries(timers).filter(([i,t])=>(t.running||t.ringing) && +i!==idx);
  el.innerHTML = list.map(([i,t])=>`<button class="tChip ${t.ringing?'ringing':''}" onclick="jumpStep(${i})">⏱ Trin ${+i+1}: ${t.ringing?'Klar!':clock(t.left)}</button>`).join('');
}
function ensureTick(){
  if (tick) return;
  tick = setInterval(()=>{
    let any=false;
    Object.entries(timers).forEach(([i,t])=>{
      if (!t.running) return; any=true;
      t.left = Math.max(0, Math.ceil((t.endAt-Date.now())/1000));
      if (t.left<=0){ t.running=false; t.ringing=true; ring(+i); if(+i===idx) renderStep(); }
    });
    if (cur==='cook'){ const t=timers[idx], c=$('clock'); if (t && c && t.running) c.textContent=clock(t.left); renderTimerChips(); }
    if (!any && !Object.values(timers).some(t=>t.running)) { clearInterval(tick); tick=null; }
  }, 250);
}
function toggleTimer(i){
  const t=timerOf(i); if(!t) return;
  if (t.ringing){ resetTimer(i); return; }
  if (t.running){ t.running=false; t.left=Math.max(0,Math.ceil((t.endAt-Date.now())/1000)); cancelNotif(i); }
  else { if (t.left<=0) t.left=t.total; t.running=true; t.endAt=Date.now()+t.left*1000; unlockAudio(); scheduleNotif(i, t.endAt); ensureTick(); }
  haptic(); renderStep();
}
function resetTimer(i){ const t=timerOf(i); if(!t) return; t.running=false; t.ringing=false; t.left=t.total; cancelNotif(i); renderStep(); }
const NID = 7001; let notifAsked=false;
async function scheduleNotif(i, at){
  const st = recipe(cookDish).steps[i].t;
  const title='⏰ Timeren er færdig', body=`${cookDish.n} – trin ${i+1}: `+(st.length>80?st.slice(0,78)+'…':st);
  const ln = plugin('LocalNotifications');
  if (ln){ try{
      let p = await ln.checkPermissions(); if (p.display!=='granted') p = await ln.requestPermissions();
      if (p.display!=='granted'){ if(!notifAsked){ toast('Slå notifikationer til i Indstillinger for at få besked'); notifAsked=true; } return; }
      await ln.cancel({notifications:[{id:NID+i}]}).catch(()=>{});
      await ln.schedule({notifications:[{id:NID+i,title,body,schedule:{at:new Date(at),allowWhileIdle:true}}]});
    }catch(e){} return; }
  try { if ('Notification' in window && Notification.permission==='default' && !notifAsked){ notifAsked=true; Notification.requestPermission(); } } catch(e){}
}
function cancelNotif(i){ const ln=plugin('LocalNotifications'); if(ln) ln.cancel({notifications:[{id:NID+i}]}).catch(()=>{}); }
function unlockAudio(){ try{ audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)(); if(audioCtx.state==='suspended') audioCtx.resume(); }catch(e){} }
function ring(i){
  haptic('success');
  if (cur==='cook' && i!==idx) toast(`⏰ Timeren til trin ${i+1} er færdig`);
  try{ if(audioCtx){ const t0=audioCtx.currentTime; [0,.3,.6,1.3,1.6,1.9].forEach(d=>{ const o=audioCtx.createOscillator(), g=audioCtx.createGain(); o.frequency.value=880; g.gain.setValueAtTime(.0001,t0+d); g.gain.exponentialRampToValueAtTime(.35,t0+d+.02); g.gain.exponentialRampToValueAtTime(.0001,t0+d+.24); o.connect(g).connect(audioCtx.destination); o.start(t0+d); o.stop(t0+d+.3); }); } }catch(e){}
  try{ if(!plugin('LocalNotifications') && 'Notification' in window && Notification.permission==='granted' && document.hidden) new Notification('⏰ Timeren er færdig',{body:cookDish.n+' – trin '+(i+1)}); }catch(e){}
}

/* ---------------- START ---------------- */
applyTheme();
$('homeSearchTxt').textContent = `Søg i ${R.length} retter, fx "kylling" eller "laks"`;
renderHome();
updateWeekDot();
document.addEventListener('keydown', e=>{ if(e.key==='Escape'){ if($('sheet').classList.contains('show')) closeSheet(); else if(cur==='cook') exitCook(); else if(cur!=='home' && !TABS.includes(cur)) goBack(); } });
