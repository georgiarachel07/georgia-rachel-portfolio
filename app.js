'use strict';
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

// Navigation stays ordinary links, including when JavaScript is unavailable.
const menu = $('.menu-toggle');
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  $('#navigation').classList.toggle('open', open);
  menu.lastElementChild.textContent = open ? '−' : '+';
});
$$('#navigation a').forEach(a => a.addEventListener('click', () => {
  menu.setAttribute('aria-expanded', 'false');
  $('#navigation').classList.remove('open');
  menu.lastElementChild.textContent = '+';
}));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { menu.click(); menu.focus(); }
});

// Small static waveform, not a pretend live call.
for (let i = 0; i < 45; i++) {
  const bar = document.createElement('i');
  bar.style.setProperty('--bar-i',i);
  bar.style.height = `${5 + Math.abs(Math.sin(i * 1.9) * Math.sin(i * .21)) * 36}px`;
  $('.waveform').append(bar);
}

// Accessible manual-activation tab pattern.
const tabs = $$('.stack-tabs [role=tab]');
function activateTab(tab) {
  tabs.forEach(t => {
    const active = t === tab;
    t.setAttribute('aria-selected', String(active));
    t.tabIndex = active ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')).hidden = !active;
  });
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateTab(tab));
  tab.addEventListener('keydown', e => {
    let next;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (index + 1) % tabs.length;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (index + tabs.length - 1) % tabs.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = tabs.length - 1;
    if (next !== undefined) { e.preventDefault(); tabs[next].focus(); activateTab(tabs[next]); }
  });
});

// Original diploma and honors photographs, with portfolio preview watermarks.
const dialog = $('#image-dialog');
let documentOpener;
$$('[data-image]').forEach(button => button.addEventListener('click', () => {
  documentOpener = button;
  document.querySelector('.document-view').classList.toggle('hardware-preview',button.classList.contains('hardware-shot'));
  $('#dialog-image').src = button.dataset.image;
  $('#dialog-image').alt = button.dataset.caption;
  $('#dialog-caption').textContent = button.dataset.caption;
  dialog.showModal();
}));
$('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
dialog.addEventListener('close', () => documentOpener?.focus());

// The original assistant's facts, now an explicit local introduction guide.
const guideFacts = {
  focus: 'I work across AI systems, infrastructure, and cybersecurity: private LLM inference, autonomous voice agents, bare-metal virtualization, and cloud operations. My credentials include Security+, Google Cybersecurity, CCNA, AWS SysOps, and SAP on AWS.',
  lab: 'The lab includes an HP Z420 Proxmox node with 64GB RAM, a Ryzen 7 5700X / RTX 3060 Super build, and a 2020 Mac Mini container sandbox. Two QNAP NAS units provide 22TB of redundant storage.',
  education: 'I graduated Summa Cum Laude in Computer Engineering at AMA University with a 1.5 GWA and four years as a President’s Lister. My capstone was a solar-powered health and attendance kiosk for a Visayas island community.',
  roles: 'Yes! I’m open to full-time Systems Engineering, Cloud Infrastructure, and Cybersecurity Analyst or Engineering roles. Use the contact section to reach me directly by email, LinkedIn, or WhatsApp.'
};
const guideToggle = $('#guide-toggle');
function setGuide(open) {
  $('#guide-panel').hidden = !open;
  guideToggle.setAttribute('aria-expanded', String(open));
  $('.guide-plus').textContent = open ? '−' : '+';
  if (open) $('#guide-close').focus();
}
guideToggle.addEventListener('click', () => setGuide(guideToggle.getAttribute('aria-expanded') !== 'true'));
$('#guide-close').addEventListener('click', () => { setGuide(false); guideToggle.focus(); });
$$('[data-topic]').forEach(button => button.addEventListener('click', () => { $('#guide-answer').textContent = guideFacts[button.dataset.topic]; }));
$('#guide-panel>a').addEventListener('click', () => setGuide(false));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#guide-panel').hidden) { setGuide(false); guideToggle.focus(); } });

// GitHub public contribution calendar with the original dated offline snapshot.
(() => {
  const user = 'fromnowheretobefound', select = $('#gh-year'), grid = $('#gh-grid');
  let history, sourceNote = '';
  const format = new Intl.DateTimeFormat('en', {month:'long', day:'numeric', year:'numeric', timeZone:'UTC'});
  function render() {
    if (!history) return;
    const year = Number(select.value), today = new Date().toISOString().slice(0,10);
    const lookup = new Map(history.contributions.filter(d => d.date.startsWith(year + '-')).map(d => [d.date,d]));
    grid.replaceChildren(); $('#gh-months').replaceChildren();
    const first = new Date(Date.UTC(year,0,1)), end = new Date(Date.UTC(year,11,31));
    for (let i=0; i<first.getUTCDay(); i++) { const s=document.createElement('span'); s.setAttribute('aria-hidden','true'); grid.append(s); }
    let total=0, active=0;
    for (const date=new Date(first); date<=end && date.toISOString().slice(0,10)<=today; date.setUTCDate(date.getUTCDate()+1)) {
      const key=date.toISOString().slice(0,10), day=lookup.get(key), cell=document.createElement('a');
      const label=day ? `${day.count} contribution${day.count===1?'':'s'} on ${format.format(date)}` : `Activity unavailable for ${format.format(date)}`;
      cell.className='gh-day'; cell.dataset.level=day?Math.max(0,Math.min(4,Number(day.level)||0)):0;
      cell.title=label; cell.setAttribute('aria-label',label+'. Open activity on GitHub');
      cell.href=`https://github.com/${user}?tab=overview&from=${key}&to=${key}`; cell.target='_blank'; cell.rel='noopener noreferrer';
      // One keyboard stop enters the calendar; arrow keys explore days.
      cell.tabIndex=grid.children.length===first.getUTCDay()?0:-1;
      cell.addEventListener('mouseenter',()=>$('#gh-detail').textContent=label);
      cell.addEventListener('focus',()=>$('#gh-detail').textContent=label);
      grid.append(cell);
      if(day){total+=day.count;if(day.count>0)active++;}
      if(date.getUTCDate()===1){const m=document.createElement('span');m.textContent=date.toLocaleString('en',{month:'short',timeZone:'UTC'});m.style.gridColumn=String(Math.floor(((date-first)/86400000+first.getUTCDay())/7)+1);$('#gh-months').append(m);}
    }
    $('#gh-total').textContent=`${total.toLocaleString()} contributions / ${active} active day${active===1?'':'s'} / ${year}`;
    $('#gh-status').textContent=(total?`Public activity for ${year}. `:`No public contributions recorded for ${year}. `)+sourceNote;
  }
  grid.addEventListener('keydown',e=>{
    const cells=$$('.gh-day',grid), index=cells.indexOf(document.activeElement);
    const offsets={ArrowLeft:-7,ArrowRight:7,ArrowUp:-1,ArrowDown:1};
    if(index>=0 && (e.key in offsets || e.key==='Home' || e.key==='End')) {
      e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?cells.length-1:Math.max(0,Math.min(cells.length-1,index+offsets[e.key]));
      cells[index].tabIndex=-1;cells[next].tabIndex=0;cells[next].focus();
    }
  });
  function populate(data) {
    if(!data || !Array.isArray(data.contributions) || !data.contributions.every(d=>/^\d{4}-\d{2}-\d{2}$/.test(d.date)&&Number.isFinite(d.count)&&d.count>=0)) throw Error('Invalid contribution data');
    const previous=select.value,current=new Date().getUTCFullYear();history=data;
    const years=[...new Set([current,...data.contributions.map(d=>Number(d.date.slice(0,4))).filter(y=>y<=current)])].sort((a,b)=>b-a);
    select.replaceChildren(...years.map(y=>new Option(String(y),String(y))));
    const latest=years.find(y=>data.contributions.some(d=>d.date.startsWith(y+'-')&&d.count>0));
    select.value=years.includes(Number(previous))?previous:String(latest||current);select.disabled=false;render();
  }
  async function live() {
    $('#gh-retry').hidden=true;
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
    try {
      const response=await fetch(`https://github-contributions-api.jogruber.de/v4/${user}`,{signal:controller.signal});
      if(!response.ok)throw Error('Unable to refresh');
      const data=await response.json();sourceNote='Live public data; updates may be delayed.';populate(data);
    } catch {
      sourceNote=history?'Saved public snapshot from November 5, 2026. Live refresh unavailable.':'Activity is unavailable. Visit the GitHub profile above.';
      if(history)render();else $('#gh-status').textContent=sourceNote;
      $('#gh-retry').hidden=false;
    } finally {clearTimeout(timer);}
  }
  (async()=>{try{const data=window.PORTFOLIO_GITHUB_HISTORY||await(await fetch('assets/github-history.json')).json();sourceNote='Saved public snapshot from November 5, 2026. Refreshing…';populate(data);}catch{$('#gh-total').textContent='Public contributions';}await live();})();
  select.addEventListener('change',render);$('#gh-retry').addEventListener('click',live);
})();

// Cyber Gun Defense: only animates after explicit start, pauses when out of view.
(() => {
  const canvas=$('#game'),ctx=canvas.getContext('2d'),start=$('#start-game'),pause=$('#pause-game'),overlay=$('#game-overlay');
  let w=900,h=360,state='idle',score=0,integrity=100,viruses=[],beams=[],last=0,spawn=0,elapsed=0,aim={x:450,y:80},gun=450,cooldown=0;
  const keys=new Set(); let held=false;
  function resize(){const box=canvas.getBoundingClientRect(),ratio=Math.min(window.devicePixelRatio||1,2);w=box.width;h=box.height;canvas.width=w*ratio;canvas.height=h*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);gun=Math.min(w-20,Math.max(20,gun));aim.x=Math.min(w,aim.x);draw();}
  function hud(){$('#score').textContent=String(score).padStart(3,'0');$('#integrity').textContent=integrity+'%';}
  function draw(){
    ctx.clearRect(0,0,w,h);ctx.fillStyle='#142019';ctx.fillRect(0,0,w,h);
    ctx.strokeStyle='#26382b';ctx.lineWidth=1;ctx.beginPath();
    for(let x=0;x<w;x+=35){ctx.moveTo(x,0);ctx.lineTo(x,h);}for(let y=0;y<h;y+=35){ctx.moveTo(0,y);ctx.lineTo(w,y);}ctx.stroke();
    ctx.fillStyle='#2e4832';ctx.fillRect(0,h-32,w,32);ctx.strokeStyle='#9dbd80';ctx.beginPath();ctx.moveTo(0,h-32);ctx.lineTo(w,h-32);ctx.stroke();
    for(let x=12;x<w;x+=70){ctx.strokeStyle='#57754d';ctx.strokeRect(x,h-25,48,18);ctx.fillStyle='#b9de8f';ctx.fillRect(x+6,h-19,3,3);}
    viruses.forEach(v=>{ctx.save();ctx.translate(v.x,v.y);ctx.rotate(v.rot);ctx.strokeStyle=v.kind?'#c6e6a0':'#dc9a70';ctx.fillStyle=v.kind?'#426a3e':'#654537';ctx.lineWidth=1.5;ctx.beginPath();for(let j=0;j<8;j++){const a=j*Math.PI/4,r=j%2?v.r*.65:v.r;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#ecf2da';ctx.fillRect(-5,-3,3,3);ctx.fillRect(3,-3,3,3);ctx.restore();});
    beams.forEach(b=>{ctx.globalAlpha=b.life/.13;ctx.strokeStyle='#d0ee93';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(b.x,h-38);ctx.lineTo(b.tx,b.ty);ctx.stroke();ctx.globalAlpha=1;});
    const angle=Math.atan2(aim.y-(h-38),aim.x-gun);ctx.save();ctx.translate(gun,h-38);ctx.rotate(angle+Math.PI/2);ctx.fillStyle='#d0ee93';ctx.fillRect(-5,-21,10,28);ctx.fillRect(-14,2,28,10);ctx.restore();
    if(state==='running'){ctx.strokeStyle='#a3c783';ctx.lineWidth=1;ctx.beginPath();ctx.arc(aim.x,aim.y,10,0,Math.PI*2);ctx.moveTo(aim.x-17,aim.y);ctx.lineTo(aim.x-6,aim.y);ctx.moveTo(aim.x+6,aim.y);ctx.lineTo(aim.x+17,aim.y);ctx.moveTo(aim.x,aim.y-17);ctx.lineTo(aim.x,aim.y-6);ctx.stroke();}
  }
  function fire(){
    if(state!=='running'||cooldown>0)return;cooldown=.16;
    const dx=aim.x-gun,dy=aim.y-(h-38),length=Math.hypot(dx,dy)||1;
    const hits=viruses.map(v=>{const vx=v.x-gun,vy=v.y-(h-38),along=(vx*dx+vy*dy)/length,dist=Math.abs(vx*dy-vy*dx)/length;return {v,along,dist};}).filter(a=>a.along>0&&a.dist<a.v.r+8).sort((a,b)=>a.along-b.along);
    let tx=aim.x,ty=aim.y;if(hits.length){const v=hits[0].v;tx=v.x;ty=v.y;viruses=viruses.filter(x=>x!==v);score++;hud();if(score%10===0)$('#game-live').textContent=`${score} viruses destroyed. System integrity ${integrity} percent.`;}
    beams.push({x:gun,tx,ty,life:.13});
  }
  function show(title,message,label){$('#game-title').textContent=title;$('#game-message').textContent=message;start.firstChild.textContent=label+' ';overlay.hidden=false;$('.game-area').classList.remove('playing');}
  function frame(time){
    if(state!=='running')return;const dt=Math.min((time-last)/1000||0,.04);last=time;elapsed+=dt;spawn-=dt;cooldown=Math.max(0,cooldown-dt);
    if(keys.has('ArrowLeft')||keys.has('a')){gun=Math.max(18,gun-dt*400);aim.x=gun;aim.y=50;}
    if(keys.has('ArrowRight')||keys.has('d')){gun=Math.min(w-18,gun+dt*400);aim.x=gun;aim.y=50;}
    if(keys.has(' ')||held)fire();
    if(spawn<=0){spawn=Math.max(.28,1-elapsed*.006);viruses.push({x:20+Math.random()*(w-40),y:-20,r:12+Math.random()*7,speed:28+Math.random()*18+elapsed*.3,rot:Math.random()*6,kind:Math.random()>.5});}
    viruses.forEach(v=>{v.y+=v.speed*dt;v.rot+=dt*.5;});
    const breached=viruses.filter(v=>v.y>h-40);if(breached.length){integrity=Math.max(0,integrity-breached.length*10);viruses=viruses.filter(v=>v.y<=h-40);hud();}
    beams=beams.filter(b=>(b.life-=dt)>0);draw();
    if(integrity<=0){state='over';pause.disabled=true;held=false;keys.clear();show('Mainframe breached.',`${score} viruses stopped. Ready for another shift?`,'Restart defense');$('#game-live').textContent=`Game over. ${score} viruses destroyed.`;start.focus();return;}
    requestAnimationFrame(frame);
  }
  function run(){if(state!=='paused'){score=0;integrity=100;viruses=[];beams=[];spawn=.5;elapsed=0;gun=w/2;aim={x:w/2,y:60};cooldown=0;hud();}state='running';held=false;keys.clear();overlay.hidden=true;$('.game-area').classList.add('playing');pause.disabled=false;pause.textContent='Pause';last=performance.now();canvas.focus({preventScroll:true});requestAnimationFrame(frame);}
  function pauseGame(){if(state!=='running')return;state='paused';held=false;keys.clear();pause.textContent='Resume';show('Defense on hold.','Your score is safe. Resume when you’re ready.','Resume defense');draw();}
  start.addEventListener('click',run);pause.addEventListener('click',()=>state==='running'?pauseGame():run());
  function aimAt(e){const r=canvas.getBoundingClientRect();aim={x:Math.max(0,Math.min(w,e.clientX-r.left)),y:Math.max(5,Math.min(h-48,e.clientY-r.top))};}
  canvas.addEventListener('pointermove',e=>{if(state==='running')aimAt(e);});
  canvas.addEventListener('pointerdown',e=>{if(state!=='running')return;e.preventDefault();canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);aimAt(e);held=true;fire();});
  window.addEventListener('pointerup',()=>held=false);canvas.addEventListener('pointercancel',()=>held=false);
  canvas.addEventListener('keydown',e=>{const key=e.key.length===1?e.key.toLowerCase():e.key;if(['ArrowLeft','ArrowRight','a','d',' ','Escape'].includes(key)){e.preventDefault();if(key==='Escape'){pauseGame();start.focus();}else keys.add(key);}});
  canvas.addEventListener('keyup',e=>keys.delete(e.key.length===1?e.key.toLowerCase():e.key));
  canvas.addEventListener('blur',()=>{keys.clear();held=false;});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseGame();});
  document.addEventListener('portfolio:pond-open',pauseGame);
  new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)pauseGame();},{threshold:.05}).observe(canvas);
  new ResizeObserver(resize).observe(canvas);resize();
})();
