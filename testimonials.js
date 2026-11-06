/* User-supplied testimonials; surnames masked for display. */
(() => {
  'use strict';
  const section=document.getElementById('testimonials'),viewport=section.querySelector('.reviews-viewport'),track=section.querySelector('.reviews-track'),group=section.querySelector('.reviews-group'),button=document.getElementById('reviews-pause');
  const duplicate=group.cloneNode(true);duplicate.setAttribute('aria-hidden','true');duplicate.inert=true;track.append(duplicate);
  let manuallyPaused=false;
  function setPaused(paused){
    manuallyPaused=paused;section.classList.toggle('reviews-stopped',paused);button.setAttribute('aria-pressed',String(paused));
    button.replaceChildren(document.createTextNode(paused?'Resume reviews ':'Pause reviews '));
    const icon=document.createElement('span');icon.setAttribute('aria-hidden','true');icon.textContent=paused?'▶':'Ⅱ';button.append(icon);
  }
  function size(){track.style.setProperty('--reviews-duration',`${(group.getBoundingClientRect().width+20)/23}s`);}
  new ResizeObserver(size).observe(group);size();
  button.addEventListener('click',()=>setPaused(!manuallyPaused));
  viewport.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')setPaused(true);});
  new IntersectionObserver(entries=>section.classList.toggle('reviews-active',entries[0].isIntersecting),{threshold:.08}).observe(section);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)section.classList.remove('reviews-active');else{const box=section.getBoundingClientRect();section.classList.toggle('reviews-active',box.bottom>0&&box.top<innerHeight);}});
  document.addEventListener('portfolio:motion',e=>{if(!e.detail.enabled){button.disabled=true;button.textContent='Motion is paused';}else{button.disabled=false;setPaused(manuallyPaused);}});
  if(document.documentElement.classList.contains('motion-paused')){button.disabled=true;button.textContent='Motion is paused';}
})();

/* Toolkit motion shares the portfolio's motion preference. */
(() => {
  const catalog=document.querySelector('.tech-catalog'),button=catalog.querySelector('.tech-pause');
  let paused=false,visible=false;
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const rows=[...catalog.querySelectorAll('.tech-track')];
  rows.forEach(track=>{
    const group=track.querySelector('.tech-grid'),copy=group.cloneNode(true);
    copy.setAttribute('aria-hidden','true');copy.inert=true;
    copy.querySelectorAll('[id]').forEach(el=>{
      const previous=el.id,next=previous+'-copy';el.id=next;
      copy.querySelectorAll('*').forEach(child=>[...child.attributes].forEach(attr=>{
        if(attr.value.includes('#'+previous))child.setAttribute(attr.name,attr.value.replaceAll('#'+previous,'#'+next));
      }));
    });
    track.append(copy);
    const size=()=>track.style.setProperty('--toolkit-duration',`${(group.getBoundingClientRect().width+12)/24}s`);
    new ResizeObserver(size).observe(group);size();
  });
  function sync(){
    const disabled=motion.matches||document.documentElement.classList.contains('motion-paused');
    catalog.classList.toggle('toolkit-stopped',paused||disabled);
    catalog.classList.toggle('toolkit-active',visible&&!document.hidden);
    button.disabled=disabled;button.setAttribute('aria-pressed',String(paused));
    button.textContent=disabled?'Motion is paused':paused?'Resume toolkit ▶':'Pause toolkit Ⅱ';
  }
  button.addEventListener('click',()=>{paused=!paused;sync();});
  catalog.querySelectorAll('.tech-viewport').forEach(view=>view.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'){paused=true;sync();}}));
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.05}).observe(catalog);
  document.addEventListener('visibilitychange',sync);document.addEventListener('portfolio:motion',sync);motion.addEventListener('change',sync);sync();
})();
