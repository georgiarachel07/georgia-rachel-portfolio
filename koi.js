/*
 * Original Canvas 2D koi study for Georgia Rachel's portfolio.
 * Conceptual inspiration: Nagomi, https://github.com/msk1039/nagomi
 * No Nagomi source, artwork, shaders, or dependencies are included.
 * Steering, articulated silhouettes, patterned bodies and ripples are drawn here.
 */
(() => {
  'use strict';
  const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const angleDelta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
  let motion=!document.documentElement.classList.contains('motion-paused');
  let time=0,last=0,raf=0,heroVisible=true,testimonialVisible=false,fishingVisible=false,immersive=false,introActive=document.documentElement.classList.contains('intro-pending'),opener=null;
  const dialog=document.getElementById('pond-dialog');
  const root=document.documentElement;
  const scenes=[];

  function createScene(id,count,clear=false){
    const canvas=document.getElementById(id),ctx=canvas.getContext('2d');
    const scene={canvas,ctx,clear,count,w:600,h:470,fish:[],ripples:[],target:null,food:[],visible:true,scale:1};
    scenes.push(scene);return scene;
  }
  const hero=createScene('pond-canvas',4),full=createScene('immersive-pond',7),intro=createScene('startup-canvas',4),testimonials=createScene('testimonial-pond',5),fishing=createScene('fishing-pond',6);
  const palettes=[['#eee5cf','#d5603d','#344139'],['#eee9d8','#b4432e','#242d2b'],['#d9a65b','#b16e32','#efe2b9'],['#e9e3cd','#303d3a','#e09255']];
  const fishingUsedSeeds=new Set();let fishingNextSeed=0;
  try{const inventory=JSON.parse(localStorage.getItem('georgia-quiet-catch-v1'))?.inventory||[];inventory.forEach(f=>{if(Number.isFinite(f.seed))fishingUsedSeeds.add(f.seed);});}catch{}
  function makeFish(scene,index){
    if(scene===fishing){do{fishingNextSeed++;}while(fishingUsedSeeds.has(fishingNextSeed));index=fishingNextSeed-1;fishingUsedSeeds.add(fishingNextSeed);}
    const random=(n)=>(Math.sin((index+1)*37.21+n*17.87)*.5+.5);
    const x=scene.w*(.22+random(1)*.56),y=scene.h*(.18+random(2)*.6);
    return {id:scene===fishing?'pond-koi-'+(index+1):'ambient-koi-'+index,name:['Showa','Kohaku','Golden Ogon','Shiro Bekko','Tancho'][index%5],x,y,angle:random(3)*TAU,turn:0,phase:index*2.37,size:scene.clear?92:(scene.w<500?87:114)*(index%3===0?1.13:.9),speed:scene.clear?40:22+random(4)*13,seed:index+1,palette:scene===fishing?[palettes[0],palettes[1],palettes[2],palettes[3],['#eee9d4','#b34c34','#eee9d4']][index%5]:palettes[index%palettes.length],depth:random(5),velocity:20,angularSpeed:0,swimPhase:index*2.37,joints:Array(25).fill(0),pose:null};
  }
  function resize(scene){
    const box=scene.canvas.getBoundingClientRect();if(!box.width||!box.height)return;
    const oldW=scene.w,oldH=scene.h;scene.w=box.width;scene.h=box.height;
    const dpr=Math.min(devicePixelRatio||1,1.8);scene.canvas.width=Math.round(box.width*dpr);scene.canvas.height=Math.round(box.height*dpr);scene.ctx.setTransform(dpr,0,0,dpr,0,0);
    if(!scene.fish.length)scene.fish=Array.from({length:scene.count},(_,i)=>makeFish(scene,i));
    else scene.fish.forEach(f=>{f.x=f.x/oldW*scene.w;f.y=f.y/oldH*scene.h;if(!scene.clear)f.size=(scene.w<500?87:114)*(f.seed%3===1?1.13:.9)*(scene===full?1.1:1);});
    scene.scale=clamp(scene.w/650,.7,1.5);draw(scene);
  }
  function updateBody(f,dt){
    if(!f.pose){f.joints.fill(f.angle);f.pose=Array.from({length:25},()=>({x:0,y:0}));}
    f.swimPhase+=dt*(4.7+f.velocity/f.speed*1.4);
    let x=0,y=0;f.pose[0]={x:0,y:0};
    for(let i=1;i<25;i++){
      const t=i/24,previous=i===1?f.angle:f.joints[i-1];
      f.joints[i]+=angleDelta(previous,f.joints[i])*(1-Math.exp(-dt*(15-t*7)));
      const local=f.joints[i]-f.angle;x-=Math.cos(local)*f.size/24;y-=Math.sin(local)*f.size/24;
      const effort=.018+clamp(f.velocity/f.speed,.3,1.8)*.035;
      const wave=Math.sin(t*6.4-f.swimPhase)*Math.pow(t,1.85)*f.size*effort;
      f.pose[i]={x:x-Math.sin(local)*wave,y:y+Math.cos(local)*wave};
    }
  }
  function bodyShape(f,t){
    if(!f.pose)updateBody(f,0);
    const at=clamp(t,0,1)*24,i=Math.min(23,Math.floor(at)),mix=at-i;
    return {x:f.pose[i].x+(f.pose[i+1].x-f.pose[i].x)*mix,y:f.pose[i].y+(f.pose[i+1].y-f.pose[i].y)*mix};
  }
  function widthAt(t,l){return l*(.018+.115*Math.pow(Math.sin(Math.PI*Math.pow(t,.68)),1.5));}
  function fishPath(f){
    const path=new Path2D(),left=[],right=[];
    for(let i=0;i<=24;i++){
      const t=i/24,p=bodyShape(f,t),a=bodyShape(f,Math.max(0,t-.02)),b=bodyShape(f,Math.min(1,t+.02));
      const length=Math.hypot(b.x-a.x,b.y-a.y)||1,nx=-(b.y-a.y)/length,ny=(b.x-a.x)/length,width=widthAt(t,f.size);
      left.push([p.x+nx*width,p.y+ny*width]);right.push([p.x-nx*width,p.y-ny*width]);
    }
    const points=[...left,...right.reverse()];path.moveTo((points[0][0]+points.at(-1)[0])/2,(points[0][1]+points.at(-1)[1])/2);
    for(let i=0;i<points.length;i++){const p=points[i],next=points[(i+1)%points.length];path.quadraticCurveTo(p[0],p[1],(p[0]+next[0])/2,(p[1]+next[1])/2);}
    path.closePath();return path;
  }
  function paintFish(ctx,f,shadow=false){
    ctx.save();ctx.translate(f.x+(shadow?9:0),f.y+(shadow?12:0));ctx.rotate(f.angle);
    const l=f.size,shape=fishPath(f),tail={x:0,y:0},tailBase=bodyShape(f,1),flap=Math.sin(f.swimPhase-6.4)*l*.018;
    if(shadow){ctx.fillStyle='rgba(4,18,14,.20)';ctx.fill(shape);ctx.restore();return;}
    ctx.globalAlpha=.88+Math.sin(time*.3+f.phase)*.08;
    // Pectoral and pelvic fins. Transparent membranes and fine radial rays.
    for(const side of [-1,1]){
      const p=bodyShape(f,.24),spread=l*(.2+Math.sin(f.swimPhase*.55+side*.4)*.012);
      ctx.fillStyle=f.palette[0]+'a6';ctx.strokeStyle=f.palette[0]+'a0';ctx.lineWidth=.7;
      ctx.beginPath();ctx.moveTo(p.x+l*.025,p.y+side*l*.08);ctx.bezierCurveTo(p.x-l*.03,p.y+side*spread,p.x-l*.21,p.y+side*(spread+flap),p.x-l*.13,p.y+side*l*.06);ctx.closePath();ctx.fill();
      for(let r=0;r<5;r++){ctx.beginPath();ctx.moveTo(p.x,p.y+side*l*.085);ctx.lineTo(p.x-l*(.03+r*.026),p.y+side*(spread*.85+flap*r/5));ctx.stroke();}
      const q=bodyShape(f,.69);ctx.fillStyle=f.palette[0]+'85';ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.quadraticCurveTo(q.x-l*.02,q.y+side*l*.12,q.x-l*.14,q.y+side*l*.09);ctx.closePath();ctx.fill();
    }
    // The caudal fan follows the tail tangent, rather than the head orientation.
    const beforeTail=bodyShape(f,.96),tailAngle=Math.atan2(beforeTail.y-tailBase.y,beforeTail.x-tailBase.x);
    ctx.save();ctx.translate(tailBase.x,tailBase.y);ctx.rotate(tailAngle);
    ctx.fillStyle=f.palette[0]+'ca';ctx.strokeStyle=f.palette[0]+'c0';ctx.lineWidth=.6;
    ctx.beginPath();ctx.moveTo(tail.x+l*.03,tail.y);ctx.bezierCurveTo(tail.x-l*.08,tail.y-l*.11,tail.x-l*.22,tail.y-l*.17+flap,tail.x-l*.25,tail.y-l*.11+flap);ctx.quadraticCurveTo(tail.x-l*.19,tail.y+flap,tail.x-l*.25,tail.y+l*.11+flap);ctx.bezierCurveTo(tail.x-l*.20,tail.y+l*.17+flap,tail.x-l*.07,tail.y+l*.1,tail.x+l*.03,tail.y);ctx.fill();ctx.stroke();
    for(let r=-4;r<=4;r++){ctx.beginPath();ctx.moveTo(tail.x,tail.y);ctx.quadraticCurveTo(tail.x-l*.11,tail.y+r*l*.019,tail.x-l*.23,tail.y+r*l*.026+flap);ctx.stroke();}
    ctx.restore();
    ctx.fillStyle=f.palette[0];ctx.fill(shape);
    ctx.save();ctx.clip(shape);
    // Each fish has stable, asymmetrical markings attached to its moving body.
    for(let i=0;i<(f.name==='Tancho'?1:6);i++){
      const t=.07+i*.142,p=bodyShape(f,t),side=Math.sin(f.seed*11+i*7)*.65;
      ctx.fillStyle=i%3===2?f.palette[2]:f.palette[1];
      ctx.beginPath();ctx.ellipse(p.x,p.y+side*widthAt(t,l),l*(.045+Math.abs(Math.sin(i+f.seed))*.025),l*(.065+Math.abs(Math.cos(i*3))*.035),Math.sin(i*2+f.seed)*.8,0,TAU);ctx.fill();
      if(i%2===0){ctx.beginPath();ctx.ellipse(p.x-l*.035,p.y+l*.04,l*.043,l*.055,.6,0,TAU);ctx.fill();}
    }
    const shine=ctx.createLinearGradient(0,-l*.15,0,l*.15);shine.addColorStop(0,'rgba(255,255,240,.28)');shine.addColorStop(.45,'rgba(255,255,240,0)');shine.addColorStop(1,'rgba(15,40,29,.23)');ctx.fillStyle=shine;ctx.fill(shape);
    ctx.strokeStyle='rgba(255,255,234,.10)';ctx.lineWidth=.5;
    for(let row=0;row<11;row++){const t=.21+row*.058,p=bodyShape(f,t),w=widthAt(t,l);for(let col=-2;col<=2;col++){ctx.beginPath();ctx.arc(p.x+(col%2)*l*.01,p.y+col*w*.32,l*.028,-1.4,1.4);ctx.stroke();}}
    ctx.restore();
    // Dorsal ridge, eyes, and tiny barbels make the head legible at small sizes.
    ctx.strokeStyle='rgba(255,248,219,.42)';ctx.lineWidth=1;ctx.beginPath();for(let i=5;i<18;i++){const p=bodyShape(f,i/24);if(i===5)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);}ctx.stroke();
    for(const side of [-1,1]){const p=bodyShape(f,.09);ctx.fillStyle='#19251f';ctx.beginPath();ctx.ellipse(p.x,p.y+side*l*.055,l*.013,l*.01,0,0,TAU);ctx.fill();ctx.fillStyle='#f7f0d9';ctx.beginPath();ctx.arc(p.x+l*.003,p.y+side*l*.055,l*.0035,0,TAU);ctx.fill();ctx.strokeStyle=f.palette[0];ctx.lineWidth=.75;ctx.beginPath();ctx.moveTo(l*.005,side*l*.022);ctx.quadraticCurveTo(l*.05,side*l*.035,l*.04,side*l*.065);ctx.stroke();}
    ctx.restore();
  }

  function steer(scene,f,dt){
    const w=scene.w,h=scene.h;
    let desired=f.angle+Math.sin(time*.46+f.phase)*.5,desiredSpeed=f.speed;
    {
      // Soft wall avoidance blends with natural wandering, separation, and tap attraction.
      let vx=Math.cos(desired),vy=Math.sin(desired),margin=80;
      if(f.x<margin)vx+=(margin-f.x)/margin*2.4;if(f.x>w-margin)vx-=(f.x-w+margin)/margin*2.4;
      if(f.y<margin)vy+=(margin-f.y)/margin*2.4;if(f.y>h-margin)vy-=(f.y-h+margin)/margin*2.4;
      scene.fish.forEach(other=>{if(other===f)return;const dx=f.x-other.x,dy=f.y-other.y,d=Math.hypot(dx,dy);if(d<70&&d>0){vx+=dx/d*(1-d/70)*1.2;vy+=dy/d*(1-d/70)*1.2;}});
      if(scene.target&&scene.target.until>time&&(!scene.target.followers||scene.target.followers.has(f))){const dx=scene.target.x-f.x,dy=scene.target.y-f.y,d=Math.hypot(dx,dy)||1;const circle=d<48?1.1:0;vx+=dx/d*2.3-dy/d*circle;vy+=dy/d*2.3+dx/d*circle;desiredSpeed=f.speed*(d>65?1.65:.62);}
      else if(scene.target&&scene.target.until<=time)scene.target=null;
      desired=Math.atan2(vy,vx);
    }
    const hooked=scene===fishing&&scene.hooked===f,turnLimit=hooked?3.8:.85;
    const difference=angleDelta(desired,f.angle),turnGoal=clamp(difference*(hooked?5:1.35),-turnLimit,turnLimit);
    f.angularSpeed+=(turnGoal-f.angularSpeed)*(1-Math.exp(-dt*3));
    f.angle+=f.angularSpeed*dt;f.turn+=(f.angularSpeed-f.turn)*(1-Math.exp(-dt*3));
    const coast=.86+.14*Math.sin(time*.7+f.phase);
    f.velocity+=(desiredSpeed*coast-f.velocity)*(1-Math.exp(-dt*1.7));
    f.x+=Math.cos(f.angle)*f.velocity*dt;f.y+=Math.sin(f.angle)*f.velocity*dt;
    f.x=clamp(f.x,-35,w+35);f.y=clamp(f.y,-35,h+35);
    if(hooked){const tx=scene.target.x+Math.sin(time*8)*27,ty=scene.target.y+Math.cos(time*11)*14;f.x+=(tx-f.x)*(1-Math.exp(-dt*3));f.y+=(ty-f.y)*(1-Math.exp(-dt*3));f.angle+=Math.sin(time*18)*dt*2.8;f.swimPhase+=dt*9;}
    updateBody(f,dt);
  }

  function leaf(ctx,x,y,r,rotation){
    ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.fillStyle='rgba(5,20,14,.17)';ctx.beginPath();ctx.ellipse(6,10,r*1.06,r*.8,0,0,TAU);ctx.fill();
    ctx.fillStyle='#486b4e';ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,r,-.16,TAU-.55);ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(187,207,139,.23)';ctx.lineWidth=.8;
    for(let i=0;i<12;i++){const a=i*TAU/12;ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(Math.cos(a)*r*.65,Math.sin(a)*r*.4,Math.cos(a)*r*.94,Math.sin(a)*r*.94);ctx.stroke();}ctx.restore();
  }
  function draw(scene){
    const {ctx,w,h}=scene;ctx.clearRect(0,0,w,h);
    if(!scene.clear){
      const bg=ctx.createRadialGradient(w*.55,h*.4,20,w*.5,h*.5,w*.9);bg.addColorStop(0,'#537763');bg.addColorStop(.5,'#365e4b');bg.addColorStop(1,'#183c2b');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
      // Quiet riverbed stones and slow, wandering caustic lines.
      for(let i=0;i<38;i++){const x=(Math.sin(i*91.43)*.5+.5)*w,y=(Math.cos(i*37.4)*.5+.5)*h;ctx.fillStyle=i%2?'rgba(207,213,158,.035)':'rgba(8,34,24,.07)';ctx.beginPath();ctx.ellipse(x,y,8+(i%5)*3,6+(i%4)*2,i,0,TAU);ctx.fill();}
      ctx.lineWidth=.7;
      for(let i=0;i<8;i++){ctx.strokeStyle=`rgba(218,235,185,${.045+Math.sin(time*.3+i)*.015})`;ctx.beginPath();for(let j=0;j<=26;j++){const x=j*w/26,y=h*(i/7)+Math.sin(j*.35+time*.16+i)*22+Math.sin(j*.7-time*.11)*10;if(j===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();}
      scene.fish.forEach(f=>paintFish(ctx,f,true));
    }
    scene.fish.forEach(f=>paintFish(ctx,f));
    if(!scene.clear){
      // Surface rings respond directly to visitor input.
      scene.ripples.forEach(r=>{const age=time-r.born;for(let i=0;i<3;i++){const radius=age*31-i*14;if(radius>0){ctx.strokeStyle=`rgba(232,241,201,${Math.max(0,(1-age/3.5)*.28-i*.035)})`;ctx.lineWidth=.9;ctx.beginPath();ctx.ellipse(r.x,r.y,radius,radius*.78,0,0,TAU);ctx.stroke();}}});
      scene.food.forEach(p=>{const age=time-p.born;if(age<5){ctx.globalAlpha=1-age/5;ctx.fillStyle='#e1bd6d';ctx.beginPath();ctx.arc(p.x+Math.sin(age+p.seed)*age,p.y+Math.cos(age+p.seed)*age,1.8,0,TAU);ctx.fill();ctx.globalAlpha=1;}});
      const sway=Math.sin(time*.18)*.035;
      leaf(ctx,w*.92,h*.08,42*scene.scale,.4+sway);leaf(ctx,w*.98,h*.23,31*scene.scale,-.3+sway);leaf(ctx,w*.83,h*.02,29*scene.scale,1+sway);
      if(scene===full||scene===testimonials){leaf(ctx,w*.04,h*.79,55*scene.scale,.8+sway);leaf(ctx,w*.1,h*.92,37*scene.scale,-.2+sway);}
      ctx.strokeStyle='rgba(227,239,203,.08)';ctx.lineWidth=1;ctx.strokeRect(.5,.5,w-1,h-1);
    }
  }
  function feed(scene,x=scene.w*.52,y=scene.h*.42){
    scene.target={x,y,until:time+9};scene.ripples.push({x,y,born:time});
    for(let i=0;i<8;i++)scene.food.push({x:x+Math.sin(i*2.3)*18,y:y+Math.cos(i*3.7)*14,born:time,seed:i});
    if(scene.ripples.length>12)scene.ripples.shift();if(scene.food.length>80)scene.food.splice(0,8);
    if(scene===hero)document.getElementById('hero-pond').classList.add('has-fed');
    document.getElementById('pond-announcement').textContent=motion?'The koi are swimming toward the food.':'Food placed. Enable motion using the Motion button to watch the koi follow.';
    if(!motion)draw(scene);
  }
  for(const scene of [hero,full]){
    scene.canvas.addEventListener('pointerdown',e=>{const b=scene.canvas.getBoundingClientRect();feed(scene,e.clientX-b.left,e.clientY-b.top);});
    scene.canvas.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();feed(scene);}});
  }
  document.querySelectorAll('.call-koi').forEach(b=>b.addEventListener('click',()=>feed(hero)));
  document.getElementById('pond-feed').addEventListener('click',()=>feed(full));
  document.getElementById('pond-scatter').addEventListener('click',()=>{full.target=null;full.food=[];full.fish.forEach((f,i)=>{f.phase+=i%2?.6:-.6;});document.getElementById('pond-announcement').textContent='The koi are wandering freely.';if(!motion)draw(full);});
  const resizeObserver=new ResizeObserver(entries=>{for(const entry of entries){const scene=scenes.find(s=>s.canvas===entry.target);if(scene)resize(scene);}});
  scenes.forEach(scene=>resizeObserver.observe(scene.canvas));
  new IntersectionObserver(entries=>{heroVisible=entries[0].isIntersecting;if(heroVisible)start();},{threshold:0}).observe(hero.canvas);
  new IntersectionObserver(entries=>{testimonialVisible=entries[0].isIntersecting;if(testimonialVisible)start();},{threshold:0}).observe(testimonials.canvas);
  new IntersectionObserver(entries=>{fishingVisible=entries[0].isIntersecting;if(fishingVisible)start();},{threshold:0}).observe(fishing.canvas);
  // A cast locks one actual pond object; capture removes that same object.
  let fishingSerial=6;
  document.addEventListener('portfolio:fishing-select',event=>{
    const request=event.detail,px=request.x*fishing.w,py=request.y*fishing.h;
    const f=[...fishing.fish].sort((a,b)=>Math.hypot(a.x-px,a.y-py)-Math.hypot(b.x-px,b.y-py))[0];
    if(!f)return;
    fishing.selected=f;request.model=f;
    request.appearance={id:f.id,name:f.name,seed:f.seed,palette:[...f.palette],size:f.size,phase:f.phase,swimPhase:f.swimPhase,pose:f.pose?.map(p=>({...p}))};
    request.position=()=>({x:f.x/fishing.w,y:f.y/fishing.h});
    request.capture=()=>{const i=fishing.fish.indexOf(f);if(i>=0)fishing.fish.splice(i,1);fishing.hooked=null;fishing.target=null;fishing.selected=null;return {id:f.id,name:f.name,seed:f.seed,palette:[...f.palette],size:f.size,phase:f.phase,swimPhase:f.swimPhase,pose:f.pose.map(p=>({...p}))};};
    request.draw=(ctx,x,y,size,angle)=>drawCaughtFish(ctx,f,x,y,size,angle);
  });
  function drawCaughtFish(ctx,f,x,y,size,angle=0){ctx.save();ctx.translate(x,y);ctx.rotate(angle);const xs=f.pose.map(p=>p.x),ys=f.pose.map(p=>p.y),left=Math.min(...xs)-f.size*.28,right=Math.max(...xs)+f.size*.2,top=Math.min(...ys)-f.size*.26,bottom=Math.max(...ys)+f.size*.26,ratio=size/Math.max(right-left,bottom-top);ctx.scale(ratio,ratio);ctx.translate(-(left+right)/2,-(top+bottom)/2);paintFish(ctx,{...f,x:0,y:0,angle:0});ctx.restore();}
  document.addEventListener('portfolio:fishing-render',event=>{const {ctx,appearance,x,y,size}=event.detail;if(appearance?.pose)drawCaughtFish(ctx,appearance,x,y,size);});
  document.addEventListener('portfolio:fishing',event=>{
    const {state,x,y,paused,fishId}=event.detail;fishing.gamePaused=paused;
    if(state==='casting'&&fishing.fish.length<6){const f=makeFish(fishing,fishingSerial++);f.x=fishing.w+25;fishing.fish.push(f);}
    const selected=fishing.fish.find(f=>f.id===fishId);
    fishing.hooked=null;
    if(selected&&['casting','waiting','bite','reeling'].includes(state)){
      fishing.selected=selected;fishing.target={x:x*fishing.w,y:y*fishing.h,until:Infinity,followers:new Set([selected])};
      if(state==='reeling'||state==='bite')fishing.hooked=selected;
      if(state==='waiting')fishing.ripples.push({x:x*fishing.w,y:y*fishing.h,born:time});
    }else{fishing.target=null;fishing.selected=null;}
    if(!motion)draw(fishing);start();
  });
  function closePond(){dialog.close();}
  document.querySelectorAll('[data-open-pond]').forEach(b=>b.addEventListener('click',()=>{
    opener=b;dialog.showModal();immersive=true;start();root.classList.add('pond-is-open');resize(full);
    document.dispatchEvent(new Event('portfolio:pond-open'));document.getElementById('pond-close').focus();
    if(!motion)draw(full);
  }));
  document.getElementById('pond-close').addEventListener('click',closePond);
  dialog.addEventListener('close',()=>{immersive=false;root.classList.remove('pond-is-open');opener?.focus();});
  function tick(now){
    raf=0;if(!motion||document.hidden||(!introActive&&!immersive&&!heroVisible&&!testimonialVisible&&!fishingVisible))return;
    if(now-last<1000/60){raf=requestAnimationFrame(tick);return;}
    const dt=Math.min((now-last)/1000||.033,.065);last=now;time+=dt;
    const active=introActive?[intro]:immersive?[full]:[...(heroVisible?[hero]:[]),...(testimonialVisible?[testimonials]:[]),...(fishingVisible?[fishing]:[])];
    active.forEach(scene=>{if(scene===fishing&&scene.gamePaused)return;scene.fish.forEach(f=>steer(scene,f,dt));scene.ripples=scene.ripples.filter(r=>time-r.born<3.5);scene.food=scene.food.filter(p=>time-p.born<5);draw(scene);});
    raf=requestAnimationFrame(tick);
  }
  function start(){if(!raf&&motion&&!document.hidden){last=performance.now();raf=requestAnimationFrame(tick);}}
  document.addEventListener('portfolio:motion',e=>{motion=e.detail.enabled;if(!motion){cancelAnimationFrame(raf);raf=0;scenes.forEach(draw);}else start();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else start();});
  scenes.forEach(resize);
  // Place the first frame deliberately, then let the simulation take over.
  hero.fish.forEach((f,i)=>{f.x=hero.w*[.66,.35,.8,.48][i];f.y=hero.h*[.35,.32,.69,.66][i];f.angle=[-.7,2.1,-2.1,.7][i];});

  full.fish.forEach((f,i)=>{f.x=full.w*(.2+i*.09);f.y=full.h*(.3+(i%3)*.15);});
  scenes.forEach(scene=>scene.fish.forEach(f=>{f.pose=null;updateBody(f,0);}));
  scenes.forEach(draw);start();
  const startup=document.getElementById('startup-pond');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let finished=false;
  if(introActive)[...document.body.children].filter(el=>el!==startup&&el.tagName!=='SCRIPT').forEach(el=>{if(!el.inert){el.inert=true;el.setAttribute('data-intro-inert','');}});
  function finishIntro(){
    if(finished)return;finished=true;clearTimeout(window.introFailsafe);
    startup.classList.add('intro-leaving');introActive=false;
    document.querySelectorAll('[data-intro-inert]').forEach(el=>{el.inert=false;el.removeAttribute('data-intro-inert');});
    document.documentElement.classList.remove('intro-pending');
    setTimeout(()=>{startup.hidden=true;document.dispatchEvent(new Event('portfolio:intro-end'));const main=document.getElementById('main');if(document.activeElement===document.getElementById('skip-intro')){main.setAttribute('tabindex','-1');main.focus({preventScroll:true});}start();},reduced?0:380);
  }
  document.getElementById('skip-intro').addEventListener('click',finishIntro);
  document.addEventListener('keydown',e=>{if(introActive&&e.key==='Escape')finishIntro();});
  if(introActive)setTimeout(finishIntro,reduced?250:1350);else startup.hidden=true;
  if(!motion)draw(intro);

document.dispatchEvent(new Event('portfolio:koi-ready'));
})();
