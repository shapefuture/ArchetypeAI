const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];

/* ====== I18N ====== */
let lang='en';
const T={
  en:{
    navProblem:'Problem',navMatrix:'Matrix',navCodex:'Codex',navEngine:'Engine',
    langBtn:'EN',startTest:'Start Test',
    pill:'64 questions · 4 axes · living map',
    heroL1:'Map the',heroEm:'chaos',heroL2:'of',heroL3:'connection.',
    lead:'Stop guessing why relationships loop. Decode your archetypal physics through a playful, interactive relational universe.',
    ctaTest:'Begin the Test ✦',exploreMatrix:'Explore Matrix ↓',
    statArch:'Archetypes',statAxes:'Axes',statTime:'~10m',statTimeLabel:'To clarity',
    ticker:'Uncover patterns ✦ Break the loop ✦ Know thyself ✦ Relational geometry ✦ ',
    probLabel:'THE PROBLEM',probTitle:'Why does the same story keep returning?',
    probSub:'The loop is not a curse. It is geometry you have not seen yet.',
    prob0t:'The Ghosting Loop',prob0d:'You act as an Anchor while choosing Wanderers. Physics says they drift.',
    prob1t:'Catalyst Collision',prob1d:'Two Catalysts create fire: great for ignition, brutal for execution.',
    prob2t:'Echo Chamber',prob2d:'All Mirrors, no initiators. Consensus becomes a velvet trap.',
    prob3t:'Invisible Triggers',prob3d:'Conflict detonates because the signals are unread until too late.',
    prob4t:'Compassion Fatigue',prob4d:'The Anchor carries everyone while the system forgets to refill them.',
    prob5t:'Asymmetric Orbit',prob5d:'One person invests intensely; the other holds loosely.',
    matLabel:'THE TOOL',matTitle:'The Synergy Matrix',
    matSub:'Select two archetypes. Watch the relational weather compute in real time.',
    resultEmpty:'Awaiting input',resultEmptyDesc:'Choose two nodes to calculate resonance, friction and growth edge.',
    resultOne:'One more node',resultOneDesc:'Select a second archetype to compute the relational field.',
    resHigh:'High Resonance',resCharged:'Charged Complement',resFriction:'Creative Friction',
    resSparks:'expect sparks, explicit agreements and repair rituals.',
    resFlow:'strong flow; keep difference visible so comfort does not become autopilot.',
    capLabel:'CAPABILITIES',capTitle:'Everything you need to decode connection.',
    cap1t:'Interactive universe',cap1d:'Orbit, zoom and inspect a dynamic archetype constellation.',
    cap2t:'Local insight engine',cap2d:'Instant pattern summaries without API keys or backend dependencies.',
    cap3t:'Four-axis profile',cap3d:'Agency, Temperature, Focus and Attachment plotted as a personal vector.',
    cap4t:'Shareable report',cap4d:'Exportable JSON-style results for coaching, journaling and reflection.',
    codexLabel:'THE CODEX',codexTitle:'Eight entities.',codexTitle2:'Infinite configurations.',
    codexSub:'Tap cards to flip. Drag sideways on mobile.',
    engLabel:'THE ENGINE',engTitle:'Your relational universe, made visible.',
    engSub:'Drag the stage. The constellation reacts with buttery orbital motion.',
    engLive:'LIVE RENDER',engDrag:'drag to orbit',
    methodTitle:'Three steps to clarity.',
    step1t:'Take the test',step1d:'Answer calibrated prompts about relational instinct.',
    step2t:'Compute',step2d:'Your answers become a four-axis archetypal vector.',
    step3t:'Read the map',step3d:'See loops, allies, tensions and growth edges.',
    footTitle:'Discover your',footEm:'universe.',footSub:'Free, confidential, visual and surprisingly fun.',
    footCta:'Begin the Test ✦',footCopy:'© 2026 Archetype.ai · Relational Engine',
    footTop:'Top',
    quizTitle:'Micro Test',quizSub:'Demo engine: move each slider, then reveal your archetype.',
    quizAgency:'Agency',quizTemp:'Temperature',quizFocus:'Focus',quizAttach:'Attachment',
    quizOut:'Adjust sliders…',quizCalc:'Reveal',
    quizPrefix:'You are closest to',quizSuffix:'—',
    axisAgency:'Agency',axisTemp:'Temp',axisFocus:'Focus',axisAttach:'Attach',
    the:'The',
    resonance:'resonance',
    backupOk:'Backup loaded successfully!',backupFail:'Invalid backup file. Please upload a valid JSON backup.',
  },
  ru:{
    navProblem:'Проблема',navMatrix:'Матрица',navCodex:'Кодекс',navEngine:'Движок',
    langBtn:'RU',startTest:'Тест',
    pill:'64 вопроса · 4 оси · живая карта',
    heroL1:'Нанеси на карту',heroEm:'хаос',heroL2:'в',heroL3:'связях.',
    lead:'Хватит гадать, почему отношения ходят по кругу. Расшифруй свою архетипическую физику через игровую вселенную связей.',
    ctaTest:'Начать тест ✦',exploreMatrix:'Матрица ↓',
    statArch:'Архетипов',statAxes:'Осей',statTime:'~10м',statTimeLabel:'до ясности',
    ticker:'Раскрой паттерны ✦ Разорви петлю ✦ Познай себя ✦ Геометрия связей ✦ ',
    probLabel:'ПРОБЛЕМА',probTitle:'Почему одна и та же история возвращается?',
    probSub:'Петля — не проклятие. Это геометрия, которую ты ещё не разглядел.',
    prob0t:'Петля игнора',prob0d:'Действуешь как Якорь, выбирая Странников. Физика говорит: они уплывают.',
    prob1t:'Столкновение катализаторов',prob1d:'Два Катализатора создают огонь: здорово для зажигания, губительно для исполнения.',
    prob2t:'Эхо-камера',prob2d:'Одни Зеркала, ни одного инициатора. Консенсус становится бархатной ловушкой.',
    prob3t:'Невидимые триггеры',prob3d:'Конфликт взрывается, потому что сигналы не читаются до того, как становится поздно.',
    prob4t:'Выгорание эмпатии',prob4d:'Якорь несёт всех, пока система забывает его пополнить.',
    prob5t:'Асимметричная орбита',prob5d:'Один вкладывается интенсивно; другой держится свободно.',
    matLabel:'ИНСТРУМЕНТ',matTitle:'Матрица синергии',
    matSub:'Выбери два архетипа. Наблюдай, как реляционная погода вычисляется в реальном времени.',
    resultEmpty:'Ожидание ввода',resultEmptyDesc:'Выбери два узла, чтобы вычислить резонанс, трение и зону роста.',
    resultOne:'Ещё один узел',resultOneDesc:'Выбери второй архетип для вычисления реляционного поля.',
    resHigh:'Высокий резонанс',resCharged:'Заряженное дополнение',resFriction:'Креативное трение',
    resSparks:'ожидай искр, явных договорённостей и ритуалов восстановления.',
    resFlow:'сильный поток; держи различия видимыми, чтобы уют не стал автопилотом.',
    capLabel:'ВОЗМОЖНОСТИ',capTitle:'Всё, что нужно для расшифровки связей.',
    cap1t:'Интерактивная вселенная',cap1d:'Орбита, масштаб и исследование динамического созвездия архетипов.',
    cap2t:'Локальный анализ',cap2d:'Мгновенные выводы о паттернах без API-ключей и серверов.',
    cap3t:'Четырёхосевой профиль',cap3d:'Агентность, Температура, Фокус и Привязанность как личный вектор.',
    cap4t:'Отчёт для обмена',cap4d:'Экспортируемые JSON-результаты для коучинга, дневника и рефлексии.',
    codexLabel:'КОДЕКС',codexTitle:'Восемь сущностей.',codexTitle2:'Бесконечные конфигурации.',
    codexSub:'Нажми на карточку, чтобы перевернуть. Перетаскивай на мобильном.',
    engLabel:'ДВИЖОК',engTitle:'Твоя вселенная связей, сделанная видимой.',
    engSub:'Перетаскивай сцену. Созвездие реагирует плавной орбитальностью.',
    engLive:'ПРЯМОЙ ЭФИР',engDrag:'перетаскивай для орбиты',
    methodTitle:'Три шага к ясности.',
    step1t:'Пройди тест',step1d:'Ответь на калиброванные вопросы о реляционном инстинкте.',
    step2t:'Вычисли',step2d:'Твои ответы станут четырёхосевым архетипическим вектором.',
    step3t:'Читай карту',step3d:'Увидь петли, союзников, напряжения и зоны роста.',
    footTitle:'Открой свою',footEm:'вселенную.',footSub:'Бесплатно, конфиденциально, наглядно и удивительно увлекательно.',
    footCta:'Начать тест ✦',footCopy:'© 2026 Archetype.ai · Реляционный движок',
    footTop:'Наверх',
    quizTitle:'Микро-тест',quizSub:'Демо-движок: двигай слайдеры, затем раскрой свой архетип.',
    quizAgency:'Агентность',quizTemp:'Температура',quizFocus:'Фокус',quizAttach:'Привязанность',
    quizOut:'Настрой слайдеры…',quizCalc:'Раскрыть',
    quizPrefix:'Ты ближе всего к',quizSuffix:'—',
    axisAgency:'Агент.',axisTemp:'Темп.',axisFocus:'Фокус',axisAttach:'Привяз.',
    the:'',
    resonance:'резонанс',
    backupOk:'Бэкап загружен успешно!',backupFail:'Неверный формат файла. Загрузите корректный JSON-бэкап.',
  }
};

function t(key){return T[lang][key]||T.en[key]||key}

/* Archetype data: [nameEN, roleEN, color, svgPath, [agency,temp,focus,attach], descEN, nameRU, roleRU, descRU] */
const A=[
  ['Wanderer','Seeker','#FFD93D','M50 8 C78 8 92 28 88 52 C85 76 68 92 50 92 C32 92 15 76 12 52 C8 28 22 8 50 8 Z',[55,45,40,20],'Drifts through social constellations, absorbing context before choosing direction.','Странник','Искатель','Дрейфует через социальные созвездия, впитывая контекст прежде чем выбрать направление.'],
  ['Catalyst','Disruptor','#FF6B5B','M50 5 L72 28 L95 22 L78 50 L95 78 L68 68 L50 95 L32 68 L5 78 L22 50 L5 22 L28 28 Z',[90,85,30,25],'Sparks sudden shifts. Volatile, brilliant, transformative and hard to ignore.','Катализатор','Нарушитель','Провоцирует внезапные сдвиги. Волатильный, блестящий, трансформирующий — его сложно игнорировать.'],
  ['Anchor','Stabilizer','#7DD3FC','M22 22 L78 22 L78 78 L22 78 Z',[35,70,90,85],'Provides emotional gravity: the still center around which others orbit.','Якорь','Стабилизатор','Создаёт эмоциональную гравитацию: неподвижный центр, вокруг которого вращаются остальные.'],
  ['Sage','Oracle','#C4B5FD','M50 5 L62 38 L98 38 L70 58 L80 92 L50 72 L20 92 L30 58 L2 38 L38 38 Z',[40,20,80,50],'Observes from altitude and turns fragmented signals into useable wisdom.','Мудрец','Оракул','Наблюдает с высоты и превращает разрозненные сигналы в применимую мудрость.'],
  ['Weaver','Connector','#6EE7B7','M50 10 C82 10 94 38 86 62 C78 86 64 94 50 94 C36 94 22 86 14 62 C6 38 18 10 50 10 Z',[60,65,75,70],'Ties distant nodes together; the invisible architect of connection.','Ткач','Связующий','Связывает далёкие узлы; невидимый архитектор связей.'],
  ['Mirror','Reflector','#FCA5A5','M50 10 Q82 28 82 50 Q82 82 50 92 Q18 82 18 50 Q18 28 50 10 Z',[30,60,55,60],'Returns exactly the energy received; a diagnostic tool for any relationship.','Зеркало','Отражатель','Возвращает ровно ту энергию, что получил; диагностический инструмент для любых отношений.'],
  ['Herald','Messenger','#FB923C','M50 8 L90 68 L10 68 Z',[70,75,50,35],'Carries information across boundaries and thrives at the living edge.','Вестник','Посланник','Переносит информацию через границы и процветает на живом краю.'],
  ['Guardian','Protector','#7BC5A0','M50 5 L92 26 L92 74 L50 95 L8 74 L8 26 Z',[45,55,85,90],'Creates the safe container where others can risk being vulnerable.','Страж','Защитник','Создаёт безопасный контейнер, где другие могут рискнуть быть уязвимыми.']
];

const probs=[
  ['🌪️','prob0t','prob0d','#FF6B5B'],
  ['⚡','prob1t','prob1d','#FFD93D'],
  ['🪞','prob2t','prob2d','#C4B5FD'],
  ['💣','prob3t','prob3d','#7DD3FC'],
  ['⚓','prob4t','prob4d','#FCA5A5'],
  ['🌀','prob5t','prob5d','#6EE7B7']
];

function aName(a){return lang==='ru'?a[6]:a[0]}
function aRole(a){return lang==='ru'?a[7]:a[1]}
function aDesc(a){return lang==='ru'?a[8]:a[5]}

function icon(a,s=100){
  return `<svg viewBox='0 0 100 100' width='${s}' height='${s}'>
    <path d='${a[3]}' fill='rgba(28,25,23,.16)' transform='translate(4 5)'/>
    <path d='${a[3]}' fill='${a[2]}' stroke='#1c1917' stroke-width='3' stroke-linejoin='round'/>
    <g><circle cx='36' cy='44' r='4.5' fill='#1c1917'/><circle cx='64' cy='44' r='4.5' fill='#1c1917'/>
    <circle cx='38' cy='42' r='1.7' fill='#fff'/><circle cx='66' cy='42' r='1.7' fill='#fff'/>
    <path d='M41 62 Q50 ${aName(a)==='Катализатор'||aName(a)==='Catalyst'?70:66} 59 62' fill='none' stroke='#1c1917' stroke-width='3' stroke-linecap='round'/>
    <ellipse cx='30' cy='59' rx='5.5' ry='3.2' fill='rgba(255,100,80,.28)'/><ellipse cx='70' cy='59' rx='5.5' ry='3.2' fill='rgba(255,100,80,.28)'/></g>
  </svg>`;
}

function init(){
  buildProblem();
  buildMatrix();
  buildCodex();
  buildLegend();
  heroOrbs();
  reveal();
  scene();
  quiz();
  backup();
  langToggle();
  applyLang();
}

function buildProblem(){
  const el=$('.problem');
  el.innerHTML='';
  probs.forEach(p=>{
    el.insertAdjacentHTML('beforeend',
      `<article class='card reveal'><i style='background:${p[3]}'>${p[0]}</i><h3>${t(p[1])}</h3><p>${t(p[2])}</p></article>`
    );
  });
}

function buildMatrix(){
  const el=$('#pickers');
  el.innerHTML='';
  A.forEach((a,i)=>{
    let b=document.createElement('button');
    b.className='pick';b.dataset.i=i;b.style='--c:'+a[2];
    b.innerHTML=icon(a,36)+`<span><b>${aName(a)}</b><small>${aRole(a)}</small></span>`;
    b.onclick=()=>pick(i);
    el.append(b);
  });
}

function buildCodex(){
  const el=$('#codexTrack');
  el.innerHTML='';
  A.forEach((a,i)=>{
    const axes=[t('axisAgency'),t('axisTemp'),t('axisFocus'),t('axisAttach')];
    let bars=axes.map((n,j)=>
      `<small>${n} ${a[4][j]}%</small><div class='bar'><i style='width:${a[4][j]}%;--c:${a[2]}'></i></div>`
    ).join('');
    el.insertAdjacentHTML('beforeend',`<article class='flip reveal'><div>
      <section class='face'><b>${String(i+1).padStart(2,'0')}</b>${icon(a,140)}
      <h3>${aName(a)}</h3><span class='tag' style='background:${a[2]}'>${aRole(a)}</span></section>
      <section class='face back'><h3 style='color:${a[2]}'>${aName(a)}</h3><p>${aDesc(a)}</p>${bars}</section>
    </div></article>`);
  });
  $$('.flip').forEach(x=>x.onclick=()=>x.classList.toggle('on'));
}

function buildLegend(){
  const el=$('#legend');
  el.innerHTML='';
  A.forEach((a,i)=>{
    el.insertAdjacentHTML('beforeend',
      `<button data-i='${i}'>${icon(a,44)}<span>${aName(a)}</span></button>`
    );
  });
}

function applyLang(){
  // Nav
  const navLinks=$$('nav a');
  [t('navProblem'),t('navMatrix'),t('navCodex'),t('navEngine')].forEach((txt,i)=>{if(navLinks[i])navLinks[i].textContent=txt});
  $('#lang').textContent=t('langBtn');
  $$('.small')[0].textContent=t('startTest');

  // Hero
  const pill=$('.pill');if(pill)pill.innerHTML=`<i></i>${t('pill')}`;
  const h1=$('h1');
  if(h1)h1.innerHTML=`${t('heroL1')}<br><em>${t('heroEm')}</em> ${t('heroL2')}<br>${t('heroL3')}.`;
  const lead=$('.lead');if(lead)lead.textContent=t('lead');
  $$('.cta').forEach(b=>{if(!b.classList.contains('foot-cta')&&b.id!=='calc')b.textContent=t('ctaTest')});
  const link=$('.link');if(link)link.textContent=t('exploreMatrix');

  // Stats
  const stats=$$('.stats b');
  if(stats.length>=3){
    stats[0].innerHTML=`8<span>${t('statArch')}</span>`;
    stats[1].innerHTML=`4<span>${t('statAxes')}</span>`;
    stats[2].innerHTML=`${t('statTime')}<span>${t('statTimeLabel')}</span>`;
  }

  // Ticker
  const tickerSpan=$('.ticker span');
  if(tickerSpan)tickerSpan.textContent=t('ticker');

  // Problem
  const secP=$$('#problem .sec p')[0];if(secP)secP.textContent=t('probLabel');
  const secH=$$('#problem .sec h2')[0];if(secH)secH.textContent=t('probTitle');
  const secS=$$('#problem .sec span')[0];if(secS)secS.textContent=t('probSub');
  buildProblem();

  // Matrix
  const matSec=$$('#matrix .sec');
  if(matSec.length){
    matSec[0].querySelector('p').textContent=t('matLabel');
    matSec[0].querySelector('h2').textContent=t('matTitle');
    matSec[0].querySelector('span').textContent=t('matSub');
  }
  buildMatrix();
  renderResult();

  // Capabilities
  const capSec=$$('.panel:not(.dark):not(.pale):not(.engine):not(.method) .sec');
  if(capSec.length){
    capSec[0].querySelector('p').textContent=t('capLabel');
    capSec[0].querySelector('h2').textContent=t('capTitle');
  }
  const capArts=$$('.bento article');
  [t('cap1t'),t('cap2t'),t('cap3t'),t('cap4t')].forEach((txt,i)=>{if(capArts[i])capArts[i].querySelector('h3').textContent=txt});
  [t('cap1d'),t('cap2d'),t('cap3d'),t('cap4d')].forEach((txt,i)=>{if(capArts[i])capArts[i].querySelector('p').textContent=txt});

  // Codex
  const codexSec=$$('#codex .sec');
  if(codexSec.length){
    codexSec[0].querySelector('p').textContent=t('codexLabel');
    codexSec[0].querySelector('h2').innerHTML=`${t('codexTitle')}<br>${t('codexTitle2')}`;
    codexSec[0].querySelector('span').textContent=t('codexSub');
  }
  buildCodex();

  // Engine
  const engSec=$$('#engine .sec');
  if(engSec.length){
    engSec[0].querySelector('p').textContent=t('engLabel');
    engSec[0].querySelector('h2').textContent=t('engTitle');
    engSec[0].querySelector('span').textContent=t('engSub');
  }
  const hudB=$('.hud b');if(hudB)hudB.textContent=t('engLive');
  const hudS=$('.hud span');if(hudS)hudS.textContent=t('engDrag');
  buildLegend();

  // Method
  const metH=$$('.method .sec h2')[0];if(metH)metH.textContent=t('methodTitle');
  const metArts=$$('.method article');
  const steps=[[t('step1t'),t('step1d')],[t('step2t'),t('step2d')],[t('step3t'),t('step3d')]];
  metArts.forEach((a,i)=>{
    if(steps[i]){a.querySelector('h3').textContent=steps[i][0];a.querySelector('p').textContent=steps[i][1]}
  });

  // Footer
  const footH=$('.foot h2');
  if(footH)footH.innerHTML=`${t('footTitle')}<br><em>${t('footEm')}</em>`;
  const footP=$('.foot p');if(footP)footP.textContent=t('footSub');
  const footCta=$('.foot-cta');if(footCta)footCta.textContent=t('footCta');
  const footSm=$('.foot-bottom small');if(footSm)footSm.textContent=t('footCopy');
  const footLinks=$$('.foot-links a');
  [t('footTop'),t('navProblem'),t('navMatrix'),t('navEngine')].forEach((txt,i)=>{if(footLinks[i])footLinks[i].textContent=txt});

  // Quiz
  const qH=$$('dialog h2')[0];if(qH)qH.textContent=t('quizTitle');
  const qP=$$('dialog > form > p')[0];if(qP)qP.textContent=t('quizSub');
  const qLabels=$$('dialog label');
  [t('quizAgency'),t('quizTemp'),t('quizFocus'),t('quizAttach')].forEach((txt,i)=>{if(qLabels[i])qLabels[i].childNodes[0].textContent=txt});
  const qOut=$('#qout');if(qOut)qOut.textContent=t('quizOut');
  const qCalc=$('#calc');if(qCalc)qCalc.textContent=t('quizCalc');

  document.documentElement.lang=lang;
}

let picks=[];
function pick(i){
  if(picks.includes(i)){picks=picks.filter(x=>x!==i)}
  else{picks.push(i);if(picks.length>2)picks.shift()}
  $$('.pick').forEach((b,j)=>b.classList.toggle('on',picks.includes(j)));
  renderResult();
}

function renderResult(){
  let o=$('#orbitMini'),r=$('#result');
  o.innerHTML='';
  if(!picks.length){
    r.innerHTML=`<small>${t('resultEmpty').toUpperCase()}</small><h3>${t('resultEmpty')}</h3><p>${t('resultEmptyDesc')}</p>`;
    return;
  }
  picks.forEach((i,k)=>{
    let d=document.createElement('div');
    d.innerHTML=icon(A[i],k?100:120);
    d.firstChild.style.cssText=`left:${k?'54':'20'}%;top:${k?'38':'15'}%;animation:float ${5+k}s infinite`;
    o.append(d.firstChild);
  });
  if(picks.length<2){
    r.innerHTML=`<small>${t('resultEmpty').toUpperCase()}</small><h3>${t('resultOne')}</h3><p>${t('resultOneDesc')}</p>`;
    return;
  }
  let [a,b]=picks.map(i=>A[i]),
    dist=Math.hypot(...a[4].map((v,i)=>(v-b[4][i]))),
    res=Math.round(100-dist/2),fr=100-res,
    n=res>72?t('resHigh'):res>48?t('resCharged'):t('resFriction');
  r.innerHTML=`<small>${t('resultEmpty').toUpperCase()} · ${Math.max(1,res)}% ${t('resonance')}</small><h3>${n}</h3><p><b>${aName(a)}</b> + <b>${aName(b)}</b>: ${fr>45?t('resSparks'):t('resFlow')}</p>`;
}

function langToggle(){
  $('#lang').onclick=()=>{
    lang=lang==='en'?'ru':'en';
    applyLang();
    // Re-observe new reveal elements
    $$('.reveal').forEach(x=>x.classList.remove('in'));
    setTimeout(()=>{
      $$('.reveal,.sec,.bento article,.method article').forEach(x=>x.classList.add('reveal'));
      reveal();
    },50);
  };
}

function heroOrbs(){
  let p=$('.orbs');
  A.slice(0,6).forEach((a,i)=>{
    let d=document.createElement('div');
    d.innerHTML=icon(a,100+i*6);
    let s=d.firstChild,xy=[[8,12],[78,16],[5,58],[82,55],[18,82],[63,80]][i];
    s.style.cssText=`left:${xy[0]}%;top:${xy[1]}%;--d:${6+i*.7}s`;
    p.append(s);
  });
}

function reveal(){
  let io=new IntersectionObserver(e=>e.forEach(x=>{
    if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}
  }),{threshold:.12});
  $$('.reveal,.sec,.bento article,.method article').forEach(x=>{x.classList.add('reveal');io.observe(x)});
  $$('.flip').forEach(x=>x.onclick=()=>x.classList.toggle('on'));
  addEventListener('pointermove',e=>{
    let x=(e.clientX/innerWidth-.5)*18,y=(e.clientY/innerHeight-.5)*18;
    document.documentElement.style.cssText=`--mx:${-x}px;--my:${-y}px`;
    $$('.card').forEach(c=>c.style.setProperty('--tilt',x/2+'deg'));
  },{passive:true});
  $('#hamb').onclick=()=>$('.top').classList.toggle('open');
  $$('nav a').forEach(a=>a.onclick=()=>$('.top').classList.remove('open'));
}

function scene(){
  const c=$('#scene'),x=c.getContext('2d'),
    S=()=>{c.width=c.clientWidth*devicePixelRatio;c.height=c.clientHeight*devicePixelRatio};
  S();addEventListener('resize',S);
  let t=0,run=1,rx=.6,ry=0,drag=0,lx=0,ly=0;
  const stageEl=$('.stage');
  stageEl.onpointerdown=e=>{drag=1;lx=e.clientX;ly=e.clientY;stageEl.setPointerCapture(e.pointerId)};
  stageEl.onpointerup=()=>drag=0;
  stageEl.onpointermove=e=>{if(drag){ry+=(e.clientX-lx)*.006;rx+=(e.clientY-ly)*.006;lx=e.clientX;ly=e.clientY}};
  $('#pause').onclick=()=>{run=!run;$('#pause').textContent=run?'Ⅱ':'▶'};
  function P(p){
    let [X,Y,Z]=p,cy=Math.cos(ry),sy=Math.sin(ry),cx=Math.cos(rx),sx=Math.sin(rx),
      x1=X*cy-Z*sy,z1=X*sy+Z*cy,y1=Y*cx-z1*sx,z2=Y*sx+z1*cx,sc=520/(520+z2);
    return [c.width/2+x1*sc,c.height/2+y1*sc,sc,z2];
  }
  function loop(){
    requestAnimationFrame(loop);if(run)t+=.008;
    const dpr=devicePixelRatio;x.clearRect(0,0,c.width,c.height);
    let pts=A.map((a,i)=>{
      let an=i/A.length*Math.PI*2+t*(.3+i*.03),r=160+30*Math.sin(t+i);
      return {a,p:P([Math.cos(an)*r,Math.sin(t*1.7+i)*60,Math.sin(an)*r]),i};
    }).sort((a,b)=>a.p[3]-b.p[3]);
    x.lineWidth=1.5*dpr;
    for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){
      let d=Math.hypot(...pts[i].a[4].map((v,k)=>v-pts[j].a[4][k]));
      if(d<75){x.strokeStyle=`rgba(246,240,223,${.28-d/260})`;x.beginPath();x.moveTo(pts[i].p[0],pts[i].p[1]);x.lineTo(pts[j].p[0],pts[j].p[1]);x.stroke()}
    }
    pts.forEach(o=>{
      let [px,py,sc]=o.p,R=28*sc*dpr;
      x.fillStyle=o.a[2];x.shadowColor=o.a[2];x.shadowBlur=28*sc;
      x.beginPath();x.arc(px,py,R,0,7);x.fill();x.shadowBlur=0;
      x.lineWidth=3*dpr;x.strokeStyle='#f6f0df';x.stroke();
      x.fillStyle='#f6f0df';x.font=`${11*dpr}px "Space Grotesk"`;x.textAlign='center';
      x.fillText(aName(o.a),px,py+R+16*dpr);
    });
  }
  loop();
}

function grain(){
  let c=$('#grain'),x=c.getContext('2d'),
    n=()=>{c.width=innerWidth;c.height=innerHeight;let im=x.createImageData(c.width,c.height);
      for(let i=0;i<im.data.length;i+=4){let v=Math.random()*255;im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=22}
      x.putImageData(im,0,0)};n();addEventListener('resize',n);
}

function quiz(){
  let q=$('#quiz'),out=$('#qout');
  $$('[data-test]').forEach(b=>b.onclick=()=>q.showModal());
  $('#calc').onclick=()=>{
    let v=$$('dialog input').map(i=>+i.value),
      best=A.map(a=>[Math.hypot(...a[4].map((x,i)=>x-v[i])),a]).sort((a,b)=>a[0]-b[0])[0][1];
    out.innerHTML=`${t('quizPrefix')} <b style='color:${best[2]}'>${aName(best)}</b> ${t('quizSuffix')} ${aDesc(best)}`;
  };
}

function backup(){
  const btn=$('#uploadBtn'),input=$('#backupInput');
  if(!btn||!input)return;
  btn.onclick=()=>input.click();
  input.onchange=e=>{
    const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=ev=>{try{JSON.parse(ev.target.result);alert(t('backupOk'))}catch{alert(t('backupFail'))}};
    reader.readAsText(file);input.value='';
  };
}

init();grain();
