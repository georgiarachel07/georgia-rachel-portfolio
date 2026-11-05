/* Portfolio interactions. Native scrolling; no scroll hijacking or animation library. */
(() => {
  'use strict';
  const root=document.documentElement;
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  let stored;try{stored=localStorage.getItem('georgia-motion');}catch{}
  let enabled=stored===null||stored===undefined?!preference.matches:stored==='on';
  const button=document.getElementById('motion-toggle');
  function setMotion(value,persist=false){
    enabled=value;root.classList.toggle('motion-paused',!enabled);
    button.setAttribute('aria-pressed',String(enabled));
    button.setAttribute('aria-label',enabled?'Pause ambient animations':'Enable ambient animations');
    document.getElementById('motion-label').textContent=enabled?'Motion on':'Motion off';
    document.getElementById('pond-motion').textContent=enabled?'Pause water':'Resume water';
    if(persist)try{localStorage.setItem('georgia-motion',enabled?'on':'off');}catch{}
    document.dispatchEvent(new CustomEvent('portfolio:motion',{detail:{enabled}}));
  }
  button.addEventListener('click',()=>setMotion(!enabled,true));
  document.getElementById('pond-motion').addEventListener('click',()=>setMotion(!enabled,true));
  preference.addEventListener('change',e=>setMotion(!e.matches));
  setMotion(enabled);

  // Content starts visible; enhancement only conceals elements below the viewport.
  const reveals=[...document.querySelectorAll('.section-heading,.project,.hardware-gallery,.hardware-summary,.topology,.process-list>div,.experience-list article,.education-grid,.stack-browser,.github-section,.arcade-header,.contact-grid')];
  const revealObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-seen');revealObserver.unobserve(entry.target);}});
  },{threshold:.08,rootMargin:'0px 0px -25px 0px'});
  reveals.forEach(el=>{el.classList.add('reveal');if(el.getBoundingClientRect().top<innerHeight)el.classList.add('is-seen');else revealObserver.observe(el);});
  root.classList.add('motion-ready');
  const activeObserver=new IntersectionObserver(entries=>entries.forEach(e=>e.target.classList.toggle('is-in-view',e.isIntersecting)),{threshold:.05});
  document.querySelectorAll('.project').forEach(el=>activeObserver.observe(el));

  const progress=document.querySelector('.reading-progress span'),hero=document.querySelector('.hero'),pond=document.querySelector('.pond-visual');
  const sections=[...document.querySelectorAll('main>section[id]')];
  let scheduled=false;
  function scrollFrame(){
    scheduled=false;
    const range=document.documentElement.scrollHeight-innerHeight;
    progress.style.transform=`scaleX(${range>0?scrollY/range:0})`;
    if(enabled && hero.getBoundingClientRect().bottom>0){
      pond.style.setProperty('--pond-drift',`${Math.min(scrollY*.07,35)}px`);
      document.querySelector('.hero-copy').style.setProperty('--copy-drift',`${Math.min(scrollY*.025,14)}px`);
    }
    sections.forEach(section=>{const box=section.getBoundingClientRect();section.classList.toggle('is-current',box.top<innerHeight*.45&&box.bottom>innerHeight*.45);});
  }
  addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(scrollFrame);}},{passive:true});
  addEventListener('resize',scrollFrame,{passive:true});scrollFrame();

  // A small physical tilt on diagrams only; coarse pointers retain normal touch scrolling.
  if(matchMedia('(hover:hover) and (pointer:fine)').matches){
    document.querySelectorAll('.project-art').forEach(el=>{
      el.addEventListener('pointermove',e=>{
        if(!enabled)return;const box=el.getBoundingClientRect();
        el.style.setProperty('--tilt-y',`${((e.clientX-box.left)/box.width-.5)*5}deg`);
        el.style.setProperty('--tilt-x',`${-((e.clientY-box.top)/box.height-.5)*4}deg`);
      });
      el.addEventListener('pointerleave',()=>{el.style.setProperty('--tilt-x','0deg');el.style.setProperty('--tilt-y','0deg');});
    });
  }
  const descriptions={
    compute:['COMPUTE / HP Z420','The virtualization foundation. A 64GB Proxmox VE node provides the bare-metal environment for running and isolating local workloads.'],
    inference:['INFERENCE / RYZEN 7 5700X','The private AI workhorse. The custom 3D-printed Ryzen build and RTX 3060 Super support local LLM inference with Ollama.'],
    sandbox:['SANDBOX / 2020 MAC MINI','A place to experiment. CasaOS, Docker, and OpenWebUI provide a container sandbox for services and private AI interfaces.'],
    storage:['STORAGE / DUAL QNAP','The recovery layer. A 10TB TS-231 and 12TB TS-251+ handle mirrored storage pools, Plex, Immich photo backups, and disaster recovery archives.']
  };
  document.querySelectorAll('[data-node]').forEach(node=>node.addEventListener('click',()=>{
    document.querySelectorAll('[data-node]').forEach(n=>n.setAttribute('aria-pressed',String(n===node)));
    const [title,text]=descriptions[node.dataset.node],panel=document.getElementById('node-detail');
    panel.querySelector('span').textContent=title;panel.querySelector('p').textContent=text;
    panel.classList.remove('node-updated');void panel.offsetWidth;panel.classList.add('node-updated');
  }));
})();
