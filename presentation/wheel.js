// The wheel presents an already selected mode; it never selects a second result.
// Only base C collects; base D displays a black/grey sector and awards scatters only.
export const WHEEL_SEGMENTS={A:{angle:90,label:'WILD',kind:'wild'},B:{angle:22.5,label:'NO AWARD',kind:'blank'},E:{angle:0,label:'CASH COLLECT',kind:'collect'},FD:{angle:0,label:'DOUBLE PRIZES',kind:'double'},C:{angle:0,label:'CASH COLLECT',kind:'collect'},D:{angle:22.5,label:'FEATURE CHANCE',kind:'feature'},FA:{angle:0,label:'CASH COLLECT',kind:'collect'},FB:{angle:22.5,label:'WILD',kind:'wild'},FC:{angle:337.5,label:'NO AWARD',kind:'blank'}};
export const BASE_NO_AWARD_ANGLES=[22.5,45,67.5,112.5,135,157.5,202.5,225,247.5,292.5,315,337.5];
export const WHEEL_STOP_ANGLES={A:[90,180,270],B:BASE_NO_AWARD_ANGLES,C:[0],E:[0],FD:[0],D:BASE_NO_AWARD_ANGLES,FA:[45,90,135,180,225,315],FB:[22.5,67.5,112.5,202.5,247.5,292.5],FC:[157.5,270,337.5]};
export const WHEEL_DURATION_MS=2500;
export function wheelTravel(t){
  if(t>=1)return {progress:1,bounce:0};
  if(t<.84){const q=t/.84;return {progress:q*q*q*(10+q*(-15+6*q)),bounce:0};}
  const q=(t-.84)/.16;
  return {progress:1,bounce:3*Math.cos(q*Math.PI*3)*(1-q)**2};
}
export function tickerFrames(start,end){
  const hits=[];
  // Pegs sit on the boundaries, halfway between the 22.5-degree sector centres.
  let previous=Math.floor((start+11.25)/22.5);
  for(let i=1;i<=240;i++){
    const t=i/240,m=wheelTravel(t),angle=start+(end-start+3)*m.progress+m.bounce-3*(t>=.84?1:0);
    const peg=Math.floor((angle+11.25)/22.5);
    if(peg!==previous){hits.push(t);previous=peg;}
  }
  return Array.from({length:241},(_,i)=>{
    const t=i/240;
    let tilt=0;
    for(const hit of hits){const q=(t-hit)/.045;if(q>=0&&q<1)tilt-=20*Math.sin(Math.PI*q)*(1-q);}
    return {offset:t,transform:`rotate(${Math.max(-25,tilt)}deg)`};
  });
}
export function createWheel({rotor,ticker,random=Math.random}){
  let rotation=0;
  return {async present(record){
    const segment=WHEEL_SEGMENTS[record.mode];if(!segment)throw new Error('Unknown wheel mode');
    const feature=record.isFeature;
    // Choose only artwork matching the already resolved mode; never roll another award.
    const angles=WHEEL_STOP_ANGLES[record.mode];
    const angle=angles.length===1?angles[0]:angles[Math.floor(random()*angles.length)];
    rotor.src=`assets/${feature?'Feature':'Base'}Wheel.png`;
    const blur=rotor.nextElementSibling;
    blur.src=`assets/${feature?'Feature':'Base'}Wheel_blur.png`;
    rotor.dataset.mode=record.mode;rotor.dataset.kind=segment.kind;
    const normalized=((rotation%360)+360)%360,target=(360-angle)%360;
    const next=rotation+360+((target-normalized+360)%360);
    // Short, damped overshoot returns to the exact selected sector centre.
    const frames=Array.from({length:241},(_,i)=>{
      const t=i/240,m=wheelTravel(t);
      const angle=t<.84?rotation+(next-rotation+3)*m.progress:next+m.bounce;
      return {offset:t,transform:`rotate(${angle}deg)`};
    });
    const options={duration:WHEEL_DURATION_MS,easing:'linear'};
    const animation=rotor.animate(frames,{...options,fill:'forwards'});
    const blurAnimation=blur.animate(frames.map(frame=>({...frame,opacity:.35*Math.sin(Math.PI*frame.offset)**2})),options);
    const tickerAnimation=ticker?.animate(tickerFrames(rotation,next),options);
    await animation.finished;rotation=next;rotor.style.transform=`rotate(${rotation}deg)`;animation.cancel();blurAnimation.cancel();tickerAnimation?.cancel();
  }};
}
