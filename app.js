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
  const user = 'georgiarachel07', select = $('#gh-year'), grid = $('#gh-grid');
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

