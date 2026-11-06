/* The Quiet Catch — original pond game. No external runtime or game assets. */
(() => {
  'use strict';
  const $=s=>document.querySelector(s),canvas=$('#fishing-game'),ctx=canvas.getContext('2d');
  const action=$('#fishing-action'),pause=$('#fishing-pause'),gentle=$('#fishing-gentle'),welcome=$('.fishing-welcome'),meter=$('.fishing-meter'),result=$('.fishing-result');
  const kinds=[
    {name:'Kohaku',color:'#e9e5cb',mark:'#ba593c',type:'koi',note:'Ivory scales, vermilion islands. A classic.'},
    {name:'Golden Ogon',color:'#d4b46c',mark:'#f1d58b',type:'koi',note:'A small flash of gold beneath the surface.'},
    {name:'Showa',color:'#e8e4d3',mark:'#272d28',type:'koi',note:'Ink, ivory, and red. Every pattern is different.'},
    {name:'Shusui',color:'#9eb8bd',mark:'#b4563c',type:'koi',note:'Blue-grey watercolors with a warm copper edge.'},
    {name:'Tancho',color:'#eee9d4',mark:'#b34c34',type:'koi',note:'One red crown. A very quiet little triumph.'},
    {name:'Stray bug',type:'bug',color:'#d5b66f',note:'One less bug in the ecosystem. Into the bin it goes.'},
    {name:'Waterborne virus',type:'virus',color:'#bd857d',note:'A fictional digital pest. Safely contained in the cleanup bin.'},
    {name:'Discarded can',type:'trash',color:'#b6c0a7',note:'Not a fish, but still a good catch. The pond thanks you.'},
    {name:'Tangled cable',type:'cable',color:'#d0ad7e',note:'A little cable management, even after hours.'}
  ];
  let saved={fish:0,clean:0,found:[]};
  try{const v=JSON.parse(localStorage.getItem('georgia-quiet-catch-v1'));if(v&&Number.isFinite(v.fish)&&Number.isFinite(v.clean)&&Array.isArray(v.found))saved={fish:Math.max(0,Math.floor(v.fish)),clean:Math.max(0,Math.floor(v.clean)),found:v.found.filter(n=>kinds.slice(0,5).some(k=>k.name===n))};}catch{}
  let state='welcome',paused=false,held=false,raf=0,last=0,clock=0,timer=0,w=900,h=480,cast={x:.57,y:.43},aim={x:.57,y:.43},item=null,progress=.35,zone=.35,velocity=0,target=.5,phase=0,landed=false,deck=[],bites=0;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
  function announce(text){$('#fishing-status').textContent=text;}
  function label(text){action.textContent=text;}
  function setState(next){state=next;timer=0;held=false;action.classList.remove('is-held');canvas.dataset.phase=state;meter.hidden=state!=='reeling';result.hidden=!['landed','disposing','releasing'].includes(state);}
  function journal(){
    $('#fishing-count').textContent=saved.fish;$('#cleanup-count').textContent=saved.clean;$('#variety-count').textContent=saved.found.length+' / 5';
    $('#fishing-journal').replaceChildren(...kinds.slice(0,5).map(k=>{const el=document.createElement('span'),found=saved.found.includes(k.name);el.className=found?'found':'';el.textContent=found?'✓ '+k.name:'— Undiscovered koi';return el;}));
    try{localStorage.setItem('georgia-quiet-catch-v1',JSON.stringify(saved));}catch{}
  }
  function drawItem(k,x,y,size,angle=0){
    if(!k)return;ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.lineWidth=1.4;ctx.fillStyle=k.color;ctx.strokeStyle='#e5e6c6';
    if(k.type==='koi'){
      ctx.beginPath();ctx.moveTo(-size*.45,0);ctx.quadraticCurveTo(-size*.65,-size*.35,-size*.8,-size*.28);ctx.lineTo(-size*.68,0);ctx.lineTo(-size*.8,size*.28);ctx.quadraticCurveTo(-size*.6,size*.3,-size*.45,0);ctx.fill();
      ctx.globalAlpha=.7;ctx.beginPath();ctx.ellipse(-size*.05,0,size*.22,size*.29,-.3,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
      ctx.beginPath();ctx.ellipse(0,0,size*.52,size*.17,0,0,Math.PI*2);ctx.fill();ctx.save();ctx.clip();ctx.fillStyle=k.mark;
      for(let i=0;i<(k.name==='Tancho'?1:4);i++){ctx.beginPath();ctx.ellipse(size*(.32-i*.23),Math.sin(i*4)*size*.05,size*.09,size*.16,.4*i,0,Math.PI*2);ctx.fill();}ctx.restore();
      ctx.fillStyle='#1c3027';for(const y of [-1,1]){ctx.beginPath();ctx.arc(size*.35,y*size*.095,1.5,0,Math.PI*2);ctx.fill();}
    }else if(k.type==='trash'){
      ctx.rotate(-.3);ctx.fillRect(-size*.2,-size*.25,size*.4,size*.5);ctx.strokeRect(-size*.2,-size*.25,size*.4,size*.5);ctx.strokeStyle='#5e775e';ctx.beginPath();ctx.moveTo(-size*.18,-size*.1);ctx.lineTo(size*.18,-size*.1);ctx.moveTo(-size*.18,size*.1);ctx.lineTo(size*.18,size*.1);ctx.stroke();
    }else if(k.type==='cable'){
      ctx.strokeStyle=k.color;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,0,size*.25,size*.2,0,0,Math.PI*2);ctx.moveTo(size*.25,0);ctx.bezierCurveTo(size*.6,size*.4,-size*.5,size*.3,-size*.35,-size*.2);ctx.stroke();ctx.fillRect(-size*.42,-size*.3,9,7);
    }else{
      ctx.strokeStyle=k.color;for(let i=0;i<(k.type==='bug'?6:9);i++){const a=i*Math.PI*2/(k.type==='bug'?6:9);ctx.beginPath();ctx.moveTo(Math.cos(a)*size*.14,Math.sin(a)*size*.14);ctx.lineTo(Math.cos(a)*size*.34,Math.sin(a)*size*.34);ctx.stroke();}
      ctx.beginPath();ctx.ellipse(0,0,size*.19,size*.24,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#26392c';ctx.fillRect(-5,-4,3,3);ctx.fillRect(3,-4,3,3);
    }ctx.restore();
  }
  function draw(){
    ctx.clearRect(0,0,w,h);
    const sx=w*.2,sy=h*.76,scale=clamp(w/800,.7,1.1),dockW=w<500?w*.48:w*.34;
    ctx.fillStyle='#122e2470';ctx.fillRect(0,h*.74+8,dockW+12,h*.26);
    const wood=ctx.createLinearGradient(0,h*.74,0,h);wood.addColorStop(0,'#9b9a71');wood.addColorStop(1,'#74795b');ctx.fillStyle=wood;ctx.fillRect(0,h*.74,dockW,h*.26);
    ctx.strokeStyle='#3c513b77';ctx.lineWidth=1;for(let y=h*.74;y<h;y+=22){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(dockW,y);ctx.stroke();for(let x=13;x<dockW;x+=50){ctx.fillStyle='#42543b88';ctx.beginPath();ctx.arc(x,y+5,1.5,0,Math.PI*2);ctx.fill();}}
    ctx.strokeStyle='#c0bc8b55';for(let i=0;i<7;i++){ctx.beginPath();ctx.moveTo(0,h*.78+i*12);ctx.bezierCurveTo(dockW*.3,h*.75+i*13,dockW*.55,h*.8+i*11,dockW,h*.78+i*12);ctx.stroke();}
    // Cleanup bin stays visible beside the fisherman.
    const binX=dockW*.18,binY=h*.88;
    ctx.save();ctx.translate(binX,binY);ctx.fillStyle='#304d3b';ctx.beginPath();ctx.roundRect(-14*scale,-18*scale,28*scale,36*scale,3);ctx.fill();ctx.strokeStyle='#bcc79d';ctx.stroke();ctx.fillStyle='#c6d5a9';ctx.fillRect(-17*scale,-21*scale,34*scale,5*scale);ctx.font=`${9*scale}px monospace`;ctx.textAlign='center';ctx.fillText('BIN',0,4*scale);ctx.restore();
    // Figure: wide straw hat, linen shirt, crossed legs and articulated casting arm.
    const arm=state==='disposing'?Math.sin(clamp(timer/1.5,0,1)*Math.PI)*.8:state==='casting'?-Math.sin(timer/.8*Math.PI)*.7:held?-.18:0;
    ctx.save();ctx.translate(sx,sy);ctx.scale(scale,scale);ctx.fillStyle='#1c362b55';ctx.beginPath();ctx.ellipse(0,25,37,14,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#263f34';ctx.lineWidth=11;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-8,17);ctx.lineTo(10,34);ctx.lineTo(26,25);ctx.moveTo(9,16);ctx.lineTo(23,27);ctx.lineTo(28,36);ctx.stroke();
    ctx.fillStyle='#e3dfbd';ctx.beginPath();ctx.ellipse(0,6,17,25,-.2,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#c5c6a4';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(27,-9+arm*25);ctx.stroke();
    ctx.fillStyle='#bb956e';ctx.beginPath();ctx.arc(28,-9+arm*25,5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#d4bf85';ctx.beginPath();ctx.ellipse(-2,-17,29,17,-.2,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#9b8a5b';ctx.lineWidth=1;ctx.stroke();ctx.fillStyle='#bda772';ctx.beginPath();ctx.ellipse(-4,-21,15,11,-.2,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#667452';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(-3,-18,16,8,-.2,0,Math.PI);ctx.stroke();ctx.restore();
    const rodX=sx+28*scale,rodY=sy+(-9+arm*25)*scale,tipX=rodX+65*scale,tipY=rodY-105*scale;
    ctx.strokeStyle='#d4c78e';ctx.lineWidth=2.6;ctx.beginPath();ctx.moveTo(rodX,rodY);ctx.quadraticCurveTo(tipX-12,tipY+30,tipX,tipY);ctx.stroke();
    let bx=cast.x*w,by=cast.y*h;
    if(state==='casting'){const q=clamp(timer/.8,0,1);bx=lerp(tipX,bx,q);by=lerp(tipY,by,q)-Math.sin(q*Math.PI)*h*.2;}
    if(['casting','waiting','bite','reeling'].includes(state)){
      ctx.strokeStyle='#e8e7c699';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(tipX,tipY);ctx.quadraticCurveTo((tipX+bx)/2,Math.max(tipY,by)-20,bx,by);ctx.stroke();
      const bob=state==='bite'?Math.sin(clock*18)*5:Math.sin(clock*3)*2;ctx.strokeStyle='#dce6bd77';ctx.beginPath();ctx.ellipse(bx,by+5,16+Math.sin(clock*3)*3,7,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#f0ead1';ctx.beginPath();ctx.ellipse(bx,by+bob,4,8,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#b76446';ctx.beginPath();ctx.arc(bx,by-3+bob,4,Math.PI,Math.PI*2);ctx.fill();
      if(state==='bite'){ctx.fillStyle='#f3e2a7';ctx.font='bold 40px serif';ctx.textAlign='center';ctx.fillText('!',bx,by-27);}
    }
    if(state==='idle'&&!paused){ctx.strokeStyle='#ecedc755';ctx.setLineDash([3,5]);ctx.beginPath();ctx.ellipse(aim.x*w,aim.y*h,18,9,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
    if(['landed','disposing','releasing'].includes(state)){
      let x=sx+60*scale,y=sy-45*scale,a=-.3;
      if(state==='disposing'){const q=clamp(timer/1.5,0,1);x=lerp(x,binX,q);y=lerp(y,binY-17,q)-Math.sin(q*Math.PI)*h*.25;a=q*5;if(q>.96)ctx.globalAlpha=0;}
      if(state==='releasing'){const q=clamp(timer/1.5,0,1);x=lerp(x,w*.57,q);y=lerp(y,h*.45,q)-Math.sin(q*Math.PI)*h*.16;ctx.globalAlpha=1-q;}
      drawItem(item,x,y,58*scale,a);ctx.globalAlpha=1;
    }
    if(paused){ctx.fillStyle='#102c2399';ctx.fillRect(0,0,w,h);ctx.fillStyle='#edf0d9';ctx.font='italic 34px Georgia';ctx.textAlign='center';ctx.fillText('A moment of stillness.',w/2,h*.45);ctx.font='12px monospace';ctx.fillText('RESUME WHEN YOU’RE READY',w/2,h*.45+34);}
  }
  function resize(){const b=canvas.getBoundingClientRect(),r=Math.min(devicePixelRatio||1,1.8);w=b.width;h=b.height;canvas.width=Math.round(w*r);canvas.height=Math.round(h*r);ctx.setTransform(r,0,0,r,0,0);draw();}
  function pick(){
    // A shuffled bag guarantees every fish and cleanup type appears over time.
    if(!deck.length){deck=kinds.map((_,i)=>i);for(let i=deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}}
    return kinds[deck.pop()];
  }
  function idle(message='Choose a spot, then cast your line.'){setState('idle');$('#fishing-phase').textContent='01 / CAST';announce(message);label('Cast line ↗');action.disabled=false;}
  function castLine(){item=pick();cast={...aim};phase=Math.random()*6.28;landed=false;setState('casting');action.disabled=true;$('#fishing-phase').textContent='01 / CAST';announce('A small ripple. Let the pond settle.');label('Casting…');startLoop();}
  let waitFor=3;
  function hook(){setState('reeling');progress=.35;zone=.35;velocity=0;target=.5;$('#fishing-phase').textContent='02 / REEL';announce('Hold to lift the green bar. Release to let it fall. Keep the fish inside.');label('Hold to reel ↑');action.disabled=false;}
  function caught(){
    if(landed)return;landed=true;setState('landed');
    $('#catch-kind').textContent=item.type==='koi'?'A LITTLE DISCOVERY':'A CLEANER POND';$('#catch-name').textContent=item.name;$('#catch-detail').textContent=item.note;
    $('#fishing-phase').textContent='03 / CATCH';announce(item.type==='koi'?`${item.name} caught. Let’s return it to the water.`:`${item.name} caught. The fisherman will put it in the bin.`);label(item.type==='koi'?'Release koi ↗':'Put in bin ↗');action.disabled=false;
  }
  function resolve(){setState(item.type==='koi'?'releasing':'disposing');action.disabled=true;label(item.type==='koi'?'Returning to pond…':'Cleaning up…');announce(item.type==='koi'?'Back to the pond, safe and sound.':'A clean toss into the bin. One less thing in the water.');}
  function update(dt){
    clock+=dt;timer+=dt;
    if(state==='casting'&&timer>=.8){setState('waiting');waitFor=2.2+Math.random()*2;$('#fishing-phase').textContent='WAIT / WATCH THE BOBBER';announce('Watch the float. A bite is coming…');label('Waiting for a bite…');}
    else if(state==='waiting'&&timer>=waitFor){setState('bite');bites++;action.disabled=false;label('Hook it! ↗');$('#fishing-phase').textContent='BITE / HOOK NOW';announce('A bite! Press Hook it or Enter.');}
    else if(state==='bite'&&timer>(gentle.checked?5:3)){idle('That one slipped away. Cast again when you’re ready.');}
    else if(state==='reeling'){
      const easy=gentle.checked,zoneSize=easy?.38:.27;
      velocity+=(held?1.5:-1.1)*dt;velocity*=Math.exp(-dt*3.3);zone=clamp(zone+velocity*dt,0,1-zoneSize);if(zone===0||zone===1-zoneSize)velocity*=.1;
      target=clamp(.5+Math.sin(timer*(easy?.85:1.5)+phase)*.27+Math.sin(timer*2.1+phase)*.09,.07,.93);
      const inside=target>=zone&&target<=zone+zoneSize;
      progress=clamp(progress+(inside?(easy?.24:.19):-(easy?.055:.1))*dt,0,1);
      $('.meter-zone').style.bottom=zone*100+'%';$('.meter-zone').style.height=zoneSize*100+'%';$('.meter-zone').style.background=inside?'#c8e99b99':'#c8e99b44';$('.meter-fish').style.bottom=target*100+'%';$('.catch-progress>span').style.height=progress*100+'%';$('.meter-percent').textContent=Math.round(progress*100)+'%';
      if(progress>=1)caught();else if(progress<=0||timer>50)idle('The line went slack. No worries — there’s always another cast.');
    }else if((state==='disposing'||state==='releasing')&&timer>=1.7){if(item.type==='koi'){saved.fish++;if(!saved.found.includes(item.name))saved.found.push(item.name);}else saved.clean++;journal();idle(item.type==='koi'?'Koi returned. A good moment, safely kept.':'Cleanup complete. The pond is a little better for it.');}
  }
  function frame(now){raf=0;if(paused||state==='welcome'||document.hidden)return;const dt=Math.min((now-last)/1000||.016,.04);last=now;update(dt);draw();raf=requestAnimationFrame(frame);}
  function startLoop(){if(!raf&&!paused&&state!=='welcome'){last=performance.now();raf=requestAnimationFrame(frame);}}
  function togglePause(force){if(state==='welcome')return;paused=typeof force==='boolean'?force:!paused;held=false;action.classList.remove('is-held');pause.textContent=paused?'Resume':'Pause';action.disabled=paused||['casting','waiting','disposing','releasing'].includes(state);if(paused){cancelAnimationFrame(raf);raf=0;announce('Fishing paused. Your catch and progress are safe.');draw();}else{announce(state==='reeling'?'Hold to lift; release to drop. Keep the fish in the green bar.':'Back at the pond. Take your time.');startLoop();}}
  function interact(){if(paused)return;if(state==='idle')castLine();else if(state==='bite')hook();else if(state==='landed')resolve();}
  function press(){if(state==='reeling'&&!paused){held=true;action.classList.add('is-held');}}
  function release(){held=false;action.classList.remove('is-held');}
  $('#fishing-start').addEventListener('click',()=>{welcome.hidden=true;pause.disabled=false;idle();canvas.focus({preventScroll:true});startLoop();});
  action.addEventListener('click',interact);action.addEventListener('pointerdown',e=>{if(state==='reeling'){e.preventDefault();action.setPointerCapture(e.pointerId);press();}});action.addEventListener('pointerup',release);action.addEventListener('pointercancel',release);
  canvas.addEventListener('pointermove',e=>{if(state!=='idle')return;const b=canvas.getBoundingClientRect();aim={x:clamp((e.clientX-b.left)/w,.4,.78),y:clamp((e.clientY-b.top)/h,.22,.62)};});
  canvas.addEventListener('pointerdown',e=>{canvas.focus({preventScroll:true});if(state==='reeling'){e.preventDefault();canvas.setPointerCapture(e.pointerId);press();}else interact();});canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
  const keyDown=e=>{if(e.key==='Escape'){e.preventDefault();togglePause(true);}else if(e.key===' '){e.preventDefault();if(!e.repeat){if(state==='reeling')press();else interact();}}else if(e.key==='Enter'&&e.target===canvas){e.preventDefault();if(!e.repeat)interact();}else if(e.target===canvas&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();aim.x=clamp(aim.x+(e.key==='ArrowRight'?.03:e.key==='ArrowLeft'?-.03:0),.4,.78);aim.y=clamp(aim.y+(e.key==='ArrowDown'?.03:e.key==='ArrowUp'?-.03:0),.22,.62);}};
  canvas.addEventListener('keydown',keyDown);action.addEventListener('keydown',keyDown);[canvas,action].forEach(el=>{el.addEventListener('keyup',e=>{if(e.key===' '){e.preventDefault();release();}});el.addEventListener('blur',release);});
  pause.addEventListener('click',()=>togglePause());document.addEventListener('visibilitychange',()=>{if(document.hidden)togglePause(true);});document.addEventListener('portfolio:pond-open',()=>togglePause(true));
  new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)togglePause(true);},{threshold:.05}).observe(canvas);
  new ResizeObserver(resize).observe(canvas);journal();resize();
})();
