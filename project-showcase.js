/* Live project previews load only after an explicit visitor action. */
(() => {
  const dialog=document.getElementById('project-preview-dialog'),frameHost=document.getElementById('project-preview-frame'),close=document.getElementById('project-preview-close'),full=document.getElementById('project-preview-open'),title=document.getElementById('project-preview-title');
  let opener=null;
  document.querySelectorAll('[data-project]').forEach(button=>button.addEventListener('click',()=>{
    opener=button;title.textContent=button.dataset.title;full.href=button.dataset.url;
    const iframe=document.createElement('iframe');iframe.title=button.dataset.title+' interactive live demo';iframe.src=button.dataset.url;iframe.setAttribute('sandbox','allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox');iframe.referrerPolicy='strict-origin-when-cross-origin';const loading=document.createElement('p');loading.className='project-preview-loading';loading.setAttribute('role','status');loading.textContent='Opening the live demo…';iframe.addEventListener('load',()=>loading.remove(),{once:true});frameHost.replaceChildren(loading,iframe);
    dialog.showModal();close.focus();document.dispatchEvent(new Event('portfolio:pond-open'));
  }));
  close.addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{frameHost.replaceChildren();opener?.focus({preventScroll:true});});
})();
