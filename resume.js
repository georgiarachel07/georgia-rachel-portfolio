/* Rendered résumé viewer: no PDF URL, native PDF toolbar, or download control. */
(() => {
  const dialog=document.getElementById('resume-dialog'),open=document.getElementById('resume-open'),close=document.getElementById('resume-close'),page=dialog.querySelector('.resume-page'),scroll=dialog.querySelector('.resume-scroll'),minus=document.getElementById('resume-zoom-out'),plus=document.getElementById('resume-zoom-in'),output=document.getElementById('resume-zoom');
  let zoom=100;
  function render(){page.style.setProperty('--resume-width',zoom+'%');output.textContent=zoom+'%';minus.disabled=zoom<=100;plus.disabled=zoom>=250;}
  open.addEventListener('click',()=>{zoom=100;render();dialog.showModal();scroll.scrollTop=0;scroll.scrollLeft=0;close.focus();document.dispatchEvent(new Event('portfolio:pond-open'));});
  close.addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>open.focus({preventScroll:true}));
  minus.addEventListener('click',()=>{zoom=Math.max(100,zoom-25);render();});plus.addEventListener('click',()=>{zoom=Math.min(250,zoom+25);render();});
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  render();
})();
