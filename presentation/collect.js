// Spine cash foregrounds travel to centre; full canvases provide the PNG fallback.
export async function collectToCentre({result,slots,root,stakeCents,spineSymbols}){
  const target=document.querySelector('#collect-target'),flies=[];
  const origin=root.getBoundingClientRect();
  target.textContent=(result.collectorAmount*stakeCents/100).toFixed(2);
  target.hidden=false;
  try{
    const animated=result.gems.filter(g=>spineSymbols.cells[g.position[0]]?.[g.position[1]]);
    const bounds=document.querySelector('#three').getBoundingClientRect();
    const point={x:((origin.left+origin.width/2-bounds.left)/bounds.width-.5)*660,y:(.5-(origin.top+origin.height/2-bounds.top)/bounds.height)*580};
    flies.push(spineSymbols.playCentreCollector(animated,point));
    for(const [i,gem] of result.gems.filter(g=>!animated.includes(g)).entries()){
      const [c,r]=gem.position,source=slots[c][r+1],bounds=source.getBoundingClientRect();
      const sprite=document.createElement('canvas');sprite.width=source.width;sprite.height=source.height;
      sprite.getContext('2d').drawImage(source,0,0);sprite.className='collect-fly';
      Object.assign(sprite.style,{left:`${bounds.left-origin.left}px`,top:`${bounds.top-origin.top}px`,width:`${bounds.width}px`,height:`${bounds.height}px`});root.appendChild(sprite);
      const dx=origin.width/2-(bounds.left-origin.left+bounds.width/2),dy=origin.height/2-(bounds.top-origin.top+bounds.height/2);
      const animation=sprite.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${dx}px,${dy}px) scale(.15)`,opacity:0}],{delay:i*65,duration:650,easing:'cubic-bezier(.2,.7,.3,1)',fill:'both'});
      flies.push(animation.finished.finally(()=>sprite.remove()));
    }
    await Promise.all(flies);await new Promise(resolve=>setTimeout(resolve,350));
  }finally{target.hidden=true;}
  return {requested:result.gems.length,played:result.gems.length,missing:0};
}
