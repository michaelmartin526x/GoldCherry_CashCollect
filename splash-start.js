// Register before CDN modules or game assets finish loading.
const splash=document.querySelector('#splash');
function requestStart(){
  if(!splash.classList.contains('active'))return;
  document.documentElement.dataset.startRequested='1';
  if(document.documentElement.dataset.gameReady==='1')dispatchEvent(new Event('splash-request'));
}
splash.addEventListener('pointerup',event=>{if(event.isPrimary!==false)requestStart();});
splash.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();requestStart();}});
