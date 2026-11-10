'use strict';
(() => {
  const collection=document.querySelector('#certificate-collection');
  const modal=document.querySelector('#certificate-dialog');
  if(!collection||!modal)return;
  const image=modal.querySelector('img'),viewport=modal.querySelector('.certificate-viewport');
  const minus=modal.querySelector('[data-certificate-minus]'),plus=modal.querySelector('[data-certificate-plus]');
  let opener,zoom=1;
  const asset=path=>window.PORTFOLIO_CERTIFICATES?.[path]||path;
  function loadPreviews(){
    if(!collection.open)return;
    collection.querySelectorAll('[data-certificate-src]').forEach(img=>{
      img.src=asset(img.dataset.certificateSrc);img.removeAttribute('data-certificate-src');
    });
  }
  collection.addEventListener('toggle',loadPreviews);
  document.querySelectorAll('a[href="#certifications"]').forEach(link=>link.addEventListener('click',()=>{collection.open=true;}));
  if(location.hash==='#certifications'){collection.open=true;loadPreviews();}
  function updateZoom(){
    image.style.setProperty('--certificate-zoom',zoom);
    modal.querySelector('output').textContent=Math.round(zoom*100)+'%';
    minus.disabled=zoom<=1;plus.disabled=zoom>=2.5;
  }
  collection.querySelectorAll('[data-certificate]').forEach(button=>button.addEventListener('click',()=>{
    opener=button;zoom=1;updateZoom();
    modal.querySelector('h3').textContent=button.dataset.title;
    image.alt=button.dataset.title+' — '+button.dataset.issuer;
    image.src=asset(button.dataset.certificate);
    modal.querySelector('.certificate-dialog-meta').textContent=button.dataset.issuer+' · '+button.dataset.date;
    modal.showModal();viewport.scrollTop=0;viewport.scrollLeft=0;
  }));
  minus.addEventListener('click',()=>{zoom=Math.max(1,zoom-.25);updateZoom();});
  plus.addEventListener('click',()=>{zoom=Math.min(2.5,zoom+.25);updateZoom();});
  modal.querySelector('[data-certificate-close]').addEventListener('click',()=>modal.close());
  modal.addEventListener('click',e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)modal.close();}});
  modal.addEventListener('close',()=>{image.removeAttribute('src');if(opener?.isConnected)opener.focus();});
})();
