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
